import { Server, Socket } from 'socket.io';
import { randomBytes } from 'node:crypto';
import {
  GameState,
  initializeGame,
  processAction,
  getPlayerView,
  getAvailableActions,
  getActivePlayers,
  ActionType,
  GameConfig,
} from './gameEngine.js';
import {
  makeAIDecision,
  calculateAIThinkingTime,
  evaluateHand,
  AIPersonality,
} from './handRanking.js';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { qualifyReferralForGame } from '../services/referralService.js';

// ─── Types ─────────────────────────────────────────────────────────────────

interface RoomPlayer {
  odic: string;
  username: string;
  socketId: string;
  chips: bigint;
  isReady: boolean;
  isBot: boolean;
  botPersonality?: AIPersonality;
  seatPosition: number;
}

interface Room {
  id: string;
  name: string;
  variant: string;
  bootAmount: bigint;
  minBuyIn: bigint;
  maxBuyIn: bigint;
  maxPlayers: number;
  isPrivate: boolean;
  roomCode?: string;
  createdBy: string;
  players: Map<string, RoomPlayer>; // odic -> player
  gameState?: GameState;
  turnTimer?: ReturnType<typeof setTimeout>;
  aiTimers: Map<string, ReturnType<typeof setTimeout>>;
  status: 'waiting' | 'playing' | 'finished';
}

const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// ─── AI Bot Definitions ────────────────────────────────────────────────────

const AI_BOTS: Array<{ id: string; username: string; personality: AIPersonality }> = [
  { id: 'bot-sharma', username: 'Sharma Ji', personality: 'conservative' },
  { id: 'bot-priya', username: 'Priya', personality: 'balanced' },
  { id: 'bot-bunty', username: 'Bunty', personality: 'aggressive' },
  { id: 'bot-meera', username: 'Meera', personality: 'balanced' },
  { id: 'bot-raja', username: 'Raja', personality: 'aggressive' },
  { id: 'bot-anita', username: 'Anita', personality: 'conservative' },
  { id: 'bot-vikram', username: 'Vikram', personality: 'balanced' },
  { id: 'bot-deepa', username: 'Deepa', personality: 'aggressive' },
];

// ─── Room Manager ──────────────────────────────────────────────────────────

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private playerRooms: Map<string, string> = new Map(); // odic -> roomId
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  // ─── Room Operations ───────────────────────────────────────────────────

  createRoom(config: {
    name: string;
    variant: string;
    bootAmount: number;
    minBuyIn: number;
    maxBuyIn: number;
    maxPlayers: number;
    isPrivate: boolean;
    createdBy: string;
  }): Room {
    const id = crypto.randomUUID();
    const roomCode = config.isPrivate ? this.createUniqueRoomCode() : undefined;

    const room: Room = {
      id,
      name: config.name,
      variant: config.variant,
      bootAmount: BigInt(config.bootAmount),
      minBuyIn: BigInt(config.minBuyIn),
      maxBuyIn: BigInt(config.maxBuyIn),
      maxPlayers: config.maxPlayers,
      isPrivate: config.isPrivate,
      roomCode,
      createdBy: config.createdBy,
      players: new Map(),
      aiTimers: new Map(),
      status: 'waiting',
    };

    this.rooms.set(id, room);
    return room;
  }

  joinRoom(
    roomId: string,
    socket: Socket,
    userId: string,
    username: string,
    buyIn: number
  ): Room | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    if (room.status === 'playing') return null;
    if (room.players.size >= room.maxPlayers) return null;
    if (BigInt(buyIn) < room.minBuyIn || BigInt(buyIn) > room.maxBuyIn) return null;

    // Check if player is already in another room
    const existingRoom = this.playerRooms.get(userId);
    if (existingRoom && existingRoom !== roomId) return null;

    const seatPosition = this.findEmptySeat(room);
    if (seatPosition === -1) return null;

    const player: RoomPlayer = {
      odic: userId,
      username,
      socketId: socket.id,
      chips: BigInt(buyIn),
      isReady: false,
      isBot: false,
      seatPosition,
    };

    room.players.set(userId, player);
    this.playerRooms.set(userId, roomId);
    socket.join(roomId);

    this.broadcastRoomState(room);
    if (room.players.size >= 2) {
      queueMicrotask(() => this.startGame(room));
    }
    return room;
  }

  leaveRoom(userId: string, socket: Socket): void {
    const roomId = this.playerRooms.get(userId);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    room.players.delete(userId);
    this.playerRooms.delete(userId);
    socket.leave(roomId);

    if (room.players.size === 0) {
      this.cleanupRoom(room);
    } else {
      this.broadcastRoomState(room);
    }
  }

  // ─── Quick Play ────────────────────────────────────────────────────────

  quickPlay(
    socket: Socket,
    userId: string,
    username: string
  ): Room {
    const room = this.createRoom({
      name: 'Quick Play',
      variant: 'CLASSIC',
      bootAmount: 50,
      minBuyIn: 500,
      maxBuyIn: 5000,
      maxPlayers: 4,
      isPrivate: false,
      createdBy: userId,
    });

    // Add human player
    this.joinRoom(room.id, socket, userId, username, 5000);

    // Add 3 AI bots
    const shuffledBots = [...AI_BOTS].sort(() => Math.random() - 0.5);
    for (let i = 0; i < 3; i++) {
      const bot = shuffledBots[i];
      const seat = this.findEmptySeat(room);
      room.players.set(bot.id, {
        odic: bot.id,
        username: bot.username,
        socketId: 'bot',
        chips: 5000n,
        isReady: true,
        isBot: true,
        botPersonality: bot.personality,
        seatPosition: seat,
      });
    }

    // Start game immediately
    this.startGame(room);
    return room;
  }

  // ─── Game Control ──────────────────────────────────────────────────────

  startGame(room: Room): void {
    if (room.players.size < 2) return;
    if (room.status === 'playing') return;

    const players = Array.from(room.players.values()).map(p => ({
      userId: p.odic,
      username: p.username,
      chips: p.chips,
      isBot: p.isBot,
      botPersonality: p.botPersonality,
    }));

    const config: GameConfig = {
      roomId: room.id,
      variant: room.variant as any,
      bootAmount: room.bootAmount,
      minBet: room.bootAmount,
      turnTimeoutMs: env.turnTimeoutSeconds * 1000,
    };

    room.gameState = initializeGame(config, players);
    room.status = 'playing';

    // Send personalized game state to each player
    this.broadcastGameState(room);

    // Start turn timer
    this.startTurnTimer(room);

    // If first player is AI, trigger AI action
    this.checkAndTriggerAI(room);
  }

  handleAction(
    userId: string,
    action: ActionType,
    amount?: number
  ): { success: boolean; error?: string } {
    const roomId = this.playerRooms.get(userId);
    if (!roomId) return { success: false, error: 'Not in a room' };

    const room = this.rooms.get(roomId);
    if (!room?.gameState) return { success: false, error: 'No active game' };

    // Find this player's game ID
    const gamePlayer = room.gameState.players.find(p => p.odic === userId);
    if (!gamePlayer) return { success: false, error: 'Not in this game' };

    try {
      room.gameState = processAction(
        room.gameState,
        gamePlayer.id,
        action,
        amount ? BigInt(amount) : undefined
      );

      // Clear and restart turn timer
      this.clearTurnTimer(room);

      // Broadcast updated state
      this.broadcastGameState(room);

      // Check if game is over
      if (room.gameState.status === 'finished') {
        this.handleGameEnd(room);
      } else {
        this.startTurnTimer(room);
        this.checkAndTriggerAI(room);
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Invalid action' };
    }
  }

  // ─── AI Logic ──────────────────────────────────────────────────────────

  private checkAndTriggerAI(room: Room): void {
    if (!room.gameState || room.gameState.status !== 'playing') return;

    const currentPlayer = room.gameState.players[room.gameState.currentPlayerIndex];
    if (!currentPlayer || !currentPlayer.isBot) return;

    // Calculate AI decision
    const handStrength = evaluateHand(currentPlayer.cards, room.gameState.variant).strength;
    const personality = (currentPlayer.botPersonality || 'balanced') as AIPersonality;
    const thinkingTime = calculateAIThinkingTime(handStrength, personality);

    const activePlayers = getActivePlayers(room.gameState);
    const potOdds = Number(room.gameState.currentBet) / Math.max(1, Number(room.gameState.pot));

    // Broadcast that AI is "thinking"
    this.io.to(room.id).emit('game:ai_thinking', {
      playerId: currentPlayer.id,
      username: currentPlayer.username,
    });

    const timer = setTimeout(() => {
      if (!room.gameState || room.gameState.status !== 'playing') return;

      const decision = makeAIDecision({
        handStrength,
        personality,
        potOdds,
        playersRemaining: activePlayers.length,
        isBlind: currentPlayer.isBlind,
        roundNumber: room.gameState.roundNumber,
      });

      // Map AI action to valid game action
      let gameAction: ActionType = decision.action;

      // If AI wants to show but can't, chaal instead
      if (gameAction === 'show' && activePlayers.length !== 2) {
        gameAction = 'chaal';
      }

      // Validate the action is available
      const available = getAvailableActions(room.gameState!);
      if (!available.includes(gameAction)) {
        // Fallback: chaal or blind
        gameAction = available.includes('chaal') ? 'chaal'
          : available.includes('blind') ? 'blind'
          : 'pack';
      }

      this.handleAction(currentPlayer.odic, gameAction);
    }, thinkingTime);

    room.aiTimers.set(currentPlayer.id, timer);
  }

  // ─── Turn Timer ────────────────────────────────────────────────────────

  private startTurnTimer(room: Room): void {
    if (!room.gameState) return;

    const currentPlayer = room.gameState.players[room.gameState.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.isBot) return; // AI has its own timer

    room.turnTimer = setTimeout(() => {
      if (!room.gameState || room.gameState.status !== 'playing') return;

      // Auto-fold on timeout
      try {
        room.gameState = processAction(
          room.gameState,
          currentPlayer.id,
          'timeout'
        );

        this.io.to(room.id).emit('game:timeout', { playerId: currentPlayer.id });
        this.broadcastGameState(room);

        if (room.gameState.status === 'finished') {
          this.handleGameEnd(room);
        } else {
          this.startTurnTimer(room);
          this.checkAndTriggerAI(room);
        }
      } catch (err) {
        console.error('Timeout action error:', err);
      }
    }, room.gameState.turnTimeoutMs);
  }

  private clearTurnTimer(room: Room): void {
    if (room.turnTimer) {
      clearTimeout(room.turnTimer);
      room.turnTimer = undefined;
    }
    // Clear all AI timers too
    for (const [, timer] of room.aiTimers) {
      clearTimeout(timer);
    }
    room.aiTimers.clear();
  }

  // ─── Game End ──────────────────────────────────────────────────────────

  private async handleGameEnd(room: Room): Promise<void> {
    if (!room.gameState) return;
    this.clearTurnTimer(room);

    const gameState = room.gameState;
    const winners = gameState.winners;
    const pot = gameState.pot;
    const humanPlayers = gameState.players.filter(player => !player.isBot);
    let resultsPersisted = false;

    // Persist game results to database
    try {
      await prisma.$transaction(async tx => {
        for (const player of humanPlayers) {
          const isWinner = winners.includes(player.id);
          const chipsDelta = player.chipsInPlay - player.chips;
          const current = await tx.user.findUniqueOrThrow({
            where: { id: player.odic },
            select: { chips: true, biggestWin: true },
          });
          const updated = await tx.user.update({
            where: { id: player.odic },
            data: {
              chips: { increment: chipsDelta },
              totalGames: { increment: 1 },
              gamesWon: { increment: isWinner ? 1 : 0 },
              handsPlayed: { increment: 1 },
              biggestWin: isWinner && chipsDelta > current.biggestWin ? { set: chipsDelta } : undefined,
              totalWinnings: isWinner && chipsDelta > 0n ? { increment: chipsDelta } : undefined,
              totalLosses: !isWinner && chipsDelta < 0n ? { increment: -chipsDelta } : undefined,
              currentStreak: isWinner ? { increment: 1 } : { set: 0 },
            },
            select: { chips: true },
          });
          await tx.transaction.create({
            data: {
              userId: player.odic,
              type: isWinner ? 'GAME_WIN' : 'GAME_LOSS',
              amount: chipsDelta,
              balanceBefore: current.chips,
              balanceAfter: updated.chips,
              referenceId: gameState.sessionId,
            },
          });
        }
      });
      resultsPersisted = true;
    } catch (err) {
      console.error('Error persisting game results:', err);
    }

    if (resultsPersisted && humanPlayers.length >= 2) {
      const humanIds = humanPlayers.map(player => player.odic);
      for (const player of humanPlayers) {
        try {
          const reward = await qualifyReferralForGame(player.odic, gameState.sessionId, humanIds);
          if (reward.rewarded) {
            const socket = this.io.sockets.sockets.get(room.players.get(player.odic)?.socketId ?? '');
            socket?.emit('referral:rewarded', {
              beli: 100,
              balance: reward.inviteeBalance,
              milestone: reward.milestone,
            });
          }
        } catch (error) {
          console.error('Referral qualification error:', error);
        }
      }
    }

    // Broadcast final state with all cards revealed
    this.broadcastGameState(room);

    // Send winner celebration
    this.io.to(room.id).emit('game:ended', {
      winners: winners.map(wId => {
        const p = gameState.players.find(pl => pl.id === wId);
        return {
          id: wId,
          username: p?.username,
          amount: pot.toString(),
          handResult: p?.handResult,
        };
      }),
      pot: pot.toString(),
    });

    // After delay, offer replay
    setTimeout(() => {
      room.status = 'waiting';
      room.gameState = undefined;
      this.io.to(room.id).emit('game:ready_for_next');
    }, 5000);
  }

  // ─── Broadcasting ──────────────────────────────────────────────────────

  private broadcastGameState(room: Room): void {
    if (!room.gameState) return;

    // Send personalized state to each player
    for (const [odic, player] of room.players) {
      if (player.isBot) continue;

      const gamePlayer = room.gameState.players.find(p => p.odic === odic);
      if (!gamePlayer) continue;

      const socket = this.io.sockets.sockets.get(player.socketId);
      if (socket) {
        socket.emit('game:state', getPlayerView(room.gameState, gamePlayer.id));
      }
    }
  }

  private broadcastRoomState(room: Room): void {
    this.io.to(room.id).emit('room:state', {
      id: room.id,
      name: room.name,
      variant: room.variant,
      bootAmount: room.bootAmount.toString(),
      maxPlayers: room.maxPlayers,
      currentPlayers: room.players.size,
      status: room.status,
      isPrivate: room.isPrivate,
      roomCode: room.roomCode,
      players: Array.from(room.players.values()).map(p => ({
        odic: p.odic,
        username: p.username,
        chips: p.chips.toString(),
        isReady: p.isReady,
        isBot: p.isBot,
        seatPosition: p.seatPosition,
      })),
    });
  }

  // ─── Utilities ─────────────────────────────────────────────────────────

  private findEmptySeat(room: Room): number {
    const takenSeats = new Set(
      Array.from(room.players.values()).map(p => p.seatPosition)
    );
    for (let i = 0; i < room.maxPlayers; i++) {
      if (!takenSeats.has(i)) return i;
    }
    return -1;
  }

  private createUniqueRoomCode(): string {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const bytes = randomBytes(6);
      const code = Array.from(bytes, byte => ROOM_CODE_ALPHABET[byte % ROOM_CODE_ALPHABET.length]).join('');
      if (!Array.from(this.rooms.values()).some(room => room.roomCode === code)) return code;
    }
    throw new Error('Could not allocate a private room code');
  }

  private cleanupRoom(room: Room): void {
    this.clearTurnTimer(room);
    this.rooms.delete(room.id);
  }

  getRoomByCode(code: string): Room | undefined {
    return Array.from(this.rooms.values()).find(r => r.roomCode === code);
  }

  getPublicRooms(): Array<Record<string, unknown>> {
    return Array.from(this.rooms.values())
      .filter(r => !r.isPrivate && r.status === 'waiting')
      .map(r => ({
        id: r.id,
        name: r.name,
        variant: r.variant,
        bootAmount: r.bootAmount.toString(),
        minBuyIn: r.minBuyIn.toString(),
        maxBuyIn: r.maxBuyIn.toString(),
        maxPlayers: r.maxPlayers,
        currentPlayers: r.players.size,
        status: r.status,
      }));
  }

  handleDisconnect(socketId: string): void {
    // Find player by socket
    for (const [roomId, room] of this.rooms) {
      for (const [odic, player] of room.players) {
        if (player.socketId === socketId && !player.isBot) {
          // Mark as disconnected (give them time to reconnect)
          if (room.gameState) {
            const gamePlayer = room.gameState.players.find(p => p.odic === odic);
            if (gamePlayer) {
              gamePlayer.status = 'disconnected';
              gamePlayer.disconnectedAt = Date.now();
            }
          }

          // Start reconnection timer (60 seconds)
          setTimeout(() => {
            const p = room.players.get(odic);
            if (p && p.socketId === socketId) {
              // Still disconnected — remove from room
              this.leaveRoom(odic, { leave: () => {}, id: socketId } as any);
            }
          }, 60000);

          return;
        }
      }
    }
  }

  handleReconnect(userId: string, socket: Socket): boolean {
    const roomId = this.playerRooms.get(userId);
    if (!roomId) return false;

    const room = this.rooms.get(roomId);
    if (!room) return false;

    const player = room.players.get(userId);
    if (!player) return false;

    // Update socket
    player.socketId = socket.id;
    socket.join(roomId);

    // Restore game state
    if (room.gameState) {
      const gamePlayer = room.gameState.players.find(p => p.odic === userId);
      if (gamePlayer && gamePlayer.status === 'disconnected') {
        gamePlayer.status = 'playing';
        gamePlayer.disconnectedAt = undefined;
      }
    }

    // Send current state
    this.broadcastRoomState(room);
    if (room.gameState) {
      const gamePlayer = room.gameState.players.find(p => p.odic === userId);
      if (gamePlayer) {
        socket.emit('game:state', getPlayerView(room.gameState, gamePlayer.id));
      }
    }

    return true;
  }
}
