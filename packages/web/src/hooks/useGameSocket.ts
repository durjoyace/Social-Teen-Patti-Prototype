import type { GameView, RoomView } from "../../../shared/src/rules/protocol.js";
import { useEffect, useCallback } from "react";
import { socketService } from "../services/socket";
import { useGameStore } from "../stores/gameStore";
import { useAuthStore } from "../stores/authStore";
import { useUIStore } from "../stores/uiStore";
import type { GameVariant } from "../types";

/**
 * Hook that syncs socket events with game state.
 * Should be mounted at the app level.
 */
export function useGameSocket() {
  const { updateFromServer, addChatMessage, setGameMessage, joinRoom } =
    useGameStore();
  const { refreshProfile } = useAuthStore();
  const { addToast } = useUIStore();

  useEffect(() => {
    // Listen for game state updates from server
    const unsubState = socketService.on("game:state", (state: GameView) => {
      updateFromServer(state);
    });

    const unsubRoom = socketService.on("room:state", (room: RoomView) => {
      useGameStore.setState({ roomSnapshot: room });
      const existing = useGameStore.getState().currentRoom;
      if (existing?.id !== room.id) void refreshProfile();
      const bootAmount = Number(room.bootAmount || existing?.minBet || 50);
      joinRoom({
        id: room.id,
        name: room.name || existing?.name || "Friend table",
        variant: String(
          room.variant || existing?.variant || "classic",
        ).toLowerCase() as GameVariant,
        minBuyIn: Number(
          room.minBuyIn || existing?.minBuyIn || bootAmount * 10,
        ),
        maxBuyIn: Number(
          room.maxBuyIn || existing?.maxBuyIn || bootAmount * 100,
        ),
        minBet: bootAmount,
        maxPlayers: Number(room.maxPlayers || existing?.maxPlayers || 6),
        currentPlayers: Number(room.currentPlayers || 0),
        status: room.status || "waiting",
        isPrivate: room.isPrivate ?? existing?.isPrivate ?? true,
        roomCode: room.roomCode || existing?.roomCode,
        createdBy: room.createdBy || existing?.createdBy || "",
      });
    });

    const unsubCleared = socketService.on("session:cleared", () =>
      useGameStore.setState({
        currentRoom: null,
        roomSnapshot: null,
        gameState: null,
        serverGameState: null,
        myCards: [],
        myPlayerId: null,
        isOnlineMode: false,
        availableActions: [],
        chatMessages: [],
      }),
    );
    const unsubLeft = socketService.on("room:left", () => {
      useGameStore.setState({
        currentRoom: null,
        roomSnapshot: null,
        isOnlineMode: false,
        gameState: null,
        serverGameState: null,
        myCards: [],
        myPlayerId: null,
      });
      void refreshProfile();
    });

    // Game ended
    const unsubEnded = socketService.on("game:ended", (data: any) => {
      const winnerNames =
        data.winners?.map((w: any) => w.username).join(", ") || "Unknown";
      setGameMessage(
        `Winner: ${winnerNames}. ${data.winners?.map((w: any) => `${w.username}: ${w.amount} chips`).join(", ")}`,
      );

      // Update local chips if we won
      const myPlayerId = useGameStore.getState().myPlayerId;
      const me = data.winners?.find((winner: any) => winner.id === myPlayerId);
      if (me) {
        addToast({
          message: `You received ${me.amount} chips!`,
          type: "success",
          duration: 5000,
        });
      }
      void refreshProfile();
    });

    // AI thinking
    const unsubAI = socketService.on("game:ai_thinking", (data: any) => {
      setGameMessage(`${data.username} is thinking...`);
    });

    // Player timeout
    const unsubTimeout = socketService.on("game:timeout", (data: any) => {
      setGameMessage("Player timed out — auto-folded");
    });

    // Chat messages
    const unsubChat = socketService.on("chat:message", (msg: any) => {
      addChatMessage({
        id: msg.id,
        roomId: msg.roomId || "",
        userId: msg.userId,
        username: msg.username,
        message: msg.message,
        createdAt: new Date(msg.createdAt),
      });
    });

    // Gift animations
    const unsubGift = socketService.on("gift:received", (data: any) => {
      addToast({
        message: `${data.senderName} sent a ${data.giftType}!`,
        type: "info",
        duration: 3000,
      });
    });

    const unsubReferral = socketService.on("referral:rewarded", (data: any) => {
      addToast({
        message: `First real game complete — you earned ${data.beli} Club Points!`,
        type: "success",
        duration: 6000,
      });
      void refreshProfile();
    });

    // Connection events
    const unsubConnected = socketService.on("connected", () => {
      useAuthStore.getState().setOnline(true);
    });

    const unsubDisconnected = socketService.on("disconnected", () => {
      useAuthStore.getState().setOnline(false);
      addToast({
        message: "Connection lost. Reconnecting...",
        type: "warning",
      });
    });

    const unsubError = socketService.on("error", (msg: string) => {
      addToast({ message: msg, type: "error" });
    });

    return () => {
      unsubCleared();
      unsubLeft();
      unsubState();
      unsubRoom();
      unsubEnded();
      unsubAI();
      unsubTimeout();
      unsubChat();
      unsubGift();
      unsubReferral();
      unsubConnected();
      unsubDisconnected();
      unsubError();
    };
  }, [
    updateFromServer,
    addChatMessage,
    setGameMessage,
    joinRoom,
    refreshProfile,
    addToast,
  ]);
}
