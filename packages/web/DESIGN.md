---
name: Social Teen Patti Clubhouse
description: A tactile private card room where the friend table is the lobby.
colors:
  clubhouse-ground: "#020907"
  deep-surface: "#07110E"
  clubhouse-felt: "#102C21"
  clubhouse-felt-deep: "#0B2118"
  clubhouse-lacquer: "#2F1B14"
  clubhouse-lacquer-deep: "#1B0D09"
  invitation-gold: "#D59F3E"
  invitation-gold-light: "#E8B85B"
  entry-game-gold: "#E8B04A"
  clubhouse-ivory: "#FFFBEA"
  card-paper: "#F6ECD8"
  utility-panel: "#111A16"
  clubhouse-muted: "#B7C9C0"
  clubhouse-line: "#395044"
  clubhouse-danger: "#D37A68"
  seal-red: "#B74035"
  brass-hardware: "#A5854B"
typography:
  display:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "clamp(2.6rem, 5vw, 4.6rem)"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "normal"
  body:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.08em"
  localization:
    fontFamily: "Hind, Noto Sans Devanagari, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.5
rounded:
  compact: "10px"
  nav: "12px"
  control: "14px"
  form: "16px"
  card: "28px"
  felt: "40px"
  table: "62px"
  pill: "999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-invitation:
    backgroundColor: "{colors.invitation-gold}"
    textColor: "{colors.clubhouse-lacquer-deep}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "14px 24px"
    height: "64px"
  button-invitation-hover:
    backgroundColor: "{colors.invitation-gold-light}"
    textColor: "{colors.clubhouse-lacquer-deep}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "14px 24px"
    height: "64px"
  button-secondary:
    backgroundColor: "{colors.clubhouse-felt-deep}"
    textColor: "{colors.clubhouse-ivory}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
    height: "50px"
  button-danger:
    backgroundColor: "{colors.clubhouse-lacquer}"
    textColor: "{colors.clubhouse-danger}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
    height: "50px"
  room-code-control:
    backgroundColor: "{colors.clubhouse-felt-deep}"
    textColor: "{colors.clubhouse-ivory}"
    rounded: "{rounded.control}"
    padding: "12px 18px"
    height: "76px"
  auth-input:
    backgroundColor: "{colors.deep-surface}"
    textColor: "{colors.card-paper}"
    typography: "{typography.body}"
    rounded: "{rounded.form}"
    padding: "14px 48px"
    height: "52px"
---

# Design System: Social Teen Patti Clubhouse

## Overview

**Creative North Star: "The Living Card Room"**

The private friend table is the lobby. Social Teen Patti opens into a near-black clubhouse with one persistent six-seat table already waiting for real people; it refuses the public-room dashboard as the product’s default shape. The room should feel tactile and adult, not promotional: woven green felt, dark lacquer rails, warm ivory type, brass fixtures, and invitation gold form one physical operating system.

The table carries live room state directly on its surface and rail. Invitation, presence, reconnection, and the next honest action supply the drama; public practice, rewards, and balances remain disclosed supporting information. Neon casino spectacle, esports chrome, fabricated social proof, and equal-weight card grids are outside this world.

**Key Characteristics:**

- A near-black clubhouse ground under one dominant felt-and-lacquer table stage.
- Warm ivory editorial headings paired with a practical geometric operating face.
- Invitation gold reserved for the action or state that brings friends together.
- Brass seat hardware, an inset rail edge, and a HOST plate make topology tangible.
- Server-backed room, seat, and connection state always outrank public inventory.

## Colors

The palette is warm, dark, and material: black-green ground, woven felt, oxblood-brown lacquer, ivory card stock, brass hardware, and one scarce invitation gold.

### Primary

- **Invitation Gold** (`invitation-gold`): The primary clubhouse action, invite confirmation, room-code emphasis, and selected friend-table state.
- **Invitation Gold Light** (`invitation-gold-light`): The invitation control’s hover lift and restrained highlight.
- **Entry / Game Gold** (`entry-game-gold`): The established companion gold on authentication, modals, and in-hand play; keep it on those incumbent surfaces instead of introducing a third gold.

### Secondary

- **Clubhouse Felt** (`clubhouse-felt`): The dominant table field and practice table material.
- **Clubhouse Felt Deep** (`clubhouse-felt-deep`): Recessed controls and inner tonal layers.
- **Clubhouse Lacquer** (`clubhouse-lacquer`): The thick table rail, brand mark, host plate, and warm destructive context.
- **Clubhouse Lacquer Deep** (`clubhouse-lacquer-deep`): Rail depth, shadowed edges, and dark text on gold.
- **Brass Hardware** (`brass-hardware`): Seat tabs and physical fixtures; it supports the table without becoming a CTA.
- **Seal Red** (`seal-red`): Player seals and explicit error/destructive emphasis only.

### Neutral

- **Clubhouse Ground** (`clubhouse-ground`): The lobby viewport ground.
- **Deep Surface** (`deep-surface`): The shared entry and game ground plus the deepest form field.
- **Utility Panel** (`utility-panel`): The state-aware action rail beside or below the table.
- **Clubhouse Ivory** (`clubhouse-ivory`): Highest-emphasis copy and display type.
- **Card Paper** (`card-paper`): Softer body/control text and literal playing-card faces.
- **Clubhouse Muted** (`clubhouse-muted`): Supporting operational copy at readable sizes.
- **Clubhouse Line** (`clubhouse-line`): Quiet separators and panel edges.
- **Clubhouse Danger** (`clubhouse-danger`): Recoverable error and leave-state copy.

**The Invitation Rule.** Gold belongs to the action that creates, joins, shares, or re-enters a private table, the code that enables it, or the state confirming it. If every control is gold, the invitation disappears.

**The Material Role Rule.** Felt is where play and live state happen; lacquer contains and protects it; brass identifies hardware; ivory carries language.

## Typography

**Display Font:** Playfair Display (with Georgia fallback)
**Body Font:** Poppins (with system-ui fallback)
**Localized Devanagari Face:** Hind (Noto Sans Devanagari fallback)

**Character:** Playfair Display gives table names and decisive headings the warmth of an established private club. Poppins keeps controls, seat state, legal copy, and changing server information fast to scan. Hind exists only as the Devanagari localization face through the localization class; it is not a third Latin voice.

### Hierarchy

- **Display** (800, fluid 2.6rem–4.6rem, 0.98): One table name or product thesis per surface; mobile may wrap it into a balanced two-line lockup.
- **Headline** (700, 1.5rem, 1.2): Utility-rail titles, dialogs, and major disclosed sections.
- **Body** (400, 1rem, 1.6): Instructions, reassurance, rules, and table context; keep explanatory lines comfortably below 70 characters.
- **Label** (600–800, 0.75rem minimum, up to 0.10em tracking): Room-code captions, status hardware, and short operational labels.
- **Localization** (500, 1rem, 1.5): Devanagari copy only; match the same hierarchy and contrast as Poppins.

**The One Display Rule.** One serif statement leads each surface; operational state stays in the body face.

**The Twelve-Pixel Floor Rule.** Legal, explanatory, status, seat, and operational copy never drops below 12px. Condense layout or wrap copy before shrinking it.

## Layout

The clubhouse uses a fluid container capped at 1505px. On desktop, a quiet 84px header sits above a two-column stage: the table takes the flexible dominant column and a 320px state-aware utility rail sits alongside it with a 20px gap. The table shell holds a minimum height between 600px and 720px, keeping the six-seat topology, live room state, code, and rail-integrated share action inside the first operational view.

Below 1024px, the utility rail moves beneath the table; it may use two columns on tablet but becomes a single vertical flow on mobile. Below 640px, the header tightens to 72px, the table becomes a tall 680px stage, outer/inner corners reduce to 42px/30px, side seats move inward, and the invitation action remains anchored to the near rail. Secondary practice stays in one collapsed disclosure after the trust strip. Layout padding respects bottom safe areas, and every interactive target is at least 44px.

Spacing follows an 8px base with 12, 16, 24, and 32px working steps. Use the smallest step inside controls, the middle steps between states, and the largest steps between the table, trust strip, and disclosed practice.

**The Table-First Rule.** Create/join controls may live in the utility rail when no room exists, but an active private table replaces them with share, code, connection, and leave state; the active stage never competes with a room directory.

## Elevation & Depth

Depth is physical and directional. The lacquer rail uses one broad downward table shadow plus inset highlights and dark edge pressure; the felt is recessed with inner shadows and a restrained brass edge. The utility rail and dialogs lift less than the table. Zero-offset neon halos and hard block shadows do not belong here.

### Shadow Vocabulary

- **Table Lift** (`0 32px 74px rgba(0,0,0,0.48)` plus lacquer insets): The dominant table shell only.
- **Felt Recess** (`inset 0 20px 70px rgba(1,9,6,0.32), inset 0 -42px 90px rgba(1,8,5,0.42)`): The woven play field inside its rail.
- **Utility Lift** (`0 26px 60px rgba(0,0,0,0.34)` plus a quiet inset edge): The state-aware side rail.
- **Invitation Lift** (`0 15px 34px rgba(0,0,0,0.38)` plus warm insets): The rail-integrated primary action.
- **Dialog Lift** (`0 18px 45px rgba(0,0,0,0.42)`): Confirmations and verified-state popovers.

**The Tonal-First Rule.** Establish hierarchy with ground, felt, lacquer, and spacing before adding borders or shadow. Nested cards inside cards signal unresolved hierarchy.

## Shapes

The signature table uses a 62px outer lacquer radius and 40px felt radius on desktop, with one inset brass edge rather than a stack of outlines. Mobile compresses that geometry to 42px/30px without losing the thick rail. Controls use compact 10–16px corners, the authentication feature card uses 28px corners, and pills are reserved for status, seat hardware, and compact navigation state.

Seats are circular brass-mounted medallions arranged as one host plus five friends. The HOST plate is centered above the occupied host seat. The brand mark is a slightly rotated lacquer tile; playing cards use softly rounded paper corners. Random rounded containers and repeated equal cards are not part of the form language.

**The One Edge Rule.** Material depth may use inset light and shadow, but the table’s visible brass perimeter remains singular and quiet.

## Components

### Buttons

- **Shape:** Clubhouse actions use 14px corners; form actions use 16px. All controls meet the 44px target floor.
- **Invitation:** The table action is 64px tall on desktop, 58px on mobile, centered into the near lacquer rail, and uses Invitation Gold with dark lacquer text.
- **Hover / Focus / Active:** Hover lifts the invitation action 2px and moves to Invitation Gold Light. Focus uses a 2px gold-light or ivory outline with 3px offset. Active returns the control toward the rail rather than adding glow.
- **Secondary:** A deep felt field, ivory label, and quiet green edge support code, create, stay, and practice actions.
- **Danger / Text:** Leaving a table first appears as an underlined 44px text action; confirmation uses a lacquer-danger button and names the consequence.

### Chips

Privacy and connection statuses are dark translucent felt pills with a quiet green edge. Connecting and reconnecting move to warm brass-gold; offline uses the muted danger ramp. Status copy remains at 12px minimum, and connection text is announced through a polite live region.

### Cards / Containers

The utility rail is a single state-aware 16px container, not a dashboard card grid. It contains one table title, live invite feedback, relevant code action, and the leave consequence. The practice disclosure is another 16px tonal container but remains collapsed until requested.

### Inputs / Fields

Authentication and room fields use a deep near-black surface, 16px corners, visible labels, 52px minimum height, and warm ivory text. Focus shifts the edge to gold and adds a restrained two-pixel ring. Errors remain adjacent, preserve the field value, and state the recovery action. Room codes use tabular numerals and moderate tracking, never decorative distortion.

### Navigation

Desktop navigation is a quiet row of 44px targets. The active destination uses a dark tonal field with a two-pixel gold underline; hover changes tone and ivory contrast. On mobile, primary identity/profile controls remain in the header while secondary destinations move into the page flow—do not invent a fixed bottom tab bar for this surface.

### Persistent Table Stage

The system’s signature component is a six-seat woven-felt field inside a thick lacquer rail. Live table name, occupied count, room code, privacy, and socket connection state sit on the felt. Brass-mounted seat medallions ring the topology, the occupied first seat receives the HOST plate, and the invitation action is physically built into the near rail. The stage exists in both empty and active states and survives dialog dismissal.

### Connection State

Lobby connection status comes only from the socket service’s `connected`, `connecting`, `reconnecting`, or `offline` state. Room existence never implies connectivity. The current state is visible beside privacy on the felt and announced semantically without fabricated availability claims.

### Motion

The table settles once over 620ms with a material ease (`cubic-bezier(0.16, 1, 0.3, 1)`). Seats arrive over 340ms in a short 45ms stagger. Ordinary controls use 180ms transitions and disclosure chevrons use 220ms. Reduced-motion preference collapses animation and transition durations to effectively instantaneous while leaving every state visible.

## Do's and Don'ts

### Do:

- **Do** make Create, Join, Share, or Re-enter the clearest action on every pre-game surface.
- **Do** let the persistent table, real seat occupancy, and live connection state carry the first viewport.
- **Do** use the exact clubhouse material tokens and preserve the 62px outer / 40px felt desktop geometry.
- **Do** keep 18+, social-only, and no-cash-value language calm, readable, and at least 12px.
- **Do** announce connection, invite, turn, and error state changes semantically.
- **Do** keep Hind scoped to Devanagari localization rather than Latin display or body copy.

### Don't:

- **Don't** let public rooms, AI practice, rewards, or variant browsing compete with the private friend table.
- **Don't** use purple/cyan gaming gradients, neon glows, casino spectacle, or fabricated social proof as clubhouse chrome.
- **Don't** infer connection from room existence; render only the socket service’s actual state.
- **Don't** mix Club Points and play chips in name, glyph, or emphasis.
- **Don't** use text below 12px for legal, operational, status, seat, or explanatory content.
- **Don't** destroy active table or invitation state when a modal or disclosure closes.
