import { Card, GamePlayer, GameSession, ActionType, GameVariant, PlayerStatus } from '../types';
import { createDeck, shuffleDeck, dealToPlayers } from './deck';
import { evaluateHand, compareHands, findWinners } from './handRanking';

export interface GameState {
  session: GameSession;
  deck: Card[];
  currentPlayerIndex: number;
  lastAction?: { playerId: string; action: ActionType; amount?: number };
  showdownPlayers: string[];
  winners: string[];
  isGameOver: boolean;
}

// Initialize a new game
export function initializeGame(
  roomId: string,
  players: { userId: string; username: string; chips: number }[],
  bootAmount: number,
  variant: GameVariant = 'classic'
): GameState {
  const deck = shuffleDeck(createDeck());
  const { hands, remaining } = dealToPlayers(deck, players.length, 3);

  const sessionId = crypto.randomUUID();
  const dealerIndex = Math.floor(Math.random() * players.length);

  const gamePlayers: GamePlayer[] = players.map((player, index) => ({
    id: crypto.randomUUID(),
    sessionId,
    userId: player.userId,
    seatPosition: index,
    chipsInPlay: player.chips,
    currentBet: bootAmount,
    cards: hands[index],
    status: 'playing' as PlayerStatus,
    isBlind: true,
    isDealer: index === dealerIndex,
    isTurn: false
  }));

  // First player after dealer starts
  const firstPlayerIndex = (dealerIndex + 1) % players.length;
  gamePlayers[firstPlayerIndex].isTurn = true;

  const session: GameSession = {
    id: sessionId,
    roomId,
    dealerPosition: dealerIndex,
    currentTurn: firstPlayerIndex,
    pot: bootAmount * players.length,
    currentBet: bootAmount,
    bootAmount,
    status: 'playing',
    roundNumber: 1,
    players: gamePlayers,
    startedAt: new Date()
  };

  return {
    session,
    deck: remaining,
    currentPlayerIndex: firstPlayerIndex,
    showdownPlayers: [],
    winners: [],
    isGameOver: false
  };
}

// Get the current player
export function getCurrentPlayer(state: GameState): GamePlayer | null {
  const activePlayers = state.session.players.filter(p => p.status === 'playing');
  if (activePlayers.length === 0) return null;
  return state.session.players[state.currentPlayerIndex];
}

// Get active players (not folded)
export function getActivePlayers(state: GameState): GamePlayer[] {
  return state.session.players.filter(p => p.status === 'playing' || p.status === 'show');
}

// Calculate bet amount for blind/seen player
export function calculateBetAmount(state: GameState, player: GamePlayer, isRaise: boolean = false): number {
  const currentBet = state.session.currentBet;
  const baseAmount = player.isBlind ? currentBet : currentBet * 2;
  return isRaise ? baseAmount * 2 : baseAmount;
}

// Process a player action
export function processAction(
  state: GameState,
  playerId: string,
  action: ActionType,
  amount?: number
): GameState {
  const playerIndex = state.session.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) throw new Error('Player not found');

  const player = state.session.players[playerIndex];
  if (!player.isTurn) throw new Error('Not your turn');
  if (player.status !== 'playing') throw new Error('Player cannot act');

  let newState = { ...state };
  const newPlayers = [...state.session.players];
  const newPlayer = { ...player };

  switch (action) {
    case 'blind':
    case 'chaal': {
      const betAmount = amount || calculateBetAmount(state, player);
      if (betAmount > newPlayer.chipsInPlay) throw new Error('Not enough chips');

      newPlayer.currentBet += betAmount;
      newPlayer.chipsInPlay -= betAmount;
      newPlayer.isBlind = action === 'blind';
      newState.session = {
        ...state.session,
        pot: state.session.pot + betAmount,
        currentBet: Math.max(state.session.currentBet, betAmount / (newPlayer.isBlind ? 1 : 2))
      };
      break;
    }

    case 'raise': {
      const raiseAmount = amount || calculateBetAmount(state, player, true);
      if (raiseAmount > newPlayer.chipsInPlay) throw new Error('Not enough chips');

      newPlayer.currentBet += raiseAmount;
      newPlayer.chipsInPlay -= raiseAmount;
      newPlayer.isBlind = false;
      newState.session = {
        ...state.session,
        pot: state.session.pot + raiseAmount,
        currentBet: raiseAmount / 2
      };
      break;
    }

    case 'pack': {
      newPlayer.status = 'folded';
      newPlayer.isTurn = false;
      break;
    }

    case 'show': {
      // Can only show when 2 players remain
      const activePlayers = getActivePlayers(state);
      if (activePlayers.length !== 2) throw new Error('Can only show with 2 players');

      newPlayer.status = 'show';
      newState.showdownPlayers = [...state.showdownPlayers, playerId];

      // Check if both remaining players have shown
      if (newState.showdownPlayers.length === 2) {
        newState = resolveShowdown(newState);
      }
      break;
    }

    case 'sideshow': {
      // Request sideshow with previous player
      const prevPlayerIndex = (playerIndex - 1 + state.session.players.length) % state.session.players.length;
      const prevPlayer = state.session.players[prevPlayerIndex];

      if (prevPlayer.status !== 'playing') throw new Error('Previous player not active');
      if (player.isBlind || prevPlayer.isBlind) throw new Error('Both players must be seen for sideshow');

      // For simplicity, auto-accept sideshow
      const playerHand = evaluateHand(player.cards!);
      const prevPlayerHand = evaluateHand(prevPlayer.cards!);
      const comparison = compareHands(playerHand, prevPlayerHand);

      if (comparison <= 0) {
        // Requesting player loses or ties (loses in tie)
        newPlayer.status = 'folded';
      } else {
        // Previous player loses
        newPlayers[prevPlayerIndex] = { ...prevPlayer, status: 'folded' };
      }
      break;
    }
  }

  newPlayers[playerIndex] = newPlayer;
  newState.session = { ...newState.session, players: newPlayers };
  newState.lastAction = { playerId, action, amount };

  // Check for winner by last standing
  const activePlayers = getActivePlayers(newState);
  if (activePlayers.length === 1 && !newState.isGameOver) {
    newState.winners = [activePlayers[0].id];
    newState.isGameOver = true;
    newState.session = { ...newState.session, status: 'finished' };
  } else if (!newState.isGameOver) {
    // Move to next player
    newState = moveToNextPlayer(newState);
  }

  return newState;
}

// Move to the next active player
function moveToNextPlayer(state: GameState): GameState {
  const players = state.session.players;
  const newPlayers = players.map(p => ({ ...p, isTurn: false }));

  let nextIndex = (state.currentPlayerIndex + 1) % players.length;
  let attempts = 0;

  while (attempts < players.length) {
    if (newPlayers[nextIndex].status === 'playing') {
      newPlayers[nextIndex].isTurn = true;
      return {
        ...state,
        session: { ...state.session, players: newPlayers, currentTurn: nextIndex },
        currentPlayerIndex: nextIndex
      };
    }
    nextIndex = (nextIndex + 1) % players.length;
    attempts++;
  }

  return state;
}

// Resolve showdown between remaining players
function resolveShowdown(state: GameState): GameState {
  const showdownPlayers = state.session.players.filter(p =>
    state.showdownPlayers.includes(p.id)
  );

  const hands = showdownPlayers.map(p => ({
    playerId: p.id,
    hand: evaluateHand(p.cards!)
  }));

  const winnerIds = findWinners(hands);

  return {
    ...state,
    winners: winnerIds,
    isGameOver: true,
    session: {
      ...state.session,
      status: 'finished',
      endedAt: new Date()
    }
  };
}

// Distribute pot to winners
export function distributePot(state: GameState): { playerId: string; amount: number }[] {
  if (state.winners.length === 0) return [];

  const potPerWinner = Math.floor(state.session.pot / state.winners.length);
  return state.winners.map(winnerId => ({
    playerId: winnerId,
    amount: potPerWinner
  }));
}

// Get available actions for current player
export function getAvailableActions(state: GameState): ActionType[] {
  const player = getCurrentPlayer(state);
  if (!player || player.status !== 'playing') return [];

  const actions: ActionType[] = ['pack'];
  const activePlayers = getActivePlayers(state);

  // Blind or Chaal
  if (player.isBlind) {
    actions.push('blind');
  }
  actions.push('chaal');

  // Raise is always available if you have chips
  const raiseAmount = calculateBetAmount(state, player, true);
  if (player.chipsInPlay >= raiseAmount) {
    actions.push('raise');
  }

  // Show only when 2 players remain
  if (activePlayers.length === 2 && !player.isBlind) {
    actions.push('show');
  }

  // Sideshow when more than 2 players and both seen
  if (activePlayers.length > 2 && !player.isBlind) {
    const prevPlayerIndex = (state.currentPlayerIndex - 1 + state.session.players.length) % state.session.players.length;
    const prevPlayer = state.session.players[prevPlayerIndex];
    if (prevPlayer.status === 'playing' && !prevPlayer.isBlind) {
      actions.push('sideshow');
    }
  }

  return actions;
}

// Format chips display
export function formatChips(chips: number): string {
  if (chips >= 10000000) return `${(chips / 10000000).toFixed(1)}Cr`;
  if (chips >= 100000) return `${(chips / 100000).toFixed(1)}L`;
  if (chips >= 1000) return `${(chips / 1000).toFixed(1)}K`;
  return chips.toString();
}
