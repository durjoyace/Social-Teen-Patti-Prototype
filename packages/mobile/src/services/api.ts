import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  Constants.expoConfig?.extra?.apiUrl ||
  "http://localhost:3001/api";

let authToken: string | null = null;
let deviceIdPromise: Promise<string> | null = null;

function getDeviceId() {
  if (!deviceIdPromise) {
    deviceIdPromise = (async () => {
      const existing = await SecureStore.getItemAsync("device_id");
      if (existing) return existing;
      const created = `tp_${Date.now()}_${Math.random().toString(36).slice(2, 14)}`;
      await SecureStore.setItemAsync("device_id", created);
      return created;
    })();
  }
  return deviceIdPromise;
}

export function setAuthToken(token: string | null) {
  authToken = token;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export const getAuthToken = () => authToken;
export async function saveTokens(token: string, refreshToken: string) {
  await SecureStore.setItemAsync("refresh_token", refreshToken);
  await SecureStore.setItemAsync("auth_token", token);
  setAuthToken(token);
}
let refreshing: Promise<boolean> | null = null;
export function refreshAuth(): Promise<boolean> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const refreshToken = await SecureStore.getItemAsync("refresh_token");
    const legacyToken = !refreshToken
      ? await SecureStore.getItemAsync("auth_token")
      : null;
    if (!refreshToken && !legacyToken) return false;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch(
        `${API_URL}/auth/${refreshToken ? "refresh" : "legacy-session"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            refreshToken ? { refreshToken } : { token: legacyToken },
          ),
          signal: controller.signal,
        },
      );
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          await SecureStore.deleteItemAsync("auth_token");
          await SecureStore.deleteItemAsync("refresh_token");
          setAuthToken(null);
        }
        throw new ApiError("Could not renew your session", res.status);
      }
      const tokens = await res.json();
      await saveTokens(tokens.token, tokens.refreshToken);
      return true;
    } finally {
      clearTimeout(timer);
    }
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}
async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const deviceId = await getDeviceId();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Device-Id": deviceId,
    ...(options.headers as Record<string, string>),
  };
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
  if (
    res.status === 401 &&
    retry &&
    !path.startsWith("/auth/login") &&
    (await refreshAuth())
  )
    return request<T>(path, options, false);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error || `HTTP ${res.status}`, res.status);
  }

  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "DELETE",
      body: body ? JSON.stringify(body) : undefined,
    }),
};
