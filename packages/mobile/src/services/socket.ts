import { refreshAuth, getAuthToken } from "./api";
import {
  requestAck,
  commandId,
  type GameView,
} from "../../../shared/src/rules/protocol.js";
import { io, Socket } from "socket.io-client";
import Constants from "expo-constants";

const SOCKET_URL =
  process.env.EXPO_PUBLIC_SOCKET_URL ||
  Constants.expoConfig?.extra?.socketUrl ||
  "http://localhost:3001";

let socket: Socket | null = null;
let game: GameView | null = null;

export function connectSocket(token: string): Socket {
  if (socket?.connected) return socket;

  socket?.removeAllListeners();
  socket?.disconnect();
  socket = io(SOCKET_URL, {
    auth: (callback) => {
      void refreshAuth()
        .then(() => callback({ token: getAuthToken() }))
        .catch(() => callback({ token: getAuthToken() }));
    },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on("game:state", (state: GameView) => {
    game = state;
  });
  socket.on("room:left", () => {
    game = null;
  });
  socket.on("session:replaced", () => socket?.disconnect());
  socket.on("session:expired", () => socket?.disconnect());
  socket.on("connect", () => console.log("[Socket] Connected"));
  socket.on("disconnect", (reason) =>
    console.log("[Socket] Disconnected:", reason),
  );
  socket.on("connect_error", (err) =>
    console.error("[Socket] Error:", err.message),
  );

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

async function connectedSocket(): Promise<Socket> {
  if (!socket) throw new Error("Not connected");
  if (socket.connected) return socket;
  const pending = socket;
  return new Promise((resolve, reject) => {
    const clean = () => {
      clearTimeout(timer);
      pending.off("connect", connected);
      pending.off("connect_error", failed);
    };
    const connected = () => {
      clean();
      resolve(pending);
    };
    const failed = (error: Error) => {
      clean();
      reject(error);
    };
    const timer = setTimeout(
      () => failed(new Error("Connection timed out")),
      10_000,
    );
    pending.once("connect", connected);
    pending.once("connect_error", failed);
  });
}

async function emitWithAck<T>(event: string, data?: unknown): Promise<T> {
  const activeSocket = await connectedSocket();
  return requestAck<T>(activeSocket, event, data);
}

export const gameSocket = {
  reaction: (roomId: string, message: string) => {
    if (!socket?.connected) throw new Error("Connection unavailable");
    socket.emit("chat:send", { roomId, message, type: "emoji" });
  },
  listRooms: () => emitWithAck<{ rooms: any[] }>("room:list"),
  createPrivateRoom: () =>
    emitWithAck<{
      success: boolean;
      room?: { id: string; roomCode?: string };
      error?: string;
    }>("room:create", {
      name: "Friends Game",
      variant: "CLASSIC",
      bootAmount: 50,
      minBuyIn: 500,
      maxBuyIn: 5000,
      maxPlayers: 6,
      isPrivate: true,
      buyIn: 5000,
    }),
  joinByCode: (code: string, buyIn?: number) =>
    emitWithAck<{ success: boolean; error?: string }>("room:join_by_code", {
      code,
      ...(buyIn ? { buyIn } : {}),
    }),
  joinRoom: (roomId: string, buyIn = 5000) =>
    emitWithAck<{ success: boolean; error?: string }>("room:join", {
      roomId,
      buyIn,
    }),
  quickPlay: () =>
    emitWithAck<{ success: boolean; error?: string }>("game:quick_play"),
  action: (action: string, amount?: number) =>
    game
      ? emitWithAck<{ success: boolean; error?: string }>("game:action", {
          action,
          amount,
          sessionId: game.sessionId,
          expectedVersion: game.version,
          commandId: commandId(),
        })
      : Promise.reject(new Error("Wait for table state")),
  ready: (ready = true) =>
    emitWithAck<{ success: boolean; error?: string }>("room:ready", { ready }),
  leave: () =>
    emitWithAck<{ success: boolean; pending?: boolean; error?: string }>(
      "room:leave",
    ),
};

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
  game = null;
}
