"use client";
import { useEffect, useState } from "react";
import { api, BountyWithStatus } from "@/lib/api";
import BountyCard from "@/components/BountyCard";

const EMPTY: Partial<BountyWithStatus> = {
  title: "", description: "", goldReward: 50, xpReward: 100,
  attribute: "grit", scheduleType: "none", scheduledTime: "", repeatDays: [], repeatDayOfMonth: undefined,
};

const DAY_LABELS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export default function SheriffBounties() {
  const [bounties, setBounties] = useState<BountyWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BountyWithStatus | null>(null);
  const [form, setForm] = useState<Partial<BountyWithStatus>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => api.bounties.list().then(setBounties).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(EMPTY); setShowForm(true); setError(""); };
  const openEdit = (b: BountyWithStatus) => { setEditing(b); setForm(b); setShowForm(true); setError(""); };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  const toggleDay = (d: number) => {
    const days = form.repeatDays ?? [];
    setForm(f => ({ ...f, repeatDays: days.includes(d) ? days.filter(x => x !== d) : [...days, d] }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      if (editing) {
        await api.bounties.update(editing.id, form);
      } else {
        await api.bounties.create(form);
      }
      closeForm();
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error saving bounty");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remove this bounty from the board?")) return;
    await api.bounties.delete(id);
    load();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-saddle-900 pb-6">
        <div>
          <p className="font-display text-xs uppercase tracking-widest text-saddle-500 mb-1">Sheriff's Office</p>
          <h1 className="font-display text-3xl md:text-4xl uppercase tracking-widest text-parchment-200">Bounty Board</h1>
        </div>
        <button onClick={openNew} className="btn-primary">+ Post Bounty</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="wanted-poster w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-2xl uppercase tracking-widest text-dirt mb-6 border-b-2 border-saddle-600 pb-3">
              {editing ? "Edit Bounty" : "Post New Bounty"}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">

              <div>
                <label className="field-label !text-saddle-700">Title *</label>
                <input className="field-input" value={form.title ?? ""}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>

              <div>
                <label className="field-label !text-saddle-700">Description <span className="font-body normal-case tracking-normal opacity-60">(optional)</span></label>
                <textarea className="field-input resize-none" rows={3} value={form.description ?? ""}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label !text-saddle-700">Gold Reward</label>
                  <input className="field-input" type="number" value={form.goldReward ?? 50}
                    onChange={e => setForm(f => ({ ...f, goldReward: +e.target.value }))} />
                </div>
                <div>
                  <label className="field-label !text-saddle-700">XP Reward</label>
                  <input className="field-input" type="number" value={form.xpReward ?? 100}
                    onChange={e => setForm(f => ({ ...f, xpReward: +e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="field-label !text-saddle-700">Attribute</label>
                <div className="grid grid-cols-4 gap-2">
                  {(["grit","labor","wisdom","honor"] as const).map(a => (
                    <button key={a} type="button" onClick={() => setForm(f => ({ ...f, attribute: a }))}
                      className={`py-2 border-2 font-display text-xs uppercase tracking-wide transition-all ${
                        form.attribute === a ? "border-dirt bg-saddle-200 text-dirt" : "border-saddle-500 bg-parchment-100 text-saddle-600"
                      }`}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="field-label !text-saddle-700">Schedule</label>
                <select
                  className="field-input"
                  value={form.scheduleType ?? "none"}
                  onChange={e => {
                    const val = e.target.value as "none" | "daily" | "weekly" | "monthly";
                    setForm(f => ({
                      ...f,
                      scheduleType: val,
                      scheduledTime: "",
                      repeatDays: [],
                      repeatDayOfMonth: undefined,
                    }));
                  }}
                >
                  <option value="none">Open Range (No Deadline)</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly (Select Days)</option>
                  <option value="monthly">Monthly (Specific Date)</option>
                </select>
              </div>

              {form.scheduleType === "daily" && (
                <div>
                  <label className="field-label !text-saddle-700">Due Time (optional)</label>
                  <div className="flex gap-2 items-center">
                    <select
                      className="field-input"
                      value={(() => {
                        if (!form.scheduledTime) return "";
                        const hh = parseInt(form.scheduledTime.split(":")[0], 10);
                        const hour = hh % 12 === 0 ? 12 : hh % 12;
                        return String(hour);
                      })()}
                      onChange={e => {
                        const hour = parseInt(e.target.value, 10);
                        const currentTime = form.scheduledTime || "12:00";
                        const mm = currentTime.split(":")[1] || "00";
                        const currentHh = parseInt(currentTime.split(":")[0], 10);
                        const isPM = currentHh >= 12;
                        const newHh = isPM ? (hour === 12 ? 12 : hour + 12) : (hour === 12 ? 0 : hour);
                        setForm(f => ({ ...f, scheduledTime: `${String(newHh).padStart(2,"0")}:${mm}` }));
                      }}
                    >
                      <option value="">-- Hour --</option>
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                    <select
                      className="field-input"
                      value={form.scheduledTime ? form.scheduledTime.split(":")[1] : ""}
                      onChange={e => {
                        const currentTime = form.scheduledTime || "12:00";
                        const hh = currentTime.split(":")[0] || "12";
                        setForm(f => ({ ...f, scheduledTime: `${hh}:${e.target.value}` }));
                      }}
                    >
                      <option value="">-- Min --</option>
                      {["00","05","10","15","20","25","30","35","40","45","50","55"].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <select
                      className="field-input"
                      value={form.scheduledTime ? (parseInt(form.scheduledTime.split(":")[0], 10) >= 12 ? "PM" : "AM") : "AM"}
                      onChange={e => {
                        const currentTime = form.scheduledTime || "12:00";
                        const hh = parseInt(currentTime.split(":")[0], 10);
                        const mm = currentTime.split(":")[1] || "00";
                        const hour12 = hh % 12 === 0 ? 12 : hh % 12;
                        const newHh = e.target.value === "PM"
                          ? (hour12 === 12 ? 12 : hour12 + 12)
                          : (hour12 === 12 ? 0 : hour12);
                        setForm(f => ({ ...f, scheduledTime: `${String(newHh).padStart(2,"0")}:${mm}` }));
                      }}
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                  {form.scheduledTime && (
                    <p className="font-body text-xs text-saddle-500 mt-1">
                      Due at: {(() => {
                        const hh = parseInt(form.scheduledTime.split(":")[0], 10);
                        const mm = form.scheduledTime.split(":")[1];
                        const ampm = hh >= 12 ? "PM" : "AM";
                        const hour = hh % 12 === 0 ? 12 : hh % 12;
                        return `${hour}:${mm} ${ampm}`;
                      })()}
                    </p>
                  )}
                </div>
              )}

              {form.scheduleType === "weekly" && (
                <div>
                  <label className="field-label !text-saddle-700">Repeat Days</label>
                  <div className="flex gap-2 flex-wrap">
                    {DAY_LABELS.map((d, i) => (
                      <button key={i} type="button" onClick={() => toggleDay(i)}
                        className={`px-3 py-1 border-2 font-display text-xs uppercase transition-all ${
                          (form.repeatDays ?? []).includes(i)
                            ? "border-dirt bg-saddle-200 text-dirt"
                            : "border-saddle-500 bg-parchment-100 text-saddle-600"
                        }`}>{d}</button>
                    ))}
                  </div>
                </div>
              )}

              {form.scheduleType === "monthly" && (
                <div>
                  <label className="field-label !text-saddle-700">Day of Month (1–31)</label>
                  <input className="field-input" type="number"
                    value={form.repeatDayOfMonth ?? ""}
                    onChange={e => setForm(f => ({ ...f, repeatDayOfMonth: +e.target.value }))} />
                </div>
              )}

              {error && <p className="text-dusk font-body text-sm">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
                  {saving ? "Postin'…" : editing ? "Save Changes" : "Post Bounty"}
                </button>
                <button type="button" onClick={closeForm} className="btn-ghost px-5">Cancel</button>
              </div>

            </form>
          </div>
        </div>
      )}

      {loading ? (
        <p className="font-display text-parchment-500 uppercase tracking-widest animate-flicker text-center py-20">
          Scoutin' the board…
        </p>
      ) : bounties.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-display text-2xl uppercase tracking-widest text-parchment-600 mb-2">Board's Empty</p>
          <p className="font-body text-parchment-700 mb-6">No bounties posted yet. Start the day's work.</p>
          <button onClick={openNew} className="btn-primary">Post First Bounty</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {bounties.map(b => (
            <BountyCard key={b.id} bounty={b} isSheriff onEdit={openEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
