# Social Teen Patti

An adults-only social Teen Patti prototype centered on fast private tables: share a link or room code, bring a real friend into a server-authoritative game, and unlock non-cash Beli identity extras together.

## What is productionized

- Web and Expo mobile invite attribution, one-link private-table joining, native/WhatsApp sharing, referral status, milestones, and Beli redemption
- Double-sided Beli only after the invitee completes a persisted game with at least two human players
- Transactional/idempotent reward ledger with self-referral, duplicate-device, IP, and velocity controls
- Server-backed public/private rooms, room-code joining, auto-start at the second human, reconnect support, and server game actions
- Fail-closed production environment validation, readiness/health endpoints, exact CORS allowlist, request IDs, and API rate limits
- Purchases disabled by default; no demo order or automatic verification path
- Web/mobile 18+ confirmation recorded at account creation and cash-like language removed from every shipped acquisition/game surface
- Automated game/referral tests, PostgreSQL integration coverage, typechecks, production audit, builds, mobile export, and GitHub Actions

## Architecture

```text
packages/shared   Pure TypeScript rules, types, economy, and i18n
packages/web      React 19, Vite, Tailwind, Framer Motion
packages/mobile   Expo SDK 55, React Native, Expo Router
server            Express 5, Socket.io, Prisma, PostgreSQL
```

The current real-time room manager is intentionally single-replica. Read [the production runbook](docs/production-runbook.md) before deployment or scaling.

## Local setup

Requirements: Node.js 22, pnpm 9, and PostgreSQL 16+.

```bash
pnpm install --frozen-lockfile
cp server/.env.example server/.env
cp packages/web/.env.example packages/web/.env
pnpm generate
pnpm --filter teen-patti-server exec prisma migrate deploy
pnpm dev:server
pnpm dev:web
```

For Expo, configure URLs for a device-reachable backend:

```bash
EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:3001/api \
EXPO_PUBLIC_SOCKET_URL=http://YOUR_LAN_IP:3001 \
pnpm dev:mobile
```

## Verification

```bash
pnpm test
pnpm typecheck
pnpm build
pnpm audit:prod
pnpm verify
pnpm --filter @teen-patti/mobile exec expo export --platform android --output-dir dist-ci
```

The database integration test runs when `TEST_DATABASE_URL` is present. CI provisions PostgreSQL, applies migrations, and runs it automatically.

## Production configuration

Server:

```env
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=<at-least-32-random-characters>
JWT_REFRESH_SECRET=<different-secret>
REFERRAL_HASH_SECRET=<different-secret>
PUBLIC_APP_URL=https://social-teen-patti.vercel.app
CORS_ORIGIN=https://social-teen-patti.vercel.app
TRUST_PROXY=1
APP_VERSION=<release-sha>
PURCHASES_ENABLED=false
```

Web:

```env
VITE_API_URL=https://YOUR_API/api
VITE_SOCKET_URL=https://YOUR_API
VITE_ANALYTICS_ENABLED=true
VITE_MIXPANEL_TOKEN=
VITE_PURCHASES_ENABLED=false
```

Mobile release builds require `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_SOCKET_URL` in EAS. Localhost values in `app.json` are development fallbacks and must never ship as release configuration.

## Referral contract

An invite link may include both the personal referral code and a private room code. Web and mobile preserve both through authentication and automatically join the friend table. The referral is `PENDING` after attribution. The first completed server game with at least two humans qualifies it. In one serializable transaction, each side receives 100 Beli, the inviter receives any exact-count milestone award, notifications are written, and the referral becomes `REWARDED`. AI games and repeat games do not qualify.

Beli cannot be purchased, transferred, wagered, converted to chips, cashed out, or exchanged for money. See:

- [Referral system](docs/referral-system.md)
- [Analytics contract](docs/analytics-tracking.md)
- [Referral terms](docs/referral-terms.md)
- [Privacy notes](docs/privacy.md)
- [Responsible play](docs/responsible-play.md)
- [Production runbook](docs/production-runbook.md)

## API and health

- `GET /health` — process liveness and release version
- `GET /ready` — database readiness
- `/api/auth/*` — guest/register/login/refresh/profile
- `/api/referrals/summary` — code, Beli, milestones, referrals, extras
- `/api/referrals/share` — first-party share record
- `/api/referrals/redeem` — transactional cosmetic redemption
- `/api/payments/*` — returns 503 unless purchases are explicitly enabled and configured

## Deployment note

The repository documents historical Vercel and Railway URLs, but release readiness must be determined from the current `/ready` response and release SHA—not from an old URL in documentation. Deployment requires the owner’s Vercel/Railway/EAS credentials and legal/privacy approval for the target launch scope.
