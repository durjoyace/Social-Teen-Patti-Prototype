import * as Haptics from 'expo-haptics';

export function useHaptics() {
  return {
    onButtonPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    onTurn: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
    onWin: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    onError: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
    selection: () => Haptics.selectionAsync(),
  };
}
