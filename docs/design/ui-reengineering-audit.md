# Kivora UI reengineering audit

Baseline recorded before editing the application. The work covers UI and layout. Authentication, role checks, planner rules, API handlers, database schemas and production records are outside the change.

## Repository and test boundaries

The workspace uses Next.js 16.4.6 App Router, React 19.3.1, strict TypeScript, Tailwind 4.3.5 via PostCSS, and pnpm 12.18.0. React Server Components read planner and admin records through the Supabase server client. Interactive features use React state, with Zustand for game, UI and presence state. The proxy, role checks and server actions are separate from the visual components. The root loads a single self-hosted DM Sans family. The project has no user-selectable dark theme. GSAP and ScrollTrigger are registered in `MotionSurface`, with Motion used for component transitions and gestures. Lenis is absent. The existing dependency set includes active uses of Recharts, Radix, lottie, sql.js, PDF export and audio libraries.

Route inventory inspected: public landing, login, MFA, signup, recovery, offline, legal and error pages; home, study redirect, onboarding, explore and pack detail, lesson play and level exam, review, history, difficulties, tutor and conversation, Blitz landing/play/ranking, generator, library and settings; admin redirect, overview, members/detail, assignments, packs and reports. Loading boundaries exist for the main authenticated route groups. Test coverage includes Vitest, public Playwright, and authenticated suites whose setup provisions accounts. The browser layout baseline uses read-only local fixtures for authenticated views and the local production build for public views.

## Findings before implementation

| Severity | Finding and evidence | Correction |
| --- | --- | --- |
| High | The public landing navigation extended to x=510 at a 320px viewport. Unlayered button display rules overrode responsive `hidden`. Outer clipping kept document scrollWidth at 320, concealing the lost menu. | Put shared button primitives in the component layer and make the narrow header use the drawer. |
| High | Admin assignment selection buttons extended to x=343 at 320px. History content extended to x=348 at the same width. The old shell hid both failures. | Wrap selection controls, remove shell-level clipping, set intrinsic grid limits, and keep explicit scroll regions for tables and heatmaps. |
| High | A member detail chart briefly retained its previous 1124px edge after resizing to 667px. The home layout at 1024px split the available space into an oversized primary stack and a narrow rail. | Give chart frames an independent inline size and use container-based two- and three-column layouts. |
| Medium | The 320×568 screenshot shows the course inset starting at y=301 and its action below the dock. Both the course and routine repeated the same primary CTA. The supporting practice section preceded activity in the phone reading order. | Put one prominent action immediately after the welcome, then progress, daily routine, practice and tutor. |
| Medium | `@theme`, `:root`, `.landing-light`, an unused v3 Tailwind config, chart palettes and component CSS duplicated color choices. Backgrounds used primarily white and violet, admin metrics were tinted by index, and the prior black button style overrode semantic intent. | Centralize foundation, functional and learning tones. Assign colors by data/role and reuse the same metric and chart recipes. |
| Medium | Rigid tile counts, frame insets, duplicated tablet rules, small uppercase metadata and multiple padding layers increased density variance. | Use shared page gutters, type and radii with intrinsic track sizes, flexible labels and simpler card interiors. |
| Medium | Multiple mounted motion surfaces independently refreshed all ScrollTriggers on font readiness. Nested scopes could both target a progress fill. Initial opacity zero delayed reading. | Scope progress ownership, coalesce layout refreshes, use short entrances and respect motion preferences. |
| Low | The public testimonial track intentionally extends outside its carousel viewport, which an element scan can mistake for a page leak. A temporary practice fixture had a non-wrapping mode picker at 320px. | Record intentionally clipped carousel tracks as such, and fix the fixture so its navigation can be distinguished from application overflow. |
| Low | Prior fallback headers used different dimensions from live chrome. Several small touch targets and duplicated desktop markup were present inside the compact learner header. | Share chrome geometry, use a compact drawer plus a safe-area dock, and remove the unreachable duplicate desktop controls. |

The baseline includes 576 viewport/page checks. In addition to the actual clipping issues above, 12 public checks flagged the intentionally clipped testimonial rail. The matrix inspected element edges and control content rather than relying on document width alone. See [baseline workspace results](../../output/ui-reengineering/before/workspace/results.json), [baseline public results](../../output/ui-reengineering/before/public/results.json), and [baseline lab measurements](../../output/ui-reengineering/before/public-lab.json).

## Reference artwork inspected

- The original Courses image shows a framed gray-lavender workspace, horizontal pill navigation, two learning cards in a region around twice the activity column's width, a violet inset with an amber progress line, color-coded level tiles and a lower data list. [Outcrowd Courses shot](https://dribbble.com/shots/25409377-Mondly-Personalized-Language-Learning-Experience)
- The original Dashboard image uses three equal-width panels with a two-column schedule beneath, violet activity bars, a green/orange/violet progress split, yellow course progress, soft green and blue course badges and a single dark action. [Outcrowd Dashboard shot](https://dribbble.com/shots/23949154-Mondly-UX-UI-Dashboard-Design-for-Language-Learning-Platform)
- The Branding artwork uses vivid violet, orange and yellow with pastel versions and spacious geometric typography. The Behance project gallery returned HTTP 403; its published cover was inspected and shows the dashboard, a violet tutor card and an amber quiz treatment. The remaining Behance panels could not be verified. [Outcrowd Branding shot](https://dribbble.com/shots/23934868-Mondly-Branding-for-the-language-learning-platform) · [Behance case study](https://www.behance.net/gallery/203983447/Mondly-UXUI-Design-for-Language-Learning-Platform)

The design target is a single strong course emphasis, small semantic accents and legible pastel groups. The Kivora mark, interface labels and real modules drive the composition. The concept provides desktop imagery. The responsive layouts are adaptations.

## Acceptance measurements

No unintended edge overflow with shell clipping disabled, one primary learning action visible in the first 320×568 screen, 44px targets for primary controls and dock items, keyboard-accessible local table scroll and dialogs, and text contrast of at least 4.5:1 for small copy. The target viewport set is all 21 requested widths plus three short or landscape sizes. Local LCP and CLS are lab observations. Field p75 LCP, CLS and INP require real-user data.
