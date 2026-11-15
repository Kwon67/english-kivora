# Reconstrução visual — 11/11/2026

**Estado final:** prevalece a seção “Paleta final restrita” ao final deste relatório, conforme a última instrução do usuário. A paleta de cursos anterior foi substituída pelas seis amostras do print. Capturas finais em `exact-palette/` e `exact-palette-webkit/`. Nesta última revisão: 72 checks Chrome + 72 WebKit sem falhas; axe 11 páginas sem violações detectadas; TypeScript, build e 626 testes passaram; lint com dois avisos preexistentes.

## Antes → depois
- Cartões com borda inferior colorida e controles de trilha com sombra sólida → cartões planos e feedback sem deslocamento do alvo.
- Navegação mobile com grande bloco violeta → texto/ícone violeta e indicador superior fino; dock de 56px mais safe-area e alvos de 44px preservados.
- Quatro métricas de Explorar empilhadas → resumo em uma superfície, 2 colunas mobile / 4 desktop; recomendações compactadas e nível duplicado removido dos cards.
- Painel da home repetindo atalhos da rotina → removido; revisão e Blitz continuam acessíveis na rotina e navegação.
- Títulos de lição de 30px mobile e padding até 40px → título de 24px mobile e padding de 16px; estados e handlers preservados.
- Raios de painel 18–28px → 14–20px; controles internos 10px; ícones Lucide com peso visual 1.5 sem alterar gráficos Recharts.
- Card inteiro amarelo do Tutor, identificado como adaptação excessiva na primeira iteração → superfície branca. Amarelo reservado a badges e indicadores.

## Referência e cores
Ver inventário pré-implementação: `strict-mondly-inventory.md`.

| Token | Valor | Papel / origem |
|---|---|---|
| brand-violet / kivora-action | #6729FF | ações e indicadores; amostra de branding enviada pelo usuário |
| brand-yellow | #FFD027 | pequenos destaques e indicadores; amostra legível da arte de branding |
| brand-orange | #FF812E | progresso diário; amostra legível da arte de branding |
| brand-forest | #446048 | progresso de vocabulário; paleta publicada |
| brand-terracotta | #CB734D | categoria / indicadores; paleta publicada |
| kivora-ink | #111111 | texto e navegação desktop ativa; branding |
| kivora-outline | #AEAFC2 | contornos; paleta publicada |
| kivora-canvas | #F5F6FB | fundo; branding |
| kivora-action-soft | #D6C6FF | roxo claro; branding |
| kivora-surface | #FFFFFF | painéis brancos observados |
| kivora-muted / line / inset | #57566A / #E4E2ED / #F2F2F7 | adaptações de contraste e superfícies neutras |

Demais tons suaves são suportes semânticos para estados/etiquetas, não apresentados como cores originais. A referência mostra navegação superior; não foi inventada uma sidebar. Mantida DM Sans otimizada existente; fonte exata da arte não foi confirmada. Não foram reutilizados logos nem ilustrações Mondly.

## Componentes principais
- `src/app/design-tokens.css`, `globals.css`, `premium.css`, `learning-workspace.css`, `admin-premium.css`: tokens, superfícies, tipografia, navegação, cards e métricas.
- `DashboardOverview.tsx`: hierarquia e remoção do painel duplicado.
- `explore/page.tsx`, `SkillTree.tsx`: resumo, cards, metadados e recomendações.
- `NavbarClient.tsx`: densidade da navegação inferior.
- `GameWrapper.tsx`: proporções de preparação e conclusão de lição.
- `homeStyles.ts`, `adminUi.tsx`: dimensões compartilhadas.
- Consumidores Lucide: normalização de peso e retirada de classes stroke pesadas. CSS `.lucide` garante consistência inclusive em ícones dinâmicos.
- `scripts/audit-ui-responsive.mjs`: suporte ao motor WebKit além de Chromium.

## Verificação e escopo
Os testes visuais renderizam os componentes reais em um aplicativo local separado (`/tmp/kivora-ui-preview`), com dependências de autenticação e banco substituídas por fixtures somente nesse aplicativo temporário. A produção não recebeu dados falsos nem alterações de autorização. Isso valida apresentação; não certifica integrações autenticadas reais.

Matriz: 320, 360, 375, 390, 393, 402, 414, 430, 600, 768, 820, 834, 1024, 1280, 1366, 1440, 1536, 1728, 1920, 2560, 3440px, mais 667×375, 844×390 e 1280×600.

Chrome: 18 rotas × 24 tamanhos, 432 verificações, zero falhas e zero erros de página. WebKit: home, Explorar, lição e dashboard admin × 24 tamanhos, 96 verificações, zero falhas e zero erros de página. Auditoria inclui largura do documento, elementos fora dos limites, controles cortados e colisão da navegação. Screenshots antes/depois e resultados JSON em `output/strict-mondly/`.

Axe: 11 páginas, zero violações WCAG A/AA detectadas na execução registrada. Menu mobile abre e fecha com Escape. GSAP: 2 triggers com movimento normal; 0 ao ativar reduced-motion; 0 triggers ligados a elementos removidos. GSAP, ScrollTrigger e useGSAP preservados. Lenis não instalado: mantida rolagem nativa.

TypeScript passou. ESLint: zero erros, dois avisos anteriores (`scripts/test-adaptive-db.mjs` e `BillingSettings.tsx`). Vitest: 67 arquivos, 626 testes passaram. Build padrão via pnpm encontrou EPERM no processo Turbopack; execução direta do mesmo Next/Turbopack produziu build de produção com sucesso. Tentativa alternativa webpack falhou no import existente de `node:fs` via sql.js/APKG; configuração não foi alterada para contornar esse problema.

## Limitações
- Sem composição mobile oficial: adaptação responsiva, não correspondência pixel a pixel.
- Behance completo bloqueado por HTTP 403; três artes locais inspecionadas.
- WebKit desktop emulado não reproduz o teclado físico do Safari/iPhone; a correção anterior de visualViewport permanece, sem alegar validação em aparelho.
- Sem nova medição de Core Web Vitals de usuários reais, leitor de tela ou zoom nativo 200/400%.
- Não houve deploy nesta etapa.

## Ajuste solicitado durante a revisão
O usuário considerou o azul/violeta dominante. A home passou a usar superfície neutra no cartão principal, mantendo violeta no CTA; os sete blocos de sequência também passaram a neutros com ícones violetas. É uma adaptação expressamente solicitada da distribuição de cor, e não uma mudança nos hexadecimais verificados. Capturas atualizadas em `output/strict-mondly/balanced-home/` e `balanced-home-webkit/` substituem as capturas anteriores da home. As demais telas continuam em `final/`.

## Correção de fonte de verdade — amostra enviada pelo usuário
A imagem de branding enviada às 10h mostra Purple #6729FF, Light purple #D6C6FF, Orange #FF812E, Yellow #FFD027, Gray #F5F6FB e Black #111111. Essa evidência passa a prevalecer sobre a paleta automática publicada na página de cursos. Tokens atualizados: brand-violet/action/grammar-accent #6729FF, action-soft #D6C6FF, canvas #F5F6FB, ink #111111. Hover #5120CC é adaptação. Tons azuis introduzidos em listening, tutor, informação e controles secundários foram substituídos por neutros ou roxo. A tabela principal foi atualizada para refletir essa correção. Capturas atuais das três áreas principais: `output/strict-mondly/brand-corrected/`.

## Paleta final restrita — orientação mais recente
Somente seis swatches cromáticos: #D6C6FF, #6729FF, #FF812E, #FFD027, #F5F6FB e #111111. Essa orientação substitui todos os mapeamentos anteriores. Forest green, terracotta, azul, ciano, rosa e tons auxiliares foram retirados dos tokens. Sucesso/informação usam roxo claro com texto preto; aviso amarelo com preto; erro laranja com preto. Semântica, ícones, mensagens e ARIA permanecem. Bordas/divisores usam transparência do preto, não novas cores de marca. Hover usa preto em vez de outro hexadecimal roxo. Constantes de marca e confetes foram sincronizados. Classes vermelhas de erro migradas para tokens semânticos. Capturas finais: `output/strict-mondly/exact-palette/`.
