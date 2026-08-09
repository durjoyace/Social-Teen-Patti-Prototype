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
      <div className="flex h-full flex-col bg-[#07110E] text-[#F6ECD8]">
        <header className="px-5 pb-4 pt-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E8B04A]">Your table</p>
          <h1 className="mt-1 font-display text-3xl font-black text-[#FFF9ED]">Settings</h1>
          <p className="mt-1 text-sm text-[#7E8D85]">Sound, comfort, account, and responsible-play controls.</p>
        </header>

        <main className="flex-1 space-y-4 overflow-y-auto px-5 pb-28">
          <section className="overflow-hidden rounded-[22px] border border-white/10 bg-[#0E1B17]">
            <button
              type="button"
              onClick={() => onNavigate('profile')}
              className="flex min-h-16 w-full items-center gap-3 px-4 text-left"
            >
              <UserCircle className="h-5 w-5 text-[#E8B04A]" />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-[#F6ECD8]">Account</span>
                <span className="block truncate text-xs text-[#66736D]">{user?.username || 'Guest'}</span>
              </span>
              <span className="text-sm text-[#8E9C94]">View profile</span>
            </button>
          </section>

          <section aria-label="Play preferences" className="overflow-hidden rounded-[22px] border border-white/10 bg-[#0E1B17]">
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

          <section className="overflow-hidden rounded-[22px] border border-white/10 bg-[#0E1B17]">
            <a href="/legal.html#privacy" className="flex min-h-14 items-center gap-3 border-b border-white/10 px-4 text-[#F6ECD8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#E8B04A]">
              <Shield className="h-5 w-5 text-[#E8B04A]" />
              <span className="flex-1 font-semibold">Privacy & responsible play</span>
            </a>
            <a href="/legal.html#terms" className="flex min-h-14 items-center gap-3 px-4 text-[#F6ECD8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#E8B04A]">
              <FileText className="h-5 w-5 text-[#E8B04A]" />
              <span className="flex-1 font-semibold">Referral terms</span>
            </a>
          </section>

          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="flex min-h-14 w-full items-center justify-center gap-2 rounded-[22px] border border-[#B74035]/30 bg-[#2A1714] font-semibold text-[#F2B1A9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B74035]"
          >
            <LogOut className="h-5 w-5" /> Sign out
          </motion.button>

          <section className="rounded-[22px] border border-[#B74035]/25 bg-[#1A1210] p-4">
            <button
              type="button"
              onClick={() => setShowDelete(value => !value)}
              className="flex min-h-10 w-full items-center gap-3 text-left text-[#F2B1A9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B74035]"
            >
              <Trash2 className="h-5 w-5" />
              <span className="flex-1 font-semibold">Delete account</span>
              <span className="text-xs text-red-200/60">Permanent</span>
            </button>

            {showDelete && (
              <div className="mt-4 space-y-3 border-t border-red-500/15 pt-4">
                <p className="text-sm leading-6 text-[#A99B94]">
                  Your profile and social content will be removed. Auditable game, referral, and transaction records are retained without your profile identifiers.
                </p>
                <label className="block text-xs font-semibold uppercase tracking-wider text-white/50">
                  Type DELETE to confirm
                  <input
                    value={confirmation}
                    onChange={event => setConfirmation(event.target.value)}
                    autoComplete="off"
                    className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-[#07110E] px-3 text-base normal-case tracking-normal text-[#F6ECD8] outline-none focus:border-[#B74035] focus:ring-2 focus:ring-[#B74035]/20"
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
                      className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-[#07110E] px-3 text-base normal-case tracking-normal text-[#F6ECD8] outline-none focus:border-[#B74035] focus:ring-2 focus:ring-[#B74035]/20"
                    />
                  </label>
                )}
                {deleteError && <p role="alert" className="text-sm text-[#F2B1A9]">{deleteError}</p>}
                <button
                  type="button"
                  disabled={confirmation !== 'DELETE' || (!user?.isGuest && !password) || isDeleting}
                  onClick={() => void handleDeleteAccount()}
                  className="min-h-12 w-full rounded-xl bg-[#B74035] px-4 font-bold text-white disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2B1A9]"
                >
                  {isDeleting ? 'Deleting…' : 'Permanently delete account'}
                </button>
              </div>
            )}
          </section>

          <p className="text-center text-xs text-[#58645E]">Teen Patti Social · Adults 18+ · Social play only</p>
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
      <Icon className="h-5 w-5 text-[#8E9C94]" />
      <span className="flex-1">
        <span className="block font-medium text-[#F6ECD8]">{label}</span>
        {description && <span className="block text-xs text-[#66736D]">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={label}
        onClick={onToggle}
        className={`relative h-7 w-12 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B04A] ${enabled ? 'bg-[#E8B04A]' : 'bg-white/15'}`}
      >
        <span className={`absolute left-1 top-1 h-5 w-5 rounded-full ${enabled ? 'bg-[#171006]' : 'bg-white'} transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}
