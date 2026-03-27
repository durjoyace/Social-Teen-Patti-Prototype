# Frontend Excellence Research: World-Class Mobile Card Game

**Stack**: React 18 + TypeScript + Vite + Tailwind 3.4 + Framer Motion 11 + Capacitor 8 + Howler.js + Zustand + Socket.io-client

---

## 1. Card Game UI Patterns

### 1.1 Card Flip Animation (3D CSS Transforms + Framer Motion)

The foundation of any card game. Uses `rotateY` with `perspective` and `backfaceVisibility: hidden`.

```tsx
// components/game/Card.tsx
import { motion } from 'framer-motion';

interface CardProps {
  isRevealed: boolean;
  suit: string;
  rank: string;
  delay?: number;
}

const Card = ({ isRevealed, suit, rank, delay = 0 }: CardProps) => {
  return (
    <motion.div
      className="relative w-16 h-24 md:w-20 md:h-28"
      style={{ perspective: 1000 }}
    >
      <motion.div
        animate={{ rotateY: isRevealed ? 180 : 0 }}
        transition={{
          duration: 0.6,
          delay,
          type: 'spring',
          stiffness: 260,
          damping: 20,
        }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative w-full h-full"
      >
        {/* Card Back */}
        <motion.div
          className="absolute inset-0 rounded-lg bg-gradient-to-br from-red-800 to-red-950 border border-yellow-600/30 shadow-lg"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="absolute inset-1 rounded border border-yellow-600/20 flex items-center justify-center">
            <div className="w-8 h-8 bg-yellow-600/20 rounded-full" />
          </div>
        </motion.div>

        {/* Card Front */}
        <motion.div
          className="absolute inset-0 rounded-lg bg-white shadow-lg flex flex-col items-center justify-center"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <span className="text-2xl font-bold">{rank}</span>
          <span className="text-xl">{suit}</span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
```

### 1.2 Card Dealing Animation (Arc Trajectory + Stagger)

Cards should deal from a deck position to each player with an arc motion. Use Framer Motion variants with `staggerChildren` for sequential dealing.

```tsx
// components/game/DealAnimation.tsx
import { motion, type Variants } from 'framer-motion';

// Parent container orchestrates staggered dealing
const dealContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,   // 150ms between each card
      delayChildren: 0.3,      // Initial delay before dealing starts
    },
  },
};

// Each card animates from deck center to its target position
const cardDealVariants: Variants = {
  hidden: {
    x: 0,
    y: 0,
    scale: 0.5,
    opacity: 0,
    rotate: 0,
  },
  visible: (targetPos: { x: number; y: number; rotate: number }) => ({
    x: targetPos.x,
    y: targetPos.y,
    scale: 1,
    opacity: 1,
    rotate: targetPos.rotate,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 25,
      mass: 0.8,
    },
  }),
};

interface DealingHandProps {
  cards: Array<{ id: string; suit: string; rank: string }>;
  targetPositions: Array<{ x: number; y: number; rotate: number }>;
}

const DealingHand = ({ cards, targetPositions }: DealingHandProps) => (
  <motion.div
    className="relative"
    variants={dealContainerVariants}
    initial="hidden"
    animate="visible"
  >
    {cards.map((card, i) => (
      <motion.div
        key={card.id}
        className="absolute"
        variants={cardDealVariants}
        custom={targetPositions[i]}
      >
        <Card {...card} isRevealed={false} />
      </motion.div>
    ))}
  </motion.div>
);
```

**Arc trajectory**: For a curved dealing path, use keyframes with intermediate waypoints:

```tsx
const arcDealVariants: Variants = {
  hidden: { x: 0, y: 0, opacity: 0 },
  visible: (target: { x: number; y: number }) => ({
    x: [0, target.x * 0.3, target.x],
    y: [0, target.y - 80, target.y],  // Arc upward then to target
    opacity: [0, 1, 1],
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94], // Custom cubic bezier for natural arc
      times: [0, 0.4, 1],
    },
  }),
};
```

### 1.3 Chip Animation (Stack + Bet + Pot)

```tsx
// components/game/ChipStack.tsx
import { motion, AnimatePresence } from 'framer-motion';

const CHIP_COLORS: Record<number, string> = {
  1: 'bg-white border-gray-300',
  5: 'bg-red-600 border-red-800',
  10: 'bg-blue-600 border-blue-800',
  25: 'bg-green-600 border-green-800',
  50: 'bg-purple-600 border-purple-800',
  100: 'bg-black border-yellow-500',
  500: 'bg-yellow-500 border-yellow-700',
};

interface ChipProps {
  value: number;
  index: number;
}

const Chip = ({ value, index }: ChipProps) => {
  const colorClass = CHIP_COLORS[value] || 'bg-gray-600 border-gray-800';
  return (
    <motion.div
      className={`w-10 h-10 rounded-full border-2 ${colorClass} shadow-md flex items-center justify-center`}
      style={{ marginTop: index > 0 ? -32 : 0 }} // Stack overlap
      initial={{ y: -100, opacity: 0, scale: 0.5 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 15,
        delay: index * 0.05,
      }}
    >
      <span className="text-xs font-bold text-white drop-shadow">{value}</span>
    </motion.div>
  );
};

// Animate chips moving from player to pot
const BetAnimation = ({ amount, fromPos, toPos }: {
  amount: number;
  fromPos: { x: number; y: number };
  toPos: { x: number; y: number };
}) => (
  <motion.div
    className="absolute z-50"
    initial={{ x: fromPos.x, y: fromPos.y, scale: 1 }}
    animate={{ x: toPos.x, y: toPos.y, scale: 0.7 }}
    transition={{ duration: 0.4, ease: 'easeInOut' }}
    onAnimationComplete={() => {
      // Trigger pot update in game state
    }}
  >
    <ChipStack amount={amount} />
  </motion.div>
);
```

### 1.4 Pot Visualization

```tsx
// components/game/Pot.tsx
const Pot = ({ amount }: { amount: number }) => (
  <motion.div
    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1"
    layout
  >
    {/* Chip pile visual */}
    <div className="relative w-12 h-8">
      {breakdownChips(amount).map((chip, i) => (
        <motion.div
          key={`pot-chip-${i}`}
          className={`absolute w-10 h-10 rounded-full border-2 ${CHIP_COLORS[chip]}`}
          style={{
            left: (i % 3) * 4,
            top: -i * 3,
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: i * 0.02 }}
        />
      ))}
    </div>
    {/* Amount label */}
    <motion.span
      className="text-yellow-400 font-bold text-sm bg-black/60 px-2 py-0.5 rounded-full"
      key={amount} // Re-animate on amount change
      initial={{ scale: 1.3 }}
      animate={{ scale: 1 }}
    >
      {amount.toLocaleString()}
    </motion.span>
  </motion.div>
);

// Break total amount into denominations
function breakdownChips(amount: number): number[] {
  const denoms = [500, 100, 50, 25, 10, 5, 1];
  const chips: number[] = [];
  let remaining = amount;
  for (const d of denoms) {
    while (remaining >= d && chips.length < 15) { // Cap at 15 visual chips
      chips.push(d);
      remaining -= d;
    }
  }
  return chips;
}
```

### 1.5 Table Layout: Oval with 2-9 Players

Use CSS transforms with trigonometric positioning around an ellipse. The table is the visual anchor; players sit at calculated positions.

```tsx
// components/game/Table.tsx
import { useMemo } from 'react';

interface PlayerPosition {
  x: number;   // percentage from center
  y: number;   // percentage from center
  labelAlign: 'left' | 'right' | 'center';
}

/**
 * Calculate player positions around an elliptical table.
 * Players are distributed evenly, with the current player always at bottom center.
 */
function getPlayerPositions(playerCount: number): PlayerPosition[] {
  const positions: PlayerPosition[] = [];

  for (let i = 0; i < playerCount; i++) {
    // Start from bottom (270 degrees) and go clockwise
    // Current player (index 0) is always at bottom
    const angle = ((2 * Math.PI) / playerCount) * i - Math.PI / 2;

    // Ellipse radii as percentages of container
    const rx = 42; // horizontal radius %
    const ry = 38; // vertical radius %

    const x = 50 + rx * Math.cos(angle);
    const y = 50 + ry * Math.sin(angle);

    const labelAlign = x < 35 ? 'right' : x > 65 ? 'left' : 'center';

    positions.push({ x, y, labelAlign });
  }

  return positions;
}

const Table = ({ players, currentPlayerIndex }: TableProps) => {
  const positions = useMemo(
    () => getPlayerPositions(players.length),
    [players.length]
  );

  return (
    <div className="relative w-full aspect-[4/3] max-w-lg mx-auto">
      {/* Table felt */}
      <div className="absolute inset-[8%] rounded-[50%] bg-gradient-to-b from-green-800 to-green-900 border-[6px] border-amber-900 shadow-[inset_0_0_60px_rgba(0,0,0,0.4)]">
        {/* Inner rail */}
        <div className="absolute inset-3 rounded-[50%] border border-green-600/30" />
        {/* Pot area */}
        <Pot amount={gameState.pot} />
      </div>

      {/* Player seats */}
      {players.map((player, i) => {
        // Reorder so current player is at index 0 (bottom)
        const reorderedIndex = (i - currentPlayerIndex + players.length) % players.length;
        const pos = positions[reorderedIndex];

        return (
          <div
            key={player.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
            }}
          >
            <PlayerSeat player={player} isCurrentTurn={player.isActive} />
          </div>
        );
      })}
    </div>
  );
};
```

**Fixed positions for common counts** (hand-tuned for visual balance):

```tsx
const FIXED_POSITIONS: Record<number, Array<[number, number]>> = {
  2: [[50, 90], [50, 10]],
  3: [[50, 90], [15, 30], [85, 30]],
  4: [[50, 90], [10, 55], [50, 10], [90, 55]],
  5: [[50, 90], [8, 60], [20, 15], [80, 15], [92, 60]],
  6: [[50, 90], [8, 65], [10, 25], [50, 8], [90, 25], [92, 65]],
  7: [[50, 90], [8, 70], [8, 35], [30, 8], [70, 8], [92, 35], [92, 70]],
  8: [[50, 90], [8, 72], [8, 40], [22, 10], [50, 5], [78, 10], [92, 40], [92, 72]],
  9: [[50, 92], [6, 75], [6, 45], [15, 15], [40, 5], [60, 5], [85, 15], [94, 45], [94, 75]],
};
```

---

## 2. Sound Design System

### 2.1 Essential Sounds for a Card Game

| Sound        | When                         | Duration | Character                              |
|-------------|------------------------------|----------|----------------------------------------|
| `card_deal` | Each card dealt              | 100-200ms| Short snap/slide                       |
| `card_flip` | Card revealed                | 150-250ms| Paper flip with slight whoosh          |
| `chip_click`| Chip placed/added            | 50-100ms | Ceramic click                          |
| `chip_stack`| Multiple chips move          | 200-400ms| Cascade of clicks                      |
| `bet_place` | Player places bet            | 200ms    | Satisfying thud + chip click           |
| `win`       | Player wins hand             | 1-2s     | Ascending chime/fanfare                |
| `big_win`   | Large pot won                | 2-3s     | Dramatic fanfare + coins               |
| `lose`      | Player loses hand            | 500ms    | Subtle descending tone                 |
| `fold`      | Player folds                 | 200ms    | Soft card slide away                   |
| `timer_tick`| Last 5 seconds of turn       | 100ms    | Subtle tick, increasing urgency        |
| `timer_warn`| Last 3 seconds              | 150ms    | Higher pitch tick                      |
| `your_turn` | Player's turn starts         | 300ms    | Gentle notification ding               |
| `chat_msg`  | New chat message             | 100ms    | Soft pop                               |
| `join`      | Player joins table           | 200ms    | Welcome chime                          |
| `leave`     | Player leaves table          | 200ms    | Exit tone                              |
| `button_tap`| UI button pressed            | 50ms     | Subtle click                           |
| `bg_music`  | Background loop              | 30-60s   | Jazzy lounge / casino ambience, loops  |

### 2.2 Sound Manager Singleton with Howler.js

```tsx
// lib/sound.ts
import { Howl, Howler } from 'howler';

type SoundName =
  | 'card_deal' | 'card_flip' | 'chip_click' | 'chip_stack'
  | 'bet_place' | 'win' | 'big_win' | 'lose' | 'fold'
  | 'timer_tick' | 'timer_warn' | 'your_turn'
  | 'chat_msg' | 'join' | 'leave' | 'button_tap';

interface SoundConfig {
  src: string[];
  sprite?: Record<string, [number, number, boolean?]>;
  volume?: number;
  pool?: number;
}

class SoundManager {
  private static instance: SoundManager;
  private sounds: Map<string, Howl> = new Map();
  private bgMusic: Howl | null = null;
  private _isMuted = false;
  private _masterVolume = 1;
  private _sfxVolume = 1;
  private _musicVolume = 0.3;

  private constructor() {
    this.initSounds();
  }

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  private initSounds() {
    // Audio sprite: all short SFX in one file for fewer HTTP requests
    const sfxSprite = new Howl({
      src: ['/audio/sfx-sprite.webm', '/audio/sfx-sprite.mp3'],
      sprite: {
        card_deal:   [0, 200],
        card_flip:   [500, 250],
        chip_click:  [1000, 100],
        chip_stack:  [1300, 400],
        bet_place:   [2000, 200],
        fold:        [2500, 200],
        timer_tick:  [3000, 100],
        timer_warn:  [3300, 150],
        your_turn:   [3700, 300],
        chat_msg:    [4300, 100],
        join:        [4600, 200],
        leave:       [5000, 200],
        button_tap:  [5400, 50],
      },
      volume: this._sfxVolume,
      pool: 10,          // Allow 10 simultaneous sounds
      preload: true,
    });

    this.sounds.set('sfx', sfxSprite);

    // Longer sounds as separate files (better for streaming)
    this.sounds.set('win', new Howl({
      src: ['/audio/win.webm', '/audio/win.mp3'],
      volume: this._sfxVolume,
    }));

    this.sounds.set('big_win', new Howl({
      src: ['/audio/big-win.webm', '/audio/big-win.mp3'],
      volume: this._sfxVolume,
    }));

    this.sounds.set('lose', new Howl({
      src: ['/audio/lose.webm', '/audio/lose.mp3'],
      volume: this._sfxVolume * 0.7,
    }));

    // Background music with HTML5 audio for streaming
    this.bgMusic = new Howl({
      src: ['/audio/bg-lounge.webm', '/audio/bg-lounge.mp3'],
      html5: true,      // Stream instead of loading into memory
      loop: true,
      volume: this._musicVolume,
      preload: false,    // Load on demand
    });
  }

  play(name: SoundName) {
    if (this._isMuted) return;

    // Check if it's a sprite sound
    const sfx = this.sounds.get('sfx');
    if (sfx && name in (sfx as any)._sprite) {
      sfx.play(name);
      return;
    }

    // Check individual sounds
    const sound = this.sounds.get(name);
    if (sound) {
      sound.play();
    }
  }

  playMusic() {
    if (this._isMuted || !this.bgMusic) return;
    if (!this.bgMusic.playing()) {
      this.bgMusic.play();
      this.bgMusic.fade(0, this._musicVolume, 2000); // 2s fade in
    }
  }

  stopMusic() {
    if (!this.bgMusic) return;
    this.bgMusic.fade(this._musicVolume, 0, 1000); // 1s fade out
    setTimeout(() => this.bgMusic?.stop(), 1000);
  }

  // Crossfade between music tracks
  crossfadeTo(newSrc: string[]) {
    const newMusic = new Howl({
      src: newSrc,
      html5: true,
      loop: true,
      volume: 0,
    });
    newMusic.play();
    newMusic.fade(0, this._musicVolume, 2000);

    if (this.bgMusic) {
      this.bgMusic.fade(this._musicVolume, 0, 2000);
      setTimeout(() => {
        this.bgMusic?.unload();
        this.bgMusic = newMusic;
      }, 2000);
    }
  }

  toggleMute() {
    this._isMuted = !this._isMuted;
    Howler.mute(this._isMuted);
    return this._isMuted;
  }

  get isMuted() { return this._isMuted; }

  setMasterVolume(vol: number) {
    this._masterVolume = Math.max(0, Math.min(1, vol));
    Howler.volume(this._masterVolume);
  }

  setSfxVolume(vol: number) {
    this._sfxVolume = Math.max(0, Math.min(1, vol));
    this.sounds.forEach((sound, key) => {
      if (key !== 'bgMusic') sound.volume(this._sfxVolume);
    });
  }

  setMusicVolume(vol: number) {
    this._musicVolume = Math.max(0, Math.min(1, vol));
    this.bgMusic?.volume(this._musicVolume);
  }

  // Preload all sounds (call after first user interaction)
  preloadAll() {
    this.sounds.forEach(sound => {
      if (sound.state() === 'unloaded') sound.load();
    });
    this.bgMusic?.load();
  }

  // Clean up
  destroy() {
    this.sounds.forEach(sound => sound.unload());
    this.bgMusic?.unload();
    this.sounds.clear();
  }
}

export const soundManager = SoundManager.getInstance();
```

### 2.3 React Hook for Sound

```tsx
// hooks/useSound.ts
import { useCallback } from 'react';
import { soundManager } from '../lib/sound';

export function useSound() {
  const play = useCallback((name: SoundName) => {
    soundManager.play(name);
  }, []);

  const toggleMute = useCallback(() => {
    return soundManager.toggleMute();
  }, []);

  return { play, toggleMute, isMuted: soundManager.isMuted };
}
```

### 2.4 Audio Sprite Generation

Install and use the `audiosprite` CLI tool:

```bash
npm install -g audiosprite

# Generate sprite from individual sound files
audiosprite \
  --output public/audio/sfx-sprite \
  -f howler \
  --export "mp3,webm" \
  sounds/card-deal.wav \
  sounds/card-flip.wav \
  sounds/chip-click.wav \
  sounds/chip-stack.wav \
  sounds/bet-place.wav \
  sounds/fold.wav \
  sounds/timer-tick.wav \
  sounds/timer-warn.wav \
  sounds/your-turn.wav \
  sounds/chat-msg.wav \
  sounds/join.wav \
  sounds/leave.wav \
  sounds/button-tap.wav
```

This generates `sfx-sprite.mp3`, `sfx-sprite.webm`, and `sfx-sprite.json` with the sprite map. Use the JSON output to define your sprite offsets.

---

## 3. Haptic Feedback

### 3.1 Capacitor Haptics Setup

```bash
npm install @capacitor/haptics
npx cap sync
```

### 3.2 Haptic Service

```tsx
// lib/haptics.ts
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

type HapticEvent =
  | 'card_deal' | 'card_flip' | 'bet_placed' | 'chip_select'
  | 'win' | 'big_win' | 'lose' | 'fold'
  | 'timer_warning' | 'your_turn' | 'button_tap';

class HapticService {
  private enabled = true;
  private isNative = Capacitor.isNativePlatform();

  async trigger(event: HapticEvent) {
    if (!this.enabled || !this.isNative) return;

    try {
      switch (event) {
        // Light taps for frequent, subtle events
        case 'card_deal':
          await Haptics.impact({ style: ImpactStyle.Light });
          break;

        case 'button_tap':
        case 'chip_select':
          await Haptics.impact({ style: ImpactStyle.Light });
          break;

        // Medium impact for deliberate actions
        case 'card_flip':
        case 'bet_placed':
        case 'fold':
          await Haptics.impact({ style: ImpactStyle.Medium });
          break;

        // Heavy impact for important moments
        case 'your_turn':
          await Haptics.impact({ style: ImpactStyle.Heavy });
          break;

        // Notification patterns for outcomes
        case 'win':
          await Haptics.notification({ type: NotificationType.Success });
          break;

        case 'big_win':
          // Double tap pattern for big wins
          await Haptics.impact({ style: ImpactStyle.Heavy });
          await this.delay(100);
          await Haptics.notification({ type: NotificationType.Success });
          await this.delay(150);
          await Haptics.impact({ style: ImpactStyle.Heavy });
          break;

        case 'lose':
          await Haptics.notification({ type: NotificationType.Error });
          break;

        case 'timer_warning':
          await Haptics.notification({ type: NotificationType.Warning });
          break;
      }
    } catch {
      // Silently fail - haptics are non-critical
    }
  }

  // Selection feedback for scrubbing through bet amounts
  async selectionStart() {
    if (!this.enabled || !this.isNative) return;
    await Haptics.selectionStart();
  }

  async selectionChanged() {
    if (!this.enabled || !this.isNative) return;
    await Haptics.selectionChanged();
  }

  async selectionEnd() {
    if (!this.enabled || !this.isNative) return;
    await Haptics.selectionEnd();
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const hapticService = new HapticService();
```

### 3.3 Haptic Patterns for Key Game Moments

| Moment              | Style                              | Rationale                                      |
|---------------------|------------------------------------|------------------------------------------------|
| Card dealt          | `ImpactStyle.Light`                | Frequent, subtle -- like a card hitting felt   |
| Card flip/reveal    | `ImpactStyle.Medium`              | Deliberate moment, moderate emphasis            |
| Bet placed          | `ImpactStyle.Medium`              | Confirms action taken                           |
| Chip slider drag    | `selectionChanged()`              | Continuous feedback while adjusting amount      |
| Your turn           | `ImpactStyle.Heavy`               | Grab attention                                  |
| Win                 | `NotificationType.Success`         | Positive outcome                                |
| Big Win             | Heavy + Success + Heavy (pattern)  | Memorable celebratory moment                    |
| Lose                | `NotificationType.Error`           | Negative outcome, subtle                        |
| Timer warning       | `NotificationType.Warning`         | Urgency without annoyance                       |
| Fold                | `ImpactStyle.Medium`              | Finality of decision                            |
| Button tap          | `ImpactStyle.Light`               | Standard UI feedback                            |

### 3.4 Combining Sound + Haptics

```tsx
// lib/feedback.ts -- Unified feedback system
import { soundManager } from './sound';
import { hapticService } from './haptics';

type FeedbackEvent =
  | 'card_deal' | 'card_flip' | 'bet_placed' | 'win' | 'big_win'
  | 'lose' | 'fold' | 'your_turn' | 'timer_tick' | 'button_tap';

export function triggerFeedback(event: FeedbackEvent) {
  // Sound and haptics fire in parallel
  soundManager.play(event as any);
  hapticService.trigger(event as any);
}
```

---

## 4. Performance Optimization

### 4.1 DOM vs Canvas Decision Matrix

| Factor                  | DOM (Framer Motion)       | Canvas                     | Recommendation            |
|------------------------|---------------------------|---------------------------|---------------------------|
| Card rendering         | Good (< 20 elements)     | Overkill                  | **DOM** -- cards are few  |
| Chip animations        | Good                      | Better for many chips     | **DOM** with limit        |
| Particle effects       | Poor                      | Excellent                 | **Canvas** overlay        |
| Table/UI chrome        | Excellent                 | Poor (no accessibility)   | **DOM** always            |
| Text rendering         | Native                    | Manual                    | **DOM** always            |
| Gesture handling       | Built into Framer Motion  | Manual hit detection      | **DOM**                   |
| Confetti/sparkles      | Poor at scale             | Excellent                 | **Canvas** overlay        |

**Recommendation**: Hybrid approach. Use DOM/Framer Motion for all game elements (cards, chips, UI, player seats). Use a Canvas overlay strictly for particle effects (confetti, sparkles on win).

### 4.2 React Rendering Optimization

```tsx
// CRITICAL: Memoize game components to prevent re-renders during animations

// components/game/PlayerSeat.tsx
import { memo } from 'react';

interface PlayerSeatProps {
  player: Player;
  isCurrentTurn: boolean;
  onAction?: (action: GameAction) => void;
}

// Only re-render when player data or turn status changes
export const PlayerSeat = memo(function PlayerSeat({
  player, isCurrentTurn, onAction,
}: PlayerSeatProps) {
  return (
    <div className={`player-seat ${isCurrentTurn ? 'ring-2 ring-yellow-400' : ''}`}>
      <Avatar src={player.avatar} />
      <span>{player.name}</span>
      <ChipCount amount={player.chips} />
    </div>
  );
});

// Store pattern: Use Zustand selectors to subscribe to slices
// This prevents re-renders when unrelated state changes

// store/gameStore.ts
import { create } from 'zustand';

interface GameState {
  players: Player[];
  pot: number;
  currentTurn: string;
  communityCards: Card[];
  myHand: Card[];
  // ... etc
}

export const useGameStore = create<GameState>((set) => ({
  players: [],
  pot: 0,
  currentTurn: '',
  communityCards: [],
  myHand: [],
  // actions...
}));

// Usage in components -- subscribe to specific slices only:
const pot = useGameStore(state => state.pot);
const myHand = useGameStore(state => state.myHand);
// NOT: const { pot, myHand, players, ... } = useGameStore();
// That re-renders on ANY state change
```

### 4.3 GPU-Accelerated Animation Rules

```css
/* Only animate transform and opacity -- these use the compositor thread */
/* NEVER animate: width, height, top, left, margin, padding, border-width */

.animated-card {
  /* Hint browser to promote to GPU layer */
  will-change: transform;
  /* Force GPU compositing */
  transform: translateZ(0);
}

/* Remove will-change after animation completes to free GPU memory */
.animated-card.idle {
  will-change: auto;
}
```

**Framer Motion specific**: Framer Motion automatically uses `transform` for `x`, `y`, `scale`, `rotate`, `opacity`. These run on the GPU. Avoid animating `width`, `height`, or any layout-triggering property.

### 4.4 Asset Preloading Strategy

```tsx
// lib/assetPreloader.ts

const CARD_IMAGES = [
  // All 52 cards + 1 back
  ...Array.from({ length: 52 }, (_, i) => `/cards/${i}.webp`),
  '/cards/back.webp',
];

const CHIP_IMAGES = [
  '/chips/1.webp', '/chips/5.webp', '/chips/10.webp',
  '/chips/25.webp', '/chips/50.webp', '/chips/100.webp',
  '/chips/500.webp',
];

const AVATAR_DEFAULTS = Array.from(
  { length: 8 },
  (_, i) => `/avatars/default-${i}.webp`
);

export function preloadImages(urls: string[]): Promise<void[]> {
  return Promise.all(
    urls.map(url => new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject();
      img.src = url;
    }))
  );
}

// Progressive loading: critical first, then rest
export async function preloadGameAssets(
  onProgress?: (loaded: number, total: number) => void
) {
  const critical = ['/cards/back.webp', ...CHIP_IMAGES];
  const secondary = CARD_IMAGES;
  const tertiary = AVATAR_DEFAULTS;

  let loaded = 0;
  const total = critical.length + secondary.length + tertiary.length;

  const track = () => {
    loaded++;
    onProgress?.(loaded, total);
  };

  // Phase 1: Critical assets (card back, chips)
  await Promise.all(critical.map(url => {
    const img = new Image();
    img.src = url;
    return img.decode().then(track).catch(track);
  }));

  // Phase 2: Card faces (needed when cards are revealed)
  await Promise.all(secondary.map(url => {
    const img = new Image();
    img.src = url;
    return img.decode().then(track).catch(track);
  }));

  // Phase 3: Avatars (can load last)
  await Promise.all(tertiary.map(url => {
    const img = new Image();
    img.src = url;
    return img.decode().then(track).catch(track);
  }));
}
```

```tsx
// components/LoadingScreen.tsx
import { useState, useEffect } from 'react';
import { preloadGameAssets } from '../lib/assetPreloader';
import { soundManager } from '../lib/sound';

export function LoadingScreen({ onReady }: { onReady: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    Promise.all([
      preloadGameAssets((loaded, total) => {
        setProgress(Math.round((loaded / total) * 100));
      }),
      soundManager.preloadAll(),
    ]).then(onReady);
  }, [onReady]);

  return (
    <div className="fixed inset-0 bg-gray-950 flex flex-col items-center justify-center gap-4">
      <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-yellow-500 to-yellow-300 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-gray-400 text-sm">{progress}%</span>
    </div>
  );
}
```

### 4.5 Vite Build Optimization

```ts
// vite.config.ts additions
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // Chunk game logic separately from UI
        manualChunks: {
          'game-engine': ['./src/lib/game-logic.ts'],
          'sound': ['howler'],
          'animation': ['framer-motion'],
          'vendor': ['react', 'react-dom', 'zustand'],
        },
      },
    },
    // Target modern browsers for smaller bundles
    target: 'es2020',
    // Inline assets < 8kb
    assetsInlineLimit: 8192,
  },
  // Use webp for card images
  assetsInclude: ['**/*.webp'],
});
```

---

## 5. Responsive Design

### 5.1 Viewport and Safe Area Setup

```html
<!-- index.html -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no, maximum-scale=1" />
```

```css
/* styles/safe-area.css */
:root {
  --sat: env(safe-area-inset-top, 0px);
  --sar: env(safe-area-inset-right, 0px);
  --sab: env(safe-area-inset-bottom, 0px);
  --sal: env(safe-area-inset-left, 0px);
}

/* Apply safe area padding to game container */
.game-container {
  padding-top: var(--sat);
  padding-right: var(--sar);
  padding-bottom: var(--sab);
  padding-left: var(--sal);
}
```

### 5.2 Tailwind Config for Safe Areas

```js
// tailwind.config.js additions
module.exports = {
  theme: {
    extend: {
      padding: {
        'safe-t': 'env(safe-area-inset-top, 0px)',
        'safe-b': 'env(safe-area-inset-bottom, 0px)',
        'safe-l': 'env(safe-area-inset-left, 0px)',
        'safe-r': 'env(safe-area-inset-right, 0px)',
      },
      height: {
        'screen-safe': 'calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))',
      },
    },
  },
};
```

### 5.3 Landscape vs Portrait Strategy

**Teen Patti is best in portrait** (like Teen Patti Gold, Octro). The table is narrower but taller, and one-handed play is natural. Support landscape as a secondary mode.

```tsx
// hooks/useOrientation.ts
import { useState, useEffect } from 'react';

export function useOrientation() {
  const [isLandscape, setIsLandscape] = useState(
    window.innerWidth > window.innerHeight
  );

  useEffect(() => {
    const handleResize = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return { isLandscape, isPortrait: !isLandscape };
}
```

```tsx
// Responsive table component
const GameTable = () => {
  const { isLandscape } = useOrientation();

  return (
    <div className={`
      w-full h-screen-safe
      ${isLandscape
        ? 'flex flex-row items-center px-safe-l pr-safe-r'
        : 'flex flex-col pt-safe-t pb-safe-b'
      }
    `}>
      {/* In landscape: action buttons on sides. In portrait: action buttons at bottom */}
      <div className={isLandscape ? 'flex-1 aspect-[3/2]' : 'flex-1 aspect-[3/4]'}>
        <Table />
      </div>
      <ActionBar orientation={isLandscape ? 'vertical' : 'horizontal'} />
    </div>
  );
};
```

### 5.4 Dynamic Card Sizing

```tsx
// hooks/useCardSize.ts
import { useMemo } from 'react';

export function useCardSize() {
  return useMemo(() => {
    const vw = window.innerWidth;
    if (vw < 360) return { w: 48, h: 68 };    // Small phones
    if (vw < 414) return { w: 56, h: 80 };    // Standard phones
    if (vw < 768) return { w: 64, h: 92 };    // Large phones
    return { w: 80, h: 112 };                  // Tablets
  }, []);
}
```

### 5.5 Responsive Breakpoints for Game UI

```css
/* Critical breakpoints for card games */
/* Small phone (iPhone SE): 320-375px -- compress everything */
@media (max-width: 375px) {
  .player-name { font-size: 0.625rem; }
  .chip-count { font-size: 0.625rem; }
  .card { width: 3rem; height: 4.25rem; }
}

/* Standard phone: 376-414px -- default sizing */
/* Large phone (Pro Max): 415-430px -- slightly larger text */
/* Tablet: 768px+ -- show more information, larger cards */
@media (min-width: 768px) {
  .card { width: 5rem; height: 7rem; }
  .player-avatar { width: 3rem; height: 3rem; }
}
```

---

## 6. Gesture Interactions

### 6.1 Swipe to Fold

```tsx
// components/game/SwipeToFold.tsx
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { triggerFeedback } from '../../lib/feedback';

interface SwipeToFoldProps {
  cards: Card[];
  onFold: () => void;
}

export function SwipeToFold({ cards, onFold }: SwipeToFoldProps) {
  const x = useMotionValue(0);

  // As cards drag left, increase opacity of "FOLD" overlay
  const foldOpacity = useTransform(x, [-150, -50, 0], [1, 0.3, 0]);
  // Rotate slightly during drag
  const rotate = useTransform(x, [-150, 0, 150], [-8, 0, 8]);

  return (
    <div className="relative">
      {/* FOLD overlay */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
        style={{ opacity: foldOpacity }}
      >
        <span className="text-red-500 font-bold text-2xl tracking-widest">FOLD</span>
      </motion.div>

      <motion.div
        className="flex gap-1"
        style={{ x, rotate }}
        drag="x"
        dragSnapToOrigin
        dragElastic={0.2}
        dragConstraints={{ left: -200, right: 50 }}
        onDragEnd={(_, info) => {
          if (info.offset.x < -120) {
            triggerFeedback('fold');
            onFold();
          }
        }}
      >
        {cards.map((card) => (
          <Card key={card.id} {...card} />
        ))}
      </motion.div>
    </div>
  );
}
```

### 6.2 Tap to Peek at Cards

```tsx
// components/game/PeekableCard.tsx
import { motion } from 'framer-motion';
import { useState } from 'react';

export function PeekableCard({ card }: { card: Card }) {
  const [isPeeking, setIsPeeking] = useState(false);

  return (
    <motion.div
      className="relative cursor-pointer select-none"
      onTapStart={() => setIsPeeking(true)}
      onTap={() => setIsPeeking(false)}
      onTapCancel={() => setIsPeeking(false)}
      // Also handle touch end for mobile
      onPointerUp={() => setIsPeeking(false)}
    >
      <Card
        {...card}
        isRevealed={isPeeking}
      />
      {!isPeeking && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[0.5rem] text-gray-400">
          Hold to peek
        </div>
      )}
    </motion.div>
  );
}
```

### 6.3 Drag Chip Slider for Bet Amount

```tsx
// components/game/BetSlider.tsx
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { hapticService } from '../../lib/haptics';
import { useRef, useCallback } from 'react';

interface BetSliderProps {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}

export function BetSlider({ min, max, step, value, onChange }: BetSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const lastStepRef = useRef(value);

  const handleDrag = useCallback((_: any, info: { point: { x: number } }) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (info.point.x - rect.left) / rect.width));
    const raw = min + pct * (max - min);
    const stepped = Math.round(raw / step) * step;

    if (stepped !== lastStepRef.current) {
      lastStepRef.current = stepped;
      onChange(stepped);
      hapticService.selectionChanged(); // Tick haptic on each step
    }
  }, [min, max, step, onChange]);

  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="w-full px-4 py-3">
      <div ref={trackRef} className="relative h-2 bg-gray-700 rounded-full">
        {/* Filled track */}
        <div
          className="absolute h-full bg-gradient-to-r from-yellow-500 to-yellow-300 rounded-full"
          style={{ width: `${pct}%` }}
        />
        {/* Draggable thumb */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-8 h-8 bg-yellow-400 rounded-full shadow-lg border-2 border-yellow-300 cursor-grab active:cursor-grabbing"
          style={{ left: `calc(${pct}% - 16px)` }}
          drag="x"
          dragMomentum={false}
          dragElastic={0}
          dragConstraints={trackRef}
          onDrag={handleDrag}
          onDragStart={() => hapticService.selectionStart()}
          onDragEnd={() => hapticService.selectionEnd()}
        />
      </div>
      {/* Quick bet buttons */}
      <div className="flex justify-between mt-2 gap-1">
        {[min, Math.floor(max * 0.25), Math.floor(max * 0.5), max].map(amt => (
          <button
            key={amt}
            onClick={() => {
              onChange(amt);
              triggerFeedback('button_tap');
            }}
            className="flex-1 py-1.5 text-xs font-bold bg-gray-800 text-yellow-400 rounded"
          >
            {amt === max ? 'ALL IN' : amt.toLocaleString()}
          </button>
        ))}
      </div>
    </div>
  );
}
```

### 6.4 Touch Target Sizes

```css
/* Minimum 44x44px touch targets (Apple HIG) / 48x48dp (Material) */
.action-button {
  min-width: 44px;
  min-height: 44px;
}

/* For card game actions -- slightly larger because players are excited/hurried */
.game-action-button {
  min-width: 56px;
  min-height: 48px;
  padding: 12px 20px;
}
```

### 6.5 Gesture Conflict Resolution

```tsx
// CRITICAL: Prevent touch scrolling when game gestures are active
// Add to your game container
<div
  className="game-area"
  style={{ touchAction: 'none' }} // Disable browser touch handling
>
  {/* All draggable/swipeable game elements */}
</div>

// For specific areas where you want scroll + gestures:
// Use touch-action: pan-y to allow vertical scroll but capture horizontal
```

---

## 7. Accessibility

### 7.1 Colorblind Mode

Standard playing card suits already have shape differentiation (spade, heart, diamond, club). But color alone should never indicate game state.

```tsx
// lib/accessibility.ts
export type ColorblindMode = 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';

export const COLOR_SCHEMES: Record<ColorblindMode, {
  positive: string;   // For wins, raises
  negative: string;   // For losses, folds
  neutral: string;    // For standard actions
  warning: string;    // For timer, low chips
}> = {
  none: {
    positive: '#22c55e', // green-500
    negative: '#ef4444', // red-500
    neutral: '#3b82f6',  // blue-500
    warning: '#f59e0b',  // amber-500
  },
  deuteranopia: {
    positive: '#0ea5e9', // sky-500 (blue replaces green)
    negative: '#f97316', // orange-500 (orange replaces red)
    neutral: '#8b5cf6',  // violet-500
    warning: '#fbbf24',  // amber-400
  },
  protanopia: {
    positive: '#06b6d4', // cyan-500
    negative: '#f97316', // orange-500
    neutral: '#8b5cf6',  // violet-500
    warning: '#fbbf24',  // amber-400
  },
  tritanopia: {
    positive: '#10b981', // emerald-500
    negative: '#f43f5e', // rose-500
    neutral: '#6366f1',  // indigo-500
    warning: '#f97316',  // orange-500
  },
};

// Add symbols alongside colors for suit identification
export const SUIT_DISPLAY: Record<string, { symbol: string; pattern: string }> = {
  spades:   { symbol: '\u2660', pattern: 'filled'     },
  hearts:   { symbol: '\u2665', pattern: 'filled'     },
  diamonds: { symbol: '\u2666', pattern: 'outlined'   },
  clubs:    { symbol: '\u2663', pattern: 'crosshatch' },
};
```

```tsx
// Colorblind-safe card rendering
const SuitIcon = ({ suit, colorblindMode }: {
  suit: string;
  colorblindMode: ColorblindMode;
}) => {
  const display = SUIT_DISPLAY[suit];
  const isRed = suit === 'hearts' || suit === 'diamonds';

  return (
    <span
      className={`text-lg ${isRed ? 'text-red-500' : 'text-gray-900'}`}
      role="img"
      aria-label={suit}
    >
      {display.symbol}
      {/* Add small pattern indicator for colorblind mode */}
      {colorblindMode !== 'none' && (
        <span className="text-[0.4rem] block text-center">
          {suit[0].toUpperCase()}
        </span>
      )}
    </span>
  );
};
```

### 7.2 Screen Reader Support with ARIA Live Regions

```tsx
// components/a11y/GameAnnouncer.tsx
import { useEffect, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';

/**
 * Invisible announcer that narrates game events to screen readers.
 * Uses aria-live="polite" for non-urgent updates,
 * aria-live="assertive" for the player's turn.
 */
export function GameAnnouncer() {
  const politeRef = useRef<HTMLDivElement>(null);
  const assertiveRef = useRef<HTMLDivElement>(null);

  // Subscribe to game events
  const lastAction = useGameStore(state => state.lastAction);
  const isMyTurn = useGameStore(state => state.isMyTurn);

  useEffect(() => {
    if (!lastAction || !politeRef.current) return;

    // Format action for screen reader
    const message = formatActionForSR(lastAction);
    politeRef.current.textContent = message;

    // Clear after read
    setTimeout(() => {
      if (politeRef.current) politeRef.current.textContent = '';
    }, 1000);
  }, [lastAction]);

  useEffect(() => {
    if (isMyTurn && assertiveRef.current) {
      assertiveRef.current.textContent = 'It is your turn to act.';
      setTimeout(() => {
        if (assertiveRef.current) assertiveRef.current.textContent = '';
      }, 2000);
    }
  }, [isMyTurn]);

  return (
    <>
      <div
        ref={politeRef}
        role="status"
        aria-live="polite"
        className="sr-only"
      />
      <div
        ref={assertiveRef}
        role="alert"
        aria-live="assertive"
        className="sr-only"
      />
    </>
  );
}

function formatActionForSR(action: GameAction): string {
  switch (action.type) {
    case 'bet':
      return `${action.player} bet ${action.amount} chips.`;
    case 'fold':
      return `${action.player} folded.`;
    case 'call':
      return `${action.player} called.`;
    case 'raise':
      return `${action.player} raised to ${action.amount}.`;
    case 'deal':
      return 'Cards have been dealt.';
    case 'reveal':
      return `Cards revealed: ${action.cards?.join(', ')}.`;
    case 'win':
      return `${action.player} wins ${action.amount} chips!`;
    default:
      return '';
  }
}
```

### 7.3 Reduced Motion Support

```tsx
// hooks/useReducedMotion.ts
import { useReducedMotion as useFramerReducedMotion } from 'framer-motion';

export function useAnimationConfig() {
  const prefersReduced = useFramerReducedMotion();

  return {
    // Replace springs with instant or fade
    cardFlip: prefersReduced
      ? { duration: 0.01 }
      : { type: 'spring' as const, stiffness: 260, damping: 20 },
    cardDeal: prefersReduced
      ? { duration: 0.15 }
      : { type: 'spring' as const, stiffness: 200, damping: 25, mass: 0.8 },
    chipMove: prefersReduced
      ? { duration: 0.1 }
      : { duration: 0.4, ease: 'easeInOut' as const },
    confetti: !prefersReduced, // Disable confetti entirely
  };
}
```

### 7.4 Font Scaling

```css
/* Use rem-based sizing with clamp() for game UI text */
.player-name {
  font-size: clamp(0.625rem, 2.5vw, 0.875rem);
}

.chip-count {
  font-size: clamp(0.5rem, 2vw, 0.75rem);
}

/* Pot amount should always be readable */
.pot-amount {
  font-size: clamp(0.875rem, 3.5vw, 1.25rem);
  font-weight: 700;
}

/* Action buttons need clear labels */
.action-label {
  font-size: clamp(0.75rem, 3vw, 1rem);
  font-weight: 600;
}
```

---

## 8. Offline Handling

### 8.1 Vite PWA Setup with Workbox

```bash
npm install vite-plugin-pwa -D
```

```ts
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // Precache all game assets
        globPatterns: [
          '**/*.{js,css,html}',
          '**/*.{webp,png,svg}',   // Card images, chips, avatars
          '**/*.{mp3,webm,ogg}',   // Audio files
          '**/*.{woff2,woff}',     // Fonts
        ],
        // Runtime caching for API calls
        runtimeCaching: [
          {
            // Cache user profiles/avatars from API
            urlPattern: /\/api\/users\/.*/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'user-data',
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
            },
          },
          {
            // Cache leaderboard data
            urlPattern: /\/api\/leaderboard/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'leaderboard',
              networkTimeoutSeconds: 3,
              expiration: { maxAgeSeconds: 60 },
            },
          },
        ],
      },
      manifest: {
        name: 'Social Teen Patti',
        short_name: 'Teen Patti',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
});
```

### 8.2 WebSocket Reconnection with Exponential Backoff

```tsx
// lib/socketManager.ts
import { io, type Socket } from 'socket.io-client';
import { useGameStore } from '../store/gameStore';

interface ReconnectionConfig {
  baseDelay: number;
  maxDelay: number;
  maxAttempts: number;
  jitter: boolean;
}

class SocketManager {
  private socket: Socket | null = null;
  private reconnectAttempt = 0;
  private lastSeqId = 0;        // Track last received message sequence
  private sessionId: string | null = null;
  private pendingActions: Map<string, GameAction> = new Map();

  private config: ReconnectionConfig = {
    baseDelay: 500,
    maxDelay: 30000,
    maxAttempts: 15,
    jitter: true,
  };

  connect(tableId: string, token: string) {
    const params: Record<string, string> = { tableId, token };
    if (this.sessionId) params.session = this.sessionId;
    if (this.lastSeqId) params.since = String(this.lastSeqId);

    this.socket = io(import.meta.env.VITE_WS_URL, {
      auth: { token },
      query: params,
      reconnection: false, // We handle reconnection ourselves
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      this.reconnectAttempt = 0;
      useGameStore.getState().setConnectionStatus('connected');
      this.flushPending();
    });

    this.socket.on('session', (id: string) => {
      this.sessionId = id;
    });

    this.socket.on('game:state', (state: GameState & { seq: number }) => {
      this.lastSeqId = state.seq;
      useGameStore.getState().syncState(state);
    });

    this.socket.on('game:action', (action: GameAction & { seq: number; ack?: string }) => {
      this.lastSeqId = action.seq;
      if (action.ack) this.pendingActions.delete(action.ack);
      useGameStore.getState().applyAction(action);
    });

    this.socket.on('disconnect', () => {
      useGameStore.getState().setConnectionStatus('reconnecting');
      this.attemptReconnect(tableId, token);
    });

    this.socket.on('connect_error', () => {
      useGameStore.getState().setConnectionStatus('reconnecting');
      this.attemptReconnect(tableId, token);
    });
  }

  private attemptReconnect(tableId: string, token: string) {
    if (this.reconnectAttempt >= this.config.maxAttempts) {
      useGameStore.getState().setConnectionStatus('disconnected');
      return;
    }

    const delay = this.getBackoffDelay();
    this.reconnectAttempt++;

    setTimeout(() => {
      this.connect(tableId, token);
    }, delay);
  }

  private getBackoffDelay(): number {
    const { baseDelay, maxDelay, jitter } = this.config;
    const exponential = Math.min(baseDelay * Math.pow(2, this.reconnectAttempt), maxDelay);
    if (!jitter) return exponential;
    // Jitter: randomize between 50-100% of calculated delay
    // Prevents thundering herd when server restarts
    return Math.floor(exponential * (0.5 + Math.random() * 0.5));
  }

  sendAction(action: GameAction) {
    const id = crypto.randomUUID();
    const msg = { ...action, id };
    this.pendingActions.set(id, msg);

    if (this.socket?.connected) {
      this.socket.emit('game:action', msg);
    }
    // If disconnected, action stays in pending queue for resend on reconnect
  }

  private flushPending() {
    for (const msg of this.pendingActions.values()) {
      this.socket?.emit('game:action', msg);
    }
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.pendingActions.clear();
  }
}

export const socketManager = new SocketManager();
```

### 8.3 Connection Status UI

```tsx
// components/ConnectionBanner.tsx
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

export function ConnectionBanner() {
  const status = useGameStore(state => state.connectionStatus);

  return (
    <AnimatePresence>
      {status !== 'connected' && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className={`
            fixed top-0 inset-x-0 z-50 py-2 px-4 text-center text-sm font-medium
            pt-[max(0.5rem,env(safe-area-inset-top))]
            ${status === 'reconnecting'
              ? 'bg-amber-600 text-white'
              : 'bg-red-600 text-white'
            }
          `}
        >
          {status === 'reconnecting' ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              Reconnecting...
            </span>
          ) : (
            <span>
              Connection lost.{' '}
              <button
                onClick={() => socketManager.connect(tableId, token)}
                className="underline font-bold"
              >
                Retry
              </button>
            </span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

---

## 9. Push Notifications

### 9.1 Capacitor Push Setup with FCM

```bash
npm install @capacitor/push-notifications
npx cap sync
```

### 9.2 Firebase Configuration

**Android**: Place `google-services.json` in `android/app/`.

**iOS**:
1. Add `GoogleService-Info.plist` to the Xcode project
2. Add Firebase Messaging via SPM or CocoaPods
3. Configure `AppDelegate.swift`:

```swift
import FirebaseCore
import FirebaseMessaging

// In application(didFinishLaunchingWithOptions):
FirebaseApp.configure()

// Handle token registration:
func application(_ application: UIApplication,
  didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
  Messaging.messaging().apnsToken = deviceToken
  Messaging.messaging().token { token, error in
    if let error = error {
      NotificationCenter.default.post(
        name: .capacitorDidFailToRegisterForRemoteNotifications,
        object: error)
    } else if let token = token {
      NotificationCenter.default.post(
        name: .capacitorDidRegisterForRemoteNotifications,
        object: token)
    }
  }
}
```

### 9.3 Push Notification Service

```tsx
// lib/pushNotifications.ts
import { PushNotifications, type Token, type ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export type NotificationCategory =
  | 'your_turn'        // It's your turn in a game
  | 'game_starting'    // A game you joined is starting
  | 'game_result'      // Game finished -- you won/lost
  | 'daily_reward'     // Daily bonus available
  | 'friend_invite'    // Friend invited you to a table
  | 'tournament'       // Tournament starting soon
  | 'low_balance';     // Chips running low

interface PushConfig {
  onTokenReceived: (token: string) => void;
  onNotificationTapped: (category: NotificationCategory, data: any) => void;
}

export async function initPushNotifications({ onTokenReceived, onNotificationTapped }: PushConfig) {
  if (!Capacitor.isNativePlatform()) return;

  // Request permission
  const permResult = await PushNotifications.requestPermissions();
  if (permResult.receive !== 'granted') {
    console.log('Push notification permission denied');
    return;
  }

  // Register with FCM
  await PushNotifications.register();

  // Token received
  PushNotifications.addListener('registration', (token: Token) => {
    console.log('FCM Token:', token.value);
    onTokenReceived(token.value);
  });

  PushNotifications.addListener('registrationError', (error) => {
    console.error('Push registration error:', error);
  });

  // Notification received while app is in foreground
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    // Show in-app notification (don't rely on system notification)
    const category = notification.data?.category as NotificationCategory;
    showInAppNotification(notification.title || '', notification.body || '', category);
  });

  // User tapped on notification (app was in background)
  PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
    const category = action.notification.data?.category as NotificationCategory;
    onNotificationTapped(category, action.notification.data);
  });
}

// Route notification taps to correct screen
export function handleNotificationNavigation(category: NotificationCategory, data: any) {
  switch (category) {
    case 'your_turn':
    case 'game_starting':
      // Navigate to game table
      window.location.href = `/game/${data.tableId}`;
      break;
    case 'game_result':
      // Navigate to results screen
      window.location.href = `/results/${data.gameId}`;
      break;
    case 'friend_invite':
      // Navigate to table with invite
      window.location.href = `/game/${data.tableId}?invite=${data.inviteId}`;
      break;
    case 'daily_reward':
      // Navigate to rewards screen
      window.location.href = '/rewards';
      break;
    case 'tournament':
      window.location.href = `/tournament/${data.tournamentId}`;
      break;
    default:
      window.location.href = '/';
  }
}
```

### 9.4 Permission Request Flow (UX Best Practice)

Never request push permission on app launch. Pre-prompt first:

```tsx
// components/PushPermissionPrompt.tsx
export function PushPermissionPrompt({ onAccept, onDecline }: {
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
    >
      <div className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full text-center">
        <div className="text-4xl mb-3">🔔</div>
        <h3 className="text-lg font-bold text-white mb-2">
          Never miss your turn!
        </h3>
        <p className="text-gray-400 text-sm mb-6">
          Get notified when it's your turn, when friends invite you,
          and when daily rewards are ready.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onDecline}
            className="flex-1 py-2.5 text-gray-400 text-sm rounded-lg border border-gray-700"
          >
            Not now
          </button>
          <button
            onClick={onAccept}
            className="flex-1 py-2.5 bg-yellow-500 text-gray-900 font-bold text-sm rounded-lg"
          >
            Enable
          </button>
        </div>
      </div>
    </motion.div>
  );
}
```

**When to show**: After the user completes their first game, or after 3 sessions. Never on first launch.

---

## 10. App Store Optimization (ASO)

### 10.1 Screenshot Dimensions

**iOS App Store (mandatory minimum)**:

| Device       | Portrait          | Landscape         |
|-------------|-------------------|-------------------|
| 6.9" iPhone | 1320 x 2868 px   | 2868 x 1320 px   |
| 6.7" iPhone | 1290 x 2796 px   | 2796 x 1290 px   |
| 13" iPad    | 2048 x 2732 px   | 2732 x 2048 px   |

Format: PNG (recommended) or JPEG, RGB, no transparency. Up to 10 screenshots per device type. First 3 appear in search results.

**Google Play Store**:

| Type           | Dimensions        | Notes                      |
|---------------|-------------------|----------------------------|
| Phone         | 1080 x 1920 px   | 9:16 ratio, min 2 / max 8  |
| 7" Tablet     | 1200 x 1920 px   | min side >= 1080px          |
| 10" Tablet    | 1800 x 2560 px   |                             |
| Feature Graphic| 1024 x 500 px    | Required                   |

Format: JPEG or 24-bit PNG, max 8MB, no transparency.

### 10.2 Screenshot Content Strategy

Based on what Teen Patti Gold and top competitors show:

1. **Screenshot 1**: Hero shot -- game table with cards dealt, vibrant, shows premium feel
2. **Screenshot 2**: Game variations -- "Play Teen Patti, Poker, Rummy & more!"
3. **Screenshot 3**: Social features -- chat, emojis, friends list
4. **Screenshot 4**: Private tables -- "Play with friends & family"
5. **Screenshot 5**: Rewards/bonuses -- daily rewards, tournaments
6. **Screenshot 6**: Customization -- avatars, table themes, card backs

### 10.3 App Preview Video

**iOS**: 15-30 seconds, same resolution as screenshots, H.264 codec, portrait orientation recommended for card games. Show actual gameplay -- dealing, betting, winning.

**Google Play**: Up to 30 seconds YouTube video. Link in store listing. Horizontal 16:9 recommended by Google but portrait works for card games.

### 10.4 Keyword Strategy for Teen Patti

**Primary keywords** (highest volume in India):
- teen patti
- 3 patti
- teen patti game
- poker game
- card game online

**Secondary keywords**:
- teen patti gold
- rummy
- andar bahar
- three card poker
- flash game

**Longtail keywords**:
- teen patti with friends
- private table card game
- online teen patti multiplayer
- play teen patti free

**Localization**: Critical for India. Translate metadata to Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati. Use local script for app name variant.

### 10.5 Title and Subtitle

**iOS Title** (30 chars max): `Teen Patti Social - 3 Patti`
**iOS Subtitle** (30 chars max): `Play Cards with Friends`

**Google Play Title** (50 chars max): `Teen Patti Social - 3 Patti Card Game with Friends`

---

## 11. Premium Feel

### 11.1 Particle Effects: Confetti on Win

Use `canvas-confetti` (7KB, zero dependencies, performant):

```bash
npm install canvas-confetti
npm install -D @types/canvas-confetti
```

```tsx
// lib/particles.ts
import confetti from 'canvas-confetti';

export function celebrateWin() {
  // Check reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const duration = 3000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ['#FFD700', '#FFA500', '#FF6347'],
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ['#FFD700', '#FFA500', '#FF6347'],
    });

    if (Date.now() < end) requestAnimationFrame(frame);
  };

  frame();
}

export function celebrateBigWin() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Gold coin shower
  const defaults = {
    spread: 360,
    ticks: 100,
    gravity: 0.8,
    decay: 0.94,
    startVelocity: 30,
    colors: ['#FFD700', '#FFC107', '#FFEB3B', '#FF9800', '#F44336'],
    shapes: ['circle'],
    scalar: 1.2,
  };

  function shoot() {
    confetti({ ...defaults, particleCount: 40, origin: { x: 0.5, y: 0.3 } });
  }

  // Triple burst
  shoot();
  setTimeout(shoot, 250);
  setTimeout(shoot, 500);
}
```

### 11.2 Gold/Diamond Visual Language

```css
/* Premium gold gradient -- used on buttons, text, borders */
.gold-gradient {
  background: linear-gradient(135deg, #f5d442, #daa520, #b8860b, #daa520, #f5d442);
  background-size: 200% 200%;
  animation: gold-shimmer 3s ease infinite;
}

@keyframes gold-shimmer {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

/* Gold text */
.gold-text {
  background: linear-gradient(135deg, #f5d442, #daa520, #f5d442);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-size: 200% auto;
  animation: gold-shimmer 3s linear infinite;
}

/* Diamond sparkle -- for VIP elements */
.diamond-shine {
  position: relative;
  overflow: hidden;
}

.diamond-shine::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent 30%,
    rgba(255, 255, 255, 0.1) 45%,
    rgba(255, 255, 255, 0.3) 50%,
    rgba(255, 255, 255, 0.1) 55%,
    transparent 70%
  );
  animation: shine-sweep 4s ease-in-out infinite;
}

@keyframes shine-sweep {
  0% { transform: translateX(-100%) translateY(-100%) rotate(30deg); }
  100% { transform: translateX(100%) translateY(100%) rotate(30deg); }
}
```

### 11.3 Glow Effects for Active States

```css
/* Neon glow for active player turn */
.active-turn-glow {
  box-shadow:
    0 0 5px rgba(255, 215, 0, 0.5),
    0 0 15px rgba(255, 215, 0, 0.3),
    0 0 30px rgba(255, 215, 0, 0.15);
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow:
      0 0 5px rgba(255, 215, 0, 0.5),
      0 0 15px rgba(255, 215, 0, 0.3),
      0 0 30px rgba(255, 215, 0, 0.15);
  }
  50% {
    box-shadow:
      0 0 10px rgba(255, 215, 0, 0.7),
      0 0 25px rgba(255, 215, 0, 0.4),
      0 0 50px rgba(255, 215, 0, 0.2);
  }
}

/* Winner highlight glow */
.winner-glow {
  box-shadow:
    0 0 10px rgba(34, 197, 94, 0.6),
    0 0 30px rgba(34, 197, 94, 0.3),
    0 0 60px rgba(34, 197, 94, 0.15);
}

/* Big pot pulse -- pot area glows bigger as pot grows */
.big-pot-glow {
  box-shadow:
    0 0 20px rgba(255, 215, 0, 0.4),
    0 0 40px rgba(255, 215, 0, 0.2),
    inset 0 0 20px rgba(255, 215, 0, 0.1);
}
```

### 11.4 Premium Card Back Design

```tsx
// components/game/PremiumCardBack.tsx
const PremiumCardBack = ({ tier = 'gold' }: { tier: 'silver' | 'gold' | 'diamond' }) => {
  const gradients = {
    silver: 'from-gray-300 via-gray-100 to-gray-400',
    gold: 'from-yellow-600 via-yellow-300 to-yellow-700',
    diamond: 'from-cyan-400 via-white to-cyan-500',
  };

  return (
    <div className={`w-full h-full rounded-lg bg-gradient-to-br ${gradients[tier]} relative overflow-hidden`}>
      {/* Repeating pattern */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 5px,
            rgba(0,0,0,0.1) 5px,
            rgba(0,0,0,0.1) 10px
          )`,
        }}
      />
      {/* Center emblem */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`w-8 h-8 rounded-full border-2 border-current opacity-40 diamond-shine`} />
      </div>
      {/* Shine overlay */}
      <div className="diamond-shine absolute inset-0" />
    </div>
  );
};
```

### 11.5 Animated Borders for VIP/Premium UI

```css
/* Animated gradient border */
@property --angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

.premium-border {
  --angle: 0deg;
  border: 2px solid transparent;
  background:
    linear-gradient(#1a1a2e, #1a1a2e) padding-box,
    conic-gradient(from var(--angle), #f5d442, #daa520, #b8860b, #daa520, #f5d442) border-box;
  animation: rotate-border 4s linear infinite;
  border-radius: 12px;
}

@keyframes rotate-border {
  to { --angle: 360deg; }
}
```

### 11.6 Table Felt Textures

```css
/* Realistic felt texture using CSS */
.table-felt {
  background:
    radial-gradient(ellipse at center, #1a6b3c 0%, #0d4a25 70%, #0a3519 100%);
  /* Subtle noise texture via SVG data URL */
  background-image:
    url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E"),
    radial-gradient(ellipse at center, #1a6b3c 0%, #0d4a25 70%, #0a3519 100%);
}

/* Premium dark blue variant */
.table-felt-dark {
  background:
    radial-gradient(ellipse at center, #1a1a3e 0%, #0d0d2a 70%, #050515 100%);
}

/* Red casino variant */
.table-felt-red {
  background:
    radial-gradient(ellipse at center, #6b1a1a 0%, #4a0d0d 70%, #35100a 100%);
}
```

### 11.7 Win Animation Sequence

Combining all premium elements for a world-class win moment:

```tsx
// components/game/WinCelebration.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { triggerFeedback } from '../../lib/feedback';
import { celebrateBigWin } from '../../lib/particles';

export function WinCelebration({ winner, amount, isBigWin, onComplete }: {
  winner: string;
  amount: number;
  isBigWin: boolean;
  onComplete: () => void;
}) {
  useEffect(() => {
    if (isBigWin) {
      celebrateBigWin();
      triggerFeedback('big_win');
    } else {
      triggerFeedback('win');
    }

    const timer = setTimeout(onComplete, isBigWin ? 4000 : 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-40 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Darken background */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Win card */}
        <motion.div
          className="relative z-10 text-center"
          initial={{ scale: 0.3, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          {isBigWin && (
            <motion.div
              className="gold-text text-5xl font-extrabold mb-2"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 1] }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              JACKPOT!
            </motion.div>
          )}

          <motion.div
            className="text-white text-xl font-bold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {winner} wins!
          </motion.div>

          <motion.div
            className="gold-text text-3xl font-extrabold mt-1"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
          >
            +{amount.toLocaleString()}
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
```

---

## Quick Reference: Package Versions

| Package                      | Version  | Purpose                      |
|------------------------------|----------|------------------------------|
| `framer-motion`             | ^11.5    | All animations & gestures    |
| `howler`                    | ^2.2     | Sound effects & music        |
| `@capacitor/haptics`        | ^6.0     | Native haptic feedback       |
| `@capacitor/push-notifications` | ^6.0 | Push notifications via FCM   |
| `canvas-confetti`           | ^1.9     | Win celebration particles    |
| `vite-plugin-pwa`           | ^0.20    | Offline support / PWA        |
| `zustand`                   | ^5.0     | Game state management        |
| `socket.io-client`          | ^4.8     | Real-time multiplayer        |

---

## Architecture Summary

```
src/
  components/
    game/
      Table.tsx            # Oval table + player positioning
      Card.tsx             # 3D flip card with Framer Motion
      DealAnimation.tsx    # Staggered card dealing
      ChipStack.tsx        # Chip pile visualization
      Pot.tsx              # Pot amount + chip visual
      PlayerSeat.tsx       # Player avatar, name, chips (memoized)
      SwipeToFold.tsx      # Drag gesture to fold
      PeekableCard.tsx     # Tap-and-hold to peek
      BetSlider.tsx        # Drag slider for bet amount
      WinCelebration.tsx   # Win overlay with confetti
      ActionBar.tsx        # Call / Raise / Fold buttons
    a11y/
      GameAnnouncer.tsx    # ARIA live regions for screen readers
    ui/
      ConnectionBanner.tsx # Reconnection status
      LoadingScreen.tsx    # Asset preloading progress
      PushPermissionPrompt.tsx
  lib/
    sound.ts               # SoundManager singleton (Howler.js)
    haptics.ts             # HapticService (Capacitor Haptics)
    feedback.ts            # Unified sound + haptics trigger
    particles.ts           # canvas-confetti helpers
    assetPreloader.ts      # Image/audio preloading
    socketManager.ts       # Socket.io with reconnection
    accessibility.ts       # Colorblind modes, color schemes
    pushNotifications.ts   # FCM push setup
  hooks/
    useSound.ts            # React hook for SoundManager
    useOrientation.ts      # Portrait/landscape detection
    useCardSize.ts         # Responsive card dimensions
    useAnimationConfig.ts  # Reduced motion aware animation config
  store/
    gameStore.ts           # Zustand store with selector pattern
  styles/
    safe-area.css          # env() safe area insets
    premium.css            # Gold gradients, glow effects, felt textures
```
