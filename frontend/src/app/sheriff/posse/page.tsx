"use client";
import { useEffect, useState } from "react";
import { api, LeaderboardEntry } from "@/lib/api";
import { calculateTitle, ATTRIBUTE_META } from "@/lib/titles";

export default function SheriffPosse() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.leaderboard.get().then(setEntries).finally(() => setLoading(false)); }, []);

  const cowboys = entries.filter(e => !e.isSheriff);

  return (
    <div className="space-y-8">
      <div className="border-b border-saddle-900 pb-6">
        <p className="font-display text-xs uppercase tracking-widest text-saddle-500 mb-1">Sheriff's Office</p>
        <h1 className="font-display text-3xl md:text-4xl uppercase tracking-widest text-parchment-200">The Posse</h1>
        <p className="font-body text-parchment-600 mt-1">Your cowboys, ranked by XP earned.</p>
      </div>

      {loading ? (
        <p className="font-display text-parchment-500 uppercase tracking-widest animate-flicker text-center py-20">
          Roundin' up the posse…
        </p>
      ) : cowboys.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-display text-2xl uppercase tracking-widest text-parchment-600">No Cowboys Yet</p>
          <p className="font-body text-parchment-700 mt-2">Share the signup link to bring pioneers to your homestead.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {cowboys.map((cowboy, i) => {
            const title = calculateTitle(cowboy.gritPoints, cowboy.laborPoints, cowboy.wisdomPoints, cowboy.honorPoints, cowboy.xp);
            const topAttr = (["grit","labor","wisdom","honor"] as const).reduce((best, a) =>
              (cowboy[`${a}Points` as keyof LeaderboardEntry] as number) > (cowboy[`${best}Points` as keyof LeaderboardEntry] as number) ? a : best, "grit" as "grit"|"labor"|"wisdom"|"honor");
            const meta = ATTRIBUTE_META[topAttr];

            return (
              <div key={cowboy.id} className="ledger-panel p-5 flex items-center gap-5">
                {/* Rank */}
                <div className={`font-display text-3xl w-12 text-center shrink-0 ${i === 0 ? "text-gold" : i === 1 ? "text-parchment-400" : i === 2 ? "text-copper" : "text-parchment-700"}`}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                </div>

                {/* Name + title */}
                <div className="flex-1 min-w-0">
                  <p className="font-display text-lg uppercase tracking-wider text-parchment-200 truncate">{cowboy.username}</p>
                  <p className="font-body text-xs text-parchment-600">{title}</p>
                  <span className={`badge-pill border ${meta.border} ${meta.color} ${meta.bg} mt-1`}>
                    {meta.emoji} {meta.label}
                  </span>
                </div>

                {/* Stats */}
                <div className="flex gap-6 text-center shrink-0">
                  <div>
                    <p className="font-display text-xl text-parchment-200">{cowboy.xp}</p>
                    <p className="font-body text-[10px] text-parchment-600 uppercase">XP</p>
                  </div>
                  <div>
                    <p className="font-display text-xl text-gold">{cowboy.gold}</p>
                    <p className="font-body text-[10px] text-parchment-600 uppercase">Gold</p>
                  </div>
                </div>

                {/* Attribute breakdown */}
                <div className="hidden md:grid grid-cols-4 gap-2 shrink-0">
                  {(["grit","labor","wisdom","honor"] as const).map(attr => {
                    const m = ATTRIBUTE_META[attr];
                    const pts = cowboy[`${attr}Points` as keyof LeaderboardEntry] as number;
                    return (
                      <div key={attr} className="text-center">
                        <p className="text-sm">{m.emoji}</p>
                        <p className={`font-display text-xs ${m.color}`}>{pts}</p>
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
