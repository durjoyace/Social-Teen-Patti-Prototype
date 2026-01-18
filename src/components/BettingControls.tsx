import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, XCircle, TrendingUp, Users, Sparkles, Minus, Plus, Coins } from 'lucide-react';
import { ActionType } from '../types';
import { cn } from '../utils/cn';
import { formatChips } from '../game/gameEngine';
import { useHaptics } from '../hooks/useHaptics';

interface BettingControlsProps {
  availableActions: ActionType[];
  currentBet: number;
  minBet: number;
  maxBet: number;
  isBlind: boolean;
  playerChips: number;
  pot: number;
  onAction: (action: ActionType, amount?: number) => void;
  disabled?: boolean;
}

const actionConfig: Record<ActionType, {
  label: string;
  shortLabel: string;
  icon: typeof Coins;
  gradient: string;
  description: string;
}> = {
  blind: {
    label: 'Play Blind',
    shortLabel: 'Blind',
    icon: EyeOff,
    gradient: 'from-blue-500 to-blue-700',
    description: 'Bet without seeing your cards'
  },
  chaal: {
    label: 'Chaal',
    shortLabel: 'Chaal',
    icon: Eye,
    gradient: 'from-green-500 to-green-700',
    description: 'See your cards and bet'
  },
  raise: {
    label: 'Raise',
    shortLabel: 'Raise',
    icon: TrendingUp,
    gradient: 'from-yellow-500 to-orange-600',
    description: 'Double the current bet'
  },
  pack: {
    label: 'Pack',
    shortLabel: 'Pack',
    icon: XCircle,
    gradient: 'from-red-500 to-red-700',
    description: 'Fold your hand'
  },
  show: {
    label: 'Show',
    shortLabel: 'Show',
    icon: Sparkles,
    gradient: 'from-purple-500 to-purple-700',
    description: 'Compare cards to win'
  },
  sideshow: {
    label: 'Sideshow',
    shortLabel: 'Side',
    icon: Users,
    gradient: 'from-pink-500 to-pink-700',
    description: 'Private compare with previous player'
  },
  boot: {
    label: 'Boot',
    shortLabel: 'Boot',
    icon: Coins,
    gradient: 'from-gray-500 to-gray-700',
    description: 'Initial bet'
  }
};

// Quick bet buttons
const QUICK_BET_MULTIPLIERS = [1, 2, 5, 10];

export function BettingControls({
  availableActions,
  currentBet,
  minBet,
  maxBet,
  isBlind,
  playerChips,
  pot,
  onAction,
  disabled
}: BettingControlsProps) {
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);
  const [customBet, setCustomBet] = useState(currentBet);
  const [showBetSlider, setShowBetSlider] = useState(false);
  const { onButtonPress } = useHaptics();

  // Calculate bet amount for current action
  const baseBetAmount = isBlind ? currentBet : currentBet * 2;

  // Handle action selection
  const handleActionSelect = useCallback((action: ActionType) => {
    onButtonPress();

    if (action === 'pack' || action === 'show' || action === 'sideshow') {
      // These actions don't need bet amount
      onAction(action);
      return;
    }

    if (action === 'raise') {
      setSelectedAction(action);
      setShowBetSlider(true);
      setCustomBet(baseBetAmount * 2);
    } else {
      // Blind or Chaal with current bet
      onAction(action, baseBetAmount);
    }
  }, [onAction, baseBetAmount, onButtonPress]);

  // Handle bet confirmation
  const handleBetConfirm = useCallback(() => {
    if (selectedAction) {
      onAction(selectedAction, customBet);
      setSelectedAction(null);
      setShowBetSlider(false);
    }
  }, [selectedAction, customBet, onAction]);

  // Adjust custom bet
  const adjustBet = useCallback((multiplier: number) => {
    const newBet = Math.min(Math.max(baseBetAmount * multiplier, minBet), Math.min(maxBet, playerChips));
    setCustomBet(newBet);
    onButtonPress();
  }, [baseBetAmount, minBet, maxBet, playerChips, onButtonPress]);

  // Increment/decrement bet
  const incrementBet = useCallback((amount: number) => {
    setCustomBet(prev => Math.min(Math.max(prev + amount, minBet), Math.min(maxBet, playerChips)));
    onButtonPress();
  }, [minBet, maxBet, playerChips, onButtonPress]);

  // Primary actions (always visible)
  const primaryActions = useMemo(() => {
    return availableActions.filter(a => ['chaal', 'blind', 'pack'].includes(a));
  }, [availableActions]);

  // Secondary actions (show, sideshow, raise)
  const secondaryActions = useMemo(() => {
    return availableActions.filter(a => ['raise', 'show', 'sideshow'].includes(a));
  }, [availableActions]);

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-0 left-0 right-0 z-30"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-gray-900/98 to-transparent backdrop-blur-xl" />

      {/* Content */}
      <div className="relative px-4 pt-4 pb-8 max-w-lg mx-auto">
        {/* Pot and chips info */}
        <div className="flex items-center justify-between mb-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-white/50">Pot:</span>
            <span className="text-yellow-400 font-bold">₹{formatChips(pot)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="text-white font-medium">₹{formatChips(playerChips)}</span>
          </div>
        </div>

        {/* Bet slider (when raising) */}
        <AnimatePresence>
          {showBetSlider && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                {/* Bet amount display */}
                <div className="flex items-center justify-center gap-4 mb-4">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => incrementBet(-minBet)}
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
                  >
                    <Minus className="w-5 h-5 text-white" />
                  </motion.button>

                  <div className="text-center">
                    <p className="text-3xl font-bold text-yellow-400">₹{formatChips(customBet)}</p>
                    <p className="text-xs text-white/50">Raise Amount</p>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => incrementBet(minBet)}
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
                  >
                    <Plus className="w-5 h-5 text-white" />
                  </motion.button>
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min={baseBetAmount}
                  max={Math.min(maxBet, playerChips)}
                  step={minBet}
                  value={customBet}
                  onChange={(e) => setCustomBet(Number(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-yellow-500"
                />

                {/* Quick bet buttons */}
                <div className="flex gap-2 mt-4">
                  {QUICK_BET_MULTIPLIERS.map((mult) => (
                    <button
                      key={mult}
                      onClick={() => adjustBet(mult)}
                      className={cn(
                        'flex-1 py-2 rounded-xl text-sm font-medium transition-all',
                        customBet === baseBetAmount * mult
                          ? 'bg-yellow-500 text-yellow-900'
                          : 'bg-white/10 text-white/70 hover:bg-white/15'
                      )}
                    >
                      {mult}x
                    </button>
                  ))}
                  <button
                    onClick={() => setCustomBet(Math.min(maxBet, playerChips))}
                    className={cn(
                      'flex-1 py-2 rounded-xl text-sm font-medium transition-all',
                      customBet === Math.min(maxBet, playerChips)
                        ? 'bg-red-500 text-white'
                        : 'bg-white/10 text-white/70 hover:bg-white/15'
                    )}
                  >
                    All In
                  </button>
                </div>

                {/* Confirm/Cancel */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => {
                      setShowBetSlider(false);
                      setSelectedAction(null);
                    }}
                    className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleBetConfirm}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold"
                  >
                    Raise ₹{formatChips(customBet)}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Secondary actions */}
        {!showBetSlider && secondaryActions.length > 0 && (
          <div className="flex gap-2 mb-3">
            {secondaryActions.map((action) => {
              const config = actionConfig[action];
              const Icon = config.icon;
              return (
                <motion.button
                  key={action}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleActionSelect(action)}
                  disabled={disabled}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl',
                    'bg-white/10 text-white/80 font-medium text-sm',
                    'hover:bg-white/15 transition-colors',
                    disabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {config.shortLabel}
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Primary actions */}
        {!showBetSlider && (
          <div className="flex gap-2">
            {primaryActions.map((action, index) => {
              const config = actionConfig[action];
              const Icon = config.icon;
              const betAmount = action === 'pack' ? undefined : baseBetAmount;

              return (
                <motion.button
                  key={action}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleActionSelect(action)}
                  disabled={disabled}
                  className={cn(
                    'relative flex-1 flex flex-col items-center justify-center py-4 rounded-2xl',
                    `bg-gradient-to-b ${config.gradient}`,
                    'shadow-lg overflow-hidden',
                    disabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {/* Shine effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.5 }}
                  />

                  <Icon className="w-6 h-6 text-white mb-1" />
                  <span className="text-white font-bold">{config.shortLabel}</span>
                  {betAmount !== undefined && (
                    <span className="text-white/70 text-xs">₹{formatChips(betAmount)}</span>
                  )}
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Status info */}
        <div className="flex items-center justify-center gap-2 mt-3 text-xs text-white/50">
          <span>Current bet: ₹{formatChips(currentBet)}</span>
          <span>•</span>
          <span className={isBlind ? 'text-blue-400' : 'text-green-400'}>
            {isBlind ? 'Playing Blind' : 'Seen'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// Compact action bar for smaller screens
export function CompactActionBar({
  onChaal,
  onPack,
  onRaise,
  betAmount,
  disabled
}: {
  onChaal: () => void;
  onPack: () => void;
  onRaise: () => void;
  betAmount: number;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-xl bg-black/60 backdrop-blur-sm">
      <button
        onClick={onPack}
        disabled={disabled}
        className="p-2 rounded-lg bg-red-500/20 text-red-400"
      >
        <XCircle className="w-5 h-5" />
      </button>

      <button
        onClick={onChaal}
        disabled={disabled}
        className="flex-1 py-2 px-4 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white font-medium text-sm"
      >
        Chaal ₹{formatChips(betAmount)}
      </button>

      <button
        onClick={onRaise}
        disabled={disabled}
        className="p-2 rounded-lg bg-yellow-500/20 text-yellow-400"
      >
        <TrendingUp className="w-5 h-5" />
      </button>
    </div>
  );
}
