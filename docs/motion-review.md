# Web motion and gameplay review

Applied the MengTo Animation Systems, Optimize Web Animations and Test Playable Web Games workflows on 8 September 2026 UTC, retaining React/Vite and Framer Motion.

## Changes

- Shared timing: 160 ms feedback, 240 ms state changes, 320 ms entrances/reveals and 60 ms deal stagger. Page transitions use short travel; the lobby entrance no longer animates a large clipping mask.
- Blind hands render three placeholder backs per active seat without receiving card values. Each fan retains its card elements through reveal; the hand ID resets the fan only for a new deal.
- Turn and winner accents finish instead of looping. Pot glow responds to confirmed amount changes. Animated numbers announce the final value and settle correctly when motion is interrupted.
- Motion preferences honor both the operating system and the existing in-app setting. Decorative effects stop offscreen and in background tabs. Parallax input updates at most once per animation frame, with listeners and frames cleaned up.
- Winner feedback uses a bounded confetti burst, an immediately available Continue button, Escape dismissal and keyboard focus containment.
- Short landscape viewports place betting controls beside the table. Two-player layouts place the local identity beside the card fan. Desktop felt sizing and the timer position keep them clear of betting controls.
- The deadline display now follows the current server turn for other players as well as the local player.

## Repeatable local review

Run `pnpm dev:web` and open `/motion-review.html`. The fixture is a separate development-only entry; it is not included in the production build. It uses the actual lobby, table, cards and winner components with synthetic snapshots. Those fixtures are visual evidence, not proof of server behavior.

Choose lobby, blind, revealed or winner. Use Add chips to exercise the amount transition, Reduced motion to interrupt it, and Hide table to verify effect shutdown without unmounting. Measure motion samples browser animations plus inline-style changes over 700 ms. Sample after entrances have settled. The game clock may continue updating because it represents game state.

For screenshots without the review toolbar, use `/motion-review.html?scene=blind&controls=0`; add `&reduced=1` for reduced motion. Test at 390×844, 844×390 and 1280×800. Blind and revealed states should preserve the same card pattern IDs. Repeat lobby → blind several times and compare settled DOM counts.

Live local app creates a disposable guest using the configured local API. Use it only with an isolated local database. This enables checking the real app without treating fixture callbacks as game commands. Leave tables and anonymize synthetic accounts after testing.

## Verification record

- Web type checking, including the review fixtures, production build and `git diff --check` passed. Existing Browserslist age and large Mixpanel chunk warnings remain.
- Browser verification exercised the actual local app: guest restore, lobby, private table creation, two human seats, readiness, two hands, Continue, next hand, card reveal, chaal 100 and return to lobby. Both local browser-test accounts were anonymized; zero rooms and reservations remained.
- The separate local production-smoke script passed authentication, sockets, two hands, duplicate-command handling, replay, balance conservation, referrals and cleanup.
- Card reveal preserved all six card pattern IDs across the two seats. Reduced motion displayed the correct backs and faces. Interrupting a 100 → 600 pot animation yielded exactly 600.
- Settled DOM counts remained 574 → 574 → 574 across two lobby/hand cycles, with zero canvases and no errors in the fresh final browser tab. This does not establish heap stability.
- Normal and reduced-motion hand samples settled with zero running browser animations and zero changing inline styles. Hiding the mounted table also yielded zero running/offscreen animations and zero inline changes.
- Portrait, landscape and desktop visual checks included cards, identities, pot, timer and controls. Landscape inspection found and prompted the side-panel fix.

These are bounded browser checks, not a production FPS, CPU, heap-leak or physical-device benchmark. The browser's read-only evaluator did not expose `document.getAnimations`; the local fixture supplies that measurement through its own review button. A fresh final browser tab is used for console checks so development hot-reload history is not confused with release errors. Existing native-store and operational release gates remain open.

## Skill sources

- https://github.com/MengTo/Skills/blob/main/agent-skills/web-design/animation-systems/SKILL.md
- https://github.com/MengTo/Skills/blob/main/agent-skills/codex/optimize-web-animations/SKILL.md
- https://github.com/MengTo/Skills/blob/main/agent-skills/game-development/test-playable-web-games/SKILL.md
