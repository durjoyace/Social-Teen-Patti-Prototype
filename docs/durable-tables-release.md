# Durable tables implementation and release guide

This change retains React/Vite, Expo/React Native, Express/Socket.IO and Prisma/PostgreSQL. The repository audit records the starting state; this guide describes the implemented system.

## Gameplay and table lifecycle

- Server gameplay uses the shared canonical ranking module. Categories compare lexicographically; A-2-3 is the lowest sequence. Muflis/Lowball reverse that ordering. Only implemented variants are accepted.
- A blind player receives card backs, with no private rank or strength. Seeing cards is an irreversible server command. Seen wagers cost twice a blind wager; raise is exactly twice the applicable wager. Unimplemented all-in/side-pot behavior is not offered.
- Sideshows, timeout folds, departures and the round cap all advance or finish a hand through the same engine. A sideshow target can respond outside their normal turn. Timeout is an internal action, never a player command.
- Human seats must explicitly ready up. Late arrivals wait for the next hand. Players replay at the same table. Leaving during a hand packs immediately and cashes the final stack back into the play-chip wallet after settlement.
- Practice bots take real engine actions. Broke bots replenish their practice stack between hands; bot games do not imply conservation of the entire human wallet supply. Human-only games conserve chips.

## Persistence and recovery

Every accepted room mutation is cloned, committed to PostgreSQL, then published. A failed write does not change the published state. Runtime snapshots include the hand, command receipts, deadlines and seats. AES-256-GCM encrypts snapshots and finished-hand audit records; keys derive from `JWT_SECRET` using a separate domain string.

A buy-in atomically debits the available wallet and creates a `TableReservation`. Hand settlement, statistics, table balances, ledger entries and snapshot are one serializable transaction. `HandSettlement.id` is the hand's unique settlement receipt. Repeated commands do not pay again. Referral qualification runs from a durable, retried settlement queue after the game commits.

`BUY_IN` and `CASH_OUT` ledger balances describe the wallet. `GAME_WIN` and `GAME_LOSS` balances describe the reserved table account, identified by `metadata.account = "table"`; do not sum their balance fields as one wallet history. Amounts and balances use integer chips.

Startup restores rooms before `/ready` succeeds. Humans have a 60-second reconnect grace; original turn deadlines continue. Expired turns fold and overdue departures release seats safely. Reconnecting on another device replaces the old socket without reviving folded cards. The app reconnects to the saved table; it does not replay speculative local moves.

**Run exactly one server coordinator.** Command serialization is process-wide, not distributed fencing. Do not enable multiple replicas or overlapping old/new coordinators. Use a stop-then-start rollout. PostgreSQL durability does not by itself authorize horizontal scaling.

## Sessions and protocol

Shared `GameView`, `RoomView`, action contracts and acknowledgement helpers are consumed by both clients. Commands carry a hand ID, expected version and unique command ID. Acknowledgements have a ten-second limit and reject on disconnect. Invalid/stale commands return visible errors.

New access tokens default to 15 minutes. Refresh tokens rotate against a persisted, hashed session record. Reuse revokes the session. HTTP and socket traffic check revocation; logout disconnects the session. Valid legacy refresh tokens and mobile access-only credentials can be exchanged once, preserving existing guest identities. Network errors preserve saved credentials. Web refreshes are coordinated across tabs where Web Locks are available; mobile credentials use SecureStore.

## Product changes

Web and mobile display real table members, readiness, reconnect state, legal actions, server deadlines and actual payouts. Blind card controls remain reachable before the hand is revealed. Replay and leave wait for server acknowledgement.

Sound, volume, music, haptics and notification preferences are connected to their relevant client behavior. Earned cosmetics must be owned before they can be equipped; selection persists on the account. Themes, profile frames/titles and chat reactions consume those selections. Invalid friend actions and pagination are rejected; the leaderboard accepts only its implemented all-time period. Both clients use shared palette values and translation catalogs; core ready/see/play/replay labels are connected to six languages. This is not a claim that every marketing or error string has been translated.

## Rollout

1. Back up PostgreSQL and the existing secrets. Preserve `JWT_SECRET` with each backup: losing or replacing it makes saved hands unreadable. Secret rotation requires draining rooms and migrating/re-encrypting retained audit records, not simply changing an environment variable.
2. For the first upgrade from the old in-memory server, stop new joins and let existing tables finish and leave before stopping it. Old in-memory hands cannot be reconstructed by these migrations.
3. With the old coordinator stopped, apply migrations using `pnpm --filter teen-patti-server db:deploy`. The durable-tables migration backfills one UTC reward-day key per historical day without deleting old reward records.
4. Build the container from the repository root: `docker build -f server/Dockerfile -t teen-patti-server:release .`. Railway must use the repository root and `server/railway.json`; the server Dockerfile imports the shared rules package.
5. Start one coordinator with the existing production environment and `PURCHASES_ENABLED=false`. Check `/ready`, then run the existing production smoke command with the intended environment. Publish matching web/native clients with the new action protocol; old clients do not send versioned commands.
6. Exercise two accounts through join, ready, see, pack, next hand, reconnect and leave. Verify wallet plus reserved chips and one settlement per hand before widening access.

Do not roll back to a server that ignores reservations while seats are reserved. Drain and reconcile first. A database restore must restore snapshots, reservations, users, ledger and settlement records together. Never manually delete reservations to clear a stuck table: that loses the reconciliation evidence.

## Operations

The server emits structured `http_request`, `hand_settled` and periodic `game_metrics` records. Metrics include command/error counts, timeouts, reconnects, settlements, room counts and the last storage error. `/health` is liveness; `/ready` checks initialized room state and database connectivity.

Run `node scripts/table-status.mjs` from the server directory with a read-capable `DATABASE_URL` to inspect saved room timestamps, reserved totals and pending referral jobs without decrypting cards or printing user identities. Alert on sustained storage failures, growing referral backlog, readiness failures and an increase in command errors. Log collection, alert destinations and production thresholds must be configured in the hosting environment.

## Reproducible verification

Use Node 22 and the pinned pnpm 9.15.0. Install with `pnpm install --frozen-lockfile`. Point both `DATABASE_URL` and `TEST_DATABASE_URL` at the same disposable database whose name contains `test`; integration tests intentionally clear their fixtures. Apply migrations, then run:

```sh
pnpm generate
NODE_ENV=test pnpm test
pnpm typecheck
NODE_ENV=production pnpm build
pnpm --filter @teen-patti/mobile exec expo export --platform android --platform ios --output-dir dist-audit
pnpm audit:web-beta
pnpm audit:prod
```

Tests cover exhaustive classification of 22,100 three-card hands, 100 mixed legal games, hidden cards, side shows, wager validation, bot completion, persistence failure, restart, duplicate settlement, concurrent daily rewards, refresh replay, ownership and the HTTP/Socket.IO table journey. A bounded concurrency test runs four simultaneous human tables and reports local latency; this is a correctness regression and local baseline, not a production capacity benchmark.

Physical-device sound/haptics, VoiceOver/TalkBack, native store builds, full-language proofreading and regional network/load trials remain release validation tasks. A successful JavaScript bundle does not substitute for those checks. Dependency gates fail closed when the audit service is unavailable; the pre-existing mobile store dependency hold is separate from the web/server gate.

## Local verification record — 7 September 2026

- Node 22.23.2, pnpm 9.15.0 and isolated PostgreSQL 16.
- All three migrations applied successfully to a fresh disposable database.
- 32 tests passed: 25 server tests, five shared rules/protocol tests and two compatibility tests. The server suite used a real database; integration tests were not skipped.
- Four concurrent tables / eight players / 12 hands conserved 80,000 human chips and released every reservation. The final local run reported 40 timed operations and p95 3,859 ms under shared-machine load. This is not a release latency target or a regional capacity result.
- All workspace type checks passed. Final server and production web builds passed. Android and iOS JavaScript/Hermes exports passed.
- Browser checks exercised saved guest recovery, create/ready/leave, a bot hand, next hand, card reveal and final cash-out. Card reveal changed the legal action from blind 50 to chaal 100.
- Standalone server production dependency audit: zero reported vulnerabilities after the qs patch.
- The diagnostic CLI ran successfully and confirmed no test reservations/rooms or referral jobs remained after cleanup.

Earlier load runs exposed the default five-second interactive-transaction deadline; the implementation now uses an explicit 15-second limit. A later run under severe shared-machine contention exceeded that too; the final complete suite passed without weakening assertions. Runtime storage failure still rejects the command and preserves the previous committed state. Production latency and resource sizing need their own controlled measurements.

The final production Docker image built successfully after a registry timeout retry. Its server engine and shared rules loaded successfully with networking disabled. The final workspace dependency gate still timed out and exited with failure status 2; it is **unverified**, not a clean audit. No deployment was performed. Temporary local web/API servers and the isolated audit database were stopped.

## Deployment preparation update — 7 September 2026

The blocking web/shared/server audit subsequently passed from a clean checkout. pnpm 9 places dependency paths in `actions[].resolves` when dependencies are not installed; the gate now combines those paths with `findings[].paths` and still fails closed on missing or non-mobile paths. Two additional parser tests passed. Seven advisory sets are confined to the held mobile graph; the standalone server audit reports zero vulnerabilities.

The implementation and audit fix are pushed to `codex/impeccable-10`. Vercel built deployment `dpl_BNVtvixjjCvv8bh2xwn94HvxQZWX` successfully with production configuration. Although `--skip-domain` was requested, an alias lookup showed the live domain assigned to the new build; it was explicitly reassigned to the previous compatible deployment and verified. Its page was verified through authenticated Vercel access. The live API remains version `3843ef6` at `teen-patti-server-production-8150.up.railway.app`. Railway CLI authentication has expired; backend migration/deployment and web promotion await sign-in. Do not promote the new client independently of that backend upgrade.

The live alias is confirmed on prior deployment `dpl_2JJc3tSDVsguTNKgqsfogKg31syK`. The new build remains available by its unique deployment URL, pending the coordinated backend release.
