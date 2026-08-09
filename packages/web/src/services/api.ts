import type { ReferralAttribution, ReferralSharePlatform, ReferralSummary } from '../types';

const configuredApiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
const API_URL = configuredApiUrl && (!import.meta.env.PROD || configuredApiUrl.startsWith('https://'))
  ? configuredApiUrl
  : import.meta.env.DEV ? 'http://localhost:3001/api' : '';

interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  details?: unknown;
}

class ApiClient {
  private token: string | null = null;
  private refreshToken: string | null = null;
  private volatileDeviceId = crypto.randomUUID();

  private getDeviceId() {
    try {
      let deviceId = localStorage.getItem('tp_device_id');
      if (!deviceId) {
        deviceId = this.volatileDeviceId;
        localStorage.setItem('tp_device_id', deviceId);
      }
      return deviceId;
    } catch {
      return this.volatileDeviceId;
    }
  }

  setTokens(token: string, refreshToken: string) {
    this.token = token;
    this.refreshToken = refreshToken;
    try {
      localStorage.setItem('tp_token', token);
      localStorage.setItem('tp_refresh_token', refreshToken);
    } catch {
      // In-memory tokens still allow the current private-storage session to play.
    }
  }

  loadTokens() {
    try {
      this.token = localStorage.getItem('tp_token');
      this.refreshToken = localStorage.getItem('tp_refresh_token');
    } catch {
      this.token = null;
      this.refreshToken = null;
    }
  }

  clearTokens() {
    this.token = null;
    this.refreshToken = null;
    try {
      localStorage.removeItem('tp_token');
      localStorage.removeItem('tp_refresh_token');
    } catch {
      // Tokens are already cleared in memory.
    }
  }

  getToken() {
    return this.token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    if (!API_URL) throw new Error('The production game server is not configured');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Device-Id': this.getDeviceId(),
      ...options.headers as Record<string, string>,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });

    if (res.status === 401 && this.refreshToken) {
      // Try refresh
      const refreshed = await this.refreshAuth();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.token}`;
        const retryRes = await fetch(`${API_URL}${path}`, { ...options, headers });
        if (!retryRes.ok) throw new Error(await retryRes.text());
        return retryRes.json();
      }
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(body.error || res.statusText);
    }

    return res.json();
  }

  private async refreshAuth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!res.ok) {
        this.clearTokens();
        return false;
      }

      const data = await res.json();
      this.setTokens(data.token, data.refreshToken);
      return true;
    } catch {
      // Preserve the session through temporary network failures.
      return false;
    }
  }

  // ─── Auth ──────────────────────────────────────────────────────────────

  async guestLogin(username?: string, referral?: ReferralAttribution | null) {
    const data = await this.request<{ user: any; token: string; refreshToken: string; referralAttribution?: { attributed: boolean; reason?: string } }>(
      '/auth/guest',
      {
        method: 'POST',
        body: JSON.stringify({
          username,
          adultConfirmed: true,
          referralCode: referral?.code,
          referralSource: referral?.source,
          referralCampaign: referral?.campaign,
        }),
      }
    );
    this.setTokens(data.token, data.refreshToken);
    return data;
  }

  async register(username: string, email: string, password: string, referral?: ReferralAttribution | null) {
    const data = await this.request<{ user: any; token: string; refreshToken: string; referralAttribution?: { attributed: boolean; reason?: string } }>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({
          username,
          email,
          password,
          adultConfirmed: true,
          referralCode: referral?.code,
          referralSource: referral?.source,
          referralCampaign: referral?.campaign,
        }),
      }
    );
    this.setTokens(data.token, data.refreshToken);
    return data;
  }

  async login(usernameOrEmail: string, password: string) {
    const isEmail = usernameOrEmail.includes('@');
    const data = await this.request<{ user: any; token: string; refreshToken: string }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({
          [isEmail ? 'email' : 'username']: usernameOrEmail,
          password,
        }),
      }
    );
    this.setTokens(data.token, data.refreshToken);
    return data;
  }

  async getProfile() {
    return this.request<{ user: any }>('/auth/me');
  }

  async upgradeAccount(data: { username?: string; email: string; password: string }) {
    const result = await this.request<{ user: any; token: string; refreshToken: string }>(
      '/auth/upgrade',
      { method: 'POST', body: JSON.stringify(data) }
    );
    this.setTokens(result.token, result.refreshToken);
    return result;
  }

  // ─── Users ─────────────────────────────────────────────────────────────

  async updateProfile(data: { username?: string; avatarUrl?: string }) {
    return this.request<{ user: any }>('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteAccount(confirmation: string, password?: string) {
    return this.request<{ deleted: true }>('/users/account', {
      method: 'DELETE',
      body: JSON.stringify({ confirmation, password: password || undefined }),
    });
  }

  async getStats() {
    return this.request<{ stats: any }>('/users/stats');
  }

  async getTransactions(page = 1, limit = 20) {
    return this.request<{ transactions: any[]; pagination: any }>(
      `/users/transactions?page=${page}&limit=${limit}`
    );
  }

  async getLeaderboard(period = 'ALL_TIME', limit = 50) {
    return this.request<{ leaderboard: any[]; period: string }>(
      `/users/leaderboard?period=${period}&limit=${limit}`
    );
  }

  // ─── Social ────────────────────────────────────────────────────────────

  async getFriends() {
    return this.request<{ friends: any[] }>('/users/friends');
  }

  async sendFriendRequest(userId: string) {
    return this.request('/users/friends/request', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async respondToFriendRequest(friendshipId: string, action: 'accept' | 'reject' | 'block') {
    return this.request(`/users/friends/${friendshipId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action }),
    });
  }

  async searchUsers(query: string) {
    return this.request<{ users: any[] }>(`/users/search?q=${encodeURIComponent(query)}`);
  }

  // ─── Daily Rewards ─────────────────────────────────────────────────────

  async claimDailyReward() {
    return this.request<{ reward: any }>('/users/daily-reward', { method: 'POST' });
  }

  // ─── Notifications ─────────────────────────────────────────────────────

  async getNotifications() {
    return this.request<{ notifications: any[] }>('/users/notifications');
  }

  async markNotificationsRead() {
    return this.request('/users/notifications/read-all', { method: 'POST' });
  }

  // ─── Referrals & Beli ────────────────────────────────────────────────

  async getReferralSummary() {
    return this.request<ReferralSummary>('/referrals/summary');
  }

  async recordReferralShare(platform: ReferralSharePlatform, campaign = 'table_circle') {
    return this.request<{ share: { id: string; createdAt: string } }>('/referrals/share', {
      method: 'POST',
      body: JSON.stringify({ platform, campaign }),
    });
  }

  async redeemBeli(itemId: string) {
    return this.request<{ beliBalance: number; entitlement: unknown }>('/referrals/redeem', {
      method: 'POST',
      body: JSON.stringify({ itemId }),
    });
  }

  // ─── Payments ────────────────────────────────────────────────────────

  async createPaymentOrder(packageId: string) {
    return this.request<{ orderId: string; amount: number; keyId: string }>('/payments/create-order', {
      method: 'POST',
      body: JSON.stringify({ packageId }),
    });
  }

  async verifyPayment(paymentId: string, orderId: string, signature: string) {
    return this.request<{ success: boolean; chips: string; balance: string }>('/payments/verify', {
      method: 'POST',
      body: JSON.stringify({ paymentId, orderId, signature }),
    });
  }
}

export const api = new ApiClient();
