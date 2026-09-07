import { Prisma } from "@prisma/client";
import { serializable } from "./transactions.js";
export class AlreadyClaimed extends Error {}
export async function claimDailyReward(userId: string, now = new Date()) {
  const rewardDay = new Date(now.toISOString().slice(0, 10) + "T00:00:00Z");
  const nextClaimAt = new Date(rewardDay.getTime() + 86400000).toISOString();
  try {
    return await serializable(async (tx) => {
      const last = await tx.dailyReward.findFirst({
        where: { userId },
        orderBy: { claimedAt: "desc" },
      });
      if (
        last &&
        last.claimedAt.toISOString().slice(0, 10) ===
          now.toISOString().slice(0, 10)
      )
        throw new AlreadyClaimed("Already claimed today");
      const yesterday = new Date(rewardDay.getTime() - 86400000)
        .toISOString()
        .slice(0, 10);
      const streak =
        last?.claimedAt.toISOString().slice(0, 10) === yesterday
          ? last.streak + 1
          : 1;
      const day = ((streak - 1) % 7) + 1;
      const baseRewards = [500, 750, 1000, 1500, 2000, 3000, 5000];
      const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
      const multiplier = {
        BRONZE: 1,
        SILVER: 1.25,
        GOLD: 1.5,
        PLATINUM: 2,
        DIAMOND: 3,
      }[user.vipTier];
      const baseAmount = baseRewards[day - 1];
      const amount = Math.floor(baseAmount * multiplier);
      const bonusAmount = amount - baseAmount;
      const reward = await tx.dailyReward.create({
        data: {
          userId,
          rewardDay,
          claimedAt: now,
          day,
          streak,
          amount: BigInt(baseAmount),
          bonusAmount: BigInt(bonusAmount),
        },
      });
      const updated = await tx.user.update({
        where: { id: userId },
        data: { chips: { increment: BigInt(amount) } },
      });
      await tx.transaction.create({
        data: {
          userId,
          type: "DAILY_REWARD",
          amount: BigInt(amount),
          balanceBefore: user.chips,
          balanceAfter: updated.chips,
          referenceId: reward.id,
          description: `Day ${day} reward (${streak} day streak)`,
        },
      });
      return {
        day,
        streak,
        amount,
        baseAmount,
        bonusAmount,
        nextClaimAt,
        weekRewards: baseRewards.map((r, i) => ({
          day: i + 1,
          amount: Math.floor(r * multiplier),
          claimed: i + 1 <= day,
        })),
      };
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
      throw new AlreadyClaimed("Already claimed today");
    throw e;
  }
}
