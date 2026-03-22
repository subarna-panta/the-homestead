"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, Pioneer } from "@/lib/api";
import { useRouter } from "next/navigation";

interface AuthCtx {
  user: Pioneer | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, password: string, role: "student" | "teacher", joinCode?: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Pioneer | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refresh = useCallback(async () => {
    try {
      const me = await api.auth.me();
      setUser(me);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const login = async (username: string, password: string) => {
    const { pioneer } = await api.auth.login({ username, password });
    setUser(pioneer);
    router.push(pioneer.isSheriff ? "/sheriff" : "/cowboy");
  };

  const signup = async (username: string, password: string, role: "student" | "teacher", joinCode?: string) => {
    const { pioneer } = await api.auth.signup({ username, password, role, joinCode });
    setUser(pioneer);
    router.push(pioneer.isSheriff ? "/sheriff" : "/cowboy");
  };

  const logout = async () => {
    await api.auth.logout();
    setUser(null);
    router.push("/auth/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
