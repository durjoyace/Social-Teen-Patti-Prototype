import { type ReactNode } from 'react';
import { StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { APPLE_SPRING_SNAPPY } from '../../theme/animations';

interface PressableButtonProps {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  style?: ViewStyle;
}

const variantStyles: Record<string, ViewStyle> = {
  primary: { backgroundColor: '#d97706' },
  secondary: { backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  danger: { backgroundColor: '#dc2626' },
  ghost: { backgroundColor: 'transparent' },
};

export function PressableButton({
  children,
  onPress,
  disabled = false,
  variant = 'primary',
  style,
}: PressableButtonProps) {
  const pressed = useSharedValue(false);

  const gesture = Gesture.Tap()
    .enabled(!disabled)
    .onBegin(() => {
      pressed.value = true;
    })
    .onFinalize(() => {
      pressed.value = false;
    })
    .onEnd(() => {
      if (onPress) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withSpring(pressed.value ? 0.97 : 1, APPLE_SPRING_SNAPPY) },
    ],
    opacity: disabled ? 0.4 : 1,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          styles.base,
          variantStyles[variant],
          style,
          animatedStyle,
        ]}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
});
