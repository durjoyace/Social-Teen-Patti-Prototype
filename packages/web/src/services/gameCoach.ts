/**
 * Game Coach — Pure algorithmic Teen Patti coaching engine.
 * No external API calls. All analysis runs client-side.
 */

import {
  Card,
  HandRank,
  HandResult,
  ActionType,
} from '../types';
import { evaluateHand, calculateHandStrength } from '../game/handRanking';

// ─── Types ──────────────────────────────────────────────────────────────

export type Verdict = 'good' | 'bad' | 'neutral';

export interface HandAnalysis {
  verdict: Verdict;
  verdictLabel: string;
  explanation: string;
  handStrength: number;
  handResult: HandResult;
  optimalActions: OptimalActionStep[];
  potOdds: number;
  evSummary: string;
  tips: string[];
  optimalPlayPercentage: number;
}

export interface OptimalActionStep {
  round: number;
  yourAction: ActionType;
  optimalAction: ActionType;
  wasOptimal: boolean;
  reasoning: string;
}

export interface PlayStyleProfile {
  aggression: number;      // 0-1 how often player raises
  tightness: number;       // 0-1 how selective with starting hands
  bluffFrequency: number;  // 0-1 how often player bluffs
  blindPlayRate: number;   // 0-1 how often player stays blind
  showdownRate: number;    // 0-1 how often player reaches show
  personality: PlayStyleLabel;
}

export type PlayStyleLabel =
  | 'The Shark'
  | 'The Rock'
  | 'The Maniac'
  | 'The Calling Station'
  | 'The Fox'
  | 'The Newbie';

export interface SuggestedAction {
  action: ActionType;
  confidence: number;
  reasoning: string;
}

export interface BluffOpportunity {
  shouldBluff: boolean;
  confidence: number;
  reasoning: string;
}

export interface HandHistoryEntry {
  id: string;
  timestamp: Date;
  cards: Card[];
  handResult: HandResult;
  actions: RecordedAction[];
  potSize: number;
  result: 'win' | 'loss' | 'fold';
  chipsWon: number;
  chipsLost: number;
  opponentCount: number;
  wasBlind: boolean;
  coachingVerdict?: Verdict;
  coachingVerdictLabel?: string;
  analysis?: HandAnalysis;
  playerName?: string;
  opponentNames?: string[];
}

export interface RecordedAction {
  playerId: string;
  action: ActionType;
  amount: number;
  round: number;
  isBlind: boolean;
}

export interface GameStateSnapshot {
  myCards: Card[];
  myChips: number;
  pot: number;
  currentBet: number;
  bootAmount: number;
  isBlind: boolean;
  activePlayers: number;
  totalPlayers: number;
  roundNumber: number;
  opponentTendencies: OpponentTendency[];
  myActions: RecordedAction[];
}

export interface OpponentTendency {
  playerId: string;
  playerName: string;
  aggression: number;
  foldRate: number;
  bluffRate: number;
  averageBet: number;
}

// ─── Hand Strength Rankings (numeric weights) ───────────────────────────

const HAND_RANK_DISPLAY: Record<HandRank, string> = {
  high_card: 'High Card',
  pair: 'Pair',
  color: 'Color (Flush)',
  sequence: 'Sequence (Straight)',
  pure_sequence: 'Pure Sequence',
  trail: 'Trail (Three of a Kind)',
};

// ─── Core Analysis Functions ────────────────────────────────────────────

/**
 * Analyze a completed hand and generate coaching insights.
 */
export function analyzeHand(entry: HandHistoryEntry): HandAnalysis {
  const handResult = entry.handResult;
  const strength = calculateHandStrength(entry.cards);
  const potOdds = entry.actions.length > 0
    ? calculatePotOdds(entry.actions, entry.potSize)
    : 0;

  const optimalActions = evaluateActions(entry, strength);
  const optimalCount = optimalActions.filter(a => a.wasOptimal).length;
  const totalSteps = Math.max(optimalActions.length, 1);
  const optimalPlayPercentage = Math.round((optimalCount / totalSteps) * 100);

  const { verdict, verdictLabel } = determineVerdict(entry, strength, optimalPlayPercentage);
  const explanation = buildExplanation(entry, strength, verdict, optimalActions);
  const tips = generateTips(entry, strength, verdict, optimalActions);
  const evSummary = buildEVSummary(entry, strength);

  return {
    verdict,
    verdictLabel,
    explanation,
    handStrength: strength,
    handResult,
    optimalActions,
    potOdds,
    evSummary,
    tips,
    optimalPlayPercentage,
  };
}

/**
 * Build a play style profile from game history.
 */
export function getPlayStyleProfile(history: HandHistoryEntry[]): PlayStyleProfile {
  if (history.length === 0) {
    return {
      aggression: 0.5,
      tightness: 0.5,
      bluffFrequency: 0,
      blindPlayRate: 0.5,
      showdownRate: 0.5,
      personality: 'The Newbie',
    };
  }

  // Aggression: how often the player raises vs. calls
  const allPlayerActions = history.flatMap(h =>
    h.actions.filter(a => a.playerId === 'self')
  );
  const raiseCount = allPlayerActions.filter(a => a.action === 'raise').length;
  const callCount = allPlayerActions.filter(a =>
    a.action === 'chaal' || a.action === 'blind'
  ).length;
  const totalBettingActions = raiseCount + callCount;
  const aggression = totalBettingActions > 0 ? raiseCount / totalBettingActions : 0.5;

  // Tightness: fold rate (how many hands folded / total hands)
  const foldedHands = history.filter(h => h.result === 'fold').length;
  const tightness = history.length > 0 ? foldedHands / history.length : 0.5;

  // Bluff frequency: hands where player raised/bet with weak cards (below pair)
  const bluffHands = history.filter(h => {
    const strength = calculateHandStrength(h.cards);
    const didBetAggressively = h.actions.some(
      a => a.playerId === 'self' && (a.action === 'raise')
    );
    return strength < 0.3 && didBetAggressively;
  }).length;
  const handsWithAction = history.filter(h => h.result !== 'fold').length;
  const bluffFrequency = handsWithAction > 0 ? bluffHands / handsWithAction : 0;

  // Blind play rate: how often player stayed blind
  const blindHands = history.filter(h => h.wasBlind).length;
  const blindPlayRate = history.length > 0 ? blindHands / history.length : 0.5;

  // Showdown rate: how often player reached the show
  const showdownHands = history.filter(h =>
    h.actions.some(a => a.playerId === 'self' && a.action === 'show')
  ).length;
  const nonFoldedHands = history.filter(h => h.result !== 'fold').length;
  const showdownRate = nonFoldedHands > 0 ? showdownHands / nonFoldedHands : 0.5;

  const personality = classifyPersonality(aggression, tightness, bluffFrequency);

  return {
    aggression: clamp(aggression),
    tightness: clamp(tightness),
    bluffFrequency: clamp(bluffFrequency),
    blindPlayRate: clamp(blindPlayRate),
    showdownRate: clamp(showdownRate),
    personality,
  };
}

/**
 * Suggest the optimal action given the current game state.
 */
export function suggestOptimalAction(state: GameStateSnapshot): SuggestedAction {
  const strength = calculateHandStrength(state.myCards);
  const potOdds = state.currentBet / Math.max(state.pot, 1);
  // Trail or pure sequence — always raise
  if (strength >= 0.85) {
    // Consider slow play if many opponents
    if (state.activePlayers >= 4 && state.roundNumber <= 2) {
      return {
        action: state.isBlind ? 'blind' : 'chaal',
        confidence: 0.8,
        reasoning: `Monster hand (${HAND_RANK_DISPLAY[evaluateHand(state.myCards).rank]}). Slow-playing to keep opponents in and build a bigger pot.`,
      };
    }
    return {
      action: 'raise',
      confidence: 0.95,
      reasoning: `Excellent hand (${HAND_RANK_DISPLAY[evaluateHand(state.myCards).rank]}). Raising for maximum value.`,
    };
  }

  // Sequence or good color — play aggressively but consider pot odds
  if (strength >= 0.5) {
    if (potOdds > 0.5 && state.activePlayers <= 2) {
      return {
        action: 'raise',
        confidence: 0.7,
        reasoning: `Strong hand with favorable pot odds (${(potOdds * 100).toFixed(0)}%). Raising to pressure the remaining opponent.`,
      };
    }
    return {
      action: state.isBlind ? 'blind' : 'chaal',
      confidence: 0.75,
      reasoning: `Solid hand. Calling to see more action — no need to inflate the pot yet.`,
    };
  }

  // Pair — depends on pair rank
  if (strength >= 0.3) {
    if (state.activePlayers <= 2 && state.roundNumber >= 3) {
      return {
        action: state.isBlind ? 'blind' : 'chaal',
        confidence: 0.6,
        reasoning: `Medium-strength hand. Worth continuing against fewer opponents but not strong enough to raise.`,
      };
    }
    if (state.activePlayers >= 4 && potOdds > 0.4) {
      return {
        action: 'pack',
        confidence: 0.55,
        reasoning: `With ${state.activePlayers} opponents and growing pot odds, a medium hand has low chances. Folding preserves chips for stronger spots.`,
      };
    }
    return {
      action: state.isBlind ? 'blind' : 'chaal',
      confidence: 0.5,
      reasoning: `Medium hand. Worth seeing another round at minimum cost.`,
    };
  }

  // Weak hand — high card
  if (state.isBlind && state.roundNumber <= 2) {
    return {
      action: 'blind',
      confidence: 0.5,
      reasoning: `Weak cards, but playing blind is cheap. Worth staying in for a round to see if opponents fold.`,
    };
  }

  // Bluff opportunity check
  const bluff = detectBluffOpportunity(state);
  if (bluff.shouldBluff) {
    return {
      action: 'raise',
      confidence: bluff.confidence,
      reasoning: bluff.reasoning,
    };
  }

  // Default: fold weak hands in late rounds
  if (state.roundNumber >= 3 && strength < 0.25) {
    return {
      action: 'pack',
      confidence: 0.7,
      reasoning: `Weak hand (${HAND_RANK_DISPLAY[evaluateHand(state.myCards).rank]}) in a late round. The pot odds don't justify continued play.`,
    };
  }

  return {
    action: state.isBlind ? 'blind' : 'chaal',
    confidence: 0.45,
    reasoning: `Marginal hand. Calling at minimum cost — fold if the action heats up.`,
  };
}

/**
 * Detect whether the current spot is a good bluffing opportunity.
 */
export function detectBluffOpportunity(state: GameStateSnapshot): BluffOpportunity {
  const strength = calculateHandStrength(state.myCards);

  // Don't bluff with strong hands — that's value betting
  if (strength >= 0.5) {
    return { shouldBluff: false, confidence: 0, reasoning: 'Hand is strong enough to bet for value.' };
  }

  let bluffScore = 0;
  const reasons: string[] = [];

  // Fewer opponents = better bluff spot
  if (state.activePlayers === 2) {
    bluffScore += 0.3;
    reasons.push('heads-up situation (only 1 opponent)');
  } else if (state.activePlayers === 3) {
    bluffScore += 0.15;
    reasons.push('few opponents remaining');
  }

  // Tight opponents fold more often
  const avgOpponentFoldRate = state.opponentTendencies.length > 0
    ? state.opponentTendencies.reduce((s, o) => s + o.foldRate, 0) / state.opponentTendencies.length
    : 0.3;

  if (avgOpponentFoldRate > 0.5) {
    bluffScore += 0.25;
    reasons.push('opponents tend to fold often');
  }

  // Small pot relative to current bet = opponents less committed
  if (state.pot < state.currentBet * 4) {
    bluffScore += 0.1;
    reasons.push('small pot means opponents are less committed');
  }

  // Playing blind gives mystique
  if (state.isBlind) {
    bluffScore += 0.15;
    reasons.push('playing blind adds uncertainty for opponents');
  }

  // Late rounds — opponents who haven't folded might be committed
  if (state.roundNumber >= 4) {
    bluffScore -= 0.2;
  }

  const shouldBluff = bluffScore >= 0.35;
  const confidence = clamp(bluffScore);

  return {
    shouldBluff,
    confidence,
    reasoning: shouldBluff
      ? `Good bluff spot: ${reasons.join(', ')}. A raise here has a ${(confidence * 100).toFixed(0)}% chance of success.`
      : `Not a great bluff spot. ${reasons.length > 0 ? reasons.join(', ') + '.' : 'No favorable conditions detected.'}`,
  };
}

/**
 * Calculate the expected value of an action in chips.
 */
export function calculateExpectedValue(
  action: ActionType,
  state: GameStateSnapshot
): number {
  const strength = calculateHandStrength(state.myCards);
  const pot = state.pot;
  const currentBet = state.currentBet;
  const activePlayers = state.activePlayers;

  // Approximate win probability based on hand strength and opponents
  const winProb = estimateWinProbability(strength, activePlayers);

  switch (action) {
    case 'pack':
      return 0; // EV of folding is 0 (you lose nothing more)

    case 'blind':
    case 'chaal': {
      const cost = state.isBlind ? currentBet : currentBet * 2;
      return (winProb * (pot + cost)) - ((1 - winProb) * cost);
    }

    case 'raise': {
      const raiseCost = state.isBlind ? currentBet * 2 : currentBet * 4;
      // Raising can make opponents fold — factor in fold equity
      const foldEquity = estimateFoldEquity(state);
      const evIfCalled = (winProb * (pot + raiseCost)) - ((1 - winProb) * raiseCost);
      const evIfFolded = pot;
      return (foldEquity * evIfFolded) + ((1 - foldEquity) * evIfCalled);
    }

    case 'show': {
      return (winProb * pot) - ((1 - winProb) * currentBet * 2);
    }

    default:
      return 0;
  }
}

// ─── Helper Functions ───────────────────────────────────────────────────

function calculatePotOdds(actions: RecordedAction[], potSize: number): number {
  const lastBet = actions.filter(a => a.amount > 0).pop();
  if (!lastBet || potSize === 0) return 0;
  return lastBet.amount / potSize;
}

function evaluateActions(entry: HandHistoryEntry, strength: number): OptimalActionStep[] {
  const steps: OptimalActionStep[] = [];
  const playerActions = entry.actions.filter(a => a.playerId === 'self');

  for (const action of playerActions) {
    const optimal = getOptimalActionForStrength(
      strength,
      action.round,
      action.isBlind,
      entry.opponentCount,
      entry.potSize
    );

    const wasOptimal = action.action === optimal.action ||
      (action.action === 'chaal' && optimal.action === 'blind') ||
      (action.action === 'blind' && optimal.action === 'chaal');

    steps.push({
      round: action.round,
      yourAction: action.action,
      optimalAction: optimal.action,
      wasOptimal,
      reasoning: optimal.reasoning,
    });
  }

  return steps;
}

function getOptimalActionForStrength(
  strength: number,
  round: number,
  isBlind: boolean,
  opponents: number,
  _potSize: number
): { action: ActionType; reasoning: string } {
  // Trail / pure sequence
  if (strength >= 0.85) {
    if (round <= 2 && opponents >= 3) {
      return {
        action: isBlind ? 'blind' : 'chaal',
        reasoning: 'With a monster hand early on, slow-playing keeps more opponents in the pot.',
      };
    }
    return {
      action: 'raise',
      reasoning: 'Premium hand — raise to extract maximum value.',
    };
  }

  // Sequence / good color
  if (strength >= 0.5) {
    return {
      action: isBlind ? 'blind' : 'chaal',
      reasoning: 'Strong hand — call to keep the pot growing without scaring opponents.',
    };
  }

  // Pair
  if (strength >= 0.3) {
    if (round >= 4 && opponents >= 3) {
      return {
        action: 'pack',
        reasoning: 'Medium hand in a late round with many opponents — the odds are against you.',
      };
    }
    return {
      action: isBlind ? 'blind' : 'chaal',
      reasoning: 'Medium hand — worth continuing at minimum cost.',
    };
  }

  // High card
  if (round <= 2 && isBlind) {
    return {
      action: 'blind',
      reasoning: 'Weak cards, but blind play is cheap early — give it a shot.',
    };
  }

  if (round >= 3) {
    return {
      action: 'pack',
      reasoning: 'Weak hand in a late round — cut your losses.',
    };
  }

  return {
    action: isBlind ? 'blind' : 'chaal',
    reasoning: 'Marginal spot — call if cheap, fold if pressured.',
  };
}

function determineVerdict(
  entry: HandHistoryEntry,
  strength: number,
  optimalPlayPct: number
): { verdict: Verdict; verdictLabel: string } {
  // Folded a strong hand = bad
  if (entry.result === 'fold' && strength >= 0.5) {
    return { verdict: 'bad', verdictLabel: 'Mistake!' };
  }

  // Called/raised with a very weak hand into late rounds and lost = bad
  if (entry.result === 'loss' && strength < 0.2 && entry.actions.length >= 4) {
    return { verdict: 'bad', verdictLabel: 'Mistake!' };
  }

  // Played optimally most of the time
  if (optimalPlayPct >= 80) {
    return { verdict: 'good', verdictLabel: 'Well Played!' };
  }

  if (optimalPlayPct >= 50) {
    return { verdict: 'neutral', verdictLabel: 'Could Be Better' };
  }

  // Won the hand despite suboptimal play
  if (entry.result === 'win') {
    if (optimalPlayPct >= 60) {
      return { verdict: 'good', verdictLabel: 'Well Played!' };
    }
    return { verdict: 'neutral', verdictLabel: 'Lucky Win' };
  }

  return { verdict: 'bad', verdictLabel: 'Mistake!' };
}

function buildExplanation(
  entry: HandHistoryEntry,
  strength: number,
  verdict: Verdict,
  optimalActions: OptimalActionStep[]
): string {
  const handName = HAND_RANK_DISPLAY[entry.handResult.rank];
  const suboptimalSteps = optimalActions.filter(a => !a.wasOptimal);

  if (verdict === 'good') {
    return `You played your ${handName} well. ${entry.result === 'win' ? `You won ${entry.chipsWon} chips.` : 'Sometimes good play still loses — that\'s variance.'}`;
  }

  if (verdict === 'bad' && entry.result === 'fold' && strength >= 0.5) {
    return `You folded a ${handName} — that's a strong hand worth playing. Folding here left value on the table.`;
  }

  if (suboptimalSteps.length > 0) {
    const firstMistake = suboptimalSteps[0];
    return `Your ${handName} was ${strength >= 0.5 ? 'strong' : strength >= 0.3 ? 'decent' : 'weak'}. In round ${firstMistake.round}, you chose to ${formatActionName(firstMistake.yourAction)} but the optimal play was to ${formatActionName(firstMistake.optimalAction)}. ${firstMistake.reasoning}`;
  }

  return `Your ${handName} ${entry.result === 'win' ? 'won' : 'lost'} the pot of ${entry.potSize} chips.`;
}

function generateTips(
  entry: HandHistoryEntry,
  strength: number,
  verdict: Verdict,
  _optimalActions: OptimalActionStep[]
): string[] {
  const tips: string[] = [];

  if (entry.result === 'fold' && strength >= 0.5) {
    tips.push(`A ${HAND_RANK_DISPLAY[entry.handResult.rank]} beats ~${((1 - strength) * 100).toFixed(0)}% of hands. Don't fold premium hands!`);
  }

  if (strength < 0.25 && entry.actions.filter(a => a.playerId === 'self').length >= 4) {
    tips.push('With weak cards, exit early rather than bleeding chips over many rounds.');
  }

  if (entry.wasBlind && entry.actions.filter(a => a.playerId === 'self' && a.action === 'blind').length >= 3) {
    tips.push('Playing blind for too many rounds reduces your edge. See your cards to make informed decisions.');
  }

  const raises = entry.actions.filter(a => a.playerId === 'self' && a.action === 'raise');
  if (raises.length >= 2 && strength < 0.3) {
    tips.push('Multiple raises with a weak hand is risky unless you\'re bluffing intentionally. Make sure bluffs are calculated.');
  }

  if (strength >= 0.7 && !entry.actions.some(a => a.playerId === 'self' && a.action === 'raise')) {
    tips.push('With a strong hand, consider raising to build the pot and extract value from opponents.');
  }

  if (tips.length === 0) {
    if (verdict === 'good') {
      tips.push('Solid play. Keep reading your opponents and adjusting your strategy.');
    } else {
      tips.push('Review pot odds before each action — it helps decide if calling is profitable.');
    }
  }

  return tips;
}

function buildEVSummary(entry: HandHistoryEntry, strength: number): string {
  if (entry.result === 'win') {
    return `+${entry.chipsWon} chips. Your hand had ${(strength * 100).toFixed(0)}% relative strength.`;
  }
  if (entry.result === 'fold') {
    const totalLost = entry.actions
      .filter(a => a.playerId === 'self')
      .reduce((sum, a) => sum + a.amount, 0);
    return `${totalLost > 0 ? `-${totalLost}` : '0'} chips lost before folding. Hand strength: ${(strength * 100).toFixed(0)}%.`;
  }
  return `-${entry.chipsLost} chips. Hand strength was ${(strength * 100).toFixed(0)}%.`;
}

function estimateWinProbability(strength: number, activePlayers: number): number {
  // Against N opponents, approximate: strength^(N-1)
  // This simulates: your hand has to beat all N-1 opponents
  const opponents = Math.max(activePlayers - 1, 1);
  return Math.pow(strength, opponents * 0.6); // 0.6 dampening factor for Teen Patti variance
}

function estimateFoldEquity(state: GameStateSnapshot): number {
  if (state.opponentTendencies.length === 0) return 0.3;
  const avgFoldRate = state.opponentTendencies.reduce((s, o) => s + o.foldRate, 0) /
    state.opponentTendencies.length;
  // More opponents = lower chance all fold
  return avgFoldRate * (1 / Math.sqrt(state.activePlayers - 1));
}

function classifyPersonality(
  aggression: number,
  tightness: number,
  bluffFrequency: number
): PlayStyleLabel {
  // Shark: aggressive + tight (selectively aggressive)
  if (aggression >= 0.5 && tightness >= 0.4) return 'The Shark';

  // Rock: low aggression + very tight (conservative)
  if (aggression < 0.3 && tightness >= 0.5) return 'The Rock';

  // Maniac: very aggressive + loose + bluffs a lot
  if (aggression >= 0.6 && tightness < 0.3 && bluffFrequency >= 0.3) return 'The Maniac';

  // Fox: moderate aggression with high bluff rate
  if (bluffFrequency >= 0.25 && aggression >= 0.3) return 'The Fox';

  // Calling Station: low aggression + loose (calls everything)
  if (aggression < 0.3 && tightness < 0.3) return 'The Calling Station';

  return 'The Fox';
}

function formatActionName(action: ActionType): string {
  const names: Record<ActionType, string> = {
    boot: 'ante',
    blind: 'play blind',
    chaal: 'chaal (call)',
    pack: 'pack (fold)',
    show: 'show',
    sideshow: 'sideshow',
    sideshow_accept: 'accept sideshow',
    sideshow_reject: 'reject sideshow',
    raise: 'raise',
    timeout: 'timeout',
  };
  return names[action] || action;
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

// ─── Session-Level Analytics ────────────────────────────────────────────

export interface SessionStats {
  handsPlayed: number;
  winRate: number;
  avgPotSize: number;
  biggestWin: number;
  totalChipsWon: number;
  totalChipsLost: number;
  netChips: number;
  optimalPlayRate: number;
  strengths: string[];
  weaknesses: string[];
  performanceScore: number;
  improvementTrend: number[];
}

export function computeSessionStats(history: HandHistoryEntry[]): SessionStats {
  if (history.length === 0) {
    return {
      handsPlayed: 0,
      winRate: 0,
      avgPotSize: 0,
      biggestWin: 0,
      totalChipsWon: 0,
      totalChipsLost: 0,
      netChips: 0,
      optimalPlayRate: 0,
      strengths: [],
      weaknesses: [],
      performanceScore: 50,
      improvementTrend: [],
    };
  }

  const wins = history.filter(h => h.result === 'win');
  const totalChipsWon = wins.reduce((s, h) => s + h.chipsWon, 0);
  const totalChipsLost = history.reduce((s, h) => s + h.chipsLost, 0);

  // Compute per-hand optimal percentages
  const optimalPerHand = history.map(h => {
    if (!h.analysis) return 50;
    return h.analysis.optimalPlayPercentage;
  });
  const avgOptimal = optimalPerHand.reduce((s, v) => s + v, 0) / optimalPerHand.length;

  // Performance score: weighted combo of win rate, optimal play, chip earnings
  const winRate = wins.length / history.length;
  const chipEfficiency = totalChipsWon > 0
    ? totalChipsWon / (totalChipsWon + totalChipsLost)
    : 0;
  const performanceScore = Math.round(
    (winRate * 30) + (avgOptimal * 0.4) + (chipEfficiency * 30)
  );

  // Improvement trend: rolling average of optimal play over batches of 5
  const batchSize = 5;
  const trend: number[] = [];
  for (let i = 0; i < optimalPerHand.length; i += batchSize) {
    const batch = optimalPerHand.slice(i, i + batchSize);
    trend.push(Math.round(batch.reduce((s, v) => s + v, 0) / batch.length));
  }

  // Strengths and weaknesses
  const profile = getPlayStyleProfile(history);
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (profile.blindPlayRate > 0.3) strengths.push('Your blind play rate is above average — good for keeping opponents guessing.');
  if (profile.aggression > 0.5 && winRate > 0.4) strengths.push('Aggressive play is paying off with a solid win rate.');
  if (profile.tightness > 0.4 && profile.tightness < 0.7) strengths.push('Good hand selection — you pick your spots well.');
  if (avgOptimal >= 70) strengths.push('You play optimally in the majority of decisions.');

  if (profile.tightness > 0.7) weaknesses.push('You fold too often — loosen up with medium-strength hands.');
  if (profile.tightness < 0.2) weaknesses.push('You play too many hands. Be more selective with starting cards.');
  if (profile.aggression < 0.2) weaknesses.push('You rarely raise. Aggression extracts more value from strong hands.');
  if (profile.bluffFrequency > 0.4) weaknesses.push('You bluff too often — opponents will start calling you down.');
  if (profile.bluffFrequency < 0.05 && history.length > 10) weaknesses.push('You almost never bluff. A well-timed bluff keeps opponents honest.');

  // Ensure at least one of each
  if (strengths.length === 0) strengths.push('Keep playing to unlock performance insights.');
  if (weaknesses.length === 0) weaknesses.push('No major leaks detected. Keep refining your edge!');

  return {
    handsPlayed: history.length,
    winRate: Math.round(winRate * 100),
    avgPotSize: Math.round(history.reduce((s, h) => s + h.potSize, 0) / history.length),
    biggestWin: Math.max(...history.map(h => h.chipsWon), 0),
    totalChipsWon,
    totalChipsLost,
    netChips: totalChipsWon - totalChipsLost,
    optimalPlayRate: Math.round(avgOptimal),
    strengths,
    weaknesses,
    performanceScore: clamp(performanceScore, 0, 100),
    improvementTrend: trend,
  };
}

// ─── Mock Data Generator ────────────────────────────────────────────────

const INDIAN_NAMES = [
  'Sharma Ji', 'Priya', 'Bunty', 'Rahul', 'Deepak', 'Anita',
  'Vikram', 'Neha', 'Arun', 'Kavita', 'Sanjay', 'Meera',
];

export function generateMockHandHistory(count: number = 20): HandHistoryEntry[] {
  const history: HandHistoryEntry[] = [];

  const suitPool: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const rankPool: Card['rank'][] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  function randomCard(): Card {
    const suit = suitPool[Math.floor(Math.random() * 4)];
    const rank = rankPool[Math.floor(Math.random() * 13)];
    const values: Record<string, number> = {
      '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
      '8': 8, '9': 9, '10': 10, J: 11, Q: 12, K: 13, A: 14,
    };
    return { suit, rank, value: values[rank] };
  }

  function randomCards(): Card[] {
    // Generate 3 unique cards
    const used = new Set<string>();
    const cards: Card[] = [];
    while (cards.length < 3) {
      const card = randomCard();
      const key = `${card.rank}${card.suit}`;
      if (!used.has(key)) {
        used.add(key);
        cards.push(card);
      }
    }
    return cards;
  }

  for (let i = 0; i < count; i++) {
    const cards = randomCards();
    const handResult = evaluateHand(cards);
    const strength = calculateHandStrength(cards);
    const opponentCount = 2 + Math.floor(Math.random() * 3); // 2–4 opponents

    // Simulate realistic actions
    const actions: RecordedAction[] = [];
    const roundCount = 2 + Math.floor(Math.random() * 4);
    const wasBlind = Math.random() < 0.35;

    let totalBet = 0;
    const bootAmount = [50, 100, 200][Math.floor(Math.random() * 3)];

    for (let r = 1; r <= roundCount; r++) {
      const isBlindRound = wasBlind && r <= 2;
      let action: ActionType;
      let amount = isBlindRound ? bootAmount : bootAmount * 2;

      if (strength >= 0.6 && r >= 2 && Math.random() < 0.5) {
        action = 'raise';
        amount = bootAmount * 4;
      } else if (strength < 0.2 && r >= 3 && Math.random() < 0.6) {
        action = 'pack';
        amount = 0;
      } else {
        action = isBlindRound ? 'blind' : 'chaal';
      }

      totalBet += amount;
      actions.push({
        playerId: 'self',
        action,
        amount,
        round: r,
        isBlind: isBlindRound,
      });

      if (action === 'pack') break;
    }

    // Determine result
    const lastAction = actions[actions.length - 1];
    let result: 'win' | 'loss' | 'fold';
    if (lastAction.action === 'pack') {
      result = 'fold';
    } else {
      // Higher strength = higher chance of winning
      result = Math.random() < strength * 0.7 + 0.1 ? 'win' : 'loss';
    }

    const potSize = totalBet + (bootAmount * 2 * opponentCount * roundCount);
    const chipsWon = result === 'win' ? potSize : 0;
    const chipsLost = result !== 'win' ? totalBet : 0;

    const opponentNames = Array.from({ length: opponentCount }, () =>
      INDIAN_NAMES[Math.floor(Math.random() * INDIAN_NAMES.length)]
    );

    const entry: HandHistoryEntry = {
      id: `hand-${Date.now()}-${i}`,
      timestamp: new Date(Date.now() - (count - i) * 180000), // 3 min apart
      cards,
      handResult,
      actions,
      potSize,
      result,
      chipsWon,
      chipsLost,
      opponentCount,
      wasBlind,
      playerName: 'You',
      opponentNames,
    };

    // Generate analysis
    entry.analysis = analyzeHand(entry);
    entry.coachingVerdict = entry.analysis.verdict;
    entry.coachingVerdictLabel = entry.analysis.verdictLabel;

    history.push(entry);
  }

  return history;
}
