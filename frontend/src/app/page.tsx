"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/auth/login");
    else if (user.isSheriff) router.replace("/sheriff");
    else router.replace("/cowboy");
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="font-display text-2xl uppercase tracking-widest text-parchment-400 animate-flicker">
        Riding into the Homestead…
      </p>
    </div>
  );
}
