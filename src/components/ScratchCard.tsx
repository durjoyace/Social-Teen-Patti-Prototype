import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  Gift,
  Diamond,
  Star,
  Palette,
  Coins,
  Zap,
  Eye,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { formatChips } from '../game/gameEngine';

// --- Types ---

type SymbolType = 'chips' | 'diamonds' | 'xp' | 'avatar' | 'theme';

interface CardSymbol {
  type: SymbolType;
  label: string;
  value: number;
  icon: keyof typeof SYMBOL_ICONS;
  color: string;
}

interface ScratchCardProps {
  isOpen: boolean;
  onClose: () => void;
  onReveal: (result: { matched: boolean; symbol?: CardSymbol; count?: number }) => void;
  freeCardsRemaining?: number;
  className?: string;
}

// --- Data ---

const SYMBOL_ICONS = {
  chips: Coins,
  diamonds: Diamond,
  xp: Zap,
  avatar: Star,
  theme: Palette,
} as const;

const SYMBOL_POOL: CardSymbol[] = [
  { type: 'chips', label: '1K Chips', value: 1000, icon: 'chips', color: 'text-yellow-400' },
  { type: 'chips', label: '5K Chips', value: 5000, icon: 'chips', color: 'text-yellow-400' },
  { type: 'chips', label: '10K Chips', value: 10000, icon: 'chips', color: 'text-yellow-500' },
  { type: 'diamonds', label: '3 Diamonds', value: 3, icon: 'diamonds', color: 'text-purple-400' },
  { type: 'diamonds', label: '5 Diamonds', value: 5, icon: 'diamonds', color: 'text-purple-400' },
  { type: 'xp', label: '100 XP', value: 100, icon: 'xp', color: 'text-blue-400' },
  { type: 'xp', label: '500 XP', value: 500, icon: 'xp', color: 'text-blue-400' },
  { type: 'avatar', label: 'Rare Avatar', value: 1, icon: 'avatar', color: 'text-pink-400' },
  { type: 'theme', label: 'Table Theme', value: 1, icon: 'theme', color: 'text-green-400' },
];

// --- Helpers ---

function generateGrid(): { grid: CardSymbol[]; winningSymbol: CardSymbol | null; matchCount: number } {
  // 30% chance of winning (3 matching symbols)
  const isWin = Math.random() < 0.3;

  if (isWin) {
    const winSymbol = SYMBOL_POOL[Math.floor(Math.random() * SYMBOL_POOL.length)];
    const grid: CardSymbol[] = [];

    // Place 3 matching symbols at random positions
    const positions = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    const winPositions: number[] = [];
    for (let i = 0; i < 3; i++) {
      const idx = Math.floor(Math.random() * positions.length);
      winPositions.push(positions[idx]);
      positions.splice(idx, 1);
    }

    for (let i = 0; i < 9; i++) {
      if (winPositions.includes(i)) {
        grid.push(winSymbol);
      } else {
        // Pick a random different symbol
        let sym: CardSymbol;
        do {
          sym = SYMBOL_POOL[Math.floor(Math.random() * SYMBOL_POOL.length)];
        } while (sym.type === winSymbol.type && sym.value === winSymbol.value);
        grid.push(sym);
      }
    }

    return { grid, winningSymbol: winSymbol, matchCount: 3 };
  }

  // No win: ensure no type appears 3+ times
  const grid: CardSymbol[] = [];
  const typeCounts: Record<string, number> = {};

  for (let i = 0; i < 9; i++) {
    let sym: CardSymbol;
    let attempts = 0;
    do {
      sym = SYMBOL_POOL[Math.floor(Math.random() * SYMBOL_POOL.length)];
      attempts++;
    } while ((typeCounts[`${sym.type}_${sym.value}`] || 0) >= 2 && attempts < 50);

    const key = `${sym.type}_${sym.value}`;
    typeCounts[key] = (typeCounts[key] || 0) + 1;
    grid.push(sym);
  }

  return { grid, winningSymbol: null, matchCount: 0 };
}

// --- Sub-components ---

function SparkleEffect({ isActive }: { isActive: boolean }) {
  if (!isActive) return null;

  const sparkles = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        id: i,
        x: Math.random() * 60 - 30,
        y: Math.random() * 60 - 30,
        delay: Math.random() * 0.3,
        scale: 0.5 + Math.random() * 0.5,
      })),
    [],
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {sparkles.map((s) => (
        <motion.div
          key={s.id}
          className="absolute top-1/2 left-1/2"
          initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
          animate={{
            x: s.x,
            y: s.y,
            opacity: [0, 1, 0],
            scale: [0, s.scale, 0],
          }}
          transition={{ duration: 0.6, delay: s.delay }}
        >
          <Sparkles size={10} className="text-yellow-400" />
        </motion.div>
      ))}
    </div>
  );
}

function SymbolCell({
  symbol,
  index,
  isRevealed,
  isWinning,
  onReveal,
}: {
  symbol: CardSymbol;
  index: number;
  isRevealed: boolean;
  isWinning: boolean;
  onReveal: (index: number) => void;
}) {
  const IconComponent = SYMBOL_ICONS[symbol.icon];

  return (
    <motion.button
      onClick={() => onReveal(index)}
      disabled={isRevealed}
      className={cn(
        'relative aspect-square rounded-2xl border-2 flex items-center justify-center overflow-hidden transition-all',
        isRevealed
          ? isWinning
            ? 'border-yellow-500/60 bg-yellow-900/20 shadow-lg shadow-yellow-500/15'
            : 'border-white/10 bg-white/5'
          : 'border-yellow-600/30 bg-gradient-to-br from-yellow-900/40 to-amber-900/30 hover:border-yellow-500/50 cursor-pointer active:scale-95',
      )}
      whileTap={!isRevealed ? { scale: 0.9 } : {}}
      layout
    >
      <AnimatePresence mode="wait">
        {!isRevealed ? (
          <motion.div
            key="hidden"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.5, rotateY: 90 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-0.5"
          >
            {/* Scratch pattern */}
            <div className="relative w-full h-full flex items-center justify-center">
              <div className="absolute inset-2 rounded-lg bg-gradient-to-br from-yellow-700/50 to-amber-800/50 flex items-center justify-center">
                <span className="text-yellow-500/60 text-2xl font-bold">?</span>
              </div>
              {/* Diagonal scratch lines */}
              <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 100">
                <line x1="10" y1="10" x2="90" y2="90" stroke="#D4AF37" strokeWidth="0.5" />
                <line x1="30" y1="10" x2="90" y2="70" stroke="#D4AF37" strokeWidth="0.5" />
                <line x1="10" y1="30" x2="70" y2="90" stroke="#D4AF37" strokeWidth="0.5" />
              </svg>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="revealed"
            initial={{ opacity: 0, scale: 0.5, rotateY: -90 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="flex flex-col items-center gap-1"
          >
            <SparkleEffect isActive={isRevealed && isWinning} />
            <motion.div
              animate={isWinning ? { scale: [1, 1.15, 1] } : {}}
              transition={isWinning ? { repeat: Infinity, duration: 1.5 } : {}}
            >
              <IconComponent size={24} className={symbol.color} />
            </motion.div>
            <span className={cn('text-[9px] font-bold text-center leading-tight', symbol.color)}>
              {symbol.label}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function ResultDisplay({
  hasWon,
  winningSymbol,
}: {
  hasWon: boolean;
  winningSymbol: CardSymbol | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'mx-5 mb-4 p-4 rounded-2xl border text-center',
        hasWon
          ? 'bg-gradient-to-r from-yellow-900/30 to-amber-900/20 border-yellow-500/30'
          : 'bg-white/5 border-white/10',
      )}
    >
      {hasWon && winningSymbol ? (
        <div className="flex flex-col items-center gap-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            <Sparkles size={28} className="text-yellow-400" />
          </motion.div>
          <span className="text-sm font-bold text-yellow-400">You Won!</span>
          <span className="text-xs text-gray-300">
            {winningSymbol.type === 'chips'
              ? `${formatChips(winningSymbol.value)} Chips`
              : winningSymbol.type === 'diamonds'
                ? `${winningSymbol.value} Diamonds`
                : winningSymbol.label}
          </span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm font-bold text-gray-400">No Match</span>
          <span className="text-xs text-gray-600">Try again tomorrow!</span>
        </div>
      )}
    </motion.div>
  );
}

// --- Main Component ---

export function ScratchCard({
  isOpen,
  onClose,
  onReveal,
  freeCardsRemaining = 1,
}: ScratchCardProps) {
  const [gridData] = useState(() => generateGrid());
  const [revealedCells, setRevealedCells] = useState<Set<number>>(new Set());
  const [isComplete, setIsComplete] = useState(false);
  const cardsLeft = freeCardsRemaining;

  const { grid, winningSymbol, matchCount } = gridData;

  // Find which cells are winning (match the winning symbol)
  const winningCells = useMemo(() => {
    if (!winningSymbol) return new Set<number>();
    const cells = new Set<number>();
    grid.forEach((sym, i) => {
      if (sym.type === winningSymbol.type && sym.value === winningSymbol.value) {
        cells.add(i);
      }
    });
    return cells;
  }, [grid, winningSymbol]);

  const handleRevealCell = useCallback(
    (index: number) => {
      if (revealedCells.has(index) || isComplete) return;

      const newRevealed = new Set(revealedCells);
      newRevealed.add(index);
      setRevealedCells(newRevealed);

      // Check if all cells revealed
      if (newRevealed.size === 9) {
        setIsComplete(true);
        onReveal({
          matched: matchCount >= 3,
          symbol: winningSymbol ?? undefined,
          count: matchCount,
        });
      }
    },
    [revealedCells, isComplete, matchCount, winningSymbol, onReveal],
  );

  const handleRevealAll = useCallback(() => {
    if (isComplete) return;
    const allRevealed = new Set(Array.from({ length: 9 }, (_, i) => i));
    setRevealedCells(allRevealed);
    setIsComplete(true);
    onReveal({
      matched: matchCount >= 3,
      symbol: winningSymbol ?? undefined,
      count: matchCount,
    });
  }, [isComplete, matchCount, winningSymbol, onReveal]);

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
                  className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30"
                >
                  <Gift size={24} className="text-white" />
                </motion.div>
                <h2 className="text-lg font-bold text-white">Scratch & Win</h2>
                <p className="text-xs text-gray-500">Match 3 symbols to win a prize!</p>
              </div>
            </div>

            {/* Free cards badge */}
            <div className="flex items-center justify-center gap-3 px-5 mb-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-900/30 border border-green-500/20">
                <Gift size={12} className="text-green-400" />
                <span className="text-xs font-bold text-green-400">
                  {cardsLeft} Free Card{cardsLeft !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Scratch Grid */}
            <div className="px-5 mb-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-yellow-950/30 to-amber-950/20 border border-yellow-600/20">
                <div className="grid grid-cols-3 gap-2">
                  {grid.map((symbol, i) => (
                    <SymbolCell
                      key={i}
                      symbol={symbol}
                      index={i}
                      isRevealed={revealedCells.has(i)}
                      isWinning={winningCells.has(i)}
                      onReveal={handleRevealCell}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Result display (when complete) */}
            <AnimatePresence>
              {isComplete && (
                <ResultDisplay hasWon={matchCount >= 3} winningSymbol={winningSymbol} />
              )}
            </AnimatePresence>

            {/* Action buttons */}
            <div className="px-5 pb-5 space-y-2">
              {!isComplete && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRevealAll}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20"
                >
                  <Eye size={16} />
                  Reveal All
                </motion.button>
              )}

              {isComplete && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="w-full py-3 rounded-2xl bg-white/10 text-white font-bold text-sm flex items-center justify-center gap-2 border border-white/10"
                >
                  Done
                </motion.button>
              )}

              {/* Watch ad hint */}
              {isComplete && cardsLeft === 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-xs text-gray-500"
                >
                  Watch an ad for another free card
                </motion.p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
