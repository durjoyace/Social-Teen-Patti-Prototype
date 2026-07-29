import { lazy, Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { SmoothPageTransition } from './components/PolishTouches';

// ─── Pages ─────────────────────────────────────────────────────────────────
import { SplashScreen } from './pages/SplashScreen';
import { LoginScreen } from './pages/LoginScreen';
import { LobbyScreen } from './pages/LobbyScreen';

const FirstGameExperience = lazy(() => import('./pages/FirstGameExperience').then(module => ({ default: module.FirstGameExperience })));
const ReferralProgram = lazy(() => import('./components/ReferralProgram').then(module => ({ default: module.ReferralProgram })));
const EnhancedGameTable = lazy(() => import('./components/EnhancedGameTable').then(module => ({ default: module.EnhancedGameTable })));
const ProfileScreenNew = lazy(() => import('./pages/ProfileScreenNew').then(module => ({ default: module.ProfileScreenNew })));
const SettingsScreen = lazy(() => import('./pages/SettingsScreen').then(module => ({ default: module.SettingsScreen })));

// ─── Global Overlays & Modals ──────────────────────────────────────────────
import { CreateRoomModal } from './components/CreateRoomModal';
import { ConnectionStatus } from './components/ConnectionStatus';
import { ToastContainer } from './components/Toast';

// ─── Stores & Hooks ────────────────────────────────────────────────────────
import { useAuthStore } from './stores/authStore';
import { useGameStore } from './stores/gameStore';
import { useUIStore } from './stores/uiStore';
import { useGameSocket } from './hooks/useGameSocket';
import { soundManager } from './services/soundManager';
import { premiumSounds } from './services/premiumSounds';
import { analytics } from './services/analytics';
import { errorTracker } from './services/errorTracking';
import { pushNotifications } from './services/pushNotifications';
import { api } from './services/api';
import {
  captureReferralAttribution,
  clearPendingRoomCode,
  getPendingRoomCode,
} from './services/referralAttribution';
import { socketService } from './services/socket';

// ─── Types ─────────────────────────────────────────────────────────────────
import { GameRoom, GameVariant } from './types';

// ─── Screen Types ──────────────────────────────────────────────────────────
type Screen =
  | 'splash'
  | 'onboarding'
  | 'login'
  | 'home'
  | 'game'
  | 'profile'
  | 'settings'
  | 'referrals';

// ─── App ───────────────────────────────────────────────────────────────────

export function App() {
  const [referralAttribution] = useState(() => captureReferralAttribution());
  // Screen state
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  // Modal state
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showJoinByCode, setShowJoinByCode] = useState(false);

  // Room state
  const [roomCode, setRoomCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null);
  const [createdInviteUrl, setCreatedInviteUrl] = useState<string | null>(null);
  const pendingInviteAttempted = useRef(false);

  // Stores
  const { user, isAuthenticated } = useAuthStore();
  const { hasSeenOnboarding, setHasSeenOnboarding, addToast, reducedMotion } = useUIStore();
  const { joinRoom, leaveRoom, gameState, isOnlineMode } = useGameStore();

  // Initialize socket listeners
  useGameSocket();

  useEffect(() => {
    if (!isAuthenticated || pendingInviteAttempted.current) return;
    const pendingRoomCode = getPendingRoomCode();
    if (!pendingRoomCode) return;

    pendingInviteAttempted.current = true;
    void (async () => {
      try {
        if (!socketService.isConnected) await socketService.connect();
        const result = await socketService.joinByCode(pendingRoomCode);
        if (!result.success) throw new Error(result.error || 'That friend table is no longer available');
        clearPendingRoomCode();
        addToast({ message: 'Friend table joined — waiting for the deal', type: 'success', duration: 4000 });
      } catch (error) {
        clearPendingRoomCode();
        const message = error instanceof Error ? error.message : 'Could not join the friend table';
        addToast({ message, type: 'error', duration: 5000 });
        setCurrentScreen('home');
      }
    })();
  }, [addToast, isAuthenticated]);

  useEffect(() => {
    if (isOnlineMode && gameState) {
      setShowCreateRoom(false);
      setCreatedRoomCode(null);
      setCurrentScreen('game');
    }
  }, [isOnlineMode, gameState]);

  // ─── Initialization ──────────────────────────────────────────────────

  // Initialize all services
  useEffect(() => {
    pushNotifications.init();
    if (referralAttribution) {
      analytics.referralLinkOpened(
        referralAttribution.source || 'referral',
        referralAttribution.campaign || 'table_circle',
      );
    }
  }, [referralAttribution]);

  useEffect(() => {
    if (user) {
      analytics.identify(user.id);
      errorTracker.setUser(user.id);
    } else {
      analytics.reset();
      errorTracker.clearUser();
    }
  }, [user?.id]);

  // Initialize sound systems on first user interaction
  useEffect(() => {
    const initSounds = () => {
      soundManager.preload();
      premiumSounds.init();
      window.removeEventListener('pointerdown', initSounds);
    };
    window.addEventListener('pointerdown', initSounds, { once: true });
    return () => window.removeEventListener('pointerdown', initSounds);
  }, []);

  // ─── Navigation ──────────────────────────────────────────────────────

  const navigateTo = useCallback((screen: string) => {
    const allowedScreens: Screen[] = ['login', 'home', 'profile', 'settings', 'referrals'];
    const destination = allowedScreens.includes(screen as Screen) ? screen as Screen : 'home';
    setCurrentScreen(destination);
    analytics.screenViewed(destination);
  }, []);

  // ─── Screen Handlers ─────────────────────────────────────────────────

  const handleSplashComplete = () => {
    if (!isAuthenticated) {
      setCurrentScreen('login');
    } else if (!hasSeenOnboarding) {
      setCurrentScreen('onboarding');
    } else {
      setCurrentScreen('home');
    }
  };

  const handleLoginComplete = () => {
    if (!hasSeenOnboarding) {
      setCurrentScreen('onboarding');
    } else {
      setCurrentScreen('home');
    }
  };

  const handleOnboardingComplete = () => {
    setHasSeenOnboarding(true);
    setCurrentScreen('home');
  };

  // ─── Game Handlers ───────────────────────────────────────────────────

  const handleQuickPlay = useCallback(async () => {
    setJoinError('');
    try {
      if (!socketService.isConnected) await socketService.connect();
      const result = await socketService.quickPlay();
      if (!result.success) throw new Error(result.error || 'Could not start quick play');
      soundManager.play('game_start');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not start quick play';
      setJoinError(message);
      addToast({ message, type: 'error', duration: 4000 });
    }
  }, [addToast]);

  const handleJoinGame = useCallback(async (room: GameRoom) => {
    setJoinError('');
    joinRoom(room);
    try {
      if (!socketService.isConnected) await socketService.connect();
      const buyIn = Math.max(room.minBuyIn, Math.min(room.maxBuyIn, 5000));
      const result = await socketService.joinRoom(room.id, buyIn);
      if (!result.success) throw new Error(result.error || 'Could not join table');
    } catch (error) {
      leaveRoom();
      const message = error instanceof Error ? error.message : 'Could not join table';
      setJoinError(message);
      addToast({ message, type: 'error', duration: 4000 });
    }
  }, [joinRoom, leaveRoom, addToast]);

  const handleJoinByCode = async () => {
    const code = roomCode.trim().toUpperCase();
    if (code.length !== 6) {
      setJoinError('Please enter a 6-character room code');
      return;
    }
    try {
      if (!socketService.isConnected) await socketService.connect();
      const result = await socketService.joinByCode(code);
      if (!result.success) throw new Error(result.error || 'Room not found. Check the code and try again.');
      setJoinError('');
      setShowJoinByCode(false);
      setRoomCode('');
    } catch (error) {
      setJoinError(error instanceof Error ? error.message : 'Could not join table');
    }
  };

  const handleCreateRoom = async (config: {
    name: string;
    variant: GameVariant;
    minBuyIn: number;
    maxBuyIn: number;
    bootAmount: number;
    maxPlayers: number;
    isPrivate: boolean;
  }) => {
    setJoinError('');
    try {
      if (!socketService.isConnected) await socketService.connect();
      const result = await socketService.createRoom({
        ...config,
        variant: config.variant.toUpperCase(),
        buyIn: Math.max(config.minBuyIn, Math.min(config.maxBuyIn, 5000)),
      });
      if (!result.success || !result.room) throw new Error(result.error || 'Could not create table');
      joinRoom({
        id: result.room.id,
        name: config.name || 'My Table',
        variant: config.variant,
        minBuyIn: config.minBuyIn,
        maxBuyIn: config.maxBuyIn,
        minBet: config.bootAmount,
        maxPlayers: config.maxPlayers,
        currentPlayers: 1,
        status: 'waiting',
        isPrivate: config.isPrivate,
        roomCode: result.room.roomCode,
        createdBy: user?.id || '',
      });
      setCreatedRoomCode(result.room.roomCode || null);
      setCreatedInviteUrl(null);
      if (result.room.roomCode) {
        try {
          const summary = await api.getReferralSummary();
          const inviteUrl = new URL(summary.shareUrl);
          inviteUrl.searchParams.set('room', result.room.roomCode);
          setCreatedInviteUrl(inviteUrl.toString());
        } catch {
          // The room code is still shareable if referral summary retrieval is unavailable.
        }
      }
      if (!result.room.roomCode) setShowCreateRoom(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not create table';
      setJoinError(message);
      addToast({ message, type: 'error', duration: 4000 });
    }
  };

  // ─── Screen Renderer ─────────────────────────────────────────────────

  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <SplashScreen onComplete={handleSplashComplete} />;

      case 'login':
        return (
          <LoginScreen
            onComplete={handleLoginComplete}
            onGuestPlay={() => {
              if (!hasSeenOnboarding) setCurrentScreen('onboarding');
              else setCurrentScreen('home');
            }}
          />
        );

      case 'onboarding':
        return (
          <FirstGameExperience
            username={user?.username || 'Player'}
            onComplete={handleOnboardingComplete}
          />
        );

      case 'home':
        return (
          <LobbyScreen
            onJoinGame={handleJoinGame}
            onCreateGame={() => setShowCreateRoom(true)}
            onQuickPlay={handleQuickPlay}
            onJoinByCode={() => setShowJoinByCode(true)}
            onNavigate={navigateTo}
          />
        );

      case 'game':
        return (
          <EnhancedGameTable
            onLeave={() => { leaveRoom(); setCurrentScreen('home'); }}
          />
        );

      case 'profile':
        return <ProfileScreenNew onNavigate={navigateTo} />;

      case 'referrals':
        return <ReferralProgram onNavigate={navigateTo} />;
      case 'settings':
        return <SettingsScreen onNavigate={navigateTo} />;

      default:
        return (
          <LobbyScreen
            onJoinGame={handleJoinGame}
            onCreateGame={() => setShowCreateRoom(true)}
            onQuickPlay={handleQuickPlay}
            onJoinByCode={() => setShowJoinByCode(true)}
            onNavigate={navigateTo}
          />
        );
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────

  return (
    <MotionConfig reducedMotion={reducedMotion ? 'always' : 'user'}>
      {/* Connection status banner (shows on poor network) */}
      <ConnectionStatus />

      {/* Main screen with transitions */}
      <AnimatePresence mode="wait">
        <SmoothPageTransition key={currentScreen} direction="forward" className="h-full w-full">
          <Suspense fallback={<div className="grid h-full w-full place-items-center bg-[#0B1221] text-[#FFD66B]">Loading table…</div>}>
            {renderScreen()}
          </Suspense>
        </SmoothPageTransition>
      </AnimatePresence>

      {/* ─── Global Modals & Overlays ─────────────────────────────────── */}

      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={showCreateRoom}
        onClose={() => { setShowCreateRoom(false); setCreatedRoomCode(null); setCreatedInviteUrl(null); }}
        onCreate={handleCreateRoom}
        createdRoomCode={createdRoomCode}
        createdInviteUrl={createdInviteUrl}
        onInviteShared={(platform) => {
          analytics.inviteShared(platform.toLowerCase());
          void api.recordReferralShare(platform).catch(() => {});
        }}
      />

      {/* Join by Code Modal */}
      <AnimatePresence>
        {showJoinByCode && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowJoinByCode(false); setRoomCode(''); setJoinError(''); }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm z-50"
            >
              <div className="bg-gradient-to-b from-gray-900 to-black rounded-3xl border border-white/10 overflow-hidden p-6">
                <h2 className="text-xl font-bold text-white mb-4 text-center">Join by Code</h2>
                <p className="text-white/60 text-sm text-center mb-6">
                  Enter the 6-character room code shared by your friend
                </p>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => { setRoomCode(e.target.value.toUpperCase().slice(0, 6)); setJoinError(''); }}
                  placeholder="ABCD12"
                  maxLength={6}
                  className="w-full bg-white/10 rounded-xl px-4 py-4 text-white text-center text-2xl tracking-[0.5em] font-mono placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 mb-4"
                />
                {joinError && <p className="text-red-400 text-sm text-center mb-4">{joinError}</p>}
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowJoinByCode(false); setRoomCode(''); setJoinError(''); }}
                    className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleJoinByCode}
                    disabled={roomCode.length !== 6}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-bold shadow-lg shadow-green-500/30 disabled:opacity-50"
                  >
                    Join
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Toast Notifications */}
      <ToastContainer />
    </MotionConfig>
  );
}
