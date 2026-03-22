"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { calculateTitle } from "@/lib/titles";

interface NavItem { href: string; label: string; emoji: string }

const SHERIFF_NAV: NavItem[] = [
  { href: "/sheriff",          label: "Command",  emoji: "🔰" },
  { href: "/sheriff/bounties", label: "Bounties", emoji: "📜" },
  { href: "/sheriff/ledger",   label: "Ledger",   emoji: "⚖️" },
  { href: "/sheriff/store",    label: "Store",    emoji: "🛒" },
  { href: "/sheriff/posse",    label: "Posse",    emoji: "🏅" },
];

const COWBOY_NAV: NavItem[] = [
  { href: "/cowboy",              label: "Homestead",  emoji: "🏠" },
  { href: "/cowboy/bounties",     label: "Board",      emoji: "📋" },
  { href: "/cowboy/leaderboard",  label: "Rankings",   emoji: "🏆" },
  { href: "/cowboy/store",        label: "Store",      emoji: "🛒" },
  { href: "/cowboy/profile",      label: "Profile",    emoji: "👤" },
];

export default function Nav() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  if (!user) return null;

  const nav = user.isSheriff ? SHERIFF_NAV : COWBOY_NAV;
  const title = calculateTitle(user.gritPoints, user.laborPoints, user.wisdomPoints, user.honorPoints, user.xp);

  return (
    <header className="border-b border-saddle-900/60 bg-dirt/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-4 h-14">
        {/* Brand */}
        <Link href={user.isSheriff ? "/sheriff" : "/cowboy"}
          className="font-display text-lg uppercase tracking-widest text-gold mr-4 shrink-0">
          🤠 Homestead
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1 overflow-x-auto flex-1">
          {nav.map(item => {
            const active = pathname === item.href || (item.href !== "/sheriff" && item.href !== "/cowboy" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                className={active ? "nav-link-active" : "nav-link"}>
                <span className="mr-1">{item.emoji}</span>{item.label}
              </Link>
            );
          })}
        </nav>

        {/* User chip */}
        <div className="flex items-center gap-3 ml-auto shrink-0">
          <div className="hidden sm:block text-right">
            <p className="font-display text-xs text-parchment-300 uppercase tracking-wider">{user.username}</p>
            <p className="font-body text-[10px] text-parchment-600">{title}</p>
          </div>
          {!user.isSheriff && (
            <div className="flex items-center gap-1 bg-saddle-900/60 border border-saddle-700 px-2 py-1">
              <span className="text-gold text-sm">💰</span>
              <span className="font-display text-xs text-gold">{user.gold}</span>
            </div>
          )}
          <button onClick={logout}
            className="font-display text-xs uppercase tracking-widest text-parchment-600 hover:text-parchment-300 transition-colors">
            Leave
          </button>
        </div>
      </div>
    </header>
  );
}
