/**
 * ANALYTICS SERVICE
 *
 * Unified event tracking. In dev: console logs. In prod: sends to window.mixpanel
 * if Mixpanel script is loaded via HTML tag.
 *
 * To activate: add Mixpanel script tag to index.html, or set VITE_MIXPANEL_TOKEN
 */

type Props = Record<string, string | number | boolean | null>;

class AnalyticsManager {
  private mp: any = null;

  init() {
    // Check if Mixpanel was loaded via script tag
    this.mp = (window as any).mixpanel || null;

    const token = import.meta.env.VITE_MIXPANEL_TOKEN;
    if (token && this.mp?.init) {
      this.mp.init(token, { track_pageview: false, persistence: 'localStorage' });
    }
  }

  identify(userId: string, traits?: Props) {
    this.mp?.identify?.(userId);
    if (traits) this.mp?.people?.set?.(traits);
  }

  track(event: string, properties?: Props) {
    if (this.mp?.track) {
      this.mp.track(event, { ...properties, timestamp: new Date().toISOString(), platform: 'web' });
    }
  }

  page(name: string) {
    this.track('Page View', { page: name });
  }

  reset() {
    this.mp?.reset?.();
  }

  // ─── Pre-built Game Events ───────────────────────────────────────────

  gameStarted(variant: string, playerCount: number, isQuickPlay: boolean) {
    this.track('game_started', { variant, player_count: playerCount, is_quick_play: isQuickPlay });
  }

  gameEnded(variant: string, isWinner: boolean, potSize: number, handRank: string) {
    this.track('game_ended', { variant, is_winner: isWinner, pot_size: potSize, hand_rank: handRank });
  }

  actionTaken(action: string, amount: number, isBlind: boolean) {
    this.track('action_taken', { action, amount, is_blind: isBlind });
  }

  chipsPurchased(packageId: string, amount: number, price: number) {
    this.track('chips_purchased', { package_id: packageId, chip_amount: amount, price_inr: price });
  }

  dailyRewardClaimed(day: number, streak: number, amount: number) {
    this.track('daily_reward_claimed', { day, streak, amount });
  }

  fairnessVerified(result: boolean) {
    this.track('fairness_verified', { result_valid: result });
  }

  screenViewed(screen: string) {
    this.page(screen);
  }
}

export const analytics = new AnalyticsManager();
