import { io, Socket } from 'socket.io-client';
import Constants from 'expo-constants';

const SOCKET_URL = Constants.expoConfig?.extra?.socketUrl || 'http://localhost:3001';

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

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
