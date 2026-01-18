import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Settings, LogOut, Volume2, VolumeX, HelpCircle } from 'lucide-react';
import { useGameStore } from '../stores/gameStore';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { GamePlayerComponent } from './GamePlayer';
import { PlayingCard, CardFan } from './PlayingCard';
import { PotDisplay, ChipStack } from './ChipStack';
import { ActionButtons } from './ActionButtons';
import { ChatPanel } from './ChatPanel';
import { cn } from '../utils/cn';
import { ActionType } from '../types';

// Player positions around the table
const PLAYER_POSITIONS = [
  'bottom',      // Current player
  'left',        // Player 2
  'top-left',    // Player 3
  'top',         // Player 4
  'top-right',   // Player 5
  'right'        // Player 6
] as const;

export function GameTableNew() {
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
  const [timeLeft, setTimeLeft] = useState(30);

  // Timer for current turn
  useEffect(() => {
    if (!isMyTurn) {
      setTimeLeft(30);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Auto-pack on timeout
          performAction('pack');
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isMyTurn, performAction]);

  const handleAction = useCallback((action: ActionType, amount?: number) => {
    performAction(action, amount);
  }, [performAction]);

  if (!gameState) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-white/60">Loading game...</p>
      </div>
    );
  }

  const { session } = gameState;

  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-b from-gray-900 via-gray-900 to-black">
      {/* Ambient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(139,0,0,0.15)_0%,_transparent_70%)]" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-red-900/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-900/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-20 flex items-center justify-between px-4 py-3"
      >
        <button
          onClick={() => {/* Navigate back */}}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/40 backdrop-blur-sm text-white/80 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Leave</span>
        </button>

        <div className="flex items-center gap-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-900/80 to-red-800/80 backdrop-blur-sm border border-red-500/30"
          >
            <span className="text-sm font-medium text-white">
              {currentRoom?.name || 'Classic Table'}
            </span>
          </motion.div>

          <button
            onClick={toggleSound}
            className="p-2 rounded-xl bg-black/40 backdrop-blur-sm text-white/60 hover:text-white transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

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

      {/* Game Table */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4" style={{ height: 'calc(100vh - 200px)' }}>
        {/* Table surface */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative w-full max-w-md aspect-[4/5] rounded-[60px] overflow-hidden"
        >
          {/* Table felt */}
          <div className="absolute inset-0 bg-gradient-to-b from-green-800 via-green-900 to-green-950" />

          {/* Felt texture */}
          <div className="absolute inset-0 opacity-30">
            <div className="w-full h-full" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              backgroundSize: '150px 150px'
            }} />
          </div>

          {/* Table border (wood rim) */}
          <div className="absolute inset-0 rounded-[60px] border-[12px] border-yellow-900/80 shadow-inner">
            <div className="absolute inset-0 rounded-[48px] border-4 border-yellow-700/40" />
          </div>

          {/* Inner decoration */}
          <div className="absolute inset-8 rounded-[40px] border border-yellow-600/20" />

          {/* Pot in center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <PotDisplay amount={session.pot} />
          </div>

          {/* Game message */}
          <AnimatePresence>
            {gameMessage && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-black/60 backdrop-blur-sm"
              >
                <span className="text-sm text-yellow-400 font-medium">{gameMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Players around table */}
          {session.players.map((player, index) => (
            <GamePlayerComponent
              key={player.id}
              player={player}
              isCurrentUser={index === 0}
              showCards={showCards || index === 0}
              position={PLAYER_POSITIONS[index]}
              timeLeft={player.isTurn ? timeLeft : undefined}
            />
          ))}
        </motion.div>
      </div>

      {/* My Cards (floating) */}
      {myCards.length > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-40 left-1/2 -translate-x-1/2 z-20"
        >
          <div className="relative">
            <CardFan
              cards={myCards}
              isHidden={!showCards}
              showOnHover
              size="lg"
            />
            <button
              onClick={toggleShowCards}
              className={cn(
                'absolute -bottom-8 left-1/2 -translate-x-1/2',
                'px-3 py-1 rounded-full text-xs font-medium',
                'bg-black/60 backdrop-blur-sm border border-white/20',
                showCards ? 'text-yellow-400' : 'text-white/60'
              )}
            >
              {showCards ? 'Hide Cards' : 'Show Cards'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      {isMyTurn && (
        <ActionButtons
          availableActions={availableActions}
          currentBet={session.currentBet}
          isBlind={session.players[0]?.isBlind ?? true}
          chips={user?.chips || 0}
          onAction={handleAction}
        />
      )}

      {/* Waiting indicator */}
      {!isMyTurn && gameState && !gameState.isGameOver && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-10"
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/60 backdrop-blur-sm">
            <motion.div
              className="w-2 h-2 bg-yellow-400 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
            <span className="text-sm text-white/80">Waiting for other players...</span>
          </div>
        </motion.div>
      )}

      {/* Chat Panel */}
      <AnimatePresence>
        {isChatOpen && (
          <ChatPanel onClose={toggleChat} />
        )}
      </AnimatePresence>

      {/* Help button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1 }}
        className="fixed bottom-4 right-4 z-10 p-3 rounded-full bg-white/10 backdrop-blur-sm text-white/60 hover:text-white transition-colors"
      >
        <HelpCircle className="w-5 h-5" />
      </motion.button>
    </div>
  );
}
