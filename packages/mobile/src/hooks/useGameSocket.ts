import { useEffect } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { getSocket } from '../services/socket';
import { useAuthStore } from '../stores/authStore';
import { useGameStore } from '../stores/gameStore';

export function useGameSocket() {
  const router = useRouter();
  const updateFromServer = useGameStore(state => state.updateFromServer);
  const setGameMessage = useGameStore(state => state.setGameMessage);
  const restoreSession = useAuthStore(state => state.restoreSession);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onState = (state: any) => {
      updateFromServer(state);
      router.replace('/(main)/game');
    };
    const onEnded = (data: any) => {
      const names = data.winners?.map((winner: any) => winner.username).join(', ') || 'Player';
      setGameMessage(`${names} won ${data.pot} chips`);
      void restoreSession();
    };
    const onReferralRewarded = (data: any) => {
      Alert.alert('Beli unlocked', `First real game complete — you earned ${data.beli} Beli.`);
      void restoreSession();
    };

    socket.on('game:state', onState);
    socket.on('game:ended', onEnded);
    socket.on('referral:rewarded', onReferralRewarded);
    return () => {
      socket.off('game:state', onState);
      socket.off('game:ended', onEnded);
      socket.off('referral:rewarded', onReferralRewarded);
    };
  }, [router, restoreSession, setGameMessage, updateFromServer]);
}
