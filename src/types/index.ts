// Card Types
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  suit: Suit;
  rank: Rank;
  value: number; // 1-13 for comparison
}

// Hand Rankings (lowest to highest)
export type HandRank = 'high_card' | 'pair' | 'color' | 'sequence' | 'pure_sequence' | 'trail';

export interface HandResult {
  rank: HandRank;
  cards: Card[];
  highCard: number;
  description: string;
}

// Game Variants
export type GameVariant = 'classic' | 'joker' | 'muflis' | 'ak47';

// Game Status
export type GameStatus = 'waiting' | 'playing' | 'finished';
export type PlayerStatus = 'waiting' | 'playing' | 'folded' | 'all_in' | 'show';

// Player Types
export interface User {
  id: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  chips: number;
  totalGames: number;
  gamesWon: number;
  biggestWin: number;
  currentStreak: number;
  bestStreak: number;
  level: number;
  experience: number;
  isOnline: boolean;
  lastSeen: Date;
  createdAt: Date;
}

export interface GamePlayer {
  id: string;
  sessionId: string;
  userId: string;
  user?: User;
  seatPosition: number;
  chipsInPlay: number;
  currentBet: number;
  cards?: Card[];
  handRank?: HandRank;
  status: PlayerStatus;
  isBlind: boolean;
  isDealer: boolean;
  isTurn: boolean;
}

// Room Types
export interface GameRoom {
  id: string;
  name: string;
  variant: GameVariant;
  minBuyIn: number;
  maxBuyIn: number;
  minBet: number;
  maxPlayers: number;
  currentPlayers: number;
  status: GameStatus;
  isPrivate: boolean;
  roomCode?: string;
  createdBy: string;
  players?: GamePlayer[];
}

// Game Session
export interface GameSession {
  id: string;
  roomId: string;
  variant: GameVariant;
  dealerPosition: number;
  currentTurn: number;
  pot: number;
  currentBet: number;
  bootAmount: number;
  status: GameStatus;
  roundNumber: number;
  round: number; // Alias for roundNumber
  players: GamePlayer[];
  communityCards?: Card[];
  startedAt: Date;
  endedAt?: Date;
}

// Game Actions
export type ActionType = 'boot' | 'blind' | 'chaal' | 'pack' | 'show' | 'sideshow' | 'raise';

export interface GameAction {
  id: string;
  sessionId: string;
  playerId: string;
  actionType: ActionType;
  amount?: number;
  createdAt: Date;
}

// Chat
export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  message: string;
  createdAt: Date;
}

// Friendships
export interface Friendship {
  id: string;
  userId: string;
  friendId: string;
  friend?: User;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: Date;
}

// Leaderboard
export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatarUrl?: string;
  chipsWon: number;
  gamesPlayed: number;
  gamesWon: number;
  rank: number;
}

// Transaction
export interface Transaction {
  id: string;
  userId: string;
  type: 'win' | 'loss' | 'buy_in' | 'cash_out' | 'bonus' | 'daily_reward';
  amount: number;
  balanceAfter: number;
  description?: string;
  createdAt: Date;
}

// Daily Reward
export interface DailyReward {
  id: string;
  userId: string;
  dayStreak: number;
  rewardAmount: number;
  claimedAt: Date;
}

// Socket Events
export interface ServerToClientEvents {
  'room:joined': (data: { room: GameRoom; player: GamePlayer }) => void;
  'room:left': (data: { playerId: string }) => void;
  'room:updated': (data: GameRoom) => void;
  'game:started': (data: GameSession) => void;
  'game:action': (data: { action: GameAction; session: GameSession }) => void;
  'game:turn': (data: { playerId: string; timeLeft: number }) => void;
  'game:ended': (data: { session: GameSession; winners: GamePlayer[] }) => void;
  'cards:dealt': (data: { cards: Card[] }) => void;
  'chat:message': (data: ChatMessage) => void;
  'player:online': (data: { userId: string; isOnline: boolean }) => void;
  'error': (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  'room:join': (data: { roomId: string; buyIn: number }) => void;
  'room:leave': () => void;
  'room:create': (data: Partial<GameRoom>) => void;
  'game:action': (data: { actionType: ActionType; amount?: number }) => void;
  'game:start': () => void;
  'chat:send': (data: { message: string }) => void;
}
