/**
 * CHIP ECONOMY ENGINE
 *
 * Controls the flow of chips in and out of the system to create
 * natural purchase intent without feeling punitive.
 *
 * Design goals:
 * - New player should have fun for 3-4 sessions before chips run low
 * - Low-chip moments should feel like "I was SO close" not "this is unfair"
 * - Multiple free chip sources prevent hard walls (daily, hourly, quests, ads)
 * - Spending chips should feel good (social gifting, tournaments, not just lost games)
 *
 * Key metrics this engine targets:
 * - Time to first purchase: ~Day 3-5
 * - Free chip sources cover ~60% of average daily drain
 * - Purchase converts 5-8% of players (industry standard)
 */

interface EconomyConfig {
  // Starting chips
  initialChips: number;

  // Free chip sources (daily)
  dailyLoginReward: number[];        // [day1, day2, ..., day7] — escalating
  hourlyBonusBase: number;           // Base amount per 4-hour cycle
  hourlyBonusEscalation: number[];   // [claim1, claim2, claim3, claim4] multipliers per day
  questRewardsDaily: number;         // Total daily quest rewards
  questRewardsWeekly: number;        // Total weekly quest rewards
  adWatchReward: number;             // Per ad watched
  maxAdsPerDay: number;

  // Drain rates
  bootAmountLow: number;             // Low-stakes table boot
  bootAmountMid: number;             // Mid-stakes
  bootAmountHigh: number;            // High-stakes
  averageHandsPerSession: number;    // ~15-20 hands
  averageSessionsPerDay: number;     // ~2-3 sessions
  houseEdge: number;                 // Effective % drain from rake/rounding (0.02 = 2%)

  // VIP multipliers for free sources
  vipMultipliers: Record<string, number>;

  // Purchase triggers
  lowChipThreshold: number;          // Below this, show "buy chips" prompt
  criticalChipThreshold: number;     // Below this, can't join mid tables
  zeroChipFreeGrant: number;         // When hitting 0, give this many free
}

const DEFAULT_CONFIG: EconomyConfig = {
  initialChips: 10000,

  dailyLoginReward: [500, 750, 1000, 1500, 2000, 3000, 5000],
  hourlyBonusBase: 100,
  hourlyBonusEscalation: [1, 1.5, 2, 3],
  questRewardsDaily: 1500,
  questRewardsWeekly: 5000,
  adWatchReward: 200,
  maxAdsPerDay: 5,

  bootAmountLow: 10,
  bootAmountMid: 50,
  bootAmountHigh: 200,
  averageHandsPerSession: 18,
  averageSessionsPerDay: 2.5,
  houseEdge: 0.02,

  vipMultipliers: {
    BRONZE: 1,
    SILVER: 1.25,
    GOLD: 1.5,
    PLATINUM: 2,
    DIAMOND: 3,
  },

  lowChipThreshold: 500,
  criticalChipThreshold: 100,
  zeroChipFreeGrant: 500,
};

class EconomyEngine {
  private config: EconomyConfig;

  constructor(config: EconomyConfig = DEFAULT_CONFIG) {
    this.config = config;
  }

  /**
   * Calculate expected daily chip flow for a player at a given stake level.
   * Returns { inflow, outflow, net } — net should be slightly negative
   * to create natural purchase intent by day 3-5.
   */
  calculateDailyFlow(stakeLevel: 'low' | 'mid' | 'high', vipTier: string = 'BRONZE', dayInStreak: number = 1) {
    const c = this.config;
    const vipMult = c.vipMultipliers[vipTier] || 1;

    // Inflow (free chips per day)
    const dailyReward = c.dailyLoginReward[Math.min(dayInStreak - 1, 6)] * vipMult;
    const hourlyBonuses = c.hourlyBonusBase * c.hourlyBonusEscalation.reduce((a, b) => a + b, 0) * vipMult;
    const questRewards = c.questRewardsDaily;
    const adRewards = c.adWatchReward * Math.min(c.maxAdsPerDay, 3); // Assume 3 ads watched

    const totalInflow = dailyReward + hourlyBonuses + questRewards + adRewards;

    // Outflow (chips lost per day)
    const bootAmount = stakeLevel === 'low' ? c.bootAmountLow
      : stakeLevel === 'mid' ? c.bootAmountMid
      : c.bootAmountHigh;

    const handsPerDay = c.averageHandsPerSession * c.averageSessionsPerDay;
    // Average loss per hand: boot + 50% of hands lost at ~2x boot
    const avgLossPerHand = bootAmount * (1 + c.houseEdge);
    const totalOutflow = handsPerDay * avgLossPerHand;

    return {
      inflow: Math.round(totalInflow),
      outflow: Math.round(totalOutflow),
      net: Math.round(totalInflow - totalOutflow),
      daysUntilBroke: totalInflow >= totalOutflow
        ? Infinity
        : Math.ceil(c.initialChips / (totalOutflow - totalInflow)),
    };
  }

  /**
   * Get the appropriate "low chips" nudge based on current balance.
   */
  getLowChipNudge(currentChips: number): {
    show: boolean;
    type: 'gentle' | 'urgent' | 'zero';
    message: string;
    freeOption?: string;
  } | null {
    const c = this.config;

    if (currentChips <= 0) {
      return {
        show: true,
        type: 'zero',
        message: "You're out of chips! Here's ₹500 to get back in the game.",
        freeOption: 'Claim free chips',
      };
    }

    if (currentChips < c.criticalChipThreshold) {
      return {
        show: true,
        type: 'urgent',
        message: `Only ₹${currentChips} left! Grab more chips to keep playing.`,
        freeOption: 'Watch ad for ₹200',
      };
    }

    if (currentChips < c.lowChipThreshold) {
      return {
        show: true,
        type: 'gentle',
        message: 'Running low? Stock up for your next session.',
      };
    }

    return null;
  }

  /**
   * Determine which table stakes the player can afford.
   */
  getAffordableTables(currentChips: number): {
    low: boolean;
    mid: boolean;
    high: boolean;
    recommendedStake: 'low' | 'mid' | 'high';
  } {
    return {
      low: currentChips >= this.config.bootAmountLow * 10,
      mid: currentChips >= this.config.bootAmountMid * 10,
      high: currentChips >= this.config.bootAmountHigh * 10,
      recommendedStake: currentChips >= this.config.bootAmountHigh * 20 ? 'high'
        : currentChips >= this.config.bootAmountMid * 20 ? 'mid'
        : 'low',
    };
  }

  /**
   * Calculate daily reward amount for a given day and VIP tier.
   */
  getDailyRewardAmount(day: number, vipTier: string = 'BRONZE'): number {
    const dayIndex = Math.min(day - 1, 6);
    const base = this.config.dailyLoginReward[dayIndex];
    const mult = this.config.vipMultipliers[vipTier] || 1;
    return Math.floor(base * mult);
  }

  /**
   * Economy health check — for analytics dashboard.
   */
  getEconomyMetrics() {
    const lowFlow = this.calculateDailyFlow('low', 'BRONZE', 3);
    const midFlow = this.calculateDailyFlow('mid', 'BRONZE', 3);
    const highFlow = this.calculateDailyFlow('high', 'BRONZE', 3);

    return {
      lowStakes: lowFlow,
      midStakes: midFlow,
      highStakes: highFlow,
      targetDaysToPurchase: midFlow.daysUntilBroke,
      freeChipsPerDay: lowFlow.inflow,
    };
  }
}

export const economy = new EconomyEngine();
