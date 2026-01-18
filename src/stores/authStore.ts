import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;

  // Actions
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  updateChips: (amount: number) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      token: null,

      login: (user, token) => {
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false
        });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false
        });
      },

      updateUser: (updates) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...updates } });
        }
      },

      updateChips: (amount) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, chips: user.chips + amount } });
        }
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      }
    }),
    {
      name: 'teen-patti-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

// Create a guest user for demo purposes
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
    createdAt: new Date()
  };
}
