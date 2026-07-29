import { create } from 'zustand';
import { initializeGame, processAction, getAvailableActions, type GameState } from '@teen-patti/shared';
import type { GameRoom, ActionType, Card, GameVariant } from '@teen-patti/shared';
import { gameSocket } from '../services/socket';

interface GameStoreState {
  gameState: GameState | null;
  currentRoom: GameRoom | null;
  myCards: Card[];
  isMyTurn: boolean;
  availableActions: ActionType[];
  showCards: boolean;
  gameMessage: string | null;
  isOnlineMode: boolean;

  // Actions
  startQuickPlay: (userId: string, variant?: GameVariant) => void;
  performAction: (action: ActionType, amount?: number) => void;
  toggleShowCards: () => void;
  leaveGame: () => void;
  setGameMessage: (msg: string | null) => void;
  updateFromServer: (state: any) => void;
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  gameState: null,
  currentRoom: null,
  myCards: [],
  isMyTurn: false,
  availableActions: [],
  showCards: false,
  gameMessage: null,
  isOnlineMode: false,

  startQuickPlay: (userId, variant = 'classic') => {
    const players = [
      { id: 'p1', name: 'You', isAI: false, userId },
      { id: 'p2', name: 'Sharma Ji', isAI: true, userId: 'ai-sharma' },
      { id: 'p3', name: 'Priya', isAI: true, userId: 'ai-priya' },
      { id: 'p4', name: 'Bunty', isAI: true, userId: 'ai-bunty' },
    ];

    const state = initializeGame('quick-play', players as any, 10, variant);
    const myPlayer = state.session.players[0];
    const actions = getAvailableActions(state);

    set({
      gameState: state,
      myCards: myPlayer?.cards || [],
      isMyTurn: myPlayer?.isTurn || false,
      availableActions: myPlayer?.isTurn ? actions : [],
      showCards: false,
      gameMessage: 'Game started! Cards dealt.',
      isOnlineMode: false,
    });
  },

  performAction: (action, amount) => {
    const { gameState, isOnlineMode } = get();
    if (!gameState) return;

    if (isOnlineMode) {
      void gameSocket.action(action, amount).then(result => {
        if (!result.success) set({ gameMessage: result.error || 'Action failed' });
      }).catch(error => set({ gameMessage: error instanceof Error ? error.message : 'Connection error' }));
      return;
    }

    const newState = processAction(gameState, 'p1', action, amount);
    const myPlayer = newState.session.players[0];
    const actions = getAvailableActions(newState);

    set({
      gameState: newState,
      myCards: myPlayer?.cards || [],
      isMyTurn: myPlayer?.isTurn || false,
      availableActions: myPlayer?.isTurn ? actions : [],
    });
  },

  toggleShowCards: () => set((s) => ({ showCards: !s.showCards })),

  leaveGame: () => {
    if (get().isOnlineMode) gameSocket.leave();
    set({
      gameState: null,
      currentRoom: null,
      myCards: [],
      isMyTurn: false,
      availableActions: [],
      showCards: false,
      gameMessage: null,
      isOnlineMode: false,
    });
  },

  setGameMessage: (msg) => set({ gameMessage: msg }),

  updateFromServer: (serverState) => {
    const players = serverState.players.map((player: any) => ({
      id: player.id,
      sessionId: serverState.sessionId,
      userId: player.odic,
      user: { id: player.odic, username: player.username },
      seatPosition: player.seatPosition,
      chipsInPlay: Number(player.chipsInPlay),
      currentBet: Number(player.currentBet),
      cards: player.cards,
      handRank: player.handResult?.rank,
      status: player.status,
      isBlind: player.isBlind,
      isDealer: player.isDealer,
      isTurn: player.isTurn,
    }));
    const me = players.find((player: any) => Array.isArray(player.cards) && player.cards.length > 0);
    set({
      gameState: {
        session: {
          id: serverState.sessionId,
          roomId: serverState.roomId,
          variant: String(serverState.variant).toLowerCase(),
          dealerPosition: serverState.dealerIndex,
          currentTurn: serverState.currentPlayerIndex,
          pot: Number(serverState.pot),
          currentBet: Number(serverState.currentBet),
          bootAmount: Number(serverState.bootAmount),
          status: serverState.status === 'finished' ? 'finished' : 'playing',
          roundNumber: serverState.roundNumber,
          round: serverState.roundNumber,
          players,
          startedAt: new Date(),
        },
        deck: [],
        currentPlayerIndex: serverState.currentPlayerIndex,
        showdownPlayers: [],
        winners: serverState.winners || [],
        isGameOver: serverState.status === 'finished',
      } as GameState,
      myCards: me?.cards || [],
      isMyTurn: (serverState.availableActions?.length || 0) > 0,
      availableActions: serverState.availableActions || [],
      isOnlineMode: true,
      gameMessage: serverState.status === 'finished' ? 'Game over' : null,
    });
  },
}));
