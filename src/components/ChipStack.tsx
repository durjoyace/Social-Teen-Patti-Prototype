import { motion } from 'framer-motion';
import { cn } from '../utils/cn';
import { formatChips } from '../game/gameEngine';

interface ChipStackProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg';
  showAmount?: boolean;
  animate?: boolean;
  className?: string;
}

const chipColors = [
  { min: 0, bg: 'from-gray-400 to-gray-600', ring: 'ring-gray-300' },
  { min: 100, bg: 'from-blue-500 to-blue-700', ring: 'ring-blue-300' },
  { min: 500, bg: 'from-green-500 to-green-700', ring: 'ring-green-300' },
  { min: 1000, bg: 'from-red-500 to-red-700', ring: 'ring-red-300' },
  { min: 5000, bg: 'from-purple-500 to-purple-700', ring: 'ring-purple-300' },
  { min: 10000, bg: 'from-yellow-500 to-yellow-600', ring: 'ring-yellow-300' },
  { min: 50000, bg: 'from-pink-500 to-pink-700', ring: 'ring-pink-300' },
  { min: 100000, bg: 'from-cyan-400 to-cyan-600', ring: 'ring-cyan-300' },
];

function getChipColor(amount: number) {
  for (let i = chipColors.length - 1; i >= 0; i--) {
    if (amount >= chipColors[i].min) {
      return chipColors[i];
    }
  }
  return chipColors[0];
}

const sizeClasses = {
  sm: { chip: 'w-6 h-6', text: 'text-[8px]', stack: 'h-2' },
  md: { chip: 'w-10 h-10', text: 'text-xs', stack: 'h-3' },
  lg: { chip: 'w-14 h-14', text: 'text-sm', stack: 'h-4' }
};

function Chip({ amount, size = 'md', index = 0 }: { amount: number; size?: 'sm' | 'md' | 'lg'; index?: number }) {
  const color = getChipColor(amount);
  const sizes = sizeClasses[size];

  return (
    <motion.div
      initial={{ y: -20, opacity: 0, rotateX: 90 }}
      animate={{ y: 0, opacity: 1, rotateX: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 400, damping: 20 }}
      className={cn(
        'rounded-full relative',
        `bg-gradient-to-b ${color.bg}`,
        'shadow-lg',
        sizes.chip
      )}
    >
      {/* Outer ring */}
      <div className={cn(
        'absolute inset-1 rounded-full border-2 border-dashed border-white/40'
      )} />

      {/* Inner circle with value pattern */}
      <div className="absolute inset-2 rounded-full bg-gradient-to-b from-white/30 to-transparent flex items-center justify-center">
        <span className={cn('font-bold text-white drop-shadow', sizes.text)}>
          {amount >= 1000 ? '●' : '◆'}
        </span>
      </div>

      {/* Shine */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/30 to-transparent" />

      {/* Edge detail */}
      <div className="absolute inset-0 rounded-full ring-2 ring-inset ring-white/20" />
    </motion.div>
  );
}

export function ChipStack({ amount, size = 'md', showAmount = true, animate = true, className }: ChipStackProps) {
  const stackHeight = Math.min(5, Math.ceil(amount / 1000));
  const sizes = sizeClasses[size];

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div className="relative">
        {Array.from({ length: stackHeight }).map((_, index) => (
          <motion.div
            key={index}
            className="absolute"
            style={{
              bottom: index * (size === 'sm' ? 4 : size === 'md' ? 6 : 8),
              zIndex: index
            }}
            initial={animate ? { scale: 0, y: 20 } : false}
            animate={{ scale: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Chip amount={amount} size={size} index={index} />
          </motion.div>
        ))}
        <div className={cn('invisible', sizes.chip)} />
      </div>

      {showAmount && (
        <motion.span
          initial={animate ? { opacity: 0, y: 5 } : false}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'font-bold text-yellow-400 drop-shadow-lg',
            size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'
          )}
        >
          ₹{formatChips(amount)}
        </motion.span>
      )}
    </div>
  );
}

// Animated pot display
interface PotDisplayProps {
  amount: number;
  label?: string;
  className?: string;
}

export function PotDisplay({ amount, label = 'POT', className }: PotDisplayProps) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        'flex flex-col items-center gap-2 p-4 rounded-2xl',
        'bg-gradient-to-b from-black/40 to-black/60 backdrop-blur-sm',
        'border border-yellow-500/30',
        className
      )}
    >
      {/* Chips visualization */}
      <div className="flex items-end gap-1">
        <ChipStack amount={Math.floor(amount * 0.3)} size="sm" showAmount={false} />
        <ChipStack amount={Math.floor(amount * 0.5)} size="md" showAmount={false} />
        <ChipStack amount={Math.floor(amount * 0.2)} size="sm" showAmount={false} />
      </div>

      {/* Amount display */}
      <div className="text-center">
        <span className="text-xs text-yellow-500/80 uppercase tracking-wider">{label}</span>
        <motion.div
          key={amount}
          initial={{ scale: 1.2, color: '#22c55e' }}
          animate={{ scale: 1, color: '#facc15' }}
          className="text-2xl font-bold text-yellow-400"
        >
          ₹{formatChips(amount)}
        </motion.div>
      </div>

      {/* Glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-yellow-500/10 blur-xl -z-10" />
    </motion.div>
  );
}

// Chip animation for betting
export function FlyingChips({
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
  return (
    <motion.div
      className="fixed pointer-events-none z-50"
      initial={{ x: from.x, y: from.y, scale: 1, opacity: 1 }}
      animate={{ x: to.x, y: to.y, scale: 0.5, opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      onAnimationComplete={onComplete}
    >
      <ChipStack amount={amount} size="sm" showAmount={false} animate={false} />
    </motion.div>
  );
}
