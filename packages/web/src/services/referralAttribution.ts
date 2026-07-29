import type { ReferralAttribution } from '../types';

const STORAGE_KEY = 'tp_referral_attribution';
const ROOM_STORAGE_KEY = 'tp_pending_room_code';
const CODE_PATTERN = /^TP[A-HJ-NP-Z2-9]{8}$/;
const ROOM_CODE_PATTERN = /^[A-Z0-9]{6}$/;

function normalizeCode(value: string | null) {
  return value?.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') ?? '';
}

export function captureReferralAttribution(): ReferralAttribution | null {
  const url = new URL(window.location.href);
  const pathMatch = url.pathname.match(/^\/invite\/([^/]+)/i);
  const code = normalizeCode(pathMatch?.[1] ?? url.searchParams.get('ref'));
  const roomCode = normalizeCode(url.searchParams.get('room'));

  if (ROOM_CODE_PATTERN.test(roomCode)) {
    localStorage.setItem(ROOM_STORAGE_KEY, roomCode);
  }

  if (CODE_PATTERN.test(code)) {
    const attribution: ReferralAttribution = {
      code,
      source: (url.searchParams.get('utm_source') || 'referral').slice(0, 64),
      campaign: (url.searchParams.get('utm_campaign') || 'table_circle').slice(0, 64),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
    return attribution;
  }

  return getPendingReferralAttribution();
}

export function getPendingReferralAttribution(): ReferralAttribution | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as ReferralAttribution | null;
    return parsed && CODE_PATTERN.test(normalizeCode(parsed.code)) ? parsed : null;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function clearReferralAttribution() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getPendingRoomCode() {
  const code = normalizeCode(localStorage.getItem(ROOM_STORAGE_KEY));
  return ROOM_CODE_PATTERN.test(code) ? code : null;
}

export function clearPendingRoomCode() {
  localStorage.removeItem(ROOM_STORAGE_KEY);
}
