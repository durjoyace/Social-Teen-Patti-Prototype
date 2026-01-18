import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CharacterGuide } from '../components/CharacterGuide';
import { ArrowRight } from 'lucide-react';
interface OnboardingFlowProps {
  onComplete: () => void;
}
export function OnboardingFlow({
  onComplete
}: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const steps = [{
    text: 'Namaste beta! Welcome to our home. I am Lakshmi Ma. Let me show you how we play Teen Patti with heart and honor.',
    bg: 'bg-[#FFF8DC]'
  }, {
    text: "Here, we don't just play for chips. We play for family pride! Invite your cousins, send them ladoos, and have fun.",
    bg: 'bg-[#FFF8DC]'
  }, {
    text: 'Remember, a good player knows when to be bold like a tiger, and when to be patient like an elephant. Ready to join the table?',
    bg: 'bg-[#FFF8DC]'
  }];
  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };
  return <div className={`h-full w-full ${steps[step].bg} relative flex flex-col p-6 transition-colors duration-500`}>
      {/* Skip Button */}
      <div className="flex justify-end pt-4">
        <button onClick={onComplete} className="text-stone-400 text-sm font-medium hover:text-[#8B0000]">
          Skip
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center -mt-20">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{
          opacity: 0,
          scale: 0.9
        }} animate={{
          opacity: 1,
          scale: 1
        }} exit={{
          opacity: 0,
          scale: 1.1
        }} className="w-full max-w-xs aspect-square bg-white rounded-full shadow-2xl border-4 border-[#D4AF37]/20 flex items-center justify-center mb-8 overflow-hidden relative">
            {/* Illustrative Scenes per step (Abstract/Icon based) */}
            {step === 0 && <div className="text-6xl">🙏</div>}
            {step === 1 && <div className="text-6xl">👨‍👩‍👧‍👦</div>}
            {step === 2 && <div className="text-6xl">🃏</div>}

            {/* Decorative pattern */}
            <div className="absolute inset-0 border-[20px] border-double border-[#D4AF37]/10 rounded-full"></div>
          </motion.div>
        </AnimatePresence>

        {/* Step Indicators */}
        <div className="flex gap-2 mb-8">
          {steps.map((_, i) => <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-[#8B0000]' : 'w-2 bg-stone-300'}`} />)}
        </div>
      </div>

      {/* Character Guide Overlay */}
      <CharacterGuide text={steps[step].text} onNext={handleNext} showNext={true} />
    </div>;
}