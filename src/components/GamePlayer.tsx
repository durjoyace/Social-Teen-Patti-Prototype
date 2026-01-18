import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Eye, EyeOff, Clock, Wifi, WifiOff } from 'lucide-react';
import { GamePlayer as GamePlayerType, PlayerStatus } from '../types';
import { CardFan, PlayingCard } from './PlayingCard';
import { ChipStack } from './ChipStack';
import { cn } from '../utils/cn';
import { formatChips } from '../game/gameEngine';

interface GamePlayerProps {
  player: GamePlayerType;
  isCurrentUser?: boolean;
  showCards?: boolean;
  position: 'top' | 'top-left' | 'top-right' | 'bottom' | 'left' | 'right';
  timeLeft?: number;
  maxTime?: number;
}

const positionStyles: Record<string, string> = {
  'top': 'top-4 left-1/2 -translate-x-1/2',
  'top-left': 'top-16 left-8',
  'top-right': 'top-16 right-8',
  'bottom': 'bottom-32 left-1/2 -translate-x-1/2',
  'left': 'top-1/2 left-4 -translate-y-1/2',
  'right': 'top-1/2 right-4 -translate-y-1/2'
};

const cardPositions: Record<string, string> = {
  'top': 'bottom-full mb-2',
  'top-left': 'bottom-full mb-2',
  'top-right': 'bottom-full mb-2',
  'bottom': 'top-full mt-2',
  'left': 'left-full ml-2',
  'right': 'right-full mr-2'
};

const statusColors: Record<PlayerStatus, { bg: string; text: string; glow: string }> = {
  'waiting': { bg: 'bg-gray-600', text: 'text-gray-300', glow: 'shadow-gray-500/30' },
  'playing': { bg: 'bg-green-600', text: 'text-green-300', glow: 'shadow-green-500/50' },
  'folded': { bg: 'bg-red-900/50', text: 'text-red-400', glow: 'shadow-red-500/20' },
  'all_in': { bg: 'bg-yellow-600', text: 'text-yellow-300', glow: 'shadow-yellow-500/50' },
  'show': { bg: 'bg-purple-600', text: 'text-purple-300', glow: 'shadow-purple-500/50' }
};

export function GamePlayerComponent({
  player,
  isCurrentUser = false,
  showCards = false,
  position,
  timeLeft,
  maxTime = 30
}: GamePlayerProps) {
  const status = statusColors[player.status];
  const timerPercentage = timeLeft !== undefined ? (timeLeft / maxTime) * 100 : 100;
  const isActive = player.status === 'playing' || player.status === 'show';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: player.status === 'folded' ? 0.5 : 1,
        scale: player.isTurn ? 1.05 : 1
      }}
      className={cn(
        'absolute flex flex-col items-center gap-2',
        positionStyles[position]
      )}
    >
      {/* Cards */}
      <AnimatePresence>
        {isActive && player.cards && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn('absolute z-10', cardPositions[position])}
          >
            <CardFan
              cards={player.cards}
              isHidden={!showCards && !isCurrentUser}
              showOnHover={isCurrentUser}
              size="sm"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Player container */}
      <motion.div
        className={cn(
          'relative flex flex-col items-center p-3 rounded-2xl',
          'bg-gradient-to-b from-gray-900/90 to-black/90',
          'backdrop-blur-md border border-white/10',
          player.isTurn && 'ring-2 ring-yellow-400 shadow-lg shadow-yellow-500/30',
          !isActive && 'grayscale'
        )}
        animate={player.isTurn ? {
          boxShadow: [
            '0 0 20px rgba(234, 179, 8, 0.3)',
            '0 0 40px rgba(234, 179, 8, 0.5)',
            '0 0 20px rgba(234, 179, 8, 0.3)'
          ]
        } : {}}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        {/* Timer ring */}
        {player.isTurn && timeLeft !== undefined && (
          <svg className="absolute -inset-1 w-[calc(100%+8px)] h-[calc(100%+8px)]">
            <motion.rect
              x="2"
              y="2"
              width="calc(100% - 4px)"
              height="calc(100% - 4px)"
              rx="16"
              fill="none"
              stroke="url(#timerGradient)"
              strokeWidth="3"
              strokeDasharray={`${timerPercentage} 100`}
              strokeLinecap="round"
              className="origin-center"
            />
            <defs>
              <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="50%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>
          </svg>
        )}

        {/* Avatar */}
        <div className="relative">
          <motion.div
            className={cn(
              'w-14 h-14 rounded-full overflow-hidden',
              'ring-2 ring-white/20',
              status.glow
            )}
            whileHover={{ scale: 1.1 }}
          >
            {player.user?.avatarUrl ? (
              <img src={player.user.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className={cn(
                'w-full h-full flex items-center justify-center',
                'bg-gradient-to-br from-red-600 to-red-900 text-white font-bold text-xl'
              )}>
                {player.user?.username?.[0]?.toUpperCase() || player.userId[0].toUpperCase()}
              </div>
            )}
          </motion.div>

          {/* Dealer badge */}
          {player.isDealer && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center shadow-lg"
            >
              <Crown className="w-3 h-3 text-yellow-900" />
            </motion.div>
          )}

          {/* Blind/Seen indicator */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={cn(
              'absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center',
              player.isBlind ? 'bg-blue-600' : 'bg-green-600'
            )}
          >
            {player.isBlind ? (
              <EyeOff className="w-2.5 h-2.5 text-white" />
            ) : (
              <Eye className="w-2.5 h-2.5 text-white" />
            )}
          </motion.div>

          {/* Online indicator */}
          <div className={cn(
            'absolute -top-1 -left-1 w-3 h-3 rounded-full border-2 border-gray-900',
            player.user?.isOnline ? 'bg-green-500' : 'bg-gray-500'
          )} />
        </div>

        {/* Name and chips */}
        <div className="flex flex-col items-center mt-1">
          <span className={cn(
            'text-xs font-medium truncate max-w-[80px]',
            isCurrentUser ? 'text-yellow-400' : 'text-white'
          )}>
            {isCurrentUser ? 'You' : player.user?.username || `Player ${player.seatPosition + 1}`}
          </span>

          <div className="flex items-center gap-1 mt-0.5">
            <span className={cn('text-xs font-bold', status.text)}>
              ₹{formatChips(player.chipsInPlay)}
            </span>
          </div>
        </div>

        {/* Current bet */}
        {player.currentBet > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute -bottom-8 left-1/2 -translate-x-1/2"
          >
            <ChipStack amount={player.currentBet} size="sm" />
          </motion.div>
        )}

        {/* Status badge */}
        {player.status === 'folded' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl"
          >
            <span className="text-red-400 font-bold text-sm uppercase tracking-wider">Packed</span>
          </motion.div>
        )}

        {player.status === 'all_in' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-yellow-500 rounded-full"
          >
            <span className="text-[10px] font-bold text-yellow-900 uppercase">All In!</span>
          </motion.div>
        )}
      </motion.div>

      {/* Turn indicator with timer */}
      {player.isTurn && timeLeft !== undefined && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 rounded-full"
        >
          <Clock className="w-3 h-3 text-yellow-400" />
          <span className={cn(
            'text-xs font-bold',
            timerPercentage > 50 ? 'text-green-400' :
            timerPercentage > 25 ? 'text-yellow-400' : 'text-red-400'
          )}>
            {timeLeft}s
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}

// Simplified player for lobby/home screen
export function PlayerAvatar({
  username,
  avatarUrl,
  chips,
  isOnline,
  size = 'md'
}: {
  username: string;
  avatarUrl?: string;
  chips?: number;
  isOnline?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg'
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        <div className={cn(
          'rounded-full overflow-hidden ring-2 ring-white/20',
          sizeClasses[size]
        )}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-600 to-red-900 text-white font-bold">
              {username[0].toUpperCase()}
            </div>
          )}
        </div>
        {isOnline !== undefined && (
          <div className={cn(
            'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-900',
            isOnline ? 'bg-green-500' : 'bg-gray-500'
          )} />
        )}
      </div>
      <span className="text-xs text-white/80 truncate max-w-[60px]">{username}</span>
      {chips !== undefined && (
        <span className="text-xs text-yellow-400 font-medium">₹{formatChips(chips)}</span>
      )}
    </div>
  );
}
