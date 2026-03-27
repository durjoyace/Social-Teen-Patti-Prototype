import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Signal, SignalLow, SignalMedium, SignalHigh, Zap } from 'lucide-react';
import { useNetworkQuality } from '../hooks/useNetworkQuality';
import { cn } from '../utils/cn';

interface ConnectionStatusProps {
  className?: string;
  compact?: boolean;
}

const qualityConfig = {
  offline: { icon: WifiOff, label: 'Offline', color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' },
  '2g': { icon: SignalLow, label: 'Poor Signal', color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' },
  '3g': { icon: SignalMedium, label: '3G', color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' },
  '4g': { icon: SignalHigh, label: '4G', color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30' },
  wifi: { icon: Wifi, label: 'WiFi', color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30' },
};

export function ConnectionStatus({ className, compact }: ConnectionStatusProps) {
  const { quality, isOnline, rtt, settings } = useNetworkQuality();
  const config = qualityConfig[quality];
  const Icon = config.icon;

  // Only show banner for poor connections
  const showBanner = quality === 'offline' || quality === '2g';

  if (compact) {
    return (
      <div className={cn('flex items-center gap-1', config.color, className)}>
        <Icon className="w-3.5 h-3.5" />
        {quality === '2g' && (
          <span className="text-[10px] font-medium">Slow</span>
        )}
      </div>
    );
  }

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className={cn(
            'w-full px-4 py-2 flex items-center justify-center gap-2',
            config.bg, 'border-b', config.border,
            className
          )}
        >
          <Icon className={cn('w-4 h-4', config.color)} />
          <span className={cn('text-xs font-medium', config.color)}>
            {quality === 'offline'
              ? 'No internet connection — playing offline'
              : 'Poor connection — animations reduced for better experience'}
          </span>
          {!settings.enableAnimations && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10">
              <Zap className="w-3 h-3 text-yellow-400" />
              <span className="text-[10px] text-white/60">Lite Mode</span>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Small dot indicator for headers/nav */
export function ConnectionDot({ className }: { className?: string }) {
  const { quality } = useNetworkQuality();
  const colors = {
    offline: 'bg-red-500',
    '2g': 'bg-red-500',
    '3g': 'bg-yellow-500',
    '4g': 'bg-green-500',
    wifi: 'bg-green-500',
  };

  return (
    <motion.div
      className={cn('w-2 h-2 rounded-full', colors[quality], className)}
      animate={quality === 'offline' || quality === '2g'
        ? { opacity: [1, 0.3, 1] }
        : {}}
      transition={{ repeat: Infinity, duration: 1.5 }}
    />
  );
}
