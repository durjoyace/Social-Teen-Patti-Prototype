import { createHmac, randomBytes } from 'node:crypto';

export const REFERRAL_ACTIVATION_BELI = 100;
export const MAX_REWARDED_REFERRALS_PER_DAY = 10;

export const REFERRAL_MILESTONES = [
  { count: 1, beli: 50, label: 'First friend at the table' },
  { count: 3, beli: 150, label: 'Three-player circle' },
  { count: 5, beli: 300, label: 'Full mehfil' },
  { count: 10, beli: 750, label: 'Table captain' },
  { count: 25, beli: 2500, label: 'Community host' },
] as const;

export const BELI_REWARD_CATALOG = [
  { id: 'dhol-reaction', name: 'Dhol Reaction', type: 'EMOTE', costBeli: 150, description: 'A celebratory table reaction.' },
  { id: 'saffron-frame', name: 'Saffron Circle', type: 'AVATAR_FRAME', costBeli: 250, description: 'A warm saffron profile frame.' },
  { id: 'monsoon-table', name: 'Monsoon Baithak', type: 'TABLE_THEME', costBeli: 500, description: 'A deep-blue monsoon table theme.' },
  { id: 'mehfil-host', name: 'Mehfil Host', type: 'TITLE', costBeli: 1000, description: 'A permanent host title for your profile.' },
] as const;

export type BeliReward = (typeof BELI_REWARD_CATALOG)[number];

export function normalizeReferralCode(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function isValidReferralCode(value: string): boolean {
  return /^TP[A-HJ-NP-Z2-9]{8}$/.test(normalizeReferralCode(value));
}

export function generateReferralCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(8);
  let code = 'TP';
  for (const byte of bytes) code += alphabet[byte % alphabet.length];
  return code;
}

export function hashReferralSignal(kind: 'device' | 'ip', value: string, secret: string): string {
  return createHmac('sha256', secret).update(`${kind}:${value.trim().toLowerCase()}`).digest('hex');
}

export function milestoneForCount(count: number) {
  return REFERRAL_MILESTONES.find(milestone => milestone.count === count);
}

export function rewardById(itemId: string): BeliReward | undefined {
  return BELI_REWARD_CATALOG.find(item => item.id === itemId);
}
