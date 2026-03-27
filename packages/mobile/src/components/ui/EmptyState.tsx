import { type ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { PressableButton } from './PressableButton';

interface EmptyStateProps {
  emoji: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ emoji, title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Animated.Text entering={FadeIn.delay(100)} style={styles.emoji}>
        {emoji}
      </Animated.Text>
      <Animated.Text entering={FadeInDown.delay(200)} style={styles.title}>
        {title}
      </Animated.Text>
      {subtitle && (
        <Animated.Text entering={FadeInDown.delay(300)} style={styles.subtitle}>
          {subtitle}
        </Animated.Text>
      )}
      {actionLabel && onAction && (
        <Animated.View entering={FadeInDown.delay(400)}>
          <PressableButton onPress={onAction} variant="primary">
            <Text style={styles.actionText}>{actionLabel}</Text>
          </PressableButton>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '600', color: '#ffffff', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', maxWidth: 280, marginBottom: 24 },
  actionText: { color: '#ffffff', fontWeight: '600', fontSize: 14 },
});
