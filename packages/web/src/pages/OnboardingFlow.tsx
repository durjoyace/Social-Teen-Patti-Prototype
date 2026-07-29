import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Server, Users, Sparkles } from 'lucide-react';

interface OnboardingFlowProps {
  onComplete: () => void;
}

const steps = [
  {
    emoji: '🙏',
    title: 'Welcome to Teen Patti Social',
    text: 'Adults-only social Teen Patti built around fast private tables with real friends.',
    accent: 'from-yellow-500 to-orange-500',
    icon: Sparkles,
  },
  {
    emoji: '🛡️',
    title: 'Server Authoritative',
    text: 'The server shuffles, deals, validates every action, and commits every completed game result.',
    accent: 'from-green-500 to-emerald-500',
    icon: Server,
  },
  {
    emoji: '🎉',
    title: 'Play With Friends',
    text: 'Create a private table, share one link, and start automatically when your friend joins.',
    accent: 'from-blue-500 to-purple-500',
    icon: Users,
  },
];

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const current = steps[step];

  return (
    <div className="h-full w-full bg-gradient-to-b from-[#0a1628] via-[#0f1f35] to-[#0a1628] relative flex flex-col overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          key={step}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-[120px] bg-gradient-to-r ${current.accent}`}
        />
      </div>

      {/* Skip */}
      <div className="flex justify-end px-6 pt-6 relative z-10">
        <button onClick={onComplete} className="text-white/40 text-sm font-medium hover:text-white/70 transition">
          Skip
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20 }}
            className="flex flex-col items-center text-center"
          >
            {/* Emoji in glowing circle */}
            <div className="relative mb-8">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className={`w-32 h-32 rounded-full bg-gradient-to-br ${current.accent} opacity-20 absolute -inset-4 blur-2xl`}
              />
              <div className={`relative w-28 h-28 rounded-full bg-gradient-to-br ${current.accent} flex items-center justify-center shadow-2xl`}>
                <span className="text-5xl">{current.emoji}</span>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-white mb-3">{current.title}</h2>

            {/* Description */}
            <p className="text-white/60 text-base leading-relaxed max-w-xs">{current.text}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom section */}
      <div className="px-8 pb-12 relative z-10">
        {/* Step indicators */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, i) => (
            <motion.div
              key={i}
              animate={{ width: i === step ? 24 : 8 }}
              className={`h-2 rounded-full transition-colors ${
                i === step
                  ? `bg-gradient-to-r ${current.accent}`
                  : i < step
                  ? 'bg-white/30'
                  : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        {/* Next button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleNext}
          className={`w-full py-4 rounded-2xl bg-gradient-to-r ${current.accent} text-white font-bold text-lg shadow-lg flex items-center justify-center gap-2`}
        >
          {step === steps.length - 1 ? 'Start Playing' : 'Next'}
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
}
