import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown, FadeIn, FadeInRight } from 'react-native-reanimated';
import { useAuthStore } from '../../src/stores/authStore';
import { useGameStore } from '../../src/stores/gameStore';
import { AnimatedChipCount, PressableButton, GlassCard, SkeletonLoader, EmptyState } from '../../src/components/ui';
import { formatChips } from '@teen-patti/shared';
import { colors } from '../../src/theme/tokens';
import { useRouter } from 'expo-router';

const MOCK_ROOMS = [
  { id: '1', name: 'Diwali Special', variant: 'classic' as const, minBuyIn: 100, maxBuyIn: 10000, minBet: 10, maxPlayers: 6, currentPlayers: 4, status: 'waiting' as const },
  { id: '2', name: 'High Rollers', variant: 'classic' as const, minBuyIn: 1000, maxBuyIn: 100000, minBet: 100, maxPlayers: 6, currentPlayers: 2, status: 'waiting' as const },
  { id: '3', name: "Joker's Den", variant: 'joker' as const, minBuyIn: 500, maxBuyIn: 50000, minBet: 50, maxPlayers: 6, currentPlayers: 5, status: 'playing' as const },
  { id: '4', name: 'Muflis Madness', variant: 'muflis' as const, minBuyIn: 200, maxBuyIn: 20000, minBet: 20, maxPlayers: 6, currentPlayers: 3, status: 'waiting' as const },
];

const VARIANT_COLORS: Record<string, string> = {
  classic: '#dc2626',
  joker: '#9333ea',
  muflis: '#16a34a',
  ak47: '#ea580c',
  hukam: '#2563eb',
};

export default function LobbyScreen() {
  const { user } = useAuthStore();
  const { startQuickPlay } = useGameStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setIsLoading(false);
    setRefreshing(false);
  }, []);

  const handleQuickPlay = () => {
    if (user) {
      startQuickPlay(user.id);
      router.push('/(main)/game');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.username?.[0]?.toUpperCase() || 'G'}</Text>
          </View>
          <View>
            <Text style={styles.username}>{user?.username || 'Guest'}</Text>
            <AnimatedChipCount value={user?.chips || 0} prefix="₹" style={styles.chips} />
          </View>
        </View>
      </Animated.View>

      {/* Quick Play */}
      <Animated.View entering={FadeInDown.delay(300)} style={styles.quickPlayWrap}>
        <PressableButton onPress={handleQuickPlay} style={styles.quickPlayBtn}>
          <Text style={styles.quickPlayIcon}>▶</Text>
          <View>
            <Text style={styles.quickPlayTitle}>Quick Play</Text>
            <Text style={styles.quickPlaySub}>Play instantly with AI opponents</Text>
          </View>
        </PressableButton>
      </Animated.View>

      {/* Room List */}
      <ScrollView
        style={styles.roomList}
        contentContainerStyle={styles.roomListContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />
        }
      >
        <Text style={styles.sectionTitle}>Open Tables</Text>

        {isLoading ? (
          <>
            {[1, 2, 3].map((i) => (
              <View key={i} style={styles.skeletonCard}>
                <SkeletonLoader width={140} height={16} />
                <SkeletonLoader width={200} height={12} style={{ marginTop: 8 }} />
                <View style={{ flexDirection: 'row', gap: 4, marginTop: 12 }}>
                  <SkeletonLoader width={24} height={24} borderRadius={12} />
                  <SkeletonLoader width={24} height={24} borderRadius={12} />
                  <SkeletonLoader width={24} height={24} borderRadius={12} />
                </View>
              </View>
            ))}
          </>
        ) : MOCK_ROOMS.length === 0 ? (
          <EmptyState
            emoji="🃏"
            title="No tables found"
            subtitle="Create your own or try Quick Play"
            actionLabel="Quick Play"
            onAction={handleQuickPlay}
          />
        ) : (
          MOCK_ROOMS.map((room, index) => (
            <Animated.View key={room.id} entering={FadeInRight.delay(index * 80).springify()}>
              <GlassCard style={styles.roomCard}>
                <View style={styles.roomHeader}>
                  <Text style={styles.roomName}>{room.name}</Text>
                  <View style={[styles.variantBadge, { backgroundColor: VARIANT_COLORS[room.variant] || '#666' }]}>
                    <Text style={styles.variantText}>{room.variant}</Text>
                  </View>
                </View>
                <Text style={styles.roomInfo}>
                  ₹{formatChips(room.minBuyIn)} - ₹{formatChips(room.maxBuyIn)}  •  Boot: ₹{formatChips(room.minBet)}
                </Text>
                <View style={styles.roomFooter}>
                  <View style={styles.playerDots}>
                    {Array.from({ length: room.currentPlayers }).map((_, i) => (
                      <View key={i} style={[styles.playerDot, { marginLeft: i > 0 ? -6 : 0 }]} />
                    ))}
                  </View>
                  <Text style={[styles.playerCount, room.currentPlayers >= room.maxPlayers && { color: colors.red }]}>
                    {room.currentPlayers}/{room.maxPlayers}
                  </Text>
                </View>
              </GlassCard>
            </Animated.View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#dc2626',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(234,179,8,0.5)',
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  username: { color: '#fff', fontSize: 16, fontWeight: '600' },
  chips: { color: colors.yellow, fontSize: 14, fontWeight: '700' },
  quickPlayWrap: { paddingHorizontal: 16, marginBottom: 16 },
  quickPlayBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#16a34a',
    borderRadius: 16,
  },
  quickPlayIcon: { fontSize: 24, color: '#fff' },
  quickPlayTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  quickPlaySub: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  roomList: { flex: 1 },
  roomListContent: { paddingHorizontal: 16, paddingBottom: 100 },
  sectionTitle: { color: colors.white60, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  skeletonCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  roomCard: { padding: 16, marginBottom: 10 },
  roomHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  roomName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  variantBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  variantText: { color: '#fff', fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  roomInfo: { color: colors.yellow, fontSize: 13, marginBottom: 12 },
  roomFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  playerDots: { flexDirection: 'row' },
  playerDot: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#dc2626',
    borderWidth: 2, borderColor: colors.bg,
  },
  playerCount: { color: colors.green, fontSize: 13, fontWeight: '600' },
});
