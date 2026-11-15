# Kivora — verified Mondly composition pass

Implemented November 11, 2026. This supersedes the visual reference limitations and sidebar composition in the earlier premium-redesign and pnpm-admin-modernization reports. Their migration and dependency results remain applicable.

## Reference actually inspected

The [primary Dribbble shot](https://dribbble.com/shots/25409377-Mondly-Personalized-Language-Learning-Experience) was opened in Chrome. Its DOM exposed the original artwork, which was retrieved at 1824 × 1368 and inspected directly. A comparison-only copy is in [reference-mondly.jpg](../../output/mondly-audit/reference-mondly.jpg); it is not imported by the application or served from public assets. No Mondly logos, photographs, or illustrations are included in Kivora's interface.

Observed, approximate coordinates in the original artwork:

| Region | Reference observation | Kivora implementation |
| --- | --- | --- |
| Workspace | Rounded white frame, roughly x83–1743, y85–1283; pale gray-lavender canvas | Responsive framed workspace, white 6px edge, 36px radius, maximum 1680px |
| Navigation | Centered horizontal gray pill with black selected item; **no vertical sidebar** | Centered pill navigation on student and admin routes; existing secondary routes in an accessible menu |
| Content grid | Left learning area ~1040px, right activity area ~512px, ~18px gutter | 2:1 student grid with 16px gutters, two equal learning panels within the left area |
| Learning panels | White cards, ~32px outer radius; vivid purple active-course inset; quiet gray rows | 28px white panels, 16px purple inset, actual next action plus existing explore/plan controls |
| Progress | Large level label, four small tiles, green/orange/purple progress accents | Actual CEFR level, course completion, daily plan, reviews and history; scoped animated fills |
| Right column | Activity, daily tasks, smaller course card | Actual streak, review/lesson counts, existing Blitz and AI tutor routes |
| Lower left | Compact teacher-course list with understated columns | Compact list of Kivora's existing review and Blitz activities; no invented teacher/course data |
| Typography | Large light-weight greeting with muted introduction, dark name, medium card titles | Optimized existing Inter/Figtree; fluid greeting, lighter headings, darker metadata for accessible contrast |

The reference only supplies a desktop composition. Tablet and mobile layouts are adaptations, not observed mobile designs. Mobile uses natural document scrolling, one-column cards, existing bottom navigation and a keyboard-accessible drawer. Tablet pairs the primary cards and reorganizes the activity column. Dense admin tables retain horizontal scrolling within named, focusable regions.

## Implemented changes

- Rebuilt `DashboardOverview.tsx` around the measured composition. Removed the oversized decorative hero and three large pastel promotional cards. Retained the planner-provided primary action, optional secondary action and actual study-plan dialog.
- Updated `premium.css` and semantic primary colors in `globals.css`. Reused existing fonts, Kivora branding, button/form primitives and icon library. Removed obsolete desktop sidebar/decorative-hero styles.
- Updated `NavbarClient.tsx`, `DashboardChrome.tsx`, `AdminSidebarClient.tsx`, `AdminSidebarNav.tsx` and `AdminChrome.tsx` for centered desktop navigation, existing mobile drawers, accessible account tools and matching loading geometry. Existing `AdminSidebar*` filenames remain compatible with their callers.
- Updated `AdminSectionHeader.tsx`, `admin-premium.css`, shared admin page width and all six existing admin pages: overview, members, member detail, packs, assignments and reports. The overview places the operational table beside performance highlights and quick actions. Other screens retain their workflow-specific structure.
- Extended `MotionSurface.tsx` with an opt-in scoped stage sequence. Navigation enters first, followed by the greeting, learning panels and supporting cards. GSAP animates opacity/transform; ScrollTrigger animates real progress fills and existing scroll reveals. `useGSAP`, matchMedia and context cleanup remain responsible for lifecycle teardown. Reduced-motion content stays visible.

No dependency changes were necessary in this pass. Reused pnpm **12.18.0**, Next **16.4.6**, React **19.3.1**, Tailwind **4.3.5**, GSAP **3.15.1**, @gsap/react **2.1.2**, existing Motion/Radix/Lucide and state architecture. ScrollTrigger ships with GSAP. Lenis remains intentionally absent: native scrolling avoids competing with exercise screens, nested tables and dialogs. See [the migration report](pnpm-admin-modernization.md) for previous/current dependency versions and audit exceptions.

## Functional boundaries

Home data still flows from the existing authenticated server page and learning planner into the presentation component. All links continue to use the existing route contracts. Admin server-side role checks, query code, server actions, filters, imports, assignment controls, recording/AI implementations and persistence were preserved. No schema, production records, credentials, APIs or deployment settings changed in this pass.

Browser validation used an isolated temporary Next harness importing the actual presentation/admin components. It supplies local fixture records and makes mutations throw; no bypass or mock authentication was added to the repository. The student capture includes the real study-plan dialog. Fixture counts and names in screenshots are validation data, not new product content.

## Validation and evidence

- TypeScript native and TS6 checks: passed.
- ESLint: zero errors; two existing warnings in BillingSettings (effect dependency) and scripts/test-adaptive-db.mjs (unused variable).
- Vitest: **67 files, 626 tests passed**.
- Production build: passed with the existing default Turbopack build.
- Existing public production-browser suite: **12 tests passed**, desktop and mobile, using a temporary config without account provisioning. `/login` returned 200; unauthenticated `/home` and all five main admin routes returned 307 to `/login`.
- Source color/contrast checks: passed.
- Responsive Chrome run: **70 combinations**, seven screens × 320, 375, 390, 430, 768, 1024, 1280, 1440, 1920 and 2560px. Zero document overflow and zero page runtime errors.
- Final desktop navigation geometry: student/admin at five desktop widths, no overlap or overflow; centering error below 0.01 CSS px.
- Browser axe checks: zero WCAG A/AA findings in seven page main regions, expanded admin states, study-plan dialog and desktop admin navigation. These are scoped automated checks, not a claim of complete accessibility certification.
- Interactions: desktop secondary navigation, mobile student/admin drawers, study-plan dialog/Escape, member search/role filters/empty state, member dialog/password visibility, pack creation/import panels, assignment mode keyboard selection and PDF export passed without executing data mutations.
- Repeated admin route navigation: eight active triggers after each of three returns; zero detached trigger targets. Reduced motion: zero ScrollTriggers, zero infinite animations, zero hidden headings.

Evidence is in [output/mondly-audit](../../output/mondly-audit): screenshots, responsive-results.json, navigation-geometry.json, accessibility-results.json, panel-accessibility-results.json, interaction-results.json, unit-tests.log, lint.log and production-build.log.

## Rendered comparison and limitations

Compared the retrieved artwork with before/after desktop and mobile captures. The largest mismatches were the former vertical sidebar, oversized lavender hero, three promotional cards and vertically stacked admin overview. Those were replaced before refining typography, contrast, spacing and navigation centering.

The final composition is substantially closer to the inspected reference, but it is **not a pixel-perfect copy**. Kivora has different text, route count, brand assets, genuine learning data and administrative workflows. The reference's languages, teacher appointments, test scores and historical day tiles were not invented as Kivora features. The greeting uses darker secondary text than the artwork to meet contrast requirements. No live authenticated end-to-end test, provider audio/AI transaction, production data mutation, field Core Web Vitals measurement or deployment was performed.
