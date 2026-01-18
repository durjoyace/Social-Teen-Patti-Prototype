import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Sparkles, Crown, Coins } from 'lucide-react';
import { cn } from '../utils/cn';
import { formatChips } from '../game/gameEngine';
import { HandRank } from '../types';
import { getHandRankName } from '../game/handRanking';

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

const COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: -10,
    rotation: Math.random() * 360,
    scale: 0.5 + Math.random() * 0.5,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    delay: Math.random() * 0.5
  }));
}

// Confetti component
export function Confetti({ isActive, duration = 3000 }: { isActive: boolean; duration?: number }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (isActive) {
      setParticles(generateParticles(50));
      const timer = setTimeout(() => setParticles([]), duration);
      return () => clearTimeout(timer);
    }
  }, [isActive, duration]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{
              x: `${particle.x}vw`,
              y: '-10vh',
              rotate: 0,
              scale: particle.scale
            }}
            animate={{
              y: '110vh',
              rotate: particle.rotation + 720,
              x: `${particle.x + (Math.random() - 0.5) * 20}vw`
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 2 + Math.random() * 2,
              delay: particle.delay,
              ease: 'linear'
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
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number }[]>([]);

  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        setBursts(prev => [
          ...prev.slice(-5),
          { id: Date.now(), x: 20 + Math.random() * 60, y: 20 + Math.random() * 40 }
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
                  y: Math.sin((i * 30 * Math.PI) / 180) * 80
                }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
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
  handRank: HandRank;
  onClose: () => void;
}

export function WinnerCelebration({
  isVisible,
  winnerName,
  amount,
  handRank,
  onClose
}: WinnerCelebrationProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <>
          <Confetti isActive={true} />
          <Fireworks isActive={true} />

          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
            onClick={onClose}
          >
            {/* Content */}
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 10 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="relative p-8 max-w-sm mx-4"
            >
              {/* Glowing background */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-yellow-500/30 via-orange-500/20 to-red-500/30 blur-2xl" />

              {/* Card */}
              <div className="relative rounded-3xl bg-gradient-to-b from-gray-900 to-black border border-yellow-500/30 p-8 overflow-hidden">
                {/* Shine effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  animate={{ x: ['-200%', '200%'] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                />

                {/* Trophy */}
                <motion.div
                  initial={{ y: -50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex justify-center mb-4"
                >
                  <motion.div
                    animate={{ rotate: [0, -5, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="relative"
                  >
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-2xl shadow-yellow-500/50">
                      <Trophy className="w-12 h-12 text-yellow-900" />
                    </div>
                    {/* Stars around trophy */}
                    {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 1, 0] }}
                        transition={{ delay: 0.5 + i * 0.1, duration: 1, repeat: Infinity, repeatDelay: 1 }}
                        className="absolute"
                        style={{
                          left: '50%',
                          top: '50%',
                          transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-60px)`
                        }}
                      >
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>

                {/* Winner text */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-center"
                >
                  <motion.h2
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 mb-2"
                  >
                    WINNER!
                  </motion.h2>
                  <p className="text-xl text-white font-semibold mb-1">{winnerName}</p>
                  <p className="text-yellow-500/80 text-sm mb-6">{getHandRankName(handRank)}</p>

                  {/* Amount */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring' }}
                    className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/30"
                  >
                    <Coins className="w-6 h-6 text-green-400" />
                    <span className="text-3xl font-bold text-green-400">
                      +₹{formatChips(amount)}
                    </span>
                  </motion.div>
                </motion.div>

                {/* Continue button */}
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold shadow-lg shadow-orange-500/30"
                >
                  Continue
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </>
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

export function HandRevealBadge({ isVisible, playerName, handRank, isWinner }: HandRevealProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ scale: 0, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0, y: -20 }}
          className={cn(
            'absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full',
            'text-xs font-bold whitespace-nowrap',
            isWinner
              ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-yellow-900'
              : 'bg-white/20 text-white/80'
          )}
        >
          {getHandRankName(handRank).split(' ')[0]}
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
  onComplete
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
            opacity: 1
          }}
          animate={{
            x: to.x,
            y: to.y,
            scale: 0.5,
            opacity: 0
          }}
          transition={{
            duration: 0.5 + Math.random() * 0.3,
            delay: i * 0.05,
            ease: 'easeInOut'
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
export function CountdownTimer({ seconds, maxSeconds = 30 }: { seconds: number; maxSeconds?: number }) {
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
          stroke={isUrgent ? '#ef4444' : percentage > 50 ? '#22c55e' : '#eab308'}
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
        <span className={cn(
          'text-sm font-bold',
          isUrgent ? 'text-red-400' : 'text-white'
        )}>
          {seconds}
        </span>
      </div>
    </motion.div>
  );
}
