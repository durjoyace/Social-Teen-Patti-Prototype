import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { StatusBar } from 'expo-status-bar';
import { api } from '../../src/services/api';
import { useAuthStore } from '../../src/stores/authStore';
import type { ReferralSummary } from '../../src/types/referrals';

export default function ReferralsScreen() {
  const updateUser = useAuthStore(state => state.updateUser);
  const [summary, setSummary] = useState<ReferralSummary | null>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [busyItem, setBusyItem] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const result = await api.get<ReferralSummary>('/referrals/summary');
      setSummary(result);
      updateUser({ beliBalance: result.beliBalance, referralCode: result.code });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load your invite circle');
    }
  }, [updateUser]);

  useEffect(() => { void load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const recordShare = async (platform: 'NATIVE' | 'COPY') => {
    try {
      await api.post('/referrals/share', { platform, campaign: 'table_circle' });
    } catch {
      // Sharing remains useful if tracking is temporarily unavailable.
    }
  };

  const shareInvite = async () => {
    if (!summary) return;
    const message = `Come join my Teen Patti table. Finish one real multiplayer game and we both unlock ${summary.activationRewardBeli} Beli for profile extras. ${summary.shareUrl}`;
    const result = await Share.share({ title: 'Join my Teen Patti table', message });
    if (result.action === Share.sharedAction) await recordShare('NATIVE');
  };

  const copyInvite = async () => {
    if (!summary) return;
    await Clipboard.setStringAsync(summary.shareUrl);
    await recordShare('COPY');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const redeem = (itemId: string, name: string, costBeli: number) => {
    Alert.alert('Unlock this extra?', `${name} costs ${costBeli} Beli.`, [
      { text: 'Not now', style: 'cancel' },
      {
        text: 'Unlock',
        onPress: async () => {
          setBusyItem(itemId);
          setError('');
          try {
            const result = await api.post<{ beliBalance: number }>('/referrals/redeem', { itemId });
            updateUser({ beliBalance: result.beliBalance });
            await load();
          } catch (redeemError) {
            setError(redeemError instanceof Error ? redeemError.message : 'Could not unlock that extra');
          } finally {
            setBusyItem(null);
          }
        },
      },
    ]);
  };

  if (!summary && !error) {
    return <View style={styles.center}><ActivityIndicator color="#FFD66B" size="large" /></View>;
  }

  if (!summary) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Your invite circle is unavailable</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable onPress={() => void load()} style={styles.retry}><Text style={styles.retryText}>Try again</Text></Pressable>
      </View>
    );
  }

  const nextCount = summary.nextMilestone?.count ?? summary.stats.activated;
  const progress = nextCount ? Math.min(100, (summary.stats.activated / nextCount) * 100) : 100;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFD66B" />}
      >
        <Text style={styles.eyebrow}>YOUR TABLE CIRCLE</Text>
        <Text style={styles.title}>Invite the people you play with</Text>
        <Text style={styles.intro}>
          Your friend completes one real multiplayer game, then both of you unlock {summary.activationRewardBeli} Beli. Signups and bot games do not count.
        </Text>

        {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

        <View style={styles.hero}>
          <View style={styles.flowRow} accessibilityLabel="You invite, your friend plays, both earn">
            <View style={styles.flowStep}><Text style={styles.flowIcon}>🤝</Text><Text style={styles.flowText}>You invite</Text></View>
            <Text style={styles.thread}>——</Text>
            <View style={styles.flowStep}><Text style={styles.flowIcon}>🃏</Text><Text style={styles.flowText}>They play</Text></View>
            <Text style={styles.thread}>——</Text>
            <View style={styles.flowStep}><Text style={styles.flowIcon}>✨</Text><Text style={styles.flowText}>Both earn</Text></View>
          </View>
          <View style={styles.statsRow}>
            <View><Text style={styles.statLabel}>Your Beli</Text><Text style={styles.beli}>{summary.beliBalance.toLocaleString('en-IN')}</Text></View>
            <View style={styles.statRight}><Text style={styles.statLabel}>Friends activated</Text><Text style={styles.statValue}>{summary.stats.activated}</Text></View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Deal the invite</Text>
          <Text style={styles.cardSub}>Made for the group chat where your table already lives.</Text>
          <View style={styles.codeRow}>
            <Text style={styles.code}>{summary.code}</Text>
            <Pressable onPress={() => void copyInvite()} style={styles.copyButton}><Text style={styles.copyText}>{copied ? 'Copied' : 'Copy link'}</Text></Pressable>
          </View>
          <Pressable onPress={() => void shareInvite()} style={styles.shareButton}><Text style={styles.shareText}>Share invite</Text></Pressable>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionRow}><View><Text style={styles.eyebrow}>BELI TRAIL</Text><Text style={styles.cardTitle}>Keep the circle moving</Text></View><Text style={styles.cardSub}>{summary.stats.activated}/{nextCount}</Text></View>
          <View style={styles.track}><View style={[styles.fill, { width: `${progress}%` }]} /></View>
          {summary.milestones.map(milestone => (
            <View key={milestone.count} style={styles.milestone}>
              <Text style={milestone.achieved ? styles.doneDot : styles.dot}>●</Text>
              <View style={styles.grow}><Text style={styles.milestoneTitle}>{milestone.label}</Text><Text style={styles.cardSub}>{milestone.count} activated {milestone.count === 1 ? 'friend' : 'friends'}</Text></View>
              <Text style={styles.reward}>+{milestone.beli}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.eyebrow}>EXTRAS</Text>
        <Text style={styles.sectionTitle}>Make the table yours</Text>
        {summary.catalog.map(item => {
          const canAfford = summary.beliBalance >= item.costBeli;
          return (
            <View key={item.id} style={styles.rewardCard}>
              <View style={styles.grow}><Text style={styles.rewardName}>{item.name}</Text><Text style={styles.cardSub}>{item.description}</Text></View>
              <Pressable
                onPress={() => redeem(item.id, item.name, item.costBeli)}
                disabled={item.owned || !canAfford || busyItem !== null}
                style={[styles.redeemButton, (item.owned || !canAfford) && styles.disabled]}
              >
                {busyItem === item.id ? <ActivityIndicator color="#0B1221" /> : <Text style={styles.redeemText}>{item.owned ? 'Owned' : `${item.costBeli} Beli`}</Text>}
              </Pressable>
            </View>
          );
        })}

        <Text style={styles.disclaimer}>Beli cannot be bought, transferred, wagered, cashed out, or exchanged for chips.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1221' },
  center: { flex: 1, backgroundColor: '#0B1221', alignItems: 'center', justifyContent: 'center', padding: 24 },
  content: { paddingHorizontal: 18, paddingTop: 60, paddingBottom: 120 },
  eyebrow: { color: '#FFD66B', fontSize: 11, fontWeight: '800', letterSpacing: 1.8, marginBottom: 5 },
  title: { color: '#FFF4D6', fontSize: 30, lineHeight: 35, fontWeight: '800' },
  intro: { color: 'rgba(255,255,255,0.62)', fontSize: 14, lineHeight: 21, marginTop: 12, marginBottom: 18 },
  hero: { backgroundColor: '#111B2E', borderColor: 'rgba(255,214,107,0.25)', borderWidth: 1, borderRadius: 26, padding: 18 },
  flowRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  flowStep: { alignItems: 'center', width: 72 },
  flowIcon: { fontSize: 26, marginBottom: 5 },
  flowText: { color: 'rgba(255,255,255,0.65)', fontSize: 10, fontWeight: '600' },
  thread: { color: 'rgba(255,214,107,0.45)', fontSize: 10 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 16, padding: 16 },
  statRight: { alignItems: 'flex-end' },
  statLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 11 },
  beli: { color: '#FFD66B', fontSize: 28, fontWeight: '900' },
  statValue: { color: '#FFF4D6', fontSize: 22, fontWeight: '800' },
  card: { marginTop: 16, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 24, padding: 18 },
  cardTitle: { color: '#FFF4D6', fontSize: 20, fontWeight: '800' },
  cardSub: { color: 'rgba(255,255,255,0.48)', fontSize: 12, lineHeight: 18, marginTop: 3 },
  codeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 15, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 14, paddingLeft: 14, padding: 6 },
  code: { flex: 1, color: '#FFD66B', fontWeight: '900', letterSpacing: 2 },
  copyButton: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  copyText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  shareButton: { backgroundColor: '#176B45', borderRadius: 14, alignItems: 'center', padding: 14, marginTop: 10 },
  shareText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  track: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 16, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3, backgroundColor: '#FFD66B' },
  milestone: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
  grow: { flex: 1 },
  dot: { color: 'rgba(255,255,255,0.25)', fontSize: 12 },
  doneDot: { color: '#FFD66B', fontSize: 12 },
  milestoneTitle: { color: '#FFF4D6', fontSize: 14, fontWeight: '700' },
  reward: { color: '#FFD66B', fontWeight: '800' },
  sectionTitle: { color: '#FFF4D6', fontSize: 22, fontWeight: '800', marginBottom: 10 },
  rewardCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#111B2E', borderRadius: 18, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  rewardName: { color: '#FFF4D6', fontSize: 15, fontWeight: '800' },
  redeemButton: { minWidth: 88, minHeight: 42, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, borderRadius: 12, backgroundColor: '#F5A524' },
  redeemText: { color: '#0B1221', fontWeight: '900', fontSize: 12 },
  disabled: { opacity: 0.4 },
  disclaimer: { color: 'rgba(255,255,255,0.35)', fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 20, paddingHorizontal: 12 },
  errorBanner: { color: '#fecaca', backgroundColor: 'rgba(217,72,65,0.15)', borderRadius: 12, padding: 12, marginBottom: 12 },
  errorTitle: { color: '#FFF4D6', fontSize: 18, fontWeight: '800', textAlign: 'center' },
  errorText: { color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginTop: 8 },
  retry: { backgroundColor: '#F5A524', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12, marginTop: 18 },
  retryText: { color: '#0B1221', fontWeight: '800' },
});
