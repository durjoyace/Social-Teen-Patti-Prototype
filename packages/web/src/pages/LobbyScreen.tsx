import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowUpRight,
  ChevronRight,
  CircleUserRound,
  Crown,
  Flame,
  Gift,
  Hash,
  Play,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useGameStore } from '../stores/gameStore';
import { Layout } from '../components/Layout';
import { NavigationBar } from '../components/NavigationBar';
import { AnimatedChipCount, PullToRefresh, SkeletonLoader } from '../components/PolishTouches';
import { cn } from '../utils/cn';
import { formatChips } from '../game/gameEngine';
import { GameRoom, GameVariant } from '../types';
import { socketService } from '../services/socket';

const variantConfig: Record<GameVariant, { accent: string; icon: typeof Sparkles; label: string }> = {
  classic: { accent: 'text-[#E8B04A]', icon: Crown, label: 'Classic' },
  joker: { accent: 'text-[#D9B8FF]', icon: Sparkles, label: 'Joker' },
  muflis: { accent: 'text-[#8ED4A5]', icon: Zap, label: 'Muflis' },
  ak47: { accent: 'text-[#F19B79]', icon: Flame, label: 'AK47' },
  hukam: { accent: 'text-[#9AC2FF]', icon: Crown, label: 'Hukam' },
  lowball: { accent: 'text-[#79D6CE]', icon: Zap, label: 'Lowball' },
  best_of_four: { accent: 'text-[#F1D375]', icon: Sparkles, label: 'Best of 4' },
  dealers_choice: { accent: 'text-[#F0A7C4]', icon: Flame, label: "Dealer's" },
};

interface LobbyScreenProps {
  onJoinGame: (room: GameRoom) => Promise<void>;
  onCreateGame: () => void;
  onQuickPlay: () => Promise<void>;
  onJoinByCode: () => void;
  onNavigate: (screen: string) => void;
}

interface LobbyActionProps {
  onCreateGame: () => void;
  onQuickPlay: () => Promise<void>;
  onJoinByCode: () => void;
  onNavigate: (screen: string) => void;
}

function CardFan() {
  return (
    <div className="relative mx-auto h-32 w-44" aria-hidden="true">
      <div className="absolute bottom-1 left-6 h-28 w-20 -rotate-12 rounded-[18px] border border-[#D6CAB3] bg-[#F6ECD8] p-2 text-[#B74035] shadow-[0_14px_32px_rgba(0,0,0,0.28)]">
        <span className="font-display text-2xl font-black">A</span>
        <span className="block text-xl leading-none">♥</span>
      </div>
      <div className="absolute bottom-0 left-[62px] z-10 h-[120px] w-20 rounded-[18px] border border-[#D6CAB3] bg-[#FFF9ED] p-2 text-[#17130E] shadow-[0_16px_34px_rgba(0,0,0,0.34)]">
        <span className="font-display text-2xl font-black">A</span>
        <span className="block text-xl leading-none">♠</span>
      </div>
      <div className="absolute bottom-1 right-4 h-28 w-20 rotate-12 rounded-[18px] border border-[#D6CAB3] bg-[#F6ECD8] p-2 text-[#B74035] shadow-[0_14px_32px_rgba(0,0,0,0.28)]">
        <span className="font-display text-2xl font-black">A</span>
        <span className="block text-xl leading-none">♦</span>
      </div>
    </div>
  );
}

function QuickPlayCard({ onQuickPlay, isPending }: Pick<LobbyActionProps, 'onQuickPlay'> & { isPending: boolean }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={() => void onQuickPlay()}
      disabled={isPending}
      aria-busy={isPending}
      className="group flex w-full items-center gap-3 rounded-[22px] border border-white/10 bg-[#0E1B17] p-4 text-left shadow-[0_14px_30px_rgba(0,0,0,0.16)] transition-colors hover:border-[#E8B04A]/35 disabled:cursor-wait disabled:opacity-55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B04A]"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#F6ECD8] text-[#163E2D]">
        <Play className="h-5 w-5 fill-current" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-[#F6ECD8]">{isPending ? 'Finding a seat…' : 'Quick Play'}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-[#B9C4BE]">Warm up instantly with AI opponents</span>
      </span>
      <ChevronRight className="h-5 w-5 text-[#66736D] transition-transform group-hover:translate-x-0.5" />
    </motion.button>
  );
}

function ReferralCard({ onNavigate }: Pick<LobbyActionProps, 'onNavigate'>) {
  return (
    <button
      type="button"
      onClick={() => onNavigate('referrals')}
      className="group w-full rounded-[22px] border border-[#E8B04A]/25 bg-[#2A1714] p-4 text-left shadow-[0_14px_30px_rgba(0,0,0,0.16)] transition-colors hover:border-[#E8B04A]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B04A]"
    >
      <span className="flex items-start justify-between gap-4">
        <span>
          <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#E8B04A]">
            <Gift className="h-4 w-4" /> Table circle
          </span>
          <span className="mt-2 block font-display text-xl font-bold text-[#F6ECD8]">Bring a friend. You both earn 100 Club Points.</span>
          <span className="mt-1 block text-xs leading-relaxed text-[#C9B9AF]">After their first completed multiplayer game. Club Points unlock cosmetic extras and have no cash value.</span>
        </span>
        <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-[#E8B04A] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </span>
    </button>
  );
}

export function LobbyScreen({ onJoinGame, onCreateGame, onQuickPlay, onJoinByCode, onNavigate }: LobbyScreenProps) {
  const { user } = useAuthStore();
  const { availableRooms, setRooms } = useGameStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVariant, setSelectedVariant] = useState<GameVariant | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const startQuickPlay = useCallback(async () => {
    if (pendingAction) return;
    setPendingAction('quick-play');
    try {
      await onQuickPlay();
    } finally {
      setPendingAction(null);
    }
  }, [onQuickPlay, pendingAction]);

  const joinOpenTable = useCallback(async (room: GameRoom) => {
    if (pendingAction) return;
    setPendingAction(room.id);
    try {
      await onJoinGame(room);
    } finally {
      setPendingAction(null);
    }
  }, [onJoinGame, pendingAction]);

  const loadRooms = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      if (!socketService.isConnected) await socketService.connect();
      const result = await socketService.listRooms();
      setRooms(result.rooms.map(room => ({
        id: room.id,
        name: room.name,
        variant: String(room.variant).toLowerCase() as GameVariant,
        minBuyIn: Number(room.minBuyIn || room.bootAmount || 500),
        maxBuyIn: Number(room.maxBuyIn || 5000),
        minBet: Number(room.bootAmount || 50),
        maxPlayers: Number(room.maxPlayers || 6),
        currentPlayers: Number(room.currentPlayers || 0),
        status: room.status,
        isPrivate: false,
        createdBy: '',
      })));
    } catch {
      if (!silent) setRooms([]);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [setRooms]);

  useEffect(() => {
    void loadRooms();
    const timer = window.setInterval(() => void loadRooms(true), 10_000);
    return () => window.clearInterval(timer);
  }, [loadRooms]);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredRooms = availableRooms.filter((room) => {
    const matchesSearch = room.name.toLowerCase().includes(normalizedQuery);
    const matchesVariant = selectedVariant === 'all' || room.variant === selectedVariant;
    return matchesSearch && matchesVariant;
  });

  return (
    <Layout wide>
      <div className="h-full overflow-y-auto bg-[#07110E] pb-24 lg:pb-8">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between gap-4 py-4 sm:py-5 lg:py-6">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 rotate-[-3deg] place-items-center rounded-xl border border-[#E8B04A]/45 bg-[#2A1714] font-display text-sm font-black text-[#E8B04A] shadow-[0_8px_20px_rgba(0,0,0,0.25)]">TP</div>
              <div>
                <p className="font-display text-lg font-bold leading-tight text-[#F6ECD8]">Teen Patti Social</p>
                <p className="hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7E8D85] sm:block">Private tables for friends</p>
              </div>
            </div>

            <div className="hidden items-center gap-2 lg:flex">
              <button type="button" onClick={() => onNavigate('referrals')} className="rounded-full px-4 py-2 text-sm font-semibold text-[#B9C4BE] transition-colors hover:bg-white/5 hover:text-[#F6ECD8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B04A]">Invite</button>
              <button type="button" onClick={() => onNavigate('profile')} className="flex items-center gap-3 rounded-full border border-white/10 bg-[#0E1B17] py-1.5 pl-2 pr-4 text-left transition-colors hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B04A]">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[#B74035] font-bold text-[#FFF9ED]">{user?.username?.[0]?.toUpperCase() || 'G'}</span>
                <span>
                  <span className="block text-xs font-semibold text-[#F6ECD8]">{user?.username || 'Guest'}</span>
                  <AnimatedChipCount value={user?.chips || 0} prefix="● " className="block text-[11px] font-bold text-[#E8B04A]" />
                </span>
              </button>
              <button type="button" aria-label="Open settings" onClick={() => onNavigate('settings')} className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-[#0E1B17] text-[#B9C4BE] transition-colors hover:text-[#F6ECD8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B04A]">
                <Settings className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 lg:hidden">
              <button type="button" aria-label="Open profile" onClick={() => onNavigate('profile')} className="grid h-10 w-10 place-items-center rounded-full bg-[#B74035] font-bold text-[#FFF9ED] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B04A]">{user?.username?.[0]?.toUpperCase() || 'G'}</button>
              <button type="button" aria-label="Open settings" onClick={() => onNavigate('settings')} className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-[#0E1B17] text-[#B9C4BE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B04A]">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </header>

          <main className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
            <div className="min-w-0">
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-[30px] border border-[#D5B86A]/25 bg-[#163E2D] px-5 py-6 shadow-[0_24px_60px_rgba(0,0,0,0.28)] sm:px-8 sm:py-8 lg:min-h-[342px] lg:px-10 lg:py-9"
              >
                <div className="relative z-10 grid items-center gap-6 sm:grid-cols-[minmax(0,1fr)_190px] lg:grid-cols-[minmax(0,1fr)_220px]">
                  <div>
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#E8B04A]/30 bg-[#0C2C20] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#E8B04A]">
                      <ShieldCheck className="h-3.5 w-3.5" /> Adults 18+ · Social play only
                    </div>
                    <h1 className="max-w-2xl font-display text-[2.35rem] font-black leading-[0.98] tracking-[-0.035em] text-[#FFF9ED] sm:text-5xl lg:text-[3.5rem]">
                      Deal the night.<br />Keep it in the circle.
                    </h1>
                    <p className="mt-4 max-w-xl text-sm leading-6 text-[#C7D3CC] sm:text-base">
                      Open a private Teen Patti table, send one code, and play with people you actually know.
                    </p>
                    <div className="mt-6 grid gap-3 sm:flex">
                      <motion.button type="button" whileTap={{ scale: 0.98 }} onClick={onCreateGame} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#E8B04A] px-5 font-bold text-[#171006] shadow-[0_10px_24px_rgba(232,176,74,0.2)] transition-colors hover:bg-[#F0C268] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFF9ED] focus-visible:ring-offset-2 focus-visible:ring-offset-[#163E2D]">
                        <Plus className="h-5 w-5" /> Create a friend table
                      </motion.button>
                      <motion.button type="button" whileTap={{ scale: 0.98 }} onClick={onJoinByCode} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#F6ECD8]/25 bg-[#0C2C20] px-5 font-bold text-[#F6ECD8] transition-colors hover:border-[#F6ECD8]/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B04A]">
                        <Hash className="h-5 w-5" /> Join with code
                      </motion.button>
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <CardFan />
                    <p className="mt-4 text-center font-display text-sm italic text-[#D8CDAF]">Your table. Your people.</p>
                  </div>
                </div>
              </motion.section>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:hidden">
                <QuickPlayCard onQuickPlay={startQuickPlay} isPending={pendingAction === 'quick-play'} />
                <ReferralCard onNavigate={onNavigate} />
              </div>

              <section className="mt-7" aria-labelledby="tables-heading">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#E8B04A]">Table room</p>
                    <h2 id="tables-heading" className="mt-1 font-display text-2xl font-bold text-[#F6ECD8]">Open tables</h2>
                  </div>
                  <p className="text-xs font-medium text-[#7E8D85]">{availableRooms.length} live</p>
                </div>

                <label className="relative mt-4 block">
                  <span className="sr-only">Search tables</span>
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#66736D]" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search by table name"
                    className="h-12 w-full rounded-2xl border border-white/10 bg-[#0E1B17] pl-11 pr-4 text-sm text-[#F6ECD8] placeholder:text-[#66736D] focus:border-[#E8B04A]/50 focus:outline-none focus:ring-2 focus:ring-[#E8B04A]/25"
                  />
                </label>

                <div className="variant-scroll -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0" aria-label="Filter tables by game variant">
                  <button type="button" aria-pressed={selectedVariant === 'all'} onClick={() => setSelectedVariant('all')} className={cn('whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B04A]', selectedVariant === 'all' ? 'border-[#E8B04A] bg-[#E8B04A] text-[#171006]' : 'border-white/10 bg-[#0E1B17] text-[#94A098] hover:border-white/20')}>All games</button>
                  {(Object.keys(variantConfig) as GameVariant[]).map((variant) => {
                    const config = variantConfig[variant];
                    const Icon = config.icon;
                    const selected = selectedVariant === variant;
                    return (
                      <button key={variant} type="button" aria-pressed={selected} onClick={() => setSelectedVariant(variant)} className={cn('flex items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B04A]', selected ? 'border-[#E8B04A] bg-[#E8B04A] text-[#171006]' : 'border-white/10 bg-[#0E1B17] text-[#94A098] hover:border-white/20')}>
                        <Icon className="h-3.5 w-3.5" /> {config.label}
                      </button>
                    );
                  })}
                </div>

                <PullToRefresh onRefresh={loadRooms} className="mt-2 min-h-[250px]">
                  <div className="space-y-3 pb-2">
                    {isLoading ? (
                      Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="rounded-[22px] border border-white/10 bg-[#0E1B17] p-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-2">
                              <SkeletonLoader variant="text" width="150px" height="16px" />
                              <SkeletonLoader variant="text" width="220px" height="12px" />
                            </div>
                            <SkeletonLoader variant="avatar" width="36px" height="36px" />
                          </div>
                        </div>
                      ))
                    ) : (
                      <AnimatePresence mode="popLayout">
                        {filteredRooms.map((room, index) => {
                          const config = variantConfig[room.variant] || variantConfig.classic;
                          const Icon = config.icon;
                          const isFull = room.currentPlayers >= room.maxPlayers;
                          const isPlaying = room.status === 'playing';
                          const unavailable = isFull || isPlaying;
                          return (
                            <motion.button
                              type="button"
                              key={room.id}
                              layout
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              transition={{ delay: index * 0.04 }}
                              disabled={unavailable || pendingAction !== null}
                              aria-busy={pendingAction === room.id}
                              onClick={() => void joinOpenTable(room)}
                              className="group relative w-full overflow-hidden rounded-[22px] border border-white/10 bg-[#0E1B17] p-4 text-left transition-colors hover:border-[#E8B04A]/30 disabled:cursor-not-allowed disabled:opacity-55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B04A]"
                            >
                              <span className="flex items-start justify-between gap-4">
                                <span className="min-w-0">
                                  <span className="flex items-center gap-2">
                                    <Icon className={cn('h-4 w-4', config.accent)} />
                                    <span className="truncate font-semibold text-[#F6ECD8]">{room.name}</span>
                                  </span>
                                  <span className="mt-2 block text-xs text-[#8C9A92]">{formatChips(room.minBuyIn)}–{formatChips(room.maxBuyIn)} play chips · {formatChips(room.minBet)}-chip boot</span>
                                  <span className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#B9C4BE]">
                                    <Users className="h-3.5 w-3.5" /> {room.currentPlayers}/{room.maxPlayers} seated
                                    <span className="text-[#58645E]">·</span> {config.label}
                                  </span>
                                </span>
                                <span className="flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-[#07110E] px-3 py-2 text-xs font-semibold text-[#B9C4BE]">
                                  {isPlaying ? 'In play' : isFull ? 'Full' : pendingAction === room.id ? 'Joining…' : 'Join'}
                                  {!unavailable && <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />}
                                </span>
                              </span>
                            </motion.button>
                          );
                        })}

                        {filteredRooms.length === 0 && (
                          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-[26px] border border-dashed border-white/15 bg-[#0A1612] px-6 py-10 text-center">
                            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-[#E8B04A]/25 bg-[#2A1714] font-display text-2xl text-[#E8B04A]">♠</div>
                            <h3 className="mt-4 font-display text-xl font-bold text-[#F6ECD8]">No open tables yet</h3>
                            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#7E8D85]">Be the host tonight—open a private table and share the code with your circle.</p>
                            <button type="button" onClick={onCreateGame} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#E8B04A] px-5 text-sm font-bold text-[#171006] transition-colors hover:bg-[#F0C268] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6ECD8]">
                              <Plus className="h-4 w-4" /> Start a table
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </div>
                </PullToRefresh>
              </section>
            </div>

            <aside className="hidden space-y-4 lg:block" aria-label="Player and invite tools">
              <section className="rounded-[26px] border border-white/10 bg-[#0E1B17] p-5 shadow-[0_18px_42px_rgba(0,0,0,0.18)]">
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-[#B74035] text-lg font-bold text-[#FFF9ED]">{user?.username?.[0]?.toUpperCase() || 'G'}</span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[#F6ECD8]">{user?.username || 'Guest'}</p>
                    <p className="mt-0.5 text-xs text-[#7E8D85]">Level {user?.level || 1} · Ready to deal</p>
                  </div>
                  <CircleUserRound className="ml-auto h-5 w-5 text-[#58645E]" />
                </div>
                <div className="mt-4 flex items-end justify-between rounded-2xl border border-white/10 bg-[#07110E] px-4 py-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#66736D]">Club Points balance</p>
                    <AnimatedChipCount value={user?.beliBalance || 0} prefix="✦ " className="mt-1 block text-lg font-bold text-[#E8B04A]" />
                  </div>
                  <span className="text-[10px] text-[#66736D]">No cash value</span>
                </div>
              </section>

              <QuickPlayCard onQuickPlay={startQuickPlay} isPending={pendingAction === 'quick-play'} />
              <ReferralCard onNavigate={onNavigate} />

              <section className="rounded-[26px] border border-white/10 bg-[#0A1612] p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E8B04A]">Tonight's table</p>
                <h2 className="mt-2 font-display text-2xl font-bold text-[#F6ECD8]">Three moves to game night.</h2>
                <ol className="mt-5 space-y-4 text-sm text-[#AAB6AF]">
                  <li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#E8B04A] text-xs font-black text-[#171006]">1</span><span>Create a private friend table.</span></li>
                  <li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[#E8B04A]/35 text-xs font-black text-[#E8B04A]">2</span><span>Share the six-character code.</span></li>
                  <li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[#E8B04A]/35 text-xs font-black text-[#E8B04A]">3</span><span>The deal begins when friends join.</span></li>
                </ol>
              </section>
            </aside>
          </main>
        </div>

        <NavigationBar currentScreen="home" onNavigate={onNavigate} />
      </div>
    </Layout>
  );
}
