import { Card, HandRank, HandResult, GameVariant } from '../types';
import { sortCards } from './deck';

// Check if three cards are a Trail (Three of a Kind)
function isTrail(cards: Card[]): boolean {
  return cards[0].value === cards[1].value && cards[1].value === cards[2].value;
}

// Check if three cards are a Pure Sequence (Straight Flush)
function isPureSequence(cards: Card[]): boolean {
  const sorted = sortCards(cards);
  const sameSuit = cards[0].suit === cards[1].suit && cards[1].suit === cards[2].suit;
  if (!sameSuit) return false;

  // Check for A-2-3 special case
  if (sorted[0].value === 14 && sorted[1].value === 3 && sorted[2].value === 2) {
    return true;
  }

  // Normal sequence check
  return sorted[0].value - sorted[1].value === 1 && sorted[1].value - sorted[2].value === 1;
}

// Check if three cards are a Sequence (Straight)
function isSequence(cards: Card[]): boolean {
  const sorted = sortCards(cards);

  // Check for A-2-3 special case
  if (sorted[0].value === 14 && sorted[1].value === 3 && sorted[2].value === 2) {
    return true;
  }

  // Normal sequence check
  return sorted[0].value - sorted[1].value === 1 && sorted[1].value - sorted[2].value === 1;
}

// Check if three cards are a Color (Flush)
function isColor(cards: Card[]): boolean {
  return cards[0].suit === cards[1].suit && cards[1].suit === cards[2].suit;
}

// Check if three cards are a Pair
function isPair(cards: Card[]): boolean {
  return (
    cards[0].value === cards[1].value ||
    cards[1].value === cards[2].value ||
    cards[0].value === cards[2].value
  );
}

// Get the pair value for comparison
function getPairValue(cards: Card[]): number {
  const sorted = sortCards(cards);
  if (sorted[0].value === sorted[1].value) return sorted[0].value;
  if (sorted[1].value === sorted[2].value) return sorted[1].value;
  return sorted[0].value; // Shouldn't reach here if isPair is true
}

// Get high card value for comparison
function getHighCardValue(cards: Card[]): number {
  const sorted = sortCards(cards);
  // For A-2-3 sequence, 3 is the high card
  if (sorted[0].value === 14 && sorted[1].value === 3 && sorted[2].value === 2) {
    return 3;
  }
  return sorted[0].value;
}

// Evaluate a hand and return its rank
export function evaluateHand(cards: Card[], variant: GameVariant = 'classic'): HandResult {
  if (cards.length !== 3) {
    throw new Error('Teen Patti requires exactly 3 cards');
  }

  const sorted = sortCards(cards);

  // Check hand types in order of rank (highest first)
  if (isTrail(cards)) {
    return {
      rank: 'trail',
      cards: sorted,
      highCard: sorted[0].value,
      description: `Trail of ${sorted[0].rank}s`
    };
  }

  if (isPureSequence(cards)) {
    return {
      rank: 'pure_sequence',
      cards: sorted,
      highCard: getHighCardValue(cards),
      description: `Pure Sequence ${sorted.map(c => c.rank).join('-')}`
    };
  }

  if (isSequence(cards)) {
    return {
      rank: 'sequence',
      cards: sorted,
      highCard: getHighCardValue(cards),
      description: `Sequence ${sorted.map(c => c.rank).join('-')}`
    };
  }

  if (isColor(cards)) {
    return {
      rank: 'color',
      cards: sorted,
      highCard: sorted[0].value,
      description: `Color (${sorted[0].suit})`
    };
  }

  if (isPair(cards)) {
    const pairValue = getPairValue(cards);
    const pairRank = cards.find(c => c.value === pairValue)!.rank;
    return {
      rank: 'pair',
      cards: sorted,
      highCard: pairValue,
      description: `Pair of ${pairRank}s`
    };
  }

  // High card
  return {
    rank: 'high_card',
    cards: sorted,
    highCard: sorted[0].value,
    description: `High Card ${sorted[0].rank}`
  };
}

// Hand rank values for comparison
const HAND_RANK_VALUES: Record<HandRank, number> = {
  'high_card': 1,
  'pair': 2,
  'color': 3,
  'sequence': 4,
  'pure_sequence': 5,
  'trail': 6
};

// Compare two hands, returns positive if hand1 wins, negative if hand2 wins, 0 if tie
export function compareHands(hand1: HandResult, hand2: HandResult, variant: GameVariant = 'classic'): number {
  // In Muflis variant, rankings are reversed (lower is better)
  const multiplier = variant === 'muflis' ? -1 : 1;

  const rank1 = HAND_RANK_VALUES[hand1.rank];
  const rank2 = HAND_RANK_VALUES[hand2.rank];

  if (rank1 !== rank2) {
    return (rank1 - rank2) * multiplier;
  }

  // Same rank, compare by high card
  if (hand1.highCard !== hand2.highCard) {
    return (hand1.highCard - hand2.highCard) * multiplier;
  }

  // Compare remaining cards
  const cards1 = hand1.cards;
  const cards2 = hand2.cards;

  for (let i = 0; i < 3; i++) {
    if (cards1[i].value !== cards2[i].value) {
      return (cards1[i].value - cards2[i].value) * multiplier;
    }
  }

  return 0; // Perfect tie
}

// Find the winner(s) from multiple hands
export function findWinners(hands: { playerId: string; hand: HandResult }[], variant: GameVariant = 'classic'): string[] {
  if (hands.length === 0) return [];
  if (hands.length === 1) return [hands[0].playerId];

  let winners = [hands[0]];

  for (let i = 1; i < hands.length; i++) {
    const comparison = compareHands(hands[i].hand, winners[0].hand, variant);

    if (comparison > 0) {
      // New winner
      winners = [hands[i]];
    } else if (comparison === 0) {
      // Tie
      winners.push(hands[i]);
    }
  }

  return winners.map(w => w.playerId);
}

// Get hand rank display name
export function getHandRankName(rank: HandRank): string {
  const names: Record<HandRank, string> = {
    'trail': 'Trail (Three of a Kind)',
    'pure_sequence': 'Pure Sequence (Straight Flush)',
    'sequence': 'Sequence (Straight)',
    'color': 'Color (Flush)',
    'pair': 'Pair',
    'high_card': 'High Card'
  };
  return names[rank];
}

// Get hand probability (for display purposes)
export function getHandProbability(rank: HandRank): string {
  const probabilities: Record<HandRank, string> = {
    'trail': '0.24%',
    'pure_sequence': '0.22%',
    'sequence': '3.26%',
    'color': '4.96%',
    'pair': '16.94%',
    'high_card': '74.39%'
  };
  return probabilities[rank];
}

// Hand strength values for AI decision making (0.0 to 1.0)
const HAND_STRENGTH_VALUES: Record<HandRank, number> = {
  'trail': 1.0,
  'pure_sequence': 0.85,
  'sequence': 0.65,
  'color': 0.5,
  'pair': 0.3,
  'high_card': 0.1
};

// Calculate hand strength for AI decisions
// Returns a value between 0.0 (worst) and 1.0 (best)
export function calculateHandStrength(cards: Card[], variant: GameVariant = 'classic'): number {
  const result = evaluateHand(cards, variant);
  let baseStrength = HAND_STRENGTH_VALUES[result.rank];

  // In Muflis variant, invert the strength (low is better)
  if (variant === 'muflis') {
    baseStrength = 1 - baseStrength;
  }

  // Adjust strength based on high card within the rank
  // For example, a pair of Aces is stronger than a pair of 2s
  const highCardBonus = (result.highCard - 2) / 12 * 0.15; // Max +0.15 for Ace
  const adjustedStrength = Math.min(1, baseStrength + highCardBonus);

  return adjustedStrength;
}

// AI Personality types
export type AIPersonality = 'conservative' | 'balanced' | 'aggressive';

// AI decision parameters based on personality
export interface AIDecisionParams {
  foldThreshold: number;      // Strength below this = likely to fold
  raiseThreshold: number;     // Strength above this = likely to raise
  bluffChance: number;        // Chance to bluff with weak hand
  slowPlayChance: number;     // Chance to just call with strong hand
  thinkingTimeBase: number;   // Base thinking time in ms
  thinkingTimeVariance: number; // Random variance in ms
}

const AI_PERSONALITY_PARAMS: Record<AIPersonality, AIDecisionParams> = {
  conservative: {
    foldThreshold: 0.35,
    raiseThreshold: 0.7,
    bluffChance: 0.05,
    slowPlayChance: 0.3,
    thinkingTimeBase: 2000,
    thinkingTimeVariance: 1500
  },
  balanced: {
    foldThreshold: 0.25,
    raiseThreshold: 0.6,
    bluffChance: 0.15,
    slowPlayChance: 0.2,
    thinkingTimeBase: 1500,
    thinkingTimeVariance: 1000
  },
  aggressive: {
    foldThreshold: 0.15,
    raiseThreshold: 0.45,
    bluffChance: 0.35,
    slowPlayChance: 0.1,
    thinkingTimeBase: 1000,
    thinkingTimeVariance: 800
  }
};

export function getAIPersonalityParams(personality: AIPersonality): AIDecisionParams {
  return AI_PERSONALITY_PARAMS[personality];
}

// Calculate AI thinking time based on hand strength and personality
// Stronger hands = faster decisions (more confident)
export function calculateAIThinkingTime(
  handStrength: number,
  personality: AIPersonality
): number {
  const params = AI_PERSONALITY_PARAMS[personality];

  // Inverse relationship: stronger hand = faster decision
  const strengthFactor = 1 - handStrength * 0.5; // 0.5 to 1.0

  const baseTime = params.thinkingTimeBase * strengthFactor;
  const variance = (Math.random() - 0.5) * 2 * params.thinkingTimeVariance;

  return Math.max(500, Math.round(baseTime + variance)); // Minimum 500ms
}

// Make AI decision based on hand strength, personality, and game state
export interface AIDecisionContext {
  handStrength: number;
  personality: AIPersonality;
  potOdds: number;           // currentBet / pot ratio
  playersRemaining: number;
  isBlind: boolean;
  roundNumber: number;
}

export type AIAction = 'pack' | 'chaal' | 'blind' | 'raise' | 'show';

export function makeAIDecision(context: AIDecisionContext): { action: AIAction; shouldRaise: boolean } {
  const params = getAIPersonalityParams(context.personality);
  const rand = Math.random();

  // Determine if we should fold
  if (context.handStrength < params.foldThreshold) {
    // Weak hand - might fold or bluff
    if (rand < params.bluffChance) {
      // Bluffing - raise with weak hand!
      return { action: 'raise', shouldRaise: true };
    }
    // More likely to fold as more players remain and pot odds are bad
    const foldChance = (1 - context.handStrength) * (1 + context.potOdds * 0.5) * (context.playersRemaining / 4);
    if (rand < foldChance * 0.8) {
      return { action: 'pack', shouldRaise: false };
    }
  }

  // Determine if we should raise
  if (context.handStrength > params.raiseThreshold) {
    // Strong hand - might raise or slow play
    if (rand < params.slowPlayChance) {
      // Slow playing - just call with strong hand
      return { action: context.isBlind ? 'blind' : 'chaal', shouldRaise: false };
    }
    return { action: 'raise', shouldRaise: true };
  }

  // Medium strength hand - mostly call/continue
  // Slightly more likely to raise in later rounds
  const raiseChance = (context.handStrength - params.foldThreshold) /
                      (params.raiseThreshold - params.foldThreshold) * 0.3;

  if (rand < raiseChance) {
    return { action: 'raise', shouldRaise: true };
  }

  return { action: context.isBlind ? 'blind' : 'chaal', shouldRaise: false };
}
