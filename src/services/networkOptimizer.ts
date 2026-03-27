/**
 * NETWORK OPTIMIZER
 *
 * Optimized for Indian mobile networks (2G/3G/4G).
 * - Connection quality detection
 * - Delta compression for game state updates
 * - Message queuing for offline periods
 * - Adaptive quality settings (reduce animations, simplify UI)
 * - Bandwidth-aware asset loading
 *
 * Target: P95 < 300ms round-trip, works on 2G (~1.5 KB/sec per player)
 */

// ─── Connection Quality Detection ──────────────────────────────────────────

export type ConnectionQuality = 'offline' | '2g' | '3g' | '4g' | 'wifi';

interface NetworkInfo {
  quality: ConnectionQuality;
  downlinkMbps: number;
  rtt: number;
  saveData: boolean;
}

export function detectNetworkQuality(): NetworkInfo {
  const nav = navigator as any;
  const connection = nav.connection || nav.mozConnection || nav.webkitConnection;

  if (!navigator.onLine) {
    return { quality: 'offline', downlinkMbps: 0, rtt: Infinity, saveData: false };
  }

  if (!connection) {
    // Can't detect — assume decent connection
    return { quality: '4g', downlinkMbps: 10, rtt: 50, saveData: false };
  }

  const effectiveType = connection.effectiveType as string;
  const downlink = connection.downlink as number || 10;
  const rtt = connection.rtt as number || 50;
  const saveData = connection.saveData as boolean || false;

  let quality: ConnectionQuality;
  switch (effectiveType) {
    case 'slow-2g':
    case '2g':
      quality = '2g';
      break;
    case '3g':
      quality = '3g';
      break;
    case '4g':
      quality = downlink > 5 ? 'wifi' : '4g';
      break;
    default:
      quality = '4g';
  }

  return { quality, downlinkMbps: downlink, rtt, saveData };
}

// ─── Adaptive Quality Settings ─────────────────────────────────────────────

export interface QualitySettings {
  enableAnimations: boolean;
  enableParticles: boolean;
  enableBackgroundEffects: boolean;
  enableSounds: boolean;
  enableHaptics: boolean;
  imageQuality: 'low' | 'medium' | 'high';
  maxFPS: number;
  enableVoiceChat: boolean;
  enableGiftAnimations: boolean;
  enableConfetti: boolean;
  stateUpdateInterval: number;  // ms between full state refreshes
  cardAnimationDuration: number; // ms for card flip/deal
}

export function getQualitySettings(quality: ConnectionQuality, saveData: boolean): QualitySettings {
  if (quality === '2g' || saveData) {
    return {
      enableAnimations: false,
      enableParticles: false,
      enableBackgroundEffects: false,
      enableSounds: false,
      enableHaptics: true, // Haptics are local, no bandwidth
      imageQuality: 'low',
      maxFPS: 30,
      enableVoiceChat: false,
      enableGiftAnimations: false,
      enableConfetti: false,
      stateUpdateInterval: 5000,
      cardAnimationDuration: 100,
    };
  }

  if (quality === '3g') {
    return {
      enableAnimations: true,
      enableParticles: false,
      enableBackgroundEffects: false,
      enableSounds: true,
      enableHaptics: true,
      imageQuality: 'medium',
      maxFPS: 30,
      enableVoiceChat: true,
      enableGiftAnimations: true,
      enableConfetti: false,
      stateUpdateInterval: 3000,
      cardAnimationDuration: 200,
    };
  }

  // 4G / WiFi — full quality
  return {
    enableAnimations: true,
    enableParticles: true,
    enableBackgroundEffects: true,
    enableSounds: true,
    enableHaptics: true,
    imageQuality: 'high',
    maxFPS: 60,
    enableVoiceChat: true,
    enableGiftAnimations: true,
    enableConfetti: true,
    stateUpdateInterval: 1000,
    cardAnimationDuration: 400,
  };
}

// ─── Delta Compression ─────────────────────────────────────────────────────

/**
 * Only send changed fields between game state updates.
 * Reduces bandwidth from ~2KB per update to ~200 bytes for most actions.
 */
export function computeDelta(prevState: Record<string, any>, newState: Record<string, any>): Record<string, any> {
  const delta: Record<string, any> = {};

  for (const key of Object.keys(newState)) {
    const prev = prevState[key];
    const next = newState[key];

    if (prev === next) continue;

    if (typeof next === 'object' && next !== null && !Array.isArray(next) && typeof prev === 'object' && prev !== null) {
      const innerDelta = computeDelta(prev, next);
      if (Object.keys(innerDelta).length > 0) {
        delta[key] = innerDelta;
      }
    } else if (JSON.stringify(prev) !== JSON.stringify(next)) {
      delta[key] = next;
    }
  }

  return delta;
}

export function applyDelta(state: Record<string, any>, delta: Record<string, any>): Record<string, any> {
  const result = { ...state };

  for (const key of Object.keys(delta)) {
    if (typeof delta[key] === 'object' && delta[key] !== null && !Array.isArray(delta[key]) &&
        typeof result[key] === 'object' && result[key] !== null) {
      result[key] = applyDelta(result[key], delta[key]);
    } else {
      result[key] = delta[key];
    }
  }

  return result;
}

// ─── Message Queue (for offline periods) ────────────────────────────────────

interface QueuedMessage {
  event: string;
  data: any;
  timestamp: number;
  retries: number;
}

export class MessageQueue {
  private queue: QueuedMessage[] = [];
  private maxQueueSize = 50;
  private maxRetries = 3;
  private isProcessing = false;

  enqueue(event: string, data: any) {
    if (this.queue.length >= this.maxQueueSize) {
      // Drop oldest non-critical messages
      this.queue = this.queue.filter(m => m.event.startsWith('game:'));
    }

    this.queue.push({
      event,
      data,
      timestamp: Date.now(),
      retries: 0,
    });
  }

  async flush(sendFn: (event: string, data: any) => Promise<boolean>) {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    const toProcess = [...this.queue];
    this.queue = [];

    for (const msg of toProcess) {
      try {
        const sent = await sendFn(msg.event, msg.data);
        if (!sent && msg.retries < this.maxRetries) {
          msg.retries++;
          this.queue.push(msg);
        }
      } catch {
        if (msg.retries < this.maxRetries) {
          msg.retries++;
          this.queue.push(msg);
        }
      }
    }

    this.isProcessing = false;
  }

  get pendingCount(): number {
    return this.queue.length;
  }

  clear() {
    this.queue = [];
  }
}

// ─── Connection Monitor ────────────────────────────────────────────────────

type NetworkChangeCallback = (info: NetworkInfo) => void;

export class ConnectionMonitor {
  private listeners: Set<NetworkChangeCallback> = new Set();
  private currentInfo: NetworkInfo;
  private checkInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.currentInfo = detectNetworkQuality();
    this.startMonitoring();
  }

  private startMonitoring() {
    // Listen to online/offline events
    window.addEventListener('online', () => this.update());
    window.addEventListener('offline', () => this.update());

    // Listen to connection change events
    const nav = navigator as any;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    if (connection) {
      connection.addEventListener('change', () => this.update());
    }

    // Periodic check (fallback)
    this.checkInterval = setInterval(() => this.update(), 30000);
  }

  private update() {
    const newInfo = detectNetworkQuality();
    const changed = newInfo.quality !== this.currentInfo.quality;
    this.currentInfo = newInfo;

    if (changed) {
      this.listeners.forEach(cb => cb(newInfo));
    }
  }

  get info(): NetworkInfo {
    return this.currentInfo;
  }

  onChange(callback: NetworkChangeCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  destroy() {
    if (this.checkInterval) clearInterval(this.checkInterval);
    this.listeners.clear();
  }
}

// ─── Singleton ─────────────────────────────────────────────────────────────

export const connectionMonitor = new ConnectionMonitor();
export const messageQueue = new MessageQueue();
