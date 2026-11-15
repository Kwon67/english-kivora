# Landing: composição, movimento e ilustrações — 15/11/2026

Referência: vídeo de 33,539 s enviado pelo usuário, gravado em mindmarket.com. Inspeção em intervalos de 2 s e de 0,5 s para distinguir rolagem, escala, parallax e empilhamento. A página pública também foi inspecionada: usa ilustrações Rive/canvas, enquanto a landing anterior movia três imagens inteiras.

## Implementação

- Verde em grandes superfícies, abertura centralizada, fundos orgânicos, cards claros, navegação opaca e rodapé amarelo.
- GSAP/ScrollTrigger: entrada do título por linhas, viagem da cena de abertura vinculada ao scroll, escala dos cards sobre suas bases coloridas, deslocamento das cenas e objetos decorativos, elementos flutuantes e faixa contínua no rodapé.
- Empilhamento dos planos em telas móveis com altura suficiente. Telas baixas e movimento reduzido mantêm fluxo convencional para não esconder ações.
- Um IntersectionObserver compartilhado pausa as animações contínuas fora da tela; visibilitychange pausa quando a aba fica oculta; matchMedia desfaz movimentos quando a preferência é reduzida.
- Scroll nativo, sem interceptação de wheel/touch. O algoritmo e os pontos de controle de JourneyRibbon não foram alterados; sua geometria continua se ajustando ao tamanho das seções.
- Nenhuma alteração em banco de dados, autenticação, preços ou regras de estudo.

## Ilustrações finais

Skill utilizada: `/Users/clarkkent/.codex/skills/.system/imagegen/SKILL.md`, ferramenta integrada `image_gen`; sem API/CLI de geração. As primeiras figuras SVG experimentais foram descartadas após o feedback do usuário. Todos os personagens finais são das imagens geradas e inspecionadas.

Arquivos finais (cada um com variantes 768 e 1536 px de largura):

- `public/images/journey-2026/discovery-{768,1536}.jxl`
- `public/images/journey-2026/memory-{768,1536}.jxl`
- `public/images/journey-2026/conversation-{768,1536}.jxl`

`<picture>` oferece JPEG XL primeiro e AVIF como alternativa de compatibilidade. Nenhuma nova imagem PNG/JPEG é publicada. Conversão sem alteração de composição: @jsquash/jxl 1.3.0, qualidade 90/esforço 7; AVIF qualidade 78, 4:4:4. O encoder só foi usado offline em output/, sem dependência nova no aplicativo.

Verificação visual feita no arquivo ampliado sobre o verde real da página e após integração no navegador:

- Descoberta: duas pessoas separadas. Mulher com braço de indicação e braço em repouso; homem com dois braços segurando o livro. Pernas e pés completos, sem braços duplicados.
- Memória: uma mulher; braço direito segura a alça do regador, outro repousa ao lado. Mão alinhada à alça; dois pés e duas pernas. Planta, livro e banco separados da figura.
- Conversação: duas pessoas, cada uma com uma mão na xícara e outra na própria perna. Quatro braços no total, quatro pernas e quatro pés. Pernas das cadeiras distinguíveis das pessoas.
- Rótulos da abertura foram afastados da cabeça e dos pés. As cenas finais são movidas intactas; nenhuma mão ou braço é distorcido por uma animação independente.

## Prompts finais

### Descoberta — geração

Use case: illustration-story. Create one polished original editorial illustration for the hero of Kivora, an English-learning website. Transparent background, landscape 3:2 composition, generous clear margin, complete bodies visible. Visual approach: premium contemporary flat vector-style editorial illustration, expressive adults with believable anatomy, elegant organic curves, simple solid shapes, sparse fine charcoal details, clean silhouette, no gradients, no 3D, no heavy outlines. Palette must be consistent: lime green #8ed462, coral #ff705d, sunny yellow #f5e211, sky blue #209fff, lilac #ebc1ff, warm ivory #fffef8, charcoal #2c2e2a. Two young adults discover a large globe together: a woman to its left in coral shirt and lilac trousers naturally points at the globe with ONE hand, her other arm rests comfortably at her side; a man to its right in a yellow shirt and blue trousers holds an open book naturally with BOTH hands at chest height. They are friendly, curious, sophisticated, and distinctly human. The globe is blue/green on a simple stand. Spacious horizontal arrangement, clearly separated silhouettes; do not allow arms to cross another person's body or the globe. Exactly two people; each has exactly two arms attached to shoulders, two hands attached to wrists, two legs and two feet. Hands must have coherent palms and naturally arranged fingers; no duplicate hands, extra arms or tangled limbs. No flying limbs, no overlapping body parts, no disconnected props, no lettering, no badges, no stars, no paper planes, no scenic background. This is finished professional artwork, not a diagram or a primitive SVG mockup. Prioritize beautiful anatomy and clear composition over elaborate poses.

### Descoberta — revisão de recorte

Edit target: the provided Kivora hero illustration. Keep exactly the same two people, their correct anatomy, facial expressions, clothing, globe, book, pose and arrangement. Remove ALL of the blurry colored glow, dark vignette, cast shadows and atmospheric background surrounding them. The entire space outside the hard silhouettes of the two people, book and globe/stand must be fully transparent alpha=0. Clean crisp cutout edges only, no halo, no semitransparent colored fog. Make fills clean and nearly flat, no luminous effects. Preserve both complete people, exactly two arms per person and their existing natural hands. Keep generous margins around all feet and heads. Output a clean transparent asset for compositing on a solid lime-green webpage.

### Memória — geração

Use case: illustration-story. One finished professional editorial illustration for Kivora's spaced-repetition vocabulary section. Landscape 3:2, transparent background, crisp isolated silhouettes, no glow or colored fog. Contemporary flat editorial style with elegant organic contours, expressive natural adult anatomy, sparse charcoal line detail and nearly flat solid color, not 3D, not a crude geometric person. Consistent palette: lime #8ed462, yellow #f5e211, coral #ff705d, blue #209fff, lilac #ebc1ff, ivory #fffef8, charcoal #2c2e2a. Exactly ONE young adult woman on the left, long dark wavy hair, friendly expression, yellow short-sleeved shirt, coral wide-leg trousers, ivory sneakers, full body visible. She calmly tends a small plant growing beside an open vocabulary book on a low lilac stand to her right. Her right arm bends naturally to hold the handle of a small blue watering can; her left arm rests visibly and naturally at her side, separate from the torso. Can spout points toward the soil, with a few tiny clear droplets. Plant should have a thin stem and a few simple rounded green/blue leaves, no human parts. The woman has exactly two attached arms, two anatomically coherent hands, two legs and two feet. Her watering hand must visibly grip the handle correctly with natural fingers and a thumb; no extra fingers, floating hands or duplicate forearms. Clear gap between woman and plant; no limb crossing, no merging clothes with leaves. Entire person, plant, can and book fit with 8% transparent margin. No written text, no background panel, no stars, no decorative aircraft. Composed, warm, premium illustration suitable on a solid green website.

### Conversação — geração

Use case: illustration-story. One polished original editorial illustration for Kivora English's conversation section. Landscape 3:2 frame, genuine transparent background outside the figures/furniture, no glow, no fog, no vignette, clean silhouette edges. Match contemporary flat editorial cartoon style: sophisticated expressive adult characters, organic curves, mostly solid colors, delicate charcoal contour details, natural faces, believable correct anatomy, not 3D and not primitive geometric clipart. Exact palette lime #8ed462, coral #ff705d, yellow #f5e211, blue #209fff, lilac #ebc1ff, ivory #fffef8 and charcoal #2c2e2a. Two young adults sitting comfortably opposite each other at a SMALL round cafe table with a single central pedestal. Woman on left: long dark wavy hair, coral blouse, lilac trousers, ivory sneakers. Man on right: short dark hair, blue shirt, yellow trousers, ivory sneakers. They smile and look at each other while practicing conversation. Woman's one hand holds an ivory coffee cup at chest level, her other hand rests clearly on her own thigh. Man's one hand holds an ivory cup near the table, his other hand rests clearly on his own thigh. Exactly TWO people, each with exactly TWO complete arms, TWO hands, TWO legs and TWO feet. Traceable natural shoulders/elbows/wrists, cups gripped correctly with natural thumb and fingers, no extra arms or hands, no fused fingers. Both forearms visibly separated from bodies; no hands obscured behind the other person or passing through the table. Both knees and both shoes visibly accounted for. Chairs have simple distinct lilac seats and thin charcoal legs that cannot be confused with human legs. Clear negative space between the characters; no clutter and no overlapping human silhouettes. Full figures/furniture within the canvas with a clear transparent margin. No lettering, no speech balloons, no icons, no stars, no decorative aircraft, no background. Warm confident premium educational artwork.

## Validação final e medidas

Build de produção, typecheck, ESLint dos arquivos alterados e `git diff --check`: aprovados. `scripts/check-reference-motion.mjs`: quatro cenários aprovados (Chromium/WebKit, desktop/mobile), incluindo scroll para baixo e para cima, reversibilidade da linha, resize em 320/390/844/1440 px, menu e foco por teclado, FAQ interrompido, prática interativa, acesso a ambos os planos, pausa das cenas fora da tela, preferência de movimento reduzido inicial e alterada em execução. Zero erros de console. Teste separado sem JavaScript: texto, imagens e FAQ disponíveis nos dois navegadores. Os navegadores locais selecionaram e decodificaram JPEG XL.

Medição em navegador automatizado no Mac, contra o mesmo servidor local de desenvolvimento: três percursos de seis segundos por cenário, descendo até o rodapé e voltando ao início. p95 é o percentil 95 do intervalo entre callbacks de requestAnimationFrame; não é uma medição em iPhone real nem uma garantia de FPS em outros aparelhos.

| Cenário | p95 antes (ms, 3 execuções) | p95 final (ms, 3 execuções) |
| --- | --- | --- |
| Chromium desktop | 16,7 / 16,8 / 16,7 | 16,7 / 16,8 / 16,7 |
| Chromium mobile simulado | 16,8 / 16,7 / 16,7 | 16,7 / 16,7 / 16,8 |
| WebKit desktop | 19 / 19 / 19 | 17 / 18 / 18 |
| WebKit mobile simulado | 17 / 17 / 17 | 17 / 17 / 17 |

Nenhum intervalo acima de 34 ms, antes ou depois. Abertura do FAQ causou uma atualização de geometria por cenário, sem refresh em cada quadro. Sem overflow horizontal, sem conteúdo oculto em movimento reduzido e linha completa ao final dos percursos.

Custo de tarefas de CPU do Chromium por percurso de seis segundos: média desktop passou de 0,619 s para 0,873 s; mobile simulado, de 0,401 s para 0,581 s. Portanto, há mais trabalho de animação, apesar da estabilidade observada nos intervalos entre quadros; não se afirma redução de CPU. Variações pequenas de tempo entre ambientes automatizados também não estabelecem ganho causal.

As três imagens anteriores somavam 4.583.031 bytes. As três novas imagens JXL de 1536 px somam 436.153 bytes (90,5% menos); as variantes de 768 px somam 227.664 bytes. O navegador escolhe uma variante e um formato por cena.

Artefatos locais de QA (ignorados pelo Git): `output/reference-motion-20261115/verified-{chromium,webkit}/results.json`, `output/landing-performance/reference-{before,final}/results.json`, `output/reference-motion-20261115/generated/hand-review.png`, `output/reference-motion-20261115/generated/final-art-motion-review.png`, `output/reference-motion-20261115/final-motion.webm`.

Ainda requer verificação: interação e desempenho em iPhone físico, incluindo comportamento da barra dinâmica do Safari e condições térmicas/bateria. A validação em WebKit no Mac não substitui esse teste.

## Correção encontrada na conferência pública

No primeiro clique em um FAQ ainda não visitado, a entrada vertical do grupo e a conclusão da animação pelo evento de foco mudavam sua posição entre `pointerdown` e `pointerup`. A instrumentação confirmou: pressionar atingia a primeira pergunta; soltar atingia a segunda; o evento `click` acabava no contêiner, sem abrir a resposta. O grupo saltava de `translateY(48px)` para sua posição final.

Blocos com links, botões, campos ou summaries agora entram com opacidade, mantendo as áreas de clique imóveis. Os títulos, cenários, objetos, cards vinculados ao scroll e empilhamento continuam animados. O teste automatizado passa a clicar no FAQ durante sua primeira entrada, antes de percorrer a página. A medição comparativa de desempenho acima corresponde ao commit `94001ab0`, anterior a este ajuste de foco, que remove deslocamentos dos grupos interativos.
