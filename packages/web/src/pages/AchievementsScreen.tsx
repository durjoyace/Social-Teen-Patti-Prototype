import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Star, Crown, Flame, Target, Users, Zap,
  Lock, Check, Gift, Sparkles, Medal, TrendingUp, Heart
} from 'lucide-react';
import { NavigationBar } from '../components/NavigationBar';
import { Layout } from '../components/Layout';
import { cn } from '../utils/cn';
import { formatChips } from '../game/gameEngine';

// ─── Achievement Data ──────────────────────────────────────────────────────

interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'gameplay' | 'social' | 'progression' | 'mastery';
  icon: typeof Trophy;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  rewardChips: number;
  rewardXp: number;
  progress: number;
  goal: number;
  isCompleted: boolean;
  isClaimed: boolean;
  completedAt?: string;
}

const RARITY_CONFIG = {
  common: { label: 'Common', color: 'text-gray-400', bg: 'from-gray-600 to-gray-700', border: 'border-gray-500/30', glow: '' },
  rare: { label: 'Rare', color: 'text-blue-400', bg: 'from-blue-600 to-blue-800', border: 'border-blue-500/30', glow: 'shadow-blue-500/20' },
  epic: { label: 'Epic', color: 'text-purple-400', bg: 'from-purple-600 to-purple-800', border: 'border-purple-500/30', glow: 'shadow-purple-500/30' },
  legendary: { label: 'Legendary', color: 'text-yellow-400', bg: 'from-yellow-500 to-orange-600', border: 'border-yellow-500/50', glow: 'shadow-yellow-500/40' },
};

const CATEGORY_CONFIG = {
  gameplay: { label: 'Gameplay', icon: Target, color: 'text-green-400' },
  social: { label: 'Social', icon: Users, color: 'text-blue-400' },
  progression: { label: 'Progression', icon: TrendingUp, color: 'text-purple-400' },
  mastery: { label: 'Mastery', icon: Crown, color: 'text-yellow-400' },
};

const MOCK_ACHIEVEMENTS: Achievement[] = [
  // Gameplay
  { id: '1', name: 'First Win', description: 'Win your first game', category: 'gameplay', icon: Trophy, rarity: 'common', rewardChips: 500, rewardXp: 50, progress: 1, goal: 1, isCompleted: true, isClaimed: true },
  { id: '2', name: 'Trail Blazer', description: 'Get a Trail (Three of a Kind)', category: 'gameplay', icon: Flame, rarity: 'rare', rewardChips: 2000, rewardXp: 200, progress: 3, goal: 5, isCompleted: false, isClaimed: false },
  { id: '3', name: 'Royal Flush', description: 'Get a Pure Sequence of A-K-Q', category: 'gameplay', icon: Crown, rarity: 'legendary', rewardChips: 50000, rewardXp: 1000, progress: 0, goal: 1, isCompleted: false, isClaimed: false },
  { id: '4', name: 'Winning Streak', description: 'Win 5 games in a row', category: 'gameplay', icon: Zap, rarity: 'epic', rewardChips: 10000, rewardXp: 500, progress: 2, goal: 5, isCompleted: false, isClaimed: false },
  { id: '5', name: 'Blind Master', description: 'Win 10 games while playing blind', category: 'gameplay', icon: Star, rarity: 'epic', rewardChips: 15000, rewardXp: 750, progress: 4, goal: 10, isCompleted: false, isClaimed: false },
  { id: '6', name: 'High Roller', description: 'Win a pot worth over ₹100K', category: 'gameplay', icon: Sparkles, rarity: 'legendary', rewardChips: 25000, rewardXp: 1500, progress: 0, goal: 1, isCompleted: false, isClaimed: false },
  // Social
  { id: '7', name: 'Social Butterfly', description: 'Add 10 friends', category: 'social', icon: Users, rarity: 'common', rewardChips: 1000, rewardXp: 100, progress: 3, goal: 10, isCompleted: false, isClaimed: false },
  { id: '8', name: 'Generous Soul', description: 'Send 50 gifts', category: 'social', icon: Gift, rarity: 'rare', rewardChips: 3000, rewardXp: 300, progress: 12, goal: 50, isCompleted: false, isClaimed: false },
  { id: '9', name: 'Club Leader', description: 'Create a club with 20 members', category: 'social', icon: Crown, rarity: 'epic', rewardChips: 10000, rewardXp: 500, progress: 0, goal: 1, isCompleted: false, isClaimed: false },
  // Progression
  { id: '10', name: 'Level 10', description: 'Reach Level 10', category: 'progression', icon: Medal, rarity: 'common', rewardChips: 2000, rewardXp: 200, progress: 1, goal: 10, isCompleted: false, isClaimed: false },
  { id: '11', name: 'Veteran', description: 'Play 100 games', category: 'progression', icon: Star, rarity: 'rare', rewardChips: 5000, rewardXp: 500, progress: 23, goal: 100, isCompleted: false, isClaimed: false },
  { id: '12', name: 'Daily Devotee', description: 'Log in 30 days in a row', category: 'progression', icon: Heart, rarity: 'epic', rewardChips: 20000, rewardXp: 1000, progress: 7, goal: 30, isCompleted: false, isClaimed: false },
  // Mastery
  { id: '13', name: 'Muflis Master', description: 'Win 20 Muflis games', category: 'mastery', icon: Zap, rarity: 'rare', rewardChips: 5000, rewardXp: 500, progress: 2, goal: 20, isCompleted: false, isClaimed: false },
  { id: '14', name: 'Joker King', description: 'Win 20 Joker variant games', category: 'mastery', icon: Sparkles, rarity: 'rare', rewardChips: 5000, rewardXp: 500, progress: 5, goal: 20, isCompleted: false, isClaimed: false },
  { id: '15', name: 'Bluff Master', description: 'Win 10 games with High Card or Pair', category: 'mastery', icon: Target, rarity: 'epic', rewardChips: 15000, rewardXp: 750, progress: 3, goal: 10, isCompleted: false, isClaimed: false },
];

interface AchievementsScreenProps {
  onNavigate: (screen: string) => void;
}

export function AchievementsScreen({ onNavigate }: AchievementsScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');

  const filtered = MOCK_ACHIEVEMENTS.filter(a => {
    if (selectedCategory !== 'all' && a.category !== selectedCategory) return false;
    if (selectedRarity !== 'all' && a.rarity !== selectedRarity) return false;
    return true;
  });

  const totalCompleted = MOCK_ACHIEVEMENTS.filter(a => a.isCompleted).length;
  const totalAchievements = MOCK_ACHIEVEMENTS.length;
  const unclaimedRewards = MOCK_ACHIEVEMENTS.filter(a => a.isCompleted && !a.isClaimed).length;

  return (
    <Layout>
      <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 via-gray-900 to-black">
        {/* Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="px-4 pt-4 pb-2"
        >
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">Achievements</h1>
            {unclaimedRewards > 0 && (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/20 border border-yellow-500/30"
              >
                <Gift className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-bold text-yellow-400">{unclaimedRewards} to claim</span>
              </motion.div>
            )}
          </div>

          {/* Progress overview */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60 text-sm">Overall Progress</span>
              <span className="text-yellow-400 font-bold">{totalCompleted}/{totalAchievements}</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(totalCompleted / totalAchievements) * 100}%` }}
                transition={{ duration: 1, delay: 0.3 }}
              />
            </div>
          </div>

          {/* Category filters */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            <FilterButton
              label="All"
              isActive={selectedCategory === 'all'}
              onClick={() => setSelectedCategory('all')}
            />
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <FilterButton
                  key={key}
                  label={config.label}
                  icon={<Icon className="w-3.5 h-3.5" />}
                  isActive={selectedCategory === key}
                  onClick={() => setSelectedCategory(key)}
                />
              );
            })}
          </div>

          {/* Rarity filters */}
          <div className="flex gap-2 mt-2 overflow-x-auto scrollbar-hide">
            <FilterButton
              label="All Rarities"
              isActive={selectedRarity === 'all'}
              onClick={() => setSelectedRarity('all')}
              small
            />
            {Object.entries(RARITY_CONFIG).map(([key, config]) => (
              <FilterButton
                key={key}
                label={config.label}
                isActive={selectedRarity === key}
                onClick={() => setSelectedRarity(key)}
                className={selectedRarity === key ? config.color : ''}
                small
              />
            ))}
          </div>
        </motion.header>

        {/* Achievement list */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((achievement, index) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                index={index}
              />
            ))}
          </AnimatePresence>
        </div>

        <NavigationBar currentScreen="profile" onNavigate={onNavigate} />
      </div>
    </Layout>
  );
}

// ─── Achievement Card ──────────────────────────────────────────────────────

function AchievementCard({ achievement, index }: { achievement: Achievement; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const rarity = RARITY_CONFIG[achievement.rarity];
  const category = CATEGORY_CONFIG[achievement.category];
  const Icon = achievement.icon;
  const progressPercent = Math.min((achievement.progress / achievement.goal) * 100, 100);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.03 }}
      onClick={() => setIsExpanded(!isExpanded)}
      className={cn(
        'relative overflow-hidden rounded-2xl p-4',
        'bg-gradient-to-br from-gray-800/80 to-gray-900/80',
        'backdrop-blur-sm border',
        rarity.border,
        achievement.isCompleted && !achievement.isClaimed && 'ring-1 ring-yellow-500/50',
        achievement.isCompleted && achievement.isClaimed && 'opacity-70',
        rarity.glow && `shadow-lg ${rarity.glow}`,
        'cursor-pointer transition-all'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
          `bg-gradient-to-br ${rarity.bg}`,
          achievement.isCompleted ? '' : 'opacity-50'
        )}>
          {achievement.isCompleted ? (
            <Icon className="w-6 h-6 text-white" />
          ) : (
            <Lock className="w-5 h-5 text-white/60" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-white font-semibold text-sm truncate">{achievement.name}</h3>
            <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', rarity.color, 'bg-white/5')}>
              {rarity.label}
            </span>
          </div>
          <p className="text-white/50 text-xs mb-2">{achievement.description}</p>

          {/* Progress bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className={cn('h-full rounded-full', `bg-gradient-to-r ${rarity.bg}`)}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, delay: index * 0.05 }}
              />
            </div>
            <span className="text-xs text-white/50 font-medium whitespace-nowrap">
              {achievement.progress}/{achievement.goal}
            </span>
          </div>
        </div>

        {/* Status */}
        <div className="flex-shrink-0">
          {achievement.isCompleted && achievement.isClaimed && (
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="w-4 h-4 text-green-400" />
            </div>
          )}
          {achievement.isCompleted && !achievement.isClaimed && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-500/30"
              onClick={(e) => {
                e.stopPropagation();
                // Claim reward
              }}
            >
              Claim
            </motion.button>
          )}
        </div>
      </div>

      {/* Expanded rewards */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-yellow-400 text-xs">Reward:</span>
                <span className="text-yellow-400 font-bold text-sm">₹{formatChips(achievement.rewardChips)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="w-3 h-3 text-purple-400" />
                <span className="text-purple-400 font-bold text-sm">{achievement.rewardXp} XP</span>
              </div>
              <span className={cn('text-xs ml-auto', category.color)}>
                {category.label}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rarity indicator line */}
      <div className={cn('absolute bottom-0 left-0 right-0 h-0.5', `bg-gradient-to-r ${rarity.bg}`)} />
    </motion.div>
  );
}

// ─── Filter Button ─────────────────────────────────────────────────────────

function FilterButton({
  label,
  icon,
  isActive,
  onClick,
  className,
  small,
}: {
  label: string;
  icon?: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  className?: string;
  small?: boolean;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 whitespace-nowrap transition-all',
        small ? 'px-3 py-1.5 rounded-lg text-xs' : 'px-4 py-2 rounded-xl text-sm',
        'font-medium',
        isActive
          ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg shadow-orange-500/20'
          : 'bg-white/10 text-white/60 hover:bg-white/15',
        className
      )}
    >
      {icon}
      {label}
    </motion.button>
  );
}
