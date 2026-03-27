import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Brain,
  TrendingUp,
  Target,
  Shield,
  AlertTriangle,
  Zap,
  Trophy,
  Coins,
  BarChart3,
  Flame,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { formatChips } from '../game/gameEngine';
import { PlayStyleRadar } from '../components/PlayStyleRadar';
import { HandHistoryPanel } from '../components/HandHistoryPanel';
import { PostHandAnalysis } from '../components/PostHandAnalysis';
import {
  generateMockHandHistory,
  getPlayStyleProfile,
  computeSessionStats,
  type HandHistoryEntry,
  type SessionStats,
} from '../services/gameCoach';

// ─── Types ──────────────────────────────────────────────────────────────

interface CoachingScreenProps {
  onBack: () => void;
  onPractice?: () => void;
}

type Tab = 'overview' | 'history' | 'style';

// ─── Component ──────────────────────────────────────────────────────────

export function CoachingScreen({ onBack, onPractice }: CoachingScreenProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [coachingEnabled, setCoachingEnabled] = useState(true);
  const [selectedHand, setSelectedHand] = useState<HandHistoryEntry | null>(null);

  // Generate mock data (in production, this comes from game state/store)
  const history = useMemo(() => generateMockHandHistory(30), []);
  const profile = useMemo(() => getPlayStyleProfile(history), [history]);
  const stats = useMemo(() => computeSessionStats(history), [history]);

  // Previous profile for trend comparison (first half of games)
  const previousProfile = useMemo(() => {
    const firstHalf = history.slice(0, Math.floor(history.length / 2));
    return getPlayStyleProfile(firstHalf);
  }, [history]);

  return (
    <div className="h-full flex flex-col bg-gray-950">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 bg-gradient-to-b from-gray-900 to-gray-950 border-b border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <ArrowLeft size={18} className="text-white/60" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <Brain size={20} className="text-amber-400" />
                AI Coach
              </h1>
              <p className="text-xs text-white/30">Your personal Teen Patti analyst</p>
            </div>
          </div>
          <PerformanceBadge score={stats.performanceScore} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1">
          {([
            { key: 'overview', label: 'Overview', icon: BarChart3 },
            { key: 'history', label: 'History', icon: Flame },
            { key: 'style', label: 'Style', icon: Target },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors',
                activeTab === tab.key
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'text-white/30 hover:text-white/50'
              )}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <OverviewTab
                stats={stats}
                profile={profile}
                history={history}
                coachingEnabled={coachingEnabled}
                onToggleCoaching={() => setCoachingEnabled(!coachingEnabled)}
                onPractice={onPractice}
              />
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="p-4"
            >
              <HandHistoryPanel
                history={history}
                onSelectHand={setSelectedHand}
              />
            </motion.div>
          )}

          {activeTab === 'style' && (
            <motion.div
              key="style"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="p-4"
            >
              <PlayStyleRadar
                profile={profile}
                previousProfile={previousProfile}
                history={history}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Post-hand analysis overlay */}
      {selectedHand && selectedHand.analysis && (
        <PostHandAnalysis
          entry={selectedHand}
          analysis={selectedHand.analysis}
          isVisible={!!selectedHand}
          onDismiss={() => setSelectedHand(null)}
          coachingEnabled={coachingEnabled}
          onToggleCoaching={() => setCoachingEnabled(!coachingEnabled)}
          overallOptimalRate={stats.optimalPlayRate}
        />
      )}
    </div>
  );
}

// ─── Overview Tab ───────────────────────────────────────────────────────

function OverviewTab({
  stats,
  profile,
  history,
  coachingEnabled,
  onToggleCoaching,
  onPractice,
}: {
  stats: SessionStats;
  profile: ReturnType<typeof getPlayStyleProfile>;
  history: HandHistoryEntry[];
  coachingEnabled: boolean;
  onToggleCoaching: () => void;
  onPractice?: () => void;
}) {
  return (
    <div className="p-4 space-y-4">
      {/* Performance score card */}
      <div className="bg-gradient-to-br from-amber-900/20 to-gray-900 rounded-2xl border border-amber-500/10 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-amber-400/60 uppercase tracking-wider font-semibold mb-1">
              Performance Score
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-amber-400">
                {stats.performanceScore}
              </span>
              <span className="text-lg text-white/20">/100</span>
            </div>
          </div>
          <PerformanceRing score={stats.performanceScore} size={64} />
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-3">
          <QuickStat label="Hands" value={stats.handsPlayed.toString()} icon={BarChart3} />
          <QuickStat label="Win Rate" value={`${stats.winRate}%`} icon={Trophy} />
          <QuickStat label="Avg Pot" value={formatChips(stats.avgPotSize)} icon={Coins} />
          <QuickStat label="Best Win" value={formatChips(stats.biggestWin)} icon={Sparkles} />
        </div>
      </div>

      {/* Net chips */}
      <div className={cn(
        'rounded-xl p-4 border flex items-center justify-between',
        stats.netChips >= 0
          ? 'bg-emerald-500/5 border-emerald-500/10'
          : 'bg-red-500/5 border-red-500/10'
      )}>
        <div>
          <p className="text-xs text-white/40 mb-0.5">Net Chips This Session</p>
          <p className={cn(
            'text-xl font-bold',
            stats.netChips >= 0 ? 'text-emerald-400' : 'text-red-400'
          )}>
            {stats.netChips >= 0 ? '+' : ''}{formatChips(stats.netChips)}
          </p>
        </div>
        <div className={cn(
          'p-3 rounded-xl',
          stats.netChips >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'
        )}>
          {stats.netChips >= 0
            ? <TrendingUp size={24} className="text-emerald-400" />
            : <TrendingUp size={24} className="text-red-400 rotate-180" />}
        </div>
      </div>

      {/* Optimal play rate */}
      <div className="bg-white/[0.02] rounded-xl border border-white/5 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">
            Optimal Play Rate
          </p>
          <span className={cn(
            'text-sm font-bold',
            stats.optimalPlayRate >= 70 ? 'text-emerald-400' :
            stats.optimalPlayRate >= 50 ? 'text-amber-400' :
            'text-red-400'
          )}>
            {stats.optimalPlayRate}%
          </span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${stats.optimalPlayRate}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={cn(
              'h-full rounded-full',
              stats.optimalPlayRate >= 70 ? 'bg-emerald-500' :
              stats.optimalPlayRate >= 50 ? 'bg-amber-500' :
              'bg-red-500'
            )}
          />
        </div>
      </div>

      {/* Improvement trend (SVG line chart) */}
      {stats.improvementTrend.length >= 2 && (
        <div className="bg-white/[0.02] rounded-xl border border-white/5 p-4">
          <p className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-3">
            Improvement Trend
          </p>
          <TrendChart data={stats.improvementTrend} />
        </div>
      )}

      {/* Strengths */}
      <InsightsSection
        title="Strengths"
        icon={Shield}
        iconColor="text-emerald-400"
        items={stats.strengths}
        bgColor="bg-emerald-500/5"
        borderColor="border-emerald-500/10"
        textColor="text-emerald-400/70"
      />

      {/* Weaknesses */}
      <InsightsSection
        title="Areas to Improve"
        icon={AlertTriangle}
        iconColor="text-red-400"
        items={stats.weaknesses}
        bgColor="bg-red-500/5"
        borderColor="border-red-500/10"
        textColor="text-red-400/70"
      />

      {/* Recent insights */}
      <div className="bg-white/[0.02] rounded-xl border border-white/5 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={14} className="text-amber-400" />
          <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">
            Recent Insights
          </p>
        </div>
        <div className="space-y-2">
          {history.slice(0, 3).map(h => h.analysis?.tips[0]).filter(Boolean).map((tip, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-white/50">
              <span className="text-amber-400/50 mt-0.5 shrink-0">
                <Target size={12} />
              </span>
              <span className="leading-relaxed">{tip}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Coaching toggle */}
      <div className="bg-white/[0.02] rounded-xl border border-white/5 p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-white/70 font-medium">Post-Hand Coaching</p>
          <p className="text-xs text-white/30 mt-0.5">Show analysis after each hand</p>
        </div>
        <button
          onClick={onToggleCoaching}
          className={cn(
            'w-12 h-6 rounded-full transition-colors relative',
            coachingEnabled ? 'bg-amber-500' : 'bg-white/10'
          )}
        >
          <motion.div
            animate={{ x: coachingEnabled ? 24 : 2 }}
            className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
          />
        </button>
      </div>

      {/* Practice mode CTA */}
      {onPractice && (
        <motion.button
          onClick={onPractice}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl p-4 flex items-center justify-between shadow-lg shadow-amber-500/20"
        >
          <div className="text-left">
            <p className="text-sm font-bold text-gray-900">Practice with AI Coach</p>
            <p className="text-xs text-amber-900/60 mt-0.5">
              Play against AI with real-time coaching enabled
            </p>
          </div>
          <ChevronRight size={20} className="text-gray-900/40" />
        </motion.button>
      )}

      {/* Play style mini preview */}
      <div className="bg-white/[0.02] rounded-xl border border-white/5 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target size={14} className="text-amber-400" />
            <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">
              Your Style
            </p>
          </div>
          <span className="text-xs text-amber-400 font-medium">
            {profile.personality}
          </span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {[
            { label: 'AGG', value: profile.aggression },
            { label: 'TGT', value: profile.tightness },
            { label: 'BLF', value: profile.bluffFrequency },
            { label: 'BLD', value: profile.blindPlayRate },
            { label: 'SHW', value: profile.showdownRate },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="h-12 relative flex items-end justify-center mb-1">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${s.value * 100}%` }}
                  transition={{ duration: 0.6 }}
                  className="w-5 bg-amber-500/30 rounded-t border border-amber-500/20"
                />
              </div>
              <p className="text-[9px] text-white/30">{s.label}</p>
              <p className="text-[10px] text-white/50 font-mono">{Math.round(s.value * 100)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────

function PerformanceBadge({ score }: { score: number }) {
  const color = score >= 70 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    : score >= 50 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    : 'text-red-400 bg-red-500/10 border-red-500/20';

  return (
    <div className={cn('px-3 py-1.5 rounded-xl border text-sm font-bold', color)}>
      {score}
    </div>
  );
}

function PerformanceRing({ score, size }: { score: number; size: number }) {
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const center = size / 2;

  const color = score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth={strokeWidth}
      />
      <motion.circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />
    </svg>
  );
}

function QuickStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Trophy;
}) {
  return (
    <div className="text-center">
      <Icon size={14} className="text-amber-400/40 mx-auto mb-1" />
      <p className="text-xs font-bold text-white/70">{value}</p>
      <p className="text-[9px] text-white/30">{label}</p>
    </div>
  );
}

function InsightsSection({
  title,
  icon: Icon,
  iconColor,
  items,
  bgColor,
  borderColor,
  textColor,
}: {
  title: string;
  icon: typeof Shield;
  iconColor: string;
  items: string[];
  bgColor: string;
  borderColor: string;
  textColor: string;
}) {
  return (
    <div className={cn('rounded-xl border p-4', bgColor, borderColor)}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} className={iconColor} />
        <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">
          {title}
        </p>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className={cn('text-xs leading-relaxed flex items-start gap-2', 'text-white/50')}>
            <span className={cn('mt-1 shrink-0', textColor)}>
              <ChevronRight size={10} />
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TrendChart({ data }: { data: number[] }) {
  if (data.length < 2) return null;

  const width = 280;
  const height = 60;
  const padding = { top: 8, bottom: 8, left: 4, right: 4 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxVal = Math.max(...data, 100);
  const minVal = Math.min(...data, 0);
  const range = maxVal - minVal || 1;

  const points = data.map((v, i) => {
    const x = padding.left + (i / (data.length - 1)) * chartW;
    const y = padding.top + chartH - ((v - minVal) / range) * chartH;
    return { x, y };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  // Area fill path
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`;

  // Determine trend direction
  const isUp = data[data.length - 1] >= data[0];
  const strokeColor = isUp ? '#10b981' : '#ef4444';
  const fillColor = isUp ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)';

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map(r => {
        const y = padding.top + chartH - r * chartH;
        return (
          <line
            key={r}
            x1={padding.left}
            y1={y}
            x2={width - padding.right}
            y2={y}
            stroke="rgba(255,255,255,0.03)"
            strokeWidth={1}
          />
        );
      })}

      {/* Area fill */}
      <path d={areaD} fill={fillColor} />

      {/* Line */}
      <motion.path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />

      {/* End point */}
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={3}
        fill={strokeColor}
      />

      {/* Labels */}
      {data.map((v, i) => (
        <text
          key={i}
          x={points[i].x}
          y={height}
          textAnchor="middle"
          className="text-[7px] fill-white/20"
        >
          {v}%
        </text>
      ))}
    </svg>
  );
}
