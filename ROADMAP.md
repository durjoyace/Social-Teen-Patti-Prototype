# Social Teen Patti roadmap

## Wedge

Move an adult Indian friend group from WhatsApp to a private, server-backed Teen Patti table in under 60 seconds. The invitee’s first completed human multiplayer game earns Club Points for both sides; Club Points unlock cosmetic extras only.

## Built in this release

- [x] Persistent referral attribution across web guest/registration and mobile deep links
- [x] WhatsApp, native share, and copy flows with one referral-plus-room link and a first-party share record
- [x] Private room codes and automatic start when the second human joins
- [x] Server-authoritative action path on web and mobile
- [x] Transactional, idempotent, double-sided Club Points activation after persisted multiplayer settlement
- [x] Inviter milestones, Club Points ledger, reward catalog, and permanent entitlements
- [x] Self-referral, duplicate-device, IP-velocity, daily-velocity, and duplicate-write controls
- [x] Non-PII acquisition/activation analytics contract
- [x] Fail-closed production config, readiness, request IDs, CORS, and API limits
- [x] Demo payment credit removed; purchases disabled by default
- [x] Server-recorded adult confirmation, referral terms, privacy notes, responsible-play policy, and incident/rollback runbook
- [x] Unit tests, database integration test, CI, clean dependency audit, typechecks, builds, and mobile export gate

## Launch work requiring owner/external approval

- [ ] Restore/deploy the backend and confirm `/ready` reports the release SHA
- [ ] Run physical-device iOS and Android universal-link tests
- [ ] Complete Indian legal review, state/platform availability review, Terms, and Privacy Notice
- [ ] Add support contact, reward appeal workflow, account deletion, block/report, time-out, and self-exclusion UX
- [ ] Configure Mixpanel/Sentry (or approved alternatives), dashboards, alerts, and data-retention controls
- [ ] Run a closed 100-group pilot and measure invite-open, attributed, first-human-game, reward, D1, and D7 rates

## Scale only after evidence

- [ ] Move room state and Socket.io pub/sub to a shared durable/Redis-backed design before adding replicas
- [ ] Replace per-process rate limiting with an edge/distributed limiter
- [ ] Add a human fraud-review queue and documented appeals SLA
- [ ] Add remote-configured referral amounts and A/B assignment with holdouts
- [ ] Localize the full acquisition loop beyond English and validate copy with native speakers

Purchased play value remains out of scope until legal, KYC/geofencing, platform billing, refund, and responsible-play gates are approved. Club Points remain non-purchasable and non-wagerable.
