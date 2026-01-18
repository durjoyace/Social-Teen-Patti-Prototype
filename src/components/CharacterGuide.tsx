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
              <linearGradient id="sareeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#D4745E" />
                <stop offset="100%" stopColor="#B85F45" />
              </linearGradient>
              <linearGradient id="skinGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F5D5C0" />
                <stop offset="100%" stopColor="#E6C2A8" />
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
            </defs>

            {/* Saree Drape with Pattern */}
            <path d="M25 180V110C25 110 35 85 80 85C125 85 135 110 135 110V180H25Z" fill="url(#sareeGradient)" filter="url(#softShadow)" />

            {/* Saree Border Pattern */}
            <path d="M25 180V175L30 170L35 175L40 170L45 175L50 170L55 175L60 170L65 175L70 170L75 175L80 170L85 175L90 170L95 175L100 170L105 175L110 170L115 175L120 170L125 175L130 170L135 175V180H25Z" fill="#D4AF37" />

            {/* Saree Pallu (shoulder drape) */}
            <path d="M80 85C70 85 50 95 25 125V180H45V130C60 100 75 90 80 85Z" fill="#8B0000" fillOpacity="0.4" />

            {/* Blouse */}
            <ellipse cx="80" cy="85" rx="30" ry="15" fill="#8B0000" />

            {/* Neck */}
            <rect x="72" y="70" width="16" height="15" fill="url(#skinGradient)" rx="3" />

            {/* Head */}
            <circle cx="80" cy="55" r="38" fill="url(#skinGradient)" filter="url(#softShadow)" />

            {/* Hair Bun with Detail */}
            <circle cx="80" cy="35" r="42" fill="#3A3A3A" />
            <circle cx="80" cy="35" r="38" fill="#4A4A4A" />
            <circle cx="85" cy="32" r="8" fill="#3A3A3A" opacity="0.5" />

            {/* Hair Parting */}
            <path d="M50 50C50 50 60 25 80 25C100 25 110 50 110 50" stroke="#3A3A3A" strokeWidth="2" />

            {/* Earrings */}
            <circle cx="45" cy="60" r="5" fill="#D4AF37" stroke="#F4C430" strokeWidth="1" />
            <circle cx="115" cy="60" r="5" fill="#D4AF37" stroke="#F4C430" strokeWidth="1" />
            <circle cx="45" cy="68" r="3" fill="#D4AF37" />
            <circle cx="115" cy="68" r="3" fill="#D4AF37" />

            {/* Glasses with Reflection */}
            <g opacity="0.95">
              <circle cx="65" cy="55" r="10" stroke="#D4AF37" strokeWidth="2.5" fill="rgba(255,255,255,0.1)" />
              <circle cx="95" cy="55" r="10" stroke="#D4AF37" strokeWidth="2.5" fill="rgba(255,255,255,0.1)" />
              <path d="M75 55H85" stroke="#D4AF37" strokeWidth="2.5" />
              <path d="M55 55H50" stroke="#D4AF37" strokeWidth="2" />
              <path d="M105 55H110" stroke="#D4AF37" strokeWidth="2" />
              {/* Lens reflection */}
              <circle cx="68" cy="52" r="3" fill="white" opacity="0.6" />
              <circle cx="98" cy="52" r="3" fill="white" opacity="0.6" />
            </g>

            {/* Bindi (larger, more detailed) */}
            <circle cx="80" cy="40" r="4" fill="#8B0000" />
            <circle cx="80" cy="40" r="2.5" fill="#A52A2A" />

            {/* Nose Ring */}
            <circle cx="75" cy="62" r="2" fill="none" stroke="#D4AF37" strokeWidth="1.5" />

            {/* Smile with warmth */}
            <path d="M62 70Q80 78 98 70" stroke="#8B4513" strokeWidth="2.5" strokeLinecap="round" fill="none" />

            {/* Eyes (closed, peaceful) */}
            <path d="M60 52Q65 54 70 52" stroke="#4A4A4A" strokeWidth="2" strokeLinecap="round" />
            <path d="M90 52Q95 54 100 52" stroke="#4A4A4A" strokeWidth="2" strokeLinecap="round" />

            {/* Necklace */}
            <ellipse cx="80" cy="75" rx="25" ry="5" fill="none" stroke="#D4AF37" strokeWidth="2" />
            <circle cx="80" cy="78" r="4" fill="#D4AF37" stroke="#F4C430" strokeWidth="1" />

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