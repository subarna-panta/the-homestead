"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Nav from "@/components/Nav";

export default function SheriffLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !user.isSheriff)) {
      router.replace(user ? "/cowboy" : "/auth/login");
    }
  }, [user, loading, router]);

  if (loading || !user?.isSheriff) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="font-display text-parchment-400 uppercase tracking-widest animate-flicker">Loading…</p>
    </div>
  );

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
