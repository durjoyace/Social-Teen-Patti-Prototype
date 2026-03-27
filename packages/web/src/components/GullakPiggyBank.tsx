import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion';
import {
  PiggyBank,
  Sparkles,
  Crown,
  TrendingUp,
  Hammer,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { formatChips } from '../game/gameEngine';

// --- Types ---

type VipTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

interface GullakPiggyBankProps {
  currentAmount?: number;
  vipTier?: VipTier;
  onBreak: (amount: number) => void;
  className?: string;
}

// --- Data ---

const VIP_CAPS: Record<VipTier, number> = {
  bronze: 10000,
  silver: 50000,
  gold: 500000,
  platinum: 5000000,
  diamond: 10000000, // 1 Cr
};

const VIP_LABELS: Record<VipTier, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
  diamond: 'Diamond',
};

const VIP_COLORS: Record<VipTier, { text: string; border: string; bg: string; glow: string }> = {
  bronze: { text: 'text-orange-400', border: 'border-orange-500/30', bg: 'bg-orange-900/20', glow: 'shadow-orange-500/15' },
  silver: { text: 'text-gray-300', border: 'border-gray-400/30', bg: 'bg-gray-700/20', glow: 'shadow-gray-400/15' },
  gold: { text: 'text-yellow-400', border: 'border-yellow-500/40', bg: 'bg-yellow-900/20', glow: 'shadow-yellow-500/20' },
  platinum: { text: 'text-blue-300', border: 'border-blue-400/40', bg: 'bg-blue-900/20', glow: 'shadow-blue-400/20' },
  diamond: { text: 'text-cyan-300', border: 'border-cyan-400/50', bg: 'bg-cyan-900/20', glow: 'shadow-cyan-400/25' },
};

// --- Sub-components ---

function AnimatedCounter({ value, className }: { value: number; className?: string }) {
  const motionValue = useMotionValue(0);
  const displayRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 1.5,
      ease: 'easeOut',
      onUpdate: (latest) => {
        if (displayRef.current) {
          displayRef.current.textContent = formatChips(Math.round(latest));
        }
      },
    });
    return controls.stop;
  }, [value, motionValue]);

  return <span ref={displayRef} className={className}>0</span>;
}

function ProgressBar({ progress }: { progress: number; vipTier: VipTier }) {
  return (
    <div className="w-full">
      <div className="relative h-4 rounded-full bg-white/5 overflow-hidden border border-white/5">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-amber-600"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, progress * 100)}%` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
        {/* Shimmer */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
        />
        {/* Threshold markers */}
        {[0.25, 0.5, 0.75].map((mark) => (
          <div
            key={mark}
            className="absolute top-0 bottom-0 w-px bg-white/10"
            style={{ left: `${mark * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function PiggyBankVisual({ fillLevel, isShaking }: { fillLevel: number; isShaking: boolean }) {
  // Fill color transitions from empty (gray) to full (gold)
  const fillOpacity = 0.3 + fillLevel * 0.7;

  return (
    <motion.div
      className="relative w-32 h-32 flex items-center justify-center"
      animate={
        isShaking
          ? { rotate: [0, -8, 8, -6, 6, -3, 3, 0], x: [0, -4, 4, -3, 3, -1, 1, 0] }
          : { rotate: [0, 2, -2, 0] }
      }
      transition={
        isShaking
          ? { duration: 0.6, ease: 'easeInOut' }
          : { repeat: Infinity, duration: 4, ease: 'easeInOut' }
      }
    >
      {/* Background glow */}
      <motion.div
        className="absolute w-28 h-28 rounded-full bg-yellow-500/10 blur-xl"
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ repeat: Infinity, duration: 3 }}
      />

      {/* Piggy bank body */}
      <div className="relative">
        <svg width="120" height="100" viewBox="0 0 120 100">
          {/* Body */}
          <ellipse
            cx="60"
            cy="55"
            rx="45"
            ry="35"
            fill={`rgba(212, 175, 55, ${fillOpacity})`}
            stroke="#D4AF37"
            strokeWidth="2"
          />
          {/* Head */}
          <ellipse
            cx="95"
            cy="40"
            rx="18"
            ry="22"
            fill={`rgba(212, 175, 55, ${fillOpacity})`}
            stroke="#D4AF37"
            strokeWidth="2"
          />
          {/* Snout */}
          <ellipse cx="110" cy="42" rx="8" ry="6" fill={`rgba(180, 140, 20, ${fillOpacity})`} stroke="#D4AF37" strokeWidth="1.5" />
          {/* Nostrils */}
          <circle cx="108" cy="41" r="1.5" fill="#92702C" />
          <circle cx="112" cy="41" r="1.5" fill="#92702C" />
          {/* Eye */}
          <circle cx="92" cy="34" r="2.5" fill="#1F2937" />
          <circle cx="93" cy="33" r="1" fill="#F9FAFB" />
          {/* Ear */}
          <path d="M 85 20 Q 88 10 95 18" fill={`rgba(180, 140, 20, ${fillOpacity})`} stroke="#D4AF37" strokeWidth="1.5" />
          {/* Coin slot */}
          <rect x="48" y="18" width="16" height="3" rx="1.5" fill="#92702C" stroke="#D4AF37" strokeWidth="1" />
          {/* Legs */}
          <rect x="30" y="82" width="8" height="12" rx="3" fill={`rgba(180, 140, 20, ${fillOpacity})`} stroke="#D4AF37" strokeWidth="1.5" />
          <rect x="48" y="82" width="8" height="12" rx="3" fill={`rgba(180, 140, 20, ${fillOpacity})`} stroke="#D4AF37" strokeWidth="1.5" />
          <rect x="64" y="82" width="8" height="12" rx="3" fill={`rgba(180, 140, 20, ${fillOpacity})`} stroke="#D4AF37" strokeWidth="1.5" />
          <rect x="82" y="82" width="8" height="12" rx="3" fill={`rgba(180, 140, 20, ${fillOpacity})`} stroke="#D4AF37" strokeWidth="1.5" />
          {/* Tail */}
          <path d="M 15 50 Q 5 45 8 38 Q 11 31 15 35" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" />
          {/* Fill level indicator inside body */}
          <clipPath id="bodyClip">
            <ellipse cx="60" cy="55" rx="43" ry="33" />
          </clipPath>
          <rect
            x="17"
            y={88 - fillLevel * 66}
            width="86"
            height={fillLevel * 66}
            fill="rgba(255, 215, 0, 0.25)"
            clipPath="url(#bodyClip)"
          />
        </svg>

        {/* Floating coin animation */}
        {fillLevel > 0 && (
          <motion.div
            className="absolute top-2 left-1/2 -translate-x-1/2"
            animate={{ y: [0, -5, 5, 0], opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
          >
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 border border-yellow-300 flex items-center justify-center shadow-sm shadow-yellow-500/30">
              <span className="text-[6px] font-bold text-yellow-900">$</span>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function BreakAnimation({ amount, onComplete }: { amount: number; onComplete: () => void }) {
  const chips = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    x: Math.random() * 280 - 140,
    y: Math.random() * -200 - 40,
    rotate: Math.random() * 720,
    delay: Math.random() * 0.4,
    size: 8 + Math.random() * 8,
  }));

  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/60 backdrop-blur-sm rounded-3xl"
    >
      {/* Flying chips */}
      {chips.map((chip) => (
        <motion.div
          key={chip.id}
          className="absolute rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 shadow-md shadow-yellow-500/30"
          style={{ width: chip.size, height: chip.size }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
          animate={{
            x: chip.x,
            y: [0, chip.y * 0.5, chip.y * 2],
            opacity: [0, 1, 1, 0],
            scale: [0, 1.5, 1, 0],
            rotate: chip.rotate,
          }}
          transition={{ duration: 1.8, delay: chip.delay, ease: 'easeOut' }}
        />
      ))}

      {/* Result text */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.5 }}
        className="flex flex-col items-center gap-2 z-30"
      >
        <Sparkles size={32} className="text-yellow-400" />
        <span className="text-2xl font-bold text-yellow-400">{formatChips(amount)}</span>
        <span className="text-sm text-gray-300">Chips Collected!</span>
      </motion.div>
    </motion.div>
  );
}

// --- Main Component ---

export function GullakPiggyBank({
  currentAmount = 7500,
  vipTier = 'bronze',
  onBreak,
  className,
}: GullakPiggyBankProps) {
  const cap = VIP_CAPS[vipTier];
  const progress = Math.min(1, currentAmount / cap);
  const canBreak = currentAmount >= cap;
  const colors = VIP_COLORS[vipTier];

  const [showBreakAnimation, setShowBreakAnimation] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const handleBreak = () => {
    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);
      setShowBreakAnimation(true);
    }, 600);
  };

  const handleBreakComplete = () => {
    setShowBreakAnimation(false);
    onBreak(currentAmount);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        'relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl border border-white/10 overflow-hidden',
        className,
      )}
    >
      {/* Break animation overlay */}
      <AnimatePresence>
        {showBreakAnimation && (
          <BreakAnimation amount={currentAmount} onComplete={handleBreakComplete} />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="px-5 pt-5 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PiggyBank size={18} className="text-yellow-500" />
            <h2 className="text-base font-bold text-white">Gullak</h2>
          </div>
          <div className={cn('flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold', colors.bg, colors.border, colors.text, 'border')}>
            <Crown size={10} />
            {VIP_LABELS[vipTier]}
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">Chips saved from every pot you play</p>
      </div>

      {/* Piggy bank visual */}
      <div className="flex justify-center py-2">
        <PiggyBankVisual fillLevel={progress} isShaking={isShaking} />
      </div>

      {/* Amount display */}
      <div className="px-5 mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <TrendingUp size={14} className="text-yellow-500" />
            <span className="text-xs text-gray-400">Savings</span>
          </div>
          <div className="flex items-baseline gap-1">
            <AnimatedCounter value={currentAmount} className="text-xl font-bold text-yellow-400" />
            <span className="text-xs text-gray-600">/ {formatChips(cap)}</span>
          </div>
        </div>

        {/* Progress bar */}
        <ProgressBar progress={progress} vipTier={vipTier} />

        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[10px] text-gray-600">{Math.round(progress * 100)}% full</span>
          <span className="text-[10px] text-gray-600">
            {formatChips(Math.max(0, cap - currentAmount))} to go
          </span>
        </div>
      </div>

      {/* VIP cap info */}
      <div className="mx-5 mb-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
        <div className="flex items-center gap-2">
          <Crown size={12} className={colors.text} />
          <span className="text-[11px] text-gray-400">
            {VIP_LABELS[vipTier]} cap: <span className="font-bold text-white">{formatChips(cap)}</span>
          </span>
        </div>
        {vipTier !== 'diamond' && (
          <span className="text-[10px] text-gray-600 mt-1 block">
            Upgrade VIP to increase your Gullak cap
          </span>
        )}
      </div>

      {/* Break button */}
      <div className="px-5 pb-5">
        <motion.button
          whileHover={canBreak ? { scale: 1.02 } : {}}
          whileTap={canBreak ? { scale: 0.95 } : {}}
          onClick={handleBreak}
          disabled={!canBreak}
          className={cn(
            'w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all',
            canBreak
              ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-black shadow-lg shadow-yellow-500/20'
              : 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/5',
          )}
        >
          <Hammer size={16} />
          {canBreak
            ? `Break Gullak (${formatChips(currentAmount)})`
            : `Fill to ${formatChips(cap)} to break`}
        </motion.button>
      </div>
    </motion.div>
  );
}
