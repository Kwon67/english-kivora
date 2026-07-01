## E2E

Variáveis esperadas para a suíte Playwright:

- `E2E_ADMIN_LOGIN`
- `E2E_ADMIN_PASSWORD`
- `E2E_MEMBER_LOGIN`
- `E2E_MEMBER_PASSWORD`
- `E2E_MEMBER_USERNAME`
- `PLAYWRIGHT_BASE_URL` opcional

Execução:

```bash
npm run test:e2e:install
npm run test:e2e
```

### Onboarding (layout + fluxo)

A suíte `e2e/onboarding-cohesion.spec.ts` valida coesão visual em **desktop** e **mobile** (overflow horizontal, chrome do wizard, passos 1–3 e placement).

Pré-requisito para o fluxo completo (skip → home): migration `user_onboarding` aplicada no Supabase.

```bash
# Com dev server rodando em localhost:3000
PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test e2e/onboarding-cohesion.spec.ts

# Se a tabela ainda não existir no banco remoto:
node scripts/apply-onboarding-migration.mjs
```

Usuário E2E dedicado (criado automaticamente): `pw_onboarding` / `playwright.onboarding@kivora-e2e.test`
