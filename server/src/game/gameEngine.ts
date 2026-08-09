import { Card, createDeck, shuffleDeck, dealToPlayers } from './deck.js';
import { evaluateHand, compareHands, findWinners, HandResult, GameVariant } from './handRanking.js';
import crypto from 'node:crypto';

// ─── Types ─────────────────────────────────────────────────────────────────

export type PlayerStatus = 'waiting' | 'playing' | 'folded' | 'all_in' | 'show' | 'disconnected';
export type ActionType = 'boot' | 'blind' | 'chaal' | 'raise' | 'pack' | 'show' | 'sideshow' | 'sideshow_accept' | 'sideshow_reject' | 'timeout';

export interface PlayerState {
  id: string;        // Player session ID
  odic: string;      // User ID
  username: string;
  seatPosition: number;
  chips: bigint;      // Total chips brought to table
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
  chalLimit: number;  // Max chaal rounds (0 = unlimited)
  roundNumber: number;

  // Cards
  deck: Card[];

  // State
  status: 'dealing' | 'playing' | 'showdown' | 'finished';
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
  }>
): GameState {
  if (players.length < 2 || players.length > 9) {
    throw new Error(`Invalid player count: ${players.length}. Must be 2-9.`);
  }

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
    status: 'playing' as PlayerStatus,
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
    roomId: config.roomId,
    variant: config.variant,
    players: gamePlayers,
    dealerIndex,
    currentPlayerIndex: firstPlayerIndex,
    pot: config.bootAmount * BigInt(players.length),
    currentBet: config.bootAmount,
    bootAmount: config.bootAmount,
    minBet: config.minBet,
    chalLimit: config.chalLimit ?? 0,
    roundNumber: 1,
    deck: remaining,
    status: 'playing',
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
  return state.players.filter(p => p.status === 'playing' || p.status === 'show');
}

export function getCurrentPlayer(state: GameState): PlayerState | null {
  const player = state.players[state.currentPlayerIndex];
  if (!player || player.status !== 'playing') return null;
  return player;
}

function calculateBetAmount(state: GameState, player: PlayerState, isRaise = false): bigint {
  const base = player.isBlind ? state.currentBet : state.currentBet * 2n;
  return isRaise ? base * 2n : base;
}

export function getAvailableActions(state: GameState): ActionType[] {
  const player = getCurrentPlayer(state);
  if (!player || state.status !== 'playing') return [];

  const actions: ActionType[] = ['pack'];
  const activePlayers = getActivePlayers(state);

  if (player.isBlind) {
    actions.push('blind');
  }
  actions.push('chaal');

  // Raise
  const raiseAmount = calculateBetAmount(state, player, true);
  if (player.chipsInPlay >= raiseAmount) {
    actions.push('raise');
  }

  // Show — only with 2 players, and current player must be seen
  if (activePlayers.length === 2 && !player.isBlind) {
    actions.push('show');
  }

  // Sideshow — more than 2 players, both current and previous must be seen
  if (activePlayers.length > 2 && !player.isBlind) {
    const prevActive = findPreviousActivePlayer(state);
    if (prevActive && !prevActive.isBlind) {
      actions.push('sideshow');
    }
  }

  return actions;
}

function findPreviousActivePlayer(state: GameState): PlayerState | null {
  const { players, currentPlayerIndex } = state;
  let idx = (currentPlayerIndex - 1 + players.length) % players.length;
  let attempts = 0;
  while (attempts < players.length) {
    if (players[idx].status === 'playing') return players[idx];
    idx = (idx - 1 + players.length) % players.length;
    attempts++;
  }
  return null;
}

function moveToNextPlayer(state: GameState): GameState {
  const newPlayers = state.players.map(p => ({ ...p, isTurn: false }));
  let nextIndex = (state.currentPlayerIndex + 1) % state.players.length;
  let attempts = 0;

  while (attempts < state.players.length) {
    if (newPlayers[nextIndex].status === 'playing') {
      newPlayers[nextIndex].isTurn = true;
      return {
        ...state,
        players: newPlayers,
        currentPlayerIndex: nextIndex,
        turnStartedAt: Date.now(),
      };
    }
    nextIndex = (nextIndex + 1) % state.players.length;
    attempts++;
  }

  return { ...state, players: newPlayers };
}

function resolveShowdown(state: GameState): GameState {
  const showdownPlayers = state.players.filter(p =>
    state.showdownPlayers.includes(p.id) || p.status === 'playing'
  );

  const hands = showdownPlayers.map(p => {
    const hand = evaluateHand(p.cards, state.variant);
    return { playerId: p.id, hand };
  });

  const winnerIds = findWinners(hands);
  const potPerWinner = state.pot / BigInt(winnerIds.length);
  const remainder = state.pot % BigInt(winnerIds.length);

  // Update winner chips
  const newPlayers = state.players.map(p => {
    if (winnerIds.includes(p.id)) {
      const winAmount = p.id === winnerIds[0] ? potPerWinner + remainder : potPerWinner;
      return {
        ...p,
        chipsInPlay: p.chipsInPlay + winAmount,
        handResult: evaluateHand(p.cards, state.variant),
      };
    }
    return {
      ...p,
      handResult: p.status !== 'folded' ? evaluateHand(p.cards, state.variant) : undefined,
    };
  });

  return {
    ...state,
    players: newPlayers,
    winners: winnerIds,
    status: 'finished',
    endedAt: Date.now(),
  };
}

// ─── Action Processing (Server-Authoritative) ─────────────────────────────

export function processAction(
  state: GameState,
  playerId: string,
  action: ActionType,
  amount?: bigint
): GameState {
  // Validate it's this player's turn
  const playerIndex = state.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) throw new Error('Player not found in this game');

  const player = state.players[playerIndex];

  // Handle sideshow responses from target player (not their turn)
  if (action === 'sideshow_accept' || action === 'sideshow_reject') {
    return processSideshowResponse(state, playerId, action);
  }

  if (!player.isTurn) throw new Error('Not your turn');
  if (player.status !== 'playing') throw new Error('Player cannot act');
  if (state.status !== 'playing') throw new Error('Game is not in playing state');

  // Validate action is available
  const available = getAvailableActions(state);
  if (!available.includes(action)) {
    throw new Error(`Action '${action}' is not available. Available: ${available.join(', ')}`);
  }

  let newState = deepCloneState(state);
  const newPlayer = newState.players[playerIndex];

  const gameAction: GameAction = {
    playerId,
    action,
    amount,
    roundNumber: state.roundNumber,
    timestamp: Date.now(),
  };

  switch (action) {
    case 'blind': {
      const betAmount = amount ?? calculateBetAmount(state, player);
      if (betAmount > newPlayer.chipsInPlay) throw new Error('Not enough chips');
      newPlayer.currentBet += betAmount;
      newPlayer.chipsInPlay -= betAmount;
      newPlayer.isBlind = true;
      newState.pot += betAmount;
      newState.currentBet = bigintMax(newState.currentBet, betAmount);
      gameAction.amount = betAmount;
      break;
    }

    case 'chaal': {
      const betAmount = amount ?? calculateBetAmount(state, player);
      if (betAmount > newPlayer.chipsInPlay) throw new Error('Not enough chips');
      newPlayer.currentBet += betAmount;
      newPlayer.chipsInPlay -= betAmount;
      newPlayer.isBlind = false;
      newState.pot += betAmount;
      newState.currentBet = bigintMax(newState.currentBet, betAmount / 2n);
      gameAction.amount = betAmount;
      break;
    }

    case 'raise': {
      const betAmount = amount ?? calculateBetAmount(state, player, true);
      if (betAmount > newPlayer.chipsInPlay) throw new Error('Not enough chips');
      newPlayer.currentBet += betAmount;
      newPlayer.chipsInPlay -= betAmount;
      newPlayer.isBlind = false;
      newState.pot += betAmount;
      newState.currentBet = betAmount / 2n;
      gameAction.amount = betAmount;
      break;
    }

    case 'pack': {
      newPlayer.status = 'folded';
      newPlayer.isTurn = false;
      break;
    }

    case 'show': {
      const activePlayers = getActivePlayers(newState);
      if (activePlayers.length !== 2) throw new Error('Show requires exactly 2 active players');

      // Pay show cost (same as chaal)
      const showCost = calculateBetAmount(state, player);
      if (showCost > newPlayer.chipsInPlay) throw new Error('Not enough chips for show');
      newPlayer.currentBet += showCost;
      newPlayer.chipsInPlay -= showCost;
      newPlayer.isBlind = false;
      newState.pot += showCost;
      gameAction.amount = showCost;

      newPlayer.status = 'show';
      newState.showdownPlayers = activePlayers.map(p => p.id);
      newState.status = 'showdown';
      newState = resolveShowdown(newState);
      break;
    }

    case 'sideshow': {
      const prevPlayer = findPreviousActivePlayer(newState);
      if (!prevPlayer) throw new Error('No previous active player for sideshow');
      if (player.isBlind || prevPlayer.isBlind) throw new Error('Both must be seen for sideshow');

      // Pay sideshow cost
      const sideshowCost = calculateBetAmount(state, player);
      if (sideshowCost > newPlayer.chipsInPlay) throw new Error('Not enough chips');
      newPlayer.currentBet += sideshowCost;
      newPlayer.chipsInPlay -= sideshowCost;
      newState.pot += sideshowCost;
      gameAction.amount = sideshowCost;

      // Set pending sideshow — target player must accept/reject
      newState.sideshowPending = {
        requesterId: playerId,
        targetId: prevPlayer.id,
      };

      newState.actions.push(gameAction);
      return newState; // Don't move to next player yet
    }

    case 'timeout': {
      // Auto-fold on timeout
      newPlayer.status = 'folded';
      newPlayer.isTurn = false;
      break;
    }
  }

  newState.actions.push(gameAction);

  // Check for winner by last standing
  const activePlayers = getActivePlayers(newState);
  if (activePlayers.length === 1 && newState.status !== 'finished') {
    // Last player standing wins
    const winner = activePlayers[0];
    const winnerIndex = newState.players.findIndex(p => p.id === winner.id);
    newState.players[winnerIndex].chipsInPlay += newState.pot;
    newState.winners = [winner.id];
    newState.status = 'finished';
    newState.endedAt = Date.now();
  } else if (newState.status !== 'finished') {
    // Increment round if we've gone around the table
    newState = moveToNextPlayer(newState);

    // Check chal limit
    if (newState.chalLimit > 0 && newState.roundNumber >= newState.chalLimit) {
      // Force showdown
      newState.status = 'showdown';
      newState.showdownPlayers = getActivePlayers(newState).map(p => p.id);
      newState = resolveShowdown(newState);
    }
  }

  return newState;
}

function processSideshowResponse(state: GameState, playerId: string, action: 'sideshow_accept' | 'sideshow_reject'): GameState {
  if (!state.sideshowPending) throw new Error('No pending sideshow');
  if (state.sideshowPending.targetId !== playerId) throw new Error('Not the sideshow target');

  let newState = deepCloneState(state);
  const { requesterId, targetId } = newState.sideshowPending!;

  const requesterIndex = newState.players.findIndex(p => p.id === requesterId);
  const targetIndex = newState.players.findIndex(p => p.id === targetId);

  const gameAction: GameAction = {
    playerId,
    action,
    roundNumber: state.roundNumber,
    timestamp: Date.now(),
  };

  if (action === 'sideshow_reject') {
    // Sideshow rejected — continue game, requester already paid
    newState.sideshowPending = undefined;
    newState.actions.push(gameAction);
    newState = moveToNextPlayer(newState);
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
    newState.players[requesterIndex].status = 'folded';
  } else {
    // Target loses
    newState.players[targetIndex].status = 'folded';
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
    const winnerIdx = newState.players.findIndex(p => p.id === winner.id);
    newState.players[winnerIdx].chipsInPlay += newState.pot;
    newState.winners = [winner.id];
    newState.status = 'finished';
    newState.endedAt = Date.now();
  } else {
    newState = moveToNextPlayer(newState);
  }

  return newState;
}

// ─── Utility ───────────────────────────────────────────────────────────────

function deepCloneState(state: GameState): GameState {
  return {
    ...state,
    players: state.players.map(p => ({ ...p, cards: [...p.cards] })),
    deck: [...state.deck],
    winners: [...state.winners],
    showdownPlayers: [...state.showdownPlayers],
    actions: [...state.actions],
    sideshowPending: state.sideshowPending ? { ...state.sideshowPending } : undefined,
  };
}

function bigintMax(a: bigint, b: bigint): bigint {
  return a > b ? a : b;
}

/** Get sanitized state for a specific player (hide other players' cards) */
export function getPlayerView(state: GameState, playerId: string): Record<string, unknown> {
  return {
    viewerPlayerId: playerId,
    sessionId: state.sessionId,
    roomId: state.roomId,
    variant: state.variant,
    status: state.status,
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
    players: state.players.map(p => ({
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
      cards: (p.id === playerId || state.status === 'finished' || state.status === 'showdown')
        ? p.cards
        : undefined,
      handResult: (state.status === 'finished' || state.status === 'showdown')
        ? p.handResult
        : (p.id === playerId ? evaluateHand(p.cards, state.variant) : undefined),
    })),
    availableActions: getCurrentPlayer(state)?.id === playerId
      ? getAvailableActions(state)
      : [],
  };
}

export function formatChips(chips: bigint): string {
  const n = Number(chips);
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}
