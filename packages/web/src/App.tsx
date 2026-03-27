import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SmoothPageTransition } from './components/PolishTouches';

// ─── Pages ─────────────────────────────────────────────────────────────────
import { SplashScreen } from './pages/SplashScreen';
import { OnboardingFlow } from './pages/OnboardingFlow';
import { FirstGameExperience } from './pages/FirstGameExperience';
import { LoginScreen } from './pages/LoginScreen';
import { LobbyScreen } from './pages/LobbyScreen';
import { EnhancedGameTable } from './components/EnhancedGameTable';
import { ProfileScreenNew } from './pages/ProfileScreenNew';
import { LeaderboardScreen } from './pages/LeaderboardScreen';
import { FriendsScreen } from './pages/FriendsScreen';
import { ChipStoreScreen } from './pages/ChipStoreScreen';
import { TournamentScreen } from './pages/TournamentScreen';
import { AchievementsScreen } from './pages/AchievementsScreen';
import { SeasonPassScreen } from './pages/SeasonPassScreen';
import { SettingsScreen } from './pages/SettingsScreen';
import { CoachingScreen } from './pages/CoachingScreen';
import { SpectatorLobby } from './pages/SpectatorLobby';

// ─── Global Overlays & Modals ──────────────────────────────────────────────
import { CreateRoomModal } from './components/CreateRoomModal';
import { DailyRewardModal } from './components/DailyRewardModal';
import { HourlyBonusToast } from './components/HourlyBonus';
import { ComebackBonus } from './components/ComebackBonus';
import { SpinWheel } from './components/SpinWheel';
import { NotificationCenter } from './components/NotificationCenter';
import { ConnectionStatus } from './components/ConnectionStatus';
import { ToastContainer } from './components/Toast';

// ─── Stores & Hooks ────────────────────────────────────────────────────────
import { useAuthStore, createGuestUser } from './stores/authStore';
import { useGameStore } from './stores/gameStore';
import { useUIStore } from './stores/uiStore';
import { useGameSocket } from './hooks/useGameSocket';
import { soundManager } from './services/soundManager';
import { premiumSounds } from './services/premiumSounds';
import { analytics } from './services/analytics';
import { errorTracker } from './services/errorTracking';
import { payments } from './services/payments';
import { pushNotifications } from './services/pushNotifications';

// ─── Types ─────────────────────────────────────────────────────────────────
import { GameRoom, GameVariant } from './types';

// ─── AI Players ────────────────────────────────────────────────────────────
const AI_PLAYERS = [
  { id: 'ai-sharma', username: 'Sharma Ji', personality: 'conservative' },
  { id: 'ai-priya', username: 'Priya', personality: 'balanced' },
  { id: 'ai-bunty', username: 'Bunty', personality: 'aggressive' },
  { id: 'ai-meera', username: 'Meera', personality: 'balanced' },
  { id: 'ai-raja', username: 'Raja', personality: 'aggressive' },
] as const;

// ─── Screen Types ──────────────────────────────────────────────────────────
type Screen =
  | 'splash'
  | 'onboarding'
  | 'login'
  | 'home'
  | 'game'
  | 'profile'
  | 'social'
  | 'leaderboard'
  | 'shop'
  | 'tournaments'
  | 'achievements'
  | 'season'
  | 'settings'
  | 'coaching'
  | 'spectator'
  | 'spin';

// ─── App ───────────────────────────────────────────────────────────────────

export function App() {
  // Screen state
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [screenHistory, setScreenHistory] = useState<Screen[]>([]);

  // Modal state
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showJoinByCode, setShowJoinByCode] = useState(false);
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showComebackBonus, setShowComebackBonus] = useState(false);

  // Room state
  const [roomCode, setRoomCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null);
  const [activeRooms, setActiveRooms] = useState<Map<string, GameRoom>>(new Map());

  // Stores
  const { user, isAuthenticated, loginAsGuest, login } = useAuthStore();
  const { hasSeenOnboarding, setHasSeenOnboarding } = useUIStore();
  const { joinRoom, startGame } = useGameStore();

  // Initialize socket listeners
  useGameSocket();

  // ─── Initialization ──────────────────────────────────────────────────

  // Initialize all services
  useEffect(() => {
    analytics.init();
    errorTracker.init();
    payments.init();
    pushNotifications.init();
  }, []);

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

  // Auto-login
  useEffect(() => {
    if (!isAuthenticated) {
      loginAsGuest().catch(() => {
        const guestUser = createGuestUser();
        login(guestUser, 'guest-token');
      });
    }
  }, [isAuthenticated, loginAsGuest, login]);

  // Show daily reward only on home screen (never during game)
  useEffect(() => {
    if (currentScreen === 'home' && isAuthenticated && !showDailyReward) {
      const lastClaim = localStorage.getItem('tp_last_daily_claim');
      const today = new Date().toDateString();
      if (lastClaim !== today) {
        const timer = setTimeout(() => setShowDailyReward(true), 1500);
        return () => clearTimeout(timer);
      }
    }
    // Auto-close daily reward if we navigate away from home
    if (currentScreen !== 'home' && showDailyReward) {
      setShowDailyReward(false);
    }
  }, [currentScreen, isAuthenticated]);

  // Check for comeback bonus (only on home, never during game)
  useEffect(() => {
    if (currentScreen === 'home' && isAuthenticated && !showComebackBonus) {
      const lastPlayed = localStorage.getItem('tp_last_played');
      if (lastPlayed) {
        const hoursSince = (Date.now() - parseInt(lastPlayed)) / (1000 * 60 * 60);
        if (hoursSince >= 24) {
          setTimeout(() => setShowComebackBonus(true), 3000);
        }
      }
      localStorage.setItem('tp_last_played', Date.now().toString());
    }
    if (currentScreen !== 'home' && showComebackBonus) {
      setShowComebackBonus(false);
    }
  }, [currentScreen, isAuthenticated]);

  // ─── Navigation ──────────────────────────────────────────────────────

  const navigateTo = useCallback((screen: string) => {
    setScreenHistory(prev => [...prev.slice(-10), currentScreen]);
    setCurrentScreen(screen as Screen);
    analytics.screenViewed(screen);
  }, [currentScreen]);

  const goBack = useCallback(() => {
    if (screenHistory.length > 0) {
      const prev = screenHistory[screenHistory.length - 1];
      setScreenHistory(h => h.slice(0, -1));
      setCurrentScreen(prev);
    } else {
      setCurrentScreen('home');
    }
  }, [screenHistory]);

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

  const handleQuickPlay = useCallback(() => {
    const room: GameRoom = {
      id: crypto.randomUUID(),
      name: 'Quick Play',
      variant: 'classic',
      minBuyIn: 500,
      maxBuyIn: 5000,
      minBet: 50,
      maxPlayers: 4,
      currentPlayers: 4,
      status: 'playing',
      isPrivate: false,
      createdBy: user?.id || '',
    };

    joinRoom(room);
    const shuffled = [...AI_PLAYERS].sort(() => Math.random() - 0.5);
    const players = [
      { userId: user?.id || '1', username: user?.username || 'You', chips: 5000, isAI: false },
      ...shuffled.slice(0, 3).map(ai => ({
        userId: ai.id, username: ai.username, chips: 5000, isAI: true, personality: ai.personality,
      })),
    ];

    startGame(players, room.minBet, room.variant);
    soundManager.play('game_start');
    setCurrentScreen('game');
  }, [user, joinRoom, startGame]);

  const handleJoinGame = useCallback((room: GameRoom) => {
    joinRoom(room);
    const shuffled = [...AI_PLAYERS].sort(() => Math.random() - 0.5);
    const players = [
      { userId: user?.id || '1', username: user?.username || 'You', chips: 5000, isAI: false },
      ...shuffled.slice(0, 3).map(ai => ({
        userId: ai.id, username: ai.username, chips: 5000, isAI: true, personality: ai.personality,
      })),
    ];

    startGame(players, room.minBet, room.variant);
    soundManager.play('game_start');
    setCurrentScreen('game');
  }, [user, joinRoom, startGame]);

  const handleJoinByCode = () => {
    const code = roomCode.trim().toUpperCase();
    if (code.length !== 6) {
      setJoinError('Please enter a 6-character room code');
      return;
    }
    const room = Array.from(activeRooms.values()).find(r => r.roomCode === code);
    if (!room) {
      setJoinError('Room not found. Check the code and try again.');
      return;
    }
    if (room.currentPlayers >= room.maxPlayers) {
      setJoinError('Room is full');
      return;
    }
    setJoinError('');
    setShowJoinByCode(false);
    setRoomCode('');
    handleJoinGame(room);
  };

  const handleCreateRoom = (config: {
    name: string;
    variant: GameVariant;
    minBuyIn: number;
    maxBuyIn: number;
    bootAmount: number;
    maxPlayers: number;
    isPrivate: boolean;
  }) => {
    const code = config.isPrivate ? Math.random().toString(36).substring(2, 8).toUpperCase() : undefined;
    const newRoom: GameRoom = {
      id: crypto.randomUUID(),
      name: config.name || 'My Table',
      variant: config.variant,
      minBuyIn: config.minBuyIn,
      maxBuyIn: config.maxBuyIn,
      minBet: config.bootAmount,
      maxPlayers: config.maxPlayers,
      currentPlayers: 1,
      status: 'waiting',
      isPrivate: config.isPrivate,
      roomCode: code,
      createdBy: user?.id || '',
    };
    if (code) {
      setActiveRooms(prev => new Map(prev).set(code, newRoom));
      setCreatedRoomCode(code);
    }
    handleJoinGame(newRoom);
    setShowCreateRoom(false);
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
              loginAsGuest().then(() => {
                if (!hasSeenOnboarding) setCurrentScreen('onboarding');
                else setCurrentScreen('home');
              });
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
            onLeave={() => setCurrentScreen('home')}
          />
        );

      case 'profile':
        return <ProfileScreenNew onNavigate={navigateTo} />;

      case 'social':
        return <FriendsScreen onNavigate={navigateTo} />;

      case 'leaderboard':
        return <LeaderboardScreen onNavigate={navigateTo} />;

      case 'shop':
        return (
          <ChipStoreScreen
            currentChips={user?.chips}
            currentDiamonds={user?.diamonds}
            isFirstPurchase={true}
            onBack={goBack}
            onPurchase={(pkgId, type) => {
              soundManager.play('chip_win');
              // In production: api.purchaseChips(pkgId, type)
            }}
          />
        );

      case 'tournaments':
        return <TournamentScreen onNavigate={navigateTo} />;

      case 'achievements':
        return <AchievementsScreen onNavigate={navigateTo} />;

      case 'season':
        return <SeasonPassScreen onNavigate={navigateTo} />;

      case 'settings':
        return <SettingsScreen onNavigate={navigateTo} />;

      case 'coaching':
        return (
          <CoachingScreen
            onBack={goBack}
            onPractice={handleQuickPlay}
          />
        );

      case 'spectator':
        return (
          <SpectatorLobby
            onWatch={(gameId) => {
              // In production: join spectator socket for gameId
              // In production: join spectator socket for gameId
            }}
            onNavigate={navigateTo}
            currentScreen="spectator"
          />
        );

      case 'spin':
        return (
          <div className="h-full w-full bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-center p-6">
            <SpinWheel
              isOpen={true}
              freeSpinsRemaining={1}
              spinCostDiamonds={5}
              diamondBalance={user?.diamonds || 0}
              onSpin={() => { soundManager.play('win_big'); }}
              onClose={() => setCurrentScreen('home')}
            />
          </div>
        );

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
    <>
      {/* Connection status banner (shows on poor network) */}
      <ConnectionStatus />

      {/* Main screen with transitions */}
      <AnimatePresence mode="wait">
        <SmoothPageTransition key={currentScreen} direction="forward" className="h-full w-full">
          {renderScreen()}
        </SmoothPageTransition>
      </AnimatePresence>

      {/* ─── Global Modals & Overlays ─────────────────────────────────── */}

      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={showCreateRoom}
        onClose={() => { setShowCreateRoom(false); setCreatedRoomCode(null); }}
        onCreate={handleCreateRoom}
        createdRoomCode={createdRoomCode}
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

      {/* Daily Reward Modal */}
      <DailyRewardModal
        isOpen={showDailyReward}
        currentDay={3}
        streak={3}
        vipMultiplier={1}
        onClaim={() => {
          localStorage.setItem('tp_last_daily_claim', new Date().toDateString());
          soundManager.play('daily_reward');
          setShowDailyReward(false);
        }}
        onClose={() => setShowDailyReward(false)}
      />

      {/* Comeback Bonus */}
      <ComebackBonus
        isOpen={showComebackBonus}
        daysAbsent={2}
        playerName={user?.username || 'Player'}
        onClaim={() => {
          soundManager.play('chip_win');
          setShowComebackBonus(false);
        }}
        onClose={() => setShowComebackBonus(false)}
      />

      {/* Notification Center */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        onNotificationClick={(notification) => {
          setShowNotifications(false);
          if (notification.type === 'game_invite') navigateTo('home');
          else if (notification.type === 'achievement') navigateTo('achievements');
          else if (notification.type === 'daily_reward') navigateTo('home');
        }}
      />

      {/* Hourly Bonus Toast (always mounted, shows itself when ready) */}
      {currentScreen !== 'splash' && currentScreen !== 'login' && currentScreen !== 'onboarding' && (
        <HourlyBonusToast
          isVisible={false}
          amount={500}
          onTap={() => soundManager.play('chip_win')}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer />
    </>
  );
}
