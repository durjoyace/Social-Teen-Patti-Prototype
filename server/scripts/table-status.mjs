import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
try {
  const [rooms, reservations, pending, settled] = await Promise.all([
    db.runtimeRoom.findMany({ select: { id: true, updatedAt: true } }),
    db.tableReservation.groupBy({
      by: ["roomId"],
      _count: { userId: true },
      _sum: { chips: true },
    }),
    db.handSettlement.count({ where: { qualified: false } }),
    db.handSettlement.count(),
  ]);
  console.log(
    JSON.stringify(
      {
        capturedAt: new Date(),
        rooms: rooms.map((r) => ({
          ...r,
          ...reservations.find((s) => s.roomId === r.id),
        })),
        referralJobsPending: pending,
        settledHands: settled,
      },
      (_k, v) => (typeof v === "bigint" ? v.toString() : v),
      2,
    ),
  );
} finally {
  await db.$disconnect();
}
