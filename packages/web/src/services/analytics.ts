type Props = Record<string, string | number | boolean | null>;

const SAFE_PROPERTY = /^[a-z][a-z0-9_]*$/;

class AnalyticsManager {
  private mp: any = null;
  private enabled = import.meta.env.VITE_ANALYTICS_ENABLED !== 'false';
  private sessionId = '';

  init() {
    this.sessionId = sessionStorage.getItem('tp_analytics_session') || crypto.randomUUID();
    sessionStorage.setItem('tp_analytics_session', this.sessionId);
    this.mp = (window as any).mixpanel || null;
    const token = import.meta.env.VITE_MIXPANEL_TOKEN;
    if (this.enabled && token && this.mp?.init) {
      this.mp.init(token, {
        track_pageview: false,
        persistence: 'localStorage',
        ignore_dnt: false,
      });
    }
  }

  identify(userId: string) {
    if (this.enabled) this.mp?.identify?.(userId);
  }

  track(event: string, properties: Props = {}) {
    if (!this.enabled || !/^[a-z][a-z0-9_]*$/.test(event)) return;
    const safeProperties = Object.fromEntries(
      Object.entries(properties).filter(([key, value]) => SAFE_PROPERTY.test(key) && value !== undefined),
    );
    this.mp?.track?.(event, {
      ...safeProperties,
      occurred_at: new Date().toISOString(),
      platform: 'web',
      session_id: this.sessionId,
      schema_version: 1,
    });
  }

  reset() {
    this.mp?.reset?.();
    sessionStorage.removeItem('tp_analytics_session');
  }

  gameStarted(variant: string, playerCount: number, isQuickPlay: boolean) {
    this.track('game_started', { variant, player_count: playerCount, is_quick_play: isQuickPlay });
  }

  gameEnded(variant: string, isWinner: boolean, potSize: number, handRank: string) {
    this.track('game_ended', { variant, is_winner: isWinner, pot_size: potSize, hand_rank: handRank });
  }

  actionTaken(action: string, amount: number, isBlind: boolean) {
    this.track('game_action_taken', { action, amount, is_blind: isBlind });
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
    this.track('screen_viewed', { screen });
  }

  referralLinkOpened(source: string, campaign: string) {
    this.track('referral_link_opened', { source, campaign });
  }

  referralHubViewed(activatedCount: number) {
    this.track('referral_hub_viewed', { activated_count: activatedCount });
  }

  inviteShareStarted(platform: string) {
    this.track('invite_share_started', { share_platform: platform });
  }

  inviteShared(platform: string) {
    this.track('invite_shared', { share_platform: platform });
  }

  referralCodeCopied() {
    this.track('referral_code_copied');
  }

  rewardRedeemed(itemId: string, costBeli: number) {
    this.track('reward_redeemed', { item_id: itemId, cost_beli: costBeli });
  }
}

export const analytics = new AnalyticsManager();
