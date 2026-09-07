import type { RankCard } from "./ranking.js";
export type PlayerAction =
  | "see_cards"
  | "blind"
  | "chaal"
  | "raise"
  | "pack"
  | "show"
  | "sideshow"
  | "sideshow_accept"
  | "sideshow_reject";
export const PROTOCOL_VERSION: 1;
export const PLAYER_ACTIONS: readonly [
  "see_cards",
  "blind",
  "chaal",
  "raise",
  "pack",
  "show",
  "sideshow",
  "sideshow_accept",
  "sideshow_reject",
];
export const ACK_TIMEOUT_MS: number;
export function commandId(): string;
export interface AckSocket {
  connected: boolean;
  emit(event: string, ...args: any[]): unknown;
  on(event: string, callback: (...args: any[]) => void): unknown;
  off(event: string, callback: (...args: any[]) => void): unknown;
}
export function requestAck<T>(
  socket: AckSocket | null,
  event: string,
  data?: unknown,
  timeoutMs?: number,
): Promise<T>;
export interface ActionCommand {
  sessionId: string;
  expectedVersion: number;
  commandId: string;
  action: PlayerAction;
  amount?: number;
}
export interface RoomMember {
  odic: string;
  username: string;
  chips: string;
  isReady: boolean;
  isBot: boolean;
  seatPosition: number;
  connected: boolean;
  leaving: boolean;
}
export interface RoomView {
  id: string;
  name: string;
  variant: string;
  bootAmount: string;
  minBuyIn: string;
  maxBuyIn: string;
  maxPlayers: number;
  currentPlayers: number;
  status: "waiting" | "playing";
  isPrivate: boolean;
  roomCode?: string;
  createdBy: string;
  revision: number;
  players: RoomMember[];
}
export interface GameView {
  payouts: Record<string, string>;
  lastAction: {
    playerId: string;
    action: string;
    amount?: string;
    roundNumber: number;
    timestamp: number;
    metadata?: Record<string, unknown>;
  } | null;
  viewerPlayerId: string;
  sessionId: string;
  roomId: string;
  version: number;
  serverTime: number;
  canSeeCards: boolean;
  variant: string;
  status: "dealing" | "playing" | "showdown" | "finished";
  pot: string;
  currentBet: string;
  bootAmount: string;
  roundNumber: number;
  winners: string[];
  dealerIndex: number;
  currentPlayerIndex: number;
  sideshowPending?: { requesterId: string; targetId: string };
  turnStartedAt: number;
  turnTimeoutMs: number;
  availableActions: PlayerAction[];
  players: Array<{
    id: string;
    odic: string;
    username: string;
    seatPosition: number;
    chipsInPlay: string;
    currentBet: string;
    status: string;
    isBlind: boolean;
    isDealer: boolean;
    isTurn: boolean;
    isBot: boolean;
    cards?: RankCard[];
    handResult?: { rank: string; description: string };
  }>;
}
