import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';
import { useGameStore } from '../stores/gameStore';
import { useUIStore } from '../stores/uiStore';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  GameSession,
  GameRoom,
  ChatMessage,
  ActionType
} from '../types';

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

// Simulated multiplayer for demo (no server required)
export function useSimulatedMultiplayer() {
  const { gameState, performAction } = useGameStore();
  const [aiThinking, setAiThinking] = useState(false);

  // Simulate AI players taking turns
  useEffect(() => {
    if (!gameState || gameState.isGameOver) return;

    const currentPlayer = gameState.session.players.find(p => p.isTurn);
    if (!currentPlayer || currentPlayer.seatPosition === 0) return; // Player 0 is the user

    // AI takes action after a delay
    setAiThinking(true);
    const delay = 1500 + Math.random() * 2000; // 1.5-3.5 seconds

    const timer = setTimeout(() => {
      setAiThinking(false);

      // Simple AI logic
      const rand = Math.random();
      if (rand < 0.1) {
        // 10% chance to pack
        performAction('pack');
      } else if (rand < 0.3) {
        // 20% chance to raise
        performAction('raise');
      } else {
        // 70% chance to chaal/blind
        performAction(currentPlayer.isBlind ? 'blind' : 'chaal');
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [gameState, performAction]);

  return { aiThinking };
}
