import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../utils/cn';
import type { PlayStyleProfile, PlayStyleLabel, HandHistoryEntry } from '../services/gameCoach';
import { getPlayStyleProfile } from '../services/gameCoach';

// ─── Types ──────────────────────────────────────────────────────────────

interface PlayStyleRadarProps {
  profile: PlayStyleProfile;
  /** Previous profile snapshot for trend comparison */
  previousProfile?: PlayStyleProfile;
  /** Full history for trend calculation */
  history?: HandHistoryEntry[];
  className?: string;
}

interface RadarDimension {
  key: keyof Pick<PlayStyleProfile, 'aggression' | 'tightness' | 'bluffFrequency' | 'blindPlayRate' | 'showdownRate'>;
  label: string;
  shortLabel: string;
  tooltip: string;
}

// ─── Constants ──────────────────────────────────────────────────────────

const DIMENSIONS: RadarDimension[] = [
  {
    key: 'aggression',
    label: 'Aggression',
    shortLabel: 'AGG',
    tooltip: 'How often you raise instead of calling. High aggression pressures opponents but risks more chips.',
  },
  {
    key: 'tightness',
    label: 'Tightness',
    shortLabel: 'TGT',
    tooltip: 'How selective you are with starting hands. Tight players fold weak hands early, preserving chips for premium spots.',
  },
  {
    key: 'bluffFrequency',
    label: 'Bluff Frequency',
    shortLabel: 'BLF',
    tooltip: 'How often you bet aggressively with weak cards. A balanced bluff frequency keeps opponents guessing.',
  },
  {
    key: 'blindPlayRate',
    label: 'Blind Play',
    shortLabel: 'BLD',
    tooltip: 'How often you play without looking at your cards. Blind play halves your bet and adds mystique, but limits information.',
  },
  {
    key: 'showdownRate',
    label: 'Showdown Rate',
    shortLabel: 'SHW',
    tooltip: 'How often you reach the final show. High showdown rate means you commit to hands; low means you fold or win before show.',
  },
];

const PRO_AVERAGE: Record<string, number> = {
  aggression: 0.45,
  tightness: 0.50,
  bluffFrequency: 0.15,
  blindPlayRate: 0.30,
  showdownRate: 0.40,
};

const PERSONALITY_CONFIG: Record<PlayStyleLabel, { emoji: string; color: string; description: string }> = {
  'The Shark': {
    emoji: '🦈',
    color: 'text-blue-400',
    description: 'Selectively aggressive. You pick your spots and strike hard with strong hands.',
  },
  'The Rock': {
    emoji: '🪨',
    color: 'text-gray-400',
    description: 'Very tight and conservative. You rarely bluff and only play premium hands.',
  },
  'The Maniac': {
    emoji: '🔥',
    color: 'text-red-400',
    description: 'Hyper-aggressive and unpredictable. You play lots of hands and raise often.',
  },
  'The Calling Station': {
    emoji: '📞',
    color: 'text-yellow-400',
    description: 'You call frequently but rarely raise. Opponents can exploit your passivity.',
  },
  'The Fox': {
    emoji: '🦊',
    color: 'text-orange-400',
    description: 'Tricky and balanced. You mix bluffs with value bets to keep opponents guessing.',
  },
  'The Newbie': {
    emoji: '🌱',
    color: 'text-emerald-400',
    description: 'Still developing your style. Play more hands to unlock your personality profile.',
  },
};

// ─── SVG Radar Chart ────────────────────────────────────────────────────

const SIZE = 260;
const CENTER = SIZE / 2;
const RADIUS = 100;
const LABEL_OFFSET = 24;

function polarToCartesian(angle: number, radius: number): { x: number; y: number } {
  // Start from top (- PI/2) and go clockwise
  const rad = (angle - 90) * (Math.PI / 180);
  return {
    x: CENTER + radius * Math.cos(rad),
    y: CENTER + radius * Math.sin(rad),
  };
}

function buildPolygonPoints(values: number[]): string {
  const step = 360 / values.length;
  return values
    .map((v, i) => {
      const { x, y } = polarToCartesian(i * step, v * RADIUS);
      return `${x},${y}`;
    })
    .join(' ');
}

function RadarChart({
  values,
  proValues,
  showPro,
}: {
  values: number[];
  proValues: number[];
  showPro: boolean;
}) {
  const step = 360 / DIMENSIONS.length;
  const rings = [0.25, 0.5, 0.75, 1.0];

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto">
      {/* Background rings */}
      {rings.map((r) => (
        <polygon
          key={r}
          points={buildPolygonPoints(DIMENSIONS.map(() => r))}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={1}
        />
      ))}

      {/* Axis lines */}
      {DIMENSIONS.map((_, i) => {
        const { x, y } = polarToCartesian(i * step, RADIUS);
        return (
          <line
            key={i}
            x1={CENTER}
            y1={CENTER}
            x2={x}
            y2={y}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={1}
          />
        );
      })}

      {/* Pro average polygon */}
      {showPro && (
        <motion.polygon
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          points={buildPolygonPoints(proValues)}
          fill="rgba(139,92,246,0.08)"
          stroke="rgba(139,92,246,0.4)"
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />
      )}

      {/* Player polygon */}
      <motion.polygon
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
        points={buildPolygonPoints(values)}
        fill="rgba(217,169,56,0.15)"
        stroke="rgba(217,169,56,0.8)"
        strokeWidth={2}
      />

      {/* Player data points */}
      {values.map((v, i) => {
        const { x, y } = polarToCartesian(i * step, v * RADIUS);
        return (
          <motion.circle
            key={i}
            initial={{ r: 0 }}
            animate={{ r: 4 }}
            transition={{ delay: 0.3 + i * 0.1, duration: 0.3 }}
            cx={x}
            cy={y}
            fill="#D9A938"
            stroke="#1a1a2e"
            strokeWidth={2}
          />
        );
      })}

      {/* Axis labels */}
      {DIMENSIONS.map((dim, i) => {
        const { x, y } = polarToCartesian(i * step, RADIUS + LABEL_OFFSET);
        return (
          <text
            key={dim.key}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[10px] font-semibold fill-white/50"
          >
            {dim.shortLabel}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Component ──────────────────────────────────────────────────────────

export function PlayStyleRadar({
  profile,
  previousProfile,
  history,
  className,
}: PlayStyleRadarProps) {
  const [showPro, setShowPro] = useState(true);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const values = DIMENSIONS.map(d => profile[d.key]);
  const proValues = DIMENSIONS.map(d => PRO_AVERAGE[d.key]);

  // Compute trend for each dimension
  const trends = useMemo(() => {
    if (!previousProfile) return DIMENSIONS.map(() => 0);
    return DIMENSIONS.map(d => {
      const diff = profile[d.key] - previousProfile[d.key];
      return diff;
    });
  }, [profile, previousProfile]);

  // Historical trend (split history into halves and compare)
  const historicalTrend = useMemo(() => {
    if (!history || history.length < 10) return null;
    const mid = Math.floor(history.length / 2);
    const firstHalf = history.slice(0, mid);
    const secondHalf = history.slice(mid);
    const firstProfile = getPlayStyleProfile(firstHalf);
    const secondProfile = getPlayStyleProfile(secondHalf);
    return DIMENSIONS.map(d => ({
      key: d.key,
      label: d.label,
      change: secondProfile[d.key] - firstProfile[d.key],
    }));
  }, [history]);

  const personalityInfo = PERSONALITY_CONFIG[profile.personality];

  return (
    <div className={cn('bg-gradient-to-b from-gray-900 to-gray-950 rounded-2xl border border-white/5 overflow-hidden', className)}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-bold text-white">Play Style</h3>
          <button
            onClick={() => setShowPro(!showPro)}
            className={cn(
              'text-xs px-3 py-1 rounded-full transition-colors',
              showPro
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : 'bg-white/5 text-white/40 border border-white/10'
            )}
          >
            {showPro ? 'Pro Avg On' : 'Pro Avg Off'}
          </button>
        </div>

        {/* Personality badge */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-lg">{personalityInfo.emoji}</span>
          <span className={cn('text-sm font-bold', personalityInfo.color)}>
            {profile.personality}
          </span>
        </div>
        <p className="text-xs text-white/40 mt-1 leading-relaxed">
          {personalityInfo.description}
        </p>
      </div>

      {/* Radar chart */}
      <div className="px-2 py-2">
        <RadarChart values={values} proValues={proValues} showPro={showPro} />
      </div>

      {/* Legend */}
      <div className="px-5 pb-2 flex items-center justify-center gap-4 text-[10px]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-amber-500 rounded-full" />
          <span className="text-white/40">You</span>
        </div>
        {showPro && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-purple-400 rounded-full border-dashed" style={{ borderTop: '1.5px dashed rgba(139,92,246,0.6)' }} />
            <span className="text-white/40">Pro Average</span>
          </div>
        )}
      </div>

      {/* Dimension details */}
      <div className="px-4 pb-4 space-y-1">
        {DIMENSIONS.map((dim, i) => {
          const value = profile[dim.key];
          const proVal = PRO_AVERAGE[dim.key];
          const trend = trends[i];
          const diff = value - proVal;

          return (
            <div key={dim.key}>
              <button
                onClick={() => setActiveTooltip(activeTooltip === dim.key ? null : dim.key)}
                className="w-full flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <span className="text-xs text-white/50 w-20 text-left truncate">{dim.label}</span>
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${value * 100}%` }}
                    transition={{ duration: 0.6, delay: i * 0.1 }}
                    className="h-full bg-amber-500 rounded-full"
                  />
                </div>
                <span className="text-xs font-mono text-white/40 w-8 text-right">
                  {Math.round(value * 100)}
                </span>
                {trend !== 0 && (
                  <span className="shrink-0">
                    {trend > 0.05 ? (
                      <TrendingUp size={12} className="text-emerald-400" />
                    ) : trend < -0.05 ? (
                      <TrendingDown size={12} className="text-red-400" />
                    ) : (
                      <Minus size={12} className="text-white/20" />
                    )}
                  </span>
                )}
                <Info size={12} className="text-white/20 shrink-0" />
              </button>

              {/* Tooltip */}
              <AnimatePresence>
                {activeTooltip === dim.key && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 py-2 mx-2 mb-1 bg-white/5 rounded-lg">
                      <p className="text-[11px] text-white/50 leading-relaxed">
                        {dim.tooltip}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-[10px]">
                        <span className="text-amber-400">
                          You: {Math.round(value * 100)}%
                        </span>
                        <span className="text-purple-400">
                          Pro: {Math.round(proVal * 100)}%
                        </span>
                        <span className={cn(
                          diff > 0.1 ? 'text-emerald-400' :
                          diff < -0.1 ? 'text-red-400' :
                          'text-white/30'
                        )}>
                          {diff > 0 ? '+' : ''}{Math.round(diff * 100)} vs pro
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Historical trends */}
      {historicalTrend && (
        <div className="px-5 pb-5 border-t border-white/5 pt-4">
          <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
            Trend (First Half vs Second Half)
          </h4>
          <div className="flex flex-wrap gap-2">
            {historicalTrend.map(t => (
              <div
                key={t.key}
                className={cn(
                  'text-[11px] px-2.5 py-1 rounded-full border',
                  t.change > 0.05
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : t.change < -0.05
                      ? 'bg-red-500/10 border-red-500/20 text-red-400'
                      : 'bg-white/5 border-white/10 text-white/30'
                )}
              >
                {t.label}: {t.change > 0 ? '+' : ''}{Math.round(t.change * 100)}%
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
