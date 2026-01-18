import React from 'react';
import { motion } from 'framer-motion';
interface PlayerAvatarProps {
  name: string;
  image?: string;
  chips?: string;
  isActive?: boolean;
  isDealer?: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  size?: 'sm' | 'md' | 'lg';
}
export function PlayerAvatar({
  name,
  image,
  chips,
  isActive = false,
  isDealer = false,
  size = 'md'
}: PlayerAvatarProps) {
  const sizeClasses = {
    sm: 'w-10 h-10 text-xs',
    md: 'w-14 h-14 text-sm',
    lg: 'w-20 h-20 text-base'
  };
  return <div className="flex flex-col items-center gap-1 relative">
      {/* Avatar Circle */}
      <div className="relative">
        {isActive && <motion.div className="absolute -inset-1 rounded-full border-2 border-[#D4AF37]" animate={{
        scale: [1, 1.1, 1],
        opacity: [0.5, 1, 0.5]
      }} transition={{
        repeat: Infinity,
        duration: 2
      }} />}

        <div className={`${sizeClasses[size]} rounded-full bg-stone-200 border-2 ${isActive ? 'border-[#D4AF37]' : 'border-white'} overflow-hidden shadow-md relative z-10`}>
          {image ? <img src={image} alt={name} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-[#D4745E] to-[#8B0000] flex items-center justify-center text-white font-bold">
              {name.charAt(0)}
            </div>}
        </div>

        {isDealer && <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full border border-stone-200 flex items-center justify-center text-[10px] font-bold text-stone-800 shadow-sm z-20">
            D
          </div>}
      </div>

      {/* Name & Chips Badge */}
      <div className="bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-full border border-[#D4AF37]/30 flex flex-col items-center min-w-[60px]">
        <span className="text-white text-[10px] font-medium truncate max-w-[80px]">
          {name}
        </span>
        {chips && <span className="text-[#D4AF37] text-[10px] font-bold">₹{chips}</span>}
      </div>
    </div>;
}