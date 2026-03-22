"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, LeaderboardEntry } from "@/lib/api";
import { calculateTitle, ATTRIBUTE_META, BADGES } from "@/lib/titles";

export default function CowboyProfile() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => { api.leaderboard.get().then(setLeaderboard).catch(() => {}); }, []);

  if (!user) return null;

  const title = calculateTitle(user.gritPoints, user.laborPoints, user.wisdomPoints, user.honorPoints, user.xp);
  const rank = leaderboard.filter(e => !e.isSheriff).findIndex(e => e.id === user.id) + 1;
  const maxAttr = Math.max(user.gritPoints, user.laborPoints, user.wisdomPoints, user.honorPoints, 1);
  const nextTierXp = (Math.floor(user.xp / 300) + 1) * 300;
  const tierProgress = ((user.xp % 300) / 300) * 100;
  const goldRushActive = user.gritMeter === 100 && !user.streakPenalty;

  return (
    <div className="space-y-10 max-w-2xl mx-auto">
      {/* Profile hero */}
      <div className="wanted-poster p-8 text-center relative">
        <p className="font-display text-xs uppercase tracking-widest text-saddle-500 mb-3">Pioneer Profile</p>
        <div className="text-7xl mb-3">🤠</div>
        <h1 className="font-display text-4xl uppercase tracking-widest text-dirt mb-1">{user.username}</h1>
        <p className="font-body text-saddle-600 text-base italic">"{title}"</p>
        {goldRushActive && (
          <div className="mt-4 border-2 border-yellow-500 bg-yellow-50 px-4 py-2 inline-block">
            <p className="font-display text-xs uppercase tracking-wider text-yellow-700">
              🔥 Gold Rush Active — 2× Rewards!
            </p>
          </div>
        )}
        {user.streakPenalty && (
          <div className="mt-4 border-2 border-dusk/50 bg-red-100/50 px-4 py-2 inline-block">
            <p className="font-display text-xs uppercase tracking-wider text-dusk">
              ⚠️ Cracked Grit — {user.streakRebuildCount}/3 days rebuilt
            </p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Gold", value: user.gold, emoji: "💰", color: "text-gold" },
          { label: "Total XP", value: user.xp, emoji: "⭐", color: "text-parchment-300" },
          { label: "Rank", value: rank > 0 ? `#${rank}` : "—", emoji: "🏅", color: "text-copper" },
        ].map(s => (
          <div key={s.label} className="ledger-panel p-4 text-center">
            <div className="text-2xl mb-1">{s.emoji}</div>
            <div className={`font-display text-xl ${s.color}`}>{s.value}</div>
            <div className="font-body text-[10px] text-parchment-600 uppercase tracking-widest">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Title progression */}
      <div className="ledger-panel p-5">
        <div className="flex justify-between items-center mb-2">
          <p className="font-display text-sm uppercase tracking-widest text-parchment-400">Title Progress</p>
          <p className="font-body text-xs text-parchment-600">{user.xp} / {nextTierXp} XP</p>
        </div>
        <div className="w-full h-3 rounded-full overflow-hidden border border-saddle-800" style={{ background: "#1a0a04" }}>
          <div
            className="h-full transition-all duration-700"
            style={{ width: `${tierProgress}%`, background: "linear-gradient(to right, #b5651d, #d4a017)" }}
          />
        </div>
        <p className="font-body text-xs text-parchment-600 mt-2 text-center">
          Current title: <span className="text-parchment-400">{title}</span>
        </p>
      </div>

      {/* Grit meter */}
      <div className="ledger-panel p-5">
        <div className="flex justify-between items-center mb-2">
          <p className="font-display text-sm uppercase tracking-widest text-parchment-400">🔥 Grit Meter</p>
          <p className="font-body text-xs text-parchment-600">{user.gritMeter}%</p>
        </div>
        <div className="w-full h-4 rounded-full overflow-hidden border border-saddle-800" style={{ background: "#1a0a04" }}>
          <div
            className="h-full transition-all duration-700"
            style={{
              width: `${user.gritMeter}%`,
              background: goldRushActive ? "#d4a017" : user.streakPenalty ? "#8b2e2e" : "#a86820",
            }}
          />
        </div>
        <p className="font-body text-xs text-parchment-600 mt-2 text-center">
          {goldRushActive
            ? "🔥 Gold Rush! All bounties complete — earning 2× gold."
            : user.streakPenalty
            ? `⚠️ Cracked Grit — complete all bounties for ${3 - user.streakRebuildCount} more day(s) to recover`
            : "Complete all bounties each day to reach 100% and trigger Gold Rush (2× gold)."}
        </p>
      </div>

      {/* Attributes with inline-style bars (avoids Tailwind purge issue) */}
      <div className="ledger-panel p-5">
        <h2 className="font-display text-sm uppercase tracking-widest text-parchment-400 mb-5">Attributes</h2>
        <div className="space-y-5">
          {(["grit", "labor", "wisdom", "honor"] as const).map(attr => {
            const meta = ATTRIBUTE_META[attr];
            const pts = user[`${attr}Points` as keyof typeof user] as number;
            const pct = Math.round((pts / maxAttr) * 100);
            return (
              <div key={attr}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className={`font-display text-xs uppercase tracking-widest ${meta.color}`}>
                    {meta.emoji} {meta.label}
                  </span>
                  <span className="font-body text-xs text-parchment-500">{pts} pts</span>
                </div>
                <div className="w-full h-3 rounded-full border border-saddle-800 overflow-hidden" style={{ background: "#1a0a04" }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: meta.barColor }}
                  />
                </div>
                <p className="font-body text-[10px] text-parchment-700 mt-0.5">{meta.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges */}
      <div className="ledger-panel p-5">
        <h2 className="font-display text-sm uppercase tracking-widest text-parchment-400 mb-4">Badges</h2>
        {user.badges.length === 0 ? (
          <p className="font-body text-parchment-600 text-sm text-center py-4">No badges yet. Keep up the good work!</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {user.badges.map(key => {
              const badge = BADGES.find(b => b.key === key);
              if (!badge) return null;
              return (
                <div key={key} className="ledger-panel px-4 py-3 flex items-center gap-2">
                  <span className="text-2xl">{badge.emoji}</span>
                  <div>
                    <p className="font-display text-xs uppercase tracking-wider text-parchment-300">{badge.label}</p>
                    <p className="font-body text-[10px] text-parchment-600">{badge.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Leaderboard */}
      {leaderboard.filter(e => !e.isSheriff).length > 1 && (
        <div className="ledger-panel p-5">
          <h2 className="font-display text-sm uppercase tracking-widest text-parchment-400 mb-4">🏆 Homestead Rankings</h2>
          <div className="space-y-2">
            {leaderboard.filter(e => !e.isSheriff).slice(0, 5).map((entry, i) => {
              const isMe = entry.id === user.id;
              return (
                <div key={entry.id}
                  className={`flex items-center gap-3 px-4 py-2 ${isMe ? "border border-yellow-600/40 bg-yellow-900/10" : ""}`}>
                  <span className="font-display text-sm w-6 text-center text-parchment-600">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                  </span>
                  <span className={`font-display text-sm uppercase tracking-wider flex-1 ${isMe ? "text-gold" : "text-parchment-400"}`}>
                    {entry.username} {isMe && "(you)"}
                  </span>
                  <span className="font-display text-sm text-parchment-500">{entry.xp} XP</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
