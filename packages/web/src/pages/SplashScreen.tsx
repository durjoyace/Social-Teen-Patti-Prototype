import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

const PARTICLES = [
  { x: -132, duration: 3.8, delay: 0 },
  { x: -98, duration: 4.6, delay: 0.28 },
  { x: -64, duration: 5.1, delay: 0.56 },
  { x: -30, duration: 3.5, delay: 0.84 },
  { x: 8, duration: 4.2, delay: 1.12 },
  { x: 42, duration: 5.4, delay: 1.4 },
  { x: 76, duration: 3.9, delay: 1.68 },
  { x: 116, duration: 4.8, delay: 1.96 },
];

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) { clearInterval(interval); return 100; }
        return prev + 3;
      });
    }, 50);

    const timer = setTimeout(onComplete, 2000);
    return () => { clearTimeout(timer); clearInterval(interval); };
  }, [onComplete]);

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-[#07110E]">
      {/* Background glow */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full blur-[200px]"
        style={{ background: 'rgba(22,62,45,0.32)' }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
      />

      {/* Floating gold particles */}
      {PARTICLES.map((particle, i) => (
        <motion.div
          key={i}
          className="absolute h-1 w-1 rounded-full bg-[#E8B04A]"
          initial={{ x: particle.x, y: 400, opacity: 0 }}
          animate={{ y: -400, opacity: [0, 0.8, 0], scale: [0, 1.5, 0] }}
          transition={{ duration: particle.duration, repeat: Infinity, delay: particle.delay, ease: 'easeOut' }}
        />
      ))}

      {/* Logo */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
        className="relative z-10 flex flex-col items-center"
      >
        {/* App icon */}
        <motion.div
          className="relative mb-6"
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        >
          {/* Fanning cards behind logo */}
          {[-25, -12, 0, 12, 25].map((angle, i) => (
            <motion.div
              key={i}
              className="absolute top-1/2 left-1/2 w-14 h-20 rounded-lg"
              initial={{ opacity: 0, rotate: 0, scale: 0.5 }}
              animate={{ opacity: 0.6, rotate: angle, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.08, type: 'spring', damping: 15 }}
              style={{
                transformOrigin: 'center 120%',
                marginLeft: -28,
                marginTop: -50,
                background: '#2A1714',
                border: '1px solid rgba(212,175,55,0.3)',
                zIndex: 5 - Math.abs(i - 2),
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}
            >
              <div className="absolute inset-[2px] rounded-md border border-[#D4AF37]/15" />
            </motion.div>
          ))}

          {/* Glow behind icon */}
          <div className="absolute -inset-4 rounded-3xl bg-[#D4AF37]/20 blur-2xl" />

          {/* Icon */}
          <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border-2 border-[#E8B04A]/40 bg-[#0E1B17] shadow-2xl">
            {/* Inner pattern */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: `linear-gradient(45deg, rgba(212,175,55,0.15) 25%, transparent 25%), linear-gradient(-45deg, rgba(212,175,55,0.15) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(212,175,55,0.15) 75%), linear-gradient(-45deg, transparent 75%, rgba(212,175,55,0.15) 75%)`,
              backgroundSize: '10px 10px',
            }} />

            {/* Spade suit as logo mark */}
            <div className="relative flex flex-col items-center">
              <span className="text-[#D4AF37] text-4xl font-black tracking-tight leading-none" style={{
                textShadow: '0 0 20px rgba(212,175,55,0.5)',
              }}>TP</span>
            </div>

            <div className="absolute left-3 top-3 h-4 w-8 rounded-full bg-white/5" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mb-1 font-display text-3xl font-black tracking-tight text-[#F6ECD8]"
        >
          Teen Patti Social
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-white/40 text-xs tracking-[0.25em] uppercase font-medium mb-2"
        >
          Private Friend Tables
        </motion.p>

        {/* Shield icon + verified text */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.8, type: 'spring' }}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20"
        >
          <div className="w-3 h-3 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-green-400 text-[10px] font-semibold tracking-wider">18+ SOCIAL PLAY</span>
        </motion.div>
      </motion.div>

      {/* Progress bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-10 flex w-full flex-col items-center gap-3 px-8 sm:bottom-14"
      >
        <div className="w-full max-w-[180px] h-[3px] bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: '#E8B04A' }}
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: 'linear' }}
          />
        </div>
        <motion.button
          type="button"
          onClick={onComplete}
          className="min-h-10 rounded-full px-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40 transition-colors hover:text-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B04A]"
          animate={{ opacity: [0.45, 0.75, 0.45] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          Skip intro
        </motion.button>
      </motion.div>
    </div>
  );
}
