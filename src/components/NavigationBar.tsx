import { motion } from 'framer-motion';
import { Home, User, Trophy, Users, Gamepad2 } from 'lucide-react';
import { cn } from '../utils/cn';

interface NavigationBarProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
}

const tabs = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'social', icon: Users, label: 'Friends' },
  { id: 'leaderboard', icon: Trophy, label: 'Rank' },
  { id: 'profile', icon: User, label: 'Profile' }
];

export function NavigationBar({ currentScreen, onNavigate }: NavigationBarProps) {
  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-30"
    >
      {/* Glass background */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-gray-900/95 to-gray-900/90 backdrop-blur-xl border-t border-white/10" />

      {/* Content */}
      <div className="relative px-6 py-3 pb-6">
        <div className="flex justify-around items-center max-w-md mx-auto">
          {tabs.map((tab) => {
            const isActive = currentScreen === tab.id;
            const Icon = tab.icon;

            return (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => onNavigate(tab.id)}
                className="relative flex flex-col items-center gap-1 py-1 px-4"
              >
                {/* Active background */}
                {isActive && (
                  <motion.div
                    layoutId="nav-bg"
                    className="absolute inset-0 bg-gradient-to-t from-red-900/50 to-transparent rounded-2xl"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}

                {/* Icon */}
                <div className="relative">
                  <Icon
                    className={cn(
                      'w-6 h-6 transition-colors duration-200',
                      isActive ? 'text-yellow-400' : 'text-white/40'
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />

                  {/* Active dot */}
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full"
                    />
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    'text-[10px] font-medium transition-colors duration-200',
                    isActive ? 'text-yellow-400' : 'text-white/40'
                  )}
                >
                  {tab.label}
                </span>

                {/* Active indicator line */}
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -bottom-3 w-8 h-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Safe area spacer for iOS */}
      <div className="h-safe-bottom bg-black" />
    </motion.nav>
  );
}

// Floating game button for quick access
export function FloatingGameButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-red-800 shadow-lg shadow-red-500/50 flex items-center justify-center ring-4 ring-black"
    >
      <Gamepad2 className="w-7 h-7 text-white" />
      <motion.div
        className="absolute inset-0 rounded-full bg-white/20"
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ repeat: Infinity, duration: 2 }}
      />
    </motion.button>
  );
}
