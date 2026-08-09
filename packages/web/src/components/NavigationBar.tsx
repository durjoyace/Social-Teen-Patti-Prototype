import { motion } from 'framer-motion';
import { Home, User, Share2 } from 'lucide-react';
import { cn } from '../utils/cn';

interface NavigationBarProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
}

const tabs = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'referrals', icon: Share2, label: 'Invite' },
  { id: 'profile', icon: User, label: 'Profile' },
];

export function NavigationBar({ currentScreen, onNavigate }: NavigationBarProps) {
  return (
    <motion.nav
      aria-label="Primary navigation"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-30 lg:hidden"
    >
      <div className="absolute inset-0 border-t border-white/10 bg-[#09130F]/95 backdrop-blur-xl" />

      {/* Content */}
      <div className="relative px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-2.5">
        <div className="flex justify-around items-center max-w-md mx-auto">
          {tabs.map((tab) => {
            const isActive = currentScreen === tab.id;
            const Icon = tab.icon;

            return (
              <motion.button
                type="button"
                key={tab.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => onNavigate(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className="relative flex min-h-12 min-w-16 flex-col items-center justify-center gap-1 rounded-2xl px-3 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B04A]"
              >
                {/* Active background */}
                {isActive && (
                  <motion.div
                    layoutId="nav-bg"
                    className="absolute inset-0 rounded-2xl border border-[#E8B04A]/20 bg-[#2A1714]"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}

                {/* Icon */}
                <div className="relative">
                  <Icon
                    className={cn(
                      'w-5 h-5 transition-colors duration-200',
                      isActive ? 'text-[#E8B04A]' : 'text-[#66736D]'
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    className="absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full bg-[#E8B04A]"
                    />
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    'text-[10px] font-medium transition-colors duration-200',
                    isActive ? 'text-[#E8B04A]' : 'text-[#66736D]'
                  )}
                >
                  {tab.label}
                </span>

                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -bottom-2.5 h-0.5 w-6 rounded-full bg-[#E8B04A]"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

    </motion.nav>
  );
}
