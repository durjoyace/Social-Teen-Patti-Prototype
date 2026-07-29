import { motion } from 'framer-motion';
import { cn } from '../utils/cn';
import type { VipTier } from '../types';
import type { ReactElement } from 'react';

// ---------------------------------------------------------------------------
// Size map
// ---------------------------------------------------------------------------

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZE_PX: Record<AvatarSize, number> = {
  xs: 28,
  sm: 36,
  md: 48,
  lg: 64,
  xl: 80,
};

const SIZE_CLASS: Record<AvatarSize, string> = {
  xs: 'w-7 h-7',
  sm: 'w-9 h-9',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-20 h-20',
};

// ---------------------------------------------------------------------------
// Character IDs
// ---------------------------------------------------------------------------

export type CharacterId =
  | 'sharma_ji'
  | 'priya'
  | 'bunty'
  | 'meera'
  | 'raja'
  | 'anita'
  | 'vikram'
  | 'deepa';

// ---------------------------------------------------------------------------
// SVG Avatar Components
// ---------------------------------------------------------------------------

/** Sharma Ji - Dignified older man, mustache, glasses, traditional (conservative) */
function SharmaJiAvatar() {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Background gradient - warm ochre */}
        <radialGradient id="sharma-bg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#D4A574" />
          <stop offset="100%" stopColor="#8B6914" />
        </radialGradient>
        {/* Skin tone */}
        <linearGradient id="sharma-skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8C39E" />
          <stop offset="100%" stopColor="#C4956A" />
        </linearGradient>
        {/* Turban gradient */}
        <linearGradient id="sharma-turban" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F5E6D3" />
          <stop offset="50%" stopColor="#E8D5C0" />
          <stop offset="100%" stopColor="#D4C4A8" />
        </linearGradient>
        {/* Shirt */}
        <linearGradient id="sharma-shirt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F0EBE0" />
          <stop offset="100%" stopColor="#D9D0C0" />
        </linearGradient>
        {/* Glass lens */}
        <linearGradient id="sharma-lens" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(200,220,255,0.3)" />
          <stop offset="100%" stopColor="rgba(150,180,220,0.15)" />
        </linearGradient>
        <filter id="sharma-shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Background circle */}
      <circle cx="100" cy="100" r="100" fill="url(#sharma-bg)" />

      {/* Neck */}
      <rect x="80" y="140" width="40" height="25" rx="8" fill="url(#sharma-skin)" />

      {/* Kurta / Shirt collar */}
      <path d="M55 165 Q60 150 80 148 L80 200 L55 200 Z" fill="url(#sharma-shirt)" />
      <path d="M145 165 Q140 150 120 148 L120 200 L145 200 Z" fill="url(#sharma-shirt)" />
      <path d="M80 148 Q100 165 120 148 L120 200 L80 200 Z" fill="url(#sharma-shirt)" />
      {/* Collar lines */}
      <line x1="95" y1="152" x2="88" y2="185" stroke="#C4B8A8" strokeWidth="0.8" />
      <line x1="105" y1="152" x2="112" y2="185" stroke="#C4B8A8" strokeWidth="0.8" />

      {/* Face */}
      <ellipse cx="100" cy="110" rx="38" ry="42" fill="url(#sharma-skin)" filter="url(#sharma-shadow)" />

      {/* Forehead lines (wisdom) */}
      <path d="M78 85 Q100 82 122 85" stroke="#B8956E" strokeWidth="0.6" fill="none" opacity="0.4" />
      <path d="M80 89 Q100 87 120 89" stroke="#B8956E" strokeWidth="0.5" fill="none" opacity="0.3" />

      {/* Eyebrows - thick, distinguished */}
      <path d="M72 95 Q80 89 93 93" stroke="#3D2B1F" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M107 93 Q120 89 128 95" stroke="#3D2B1F" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* Eyes */}
      <ellipse cx="83" cy="102" rx="8" ry="5.5" fill="white" />
      <ellipse cx="117" cy="102" rx="8" ry="5.5" fill="white" />
      <circle cx="84" cy="102" r="3.5" fill="#2C1810" />
      <circle cx="118" cy="102" r="3.5" fill="#2C1810" />
      <circle cx="85" cy="101" r="1.2" fill="white" />
      <circle cx="119" cy="101" r="1.2" fill="white" />

      {/* Glasses - round intellectual frames */}
      <circle cx="83" cy="102" r="13" fill="none" stroke="#4A3728" strokeWidth="2.2" />
      <circle cx="117" cy="102" r="13" fill="none" stroke="#4A3728" strokeWidth="2.2" />
      {/* Lens glare */}
      <circle cx="83" cy="102" r="12" fill="url(#sharma-lens)" />
      <circle cx="117" cy="102" r="12" fill="url(#sharma-lens)" />
      {/* Bridge */}
      <path d="M96 102 Q100 98 104 102" stroke="#4A3728" strokeWidth="2" fill="none" />
      {/* Temple arms */}
      <line x1="70" y1="100" x2="62" y2="96" stroke="#4A3728" strokeWidth="2" strokeLinecap="round" />
      <line x1="130" y1="100" x2="138" y2="96" stroke="#4A3728" strokeWidth="2" strokeLinecap="round" />

      {/* Nose - prominent, distinguished */}
      <path d="M98 102 Q96 112 92 120 Q96 122 100 122 Q104 122 108 120 Q104 112 102 102"
        fill="none" stroke="#B8956E" strokeWidth="1.2" />
      {/* Nose shadow */}
      <path d="M94 120 Q100 124 106 120" stroke="#B8956E" strokeWidth="0.8" fill="none" />

      {/* Mustache - grand, handlebar style */}
      <path d="M82 127 Q86 124 92 126 Q96 128 100 127 Q104 128 108 126 Q114 124 118 127
              Q120 130 116 132 Q110 130 104 130 Q100 132 96 130 Q90 130 84 132 Q80 130 82 127"
        fill="#3D2B1F" />
      {/* Mustache detail - curled ends */}
      <path d="M80 128 Q76 126 74 129" stroke="#3D2B1F" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M120 128 Q124 126 126 129" stroke="#3D2B1F" strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* Mouth (hidden behind mustache, slight smile) */}
      <path d="M90 134 Q100 138 110 134" stroke="#A0705A" strokeWidth="1.2" fill="none" />

      {/* Ears */}
      <ellipse cx="62" cy="105" rx="6" ry="10" fill="url(#sharma-skin)" />
      <ellipse cx="138" cy="105" rx="6" ry="10" fill="url(#sharma-skin)" />
      <ellipse cx="62" cy="105" rx="3" ry="6" fill="#C4956A" opacity="0.5" />
      <ellipse cx="138" cy="105" rx="3" ry="6" fill="#C4956A" opacity="0.5" />

      {/* Hair - grey, thinning on top, combed back */}
      <path d="M62 95 Q62 65 80 55 Q90 50 100 48 Q110 50 120 55 Q138 65 138 95
              Q135 80 120 72 Q105 66 100 65 Q95 66 80 72 Q65 80 62 95"
        fill="#9E9E9E" />
      {/* Hair highlights */}
      <path d="M75 60 Q90 53 100 52 Q110 53 125 60" stroke="#B0B0B0" strokeWidth="1.5" fill="none" opacity="0.5" />
      <path d="M70 68 Q85 58 100 56 Q115 58 130 68" stroke="#ABABAB" strokeWidth="1" fill="none" opacity="0.4" />

      {/* Tika / tilak mark on forehead */}
      <ellipse cx="100" cy="82" rx="3" ry="5" fill="#CC3333" opacity="0.7" />

      {/* Cheek lines (smile lines) */}
      <path d="M70 118 Q72 125 75 130" stroke="#B8956E" strokeWidth="0.7" fill="none" opacity="0.4" />
      <path d="M130 118 Q128 125 125 130" stroke="#B8956E" strokeWidth="0.7" fill="none" opacity="0.4" />
    </svg>
  );
}

/** Priya - Young professional woman, confident, modern (balanced) */
function PriyaAvatar() {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="priya-bg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#7B68EE" />
          <stop offset="100%" stopColor="#4B0082" />
        </radialGradient>
        <linearGradient id="priya-skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F0C8A0" />
          <stop offset="100%" stopColor="#D4A878" />
        </linearGradient>
        <linearGradient id="priya-hair" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1A0A00" />
          <stop offset="100%" stopColor="#0D0500" />
        </linearGradient>
        <linearGradient id="priya-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6C5CE7" />
          <stop offset="100%" stopColor="#4834D4" />
        </linearGradient>
        <linearGradient id="priya-lip" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E74C6F" />
          <stop offset="100%" stopColor="#C0392B" />
        </linearGradient>
        <filter id="priya-shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2" />
        </filter>
      </defs>

      <circle cx="100" cy="100" r="100" fill="url(#priya-bg)" />

      {/* Hair - long, flowing, dark */}
      <path d="M55 85 Q50 120 48 160 Q48 200 55 200 L65 200 Q58 170 60 140 Q62 115 65 95"
        fill="url(#priya-hair)" />
      <path d="M145 85 Q150 120 152 160 Q152 200 145 200 L135 200 Q142 170 140 140 Q138 115 135 95"
        fill="url(#priya-hair)" />

      {/* Neck */}
      <rect x="85" y="138" width="30" height="25" rx="6" fill="url(#priya-skin)" />

      {/* Top / Blouse */}
      <path d="M55 170 Q65 150 85 145 Q100 160 115 145 Q135 150 145 170 L145 200 L55 200 Z"
        fill="url(#priya-top)" />
      {/* Neckline */}
      <path d="M85 145 Q100 162 115 145" stroke="#5A4FCF" strokeWidth="1" fill="none" />

      {/* Necklace */}
      <path d="M82 146 Q100 158 118 146" stroke="#FFD700" strokeWidth="1.5" fill="none" />
      <circle cx="100" cy="157" r="3" fill="#FFD700" />
      <circle cx="100" cy="157" r="1.5" fill="#FF6B6B" />

      {/* Face */}
      <ellipse cx="100" cy="108" rx="36" ry="40" fill="url(#priya-skin)" filter="url(#priya-shadow)" />

      {/* Eyebrows - well-groomed arched */}
      <path d="M73 92 Q81 86 93 90" stroke="#2C1810" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M107 90 Q119 86 127 92" stroke="#2C1810" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* Eyes - large, expressive, confident */}
      <ellipse cx="83" cy="100" rx="9" ry="6" fill="white" />
      <ellipse cx="117" cy="100" rx="9" ry="6" fill="white" />
      <circle cx="84" cy="100" r="4" fill="#3D2B1F" />
      <circle cx="118" cy="100" r="4" fill="#3D2B1F" />
      <circle cx="82" cy="99" r="2" fill="white" />
      <circle cx="116" cy="99" r="2" fill="white" />
      {/* Pupils */}
      <circle cx="84" cy="100" r="2" fill="#0D0500" />
      <circle cx="118" cy="100" r="2" fill="#0D0500" />

      {/* Eyeliner / lashes */}
      <path d="M74 99 Q78 94 92 97" stroke="#1A0A00" strokeWidth="1.5" fill="none" />
      <path d="M108 97 Q122 94 126 99" stroke="#1A0A00" strokeWidth="1.5" fill="none" />
      {/* Lower lash */}
      <path d="M76 103 Q83 107 90 103" stroke="#2C1810" strokeWidth="0.5" fill="none" opacity="0.5" />
      <path d="M110 103 Q117 107 124 103" stroke="#2C1810" strokeWidth="0.5" fill="none" opacity="0.5" />

      {/* Nose */}
      <path d="M98 100 Q96 110 94 116 Q98 118 100 118 Q102 118 106 116 Q104 110 102 100"
        fill="none" stroke="#C4956A" strokeWidth="1" />

      {/* Lips - confident smile */}
      <path d="M88 125 Q94 122 100 124 Q106 122 112 125" stroke="url(#priya-lip)" strokeWidth="2" fill="none" />
      <path d="M88 125 Q100 132 112 125" fill="url(#priya-lip)" opacity="0.7" />
      {/* Upper lip shape */}
      <path d="M92 124 Q96 121 100 124 Q104 121 108 124" fill="url(#priya-lip)" />

      {/* Blush */}
      <circle cx="72" cy="115" r="8" fill="#FF9999" opacity="0.15" />
      <circle cx="128" cy="115" r="8" fill="#FF9999" opacity="0.15" />

      {/* Hair - top section */}
      <path d="M62 90 Q60 70 68 55 Q80 40 100 38 Q120 40 132 55 Q140 70 138 90
              Q135 75 125 65 Q110 55 100 54 Q90 55 75 65 Q65 75 62 90"
        fill="url(#priya-hair)" />
      {/* Hair parting */}
      <path d="M100 40 Q98 55 95 70" stroke="#2C1810" strokeWidth="0.5" fill="none" opacity="0.3" />
      {/* Hair shine */}
      <path d="M75 50 Q90 42 100 40" stroke="#3D2B1F" strokeWidth="2" fill="none" opacity="0.3" />
      {/* Side hair */}
      <path d="M62 90 Q58 100 56 115 Q55 130 58 145" stroke="url(#priya-hair)" strokeWidth="12" fill="none" strokeLinecap="round" />
      <path d="M138 90 Q142 100 144 115 Q145 130 142 145" stroke="url(#priya-hair)" strokeWidth="12" fill="none" strokeLinecap="round" />

      {/* Bindi */}
      <circle cx="100" cy="85" r="2.5" fill="#E74C6F" />

      {/* Earrings - small gold studs */}
      <circle cx="63" cy="108" r="3" fill="#FFD700" />
      <circle cx="63" cy="108" r="1.5" fill="#FFF" opacity="0.4" />
      <circle cx="137" cy="108" r="3" fill="#FFD700" />
      <circle cx="137" cy="108" r="1.5" fill="#FFF" opacity="0.4" />

      {/* Ears */}
      <ellipse cx="64" cy="104" rx="4" ry="8" fill="url(#priya-skin)" />
      <ellipse cx="136" cy="104" rx="4" ry="8" fill="url(#priya-skin)" />
    </svg>
  );
}

/** Bunty - Cool young guy, sunglasses, cocky grin (aggressive) */
function BuntyAvatar() {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bunty-bg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#FF6B35" />
          <stop offset="100%" stopColor="#C0392B" />
        </radialGradient>
        <linearGradient id="bunty-skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D4A878" />
          <stop offset="100%" stopColor="#B8875A" />
        </linearGradient>
        <linearGradient id="bunty-hair" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1A0A00" />
          <stop offset="100%" stopColor="#0D0500" />
        </linearGradient>
        <linearGradient id="bunty-jacket" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2D2D2D" />
          <stop offset="100%" stopColor="#1A1A1A" />
        </linearGradient>
        <linearGradient id="bunty-shades" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1a1a2e" />
          <stop offset="30%" stopColor="#16213e" />
          <stop offset="100%" stopColor="#0f3460" />
        </linearGradient>
        <linearGradient id="bunty-shade-glare" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <filter id="bunty-shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
        </filter>
      </defs>

      <circle cx="100" cy="100" r="100" fill="url(#bunty-bg)" />

      {/* Neck */}
      <rect x="82" y="140" width="36" height="25" rx="6" fill="url(#bunty-skin)" />

      {/* Leather jacket */}
      <path d="M48 175 Q58 148 82 143 L82 200 L48 200 Z" fill="url(#bunty-jacket)" />
      <path d="M152 175 Q142 148 118 143 L118 200 L152 200 Z" fill="url(#bunty-jacket)" />
      <path d="M82 143 Q100 155 118 143 L118 200 L82 200 Z" fill="#2D2D2D" />
      {/* Jacket collar */}
      <path d="M78 148 L68 158 L82 148" fill="#3D3D3D" />
      <path d="M122 148 L132 158 L118 148" fill="#3D3D3D" />
      {/* Jacket zipper */}
      <line x1="100" y1="152" x2="100" y2="200" stroke="#888" strokeWidth="1.5" />
      {/* T-shirt under */}
      <path d="M85 145 Q100 158 115 145" fill="#333" />

      {/* Gold chain */}
      <path d="M85 148 Q100 162 115 148" stroke="#FFD700" strokeWidth="2" fill="none" />
      <circle cx="100" cy="161" r="4" fill="#FFD700" />
      <text x="100" y="163" textAnchor="middle" fill="#1A1A1A" fontSize="5" fontWeight="bold">$</text>

      {/* Face - slightly angular, masculine */}
      <path d="M62 105 Q60 80 72 65 Q85 52 100 50 Q115 52 128 65 Q140 80 138 105
              Q136 125 128 135 Q115 148 100 150 Q85 148 72 135 Q64 125 62 105"
        fill="url(#bunty-skin)" filter="url(#bunty-shadow)" />

      {/* Jawline emphasis */}
      <path d="M65 115 Q72 135 85 142" stroke="#A07050" strokeWidth="0.8" fill="none" opacity="0.3" />
      <path d="M135 115 Q128 135 115 142" stroke="#A07050" strokeWidth="0.8" fill="none" opacity="0.3" />

      {/* Stubble */}
      <rect x="75" y="128" width="50" height="18" rx="10" fill="#2C1810" opacity="0.08" />

      {/* Cocky grin */}
      <path d="M82 130 Q92 126 100 128 Q108 126 118 132" stroke="#8B5E3C" strokeWidth="2" fill="none" />
      {/* One side higher - smirk */}
      <path d="M82 130 Q90 135 100 134 Q110 135 118 132" fill="#C0705A" opacity="0.5" />
      {/* Teeth flash */}
      <path d="M88 131 Q100 137 112 131" fill="white" opacity="0.7" />

      {/* Nose */}
      <path d="M98 100 Q95 112 93 118 Q97 120 100 120 Q103 120 107 118 Q105 112 102 100"
        fill="none" stroke="#A07050" strokeWidth="1.2" />

      {/* Sunglasses - aviator style */}
      <path d="M68 96 Q70 86 83 84 Q92 83 96 88 Q100 86 104 88 Q108 83 117 84 Q130 86 132 96
              Q133 105 128 110 Q120 115 110 112 Q104 110 104 105 Q100 108 96 105 Q96 110 90 112
              Q80 115 72 110 Q67 105 68 96 Z"
        fill="url(#bunty-shades)" stroke="#333" strokeWidth="1.5" />
      {/* Glare on lenses */}
      <ellipse cx="80" cy="94" rx="8" ry="5" fill="url(#bunty-shade-glare)" transform="rotate(-15 80 94)" />
      <ellipse cx="118" cy="94" rx="8" ry="5" fill="url(#bunty-shade-glare)" transform="rotate(-15 118 94)" />
      {/* Temple arms */}
      <line x1="68" y1="92" x2="58" y2="88" stroke="#333" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="132" y1="92" x2="142" y2="88" stroke="#333" strokeWidth="2.5" strokeLinecap="round" />

      {/* Eyebrows visible above sunglasses */}
      <path d="M70 82 Q80 76 94 80" stroke="#1A0A00" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M106 80 Q120 76 130 82" stroke="#1A0A00" strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* Hair - styled up, trendy, spiky */}
      <path d="M60 85 Q58 65 70 50 Q82 38 100 35 Q118 38 130 50 Q142 65 140 85
              Q138 70 130 60 Q118 48 100 46 Q82 48 70 60 Q62 70 60 85"
        fill="url(#bunty-hair)" />
      {/* Spiky top */}
      <path d="M75 50 L70 35 Q78 42 85 38 L82 28 Q92 40 100 36 L98 26 Q108 38 115 35
              L118 28 Q118 42 125 38 L130 35 Q128 48 135 50"
        fill="url(#bunty-hair)" />
      {/* Gel shine */}
      <path d="M80 42 Q90 36 100 35 Q110 36 118 40" stroke="#3D2B1F" strokeWidth="1.5" fill="none" opacity="0.3" />

      {/* Ears */}
      <ellipse cx="60" cy="100" rx="5" ry="9" fill="url(#bunty-skin)" />
      <ellipse cx="140" cy="100" rx="5" ry="9" fill="url(#bunty-skin)" />
      {/* Ear stud - left */}
      <circle cx="58" cy="98" r="2" fill="#FFD700" />
    </svg>
  );
}

/** Meera - Elegant dancer, graceful (balanced) */
function MeeraAvatar() {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="meera-bg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#E91E63" />
          <stop offset="100%" stopColor="#880E4F" />
        </radialGradient>
        <linearGradient id="meera-skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EDCBA0" />
          <stop offset="100%" stopColor="#D4A878" />
        </linearGradient>
        <linearGradient id="meera-hair" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0D0500" />
          <stop offset="100%" stopColor="#1A0A00" />
        </linearGradient>
        <linearGradient id="meera-sari" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF1744" />
          <stop offset="50%" stopColor="#D50000" />
          <stop offset="100%" stopColor="#B71C1C" />
        </linearGradient>
        <linearGradient id="meera-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="50%" stopColor="#FFC107" />
          <stop offset="100%" stopColor="#FF8F00" />
        </linearGradient>
        <filter id="meera-shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2" />
        </filter>
        <filter id="meera-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <circle cx="100" cy="100" r="100" fill="url(#meera-bg)" />

      {/* Hair flowing down sides */}
      <path d="M52 80 Q48 110 46 145 Q45 180 50 200 L62 200 Q55 175 56 145 Q58 115 60 90"
        fill="url(#meera-hair)" />
      <path d="M148 80 Q152 110 154 145 Q155 180 150 200 L138 200 Q145 175 144 145 Q142 115 140 90"
        fill="url(#meera-hair)" />

      {/* Neck - graceful, long */}
      <rect x="86" y="138" width="28" height="28" rx="6" fill="url(#meera-skin)" />

      {/* Sari drape */}
      <path d="M52 178 Q62 150 86 143 Q100 160 114 143 Q138 150 148 178 L148 200 L52 200 Z"
        fill="url(#meera-sari)" />
      {/* Sari border - gold */}
      <path d="M52 178 Q62 150 86 143" stroke="url(#meera-gold)" strokeWidth="2.5" fill="none" />
      <path d="M148 178 Q138 150 114 143" stroke="url(#meera-gold)" strokeWidth="2.5" fill="none" />
      {/* Sari pallu across shoulder */}
      <path d="M114 145 Q130 148 140 155 Q145 160 148 170" stroke="url(#meera-gold)" strokeWidth="1.5" fill="none" />
      {/* Sari pattern */}
      <circle cx="75" cy="175" r="2" fill="#FFD700" opacity="0.3" />
      <circle cx="125" cy="175" r="2" fill="#FFD700" opacity="0.3" />
      <circle cx="100" cy="185" r="2" fill="#FFD700" opacity="0.3" />

      {/* Elaborate necklace */}
      <path d="M82 146 Q86 150 92 152 Q96 154 100 155 Q104 154 108 152 Q114 150 118 146"
        stroke="url(#meera-gold)" strokeWidth="2" fill="none" />
      <path d="M86 150 Q92 156 100 158 Q108 156 114 150"
        stroke="url(#meera-gold)" strokeWidth="1.5" fill="none" />
      {/* Pendant */}
      <path d="M96 158 L100 165 L104 158" fill="url(#meera-gold)" />
      <circle cx="100" cy="162" r="2" fill="#FF1744" />
      {/* Necklace gems */}
      <circle cx="88" cy="151" r="1.5" fill="#FF1744" />
      <circle cx="94" cy="154" r="1.5" fill="#FFD700" />
      <circle cx="106" cy="154" r="1.5" fill="#FFD700" />
      <circle cx="112" cy="151" r="1.5" fill="#FF1744" />

      {/* Face - oval, graceful */}
      <ellipse cx="100" cy="108" rx="35" ry="40" fill="url(#meera-skin)" filter="url(#meera-shadow)" />

      {/* Eyebrows - graceful arches */}
      <path d="M73 92 Q82 85 94 89" stroke="#2C1810" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M106 89 Q118 85 127 92" stroke="#2C1810" strokeWidth="1.8" fill="none" strokeLinecap="round" />

      {/* Eyes - large, almond-shaped, kohl-lined (dancer eyes) */}
      <ellipse cx="83" cy="100" rx="10" ry="6" fill="white" />
      <ellipse cx="117" cy="100" rx="10" ry="6" fill="white" />
      <circle cx="84" cy="100" r="4.5" fill="#3D2B1F" />
      <circle cx="118" cy="100" r="4.5" fill="#3D2B1F" />
      <circle cx="82" cy="98" r="2" fill="white" />
      <circle cx="116" cy="98" r="2" fill="white" />
      <circle cx="84" cy="100" r="2.2" fill="#0D0500" />
      <circle cx="118" cy="100" r="2.2" fill="#0D0500" />
      {/* Kohl / kajal - heavy, dramatic */}
      <path d="M73 99 Q77 93 93 96" stroke="#0D0500" strokeWidth="2" fill="none" />
      <path d="M107 96 Q123 93 127 99" stroke="#0D0500" strokeWidth="2" fill="none" />
      {/* Extended kajal wing */}
      <line x1="73" y1="99" x2="69" y2="96" stroke="#0D0500" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="127" y1="99" x2="131" y2="96" stroke="#0D0500" strokeWidth="1.5" strokeLinecap="round" />
      {/* Lower lash line */}
      <path d="M75 103 Q83 108 91 103" stroke="#0D0500" strokeWidth="1" fill="none" opacity="0.6" />
      <path d="M109 103 Q117 108 125 103" stroke="#0D0500" strokeWidth="1" fill="none" opacity="0.6" />

      {/* Nose - delicate, nose ring */}
      <path d="M98 100 Q96 110 94 116 Q98 118 100 118 Q102 118 106 116 Q104 110 102 100"
        fill="none" stroke="#C4956A" strokeWidth="1" />
      {/* Nose ring - small gold stud on left */}
      <circle cx="93" cy="116" r="2" fill="url(#meera-gold)" />
      <circle cx="93" cy="116" r="0.8" fill="white" opacity="0.5" />

      {/* Lips - classic, slightly parted graceful smile */}
      <path d="M88 126 Q94 123 100 125 Q106 123 112 126" fill="#D44060" />
      <path d="M88 126 Q100 133 112 126" fill="#C0354A" />
      {/* Lip highlight */}
      <path d="M94 125 Q100 123 106 125" stroke="#E8607A" strokeWidth="0.6" fill="none" />

      {/* Blush */}
      <circle cx="72" cy="113" r="7" fill="#FF6B8A" opacity="0.12" />
      <circle cx="128" cy="113" r="7" fill="#FF6B8A" opacity="0.12" />

      {/* Hair - center parted, pulled back elegantly */}
      <path d="M58 88 Q56 68 66 52 Q78 38 100 36 Q122 38 134 52 Q144 68 142 88
              Q140 72 130 60 Q118 48 100 46 Q82 48 70 60 Q60 72 58 88"
        fill="url(#meera-hair)" />
      {/* Center parting */}
      <line x1="100" y1="38" x2="100" y2="55" stroke="#1A0A00" strokeWidth="0.5" opacity="0.3" />
      {/* Hair bun hint at back */}
      <circle cx="100" cy="42" r="8" fill="url(#meera-hair)" />
      {/* Flowers in hair - jasmine gajra */}
      <circle cx="78" cy="56" r="3" fill="white" opacity="0.9" />
      <circle cx="85" cy="50" r="2.5" fill="white" opacity="0.9" />
      <circle cx="92" cy="46" r="2.5" fill="white" opacity="0.9" />
      <circle cx="72" cy="62" r="2.5" fill="white" opacity="0.85" />
      {/* Flower centers */}
      <circle cx="78" cy="56" r="1" fill="#FFD700" opacity="0.5" />
      <circle cx="85" cy="50" r="0.8" fill="#FFD700" opacity="0.5" />

      {/* Maang tikka - forehead jewelry */}
      <line x1="100" y1="42" x2="100" y2="78" stroke="url(#meera-gold)" strokeWidth="1.5" />
      <circle cx="100" cy="78" r="4" fill="url(#meera-gold)" />
      <circle cx="100" cy="78" r="2" fill="#FF1744" />
      <circle cx="100" cy="70" r="1.5" fill="url(#meera-gold)" />

      {/* Jhumka earrings */}
      <ellipse cx="62" cy="108" rx="3" ry="2" fill="url(#meera-gold)" />
      <path d="M59 110 Q62 118 65 110" fill="url(#meera-gold)" />
      <circle cx="62" cy="117" r="2" fill="#FF1744" />
      <ellipse cx="138" cy="108" rx="3" ry="2" fill="url(#meera-gold)" />
      <path d="M135 110 Q138 118 141 110" fill="url(#meera-gold)" />
      <circle cx="138" cy="117" r="2" fill="#FF1744" />

      {/* Ears */}
      <ellipse cx="64" cy="104" rx="4" ry="8" fill="url(#meera-skin)" />
      <ellipse cx="136" cy="104" rx="4" ry="8" fill="url(#meera-skin)" />
    </svg>
  );
}

/** Raja - Royal/kingly figure, turban, commanding (aggressive) */
function RajaAvatar() {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="raja-bg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#B8860B" />
        </radialGradient>
        <linearGradient id="raja-skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D4A070" />
          <stop offset="100%" stopColor="#B8864A" />
        </linearGradient>
        <linearGradient id="raja-turban" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E53935" />
          <stop offset="50%" stopColor="#C62828" />
          <stop offset="100%" stopColor="#8E0000" />
        </linearGradient>
        <linearGradient id="raja-turban-fold" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#D32F2F" />
          <stop offset="50%" stopColor="#EF5350" />
          <stop offset="100%" stopColor="#D32F2F" />
        </linearGradient>
        <linearGradient id="raja-sherwani" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1A237E" />
          <stop offset="100%" stopColor="#0D1654" />
        </linearGradient>
        <linearGradient id="raja-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="50%" stopColor="#FFEA00" />
          <stop offset="100%" stopColor="#FFC107" />
        </linearGradient>
        <filter id="raja-shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
        </filter>
        <filter id="raja-gem-glow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <circle cx="100" cy="100" r="100" fill="url(#raja-bg)" />

      {/* Neck - thick, commanding */}
      <rect x="80" y="138" width="40" height="28" rx="8" fill="url(#raja-skin)" />

      {/* Sherwani - royal blue */}
      <path d="M45 180 Q55 150 80 142 L80 200 L45 200 Z" fill="url(#raja-sherwani)" />
      <path d="M155 180 Q145 150 120 142 L120 200 L155 200 Z" fill="url(#raja-sherwani)" />
      <path d="M80 142 Q100 160 120 142 L120 200 L80 200 Z" fill="url(#raja-sherwani)" />
      {/* Mandarin collar */}
      <path d="M82 142 Q82 138 85 136 Q92 140 100 142 Q108 140 115 136 Q118 138 118 142"
        fill="#1A237E" stroke="#FFD700" strokeWidth="1" />
      {/* Gold embroidery on sherwani */}
      <path d="M90 155 Q95 158 100 155 Q105 158 110 155" stroke="#FFD700" strokeWidth="0.8" fill="none" opacity="0.5" />
      <path d="M88 165 Q94 168 100 165 Q106 168 112 165" stroke="#FFD700" strokeWidth="0.8" fill="none" opacity="0.5" />
      {/* Buttons */}
      <circle cx="100" cy="152" r="2" fill="#FFD700" />
      <circle cx="100" cy="162" r="2" fill="#FFD700" />
      <circle cx="100" cy="172" r="2" fill="#FFD700" />

      {/* Brooch / medal on chest */}
      <circle cx="80" cy="160" r="5" fill="url(#raja-gold)" filter="url(#raja-gem-glow)" />
      <circle cx="80" cy="160" r="2.5" fill="#E53935" />

      {/* Face - strong, square jaw */}
      <path d="M62 108 Q60 80 72 65 Q85 52 100 50 Q115 52 128 65 Q140 80 138 108
              Q136 128 125 138 Q112 148 100 150 Q88 148 75 138 Q64 128 62 108"
        fill="url(#raja-skin)" filter="url(#raja-shadow)" />

      {/* Strong eyebrows */}
      <path d="M70 88 Q80 82 94 86" stroke="#1A0A00" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M106 86 Q120 82 130 88" stroke="#1A0A00" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* Eyes - intense, commanding gaze */}
      <ellipse cx="82" cy="98" rx="9" ry="5.5" fill="white" />
      <ellipse cx="118" cy="98" rx="9" ry="5.5" fill="white" />
      <circle cx="83" cy="98" r="4" fill="#2C1810" />
      <circle cx="119" cy="98" r="4" fill="#2C1810" />
      <circle cx="81" cy="97" r="1.8" fill="white" />
      <circle cx="117" cy="97" r="1.8" fill="white" />
      <circle cx="83" cy="98" r="2" fill="#0D0500" />
      <circle cx="119" cy="98" r="2" fill="#0D0500" />
      {/* Intense eyelids */}
      <path d="M73 97 Q77 93 91 95" stroke="#1A0A00" strokeWidth="1.5" fill="none" />
      <path d="M109 95 Q123 93 127 97" stroke="#1A0A00" strokeWidth="1.5" fill="none" />

      {/* Nose - strong, regal */}
      <path d="M98 98 Q95 108 92 116 Q96 119 100 119 Q104 119 108 116 Q105 108 102 98"
        fill="none" stroke="#A07050" strokeWidth="1.2" />

      {/* Mustache - regal, well-groomed */}
      <path d="M84 124 Q88 121 94 123 Q97 125 100 124 Q103 125 106 123 Q112 121 116 124
              Q118 126 115 128 Q108 126 104 127 Q100 128 96 127 Q92 126 85 128 Q82 126 84 124"
        fill="#1A0A00" />
      {/* Mustache tips curled up */}
      <path d="M82 125 Q78 122 76 124" stroke="#1A0A00" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M118 125 Q122 122 124 124" stroke="#1A0A00" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* Beard - trimmed, royal */}
      <path d="M78 132 Q80 138 88 142 Q96 146 100 147 Q104 146 112 142 Q120 138 122 132
              Q118 136 110 140 Q100 144 90 140 Q82 136 78 132"
        fill="#1A0A00" opacity="0.6" />

      {/* Mouth */}
      <path d="M90 132 Q100 136 110 132" stroke="#8B5E3C" strokeWidth="1.2" fill="none" />

      {/* Ears */}
      <ellipse cx="60" cy="102" rx="5" ry="10" fill="url(#raja-skin)" />
      <ellipse cx="140" cy="102" rx="5" ry="10" fill="url(#raja-skin)" />

      {/* Royal turban */}
      <path d="M55 85 Q52 60 65 42 Q80 28 100 25 Q120 28 135 42 Q148 60 145 85
              Q140 65 128 50 Q115 38 100 36 Q85 38 72 50 Q60 65 55 85"
        fill="url(#raja-turban)" />
      {/* Turban folds */}
      <path d="M58 75 Q75 55 100 48 Q125 55 142 75" stroke="url(#raja-turban-fold)" strokeWidth="3" fill="none" />
      <path d="M60 68 Q78 48 100 42 Q122 48 140 68" stroke="url(#raja-turban-fold)" strokeWidth="2.5" fill="none" />
      <path d="M63 60 Q80 42 100 37 Q120 42 137 60" stroke="url(#raja-turban-fold)" strokeWidth="2" fill="none" />
      {/* Turban top peak */}
      <path d="M85 30 Q100 18 115 30 Q108 22 100 20 Q92 22 85 30" fill="url(#raja-turban)" />

      {/* Turban jewel - centerpiece */}
      <ellipse cx="100" cy="52" rx="8" ry="10" fill="url(#raja-gold)" filter="url(#raja-gem-glow)" />
      <ellipse cx="100" cy="52" rx="4" ry="5.5" fill="#E53935" />
      <ellipse cx="98" cy="50" rx="1.5" ry="2" fill="white" opacity="0.4" />
      {/* Feather / kalgi */}
      <path d="M108 50 Q118 30 115 18" stroke="url(#raja-gold)" strokeWidth="2" fill="none" />
      <path d="M115 18 Q120 22 118 28 Q116 24 112 25 Q114 20 115 18"
        fill="url(#raja-gold)" />
      <path d="M108 50 Q112 38 114 28" stroke="#FFD700" strokeWidth="1" fill="none" opacity="0.5" />

      {/* Turban border - gold trim */}
      <path d="M55 85 Q52 60 65 42" stroke="url(#raja-gold)" strokeWidth="1.5" fill="none" />
      <path d="M145 85 Q148 60 135 42" stroke="url(#raja-gold)" strokeWidth="1.5" fill="none" />

      {/* Ear jewelry */}
      <circle cx="58" cy="105" r="2.5" fill="url(#raja-gold)" />
      <circle cx="142" cy="105" r="2.5" fill="url(#raja-gold)" />
    </svg>
  );
}

/** Anita - Kind aunty type, warm smile (conservative) */
function AnitaAvatar() {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="anita-bg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#66BB6A" />
          <stop offset="100%" stopColor="#2E7D32" />
        </radialGradient>
        <linearGradient id="anita-skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F0CCA8" />
          <stop offset="100%" stopColor="#D4A878" />
        </linearGradient>
        <linearGradient id="anita-hair" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2C1810" />
          <stop offset="100%" stopColor="#1A0A00" />
        </linearGradient>
        <linearGradient id="anita-sari" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4CAF50" />
          <stop offset="50%" stopColor="#388E3C" />
          <stop offset="100%" stopColor="#2E7D32" />
        </linearGradient>
        <linearGradient id="anita-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#FFA000" />
        </linearGradient>
        <filter id="anita-shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2" />
        </filter>
      </defs>

      <circle cx="100" cy="100" r="100" fill="url(#anita-bg)" />

      {/* Hair at sides */}
      <path d="M54 85 Q50 110 50 140 Q50 170 56 200 L68 200 Q60 170 60 140 Q60 110 62 90"
        fill="url(#anita-hair)" />
      <path d="M146 85 Q150 110 150 140 Q150 170 144 200 L132 200 Q140 170 140 140 Q140 110 138 90"
        fill="url(#anita-hair)" />

      {/* Neck */}
      <rect x="85" y="138" width="30" height="25" rx="6" fill="url(#anita-skin)" />

      {/* Sari */}
      <path d="M50 175 Q60 148 85 142 Q100 158 115 142 Q140 148 150 175 L150 200 L50 200 Z"
        fill="url(#anita-sari)" />
      {/* Sari border */}
      <path d="M50 175 Q60 148 85 142" stroke="url(#anita-gold)" strokeWidth="2" fill="none" />
      <path d="M150 175 Q140 148 115 142" stroke="url(#anita-gold)" strokeWidth="2" fill="none" />
      {/* Sari pallu */}
      <path d="M115 143 Q135 148 148 160" fill="url(#anita-sari)" opacity="0.8" />
      <path d="M115 143 Q135 148 148 160" stroke="url(#anita-gold)" strokeWidth="1.5" fill="none" />
      {/* Sari pattern - small flowers */}
      <circle cx="80" cy="170" r="1.5" fill="#FFD700" opacity="0.3" />
      <circle cx="120" cy="172" r="1.5" fill="#FFD700" opacity="0.3" />
      <circle cx="100" cy="180" r="1.5" fill="#FFD700" opacity="0.3" />
      <circle cx="90" cy="190" r="1.5" fill="#FFD700" opacity="0.3" />
      <circle cx="110" cy="188" r="1.5" fill="#FFD700" opacity="0.3" />

      {/* Mangalsutra */}
      <path d="M85 146 Q100 158 115 146" stroke="#1A1A1A" strokeWidth="1" fill="none" />
      <path d="M90 150 Q100 160 110 150" stroke="#1A1A1A" strokeWidth="1" fill="none" />
      <circle cx="100" cy="158" r="3" fill="url(#anita-gold)" />
      <circle cx="96" cy="156" r="1.5" fill="#1A1A1A" />
      <circle cx="104" cy="156" r="1.5" fill="#1A1A1A" />

      {/* Face - round, warm, motherly */}
      <ellipse cx="100" cy="108" rx="38" ry="42" fill="url(#anita-skin)" filter="url(#anita-shadow)" />

      {/* Eyebrows - soft, natural */}
      <path d="M74 92 Q82 88 92 91" stroke="#2C1810" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M108 91 Q118 88 126 92" stroke="#2C1810" strokeWidth="1.8" fill="none" strokeLinecap="round" />

      {/* Eyes - warm, crinkled with smile */}
      <ellipse cx="83" cy="100" rx="8" ry="5" fill="white" />
      <ellipse cx="117" cy="100" rx="8" ry="5" fill="white" />
      <circle cx="83" cy="100" r="3.5" fill="#3D2B1F" />
      <circle cx="117" cy="100" r="3.5" fill="#3D2B1F" />
      <circle cx="82" cy="99" r="1.5" fill="white" />
      <circle cx="116" cy="99" r="1.5" fill="white" />
      {/* Crow's feet / smile lines at eyes */}
      <path d="M70 97 Q68 95 66 94" stroke="#C4956A" strokeWidth="0.6" fill="none" opacity="0.4" />
      <path d="M70 100 Q67 100 65 99" stroke="#C4956A" strokeWidth="0.6" fill="none" opacity="0.4" />
      <path d="M130 97 Q132 95 134 94" stroke="#C4956A" strokeWidth="0.6" fill="none" opacity="0.4" />
      <path d="M130 100 Q133 100 135 99" stroke="#C4956A" strokeWidth="0.6" fill="none" opacity="0.4" />

      {/* Nose */}
      <path d="M98 100 Q96 110 94 116 Q98 118 100 118 Q102 118 106 116 Q104 110 102 100"
        fill="none" stroke="#C4956A" strokeWidth="1" />

      {/* Warm smile - big, genuine */}
      <path d="M82 125 Q90 120 100 122 Q110 120 118 125" stroke="#A0705A" strokeWidth="1.5" fill="none" />
      <path d="M82 125 Q100 138 118 125" fill="#C0705A" opacity="0.6" />
      {/* Teeth showing in warm smile */}
      <path d="M86 127 Q100 135 114 127" fill="white" opacity="0.8" />
      {/* Smile dimples */}
      <circle cx="78" cy="124" r="2" fill="#C4956A" opacity="0.2" />
      <circle cx="122" cy="124" r="2" fill="#C4956A" opacity="0.2" />

      {/* Cheeks - rosy, warm */}
      <circle cx="72" cy="115" r="9" fill="#FF9999" opacity="0.15" />
      <circle cx="128" cy="115" r="9" fill="#FF9999" opacity="0.15" />

      {/* Bindi */}
      <circle cx="100" cy="84" r="3" fill="#E53935" />

      {/* Hair - oiled, neatly parted, tied back */}
      <path d="M60 88 Q58 68 68 52 Q80 38 100 36 Q120 38 132 52 Q142 68 140 88
              Q138 72 128 60 Q115 48 100 46 Q85 48 72 60 Q62 72 60 88"
        fill="url(#anita-hair)" />
      {/* Some grey streaks */}
      <path d="M72 58 Q85 46 100 44" stroke="#888" strokeWidth="1.5" fill="none" opacity="0.4" />
      <path d="M128 58 Q115 46 102 44" stroke="#888" strokeWidth="1.2" fill="none" opacity="0.3" />
      <path d="M68 65 Q82 50 100 47" stroke="#999" strokeWidth="1" fill="none" opacity="0.25" />
      {/* Center parting */}
      <line x1="100" y1="38" x2="100" y2="52" stroke="#1A0A00" strokeWidth="0.8" opacity="0.3" />
      {/* Hair bun */}
      <circle cx="100" cy="40" r="10" fill="url(#anita-hair)" />
      <circle cx="100" cy="40" r="9" fill="#2C1810" />

      {/* Ears */}
      <ellipse cx="62" cy="104" rx="4" ry="9" fill="url(#anita-skin)" />
      <ellipse cx="138" cy="104" rx="4" ry="9" fill="url(#anita-skin)" />

      {/* Simple gold stud earrings */}
      <circle cx="60" cy="106" r="3" fill="url(#anita-gold)" />
      <circle cx="60" cy="106" r="1.5" fill="#FFF" opacity="0.3" />
      <circle cx="140" cy="106" r="3" fill="url(#anita-gold)" />
      <circle cx="140" cy="106" r="1.5" fill="#FFF" opacity="0.3" />

      {/* Nasolabial folds (gentle) */}
      <path d="M78 112 Q76 120 80 128" stroke="#C4956A" strokeWidth="0.6" fill="none" opacity="0.3" />
      <path d="M122 112 Q124 120 120 128" stroke="#C4956A" strokeWidth="0.6" fill="none" opacity="0.3" />
    </svg>
  );
}

/** Vikram - Strong warrior type, intense gaze (balanced) */
function VikramAvatar() {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="vikram-bg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#546E7A" />
          <stop offset="100%" stopColor="#263238" />
        </radialGradient>
        <linearGradient id="vikram-skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C8935A" />
          <stop offset="100%" stopColor="#A67540" />
        </linearGradient>
        <linearGradient id="vikram-hair" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0D0500" />
          <stop offset="100%" stopColor="#1A0A00" />
        </linearGradient>
        <linearGradient id="vikram-armor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#607D8B" />
          <stop offset="50%" stopColor="#455A64" />
          <stop offset="100%" stopColor="#37474F" />
        </linearGradient>
        <linearGradient id="vikram-steel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#90A4AE" />
          <stop offset="50%" stopColor="#78909C" />
          <stop offset="100%" stopColor="#546E7A" />
        </linearGradient>
        <filter id="vikram-shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
        </filter>
        <linearGradient id="vikram-scar" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#B8805A" />
          <stop offset="100%" stopColor="#D4956A" />
        </linearGradient>
      </defs>

      <circle cx="100" cy="100" r="100" fill="url(#vikram-bg)" />

      {/* Thick neck */}
      <rect x="78" y="138" width="44" height="28" rx="8" fill="url(#vikram-skin)" />

      {/* Armor / military-style top */}
      <path d="M42 185 Q52 148 78 140 L78 200 L42 200 Z" fill="url(#vikram-armor)" />
      <path d="M158 185 Q148 148 122 140 L122 200 L158 200 Z" fill="url(#vikram-armor)" />
      <path d="M78 140 Q100 158 122 140 L122 200 L78 200 Z" fill="url(#vikram-armor)" />
      {/* Armor plates */}
      <path d="M55 165 L65 158 L75 165" fill="url(#vikram-steel)" opacity="0.5" />
      <path d="M145 165 L135 158 L125 165" fill="url(#vikram-steel)" opacity="0.5" />
      {/* Collar */}
      <path d="M80 140 Q80 136 84 134 Q92 138 100 140 Q108 138 116 134 Q120 136 120 140"
        fill="url(#vikram-armor)" stroke="url(#vikram-steel)" strokeWidth="1" />
      {/* Armor emblem */}
      <circle cx="100" cy="155" r="6" fill="url(#vikram-steel)" />
      <path d="M96 155 L100 148 L104 155 L100 162 Z" fill="#B71C1C" />

      {/* Shoulder pads */}
      <ellipse cx="52" cy="162" rx="12" ry="8" fill="url(#vikram-steel)" opacity="0.6" />
      <ellipse cx="148" cy="162" rx="12" ry="8" fill="url(#vikram-steel)" opacity="0.6" />

      {/* Face - strong, angular, warrior */}
      <path d="M60 105 Q58 78 70 62 Q84 48 100 46 Q116 48 130 62 Q142 78 140 105
              Q138 128 128 138 Q114 150 100 152 Q86 150 72 138 Q62 128 60 105"
        fill="url(#vikram-skin)" filter="url(#vikram-shadow)" />

      {/* Battle scar across right eyebrow / cheek */}
      <path d="M120 82 Q125 92 128 105 Q130 112 128 118"
        stroke="url(#vikram-scar)" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7" />
      <path d="M120 82 Q125 92 128 105 Q130 112 128 118"
        stroke="#D4A070" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.3" />

      {/* Thick, fierce eyebrows */}
      <path d="M68 88 Q78 80 94 84" stroke="#0D0500" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M106 84 Q122 80 132 88" stroke="#0D0500" strokeWidth="3.5" fill="none" strokeLinecap="round" />

      {/* Eyes - intense, focused, narrowed */}
      <path d="M72 97 Q82 92 92 97 Q82 102 72 97" fill="white" />
      <path d="M108 97 Q118 92 128 97 Q118 102 108 97" fill="white" />
      <circle cx="82" cy="97" r="4" fill="#1A0A00" />
      <circle cx="118" cy="97" r="4" fill="#1A0A00" />
      <circle cx="80" cy="96" r="1.5" fill="white" />
      <circle cx="116" cy="96" r="1.5" fill="white" />
      <circle cx="82" cy="97" r="2" fill="#0D0500" />
      <circle cx="118" cy="97" r="2" fill="#0D0500" />
      {/* Heavy upper lids */}
      <path d="M72 97 Q82 90 92 95" stroke="#0D0500" strokeWidth="2" fill="none" />
      <path d="M108 95 Q118 90 128 97" stroke="#0D0500" strokeWidth="2" fill="none" />

      {/* Nose - strong, broad */}
      <path d="M97 96 Q94 108 90 116 Q95 120 100 120 Q105 120 110 116 Q106 108 103 96"
        fill="none" stroke="#8B6530" strokeWidth="1.3" />
      <path d="M93 117 Q100 122 107 117" stroke="#8B6530" strokeWidth="0.8" fill="none" />

      {/* Tight-lipped determined expression */}
      <path d="M86 130 Q100 128 114 130" stroke="#8B5E3C" strokeWidth="2" fill="none" />
      <path d="M88 131 Q100 134 112 131" stroke="#7A4D2C" strokeWidth="1" fill="none" opacity="0.5" />

      {/* Stubble - heavy 5 o'clock shadow */}
      <rect x="72" y="124" width="56" height="24" rx="12" fill="#0D0500" opacity="0.08" />
      <rect x="68" y="110" width="10" height="30" rx="5" fill="#0D0500" opacity="0.05" />
      <rect x="122" y="110" width="10" height="30" rx="5" fill="#0D0500" opacity="0.05" />

      {/* Ears */}
      <ellipse cx="58" cy="100" rx="5" ry="10" fill="url(#vikram-skin)" />
      <ellipse cx="142" cy="100" rx="5" ry="10" fill="url(#vikram-skin)" />

      {/* Hair - military short, tight */}
      <path d="M58 95 Q56 70 68 55 Q82 42 100 40 Q118 42 132 55 Q144 70 142 95
              Q140 78 130 65 Q118 52 100 50 Q82 52 70 65 Q60 78 58 95"
        fill="url(#vikram-hair)" />
      {/* Buzz cut texture */}
      <path d="M65 60 Q82 46 100 44 Q118 46 135 60" stroke="#1A0A00" strokeWidth="0.5" fill="none" opacity="0.3" />
      <path d="M62 68 Q80 50 100 48 Q120 50 138 68" stroke="#1A0A00" strokeWidth="0.5" fill="none" opacity="0.3" />
      <path d="M60 76 Q78 55 100 52 Q122 55 140 76" stroke="#1A0A00" strokeWidth="0.5" fill="none" opacity="0.3" />

      {/* Headband - dark red */}
      <path d="M56 80 Q58 72 68 65 Q82 56 100 54 Q118 56 132 65 Q142 72 144 80"
        stroke="#8B0000" strokeWidth="5" fill="none" />
      <path d="M56 80 Q58 72 68 65 Q82 56 100 54 Q118 56 132 65 Q142 72 144 80"
        stroke="#B71C1C" strokeWidth="3" fill="none" />
      {/* Headband knot at back */}
      <path d="M56 80 L48 85 M56 80 L50 76" stroke="#8B0000" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* Jaw muscles */}
      <path d="M65 118 Q62 125 66 132" stroke="#A07040" strokeWidth="0.6" fill="none" opacity="0.3" />
      <path d="M135 118 Q138 125 134 132" stroke="#A07040" strokeWidth="0.6" fill="none" opacity="0.3" />
    </svg>
  );
}

/** Deepa - Glamorous, sparkly, party-girl energy (aggressive) */
function DeepaAvatar() {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="deepa-bg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#AB47BC" />
          <stop offset="100%" stopColor="#6A1B9A" />
        </radialGradient>
        <linearGradient id="deepa-skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F0D0A8" />
          <stop offset="100%" stopColor="#DDB88A" />
        </linearGradient>
        <linearGradient id="deepa-hair" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1A0A00" />
          <stop offset="50%" stopColor="#2C1810" />
          <stop offset="100%" stopColor="#1A0A00" />
        </linearGradient>
        <linearGradient id="deepa-dress" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#CE93D8" />
          <stop offset="50%" stopColor="#AB47BC" />
          <stop offset="100%" stopColor="#7B1FA2" />
        </linearGradient>
        <linearGradient id="deepa-highlight" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#4A148C" />
          <stop offset="50%" stopColor="#7B1FA2" />
          <stop offset="100%" stopColor="#4A148C" />
        </linearGradient>
        <linearGradient id="deepa-lip" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E91E63" />
          <stop offset="100%" stopColor="#C2185B" />
        </linearGradient>
        <linearGradient id="deepa-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#FFC107" />
        </linearGradient>
        <filter id="deepa-shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2" />
        </filter>
        <filter id="deepa-sparkle">
          <feGaussianBlur stdDeviation="0.5" />
        </filter>
      </defs>

      <circle cx="100" cy="100" r="100" fill="url(#deepa-bg)" />

      {/* Sparkle particles in background */}
      <circle cx="30" cy="30" r="1.5" fill="white" opacity="0.6" />
      <circle cx="170" cy="25" r="1" fill="white" opacity="0.5" />
      <circle cx="25" cy="80" r="1" fill="white" opacity="0.4" />
      <circle cx="175" cy="70" r="1.5" fill="white" opacity="0.5" />
      <circle cx="155" cy="45" r="1" fill="white" opacity="0.4" />
      <circle cx="45" cy="50" r="1.2" fill="white" opacity="0.5" />
      <path d="M35 60 L37 56 L39 60 L37 64 Z" fill="white" opacity="0.6" />
      <path d="M165 55 L167 51 L169 55 L167 59 Z" fill="white" opacity="0.5" />

      {/* Voluminous hair - flowing, glamorous */}
      <path d="M42 90 Q35 120 32 155 Q30 185 38 200 L55 200 Q45 180 46 155 Q48 125 52 95"
        fill="url(#deepa-hair)" />
      <path d="M158 90 Q165 120 168 155 Q170 185 162 200 L145 200 Q155 180 154 155 Q152 125 148 95"
        fill="url(#deepa-hair)" />
      {/* Hair waves */}
      <path d="M42 110 Q38 105 42 100" stroke="#2C1810" strokeWidth="2" fill="none" opacity="0.3" />
      <path d="M158 110 Q162 105 158 100" stroke="#2C1810" strokeWidth="2" fill="none" opacity="0.3" />
      <path d="M38 140 Q34 135 38 130" stroke="#2C1810" strokeWidth="2" fill="none" opacity="0.3" />
      <path d="M162 140 Q166 135 162 130" stroke="#2C1810" strokeWidth="2" fill="none" opacity="0.3" />

      {/* Neck - elegant */}
      <rect x="86" y="138" width="28" height="26" rx="6" fill="url(#deepa-skin)" />

      {/* Glamorous dress / top */}
      <path d="M50 178 Q60 148 86 140 Q100 156 114 140 Q140 148 150 178 L150 200 L50 200 Z"
        fill="url(#deepa-dress)" />
      {/* Sequin/sparkle pattern on dress */}
      <circle cx="70" cy="175" r="1" fill="white" opacity="0.4" />
      <circle cx="85" cy="168" r="1" fill="white" opacity="0.5" />
      <circle cx="100" cy="178" r="1" fill="white" opacity="0.4" />
      <circle cx="115" cy="170" r="1" fill="white" opacity="0.5" />
      <circle cx="130" cy="175" r="1" fill="white" opacity="0.4" />
      <circle cx="78" cy="185" r="1" fill="white" opacity="0.3" />
      <circle cx="95" cy="190" r="1" fill="white" opacity="0.4" />
      <circle cx="108" cy="185" r="1" fill="white" opacity="0.3" />
      <circle cx="122" cy="192" r="1" fill="white" opacity="0.4" />
      {/* Deep neckline */}
      <path d="M86 140 Q100 160 114 140" stroke="url(#deepa-highlight)" strokeWidth="1" fill="none" />

      {/* Statement necklace */}
      <path d="M82 144 Q90 148 95 152 Q100 154 105 152 Q110 148 118 144"
        stroke="url(#deepa-gold)" strokeWidth="2" fill="none" />
      <circle cx="88" cy="147" r="2" fill="#E91E63" />
      <circle cx="100" cy="153" r="3" fill="url(#deepa-gold)" />
      <circle cx="100" cy="153" r="1.5" fill="#E91E63" />
      <circle cx="112" cy="147" r="2" fill="#E91E63" />
      <circle cx="94" cy="151" r="1.5" fill="url(#deepa-gold)" />
      <circle cx="106" cy="151" r="1.5" fill="url(#deepa-gold)" />

      {/* Face - oval, glamorous */}
      <ellipse cx="100" cy="108" rx="35" ry="40" fill="url(#deepa-skin)" filter="url(#deepa-shadow)" />

      {/* Eyebrows - perfectly shaped, thin, dramatic arch */}
      <path d="M72 90 Q82 83 94 87" stroke="#1A0A00" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M106 87 Q118 83 128 90" stroke="#1A0A00" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* Eyes - dramatic, big, glamorous with eyeshadow */}
      {/* Eyeshadow */}
      <path d="M72 98 Q82 90 93 96" fill="#9C27B0" opacity="0.15" />
      <path d="M107 96 Q118 90 128 98" fill="#9C27B0" opacity="0.15" />
      {/* Eye whites */}
      <ellipse cx="83" cy="100" rx="10" ry="6.5" fill="white" />
      <ellipse cx="117" cy="100" rx="10" ry="6.5" fill="white" />
      {/* Iris */}
      <circle cx="84" cy="100" r="4.5" fill="#3E2723" />
      <circle cx="118" cy="100" r="4.5" fill="#3E2723" />
      {/* Pupil */}
      <circle cx="84" cy="100" r="2.2" fill="#0D0500" />
      <circle cx="118" cy="100" r="2.2" fill="#0D0500" />
      {/* Light reflection */}
      <circle cx="82" cy="98" r="2" fill="white" />
      <circle cx="116" cy="98" r="2" fill="white" />
      <circle cx="86" cy="102" r="0.8" fill="white" opacity="0.5" />
      <circle cx="120" cy="102" r="0.8" fill="white" opacity="0.5" />
      {/* Eyeliner - cat eye */}
      <path d="M73 99 Q77 93 93 96" stroke="#0D0500" strokeWidth="1.8" fill="none" />
      <path d="M107 96 Q123 93 127 99" stroke="#0D0500" strokeWidth="1.8" fill="none" />
      <line x1="73" y1="99" x2="68" y2="95" stroke="#0D0500" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="127" y1="99" x2="132" y2="95" stroke="#0D0500" strokeWidth="1.5" strokeLinecap="round" />
      {/* Lashes - dramatic */}
      <line x1="75" y1="96" x2="73" y2="92" stroke="#0D0500" strokeWidth="1" strokeLinecap="round" />
      <line x1="79" y1="94" x2="78" y2="90" stroke="#0D0500" strokeWidth="1" strokeLinecap="round" />
      <line x1="84" y1="94" x2="84" y2="90" stroke="#0D0500" strokeWidth="1" strokeLinecap="round" />
      <line x1="121" y1="94" x2="122" y2="90" stroke="#0D0500" strokeWidth="1" strokeLinecap="round" />
      <line x1="116" y1="94" x2="116" y2="90" stroke="#0D0500" strokeWidth="1" strokeLinecap="round" />
      <line x1="125" y1="96" x2="127" y2="92" stroke="#0D0500" strokeWidth="1" strokeLinecap="round" />
      {/* Lower lashes */}
      <path d="M76 104 Q83 109 90 104" stroke="#1A0A00" strokeWidth="0.6" fill="none" opacity="0.5" />
      <path d="M110 104 Q117 109 124 104" stroke="#1A0A00" strokeWidth="0.6" fill="none" opacity="0.5" />

      {/* Nose - small, cute */}
      <path d="M98 100 Q97 108 95 114 Q98 116 100 116 Q102 116 105 114 Q103 108 102 100"
        fill="none" stroke="#C4956A" strokeWidth="0.8" />

      {/* Lips - bold, glossy, playful pout */}
      <path d="M86 124 Q92 120 100 122 Q108 120 114 124" fill="url(#deepa-lip)" />
      <path d="M86 124 Q100 134 114 124" fill="url(#deepa-lip)" />
      {/* Lip gloss highlight */}
      <path d="M92 123 Q96 121 100 122 Q104 121 108 123" stroke="white" strokeWidth="0.8" fill="none" opacity="0.3" />
      <ellipse cx="100" cy="128" rx="4" ry="2" fill="white" opacity="0.12" />

      {/* Beauty mark */}
      <circle cx="120" cy="118" r="1.5" fill="#2C1810" />

      {/* Blush - glamorous */}
      <circle cx="70" cy="112" r="8" fill="#FF6B8A" opacity="0.15" />
      <circle cx="130" cy="112" r="8" fill="#FF6B8A" opacity="0.15" />

      {/* Hair - top, voluminous */}
      <path d="M50 88 Q48 62 62 46 Q78 32 100 30 Q122 32 138 46 Q152 62 150 88
              Q148 70 136 56 Q122 42 100 40 Q78 42 64 56 Q52 70 50 88"
        fill="url(#deepa-hair)" />
      {/* Volume and waves */}
      <path d="M55 75 Q50 65 55 55 Q65 40 100 35 Q135 40 145 55 Q150 65 145 75"
        stroke="#2C1810" strokeWidth="1" fill="none" opacity="0.3" />
      {/* Highlights / streaks */}
      <path d="M68 48 Q84 36 100 34" stroke="#4A3020" strokeWidth="2" fill="none" opacity="0.3" />
      <path d="M132 48 Q116 36 102 34" stroke="#4A3020" strokeWidth="2" fill="none" opacity="0.3" />
      {/* Side volume */}
      <path d="M50 88 Q45 85 44 92 Q45 100 50 95" fill="url(#deepa-hair)" />
      <path d="M150 88 Q155 85 156 92 Q155 100 150 95" fill="url(#deepa-hair)" />

      {/* Hair sparkle accessories */}
      <circle cx="75" cy="52" r="2" fill="white" opacity="0.7" filter="url(#deepa-sparkle)" />
      <circle cx="125" cy="52" r="2" fill="white" opacity="0.7" filter="url(#deepa-sparkle)" />
      <path d="M80 45 L81 42 L82 45 L81 48 Z" fill="white" opacity="0.6" />
      <path d="M120 45 L121 42 L122 45 L121 48 Z" fill="white" opacity="0.6" />

      {/* Statement earrings - dangling chandelier */}
      <circle cx="62" cy="106" r="2" fill="url(#deepa-gold)" />
      <line x1="62" y1="108" x2="62" y2="115" stroke="url(#deepa-gold)" strokeWidth="1" />
      <circle cx="62" cy="116" r="3" fill="url(#deepa-gold)" />
      <circle cx="62" cy="116" r="1.5" fill="#E91E63" />
      <circle cx="59" cy="119" r="1.5" fill="url(#deepa-gold)" />
      <circle cx="65" cy="119" r="1.5" fill="url(#deepa-gold)" />

      <circle cx="138" cy="106" r="2" fill="url(#deepa-gold)" />
      <line x1="138" y1="108" x2="138" y2="115" stroke="url(#deepa-gold)" strokeWidth="1" />
      <circle cx="138" cy="116" r="3" fill="url(#deepa-gold)" />
      <circle cx="138" cy="116" r="1.5" fill="#E91E63" />
      <circle cx="135" cy="119" r="1.5" fill="url(#deepa-gold)" />
      <circle cx="141" cy="119" r="1.5" fill="url(#deepa-gold)" />

      {/* Ears */}
      <ellipse cx="63" cy="104" rx="4" ry="8" fill="url(#deepa-skin)" />
      <ellipse cx="137" cy="104" rx="4" ry="8" fill="url(#deepa-skin)" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Avatar registry
// ---------------------------------------------------------------------------

const CHARACTER_AVATARS: Record<CharacterId, () => ReactElement> = {
  sharma_ji: SharmaJiAvatar,
  priya: PriyaAvatar,
  bunty: BuntyAvatar,
  meera: MeeraAvatar,
  raja: RajaAvatar,
  anita: AnitaAvatar,
  vikram: VikramAvatar,
  deepa: DeepaAvatar,
};

const CHARACTER_NAMES: Record<CharacterId, string> = {
  sharma_ji: 'Sharma Ji',
  priya: 'Priya',
  bunty: 'Bunty',
  meera: 'Meera',
  raja: 'Raja',
  anita: 'Anita',
  vikram: 'Vikram',
  deepa: 'Deepa',
};

// ---------------------------------------------------------------------------
// User avatar gradient palette (for letter-initial fallback)
// ---------------------------------------------------------------------------

const USER_GRADIENTS = [
  ['#FF6B6B', '#EE5A24'],
  ['#6C5CE7', '#A29BFE'],
  ['#00B894', '#00CEC9'],
  ['#FDCB6E', '#E17055'],
  ['#E84393', '#FD79A8'],
  ['#0984E3', '#74B9FF'],
  ['#00B894', '#55EFC4'],
  ['#D63031', '#FF7675'],
] as const;

function getUserGradient(username: string): readonly [string, string] {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return USER_GRADIENTS[Math.abs(hash) % USER_GRADIENTS.length];
}

// ---------------------------------------------------------------------------
// VIP Tier frame definitions
// ---------------------------------------------------------------------------

type NormalizedTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

function normalizeTier(tier?: VipTier | NormalizedTier): NormalizedTier {
  if (!tier) return 'bronze';
  return tier.toLowerCase() as NormalizedTier;
}

// ---------------------------------------------------------------------------
// AvatarFrame
// ---------------------------------------------------------------------------

interface AvatarFrameProps {
  children: React.ReactNode;
  tier?: VipTier | NormalizedTier;
  size?: AvatarSize;
}

export function AvatarFrame({ children, tier, size = 'md' }: AvatarFrameProps) {
  const t = normalizeTier(tier);
  const px = SIZE_PX[size];
  const borderWidth = Math.max(2, Math.round(px * 0.05));

  // Frame visual configs
  const frameConfig: Record<NormalizedTier, {
    borderColor: string;
    shadow: string;
    animate: boolean;
    double: boolean;
    rainbow: boolean;
  }> = {
    bronze: {
      borderColor: '#CD7F32',
      shadow: '0 0 0 1px rgba(205,127,50,0.3)',
      animate: false,
      double: false,
      rainbow: false,
    },
    silver: {
      borderColor: '#C0C0C0',
      shadow: '0 0 8px 1px rgba(192,192,192,0.4)',
      animate: false,
      double: false,
      rainbow: false,
    },
    gold: {
      borderColor: '#FFD700',
      shadow: '0 0 12px 2px rgba(255,215,0,0.5)',
      animate: true,
      double: false,
      rainbow: false,
    },
    platinum: {
      borderColor: '#E5E4E2',
      shadow: '0 0 14px 3px rgba(229,228,226,0.5)',
      animate: true,
      double: true,
      rainbow: false,
    },
    diamond: {
      borderColor: '#B9F2FF',
      shadow: '0 0 18px 4px rgba(185,242,255,0.5)',
      animate: true,
      double: true,
      rainbow: true,
    },
  };

  const cfg = frameConfig[t];
  const outerSize = px + borderWidth * 2 + (cfg.double ? borderWidth * 2 + 4 : 0);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: outerSize, height: outerSize }}>
      {/* Outer ring for double-ring tiers */}
      {cfg.double && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            border: `${borderWidth}px solid ${cfg.rainbow ? 'transparent' : cfg.borderColor}`,
            ...(cfg.rainbow
              ? {
                  background: `conic-gradient(from 0deg, #ff0000, #ff8000, #ffff00, #00ff00, #0080ff, #8000ff, #ff00ff, #ff0000) border-box`,
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                  padding: borderWidth,
                }
              : {}),
            boxShadow: cfg.shadow,
          }}
          animate={
            cfg.animate
              ? cfg.rainbow
                ? { rotate: 360 }
                : { boxShadow: [cfg.shadow, `0 0 20px 4px ${cfg.borderColor}60`, cfg.shadow] }
              : undefined
          }
          transition={
            cfg.animate
              ? cfg.rainbow
                ? { repeat: Infinity, duration: 3, ease: 'linear' }
                : { repeat: Infinity, duration: 2, ease: 'easeInOut' }
              : undefined
          }
        />
      )}

      {/* Inner ring */}
      <motion.div
        className="rounded-full overflow-hidden flex items-center justify-center"
        style={{
          width: px + borderWidth * 2,
          height: px + borderWidth * 2,
          border: `${borderWidth}px solid ${cfg.borderColor}`,
          boxShadow: cfg.double ? 'none' : cfg.shadow,
        }}
        animate={
          cfg.animate && !cfg.double
            ? { boxShadow: [cfg.shadow, `0 0 16px 3px ${cfg.borderColor}60`, cfg.shadow] }
            : undefined
        }
        transition={
          cfg.animate && !cfg.double
            ? { repeat: Infinity, duration: 2, ease: 'easeInOut' }
            : undefined
        }
      >
        <div className="w-full h-full rounded-full overflow-hidden">{children}</div>
      </motion.div>

      {/* Sparkle particles for Platinum and Diamond */}
      {(t === 'platinum' || t === 'diamond') && (
        <>
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: Math.max(2, px * 0.05),
                height: Math.max(2, px * 0.05),
                backgroundColor: t === 'diamond' ? '#B9F2FF' : '#E5E4E2',
              }}
              animate={{
                x: [0, Math.cos((i * Math.PI) / 2) * outerSize * 0.55],
                y: [0, Math.sin((i * Math.PI) / 2) * outerSize * 0.55],
                opacity: [0, 1, 0],
                scale: [0, 1.2, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 2,
                delay: i * 0.5,
                ease: 'easeOut',
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CharacterAvatar
// ---------------------------------------------------------------------------

interface CharacterAvatarProps {
  characterId: CharacterId;
  size?: AvatarSize;
  showFrame?: boolean;
  vipTier?: VipTier | NormalizedTier;
}

export function CharacterAvatar({
  characterId,
  size = 'md',
  showFrame = false,
  vipTier,
}: CharacterAvatarProps) {
  const AvatarComponent = CHARACTER_AVATARS[characterId];
  const px = SIZE_PX[size];

  const avatarContent = (
    <div
      className="rounded-full overflow-hidden"
      style={{ width: px, height: px }}
      title={CHARACTER_NAMES[characterId]}
    >
      <AvatarComponent />
    </div>
  );

  if (showFrame && vipTier) {
    return (
      <AvatarFrame tier={vipTier} size={size}>
        {avatarContent}
      </AvatarFrame>
    );
  }

  return avatarContent;
}

// ---------------------------------------------------------------------------
// UserAvatar
// ---------------------------------------------------------------------------

interface UserAvatarProps {
  username: string;
  avatarUrl?: string | null;
  size?: AvatarSize;
  showFrame?: boolean;
  vipTier?: VipTier | NormalizedTier;
  isOnline?: boolean;
}

export function UserAvatar({
  username,
  avatarUrl,
  size = 'md',
  showFrame = false,
  vipTier,
  isOnline,
}: UserAvatarProps) {
  const px = SIZE_PX[size];
  const [from, to] = getUserGradient(username);
  const initial = username.charAt(0).toUpperCase();
  const gradientId = `user-grad-${username.replace(/\W/g, '')}`;
  const fontSize = Math.max(12, px * 0.45);
  const onlineDotSize = Math.max(6, px * 0.18);

  const avatarContent = (
    <div className="relative" style={{ width: px, height: px }}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={username}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full rounded-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={from} />
              <stop offset="100%" stopColor={to} />
            </linearGradient>
            <filter id={`${gradientId}-shadow`}>
              <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.3" />
            </filter>
          </defs>
          <circle cx="50" cy="50" r="50" fill={`url(#${gradientId})`} />
          {/* Subtle inner ring */}
          <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          {/* Shine */}
          <ellipse cx="38" cy="35" rx="18" ry="15" fill="rgba(255,255,255,0.08)" />
          <text
            x="50"
            y="50"
            textAnchor="middle"
            dominantBaseline="central"
            fill="white"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="700"
            fontSize={fontSize}
            filter={`url(#${gradientId}-shadow)`}
          >
            {initial}
          </text>
        </svg>
      )}

      {/* Online indicator */}
      {isOnline !== undefined && (
        <div
          className={cn(
            'absolute rounded-full border-2 border-gray-900',
            isOnline ? 'bg-green-400' : 'bg-gray-500'
          )}
          style={{
            width: onlineDotSize,
            height: onlineDotSize,
            bottom: 0,
            right: 0,
          }}
        />
      )}
    </div>
  );

  if (showFrame && vipTier) {
    return (
      <AvatarFrame tier={vipTier} size={size}>
        {avatarContent}
      </AvatarFrame>
    );
  }

  return avatarContent;
}
