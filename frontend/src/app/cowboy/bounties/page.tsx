"use client";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, BountyWithStatus } from "@/lib/api";
import BountyCard from "@/components/BountyCard";

const SECTIONS = [
  { type: "daily",   label: "Today's Duties",  emoji: "☀️",  desc: "Due today — git to it!" },
  { type: "weekly",  label: "This Week",        emoji: "📅",  desc: "Repeats on select days." },
  { type: "monthly", label: "This Month",       emoji: "🗓️",  desc: "Tied to a specific date." },
  { type: "none",    label: "Open Range",       emoji: "🧭",  desc: "No deadline — always available." },
] as const;

export default function CowboyBounties() {
  const { user, refresh } = useAuth();
  const [bounties, setBounties] = useState<BountyWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    api.bounties.list().then(setBounties).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    // Re-check overdue status every minute
    const interval = setInterval(load, 60 * 1000);
    return () => clearInterval(interval);
  }, [load]);

  const handleClaim = async (id: number) => {
    await api.bounties.claim(id);
    load();
    refresh();
  };

  const grouped = SECTIONS.map(s => ({
    ...s,
    bounties: bounties.filter(b => b.scheduleType === s.type),
  })).filter(s => s.bounties.length > 0);

  return (
    <div className="space-y-8">
      <div className="border-b border-saddle-900 pb-6">
        <p className="font-display text-xs uppercase tracking-widest text-saddle-500 mb-1">The Homestead</p>
        <h1 className="font-display text-3xl md:text-4xl uppercase tracking-widest text-parchment-200">Bounty Board</h1>
        <p className="font-body text-parchment-600 mt-1">
          Complete yer chores, submit for review, and let the Sheriff sign the Ledger.
        </p>
      </div>

      {/* Streak penalty banner */}
      {user?.streakPenalty && (
        <div className="flex items-start gap-3 border-2 border-dusk/60 bg-red-950/20 px-5 py-4">
          <span className="text-xl shrink-0">⚠️</span>
          <div>
            <p className="font-display text-sm uppercase tracking-wider text-dusk">Cracked Grit — 0.5× Rewards</p>
            <p className="font-body text-xs text-parchment-600">
              Complete all bounties for 3 days to rebuild. Progress: {user.streakRebuildCount}/3
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="text-5xl animate-sway">🤠</div>
          <p className="font-display text-parchment-500 uppercase tracking-widest animate-flicker">
            Scoutin' for bounties…
          </p>
        </div>
      ) : bounties.length === 0 ? (
        <div className="wanted-poster max-w-sm mx-auto p-12 text-center">
          <p className="font-display text-2xl uppercase tracking-widest text-dirt mb-2">Homestead's Quiet</p>
          <p className="font-body text-saddle-600 text-sm">No bounties posted yet. Ask the Sheriff to add some.</p>
        </div>
      ) : (
        <div className="space-y-14">
          {grouped.map(section => (
            <section key={section.type}>
              {/* Section header */}
              <div className="flex items-center gap-3 mb-6 pb-3 border-b-2 border-saddle-900">
                <span className="text-2xl">{section.emoji}</span>
                <div>
                  <h2 className="font-display text-2xl uppercase tracking-widest text-parchment-300">
                    {section.label}
                  </h2>
                  <p className="font-body text-xs text-parchment-600">{section.desc}</p>
                </div>
                <span className="ml-auto font-display text-xs text-parchment-600 border border-saddle-700 px-2 py-0.5">
                  {section.bounties.length} {section.bounties.length === 1 ? "bounty" : "bounties"}
                </span>
              </div>

              {/* Cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {section.bounties.map(bounty => (
                  <BountyCard
                    key={bounty.id}
                    bounty={bounty}
                    onClaim={handleClaim}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
