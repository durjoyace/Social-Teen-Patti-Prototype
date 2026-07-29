import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ChevronRight, Sparkles, Trophy, Eye } from 'lucide-react';
import { cn } from '../utils/cn';
import { formatChips } from '../game/gameEngine';
import { Card } from '../types';

/**
 * FIRST-TIME USER EXPERIENCE
 *
 * A deterministic, clearly labelled practice hand that teaches the controls
 * before the player enters a server-authoritative friend table.
 */

interface FirstGameExperienceProps {
  username: string;
  onComplete: () => void;
}

// Pre-built tutorial hand — player has a Trail (best possible hand)
const TUTORIAL_HAND: Card[] = [
  { suit: 'hearts', rank: 'A', value: 14 },
  { suit: 'diamonds', rank: 'A', value: 14 },
  { suit: 'spades', rank: 'A', value: 14 },
];

const OPPONENT_HANDS: Card[][] = [
  [
    { suit: 'clubs', rank: '7', value: 7 },
    { suit: 'hearts', rank: '3', value: 3 },
    { suit: 'diamonds', rank: '9', value: 9 },
  ],
  [
    { suit: 'spades', rank: 'K', value: 13 },
    { suit: 'hearts', rank: 'K', value: 13 },
    { suit: 'clubs', rank: '5', value: 5 },
  ],
];

type TutorialStep =
  | 'dealing'
  | 'cards_dealt'
  | 'peek_prompt'
  | 'cards_revealed'
  | 'bet_prompt'
  | 'opponents_fold'
  | 'win'
  | 'fairness_reveal'
  | 'complete';

const SUIT_SYMBOLS: Record<string, { symbol: string; color: string }> = {
  hearts: { symbol: '♥', color: 'text-red-500' },
  diamonds: { symbol: '♦', color: 'text-red-500' },
  clubs: { symbol: '♣', color: 'text-gray-900' },
  spades: { symbol: '♠', color: 'text-gray-900' },
};

export function FirstGameExperience({ username, onComplete }: FirstGameExperienceProps) {
  const [step, setStep] = useState<TutorialStep>('dealing');
  const [showCards, setShowCards] = useState(false);
  const [pot, setPot] = useState(150);
  const [coachMessage, setCoachMessage] = useState('');
  const [showCoach, setShowCoach] = useState(false);

  // Auto-advance through initial steps
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    if (step === 'dealing') {
      timers.push(setTimeout(() => setStep('cards_dealt'), 2000));
    }
    if (step === 'cards_dealt') {
      timers.push(setTimeout(() => {
        setCoachMessage("Your cards are face down. Tap to peek — or play blind for a thrill! 🎴");
        setShowCoach(true);
        setStep('peek_prompt');
      }, 1000));
    }
    if (step === 'cards_revealed') {
      timers.push(setTimeout(() => {
        setCoachMessage("Three Aces! That's a TRAIL — the best hand in Teen Patti! 🔥 Tap Chaal to bet.");
        setShowCoach(true);
        setStep('bet_prompt');
      }, 800));
    }
    if (step === 'opponents_fold') {
      timers.push(setTimeout(() => {
        setPot(450);
        setStep('win');
      }, 2000));
    }
    if (step === 'win') {
      timers.push(setTimeout(() => {
        setCoachMessage('');
        setShowCoach(false);
      }, 500));
    }

    return () => timers.forEach(clearTimeout);
  }, [step]);

  const handlePeek = () => {
    if (step !== 'peek_prompt') return;
    setShowCards(true);
    setShowCoach(false);
    setStep('cards_revealed');
  };

  const handleBet = () => {
    if (step !== 'bet_prompt') return;
    setShowCoach(false);
    setPot(300);
    setCoachMessage("Opponents see your confidence... Priya folds! Sharma Ji folds! 😱");
    setShowCoach(true);
    setStep('opponents_fold');
  };

  const handleContinueAfterWin = () => {
    setStep('fairness_reveal');
  };

  const handleFinish = () => {
    setStep('complete');
    setTimeout(onComplete, 500);
  };

  return (
    <div className="h-full w-full bg-[#0a1628] flex flex-col relative overflow-hidden">
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#1a5a2a] rounded-full blur-[180px] opacity-20" />
      </div>

      {/* Top bar */}
      <div className="relative z-20 flex items-center justify-between px-5 py-3 pt-4">
        <div className="text-white/40 text-xs font-medium">Your First Hand</div>
        <button
          onClick={onComplete}
          className="text-white/30 text-xs hover:text-white/60 transition"
        >
          Skip Tutorial
        </button>
      </div>

      {/* Table area */}
      <div className="flex-1 relative z-10 flex items-center justify-center px-4">
        <div className="relative w-full max-w-[360px]" style={{ aspectRatio: '1 / 1.1' }}>
          {/* Table felt */}
          <div className="absolute inset-0 rounded-[50%] bg-gradient-to-b from-[#5a3825] via-[#4a2e1c] to-[#3a2415] shadow-[0_8px_40px_rgba(0,0,0,0.6)]" />
          <div className="absolute inset-[6px] rounded-[50%] border-[2px] border-[#D4AF37]/40" />
          <div className="absolute inset-[10px] rounded-[50%] bg-gradient-to-br from-[#1a5c32] via-[#145228] to-[#0e3d1e] shadow-[inset_0_0_60px_rgba(0,0,0,0.5)]" />

          {/* Pot */}
          <motion.div
            className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
          >
            <motion.span
              key={pot}
              initial={{ scale: 1.4 }}
              animate={{ scale: 1 }}
              className="text-[#D4AF37] font-bold text-xl drop-shadow-[0_0_12px_rgba(212,175,55,0.4)]"
            >
              {pot} chips
            </motion.span>
            <span className="text-white/30 text-[9px] uppercase tracking-[0.2em]">Pot</span>
          </motion.div>

          {/* Opponents */}
          <AnimatePresence>
            {step !== 'opponents_fold' && step !== 'win' && step !== 'fairness_reveal' && step !== 'complete' && (
              <>
                {/* Priya — top left */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0.3, scale: 0.85 }}
                  className="absolute top-[15%] left-[18%] flex flex-col items-center"
                >
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-purple-800 flex items-center justify-center text-white font-bold border-2 border-white/20">
                    👩
                  </div>
                  <div className="mt-1 px-2 py-0.5 rounded-lg bg-black/40 text-center">
                    <span className="text-white text-[10px] font-semibold">Priya</span>
                  </div>
                </motion.div>

                {/* Sharma Ji — top right */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0.3, scale: 0.85 }}
                  className="absolute top-[15%] right-[18%] flex flex-col items-center"
                >
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-800 flex items-center justify-center text-white font-bold border-2 border-white/20">
                    🧔
                  </div>
                  <div className="mt-1 px-2 py-0.5 rounded-lg bg-black/40 text-center">
                    <span className="text-white text-[10px] font-semibold">Sharma Ji</span>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Folded message */}
          {step === 'opponents_fold' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-[20%] left-1/2 -translate-x-1/2 z-20"
            >
              <div className="px-4 py-2 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium">
                Both opponents folded!
              </div>
            </motion.div>
          )}

          {/* Your position — bottom */}
          <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 flex flex-col items-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-500 to-amber-700 flex items-center justify-center text-white font-bold text-lg border-2 border-yellow-500/60"
            >
              {username[0]?.toUpperCase() || 'Y'}
            </motion.div>
            <div className="mt-1 px-2 py-0.5 rounded-lg bg-black/40 text-center">
              <span className="text-yellow-400 text-[10px] font-semibold">You</span>
            </div>
          </div>
        </div>
      </div>

      {/* My Cards */}
      <AnimatePresence>
        {(step === 'cards_dealt' || step === 'peek_prompt' || step === 'cards_revealed' || step === 'bet_prompt' || step === 'opponents_fold') && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 18 }}
            className="fixed bottom-[160px] left-1/2 -translate-x-1/2 z-20 flex gap-1"
          >
            {TUTORIAL_HAND.map((card, i) => (
              <motion.div
                key={i}
                initial={{ y: 60, rotateZ: (i - 1) * 15, opacity: 0 }}
                animate={{ y: 0, rotateZ: (i - 1) * 7, opacity: 1 }}
                transition={{ delay: 0.2 + i * 0.15, type: 'spring', damping: 15 }}
                style={{ transformOrigin: 'bottom center', zIndex: i }}
              >
                <TutorialCard card={card} hidden={!showCards} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hand rank badge */}
      <AnimatePresence>
        {showCards && step !== 'win' && step !== 'fairness_reveal' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-[130px] left-1/2 -translate-x-1/2 z-20 px-4 py-1 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30"
          >
            <span className="text-yellow-400 text-xs font-bold">Trail (Three of a Kind) — BEST HAND!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Coach message */}
      <AnimatePresence>
        {showCoach && coachMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-[220px] left-1/2 -translate-x-1/2 z-30 w-[85%] max-w-sm"
          >
            <div className="px-5 py-3 rounded-2xl bg-black/80 backdrop-blur-sm border border-yellow-500/20">
              <p className="text-white/90 text-sm text-center leading-relaxed">{coachMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action area */}
      <div className="relative z-20 px-6 pb-10">
        {/* Peek prompt */}
        {step === 'peek_prompt' && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePeek}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-lg shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
          >
            <Eye className="w-5 h-5" />
            Peek at Your Cards
          </motion.button>
        )}

        {/* Bet prompt */}
        {step === 'bet_prompt' && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleBet}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-lg shadow-lg shadow-green-500/30 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Chaal — Bet 100 chips
          </motion.button>
        )}

        {/* Dealing indicator */}
        {step === 'dealing' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-2 py-4"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-5 h-5 border-2 border-yellow-500/20 border-t-yellow-500 rounded-full"
            />
            <span className="text-white/60 text-sm">Dealing cards...</span>
          </motion.div>
        )}

        {/* Cards dealt — waiting */}
        {step === 'cards_dealt' && (
          <div className="flex items-center justify-center py-4">
            <span className="text-white/40 text-sm">Cards are being dealt...</span>
          </div>
        )}

        {/* Win celebration */}
        {step === 'win' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 12 }}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-2xl shadow-yellow-500/50"
            >
              <Trophy className="w-10 h-10 text-yellow-900" />
            </motion.div>
            <div className="text-center">
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400"
              >
                YOU WIN!
              </motion.h2>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-green-400 text-xl font-bold mt-1"
              >
                +{formatChips(pot)} chips
              </motion.p>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-white/50 text-sm mt-2"
              >
                Trail of Aces — the strongest hand!
              </motion.p>
            </div>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleContinueAfterWin}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold shadow-lg shadow-orange-500/30"
            >
              Continue
            </motion.button>
          </motion.div>
        )}

        {/* Fairness reveal */}
        {step === 'fairness_reveal' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-5"
          >
            <div className="w-16 h-16 rounded-2xl bg-green-500/20 border border-green-500/30 flex items-center justify-center">
              <Shield className="w-8 h-8 text-green-400" />
            </div>
            <div className="text-center max-w-xs">
              <h3 className="text-xl font-bold text-white mb-2">Now bring your table circle</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                This was a guided practice hand. Real friend tables are dealt and settled by the server, and your referral only activates after a completed game with another human.
              </p>
              <p className="text-green-400 text-sm font-semibold mt-3">
                Invite a friend. Play one real game. Both unlock Beli extras.
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleFinish}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-lg shadow-lg shadow-green-500/30 flex items-center justify-center gap-2"
            >
              Start Playing
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        )}

        {/* Opponents folding */}
        {step === 'opponents_fold' && (
          <div className="flex items-center justify-center py-4">
            <span className="text-white/40 text-sm">Your opponents are shaking...</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tutorial Card Component ────────────────────────────────────────────────

function TutorialCard({ card, hidden }: { card: Card; hidden: boolean }) {
  const suit = SUIT_SYMBOLS[card.suit];

  return (
    <div className="w-[62px] h-[86px] rounded-xl relative select-none"
      style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))' }}>
      {hidden ? (
        <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#8B0000] via-[#7a0000] to-[#520000] border border-[#D4AF37]/50 overflow-hidden">
          <div className="absolute inset-[2px] rounded-[10px] border border-[#D4AF37]/25 overflow-hidden">
            <div className="absolute inset-0" style={{
              backgroundImage: `linear-gradient(45deg, rgba(212,175,55,0.08) 25%, transparent 25%), linear-gradient(-45deg, rgba(212,175,55,0.08) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(212,175,55,0.08) 75%), linear-gradient(-45deg, transparent 75%, rgba(212,175,55,0.08) 75%)`,
              backgroundSize: '12px 12px',
            }} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#D4AF37]/40 to-[#8B6914]/30 border border-[#D4AF37]/50 flex items-center justify-center">
              <span className="text-[#D4AF37] text-[8px] font-black">TP</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full h-full rounded-xl bg-white border border-gray-300/80 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50" />
          <div className={cn('absolute top-[3px] left-[4px] flex flex-col items-center leading-none', suit.color)}>
            <span className="text-[17px] font-extrabold" style={{ lineHeight: 1 }}>{card.rank}</span>
            <span className="text-[11px]" style={{ lineHeight: 1, marginTop: '-1px' }}>{suit.symbol}</span>
          </div>
          <div className={cn('absolute inset-0 flex items-center justify-center', suit.color)}>
            <span className="text-[28px] opacity-90">{suit.symbol}</span>
          </div>
          <div className={cn('absolute bottom-[3px] right-[4px] flex flex-col items-center leading-none rotate-180', suit.color)}>
            <span className="text-[17px] font-extrabold" style={{ lineHeight: 1 }}>{card.rank}</span>
            <span className="text-[11px]" style={{ lineHeight: 1, marginTop: '-1px' }}>{suit.symbol}</span>
          </div>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/60 via-transparent to-transparent opacity-50 pointer-events-none" />
        </div>
      )}
    </div>
  );
}
