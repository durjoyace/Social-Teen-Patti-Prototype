import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { useUIStore } from '../stores/uiStore';
import { cn } from '../utils/cn';

const toastConfig = {
  success: {
    icon: CheckCircle,
    bg: 'from-green-600 to-green-800',
    border: 'border-green-500/50',
    iconColor: 'text-green-300'
  },
  error: {
    icon: XCircle,
    bg: 'from-red-600 to-red-800',
    border: 'border-red-500/50',
    iconColor: 'text-red-300'
  },
  warning: {
    icon: AlertCircle,
    bg: 'from-yellow-600 to-yellow-800',
    border: 'border-yellow-500/50',
    iconColor: 'text-yellow-300'
  },
  info: {
    icon: Info,
    bg: 'from-blue-600 to-blue-800',
    border: 'border-blue-500/50',
    iconColor: 'text-blue-300'
  }
};

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const config = toastConfig[toast.type];
          const Icon = config.icon;

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl',
                `bg-gradient-to-r ${config.bg}`,
                'backdrop-blur-md border',
                config.border,
                'shadow-lg min-w-[250px] max-w-[350px]'
              )}
            >
              <Icon className={cn('w-5 h-5 flex-shrink-0', config.iconColor)} />
              <span className="flex-1 text-sm text-white font-medium">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded-full hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// Win announcement overlay
export function WinAnnouncement({
  winner,
  amount,
  handName,
  onClose
}: {
  winner: string;
  amount: number;
  handName: string;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.5, rotateY: 90 }}
        animate={{ scale: 1, rotateY: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="relative p-8 rounded-3xl bg-gradient-to-b from-yellow-900/90 to-yellow-950/90 border border-yellow-500/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sparkle effects */}
        <motion.div
          className="absolute -inset-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full"
              initial={{
                x: '50%',
                y: '50%',
                scale: 0
              }}
              animate={{
                x: `${Math.random() * 100}%`,
                y: `${Math.random() * 100}%`,
                scale: [0, 1, 0],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.1
              }}
            />
          ))}
        </motion.div>

        {/* Trophy icon */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-4"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/50">
            <span className="text-4xl">🏆</span>
          </div>
        </motion.div>

        {/* Winner text */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold text-yellow-400 mb-2">Winner!</h2>
          <p className="text-xl text-white font-semibold mb-1">{winner}</p>
          <p className="text-yellow-500/80 text-sm mb-4">{handName}</p>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            className="text-4xl font-bold text-green-400"
          >
            +₹{amount.toLocaleString()}
          </motion.div>
        </motion.div>

        {/* Close hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center text-white/40 text-xs mt-6"
        >
          Tap anywhere to continue
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

// Loading spinner
export function LoadingSpinner({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
      <motion.div
        className="relative w-16 h-16"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
      >
        <div className="absolute inset-0 rounded-full border-4 border-yellow-500/20" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-yellow-500" />
      </motion.div>
      {message && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-white/80 text-sm"
        >
          {message}
        </motion.p>
      )}
    </div>
  );
}
