const GRIT_TITLES = [
  "Dust-Kicker","Prickly Pear Picker","Rattlesnake Wrangler",
  "Sunset Sentinel","Buffalo Brave","Frontier Fire-Starter",
  "Iron-Hoof Rider","Cactus King","Indomitable Scout",
];
const LABOR_TITLES = [
  "Stagecoach Shield","Homestead Hero","Wagon-Wheel Warden",
  "Gold-Pan Pro","Rustler's Ruin","Dusty Boot Duke",
  "Iron-Horse Engineer","Lawman of the Ledger","Territory Titan",
];
const WISDOM_TITLES = [
  "Sagebrush Scout","Canyon Crawler","Mesa Maverick",
  "Prairie Dog Whisperer","Silver-Tongue Orator","Coyote Caller",
  "Bullseye Buster","Quick-Draw Quiller","Scholar of the Sagebrush",
];
const HONOR_TITLES = [
  "Tin-Star Apprentice","Sarsaparilla Sipper","Gilded Spur",
  "High-Plains Drifter","Badlands Bandit-Catcher","Bandit's Bane",
  "Wild-Rose Wrangler","Thunder-Hoof Tracker","Sheriff's Right Hand",
];
const LEGEND_TITLES = ["The Maverick","Frontier Legend","Eternal Legend of the West"];

export function calculateTitle(grit: number, labor: number, wisdom: number, honor: number, xp: number): string {
  if (xp >= 2500) return LEGEND_TITLES[Math.min(Math.floor(xp / 1000) % LEGEND_TITLES.length, LEGEND_TITLES.length - 1)];
  const max = Math.max(grit, labor, wisdom, honor);
  if (max === 0) return GRIT_TITLES[0];
  const tops = [
    { pts: grit, titles: GRIT_TITLES },
    { pts: labor, titles: LABOR_TITLES },
    { pts: wisdom, titles: WISDOM_TITLES },
    { pts: honor, titles: HONOR_TITLES },
  ].filter(x => x.pts === max);
  if (tops.length > 1) return LEGEND_TITLES[Math.min(Math.floor(xp / 800) % LEGEND_TITLES.length, LEGEND_TITLES.length - 1)];
  return tops[0].titles[Math.min(Math.floor(xp / 300), tops[0].titles.length - 1)];
}

export const ATTRIBUTE_META = {
  grit:   { label: "Grit",   emoji: "🔥", color: "text-red-400",    bg: "bg-red-950/40",    border: "border-red-800",   desc: "Self-Care & Resilience", barColor: "#f87171" },
  labor:  { label: "Labor",  emoji: "⚒️",  color: "text-amber-400",  bg: "bg-amber-950/40",  border: "border-amber-800", desc: "Chores & Work",           barColor: "#fbbf24" },
  wisdom: { label: "Wisdom", emoji: "📖", color: "text-blue-400",   bg: "bg-blue-950/40",   border: "border-blue-800",  desc: "Learning & Knowledge",    barColor: "#60a5fa" },
  honor:  { label: "Honor",  emoji: "🌟", color: "text-purple-400", bg: "bg-purple-950/40", border: "border-purple-800",desc: "Kindness & Character",    barColor: "#c084fc" },
} as const;

export type Attribute = keyof typeof ATTRIBUTE_META;

export const BADGES = [
  { key: "midnight_owl",  label: "The Midnight Owl",  emoji: "🦉", desc: "Great bedtime routine" },
  { key: "sharpest_spur", label: "The Sharpest Spur", emoji: "⚡", desc: "Finished chores before noon" },
  { key: "peacekeeper",   label: "The Peacekeeper",   emoji: "🕊️", desc: "Helped a sibling" },
  { key: "iron_gut",      label: "The Iron Gut",      emoji: "🥗", desc: "Ate all their healthy meals" },
] as const;

export function clsx(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
