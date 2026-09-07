import type { Server, Socket } from "socket.io";
import { randomBytes, randomUUID } from "node:crypto";
import {
  initializeGame,
  processAction,
  processTimeout,
  removeFromHand,
  getPlayerView,
  getAvailableActions,
  type GameState,
  type ActionType,
} from "./gameEngine.js";
import {
  evaluateHand,
  makeAIDecision,
  type AIPersonality,
  type GameVariant,
} from "./handRanking.js";
import { SUPPORTED_VARIANTS } from "../../../packages/shared/src/rules/ranking.js";
import {
  PostgresRoomStorage,
  cloneRoom,
  type RoomStorage,
} from "../services/roomStorage.js";
import { env } from "../config/env.js";

export interface RoomPlayer {
  odic: string;
  username: string;
  socketId: string;
  chips: bigint;
  isReady: boolean;
  isBot: boolean;
  botPersonality?: AIPersonality;
  seatPosition: number;
  disconnectedAt?: number;
  leaving?: boolean;
}
export interface Room {
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
  players: Map<string, RoomPlayer>;
  gameState?: GameState;
  status: "waiting" | "playing";
  revision: number;
  updatedAt: number;
  commands: string[];
}
export interface RoomConfig {
  name: string;
  variant: string;
  bootAmount: number;
  minBuyIn: number;
  maxBuyIn: number;
  maxPlayers: number;
  isPrivate: boolean;
  createdBy: string;
}
export interface ActionCommand {
  sessionId: string;
  expectedVersion: number;
  commandId: string;
}

/** One durable command at a time. In-memory state changes only after the DB commits. */
export class RoomManager {
  private rooms = new Map<string, Room>();
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  private tail: Promise<unknown> = Promise.resolve();
  private maintenance?: ReturnType<typeof setInterval>;
  private closed = false;
  private ready = false;
  readonly metrics = {
    commands: 0,
    failedCommands: 0,
    timeouts: 0,
    settledHands: 0,
    reconnects: 0,
    lastStorageErrorAt: 0,
  };
  constructor(
    private io: Server,
    private storage: RoomStorage = new PostgresRoomStorage(),
  ) {}
  async initialize() {
    for (const room of await this.storage.load()) {
      for (const p of room.players.values())
        if (!p.isBot) {
          p.socketId = "";
          p.disconnectedAt = Date.now();
          p.isReady = false;
        }
      this.rooms.set(room.id, room);
      this.schedule(room);
    }
    this.ready = true;
    this.maintenance = setInterval(() => {
      void this.run(async () => {
        for (const room of [...this.rooms.values()]) {
          for (const p of [...room.players.values()])
            if (
              !p.isBot &&
              !p.leaving &&
              p.disconnectedAt &&
              Date.now() - p.disconnectedAt > 60_000
            )
              await this.leaveInternal(p.odic);
        }
        await this.storage.qualify();
      }).catch(() => {});
    }, 5000);
    this.maintenance.unref();
  }
  get isReady() {
    return this.ready && !this.closed;
  }
  get stats() {
    return {
      ...this.metrics,
      rooms: this.rooms.size,
      playing: [...this.rooms.values()].filter((r) => r.status === "playing")
        .length,
    };
  }
  private run<T>(work: () => Promise<T>): Promise<T> {
    const result = this.tail.then(async () => {
      if (this.closed) throw new Error("Server is draining");
      return work();
    });
    this.tail = result.catch((error) => {
      this.metrics.failedCommands++;
      console.error("[Room command]", error);
    });
    return result;
  }
  private roomFor(userId: string) {
    return [...this.rooms.values()].find((r) => r.players.has(userId));
  }
  private async commit(next: Room) {
    next.revision++;
    next.updatedAt = Date.now();
    try {
      await this.storage.save(next);
    } catch (e) {
      this.metrics.lastStorageErrorAt = Date.now();
      throw e;
    }
    const previous = this.rooms.get(next.id);
    if (next.players.size) this.rooms.set(next.id, next);
    else this.rooms.delete(next.id);
    this.metrics.commands++;
    this.broadcast(next);
    if (
      next.gameState?.status === "finished" &&
      previous?.gameState?.status !== "finished"
    ) {
      this.metrics.settledHands++;
      console.log(
        JSON.stringify({
          type: "hand_settled",
          roomId: next.id,
          sessionId: next.gameState.sessionId,
          players: next.gameState.players.length,
          humans: next.gameState.players.filter((p) => !p.isBot).length,
          durationMs:
            (next.gameState.endedAt ?? Date.now()) - next.gameState.startedAt,
        }),
      );
      const game = next.gameState;
      this.io.to(next.id).emit("game:ended", {
        sessionId: game.sessionId,
        pot: game.pot.toString(),
        winners: game.winners.map((id) => {
          const p = game.players.find((p) => p.id === id)!;
          return {
            id,
            username: p.username,
            amount: (p.chipsInPlay - p.chips + p.currentBet).toString(),
            handResult: p.handResult,
          };
        }),
      });
    }
    for (const p of previous?.players.values() ?? [])
      if (!p.isBot && !next.players.has(p.odic)) {
        const socket = this.io.sockets.sockets.get(p.socketId);
        socket?.emit("room:left");
        void socket?.leave(next.id);
      }
    this.schedule(next);
  }
  private newRoom(config: RoomConfig): Room {
    if (!SUPPORTED_VARIANTS.includes(config.variant))
      throw new Error("Variant unavailable");
    if (
      !Number.isSafeInteger(config.bootAmount) ||
      config.bootAmount < 1 ||
      config.minBuyIn <= config.bootAmount ||
      config.maxBuyIn < config.minBuyIn ||
      config.maxPlayers < 2 ||
      config.maxPlayers > 9
    )
      throw new Error("Invalid table settings");
    if (this.rooms.size >= 1000)
      throw new Error("All tables are busy. Try again shortly.");
    let code: string;
    do {
      code = randomBytes(4).toString("hex").slice(0, 6).toUpperCase();
    } while (this.getRoomByCode(code));
    return {
      id: randomUUID(),
      ...config,
      roomCode: config.isPrivate ? code : undefined,
      bootAmount: BigInt(config.bootAmount),
      minBuyIn: BigInt(config.minBuyIn),
      maxBuyIn: BigInt(config.maxBuyIn),
      players: new Map(),
      status: "waiting",
      revision: 0,
      updatedAt: Date.now(),
      commands: [],
    };
  }
  private addPlayer(
    room: Room,
    socket: Socket,
    userId: string,
    username: string,
    buyIn: number,
  ) {
    if (this.roomFor(userId))
      throw new Error("Leave your current table before joining another");
    if (
      !Number.isSafeInteger(buyIn) ||
      BigInt(buyIn) < room.minBuyIn ||
      BigInt(buyIn) > room.maxBuyIn ||
      room.players.size >= room.maxPlayers
    )
      throw new Error("Table is full or buy-in is outside its range");
    const taken = new Set(
      [...room.players.values()].map((p) => p.seatPosition),
    );
    let seat = 0;
    while (taken.has(seat)) seat++;
    room.players.set(userId, {
      odic: userId,
      username,
      socketId: socket.id,
      chips: BigInt(buyIn),
      isReady: false,
      isBot: false,
      seatPosition: seat,
    });
  }
  createAndJoin(config: RoomConfig, socket: Socket, buyIn: number) {
    return this.run(async () => {
      const room = this.newRoom(config);
      this.addPlayer(
        room,
        socket,
        config.createdBy,
        socket.data.user.username,
        buyIn,
      );
      await this.commit(room);
      await socket.join(room.id);
      this.broadcast(room);
      return room;
    });
  }
  joinRoom(
    roomId: string,
    socket: Socket,
    userId: string,
    username: string,
    buyIn: number,
  ) {
    return this.run(async () => {
      const existing = this.roomFor(userId);
      if (existing?.id === roomId && !existing.players.get(userId)?.leaving) {
        await this.reconnectInternal(userId, socket);
        return existing;
      }
      const found = this.rooms.get(roomId);
      if (!found) throw new Error("Table not found");
      const next = cloneRoom(found);
      this.addPlayer(next, socket, userId, username, buyIn);
      await this.commit(next);
      await socket.join(roomId);
      this.broadcast(next);
      return next;
    });
  }
  setReady(userId: string, ready: boolean) {
    return this.run(async () => {
      const room = this.roomFor(userId);
      if (!room) throw new Error("Not in a room");
      const next = cloneRoom(room);
      const player = next.players.get(userId)!;
      if (player.leaving || player.chips <= next.bootAmount)
        throw new Error("Leave the table and bring a new stack to play again");
      player.isReady = ready;
      for (const bot of next.players.values())
        if (bot.isBot && bot.chips <= next.bootAmount) {
          bot.chips = 5000n;
          bot.isReady = true;
        }
      if (next.status === "waiting") this.maybeStart(next);
      await this.commit(next);
      return { success: true };
    });
  }
  private maybeStart(room: Room) {
    const players = [...room.players.values()].filter((p) => !p.leaving);
    if (
      players.length < 2 ||
      players.some(
        (p) =>
          !p.isReady ||
          p.chips <= room.bootAmount ||
          (!p.isBot && p.disconnectedAt),
      )
    )
      return;
    room.gameState = initializeGame(
      {
        roomId: room.id,
        variant: room.variant as GameVariant,
        bootAmount: room.bootAmount,
        minBet: room.bootAmount,
        turnTimeoutMs: env.turnTimeoutSeconds * 1000,
      },
      players.map((p) => ({
        userId: p.odic,
        username: p.username,
        chips: p.chips,
        isBot: p.isBot,
        botPersonality: p.botPersonality,
      })),
    );
    room.status = "playing";
    room.commands = [];
    for (const p of room.players.values()) p.isReady = false;
  }
  quickPlay(socket: Socket, userId: string, username: string) {
    return this.run(async () => {
      const room = this.newRoom({
        name: "AI practice",
        variant: "CLASSIC",
        bootAmount: 50,
        minBuyIn: 500,
        maxBuyIn: 5000,
        maxPlayers: 4,
        isPrivate: false,
        createdBy: userId,
      });
      this.addPlayer(room, socket, userId, username, 5000);
      room.players.get(userId)!.isReady = true;
      ["Sharma Ji", "Priya", "Bunty"].forEach((name, i) =>
        room.players.set(`${room.id}:bot:${i}`, {
          odic: `${room.id}:bot:${i}`,
          username: name,
          socketId: "",
          chips: 5000n,
          isReady: true,
          isBot: true,
          botPersonality: "balanced",
          seatPosition: i + 1,
        }),
      );
      this.maybeStart(room);
      await this.commit(room);
      await socket.join(room.id);
      this.broadcast(room);
      return room;
    });
  }
  handleAction(
    userId: string,
    action: ActionType,
    amount?: number,
    command?: ActionCommand,
  ) {
    return this.run(async () => {
      const room = this.roomFor(userId);
      if (!room?.gameState) throw new Error("No active hand");
      if (!command) throw new Error("Update the app to continue");
      if (room.commands.includes(`${userId}:${command.commandId}`))
        return { success: true };
      if (
        command.sessionId !== room.gameState.sessionId ||
        command.expectedVersion !== room.gameState.version
      ) {
        this.broadcast(room);
        throw new Error("The table changed. Review your turn and try again.");
      }
      const actor = room.gameState.players.find((p) => p.odic === userId);
      if (!actor || room.players.get(userId)?.leaving)
        throw new Error("Wait for the next hand");
      const next = cloneRoom(room);
      next.gameState = processAction(
        next.gameState!,
        actor.id,
        action,
        amount === undefined ? undefined : BigInt(amount),
      );
      next.commands = [
        ...next.commands,
        `${userId}:${command.commandId}`,
      ].slice(-256);
      this.finish(next);
      await this.commit(next);
      return { success: true };
    });
  }
  private finish(room: Room) {
    if (room.gameState?.status !== "finished") return;
    for (const gamePlayer of room.gameState.players) {
      const p = room.players.get(gamePlayer.odic);
      if (p) {
        p.chips = gamePlayer.chipsInPlay;
        p.isReady = p.isBot;
      }
    }
    room.status = "waiting";
    for (const p of room.players.values())
      if (p.leaving) room.players.delete(p.odic);
    if (![...room.players.values()].some((p) => !p.isBot)) room.players.clear();
  }
  leaveRoom(userId: string, _socket?: Socket) {
    return this.run(() => this.leaveInternal(userId));
  }
  private async leaveInternal(userId: string) {
    const room = this.roomFor(userId);
    if (!room) return { success: true };
    const next = cloneRoom(room);
    const p = next.players.get(userId)!;
    const actor = next.gameState?.players.find((p) => p.odic === userId);
    if (next.status === "playing" && actor) {
      p.leaving = true;
      p.isReady = false;
      next.gameState = removeFromHand(next.gameState!, actor.id);
      this.finish(next);
    } else next.players.delete(userId);
    if (
      next.status === "waiting" &&
      ![...next.players.values()].some((p) => !p.isBot)
    )
      next.players.clear();
    await this.commit(next);
    return { success: true, pending: next.players.has(userId) };
  }
  handleReconnect(userId: string, socket: Socket) {
    return this.run(() => this.reconnectInternal(userId, socket));
  }
  private async reconnectInternal(userId: string, socket: Socket) {
    const room = this.roomFor(userId);
    if (!room) return false;
    const next = cloneRoom(room);
    const p = next.players.get(userId)!;
    const old = this.io.sockets.sockets.get(p.socketId);
    p.socketId = socket.id;
    p.disconnectedAt = undefined;
    await this.commit(next);
    await socket.join(room.id);
    if (old && old.id !== socket.id) {
      old.emit("session:replaced");
      old.disconnect(true);
    }
    this.metrics.reconnects++;
    this.broadcast(next);
    return true;
  }
  handleDisconnect(socketId: string) {
    if (this.closed) return Promise.resolve();
    return this.run(async () => {
      const room = [...this.rooms.values()].find((r) =>
        [...r.players.values()].some((p) => p.socketId === socketId),
      );
      if (!room) return;
      const next = cloneRoom(room);
      const p = [...next.players.values()].find(
        (p) => p.socketId === socketId,
      )!;
      p.disconnectedAt = Date.now();
      p.isReady = false;
      await this.commit(next);
    });
  }
  private schedule(room: Room) {
    const old = this.timers.get(room.id);
    if (old) clearTimeout(old);
    this.timers.delete(room.id);
    if (room.status !== "playing" || !room.gameState) return;
    const game = room.gameState;
    const actor =
      game.players.find((p) => p.id === game.sideshowPending?.targetId) ??
      game.players[game.currentPlayerIndex];
    const delay = actor.isBot
      ? 600
      : Math.max(0, game.turnStartedAt + game.turnTimeoutMs - Date.now());
    const timer = setTimeout(() => {
      void this.run(async () => {
        const current = this.rooms.get(room.id);
        if (
          !current?.gameState ||
          current.gameState.sessionId !== game.sessionId ||
          current.gameState.version !== game.version
        )
          return;
        const next = cloneRoom(current);
        if (actor.isBot) {
          if (game.sideshowPending)
            next.gameState = processAction(
              next.gameState!,
              actor.id,
              "sideshow_accept",
            );
          else if (actor.isBlind)
            next.gameState = processAction(
              next.gameState!,
              actor.id,
              "see_cards",
            );
          else {
            const available = getAvailableActions(game, actor.id);
            const decision = makeAIDecision({
              handStrength: evaluateHand(actor.cards, game.variant).strength,
              personality: "balanced",
              potOdds: Number(game.currentBet) / Number(game.pot),
              playersRemaining: game.players.filter(
                (p) => p.status === "playing",
              ).length,
              isBlind: false,
              roundNumber: game.roundNumber,
            });
            next.gameState = processAction(
              next.gameState!,
              actor.id,
              available.includes(decision.action)
                ? decision.action
                : available.includes("chaal")
                  ? "chaal"
                  : "pack",
            );
          }
        } else {
          next.gameState = processTimeout(next.gameState!);
          this.metrics.timeouts++;
        }
        this.finish(next);
        await this.commit(next);
      }).catch(() => {
        const current = this.rooms.get(room.id);
        if (current) {
          const retry = setTimeout(() => this.schedule(current), 1000);
          retry.unref();
          this.timers.set(room.id, retry);
        }
      });
    }, delay);
    timer.unref();
    this.timers.set(room.id, timer);
  }
  private broadcast(room: Room) {
    this.io.to(room.id).emit("room:state", this.roomView(room));
    if (!room.gameState) return;
    for (const p of room.players.values())
      if (!p.isBot) {
        const actor = room.gameState.players.find((a) => a.odic === p.odic);
        if (actor)
          this.io.sockets.sockets
            .get(p.socketId)
            ?.emit("game:state", getPlayerView(room.gameState, actor.id));
      }
  }
  private roomView(room: Room) {
    return {
      ...room,
      bootAmount: room.bootAmount.toString(),
      minBuyIn: room.minBuyIn.toString(),
      maxBuyIn: room.maxBuyIn.toString(),
      gameState: undefined,
      commands: undefined,
      currentPlayers: room.players.size,
      players: [...room.players.values()].map((p) => ({
        odic: p.odic,
        username: p.username,
        chips: p.chips.toString(),
        isReady: p.isReady,
        isBot: p.isBot,
        seatPosition: p.seatPosition,
        connected: !p.disconnectedAt,
        leaving: !!p.leaving,
      })),
    };
  }
  getRoomByCode(code: string) {
    return [...this.rooms.values()].find((r) => r.roomCode === code);
  }
  isPlayerInRoom(roomId: string, userId: string) {
    return this.rooms.get(roomId)?.players.has(userId) ?? false;
  }
  getPublicRooms() {
    return [...this.rooms.values()]
      .filter(
        (r) => !r.isPrivate && ![...r.players.values()].some((p) => p.isBot),
      )
      .map((r) => this.roomView(r));
  }
  async close() {
    this.ready = false;
    if (this.maintenance) clearInterval(this.maintenance);
    for (const timer of this.timers.values()) clearTimeout(timer);
    await this.tail;
    this.closed = true;
  }
}
