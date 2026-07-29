import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { api, setAuthToken } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';
import type { User } from '@teen-patti/shared';
import { clearReferralAttribution, getPendingReferralAttribution } from '../services/referralAttribution';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  guestLogin: () => Promise<void>;
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
      const res = await api.post<{ user: User; token: string; referralAttribution?: { attributed: boolean } }>('/auth/guest', {
        username,
        adultConfirmed: true,
        referralCode: referral?.code,
        referralSource: referral?.source,
        referralCampaign: referral?.campaign,
      });
      if (referral) await clearReferralAttribution();
      await SecureStore.setItemAsync('auth_token', res.token);
      setAuthToken(res.token);
      connectSocket(res.token);
      set({ user: mapApiUser(res.user), token: res.token, isAuthenticated: true, isLoading: false });
    } catch (err) {
      console.error('[Auth] Guest login failed:', err);
      set({
        error: err instanceof Error ? err.message : 'Could not connect',
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  logout: () => {
    SecureStore.deleteItemAsync('auth_token').catch(() => {});
    setAuthToken(null);
    disconnectSocket();
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },

  restoreSession: async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) {
        set({ isLoading: false });
        return;
      }
      setAuthToken(token);
      const res = await api.get<{ user: User }>('/auth/me');
      connectSocket(token);
      set({ user: mapApiUser(res.user), token, isAuthenticated: true, isLoading: false });
    } catch {
      await SecureStore.deleteItemAsync('auth_token').catch(() => {});
      set({ isLoading: false });
    }
  },

  updateUser: (updates) => {
    const user = get().user;
    if (user) set({ user: { ...user, ...updates } });
  },
}));
