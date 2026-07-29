import { io, Socket } from 'socket.io-client';
import Constants from 'expo-constants';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || Constants.expoConfig?.extra?.socketUrl || 'http://localhost:3001';

let socket: Socket | null = null;

export function connectSocket(token: string): Socket {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => console.log('[Socket] Connected'));
  socket.on('disconnect', (reason) => console.log('[Socket] Disconnected:', reason));
  socket.on('connect_error', (err) => console.error('[Socket] Error:', err.message));

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

async function connectedSocket(): Promise<Socket> {
  if (!socket) throw new Error('Not connected');
  if (socket.connected) return socket;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Connection timed out')), 10_000);
    socket!.once('connect', () => { clearTimeout(timeout); resolve(socket!); });
    socket!.once('connect_error', (error) => { clearTimeout(timeout); reject(error); });
  });
}

async function emitWithAck<T>(event: string, data?: unknown): Promise<T> {
  const activeSocket = await connectedSocket();
  return new Promise(resolve => activeSocket.emit(event, data, resolve));
}

export const gameSocket = {
  listRooms: () => emitWithAck<{ rooms: any[] }>('room:list'),
  createPrivateRoom: () => emitWithAck<{ success: boolean; room?: { id: string; roomCode?: string }; error?: string }>('room:create', {
    name: 'Friends Game',
    variant: 'CLASSIC',
    bootAmount: 50,
    minBuyIn: 500,
    maxBuyIn: 5000,
    maxPlayers: 6,
    isPrivate: true,
    buyIn: 5000,
  }),
  joinByCode: (code: string, buyIn?: number) => emitWithAck<{ success: boolean; error?: string }>('room:join_by_code', { code, ...(buyIn ? { buyIn } : {}) }),
  joinRoom: (roomId: string, buyIn = 5000) => emitWithAck<{ success: boolean; error?: string }>('room:join', { roomId, buyIn }),
  quickPlay: () => emitWithAck<{ success: boolean; error?: string }>('game:quick_play'),
  action: (action: string, amount?: number) => emitWithAck<{ success: boolean; error?: string }>('game:action', { action, amount }),
  leave: () => socket?.emit('room:leave'),
};

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
