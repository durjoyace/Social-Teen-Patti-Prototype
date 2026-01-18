import { useCallback } from 'react';
import { useUIStore } from '../stores/uiStore';

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

// Vibration patterns in milliseconds
const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 30],
  warning: [30, 30, 30],
  error: [50, 100, 50],
  selection: 5
};

export function useHaptics() {
  const { hapticsEnabled } = useUIStore();

  const vibrate = useCallback((pattern: HapticPattern) => {
    if (!hapticsEnabled) return;

    // Check if vibration API is supported
    if ('vibrate' in navigator) {
      const vibrationPattern = HAPTIC_PATTERNS[pattern];
      navigator.vibrate(vibrationPattern);
    }
  }, [hapticsEnabled]);

  // Haptic feedback for common actions
  const onButtonPress = useCallback(() => {
    vibrate('light');
  }, [vibrate]);

  const onCardFlip = useCallback(() => {
    vibrate('medium');
  }, [vibrate]);

  const onBet = useCallback(() => {
    vibrate('medium');
  }, [vibrate]);

  const onWin = useCallback(() => {
    vibrate('success');
  }, [vibrate]);

  const onLose = useCallback(() => {
    vibrate('error');
  }, [vibrate]);

  const onTurn = useCallback(() => {
    vibrate('warning');
  }, [vibrate]);

  const onSelection = useCallback(() => {
    vibrate('selection');
  }, [vibrate]);

  return {
    vibrate,
    onButtonPress,
    onCardFlip,
    onBet,
    onWin,
    onLose,
    onTurn,
    onSelection
  };
}
