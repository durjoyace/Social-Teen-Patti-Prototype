import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  Trophy,
  AlertTriangle,
  Minus,
  Lightbulb,
  Eye,
  EyeOff,
  TrendingUp,
  X,
  BarChart3,
  Target,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { AnimatedChipCount } from './PolishTouches';
import { cn } from '../utils/cn';
import { formatChips } from '../game/gameEngine';
import type { HandAnalysis, HandHistoryEntry, OptimalActionStep, Verdict } from '../services/gameCoach';
import type { ActionType, HandRank } from '../types';

// ─── Props ──────────────────────────────────────────────────────────────

interface PostHandAnalysisProps {
  entry: HandHistoryEntry;
  analysis: HandAnalysis;
  isVisible: boolean;
  onDismiss: () => void;
  coachingEnabled: boolean;
  onToggleCoaching: () => void;
  /** Cumulative optimal play percentage across all hands */
  overallOptimalRate?: number;
}

// ─── Constants ──────────────────────────────────────────────────────────

const VERDICT_CONFIG: Record<Verdict, { bg: string; border: string; text: string; icon: typeof Trophy; iconColor: string }> = {
  good: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    icon: Trophy,
    iconColor: 'text-emerald-400',
  },
  bad: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    icon: AlertTriangle,
    iconColor: 'text-red-400',
  },
  neutral: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    icon: Minus,
    iconColor: 'text-amber-400',
  },
};

const HAND_RANK_LABELS: Record<HandRank, string> = {
  high_card: 'High Card',
  pair: 'Pair',
  color: 'Color',
  sequence: 'Sequence',
  pure_sequence: 'Pure Sequence',
  trail: 'Trail',
};

const ACTION_LABELS: Record<ActionType, string> = {
  boot: 'Ante',
  blind: 'Blind',
  chaal: 'Chaal',
  pack: 'Pack',
  show: 'Show',
  sideshow: 'Sideshow',
  sideshow_accept: 'Accept',
  sideshow_reject: 'Reject',
  raise: 'Raise',
  timeout: 'Timeout',
};

// ─── Component ──────────────────────────────────────────────────────────

export function PostHandAnalysis({
  entry,
  analysis,
  isVisible,
  onDismiss,
  coachingEnabled,
  onToggleCoaching,
  overallOptimalRate = 0,
}: PostHandAnalysisProps) {
  const [expanded, setExpanded] = useState(false);

  if (!coachingEnabled) return null;

  const verdictStyle = VERDICT_CONFIG[analysis.verdict];
  const VerdictIcon = verdictStyle.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onDismiss}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />

          {/* Slide-up card */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-hidden"
          >
            <div className="bg-gradient-to-b from-gray-900 to-gray-950 rounded-t-3xl border-t border-white/10 shadow-2xl">
              {/* Drag indicator */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              {/* Header */}
              <div className="px-5 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn('p-2 rounded-xl', verdictStyle.bg, verdictStyle.border, 'border')}>
                      <VerdictIcon size={20} className={verdictStyle.iconColor} />
                    </div>
                    <div>
                      <h3 className={cn('text-lg font-bold', verdictStyle.text)}>
                        {analysis.verdictLabel}
                      </h3>
                      <p className="text-xs text-white/50">
                        {entry.handResult.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={onToggleCoaching}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                      title="Toggle coaching"
                    >
                      {coachingEnabled ? (
                        <Eye size={16} className="text-white/40" />
                      ) : (
                        <EyeOff size={16} className="text-white/40" />
                      )}
                    </button>
                    <button
                      onClick={onDismiss}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <X size={16} className="text-white/40" />
                    </button>
                  </div>
                </div>

                {/* Explanation */}
                <p className="text-sm text-white/70 mb-4 leading-relaxed">
                  {analysis.explanation}
                </p>

                {/* Key metrics row */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <MetricCard
                    label="Hand Strength"
                    value={`${Math.round(analysis.handStrength * 100)}%`}
                    color={analysis.handStrength >= 0.5 ? 'emerald' : analysis.handStrength >= 0.3 ? 'amber' : 'red'}
                  />
                  <MetricCard
                    label="Optimal Play"
                    value={`${analysis.optimalPlayPercentage}%`}
                    color={analysis.optimalPlayPercentage >= 80 ? 'emerald' : analysis.optimalPlayPercentage >= 50 ? 'amber' : 'red'}
                  />
                  <div className={cn(
                    'rounded-xl p-3 border text-center',
                    entry.result === 'win'
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                      : entry.result === 'fold'
                        ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                        : 'text-red-400 bg-red-500/10 border-red-500/20'
                  )}>
                    <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Result</p>
                    <p className="text-base font-bold">
                      {entry.result === 'win' ? (
                        <AnimatedChipCount value={entry.chipsWon} prefix="+" className="text-emerald-400" />
                      ) : entry.result === 'fold' ? (
                        'Folded'
                      ) : (
                        <AnimatedChipCount value={entry.chipsLost} prefix="-" className="text-red-400" />
                      )}
                    </p>
                  </div>
                </div>

                {/* Hand strength gauge */}
                <HandStrengthGauge strength={analysis.handStrength} rank={entry.handResult.rank} />

                {/* Action comparison summary */}
                {analysis.optimalActions.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
                      Your Actions vs. Optimal
                    </h4>
                    <div className="space-y-2">
                      {analysis.optimalActions.slice(0, expanded ? undefined : 2).map((step, i) => (
                        <ActionComparison key={i} step={step} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Expand/Collapse */}
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="w-full mt-4 py-2 flex items-center justify-center gap-1 text-sm text-white/40 hover:text-white/60 transition-colors"
                >
                  {expanded ? (
                    <>
                      <ChevronUp size={16} />
                      Less detail
                    </>
                  ) : (
                    <>
                      <ChevronDown size={16} />
                      More detail
                    </>
                  )}
                </button>
              </div>

              {/* Expanded detail section */}
              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-y-auto max-h-[40vh]"
                  >
                    <div className="px-5 pb-6 space-y-5 border-t border-white/5 pt-4">
                      {/* Pot odds */}
                      <DetailSection
                        icon={BarChart3}
                        title="Pot Odds"
                        content={
                          <div>
                            <p className="text-sm text-white/60 mb-2">
                              Pot odds tell you if a call is mathematically profitable.
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-amber-400">
                                {(analysis.potOdds * 100).toFixed(1)}%
                              </span>
                              <span className="text-xs text-white/40">
                                (your bet / pot)
                              </span>
                            </div>
                            <p className="text-xs text-white/40 mt-1">
                              {analysis.potOdds < 0.3
                                ? 'Great odds — you only need to win occasionally to profit.'
                                : analysis.potOdds < 0.5
                                  ? 'Reasonable odds — need a decent hand to justify continuing.'
                                  : 'Expensive — you need a strong hand to call profitably.'}
                            </p>
                          </div>
                        }
                      />

                      {/* EV summary */}
                      <DetailSection
                        icon={TrendingUp}
                        title="Expected Value"
                        content={
                          <p className="text-sm text-white/60">
                            {analysis.evSummary}
                          </p>
                        }
                      />

                      {/* Tips */}
                      <DetailSection
                        icon={Lightbulb}
                        title="Tips"
                        content={
                          <ul className="space-y-2">
                            {analysis.tips.map((tip, i) => (
                              <li key={i} className="flex gap-2 text-sm text-white/60">
                                <span className="text-amber-400/70 mt-0.5 shrink-0">
                                  <Target size={14} />
                                </span>
                                {tip}
                              </li>
                            ))}
                          </ul>
                        }
                      />

                      {/* Overall stat */}
                      {overallOptimalRate > 0 && (
                        <div className="bg-white/5 rounded-xl p-3 text-center">
                          <p className="text-xs text-white/40 mb-1">Overall Optimal Play Rate</p>
                          <p className="text-lg font-bold text-amber-400">
                            {overallOptimalRate}%
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: 'emerald' | 'amber' | 'red';
}) {
  const colorMap = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
  };

  return (
    <div className={cn('rounded-xl p-3 border text-center', colorMap[color])}>
      <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-base font-bold">{value}</p>
    </div>
  );
}

function HandStrengthGauge({ strength, rank }: { strength: number; rank: HandRank }) {
  const pct = Math.round(strength * 100);
  const color =
    pct >= 70 ? 'bg-emerald-500' :
    pct >= 40 ? 'bg-amber-500' :
    'bg-red-500';

  const glowColor =
    pct >= 70 ? 'shadow-emerald-500/30' :
    pct >= 40 ? 'shadow-amber-500/30' :
    'shadow-red-500/30';

  return (
    <div className="bg-white/5 rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">
          Hand Strength
        </span>
        <span className="text-xs text-white/50">
          {HAND_RANK_LABELS[rank]}
        </span>
      </div>
      <div className="h-3 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={cn('h-full rounded-full shadow-lg', color, glowColor)}
        />
      </div>
      <div className="flex justify-between mt-1.5 text-[10px] text-white/30">
        <span>Weak</span>
        <span className="text-white/50 font-medium">{pct}%</span>
        <span>Monster</span>
      </div>
    </div>
  );
}

function ActionComparison({ step }: { step: OptimalActionStep }) {
  return (
    <div className={cn(
      'flex items-center gap-3 rounded-lg p-2.5 text-sm',
      step.wasOptimal ? 'bg-emerald-500/5' : 'bg-red-500/5'
    )}>
      <div className="shrink-0">
        {step.wasOptimal ? (
          <CheckCircle2 size={16} className="text-emerald-400" />
        ) : (
          <XCircle size={16} className="text-red-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-white/40">R{step.round}</span>
          <span className={cn(
            'font-medium',
            step.wasOptimal ? 'text-white/70' : 'text-red-400'
          )}>
            You: {ACTION_LABELS[step.yourAction]}
          </span>
          {!step.wasOptimal && (
            <>
              <span className="text-white/20">/</span>
              <span className="text-emerald-400 font-medium">
                Pro: {ACTION_LABELS[step.optimalAction]}
              </span>
            </>
          )}
        </div>
        {!step.wasOptimal && (
          <p className="text-[11px] text-white/40 mt-0.5 truncate">
            {step.reasoning}
          </p>
        )}
      </div>
    </div>
  );
}

function DetailSection({
  icon: Icon,
  title,
  content,
}: {
  icon: typeof BarChart3;
  title: string;
  content: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className="text-amber-400/70" />
        <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider">
          {title}
        </h4>
      </div>
      {content}
    </div>
  );
}
