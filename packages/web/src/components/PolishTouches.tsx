import {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
  type ReactNode,
  type RefObject,
  type ButtonHTMLAttributes,
} from 'react';
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useSpring,
  useMotionValue,
  useTransform,
  type PanInfo,
} from 'framer-motion';
import { cn } from '../utils/cn';

// ---------------------------------------------------------------------------
// Shared constants
// ---------------------------------------------------------------------------

const APPLE_SPRING = { stiffness: 350, damping: 28 };
const APPLE_SPRING_SNAPPY = { stiffness: 400, damping: 30 };
const APPLE_SPRING_SOFT = { stiffness: 300, damping: 25 };

// ---------------------------------------------------------------------------
// 1. AnimatedChipCount
// ---------------------------------------------------------------------------

interface AnimatedChipCountProps {
  value: number;
  prefix?: string;
  className?: string;
  /** Interpolation duration in ms (default 400) */
  duration?: number;
}

export function AnimatedChipCount({
  value,
  prefix = '',
  className,
  duration = 400,
}: AnimatedChipCountProps) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const [flash, setFlash] = useState<'increase' | 'decrease' | null>(null);
  const prevRef = useRef(value);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = value;

    if (prev === value) return;
    const direction = value > prev ? 'increase' : 'decrease';
    setFlash(direction);

    if (reduced) {
      setDisplay(value);
      const t = setTimeout(() => setFlash(null), 200);
      return () => clearTimeout(t);
    }

    const start = performance.now();
    const from = prev;
    const to = value;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * eased));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setFlash(null);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration, reduced]);

  return (
    <motion.span
      className={cn(
        'inline-block tabular-nums font-semibold transition-colors duration-200',
        flash === 'increase' && 'text-emerald-400',
        flash === 'decrease' && 'text-red-400',
        !flash && 'text-inherit',
        className,
      )}
      animate={
        flash && !reduced
          ? { scale: [1, 1.15, 1], transition: { duration: 0.3 } }
          : { scale: 1 }
      }
    >
      {prefix}
      {display.toLocaleString()}
    </motion.span>
  );
}

// ---------------------------------------------------------------------------
// 2. PressableButton
// ---------------------------------------------------------------------------

interface PressableButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

const VARIANT_CLASSES: Record<NonNullable<PressableButtonProps['variant']>, string> = {
  primary:
    'bg-gradient-to-b from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30 hover:shadow-amber-500/40',
  secondary:
    'bg-white/10 text-white border border-white/20 hover:bg-white/15',
  danger:
    'bg-gradient-to-b from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30',
  ghost: 'bg-transparent text-white/70 hover:text-white hover:bg-white/5',
};

export function PressableButton({
  children,
  onClick,
  className,
  disabled = false,
  variant = 'primary',
}: PressableButtonProps) {
  const reduced = useReducedMotion();
  const [pressed, setPressed] = useState(false);

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      animate={
        reduced
          ? {}
          : pressed
            ? { scale: 0.97, boxShadow: '0 1px 2px rgba(0,0,0,0.3)' }
            : { scale: 1, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }
      }
      whileTap={reduced ? {} : undefined}
      transition={{
        type: 'spring',
        ...APPLE_SPRING_SNAPPY,
        // Slight overshoot on release
        ...(pressed ? {} : { stiffness: 350, damping: 22 }),
      }}
      className={cn(
        'relative rounded-xl px-5 py-3 font-semibold text-sm',
        'select-none outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50',
        'transition-colors duration-150',
        'disabled:opacity-40 disabled:pointer-events-none',
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {/* Inner glow on press */}
      <motion.span
        className="pointer-events-none absolute inset-0 rounded-xl"
        animate={{
          boxShadow: pressed
            ? 'inset 0 0 12px rgba(255,255,255,0.15)'
            : 'inset 0 0 0px rgba(255,255,255,0)',
        }}
        transition={{ duration: 0.15 }}
      />
      {children}
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// 3. SlideUpSheet
// ---------------------------------------------------------------------------

interface SlideUpSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  /** Snap points as fractions of viewport height, default [0.5, 0.92] */
  snapPoints?: number[];
}

export function SlideUpSheet({
  isOpen,
  onClose,
  children,
  title,
  snapPoints = [0.5, 0.92],
}: SlideUpSheetProps) {
  const reduced = useReducedMotion();
  const [snapIndex, setSnapIndex] = useState(0);
  const sheetHeight = typeof window !== 'undefined' ? window.innerHeight * snapPoints[snapIndex] : 400;

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      const threshold = sheetHeight * 0.3;
      if (info.offset.y > threshold) {
        onClose();
      } else if (info.offset.y < -50 && snapIndex < snapPoints.length - 1) {
        setSnapIndex((i) => Math.min(i + 1, snapPoints.length - 1));
      } else if (info.offset.y > 50 && snapIndex > 0) {
        setSnapIndex((i) => Math.max(i - 1, 0));
      }
    },
    [sheetHeight, snapIndex, snapPoints, onClose],
  );

  // Reset snap index on open
  useEffect(() => {
    if (isOpen) setSnapIndex(0);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.2 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl bg-gray-900 shadow-2xl"
            style={{ maxHeight: '92vh' }}
            initial={{ y: '100%' }}
            animate={{ y: 0, height: sheetHeight }}
            exit={{ y: '100%' }}
            transition={
              reduced
                ? { duration: 0 }
                : { type: 'spring', ...APPLE_SPRING_SOFT }
            }
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
          >
            {/* Drag handle */}
            <div className="flex shrink-0 items-center justify-center py-3">
              <div className="h-1.5 w-10 rounded-full bg-white/20" />
            </div>

            {/* Title */}
            {title && (
              <div className="shrink-0 border-b border-white/10 px-5 pb-3">
                <h2 className="text-center text-lg font-semibold text-white">
                  {title}
                </h2>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// 4. SkeletonLoader
// ---------------------------------------------------------------------------

interface SkeletonLoaderProps {
  variant: 'card' | 'avatar' | 'text' | 'button';
  width?: string | number;
  height?: string | number;
  className?: string;
}

const SKELETON_VARIANTS: Record<
  SkeletonLoaderProps['variant'],
  { defaultWidth: string; defaultHeight: string; borderRadius: string }
> = {
  card: { defaultWidth: '100%', defaultHeight: '120px', borderRadius: '16px' },
  avatar: { defaultWidth: '48px', defaultHeight: '48px', borderRadius: '9999px' },
  text: { defaultWidth: '100%', defaultHeight: '14px', borderRadius: '8px' },
  button: { defaultWidth: '120px', defaultHeight: '40px', borderRadius: '9999px' },
};

export function SkeletonLoader({
  variant,
  width,
  height,
  className,
}: SkeletonLoaderProps) {
  const reduced = useReducedMotion();
  const config = SKELETON_VARIANTS[variant];

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-white/[0.06]',
        !reduced && 'animate-pulse',
        className,
      )}
      style={{
        width: width ?? config.defaultWidth,
        height: height ?? config.defaultHeight,
        borderRadius: config.borderRadius,
      }}
    >
      {/* Shimmer sweep */}
      {!reduced && (
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 40%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.06) 60%, transparent 100%)',
            animation: 'skeleton-shimmer 1.8s ease-in-out infinite',
          }}
        />
      )}

      {/* Inject keyframes once */}
      <style>{`
        @keyframes skeleton-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5. SuccessCheckmark
// ---------------------------------------------------------------------------

interface SuccessCheckmarkProps {
  isVisible: boolean;
  size?: number;
  onComplete?: () => void;
}

export function SuccessCheckmark({
  isVisible,
  size = 64,
  onComplete,
}: SuccessCheckmarkProps) {
  const reduced = useReducedMotion();
  const sparkleCount = 8;
  const sparkles = useMemo(
    () =>
      Array.from({ length: sparkleCount }, (_, i) => {
        const angle = (360 / sparkleCount) * i;
        const distance = size * 0.9 + Math.random() * size * 0.3;
        return {
          id: i,
          x: Math.cos((angle * Math.PI) / 180) * distance,
          y: Math.sin((angle * Math.PI) / 180) * distance,
          scale: 0.4 + Math.random() * 0.6,
          delay: 0.4 + i * 0.04,
        };
      }),
    [size],
  );

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {isVisible && (
        <motion.div
          className="relative inline-flex items-center justify-center"
          style={{ width: size, height: size }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={
            reduced
              ? { duration: 0.1 }
              : { type: 'spring', ...APPLE_SPRING_SNAPPY }
          }
        >
          {/* Green circle */}
          <motion.div
            className="absolute inset-0 rounded-full bg-emerald-500"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={
              reduced
                ? { duration: 0.1 }
                : { type: 'spring', ...APPLE_SPRING, delay: 0.05 }
            }
          />

          {/* Checkmark SVG */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="relative z-10"
            style={{ width: size * 0.5, height: size * 0.5 }}
          >
            <motion.path
              d="M5 13l4 4L19 7"
              stroke="white"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={
                reduced
                  ? { duration: 0.1 }
                  : { duration: 0.35, delay: 0.25, ease: 'easeOut' }
              }
            />
          </svg>

          {/* Sparkle particles */}
          {!reduced &&
            sparkles.map((s) => (
              <motion.div
                key={s.id}
                className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-amber-400"
                initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                animate={{
                  x: s.x,
                  y: s.y,
                  scale: [0, s.scale, 0],
                  opacity: [1, 1, 0],
                }}
                transition={{
                  duration: 0.6,
                  delay: s.delay,
                  ease: 'easeOut',
                }}
              />
            ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// 6. ContextualTooltip
// ---------------------------------------------------------------------------

interface ContextualTooltipProps {
  /** Unique ID for localStorage tracking — shown only once per ID */
  id: string;
  text: string;
  emoji?: string;
  targetRef: RefObject<HTMLElement | null>;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function ContextualTooltip({
  id,
  text,
  emoji,
  targetRef,
  position = 'top',
}: ContextualTooltipProps) {
  const reduced = useReducedMotion();
  const storageKey = `tooltip_seen_${id}`;
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(storageKey)) return;
    } catch {
      // localStorage not available — show anyway
    }

    const el = targetRef.current;
    if (!el) return;

    const show = () => {
      const rect = el.getBoundingClientRect();
      const pos = { top: 0, left: 0 };

      switch (position) {
        case 'top':
          pos.top = rect.top - 8;
          pos.left = rect.left + rect.width / 2;
          break;
        case 'bottom':
          pos.top = rect.bottom + 8;
          pos.left = rect.left + rect.width / 2;
          break;
        case 'left':
          pos.top = rect.top + rect.height / 2;
          pos.left = rect.left - 8;
          break;
        case 'right':
          pos.top = rect.top + rect.height / 2;
          pos.left = rect.right + 8;
          break;
      }

      setCoords(pos);
      setVisible(true);
    };

    // Show after a brief delay to let layout settle
    const timer = setTimeout(show, 600);
    return () => clearTimeout(timer);
  }, [id, position, storageKey, targetRef]);

  // Auto-dismiss after 3 seconds
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => dismiss(), 3000);
    return () => clearTimeout(timer);
  }, [visible]);

  const dismiss = useCallback(() => {
    setVisible(false);
    try {
      localStorage.setItem(storageKey, '1');
    } catch {
      // ignore
    }
  }, [storageKey]);

  const translateMap: Record<string, { x: string; y: string }> = {
    top: { x: '-50%', y: '-100%' },
    bottom: { x: '-50%', y: '0%' },
    left: { x: '-100%', y: '-50%' },
    right: { x: '0%', y: '-50%' },
  };

  if (!coords) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed z-[100] max-w-[240px] rounded-xl bg-gray-900 px-4 py-2.5 text-sm text-white shadow-xl"
          style={{
            top: coords.top,
            left: coords.left,
            transform: `translate(${translateMap[position].x}, ${translateMap[position].y})`,
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={reduced ? { duration: 0.05 } : { type: 'spring', ...APPLE_SPRING_SNAPPY }}
          onClick={dismiss}
          role="tooltip"
        >
          {emoji && <span className="mr-1.5">{emoji}</span>}
          {text}
          {/* Arrow */}
          <div
            className={cn(
              'absolute h-2 w-2 rotate-45 bg-gray-900',
              position === 'top' && 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2',
              position === 'bottom' && 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2',
              position === 'left' && 'right-0 top-1/2 -translate-y-1/2 translate-x-1/2',
              position === 'right' && 'left-0 top-1/2 -translate-y-1/2 -translate-x-1/2',
            )}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// 7. HapticButton
// ---------------------------------------------------------------------------

interface HapticButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  children: ReactNode;
  onClick?: () => void;
  hapticPattern?: 'tap' | 'success' | 'error' | 'heavy';
}

const HAPTIC_PATTERNS: Record<NonNullable<HapticButtonProps['hapticPattern']>, number[]> = {
  tap: [10],
  success: [10, 50, 10],
  error: [50, 30, 50],
  heavy: [30],
};

function vibrate(pattern: number[]) {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    // Vibration not supported — fail silently
  }
}

export function HapticButton({
  children,
  onClick,
  hapticPattern = 'tap',
  className,
  ...rest
}: HapticButtonProps) {
  const handleClick = useCallback(() => {
    vibrate(HAPTIC_PATTERNS[hapticPattern]);
    onClick?.();
  }, [hapticPattern, onClick]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'select-none outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// 8. ParallaxBackground
// ---------------------------------------------------------------------------

interface ParallaxBackgroundProps {
  className?: string;
  /** Movement intensity multiplier (default 1) */
  intensity?: number;
}

interface ParallaxParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  layer: 1 | 2 | 3;
}

function generateParallaxParticles(): ParallaxParticle[] {
  const particles: ParallaxParticle[] = [];
  let id = 0;

  // Layer 1: large blurred circles (slow)
  for (let i = 0; i < 5; i++) {
    particles.push({
      id: id++,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 40 + Math.random() * 60,
      opacity: 0.03 + Math.random() * 0.04,
      layer: 1,
    });
  }

  // Layer 2: medium sparkle dots
  for (let i = 0; i < 12; i++) {
    particles.push({
      id: id++,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 4 + Math.random() * 8,
      opacity: 0.08 + Math.random() * 0.12,
      layer: 2,
    });
  }

  // Layer 3: tiny fast stars
  for (let i = 0; i < 20; i++) {
    particles.push({
      id: id++,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1.5 + Math.random() * 3,
      opacity: 0.15 + Math.random() * 0.2,
      layer: 3,
    });
  }

  return particles;
}

const LAYER_SPEED: Record<number, number> = { 1: 0.3, 2: 0.6, 3: 1 };

export function ParallaxBackground({
  className,
  intensity = 1,
}: ParallaxBackgroundProps) {
  const reduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const particles = useMemo(generateParallaxParticles, []);

  useEffect(() => {
    if (reduced) return;

    let orientationSupported = false;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      orientationSupported = true;
      const x = ((e.gamma ?? 0) / 45) * 10 * intensity; // -10 to 10
      const y = ((e.beta ?? 0) / 45) * 10 * intensity;
      setOffset({ x: Math.max(-10, Math.min(10, x)), y: Math.max(-10, Math.min(10, y)) });
    };

    const handleMouse = (e: MouseEvent) => {
      if (orientationSupported) return;
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const x = ((e.clientX - cx) / cx) * 10 * intensity;
      const y = ((e.clientY - cy) / cy) * 10 * intensity;
      setOffset({ x, y });
    };

    window.addEventListener('deviceorientation', handleOrientation);
    window.addEventListener('mousemove', handleMouse);
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('mousemove', handleMouse);
    };
  }, [intensity, reduced]);

  return (
    <div
      ref={containerRef}
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      aria-hidden
    >
      {particles.map((p) => {
        const speed = LAYER_SPEED[p.layer];
        const dx = offset.x * speed;
        const dy = offset.y * speed;

        return (
          <div
            key={p.id}
            className={cn(
              'absolute rounded-full',
              p.layer === 1 && 'bg-amber-400',
              p.layer === 2 && 'bg-white',
              p.layer === 3 && 'bg-white',
            )}
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              opacity: p.opacity,
              filter: p.layer === 1 ? 'blur(20px)' : p.layer === 2 ? 'blur(1px)' : 'none',
              transform: reduced
                ? 'none'
                : `translate(${dx}px, ${dy}px)`,
              transition: 'transform 0.15s ease-out',
            }}
          />
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 9. SmoothPageTransition
// ---------------------------------------------------------------------------

interface SmoothPageTransitionProps {
  children: ReactNode;
  direction?: 'forward' | 'back' | 'modal';
  className?: string;
}

const PAGE_VARIANTS = {
  forward: {
    initial: { x: '30%', scale: 0.97, opacity: 0 },
    animate: { x: 0, scale: 1, opacity: 1 },
    exit: { x: '-15%', scale: 0.98, opacity: 0 },
  },
  back: {
    initial: { x: '-30%', scale: 0.97, opacity: 0 },
    animate: { x: 0, scale: 1, opacity: 1 },
    exit: { x: '15%', scale: 0.98, opacity: 0 },
  },
  modal: {
    initial: { scale: 0.85, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.9, opacity: 0 },
  },
};

export function SmoothPageTransition({
  children,
  direction = 'forward',
  className,
}: SmoothPageTransitionProps) {
  const reduced = useReducedMotion();
  const variant = PAGE_VARIANTS[direction];

  return (
    <motion.div
      className={cn('w-full', className)}
      initial={reduced ? { opacity: 0 } : variant.initial}
      animate={reduced ? { opacity: 1 } : variant.animate}
      exit={reduced ? { opacity: 0 } : variant.exit}
      transition={
        reduced
          ? { duration: 0.1 }
          : { type: 'spring', ...APPLE_SPRING }
      }
    >
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// 10. PullToRefresh
// ---------------------------------------------------------------------------

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
}

export function PullToRefresh({
  onRefresh,
  children,
  className,
}: PullToRefreshProps) {
  const reduced = useReducedMotion();
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const pullDistance = useMotionValue(0);
  const spinnerOpacity = useTransform(pullDistance, [0, 60], [0, 1]);
  const spinnerScale = useTransform(pullDistance, [0, 80], [0.5, 1]);
  const spinnerRotate = useSpring(0, { stiffness: 80, damping: 12 });

  // Spin while refreshing
  useEffect(() => {
    if (!refreshing) return;
    let frame: number;
    let deg = 0;
    const spin = () => {
      deg += 6;
      spinnerRotate.set(deg);
      frame = requestAnimationFrame(spin);
    };
    frame = requestAnimationFrame(spin);
    return () => cancelAnimationFrame(frame);
  }, [refreshing, spinnerRotate]);

  const handleDragEnd = useCallback(
    async (_: unknown, info: PanInfo) => {
      setPulling(false);
      if (info.offset.y > 80 && !refreshing) {
        setRefreshing(true);
        pullDistance.set(60);
        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
          pullDistance.set(0);
        }
      } else {
        pullDistance.set(0);
      }
    },
    [onRefresh, refreshing, pullDistance],
  );

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Spinner indicator */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2"
        style={{
          opacity: spinnerOpacity,
          scale: spinnerScale,
          y: useTransform(pullDistance, [0, 80], [-20, 16]),
        }}
      >
        <motion.div
          className="h-6 w-6 rounded-full border-2 border-white/30 border-t-white"
          style={{ rotate: spinnerRotate }}
        />
      </motion.div>

      {/* Draggable content */}
      <motion.div
        drag={refreshing ? false : 'y'}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.4}
        onDrag={(_, info) => {
          if (info.offset.y > 0) {
            setPulling(true);
            // Rubber-band: diminishing returns past 80px
            const clamped = Math.min(info.offset.y, 120);
            const rubberBand = clamped * (1 - clamped / 300);
            pullDistance.set(rubberBand);
          }
        }}
        onDragEnd={handleDragEnd}
        style={{ y: pullDistance }}
        transition={
          reduced
            ? { duration: 0.1 }
            : { type: 'spring', ...APPLE_SPRING_SOFT }
        }
      >
        {children}
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 11. GlassCard
// ---------------------------------------------------------------------------

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function GlassCard({
  children,
  className,
  hover = true,
  onClick,
}: GlassCardProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-2xl',
        // Glass effect
        'bg-white/[0.06] backdrop-blur-xl',
        // Border glow
        'border border-white/[0.08]',
        'shadow-lg shadow-black/20',
        // Fallback for no backdrop-filter support
        'supports-[not(backdrop-filter:blur(1px))]:bg-gray-900/90',
        // Hover
        hover && 'cursor-pointer transition-shadow duration-200 hover:border-white/[0.15] hover:shadow-xl hover:shadow-black/30',
        className,
      )}
      whileHover={
        hover && !reduced
          ? { scale: 1.01, transition: { type: 'spring', ...APPLE_SPRING_SNAPPY } }
          : undefined
      }
    >
      {/* Subtle inner highlight at top */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// 12. EmptyState
// ---------------------------------------------------------------------------

interface EmptyStateProps {
  emoji: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  emoji,
  title,
  subtitle,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  const reduced = useReducedMotion();

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-6 py-12 text-center',
        className,
      )}
    >
      {/* Floating emoji illustration */}
      <motion.div
        className="mb-6 text-5xl"
        animate={
          reduced
            ? {}
            : {
                y: [0, -8, 0],
                transition: {
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
              }
        }
      >
        {emoji}
      </motion.div>

      <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>

      {subtitle && (
        <p className="mb-6 max-w-xs text-sm text-white/50">{subtitle}</p>
      )}

      {actionLabel && onAction && (
        <PressableButton variant="primary" onClick={onAction}>
          {actionLabel}
        </PressableButton>
      )}
    </div>
  );
}
