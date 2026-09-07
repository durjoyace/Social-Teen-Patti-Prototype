import { usePreferences } from "../stores/preferences";
import * as Haptics from "expo-haptics";

export function useHaptics() {
  return {
    onButtonPress: () =>
      usePreferences.getState().haptics
        ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        : Promise.resolve(),
    onTurn: () =>
      usePreferences.getState().haptics
        ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
        : Promise.resolve(),
    onWin: () =>
      usePreferences.getState().haptics
        ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        : Promise.resolve(),
    onError: () =>
      usePreferences.getState().haptics
        ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        : Promise.resolve(),
    selection: () =>
      usePreferences.getState().haptics
        ? Haptics.selectionAsync()
        : Promise.resolve(),
  };
}
