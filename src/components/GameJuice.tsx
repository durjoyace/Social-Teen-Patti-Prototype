import { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '../utils/cn';
import type { ActionType } from '../types';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Deterministic pseudo-random from seed (fast, non-crypto) */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Format a number with K/M suffix */
function shortNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

// ---------------------------------------------------------------------------
// 1. ChipBurst
// ---------------------------------------------------------------------------

interface ChipBurstProps {
  /** Pixel coordinates of the source (button) */
  from: { x: number; y: number };
  /** Pixel coordinates of the destination (pot) */
  to: { x: number; y: number };
  /** Chip amount — determines particle count and palette richness */
  amount: number;
  /** Called when the last particle finishes */
  onComplete?: () => void;
  /** Override particle count (default 8-12 based on amount) */
  particleCount?: number;
  /** Override duration in seconds (default 0.6) */
  duration?: number;
}

const CHIP_COLORS = [
  '#FFD700', '#FF6B35', '#E74C3C', '#3498DB',
  '#2ECC71', '#9B59B6', '#F39C12', '#1ABC9C',
  '#E91E63', '#00BCD4', '#FF5722', '#8BC34A',
];

export function ChipBurst({
  from,
  to,
  amount,
  onComplete,
  particleCount,
  duration = 0.6,
}: ChipBurstProps) {
  const reduced = useReducedMotion();
  const count = particleCount ?? Math.min(Math.max(Math.ceil(amount / 200), 8), 12);
  const rand = useMemo(() => seededRandom(amount + from.x + from.y), [amount, from.x, from.y]);

  const particles = useMemo(() => {
    const r = rand;
    return Array.from({ length: count }, (_, i) => {
      const angle = (Math.PI * 2 * i) / count + (r() - 0.5) * 0.6;
      const arcHeight = 60 + r() * 80; // how high the arc goes
      const spreadX = Math.cos(angle) * (30 + r() * 40);
      const color = CHIP_COLORS[Math.floor(r() * CHIP_COLORS.length)];
      const delay = i * 0.035;
      const size = 8 + r() * 6; // 8-14px
      return { id: i, angle, arcHeight, spreadX, color, delay, size };
    });
  }, [count, rand]);

  // Fire onComplete immediately when reduced motion is preferred
  useEffect(() => {
    if (reduced) onComplete?.();
  }, [reduced, onComplete]);

  if (reduced) return null;

  const dx = to.x - from.x;
  const dy = to.y - from.y;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map((p) => {
        const midX = from.x + dx * 0.5 + p.spreadX;
        const midY = from.y + dy * 0.5 - p.arcHeight;

        return (
          <motion.div
            key={p.id}
            initial={{
              x: from.x - p.size / 2,
              y: from.y - p.size / 2,
              scale: 0.3,
              opacity: 1,
            }}
            animate={{
              x: [from.x - p.size / 2, midX - p.size / 2, to.x - p.size / 2],
              y: [from.y - p.size / 2, midY - p.size / 2, to.y - p.size / 2],
              scale: [0.3, 1.2, 0.6],
              opacity: [1, 1, 0],
            }}
            transition={{
              duration,
              delay: p.delay,
              ease: 'easeInOut',
              times: [0, 0.5, 1],
            }}
            onAnimationComplete={
              p.id === particles.length - 1 ? onComplete : undefined
            }
            className="absolute"
          >
            <div
              className="rounded-full shadow-lg"
              style={{
                width: p.size,
                height: p.size,
                background: `radial-gradient(circle at 35% 35%, ${p.color}ee, ${p.color}88)`,
                boxShadow: `0 0 6px ${p.color}66`,
                border: `1.5px dashed ${p.color}44`,
              }}
            />
          </motion.div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. NumberPop
// ---------------------------------------------------------------------------

interface NumberPopProps {
  /** Current display value */
  value: number;
  /** Previous value (to determine gain/loss) */
  previousValue: number;
  /** Custom number formatter */
  format?: (n: number) => string;
  /** Additional classes */
  className?: string;
  /** Duration override in seconds */
  duration?: number;
}

export function NumberPop({
  value,
  previousValue,
  format = shortNumber,
  className,
  duration = 0.4,
}: NumberPopProps) {
  const reduced = useReducedMotion();
  const [floatingText, setFloatingText] = useState<{
    key: number;
    delta: number;
  } | null>(null);
  const prevRef = useRef(previousValue);

  useEffect(() => {
    if (value !== prevRef.current) {
      const delta = value - prevRef.current;
      setFloatingText({ key: Date.now(), delta });
      prevRef.current = value;
      const t = setTimeout(() => setFloatingText(null), 1200);
      return () => clearTimeout(t);
    }
  }, [value]);

  const isGain = value > previousValue;
  const isLoss = value < previousValue;
  const changed = value !== previousValue;

  return (
    <span className={cn('relative inline-flex items-center', className)}>
      <motion.span
        key={value}
        initial={
          reduced || !changed
            ? false
            : { scale: 1.2, color: isGain ? '#22c55e' : isLoss ? '#ef4444' : undefined }
        }
        animate={{ scale: 1, color: 'inherit' }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 15,
          duration,
        }}
      >
        {format(value)}
      </motion.span>

      {/* Floating delta text */}
      <AnimatePresence>
        {floatingText && !reduced && (
          <motion.span
            key={floatingText.key}
            initial={{ opacity: 1, y: 0, x: 0, scale: 0.8 }}
            animate={{ opacity: 0, y: -32, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={cn(
              'absolute left-1/2 -translate-x-1/2 -top-1 text-xs font-bold whitespace-nowrap pointer-events-none',
              floatingText.delta > 0 ? 'text-green-400' : 'text-red-400'
            )}
          >
            {floatingText.delta > 0 ? '+' : ''}
            {format(floatingText.delta)}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

// ---------------------------------------------------------------------------
// 3. ScreenShake
// ---------------------------------------------------------------------------

interface ScreenShakeProps {
  /** Shake intensity preset */
  intensity: 'light' | 'medium' | 'heavy';
  /** Duration in ms (default derived from intensity) */
  duration?: number;
  /** Toggles the shake — flip this boolean to re-trigger */
  trigger: boolean;
  /** The content to wrap */
  children: React.ReactNode;
  /** Additional classes on the wrapper */
  className?: string;
}

const SHAKE_CONFIG: Record<
  ScreenShakeProps['intensity'],
  { amplitude: number; defaultDuration: number; frequency: number }
> = {
  light: { amplitude: 2, defaultDuration: 300, frequency: 4 },
  medium: { amplitude: 4, defaultDuration: 400, frequency: 5 },
  heavy: { amplitude: 8, defaultDuration: 600, frequency: 6 },
};

export function ScreenShake({
  intensity,
  duration,
  trigger,
  children,
  className,
}: ScreenShakeProps) {
  const reduced = useReducedMotion();
  const config = SHAKE_CONFIG[intensity];
  const dur = duration ?? config.defaultDuration;

  const keyframes = useMemo(() => {
    if (reduced) return { x: 0, y: 0, rotate: 0 };
    const steps = config.frequency * 2;
    const xs: number[] = [];
    const ys: number[] = [];
    const rs: number[] = [];
    for (let i = 0; i <= steps; i++) {
      const decay = 1 - i / steps;
      const a = config.amplitude * decay;
      xs.push(i === steps ? 0 : (Math.random() - 0.5) * 2 * a);
      ys.push(i === steps ? 0 : (Math.random() - 0.5) * 2 * a);
      rs.push(i === steps ? 0 : (Math.random() - 0.5) * a * 0.3);
    }
    return { x: xs, y: ys, rotate: rs };
  }, [trigger, reduced, config.amplitude, config.frequency]);

  return (
    <motion.div
      key={String(trigger)}
      animate={keyframes}
      transition={{ duration: dur / 1000, ease: 'easeOut' }}
      className={cn('will-change-transform', className)}
      style={{ transform: 'translateZ(0)' }}
    >
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// 4. StreakFire
// ---------------------------------------------------------------------------

interface StreakFireProps {
  /** Current winning streak */
  streak: number;
  /** Additional classes */
  className?: string;
  /** Override number of flame particles */
  particleCount?: number;
}

export function StreakFire({ streak, className, particleCount }: StreakFireProps) {
  const reduced = useReducedMotion();

  if (streak <= 0 || reduced) return null;

  const tier: 'small' | 'medium' | 'large' =
    streak >= 8 ? 'large' : streak >= 4 ? 'medium' : 'small';

  const count =
    particleCount ?? (tier === 'large' ? 14 : tier === 'medium' ? 9 : 5);

  const particles = useMemo(() => {
    const r = seededRandom(streak * 137);
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: (r() - 0.5) * 100, // percent offset
      delay: r() * 1.2,
      duration: 0.8 + r() * 0.6,
      size: 4 + r() * (tier === 'large' ? 10 : tier === 'medium' ? 7 : 4),
      opacity: 0.5 + r() * 0.5,
    }));
  }, [streak, count, tier]);

  const baseColor =
    tier === 'large'
      ? 'from-red-500 via-orange-400 to-yellow-300'
      : tier === 'medium'
        ? 'from-orange-500 via-yellow-400 to-yellow-200'
        : 'from-yellow-500 via-yellow-300 to-yellow-100';

  return (
    <div
      className={cn(
        'absolute inset-0 pointer-events-none overflow-hidden',
        className
      )}
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className={cn(
            'absolute bottom-0 rounded-full bg-gradient-to-t blur-[1px]',
            baseColor
          )}
          style={{
            left: `calc(50% + ${p.x}%)`,
            width: p.size,
            height: p.size * 1.6,
          }}
          animate={{
            y: [0, -(20 + p.size * 3)],
            opacity: [p.opacity, 0],
            scale: [1, 0.3],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      ))}

      {/* Glow under the badge */}
      <motion.div
        className={cn(
          'absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full blur-lg',
          tier === 'large'
            ? 'w-16 h-6 bg-orange-500/60'
            : tier === 'medium'
              ? 'w-12 h-4 bg-orange-400/40'
              : 'w-8 h-3 bg-yellow-400/30'
        )}
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 1.2, repeat: Infinity }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5. PotGlow
// ---------------------------------------------------------------------------

interface PotGlowProps {
  /** Current pot amount */
  amount: number;
  /** Additional classes */
  className?: string;
  /** Children to render inside (pot label, etc.) */
  children?: React.ReactNode;
}

export function PotGlow({ amount, className, children }: PotGlowProps) {
  const reduced = useReducedMotion();

  const tier: 'none' | 'shimmer' | 'glow' | 'aura' =
    amount >= 10_000
      ? 'aura'
      : amount >= 2_000
        ? 'glow'
        : amount >= 500
          ? 'shimmer'
          : 'none';

  // Sparkle particles for aura tier (must be before any early return)
  const sparkles = useMemo(() => {
    if (tier !== 'aura') return [];
    const r = seededRandom(amount);
    return Array.from({ length: 10 }, (_, i) => ({
      id: i,
      angle: r() * 360,
      distance: 30 + r() * 30,
      delay: r() * 2,
      size: 2 + r() * 3,
    }));
  }, [tier, amount]);

  if (tier === 'none' || reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn('relative', className)}>
      {/* Shimmer sweep */}
      {tier === 'shimmer' && (
        <motion.div
          className="absolute inset-0 rounded-inherit overflow-hidden pointer-events-none"
          style={{ borderRadius: 'inherit' }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/15 to-transparent"
            animate={{ x: ['-150%', '150%'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>
      )}

      {/* Glow ring */}
      {(tier === 'glow' || tier === 'aura') && (
        <motion.div
          className="absolute -inset-2 rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(255,215,0,0.25) 0%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.12, 1],
            opacity: [0.5, 0.9, 0.5],
          }}
          transition={{
            duration: tier === 'aura' ? 1.2 : 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Aura pulsing outer ring */}
      {tier === 'aura' && (
        <>
          <motion.div
            className="absolute -inset-4 rounded-full pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(255,180,0,0.15) 0%, transparent 70%)',
            }}
            animate={{
              scale: [1, 1.25, 1],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.3,
            }}
          />

          {/* Sparkle particles */}
          {sparkles.map((s) => (
            <motion.div
              key={s.id}
              className="absolute pointer-events-none"
              style={{
                left: '50%',
                top: '50%',
                width: s.size,
                height: s.size,
              }}
              animate={{
                x: [
                  Math.cos((s.angle * Math.PI) / 180) * s.distance * 0.6,
                  Math.cos((s.angle * Math.PI) / 180) * s.distance,
                ],
                y: [
                  Math.sin((s.angle * Math.PI) / 180) * s.distance * 0.6,
                  Math.sin((s.angle * Math.PI) / 180) * s.distance,
                ],
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 1.4,
                delay: s.delay,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            >
              <div className="w-full h-full rounded-full bg-yellow-300 shadow-sm shadow-yellow-400/80" />
            </motion.div>
          ))}
        </>
      )}

      {/* Actual content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 6. ActionFeedback
// ---------------------------------------------------------------------------

interface ActionFeedbackProps {
  /** The action that was just taken */
  action: ActionType | null;
  /** When true, the effect plays */
  isActive: boolean;
  /** Duration override in ms */
  duration?: number;
}

const ACTION_STYLES: Partial<
  Record<
    ActionType,
    {
      color: string;
      type: 'edge-flash' | 'ripple' | 'shockwave' | 'sparkle-flash' | 'pulse';
    }
  >
> = {
  pack: { color: 'rgba(239,68,68,0.35)', type: 'edge-flash' },
  chaal: { color: 'rgba(34,197,94,0.30)', type: 'ripple' },
  raise: { color: 'rgba(234,179,8,0.35)', type: 'shockwave' },
  show: { color: 'rgba(168,85,247,0.35)', type: 'sparkle-flash' },
  blind: { color: 'rgba(59,130,246,0.25)', type: 'pulse' },
};

export function ActionFeedback({
  action,
  isActive,
  duration = 500,
}: ActionFeedbackProps) {
  const reduced = useReducedMotion();
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (isActive && action) setKey((k) => k + 1);
  }, [isActive, action]);

  if (reduced || !action || !isActive) return null;

  const style = ACTION_STYLES[action];
  if (!style) return null;

  const dur = duration / 1000;

  return (
    <AnimatePresence>
      <div
        key={key}
        className="fixed inset-0 pointer-events-none z-40 overflow-hidden"
      >
        {/* Edge flash (pack) */}
        {style.type === 'edge-flash' && (
          <motion.div
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 0 }}
            transition={{ duration: dur }}
            className="absolute inset-0"
            style={{
              boxShadow: `inset 0 0 80px 30px ${style.color}`,
            }}
          />
        )}

        {/* Ripple (chaal) */}
        {style.type === 'ripple' && (
          <motion.div
            initial={{ scale: 0, opacity: 0.7 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ duration: dur, ease: 'easeOut' }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full"
            style={{ backgroundColor: style.color }}
          />
        )}

        {/* Shockwave (raise) */}
        {style.type === 'shockwave' && (
          <motion.div
            initial={{ scale: 0.2, opacity: 0.8 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: dur * 1.2, ease: 'easeOut' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full"
            style={{
              border: `3px solid ${style.color}`,
              boxShadow: `0 0 40px ${style.color}`,
            }}
          />
        )}

        {/* Sparkle flash (show) */}
        {style.type === 'sparkle-flash' && (
          <>
            <motion.div
              initial={{ opacity: 0.6 }}
              animate={{ opacity: 0 }}
              transition={{ duration: dur * 0.6 }}
              className="absolute inset-0"
              style={{
                background: `radial-gradient(circle at center, ${style.color} 0%, transparent 60%)`,
              }}
            />
            {/* Sparkle dots */}
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i / 8) * Math.PI * 2;
              return (
                <motion.div
                  key={i}
                  initial={{
                    x: '50vw',
                    y: '50vh',
                    scale: 0,
                    opacity: 1,
                  }}
                  animate={{
                    x: `calc(50vw + ${Math.cos(angle) * 120}px)`,
                    y: `calc(50vh + ${Math.sin(angle) * 120}px)`,
                    scale: [0, 1.5, 0],
                    opacity: [1, 1, 0],
                  }}
                  transition={{ duration: dur, ease: 'easeOut' }}
                  className="absolute w-2 h-2 rounded-full bg-purple-300 shadow-lg shadow-purple-500/50"
                />
              );
            })}
          </>
        )}

        {/* Pulse (blind) */}
        {style.type === 'pulse' && (
          <motion.div
            initial={{ opacity: 0.4 }}
            animate={{ opacity: [0.4, 0, 0.2, 0] }}
            transition={{ duration: dur, times: [0, 0.4, 0.6, 1] }}
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at center, ${style.color} 0%, transparent 50%)`,
            }}
          />
        )}
      </div>
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// 7. TurnPulse
// ---------------------------------------------------------------------------

interface TurnPulseProps {
  /** Whether it is the local player's turn */
  isMyTurn: boolean;
  /** Number of pulse cycles (default 2) */
  cycles?: number;
  /** Additional classes */
  className?: string;
}

export function TurnPulse({ isMyTurn, cycles = 2, className }: TurnPulseProps) {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(false);
  const prevTurn = useRef(false);

  useEffect(() => {
    if (isMyTurn && !prevTurn.current) {
      setActive(true);
      const t = setTimeout(() => setActive(false), cycles * 1000);
      prevTurn.current = true;
      return () => clearTimeout(t);
    }
    if (!isMyTurn) {
      prevTurn.current = false;
      setActive(false);
    }
  }, [isMyTurn, cycles]);

  if (reduced || !active) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.35, 0, 0.25, 0] }}
      transition={{ duration: cycles, ease: 'easeInOut' }}
      onAnimationComplete={() => setActive(false)}
      className={cn(
        'fixed inset-0 pointer-events-none z-30',
        className
      )}
      style={{
        boxShadow: 'inset 0 0 120px 40px rgba(234,179,8,0.25)',
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// 8. WinExplosion
// ---------------------------------------------------------------------------

interface WinExplosionProps {
  /** Chips won */
  amount: number;
  /** Controls visibility */
  isVisible: boolean;
  /** Called when full animation completes */
  onComplete?: () => void;
  /** Override chip cascade from/to coordinates */
  potPosition?: { x: number; y: number };
  avatarPosition?: { x: number; y: number };
}

export function WinExplosion({
  amount,
  isVisible,
  onComplete,
  potPosition,
  avatarPosition,
}: WinExplosionProps) {
  const reduced = useReducedMotion();

  const tier: 'small' | 'medium' | 'jackpot' =
    amount >= 10_000 ? 'jackpot' : amount >= 1_000 ? 'medium' : 'small';

  const confettiCount = tier === 'jackpot' ? 60 : tier === 'medium' ? 40 : 20;

  const confetti = useMemo(() => {
    if (!isVisible) return [];
    const r = seededRandom(amount + Date.now());
    return Array.from({ length: confettiCount }, (_, i) => ({
      id: i,
      x: r() * 100,
      color: CHIP_COLORS[Math.floor(r() * CHIP_COLORS.length)],
      delay: r() * 0.6,
      rotateEnd: r() * 720 - 360,
      drift: (r() - 0.5) * 30,
      size: 6 + r() * 8,
      duration: 2 + r() * 2,
    }));
  }, [isVisible, amount, confettiCount]);

  // Chip cascade particles
  const cascadeChips = useMemo(() => {
    if (!isVisible || !potPosition || !avatarPosition) return [];
    const r = seededRandom(amount * 3);
    const count = tier === 'jackpot' ? 12 : tier === 'medium' ? 8 : 5;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      delay: 0.8 + i * 0.06,
      size: 10 + r() * 6,
      color: CHIP_COLORS[Math.floor(r() * CHIP_COLORS.length)],
      arcHeight: 40 + r() * 60,
    }));
  }, [isVisible, amount, potPosition, avatarPosition, tier]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Screen flash */}
      {!reduced && (
        <motion.div
          initial={{ opacity: tier === 'jackpot' ? 0.6 : 0.3 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0 bg-yellow-400/30"
        />
      )}

      {/* Confetti rain */}
      {!reduced &&
        confetti.map((c) => (
          <motion.div
            key={c.id}
            initial={{
              x: `${c.x}vw`,
              y: '-5vh',
              rotate: 0,
              opacity: 1,
            }}
            animate={{
              y: '110vh',
              x: `${c.x + c.drift}vw`,
              rotate: c.rotateEnd,
            }}
            transition={{
              duration: c.duration,
              delay: c.delay,
              ease: 'linear',
            }}
            className="absolute"
          >
            <div
              className="rounded-sm"
              style={{
                width: c.size,
                height: c.size * 0.6,
                backgroundColor: c.color,
              }}
            />
          </motion.div>
        ))}

      {/* Chip cascade (pot → avatar) */}
      {!reduced &&
        potPosition &&
        avatarPosition &&
        cascadeChips.map((chip) => {
          const dx = avatarPosition.x - potPosition.x;
          const dy = avatarPosition.y - potPosition.y;
          const midX = potPosition.x + dx * 0.5;
          const midY = potPosition.y + dy * 0.5 - chip.arcHeight;

          return (
            <motion.div
              key={`cascade-${chip.id}`}
              initial={{
                x: potPosition.x - chip.size / 2,
                y: potPosition.y - chip.size / 2,
                scale: 1,
                opacity: 1,
              }}
              animate={{
                x: [
                  potPosition.x - chip.size / 2,
                  midX - chip.size / 2,
                  avatarPosition.x - chip.size / 2,
                ],
                y: [
                  potPosition.y - chip.size / 2,
                  midY - chip.size / 2,
                  avatarPosition.y - chip.size / 2,
                ],
                scale: [1, 1.3, 0.5],
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: 0.7,
                delay: chip.delay,
                ease: 'easeInOut',
                times: [0, 0.5, 1],
              }}
              className="absolute"
            >
              <div
                className="rounded-full border-2 border-dashed"
                style={{
                  width: chip.size,
                  height: chip.size,
                  background: `radial-gradient(circle at 35% 35%, ${chip.color}, ${chip.color}88)`,
                  borderColor: `${chip.color}44`,
                }}
              />
            </motion.div>
          );
        })}

      {/* "YOU WIN!" text */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={
          reduced
            ? { scale: 1, opacity: 1 }
            : {
                scale: [0, 1.3, 1],
                opacity: [0, 1, 1],
              }
        }
        transition={{
          duration: 0.6,
          delay: 0.2,
          ease: 'easeOut',
          times: [0, 0.6, 1],
        }}
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2"
      >
        <motion.h1
          animate={
            reduced
              ? {}
              : {
                  textShadow: [
                    '0 0 20px rgba(255,215,0,0.5)',
                    '0 0 60px rgba(255,215,0,0.8)',
                    '0 0 20px rgba(255,215,0,0.5)',
                  ],
                }
          }
          transition={{ duration: 1.5, repeat: 2 }}
          className={cn(
            'font-black text-transparent bg-clip-text bg-gradient-to-r',
            tier === 'jackpot'
              ? 'text-6xl from-yellow-300 via-orange-400 to-yellow-300'
              : tier === 'medium'
                ? 'text-5xl from-yellow-400 via-amber-400 to-yellow-400'
                : 'text-4xl from-yellow-400 to-amber-500'
          )}
        >
          YOU WIN!
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-sm border border-yellow-500/30"
        >
          <span
            className={cn(
              'font-bold',
              tier === 'jackpot'
                ? 'text-2xl text-yellow-300'
                : 'text-xl text-yellow-400'
            )}
          >
            +{shortNumber(amount)}
          </span>
        </motion.div>
      </motion.div>

      {/* Auto-dismiss */}
      <AutoDismiss
        delay={tier === 'jackpot' ? 4000 : tier === 'medium' ? 3000 : 2500}
        onComplete={onComplete}
      />
    </div>
  );
}

/** Internal helper: fires onComplete after delay */
function AutoDismiss({
  delay,
  onComplete,
}: {
  delay: number;
  onComplete?: () => void;
}) {
  useEffect(() => {
    if (!onComplete) return;
    const t = setTimeout(onComplete, delay);
    return () => clearTimeout(t);
  }, [delay, onComplete]);
  return null;
}

// ---------------------------------------------------------------------------
// 9. CardRevealSparkle
// ---------------------------------------------------------------------------

interface CardRevealSparkleProps {
  /** Whether the card is currently being revealed/flipped */
  isRevealing: boolean;
  /** Pixel position of the card center */
  position: { x: number; y: number };
  /** Particle count override (default 8) */
  particleCount?: number;
  /** Duration in ms (default 400) */
  duration?: number;
  /** Additional classes */
  className?: string;
}

export function CardRevealSparkle({
  isRevealing,
  position,
  particleCount = 8,
  duration = 400,
  className,
}: CardRevealSparkleProps) {
  const reduced = useReducedMotion();
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (isRevealing) setKey((k) => k + 1);
  }, [isRevealing]);

  if (reduced || !isRevealing) return null;

  const particles = Array.from({ length: particleCount }, (_, i) => {
    const angle = (i / particleCount) * Math.PI * 2;
    const dist = 25 + Math.random() * 25;
    const isGold = Math.random() > 0.4;
    return { id: i, angle, dist, isGold, size: 3 + Math.random() * 4 };
  });

  return (
    <div
      className={cn(
        'fixed inset-0 pointer-events-none z-40',
        className
      )}
    >
      {particles.map((p) => (
        <motion.div
          key={`${key}-${p.id}`}
          initial={{
            x: position.x,
            y: position.y,
            scale: 0,
            opacity: 1,
          }}
          animate={{
            x: position.x + Math.cos(p.angle) * p.dist,
            y: position.y + Math.sin(p.angle) * p.dist,
            scale: [0, 1.2, 0],
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: duration / 1000,
            ease: 'easeOut',
          }}
          className="absolute"
        >
          {/* Star / diamond shape via rotated square */}
          <div
            className={cn(
              'rotate-45',
              p.isGold
                ? 'bg-yellow-300 shadow-sm shadow-yellow-400/60'
                : 'bg-white shadow-sm shadow-white/60'
            )}
            style={{ width: p.size, height: p.size }}
          />
        </motion.div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 10. TimerUrgency
// ---------------------------------------------------------------------------

interface TimerUrgencyProps {
  /** Seconds remaining on the turn timer */
  secondsLeft: number;
  /** Whether it is the local player's turn */
  isMyTurn: boolean;
  /** Override the threshold that activates urgency (default 5) */
  threshold?: number;
  /** Additional classes */
  className?: string;
}

export function TimerUrgency({
  secondsLeft,
  isMyTurn,
  threshold = 5,
  className,
}: TimerUrgencyProps) {
  const reduced = useReducedMotion();
  const [tick, setTick] = useState(0);

  // Increment tick each second so the per-second flash re-triggers
  useEffect(() => {
    if (secondsLeft <= threshold && isMyTurn) {
      setTick((t) => t + 1);
    }
  }, [secondsLeft, threshold, isMyTurn]);

  const isUrgent = isMyTurn && secondsLeft <= threshold && secondsLeft > 0;

  if (reduced || !isUrgent) return null;

  // Intensity grows as time runs out
  const intensity = 1 - secondsLeft / threshold; // 0→1

  return (
    <div
      className={cn(
        'fixed inset-0 pointer-events-none z-30',
        className
      )}
    >
      {/* Pulsing red vignette */}
      <motion.div
        key={`vignette-${tick}`}
        animate={{
          opacity: [0.15 + intensity * 0.25, 0.05, 0.15 + intensity * 0.25],
        }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0"
        style={{
          boxShadow: `inset 0 0 ${80 + intensity * 60}px ${20 + intensity * 30}px rgba(239,68,68,${0.3 + intensity * 0.3})`,
        }}
      />

      {/* Per-second tick flash */}
      <motion.div
        key={`tick-${tick}`}
        initial={{ opacity: 0.25 + intensity * 0.15 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 bg-red-500/10"
      />
    </div>
  );
}
