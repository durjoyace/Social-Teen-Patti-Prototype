export interface ReferralAttribution {
  code: string;
  source?: string;
  campaign?: string;
}

export interface ReferralSummary {
  code: string;
  shareUrl: string;
  beliBalance: number;
  activationRewardBeli: number;
  stats: { invited: number; pending: number; activated: number };
  nextMilestone: { count: number; beli: number; label: string } | null;
  milestones: Array<{ count: number; beli: number; label: string; achieved: boolean }>;
  referrals: Array<{
    id: string;
    username: string;
    status: 'PENDING' | 'QUALIFIED' | 'REWARDED' | 'REJECTED';
    attributedAt: string;
    rewardedAt: string | null;
  }>;
  catalog: Array<{
    id: string;
    name: string;
    type: 'AVATAR_FRAME' | 'TABLE_THEME' | 'EMOTE' | 'TITLE';
    costBeli: number;
    description: string;
    owned: boolean;
  }>;
}
