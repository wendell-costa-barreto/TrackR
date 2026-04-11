import LoginForm from "../components/ui/Input";

export default function SignUpPage() {
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
            href="/login"
            className="text-sm text-zinc-500 hover:text-white transition-colors"
          >
            Have an account?{" "}
            <span className="text-zinc-300 underline underline-offset-2">
              Sign in
            </span>
          </a>
        </div>
      </nav>

      {/* Main — two columns, full height */}
      <div className="flex" style={{ height: "calc(100vh - 80px)" }}>
        {/* Left — typography panel (different copy for sign up) */}
        <div className="w-[42%] flex flex-col justify-between px-12 py-10 border-r border-zinc-800">
          <h2 className="text-[clamp(48px,5.5vw,72px)] font-extrabold leading-[0.88] tracking-[-0.04em] text-white">
            Start
            <br />
            fresh<span className="text-zinc-700">.</span>
            <br />
            Stay
            <br />
            sharp<span className="text-zinc-700">.</span>
          </h2>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-600">
              TrackR
            </span>
            <span className="text-xs text-zinc-600 leading-relaxed">
              Build habits that stick.
              <br />
              Track progress that matters.
            </span>
          </div>
        </div>

        {/* Right — form */}
        <div className="flex-1 flex flex-col justify-center px-16 gap-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Create account.
            </h1>
            <p className="text-sm text-zinc-500 mt-1.5">
              Start tracking what matters
            </p>
          </div>

          <LoginForm isSignUp={true} />

          <div className="-mt-2">
            <p className="text-xs text-zinc-600">
              Already have an account?{" "}
              <a
                href="/login"
                className="text-zinc-400 hover:text-white underline underline-offset-2 transition-colors"
              >
                Sign in here.
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
