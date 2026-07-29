import { Server, Socket } from 'socket.io';
import { authenticateSocket } from '../middleware/auth.js';
import { RoomManager } from '../game/roomManager.js';
import { prisma } from '../config/database.js';
import { z } from 'zod';

const roomCreateSchema = z.object({
  name: z.string().trim().min(1).max(48).optional(),
  variant: z.enum(['CLASSIC', 'JOKER', 'MUFLIS', 'AK47', 'HUKAM', 'LOWBALL', 'BEST_OF_FOUR', 'DEALERS_CHOICE']).default('CLASSIC'),
  bootAmount: z.coerce.number().int().min(1).max(100_000).default(50),
  minBuyIn: z.coerce.number().int().min(100).max(1_000_000).default(500),
  maxBuyIn: z.coerce.number().int().min(100).max(1_000_000).default(5000),
  maxPlayers: z.coerce.number().int().min(2).max(9).default(6),
  isPrivate: z.boolean().default(false),
  buyIn: z.coerce.number().int().min(100).max(1_000_000).default(5000),
}).refine(input => input.minBuyIn <= input.maxBuyIn, 'Minimum buy-in must not exceed maximum')
  .refine(input => input.buyIn >= input.minBuyIn && input.buyIn <= input.maxBuyIn, 'Buy-in is outside the table range');

const joinSchema = z.object({
  roomId: z.string().uuid(),
  buyIn: z.coerce.number().int().min(100).max(1_000_000).default(5000),
});
const joinCodeSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{6}$/),
  buyIn: z.coerce.number().int().min(100).max(1_000_000).optional(),
});
const actionSchema = z.object({
  action: z.enum(['boot', 'blind', 'chaal', 'raise', 'pack', 'show', 'sideshow', 'sideshow_accept', 'sideshow_reject', 'timeout']),
  amount: z.coerce.number().int().positive().max(1_000_000).optional(),
});

export function setupSocketHandlers(io: Server) {
  const roomManager = new RoomManager(io);

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token as string;
      if (!token) return next(new Error('Authentication required'));

      const payload = authenticateSocket(token);
      if (!payload) return next(new Error('Invalid token'));

      const account = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { username: true, isGuest: true, isBanned: true },
      });
      if (!account || account.isBanned) return next(new Error('Account unavailable'));

      socket.data.user = {
        userId: payload.userId,
        username: account.username,
        isGuest: account.isGuest,
      };
      next();
    } catch {
      next(new Error('Authentication unavailable'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user;
    void socket.join(`user:${user.userId}`);
    console.log('[Socket] Connected');

    // Update online status
    prisma.user.update({
      where: { id: user.userId },
      data: { isOnline: true, lastSeen: new Date() },
    }).catch(console.error);

    // Try to reconnect to existing room
    const reconnected = roomManager.handleReconnect(user.userId, socket);
    if (reconnected) {
      console.log('[Socket] Reconnected to an existing room');
    }

    // ─── Room Events ─────────────────────────────────────────────────────

    socket.on('room:list', (callback) => {
      const rooms = roomManager.getPublicRooms();
      callback({ rooms });
    });

    socket.on('room:create', async (data, callback) => {
      try {
        const input = roomCreateSchema.parse(data);
        const account = await prisma.user.findUnique({ where: { id: user.userId }, select: { chips: true } });
        if (!account || account.chips < BigInt(input.buyIn)) {
          callback({ success: false, error: 'Not enough chips for this table' });
          return;
        }
        const room = roomManager.createRoom({
          name: input.name || `${user.username}'s Table`,
          variant: input.variant,
          bootAmount: input.bootAmount,
          minBuyIn: input.minBuyIn,
          maxBuyIn: input.maxBuyIn,
          maxPlayers: input.maxPlayers,
          isPrivate: input.isPrivate,
          createdBy: user.userId,
        });

        // Auto-join the created room
        roomManager.joinRoom(room.id, socket, user.userId, user.username, input.buyIn);

        callback({ success: true, room: { id: room.id, roomCode: room.roomCode } });
      } catch (err) {
        callback({ success: false, error: err instanceof z.ZodError ? 'Invalid table settings' : 'Failed to create room' });
      }
    });

    socket.on('room:join', async (data, callback) => {
      try {
        const parsed = joinSchema.safeParse(data);
        if (!parsed.success) {
          callback({ success: false, error: 'Invalid join request' });
          return;
        }
        const account = await prisma.user.findUnique({ where: { id: user.userId }, select: { chips: true } });
        if (!account || account.chips < BigInt(parsed.data.buyIn)) {
          callback({ success: false, error: 'Not enough chips for this table' });
          return;
        }
        const room = roomManager.joinRoom(
          parsed.data.roomId,
          socket,
          user.userId,
          user.username,
          parsed.data.buyIn
        );

        callback(room ? { success: true } : { success: false, error: 'Cannot join room' });
      } catch {
        callback({ success: false, error: 'Failed to join room' });
      }
    });

    socket.on('room:join_by_code', async (data, callback) => {
      try {
        const parsed = joinCodeSchema.safeParse(data);
        if (!parsed.success) {
          callback({ success: false, error: 'Invalid room code' });
          return;
        }
        const room = roomManager.getRoomByCode(parsed.data.code);
        if (!room) {
          callback({ success: false, error: 'Room not found' });
          return;
        }
        const buyIn = parsed.data.buyIn
          ?? Number(room.minBuyIn > 5000n ? room.minBuyIn : room.maxBuyIn < 5000n ? room.maxBuyIn : 5000n);
        const account = await prisma.user.findUnique({ where: { id: user.userId }, select: { chips: true } });
        if (!account || account.chips < BigInt(buyIn)) {
          callback({ success: false, error: 'Not enough chips for this table' });
          return;
        }

        const joined = roomManager.joinRoom(
          room.id,
          socket,
          user.userId,
          user.username,
          buyIn
        );

        callback(joined ? { success: true } : { success: false, error: 'Cannot join room' });
      } catch {
        callback({ success: false, error: 'Failed to join room' });
      }
    });

    socket.on('room:leave', () => {
      roomManager.leaveRoom(user.userId, socket);
    });

    // ─── Quick Play ──────────────────────────────────────────────────────

    socket.on('game:quick_play', async (callback) => {
      try {
        const account = await prisma.user.findUnique({ where: { id: user.userId }, select: { chips: true } });
        if (!account || account.chips < 5000n) {
          callback({ success: false, error: 'You need 5,000 chips for quick play' });
          return;
        }
        const room = roomManager.quickPlay(socket, user.userId, user.username);
        callback({ success: true, roomId: room.id });
      } catch (err) {
        callback({ success: false, error: 'Failed to start quick play' });
      }
    });

    // ─── Game Events ─────────────────────────────────────────────────────

    socket.on('game:action', (data, callback) => {
      const parsed = actionSchema.safeParse(data);
      if (!parsed.success) {
        callback({ success: false, error: 'Invalid game action' });
        return;
      }
      const result = roomManager.handleAction(
        user.userId,
        parsed.data.action,
        parsed.data.amount
      );
      callback(result);
    });

    // ─── Chat Events ─────────────────────────────────────────────────────

    socket.on('chat:send', async (data) => {
      if (!data.message?.trim()) return;

      const message = {
        id: crypto.randomUUID(),
        userId: user.userId,
        username: user.username,
        message: data.message.trim().slice(0, 500), // Limit message length
        type: data.type || 'text',
        createdAt: new Date().toISOString(),
      };

      // Broadcast to room
      if (data.roomId) {
        io.to(data.roomId).emit('chat:message', message);
      }
    });

    // ─── Social Events ───────────────────────────────────────────────────

    socket.on('gift:send', async (data) => {
      // Table gifts during games
      io.to(data.roomId).emit('gift:received', {
        senderId: user.userId,
        senderName: user.username,
        receiverId: data.receiverId,
        giftType: data.giftType,
      });
    });

    // ─── Disconnect ──────────────────────────────────────────────────────

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Disconnected: ${reason}`);
      roomManager.handleDisconnect(socket.id);

      prisma.user.update({
        where: { id: user.userId },
        data: { isOnline: false, lastSeen: new Date() },
      }).catch(console.error);
    });
  });

  return roomManager;
}
