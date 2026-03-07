import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

type AcceptState = "loading" | "success" | "error";

export default function InviteAccept() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<AcceptState>("loading");
  const [message, setMessage] = useState("Verifying your invite...");

  const workspaceId = useMemo(() => searchParams.get("workspace_id") ?? "", [searchParams]);
  const invitedEmail = useMemo(() => (searchParams.get("email") ?? "").trim().toLowerCase(), [searchParams]);

  useEffect(() => {
    const run = async () => {
      if (!isSupabaseConfigured() || !supabase) {
        setState("error");
        setMessage("Supabase is not configured.");
        return;
      }

      if (!workspaceId || !invitedEmail) {
        setState("error");
        setMessage("Invite link is invalid. Missing workspace or email.");
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user?.email) {
        setState("error");
        setMessage(`Please sign in using ${invitedEmail} to accept this invite.`);
        return;
      }

      const sessionEmail = session.user.email.trim().toLowerCase();
      if (sessionEmail !== invitedEmail) {
        setState("error");
        setMessage(`This invite was sent to ${invitedEmail}. You are signed in as ${sessionEmail}.`);
        return;
      }

      const { data, error } = await supabase.functions.invoke("accept-invite", {
        body: { workspaceId, invitedEmail },
      });

      if (error) {
        setState("error");
        setMessage(error.message || "Failed to accept invite.");
        return;
      }

      const payload = data as { ok?: boolean; error?: string } | null;
      if (payload?.error) {
        setState("error");
        setMessage(payload.error);
        return;
      }

      setState("success");
      setMessage("Invite accepted. Taking you to your dashboard...");
      setTimeout(() => navigate("/accelerator/dashboard", { replace: true }), 1200);
    };

    run();
  }, [invitedEmail, navigate, workspaceId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center space-y-5">
        {state === "loading" && (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-accent mx-auto" />
            <h1 className="text-2xl font-semibold">Accepting invite...</h1>
            <p className="text-sm text-muted-foreground">{message}</p>
          </>
        )}

        {state === "success" && (
          <>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-accent mx-auto">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-semibold">Invite accepted</h1>
            <p className="text-sm text-muted-foreground">{message}</p>
            <Button onClick={() => navigate("/accelerator/dashboard")}>Go to Dashboard</Button>
          </>
        )}

        {state === "error" && (
          <>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive mx-auto">
              <XCircle className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-semibold">Invite could not be accepted</h1>
            <p className="text-sm text-muted-foreground">{message}</p>
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" onClick={() => navigate("/login")}>
                Sign in
              </Button>
              <Button onClick={() => navigate("/")}>Go home</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
