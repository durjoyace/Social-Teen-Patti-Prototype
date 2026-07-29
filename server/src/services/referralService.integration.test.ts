import assert from 'node:assert/strict';
import test from 'node:test';
import { prisma } from '../config/database.js';
import {
  attributeReferral,
  ensureReferralCode,
  getReferralSummary,
  qualifyReferralForGame,
  redeemBeliReward,
} from './referralService.js';

const hasTestDatabase = Boolean(process.env.TEST_DATABASE_URL);

async function cleanDatabase() {
  await prisma.beliTransaction.deleteMany();
  await prisma.rewardEntitlement.deleteMany();
  await prisma.referralShare.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.paymentReceipt.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.user.deleteMany();
}

test('referral activation is multiplayer-only, double-sided, and idempotent', { skip: !hasTestDatabase }, async () => {
  await cleanDatabase();
  const inviter = await prisma.user.create({ data: { username: 'integration_inviter' } });
  const invitee = await prisma.user.create({ data: { username: 'integration_invitee' } });
  const other = await prisma.user.create({ data: { username: 'integration_other' } });
  const code = await ensureReferralCode(inviter.id);

  const attribution = await attributeReferral(invitee.id, code, {
    source: 'integration',
    campaign: 'test',
    deviceId: 'invitee-device',
    ip: '127.0.0.2',
  });
  assert.equal(attribution.attributed, true);

  const botOnly = await qualifyReferralForGame(invitee.id, 'bot-session', [invitee.id]);
  assert.equal(botOnly.rewarded, false);

  const rewarded = await qualifyReferralForGame(invitee.id, 'human-session', [invitee.id, other.id]);
  assert.equal(rewarded.rewarded, true);
  assert.equal(rewarded.inviteeBalance, 100);
  assert.equal(rewarded.inviterBalance, 100);
  assert.equal(rewarded.milestone?.beli, 50);

  const duplicate = await qualifyReferralForGame(invitee.id, 'second-session', [invitee.id, other.id]);
  assert.equal(duplicate.rewarded, false);

  const summary = await getReferralSummary(inviter.id);
  assert.equal(summary.beliBalance, 150);
  assert.deepEqual(summary.stats, { invited: 1, pending: 0, activated: 1 });

  const duplicateDeviceInvitee = await prisma.user.create({ data: { username: 'integration_duplicate_device' } });
  const duplicateAttribution = await attributeReferral(duplicateDeviceInvitee.id, code, {
    deviceId: 'invitee-device',
    ip: '127.0.0.3',
  });
  assert.equal(duplicateAttribution.attributed, true);
  const blocked = await qualifyReferralForGame(
    duplicateDeviceInvitee.id,
    'duplicate-device-session',
    [duplicateDeviceInvitee.id, other.id],
  );
  assert.deepEqual(blocked, { rewarded: false, reason: 'risk_review' });

  const ipVelocityInvitees = await Promise.all(
    Array.from({ length: 4 }, (_, index) => prisma.user.create({ data: { username: `integration_ip_${index}` } })),
  );
  for (const [index, ipInvitee] of ipVelocityInvitees.entries()) {
    const ipAttribution = await attributeReferral(ipInvitee.id, code, {
      deviceId: `ip-device-${index}`,
      ip: '192.0.2.5',
    });
    assert.equal(ipAttribution.attributed, true);
  }
  const ipBlocked = await qualifyReferralForGame(
    ipVelocityInvitees[3].id,
    'ip-velocity-session',
    [ipVelocityInvitees[3].id, other.id],
  );
  assert.deepEqual(ipBlocked, { rewarded: false, reason: 'risk_review' });

  const redemption = await redeemBeliReward(inviter.id, 'dhol-reaction');
  assert.equal(redemption.beliBalance, 0);
  await assert.rejects(() => redeemBeliReward(inviter.id, 'dhol-reaction'), /already owned/i);

  await cleanDatabase();
  await prisma.$disconnect();
});
