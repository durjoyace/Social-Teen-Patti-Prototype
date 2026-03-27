import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Diamond, Coins, Gift } from 'lucide-react';
import { cn } from '../utils/cn';
import { formatChips } from '../game/gameEngine';

// ── Types ────────────────────────────────────────────────────────────────────

export type GiftCategory = 'free' | 'premium' | 'chips';

export type GiftAnimationType = 'float' | 'explode' | 'sparkle' | 'bounce' | 'spin' | 'rain' | 'shake' | 'pulse';

export interface GiftItem {
  id: string;
  emoji: string;
  name: string;
  category: GiftCategory;
  cost: number; // 0 for free, diamonds for premium, chips for chip gifts
  animation: GiftAnimationType;
}

export interface GiftRecipient {
  id: string;
  username: string;
  avatarUrl?: string | null;
  seatPosition: number;
}

export interface GiftOverlayProps {
  isOpen: boolean;
  recipients?: GiftRecipient[];
  selectedRecipientId?: string | null;
  userDiamonds?: number;
  userChips?: number;
  onSelectRecipient?: (recipientId: string) => void;
  onSendGift?: (giftId: string, recipientId: string) => void;
  onClose: () => void;
}

// ── Gift Data ────────────────────────────────────────────────────────────────

const GIFTS: GiftItem[] = [
  // Free
  { id: 'clap', emoji: '👏', name: 'Clap', category: 'free', cost: 0, animation: 'bounce' },
  { id: 'heart', emoji: '❤️', name: 'Heart', category: 'free', cost: 0, animation: 'float' },
  { id: 'thumbsup', emoji: '👍', name: 'Thumbs Up', category: 'free', cost: 0, animation: 'bounce' },
  { id: 'fire', emoji: '🔥', name: 'Fire', category: 'free', cost: 0, animation: 'shake' },
  // Premium
  { id: 'beer', emoji: '🍺', name: 'Beer', category: 'premium', cost: 5, animation: 'float' },
  { id: 'cake', emoji: '🎂', name: 'Cake', category: 'premium', cost: 10, animation: 'sparkle' },
  { id: 'ring', emoji: '💍', name: 'Diamond Ring', category: 'premium', cost: 50, animation: 'explode' },
  { id: 'crown', emoji: '👑', name: 'Crown', category: 'premium', cost: 100, animation: 'rain' },
  { id: 'rocket', emoji: '🚀', name: 'Rocket', category: 'premium', cost: 25, animation: 'float' },
  { id: 'star', emoji: '⭐', name: 'Star', category: 'premium', cost: 15, animation: 'spin' },
  { id: 'trophy', emoji: '🏆', name: 'Trophy', category: 'premium', cost: 75, animation: 'explode' },
  { id: 'gem', emoji: '💎', name: 'Gem', category: 'premium', cost: 200, animation: 'sparkle' },
  // Chip gifts
  { id: 'chips1k', emoji: '🪙', name: '1K Chips', category: 'chips', cost: 1000, animation: 'rain' },
  { id: 'chips5k', emoji: '💰', name: '5K Chips', category: 'chips', cost: 5000, animation: 'explode' },
  { id: 'chips10k', emoji: '💎', name: '10K Chips', category: 'chips', cost: 10000, animation: 'sparkle' },
  { id: 'chips50k', emoji: '👑', name: '50K Chips', category: 'chips', cost: 50000, animation: 'explode' },
];

const MOCK_RECIPIENTS: GiftRecipient[] = [
  { id: 'p1', username: 'RahulK', avatarUrl: null, seatPosition: 0 },
  { id: 'p2', username: 'PriyaS', avatarUrl: null, seatPosition: 1 },
  { id: 'p3', username: 'AmitS', avatarUrl: null, seatPosition: 2 },
  { id: 'p4', username: 'NehaG', avatarUrl: null, seatPosition: 3 },
];

const CATEGORIES: { id: GiftCategory; label: string; icon: typeof Gift }[] = [
  { id: 'free', label: 'Free', icon: Gift },
  { id: 'premium', label: 'Premium', icon: Diamond },
  { id: 'chips', label: 'Chips', icon: Coins },
];

// ── Animation Configs ────────────────────────────────────────────────────────

function getAnimationVariants(type: GiftAnimationType) {
  switch (type) {
    case 'float':
      return {
        initial: { y: 0, opacity: 1, scale: 1 },
        animate: { y: -120, opacity: 0, scale: 1.5 },
        transition: { duration: 1.5, ease: 'easeOut' },
      };
    case 'explode':
      return {
        initial: { scale: 0.5, opacity: 1 },
        animate: { scale: [0.5, 2.5, 0], opacity: [1, 1, 0] },
        transition: { duration: 1.2, times: [0, 0.6, 1] },
      };
    case 'sparkle':
      return {
        initial: { scale: 0, rotate: 0, opacity: 1 },
        animate: { scale: [0, 1.5, 1.2, 1.5, 0], rotate: [0, 90, 180, 270, 360], opacity: [0, 1, 1, 1, 0] },
        transition: { duration: 1.8, times: [0, 0.25, 0.5, 0.75, 1] },
      };
    case 'bounce':
      return {
        initial: { y: 0, opacity: 1, scale: 1 },
        animate: { y: [-20, 0, -15, 0, -8, 0], opacity: [1, 1, 1, 1, 1, 0], scale: [1.2, 1, 1.1, 1, 1.05, 0.8] },
        transition: { duration: 1.5, times: [0, 0.2, 0.4, 0.6, 0.8, 1] },
      };
    case 'spin':
      return {
        initial: { rotate: 0, scale: 1, opacity: 1 },
        animate: { rotate: 720, scale: [1, 1.5, 0], opacity: [1, 1, 0] },
        transition: { duration: 1.4, ease: 'easeInOut' },
      };
    case 'rain':
      return {
        initial: { y: -40, opacity: 0, scale: 0.5 },
        animate: { y: [0, 20], opacity: [1, 0], scale: [1.5, 0.5] },
        transition: { duration: 1.6, ease: 'easeIn' },
      };
    case 'shake':
      return {
        initial: { x: 0, opacity: 1, scale: 1 },
        animate: { x: [-5, 5, -5, 5, -3, 3, 0], opacity: [1, 1, 1, 1, 1, 1, 0], scale: [1, 1.1, 1.1, 1.2, 1.2, 1.3, 0] },
        transition: { duration: 1.2 },
      };
    case 'pulse':
      return {
        initial: { scale: 1, opacity: 1 },
        animate: { scale: [1, 1.3, 1, 1.3, 0], opacity: [1, 1, 1, 1, 0] },
        transition: { duration: 1.5 },
      };
  }
}

// ── Component ────────────────────────────────────────────────────────────────

export function GiftOverlay({
  isOpen,
  recipients = MOCK_RECIPIENTS,
  selectedRecipientId: externalRecipientId,
  userDiamonds = 250,
  userChips = 125000,
  onSelectRecipient,
  onSendGift,
  onClose,
}: GiftOverlayProps) {
  const [selectedCategory, setSelectedCategory] = useState<GiftCategory>('free');
  const [internalRecipientId, setInternalRecipientId] = useState<string | null>(recipients[0]?.id ?? null);
  const [flyingGift, setFlyingGift] = useState<{ gift: GiftItem; recipientId: string } | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const selectedRecipientId = externalRecipientId ?? internalRecipientId;

  const handleSelectRecipient = (id: string) => {
    setInternalRecipientId(id);
    onSelectRecipient?.(id);
  };

  const categoryGifts = GIFTS.filter((g) => g.category === selectedCategory);

  const handleSendGift = useCallback((gift: GiftItem) => {
    if (!selectedRecipientId) return;

    // Check affordability
    if (gift.category === 'premium' && gift.cost > userDiamonds) return;
    if (gift.category === 'chips' && gift.cost > userChips) return;

    const recipient = recipients.find((r) => r.id === selectedRecipientId);

    // Trigger flying animation
    setFlyingGift({ gift, recipientId: selectedRecipientId });
    setTimeout(() => {
      setFlyingGift(null);
      // Show notification
      setNotification(`${gift.emoji} ${gift.name} sent to ${recipient?.username ?? 'player'}!`);
      setTimeout(() => setNotification(null), 2000);
    }, 1500);

    onSendGift?.(gift.id, selectedRecipientId);
  }, [selectedRecipientId, recipients, userDiamonds, userChips, onSendGift]);

  const canAfford = (gift: GiftItem): boolean => {
    if (gift.category === 'free') return true;
    if (gift.category === 'premium') return userDiamonds >= gift.cost;
    return userChips >= gift.cost;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Flying gift animation */}
          <AnimatePresence>
            {flyingGift && (
              <motion.div
                key="flying-gift"
                className="fixed inset-0 z-[60] pointer-events-none flex items-center justify-center"
              >
                <motion.div
                  {...getAnimationVariants(flyingGift.gift.animation)}
                  className="text-6xl"
                >
                  {flyingGift.gift.emoji}
                </motion.div>

                {/* Sparkle particles */}
                {['sparkle', 'explode', 'rain'].includes(flyingGift.gift.animation) && (
                  <>
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ x: 0, y: 0, opacity: 1, scale: 0.5 }}
                        animate={{
                          x: Math.cos((i * Math.PI) / 4) * 100,
                          y: Math.sin((i * Math.PI) / 4) * 100,
                          opacity: 0,
                          scale: 0,
                        }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="absolute text-2xl"
                      >
                        <Sparkles className="w-4 h-4 text-yellow-400" />
                      </motion.div>
                    ))}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Notification popup */}
          <AnimatePresence>
            {notification && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                className="fixed top-8 left-1/2 -translate-x-1/2 z-[70] px-5 py-3 rounded-2xl bg-gradient-to-r from-yellow-500/90 to-orange-500/90 backdrop-blur-md text-white text-sm font-medium shadow-2xl shadow-orange-500/30"
              >
                {notification}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-50"
          >
            <div className="bg-gradient-to-b from-gray-900/98 to-black/98 backdrop-blur-xl rounded-t-3xl border-t border-white/10">
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-4 pb-3">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-yellow-400" />
                  <h3 className="text-white font-bold">Send Gift</h3>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-xs">
                    <Diamond className="w-3 h-3 text-cyan-400" />
                    <span className="text-cyan-400 font-bold">{userDiamonds}</span>
                  </div>
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-xs">
                    <Coins className="w-3 h-3 text-yellow-400" />
                    <span className="text-yellow-400 font-bold">{formatChips(userChips)}</span>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4 text-white/60" />
                  </button>
                </div>
              </div>

              {/* Recipients */}
              <div className="flex gap-3 px-4 pb-3 overflow-x-auto scrollbar-hide">
                {recipients.map((recipient) => (
                  <motion.button
                    key={recipient.id}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleSelectRecipient(recipient.id)}
                    className={cn(
                      'flex flex-col items-center gap-1 min-w-[56px] transition-all',
                      selectedRecipientId === recipient.id ? 'opacity-100' : 'opacity-50'
                    )}
                  >
                    <div className={cn(
                      'w-11 h-11 rounded-full bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center text-sm font-bold text-white transition-all',
                      selectedRecipientId === recipient.id
                        ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-gray-900'
                        : ''
                    )}>
                      {recipient.avatarUrl ? (
                        <img src={recipient.avatarUrl} alt={recipient.username} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        recipient.username[0]
                      )}
                    </div>
                    <span className="text-[10px] text-white/70 truncate max-w-[56px]">{recipient.username}</span>
                  </motion.button>
                ))}
              </div>

              {/* Category tabs */}
              <div className="flex gap-1 mx-4 p-1 bg-white/5 rounded-xl mb-3">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all',
                        selectedCategory === cat.id
                          ? 'bg-white/10 text-white'
                          : 'text-white/50 hover:text-white/70'
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {/* Gift grid */}
              <div className="grid grid-cols-4 gap-2.5 px-4 pb-6 max-h-[240px] overflow-y-auto">
                {categoryGifts.map((gift, index) => {
                  const affordable = canAfford(gift);
                  return (
                    <motion.button
                      key={gift.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.04 }}
                      whileHover={{ scale: affordable ? 1.05 : 1 }}
                      whileTap={{ scale: affordable ? 0.9 : 1 }}
                      onClick={() => affordable && handleSendGift(gift)}
                      disabled={!affordable || !selectedRecipientId}
                      className={cn(
                        'flex flex-col items-center gap-1 p-3 rounded-2xl transition-all',
                        affordable && selectedRecipientId
                          ? 'bg-white/5 hover:bg-white/10 active:bg-white/15'
                          : 'bg-white/5 opacity-40'
                      )}
                    >
                      <span className="text-3xl">{gift.emoji}</span>
                      <span className="text-[10px] text-white/70 truncate max-w-full">{gift.name}</span>
                      {gift.category === 'free' ? (
                        <span className="text-[10px] text-green-400 font-medium">FREE</span>
                      ) : gift.category === 'premium' ? (
                        <span className="text-[10px] text-cyan-400 font-medium flex items-center gap-0.5">
                          <Diamond className="w-2.5 h-2.5" />
                          {gift.cost}
                        </span>
                      ) : (
                        <span className="text-[10px] text-yellow-400 font-medium">
                          {formatChips(gift.cost)}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
