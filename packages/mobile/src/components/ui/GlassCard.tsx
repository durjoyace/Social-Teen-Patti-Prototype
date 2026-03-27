import { type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { APPLE_SPRING_SNAPPY } from '../../theme/animations';

interface GlassCardProps {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  pressable?: boolean;
}

export function GlassCard({ children, onPress, style, pressable = true }: GlassCardProps) {
  const pressed = useSharedValue(false);

  const gesture = Gesture.Tap()
    .enabled(pressable && !!onPress)
    .onBegin(() => { pressed.value = true; })
    .onFinalize(() => { pressed.value = false; })
    .onEnd(() => { onPress?.(); });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withSpring(pressed.value ? 0.98 : 1, APPLE_SPRING_SNAPPY) },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.card, style, animatedStyle]}>
        {/* Top highlight */}
        <View style={styles.highlight} />
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});
