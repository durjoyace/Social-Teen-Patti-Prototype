import { Server, Socket } from 'socket.io';
import { authenticateSocket } from '../middleware/auth.js';
import { RoomManager } from '../game/roomManager.js';
import { prisma } from '../config/database.js';

export function setupSocketHandlers(io: Server) {
  const roomManager = new RoomManager(io);

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    const payload = authenticateSocket(token);
    if (!payload) {
      return next(new Error('Invalid token'));
    }

    socket.data.user = payload;
    next();
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user;
    console.log(`[Socket] Connected: ${user.username} (${user.userId})`);

    // Update online status
    prisma.user.update({
      where: { id: user.userId },
      data: { isOnline: true, lastSeen: new Date() },
    }).catch(console.error);

    // Try to reconnect to existing room
    const reconnected = roomManager.handleReconnect(user.userId, socket);
    if (reconnected) {
      console.log(`[Socket] Reconnected ${user.username} to existing room`);
    }

    // ─── Room Events ─────────────────────────────────────────────────────

    socket.on('room:list', (callback) => {
      const rooms = roomManager.getPublicRooms();
      callback({ rooms });
    });

    socket.on('room:create', (data, callback) => {
      try {
        const room = roomManager.createRoom({
          name: data.name || `${user.username}'s Table`,
          variant: data.variant || 'CLASSIC',
          bootAmount: data.bootAmount || 50,
          minBuyIn: data.minBuyIn || 500,
          maxBuyIn: data.maxBuyIn || 5000,
          maxPlayers: Math.min(data.maxPlayers || 6, 9),
          isPrivate: data.isPrivate || false,
          createdBy: user.userId,
        });

        // Auto-join the created room
        roomManager.joinRoom(room.id, socket, user.userId, user.username, data.buyIn || 5000);

        callback({ success: true, room: { id: room.id, roomCode: room.roomCode } });
      } catch (err) {
        callback({ success: false, error: 'Failed to create room' });
      }
    });

    socket.on('room:join', (data, callback) => {
      const room = roomManager.joinRoom(
        data.roomId,
        socket,
        user.userId,
        user.username,
        data.buyIn || 5000
      );

      if (room) {
        callback({ success: true });
      } else {
        callback({ success: false, error: 'Cannot join room' });
      }
    });

    socket.on('room:join_by_code', (data, callback) => {
      const room = roomManager.getRoomByCode(data.code);
      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      const joined = roomManager.joinRoom(
        room.id,
        socket,
        user.userId,
        user.username,
        data.buyIn || 5000
      );

      if (joined) {
        callback({ success: true });
      } else {
        callback({ success: false, error: 'Cannot join room' });
      }
    });

    socket.on('room:leave', () => {
      roomManager.leaveRoom(user.userId, socket);
    });

    // ─── Quick Play ──────────────────────────────────────────────────────

    socket.on('game:quick_play', (callback) => {
      try {
        const room = roomManager.quickPlay(socket, user.userId, user.username);
        callback({ success: true, roomId: room.id });
      } catch (err) {
        callback({ success: false, error: 'Failed to start quick play' });
      }
    });

    // ─── Game Events ─────────────────────────────────────────────────────

    socket.on('game:action', (data, callback) => {
      const result = roomManager.handleAction(
        user.userId,
        data.action,
        data.amount
      );
      callback(result);
    });

    socket.on('game:start', (callback) => {
      // TODO: Start game when enough players ready
      callback({ success: false, error: 'Not implemented yet' });
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
      console.log(`[Socket] Disconnected: ${user.username} (${reason})`);
      roomManager.handleDisconnect(socket.id);

      prisma.user.update({
        where: { id: user.userId },
        data: { isOnline: false, lastSeen: new Date() },
      }).catch(console.error);
    });
  });

  return roomManager;
}
