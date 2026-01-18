import { create } from 'zustand';
import { Card, GameRoom, GameSession, GamePlayer, ActionType, ChatMessage, GameVariant } from '../types';
import { GameState, initializeGame, processAction, getAvailableActions, distributePot } from '../game/gameEngine';

interface GameStore {
  // Room state
  currentRoom: GameRoom | null;
  availableRooms: GameRoom[];

  // Game state
  gameState: GameState | null;
  myCards: Card[];
  isMyTurn: boolean;
  availableActions: ActionType[];
  showCards: boolean;

  // UI state
  selectedAction: ActionType | null;
  betAmount: number;
  isProcessing: boolean;
  gameMessage: string;

  // Chat
  chatMessages: ChatMessage[];
  isChatOpen: boolean;

  // Room actions
  setRooms: (rooms: GameRoom[]) => void;
  joinRoom: (room: GameRoom) => void;
  leaveRoom: () => void;
  createRoom: (room: Partial<GameRoom>) => void;

  // Game actions
  startGame: (players: { userId: string; username: string; chips: number }[], bootAmount: number, variant?: GameVariant) => void;
  performAction: (action: ActionType, amount?: number) => void;
  setSelectedAction: (action: ActionType | null) => void;
  setBetAmount: (amount: number) => void;
  toggleShowCards: () => void;
  resetGame: () => void;

  // Chat actions
  addChatMessage: (message: ChatMessage) => void;
  toggleChat: () => void;

  // Utility
  setGameMessage: (message: string) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  currentRoom: null,
  availableRooms: [],
  gameState: null,
  myCards: [],
  isMyTurn: false,
  availableActions: [],
  showCards: false,
  selectedAction: null,
  betAmount: 0,
  isProcessing: false,
  gameMessage: '',
  chatMessages: [],
  isChatOpen: false,

  // Room actions
  setRooms: (rooms) => set({ availableRooms: rooms }),

  joinRoom: (room) => set({ currentRoom: room }),

  leaveRoom: () => set({
    currentRoom: null,
    gameState: null,
    myCards: [],
    isMyTurn: false,
    availableActions: [],
    chatMessages: []
  }),

  createRoom: (roomData) => {
    const newRoom: GameRoom = {
      id: crypto.randomUUID(),
      name: roomData.name || 'New Table',
      variant: roomData.variant || 'classic',
      minBuyIn: roomData.minBuyIn || 100,
      maxBuyIn: roomData.maxBuyIn || 10000,
      minBet: roomData.minBet || 10,
      maxPlayers: roomData.maxPlayers || 6,
      currentPlayers: 0,
      status: 'waiting',
      isPrivate: roomData.isPrivate || false,
      roomCode: roomData.isPrivate ? Math.random().toString(36).substring(2, 8).toUpperCase() : undefined,
      createdBy: roomData.createdBy || ''
    };
    set((state) => ({
      availableRooms: [...state.availableRooms, newRoom],
      currentRoom: newRoom
    }));
  },

  // Game actions
  startGame: (players, bootAmount, variant = 'classic') => {
    const gameState = initializeGame(
      get().currentRoom?.id || crypto.randomUUID(),
      players,
      bootAmount,
      variant
    );

    // Find current user's cards (first player for demo)
    const myPlayer = gameState.session.players[0];
    const availableActions = getAvailableActions(gameState);

    set({
      gameState,
      myCards: myPlayer.cards || [],
      isMyTurn: myPlayer.isTurn,
      availableActions,
      betAmount: gameState.session.currentBet,
      gameMessage: 'Game started! Good luck!'
    });
  },

  performAction: (action, amount) => {
    const { gameState } = get();
    if (!gameState) return;

    set({ isProcessing: true });

    try {
      const currentPlayer = gameState.session.players.find(p => p.isTurn);
      if (!currentPlayer) throw new Error('No active player');

      const newState = processAction(gameState, currentPlayer.id, action, amount);
      const newActions = getAvailableActions(newState);

      // Check if game ended
      if (newState.isGameOver) {
        const winnings = distributePot(newState);
        const winnerNames = newState.winners
          .map(id => newState.session.players.find(p => p.id === id)?.userId)
          .join(', ');

        set({
          gameState: newState,
          isMyTurn: false,
          availableActions: [],
          gameMessage: `Game Over! Winner: ${winnerNames}`,
          isProcessing: false
        });
      } else {
        const nextPlayer = newState.session.players.find(p => p.isTurn);
        const isMyTurn = nextPlayer?.seatPosition === 0; // Demo: player 0 is user

        set({
          gameState: newState,
          isMyTurn,
          availableActions: isMyTurn ? newActions : [],
          betAmount: newState.session.currentBet,
          gameMessage: `${action.charAt(0).toUpperCase() + action.slice(1)}!`,
          isProcessing: false,
          selectedAction: null
        });
      }
    } catch (error) {
      set({
        gameMessage: error instanceof Error ? error.message : 'Invalid action',
        isProcessing: false
      });
    }
  },

  setSelectedAction: (action) => set({ selectedAction: action }),

  setBetAmount: (amount) => set({ betAmount: amount }),

  toggleShowCards: () => set((state) => ({ showCards: !state.showCards })),

  resetGame: () => set({
    gameState: null,
    myCards: [],
    isMyTurn: false,
    availableActions: [],
    showCards: false,
    selectedAction: null,
    betAmount: 0,
    gameMessage: ''
  }),

  // Chat actions
  addChatMessage: (message) => set((state) => ({
    chatMessages: [...state.chatMessages, message]
  })),

  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),

  // Utility
  setGameMessage: (message) => set({ gameMessage: message })
}));

// Selectors
export const selectCurrentPlayer = (state: GameStore) =>
  state.gameState?.session.players.find(p => p.isTurn);

export const selectActivePlayers = (state: GameStore) =>
  state.gameState?.session.players.filter(p => p.status === 'playing' || p.status === 'show') || [];

export const selectPot = (state: GameStore) =>
  state.gameState?.session.pot || 0;
