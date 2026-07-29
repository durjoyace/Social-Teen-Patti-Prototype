import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Search, Filter, Sparkles,
  Crown, Zap, Gift, Settings, ChevronRight, Flame,
  Play, Hash
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useGameStore } from '../stores/gameStore';
import { useUIStore } from '../stores/uiStore';
import { Layout } from '../components/Layout';
import { NavigationBar } from '../components/NavigationBar';
import { cn } from '../utils/cn';
import { formatChips } from '../game/gameEngine';
import { AnimatedChipCount, PressableButton, GlassCard, SkeletonLoader, EmptyState, PullToRefresh, ContextualTooltip } from '../components/PolishTouches';
import { GameVariant, GameRoom } from '../types';
import { socketService } from '../services/socket';

const variantConfig: Record<GameVariant, { color: string; icon: typeof Sparkles; label: string }> = {
  classic: { color: 'from-red-600 to-red-800', icon: Crown, label: 'Classic' },
  joker: { color: 'from-purple-600 to-purple-800', icon: Sparkles, label: 'Joker' },
  muflis: { color: 'from-green-600 to-green-800', icon: Zap, label: 'Muflis' },
  ak47: { color: 'from-orange-600 to-orange-800', icon: Flame, label: 'AK47' },
  hukam: { color: 'from-blue-600 to-blue-800', icon: Crown, label: 'Hukam' },
  lowball: { color: 'from-teal-600 to-teal-800', icon: Zap, label: 'Lowball' },
  best_of_four: { color: 'from-yellow-600 to-yellow-800', icon: Sparkles, label: 'Best of 4' },
  dealers_choice: { color: 'from-pink-600 to-pink-800', icon: Flame, label: "Dealer's" },
};

interface LobbyScreenProps {
  onJoinGame: (room: GameRoom) => void;
  onCreateGame: () => void;
  onQuickPlay: () => void;
  onJoinByCode: () => void;
  onNavigate: (screen: string) => void;
}

export function LobbyScreen({ onJoinGame, onCreateGame, onQuickPlay, onJoinByCode, onNavigate }: LobbyScreenProps) {
  const { user } = useAuthStore();
  const { availableRooms, setRooms } = useGameStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVariant, setSelectedVariant] = useState<GameVariant | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const quickPlayRef = useRef<HTMLDivElement>(null);

  const loadRooms = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!socketService.isConnected) await socketService.connect();
      const result = await socketService.listRooms();
      setRooms(result.rooms.map(room => ({
        id: room.id,
        name: room.name,
        variant: String(room.variant).toLowerCase() as GameVariant,
        minBuyIn: Number(room.minBuyIn || room.bootAmount || 500),
        maxBuyIn: Number(room.maxBuyIn || 5000),
        minBet: Number(room.bootAmount || 50),
        maxPlayers: Number(room.maxPlayers || 6),
        currentPlayers: Number(room.currentPlayers || 0),
        status: room.status,
        isPrivate: false,
        createdBy: '',
      })));
    } catch {
      setRooms([]);
    } finally {
      setIsLoading(false);
    }
  }, [setRooms]);

  useEffect(() => {
    void loadRooms();
    const timer = window.setInterval(() => void loadRooms(), 10_000);
    return () => window.clearInterval(timer);
  }, [loadRooms]);

  const filteredRooms = availableRooms.filter((room) => {
    const matchesSearch = room.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVariant = selectedVariant === 'all' || room.variant === selectedVariant;
    return matchesSearch && matchesVariant;
  });

  return (
    <Layout>
      <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 via-gray-900 to-black">
        {/* Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative z-10 px-4 pt-4 pb-2"
        >
          {/* Top bar */}
          <div className="flex items-center justify-between mb-4">
            {/* Profile */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate('profile')}
              className="flex items-center gap-3 text-left"
              aria-label="Open profile"
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center text-white font-bold text-lg ring-2 ring-yellow-500/50">
                  {user?.username?.[0]?.toUpperCase() || 'G'}
                </div>
                <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-yellow-500 rounded-full">
                  <span className="text-[10px] font-bold text-yellow-900">Lv.{user?.level || 1}</span>
                </div>
              </div>
              <div>
                <p className="text-white font-semibold">{user?.username || 'Guest'}</p>
                <div className="flex items-center gap-1">
                  <AnimatedChipCount value={user?.chips || 0} prefix="◉ " className="text-yellow-400 text-sm font-bold" />
                </div>
              </div>
            </motion.button>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <motion.button
                type="button"
                aria-label="Settings"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNavigate('settings')}
                className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm"
              >
                <Settings className="w-5 h-5 text-white/80" />
              </motion.button>
            </div>
          </div>

          {/* Referral wedge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative overflow-hidden rounded-2xl border border-[#FFD66B]/30 bg-gradient-to-r from-[#176B45] to-[#0f4d35] p-4 mb-4"
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-10" />
            <div className="relative flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Gift className="w-5 h-5 text-[#FFD66B]" />
                  <span className="text-[#FFD66B] text-sm font-medium">Your table circle</span>
                </div>
                <p className="text-white font-bold text-lg">Both unlock 100 Beli</p>
                <p className="mt-0.5 text-xs text-white/60">After your friend's first real multiplayer game</p>
              </div>
              <PressableButton
                onClick={() => onNavigate('referrals')}
                variant="primary"
                className="px-4 py-2 bg-[#F5A524] rounded-xl font-bold text-[#0B1221] shadow-none from-[#F5A524] to-[#F5A524]"
              >
                Invite
              </PressableButton>
            </div>
            {/* Sparkle effects */}
            <motion.div
              className="absolute top-2 right-20 w-2 h-2 bg-white rounded-full"
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
            <motion.div
              className="absolute bottom-3 right-32 w-1.5 h-1.5 bg-yellow-200 rounded-full"
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }}
            />
          </motion.div>

          {/* Quick Play Button */}
          <motion.div
            ref={quickPlayRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-4"
          >
            <PressableButton
              onClick={onQuickPlay}
              className="w-full p-4 rounded-2xl bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 shadow-lg shadow-green-500/40 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent shimmer" />
              <div className="relative flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Play className="w-6 h-6 text-white fill-white" />
                </div>
                <div className="text-left">
                  <p className="text-white font-bold text-lg">Quick Play</p>
                  <p className="text-white/80 text-sm">Play instantly with AI opponents</p>
                </div>
                <ChevronRight className="w-6 h-6 text-white/60 ml-auto" />
              </div>
            </PressableButton>
          </motion.div>

          {/* Action Buttons Row */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="flex gap-2 mb-4"
          >
            <PressableButton
              onClick={onCreateGame}
              variant="primary"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl"
            >
              <Plus className="w-5 h-5" />
              Create Table
            </PressableButton>
            <PressableButton
              onClick={onJoinByCode}
              variant="secondary"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl"
            >
              <Hash className="w-5 h-5" />
              Join by Code
            </PressableButton>
          </motion.div>

          {/* Search and filter */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tables..."
                className="w-full bg-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
              />
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="p-2.5 rounded-xl bg-white/10"
            >
              <Filter className="w-5 h-5 text-white/60" />
            </motion.button>
          </div>
        </motion.header>

        {/* Variant filters */}
        <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedVariant('all')}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
              selectedVariant === 'all'
                ? 'bg-yellow-500 text-yellow-900'
                : 'bg-white/10 text-white/60'
            )}
          >
            All Games
          </motion.button>
          {(Object.keys(variantConfig) as GameVariant[]).map((variant) => {
            const config = variantConfig[variant];
            const Icon = config.icon;
            return (
              <motion.button
                key={variant}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedVariant(variant)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
                  selectedVariant === variant
                    ? `bg-gradient-to-r ${config.color} text-white`
                    : 'bg-white/10 text-white/60'
                )}
              >
                <Icon className="w-4 h-4" />
                {config.label}
              </motion.button>
            );
          })}
        </div>

        {/* Tables list */}
        <PullToRefresh
          onRefresh={async () => {
            await loadRooms();
          }}
          className="flex-1 overflow-y-auto px-4 py-2"
        >
        <div className="space-y-3">
          {/* Skeleton loading state */}
          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl p-4 bg-gray-800/50 border border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="space-y-2">
                      <SkeletonLoader variant="text" width="140px" height="16px" />
                      <SkeletonLoader variant="text" width="200px" height="12px" />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <SkeletonLoader variant="text" width="50px" height="14px" />
                      <SkeletonLoader variant="button" width="70px" height="20px" />
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <SkeletonLoader key={j} variant="avatar" width="24px" height="24px" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && <AnimatePresence mode="popLayout">
            {filteredRooms.map((room, index) => {
              const config = variantConfig[room.variant];
              const Icon = config.icon;
              const isFull = room.currentPlayers >= room.maxPlayers;
              const isPlaying = room.status === 'playing';

              return (
                <motion.div
                  key={room.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => !isFull && !isPlaying && onJoinGame(room)}
                  className={cn(
                    'relative overflow-hidden rounded-2xl p-4',
                    'bg-gradient-to-br from-gray-800/80 to-gray-900/80',
                    'backdrop-blur-sm border border-white/10',
                    'cursor-pointer transition-all',
                    (isFull || isPlaying) && 'opacity-60'
                  )}
                >
                  {/* Variant indicator */}
                  <div className={cn(
                    'absolute top-0 right-0 px-3 py-1 rounded-bl-xl',
                    `bg-gradient-to-r ${config.color}`
                  )}>
                    <div className="flex items-center gap-1">
                      <Icon className="w-3 h-3 text-white" />
                      <span className="text-xs font-medium text-white">{config.label}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-semibold mb-1">{room.name}</h3>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-yellow-400">
                          {formatChips(room.minBuyIn)}–{formatChips(room.maxBuyIn)} chips
                        </span>
                        <span className="text-white/40">•</span>
                        <span className="text-white/60">
                          Boot: {formatChips(room.minBet)} chips
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-white/40" />
                        <span className={cn(
                          'text-sm font-medium',
                          isFull ? 'text-red-400' : 'text-green-400'
                        )}>
                          {room.currentPlayers}/{room.maxPlayers}
                        </span>
                      </div>
                      {isPlaying && (
                        <span className="px-2 py-0.5 bg-green-500/20 rounded-full text-xs text-green-400">
                          In Progress
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Player avatars */}
                  <div className="flex items-center gap-1 mt-3">
                    {Array.from({ length: room.currentPlayers }).map((_, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded-full bg-gradient-to-br from-red-600 to-red-900 ring-2 ring-gray-800 flex items-center justify-center text-[10px] text-white font-bold"
                        style={{ marginLeft: i > 0 ? -8 : 0 }}
                      >
                        {String.fromCharCode(65 + i)}
                      </div>
                    ))}
                    {room.currentPlayers < room.maxPlayers && (
                      <div className="w-6 h-6 rounded-full bg-white/10 ring-2 ring-gray-800 flex items-center justify-center ml-[-8px]">
                        <Plus className="w-3 h-3 text-white/40" />
                      </div>
                    )}
                  </div>

                  {/* Join arrow */}
                  {!isFull && !isPlaying && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <ChevronRight className="w-5 h-5 text-white/30" />
                    </div>
                  )}
                </motion.div>
              );
            })}


          {filteredRooms.length === 0 && (
            <EmptyState
              emoji="🃏"
              title="No tables found"
              subtitle="Try adjusting your filters or create your own table"
              actionLabel="Create Table"
              onAction={onCreateGame}
            />
          )}
          </AnimatePresence>}
        </div>
        </PullToRefresh>

        {/* First-time tooltip */}
        <ContextualTooltip
          id="quick-play-hint"
          text="Tap here to jump straight into a game!"
          emoji="🎮"
          targetRef={quickPlayRef}
          position="bottom"
        />

        {/* Navigation */}
        <NavigationBar currentScreen="home" onNavigate={onNavigate} />
      </div>
    </Layout>
  );
}
