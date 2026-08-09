import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, LogOut, Volume2, VolumeX, Eye, EyeOff, Clock
} from 'lucide-react';
import { useGameStore } from '../stores/gameStore';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { useSound } from '../hooks/useSound';
import { useHaptics } from '../hooks/useHaptics';
import { BettingControls } from './BettingControls';
import { ChatPanel } from './ChatPanel';
import { WinnerCelebration } from './Celebrations';
import { PremiumCard, PremiumCardFan } from './PremiumCard';
import { CharacterAvatar } from './AvatarSystem';
import { PotGlow, TurnPulse } from './GameJuice';
import { cn } from '../utils/cn';
import { ActionType, GamePlayer } from '../types';
import { evaluateHand, getHandRankName } from '../game/handRanking';
import { premiumSounds } from '../services/premiumSounds';
import { AnimatedChipCount, ParallaxBackground } from './PolishTouches';

// ─── AI Player Name Map ────────────────────────────────────────────────────
const AI_NAMES: Record<string, string> = {
  'ai-sharma': 'Sharma Ji',
  'ai-priya': 'Priya',
  'ai-bunty': 'Bunty',
  'ai-meera': 'Meera',
  'ai-raja': 'Raja',
  'ai-anita': 'Anita',
  'ai-vikram': 'Vikram',
  'ai-deepa': 'Deepa',
};

// Map AI player IDs to CharacterAvatar IDs
const AI_AVATAR_IDS: Record<string, string> = {
  'ai-sharma': 'sharma_ji', 'ai-priya': 'priya', 'ai-bunty': 'bunty',
  'ai-meera': 'meera', 'ai-raja': 'raja', 'ai-anita': 'anita',
  'ai-vikram': 'vikram', 'ai-deepa': 'deepa',
};

// ─── Seat Positions (trigonometric around oval) ────────────────────────────
// For a 4-player game on mobile: bottom (you), left, top, right
// Positions are % of container width/height

interface SeatPosition {
  top: string;
  left: string;
  cardSide: 'above' | 'below' | 'left' | 'right';
  betOffset: { top: string; left: string };
}

function getSeatPositions(playerCount: number): SeatPosition[] {
  // Hand-tuned positions for each player count
  if (playerCount === 2) {
    return [
      { top: '82%', left: '50%', cardSide: 'above', betOffset: { top: '-35%', left: '0' } },
      { top: '8%', left: '50%', cardSide: 'below', betOffset: { top: '35%', left: '0' } },
    ];
  }
  if (playerCount === 3) {
    return [
      { top: '82%', left: '50%', cardSide: 'above', betOffset: { top: '-30%', left: '0' } },
      { top: '25%', left: '12%', cardSide: 'right', betOffset: { top: '10%', left: '30%' } },
      { top: '25%', left: '88%', cardSide: 'left', betOffset: { top: '10%', left: '-30%' } },
    ];
  }
  if (playerCount === 4) {
    return [
      { top: '82%', left: '50%', cardSide: 'above', betOffset: { top: '-28%', left: '0' } },
      { top: '50%', left: '8%', cardSide: 'right', betOffset: { top: '-5%', left: '25%' } },
      { top: '8%', left: '50%', cardSide: 'below', betOffset: { top: '28%', left: '0' } },
      { top: '50%', left: '92%', cardSide: 'left', betOffset: { top: '-5%', left: '-25%' } },
    ];
  }
  if (playerCount === 5) {
    return [
      { top: '85%', left: '50%', cardSide: 'above', betOffset: { top: '-25%', left: '0' } },
      { top: '60%', left: '6%', cardSide: 'right', betOffset: { top: '-10%', left: '22%' } },
      { top: '12%', left: '22%', cardSide: 'below', betOffset: { top: '25%', left: '10%' } },
      { top: '12%', left: '78%', cardSide: 'below', betOffset: { top: '25%', left: '-10%' } },
      { top: '60%', left: '94%', cardSide: 'left', betOffset: { top: '-10%', left: '-22%' } },
    ];
  }
  // 6 players
  return [
    { top: '85%', left: '50%', cardSide: 'above', betOffset: { top: '-22%', left: '0' } },
    { top: '65%', left: '6%', cardSide: 'right', betOffset: { top: '-10%', left: '20%' } },
    { top: '20%', left: '10%', cardSide: 'right', betOffset: { top: '10%', left: '20%' } },
    { top: '8%', left: '50%', cardSide: 'below', betOffset: { top: '22%', left: '0' } },
    { top: '20%', left: '90%', cardSide: 'left', betOffset: { top: '10%', left: '-20%' } },
    { top: '65%', left: '94%', cardSide: 'left', betOffset: { top: '-10%', left: '-20%' } },
  ];
}

function getPlayerDisplayName(player: GamePlayer, isCurrentUser: boolean): string {
  if (isCurrentUser) return 'You';
  // Check AI name map
  const aiName = AI_NAMES[player.userId];
  if (aiName) return aiName;
  return player.user?.username || `Player ${player.seatPosition + 1}`;
}

// ─── Component ─────────────────────────────────────────────────────────────

interface EnhancedGameTableProps {
  onLeave?: () => void;
}

export function EnhancedGameTable({ onLeave }: EnhancedGameTableProps) {
  const {
    gameState, myCards, isMyTurn, availableActions, showCards,
    toggleShowCards, performOnlineAction, chatMessages, isChatOpen,
    toggleChat, gameMessage, currentRoom, myPlayerId
  } = useGameStore();

  const { user } = useAuthStore();
  const { soundEnabled, toggleSound } = useUIStore();
  const { play } = useSound();
  const { onTurn, onWin, onButtonPress } = useHaptics();

  const [timeLeft, setTimeLeft] = useState(30);
  const [showWinCelebration, setShowWinCelebration] = useState(false);
  const [winner, setWinner] = useState<{ name: string; amount: number; handRank: any } | null>(null);

  const submitAction = useCallback((action: ActionType, amount?: number) => {
    void performOnlineAction(action, amount);
  }, [performOnlineAction]);

  // Play dealing sound when game starts
  useEffect(() => {
    if (gameState && !gameState.isGameOver) {
      premiumSounds.init();
      const dealTimers = session.players.map((_, i) => window.setTimeout(() => premiumSounds.play('card_deal'), 200 + i * 150));
      premiumSounds.play('game_start');
      return () => dealTimers.forEach(timer => window.clearTimeout(timer));
    }
    return undefined;
  }, [gameState?.session.id]);

  // Timer
  useEffect(() => {
    if (!isMyTurn) { setTimeLeft(30); return; }
    onTurn(); premiumSounds.play('turn_alert');
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 5) premiumSounds.play('countdown_urgent');
        else if (prev <= 10) premiumSounds.play('countdown_tick');
        if (prev <= 1) { submitAction('pack'); return 30; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isMyTurn, submitAction, onTurn, play]);

  // Win detection
  useEffect(() => {
    if (gameState?.isGameOver && gameState.winners.length > 0) {
      const wp = gameState.session.players.find(p => gameState.winners.includes(p.id));
      if (wp) {
        const hand = wp.cards ? evaluateHand(wp.cards) : null;
        setWinner({
          name: getPlayerDisplayName(wp, wp.userId === user?.id),
          amount: gameState.session.pot,
          handRank: hand?.rank || 'high_card',
        });
        if (wp.userId === user?.id) {
          onWin();
          // Tiered win sound based on pot size
          if (gameState.session.pot >= 10000) premiumSounds.play('win_jackpot');
          else if (gameState.session.pot >= 2000) premiumSounds.play('win_big');
          else premiumSounds.play('win_small');
        } else {
          premiumSounds.play('lose');
        }
        // Reveal all cards with staggered card flip sounds
        const revealTimers = gameState.session.players.map((_, i) => window.setTimeout(() => premiumSounds.play('card_flip'), i * 200));
        const celebrationTimer = window.setTimeout(() => setShowWinCelebration(true), 800);
        return () => {
          revealTimers.forEach(timer => window.clearTimeout(timer));
          window.clearTimeout(celebrationTimer);
        };
      }
    }
    return undefined;
  }, [gameState?.isGameOver]);

  const handleAction = useCallback((action: ActionType, amount?: number) => {
    onButtonPress();
    // Premium sounds
    if (['chaal', 'blind', 'raise'].includes(action)) {
      premiumSounds.play('chip_single');
    } else if (action === 'pack') {
      premiumSounds.play('card_fold');
    } else if (action === 'show') {
      premiumSounds.play('show_reveal');
    }
    submitAction(action, amount);
  }, [submitAction, onButtonPress]);

  const orderedPlayers = useMemo(() => {
    const players = gameState?.session.players ?? [];
    const myIndex = players.findIndex((player) => player.id === myPlayerId || player.userId === user?.id);
    if (myIndex <= 0) return players;
    return [...players.slice(myIndex), ...players.slice(0, myIndex)];
  }, [gameState?.session.players, myPlayerId, user?.id]);

  const seatPositions = useMemo(
    () => getSeatPositions(orderedPlayers.length || 4),
    [orderedPlayers.length],
  );

  if (!gameState) {
    return (
      <div className="flex h-full items-center justify-center bg-[#07110E]">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="h-12 w-12 rounded-full border-4 border-[#E8B04A]/20 border-t-[#E8B04A]" />
      </div>
    );
  }

  const { session } = gameState;
  const myPlayer = orderedPlayers.find((player) => player.id === myPlayerId || player.userId === user?.id);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#07110E] text-[#F6ECD8]" role="main" aria-label="Teen Patti game table">
      {/* Parallax particle background */}
      <ParallaxBackground intensity={0.6} className="z-0" />

      {/* Ambient lighting — overhead lamp effect */}
      <div className="absolute inset-0 pointer-events-none z-[1]">
        <div className="absolute left-1/2 top-[40%] h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#163E2D] opacity-20 blur-[180px]" />
      </div>

      {/* ─── Header (minimal, clean) ──────────────────────────────────── */}
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-30 flex items-center justify-between px-4 py-2 pt-3"
      >
        <button type="button" aria-label="Leave table" onClick={onLeave}
          className="rounded-full border border-white/10 bg-[#0E1B17] p-2.5 text-[#8E9C94] active:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B04A]">
          <LogOut className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-1">
          <div className="rounded-full border border-white/10 bg-[#0E1B17] px-3 py-1 text-xs font-medium text-[#C7D3CC]">
            {currentRoom?.name || 'Table'}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button type="button" aria-label={soundEnabled ? 'Mute sound' : 'Turn on sound'} onClick={toggleSound} className="rounded-full border border-white/10 bg-[#0E1B17] p-2.5 text-[#8E9C94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B04A]">
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button type="button" aria-label="Open table chat" onClick={toggleChat}
            className="relative rounded-full border border-white/10 bg-[#0E1B17] p-2.5 text-[#8E9C94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B04A]">
            <MessageCircle className="w-4 h-4" />
            {chatMessages.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] flex items-center justify-center text-white font-bold">
                {chatMessages.length}
              </span>
            )}
          </button>
        </div>
      </motion.header>

      {/* ─── Game Table ───────────────────────────────────────────────── */}
      <div className="relative z-10 flex-1" style={{ height: 'calc(100dvh - 180px)', minHeight: '400px' }}>
        {/* Table felt (oval) */}
        <div className="absolute left-1/2 top-1/2 w-[88%] max-w-[360px] -translate-x-1/2 -translate-y-[52%] sm:max-w-[440px] lg:max-w-[560px] xl:max-w-[620px]" style={{ aspectRatio: '1 / 1.12' }}>
          {/* Outer rim */}
          <div className="absolute inset-0 rounded-[50%] bg-[#4A2E1C] shadow-[0_8px_40px_rgba(0,0,0,0.6)]" />

          {/* Gold trim */}
          <div className="absolute inset-[6px] rounded-[50%] border-[2px] border-[#E8B04A]/40" />

          {/* Felt surface */}
          <div className="absolute inset-[10px] rounded-[50%] bg-[#163E2D] shadow-[inset_0_0_60px_rgba(0,0,0,0.5)]">
            {/* Felt texture */}
            <div className="absolute inset-0 rounded-[50%] opacity-[0.08]" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              backgroundSize: '128px 128px',
            }} />

            {/* Inner line decoration */}
            <div className="absolute inset-[16px] rounded-[50%] border border-[#E8B04A]/10" />

          </div>

          {/* Pot glow effect */}
          <PotGlow amount={session.pot} className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24" />

          {/* ─── Pot Display (center of table) ──────────────────────── */}
          <motion.div
            className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
          >
            {/* Chip stack visual */}
            <div className="flex -space-x-2 mb-1">
              {Array.from({ length: Math.min(Math.ceil(session.pot / 200), 5) }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 + i * 0.08 }}
                  className="w-7 h-7 rounded-full border-2 border-dashed relative"
                  style={{
                    backgroundColor: ['#B74035', '#245A7A', '#3F7655', '#76517F', '#E8B04A'][i % 5],
                    borderColor: 'rgba(255,255,255,0.3)',
                    zIndex: 5 - i,
                  }}
                >
                  <div className="absolute inset-[3px] rounded-full border border-white/20" />
                </motion.div>
              ))}
            </div>
            <AnimatedChipCount
              value={session.pot}
              prefix="◉ "
              className="text-lg font-bold text-[#E8B04A] drop-shadow-[0_0_12px_rgba(232,176,74,0.35)]"
            />
            <span className="text-white/30 text-[9px] uppercase tracking-[0.2em] mt-0.5">Pot</span>
          </motion.div>

          {/* ─── Game Status Messages ────────────────────────────────── */}
          <AnimatePresence>
            {gameMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute top-[62%] left-1/2 -translate-x-1/2 z-20"
              >
                <div className="px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10">
                  <span className="text-xs font-medium text-[#E8B04A]">{gameMessage}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Players Around Table ────────────────────────────────── */}
          {orderedPlayers.map((player, index) => {
            const seat = seatPositions[index];
            if (!seat) return null;
            const isMe = player.id === myPlayer?.id;
            const displayName = getPlayerDisplayName(player, isMe);
            const isActive = player.status === 'playing' || player.status === 'show';
            const isFolded = player.status === 'folded';

            return (
              <motion.div
                key={player.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
                style={{ top: seat.top, left: seat.left }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{
                  opacity: isFolded ? 0.35 : 1,
                  scale: isFolded ? 0.9 : 1,
                  filter: isFolded ? 'grayscale(0.8)' : 'grayscale(0)',
                }}
                transition={{ delay: index * 0.1, type: 'spring' }}
              >
                {/* Player cards — premium design */}
                {isActive && player.cards && !isMe && (
                  <div className={cn(
                    'absolute flex gap-0.5',
                    seat.cardSide === 'above' && '-top-14 left-1/2 -translate-x-1/2',
                    seat.cardSide === 'below' && '-bottom-14 left-1/2 -translate-x-1/2',
                    seat.cardSide === 'left' && 'top-1/2 -translate-y-1/2 -left-16',
                    seat.cardSide === 'right' && 'top-1/2 -translate-y-1/2 -right-16',
                  )}>
                    {player.cards.map((card, ci) => (
                      <motion.div
                        key={ci}
                        initial={{ y: -15, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: ci * 0.1, type: 'spring', damping: 20 }}
                      >
                        <PremiumCard
                          card={card}
                          hidden={!showCards && !gameState.isGameOver}
                          size="sm"
                        />
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Bet amount (toward center) */}
                {player.currentBet > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute z-[5]"
                    style={{ top: seat.betOffset.top, left: seat.betOffset.left }}
                  >
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 border border-white/10">
                      <div className="h-3 w-3 rounded-full border border-white/30 bg-[#E8B04A]" />
                      <AnimatedChipCount value={player.currentBet} prefix="◉ " className="text-[10px] font-bold text-[#E8B04A]" />
                    </div>
                  </motion.div>
                )}

                {/* Avatar + name */}
                <div className="flex flex-col items-center">
                  <div className="relative">
                    {/* Turn ring */}
                    {player.isTurn && (
                      <motion.div
                        className="absolute -inset-[3px] rounded-full"
                        style={{
                          background: `conic-gradient(from 0deg, #22c55e, #eab308, #ef4444, #22c55e)`,
                          mask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 2px))',
                          WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 2px))',
                        }}
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                      />
                    )}

                    {/* Avatar — premium character or user initial */}
                    <motion.div
                      className={cn(
                        'relative',
                        isFolded && 'grayscale opacity-60',
                        gameState.isGameOver && gameState.winners.some(wId => {
                          const wp = session.players.find(p => p.id === wId);
                          return wp?.userId === player.userId;
                        }) && 'drop-shadow-[0_0_12px_rgba(234,179,8,0.7)]',
                      )}
                      animate={player.isTurn ? {
                        filter: ['drop-shadow(0 0 8px rgba(234,179,8,0.3))', 'drop-shadow(0 0 16px rgba(234,179,8,0.6))', 'drop-shadow(0 0 8px rgba(234,179,8,0.3))'],
                      } : {}}
                      transition={player.isTurn ? { repeat: Infinity, duration: 1.5 } : {}}
                    >
                      {!isMe && AI_AVATAR_IDS[player.userId] ? (
                        <CharacterAvatar
                          characterId={AI_AVATAR_IDS[player.userId] as any}
                          size={isMe ? 'lg' : 'md'}
                          showFrame={player.isTurn}
                        />
                      ) : (
                        <div className={cn(
                          'rounded-full flex items-center justify-center font-bold text-white border-2',
                          isMe ? 'w-14 h-14 border-[#E8B04A]/60 bg-[#B74035] text-lg'
                            : 'w-11 h-11 border-white/20 bg-[#245A7A] text-sm'
                        )}>
                          {displayName[0].toUpperCase()}
                        </div>
                      )}
                    </motion.div>

                    {/* Dealer chip */}
                    {player.isDealer && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-[#F6ECD8]/40 bg-[#E8B04A] shadow-lg">
                        <span className="text-[8px] font-black text-[#171006]">D</span>
                      </motion.div>
                    )}

                    {/* Blind/Seen badge */}
                    <div className={cn(
                      'absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white',
                      player.isBlind ? 'bg-blue-600' : 'bg-green-600'
                    )}>
                      {player.isBlind ? <EyeOff className="w-2 h-2" /> : <Eye className="w-2 h-2" />}
                    </div>
                  </div>

                  {/* Name + chips */}
                  <div className="flex flex-col items-center mt-1 px-2 py-0.5 rounded-lg bg-black/40 backdrop-blur-sm">
                    <span className={cn(
                      'text-[10px] font-semibold leading-tight truncate max-w-[64px]',
                      isMe ? 'text-[#E8B04A]' : 'text-white'
                    )}>
                      {displayName}
                    </span>
                    <span className={cn(
                      'text-[9px] font-bold leading-tight',
                      isFolded ? 'text-red-400' : 'text-green-400'
                    )}>
                      {isFolded ? 'PACKED' : <AnimatedChipCount value={player.chipsInPlay} prefix="◉ " className="text-[9px] font-bold leading-tight" />}
                    </span>
                  </div>

                  {/* Timer for current turn */}
                  {player.isTurn && !isMe && (
                    <div className="flex items-center gap-0.5 mt-0.5">
                      <Clock className="w-2.5 h-2.5 text-yellow-400" />
                      <span className={cn('text-[9px] font-bold',
                        timeLeft > 15 ? 'text-green-400' : timeLeft > 5 ? 'text-yellow-400' : 'text-red-400'
                      )}>{timeLeft}s</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ─── My Cards (floating, prominent) ───────────────────────────── */}
      {myCards.length > 0 && myPlayer?.status !== 'folded' && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          className={cn(
            'fixed left-1/2 -translate-x-1/2 z-20 flex flex-col items-center',
            isMyTurn && !gameState.isGameOver ? 'bottom-[215px]' : 'bottom-[60px]'
          )}
        >
          {/* Premium card fan */}
          <PremiumCardFan
            cards={myCards}
            hidden={!showCards}
            size="lg"
            isWinner={gameState.isGameOver && gameState.winners.some(wId => {
              const wp = session.players.find(p => p.id === wId);
              return wp?.userId === user?.id;
            })}
          />

          {/* See/Hide button */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={toggleShowCards}
            className={cn(
              'mt-2 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-semibold',
              'bg-black/70 backdrop-blur-md border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B04A]',
              showCards
                ? 'text-[#E8B04A] border-[#E8B04A]/30'
                : 'text-white/50 border-white/10'
            )}
          >
            {showCards ? <><EyeOff className="w-3.5 h-3.5" />Hide</> : <><Eye className="w-3.5 h-3.5" />See Cards</>}
          </motion.button>

          {/* Hand rank badge */}
          <AnimatePresence>
            {showCards && myCards.length === 3 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="mt-1.5 rounded-full border border-[#E8B04A]/30 bg-[#2A1714] px-4 py-1"
              >
                <span className="text-[11px] font-bold tracking-wide text-[#E8B04A]">
                  {getHandRankName(evaluateHand(myCards).rank)}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ─── Betting Controls ─────────────────────────────────────────── */}
      {isMyTurn && !gameState.isGameOver && (
        <BettingControls
          availableActions={availableActions}
          currentBet={session.currentBet}
          minBet={session.bootAmount}
          maxBet={user?.chips || 10000}
          isBlind={myPlayer?.isBlind ?? true}
          playerChips={myPlayer?.chipsInPlay || 0}
          pot={session.pot}
          onAction={handleAction}
        />
      )}

      {/* Waiting indicator — shows whose turn it is */}
      {!isMyTurn && !gameState.isGameOver && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+1.5rem)] left-1/2 z-10 -translate-x-1/2">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10">
            <motion.div className="h-1.5 w-1.5 rounded-full bg-[#E8B04A]"
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1.2 }} />
            <span className="text-white/60 text-xs">
              {(() => {
                const turnPlayer = session.players.find(p => p.isTurn);
                if (!turnPlayer) return 'Waiting...';
                const name = getPlayerDisplayName(turnPlayer, false);
                return `${name}'s turn`;
              })()}
            </span>
          </div>
        </motion.div>
      )}

      {/* My turn timer */}
      {isMyTurn && !gameState.isGameOver && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed bottom-[200px] right-4 z-20"
        >
          <div className="relative w-12 h-12">
            <svg className="w-full h-full -rotate-90">
              <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
              <motion.circle cx="24" cy="24" r="20" fill="none"
                stroke={timeLeft > 15 ? '#22c55e' : timeLeft > 5 ? '#eab308' : '#ef4444'}
                strokeWidth="3" strokeLinecap="round"
                strokeDasharray={`${(timeLeft / 30) * 126} 126`} />
            </svg>
            <span className={cn('absolute inset-0 flex items-center justify-center text-sm font-bold',
              timeLeft > 15 ? 'text-green-400' : timeLeft > 5 ? 'text-yellow-400' : 'text-red-400'
            )}>{timeLeft}</span>
          </div>
        </motion.div>
      )}

      {/* Game Over */}
      {gameState.isGameOver && !showWinCelebration && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+2rem)] left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2">
          <button type="button" onClick={onLeave}
            className="rounded-2xl bg-[#E8B04A] px-8 py-3 font-bold text-[#171006] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFF9ED]">
            Return to lobby
          </button>
        </motion.div>
      )}

      {/* Chat */}
      <AnimatePresence>{isChatOpen && <ChatPanel onClose={toggleChat} />}</AnimatePresence>

      {/* Winner Celebration */}
      {winner && (
        <WinnerCelebration isVisible={showWinCelebration} winnerName={winner.name}
          amount={winner.amount} handRank={winner.handRank}
          onClose={() => { setShowWinCelebration(false); setWinner(null); }} />
      )}

      {/* Turn pulse — golden vignette when it's your turn */}
      <TurnPulse isMyTurn={isMyTurn && !gameState.isGameOver} />

    </div>
  );
}
