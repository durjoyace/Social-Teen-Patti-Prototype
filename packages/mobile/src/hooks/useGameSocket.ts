import { playTurn } from "../services/audio";
import { usePreferences } from "../stores/preferences";
import type { GameView, RoomView } from "../../../shared/src/rules/protocol.js";
import { useEffect } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { getSocket } from "../services/socket";
import { useAuthStore } from "../stores/authStore";
import { useGameStore } from "../stores/gameStore";

export function useGameSocket() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const updateFromServer = useGameStore((state) => state.updateFromServer);
  const setGameMessage = useGameStore((state) => state.setGameMessage);
  const restoreSession = useAuthStore((state) => state.restoreSession);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onState = (state: GameView) => {
      const prior = useGameStore.getState().serverGameState;
      if (
        state.availableActions.length &&
        (prior?.currentPlayerIndex !== state.currentPlayerIndex ||
          prior?.sessionId !== state.sessionId)
      )
        void playTurn();
      updateFromServer(state);
      if (prior?.sessionId !== state.sessionId) router.replace("/(main)/game");
    };
    const onEnded = (data: any) => {
      setGameMessage(
        data.winners
          ?.map((w: any) => `${w.username}: +${w.amount} chips`)
          .join(", ") || "Hand complete",
      );
      void restoreSession();
    };
    const onReferralRewarded = (data: any) => {
      if (usePreferences.getState().notifications)
        Alert.alert(
          "Club Points earned",
          `First real game complete — you earned ${data.beli} Club Points.`,
        );
      void restoreSession();
    };

    const onRoom = (room: RoomView) =>
      useGameStore.setState({ roomSnapshot: room });
    const onLeft = () => {
      useGameStore.setState({
        roomSnapshot: null,
        gameState: null,
        serverGameState: null,
        myCards: [],
        availableActions: [],
        isOnlineMode: false,
      });
      router.replace("/(main)/lobby");
      void restoreSession();
    };
    const onDisconnect = () =>
      setGameMessage("Connection lost. Reconnecting to your saved table…");
    const onChat = (data: { username: string; message: string }) =>
      setGameMessage(`${data.username}: ${data.message}`);
    const onReplaced = () =>
      setGameMessage(
        "This table is open on another device. Reopen the app to take over.",
      );
    const onExpired = () => {
      setGameMessage(
        "Your session expired. Sign in again to recover your table.",
      );
      void restoreSession();
    };
    socket.on("session:replaced", onReplaced);
    socket.on("session:expired", onExpired);
    socket.on("chat:message", onChat);
    socket.on("room:state", onRoom);
    socket.on("room:left", onLeft);
    socket.on("disconnect", onDisconnect);
    socket.on("game:state", onState);
    socket.on("game:ended", onEnded);
    socket.on("referral:rewarded", onReferralRewarded);
    return () => {
      socket.off("session:replaced", onReplaced);
      socket.off("session:expired", onExpired);
      socket.off("chat:message", onChat);
      socket.off("room:state", onRoom);
      socket.off("room:left", onLeft);
      socket.off("disconnect", onDisconnect);
      socket.off("game:state", onState);
      socket.off("game:ended", onEnded);
      socket.off("referral:rewarded", onReferralRewarded);
    };
  }, [token, router, restoreSession, setGameMessage, updateFromServer]);
}
