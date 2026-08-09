# Prime-time audit

Audit date: 2026-08-09
Production reviewed: https://social-teen-patti.vercel.app

## Executive read

The beta is technically live and its core production smoke flow passes, but the current production experience is not yet a 10/10 public launch. The biggest issue is not game functionality; it is that the lobby looks and behaves like a mobile prototype enlarged onto desktop, while its most prominent action promotes AI play instead of the product's strongest promise: private Teen Patti tables with friends.

Baseline product-readiness score: **6.4/10**

Current release-candidate estimate: **9.2/10** (clean-build verified for the primary web-beta journey; not yet production-certified)

| Area | Baseline | Candidate | Prime-time target | Candidate read |
| --- | ---: | ---: | ---: | --- |
| Visual identity | 5.5 | 9.2 | 9.0 | Cohesive felt, parchment, lacquer, and warm-gold clubhouse system across every active route, table controls, chat, notifications, PWA icon, and social preview. |
| Responsive UX | 6.0 | 8.6 | 9.0 | Desktop clubhouse and adaptive table/chat layouts are implemented; the six-width, three-browser matrix still needs a clean preview build. |
| Conversion hierarchy | 5.5 | 9.4 | 9.0 | Friend-table creation is dominant, defaults to one tap, joining uses a dedicated code dialog, and repeat submissions are guarded. |
| Accessibility | 6.0 | 9.0 | 9.0 | Zoom restored; named controls, semantic forms, status regions, focus traps, Escape handling, initial focus, and focus restoration are in the active journey. |
| Trust and compliance | 7.5 | 9.0 | 9.0 | 18+, social-only, and no-cash-value framing is consistent across welcome, lobby, profile, referral, and share assets. |
| Reliability and operations | 7.5 | 8.8 | 9.0 | Player identity, sideshow controls, network chat, analytics queuing, and storage failure isolation are fixed. The clean Node 22 verification passes; auto-deploy and live telemetry remain open. |

The candidate passed a fresh Node 22.23.2 install, Prisma generation, all executable tests, every workspace typecheck, and both production builds. It is held at 9.2 until the browser matrix and two-device acceptance flow pass. It is not a production score.

## Verification evidence

- Clean install: `pnpm install --frozen-lockfile` completed from the committed lockfile.
- Tests: 13 executed and passed across compatibility, shared game rules, and server suites; two database integration tests remain intentionally skipped without their test database harness.
- Type safety: shared, server, web, and mobile TypeScript checks passed.
- Production build: server TypeScript and the Vite web bundle completed successfully.
- Build advisory: Mixpanel remains a large lazy chunk; it does not block the launch path but should be monitored against real page-load telemetry.
- Chrome launch check: the desktop welcome experience renders cleanly and the 18+ gate enables guest entry correctly.
- Infrastructure check: the existing Durjoy Railway workspace is offline because its trial expired; the backend health endpoint currently returns 502, so the connected guest journey cannot complete in production yet.

| Area | Baseline | Prime-time target | Read |
| --- | ---: | ---: | --- |
| Visual identity | 5.5 | 9.0 | Generic gaming gradients and interchangeable cards; little Teen Patti-specific character. |
| Responsive UX | 6.0 | 9.0 | Mobile is usable, but desktop is constrained to a 672px phone-like column with large dead zones. |
| Conversion hierarchy | 5.5 | 9.0 | AI Quick Play competes with private-table creation; the empty lobby feels like a failure state. |
| Accessibility | 6.0 | 9.0 | Good start on focus styles, but several icon buttons and clickable cards lacked names or keyboard behavior; dialogs still need focus management. |
| Trust and compliance | 7.5 | 9.0 | 18+, social-play, no-cash-value, legal pages, and disabled purchases are strong. These messages need consistent placement. |
| Reliability and operations | 7.5 | 9.0 | Production smoke passes. GitHub-to-Railway auto-deploy, client error telemetry, and launch dashboards remain to be verified. |

## What this pass fixes

- Rebuilds the lobby as a true responsive clubhouse: focused mobile flow and a two-column desktop experience.
- Establishes a subject-specific visual system: deep felt, parchment, lacquer red, and restrained warm gold.
- Makes “Create a friend table” the primary action and moves AI Quick Play into a supporting role.
- Rewrites the empty lobby as a host invitation instead of a dead end.
- Adds a Teen Patti-specific three-card signature element and clearer table-night copy.
- Turns table rows into semantic buttons and labels search, settings, dialogs, room-code entry, and mobile navigation.
- Makes the splash skip action a real keyboard-accessible control and removes unstable render-time randomness.
- Keeps the expanded desktop shell opt-in so existing Profile, Settings, tournament, and other screens retain their current width.
- Rebuilds welcome, account entry, onboarding, profile, settings, referrals, table controls, chat, notifications, and failure recovery in the same system.
- Makes the default private friend table a single action while preserving variants, stakes, names, and seat counts under Customize.
- Fixes the joining player being inferred from array position zero; the server now returns an explicit viewer player ID and the client falls back to the authenticated user ID.
- Surfaces sideshow accept/reject actions that the protocol already supported but the previous action bar silently filtered out.
- Sends chat through the room socket instead of appending messages locally, with reconnect-safe input preservation.
- Adds pending guards to room creation, open-table joining, and AI quick play to prevent accidental duplicate requests.
- Adds the complete launch funnel: welcome, auth start, friend table created, invite shared, friend joined, first social hand, multiplayer completion, and 24-hour host return.
- Queues early analytics events while the provider loads and isolates gameplay from blocked browser storage.
- Adds a real 1200×630 social preview plus complete standard, Apple touch, and maskable install icons.

## Launch blockers still open

### P0 — prove the complete social loop

1. Run a two-device, two-network acceptance pass: create private table, share code/link, join, play a full hand, reconnect, leave, and clean up.
2. Add and verify email account recovery. The disabled Google path is gone and returning sessions persist, but password reset requires an email provider and recovery endpoint before broad account marketing.
3. Restore the backend in the existing Vivefutbol Project workspace, then connect GitHub auto-deploy with a protected production branch and documented rollback. The workspace currently has a Pro plan with $20 included usage and a $20 Product Pass discount; keep the deployment inside the included allowance and set a billing guardrail before broad traffic.
4. Confirm client-side Sentry and product analytics are receiving production events without collecting sensitive card-room content.

### P1 — finish the experience system

1. ~~Carry the new clubhouse system through login, onboarding, create/join dialogs, profile, referrals, and the game table.~~ Implemented in the candidate.
2. ~~Add dialog focus trapping, Escape-to-close, initial focus, and focus restoration.~~ Implemented for active dialogs, chat, and the raise sheet.
3. ~~Reduce the custom-table flow from three steps for the common friend-table case; keep advanced settings behind an optional customize path.~~ Implemented.
4. ~~Replace disabled “coming soon” UI with honest, active choices.~~ Implemented.
5. Test at 320, 390, 768, 1024, 1440, and 1920 widths in Safari, Chrome, and Firefox after a clean preview build.

### P2 — make launch measurable

Track this funnel end to end:

1. `welcome_viewed`
2. `guest_or_account_started`
3. `friend_table_created`
4. `invite_shared`
5. `friend_joined`
6. `first_hand_started`
7. `multiplayer_game_completed`
8. `host_returned_24h`

Prime-time targets should include p75 page load, crash-free sessions, table-creation success, friend-join success, completed-game rate, and 24-hour host return rate.

## Definition of 10/10

The product is ready for a broad launch when a new adult player can understand the social promise in five seconds, create and share a private table in under 30 seconds, complete the two-player flow without assistance, recover cleanly from a dropped connection, and encounter one coherent visual and interaction system on every screen.
