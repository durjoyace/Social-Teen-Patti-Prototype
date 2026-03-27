import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scroll,
  Clock,
  Check,
  Sparkles,
  Gamepad2,
  Trophy,
  Eye,
  Send,
  Coins,
  Zap,
  Star,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { formatChips } from '../game/gameEngine';

// --- Types ---

type QuestType = 'play_games' | 'win_games' | 'play_blind' | 'send_gifts' | 'win_chips';
type QuestPeriod = 'daily' | 'weekly';

interface Quest {
  id: string;
  type: QuestType;
  description: string;
  target: number;
  progress: number;
  reward: { chips: number; xp: number };
  isClaimed: boolean;
  period: QuestPeriod;
}

interface QuestPanelProps {
  onClaimQuest: (questId: string, reward: { chips: number; xp: number }) => void;
  dailyQuests?: Quest[];
  weeklyQuests?: Quest[];
  dailyResetTime?: Date;
  weeklyResetTime?: Date;
  className?: string;
}

// --- Data ---

const DEFAULT_DAILY_QUESTS: Quest[] = [
  {
    id: 'dq1',
    type: 'play_games',
    description: 'Play 5 games',
    target: 5,
    progress: 3,
    reward: { chips: 500, xp: 50 },
    isClaimed: false,
    period: 'daily',
  },
  {
    id: 'dq2',
    type: 'win_games',
    description: 'Win 2 games',
    target: 2,
    progress: 2,
    reward: { chips: 1000, xp: 100 },
    isClaimed: false,
    period: 'daily',
  },
  {
    id: 'dq3',
    type: 'play_blind',
    description: 'Play blind 3 times',
    target: 3,
    progress: 1,
    reward: { chips: 300, xp: 30 },
    isClaimed: false,
    period: 'daily',
  },
  {
    id: 'dq4',
    type: 'send_gifts',
    description: 'Send 2 gifts',
    target: 2,
    progress: 0,
    reward: { chips: 200, xp: 25 },
    isClaimed: false,
    period: 'daily',
  },
];

const DEFAULT_WEEKLY_QUESTS: Quest[] = [
  {
    id: 'wq1',
    type: 'play_games',
    description: 'Play 30 games',
    target: 30,
    progress: 18,
    reward: { chips: 5000, xp: 500 },
    isClaimed: false,
    period: 'weekly',
  },
  {
    id: 'wq2',
    type: 'win_games',
    description: 'Win 10 games',
    target: 10,
    progress: 7,
    reward: { chips: 10000, xp: 1000 },
    isClaimed: false,
    period: 'weekly',
  },
  {
    id: 'wq3',
    type: 'win_chips',
    description: 'Win 50K chips total',
    target: 50000,
    progress: 32000,
    reward: { chips: 15000, xp: 1500 },
    isClaimed: false,
    period: 'weekly',
  },
  {
    id: 'wq4',
    type: 'play_blind',
    description: 'Play blind 15 times',
    target: 15,
    progress: 15,
    reward: { chips: 3000, xp: 300 },
    isClaimed: false,
    period: 'weekly',
  },
  {
    id: 'wq5',
    type: 'send_gifts',
    description: 'Send 10 gifts',
    target: 10,
    progress: 4,
    reward: { chips: 2000, xp: 200 },
    isClaimed: false,
    period: 'weekly',
  },
];

const QUEST_ICONS: Record<QuestType, typeof Gamepad2> = {
  play_games: Gamepad2,
  win_games: Trophy,
  play_blind: Eye,
  send_gifts: Send,
  win_chips: Coins,
};

const QUEST_ICON_COLORS: Record<QuestType, string> = {
  play_games: 'text-blue-400',
  win_games: 'text-yellow-400',
  play_blind: 'text-purple-400',
  send_gifts: 'text-pink-400',
  win_chips: 'text-green-400',
};

// --- Helpers ---

function getTimeRemaining(target: Date): string {
  const diff = Math.max(0, target.getTime() - Date.now());
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);

  if (h >= 24) {
    const d = Math.floor(h / 24);
    return `${d}d ${h % 24}h`;
  }
  return `${h}h ${m}m`;
}

// --- Sub-components ---

function ClaimAnimation({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl z-10"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.3, 1] }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex flex-col items-center gap-1"
      >
        <Sparkles size={24} className="text-yellow-400" />
        <span className="text-xs font-bold text-yellow-400">Claimed!</span>
      </motion.div>
    </motion.div>
  );
}

function QuestCard({
  quest,
  onClaim,
  index,
}: {
  quest: Quest;
  onClaim: (questId: string) => void;
  index: number;
}) {
  const [showClaimAnim, setShowClaimAnim] = useState(false);
  const [localClaimed, setLocalClaimed] = useState(quest.isClaimed);

  const isComplete = quest.progress >= quest.target;
  const canClaim = isComplete && !localClaimed;
  const progressPct = Math.min(1, quest.progress / quest.target);
  const IconComponent = QUEST_ICONS[quest.type];
  const iconColor = QUEST_ICON_COLORS[quest.type];

  const handleClaim = () => {
    if (!canClaim) return;
    setShowClaimAnim(true);
    onClaim(quest.id);
  };

  const handleAnimComplete = () => {
    setShowClaimAnim(false);
    setLocalClaimed(true);
  };

  // Progress display - use formatChips for large numbers
  const progressDisplay = quest.target >= 10000
    ? `${formatChips(quest.progress)}/${formatChips(quest.target)}`
    : `${quest.progress}/${quest.target}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 300, damping: 25 }}
      className={cn(
        'relative p-3.5 rounded-2xl border transition-all',
        localClaimed
          ? 'bg-green-900/10 border-green-500/15 opacity-60'
          : canClaim
            ? 'bg-yellow-900/15 border-yellow-500/25 shadow-md shadow-yellow-500/5'
            : 'bg-white/[0.03] border-white/5',
      )}
    >
      {/* Claim animation overlay */}
      <AnimatePresence>
        {showClaimAnim && <ClaimAnimation onComplete={handleAnimComplete} />}
      </AnimatePresence>

      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
          localClaimed ? 'bg-green-500/15' : canClaim ? 'bg-yellow-500/15' : 'bg-white/5',
        )}>
          {localClaimed ? (
            <Check size={18} className="text-green-400" />
          ) : (
            <IconComponent size={18} className={iconColor} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <span className={cn(
            'text-sm font-medium block',
            localClaimed ? 'text-green-400/70 line-through' : 'text-gray-200',
          )}>
            {quest.description}
          </span>

          {/* Progress bar */}
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className={cn(
                  'h-full rounded-full',
                  localClaimed ? 'bg-green-500/50' : isComplete ? 'bg-yellow-500' : 'bg-blue-500',
                )}
                initial={{ width: 0 }}
                animate={{ width: `${progressPct * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.05 }}
              />
            </div>
            <span className="text-[10px] text-gray-500 flex-shrink-0 font-mono">
              {progressDisplay}
            </span>
          </div>
        </div>

        {/* Reward / Claim */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-1">
          {canClaim ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleClaim}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 text-black text-xs font-bold shadow-md shadow-yellow-500/15"
            >
              Claim
            </motion.button>
          ) : (
            <div className="flex flex-col items-end gap-0.5">
              <div className="flex items-center gap-1">
                <Coins size={10} className="text-yellow-400" />
                <span className="text-[10px] font-bold text-yellow-400">
                  {formatChips(quest.reward.chips)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Zap size={10} className="text-blue-400" />
                <span className="text-[10px] font-bold text-blue-400">
                  {quest.reward.xp} XP
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function TabButton({
  label,
  count,
  isActive,
  onClick,
}: {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'relative flex-1 py-2.5 rounded-xl text-sm font-bold transition-all',
        isActive
          ? 'text-white'
          : 'text-gray-500 hover:text-gray-300',
      )}
      whileTap={{ scale: 0.95 }}
    >
      {isActive && (
        <motion.div
          layoutId="quest-tab-bg"
          className="absolute inset-0 rounded-xl bg-white/10 border border-white/10"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
      <span className="relative z-10">{label}</span>
      {count > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={cn(
            'absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold z-10',
            isActive
              ? 'bg-yellow-500 text-black'
              : 'bg-white/10 text-gray-400',
          )}
        >
          {count}
        </motion.span>
      )}
    </motion.button>
  );
}

function CompletionSummary({ quests }: { quests: Quest[] }) {
  const total = quests.length;
  const completed = quests.filter((q) => q.progress >= q.target).length;
  const totalChips = quests.reduce((sum, q) => sum + q.reward.chips, 0);
  const totalXp = quests.reduce((sum, q) => sum + q.reward.xp, 0);

  return (
    <div className="flex items-center justify-between px-1 mb-3">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Star size={12} className="text-yellow-500" />
          <span className="text-xs text-gray-400">
            <span className="font-bold text-white">{completed}</span>/{total} done
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Coins size={10} className="text-yellow-400/50" />
          <span className="text-[10px] text-gray-500">{formatChips(totalChips)} total</span>
        </div>
        <div className="flex items-center gap-1">
          <Zap size={10} className="text-blue-400/50" />
          <span className="text-[10px] text-gray-500">{totalXp} XP</span>
        </div>
      </div>
    </div>
  );
}

// --- Main Component ---

export function QuestPanel({
  onClaimQuest,
  dailyQuests = DEFAULT_DAILY_QUESTS,
  weeklyQuests = DEFAULT_WEEKLY_QUESTS,
  dailyResetTime,
  weeklyResetTime,
  className,
}: QuestPanelProps) {
  const [activeTab, setActiveTab] = useState<QuestPeriod>('daily');
  const [timeRemaining, setTimeRemaining] = useState('');

  const quests = activeTab === 'daily' ? dailyQuests : weeklyQuests;
  const claimableCount = (period: QuestPeriod) => {
    const list = period === 'daily' ? dailyQuests : weeklyQuests;
    return list.filter((q) => q.progress >= q.target && !q.isClaimed).length;
  };

  // Default reset times
  const dailyReset = dailyResetTime || (() => {
    const d = new Date();
    d.setHours(24, 0, 0, 0);
    return d;
  })();
  const weeklyReset = weeklyResetTime || (() => {
    const d = new Date();
    const daysUntilSunday = (7 - d.getDay()) % 7 || 7;
    d.setDate(d.getDate() + daysUntilSunday);
    d.setHours(0, 0, 0, 0);
    return d;
  })();

  useEffect(() => {
    function update() {
      const target = activeTab === 'daily' ? dailyReset : weeklyReset;
      setTimeRemaining(getTimeRemaining(target));
    }
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [activeTab, dailyReset, weeklyReset]);

  const handleClaim = (questId: string) => {
    const quest = quests.find((q) => q.id === questId);
    if (quest) {
      onClaimQuest(questId, quest.reward);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        'bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl border border-white/10 overflow-hidden',
        className,
      )}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Scroll size={18} className="text-yellow-500" />
            <h2 className="text-base font-bold text-white">Quests</h2>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock size={12} />
            <span>Resets in <span className="font-mono font-bold text-gray-400">{timeRemaining}</span></span>
          </div>
        </div>
        <p className="text-xs text-gray-500">Complete quests to earn chips and XP</p>
      </div>

      {/* Tabs */}
      <div className="px-5 mb-4">
        <div className="flex gap-1 p-1 rounded-xl bg-white/5">
          <TabButton
            label="Daily"
            count={claimableCount('daily')}
            isActive={activeTab === 'daily'}
            onClick={() => setActiveTab('daily')}
          />
          <TabButton
            label="Weekly"
            count={claimableCount('weekly')}
            isActive={activeTab === 'weekly'}
            onClick={() => setActiveTab('weekly')}
          />
        </div>
      </div>

      {/* Completion summary */}
      <div className="px-5">
        <CompletionSummary quests={quests} />
      </div>

      {/* Quest list */}
      <div className="px-5 pb-5 space-y-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: activeTab === 'daily' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: activeTab === 'daily' ? 20 : -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            {quests.map((quest, i) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                onClaim={handleClaim}
                index={i}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
