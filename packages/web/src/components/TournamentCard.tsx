import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Clock,
  Trophy,
  ChevronDown,
  ChevronUp,
  Zap,
  Crown,
  Sparkles,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { formatChips } from '../game/gameEngine';
import { GameVariant } from '../types';

// --- Types ---

export type TournamentStatus = 'registering' | 'starting_soon' | 'live' | 'finished';
export type TournamentTier = 'freeroll' | 'regular' | 'high_roller';

export interface TournamentData {
  id: string;
  name: string;
  variant: GameVariant;
  tier: TournamentTier;
  entryFee: number;
  prizePool: number;
  currentPlayers: number;
  maxPlayers: number;
  startTime: Date;
  status: TournamentStatus;
  blindLevel?: number;
  tablesRemaining?: number;
  prizeStructure: { position: number; percentage: number }[];
  isRegistered?: boolean;
}

export interface TournamentCardProps {
  tournament: TournamentData;
  onRegister?: (tournamentId: string) => void;
  onUnregister?: (tournamentId: string) => void;
  delay?: number;
}

// --- Helpers ---

const tierConfig: Record<TournamentTier, { gradient: string; border: string; label: string; accent: string }> = {
  freeroll: {
    gradient: 'from-emerald-900/80 via-emerald-800/60 to-emerald-900/80',
    border: 'border-emerald-500/40',
    label: 'Freeroll',
    accent: 'text-emerald-400',
  },
  regular: {
    gradient: 'from-blue-900/80 via-blue-800/60 to-blue-900/80',
    border: 'border-blue-500/40',
    label: 'Regular',
    accent: 'text-blue-400',
  },
  high_roller: {
    gradient: 'from-purple-900/80 via-purple-800/60 to-purple-900/80',
    border: 'border-purple-500/40',
    label: 'High Roller',
    accent: 'text-purple-400',
  },
};

const statusConfig: Record<TournamentStatus, { label: string; color: string; bg: string }> = {
  registering: { label: 'Registering', color: 'text-emerald-300', bg: 'bg-emerald-500/20' },
  starting_soon: { label: 'Starting Soon', color: 'text-yellow-300', bg: 'bg-yellow-500/20' },
  live: { label: 'Live', color: 'text-red-300', bg: 'bg-red-500/20' },
  finished: { label: 'Finished', color: 'text-gray-400', bg: 'bg-gray-500/20' },
};

const variantLabels: Record<GameVariant, string> = {
  classic: 'Classic',
  joker: 'Joker',
  muflis: 'Muflis',
  ak47: 'AK47',
  hukam: 'Hukam',
  lowball: 'Lowball',
  best_of_four: 'Best of 4',
  dealers_choice: "Dealer's Choice",
};

function formatTimeRemaining(targetDate: Date): string {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();
  if (diff <= 0) return 'Started';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

// --- Component ---

export function TournamentCard({ tournament, onRegister, onUnregister, delay = 0 }: TournamentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const tier = tierConfig[tournament.tier];
  const status = statusConfig[tournament.status];
  const fillPercent = (tournament.currentPlayers / tournament.maxPlayers) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.06, type: 'spring', stiffness: 120, damping: 18 }}
      className={cn(
        'rounded-2xl overflow-hidden border',
        tier.border,
        'bg-gradient-to-br',
        tier.gradient,
        'backdrop-blur-sm'
      )}
    >
      {/* Main Card */}
      <div
        className="p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Top Row: Name + Status */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn('text-[10px] font-bold uppercase tracking-widest', tier.accent)}>
                {tier.label}
              </span>
              <span className="text-white/30 text-[10px]">|</span>
              <span className="text-white/50 text-[10px] font-medium uppercase tracking-wider">
                {variantLabels[tournament.variant]}
              </span>
            </div>
            <h3 className="text-white font-bold text-base truncate pr-2">{tournament.name}</h3>
          </div>

          {/* Status Badge */}
          <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', status.bg, status.color)}>
            {tournament.status === 'live' && (
              <motion.div
                className="w-2 h-2 rounded-full bg-red-400"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
              />
            )}
            {status.label}
          </div>
        </div>

        {/* Prize Pool + Entry Fee Row */}
        <div className="flex items-center gap-3 mb-3">
          {/* Prize Pool */}
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-[#D4AF37] font-bold text-lg">
              {tournament.prizePool === 0 ? 'FREE' : `${formatChips(tournament.prizePool)}`}
            </span>
          </div>

          {/* Entry Fee */}
          <div className={cn(
            'px-2.5 py-1 rounded-full text-xs font-semibold',
            tournament.entryFee === 0
              ? 'bg-emerald-500/20 text-emerald-300'
              : 'bg-white/10 text-white/80'
          )}>
            {tournament.entryFee === 0 ? 'Free Entry' : `Buy-in: ${formatChips(tournament.entryFee)}`}
          </div>
        </div>

        {/* Player Count + Timer Row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-white/60 text-sm">
            <Users className="w-4 h-4" />
            <span className="font-medium">
              {tournament.currentPlayers}/{tournament.maxPlayers}
            </span>
            {tournament.status === 'live' && (
              <motion.span
                className="ml-1 text-emerald-400 text-xs"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                playing
              </motion.span>
            )}
          </div>

          {tournament.status !== 'finished' && (
            <div className="flex items-center gap-1.5 text-white/60 text-sm">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-medium">{formatTimeRemaining(tournament.startTime)}</span>
            </div>
          )}
        </div>

        {/* Registration Progress Bar */}
        {tournament.status === 'registering' && (
          <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className={cn(
                'absolute inset-y-0 left-0 rounded-full',
                tournament.tier === 'freeroll' && 'bg-gradient-to-r from-emerald-500 to-emerald-400',
                tournament.tier === 'regular' && 'bg-gradient-to-r from-blue-500 to-blue-400',
                tournament.tier === 'high_roller' && 'bg-gradient-to-r from-purple-500 to-purple-400',
              )}
              initial={{ width: 0 }}
              animate={{ width: `${fillPercent}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        )}

        {/* Expand chevron */}
        <div className="flex justify-center mt-2">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-white/30" />
          ) : (
            <ChevronDown className="w-4 h-4 text-white/30" />
          )}
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-white/10 pt-3">
              {/* Prize Structure */}
              <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Prize Structure</p>
              <div className="flex gap-2 mb-4">
                {tournament.prizeStructure.map((prize) => {
                  const positionIcons = [Crown, Sparkles, Zap];
                  const positionColors = ['text-yellow-400', 'text-gray-300', 'text-orange-400'];
                  const Icon = positionIcons[prize.position - 1] || Zap;
                  const color = positionColors[prize.position - 1] || 'text-white/50';

                  return (
                    <div
                      key={prize.position}
                      className="flex-1 bg-white/5 rounded-xl p-2.5 text-center"
                    >
                      <Icon className={cn('w-4 h-4 mx-auto mb-1', color)} />
                      <p className="text-white/40 text-[10px]">{getOrdinal(prize.position)}</p>
                      <p className="text-white font-bold text-sm">{prize.percentage}%</p>
                      {tournament.prizePool > 0 && (
                        <p className="text-[#D4AF37] text-xs font-medium">
                          {formatChips(Math.floor(tournament.prizePool * prize.percentage / 100))}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Tournament Details */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="text-white/40 text-[10px] mb-0.5">Format</p>
                  <p className="text-white text-xs font-medium">Elimination</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="text-white/40 text-[10px] mb-0.5">Tables</p>
                  <p className="text-white text-xs font-medium">
                    {tournament.tablesRemaining ?? Math.ceil(tournament.currentPlayers / 6)}
                  </p>
                </div>
                {tournament.blindLevel && (
                  <div className="bg-white/5 rounded-lg p-2">
                    <p className="text-white/40 text-[10px] mb-0.5">Blind Level</p>
                    <p className="text-white text-xs font-medium">Level {tournament.blindLevel}</p>
                  </div>
                )}
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="text-white/40 text-[10px] mb-0.5">Start</p>
                  <p className="text-white text-xs font-medium">
                    {tournament.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {/* Register/Unregister Button */}
              {tournament.status === 'registering' && (
                tournament.isRegistered ? (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnregister?.(tournament.id);
                    }}
                    className="w-full py-3 rounded-xl bg-white/10 text-white/70 font-semibold text-sm border border-white/10 hover:bg-white/15 transition-colors"
                  >
                    Unregister
                  </motion.button>
                ) : (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRegister?.(tournament.id);
                    }}
                    className={cn(
                      'w-full py-3 rounded-xl font-bold text-sm shadow-lg transition-all',
                      tournament.tier === 'freeroll' && 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-emerald-500/30',
                      tournament.tier === 'regular' && 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-500/30',
                      tournament.tier === 'high_roller' && 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-purple-500/30',
                    )}
                  >
                    {tournament.entryFee === 0 ? 'Register Free' : `Register - ${formatChips(tournament.entryFee)} chips`}
                  </motion.button>
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
