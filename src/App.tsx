import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SplashScreen } from './pages/SplashScreen';
import { OnboardingFlow } from './pages/OnboardingFlow';
import { LobbyScreen } from './pages/LobbyScreen';
import { EnhancedGameTable } from './components/EnhancedGameTable';
import { ProfileScreenNew } from './pages/ProfileScreenNew';
import { LeaderboardScreen } from './pages/LeaderboardScreen';
import { FriendsScreen } from './pages/FriendsScreen';
import { CreateRoomModal } from './components/CreateRoomModal';
import { ToastContainer } from './components/Toast';
import { useAuthStore, createGuestUser } from './stores/authStore';
import { useGameStore } from './stores/gameStore';
import { useUIStore } from './stores/uiStore';
import { GameRoom, GameVariant } from './types';

// AI Player personalities for Quick Play
const AI_PLAYERS = [
  { id: 'ai-sharma', username: 'Sharma Ji', personality: 'conservative' },
  { id: 'ai-priya', username: 'Priya', personality: 'balanced' },
  { id: 'ai-bunty', username: 'Bunty', personality: 'aggressive' },
] as const;

type Screen = 'splash' | 'onboarding' | 'home' | 'game' | 'profile' | 'social' | 'leaderboard';

export function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showJoinByCode, setShowJoinByCode] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null);
  const [activeRooms, setActiveRooms] = useState<Map<string, GameRoom>>(new Map());

  const { user, isAuthenticated, login } = useAuthStore();
  const { hasSeenOnboarding, setHasSeenOnboarding } = useUIStore();
  const { joinRoom, startGame } = useGameStore();

  // Auto-login as guest for demo
  useEffect(() => {
    if (!isAuthenticated) {
      const guestUser = createGuestUser();
      login(guestUser, 'guest-token');
    }
  }, [isAuthenticated, login]);

  const handleSplashComplete = () => {
    if (hasSeenOnboarding) {
      setCurrentScreen('home');
    } else {
      setCurrentScreen('onboarding');
    }
  };

  const handleOnboardingComplete = () => {
    setHasSeenOnboarding(true);
    setCurrentScreen('home');
  };

  // Quick Play - instantly start a game with 3 AI opponents
  const handleQuickPlay = () => {
    const quickPlayRoom: GameRoom = {
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
      createdBy: user?.id || ''
    };

    joinRoom(quickPlayRoom);

    // Start game with 3 AI opponents
    const players = [
      { userId: user?.id || '1', username: user?.username || 'You', chips: 5000, isAI: false },
      { userId: AI_PLAYERS[0].id, username: AI_PLAYERS[0].username, chips: 5000, isAI: true, personality: AI_PLAYERS[0].personality },
      { userId: AI_PLAYERS[1].id, username: AI_PLAYERS[1].username, chips: 5000, isAI: true, personality: AI_PLAYERS[1].personality },
      { userId: AI_PLAYERS[2].id, username: AI_PLAYERS[2].username, chips: 5000, isAI: true, personality: AI_PLAYERS[2].personality },
    ];

    startGame(players, quickPlayRoom.minBet, quickPlayRoom.variant);
    setCurrentScreen('game');
  };

  // Join room by code
  const handleJoinByCode = () => {
    const code = roomCode.trim().toUpperCase();
    if (code.length !== 6) {
      setJoinError('Please enter a 6-character room code');
      return;
    }

    // Find room by code
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

  const handleJoinGame = (room: GameRoom) => {
    joinRoom(room);

    // Start game with mock players for demo
    const mockPlayers = [
      { userId: user?.id || '1', username: user?.username || 'You', chips: 5000, isAI: false },
      { userId: AI_PLAYERS[0].id, username: AI_PLAYERS[0].username, chips: 5000, isAI: true, personality: AI_PLAYERS[0].personality },
      { userId: AI_PLAYERS[1].id, username: AI_PLAYERS[1].username, chips: 5000, isAI: true, personality: AI_PLAYERS[1].personality },
      { userId: AI_PLAYERS[2].id, username: AI_PLAYERS[2].username, chips: 5000, isAI: true, personality: AI_PLAYERS[2].personality },
    ];

    startGame(mockPlayers, room.minBet, room.variant);
    setCurrentScreen('game');
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
    const roomCode = config.isPrivate ? Math.random().toString(36).substring(2, 8).toUpperCase() : undefined;

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
      roomCode,
      createdBy: user?.id || ''
    };

    // Store room for code lookup
    if (roomCode) {
      setActiveRooms(prev => new Map(prev).set(roomCode, newRoom));
      setCreatedRoomCode(roomCode);
    }

    handleJoinGame(newRoom);
    setShowCreateRoom(false);
  };

  const handleNavigate = (screen: string) => {
    setCurrentScreen(screen as Screen);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <SplashScreen onComplete={handleSplashComplete} />;

      case 'onboarding':
        return <OnboardingFlow onComplete={handleOnboardingComplete} />;

      case 'home':
        return (
          <LobbyScreen
            onJoinGame={handleJoinGame}
            onCreateGame={() => setShowCreateRoom(true)}
            onQuickPlay={handleQuickPlay}
            onJoinByCode={() => setShowJoinByCode(true)}
            onNavigate={handleNavigate}
          />
        );

      case 'game':
        return (
          <EnhancedGameTable
            onLeave={() => setCurrentScreen('home')}
          />
        );

      case 'profile':
        return <ProfileScreenNew onNavigate={handleNavigate} />;

      case 'social':
        return <FriendsScreen onNavigate={handleNavigate} />;

      case 'leaderboard':
        return <LeaderboardScreen onNavigate={handleNavigate} />;

      default:
        return (
          <LobbyScreen
            onJoinGame={handleJoinGame}
            onCreateGame={() => setShowCreateRoom(true)}
            onQuickPlay={handleQuickPlay}
            onJoinByCode={() => setShowJoinByCode(true)}
            onNavigate={handleNavigate}
          />
        );
    }
  };

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="h-full w-full"
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>

      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={showCreateRoom}
        onClose={() => {
          setShowCreateRoom(false);
          setCreatedRoomCode(null);
        }}
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
              onClick={() => {
                setShowJoinByCode(false);
                setRoomCode('');
                setJoinError('');
              }}
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
                  onChange={(e) => {
                    setRoomCode(e.target.value.toUpperCase().slice(0, 6));
                    setJoinError('');
                  }}
                  placeholder="ABCD12"
                  maxLength={6}
                  className="w-full bg-white/10 rounded-xl px-4 py-4 text-white text-center text-2xl tracking-[0.5em] font-mono placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 mb-4"
                />
                {joinError && (
                  <p className="text-red-400 text-sm text-center mb-4">{joinError}</p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowJoinByCode(false);
                      setRoomCode('');
                      setJoinError('');
                    }}
                    className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/15 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleJoinByCode}
                    disabled={roomCode.length !== 6}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-bold shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
    </>
  );
}
