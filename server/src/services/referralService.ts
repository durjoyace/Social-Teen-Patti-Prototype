import { Prisma, ReferralSharePlatform } from '@prisma/client';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import {
  BELI_REWARD_CATALOG,
  generateReferralCode,
  hashReferralSignal,
  isValidReferralCode,
  MAX_REWARDED_REFERRALS_PER_DAY,
  milestoneForCount,
  normalizeReferralCode,
  REFERRAL_ACTIVATION_BELI,
  REFERRAL_MILESTONES,
  rewardById,
} from './referralPolicy.js';

export class ReferralError extends Error {
  constructor(message: string, public readonly statusCode = 400) {
    super(message);
  }
}

export interface ReferralAttributionContext {
  source?: string;
  campaign?: string;
  deviceId?: string;
  ip?: string;
}

const cleanTrackingValue = (value?: string) => value?.trim().slice(0, 64) || undefined;

export async function ensureReferralCode(userId: string): Promise<string> {
  const existing = await prisma.user.findUnique({ where: { id: userId }, select: { referralCode: true } });
  if (!existing) throw new ReferralError('User not found', 404);
  if (existing.referralCode) return existing.referralCode;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const code = generateReferralCode();
      const updated = await prisma.user.updateMany({
        where: { id: userId, referralCode: null },
        data: { referralCode: code },
      });
      if (updated.count === 1) return code;

      const raced = await prisma.user.findUnique({ where: { id: userId }, select: { referralCode: true } });
      if (raced?.referralCode) return raced.referralCode;
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') throw error;

      const raced = await prisma.user.findUnique({ where: { id: userId }, select: { referralCode: true } });
      if (raced?.referralCode) return raced.referralCode;
    }
  }

  throw new ReferralError('Could not create a referral code', 503);
}

export async function attributeReferral(
  inviteeId: string,
  rawCode: string | undefined,
  context: ReferralAttributionContext = {},
) {
  if (!rawCode) return { attributed: false as const, reason: 'no_code' as const };
  const code = normalizeReferralCode(rawCode);
  if (!isValidReferralCode(code)) return { attributed: false as const, reason: 'invalid_code' as const };

  const inviter = await prisma.user.findUnique({ where: { referralCode: code }, select: { id: true } });
  if (!inviter) return { attributed: false as const, reason: 'unknown_code' as const };
  if (inviter.id === inviteeId) return { attributed: false as const, reason: 'self_referral' as const };

  const alreadyAttributed = await prisma.referral.findUnique({ where: { inviteeId }, select: { id: true } });
  if (alreadyAttributed) return { attributed: false as const, reason: 'already_attributed' as const };

  const deviceHash = context.deviceId
    ? hashReferralSignal('device', context.deviceId, env.referralHashSecret)
    : undefined;
  const ipHash = context.ip
    ? hashReferralSignal('ip', context.ip, env.referralHashSecret)
    : undefined;

  const [deviceUses, recentIpUses] = await Promise.all([
    deviceHash ? prisma.referral.count({ where: { inviterId: inviter.id, deviceHash } }) : Promise.resolve(0),
    ipHash ? prisma.referral.count({
      where: { inviterId: inviter.id, ipHash, attributedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    }) : Promise.resolve(0),
  ]);

  const riskFlags = [
    ...(deviceUses > 0 ? ['duplicate_device'] : []),
    ...(recentIpUses >= 3 ? ['ip_velocity'] : []),
  ];

  try {
    const referral = await prisma.referral.create({
      data: {
        inviterId: inviter.id,
        inviteeId,
        code,
        source: cleanTrackingValue(context.source),
        campaign: cleanTrackingValue(context.campaign),
        deviceHash,
        ipHash,
        riskFlags,
      },
      select: { id: true, status: true },
    });
    return { attributed: true as const, referral };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { attributed: false as const, reason: 'already_attributed' as const };
    }
    throw error;
  }
}

export async function getReferralSummary(userId: string) {
  const code = await ensureReferralCode(userId);
  const [user, invitedCount, pendingCount, activatedCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        beliBalance: true,
        referralsSent: {
          orderBy: { attributedAt: 'desc' },
          take: 50,
          select: {
            id: true,
            status: true,
            attributedAt: true,
            rewardedAt: true,
            invitee: { select: { username: true } },
          },
        },
        rewardEntitlements: { select: { itemId: true } },
      },
    }),
    prisma.referral.count({ where: { inviterId: userId } }),
    prisma.referral.count({ where: { inviterId: userId, status: 'PENDING' } }),
    prisma.referral.count({ where: { inviterId: userId, status: 'REWARDED' } }),
  ]);
  if (!user) throw new ReferralError('User not found', 404);

  const owned = new Set(user.rewardEntitlements.map(entitlement => entitlement.itemId));
  const nextMilestone = REFERRAL_MILESTONES.find(milestone => milestone.count > activatedCount) ?? null;

  return {
    code,
    shareUrl: `${env.publicAppUrl}/invite/${code}?utm_source=referral&utm_campaign=table_circle`,
    beliBalance: user.beliBalance,
    activationRewardBeli: REFERRAL_ACTIVATION_BELI,
    stats: {
      invited: invitedCount,
      pending: pendingCount,
      activated: activatedCount,
    },
    nextMilestone,
    milestones: REFERRAL_MILESTONES.map(milestone => ({
      ...milestone,
      achieved: activatedCount >= milestone.count,
    })),
    referrals: user.referralsSent.map(referral => ({
      id: referral.id,
      username: referral.invitee.username,
      status: referral.status,
      attributedAt: referral.attributedAt,
      rewardedAt: referral.rewardedAt,
    })),
    catalog: BELI_REWARD_CATALOG.map(item => ({ ...item, owned: owned.has(item.id) })),
  };
}

export async function recordReferralShare(userId: string, platform: ReferralSharePlatform, campaign?: string) {
  await ensureReferralCode(userId);
  return prisma.referralShare.create({
    data: { userId, platform, campaign: cleanTrackingValue(campaign) },
    select: { id: true, createdAt: true },
  });
}

async function creditBeli(
  tx: Prisma.TransactionClient,
  input: {
    userId: string;
    referralId?: string;
    amount: number;
    type: 'REFERRAL_ACTIVATION' | 'REFERRAL_MILESTONE' | 'ADJUSTMENT';
    idempotencyKey: string;
    description: string;
    metadata?: Prisma.InputJsonValue;
  },
) {
  const user = await tx.user.update({
    where: { id: input.userId },
    data: { beliBalance: { increment: input.amount } },
    select: { beliBalance: true },
  });
  await tx.beliTransaction.create({
    data: { ...input, balanceAfter: user.beliBalance },
  });
  return user.beliBalance;
}

export async function qualifyReferralForGame(
  inviteeId: string,
  sessionId: string,
  humanParticipantIds: string[],
) {
  const participants = new Set(humanParticipantIds);
  if (participants.size < 2 || !participants.has(inviteeId)) {
    return { rewarded: false as const, reason: 'not_qualifying_multiplayer_game' as const };
  }

  try {
    return await prisma.$transaction(async tx => {
      const referral = await tx.referral.findUnique({ where: { inviteeId } });
      if (!referral) return { rewarded: false as const, reason: 'not_referred' as const };
      if (referral.status !== 'PENDING') return { rewarded: false as const, reason: 'already_processed' as const };

      const riskFlags = Array.isArray(referral.riskFlags)
        ? referral.riskFlags.filter((flag): flag is string => typeof flag === 'string')
        : [];
      const recentRewards = await tx.referral.count({
        where: {
          inviterId: referral.inviterId,
          status: 'REWARDED',
          rewardedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });

      const automatedRiskReview = riskFlags.some(flag => ['duplicate_device', 'ip_velocity'].includes(flag));
      if (automatedRiskReview || recentRewards >= MAX_REWARDED_REFERRALS_PER_DAY) {
        const finalFlags = [
          ...riskFlags,
          ...(recentRewards >= MAX_REWARDED_REFERRALS_PER_DAY ? ['reward_velocity'] : []),
        ];
        await tx.referral.update({
          where: { id: referral.id },
          data: { status: 'REJECTED', qualifiedAt: new Date(), qualifyingSessionId: sessionId, riskFlags: finalFlags },
        });
        return { rewarded: false as const, reason: 'risk_review' as const };
      }

      const now = new Date();
      await tx.referral.update({
        where: { id: referral.id },
        data: { status: 'QUALIFIED', qualifiedAt: now, qualifyingSessionId: sessionId },
      });

      const inviterBalance = await creditBeli(tx, {
        userId: referral.inviterId,
        referralId: referral.id,
        amount: REFERRAL_ACTIVATION_BELI,
        type: 'REFERRAL_ACTIVATION',
        idempotencyKey: `referral:${referral.id}:inviter`,
        description: 'Friend completed their first multiplayer game',
      });
      const inviteeBalance = await creditBeli(tx, {
        userId: referral.inviteeId,
        referralId: referral.id,
        amount: REFERRAL_ACTIVATION_BELI,
        type: 'REFERRAL_ACTIVATION',
        idempotencyKey: `referral:${referral.id}:invitee`,
        description: 'Completed first multiplayer game with a referral',
      });

      await tx.referral.update({
        where: { id: referral.id },
        data: { status: 'REWARDED', rewardedAt: now },
      });

      const activatedCount = await tx.referral.count({
        where: { inviterId: referral.inviterId, status: 'REWARDED' },
      });
      const milestone = milestoneForCount(activatedCount);
      if (milestone) {
        await creditBeli(tx, {
          userId: referral.inviterId,
          referralId: referral.id,
          amount: milestone.beli,
          type: 'REFERRAL_MILESTONE',
          idempotencyKey: `milestone:${referral.inviterId}:${milestone.count}`,
          description: milestone.label,
          metadata: { activatedCount },
        });
      }

      await tx.notification.createMany({
        data: [
          {
            userId: referral.inviterId,
            type: 'REFERRAL_ACTIVATED',
            title: 'Your friend joined the table',
            body: `You earned ${REFERRAL_ACTIVATION_BELI} Beli.`,
            data: { referralId: referral.id },
          },
          {
            userId: referral.inviteeId,
            type: 'BELI_REWARD',
            title: 'Your first Beli is here',
            body: `You earned ${REFERRAL_ACTIVATION_BELI} Beli for completing a real multiplayer game.`,
            data: { referralId: referral.id },
          },
        ],
      });

      return { rewarded: true as const, inviterBalance, inviteeBalance, milestone: milestone ?? null };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && ['P2002', 'P2034'].includes(error.code)) {
      return { rewarded: false as const, reason: 'already_processed' as const };
    }
    throw error;
  }
}

export async function redeemBeliReward(userId: string, itemId: string) {
  const item = rewardById(itemId);
  if (!item) throw new ReferralError('Reward not found', 404);

  try {
    return await prisma.$transaction(async tx => {
      const existing = await tx.rewardEntitlement.findUnique({ where: { userId_itemId: { userId, itemId } } });
      if (existing) throw new ReferralError('Reward already owned', 409);

      const user = await tx.user.findUnique({ where: { id: userId }, select: { beliBalance: true } });
      if (!user) throw new ReferralError('User not found', 404);
      if (user.beliBalance < item.costBeli) throw new ReferralError('Not enough Beli', 409);

      const updated = await tx.user.update({
        where: { id: userId },
        data: { beliBalance: { decrement: item.costBeli } },
        select: { beliBalance: true },
      });
      const entitlement = await tx.rewardEntitlement.create({
        data: {
          userId,
          itemId: item.id,
          name: item.name,
          type: item.type,
          source: 'BELI_REDEMPTION',
          costBeli: item.costBeli,
        },
      });
      await tx.beliTransaction.create({
        data: {
          userId,
          type: 'REWARD_REDEMPTION',
          amount: -item.costBeli,
          balanceAfter: updated.beliBalance,
          idempotencyKey: `redemption:${entitlement.id}`,
          description: `Redeemed ${item.name}`,
          metadata: { itemId: item.id },
        },
      });

      return { entitlement, beliBalance: updated.beliBalance };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ReferralError('Reward already owned', 409);
    }
    throw error;
  }
}
