import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface Workspace {
  id: string;
  name: string;
  organization: string | null;
}

interface WorkspaceContextType {
  workspaces: Workspace[];
  workspaceId: string | null;
  setWorkspaceId: (id: string) => void;
  isLoading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);
const WORKSPACE_KEY = "eera_active_workspace";

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceId, setWorkspaceIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setWorkspaceId = (id: string) => {
    setWorkspaceIdState(id);
    localStorage.setItem(WORKSPACE_KEY, id);
  };

  useEffect(() => {
    const load = async () => {
      if (!isAuthenticated || !user || !isSupabaseConfigured() || !supabase) {
        setWorkspaces([]);
        setWorkspaceIdState(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      const ensureProfile = async () => {
        const normalizedEmail = user.email.trim().toLowerCase();
        await supabase.from("profiles").upsert({
          id: user.id,
          email: normalizedEmail,
          full_name: user.name ?? null,
        });
      };

      const activateInvites = async () => {
        const normalizedEmail = user.email.trim().toLowerCase();
        const { data: invites, error } = await supabase
          .from("team_members")
          .select("workspace_id, role")
          .eq("email", normalizedEmail);
        if (error) throw error;
        if (!invites?.length) return;

        await Promise.all(
          invites.map(async (invite) => {
            const { error: roleError } = await supabase.from("user_roles").upsert(
              {
                user_id: user.id,
                workspace_id: invite.workspace_id,
                role: invite.role,
              },
              { onConflict: "user_id,workspace_id" },
            );
            if (roleError) throw roleError;

            const { error: memberError } = await supabase
              .from("team_members")
              .update({ status: "active", name: user.name ?? normalizedEmail.split("@")[0] })
              .eq("workspace_id", invite.workspace_id)
              .eq("email", normalizedEmail);
            if (memberError) throw memberError;
          }),
        );
      };

      const loadMemberships = async () => {
        const { data, error } = await supabase
          .from("user_roles")
          .select("workspace_id, workspaces(id, name, organization)")
          .eq("user_id", user.id);
        if (error) throw error;

        return (data ?? [])
          .map((row) => row.workspaces)
          .filter(Boolean)
          .map((ws) => ({
            id: ws!.id,
            name: ws!.name,
            organization: ws!.organization,
          }));
      };

      const bootstrapWorkspace = async () => {
        const { data: ws, error: wsErr } = await supabase
          .from("workspaces")
          .insert({
            name: `${user.name ?? "My"} Workspace`,
            organization: "EERA",
            created_by: user.id,
          })
          .select("id, name, organization")
          .single();
        if (wsErr) throw wsErr;

        const { error: roleErr } = await supabase.from("user_roles").insert({
          user_id: user.id,
          workspace_id: ws.id,
          role: "admin",
        });
        if (roleErr) throw roleErr;

        await supabase
          .from("team_members")
          .upsert(
            {
              workspace_id: ws.id,
              email: user.email.trim().toLowerCase(),
              name: user.name ?? user.email,
              role: "admin",
              status: "active",
            },
            { onConflict: "workspace_id,email" },
          );
      };

      try {
        await ensureProfile();
        await activateInvites();
        let next = await loadMemberships();
        if (next.length === 0) {
          await bootstrapWorkspace();
          next = await loadMemberships();
        }

        setWorkspaces(next);
        const stored = localStorage.getItem(WORKSPACE_KEY);
        const selected = stored && next.some((ws) => ws.id === stored) ? stored : next[0]?.id ?? null;
        setWorkspaceIdState(selected);
        if (selected) {
          localStorage.setItem(WORKSPACE_KEY, selected);
        }
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [isAuthenticated, user]);

  const value = useMemo(
    () => ({
      workspaces,
      workspaceId,
      setWorkspaceId,
      isLoading,
    }),
    [workspaces, workspaceId, isLoading],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};

export const useWorkspace = () => {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
};
