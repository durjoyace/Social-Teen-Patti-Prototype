# Production Referral Wedge

## Product thesis

- Audience: adult Indian friend groups who already organize games in WhatsApp.
- Single job: move a friend from an invite to a shared private table in under 60 seconds.
- Growth loop: invite -> referred friend completes a legitimate multiplayer game -> both receive Beli -> inviter progresses toward identity rewards -> both invite again.
- Safety: Beli is a non-purchasable loyalty currency and never a wager, prize, or cash-equivalent balance.

## Design direction

- Palette: Night Navy `#0B1221`, Card Green `#176B45`, Saffron `#F5A524`, Sindoor `#D94841`, Beli Gold `#FFD66B`, Ivory `#FFF4D6`.
- Type: Playfair Display for one ceremonial headline, Poppins for controls/body, Hind for Indic scripts.
- Layout: a compact "invite hand" showing three seats—inviter, friend, and earned reward—above the sharing actions.
- Signature: the Beli trail, a restrained gold thread that connects each activated friend to the next milestone like cards being dealt around a real table.
- Copy: plain, specific, and trust-forward; never describe virtual value with the rupee symbol.

## Checklist

- [x] Record baseline install, Prisma validation, typecheck, and build results.
- [x] Add production-safe environment validation and remove automatic demo payment success.
- [x] Add referral, activation, reward-ledger, and abuse-signal models to Prisma.
- [x] Add referral-code creation, attribution, status, share tracking, and activation APIs.
- [x] Award double-sided Beli only after a qualifying multiplayer game.
- [x] Add velocity, self-referral, duplicate-device, and idempotency protections.
- [x] Add Beli balance and referral state to authenticated user responses.
- [x] Add web referral hub and share sheet with WhatsApp/native/copy flows.
- [x] Capture referral parameters before authentication and attribute guest signup.
- [x] Add mobile deep-link attribution and native sharing entry point.
- [x] Add object-action analytics for the acquisition and activation funnel.
- [x] Add referral, economy, game-engine, API, and dependency-compatibility tests.
- [x] Add CI for migration, production audit, tests, typechecks, web build, and Android export.
- [x] Replace cash-like virtual-currency language in every shipped wedge and game surface.
- [x] Add privacy, referral terms, responsible-play, deployment, rollback, and incident runbooks.
- [x] Verify production builds, tests, responsive UX, keyboard semantics, and reduced-motion support.

## Release gates

- [x] Invite link opens the correct app state and preserves referral plus room attribution across signup.
- [x] Reward issuance is transactional and idempotent.
- [x] No reward is issued for install/signup alone.
- [x] No demo payment path can credit value in production.
- [x] No PII is emitted to analytics.
- [x] Production audit/build/typecheck/test/mobile-export gates are automated.
- [x] Fresh-clone deployment instructions are reproducible.

# Battle Green Consulting Go-Live Setup

## Account and ownership inventory

- [x] Confirm which production accounts already exist and which identity owns them.
- [x] Confirm that Battle Green Consulting has a D-U-N-S number without storing it in the repository.
- [ ] Record the Battle Green Consulting legal details required by registrars and app stores.
- [ ] Select a primary product domain; no purchase is currently authorized.
- [ ] Use company-controlled aliases for owner, support, privacy, security, and billing access.

## Production services

- [ ] Configure production web hosting and the single-replica backend.
- [ ] Configure managed PostgreSQL, automated backups, and a restore test.
- [ ] Configure error tracking, product analytics, uptime monitoring, and launch alerts.
- [ ] Configure Expo/EAS, Apple Developer, and Google Play Console ownership where available.
- [ ] Connect verified production secrets without committing credentials.

## Deployment and verification

- [ ] Deploy an invite-only pilot environment under the selected domain.
- [ ] Run database migrations, health/readiness checks, and referral smoke tests.
- [ ] Verify Android and iOS deep links on physical devices.
- [ ] Confirm support, privacy, grievance, and incident-response contacts are operational.
- [ ] Record the legal and store-review gates that remain outside engineering control.

# Production Backend and Store Readiness

- [x] Ship a minimal production container and Railway migration/readiness configuration.
- [x] Add privacy-safe Sentry instrumentation to the API and web client.
- [x] Replace the inert web analytics shim with an explicit, consent-respecting Mixpanel integration.
- [x] Add authenticated account deletion/anonymization across API, web, and mobile.
- [x] Add repeatable production health, auth, WebSocket, referral, and cleanup smoke checks.
- [x] Add EAS build profiles and fail-closed mobile release environment validation.
- [x] Extend CI to validate the production container and mobile release configuration.
- [ ] Run the complete verification suite, review the production diff, and open a merge-ready PR.
- [ ] Configure Railway/PostgreSQL/Sentry/Mixpanel/Expo only after the required account or billing confirmations.
