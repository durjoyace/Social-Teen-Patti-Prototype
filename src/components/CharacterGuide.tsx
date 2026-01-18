import React, { Component } from 'react';
import { motion } from 'framer-motion';
interface CharacterGuideProps {
  text: string;
  onNext?: () => void;
  showNext?: boolean;
}
export function CharacterGuide({
  text,
  onNext,
  showNext = true
}: CharacterGuideProps) {
  return <div className="fixed bottom-0 left-0 right-0 z-50 p-4 flex items-end justify-center pointer-events-none">
      <div className="w-full max-w-md relative flex items-end gap-2">
        {/* Enhanced Grandmother Character */}
        <motion.div initial={{
        y: 100,
        opacity: 0
      }} animate={{
        y: 0,
        opacity: 1
      }} transition={{
        type: 'spring',
        stiffness: 80,
        damping: 15
      }} className="relative z-20 -mb-4">
          <svg width="160" height="180" viewBox="0 0 160 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-2xl">
            <defs>
              <linearGradient id="sareeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E85D75" />
                <stop offset="50%" stopColor="#D4456A" />
                <stop offset="100%" stopColor="#B83A5A" />
              </linearGradient>
              <linearGradient id="skinGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FCECD9" />
                <stop offset="100%" stopColor="#E8CDB5" />
              </linearGradient>
              <linearGradient id="hairGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4A4A4A" />
                <stop offset="30%" stopColor="#6B6B6B" />
                <stop offset="100%" stopColor="#3D3D3D" />
              </linearGradient>
              <linearGradient id="blushGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFB4B4" stopOpacity="0" />
                <stop offset="50%" stopColor="#FFB4B4" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#FFB4B4" stopOpacity="0" />
              </linearGradient>
              <filter id="softShadow">
                <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                <feOffset dx="0" dy="2" result="offsetblur" />
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.3" />
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Saree Drape with Pattern */}
            <path d="M25 180V115C25 115 40 90 80 90C120 90 135 115 135 115V180H25Z" fill="url(#sareeGradient)" filter="url(#softShadow)" />

            {/* Saree decorative patterns */}
            <path d="M30 140C35 138 40 142 45 140C50 138 55 142 60 140" stroke="#D4AF37" strokeWidth="1" opacity="0.6" />
            <path d="M100 140C105 138 110 142 115 140C120 138 125 142 130 140" stroke="#D4AF37" strokeWidth="1" opacity="0.6" />

            {/* Saree Border Pattern - more intricate */}
            <path d="M25 180V173L28 168L31 173L34 168L37 173L40 168L43 173L46 168L49 173L52 168L55 173L58 168L61 173L64 168L67 173L70 168L73 173L76 168L79 173L82 168L85 173L88 168L91 173L94 168L97 173L100 168L103 173L106 168L109 173L112 168L115 173L118 168L121 173L124 168L127 173L130 168L133 173L135 180H25Z" fill="#D4AF37" />
            <path d="M25 180V177H135V180H25Z" fill="#B8860B" />

            {/* Saree Pallu (shoulder drape) with pattern */}
            <path d="M80 90C70 90 45 100 25 135V180H50V140C65 110 75 95 80 90Z" fill="#B83A5A" fillOpacity="0.5" />
            <circle cx="35" cy="155" r="3" fill="#D4AF37" opacity="0.7" />
            <circle cx="42" cy="145" r="2" fill="#D4AF37" opacity="0.7" />

            {/* Blouse with embroidery */}
            <ellipse cx="80" cy="92" rx="32" ry="12" fill="#8B0000" />
            <path d="M60 92C65 90 75 88 80 88C85 88 95 90 100 92" stroke="#D4AF37" strokeWidth="1" opacity="0.8" />

            {/* Neck - more feminine, slender */}
            <path d="M72 75L74 90H86L88 75Z" fill="url(#skinGradient)" />

            {/* Face - more oval/feminine shape */}
            <ellipse cx="80" cy="52" rx="32" ry="36" fill="url(#skinGradient)" filter="url(#softShadow)" />

            {/* Subtle jaw definition for feminine face */}
            <path d="M50 55Q55 85 80 88Q105 85 110 55" fill="url(#skinGradient)" />

            {/* Hair - feminine style with grey streaks */}
            <ellipse cx="80" cy="28" rx="38" ry="32" fill="url(#hairGradient)" />
            {/* Hair volume on sides */}
            <path d="M45 35Q42 50 48 65" stroke="#5A5A5A" strokeWidth="8" strokeLinecap="round" />
            <path d="M115 35Q118 50 112 65" stroke="#5A5A5A" strokeWidth="8" strokeLinecap="round" />

            {/* Grey hair streaks */}
            <path d="M55 25Q60 15 80 12Q100 15 105 25" stroke="#9A9A9A" strokeWidth="2" opacity="0.7" />
            <path d="M60 30Q70 20 80 18Q90 20 100 30" stroke="#8A8A8A" strokeWidth="1.5" opacity="0.5" />

            {/* Hair bun at back */}
            <circle cx="80" cy="18" r="18" fill="#4A4A4A" />
            <circle cx="80" cy="18" r="14" fill="#5A5A5A" />
            {/* Bun decoration - flowers */}
            <circle cx="68" cy="12" r="4" fill="#FFFFFF" opacity="0.9" />
            <circle cx="68" cy="12" r="2" fill="#FFD700" />
            <circle cx="92" cy="12" r="4" fill="#FFFFFF" opacity="0.9" />
            <circle cx="92" cy="12" r="2" fill="#FFD700" />

            {/* Sindoor in hair parting */}
            <path d="M80 18V35" stroke="#FF4500" strokeWidth="3" />

            {/* Earrings - jhumkas */}
            <circle cx="48" cy="58" r="4" fill="#D4AF37" stroke="#F4C430" strokeWidth="1" />
            <ellipse cx="48" cy="68" rx="5" ry="7" fill="#D4AF37" />
            <circle cx="48" cy="68" r="3" fill="#8B0000" />
            <circle cx="48" cy="75" r="2" fill="#D4AF37" />

            <circle cx="112" cy="58" r="4" fill="#D4AF37" stroke="#F4C430" strokeWidth="1" />
            <ellipse cx="112" cy="68" rx="5" ry="7" fill="#D4AF37" />
            <circle cx="112" cy="68" r="3" fill="#8B0000" />
            <circle cx="112" cy="75" r="2" fill="#D4AF37" />

            {/* Rosy cheeks */}
            <ellipse cx="55" cy="62" rx="8" ry="5" fill="#FFB4B4" opacity="0.4" />
            <ellipse cx="105" cy="62" rx="8" ry="5" fill="#FFB4B4" opacity="0.4" />

            {/* Eyebrows - feminine, groomed */}
            <path d="M56 42Q65 38 74 42" stroke="#4A4A4A" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M86 42Q95 38 104 42" stroke="#4A4A4A" strokeWidth="2" strokeLinecap="round" fill="none" />

            {/* Eyes - larger, more feminine with lashes */}
            <g>
              {/* Left eye */}
              <ellipse cx="65" cy="50" rx="8" ry="5" fill="white" />
              <circle cx="65" cy="50" r="4" fill="#3D2314" />
              <circle cx="65" cy="50" r="2" fill="black" />
              <circle cx="66" cy="49" r="1" fill="white" />
              {/* Left eyelashes */}
              <path d="M57 47L55 44" stroke="#3A3A3A" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M59 46L58 43" stroke="#3A3A3A" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M62 45L62 42" stroke="#3A3A3A" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M65 45L66 42" stroke="#3A3A3A" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M68 45L70 43" stroke="#3A3A3A" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M71 47L73 44" stroke="#3A3A3A" strokeWidth="1.5" strokeLinecap="round" />
              {/* Left lower lash line */}
              <path d="M58 53Q65 56 72 53" stroke="#5A5A5A" strokeWidth="1" fill="none" />
            </g>
            <g>
              {/* Right eye */}
              <ellipse cx="95" cy="50" rx="8" ry="5" fill="white" />
              <circle cx="95" cy="50" r="4" fill="#3D2314" />
              <circle cx="95" cy="50" r="2" fill="black" />
              <circle cx="96" cy="49" r="1" fill="white" />
              {/* Right eyelashes */}
              <path d="M87 47L85 44" stroke="#3A3A3A" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M89 46L88 43" stroke="#3A3A3A" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M92 45L92 42" stroke="#3A3A3A" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M95 45L96 42" stroke="#3A3A3A" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M98 45L100 43" stroke="#3A3A3A" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M101 47L103 44" stroke="#3A3A3A" strokeWidth="1.5" strokeLinecap="round" />
              {/* Right lower lash line */}
              <path d="M88 53Q95 56 102 53" stroke="#5A5A5A" strokeWidth="1" fill="none" />
            </g>

            {/* Glasses with delicate gold frame */}
            <g opacity="0.9">
              <ellipse cx="65" cy="50" rx="12" ry="10" stroke="#D4AF37" strokeWidth="2" fill="none" />
              <ellipse cx="95" cy="50" rx="12" ry="10" stroke="#D4AF37" strokeWidth="2" fill="none" />
              <path d="M77 50H83" stroke="#D4AF37" strokeWidth="2" />
              <path d="M53 48L48 46" stroke="#D4AF37" strokeWidth="1.5" />
              <path d="M107 48L112 46" stroke="#D4AF37" strokeWidth="1.5" />
            </g>

            {/* Bindi - decorative with glow */}
            <circle cx="80" cy="36" r="5" fill="#8B0000" filter="url(#glow)" />
            <circle cx="80" cy="36" r="3" fill="#FF0000" />
            <circle cx="79" cy="35" r="1" fill="white" opacity="0.6" />

            {/* Nose - feminine, delicate */}
            <path d="M80 52L78 62L80 64L82 62Z" fill="#E0B89D" />

            {/* Nose Ring - delicate nath */}
            <circle cx="76" cy="63" r="2.5" fill="none" stroke="#D4AF37" strokeWidth="1.5" />
            <circle cx="74" cy="64" r="1" fill="#D4AF37" />

            {/* Lips - feminine, fuller */}
            <path d="M70 72Q75 70 80 70Q85 70 90 72" fill="#C4686A" />
            <path d="M70 72Q80 78 90 72" fill="#D47B7D" />
            <path d="M75 72Q80 74 85 72" fill="#E88B8D" opacity="0.5" />

            {/* Smile lines - gentle */}
            <path d="M68 74Q69 76 70 74" stroke="#C9A88C" strokeWidth="0.5" fill="none" />
            <path d="M90 74Q91 76 92 74" stroke="#C9A88C" strokeWidth="0.5" fill="none" />

            {/* Mangalsutra necklace */}
            <path d="M55 78Q80 85 105 78" stroke="#3A3A3A" strokeWidth="1.5" fill="none" />
            <circle cx="70" cy="82" r="2" fill="#3A3A3A" />
            <circle cx="80" cy="84" r="3" fill="#D4AF37" />
            <circle cx="90" cy="82" r="2" fill="#3A3A3A" />

            {/* Gold necklace */}
            <path d="M52 75Q80 82 108 75" stroke="#D4AF37" strokeWidth="2" fill="none" />
            <circle cx="80" cy="80" r="4" fill="#D4AF37" stroke="#F4C430" strokeWidth="1" />
            <circle cx="68" cy="78" r="2" fill="#D4AF37" />
            <circle cx="92" cy="78" r="2" fill="#D4AF37" />

            {/* Subtle breathing animation */}
            <motion.g animate={{
            y: [0, -1, 0]
          }} transition={{
            repeat: Infinity,
            duration: 3,
            ease: 'easeInOut'
          }}>
              {/* This group would contain the torso for breathing effect */}
            </motion.g>
          </svg>
        </motion.div>

        {/* Enhanced Speech Bubble */}
        <motion.div initial={{
        scale: 0.8,
        opacity: 0,
        x: -20
      }} animate={{
        scale: 1,
        opacity: 1,
        x: 0
      }} transition={{
        delay: 0.4,
        type: 'spring',
        stiffness: 100
      }} className="bg-white/95 backdrop-blur-sm p-6 rounded-3xl rounded-bl-sm shadow-premium-lg border-2 border-[#D4AF37] mb-24 relative z-20 pointer-events-auto max-w-[260px]">
          {/* Speech bubble tail */}
          <div className="absolute -left-2 bottom-6 w-4 h-4 bg-white/95 border-l-2 border-b-2 border-[#D4AF37] transform rotate-45" />

          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />
            <h4 className="text-[#8B0000] font-bold text-sm font-hindi">
              Lakshmi Ma
            </h4>
          </div>

          <motion.p className="text-stone-800 text-sm leading-relaxed font-medium" initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          delay: 0.6,
          duration: 0.5
        }}>
            {text}
          </motion.p>

          {showNext && <motion.button onClick={onNext} className="mt-4 text-xs font-bold text-[#D4745E] flex items-center gap-1.5 hover:gap-2 transition-all duration-300 group" whileHover={{
          x: 2
        }} whileTap={{
          scale: 0.95
        }}>
              <span>NEXT</span>
              <motion.span animate={{
            x: [0, 3, 0]
          }} transition={{
            repeat: Infinity,
            duration: 1.5
          }}>
                →
              </motion.span>
            </motion.button>}
        </motion.div>
      </div>
    </div>;
}