/** Local visual fixtures only. Not a Vite production entry point. */
import React, { useState, useRef, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { MotionConfig } from "framer-motion";
import { App } from "../src/App";
import { EnhancedGameTable } from "../src/components/EnhancedGameTable";
import { LobbyScreen } from "../src/pages/LobbyScreen";
import { useGameStore } from "../src/stores/gameStore";
import { useAuthStore } from "../src/stores/authStore";
import { useUIStore } from "../src/stores/uiStore";
import { initializeGame } from "../src/game/gameEngine";
import "../src/index.css";

if (
  !import.meta.env.DEV ||
  !["localhost", "127.0.0.1"].includes(location.hostname)
)
  throw new Error("Local review only");
const configuredApi = import.meta.env.VITE_API_URL;
if (configuredApi && !["localhost", "127.0.0.1"].includes(new URL(configuredApi).hostname)) {
  throw new Error("Motion review requires a local API; production accounts must not be used");
}
useUIStore.setState({
  soundEnabled: false,
  musicEnabled: false,
  hapticsEnabled: false,
});
useAuthStore.setState({
  user: {
    id: "review-you",
    username: "You",
    chips: 10000,
    equippedItems: {},
  } as any,
});
function showHand(revealed = false, finished = false) {
  const game = initializeGame(
    "review-room",
    [
      { userId: "review-you", username: "You", chips: 5000 },
      { userId: "review-friend", username: "Maya", chips: 5000 },
    ],
    50,
  );
  game.session.id = "review-hand";
  game.session.dealerPosition = 1;
  game.session.players.forEach((p, i) => {
    p.id = `review-player-${i}`;
    p.isTurn = i === 0 && !finished;
    p.isDealer = i === 1;
    p.isBlind = !revealed;
    p.user = { username: i === 0 ? "You" : "Maya" } as any;
    p.cards =
      i === 0
        ? ([
            { suit: "spades", rank: "A", value: 14 },
            { suit: "hearts", rank: "A", value: 14 },
            { suit: "clubs", rank: "A", value: 14 },
          ] as any)
        : [];
  });
  if (!revealed)
    game.session.players.forEach((p) => {
      p.cards = [];
    });
  game.currentPlayerIndex = 0;
  game.isGameOver = finished;
  game.winners = finished ? ["review-player-0"] : [];
  useGameStore.setState({
    gameState: game,
    myPlayerId: "review-player-0",
    myCards: revealed ? game.session.players[0].cards! : [],
    showCards: revealed,
    isMyTurn: !finished,
    availableActions: finished
      ? []
      : ["pack", revealed ? "chaal" : "blind", "raise"],
    serverGameState: {
      canSeeCards: !revealed && !finished,
      turnStartedAt: Date.now(),
      turnTimeoutMs: 30000,
      serverTime: Date.now(),
      status: finished ? "finished" : "playing",
      version: revealed ? 2 : 1,
      sessionId: "review-hand",
      payouts: { "review-player-0": "100" },
    } as any,
    gameMessage: finished ? "Hand complete" : "Your turn",
    currentRoom: null,
  });
}
const params = new URLSearchParams(location.search);
const initialScene = ["blind", "revealed", "winner"].includes(
  params.get("scene") || "",
)
  ? params.get("scene")!
  : "lobby";
if (initialScene !== "lobby")
  showHand(initialScene !== "blind", initialScene === "winner");
function Review() {
  const [scene, setScene] = useState(initialScene);
  const [reduced, setReduced] = useState(params.get("reduced") === "1");
  const [hidden, setHidden] = useState(false);
  const [metrics, setMetrics] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  function measure() {
    const nodes = [...document.querySelectorAll("[role=main] *")];
    const before = nodes.map((e) => e.getAttribute("style"));
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const running = document
        .getAnimations()
        .filter((a) => a.playState === "running");
      const offscreen = running.filter((a) => {
        const el = (a.effect as KeyframeEffect)?.target as Element;
        if (!el) return false;
        const r = el.getBoundingClientRect();
        return (
          r.bottom <= 0 ||
          r.top >= innerHeight ||
          r.right <= 0 ||
          r.left >= innerWidth
        );
      });
      setMetrics(
        JSON.stringify({
          nodes: document.querySelectorAll("*").length,
          canvas: document.querySelectorAll("canvas").length,
          running: running.length,
          offscreen: offscreen.length,
          inlineChanges: nodes.filter(
            (e, i) => e.getAttribute("style") !== before[i],
          ).length,
        }),
      );
    }, 700);
  }
  return (
    <MotionConfig reducedMotion={reduced ? "always" : "user"}>
      <div data-review-reduced={reduced}>
        {params.get("controls") !== "0" && (
          <nav
            aria-label="Review scenes"
            style={{
              position: "relative",
              zIndex: 100,
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              padding: 12,
              background: "#171b22",
              color: "white",
            }}
          >
            <button
              onClick={async () => {
                await useAuthStore.getState().loginAsGuest();
                setScene("live");
              }}
            >
              Live local app
            </button>
            {["lobby", "blind", "revealed", "winner"].map((s) => (
              <button
                key={s}
                onClick={() => {
                  if (s !== "lobby") showHand(s !== "blind", s === "winner");
                  setScene(s);
                }}
              >
                {s}
              </button>
            ))}
            <button
              onClick={() => {
                const g = useGameStore.getState().gameState;
                if (g)
                  useGameStore.setState({
                    gameState: {
                      ...g,
                      session: { ...g.session, pot: g.session.pot + 500 },
                    },
                  });
              }}
            >
              Add chips
            </button>
            <label>
              <input
                type="checkbox"
                checked={hidden}
                onChange={(e) => setHidden(e.target.checked)}
              />{" "}
              Hide table
            </label>
            <button onClick={measure}>Measure motion</button>
            <output aria-label="Motion measurements">{metrics}</output>
            <label>
              <input
                type="checkbox"
                checked={reduced}
                onChange={(e) => setReduced(e.target.checked)}
              />{" "}
              Reduced motion
            </label>
          </nav>
        )}
        {scene === "live" ? (
          <App />
        ) : scene === "lobby" ? (
          <LobbyScreen
            onJoinGame={async () => {}}
            onCreateGame={() => {
              showHand();
              setScene("blind");
            }}
            onQuickPlay={async () => {
              showHand();
              setScene("blind");
            }}
            onJoinByCode={() => {
              showHand();
              setScene("blind");
            }}
            onLeaveTable={async () => true}
            onNavigate={() => setScene("lobby")}
          />
        ) : (
          <div
            style={{ height: "100dvh", display: hidden ? "none" : undefined }}
          >
            <EnhancedGameTable onLeave={() => setScene("lobby")} />
          </div>
        )}
      </div>
    </MotionConfig>
  );
}
const root = createRoot(document.getElementById("root")!);
root.render(<Review />);
if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());
