"use client";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, StoreItem, StoreResponse } from "@/lib/api";

export default function CowboyStore() {
  const { user, refresh } = useAuth();
  const [store, setStore] = useState<StoreResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ key: string; msg: string; ok: boolean } | null>(null);

  const load = useCallback(() => {
    api.store.get().then(setStore).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleBuy = async (item: StoreItem) => {
    setBuying(item.key);
    try {
      const res = await api.store.purchase(item.key);
      setFlash({ key: item.key, msg: res.message, ok: true });
      load();
      refresh();
    } catch (e: unknown) {
      setFlash({ key: item.key, msg: e instanceof Error ? e.message : "Purchase failed", ok: false });
    } finally {
      setBuying(null);
      setTimeout(() => setFlash(null), 4000);
    }
  };

  const gold = user?.gold ?? 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-saddle-900 pb-6">
        <div>
          <p className="font-display text-xs uppercase tracking-widest text-saddle-500 mb-1">The Homestead</p>
          <h1 className="font-display text-3xl md:text-4xl uppercase tracking-widest text-parchment-200">
            General Store
          </h1>
          <p className="font-body text-parchment-600 mt-1">Spend yer hard-earned gold on real rewards.</p>
        </div>
        <div className="ledger-panel px-5 py-3 text-center">
          <p className="font-display text-2xl text-gold">💰 {gold}</p>
          <p className="font-body text-[10px] text-parchment-600 uppercase tracking-widest">Your Gold</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-32 gap-4">
          <div className="text-5xl animate-sway">🛒</div>
          <p className="font-display text-parchment-500 uppercase tracking-widest animate-flicker">
            Stockin' the shelves…
          </p>
        </div>
      ) : !store || store.items.length === 0 ? (
        <div className="text-center py-24 ledger-panel">
          <div className="text-5xl mb-4">🏚️</div>
          <p className="font-display text-2xl uppercase tracking-widest text-parchment-400 mb-2">Store's Empty</p>
          <p className="font-body text-parchment-600">The Sheriff hasn't stocked any rewards yet.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Store items grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {store.items.map(item => {
              const canAfford = gold >= item.gold;
              const isBuying = buying === item.key;
              const thisFlash = flash?.key === item.key ? flash : null;

              return (
                <div key={item.key} className="wanted-poster p-6 flex flex-col gap-4 relative">
                  {/* Can't afford overlay */}
                  {!canAfford && (
                    <div className="absolute inset-0 bg-parchment-200/50 flex items-center justify-center z-10 pointer-events-none">
                      <p className="font-display text-sm uppercase tracking-widest text-saddle-500 rotate-[-12deg] border-2 border-saddle-400 px-3 py-1 bg-parchment-100">
                        Need more gold
                      </p>
                    </div>
                  )}

                  <div className="text-5xl text-center pt-1">{item.emoji}</div>

                  <div className="text-center">
                    <h3 className="font-display text-xl uppercase tracking-wider text-dirt leading-tight">
                      {item.name}
                    </h3>
                    <p className="font-body text-saddle-600 text-sm mt-1">{item.description}</p>
                  </div>

                  {/* Price */}
                  <div className="flex items-center justify-center gap-2 border-t border-b border-saddle-300 py-3 mt-auto">
                    <span className="text-gold text-xl">💰</span>
                    <span className="font-display text-2xl text-saddle-700">{item.gold}</span>
                    <span className="font-body text-saddle-500 text-sm">Gold</span>
                  </div>

                  {/* Action */}
                  {thisFlash ? (
                    <p className={`font-body text-sm text-center py-2 ${thisFlash.ok ? "text-sage" : "text-dusk"}`}>
                      {thisFlash.msg}
                    </p>
                  ) : (
                    <button
                      onClick={() => handleBuy(item)}
                      disabled={!canAfford || isBuying}
                      className="btn-primary w-full text-center disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isBuying ? "Purchasin'…" : `Buy for ${item.gold} 💰`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Purchase history */}
          {store.purchases.length > 0 && (
            <section>
              <h2 className="font-display text-xl uppercase tracking-widest text-parchment-400 mb-4">
                Purchase History
              </h2>
              <div className="ledger-panel divide-y divide-saddle-900/50">
                {store.purchases.map((p, i) => {
                  const item = store.items.find(it => it.key === p.itemKey);
                  return (
                    <div key={i} className="flex items-center justify-between px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{item?.emoji ?? "🎁"}</span>
                        <div>
                          <p className="font-display text-sm uppercase tracking-wider text-parchment-300">
                            {item?.name ?? p.itemKey}
                          </p>
                          <p className="font-body text-xs text-parchment-600">
                            {new Date(p.purchasedAt).toLocaleDateString("en-US", {
                              month: "short", day: "numeric", year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm text-gold">−{item?.gold ?? "?"} 💰</span>
                        {"status" in p && (
                          <span className={`font-display text-[10px] uppercase tracking-wider px-2 py-0.5 border ${
                            p.status === "delivered" ? "text-sage border-sage"
                            : p.status === "denied" ? "text-dusk border-dusk"
                            : "text-amber-400 border-amber-600"
                          }`}>
                            {p.status === "delivered" ? "✓ Delivered" : p.status === "denied" ? "✗ Denied" : "⏳ Pending"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
