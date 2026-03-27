import { motion, AnimatePresence } from 'framer-motion';
import { Check, Globe, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation, type Locale } from '../i18n';
import { cn } from '../utils/cn';

const LOCALE_FLAGS: Record<Locale, string> = {
  en: '🇬🇧',
  hi: '🇮🇳',
  gu: '🇮🇳',
  mr: '🇮🇳',
  te: '🇮🇳',
  ta: '🇮🇳',
};

const LOCALE_COLORS: Record<Locale, string> = {
  en: 'from-blue-500/20 to-blue-600/10',
  hi: 'from-orange-500/20 to-orange-600/10',
  gu: 'from-red-500/20 to-red-600/10',
  mr: 'from-amber-500/20 to-amber-600/10',
  te: 'from-yellow-500/20 to-yellow-600/10',
  ta: 'from-rose-500/20 to-rose-600/10',
};

interface LanguageSelectorProps {
  /** Render as a full-page selector (onboarding) vs compact modal */
  variant?: 'full' | 'compact';
  /** Called when language selection is confirmed (full variant) or changed (compact) */
  onClose?: () => void;
}

export function LanguageSelector({ variant = 'compact', onClose }: LanguageSelectorProps) {
  const { locale, setLocale, availableLocales, isLoading } = useTranslation();
  const [pendingLocale, setPendingLocale] = useState<Locale>(locale);

  const handleSelect = async (code: Locale) => {
    setPendingLocale(code);
    if (variant === 'compact') {
      await setLocale(code);
    }
  };

  const handleConfirm = async () => {
    if (pendingLocale !== locale) {
      await setLocale(pendingLocale);
    }
    onClose?.();
  };

  const content = (
    <div className={cn(
      'w-full',
      variant === 'full' && 'min-h-screen flex flex-col items-center justify-center px-6 py-12',
    )}>
      {/* Header */}
      <div className={cn(
        'text-center mb-8',
        variant === 'compact' && 'flex items-center justify-between px-1 text-left',
      )}>
        {variant === 'full' ? (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mx-auto mb-4"
            >
              <Globe className="w-8 h-8 text-white" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-2xl font-bold text-white"
            >
              Choose Your Language
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white/50 mt-1 text-sm"
            >
              Select a language for the app
            </motion.p>
          </>
        ) : (
          <>
            <div>
              <h2 className="text-lg font-semibold text-white">Language</h2>
              <p className="text-white/40 text-xs">Select your preferred language</p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Language Grid */}
      <div className={cn(
        'grid grid-cols-2 gap-3 w-full',
        variant === 'full' && 'max-w-md',
      )}>
        {availableLocales.map((loc, index) => {
          const isSelected = variant === 'full'
            ? pendingLocale === loc.code
            : locale === loc.code;

          return (
            <motion.button
              key={loc.code}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSelect(loc.code)}
              disabled={isLoading}
              className={cn(
                'relative flex flex-col items-center gap-2 py-5 px-4 rounded-2xl border transition-all duration-200',
                isSelected
                  ? 'border-yellow-400/50 bg-gradient-to-br from-yellow-400/10 to-orange-500/5 shadow-lg shadow-yellow-500/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/8 hover:border-white/20',
              )}
            >
              {/* Selected check */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute top-2 right-2"
                  >
                    <div className="w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center">
                      <Check className="w-3 h-3 text-black" strokeWidth={3} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Flag / Gradient Orb */}
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br',
                LOCALE_COLORS[loc.code],
              )}>
                {LOCALE_FLAGS[loc.code]}
              </div>

              {/* Native name */}
              <span className={cn(
                'text-base font-semibold transition-colors',
                isSelected ? 'text-yellow-400' : 'text-white',
              )}>
                {loc.nativeName}
              </span>

              {/* English name */}
              <span className="text-xs text-white/40 -mt-1">
                {loc.name}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Confirm button (full variant only) */}
      {variant === 'full' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 w-full max-w-md"
        >
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              'w-full py-4 rounded-2xl font-semibold text-lg transition-all',
              'bg-gradient-to-r from-yellow-400 to-orange-500 text-black',
              'hover:from-yellow-300 hover:to-orange-400',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'active:scale-[0.98]',
            )}
          >
            {isLoading ? 'Loading...' : 'Continue'}
          </button>
        </motion.div>
      )}
    </div>
  );

  return content;
}
