import type { ReferralAttribution } from '../types';

const STORAGE_KEY = 'tp_referral_attribution';
const ROOM_STORAGE_KEY = 'tp_pending_room_code';
const CODE_PATTERN = /^TP[A-HJ-NP-Z2-9]{8}$/;
const ROOM_CODE_PATTERN = /^[A-Z0-9]{6}$/;
let memoryAttribution: ReferralAttribution | null = null;
let memoryRoomCode = '';

function normalizeCode(value: string | null) {
  return value?.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') ?? '';
}

function readStored(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Attribution is best effort when browser storage is unavailable.
  }
}

function removeStored(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // There is nothing else to clear in a storage-restricted session.
  }
}

export function captureReferralAttribution(): ReferralAttribution | null {
  const url = new URL(window.location.href);
  const pathMatch = url.pathname.match(/^\/invite\/([^/]+)/i);
  const code = normalizeCode(pathMatch?.[1] ?? url.searchParams.get('ref'));
  const roomCode = normalizeCode(url.searchParams.get('room'));

  if (ROOM_CODE_PATTERN.test(roomCode)) {
    memoryRoomCode = roomCode;
    writeStored(ROOM_STORAGE_KEY, roomCode);
  }

  if (CODE_PATTERN.test(code)) {
    const attribution: ReferralAttribution = {
      code,
      source: (url.searchParams.get('utm_source') || 'referral').slice(0, 64),
      campaign: (url.searchParams.get('utm_campaign') || 'table_circle').slice(0, 64),
    };
    memoryAttribution = attribution;
    writeStored(STORAGE_KEY, JSON.stringify(attribution));
    return attribution;
  }

  return getPendingReferralAttribution();
}

export function getPendingReferralAttribution(): ReferralAttribution | null {
  if (memoryAttribution) return memoryAttribution;
  try {
    const parsed = JSON.parse(readStored(STORAGE_KEY) || 'null') as ReferralAttribution | null;
    return parsed && CODE_PATTERN.test(normalizeCode(parsed.code)) ? parsed : null;
  } catch {
    removeStored(STORAGE_KEY);
    return null;
  }
}

export function clearReferralAttribution() {
  memoryAttribution = null;
  removeStored(STORAGE_KEY);
}

export function getPendingRoomCode() {
  const code = normalizeCode(memoryRoomCode || readStored(ROOM_STORAGE_KEY));
  return ROOM_CODE_PATTERN.test(code) ? code : null;
}

export function clearPendingRoomCode() {
  memoryRoomCode = '';
  removeStored(ROOM_STORAGE_KEY);
}
