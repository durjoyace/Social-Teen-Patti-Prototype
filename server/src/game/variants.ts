import { Card, Suit, Rank, createDeck, shuffleDeck, createCard, sortCards } from './deck.js';
import { HandResult, GameVariant, evaluateHand } from './handRanking.js';
import crypto from 'node:crypto';

// ─── Variant Configurations ────────────────────────────────────────────────

export interface VariantConfig {
  name: string;
  description: string;
  cardsPerPlayer: number;
  hasWildCards: boolean;
  wildCardSelector?: (deck: Card[]) => { wildCards: Card[]; jokerCard?: Card };
  handEvaluator?: (cards: Card[], wildCards: Card[]) => HandResult;
  invertRanking: boolean;
  maxPlayers: number;
  specialRules: string[];
}

export const VARIANT_CONFIGS: Record<GameVariant, VariantConfig> = {
  CLASSIC: {
    name: 'Classic',
    description: 'Standard Teen Patti — highest hand wins',
    cardsPerPlayer: 3,
    hasWildCards: false,
    invertRanking: false,
    maxPlayers: 9,
    specialRules: [],
  },

  JOKER: {
    name: 'Joker',
    description: 'One card is drawn as joker — all cards of that rank are wild',
    cardsPerPlayer: 3,
    hasWildCards: true,
    wildCardSelector: selectJokerWild,
    handEvaluator: evaluateWithWilds,
    invertRanking: false,
    maxPlayers: 9,
    specialRules: [
      'A random card is drawn as the joker',
      'All cards of that rank become wild',
      'Wild cards can substitute for any card',
      'A hand with a wild card is ranked slightly below the natural equivalent',
    ],
  },

  MUFLIS: {
    name: 'Muflis (Lowball)',
    description: 'Lowest hand wins — the worst hand is the best!',
    cardsPerPlayer: 3,
    hasWildCards: false,
    invertRanking: true,
    maxPlayers: 9,
    specialRules: [
      'Hand rankings are completely inverted',
      'High Card beats Trail',
      'Lowest cards are the most valuable',
      'Strategy is reversed — fold strong hands, play weak ones',
    ],
  },

  AK47: {
    name: 'AK47',
    description: 'Aces, Kings, 4s, and 7s are all wild cards',
    cardsPerPlayer: 3,
    hasWildCards: true,
    wildCardSelector: selectAK47Wilds,
    handEvaluator: evaluateWithWilds,
    invertRanking: false,
    maxPlayers: 9,
    specialRules: [
      'All Aces, Kings, 4s, and 7s are wild',
      'Wild cards can be any card you need',
      'Very high chance of strong hands',
      'Trail becomes very common — play aggressively',
    ],
  },

  HUKAM: {
    name: 'Hukam',
    description: 'Dealer declares a trump suit — that suit beats all others',
    cardsPerPlayer: 3,
    hasWildCards: false,
    invertRanking: false,
    maxPlayers: 9,
    specialRules: [
      'Dealer declares a trump suit before dealing',
      'Cards of the trump suit are ranked higher',
      'A flush in trump suit beats all other flushes',
      'High card in trump suit beats high card in other suits',
    ],
  },

  LOWBALL: {
    name: 'Lowball',
    description: 'Same as Muflis — lowest hand wins',
    cardsPerPlayer: 3,
    hasWildCards: false,
    invertRanking: true,
    maxPlayers: 9,
    specialRules: ['Identical to Muflis — lowest hand wins'],
  },

  BEST_OF_FOUR: {
    name: 'Best of Four',
    description: 'Get 4 cards, pick your best 3-card hand',
    cardsPerPlayer: 4,
    hasWildCards: false,
    invertRanking: false,
    maxPlayers: 6, // Fewer players since more cards dealt
    specialRules: [
      'Each player receives 4 cards',
      'Choose the best 3-card combination',
      'The discarded card is not revealed',
      'More strategic hand selection',
    ],
  },

  DEALERS_CHOICE: {
    name: "Dealer's Choice",
    description: 'Dealer picks the variant each round — keeps it fresh!',
    cardsPerPlayer: 3,
    hasWildCards: false,
    invertRanking: false,
    maxPlayers: 9,
    specialRules: [
      'Each round, the dealer selects a variant',
      'All players must play the chosen variant',
      'Variant changes every round',
      'Tests versatility across all game types',
    ],
  },
};

// ─── Wild Card Selection ───────────────────────────────────────────────────

function selectJokerWild(deck: Card[]) {
  // Draw a random card from the deck as the joker indicator
  const jokerIndex = crypto.randomInt(0, deck.length);
  const jokerCard = deck[jokerIndex];

  // All cards of that rank are wild
  const wildCards = deck.filter(c => c.rank === jokerCard.rank);

  return { wildCards, jokerCard };
}

function selectAK47Wilds(deck: Card[]) {
  const wildRanks: Rank[] = ['A', 'K', '4', '7'];
  const wildCards = deck.filter(c => wildRanks.includes(c.rank));

  return { wildCards };
}

// ─── Wild Card Hand Evaluation ─────────────────────────────────────────────

function evaluateWithWilds(cards: Card[], wildCards: Card[]): HandResult {
  const wildRanks = new Set(wildCards.map(c => c.rank));
  const isWild = (card: Card) => wildRanks.has(card.rank);

  const numWilds = cards.filter(isWild).length;
  const nonWilds = cards.filter(c => !isWild(c));

  if (numWilds === 3) {
    // All wild — best possible hand: Trail of Aces
    return {
      rank: 'trail',
      cards,
      highCard: 14,
      secondCard: 14,
      thirdCard: 14,
      description: 'Trail of Aces (Wild)',
      strength: 0.99, // Slightly less than natural trail
    };
  }

  if (numWilds === 2) {
    // Two wild cards — make the best hand possible with the one non-wild
    const card = nonWilds[0];
    // Trail with the non-wild card value
    return {
      rank: 'trail',
      cards,
      highCard: card.value,
      secondCard: card.value,
      thirdCard: card.value,
      description: `Trail of ${card.rank}s (Wild)`,
      strength: 0.95,
    };
  }

  if (numWilds === 1) {
    // One wild card — find the best hand by trying all possible substitutions
    return findBestWithOneWild(cards, isWild);
  }

  // No wilds — evaluate normally
  return evaluateHand(cards, 'CLASSIC');
}

function findBestWithOneWild(cards: Card[], isWild: (c: Card) => boolean): HandResult {
  const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  const nonWilds = cards.filter(c => !isWild(c));
  let bestResult: HandResult | null = null;

  // Try every possible substitution for the wild card
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      const substituted = [...nonWilds, createCard(suit, rank)];
      const result = evaluateHand(substituted, 'CLASSIC');

      if (!bestResult || result.strength > bestResult.strength) {
        bestResult = result;
      }
    }
  }

  if (bestResult) {
    bestResult.cards = cards; // Keep original cards for display
    bestResult.description += ' (Wild)';
    bestResult.strength *= 0.98; // Slight penalty for wild-assisted hand
  }

  return bestResult || evaluateHand(cards, 'CLASSIC');
}

// ─── Best of Four Selection ────────────────────────────────────────────────

export function findBestThreeFromFour(cards: Card[], variant: GameVariant = 'CLASSIC'): {
  bestHand: Card[];
  discarded: Card;
  result: HandResult;
} {
  if (cards.length !== 4) throw new Error('Best of Four requires exactly 4 cards');

  let bestResult: HandResult | null = null;
  let bestHand: Card[] = [];
  let discarded: Card = cards[0];

  // Try all 4 possible 3-card combinations
  for (let skip = 0; skip < 4; skip++) {
    const hand = cards.filter((_, i) => i !== skip);
    const result = evaluateHand(hand, variant);

    if (!bestResult || result.strength > bestResult.strength) {
      bestResult = result;
      bestHand = hand;
      discarded = cards[skip];
    }
  }

  return {
    bestHand,
    discarded,
    result: bestResult!,
  };
}

// ─── Hukam (Trump Suit) Evaluation ────────────────────────────────────────

export function evaluateWithTrump(cards: Card[], trumpSuit: Suit): HandResult {
  const base = evaluateHand(cards, 'CLASSIC');

  // Check if hand contains trump suit cards
  const trumpCards = cards.filter(c => c.suit === trumpSuit);
  const nonTrumpCards = cards.filter(c => c.suit !== trumpSuit);

  // Trump suit gives a bonus to hand strength
  // This creates a sub-ordering where same-rank hands with trump cards beat non-trump
  const trumpBonus = trumpCards.length * 0.001; // Small bonus per trump card

  return {
    ...base,
    strength: base.strength + trumpBonus,
    description: trumpCards.length > 0
      ? `${base.description} (Trump: ${trumpCards.length})`
      : base.description,
  };
}

// ─── Dealer's Choice — Random Variant Selection ────────────────────────────

const DEALERS_CHOICE_POOL: GameVariant[] = [
  'CLASSIC', 'JOKER', 'MUFLIS', 'AK47', 'HUKAM',
];

export function selectRandomVariant(): GameVariant {
  const index = crypto.randomInt(0, DEALERS_CHOICE_POOL.length);
  return DEALERS_CHOICE_POOL[index];
}

// ─── Prepare Deck for Variant ──────────────────────────────────────────────

export interface PreparedDeck {
  deck: Card[];
  jokerCard?: Card;
  wildRanks?: Rank[];
  trumpSuit?: Suit;
}

export function prepareDeckForVariant(variant: GameVariant): PreparedDeck {
  const deck = shuffleDeck(createDeck());
  const config = VARIANT_CONFIGS[variant];

  if (!config.hasWildCards) {
    // For Hukam, randomly select trump suit
    if (variant === 'HUKAM') {
      const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
      const trumpSuit = suits[crypto.randomInt(0, suits.length)];
      return { deck, trumpSuit };
    }

    return { deck };
  }

  // For variants with wild cards
  if (config.wildCardSelector) {
    const { wildCards, jokerCard } = config.wildCardSelector(deck);
    const wildRanks = [...new Set(wildCards.map(c => c.rank))];
    return { deck, jokerCard, wildRanks };
  }

  return { deck };
}
