import { Card, Suit, Rank } from '../types';

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// Card value for comparison (Ace is highest in Teen Patti)
export function getCardValue(rank: Rank): number {
  const values: Record<Rank, number> = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 11, 'Q': 12, 'K': 13, 'A': 14
  };
  return values[rank];
}

// Create a single card
export function createCard(suit: Suit, rank: Rank): Card {
  return {
    suit,
    rank,
    value: getCardValue(rank)
  };
}

// Create a full deck of 52 cards
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(createCard(suit, rank));
    }
  }
  return deck;
}

// Fisher-Yates shuffle algorithm
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Deal cards from the deck
export function dealCards(deck: Card[], numCards: number): { dealt: Card[]; remaining: Card[] } {
  return {
    dealt: deck.slice(0, numCards),
    remaining: deck.slice(numCards)
  };
}

// Deal to multiple players
export function dealToPlayers(deck: Card[], numPlayers: number, cardsPerPlayer: number = 3): { hands: Card[][]; remaining: Card[] } {
  const hands: Card[][] = [];
  let remaining = [...deck];

  for (let i = 0; i < numPlayers; i++) {
    const { dealt, remaining: rest } = dealCards(remaining, cardsPerPlayer);
    hands.push(dealt);
    remaining = rest;
  }

  return { hands, remaining };
}

// Get suit symbol for display
export function getSuitSymbol(suit: Suit): string {
  const symbols: Record<Suit, string> = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠'
  };
  return symbols[suit];
}

// Get suit color
export function getSuitColor(suit: Suit): 'red' | 'black' {
  return suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black';
}

// Card display string
export function cardToString(card: Card): string {
  return `${card.rank}${getSuitSymbol(card.suit)}`;
}

// Sort cards by value (descending)
export function sortCards(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => b.value - a.value);
}
