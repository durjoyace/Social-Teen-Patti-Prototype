import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { AccountDeletionError, deleteAccount } from '../services/accountDeletion.js';

export const usersRouter: Router = Router();
usersRouter.use(authMiddleware);

const deleteAccountSchema = z.object({
  confirmation: z.literal('DELETE'),
  password: z.string().max(128).optional(),
});

usersRouter.delete(
  '/account',
  rateLimit({ windowMs: 15 * 60_000, max: 5, name: 'account-deletion' }),
  async (req: Request, res: Response) => {
    try {
      const input = deleteAccountSchema.parse(req.body);
      const userId = req.user!.userId;
      await deleteAccount(userId, input.password);

      const io = req.app.get('io') as { in(room: string): { disconnectSockets(close?: boolean): void } } | undefined;
      io?.in(`user:${userId}`).disconnectSockets(true);
      res.json({ deleted: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Type DELETE to confirm account deletion' });
        return;
      }
      if (error instanceof AccountDeletionError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      console.error('Account deletion error:', error);
      res.status(500).json({ error: 'Could not delete account' });
    }
  },
);

// ─── Update Profile ────────────────────────────────────────────────────────

const updateProfileSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/).optional(),
  avatarUrl: z.string().url().optional(),
});

usersRouter.patch('/profile', async (req: Request, res: Response) => {
  try {
    const data = updateProfileSchema.parse(req.body);

    if (data.username) {
      const existing = await prisma.user.findUnique({ where: { username: data.username } });
      if (existing && existing.id !== req.user!.userId) {
        res.status(409).json({ error: 'Username taken' });
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
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Get User Stats ────────────────────────────────────────────────────────

usersRouter.get('/stats', async (req: Request, res: Response) => {
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
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({
    stats: {
      ...user,
      biggestWin: user.biggestWin.toString(),
      totalWinnings: user.totalWinnings.toString(),
      totalLosses: user.totalLosses.toString(),
      winRate: user.totalGames > 0 ? (user.gamesWon / user.totalGames * 100).toFixed(1) : '0.0',
    },
  });
});

// ─── Transaction History ───────────────────────────────────────────────────

usersRouter.get('/transactions', async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
  const offset = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.transaction.count({ where: { userId: req.user!.userId } }),
  ]);

  res.json({
    transactions: transactions.map(t => ({
      ...t,
      amount: t.amount.toString(),
      balanceBefore: t.balanceBefore.toString(),
      balanceAfter: t.balanceAfter.toString(),
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// ─── Leaderboard ───────────────────────────────────────────────────────────

usersRouter.get('/leaderboard', async (req: Request, res: Response) => {
  const period = (req.query.period as string) || 'ALL_TIME';
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

  // For now, use direct user query. In production, use materialized LeaderboardEntry
  const users = await prisma.user.findMany({
    where: { isBanned: false, isGuest: false },
    orderBy: { totalWinnings: 'desc' },
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

usersRouter.get('/friends', async (req: Request, res: Response) => {
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [
        { requesterId: req.user!.userId, status: 'ACCEPTED' },
        { receiverId: req.user!.userId, status: 'ACCEPTED' },
      ],
    },
    include: {
      requester: { select: { id: true, username: true, avatarUrl: true, isOnline: true, level: true, chips: true } },
      receiver: { select: { id: true, username: true, avatarUrl: true, isOnline: true, level: true, chips: true } },
    },
  });

  const friends = friendships.map(f => {
    const friend = f.requesterId === req.user!.userId ? f.receiver : f.requester;
    return {
      friendshipId: f.id,
      ...friend,
      chips: friend.chips.toString(),
    };
  });

  res.json({ friends });
});

usersRouter.post('/friends/request', async (req: Request, res: Response) => {
  const { userId } = req.body;
  if (!userId || userId === req.user!.userId) {
    res.status(400).json({ error: 'Invalid user' });
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
    res.status(409).json({ error: 'Friend request already exists', status: existing.status });
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
      type: 'FRIEND_REQUEST',
      title: 'New Friend Request',
      body: `${req.user!.username} wants to be your friend`,
      data: { friendshipId: friendship.id },
    },
  });

  res.status(201).json({ friendship });
});

usersRouter.patch('/friends/:friendshipId', async (req: Request, res: Response) => {
  const { action } = req.body; // 'accept' | 'reject' | 'block'

  const friendship = await prisma.friendship.findUnique({
    where: { id: String(req.params.friendshipId) },
  });

  if (!friendship || friendship.receiverId !== req.user!.userId) {
    res.status(404).json({ error: 'Friend request not found' });
    return;
  }

  const statusMap: Record<string, 'ACCEPTED' | 'BLOCKED'> = {
    accept: 'ACCEPTED',
    block: 'BLOCKED',
  };

  if (action === 'reject') {
    await prisma.friendship.delete({ where: { id: friendship.id } });
    res.json({ message: 'Request rejected' });
    return;
  }

  const updated = await prisma.friendship.update({
    where: { id: friendship.id },
    data: { status: statusMap[action] || 'ACCEPTED' },
  });

  if (action === 'accept') {
    await prisma.notification.create({
      data: {
        userId: friendship.requesterId,
        type: 'FRIEND_ACCEPTED',
        title: 'Friend Request Accepted',
        body: `${req.user!.username} accepted your friend request`,
      },
    });
  }

  res.json({ friendship: updated });
});

// ─── Search Users ──────────────────────────────────────────────────────────

usersRouter.get('/search', async (req: Request, res: Response) => {
  const query = String(req.query.q || '');
  if (!query || query.length < 2) {
    res.status(400).json({ error: 'Search query must be at least 2 characters' });
    return;
  }

  const users = await prisma.user.findMany({
    where: {
      username: { contains: query, mode: 'insensitive' },
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

usersRouter.post('/daily-reward', async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  // Check if already claimed today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastClaim = await prisma.dailyReward.findFirst({
    where: { userId },
    orderBy: { claimedAt: 'desc' },
  });

  if (lastClaim) {
    const lastClaimDate = new Date(lastClaim.claimedAt);
    lastClaimDate.setHours(0, 0, 0, 0);

    if (lastClaimDate.getTime() === today.getTime()) {
      res.status(400).json({ error: 'Already claimed today', nextClaimAt: getNextMidnight() });
      return;
    }
  }

  // Calculate streak
  let streak = 1;
  if (lastClaim) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastClaimDate = new Date(lastClaim.claimedAt);
    lastClaimDate.setHours(0, 0, 0, 0);

    if (lastClaimDate.getTime() === yesterday.getTime()) {
      streak = lastClaim.streak + 1;
    }
  }

  // Day in cycle (1-7, then resets)
  const day = ((streak - 1) % 7) + 1;

  // Reward amounts (escalating through the week)
  const baseRewards = [500, 750, 1000, 1500, 2000, 3000, 5000];
  const baseReward = baseRewards[day - 1];

  // VIP bonus
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { vipTier: true },
  });

  const vipMultipliers: Record<string, number> = {
    BRONZE: 1,
    SILVER: 1.25,
    GOLD: 1.5,
    PLATINUM: 2,
    DIAMOND: 3,
  };
  const multiplier = vipMultipliers[user?.vipTier || 'BRONZE'] ?? 1;
  const totalReward = Math.floor(baseReward * multiplier);
  const bonusAmount = totalReward - baseReward;

  // Create reward and update chips
  const [reward] = await prisma.$transaction([
    prisma.dailyReward.create({
      data: {
        userId,
        day,
        streak,
        amount: BigInt(baseReward),
        bonusAmount: BigInt(bonusAmount),
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { chips: { increment: BigInt(totalReward) } },
    }),
    prisma.transaction.create({
      data: {
        userId,
        type: 'DAILY_REWARD',
        amount: BigInt(totalReward),
        balanceBefore: 0n, // Simplified
        balanceAfter: 0n,
        description: `Day ${day} reward (${streak} day streak)`,
      },
    }),
  ]);

  res.json({
    reward: {
      day,
      streak,
      amount: totalReward,
      baseAmount: baseReward,
      bonusAmount,
      nextClaimAt: getNextMidnight(),
      weekRewards: baseRewards.map((r, i) => ({
        day: i + 1,
        amount: Math.floor(r * multiplier),
        claimed: i + 1 <= day,
      })),
    },
  });
});

// ─── Notifications ─────────────────────────────────────────────────────────

usersRouter.get('/notifications', async (req: Request, res: Response) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  res.json({ notifications });
});

usersRouter.post('/notifications/read-all', async (req: Request, res: Response) => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.userId, isRead: false },
    data: { isRead: true },
  });

  res.json({ message: 'All notifications marked as read' });
});

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
