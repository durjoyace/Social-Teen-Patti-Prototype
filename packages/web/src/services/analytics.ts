type Props = Record<string, string | number | boolean | null>;
type MixpanelClient = typeof import('mixpanel-browser')['default'];

const SAFE_PROPERTY = /^[a-z][a-z0-9_]*$/;

class AnalyticsManager {
  private enabled = import.meta.env.VITE_ANALYTICS_ENABLED === 'true';
  private token = import.meta.env.VITE_MIXPANEL_TOKEN;
  private initialized = false;
  private initializing = false;
  private client: MixpanelClient | null = null;
  private pendingUserId: string | null = null;
  private pendingEvents: Array<{ event: string; properties: Props }> = [];
  private sessionId = '';

  init() {
    if (this.initialized || this.initializing) return;
    try {
      this.sessionId = sessionStorage.getItem('tp_analytics_session') || crypto.randomUUID();
      sessionStorage.setItem('tp_analytics_session', this.sessionId);
    } catch {
      this.sessionId = crypto.randomUUID();
    }
    if (this.enabled && this.token) {
      this.initializing = true;
      void import('mixpanel-browser').then(({ default: client }) => {
        client.init(this.token!, {
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
        this.pendingEvents.forEach(({ event, properties }) => client.track(event, properties));
        this.pendingEvents = [];
      }).catch(error => {
        this.pendingEvents = [];
        console.warn('[Analytics] Initialization failed', error);
      }).finally(() => {
        this.initializing = false;
      });
    }
  }

  identify(userId: string) {
    this.pendingUserId = userId;
    if (this.initialized) this.client?.identify(userId);
  }

  track(event: string, properties: Props = {}) {
    if (!/^[a-z][a-z0-9_]*$/.test(event)) return;
    const safeProperties = Object.fromEntries(
      Object.entries(properties).filter(([key, value]) => SAFE_PROPERTY.test(key) && value !== undefined),
    );
    const enrichedProperties = {
      ...safeProperties,
      occurred_at: new Date().toISOString(),
      platform: 'web',
      session_id: this.sessionId,
      schema_version: 1,
    };
    if (!this.initialized) {
      if (this.enabled && this.token) this.pendingEvents.push({ event, properties: enrichedProperties });
      return;
    }
    this.client?.track(event, enrichedProperties);
  }

  reset() {
    this.pendingUserId = null;
    if (this.initialized) this.client?.reset();
    this.sessionId = crypto.randomUUID();
    try {
      sessionStorage.setItem('tp_analytics_session', this.sessionId);
    } catch {
      // Analytics must never block gameplay when browser storage is unavailable.
    }
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

  welcomeViewed() {
    this.track('welcome_viewed');
  }

  authStarted(method: 'guest' | 'login' | 'register') {
    this.track('guest_or_account_started', { method });
  }

  friendTableCreated(variant: string, maxPlayers: number) {
    try {
      const now = Date.now();
      const previousHostedAt = Number(localStorage.getItem('tp_last_hosted_at') || 0);
      if (previousHostedAt > 0 && now - previousHostedAt >= 24 * 60 * 60 * 1000) {
        this.track('host_returned_24h', { hours_since_host: Math.round((now - previousHostedAt) / 3_600_000) });
      }
      localStorage.setItem('tp_last_hosted_at', String(now));
    } catch {
      // Host-return measurement is best effort and cannot interrupt room creation.
    }
    this.track('friend_table_created', { variant, max_players: maxPlayers });
  }

  friendJoined(source: 'room_code' | 'invite_link' | 'host_table') {
    this.track('friend_joined', { join_source: source });
  }

  firstHandStarted(variant: string, playerCount: number) {
    this.track('first_hand_started', { variant, player_count: playerCount });
  }

  multiplayerGameCompleted(variant: string, playerCount: number) {
    this.track('multiplayer_game_completed', { variant, player_count: playerCount });
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
