import React from 'react';
import { motion } from 'framer-motion';
import { Users, ChevronRight, Sparkles } from 'lucide-react';
interface TableCardProps {
  title: string;
  minBuyIn: string;
  players: number;
  type: 'classic' | 'joker' | 'muflis';
  delay?: number;
  onClick?: () => void;
}
export function TableCard({
  title,
  minBuyIn,
  players,
  type,
  delay = 0,
  onClick
}: TableCardProps) {
  const warmGradients = {
    classic: 'from-[#8B0000] via-[#A52A2A] to-[#8B0000]',
    joker: 'from-[#B8860B] via-[#DAA520] to-[#B8860B]',
    muflis: 'from-[#D2691E] via-[#CD853F] to-[#D2691E]'
  };
  const patterns = {
    classic: <svg width="200" height="200" viewBox="0 0 200 200" className="absolute top-0 right-0 opacity-10">
        <defs>
          <pattern id="paisley" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M20 5C15 5 10 10 10 15C10 20 15 25 20 30C25 25 30 20 30 15C30 10 25 5 20 5Z" fill="white" />
            <circle cx="20" cy="15" r="3" fill="white" opacity="0.5" />
          </pattern>
        </defs>
        <rect width="200" height="200" fill="url(#paisley)" />
      </svg>,
    joker: <svg width="200" height="200" viewBox="0 0 200 200" className="absolute top-0 right-0 opacity-10">
        <defs>
          <pattern id="diamonds" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M15 5L25 15L15 25L5 15Z" fill="white" />
          </pattern>
        </defs>
        <rect width="200" height="200" fill="url(#diamonds)" />
      </svg>,
    muflis: <svg width="200" height="200" viewBox="0 0 200 200" className="absolute top-0 right-0 opacity-10">
        <defs>
          <pattern id="rangoli" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
            <circle cx="25" cy="25" r="8" fill="none" stroke="white" strokeWidth="2" />
            <circle cx="25" cy="25" r="4" fill="white" />
          </pattern>
        </defs>
        <rect width="200" height="200" fill="url(#rangoli)" />
      </svg>
  };
  return <motion.div initial={{
    opacity: 0,
    y: 20
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    delay: delay * 0.1,
    type: 'spring',
    stiffness: 100,
    damping: 15
  }} whileHover={{
    scale: 1.02,
    y: -4,
    transition: {
      duration: 0.2
    }
  }} whileTap={{
    scale: 0.98
  }} onClick={onClick} className={`w-full rounded-2xl p-5 shadow-premium text-white relative overflow-hidden cursor-pointer mb-4 bg-gradient-to-br ${warmGradients[type]}`}>
      {/* Glassmorphism Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />

      {/* Decorative Pattern */}
      {patterns[type]}

      {/* Shine Effect */}
      <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" initial={{
      x: '-100%'
    }} whileHover={{
      x: '100%'
    }} transition={{
      duration: 0.6
    }} />

      <div className="relative z-10 flex justify-between items-center">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold opacity-90 uppercase tracking-wider">
              {type} Teen Patti
            </span>
            {type === 'joker' && <Sparkles size={12} className="text-[#F4C430]" />}
          </div>

          <h3 className="text-2xl font-display font-bold mt-1 mb-3 text-shadow-lg">
            {title}
          </h3>

          <div className="flex items-center gap-3 text-sm font-semibold">
            <div className="bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/20">
              <span className="text-xs">Min</span>
              <span className="text-[#F4C430]">₹{minBuyIn}</span>
            </div>
            <div className="flex items-center gap-1.5 opacity-90">
              <Users size={16} strokeWidth={2.5} />
              <span className="font-bold">{players}</span>
            </div>
          </div>
        </div>

        <motion.div className="bg-white/20 backdrop-blur-sm p-3 rounded-full border border-white/30" whileHover={{
        scale: 1.1,
        rotate: 5
      }} transition={{
        type: 'spring',
        stiffness: 400
      }}>
          <ChevronRight size={24} strokeWidth={2.5} />
        </motion.div>
      </div>

      {/* Bottom Accent Line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
    </motion.div>;
}