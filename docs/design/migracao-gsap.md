# Migração de Motion para GSAP

A branch `migracao-motion-para-gsap` parte de `e9783de2`, o commit inicial da `main` limpa. A implementação validada termina em `9131f0d0`. Os 25 arquivos que dependiam da biblioteca foram migrados ou removidos. A instalação do checkout e uma segunda instalação offline com lockfile congelado têm zero ocorrências dos quatro pacotes no grafo e no diretório virtual do pnpm. A auditoria também analisou imports, reexports e chamadas com especificador literal em 780 arquivos de aplicação, configuração e testes. O material de evidência contém o roteiro e os resultados em `resultados/dependencias.json`.

## Landing e acessibilidade

“Seu inglês. Um mundo mais aberto.” mantém as três linhas e um único nome acessível. “Aberto.” ganha uma expansão própria no trecho final de uma timeline de 720 ms, junto do subtítulo e da seta de “Começar grátis”. O HTML entrega a mensagem completa e o link para `/register`. A área clicável permanece fixa. A assinatura de primeira visita cobre a ilustração. Na seção de memória, um único ScrollTrigger coordena a planta e o destaque de “floresce.”.

A inspeção com a fonte retida e após sua liberação cobriu 375, 390, 402, 430, 768, 834, 1024, 1440 e 2560 px. O link funcionou com JavaScript desativado e durante a entrada. Em dois retornos pelo histórico, o pico foi de uma timeline do hero e um gatilho da cena de memória. A contagem total estabilizou em 12 gatilhos no desktop e 11 no WebKit móvel. Ao sair e ao ativar movimento reduzido, a contagem caiu a zero. A inspeção dos tweens ativos encontrou zero alvos DOM desconectados. O CTA aceitou hit-testing nos 123 quadros amostrados no Chromium e nos 117 do WebKit.

## Inventário dos 25 arquivos

“Laboratório” identifica os oito arquivos sem consumidor alcançável a partir das rotas originais. Foram montados com os componentes reais e dados sintéticos.

| Arquivo original | Cobertura | Recurso Motion | Implementação final |
| --- | --- | --- | --- |
| `src/components/layout/MotionProvider.tsx` | Aplicação | LazyMotion / MotionConfig | Provider removido dos layouts. A preferência de movimento é observada por cada animação. |
| `src/components/layout/motionFeatures.ts` | Aplicação | domMax | Carregador exclusivo removido. |
| `src/hooks/useHydratedReducedMotion.ts` | Aplicação | useReducedMotion | matchMedia com useSyncExternalStore e snapshot estável no servidor. |
| `src/components/landing/LandingFAQItem.tsx` | Aplicação | layout="position" / LayoutGroup | Leituras de posições em dois lotes. A timeline desloca as perguntas vizinhas por 220 ms. O controle nativo atende o primeiro toque durante o carregamento. |
| `src/components/auth/LoginSubmitButton.tsx` | Aplicação | whileHover / whileTap | PressButton anima os dois eixos de escala e a posição vertical. |
| `src/app/(dashboard)/home/FirstDayGuide.tsx` | Aplicação | initial / animate / spring | Entrada dos passos com stagger, progresso e marca de conclusão. |
| `src/app/(dashboard)/home/HomeFooter.tsx` | Laboratório | whileInView | IntersectionObserver dispara a entrada uma vez. |
| `src/app/(dashboard)/home/HomeMetricCarousel.tsx` | Laboratório | layoutId / spring | Flip mede o indicador antes da seleção e o move para o novo item. |
| `src/features/review/components/GuidedReviewClient.tsx` | Aplicação | AnimatePresence / wait / gestos | TransitionSlot retém o cartão durante a saída. Gestos cancelados zeram o deslocamento pendente. |
| `src/features/review/components/ReviewModePractice.tsx` | Aplicação | initial / hover / tap | Entrada do painel e resposta dos botões via GSAP. |
| `src/features/review/components/ReviewSessionDetails.tsx` | Aplicação | AnimatePresence / height auto | O painel expande e recolhe antes da desmontagem. |
| `src/features/review/components/ReviewSessionHeader.tsx` | Aplicação | animate / initial | GSAP anima a seta e a barra de progresso. |
| `src/features/game/components/GameWrapper.tsx` | Aplicação | AnimatePresence / wait | Saída do exercício, entrada do próximo e transição dos estados do resultado. |
| `src/features/game/components/Flashcard.tsx` | Aplicação | drag / PanInfo / useMotionValue / useTransform / useAnimation | O gesto fornece distância real. quickSetter controla posição, inclinação, opacidade e dicas. A saída preserva a trava de uma resposta por cartão. |
| `src/features/game/components/PronunciationXRay.tsx` | Aplicação | initial / animate | Altura final presente no HTML. As barras crescem a partir do eixo via scaleY. |
| `src/features/blitz/components/BlitzClient.tsx` | Aplicação | AnimatePresence / wait | A rodada anterior fica inerte até terminar a saída. |
| `src/features/blitz/components/BlitzCountUpNumber.tsx` | Aplicação | animate / useMotionValue | Tween de objeto numérico com atualização do texto e resultado estático em movimento reduzido. |
| `src/features/profile/components/UserPacksManager.tsx` | Aplicação | AnimatePresence / hover / tap | Troca do banner com saída explícita, entrada de formulários e feedback dos botões. |
| `src/features/profile/components/UserPackFoldersOrganizer.tsx` | Aplicação | initial / hover | Entrada dos cards e elevação ao passar o ponteiro, com listeners restritos ao elemento. |
| `src/components/landing/LandingScrollProgress.tsx` | Laboratório | motion.span / animate | quickTo atualiza scaleX. Em movimento reduzido a atualização é direta. |
| `src/components/sections/04TrustBar.tsx` | Laboratório | useMotionValue / useAnimationFrame | Um tween repetido avança 48 px/s. Pausa em hover, foco e aba oculta. ResizeObserver recalcula a distância. |
| `src/components/sections/06AudienceTabs.tsx` | Laboratório | layoutId / spring / AnimatePresence | Flip move a seleção, TransitionSlot troca o painel e os benefícios entram em sequência. |
| `src/components/sections/09TestimonialsCarousel.tsx` | Laboratório | useInView / drag / PanInfo | IntersectionObserver, gestos horizontais e tween do trilho mantêm seleção, limites e autoplay. |
| `src/components/sections/13FAQAccordion.tsx` | Laboratório | height auto / opacity | Tween de altura e opacidade para o painel controlado por teclado. |
| `src/components/ui/ParallaxCard.tsx` | Laboratório | useSpring / useTransform | quickTo em dois eixos de rotação e restauração ao sair do card. |

### Curvas, gestos e desmontagem

| Interação | Referência | Curva GSAP |
| --- | --- | --- |
| Check do primeiro dia | Spring 420/18, rigidez/amortecimento | `elastic.out(1,0.55)`, 520 ms |
| Indicador de métrica | Spring 420/32 | Flip com `back.out(0.28)`, 380 ms |
| Indicador de público | Spring 380/34 | Flip com `back.out(0.08)`, 420 ms |
| Inclinação do card | Dois `useSpring` com parâmetros padrão | `quickTo` com `back.out(0.8)`, 460 ms |
| Retorno do flashcard | Retorno elástico após drag contido | `back.out(0.8)`, 400 ms, elasticidade durante o gesto de 0,8 |

No Blitz, o esqueleto de carregamento dura até a seleção do primeiro modo. Isso impede uma saída de 200 ms de um exercício provisório. A primeira rodada, a saída de uma rodada real e o replay foram exercitados em Chromium e WebKit.

As curvas aproximam a resposta visual. A inclinação do card apresentou pequena diferença durante o movimento. As entradas restantes usam duração, distância e easing próprios de cada componente. O carrossel de depoimentos mantém o deslocamento de 620 ms.

`TransitionSlot` mantém o painel anterior no DOM, inerte durante a saída, e libera a chave seguinte quando o tween termina. Revisão guiada, detalhes da revisão, lições, Blitz, banner da biblioteca e abas de público usam esse ciclo. Flip atende os dois indicadores compartilhados. O FAQ da landing mede a posição das perguntas antes e depois da mudança de estado e só desloca as vizinhas. A altura real das respostas fica disponível à fita durante a transição.

O código reutiliza o registro existente de GSAP e os plugins ScrollTrigger, Flip, SplitText, DrawSVG e ScrambleText nos respectivos consumidores. A integração com Lenis conserva um ticker, e os arquivos Rive continuam responsáveis pelas ilustrações. O arrasto usa `@use-gesture/react` e os feedbacks usam GSAP.

## Dependências e Sanity

| Pacote | Versão original | Destino |
| --- | --- | --- |
| `motion`, `framer-motion`, `motion-dom` | 14.14.0 | Removidos |
| `motion-utils` | 14.7.0 | Removido |
| `next-sanity` | 13.5.1 | Removido |
| `@sanity/client` | 8.16.0 no adaptador | Dependência direta na mesma versão |
| `@sanity/image-url` | 2.2.0 | Mantido |
| GSAP / @gsap/react / Lenis / @use-gesture/react | 3.15.1 / 2.1.2 / 1.3.27 / 10.3.1 | Mantidos |

A comparação semântica dos dois lockfiles identificou 587 resoluções de pacote/versão removidas, incluindo Sanity Studio e as duas resoluções de @sanity/ui que vinham do adaptador. O conjunto final de versões resolvidas já existia na baseline.

O único import de `next-sanity` usado no projeto era uma reexportação de `createClient`. A função exportada pelo adaptador original e a função do cliente eram idênticas. O teste dos módulos de servidor nas duas instalações produziu `null` para ambos os exports sem configuração. Com projeto e dataset sintéticos, preservou a função de consulta, `apiVersion` de 2026-11-01, uso de CDN e URL transformada de imagem. O ensaio dispensou credenciais e chamadas ao CMS.

## Testes comparáveis

| Verificação | Baseline | Final |
| --- | --- | --- |
| TypeScript 6.0.3 e 7.0.2 | Ambos aprovados | Ambos aprovados |
| ESLint | 0 erros, 1 aviso | Mesmo aviso de variável sem uso em `scripts/test-adaptive-db.mjs:48` |
| Vitest completo | 884 passaram, 30 pulados | 884 passaram, 30 pulados |
| Produção, Next 16.4.6 / React 19.3.1 | 39/39 páginas pré-geradas | 39/39 páginas pré-geradas |
| Playwright, rolagem, fita e polimento em quatro perfis | 46 passaram, 2 pulados | 46 passaram, 2 pulados |
| Playwright, hero e landing interativa | 15 passaram, 4 falharam, 1 pulado | 27 passaram, 1 pulado |
| Playwright, visual e paleta | 6 passaram | 6 passaram |
| Playwright, amostra de aprendizagem em três perfis | 21 passaram | 25 passaram, 2 pulados |
| Playwright, fixture de refinamento | 10 passaram, 10 falharam | 10 passaram, as mesmas 10 falharam |
| **Total de casos únicos nessas suítes** | **98 passaram, 14 falharam, 3 pulados** | **114 passaram, 10 falharam, 5 pulados** |

Os quatro erros antigos do hero tinham origem em seletores ambíguos de imagem. As asserções agora identificam o poster da cena de descoberta. O novo teste do Blitz força o primeiro sorteio para combinação e verifica que o único painel inicial é o da rodada escolhida. A fixture de refinamento continua sem os cinco alvos usados pelos testes antigos em cada motor. São `continue-learning`, “Ver meu plano de estudo”, “Revisar” em `.focus-mode`, “A revisão demorou demais.” e “Criar pack”. As falhas ocorrem nos mesmos passos das duas execuções. As verificações adicionais de navegação, formulários e gestos usam fixtures que montam os componentes afetados.

A revisão guiada descartou o cancelamento de +110 px que antes gravava a nota 5. O gesto válido seguinte de +50 px gravou uma única nota 4. Os gestos curtos e verticais deram zero gravações. O teste dedicado de CDP executa em Chromium touch. Um ensaio separado em WebKit móvel percorreu o caminho de eventos de React e @use-gesture/react com eventos DOM sintéticos. No flashcard do jogo, 36 casos antes/depois confirmaram que soltar a ±100 px devolve o cartão ao centro e a ±101 px registra uma única resposta na direção esperada. Cancelar acima do limite também devolve o cartão ao centro na versão final.

## JavaScript inicial e rolagem

Valores em bytes, medidos com o mesmo script nos dois builds de produção. A linha “HTML inicial” soma as tags de script emitidas para a landing. As linhas de rota somam os chunks declarados nos manifestos. As linhas não são aditivas.

| Conjunto | Bruto, antes → depois | Gzip, antes → depois | Diferença gzip |
| --- | ---: | ---: | ---: |
| HTML inicial da landing | 910.476 → 911.276 | 299.711 → 299.901 | +190 |
| Arquivos principais compartilhados | 445.275 → 445.254 | 132.865 → 132.818 | -47 |
| Interseção das rotas do dashboard medidas | 832.942 → 799.748 | 267.493 → 256.144 | -11.349 |
| `/` (manifesto) | 756.766 → 757.570 | 245.986 → 246.185 | +199 |
| `/login` (manifesto) | 925.688 → 773.103 | 295.465 → 241.677 | -53.788 |
| `/home` (manifesto) | 1.169.906 → 1.014.739 | 387.153 → 332.729 | -54.424 |
| `/history` (manifesto) | 1.094.848 → 1.061.662 | 353.083 → 341.753 | -11.330 |
| `/courses` (manifesto) | 1.019.287 → 866.715 | 332.435 → 279.234 | -53.201 |
| `/review` (manifesto) | 1.169.906 → 1.014.739 | 387.153 → 332.729 | -54.424 |
| `/play/[assignmentId]` (manifesto) | 1.123.035 → 984.000 | 371.421 → 321.706 | -49.715 |
| `/blitz/play` (manifesto) | 1.132.217 → 956.150 | 376.737 → 314.804 | -61.933 |
| `/library` (manifesto) | 860.479 → 827.224 | 277.213 → 265.840 | -11.373 |
| `/tutor` (manifesto) | 847.938 → 814.744 | 273.117 → 261.772 | -11.345 |

Na medição por recursos efetivamente solicitados pelo navegador, o JS inicial variou +174 bytes gzip nos quatro perfis. O JS adicional ao percorrer a página caiu de 54.674 para 853 bytes gzip. O FAQ agora carrega seu componente usando o GSAP já disponível.

## Execução no navegador

A amostra usa três ciclos de seis segundos por motor e viewport, percorre toda a landing e volta ao topo. Foram usados Chromium 159.0.8154.6 e WebKit 27.2. Os números abaixo são medianas. A coluna de tempo de tarefas usa `Performance.getMetrics` do Chromium e inclui renderização e execução de scripts na thread principal.

| Perfil | rAF/s antes → depois | p95 entre frames, ms | Tempo de tarefas por ciclo, ms |
| --- | ---: | ---: | ---: |
| Chromium desktop | 60,00 → 60,00 | 16,7 → 16,7 | 540 → 597 |
| Chromium móvel | 60,00 → 60,00 | 16,7 → 16,7 | 1.024 → 1.090 |
| WebKit desktop | 60,01 → 60,00 | 19 → 18 | Indisponível |
| WebKit móvel | 60,00 → 59,83 | 19 → 19 | Indisponível |

A fita acompanhou o scroll em todas as amostras. O Chromium registrou zero Long Tasks e CLS mediano zero durante o scroll. O tempo de script por ciclo subiu cerca de 30 ms no desktop e 60 ms no móvel. Em uma coleta anterior, o tempo total de tarefas em Chromium móvel tinha ficado abaixo da baseline. A variação entre as coletas e a frequência de quadros praticamente estável limitam a conclusão à redução de download durante a rolagem. A série mede callbacks rAF em um computador, sem estimar FPS físico do iPhone, CPU de hardware ou estabilidade da memória em uso prolongado.

## Comparação visual

As capturas de página inteira em movimento reduzido foram idênticas à baseline em 390, 768 e 1440 px. No laboratório, 21 pares conservaram dimensões e quebras de linha. Em 17 pares nenhum pixel diferiu acima de 12 níveis por canal RGB. As maiores diferenças foram os contornos do texto no carrossel em WebKit e o card de parallax em movimento. As 16 barras de pronúncia apareceram nos dois motores. O ensaio da faixa de parceiros mediu aproximadamente 48 px/s nas duas implementações.

As primeiras capturas de login e Blitz foram feitas durante a animação. O login em movimento diferiu em 6,086% dos pixels pelo limiar de 16 níveis em RGB. Com fontes prontas, painéis estabilizados e o mesmo valor do cronômetro, os PNGs de login e Blitz se igualaram byte a byte. Em três trocas de exercício durante a saída do flashcard, cada navegador registrou zero respostas tardias, zero tweens com alvos desconectados e zero ScrollTriggers órfãos.

Os testes móveis emularam o iPhone. Safari 16.4 em hardware físico, integrações com contas reais e um ensaio formal com VoiceOver físico continuam fora da cobertura. A prévia e a fixture usaram dados locais e a verificação de acessibilidade inspecionou a árvore exposta pelo navegador.

## Arquivos de apoio

Além dos 25 arquivos do inventário, a alteração inclui os seguintes arquivos do projeto e este relatório.

- `STACK.md`
- `e2e/landing-hero.spec.ts`
- `e2e/landing-ribbon.spec.ts`
- `e2e/learning-evolution.spec.ts`
- `e2e/learning-fixture.json`
- `next.config.ts`
- `package.json`
- `pnpm-lock.yaml`
- `src/app/(auth)/login/layout.tsx`
- `src/app/(dashboard)/layout.tsx`
- `src/app/globals.css`
- `src/components/landing/JourneyMotion.tsx`
- `src/components/landing/LandingFAQ.tsx`
- `src/components/landing/LandingPolish.module.css`
- `src/components/landing/MindmarketLanding.module.css`
- `src/components/landing/MindmarketLanding.tsx`
- `src/components/motion/PressButton.tsx`
- `src/components/motion/TransitionSlot.tsx`
- `src/components/motion/useEntrance.ts`
- `src/components/motion/useFlipSelection.ts`
- `src/lib/motion-tokens.ts`
- `src/lib/sanity.ts`

## Histórico da implementação

- `a99d90e1` fix(review): discard canceled touch gestures before grading
- `e864ed2f` feat(animation): use scoped GSAP feedback for login and review controls
- `f8dc4e5d` feat(review): sequence GSAP panel exits and guided card entrances
- `6e2cf75a` feat(game): animate flashcard gestures and lesson transitions with GSAP
- `5fb50260` feat(blitz): retain round exits and animate score with GSAP
- `588d6dda` feat(landing): preserve native FAQ handoff and animate row positions with GSAP
- `3a8345ff` feat(landing): choreograph the hero and the memory growth sequence
- `33f9c9e8` feat(library): migrate pack controls and entry feedback to GSAP
- `b1543988` feat(dashboard): preserve guide and metric transitions with GSAP Flip
- `2dfcc228` feat(animation): migrate legacy landing sections and interactive surfaces
- `8d7ea26a` test(landing): cover hero typography, first input and scroll cleanup
- `b410b711` fix(landing): keep actions interactive beneath route snapshots
- `489ce9c1` fix(animation): tween both scale axes for consistent button feedback
- `6bed46c8` refactor(animation): retire Motion providers and runtime configuration
- `7634f130` refactor(deps): use the Sanity client directly and remove Motion from the graph
- `9131f0d0` fix(blitz): mount the selected opening round before starting its transition

## Reprodução e retorno à main

Na branch de migração, a prévia em desenvolvimento usa o lockfile da própria branch. Abra `http://127.0.0.1:3000/` depois de iniciar o servidor.

```sh
pnpm install --frozen-lockfile
pnpm exec next dev --hostname 127.0.0.1 --port 3000
```

O ambiente de comparação usou Node 26.13.1, pnpm 12.21.0, Tailwind CSS 4.3.5 e Playwright 1.65.1. As verificações de compilação, análise estática, testes unitários e tamanho da landing são reproduzíveis com os comandos abaixo. Para os testes de produção, use uma cópia isolada com configuração local de teste. O WebKit requer HTTPS para validar os recursos de um build que envia `upgrade-insecure-requests`. A prévia de desenvolvimento funciona em HTTP local.

```sh
pnpm typecheck:ts6
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm measure:landing-js
pnpm why motion framer-motion motion-dom motion-utils
```

O manifesto em `e2e/learning-fixture.json` materializa uma aplicação sintética. Em uma cópia local isolada, execute os dois primeiros comandos em um terminal. Em outro, a partir da raiz dessa cópia, rode o terceiro. As regressões do cancelamento e da primeira rodada do Blitz estão incluídas na seleção.

```sh
node scripts/prepare-learning-fixture.mjs
pnpm exec next dev output/learning-evolution/fixture --hostname 127.0.0.1 --port 3210

KIVORA_LEARNING_FIXTURE_URL=http://127.0.0.1:3210 pnpm exec playwright test -c e2e/learning-evolution.config.ts learning-evolution.spec.ts -g 'failed review|pending relearning|guided flashcard|failed lesson result|workspace tabs|closing the global menu|Blitz restores|Blitz mounts|canceling a guided swipe'
```

A suíte de rolagem usa `e2e/landing-scroll.config.ts` e a visual usa `tests/visual/playwright.config.ts`. Os roteiros, configurações de teste público, logs, JSON, PNGs e vídeos acompanham o relatório de evidências. Para repetir os roteiros `.cjs` que importam Playwright, copie-os para a raiz da cópia isolada e execute-os junto de seu `node_modules`.

Com `git status --short` vazio, use `git switch main` e `pnpm install --frozen-lockfile`. Para voltar à migração, use `git switch migracao-motion-para-gsap` e reinstale com o lockfile dessa branch. Se houver trabalho novo em andamento, um diretório separado mantém esse trabalho no lugar.

```sh
git worktree add ../english-kivora-main main
```
