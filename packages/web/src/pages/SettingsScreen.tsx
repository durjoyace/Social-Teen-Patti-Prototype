import { motion } from 'framer-motion';
import { useState } from 'react';
import { Eye, FileText, LogOut, Music, Shield, Trash2, UserCircle, Vibrate, Volume2 } from 'lucide-react';
import { Layout } from '../components/Layout';
import { NavigationBar } from '../components/NavigationBar';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { api } from '../services/api';

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
  const [showDelete, setShowDelete] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [password, setPassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLogout = () => {
    logout();
    onNavigate('login');
  };

  const handleDeleteAccount = async () => {
    if (confirmation !== 'DELETE' || isDeleting) return;
    setDeleteError('');
    setIsDeleting(true);
    try {
      await api.deleteAccount(confirmation, user?.isGuest ? undefined : password);
      logout();
      onNavigate('login');
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Could not delete account');
      setIsDeleting(false);
    }
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

          <section className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
            <button
              type="button"
              onClick={() => setShowDelete(value => !value)}
              className="flex min-h-10 w-full items-center gap-3 text-left text-red-300"
            >
              <Trash2 className="h-5 w-5" />
              <span className="flex-1 font-semibold">Delete account</span>
              <span className="text-xs text-red-200/60">Permanent</span>
            </button>

            {showDelete && (
              <div className="mt-4 space-y-3 border-t border-red-500/15 pt-4">
                <p className="text-sm leading-6 text-white/65">
                  Your profile and social content will be removed. Auditable game, referral, and transaction records are retained without your profile identifiers.
                </p>
                <label className="block text-xs font-semibold uppercase tracking-wider text-white/50">
                  Type DELETE to confirm
                  <input
                    value={confirmation}
                    onChange={event => setConfirmation(event.target.value)}
                    autoComplete="off"
                    className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-base normal-case tracking-normal text-white outline-none focus:border-red-400"
                  />
                </label>
                {!user?.isGuest && (
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white/50">
                    Current password
                    <input
                      type="password"
                      value={password}
                      onChange={event => setPassword(event.target.value)}
                      autoComplete="current-password"
                      className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-base normal-case tracking-normal text-white outline-none focus:border-red-400"
                    />
                  </label>
                )}
                {deleteError && <p role="alert" className="text-sm text-red-300">{deleteError}</p>}
                <button
                  type="button"
                  disabled={confirmation !== 'DELETE' || (!user?.isGuest && !password) || isDeleting}
                  onClick={() => void handleDeleteAccount()}
                  className="min-h-12 w-full rounded-xl bg-red-600 px-4 font-bold text-white disabled:cursor-not-allowed disabled:opacity-35"
                >
                  {isDeleting ? 'Deleting…' : 'Permanently delete account'}
                </button>
              </div>
            )}
          </section>

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
