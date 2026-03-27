import { Howl, Howler } from 'howler';

// Sound definitions with fallback to generated tones
interface SoundConfig {
  src: string[];
  volume: number;
  loop?: boolean;
  sprite?: Record<string, [number, number]>;
}

type SoundName =
  | 'card_deal'
  | 'card_flip'
  | 'chip_bet'
  | 'chip_stack'
  | 'chip_win'
  | 'button_click'
  | 'turn_alert'
  | 'timer_tick'
  | 'timer_urgent'
  | 'fold'
  | 'raise'
  | 'win_small'
  | 'win_big'
  | 'win_jackpot'
  | 'lose'
  | 'sideshow'
  | 'notification'
  | 'message'
  | 'gift_sent'
  | 'gift_received'
  | 'achievement'
  | 'level_up'
  | 'daily_reward'
  | 'countdown_3'
  | 'countdown_2'
  | 'countdown_1'
  | 'game_start'
  | 'lobby_music'
  | 'game_music';

class SoundManager {
  private sounds: Map<SoundName, Howl> = new Map();
  private enabled = true;
  private musicEnabled = true;
  private sfxVolume = 0.7;
  private musicVolume = 0.3;
  private currentMusic: Howl | null = null;
  private audioContext: AudioContext | null = null;

  constructor() {
    this.loadSettings();
  }

  private loadSettings() {
    try {
      const settings = JSON.parse(localStorage.getItem('teen-patti-ui') || '{}');
      const state = settings?.state;
      if (state) {
        this.enabled = state.soundEnabled ?? true;
        this.musicEnabled = state.musicEnabled ?? true;
        this.sfxVolume = state.sfxVolume ?? 0.7;
        this.musicVolume = state.musicVolume ?? 0.3;
      }
    } catch {
      // Default settings
    }
  }

  /** Initialize AudioContext (must be called after user interaction) */
  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    Howler.autoUnlock = true;
  }

  /** Generate a tone using Web Audio API (no external sound files needed) */
  private generateTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.3): Howl {
    // Create a data URI from a generated audio buffer
    // For now, use Howler with inline generated sounds
    const sampleRate = 44100;
    const numSamples = Math.floor(sampleRate * duration);
    const buffer = new Float32Array(numSamples);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      let sample = 0;

      switch (type) {
        case 'sine':
          sample = Math.sin(2 * Math.PI * frequency * t);
          break;
        case 'square':
          sample = Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1;
          break;
        case 'triangle':
          sample = 2 * Math.abs(2 * (t * frequency - Math.floor(t * frequency + 0.5))) - 1;
          break;
        case 'sawtooth':
          sample = 2 * (t * frequency - Math.floor(t * frequency + 0.5));
          break;
      }

      // Apply envelope (attack-decay-sustain-release)
      const attack = 0.01;
      const decay = 0.05;
      const sustain = 0.7;
      const release = Math.min(0.1, duration * 0.3);

      let envelope = 1;
      if (t < attack) {
        envelope = t / attack;
      } else if (t < attack + decay) {
        envelope = 1 - (1 - sustain) * ((t - attack) / decay);
      } else if (t > duration - release) {
        envelope = sustain * ((duration - t) / release);
      } else {
        envelope = sustain;
      }

      buffer[i] = sample * envelope * volume;
    }

    // Convert to WAV
    const wav = encodeWAV(buffer, sampleRate);
    const blob = new Blob([wav], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);

    return new Howl({
      src: [url],
      format: ['wav'],
      volume: this.sfxVolume,
    });
  }

  /** Pre-generate all game sounds */
  preload() {
    this.init();

    // Card sounds
    this.sounds.set('card_deal', this.generateTone(800, 0.08, 'triangle', 0.2));
    this.sounds.set('card_flip', this.generateTone(1200, 0.1, 'sine', 0.15));

    // Chip sounds
    this.sounds.set('chip_bet', this.generateTone(600, 0.12, 'triangle', 0.25));
    this.sounds.set('chip_stack', this.generateChipSound());
    this.sounds.set('chip_win', this.generateWinChipSound());

    // UI sounds
    this.sounds.set('button_click', this.generateTone(1000, 0.05, 'square', 0.1));
    this.sounds.set('turn_alert', this.generateTone(880, 0.3, 'sine', 0.3));
    this.sounds.set('timer_tick', this.generateTone(440, 0.05, 'square', 0.15));
    this.sounds.set('timer_urgent', this.generateTone(880, 0.15, 'square', 0.4));

    // Action sounds
    this.sounds.set('fold', this.generateTone(300, 0.2, 'sine', 0.2));
    this.sounds.set('raise', this.generateRaiseSound());

    // Win/lose
    this.sounds.set('win_small', this.generateWinSound(false));
    this.sounds.set('win_big', this.generateWinSound(true));
    this.sounds.set('win_jackpot', this.generateJackpotSound());
    this.sounds.set('lose', this.generateTone(200, 0.4, 'sine', 0.15));

    // Social
    this.sounds.set('notification', this.generateTone(1200, 0.15, 'sine', 0.2));
    this.sounds.set('message', this.generateTone(1400, 0.08, 'sine', 0.15));
    this.sounds.set('gift_sent', this.generateTone(1000, 0.2, 'triangle', 0.2));
    this.sounds.set('gift_received', this.generateGiftSound());

    // Progression
    this.sounds.set('achievement', this.generateAchievementSound());
    this.sounds.set('level_up', this.generateLevelUpSound());
    this.sounds.set('daily_reward', this.generateGiftSound());

    // Countdown
    this.sounds.set('countdown_3', this.generateTone(523, 0.15, 'sine', 0.3));
    this.sounds.set('countdown_2', this.generateTone(659, 0.15, 'sine', 0.3));
    this.sounds.set('countdown_1', this.generateTone(784, 0.15, 'sine', 0.3));

    this.sounds.set('game_start', this.generateGameStartSound());
  }

  private generateChipSound(): Howl {
    const sampleRate = 44100;
    const duration = 0.15;
    const numSamples = Math.floor(sampleRate * duration);
    const buffer = new Float32Array(numSamples);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      // Multiple high frequencies for a "clink" sound
      buffer[i] = (
        Math.sin(2 * Math.PI * 2000 * t) * 0.3 +
        Math.sin(2 * Math.PI * 4000 * t) * 0.2 +
        Math.sin(2 * Math.PI * 6000 * t) * 0.1
      ) * Math.exp(-t * 30) * 0.3;
    }

    const wav = encodeWAV(buffer, sampleRate);
    return new Howl({ src: [URL.createObjectURL(new Blob([wav], { type: 'audio/wav' }))], format: ['wav'], volume: this.sfxVolume });
  }

  private generateWinChipSound(): Howl {
    const sampleRate = 44100;
    const duration = 0.5;
    const numSamples = Math.floor(sampleRate * duration);
    const buffer = new Float32Array(numSamples);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      // Cascading chip clinks
      const clink1 = Math.sin(2 * Math.PI * 3000 * t) * Math.exp(-t * 20) * 0.3;
      const clink2 = Math.sin(2 * Math.PI * 3500 * (t - 0.1)) * Math.exp(-(t - 0.1) * 20) * (t > 0.1 ? 0.25 : 0);
      const clink3 = Math.sin(2 * Math.PI * 4000 * (t - 0.2)) * Math.exp(-(t - 0.2) * 20) * (t > 0.2 ? 0.2 : 0);
      buffer[i] = (clink1 + clink2 + clink3) * 0.4;
    }

    const wav = encodeWAV(buffer, sampleRate);
    return new Howl({ src: [URL.createObjectURL(new Blob([wav], { type: 'audio/wav' }))], format: ['wav'], volume: this.sfxVolume });
  }

  private generateRaiseSound(): Howl {
    const sampleRate = 44100;
    const duration = 0.3;
    const numSamples = Math.floor(sampleRate * duration);
    const buffer = new Float32Array(numSamples);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const freq = 400 + t * 2000; // Rising pitch
      buffer[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 5) * 0.25;
    }

    const wav = encodeWAV(buffer, sampleRate);
    return new Howl({ src: [URL.createObjectURL(new Blob([wav], { type: 'audio/wav' }))], format: ['wav'], volume: this.sfxVolume });
  }

  private generateWinSound(isBig: boolean): Howl {
    const sampleRate = 44100;
    const duration = isBig ? 1.0 : 0.5;
    const numSamples = Math.floor(sampleRate * duration);
    const buffer = new Float32Array(numSamples);

    const notes = isBig
      ? [523, 659, 784, 1047, 1319] // C5-E5-G5-C6-E6
      : [523, 659, 784]; // C5-E5-G5

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      let sample = 0;

      notes.forEach((freq, idx) => {
        const noteStart = idx * 0.1;
        if (t >= noteStart) {
          const noteT = t - noteStart;
          sample += Math.sin(2 * Math.PI * freq * noteT) * Math.exp(-noteT * 3) * 0.2;
        }
      });

      buffer[i] = sample * 0.4;
    }

    const wav = encodeWAV(buffer, sampleRate);
    return new Howl({ src: [URL.createObjectURL(new Blob([wav], { type: 'audio/wav' }))], format: ['wav'], volume: this.sfxVolume });
  }

  private generateJackpotSound(): Howl {
    const sampleRate = 44100;
    const duration = 2.0;
    const numSamples = Math.floor(sampleRate * duration);
    const buffer = new Float32Array(numSamples);

    // Triumphant ascending arpeggio
    const notes = [523, 659, 784, 1047, 784, 1047, 1319, 1568];

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      let sample = 0;

      notes.forEach((freq, idx) => {
        const noteStart = idx * 0.15;
        if (t >= noteStart) {
          const noteT = t - noteStart;
          sample += Math.sin(2 * Math.PI * freq * noteT) * Math.exp(-noteT * 2) * 0.15;
          // Add harmony
          sample += Math.sin(2 * Math.PI * freq * 1.5 * noteT) * Math.exp(-noteT * 3) * 0.05;
        }
      });

      buffer[i] = sample * 0.4;
    }

    const wav = encodeWAV(buffer, sampleRate);
    return new Howl({ src: [URL.createObjectURL(new Blob([wav], { type: 'audio/wav' }))], format: ['wav'], volume: this.sfxVolume });
  }

  private generateGiftSound(): Howl {
    const sampleRate = 44100;
    const duration = 0.4;
    const numSamples = Math.floor(sampleRate * duration);
    const buffer = new Float32Array(numSamples);

    // Sparkle/twinkle effect
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      buffer[i] = (
        Math.sin(2 * Math.PI * 2000 * t) * Math.exp(-t * 8) * 0.2 +
        Math.sin(2 * Math.PI * 3000 * (t - 0.1)) * Math.exp(-(t - 0.1) * 8) * (t > 0.1 ? 0.15 : 0) +
        Math.sin(2 * Math.PI * 4000 * (t - 0.2)) * Math.exp(-(t - 0.2) * 8) * (t > 0.2 ? 0.1 : 0)
      ) * 0.4;
    }

    const wav = encodeWAV(buffer, sampleRate);
    return new Howl({ src: [URL.createObjectURL(new Blob([wav], { type: 'audio/wav' }))], format: ['wav'], volume: this.sfxVolume });
  }

  private generateAchievementSound(): Howl {
    return this.generateWinSound(true); // Reuse big win for achievements
  }

  private generateLevelUpSound(): Howl {
    return this.generateJackpotSound(); // Reuse jackpot for level up
  }

  private generateGameStartSound(): Howl {
    const sampleRate = 44100;
    const duration = 0.6;
    const numSamples = Math.floor(sampleRate * duration);
    const buffer = new Float32Array(numSamples);

    // Two-tone "ding dong"
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const tone1 = Math.sin(2 * Math.PI * 880 * t) * Math.exp(-t * 6) * 0.3;
      const tone2 = t > 0.2 ? Math.sin(2 * Math.PI * 1320 * (t - 0.2)) * Math.exp(-(t - 0.2) * 6) * 0.25 : 0;
      buffer[i] = (tone1 + tone2) * 0.4;
    }

    const wav = encodeWAV(buffer, sampleRate);
    return new Howl({ src: [URL.createObjectURL(new Blob([wav], { type: 'audio/wav' }))], format: ['wav'], volume: this.sfxVolume });
  }

  // ─── Public API ──────────────────────────────────────────────────────

  play(name: SoundName) {
    if (!this.enabled) return;
    const sound = this.sounds.get(name);
    if (sound) {
      sound.volume(this.sfxVolume);
      sound.play();
    }
  }

  playCardDeal(cardIndex = 0) {
    if (!this.enabled) return;
    setTimeout(() => this.play('card_deal'), cardIndex * 100);
  }

  playChipSound(amount: number) {
    if (!this.enabled) return;
    if (amount >= 10000) {
      this.play('chip_win');
    } else {
      this.play('chip_bet');
    }
  }

  playWin(amount: number) {
    if (!this.enabled) return;
    if (amount >= 100000) {
      this.play('win_jackpot');
    } else if (amount >= 10000) {
      this.play('win_big');
    } else {
      this.play('win_small');
    }
  }

  playCountdown(seconds: number) {
    if (!this.enabled) return;
    if (seconds === 3) this.play('countdown_3');
    else if (seconds === 2) this.play('countdown_2');
    else if (seconds === 1) this.play('countdown_1');
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (!enabled && this.currentMusic) {
      this.currentMusic.pause();
    }
  }

  setSfxVolume(volume: number) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
  }

  setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.currentMusic) {
      this.currentMusic.volume(this.musicVolume);
    }
  }
}

// ─── WAV Encoding Utility ──────────────────────────────────────────────────

function encodeWAV(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }

  return buffer;
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

// ─── Singleton ─────────────────────────────────────────────────────────────

export const soundManager = new SoundManager();
