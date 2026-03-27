import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Crown,
  Trophy,
  User,
  ChevronLeft,
  ChevronRight,
  Swords,
  Star,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { formatChips } from '../game/gameEngine';

// --- Types ---

export interface BracketPlayer {
  id: string;
  username: string;
  avatarUrl?: string | null;
  chips: number;
  isEliminated: boolean;
  isYou?: boolean;
  finishPosition?: number;
}

export interface BracketMatch {
  id: string;
  roundIndex: number;
  matchIndex: number;
  players: BracketPlayer[];
  winnerId?: string;
  isActive: boolean;
  isFinalTable: boolean;
  tableNumber: number;
}

export interface BracketRound {
  name: string;
  matches: BracketMatch[];
}

export interface TournamentBracketProps {
  rounds: BracketRound[];
  currentPlayerId?: string;
  tournamentName: string;
}

// --- Mock Data Generator ---

const MOCK_NAMES = [
  'RajSharma', 'PriyaPatel', 'AmitKumar', 'NehaGupta',
  'RohitVerma', 'AnanyaSingh', 'VikramJoshi', 'MeghaNair',
  'ArjunMehta', 'KavitaRao', 'SureshYadav', 'DeepikaMalhotra',
  'ManishTiwari', 'PoojaChopra', 'RakeshSingh', 'SunitaReddy',
];

export function createMockBracket(currentPlayerId: string = 'you'): BracketRound[] {
  const r1Players: BracketPlayer[] = MOCK_NAMES.slice(0, 16).map((name, i) => ({
    id: i === 0 ? currentPlayerId : `player-${i}`,
    username: i === 0 ? 'You' : name,
    chips: 3000 + Math.floor(Math.random() * 7000),
    isEliminated: false,
    isYou: i === 0,
  }));

  // Round 1: 4 tables of 4
  const r1Matches: BracketMatch[] = [];
  for (let t = 0; t < 4; t++) {
    const tablePlayers = r1Players.slice(t * 4, t * 4 + 4);
    const winnerId = tablePlayers[Math.floor(Math.random() * 4)].id;
    // Make sure "you" wins if present
    const hasYou = tablePlayers.some((p) => p.isYou);
    const actualWinner = hasYou ? currentPlayerId : winnerId;

    r1Matches.push({
      id: `r1-m${t}`,
      roundIndex: 0,
      matchIndex: t,
      players: tablePlayers.map((p) => ({
        ...p,
        isEliminated: p.id !== actualWinner,
      })),
      winnerId: actualWinner,
      isActive: false,
      isFinalTable: false,
      tableNumber: t + 1,
    });
  }

  // Round 2: 2 tables of 2 winners each (+2 random fillers from losers)
  const r2Players = r1Matches.map((m) => m.players.find((p) => p.id === m.winnerId)!).map((p) => ({
    ...p,
    isEliminated: false,
    chips: p.chips + 2000,
  }));

  const r2Matches: BracketMatch[] = [];
  for (let t = 0; t < 2; t++) {
    const tablePlayers = r2Players.slice(t * 2, t * 2 + 2);
    const hasYou = tablePlayers.some((p) => p.isYou);
    const actualWinner = hasYou ? currentPlayerId : tablePlayers[0].id;

    r2Matches.push({
      id: `r2-m${t}`,
      roundIndex: 1,
      matchIndex: t,
      players: tablePlayers.map((p) => ({
        ...p,
        isEliminated: p.id !== actualWinner,
      })),
      winnerId: actualWinner,
      isActive: false,
      isFinalTable: false,
      tableNumber: t + 5,
    });
  }

  // Final Table
  const finalPlayers = r2Matches.map((m) => m.players.find((p) => p.id === m.winnerId)!).map((p) => ({
    ...p,
    isEliminated: false,
    chips: p.chips + 5000,
  }));

  const finalMatch: BracketMatch = {
    id: 'final',
    roundIndex: 2,
    matchIndex: 0,
    players: finalPlayers,
    isActive: true,
    isFinalTable: true,
    tableNumber: 7,
  };

  return [
    { name: 'Quarter Finals', matches: r1Matches },
    { name: 'Semi Finals', matches: r2Matches },
    { name: 'Final Table', matches: [finalMatch] },
  ];
}

// --- Component ---

export function TournamentBracket({ rounds, currentPlayerId, tournamentName }: TournamentBracketProps) {
  const [activeRound, setActiveRound] = useState(rounds.length - 1);
  const currentRound = rounds[activeRound];

  // Find which match the current player is in
  const yourMatch = currentRound?.matches.find((m) =>
    m.players.some((p) => p.id === currentPlayerId)
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-3">
          <Swords className="w-5 h-5 text-[#D4AF37]" />
          <h2 className="text-white font-bold text-lg">{tournamentName}</h2>
        </div>

        {/* Round Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveRound(Math.max(0, activeRound - 1))}
            disabled={activeRound === 0}
            className="p-1.5 rounded-lg bg-white/5 text-white/40 disabled:opacity-30 hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex-1 flex gap-1">
            {rounds.map((round, idx) => (
              <button
                key={round.name}
                onClick={() => setActiveRound(idx)}
                className={cn(
                  'flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all text-center',
                  idx === activeRound
                    ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30'
                    : 'bg-white/5 text-white/40 hover:bg-white/10'
                )}
              >
                {round.name}
              </button>
            ))}
          </div>

          <button
            onClick={() => setActiveRound(Math.min(rounds.length - 1, activeRound + 1))}
            disabled={activeRound === rounds.length - 1}
            className="p-1.5 rounded-lg bg-white/5 text-white/40 disabled:opacity-30 hover:bg-white/10 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bracket Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {/* Final Table Spotlight */}
        {currentRound?.matches.some((m) => m.isFinalTable) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 p-3 rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 via-yellow-900/10 to-[#D4AF37]/10 border border-[#D4AF37]/30"
          >
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-5 h-5 text-[#D4AF37]" />
              <span className="text-[#D4AF37] font-bold text-sm">Final Table</span>
              {currentRound.matches[0]?.isActive && (
                <motion.span
                  className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full font-semibold"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  LIVE
                </motion.span>
              )}
            </div>
            <p className="text-white/50 text-xs">Winner takes the crown</p>
          </motion.div>
        )}

        {/* Match Cards */}
        <div className="space-y-3">
          {currentRound?.matches.map((match, idx) => (
            <MatchCard
              key={match.id}
              match={match}
              currentPlayerId={currentPlayerId}
              isHighlighted={match.id === yourMatch?.id}
              delay={idx}
            />
          ))}
        </div>

        {/* Your Position Indicator */}
        {currentPlayerId && (
          <YourPositionBanner
            rounds={rounds}
            currentPlayerId={currentPlayerId}
          />
        )}
      </div>
    </div>
  );
}

// --- Match Card ---

interface MatchCardProps {
  match: BracketMatch;
  currentPlayerId?: string;
  isHighlighted: boolean;
  delay: number;
}

function MatchCard({ match, currentPlayerId, isHighlighted, delay }: MatchCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: delay * 0.08 }}
      className={cn(
        'rounded-xl border overflow-hidden',
        isHighlighted
          ? 'border-[#D4AF37]/50 bg-[#D4AF37]/5'
          : match.isActive
          ? 'border-white/15 bg-white/5'
          : 'border-white/5 bg-white/[0.02]'
      )}
    >
      {/* Table Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-white/30 text-[10px] font-semibold uppercase tracking-wider">
            Table {match.tableNumber}
          </span>
          {match.isFinalTable && (
            <Star className="w-3 h-3 text-[#D4AF37]" />
          )}
        </div>
        {match.isActive && (
          <motion.div
            className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Active
          </motion.div>
        )}
        {match.winnerId && !match.isActive && (
          <span className="text-[10px] text-white/30 font-medium">Complete</span>
        )}
      </div>

      {/* Players */}
      <div className="divide-y divide-white/5">
        {match.players.map((player) => (
          <div
            key={player.id}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 transition-colors',
              player.isEliminated && 'opacity-40',
              player.id === match.winnerId && 'bg-[#D4AF37]/5',
              player.id === currentPlayerId && !player.isEliminated && 'bg-blue-500/5'
            )}
          >
            {/* Avatar */}
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                player.id === currentPlayerId
                  ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white ring-2 ring-blue-400/50'
                  : player.isEliminated
                  ? 'bg-gray-700 text-gray-500'
                  : 'bg-gradient-to-br from-red-700 to-red-900 text-white'
              )}
            >
              {player.id === match.winnerId ? (
                <Crown className="w-4 h-4 text-[#D4AF37]" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    'text-sm font-medium truncate',
                    player.isEliminated ? 'text-white/40 line-through' : 'text-white'
                  )}
                >
                  {player.username}
                </span>
                {player.id === currentPlayerId && (
                  <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded-full font-bold shrink-0">
                    YOU
                  </span>
                )}
              </div>
            </div>

            {/* Chips */}
            <span
              className={cn(
                'text-xs font-semibold shrink-0',
                player.isEliminated ? 'text-white/30' : 'text-[#D4AF37]'
              )}
            >
              {formatChips(player.chips)}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// --- Your Position Banner ---

interface YourPositionBannerProps {
  rounds: BracketRound[];
  currentPlayerId: string;
}

function YourPositionBanner({ rounds, currentPlayerId }: YourPositionBannerProps) {
  // Find the last round where the player appeared
  let lastRoundName = '';
  let isEliminated = false;
  let isStillPlaying = false;

  for (let r = rounds.length - 1; r >= 0; r--) {
    for (const match of rounds[r].matches) {
      const player = match.players.find((p) => p.id === currentPlayerId);
      if (player) {
        lastRoundName = rounds[r].name;
        isEliminated = player.isEliminated;
        isStillPlaying = match.isActive && !player.isEliminated;
        break;
      }
    }
    if (lastRoundName) break;
  }

  if (!lastRoundName) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className={cn(
        'mt-4 p-3 rounded-xl border text-center',
        isStillPlaying
          ? 'bg-blue-500/10 border-blue-500/30'
          : isEliminated
          ? 'bg-red-500/10 border-red-500/20'
          : 'bg-[#D4AF37]/10 border-[#D4AF37]/30'
      )}
    >
      <p
        className={cn(
          'text-sm font-semibold',
          isStillPlaying ? 'text-blue-300' : isEliminated ? 'text-red-300' : 'text-[#D4AF37]'
        )}
      >
        {isStillPlaying
          ? `You are playing in ${lastRoundName}`
          : isEliminated
          ? `Eliminated in ${lastRoundName}`
          : `Advanced past ${lastRoundName}`}
      </p>
    </motion.div>
  );
}
