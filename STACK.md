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

O teste visual usa Chromium 159.0.8154.6, DPR 1, pt-BR, movimento reduzido e página inteira após carregar as fontes e decodificar as imagens. Viewports de 390×844, 768×1024 e 1440×900. Com o build servido em 127.0.0.1:3100, use `pnpm test:visual`. O parâmetro `--update-snapshots` recria as referências.

O HTML de produção carrega inicialmente 17 scripts Next, 849.372 bytes, 275.669 bytes gzip (soma dos arquivos comprimidos individualmente). Lighthouse 13.6.0 mobile com throttling simulado, perfil Chromium limpo em cada uma das três execuções, localhost. Performance 85/87/86, LCP 4.315/4.065/4.212 ms e CLS zero nas três. As comparações usam a mediana de cada indicador.
