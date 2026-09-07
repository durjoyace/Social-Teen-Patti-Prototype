import { type Card, createDeck, shuffleDeck, dealToPlayers } from "./deck.js";
import {
  evaluateHand,
  compareHands,
  findWinners,
  type HandResult,
  type GameVariant,
} from "./handRanking.js";
import crypto from "node:crypto";
import type {
  GameView,
  PlayerAction,
} from "../../../packages/shared/src/rules/protocol.js";
import { SUPPORTED_VARIANTS } from "../../../packages/shared/src/rules/ranking.js";

// ─── Types ─────────────────────────────────────────────────────────────────

export type PlayerStatus =
  | "waiting"
  | "playing"
  | "folded"
  | "all_in"
  | "show"
  | "disconnected";
export type ActionType =
  | "see_cards"
  | "boot"
  | "blind"
  | "chaal"
  | "raise"
  | "pack"
  | "show"
  | "sideshow"
  | "sideshow_accept"
  | "sideshow_reject"
  | "timeout";

export interface PlayerState {
  id: string; // Player session ID
  odic: string; // User ID
  username: string;
  seatPosition: number;
  chips: bigint; // Total chips brought to table
  chipsInPlay: bigint; // Current chips
  currentBet: bigint;
  cards: Card[];
  handResult?: HandResult;
  status: PlayerStatus;
  isBlind: boolean;
  isDealer: boolean;
  isTurn: boolean;
  isBot: boolean;
  botPersonality?: string;
  disconnectedAt?: number;
}

export interface GameState {
  sessionId: string;
  version: number;
  roomId: string;
  variant: GameVariant;

  // Players
  players: PlayerState[];
  dealerIndex: number;
  currentPlayerIndex: number;

  // Betting
  pot: bigint;
  currentBet: bigint;
  bootAmount: bigint;
  minBet: bigint;
  chalLimit: number; // Max chaal rounds (0 = unlimited)
  roundNumber: number;

  // Cards
  deck: Card[];

  // State
  status: "dealing" | "playing" | "showdown" | "finished";
  winners: string[];
  showdownPlayers: string[];
  sideshowPending?: { requesterId: string; targetId: string };

  // Timing
  turnStartedAt: number;
  turnTimeoutMs: number;
  startedAt: number;
  endedAt?: number;

  // Action history
  actions: GameAction[];
}

export interface GameAction {
  playerId: string;
  action: ActionType;
  amount?: bigint;
  roundNumber: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface GameConfig {
  roomId: string;
  variant: GameVariant;
  bootAmount: bigint;
  minBet: bigint;
  chalLimit?: number;
  turnTimeoutMs?: number;
}

// ─── Game Initialization ───────────────────────────────────────────────────

export function initializeGame(
  config: GameConfig,
  players: Array<{
    userId: string;
    username: string;
    chips: bigint;
    isBot?: boolean;
    botPersonality?: string;
  }>,
): GameState {
  if (players.length < 2 || players.length > 9) {
    throw new Error(`Invalid player count: ${players.length}. Must be 2-9.`);
  }

  if (!SUPPORTED_VARIANTS.includes(config.variant))
    throw new Error("This variant is not available yet");
  if (
    config.bootAmount <= 0n ||
    players.some((p) => p.chips <= config.bootAmount)
  )
    throw new Error("Buy-in must exceed the boot");
  if (new Set(players.map((p) => p.userId)).size !== players.length)
    throw new Error("Duplicate player");
  const deck = shuffleDeck(createDeck());
  const { hands, remaining } = dealToPlayers(deck, players.length, 3);
  const sessionId = crypto.randomUUID();
  const dealerIndex = crypto.randomInt(0, players.length);

  const gamePlayers: PlayerState[] = players.map((p, index) => ({
    id: crypto.randomUUID(),
    odic: p.userId,
    username: p.username,
    seatPosition: index,
    chips: p.chips,
    chipsInPlay: p.chips - config.bootAmount,
    currentBet: config.bootAmount,
    cards: hands[index],
    status: "playing" as PlayerStatus,
    isBlind: true,
    isDealer: index === dealerIndex,
    isTurn: false,
    isBot: p.isBot ?? false,
    botPersonality: p.botPersonality,
  }));

  // First player after dealer
  const firstPlayerIndex = (dealerIndex + 1) % players.length;
  gamePlayers[firstPlayerIndex].isTurn = true;

  const now = Date.now();

  return {
    sessionId,
    version: 0,
    roomId: config.roomId,
    variant: config.variant,
    players: gamePlayers,
    dealerIndex,
    currentPlayerIndex: firstPlayerIndex,
    pot: config.bootAmount * BigInt(players.length),
    currentBet: config.bootAmount,
    bootAmount: config.bootAmount,
    minBet: config.minBet,
    chalLimit: config.chalLimit ?? 50,
    roundNumber: 1,
    deck: remaining,
    status: "playing",
    winners: [],
    showdownPlayers: [],
    turnStartedAt: now,
    turnTimeoutMs: config.turnTimeoutMs ?? 30000,
    startedAt: now,
    actions: [],
  };
}

// ─── Helper Functions ──────────────────────────────────────────────────────

export function getActivePlayers(state: GameState): PlayerState[] {
  return state.players.filter(
    (p) => p.status === "playing" || p.status === "show",
  );
}

export function getCurrentPlayer(state: GameState): PlayerState | null {
  const player = state.players[state.currentPlayerIndex];
  if (!player || player.status !== "playing") return null;
  return player;
}

function calculateBetAmount(
  state: GameState,
  player: PlayerState,
  isRaise = false,
): bigint {
  const base = player.isBlind ? state.currentBet : state.currentBet * 2n;
  return isRaise ? base * 2n : base;
}

export function getAvailableActions(
  state: GameState,
  viewerId?: string,
): ActionType[] {
  if (state.status !== "playing") return [];
  if (state.sideshowPending)
    return viewerId === state.sideshowPending.targetId
      ? ["sideshow_accept", "sideshow_reject"]
      : [];
  const player = getCurrentPlayer(state);
  if (!player || (viewerId && player.id !== viewerId)) return [];
  const actions: ActionType[] = ["pack"];
  const base = calculateBetAmount(state, player);
  if (player.chipsInPlay >= base)
    actions.push(player.isBlind ? "blind" : "chaal");
  if (player.chipsInPlay >= base * 2n) actions.push("raise");
  const active = getActivePlayers(state);
  if (!player.isBlind && player.chipsInPlay >= base) {
    if (active.length === 2) actions.push("show");
    else if (
      active.length > 2 &&
      findPreviousActivePlayer(state)?.isBlind === false
    )
      actions.push("sideshow");
  }
  return actions;
}

function findPreviousActivePlayer(state: GameState): PlayerState | null {
  const { players, currentPlayerIndex } = state;
  let idx = (currentPlayerIndex - 1 + players.length) % players.length;
  let attempts = 0;
  while (attempts < players.length) {
    if (players[idx].status === "playing") return players[idx];
    idx = (idx - 1 + players.length) % players.length;
    attempts++;
  }
  return null;
}

function moveToNextPlayer(state: GameState): GameState {
  const newPlayers = state.players.map((p) => ({ ...p, isTurn: false }));
  let nextIndex = (state.currentPlayerIndex + 1) % state.players.length;
  let attempts = 0;

  while (attempts < state.players.length) {
    if (newPlayers[nextIndex].status === "playing") {
      newPlayers[nextIndex].isTurn = true;
      return {
        ...state,
        players: newPlayers,
        currentPlayerIndex: nextIndex,
        roundNumber:
          state.roundNumber + (nextIndex <= state.currentPlayerIndex ? 1 : 0),
        turnStartedAt: Date.now(),
      };
    }
    nextIndex = (nextIndex + 1) % state.players.length;
    attempts++;
  }

  return { ...state, players: newPlayers };
}

function resolveShowdown(state: GameState): GameState {
  const showdownPlayers = state.players.filter(
    (p) => state.showdownPlayers.includes(p.id) || p.status === "playing",
  );

  const hands = showdownPlayers.map((p) => {
    const hand = evaluateHand(p.cards, state.variant);
    return { playerId: p.id, hand };
  });

  const winnerIds = findWinners(hands);
  const potPerWinner = state.pot / BigInt(winnerIds.length);
  const remainder = state.pot % BigInt(winnerIds.length);

  // Update winner chips
  const newPlayers = state.players.map((p) => {
    if (winnerIds.includes(p.id)) {
      const winAmount =
        p.id === winnerIds[0] ? potPerWinner + remainder : potPerWinner;
      return {
        ...p,
        chipsInPlay: p.chipsInPlay + winAmount,
        handResult: evaluateHand(p.cards, state.variant),
      };
    }
    return {
      ...p,
      handResult:
        p.status !== "folded"
          ? evaluateHand(p.cards, state.variant)
          : undefined,
    };
  });

  return {
    ...state,
    players: newPlayers,
    winners: winnerIds,
    status: "finished",
    endedAt: Date.now(),
  };
}

// ─── Action Processing (Server-Authoritative) ─────────────────────────────

export function processAction(
  state: GameState,
  playerId: string,
  action: ActionType,
  amount?: bigint,
): GameState {
  if (state.status !== "playing")
    throw new Error("Game is not in playing state");
  const index = state.players.findIndex((p) => p.id === playerId);
  if (index < 0 || state.players[index].status !== "playing")
    throw new Error("Player cannot act");
  const player = state.players[index];
  if (action === "see_cards") {
    if (state.sideshowPending)
      throw new Error("Wait for the sideshow response");
    if (!player.isBlind) return state;
    const next = deepCloneState(state);
    next.version++;
    next.players[index].isBlind = false;
    next.actions.push({
      playerId,
      action,
      roundNumber: state.roundNumber,
      timestamp: Date.now(),
    });
    return next;
  }
  if (!getAvailableActions(state, playerId).includes(action))
    throw new Error("Action is not available");
  if (action === "sideshow_accept" || action === "sideshow_reject")
    return processSideshowResponse(state, playerId, action);
  let next = deepCloneState(state);
  next.version++;
  const actor = next.players[index];
  const entry: GameAction = {
    playerId,
    action,
    roundNumber: state.roundNumber,
    timestamp: Date.now(),
  };
  if (action === "pack") {
    actor.status = "folded";
    actor.isTurn = false;
  } else {
    const cost = calculateBetAmount(state, player, action === "raise");
    if (amount !== undefined && amount !== cost)
      throw new Error(`This action costs ${cost} chips`);
    if (cost <= 0n || cost > actor.chipsInPlay)
      throw new Error("Not enough chips");
    actor.currentBet += cost;
    actor.chipsInPlay -= cost;
    next.pot += cost;
    entry.amount = cost;
    if (action === "raise") next.currentBet = state.currentBet * 2n;
    if (action === "show") {
      next.showdownPlayers = getActivePlayers(next).map((p) => p.id);
      next = resolveShowdown(next);
    }
    if (action === "sideshow") {
      next.sideshowPending = {
        requesterId: playerId,
        targetId: findPreviousActivePlayer(next)!.id,
      };
      next.turnStartedAt = Date.now();
      next.actions.push(entry);
      return next;
    }
  }
  next.actions.push(entry);
  return finishOrAdvance(next);
}

function finishOrAdvance(state: GameState): GameState {
  if (state.status === "finished") return state;
  const active = getActivePlayers(state);
  if (active.length === 1) {
    active[0].chipsInPlay += state.pot;
    state.winners = [active[0].id];
    state.status = "finished";
    state.endedAt = Date.now();
    state.players.forEach((p) => {
      p.isTurn = false;
    });
    return state;
  }
  const next = moveToNextPlayer(state);
  if (next.chalLimit > 0 && next.roundNumber > next.chalLimit) {
    next.showdownPlayers = getActivePlayers(next).map((p) => p.id);
    return resolveShowdown(next);
  }
  return next;
}

/** Internal command only. The transport must never expose it as a player action. */
export function processTimeout(state: GameState): GameState {
  if (state.sideshowPending)
    return processSideshowResponse(
      state,
      state.sideshowPending.targetId,
      "sideshow_reject",
    );
  const player = getCurrentPlayer(state);
  if (!player) throw new Error("No current player");
  const next = processAction(state, player.id, "pack");
  next.actions[next.actions.length - 1].action = "timeout";
  return next;
}

/** A leaving player forfeits only their committed chips; other turns retain their deadline. */
export function removeFromHand(state: GameState, playerId: string): GameState {
  if (state.status !== "playing") return state;
  let next = deepCloneState(state);
  const player = next.players.find((p) => p.id === playerId);
  if (!player || player.status !== "playing") return state;
  if (
    next.sideshowPending &&
    [next.sideshowPending.targetId, next.sideshowPending.requesterId].includes(
      playerId,
    )
  ) {
    next = processSideshowResponse(
      next,
      next.sideshowPending.targetId,
      "sideshow_reject",
    );
  }
  const actor = next.players.find((p) => p.id === playerId)!;
  const wasTurn = actor.isTurn;
  actor.status = "folded";
  actor.isTurn = false;
  next.version++;
  next.actions.push({
    playerId,
    action: "pack",
    roundNumber: next.roundNumber,
    timestamp: Date.now(),
    metadata: { left: true },
  });
  if (wasTurn || getActivePlayers(next).length === 1)
    return finishOrAdvance(next);
  return next;
}

function processSideshowResponse(
  state: GameState,
  playerId: string,
  action: "sideshow_accept" | "sideshow_reject",
): GameState {
  if (state.status !== "playing") throw new Error("Game is finished");
  if (!state.sideshowPending) throw new Error("No pending sideshow");
  if (state.sideshowPending.targetId !== playerId)
    throw new Error("Not the sideshow target");

  let newState = deepCloneState(state);
  newState.version++;
  const { requesterId, targetId } = newState.sideshowPending!;

  const requesterIndex = newState.players.findIndex(
    (p) => p.id === requesterId,
  );
  const targetIndex = newState.players.findIndex((p) => p.id === targetId);

  const gameAction: GameAction = {
    playerId,
    action,
    roundNumber: state.roundNumber,
    timestamp: Date.now(),
  };

  if (action === "sideshow_reject") {
    // Sideshow rejected — continue game, requester already paid
    newState.sideshowPending = undefined;
    newState.actions.push(gameAction);
    newState = finishOrAdvance(newState);
    return newState;
  }

  // Sideshow accepted — compare hands privately
  const requester = newState.players[requesterIndex];
  const target = newState.players[targetIndex];

  const reqHand = evaluateHand(requester.cards, state.variant);
  const tgtHand = evaluateHand(target.cards, state.variant);
  const cmp = compareHands(reqHand, tgtHand);

  if (cmp <= 0) {
    // Requester loses or ties (tie = requester loses in sideshow)
    newState.players[requesterIndex].status = "folded";
  } else {
    // Target loses
    newState.players[targetIndex].status = "folded";
  }

  gameAction.metadata = {
    loser: cmp <= 0 ? requesterId : targetId,
  };

  newState.sideshowPending = undefined;
  newState.actions.push(gameAction);

  // Check if only one player remains
  const active = getActivePlayers(newState);
  if (active.length === 1) {
    const winner = active[0];
    const winnerIdx = newState.players.findIndex((p) => p.id === winner.id);
    newState.players[winnerIdx].chipsInPlay += newState.pot;
    newState.winners = [winner.id];
    newState.status = "finished";
    newState.endedAt = Date.now();
  } else {
    newState = finishOrAdvance(newState);
  }

  return newState;
}

// ─── Utility ───────────────────────────────────────────────────────────────

function deepCloneState(state: GameState): GameState {
  return {
    ...state,
    players: state.players.map((p) => ({ ...p, cards: [...p.cards] })),
    deck: [...state.deck],
    winners: [...state.winners],
    showdownPlayers: [...state.showdownPlayers],
    actions: [...state.actions],
    sideshowPending: state.sideshowPending
      ? { ...state.sideshowPending }
      : undefined,
  };
}

function bigintMax(a: bigint, b: bigint): bigint {
  return a > b ? a : b;
}

/** Get sanitized state for a specific player (hide other players' cards) */
export function getPlayerView(state: GameState, playerId: string): GameView {
  return {
    viewerPlayerId: playerId,
    sessionId: state.sessionId,
    version: state.version,
    serverTime: Date.now(),
    canSeeCards:
      state.status === "playing" &&
      !state.sideshowPending &&
      state.players.some(
        (p) => p.id === playerId && p.isBlind && p.status === "playing",
      ),
    roomId: state.roomId,
    variant: state.variant,
    status: state.status,
    payouts:
      state.status === "finished"
        ? Object.fromEntries(
            state.players
              .filter((p) => state.winners.includes(p.id))
              .map((p) => [
                p.id,
                (p.chipsInPlay - p.chips + p.currentBet).toString(),
              ]),
          )
        : {},
    pot: state.pot.toString(),
    currentBet: state.currentBet.toString(),
    bootAmount: state.bootAmount.toString(),
    roundNumber: state.roundNumber,
    winners: state.winners,
    dealerIndex: state.dealerIndex,
    currentPlayerIndex: state.currentPlayerIndex,
    sideshowPending: state.sideshowPending,
    turnStartedAt: state.turnStartedAt,
    turnTimeoutMs: state.turnTimeoutMs,
    players: state.players.map((p) => ({
      id: p.id,
      odic: p.odic,
      username: p.username,
      seatPosition: p.seatPosition,
      chipsInPlay: p.chipsInPlay.toString(),
      currentBet: p.currentBet.toString(),
      status: p.status,
      isBlind: p.isBlind,
      isDealer: p.isDealer,
      isTurn: p.isTurn,
      isBot: p.isBot,
      // Only show cards to the player themselves, or during showdown/finished
      cards:
        (p.id === playerId && !p.isBlind) ||
        ((state.status === "finished" || state.status === "showdown") &&
          state.showdownPlayers.includes(p.id))
          ? p.cards
          : undefined,
      handResult:
        state.status === "finished" || state.status === "showdown"
          ? p.handResult
          : p.id === playerId && !p.isBlind
            ? evaluateHand(p.cards, state.variant)
            : undefined,
    })),
    availableActions: getAvailableActions(state, playerId) as PlayerAction[],
    lastAction: state.actions.length
      ? {
          ...state.actions[state.actions.length - 1],
          amount: state.actions[state.actions.length - 1].amount?.toString(),
        }
      : null,
  };
}

export function formatChips(chips: bigint): string {
  const n = Number(chips);
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}
