import {
  useMotionActivity,
  useMotionPreference,
} from "../motion/useMotionActivity";
import { motionTiming } from "../motion/tokens";
import { useTranslation } from "../i18n";
import { socketService } from "../services/socket";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  LogOut,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { useGameStore } from "../stores/gameStore";
import { useAuthStore } from "../stores/authStore";
import { useUIStore } from "../stores/uiStore";
import { useHaptics } from "../hooks/useHaptics";
import { BettingControls } from "./BettingControls";
import { ChatPanel } from "./ChatPanel";
import { WinnerCelebration } from "./Celebrations";
import { PremiumCard, PremiumCardFan } from "./PremiumCard";
import { CharacterAvatar } from "./AvatarSystem";
import { PotGlow, TurnPulse } from "./GameJuice";
import { cn } from "../utils/cn";
import { ActionType, GamePlayer } from "../types";
import { evaluateHand, getHandRankName } from "../game/handRanking";
import { premiumSounds } from "../services/premiumSounds";
import { AnimatedChipCount, ParallaxBackground } from "./PolishTouches";

// ─── AI Player Name Map ────────────────────────────────────────────────────
const AI_NAMES: Record<string, string> = {
  "ai-sharma": "Sharma Ji",
  "ai-priya": "Priya",
  "ai-bunty": "Bunty",
  "ai-meera": "Meera",
  "ai-raja": "Raja",
  "ai-anita": "Anita",
  "ai-vikram": "Vikram",
  "ai-deepa": "Deepa",
};

// Map AI player IDs to CharacterAvatar IDs
const AI_AVATAR_IDS: Record<string, string> = {
  "ai-sharma": "sharma_ji",
  "ai-priya": "priya",
  "ai-bunty": "bunty",
  "ai-meera": "meera",
  "ai-raja": "raja",
  "ai-anita": "anita",
  "ai-vikram": "vikram",
  "ai-deepa": "deepa",
};

// ─── Seat Positions (trigonometric around oval) ────────────────────────────
// For a 4-player game on mobile: bottom (you), left, top, right
// Positions are % of container width/height

interface SeatPosition {
  top: string;
  left: string;
  cardSide: "above" | "below" | "left" | "right";
  betOffset: { top: string; left: string };
}

function getSeatPositions(playerCount: number): SeatPosition[] {
  // Hand-tuned positions for each player count
  if (playerCount === 2) {
    return [
      {
        top: "82%",
        left: "50%",
        cardSide: "above",
        betOffset: { top: "-35%", left: "0" },
      },
      {
        top: "8%",
        left: "50%",
        cardSide: "below",
        betOffset: { top: "35%", left: "0" },
      },
    ];
  }
  if (playerCount === 3) {
    return [
      {
        top: "82%",
        left: "50%",
        cardSide: "above",
        betOffset: { top: "-30%", left: "0" },
      },
      {
        top: "25%",
        left: "12%",
        cardSide: "right",
        betOffset: { top: "10%", left: "30%" },
      },
      {
        top: "25%",
        left: "88%",
        cardSide: "left",
        betOffset: { top: "10%", left: "-30%" },
      },
    ];
  }
  if (playerCount === 4) {
    return [
      {
        top: "82%",
        left: "50%",
        cardSide: "above",
        betOffset: { top: "-28%", left: "0" },
      },
      {
        top: "50%",
        left: "8%",
        cardSide: "right",
        betOffset: { top: "-5%", left: "25%" },
      },
      {
        top: "8%",
        left: "50%",
        cardSide: "below",
        betOffset: { top: "28%", left: "0" },
      },
      {
        top: "50%",
        left: "92%",
        cardSide: "left",
        betOffset: { top: "-5%", left: "-25%" },
      },
    ];
  }
  if (playerCount === 5) {
    return [
      {
        top: "85%",
        left: "50%",
        cardSide: "above",
        betOffset: { top: "-25%", left: "0" },
      },
      {
        top: "60%",
        left: "6%",
        cardSide: "right",
        betOffset: { top: "-10%", left: "22%" },
      },
      {
        top: "12%",
        left: "22%",
        cardSide: "below",
        betOffset: { top: "25%", left: "10%" },
      },
      {
        top: "12%",
        left: "78%",
        cardSide: "below",
        betOffset: { top: "25%", left: "-10%" },
      },
      {
        top: "60%",
        left: "94%",
        cardSide: "left",
        betOffset: { top: "-10%", left: "-22%" },
      },
    ];
  }
  // 6 players
  return [
    {
      top: "85%",
      left: "50%",
      cardSide: "above",
      betOffset: { top: "-22%", left: "0" },
    },
    {
      top: "65%",
      left: "6%",
      cardSide: "right",
      betOffset: { top: "-10%", left: "20%" },
    },
    {
      top: "20%",
      left: "10%",
      cardSide: "right",
      betOffset: { top: "10%", left: "20%" },
    },
    {
      top: "8%",
      left: "50%",
      cardSide: "below",
      betOffset: { top: "22%", left: "0" },
    },
    {
      top: "20%",
      left: "90%",
      cardSide: "left",
      betOffset: { top: "10%", left: "-20%" },
    },
    {
      top: "65%",
      left: "94%",
      cardSide: "left",
      betOffset: { top: "-10%", left: "-20%" },
    },
  ];
}

function getPlayerDisplayName(
  player: GamePlayer,
  isCurrentUser: boolean,
): string {
  if (isCurrentUser) return "You";
  // Check AI name map
  const aiName = AI_NAMES[player.userId];
  if (aiName) return aiName;
  return player.user?.username || `Player ${player.seatPosition + 1}`;
}

// ─── Component ─────────────────────────────────────────────────────────────

interface EnhancedGameTableProps {
  onLeave?: () => void;
}

export function EnhancedGameTable({ onLeave }: EnhancedGameTableProps) {
  const tableRef = useRef<HTMLDivElement>(null);
  const motionActive = useMotionActivity(tableRef);
  const reduced = useMotionPreference();
  const {
    gameState,
    myCards,
    isMyTurn,
    availableActions,
    showCards,
    toggleShowCards,
    performOnlineAction,
    chatMessages,
    isChatOpen,
    toggleChat,
    gameMessage,
    currentRoom,
    myPlayerId,
    serverGameState,
    isProcessing,
    roomSnapshot,
  } = useGameStore();

  const { user } = useAuthStore();
  const { t } = useTranslation();
  const { soundEnabled, toggleSound } = useUIStore();
  const { onTurn, onWin, onButtonPress } = useHaptics();

  const [timeLeft, setTimeLeft] = useState(30);
  const [turnAnnouncement, setTurnAnnouncement] = useState("");
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [showWinCelebration, setShowWinCelebration] = useState(false);
  const [winner, setWinner] = useState<{
    name: string;
    amount: number;
    handRank: any;
  } | null>(null);
  const timeoutSubmittedRef = useRef(false);

  const submitAction = useCallback(
    (action: ActionType, amount?: number) => {
      void performOnlineAction(action, amount);
    },
    [performOnlineAction],
  );

  // Play dealing sound when game starts
  useEffect(() => {
    if (gameState && !gameState.isGameOver) {
      setWinner(null);
      setShowWinCelebration(false);
      premiumSounds.init();
      const dealTimers = session.players.map((_, i) =>
        window.setTimeout(() => premiumSounds.play("card_deal"), 200 + i * 150),
      );
      premiumSounds.play("game_start");
      return () => dealTimers.forEach((timer) => window.clearTimeout(timer));
    }
    return undefined;
  }, [gameState?.session.id]);

  // The server owns the deadline. A reconnect never grants extra time.
  useEffect(() => {
    if (!serverGameState || serverGameState.status !== "playing") {
      setTurnAnnouncement("");
      return;
    }
    const initial = Math.max(
      0,
      serverGameState.turnStartedAt +
        serverGameState.turnTimeoutMs -
        serverGameState.serverTime,
    );
    const received = performance.now();
    const tick = () =>
      setTimeLeft(
        Math.max(
          0,
          Math.ceil((initial - (performance.now() - received)) / 1000),
        ),
      );
    tick();
    setTurnAnnouncement(
      isMyTurn ? "Your turn. Choose an action before the timer expires." : "",
    );
    const timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  }, [serverGameState?.version, serverGameState?.sessionId, isMyTurn]);

  // Win detection
  useEffect(() => {
    if (gameState?.isGameOver && gameState.winners.length > 0) {
      const wp = gameState.session.players.find((p) =>
        gameState.winners.includes(p.id),
      );
      if (wp) {
        const hand = wp.cards ? evaluateHand(wp.cards) : null;
        setWinner({
          name: getPlayerDisplayName(wp, wp.userId === user?.id),
          amount: Number(serverGameState?.payouts[wp.id] || 0),
          handRank: hand?.rank,
        });
        if (wp.userId === user?.id) {
          onWin();
          // Tiered win sound based on pot size
          if (gameState.session.pot >= 10000) premiumSounds.play("win_jackpot");
          else if (gameState.session.pot >= 2000) premiumSounds.play("win_big");
          else premiumSounds.play("win_small");
        } else {
          premiumSounds.play("lose");
        }
        // Reveal all cards with staggered card flip sounds
        const revealTimers = gameState.session.players.map((_, i) =>
          window.setTimeout(() => premiumSounds.play("card_flip"), i * 200),
        );
        const celebrationTimer = window.setTimeout(
          () => setShowWinCelebration(true),
          reduced ? 0 : 400,
        );
        return () => {
          revealTimers.forEach((timer) => window.clearTimeout(timer));
          window.clearTimeout(celebrationTimer);
        };
      }
    }
    return undefined;
  }, [gameState?.isGameOver]);

  const handleAction = useCallback(
    (action: ActionType, amount?: number) => {
      timeoutSubmittedRef.current = true;
      setTurnAnnouncement(
        `${action === "pack" ? "Pack" : action} submitted. Waiting for the server to confirm.`,
      );
      onButtonPress();
      // Premium sounds
      if (["chaal", "blind", "raise"].includes(action)) {
        premiumSounds.play("chip_single");
      } else if (action === "pack") {
        premiumSounds.play("card_fold");
      } else if (action === "show") {
        premiumSounds.play("show_reveal");
      }
      submitAction(action, amount);
    },
    [submitAction, onButtonPress],
  );

  const orderedPlayers = useMemo(() => {
    const players = gameState?.session.players ?? [];
    const myIndex = players.findIndex(
      (player) => player.id === myPlayerId || player.userId === user?.id,
    );
    if (myIndex <= 0) return players;
    return [...players.slice(myIndex), ...players.slice(0, myIndex)];
  }, [gameState?.session.players, myPlayerId, user?.id]);

  const seatPositions = useMemo(
    () => getSeatPositions(orderedPlayers.length || 4),
    [orderedPlayers.length],
  );

  if (!gameState) {
    return (
      <div
        className="flex h-full items-center justify-center bg-[var(--color-background)]"
        role="status"
        aria-live="polite"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="h-12 w-12 rounded-full border-4 border-[#E8B04A]/20 border-t-[#E8B04A]"
          aria-hidden="true"
        />
        <span className="ml-4 text-sm font-medium text-[#C7D3CC]">
          Waiting for verified table state…
        </span>
      </div>
    );
  }

  const { session } = gameState;
  const myPlayer = orderedPlayers.find(
    (player) => player.id === myPlayerId || player.userId === user?.id,
  );

  return (
    <div
      ref={tableRef}
      data-motion-active={motionActive}
      data-table-theme={user?.equippedItems?.TABLE_THEME}
      className="relative h-full w-full overflow-hidden bg-[var(--color-background)] text-[var(--color-text)]"
      role="main"
      aria-label="Teen Patti game table"
    >
      <div className="sr-only" aria-live="assertive" aria-atomic="true">
        {turnAnnouncement}
      </div>
      <div
        className="absolute top-16 left-1/2 z-40 -translate-x-1/2 rounded-lg bg-[var(--color-background)] px-3 text-sm text-[#FFFBEA]"
        role="status"
      >
        {roomSnapshot?.players.find((p) => p.odic === user?.id)?.leaving
          ? "You packed. Your remaining chips return when this hand ends."
          : gameMessage}
      </div>
      {/* Parallax particle background */}
      <ParallaxBackground intensity={0.6} className="z-0" />

      {/* Ambient lighting — overhead lamp effect */}
      <div className="absolute inset-0 pointer-events-none z-[1]">
        <div className="absolute left-1/2 top-[40%] h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#163E2D] opacity-20 blur-[180px]" />
      </div>

      {/* ─── Header (minimal, clean) ──────────────────────────────────── */}
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-30 flex items-center justify-between px-4 py-2 pt-3"
      >
        <div className="relative">
          <button
            type="button"
            aria-label="Leave table"
            aria-expanded={confirmLeave}
            onClick={() => setConfirmLeave((value) => !value)}
            className="rounded-full border border-white/10 bg-[#0E1B17] p-2.5 text-[#8E9C94] active:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B04A]"
          >
            <LogOut className="h-4 w-4" />
          </button>
          {confirmLeave && (
            <div
              role="group"
              aria-label="Confirm leaving the table"
              className="absolute left-0 top-12 w-64 rounded-[14px] bg-[#101B17] p-3 shadow-[0_18px_45px_rgba(0,0,0,0.42),inset_0_0_0_1px_#654339]"
            >
              <p className="text-xs leading-5 text-[#E9C8BE]">
                Leave this table? Your hand is packed now. Remaining chips
                return when the hand ends.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmLeave(false)}
                  className="min-h-10 rounded-[10px] bg-[#193126] px-3 text-xs font-semibold text-[#FFFBEA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B04A]"
                >
                  Stay
                </button>
                <button
                  type="button"
                  onClick={onLeave}
                  className="min-h-10 rounded-[10px] bg-[#3A1D18] px-3 text-xs font-semibold text-[#F4D1C8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B04A]"
                >
                  Leave
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden rounded-full border border-white/10 bg-[#0E1B17] px-3 py-1.5 text-xs font-medium text-[#C7D3CC] sm:block">
            {currentRoom?.name || "Table"}
          </div>
          <details className="group relative">
            <summary className="flex min-h-10 cursor-pointer list-none items-center gap-1.5 rounded-full border border-[#E8B04A]/25 bg-[#10231B] px-3 text-xs font-semibold text-[#D8C69D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B04A]">
              <ShieldCheck className="h-4 w-4 text-[#E8B04A]" /> Server dealt ·
              verified
            </summary>
            <div className="absolute left-1/2 top-12 w-64 -translate-x-1/2 rounded-[14px] bg-[#101B17] p-3 text-xs leading-5 text-[#C7D3CC] shadow-[0_18px_45px_rgba(0,0,0,0.42),inset_0_0_0_1px_#3A5145]">
              The server shuffles, deals, validates each action, and keeps every
              player on the same table state.
            </div>
          </details>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={soundEnabled ? "Mute sound" : "Turn on sound"}
            onClick={toggleSound}
            className="rounded-full border border-white/10 bg-[#0E1B17] p-2.5 text-[#8E9C94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B04A]"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>
          <button
            type="button"
            aria-label="Open table chat"
            onClick={toggleChat}
            className="relative rounded-full border border-white/10 bg-[#0E1B17] p-2.5 text-[#8E9C94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B04A]"
          >
            <MessageCircle className="w-4 h-4" />
            {chatMessages.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                {chatMessages.length}
              </span>
            )}
          </button>
        </div>
      </motion.header>

      {/* ─── Game Table ───────────────────────────────────────────────── */}
      <div
        data-game-surface
        className="relative z-10 flex-1"
        style={{ height: "calc(100dvh - 180px)", minHeight: "400px" }}
      >
        {/* Table felt (oval) */}
        <div
          data-game-felt
          data-player-count={orderedPlayers.length}
          className="absolute left-1/2 top-1/2 w-[88%] max-w-[360px] -translate-x-1/2 -translate-y-[52%] sm:max-w-[440px] lg:max-w-[560px] xl:max-w-[620px]"
          style={{ aspectRatio: "1 / 1.12" }}
        >
          {/* Outer rim */}
          <div className="absolute inset-0 rounded-[50%] bg-[#4A2E1C] shadow-[0_8px_40px_rgba(0,0,0,0.6)]" />

          {/* Gold trim */}
          <div className="absolute inset-[6px] rounded-[50%] border-[2px] border-[#E8B04A]/40" />

          {/* Felt surface */}
          <div className="absolute inset-[10px] rounded-[50%] bg-[#163E2D] shadow-[inset_0_0_60px_rgba(0,0,0,0.5)]">
            {/* Felt texture */}
            <div
              className="absolute inset-0 rounded-[50%] opacity-[0.08]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                backgroundSize: "128px 128px",
              }}
            />

            {/* Inner line decoration */}
            <div className="absolute inset-[16px] rounded-[50%] border border-[#E8B04A]/10" />
          </div>

          {/* Pot glow effect */}
          <PotGlow
            amount={session.pot}
            className="game-pot-glow absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24"
          />

          {/* ─── Pot Display (center of table) ──────────────────────── */}
          <motion.div
            data-pot-display
            className="absolute top-[40%] left-1/2 flex flex-col items-center z-10"
            style={{ x: "-50%", y: "-50%" }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
          >
            {/* Chip stack visual */}
            <div className="flex -space-x-2 mb-1">
              {Array.from({
                length: Math.min(Math.ceil(session.pot / 200), 5),
              }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 + i * 0.08 }}
                  className="w-7 h-7 rounded-full border-2 border-dashed relative"
                  style={{
                    backgroundColor: [
                      "#B74035",
                      "#245A7A",
                      "#3F7655",
                      "#76517F",
                      "#E8B04A",
                    ][i % 5],
                    borderColor: "rgba(255,255,255,0.3)",
                    zIndex: 5 - i,
                  }}
                >
                  <div className="absolute inset-[3px] rounded-full border border-white/20" />
                </motion.div>
              ))}
            </div>
            <AnimatedChipCount
              value={session.pot}
              prefix="◉ "
              className="text-lg font-bold text-[#E8B04A] drop-shadow-[0_0_12px_rgba(232,176,74,0.35)]"
            />
            <span className="mt-0.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
              Pot
            </span>
          </motion.div>

          {serverGameState?.lastAction && (
            <div className="absolute top-[55%] left-1/2 -translate-x-1/2 text-xs text-white/70 whitespace-nowrap">
              {
                serverGameState.players.find(
                  (p) => p.id === serverGameState.lastAction?.playerId,
                )?.username
              }
              : {serverGameState.lastAction.action.replace(/_/g, " ")}
              {serverGameState.lastAction.amount
                ? ` · ${serverGameState.lastAction.amount}`
                : ""}
            </div>
          )}
          {/* ─── Game Status Messages ────────────────────────────────── */}
          <AnimatePresence>
            {gameMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute top-[62%] left-1/2 -translate-x-1/2 z-20"
              >
                <div className="px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10">
                  <span className="text-xs font-medium text-[#E8B04A]">
                    {gameMessage}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Players Around Table ────────────────────────────────── */}
          {orderedPlayers.map((player, index) => {
            const seat = seatPositions[index];
            if (!seat) return null;
            const isMe = player.id === myPlayer?.id;
            const displayName = getPlayerDisplayName(player, isMe);
            const isActive =
              player.status === "playing" || player.status === "show";
            const isFolded = player.status === "folded";

            return (
              <motion.div
                key={player.id}
                data-self-seat={isMe}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
                style={{
                  top: seat.top,
                  left: seat.left,
                  x: "-50%",
                  y: "-50%",
                  filter: isFolded ? "grayscale(0.8)" : undefined,
                }}
                initial={reduced ? false : { opacity: 0, scale: 0.98 }}
                animate={{
                  opacity: isFolded ? 0.35 : 1,
                  scale: isFolded ? 0.9 : 1,
                }}
                transition={{
                  duration: motionTiming.state,
                  ease: motionTiming.ease,
                }}
              >
                {/* Player cards — premium design */}
                {isActive && player.cards && !isMe && (
                  <div
                    className={cn(
                      "absolute flex gap-0.5",
                      seat.cardSide === "above" &&
                        "-top-14 left-1/2 -translate-x-1/2",
                      seat.cardSide === "below" &&
                        "-bottom-14 left-1/2 -translate-x-1/2",
                      seat.cardSide === "left" &&
                        "top-1/2 -translate-y-1/2 -left-16",
                      seat.cardSide === "right" &&
                        "top-1/2 -translate-y-1/2 -right-16",
                    )}
                  >
                    {(player.cards.length
                      ? player.cards
                      : [undefined, undefined, undefined]
                    ).map((card, ci) => (
                      <motion.div
                        key={ci}
                        initial={{ y: -15, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{
                          delay: ci * 0.1,
                          type: "spring",
                          damping: 20,
                        }}
                      >
                        <PremiumCard
                          card={card}
                          hidden={!showCards && !gameState.isGameOver}
                          size="sm"
                        />
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Bet amount (toward center) */}
                {player.currentBet > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute z-[5]"
                    style={{
                      top: seat.betOffset.top,
                      left: seat.betOffset.left,
                    }}
                  >
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 border border-white/10">
                      <div className="h-3 w-3 rounded-full border border-white/30 bg-[#E8B04A]" />
                      <AnimatedChipCount
                        value={player.currentBet}
                        prefix="◉ "
                        className="text-xs font-bold text-[#E8B04A]"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Avatar + name */}
                <div className="flex flex-col items-center">
                  <div className="relative">
                    {/* Turn ring */}
                    {player.isTurn && (
                      <motion.div
                        className="absolute -inset-[3px] rounded-full"
                        style={{
                          background: `conic-gradient(from 0deg, #22c55e, #eab308, #ef4444, #22c55e)`,
                          mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 2px))",
                          WebkitMask:
                            "radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 2px))",
                        }}
                        animate={{
                          opacity: motionActive ? [0.4, 1, 0.7] : 0.7,
                        }}
                        transition={{
                          repeat: motionActive ? 1 : 0,
                          duration: motionActive ? 0.6 : 0,
                          ease: "linear",
                        }}
                      />
                    )}

                    {/* Avatar — premium character or user initial */}
                    <motion.div
                      className={cn(
                        "relative",
                        isFolded && "grayscale opacity-60",
                        gameState.isGameOver &&
                          gameState.winners.some((wId) => {
                            const wp = session.players.find(
                              (p) => p.id === wId,
                            );
                            return wp?.userId === player.userId;
                          }) &&
                          "drop-shadow-[0_0_12px_rgba(234,179,8,0.7)]",
                      )}
                      style={{
                        filter: player.isTurn
                          ? "drop-shadow(0 0 8px rgba(234,179,8,0.35))"
                          : undefined,
                      }}
                    >
                      {!isMe && AI_AVATAR_IDS[player.userId] ? (
                        <CharacterAvatar
                          characterId={AI_AVATAR_IDS[player.userId] as any}
                          size={isMe ? "lg" : "md"}
                          showFrame={player.isTurn}
                        />
                      ) : (
                        <div
                          className={cn(
                            "rounded-full flex items-center justify-center font-bold text-white border-2",
                            isMe
                              ? "w-14 h-14 border-[#E8B04A]/60 bg-[#B74035] text-lg"
                              : "w-11 h-11 border-white/20 bg-[#245A7A] text-sm",
                          )}
                        >
                          {displayName[0].toUpperCase()}
                        </div>
                      )}
                    </motion.div>

                    {/* Dealer chip */}
                    {player.isDealer && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-[#F6ECD8]/40 bg-[#E8B04A] shadow-lg"
                      >
                        <span className="text-xs font-black text-[#171006]">
                          D
                        </span>
                      </motion.div>
                    )}

                    {/* Blind/Seen badge */}
                    <div
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white",
                        player.isBlind ? "bg-blue-600" : "bg-green-600",
                      )}
                    >
                      {player.isBlind ? (
                        <EyeOff className="w-2 h-2" />
                      ) : (
                        <Eye className="w-2 h-2" />
                      )}
                    </div>
                  </div>

                  {/* Name + chips */}
                  <div className="flex flex-col items-center mt-1 px-2 py-0.5 rounded-lg bg-black/40 backdrop-blur-sm">
                    <span
                      className={cn(
                        "max-w-[72px] truncate text-xs font-semibold leading-tight",
                        isMe ? "text-[#E8B04A]" : "text-white",
                      )}
                    >
                      {displayName}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-bold leading-tight",
                        isFolded ? "text-red-400" : "text-green-400",
                      )}
                    >
                      {isFolded ? (
                        "PACKED"
                      ) : (
                        <AnimatedChipCount
                          value={player.chipsInPlay}
                          prefix="◉ "
                          className="text-xs font-bold leading-tight"
                        />
                      )}
                    </span>
                  </div>

                  {/* Timer for current turn */}
                  {player.isTurn && !isMe && (
                    <div className="flex items-center gap-0.5 mt-0.5">
                      <Clock className="w-2.5 h-2.5 text-yellow-400" />
                      <span
                        className={cn(
                          "text-xs font-bold",
                          timeLeft > 15
                            ? "text-green-400"
                            : timeLeft > 5
                              ? "text-yellow-400"
                              : "text-red-400",
                        )}
                      >
                        {timeLeft}s
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ─── My Cards (floating, prominent) ───────────────────────────── */}
      {(myCards.length > 0 || serverGameState?.canSeeCards) &&
        myPlayer?.status !== "folded" && (
          <motion.div
            data-my-cards
            style={{ x: "-50%" }}
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", damping: 20 }}
            className={cn(
              "absolute left-1/2 z-40 flex flex-col items-center",
              isMyTurn && !gameState.isGameOver
                ? "bottom-[260px]"
                : "bottom-[60px]",
            )}
          >
            {/* Premium card fan */}
            <PremiumCardFan
              key={session.id}
              cards={
                myCards.length ? myCards : [undefined, undefined, undefined]
              }
              hidden={!showCards}
              size="lg"
              isWinner={
                gameState.isGameOver &&
                gameState.winners.some((wId) => {
                  const wp = session.players.find((p) => p.id === wId);
                  return wp?.userId === user?.id;
                })
              }
            />

            {/* See/Hide button */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={toggleShowCards}
              disabled={
                isProcessing ||
                (!myCards.length && !serverGameState?.canSeeCards)
              }
              className={cn(
                "mt-2 flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold",
                "bg-black/70 backdrop-blur-md border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B04A]",
                showCards
                  ? "text-[#E8B04A] border-[#E8B04A]/30"
                  : "text-white/50 border-white/10",
              )}
            >
              {showCards ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  {t("table_hide_cards")}
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  {t("action_see_cards")}
                </>
              )}
            </motion.button>

            {/* Hand rank badge */}
            <AnimatePresence>
              {showCards && myCards.length === 3 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="mt-1.5 rounded-full border border-[#E8B04A]/30 bg-[#2A1714] px-4 py-1"
                >
                  <span className="text-xs font-bold tracking-wide text-[#E8B04A]">
                    {getHandRankName(evaluateHand(myCards).rank)}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

      {/* ─── Betting Controls ─────────────────────────────────────────── */}
      {isMyTurn && !gameState.isGameOver && (
        <BettingControls
          availableActions={availableActions}
          currentBet={session.currentBet}
          minBet={session.bootAmount}
          maxBet={
            (myPlayer?.isBlind ? session.currentBet : session.currentBet * 2) *
            2
          }
          isBlind={myPlayer?.isBlind ?? true}
          playerChips={myPlayer?.chipsInPlay || 0}
          pot={session.pot}
          onAction={handleAction}
          disabled={isProcessing}
        />
      )}

      {/* Waiting indicator — shows whose turn it is */}
      {!isMyTurn && !gameState.isGameOver && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+1.5rem)] left-1/2 z-10 -translate-x-1/2"
        >
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10">
            <motion.div
              className="h-1.5 w-1.5 rounded-full bg-[#E8B04A]"
              animate={{ opacity: motionActive ? [0.5, 1, 0.5] : 0.7 }}
              transition={{
                repeat: motionActive ? 1 : 0,
                duration: motionActive ? 0.6 : 0,
              }}
            />
            <span className="text-white/60 text-xs">
              {(() => {
                const turnPlayer = session.players.find((p) => p.isTurn);
                if (!turnPlayer) return "Waiting...";
                const name = getPlayerDisplayName(turnPlayer, false);
                return `${name}'s turn`;
              })()}
            </span>
          </div>
        </motion.div>
      )}

      {/* My turn timer */}
      {isMyTurn && !gameState.isGameOver && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          data-turn-clock
          className="fixed bottom-[260px] right-4 z-20 flex items-center gap-2 rounded-[14px] bg-[#101B17] p-2 shadow-[0_14px_32px_rgba(0,0,0,0.32),inset_0_0_0_1px_#3A5145]"
        >
          <div className="relative w-12 h-12">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="3"
              />
              <motion.circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke={timeLeft > 5 ? "#E0BD76" : "#D37A68"}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${(timeLeft / ((serverGameState?.turnTimeoutMs || 30000) / 1000)) * 126} 126`}
              />
            </svg>
            <span
              className={cn(
                "absolute inset-0 flex items-center justify-center text-sm font-bold",
                timeLeft > 5 ? "text-[#E0BD76]" : "text-[#E9A596]",
              )}
            >
              {timeLeft}
            </span>
          </div>
          <span className="hidden pr-1 text-xs leading-5 text-[#C7D3CC] sm:block">
            <strong className="block text-[#FFFBEA]">Your turn</strong>Packs
            automatically at 0
          </span>
        </motion.div>
      )}

      {/* Game Over */}
      {gameState.isGameOver && !showWinCelebration && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+2rem)] left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2"
        >
          <button
            type="button"
            onClick={() =>
              void socketService
                .setReady(true)
                .then((r) => {
                  if (!r.success)
                    useGameStore
                      .getState()
                      .setGameMessage(r.error || "Could not ready");
                })
                .catch((e) => useGameStore.getState().setGameMessage(e.message))
            }
            disabled={
              roomSnapshot?.players.find((p) => p.odic === user?.id)?.isReady
            }
            className="rounded-2xl bg-[#E8B04A] px-8 py-3 font-bold text-[#171006] disabled:opacity-50"
          >
            {roomSnapshot?.players.find((p) => p.odic === user?.id)?.isReady
              ? t("state_waiting")
              : t("table_next_hand")}
          </button>
          <button
            type="button"
            onClick={onLeave}
            className="rounded-2xl bg-[#E8B04A] px-8 py-3 font-bold text-[#171006] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFF9ED]"
          >
            Return to lobby
          </button>
        </motion.div>
      )}

      {/* Chat */}
      <AnimatePresence>
        {isChatOpen && <ChatPanel onClose={toggleChat} />}
      </AnimatePresence>

      {/* Winner Celebration */}
      {winner && (
        <WinnerCelebration
          isVisible={showWinCelebration}
          winnerName={winner.name}
          amount={winner.amount}
          handRank={winner.handRank}
          onClose={() => {
            setShowWinCelebration(false);
            setWinner(null);
          }}
        />
      )}

      {/* Turn pulse — golden vignette when it's your turn */}
      <TurnPulse isMyTurn={isMyTurn && !gameState.isGameOver} />
    </div>
  );
}
