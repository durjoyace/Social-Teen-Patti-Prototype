import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Coins,
  Crown,
  Eye,
  Sparkles,
  X,
  Bell,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { AnimatedChipCount, PressableButton, SuccessCheckmark } from './PolishTouches';

// --- Types ---

interface HourlyBonusProps {
  isOpen: boolean;
  onClose: () => void;
  onClaim: (amount: number, doubled: boolean) => void;
  claimsToday?: number;
  nextBonusAt?: Date;
  vipMultiplier?: number;
  className?: string;
}

// --- Data ---

const ESCALATING_AMOUNTS = [100, 200, 500, 1000];
const BONUS_CYCLE_HOURS = 4;

// --- Helpers ---

function getTimeRemaining(targetDate: Date): { hours: number; minutes: number; seconds: number; total: number } {
  const now = Date.now();
  const total = Math.max(0, targetDate.getTime() - now);
  const hours = Math.floor(total / 3600000);
  const minutes = Math.floor((total % 3600000) / 60000);
  const seconds = Math.floor((total % 60000) / 1000);
  return { hours, minutes, seconds, total };
}

function formatTime(n: number): string {
  return n.toString().padStart(2, '0');
}

// --- Sub-components ---

function CoinRain({ isActive }: { isActive: boolean }) {
  if (!isActive) return null;

  const coins = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 1 + Math.random() * 0.5,
    size: 12 + Math.random() * 8,
    rotate: Math.random() * 360,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20 rounded-3xl">
      {coins.map((coin) => (
        <motion.div
          key={coin.id}
          className="absolute"
          style={{ left: `${coin.x}%` }}
          initial={{ y: -20, opacity: 0, rotate: 0 }}
          animate={{
            y: ['0%', '120%'],
            opacity: [0, 1, 1, 0],
            rotate: coin.rotate,
          }}
          transition={{
            duration: coin.duration,
            delay: coin.delay,
            ease: 'easeIn',
          }}
        >
          <div
            className="rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 shadow-md shadow-yellow-500/30 flex items-center justify-center"
            style={{ width: coin.size, height: coin.size }}
          >
            <span className="text-[6px] font-bold text-yellow-900">$</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function CountdownTimer({ targetDate }: { targetDate: Date }) {
  const [time, setTime] = useState(getTimeRemaining(targetDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeRemaining(targetDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const isReady = time.total === 0;

  if (isReady) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-1.5">
        <Clock size={14} className="text-gray-500" />
        <span className="text-xs text-gray-500">Next bonus in</span>
      </div>
      <div className="flex items-center gap-1">
        {[
          { value: formatTime(time.hours), label: 'h' },
          { value: formatTime(time.minutes), label: 'm' },
          { value: formatTime(time.seconds), label: 's' },
        ].map((unit, i) => (
          <div key={i} className="flex items-center gap-0.5">
            {i > 0 && <span className="text-gray-600 font-bold mx-0.5">:</span>}
            <div className="bg-white/5 rounded-lg px-2.5 py-1.5 border border-white/5">
              <span className="font-mono text-lg font-bold text-white">{unit.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BonusEscalation({ claimsToday, vipMultiplier }: { claimsToday: number; vipMultiplier: number }) {
  return (
    <div className="flex items-center gap-1.5 justify-center">
      {ESCALATING_AMOUNTS.map((amount, i) => {
        const isClaimed = i < claimsToday;
        const isCurrent = i === claimsToday;
        const actualAmount = Math.floor(amount * vipMultiplier);

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08 }}
            className={cn(
              'flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-xl border transition-all',
              isClaimed && 'bg-green-900/20 border-green-500/20',
              isCurrent && 'bg-yellow-900/30 border-yellow-500/40 shadow-md shadow-yellow-500/10',
              !isClaimed && !isCurrent && 'bg-white/[0.02] border-white/5 opacity-40',
            )}
          >
            <span className={cn(
              'text-[9px] font-bold uppercase',
              isClaimed ? 'text-green-400' : isCurrent ? 'text-yellow-400' : 'text-gray-600',
            )}>
              #{i + 1}
            </span>
            <Coins size={14} className={cn(
              isClaimed ? 'text-green-400' : isCurrent ? 'text-yellow-400' : 'text-gray-600',
            )} />
            <span className={cn(
              'text-xs font-bold',
              isClaimed ? 'text-green-400' : isCurrent ? 'text-yellow-400' : 'text-gray-600',
            )}>
              <AnimatedChipCount value={actualAmount} />
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

// --- Toast Notification ---

export function HourlyBonusToast({
  isVisible,
  onTap,
  amount,
}: {
  isVisible: boolean;
  onTap: () => void;
  amount: number;
}) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ y: -80, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -80, opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          onClick={onTap}
          className="fixed top-4 right-4 z-40 flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-yellow-900/90 to-amber-900/90 border border-yellow-500/30 shadow-xl shadow-yellow-500/10 backdrop-blur-md"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <Bell size={18} className="text-yellow-400" />
          </motion.div>
          <div className="flex flex-col items-start">
            <span className="text-xs font-bold text-yellow-400">Bonus Ready!</span>
            <span className="text-[10px] text-gray-400">Claim <AnimatedChipCount value={amount} className="text-[10px] text-gray-400" /> chips</span>
          </div>
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-2 h-2 rounded-full bg-yellow-500"
          />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

// --- Main Component ---

export function HourlyBonus({
  isOpen,
  onClose,
  onClaim,
  claimsToday = 1,
  nextBonusAt,
  vipMultiplier = 1.0,
}: HourlyBonusProps) {
  const [hasClaimed, setHasClaimed] = useState(false);
  const [showCoinRain, setShowCoinRain] = useState(false);
  const [doubled, setDoubled] = useState(false);

  const claimIndex = Math.min(claimsToday, ESCALATING_AMOUNTS.length - 1);
  const baseAmount = ESCALATING_AMOUNTS[claimIndex];
  const actualAmount = Math.floor(baseAmount * vipMultiplier);
  const doubledAmount = actualAmount * 2;

  const defaultNext = new Date(Date.now() + BONUS_CYCLE_HOURS * 3600000);
  const bonusTarget = nextBonusAt || defaultNext;
  const isReady = Date.now() >= bonusTarget.getTime();

  const handleClaim = useCallback(
    (watchAd: boolean) => {
      if (hasClaimed) return;
      setDoubled(watchAd);
      setHasClaimed(true);
      setShowCoinRain(true);
      const finalAmount = watchAd ? doubledAmount : actualAmount;
      onClaim(finalAmount, watchAd);
      setTimeout(() => setShowCoinRain(false), 2000);
    },
    [hasClaimed, actualAmount, doubledAmount, onClaim],
  );

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
            {/* Coin rain */}
            <CoinRain isActive={showCoinRain} />

            {/* Close */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors z-10"
            >
              <X size={16} />
            </motion.button>

            {/* Header */}
            <div className="px-5 pt-5 pb-3 flex flex-col items-center gap-2">
              <motion.div
                initial={{ rotate: -15, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg shadow-yellow-500/30"
              >
                <Clock size={28} className="text-white" />
              </motion.div>
              <h2 className="text-lg font-bold text-white">Hourly Bonus</h2>
              <p className="text-xs text-gray-500">
                Claim every {BONUS_CYCLE_HOURS} hours. Amounts escalate daily!
              </p>
            </div>

            {/* VIP multiplier */}
            {vipMultiplier > 1 && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-5 mb-3 px-3 py-2 rounded-xl bg-purple-900/30 border border-purple-500/20 flex items-center justify-center gap-2"
              >
                <Crown size={14} className="text-purple-400" />
                <span className="text-xs font-bold text-purple-300">VIP Bonus: {vipMultiplier}x multiplier</span>
              </motion.div>
            )}

            {/* Escalation display */}
            <div className="px-5 mb-4">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-2 block text-center">
                Today's Bonus Schedule
              </span>
              <BonusEscalation claimsToday={claimsToday} vipMultiplier={vipMultiplier} />
              <p className="text-[10px] text-gray-600 text-center mt-2">
                Resets daily at midnight
              </p>
            </div>

            {/* Main content area */}
            <div className="px-5 pb-5">
              {isReady && !hasClaimed ? (
                <>
                  {/* Current bonus display */}
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-yellow-900/30 to-amber-900/20 border border-yellow-500/20 text-center"
                  >
                    <span className="text-xs text-gray-400">Claim now</span>
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="flex items-center justify-center gap-2 mt-1"
                    >
                      <Coins size={24} className="text-yellow-400" />
                      <AnimatedChipCount value={actualAmount} className="text-3xl font-bold text-yellow-400" />
                    </motion.div>
                    <span className="text-[10px] text-gray-500 mt-1 block">Chips</span>
                  </motion.div>

                  {/* Claim buttons */}
                  <div className="space-y-2">
                    <PressableButton
                      variant="primary"
                      onClick={() => handleClaim(false)}
                      className="w-full py-3.5 rounded-2xl text-base flex items-center justify-center gap-2"
                    >
                      <Coins size={18} />
                      Claim <AnimatedChipCount value={actualAmount} />
                    </PressableButton>

                    <PressableButton
                      variant="secondary"
                      onClick={() => handleClaim(true)}
                      className="w-full py-3 rounded-2xl text-sm flex items-center justify-center gap-2"
                    >
                      <Eye size={16} />
                      Watch Ad for 2x (<AnimatedChipCount value={doubledAmount} />)
                    </PressableButton>
                  </div>
                </>
              ) : hasClaimed ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-4"
                >
                  <div className="mx-auto mb-3">
                    <SuccessCheckmark isVisible={hasClaimed} size={56} />
                  </div>
                  <p className="text-base font-bold text-green-400 mb-1">
                    <AnimatedChipCount value={doubled ? doubledAmount : actualAmount} /> Chips Claimed!
                  </p>
                  {doubled && (
                    <span className="text-xs text-yellow-400 font-bold">2x Bonus Applied!</span>
                  )}
                  <div className="mt-4">
                    <CountdownTimer targetDate={new Date(Date.now() + BONUS_CYCLE_HOURS * 3600000)} />
                  </div>
                </motion.div>
              ) : (
                <div className="py-4">
                  <CountdownTimer targetDate={bonusTarget} />
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
