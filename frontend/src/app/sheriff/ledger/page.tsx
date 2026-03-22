"use client";
import { useEffect, useState } from "react";
import { api, PendingClaim, PurchaseRecord } from "@/lib/api";
import { ATTRIBUTE_META } from "@/lib/titles";

export default function SheriffLedger() {
  const [claims, setClaims] = useState<PendingClaim[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<number | null>(null);
  const [flash, setFlash] = useState<{ id: number; msg: string; type: "ok" | "err" } | null>(null);
  const [tab, setTab] = useState<"claims" | "purchases">("claims");

  const load = () => {
    Promise.all([
      api.bounties.pendingClaims(),
      api.store.purchases(),
    ]).then(([c, p]) => {
      setClaims(c);
      setPurchases(p);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handle = async (claim: PendingClaim, action: "approve" | "decline") => {
    setActing(claim.claimId);
    try {
      const res = action === "approve"
        ? await api.bounties.approve(claim.claimId, claim.pioneerId)
        : await api.bounties.decline(claim.claimId, claim.pioneerId);
      setFlash({ id: claim.claimId, msg: res.message, type: "ok" });
      setTimeout(() => {
        setClaims(prev => prev.filter(c => c.claimId !== claim.claimId));
        setFlash(null);
      }, 1800);
    } catch (e: unknown) {
      setFlash({ id: claim.claimId, msg: e instanceof Error ? e.message : "Error", type: "err" });
      setTimeout(() => setFlash(null), 3000);
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-saddle-900 pb-6">
        <p className="font-display text-xs uppercase tracking-widest text-saddle-500 mb-1">Sheriff's Office</p>
        <h1 className="font-display text-3xl md:text-4xl uppercase tracking-widest text-parchment-200">The Ledger</h1>
        <p className="font-body text-parchment-600 mt-1">Review bounty claims and track store purchases.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-saddle-900">
        <button
          onClick={() => setTab("claims")}
          className={`font-display text-sm uppercase tracking-widest px-5 py-3 border-b-2 transition-colors ${
            tab === "claims" ? "border-gold text-gold" : "border-transparent text-parchment-500 hover:text-parchment-300"
          }`}>
          ⚖️ Bounty Claims
          {claims.length > 0 && (
            <span className="ml-2 bg-dusk text-parchment-100 font-display text-[10px] px-1.5 py-0.5">
              {claims.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("purchases")}
          className={`font-display text-sm uppercase tracking-widest px-5 py-3 border-b-2 transition-colors ${
            tab === "purchases" ? "border-gold text-gold" : "border-transparent text-parchment-500 hover:text-parchment-300"
          }`}>
          🛒 Store Purchases
          {purchases.length > 0 && (
            <span className="ml-2 bg-saddle-700 text-parchment-100 font-display text-[10px] px-1.5 py-0.5">
              {purchases.length}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <p className="font-display text-parchment-500 uppercase tracking-widest animate-flicker text-center py-20">
          Reviewing the ledger…
        </p>
      ) : tab === "claims" ? (
        claims.length === 0 ? (
          <div className="text-center py-24 ledger-panel">
            <div className="text-5xl mb-4">✓</div>
            <p className="font-display text-2xl uppercase tracking-widest text-parchment-400 mb-2">Ledger's Clear</p>
            <p className="font-body text-parchment-600">No pending claims. The homestead's in order.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {claims.map(claim => {
              const attr = ATTRIBUTE_META[claim.attribute as keyof typeof ATTRIBUTE_META] ?? ATTRIBUTE_META.grit;
              const isActing = acting === claim.claimId;
              const thisFlash = flash?.id === claim.claimId ? flash : null;
              const streakBonus = claim.streakCount >= 7;

              return (
                <div key={claim.claimId} className="ledger-panel p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`badge-pill border ${attr.border} ${attr.color} ${attr.bg}`}>
                        {attr.emoji} {attr.label}
                      </span>
                      {streakBonus && (
                        <span className="badge-pill border border-orange-600 text-orange-400">
                          🔥 Gold Rush Bonus!
                        </span>
                      )}
                      {claim.streakCount > 1 && !streakBonus && (
                        <span className="badge-pill border border-amber-700 text-amber-500">
                          🔥 {claim.streakCount}-day streak
                        </span>
                      )}
                    </div>
                    <p className="font-display text-lg uppercase tracking-wider text-parchment-200 truncate">
                      {claim.bountyTitle}
                    </p>
                    <p className="font-body text-sm text-parchment-600">
                      Submitted by <span className="text-parchment-400">{claim.pioneerUsername}</span> · {claim.date}
                    </p>
                  </div>

                  <div className="flex gap-4 text-center shrink-0">
                    <div>
                      <p className="font-display text-lg text-gold">
                        {streakBonus ? claim.goldReward * 2 : claim.goldReward} 💰
                      </p>
                      <p className="font-body text-[10px] text-parchment-700 uppercase">Gold</p>
                    </div>
                    <div>
                      <p className="font-display text-lg text-parchment-300">{claim.xpReward} ⭐</p>
                      <p className="font-body text-[10px] text-parchment-700 uppercase">XP</p>
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    {thisFlash ? (
                      <p className={`font-body text-sm px-4 py-2 ${thisFlash.type === "ok" ? "text-sage" : "text-dusk"}`}>
                        {thisFlash.msg}
                      </p>
                    ) : (
                      <>
                        <button disabled={isActing} onClick={() => handle(claim, "approve")}
                          className="btn-success disabled:opacity-50">✓ Approve</button>
                        <button disabled={isActing} onClick={() => handle(claim, "decline")}
                          className="btn-danger disabled:opacity-50">✗ Decline</button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        purchases.length === 0 ? (
          <div className="text-center py-24 ledger-panel">
            <div className="text-5xl mb-4">🛒</div>
            <p className="font-display text-2xl uppercase tracking-widest text-parchment-400 mb-2">No Purchases Yet</p>
            <p className="font-body text-parchment-600">Your cowboys haven't spent any gold yet.</p>
          </div>
        ) : (
          <div className="ledger-panel divide-y divide-saddle-900/50">
            {purchases.map(p => (
              <div key={p.id} className="flex items-center gap-4 px-5 py-4">
                <span className="text-3xl shrink-0">{p.itemEmoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-base uppercase tracking-wider text-parchment-200">{p.itemName}</p>
                  <p className="font-body text-xs text-parchment-600">
                    Purchased by <span className="text-parchment-400">{p.pioneerUsername}</span> · {new Date(p.purchasedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-display text-base text-gold">−{p.goldCost} 💰</p>
                  <p className="font-body text-[10px] text-parchment-600 uppercase">Gold spent</p>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
