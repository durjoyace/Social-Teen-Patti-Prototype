import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown,
  Star,
  Shield,
  Gem,
  Diamond,
  Check,
  Lock,
  Sparkles,
  Gift,
  Headphones,
  Palette,
  Users,
} from 'lucide-react';
import { cn } from '../utils/cn';

// --- Types ---

interface VIPTier {
  id: string;
  name: string;
  requiredPoints: number;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  glowColor: string;
  borderColor: string;
  icon: React.ReactNode;
  benefits: { label: string; icon: React.ReactNode }[];
  dailyMultiplier: number;
}

interface VIPPanelProps {
  currentPoints?: number;
  currentTierId?: string;
  className?: string;
  onUpgrade?: (tierId: string) => void;
}

// --- Data ---

const VIP_TIERS: VIPTier[] = [
  {
    id: 'bronze',
    name: 'Bronze',
    requiredPoints: 0,
    color: 'text-orange-400',
    gradientFrom: 'from-orange-800/40',
    gradientTo: 'to-orange-900/20',
    glowColor: 'shadow-orange-500/20',
    borderColor: 'border-orange-500/30',
    icon: <Shield size={20} className="text-orange-400" />,
    dailyMultiplier: 1.0,
    benefits: [
      { label: 'Daily reward: 1x', icon: <Gift size={12} /> },
      { label: 'Standard tables', icon: <Users size={12} /> },
    ],
  },
  {
    id: 'silver',
    name: 'Silver',
    requiredPoints: 5000,
    color: 'text-gray-300',
    gradientFrom: 'from-gray-600/40',
    gradientTo: 'to-gray-800/20',
    glowColor: 'shadow-gray-400/20',
    borderColor: 'border-gray-400/30',
    icon: <Star size={20} className="text-gray-300" />,
    dailyMultiplier: 1.5,
    benefits: [
      { label: 'Daily reward: 1.5x', icon: <Gift size={12} /> },
      { label: 'Silver tables', icon: <Users size={12} /> },
      { label: 'Silver avatar frame', icon: <Palette size={12} /> },
    ],
  },
  {
    id: 'gold',
    name: 'Gold',
    requiredPoints: 25000,
    color: 'text-yellow-400',
    gradientFrom: 'from-yellow-800/40',
    gradientTo: 'to-yellow-900/20',
    glowColor: 'shadow-yellow-500/25',
    borderColor: 'border-yellow-500/40',
    icon: <Crown size={20} className="text-yellow-400" />,
    dailyMultiplier: 2.0,
    benefits: [
      { label: 'Daily reward: 2x', icon: <Gift size={12} /> },
      { label: 'Gold exclusive tables', icon: <Users size={12} /> },
      { label: 'Gold avatar frame', icon: <Palette size={12} /> },
      { label: 'Priority support', icon: <Headphones size={12} /> },
    ],
  },
  {
    id: 'platinum',
    name: 'Platinum',
    requiredPoints: 100000,
    color: 'text-blue-300',
    gradientFrom: 'from-blue-800/40',
    gradientTo: 'to-blue-900/20',
    glowColor: 'shadow-blue-400/25',
    borderColor: 'border-blue-400/40',
    icon: <Gem size={20} className="text-blue-300" />,
    dailyMultiplier: 3.0,
    benefits: [
      { label: 'Daily reward: 3x', icon: <Gift size={12} /> },
      { label: 'Platinum tables', icon: <Users size={12} /> },
      { label: 'Platinum avatar frame', icon: <Palette size={12} /> },
      { label: 'Priority support', icon: <Headphones size={12} /> },
      { label: 'Exclusive emotes', icon: <Sparkles size={12} /> },
    ],
  },
  {
    id: 'diamond',
    name: 'Diamond',
    requiredPoints: 500000,
    color: 'text-cyan-300',
    gradientFrom: 'from-cyan-800/40',
    gradientTo: 'to-cyan-900/20',
    glowColor: 'shadow-cyan-400/30',
    borderColor: 'border-cyan-400/50',
    icon: <Diamond size={20} className="text-cyan-300" />,
    dailyMultiplier: 5.0,
    benefits: [
      { label: 'Daily reward: 5x', icon: <Gift size={12} /> },
      { label: 'Diamond private tables', icon: <Users size={12} /> },
      { label: 'Diamond avatar frame', icon: <Palette size={12} /> },
      { label: 'Dedicated VIP support', icon: <Headphones size={12} /> },
      { label: 'All exclusive emotes', icon: <Sparkles size={12} /> },
      { label: 'Custom table themes', icon: <Palette size={12} /> },
    ],
  },
];

// --- Helpers ---

function formatPoints(points: number): string {
  if (points >= 100000) return `${(points / 1000).toFixed(0)}K`;
  if (points >= 1000) return `${(points / 1000).toFixed(1)}K`;
  return points.toString();
}

function getCurrentTierIndex(tierId: string): number {
  const idx = VIP_TIERS.findIndex((t) => t.id === tierId);
  return idx >= 0 ? idx : 0;
}

// --- Sub-components ---

function ProgressBar({
  currentPoints,
  currentTierIndex,
}: {
  currentPoints: number;
  currentTierIndex: number;
}) {
  const currentTier = VIP_TIERS[currentTierIndex];
  const nextTier = VIP_TIERS[currentTierIndex + 1];

  if (!nextTier) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className={cn('font-bold', currentTier.color)}>Max Tier Reached</span>
          <span className="text-gray-400">{formatPoints(currentPoints)} pts</span>
        </div>
        <div className="h-3 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-cyan-600"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </div>
    );
  }

  const pointsInTier = currentPoints - currentTier.requiredPoints;
  const pointsNeeded = nextTier.requiredPoints - currentTier.requiredPoints;
  const progress = Math.min(1, Math.max(0, pointsInTier / pointsNeeded));
  const remaining = nextTier.requiredPoints - currentPoints;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between text-xs mb-2">
        <span className={cn('font-bold', currentTier.color)}>{currentTier.name}</span>
        <span className="text-gray-400">
          {formatPoints(remaining)} pts to {nextTier.name}
        </span>
      </div>
      <div className="relative h-3 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-amber-600"
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
        {/* Shimmer */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
        />
      </div>
      <div className="flex items-center justify-between text-[10px] text-gray-500 mt-1">
        <span>{formatPoints(currentPoints)} pts</span>
        <span>{formatPoints(nextTier.requiredPoints)} pts</span>
      </div>
    </div>
  );
}

function TierCard({
  tier,
  isCurrent,
  isUnlocked,
  index,
  onUpgrade: _onUpgrade,
}: {
  tier: VIPTier;
  isCurrent: boolean;
  isUnlocked: boolean;
  index: number;
  onUpgrade?: (tierId: string) => void;
}) {
  const [isExpanded, setIsExpanded] = React.useState(isCurrent);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 300, damping: 25 }}
    >
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full text-left rounded-2xl border transition-all overflow-hidden',
          isCurrent && `shadow-lg ${tier.glowColor}`,
          isUnlocked ? tier.borderColor : 'border-white/5',
        )}
        whileTap={{ scale: 0.98 }}
      >
        {/* Header */}
        <div className={cn(
          'flex items-center gap-3 p-4',
          isUnlocked
            ? `bg-gradient-to-r ${tier.gradientFrom} ${tier.gradientTo}`
            : 'bg-white/[0.02]',
        )}>
          {/* Icon */}
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center',
            isUnlocked
              ? `bg-gradient-to-br ${tier.gradientFrom} ${tier.gradientTo} border ${tier.borderColor}`
              : 'bg-white/5 border border-white/5',
          )}>
            {isUnlocked ? tier.icon : <Lock size={16} className="text-gray-600" />}
          </div>

          {/* Name & points */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={cn(
                'text-sm font-bold',
                isUnlocked ? tier.color : 'text-gray-600',
              )}>
                {tier.name}
              </span>
              {isCurrent && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/10 text-white uppercase"
                >
                  Current
                </motion.span>
              )}
            </div>
            <span className="text-[11px] text-gray-500">
              {tier.requiredPoints === 0 ? 'Starting tier' : `${formatPoints(tier.requiredPoints)} points required`}
            </span>
          </div>

          {/* Multiplier badge */}
          <div className={cn(
            'px-2 py-1 rounded-lg text-xs font-bold',
            isUnlocked ? 'bg-white/10 text-white' : 'bg-white/5 text-gray-600',
          )}>
            {tier.dailyMultiplier}x
          </div>
        </div>

        {/* Current tier glow line */}
        {isCurrent && (
          <motion.div
            className={cn('h-0.5 bg-gradient-to-r', tier.gradientFrom.replace('from-', 'from-').replace('/40', ''), tier.gradientTo.replace('to-', 'to-').replace('/20', ''))}
            layoutId="current-tier-glow"
          />
        )}

        {/* Expanded benefits */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 pt-2 space-y-2">
                {tier.benefits.map((benefit, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-2"
                  >
                    <div className={cn(
                      'w-5 h-5 rounded flex items-center justify-center',
                      isUnlocked ? 'text-green-400' : 'text-gray-600',
                    )}>
                      {isUnlocked ? <Check size={12} /> : benefit.icon}
                    </div>
                    <span className={cn(
                      'text-xs',
                      isUnlocked ? 'text-gray-300' : 'text-gray-600',
                    )}>
                      {benefit.label}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </motion.div>
  );
}

// --- Main Component ---

export function VIPPanel({
  currentPoints = 12500,
  currentTierId = 'silver',
  className,
  onUpgrade,
}: VIPPanelProps) {
  const currentTierIndex = getCurrentTierIndex(currentTierId);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        'bg-gradient-to-b from-gray-900 to-black rounded-3xl border border-white/5 overflow-hidden',
        className,
      )}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <Crown size={18} className="text-yellow-500" />
          <h2 className="text-base font-bold text-white">VIP Status</h2>
        </div>
        <p className="text-xs text-gray-500">Earn points by playing to unlock exclusive rewards</p>
      </div>

      {/* Current tier showcase */}
      <div className="px-5 mb-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className={cn(
            'relative p-4 rounded-2xl overflow-hidden',
            `bg-gradient-to-br ${VIP_TIERS[currentTierIndex].gradientFrom} ${VIP_TIERS[currentTierIndex].gradientTo}`,
            `border ${VIP_TIERS[currentTierIndex].borderColor}`,
            `shadow-lg ${VIP_TIERS[currentTierIndex].glowColor}`,
          )}
        >
          {/* Background glow */}
          <motion.div
            className="absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-20 blur-3xl"
            style={{ background: VIP_TIERS[currentTierIndex].color.includes('yellow') ? '#D4AF37' : VIP_TIERS[currentTierIndex].color.includes('cyan') ? '#22d3ee' : '#9ca3af' }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 4 }}
          />

          <div className="relative flex items-center gap-4">
            {/* Tier icon */}
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className={cn(
                'w-14 h-14 rounded-2xl flex items-center justify-center',
                `bg-gradient-to-br ${VIP_TIERS[currentTierIndex].gradientFrom} ${VIP_TIERS[currentTierIndex].gradientTo}`,
                `border-2 ${VIP_TIERS[currentTierIndex].borderColor}`,
              )}
            >
              {React.cloneElement(VIP_TIERS[currentTierIndex].icon as React.ReactElement, { size: 28 })}
            </motion.div>

            <div>
              <span className="text-xs text-gray-400 uppercase tracking-wider">Current Tier</span>
              <h3 className={cn('text-xl font-bold', VIP_TIERS[currentTierIndex].color)}>
                {VIP_TIERS[currentTierIndex].name}
              </h3>
              <div className="flex items-center gap-1 mt-0.5">
                <Sparkles size={10} className="text-yellow-500" />
                <span className="text-xs text-gray-400">{formatPoints(currentPoints)} total points</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Progress bar */}
      <div className="px-5">
        <ProgressBar currentPoints={currentPoints} currentTierIndex={currentTierIndex} />
      </div>

      {/* Tier list */}
      <div className="px-5 pb-5 space-y-2">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">All Tiers</span>
        {VIP_TIERS.map((tier, i) => {
          const tierIdx = getCurrentTierIndex(tier.id);
          const isUnlocked = tierIdx <= currentTierIndex;
          const isCurrent = tier.id === currentTierId;

          return (
            <TierCard
              key={tier.id}
              tier={tier}
              isCurrent={isCurrent}
              isUnlocked={isUnlocked}
              index={i}
              onUpgrade={onUpgrade}
            />
          );
        })}
      </div>
    </motion.div>
  );
}
