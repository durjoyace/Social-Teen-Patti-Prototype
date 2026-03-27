import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Slot, useRouter, usePathname } from 'expo-router';
import { colors } from '../../src/theme/tokens';

const TABS = [
  { path: '/(main)/lobby', label: 'Home', emoji: '🏠' },
  { path: '/(main)/profile', label: 'Profile', emoji: '👤' },
  { path: '/(main)/settings', label: 'Settings', emoji: '⚙️' },
];

export default function MainLayout() {
  const router = useRouter();
  const pathname = usePathname();

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
