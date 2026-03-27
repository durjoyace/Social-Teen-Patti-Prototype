import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Smartphone, Mail, Lock, User, Eye, EyeOff,
  ChevronRight, ArrowLeft, Sparkles
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { cn } from '../utils/cn';

interface LoginScreenProps {
  onComplete: () => void;
  onGuestPlay: () => void;
}

type AuthMode = 'welcome' | 'login' | 'register' | 'phone';

export function LoginScreen({ onComplete, onGuestPlay }: LoginScreenProps) {
  const [mode, setMode] = useState<AuthMode>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const { loginWithCredentials, register, loginAsGuest, isLoading, error, clearError } = useAuthStore();

  const handleLogin = async () => {
    await loginWithCredentials(email, password);
    if (!useAuthStore.getState().error) onComplete();
  };

  const handleRegister = async () => {
    await register(username, email, password);
    if (!useAuthStore.getState().error) onComplete();
  };

  const handleGuestPlay = async () => {
    await loginAsGuest();
    onGuestPlay();
  };

  const handleSendOTP = () => {
    if (phone.length >= 10) {
      setOtpSent(true);
      // In production: api.sendOTP(phone)
    }
  };

  const handleVerifyOTP = () => {
    // In production: api.verifyOTP(phone, otp)
    onComplete();
  };

  const handleGoogleLogin = () => {
    // In production: redirect to Google OAuth
    // window.location.href = `${API_URL}/auth/google`;
  };

  return (
    <div className="h-full w-full bg-gradient-to-b from-[#1a0a0a] via-[#2C0E0E] to-[#1a0a0a] flex flex-col relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col px-6">
        {/* Back button */}
        {mode !== 'welcome' && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => { setMode('welcome'); clearError(); }}
            className="self-start mt-6 p-2 rounded-xl bg-white/10 text-white/60"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
        )}

        {/* Logo area */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={cn(
            'flex flex-col items-center',
            mode === 'welcome' ? 'mt-20 mb-8' : 'mt-6 mb-6'
          )}
        >
          <motion.div
            animate={{ scale: mode === 'welcome' ? 1 : 0.7 }}
            className="w-20 h-20 rounded-3xl bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center shadow-xl shadow-red-500/30 mb-3"
          >
            <span className="text-3xl font-bold text-yellow-400">TP</span>
          </motion.div>
          <h1 className="text-2xl font-bold text-yellow-400">Teen Patti Social</h1>
          {mode === 'welcome' && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-white/40 text-sm mt-1"
            >
              The only provably fair card game
            </motion.p>
          )}
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {mode === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col gap-3"
            >
              {/* Google Login */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleGoogleLogin}
                className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl bg-white text-gray-900 font-semibold shadow-lg"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
                <ChevronRight className="w-4 h-4 ml-auto text-gray-400" />
              </motion.button>

              {/* Phone Login */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setMode('phone')}
                className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl bg-blue-600 text-white font-semibold shadow-lg shadow-blue-500/30"
              >
                <Smartphone className="w-5 h-5" />
                <span>Continue with Phone</span>
                <ChevronRight className="w-4 h-4 ml-auto text-white/40" />
              </motion.button>

              {/* Email Login */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setMode('login')}
                className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl bg-white/10 text-white font-semibold border border-white/10"
              >
                <Mail className="w-5 h-5 text-white/60" />
                <span>Continue with Email</span>
                <ChevronRight className="w-4 h-4 ml-auto text-white/30" />
              </motion.button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-white/30 text-xs">or</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Guest Play */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleGuestPlay}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-5 py-4 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold shadow-lg shadow-orange-500/30"
              >
                <Sparkles className="w-5 h-5" />
                <span>Play as Guest</span>
              </motion.button>
              <p className="text-center text-white/30 text-xs">
                No signup required • Get ₹10,000 free chips
              </p>
            </motion.div>
          )}

          {mode === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col gap-4"
            >
              <h2 className="text-xl font-bold text-white mb-2">Welcome Back</h2>

              <InputField
                icon={<Mail className="w-5 h-5" />}
                placeholder="Email or username"
                value={email}
                onChange={setEmail}
                type="email"
              />
              <InputField
                icon={<Lock className="w-5 h-5" />}
                placeholder="Password"
                value={password}
                onChange={setPassword}
                type={showPassword ? 'text' : 'password'}
                rightElement={
                  <button onClick={() => setShowPassword(!showPassword)} className="text-white/30">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              {error && (
                <p className="text-red-400 text-sm text-center">{error}</p>
              )}

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleLogin}
                disabled={isLoading || !email || !password}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 text-white font-bold shadow-lg shadow-red-500/30 disabled:opacity-50"
              >
                {isLoading ? 'Logging in...' : 'Log In'}
              </motion.button>

              <button
                onClick={() => { setMode('register'); clearError(); }}
                className="text-center text-yellow-400 text-sm font-medium mt-2"
              >
                Don't have an account? Sign Up
              </button>
            </motion.div>
          )}

          {mode === 'register' && (
            <motion.div
              key="register"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col gap-4"
            >
              <h2 className="text-xl font-bold text-white mb-2">Create Account</h2>

              <InputField
                icon={<User className="w-5 h-5" />}
                placeholder="Username"
                value={username}
                onChange={setUsername}
              />
              <InputField
                icon={<Mail className="w-5 h-5" />}
                placeholder="Email"
                value={email}
                onChange={setEmail}
                type="email"
              />
              <InputField
                icon={<Lock className="w-5 h-5" />}
                placeholder="Password (6+ characters)"
                value={password}
                onChange={setPassword}
                type={showPassword ? 'text' : 'password'}
                rightElement={
                  <button onClick={() => setShowPassword(!showPassword)} className="text-white/30">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              {error && (
                <p className="text-red-400 text-sm text-center">{error}</p>
              )}

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleRegister}
                disabled={isLoading || !username || !email || !password}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold shadow-lg shadow-green-500/30 disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Create Account'}
              </motion.button>

              <button
                onClick={() => { setMode('login'); clearError(); }}
                className="text-center text-yellow-400 text-sm font-medium mt-2"
              >
                Already have an account? Log In
              </button>
            </motion.div>
          )}

          {mode === 'phone' && (
            <motion.div
              key="phone"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col gap-4"
            >
              <h2 className="text-xl font-bold text-white mb-2">Phone Login</h2>

              {!otpSent ? (
                <>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1 px-3 py-3.5 rounded-xl bg-white/10 border border-white/10 text-white">
                      <span className="text-sm">🇮🇳</span>
                      <span className="text-sm font-medium">+91</span>
                    </div>
                    <InputField
                      icon={<Smartphone className="w-5 h-5" />}
                      placeholder="Phone number"
                      value={phone}
                      onChange={setPhone}
                      type="tel"
                      className="flex-1"
                    />
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSendOTP}
                    disabled={phone.length < 10}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold shadow-lg shadow-blue-500/30 disabled:opacity-50"
                  >
                    Send OTP
                  </motion.button>
                </>
              ) : (
                <>
                  <p className="text-white/50 text-sm">Enter the 6-digit OTP sent to +91 {phone}</p>
                  <input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full bg-white/10 rounded-xl px-4 py-4 text-white text-center text-2xl tracking-[0.5em] font-mono placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 border border-white/10"
                    maxLength={6}
                    autoFocus
                  />

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleVerifyOTP}
                    disabled={otp.length !== 6}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold shadow-lg shadow-green-500/30 disabled:opacity-50"
                  >
                    Verify OTP
                  </motion.button>

                  <button
                    onClick={() => setOtpSent(false)}
                    className="text-center text-white/40 text-sm"
                  >
                    Change number
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="py-6 text-center">
          <p className="text-white/20 text-[10px]">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Input Field ───────────────────────────────────────────────────────────

function InputField({
  icon,
  placeholder,
  value,
  onChange,
  type = 'text',
  rightElement,
  className,
}: {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  rightElement?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
        {icon}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/10 rounded-xl pl-12 pr-12 py-3.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 border border-white/10 text-sm"
      />
      {rightElement && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          {rightElement}
        </div>
      )}
    </div>
  );
}
