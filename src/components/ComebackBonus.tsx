import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Gift,
  Sparkles,
  Trophy,
  Gamepad2,
  Target,
  Check,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { formatChips } from '../game/gameEngine';

// --- Types ---

interface ComebackChallenge {
  id: string;
  description: string;
  target: number;
  progress: number;
  reward: number;
  icon: 'play' | 'win' | 'target';
}

interface ComebackBonusProps {
  isOpen: boolean;
  onClose: () => void;
  onClaim: (amount: number) => void;
  daysAbsent?: number;
  playerName?: string;
  challenges?: ComebackChallenge[];
  className?: string;
}

// --- Data ---

const ABSENCE_TIERS: { minDays: number; bonus: number; label: string }[] = [
  { minDays: 1, bonus: 1000, label: '1 Day' },
  { minDays: 3, bonus: 5000, label: '3 Days' },
  { minDays: 7, bonus: 20000, label: '1 Week' },
  { minDays: 30, bonus: 100000, label: '1 Month' },
];

const DEFAULT_CHALLENGES: ComebackChallenge[] = [
  { id: 'c1', description: 'Play 3 games', target: 3, progress: 0, reward: 500, icon: 'play' },
  { id: 'c2', description: 'Win 1 game', target: 1, progress: 0, reward: 1000, icon: 'win' },
  { id: 'c3', description: 'Play a Blind round', target: 1, progress: 0, reward: 300, icon: 'target' },
];

const CHALLENGE_ICONS = {
  play: Gamepad2,
  win: Trophy,
  target: Target,
};

// --- Helpers ---

function getBonusForAbsence(days: number): { bonus: number; label: string } {
  // Find the highest tier the player qualifies for
  let result = ABSENCE_TIERS[0];
  for (const tier of ABSENCE_TIERS) {
    if (days >= tier.minDays) {
      result = tier;
    }
  }
  return result;
}

// --- Sub-components ---

function CelebrationOverlay() {
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 300 - 150,
    y: Math.random() * -300 - 50,
    rotate: Math.random() * 720,
    delay: Math.random() * 0.4,
    color: ['#D4AF37', '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FF69B4', '#98D8C8'][i % 7],
    size: 4 + Math.random() * 6,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20 rounded-3xl">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute left-1/2 top-1/2 rounded-sm"
          style={{ backgroundColor: p.color, width: p.size, height: p.size }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: p.x,
            y: [0, p.y * 0.4, p.y],
            opacity: [1, 1, 0],
            rotate: p.rotate,
            scale: [0, 1.5, 0],
          }}
          transition={{ duration: 2, delay: p.delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

function AbsenceTierDisplay({ daysAbsent }: { daysAbsent: number }) {
  return (
    <div className="flex items-center gap-1 justify-center">
      {ABSENCE_TIERS.map((tier, i) => {
        const isActive = daysAbsent >= tier.minDays;
        const isCurrent = daysAbsent >= tier.minDays &&
          (i === ABSENCE_TIERS.length - 1 || daysAbsent < ABSENCE_TIERS[i + 1].minDays);

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              'flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg border transition-all',
              isCurrent && 'bg-yellow-900/30 border-yellow-500/40 shadow-md shadow-yellow-500/10',
              isActive && !isCurrent && 'bg-green-900/20 border-green-500/20',
              !isActive && 'bg-white/[0.02] border-white/5 opacity-30',
            )}
          >
            <span className={cn(
              'text-[9px] font-bold',
              isCurrent ? 'text-yellow-400' : isActive ? 'text-green-400' : 'text-gray-600',
            )}>
              {tier.label}
            </span>
            <span className={cn(
              'text-[10px] font-bold',
              isCurrent ? 'text-yellow-400' : isActive ? 'text-green-400' : 'text-gray-600',
            )}>
              {formatChips(tier.bonus)}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

function ChallengeCard({ challenge }: { challenge: ComebackChallenge }) {
  const IconComponent = CHALLENGE_ICONS[challenge.icon];
  const isComplete = challenge.progress >= challenge.target;
  const progressPct = Math.min(1, challenge.progress / challenge.target);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl border transition-all',
        isComplete
          ? 'bg-green-900/20 border-green-500/20'
          : 'bg-white/[0.03] border-white/5',
      )}
    >
      {/* Icon */}
      <div className={cn(
        'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
        isComplete ? 'bg-green-500/20' : 'bg-white/5',
      )}>
        {isComplete ? (
          <Check size={16} className="text-green-400" />
        ) : (
          <IconComponent size={16} className="text-gray-400" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className={cn(
            'text-xs font-medium',
            isComplete ? 'text-green-400' : 'text-gray-300',
          )}>
            {challenge.description}
          </span>
          <span className="text-[10px] font-bold text-yellow-400 flex-shrink-0 ml-2">
            +{formatChips(challenge.reward)}
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className={cn(
              'h-full rounded-full',
              isComplete ? 'bg-green-500' : 'bg-yellow-500',
            )}
            initial={{ width: 0 }}
            animate={{ width: `${progressPct * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <span className="text-[9px] text-gray-600 mt-0.5 block">
          {challenge.progress}/{challenge.target}
        </span>
      </div>
    </motion.div>
  );
}

// --- Main Component ---

export function ComebackBonus({
  isOpen,
  onClose,
  onClaim,
  daysAbsent = 3,
  playerName = 'Player',
  challenges = DEFAULT_CHALLENGES,
}: ComebackBonusProps) {
  const [hasClaimed, setHasClaimed] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const { bonus, label } = getBonusForAbsence(daysAbsent);

  const handleClaim = useCallback(() => {
    if (hasClaimed) return;
    setHasClaimed(true);
    setShowCelebration(true);
    onClaim(bonus);
    setTimeout(() => setShowCelebration(false), 2500);
  }, [hasClaimed, bonus, onClaim]);

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
            className="absolute inset-0 bg-black/85 backdrop-blur-sm"
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
            {/* Celebration particles */}
            {showCelebration && <CelebrationOverlay />}

            {/* Header with welcome animation */}
            <div className="relative px-5 pt-6 pb-4 text-center overflow-hidden">
              {/* Background glow */}
              <motion.div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full bg-yellow-500/10 blur-3xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ repeat: Infinity, duration: 4 }}
              />

              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                className="relative inline-block mb-3"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-xl shadow-pink-500/30">
                  <Heart size={32} className="text-white" fill="white" />
                </div>
                {/* Pulsing ring */}
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-pink-400"
                  animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl font-bold text-white mb-1"
              >
                We Missed You!
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-gray-400"
              >
                Welcome back, <span className="text-yellow-400 font-bold">{playerName}</span>
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-xs text-gray-500 mt-1"
              >
                You've been away for {daysAbsent} day{daysAbsent !== 1 ? 's' : ''}
              </motion.p>
            </div>

            {/* Absence tier display */}
            <div className="px-5 mb-4">
              <AbsenceTierDisplay daysAbsent={daysAbsent} />
            </div>

            {/* Bonus amount */}
            {!hasClaimed && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mx-5 mb-4 p-4 rounded-2xl bg-gradient-to-r from-yellow-900/30 to-amber-900/20 border border-yellow-500/20 text-center"
              >
                <span className="text-xs text-gray-400">Your comeback bonus</span>
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="flex items-center justify-center gap-2 mt-1"
                >
                  <Gift size={24} className="text-yellow-400" />
                  <span className="text-3xl font-bold text-yellow-400">{formatChips(bonus)}</span>
                </motion.div>
                <span className="text-[10px] text-gray-500 mt-1 block">Chips (away {label})</span>
              </motion.div>
            )}

            {/* Claimed state */}
            {hasClaimed && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-5 mb-4 text-center py-3"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  className="w-12 h-12 mx-auto mb-2 rounded-full bg-green-500/20 flex items-center justify-center"
                >
                  <Sparkles size={24} className="text-green-400" />
                </motion.div>
                <p className="text-base font-bold text-green-400">{formatChips(bonus)} Chips Claimed!</p>
              </motion.div>
            )}

            {/* Comeback challenges */}
            <div className="px-5 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Comeback Challenges</span>
                <span className="text-[10px] text-gray-600">Extra rewards</span>
              </div>
              <div className="space-y-2">
                {challenges.map((challenge, i) => (
                  <motion.div
                    key={challenge.id}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                  >
                    <ChallengeCard challenge={challenge} />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Action button */}
            <div className="px-5 pb-5">
              {!hasClaimed ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClaim}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20"
                >
                  <Gift size={18} />
                  Claim {formatChips(bonus)} Chips
                </motion.button>
              ) : (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20"
                >
                  Let's Play!
                  <ChevronRight size={18} />
                </motion.button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
