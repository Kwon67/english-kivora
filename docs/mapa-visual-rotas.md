# Mapa visual das rotas do Kivora

O App Router contém 40 entradas de página e 21 manipuladores HTTP. As rotas com parâmetros aparecem uma vez por modelo de página.

A paleta combina o verde original (#8ED462), o grafite (#40433F), o fundo creme (#F5F1E4) e o coral rosado (#FF705D). O amarelo permanece como destaque secundário.

## Páginas

| Rota | Organização da interface | Verificação |
| --- | --- | --- |
| `/` | Apresentação, navegação por seção, exemplos interativos, planos e rodapé. | Navegador local. |
| `/login` | Acesso social, abertura do formulário de e-mail e envio. | Navegador local. |
| `/login/mfa` | Formulário de código e mensagens de autenticação. | Redirecionamento na sessão disponível. Formulário verificado isoladamente a 390 e 1280 px. |
| `/forgot-password` | Solicitação de recuperação de acesso. | Navegador local. |
| `/auth/new-password` | Campos para definir a senha e retorno da operação. | Navegador local. |
| `/register` | Cadastro e acesso aos documentos da conta. | Navegador local. |
| `/register/confirmacao` | Confirmação de e-mail e orientação para prosseguir. | Navegador local. |
| `/offline` | Aviso de conexão, retorno ao início e nova tentativa. | Navegador local. |
| `/privacy` | Leitura por tópicos e contato. | Navegador local. |
| `/terms` | Leitura por tópicos e retorno ao cadastro. | Navegador local. |
| `/home` | Cabeçalho de revisão, progresso, frase, resposta, áudio e avaliação. | Navegador local. |
| `/review` | Sessão de revisão, modos de exercício, feedback e próximas ações. | Navegador local. |
| `/add` | Entrada de vocabulário, ação principal e confirmação. | Navegador local. |
| `/library` | Coleção por grupo, filtros e ações de cada conjunto. | Navegador local. |
| `/today` | Prioridades do dia e entrada nas práticas. | Navegador local. |
| `/study` | Encaminha para a trilha de cursos. | Redirecionamento confirmado para /courses. |
| `/courses` | Trilha, atividades e atalhos para praticar. | Navegador local. |
| `/explore` | Resumo do catálogo, agrupamento por nível e seleção de packs. | Navegador local. |
| `/explore/pack/[id]` | Identificação do pack, estado, chamada para prática e amostra. | Navegador local, com registro disponível. |
| `/play/[assignmentId]` | Atividade individual, alternativas, progresso e confirmação. | Navegador local, com registro disponível. |
| `/exam/[level]` | Avaliação do nível e controles da atividade. | Navegador local, com registro disponível. |
| `/practice-path` | Trilha por competências e resposta do exercício. | Navegador local. |
| `/problem-words` | Indicadores e listas de termos que precisam de prática. | Navegador local. |
| `/dictionary` | Pesquisa, grupos de resultados, exemplos e tradução. | Navegador local. |
| `/generate` | Configuração do material, opções, prévia e mensagens. | Navegador local. |
| `/history` | Filtros de período, indicadores e visualização da atividade. | Navegador local. |
| `/settings` | Abas da conta, grupos de preferências e controles. | Navegador local. |
| `/onboarding` | Progresso do assistente, escolha do método, meta e posicionamento. | Redirecionamento na sessão configurada. Etapas verificadas isoladamente a 390 e 1280 px. |
| `/tutor` | Seleção de cenário de conversação. | Navegador local. |
| `/tutor/[id]` | Conversa, histórico de mensagens e controles de entrada. | Navegador local, com registro disponível. |
| `/blitz` | Escolha de modalidade, instruções e entrada na rodada. | Navegador local. |
| `/blitz/play` | Rodada, controles de jogo e resultado. | Navegador local. |
| `/blitz/ranking` | Classificação e posições dos participantes. | Navegador local. |
| `/admin` | Encaminha para a visão geral administrativa. | Redirecionamento confirmado para /admin/dashboard. |
| `/admin/dashboard` | Atividade, destaques, indicadores e desempenho por aluno. | Navegador local. |
| `/admin/members` | Diretório, busca, filtros e acesso ao perfil. | Navegador local. |
| `/admin/members/[userId]` | Perfil do membro, atividade e controles de gestão. | Navegador local, com registro disponível. |
| `/admin/reports` | Resumo, ranking, aprendizado, uso de IA e desempenho individual. | Navegador local. |
| `/admin/assign` | Planejamento e acompanhamento de atribuições. | Atribuir, Grupos, Missões e Programar verificadas no navegador local. |
| `/admin/packs` | Gestão de conteúdo e organização de packs. | Navegador local. |

## Navegação e estados

Estudo e administração compartilham o cabeçalho, o menu de conta e o painel lateral. O assistente inicial apresenta a marca em formato compacto. Atividades em modo de foco têm seus próprios controles. As páginas de conta e institucionais usam a navegação pública com retorno contextual. A landing mantém o menu de seções.

A revisão em 505 px cobriu a largura do conteúdo e os fundos visíveis das páginas. A verificação do cartão de revisão incluiu revelar a tradução e inspecionar as quatro opções de avaliação. O menu da conta também foi aberto em desktop. O fluxo visual foi verificado sem salvar avaliações de alunos ou alterar permissões.

Os layouts também incluem telas de carregamento, limites de erro e a página 404. O manifesto e os ícones da PWA compartilham a paleta da interface.

## Endereços alternativos

| Origem | Destino |
| --- | --- |
| `/arena`, `/arena/:path*` | `/blitz` |
| `/admin/arena` | `/admin/dashboard` |
| `/ranking` | `/blitz/ranking` |

## Rotas de serviço

Estes endereços atendem requisições, retornam dados ou encaminham o navegador.

- `/api/card-audio/[id]`
- `/api/cron/daily-plan`
- `/api/cron/due-review-notifications`
- `/api/cron/evaluate-medals`
- `/api/cron/streak-reminder`
- `/api/cron/subscription-reminders`
- `/api/cron/weekly-report`
- `/api/dictionary`
- `/api/exam-audio/[attemptId]/[questionId]`
- `/api/learning/personalize`
- `/api/login`
- `/api/presence`
- `/api/push/notify`
- `/api/push/subscribe`
- `/api/streak/update`
- `/api/tts`
- `/api/tts/preview`
- `/api/tts/tutor`
- `/api/webhooks/abacatepay`
- `/auth/confirm`
- `/auth/recovery`

Os metadados públicos incluem `/manifest.webmanifest`, `/robots.txt`, `/sitemap.xml` e os ícones de aplicativo.
