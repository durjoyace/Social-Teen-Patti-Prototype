import { View, Text, StyleSheet, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useAuthStore } from '../../src/stores/authStore';
import { PressableButton } from '../../src/components/ui';
import { colors } from '../../src/theme/tokens';

export default function LoginScreen() {
  const { guestLogin, isLoading } = useAuthStore();

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
        India's #1 Social Card Game
      </Animated.Text>

      {/* Buttons */}
      <Animated.View entering={FadeInDown.delay(700)} style={styles.buttons}>
        <PressableButton
          onPress={guestLogin}
          variant="primary"
          disabled={isLoading}
          style={styles.mainButton}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Joining...' : 'Play as Guest'}
          </Text>
        </PressableButton>

        <PressableButton variant="secondary" style={styles.secondaryButton}>
          <Text style={styles.secondaryText}>Sign in with Google</Text>
        </PressableButton>
      </Animated.View>

      {/* Footer */}
      <Animated.Text entering={FadeIn.delay(1000)} style={styles.footer}>
        By playing, you agree to our Terms of Service
      </Animated.Text>
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
    bottom: 48,
    color: colors.white40,
    fontSize: 12,
  },
});
