import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Copy, Check, Gift, Share2, ExternalLink, Star, Trophy, ChevronRight } from 'lucide-react';
import { cn } from '../utils/cn';
import { formatChips } from '../game/gameEngine';

interface ReferralProgramProps {
  referralCode: string;
  referralsCount: number;
  totalEarned: number;
  onShare: (platform: string) => void;
  className?: string;
}

const REFERRAL_REWARDS = [
  { friends: 1, reward: 2000, label: '1 Friend', achieved: true },
  { friends: 3, reward: 5000, label: '3 Friends', achieved: true },
  { friends: 5, reward: 10000, label: '5 Friends', achieved: false },
  { friends: 10, reward: 25000, label: '10 Friends', achieved: false },
  { friends: 25, reward: 100000, label: '25 Friends', achieved: false },
  { friends: 50, reward: 500000, label: '50 Friends', achieved: false },
];

export function ReferralProgram({
  referralCode = 'PATTI2024',
  referralsCount = 2,
  totalEarned = 7000,
  onShare,
  className,
}: ReferralProgramProps) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareUrl = `https://teenpatti.social/invite/${referralCode}`;

  const nextMilestone = REFERRAL_REWARDS.find(r => !r.achieved);
  const progressToNext = nextMilestone
    ? (referralsCount / nextMilestone.friends) * 100
    : 100;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Hero card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 p-5">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{ x: ['-200%', '200%'] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
        />

        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-white/80" />
            <span className="text-white/80 text-sm font-medium">Invite Friends, Earn Chips!</span>
          </div>
          <p className="text-white text-2xl font-bold mb-1">
            ₹2,000 per friend
          </p>
          <p className="text-white/60 text-xs mb-4">
            Both you and your friend get ₹2,000 chips when they sign up
          </p>

          {/* Stats */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1 p-3 rounded-xl bg-white/10">
              <p className="text-xl font-bold text-white">{referralsCount}</p>
              <p className="text-xs text-white/50">Friends Invited</p>
            </div>
            <div className="flex-1 p-3 rounded-xl bg-white/10">
              <p className="text-xl font-bold text-yellow-300">₹{formatChips(totalEarned)}</p>
              <p className="text-xs text-white/50">Total Earned</p>
            </div>
          </div>

          {/* Referral code */}
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl bg-black/30 border border-white/10">
              <span className="text-white font-mono font-bold tracking-widest flex-1">{referralCode}</span>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={copyCode}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-white/60" />
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Share buttons */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { id: 'whatsapp', label: 'WhatsApp', color: 'bg-green-600', emoji: '💬' },
          { id: 'telegram', label: 'Telegram', color: 'bg-blue-500', emoji: '✈️' },
          { id: 'instagram', label: 'Instagram', color: 'bg-gradient-to-br from-purple-500 to-pink-500', emoji: '📷' },
          { id: 'copy', label: 'Copy Link', color: 'bg-gray-600', emoji: '🔗' },
        ].map(platform => (
          <motion.button
            key={platform.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => onShare(platform.id)}
            className={cn(
              'flex flex-col items-center gap-1.5 py-3 rounded-xl',
              platform.color, 'text-white'
            )}
          >
            <span className="text-lg">{platform.emoji}</span>
            <span className="text-[10px] font-medium">{platform.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Milestone rewards */}
      <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Milestone Rewards</h3>
          {nextMilestone && (
            <span className="text-xs text-white/40">
              {referralsCount}/{nextMilestone.friends} to next
            </span>
          )}
        </div>

        {/* Progress bar */}
        {nextMilestone && (
          <div className="w-full h-1.5 bg-white/10 rounded-full mb-4 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progressToNext, 100)}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
        )}

        <div className="space-y-2">
          {REFERRAL_REWARDS.map((milestone, i) => (
            <div
              key={i}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl transition-colors',
                milestone.achieved ? 'bg-green-500/10' : 'bg-white/5'
              )}
            >
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center',
                milestone.achieved
                  ? 'bg-green-500/20'
                  : 'bg-white/10'
              )}>
                {milestone.achieved ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Gift className="w-4 h-4 text-white/30" />
                )}
              </div>

              <div className="flex-1">
                <span className={cn(
                  'text-sm font-medium',
                  milestone.achieved ? 'text-green-400' : 'text-white/60'
                )}>
                  Invite {milestone.label}
                </span>
              </div>

              <span className={cn(
                'text-sm font-bold',
                milestone.achieved ? 'text-green-400' : 'text-yellow-400'
              )}>
                ₹{formatChips(milestone.reward)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
