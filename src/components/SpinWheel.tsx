import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Diamond,
  Gift,
  Clock,
  Sparkles,
  RotateCcw,
  History,
  ChevronDown,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { formatChips } from '../game/gameEngine';
import { PressableButton, SuccessCheckmark, AnimatedChipCount } from './PolishTouches';

// --- Types ---

interface WheelSegment {
  label: string;
  value: number;
  type: 'chips' | 'diamonds' | 'mystery';
  color: string;
  textColor: string;
}

interface SpinHistoryEntry {
  id: string;
  segment: WheelSegment;
  timestamp: Date;
}

interface SpinWheelProps {
  isOpen: boolean;
  onClose: () => void;
  onSpin: (result: WheelSegment) => void;
  freeSpinsRemaining?: number;
  diamondBalance?: number;
  spinCostDiamonds?: number;
  history?: SpinHistoryEntry[];
  className?: string;
}

// --- Data ---

const SEGMENTS: WheelSegment[] = [
  { label: '500', value: 500, type: 'chips', color: '#DC2626', textColor: '#FEF2F2' },
  { label: '1K', value: 1000, type: 'chips', color: '#2563EB', textColor: '#EFF6FF' },
  { label: '2K', value: 2000, type: 'chips', color: '#16A34A', textColor: '#F0FDF4' },
  { label: '5K', value: 5000, type: 'chips', color: '#9333EA', textColor: '#FAF5FF' },
  { label: '10K', value: 10000, type: 'chips', color: '#EA580C', textColor: '#FFF7ED' },
  { label: '50K', value: 50000, type: 'chips', color: '#0891B2', textColor: '#ECFEFF' },
  { label: '5', value: 5, type: 'diamonds', color: '#DB2777', textColor: '#FDF2F8' },
  { label: '???', value: 0, type: 'mystery', color: '#D4AF37', textColor: '#1A1A1A' },
];

const DEFAULT_HISTORY: SpinHistoryEntry[] = [
  { id: 'h1', segment: SEGMENTS[2], timestamp: new Date(Date.now() - 86400000) },
  { id: 'h2', segment: SEGMENTS[0], timestamp: new Date(Date.now() - 172800000) },
  { id: 'h3', segment: SEGMENTS[4], timestamp: new Date(Date.now() - 259200000) },
];

const SEGMENT_ARC = 360 / SEGMENTS.length; // 45 degrees each

// --- Helpers ---

function getWeightedResult(): number {
  // Weighted distribution: lower prizes more likely
  const weights = [30, 25, 18, 12, 8, 3, 3, 1];
  const total = weights.reduce((a, b) => a + b, 0);
  let rand = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    rand -= weights[i];
    if (rand <= 0) return i;
  }
  return 0;
}

// --- Sub-components ---

function WheelPointer() {
  return (
    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-20">
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        <div className="relative">
          {/* Glow */}
          <div className="absolute inset-0 w-8 h-10 bg-yellow-500/40 blur-md rounded-full" />
          {/* Pointer triangle */}
          <svg width="32" height="40" viewBox="0 0 32 40" className="relative z-10 drop-shadow-lg">
            <polygon
              points="16,38 4,4 28,4"
              fill="#D4AF37"
              stroke="#FDE68A"
              strokeWidth="2"
            />
            <circle cx="16" cy="12" r="4" fill="#FDE68A" />
          </svg>
        </div>
      </motion.div>
    </div>
  );
}

function SegmentLabel({ segment, index }: { segment: WheelSegment; index: number }) {
  const angle = index * SEGMENT_ARC + SEGMENT_ARC / 2;
  const radius = 95;
  const rad = (angle - 90) * (Math.PI / 180);
  const x = 140 + radius * Math.cos(rad);
  const y = 140 + radius * Math.sin(rad);

  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      transform={`rotate(${angle}, ${x}, ${y})`}
      fill={segment.textColor}
      fontSize="13"
      fontWeight="bold"
      className="select-none"
    >
      {segment.type === 'diamonds' ? `${segment.label} \u2666` : segment.type === 'mystery' ? 'MYSTERY' : segment.label}
    </text>
  );
}

function WheelSVG() {
  const center = 140;
  const radius = 130;

  return (
    <svg width="280" height="280" viewBox="0 0 280 280">
      {/* Outer ring */}
      <circle cx={center} cy={center} r={radius + 8} fill="none" stroke="#D4AF37" strokeWidth="3" />
      <circle cx={center} cy={center} r={radius + 5} fill="none" stroke="#92702C" strokeWidth="1" />

      {/* Segments */}
      {SEGMENTS.map((seg, i) => {
        const startAngle = i * SEGMENT_ARC - 90;
        const endAngle = startAngle + SEGMENT_ARC;
        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;

        const x1 = center + radius * Math.cos(startRad);
        const y1 = center + radius * Math.sin(startRad);
        const x2 = center + radius * Math.cos(endRad);
        const y2 = center + radius * Math.sin(endRad);

        const largeArc = SEGMENT_ARC > 180 ? 1 : 0;

        return (
          <path
            key={i}
            d={`M${center},${center} L${x1},${y1} A${radius},${radius} 0 ${largeArc},1 ${x2},${y2} Z`}
            fill={seg.color}
            stroke="#1F2937"
            strokeWidth="1.5"
          />
        );
      })}

      {/* Labels */}
      {SEGMENTS.map((seg, i) => (
        <SegmentLabel key={i} segment={seg} index={i} />
      ))}

      {/* Center circle */}
      <circle cx={center} cy={center} r="22" fill="#1F2937" stroke="#D4AF37" strokeWidth="3" />
      <circle cx={center} cy={center} r="16" fill="#D4AF37" />
      <text x={center} y={center} textAnchor="middle" dominantBaseline="central" fill="#1A1A1A" fontSize="10" fontWeight="bold">
        SPIN
      </text>
    </svg>
  );
}

function WinCelebration({ segment }: { segment: WheelSegment }) {
  const particles = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 300 - 150,
      y: Math.random() * -200 - 50,
      rotate: Math.random() * 720,
      delay: Math.random() * 0.3,
      color: ['#D4AF37', '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1'][i % 5],
    })),
  []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
    >
      {/* Particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute w-2 h-2 rounded-sm"
          style={{ backgroundColor: p.color }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: p.x,
            y: [0, p.y * 0.3, p.y],
            opacity: [1, 1, 0],
            rotate: p.rotate,
            scale: [1, 1.5, 0],
          }}
          transition={{ duration: 1.5, delay: p.delay, ease: 'easeOut' }}
        />
      ))}

      {/* Win badge */}
      <motion.div
        initial={{ scale: 0, rotate: -15 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.2 }}
        className="px-6 py-3 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-600 shadow-2xl shadow-yellow-500/40"
      >
        <div className="flex items-center gap-2">
          {segment.type !== 'mystery' ? (
            <SuccessCheckmark isVisible size={24} />
          ) : (
            <Sparkles size={20} className="text-white" />
          )}
          <span className="text-lg font-bold text-white">
            {segment.type === 'mystery'
              ? 'Mystery Box!'
              : segment.type === 'diamonds'
                ? `${segment.value} Diamonds!`
                : <><AnimatedChipCount value={segment.value} className="text-lg font-bold text-white" /> Chips!</>}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

function HistoryPanel({ history }: { history: SpinHistoryEntry[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-3">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mx-auto"
        whileTap={{ scale: 0.95 }}
      >
        <History size={12} />
        <span>Recent Wins</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={12} />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-1.5">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 border border-white/5"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: entry.segment.color }}
                    />
                    <span className="text-xs text-gray-300 font-medium">
                      {entry.segment.type === 'mystery'
                        ? 'Mystery Box'
                        : entry.segment.type === 'diamonds'
                          ? `${entry.segment.value} Diamonds`
                          : <><AnimatedChipCount value={entry.segment.value} className="text-xs text-gray-300 font-medium" /> Chips</>}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-600">
                    {entry.timestamp.toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Main Component ---

export function SpinWheel({
  isOpen,
  onClose,
  onSpin,
  freeSpinsRemaining = 1,
  diamondBalance = 45,
  spinCostDiamonds = 10,
  history = DEFAULT_HISTORY,
}: SpinWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<WheelSegment | null>(null);
  const [showWin, setShowWin] = useState(false);
  const [spinsLeft, setSpinsLeft] = useState(freeSpinsRemaining);

  const canSpin = !isSpinning && (spinsLeft > 0 || diamondBalance >= spinCostDiamonds);
  const isFree = spinsLeft > 0;

  const handleSpin = useCallback(() => {
    if (!canSpin || isSpinning) return;

    setIsSpinning(true);
    setResult(null);
    setShowWin(false);

    const winIndex = getWeightedResult();
    // Calculate final rotation: multiple full spins + offset to land on segment
    // Pointer is at top (0 degrees). Segment center = index * 45 + 22.5
    // We need to rotate so that the winning segment is under the pointer
    const segmentCenter = winIndex * SEGMENT_ARC + SEGMENT_ARC / 2;
    const targetRotation = 360 - segmentCenter; // Align segment to top
    const fullSpins = 5 + Math.floor(Math.random() * 3); // 5-7 full rotations
    const totalRotation = rotation + fullSpins * 360 + targetRotation + Math.random() * 10 - 5;

    setRotation(totalRotation);

    if (isFree) {
      setSpinsLeft((prev) => Math.max(0, prev - 1));
    }

    // Wait for animation to complete
    setTimeout(() => {
      setIsSpinning(false);
      setResult(SEGMENTS[winIndex]);
      setShowWin(true);
      onSpin(SEGMENTS[winIndex]);

      // Hide celebration after delay
      setTimeout(() => setShowWin(false), 2500);
    }, 4000); // Match the animation duration
  }, [canSpin, isSpinning, rotation, isFree, onSpin]);

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
            {/* Win celebration overlay */}
            <AnimatePresence>
              {showWin && result && <WinCelebration segment={result} />}
            </AnimatePresence>

            {/* Header */}
            <div className="relative px-5 pt-5 pb-3">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors z-10"
              >
                <X size={16} />
              </motion.button>

              <div className="flex flex-col items-center gap-1">
                <motion.div
                  initial={{ rotate: -15, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg shadow-yellow-500/30"
                >
                  <Gift size={24} className="text-white" />
                </motion.div>
                <h2 className="text-lg font-bold text-white">Lucky Spin</h2>
                <p className="text-xs text-gray-500">Spin to win amazing rewards!</p>
              </div>
            </div>

            {/* Free spin / diamond balance info */}
            <div className="flex items-center justify-center gap-3 px-5 mb-3">
              {spinsLeft > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-900/30 border border-green-500/20">
                  <RotateCcw size={12} className="text-green-400" />
                  <span className="text-xs font-bold text-green-400">
                    {spinsLeft} Free Spin{spinsLeft !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-900/20 border border-purple-500/15">
                <Diamond size={12} className="text-purple-400" />
                <span className="text-xs font-bold text-purple-300">{diamondBalance}</span>
              </div>
            </div>

            {/* Wheel */}
            <div className="relative flex items-center justify-center px-5 py-2">
              {/* Outer glow */}
              <div className="absolute w-72 h-72 rounded-full bg-yellow-500/5 blur-xl" />

              {/* Pointer */}
              <WheelPointer />

              {/* Spinning wheel */}
              <motion.div
                animate={{ rotate: rotation }}
                transition={{
                  duration: 4,
                  ease: [0.2, 0.8, 0.3, 1], // Custom easing for realistic deceleration
                }}
                className="relative"
              >
                <WheelSVG />
              </motion.div>
            </div>

            {/* Spin button */}
            <div className="px-5 pb-4 pt-2">
              <PressableButton
                onClick={handleSpin}
                disabled={!canSpin}
                variant={canSpin ? 'primary' : 'ghost'}
                className={cn(
                  'w-full py-3.5 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all',
                  canSpin
                    ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-black shadow-lg shadow-yellow-500/20'
                    : 'bg-white/5 text-gray-600 cursor-not-allowed',
                )}
              >
                {isSpinning ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    >
                      <RotateCcw size={18} />
                    </motion.div>
                    Spinning...
                  </>
                ) : isFree ? (
                  <>
                    <Gift size={18} />
                    Free Spin!
                  </>
                ) : (
                  <>
                    <Diamond size={16} />
                    Spin ({spinCostDiamonds} Diamonds)
                  </>
                )}
              </PressableButton>

              {!isFree && !canSpin && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-xs text-gray-600 mt-2"
                >
                  Not enough diamonds for another spin
                </motion.p>
              )}
            </div>

            {/* Next free spin countdown */}
            {spinsLeft === 0 && (
              <div className="flex items-center justify-center gap-1.5 px-5 pb-3">
                <Clock size={12} className="text-gray-500" />
                <span className="text-xs text-gray-500">
                  Next free spin in <span className="font-mono font-bold text-gray-400">23:45:12</span>
                </span>
              </div>
            )}

            {/* History */}
            <div className="px-5 pb-5">
              <HistoryPanel history={history} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
