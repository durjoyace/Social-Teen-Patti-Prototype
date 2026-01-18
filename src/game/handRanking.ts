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
