import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

type Mode = "login" | "signup";

export default function AuthPage() {
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false); // post-signup confirm message

  const toggle = () => {
    setMode((m) => (m === "login" ? "signup" : "login"));
    setError(null);
    setDone(false);
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        await signUp(email, password, fullName);
        setDone(true); // Supabase sends a confirmation email by default
      } else {
        await signIn(email, password);
        // useAuth listener will update user → App will render Dashboard
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div
      className="min-h-screen bg-zinc-950 text-white"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Nav */}
      <nav className="w-full h-20 flex justify-between items-center px-12 border-b border-zinc-800/60">
        <span className="text-3xl font-bold tracking-tight">TrackR</span>
        <button
          onClick={toggle}
          className="text-sm text-zinc-500 hover:text-white transition-colors"
        >
          {mode === "login" ? (
            <>
              No account?{" "}
              <span className="text-zinc-300 underline underline-offset-2">
                Sign up
              </span>
            </>
          ) : (
            <>
              Have an account?{" "}
              <span className="text-zinc-300 underline underline-offset-2">
                Sign in
              </span>
            </>
          )}
        </button>
      </nav>

      {/* Body */}
      <div className="flex" style={{ height: "calc(100vh - 80px)" }}>
        {/* Left panel */}
        <div className="w-[42%] flex flex-col justify-between px-12 py-10 border-r border-zinc-800">
          <h2 className="text-[clamp(48px,5.5vw,72px)] font-extrabold leading-[0.88] tracking-[-0.04em] text-white">
            {mode === "login" ? (
              <>
                Do
                <br />
                more<span className="text-zinc-700">.</span>
                <br />
                Miss
                <br />
                less<span className="text-zinc-700">.</span>
              </>
            ) : (
              <>
                Start
                <br />
                fresh<span className="text-zinc-700">.</span>
                <br />
                Stay
                <br />
                sharp<span className="text-zinc-700">.</span>
              </>
            )}
          </h2>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-600">
              TrackR
            </span>
            <span className="text-xs text-zinc-600 leading-relaxed">
              {mode === "login"
                ? "Your goals,\nfinally under control."
                : "Build habits that stick.\nTrack progress that matters."}
            </span>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="flex-1 flex flex-col justify-center px-16 gap-8">
          {done ? (
            <div className="flex flex-col gap-4 max-w-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-900/60 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">
                Check your email.
              </h1>
              <p className="text-sm text-zinc-500 leading-relaxed">
                We sent a confirmation link to{" "}
                <span className="text-zinc-300">{email}</span>. Click it to
                activate your account, then come back to sign in.
              </p>
              <button
                onClick={toggle}
                className="text-xs text-zinc-500 hover:text-zinc-300 underline underline-offset-2 transition-colors text-left"
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">
                  {mode === "login" ? "Welcome back." : "Create account."}
                </h1>
                <p className="text-sm text-zinc-500 mt-1.5">
                  {mode === "login"
                    ? "Log into your account"
                    : "Start tracking what matters"}
                </p>
              </div>

              <div className="flex flex-col gap-4 max-w-sm">
                {mode === "signup" && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      onKeyDown={handleKey}
                      placeholder="Jane Doe"
                      className="bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 placeholder:text-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:border-zinc-600 transition-colors"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="you@example.com"
                    className="bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 placeholder:text-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:border-zinc-600 transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="••••••••"
                    className="bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 placeholder:text-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:border-zinc-600 transition-colors"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-400 bg-red-950/40 border border-red-900/40 rounded-lg px-4 py-3">
                    {error}
                  </p>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={
                    loading ||
                    !email ||
                    !password ||
                    (mode === "signup" && !fullName)
                  }
                  className="w-full bg-white text-zinc-950 text-sm font-bold py-3 rounded-lg hover:bg-zinc-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {loading
                    ? "Please wait…"
                    : mode === "login"
                      ? "Sign in"
                      : "Create account"}
                </button>
              </div>

              <div className="flex flex-col gap-2.5 -mt-2">
                {mode === "login" && (
                  <button className="text-xs text-zinc-500 hover:text-zinc-300 underline underline-offset-2 transition-colors text-left">
                    Forgot your password?
                  </button>
                )}
                <p className="text-xs text-zinc-600">
                  {mode === "login"
                    ? "Don't have an account? "
                    : "Already have an account? "}
                  <button
                    onClick={toggle}
                    className="text-zinc-400 hover:text-white underline underline-offset-2 transition-colors"
                  >
                    {mode === "login" ? "Create one here." : "Sign in here."}
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
