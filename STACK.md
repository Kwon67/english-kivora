# Animação da landing Kivora

## Linha de base

O commit `169ed13a` contém o manifesto original (`git show 169ed13a:package.json`). O projeto usa pnpm 12.21.0, Next 16.4.6, React e React DOM 19.3.1, Tailwind 4.3.5 e Playwright Test 1.65.1. A rota pública monta MindmarketLanding. As imagens de referência em tests/visual/baseline vêm do build de produção desse commit.

| Elementos que aparecem em / | Motor e comportamento inicial |
| --- | --- |
| Título e texto de abertura | GSAP sobre três trechos com recorte CSS, entrada de 105% e rotação de 3°, 1,05 s, stagger 0,1 s, power4.out. O restante entra de 24 px em 0,8 s após 0,15 s. |
| Seções e grupos interativos | ScrollTrigger a 96% da janela, entrada única de 48 px e opacidade em 0,8 s. Grupos com controles só alteram opacidade, foco conclui a entrada. |
| Hero e cenas | Parallax no hero em telas maiores. Entrada das três cenas de 75% até 100% em 1,75 s com elastic.out, fade de 0,2 s. Deslocamento e rotação de imagens, ornamentos e objetos acompanham o scroll. Cards começam em escala 0,78. |
| Ilustrações | Posters JPEG XL/AVIF cobertos pelas três animações locais .riv. @rive-app/canvas aguarda a pintura do poster e o tempo ocioso, pausa fora da janela e usa poster em movimento reduzido. |
| Ornamentos e rodapé | GSAP em loops visíveis, ilustrações e motivos em 2,4 s, etiquetas em 3,2 s com sine.inOut. Faixa contínua do rodapé em 28 s. |
| Fita e sublinhado | A fita SVG acompanha um playhead de ScrollTrigger no desktop. A geometria respeita os conteúdos durante redimensionamento e expansão do FAQ. Fita completa e estática no toque ou movimento reduzido. DrawSVG desenha o sublinhado final em 1 s. |
| Navegação | Lenis 1.3.27 em ponteiro fino sem redução, ligado ao ticker GSAP e ao ScrollTrigger. Âncoras preservam foco e histórico. Menu modal desliza em 0,66 s e fecha em 0,32 s, com entradas escalonadas. |
| Controles | GSAP abre/fecha respostas do FAQ com opacidade (0,22 s), troca níveis e prática (0,5 s) e mostra questão/feedback (0,4/0,3 s). CSS controla hover, setas, estados de botões, sombra do plano e empilhamento responsivo. |
| Navegação entre rotas | Links e roteador do App Router. |
| 3D e outros runtimes | A composição usa imagens, SVG e Rive 2D. Não há GLB, shader, física, Lottie, Spline ou Unicorn montado em /. |

O teste visual usa Chromium 159.0.8154.6, DPR 1, pt-BR, movimento reduzido e página inteira após carregar as fontes e decodificar as imagens. Viewports de 390×844, 768×1024 e 1440×900. Com o build servido em 127.0.0.1:3100, use `pnpm test:visual`. O complemento visual substituiu o limite de diferenças por imagens lado a lado e auditoria da paleta. As referências originais ficam congeladas.

O HTML de produção carrega inicialmente 17 scripts Next, 849.372 bytes, 275.669 bytes gzip (soma dos arquivos comprimidos individualmente). Lighthouse 13.6.0 mobile com throttling simulado, perfil Chromium limpo em cada uma das três execuções, localhost. Performance 85/87/86, LCP 4.315/4.065/4.212 ms e CLS zero nas três. As comparações usam a mediana de cada indicador.


## Referências de 2026

O Awwwards lista GSAP, Three.js e Next.js na ficha de *197 Historias Ilustradas*, Site of the Day em 20 de novembro de 2026. A ficha de *Carter Ogunsola*, premiado em 19 de novembro, lista GSAP e WebGL. Os demais runtimes desta landing atendem ao stack especificado no projeto. [197 Historias Ilustradas](https://www.awwwards.com/sites/197-historias-ilustradas) · [Carter Ogunsola](https://www.awwwards.com/sites/carter-ogunsola)

## Manifesto e versões

As versões abaixo são as resolvidas pelo pnpm. As dependências diretas fora desta tabela mantêm os intervalos do manifesto original. O arquivo pnpm-lock.yaml fixa a árvore completa.

| Dependência direta | Antes | Depois | Uso |
| --- | --- | --- | --- |
| `next` | 16.4.6 | 16.4.6 | Base |
| `react` | 19.3.1 | 19.3.1 | Base |
| `react-dom` | 19.3.1 | 19.3.1 | Base |
| `tailwindcss` | 4.3.5 | 4.3.5 | Base · dev |
| `@tailwindcss/postcss` | 4.3.5 | 4.3.5 | Base · dev |
| `babel-plugin-react-compiler` | — | 1.0.0 | Base · dev |
| `@playwright/test` | 1.65.1 | 1.65.1 | Base · dev |
| `gsap` | 3.15.1 | 3.15.1 | Coreografia e scroll |
| `@gsap/react` | 2.1.2 | 2.1.2 | Coreografia e scroll |
| `lenis` | 1.3.27 | 1.3.27 | Coreografia e scroll |
| `motion` | 14.14.0 | 14.14.0 | Coreografia e scroll |
| `@rive-app/canvas` | 2.51.0 | 2.51.0 | Ilustrações e embeds |
| `@rive-app/react-canvas` | — | 4.39.0 | Ilustrações e embeds |
| `@lottiefiles/dotlottie-react` | — | 0.22.3 | Ilustrações e embeds |
| `@lottiefiles/dotlottie-web` | — | 0.83.2 | Ilustrações e embeds |
| `@splinetool/react-spline` | — | 4.2.0 | Ilustrações e embeds |
| `@splinetool/runtime` | — | 2.0.196 | Ilustrações e embeds |
| `unicornstudio` | — | 2.6.0 | Ilustrações e embeds |
| `three` | — | 0.187.0 | Cena e física |
| `@types/three` | — | 0.187.0 | Cena e física · dev |
| `@react-three/fiber` | — | 9.8.2 | Cena e física |
| `@react-three/drei` | — | 10.7.9 | Cena e física |
| `@react-three/postprocessing` | — | 3.2.2 | Cena e física |
| `postprocessing` | — | 6.39.6 | Cena e física |
| `@react-three/rapier` | — | 2.2.0 | Cena e física |
| `leva` | — | 0.10.1 | Cena e física |
| `@theatre/core` | — | 0.7.2 | Timeline |
| `@theatre/r3f` | — | 0.7.2 | Timeline |
| `@theatre/studio` | — | 0.7.2 | Timeline · dev |
| `@gltf-transform/cli` | — | 4.5.1 | Pipeline GLB · dev |
| `@gltf-transform/functions` | — | 4.5.1 | Pipeline GLB · dev |
| `meshoptimizer` | — | 1.3.0 | Pipeline GLB |
| `draco3dgltf` | — | 1.5.9 | Pipeline GLB |
| `next-sanity` | — | 13.5.1 | CMS opcional |
| `@sanity/image-url` | — | 2.2.0 | CMS opcional |

### Compatibilidade

- Next e React já estavam nas versões estáveis solicitadas. O Tailwind já estava na série 4. O React Compiler usa `compilationMode: "annotation"` e a diretiva `"use memo"` no explorador de níveis.
- Nenhuma dependência direta foi removida. O projeto já usava `motion/react` e Lenis. Motion traz `framer-motion` transitivamente. O player dotLottie usa o pacote distinto `@lottiefiles/dotlottie-web`. A landing usa o adaptador React do Rive e continua servindo o WASM da mesma origem. O override restrito ao adaptador mantém o canvas e o binário em 2.51.0.
- Theatre R3F 0.7.2 declara Fiber 8 como peer. O projeto usa uma única instalação de Fiber 9.8.2. O ensaio com `SheetProvider` e `editable.mesh` montou um objeto Theatre junto de um material TSL e uma textura comprimida. A compatibilidade oficial do adaptador com toda a API do Fiber 9 continua em aberto.
- O perfil CSP específico de `/` permite WASM, workers locais/blob dos decoders e leitura de projetos publicados em assets.unicorn.studio. A política das outras rotas mantém seus valores anteriores. A configuração do compilador está no arquivo central do Next.

## Componentes e composição

| Entrada | Como usar |
| --- | --- |
| `lib/gsap.ts` | Importe `gsap`, `useGSAP`, `ScrollTrigger`, `SplitText` ou `Flip` deste módulo em um cliente. ScrollTrigger, SplitText, Flip, ScrambleText, CustomEase e DrawSVG são registrados no navegador. Aguarde `loadInteractionPlugins()` para Observer, Draggable, Inertia e MorphSVG. |
| `lib/motion-tokens.ts` | Durações em segundos e curvas compartilhadas entre GSAP e Motion. O FAQ carrega LazyMotion com domAnimation e a projeção de layout somente quando se aproxima da tela. |
| `JourneyMotion`, `LandingLenis`, `JourneyRibbon` | O contêiner de `/` controla SplitText por linha, interações do ponteiro, loops visíveis e ViewTransition. Lenis React usa o ticker do GSAP somente em ponteiro fino com movimento permitido. A onda é um único path com DrawSVG e scrub. Com movimento reduzido, o caminho inteiro fica visível. |
| `JourneyRive` | Passe `src`, um poster como filho e, quando o arquivo oferecer uma máquina de estados, `stateMachine`. O poster entra no HTML. O canvas carrega após decodificação e tempo ocioso, pausa ao sair da janela e libera a instância pelo hook do Rive. Os três arquivos atuais animam os ornamentos. Os personagens e o globo permanecem nas artes originais. Piscar e acenar exigiriam um rig separado. |
| `scenes/LandingScene` | Passe `src` (GLB), `label`, `style` com dimensões e um `fallback` estático. Também aceita filhos R3F. O Canvas carrega quando entra na tela, inicializa WebGPURenderer de forma assíncrona e usa o backend WebGL2 quando necessário. Alterna entre renderização contínua, sob demanda com movimento reduzido e pausa fora da tela. O carregador configura Draco, Meshopt e KTX2, cancela o carregamento ao desmontar e libera os recursos do modelo. |
| `scenes/PaletteMaterial` | Dentro de um `mesh`, use `<PaletteMaterial tint="#8ed462" />` com uma geometria. O material usa um nó TSL. Para física opcional, monte `Physics` e `RigidBody` de Rapier dentro do Canvas. O EffectComposer de postprocessing precisa de um renderer WebGL compatível. |
| `scenes/SceneTools` e Theatre | Monte `<SceneTools />` como um irmão DOM do Canvas em uma página de autoria. Leva e Studio são carregados em desenvolvimento. Para reproduzir uma timeline exportada, use `getProject(nome, { state }).sheet(nomeDaSheet)` de Theatre Core e passe a sheet ao `SheetProvider` de Theatre R3F dentro do Canvas. |
| `scenes/designer.tsx` | `LottieScene` recebe `src` de um .lottie/JSON. `SplineScene` recebe `src` de um .splinecode hospedado na própria aplicação. `UnicornScene` recebe `projectId` e aceita `jsonFilePath` para export local. Os três recebem `style` com dimensões e `poster`. O SDK oficial Unicorn carrega o script por import assíncrono. Em movimento reduzido, aparece o poster. |
| `lib/sanity.ts` | No servidor, importe `sanity` e `sanityImages`. O client precisa de `NEXT_PUBLIC_SANITY_PROJECT_ID` e `NEXT_PUBLIC_SANITY_DATASET`. Sem o par, os exports valem null. O conteúdo publicado de `/` continua vindo do código. |

A composição usa um grid de 12 colunas de até 1.344 px. O CTA permanece ao alcance do polegar no celular. O pin das cenas alternadas depende de largura e altura suficientes. A planta usa um recorte do próprio poster e o balão tem texto completo acessível. O ranking e o combo são exemplos locais. O Pro exibe os recursos comuns ao Free e a indisponibilidade de novas assinaturas. Os modelos Three, controles de desenvolvimento e embeds de designer estão disponíveis para futuras cenas.

## Modelos

Coloque os originais em `public/models`, inclusive em subpastas. Instale o KTX-Software 4.4+ da Khronos com o executável `ktx` no PATH e rode `pnpm optimize:models` ou `npm run optimize:models`. As saídas ficam em `public/models/optimized/{desktop,mobile}` com o caminho relativo original. Novas execuções ignoram as saídas anteriores. O encoder mantém a hierarquia, usa Meshopt e grava as texturas em KTX2. O perfil desktop usa texturas até 2.048 px. O mobile usa até 1.024 px e busca metade dos vértices dentro da tolerância geométrica. A economia depende do conteúdo.

O diretório público original continha zero GLBs. O ensaio com um modelo texturizado de 337.540 bytes gerou 50.144 bytes no desktop e 35.372 bytes no mobile. Chromium decodificou a textura KTX2 no backend WebGL2, com o canvas entrando em modo sob demanda ao reduzir movimento e parando ao sair da tela.

## Verificação e reprodução

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium webkit
pnpm build
pnpm measure:landing-js
pnpm exec next start --hostname 127.0.0.1 --port 3100
# Em outro terminal
pnpm test:visual
pnpm audit:landing-palette
pnpm lint
pnpm typecheck
pnpm test
```

`pnpm test:visual` grava PNGs em `tests/visual/after` e painéis em `tests/visual/comparison`, com a baseline à esquerda. O teste de cores inspeciona estilos computados, pseudo-elementos, sombras, SVG e gradientes em estados de navegação, níveis, exercícios e FAQ. Aceita os pigmentos de referência, transparências e tons obtidos em sRGB com branco ou preto. Confere o hash das artes, incluindo os derivados de 512 e 640 px do poster original. Isso cobre a paleta da UI observada nos testes. Texturas e estados de projetos externos futuros precisam de revisão própria.

Para repetir o Lighthouse, use `CHROME_PATH` apontando ao executável de `require('@playwright/test').chromium.executablePath()` e rode três vezes `pnpm dlx lighthouse@13.6.0 http://127.0.0.1:3100/ --only-categories=performance --chrome-flags="--headless --disable-extensions" --output=json --output-path=./output/lighthouse.json`, guardando cada relatório. Compare medianas entre builds na mesma máquina. Para os testes WebKit com o build de produção, sirva a rota por HTTPS local devido ao cabeçalho upgrade-insecure-requests.

## Resultado em produção local

| Indicador de / | Antes | Depois |
| --- | ---: | ---: |
| Scripts no HTML inicial | 17 | 19 |
| JavaScript inicial, bytes | 849.372 | 905.093 (+6,56%) |
| JavaScript inicial gzip, bytes | 275.669 | 297.797 (+8,03%) |
| Lighthouse mobile, performance mediana | 86 | 86 |
| LCP mediano | 4.212 ms | 4.130 ms |
| CLS mediano | 0 | 0 |

As três notas finais foram 85, 86 e 86. Os LCPs foram 4.158, 4.130 e 4.112 ms, com CLS zero nas três execuções. O arquivo [metrics.json](tests/visual/metrics.json) registra as seis medições. A contagem de JavaScript usa os chunks externos referenciados pelo HTML inicial. Bibliotecas solicitadas depois da hidratação, ao interagir ou ao aproximar uma cena, têm custo adicional. O comando `pnpm measure:landing-js` também falha acima de 30% de crescimento bruto ou gzip.

| Revisão visual | Comparação de página inteira com movimento reduzido |
| --- | --- |
| Celular | [390 px](tests/visual/comparison/landing-390.png) |
| Tablet | [768 px](tests/visual/comparison/landing-768.png) |
| Desktop | [1440 px](tests/visual/comparison/landing-1440.png) |

Build de produção e typecheck passaram. O lint encerrou com zero erros e um aviso já existente em `scripts/test-adaptive-db.mjs:48`. Vitest registrou 884 testes aprovados e 30 ignorados. A suíte visual aprovou as seis verificações, incluindo um controle que injeta magenta para confirmar a detecção de uma cor proibida.

Os quatro perfis de Chromium e WebKit aprovaram os 20 testes de rolagem, âncoras, menu e movimento reduzido. Os testes públicos adicionais do hero e da experiência interativa aprovaram 19 casos. O caso de ponteiro fino fica desativado no perfil de toque. A suíte autenticada de `pnpm test:e2e` depende de um `.env.e2e` ausente neste checkout e ficou sem execução. O ensaio 3D cobriu WebGL2. WebGPU em hardware físico continua sem validação.

```sh
E2E_PUBLIC_ONLY=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100 pnpm exec playwright test e2e/landing-hero.spec.ts e2e/landing-premium.spec.ts
# Use a origem HTTPS do servidor local de teste
PLAYWRIGHT_BASE_URL=https://127.0.0.1:3114 pnpm exec playwright test -c e2e/landing-scroll.config.ts
```

## Acabamento e descoberta pública

A abertura da landing espera a decodificação do poster do hero e as fontes. A abertura da cortina começa em até 1,05 s e termina em até 1,44 s. A preferência de movimento, a âncora de entrada e o modo leve pulam a cortina. A presença da marca fica registrada em `sessionStorage`. A arte atual do hero usa ilustrações em camadas. O canvas opcional mantém um poster quando o modo leve está ativo.

O modo leve é selecionado quando há até dois núcleos lógicos, até 2 GB informados em `deviceMemory`, economia de dados ou conexão 3G ou inferior. As cenas, partículas da demo e coreografias mais elaboradas cedem lugar aos estados estáticos. O botão de som lembra a opção em `localStorage`, com sons de interface sintetizados localmente após consentimento. Navegações da landing para cadastro e login carregam o tipo de transição `kivora-auth`.

O sitemap lista exclusivamente cinco URLs. O proxy mantém a sessão nas páginas protegidas e exclui a landing, os arquivos de descoberta e os caminhos de arquivos estáticos públicos. Os ícones da aplicação são versionados no manifesto e no cache do service worker. A imagem Open Graph de 1.200 × 630 reaproveita a ilustração original do hero.

## Ilustrações decorativas

`SpotIllustration` renderiza os ornamentos gerados no ImageGen como WebP com transparência e dimensões declaradas. As imagens seguem a paleta da Kivora. O lápis acompanha a prática e a revisão, o sol sinaliza um dia pronto para praticar, o girassol acompanha o progresso e a lua aparece nas pausas e nas preferências. Os livros são compartilhados pela demo, pela coleção e pelos exercícios. O arquivo de paleta verifica o hash das imagens e da máscara usada para o brilho.

Nas três cenas da landing, as imagens decorativas e os pôsteres permanecem visíveis durante o carregamento do Rive e na versão com movimento reduzido. O canvas acrescenta movimento. Os ícones dos controles e o caminho animado mantêm a função para a qual foram desenhados.
