import { motion } from 'framer-motion';
import { Card, Suit } from '../types';
import { getSuitSymbol, getSuitColor } from '../game/deck';
import { cn } from '../utils/cn';

interface PlayingCardProps {
  card?: Card;
  isHidden?: boolean;
  isSelected?: boolean;
  size?: 'sm' | 'md' | 'lg';
  delay?: number;
  onSelect?: () => void;
  className?: string;
}

const sizeClasses = {
  sm: 'w-12 h-16 text-xs',
  md: 'w-16 h-22 text-sm',
  lg: 'w-20 h-28 text-base'
};

const SuitIcon = ({ suit, className }: { suit: Suit; className?: string }) => {
  const symbols: Record<Suit, JSX.Element> = {
    hearts: (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
    ),
    diamonds: (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2L2 12l10 10 10-10L12 2z"/>
      </svg>
    ),
    clubs: (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2C9.24 2 7 4.24 7 7c0 1.63.78 3.07 2 3.97V13H7v2h2v3h2v-3h2v-2h-2v-2.03c1.22-.9 2-2.34 2-3.97 0-2.76-2.24-5-5-5zm-5 10c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm10 0c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
      </svg>
    ),
    spades: (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2C8 6 4 9.5 4 13.5c0 2.5 2 4.5 4.5 4.5 1.5 0 2.7-.7 3.5-1.8V22h-2v-2H8v2h8v-2h-2v2h-2v-5.8c.8 1.1 2 1.8 3.5 1.8 2.5 0 4.5-2 4.5-4.5C20 9.5 16 6 12 2z"/>
      </svg>
    )
  };
  return symbols[suit];
};

export function PlayingCard({
  card,
  isHidden = false,
  isSelected = false,
  size = 'md',
  delay = 0,
  onSelect,
  className
}: PlayingCardProps) {
  const color = card ? getSuitColor(card.suit) : 'black';

  return (
    <motion.div
      initial={{ rotateY: 180, scale: 0.8, opacity: 0 }}
      animate={{
        rotateY: isHidden ? 180 : 0,
        scale: isSelected ? 1.1 : 1,
        opacity: 1,
        y: isSelected ? -10 : 0
      }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 20,
        delay
      }}
      whileHover={onSelect ? { scale: 1.05, y: -5 } : undefined}
      whileTap={onSelect ? { scale: 0.98 } : undefined}
      onClick={onSelect}
      className={cn(
        'relative rounded-xl cursor-pointer select-none',
        'transform-gpu preserve-3d perspective-1000',
        sizeClasses[size],
        onSelect && 'hover:shadow-2xl',
        className
      )}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Card Back */}
      <div
        className={cn(
          'absolute inset-0 rounded-xl backface-hidden',
          'bg-gradient-to-br from-red-900 via-red-800 to-red-900',
          'border-2 border-yellow-600/50',
          'shadow-lg overflow-hidden'
        )}
        style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}
      >
        {/* Ornate pattern */}
        <div className="absolute inset-2 rounded-lg border border-yellow-500/30 overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(212,175,55,0.3)_100%)]" />
            {/* Mandala-like pattern */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
              <pattern id="cardPattern" patternUnits="userSpaceOnUse" width="20" height="20">
                <circle cx="10" cy="10" r="8" fill="none" stroke="rgba(212,175,55,0.4)" strokeWidth="0.5" />
                <circle cx="10" cy="10" r="4" fill="none" stroke="rgba(212,175,55,0.3)" strokeWidth="0.5" />
              </pattern>
              <rect width="100" height="100" fill="url(#cardPattern)" />
            </svg>
          </div>
          {/* Center emblem */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-700 flex items-center justify-center shadow-inner">
              <span className="text-red-900 font-bold text-xs">TP</span>
            </div>
          </div>
        </div>
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent" />
      </div>

      {/* Card Front */}
      <div
        className={cn(
          'absolute inset-0 rounded-xl backface-hidden',
          'bg-gradient-to-br from-white via-gray-50 to-gray-100',
          'border border-gray-200',
          'shadow-lg overflow-hidden'
        )}
        style={{ backfaceVisibility: 'hidden' }}
      >
        {card && (
          <>
            {/* Top left corner */}
            <div className={cn(
              'absolute top-1 left-1.5 flex flex-col items-center',
              color === 'red' ? 'text-red-600' : 'text-gray-900'
            )}>
              <span className="font-bold leading-none">{card.rank}</span>
              <SuitIcon suit={card.suit} className="w-3 h-3" />
            </div>

            {/* Center suit */}
            <div className="absolute inset-0 flex items-center justify-center">
              <SuitIcon
                suit={card.suit}
                className={cn(
                  'w-8 h-8 opacity-90',
                  color === 'red' ? 'text-red-600' : 'text-gray-900'
                )}
              />
            </div>

            {/* Bottom right corner (rotated) */}
            <div className={cn(
              'absolute bottom-1 right-1.5 flex flex-col items-center rotate-180',
              color === 'red' ? 'text-red-600' : 'text-gray-900'
            )}>
              <span className="font-bold leading-none">{card.rank}</span>
              <SuitIcon suit={card.suit} className="w-3 h-3" />
            </div>

            {/* Subtle texture */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_rgba(255,255,255,0.8)_0%,_transparent_50%)]" />
          </>
        )}
      </div>

      {/* Selection glow */}
      {isSelected && (
        <motion.div
          className="absolute -inset-1 rounded-xl bg-yellow-400/50 blur-md -z-10"
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
      )}
    </motion.div>
  );
}

// Card fan display for player hand
interface CardFanProps {
  cards: Card[];
  isHidden?: boolean;
  showOnHover?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function CardFan({ cards, isHidden = false, showOnHover = false, size = 'md' }: CardFanProps) {
  const spreadAngle = 15;
  const spreadOffset = size === 'sm' ? 8 : size === 'md' ? 12 : 16;

  return (
    <motion.div
      className="relative flex items-center justify-center"
      whileHover={showOnHover ? 'hover' : undefined}
    >
      {cards.map((card, index) => {
        const angle = (index - 1) * spreadAngle;
        const xOffset = (index - 1) * spreadOffset;

        return (
          <motion.div
            key={`${card.suit}-${card.rank}-${index}`}
            className="absolute"
            initial={{ rotate: 0, x: 0 }}
            animate={{ rotate: angle, x: xOffset }}
            variants={showOnHover ? {
              hover: { rotate: 0, x: (index - 1) * (spreadOffset * 2), y: -10 }
            } : undefined}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{ zIndex: index }}
          >
            <PlayingCard
              card={card}
              isHidden={isHidden}
              size={size}
              delay={index * 0.1}
            />
          </motion.div>
        );
      })}
    </motion.div>
  );
}

// Deck component for visual display
export function CardDeck({ cardsRemaining = 52 }: { cardsRemaining?: number }) {
  const stackCount = Math.min(5, Math.ceil(cardsRemaining / 10));

  return (
    <div className="relative">
      {Array.from({ length: stackCount }).map((_, index) => (
        <motion.div
          key={index}
          className="absolute"
          style={{
            top: -index * 2,
            left: -index * 1,
            zIndex: stackCount - index
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <PlayingCard isHidden size="md" />
        </motion.div>
      ))}
      {/* Card count badge */}
      <motion.div
        className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-xs font-bold text-red-900 shadow-lg z-10"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.3 }}
      >
        {cardsRemaining}
      </motion.div>
    </div>
  );
}
