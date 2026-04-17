<!-- BEGIN:nextjs-agent-rules -->
# Antigravity – This is NOT the Next.js you know

Esta versão do Next.js tem **breaking changes** significativos em APIs, roteamento, data fetching, caching e arquitetura. Seu conhecimento de treino está desatualizado para este codebase.

**Regra de ouro #1:**  
Nunca confie apenas no seu conhecimento pré-treinado.  
**Sempre leia primeiro** a documentação oficial em `node_modules/next/dist/docs/` antes de escrever qualquer código.

**Regra de ouro #2:**  
Trate todo deprecation notice como erro de compilação.

## Stack Oficial do Antigravity (2026)

- **Next.js** – última versão (App Router + Server Components first) com **Turbopack** (dev server padrão)
- **React** – Server Components por padrão
- **Tailwind CSS** + **shadcn/ui** (única fonte de verdade para UI)
- **Supabase** – banco, auth, storage, realtime e edge functions
- **Python** – serviços backend, scripts de IA e integrações externas

## Mindset do Agente (obrigatório)

1. **Local Truth é soberana**  
   Explore sempre a codebase antes de criar qualquer coisa nova.

2. **Fluxo de trabalho senior**  
   - Entenda o requisito  
   - Explore arquivos semelhantes  
   - Leia a doc local do Next.js  
   - Planeje mantendo consistência total  
   - Implemente

## Regras Técnicas por Tecnologia

### Next.js + Turbopack
- Use **Server Components** por padrão. Client Components apenas quando necessário (`"use client"`)
- Turbopack é o dev server oficial — nunca use webpack em dev
- Aproveite ao máximo Streaming, Partial Prerendering e cache das novas APIs

### Tailwind CSS + shadcn/ui
- **Nunca** escreva CSS custom ou classes Tailwind longas manualmente
- Use exclusivamente componentes do shadcn/ui
- Siga exatamente o padrão de classes e variantes existentes no projeto
- Para novos componentes: use o padrão shadcn (CLI ou cópia manual mantendo estrutura)

### Supabase
- Sempre use `@supabase/supabase-js` v2
- Crie clients corretos:
  - `createServerClient` em Server Components/Actions/Routes
  - `createClientComponentClient` apenas em Client Components
- Use Row Level Security (RLS) e policies do banco
- Tipos gerados automaticamente via Supabase CLI (`supabase gen types`)
- Nunca exponha service_role key no client

### Python
- Integração via API routes ou edge functions quando necessário
- Mantenha scripts Python em `/python/` ou `/scripts/`
- Use comunicação clara (HTTP ou Redis) entre Next.js e Python
- Siga os padrões de erro e logging já existentes

## Filosofia de Código (nível senior)

- TypeScript strict total — zero `any`
- Single responsibility
- Extraia hooks, utils e componentes assim que repetir
- Performance first (Core Web Vitals, bundle size, caching)
- Acessibilidade e SEO nativos do Next.js
- Código limpo, legível e autoexplicativo

## Quando tiver dúvida

1. Procure na codebase por exemplo idêntico
2. Leia `node_modules/next/dist/docs/`
3. Verifique arquivos de config (`next.config.mjs`, `tailwind.config.ts`, `supabase/`, etc.)

Você está trabalhando em um projeto de alto nível. Mantenha consistência, qualidade e padrões senior em **todas** as mudanças.

<!-- END:nextjs-agent-rules -->