import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
  FadeIn,
  FadeInDown,
  runOnJS,
} from 'react-native-reanimated';
import { formatChips } from '@teen-patti/shared';

const { width } = Dimensions.get('window');

// Verify shared package works
const testChips = formatChips(50000);

export default function App() {
  const [screen, setScreen] = useState<'splash' | 'home'>('splash');
  const logoScale = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);

  useEffect(() => {
    // Staggered entrance animation
    logoScale.value = withSpring(1, { stiffness: 350, damping: 28 });
    titleOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));
    subtitleOpacity.value = withDelay(600, withTiming(1, { duration: 400 }));

    // Transition to home after splash
    const timer = setTimeout(() => setScreen('home'), 2500);
    return () => clearTimeout(timer);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  if (screen === 'splash') {
    return (
      <View style={styles.splashContainer}>
        <StatusBar style="light" />

        {/* Logo */}
        <Animated.View style={[styles.logoContainer, logoStyle]}>
          <Text style={styles.logoEmoji}>🃏</Text>
        </Animated.View>

        {/* Title */}
        <Animated.Text style={[styles.splashTitle, titleStyle]}>
          Social Teen Patti
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text style={[styles.splashSubtitle, subtitleStyle]}>
          Where tradition meets technology
        </Animated.Text>
      </View>
    );
  }

  return (
    <View style={styles.homeContainer}>
      <StatusBar style="light" />

      <Animated.View entering={FadeInDown.delay(100).springify()}>
        <Text style={styles.homeTitle}>Social Teen Patti</Text>
        <Text style={styles.homeSubtitle}>
          Shared package works: {testChips} chips formatted
        </Text>
      </Animated.View>

      <Animated.View entering={FadeIn.delay(300)} style={styles.card}>
        <Text style={styles.cardTitle}>Ready for Phase 2</Text>
        <Text style={styles.cardBody}>
          Monorepo scaffold complete. Shared game engine loaded.
          Next: Login screen, Lobby, Game Table.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  logoEmoji: {
    fontSize: 56,
  },
  splashTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#D4AF37',
    marginBottom: 8,
  },
  splashSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  homeContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    paddingTop: 80,
    paddingHorizontal: 20,
  },
  homeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  homeSubtitle: {
    fontSize: 14,
    color: '#22c55e',
    marginBottom: 24,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#D4AF37',
    marginBottom: 8,
  },
  cardBody: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 20,
  },
});
