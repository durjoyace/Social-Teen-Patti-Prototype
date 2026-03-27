import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ─── Achievements ─────────────────────────────────────────────────────

  const achievements = [
    // Gameplay
    { key: 'first_win', name: 'First Win', description: 'Win your first game', category: 'gameplay', rarity: 'COMMON', rewardChips: 500n, rewardXp: 50, condition: { type: 'wins', count: 1 } },
    { key: 'ten_wins', name: 'Ten Timer', description: 'Win 10 games', category: 'gameplay', rarity: 'COMMON', rewardChips: 2000n, rewardXp: 200, condition: { type: 'wins', count: 10 } },
    { key: 'fifty_wins', name: 'Half Century', description: 'Win 50 games', category: 'gameplay', rarity: 'RARE', rewardChips: 10000n, rewardXp: 500, condition: { type: 'wins', count: 50 } },
    { key: 'hundred_wins', name: 'Centurion', description: 'Win 100 games', category: 'gameplay', rarity: 'EPIC', rewardChips: 25000n, rewardXp: 1000, condition: { type: 'wins', count: 100 } },
    { key: 'trail_master', name: 'Trail Blazer', description: 'Get 5 Trails (Three of a Kind)', category: 'gameplay', rarity: 'RARE', rewardChips: 5000n, rewardXp: 300, condition: { type: 'hand', rank: 'trail', count: 5 } },
    { key: 'pure_sequence', name: 'Pure Gold', description: 'Get a Pure Sequence', category: 'gameplay', rarity: 'EPIC', rewardChips: 10000n, rewardXp: 500, condition: { type: 'hand', rank: 'pure_sequence', count: 1 } },
    { key: 'royal_flush', name: 'Royal Flush', description: 'Get a Pure Sequence of A-K-Q', category: 'gameplay', rarity: 'LEGENDARY', rewardChips: 50000n, rewardXp: 2000, condition: { type: 'specific_hand', cards: ['A', 'K', 'Q'], sameSuit: true, count: 1 } },
    { key: 'winning_streak_5', name: 'On Fire', description: 'Win 5 games in a row', category: 'gameplay', rarity: 'EPIC', rewardChips: 10000n, rewardXp: 500, condition: { type: 'streak', count: 5 } },
    { key: 'winning_streak_10', name: 'Unstoppable', description: 'Win 10 games in a row', category: 'gameplay', rarity: 'LEGENDARY', rewardChips: 50000n, rewardXp: 2000, condition: { type: 'streak', count: 10 } },
    { key: 'blind_master', name: 'Blind Master', description: 'Win 10 games while playing blind', category: 'gameplay', rarity: 'EPIC', rewardChips: 15000n, rewardXp: 750, condition: { type: 'blind_wins', count: 10 } },
    { key: 'high_roller', name: 'High Roller', description: 'Win a pot worth over ₹100K', category: 'gameplay', rarity: 'LEGENDARY', rewardChips: 25000n, rewardXp: 1500, condition: { type: 'pot_size', amount: 100000, count: 1 } },
    { key: 'bluff_master', name: 'Bluff Master', description: 'Win 10 games with High Card or Pair', category: 'gameplay', rarity: 'EPIC', rewardChips: 15000n, rewardXp: 750, condition: { type: 'weak_hand_wins', count: 10 } },

    // Social
    { key: 'social_butterfly', name: 'Social Butterfly', description: 'Add 10 friends', category: 'social', rarity: 'COMMON', rewardChips: 1000n, rewardXp: 100, condition: { type: 'friends', count: 10 } },
    { key: 'popular', name: 'Popular', description: 'Add 50 friends', category: 'social', rarity: 'RARE', rewardChips: 5000n, rewardXp: 300, condition: { type: 'friends', count: 50 } },
    { key: 'generous', name: 'Generous Soul', description: 'Send 50 gifts', category: 'social', rarity: 'RARE', rewardChips: 3000n, rewardXp: 300, condition: { type: 'gifts_sent', count: 50 } },
    { key: 'club_founder', name: 'Club Founder', description: 'Create a club', category: 'social', rarity: 'RARE', rewardChips: 5000n, rewardXp: 500, condition: { type: 'create_club', count: 1 } },
    { key: 'club_leader', name: 'Club Leader', description: 'Have a club with 20 members', category: 'social', rarity: 'EPIC', rewardChips: 10000n, rewardXp: 1000, condition: { type: 'club_members', count: 20 } },

    // Progression
    { key: 'level_5', name: 'Rising Star', description: 'Reach Level 5', category: 'progression', rarity: 'COMMON', rewardChips: 1000n, rewardXp: 100, condition: { type: 'level', count: 5 } },
    { key: 'level_10', name: 'Getting Serious', description: 'Reach Level 10', category: 'progression', rarity: 'COMMON', rewardChips: 2000n, rewardXp: 200, condition: { type: 'level', count: 10 } },
    { key: 'level_25', name: 'Veteran', description: 'Reach Level 25', category: 'progression', rarity: 'RARE', rewardChips: 10000n, rewardXp: 500, condition: { type: 'level', count: 25 } },
    { key: 'level_50', name: 'Legend', description: 'Reach Level 50', category: 'progression', rarity: 'EPIC', rewardChips: 50000n, rewardXp: 2000, condition: { type: 'level', count: 50 } },
    { key: 'hundred_games', name: 'Dedicated Player', description: 'Play 100 games', category: 'progression', rarity: 'RARE', rewardChips: 5000n, rewardXp: 500, condition: { type: 'games_played', count: 100 } },
    { key: 'daily_30', name: 'Daily Devotee', description: 'Log in 30 days in a row', category: 'progression', rarity: 'EPIC', rewardChips: 20000n, rewardXp: 1000, condition: { type: 'daily_streak', count: 30 } },
    { key: 'vip_silver', name: 'VIP Silver', description: 'Reach Silver VIP tier', category: 'progression', rarity: 'RARE', rewardChips: 5000n, rewardXp: 500, condition: { type: 'vip_tier', tier: 'SILVER' } },
    { key: 'vip_gold', name: 'VIP Gold', description: 'Reach Gold VIP tier', category: 'progression', rarity: 'EPIC', rewardChips: 25000n, rewardXp: 1000, condition: { type: 'vip_tier', tier: 'GOLD' } },

    // Mastery
    { key: 'muflis_master', name: 'Muflis Master', description: 'Win 20 Muflis games', category: 'mastery', rarity: 'RARE', rewardChips: 5000n, rewardXp: 500, condition: { type: 'variant_wins', variant: 'MUFLIS', count: 20 } },
    { key: 'joker_king', name: 'Joker King', description: 'Win 20 Joker variant games', category: 'mastery', rarity: 'RARE', rewardChips: 5000n, rewardXp: 500, condition: { type: 'variant_wins', variant: 'JOKER', count: 20 } },
    { key: 'ak47_ace', name: 'AK47 Ace', description: 'Win 20 AK47 variant games', category: 'mastery', rarity: 'RARE', rewardChips: 5000n, rewardXp: 500, condition: { type: 'variant_wins', variant: 'AK47', count: 20 } },
    { key: 'all_rounder', name: 'All Rounder', description: 'Win at least 1 game in every variant', category: 'mastery', rarity: 'EPIC', rewardChips: 20000n, rewardXp: 1000, condition: { type: 'all_variants_win', count: 1 } },
    { key: 'tournament_winner', name: 'Tournament Champion', description: 'Win a tournament', category: 'mastery', rarity: 'LEGENDARY', rewardChips: 100000n, rewardXp: 5000, condition: { type: 'tournament_win', count: 1 } },
  ];

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { key: achievement.key },
      update: {},
      create: {
        key: achievement.key,
        name: achievement.name,
        description: achievement.description,
        category: achievement.category,
        rarity: achievement.rarity as any,
        rewardChips: achievement.rewardChips,
        rewardXp: achievement.rewardXp,
        condition: achievement.condition,
      },
    });
  }

  console.log(`Seeded ${achievements.length} achievements`);

  // ─── Default Season ───────────────────────────────────────────────────

  const season = await prisma.season.upsert({
    where: { id: 'season-1' },
    update: {},
    create: {
      id: 'season-1',
      name: 'Diwali Dhamaka',
      theme: 'diwali',
      startsAt: new Date('2024-10-15'),
      endsAt: new Date('2025-01-15'),
      isActive: true,
      rewards: {
        tiers: 30,
        premiumPrice: 299,
        tierRewards: Array.from({ length: 30 }, (_, i) => ({
          level: i + 1,
          free: { type: 'chips', amount: (i + 1) * 200 },
          premium: { type: i % 5 === 4 ? 'special' : 'chips', amount: (i + 1) * 500 },
        })),
      },
    },
  });

  console.log(`Seeded season: ${season.name}`);

  // ─── Daily Quests ─────────────────────────────────────────────────────

  const dailyQuests = [
    { name: 'Play 3 Games', description: 'Play 3 games in any variant', condition: { type: 'play_games', count: 3 }, rewardChips: 300n, rewardXp: 30, isDaily: true },
    { name: 'Win a Game', description: 'Win at least 1 game', condition: { type: 'wins', count: 1 }, rewardChips: 500n, rewardXp: 50, isDaily: true },
    { name: 'Send a Gift', description: 'Send a gift to another player', condition: { type: 'gifts_sent', count: 1 }, rewardChips: 200n, rewardXp: 20, isDaily: true },
    { name: 'Play Blind', description: 'Play at least 1 round blind', condition: { type: 'blind_plays', count: 1 }, rewardChips: 300n, rewardXp: 30, isDaily: true },
    { name: 'Win ₹5K', description: 'Win a total of ₹5,000 in chips', condition: { type: 'chips_won', amount: 5000 }, rewardChips: 500n, rewardXp: 50, isDaily: true },
  ];

  for (const quest of dailyQuests) {
    await prisma.quest.create({
      data: {
        seasonId: season.id,
        name: quest.name,
        description: quest.description,
        type: 'DAILY',
        condition: quest.condition,
        rewardChips: quest.rewardChips,
        rewardXp: quest.rewardXp,
        isDaily: quest.isDaily,
      },
    });
  }

  console.log(`Seeded ${dailyQuests.length} daily quests`);

  // ─── Weekly Quests ────────────────────────────────────────────────────

  const weeklyQuests = [
    { name: 'Weekend Warrior', description: 'Play 20 games this week', condition: { type: 'play_games', count: 20 }, rewardChips: 5000n, rewardXp: 500, isWeekly: true },
    { name: 'Win Streak', description: 'Win 3 games in a row', condition: { type: 'streak', count: 3 }, rewardChips: 3000n, rewardXp: 300, isWeekly: true },
    { name: 'Social Week', description: 'Add 3 new friends', condition: { type: 'friends', count: 3 }, rewardChips: 2000n, rewardXp: 200, isWeekly: true },
    { name: 'Variant Explorer', description: 'Play 3 different variants', condition: { type: 'unique_variants', count: 3 }, rewardChips: 3000n, rewardXp: 300, isWeekly: true },
  ];

  for (const quest of weeklyQuests) {
    await prisma.quest.create({
      data: {
        seasonId: season.id,
        name: quest.name,
        description: quest.description,
        type: 'WEEKLY',
        condition: quest.condition,
        rewardChips: quest.rewardChips,
        rewardXp: quest.rewardXp,
        isWeekly: quest.isWeekly,
      },
    });
  }

  console.log(`Seeded ${weeklyQuests.length} weekly quests`);

  // ─── Sample Tournaments ───────────────────────────────────────────────

  const now = new Date();
  const tournaments = [
    {
      name: 'Diwali Freeroll',
      description: 'Free entry tournament with huge prizes!',
      variant: 'CLASSIC' as const,
      format: 'FREEROLL' as const,
      entryFee: 0n,
      maxEntrants: 200,
      prizePool: 500000n,
      prizeStructure: [{ place: 1, percentage: 40 }, { place: 2, percentage: 25 }, { place: 3, percentage: 15 }, { place: 4, percentage: 10 }, { place: 5, percentage: 10 }],
      startingChips: 3000n,
      blindStructure: [{ level: 1, boot: 10, duration: 600 }, { level: 2, boot: 20, duration: 600 }, { level: 3, boot: 50, duration: 600 }],
      registrationOpensAt: new Date(now.getTime() - 86400000),
      startsAt: new Date(now.getTime() + 3600000 * 2),
      status: 'REGISTRATION' as const,
    },
    {
      name: 'High Roller Classic',
      description: 'Premium tournament for serious players',
      variant: 'CLASSIC' as const,
      format: 'FREEZEOUT' as const,
      entryFee: 10000n,
      maxEntrants: 50,
      prizePool: 400000n,
      prizeStructure: [{ place: 1, percentage: 50 }, { place: 2, percentage: 30 }, { place: 3, percentage: 20 }],
      startingChips: 10000n,
      blindStructure: [{ level: 1, boot: 50, duration: 900 }, { level: 2, boot: 100, duration: 900 }, { level: 3, boot: 200, duration: 900 }],
      registrationOpensAt: new Date(now.getTime() - 86400000 * 2),
      startsAt: new Date(now.getTime() + 3600000 * 5),
      status: 'UPCOMING' as const,
    },
    {
      name: 'Joker Wild Tournament',
      description: 'Wild card chaos — expect the unexpected!',
      variant: 'JOKER' as const,
      format: 'REBUY' as const,
      entryFee: 1000n,
      maxEntrants: 100,
      prizePool: 80000n,
      prizeStructure: [{ place: 1, percentage: 45 }, { place: 2, percentage: 30 }, { place: 3, percentage: 15 }, { place: 4, percentage: 10 }],
      startingChips: 5000n,
      blindStructure: [{ level: 1, boot: 20, duration: 600 }, { level: 2, boot: 40, duration: 600 }],
      registrationOpensAt: new Date(now.getTime() + 3600000 * 12),
      startsAt: new Date(now.getTime() + 3600000 * 24),
      status: 'UPCOMING' as const,
    },
  ];

  for (const t of tournaments) {
    await prisma.tournament.create({ data: t });
  }

  console.log(`Seeded ${tournaments.length} tournaments`);

  console.log('\nSeed complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
