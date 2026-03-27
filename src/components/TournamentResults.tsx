import { motion } from 'framer-motion';
import {
  Trophy,
  Crown,
  Medal,
  Share2,
  RotateCcw,
  TrendingUp,
  Flame,
  Sparkles,
  Star,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { formatChips } from '../game/gameEngine';

// --- Types ---

export interface TournamentResultPlayer {
  id: string;
  username: string;
  avatarUrl?: string | null;
  position: number;
  prizeWon: number;
  handsPlayed: number;
  biggestPot: number;
  bestHand: string;
  isYou?: boolean;
}

export interface TournamentResultsProps {
  tournamentName: string;
  variant: string;
  totalPlayers: number;
  totalPrizePool: number;
  duration: string;
  players: TournamentResultPlayer[];
  currentPlayerId?: string;
  onPlayAgain?: () => void;
  onShare?: () => void;
}

// --- Mock Data ---

export const MOCK_RESULTS: TournamentResultsProps = {
  tournamentName: 'Diwali Grand Championship',
  variant: 'Classic',
  totalPlayers: 64,
  totalPrizePool: 500000,
  duration: '2h 35m',
  currentPlayerId: 'you',
  players: [
    {
      id: 'player-3',
      username: 'VikramJoshi',
      position: 1,
      prizeWon: 250000,
      handsPlayed: 87,
      biggestPot: 42000,
      bestHand: 'Trail (AAA)',
      isYou: false,
    },
    {
      id: 'you',
      username: 'You',
      position: 2,
      prizeWon: 150000,
      handsPlayed: 82,
      biggestPot: 38500,
      bestHand: 'Pure Sequence (A-K-Q)',
      isYou: true,
    },
    {
      id: 'player-7',
      username: 'PriyaPatel',
      position: 3,
      prizeWon: 100000,
      handsPlayed: 71,
      biggestPot: 28000,
      bestHand: 'Sequence (9-10-J)',
      isYou: false,
    },
    {
      id: 'player-2',
      username: 'RajSharma',
      position: 4,
      prizeWon: 0,
      handsPlayed: 65,
      biggestPot: 22000,
      bestHand: 'Color (Hearts)',
      isYou: false,
    },
    {
      id: 'player-5',
      username: 'AmitKumar',
      position: 5,
      prizeWon: 0,
      handsPlayed: 48,
      biggestPot: 15000,
      bestHand: 'Pair (KK)',
      isYou: false,
    },
    {
      id: 'player-9',
      username: 'NehaGupta',
      position: 6,
      prizeWon: 0,
      handsPlayed: 35,
      biggestPot: 12000,
      bestHand: 'Pair (QQ)',
      isYou: false,
    },
    {
      id: 'player-11',
      username: 'SureshYadav',
      position: 7,
      prizeWon: 0,
      handsPlayed: 29,
      biggestPot: 9500,
      bestHand: 'Sequence (5-6-7)',
      isYou: false,
    },
    {
      id: 'player-14',
      username: 'DeepikaMalhotra',
      position: 8,
      prizeWon: 0,
      handsPlayed: 22,
      biggestPot: 7800,
      bestHand: 'High Card (A)',
      isYou: false,
    },
  ],
  onPlayAgain: () => {},
  onShare: () => {},
};

// --- Helpers ---

const positionConfig: Record<number, { color: string; bg: string; ring: string; icon: typeof Crown; label: string }> = {
  1: {
    color: 'text-yellow-400',
    bg: 'bg-gradient-to-br from-yellow-500/20 to-yellow-700/10',
    ring: 'ring-yellow-400/50',
    icon: Crown,
    label: 'Champion',
  },
  2: {
    color: 'text-gray-300',
    bg: 'bg-gradient-to-br from-gray-400/20 to-gray-600/10',
    ring: 'ring-gray-400/40',
    icon: Medal,
    label: '2nd Place',
  },
  3: {
    color: 'text-orange-400',
    bg: 'bg-gradient-to-br from-orange-500/20 to-orange-700/10',
    ring: 'ring-orange-400/40',
    icon: Medal,
    label: '3rd Place',
  },
};

// --- Component ---

export function TournamentResults({
  tournamentName,
  variant,
  totalPlayers,
  duration,
  players,
  currentPlayerId,
  onPlayAgain,
  onShare,
}: TournamentResultsProps) {
  const topThree = players.filter((p) => p.position <= 3).sort((a, b) => a.position - b.position);
  const restPlayers = players.filter((p) => p.position > 3).sort((a, b) => a.position - b.position);
  const yourResult = players.find((p) => p.id === currentPlayerId);

  return (
    <div className="flex flex-col h-full">
      {/* Header with Confetti-like Particles */}
      <div className="relative px-4 pt-6 pb-4 text-center overflow-hidden">
        {/* Decorative particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: ['#D4AF37', '#F59E0B', '#EF4444', '#8B5CF6', '#10B981', '#3B82F6'][i],
              left: `${15 + i * 14}%`,
              top: '10%',
            }}
            animate={{
              y: [0, 60, 0],
              opacity: [0.8, 0, 0.8],
              scale: [1, 0.5, 1],
            }}
            transition={{
              repeat: Infinity,
              duration: 2 + i * 0.3,
              delay: i * 0.2,
            }}
          />
        ))}

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <Trophy className="w-10 h-10 text-[#D4AF37] mx-auto mb-2" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-white font-bold text-xl mb-1"
        >
          {tournamentName}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-white/50 text-sm"
        >
          {variant} | {totalPlayers} Players | {duration}
        </motion.p>

        {/* Your Result Summary */}
        {yourResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10"
          >
            <span className="text-white/60 text-sm">Your finish:</span>
            <span className={cn(
              'font-bold text-sm',
              yourResult.position <= 3 ? positionConfig[yourResult.position]?.color : 'text-white'
            )}>
              {getOrdinal(yourResult.position)}
            </span>
            {yourResult.prizeWon > 0 && (
              <>
                <span className="text-white/30">|</span>
                <span className="text-[#D4AF37] font-bold text-sm">+{formatChips(yourResult.prizeWon)}</span>
              </>
            )}
          </motion.div>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-32">
        {/* Podium - Top 3 */}
        <div className="mb-6">
          <div className="flex items-end justify-center gap-2 mb-2">
            {/* 2nd Place */}
            {topThree[1] && (
              <PodiumCard player={topThree[1]} config={positionConfig[2]} height="h-20" delay={0.3} currentPlayerId={currentPlayerId} />
            )}
            {/* 1st Place */}
            {topThree[0] && (
              <PodiumCard player={topThree[0]} config={positionConfig[1]} height="h-28" delay={0.1} isChampion currentPlayerId={currentPlayerId} />
            )}
            {/* 3rd Place */}
            {topThree[2] && (
              <PodiumCard player={topThree[2]} config={positionConfig[3]} height="h-14" delay={0.5} currentPlayerId={currentPlayerId} />
            )}
          </div>
        </div>

        {/* Prize Distribution */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <h3 className="text-white font-semibold text-sm">Prize Distribution</h3>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {topThree.map((player) => {
              const config = positionConfig[player.position];
              return (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + player.position * 0.1 }}
                  className={cn('rounded-xl p-3 text-center', config?.bg, 'border border-white/5')}
                >
                  <p className={cn('text-xs font-semibold mb-0.5', config?.color)}>{getOrdinal(player.position)}</p>
                  <p className="text-[#D4AF37] font-bold text-sm">{formatChips(player.prizeWon)}</p>
                  <p className="text-white/40 text-[10px] truncate">{player.username}</p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Full Standings */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-white/50" />
            <h3 className="text-white font-semibold text-sm">Final Standings</h3>
          </div>

          <div className="space-y-1.5">
            {/* Top 3 in list too */}
            {topThree.map((player, idx) => (
              <StandingsRow key={player.id} player={player} currentPlayerId={currentPlayerId} delay={idx * 0.05} />
            ))}
            {restPlayers.map((player, idx) => (
              <StandingsRow key={player.id} player={player} currentPlayerId={currentPlayerId} delay={(topThree.length + idx) * 0.05} />
            ))}
          </div>
        </div>

        {/* Your Stats */}
        {yourResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-blue-400" />
              <h3 className="text-white font-semibold text-sm">Your Statistics</h3>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <StatBox label="Hands Played" value={yourResult.handsPlayed.toString()} icon={Flame} />
              <StatBox label="Biggest Pot" value={formatChips(yourResult.biggestPot)} icon={TrendingUp} />
              <StatBox label="Best Hand" value={yourResult.bestHand} icon={Sparkles} small />
            </div>
          </motion.div>
        )}
      </div>

      {/* Bottom Actions - Fixed */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-6 bg-gradient-to-t from-gray-900 via-gray-900/95 to-transparent">
        <div className="flex gap-3 max-w-md mx-auto">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onShare}
            className="flex-1 py-3.5 rounded-xl bg-white/10 text-white font-semibold text-sm flex items-center justify-center gap-2 border border-white/10 hover:bg-white/15 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share Results
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onPlayAgain}
            className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-yellow-600 text-black font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/30"
          >
            <RotateCcw className="w-4 h-4" />
            Play Again
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

interface PodiumCardProps {
  player: TournamentResultPlayer;
  config: (typeof positionConfig)[1];
  height: string;
  delay: number;
  isChampion?: boolean;
  currentPlayerId?: string;
}

function PodiumCard({ player, config, height, delay, isChampion, currentPlayerId }: PodiumCardProps) {
  const isYou = player.id === currentPlayerId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 150, damping: 15 }}
      className="flex flex-col items-center"
    >
      {/* Crown animation for 1st */}
      {isChampion && (
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <Crown className="w-7 h-7 text-[#D4AF37] mb-1" />
        </motion.div>
      )}

      {/* Avatar */}
      <div className={cn(
        'w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold mb-2 ring-2',
        config.ring,
        isYou
          ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white'
          : 'bg-gradient-to-br from-red-700 to-red-900 text-white'
      )}>
        {player.username[0]}
      </div>

      <p className="text-white text-xs font-medium truncate max-w-[70px] mb-0.5">
        {player.username}
      </p>
      <p className="text-[#D4AF37] text-xs font-bold mb-2">
        {formatChips(player.prizeWon)}
      </p>

      {/* Podium Block */}
      <div className={cn(
        'w-20 rounded-t-lg',
        height,
        config.bg,
        'border-t border-x border-white/10 flex items-center justify-center'
      )}>
        <span className={cn('text-2xl font-black', config.color)}>{player.position}</span>
      </div>
    </motion.div>
  );
}

interface StandingsRowProps {
  player: TournamentResultPlayer;
  currentPlayerId?: string;
  delay: number;
}

function StandingsRow({ player, currentPlayerId, delay }: StandingsRowProps) {
  const isYou = player.id === currentPlayerId;
  const config = positionConfig[player.position];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl transition-colors',
        isYou ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-white/[0.03] hover:bg-white/[0.06]'
      )}
    >
      {/* Position */}
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
        config ? `${config.bg} ${config.color}` : 'bg-white/10 text-white/50'
      )}>
        {player.position}
      </div>

      {/* Avatar */}
      <div className={cn(
        'w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
        isYou
          ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white'
          : 'bg-gradient-to-br from-red-700 to-red-900 text-white'
      )}>
        {player.username[0]}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-white text-sm font-medium truncate">{player.username}</span>
          {isYou && (
            <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded-full font-bold shrink-0">
              YOU
            </span>
          )}
        </div>
        <span className="text-white/30 text-[10px]">{player.handsPlayed} hands | Best: {player.bestHand}</span>
      </div>

      {/* Prize */}
      <div className="text-right shrink-0">
        {player.prizeWon > 0 ? (
          <span className="text-[#D4AF37] font-bold text-sm">+{formatChips(player.prizeWon)}</span>
        ) : (
          <span className="text-white/20 text-sm">-</span>
        )}
      </div>
    </motion.div>
  );
}

interface StatBoxProps {
  label: string;
  value: string;
  icon: typeof Trophy;
  small?: boolean;
}

function StatBox({ label, value, icon: StatIcon, small }: StatBoxProps) {
  return (
    <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
      <StatIcon className="w-4 h-4 text-blue-400 mx-auto mb-1.5" />
      <p className={cn('text-white font-bold mb-0.5', small ? 'text-[10px]' : 'text-sm')}>{value}</p>
      <p className="text-white/30 text-[10px]">{label}</p>
    </div>
  );
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
