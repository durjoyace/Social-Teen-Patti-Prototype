import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
import { api } from '../services/api';
import { socketService } from '../services/socket';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  error: string | null;
  isOnline: boolean;

  // Actions
  loginAsGuest: () => Promise<void>;
  loginWithCredentials: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
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

      loginAsGuest: async () => {
        set({ isLoading: true, error: null });
        try {
          const { user, token } = await api.guestLogin();
          const mappedUser = mapApiUser(user);

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
          // Fallback to offline guest mode
          const offlineUser = createGuestUser();
          set({
            user: offlineUser,
            token: 'offline',
            isAuthenticated: true,
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

      register: async (username, email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { user, token } = await api.register(username, email, password);
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
          // Silent fail
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

// Create a guest user for offline/demo mode
export function createGuestUser(): User {
  return {
    id: crypto.randomUUID(),
    username: `Guest_${Math.floor(Math.random() * 10000)}`,
    chips: 10000,
    totalGames: 0,
    gamesWon: 0,
    biggestWin: 0,
    currentStreak: 0,
    bestStreak: 0,
    level: 1,
    experience: 0,
    isOnline: true,
    lastSeen: new Date(),
    createdAt: new Date(),
  };
}
