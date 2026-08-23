---
target: production web journey
total_score: 22
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 4
timestamp: 2026-08-23T11-10-15Z
slug: packages-web-src-app-tsx
---
# Impeccable Critique — Production Web Journey

Method: dual-agent (A: impeccable_design_review · B: impeccable_detector_evidence)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---:|---|
| 1 | Visibility of System Status | 2 | Strong local loading states, but room-list failure becomes an indistinguishable empty state and clipboard failure is silent. |
| 2 | Match System / Real World | 3 | Friend-table language is natural; Muflis, Hukam, boot, blind, and sideshow lack accessible explanation. |
| 3 | User Control and Freedom | 2 | Back, skip, Escape, and focus return exist; dismissing room-ready destroys visible invite recovery. |
| 4 | Consistency and Standards | 3 | Strong clubhouse system, but Quick Play/public browsing contradicts the private-friends premise. |
| 5 | Error Prevention | 2 | Good input constraints and defaults; no protection from losing invite access or automatic Pack at timeout. |
| 6 | Recognition Rather Than Recall | 2 | Core actions are labeled, but room details must be remembered after dismissal and advanced terms assume prior knowledge. |
| 7 | Flexibility and Efficiency | 2 | Guest, invite-link, code, and default-room paths are efficient; repeat hosts cannot retrieve an active room or recent group. |
| 8 | Aesthetic and Minimalist Design | 2 | Entry is authored and focused; lobby modules and nine variant filters dilute the product thesis. |
| 9 | Error Recovery | 2 | Auth and join errors preserve input; fetch/clipboard failures and lost invite state recover poorly. |
| 10 | Help and Documentation | 2 | Guided practice and inline descriptions help, but real-table rules and server-authority details are absent. |
| **Total** | | **22/40** | **Acceptable — significant improvements required.** |

## Design Specificity Verdict

**Authored and product-specific, 7/10.** Clubhouse language, table-circle framing, card fans, felt/rail colors, Playfair/Poppins pairing, room codes, and “your people” copy establish a credible Teen Patti world. The world weakens when the lobby falls back to category-standard dark-gaming cards, gold accents, pills, Lucide icons, public inventory, and AI Quick Play.

The interface’s strongest promise is private play with existing friends. Its largest persistent surface is still a broad gaming lobby. The next version should make the invitation, friend presence, and persistent private room the central artifact.

**Deterministic scan:** 22 warnings across 16 files: 17 `ai-color-palette`, 2 `gradient-text`, 2 `side-tab`, and 1 `bounce-easing`. Source verification found 19 context-sensitive false positives: rarity/tier mappings, selectable themes, game-result celebration text, notification status borders, and a semantic animation name. The three credible detector warnings are generic purple-gradient treatments in `ChipStoreScreen.tsx:621`, `ChipStoreScreen.tsx:627`, and `FriendsScreen.tsx:254`.

**Visual evidence:** Chrome DevTools rendered the deployed welcome surface at 1440×1000 and 390×844. The entry composition is coherent at both sizes and the mobile hierarchy is strong. The legal footer is visibly too muted. The required Impeccable overlay was not injected because the Chrome-control extension was unavailable, so there is no `[Human]` overlay tab.

## Overall Impression

This no longer looks like a throwaway prototype. The entry experience is calm, specific, and board-presentable. The single biggest opportunity is strategic coherence: once inside, the product must keep behaving like a private friend-table ritual instead of expanding into a generic game hub.

## What’s Working

1. **Responsible-play framing is direct and consistent.** The product repeats 18+, social-only, cosmetic rewards, and no cash value without turning the welcome screen into legal copy.
2. **The clubhouse identity has authorship.** The card fan, green felt, warm rail color, serif headlines, and group-chat language belong to this product.
3. **Default friend-table creation is excellent.** It offers a one-tap recommended path, hides customization, traps/restores focus, and culminates in copy/native-share actions.

## Cognitive Load

**4/8 checklist failures: high load, concentrated in the lobby and raise controls.** Single focus, chunking, minimal choices, and working-memory support fail. The desktop lobby exposes at least seven actions around the primary task; the variant strip exposes nine siblings; the raise sheet exposes five presets plus a slider, increment/decrement controls, amount, and confirmation. Default room creation is the counterexample: it uses progressive disclosure well.

## Emotional Journey

Arrival creates anticipation and the eligibility gate adds sober reassurance. The guaranteed-win tutorial then spends trust on a manufactured peak before revealing it was practice. The lobby restores confidence with strong create/join actions, then diffuses it with AI, public tables, referrals, filters, points, and navigation. Creation/share is the strongest peak. Dismissing room-ready creates the sharpest valley because the visible invite disappears while the table remains open. The active table adds energy but the visual countdown can automatically Pack a hand without an accessible warning. Trust closure is underpowered because server authority is described during onboarding but not surfaced at the live table.

## Priority Issues

### [P1] The lobby contradicts the private-friends strategy

- **Why it matters:** Board viewers can read the product as a generic card-game lobby with private rooms bolted on.
- **Fix:** Make “Your friend table” the dominant object. Keep Create and Join above the fold; move AI Quick Play, public discovery, and variant browsing behind “Practice & explore.”
- **Suggested command:** `$impeccable distill`

### [P1] The host’s open table becomes visually unrecoverable

- **Why it matters:** Closing the room-ready modal clears `createdRoomCode` and `createdInviteUrl`, even though the room remains open.
- **Fix:** Persist a “Your open table” dock/card with room code, waiting state, copy/share, re-enter, and close-table controls. Dismissal should collapse this state, not destroy it.
- **Suggested command:** `$impeccable harden`

### [P1] Timed and dynamic game states are not robustly accessible

- **Why it matters:** Turn changes, coach messages, timer milestones, and the automatic Pack at zero are primarily visual/audio. A screen-reader or distracted player can lose a hand without a perceivable warning.
- **Fix:** Add live regions, announce 10- and 5-second milestones, state the timeout behavior in plain language, and verify keyboard flow and 200% zoom.
- **Suggested command:** `$impeccable audit`

### [P1] Trust is promised but not designed into the live table

- **Why it matters:** Server authority and verified rewards are central positioning, yet the active table exposes neither. `FairnessVerifier.tsx` exists but is not mounted.
- **Fix:** Add a compact “Server dealt · Table state verified” status with plain-language details and clearly distinguish play chips from Club Points.
- **Suggested command:** `$impeccable clarify`

### [P2] The tutorial’s guaranteed-win tone undermines social trust

- **Why it matters:** Three Aces, instant folds, “play blind for a thrill,” and a large win celebration make the first real loss feel like a bait-and-switch.
- **Fix:** Label practice from the first frame, teach neutral turn-taking and server-dealt rules, and include a believable non-winning branch.
- **Suggested command:** `$impeccable onboard`

## Persona Red Flags

**Jordan — first-timer:** Understands Create/Join, then meets Quick Play, Open tables, nine variants, boot, Muflis, Hukam, blind, and sideshow. A room-service failure appears as “No open tables,” and dismissing room-ready removes the expected code.

**Sam — accessibility-dependent:** Dynamic coach/table messages are not live regions; the visual/audio timer auto-packs; game loading lacks a named status. Strong foundations include semantic forms, alert roles, dialog focus traps/restoration, labeled controls, focus rings, and reduced-motion plumbing.

**Casey — distracted mobile user:** Guest entry, large primary controls, bottom navigation, safe-area padding, and native sharing work well. Interrupting or dismissing room-ready loses the invite surface; the nine-item horizontal filter and fixed game controls add short-device risk.

## Minor Observations

- Room-fetch failure and a legitimate empty room share the same state.
- Clipboard failure is swallowed silently.
- Club Points use `✦`; play chips alternate between `●` and `◉`.
- The system is visually coherent but implemented with 1,313 hex occurrences and 257 unique hex values rather than semantic tokens.
- The global reduced-motion rule uses a `0.01ms` kill instead of intentional state-preserving alternatives.
- The join modal is a strong hardening model: input normalization, focus return/trap, contextual error, and preservation all work.

## Questions to Consider

- If private tables are the thesis, why is public “Open tables” the largest persistent inventory?
- What should a host always be able to see while waiting: room code, friend arrival, server state, and close-table control?
- Does a guaranteed-win tutorial build trust, or spend it before the first real hand?
- What would “server-authoritative” feel like if it were designed into the live table instead of stated in onboarding copy?
