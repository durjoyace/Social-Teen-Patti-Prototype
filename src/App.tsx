import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { SplashScreen } from './pages/SplashScreen';
import { OnboardingFlow } from './pages/OnboardingFlow';
import { HomeScreen } from './pages/HomeScreen';
import { GameTable } from './pages/GameTable';
import { ProfileScreen } from './pages/ProfileScreen';
type Screen = 'splash' | 'onboarding' | 'home' | 'game' | 'profile';
export function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <SplashScreen onComplete={() => setCurrentScreen('onboarding')} />;
      case 'onboarding':
        return <OnboardingFlow onComplete={() => setCurrentScreen('home')} />;
      case 'home':
        return <HomeScreen onNavigate={screen => setCurrentScreen(screen as Screen)} />;
      case 'game':
        return <GameTable onBack={() => setCurrentScreen('home')} />;
      case 'profile':
        return <ProfileScreen onBack={() => setCurrentScreen('home')} />;
      default:
        return <HomeScreen onNavigate={screen => setCurrentScreen(screen as Screen)} />;
    }
  };
  return <Layout>{renderScreen()}</Layout>;
}