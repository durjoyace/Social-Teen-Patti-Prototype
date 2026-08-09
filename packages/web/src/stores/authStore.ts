import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ReferralAttribution, User } from '../types';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import { clearReferralAttribution, getPendingReferralAttribution } from '../services/referralAttribution';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  error: string | null;
  isOnline: boolean;

  // Actions
  loginAsGuest: (referral?: ReferralAttribution | null) => Promise<void>;
  loginWithCredentials: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, referral?: ReferralAttribution | null) => Promise<void>;
  upgradeAccount: (data: { username?: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  updateChips: (amount: number) => void;
  setLoading: (loading: boolean) => void;
  setOnline: (online: boolean) => void;
  clearError: () => void;

  // Legacy support
  login: (user: User, token: string) => void;
}

function mapApiUser(apiUser: any): User {
  return {
    id: apiUser.id,
    username: apiUser.username,
    email: apiUser.email,
    avatarUrl: apiUser.avatarUrl,
    chips: parseInt(apiUser.chips || '10000'),
    totalGames: apiUser.totalGames || 0,
    gamesWon: apiUser.gamesWon || 0,
    biggestWin: parseInt(apiUser.biggestWin || '0'),
    currentStreak: apiUser.currentStreak || 0,
    bestStreak: apiUser.bestStreak || 0,
    level: apiUser.level || 1,
    experience: apiUser.experience || 0,
    isOnline: apiUser.isOnline ?? true,
    lastSeen: new Date(apiUser.lastSeen || Date.now()),
    createdAt: new Date(apiUser.createdAt || Date.now()),
    // Extended fields
    diamonds: apiUser.diamonds || 0,
    beliBalance: apiUser.beliBalance || 0,
    referralCode: apiUser.referralCode || undefined,
    vipTier: apiUser.vipTier || 'BRONZE',
    vipPoints: apiUser.vipPoints || 0,
    totalWinnings: parseInt(apiUser.totalWinnings || '0'),
    isGuest: apiUser.isGuest ?? true,
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      token: null,
      error: null,
      isOnline: true,

      loginAsGuest: async (referral) => {
        set({ isLoading: true, error: null });
        try {
          const pendingReferral = referral ?? getPendingReferralAttribution();
          const { user, token } = await api.guestLogin(undefined, pendingReferral);
          const mappedUser = mapApiUser(user);
          if (pendingReferral) clearReferralAttribution();

          // Connect socket
          try {
            await socketService.connect();
          } catch (e) {
            console.warn('Socket connection failed, continuing in offline mode:', e);
          }

          set({
            user: mappedUser,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Could not connect',
            isLoading: false,
            isOnline: false,
          });
        }
      },

      loginWithCredentials: async (usernameOrEmail, password) => {
        set({ isLoading: true, error: null });
        try {
          const { user, token } = await api.login(usernameOrEmail, password);
          await socketService.connect();

          set({
            user: mapApiUser(user),
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false,
          });
        }
      },

      register: async (username, email, password, referral) => {
        set({ isLoading: true, error: null });
        try {
          const pendingReferral = referral ?? getPendingReferralAttribution();
          const { user, token } = await api.register(username, email, password, pendingReferral);
          if (pendingReferral) clearReferralAttribution();
          await socketService.connect();

          set({
            user: mapApiUser(user),
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Registration failed',
            isLoading: false,
          });
        }
      },

      upgradeAccount: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const { user, token } = await api.upgradeAccount(data);
          set({
            user: mapApiUser(user),
            token,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Upgrade failed',
            isLoading: false,
          });
        }
      },

      logout: () => {
        socketService.disconnect();
        api.clearTokens();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      refreshProfile: async () => {
        try {
          const { user } = await api.getProfile();
          set({ user: mapApiUser(user) });
        } catch {
          if (!api.getToken()) {
            socketService.disconnect();
            set({ user: null, token: null, isAuthenticated: false });
          }
          // Temporary network failures preserve the current returning session.
        }
      },

      // Legacy support for existing components
      login: (user, token) => {
        set({ user, token, isAuthenticated: true, isLoading: false });
      },

      updateUser: (updates) => {
        const { user } = get();
        if (user) set({ user: { ...user, ...updates } });
      },

      updateChips: (amount) => {
        const { user } = get();
        if (user) set({ user: { ...user, chips: user.chips + amount } });
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setOnline: (online) => set({ isOnline: online }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'teen-patti-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
