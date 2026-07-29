type Props = Record<string, string | number | boolean | null>;
type MixpanelClient = typeof import('mixpanel-browser')['default'];

const SAFE_PROPERTY = /^[a-z][a-z0-9_]*$/;

class AnalyticsManager {
  private enabled = import.meta.env.VITE_ANALYTICS_ENABLED === 'true';
  private initialized = false;
  private client: MixpanelClient | null = null;
  private pendingUserId: string | null = null;
  private sessionId = '';

  init() {
    if (this.initialized) return;
    this.sessionId = sessionStorage.getItem('tp_analytics_session') || crypto.randomUUID();
    sessionStorage.setItem('tp_analytics_session', this.sessionId);
    const token = import.meta.env.VITE_MIXPANEL_TOKEN;
    if (this.enabled && token) {
      void import('mixpanel-browser').then(({ default: client }) => {
        client.init(token, {
          autocapture: false,
          track_pageview: false,
          persistence: 'localStorage',
          ignore_dnt: false,
          ip: false,
          secure_cookie: true,
        });
        this.client = client;
        this.initialized = true;
        if (this.pendingUserId) client.identify(this.pendingUserId);
      }).catch(error => console.warn('[Analytics] Initialization failed', error));
    }
  }

  identify(userId: string) {
    this.pendingUserId = userId;
    if (this.initialized) this.client?.identify(userId);
  }

  track(event: string, properties: Props = {}) {
    if (!this.initialized || !/^[a-z][a-z0-9_]*$/.test(event)) return;
    const safeProperties = Object.fromEntries(
      Object.entries(properties).filter(([key, value]) => SAFE_PROPERTY.test(key) && value !== undefined),
    );
    this.client?.track(event, {
      ...safeProperties,
      occurred_at: new Date().toISOString(),
      platform: 'web',
      session_id: this.sessionId,
      schema_version: 1,
    });
  }

  reset() {
    this.pendingUserId = null;
    if (this.initialized) this.client?.reset();
    this.sessionId = crypto.randomUUID();
    sessionStorage.setItem('tp_analytics_session', this.sessionId);
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
