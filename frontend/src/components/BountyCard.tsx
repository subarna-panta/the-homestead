"use client";
import { useState } from "react";
import { BountyWithStatus } from "@/lib/api";
import { ATTRIBUTE_META } from "@/lib/titles";

interface Props {
  bounty: BountyWithStatus;
  isSheriff?: boolean;
  onClaim?: (id: number) => Promise<void>;
  onDelete?: (id: number) => void;
  onEdit?: (b: BountyWithStatus) => void;
}

const SCHEDULE_LABELS: Record<string, string> = {
  daily: "Daily", weekly: "Weekly", monthly: "Monthly", none: "Open Range",
};
const SCHEDULE_COLORS: Record<string, string> = {
  daily: "text-amber-600 border-amber-500",
  weekly: "text-blue-600 border-blue-500",
  monthly: "text-violet-600 border-violet-500",
  none: "text-saddle-500 border-saddle-400",
};
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function formatTime(time: string): string {
  // Convert "HH:MM" to "H:MM AM/PM"
  const [hhStr, mm] = time.split(":");
  const hh = parseInt(hhStr, 10);
  const ampm = hh >= 12 ? "PM" : "AM";
  const hour = hh % 12 === 0 ? 12 : hh % 12;
  return `${hour}:${mm} ${ampm}`;
}

function getScheduleLabel(bounty: BountyWithStatus): string {
  if (bounty.scheduleType === "daily") {
    if (bounty.scheduledTime) return `Daily by ${formatTime(bounty.scheduledTime)}`;
    return "Every Day";
  }
  if (bounty.scheduleType === "weekly") {
    if (bounty.repeatDays && bounty.repeatDays.length > 0) {
      const days = bounty.repeatDays.map(d => DAY_NAMES[d]).join(", ");
      return `Every ${days}`;
    }
    return "Weekly";
  }
  if (bounty.scheduleType === "monthly") {
    if (bounty.repeatDayOfMonth) {
      const d = bounty.repeatDayOfMonth;
      const suffix = d === 1 || d === 21 || d === 31 ? "st"
        : d === 2 || d === 22 ? "nd"
        : d === 3 || d === 23 ? "rd" : "th";
      return `Every ${d}${suffix} of the month`;
    }
    return "Monthly";
  }
  return "Open Range — No Deadline";
}

export default function BountyCard({ bounty, isSheriff, onClaim, onDelete, onEdit }: Props) {
  const [claiming, setClaiming] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const attr = ATTRIBUTE_META[bounty.attribute] ?? ATTRIBUTE_META.grit;
  const scheduleColor = SCHEDULE_COLORS[bounty.scheduleType] ?? SCHEDULE_COLORS.none;

  const handleClaim = async () => {
    if (!onClaim) return;
    setClaiming(true);
    try {
      await onClaim(bounty.id);
      setFlash("Submitted!");
    } catch (e: unknown) {
      setFlash(e instanceof Error ? e.message : "Error");
    } finally {
      setClaiming(false);
      setTimeout(() => setFlash(null), 3000);
    }
  };

  return (
    <div className={`wanted-poster p-5 relative flex flex-col gap-3 ${bounty.isOverdue && !bounty.claimed ? "ring-2 ring-dusk/60" : ""}`}>

      {/* Overdue banner */}
      {bounty.isOverdue && !bounty.claimed && bounty.claimStatus === "none" && (
        <div className="absolute top-0 left-0 right-0 border-b-2 border-red-600 px-3 py-1.5" style={{ background: "#7f1d1d33" }}>
          <p className="font-display text-[11px] uppercase tracking-widest" style={{ color: "#ef4444" }}>
            ⏰ Overdue{bounty.scheduledTime ? ` — was due at ${formatTime(bounty.scheduledTime)}` : " — past 9 PM deadline"}
          </p>
        </div>
      )}

      {/* Status stamps */}
      {bounty.claimStatus === "approved" && <div className="stamp-approved text-[10px]">✓ Approved</div>}
      {bounty.claimStatus === "declined" && <div className="stamp-declined text-[10px]">✗ Declined</div>}
      {bounty.claimStatus === "pending"  && <div className="stamp-pending text-[10px]">Pending…</div>}

      {/* Attribute + schedule badges */}
      <div className={`flex flex-wrap items-center gap-2 ${bounty.isOverdue && bounty.claimStatus === "none" ? "mt-6" : ""}`}>
        <span className={`badge-pill ${attr.border} ${attr.color} ${attr.bg}`}>
          {attr.emoji} {attr.label}
        </span>
        <span className={`badge-pill border ${scheduleColor} text-[10px]`}>
          {SCHEDULE_LABELS[bounty.scheduleType]}
        </span>
        {bounty.streakCount > 1 && (
          <span className="badge-pill border border-orange-400 text-orange-500">
            🔥 {bounty.streakCount}-day streak
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="font-display text-xl uppercase tracking-wider text-dirt leading-tight">{bounty.title}</h3>
      <p className="font-body text-saddle-700 text-sm leading-relaxed flex-1">{bounty.description}</p>

      {/* Schedule detail line */}
      <div className="flex items-center gap-1.5 text-saddle-500">
        <span className="text-xs">🗓</span>
        <span className="font-body text-xs">{getScheduleLabel(bounty)}</span>
        {bounty.isDueToday && !bounty.isOverdue && bounty.claimStatus === "none" && (
          <span className="ml-auto font-display text-[10px] uppercase tracking-wider text-amber-600 border border-amber-500 px-1.5 py-0.5">
            Due Today
          </span>
        )}
      </div>

      {/* Rewards */}
      <div className="flex items-center gap-4 border-t border-saddle-300 pt-3 mt-auto">
        <div className="flex items-center gap-1">
          <span className="text-gold text-sm">💰</span>
          <span className="font-display text-sm text-saddle-700">{bounty.goldReward} Gold</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs">⭐</span>
          <span className="font-display text-sm text-saddle-700">{bounty.xpReward} XP</span>
        </div>
      </div>

      {/* Cowboy actions */}
      {!isSheriff && onClaim && (
        <div className="mt-1">
          {flash ? (
            <p className="font-body text-xs text-center text-saddle-600 py-2">{flash}</p>
          ) : bounty.claimStatus === "none" ? (
            <button onClick={handleClaim} disabled={claiming}
              className="btn-primary w-full text-center disabled:opacity-50">
              {claiming ? "Submittin'…" : "Submit for Review"}
            </button>
          ) : bounty.claimStatus === "pending" ? (
            <p className="font-body text-xs text-center text-saddle-600 py-2">
              Waiting on the Sheriff's seal…
            </p>
          ) : bounty.claimStatus === "approved" ? (
            <p className="font-body text-xs text-center text-sage py-2">✓ Reward collected!</p>
          ) : (
            <p className="font-body text-xs text-center text-dusk py-2">Claim rejected. Try again tomorrow.</p>
          )}
        </div>
      )}

      {/* Sheriff actions */}
      {isSheriff && (
        <div className="flex gap-2 mt-1">
          {onEdit && (
            <button onClick={() => onEdit(bounty)} className="btn-ghost text-xs px-3 py-2 flex-1">Edit</button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(bounty.id)} className="btn-danger text-xs px-3 py-2 flex-1">Remove</button>
          )}
        </div>
      )}
    </div>
  );
}
