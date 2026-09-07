import { sessionActive } from "./authSessions.js";
import { PLAYER_ACTIONS } from "../../../packages/shared/src/rules/protocol.js";
import { Server, Socket } from "socket.io";
import { authenticateSocket } from "../middleware/auth.js";
import { RoomManager } from "../game/roomManager.js";
import { prisma } from "../config/database.js";
import { z } from "zod";

const roomCreateSchema = z
  .object({
    name: z.string().trim().min(1).max(48).optional(),
    variant: z.enum(["CLASSIC", "MUFLIS", "LOWBALL"]).default("CLASSIC"),
    bootAmount: z.coerce.number().int().min(1).max(100_000).default(50),
    minBuyIn: z.coerce.number().int().min(100).max(1_000_000).default(500),
    maxBuyIn: z.coerce.number().int().min(100).max(1_000_000).default(5000),
    maxPlayers: z.coerce.number().int().min(2).max(9).default(6),
    isPrivate: z.boolean().default(false),
    buyIn: z.coerce.number().int().min(100).max(1_000_000).default(5000),
  })
  .refine(
    (input) => input.bootAmount < input.minBuyIn,
    "Boot must be less than minimum buy-in",
  )
  .refine(
    (input) => input.minBuyIn <= input.maxBuyIn,
    "Minimum buy-in must not exceed maximum",
  )
  .refine(
    (input) => input.buyIn >= input.minBuyIn && input.buyIn <= input.maxBuyIn,
    "Buy-in is outside the table range",
  );

const joinSchema = z.object({
  roomId: z.string().uuid(),
  buyIn: z.coerce.number().int().min(100).max(1_000_000).default(5000),
});
const joinCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{6}$/),
  buyIn: z.coerce.number().int().min(100).max(1_000_000).optional(),
});
const actionSchema = z.object({
  sessionId: z.string().uuid(),
  expectedVersion: z.number().int().nonnegative(),
  commandId: z.string().min(8).max(80),
  action: z.enum(PLAYER_ACTIONS),
  amount: z.coerce.number().int().positive().max(1_000_000).optional(),
});
const chatSchema = z.object({
  roomId: z.string().uuid(),
  message: z.string().trim().min(1).max(500),
  type: z.enum(["text", "emoji"]).default("text"),
});
const giftSchema = z.object({
  roomId: z.string().uuid(),
  receiverId: z.string().trim().min(1).max(64),
  giftType: z.string().trim().min(1).max(64),
});

type SocketAcknowledgement = (payload: unknown) => void;

/** Keep malformed or older clients from crashing the process when they omit an ack. */
export function safeSocketAcknowledgement(
  callback: unknown,
): SocketAcknowledgement {
  return typeof callback === "function"
    ? (callback as SocketAcknowledgement)
    : () => undefined;
}

export function setupSocketHandlers(io: Server) {
  const roomManager = new RoomManager(io);

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token as string;
      if (!token) return next(new Error("Authentication required"));

      const payload = authenticateSocket(token);
      if (!payload || !(await sessionActive(payload)))
        return next(new Error("Invalid token"));

      const account = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { username: true, isGuest: true, isBanned: true },
      });
      if (!account || account.isBanned)
        return next(new Error("Account unavailable"));

      socket.data.user = {
        sessionId: payload.sessionId,
        userId: payload.userId,
        username: account.username,
        isGuest: account.isGuest,
      };
      next();
    } catch {
      next(new Error("Authentication unavailable"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const user = socket.data.user;
    let windowStart = Date.now(),
      packets = 0;
    socket.use(async (_packet, next) => {
      if (Date.now() - windowStart > 10_000) {
        windowStart = Date.now();
        packets = 0;
      }
      if (++packets > 60) {
        socket.emit("error", {
          message: "Too many requests. Reconnect shortly.",
        });
        socket.disconnect(true);
        return;
      }
      try {
        if (!(await sessionActive(user))) {
          socket.emit("session:expired");
          socket.disconnect(true);
          return;
        }
        next();
      } catch {
        next(new Error("Session check unavailable"));
      }
    });
    void socket.join(`user:${user.userId}`);
    void socket.join(`session:${user.sessionId}`);
    console.log("[Socket] Connected");

    // Update online status
    prisma.user
      .update({
        where: { id: user.userId },
        data: { isOnline: true, lastSeen: new Date() },
      })
      .catch(console.error);

    // Try to reconnect to existing room
    void roomManager
      .handleReconnect(user.userId, socket)
      .catch(() =>
        socket.emit("error", {
          message: "Table recovery unavailable. Please reconnect.",
        }),
      );

    // ─── Room Events ─────────────────────────────────────────────────────

    socket.on("room:list", (callback) => {
      const respond = safeSocketAcknowledgement(callback);
      const rooms = roomManager.getPublicRooms();
      respond({ rooms });
    });

    socket.on("room:create", async (data, callback) => {
      const respond = safeSocketAcknowledgement(callback);
      try {
        const input = roomCreateSchema.parse(data);
        const room = await roomManager.createAndJoin(
          {
            name: input.name || `${user.username}'s Table`,
            variant: input.variant,
            bootAmount: input.bootAmount,
            minBuyIn: input.minBuyIn,
            maxBuyIn: input.maxBuyIn,
            maxPlayers: input.maxPlayers,
            isPrivate: input.isPrivate,
            createdBy: user.userId,
          },
          socket,
          input.buyIn,
        );

        respond({
          success: true,
          room: { id: room.id, roomCode: room.roomCode },
        });
      } catch (err) {
        respond({
          success: false,
          error:
            err instanceof z.ZodError
              ? "Invalid table settings"
              : "Failed to create room",
        });
      }
    });

    socket.on("room:join", async (data, callback) => {
      const respond = safeSocketAcknowledgement(callback);
      try {
        const parsed = joinSchema.safeParse(data);
        if (!parsed.success) {
          respond({ success: false, error: "Invalid join request" });
          return;
        }
        const room = await roomManager.joinRoom(
          parsed.data.roomId,
          socket,
          user.userId,
          user.username,
          parsed.data.buyIn,
        );

        respond(
          room
            ? { success: true }
            : { success: false, error: "Cannot join room" },
        );
      } catch {
        respond({ success: false, error: "Failed to join room" });
      }
    });

    socket.on("room:join_by_code", async (data, callback) => {
      const respond = safeSocketAcknowledgement(callback);
      try {
        const parsed = joinCodeSchema.safeParse(data);
        if (!parsed.success) {
          respond({ success: false, error: "Invalid room code" });
          return;
        }
        const room = roomManager.getRoomByCode(parsed.data.code);
        if (!room) {
          respond({ success: false, error: "Room not found" });
          return;
        }
        const buyIn =
          parsed.data.buyIn ??
          Number(
            room.minBuyIn > 5000n
              ? room.minBuyIn
              : room.maxBuyIn < 5000n
                ? room.maxBuyIn
                : 5000n,
          );

        const joined = await roomManager.joinRoom(
          room.id,
          socket,
          user.userId,
          user.username,
          buyIn,
        );

        respond(
          joined
            ? { success: true }
            : { success: false, error: "Cannot join room" },
        );
      } catch {
        respond({ success: false, error: "Failed to join room" });
      }
    });

    socket.on("room:leave", async (callback) => {
      const respond = safeSocketAcknowledgement(callback);
      try {
        respond(await roomManager.leaveRoom(user.userId, socket));
      } catch {
        respond({
          success: false,
          error: "Could not leave safely. Please retry.",
        });
      }
    });
    socket.on("room:ready", async (data, callback) => {
      const respond = safeSocketAcknowledgement(callback);
      try {
        respond(
          await roomManager.setReady(
            user.userId,
            z.boolean().parse(data?.ready),
          ),
        );
      } catch (e) {
        respond({
          success: false,
          error: e instanceof Error ? e.message : "Could not ready the table",
        });
      }
    });

    // ─── Quick Play ──────────────────────────────────────────────────────

    socket.on("game:quick_play", async (callback) => {
      const respond = safeSocketAcknowledgement(callback);
      try {
        const account = await prisma.user.findUnique({
          where: { id: user.userId },
          select: { chips: true },
        });
        if (!account || account.chips < 5000n) {
          respond({
            success: false,
            error: "You need 5,000 chips for quick play",
          });
          return;
        }
        const room = await roomManager.quickPlay(
          socket,
          user.userId,
          user.username,
        );
        respond({ success: true, roomId: room.id });
      } catch (err) {
        respond({ success: false, error: "Failed to start quick play" });
      }
    });

    // ─── Game Events ─────────────────────────────────────────────────────

    socket.on("game:action", async (data, callback) => {
      const respond = safeSocketAcknowledgement(callback);
      const parsed = actionSchema.safeParse(data);
      if (!parsed.success) {
        respond({ success: false, error: "Invalid game action" });
        return;
      }
      try {
        respond(
          await roomManager.handleAction(
            user.userId,
            parsed.data.action,
            parsed.data.amount,
            parsed.data,
          ),
        );
      } catch (error) {
        respond({
          success: false,
          error: error instanceof Error ? error.message : "Action unavailable",
        });
      }
    });

    // ─── Chat Events ─────────────────────────────────────────────────────

    socket.on("chat:send", (data) => {
      const parsed = chatSchema.safeParse(data);
      if (
        !parsed.success ||
        !roomManager.isPlayerInRoom(parsed.data.roomId, user.userId)
      )
        return;

      io.to(parsed.data.roomId).emit("chat:message", {
        id: crypto.randomUUID(),
        roomId: parsed.data.roomId,
        userId: user.userId,
        username: user.username,
        message: parsed.data.message,
        type: parsed.data.type,
        createdAt: new Date().toISOString(),
      });
    });

    // ─── Social Events ───────────────────────────────────────────────────

    socket.on("gift:send", (data) => {
      const parsed = giftSchema.safeParse(data);
      if (
        !parsed.success ||
        !roomManager.isPlayerInRoom(parsed.data.roomId, user.userId) ||
        !roomManager.isPlayerInRoom(parsed.data.roomId, parsed.data.receiverId)
      )
        return;

      io.to(parsed.data.roomId).emit("gift:received", {
        senderId: user.userId,
        senderName: user.username,
        receiverId: parsed.data.receiverId,
        giftType: parsed.data.giftType,
      });
    });

    // ─── Disconnect ──────────────────────────────────────────────────────

    socket.on("disconnect", (reason) => {
      console.log(`[Socket] Disconnected: ${reason}`);
      void roomManager.handleDisconnect(socket.id).catch(console.error);

      prisma.user
        .update({
          where: { id: user.userId },
          data: { isOnline: false, lastSeen: new Date() },
        })
        .catch(console.error);
    });
  });

  return roomManager;
}
