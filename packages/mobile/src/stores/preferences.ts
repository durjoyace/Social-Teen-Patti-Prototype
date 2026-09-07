import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import * as SecureStore from "expo-secure-store";
export const usePreferences = create<{
  sound: boolean;
  haptics: boolean;
  notifications: boolean;
  locale: string;
  set: (
    key: "sound" | "haptics" | "notifications" | "locale",
    value: boolean | string,
  ) => void;
}>()(
  persist(
    (set) => ({
      sound: true,
      haptics: true,
      notifications: true,
      locale: "en",
      set: (key, value) => set({ [key]: value }),
    }),
    {
      name: "preferences",
      storage: createJSONStorage(() => ({
        getItem: SecureStore.getItemAsync,
        setItem: SecureStore.setItemAsync,
        removeItem: SecureStore.deleteItemAsync,
      })),
    },
  ),
);
