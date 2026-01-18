import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
export function FestivalBanner() {
  return <motion.div initial={{
    height: 0,
    opacity: 0
  }} animate={{
    height: 'auto',
    opacity: 1
  }} className="bg-[#8B0000] text-[#FFF8DC] px-4 py-3 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20" style={{
      backgroundImage: 'radial-gradient(circle, #D4AF37 1px, transparent 1px)',
      backgroundSize: '10px 10px'
    }}></div>

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="text-[#D4AF37]" size={18} />
          <div>
            <p className="text-xs font-medium text-[#D4AF37]">DIWALI SPECIAL</p>
            <p className="font-bold text-sm">2x Chips on First Win!</p>
          </div>
        </div>
        <button className="bg-[#D4AF37] text-[#8B0000] text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
          Claim Now
        </button>
      </div>
    </motion.div>;
}