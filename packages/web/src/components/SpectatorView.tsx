import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  LogOut,
  Clock,
  Flame,
  MessageSquare,
  Share2,
  Volume2,
  VolumeX,
  ChevronDown,
  Shield,
  Sparkles,
  Zap,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { formatChips } from '../game/gameEngine';
import { Card, HandRank } from '../types';
import { getSuitSymbol, getSuitColor } from '../game/deck';
import { GameTableSurface, TableTheme } from './TableThemes';
import { CrowdReactions } from './CrowdReactions';
import { SpectatorPrediction } from './SpectatorPrediction';
import { GameClipShare } from './GameClipShare';

// ---------- Types ----------

interface SpectatorPlayer {
  id: string;
  name: string;
  avatarUrl?: string;
  chips: number;
  currentBet: number;
  cards: Card[];
  handRank: HandRank;
  handDescription: string;
  handStrength: number; // 0-1
  status: 'playing' | 'folded' | 'all_in' | 'show';
  isBlind: boolean;
  isDealer: boolean;
  isTurn: boolean;
  seatPosition: number;
}

interface ActionLogEntry {
  id: string;
  playerName: string;
  action: string;
  amount?: number;
  timestamp: Date;
  isHighlight?: boolean;
}

interface SpectatorViewProps {
  onLeave: () => void;
  gameId?: string;
  className?: string;
}

// ---------- Mock Game Data ----------

const MOCK_PLAYERS: SpectatorPlayer[] = [
  {
    id: 'p1',
    name: 'Rajesh K.',
    chips: 8500000,
    currentBet: 400000,
    cards: [
      { suit: 'hearts', rank: 'A', value: 14 },
      { suit: 'hearts', rank: 'K', value: 13 },
      { suit: 'hearts', rank: 'Q', value: 12 },
    ],
    handRank: 'pure_sequence',
    handDescription: 'Pure Sequence A-K-Q',
    handStrength: 0.92,
    status: 'playing',
    isBlind: false,
    isDealer: true,
    isTurn: false,
    seatPosition: 0,
  },
  {
    id: 'p2',
    name: 'Priya N.',
    chips: 6200000,
    currentBet: 400000,
    cards: [
      { suit: 'spades', rank: 'K', value: 13 },
      { suit: 'diamonds', rank: 'K', value: 13 },
      { suit: 'clubs', rank: '7', value: 7 },
    ],
    handRank: 'pair',
    handDescription: 'Pair of Kings',
    handStrength: 0.42,
    status: 'playing',
    isBlind: false,
    isDealer: false,
    isTurn: true,
    seatPosition: 1,
  },
  {
    id: 'p3',
    name: 'Bunty',
    chips: 4100000,
    currentBet: 200000,
    cards: [
      { suit: 'clubs', rank: '9', value: 9 },
      { suit: 'diamonds', rank: '8', value: 8 },
      { suit: 'spades', rank: '7', value: 7 },
    ],
    handRank: 'sequence',
    handDescription: 'Sequence 9-8-7',
    handStrength: 0.65,
    status: 'playing',
    isBlind: true,
    isDealer: false,
    isTurn: false,
    seatPosition: 2,
  },
  {
    id: 'p4',
    name: 'Deepak M.',
    chips: 3800000,
    currentBet: 0,
    cards: [
      { suit: 'diamonds', rank: '3', value: 3 },
      { suit: 'clubs', rank: '5', value: 5 },
      { suit: 'spades', rank: 'J', value: 11 },
    ],
    handRank: 'high_card',
    handDescription: 'High Card Jack',
    handStrength: 0.12,
    status: 'folded',
    isBlind: false,
    isDealer: false,
    isTurn: false,
    seatPosition: 3,
  },
];

const MOCK_ACTION_LOG: ActionLogEntry[] = [
  { id: 'a1', playerName: 'Rajesh K.', action: 'Dealt', timestamp: new Date(Date.now() - 120000) },
  { id: 'a2', playerName: 'Priya N.', action: 'Blind', amount: 50000, timestamp: new Date(Date.now() - 110000) },
  { id: 'a3', playerName: 'Bunty', action: 'Blind', amount: 50000, timestamp: new Date(Date.now() - 100000) },
  { id: 'a4', playerName: 'Deepak M.', action: 'Chaal', amount: 100000, timestamp: new Date(Date.now() - 85000) },
  { id: 'a5', playerName: 'Rajesh K.', action: 'Raise', amount: 200000, timestamp: new Date(Date.now() - 70000), isHighlight: true },
  { id: 'a6', playerName: 'Priya N.', action: 'Chaal', amount: 200000, timestamp: new Date(Date.now() - 55000) },
  { id: 'a7', playerName: 'Bunty', action: 'Blind', amount: 100000, timestamp: new Date(Date.now() - 40000) },
  { id: 'a8', playerName: 'Deepak M.', action: 'Pack', timestamp: new Date(Date.now() - 30000) },
  { id: 'a9', playerName: 'Rajesh K.', action: 'Raise', amount: 400000, timestamp: new Date(Date.now() - 15000), isHighlight: true },
  { id: 'a10', playerName: 'Priya N.', action: 'Chaal', amount: 400000, timestamp: new Date(Date.now() - 5000) },
];

// ---------- Commentary Engine ----------

function generateCommentary(players: SpectatorPlayer[], actionLog: ActionLogEntry[]): string[] {
  const comments: string[] = [];
  const activePlayers = players.filter((p) => p.status === 'playing');
  const lastAction = actionLog[actionLog.length - 1];

  // Find strongest and weakest hands
  const sorted = [...activePlayers].sort((a, b) => b.handStrength - a.handStrength);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];

  if (strongest && weakest && activePlayers.length >= 2) {
    // Commentary based on hand comparison
    if (strongest.handStrength > 0.8) {
      comments.push(
        `${strongest.name} is sitting on a ${strongest.handDescription}! Absolute monster hand.`
      );
    }

    if (weakest.handStrength < 0.2 && weakest.status === 'playing') {
      comments.push(
        `${weakest.name} holding just a ${weakest.handDescription} -- brave to still be in!`
      );
    }

    // Bluffing commentary
    const bluffer = activePlayers.find(
      (p) => p.handStrength < 0.3 && p.currentBet > 200000
    );
    if (bluffer) {
      comments.push(
        `${bluffer.name} raises with just a ${bluffer.handDescription.toLowerCase()}! Bold move.`
      );
    }

    // Close match commentary
    if (
      activePlayers.length === 2 &&
      Math.abs(sorted[0].handStrength - sorted[1].handStrength) < 0.15
    ) {
      comments.push(`This is going to be CLOSE -- both players have strong hands!`);
    }
  }

  // Action-based commentary
  if (lastAction) {
    if (lastAction.action === 'Raise' && lastAction.amount && lastAction.amount >= 400000) {
      comments.push(
        `Massive raise of ${formatChips(lastAction.amount)} by ${lastAction.playerName}! The pressure is ON.`
      );
    }
    if (lastAction.action === 'Pack') {
      comments.push(
        `${lastAction.playerName} decides to pack. Can't blame them with this kind of action.`
      );
    }
  }

  // Blind player commentary
  const blindPlayer = activePlayers.find((p) => p.isBlind);
  if (blindPlayer) {
    comments.push(
      `${blindPlayer.name} is still playing blind -- hasn't seen their cards yet! The suspense!`
    );
  }

  return comments.length > 0 ? comments : ['The game heats up as players size each other up...'];
}

// ---------- Sub-components ----------

function SpectatorPlayerCard({ player }: { player: SpectatorPlayer }) {
  const isFolded = player.status === 'folded';

  return (
    <div
      className={cn(
        'relative flex flex-col items-center gap-1',
        isFolded && 'opacity-40'
      )}
    >
      {/* Turn indicator */}
      {player.isTurn && (
        <motion.div
          className="absolute -inset-2 rounded-2xl border-2 border-yellow-500/60"
          animate={{ opacity: [0.4, 1, 0.4], scale: [0.98, 1.02, 0.98] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
      )}

      {/* Avatar */}
      <div className="relative">
        <div
          className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold border-2',
            player.isTurn
              ? 'border-yellow-400 bg-gradient-to-br from-yellow-500/20 to-orange-500/20'
              : isFolded
              ? 'border-white/10 bg-white/5'
              : 'border-white/20 bg-gradient-to-br from-red-700 to-red-900',
            'text-white'
          )}
        >
          {player.name.charAt(0)}
        </div>
        {player.isDealer && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full border border-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-800 shadow-sm z-10">
            D
          </div>
        )}
        {player.isBlind && player.status === 'playing' && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center text-[8px] font-bold text-white z-10">
            B
          </div>
        )}
      </div>

      {/* Name */}
      <span className="text-[10px] text-white font-medium truncate max-w-[70px]">
        {player.name}
      </span>

      {/* Chips */}
      <span className="text-[9px] text-yellow-400/80 font-medium">
        {formatChips(player.chips)}
      </span>

      {/* Cards - visible to spectators */}
      {!isFolded && (
        <div className="flex gap-0.5 mt-0.5">
          {player.cards.map((card, i) => (
            <div
              key={i}
              className={cn(
                'w-7 h-10 rounded bg-white border border-gray-200 flex flex-col items-center justify-center shadow-sm',
                player.isBlind && 'bg-gradient-to-br from-red-800 to-red-900 border-yellow-600/30'
              )}
            >
              {!player.isBlind ? (
                <>
                  <span
                    className={cn(
                      'text-[8px] font-bold leading-none',
                      getSuitColor(card.suit) === 'red' ? 'text-red-600' : 'text-gray-900'
                    )}
                  >
                    {card.rank}
                  </span>
                  <span
                    className={cn(
                      'text-[10px] leading-none',
                      getSuitColor(card.suit) === 'red' ? 'text-red-600' : 'text-gray-900'
                    )}
                  >
                    {getSuitSymbol(card.suit)}
                  </span>
                </>
              ) : (
                <span className="text-[6px] text-yellow-500/50 font-bold">TP</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Hand rank badge */}
      {!isFolded && !player.isBlind && (
        <div
          className={cn(
            'px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider',
            player.handStrength > 0.7
              ? 'bg-yellow-500/20 text-yellow-400'
              : player.handStrength > 0.4
              ? 'bg-blue-500/20 text-blue-400'
              : 'bg-white/10 text-white/50'
          )}
        >
          {player.handRank.replace('_', ' ')}
        </div>
      )}

      {/* Bet */}
      {player.currentBet > 0 && (
        <div className="text-[9px] text-orange-400 font-medium">
          Bet: {formatChips(player.currentBet)}
        </div>
      )}

      {/* Folded label */}
      {isFolded && (
        <span className="text-[9px] text-red-400/60 font-medium uppercase">Folded</span>
      )}
    </div>
  );
}

function HandStrengthBar({ players }: { players: SpectatorPlayer[] }) {
  const activePlayers = players
    .filter((p) => p.status === 'playing' && !p.isBlind)
    .sort((a, b) => b.handStrength - a.handStrength);

  if (activePlayers.length < 2) return null;

  const colors = ['text-yellow-400', 'text-blue-400', 'text-green-400', 'text-purple-400', 'text-pink-400'];
  const barColors = [
    'from-yellow-500 to-orange-500',
    'from-blue-500 to-cyan-500',
    'from-green-500 to-emerald-500',
    'from-purple-500 to-pink-500',
    'from-pink-500 to-red-500',
  ];

  return (
    <div className="bg-black/40 backdrop-blur-sm rounded-xl p-2.5 border border-white/5">
      <div className="flex items-center gap-1.5 mb-2">
        <Zap className="w-3 h-3 text-yellow-400" />
        <span className="text-[10px] text-white/50 font-medium uppercase tracking-wider">
          Hand Strength
        </span>
      </div>
      <div className="space-y-1.5">
        {activePlayers.map((player, index) => (
          <div key={player.id} className="flex items-center gap-2">
            <span
              className={cn(
                'text-[9px] font-medium w-16 truncate',
                colors[index % colors.length]
              )}
            >
              {player.name}
            </span>
            <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${player.handStrength * 100}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={cn(
                  'h-full rounded-full bg-gradient-to-r',
                  barColors[index % barColors.length]
                )}
              />
            </div>
            <span className="text-[9px] text-white/30 w-8 text-right tabular-nums">
              {Math.round(player.handStrength * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionLog({ entries, isOpen, onToggle }: { entries: ActionLogEntry[]; isOpen: boolean; onToggle: () => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current && isOpen) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length, isOpen]);

  return (
    <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-white/5 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2"
      >
        <div className="flex items-center gap-1.5">
          <MessageSquare className="w-3 h-3 text-white/40" />
          <span className="text-[10px] text-white/50 font-medium uppercase tracking-wider">
            Action Log
          </span>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
          <ChevronDown className="w-3 h-3 text-white/30" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div
              ref={scrollRef}
              className="max-h-32 overflow-y-auto px-3 pb-2 space-y-1 scrollbar-hide"
            >
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className={cn(
                    'flex items-center gap-2 text-[10px]',
                    entry.isHighlight && 'bg-yellow-500/5 -mx-1 px-1 py-0.5 rounded'
                  )}
                >
                  <span className="text-white/20 w-10 flex-shrink-0 tabular-nums">
                    {entry.timestamp.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span className="text-white/70 font-medium">{entry.playerName}</span>
                  <span
                    className={cn(
                      'font-medium',
                      entry.action === 'Raise'
                        ? 'text-yellow-400'
                        : entry.action === 'Pack'
                        ? 'text-red-400'
                        : 'text-white/40'
                    )}
                  >
                    {entry.action}
                  </span>
                  {entry.amount && (
                    <span className="text-orange-400/60">{formatChips(entry.amount)}</span>
                  )}
                  {entry.isHighlight && (
                    <Sparkles className="w-2.5 h-2.5 text-yellow-400 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CommentaryBanner({ comments }: { comments: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (comments.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % comments.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [comments.length]);

  return (
    <div className="bg-gradient-to-r from-yellow-500/10 via-orange-500/5 to-yellow-500/10 border border-yellow-500/10 rounded-xl px-3 py-2">
      <AnimatePresence mode="wait">
        <motion.p
          key={currentIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="text-xs text-yellow-200/80 italic leading-relaxed"
        >
          &ldquo;{comments[currentIndex]}&rdquo;
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

// ---------- Main Component ----------

export function SpectatorView({ onLeave, gameId, className }: SpectatorViewProps) {
  const [players] = useState<SpectatorPlayer[]>(MOCK_PLAYERS);
  const [actionLog] = useState<ActionLogEntry[]>(MOCK_ACTION_LOG);
  const [showActionLog, setShowActionLog] = useState(false);
  const [showPrediction, setShowPrediction] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [delayMode, setDelayMode] = useState<'realtime' | 'delayed'>('realtime');
  const [commentaryMuted, setCommentaryMuted] = useState(false);
  const [tableTheme] = useState<TableTheme>('neon');

  const spectatorCount = 1247;
  const potSize = 2450000;
  const tableName = 'Maharaja Suite';

  const commentary = useMemo(
    () => generateCommentary(players, actionLog),
    [players, actionLog]
  );

  const predictionPlayers = useMemo(
    () =>
      players
        .filter((p) => p.status === 'playing')
        .map((p) => ({
          id: p.id,
          name: p.name,
          avatarUrl: p.avatarUrl,
          handStrength: p.handStrength,
        })),
    [players]
  );

  // Position players around a virtual table
  const seatPositions = useMemo(() => {
    const positions = [
      { top: '10%', left: '50%', transform: 'translateX(-50%)' },   // Top center
      { top: '40%', right: '4%' },                                    // Right
      { bottom: '15%', left: '50%', transform: 'translateX(-50%)' }, // Bottom center
      { top: '40%', left: '4%' },                                     // Left
      { top: '12%', right: '15%' },                                   // Top right
      { top: '12%', left: '15%' },                                    // Top left
    ];
    return positions;
  }, []);

  return (
    <div
      className={cn(
        'min-h-screen bg-gradient-to-b from-[#05050a] via-[#0a0a14] to-[#050508] text-white flex flex-col',
        className
      )}
    >
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="px-4 pt-12 pb-2">
          <div className="flex items-center justify-between">
            {/* Left: Leave + info */}
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onLeave}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <LogOut className="w-4 h-4 text-white/60" />
              </motion.button>
              <div>
                <h2 className="text-sm font-bold text-white">{tableName}</h2>
                <p className="text-[10px] text-white/40">
                  Classic &middot; Spectating
                </p>
              </div>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-2">
              {/* Delay toggle */}
              <button
                onClick={() =>
                  setDelayMode((prev) => (prev === 'realtime' ? 'delayed' : 'realtime'))
                }
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors border',
                  delayMode === 'delayed'
                    ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                    : 'bg-white/5 text-white/40 border-white/10'
                )}
              >
                {delayMode === 'delayed' ? (
                  <>
                    <Shield className="w-3 h-3" />
                    5s Delay
                  </>
                ) : (
                  <>
                    <Clock className="w-3 h-3" />
                    Live
                  </>
                )}
              </button>

              {/* Viewer count */}
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/20">
                <Eye className="w-3 h-3 text-red-400" />
                <span className="text-[10px] text-red-400 font-bold tabular-nums">
                  {spectatorCount.toLocaleString()}
                </span>
              </div>

              {/* Share */}
              <button
                onClick={() => setShowShareModal(true)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5 text-white/40" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Game Table Area */}
      <div className="flex-1 relative px-2 pt-2">
        {/* Cinematic spotlight */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-yellow-500/[0.03] rounded-full blur-[100px] pointer-events-none" />

        {/* Table surface */}
        <div className="relative mx-auto max-w-md">
          <GameTableSurface theme={tableTheme}>
            {/* Pot display */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full border border-yellow-500/20">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-orange-400 font-bold text-lg tabular-nums">
                  {formatChips(potSize)}
                </span>
              </div>
              <p className="text-white/20 text-[9px] mt-1">POT</p>
            </div>

            {/* Players positioned around table */}
            {players.map((player, index) => (
              <div
                key={player.id}
                className="absolute"
                style={seatPositions[index] || {}}
              >
                <SpectatorPlayerCard player={player} />
              </div>
            ))}
          </GameTableSurface>
        </div>

        {/* Hand Strength Bar */}
        <div className="mt-3 mx-2">
          <HandStrengthBar players={players} />
        </div>

        {/* Commentary */}
        {!commentaryMuted && (
          <div className="mt-2 mx-2">
            <CommentaryBanner comments={commentary} />
          </div>
        )}

        {/* Commentary mute toggle */}
        <div className="flex justify-end mt-1 mx-2">
          <button
            onClick={() => setCommentaryMuted(!commentaryMuted)}
            className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white/50 transition-colors"
          >
            {commentaryMuted ? (
              <VolumeX className="w-3 h-3" />
            ) : (
              <Volume2 className="w-3 h-3" />
            )}
            {commentaryMuted ? 'Show' : 'Hide'} commentary
          </button>
        </div>

        {/* Action Log */}
        <div className="mt-2 mx-2">
          <ActionLog
            entries={actionLog}
            isOpen={showActionLog}
            onToggle={() => setShowActionLog(!showActionLog)}
          />
        </div>

        {/* Prediction */}
        {showPrediction && (
          <div className="mt-2 mx-2">
            <SpectatorPrediction
              players={predictionPlayers}
              isHandActive={true}
              potSize={potSize}
              onPredictionMade={(_playerId) => {
                // In real app, send prediction to server
              }}
            />
          </div>
        )}

        {/* "Who Will Win?" banner (quick prediction prompt when collapsed) */}
        {!showPrediction && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setShowPrediction(true)}
            className="w-full mt-2 mx-2 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/15 rounded-xl"
          >
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium text-yellow-400">
              Who will win? Tap to predict!
            </span>
          </motion.button>
        )}

        {/* Spacer for bottom reactions */}
        <div className="h-28" />
      </div>

      {/* Crowd Reactions (fixed bottom) */}
      <div className="fixed bottom-0 left-0 right-0 z-20">
        <CrowdReactions spectatorCount={spectatorCount} />
      </div>

      {/* Share Modal */}
      <GameClipShare
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        highlight={{
          id: gameId || '1',
          playerName: 'Rajesh K.',
          cards: players[0].cards,
          handRank: players[0].handRank,
          potWon: potSize,
          variant: 'Classic',
          timestamp: new Date(),
          tableName,
        }}
      />
    </div>
  );
}
