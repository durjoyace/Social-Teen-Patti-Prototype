# Production runbook

## Release posture

The repository is configured for a single real-time server replica. Rooms live in server memory; do not scale the Socket.io service horizontally until room state and Socket.io pub/sub use a shared durable/Redis-backed design. Place an edge or platform rate limit in front of the in-process limiter before a high-volume campaign.

Purchases must remain disabled (`PURCHASES_ENABLED=false`, `VITE_PURCHASES_ENABLED=false`) until the responsible-play and legal gates are complete.

## Approved beta scope

The approved 9 August 2026 release scope is an invite-only web beta:

- Ship the Vercel web client and one Railway API/Socket.io replica.
- Keep purchases disabled and do not market the beta publicly.
- Do not submit iOS or Android builds to a store.
- Use `pnpm audit:web-beta` as the blocking runtime audit for this scope.
- Keep `pnpm audit:prod` visible as the broader web/server/mobile audit.

The mobile store release remains blocked by the unpatched `image-size` advisories in Expo/Metro's build-only dependency graph. This is a release hold, not an audit suppression.

## Required configuration

Server production startup fails closed unless database/JWT/referral secrets are strong and `PUBLIC_APP_URL` is HTTPS. Configure:

- `DATABASE_URL`
- `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `REFERRAL_HASH_SECRET` as distinct random secrets
- `PUBLIC_APP_URL=https://social-teen-patti.vercel.app`
- `CORS_ORIGIN` as a comma-separated exact allowlist
- `TRUST_PROXY=1`, adjusted only to the known proxy topology
- `APP_VERSION` as the release SHA
- `SENTRY_DSN` and a reviewed `SENTRY_TRACES_SAMPLE_RATE` (default `0.05`)
- `PURCHASES_ENABLED=false`

Web needs HTTPS `VITE_API_URL` and `VITE_SOCKET_URL`, `VITE_SENTRY_DSN`, an explicit analytics choice plus `VITE_MIXPANEL_TOKEN`, and purchases disabled. Production clients refuse insecure or missing backend endpoints. EAS needs HTTPS `EXPO_PUBLIC_API_URL` (including `/api`) and `EXPO_PUBLIC_SOCKET_URL`; dynamic Expo configuration fails preview and production builds when either is absent or insecure.

## Web beta deploy

1. Take/verify a PostgreSQL backup and test restore evidence.
2. Run `pnpm install --frozen-lockfile`, `pnpm audit:web-beta`, and `pnpm verify` on Node 22.
3. Deploy `server/` to Railway from its Dockerfile. Railway runs `npm run db:deploy` as a pre-deploy command; do not run multiple application replicas. Require HTTP 200 from `/health` and database-backed `/ready`, and verify the reported `APP_VERSION`.
4. Run the non-mutating gate: `SMOKE_BASE_URL=https://<backend> SMOKE_WEB_URL=https://social-teen-patti.vercel.app pnpm smoke:production`.
5. Run the self-cleaning auth/referral/WebSocket gate by adding `SMOKE_MUTATING=true`. It creates two guests, attributes an invite, joins both to a private table, then anonymizes both accounts in `finally` cleanup.
6. Manually complete one multiplayer game, verify double-sided referral reward plus repeat-game idempotency, and redeem one Beli extra in the invite-only environment.
7. Configure the production backend endpoints in Vercel, deploy the web client, and test a complete HTTPS invite-link flow in two clean browser sessions.
8. Watch Sentry errors, readiness, socket disconnects, game settlement failures, referral reward failures/rejections, and p95 API latency for at least 30 minutes.

## Mobile release hold

Continue building and exporting mobile bundles in CI so incompatibilities remain visible, but do not submit them to Apple or Google. Before store release:

1. Require a patched Expo/Metro path for GHSA-w3rx-r6r6-pgpr and GHSA-5p2g-fcmc-qvqq, or obtain a separately documented owner-approved exception after security review.
2. Require `pnpm audit:prod` to pass for the complete web/server/mobile graph unless that explicit exception exists.
3. Configure the same backend endpoints in EAS, run `pnpm --filter @teen-patti/mobile config:release` and `build:preview`, then verify universal/app links on physical Android and iOS devices.

## Account deletion and retention

Authenticated users can delete their account from web or mobile settings. Registered accounts must re-enter their password and every user must type `DELETE`; the API rate-limits attempts, anonymizes the profile, scrubs authored chat/gift/table data, removes social relations and notifications, disconnects active sockets, and invalidates access/refresh tokens through the banned tombstone. Immutable gameplay, economy, payment, and referral ledgers retain only the pseudonymous internal user ID so financial integrity and abuse investigations remain possible. Document and approve the final retention period before public release.

## Service ownership gates

Railway PostgreSQL, Sentry, Mixpanel, Expo/EAS, Apple Developer, and Google Play must be owned by Battle Green Consulting or a company-controlled admin identity. Creating an account, selecting a paid plan, accepting platform terms, or granting roles requires the owner at the action point. Domain purchase remains explicitly unauthorized; the Vercel hostname is the release URL until that changes.

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
- The blocking web/server beta runtime audit and Expo SDK compatibility check pass.
- Mobile store submission remains blocked until the full production dependency audit passes or a separately approved exception is recorded.
- No demo payment response can credit value.
- Reward creation is multiplayer-only, transactional, and idempotent.
- Analytics payload review finds no PII.
- Legal/privacy/referral terms have owner approval for the intended states and platforms.

## Dependency security

Expo's build graph still contains consumers of the callable `brace-expansion` 1.x API, while the current memory-bound implementation is 5.x. `packages/brace-expansion-compat` is a tested CommonJS adapter over patched 5.x and is applied through a narrow pnpm override. Do not remove or widen that override without rerunning `pnpm audit:prod`, `pnpm verify`, and the Android export gate.

The full dependency audit currently reports only GHSA-w3rx-r6r6-pgpr and GHSA-5p2g-fcmc-qvqq through Expo/Metro's `image-size@1.2.1`. Both advisories currently report no patched version. They are outside the web/server runtime graph, which is why the approved web beta uses a separately blocking `audit:web-beta` command while retaining the failing full audit as the mobile-store hold.
