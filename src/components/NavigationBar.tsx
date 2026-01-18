import React from 'react';
import { Home, User, Trophy, Users } from 'lucide-react';
import { motion } from 'framer-motion';
interface NavigationBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}
export function NavigationBar({
  activeTab,
  onTabChange
}: NavigationBarProps) {
  const tabs = [{
    id: 'home',
    icon: Home,
    label: 'Home'
  }, {
    id: 'social',
    icon: Users,
    label: 'Family'
  }, {
    id: 'leaderboard',
    icon: Trophy,
    label: 'Rank'
  }, {
    id: 'profile',
    icon: User,
    label: 'Me'
  }];
  return <div className="bg-white border-t border-[#D4AF37]/30 px-6 py-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] relative z-50">
      <div className="flex justify-between items-center">
        {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        return <button key={tab.id} onClick={() => onTabChange(tab.id)} className="flex flex-col items-center gap-1 relative">
              <div className={`p-2 rounded-full transition-colors duration-300 ${isActive ? 'bg-[#FFF8DC]' : 'bg-transparent'}`}>
                <tab.icon size={24} className={`transition-colors duration-300 ${isActive ? 'text-[#8B0000]' : 'text-stone-400'}`} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-xs font-medium ${isActive ? 'text-[#8B0000]' : 'text-stone-400'}`}>
                {tab.label}
              </span>
              {isActive && <motion.div layoutId="nav-indicator" className="absolute -top-3 w-8 h-1 bg-[#D4AF37] rounded-full" />}
            </button>;
      })}
      </div>
    </div>;
}