import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

type FormData = {
  name?: string;
  email: string;
  password: string;
};

export default function LoginForm({ isSignUp }: { isSignUp: boolean }) {
  const [form, setForm] = useState<FormData>({ email: "", password: "" });
  const [focused, setFocused] = useState<string | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(form);
  };

  const field = (
    label: string,
    name: keyof FormData,
    type: string,
    placeholder: string,
  ) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-semibold tracking-[0.12em] uppercase text-zinc-500">
        {label}
      </label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={form[name] || ""}
        onChange={handleChange}
        onFocus={() => setFocused(name)}
        onBlur={() => setFocused(null)}
        className={`
          w-full px-4 py-3 rounded-lg text-sm bg-zinc-800 text-white
          placeholder-zinc-600 border transition-all duration-150 outline-none
          ${focused === name ? "border-zinc-500" : "border-zinc-700 hover:border-zinc-600"}
        `}
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      {isSignUp && field("Full name", "name", "text", "Jane Doe")}
      {field("Email", "email", "email", "you@example.com")}
      {field("Password", "password", "password", "••••••••")}
      <button
        type="submit"
        className="mt-1 w-full py-3 rounded-lg bg-white text-zinc-900 text-sm font-semibold tracking-wide hover:bg-zinc-100 active:scale-[0.98] transition-all duration-150"
      >
        {isSignUp ? "Create account" : "Sign in"}
      </button>
    </form>
  );
}
