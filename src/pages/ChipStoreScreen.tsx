import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Crown,
  Diamond,
  Gift,
  Star,
  Zap,
  Timer,
  Sparkles,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { formatChips } from '../game/gameEngine';

// --- Types ---

interface ChipPackage {
  id: string;
  price: number;
  chips: number;
  bonus?: number;
  badge?: 'best-value' | 'most-popular';
  highlight?: boolean;
}

interface DiamondPackage {
  id: string;
  price: number;
  diamonds: number;
  badge?: string;
}

interface SpecialOffer {
  id: string;
  title: string;
  description: string;
  originalPrice: number;
  salePrice: number;
  chips: number;
  diamonds?: number;
  endsAt: Date;
}

interface ChipStoreScreenProps {
  currentChips?: number;
  currentDiamonds?: number;
  isFirstPurchase?: boolean;
  onBack?: () => void;
  onPurchase?: (packageId: string, type: 'chips' | 'diamonds') => void;
}

// --- Data ---

const chipPackages: ChipPackage[] = [
  { id: 'chips-1', price: 10, chips: 1000 },
  { id: 'chips-2', price: 50, chips: 6000, badge: 'most-popular', highlight: true },
  { id: 'chips-3', price: 100, chips: 15000 },
  { id: 'chips-4', price: 500, chips: 100000, badge: 'best-value', highlight: true },
  { id: 'chips-5', price: 2000, chips: 500000 },
];

const diamondPackages: DiamondPackage[] = [
  { id: 'dia-1', price: 50, diamonds: 50 },
  { id: 'dia-2', price: 100, diamonds: 120, badge: 'Popular' },
  { id: 'dia-3', price: 500, diamonds: 700, badge: 'Best Value' },
  { id: 'dia-4', price: 2000, diamonds: 3200 },
];

const specialOffers: SpecialOffer[] = [
  {
    id: 'offer-1',
    title: 'Starter Pack',
    description: 'Perfect for new players',
    originalPrice: 199,
    salePrice: 49,
    chips: 25000,
    diamonds: 30,
    endsAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
  },
  {
    id: 'offer-2',
    title: 'Mega Deal',
    description: 'Limited time only!',
    originalPrice: 999,
    salePrice: 299,
    chips: 200000,
    diamonds: 100,
    endsAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
  },
];

// --- Helpers ---

function getStackCount(chips: number): number {
  if (chips >= 500000) return 8;
  if (chips >= 100000) return 6;
  if (chips >= 15000) return 5;
  if (chips >= 6000) return 4;
  if (chips >= 1000) return 3;
  return 2;
}

function getChipGradient(chips: number): string {
  if (chips >= 500000) return 'from-yellow-400 via-amber-500 to-orange-600';
  if (chips >= 100000) return 'from-purple-400 via-purple-500 to-purple-700';
  if (chips >= 15000) return 'from-red-400 via-red-500 to-red-700';
  if (chips >= 6000) return 'from-blue-400 via-blue-500 to-blue-700';
  return 'from-green-400 via-green-500 to-green-700';
}

function useCountdownTimer(endTime: Date) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    function update() {
      const diff = endTime.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('Expired');
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  return timeLeft;
}

// --- Sub-components ---

function VisualChipStack({ chips, size = 'md' }: { chips: number; size?: 'sm' | 'md' }) {
  const count = getStackCount(chips);
  const gradient = getChipGradient(chips);
  const chipSize = size === 'sm' ? 'w-5 h-5' : 'w-7 h-7';
  const offset = size === 'sm' ? 3 : 4;

  return (
    <div className="relative flex items-end justify-center" style={{ height: count * offset + (size === 'sm' ? 20 : 28) }}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className={cn(
            'absolute rounded-full bg-gradient-to-b shadow-md border border-white/20',
            gradient,
            chipSize,
          )}
          style={{ bottom: i * offset }}
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: i * 0.04, type: 'spring', stiffness: 500, damping: 25 }}
        >
          <div className="absolute inset-1 rounded-full border border-dashed border-white/30" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/25 to-transparent" />
        </motion.div>
      ))}
    </div>
  );
}

function BadgeLabel({ type }: { type: 'best-value' | 'most-popular' }) {
  const isBest = type === 'best-value';
  return (
    <motion.div
      initial={{ scale: 0, rotate: -12 }}
      animate={{ scale: 1, rotate: -6 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      className={cn(
        'absolute -top-2.5 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide z-10 shadow-lg',
        isBest
          ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black'
          : 'bg-gradient-to-r from-pink-500 to-rose-600 text-white',
      )}
    >
      {isBest ? 'Best Value' : 'Popular'}
    </motion.div>
  );
}

function ChipPackageCard({
  pkg,
  isFirstPurchase,
  index,
  onPurchase,
}: {
  pkg: ChipPackage;
  isFirstPurchase: boolean;
  index: number;
  onPurchase?: (id: string) => void;
}) {
  const displayChips = isFirstPurchase ? pkg.chips * 3 : pkg.chips;

  return (
    <motion.button
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, type: 'spring', stiffness: 300, damping: 25 }}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onPurchase?.(pkg.id)}
      className={cn(
        'relative flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all',
        pkg.highlight
          ? 'bg-gradient-to-b from-yellow-900/40 via-gray-800/80 to-gray-900 border-yellow-500/50 shadow-lg shadow-yellow-500/10'
          : 'bg-gradient-to-b from-gray-800/60 to-gray-900 border-white/10 hover:border-white/20',
      )}
    >
      {pkg.badge && <BadgeLabel type={pkg.badge} />}

      {/* First purchase bonus */}
      {isFirstPurchase && (
        <div className="absolute -top-2.5 left-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white text-[9px] font-bold uppercase shadow-md">
          3x Bonus!
        </div>
      )}

      {/* Visual chip stack */}
      <VisualChipStack chips={pkg.chips} />

      {/* Chip amount */}
      <div className="text-center">
        <span className="text-lg font-bold text-white">{formatChips(displayChips)}</span>
        {isFirstPurchase && (
          <div className="flex items-center justify-center gap-1 mt-0.5">
            <span className="text-xs text-gray-400 line-through">{formatChips(pkg.chips)}</span>
            <Sparkles size={10} className="text-green-400" />
          </div>
        )}
      </div>

      {/* Price */}
      <div className={cn(
        'w-full py-1.5 rounded-xl text-center font-bold text-sm',
        pkg.highlight
          ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-black'
          : 'bg-white/10 text-white',
      )}>
        ₹{pkg.price}
      </div>
    </motion.button>
  );
}

function DiamondPackageCard({
  pkg,
  index,
  onPurchase,
}: {
  pkg: DiamondPackage;
  index: number;
  onPurchase?: (id: string) => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 + 0.2, type: 'spring', stiffness: 300, damping: 25 }}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onPurchase?.(pkg.id)}
      className="relative flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-500/20 hover:border-cyan-400/40 transition-all"
    >
      {pkg.badge && (
        <span className="absolute -top-2 right-2 px-2 py-0.5 rounded-full bg-cyan-500 text-black text-[9px] font-bold uppercase">
          {pkg.badge}
        </span>
      )}

      {/* Diamond icon */}
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
        <Diamond size={20} className="text-white" />
      </div>

      <div className="flex-1 text-left">
        <span className="text-base font-bold text-white">{pkg.diamonds}</span>
        <span className="text-xs text-cyan-300/70 ml-1">diamonds</span>
      </div>

      <div className="px-3 py-1.5 rounded-lg bg-white/10 text-white font-bold text-sm">
        ₹{pkg.price}
      </div>
    </motion.button>
  );
}

function OfferCountdown({ endTime }: { endTime: Date }) {
  const timeLeft = useCountdownTimer(endTime);

  return (
    <div className="flex items-center gap-1 text-xs">
      <Timer size={12} className="text-orange-400" />
      <span className="text-orange-300 font-mono font-bold">{timeLeft}</span>
    </div>
  );
}

function SpecialOfferCard({
  offer,
  index,
  onPurchase,
}: {
  offer: SpecialOffer;
  index: number;
  onPurchase?: (id: string) => void;
}) {
  const discount = Math.round((1 - offer.salePrice / offer.originalPrice) * 100);

  return (
    <motion.button
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.12, type: 'spring', stiffness: 300, damping: 25 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onPurchase?.(offer.id)}
      className="relative flex-shrink-0 w-64 p-4 rounded-2xl bg-gradient-to-br from-orange-900/40 via-red-900/30 to-gray-900 border border-orange-500/30 overflow-hidden"
    >
      {/* Discount badge */}
      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
        -{discount}%
      </div>

      {/* Animated background glow */}
      <motion.div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-orange-500/10 blur-2xl"
        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ repeat: Infinity, duration: 3 }}
      />

      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <Gift size={16} className="text-orange-400" />
          <span className="text-sm font-bold text-white">{offer.title}</span>
        </div>
        <p className="text-xs text-gray-400 mb-3">{offer.description}</p>

        {/* Rewards */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded-full bg-gradient-to-b from-yellow-400 to-amber-600 border border-white/20" />
            <span className="text-sm font-bold text-yellow-400">{formatChips(offer.chips)}</span>
          </div>
          {offer.diamonds && (
            <div className="flex items-center gap-1">
              <Diamond size={14} className="text-cyan-400" />
              <span className="text-sm font-bold text-cyan-400">{offer.diamonds}</span>
            </div>
          )}
        </div>

        {/* Price and timer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">₹{offer.salePrice}</span>
            <span className="text-xs text-gray-500 line-through">₹{offer.originalPrice}</span>
          </div>
          <OfferCountdown endTime={offer.endsAt} />
        </div>
      </div>
    </motion.button>
  );
}

// --- Tabs ---

type StoreTab = 'chips' | 'diamonds' | 'offers';

// --- Main Component ---

export function ChipStoreScreen({
  currentChips = 50000,
  currentDiamonds = 120,
  isFirstPurchase = true,
  onBack,
  onPurchase,
}: ChipStoreScreenProps) {
  const [activeTab, setActiveTab] = useState<StoreTab>('chips');

  const tabs: { id: StoreTab; label: string; icon: React.ReactNode }[] = [
    { id: 'chips', label: 'Chips', icon: <Star size={14} /> },
    { id: 'diamonds', label: 'Diamonds', icon: <Diamond size={14} /> },
    { id: 'offers', label: 'Offers', icon: <Zap size={14} /> },
  ];

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white">
      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative px-4 pt-6 pb-4 flex items-center justify-between z-10"
      >
        {/* Back button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"
        >
          <ArrowLeft size={18} />
        </motion.button>

        {/* Title */}
        <div className="flex items-center gap-2">
          <Crown size={20} className="text-yellow-500" />
          <span className="text-lg font-bold">Store</span>
        </div>

        {/* Current balance */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
            <div className="w-3 h-3 rounded-full bg-gradient-to-b from-yellow-400 to-amber-600" />
            <span className="font-bold text-yellow-400">{formatChips(currentChips)}</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
            <Diamond size={10} className="text-cyan-400" />
            <span className="font-bold text-cyan-400">{currentDiamonds}</span>
          </div>
        </div>
      </motion.header>

      {/* First purchase banner */}
      <AnimatePresence>
        {isFirstPurchase && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mx-4 mb-3 overflow-hidden"
          >
            <div className="p-3 rounded-xl bg-gradient-to-r from-green-900/40 to-emerald-900/40 border border-green-500/30 flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="flex-shrink-0"
              >
                <Gift size={24} className="text-green-400" />
              </motion.div>
              <div>
                <span className="text-sm font-bold text-green-300">First Purchase Bonus!</span>
                <p className="text-xs text-green-400/70">Get 3x chips on your first purchase</p>
              </div>
              <Sparkles size={16} className="text-green-400 ml-auto" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab bar */}
      <div className="px-4 mb-4">
        <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/5">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-colors',
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-400 border border-yellow-500/20'
                  : 'text-gray-500 hover:text-gray-300',
              )}
              whileTap={{ scale: 0.95 }}
            >
              {tab.icon}
              {tab.label}
              {tab.id === 'offers' && (
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        <AnimatePresence mode="wait">
          {activeTab === 'chips' && (
            <motion.div
              key="chips"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Section header */}
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={14} className="text-yellow-500" />
                <span className="text-sm font-bold text-gray-300">Chip Packages</span>
              </div>

              {/* Chip packages grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {chipPackages.slice(0, 4).map((pkg, i) => (
                  <ChipPackageCard
                    key={pkg.id}
                    pkg={pkg}
                    isFirstPurchase={isFirstPurchase}
                    index={i}
                    onPurchase={(id) => onPurchase?.(id, 'chips')}
                  />
                ))}
              </div>

              {/* Premium package - full width */}
              {chipPackages.slice(4).map((pkg) => (
                <motion.button
                  key={pkg.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, type: 'spring', stiffness: 300, damping: 25 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onPurchase?.(pkg.id, 'chips')}
                  className="w-full p-4 mb-6 rounded-2xl bg-gradient-to-r from-yellow-900/30 via-amber-900/20 to-yellow-900/30 border border-yellow-500/40 flex items-center gap-4 relative overflow-hidden"
                >
                  {/* Premium glow */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/5 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                  />

                  <div className="relative flex-shrink-0">
                    <VisualChipStack chips={pkg.chips} />
                  </div>
                  <div className="relative flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <Crown size={14} className="text-yellow-500" />
                      <span className="text-xs text-yellow-500 font-bold uppercase">Premium</span>
                    </div>
                    <span className="text-xl font-bold text-white block">
                      {formatChips(isFirstPurchase ? pkg.chips * 3 : pkg.chips)} Chips
                    </span>
                    {isFirstPurchase && (
                      <span className="text-xs text-gray-400 line-through">{formatChips(pkg.chips)}</span>
                    )}
                  </div>
                  <div className="relative px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold">
                    ₹{pkg.price}
                  </div>
                </motion.button>
              ))}

              {/* Security info */}
              <div className="flex items-center justify-center gap-2 text-[10px] text-gray-600">
                <ShieldCheck size={12} />
                <span>Secure payment processing</span>
              </div>
            </motion.div>
          )}

          {activeTab === 'diamonds' && (
            <motion.div
              key="diamonds"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Header */}
              <div className="flex items-center gap-2 mb-2">
                <Diamond size={14} className="text-cyan-400" />
                <span className="text-sm font-bold text-gray-300">Diamond Packages</span>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Use diamonds for exclusive avatar frames, table themes, and emotes.
              </p>

              {/* Diamond packages */}
              <div className="flex flex-col gap-3">
                {diamondPackages.map((pkg, i) => (
                  <DiamondPackageCard
                    key={pkg.id}
                    pkg={pkg}
                    index={i}
                    onPurchase={(id) => onPurchase?.(id, 'diamonds')}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'offers' && (
            <motion.div
              key="offers"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Header */}
              <div className="flex items-center gap-2 mb-4">
                <Zap size={14} className="text-orange-400" />
                <span className="text-sm font-bold text-gray-300">Special Offers</span>
                <span className="ml-auto text-[10px] text-orange-400/70 uppercase font-bold">Limited Time</span>
              </div>

              {/* Horizontal scrolling offers */}
              <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                {specialOffers.map((offer, i) => (
                  <SpecialOfferCard
                    key={offer.id}
                    offer={offer}
                    index={i}
                    onPurchase={(id) => onPurchase?.(id, 'chips')}
                  />
                ))}
              </div>

              {/* Daily free chips */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-500/20"
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20"
                  >
                    <Gift size={20} className="text-white" />
                  </motion.div>
                  <div className="flex-1">
                    <span className="text-sm font-bold text-white">Free Daily Chips</span>
                    <p className="text-xs text-gray-400">Watch an ad to earn 500 free chips</p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    className="px-4 py-2 rounded-xl bg-purple-500 text-white text-sm font-bold"
                  >
                    Claim
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
