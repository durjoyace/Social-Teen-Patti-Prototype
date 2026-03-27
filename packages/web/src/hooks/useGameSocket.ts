import { useEffect, useCallback } from 'react';
import { socketService } from '../services/socket';
import { useGameStore } from '../stores/gameStore';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';

/**
 * Hook that syncs socket events with game state.
 * Should be mounted at the app level.
 */
export function useGameSocket() {
  const { updateFromServer, addChatMessage, setGameMessage } = useGameStore();
  const { updateChips } = useAuthStore();
  const { addToast } = useUIStore();

  useEffect(() => {
    // Listen for game state updates from server
    const unsubState = socketService.on('game:state', (state: any) => {
      updateFromServer(state);
    });

    // Game ended
    const unsubEnded = socketService.on('game:ended', (data: any) => {
      const winnerNames = data.winners?.map((w: any) => w.username).join(', ') || 'Unknown';
      setGameMessage(`Winner: ${winnerNames} — Won ₹${data.pot}`);

      // Update local chips if we won
      const me = data.winners?.find((w: any) => {
        const store = useAuthStore.getState();
        return store.user?.id === w.odic;
      });
      if (me) {
        addToast({ message: `You won ₹${data.pot}!`, type: 'success', duration: 5000 });
      }
    });

    // AI thinking
    const unsubAI = socketService.on('game:ai_thinking', (data: any) => {
      setGameMessage(`${data.username} is thinking...`);
    });

    // Player timeout
    const unsubTimeout = socketService.on('game:timeout', (data: any) => {
      setGameMessage('Player timed out — auto-folded');
    });

    // Chat messages
    const unsubChat = socketService.on('chat:message', (msg: any) => {
      addChatMessage({
        id: msg.id,
        roomId: msg.roomId || '',
        userId: msg.userId,
        username: msg.username,
        message: msg.message,
        createdAt: new Date(msg.createdAt),
      });
    });

    // Gift animations
    const unsubGift = socketService.on('gift:received', (data: any) => {
      addToast({
        message: `${data.senderName} sent a ${data.giftType}!`,
        type: 'info',
        duration: 3000,
      });
    });

    // Connection events
    const unsubConnected = socketService.on('connected', () => {
      useAuthStore.getState().setOnline(true);
    });

    const unsubDisconnected = socketService.on('disconnected', () => {
      useAuthStore.getState().setOnline(false);
      addToast({ message: 'Connection lost. Reconnecting...', type: 'warning' });
    });

    const unsubError = socketService.on('error', (msg: string) => {
      addToast({ message: msg, type: 'error' });
    });

    return () => {
      unsubState();
      unsubEnded();
      unsubAI();
      unsubTimeout();
      unsubChat();
      unsubGift();
      unsubConnected();
      unsubDisconnected();
      unsubError();
    };
  }, [updateFromServer, addChatMessage, setGameMessage, updateChips, addToast]);
}
