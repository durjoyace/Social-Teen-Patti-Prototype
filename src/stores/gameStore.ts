import { create } from 'zustand';
import { Card, GameRoom, GameSession, GamePlayer, ActionType, ChatMessage, GameVariant } from '../types';
import { GameState, initializeGame, processAction, getAvailableActions, distributePot } from '../game/gameEngine';
import { socketService } from '../services/socket';

interface GameStore {
  // Connection mode
  isOnlineMode: boolean;

  // Room state
  currentRoom: GameRoom | null;
  availableRooms: GameRoom[];

  // Game state (unified for online/offline)
  gameState: GameState | null;
  serverGameState: any | null; // Raw server state
  myCards: Card[];
  myPlayerId: string | null;
  isMyTurn: boolean;
  availableActions: ActionType[];
  showCards: boolean;

  // UI state
  selectedAction: ActionType | null;
  betAmount: number;
  isProcessing: boolean;
  gameMessage: string;
  lastAction: { playerId: string; action: string; amount?: string } | null;

  // Chat
  chatMessages: ChatMessage[];
  isChatOpen: boolean;

  // Room actions
  setRooms: (rooms: GameRoom[]) => void;
  joinRoom: (room: GameRoom) => void;
  leaveRoom: () => void;
  createRoom: (room: Partial<GameRoom>) => void;

  // Game actions (offline mode)
  startGame: (players: { userId: string; username: string; chips: number }[], bootAmount: number, variant?: GameVariant) => void;
  performAction: (action: ActionType, amount?: number) => void;

  // Game actions (online mode)
  performOnlineAction: (action: ActionType, amount?: number) => Promise<void>;
  updateFromServer: (serverState: any) => void;

  // Quick play
  quickPlay: () => Promise<void>;

  // UI
  setSelectedAction: (action: ActionType | null) => void;
  setBetAmount: (amount: number) => void;
  toggleShowCards: () => void;
  resetGame: () => void;
  setGameMessage: (message: string) => void;

  // Chat
  addChatMessage: (message: ChatMessage) => void;
  toggleChat: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  isOnlineMode: false,
  currentRoom: null,
  availableRooms: [],
  gameState: null,
  serverGameState: null,
  myCards: [],
  myPlayerId: null,
  isMyTurn: false,
  availableActions: [],
  showCards: false,
  selectedAction: null,
  betAmount: 0,
  isProcessing: false,
  gameMessage: '',
  lastAction: null,
  chatMessages: [],
  isChatOpen: false,

  setRooms: (rooms) => set({ availableRooms: rooms }),

  joinRoom: (room) => set({ currentRoom: room }),

  leaveRoom: () => {
    if (get().isOnlineMode) {
      socketService.leaveRoom();
    }
    set({
      currentRoom: null,
      gameState: null,
      serverGameState: null,
      myCards: [],
      myPlayerId: null,
      isMyTurn: false,
      availableActions: [],
      chatMessages: [],
      isOnlineMode: false,
    });
  },

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
      createdBy: roomData.createdBy || '',
    };
    set((state) => ({
      availableRooms: [...state.availableRooms, newRoom],
      currentRoom: newRoom,
    }));
  },

  // ─── Offline Game (AI opponents) ─────────────────────────────────────

  startGame: (players, bootAmount, variant = 'classic') => {
    const gameState = initializeGame(
      get().currentRoom?.id || crypto.randomUUID(),
      players,
      bootAmount,
      variant
    );

    const myPlayer = gameState.session.players[0];
    const availableActions = getAvailableActions(gameState);

    set({
      gameState,
      myCards: myPlayer.cards || [],
      myPlayerId: myPlayer.id,
      isMyTurn: myPlayer.isTurn,
      availableActions,
      betAmount: gameState.session.currentBet,
      gameMessage: 'Game started! Good luck!',
      isOnlineMode: false,
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

      if (newState.isGameOver) {
        const winnings = distributePot(newState);
        const AI_DISPLAY_NAMES: Record<string, string> = {
          'ai-sharma': 'Sharma Ji', 'ai-priya': 'Priya', 'ai-bunty': 'Bunty',
          'ai-meera': 'Meera', 'ai-raja': 'Raja', 'ai-anita': 'Anita',
          'ai-vikram': 'Vikram', 'ai-deepa': 'Deepa',
        };
        const winnerNames = newState.winners
          .map(id => {
            const p = newState.session.players.find(pl => pl.id === id);
            if (!p) return 'Unknown';
            return AI_DISPLAY_NAMES[p.userId] || p.user?.username || p.userId;
          })
          .join(', ');

        set({
          gameState: newState,
          isMyTurn: false,
          availableActions: [],
          gameMessage: `Game Over! Winner: ${winnerNames}`,
          isProcessing: false,
          lastAction: { playerId: currentPlayer.id, action },
        });
      } else {
        const nextPlayer = newState.session.players.find(p => p.isTurn);
        const isMyTurn = nextPlayer?.seatPosition === 0;

        set({
          gameState: newState,
          isMyTurn,
          availableActions: isMyTurn ? newActions : [],
          betAmount: newState.session.currentBet,
          gameMessage: `${action.charAt(0).toUpperCase() + action.slice(1)}!`,
          isProcessing: false,
          selectedAction: null,
          lastAction: { playerId: currentPlayer.id, action },
        });
      }
    } catch (error) {
      set({
        gameMessage: error instanceof Error ? error.message : 'Invalid action',
        isProcessing: false,
      });
    }
  },

  // ─── Online Game (Real server) ───────────────────────────────────────

  performOnlineAction: async (action, amount) => {
    set({ isProcessing: true });

    try {
      const result = await socketService.sendAction(action, amount);
      if (!result.success) {
        set({
          gameMessage: result.error || 'Action failed',
          isProcessing: false,
        });
      }
      // State update will come via socket event
      set({ isProcessing: false });
    } catch (error) {
      set({
        gameMessage: error instanceof Error ? error.message : 'Connection error',
        isProcessing: false,
      });
    }
  },

  updateFromServer: (serverState) => {
    // Parse server state into our local format
    const players: GamePlayer[] = serverState.players.map((p: any) => ({
      id: p.id,
      sessionId: serverState.sessionId,
      userId: p.odic,
      seatPosition: p.seatPosition,
      chipsInPlay: parseInt(p.chipsInPlay),
      currentBet: parseInt(p.currentBet),
      cards: p.cards,
      handRank: p.handResult?.rank,
      status: p.status,
      isBlind: p.isBlind,
      isDealer: p.isDealer,
      isTurn: p.isTurn,
      user: { id: p.odic, username: p.username } as any,
    }));

    const myPlayer = players.find(p => serverState.availableActions?.length > 0 && p.isTurn)
      || players.find(p => p.cards && p.cards.length > 0);

    set({
      serverGameState: serverState,
      myCards: myPlayer?.cards || [],
      myPlayerId: myPlayer?.id || null,
      isMyTurn: (serverState.availableActions?.length || 0) > 0,
      availableActions: serverState.availableActions || [],
      isOnlineMode: true,
      gameMessage: serverState.status === 'finished' ? 'Game Over!' : '',
      // Create a compatible game state for rendering
      gameState: {
        session: {
          id: serverState.sessionId,
          roomId: serverState.roomId,
          variant: serverState.variant?.toLowerCase(),
          dealerPosition: serverState.dealerIndex,
          currentTurn: serverState.currentPlayerIndex,
          pot: parseInt(serverState.pot),
          currentBet: parseInt(serverState.currentBet),
          bootAmount: parseInt(serverState.bootAmount),
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
      } as any,
    });
  },

  // ─── Quick Play ──────────────────────────────────────────────────────

  quickPlay: async () => {
    if (socketService.isConnected) {
      try {
        const result = await socketService.quickPlay();
        if (result.success) {
          set({ isOnlineMode: true });
          return;
        }
      } catch {
        // Fall through to offline mode
      }
    }

    // Offline quick play — handled by App.tsx
  },

  setSelectedAction: (action) => set({ selectedAction: action }),
  setBetAmount: (amount) => set({ betAmount: amount }),
  toggleShowCards: () => set((state) => ({ showCards: !state.showCards })),

  resetGame: () => set({
    gameState: null,
    serverGameState: null,
    myCards: [],
    myPlayerId: null,
    isMyTurn: false,
    availableActions: [],
    showCards: false,
    selectedAction: null,
    betAmount: 0,
    gameMessage: '',
    lastAction: null,
  }),

  addChatMessage: (message) => set((state) => ({
    chatMessages: [...state.chatMessages, message],
  })),

  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
  setGameMessage: (message) => set({ gameMessage: message }),
}));

// Selectors
export const selectCurrentPlayer = (state: GameStore) =>
  state.gameState?.session.players.find(p => p.isTurn);

export const selectActivePlayers = (state: GameStore) =>
  state.gameState?.session.players.filter(p => p.status === 'playing' || p.status === 'show') || [];

export const selectPot = (state: GameStore) =>
  state.gameState?.session.pot || 0;
