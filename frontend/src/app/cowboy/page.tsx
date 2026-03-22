"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api, BountyWithStatus } from "@/lib/api";
import { calculateTitle, ATTRIBUTE_META } from "@/lib/titles";

export default function CowboyHome() {
  const { user } = useAuth();
  const [bounties, setBounties] = useState<BountyWithStatus[]>([]);

  useEffect(() => {
    api.bounties.list().then(setBounties).catch(() => {});
    const interval = setInterval(() => {
      api.bounties.list().then(setBounties).catch(() => {});
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!user) return null;

  const title = calculateTitle(user.gritPoints, user.laborPoints, user.wisdomPoints, user.honorPoints, user.xp);
  const todayTotal = bounties.filter(b => b.isDueToday || b.scheduleType === "none").length;
  const todayDone = bounties.filter(b => b.claimStatus === "approved" && (b.isDueToday || b.scheduleType === "none")).length;
  const pending = bounties.filter(b => b.claimStatus === "pending").length;
  const progressPct = todayTotal > 0 ? Math.round((todayDone / todayTotal) * 100) : 0;

  const topAttr = (["grit","labor","wisdom","honor"] as const).reduce((best, a) =>
    user[`${a}Points` as keyof typeof user] as number > (user[`${best}Points` as keyof typeof user] as number) ? a : best,
    "grit" as "grit"|"labor"|"wisdom"|"honor"
  );

  return (
    <div className="space-y-10">
      {/* Hero greeting */}
      <div className="relative border-b border-saddle-900 pb-8">
        <p className="font-display text-xs uppercase tracking-widest text-saddle-500 mb-1">The Homestead</p>
        <h1 className="font-display text-4xl md:text-5xl uppercase tracking-widest text-parchment-200 mb-1">
          Howdy, {user.username}
        </h1>
        <p className="font-body text-parchment-600">{title}</p>

        {/* Streak warning */}
        {user.streakPenalty && (
          <div className="mt-4 flex items-start gap-3 border-2 border-dusk/50 bg-red-950/20 px-4 py-3 max-w-lg">
            <span className="text-xl shrink-0">⚠️</span>
            <div>
              <p className="font-display text-sm uppercase tracking-wider text-dusk">Cracked Grit!</p>
              <p className="font-body text-xs text-parchment-600">
                Gold rewards are at 0.5× until you complete 3 full days.
                Rebuilt: {user.streakRebuildCount}/3 days.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Gold", value: user.gold, emoji: "💰", color: "text-gold" },
          { label: "Total XP", value: user.xp, emoji: "⭐", color: "text-parchment-300" },
          { label: "Today Done", value: `${todayDone}/${todayTotal}`, emoji: "✅", color: "text-sage" },
          { label: "Pending Review", value: pending, emoji: "⏳", color: "text-amber-400" },
        ].map(s => (
          <div key={s.label} className="ledger-panel p-5 text-center">
            <div className="text-3xl mb-1">{s.emoji}</div>
            <div className={`font-display text-2xl ${s.color}`}>{s.value}</div>
            <div className="font-body text-parchment-600 text-xs uppercase tracking-widest">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Today's progress */}
      {todayTotal > 0 && (
        <div className="ledger-panel p-6">
          <div className="flex justify-between items-center mb-3">
            <p className="font-display text-sm uppercase tracking-widest text-parchment-400">Today's Progress</p>
            <p className="font-display text-sm text-parchment-300">{progressPct}%</p>
          </div>
          <div className="w-full h-4 rounded-full overflow-hidden border border-saddle-800" style={{ background: "#1a0a04" }}>
            <div
              className="h-full transition-all duration-700"
              style={{ width: `${progressPct}%`, background: "linear-gradient(to right, #a86820, #d4a017)" }}
            />
          </div>
          {user.gritMeter === 100 && !user.streakPenalty && (
            <p className="font-display text-xs uppercase tracking-widest text-gold mt-2 text-center animate-flicker">
              🔥 Gold Rush Active — earning 2× gold on all approvals!
            </p>
          )}
          {progressPct === 100 && user.streakPenalty && (
            <p className="font-display text-xs uppercase tracking-widest text-amber-500 mt-2 text-center">
              ✅ All submitted — {3 - user.streakRebuildCount} more day(s) to recover Grit
            </p>
          )}
        </div>
      )}

      {/* Attribute progress */}
      <div>
        <h2 className="font-display text-xl uppercase tracking-widest text-parchment-400 mb-4">Your Attributes</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(["grit","labor","wisdom","honor"] as const).map(attr => {
            const meta = ATTRIBUTE_META[attr];
            const pts = user[`${attr}Points` as keyof typeof user] as number;
            const isTop = attr === topAttr && pts > 0;
            return (
              <div key={attr} className={`ledger-panel p-4 text-center relative ${isTop ? "border-gold/40" : ""}`}>
                {isTop && <div className="absolute top-2 right-2 text-[10px] text-gold font-display uppercase">Top</div>}
                <div className="text-3xl mb-2">{meta.emoji}</div>
                <p className={`font-display text-xl ${meta.color}`}>{pts}</p>
                <p className="font-body text-xs text-parchment-600 uppercase tracking-widest">{meta.label}</p>
                <p className="font-body text-[10px] text-parchment-700 mt-0.5">{meta.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { href: "/cowboy/bounties", emoji: "📋", label: "Bounty Board", desc: "View and submit today's work" },
          { href: "/cowboy/store",    emoji: "🛒", label: "General Store", desc: "Spend your gold on rewards" },
          { href: "/cowboy/profile",  emoji: "👤", label: "My Profile",    desc: "Titles, badges, history" },
        ].map(item => (
          <Link key={item.href} href={item.href}
            className="ledger-panel p-5 flex items-center gap-4 hover:border-saddle-600 transition-colors group">
            <span className="text-4xl">{item.emoji}</span>
            <div>
              <p className="font-display text-base uppercase tracking-widest text-parchment-200 group-hover:text-gold transition-colors">{item.label}</p>
              <p className="font-body text-parchment-600 text-xs">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
