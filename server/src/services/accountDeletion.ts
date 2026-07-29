import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';

export class AccountDeletionError extends Error {
  constructor(message: string, readonly statusCode: number) {
    super(message);
    this.name = 'AccountDeletionError';
  }
}

export function deletedUsername(userId: string) {
  return `deleted_${userId.replaceAll('-', '')}`;
}

export async function deleteAccount(userId: string, password?: string) {
  const account = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, isGuest: true, passwordHash: true },
  });

  if (!account) throw new AccountDeletionError('Account not found', 404);

  if (!account.isGuest) {
    if (!password || !account.passwordHash) {
      throw new AccountDeletionError('Password is required', 400);
    }
    if (!await bcrypt.compare(password, account.passwordHash)) {
      throw new AccountDeletionError('Password is incorrect', 403);
    }
  }

  await prisma.$transaction(async tx => {
    // Remove or scrub user-authored social content. Economy, referral, payment,
    // and gameplay ledgers remain pseudonymous so balances and fraud controls
    // can still be audited without retaining profile identifiers.
    await tx.friendship.deleteMany({
      where: { OR: [{ requesterId: userId }, { receiverId: userId }] },
    });
    await tx.clubMember.deleteMany({ where: { userId } });
    await tx.notification.deleteMany({ where: { userId } });
    await tx.notification.updateMany({
      where: { body: { contains: account.username } },
      data: { body: 'A player update is no longer available', data: Prisma.JsonNull },
    });
    await tx.referralShare.deleteMany({ where: { userId } });
    await tx.chatMessage.updateMany({
      where: { userId },
      data: { content: '[deleted]', metadata: Prisma.JsonNull },
    });
    await tx.gift.updateMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      data: { message: null },
    });
    await tx.gameRoom.updateMany({
      where: { createdById: userId },
      data: { name: 'Closed table', password: null },
    });
    await tx.user.update({
      where: { id: userId },
      data: {
        username: deletedUsername(userId),
        email: null,
        phone: null,
        passwordHash: null,
        googleId: null,
        avatarUrl: null,
        referralCode: null,
        adultConfirmedAt: null,
        isGuest: true,
        isOnline: false,
        isBanned: true,
        banReason: 'account_deleted',
      },
    });
  });
}
