# Production runbook

## Release posture

The repository is configured for a single real-time server replica. Rooms live in server memory; do not scale the Socket.io service horizontally until room state and Socket.io pub/sub use a shared durable/Redis-backed design. Place an edge or platform rate limit in front of the in-process limiter before a high-volume campaign.

Purchases must remain disabled (`PURCHASES_ENABLED=false`, `VITE_PURCHASES_ENABLED=false`) until the responsible-play and legal gates are complete.

## Required configuration

Server production startup fails closed unless database/JWT/referral secrets are strong and `PUBLIC_APP_URL` is HTTPS. Configure:

- `DATABASE_URL`
- `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `REFERRAL_HASH_SECRET` as distinct random secrets
- `PUBLIC_APP_URL=https://social-teen-patti.vercel.app`
- `CORS_ORIGIN` as a comma-separated exact allowlist
- `TRUST_PROXY=1`, adjusted only to the known proxy topology
- `APP_VERSION` as the release SHA
- `PURCHASES_ENABLED=false`

Web needs `VITE_API_URL`, `VITE_SOCKET_URL`, analytics choice/token, and purchases disabled. EAS needs `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_SOCKET_URL`; release builds must not use the localhost defaults.

## Deploy

1. Take/verify a PostgreSQL backup and test restore evidence.
2. Run `pnpm install --frozen-lockfile`, `pnpm audit:prod`, and `pnpm verify` on Node 22.
3. Apply `pnpm --filter teen-patti-server exec prisma migrate deploy` against the target database.
4. Deploy one backend replica. Require HTTP 200 from `/health` and `/ready`; verify the reported `APP_VERSION`.
5. Smoke-test guest auth, socket connection, private room creation, second-human auto-start, one completed game, referral reward, repeat-game idempotency, and Beli redemption.
6. Deploy web, then EAS builds. Test the HTTPS universal/app link and `teenpatti://invite/<code>` on physical Android and iOS devices.
7. Watch errors, readiness, socket disconnects, game settlement failures, referral reward failures/rejections, and p95 API latency for at least 30 minutes.

## Rollback

The referral migration is additive. Roll application deployments back first to the previous image; do not roll the schema backward while either version may be running. Disable campaign entry points and set purchases false. If reward correctness is uncertain, stop new game traffic or referral qualification, preserve ledgers, and reconcile with idempotency keys before any adjustment. Never edit Beli balances without a corresponding `ADJUSTMENT` ledger entry.

## Incident playbooks

**API not ready:** stop routing new traffic, inspect database reachability/migration state, keep `/health` separate from `/ready`, and restore the last known-good backend.

**Duplicate or incorrect Beli:** pause referral promotion, query the immutable ledger by idempotency key/referral, confirm whether balances and entitlements diverged, ship a reviewed reconciliation, and notify affected players.

**Payment concern:** purchases are off by default. If ever enabled, immediately set both server and web flags false, preserve `PaymentReceipt` and transaction records, reconcile with Razorpay, and follow the approved refund/notification procedure.

**Abuse spike:** reduce edge limits, pause the campaign, inspect aggregate risk flags without exporting raw/pseudonymous identifiers, and document every manual decision.

## Release gates

- CI database migration and integration test pass.
- Shared, server, web, and mobile typechecks pass.
- Server and web production builds plus Android Expo export pass.
- The production dependency audit and Expo SDK compatibility check pass.
- No demo payment response can credit value.
- Reward creation is multiplayer-only, transactional, and idempotent.
- Analytics payload review finds no PII.
- Legal/privacy/referral terms have owner approval for the intended states and platforms.

## Dependency security

Expo's build graph still contains consumers of the callable `brace-expansion` 1.x API, while the current memory-bound implementation is 5.x. `packages/brace-expansion-compat` is a tested CommonJS adapter over patched 5.x and is applied through a narrow pnpm override. Do not remove or widen that override without rerunning `pnpm audit:prod`, `pnpm verify`, and the Android export gate.
