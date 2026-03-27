import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown, Lock, Check, Gift, Star, Sparkles, Zap,
  ChevronLeft, ChevronRight, Clock, Diamond
} from 'lucide-react';
import { NavigationBar } from '../components/NavigationBar';
import { Layout } from '../components/Layout';
import { cn } from '../utils/cn';
import { formatChips } from '../game/gameEngine';

// ─── Season Data ───────────────────────────────────────────────────────────

interface SeasonTier {
  level: number;
  xpRequired: number;
  freeReward: { type: string; amount: number; label: string; icon: typeof Gift };
  premiumReward: { type: string; amount: number; label: string; icon: typeof Gift; special?: string };
  isClaimed: boolean;
  isPremiumClaimed: boolean;
}

const SEASON_TIERS: SeasonTier[] = Array.from({ length: 30 }, (_, i) => {
  const level = i + 1;
  const xpRequired = level * 100;

  // Free rewards escalate
  const freeRewards = [
    { type: 'chips', amount: 200, label: '200 Chips', icon: Star },
    { type: 'chips', amount: 500, label: '500 Chips', icon: Star },
    { type: 'xp', amount: 100, label: '100 XP', icon: Zap },
    { type: 'chips', amount: 300, label: '300 Chips', icon: Star },
    { type: 'chips', amount: 1000, label: '1K Chips', icon: Gift }, // Every 5th level is bigger
  ];
  const freeReward = freeRewards[i % 5];

  // Premium rewards are better
  const premiumRewards = [
    { type: 'chips', amount: 1000, label: '1K Chips', icon: Star },
    { type: 'diamonds', amount: 5, label: '5 Diamonds', icon: Diamond },
    { type: 'chips', amount: 2000, label: '2K Chips', icon: Star },
    { type: 'diamonds', amount: 10, label: '10 Diamonds', icon: Diamond },
    { type: 'special', amount: 0, label: level === 5 ? 'Gold Avatar Frame' : level === 10 ? 'Diwali Table' : level === 15 ? 'Royal Card Back' : level === 20 ? 'Diamond Avatar' : level === 25 ? 'VIP Table Access' : '5K Chips', icon: Crown, special: level % 5 === 0 ? 'exclusive' : undefined },
  ];
  const premiumReward = premiumRewards[i % 5];

  return {
    level,
    xpRequired,
    freeReward: { ...freeReward, amount: freeReward.amount * Math.ceil(level / 5) },
    premiumReward: { ...premiumReward, amount: premiumReward.amount * Math.ceil(level / 5) },
    isClaimed: level <= 3,
    isPremiumClaimed: level <= 2,
  };
});

const CURRENT_SEASON = {
  name: 'Diwali Dhamaka',
  theme: 'diwali',
  endsIn: '18d 14h',
  currentLevel: 4,
  currentXp: 250,
  xpToNext: 500,
  isPremium: false,
  premiumPrice: 299,
};

interface SeasonPassScreenProps {
  onNavigate: (screen: string) => void;
}

export function SeasonPassScreen({ onNavigate }: SeasonPassScreenProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const scrollTo = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <Layout>
      <div className="flex flex-col h-full bg-gradient-to-b from-orange-950/50 via-gray-900 to-black">
        {/* Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="px-4 pt-4 pb-2"
        >
          {/* Season banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 p-4 mb-4">
            {/* Animated background */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              animate={{ x: ['-200%', '200%'] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
            />

            {/* Sparkle particles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-yellow-300 rounded-full"
                animate={{
                  y: [-10, -30],
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  delay: i * 0.3,
                }}
                style={{ left: `${15 + i * 15}%`, bottom: '20%' }}
              />
            ))}

            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-300" />
                    <span className="text-yellow-200 text-xs font-medium uppercase tracking-wider">Season 1</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mt-1">{CURRENT_SEASON.name}</h2>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/30 rounded-full">
                  <Clock className="w-3.5 h-3.5 text-white/70" />
                  <span className="text-white text-sm font-medium">{CURRENT_SEASON.endsIn}</span>
                </div>
              </div>

              {/* XP Progress */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white/70 text-xs">Level {CURRENT_SEASON.currentLevel}</span>
                  <span className="text-white/70 text-xs">{CURRENT_SEASON.currentXp}/{CURRENT_SEASON.xpToNext} XP</span>
                </div>
                <div className="w-full h-2.5 bg-black/30 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(CURRENT_SEASON.currentXp / CURRENT_SEASON.xpToNext) * 100}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Premium upgrade */}
          {!CURRENT_SEASON.isPremium && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowUpgrade(true)}
              className="w-full p-4 rounded-2xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 mb-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                    <Crown className="w-5 h-5 text-yellow-900" />
                  </div>
                  <div>
                    <p className="text-yellow-400 font-bold">Upgrade to Premium</p>
                    <p className="text-white/50 text-xs">Unlock exclusive rewards & 3x chips</p>
                  </div>
                </div>
                <div className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl">
                  <span className="text-white font-bold">₹{CURRENT_SEASON.premiumPrice}</span>
                </div>
              </div>
            </motion.button>
          )}

          {/* Navigation arrows */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white font-semibold">Rewards Track</h3>
            <div className="flex gap-2">
              <button
                onClick={() => scrollTo('left')}
                className="p-1.5 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollTo('right')}
                className="p-1.5 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.header>

        {/* Rewards track (horizontal scroll) */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-x-auto scrollbar-hide px-4 pb-4"
        >
          <div className="flex gap-3 min-w-max">
            {SEASON_TIERS.map((tier, index) => (
              <TierCard
                key={tier.level}
                tier={tier}
                isCurrentLevel={CURRENT_SEASON.currentLevel === tier.level}
                isUnlocked={tier.level <= CURRENT_SEASON.currentLevel}
                isPremium={CURRENT_SEASON.isPremium}
                index={index}
              />
            ))}
          </div>
        </div>

        <NavigationBar currentScreen="home" onNavigate={onNavigate} />

        {/* Upgrade modal */}
        <AnimatePresence>
          {showUpgrade && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowUpgrade(false)}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 50 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm z-50"
              >
                <div className="bg-gradient-to-b from-gray-900 to-black rounded-3xl border border-yellow-500/30 p-6 overflow-hidden">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mb-3">
                      <Crown className="w-8 h-8 text-yellow-900" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Premium Season Pass</h3>
                    <p className="text-white/60 text-sm mt-1">Unlock all premium rewards</p>
                  </div>

                  <div className="space-y-3 mb-6">
                    {[
                      '3x more chips from every tier',
                      'Exclusive avatar frames & card backs',
                      'Premium table themes',
                      'VIP table access',
                      'Diamond currency rewards',
                    ].map((benefit, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                        <span className="text-white/80 text-sm">{benefit}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowUpgrade(false)}
                      className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium"
                    >
                      Maybe Later
                    </button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold shadow-lg shadow-orange-500/30"
                    >
                      Buy ₹{CURRENT_SEASON.premiumPrice}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}

// ─── Tier Card ─────────────────────────────────────────────────────────────

function TierCard({
  tier,
  isCurrentLevel,
  isUnlocked,
  isPremium,
  index,
}: {
  tier: SeasonTier;
  isCurrentLevel: boolean;
  isUnlocked: boolean;
  isPremium: boolean;
  index: number;
}) {
  const FreeIcon = tier.freeReward.icon;
  const PremiumIcon = tier.premiumReward.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={cn(
        'flex flex-col w-24 flex-shrink-0',
        !isUnlocked && 'opacity-50'
      )}
    >
      {/* Level badge */}
      <div className={cn(
        'w-full text-center py-1 rounded-t-xl text-xs font-bold',
        isCurrentLevel
          ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
          : isUnlocked
          ? 'bg-green-500/20 text-green-400'
          : 'bg-white/10 text-white/40'
      )}>
        Lv.{tier.level}
      </div>

      {/* Free reward */}
      <div className={cn(
        'p-3 border-x border-white/10 flex flex-col items-center gap-1.5',
        'bg-gradient-to-b from-gray-800/50 to-gray-900/50'
      )}>
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center',
          tier.isClaimed
            ? 'bg-green-500/20'
            : 'bg-white/10'
        )}>
          {tier.isClaimed ? (
            <Check className="w-5 h-5 text-green-400" />
          ) : (
            <FreeIcon className="w-5 h-5 text-white/60" />
          )}
        </div>
        <span className="text-[10px] text-white/60 text-center leading-tight">
          {tier.freeReward.label}
        </span>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" />

      {/* Premium reward */}
      <div className={cn(
        'p-3 border-x border-b border-white/10 rounded-b-xl flex flex-col items-center gap-1.5',
        'bg-gradient-to-b from-yellow-500/5 to-orange-500/5',
        !isPremium && 'relative'
      )}>
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center',
          tier.premiumReward.special
            ? 'bg-gradient-to-br from-yellow-500/30 to-orange-500/30 border border-yellow-500/30'
            : tier.isPremiumClaimed
            ? 'bg-green-500/20'
            : 'bg-yellow-500/10'
        )}>
          {tier.isPremiumClaimed ? (
            <Check className="w-5 h-5 text-green-400" />
          ) : !isPremium ? (
            <Lock className="w-4 h-4 text-yellow-500/50" />
          ) : (
            <PremiumIcon className="w-5 h-5 text-yellow-400" />
          )}
        </div>
        <span className="text-[10px] text-yellow-400/70 text-center leading-tight">
          {tier.premiumReward.label}
        </span>

        {/* Premium lock overlay */}
        {!isPremium && (
          <div className="absolute top-1 right-1">
            <Crown className="w-3 h-3 text-yellow-500/40" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
