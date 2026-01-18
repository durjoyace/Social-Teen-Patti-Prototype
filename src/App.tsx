import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
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

type Screen = 'splash' | 'onboarding' | 'home' | 'game' | 'profile' | 'social' | 'leaderboard';

export function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [showCreateRoom, setShowCreateRoom] = useState(false);

  const { user, isAuthenticated, login } = useAuthStore();
  const { hasSeenOnboarding, setHasSeenOnboarding } = useUIStore();
  const { joinRoom, startGame, currentRoom } = useGameStore();

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

  const handleJoinGame = (room: GameRoom) => {
    joinRoom(room);

    // Start game with mock players for demo
    const mockPlayers = [
      { userId: user?.id || '1', username: user?.username || 'You', chips: 5000 },
      { userId: '2', username: 'Rahul', chips: 5000 },
      { userId: '3', username: 'Priya', chips: 5000 },
      { userId: '4', username: 'Amit', chips: 5000 },
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
      roomCode: config.isPrivate ? Math.random().toString(36).substring(2, 8).toUpperCase() : undefined,
      createdBy: user?.id || ''
    };

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
            onNavigate={handleNavigate}
          />
        );
    }
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {renderScreen()}
      </AnimatePresence>

      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={showCreateRoom}
        onClose={() => setShowCreateRoom(false)}
        onCreate={handleCreateRoom}
      />

      {/* Toast Notifications */}
      <ToastContainer />
    </>
  );
}
