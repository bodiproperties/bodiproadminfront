"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.replace("/admin");
    } catch (e: any) {
      setError(e.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* LEFT — architectural hero (matches the public site) */}
      <div className="relative hidden overflow-hidden bg-neutral-900 lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1600&h=2000&fit=crop"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40" />

        {/* wordmark */}
        <div className="absolute left-0 top-0 flex items-center gap-3 p-12">
          <span className="h-6 w-px bg-[#F58220]" />
          <p className="text-sm font-semibold tracking-tight text-white">
            BODI PROPERTIES
          </p>
        </div>

        {/* tagline */}
        <div className="absolute bottom-0 left-0 p-12 text-white">
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#F58220]">
            Studio Access
          </p>
          <h2 className="mt-6 max-w-md text-4xl font-extralight leading-tight">
            Architecture that balances form, light and emotion.
          </h2>
          <p className="mt-8 text-[10px] uppercase tracking-[0.3em] text-white/50">
            Content Studio
          </p>
        </div>
      </div>

      {/* RIGHT — sign in */}
      <div className="flex items-center justify-center bg-white px-8 py-16">
        <div className="w-full max-w-sm">
          {/* mobile wordmark */}
          <div className="mb-12 flex items-center gap-3 lg:hidden">
            <span className="h-6 w-px bg-[#F58220]" />
            <p className="text-sm font-semibold tracking-tight text-neutral-900">
              BODI PROPERTIES
            </p>
          </div>

          <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400">
            Studio Admin
          </p>
          <h1 className="mt-3 text-3xl font-extralight tracking-tight text-neutral-900">
            Sign in
          </h1>
          <p className="mt-3 text-sm text-neutral-500">
            Manage projects, news and home page images.
          </p>

          <div className="mt-10 space-y-7">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.25em] text-neutral-400">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                className="mt-2 w-full border-0 border-b border-neutral-300 bg-transparent py-2 text-sm text-neutral-900 transition-colors placeholder:text-neutral-300 focus:border-neutral-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.25em] text-neutral-400">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                className="mt-2 w-full border-0 border-b border-neutral-300 bg-transparent py-2 text-sm text-neutral-900 transition-colors placeholder:text-neutral-300 focus:border-neutral-900 focus:outline-none"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              onClick={submit}
              disabled={loading}
              className="w-full bg-neutral-900 py-4 text-xs uppercase tracking-[0.25em] text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}