import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function AuthCallback() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          setError(error.message);
          return;
        }

        if (!data.session) {
          setError("No session found after sign-in.");
          return;
        }

        window.location.replace("/dashboard");
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Authentication failed.");
      }
    };

    handleCallback();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <p className="text-red-400 text-sm">{error}</p>
          <a
            href="/auth"
            className="text-xs text-zinc-500 hover:text-zinc-300 underline"
          >
            Back to sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-zinc-500">
        <span className="text-sm">Completing sign-in…</span>
      </div>
    </div>
  );
}
