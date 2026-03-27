import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Trophy,
  XCircle,
  LogOut,
  ChevronDown,
  ChevronRight,
  Filter,
  Search,
  Share2,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  BarChart3,
  Coins,
  Flame,
  Award,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { formatChips } from '../game/gameEngine';
import { cardToString, getSuitColor } from '../game/deck';
import type { HandHistoryEntry, Verdict } from '../services/gameCoach';
import type { Card, HandRank } from '../types';

// ─── Types ──────────────────────────────────────────────────────────────

interface HandHistoryPanelProps {
  history: HandHistoryEntry[];
  className?: string;
  maxItems?: number;
  onSelectHand?: (entry: HandHistoryEntry) => void;
}

type FilterMode = 'all' | 'wins' | 'losses' | 'folds';
type HandRankFilter = HandRank | 'all';

// ─── Constants ──────────────────────────────────────────────────────────

const VERDICT_BADGE: Record<Verdict, { label: string; className: string }> = {
  good: { label: 'Well Played', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  bad: { label: 'Mistake', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
  neutral: { label: 'Okay', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
};

const RESULT_CONFIG = {
  win: { icon: Trophy, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  loss: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
  fold: { icon: LogOut, color: 'text-amber-400', bg: 'bg-amber-500/10' },
};

const HAND_RANK_LABELS: Record<HandRank, string> = {
  trail: 'Trail',
  pure_sequence: 'Pure Seq',
  sequence: 'Sequence',
  color: 'Color',
  pair: 'Pair',
  high_card: 'High Card',
};

const ACTION_LABELS: Record<string, string> = {
  boot: 'Ante',
  blind: 'Blind',
  chaal: 'Chaal',
  pack: 'Pack',
  show: 'Show',
  sideshow: 'Sideshow',
  raise: 'Raise',
  timeout: 'Timeout',
};

// ─── Component ──────────────────────────────────────────────────────────

export function HandHistoryPanel({
  history,
  className,
  maxItems = 50,
  onSelectHand,
}: HandHistoryPanelProps) {
  const [filter, setFilter] = useState<FilterMode>('all');
  const [handRankFilter, setHandRankFilter] = useState<HandRankFilter>('all');
  const [searchDate, setSearchDate] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [replayingId, setReplayingId] = useState<string | null>(null);
  const [replayStep, setReplayStep] = useState(0);

  // Filter history
  const filteredHistory = useMemo(() => {
    let items = history.slice(0, maxItems);

    if (filter === 'wins') items = items.filter(h => h.result === 'win');
    if (filter === 'losses') items = items.filter(h => h.result === 'loss');
    if (filter === 'folds') items = items.filter(h => h.result === 'fold');

    if (handRankFilter !== 'all') {
      items = items.filter(h => h.handResult.rank === handRankFilter);
    }

    if (searchDate) {
      items = items.filter(h => {
        const d = new Date(h.timestamp);
        const dateStr = d.toISOString().split('T')[0];
        return dateStr === searchDate;
      });
    }

    return items;
  }, [history, filter, handRankFilter, searchDate, maxItems]);

  // Summary stats
  const stats = useMemo(() => {
    const items = history.slice(0, maxItems);
    const wins = items.filter(h => h.result === 'win');
    const totalPot = items.reduce((s, h) => s + h.potSize, 0);
    const bestHand = items.reduce((best, h) => {
      const rankOrder: HandRank[] = ['high_card', 'pair', 'color', 'sequence', 'pure_sequence', 'trail'];
      return rankOrder.indexOf(h.handResult.rank) > rankOrder.indexOf(best.handResult.rank) ? h : best;
    }, items[0]);

    return {
      total: items.length,
      winRate: items.length > 0 ? Math.round((wins.length / items.length) * 100) : 0,
      avgPot: items.length > 0 ? Math.round(totalPot / items.length) : 0,
      bestHand: bestHand?.handResult.description || 'N/A',
    };
  }, [history, maxItems]);

  // Replay controls
  const handleReplayToggle = useCallback((id: string, _totalSteps: number) => {
    if (replayingId === id) {
      setReplayingId(null);
      setReplayStep(0);
    } else {
      setReplayingId(id);
      setReplayStep(0);
    }
  }, [replayingId]);

  const handleShare = useCallback((entry: HandHistoryEntry) => {
    const cardsStr = entry.cards.map(c => cardToString(c)).join(' ');
    const text = `Teen Patti Hand: ${cardsStr} | ${entry.handResult.description} | ${entry.result === 'win' ? `Won ${formatChips(entry.chipsWon)}` : entry.result === 'fold' ? 'Folded' : `Lost ${formatChips(entry.chipsLost)}`}`;
    if (navigator.share) {
      navigator.share({ title: 'My Teen Patti Hand', text }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  }, []);

  return (
    <div className={cn('bg-gradient-to-b from-gray-900 to-gray-950 rounded-2xl border border-white/5 overflow-hidden', className)}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-amber-400" />
            <h3 className="text-base font-bold text-white">Hand History</h3>
            <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
              {filteredHistory.length}
            </span>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors',
              showFilters
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-white/5 text-white/40 border border-white/10'
            )}
          >
            <Filter size={12} />
            Filters
          </button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          <StatPill icon={BarChart3} label="Hands" value={stats.total.toString()} />
          <StatPill icon={Trophy} label="Win %" value={`${stats.winRate}%`} />
          <StatPill icon={Coins} label="Avg Pot" value={formatChips(stats.avgPot)} />
          <StatPill icon={Award} label="Best" value={stats.bestHand.split(' ')[0] || 'N/A'} />
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-3 pb-3">
                {/* Result filter */}
                <div className="flex gap-2">
                  {(['all', 'wins', 'losses', 'folds'] as FilterMode[]).map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={cn(
                        'text-xs px-3 py-1.5 rounded-full border transition-colors capitalize',
                        filter === f
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : 'bg-white/5 text-white/30 border-white/10 hover:bg-white/10'
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                {/* Hand rank filter */}
                <div className="flex gap-2 flex-wrap">
                  {(['all', 'trail', 'pure_sequence', 'sequence', 'color', 'pair', 'high_card'] as (HandRankFilter)[]).map(r => (
                    <button
                      key={r}
                      onClick={() => setHandRankFilter(r)}
                      className={cn(
                        'text-[11px] px-2.5 py-1 rounded-full border transition-colors',
                        handRankFilter === r
                          ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                          : 'bg-white/5 text-white/30 border-white/10 hover:bg-white/10'
                      )}
                    >
                      {r === 'all' ? 'All Ranks' : HAND_RANK_LABELS[r]}
                    </button>
                  ))}
                </div>

                {/* Date search */}
                <div className="flex items-center gap-2">
                  <Search size={14} className="text-white/30" />
                  <input
                    type="date"
                    value={searchDate}
                    onChange={e => setSearchDate(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/60 focus:outline-none focus:border-amber-500/30"
                  />
                  {searchDate && (
                    <button
                      onClick={() => setSearchDate('')}
                      className="text-xs text-white/30 hover:text-white/50"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hand list */}
      <div className="px-3 pb-3 max-h-[500px] overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        {filteredHistory.length === 0 && (
          <div className="text-center py-12 text-white/30 text-sm">
            No hands match your filters.
          </div>
        )}

        {filteredHistory.map((entry, idx) => {
          const isExpanded = expandedId === entry.id;
          const isReplaying = replayingId === entry.id;
          const result = RESULT_CONFIG[entry.result];
          const ResultIcon = result.icon;
          const verdictBadge = entry.coachingVerdict ? VERDICT_BADGE[entry.coachingVerdict] : null;

          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="bg-white/[0.02] rounded-xl border border-white/5 overflow-hidden"
            >
              {/* Main row */}
              <button
                onClick={() => {
                  setExpandedId(isExpanded ? null : entry.id);
                  onSelectHand?.(entry);
                }}
                className="w-full flex items-center gap-3 px-3 py-3 hover:bg-white/[0.03] transition-colors"
              >
                {/* Result icon */}
                <div className={cn('p-1.5 rounded-lg shrink-0', result.bg)}>
                  <ResultIcon size={14} className={result.color} />
                </div>

                {/* Cards */}
                <div className="flex gap-1 shrink-0">
                  {entry.cards.map((card, ci) => (
                    <CardMini key={ci} card={card} />
                  ))}
                </div>

                {/* Info */}
                <div className="flex-1 text-left min-w-0">
                  <p className="text-xs text-white/60 truncate">
                    {entry.handResult.description}
                  </p>
                  <p className="text-[10px] text-white/30 mt-0.5">
                    {formatTime(entry.timestamp)}
                  </p>
                </div>

                {/* Chips result */}
                <div className="text-right shrink-0">
                  <p className={cn(
                    'text-xs font-bold',
                    entry.result === 'win' ? 'text-emerald-400' :
                    entry.result === 'fold' ? 'text-white/30' :
                    'text-red-400'
                  )}>
                    {entry.result === 'win'
                      ? `+${formatChips(entry.chipsWon)}`
                      : entry.result === 'fold'
                        ? 'Folded'
                        : `-${formatChips(entry.chipsLost)}`}
                  </p>
                  {verdictBadge && (
                    <span className={cn(
                      'text-[9px] px-1.5 py-0.5 rounded-full border mt-0.5 inline-block',
                      verdictBadge.className
                    )}>
                      {verdictBadge.label}
                    </span>
                  )}
                </div>

                {/* Expand arrow */}
                <div className="shrink-0 text-white/20">
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
              </button>

              {/* Expanded detail */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 border-t border-white/5 pt-3 space-y-3">
                      {/* Meta */}
                      <div className="grid grid-cols-3 gap-2">
                        <MiniStat label="Pot" value={formatChips(entry.potSize)} />
                        <MiniStat label="Opponents" value={entry.opponentCount.toString()} />
                        <MiniStat label="Blind" value={entry.wasBlind ? 'Yes' : 'No'} />
                      </div>

                      {/* Opponents */}
                      {entry.opponentNames && entry.opponentNames.length > 0 && (
                        <div className="text-[11px] text-white/30">
                          vs. {entry.opponentNames.join(', ')}
                        </div>
                      )}

                      {/* Action sequence */}
                      <div>
                        <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2 font-semibold">
                          Action Sequence
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {entry.actions
                            .filter(a => a.playerId === 'self')
                            .map((action, ai) => {
                              const isActive = isReplaying && ai === replayStep;
                              return (
                                <motion.div
                                  key={ai}
                                  animate={isActive ? { scale: 1.15, y: -2 } : { scale: 1, y: 0 }}
                                  className={cn(
                                    'text-[11px] px-2.5 py-1 rounded-full border flex items-center gap-1',
                                    isActive
                                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                                      : 'bg-white/5 text-white/40 border-white/10'
                                  )}
                                >
                                  <span className="text-white/20 text-[9px]">R{action.round}</span>
                                  <span>{ACTION_LABELS[action.action] || action.action}</span>
                                  {action.amount > 0 && (
                                    <span className="text-white/20">{formatChips(action.amount)}</span>
                                  )}
                                </motion.div>
                              );
                            })}
                        </div>
                      </div>

                      {/* Coaching analysis snippet */}
                      {entry.analysis && (
                        <div className="bg-white/[0.03] rounded-lg p-3">
                          <p className="text-xs text-white/50 leading-relaxed">
                            {entry.analysis.explanation}
                          </p>
                          {entry.analysis.tips.length > 0 && (
                            <p className="text-[11px] text-amber-400/70 mt-2 flex items-start gap-1">
                              <Flame size={12} className="shrink-0 mt-0.5" />
                              {entry.analysis.tips[0]}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReplayToggle(entry.id, entry.actions.filter(a => a.playerId === 'self').length);
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/5 text-white/40 text-xs hover:bg-white/10 transition-colors"
                        >
                          {isReplaying ? <Pause size={12} /> : <Play size={12} />}
                          {isReplaying ? 'Stop' : 'Replay'}
                        </button>

                        {isReplaying && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setReplayStep(Math.max(0, replayStep - 1));
                              }}
                              className="p-2 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 transition-colors"
                            >
                              <SkipBack size={12} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const max = entry.actions.filter(a => a.playerId === 'self').length - 1;
                                setReplayStep(Math.min(max, replayStep + 1));
                              }}
                              className="p-2 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 transition-colors"
                            >
                              <SkipForward size={12} />
                            </button>
                          </>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare(entry);
                          }}
                          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-white/5 text-white/40 text-xs hover:bg-white/10 transition-colors"
                        >
                          <Share2 size={12} />
                          Share
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────

function CardMini({ card }: { card: Card }) {
  const color = getSuitColor(card.suit);
  const suitSymbol: Record<string, string> = {
    hearts: '\u2665',
    diamonds: '\u2666',
    clubs: '\u2663',
    spades: '\u2660',
  };

  return (
    <div className={cn(
      'w-7 h-10 rounded flex flex-col items-center justify-center text-[10px] font-bold border',
      'bg-white/[0.08] border-white/10',
      color === 'red' ? 'text-red-400' : 'text-white/70'
    )}>
      <span className="leading-none">{card.rank}</span>
      <span className="leading-none text-[8px]">{suitSymbol[card.suit]}</span>
    </div>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BarChart3;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white/[0.03] rounded-lg p-2 text-center">
      <Icon size={12} className="text-white/20 mx-auto mb-1" />
      <p className="text-xs font-bold text-white/60">{value}</p>
      <p className="text-[9px] text-white/25">{label}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/5 rounded-lg p-2 text-center">
      <p className="text-[10px] text-white/30 mb-0.5">{label}</p>
      <p className="text-xs font-bold text-white/60">{value}</p>
    </div>
  );
}

function formatTime(date: Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
