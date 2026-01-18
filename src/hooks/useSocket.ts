import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';
import { useGameStore } from '../stores/gameStore';
import { useUIStore } from '../stores/uiStore';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  GameRoom,
  ActionType
} from '../types';
import {
  calculateHandStrength,
  calculateAIThinkingTime,
  makeAIDecision,
  AIPersonality
} from '../game/handRanking';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'ws://localhost:3001';

interface UseSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  joinRoom: (roomId: string, buyIn: number) => void;
  leaveRoom: () => void;
  createRoom: (roomData: Partial<GameRoom>) => void;
  sendAction: (actionType: ActionType, amount?: number) => void;
  startGame: () => void;
  sendMessage: (message: string) => void;
}

export function useSocket(): UseSocketReturn {
  const socketRef = useRef<TypedSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user, token } = useAuthStore();
  const { joinRoom: storeJoinRoom, leaveRoom: storeLeaveRoom, addChatMessage } = useGameStore();
  const { addToast } = useUIStore();

  // Initialize socket connection
  const connect = useCallback(() => {
    if (socketRef.current?.connected || isConnecting) return;

    setIsConnecting(true);
    setError(null);

    const socket: TypedSocket = io(SOCKET_URL, {
      auth: { token, userId: user?.id },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    // Connection events
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        // Server disconnected us, try to reconnect
        socket.connect();
      }
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError(err.message);
      setIsConnecting(false);
    });

    // Game events
    socket.on('room:joined', (data) => {
      console.log('Joined room:', data);
      storeJoinRoom(data.room);
      addToast({ message: 'Joined table successfully!', type: 'success' });
    });

    socket.on('room:left', (data) => {
      console.log('Player left:', data.playerId);
    });

    socket.on('room:updated', (room) => {
      console.log('Room updated:', room);
      storeJoinRoom(room);
    });

    socket.on('game:started', (session) => {
      console.log('Game started:', session);
      addToast({ message: 'Game started! Good luck!', type: 'info' });
    });

    socket.on('game:action', (data) => {
      console.log('Game action:', data);
    });

    socket.on('game:turn', (data) => {
      console.log('Turn:', data);
    });

    socket.on('game:ended', (data) => {
      console.log('Game ended:', data);
      const winnerNames = data.winners.map(w => w.userId).join(', ');
      addToast({ message: `Game over! Winner: ${winnerNames}`, type: 'success' });
    });

    socket.on('cards:dealt', (data) => {
      console.log('Cards dealt:', data);
    });

    socket.on('chat:message', (message) => {
      addChatMessage(message);
    });

    socket.on('player:online', (data) => {
      console.log('Player online status:', data);
    });

    socket.on('error', (data) => {
      console.error('Socket error:', data);
      setError(data.message);
      addToast({ message: data.message, type: 'error' });
    });

    socketRef.current = socket;
  }, [user, token, storeJoinRoom, addChatMessage, addToast, isConnecting]);

  // Disconnect socket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Join a room
  const joinRoom = useCallback((roomId: string, buyIn: number) => {
    if (!socketRef.current?.connected) {
      setError('Not connected to server');
      return;
    }
    socketRef.current.emit('room:join', { roomId, buyIn });
  }, []);

  // Leave current room
  const leaveRoom = useCallback(() => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('room:leave');
    storeLeaveRoom();
  }, [storeLeaveRoom]);

  // Create a new room
  const createRoom = useCallback((roomData: Partial<GameRoom>) => {
    if (!socketRef.current?.connected) {
      setError('Not connected to server');
      return;
    }
    socketRef.current.emit('room:create', roomData);
  }, []);

  // Send game action
  const sendAction = useCallback((actionType: ActionType, amount?: number) => {
    if (!socketRef.current?.connected) {
      setError('Not connected to server');
      return;
    }
    socketRef.current.emit('game:action', { actionType, amount });
  }, []);

  // Start the game
  const startGame = useCallback(() => {
    if (!socketRef.current?.connected) {
      setError('Not connected to server');
      return;
    }
    socketRef.current.emit('game:start');
  }, []);

  // Send chat message
  const sendMessage = useCallback((message: string) => {
    if (!socketRef.current?.connected) {
      setError('Not connected to server');
      return;
    }
    socketRef.current.emit('chat:send', { message });
  }, []);

  // Auto-connect when user is authenticated
  useEffect(() => {
    if (user && token && !socketRef.current) {
      // For demo, we'll use local game logic instead of requiring a server
      // connect();
    }

    return () => {
      disconnect();
    };
  }, [user, token, connect, disconnect]);

  return {
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
    createRoom,
    sendAction,
    startGame,
    sendMessage
  };
}

// AI Player names and their personalities
const AI_PLAYER_CONFIG: Record<string, { name: string; personality: AIPersonality }> = {
  'ai-sharma': { name: 'Sharma Ji', personality: 'conservative' },
  'ai-priya': { name: 'Priya', personality: 'balanced' },
  'ai-bunty': { name: 'Bunty', personality: 'aggressive' }
};

// Action messages for AI players
const getAIActionMessage = (playerName: string, action: ActionType, isBluff?: boolean): string => {
  const messages: Record<ActionType, string[]> = {
    pack: [
      `${playerName} folded`,
      `${playerName} packed their cards`,
      `${playerName} is out this round`
    ],
    chaal: [
      `${playerName} called`,
      `${playerName} matched the bet`,
      `${playerName} is staying in`
    ],
    blind: [
      `${playerName} played blind`,
      `${playerName} continues blind`,
      `${playerName} trusts their luck`
    ],
    raise: isBluff ? [
      `${playerName} raised! (Bluffing?)`,
      `${playerName} bumped it up!`,
      `${playerName} is feeling bold!`
    ] : [
      `${playerName} raised!`,
      `${playerName} increased the stakes`,
      `${playerName} is confident!`
    ],
    show: [
      `${playerName} called for a show`,
      `${playerName} wants to see cards`,
      `${playerName} revealed!`
    ],
    sideshow: [
      `${playerName} called sideshow`,
      `${playerName} challenged their neighbor`
    ],
    boot: [
      `${playerName} posted the boot`,
      `${playerName} is in`
    ]
  };

  const actionMessages = messages[action] || [`${playerName} made a move`];
  return actionMessages[Math.floor(Math.random() * actionMessages.length)];
};

// Simulated multiplayer for demo (no server required)
export function useSimulatedMultiplayer() {
  const { gameState, performAction, setGameMessage } = useGameStore();
  const [aiThinking, setAiThinking] = useState(false);
  const [currentAIPlayer, setCurrentAIPlayer] = useState<string | null>(null);

  // Simulate AI players taking turns with smart decisions
  useEffect(() => {
    if (!gameState || gameState.isGameOver) return;

    const currentPlayer = gameState.session.players.find(p => p.isTurn);
    if (!currentPlayer || currentPlayer.seatPosition === 0) return; // Player 0 is the user

    // Get AI configuration
    const aiConfig = AI_PLAYER_CONFIG[currentPlayer.userId] || {
      name: `Player ${currentPlayer.seatPosition + 1}`,
      personality: 'balanced' as AIPersonality
    };

    setCurrentAIPlayer(aiConfig.name);
    setAiThinking(true);

    // Calculate hand strength for smart decisions
    let handStrength = 0.5; // Default if no cards
    if (currentPlayer.cards && currentPlayer.cards.length === 3) {
      handStrength = calculateHandStrength(
        currentPlayer.cards,
        gameState.session.variant
      );
    }

    // Calculate thinking time based on hand strength and personality
    const thinkingTime = calculateAIThinkingTime(handStrength, aiConfig.personality);

    // Calculate game context for decision
    const activePlayers = gameState.session.players.filter(
      p => p.status === 'playing' || p.status === 'show'
    ).length;
    const potOdds = gameState.session.currentBet / Math.max(1, gameState.session.pot);

    const timer = setTimeout(() => {
      setAiThinking(false);
      setCurrentAIPlayer(null);

      // Make AI decision
      const decision = makeAIDecision({
        handStrength,
        personality: aiConfig.personality,
        potOdds,
        playersRemaining: activePlayers,
        isBlind: currentPlayer.isBlind,
        roundNumber: gameState.session.round
      });

      // Show action message
      const actionMessage = getAIActionMessage(
        aiConfig.name,
        decision.action,
        decision.shouldRaise && handStrength < 0.3 // Potential bluff
      );
      setGameMessage(actionMessage);

      // Perform the action
      performAction(decision.action);
    }, thinkingTime);

    return () => clearTimeout(timer);
  }, [gameState, performAction, setGameMessage]);

  return { aiThinking, currentAIPlayer };
}
