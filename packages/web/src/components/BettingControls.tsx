import { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, XCircle, TrendingUp, Users, Sparkles, Minus, Plus, Coins } from 'lucide-react';
import type { ActionType } from '../types';
import { cn } from '../utils/cn';
import { formatChips } from '../game/gameEngine';
import { useHaptics } from '../hooks/useHaptics';
import { AnimatedChipCount, PressableButton, SlideUpSheet } from './PolishTouches';

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

interface ActionConfig {
  label: string;
  shortLabel: string;
  icon: typeof Coins;
  description: string;
  tone: string;
}

const actionConfig: Record<ActionType, ActionConfig> = {
  blind: {
    label: 'Play Blind', shortLabel: 'Blind', icon: EyeOff,
    description: 'Bet without seeing your cards',
    tone: 'border-[#E8B04A] bg-[#E8B04A] text-[#07110E]',
  },
  chaal: {
    label: 'Play Chaal', shortLabel: 'Chaal', icon: Eye,
    description: 'Bet after seeing your cards',
    tone: 'border-[#E8B04A] bg-[#E8B04A] text-[#07110E]',
  },
  raise: {
    label: 'Raise', shortLabel: 'Raise', icon: TrendingUp,
    description: 'Increase the current bet',
    tone: 'border-[#E8B04A]/55 bg-[#1A2B24] text-[#F6ECD8]',
  },
  pack: {
    label: 'Pack hand', shortLabel: 'Pack', icon: XCircle,
    description: 'Fold this hand',
    tone: 'border-[#B74035]/65 bg-[#2A1714] text-[#F2B1A9]',
  },
  show: {
    label: 'Request show', shortLabel: 'Show', icon: Sparkles,
    description: 'Compare the remaining hands',
    tone: 'border-[#E8B04A]/55 bg-[#1A2B24] text-[#F6ECD8]',
  },
  sideshow: {
    label: 'Request sideshow', shortLabel: 'Sideshow', icon: Users,
    description: 'Compare privately with the previous player',
    tone: 'border-[#E8B04A]/55 bg-[#1A2B24] text-[#F6ECD8]',
  },
  boot: {
    label: 'Pay boot', shortLabel: 'Boot', icon: Coins,
    description: 'Place the opening stake',
    tone: 'border-[#E8B04A] bg-[#E8B04A] text-[#07110E]',
  },
  sideshow_accept: {
    label: 'Accept sideshow', shortLabel: 'Accept', icon: Eye,
    description: 'Accept the private comparison',
    tone: 'border-[#5E9B75]/70 bg-[#173B2A] text-[#DDF2E5]',
  },
  sideshow_reject: {
    label: 'Reject sideshow', shortLabel: 'Reject', icon: XCircle,
    description: 'Decline the private comparison',
    tone: 'border-[#B74035]/65 bg-[#2A1714] text-[#F2B1A9]',
  },
  timeout: {
    label: 'Turn timed out', shortLabel: 'Timeout', icon: Coins,
    description: 'This turn has timed out',
    tone: 'border-white/15 bg-white/5 text-white/55',
  },
};

const QUICK_BET_MULTIPLIERS = [1, 2, 5, 10];
const IMMEDIATE_ACTIONS: ActionType[] = [
  'pack', 'show', 'sideshow', 'sideshow_accept', 'sideshow_reject', 'timeout',
];
const PRIMARY_ACTIONS: ActionType[] = ['chaal', 'blind', 'pack', 'boot'];

export function BettingControls({
  availableActions,
  currentBet,
  minBet,
  maxBet,
  isBlind,
  playerChips,
  pot,
  onAction,
  disabled,
}: BettingControlsProps) {
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);
  const [customBet, setCustomBet] = useState(currentBet);
  const [showBetSlider, setShowBetSlider] = useState(false);
  const { onButtonPress } = useHaptics();

  const baseBetAmount = isBlind ? currentBet : currentBet * 2;
  const betCeiling = Math.max(minBet, Math.min(maxBet, playerChips));
  const minimumRaise = Math.min(betCeiling, Math.max(baseBetAmount, minBet));

  const handleActionSelect = useCallback((action: ActionType) => {
    onButtonPress();

    if (IMMEDIATE_ACTIONS.includes(action)) {
      onAction(action);
      return;
    }

    if (action === 'raise') {
      setSelectedAction(action);
      setCustomBet(Math.min(betCeiling, Math.max(minimumRaise, baseBetAmount * 2)));
      setShowBetSlider(true);
      return;
    }

    onAction(action, Math.min(baseBetAmount, playerChips));
  }, [baseBetAmount, betCeiling, minimumRaise, onAction, onButtonPress, playerChips]);

  const handleBetConfirm = useCallback(() => {
    if (!selectedAction) return;
    onAction(selectedAction, customBet);
    setSelectedAction(null);
    setShowBetSlider(false);
  }, [selectedAction, customBet, onAction]);

  const adjustBet = useCallback((multiplier: number) => {
    setCustomBet(Math.min(Math.max(baseBetAmount * multiplier, minimumRaise), betCeiling));
    onButtonPress();
  }, [baseBetAmount, betCeiling, minimumRaise, onButtonPress]);

  const incrementBet = useCallback((amount: number) => {
    setCustomBet((previous) => Math.min(Math.max(previous + amount, minimumRaise), betCeiling));
    onButtonPress();
  }, [betCeiling, minimumRaise, onButtonPress]);

  const primaryActions = useMemo(
    () => availableActions.filter((action) => PRIMARY_ACTIONS.includes(action)),
    [availableActions],
  );
  const secondaryActions = useMemo(
    () => availableActions.filter((action) => !PRIMARY_ACTIONS.includes(action)),
    [availableActions],
  );

  const closeRaiseSheet = () => {
    setShowBetSlider(false);
    setSelectedAction(null);
  };

  return (
    <motion.section
      aria-label="Table actions"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[#E8B04A]/20 bg-[#07110E]/95 shadow-[0_-18px_45px_rgba(0,0,0,0.42)] backdrop-blur-xl"
    >
      <div className="mx-auto max-w-2xl px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 sm:px-5">
        <div className="mb-3 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-sm">
          <p className="flex items-center gap-2">
            <span className="text-[#A8B5AF]">Table pot</span>
            <AnimatedChipCount value={pot} prefix="◉ " className="font-bold text-[#E8B04A]" />
          </p>
          <p className="flex items-center gap-2">
            <Coins aria-hidden="true" className="h-4 w-4 text-[#E8B04A]" />
            <span className="sr-only">Your stack:</span>
            <AnimatedChipCount value={playerChips} prefix="◉ " className="font-semibold text-[#F6ECD8]" />
          </p>
        </div>

        <SlideUpSheet isOpen={showBetSlider} onClose={closeRaiseSheet} title="Set your raise" snapPoints={[0.48, 0.68]}>
          <div className="space-y-5">
            <div className="flex items-center justify-center gap-5">
              <PressableButton
                onClick={() => incrementBet(-minBet)}
                variant="secondary"
                disabled={customBet <= minimumRaise}
                className="flex h-12 w-12 items-center justify-center rounded-full p-0"
                ariaLabel={`Decrease raise by ${formatChips(minBet)}`}
              >
                <Minus aria-hidden="true" className="h-5 w-5" />
              </PressableButton>

              <div className="min-w-36 text-center">
                <AnimatedChipCount value={customBet} prefix="◉ " className="text-3xl font-bold text-[#E8B04A]" duration={200} />
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[#A8B5AF]">Raise amount</p>
              </div>

              <PressableButton
                onClick={() => incrementBet(minBet)}
                variant="secondary"
                disabled={customBet >= betCeiling}
                className="flex h-12 w-12 items-center justify-center rounded-full p-0"
                ariaLabel={`Increase raise by ${formatChips(minBet)}`}
              >
                <Plus aria-hidden="true" className="h-5 w-5" />
              </PressableButton>
            </div>

            <label className="block">
              <span className="sr-only">Raise amount</span>
              <input
                type="range"
                min={minimumRaise}
                max={betCeiling}
                step={minBet}
                value={customBet}
                onChange={(event) => setCustomBet(Number(event.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-[#E8B04A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B04A] focus-visible:ring-offset-4 focus-visible:ring-offset-[#0E1B17]"
              />
            </label>

            <div className="grid grid-cols-5 gap-2" aria-label="Quick raise amounts">
              {QUICK_BET_MULTIPLIERS.map((multiplier) => (
                <PressableButton
                  key={multiplier}
                  onClick={() => adjustBet(multiplier)}
                  variant={customBet === Math.min(baseBetAmount * multiplier, betCeiling) ? 'primary' : 'ghost'}
                  className="rounded-lg px-2 py-2.5 text-sm"
                  ariaLabel={`Set raise to ${multiplier} times the bet`}
                >
                  {multiplier}×
                </PressableButton>
              ))}
              <PressableButton
                onClick={() => setCustomBet(betCeiling)}
                variant={customBet === betCeiling ? 'danger' : 'ghost'}
                className="rounded-lg px-2 py-2.5 text-xs"
                ariaLabel={`Set raise to all in, ${formatChips(betCeiling)}`}
              >
                All in
              </PressableButton>
            </div>

            <PressableButton onClick={handleBetConfirm} variant="primary" className="w-full rounded-xl py-4 text-base">
              Raise <AnimatedChipCount value={customBet} prefix="◉ " className="font-bold" duration={200} />
            </PressableButton>
          </div>
        </SlideUpSheet>

        {!showBetSlider && secondaryActions.length > 0 && (
          <div className="mb-2 grid grid-cols-2 gap-2 sm:flex" aria-label="More table actions">
            {secondaryActions.map((action) => {
              const config = actionConfig[action];
              const Icon = config.icon;
              return (
                <motion.button
                  type="button"
                  key={action}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleActionSelect(action)}
                  disabled={disabled || action === 'timeout'}
                  aria-label={`${config.label}. ${config.description}`}
                  className={cn(
                    'flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B04A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#07110E]',
                    config.tone,
                    (disabled || action === 'timeout') && 'cursor-not-allowed opacity-45',
                  )}
                >
                  <Icon aria-hidden="true" className="h-4 w-4" />
                  {config.shortLabel}
                </motion.button>
              );
            })}
          </div>
        )}

        {!showBetSlider && (
          <div className="flex gap-2">
            {primaryActions.map((action, index) => {
              const config = actionConfig[action];
              const Icon = config.icon;
              const betAmount = action === 'pack' ? undefined : Math.min(baseBetAmount, playerChips);

              return (
                <motion.button
                  type="button"
                  key={action}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleActionSelect(action)}
                  disabled={disabled}
                  aria-label={`${config.label}. ${config.description}${betAmount === undefined ? '' : `. Bet ${formatChips(betAmount)}`}`}
                  className={cn(
                    'flex min-h-[68px] flex-1 flex-col items-center justify-center rounded-xl border px-2 py-3 shadow-[0_8px_22px_rgba(0,0,0,0.2)] transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6ECD8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#07110E]',
                    config.tone,
                    disabled && 'cursor-not-allowed opacity-45',
                  )}
                >
                  <Icon aria-hidden="true" className="mb-1 h-5 w-5" />
                  <span className="font-bold">{config.shortLabel}</span>
                  {betAmount !== undefined && <span className="text-xs opacity-75">◉ {formatChips(betAmount)}</span>}
                </motion.button>
              );
            })}
          </div>
        )}

        <p aria-live="polite" className="mt-2.5 flex items-center justify-center gap-2 text-xs text-[#A8B5AF]">
          <span>Current bet <AnimatedChipCount value={currentBet} prefix="◉ " className="text-xs text-[#C9D3CE]" /></span>
          <span aria-hidden="true">·</span>
          <span className={isBlind ? 'text-[#E8B04A]' : 'text-[#8FC7A5]'}>{isBlind ? 'Playing blind' : 'Cards seen'}</span>
        </p>
      </div>
    </motion.section>
  );
}

export function CompactActionBar({
  onChaal,
  onPack,
  onRaise,
  betAmount,
  disabled,
}: {
  onChaal: () => void;
  onPack: () => void;
  onRaise: () => void;
  betAmount: number;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#07110E]/90 p-2 backdrop-blur-sm">
      <PressableButton onClick={onPack} disabled={disabled} variant="danger" className="rounded-lg p-2" ariaLabel="Pack hand">
        <XCircle aria-hidden="true" className="h-5 w-5" />
      </PressableButton>

      <PressableButton onClick={onChaal} disabled={disabled} variant="primary" className="flex-1 rounded-lg px-4 py-2" ariaLabel={`Play chaal for ${formatChips(betAmount)}`}>
        Chaal <AnimatedChipCount value={betAmount} prefix="◉ " className="text-sm font-medium" duration={200} />
      </PressableButton>

      <PressableButton onClick={onRaise} disabled={disabled} variant="secondary" className="rounded-lg p-2 text-[#E8B04A]" ariaLabel="Raise bet">
        <TrendingUp aria-hidden="true" className="h-5 w-5" />
      </PressableButton>
    </div>
  );
}
