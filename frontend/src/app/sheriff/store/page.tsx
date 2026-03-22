"use client";
import { useEffect, useState } from "react";
import { api, StoreItem, PurchaseRecord } from "@/lib/api";

const EMPTY: Partial<StoreItem> = { name: "", description: "", gold: 100, emoji: "🎁", isActive: true };
const EMOJI_SUGGESTIONS = ["🎁","🌵","🐴","🌙","🍕","🎮","🎬","🛹","⚽","🎵","🍦","🏆","🎯","🎪","🤠"];

export default function SheriffStore() {
  const [items, setItems] = useState<StoreItem[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<StoreItem | null>(null);
  const [form, setForm] = useState<Partial<StoreItem>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = () => {
    Promise.all([
      api.store.admin.list(),
      api.store.purchases(),
    ]).then(([i, p]) => { setItems(i); setPurchases(p); }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(EMPTY); setShowForm(true); setError(""); };
  const openEdit = (item: StoreItem) => { setEditing(item); setForm(item); setShowForm(true); setError(""); };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      if (editing?.id) await api.store.admin.update(editing.id, form);
      else await api.store.admin.create(form);
      closeForm(); load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error saving item");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remove this item from the store?")) return;
    await api.store.admin.delete(id); load();
  };

  const toggleActive = async (item: StoreItem) => {
    if (!item.id) return;
    await api.store.admin.update(item.id, { isActive: !item.isActive }); load();
  };

  const handleAction = async (purchase: PurchaseRecord, action: "delivered" | "denied") => {
    setActing(purchase.id);
    try {
      await api.store.purchaseAction(purchase.id, action);
      load();
    } catch (e) {
      console.error(e);
    } finally { setActing(null); }
  };

  const pendingCount = purchases.filter(p => p.status === "pending").length;

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between border-b border-saddle-900 pb-6">
        <div>
          <p className="font-display text-xs uppercase tracking-widest text-saddle-500 mb-1">Sheriff's Office</p>
          <h1 className="font-display text-3xl md:text-4xl uppercase tracking-widest text-parchment-200">
            General Store
          </h1>
          <p className="font-body text-parchment-600 mt-1">Manage rewards and approve redemptions.</p>
        </div>
        <button onClick={openNew} className="btn-primary">+ Add Item</button>
      </div>

      {/* Modal form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="wanted-poster w-full max-w-md p-6">
            <h2 className="font-display text-2xl uppercase tracking-widest text-dirt mb-6 border-b-2 border-saddle-600 pb-3">
              {editing ? "Edit Item" : "New Store Item"}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="field-label !text-saddle-700">Emoji</label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {EMOJI_SUGGESTIONS.map(e => (
                    <button key={e} type="button" onClick={() => setForm(f => ({ ...f, emoji: e }))}
                      className={`text-xl p-1 border-2 rounded transition-all ${form.emoji === e ? "border-dirt bg-saddle-200" : "border-transparent hover:border-saddle-400"}`}>
                      {e}
                    </button>
                  ))}
                </div>
                <input className="field-input" placeholder="Or type any emoji"
                  value={form.emoji ?? "🎁"} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} />
              </div>
              <div>
                <label className="field-label !text-saddle-700">Item Name *</label>
                <input className="field-input" value={form.name ?? ""}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label className="field-label !text-saddle-700">Description <span className="font-body normal-case tracking-normal opacity-60">(optional)</span></label>
                <input className="field-input" value={form.description ?? ""}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="field-label !text-saddle-700">Gold Cost</label>
                <input className="field-input" type="number" value={form.gold ?? 100}
                  onChange={e => setForm(f => ({ ...f, gold: +e.target.value }))} />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="active" checked={form.isActive ?? true}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="w-4 h-4 accent-saddle-700" />
                <label htmlFor="active" className="field-label !text-saddle-700 !mb-0">Active (visible to cowboys)</label>
              </div>
              {error && <p className="text-dusk font-body text-sm">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
                  {saving ? "Savin'…" : editing ? "Save Changes" : "Add to Store"}
                </button>
                <button type="button" onClick={closeForm} className="btn-ghost px-5">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <p className="font-display text-parchment-500 uppercase tracking-widest animate-flicker text-center py-20">Stockin' shelves…</p>
      ) : (
        <div className="space-y-10">

          {/* Pending redemptions — shown first if any */}
          {pendingCount > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="font-display text-xl uppercase tracking-widest text-parchment-200">
                  🔔 Pending Redemptions
                </h2>
                <span className="font-display text-xs bg-dusk text-parchment-100 px-2 py-0.5">{pendingCount}</span>
              </div>
              <div className="ledger-panel divide-y divide-saddle-900/50">
                {purchases.filter(p => p.status === "pending").map(p => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-4 gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-2xl shrink-0">{p.itemEmoji}</span>
                      <div className="min-w-0">
                        <p className="font-display text-sm uppercase tracking-wider text-parchment-200 truncate">{p.itemName}</p>
                        <p className="font-body text-xs text-parchment-600">
                          by <span className="text-parchment-400">{p.pioneerUsername}</span>
                          {" · "}{new Date(p.purchasedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          {" · "}<span className="text-gold">{p.goldCost} 💰</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        disabled={acting === p.id}
                        onClick={() => handleAction(p, "delivered")}
                        className="btn-success text-xs px-3 py-2 disabled:opacity-50">
                        ✓ Deliver
                      </button>
                      <button
                        disabled={acting === p.id}
                        onClick={() => handleAction(p, "denied")}
                        className="btn-danger text-xs px-3 py-2 disabled:opacity-50">
                        ✗ Deny
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Store items grid */}
          <section>
            <h2 className="font-display text-xl uppercase tracking-widest text-parchment-400 mb-4">Store Items</h2>
            {items.length === 0 ? (
              <div className="text-center py-16">
                <p className="font-display text-2xl uppercase tracking-widest text-parchment-600 mb-2">Store's Empty</p>
                <button onClick={openNew} className="btn-primary mt-4">Add First Item</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map(item => (
                  <div key={item.id} className={`wanted-poster p-5 flex flex-col gap-3 relative ${!item.isActive ? "opacity-50" : ""}`}>
                    {!item.isActive && <div className="stamp-declined text-[10px]">Hidden</div>}
                    <div className="text-5xl text-center pt-2">{item.emoji}</div>
                    <div className="text-center">
                      <h3 className="font-display text-xl uppercase tracking-wider text-dirt">{item.name}</h3>
                      {item.description && <p className="font-body text-saddle-600 text-sm mt-1">{item.description}</p>}
                    </div>
                    <div className="flex items-center justify-center gap-2 border-t border-b border-saddle-300 py-2">
                      <span className="text-gold">💰</span>
                      <span className="font-display text-xl text-saddle-700">{item.gold}</span>
                      <span className="font-body text-saddle-500 text-sm">Gold</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(item)} className="btn-ghost text-xs px-3 py-2 flex-1">Edit</button>
                      <button onClick={() => toggleActive(item)}
                        className={`text-xs px-3 py-2 flex-1 font-display uppercase tracking-widest border-2 transition-colors ${
                          item.isActive ? "border-saddle-500 text-saddle-600 hover:border-dusk hover:text-dusk" : "border-sage text-sage hover:bg-sage/10"
                        }`}>
                        {item.isActive ? "Hide" : "Show"}
                      </button>
                      {item.id && <button onClick={() => handleDelete(item.id!)} className="btn-danger text-xs px-3 py-2">✕</button>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Purchase history — delivered and denied */}
          {purchases.filter(p => p.status !== "pending").length > 0 && (
            <section>
              <h2 className="font-display text-xl uppercase tracking-widest text-parchment-400 mb-4">🧾 Past Redemptions</h2>
              <div className="ledger-panel divide-y divide-saddle-900/50">
                {purchases.filter(p => p.status !== "pending").map(p => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{p.itemEmoji}</span>
                      <div>
                        <p className="font-display text-sm uppercase tracking-wider text-parchment-200">{p.itemName}</p>
                        <p className="font-body text-xs text-parchment-600">
                          by <span className="text-parchment-400">{p.pioneerUsername}</span>
                          {" · "}{new Date(p.purchasedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-display text-sm text-gold">−{p.goldCost} 💰</span>
                      <span className={`font-display text-xs uppercase tracking-wider px-2 py-0.5 border ${
                        p.status === "delivered"
                          ? "text-sage border-sage"
                          : "text-dusk border-dusk"
                      }`}>
                        {p.status === "delivered" ? "✓ Delivered" : "✗ Denied"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
