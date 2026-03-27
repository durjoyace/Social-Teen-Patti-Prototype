import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Zap, Target, TrendingUp, Check, X } from 'lucide-react';
import { cn } from '../utils/cn';
import { formatChips } from '../game/gameEngine';

// ---------- Types ----------

interface PredictionPlayer {
  id: string;
  name: string;
  avatarUrl?: string;
  handStrength: number; // 0-1, hidden from spectator until reveal
}

interface PredictionResult {
  winnerId: string;
  winnerName: string;
  userPredictedCorrectly: boolean;
  rewardAmount: number;
}

interface SpectatorPredictionProps {
  players: PredictionPlayer[];
  isHandActive: boolean;
  potSize: number;
  className?: string;
  onPredictionMade?: (playerId: string) => void;
}

// ---------- Mock spectator predictions ----------

function generateMockPredictions(players: PredictionPlayer[]): Record<string, number> {
  const predictions: Record<string, number> = {};
  let remaining = 100;

  players.forEach((player, index) => {
    if (index === players.length - 1) {
      predictions[player.id] = remaining;
    } else {
      // Weight by hand strength for more realistic mock distribution
      const weight = player.handStrength * 0.6 + Math.random() * 0.4;
      const share = Math.floor((remaining * weight) / (players.length - index));
      const clamped = Math.max(5, Math.min(remaining - (players.length - index - 1) * 5, share));
      predictions[player.id] = clamped;
      remaining -= clamped;
    }
  });

  return predictions;
}

// ---------- Main Component ----------

export function SpectatorPrediction({
  players,
  isHandActive,
  potSize,
  className,
  onPredictionMade,
}: SpectatorPredictionProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [spectatorPredictions, setSpectatorPredictions] = useState<Record<string, number>>({});
  const [predictionStreak, setPredictionStreak] = useState(3); // Mock starting streak
  const [totalChipsWon, setTotalChipsWon] = useState(1250); // Mock total
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [hasLocked, setHasLocked] = useState(false);

  // Generate mock spectator predictions on mount / player change
  useEffect(() => {
    if (players.length > 0) {
      setSpectatorPredictions(generateMockPredictions(players));
    }
  }, [players]);

  // Reset when a new hand starts
  useEffect(() => {
    if (isHandActive) {
      setSelectedPlayerId(null);
      setResult(null);
      setShowResult(false);
      setHasLocked(false);
    }
  }, [isHandActive]);

  // Simulate hand ending and revealing result
  useEffect(() => {
    if (!isHandActive && hasLocked && selectedPlayerId && !result) {
      // Determine winner (player with highest hand strength)
      const winner = [...players].sort((a, b) => b.handStrength - a.handStrength)[0];
      const correct = winner.id === selectedPlayerId;
      const reward = correct ? Math.floor(potSize * 0.01) : 0;

      const predictionResult: PredictionResult = {
        winnerId: winner.id,
        winnerName: winner.name,
        userPredictedCorrectly: correct,
        rewardAmount: reward,
      };

      // Delay for dramatic reveal
      const timer = setTimeout(() => {
        setResult(predictionResult);
        setShowResult(true);

        if (correct) {
          setPredictionStreak((prev) => prev + 1);
          setTotalChipsWon((prev) => prev + reward);
        } else {
          setPredictionStreak(0);
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isHandActive, hasLocked, selectedPlayerId, players, potSize, result]);

  const handlePrediction = useCallback(
    (playerId: string) => {
      if (hasLocked || !isHandActive) return;

      setSelectedPlayerId(playerId);

      // Update mock prediction percentages to include user's vote
      setSpectatorPredictions((prev) => {
        const updated = { ...prev };
        // Slightly boost the selected player
        const boost = 2;
        Object.keys(updated).forEach((id) => {
          if (id === playerId) {
            updated[id] = Math.min(95, updated[id] + boost);
          } else {
            updated[id] = Math.max(2, updated[id] - Math.floor(boost / (players.length - 1)));
          }
        });
        return updated;
      });

      onPredictionMade?.(playerId);
    },
    [hasLocked, isHandActive, players.length, onPredictionMade]
  );

  const handleLockPrediction = useCallback(() => {
    if (!selectedPlayerId) return;
    setHasLocked(true);
  }, [selectedPlayerId]);

  // Auto-dismiss result after a few seconds
  useEffect(() => {
    if (showResult) {
      const timer = setTimeout(() => setShowResult(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showResult]);

  if (players.length < 2) return null;

  return (
    <div className={cn('relative', className)}>
      {/* Prediction card */}
      <AnimatePresence mode="wait">
        {isHandActive && !hasLocked && (
          <motion.div
            key="predict"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 rounded-2xl p-4 backdrop-blur-sm"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-yellow-500/10">
                  <Target className="w-4 h-4 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Who will win?</h3>
                  <p className="text-[10px] text-white/40">
                    Pot: {formatChips(potSize)} chips
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {predictionStreak > 0 && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20">
                    <Zap className="w-3 h-3 text-orange-400" />
                    <span className="text-[10px] font-bold text-orange-400">
                      {predictionStreak}x
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Player options */}
            <div className="space-y-2 mb-3">
              {players.map((player) => {
                const isSelected = selectedPlayerId === player.id;
                const percentage = spectatorPredictions[player.id] || 0;

                return (
                  <motion.button
                    key={player.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handlePrediction(player.id)}
                    className={cn(
                      'relative w-full flex items-center gap-3 p-2.5 rounded-xl transition-all overflow-hidden',
                      isSelected
                        ? 'bg-yellow-500/10 border border-yellow-500/30'
                        : 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]'
                    )}
                  >
                    {/* Background percentage bar */}
                    <motion.div
                      className={cn(
                        'absolute inset-y-0 left-0',
                        isSelected
                          ? 'bg-yellow-500/10'
                          : 'bg-white/[0.03]'
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />

                    {/* Avatar */}
                    <div
                      className={cn(
                        'relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                        isSelected
                          ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-yellow-900'
                          : 'bg-gradient-to-br from-red-700 to-red-900 text-white'
                      )}
                    >
                      {player.name.charAt(0)}
                    </div>

                    {/* Name */}
                    <span className="relative z-10 text-sm text-white font-medium flex-1 text-left truncate">
                      {player.name}
                    </span>

                    {/* Percentage */}
                    <span
                      className={cn(
                        'relative z-10 text-sm font-bold tabular-nums',
                        isSelected ? 'text-yellow-400' : 'text-white/40'
                      )}
                    >
                      {percentage}%
                    </span>

                    {/* Selected check */}
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="relative z-10 w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center"
                      >
                        <Check className="w-3 h-3 text-yellow-900" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Lock prediction button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleLockPrediction}
              disabled={!selectedPlayerId}
              className={cn(
                'w-full py-2.5 rounded-xl text-sm font-bold transition-all',
                selectedPlayerId
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-yellow-900 shadow-lg shadow-yellow-500/20'
                  : 'bg-white/5 text-white/30 cursor-not-allowed'
              )}
            >
              {selectedPlayerId ? 'Lock Prediction' : 'Tap a player to predict'}
            </motion.button>

            {/* Stats footer */}
            <div className="flex items-center justify-center gap-4 mt-2.5">
              <span className="text-[10px] text-white/30">
                Streak: {predictionStreak}
              </span>
              <span className="text-[10px] text-white/30">
                Won: {formatChips(totalChipsWon)}
              </span>
            </div>
          </motion.div>
        )}

        {/* Locked state */}
        {hasLocked && !showResult && (
          <motion.div
            key="locked"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-gradient-to-b from-yellow-500/[0.06] to-transparent border border-yellow-500/20 rounded-2xl p-4 text-center"
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Target className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            </motion.div>
            <p className="text-sm font-semibold text-white mb-1">Prediction Locked!</p>
            <p className="text-xs text-white/40">
              You picked{' '}
              <span className="text-yellow-400 font-medium">
                {players.find((p) => p.id === selectedPlayerId)?.name}
              </span>
            </p>
            <div className="flex items-center justify-center gap-1 mt-2">
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-yellow-500"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 1 }}
              />
              <span className="text-[10px] text-white/30">Waiting for hand to end...</span>
            </div>
          </motion.div>
        )}

        {/* Result reveal */}
        {showResult && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={cn(
              'border rounded-2xl p-5 text-center overflow-hidden relative',
              result.userPredictedCorrectly
                ? 'bg-gradient-to-b from-green-500/10 to-green-900/5 border-green-500/30'
                : 'bg-gradient-to-b from-red-500/10 to-red-900/5 border-red-500/30'
            )}
          >
            {/* Shine effect for correct */}
            {result.userPredictedCorrectly && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/10 to-transparent"
                animate={{ x: ['-200%', '200%'] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              />
            )}

            {/* Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="relative z-10 mb-3"
            >
              {result.userPredictedCorrectly ? (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mx-auto shadow-lg shadow-green-500/30">
                  <Trophy className="w-8 h-8 text-green-900" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-400/20 to-red-600/20 border border-red-500/30 flex items-center justify-center mx-auto">
                  <X className="w-8 h-8 text-red-400" />
                </div>
              )}
            </motion.div>

            {/* Text */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="relative z-10"
            >
              <h3
                className={cn(
                  'text-lg font-bold mb-1',
                  result.userPredictedCorrectly ? 'text-green-400' : 'text-red-400'
                )}
              >
                {result.userPredictedCorrectly ? 'Correct!' : 'Not this time!'}
              </h3>
              <p className="text-sm text-white/60 mb-2">
                {result.winnerName} won the hand
              </p>

              {result.userPredictedCorrectly && result.rewardAmount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.5 }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30"
                >
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 font-bold">
                    +{formatChips(result.rewardAmount)}
                  </span>
                </motion.div>
              )}

              {/* Streak */}
              <div className="flex items-center justify-center gap-1 mt-3">
                <Zap className="w-3 h-3 text-orange-400" />
                <span className="text-[10px] text-white/40">
                  {result.userPredictedCorrectly
                    ? `${predictionStreak} predictions in a row!`
                    : 'Streak reset'}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
