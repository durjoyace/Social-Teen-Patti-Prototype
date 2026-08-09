import { KeyboardEvent as ReactKeyboardEvent, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, ChevronUp, Copy, Crown, Flame, Lock, Share2, Sparkles, Users, X, Zap } from 'lucide-react';
import { GameVariant } from '../types';
import { cn } from '../utils/cn';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (config: RoomConfig) => Promise<void>;
  createdRoomCode?: string | null;
  createdInviteUrl?: string | null;
  onInviteShared?: (platform: 'NATIVE' | 'COPY') => void;
}

interface RoomConfig {
  name: string;
  variant: GameVariant;
  minBuyIn: number;
  maxBuyIn: number;
  bootAmount: number;
  maxPlayers: number;
  isPrivate: boolean;
}

const DEFAULT_FRIEND_TABLE: RoomConfig = {
  name: 'Friends Game',
  variant: 'classic',
  minBuyIn: 500,
  maxBuyIn: 5000,
  bootAmount: 50,
  maxPlayers: 6,
  isPrivate: true,
};

const VARIANTS: { id: GameVariant; name: string; description: string; icon: typeof Crown }[] = [
  { id: 'classic', name: 'Classic', description: 'The familiar three-card game', icon: Crown },
  { id: 'joker', name: 'Joker', description: 'Wild cards change the read', icon: Sparkles },
  { id: 'muflis', name: 'Muflis', description: 'The lowest hand wins', icon: Zap },
  { id: 'ak47', name: 'AK47', description: 'A, K, 4, and 7 play wild', icon: Flame },
];

const STAKES = [
  { min: 100, max: 1000, boot: 10, label: 'Easy' },
  { min: 500, max: 5000, boot: 50, label: 'Game night' },
  { min: 1000, max: 10000, boot: 100, label: 'Big table' },
];

export function CreateRoomModal({ isOpen, onClose, onCreate, createdRoomCode, createdInviteUrl, onInviteShared }: CreateRoomModalProps) {
  const [config, setConfig] = useState<RoomConfig>(DEFAULT_FRIEND_TABLE);
  const [showCustom, setShowCustom] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const primaryActionRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setConfig(DEFAULT_FRIEND_TABLE);
    setShowCustom(false);
    setCopied(false);
    setIsCreating(false);
    const frame = window.requestAnimationFrame(() => primaryActionRef.current?.focus());
    return () => {
      window.cancelAnimationFrame(frame);
      previouslyFocused?.focus();
    };
  }, [isOpen]);

  const handleDialogKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled])') || []);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const createTable = async (tableConfig: RoomConfig) => {
    if (isCreating) return;
    setIsCreating(true);
    const variantName = VARIANTS.find(variant => variant.id === tableConfig.variant)?.name || 'Friend';
    try {
      await onCreate({ ...tableConfig, name: tableConfig.name.trim() || `${variantName} Table` });
    } finally {
      setIsCreating(false);
    }
  };

  const copyInvite = async (inviteText: string) => {
    try {
      await navigator.clipboard.writeText(inviteText);
      setCopied(true);
      onInviteShared?.('COPY');
    } catch {
      setCopied(false);
    }
  };

  if (!isOpen) return null;

  const inviteText = createdRoomCode
    ? createdInviteUrl
      ? `Join my private Teen Patti table: ${createdInviteUrl}`
      : `Join my Teen Patti table with room code ${createdRoomCode}.`
    : '';

  return (
    <AnimatePresence>
      <motion.div
        key="create-table-backdrop"
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
      />
      <motion.div
        key="create-table-dialog"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={createdRoomCode ? 'table-ready-title' : 'create-table-title'}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.98 }}
        onKeyDown={handleDialogKeyDown}
        className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-50 mx-auto flex max-h-[calc(100dvh-24px)] w-auto max-w-xl flex-col overflow-hidden rounded-[30px] border border-white/10 bg-[#0E1B17] text-[#F6ECD8] shadow-[0_30px_90px_rgba(0,0,0,0.55)] sm:inset-x-6 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2"
      >
        {createdRoomCode ? (
          <div className="overflow-y-auto p-6 text-center sm:p-8">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-[#E8B04A]/30 bg-[#2A1714] font-display text-3xl text-[#E8B04A]">♠</div>
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#E8B04A]">Your table is open</p>
            <h2 id="table-ready-title" className="mt-1 font-display text-3xl font-black text-[#FFF9ED]">Bring your circle in.</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#8E9C94]">The deal starts automatically when another player joins.</p>

            <button
              ref={primaryActionRef}
              type="button"
              onClick={() => void copyInvite(inviteText)}
              className="mt-6 w-full rounded-[22px] border border-[#E8B04A]/30 bg-[#07110E] px-4 py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B04A]"
              aria-label={`Copy invite for room ${createdRoomCode}`}
            >
              <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-[#66736D]">Room code</span>
              <span className="mt-1 block font-mono text-3xl font-black tracking-[0.32em] text-[#E8B04A]">{createdRoomCode}</span>
            </button>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => void copyInvite(inviteText)} className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#14231E] font-bold text-[#F6ECD8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B04A]">
                {copied ? <Check className="h-4 w-4 text-[#8ED4A5]" /> : <Copy className="h-4 w-4" />} {copied ? 'Copied' : 'Copy invite'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (navigator.share) {
                    try {
                      await navigator.share({ title: 'Join my table', text: inviteText });
                      onInviteShared?.('NATIVE');
                    } catch {
                      // Closing the native share sheet is not an error state.
                    }
                  } else {
                    window.open(`https://wa.me/?text=${encodeURIComponent(inviteText)}`, '_blank', 'noopener,noreferrer');
                    onInviteShared?.('NATIVE');
                  }
                }}
                className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl bg-[#E8B04A] font-bold text-[#171006] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFF9ED]"
              >
                <Share2 className="h-4 w-4" /> Share
              </button>
            </div>
            <div className="mt-5 flex items-center justify-center gap-2 text-sm text-[#8E9C94]"><span className="h-2 w-2 animate-pulse rounded-full bg-[#E8B04A]" /> Waiting for a friend…</div>
            <button type="button" onClick={onClose} className="mt-5 min-h-11 px-4 text-sm font-semibold text-[#8E9C94] hover:text-[#F6ECD8]">Keep waiting in the lobby</button>
          </div>
        ) : (
          <>
            <header className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6 sm:py-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E8B04A]">Private friend table</p>
                <h2 id="create-table-title" className="mt-1 font-display text-2xl font-black text-[#FFF9ED]">Open the table.</h2>
                <p className="mt-1 text-sm text-[#7E8D85]">Classic rules, six seats, ready to share.</p>
              </div>
              <button type="button" aria-label="Close create table dialog" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 text-[#8E9C94] hover:bg-white/5 hover:text-[#F6ECD8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B04A]">
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="overflow-y-auto px-5 py-5 sm:px-6">
              <button
                ref={primaryActionRef}
                type="button"
                onClick={() => void createTable(DEFAULT_FRIEND_TABLE)}
                disabled={isCreating}
                aria-busy={isCreating}
                className="w-full rounded-[24px] border border-[#E8B04A]/35 bg-[#163E2D] p-5 text-left transition-colors hover:border-[#E8B04A]/60 disabled:cursor-wait disabled:opacity-55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B04A]"
              >
                <span className="flex items-start gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#E8B04A] text-[#171006]"><Users className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-xl font-bold text-[#FFF9ED]">Start a classic friend table</span>
                    <span className="mt-1 block text-sm leading-6 text-[#B8C7BF]">Private · 6 seats · 500–5,000 Beli · 50 boot</span>
                    <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#E8B04A] px-4 py-2 text-xs font-black text-[#171006]">{isCreating ? 'Opening table…' : 'Create and get code'}</span>
                  </span>
                </span>
              </button>

              <button type="button" aria-expanded={showCustom} onClick={() => setShowCustom(value => !value)} className="mt-4 flex min-h-12 w-full items-center justify-between rounded-2xl border border-white/10 bg-[#07110E] px-4 text-sm font-semibold text-[#C7D3CC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B04A]">
                Customize the table
                {showCustom ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              <AnimatePresence initial={false}>
                {showCustom && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="space-y-6 pt-6">
                      <fieldset>
                        <legend className="text-xs font-bold uppercase tracking-[0.16em] text-[#8E9C94]">Game</legend>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {VARIANTS.map(variant => {
                            const Icon = variant.icon;
                            const selected = config.variant === variant.id;
                            return (
                              <button key={variant.id} type="button" aria-pressed={selected} onClick={() => setConfig(current => ({ ...current, variant: variant.id }))} className={cn('rounded-2xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B04A]', selected ? 'border-[#E8B04A] bg-[#2A1714]' : 'border-white/10 bg-[#07110E] hover:border-white/20')}>
                                <Icon className={cn('h-5 w-5', selected ? 'text-[#E8B04A]' : 'text-[#66736D]')} />
                                <span className="mt-2 block text-sm font-bold text-[#F6ECD8]">{variant.name}</span>
                                <span className="mt-0.5 block text-[11px] leading-4 text-[#7E8D85]">{variant.description}</span>
                              </button>
                            );
                          })}
                        </div>
                      </fieldset>

                      <fieldset>
                        <legend className="text-xs font-bold uppercase tracking-[0.16em] text-[#8E9C94]">Table pace</legend>
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          {STAKES.map(stake => {
                            const selected = config.minBuyIn === stake.min;
                            return (
                              <button key={stake.label} type="button" aria-pressed={selected} onClick={() => setConfig(current => ({ ...current, minBuyIn: stake.min, maxBuyIn: stake.max, bootAmount: stake.boot }))} className={cn('rounded-2xl border px-2 py-3 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B04A]', selected ? 'border-[#E8B04A] bg-[#E8B04A] text-[#171006]' : 'border-white/10 bg-[#07110E] text-[#C7D3CC]')}>
                                <span className="block text-xs font-black">{stake.label}</span>
                                <span className="mt-0.5 block text-[9px] opacity-70">{stake.min}–{stake.max}</span>
                              </button>
                            );
                          })}
                        </div>
                      </fieldset>

                      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
                        <label className="text-xs font-bold uppercase tracking-[0.14em] text-[#8E9C94]">
                          Table name
                          <input value={config.name} onChange={event => setConfig(current => ({ ...current, name: event.target.value }))} maxLength={32} className="mt-2 min-h-12 w-full rounded-2xl border border-white/10 bg-[#07110E] px-4 text-base font-normal normal-case tracking-normal text-[#F6ECD8] outline-none focus:border-[#E8B04A]/60 focus:ring-2 focus:ring-[#E8B04A]/20" />
                        </label>
                        <fieldset>
                          <legend className="text-xs font-bold uppercase tracking-[0.14em] text-[#8E9C94]">Seats</legend>
                          <div className="mt-2 flex gap-2">
                            {[2, 4, 6].map(seats => <button key={seats} type="button" aria-pressed={config.maxPlayers === seats} onClick={() => setConfig(current => ({ ...current, maxPlayers: seats }))} className={cn('h-12 flex-1 rounded-xl border text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B04A]', config.maxPlayers === seats ? 'border-[#E8B04A] bg-[#E8B04A] text-[#171006]' : 'border-white/10 bg-[#07110E] text-[#C7D3CC]')}>{seats}</button>)}
                          </div>
                        </fieldset>
                      </div>

                      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#07110E] p-4 text-sm text-[#A9B9B0]">
                        <Lock className="h-5 w-5 shrink-0 text-[#E8B04A]" />
                        Custom tables are private and require the six-character code.
                      </div>

                      <button type="button" onClick={() => void createTable(config)} disabled={isCreating} aria-busy={isCreating} className="min-h-[52px] w-full rounded-2xl bg-[#E8B04A] px-5 font-bold text-[#171006] transition-colors hover:bg-[#F0C268] disabled:cursor-wait disabled:opacity-55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFF9ED]">{isCreating ? 'Opening table…' : 'Create custom table'}</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
