import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { serializable } from "./transactions.js";
import { prisma } from "../config/database.js";
import { env } from "../config/env.js";
import type { Room } from "../game/roomManager.js";
import { qualifyReferralForGame } from "./referralService.js";

export const encode = (value: unknown): string =>
  JSON.stringify(value, (_key, v) =>
    typeof v === "bigint"
      ? { $bigint: v.toString() }
      : v instanceof Map
        ? { $map: [...v] }
        : v,
  );
export const decode = <T>(value: string): T =>
  JSON.parse(value, (_key, v) =>
    v && typeof v === "object" && "$bigint" in v
      ? BigInt(v.$bigint)
      : v && typeof v === "object" && "$map" in v
        ? new Map(v.$map)
        : v,
  );
export const cloneRoom = (room: Room): Room => decode(encode(room));
const key = () =>
  createHash("sha256").update(`room-snapshot:${env.jwtSecret}`).digest();
function encrypt(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  return Buffer.concat([
    iv,
    cipher.update(value, "utf8"),
    cipher.final(),
    cipher.getAuthTag(),
  ]).toString("base64");
}
function decrypt(value: string) {
  const data = Buffer.from(value, "base64");
  const cipher = createDecipheriv("aes-256-gcm", key(), data.subarray(0, 12));
  cipher.setAuthTag(data.subarray(-16));
  return Buffer.concat([
    cipher.update(data.subarray(12, -16)),
    cipher.final(),
  ]).toString("utf8");
}

export interface RoomStorage {
  load(): Promise<Room[]>;
  save(room: Room): Promise<void>;
  qualify(): Promise<void>;
}
export class PostgresRoomStorage implements RoomStorage {
  async load() {
    return (await prisma.runtimeRoom.findMany()).map((r) =>
      decode<Room>(decrypt(r.snapshot)),
    );
  }
  async save(room: Room) {
    await serializable(async (tx) => {
      const game = room.gameState;
      if (
        game?.status === "finished" &&
        !(await tx.handSettlement.findUnique({ where: { id: game.sessionId } }))
      ) {
        const humans = game.players.filter((p) => !p.isBot);
        await tx.handSettlement.create({
          data: {
            id: game.sessionId,
            roomId: room.id,
            result: encrypt(encode(game)),
            participants: humans.map((p) => p.odic),
          },
        });
        for (const player of humans) {
          const reservation = await tx.tableReservation.findUniqueOrThrow({
            where: { userId: player.odic },
          });
          if (reservation.roomId !== room.id)
            throw new Error("Reservation mismatch");
          const delta = player.chipsInPlay - player.chips;
          const user = await tx.user.findUniqueOrThrow({
            where: { id: player.odic },
          });
          const won = game.winners.includes(player.id);
          const streak = won ? user.currentStreak + 1 : 0;
          await tx.user.update({
            where: { id: player.odic },
            data: {
              totalGames: { increment: 1 },
              handsPlayed: { increment: 1 },
              gamesWon: { increment: won ? 1 : 0 },
              currentStreak: streak,
              bestStreak: Math.max(streak, user.bestStreak),
              biggestWin: delta > user.biggestWin ? delta : user.biggestWin,
              totalWinnings: { increment: delta > 0n ? delta : 0n },
              totalLosses: { increment: delta < 0n ? -delta : 0n },
            },
          });
          await tx.tableReservation.update({
            where: { userId: player.odic },
            data: { chips: player.chipsInPlay },
          });
          await tx.transaction.create({
            data: {
              userId: player.odic,
              type: won ? "GAME_WIN" : "GAME_LOSS",
              amount: delta,
              balanceBefore: reservation.chips,
              balanceAfter: player.chipsInPlay,
              referenceId: game.sessionId,
              metadata: { account: "table", roomId: room.id },
            },
          });
        }
      }
      const reservations = await tx.tableReservation.findMany({
        where: { roomId: room.id },
      });
      for (const seat of reservations) {
        if (!room.players.has(seat.userId)) {
          const before = await tx.user.findUniqueOrThrow({
            where: { id: seat.userId },
          });
          await tx.user.update({
            where: { id: seat.userId },
            data: { chips: { increment: seat.chips } },
          });
          await tx.tableReservation.delete({ where: { userId: seat.userId } });
          await tx.transaction.create({
            data: {
              userId: seat.userId,
              type: "CASH_OUT",
              amount: seat.chips,
              balanceBefore: before.chips,
              balanceAfter: before.chips + seat.chips,
              referenceId: `${room.id}:${room.revision}`,
            },
          });
        }
      }
      for (const seat of room.players.values()) {
        if (seat.isBot || reservations.some((r) => r.userId === seat.odic))
          continue;
        const before = await tx.user.findUniqueOrThrow({
          where: { id: seat.odic },
        });
        const claimed = await tx.user.updateMany({
          where: { id: seat.odic, isBanned: false, chips: { gte: seat.chips } },
          data: { chips: { decrement: seat.chips } },
        });
        if (claimed.count !== 1) throw new Error("Not enough available chips");
        await tx.tableReservation.create({
          data: { userId: seat.odic, roomId: room.id, chips: seat.chips },
        });
        await tx.transaction.create({
          data: {
            userId: seat.odic,
            type: "BUY_IN",
            amount: -seat.chips,
            balanceBefore: before.chips,
            balanceAfter: before.chips - seat.chips,
            referenceId: `${room.id}:${room.revision}`,
          },
        });
      }
      if (room.players.size)
        await tx.runtimeRoom.upsert({
          where: { id: room.id },
          create: { id: room.id, snapshot: encrypt(encode(room)) },
          update: { snapshot: encrypt(encode(room)) },
        });
      else await tx.runtimeRoom.deleteMany({ where: { id: room.id } });
    });
  }
  async qualify() {
    for (const hand of await prisma.handSettlement.findMany({
      where: { qualified: false },
      orderBy: { createdAt: "asc" },
      take: 50,
    })) {
      const ids = hand.participants as string[];
      for (const id of ids) await qualifyReferralForGame(id, hand.id, ids);
      await prisma.handSettlement.update({
        where: { id: hand.id },
        data: { qualified: true },
      });
    }
  }
}
