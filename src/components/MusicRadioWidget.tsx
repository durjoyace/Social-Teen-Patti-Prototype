import React, { useState } from 'react';
import { Music, Volume2, SkipForward, Pause, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
export function MusicRadioWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  return <>
      {/* Floating Toggle Button */}
      <motion.button onClick={() => setIsOpen(!isOpen)} className="fixed top-20 right-4 z-40 bg-[#8B0000] text-[#D4AF37] p-3 rounded-full shadow-lg border-2 border-[#D4AF37]" whileHover={{
      scale: 1.05
    }} whileTap={{
      scale: 0.95
    }}>
        <Music size={20} className={isPlaying ? 'animate-pulse' : ''} />
      </motion.button>

      {/* Expanded Radio Controls */}
      <AnimatePresence>
        {isOpen && <motion.div initial={{
        opacity: 0,
        x: 50,
        scale: 0.9
      }} animate={{
        opacity: 1,
        x: 0,
        scale: 1
      }} exit={{
        opacity: 0,
        x: 50,
        scale: 0.9
      }} className="fixed top-20 right-16 z-40 bg-[#FFF8DC] border-2 border-[#D4AF37] rounded-xl p-4 shadow-xl w-64">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[#8B0000] font-bold text-sm">
                Desi Radio FM
              </h3>
              <div className="flex gap-1">
                <span className="w-1 h-3 bg-[#D4745E] animate-pulse"></span>
                <span className="w-1 h-4 bg-[#D4745E] animate-pulse delay-75"></span>
                <span className="w-1 h-2 bg-[#D4745E] animate-pulse delay-150"></span>
              </div>
            </div>
            <p className="text-xs text-stone-600 mb-3 truncate">
              Now Playing: Bollywood Classics 90s
            </p>

            <div className="flex items-center justify-between text-[#8B0000]">
              <Volume2 size={16} />
              <button onClick={() => setIsPlaying(!isPlaying)} className="p-2 bg-[#D4745E]/10 rounded-full hover:bg-[#D4745E]/20">
                {isPlaying ? <Pause size={20} fill="#8B0000" /> : <Play size={20} fill="#8B0000" />}
              </button>
              <SkipForward size={16} className="cursor-pointer hover:text-[#D4745E]" />
            </div>
          </motion.div>}
      </AnimatePresence>
    </>;
}