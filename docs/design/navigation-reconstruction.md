# Navegação reconstruída

## Organização
Um único componente `WorkspaceNavigation` atende aluno e administrador, com destinos definidos em `workspaceNavigation.ts`. O Chrome do administrador continua condicionado à autenticação e role check existentes no servidor.

Aluno: Início, Explorar, Revisar e Conversar como destinos principais. Blitz está em Aprender; Progresso e Dificuldades em Acompanhar; Biblioteca e Minha conta em Organizar. Todos os destinos existentes permanecem acessíveis.

Administrador: Visão geral, Membros, Conteúdo e Atribuições como destinos principais; Relatórios e Gerador IA agrupados no menu. Troca de espaço e logout ficam no menu da conta. URLs, autorização e ações não mudaram.

Desktop: barra superior com estado ativo, menu secundário agrupado e menu de conta. Mobile: quatro destinos mais menu, drawer organizado e acessível; tablet: header compacto com drawer. Safe-area e ocultação do dock durante teclado foram preservadas.

Site público: links de capítulos, entrar e cadastro mantidos, apresentação alinhada à navegação do produto. Área da conta: navegação secundária compactada para 48px em vez de cards de 72px.

## Continuidade ao abrir revisão
`WorkspaceLink` usa Next Link, prefetch automático compatível com rotas dinâmicas e `useLinkStatus` para feedback local. Não usa `window.location` nem links HTML para trocar de área. A revisão continua em `/review`, preservando histórico/Voltar, mas mantém o layout e o cabeçalho montados. O loading da revisão está restrito à área de conteúdo.

A navegação redundante de aparência tabulada dentro da home foi removida. O usuário encontra Revisar no mesmo lugar em todas as telas.

## Arquivos principais
- `src/components/navigation/WorkspaceNavigation.tsx`
- `src/components/navigation/WorkspaceLink.tsx`
- `src/lib/workspaceNavigation.ts` e testes
- `src/app/navigation.css`
- Wrappers `NavbarClient` e `AdminSidebarClient`
- `DashboardOverview`, loading da revisão, `AccountAreaNav` e navbar público
- Removidos os antigos `MobileNavMenu` e `AdminSidebarNav`, sem call sites restantes

## Validação
- TypeScript passou.
- ESLint: zero erros, dois avisos preexistentes em `test-adaptive-db.mjs` e `BillingSettings.tsx`.
- Vitest: 68 arquivos, 629 testes passaram, incluindo três novos casos de navegação (cobertura de destinos, matching de rotas e seleção exclusiva no admin).
- Build de produção Next/Turbopack passou por execução direta do Next.
- Chrome e WebKit: Início → Revisar → Voltar sem novo carregamento de documento; referência DOM do cabeçalho permaneceu idêntica. Fechar menu com Esc devolveu foco ao gatilho correto. Biblioteca e Relatórios abriram pelo menu. Detalhes de membro mantiveram Membros ativo.
- Axe: seis páginas e três menus abertos, zero violações WCAG A/AA detectadas.
- Chrome: 14 áreas × 24 tamanhos, sem falhas; página pública/home reexaminadas após ajuste do skip link, 48 verificações adicionais sem falhas.
- WebKit: quatro áreas × 24 tamanhos, 96 verificações finais sem falhas. O teste inicialmente classificou o skip link de 1px, intencionalmente oculto até foco, como controle cortado. Auditoria corrigida para distinguir esse padrão acessível de overflow real.

Tamanhos: 320, 360, 375, 390, 393, 402, 414, 430, 600, 768, 820, 834, 1024, 1280, 1366, 1440, 1536, 1728, 1920, 2560, 3440; paisagem 667×375 e 844×390; tela baixa 1280×600.

Evidências: `output/navigation/` contém screenshots, `interactions.json`, `accessibility.json`, resultados por viewport e logs.

## Limites
Testes renderizados com componentes reais e autenticação/dados de fixture em aplicativo local isolado, sem alterações em dados de produção. Não validam sessões reais, teclado físico iOS ou todas as operações administrativas. Não houve deploy nesta etapa. A URL muda durante navegação interna; a revisão não foi embutida como uma segunda sessão concorrente na home.
