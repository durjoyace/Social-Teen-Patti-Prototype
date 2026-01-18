import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MessageCircle, Menu, Settings } from 'lucide-react';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { ChatPanel } from '../components/ChatPanel';
interface GameTableProps {
  onBack: () => void;
}
export function GameTable({
  onBack
}: GameTableProps) {
  const [showChat, setShowChat] = useState(false);
  return <div className="h-full w-full bg-gradient-to-b from-[#0d2818] via-[#1a472a] to-[#0d2818] relative overflow-hidden flex flex-col">
      {/* Enhanced Table Texture */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
      backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)',
      backgroundSize: '24px 24px'
    }} />

      {/* Ambient Lighting Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#D4AF37] rounded-full blur-[150px] opacity-5" />

      {/* Enhanced Header */}
      <div className="px-4 py-4 flex justify-between items-center relative z-10 text-white/90">
        <motion.button onClick={onBack} className="p-2.5 hover:bg-white/10 rounded-full backdrop-blur-sm transition-colors" whileHover={{
        scale: 1.05
      }} whileTap={{
        scale: 0.95
      }}>
          <ArrowLeft size={22} strokeWidth={2.5} />
        </motion.button>

        <div className="flex flex-col items-center bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
          <span className="text-xs font-bold text-[#D4AF37] tracking-wide">
            Classic Table
          </span>
          <span className="text-[10px] opacity-70 font-medium">
            Pot Limit: ₹10,000
          </span>
        </div>

        <div className="flex gap-2">
          <motion.button onClick={() => setShowChat(true)} className="p-2.5 hover:bg-white/10 rounded-full backdrop-blur-sm transition-colors relative" whileHover={{
          scale: 1.05
        }} whileTap={{
          scale: 0.95
        }}>
            <MessageCircle size={22} strokeWidth={2.5} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#D4AF37] rounded-full" />
          </motion.button>
          <motion.button className="p-2.5 hover:bg-white/10 rounded-full backdrop-blur-sm transition-colors" whileHover={{
          scale: 1.05
        }} whileTap={{
          scale: 0.95
        }}>
            <Menu size={22} strokeWidth={2.5} />
          </motion.button>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 relative">
        {/* Enhanced Table Felt */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] aspect-[4/5] bg-gradient-to-br from-[#2d5a3c] via-[#1e4028] to-[#2d5a3c] rounded-[100px] border-[14px] border-[#3e2b22] shadow-[inset_0_0_60px_rgba(0,0,0,0.6),0_20px_60px_rgba(0,0,0,0.5)] flex items-center justify-center relative overflow-hidden">
          {/* Felt Texture */}
          <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)'
        }} />

          {/* Table Border Pattern */}
          <div className="absolute inset-0 rounded-[86px] border-4 border-[#D4AF37]/20" />
          <div className="absolute inset-2 rounded-[82px] border-2 border-[#D4AF37]/10" />

          {/* Center Pot Area */}
          <motion.div className="flex flex-col items-center gap-3 relative z-10" initial={{
          scale: 0.8,
          opacity: 0
        }} animate={{
          scale: 1,
          opacity: 1
        }} transition={{
          delay: 0.3
        }}>
            <motion.div className="text-[#D4AF37] font-display font-bold text-2xl text-shadow-lg" animate={{
            textShadow: ['0 0 10px rgba(212, 175, 55, 0.3)', '0 0 20px rgba(212, 175, 55, 0.5)', '0 0 10px rgba(212, 175, 55, 0.3)']
          }} transition={{
            repeat: Infinity,
            duration: 3
          }}>
              ₹ 4,500
            </motion.div>

            {/* Enhanced Chip Stack */}
            <div className="flex -space-x-3">
              {[{
              color: 'from-blue-400 to-blue-600',
              delay: 0
            }, {
              color: 'from-red-400 to-red-600',
              delay: 0.1
            }, {
              color: 'from-green-400 to-green-600',
              delay: 0.2
            }, {
              color: 'from-purple-400 to-purple-600',
              delay: 0.3
            }].map((chip, i) => <motion.div key={i} initial={{
              y: -30,
              opacity: 0,
              rotate: -180
            }} animate={{
              y: 0,
              opacity: 1,
              rotate: 0
            }} transition={{
              delay: chip.delay,
              type: 'spring',
              stiffness: 200,
              damping: 15
            }} className={`w-8 h-8 rounded-full bg-gradient-to-b ${chip.color} border-2 border-white shadow-lg relative`}>
                  <div className="absolute inset-1 rounded-full border border-white/30" />
                </motion.div>)}
            </div>

            <div className="text-[11px] text-white/60 uppercase tracking-widest font-bold mt-1">
              Pot
            </div>
          </motion.div>

          {/* Community Cards */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-16 flex gap-2">
            {[{
            suit: '♥',
            color: 'text-red-600',
            delay: 0
          }, {
            suit: '♠',
            color: 'text-stone-800',
            delay: 0.15
          }, {
            suit: '♦',
            color: 'text-red-600',
            delay: 0.3
          }].map((card, i) => <motion.div key={i} initial={{
            y: -40,
            opacity: 0,
            rotateY: 180
          }} animate={{
            y: 0,
            opacity: 1,
            rotateY: 0
          }} transition={{
            delay: 0.5 + card.delay,
            type: 'spring',
            stiffness: 150
          }} className="w-10 h-14 bg-white rounded-lg shadow-premium border border-stone-200 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white to-stone-50" />
                <span className={`${card.color} font-bold text-lg relative z-10`}>
                  {card.suit}
                </span>
              </motion.div>)}
          </div>
        </div>

        {/* Players with Enhanced Positioning */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2">
          <PlayerAvatar name="Amit" chips="2.5k" size="sm" />
        </div>
        <div className="absolute top-20 left-4">
          <PlayerAvatar name="Priya" chips="12k" size="sm" />
        </div>
        <div className="absolute top-20 right-4">
          <PlayerAvatar name="Rahul" chips="800" size="sm" isDealer />
        </div>
        <div className="absolute bottom-32 left-8">
          <PlayerAvatar name="Sneha" chips="5k" size="sm" />
        </div>
        <div className="absolute bottom-32 right-8">
          <PlayerAvatar name="Vikram" chips="1.2k" size="sm" />
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-4">
          <PlayerAvatar name="You" chips="50k" size="lg" isActive />
        </div>
      </div>

      {/* Enhanced Controls */}
      <motion.div className="bg-gradient-to-t from-[#2C0E0E] to-[#1a0a0a] p-5 pb-8 rounded-t-3xl shadow-[0_-8px_32px_rgba(0,0,0,0.4)] relative z-20 border-t-2 border-[#D4AF37]/20" initial={{
      y: 100
    }} animate={{
      y: 0
    }} transition={{
      delay: 0.8,
      type: 'spring',
      stiffness: 100
    }}>
        <div className="flex justify-between items-center gap-3">
          <motion.button className="flex-1 py-3.5 rounded-xl bg-gradient-to-b from-stone-600 to-stone-700 text-stone-200 font-bold text-sm uppercase tracking-wider shadow-lg border border-stone-500/50 active:scale-95 transition-transform" whileHover={{
          y: -2,
          boxShadow: '0 8px 20px rgba(0,0,0,0.3)'
        }} whileTap={{
          scale: 0.95
        }}>
            Pack
          </motion.button>

          <motion.button className="flex-1 py-3.5 rounded-xl bg-gradient-to-b from-[#F4C430] to-[#D4AF37] text-[#8B0000] font-bold text-sm uppercase tracking-wider shadow-premium border border-[#F4C430]/50 active:scale-95 transition-transform" whileHover={{
          y: -2,
          boxShadow: '0 8px 20px rgba(212,175,55,0.4)'
        }} whileTap={{
          scale: 0.95
        }} animate={{
          boxShadow: ['0 4px 12px rgba(212,175,55,0.3)', '0 6px 16px rgba(212,175,55,0.5)', '0 4px 12px rgba(212,175,55,0.3)']
        }} transition={{
          repeat: Infinity,
          duration: 2
        }}>
            Chaal (200)
          </motion.button>

          <motion.button className="flex-1 py-3.5 rounded-xl bg-gradient-to-b from-[#D4745E] to-[#B85F45] text-white font-bold text-sm uppercase tracking-wider shadow-premium border border-[#D4745E]/50 active:scale-95 transition-transform" whileHover={{
          y: -2,
          boxShadow: '0 8px 20px rgba(212,116,94,0.4)'
        }} whileTap={{
          scale: 0.95
        }}>
            Show
          </motion.button>
        </div>

        <div className="flex justify-center mt-4">
          <button className="text-white/50 text-xs flex items-center gap-2 hover:text-white/80 transition-colors font-medium">
            <Settings size={12} /> Game Settings
          </button>
        </div>
      </motion.div>

      <ChatPanel isOpen={showChat} onClose={() => setShowChat(false)} />
    </div>;
}