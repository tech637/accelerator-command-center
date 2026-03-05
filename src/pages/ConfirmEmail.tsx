import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Zap, Loader2, CheckCircle2 } from "lucide-react";

export default function ConfirmEmail() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const handleConfirmation = async () => {
      if (!isSupabaseConfigured() || !supabase) {
        setStatus("error");
        return;
      }
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          setStatus("error");
          return;
        }
        if (session) {
          setStatus("success");
          setTimeout(() => navigate("/accelerator/dashboard", { replace: true }), 1500);
        } else {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");
          if (accessToken && refreshToken) {
            await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
            setStatus("success");
            window.history.replaceState(null, "", window.location.pathname);
            setTimeout(() => navigate("/accelerator/dashboard", { replace: true }), 1500);
          } else {
            setStatus("error");
          }
        }
      } catch {
        setStatus("error");
      }
    };
    handleConfirmation();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent mx-auto">
          <Zap className="h-5 w-5 text-accent-foreground" />
        </div>
        {status === "loading" && (
          <>
            <h1 className="text-2xl font-bold text-foreground">Confirming your email...</h1>
            <Loader2 className="h-10 w-10 animate-spin text-accent mx-auto" />
          </>
        )}
        {status === "success" && (
          <>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-accent mx-auto">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Email confirmed!</h1>
            <p className="text-muted-foreground">Redirecting you to the dashboard...</p>
          </>
        )}
        {status === "error" && (
          <>
            <h1 className="text-2xl font-bold text-foreground">Confirmation failed</h1>
            <p className="text-muted-foreground">The link may have expired. Please try signing up again.</p>
            <button
              onClick={() => navigate("/signup")}
              className="text-accent hover:underline font-medium"
            >
              Go to sign up
            </button>
          </>
        )}
      </div>
    </div>
  );
}
