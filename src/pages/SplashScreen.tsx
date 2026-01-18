import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({
  onComplete
}: SplashScreenProps) {
  const [progress, setProgress] = useState(0);

  const handleSkip = useCallback(() => {
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    // Progress animation - completes in 1.5s
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 4; // ~25 steps to reach 100 in 1.5s (60ms intervals)
      });
    }, 60);

    const timer = setTimeout(onComplete, 1500);
    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [onComplete]);

  return (
    <div
      onClick={handleSkip}
      className="h-full w-full bg-gradient-to-b from-[#1a0a0a] via-[#2C0E0E] to-[#1a0a0a] flex flex-col items-center justify-center relative overflow-hidden cursor-pointer"
    >
      {/* Multiple Background Glows for Depth */}
      <motion.div className="absolute w-96 h-96 bg-[#D4745E] rounded-full blur-[120px] opacity-20" animate={{
      scale: [1, 1.3, 1],
      opacity: [0.15, 0.25, 0.15]
    }} transition={{
      repeat: Infinity,
      duration: 5,
      ease: 'easeInOut'
    }} />
      <motion.div className="absolute w-64 h-64 bg-[#D4AF37] rounded-full blur-[100px] opacity-15" animate={{
      scale: [1.2, 1, 1.2],
      opacity: [0.1, 0.2, 0.1]
    }} transition={{
      repeat: Infinity,
      duration: 4,
      ease: 'easeInOut',
      delay: 0.5
    }} />

      {/* Floating Particles */}
      {[...Array(8)].map((_, i) => <motion.div key={i} className="absolute w-1 h-1 bg-[#F4C430] rounded-full" initial={{
      x: Math.random() * 400 - 200,
      y: 600,
      opacity: 0
    }} animate={{
      y: -100,
      opacity: [0, 1, 0],
      scale: [0, 1, 0]
    }} transition={{
      duration: 3 + Math.random() * 2,
      repeat: Infinity,
      delay: i * 0.4,
      ease: 'easeOut'
    }} />)}

      {/* Enhanced Diya Animation */}
      <div className="relative z-10 flex flex-col items-center">
        <motion.div initial={{
        scale: 0,
        opacity: 0
      }} animate={{
        scale: 1,
        opacity: 1
      }} transition={{
        duration: 1.2,
        ease: [0.34, 1.56, 0.64, 1]
      }} className="relative">
          {/* Flame Glow */}
          <motion.div className="absolute -top-12 left-1/2 -translate-x-1/2 w-16 h-16 bg-[#F4C430] rounded-full blur-xl opacity-60" animate={{
          scale: [1, 1.2, 1],
          opacity: [0.4, 0.7, 0.4]
        }} transition={{
          repeat: Infinity,
          duration: 2,
          ease: 'easeInOut'
        }} />

          {/* Enhanced Flame */}
          <motion.div className="absolute -top-10 left-1/2 -translate-x-1/2 w-8 h-14" animate={{
          scaleY: [1, 1.15, 0.95, 1],
          scaleX: [1, 0.95, 1.05, 1],
          skewX: [0, 3, -3, 0]
        }} transition={{
          repeat: Infinity,
          duration: 0.6,
          ease: 'easeInOut'
        }}>
            <div className="w-full h-full bg-gradient-to-t from-[#D4AF37] via-[#F4C430] to-[#FFF8DC] rounded-[50%_50%_50%_50%_/_60%_60%_40%_40%] shadow-[0_0_30px_#F4C430,0_0_60px_#D4AF37]" />
          </motion.div>

          {/* Enhanced Lamp Body with Details */}
          <svg width="120" height="80" viewBox="0 0 120 80" fill="none">
            {/* Main Bowl */}
            <defs>
              <linearGradient id="lampGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#D4745E" />
                <stop offset="50%" stopColor="#C86A4F" />
                <stop offset="100%" stopColor="#B85F45" />
              </linearGradient>
              <linearGradient id="rimGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F4C430" />
                <stop offset="100%" stopColor="#D4AF37" />
              </linearGradient>
            </defs>

            {/* Shadow */}
            <ellipse cx="60" cy="72" rx="45" ry="6" fill="black" opacity="0.2" />

            {/* Bowl Bottom */}
            <path d="M15 30C15 30 20 65 60 65C100 65 105 30 105 30H15Z" fill="url(#lampGradient)" stroke="#D4AF37" strokeWidth="2" />

            {/* Bowl Highlight */}
            <path d="M20 35C20 35 25 50 60 50C95 50 100 35 100 35" stroke="white" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />

            {/* Rim */}
            <path d="M15 30C15 30 20 20 60 20C100 20 105 30 105 30" fill="url(#rimGradient)" stroke="#D4AF37" strokeWidth="2" />

            {/* Decorative Pattern */}
            <circle cx="60" cy="45" r="3" fill="#D4AF37" opacity="0.6" />
            <circle cx="45" cy="48" r="2" fill="#D4AF37" opacity="0.4" />
            <circle cx="75" cy="48" r="2" fill="#D4AF37" opacity="0.4" />

            {/* Wicks */}
            <path d="M60 65V70M50 65V68M70 65V68" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </motion.div>

        {/* Enhanced Typography */}
        <motion.div initial={{
        y: 30,
        opacity: 0
      }} animate={{
        y: 0,
        opacity: 1
      }} transition={{
        delay: 1.2,
        duration: 1,
        ease: [0.34, 1.56, 0.64, 1]
      }} className="mt-12 text-center">
          <motion.h1 className="text-4xl font-display font-bold text-[#D4AF37] tracking-wide mb-2 text-shadow-lg" animate={{
          textShadow: ['0 0 20px rgba(212, 175, 55, 0.3)', '0 0 30px rgba(212, 175, 55, 0.5)', '0 0 20px rgba(212, 175, 55, 0.3)']
        }} transition={{
          repeat: Infinity,
          duration: 3,
          ease: 'easeInOut'
        }}>
            Teen Patti
          </motion.h1>
          <p className="text-[#D4745E] text-sm tracking-[0.3em] uppercase font-medium">
            Social
          </p>
        </motion.div>
      </div>

      {/* Enhanced Loading with Progress Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-12 flex flex-col items-center gap-3 w-full px-12"
      >
        {/* Progress Bar */}
        <div className="w-full max-w-48 h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F4C430] rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: 'linear' }}
          />
        </div>
        <p className="text-stone-400 text-xs tracking-wider">
          Loading...
        </p>
        <motion.p
          className="text-stone-500 text-xs"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          Tap anywhere to skip
        </motion.p>
      </motion.div>
    </div>
  );
}