import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Share2,
  Copy,
  Check,
  X,
  Star,
  Trophy,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { formatChips } from '../game/gameEngine';
import { Card, HandRank } from '../types';
import { getHandRankName } from '../game/handRanking';
import { getSuitSymbol, getSuitColor } from '../game/deck';

// ---------- Types ----------

interface HandHighlight {
  id: string;
  playerName: string;
  cards: Card[];
  handRank: HandRank;
  potWon: number;
  variant: string;
  timestamp: Date;
  tableName: string;
}

interface GameClipShareProps {
  highlight?: HandHighlight;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

interface ShareTarget {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

// ---------- Constants ----------

const HAND_RANK_COLORS: Record<HandRank, { gradient: string; text: string; glow: string }> = {
  trail: {
    gradient: 'from-yellow-400 via-orange-400 to-red-500',
    text: 'text-yellow-400',
    glow: 'shadow-yellow-500/50',
  },
  pure_sequence: {
    gradient: 'from-purple-400 via-pink-500 to-red-500',
    text: 'text-purple-400',
    glow: 'shadow-purple-500/40',
  },
  sequence: {
    gradient: 'from-blue-400 via-cyan-400 to-teal-400',
    text: 'text-cyan-400',
    glow: 'shadow-cyan-500/40',
  },
  color: {
    gradient: 'from-emerald-400 to-green-500',
    text: 'text-emerald-400',
    glow: 'shadow-emerald-500/30',
  },
  pair: {
    gradient: 'from-orange-400 to-amber-500',
    text: 'text-orange-400',
    glow: 'shadow-orange-500/30',
  },
  high_card: {
    gradient: 'from-gray-400 to-slate-500',
    text: 'text-gray-400',
    glow: 'shadow-gray-500/20',
  },
};

const SHARE_TARGETS: ShareTarget[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
    color: 'text-green-500',
    bgColor: 'bg-green-500/10 hover:bg-green-500/20 border-green-500/20',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20',
  },
  {
    id: 'twitter',
    name: 'Twitter / X',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    color: 'text-white',
    bgColor: 'bg-white/10 hover:bg-white/20 border-white/20',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10 hover:bg-pink-500/20 border-pink-500/20',
  },
];

// ---------- Mock Best Hands ----------

const MOCK_BEST_HANDS: HandHighlight[] = [
  {
    id: '1',
    playerName: 'You',
    cards: [
      { suit: 'hearts', rank: 'A', value: 14 },
      { suit: 'hearts', rank: 'K', value: 13 },
      { suit: 'hearts', rank: 'Q', value: 12 },
    ],
    handRank: 'pure_sequence',
    potWon: 4500000,
    variant: 'Classic',
    timestamp: new Date(Date.now() - 3600000),
    tableName: 'Maharaja Suite',
  },
  {
    id: '2',
    playerName: 'You',
    cards: [
      { suit: 'spades', rank: 'A', value: 14 },
      { suit: 'hearts', rank: 'A', value: 14 },
      { suit: 'diamonds', rank: 'A', value: 14 },
    ],
    handRank: 'trail',
    potWon: 8200000,
    variant: 'Classic',
    timestamp: new Date(Date.now() - 86400000 * 2),
    tableName: 'Royal Rumble',
  },
  {
    id: '3',
    playerName: 'You',
    cards: [
      { suit: 'diamonds', rank: 'J', value: 11 },
      { suit: 'diamonds', rank: '10', value: 10 },
      { suit: 'diamonds', rank: '9', value: 9 },
    ],
    handRank: 'pure_sequence',
    potWon: 2100000,
    variant: 'Joker',
    timestamp: new Date(Date.now() - 86400000 * 5),
    tableName: 'Neon Nights',
  },
  {
    id: '4',
    playerName: 'You',
    cards: [
      { suit: 'clubs', rank: 'K', value: 13 },
      { suit: 'spades', rank: 'K', value: 13 },
      { suit: 'hearts', rank: 'K', value: 13 },
    ],
    handRank: 'trail',
    potWon: 6700000,
    variant: 'AK47',
    timestamp: new Date(Date.now() - 86400000 * 8),
    tableName: 'AK47 Arena',
  },
  {
    id: '5',
    playerName: 'You',
    cards: [
      { suit: 'spades', rank: 'Q', value: 12 },
      { suit: 'hearts', rank: 'J', value: 11 },
      { suit: 'diamonds', rank: '10', value: 10 },
    ],
    handRank: 'sequence',
    potWon: 1350000,
    variant: 'Classic',
    timestamp: new Date(Date.now() - 86400000 * 12),
    tableName: 'Chai Break Table',
  },
];

// ---------- Card Visual ----------

function MiniCard({ card }: { card: Card }) {
  const color = getSuitColor(card.suit);
  const symbol = getSuitSymbol(card.suit);

  return (
    <div
      className={cn(
        'w-14 h-20 rounded-xl bg-gradient-to-br border-2 flex flex-col items-center justify-center gap-0.5 shadow-lg',
        'from-white via-gray-50 to-gray-100 border-gray-200'
      )}
    >
      <span
        className={cn(
          'text-lg font-bold leading-none',
          color === 'red' ? 'text-red-600' : 'text-gray-900'
        )}
      >
        {card.rank}
      </span>
      <span
        className={cn(
          'text-xl leading-none',
          color === 'red' ? 'text-red-600' : 'text-gray-900'
        )}
      >
        {symbol}
      </span>
    </div>
  );
}

// ---------- Share Card Preview ----------

function ShareCardPreview({ highlight }: { highlight: HandHighlight }) {
  const rankConfig = HAND_RANK_COLORS[highlight.handRank];

  return (
    <div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-black" />

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-yellow-500/5 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-red-500/5 to-transparent rounded-full blur-3xl" />

      {/* Gold border accent */}
      <div className="absolute inset-0 rounded-3xl border border-yellow-500/20" />
      <div className="absolute inset-1 rounded-[22px] border border-yellow-500/10" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-between p-6 pt-8">
        {/* Top: Brand */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-700 flex items-center justify-center">
            <span className="text-[8px] font-bold text-red-900">TP</span>
          </div>
          <span className="text-white/40 text-xs font-medium tracking-wider uppercase">
            Teen Patti
          </span>
        </div>

        {/* Middle: Cards + Hand Rank */}
        <div className="flex flex-col items-center">
          {/* Cards */}
          <div className="flex gap-2 mb-4">
            {highlight.cards.map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20, rotateY: 90 }}
                animate={{ opacity: 1, y: 0, rotateY: 0 }}
                transition={{ delay: i * 0.15, type: 'spring' }}
              >
                <MiniCard card={card} />
              </motion.div>
            ))}
          </div>

          {/* Hand rank badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            className={cn(
              'px-4 py-1.5 rounded-full bg-gradient-to-r font-bold text-sm text-white shadow-lg',
              rankConfig.gradient,
              rankConfig.glow
            )}
          >
            {getHandRankName(highlight.handRank)}
          </motion.div>
        </div>

        {/* Bottom: Player + Pot */}
        <div className="w-full text-center">
          <p className="text-white font-semibold text-lg mb-0.5">
            {highlight.playerName}
          </p>
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 font-bold text-xl">
              +{formatChips(highlight.potWon)}
            </span>
          </div>
          <p className="text-white/30 text-xs">
            {highlight.tableName} &middot; {highlight.variant}
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------- Best Hands Gallery ----------

function BestHandsGallery() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollTo = (index: number) => {
    const clamped = Math.max(0, Math.min(index, MOCK_BEST_HANDS.length - 1));
    setCurrentIndex(clamped);
    if (scrollRef.current) {
      const child = scrollRef.current.children[clamped] as HTMLElement;
      child?.scrollIntoView({ behavior: 'smooth', inline: 'center' });
    }
  };

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-400" />
          <h3 className="text-sm font-bold text-white">Best Hands</h3>
          <span className="text-white/30 text-xs">Top {MOCK_BEST_HANDS.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => scrollTo(currentIndex - 1)}
            disabled={currentIndex === 0}
            className="p-1 rounded-lg bg-white/5 text-white/40 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scrollTo(currentIndex + 1)}
            disabled={currentIndex === MOCK_BEST_HANDS.length - 1}
            className="p-1 rounded-lg bg-white/5 text-white/40 disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
      >
        {MOCK_BEST_HANDS.map((hand, index) => {
          const rankConfig = HAND_RANK_COLORS[hand.handRank];
          return (
            <motion.div
              key={hand.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex-shrink-0 w-56 snap-center bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3 cursor-pointer hover:bg-white/[0.06] transition-colors"
            >
              {/* Rank badge */}
              <div className="flex items-center justify-between mb-2">
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r text-white',
                    rankConfig.gradient
                  )}
                >
                  {getHandRankName(hand.handRank).split('(')[0].trim()}
                </span>
                <span className="text-white/20 text-[10px]">
                  #{index + 1}
                </span>
              </div>

              {/* Cards row */}
              <div className="flex gap-1.5 mb-2 justify-center">
                {hand.cards.map((card, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-9 h-13 rounded-lg bg-white border border-gray-200 flex flex-col items-center justify-center',
                    )}
                  >
                    <span
                      className={cn(
                        'text-xs font-bold leading-none',
                        getSuitColor(card.suit) === 'red'
                          ? 'text-red-600'
                          : 'text-gray-900'
                      )}
                    >
                      {card.rank}
                    </span>
                    <span
                      className={cn(
                        'text-sm leading-none',
                        getSuitColor(card.suit) === 'red'
                          ? 'text-red-600'
                          : 'text-gray-900'
                      )}
                    >
                      {getSuitSymbol(card.suit)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Pot won */}
              <div className="flex items-center justify-center gap-1">
                <Trophy className="w-3 h-3 text-yellow-400" />
                <span className="text-yellow-400 text-xs font-bold">
                  +{formatChips(hand.potWon)}
                </span>
              </div>

              {/* Table + time */}
              <p className="text-white/20 text-[10px] text-center mt-1">
                {hand.tableName}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Main Component ----------

export function GameClipShare({
  highlight,
  isOpen,
  onClose,
  className,
}: GameClipShareProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [showGallery, setShowGallery] = useState(false);

  const activeHighlight = highlight || MOCK_BEST_HANDS[0];

  const handleShare = (targetId: string) => {
    const shareText = `Check out my ${getHandRankName(activeHighlight.handRank)} hand! Won ${formatChips(activeHighlight.potWon)} chips in Teen Patti!`;
    const shareUrl = 'https://teenpatti.app/hand/' + activeHighlight.id;

    switch (targetId) {
      case 'whatsapp':
        window.open(
          `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
          '_blank'
        );
        break;
      case 'telegram':
        window.open(
          `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
          '_blank'
        );
        break;
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
          '_blank'
        );
        break;
      case 'instagram':
        // Instagram doesn't have a direct share URL, just copy link
        handleCopyLink();
        break;
    }
  };

  const handleCopyLink = () => {
    const shareUrl = 'https://teenpatti.app/hand/' + activeHighlight.id;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
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
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-50"
          />

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
              'fixed bottom-0 left-0 right-0 z-50 max-h-[90vh] overflow-y-auto',
              'bg-gradient-to-b from-gray-900 to-black rounded-t-3xl',
              'border-t border-white/10',
              className
            )}
          >
            {/* Handle */}
            <div className="sticky top-0 z-10 bg-gradient-to-b from-gray-900 to-gray-900/95 backdrop-blur-xl pt-3 pb-2 px-4">
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-yellow-400" />
                  Share This Hand
                </h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>
            </div>

            <div className="px-4 pb-8">
              {/* Card preview */}
              <div className="mb-6">
                <ShareCardPreview highlight={activeHighlight} />
              </div>

              {/* Share targets */}
              <div className="mb-6">
                <h3 className="text-xs text-white/40 uppercase tracking-wider font-medium mb-3">
                  Share to
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  {SHARE_TARGETS.map((target) => (
                    <motion.button
                      key={target.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleShare(target.id)}
                      className={cn(
                        'flex flex-col items-center gap-2 p-3 rounded-2xl border transition-colors',
                        target.bgColor
                      )}
                    >
                      <span className={target.color}>{target.icon}</span>
                      <span className="text-[10px] text-white/60 font-medium">
                        {target.name}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Copy link */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleCopyLink}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-3 rounded-xl border transition-all',
                  copiedLink
                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                )}
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span className="text-sm font-medium">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span className="text-sm font-medium">Copy Link</span>
                  </>
                )}
              </motion.button>

              {/* Best Hands Gallery toggle */}
              <button
                onClick={() => setShowGallery(!showGallery)}
                className="w-full flex items-center justify-center gap-2 mt-4 py-2 text-sm text-white/40 hover:text-white/60 transition-colors"
              >
                <Star className="w-4 h-4" />
                {showGallery ? 'Hide' : 'Show'} Best Hands Gallery
                <ExternalLink className="w-3 h-3" />
              </button>

              {/* Gallery */}
              <AnimatePresence>
                {showGallery && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <BestHandsGallery />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
