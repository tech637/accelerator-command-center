import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<{ needsEmailConfirmation: boolean }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    const initAuth = async () => {
      if (!isSupabaseConfigured() || !supabase) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user?.email) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.email.split("@")[0],
        });
      } else {
        setUser(null);
      }

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        if (nextSession?.user?.email) {
          setUser({
            id: nextSession.user.id,
            email: nextSession.user.email,
            name: nextSession.user.email.split("@")[0],
          });
        } else {
          setUser(null);
        }
      });
      unsubscribe = () => subscription.unsubscribe();

      setIsLoading(false);
    };
    initAuth();
    return () => unsubscribe?.();
  }, []);

  const login = async (email: string, password: string) => {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error("Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.user?.email) {
      setUser({
        id: data.user.id,
        email: data.user.email,
        name: data.user.email.split("@")[0],
      });
    }
  };

  const signup = async (email: string, password: string): Promise<{ needsEmailConfirmation: boolean }> => {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error("Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;

    return { needsEmailConfirmation: true };
  };

  const logout = async () => {
    if (isSupabaseConfigured() && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
