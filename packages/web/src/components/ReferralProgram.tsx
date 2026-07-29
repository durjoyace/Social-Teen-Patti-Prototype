import { useCallback, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  Copy,
  Gift,
  LoaderCircle,
  LockKeyhole,
  MessageCircle,
  RefreshCw,
  Share2,
  Sparkles,
  Users,
} from 'lucide-react';
import { api } from '../services/api';
import { analytics } from '../services/analytics';
import { useAuthStore } from '../stores/authStore';
import type { ReferralSharePlatform, ReferralSummary } from '../types';
import { NavigationBar } from './NavigationBar';

interface ReferralProgramProps {
  onNavigate: (screen: string) => void;
}

const statusCopy = {
  PENDING: 'Needs their first real game',
  QUALIFIED: 'Reward being confirmed',
  REWARDED: 'Beli unlocked',
  REJECTED: 'Could not be verified',
} as const;

export function ReferralProgram({ onNavigate }: ReferralProgramProps) {
  const reduceMotion = useReducedMotion();
  const updateUser = useAuthStore(state => state.updateUser);
  const [summary, setSummary] = useState<ReferralSummary | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [busyItem, setBusyItem] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    setError('');
    try {
      const result = await api.getReferralSummary();
      setSummary(result);
      updateUser({ beliBalance: result.beliBalance, referralCode: result.code });
      analytics.referralHubViewed(result.stats.activated);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load your invite circle');
    }
  }, [updateUser]);

  useEffect(() => { void loadSummary(); }, [loadSummary]);

  const shareMessage = summary
    ? `Come join my Teen Patti table. Finish one real multiplayer game and we both unlock ${summary.activationRewardBeli} Beli for profile extras. ${summary.shareUrl}`
    : '';

  const recordShare = async (platform: ReferralSharePlatform) => {
    try {
      await api.recordReferralShare(platform);
    } catch {
      // Sharing should still work when telemetry is temporarily unavailable.
    }
  };

  const copyLink = async () => {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary.shareUrl);
      await recordShare('COPY');
      analytics.referralCodeCopied();
      analytics.inviteShared('copy');
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Copying was blocked by this browser. Use Share instead.');
    }
  };

  const share = async (platform: 'whatsapp' | 'native') => {
    if (!summary) return;
    analytics.inviteShareStarted(platform);
    if (platform === 'native' && navigator.share) {
      try {
        await navigator.share({ title: 'Join my Teen Patti table', text: shareMessage, url: summary.shareUrl });
        await recordShare('NATIVE');
        analytics.inviteShared('native');
      } catch (shareError) {
        if (shareError instanceof DOMException && shareError.name === 'AbortError') return;
        setError('Sharing was not available on this device. Copy the link instead.');
      }
      return;
    }

    window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, '_blank', 'noopener,noreferrer');
    await recordShare('WHATSAPP');
    analytics.inviteShared('whatsapp');
  };

  const redeem = async (itemId: string, costBeli: number) => {
    setBusyItem(itemId);
    setError('');
    try {
      const result = await api.redeemBeli(itemId);
      analytics.rewardRedeemed(itemId, costBeli);
      updateUser({ beliBalance: result.beliBalance });
      await loadSummary();
    } catch (redeemError) {
      setError(redeemError instanceof Error ? redeemError.message : 'Could not unlock that extra');
    } finally {
      setBusyItem(null);
    }
  };

  if (!summary && !error) {
    return (
      <main className="h-full bg-[#0B1221] text-[#FFF4D6] grid place-items-center" aria-busy="true">
        <LoaderCircle className="h-8 w-8 animate-spin text-[#FFD66B]" aria-label="Loading invite circle" />
      </main>
    );
  }

  if (!summary) {
    return (
      <main className="h-full bg-[#0B1221] text-[#FFF4D6] grid place-items-center p-6">
        <div className="max-w-sm text-center">
          <p className="text-lg font-semibold">Your invite circle is unavailable</p>
          <p className="mt-2 text-sm text-white/60">{error}</p>
          <button onClick={() => void loadSummary()} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#F5A524] px-5 py-3 font-bold text-[#0B1221]">
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
        </div>
      </main>
    );
  }

  const nextCount = summary.nextMilestone?.count ?? summary.stats.activated;
  const progress = nextCount ? Math.min(100, (summary.stats.activated / nextCount) * 100) : 100;

  return (
    <main className="relative h-full overflow-y-auto bg-[#0B1221] pb-28 text-[#FFF4D6]">
      <div className="pointer-events-none absolute inset-0 opacity-30 [background:radial-gradient(circle_at_80%_0%,#176B45_0%,transparent_35%)]" />
      <header className="relative mx-auto flex w-full max-w-2xl items-center gap-3 px-5 pb-3 pt-5">
        <button onClick={() => onNavigate('home')} className="rounded-xl border border-white/10 bg-white/5 p-2.5" aria-label="Back to lobby">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#FFD66B]">Your table circle</p>
          <h1 className="font-display text-2xl font-bold">Invite the people you play with</h1>
        </div>
      </header>

      <div className="relative mx-auto w-full max-w-2xl space-y-5 px-5">
        {error && (
          <div role="alert" className="rounded-xl border border-[#D94841]/40 bg-[#D94841]/10 px-4 py-3 text-sm text-red-100">{error}</div>
        )}

        <section className="overflow-hidden rounded-[28px] border border-[#FFD66B]/25 bg-[#111B2E] shadow-2xl shadow-black/30">
          <div className="relative p-6">
            <div className="absolute -right-10 -top-14 h-40 w-40 rounded-full bg-[#F5A524]/15 blur-3xl" />
            <p className="relative max-w-lg text-sm leading-6 text-white/65">
              Your friend joins, completes one real multiplayer game, and both of you unlock <strong className="text-[#FFD66B]">{summary.activationRewardBeli} Beli</strong>. Signups and bot games do not count.
            </p>

            <div className="relative mt-6 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2" aria-label="Invite reward flow">
              {[
                { icon: Users, label: 'You invite' },
                { icon: MessageCircle, label: 'They play' },
                { icon: Sparkles, label: 'Both earn' },
              ].map((seat, index) => (
                <div className="contents" key={seat.label}>
                  <motion.div
                    initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.12 }}
                    className="flex min-w-0 flex-col items-center gap-2 text-center"
                  >
                    <span className="grid h-12 w-12 place-items-center rounded-full border border-[#FFD66B]/30 bg-[#176B45] shadow-lg shadow-[#176B45]/20">
                      <seat.icon className="h-5 w-5" />
                    </span>
                    <span className="text-[11px] font-semibold text-white/70">{seat.label}</span>
                  </motion.div>
                  {index < 2 && <div className="h-px w-5 bg-gradient-to-r from-[#FFD66B]/30 to-[#FFD66B]" />}
                </div>
              ))}
            </div>

            <div className="relative mt-6 flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4">
              <div>
                <p className="text-xs text-white/50">Your Beli</p>
                <p className="text-3xl font-black text-[#FFD66B]">{summary.beliBalance.toLocaleString('en-IN')}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/50">Friends activated</p>
                <p className="text-xl font-bold">{summary.stats.activated}</p>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="share-title" className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <h2 id="share-title" className="font-display text-xl font-bold">Deal the invite</h2>
          <p className="mt-1 text-sm text-white/55">Made for the group chat where your table already lives.</p>
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[#FFD66B]/20 bg-black/25 p-2 pl-4">
            <code className="min-w-0 flex-1 truncate text-sm font-bold tracking-widest text-[#FFD66B]">{summary.code}</code>
            <button onClick={() => void copyLink()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white/10 px-4 text-sm font-semibold">
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button onClick={() => void share('whatsapp')} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#176B45] px-4 font-bold">
              <MessageCircle className="h-5 w-5" /> WhatsApp
            </button>
            <button onClick={() => void share('native')} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#F5A524] px-4 font-bold text-[#0B1221]">
              <Share2 className="h-5 w-5" /> Share
            </button>
          </div>
        </section>

        <section aria-labelledby="milestone-title" className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#FFD66B]">Beli trail</p>
              <h2 id="milestone-title" className="font-display text-xl font-bold">Keep the circle moving</h2>
            </div>
            {summary.nextMilestone && <p className="text-xs text-white/50">{summary.stats.activated}/{summary.nextMilestone.count}</p>}
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
            <motion.div initial={reduceMotion ? false : { width: 0 }} animate={{ width: `${progress}%` }} className="h-full rounded-full bg-[#FFD66B]" />
          </div>
          <div className="mt-5 space-y-3 border-l border-[#FFD66B]/25 pl-5">
            {summary.milestones.map(milestone => (
              <div key={milestone.count} className="relative flex items-center justify-between gap-4">
                <span className={`absolute -left-[27px] h-3 w-3 rounded-full border-2 border-[#0B1221] ${milestone.achieved ? 'bg-[#FFD66B]' : 'bg-white/25'}`} />
                <div>
                  <p className={milestone.achieved ? 'font-semibold' : 'text-white/60'}>{milestone.label}</p>
                  <p className="text-xs text-white/40">{milestone.count} activated {milestone.count === 1 ? 'friend' : 'friends'}</p>
                </div>
                <span className="font-bold text-[#FFD66B]">+{milestone.beli}</span>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="extras-title">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#FFD66B]">Extras</p>
              <h2 id="extras-title" className="font-display text-xl font-bold">Make the table yours</h2>
            </div>
            <p className="text-xs text-white/45">No cash value</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {summary.catalog.map(item => {
              const canAfford = summary.beliBalance >= item.costBeli;
              return (
                <article key={item.id} className="rounded-2xl border border-white/10 bg-[#111B2E] p-4">
                  <div className="flex items-start gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#F5A524]/15 text-[#FFD66B]">
                      {item.owned ? <Check className="h-5 w-5" /> : <Gift className="h-5 w-5" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold">{item.name}</h3>
                      <p className="mt-1 text-xs leading-5 text-white/50">{item.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => void redeem(item.id, item.costBeli)}
                    disabled={item.owned || !canAfford || busyItem !== null}
                    className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {busyItem === item.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : item.owned ? <Check className="h-4 w-4" /> : !canAfford ? <LockKeyhole className="h-4 w-4" /> : null}
                    {item.owned ? 'Unlocked' : `${item.costBeli} Beli`}
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        {summary.referrals.length > 0 && (
          <section aria-labelledby="friends-title" className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <h2 id="friends-title" className="font-display text-xl font-bold">Friends on the trail</h2>
            <div className="mt-3 divide-y divide-white/10">
              {summary.referrals.map(referral => (
                <div key={referral.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{referral.username}</p>
                    <p className="text-xs text-white/45">{statusCopy[referral.status]}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${referral.status === 'REWARDED' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/10 text-white/55'}`}>
                    {referral.status === 'REWARDED' ? `+${summary.activationRewardBeli}` : referral.status.toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        <p className="px-3 text-center text-[11px] leading-5 text-white/35">
          Beli is earned through verified social play. It cannot be bought, transferred, wagered, cashed out, or exchanged for chips.
        </p>
      </div>
      <NavigationBar currentScreen="referrals" onNavigate={onNavigate} />
    </main>
  );
}
