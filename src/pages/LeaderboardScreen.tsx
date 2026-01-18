import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Crown, TrendingUp, Calendar, ChevronRight, Flame, Star } from 'lucide-react';
import { Layout } from '../components/Layout';
import { NavigationBar } from '../components/NavigationBar';
import { cn } from '../utils/cn';
import { formatChips } from '../game/gameEngine';

interface LeaderboardScreenProps {
  onNavigate: (screen: string) => void;
}

type Period = 'daily' | 'weekly' | 'monthly' | 'allTime';

// Mock leaderboard data
const mockLeaderboard = [
  { rank: 1, username: 'RajSharma', avatarUrl: null, chipsWon: 125000, gamesWon: 45, streak: 12 },
  { rank: 2, username: 'PriyaPatel', avatarUrl: null, chipsWon: 98000, gamesWon: 38, streak: 8 },
  { rank: 3, username: 'AmitKumar', avatarUrl: null, chipsWon: 87500, gamesWon: 35, streak: 5 },
  { rank: 4, username: 'NehaGupta', avatarUrl: null, chipsWon: 76000, gamesWon: 31, streak: 7 },
  { rank: 5, username: 'RohitVerma', avatarUrl: null, chipsWon: 65000, gamesWon: 28, streak: 3 },
  { rank: 6, username: 'AnanyaSingh', avatarUrl: null, chipsWon: 54000, gamesWon: 25, streak: 4 },
  { rank: 7, username: 'VikramJoshi', avatarUrl: null, chipsWon: 48000, gamesWon: 22, streak: 2 },
  { rank: 8, username: 'MeghaNair', avatarUrl: null, chipsWon: 42000, gamesWon: 20, streak: 6 },
  { rank: 9, username: 'ArjunMehta', avatarUrl: null, chipsWon: 38000, gamesWon: 18, streak: 1 },
  { rank: 10, username: 'KavitaRao', avatarUrl: null, chipsWon: 35000, gamesWon: 16, streak: 3 },
];

const periodConfig: Record<Period, { label: string; icon: typeof Calendar }> = {
  daily: { label: 'Today', icon: Calendar },
  weekly: { label: 'This Week', icon: Calendar },
  monthly: { label: 'This Month', icon: Calendar },
  allTime: { label: 'All Time', icon: Trophy }
};

export function LeaderboardScreen({ onNavigate }: LeaderboardScreenProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('weekly');
  const [selectedTab, setSelectedTab] = useState<'chips' | 'wins'>('chips');

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { icon: Crown, color: 'from-yellow-400 to-yellow-600', textColor: 'text-yellow-900' };
    if (rank === 2) return { icon: Medal, color: 'from-gray-300 to-gray-500', textColor: 'text-gray-900' };
    if (rank === 3) return { icon: Medal, color: 'from-orange-400 to-orange-600', textColor: 'text-orange-900' };
    return null;
  };

  // Sort by selected metric
  const sortedLeaderboard = [...mockLeaderboard].sort((a, b) => {
    if (selectedTab === 'wins') return b.gamesWon - a.gamesWon;
    return b.chipsWon - a.chipsWon;
  });

  return (
    <Layout>
      <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 via-gray-900 to-black">
        {/* Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative z-10 px-4 pt-4"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-400" />
              <h1 className="text-xl font-bold text-white">Leaderboard</h1>
            </div>
          </div>

          {/* Period tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
            {(Object.keys(periodConfig) as Period[]).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
                  selectedPeriod === period
                    ? 'bg-yellow-500 text-yellow-900'
                    : 'bg-white/10 text-white/60 hover:bg-white/15'
                )}
              >
                {periodConfig[period].label}
              </button>
            ))}
          </div>

          {/* Metric tabs */}
          <div className="flex gap-2 p-1 bg-white/5 rounded-xl mb-4">
            <button
              onClick={() => setSelectedTab('chips')}
              className={cn(
                'flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2',
                selectedTab === 'chips'
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                  : 'text-white/60'
              )}
            >
              <TrendingUp className="w-4 h-4" />
              Chips Won
            </button>
            <button
              onClick={() => setSelectedTab('wins')}
              className={cn(
                'flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2',
                selectedTab === 'wins'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                  : 'text-white/60'
              )}
            >
              <Trophy className="w-4 h-4" />
              Games Won
            </button>
          </div>
        </motion.header>

        {/* Top 3 podium */}
        <div className="px-4 mb-4">
          <div className="flex items-end justify-center gap-2">
            {/* 2nd place */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center"
            >
              <div className="relative mb-2">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-xl font-bold text-white ring-4 ring-gray-400/30">
                  {sortedLeaderboard[1]?.username[0]}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-900">2</span>
                </div>
              </div>
              <p className="text-white text-xs font-medium truncate max-w-[70px]">{sortedLeaderboard[1]?.username}</p>
              <p className="text-yellow-400 text-xs font-bold">
                {selectedTab === 'chips' ? `₹${formatChips(sortedLeaderboard[1]?.chipsWon || 0)}` : sortedLeaderboard[1]?.gamesWon}
              </p>
              <div className="w-16 h-16 mt-2 bg-gradient-to-t from-gray-600 to-gray-500 rounded-t-lg" />
            </motion.div>

            {/* 1st place */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center -mt-4"
            >
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Crown className="w-8 h-8 text-yellow-400 mb-1" />
              </motion.div>
              <div className="relative mb-2">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-2xl font-bold text-yellow-900 ring-4 ring-yellow-400/50 shadow-lg shadow-yellow-500/30">
                  {sortedLeaderboard[0]?.username[0]}
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-yellow-400 flex items-center justify-center">
                  <span className="text-sm font-bold text-yellow-900">1</span>
                </div>
              </div>
              <p className="text-white text-sm font-semibold truncate max-w-[80px]">{sortedLeaderboard[0]?.username}</p>
              <p className="text-yellow-400 text-sm font-bold">
                {selectedTab === 'chips' ? `₹${formatChips(sortedLeaderboard[0]?.chipsWon || 0)}` : sortedLeaderboard[0]?.gamesWon}
              </p>
              <div className="w-20 h-24 mt-2 bg-gradient-to-t from-yellow-600 to-yellow-500 rounded-t-lg" />
            </motion.div>

            {/* 3rd place */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center"
            >
              <div className="relative mb-2">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-xl font-bold text-white ring-4 ring-orange-400/30">
                  {sortedLeaderboard[2]?.username[0]}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                  <span className="text-xs font-bold text-orange-900">3</span>
                </div>
              </div>
              <p className="text-white text-xs font-medium truncate max-w-[70px]">{sortedLeaderboard[2]?.username}</p>
              <p className="text-yellow-400 text-xs font-bold">
                {selectedTab === 'chips' ? `₹${formatChips(sortedLeaderboard[2]?.chipsWon || 0)}` : sortedLeaderboard[2]?.gamesWon}
              </p>
              <div className="w-16 h-12 mt-2 bg-gradient-to-t from-orange-600 to-orange-500 rounded-t-lg" />
            </motion.div>
          </div>
        </div>

        {/* Rest of leaderboard */}
        <div className="flex-1 overflow-y-auto px-4 pb-24">
          <AnimatePresence>
            {sortedLeaderboard.slice(3).map((player, index) => (
              <motion.div
                key={player.username}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 p-3 mb-2 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                {/* Rank */}
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-white/60">{player.rank}</span>
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center text-white font-bold">
                  {player.username[0]}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <p className="text-white font-medium text-sm">{player.username}</p>
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <span>{player.gamesWon} wins</span>
                    {player.streak > 0 && (
                      <span className="flex items-center gap-0.5 text-orange-400">
                        <Flame className="w-3 h-3" />
                        {player.streak}
                      </span>
                    )}
                  </div>
                </div>

                {/* Score */}
                <div className="text-right">
                  <p className="text-yellow-400 font-bold text-sm">
                    {selectedTab === 'chips' ? `₹${formatChips(player.chipsWon)}` : player.gamesWon}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <NavigationBar currentScreen="leaderboard" onNavigate={onNavigate} />
      </div>
    </Layout>
  );
}
