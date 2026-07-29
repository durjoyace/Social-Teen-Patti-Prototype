import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, LogOut, Volume2, VolumeX, Eye, EyeOff,
  Crown, Clock, MoreHorizontal, Mic
} from 'lucide-react';
import { useGameStore } from '../stores/gameStore';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { useSound } from '../hooks/useSound';
import { useHaptics } from '../hooks/useHaptics';
import { BettingControls } from './BettingControls';
import { ChatPanel } from './ChatPanel';
import { WinnerCelebration, ChipsFlying } from './Celebrations';
import { PremiumCard, PremiumCardFan } from './PremiumCard';
import { CharacterAvatar } from './AvatarSystem';
import { PotGlow, TurnPulse, ActionFeedback } from './GameJuice';
import { cn } from '../utils/cn';
import { ActionType, GamePlayer, Card } from '../types';
import { evaluateHand, getHandRankName } from '../game/handRanking';
import { formatChips } from '../game/gameEngine';
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

// Player avatar config (color + emoji for personality)
const SEAT_AVATARS = [
  { gradient: 'from-yellow-500 to-amber-700', emoji: '' },     // You (seat 0) — no emoji, shows initial
  { gradient: 'from-blue-500 to-blue-800', emoji: '🎯' },
  { gradient: 'from-emerald-500 to-emerald-800', emoji: '🔥' },
  { gradient: 'from-purple-500 to-purple-800', emoji: '👑' },
  { gradient: 'from-pink-500 to-pink-800', emoji: '💫' },
  { gradient: 'from-cyan-500 to-cyan-800', emoji: '🎲' },
];

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
    toggleChat, gameMessage, currentRoom
  } = useGameStore();

  const { user } = useAuthStore();
  const { soundEnabled, toggleSound } = useUIStore();
  const { play, playChipSound } = useSound();
  const { onTurn, onWin, onButtonPress } = useHaptics();

  const [timeLeft, setTimeLeft] = useState(30);
  const [showWinCelebration, setShowWinCelebration] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [winner, setWinner] = useState<{ name: string; amount: number; handRank: any } | null>(null);

  const submitAction = useCallback((action: ActionType, amount?: number) => {
    void performOnlineAction(action, amount);
  }, [performOnlineAction]);

  // Play dealing sound when game starts
  useEffect(() => {
    if (gameState && !gameState.isGameOver) {
      premiumSounds.init();
      // Staggered dealing sounds
      session.players.forEach((_, i) => {
        setTimeout(() => premiumSounds.play('card_deal'), 200 + i * 150);
      });
      premiumSounds.play('game_start');
    }
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
        gameState.session.players.forEach((_, i) => {
          setTimeout(() => premiumSounds.play('card_flip'), i * 200);
        });
        setTimeout(() => setShowWinCelebration(true), 800);
      }
    }
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

  const seatPositions = useMemo(() =>
    getSeatPositions(gameState?.session.players.length || 4),
    [gameState?.session.players.length]
  );

  if (!gameState) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0a1628]">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-12 h-12 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full" />
      </div>
    );
  }

  const { session } = gameState;

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0a1628]" role="main" aria-label="Teen Patti game table">
      {/* Parallax particle background */}
      <ParallaxBackground intensity={0.6} className="z-0" />

      {/* Ambient lighting — overhead lamp effect */}
      <div className="absolute inset-0 pointer-events-none z-[1]">
        {/* Green table glow */}
        <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#1a5a2a] rounded-full blur-[180px] opacity-25" />
        {/* Overhead warm spotlight */}
        <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-60 h-60 bg-yellow-600/8 rounded-full blur-[80px]" />
        {/* Edge vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.4)_100%)]" />
        {/* Top lamp beam */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-[15%] bg-gradient-to-b from-yellow-400/20 to-transparent" />
        <div className="absolute top-[14%] left-1/2 -translate-x-1/2 w-32 h-8 bg-yellow-500/5 rounded-full blur-xl" />
      </div>

      {/* ─── Header (minimal, clean) ──────────────────────────────────── */}
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-30 flex items-center justify-between px-4 py-2 pt-3"
      >
        <button onClick={onLeave}
          className="p-2.5 rounded-full bg-white/5 text-white/60 active:bg-white/10">
          <LogOut className="w-4.5 h-4.5" />
        </button>

        <div className="flex items-center gap-1">
          <div className="px-3 py-1 rounded-full bg-white/5 text-white/70 text-xs font-medium">
            {currentRoom?.name || 'Table'}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={toggleSound} className="p-2.5 rounded-full bg-white/5 text-white/60">
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button onClick={toggleChat}
            className="relative p-2.5 rounded-full bg-white/5 text-white/60">
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[52%] w-[88%] max-w-[360px] sm:max-w-[400px]" style={{ aspectRatio: '1 / 1.12' }}>
          {/* Outer rim */}
          <div className="absolute inset-0 rounded-[50%] bg-gradient-to-b from-[#5a3825] via-[#4a2e1c] to-[#3a2415] shadow-[0_8px_40px_rgba(0,0,0,0.6)]" />

          {/* Gold trim */}
          <div className="absolute inset-[6px] rounded-[50%] border-[2px] border-[#D4AF37]/40" />

          {/* Felt surface */}
          <div className="absolute inset-[10px] rounded-[50%] bg-gradient-to-br from-[#1a5c32] via-[#145228] to-[#0e3d1e] shadow-[inset_0_0_60px_rgba(0,0,0,0.5)]">
            {/* Felt texture */}
            <div className="absolute inset-0 rounded-[50%] opacity-[0.08]" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              backgroundSize: '128px 128px',
            }} />

            {/* Inner line decoration */}
            <div className="absolute inset-[16px] rounded-[50%] border border-[#D4AF37]/10" />

            {/* Center glow */}
            <div className="absolute inset-0 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.06)_0%,transparent_60%)]" />
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
                    background: `linear-gradient(135deg, ${['#ef4444','#3b82f6','#22c55e','#a855f7','#eab308'][i % 5]} 0%, ${['#dc2626','#2563eb','#16a34a','#9333ea','#ca8a04'][i % 5]} 100%)`,
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
              className="text-[#D4AF37] font-bold text-lg drop-shadow-[0_0_12px_rgba(212,175,55,0.4)]"
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
                  <span className="text-[#D4AF37] text-xs font-medium">{gameMessage}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Players Around Table ────────────────────────────────── */}
          {session.players.map((player, index) => {
            const seat = seatPositions[index];
            if (!seat) return null;
            const isMe = index === 0;
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
                    className="absolute z-5"
                    style={{ top: seat.betOffset.top, left: seat.betOffset.left }}
                  >
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 border border-white/10">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-b from-yellow-400 to-yellow-600 border border-white/30" />
                      <AnimatedChipCount value={player.currentBet} prefix="◉ " className="text-yellow-300 text-[10px] font-bold" />
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
                          isMe ? 'w-14 h-14 border-yellow-500/60 bg-gradient-to-br from-yellow-500 to-amber-700 text-lg'
                            : 'w-11 h-11 border-white/20 bg-gradient-to-br from-blue-500 to-blue-800 text-sm'
                        )}>
                          {displayName[0].toUpperCase()}
                        </div>
                      )}
                    </motion.div>

                    {/* Dealer chip */}
                    {player.isDealer && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-b from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg border border-yellow-300/50">
                        <span className="text-[8px] font-black text-yellow-900">D</span>
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
                      isMe ? 'text-yellow-400' : 'text-white'
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
      {myCards.length > 0 && session.players[0]?.status !== 'folded' && (
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
            whileTap={{ scale: 0.95 }}
            onClick={toggleShowCards}
            className={cn(
              'mt-2 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-semibold',
              'bg-black/70 backdrop-blur-md border',
              showCards
                ? 'text-yellow-400 border-yellow-500/30'
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
                className="mt-1.5 px-4 py-1 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30"
              >
                <span className="text-yellow-400 text-[11px] font-bold tracking-wide">
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
          isBlind={session.players[0]?.isBlind ?? true}
          playerChips={session.players[0]?.chipsInPlay || 0}
          pot={session.pot}
          onAction={handleAction}
        />
      )}

      {/* Waiting indicator — shows whose turn it is */}
      {!isMyTurn && !gameState.isGameOver && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-10">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10">
            <motion.div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"
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
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
          <button onClick={onLeave}
            className="px-8 py-3 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold shadow-lg shadow-orange-500/30">
            Play Again
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

// ─── Card Components ───────────────────────────────────────────────────────

const SUIT_SYMBOLS: Record<string, { symbol: string; color: string }> = {
  hearts: { symbol: '♥', color: 'text-red-500' },
  diamonds: { symbol: '♦', color: 'text-red-500' },
  clubs: { symbol: '♣', color: 'text-gray-900' },
  spades: { symbol: '♠', color: 'text-gray-900' },
};

function GameCard({ card, hidden, size = 'md' }: { card: Card; hidden: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const dims = size === 'lg' ? { w: 'w-[62px]', h: 'h-[86px]', r: 'rounded-xl' }
    : size === 'md' ? { w: 'w-[46px]', h: 'h-[64px]', r: 'rounded-lg' }
    : { w: 'w-[34px]', h: 'h-[47px]', r: 'rounded-md' };
  const fontSize = size === 'lg' ? 'text-[17px]' : size === 'md' ? 'text-sm' : 'text-[10px]';
  const suitSize = size === 'lg' ? 'text-[28px]' : size === 'md' ? 'text-lg' : 'text-xs';
  const suitSmall = size === 'lg' ? 'text-[11px]' : size === 'md' ? 'text-[9px]' : 'text-[7px]';
  const suit = SUIT_SYMBOLS[card.suit];

  return (
    <div className={cn(dims.w, dims.h, dims.r, 'relative select-none')}
      style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4)) drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}>
      {hidden ? (
        // Card back — rich ornate design
        <div className={cn('w-full h-full', dims.r, 'bg-gradient-to-br from-[#8B0000] via-[#7a0000] to-[#520000] border border-[#D4AF37]/50 overflow-hidden')}>
          {/* Outer gold border inset */}
          <div className={cn('absolute inset-[2px]', dims.r, 'border border-[#D4AF37]/25 overflow-hidden')}>
            {/* Diamond lattice pattern */}
            <div className="absolute inset-0" style={{
              backgroundImage: `
                linear-gradient(45deg, rgba(212,175,55,0.08) 25%, transparent 25%),
                linear-gradient(-45deg, rgba(212,175,55,0.08) 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, rgba(212,175,55,0.08) 75%),
                linear-gradient(-45deg, transparent 75%, rgba(212,175,55,0.08) 75%)
              `,
              backgroundSize: size === 'lg' ? '12px 12px' : '8px 8px',
              backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0px',
            }} />
            {/* Inner oval frame */}
            <div className="absolute inset-[15%] rounded-[50%] border border-[#D4AF37]/20" />
          </div>
          {/* Center emblem */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={cn(
              'rounded-full bg-gradient-to-br from-[#D4AF37]/40 to-[#8B6914]/30 border border-[#D4AF37]/50 flex items-center justify-center',
              size === 'lg' ? 'w-7 h-7' : size === 'md' ? 'w-5 h-5' : 'w-4 h-4'
            )}>
              <span className={cn('text-[#D4AF37] font-black', size === 'lg' ? 'text-[8px]' : 'text-[6px]')}>TP</span>
            </div>
          </div>
          {/* Top-left shine */}
          <div className={cn('absolute inset-0', dims.r, 'bg-gradient-to-br from-white/10 via-transparent to-transparent')} />
        </div>
      ) : (
        // Card face — clean, crisp, readable
        <div className={cn('w-full h-full', dims.r, 'bg-white border border-gray-300/80 overflow-hidden')}>
          {/* Subtle linen texture */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50" />

          {/* Top-left rank + suit */}
          <div className={cn('absolute top-[3px] left-[4px] flex flex-col items-center leading-none', suit.color)}>
            <span className={cn(fontSize, 'font-extrabold')} style={{ lineHeight: 1 }}>{card.rank}</span>
            <span className={suitSmall} style={{ lineHeight: 1, marginTop: '-1px' }}>{suit.symbol}</span>
          </div>

          {/* Center suit — the hero */}
          <div className={cn('absolute inset-0 flex items-center justify-center', suit.color)}>
            <span className={cn(suitSize, 'opacity-90')} style={{ filter: suit.color.includes('red') ? 'drop-shadow(0 1px 2px rgba(220,38,38,0.3))' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }}>
              {suit.symbol}
            </span>
          </div>

          {/* Bottom-right rank + suit (inverted) */}
          <div className={cn('absolute bottom-[3px] right-[4px] flex flex-col items-center leading-none rotate-180', suit.color)}>
            <span className={cn(fontSize, 'font-extrabold')} style={{ lineHeight: 1 }}>{card.rank}</span>
            <span className={suitSmall} style={{ lineHeight: 1, marginTop: '-1px' }}>{suit.symbol}</span>
          </div>

          {/* Premium sheen — diagonal light reflection */}
          <div className={cn('absolute inset-0', dims.r, 'bg-gradient-to-br from-white/60 via-transparent to-transparent opacity-50 pointer-events-none')} />
        </div>
      )}
    </div>
  );
}

function MiniCard({ card, hidden, delay = 0 }: { card: Card; hidden: boolean; delay?: number }) {
  return (
    <motion.div
      initial={{ y: -15, opacity: 0, rotateY: 180 }}
      animate={{ y: 0, opacity: 1, rotateY: hidden ? 180 : 0 }}
      transition={{ delay, type: 'spring', damping: 20 }}
    >
      <GameCard card={card} hidden={hidden} size="sm" />
    </motion.div>
  );
}
