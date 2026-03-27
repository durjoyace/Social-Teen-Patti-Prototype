import { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  useDerivedValue,
  useAnimatedProps,
  runOnJS,
} from 'react-native-reanimated';
import { TextInput, StyleSheet } from 'react-native';
import { formatChips } from '@teen-patti/shared';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface AnimatedChipCountProps {
  value: number;
  prefix?: string;
  style?: any;
  duration?: number;
}

export function AnimatedChipCount({ value, prefix = '', style, duration = 400 }: AnimatedChipCountProps) {
  const animatedValue = useSharedValue(value);
  const flashColor = useSharedValue(0); // 0=normal, 1=green, -1=red
  const scale = useSharedValue(1);

  useEffect(() => {
    const prev = animatedValue.value;
    if (prev === value) return;

    flashColor.value = value > prev ? 1 : -1;
    scale.value = withSequence(
      withSpring(1.15, { stiffness: 400, damping: 30 }),
      withSpring(1, { stiffness: 350, damping: 28 })
    );
    animatedValue.value = withTiming(value, { duration });

    // Reset flash
    setTimeout(() => { flashColor.value = 0; }, duration);
  }, [value]);

  const animatedProps = useAnimatedProps(() => {
    const text = `${prefix}${formatChips(Math.round(animatedValue.value))}`;
    return { text, defaultValue: text };
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    color:
      flashColor.value > 0
        ? '#34d399' // emerald-400
        : flashColor.value < 0
          ? '#f87171' // red-400
          : (style?.color || '#ffffff'),
  }));

  return (
    <AnimatedTextInput
      editable={false}
      underlineColorAndroid="transparent"
      animatedProps={animatedProps}
      style={[styles.base, style, animatedStyle]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
    padding: 0,
    margin: 0,
  },
});
