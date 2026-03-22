"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong, partner.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative">
      {/* Background texture */}
      <div className="fixed inset-0 opacity-[0.015] pointer-events-none"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />

      {/* Header */}
      <div className="text-center mb-10">
        <div className="text-6xl mb-4">🤠</div>
        <h1 className="font-display text-5xl md:text-6xl uppercase tracking-widest text-parchment-200 drop-shadow-lg mb-2">
          The Homestead
        </h1>
        <p className="font-body text-parchment-500 text-sm tracking-widest uppercase">
          Where habits become bounties
        </p>
      </div>

      {/* Card */}
      <div className="wanted-poster w-full max-w-md p-8 relative">
        <div className="text-center mb-6 border-b-2 border-saddle-700 pb-4">
          <p className="font-display text-xs uppercase tracking-widest text-saddle-600 mb-1">Wanted: A Pioneer</p>
          <h2 className="font-display text-3xl uppercase tracking-wider text-dirt">Sign In</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="field-label !text-saddle-700">Your Handle</label>
            <input
              className="field-input"
              type="text"
              placeholder="name"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="field-label !text-saddle-700">Secret Code</label>
            <input
              className="field-input"
              type="password"
              placeholder="••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-dusk font-body text-sm border border-dusk/50 bg-red-950/20 px-3 py-2">
              ⚠️ {error}
            </p>
          )}

          <button type="submit" disabled={loading}
            className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? "Saddlin' up…" : "Ride In →"}
          </button>
        </form>

        <p className="text-center mt-6 text-saddle-600 font-body text-sm">
          New to the homestead?{" "}
          <Link href="/auth/signup" className="text-saddle-800 underline hover:text-dirt">
            Stake your claim
          </Link>
        </p>
      </div>
    </div>
  );
}
