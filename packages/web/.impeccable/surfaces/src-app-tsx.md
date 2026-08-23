---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: ["src/pages/LobbyScreen.tsx","src/pages/LoginScreen.tsx","src/pages/FirstGameExperience.tsx","src/components/CreateRoomModal.tsx","src/components/JoinRoomModal.tsx"]
---

# Clubhouse lobby surface brief

## Scope and mode

- Surface: authenticated clubhouse lobby, with entry-flow continuity where it materially affects the first private table.
- Visitor mode: Operate.
- Primary targets: `src/App.tsx`, `src/pages/LobbyScreen.tsx`; related targets include login, onboarding, room modals, and global browser surfaces.

## Audience, job, and action

- Audience: adults 18+ who already know the friends they want to play with.
- Job: create, join, share, or re-enter a private friend table in under one minute.
- Primary action: create a private table when none exists; share its invitation when one is active.
- Supporting actions: join with a code, re-enter an active table, understand seat and connection state, and optionally disclose practice play.

## Truth and constraints

- Show only server-backed room, seat, player, and connection state. Never invent people, activity, popularity, or social proof.
- Private social play only. Club Points and play chips have no cash value; purchases remain disabled.
- Public tables, AI practice, rewards, and referrals never compete with the friend-table flow.
- Every destructive or state-replacing action must make its consequence clear; an active invite remains recoverable.

## Chosen direction

- Direction: Persistent Table Stage.
- Approved comp: `.impeccable/mocks/decision/persistent-table-stage.png`.
- Memorable moment: the room becomes a physical six-seat table whose lacquer rail carries the room code and invitation action; empty seats visibly wait for the player’s real friends.
- Composition: quiet top navigation; dominant table occupies about two-thirds of the desktop viewport; a slim state-aware utility rail sits beside it; practice is a disclosure below the core stage.
- Do not literalize: illustrative names, avatar, and code; join/create controls competing with an already-active table; any UI text baked into raster imagery; photographic precision that obscures focus, loading, error, or responsive behavior.

## Approved-comp system record

- Component grammar: controls and status live on or immediately beside the physical table; utility actions use one vertical rail, never an equal card grid.
- Corner language: table is a large organic rounded rectangle; panels use 14–16px corners; compact statuses and code controls may use pills.
- Line weights: 1px warm-green or muted-gold separators; table rail gains material depth rather than a second outline.
- Elevation: soft downward black shadows and inner table shadows; no zero-offset halos or hard block shadows.
- Type ramp: Playfair Display 700–900 for the table name and primary headings; Poppins 400–700 for controls and state; 12px minimum for explanatory and operational copy.
- Sampled comp colors: page ground `#020907`; felt field `#0E291E` to `#122C22`; lacquer rail `#261711` to `#41281F`; net CTA gold `#D59F3E`; utility panel `#161D1A`; warm ivory `#FFFBEA`.

## Ingredient and medium inventory

| Ingredient | Commitment | Medium |
|---|---|---|
| Page ground | Near-black green field covering the viewport | Semantic CSS |
| Felt table surface | Visible woven felt material across roughly half the first viewport | Generated seamless raster texture, color-controlled in CSS |
| Lacquer table rail | Warm dark wood/lacquer material with edge depth around the full table | Generated seamless raster texture plus semantic CSS geometry |
| Six-seat topology | One host seat and five responsive friend seats arranged around the table | Semantic HTML/CSS with authored layout |
| Seat and utility icons | One consistent 2px rounded stroke family | Existing Lucide icon library |
| Table name, room code, statuses | Live store/server data; tabular room code | Semantic HTML |
| Share-invite action | Gold rail-integrated primary action with loading/success/fallback states | Semantic button and Web Share/clipboard APIs |
| Empty state | Same table stage with clear create/join paths, not a substitute dashboard | Semantic HTML/CSS |
| Utility rail | Join/create only when no active table; re-enter/leave consequences when active | Semantic forms and buttons |
| Practice disclosure | One collapsed secondary region below the core table | Semantic `details`/controls |
| Navigation | Clubhouse, How to play, profile/settings; mobile-safe | Semantic nav and existing icon library |
| First-view motion | Table rail settles into place once; seats arrive in a short stagger; default remains visible | Framer Motion with reduced-motion support |

## Unresolved decisions

- The browser share sheet may be unavailable; clipboard copy with a clear confirmation is the required fallback.
- A server room can disappear between visits; recovery must return the lobby to its create/join state without losing context or showing a generic load failure.
