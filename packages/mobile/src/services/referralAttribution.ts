import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import type { ReferralAttribution } from '../types/referrals';

const STORAGE_KEY = 'referral_attribution';
const ROOM_STORAGE_KEY = 'pending_room_code';
const CODE_PATTERN = /^TP[A-HJ-NP-Z2-9]{8}$/;
const ROOM_CODE_PATTERN = /^[A-Z0-9]{6}$/;

const normalizeCode = (value?: string | string[] | null) => {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') ?? '';
};

export async function captureReferralUrl(url: string | null) {
  if (!url) return null;
  const parsed = Linking.parse(url);
  const pathMatch = parsed.path?.match(/^invite\/([^/]+)/i);
  const code = normalizeCode(pathMatch?.[1] ?? parsed.queryParams?.ref);
  const roomCode = normalizeCode(parsed.queryParams?.room);
  if (ROOM_CODE_PATTERN.test(roomCode)) {
    await SecureStore.setItemAsync(ROOM_STORAGE_KEY, roomCode);
  }
  if (!CODE_PATTERN.test(code)) return null;

  const attribution: ReferralAttribution = {
    code,
    source: normalizeTracking(parsed.queryParams?.utm_source) || 'referral',
    campaign: normalizeTracking(parsed.queryParams?.utm_campaign) || 'table_circle',
  };
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(attribution));
  return attribution;
}

function normalizeTracking(value?: string | string[]) {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim().slice(0, 64);
}

export async function getPendingReferralAttribution(): Promise<ReferralAttribution | null> {
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) as ReferralAttribution : null;
    return parsed && CODE_PATTERN.test(normalizeCode(parsed.code)) ? parsed : null;
  } catch {
    await clearReferralAttribution();
    return null;
  }
}

export async function clearReferralAttribution() {
  await SecureStore.deleteItemAsync(STORAGE_KEY);
}

export async function getPendingRoomCode() {
  const code = normalizeCode(await SecureStore.getItemAsync(ROOM_STORAGE_KEY));
  return ROOM_CODE_PATTERN.test(code) ? code : null;
}

export async function clearPendingRoomCode() {
  await SecureStore.deleteItemAsync(ROOM_STORAGE_KEY);
}
