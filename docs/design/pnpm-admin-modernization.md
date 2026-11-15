# Kivora — pnpm migration and admin design audit

> Visual update: the actual reference artwork was subsequently retrieved and inspected. The current navigation and composition are documented in [Mondly fidelity](mondly-fidelity.md). This report preserves the earlier audit and validation history.

Completed locally on November 10, 2026. No deployment or production-data changes.

## Repository audit and migration strategy

The starting project used Next.js 16.3.1 App Router, React 19.2.8, strict TypeScript, Tailwind 4.3.3, npm 11.19.1 and one root package-lock.json. Node was 26.8.2; the globally available pnpm was 10.34.9. The app uses Supabase Auth/Postgres/Realtime, server actions and route handlers, Zustand, local storage, existing Motion interactions, GSAP 3.15.1 and @gsap/react 2.1.2. Lenis was absent.

The inspected admin routes are overview, members, member details, packs, assignments, and reports. AI generation remains at /generate and profile/settings at /settings, using the existing dashboard shell. There are no separate admin course, vocabulary, or system-settings routes to invent. Packs contain the existing card/vocabulary workflows. No repository CI workflow or Dockerfile was found. Vercel configuration contained cron schedules.

The migration was performed in stages: import and frozen-install the old lockfile; compare every direct version; run baseline type checking and tests; update the framework; validate; update used UI/service packages; validate; refresh vulnerable transitives within their declared ranges; audit the admin UI; verify the final build and browser behavior.

## Package-manager migration

- Final package manager: **pnpm 12.18.0**, verified as the stable registry tag. pnpm 12 compatibility and import behavior were checked against its current documentation. Node 26.8.2 satisfies its engine requirement. The application now declares Node >=22.12.0; only Node 26.8.2 was executed here.
- Imported package-lock.json with pnpm import. Compared the imported direct resolutions with a saved baseline: **zero version differences**. The initial frozen installation, both compile surface and existing tests, succeeded before dependency updates.
- Removed package-lock.json after this validation. pnpm-lock.yaml is the sole project lockfile. packageManager pins the exact pnpm release. The normal globally installed pnpm command successfully selected 12.18.0 from that pin.
- Existing security overrides were transferred to pnpm-workspace.yaml. Reviewed native build installers are explicitly allowed; core-js's informational install hook is denied. No blanket build-script permission was added.
- The latest registry tags for Lucide, PostHog, Resend and sql.js were newer than pnpm's initial age-filtered inventory. These stable releases were selected explicitly and validated. pnpm recorded version-scoped release-age exceptions for those packages and their three PostHog dependencies; no global release-age bypass was enabled.
- Removed unused patch-package and its empty postinstall hook (the patches directory contained no patches). Moved the shadcn CLI to devDependencies; generated shadcn components remain unchanged in architecture. Added tsx as a local devDependency for existing scripts, replacing runtime npx downloads.
- Updated Playwright's dev-server command, current operation-script examples, e2e instructions and README. Historical audit logs retain their originally executed npm commands as evidence.
- vercel.json now explicitly uses pnpm install --frozen-lockfile and pnpm build. Existing cron schedules are unchanged. No hosted settings were changed; if a deployment uses an older package-manager override, enable Vercel Corepack for the packageManager pin as documented in README. Vercel deployment was not executed.

## Dependency versions

32 existing direct packages changed version (31 upgrades and one compatibility downgrade), plus the local tsx runner. Versions below are installed resolutions, not just manifest ranges.

| Package | Before | After |
| --- | --- | --- |
| @radix-ui/react-tooltip | 1.2.16 | 1.4.1 |
| @supabase/auth-js | 2.112.3 | 2.119.0 |
| @supabase/ssr | 0.12.4 | 0.12.7 |
| @supabase/supabase-js | 2.112.3 | 2.119.0 |
| jspdf-autotable | 5.0.8 | 5.0.9 |
| jszip | 3.10.1 | 3.10.2 |
| lottie-react | 3.1.0 | 3.1.2 |
| lucide-react | 1.33.0 | 1.71.0 |
| motion | 13.1.0 | 13.5.1 |
| next | 16.3.1 | 16.4.6 |
| node-edge-tts | 1.2.10 | 1.2.12 |
| posthog-js | 1.418.4 | 1.447.10 |
| radix-ui | 1.6.7 | 1.8.1 |
| react | 19.2.8 | 19.3.1 |
| react-dom | 19.2.8 | 19.3.1 |
| resend | 6.20.0 | 6.38.0 |
| sql.js | 1.14.2 | 1.16.0 |
| tailwind-merge | 3.6.0 | 3.7.0 |
| zod | 4.4.3 | 4.6.7 |
| zustand | 5.0.15 | 5.1.0 |
| @playwright/test | 1.62.1 | 1.65.0 |
| @tailwindcss/postcss | 4.3.3 | 4.3.5 |
| @types/node | 26.2.0 | 26.6.6 |
| @types/react | 19.2.18 | 19.3.0 |
| @types/react-dom | 19.2.4 | 19.3.0 |
| eslint | 10.8.1 | 9.39.5 |
| eslint-config-next | 16.3.1 | 16.4.6 |
| shadcn | 4.18.0 | 4.23.0 |
| sharp | 0.35.3 | 0.35.5 |
| supabase | 2.115.0 | 2.122.1 |
| tailwindcss | 4.3.3 | 4.3.5 |
| tsx | — | 4.23.15 |
| vitest | 4.1.11 | 4.1.12 |
| patch-package | 8.0.1 | Removed; no patches exist |

Unchanged: `@gsap/react` 2.1.2, `@react-email/components` 1.0.12, `@use-gesture/react` 10.3.1, `canvas-confetti` 1.9.4, `class-variance-authority` 0.7.1, `clsx` 2.1.1, `gsap` 3.15.1, `jspdf` 4.2.1, `recharts` 3.10.1, `server-only` 0.0.1, `sonner` 2.0.8, `ts-fsrs` 5.4.1, `tw-animate-css` 1.4.0, `web-push` 3.6.7, `@types/canvas-confetti` 1.9.0, `@types/sql.js` 1.4.11, `@types/web-push` 3.6.4, `@typescript/native` 7.0.2, `typescript` 6.0.3.

Supabase client packages are pinned exactly; the lockfile pins the entire dependency graph. Compatible transitive updates include DOMPurify, Vite, source-map-js, fast-uri, ip-address, systeminformation, baseline-browser-mapping, brace-expansion and browser data.

## Updates intentionally deferred

- ESLint 10.14.0: the installed React/import/JSX-accessibility plugins declare support through ESLint 9. ESLint 9.39.5 resolves those peer conflicts and allows the React rules previously disabled for ESLint 10 API incompatibility to run again. Do not force ESLint 10 until those plugins support it.
- TypeScript 7 as the primary compiler: the project already runs 7.0.2 through its @typescript/native alias. Retained TypeScript 6.0.3 for the Next/editor compiler API and the separate compatibility check. Both checks passed.
- Motion 14.12.0: retained the newest compatible 13.x release for the existing game/gesture interactions; a major migration is unnecessary for GSAP entrances and has not been validated across every live exercise flow.
- ts-fsrs 6.0.0: changes the learning scheduler's major version and requires Node 24. Kept 5.4.1 to preserve persisted learning behavior.
- web-push 4.0.0: retained 3.6.7 because delivery/provider behavior was outside the isolated browser validation; no live push notifications were sent.
- Supabase CLI 3.1.0: its migration changes default targets, hosted-operation confirmation and removed commands. Updated within v2 to 2.122.1. No database migration was executed.
- Vitest 5.1.0: retained patched 4.1.12 and refreshed Vite. v5 changes default mock clearing and other test semantics; there is no need to change those semantics for this frontend migration.
- @react-email/components 1.0.12 is the latest registry version but deprecated. Existing email templates still use it; replacing the email-rendering architecture was intentionally deferred.
- GSAP 3.15.1 and @gsap/react 2.1.2 already matched the stable registry versions. Recharts, utilities and remaining unchanged packages did not require a compatible upgrade.

## Admin visual transformation

Shared student tokens, Inter/Figtree typography, lavender/off-white surfaces, rounded cards, restrained borders, violet actions and green accents now shape every admin screen. The sidebar shares the student's 236px desktop / 256px ultrawide proportions, with a Radix drawer on mobile. The authenticated username stays server-provided; profile and logout use existing routes/actions.

| Route | Implemented changes |
| --- | --- |
| /admin/dashboard | Compact shared heading, pastel metrics, softer cards, purple progress, keyboard-scrollable table and mobile guidance |
| /admin/members | Shared heading, stronger primary action, larger filter/action targets, accessible search/pressed states and member dialog |
| /admin/members/[userId] | Server-renderable header (fixes the icon serialization failure found in browser QA), consistent width, profile/card spacing, accessible session-table region |
| /admin/packs | Shared heading and metrics, aligned forms and import/create panels, voice/CEFR labels, readable choice-card descriptions |
| /admin/assign | Shared heading, consistent controls, explicit form labels, keyboard-focusable exercise modes and weekdays, larger weekday targets |
| /admin/reports | Shared heading, balanced eight-metric grid, consistent report surfaces, PDF colors aligned with the app |
| Admin loading states | Shared skeleton variant matching the compact heading, metrics and table hierarchy |

Important files: src/app/admin-premium.css; src/app/(admin)/layout.tsx; src/components/layout/AdminChrome.tsx, AdminSidebarClient.tsx and AdminSidebarNav.tsx; src/features/admin/components/AdminSectionHeader.tsx and AdminMotion.tsx; the admin UI token modules; all five route header components; members table/dialog/detail components; packs and assignment form markup; ExportReportButton.tsx; PageLoadingSkeleton.tsx; package.json, pnpm-workspace.yaml, pnpm-lock.yaml, eslint.config.mjs, playwright.config.ts, vercel.json and README.md.

## Motion and preserved behavior

Admin entrances now use the existing scoped GSAP/useGSAP MotionSurface. Static AdminMotionItem children no longer add a competing Motion transform. Dense admin panels appear without waiting for scroll; progress fills use registered ScrollTrigger. Student/landing section reveals continue using ScrollTrigger. matchMedia and useGSAP cleanup respect reduced motion and route changes.

Repeated client navigation returned to the same trigger count with zero detached trigger elements. Reduced motion produced zero triggers, zero infinite animations and no hidden headings. No Lenis was added: native page, table, dialog and mobile scrolling remains appropriate. Existing Motion remains for isolated learning interactions.

The AdminChrome getUser/profile.role check and all route/action authorization logic remain intact. No business rules, API contracts, database schema, records, progress calculations, exercise evaluation, audio synthesis or persistence handlers were changed. The only functional repair found by visual QA was the member-detail header's unnecessary client boundary. UI controls still call their existing handlers.

## Validation

- Baseline frozen import: direct versions unchanged; typecheck and 626 tests passed.
- Framework group: typecheck, lint, 626 tests and production build passed.
- Service/UI group and final dependencies: 67 test files / **626 tests passed**; **pnpm peers check: no issues**.
- TypeScript 7 alias and TypeScript 6 checks passed.
- ESLint: zero errors, two existing warnings (BillingSettings effect dependency and an unused script parameter). React rules disabled only for the previous ESLint 10 incompatibility were restored.
- pnpm audit:colors and pnpm audit:contrast passed. These are source checks, separate from browser contrast checks.
- Final production build: passed with the default Turbopack builder and static-page generation.
- pnpm start: local production server started successfully. /login returned 200; unauthenticated /home and the five main admin routes returned 307 to /login.
- Final pnpm install --frozen-lockfile: passed. A sandbox-only repeat could not access the global store and hit blocked registry DNS; rerunning with normal store/network access restored the same frozen dependency tree, and type checking passed again. tsx, Supabase CLI and Playwright resolve and report their versions through pnpm.
- Browser matrix: **56 checks** (student dashboard plus six admin routes at 375, 390, 430, 768, 1024, 1280, 1440 and 1920px). No page overflow or runtime/hydration errors observed.
- Actual repository admin pages were rendered using a temporary fixture-only Supabase/action adapter in /tmp. All writes were disabled; no auth bypass or fixture route was added to the shipped application. Student preview uses real presentation components with fixture data.
- Browser interactions passed: drawer open/Escape, member search/role filters/empty state, member dialog/password visibility/Escape, pack create/import panels, PDF download, and keyboard exercise-mode selection. Actual create/delete/assignment operations were not submitted.
- Automated axe WCAG A/AA checks passed for six admin main regions at mobile width and expanded member dialog, navigation drawer, create/import panels and timed-assignment form. This is a scoped automated check, not a complete accessibility certification.
- Public production-page Playwright: **12 tests passed** across desktop/mobile. Results and final visual artifacts are recorded in output/admin-audit. The account-provisioning global setup was excluded.

## Security results and limitations

The initial pnpm audit reported 93 advisory findings, including 7 critical and 30 high. Final full-tree audit: **one moderate, one low; zero high or critical**. Production-only audit: **one low; zero moderate/high/critical**. Audit commands return nonzero while advisories remain; they are not reported as clean passes.

- deepmerge 4.3.1, low: upstream has no patched version. It remains under email HTML-to-text rendering (and development shadcn tooling). Advisory: https://github.com/advisories/GHSA-gcqx-w48m-w2h4.
- minimatch 10.2.6, moderate, development tooling: patched v11 removes makeRe, AST and other APIs, so a broad forced major override would be unsafe for consumers. The inherited v10 security override remains pending an upstream-compatible tooling migration. Advisory: https://github.com/advisories/GHSA-g3hv-75wg-m249.

Authenticated live student/admin sessions, role-denied signed-in users, external audio/speech, AI, email, push delivery and real-time production updates were not exercised. Database/seed/provider scripts were migrated to pnpm command resolution but deliberately not run against production. Full e2e setup provisions accounts and needs a dedicated test backend. No field Core Web Vitals measurements or hosted Vercel deployment were performed. The Vitest config still emits its pre-existing warning about future native config loading.

## Artifacts and references

- Dependency inventory: ../../output/admin-audit/dependency-versions.json
- Responsive/motion evidence: ../../output/admin-audit/responsive-results.json
- Accessibility evidence: ../../output/admin-audit/accessibility-results.json and panel-accessibility-results.json
- Student reference capture: ../../output/admin-audit/home-1440.png
- Admin overview: ../../output/admin-audit/admin-dashboard-1440.png and admin-dashboard-390.png
- Remaining routes: corresponding admin-members, admin-packs, admin-assign, admin-reports and admin-members-member-0 captures in the same directory.
- Fixture PDF export: ../../output/admin-audit/fixture-report.pdf

Reference docs inspected: [pnpm import](https://pnpm.io/cli/import), [pnpm 12 migration](https://pnpm.io/migration-v11), [pnpm settings](https://pnpm.io/settings), [Next 16.4.6 release](https://github.com/vercel/next.js/releases/tag/v16.4.6), [Supabase JS release](https://github.com/supabase/supabase-js/releases/tag/v2.119.0), [Supabase changelog](https://supabase.com/changelog.md), [Vercel package managers](https://vercel.com/docs/package-managers), [Vitest migration](https://vitest.dev/guide/migration/), [minimatch changelog](https://github.com/isaacs/minimatch/blob/main/changelog.md).
