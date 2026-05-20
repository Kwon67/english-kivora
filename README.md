<div align="center">
  <img src="public/images/kivora_banner.png" alt="Kivora English Banner" width="100%" style="border-radius: 12px; margin-bottom: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);" />

  # 📚 Kivora English

  ### A modern PWA for daily English practice, spaced repetition, AI tutoring, and real-time learning duels.
  *Um PWA moderno para treino diário de inglês, revisão espaçada, tutor com IA e duelos de aprendizagem em tempo real.*

  <br />

  <!-- Core Stack -->
  <h4>🚀 Core Tech Stack</h4>

  [![Next.js](https://img.shields.io/badge/Next.js-15_/_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
  [![React](https://img.shields.io/badge/React-19-149ECA?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
  [![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
  [![Supabase](https://img.shields.io/badge/Supabase-Realtime_Auth_DB-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)

  <!-- Features & Validation -->
  <h4>✨ App Features & Validation</h4>

  [![PWA](https://img.shields.io/badge/PWA-Installable-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/explore/progressive-web-apps)
  [![Framer Motion](https://img.shields.io/badge/Framer_Motion-Animations-0055FF?style=for-the-badge&logo=framer&logoColor=white)](https://www.framer.com/motion/)
  [![Groq AI](https://img.shields.io/badge/Groq_AI-Tutor-F55036?style=for-the-badge&logo=groq&logoColor=white)](https://groq.com)
  [![Vitest](https://img.shields.io/badge/Vitest-Unit_Tests-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev)
  [![Playwright](https://img.shields.io/badge/Playwright-E2E-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev)
  [![Vercel](https://img.shields.io/badge/Vercel-Production-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)

  <br />

  🌐 **Live App:** [english-kivora.vercel.app](https://english-kivora.vercel.app) &nbsp;•&nbsp; 💻 **Repository:** [github.com/Kwon67/english-kivora](https://github.com/Kwon67/english-kivora)

</div>

---

## 📖 Overview

> [!NOTE]
> **English:** Kivora English is a focused learning platform built for Brazilian learners who want to practice English in short, consistent sessions. It combines flashcards, listening, speaking, typing, matching games, AI-generated decks, an AI tutor, progress analytics, push reminders, and a competitive Arena mode with real-time duels.
> 
> **Português:** Kivora English é uma plataforma de estudos criada para brasileiros treinarem inglês em sessões curtas e consistentes. O app combina flashcards, escuta, fala, digitação, jogos de associação, packs gerados por IA, tutor com IA, métricas de progresso, lembretes por push e um modo Arena com duelos em tempo real.

## 🌟 Highlights

| Module / Module | 💡 What it does / O que faz |
| :--- | :--- |
| **📅 Daily Practice** | Multi-mode training including flashcards, multiple choice, typing, listening, speaking, and word-matching. |
| **📈 Spaced Repetition** | Smart review scheduler, weak words focus, and retention metrics optimized for long-term memory. |
| **⚔️ Arena Mode** | Competitive multiplayer arena with real-time duels, active streaks, and ghost challenges. |
| **🤖 AI Learning Hub** | Groq-powered contextual tutor that explains vocabulary and generates custom learning decks. |
| **📲 Native-like PWA** | Web App Manifest, background service workers, offline fallbacks, install prompts, and Web Push notifications. |
| **📊 Analytics & Insights** | Interactive progress charts, activity heatmaps, pronunciation analyzer, and dynamic leaderboard rankings. |
| **⚙️ Admin Console** | Management suite for active members, package assignments, arena settings, and detailed system reports. |

## 🛠️ Tech Stack

We utilize a modern, performance-oriented stack to ensure fast interactions and low latency:

| Layer | Tools & Technologies |
| :--- | :--- |
| **Framework** | Next.js (App Router, Server Components first), React 19, Turbopack |
| **Language** | TypeScript (Strict Mode) |
| **Styling & Motion** | Tailwind CSS v4, shadcn/ui components, Framer Motion |
| **Backend & Database** | Next.js API Routes / Server Actions, Supabase (PostgreSQL, Realtime subscriptions) |
| **Auth & Security** | Supabase Auth with Row Level Security (RLS) policies |
| **AI Integration** | Groq API for rapid LLM feedback, custom deck generator engine |
| **Media & Audio** | Custom browser Speech Synthesis & Web Audio APIs |
| **PWA Capabilities** | Custom Service Worker, Web Push Protocol, VAPID key pairs |

---

## 🚀 Developer Portal

<details>
<summary><b>📦 Getting Started & Setup</b> (Click to expand / Clique para expandir)</summary>

### Prerequisites

Make sure you have the following installed:
- Node.js (Latest LTS recommended)
- npm
- A Supabase Project (with DB tables initialized)
- A Groq API Key
- VAPID keys for push notifications

### Installation

```bash
git clone https://github.com/Kwon67/english-kivora.git
cd english-kivora
npm install
```

### Environment Variables

Copy the `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Configure the following variables in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GROQ_API_KEY=your_groq_api_key
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:your_email@domain.com
CRON_SECRET=your_cron_secret_key
```

### Running Locally

To run the development server with **Turbopack**:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

</details>

<details>
<summary><b>📂 Project Structure</b> (Click to expand / Clique para expandir)</summary>

```text
src/
  ├── app/             # Next.js App Router (Layouts, pages, route handlers, server actions)
  ├── components/      # UI components (shadcn buttons, dialogs, cards, game engines)
  ├── hooks/           # Custom React hooks (speech synthesis, sound effects, state controllers)
  ├── lib/             # Core business logic (Supabase clients, AI configurations, push managers)
  ├── store/           # Zustand client-state stores (session variables, arena updates)
  └── types/           # TS definitions (database types & local typings)
public/
  ├── images/          # Static assets & vectors (illustrations, login banner)
  └── sw.js            # Custom PWA Service Worker for cache management & Web Push
supabase/
  └── migrations/      # SQL files containing tables, triggers, and Row Level Security rules
e2e/
  └── support/         # E2E test helpers and config fixtures for Playwright
```

</details>

<details>
<summary><b>📜 Scripts & Quality Gates</b> (Click to expand / Clique para expandir)</summary>

### Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts dev server on Turbopack |
| `npm run build` | Builds production-ready application bundle |
| `npm run start` | Serves the build output locally |
| `npm run lint` | Lints typescript code with ESLint |
| `npm run typecheck` | Validates typescript types strictly |
| `npm run test` | Runs Unit/Integration tests with Vitest |
| `npm run test:e2e` | Runs E2E tests with Playwright |

### Quality Gates

To verify code stability before pushing, run:

```bash
npm run lint
npm run typecheck
npm run build
```

For game engine updates, make sure tests pass:

```bash
npm run test
npm run test:e2e
```

</details>

---

<div align="center">
  <p>Built with focus on fast practice, measurable progress, and a PWA experience that feels at home on mobile.</p>
  <p><i>Criado com foco em prática rápida, progresso mensurável e uma experiência PWA confortável no celular.</i></p>
</div>
