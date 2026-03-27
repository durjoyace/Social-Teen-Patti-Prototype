import { create } from 'zustand';
import { initializeGame, processAction, getAvailableActions, type GameState } from '@teen-patti/shared';
import type { GameRoom, ActionType, Card, GameVariant } from '@teen-patti/shared';
import { getSocket } from '../services/socket';

interface GameStoreState {
  gameState: GameState | null;
  currentRoom: GameRoom | null;
  myCards: Card[];
  isMyTurn: boolean;
  availableActions: ActionType[];
  showCards: boolean;
  gameMessage: string | null;

  // Actions
  startQuickPlay: (userId: string, variant?: GameVariant) => void;
  performAction: (action: ActionType, amount?: number) => void;
  toggleShowCards: () => void;
  leaveGame: () => void;
  setGameMessage: (msg: string | null) => void;
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  gameState: null,
  currentRoom: null,
  myCards: [],
  isMyTurn: false,
  availableActions: [],
  showCards: false,
  gameMessage: null,

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
    });
  },

  performAction: (action, amount) => {
    const { gameState } = get();
    if (!gameState) return;

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

  leaveGame: () =>
    set({
      gameState: null,
      currentRoom: null,
      myCards: [],
      isMyTurn: false,
      availableActions: [],
      showCards: false,
      gameMessage: null,
    }),

  setGameMessage: (msg) => set({ gameMessage: msg }),
}));
