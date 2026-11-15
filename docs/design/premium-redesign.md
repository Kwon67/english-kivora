# Kivora premium interface

> Visual update: the actual reference artwork was subsequently retrieved and inspected. The current navigation and composition are documented in [Mondly fidelity](mondly-fidelity.md). This report preserves the earlier audit and validation history.

## Audit (before implementation)

- Next 16.3.1 App Router, React 19.2.8, strict TypeScript, Tailwind 4.3.3; npm/package-lock.json.
- Existing primitives: Radix, shadcn, CVA, clsx/tailwind-merge, Lucide. Existing motion: Motion, CSS transitions/scroll timelines, Lottie, confetti. Recharts supplies analytics. Zustand supplies game, presence, and zen-mode state.
- Public routes: landing, login, MFA, register, password recovery, privacy, terms, offline. Learner routes: home, study, explore and pack detail, play, exam, review, problem words, tutor and conversation detail, Blitz/play/ranking, history, library, settings, onboarding, generation. Admin: dashboard, members/detail, assignment, packs, reports. Loading/error/not-found boundaries are present.
- Learning flow: server-authenticated home → daily plan/curriculum → assigned exercise → evaluation/SRS/progress. Curriculum gates, exams, eight game modes, speech/recording/playback, tutor, generated cards, pack import/organization, reporting, subscriptions, privacy settings, notifications and onboarding are existing features.
- Supabase server/client auth, proxy security, server actions and API routes own persistence; gameStore owns exercise state; uiStore owns zen mode. Preserve all these contracts. E2E global setup provisions remote users and clears rate limits, so it is not safe to run against an unidentified production backend. Unit checks are independent.
- Styling is distributed across globals.css, landingStyles/homeStyles/brandUi, feature UI modules and inline Tailwind. No user-selectable dark theme exists; the app explicitly uses light surfaces. Fonts were Inter, Figtree and Space Mono. Surface aliases can be consolidated without changing feature logic.
- Baseline: typecheck passed; 67 test files / 626 tests passed. Working tree initially clean.

## Design decisions

Neutral lavender canvas, white surfaces, dark ink, restrained violet primary and existing lime secondary accent. Inter body and Figtree headings through next/font. 12px controls, 20px cards, subtle shadows, 4px spacing rhythm. Desktop sidebar 236px; mobile keeps accessible existing sheet and bottom navigation. Dashboard content has a maximum width and uses live data only.

Reference descriptions/palettes were accessible at the supplied Dribbble URLs, but the artwork rendered blank in Safari and the direct download returned an empty document. Exact visual fidelity cannot be verified. No reference assets are copied.

## Motion

GSAP + @gsap/react own reusable entrance/stagger/progress animation. ScrollTrigger reveals below-fold sections. React scopes and matchMedia revert animations/triggers on unmount or preference changes. Native scrolling is retained: Lenis would add competing scroll behavior to practice, dialogs and mobile navigation. Motion remains for existing isolated game/panel interactions. Content is visible in server HTML and reduced motion disables entrance movement.

## Implementation coverage

| Screen family | Presentation change | Behavior retained |
| --- | --- | --- |
| Learner shell | Desktop sidebar, grouped navigation, language/profile header; existing mobile sheet and bottom tabs | Prefetch, active-route indication, logout, admin access, zen mode, onboarding chrome |
| Home | Personalized welcome, next-action hero, daily ring, review/curriculum/tutor cards, matching loading silhouette | Real query results, action resolver, first-day guide, daily plan, realtime, quests, personal learning, achievements |
| Curriculum | Responsive lesson cards with visible names, category and completion state | Popover, resume/start server action, level gates, exam links, expand/collapse and jump-to-current |
| Authentication | Shared responsive split-screen shell for login, registration, recovery and MFA | Existing forms, plan intent, validation, authentication and MFA checks |
| Explore, review, tutor, Blitz, history, library, settings, onboarding | Shared surface, typography, button, badge, focus, chart and spacing treatment through existing feature UI modules | Existing layouts and data/interaction contracts; these were not replaced with mock screens |
| Practice | Opaque readable exercise surfaces and consistent action buttons; reduced-motion completion | Answer evaluation, keyboard shortcuts, flashcards, audio hooks and scoring |
| Admin | Shared surfaces and soft selected navigation | All administrative actions, permissions and reports |
| Public and fallback pages | Shared type, cards, controls, focus and reduced motion; GSAP landing reveals | Landing interactions, pricing, signup destinations, legal text and fallback actions |

## Verification

- `npm run typecheck`: passed.
- `npm run lint`: no errors, four existing warnings (two in pre-existing worktree copies, one script, one BillingSettings hook). Final `npm run lint -- src`: no errors, one existing BillingSettings dependency warning.
- `npm test`: 67 files, 626 tests passed before and after changes.
- `npm run build`: passed, including type checking and all 25 static pages. First sandbox attempt failed fetching Google Fonts; a cached Turbopack worker permission error was resolved by moving the generated cache aside. The default builder is unchanged. A diagnostic Webpack attempt failed on the existing sql.js Node imports and was not adopted.
- Existing `landing-premium.spec.ts`: 12/12 passed in desktop and mobile Chrome, using an isolated public-only config without the remote global setup.
- Local browser checks: landing, login, registration, recovery and actual dashboard components at 320, 375, 390, 430, 768, 1024, 1280, 1440, 1920 and 2560px. No horizontal overflow or page errors observed. Dashboard checks use a temporary separate Next application with fixture props and dummy loopback-only backend values; no fixture route or mock data ships in the product.
- Mobile sheet opened/closed with Escape; lesson popover opened; reduced-motion dashboard retained visible content and had zero infinite animations.
- Actual multiple-choice, flashcard reveal/grade and typing components returned correct callbacks in the isolated fixture, with audio requests blocked. No runtime errors observed.
- Computed text-contrast check on dashboard and login identified five small lesson labels below 4.5:1; their colors were corrected and the repeated check found no failing visible text in those two views. This targeted check is not a full WCAG audit.
- Screenshots: `output/premium-audit/`. Dashboard images use fixture data and demonstrate component layout, not a live account.

## Limits

Live authentication, persistence, AI responses, recording/playback, billing and admin mutations were not exercised against the backend. Their server/API/database implementations were not modified. Existing unit tests cover much of the underlying logic, but do not replace authenticated end-to-end testing. No production Core Web Vitals measurements were taken. All screen families inherit the system; individual authenticated pages still require visual acceptance with representative real data. Exact reference fidelity remains unverified because the source artwork could not be rendered. No hosting or deployment settings changed.
