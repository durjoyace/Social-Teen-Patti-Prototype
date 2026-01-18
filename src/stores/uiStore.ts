import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'classic' | 'diwali' | 'holi' | 'royal';

interface UIState {
  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // Sound
  soundEnabled: boolean;
  musicEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
  toggleSound: () => void;
  toggleMusic: () => void;
  setMusicVolume: (volume: number) => void;
  setSfxVolume: (volume: number) => void;

  // Haptics
  hapticsEnabled: boolean;
  toggleHaptics: () => void;

  // Notifications
  notificationsEnabled: boolean;
  toggleNotifications: () => void;

  // Tutorial
  hasSeenOnboarding: boolean;
  setHasSeenOnboarding: (seen: boolean) => void;

  // Modals
  activeModal: string | null;
  openModal: (modal: string) => void;
  closeModal: () => void;

  // Loading states
  isLoading: boolean;
  loadingMessage: string;
  setLoading: (loading: boolean, message?: string) => void;

  // Toast notifications
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;

  // Animation preferences
  reducedMotion: boolean;
  toggleReducedMotion: () => void;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Theme
      theme: 'diwali',
      setTheme: (theme) => set({ theme }),

      // Sound
      soundEnabled: true,
      musicEnabled: true,
      musicVolume: 0.5,
      sfxVolume: 0.7,
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      toggleMusic: () => set((state) => ({ musicEnabled: !state.musicEnabled })),
      setMusicVolume: (volume) => set({ musicVolume: volume }),
      setSfxVolume: (volume) => set({ sfxVolume: volume }),

      // Haptics
      hapticsEnabled: true,
      toggleHaptics: () => set((state) => ({ hapticsEnabled: !state.hapticsEnabled })),

      // Notifications
      notificationsEnabled: true,
      toggleNotifications: () => set((state) => ({ notificationsEnabled: !state.notificationsEnabled })),

      // Tutorial
      hasSeenOnboarding: false,
      setHasSeenOnboarding: (seen) => set({ hasSeenOnboarding: seen }),

      // Modals
      activeModal: null,
      openModal: (modal) => set({ activeModal: modal }),
      closeModal: () => set({ activeModal: null }),

      // Loading
      isLoading: false,
      loadingMessage: '',
      setLoading: (loading, message = '') => set({ isLoading: loading, loadingMessage: message }),

      // Toasts
      toasts: [],
      addToast: (toast) => {
        const id = crypto.randomUUID();
        set((state) => ({
          toasts: [...state.toasts, { ...toast, id }]
        }));
        // Auto remove after duration
        setTimeout(() => {
          get().removeToast(id);
        }, toast.duration || 3000);
      },
      removeToast: (id) => set((state) => ({
        toasts: state.toasts.filter(t => t.id !== id)
      })),

      // Animation
      reducedMotion: false,
      toggleReducedMotion: () => set((state) => ({ reducedMotion: !state.reducedMotion }))
    }),
    {
      name: 'teen-patti-ui',
      partialize: (state) => ({
        theme: state.theme,
        soundEnabled: state.soundEnabled,
        musicEnabled: state.musicEnabled,
        musicVolume: state.musicVolume,
        sfxVolume: state.sfxVolume,
        hapticsEnabled: state.hapticsEnabled,
        notificationsEnabled: state.notificationsEnabled,
        hasSeenOnboarding: state.hasSeenOnboarding,
        reducedMotion: state.reducedMotion
      })
    }
  )
);

// Utility hooks
export const useToast = () => {
  const addToast = useUIStore((state) => state.addToast);

  return {
    success: (message: string) => addToast({ message, type: 'success' }),
    error: (message: string) => addToast({ message, type: 'error' }),
    info: (message: string) => addToast({ message, type: 'info' }),
    warning: (message: string) => addToast({ message, type: 'warning' })
  };
};
