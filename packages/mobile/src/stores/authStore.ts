import { useGameStore } from "./gameStore";
import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import {
  api,
  setAuthToken,
  saveTokens,
  getAuthToken,
  ApiError,
} from "../services/api";
import { connectSocket, disconnectSocket } from "../services/socket";
import type { User } from "@teen-patti/shared";
import {
  clearReferralAttribution,
  getPendingReferralAttribution,
} from "../services/referralAttribution";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  guestLogin: () => Promise<void>;
  upgradeAccount: (email: string, password: string) => Promise<void>;
  accountLogin: (
    email: string,
    password: string,
    username?: string,
  ) => Promise<void>;
  logout: () => void;
  restoreSession: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

function mapApiUser(user: any): User {
  return {
    ...user,
    chips: Number(user.chips || 0),
    biggestWin: Number(user.biggestWin || 0),
    totalWinnings: Number(user.totalWinnings || 0),
    beliBalance: Number(user.beliBalance || 0),
    lastSeen: new Date(user.lastSeen || Date.now()),
    createdAt: new Date(user.createdAt || Date.now()),
  } as User;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  guestLogin: async () => {
    try {
      set({ isLoading: true, error: null });
      const username = `Guest_${Math.random().toString(36).slice(2, 8)}`;
      const referral = await getPendingReferralAttribution();
      const res = await api.post<{
        user: User;
        token: string;
        refreshToken: string;
        referralAttribution?: { attributed: boolean };
      }>("/auth/guest", {
        username,
        adultConfirmed: true,
        referralCode: referral?.code,
        referralSource: referral?.source,
        referralCampaign: referral?.campaign,
      });
      if (referral) await clearReferralAttribution();
      await saveTokens(res.token, res.refreshToken);
      setAuthToken(res.token);
      connectSocket(res.token);
      set({
        user: mapApiUser(res.user),
        token: res.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      console.error("[Auth] Guest login failed:", err);
      set({
        error: err instanceof Error ? err.message : "Could not connect",
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  upgradeAccount: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post<{
        user: User;
        token: string;
        refreshToken: string;
      }>("/auth/upgrade", { email, password });
      await saveTokens(res.token, res.refreshToken);
      disconnectSocket();
      connectSocket(res.token);
      set({ user: mapApiUser(res.user), token: res.token, isLoading: false });
    } catch (e) {
      set({
        isLoading: false,
        error: e instanceof Error ? e.message : "Could not save account",
      });
    }
  },
  accountLogin: async (email, password, username) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post<{
        user: User;
        token: string;
        refreshToken: string;
      }>(username ? "/auth/register" : "/auth/login", {
        email,
        password,
        username,
        adultConfirmed: true,
      });
      await saveTokens(res.token, res.refreshToken);
      connectSocket(res.token);
      set({
        user: mapApiUser(res.user),
        token: res.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (e) {
      set({
        isLoading: false,
        error: e instanceof Error ? e.message : "Could not sign in",
      });
    }
  },
  logout: () => {
    useGameStore.setState({
      gameState: null,
      serverGameState: null,
      roomSnapshot: null,
      currentRoom: null,
      myCards: [],
      availableActions: [],
      isOnlineMode: false,
    });
    void api.post("/auth/logout").catch(() => {});
    void SecureStore.deleteItemAsync("refresh_token");
    SecureStore.deleteItemAsync("auth_token").catch(() => {});
    setAuthToken(null);
    disconnectSocket();
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },

  restoreSession: async () => {
    try {
      const token = await SecureStore.getItemAsync("auth_token");
      if (!token) {
        set({ isLoading: false });
        return;
      }
      setAuthToken(token);
      const res = await api.get<{ user: User }>("/auth/me");
      const currentToken = getAuthToken() || token;
      connectSocket(currentToken);
      set({
        user: mapApiUser(res.user),
        token: currentToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      if (error instanceof ApiError && [401, 403].includes(error.status)) {
        await SecureStore.deleteItemAsync("auth_token");
        await SecureStore.deleteItemAsync("refresh_token");
        setAuthToken(null);
        set({
          isLoading: false,
          isAuthenticated: false,
          user: null,
          token: null,
          error: "Please sign in again",
        });
      } else
        set({
          isLoading: false,
          error: "Connection unavailable. Retry to restore your saved session.",
        });
    }
  },

  updateUser: (updates) => {
    const user = get().user;
    if (user) set({ user: { ...user, ...updates } });
  },
}));
