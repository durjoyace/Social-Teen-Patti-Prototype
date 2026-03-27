import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Volume2, VolumeX, Music, Vibrate, Bell, BellOff,
  Moon, Sun, Globe, Shield, HelpCircle, LogOut,
  ChevronRight, Eye, Palette, UserCircle, Lock,
  Smartphone, Star, MessageCircle
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { NavigationBar } from '../components/NavigationBar';
import { Layout } from '../components/Layout';
import { cn } from '../utils/cn';

interface SettingsScreenProps {
  onNavigate: (screen: string) => void;
}

export function SettingsScreen({ onNavigate }: SettingsScreenProps) {
  const { user, logout } = useAuthStore();
  const {
    soundEnabled, toggleSound,
    musicEnabled, toggleMusic,
    musicVolume, setMusicVolume,
    sfxVolume, setSfxVolume,
    hapticsEnabled, toggleHaptics,
    notificationsEnabled, toggleNotifications,
    reducedMotion, toggleReducedMotion,
    theme, setTheme,
  } = useUIStore();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  return (
    <Layout>
      <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 via-gray-900 to-black">
        {/* Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="px-4 pt-4 pb-2"
        >
          <h1 className="text-2xl font-bold text-white mb-4">Settings</h1>
        </motion.header>

        {/* Settings list */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
          {/* Account Section */}
          <SettingsSection title="Account">
            <SettingsRow
              icon={<UserCircle className="w-5 h-5" />}
              label="Edit Profile"
              value={user?.username || 'Guest'}
              onClick={() => onNavigate('profile')}
            />
            {user?.isGuest && (
              <SettingsRow
                icon={<Lock className="w-5 h-5" />}
                label="Upgrade Account"
                value="Save your progress"
                onClick={() => {}}
                highlight
              />
            )}
            <SettingsRow
              icon={<Shield className="w-5 h-5" />}
              label="Privacy & Security"
              onClick={() => {}}
            />
          </SettingsSection>

          {/* Sound & Haptics */}
          <SettingsSection title="Sound & Haptics">
            <SettingsToggle
              icon={soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              label="Sound Effects"
              enabled={soundEnabled}
              onToggle={toggleSound}
            />
            {soundEnabled && (
              <SettingsSlider
                label="SFX Volume"
                value={sfxVolume}
                onChange={setSfxVolume}
              />
            )}
            <SettingsToggle
              icon={<Music className="w-5 h-5" />}
              label="Background Music"
              enabled={musicEnabled}
              onToggle={toggleMusic}
            />
            {musicEnabled && (
              <SettingsSlider
                label="Music Volume"
                value={musicVolume}
                onChange={setMusicVolume}
              />
            )}
            <SettingsToggle
              icon={<Vibrate className="w-5 h-5" />}
              label="Haptic Feedback"
              enabled={hapticsEnabled}
              onToggle={toggleHaptics}
            />
          </SettingsSection>

          {/* Notifications */}
          <SettingsSection title="Notifications">
            <SettingsToggle
              icon={notificationsEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
              label="Push Notifications"
              enabled={notificationsEnabled}
              onToggle={toggleNotifications}
            />
          </SettingsSection>

          {/* Display */}
          <SettingsSection title="Display">
            <SettingsRow
              icon={<Palette className="w-5 h-5" />}
              label="Table Theme"
              value={theme.charAt(0).toUpperCase() + theme.slice(1)}
              onClick={() => {}}
            />
            <SettingsToggle
              icon={<Eye className="w-5 h-5" />}
              label="Reduced Motion"
              description="Minimize animations for accessibility"
              enabled={reducedMotion}
              onToggle={toggleReducedMotion}
            />
          </SettingsSection>

          {/* Game Settings */}
          <SettingsSection title="Game">
            <SettingsRow
              icon={<Globe className="w-5 h-5" />}
              label="Language"
              value="English"
              onClick={() => {}}
            />
            <SettingsRow
              icon={<Smartphone className="w-5 h-5" />}
              label="Auto-fold on Disconnect"
              value="30 seconds"
              onClick={() => {}}
            />
          </SettingsSection>

          {/* Support */}
          <SettingsSection title="Support">
            <SettingsRow
              icon={<HelpCircle className="w-5 h-5" />}
              label="Help & FAQ"
              onClick={() => {}}
            />
            <SettingsRow
              icon={<MessageCircle className="w-5 h-5" />}
              label="Contact Support"
              onClick={() => {}}
            />
            <SettingsRow
              icon={<Star className="w-5 h-5" />}
              label="Rate the App"
              onClick={() => {}}
            />
          </SettingsSection>

          {/* Logout */}
          <div className="pb-8">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-red-500/10 text-red-400 font-medium border border-red-500/20"
            >
              <LogOut className="w-5 h-5" />
              Log Out
            </motion.button>

            <p className="text-center text-white/30 text-xs mt-4">
              Teen Patti Social v1.0.0
            </p>
          </div>
        </div>

        <NavigationBar currentScreen="profile" onNavigate={onNavigate} />

        {/* Logout confirmation */}
        {showLogoutConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="fixed inset-0 bg-black/80 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] max-w-xs bg-gray-900 rounded-2xl border border-white/10 p-6 z-50"
            >
              <h3 className="text-white font-bold text-lg mb-2">Log Out?</h3>
              <p className="text-white/60 text-sm mb-4">
                {user?.isGuest
                  ? 'As a guest, you will lose all progress. Consider upgrading your account first.'
                  : 'You can always log back in.'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { logout(); onNavigate('home'); }}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold"
                >
                  Log Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </Layout>
  );
}

// ─── Settings Components ───────────────────────────────────────────────────

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs text-white/40 uppercase tracking-wider font-medium mb-2 px-1">{title}</h3>
      <div className="rounded-2xl bg-white/5 border border-white/5 divide-y divide-white/5 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function SettingsRow({
  icon,
  label,
  value,
  onClick,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onClick?: () => void;
  highlight?: boolean;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
    >
      <span className={cn('flex-shrink-0', highlight ? 'text-yellow-400' : 'text-white/50')}>
        {icon}
      </span>
      <span className={cn('flex-1 text-sm font-medium', highlight ? 'text-yellow-400' : 'text-white')}>
        {label}
      </span>
      {value && (
        <span className="text-sm text-white/40 mr-1">{value}</span>
      )}
      <ChevronRight className="w-4 h-4 text-white/20 flex-shrink-0" />
    </motion.button>
  );
}

function SettingsToggle({
  icon,
  label,
  description,
  enabled,
  onToggle,
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className="text-white/50 flex-shrink-0">{icon}</span>
      <div className="flex-1">
        <span className="text-white text-sm font-medium">{label}</span>
        {description && <p className="text-white/40 text-xs mt-0.5">{description}</p>}
      </div>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onToggle}
        className={cn(
          'relative w-12 h-7 rounded-full transition-colors flex-shrink-0',
          enabled ? 'bg-green-500' : 'bg-white/20'
        )}
      >
        <motion.div
          className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm"
          animate={{ left: enabled ? 24 : 4 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </motion.button>
    </div>
  );
}

function SettingsSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="px-4 py-2 pl-12">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-white/40">{label}</span>
        <span className="text-xs text-white/40">{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-yellow-500"
      />
    </div>
  );
}
