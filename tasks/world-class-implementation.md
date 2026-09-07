Implementation of the 7 September repository audit, retaining React/Vite, Expo, Express/Socket.IO, Prisma/PostgreSQL.

- [x] Correct canonical ranking, hidden cards, wagering, bots, timeouts, sideshows, supported variants.
- [x] Complete ready/late join/next-hand/leave lifecycle and durable balance settlement/recovery.
- [x] Share wire contracts; bounded acknowledgements, stale-command rejection, web/mobile session recovery.
- [x] Finish live settings, equipped cosmetics, member identities, accessible controls and localization of the core journey.
- [x] Add outcome-focused tests, concurrency/failure coverage, operational metrics, reproducible verification and documentation.

The audit document records the starting state. This checklist is updated only as implementation and validation establish the outcome. Deployment and physical-device testing are separate from local implementation.

Implementation details, rollout constraints and remaining environment-specific release checks: [durable tables release guide](../docs/durable-tables-release.md).

Release gates remain separate from implemented code:

- [ ] Physical iOS/Android, screen-reader, large-text and full-language review.
- [ ] Production log dashboards, alert delivery, backup restore rehearsal and regional capacity measurements.
- [ ] Successful current workspace dependency audit; the local pnpm audit timed out. Standalone server production audit is clean. Resolve the existing mobile dependency hold before store release.
- [ ] Coordinated database migration and single-coordinator rollout with matching clients.
