import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings, ChevronRight, Edit2, LogOut, Trophy,
  Flame, Target, TrendingUp, Gift, Crown, Star,
  Volume2, Bell, Moon, HelpCircle, Shield
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { Layout } from '../components/Layout';
import { NavigationBar } from '../components/NavigationBar';
import { cn } from '../utils/cn';
import { formatChips } from '../game/gameEngine';

interface ProfileScreenProps {
  onNavigate: (screen: string) => void;
}

const achievements = [
  { id: 1, name: 'First Win', icon: '🏆', unlocked: true },
  { id: 2, name: 'Trail Master', icon: '🃏', unlocked: true },
  { id: 3, name: 'High Roller', icon: '💎', unlocked: false },
  { id: 4, name: 'Lucky Streak', icon: '🔥', unlocked: true },
  { id: 5, name: 'Social Butterfly', icon: '🦋', unlocked: false },
  { id: 6, name: 'Champion', icon: '👑', unlocked: false },
];

export function ProfileScreenNew({ onNavigate }: ProfileScreenProps) {
  const { user, logout } = useAuthStore();
  const { soundEnabled, toggleSound, notificationsEnabled, toggleNotifications, theme, setTheme } = useUIStore();
  const [showSettings, setShowSettings] = useState(false);

  const stats = [
    { label: 'Games', value: user?.totalGames || 0, icon: Target },
    { label: 'Wins', value: user?.gamesWon || 0, icon: Trophy },
    { label: 'Win Rate', value: user?.totalGames ? `${Math.round((user.gamesWon / user.totalGames) * 100)}%` : '0%', icon: TrendingUp },
    { label: 'Best Win', value: `₹${formatChips(user?.biggestWin || 0)}`, icon: Crown },
  ];

  return (
    <Layout>
      <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 via-gray-900 to-black">
        {/* Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative z-10 px-4 pt-4"
        >
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-white">Profile</h1>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm"
            >
              <Settings className="w-5 h-5 text-white/80" />
            </button>
          </div>
        </motion.header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-24">
          {/* Profile card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-900/80 to-red-950/80 p-6 mb-6"
          >
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_rgba(255,255,255,0.2)_0%,_transparent_50%)]" />
            </div>

            <div className="relative flex items-center gap-4">
              {/* Avatar */}
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-3xl font-bold text-white ring-4 ring-yellow-500/30">
                  {user?.username?.[0]?.toUpperCase() || 'G'}
                </div>
                <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Edit2 className="w-4 h-4 text-white" />
                </button>
                <div className="absolute -top-1 -right-1 px-2 py-0.5 bg-yellow-500 rounded-full">
                  <span className="text-xs font-bold text-yellow-900">Lv.{user?.level || 1}</span>
                </div>
              </div>

              {/* Info */}
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white mb-1">{user?.username || 'Guest'}</h2>
                <p className="text-white/60 text-sm mb-2">{user?.email || 'No email set'}</p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 rounded-full">
                    <Star className="w-3 h-3 text-yellow-400" />
                    <span className="text-xs text-yellow-400 font-medium">{user?.experience || 0} XP</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 bg-red-500/20 rounded-full">
                    <Flame className="w-3 h-3 text-red-400" />
                    <span className="text-xs text-red-400 font-medium">{user?.currentStreak || 0} Streak</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chips display */}
            <div className="relative mt-4 p-4 rounded-2xl bg-black/30 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-xs mb-1">Total Chips</p>
                  <p className="text-2xl font-bold text-yellow-400">₹{formatChips(user?.chips || 0)}</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold"
                >
                  + Add Chips
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-4 gap-2 mb-6"
          >
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="p-3 rounded-2xl bg-white/5 text-center"
                >
                  <Icon className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                  <p className="text-white font-bold text-sm">{stat.value}</p>
                  <p className="text-white/40 text-[10px]">{stat.label}</p>
                </div>
              );
            })}
          </motion.div>

          {/* Achievements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold">Achievements</h3>
              <button className="text-yellow-500 text-sm">View All</button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={cn(
                    'flex-shrink-0 w-20 p-3 rounded-2xl text-center',
                    achievement.unlocked ? 'bg-white/10' : 'bg-white/5 opacity-50'
                  )}
                >
                  <div className="text-2xl mb-1">{achievement.icon}</div>
                  <p className="text-[10px] text-white/60 truncate">{achievement.name}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Menu items */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-2"
          >
            <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-purple-400" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">Daily Rewards</p>
                  <p className="text-white/40 text-xs">Claim your daily bonus</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-green-500 rounded-full text-[10px] text-white font-bold">NEW</span>
                <ChevronRight className="w-5 h-5 text-white/30" />
              </div>
            </button>

            <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">Game History</p>
                  <p className="text-white/40 text-xs">View your past games</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-white/30" />
            </button>

            <button
              onClick={toggleSound}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Volume2 className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">Sound Effects</p>
                  <p className="text-white/40 text-xs">{soundEnabled ? 'Enabled' : 'Disabled'}</p>
                </div>
              </div>
              <div className={cn(
                'w-12 h-7 rounded-full p-1 transition-colors',
                soundEnabled ? 'bg-green-500' : 'bg-white/20'
              )}>
                <motion.div
                  className="w-5 h-5 bg-white rounded-full shadow-md"
                  animate={{ x: soundEnabled ? 20 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </div>
            </button>

            <button
              onClick={toggleNotifications}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-orange-400" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">Notifications</p>
                  <p className="text-white/40 text-xs">{notificationsEnabled ? 'Enabled' : 'Disabled'}</p>
                </div>
              </div>
              <div className={cn(
                'w-12 h-7 rounded-full p-1 transition-colors',
                notificationsEnabled ? 'bg-green-500' : 'bg-white/20'
              )}>
                <motion.div
                  className="w-5 h-5 bg-white rounded-full shadow-md"
                  animate={{ x: notificationsEnabled ? 20 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </div>
            </button>

            <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">Help & Support</p>
                  <p className="text-white/40 text-xs">Get assistance</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-white/30" />
            </button>

            <button
              onClick={logout}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-red-500/10 hover:bg-red-500/20 transition-colors mt-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-red-400" />
                </div>
                <p className="text-red-400 font-medium">Sign Out</p>
              </div>
            </button>
          </motion.div>
        </div>

        {/* Navigation */}
        <NavigationBar currentScreen="profile" onNavigate={onNavigate} />
      </div>
    </Layout>
  );
}
