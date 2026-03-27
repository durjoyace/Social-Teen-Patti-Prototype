import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useGameStore } from '../../src/stores/gameStore';
import { AnimatedChipCount, PressableButton } from '../../src/components/ui';
import { colors } from '../../src/theme/tokens';
import { formatChips } from '@teen-patti/shared';
import { useRouter } from 'expo-router';

export default function GameScreen() {
  const { gameState, myCards, isMyTurn, availableActions, showCards, performAction, toggleShowCards, leaveGame } = useGameStore();
  const router = useRouter();

  if (!gameState) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No game in progress</Text>
        <PressableButton onPress={() => router.back()} variant="secondary">
          <Text style={{ color: '#fff' }}>Back to Lobby</Text>
        </PressableButton>
      </View>
    );
  }

  const { session } = gameState;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <PressableButton onPress={() => { leaveGame(); router.back(); }} variant="ghost" style={styles.backBtn}>
          <Text style={{ color: colors.white60, fontSize: 16 }}>← Leave</Text>
        </PressableButton>
        <Text style={styles.roomName}>Quick Play</Text>
      </View>

      {/* Pot */}
      <Animated.View entering={FadeIn.delay(200)} style={styles.potContainer}>
        <Text style={styles.potLabel}>POT</Text>
        <AnimatedChipCount value={session.pot} prefix="₹" style={styles.potAmount} />
      </Animated.View>

      {/* Players */}
      <View style={styles.playersContainer}>
        {session.players.map((player: any, i: number) => (
          <Animated.View
            key={player.id}
            entering={FadeIn.delay(300 + i * 100)}
            style={[styles.playerCard, player.isTurn && styles.playerActive]}
          >
            <View style={[styles.playerAvatar, i === 0 && styles.myAvatar]}>
              <Text style={styles.playerInitial}>{(i === 0 ? 'Y' : player.userId?.split('-')[1]?.[0]?.toUpperCase()) || '?'}</Text>
            </View>
            <Text style={[styles.playerName, i === 0 && { color: colors.yellow }]}>
              {i === 0 ? 'You' : player.userId?.replace('ai-', '') || `P${i + 1}`}
            </Text>
            <AnimatedChipCount
              value={player.chipsInPlay}
              prefix="₹"
              style={[styles.playerChips, player.status === 'folded' && { color: colors.red }]}
            />
            {player.status === 'folded' && <Text style={styles.foldedBadge}>PACKED</Text>}
          </Animated.View>
        ))}
      </View>

      {/* My Cards */}
      {myCards.length > 0 && (
        <View style={styles.myCardsContainer}>
          <View style={styles.cardRow}>
            {myCards.map((card: any, i: number) => (
              <Animated.View key={i} entering={FadeIn.delay(500 + i * 150)} style={styles.card}>
                <Text style={styles.cardText}>
                  {showCards ? `${card.rank}${card.suit === 'hearts' ? '♥' : card.suit === 'diamonds' ? '♦' : card.suit === 'clubs' ? '♣' : '♠'}` : '🂠'}
                </Text>
              </Animated.View>
            ))}
          </View>
          <PressableButton onPress={toggleShowCards} variant="ghost" style={styles.peekBtn}>
            <Text style={{ color: showCards ? colors.yellow : colors.white50 }}>
              {showCards ? 'Hide' : 'See Cards'}
            </Text>
          </PressableButton>
        </View>
      )}

      {/* Action buttons */}
      {isMyTurn && !gameState.isGameOver && (
        <Animated.View entering={FadeIn} style={styles.actions}>
          {availableActions.map((action: string) => (
            <PressableButton
              key={action}
              onPress={() => performAction(action as any)}
              variant={action === 'pack' ? 'danger' : action === 'raise' ? 'primary' : 'secondary'}
              style={styles.actionBtn}
            >
              <Text style={styles.actionText}>{action.toUpperCase()}</Text>
            </PressableButton>
          ))}
        </Animated.View>
      )}

      {/* Game Over */}
      {gameState.isGameOver && (
        <Animated.View entering={FadeIn} style={styles.gameOver}>
          <Text style={styles.gameOverText}>Game Over!</Text>
          <PressableButton onPress={() => { leaveGame(); router.back(); }} variant="primary" style={{ marginTop: 16 }}>
            <Text style={styles.actionText}>Back to Lobby</Text>
          </PressableButton>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628', paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 24 },
  backBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  roomName: { color: colors.white60, fontSize: 14, marginLeft: 12 },
  potContainer: { alignItems: 'center', marginBottom: 24 },
  potLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4 },
  potAmount: { color: colors.gold, fontSize: 28, fontWeight: '700' },
  playersContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, paddingHorizontal: 16, marginBottom: 24 },
  playerCard: {
    alignItems: 'center', padding: 12, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    width: '45%',
  },
  playerActive: { borderColor: 'rgba(234,179,8,0.4)', backgroundColor: 'rgba(234,179,8,0.05)' },
  playerAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  myAvatar: { backgroundColor: '#d97706', borderWidth: 2, borderColor: 'rgba(234,179,8,0.5)' },
  playerInitial: { color: '#fff', fontSize: 16, fontWeight: '700' },
  playerName: { color: '#fff', fontSize: 12, fontWeight: '600', marginBottom: 2 },
  playerChips: { color: colors.green, fontSize: 11, fontWeight: '700' },
  foldedBadge: { color: colors.red, fontSize: 9, fontWeight: '700', marginTop: 2 },
  myCardsContainer: { alignItems: 'center', marginBottom: 16 },
  cardRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  card: {
    width: 64, height: 88, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  cardText: { fontSize: 24 },
  peekBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  actions: {
    position: 'absolute', bottom: 40, left: 16, right: 16,
    flexDirection: 'row', gap: 8,
  },
  actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 16 },
  actionText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  gameOver: { alignItems: 'center', marginTop: 24 },
  gameOverText: { color: colors.gold, fontSize: 24, fontWeight: '700' },
  title: { color: '#fff', fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 16 },
});
