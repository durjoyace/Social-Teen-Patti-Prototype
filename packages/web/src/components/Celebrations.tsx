import {
  useMotionActivity,
  useMotionPreference,
} from "../motion/useMotionActivity";
import { motionTiming } from "../motion/tokens";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Sparkles, Crown, Coins } from "lucide-react";
import { cn } from "../utils/cn";
import { formatChips } from "../game/gameEngine";
import { HandRank } from "../types";
import { getHandRankName } from "../game/handRanking";

// Confetti particle
interface Particle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  delay: number;
}

const COLORS = [
  "#FFD700",
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
];

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: -10,
    rotation: Math.random() * 360,
    scale: 0.5 + Math.random() * 0.5,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    delay: Math.random() * 0.5,
  }));
}

// Confetti component
export function Confetti({
  isActive,
  duration = 3000,
}: {
  isActive: boolean;
  duration?: number;
}) {
  const reduced = useMotionPreference();
  const particleRef = useRef<HTMLDivElement>(null);
  const active = useMotionActivity(particleRef);
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (isActive && active) {
      setParticles(generateParticles(18));
      const timer = setTimeout(() => setParticles([]), duration);
      return () => clearTimeout(timer);
    }
    setParticles([]);
  }, [isActive, duration, active]);

  return (
    <div
      ref={particleRef}
      aria-hidden
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
    >
      <AnimatePresence>
        {!reduced &&
          particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{
                x: `${particle.x}vw`,
                y: "-10vh",
                rotate: 0,
                scale: particle.scale,
              }}
              animate={{
                y: "110vh",
                rotate: particle.rotation + 720,
                x: `${particle.x + (Math.random() - 0.5) * 20}vw`,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 1.4,
                delay: particle.delay,
                ease: "linear",
              }}
              className="absolute"
            >
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: particle.color }}
              />
            </motion.div>
          ))}
      </AnimatePresence>
    </div>
  );
}

// Fireworks effect
export function Fireworks({ isActive }: { isActive: boolean }) {
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number }[]>(
    [],
  );

  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        setBursts((prev) => [
          ...prev.slice(-5),
          {
            id: Date.now(),
            x: 20 + Math.random() * 60,
            y: 20 + Math.random() * 40,
          },
        ]);
      }, 300);

      const timeout = setTimeout(() => {
        clearInterval(interval);
        setBursts([]);
      }, 3000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [isActive]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {bursts.map((burst) => (
          <motion.div
            key={burst.id}
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute"
            style={{ left: `${burst.x}%`, top: `${burst.y}%` }}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, x: 0, y: 0 }}
                animate={{
                  scale: [0, 1, 0],
                  x: Math.cos((i * 30 * Math.PI) / 180) * 80,
                  y: Math.sin((i * 30 * Math.PI) / 180) * 80,
                }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="absolute w-2 h-2 rounded-full"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
            ))}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Winner celebration overlay
interface WinnerCelebrationProps {
  isVisible: boolean;
  winnerName: string;
  amount: number;
  handRank?: HandRank;
  onClose: () => void;
}

export function WinnerCelebration({
  isVisible,
  winnerName,
  amount,
  handRank,
  onClose,
}: WinnerCelebrationProps) {
  const reduced = useMotionPreference();
  useEffect(() => {
    if (!isVisible) return;
    const previous = document.activeElement as HTMLElement | null;
    return () => {
      if (previous?.isConnected) previous.focus();
    };
  }, [isVisible]);
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="hand-winner-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : motionTiming.state }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={onClose}
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
            if (e.key === "Tab") e.preventDefault();
          }}
        >
          <Confetti isActive={!reduced} duration={1800} />
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: motionTiming.entrance,
              ease: motionTiming.ease,
            }}
            onClick={(e) => e.stopPropagation()}
            data-winner-panel
            className="relative z-[51] w-full max-w-sm rounded-3xl border border-[#E8B04A]/40 bg-[#101B17] p-8 text-center shadow-2xl"
          >
            <Trophy
              aria-hidden
              className="mx-auto mb-4 h-14 w-14 text-[#E8B04A]"
            />
            <p className="mb-2 text-xs uppercase tracking-widest text-[#E0BD76]">
              Hand complete
            </p>
            <h2
              id="hand-winner-title"
              className="text-2xl font-semibold text-[#FFFBEA]"
            >
              {winnerName} won
            </h2>
            <p className="mt-2 text-sm text-[#C7D3CC]">
              {handRank
                ? getHandRankName(handRank)
                : "Won without showing cards"}
            </p>
            <p className="my-6 text-3xl font-bold tabular-nums text-[#E8B04A]">
              ◉ {formatChips(amount)}
              <span className="mt-1 block text-sm font-normal text-[#C7D3CC]">
                Pot payout
              </span>
            </p>
            <button
              autoFocus
              onClick={onClose}
              className="w-full rounded-xl bg-[#E8B04A] py-3 font-semibold text-[#171006] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              Continue
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hand reveal animation
interface HandRevealProps {
  isVisible: boolean;
  playerName: string;
  handRank: HandRank;
  isWinner: boolean;
}

export function HandRevealBadge({
  isVisible,
  playerName,
  handRank,
  isWinner,
}: HandRevealProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ scale: 0, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0, y: -20 }}
          className={cn(
            "absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full",
            "text-xs font-bold whitespace-nowrap",
            isWinner
              ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-yellow-900"
              : "bg-white/20 text-white/80",
          )}
        >
          {getHandRankName(handRank).split(" ")[0]}
          {isWinner && <Crown className="inline-block w-3 h-3 ml-1" />}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Chips flying animation
export function ChipsFlying({
  from,
  to,
  amount,
  onComplete,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  amount: number;
  onComplete?: () => void;
}) {
  const chipCount = Math.min(Math.ceil(amount / 500), 8);

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {Array.from({ length: chipCount }).map((_, i) => (
        <motion.div
          key={i}
          initial={{
            x: from.x + (Math.random() - 0.5) * 30,
            y: from.y + (Math.random() - 0.5) * 30,
            scale: 1,
            opacity: 1,
          }}
          animate={{
            x: to.x,
            y: to.y,
            scale: 0.5,
            opacity: 0,
          }}
          transition={{
            duration: 0.5 + Math.random() * 0.3,
            delay: i * 0.05,
            ease: "easeInOut",
          }}
          onAnimationComplete={i === chipCount - 1 ? onComplete : undefined}
          className="absolute"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-b from-yellow-400 to-yellow-600 border-2 border-dashed border-yellow-300/50 shadow-lg" />
        </motion.div>
      ))}
    </div>
  );
}

// Countdown timer with urgency
export function CountdownTimer({
  seconds,
  maxSeconds = 30,
}: {
  seconds: number;
  maxSeconds?: number;
}) {
  const percentage = (seconds / maxSeconds) * 100;
  const isUrgent = seconds <= 5;

  return (
    <motion.div
      animate={isUrgent ? { scale: [1, 1.1, 1] } : {}}
      transition={{ repeat: isUrgent ? Infinity : 0, duration: 0.5 }}
      className="relative w-12 h-12"
    >
      {/* Background circle */}
      <svg className="w-full h-full -rotate-90">
        <circle
          cx="24"
          cy="24"
          r="20"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="4"
        />
        <motion.circle
          cx="24"
          cy="24"
          r="20"
          fill="none"
          stroke={
            isUrgent ? "#ef4444" : percentage > 50 ? "#22c55e" : "#eab308"
          }
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${percentage * 1.26} 126`}
          initial={false}
          animate={{ strokeDasharray: `${percentage * 1.26} 126` }}
          transition={{ duration: 0.3 }}
        />
      </svg>

      {/* Number */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={cn(
            "text-sm font-bold",
            isUrgent ? "text-red-400" : "text-white",
          )}
        >
          {seconds}
        </span>
      </div>
    </motion.div>
  );
}
