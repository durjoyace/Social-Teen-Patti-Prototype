import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Flame,
  Check,
  Gift,
  Crown,
  Sparkles,
  Clock,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { formatChips } from '../game/gameEngine';
import { AnimatedChipCount, PressableButton, SuccessCheckmark } from './PolishTouches';

// --- Types ---

interface DayReward {
  day: number;
  chips: number;
  isClaimed: boolean;
  isToday: boolean;
}

interface DailyRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaim: (day: number, chips: number) => void;
  currentDay?: number;
  streak?: number;
  claimedDays?: number[];
  vipMultiplier?: number;
}

// --- Data ---

const BASE_REWARDS = [500, 750, 1000, 1500, 2000, 3000, 5000];

// --- Helpers ---

function getTimeUntilMidnight(): string {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight.getTime() - now.getTime();

  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// --- Confetti Particle ---

function ConfettiParticle({ delay, color }: { delay: number; color: string }) {
  const randomX = Math.random() * 300 - 150;
  const randomRotate = Math.random() * 720 - 360;

  return (
    <motion.div
      className="absolute w-2 h-2 rounded-sm"
      style={{ backgroundColor: color }}
      initial={{ y: 0, x: 0, opacity: 1, rotate: 0, scale: 1 }}
      animate={{
        y: [0, -80, 200],
        x: [0, randomX * 0.5, randomX],
        opacity: [1, 1, 0],
        rotate: [0, randomRotate],
        scale: [1, 1.2, 0.5],
      }}
      transition={{
        duration: 1.5,
        delay,
        ease: 'easeOut',
      }}
    />
  );
}

const CONFETTI_COLORS = [
  '#D4AF37', '#FFD700', '#FF6B6B', '#4ECDC4',
  '#45B7D1', '#FF69B4', '#98D8C8', '#F7DC6F',
];

// --- Sub-components ---

function DayCard({
  reward,
  vipMultiplier,
  index,
}: {
  reward: DayReward;
  vipMultiplier: number;
  index: number;
}) {
  const actualReward = Math.floor(reward.chips * vipMultiplier);
  const isUpcoming = !reward.isClaimed && !reward.isToday;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 400, damping: 20 }}
      className={cn(
        'relative flex flex-col items-center gap-1 p-2 rounded-xl border transition-all',
        reward.isClaimed && 'bg-green-900/20 border-green-500/30',
        reward.isToday && !reward.isClaimed && 'bg-yellow-900/30 border-yellow-500/50 shadow-lg shadow-yellow-500/10',
        isUpcoming && 'bg-white/5 border-white/5 opacity-50',
      )}
    >
      {/* Day label */}
      <span className={cn(
        'text-[10px] font-bold uppercase',
        reward.isClaimed ? 'text-green-400' : reward.isToday ? 'text-yellow-400' : 'text-gray-500',
      )}>
        Day {reward.day}
      </span>

      {/* Icon / check */}
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center',
        reward.isClaimed && 'bg-green-500/20',
        reward.isToday && !reward.isClaimed && 'bg-yellow-500/20',
        isUpcoming && 'bg-white/5',
      )}>
        {reward.isClaimed ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          >
            <Check size={16} className="text-green-400" />
          </motion.div>
        ) : reward.isToday ? (
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <Gift size={16} className="text-yellow-400" />
          </motion.div>
        ) : (
          <Gift size={14} className="text-gray-600" />
        )}
      </div>

      {/* Reward amount */}
      <span className={cn(
        'text-xs font-bold',
        reward.isClaimed ? 'text-green-400' : reward.isToday ? 'text-yellow-400' : 'text-gray-500',
      )}>
        {formatChips(actualReward)}
      </span>

      {/* Today indicator */}
      {reward.isToday && !reward.isClaimed && (
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-yellow-500"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
        />
      )}
    </motion.div>
  );
}

function StreakDisplay({ streak }: { streak: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-900/30 border border-orange-500/20"
    >
      <motion.div
        animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        <Flame size={16} className="text-orange-500" />
      </motion.div>
      <span className="text-sm font-bold text-orange-400">{streak} Day Streak</span>
      <Sparkles size={12} className="text-orange-400/50" />
    </motion.div>
  );
}

// --- Main Component ---

export function DailyRewardModal({
  isOpen,
  onClose,
  onClaim,
  currentDay = 3,
  streak = 2,
  claimedDays = [1, 2],
  vipMultiplier = 1.0,
}: DailyRewardModalProps) {
  const [hasClaimed, setHasClaimed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [countdown, setCountdown] = useState('');

  // Build reward days
  const rewards: DayReward[] = BASE_REWARDS.map((chips, i) => ({
    day: i + 1,
    chips,
    isClaimed: claimedDays.includes(i + 1),
    isToday: i + 1 === currentDay,
  }));

  const todayReward = rewards.find((r) => r.isToday);
  const todayChips = todayReward ? Math.floor(todayReward.chips * vipMultiplier) : 0;

  // Countdown timer
  useEffect(() => {
    if (!hasClaimed) return;
    function update() {
      setCountdown(getTimeUntilMidnight());
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [hasClaimed]);

  const handleClaim = useCallback(() => {
    if (hasClaimed || !todayReward) return;
    setHasClaimed(true);
    setShowConfetti(true);
    onClaim(currentDay, todayChips);

    // Hide confetti after animation
    setTimeout(() => setShowConfetti(false), 2000);
  }, [hasClaimed, todayReward, onClaim, currentDay, todayChips]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 30 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="relative w-full max-w-sm rounded-3xl overflow-hidden bg-gradient-to-b from-gray-800 to-gray-900 border border-white/10 shadow-2xl"
          >
            {/* Confetti layer */}
            {showConfetti && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 overflow-hidden">
                {Array.from({ length: 30 }).map((_, i) => (
                  <ConfettiParticle
                    key={i}
                    delay={i * 0.03}
                    color={CONFETTI_COLORS[i % CONFETTI_COLORS.length]}
                  />
                ))}
              </div>
            )}

            {/* Header */}
            <div className="relative px-5 pt-5 pb-3">
              {/* Close */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors z-10"
              >
                <X size={16} />
              </motion.button>

              {/* Title area */}
              <div className="flex flex-col items-center gap-2">
                <motion.div
                  initial={{ rotate: -15, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg shadow-yellow-500/30"
                >
                  <Gift size={28} className="text-white" />
                </motion.div>
                <h2 className="text-lg font-bold text-white">Daily Rewards</h2>
                <StreakDisplay streak={streak} />
              </div>
            </div>

            {/* VIP multiplier */}
            {vipMultiplier > 1 && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-5 mb-3 px-3 py-2 rounded-xl bg-purple-900/30 border border-purple-500/20 flex items-center justify-center gap-2"
              >
                <Crown size={14} className="text-purple-400" />
                <span className="text-xs font-bold text-purple-300">VIP Bonus: {vipMultiplier}x multiplier active</span>
              </motion.div>
            )}

            {/* Calendar grid */}
            <div className="px-5 mb-4">
              <div className="grid grid-cols-7 gap-1.5">
                {rewards.map((reward, i) => (
                  <DayCard
                    key={reward.day}
                    reward={hasClaimed && reward.isToday ? { ...reward, isClaimed: true } : reward}
                    vipMultiplier={vipMultiplier}
                    index={i}
                  />
                ))}
              </div>
            </div>

            {/* Day 7 Mega Reward highlight */}
            <div className="mx-5 mb-4 p-3 rounded-xl bg-gradient-to-r from-yellow-900/20 to-amber-900/20 border border-yellow-500/15 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-md">
                <Crown size={18} className="text-white" />
              </div>
              <div className="flex-1">
                <span className="text-xs text-yellow-500 font-bold">Day 7 Mega Reward</span>
                <p className="text-sm font-bold text-white">{formatChips(Math.floor(5000 * vipMultiplier))} Chips</p>
              </div>
              <Sparkles size={16} className="text-yellow-500/50" />
            </div>

            {/* Claim button or countdown */}
            <div className="px-5 pb-6">
              {!hasClaimed ? (
                <PressableButton
                  variant="primary"
                  onClick={handleClaim}
                  className="w-full py-3.5 rounded-2xl text-base flex items-center justify-center gap-2"
                >
                  <Gift size={18} />
                  Claim <AnimatedChipCount value={todayChips} /> Chips
                </PressableButton>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <div className="mx-auto mb-2">
                    <SuccessCheckmark isVisible={hasClaimed} size={48} />
                  </div>
                  <p className="text-sm text-green-400 font-bold mb-1">Claimed!</p>
                  <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
                    <Clock size={12} />
                    <span>Come back in <span className="font-mono font-bold text-white">{countdown}</span></span>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
