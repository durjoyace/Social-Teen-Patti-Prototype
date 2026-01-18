import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, XCircle, Coins, TrendingUp, Users, Sparkles } from 'lucide-react';
import { ActionType } from '../types';
import { cn } from '../utils/cn';
import { formatChips } from '../game/gameEngine';

interface ActionButtonsProps {
  availableActions: ActionType[];
  currentBet: number;
  isBlind: boolean;
  chips: number;
  onAction: (action: ActionType, amount?: number) => void;
  disabled?: boolean;
}

const actionConfig: Record<ActionType, {
  label: string;
  icon: typeof Coins;
  gradient: string;
  hoverGradient: string;
  description: string;
}> = {
  blind: {
    label: 'Blind',
    icon: EyeOff,
    gradient: 'from-blue-600 to-blue-800',
    hoverGradient: 'from-blue-500 to-blue-700',
    description: 'Bet without seeing cards'
  },
  chaal: {
    label: 'Chaal',
    icon: Eye,
    gradient: 'from-green-600 to-green-800',
    hoverGradient: 'from-green-500 to-green-700',
    description: 'See cards and bet'
  },
  raise: {
    label: 'Raise',
    icon: TrendingUp,
    gradient: 'from-yellow-600 to-orange-700',
    hoverGradient: 'from-yellow-500 to-orange-600',
    description: 'Double the bet'
  },
  pack: {
    label: 'Pack',
    icon: XCircle,
    gradient: 'from-red-600 to-red-800',
    hoverGradient: 'from-red-500 to-red-700',
    description: 'Fold and exit round'
  },
  show: {
    label: 'Show',
    icon: Sparkles,
    gradient: 'from-purple-600 to-purple-800',
    hoverGradient: 'from-purple-500 to-purple-700',
    description: 'Compare cards to win'
  },
  sideshow: {
    label: 'Sideshow',
    icon: Users,
    gradient: 'from-pink-600 to-pink-800',
    hoverGradient: 'from-pink-500 to-pink-700',
    description: 'Private compare'
  },
  boot: {
    label: 'Boot',
    icon: Coins,
    gradient: 'from-gray-600 to-gray-800',
    hoverGradient: 'from-gray-500 to-gray-700',
    description: 'Initial bet'
  }
};

function ActionButton({
  action,
  amount,
  onClick,
  disabled,
  index
}: {
  action: ActionType;
  amount?: number;
  onClick: () => void;
  disabled?: boolean;
  index: number;
}) {
  const config = actionConfig[action];
  const Icon = config.icon;

  return (
    <motion.button
      initial={{ opacity: 0, y: 30, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.8 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 300 }}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative flex flex-col items-center justify-center px-4 py-3 rounded-2xl',
        'min-w-[80px] overflow-hidden',
        `bg-gradient-to-b ${config.gradient}`,
        'shadow-lg shadow-black/30',
        'border border-white/20',
        'transition-all duration-200',
        disabled && 'opacity-50 cursor-not-allowed grayscale'
      )}
    >
      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent"
        initial={{ x: '-100%' }}
        whileHover={{ x: '100%' }}
        transition={{ duration: 0.5 }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-1">
        <Icon className="w-5 h-5 text-white" />
        <span className="text-sm font-bold text-white">{config.label}</span>
        {amount !== undefined && (
          <span className="text-xs text-white/80">₹{formatChips(amount)}</span>
        )}
      </div>

      {/* Glow on hover */}
      <motion.div
        className={cn('absolute -inset-2 rounded-3xl opacity-0 blur-xl bg-gradient-to-b', config.gradient)}
        whileHover={{ opacity: 0.5 }}
      />
    </motion.button>
  );
}

export function ActionButtons({
  availableActions,
  currentBet,
  isBlind,
  chips,
  onAction,
  disabled
}: ActionButtonsProps) {
  const getAmountForAction = (action: ActionType): number | undefined => {
    const baseAmount = isBlind ? currentBet : currentBet * 2;
    switch (action) {
      case 'blind':
        return currentBet;
      case 'chaal':
        return baseAmount;
      case 'raise':
        return baseAmount * 2;
      case 'show':
        return baseAmount;
      default:
        return undefined;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-0 left-0 right-0 p-4 pb-6"
    >
      {/* Background blur */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent backdrop-blur-sm" />

      {/* Actions container */}
      <div className="relative z-10 max-w-lg mx-auto">
        {/* Chips display */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 mb-3"
        >
          <Coins className="w-4 h-4 text-yellow-400" />
          <span className="text-sm text-yellow-400 font-medium">
            Your chips: ₹{formatChips(chips)}
          </span>
        </motion.div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <AnimatePresence mode="popLayout">
            {availableActions.map((action, index) => (
              <ActionButton
                key={action}
                action={action}
                amount={getAmountForAction(action)}
                onClick={() => onAction(action, getAmountForAction(action))}
                disabled={disabled}
                index={index}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Current bet indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-2 mt-3 text-xs text-white/60"
        >
          <span>Current bet: ₹{formatChips(currentBet)}</span>
          <span>•</span>
          <span>{isBlind ? 'Playing Blind' : 'Seen'}</span>
        </motion.div>
      </div>
    </motion.div>
  );
}

// Quick action for pre-select
export function QuickActions({ onSelect }: { onSelect: (action: ActionType) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex gap-2 p-2 rounded-xl bg-black/40 backdrop-blur-sm"
    >
      {(['chaal', 'raise', 'pack'] as ActionType[]).map((action) => {
        const config = actionConfig[action];
        const Icon = config.icon;
        return (
          <motion.button
            key={action}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onSelect(action)}
            className={cn(
              'p-2 rounded-lg',
              `bg-gradient-to-b ${config.gradient}`,
              'shadow-md'
            )}
          >
            <Icon className="w-4 h-4 text-white" />
          </motion.button>
        );
      })}
    </motion.div>
  );
}
