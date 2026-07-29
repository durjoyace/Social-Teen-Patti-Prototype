import { motion } from 'framer-motion';
import { Eye, FileText, LogOut, Music, Shield, UserCircle, Vibrate, Volume2 } from 'lucide-react';
import { Layout } from '../components/Layout';
import { NavigationBar } from '../components/NavigationBar';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';

interface SettingsScreenProps {
  onNavigate: (screen: string) => void;
}

export function SettingsScreen({ onNavigate }: SettingsScreenProps) {
  const { user, logout } = useAuthStore();
  const {
    soundEnabled,
    toggleSound,
    musicEnabled,
    toggleMusic,
    hapticsEnabled,
    toggleHaptics,
    reducedMotion,
    toggleReducedMotion,
  } = useUIStore();

  const handleLogout = () => {
    logout();
    onNavigate('login');
  };

  return (
    <Layout>
      <div className="flex h-full flex-col bg-gradient-to-b from-gray-900 via-gray-900 to-black">
        <header className="px-5 pb-3 pt-5">
          <h1 className="text-xl font-bold text-white">Settings</h1>
          <p className="mt-1 text-sm text-white/45">Only controls supported in this release are shown.</p>
        </header>

        <main className="flex-1 space-y-4 overflow-y-auto px-5 pb-28">
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <button
              onClick={() => onNavigate('profile')}
              className="flex min-h-16 w-full items-center gap-3 px-4 text-left"
            >
              <UserCircle className="h-5 w-5 text-[#FFD66B]" />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-white">Account</span>
                <span className="block truncate text-xs text-white/45">{user?.username || 'Guest'}</span>
              </span>
              <span className="text-sm text-white/45">View profile</span>
            </button>
          </section>

          <section aria-label="Play preferences" className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <PreferenceRow icon={Volume2} label="Sound effects" enabled={soundEnabled} onToggle={toggleSound} />
            <PreferenceRow icon={Music} label="Background music" enabled={musicEnabled} onToggle={toggleMusic} />
            <PreferenceRow icon={Vibrate} label="Haptic feedback" enabled={hapticsEnabled} onToggle={toggleHaptics} />
            <PreferenceRow
              icon={Eye}
              label="Reduced motion"
              description="Minimizes non-essential animation"
              enabled={reducedMotion}
              onToggle={toggleReducedMotion}
            />
          </section>

          <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <a href="/legal.html#privacy" className="flex min-h-14 items-center gap-3 border-b border-white/10 px-4 text-white">
              <Shield className="h-5 w-5 text-[#FFD66B]" />
              <span className="flex-1 font-semibold">Privacy & responsible play</span>
            </a>
            <a href="/legal.html#terms" className="flex min-h-14 items-center gap-3 px-4 text-white">
              <FileText className="h-5 w-5 text-[#FFD66B]" />
              <span className="flex-1 font-semibold">Referral terms</span>
            </a>
          </section>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 font-semibold text-red-300"
          >
            <LogOut className="h-5 w-5" /> Sign out
          </motion.button>

          <p className="text-center text-xs text-white/30">Teen Patti Social prelaunch</p>
        </main>

        <NavigationBar currentScreen="profile" onNavigate={onNavigate} />
      </div>
    </Layout>
  );
}

function PreferenceRow({
  icon: Icon,
  label,
  description,
  enabled,
  onToggle,
}: {
  icon: typeof Volume2;
  label: string;
  description?: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex min-h-16 items-center gap-3 border-b border-white/10 px-4 last:border-b-0">
      <Icon className="h-5 w-5 text-white/55" />
      <span className="flex-1">
        <span className="block font-medium text-white">{label}</span>
        {description && <span className="block text-xs text-white/40">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={label}
        onClick={onToggle}
        className={`relative h-7 w-12 rounded-full transition-colors ${enabled ? 'bg-[#176B45]' : 'bg-white/15'}`}
      >
        <span className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}
