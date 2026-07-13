"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Prevents Next.js from attempting to statically prerender this route at
// build time. This page constructs a Supabase client, and static
// prerendering runs the component on the server during `next build` —
// forcing dynamic rendering means that only ever happens per-request,
// after real runtime environment variables are guaranteed to be present.
export const dynamic = "force-dynamic";

type Mode = "sign-in" | "sign-up";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    try {
      // Created here, at the moment of submission, rather than during
      // render — this only ever runs in the browser in response to a
      // real user action, never during any server-side render pass.
      const supabase = createClient();

      if (mode === "sign-in") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        router.push("/dashboard");
        router.refresh();
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        setNotice(
          "Account created. If email confirmation is enabled for this project, check your inbox before signing in."
        );
        setMode("sign-in");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-brass-600 mb-2">
            Momentum Atelier
          </p>
          <h1 className="font-display text-3xl italic text-ink-950">Client Studio</h1>
          <p className="mt-2 text-sm text-ink-600">
            Sign in to manage companies, contacts, and the pipeline.
          </p>
        </div>

        <div className="panel p-6">
          <div className="flex mb-6 rounded-sm2 border border-ink-900/10 p-1 bg-ink-900/[0.03]">
            <button
              type="button"
              onClick={() => setMode("sign-in")}
              className={`flex-1 rounded-[4px] py-1.5 text-sm font-medium transition-colors ${
                mode === "sign-in"
                  ? "bg-parchment-50 text-ink-950 shadow-sm"
                  : "text-ink-600 hover:text-ink-800"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode("sign-up")}
              className={`flex-1 rounded-[4px] py-1.5 text-sm font-medium transition-colors ${
                mode === "sign-up"
                  ? "bg-parchment-50 text-ink-950 shadow-sm"
                  : "text-ink-600 hover:text-ink-800"
              }`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="field-label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                className="field-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@studio.com"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                className="field-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-clay-600 bg-clay-500/10 border border-clay-500/30 rounded-sm2 px-3 py-2">
                {error}
              </p>
            )}
            {notice && (
              <p className="text-sm text-ink-800 bg-brass-400/15 border border-brass-500/30 rounded-sm2 px-3 py-2">
                {notice}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? "Please wait…" : mode === "sign-in" ? "Sign in" : "Create account"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-ink-500">
          Access is limited to invited members of Momentum Atelier.
        </p>
      </div>
    </div>
  );
}
