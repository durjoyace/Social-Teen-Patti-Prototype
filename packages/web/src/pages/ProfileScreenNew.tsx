import { motion } from 'framer-motion';
import { ArrowUpRight, Gift, LogOut, Target, TrendingUp, Trophy } from 'lucide-react';
import { Layout } from '../components/Layout';
import { NavigationBar } from '../components/NavigationBar';
import { useAuthStore } from '../stores/authStore';
import { formatChips } from '../game/gameEngine';

interface ProfileScreenProps {
  onNavigate: (screen: string) => void;
}

export function ProfileScreenNew({ onNavigate }: ProfileScreenProps) {
  const { user, logout } = useAuthStore();
  const games = user?.totalGames || 0;
  const wins = user?.gamesWon || 0;
  const stats = [
    { label: 'Games', value: games, icon: Target },
    { label: 'Wins', value: wins, icon: Trophy },
    { label: 'Win rate', value: games ? `${Math.round((wins / games) * 100)}%` : '0%', icon: TrendingUp },
  ];

  return (
    <Layout>
      <div className="flex h-full flex-col bg-[#07110E] text-[#F6ECD8]">
        <header className="px-5 pb-4 pt-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E8B04A]">Your seat</p>
          <h1 className="mt-1 font-display text-3xl font-black text-[#FFF9ED]">Player profile</h1>
        </header>

        <div className="flex-1 overflow-y-auto px-5 pb-28">
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[28px] border border-[#D5B86A]/20 bg-[#163E2D] p-5 shadow-[0_22px_50px_rgba(0,0,0,0.24)] sm:p-6">
            <div className="flex items-center gap-4">
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full border-4 border-[#E8B04A]/25 bg-[#B74035] font-display text-3xl font-black text-[#FFF9ED]">
                {user?.username?.[0]?.toUpperCase() || 'G'}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-display text-2xl font-bold text-[#FFF9ED]">{user?.username || 'Guest'}</h2>
                <p className="mt-0.5 truncate text-sm text-[#A9B9B0]">{user?.email || 'Guest account on this device'}</p>
                <span className="mt-2 inline-flex rounded-full border border-[#E8B04A]/25 bg-[#0C2C20] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#E8B04A]">Level {user?.level || 1}</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-[#0C2C20] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7E8D85]">Play chips</p>
                <p className="mt-1 text-xl font-black text-[#F6ECD8]">● {formatChips(user?.chips || 0)}</p>
              </div>
              <div className="rounded-2xl border border-[#E8B04A]/20 bg-[#2A1714] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#A98768]">Club Points</p>
                <p className="mt-1 text-xl font-black text-[#E8B04A]">{(user?.beliBalance || 0).toLocaleString('en-IN')}</p>
              </div>
            </div>
          </motion.section>

          <section className="mt-4 grid grid-cols-3 gap-2" aria-label="Player statistics">
            {stats.map(stat => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="rounded-[20px] border border-white/10 bg-[#0E1B17] p-3 text-center">
                  <Icon className="mx-auto h-5 w-5 text-[#E8B04A]" />
                  <p className="mt-2 font-display text-xl font-bold text-[#F6ECD8]">{stat.value}</p>
                  <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#66736D]">{stat.label}</p>
                </div>
              );
            })}
          </section>

          <button type="button" onClick={() => onNavigate('referrals')} className="group mt-4 flex min-h-[76px] w-full items-center gap-3 rounded-[22px] border border-[#E8B04A]/25 bg-[#2A1714] px-4 text-left transition-colors hover:border-[#E8B04A]/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B04A]">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#E8B04A] text-[#171006]"><Gift className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-lg font-bold text-[#FFF9ED]">Your table-circle extras</span>
              <span className="mt-0.5 block text-xs leading-5 text-[#A98768]">Invite friends and unlock earned profile touches.</span>
            </span>
            <ArrowUpRight className="h-5 w-5 shrink-0 text-[#E8B04A] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </button>

          <div className="mt-4 rounded-[22px] border border-white/10 bg-[#0E1B17] p-4">
            <p className="text-sm leading-6 text-[#8E9C94]">Club Points and play chips have no cash value and cannot be bought, transferred, wagered, or cashed out.</p>
          </div>

          <button type="button" onClick={() => { logout(); onNavigate('login'); }} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#0E1B17] font-semibold text-[#A9B9B0] hover:text-[#F6ECD8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B04A]">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>

        <NavigationBar currentScreen="profile" onNavigate={onNavigate} />
      </div>
    </Layout>
  );
}
