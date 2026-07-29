import { useCallback, useEffect, useRef } from 'react';
import { Alert, View, Text, StyleSheet, Pressable } from 'react-native';
import { Slot, useRouter, usePathname } from 'expo-router';
import * as Linking from 'expo-linking';
import { colors } from '../../src/theme/tokens';
import { useGameSocket } from '../../src/hooks/useGameSocket';
import { gameSocket } from '../../src/services/socket';
import {
  captureReferralUrl,
  clearPendingRoomCode,
  getPendingRoomCode,
} from '../../src/services/referralAttribution';

const TABS = [
  { path: '/(main)/lobby', label: 'Home', emoji: '🏠' },
  { path: '/(main)/referrals', label: 'Invite', emoji: '🤝' },
  { path: '/(main)/profile', label: 'Profile', emoji: '👤' },
  { path: '/(main)/settings', label: 'Settings', emoji: '⚙️' },
];

export default function MainLayout() {
  useGameSocket();
  const router = useRouter();
  const pathname = usePathname();
  const joiningRoom = useRef(false);

  const joinPendingRoom = useCallback(async (url?: string) => {
    if (url) await captureReferralUrl(url);
    if (joiningRoom.current) return;
    const roomCode = await getPendingRoomCode();
    if (!roomCode) return;

    joiningRoom.current = true;
    try {
      const result = await gameSocket.joinByCode(roomCode);
      if (!result.success) throw new Error(result.error || 'That friend table is no longer available');
      await clearPendingRoomCode();
      Alert.alert('Friend table joined', 'You are in. The deal starts when both players are ready.');
    } catch (error) {
      await clearPendingRoomCode();
      Alert.alert('Could not join the table', error instanceof Error ? error.message : 'Ask your friend for a fresh invite.');
    } finally {
      joiningRoom.current = false;
    }
  }, []);

  useEffect(() => {
    void joinPendingRoom();
    const subscription = Linking.addEventListener('url', event => {
      void joinPendingRoom(event.url);
    });
    return () => subscription.remove();
  }, [joinPendingRoom]);

  return (
    <View style={styles.container}>
      <Slot />
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = pathname === tab.path || pathname.startsWith(tab.path);
          return (
            <Pressable
              key={tab.path}
              onPress={() => router.push(tab.path as any)}
              style={styles.tab}
            >
              <Text style={styles.tabEmoji}>{tab.emoji}</Text>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingBottom: 28,
    paddingTop: 8,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  tabEmoji: { fontSize: 20, marginBottom: 2 },
  tabLabel: { fontSize: 10, color: colors.white40 },
  tabLabelActive: { color: colors.gold },
});
