import { claimDailyReward, AlreadyClaimed } from "../services/dailyReward.js";
import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/database.js";
import { authMiddleware } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import {
  AccountDeletionError,
  deleteAccount,
} from "../services/accountDeletion.js";

export const usersRouter: Router = Router();
usersRouter.use(authMiddleware);

const deleteAccountSchema = z.object({
  confirmation: z.literal("DELETE"),
  password: z.string().max(128).optional(),
});

usersRouter.delete(
  "/account",
  rateLimit({ windowMs: 15 * 60_000, max: 5, name: "account-deletion" }),
  async (req: Request, res: Response) => {
    try {
      const input = deleteAccountSchema.parse(req.body);
      const userId = req.user!.userId;
      await deleteAccount(userId, input.password);

      const io = req.app.get("io") as
        | { in(room: string): { disconnectSockets(close?: boolean): void } }
        | undefined;
      io?.in(`user:${userId}`).disconnectSockets(true);
      res.json({ deleted: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ error: "Type DELETE to confirm account deletion" });
        return;
      }
      if (error instanceof AccountDeletionError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      console.error("Account deletion error:", error);
      res.status(500).json({ error: "Could not delete account" });
    }
  },
);

// ─── Update Profile ────────────────────────────────────────────────────────

const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/)
    .optional(),
  avatarUrl: z.string().url().optional(),
});

usersRouter.patch("/profile", async (req: Request, res: Response) => {
  try {
    const data = updateProfileSchema.parse(req.body);

    if (data.username) {
      const existing = await prisma.user.findUnique({
        where: { username: data.username },
      });
      if (existing && existing.id !== req.user!.userId) {
        res.status(409).json({ error: "Username taken" });
        return;
      }
    }

    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data,
    });

    res.json({ user: serializeUser(user) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid input", details: error.errors });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Get User Stats ────────────────────────────────────────────────────────

usersRouter.get("/stats", async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: {
      totalGames: true,
      gamesWon: true,
      biggestWin: true,
      totalWinnings: true,
      totalLosses: true,
      currentStreak: true,
      bestStreak: true,
      handsPlayed: true,
      level: true,
      experience: true,
      vipTier: true,
      vipPoints: true,
    },
  });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    stats: {
      ...user,
      biggestWin: user.biggestWin.toString(),
      totalWinnings: user.totalWinnings.toString(),
      totalLosses: user.totalLosses.toString(),
      winRate:
        user.totalGames > 0
          ? ((user.gamesWon / user.totalGames) * 100).toFixed(1)
          : "0.0",
    },
  });
});

// ─── Transaction History ───────────────────────────────────────────────────

usersRouter.get("/transactions", async (req: Request, res: Response) => {
  const parsed = z
    .object({
      page: z.coerce.number().int().min(1).max(100000).default(1),
      limit: z.coerce.number().int().min(1).max(50).default(20),
    })
    .safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid pagination" });
    return;
  }
  const { page, limit } = parsed.data;
  const offset = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.transaction.count({ where: { userId: req.user!.userId } }),
  ]);

  res.json({
    transactions: transactions.map((t) => ({
      ...t,
      amount: t.amount.toString(),
      balanceBefore: t.balanceBefore.toString(),
      balanceAfter: t.balanceAfter.toString(),
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// ─── Leaderboard ───────────────────────────────────────────────────────────

usersRouter.get("/leaderboard", async (req: Request, res: Response) => {
  const parsed = z
    .object({
      period: z.literal("ALL_TIME").default("ALL_TIME"),
      limit: z.coerce.number().int().min(1).max(100).default(50),
    })
    .safeParse(req.query);
  if (!parsed.success) {
    res
      .status(400)
      .json({
        error: "Only ALL_TIME standings and a limit of 1–100 are supported",
      });
    return;
  }
  const { period, limit } = parsed.data;

  // For now, use direct user query. In production, use materialized LeaderboardEntry
  const users = await prisma.user.findMany({
    where: { isBanned: false, isGuest: false },
    orderBy: { totalWinnings: "desc" },
    take: limit,
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      level: true,
      totalWinnings: true,
      totalGames: true,
      gamesWon: true,
      vipTier: true,
    },
  });

  res.json({
    leaderboard: users.map((u, i) => ({
      rank: i + 1,
      userId: u.id,
      username: u.username,
      avatarUrl: u.avatarUrl,
      level: u.level,
      totalWinnings: u.totalWinnings.toString(),
      totalGames: u.totalGames,
      gamesWon: u.gamesWon,
      vipTier: u.vipTier,
    })),
    period,
  });
});

// ─── Friends ───────────────────────────────────────────────────────────────

usersRouter.get("/friends", async (req: Request, res: Response) => {
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [
        { requesterId: req.user!.userId, status: "ACCEPTED" },
        { receiverId: req.user!.userId, status: "ACCEPTED" },
      ],
    },
    include: {
      requester: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          isOnline: true,
          level: true,
          chips: true,
        },
      },
      receiver: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          isOnline: true,
          level: true,
          chips: true,
        },
      },
    },
  });

  const friends = friendships.map((f) => {
    const friend =
      f.requesterId === req.user!.userId ? f.receiver : f.requester;
    return {
      friendshipId: f.id,
      ...friend,
      chips: friend.chips.toString(),
    };
  });

  res.json({ friends });
});

usersRouter.post("/friends/request", async (req: Request, res: Response) => {
  const { userId } = req.body;
  if (!userId || userId === req.user!.userId) {
    res.status(400).json({ error: "Invalid user" });
    return;
  }

  // Check if friendship already exists
  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: req.user!.userId, receiverId: userId },
        { requesterId: userId, receiverId: req.user!.userId },
      ],
    },
  });

  if (existing) {
    res.status(409).json({
      error: "Friend request already exists",
      status: existing.status,
    });
    return;
  }

  const friendship = await prisma.friendship.create({
    data: {
      requesterId: req.user!.userId,
      receiverId: userId,
    },
  });

  // Create notification for receiver
  await prisma.notification.create({
    data: {
      userId,
      type: "FRIEND_REQUEST",
      title: "New Friend Request",
      body: `${req.user!.username} wants to be your friend`,
      data: { friendshipId: friendship.id },
    },
  });

  res.status(201).json({ friendship });
});

usersRouter.patch(
  "/friends/:friendshipId",
  async (req: Request, res: Response) => {
    const parsed = z
      .object({ action: z.enum(["accept", "reject", "block"]) })
      .safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid friend action" });
      return;
    }
    const { action } = parsed.data;

    const friendship = await prisma.friendship.findUnique({
      where: { id: String(req.params.friendshipId) },
    });

    if (!friendship || friendship.receiverId !== req.user!.userId) {
      res.status(404).json({ error: "Friend request not found" });
      return;
    }

    const statusMap: Record<string, "ACCEPTED" | "BLOCKED"> = {
      accept: "ACCEPTED",
      block: "BLOCKED",
    };

    if (action === "reject") {
      await prisma.friendship.delete({ where: { id: friendship.id } });
      res.json({ message: "Request rejected" });
      return;
    }

    const updated = await prisma.friendship.update({
      where: { id: friendship.id },
      data: { status: statusMap[action] },
    });

    if (action === "accept") {
      await prisma.notification.create({
        data: {
          userId: friendship.requesterId,
          type: "FRIEND_ACCEPTED",
          title: "Friend Request Accepted",
          body: `${req.user!.username} accepted your friend request`,
        },
      });
    }

    res.json({ friendship: updated });
  },
);

// ─── Search Users ──────────────────────────────────────────────────────────

usersRouter.get("/search", async (req: Request, res: Response) => {
  const query = String(req.query.q || "");
  if (!query || query.length < 2) {
    res
      .status(400)
      .json({ error: "Search query must be at least 2 characters" });
    return;
  }

  const users = await prisma.user.findMany({
    where: {
      username: { contains: query, mode: "insensitive" },
      id: { not: req.user!.userId },
      isBanned: false,
    },
    take: 20,
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      level: true,
      isOnline: true,
    },
  });

  res.json({ users });
});

// ─── Daily Reward ──────────────────────────────────────────────────────────

usersRouter.post("/daily-reward", async (req: Request, res: Response) => {
  try {
    res.json({ reward: await claimDailyReward(req.user!.userId) });
  } catch (error) {
    if (error instanceof AlreadyClaimed) {
      res.status(409).json({ error: error.message });
      return;
    }
    throw error;
  }
});

// ─── Notifications ─────────────────────────────────────────────────────────

usersRouter.get("/notifications", async (req: Request, res: Response) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  res.json({ notifications });
});

usersRouter.post(
  "/notifications/read-all",
  async (req: Request, res: Response) => {
    await prisma.notification.updateMany({
      where: { userId: req.user!.userId, isRead: false },
      data: { isRead: true },
    });

    res.json({ message: "All notifications marked as read" });
  },
);

// ─── Helpers ───────────────────────────────────────────────────────────────

function getNextMidnight(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.toISOString();
}

function serializeUser(user: any) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl,
    chips: user.chips.toString(),
    beliBalance: user.beliBalance,
    referralCode: user.referralCode,
    level: user.level,
    vipTier: user.vipTier,
  };
}
