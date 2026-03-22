"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function SignupPage() {
  const { signup } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (role === "student" && !joinCode.trim()) {
      setError("You need a join code from your Sheriff to sign up.");
      return;
    }
    setLoading(true);
    try {
      await signup(username, password, role, joinCode.trim().toUpperCase());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong, partner.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative">
      <div className="fixed inset-0 opacity-[0.015] pointer-events-none"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />

      <div className="text-center mb-10">
        <div className="text-6xl mb-4">🌵</div>
        <h1 className="font-display text-5xl md:text-6xl uppercase tracking-widest text-parchment-200 drop-shadow-lg mb-2">
          The Homestead
        </h1>
        <p className="font-body text-parchment-500 text-sm tracking-widest uppercase">
          Stake your claim on the frontier
        </p>
      </div>

      <div className="wanted-poster w-full max-w-md p-8">
        <div className="text-center mb-6 border-b-2 border-saddle-700 pb-4">
          <p className="font-display text-xs uppercase tracking-widest text-saddle-600 mb-1">New Pioneer</p>
          <h2 className="font-display text-3xl uppercase tracking-wider text-dirt">Join Up</h2>
        </div>

        {/* Role picker */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {(["student", "teacher"] as const).map(r => (
            <button key={r} type="button"
              onClick={() => setRole(r)}
              className={`p-4 border-2 transition-all font-display uppercase tracking-widest text-sm text-center ${
                role === r
                  ? "border-dirt bg-saddle-200 text-dirt shadow-[3px_3px_0_#2c1a0e]"
                  : "border-saddle-500 bg-parchment-100 text-saddle-600 hover:border-saddle-700"
              }`}>
              <div className="text-3xl mb-1">{r === "teacher" ? "🔰" : "🤠"}</div>
              <div>{r === "teacher" ? "Sheriff" : "Cowboy"}</div>
              <div className="text-xs font-body normal-case tracking-normal mt-0.5 opacity-70">
                {r === "teacher" ? "(Parent/Teacher)" : "(Kid/Student)"}
              </div>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="field-label !text-saddle-700">Your Handle</label>
            <input className="field-input" type="text" placeholder="pioneer_name"
              value={username} onChange={e => setUsername(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="field-label !text-saddle-700">Secret Code</label>
            <input className="field-input" type="password" placeholder="4+ characters"
              value={password} onChange={e => setPassword(e.target.value)} />
          </div>

          {/* Join code — only for cowboys */}
          {role === "student" && (
            <div>
              <label className="field-label !text-saddle-700">Sheriff's Join Code</label>
              <input
                className="field-input uppercase tracking-widest text-center font-display text-lg"
                type="text"
                placeholder="ABC123"
                maxLength={6}
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
              />
              <p className="font-body text-xs text-saddle-500 mt-1">
                Ask your parent or teacher for their 6-character code.
              </p>
            </div>
          )}

          {error && (
            <p className="text-dusk font-body text-sm border border-dusk/50 bg-red-950/20 px-3 py-2">
              ⚠️ {error}
            </p>
          )}

          <button type="submit" disabled={loading}
            className="btn-primary w-full justify-center disabled:opacity-50">
            {loading ? "Ridin' in…" : `Stake Claim as ${role === "teacher" ? "Sheriff" : "Cowboy"} →`}
          </button>
        </form>

        <p className="text-center mt-6 text-saddle-600 font-body text-sm">
          Already a pioneer?{" "}
          <Link href="/auth/login" className="text-saddle-800 underline hover:text-dirt">
            Ride back in
          </Link>
        </p>
      </div>
    </div>
  );
}
