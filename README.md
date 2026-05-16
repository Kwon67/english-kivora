<div align="center">

# Kivora English

### A modern PWA for daily English practice, spaced repetition, AI tutoring, and real-time learning duels.

### Um PWA moderno para treino diário de inglês, revisão espaçada, tutor com IA e duelos de aprendizagem em tempo real.

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-149ECA?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Realtime_Auth_DB-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Vercel-Production-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)

[![PWA](https://img.shields.io/badge/PWA-Installable-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/explore/progressive-web-apps)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-Animations-0055FF?style=for-the-badge&logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![Groq](https://img.shields.io/badge/Groq-AI_Tutor-F55036?style=for-the-badge&logo=groq&logoColor=white)](https://groq.com)
[![Vitest](https://img.shields.io/badge/Vitest-Unit_Tests-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev)
[![Playwright](https://img.shields.io/badge/Playwright-E2E-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev)

**Live app:** [english-kivora.vercel.app](https://english-kivora.vercel.app)<br />
**Repository:** [github.com/Kwon67/english-kivora](https://github.com/Kwon67/english-kivora)

</div>

---

## Overview

**English:** Kivora English is a focused learning platform built for Brazilian learners who want to practice English in short, consistent sessions. It combines flashcards, listening, speaking, typing, matching games, AI-generated decks, an AI tutor, progress analytics, push reminders, and a competitive Arena mode with real-time duels.

**Português:** Kivora English é uma plataforma de estudos criada para brasileiros treinarem inglês em sessões curtas e consistentes. O app combina flashcards, escuta, fala, digitação, jogos de associação, packs gerados por IA, tutor com IA, métricas de progresso, lembretes por push e um modo Arena com duelos em tempo real.

## Highlights

| Area | What it does |
| --- | --- |
| Daily practice | Flashcards, multiple choice, typing, listening, speaking, and matching modes. |
| Spaced repetition | Review queue with scheduling, due cards, weak words, and retention-focused practice. |
| Arena mode | Real-time duels, live progress, ghost challenges, streak powers, and competitive feedback. |
| AI learning | Groq-powered tutor, smart review context, and AI deck generation. |
| PWA experience | Installable app shell, service worker, offline fallback, push notifications, shortcuts, and update prompts. |
| Admin tools | Member management, pack creation, assignment workflows, reports, and arena setup. |
| Analytics | History, rankings, retention insights, skill radar, activity heatmap, and pronunciation x-ray. |

## Tech Stack

| Layer | Technologies |
| --- | --- |
| App framework | Next.js App Router, React Server Components, Turbopack |
| Language | TypeScript strict mode |
| UI | Tailwind CSS, shadcn-style component patterns, Lucide icons, Framer Motion |
| Backend | Next.js Route Handlers, Server Actions, Supabase |
| Data | Supabase Postgres, Auth, Storage, Realtime, RLS policies |
| AI | Groq chat completions, AI deck generation, tutor flows |
| Audio | Text-to-speech previews, pronunciation and speech practice flows |
| PWA | Web App Manifest, custom service worker, Web Push, install prompts |
| Quality | ESLint, TypeScript, Vitest, Playwright |
| Deployment | Vercel |

## PWA Capabilities

Kivora is designed to feel close to a native app:

- Installable from supported mobile and desktop browsers.
- Standalone display mode with app shortcuts for Review, Arena, and Tutor.
- Service worker with cached app assets and offline fallback.
- Push notifications for due reviews.
- Safe update prompt when a new version is ready.
- Network status feedback for offline and restored connections.
- Mobile-first layout with safe-area support.

## Getting Started

### Prerequisites

- Node.js compatible with the project toolchain
- npm
- Supabase project credentials
- Groq API key
- Vercel account for production deployment

### Install

```bash
npm install
```

### Environment

Create a local environment file:

```bash
cp .env.example .env.local
```

Required production-oriented variables include:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=
CRON_SECRET=
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js dev server with Turbopack. |
| `npm run build` | Build the production app. |
| `npm run start` | Start the production server locally. |
| `npm run lint` | Run ESLint. |
| `npm run typecheck` | Run TypeScript without emitting files. |
| `npm run test` | Run Vitest unit tests. |
| `npm run test:e2e` | Run Playwright end-to-end tests. |

## Project Structure

```text
src/
  app/                 Next.js App Router routes, layouts, actions, and APIs
  components/          Shared UI and game components
  hooks/               Browser and audio hooks
  lib/                 Supabase, AI, review, arena, push, and utility logic
  store/               Client-side state stores
  types/               Generated Supabase and app types
public/
  images/              Static illustrations and visual assets
  sw.js                Custom service worker for PWA behavior
supabase/
  migrations/          Database schema, RLS, triggers, and feature migrations
e2e/
  support/             Playwright test helpers and fixtures
```

## Quality Gates

Before shipping changes, run:

```bash
npm run lint
npm run typecheck
npm run build
```

For game and workflow changes, also run:

```bash
npm run test
npm run test:e2e
```

## Deployment

The app is deployed on Vercel from the `main` branch.

Production URL:

[https://english-kivora.vercel.app](https://english-kivora.vercel.app)

## Notes

- This project uses Supabase Row Level Security, so database behavior depends on migrations and policies being applied correctly.
- Push notifications require valid VAPID keys in the deployment environment.
- The app uses Server Components by default and Client Components only for interactive browser behavior.

---

<div align="center">

Built with focus on fast practice, measurable progress, and a PWA experience that feels at home on mobile.

Criado com foco em prática rápida, progresso mensurável e uma experiência PWA confortável no celular.

</div>
