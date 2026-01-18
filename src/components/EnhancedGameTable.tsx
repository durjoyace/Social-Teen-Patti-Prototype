import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Settings, LogOut, Volume2, VolumeX, Eye, EyeOff, Palette } from 'lucide-react';
import { useGameStore } from '../stores/gameStore';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { useSimulatedMultiplayer } from '../hooks/useSocket';
import { useSound } from '../hooks/useSound';
import { useHaptics } from '../hooks/useHaptics';
import { GamePlayerComponent } from './GamePlayer';
import { CardFan } from './PlayingCard';
import { PotDisplay } from './ChipStack';
import { BettingControls } from './BettingControls';
import { ChatPanel } from './ChatPanel';
import { GameTableSurface, ThemeSelector, TableTheme, TABLE_THEMES } from './TableThemes';
import { WinnerCelebration, CountdownTimer, ChipsFlying } from './Celebrations';
import { cn } from '../utils/cn';
import { ActionType } from '../types';
import { formatChips } from '../game/gameEngine';
import { evaluateHand } from '../game/handRanking';

const PLAYER_POSITIONS = [
  'bottom',
  'left',
  'top-left',
  'top',
  'top-right',
  'right'
] as const;

interface EnhancedGameTableProps {
  onLeave?: () => void;
}

export function EnhancedGameTable({ onLeave }: EnhancedGameTableProps) {
  const {
    gameState,
    myCards,
    isMyTurn,
    availableActions,
    showCards,
    toggleShowCards,
    performAction,
    chatMessages,
    isChatOpen,
    toggleChat,
    gameMessage,
    currentRoom
  } = useGameStore();

  const { user } = useAuthStore();
  const { soundEnabled, toggleSound } = useUIStore();
  const { aiThinking } = useSimulatedMultiplayer();
  const { play, playCardDeal, playChipSound } = useSound();
  const { onTurn, onWin, onButtonPress } = useHaptics();

  const [timeLeft, setTimeLeft] = useState(30);
  const [tableTheme, setTableTheme] = useState<TableTheme>('diwali');
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [showWinCelebration, setShowWinCelebration] = useState(false);
  const [winner, setWinner] = useState<{ name: string; amount: number; handRank: any } | null>(null);
  const [flyingChips, setFlyingChips] = useState<{ from: { x: number; y: number }; to: { x: number; y: number }; amount: number } | null>(null);

  const themeConfig = TABLE_THEMES[tableTheme];

  // Timer for current turn
  useEffect(() => {
    if (!isMyTurn) {
      setTimeLeft(30);
      return;
    }

    onTurn();
    play('turn');

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 5) {
          play('countdown');
        }
        if (prev <= 1) {
          performAction('pack');
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isMyTurn, performAction, onTurn, play]);

  // Check for game end and show celebration
  useEffect(() => {
    if (gameState?.isGameOver && gameState.winners.length > 0) {
      const winningPlayer = gameState.session.players.find(p => gameState.winners.includes(p.id));
      if (winningPlayer) {
        const hand = winningPlayer.cards ? evaluateHand(winningPlayer.cards) : null;
        setWinner({
          name: winningPlayer.userId === user?.id ? 'You' : `Player ${winningPlayer.seatPosition + 1}`,
          amount: gameState.session.pot,
          handRank: hand?.rank || 'high_card'
        });

        if (winningPlayer.userId === user?.id) {
          onWin();
          play('win');
        } else {
          play('lose');
        }

        setTimeout(() => setShowWinCelebration(true), 500);
      }
    }
  }, [gameState?.isGameOver, gameState?.winners, gameState?.session, user?.id, onWin, play]);

  const handleAction = useCallback((action: ActionType, amount?: number) => {
    onButtonPress();

    if (action === 'chaal' || action === 'blind' || action === 'raise') {
      playChipSound(amount || 0);
    } else if (action === 'pack') {
      play('fold');
    }

    performAction(action, amount);
  }, [performAction, onButtonPress, playChipSound, play]);

  if (!gameState) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="w-12 h-12 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full mx-auto mb-4"
          />
          <p className="text-white/60">Loading game...</p>
        </div>
      </div>
    );
  }

  const { session } = gameState;

  return (
    <div className={cn(
      'relative w-full h-full overflow-hidden',
      `bg-gradient-to-b ${themeConfig.backgroundColor}`
    )}>
      {/* Ambient effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-20 flex items-center justify-between px-4 py-3 safe-top"
      >
        <button
          onClick={onLeave}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/40 backdrop-blur-sm text-white/80 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Leave</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Room info */}
          <div className="px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-sm">
            <span className={cn('text-sm font-medium', themeConfig.accentColor)}>
              {currentRoom?.name || 'Table'}
            </span>
          </div>

          {/* Theme button */}
          <button
            onClick={() => setShowThemeSelector(!showThemeSelector)}
            className="p-2 rounded-xl bg-black/40 backdrop-blur-sm text-white/60 hover:text-white transition-colors"
          >
            <Palette className="w-5 h-5" />
          </button>

          {/* Sound button */}
          <button
            onClick={toggleSound}
            className="p-2 rounded-xl bg-black/40 backdrop-blur-sm text-white/60 hover:text-white transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {/* Chat button */}
          <button
            onClick={toggleChat}
            className="relative p-2 rounded-xl bg-black/40 backdrop-blur-sm text-white/60 hover:text-white transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            {chatMessages.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white">
                {chatMessages.length}
              </span>
            )}
          </button>
        </div>
      </motion.header>

      {/* Theme selector dropdown */}
      <AnimatePresence>
        {showThemeSelector && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-16 right-4 z-30 p-3 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/10"
          >
            <p className="text-xs text-white/50 mb-2 px-2">Table Theme</p>
            <ThemeSelector currentTheme={tableTheme} onSelect={(t) => {
              setTableTheme(t);
              setShowThemeSelector(false);
            }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Table */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4" style={{ height: 'calc(100vh - 220px)' }}>
        <GameTableSurface theme={tableTheme}>
          {/* Pot in center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <PotDisplay amount={session.pot} />
          </div>

          {/* Game message */}
          <AnimatePresence>
            {gameMessage && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                className="absolute top-16 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-black/70 backdrop-blur-sm z-20"
              >
                <span className={cn('text-sm font-medium', themeConfig.accentColor)}>{gameMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI thinking indicator */}
          <AnimatePresence>
            {aiThinking && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute top-24 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm"
              >
                <motion.div
                  className="flex gap-1"
                >
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 bg-white/60 rounded-full"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                    />
                  ))}
                </motion.div>
                <span className="text-xs text-white/60">Thinking...</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Players around table */}
          {session.players.map((player, index) => (
            <GamePlayerComponent
              key={player.id}
              player={player}
              isCurrentUser={index === 0}
              showCards={showCards || index === 0 || gameState.isGameOver}
              position={PLAYER_POSITIONS[index]}
              timeLeft={player.isTurn ? timeLeft : undefined}
            />
          ))}
        </GameTableSurface>
      </div>

      {/* My Cards (floating) */}
      {myCards.length > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-44 left-1/2 -translate-x-1/2 z-20"
        >
          <div className="relative">
            <CardFan
              cards={myCards}
              isHidden={!showCards}
              showOnHover
              size="lg"
            />
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleShowCards}
              className={cn(
                'absolute -bottom-10 left-1/2 -translate-x-1/2',
                'flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium',
                'bg-black/70 backdrop-blur-sm border border-white/20',
                showCards ? 'text-yellow-400' : 'text-white/60'
              )}
            >
              {showCards ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  Hide Cards
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  Show Cards
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Betting Controls */}
      {isMyTurn && !gameState.isGameOver && (
        <BettingControls
          availableActions={availableActions}
          currentBet={session.currentBet}
          minBet={session.bootAmount}
          maxBet={user?.chips || 10000}
          isBlind={session.players[0]?.isBlind ?? true}
          playerChips={session.players[0]?.chipsInPlay || 0}
          pot={session.pot}
          onAction={handleAction}
        />
      )}

      {/* Waiting indicator */}
      {!isMyTurn && !gameState.isGameOver && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-10"
        >
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-black/70 backdrop-blur-sm border border-white/10">
            <motion.div
              className="w-2 h-2 bg-yellow-400 rounded-full"
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
            <span className="text-sm text-white/80">Waiting for other players...</span>
          </div>
        </motion.div>
      )}

      {/* Game Over - Play Again */}
      {gameState.isGameOver && !showWinCelebration && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-10"
        >
          <button
            onClick={onLeave}
            className="px-8 py-3 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold shadow-lg shadow-orange-500/30"
          >
            Play Again
          </button>
        </motion.div>
      )}

      {/* Chat Panel */}
      <AnimatePresence>
        {isChatOpen && <ChatPanel onClose={toggleChat} />}
      </AnimatePresence>

      {/* Winner Celebration */}
      {winner && (
        <WinnerCelebration
          isVisible={showWinCelebration}
          winnerName={winner.name}
          amount={winner.amount}
          handRank={winner.handRank}
          onClose={() => {
            setShowWinCelebration(false);
            setWinner(null);
          }}
        />
      )}

      {/* Flying Chips Animation */}
      {flyingChips && (
        <ChipsFlying
          from={flyingChips.from}
          to={flyingChips.to}
          amount={flyingChips.amount}
          onComplete={() => setFlyingChips(null)}
        />
      )}
    </div>
  );
}
