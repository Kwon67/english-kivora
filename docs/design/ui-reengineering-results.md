# Kivora UI reengineering results

The [baseline audit](ui-reengineering-audit.md) records severity, affected components, and proposed corrections before implementation.

## Findings and corrections

| Severity | Before | After |
| --- | --- | --- |
| High | At 320px the landing header extended to x=510 and obscured its menu. Assignment actions reached x=343 and history reached x=348. Document-width checks missed the clipped content. | Shared button styles now respect responsive visibility. The application shell allows natural overflow, assignment controls wrap, and charts have bounded grid tracks. The 320px landing menu has a Playwright regression test. |
| High | The student dock disappeared at tablet widths while its primary destinations were absent from the drawer. The member detail chart could retain a desktop width during a landscape resize. | Tablet navigation exposes all learner destinations. Chart frames establish their own inline size, preserve a reserved height and constrain the drawing surface during resize. |
| Medium | Home duplicated the main action and used a narrow right rail at 1024px. The course inset started at y=301 in the 320×568 baseline screenshot. | The welcome leads into a single course action, progress, routine, practice and tutor. Container queries give tablets two balanced columns. At 320×568 the course inset starts at y=256 and its action ends at y=474, above the dock at y=502. |
| Medium | Admin metrics used position-based color overrides. Folder titles could exceed their action area, and editing placed an input inside a button. Dialogs could leave keyboard focus on the trigger. | Admin metrics use semantic tones, folder renaming uses a labeled form, and dialogs constrain and restore focus. Tables retain readable columns in named keyboard-scrollable regions. |
| Medium | Some page entrances faded text from zero. Multiple scopes could animate the same progress fill and separately refresh ScrollTrigger. | Shared GSAP sections keep text readable during entry. Each progress fill belongs to its nearest scope. Refreshes are coalesced and pending review celebration timers are cleared. |
| Low | Component styles duplicated foundational colors and typography across shell, charts and admin. Marketing and account forms had small text with inadequate contrast. | The shared palette and fluid type scale supply app, admin, landing and auth components. Pricing, password guidance and placeholders use readable foreground and background pairings. |

## Design and implementation

- [Design tokens](../../src/app/design-tokens.css) define the gray-lavender canvas, white and inset surfaces, violet actions, functional status colors, and ten education tones. Grammar uses violet, vocabulary uses mint, speaking uses peach, listening uses sky, writing uses lilac, reading uses teal, review uses sage, AI tutoring uses periwinkle, streaks use amber, and achievements use terracotta. All 19 measured text/surface pairs reach 4.5:1. The lowest measured ratio was 5.99:1. [Contrast measurements](../../output/ui-reengineering/after/token-contrast.json)
- [Student overview](../../src/app/(dashboard)/home/DashboardOverview.tsx) and [workspace styles](../../src/app/learning-workspace.css) rebuild the grid, course card, progress summaries, routine, vocabulary and speaking entry points. DM Sans stays as the single font family with a revised fluid scale, weights and spacing. The display adapts to the existing progress, assignments, review queue and streak data.
- [Shared chrome](../../src/app/premium.css), the [learner drawer](../../src/components/layout/MobileNavMenu.tsx), and [admin styles](../../src/app/admin-premium.css) align the nav, gutters, buttons, card radii, and table controls. The admin overview, members and member detail, packs, assignments, and reports use the shared surface and spacing system. Metrics and status accents represent administrative data.
- Explore, the learning path, onboarding, the study plan, lesson intros and exercise prompts use the same tones and sizing rules. Recharts surfaces and legends use semantic theme colors and stable chart frames.
- [MotionSurface](../../src/components/motion/MotionSurface.tsx) uses GSAP 3.15.1, ScrollTrigger and the existing @gsap/react integration. The browser exercise verified two initial progress triggers, completed fills on scroll, zero triggers after passing their ends, zero detached triggers across three navigation round trips and zero active triggers with reduced motion. Native scrolling supplies the app's scroll behavior. Existing Motion remains for isolated interactions. The implementation reuses the installed dependency set. [Interaction evidence](../../output/ui-reengineering/after/interactions.json) · [GSAP React guide](https://gsap.com/resources/React/) · [ScrollTrigger documentation](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)

The desktop layout follows the framed canvas, centered navigation, near 2:1 learning-to-activity proportion, and concentrated violet course panel in the primary artwork. The wider amber streak surface, Kivora modules and labels, and mobile navigation adapt the concept to the product. The Dashboard and Branding artwork informed the green, blue, peach and amber accents. The published Behance cover loaded. The full gallery returned HTTP 403. [Courses artwork](https://dribbble.com/shots/25409377-Mondly-Personalized-Language-Learning-Experience) · [Dashboard artwork](https://dribbble.com/shots/23949154-Mondly-UX-UI-Dashboard-Design-for-Language-Learning-Platform) · [Branding artwork](https://dribbble.com/shots/23934868-Mondly-Branding-for-the-language-learning-platform) · [Behance case study](https://www.behance.net/gallery/203983447/Mondly-UXUI-Design-for-Language-Learning-Platform)

## Browser evidence

| View | Before | After |
| --- | --- | --- |
| Student desktop | [1440×900](../../output/ui-reengineering/before/workspace/home-1440x900.jpg) | [1440×900](../../output/ui-reengineering/after/workspace/home-1440x900.jpg) |
| Student tablet | [834×1194](../../output/ui-reengineering/before/workspace/home-834x1194.jpg) | [834×1194](../../output/ui-reengineering/after/workspace/home-834x1194.jpg) |
| Student phone | [320×568](../../output/ui-reengineering/before/workspace/home-320x568.jpg) | [320×568](../../output/ui-reengineering/after/workspace/home-320x568.jpg) |
| Admin desktop | [1440×900](../../output/ui-reengineering/before/workspace/admin-dashboard-1440x900.jpg) | [1440×900](../../output/ui-reengineering/after/workspace/admin-dashboard-1440x900.jpg) |
| Admin phone | [390×844](../../output/ui-reengineering/before/workspace/admin-dashboard-390x844.jpg) | [390×844](../../output/ui-reengineering/after/workspace/admin-dashboard-390x844.jpg) |
| History and charts | [320×568](../../output/ui-reengineering/before/workspace/history-320x568.jpg) | [320×568](../../output/ui-reengineering/after/workspace/history-320x568.jpg) |
| Landing phone | [320×568](../../output/ui-reengineering/before/public/landing-320x568.jpg) | [320×568](../../output/ui-reengineering/after/public/landing-320x568.jpg) |

Additional captures include the [lesson introduction](../../output/ui-reengineering/after/workspace/play-local-lesson-390x844.jpg), [exercise prompt](../../output/ui-reengineering/after/workspace/practice-390x844.jpg), [onboarding](../../output/ui-reengineering/after/workspace/onboarding-390x844.jpg), [admin pack form](../../output/ui-reengineering/after/admin-new-pack-320x568.png), [member dialog](../../output/ui-reengineering/after/dialog-new-member-320x568.png), and [study-plan dialog](../../output/ui-reengineering/after/dialog-study-plan-320x568.png).

Playwright checked and captured 24 viewport sizes for each rendered page. Widths were 320, 360, 375, 390, 393, 402, 414, 430, 600, 768, 820, 834, 1024, 1280, 1366, 1440, 1536, 1728, 1920, 2560 and 3440 pixels, plus 667×375, 844×390 and 1280×600. All 744 checks passed across 24 workspace views and seven public views, with zero unintended horizontal overflow, clipped controls, nav collisions or uncaught page errors. Intentional table, heatmap and carousel scrolling is contained to those components. [Workspace matrix](../../output/ui-reengineering/after/workspace/results.json) · [Public matrix](../../output/ui-reengineering/after/public/results.json)

The dashboard menu matrix includes 48 touch or keyboard checks. The study-plan and member dialogs were each checked at 320×568, 667×375 and 834×1194 for viewport containment, keyboard focus trapping, Escape and focus restoration. Real Chrome browser zoom at 200% and 400% reflowed the home, admin overview, member directory and history at effective widths of 640px and 320px. [Menu matrix](../../output/ui-reengineering/after/navigation-matrix.json) · [Zoom measurements](../../output/ui-reengineering/after/zoom.json) · [400% home capture](../../output/ui-reengineering/after/zoom-400-home.png)

## Validation scope

- Production build, native TypeScript, TypeScript 6, and the color and contrast scripts passed. ESLint reported zero errors and two existing warnings in `test-adaptive-db.mjs` and `BillingSettings.tsx`. Vitest passed 626 tests across 67 files.
- The authenticated browser runs use read-only local fixtures. They exercise rendered learner and admin components, including member detail, a lesson intro, onboarding, the exam intro, Blitz play and tutor. The temporary exercise fixture verified multiple-choice, flashcard and typing callbacks. Live sign-in, MFA challenges, data writes, AI generation, and microphone permissions require their real services and remain outside this verification.
- The public routes use the local production build. All 14 desktop and mobile Playwright cases passed. Signed-out requests to the learner and admin routes went to login. The browser also followed the streamed MFA redirect, and an intercepted 401 exercised the visible login alert. [Public interaction evidence](../../output/ui-reengineering/after/public-interactions.json)
- The automated WCAG A/AA axe scans reported zero violations on the 31 captured route views and on the six dialog states checked separately. Browser tests target Chromium. Physical devices, other browser engines, and manual screen-reader testing remain outside the evidence. [Workspace accessibility](../../output/ui-reengineering/after/accessibility-workspace.json) · [Public accessibility](../../output/ui-reengineering/after/accessibility-public.json)

## Lab performance

Each median uses three cold browser contexts at each viewport on the same local machine, with an unthrottled production build.

| Page and viewport | LCP before → after | Encoded JavaScript before → after |
| --- | ---: | ---: |
| Landing at 390px | 64 → 64 ms | 546.1 → 495.9 kB |
| Landing at 1440px | 68 → 60 ms | 546.1 → 543.3 kB |
| Login at 390px | 44 → 44 ms | 561.6 → 558.8 kB |
| Login at 1440px | 40 → 44 ms | 561.6 → 558.8 kB |

All sampled runs recorded CLS 0, one font request, and no long tasks. The mobile landing requested 20 scripts after the change, down from 24. In the local learner fixture a scripted 60-frame scroll measured a p95 frame interval of 16.8 ms. The lab runs do not establish real-user p75 LCP, CLS or INP. [Baseline timings](../../output/ui-reengineering/before/public-lab.json) · [Final timings](../../output/ui-reengineering/after/public-lab.json) · [Scroll timing](../../output/ui-reengineering/after/interactions.json)
