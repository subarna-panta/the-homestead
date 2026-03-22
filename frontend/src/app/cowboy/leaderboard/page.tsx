"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, LeaderboardEntry } from "@/lib/api";
import { calculateTitle, ATTRIBUTE_META } from "@/lib/titles";

export default function CowboyLeaderboard() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.leaderboard.get().then(setEntries).finally(() => setLoading(false)); }, []);

  const cowboys = entries.filter(e => !e.isSheriff);
  const myRank = cowboys.findIndex(e => e.id === user?.id) + 1;

  return (
    <div className="space-y-8">
      <div className="border-b border-saddle-900 pb-6">
        <p className="font-display text-xs uppercase tracking-widest text-saddle-500 mb-1">The Homestead</p>
        <h1 className="font-display text-3xl md:text-4xl uppercase tracking-widest text-parchment-200">
          Leaderboard
        </h1>
        <p className="font-body text-parchment-600 mt-1">
          The top cowboys of the homestead, ranked by XP earned.
        </p>
      </div>

      {/* My rank banner */}
      {myRank > 0 && (
        <div className="ledger-panel px-6 py-4 flex items-center gap-4">
          <span className="text-3xl">
            {myRank === 1 ? "🥇" : myRank === 2 ? "🥈" : myRank === 3 ? "🥉" : "🤠"}
          </span>
          <div>
            <p className="font-display text-sm uppercase tracking-widest text-parchment-400">Your Rank</p>
            <p className="font-display text-2xl text-gold">#{myRank} of {cowboys.length}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="font-body text-xs text-parchment-600 uppercase tracking-widest">Your XP</p>
            <p className="font-display text-xl text-parchment-300">{user?.xp ?? 0} ⭐</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center py-32 gap-4">
          <div className="text-5xl animate-sway">🏆</div>
          <p className="font-display text-parchment-500 uppercase tracking-widest animate-flicker">
            Roundin' up the rankings…
          </p>
        </div>
      ) : cowboys.length === 0 ? (
        <div className="text-center py-24 ledger-panel">
          <div className="text-5xl mb-4">🌵</div>
          <p className="font-display text-2xl uppercase tracking-widest text-parchment-400 mb-2">
            No Cowboys Yet
          </p>
          <p className="font-body text-parchment-600">Complete some bounties to get on the board!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cowboys.map((cowboy, i) => {
            const isMe = cowboy.id === user?.id;
            const title = calculateTitle(
              cowboy.gritPoints, cowboy.laborPoints,
              cowboy.wisdomPoints, cowboy.honorPoints, cowboy.xp
            );
            const topAttr = (["grit", "labor", "wisdom", "honor"] as const).reduce((best, a) =>
              (cowboy[`${a}Points` as keyof LeaderboardEntry] as number) >
              (cowboy[`${best}Points` as keyof LeaderboardEntry] as number) ? a : best,
              "grit" as "grit" | "labor" | "wisdom" | "honor"
            );
            const meta = ATTRIBUTE_META[topAttr];
            const topPts = cowboy[`${topAttr}Points` as keyof LeaderboardEntry] as number;

            return (
              <div
                key={cowboy.id}
                className={`ledger-panel p-4 flex items-center gap-4 transition-all ${
                  isMe ? "border-gold/50 bg-yellow-900/10" : ""
                }`}
              >
                {/* Rank badge */}
                <div className="w-12 text-center shrink-0">
                  {i === 0 ? (
                    <span className="text-3xl">🥇</span>
                  ) : i === 1 ? (
                    <span className="text-3xl">🥈</span>
                  ) : i === 2 ? (
                    <span className="text-3xl">🥉</span>
                  ) : (
                    <span className="font-display text-xl text-parchment-600">#{i + 1}</span>
                  )}
                </div>

                {/* Name + title */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`font-display text-base uppercase tracking-wider truncate ${isMe ? "text-gold" : "text-parchment-200"}`}>
                      {cowboy.username}
                      {isMe && <span className="text-parchment-500 normal-case font-body text-xs ml-1">(you)</span>}
                    </p>
                    {topPts > 0 && (
                      <span className={`badge-pill border ${meta.border} ${meta.color} ${meta.bg} text-[10px]`}>
                        {meta.emoji} {meta.label}
                      </span>
                    )}
                  </div>
                  <p className="font-body text-xs text-parchment-600 truncate">{title}</p>
                </div>

                {/* XP + Gold */}
                <div className="flex gap-5 text-center shrink-0">
                  <div>
                    <p className="font-display text-lg text-parchment-300">{cowboy.xp}</p>
                    <p className="font-body text-[10px] text-parchment-600 uppercase">XP</p>
                  </div>
                  <div>
                    <p className="font-display text-lg text-gold">{cowboy.gold}</p>
                    <p className="font-body text-[10px] text-parchment-600 uppercase">Gold</p>
                  </div>
                </div>

                {/* Attribute mini-bars (desktop only) */}
                <div className="hidden md:flex flex-col gap-1 w-28 shrink-0">
                  {(["grit", "labor", "wisdom", "honor"] as const).map(attr => {
                    const m = ATTRIBUTE_META[attr];
                    const pts = cowboy[`${attr}Points` as keyof LeaderboardEntry] as number;
                    const maxPts = Math.max(
                      cowboy.gritPoints, cowboy.laborPoints,
                      cowboy.wisdomPoints, cowboy.honorPoints, 1
                    );
                    return (
                      <div key={attr} className="flex items-center gap-1">
                        <span className="text-[10px] w-3">{m.emoji}</span>
                        <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "#1a0a04" }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${(pts / maxPts) * 100}%`, backgroundColor: m.barColor }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
