import LoginForm from "../components/ui/Input";

export default function LoginPage() {
  return (
    <div
      className="min-h-screen bg-zinc-950 text-white"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Nav */}
      <nav className="w-full h-20 flex justify-center items-center border-b border-zinc-800/60">
        <div className="w-full h-full flex justify-between items-center px-12">
          <span className="text-3xl font-bold tracking-tight">TrackR</span>
          <a
            href="/signup"
            className="text-sm text-zinc-500 hover:text-white transition-colors"
          >
            No account?{" "}
            <span className="text-zinc-300 underline underline-offset-2">
              Sign up
            </span>
          </a>
        </div>
      </nav>

      {/* Main — two columns, full height */}
      <div className="flex" style={{ height: "calc(100vh - 80px)" }}>
        {/* Left — typography panel */}
        <div className="w-[42%] flex flex-col justify-between px-12 py-10 border-r border-zinc-800">
          <h2 className="text-[clamp(48px,5.5vw,72px)] font-extrabold leading-[0.88] tracking-[-0.04em] text-white">
            Do
            <br />
            more<span className="text-zinc-700">.</span>
            <br />
            Miss
            <br />
            less<span className="text-zinc-700">.</span>
          </h2>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-600">
              TrackR
            </span>
            <span className="text-xs text-zinc-600 leading-relaxed">
              Your goals,
              <br />
              finally under control.
            </span>
          </div>
        </div>

        {/* Right — form */}
        <div className="flex-1 flex flex-col justify-center px-16 gap-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Welcome back.
            </h1>
            <p className="text-sm text-zinc-500 mt-1.5">
              Log into your account
            </p>
          </div>

          <LoginForm isSignUp={false} />

          <div className="flex flex-col gap-2.5 -mt-2">
            <a
              href="/forgot"
              className="text-xs text-zinc-500 hover:text-zinc-300 underline underline-offset-2 transition-colors"
            >
              Forgot your password?
            </a>
            <p className="text-xs text-zinc-600">
              Don't have an account?{" "}
              <a
                href="/signup"
                className="text-zinc-400 hover:text-white underline underline-offset-2 transition-colors"
              >
                Create one here.
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
