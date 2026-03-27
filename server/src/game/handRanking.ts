import { Card, sortCards } from './deck.js';

export type HandRank = 'high_card' | 'pair' | 'color' | 'sequence' | 'pure_sequence' | 'trail';
export type GameVariant = 'CLASSIC' | 'JOKER' | 'MUFLIS' | 'AK47' | 'HUKAM' | 'LOWBALL' | 'BEST_OF_FOUR' | 'DEALERS_CHOICE';

export interface HandResult {
  rank: HandRank;
  cards: Card[];
  highCard: number;
  secondCard: number;
  thirdCard: number;
  description: string;
  strength: number; // 0.0 to 1.0 normalized
}

// ─── Hand Detection ────────────────────────────────────────────────────────

function isTrail(cards: Card[]): boolean {
  return cards[0].value === cards[1].value && cards[1].value === cards[2].value;
}

function isPureSequence(cards: Card[]): boolean {
  const sorted = sortCards(cards);
  const sameSuit = sorted[0].suit === sorted[1].suit && sorted[1].suit === sorted[2].suit;
  if (!sameSuit) return false;
  return isSequentialValues(sorted);
}

function isSequence(cards: Card[]): boolean {
  return isSequentialValues(sortCards(cards));
}

function isSequentialValues(sorted: Card[]): boolean {
  // A-2-3 special case (lowest straight)
  if (sorted[0].value === 14 && sorted[1].value === 3 && sorted[2].value === 2) return true;
  // A-K-Q special case (highest straight)
  if (sorted[0].value === 14 && sorted[1].value === 13 && sorted[2].value === 12) return true;
  // Normal consecutive
  return sorted[0].value - sorted[1].value === 1 && sorted[1].value - sorted[2].value === 1;
}

function isColor(cards: Card[]): boolean {
  return cards[0].suit === cards[1].suit && cards[1].suit === cards[2].suit;
}

function isPair(cards: Card[]): boolean {
  return (
    cards[0].value === cards[1].value ||
    cards[1].value === cards[2].value ||
    cards[0].value === cards[2].value
  );
}

function getPairValue(cards: Card[]): number {
  const sorted = sortCards(cards);
  if (sorted[0].value === sorted[1].value) return sorted[0].value;
  return sorted[1].value; // sorted[1] must equal sorted[2]
}

function getKicker(cards: Card[], pairValue: number): number {
  return sortCards(cards).find(c => c.value !== pairValue)!.value;
}

// ─── Strength Calculation ──────────────────────────────────────────────────

const RANK_BASE: Record<HandRank, number> = {
  high_card: 0,
  pair: 1000,
  color: 2000,
  sequence: 3000,
  pure_sequence: 4000,
  trail: 5000,
};

/** Returns a numeric strength for precise comparison. Higher is better. */
function calculateNumericStrength(rank: HandRank, sorted: Card[], variant: GameVariant): number {
  let base = RANK_BASE[rank];

  switch (rank) {
    case 'trail':
      base += sorted[0].value * 10;
      break;
    case 'pure_sequence':
    case 'sequence': {
      // A-2-3 is the lowest sequence (high card = 3)
      const highCard = (sorted[0].value === 14 && sorted[1].value === 3 && sorted[2].value === 2)
        ? 3
        : sorted[0].value;
      base += highCard * 10;
      break;
    }
    case 'color':
      base += sorted[0].value * 100 + sorted[1].value * 10 + sorted[2].value;
      break;
    case 'pair': {
      const pv = getPairValue(sorted);
      const kicker = getKicker(sorted, pv);
      base += pv * 100 + kicker;
      break;
    }
    case 'high_card':
      base += sorted[0].value * 100 + sorted[1].value * 10 + sorted[2].value;
      break;
  }

  // In Muflis/Lowball, invert the ranking (lower hand wins)
  if (variant === 'MUFLIS' || variant === 'LOWBALL') {
    return 10000 - base;
  }

  return base;
}

// ─── Public API ────────────────────────────────────────────────────────────

export function evaluateHand(cards: Card[], variant: GameVariant = 'CLASSIC'): HandResult {
  if (cards.length !== 3) throw new Error('Teen Patti requires exactly 3 cards');
  const sorted = sortCards(cards);

  let rank: HandRank;
  let description: string;

  if (isTrail(sorted)) {
    rank = 'trail';
    description = `Trail of ${sorted[0].rank}s`;
  } else if (isPureSequence(sorted)) {
    rank = 'pure_sequence';
    description = `Pure Sequence ${sorted.map(c => c.rank).join('-')}`;
  } else if (isSequence(sorted)) {
    rank = 'sequence';
    description = `Sequence ${sorted.map(c => c.rank).join('-')}`;
  } else if (isColor(sorted)) {
    rank = 'color';
    description = `Color (${sorted[0].suit})`;
  } else if (isPair(sorted)) {
    const pv = getPairValue(sorted);
    const pairRank = sorted.find(c => c.value === pv)!.rank;
    rank = 'pair';
    description = `Pair of ${pairRank}s`;
  } else {
    rank = 'high_card';
    description = `High Card ${sorted[0].rank}`;
  }

  const strength = calculateNumericStrength(rank, sorted, variant);
  const maxStrength = RANK_BASE.trail + 14 * 10; // AAA
  const normalizedStrength = strength / maxStrength;

  return {
    rank,
    cards: sorted,
    highCard: sorted[0].value,
    secondCard: sorted[1].value,
    thirdCard: sorted[2].value,
    description,
    strength: normalizedStrength,
  };
}

/** Compare two hands. Returns positive if hand1 wins, negative if hand2 wins, 0 for tie. */
export function compareHands(hand1: HandResult, hand2: HandResult): number {
  return hand1.strength - hand2.strength;
}

export function findWinners(hands: { playerId: string; hand: HandResult }[]): string[] {
  if (hands.length === 0) return [];
  if (hands.length === 1) return [hands[0].playerId];

  let best = hands[0];
  let winners = [best];

  for (let i = 1; i < hands.length; i++) {
    const cmp = compareHands(hands[i].hand, best.hand);
    if (cmp > 0) {
      best = hands[i];
      winners = [best];
    } else if (cmp === 0) {
      winners.push(hands[i]);
    }
  }

  return winners.map(w => w.playerId);
}

export function getHandRankName(rank: HandRank): string {
  const names: Record<HandRank, string> = {
    trail: 'Trail (Three of a Kind)',
    pure_sequence: 'Pure Sequence (Straight Flush)',
    sequence: 'Sequence (Straight)',
    color: 'Color (Flush)',
    pair: 'Pair',
    high_card: 'High Card',
  };
  return names[rank];
}

// ─── AI Decision Engine ────────────────────────────────────────────────────

export type AIPersonality = 'conservative' | 'balanced' | 'aggressive';

interface AIDecisionParams {
  foldThreshold: number;
  raiseThreshold: number;
  bluffChance: number;
  slowPlayChance: number;
  thinkingTimeBase: number;
  thinkingTimeVariance: number;
}

const AI_PARAMS: Record<AIPersonality, AIDecisionParams> = {
  conservative: {
    foldThreshold: 0.35,
    raiseThreshold: 0.7,
    bluffChance: 0.05,
    slowPlayChance: 0.3,
    thinkingTimeBase: 2000,
    thinkingTimeVariance: 1500,
  },
  balanced: {
    foldThreshold: 0.25,
    raiseThreshold: 0.6,
    bluffChance: 0.15,
    slowPlayChance: 0.2,
    thinkingTimeBase: 1500,
    thinkingTimeVariance: 1000,
  },
  aggressive: {
    foldThreshold: 0.15,
    raiseThreshold: 0.45,
    bluffChance: 0.35,
    slowPlayChance: 0.1,
    thinkingTimeBase: 1000,
    thinkingTimeVariance: 800,
  },
};

export interface AIDecisionContext {
  handStrength: number;
  personality: AIPersonality;
  potOdds: number;
  playersRemaining: number;
  isBlind: boolean;
  roundNumber: number;
}

export type AIAction = 'pack' | 'chaal' | 'blind' | 'raise' | 'show';

export function makeAIDecision(ctx: AIDecisionContext): { action: AIAction; isBluff: boolean } {
  const params = AI_PARAMS[ctx.personality];
  const rand = Math.random();

  // Weak hand — fold or bluff
  if (ctx.handStrength < params.foldThreshold) {
    if (rand < params.bluffChance) {
      return { action: 'raise', isBluff: true };
    }
    const foldChance = (1 - ctx.handStrength) * (1 + ctx.potOdds * 0.5) * (ctx.playersRemaining / 4);
    if (rand < foldChance * 0.8) {
      return { action: 'pack', isBluff: false };
    }
  }

  // Strong hand — raise or slow play
  if (ctx.handStrength > params.raiseThreshold) {
    if (rand < params.slowPlayChance) {
      return { action: ctx.isBlind ? 'blind' : 'chaal', isBluff: false };
    }
    return { action: 'raise', isBluff: false };
  }

  // Medium hand — mostly call, occasionally raise
  const raiseChance = (ctx.handStrength - params.foldThreshold)
    / (params.raiseThreshold - params.foldThreshold) * 0.3;
  if (rand < raiseChance) {
    return { action: 'raise', isBluff: false };
  }

  return { action: ctx.isBlind ? 'blind' : 'chaal', isBluff: false };
}

export function calculateAIThinkingTime(handStrength: number, personality: AIPersonality): number {
  const params = AI_PARAMS[personality];
  const strengthFactor = 1 - handStrength * 0.5;
  const baseTime = params.thinkingTimeBase * strengthFactor;
  const variance = (Math.random() - 0.5) * 2 * params.thinkingTimeVariance;
  return Math.max(500, Math.round(baseTime + variance));
}
