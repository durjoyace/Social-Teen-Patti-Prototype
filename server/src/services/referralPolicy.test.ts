import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BELI_REWARD_CATALOG,
  generateReferralCode,
  hashReferralSignal,
  isValidReferralCode,
  milestoneForCount,
  normalizeReferralCode,
} from './referralPolicy.js';

test('referral codes normalize and exclude ambiguous characters', () => {
  assert.equal(normalizeReferralCode(' tp-abcd2345 '), 'TPABCD2345');
  for (let index = 0; index < 100; index += 1) {
    const code = generateReferralCode();
    assert.match(code, /^TP[A-HJ-NP-Z2-9]{8}$/);
    assert.equal(isValidReferralCode(code), true);
  }
  assert.equal(isValidReferralCode('TP-INVALID'), false);
});

test('referral signals are stable, secret-bound, and namespaced', () => {
  const first = hashReferralSignal('device', 'Device-123', 'secret-one');
  assert.equal(first, hashReferralSignal('device', 'device-123', 'secret-one'));
  assert.notEqual(first, hashReferralSignal('ip', 'device-123', 'secret-one'));
  assert.notEqual(first, hashReferralSignal('device', 'device-123', 'secret-two'));
});

test('milestones award only at exact activated counts', () => {
  assert.deepEqual(milestoneForCount(1), { count: 1, beli: 50, label: 'First friend at the table' });
  assert.equal(milestoneForCount(2), undefined);
  assert.equal(milestoneForCount(25)?.beli, 2500);
});

test('Beli catalog contains identity extras, not stake currency', () => {
  assert.deepEqual(
    new Set(BELI_REWARD_CATALOG.map(item => item.type)),
    new Set(['EMOTE', 'AVATAR_FRAME', 'TABLE_THEME', 'TITLE']),
  );
  assert.equal(BELI_REWARD_CATALOG.every(item => item.costBeli > 0), true);
});
