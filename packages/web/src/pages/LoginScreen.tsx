import { FormEvent, ReactNode, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, Lock, Mail, ShieldCheck, User } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { analytics } from '../services/analytics';

interface LoginScreenProps {
  onComplete: () => void;
  onGuestPlay: () => void;
}

type AuthMode = 'welcome' | 'login' | 'register';

function TableCards() {
  return (
    <div className="relative h-32 w-48" aria-hidden="true">
      <div className="absolute bottom-0 left-4 h-28 w-20 -rotate-12 rounded-[18px] border border-[#D7CBB5] bg-[#F6ECD8] p-2 text-[#B74035] shadow-[0_20px_45px_rgba(0,0,0,0.3)]">
        <span className="font-display text-2xl font-black">A</span><span className="block text-xl">♥</span>
      </div>
      <div className="absolute bottom-1 left-16 z-10 h-[124px] w-20 rounded-[18px] border border-[#D7CBB5] bg-[#FFF9ED] p-2 text-[#17130E] shadow-[0_22px_48px_rgba(0,0,0,0.36)]">
        <span className="font-display text-2xl font-black">A</span><span className="block text-xl">♠</span>
      </div>
      <div className="absolute bottom-0 right-3 h-28 w-20 rotate-12 rounded-[18px] border border-[#D7CBB5] bg-[#F6ECD8] p-2 text-[#B74035] shadow-[0_20px_45px_rgba(0,0,0,0.3)]">
        <span className="font-display text-2xl font-black">A</span><span className="block text-xl">♦</span>
      </div>
    </div>
  );
}

export function LoginScreen({ onComplete, onGuestPlay }: LoginScreenProps) {
  const [mode, setMode] = useState<AuthMode>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAdult, setIsAdult] = useState(false);
  const { loginWithCredentials, register, loginAsGuest, isLoading, error, clearError } = useAuthStore();

  const changeMode = (nextMode: AuthMode) => {
    clearError();
    setMode(nextMode);
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    analytics.authStarted('login');
    await loginWithCredentials(email, password);
    if (!useAuthStore.getState().error) onComplete();
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    analytics.authStarted('register');
    await register(username, email, password);
    if (!useAuthStore.getState().error) onComplete();
  };

  const handleGuestPlay = async () => {
    analytics.authStarted('guest');
    await loginAsGuest();
    if (!useAuthStore.getState().error) onGuestPlay();
  };

  return (
    <main className="h-full overflow-y-auto bg-[#07110E] text-[#F6ECD8]">
      <div className="mx-auto grid min-h-full w-full max-w-6xl lg:grid-cols-[minmax(0,1.05fr)_minmax(390px,0.75fr)]">
        <section className="relative hidden overflow-hidden border-r border-white/10 bg-[#163E2D] px-12 py-10 lg:flex lg:flex-col lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 rotate-[-3deg] place-items-center rounded-xl border border-[#E8B04A]/45 bg-[#2A1714] font-display text-sm font-black text-[#E8B04A]">TP</div>
            <div>
              <p className="font-display text-xl font-bold">Teen Patti Social</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A9B9B0]">Private tables for friends</p>
            </div>
          </div>

          <div className="py-10">
            <TableCards />
            <h1 className="mt-8 max-w-xl font-display text-6xl font-black leading-[0.95] tracking-[-0.04em] text-[#FFF9ED]">
              The group chat has a table now.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-[#C7D3CC]">
              Create one private room, share one code, and deal with the people you already know.
            </p>
          </div>

          <div className="flex items-center gap-3 border-t border-white/10 pt-5 text-xs text-[#A9B9B0]">
            <ShieldCheck className="h-4 w-4 text-[#E8B04A]" />
            Adults 18+ · Social play only · No cash value
          </div>
        </section>

        <section className="flex min-h-full flex-col px-5 py-5 sm:px-8 lg:px-10 lg:py-10">
          <div className="flex items-center justify-between lg:hidden">
            <div className="flex items-center gap-2.5">
              <div className="grid h-10 w-10 rotate-[-3deg] place-items-center rounded-xl border border-[#E8B04A]/45 bg-[#2A1714] font-display text-xs font-black text-[#E8B04A]">TP</div>
              <p className="font-display text-lg font-bold">Teen Patti Social</p>
            </div>
            <span className="rounded-full border border-[#E8B04A]/25 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-[#E8B04A]">18+ only</span>
          </div>

          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8 sm:py-12">
            <AnimatePresence mode="wait">
              {mode === 'welcome' ? (
                <motion.div key="welcome" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                  <div className="lg:hidden">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E8B04A]">Your table is one invite away</p>
                    <h1 className="mt-2 font-display text-[2.6rem] font-black leading-[0.98] tracking-[-0.035em] text-[#FFF9ED]">Deal with your people.</h1>
                    <p className="mt-3 text-sm leading-6 text-[#8E9C94]">Private friend tables, built for the group chat.</p>
                  </div>

                  <div className="mt-8 rounded-[28px] border border-white/10 bg-[#0E1B17] p-5 shadow-[0_24px_55px_rgba(0,0,0,0.24)] sm:p-6 lg:mt-0">
                    <p className="hidden text-[10px] font-bold uppercase tracking-[0.2em] text-[#E8B04A] lg:block">Enter the clubhouse</p>
                    <h2 className="mt-1 hidden font-display text-3xl font-bold text-[#FFF9ED] lg:block">Ready when your friends are.</h2>

                    <label className="mt-1 flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-[#07110E] px-4 py-4 text-sm leading-5 text-[#C7D3CC] lg:mt-6">
                      <input
                        type="checkbox"
                        checked={isAdult}
                        onChange={(event) => setIsAdult(event.target.checked)}
                        className="mt-0.5 h-5 w-5 shrink-0 accent-[#E8B04A]"
                      />
                      <span><strong className="font-semibold text-[#F6ECD8]">I am 18 or older.</strong><span className="mt-0.5 block text-xs text-[#7E8D85]">Club Points and play chips cannot be bought, wagered, or cashed out.</span></span>
                    </label>

                    <button
                      type="button"
                      onClick={() => void handleGuestPlay()}
                      disabled={!isAdult || isLoading}
                      className="mt-4 min-h-[52px] w-full rounded-2xl bg-[#E8B04A] px-5 py-3.5 font-bold text-[#171006] transition-colors hover:bg-[#F0C268] disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFF9ED]"
                    >
                      {isLoading ? 'Preparing your seat…' : 'Play as guest'}
                    </button>
                    <button
                      type="button"
                      onClick={() => changeMode('login')}
                      disabled={!isAdult}
                      className="mt-3 min-h-[52px] w-full rounded-2xl border border-white/15 bg-[#14231E] px-5 py-3.5 font-semibold text-[#F6ECD8] transition-colors hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B04A]"
                    >
                      Sign in
                    </button>
                    <button type="button" onClick={() => changeMode('register')} disabled={!isAdult} className="mt-4 w-full text-sm font-semibold text-[#E8B04A] disabled:cursor-not-allowed disabled:opacity-35">
                      New here? Create an account
                    </button>

                    {error && <p role="alert" className="mt-4 rounded-xl border border-[#B74035]/30 bg-[#2A1714] px-3 py-2 text-sm text-[#F2B1A9]">{error}</p>}
                  </div>
                </motion.div>
              ) : (
                <motion.div key={mode} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                  <button type="button" onClick={() => changeMode('welcome')} className="inline-flex min-h-11 items-center gap-2 rounded-full px-2 text-sm font-semibold text-[#A9B9B0] hover:text-[#F6ECD8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B04A]">
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                  <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-[#E8B04A]">{mode === 'login' ? 'Welcome back' : 'Save your seat'}</p>
                  <h1 className="mt-1 font-display text-4xl font-black tracking-[-0.03em] text-[#FFF9ED]">{mode === 'login' ? 'Return to your table.' : 'Create your account.'}</h1>
                  <p className="mt-2 text-sm leading-6 text-[#7E8D85]">{mode === 'login' ? 'Use your email or username.' : 'Keep your profile and progress across devices.'}</p>

                  <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="mt-7 space-y-4">
                    {mode === 'register' && (
                      <InputField label="Username" icon={<User className="h-5 w-5" />} value={username} onChange={setUsername} autoComplete="username" />
                    )}
                    <InputField label={mode === 'login' ? 'Email or username' : 'Email'} icon={<Mail className="h-5 w-5" />} value={email} onChange={setEmail} type={mode === 'login' ? 'text' : 'email'} autoComplete={mode === 'login' ? 'username' : 'email'} />
                    <InputField
                      label={mode === 'register' ? 'Password (12+ characters)' : 'Password'}
                      icon={<Lock className="h-5 w-5" />}
                      value={password}
                      onChange={setPassword}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      trailing={
                        <button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="grid h-9 w-9 place-items-center rounded-full text-[#7E8D85] hover:bg-white/5 hover:text-[#F6ECD8]">
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      }
                    />
                    {error && <p role="alert" className="rounded-xl border border-[#B74035]/30 bg-[#2A1714] px-3 py-2 text-sm text-[#F2B1A9]">{error}</p>}
                    <button
                      type="submit"
                      disabled={isLoading || !email || !password || (mode === 'register' && (username.length < 3 || password.length < 12))}
                      className="min-h-[52px] w-full rounded-2xl bg-[#E8B04A] px-5 py-3.5 font-bold text-[#171006] transition-colors hover:bg-[#F0C268] disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFF9ED]"
                    >
                      {isLoading ? (mode === 'login' ? 'Signing in…' : 'Creating account…') : (mode === 'login' ? 'Sign in' : 'Create account')}
                    </button>
                  </form>

                  <button type="button" onClick={() => changeMode(mode === 'login' ? 'register' : 'login')} className="mt-5 w-full text-sm font-semibold text-[#E8B04A]">
                    {mode === 'login' ? 'Need an account? Create one' : 'Already have an account? Sign in'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <footer className="mx-auto w-full max-w-md border-t border-white/10 pt-4 text-center text-[10px] leading-5 text-[#66736D]">
            By continuing, you agree to our <a href="/legal.html#terms" target="_blank" rel="noreferrer" className="underline hover:text-[#A9B9B0]">Terms</a> and <a href="/legal.html#privacy" target="_blank" rel="noreferrer" className="underline hover:text-[#A9B9B0]">Privacy Notice</a>.
          </footer>
        </section>
      </div>
    </main>
  );
}

function InputField({ label, icon, value, onChange, type = 'text', autoComplete, trailing }: {
  label: string;
  icon: ReactNode;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
  trailing?: ReactNode;
}) {
  return (
    <label className="block text-sm font-semibold text-[#C7D3CC]">
      {label}
      <span className="relative mt-2 block">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#66736D]">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          className="min-h-[52px] w-full rounded-2xl border border-white/10 bg-[#0E1B17] py-3.5 pl-12 pr-12 text-base font-normal text-[#F6ECD8] outline-none transition-colors placeholder:text-[#58645E] focus:border-[#E8B04A]/60 focus:ring-2 focus:ring-[#E8B04A]/20"
        />
        {trailing && <span className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</span>}
      </span>
    </label>
  );
}
