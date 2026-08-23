# Material asset manifest

Source of visual truth: approved comp `.impeccable/mocks/decision/persistent-table-stage.png`, its recovered embedded prompt / approved JSON sidecar, and `packages/web/.impeccable/surfaces/src-app-tsx.md`. Both materials were generated with the built-in image tool using the approved comp as a material-only reference, then normalized and encoded as opaque lossless WebP.

| Asset | Source and provenance | Output | Crop / tile notes |
|---|---|---|---|
| `packages/web/public/materials/felt-clubhouse.webp` | Built-in generation; exact received prompt is recoverable from `felt-clubhouse.webp.json` via `node /Users/durjoy/.agents/skills/impeccable/scripts/embed-prompt.mjs packages/web/public/materials/felt-clubhouse.webp --read`. | 1024×1024, WebP, RGB/opaque, lossless; measured net field `#102C21`. | Square source resampled from 1254×1254. Palette normalized to the comp field. All four boundaries were wrap-blended; opposing-edge pixel MAD is 0.0 horizontally and vertically. Safe for `repeat`, `cover`, or masked felt geometry. |
| `packages/web/public/materials/lacquer-rail.webp` | Built-in generation; exact received prompt is recoverable from `lacquer-rail.webp.json` via `node /Users/durjoy/.agents/skills/impeccable/scripts/embed-prompt.mjs packages/web/public/materials/lacquer-rail.webp --read`. | 1024×256, WebP, RGB/opaque, lossless; measured net field `#321E18`, channel extrema constrained to the requested `#261711`–`#41281F` palette. | Center-cropped from the 1774×887 source to the requested 4:1 strip, then resampled. Left/right boundaries were wrap-blended; opposing-edge pixel MAD is 0.0 horizontally. Intended for horizontal repeat or cover; top/bottom are not a vertical tile seam. |

`embed-prompt.mjs --scan packages/web/public/materials` reports two rasters and zero missing prompts. For WebP, the script's required provenance carrier is the adjacent JSON sidecar.

## Semantic-code boundary

These files contain material texture only. Table geometry, rail bevel and depth, six-seat topology, icons, live table name and room code, copy, statuses, buttons, focus/loading/error states, responsive behavior, and all controls remain semantic HTML/CSS/SVG/React. No UI or product data was rasterized from the comp.

## Material caveats

- Felt is seam-safe in both axes; lacquer is seam-safe horizontally only, matching its rail use.
- Lighting, masks, edge depth, and comp-scale color control should be supplied in CSS so the materials remain reusable and responsive.
- Fine stochastic texture can reveal repetition on unusually large uninterrupted areas; prefer `cover` for a single table field and horizontal repeat for long rail runs.
