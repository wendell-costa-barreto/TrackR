import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function AuthCallback() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase JS v2 automatically reads the `code` param from the URL
        // and exchanges it for a session via PKCE.
        const { error } = await supabase.auth.exchangeCodeForSession(
          window.location.href,
        );

        if (error) {
          setError(error.message);
          return;
        }

        // Redirect to the dashboard (or wherever you want post-login)
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
        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
        <span className="text-sm">Completing sign-in…</span>
      </div>
    </div>
  );
}
