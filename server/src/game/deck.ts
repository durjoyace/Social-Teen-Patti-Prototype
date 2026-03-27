import crypto from 'node:crypto';

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  suit: Suit;
  rank: Rank;
  value: number;
}

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const RANK_VALUES: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
  '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

export function createCard(suit: Suit, rank: Rank): Card {
  return { suit, rank, value: RANK_VALUES[rank] };
}

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(createCard(suit, rank));
    }
  }
  return deck;
}

/** Cryptographically secure Fisher-Yates shuffle using Node crypto */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    // Use crypto.randomInt for fair, unpredictable randomness
    const j = crypto.randomInt(0, i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealCards(deck: Card[], count: number): { dealt: Card[]; remaining: Card[] } {
  return {
    dealt: deck.slice(0, count),
    remaining: deck.slice(count),
  };
}

export function dealToPlayers(deck: Card[], numPlayers: number, cardsPerPlayer = 3) {
  const hands: Card[][] = [];
  let remaining = [...deck];
  for (let i = 0; i < numPlayers; i++) {
    const result = dealCards(remaining, cardsPerPlayer);
    hands.push(result.dealt);
    remaining = result.remaining;
  }
  return { hands, remaining };
}

export function sortCards(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => b.value - a.value);
}

export function cardToString(card: Card): string {
  const symbols: Record<Suit, string> = {
    hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠'
  };
  return `${card.rank}${symbols[card.suit]}`;
}

export function handToString(cards: Card[]): string {
  return cards.map(cardToString).join(' ');
}
