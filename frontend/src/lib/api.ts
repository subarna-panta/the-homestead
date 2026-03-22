export type Role = "student" | "teacher";

export interface Pioneer {
  id: number;
  username: string;
  gold: number;
  xp: number;
  isSheriff: boolean;
  role: Role;
  gritPoints: number;
  laborPoints: number;
  wisdomPoints: number;
  honorPoints: number;
  gritMeter: number;
  streakPenalty: boolean;
  streakRebuildCount: number;
  badges: string[];
  joinCode?: string;
  sheriffId?: number;
}

export interface BountyWithStatus {
  id: number;
  title: string;
  description: string;
  goldReward: number;
  xpReward: number;
  attribute: "grit" | "labor" | "wisdom" | "honor";
  scheduleType: "daily" | "weekly" | "monthly" | "none";
  scheduledTime: string | null;
  repeatDays: number[] | null;
  repeatDayOfMonth: number | null;
  createdAt: string;
  isDueToday: boolean;
  isOverdue: boolean;
  claimed: boolean;
  claimStatus: "none" | "pending" | "approved" | "declined";
  claimedAt: string | null;
  streakCount: number;
}

export interface PendingClaim {
  claimId: number;
  bountyId: number;
  pioneerId: number;
  streakCount: number;
  date: string;
  claimedAt: string;
  bountyTitle: string;
  attribute: string;
  goldReward: number;
  xpReward: number;
  pioneerUsername: string;
}

export interface StoreItem {
  id?: number;
  key: string;
  name: string;
  description: string;
  gold: number;
  emoji: string;
  isActive?: boolean;
}

export interface StoreResponse {
  items: StoreItem[];
  cowboyGold: number;
  purchases: { itemKey: string; purchasedAt: string }[];
}

export interface PurchaseRecord {
  id: number;
  pioneerUsername: string;
  itemKey: string;
  itemName: string;
  itemEmoji: string;
  goldCost: number;
  status: "pending" | "delivered" | "denied";
  purchasedAt: string;
}

export interface LeaderboardEntry {
  id: number;
  username: string;
  xp: number;
  gold: number;
  gritPoints: number;
  laborPoints: number;
  wisdomPoints: number;
  honorPoints: number;
  role: Role;
  isSheriff: boolean;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api/${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data as T;
}

export const api = {
  auth: {
    signup: (body: { username: string; password: string; role: Role; joinCode?: string }) =>
      request<{ pioneer: Pioneer; message: string }>("auth/signup", { method: "POST", body: JSON.stringify(body) }),
    login: (body: { username: string; password: string }) =>
      request<{ pioneer: Pioneer; message: string }>("auth/login", { method: "POST", body: JSON.stringify(body) }),
    logout: () => request<{ message: string }>("auth/logout", { method: "POST" }),
    me: () => request<Pioneer>("auth/me"),
  },
  bounties: {
    list: () => request<BountyWithStatus[]>("bounties"),
    create: (body: Partial<BountyWithStatus>) =>
      request<BountyWithStatus>("bounties", { method: "POST", body: JSON.stringify(body) }),
    update: (id: number, body: Partial<BountyWithStatus>) =>
      request<BountyWithStatus>(`bounties/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    delete: (id: number) => request<{ message: string }>(`bounties/${id}`, { method: "DELETE" }),
    claim: (id: number) => request<{ message: string; claimId: number }>(`bounties/${id}/claim`, { method: "POST" }),
    pendingClaims: () => request<PendingClaim[]>("bounties/pending-claims"),
    approve: (claimId: number, pioneerId: number) =>
      request<{ message: string; goldAwarded: number; streakBonus: boolean }>(
        `bounties/${claimId}/approve`, { method: "POST", body: JSON.stringify({ pioneerId }) }),
    decline: (claimId: number, pioneerId: number) =>
      request<{ message: string }>(`bounties/${claimId}/decline`, { method: "POST", body: JSON.stringify({ pioneerId }) }),
  },
  store: {
    get: () => request<StoreResponse>("store"),
    purchase: (itemKey: string) =>
      request<{ message: string; remainingGold: number }>("store", { method: "POST", body: JSON.stringify({ itemKey }) }),
    purchases: () => request<PurchaseRecord[]>("store/purchases"),
    purchaseAction: (purchaseId: number, action: "delivered" | "denied") =>
      request<{ message: string }>(`store/purchases/${purchaseId}/action`, { method: "POST", body: JSON.stringify({ action }) }),
    admin: {
      list: () => request<StoreItem[]>("store/admin"),
      create: (body: Partial<StoreItem>) =>
        request<StoreItem>("store/admin", { method: "POST", body: JSON.stringify(body) }),
      update: (id: number, body: Partial<StoreItem>) =>
        request<StoreItem>(`store/admin/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
      delete: (id: number) =>
        request<{ message: string }>(`store/admin/${id}`, { method: "DELETE" }),
    },
  },
  leaderboard: {
    get: () => request<LeaderboardEntry[]>("leaderboard"),
  },
};
