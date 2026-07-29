import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

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
    <div
      onClick={onComplete}
      className="h-full w-full bg-[#0a0e1a] flex flex-col items-center justify-center relative overflow-hidden cursor-pointer"
    >
      {/* Background glow */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full blur-[200px]"
        style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
      />

      {/* Floating gold particles */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-[#D4AF37] rounded-full"
          initial={{ x: (Math.random() - 0.5) * 300, y: 400, opacity: 0 }}
          animate={{ y: -400, opacity: [0, 0.8, 0], scale: [0, 1.5, 0] }}
          transition={{ duration: 3 + Math.random() * 3, repeat: Infinity, delay: i * 0.3, ease: 'easeOut' }}
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
                background: 'linear-gradient(135deg, #8B0000, #520000)',
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
          <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-[#1a1a2e] to-[#0f0f23] border-2 border-[#D4AF37]/40 flex items-center justify-center shadow-2xl overflow-hidden">
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

            {/* Shine */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-3xl font-bold tracking-wide mb-1"
          style={{
            background: 'linear-gradient(135deg, #D4AF37, #F7EF8A, #D4AF37)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
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
        className="absolute bottom-16 flex flex-col items-center gap-3 w-full px-16"
      >
        <div className="w-full max-w-[180px] h-[3px] bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #D4AF37, #F7EF8A)' }}
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: 'linear' }}
          />
        </div>
        <motion.p
          className="text-white/20 text-[10px] tracking-wider"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          Tap to skip
        </motion.p>
      </motion.div>
    </div>
  );
}
