import { motion, AnimatePresence } from 'framer-motion';
import { Card, Suit } from '../types';
import { cn } from '../utils/cn';
import { useCallback, useId } from 'react';

// ─── Size System ──────────────────────────────────────────────────────────────

type CardSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZES: Record<CardSize, { w: number; h: number; fontSize: number; cornerSize: number; suitCenter: number; borderRadius: number }> = {
  xs: { w: 28, h: 39, fontSize: 5, cornerSize: 4, suitCenter: 10, borderRadius: 3 },
  sm: { w: 36, h: 50, fontSize: 6, cornerSize: 5, suitCenter: 14, borderRadius: 4 },
  md: { w: 48, h: 67, fontSize: 8, cornerSize: 7, suitCenter: 18, borderRadius: 5 },
  lg: { w: 64, h: 89, fontSize: 10, cornerSize: 9, suitCenter: 24, borderRadius: 6 },
  xl: { w: 80, h: 112, fontSize: 13, cornerSize: 11, suitCenter: 30, borderRadius: 8 },
};

// ─── Suit Color Gradients ─────────────────────────────────────────────────────

const SUIT_GRADIENTS: Record<Suit, [string, string]> = {
  hearts: ['#dc2626', '#991b1b'],
  diamonds: ['#dc2626', '#b91c1c'],
  clubs: ['#1f2937', '#111827'],
  spades: ['#1f2937', '#030712'],
};

// ─── SVG Suit Symbols ─────────────────────────────────────────────────────────

function SuitSVG({ suit, size, gradientId }: { suit: Suit; size: number; gradientId: string }) {
  const [c1, c2] = SUIT_GRADIENTS[suit];
  const paths: Record<Suit, string> = {
    hearts:
      'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
    diamonds: 'M12 2L2 12l10 10 10-10L12 2z',
    clubs:
      'M12 2c-2.5 0-4.5 2-4.5 4.5 0 1.4.6 2.6 1.6 3.5C7.2 10.8 6 12.3 6 14c0 2.2 1.8 4 4 4 .8 0 1.5-.2 2-.6.5.4 1.2.6 2 .6 2.2 0 4-1.8 4-4 0-1.7-1.2-3.2-2.9-3.9 1-.8 1.6-2.1 1.6-3.5C16.5 4 14.5 2 12 2zM10 20h4v2h-4v-2z',
    spades:
      'M12 2C8.5 5.4 4 9 4 13c0 2.8 2.2 5 5 5 1.2 0 2.3-.4 3-1.2.7.8 1.8 1.2 3 1.2 2.8 0 5-2.2 5-5 0-4-4.5-7.6-8-11zM10 20h4v2h-4v-2z',
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c1} />
          <stop offset="100%" stopColor={c2} />
        </linearGradient>
      </defs>
      <path d={paths[suit]} fill={`url(#${gradientId})`} />
    </svg>
  );
}

// ─── Ornate Ace Suit ──────────────────────────────────────────────────────────

function AceSuitSVG({ suit, size, gradientId }: { suit: Suit; size: number; gradientId: string }) {
  const [c1, c2] = SUIT_GRADIENTS[suit];
  const suitPaths: Record<Suit, string> = {
    hearts:
      'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
    diamonds: 'M12 2L2 12l10 10 10-10L12 2z',
    clubs:
      'M12 2c-2.5 0-4.5 2-4.5 4.5 0 1.4.6 2.6 1.6 3.5C7.2 10.8 6 12.3 6 14c0 2.2 1.8 4 4 4 .8 0 1.5-.2 2-.6.5.4 1.2.6 2 .6 2.2 0 4-1.8 4-4 0-1.7-1.2-3.2-2.9-3.9 1-.8 1.6-2.1 1.6-3.5C16.5 4 14.5 2 12 2zM10 20h4v2h-4v-2z',
    spades:
      'M12 2C8.5 5.4 4 9 4 13c0 2.8 2.2 5 5 5 1.2 0 2.3-.4 3-1.2.7.8 1.8 1.2 3 1.2 2.8 0 5-2.2 5-5 0-4-4.5-7.6-8-11zM10 20h4v2h-4v-2z',
  };

  return (
    <svg width={size} height={size} viewBox="-4 -4 32 32" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }}>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c1} />
          <stop offset="100%" stopColor={c2} />
        </linearGradient>
        <filter id={`${gradientId}-glow`}>
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Decorative flourishes */}
      <circle cx="12" cy="12" r="14" fill="none" stroke={c1} strokeWidth="0.3" opacity="0.3" />
      <circle cx="12" cy="12" r="12.5" fill="none" stroke={c2} strokeWidth="0.2" opacity="0.2" />
      {/* Corner flourishes */}
      <path d="M12 -2 Q14 0 12 2" fill="none" stroke={c1} strokeWidth="0.4" opacity="0.4" />
      <path d="M12 22 Q10 24 12 26" fill="none" stroke={c1} strokeWidth="0.4" opacity="0.4" />
      <path d="M-2 12 Q0 10 2 12" fill="none" stroke={c1} strokeWidth="0.4" opacity="0.4" />
      <path d="M22 12 Q24 14 26 12" fill="none" stroke={c1} strokeWidth="0.4" opacity="0.4" />
      {/* Scrollwork arcs */}
      <path d="M4 -1 C6 1 6 3 4 5" fill="none" stroke={c1} strokeWidth="0.3" opacity="0.25" />
      <path d="M20 -1 C18 1 18 3 20 5" fill="none" stroke={c1} strokeWidth="0.3" opacity="0.25" />
      <path d="M4 19 C6 21 6 23 4 25" fill="none" stroke={c1} strokeWidth="0.3" opacity="0.25" />
      <path d="M20 19 C18 21 18 23 20 25" fill="none" stroke={c1} strokeWidth="0.3" opacity="0.25" />
      {/* Main suit symbol */}
      <path d={suitPaths[suit]} fill={`url(#${gradientId})`} filter={`url(#${gradientId}-glow)`} />
    </svg>
  );
}

// ─── Face Card Royal Portraits (J, Q, K) ────────────────────────────────────

function FaceCardPortrait({ rank, suit, size }: { rank: 'J' | 'Q' | 'K'; suit: Suit; size: number }) {
  const [c1, c2] = SUIT_GRADIENTS[suit];
  const isRed = suit === 'hearts' || suit === 'diamonds';
  const accentColor = isRed ? '#991b1b' : '#1f2937';
  const highlightColor = isRed ? '#dc2626' : '#374151';

  // Jack: youthful knight silhouette with plume
  if (rank === 'J') {
    return (
      <svg width={size} height={size * 1.3} viewBox="0 0 40 52" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }}>
        <defs>
          <linearGradient id={`jack-${suit}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={c1} />
            <stop offset="100%" stopColor={c2} />
          </linearGradient>
        </defs>
        {/* Head */}
        <ellipse cx="20" cy="14" rx="7" ry="8" fill={`url(#jack-${suit})`} />
        {/* Crown/hat */}
        <path d="M13 10 L15 4 L18 8 L20 2 L22 8 L25 4 L27 10" fill={highlightColor} stroke={accentColor} strokeWidth="0.5" />
        {/* Feather plume */}
        <path d="M25 4 Q32 0 28 8" fill="none" stroke={highlightColor} strokeWidth="1" opacity="0.7" />
        <path d="M25 4 Q34 2 30 10" fill="none" stroke={accentColor} strokeWidth="0.6" opacity="0.5" />
        {/* Body/tunic */}
        <path d="M13 20 L10 42 L30 42 L27 20 Z" fill={`url(#jack-${suit})`} opacity="0.8" />
        {/* Collar */}
        <path d="M14 20 L20 24 L26 20" fill="none" stroke={highlightColor} strokeWidth="1" />
        {/* Belt */}
        <rect x="12" y="32" width="16" height="2" rx="1" fill={highlightColor} opacity="0.6" />
        {/* Shield arm */}
        <ellipse cx="10" cy="30" rx="4" ry="5" fill={accentColor} opacity="0.5" />
        {/* Sword */}
        <line x1="30" y1="18" x2="32" y2="38" stroke={highlightColor} strokeWidth="1.2" opacity="0.6" />
        <line x1="28" y1="22" x2="34" y2="22" stroke={highlightColor} strokeWidth="1" opacity="0.5" />
      </svg>
    );
  }

  // Queen: regal figure with flowing crown and veil
  if (rank === 'Q') {
    return (
      <svg width={size} height={size * 1.3} viewBox="0 0 40 52" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }}>
        <defs>
          <linearGradient id={`queen-${suit}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={c1} />
            <stop offset="100%" stopColor={c2} />
          </linearGradient>
        </defs>
        {/* Head */}
        <ellipse cx="20" cy="14" rx="6.5" ry="7.5" fill={`url(#queen-${suit})`} />
        {/* Crown with jewels */}
        <path d="M13 9 L14 2 L17 6 L20 1 L23 6 L26 2 L27 9" fill={highlightColor} stroke={accentColor} strokeWidth="0.5" />
        <circle cx="17" cy="4" r="1" fill="#D4AF37" />
        <circle cx="20" cy="2.5" r="1.2" fill="#D4AF37" />
        <circle cx="23" cy="4" r="1" fill="#D4AF37" />
        {/* Veil */}
        <path d="M13 12 Q8 20 12 28" fill="none" stroke={accentColor} strokeWidth="0.8" opacity="0.3" />
        <path d="M27 12 Q32 20 28 28" fill="none" stroke={accentColor} strokeWidth="0.8" opacity="0.3" />
        {/* Gown */}
        <path d="M14 20 Q12 30 8 44 L32 44 Q28 30 26 20 Z" fill={`url(#queen-${suit})`} opacity="0.8" />
        {/* Necklace */}
        <path d="M15 20 Q20 23 25 20" fill="none" stroke="#D4AF37" strokeWidth="0.8" />
        <circle cx="20" cy="22" r="1.5" fill="#D4AF37" opacity="0.8" />
        {/* Scepter */}
        <line x1="30" y1="16" x2="34" y2="40" stroke="#D4AF37" strokeWidth="1" opacity="0.6" />
        <circle cx="30" cy="16" r="2" fill="#D4AF37" opacity="0.5" />
        {/* Gown detail */}
        <path d="M16 30 Q20 32 24 30" fill="none" stroke={highlightColor} strokeWidth="0.6" opacity="0.4" />
        <path d="M14 36 Q20 38 26 36" fill="none" stroke={highlightColor} strokeWidth="0.6" opacity="0.4" />
      </svg>
    );
  }

  // King: majestic figure with large crown and scepter
  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 40 52" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }}>
      <defs>
        <linearGradient id={`king-${suit}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c1} />
          <stop offset="100%" stopColor={c2} />
        </linearGradient>
      </defs>
      {/* Head */}
      <ellipse cx="20" cy="15" rx="7" ry="8" fill={`url(#king-${suit})`} />
      {/* Beard */}
      <path d="M15 18 Q20 26 25 18" fill={accentColor} opacity="0.4" />
      {/* Grand crown */}
      <path d="M11 10 L13 1 L16 7 L18 0 L20 5 L22 0 L24 7 L27 1 L29 10 Z" fill="#D4AF37" stroke="#B8860B" strokeWidth="0.5" />
      <rect x="13" y="8" width="14" height="3" rx="1" fill="#D4AF37" />
      <circle cx="16" cy="9.5" r="1" fill={highlightColor} />
      <circle cx="20" cy="9.5" r="1.2" fill={highlightColor} />
      <circle cx="24" cy="9.5" r="1" fill={highlightColor} />
      {/* Cross on crown */}
      <line x1="20" y1="-1" x2="20" y2="3" stroke="#B8860B" strokeWidth="1" />
      <line x1="18" y1="1" x2="22" y2="1" stroke="#B8860B" strokeWidth="0.8" />
      {/* Robes */}
      <path d="M12 22 Q8 34 6 46 L34 46 Q32 34 28 22 Z" fill={`url(#king-${suit})`} opacity="0.85" />
      {/* Ermine trim */}
      <path d="M13 22 L20 26 L27 22" fill={highlightColor} stroke={accentColor} strokeWidth="0.5" opacity="0.7" />
      {/* Sash */}
      <line x1="15" y1="24" x2="25" y2="38" stroke="#D4AF37" strokeWidth="1.5" opacity="0.5" />
      {/* Belt */}
      <rect x="11" y="34" width="18" height="2.5" rx="1" fill="#D4AF37" opacity="0.5" />
      {/* Scepter */}
      <line x1="8" y1="18" x2="6" y2="42" stroke="#D4AF37" strokeWidth="1.5" opacity="0.7" />
      <circle cx="8" cy="17" r="2.5" fill="#D4AF37" opacity="0.6" />
      <path d="M6 15 L8 13 L10 15" fill="none" stroke="#B8860B" strokeWidth="0.8" />
    </svg>
  );
}

// ─── Card Back Design ─────────────────────────────────────────────────────────

function CardBackDesign({ width, height, patternId }: { width: number; height: number; patternId: string }) {
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ borderRadius: 'inherit' }}
    >
      {/* Base deep maroon */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #8a0025 0%, #7a0020 30%, #5c0018 70%, #7a0020 100%)',
        }}
      />

      {/* Intricate mandala-inspired geometric SVG pattern */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Tile pattern — interlocking geometric */}
          <pattern id={`${patternId}-geo`} patternUnits="userSpaceOnUse" width="16" height="16">
            {/* Central diamond */}
            <path d="M8 0 L16 8 L8 16 L0 8 Z" fill="none" stroke="#D4AF37" strokeWidth="0.4" opacity="0.35" />
            {/* Inner diamond */}
            <path d="M8 3 L13 8 L8 13 L3 8 Z" fill="none" stroke="#D4AF37" strokeWidth="0.3" opacity="0.25" />
            {/* Corner arcs */}
            <path d="M0 0 Q4 4 0 8" fill="none" stroke="#D4AF37" strokeWidth="0.3" opacity="0.2" />
            <path d="M16 0 Q12 4 16 8" fill="none" stroke="#D4AF37" strokeWidth="0.3" opacity="0.2" />
            <path d="M0 8 Q4 12 0 16" fill="none" stroke="#D4AF37" strokeWidth="0.3" opacity="0.2" />
            <path d="M16 8 Q12 12 16 16" fill="none" stroke="#D4AF37" strokeWidth="0.3" opacity="0.2" />
            {/* Small circles at intersections */}
            <circle cx="8" cy="8" r="1.5" fill="none" stroke="#D4AF37" strokeWidth="0.3" opacity="0.3" />
            <circle cx="0" cy="0" r="1" fill="none" stroke="#D4AF37" strokeWidth="0.2" opacity="0.2" />
            <circle cx="16" cy="0" r="1" fill="none" stroke="#D4AF37" strokeWidth="0.2" opacity="0.2" />
            <circle cx="0" cy="16" r="1" fill="none" stroke="#D4AF37" strokeWidth="0.2" opacity="0.2" />
            <circle cx="16" cy="16" r="1" fill="none" stroke="#D4AF37" strokeWidth="0.2" opacity="0.2" />
          </pattern>

          {/* Radial mandala at center */}
          <radialGradient id={`${patternId}-radial`} cx="50%" cy="50%" r="40%">
            <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Gold border frame */}
        <rect x="2" y="2" width={width - 4} height={height - 4} rx="4" ry="4" fill="none" stroke="#D4AF37" strokeWidth="1" opacity="0.5" />
        <rect x="4" y="4" width={width - 8} height={height - 8} rx="3" ry="3" fill="none" stroke="#D4AF37" strokeWidth="0.5" opacity="0.3" />

        {/* Geometric fill */}
        <rect x="4" y="4" width={width - 8} height={height - 8} fill={`url(#${patternId}-geo)`} />

        {/* Center radial glow */}
        <rect x="0" y="0" width={width} height={height} fill={`url(#${patternId}-radial)`} />

        {/* Central mandala medallion */}
        <g transform={`translate(${width / 2}, ${height / 2})`}>
          {/* Outer mandala rings */}
          <circle r={Math.min(width, height) * 0.28} fill="none" stroke="#D4AF37" strokeWidth="0.6" opacity="0.35" />
          <circle r={Math.min(width, height) * 0.24} fill="none" stroke="#D4AF37" strokeWidth="0.4" opacity="0.25" />
          <circle r={Math.min(width, height) * 0.20} fill="none" stroke="#D4AF37" strokeWidth="0.3" opacity="0.2" />

          {/* Mandala petals — 8-fold symmetry */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <g key={angle} transform={`rotate(${angle})`}>
              <path
                d={`M0 -${Math.min(width, height) * 0.12} Q${Math.min(width, height) * 0.06} -${Math.min(width, height) * 0.18} 0 -${Math.min(width, height) * 0.24}`}
                fill="none"
                stroke="#D4AF37"
                strokeWidth="0.4"
                opacity="0.3"
              />
              <path
                d={`M0 -${Math.min(width, height) * 0.12} Q-${Math.min(width, height) * 0.06} -${Math.min(width, height) * 0.18} 0 -${Math.min(width, height) * 0.24}`}
                fill="none"
                stroke="#D4AF37"
                strokeWidth="0.4"
                opacity="0.3"
              />
            </g>
          ))}

          {/* Inner medallion circle */}
          <circle r={Math.min(width, height) * 0.11} fill="#7a0020" stroke="#D4AF37" strokeWidth="0.8" opacity="0.9" />
          <circle r={Math.min(width, height) * 0.09} fill="none" stroke="#D4AF37" strokeWidth="0.4" opacity="0.5" />
        </g>

        {/* TP monogram */}
        <text
          x={width / 2}
          y={height / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#D4AF37"
          fontSize={Math.min(width, height) * 0.13}
          fontWeight="bold"
          fontFamily="Georgia, serif"
          opacity="0.85"
          style={{ letterSpacing: '0.05em' }}
        >
          TP
        </text>
      </svg>

      {/* Glossy sheen overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 30%, transparent 50%, rgba(255,255,255,0.02) 80%, rgba(255,255,255,0.06) 100%)',
          borderRadius: 'inherit',
        }}
      />
    </div>
  );
}

// ─── Card Face Design ─────────────────────────────────────────────────────────

function CardFaceDesign({ card, dims }: { card: Card; dims: typeof SIZES[CardSize] }) {
  const uid = useId();
  const isFace = card.rank === 'J' || card.rank === 'Q' || card.rank === 'K';
  const isAce = card.rank === 'A';
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const [c1] = SUIT_GRADIENTS[card.suit];

  const cornerFontSize = dims.cornerSize;
  const cornerSuitSize = dims.cornerSize * 0.85;
  const padding = Math.max(2, dims.w * 0.06);

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: 'inherit' }}>
      {/* Linen-textured cream background */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 1px,
              rgba(245,240,230,0.3) 1px,
              rgba(245,240,230,0.3) 2px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 1px,
              rgba(240,235,225,0.2) 1px,
              rgba(240,235,225,0.2) 2px
            ),
            linear-gradient(135deg, #FEFDFB 0%, #F8F5F0 25%, #FBF9F5 50%, #F5F2EC 75%, #FEFDFB 100%)
          `,
        }}
      />

      {/* Subtle inner border */}
      <div
        className="absolute"
        style={{
          inset: 2,
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: Math.max(2, dims.borderRadius - 2),
        }}
      />

      {/* Top-left corner: rank + suit */}
      <div
        className="absolute flex flex-col items-center"
        style={{
          top: padding,
          left: padding,
          lineHeight: 1,
        }}
      >
        <span
          style={{
            fontSize: cornerFontSize,
            fontWeight: 700,
            fontFamily: 'Georgia, "Times New Roman", serif',
            color: c1,
            lineHeight: 1.1,
          }}
        >
          {card.rank}
        </span>
        <SuitSVG suit={card.suit} size={cornerSuitSize} gradientId={`${uid}-tl`} />
      </div>

      {/* Bottom-right corner: rank + suit (rotated 180) */}
      <div
        className="absolute flex flex-col items-center"
        style={{
          bottom: padding,
          right: padding,
          lineHeight: 1,
          transform: 'rotate(180deg)',
        }}
      >
        <span
          style={{
            fontSize: cornerFontSize,
            fontWeight: 700,
            fontFamily: 'Georgia, "Times New Roman", serif',
            color: c1,
            lineHeight: 1.1,
          }}
        >
          {card.rank}
        </span>
        <SuitSVG suit={card.suit} size={cornerSuitSize} gradientId={`${uid}-br`} />
      </div>

      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {isAce ? (
          <AceSuitSVG suit={card.suit} size={dims.suitCenter * 1.6} gradientId={`${uid}-ace`} />
        ) : isFace ? (
          <FaceCardPortrait
            rank={card.rank as 'J' | 'Q' | 'K'}
            suit={card.suit}
            size={dims.suitCenter * 0.9}
          />
        ) : (
          <SuitSVG suit={card.suit} size={dims.suitCenter} gradientId={`${uid}-center`} />
        )}
      </div>

      {/* Glossy sheen overlay (diagonal from top-left) */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.15) 25%, transparent 50%, rgba(0,0,0,0.02) 100%)',
          borderRadius: 'inherit',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

// ─── PremiumCard Component ────────────────────────────────────────────────────

interface PremiumCardProps {
  card?: Card;
  hidden?: boolean;
  size?: CardSize;
  className?: string;
}

export function PremiumCard({
  card,
  hidden = false,
  size = 'md',
  className,
}: PremiumCardProps) {
  const dims = SIZES[size];
  const patternId = useId();

  return (
    <motion.div
      className={cn('relative select-none', className)}
      style={{
        width: dims.w,
        height: dims.h,
        perspective: 800,
      }}
    >
      <motion.div
        className="relative w-full h-full"
        initial={false}
        animate={{ rotateY: hidden ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* ── FRONT FACE ── */}
        <div
          className="absolute inset-0"
          style={{
            backfaceVisibility: 'hidden',
            borderRadius: dims.borderRadius,
            boxShadow: '0 2px 8px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.12)',
          }}
        >
          {card ? (
            <CardFaceDesign card={card} dims={dims} />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(135deg, #F8F5F0, #FEFDFB)',
                borderRadius: dims.borderRadius,
              }}
            />
          )}
        </div>

        {/* ── BACK FACE ── */}
        <div
          className="absolute inset-0"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            borderRadius: dims.borderRadius,
            boxShadow: '0 2px 8px rgba(0,0,0,0.22), 0 1px 3px rgba(0,0,0,0.15)',
          }}
        >
          <CardBackDesign width={dims.w} height={dims.h} patternId={patternId} />
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Animation Variants ───────────────────────────────────────────────────────

const dealVariants = {
  hidden: (custom: { startX: number; startY: number }) => ({
    x: custom.startX,
    y: custom.startY,
    scale: 0.7,
    opacity: 0,
    rotateZ: -15,
  }),
  visible: (custom: { endX: number; endY: number; delay: number }) => ({
    x: custom.endX,
    y: custom.endY,
    scale: 1,
    opacity: 1,
    rotateZ: 0,
    transition: {
      type: 'spring',
      stiffness: 180,
      damping: 22,
      delay: custom.delay,
    },
  }),
};

const flipVariants = {
  back: { rotateY: 180 },
  front: {
    rotateY: 0,
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
  },
};

const foldVariants = {
  normal: { scale: 1, y: 0, opacity: 1, filter: 'grayscale(0)' },
  folded: {
    scale: 0.85,
    y: 20,
    opacity: 0.5,
    filter: 'grayscale(1)',
    transition: { duration: 0.4, ease: 'easeInOut' },
  },
};

// ─── PremiumCardFan Component ─────────────────────────────────────────────────

interface PremiumCardFanProps {
  cards: Card[];
  hidden?: boolean;
  size?: CardSize;
  onCardTap?: (index: number) => void;
  isWinner?: boolean;
}

export function PremiumCardFan({
  cards,
  hidden = false,
  size = 'md',
  onCardTap,
  isWinner = false,
}: PremiumCardFanProps) {
  const dims = SIZES[size];
  const fanSpread = dims.w * 0.55;
  const fanAngle = 12;

  const handleTap = useCallback(
    (index: number) => {
      onCardTap?.(index);
    },
    [onCardTap],
  );

  return (
    <div
      className="relative"
      style={{
        width: dims.w + fanSpread * 2 + 8,
        height: dims.h + 20,
      }}
    >
      {/* Win highlight glow */}
      {isWinner && (
        <motion.div
          className="absolute -inset-3 rounded-2xl"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(212,175,55,0.35) 0%, rgba(212,175,55,0.1) 50%, transparent 70%)',
            filter: 'blur(6px)',
          }}
          animate={{
            opacity: [0.5, 1, 0.5],
            scale: [0.98, 1.02, 0.98],
          }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
        />
      )}

      <div className="relative flex items-end justify-center h-full">
        {cards.slice(0, 3).map((card, index) => {
          const angle = (index - 1) * fanAngle;
          const xOffset = (index - 1) * fanSpread;
          const yOffset = Math.abs(index - 1) * 4;

          return (
            <motion.div
              key={`${card.suit}-${card.rank}-${index}`}
              className={cn('absolute', onCardTap && 'cursor-pointer')}
              initial={{ rotate: 0, x: 0, y: 20, opacity: 0, scale: 0.8 }}
              animate={{
                rotate: angle,
                x: xOffset,
                y: -yOffset,
                opacity: 1,
                scale: 1,
              }}
              transition={{
                type: 'spring',
                stiffness: 250,
                damping: 22,
                delay: index * 0.12,
              }}
              whileHover={onCardTap ? { y: -yOffset - 12, scale: 1.08 } : undefined}
              whileTap={onCardTap ? { scale: 0.97 } : undefined}
              onClick={() => handleTap(index)}
              style={{
                zIndex: index + 1,
                transformOrigin: 'bottom center',
              }}
            >
              <PremiumCard card={card} hidden={hidden} size={size} />

              {/* Per-card golden win border */}
              {isWinner && (
                <motion.div
                  className="absolute -inset-[2px] rounded-lg pointer-events-none"
                  style={{
                    border: '2px solid #D4AF37',
                    borderRadius: dims.borderRadius + 2,
                    boxShadow: '0 0 12px rgba(212,175,55,0.5), inset 0 0 6px rgba(212,175,55,0.15)',
                  }}
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── DealingAnimation Component ───────────────────────────────────────────────

interface DealingAnimationProps {
  cards: Card[];
  targetPosition: { x: number; y: number };
  onComplete?: () => void;
  deckPosition?: { x: number; y: number };
  size?: CardSize;
}

export function DealingAnimation({
  cards,
  targetPosition,
  onComplete,
  deckPosition = { x: 0, y: -200 },
  size = 'md',
}: DealingAnimationProps) {
  const dims = SIZES[size];
  const fanSpread = dims.w * 0.55;
  const fanAngle = 12;

  return (
    <AnimatePresence onExitComplete={onComplete}>
      <div className="relative" style={{ width: dims.w + fanSpread * 2, height: dims.h + 20 }}>
        {cards.slice(0, 3).map((card, index) => {
          const finalAngle = (index - 1) * fanAngle;
          const finalX = targetPosition.x + (index - 1) * fanSpread;
          const finalY = targetPosition.y - Math.abs(index - 1) * 4;

          return (
            <motion.div
              key={`deal-${card.suit}-${card.rank}-${index}`}
              className="absolute"
              initial={{
                x: deckPosition.x,
                y: deckPosition.y,
                rotate: -20,
                scale: 0.6,
                opacity: 0,
              }}
              animate={{
                x: finalX,
                y: finalY,
                rotate: finalAngle,
                scale: 1,
                opacity: 1,
              }}
              transition={{
                type: 'spring',
                stiffness: 150,
                damping: 18,
                delay: index * 0.2,
              }}
              style={{
                zIndex: index + 1,
                transformOrigin: 'bottom center',
              }}
              onAnimationComplete={index === cards.length - 1 ? onComplete : undefined}
            >
              <PremiumCard card={card} hidden size={size} />
            </motion.div>
          );
        })}
      </div>
    </AnimatePresence>
  );
}

// ─── Reusable Animation Presets ───────────────────────────────────────────────

export const cardAnimations = {
  deal: dealVariants,
  flip: flipVariants,
  fold: foldVariants,

  /** Fan spread for 3-card hand — apply per card with index 0,1,2 */
  fanSpread: (index: number, spread: number = 30, angle: number = 12) => ({
    rotate: (index - 1) * angle,
    x: (index - 1) * spread,
    y: -Math.abs(index - 1) * 4,
    transition: { type: 'spring' as const, stiffness: 250, damping: 22, delay: index * 0.12 },
  }),

  /** Golden glow pulse for winning hand */
  winHighlight: {
    boxShadow: [
      '0 0 8px rgba(212,175,55,0.3)',
      '0 0 20px rgba(212,175,55,0.6)',
      '0 0 8px rgba(212,175,55,0.3)',
    ],
    transition: { repeat: Infinity, duration: 1.5, ease: 'easeInOut' as const },
  },
};
