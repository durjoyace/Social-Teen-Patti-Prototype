import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3001/api';

let authToken: string | null = null;
let deviceIdPromise: Promise<string> | null = null;

function getDeviceId() {
  if (!deviceIdPromise) {
    deviceIdPromise = (async () => {
      const existing = await SecureStore.getItemAsync('device_id');
      if (existing) return existing;
      const created = `tp_${Date.now()}_${Math.random().toString(36).slice(2, 14)}`;
      await SecureStore.setItemAsync('device_id', created);
      return created;
    })();
  }
  return deviceIdPromise;
}

export function setAuthToken(token: string | null) {
  authToken = token;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const deviceId = await getDeviceId();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Device-Id': deviceId,
    ...(options.headers as Record<string, string>),
  };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
};
