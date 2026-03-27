import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { api, setAuthToken } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';
import type { User } from '@teen-patti/shared';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  guestLogin: () => Promise<void>;
  logout: () => void;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  guestLogin: async () => {
    try {
      set({ isLoading: true });
      const username = `Guest_${Math.random().toString(36).slice(2, 8)}`;
      const res = await api.post<{ user: User; token: string }>('/auth/guest', { username });
      await SecureStore.setItemAsync('auth_token', res.token);
      setAuthToken(res.token);
      connectSocket(res.token);
      set({ user: res.user, token: res.token, isAuthenticated: true, isLoading: false });
    } catch (err) {
      console.error('[Auth] Guest login failed:', err);
      // Offline fallback — create local guest
      const offlineUser: User = {
        id: crypto.randomUUID(),
        username: `Guest_${Math.random().toString(36).slice(2, 8)}`,
        chips: 10000,
        diamonds: 0,
        level: 1,
        experience: 0,
        totalGames: 0,
        gamesWon: 0,
        biggestWin: 0,
        totalWinnings: 0,
        totalLosses: 0,
        currentStreak: 0,
        bestStreak: 0,
        handsPlayed: 0,
        vipTier: 'bronze',
        vipPoints: 0,
        isGuest: true,
      };
      set({ user: offlineUser, token: null, isAuthenticated: true, isLoading: false });
    }
  },

  logout: () => {
    SecureStore.deleteItemAsync('auth_token').catch(() => {});
    setAuthToken(null);
    disconnectSocket();
    set({ user: null, token: null, isAuthenticated: false });
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
      set({ user: res.user, token, isAuthenticated: true, isLoading: false });
    } catch {
      await SecureStore.deleteItemAsync('auth_token').catch(() => {});
      set({ isLoading: false });
    }
  },
}));
