<div align="center">

  <img src="public/images/kivora_banner.png" alt="Kivora English" width="100%" />

  # Kivora English

  **PWA moderno para prática diária de inglês — revisão espaçada, tutor com IA e desafios no Blitz.**

  <br />

  [![Live Demo](https://img.shields.io/badge/Demo-english--kivora.vercel.app-1C1915?style=for-the-badge)](https://english-kivora.vercel.app)
  [![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
  [![React](https://img.shields.io/badge/React-19-149ECA?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
  [![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
  [![Supabase](https://img.shields.io/badge/Supabase-Auth_+_DB-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)

  <br />

  [![PWA](https://img.shields.io/badge/PWA-Instalável-5A0FC8?style=flat-square&logo=pwa&logoColor=white)](https://web.dev/explore/progressive-web-apps)
  [![Groq](https://img.shields.io/badge/Groq-Tutor_+_Blitz_IA-F55036?style=flat-square)](https://groq.com)
  [![Vitest](https://img.shields.io/badge/Vitest-Unit-6E9F18?style=flat-square&logo=vitest&logoColor=white)](https://vitest.dev)
  [![Playwright](https://img.shields.io/badge/Playwright-E2E-2EAD33?style=flat-square&logo=playwright&logoColor=white)](https://playwright.dev)
  [![Vercel](https://img.shields.io/badge/Vercel-Deploy-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com)

</div>

---

## Sobre o projeto

**Kivora English** é uma plataforma de estudos voltada a brasileiros que querem evoluir no inglês com **sessões curtas, gamificação e dados reais de progresso**.

A landing page pública apresenta o produto com seções interativas (demo de IA, abas por nível, depoimentos, planos e FAQ). Dentro do app, o aluno pratica com flashcards, escuta, fala, digitação, revisão espaçada (SRS), tutor com IA e o modo **Blitz** — que substituiu o antigo sistema de duelos/Arena por partidas solo rápidas com ranking semanal.

| | |
| :--- | :--- |
| **Demo** | [english-kivora.vercel.app](https://english-kivora.vercel.app) |
| **Repositório** | [github.com/Kwon67/english-kivora](https://github.com/Kwon67/english-kivora) |

---

## Principais recursos

| Módulo | Descrição |
| :--- | :--- |
| **Prática multi-modo** | Flashcard, múltipla escolha, digitação, combinação, listening e speaking em sessões guiadas. |
| **Revisão espaçada (SRS)** | Agendamento inteligente, foco em palavras difíceis e métricas de retenção. |
| **Blitz** | Desafio relâmpago solo com combos, vidas, recordes e ranking semanal. |
| **Blitz IA** | Pack temporário gerado por IA no seu nível CEFR (A1–B2) para cada partida. |
| **AI Tutor** | Conversas com correção contextual via Groq; histórico e missões adaptadas. |
| **Biblioteca & packs** | Decks próprios, packs atribuídos, geração com IA e áudio neural. |
| **Progresso** | Heatmap de atividade, histórico, ranking, streaks e missões diárias. |
| **PWA** | Instalável, offline básico, service worker e notificações Web Push. |
| **Segurança** | Supabase Auth, 2FA/MFA, rate limiting e painel admin. |

---

## Blitz (modo atual)

O **Arena / duelos ao vivo** foi descontinuado. O gamificador principal agora é o **Blitz**:

```text
┌─────────────────────────────────────────────────────────────┐
│  Modo padrão          │  Blitz IA                          │
├───────────────────────┼─────────────────────────────────────┤
│  Partida solo rápida  │  Pack efêmero gerado por IA         │
│  3 vidas              │  Nível CEFR escolhido (A1–B2)      │
│  Modos mistos*        │  Salvar ou descartar ao final      │
│  Combos & multiplicador│  Limite: 10 gerações/dia          │
│  Ranking semanal      │                                     │
└───────────────────────┴─────────────────────────────────────┘
  * múltipla escolha, digitação, combinação, fala, escuta
```

Rotas: `/blitz` · `/blitz/play` · `/blitz/ranking`

---

## Stack técnica

| Camada | Tecnologias |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 |
| **Motion & UI** | Framer Motion, Lucide, componentes neo-brutalistas customizados |
| **Backend** | Server Actions, API Routes, Supabase (PostgreSQL + Auth) |
| **IA** | Groq API (tutor, geração de packs, Blitz IA) |
| **Mídia** | Cloudinary, TTS neural, Web Speech API |
| **Email** | Resend (verificação de cadastro, relatórios) |
| **PWA** | Manifest, Service Worker, Web Push (VAPID) |
| **Qualidade** | ESLint, Vitest, Playwright |

---

## Estrutura do repositório

```text
english-kivora/
├── src/
│   ├── app/                    # Rotas (landing, auth, dashboard, admin)
│   ├── components/
│   │   └── sections/           # Landing page modular (01–15)
│   └── features/
│       ├── blitz/              # Blitz padrão + Blitz IA
│       ├── game/               # Modos de prática (play)
│       ├── review/             # SRS e histórico
│       ├── tutor/              # AI Tutor
│       ├── study/              # Rotina e atribuições
│       └── admin/              # Console administrativo
├── public/                     # Assets estáticos, PWA, imagens
├── supabase/                   # Migrations e SQL
├── e2e/                        # Testes Playwright
└── scripts/                    # Utilitários (migrations, auditorias)
```

---

## Começando localmente

### Pré-requisitos

- Node.js 20+
- Conta [Supabase](https://supabase.com) (URL + anon key + service role)
- Chave [Groq](https://groq.com) para tutor e Blitz IA

### Instalação

```bash
git clone https://github.com/Kwon67/english-kivora.git
cd english-kivora
npm install
cp .env.example .env.local
```

Preencha pelo menos em `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
GROQ_API_KEY=
```

Para Blitz com persistência de scores, aplique a migration:

```bash
npm run db:blitz
```

### Desenvolvimento

```bash
npm run dev        # Next.js + Turbopack em http://localhost:3000
npm run build      # Build de produção
npm run typecheck  # Verificação TypeScript
npm run lint       # ESLint
npm run test       # Vitest (unit)
npm run test:e2e   # Playwright (requer .env.e2e)
```

---

## Rotas principais

| Rota | Descrição |
| :--- | :--- |
| `/` | Landing page pública |
| `/register` · `/login` | Autenticação |
| `/home` | Início do aluno (missões, streak, atalhos) |
| `/review` | Revisão espaçada |
| `/blitz` | Hub do Blitz (padrão + IA) |
| `/tutor` | AI Tutor |
| `/library` · `/study` | Biblioteca e rotina de estudo |
| `/play/[id]` | Sessão de prática multi-modo |
| `/admin` | Painel administrativo |

---

## Deploy

O projeto está configurado para [Vercel](https://vercel.com). Configure as variáveis de ambiente do `.env.example` no painel do projeto. Para e-mail em produção, verifique um domínio no Resend e desative `RESEND_SANDBOX_MODE`.

---

## Contribuindo

1. Faça um fork do repositório
2. Crie uma branch: `git checkout -b feat/minha-feature`
3. Commit: `git commit -m "feat: descrição clara"`
4. Push e abra um Pull Request

---

<div align="center">

  <br />

  **Kivora English** — prática rápida, progresso mensurável, experiência PWA no celular.

  <br /><br />

  Desenvolvido por [Kwon67](https://github.com/Kwon67)

</div>