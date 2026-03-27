import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Filter,
  X,
  ChevronLeft,
  Swords,
  Clock,
  Crown,
  Star,
  Zap,
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { NavigationBar } from '../components/NavigationBar';
import { TournamentCard, TournamentData, TournamentTier, TournamentStatus } from '../components/TournamentCard';
import { TournamentBracket, createMockBracket } from '../components/TournamentBracket';
import { TournamentResults, MOCK_RESULTS } from '../components/TournamentResults';
import { AnimatedChipCount, PressableButton } from '../components/PolishTouches';
import { cn } from '../utils/cn';
import { formatChips } from '../game/gameEngine';
import { GameVariant } from '../types';

// --- Types ---

export interface TournamentScreenProps {
  onNavigate: (screen: string) => void;
}

type MainTab = 'upcoming' | 'live' | 'completed';
type ViewMode = 'list' | 'bracket' | 'results';
type CategoryFilter = 'all' | TournamentTier;
type VariantFilter = 'all' | GameVariant;

// --- Mock Data ---

function createMockTournaments(): TournamentData[] {
  const now = new Date();
  const prizeStructure = [
    { position: 1, percentage: 50 },
    { position: 2, percentage: 30 },
    { position: 3, percentage: 20 },
  ];

  return [
    // Upcoming - Registering
    {
      id: 't1',
      name: 'Diwali Grand Championship',
      variant: 'classic',
      tier: 'high_roller',
      entryFee: 50000,
      prizePool: 500000,
      currentPlayers: 48,
      maxPlayers: 64,
      startTime: new Date(now.getTime() + 2 * 60 * 60 * 1000),
      status: 'registering',
      prizeStructure,
      isRegistered: false,
    },
    {
      id: 't2',
      name: 'Freeroll Friday',
      variant: 'classic',
      tier: 'freeroll',
      entryFee: 0,
      prizePool: 25000,
      currentPlayers: 82,
      maxPlayers: 128,
      startTime: new Date(now.getTime() + 4 * 60 * 60 * 1000),
      status: 'registering',
      prizeStructure,
      isRegistered: true,
    },
    {
      id: 't3',
      name: 'Joker Wild Showdown',
      variant: 'joker',
      tier: 'regular',
      entryFee: 5000,
      prizePool: 100000,
      currentPlayers: 22,
      maxPlayers: 32,
      startTime: new Date(now.getTime() + 45 * 60 * 1000),
      status: 'starting_soon',
      prizeStructure,
      isRegistered: true,
    },
    {
      id: 't4',
      name: 'Muflis Madness',
      variant: 'muflis',
      tier: 'regular',
      entryFee: 2000,
      prizePool: 40000,
      currentPlayers: 16,
      maxPlayers: 32,
      startTime: new Date(now.getTime() + 6 * 60 * 60 * 1000),
      status: 'registering',
      prizeStructure,
      isRegistered: false,
    },
    {
      id: 't5',
      name: 'AK47 Blitz Tournament',
      variant: 'ak47',
      tier: 'regular',
      entryFee: 10000,
      prizePool: 200000,
      currentPlayers: 28,
      maxPlayers: 64,
      startTime: new Date(now.getTime() + 1.5 * 60 * 60 * 1000),
      status: 'registering',
      prizeStructure,
      isRegistered: false,
    },
    // Live
    {
      id: 't6',
      name: 'Midnight Maharaja',
      variant: 'classic',
      tier: 'high_roller',
      entryFee: 25000,
      prizePool: 350000,
      currentPlayers: 12,
      maxPlayers: 32,
      startTime: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      status: 'live',
      blindLevel: 8,
      tablesRemaining: 2,
      prizeStructure,
      isRegistered: true,
    },
    {
      id: 't7',
      name: 'Daily Freeroll Special',
      variant: 'classic',
      tier: 'freeroll',
      entryFee: 0,
      prizePool: 10000,
      currentPlayers: 45,
      maxPlayers: 128,
      startTime: new Date(now.getTime() - 30 * 60 * 1000),
      status: 'live',
      blindLevel: 4,
      tablesRemaining: 8,
      prizeStructure,
      isRegistered: false,
    },
    {
      id: 't8',
      name: 'Joker Jackpot Sprint',
      variant: 'joker',
      tier: 'regular',
      entryFee: 3000,
      prizePool: 60000,
      currentPlayers: 8,
      maxPlayers: 16,
      startTime: new Date(now.getTime() - 45 * 60 * 1000),
      status: 'live',
      blindLevel: 6,
      tablesRemaining: 2,
      prizeStructure,
      isRegistered: false,
    },
    // Completed
    {
      id: 't9',
      name: 'Morning Classic',
      variant: 'classic',
      tier: 'regular',
      entryFee: 1000,
      prizePool: 20000,
      currentPlayers: 32,
      maxPlayers: 32,
      startTime: new Date(now.getTime() - 5 * 60 * 60 * 1000),
      status: 'finished',
      prizeStructure,
      isRegistered: true,
    },
    {
      id: 't10',
      name: 'High Roller Exclusive',
      variant: 'classic',
      tier: 'high_roller',
      entryFee: 100000,
      prizePool: 1000000,
      currentPlayers: 16,
      maxPlayers: 16,
      startTime: new Date(now.getTime() - 8 * 60 * 60 * 1000),
      status: 'finished',
      prizeStructure,
      isRegistered: false,
    },
  ];
}

// --- Tab Config ---

const tabConfig: Record<MainTab, { label: string; icon: typeof Trophy }> = {
  upcoming: { label: 'Upcoming', icon: Clock },
  live: { label: 'Live', icon: Zap },
  completed: { label: 'Completed', icon: Trophy },
};

const categoryConfig: Record<CategoryFilter, { label: string; color: string }> = {
  all: { label: 'All', color: 'bg-white/10 text-white' },
  freeroll: { label: 'Freeroll', color: 'bg-emerald-500/20 text-emerald-300' },
  regular: { label: 'Regular', color: 'bg-blue-500/20 text-blue-300' },
  high_roller: { label: 'High Roller', color: 'bg-purple-500/20 text-purple-300' },
};

const variantConfig: Record<VariantFilter, string> = {
  all: 'All Variants',
  classic: 'Classic',
  joker: 'Joker',
  muflis: 'Muflis',
  ak47: 'AK47',
  hukam: 'Hukam',
  lowball: 'Lowball',
  best_of_four: 'Best of 4',
  dealers_choice: "Dealer's Choice",
};

// --- Status Mapping ---

const statusToTab: Record<TournamentStatus, MainTab> = {
  registering: 'upcoming',
  starting_soon: 'upcoming',
  live: 'live',
  finished: 'completed',
};

// --- Component ---

export function TournamentScreen({ onNavigate }: TournamentScreenProps) {
  const [tournaments, setTournaments] = useState<TournamentData[]>(createMockTournaments);
  const [activeTab, setActiveTab] = useState<MainTab>('upcoming');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [variantFilter, setVariantFilter] = useState<VariantFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showMyTournaments, setShowMyTournaments] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [confirmBuyIn, setConfirmBuyIn] = useState<TournamentData | null>(null);

  // Countdown timer tick
  useEffect(() => {
    const interval = setInterval(() => {
      setTournaments((prev) => [...prev]);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter tournaments
  const filteredTournaments = tournaments.filter((t) => {
    if (statusToTab[t.status] !== activeTab) return false;
    if (showMyTournaments && !t.isRegistered) return false;
    if (categoryFilter !== 'all' && t.tier !== categoryFilter) return false;
    if (variantFilter !== 'all' && t.variant !== variantFilter) return false;
    return true;
  });

  const myTournaments = tournaments.filter((t) => t.isRegistered);

  // Registration handlers
  const handleRegister = useCallback((tournamentId: string) => {
    const tournament = tournaments.find((t) => t.id === tournamentId);
    if (tournament && tournament.entryFee > 0) {
      setConfirmBuyIn(tournament);
    } else {
      // Free entry, register directly
      setTournaments((prev) =>
        prev.map((t) =>
          t.id === tournamentId
            ? { ...t, isRegistered: true, currentPlayers: t.currentPlayers + 1 }
            : t
        )
      );
    }
  }, [tournaments]);

  const handleConfirmBuyIn = useCallback(() => {
    if (!confirmBuyIn) return;
    setTournaments((prev) =>
      prev.map((t) =>
        t.id === confirmBuyIn.id
          ? { ...t, isRegistered: true, currentPlayers: t.currentPlayers + 1 }
          : t
      )
    );
    setConfirmBuyIn(null);
  }, [confirmBuyIn]);

  const handleUnregister = useCallback((tournamentId: string) => {
    setTournaments((prev) =>
      prev.map((t) =>
        t.id === tournamentId
          ? { ...t, isRegistered: false, currentPlayers: Math.max(0, t.currentPlayers - 1) }
          : t
      )
    );
  }, []);

  const handleViewBracket = useCallback((tournamentId: string) => {
    setSelectedTournamentId(tournamentId);
    setViewMode('bracket');
  }, []);

  const handleViewResults = useCallback((tournamentId: string) => {
    setSelectedTournamentId(tournamentId);
    setViewMode('results');
  }, []);

  // Sub-views
  if (viewMode === 'bracket' && selectedTournamentId) {
    const tournament = tournaments.find((t) => t.id === selectedTournamentId);
    const bracketRounds = createMockBracket('you');

    return (
      <Layout>
        <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 via-gray-900 to-black">
          {/* Back Header */}
          <div className="px-4 pt-4 pb-2">
            <button
              onClick={() => setViewMode('list')}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back to Tournaments</span>
            </button>
          </div>

          <TournamentBracket
            rounds={bracketRounds}
            currentPlayerId="you"
            tournamentName={tournament?.name || 'Tournament'}
          />
        </div>
      </Layout>
    );
  }

  if (viewMode === 'results' && selectedTournamentId) {
    return (
      <Layout>
        <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 via-gray-900 to-black">
          {/* Back Header */}
          <div className="px-4 pt-4 pb-2">
            <button
              onClick={() => setViewMode('list')}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back to Tournaments</span>
            </button>
          </div>

          <TournamentResults
            {...MOCK_RESULTS}
            onPlayAgain={() => setViewMode('list')}
            onShare={() => {
              // Mock share
              if (navigator.share) {
                navigator.share({
                  title: 'Tournament Results',
                  text: `I finished ${getOrdinal(MOCK_RESULTS.players.find((p) => p.isYou)?.position || 0)} in ${MOCK_RESULTS.tournamentName}!`,
                }).catch(() => {});
              }
            }}
          />
        </div>
      </Layout>
    );
  }

  // Main Tournament List View
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
              <Swords className="w-6 h-6 text-[#D4AF37]" />
              <h1 className="text-xl font-bold text-white">Tournaments</h1>
            </div>

            <div className="flex items-center gap-2">
              {/* My Tournaments Toggle */}
              <button
                onClick={() => setShowMyTournaments(!showMyTournaments)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  showMyTournaments
                    ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30'
                    : 'bg-white/10 text-white/50 hover:bg-white/15'
                )}
              >
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Mine ({myTournaments.length})
                </span>
              </button>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  'p-2 rounded-lg transition-all',
                  showFilters
                    ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                    : 'bg-white/10 text-white/50 hover:bg-white/15'
                )}
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Tabs */}
          <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-3">
            {(Object.keys(tabConfig) as MainTab[]).map((tab) => {
              const config = tabConfig[tab];
              const Icon = config.icon;
              const count = tournaments.filter((t) => statusToTab[t.status] === tab).length;

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5',
                    activeTab === tab
                      ? tab === 'live'
                        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                        : 'bg-gradient-to-r from-[#D4AF37] to-yellow-600 text-black'
                      : 'text-white/50'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {config.label}
                  <span className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                    activeTab === tab
                      ? tab === 'live' ? 'bg-white/20' : 'bg-black/20'
                      : 'bg-white/10'
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                {/* Category Filter */}
                <div className="mb-2">
                  <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wider mb-1.5">Category</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {(Object.keys(categoryConfig) as CategoryFilter[]).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                          categoryFilter === cat
                            ? categoryConfig[cat].color + ' ring-1 ring-white/20'
                            : 'bg-white/5 text-white/40 hover:bg-white/10'
                        )}
                      >
                        {categoryConfig[cat].label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Variant Filter */}
                <div className="mb-3">
                  <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wider mb-1.5">Variant</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {(Object.keys(variantConfig) as VariantFilter[]).map((v) => (
                      <button
                        key={v}
                        onClick={() => setVariantFilter(v)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                          variantFilter === v
                            ? 'bg-white/15 text-white ring-1 ring-white/20'
                            : 'bg-white/5 text-white/40 hover:bg-white/10'
                        )}
                      >
                        {variantConfig[v]}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.header>

        {/* Tournament List */}
        <div className="flex-1 overflow-y-auto px-4 pb-24">
          {/* My Tournaments Section (when filter active) */}
          {showMyTournaments && myTournaments.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="text-white/70 text-xs font-semibold uppercase tracking-wider">
                  My Tournaments
                </h3>
              </div>
            </div>
          )}

          {/* Live Tournament Quick Actions */}
          {activeTab === 'live' && (
            <div className="mb-3">
              {filteredTournaments.filter((t) => t.isRegistered).map((t) => (
                <motion.button
                  key={`quick-${t.id}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleViewBracket(t.id)}
                  className="w-full mb-2 p-3 rounded-xl bg-gradient-to-r from-red-900/40 to-red-800/20 border border-red-500/20 flex items-center gap-3"
                >
                  <motion.div
                    className="w-2 h-2 rounded-full bg-red-400 shrink-0"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                  />
                  <div className="flex-1 text-left">
                    <p className="text-white text-sm font-semibold">{t.name}</p>
                    <p className="text-white/40 text-xs">Tap to view bracket</p>
                  </div>
                  <Swords className="w-4 h-4 text-red-400" />
                </motion.button>
              ))}
            </div>
          )}

          {/* Tournament Cards */}
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredTournaments.length > 0 ? (
                filteredTournaments.map((tournament, idx) => (
                  <motion.div
                    key={tournament.id}
                    layout
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <TournamentCard
                      tournament={tournament}
                      onRegister={handleRegister}
                      onUnregister={handleUnregister}
                      delay={idx}
                    />

                    {/* View Bracket / Results buttons for registered or completed */}
                    {(tournament.status === 'live' || tournament.status === 'finished') && (
                      <div className="flex gap-2 mt-1.5 mb-1">
                        {tournament.status === 'live' && (
                          <PressableButton
                            variant="ghost"
                            onClick={() => handleViewBracket(tournament.id)}
                            className="flex-1 py-2 rounded-lg bg-white/5 text-white/50 text-xs font-medium flex items-center justify-center gap-1.5"
                          >
                            <Swords className="w-3 h-3" />
                            View Bracket
                          </PressableButton>
                        )}
                        {tournament.status === 'finished' && (
                          <PressableButton
                            variant="ghost"
                            onClick={() => handleViewResults(tournament.id)}
                            className="flex-1 py-2 rounded-lg bg-white/5 text-white/50 text-xs font-medium flex items-center justify-center gap-1.5"
                          >
                            <Trophy className="w-3 h-3" />
                            View Results
                          </PressableButton>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <Swords className="w-8 h-8 text-white/20" />
                  </div>
                  <p className="text-white/40 text-sm font-medium mb-1">No tournaments found</p>
                  <p className="text-white/20 text-xs">
                    {showMyTournaments
                      ? 'You haven\'t registered for any tournaments yet'
                      : 'Try adjusting your filters'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Buy-in Confirmation Modal */}
        <AnimatePresence>
          {confirmBuyIn && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setConfirmBuyIn(null)}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 50 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm z-50"
              >
                <div className="bg-gradient-to-b from-gray-900 to-black rounded-3xl border border-white/10 overflow-hidden p-6">
                  {/* Close */}
                  <button
                    onClick={() => setConfirmBuyIn(null)}
                    className="absolute top-4 right-4 p-1 text-white/30 hover:text-white/60 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="text-center mb-6">
                    <div className="w-14 h-14 rounded-full bg-[#D4AF37]/20 flex items-center justify-center mx-auto mb-3">
                      <Trophy className="w-7 h-7 text-[#D4AF37]" />
                    </div>
                    <h2 className="text-white font-bold text-lg mb-1">Confirm Registration</h2>
                    <p className="text-white/50 text-sm">{confirmBuyIn.name}</p>
                  </div>

                  {/* Buy-in Details */}
                  <div className="bg-white/5 rounded-xl p-4 mb-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-white/50 text-sm">Entry Fee</span>
                      <span className="text-white font-bold"><AnimatedChipCount value={confirmBuyIn.entryFee} /> chips</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/50 text-sm">Prize Pool</span>
                      <span className="text-[#D4AF37] font-bold"><AnimatedChipCount value={confirmBuyIn.prizePool} /> chips</span>
                    </div>
                    <div className="border-t border-white/10 pt-3">
                      <p className="text-white/30 text-xs font-semibold uppercase tracking-wider mb-2">Prize Split</p>
                      <div className="flex gap-2">
                        {confirmBuyIn.prizeStructure.map((p) => (
                          <div key={p.position} className="flex-1 text-center">
                            <p className="text-white/40 text-[10px]">{getOrdinal(p.position)}</p>
                            <p className="text-white text-xs font-bold">{p.percentage}%</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Variant + Players */}
                  <div className="flex gap-2 mb-6">
                    <div className="flex-1 bg-white/5 rounded-lg p-2 text-center">
                      <p className="text-white/40 text-[10px]">Variant</p>
                      <p className="text-white text-xs font-medium capitalize">{confirmBuyIn.variant}</p>
                    </div>
                    <div className="flex-1 bg-white/5 rounded-lg p-2 text-center">
                      <p className="text-white/40 text-[10px]">Players</p>
                      <p className="text-white text-xs font-medium">{confirmBuyIn.currentPlayers}/{confirmBuyIn.maxPlayers}</p>
                    </div>
                    <div className="flex-1 bg-white/5 rounded-lg p-2 text-center">
                      <p className="text-white/40 text-[10px]">Starts</p>
                      <p className="text-white text-xs font-medium">
                        {confirmBuyIn.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setConfirmBuyIn(null)}
                      className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/15 transition-colors"
                    >
                      Cancel
                    </button>
                    <PressableButton
                      variant="primary"
                      onClick={handleConfirmBuyIn}
                      className="flex-1"
                    >
                      Pay {formatChips(confirmBuyIn.entryFee)}
                    </PressableButton>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <NavigationBar currentScreen="tournaments" onNavigate={onNavigate} />
      </div>
    </Layout>
  );
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
