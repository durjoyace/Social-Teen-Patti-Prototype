import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';

// ---------- Types ----------

interface FloatingReaction {
  id: string;
  emoji: string;
  x: number;
  fromSelf: boolean;
  senderName?: string;
}

type CrowdSentiment = 'calm' | 'excited' | 'tense' | 'shocked';

interface CrowdReactionsProps {
  className?: string;
  spectatorCount: number;
}

// ---------- Constants ----------

const REACTION_OPTIONS = [
  { emoji: '\u{1F44F}', label: 'Clap' },
  { emoji: '\u{1F525}', label: 'Fire' },
  { emoji: '\u{1F631}', label: 'Shocked' },
  { emoji: '\u{1F602}', label: 'Laugh' },
  { emoji: '\u{1F48E}', label: 'Gem' },
  { emoji: '\u{2764}\u{FE0F}', label: 'Heart' },
  { emoji: '\u{1F3AF}', label: 'Bullseye' },
  { emoji: '\u{1F480}', label: 'Skull' },
] as const;

const SPECTATOR_NAMES = [
  'Ravi', 'Priya', 'Amit', 'Neha', 'Kunal', 'Simran',
  'Arjun', 'Kavita', 'Rohit', 'Deepa', 'Varun', 'Isha',
];

// ---------- Crowd Meter Component ----------

function CrowdMeter({ sentiment }: { sentiment: CrowdSentiment }) {
  const sentimentConfig: Record<CrowdSentiment, { label: string; color: string; width: string; glow: string }> = {
    calm: {
      label: 'Calm',
      color: 'from-blue-500 to-cyan-500',
      width: 'w-1/4',
      glow: 'shadow-blue-500/30',
    },
    excited: {
      label: 'Excited',
      color: 'from-yellow-500 to-orange-500',
      width: 'w-2/3',
      glow: 'shadow-orange-500/30',
    },
    tense: {
      label: 'Tense',
      color: 'from-purple-500 to-pink-500',
      width: 'w-1/2',
      glow: 'shadow-purple-500/30',
    },
    shocked: {
      label: 'SHOCKED',
      color: 'from-red-500 to-pink-500',
      width: 'w-full',
      glow: 'shadow-red-500/30',
    },
  };

  const config = sentimentConfig[sentiment];

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-white/40 uppercase tracking-wider font-medium">
        Crowd
      </span>
      <div className="relative w-20 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className={cn(
            'absolute inset-y-0 left-0 rounded-full bg-gradient-to-r',
            config.color
          )}
          animate={{ width: config.width === 'w-1/4' ? '25%' : config.width === 'w-1/2' ? '50%' : config.width === 'w-2/3' ? '66%' : '100%' }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        />
      </div>
      <motion.span
        key={sentiment}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'text-[10px] font-bold',
          sentiment === 'calm' && 'text-cyan-400',
          sentiment === 'excited' && 'text-orange-400',
          sentiment === 'tense' && 'text-purple-400',
          sentiment === 'shocked' && 'text-red-400'
        )}
      >
        {config.label}
      </motion.span>
    </div>
  );
}

// ---------- Floating Emoji ----------

function FloatingEmoji({ reaction }: { reaction: FloatingReaction }) {
  const randomDrift = useRef((Math.random() - 0.5) * 60);

  return (
    <motion.div
      initial={{
        opacity: 1,
        y: 0,
        x: 0,
        scale: reaction.fromSelf ? 1.3 : 0.9,
      }}
      animate={{
        opacity: 0,
        y: -280,
        x: randomDrift.current,
        scale: 0.4,
      }}
      exit={{ opacity: 0 }}
      transition={{ duration: 2.5, ease: 'easeOut' }}
      className="absolute bottom-0 pointer-events-none"
      style={{ left: `${reaction.x}%` }}
    >
      <span className="text-2xl drop-shadow-lg">{reaction.emoji}</span>
      {!reaction.fromSelf && reaction.senderName && (
        <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] text-white/40 whitespace-nowrap">
          {reaction.senderName}
        </span>
      )}
    </motion.div>
  );
}

// ---------- Main Component ----------

export function CrowdReactions({ className, spectatorCount }: CrowdReactionsProps) {
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    REACTION_OPTIONS.forEach(({ emoji }) => {
      counts[emoji] = Math.floor(Math.random() * 20);
    });
    return counts;
  });
  const [sentiment, setSentiment] = useState<CrowdSentiment>('calm');
  const [lastTapTime, setLastTapTime] = useState(0);
  const reactionIdCounter = useRef(0);

  // Simulate other spectators reacting
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.4) {
        const randomEmoji =
          REACTION_OPTIONS[Math.floor(Math.random() * REACTION_OPTIONS.length)].emoji;
        const randomName =
          SPECTATOR_NAMES[Math.floor(Math.random() * SPECTATOR_NAMES.length)];

        const newReaction: FloatingReaction = {
          id: `sim-${reactionIdCounter.current++}`,
          emoji: randomEmoji,
          x: 10 + Math.random() * 80,
          fromSelf: false,
          senderName: randomName,
        };

        setFloatingReactions((prev) => [...prev.slice(-20), newReaction]);
        setReactionCounts((prev) => ({
          ...prev,
          [randomEmoji]: (prev[randomEmoji] || 0) + 1,
        }));
      }
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  // Clean up old floating reactions
  useEffect(() => {
    const cleanup = setInterval(() => {
      setFloatingReactions((prev) => prev.slice(-15));
    }, 3000);
    return () => clearInterval(cleanup);
  }, []);

  // Update sentiment based on reaction frequency
  useEffect(() => {
    const totalRecent = floatingReactions.length;
    if (totalRecent > 12) {
      setSentiment('shocked');
    } else if (totalRecent > 8) {
      setSentiment('excited');
    } else if (totalRecent > 4) {
      setSentiment('tense');
    } else {
      setSentiment('calm');
    }
  }, [floatingReactions.length]);

  const handleSendReaction = useCallback(
    (emoji: string) => {
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(30);
      }

      const now = Date.now();
      // Rate-limit to prevent spam (min 200ms between taps)
      if (now - lastTapTime < 200) return;
      setLastTapTime(now);

      const newReaction: FloatingReaction = {
        id: `self-${reactionIdCounter.current++}`,
        emoji,
        x: 30 + Math.random() * 40,
        fromSelf: true,
      };

      setFloatingReactions((prev) => [...prev.slice(-20), newReaction]);
      setReactionCounts((prev) => ({
        ...prev,
        [emoji]: (prev[emoji] || 0) + 1,
      }));
    },
    [lastTapTime]
  );

  return (
    <div className={cn('relative', className)}>
      {/* Floating reactions area */}
      <div className="absolute bottom-full left-0 right-0 h-72 pointer-events-none overflow-hidden">
        <AnimatePresence>
          {floatingReactions.map((reaction) => (
            <FloatingEmoji key={reaction.id} reaction={reaction} />
          ))}
        </AnimatePresence>
      </div>

      {/* Reaction bar */}
      <div className="bg-black/60 backdrop-blur-xl border-t border-white/10 rounded-t-2xl px-3 py-2">
        {/* Crowd meter */}
        <div className="flex items-center justify-between mb-2">
          <CrowdMeter sentiment={sentiment} />
          <span className="text-[10px] text-white/30">
            {spectatorCount.toLocaleString()} watching
          </span>
        </div>

        {/* Emoji buttons */}
        <div className="flex items-center justify-between gap-1">
          {REACTION_OPTIONS.map(({ emoji }) => (
            <motion.button
              key={emoji}
              whileTap={{ scale: 1.4 }}
              onClick={() => handleSendReaction(emoji)}
              className="relative flex flex-col items-center gap-0.5 py-1 px-1.5 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors"
            >
              <span className="text-xl">{emoji}</span>
              <span className="text-[8px] text-white/30 tabular-nums">
                {reactionCounts[emoji] || 0}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
