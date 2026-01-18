import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Plus, Sparkles } from 'lucide-react';
import { TableCard } from '../components/TableCard';
import { FestivalBanner } from '../components/FestivalBanner';
import { NavigationBar } from '../components/NavigationBar';
import { MusicRadioWidget } from '../components/MusicRadioWidget';
interface HomeScreenProps {
  onNavigate: (screen: string) => void;
}
export function HomeScreen({
  onNavigate
}: HomeScreenProps) {
  return <div className="h-full flex flex-col bg-gradient-to-b from-[#FFF8DC] to-[#FFFACD]">
      {/* Enhanced Header with Glassmorphism */}
      <header className="px-6 pt-6 pb-4 flex justify-between items-center bg-white/80 backdrop-blur-md shadow-sm z-10 border-b border-[#D4AF37]/10">
        <div className="flex items-center gap-3">
          <motion.div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4745E] to-[#8B0000] flex items-center justify-center text-white font-bold border-2 border-[#D4AF37] shadow-lg relative overflow-hidden" whileHover={{
          scale: 1.05
        }} whileTap={{
          scale: 0.95
        }}>
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent" />
            <span className="relative z-10 text-lg">R</span>
          </motion.div>
          <div>
            <h2 className="text-sm font-bold text-[#8B0000] font-hindi">
              Rohan Kumar
            </h2>
            <div className="flex items-center gap-1.5">
              <motion.div className="w-3 h-3 rounded-full bg-[#D4AF37]" animate={{
              boxShadow: ['0 0 0 0 rgba(212, 175, 55, 0.4)', '0 0 0 4px rgba(212, 175, 55, 0)']
            }} transition={{
              repeat: Infinity,
              duration: 2
            }} />
              <span className="text-xs font-bold text-stone-600">₹ 50,000</span>
              <motion.button className="bg-[#8B0000] text-white rounded-full p-1 ml-1 shadow-sm" whileHover={{
              scale: 1.1
            }} whileTap={{
              scale: 0.9
            }}>
                <Plus size={10} />
              </motion.button>
            </div>
          </div>
        </div>
        <motion.button className="relative p-2 text-stone-400 hover:text-[#8B0000] transition-colors" whileHover={{
        scale: 1.05
      }} whileTap={{
        scale: 0.95
      }}>
          <Bell size={24} />
          <motion.span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" animate={{
          scale: [1, 1.2, 1]
        }} transition={{
          repeat: Infinity,
          duration: 2
        }} />
        </motion.button>
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        <FestivalBanner />

        <div className="p-6">
          {/* Enhanced Title Section */}
          <motion.div initial={{
          opacity: 0,
          y: 10
        }} animate={{
          opacity: 1,
          y: 0
        }} className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={20} className="text-[#D4AF37]" />
              <h1 className="text-3xl font-display font-bold text-[#2C0E0E] text-shadow">
                Game Night
              </h1>
            </div>
            <p className="text-stone-600 text-sm font-medium">
              Select a table to start playing
            </p>
          </motion.div>

          {/* Enhanced Table Cards */}
          <div className="space-y-4">
            <TableCard title="Classic Table" minBuyIn="500" players={1240} type="classic" delay={1} onClick={() => onNavigate('game')} />
            <TableCard title="Joker's Den" minBuyIn="1000" players={850} type="joker" delay={2} onClick={() => onNavigate('game')} />
            <TableCard title="Muflis Master" minBuyIn="2500" players={420} type="muflis" delay={3} onClick={() => onNavigate('game')} />
          </div>

          {/* Enhanced Social Section */}
          <motion.div className="mt-8 bg-white/90 backdrop-blur-sm rounded-2xl p-5 shadow-premium border border-[#D4AF37]/10" initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.4
        }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-stone-800 font-hindi">
                Family Online
              </h3>
              <button className="text-xs text-[#D4745E] font-semibold hover:underline">
                View All →
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {[{
              name: 'Priya',
              status: 'online'
            }, {
              name: 'Amit',
              status: 'online'
            }, {
              name: 'Sneha',
              status: 'playing'
            }, {
              name: 'Rahul',
              status: 'online'
            }, {
              name: 'Vikram',
              status: 'away'
            }].map((person, i) => <motion.div key={i} className="flex flex-col items-center min-w-[60px]" initial={{
              opacity: 0,
              scale: 0.8
            }} animate={{
              opacity: 1,
              scale: 1
            }} transition={{
              delay: 0.5 + i * 0.1
            }} whileHover={{
              y: -4
            }}>
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-stone-200 to-stone-300 mb-1.5 border-2 ${person.status === 'online' ? 'border-green-400' : person.status === 'playing' ? 'border-[#D4AF37]' : 'border-stone-300'} shadow-md relative`}>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#D4745E]/20 to-[#8B0000]/20" />
                    <motion.div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${person.status === 'online' ? 'bg-green-400' : person.status === 'playing' ? 'bg-[#D4AF37]' : 'bg-stone-400'}`} animate={person.status === 'playing' ? {
                  scale: [1, 1.2, 1]
                } : {}} transition={{
                  repeat: Infinity,
                  duration: 2
                }} />
                  </div>
                  <span className="text-[10px] text-stone-600 font-medium">
                    {person.name}
                  </span>
                </motion.div>)}
            </div>
          </motion.div>
        </div>
      </div>

      <MusicRadioWidget />

      <div className="absolute bottom-0 w-full">
        <NavigationBar activeTab="home" onTabChange={tab => console.log(tab)} />
      </div>
    </div>;
}