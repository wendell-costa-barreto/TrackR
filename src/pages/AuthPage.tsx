import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

type Mode = "signIn" | "signUp" | "mfa";

export default function AuthPage() {
  const { signIn, signUp, signInWithGoogle, verifyTotp, mfaPending } =
    useAuth();

  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [signUpDone, setSignUpDone] = useState(false);

  // ── If a TOTP challenge is pending (set by useAuth), show MFA screen ──
  const activeMode: Mode = mfaPending ? "mfa" : mode;

  const handleSubmit = async () => {
    setError(null);
    setBusy(true);
    try {
      if (activeMode === "mfa") {
        await verifyTotp(totpCode.replace(/\s/g, ""));
        return; // onAuthStateChange will handle navigation
      }

      if (activeMode === "signUp") {
        await signUp(email, password, fullName);
        setSignUpDone(true);
        return;
      }

      // signIn
      await signIn(email, password);
      // If mfaRequired, useAuth sets mfaPending=true → activeMode flips to "mfa"
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    try {
      await signInWithGoogle();
      // Page will redirect to Google; Supabase handles the callback
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
    }
  };

  // ── Sign-up confirmation screen ────────────────────────────────────────
  if (signUpDone) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center space-y-3">
          <div className="text-4xl">📬</div>
          <h2 className="text-lg font-bold text-white">Check your email</h2>
          <p className="text-sm text-zinc-400">
            We sent a confirmation link to{" "}
            <span className="text-zinc-200 font-medium">{email}</span>. Click it
            to activate your account, then sign in.
          </p>
          <button
            onClick={() => {
              setSignUpDone(false);
              setMode("signIn");
            }}
            className="mt-2 text-xs text-zinc-500 hover:text-zinc-300 underline transition-colors"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  // ── MFA screen ─────────────────────────────────────────────────────────
  if (activeMode === "mfa") {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-white">
              Two-step verification
            </h1>
            <p className="text-sm text-zinc-400">
              Enter the 6-digit code from your authenticator app.
            </p>
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-950/40 border border-red-900/40 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="space-y-3">
            <input
              type="text"
              inputMode="numeric"
              maxLength={7} /* 6 digits + optional space */
              placeholder="123 456"
              value={totpCode}
              onChange={(e) => {
                // Allow digits and a single space; auto-insert space after 3 chars
                const raw = e.target.value.replace(/[^\d]/g, "").slice(0, 6);
                setTotpCode(
                  raw.length > 3 ? `${raw.slice(0, 3)} ${raw.slice(3)}` : raw,
                );
              }}
              autoFocus
              className="w-full bg-zinc-800 border border-zinc-700 text-white text-center tracking-[0.5em] text-xl font-mono rounded-xl px-4 py-3 focus:outline-none focus:border-zinc-500 transition-colors"
            />
            <button
              onClick={handleSubmit}
              disabled={busy || totpCode.replace(/\s/g, "").length < 6}
              className="w-full bg-white text-zinc-950 font-semibold text-sm py-3 rounded-xl hover:bg-zinc-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {busy ? "Verifying…" : "Verify"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Sign In / Sign Up screen ───────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand */}
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            TrackR
          </h1>
          <p className="text-sm text-zinc-500">Your job search, organised.</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-5">
          {/* Tab toggle */}
          <div className="flex bg-zinc-800 rounded-lg p-1 gap-1">
            {(["signIn", "signUp"] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError(null);
                }}
                className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${
                  mode === m
                    ? "bg-zinc-600 text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {m === "signIn" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-950/40 border border-red-900/40 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="space-y-3">
            {/* Google OAuth button */}
            <button
              onClick={handleGoogle}
              disabled={busy}
              className="w-full flex items-center justify-center gap-2.5 bg-zinc-800 border border-zinc-700 hover:border-zinc-600 text-white text-sm font-medium py-2.5 rounded-xl transition-colors disabled:opacity-40"
            >
              {/* Google "G" logo — inline SVG, no external deps */}
              <svg className="w-4 h-4" viewBox="0 0 48 48" aria-hidden>
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
                <path fill="none" d="M0 0h48v48H0z" />
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-zinc-800" />
              <span className="text-[11px] text-zinc-600 font-medium">or</span>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>

            {/* Full name — sign-up only */}
            {mode === "signUp" && (
              <div className="space-y-1">
                <label className="text-xs text-zinc-400 font-medium">
                  Full name
                </label>
                <input
                  type="text"
                  autoComplete="name"
                  placeholder="Jane Smith"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-sm text-white placeholder:text-zinc-600 rounded-xl px-3 py-2.5 focus:outline-none focus:border-zinc-500 transition-colors"
                />
              </div>
            )}

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs text-zinc-400 font-medium">Email</label>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-sm text-white placeholder:text-zinc-600 rounded-xl px-3 py-2.5 focus:outline-none focus:border-zinc-500 transition-colors"
              />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs text-zinc-400 font-medium">
                Password
              </label>
              <input
                type="password"
                autoComplete={
                  mode === "signIn" ? "current-password" : "new-password"
                }
                placeholder={
                  mode === "signUp" ? "At least 8 characters" : "••••••••"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                className="w-full bg-zinc-800 border border-zinc-700 text-sm text-white placeholder:text-zinc-600 rounded-xl px-3 py-2.5 focus:outline-none focus:border-zinc-500 transition-colors"
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={busy}
              className="w-full bg-white text-zinc-950 font-semibold text-sm py-2.5 rounded-xl hover:bg-zinc-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {busy
                ? mode === "signIn"
                  ? "Signing in…"
                  : "Creating account…"
                : mode === "signIn"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-zinc-600">
          By continuing you agree to our{" "}
          <a
            href="/terms"
            className="underline hover:text-zinc-400 transition-colors"
          >
            Terms
          </a>{" "}
          and{" "}
          <a
            href="/privacy"
            className="underline hover:text-zinc-400 transition-colors"
          >
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}
