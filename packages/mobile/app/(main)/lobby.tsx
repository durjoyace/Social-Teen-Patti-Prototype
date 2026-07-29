import { useState, useEffect, useCallback } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, RefreshControl, Pressable, Share, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown, FadeIn, FadeInRight } from 'react-native-reanimated';
import { useAuthStore } from '../../src/stores/authStore';
import { AnimatedChipCount, PressableButton, GlassCard, SkeletonLoader, EmptyState } from '../../src/components/ui';
import { formatChips } from '@teen-patti/shared';
import { colors } from '../../src/theme/tokens';
import { useRouter } from 'expo-router';
import { gameSocket } from '../../src/services/socket';
import { api } from '../../src/services/api';
import type { ReferralSummary } from '../../src/types/referrals';

interface RoomSummary {
  id: string;
  name: string;
  variant: string;
  minBuyIn: number;
  maxBuyIn: number;
  minBet: number;
  maxPlayers: number;
  currentPlayers: number;
  status: 'waiting' | 'playing';
}

const VARIANT_COLORS: Record<string, string> = {
  classic: '#dc2626',
  joker: '#9333ea',
  muflis: '#16a34a',
  ak47: '#ea580c',
  hukam: '#2563eb',
};

export default function LobbyScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [roomCode, setRoomCode] = useState('');
  const [joining, setJoining] = useState(false);

  const loadRooms = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await gameSocket.listRooms();
      setRooms(result.rooms.map(room => ({
        id: room.id,
        name: room.name,
        variant: String(room.variant).toLowerCase(),
        minBuyIn: Number(room.minBuyIn || room.bootAmount || 500),
        maxBuyIn: Number(room.maxBuyIn || 5000),
        minBet: Number(room.bootAmount || 50),
        maxPlayers: Number(room.maxPlayers || 6),
        currentPlayers: Number(room.currentPlayers || 0),
        status: room.status,
      })));
    } catch {
      setRooms([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRooms();
    const timer = setInterval(() => void loadRooms(), 10_000);
    return () => clearInterval(timer);
  }, [loadRooms]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRooms();
    setRefreshing(false);
  }, []);

  const handleQuickPlay = async () => {
    try {
      const result = await gameSocket.quickPlay();
      if (!result.success) throw new Error(result.error || 'Could not start quick play');
    } catch (error) {
      Alert.alert('Could not start', error instanceof Error ? error.message : 'Connection unavailable');
    }
  };

  const createFriendTable = async () => {
    try {
      const result = await gameSocket.createPrivateRoom();
      if (!result.success || !result.room?.roomCode) throw new Error(result.error || 'Could not create table');
      const summary = await api.get<ReferralSummary>('/referrals/summary');
      const separator = summary.shareUrl.includes('?') ? '&' : '?';
      const inviteUrl = `${summary.shareUrl}${separator}room=${encodeURIComponent(result.room.roomCode)}`;
      const message = `Join my private Teen Patti table. Finish one real multiplayer game and we both unlock ${summary.activationRewardBeli} Beli extras. ${inviteUrl}`;
      Alert.alert('Your table is ready', `Room code: ${result.room.roomCode}\n\nThe game starts when your friend joins.`, [
        { text: 'Keep waiting', style: 'cancel' },
        {
          text: 'Share invite',
          onPress: () => {
            void Share.share({ title: 'Join my table', message }).then(shareResult => {
              if (shareResult.action === Share.sharedAction) {
                void api.post('/referrals/share', { platform: 'NATIVE', campaign: 'friend_table' }).catch(() => {});
              }
            });
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Could not create table', error instanceof Error ? error.message : 'Connection unavailable');
    }
  };

  const joinFriendTable = async () => {
    const code = roomCode.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(code)) {
      Alert.alert('Check the code', 'Enter the 6-character room code your friend sent.');
      return;
    }
    setJoining(true);
    try {
      const result = await gameSocket.joinByCode(code);
      if (!result.success) throw new Error(result.error || 'Could not join table');
      setRoomCode('');
    } catch (error) {
      Alert.alert('Could not join table', error instanceof Error ? error.message : 'Connection unavailable');
    } finally {
      setJoining(false);
    }
  };

  const joinPublicRoom = async (room: RoomSummary) => {
    try {
      const buyIn = Math.max(room.minBuyIn, Math.min(room.maxBuyIn, 5000));
      const result = await gameSocket.joinRoom(room.id, buyIn);
      if (!result.success) throw new Error(result.error || 'Could not join table');
    } catch (error) {
      Alert.alert('Could not join table', error instanceof Error ? error.message : 'Connection unavailable');
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
            <AnimatedChipCount value={user?.chips || 0} prefix="◉ " style={styles.chips} />
            <Text style={styles.beliMini}>{user?.beliBalance || 0} Beli</Text>
          </View>
        </View>
      </Animated.View>

      <View style={styles.friendActions}>
        <Pressable onPress={() => void createFriendTable()} style={styles.createButton}><Text style={styles.createText}>Create friend table</Text></Pressable>
        <View style={styles.joinRow}>
          <TextInput
            value={roomCode}
            onChangeText={value => setRoomCode(value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
            placeholder="ROOM CODE"
            placeholderTextColor="rgba(255,255,255,0.28)"
            autoCapitalize="characters"
            maxLength={6}
            style={styles.codeInput}
          />
          <Pressable onPress={() => void joinFriendTable()} disabled={joining} style={styles.joinButton}><Text style={styles.joinText}>{joining ? '…' : 'Join'}</Text></Pressable>
        </View>
      </View>

      <Animated.View entering={FadeInDown.delay(200)} style={styles.inviteWrap}>
        <Pressable onPress={() => router.push('/(main)/referrals')} style={styles.inviteCard} accessibilityRole="button">
          <View style={styles.inviteCopy}>
            <Text style={styles.inviteEyebrow}>YOUR TABLE CIRCLE</Text>
            <Text style={styles.inviteTitle}>Both unlock 100 Beli</Text>
            <Text style={styles.inviteSub}>After your friend's first real multiplayer game</Text>
          </View>
          <Text style={styles.inviteAction}>Invite</Text>
        </Pressable>
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
        ) : rooms.length === 0 ? (
          <EmptyState
            emoji="🃏"
            title="No tables found"
            subtitle="Create your own or try Quick Play"
            actionLabel="Quick Play"
            onAction={handleQuickPlay}
          />
        ) : (
          rooms.map((room, index) => (
            <Animated.View key={room.id} entering={FadeInRight.delay(index * 80).springify()}>
              <Pressable onPress={() => void joinPublicRoom(room)}>
              <GlassCard style={styles.roomCard}>
                <View style={styles.roomHeader}>
                  <Text style={styles.roomName}>{room.name}</Text>
                  <View style={[styles.variantBadge, { backgroundColor: VARIANT_COLORS[room.variant] || '#666' }]}>
                    <Text style={styles.variantText}>{room.variant}</Text>
                  </View>
                </View>
                <Text style={styles.roomInfo}>
                  {formatChips(room.minBuyIn)}–{formatChips(room.maxBuyIn)} chips  •  Boot: {formatChips(room.minBet)}
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
              </Pressable>
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
  beliMini: { color: '#FFD66B', fontSize: 11, marginTop: 2 },
  inviteWrap: { paddingHorizontal: 16, marginBottom: 12 },
  inviteCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#176B45', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: 'rgba(255,214,107,0.3)' },
  inviteCopy: { flex: 1 },
  inviteEyebrow: { color: '#FFD66B', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  inviteTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 3 },
  inviteSub: { color: 'rgba(255,255,255,0.62)', fontSize: 11, marginTop: 2 },
  inviteAction: { color: '#0B1221', backgroundColor: '#F5A524', paddingHorizontal: 16, paddingVertical: 11, borderRadius: 12, fontWeight: '900', overflow: 'hidden' },
  friendActions: { paddingHorizontal: 16, marginBottom: 12, gap: 8 },
  createButton: { backgroundColor: 'rgba(255,255,255,0.09)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 14, alignItems: 'center', padding: 13 },
  createText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  joinRow: { flexDirection: 'row', gap: 8 },
  codeInput: { flex: 1, minHeight: 46, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, color: '#FFD66B', paddingHorizontal: 14, fontWeight: '800', letterSpacing: 1.5 },
  joinButton: { minWidth: 72, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5A524', borderRadius: 12 },
  joinText: { color: '#0B1221', fontWeight: '900' },
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
