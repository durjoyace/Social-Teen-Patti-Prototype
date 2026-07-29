import { io } from 'socket.io-client';

const baseUrl = process.env.SMOKE_BASE_URL?.replace(/\/$/, '');
const webUrl = process.env.SMOKE_WEB_URL?.replace(/\/$/, '');
const mutating = process.env.SMOKE_MUTATING === 'true';

if (!baseUrl) throw new Error('SMOKE_BASE_URL is required, for example https://api.example.com');
if (!baseUrl.startsWith('https://') && !baseUrl.startsWith('http://localhost:')) {
  throw new Error('SMOKE_BASE_URL must use HTTPS unless it targets localhost');
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    signal: AbortSignal.timeout(10_000),
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${options.method || 'GET'} ${path} returned ${response.status}: ${body.error || 'unknown error'}`);
  return body;
}

async function createGuest(label, referralCode) {
  return request('/api/auth/guest', {
    method: 'POST',
    headers: { 'X-Device-Id': `production-smoke-${label}-${Date.now()}` },
    body: JSON.stringify({
      username: `smoke_${label}`,
      adultConfirmed: true,
      referralCode,
      referralSource: referralCode ? 'production_smoke' : undefined,
      referralCampaign: referralCode ? 'deployment_gate' : undefined,
    }),
  });
}

function connectSocket(token) {
  return new Promise((resolve, reject) => {
    const socket = io(baseUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: false,
      timeout: 10_000,
    });
    const timer = setTimeout(() => {
      socket.disconnect();
      reject(new Error('WebSocket connection timed out'));
    }, 12_000);
    socket.once('connect', () => {
      clearTimeout(timer);
      resolve(socket);
    });
    socket.once('connect_error', error => {
      clearTimeout(timer);
      socket.disconnect();
      reject(error);
    });
  });
}

function emitAck(socket, event, payload) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${event} acknowledgment timed out`)), 10_000);
    socket.emit(event, payload, response => {
      clearTimeout(timer);
      resolve(response);
    });
  });
}

async function deleteGuest(guest) {
  if (!guest?.token) return;
  await request('/api/users/account', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${guest.token}` },
    body: JSON.stringify({ confirmation: 'DELETE' }),
  });
}

const result = { health: false, ready: false, web: !webUrl, auth: !mutating, socket: !mutating, referral: !mutating, cleanup: !mutating };
const health = await request('/health');
if (health.status !== 'ok') throw new Error('Health response is not ok');
result.health = true;

const ready = await request('/ready');
if (ready.status !== 'ready') throw new Error('Readiness response is not ready');
result.ready = true;

if (webUrl) {
  const response = await fetch(webUrl, { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`Web check returned ${response.status}`);
  result.web = true;
}

if (mutating) {
  let inviter;
  let invitee;
  let inviterSocket;
  let inviteeSocket;
  try {
    inviter = await createGuest('inviter');
    const summary = await request('/api/referrals/summary', {
      headers: { Authorization: `Bearer ${inviter.token}` },
    });
    if (!summary.code) throw new Error('Referral summary did not issue a referral code');
    await request('/api/referrals/share', {
      method: 'POST',
      headers: { Authorization: `Bearer ${inviter.token}` },
      body: JSON.stringify({ platform: 'COPY', campaign: 'deployment_gate' }),
    });

    invitee = await createGuest('invitee', summary.code);
    if (!invitee.referralAttribution?.attributed) throw new Error('Referral attribution failed');
    result.auth = true;
    result.referral = true;

    inviterSocket = await connectSocket(inviter.token);
    const created = await emitAck(inviterSocket, 'room:create', {
      name: 'Production smoke table',
      variant: 'CLASSIC',
      bootAmount: 50,
      minBuyIn: 500,
      maxBuyIn: 5000,
      maxPlayers: 2,
      isPrivate: true,
      buyIn: 5000,
    });
    if (!created?.success || !created.room?.roomCode) throw new Error(created?.error || 'Private room creation failed');

    inviteeSocket = await connectSocket(invitee.token);
    const joined = await emitAck(inviteeSocket, 'room:join_by_code', { code: created.room.roomCode, buyIn: 5000 });
    if (!joined?.success) throw new Error(joined?.error || 'Friend could not join private room');
    result.socket = true;
  } finally {
    inviterSocket?.disconnect();
    inviteeSocket?.disconnect();
    const cleanupResults = await Promise.allSettled([deleteGuest(invitee), deleteGuest(inviter)]);
    result.cleanup = cleanupResults.every(item => item.status === 'fulfilled');
    if (!result.cleanup) throw new Error('Smoke accounts could not be anonymized');
  }
}

console.log(JSON.stringify({ status: 'ok', ...result }));
