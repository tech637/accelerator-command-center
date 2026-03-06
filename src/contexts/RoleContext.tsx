import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export type UserRole = "admin" | "program_manager" | "mentor";

interface RoleContextType {
  role: UserRole;
  isLoading: boolean;
  canAccess: (requiredRoles: UserRole[]) => boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { workspaceId } = useWorkspace();
  const [role, setRole] = useState<UserRole>("mentor");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRole = async () => {
      if (!isAuthenticated || !user || !workspaceId || !isSupabaseConfigured() || !supabase) {
        setRole("mentor");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("workspace_id", workspaceId)
        .maybeSingle();

      const nextRole = (data?.role as UserRole | undefined) ?? "mentor";
      setRole(nextRole);
      setIsLoading(false);
    };

    loadRole();
  }, [isAuthenticated, user, workspaceId]);

  const canAccess = (requiredRoles: UserRole[]) => requiredRoles.includes(role);
  const value = useMemo(() => ({ role, isLoading, canAccess }), [role, isLoading]);

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
};
