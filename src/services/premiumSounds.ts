/**
 * PREMIUM SOUND SYSTEM
 *
 * High-quality procedural sounds designed to feel like a luxury casino.
 * Each sound is carefully crafted with multiple oscillators, noise layers,
 * envelopes, and effects — not simple single-frequency beeps.
 *
 * Categories:
 * - Card sounds: deal, flip, fan, fold
 * - Chip sounds: bet (single), stack (multiple), win cascade
 * - UI sounds: button tap, turn alert, countdown
 * - Result sounds: win small, win big, jackpot, lose
 * - Social sounds: notification, chat, gift
 */

type SoundName =
  | 'card_deal' | 'card_flip' | 'card_fold'
  | 'chip_single' | 'chip_stack' | 'chip_cascade'
  | 'button_tap' | 'turn_alert' | 'countdown_tick' | 'countdown_urgent'
  | 'win_small' | 'win_big' | 'win_jackpot' | 'lose'
  | 'notification' | 'chat_msg' | 'gift'
  | 'game_start' | 'show_reveal';

class PremiumSoundEngine {
  private ctx: AudioContext | null = null;
  private enabled = true;
  private volume = 0.6;
  private initialized = false;

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.initialized = true;
    } catch {
      // Audio not supported
    }

    // Load settings
    try {
      const settings = JSON.parse(localStorage.getItem('teen-patti-ui') || '{}');
      const state = settings?.state;
      if (state) {
        this.enabled = state.soundEnabled ?? true;
        this.volume = state.sfxVolume ?? 0.6;
      }
    } catch {}
  }

  setEnabled(enabled: boolean) { this.enabled = enabled; }
  setVolume(vol: number) { this.volume = Math.max(0, Math.min(1, vol)); }

  play(name: SoundName) {
    if (!this.enabled || !this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    try {
      switch (name) {
        case 'card_deal': this.playCardDeal(); break;
        case 'card_flip': this.playCardFlip(); break;
        case 'card_fold': this.playCardFold(); break;
        case 'chip_single': this.playChipSingle(); break;
        case 'chip_stack': this.playChipStack(); break;
        case 'chip_cascade': this.playChipCascade(); break;
        case 'button_tap': this.playButtonTap(); break;
        case 'turn_alert': this.playTurnAlert(); break;
        case 'countdown_tick': this.playCountdownTick(); break;
        case 'countdown_urgent': this.playCountdownUrgent(); break;
        case 'win_small': this.playWinSmall(); break;
        case 'win_big': this.playWinBig(); break;
        case 'win_jackpot': this.playWinJackpot(); break;
        case 'lose': this.playLose(); break;
        case 'notification': this.playNotification(); break;
        case 'chat_msg': this.playChatMsg(); break;
        case 'gift': this.playGift(); break;
        case 'game_start': this.playGameStart(); break;
        case 'show_reveal': this.playShowReveal(); break;
      }
    } catch {
      // Silently fail
    }
  }

  // ─── Card Sounds ─────────────────────────────────────────────────────

  private playCardDeal() {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const vol = this.volume * 0.4;

    // Crisp snap sound — noise burst + resonant click
    const noise = this.createNoiseBurst(ctx, now, 0.06, vol * 0.8);
    const click = this.createTone(ctx, now, 2200, 0.03, 'triangle', vol * 0.5);
    const body = this.createTone(ctx, now + 0.01, 800, 0.05, 'sine', vol * 0.3);

    // High-pass filter on noise for crispness
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2000;
    noise.connect(hp);
    hp.connect(ctx.destination);
    click.connect(ctx.destination);
    body.connect(ctx.destination);
  }

  private playCardFlip() {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const vol = this.volume * 0.35;

    // Softer than deal — whoosh + light tap
    const whoosh = this.createNoiseBurst(ctx, now, 0.12, vol * 0.3);
    const tap = this.createTone(ctx, now + 0.03, 1800, 0.04, 'sine', vol * 0.4);

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 3000;
    bp.Q.value = 2;
    whoosh.connect(bp);
    bp.connect(ctx.destination);
    tap.connect(ctx.destination);
  }

  private playCardFold() {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const vol = this.volume * 0.3;

    // Muted thud — low frequency
    this.createTone(ctx, now, 300, 0.15, 'sine', vol * 0.5).connect(ctx.destination);
    this.createTone(ctx, now, 200, 0.1, 'triangle', vol * 0.3).connect(ctx.destination);
  }

  // ─── Chip Sounds ─────────────────────────────────────────────────────

  private playChipSingle() {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const vol = this.volume * 0.5;

    // Ceramic/clay chip clink — multiple high harmonics with quick decay
    [2800, 4200, 5600].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(vol * (0.4 - i * 0.1), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    });
  }

  private playChipStack() {
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // Multiple chips stacking — staggered clinks
    for (let i = 0; i < 3; i++) {
      setTimeout(() => this.playChipSingle(), i * 50);
    }
  }

  private playChipCascade() {
    const ctx = this.ctx!;
    // Rapid cascade of chip sounds — winning pot
    for (let i = 0; i < 8; i++) {
      setTimeout(() => this.playChipSingle(), i * 40 + Math.random() * 20);
    }
  }

  // ─── UI Sounds ───────────────────────────────────────────────────────

  private playButtonTap() {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const vol = this.volume * 0.2;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 1200;
    osc.type = 'sine';
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  private playTurnAlert() {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const vol = this.volume * 0.4;

    // Two-tone "ding" — your turn
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = 'sine';
      const start = now + i * 0.12;
      gain.gain.setValueAtTime(vol * 0.6, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.35);
    });
  }

  private playCountdownTick() {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const vol = this.volume * 0.15;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 600;
    osc.type = 'square';
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  private playCountdownUrgent() {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const vol = this.volume * 0.35;

    // Urgent double-beep
    [0, 0.08].forEach(delay => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      osc.type = 'square';
      gain.gain.setValueAtTime(vol, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.08);
    });
  }

  // ─── Result Sounds ───────────────────────────────────────────────────

  private playWinSmall() {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const vol = this.volume * 0.5;

    // Ascending triad — C E G
    [523, 659, 784].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = 'sine';
      const start = now + i * 0.1;
      gain.gain.setValueAtTime(vol * 0.5, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.5);
    });

    // Chip cascade after melody
    setTimeout(() => this.playChipCascade(), 300);
  }

  private playWinBig() {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const vol = this.volume * 0.55;

    // Major arpeggio — C E G C' E'
    [523, 659, 784, 1047, 1319].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc2.frequency.value = freq * 1.002; // Slight detune for richness
      osc.type = 'sine';
      osc2.type = 'sine';
      const start = now + i * 0.08;
      gain.gain.setValueAtTime(vol * 0.4, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.6);
      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc2.start(start);
      osc.stop(start + 0.7);
      osc2.stop(start + 0.7);
    });

    setTimeout(() => this.playChipCascade(), 400);
  }

  private playWinJackpot() {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const vol = this.volume * 0.6;

    // Triumphant fanfare — ascending then resolving
    const notes = [523, 659, 784, 1047, 784, 1047, 1319, 1568];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc2.frequency.value = freq * 1.5; // Fifth harmony
      osc.type = 'sine';
      osc2.type = 'sine';
      const start = now + i * 0.12;
      gain.gain.setValueAtTime(vol * 0.35, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc2.start(start);
      osc.stop(start + 0.6);
      osc2.stop(start + 0.6);
    });

    // Extended chip cascade
    for (let i = 0; i < 3; i++) {
      setTimeout(() => this.playChipCascade(), 500 + i * 300);
    }
  }

  private playLose() {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const vol = this.volume * 0.3;

    // Descending minor — sad trombone lite
    [440, 415, 392, 349].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = 'sine';
      const start = now + i * 0.15;
      gain.gain.setValueAtTime(vol * 0.4, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.4);
    });
  }

  // ─── Social Sounds ───────────────────────────────────────────────────

  private playNotification() {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const vol = this.volume * 0.3;

    [1200, 1600].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = 'sine';
      const start = now + i * 0.08;
      gain.gain.setValueAtTime(vol * 0.5, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.2);
    });
  }

  private playChatMsg() {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const vol = this.volume * 0.2;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 1400;
    osc.type = 'sine';
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  private playGift() {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const vol = this.volume * 0.4;

    // Sparkle/twinkle — ascending high notes
    [2000, 2500, 3000, 3500].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = 'sine';
      const start = now + i * 0.06;
      gain.gain.setValueAtTime(vol * 0.3, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.2);
    });
  }

  private playGameStart() {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const vol = this.volume * 0.45;

    // Dramatic two-tone announcement
    [660, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc2.frequency.value = freq * 1.002;
      osc.type = 'sine';
      osc2.type = 'triangle';
      const start = now + i * 0.15;
      gain.gain.setValueAtTime(vol * 0.5, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc2.start(start);
      osc.stop(start + 0.5);
      osc2.stop(start + 0.5);
    });
  }

  private playShowReveal() {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const vol = this.volume * 0.5;

    // Dramatic reveal — rising sweep + impact
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.3);
    osc.type = 'sawtooth';
    gain.gain.setValueAtTime(vol * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2000;

    osc.connect(lp);
    lp.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5);

    // Impact
    setTimeout(() => this.playChipSingle(), 300);
  }

  // ─── Utility ─────────────────────────────────────────────────────────

  private createTone(ctx: AudioContext, time: number, freq: number, dur: number, type: OscillatorType, vol: number): GainNode {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = type;
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
    osc.connect(gain);
    osc.start(time);
    osc.stop(time + dur + 0.01);
    return gain;
  }

  private createNoiseBurst(ctx: AudioContext, time: number, dur: number, vol: number): AudioBufferSourceNode {
    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 20) * vol;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, time);
    source.connect(gain);
    source.start(time);
    return source;
  }
}

export const premiumSounds = new PremiumSoundEngine();
