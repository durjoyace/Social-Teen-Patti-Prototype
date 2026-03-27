import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  Users,
  Flame,
  Trophy,
  Search,
  SlidersHorizontal,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  Clock,
  Filter,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { formatChips } from '../game/gameEngine';
import { NavigationBar } from '../components/NavigationBar';
import { GameVariant } from '../types';

// ---------- Types ----------

interface LiveGame {
  id: string;
  tableName: string;
  variant: GameVariant;
  potSize: number;
  playerCount: number;
  maxPlayers: number;
  viewerCount: number;
  stakeLevel: 'low' | 'mid' | 'high' | 'vip';
  isFeatured: boolean;
  isTournament: boolean;
  startedAgo: number; // minutes
  players: {
    name: string;
    avatarUrl?: string;
    chips: number;
    isFriend?: boolean;
  }[];
}

type SortOption = 'pot' | 'viewers' | 'recent';
type StakeFilter = 'all' | 'low' | 'mid' | 'high' | 'vip';

// ---------- Mock Data ----------

const MOCK_LIVE_GAMES: LiveGame[] = [
  {
    id: '1',
    tableName: 'Maharaja Suite',
    variant: 'classic',
    potSize: 2450000,
    playerCount: 4,
    maxPlayers: 6,
    viewerCount: 1247,
    stakeLevel: 'vip',
    isFeatured: true,
    isTournament: false,
    startedAgo: 12,
    players: [
      { name: 'Rajesh K.', chips: 8500000, isFriend: false },
      { name: 'Vikram S.', chips: 6200000 },
      { name: 'Deepak M.', chips: 4100000 },
      { name: 'Ankit R.', chips: 3800000 },
    ],
  },
  {
    id: '2',
    tableName: 'Diwali Championship',
    variant: 'classic',
    potSize: 5200000,
    playerCount: 6,
    maxPlayers: 6,
    viewerCount: 3891,
    stakeLevel: 'vip',
    isFeatured: true,
    isTournament: true,
    startedAgo: 45,
    players: [
      { name: 'Priya N.', chips: 12000000 },
      { name: 'Suresh B.', chips: 9800000 },
      { name: 'Kavita D.', chips: 7600000 },
      { name: 'Arjun P.', chips: 6400000 },
      { name: 'Meera T.', chips: 5200000 },
      { name: 'Rohit G.', chips: 4800000 },
    ],
  },
  {
    id: '3',
    tableName: 'Neon Nights',
    variant: 'joker',
    potSize: 850000,
    playerCount: 3,
    maxPlayers: 4,
    viewerCount: 412,
    stakeLevel: 'high',
    isFeatured: false,
    isTournament: false,
    startedAgo: 8,
    players: [
      { name: 'Bunty', chips: 2200000 },
      { name: 'Sanjay L.', chips: 1800000, isFriend: true },
      { name: 'Neha K.', chips: 1500000 },
    ],
  },
  {
    id: '4',
    tableName: 'Muflis Madness',
    variant: 'muflis',
    potSize: 320000,
    playerCount: 5,
    maxPlayers: 6,
    viewerCount: 189,
    stakeLevel: 'mid',
    isFeatured: false,
    isTournament: false,
    startedAgo: 22,
    players: [
      { name: 'Pooja R.', chips: 950000 },
      { name: 'Anil V.', chips: 870000, isFriend: true },
      { name: 'Ravi S.', chips: 620000 },
      { name: 'Tanvi M.', chips: 540000 },
      { name: 'Gaurav P.', chips: 480000 },
    ],
  },
  {
    id: '5',
    tableName: 'AK47 Arena',
    variant: 'ak47',
    potSize: 1100000,
    playerCount: 4,
    maxPlayers: 4,
    viewerCount: 734,
    stakeLevel: 'high',
    isFeatured: true,
    isTournament: false,
    startedAgo: 5,
    players: [
      { name: 'Sharma Ji', chips: 3400000 },
      { name: 'Kiran B.', chips: 2900000 },
      { name: 'Manish T.', chips: 2100000 },
      { name: 'Divya S.', chips: 1800000 },
    ],
  },
  {
    id: '6',
    tableName: 'Chai Break Table',
    variant: 'classic',
    potSize: 45000,
    playerCount: 3,
    maxPlayers: 4,
    viewerCount: 28,
    stakeLevel: 'low',
    isFeatured: false,
    isTournament: false,
    startedAgo: 35,
    players: [
      { name: 'Amit K.', chips: 120000 },
      { name: 'Sunita D.', chips: 95000 },
      { name: 'Harsh P.', chips: 78000, isFriend: true },
    ],
  },
  {
    id: '7',
    tableName: 'Hukam House',
    variant: 'hukam',
    potSize: 680000,
    playerCount: 4,
    maxPlayers: 6,
    viewerCount: 356,
    stakeLevel: 'high',
    isFeatured: false,
    isTournament: false,
    startedAgo: 18,
    players: [
      { name: 'Rahul M.', chips: 2100000 },
      { name: 'Nisha G.', chips: 1700000 },
      { name: 'Varun K.', chips: 1400000 },
      { name: 'Isha R.', chips: 1100000 },
    ],
  },
  {
    id: '8',
    tableName: 'Low Stakes Lounge',
    variant: 'classic',
    potSize: 12000,
    playerCount: 4,
    maxPlayers: 6,
    viewerCount: 14,
    stakeLevel: 'low',
    isFeatured: false,
    isTournament: false,
    startedAgo: 55,
    players: [
      { name: 'Deepa N.', chips: 50000 },
      { name: 'Ajay S.', chips: 42000 },
      { name: 'Simran P.', chips: 38000 },
      { name: 'Kunal J.', chips: 31000 },
    ],
  },
  {
    id: '9',
    tableName: 'Royal Rumble',
    variant: 'dealers_choice',
    potSize: 1850000,
    playerCount: 5,
    maxPlayers: 6,
    viewerCount: 912,
    stakeLevel: 'vip',
    isFeatured: true,
    isTournament: false,
    startedAgo: 3,
    players: [
      { name: 'Virat P.', chips: 5500000 },
      { name: 'Sakshi A.', chips: 4200000 },
      { name: 'Mohit C.', chips: 3800000 },
      { name: 'Komal D.', chips: 3100000 },
      { name: 'Nitin R.', chips: 2600000 },
    ],
  },
  {
    id: '10',
    tableName: 'Beginner Friendly',
    variant: 'classic',
    potSize: 8500,
    playerCount: 3,
    maxPlayers: 4,
    viewerCount: 7,
    stakeLevel: 'low',
    isFeatured: false,
    isTournament: false,
    startedAgo: 40,
    players: [
      { name: 'Ritu M.', chips: 25000 },
      { name: 'Pankaj S.', chips: 22000, isFriend: true },
      { name: 'Shreya T.', chips: 18000 },
    ],
  },
];

const VARIANT_LABELS: Record<GameVariant, string> = {
  classic: 'Classic',
  joker: 'Joker',
  muflis: 'Muflis',
  ak47: 'AK47',
  hukam: 'Hukam',
  lowball: 'Lowball',
  best_of_four: 'Best of 4',
  dealers_choice: "Dealer's Choice",
};

const STAKE_LABELS: Record<StakeFilter, string> = {
  all: 'All Stakes',
  low: 'Low',
  mid: 'Mid',
  high: 'High',
  vip: 'VIP',
};

const STAKE_COLORS: Record<string, string> = {
  low: 'text-green-400 bg-green-400/10 border-green-400/20',
  mid: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  high: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  vip: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
};

// ---------- Sub-components ----------

function FeaturedGameCard({
  game,
  onWatch,
}: {
  game: LiveGame;
  onWatch: (game: LiveGame) => void;
}) {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={() => onWatch(game)}
      className="relative flex-shrink-0 w-72 rounded-2xl overflow-hidden cursor-pointer"
    >
      {/* Cinematic gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/40 via-red-900/30 to-purple-900/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

      {/* Spotlight effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative p-4 pt-6">
        {/* Badges */}
        <div className="flex items-center gap-2 mb-3">
          {game.isTournament && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-[10px] font-bold uppercase tracking-wider">
              <Trophy className="w-3 h-3" />
              Tournament
            </span>
          )}
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            LIVE
          </span>
        </div>

        {/* Table name */}
        <h3 className="text-lg font-bold text-white mb-1">{game.tableName}</h3>
        <p className="text-white/50 text-xs mb-3">
          {VARIANT_LABELS[game.variant]} &middot; {game.playerCount}/{game.maxPlayers} players
        </p>

        {/* Pot */}
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-4 h-4 text-orange-400" />
          <span className="text-orange-400 font-bold text-lg">
            {formatChips(game.potSize)}
          </span>
          <span className="text-white/30 text-xs">pot</span>
        </div>

        {/* Player avatars row */}
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {game.players.slice(0, 4).map((player, i) => (
              <div
                key={i}
                className={cn(
                  'w-8 h-8 rounded-full border-2 border-black flex items-center justify-center text-[10px] font-bold',
                  'bg-gradient-to-br from-red-700 to-red-900 text-white'
                )}
              >
                {player.name.charAt(0)}
              </div>
            ))}
            {game.playerCount > 4 && (
              <div className="w-8 h-8 rounded-full border-2 border-black bg-white/10 flex items-center justify-center text-[10px] text-white/60">
                +{game.playerCount - 4}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 text-white/50 text-xs">
            <Eye className="w-3.5 h-3.5" />
            <span>{game.viewerCount.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function GameListItem({
  game,
  onWatch,
}: {
  game: LiveGame;
  onWatch: (game: LiveGame) => void;
}) {
  const hasFriend = game.players.some((p) => p.isFriend);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onWatch(game)}
      className="relative bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 cursor-pointer hover:bg-white/[0.06] transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-white font-semibold text-sm truncate">
              {game.tableName}
            </h4>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
          </div>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-white/40 text-xs">
              {VARIANT_LABELS[game.variant]}
            </span>
            <span
              className={cn(
                'px-1.5 py-0.5 rounded text-[10px] font-medium border',
                STAKE_COLORS[game.stakeLevel]
              )}
            >
              {STAKE_LABELS[game.stakeLevel]}
            </span>
            {hasFriend && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-medium">
                <Users className="w-2.5 h-2.5" />
                Friend
              </span>
            )}
          </div>

          {/* Player avatars */}
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5">
              {game.players.slice(0, 3).map((player, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-6 h-6 rounded-full border border-black flex items-center justify-center text-[8px] font-bold',
                    player.isFriend
                      ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white ring-1 ring-blue-400/50'
                      : 'bg-gradient-to-br from-red-700 to-red-900 text-white'
                  )}
                >
                  {player.name.charAt(0)}
                </div>
              ))}
            </div>
            <span className="text-white/30 text-[10px]">
              {game.playerCount}/{game.maxPlayers}
            </span>
          </div>
        </div>

        {/* Right stats */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <div className="flex items-center gap-1 text-orange-400">
            <Flame className="w-3.5 h-3.5" />
            <span className="font-bold text-sm">{formatChips(game.potSize)}</span>
          </div>
          <div className="flex items-center gap-1 text-white/40 text-xs">
            <Eye className="w-3 h-3" />
            <span>{game.viewerCount.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1 text-white/30 text-[10px]">
            <Clock className="w-2.5 h-2.5" />
            <span>{game.startedAgo}m ago</span>
          </div>
        </div>
      </div>

      {/* Watch arrow */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        <ChevronRight className="w-4 h-4 text-white/20" />
      </div>
    </motion.div>
  );
}

// ---------- Main Component ----------

interface SpectatorLobbyProps {
  onWatch: (gameId: string) => void;
  onNavigate: (screen: string) => void;
  currentScreen?: string;
}

export function SpectatorLobby({
  onWatch,
  onNavigate,
  currentScreen = 'spectate',
}: SpectatorLobbyProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('viewers');
  const [stakeFilter, setStakeFilter] = useState<StakeFilter>('all');
  const [variantFilter, setVariantFilter] = useState<GameVariant | 'all'>('all');
  const [friendsOnly, setFriendsOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const featuredGames = useMemo(
    () => MOCK_LIVE_GAMES.filter((g) => g.isFeatured),
    []
  );

  const filteredGames = useMemo(() => {
    let games = [...MOCK_LIVE_GAMES];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      games = games.filter(
        (g) =>
          g.tableName.toLowerCase().includes(q) ||
          g.players.some((p) => p.name.toLowerCase().includes(q))
      );
    }

    // Stake filter
    if (stakeFilter !== 'all') {
      games = games.filter((g) => g.stakeLevel === stakeFilter);
    }

    // Variant filter
    if (variantFilter !== 'all') {
      games = games.filter((g) => g.variant === variantFilter);
    }

    // Friends filter
    if (friendsOnly) {
      games = games.filter((g) => g.players.some((p) => p.isFriend));
    }

    // Sort
    switch (sortBy) {
      case 'pot':
        games.sort((a, b) => b.potSize - a.potSize);
        break;
      case 'viewers':
        games.sort((a, b) => b.viewerCount - a.viewerCount);
        break;
      case 'recent':
        games.sort((a, b) => a.startedAgo - b.startedAgo);
        break;
    }

    return games;
  }, [searchQuery, sortBy, stakeFilter, variantFilter, friendsOnly]);

  const handleWatch = (game: LiveGame) => {
    onWatch(game.id);
  };

  const totalViewers = MOCK_LIVE_GAMES.reduce((sum, g) => sum + g.viewerCount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-[#0a0a12] to-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gray-950/90 backdrop-blur-xl border-b border-white/5">
        <div className="px-4 pt-12 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <button onClick={() => onNavigate('home')}>
                <ArrowLeft className="w-5 h-5 text-white/60" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Eye className="w-5 h-5 text-red-400" />
                  Live Games
                </h1>
                <p className="text-white/40 text-xs">
                  {MOCK_LIVE_GAMES.length} games live &middot;{' '}
                  {totalViewers.toLocaleString()} watching
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'p-2 rounded-xl transition-colors',
                showFilters
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-white/5 text-white/60'
              )}
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search games, players..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-red-500/30 transition-colors"
            />
          </div>
        </div>

        {/* Filters panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-white/5"
            >
              <div className="px-4 py-3 space-y-3">
                {/* Sort */}
                <div>
                  <label className="text-white/40 text-[10px] uppercase tracking-wider font-medium mb-1.5 block">
                    Sort by
                  </label>
                  <div className="flex gap-2">
                    {([
                      { key: 'pot', label: 'Pot Size', icon: Flame },
                      { key: 'viewers', label: 'Viewers', icon: Eye },
                      { key: 'recent', label: 'Recent', icon: Clock },
                    ] as const).map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        onClick={() => setSortBy(key)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                          sortBy === key
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-white/5 text-white/50 border border-white/10'
                        )}
                      >
                        <Icon className="w-3 h-3" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stake filter */}
                <div>
                  <label className="text-white/40 text-[10px] uppercase tracking-wider font-medium mb-1.5 block">
                    Stakes
                  </label>
                  <div className="flex gap-2">
                    {(Object.keys(STAKE_LABELS) as StakeFilter[]).map((key) => (
                      <button
                        key={key}
                        onClick={() => setStakeFilter(key)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                          stakeFilter === key
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-white/5 text-white/50 border border-white/10'
                        )}
                      >
                        {STAKE_LABELS[key]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Variant filter */}
                <div>
                  <label className="text-white/40 text-[10px] uppercase tracking-wider font-medium mb-1.5 block">
                    Variant
                  </label>
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                    <button
                      onClick={() => setVariantFilter('all')}
                      className={cn(
                        'flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                        variantFilter === 'all'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-white/5 text-white/50 border border-white/10'
                      )}
                    >
                      All
                    </button>
                    {(Object.keys(VARIANT_LABELS) as GameVariant[]).map((key) => (
                      <button
                        key={key}
                        onClick={() => setVariantFilter(key)}
                        className={cn(
                          'flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                          variantFilter === key
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-white/5 text-white/50 border border-white/10'
                        )}
                      >
                        {VARIANT_LABELS[key]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Friends toggle */}
                <button
                  onClick={() => setFriendsOnly(!friendsOnly)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    friendsOnly
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-white/5 text-white/50 border border-white/10'
                  )}
                >
                  <Users className="w-3 h-3" />
                  Friends Playing
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Scrollable content */}
      <div className="pb-28">
        {/* Featured section */}
        {!searchQuery && stakeFilter === 'all' && !friendsOnly && (
          <div className="mb-6">
            <div className="px-4 py-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <h2 className="text-sm font-bold text-white">Featured Games</h2>
              <span className="text-white/30 text-xs">
                &middot; Top action right now
              </span>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4">
              {featuredGames.map((game) => (
                <FeaturedGameCard
                  key={game.id}
                  game={game}
                  onWatch={handleWatch}
                />
              ))}
            </div>
          </div>
        )}

        {/* Live games list */}
        <div className="px-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-red-400" />
              <h2 className="text-sm font-bold text-white">
                {friendsOnly ? 'Friends Playing' : 'All Live Games'}
              </h2>
              <span className="text-white/30 text-xs">
                ({filteredGames.length})
              </span>
            </div>
            <div className="flex items-center gap-1 text-white/30 text-[10px]">
              <Filter className="w-3 h-3" />
              Sorted by {sortBy === 'pot' ? 'pot size' : sortBy}
            </div>
          </div>

          <div className="space-y-2.5">
            <AnimatePresence mode="popLayout">
              {filteredGames.map((game) => (
                <GameListItem
                  key={game.id}
                  game={game}
                  onWatch={handleWatch}
                />
              ))}
            </AnimatePresence>
          </div>

          {filteredGames.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <Eye className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <p className="text-white/40 text-sm">No live games match your filters</p>
              <button
                onClick={() => {
                  setStakeFilter('all');
                  setVariantFilter('all');
                  setFriendsOnly(false);
                  setSearchQuery('');
                }}
                className="mt-3 text-red-400 text-sm font-medium"
              >
                Clear all filters
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <NavigationBar currentScreen={currentScreen} onNavigate={onNavigate} />
    </div>
  );
}
