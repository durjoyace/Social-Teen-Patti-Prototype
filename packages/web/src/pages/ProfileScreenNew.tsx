import { motion } from 'framer-motion';
import { Gift, LogOut, Target, TrendingUp, Trophy } from 'lucide-react';
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
      <div className="flex h-full flex-col bg-gradient-to-b from-gray-900 via-gray-900 to-black">
        <header className="px-5 pb-3 pt-5">
          <h1 className="text-xl font-bold text-white">Profile</h1>
        </header>

        <div className="flex-1 overflow-y-auto px-5 pb-28">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-white/10 bg-[#111B2E] p-6"
          >
            <div className="flex items-center gap-4">
              <div className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-[#D94841] to-[#7f1d1d] text-3xl font-black text-white ring-4 ring-[#FFD66B]/30">
                {user?.username?.[0]?.toUpperCase() || 'G'}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-xl font-bold text-white">{user?.username || 'Guest'}</h2>
                <p className="truncate text-sm text-white/50">{user?.email || 'Guest account'}</p>
                <p className="mt-2 text-xs font-bold uppercase tracking-wider text-[#FFD66B]">Level {user?.level || 1}</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-black/25 p-4">
                <p className="text-xs text-white/45">Play chips</p>
                <p className="mt-1 text-xl font-black text-white">◉ {formatChips(user?.chips || 0)}</p>
              </div>
              <div className="rounded-2xl bg-black/25 p-4">
                <p className="text-xs text-white/45">Beli</p>
                <p className="mt-1 text-xl font-black text-[#FFD66B]">{(user?.beliBalance || 0).toLocaleString('en-IN')}</p>
              </div>
            </div>
          </motion.section>

          <section className="mt-4 grid grid-cols-3 gap-2">
            {stats.map(stat => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
                  <Icon className="mx-auto h-5 w-5 text-[#FFD66B]" />
                  <p className="mt-2 font-bold text-white">{stat.value}</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wide text-white/40">{stat.label}</p>
                </div>
              );
            })}
          </section>

          <button
            onClick={() => onNavigate('referrals')}
            className="mt-4 flex min-h-16 w-full items-center gap-3 rounded-2xl border border-[#FFD66B]/25 bg-[#176B45] px-4 text-left"
          >
            <Gift className="h-6 w-6 text-[#FFD66B]" />
            <span className="flex-1">
              <span className="block font-bold text-white">Your Beli extras</span>
              <span className="block text-xs text-white/55">View earned frames, reactions, themes, and titles</span>
            </span>
            <span className="font-bold text-[#FFD66B]">View</span>
          </button>

          <button
            onClick={() => { logout(); onNavigate('login'); }}
            className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white/10 font-semibold text-white/70"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>

        <NavigationBar currentScreen="profile" onNavigate={onNavigate} />
      </div>
    </Layout>
  );
}
