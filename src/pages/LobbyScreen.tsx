import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Search, Filter, Sparkles,
  Crown, Zap, Gift, Bell, Settings, ChevronRight, Flame,
  Play, Hash
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useGameStore } from '../stores/gameStore';
import { useUIStore } from '../stores/uiStore';
import { Layout } from '../components/Layout';
import { NavigationBar } from '../components/NavigationBar';
import { cn } from '../utils/cn';
import { formatChips } from '../game/gameEngine';
import { GameVariant, GameRoom } from '../types';

// Mock rooms for demo
const mockRooms: GameRoom[] = [
  { id: '1', name: 'Diwali Special', variant: 'classic', minBuyIn: 100, maxBuyIn: 10000, minBet: 10, maxPlayers: 6, currentPlayers: 4, status: 'waiting', isPrivate: false, createdBy: '1' },
  { id: '2', name: 'High Rollers', variant: 'classic', minBuyIn: 1000, maxBuyIn: 100000, minBet: 100, maxPlayers: 6, currentPlayers: 2, status: 'waiting', isPrivate: false, createdBy: '2' },
  { id: '3', name: 'Joker\'s Den', variant: 'joker', minBuyIn: 500, maxBuyIn: 50000, minBet: 50, maxPlayers: 6, currentPlayers: 5, status: 'playing', isPrivate: false, createdBy: '3' },
  { id: '4', name: 'Muflis Madness', variant: 'muflis', minBuyIn: 200, maxBuyIn: 20000, minBet: 20, maxPlayers: 6, currentPlayers: 3, status: 'waiting', isPrivate: false, createdBy: '4' },
];

const variantConfig: Record<GameVariant, { color: string; icon: typeof Sparkles; label: string }> = {
  classic: { color: 'from-red-600 to-red-800', icon: Crown, label: 'Classic' },
  joker: { color: 'from-purple-600 to-purple-800', icon: Sparkles, label: 'Joker' },
  muflis: { color: 'from-green-600 to-green-800', icon: Zap, label: 'Muflis' },
  ak47: { color: 'from-orange-600 to-orange-800', icon: Flame, label: 'AK47' }
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
  const { setRooms } = useGameStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVariant, setSelectedVariant] = useState<GameVariant | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'tables' | 'tournaments' | 'friends'>('tables');

  const filteredRooms = mockRooms.filter((room) => {
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
            <motion.div
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate('profile')}
              className="flex items-center gap-3"
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
                  <span className="text-yellow-400 text-sm font-bold">₹{formatChips(user?.chips || 0)}</span>
                  <button className="ml-1 px-2 py-0.5 bg-green-500 rounded-full">
                    <Plus className="w-3 h-3 text-white" />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative p-2.5 rounded-xl bg-white/10 backdrop-blur-sm"
              >
                <Bell className="w-5 h-5 text-white/80" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold">3</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm"
              >
                <Settings className="w-5 h-5 text-white/80" />
              </motion.button>
            </div>
          </div>

          {/* Daily bonus banner */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-yellow-600 via-orange-500 to-red-600 p-4 mb-4"
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-10" />
            <div className="relative flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Gift className="w-5 h-5 text-yellow-200" />
                  <span className="text-yellow-200 text-sm font-medium">Daily Bonus</span>
                </div>
                <p className="text-white font-bold text-lg">Claim ₹500 FREE!</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-white rounded-xl font-bold text-orange-600 shadow-lg"
              >
                Claim
              </motion.button>
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
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onQuickPlay}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 shadow-lg shadow-green-500/40 mb-4 relative overflow-hidden"
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
          </motion.button>

          {/* Action Buttons Row */}
          <div className="flex gap-2 mb-4">
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCreateGame}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold shadow-lg shadow-orange-500/30"
            >
              <Plus className="w-5 h-5" />
              Create Table
            </motion.button>
            <motion.button
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
              whileTap={{ scale: 0.95 }}
              onClick={onJoinByCode}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 text-white font-semibold border border-white/20"
            >
              <Hash className="w-5 h-5" />
              Join by Code
            </motion.button>
          </div>

          {/* Tab navigation */}
          <div className="flex gap-2 mb-4">
            {(['tables', 'tournaments', 'friends'] as const).map((tab) => (
              <motion.button
                key={tab}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'flex-1 py-2.5 rounded-xl font-medium text-sm transition-all',
                  activeTab === tab
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/30'
                    : 'bg-white/10 text-white/60'
                )}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </motion.button>
            ))}
          </div>

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
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
          <AnimatePresence mode="popLayout">
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
                          ₹{formatChips(room.minBuyIn)} - ₹{formatChips(room.maxBuyIn)}
                        </span>
                        <span className="text-white/40">•</span>
                        <span className="text-white/60">
                          Boot: ₹{formatChips(room.minBet)}
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
          </AnimatePresence>

          {filteredRooms.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-white/40">
              <Search className="w-12 h-12 mb-3 opacity-50" />
              <p>No tables found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <NavigationBar currentScreen="home" onNavigate={onNavigate} />
      </div>
    </Layout>
  );
}
