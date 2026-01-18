import { useCallback, useEffect, useRef } from 'react';
import { Howl, Howler } from 'howler';
import { useUIStore } from '../stores/uiStore';

// Sound effect types
type SoundEffect =
  | 'card_deal'
  | 'card_flip'
  | 'chip_bet'
  | 'chip_collect'
  | 'chip_stack'
  | 'win'
  | 'lose'
  | 'turn'
  | 'button_click'
  | 'notification'
  | 'message'
  | 'fold'
  | 'all_in'
  | 'countdown'
  | 'celebration';

// Base64 encoded simple sounds (to avoid external files)
// These are placeholder - in production, use actual sound files
const SOUND_DATA: Record<SoundEffect, string> = {
  card_deal: 'data:audio/wav;base64,UklGRl9vT19LQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgA',
  card_flip: 'data:audio/wav;base64,UklGRl9vT19LQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgA',
  chip_bet: 'data:audio/wav;base64,UklGRl9vT19LQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgA',
  chip_collect: 'data:audio/wav;base64,UklGRl9vT19LQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgA',
  chip_stack: 'data:audio/wav;base64,UklGRl9vT19LQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgA',
  win: 'data:audio/wav;base64,UklGRl9vT19LQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgA',
  lose: 'data:audio/wav;base64,UklGRl9vT19LQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgA',
  turn: 'data:audio/wav;base64,UklGRl9vT19LQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgA',
  button_click: 'data:audio/wav;base64,UklGRl9vT19LQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgA',
  notification: 'data:audio/wav;base64,UklGRl9vT19LQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgA',
  message: 'data:audio/wav;base64,UklGRl9vT19LQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgA',
  fold: 'data:audio/wav;base64,UklGRl9vT19LQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgA',
  all_in: 'data:audio/wav;base64,UklGRl9vT19LQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgA',
  countdown: 'data:audio/wav;base64,UklGRl9vT19LQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgA',
  celebration: 'data:audio/wav;base64,UklGRl9vT19LQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgA'
};

// Sound configurations
const SOUND_CONFIG: Record<SoundEffect, { volume: number; rate?: number }> = {
  card_deal: { volume: 0.5, rate: 1.2 },
  card_flip: { volume: 0.6 },
  chip_bet: { volume: 0.4 },
  chip_collect: { volume: 0.5 },
  chip_stack: { volume: 0.3 },
  win: { volume: 0.8 },
  lose: { volume: 0.5 },
  turn: { volume: 0.6 },
  button_click: { volume: 0.3 },
  notification: { volume: 0.5 },
  message: { volume: 0.4 },
  fold: { volume: 0.4 },
  all_in: { volume: 0.7 },
  countdown: { volume: 0.5 },
  celebration: { volume: 0.8 }
};

export function useSound() {
  const { soundEnabled, sfxVolume } = useUIStore();
  const soundsRef = useRef<Map<SoundEffect, Howl>>(new Map());

  // Initialize sounds
  useEffect(() => {
    // Set global volume
    Howler.volume(sfxVolume);

    // Preload sounds (in production, load actual audio files)
    // For demo, we'll create placeholder sounds
    Object.entries(SOUND_CONFIG).forEach(([key, config]) => {
      const sound = new Howl({
        src: [SOUND_DATA[key as SoundEffect]],
        volume: config.volume,
        rate: config.rate || 1,
        preload: true
      });
      soundsRef.current.set(key as SoundEffect, sound);
    });

    return () => {
      // Cleanup
      soundsRef.current.forEach(sound => sound.unload());
      soundsRef.current.clear();
    };
  }, [sfxVolume]);

  // Play a sound effect
  const play = useCallback((effect: SoundEffect) => {
    if (!soundEnabled) return;

    const sound = soundsRef.current.get(effect);
    if (sound) {
      sound.play();
    }
  }, [soundEnabled]);

  // Play multiple sounds in sequence
  const playSequence = useCallback((effects: SoundEffect[], delay: number = 100) => {
    if (!soundEnabled) return;

    effects.forEach((effect, index) => {
      setTimeout(() => play(effect), index * delay);
    });
  }, [soundEnabled, play]);

  // Play card dealing sound with variations
  const playCardDeal = useCallback((count: number = 1) => {
    if (!soundEnabled) return;

    for (let i = 0; i < count; i++) {
      setTimeout(() => play('card_deal'), i * 150);
    }
  }, [soundEnabled, play]);

  // Play chip sounds with variations based on amount
  const playChipSound = useCallback((amount: number, isCollecting: boolean = false) => {
    if (!soundEnabled) return;

    const effect = isCollecting ? 'chip_collect' : 'chip_bet';
    const repetitions = Math.min(Math.ceil(amount / 1000), 5);

    for (let i = 0; i < repetitions; i++) {
      setTimeout(() => play(effect), i * 50);
    }
  }, [soundEnabled, play]);

  return {
    play,
    playSequence,
    playCardDeal,
    playChipSound
  };
}

// Hook for background music
export function useBackgroundMusic() {
  const { musicEnabled, musicVolume } = useUIStore();
  const musicRef = useRef<Howl | null>(null);

  const play = useCallback(() => {
    if (!musicEnabled || musicRef.current?.playing()) return;

    // In production, load actual background music
    // musicRef.current?.play();
  }, [musicEnabled]);

  const pause = useCallback(() => {
    musicRef.current?.pause();
  }, []);

  const setVolume = useCallback((volume: number) => {
    musicRef.current?.volume(volume);
  }, []);

  useEffect(() => {
    if (musicEnabled) {
      play();
    } else {
      pause();
    }
  }, [musicEnabled, play, pause]);

  useEffect(() => {
    setVolume(musicVolume);
  }, [musicVolume, setVolume]);

  return { play, pause, setVolume };
}
