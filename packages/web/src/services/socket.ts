import { io, Socket } from 'socket.io-client';
import { api } from './api';

const configuredSocketUrl = import.meta.env.VITE_SOCKET_URL?.replace(/\/$/, '');
const SOCKET_URL = configuredSocketUrl && (!import.meta.env.PROD || configuredSocketUrl.startsWith('https://'))
  ? configuredSocketUrl
  : import.meta.env.DEV ? 'http://localhost:3001' : '';

type GameStateCallback = (state: any) => void;
type RoomStateCallback = (room: any) => void;
type MessageCallback = (data: any) => void;
export type SocketConnectionState = 'connected' | 'connecting' | 'reconnecting' | 'offline';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private state: SocketConnectionState = 'offline';
  private connectPromise: Promise<void> | null = null;

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  get connectionState(): SocketConnectionState {
    return this.state;
  }

  private updateConnectionState(state: SocketConnectionState) {
    if (this.state === state) return;
    this.state = state;
    this.emit('connection:state', state);
  }

  connect(): Promise<void> {
    if (!SOCKET_URL) {
      this.updateConnectionState('offline');
      return Promise.reject(new Error('The production game server is not configured'));
    }
    const token = api.getToken();
    if (!token) {
      this.updateConnectionState('offline');
      return Promise.reject(new Error('No auth token'));
    }

    if (this.socket?.connected) {
      this.updateConnectionState('connected');
      return Promise.resolve();
    }
    if (this.connectPromise) return this.connectPromise;

    this.connectPromise = new Promise((resolve, reject) => {
      let settled = false;
      const resolveConnection = () => {
        if (settled) return;
        settled = true;
        this.connectPromise = null;
        resolve();
      };
      const rejectConnection = (error: Error) => {
        if (settled) return;
        settled = true;
        this.connectPromise = null;
        reject(error);
      };

      this.updateConnectionState(this.socket ? 'reconnecting' : 'connecting');

      this.socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
      });

      this.socket.on('connect', () => {
        console.log('[Socket] Connected:', this.socket?.id);
        this.reconnectAttempts = 0;
        this.updateConnectionState('connected');
        this.emit('connected');
        resolveConnection();
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[Socket] Disconnected:', reason);
        this.updateConnectionState(reason === 'io client disconnect' ? 'offline' : 'reconnecting');
        this.emit('disconnected', reason);
      });

      this.socket.on('connect_error', (error) => {
        console.error('[Socket] Connection error:', error.message);
        this.reconnectAttempts++;
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          this.updateConnectionState('offline');
          rejectConnection(new Error('Max reconnection attempts reached'));
        } else {
          this.updateConnectionState('reconnecting');
        }
        this.emit('error', error.message);
      });

      this.socket.io.on('reconnect_attempt', () => this.updateConnectionState('reconnecting'));
      this.socket.io.on('reconnect_failed', () => {
        this.updateConnectionState('offline');
        rejectConnection(new Error('Could not reconnect to the clubhouse'));
      });

      // ─── Game Events ─────────────────────────────────────────────────

      this.socket.on('game:state', (state) => {
        this.emit('game:state', state);
      });

      this.socket.on('game:ended', (data) => {
        this.emit('game:ended', data);
      });

      this.socket.on('game:ai_thinking', (data) => {
        this.emit('game:ai_thinking', data);
      });

      this.socket.on('game:timeout', (data) => {
        this.emit('game:timeout', data);
      });

      this.socket.on('game:ready_for_next', () => {
        this.emit('game:ready_for_next');
      });

      this.socket.on('referral:rewarded', (data) => {
        this.emit('referral:rewarded', data);
      });

      // ─── Room Events ─────────────────────────────────────────────────

      this.socket.on('room:state', (room) => {
        this.emit('room:state', room);
      });

      // ─── Chat Events ─────────────────────────────────────────────────

      this.socket.on('chat:message', (message) => {
        this.emit('chat:message', message);
      });

      // ─── Gift Events ─────────────────────────────────────────────────

      this.socket.on('gift:received', (data) => {
        this.emit('gift:received', data);
      });

      // ─── Error ────────────────────────────────────────────────────────

      this.socket.on('error', (data) => {
        console.error('[Socket] Server error:', data);
        this.emit('error', data.message || 'Server error');
      });
    });

    return this.connectPromise;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectPromise = null;
    this.updateConnectionState('offline');
  }

  // ─── Room Operations ─────────────────────────────────────────────────────

  listRooms(): Promise<{ rooms: any[] }> {
    return this.emitWithAck('room:list');
  }

  createRoom(config: {
    name: string;
    variant?: string;
    bootAmount?: number;
    minBuyIn?: number;
    maxBuyIn?: number;
    maxPlayers?: number;
    isPrivate?: boolean;
    buyIn?: number;
  }): Promise<{ success: boolean; room?: any; error?: string }> {
    return this.emitWithAck('room:create', config);
  }

  joinRoom(roomId: string, buyIn = 5000): Promise<{ success: boolean; error?: string }> {
    return this.emitWithAck('room:join', { roomId, buyIn });
  }

  joinByCode(code: string, buyIn?: number): Promise<{ success: boolean; error?: string }> {
    return this.emitWithAck('room:join_by_code', { code, ...(buyIn ? { buyIn } : {}) });
  }

  leaveRoom() {
    this.socket?.emit('room:leave');
  }

  // ─── Game Operations ─────────────────────────────────────────────────────

  quickPlay(): Promise<{ success: boolean; roomId?: string; error?: string }> {
    return this.emitWithAck('game:quick_play');
  }

  sendAction(action: string, amount?: number): Promise<{ success: boolean; error?: string }> {
    return this.emitWithAck('game:action', { action, amount });
  }

  // ─── Chat ────────────────────────────────────────────────────────────────

  sendChatMessage(roomId: string, message: string, type = 'text'): boolean {
    if (!this.socket?.connected) return false;
    this.socket.emit('chat:send', { roomId, message, type });
    return true;
  }

  // ─── Gifts ───────────────────────────────────────────────────────────────

  sendGift(roomId: string, receiverId: string, giftType: string) {
    this.socket?.emit('gift:send', { roomId, receiverId, giftType });
  }

  // ─── Event System ────────────────────────────────────────────────────────

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  off(event: string, callback: Function) {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, ...args: any[]) {
    this.listeners.get(event)?.forEach(cb => cb(...args));
  }

  private emitWithAck<T = any>(event: string, data?: any): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Not connected'));
        return;
      }

      const acknowledge = (response: T) => resolve(response);
      if (data === undefined) {
        this.socket.emit(event, acknowledge);
      } else {
        this.socket.emit(event, data, acknowledge);
      }
    });
  }
}

export const socketService = new SocketService();
