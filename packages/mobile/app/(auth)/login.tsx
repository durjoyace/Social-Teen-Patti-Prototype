import { useState } from 'react';
import { Linking, View, Text, StyleSheet, Pressable } from 'react-native';
import Constants from 'expo-constants';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useAuthStore } from '../../src/stores/authStore';
import { PressableButton } from '../../src/components/ui';
import { colors } from '../../src/theme/tokens';

export default function LoginScreen() {
  const { guestLogin, isLoading, error } = useAuthStore();
  const [isAdult, setIsAdult] = useState(false);
  const legalUrl = `${process.env.EXPO_PUBLIC_APP_URL || Constants.expoConfig?.extra?.appUrl || 'https://social-teen-patti.vercel.app'}/legal.html`;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Logo */}
      <Animated.View entering={FadeIn.delay(200).springify()} style={styles.logoWrap}>
        <Text style={styles.logoEmoji}>🃏</Text>
      </Animated.View>

      {/* Title */}
      <Animated.Text entering={FadeInDown.delay(400).springify()} style={styles.title}>
        Social Teen Patti
      </Animated.Text>
      <Animated.Text entering={FadeInDown.delay(500)} style={styles.subtitle}>
        Your private table, one tap away
      </Animated.Text>

      {/* Buttons */}
      <Animated.View entering={FadeInDown.delay(700)} style={styles.buttons}>
        <Pressable onPress={() => setIsAdult(value => !value)} style={styles.ageRow} accessibilityRole="checkbox" accessibilityState={{ checked: isAdult }}>
          <View style={[styles.checkbox, isAdult && styles.checkboxChecked]}><Text style={styles.checkmark}>{isAdult ? '✓' : ''}</Text></View>
          <Text style={styles.ageText}>I confirm I am 18 or older</Text>
        </Pressable>
        <PressableButton
          onPress={guestLogin}
          variant="primary"
          disabled={isLoading || !isAdult}
          style={styles.mainButton}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Joining...' : 'Play as Guest'}
          </Text>
        </PressableButton>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PressableButton variant="secondary" style={styles.secondaryButton} disabled>
          <Text style={styles.secondaryText}>Google sign-in coming soon</Text>
        </PressableButton>
      </Animated.View>

      {/* Footer */}
      <Animated.Text entering={FadeIn.delay(1000)} style={styles.footer}>
        18+ only • Play for entertainment • Club Points have no cash value
      </Animated.Text>
      <Pressable onPress={() => void Linking.openURL(legalUrl)} style={styles.legalLink} accessibilityRole="link">
        <Text style={styles.legalText}>Terms • Privacy • Responsible play</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderWidth: 2,
    borderColor: colors.goldMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  logoEmoji: { fontSize: 56 },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.gold,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.white50,
    marginBottom: 48,
  },
  buttons: {
    width: '100%',
    gap: 12,
  },
  ageRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1, borderColor: colors.white40, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#176B45', borderColor: '#FFD66B' },
  checkmark: { color: '#fff', fontWeight: '800' },
  ageText: { color: colors.white80, fontSize: 14 },
  error: { color: '#f87171', fontSize: 13, textAlign: 'center' },
  mainButton: {
    width: '100%',
    paddingVertical: 16,
    backgroundColor: '#22c55e',
    borderRadius: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
  },
  secondaryText: {
    color: colors.white80,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 64,
    color: colors.white40,
    fontSize: 12,
  },
  legalLink: { position: 'absolute', bottom: 36 },
  legalText: { color: colors.gold, fontSize: 11, textDecorationLine: 'underline' },
});
