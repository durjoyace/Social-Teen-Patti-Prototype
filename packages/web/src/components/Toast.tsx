import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, X, XCircle } from 'lucide-react';
import { useUIStore } from '../stores/uiStore';
import { cn } from '../utils/cn';

const toastConfig = {
  success: {
    icon: CheckCircle,
    surface: 'border-[#5E9B75]/50 bg-[#132A20]',
    iconColor: 'text-[#8FC7A5]',
    live: 'polite' as const,
  },
  error: {
    icon: XCircle,
    surface: 'border-[#B74035]/55 bg-[#2A1714]',
    iconColor: 'text-[#F2B1A9]',
    live: 'assertive' as const,
  },
  warning: {
    icon: AlertCircle,
    surface: 'border-[#E8B04A]/45 bg-[#2A2518]',
    iconColor: 'text-[#E8B04A]',
    live: 'polite' as const,
  },
  info: {
    icon: Info,
    surface: 'border-[#6E94A8]/45 bg-[#13232B]',
    iconColor: 'text-[#9FC7DB]',
    live: 'polite' as const,
  },
};

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  return (
    <div className="pointer-events-none fixed inset-x-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-[70] flex flex-col items-end gap-2 sm:left-auto sm:right-4 sm:w-[360px]">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const config = toastConfig[toast.type];
          const Icon = config.icon;

          return (
            <motion.div
              key={toast.id}
              role={toast.type === 'error' ? 'alert' : 'status'}
              aria-live={config.live}
              layout
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 28, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className={cn(
                'pointer-events-auto flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-[#F6ECD8] shadow-[0_16px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl',
                config.surface,
              )}
            >
              <Icon aria-hidden="true" className={cn('h-5 w-5 shrink-0', config.iconColor)} />
              <span className="min-w-0 flex-1 text-sm font-medium leading-5">{toast.message}</span>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                aria-label="Dismiss notification"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#8E9C94] transition-colors hover:bg-white/[0.07] hover:text-[#F6ECD8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B04A]"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
