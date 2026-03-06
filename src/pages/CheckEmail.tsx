import { Link, useLocation } from "react-router-dom";
import { Mail } from "lucide-react";

export default function CheckEmail() {
  const location = useLocation();
  const email = (location.state as { email?: string })?.email ?? "your email";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center rounded-lg border bg-card p-8 shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-accent mb-4">
            <Mail className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Check your email</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We sent a confirmation link to <strong>{email}</strong>. Please verify, then come back and login.
          </p>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          <Link to="/" className="text-accent hover:underline">← Back to home</Link>
          {" · "}
          <Link to="/login" className="text-accent hover:underline font-medium">Log in</Link>
        </p>
      </div>
    </div>
  );
}
