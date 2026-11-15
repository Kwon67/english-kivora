# Color distribution and white card surfaces — 2026-11-11

The user screenshot showed gray cards blending into the gray canvas. The latest explicit direction requests white cards. Added `--surface-white: #ffffff` as a neutral surface, leaving the supplied six brand swatches unchanged. `--kivora-surface` and the white Tailwind color now use real white.

Learning: white outer cards, lilac continue-learning inset, purple CTA, orange daily-plan inset, yellow completed streak days, orange conversation label. No feature logic or account data changed.

Landing: white card containers, orange demonstration header and audience pitch, lilac scenario panel, purple conversion inset with a yellow CTA. Styles are scoped to landing components; no new dependencies.

Validation:
- TypeScript passes.
- ESLint: no errors; two existing warnings in test-adaptive-db.mjs and BillingSettings.tsx.
- 629 tests pass across 68 files.
- Production Next.js build passes.
- Chromium: 48 responsive checks across landing and home, zero overflow/control failures. 24 viewports, 320 to 3440 pixels, including landscape and short heights.
- Chromium and WebKit: axe WCAG A/AA checks on landing, home, explore and admin dashboard at 390px, zero detected violations. This is automated coverage, not a full accessibility certification.
- Landing practice demonstration completes after scenario change in both engines.
- Captures: `output/color-balance/`, including before/after home and landing, 390/768/1440 captures, WebKit screenshots and accessibility JSON.

Authenticated routes use the actual components with isolated local fixtures; no production records were read or modified during visual testing. Physical iPhone testing remains unperformed. No pixel-perfect reference claim.
