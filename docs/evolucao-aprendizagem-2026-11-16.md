# Evolução pedagógica local — 16/11/2026

## Limites e estado inicial

Checkout `main`, limpo no início. Nenhum deploy, push, migração remota, upload, geração paga, alteração de produção ou trabalho em faturamento está autorizado. Preservar estilos e componentes existentes. Testes autenticados padrão criam dados remotos: não executar. Usar aplicação isolada com ações substituídas e dados sintéticos; não confundir isso com validação de persistência remota.

Baseline: 82 arquivos / 772 testes aprovados, typecheck aprovado, lint sem erros e dois avisos anteriores (`test-adaptive-db.mjs`, `MultipleChoice.tsx`). Guias locais Next.js de componentes cliente/servidor e mutações lidos antes da implementação.

## Diagnóstico confirmado

- Revisão guiada calcula `1/0` para cards sem modos adicionais. Restauração ignora filas de mesmo tamanho e depende do primeiro pack. Storage sem proteção pode interromper a interface.
- Revisão principal persiste só IDs na fila imediata; itens aguardando reaprendizagem desaparecem do estado local após recarregar. Contador mede respostas, não domínio ou proficiência.
- `accepted_translations` são traduções aceitas, não distratores. Existem corretores normalizados de tradução, contrações e números. A escassez desse campo não prova quebra de múltipla escolha. Distratores são gerados; mutações sintéticas exigem cautela.
- AudioButton usa `/api/tts/preview` quando não há URL. Portanto, ausência de URL não equivale a ausência absoluta de áudio. Reprodução real e falhas devem ser verificadas separadamente, sem acionar provedores pagos.
- Esquema de cards/packs não registra fonte/licença, objetivo comunicativo ou evidência de recepção/produção/interação/mediação. Não é possível comprovar cobertura CEFR pelo rótulo do pack.
- Supabase somente leitura confirmou 185 packs / 2.213 cards totais; 182 públicos / 2.173 cards. Sem URL: 1.819 públicos. Traduções alternativas: 12 públicos. Cobertura de URL A1 111/568, A2 190/594, B1 43/473, B2 10/262, C1 0/180, C2 0/96.

## Plano e critérios

### P0 — confiabilidade

Corrigir contador e retomada, proteger storage indisponível/corrompido, preservar confirmação do servidor antes do avanço. Diferenciar tentativas, conteúdo praticado, trilha e estimativa de nível. Auditar todos os cards em lotes com relatório por item, separando regras automatizadas de julgamento linguístico. Revisar fallback de alternativas e áudio, sem inventar sucesso.

Critérios: fila vazia/erro/recarregamento/reenvio/armazenamento bloqueado cobertos; ausência de áudio ou distratores não cria acerto artificial. Testes unitários e de navegador isolado.

### P1 — Hoje

Uma ação principal conduz a objetivo observável: revisão breve, compreensão de contexto próprio, produção livre, comparação com critérios e reescrita. Persistir rascunho local com aviso honesto. Ligar à revisão e tutor existentes. Shadowing opcional após compreensão, com transcrição e reprodução controlada; sem nota de sotaque ou alegação de análise acústica.

Critérios: fluxo completo novo/retomada em desktop/mobile e teclado; respostas abertas não recebem nota por igualdade de string; falha de áudio mantém leitura e produção disponíveis.

### P2 — currículo e evidências

Matriz A1–C2 × recepção/produção/interação/mediação, objetivos observáveis, tarefas próprias e critérios verificáveis. Checkpoints mostram evidência parcial e lacunas; concluir cards não certifica CEFR nem desbloqueia proficiência automaticamente. Propostas de evolução de dados permanecem locais e reversíveis; validar lógica em isolamento.

Critérios: seis níveis cobertos, evidência com modalidade/origem/limitação explícitas, distinção entre autopercepção e avaliação externa. Não declarar cobertura integral do CEFR por seis tarefas demonstrativas.

## Base pedagógica e uso crítico

- [CEFR, Conselho da Europa](https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors): capacidades observáveis e diferentes atividades comunicativas, não contagem de cards.
- [Nation, Four Strands](https://www.wgtn.ac.nz/lals/resources/paul-nations-resources/paul-nations-publications/publications/documents/2007-Four-strands.pdf): equilibrar input, output, atenção à língua e fluência ao longo do curso; uma sessão curta não demonstra esse equilíbrio por si só.
- [Recuperação ativa](https://psychnet.wustl.edu/memory/wp-content/uploads/2018/04/Karpicke-Roediger-2008_Sci.pdf) e [espaçamento em L2](https://doi.org/10.1111/lang.12479): apoiar revisão, sem substituir uso contextual. Os URLs tiveram timeout/403 nesta consulta; não reivindicar releitura integral.
- [Hamada, shadowing](https://journals.sagepub.com/doi/abs/10.1177/1362168815597504): complemento com evidência contextual, sem promessa universal.
- [British Council A1 listening](https://learnenglish.britishcouncil.org/free-resources/listening/a1) e [Write & Improve](https://writeandimprove.com/): referências de sequência e revisão de escrita; nenhum exercício copiado.
- Input compreensível, tradução bidirecional e falar cedo podem orientar práticas; relatos de Kaufmann, Luca e Benny não estabelecem superioridade científica nem justificam criar modos redundantes.

## Registro de execução

### P0 — implementado e verificado localmente

- `reviewRecovery.ts`, `ReviewClient.tsx` e `GuidedReviewClient.tsx`: retomada por usuário, validação do storage, limite de validade, preservação de itens aguardando reaprendizagem, fase e veredito da revisão guiada. Corrigido o contador `1/0` e a restauração afetada por Strict Mode. Respostas só avançam após confirmação.
- `gameStore.ts`, `GameClient.tsx`, `GameWrapper.tsx`, `saveGameSession.ts` e `actions.ts`: UUID estável por sessão, confirmação de reenvio idêntico, resultado preservado quando o envio falha, nova tentativa explícita. Não apagar o resultado após erro. Removido texto que afirmava tarefa pendente quando o servidor a concluía.
- `multipleChoiceOptions.ts`, `MultipleChoice.tsx`, `ReviewModePractice.tsx`: eliminados híbridos/prefixos artificiais para preencher quatro alternativas. Deck curto pode usar menos opções; sem comparação possível, leitura não avaliada. Trocas semânticas limitadas existentes continuam e exigem revisão editorial.
- `AudioButton.tsx`, `ListeningMode.tsx`: storage opcional, preload desativado, retry acessível e bloqueio de avaliação enquanto o áudio falha. Falha de mídia não vira erro do aluno.
- `DashboardOverview.tsx`, `LevelExamClient.tsx`, histórico e `ProgressReportPanel.tsx`: distinguir estimativa, trilha, agendamento SRS e desempenho nos exercícios. Intervalo longo não significa uso espontâneo comprovado. O diagnóstico inicial existente já explicita estimativa A1–B2; não foi transformado em certificação A1–C2.

### P1 — fluxo funcional, A1–C2

`/today`, `TodaySession.tsx`, `todayLesson.ts` e `ShadowingPractice.tsx` entregam seis situações originais: preparar → compreender → escrever → comparar critérios e reescrever → concluir. Cada nível tem contexto, pergunta explicada, produção aberta e critérios. Textos livres não recebem nota por correspondência exata. Rascunho e etapa são retomáveis por usuário/faixa. Falha no storage não impede escrever, mas a conclusão informa que não foi salva.

Links conectam revisão, trilha e tutor; a produção não é transferida ao tutor automaticamente. Shadowing usa exclusivamente uma voz inglesa marcada `localService` pelo navegador; sem voz local, mantém transcrição. Não chama o TTS pago, não grava, não mede sotaque. A sugestão de retomada em dois dias não é uma notificação.

Persistência em conta implementada atrás de `CONTEXT_PRACTICE_PERSISTENCE_ENABLED=false`: ação autenticada, validação, tentativa imutável, reenvio idempotente e leitura da versão concluída. Histórico apresenta produção e reescrita separadamente da taxa de acertos. Em conflito de versões, a interface permite preservar a revisão como nova tentativa.

A migração `20261116204157_context_practice_attempts.sql` e o rollback em `supabase/proposals/rollback-context-practice.sql` são exclusivamente locais. RLS permite leitura/inserção do próprio usuário; não permite edição, acesso anônimo, origem de evidência externa nem data de conclusão fornecida pelo cliente. Nenhuma migração remota foi aplicada. Rascunhos em andamento permanecem locais; sincronização entre dispositivos contempla tentativas concluídas.

### P2 — base curricular e evidências

`communicativeCurriculum.ts` contém 24 objetivos originais: seis níveis × compreensão, produção, interação e mediação, com tarefa e critérios observáveis. O modelo distingue prática, autopercepção e evidência revisada externamente. Os checkpoints existentes agora descrevem sua amostra e seus limites; os limiares de aprovação não foram alterados sem calibração.

Esta é uma matriz inicial executável com seis tarefas completas, não um curso integral validado até C2. Interação exige outra pessoa, e uma resposta escrita isolada não comprova essa capacidade. O aplicativo não ganhou um avaliador externo ou uma certificação. Expandir sequências, aplicar rubricas em amostras reais e calibrar dificuldade continua sendo trabalho de conteúdo, não um resultado demonstrado pelos testes de software.

### UX global — cobertura e correções

A aparência de páginas existentes foi preservada: nenhum stylesheet global foi alterado. As novas telas reutilizam cores, tipografia, superfícies, navegação e controles existentes.

- `RouteFailure.tsx` e boundaries de aluno/admin: foco no título, recuperação e retorno adequados à área.
- Skeleton de revisão com status acessível. Menu global testado por teclado em largura de 320px. Abas de histórico, configurações, packs administrativos e relatórios percorridas com mouse/toque e teclado.
- Relatórios administrativos: status legíveis, ausência de evidência exibida como traço, rótulos distinguindo último estado SRS de tentativas. Paginação completa de membros/cards/sessões evita truncamento silencioso em 1.000 registros; erro em página posterior não produz totais parciais.
- Exportação PDF: texto consistente com a tela e paleta atual da marca. A inspeção encontrou cores hexadecimais com alfa incompatíveis com jsPDF, que interrompiam a renderização após o cabeçalho. Substituídas por cores suportadas; PDF novamente exportado e renderizado localmente.

| Área | Evidência executada | Limite |
| --- | --- | --- |
| Home/revisão e guiada | Fluxo, falha, retry, reload, fila vazia, reaprendizagem, teclado | Servidor remoto substituído; SQL produtivo não exercitado |
| Hoje A1–C2 | Fluxo completo, texto livre, reescrita, reload, storage bloqueado, áudio ausente/falho | Qualidade pedagógica não comprovada por teste funcional |
| Persistência contextual | Navegador → ação com helper real → API local → PostgreSQL/RLS; falha antes/depois do commit, retry único, outro contexto de navegador | Identidade sintética; autenticação Supabase hospedada não testada |
| Cursos, estudo, explorar e detalhe de pack | Renderização, título, viewport e ausência de erro JS | Sem iniciar atribuições reais |
| Adicionar, dicionário, coleção e gerar | Renderização e responsividade | Importações, geração paga e consultas externas não executadas |
| Histórico e palavras difíceis | Renderização; abas e foco no histórico; separação dos indicadores | Dados sintéticos; sem garantia de desempenho com todo volume produtivo |
| Tutor e conversa | Renderização e estado inicial | Nenhuma chamada paga de conversa |
| Blitz, partida e ranking | Renderização e responsividade | Nenhuma pontuação enviada à produção |
| Configurações e onboarding | Renderização; abas e teclado em configurações | Sem mudanças de conta, MFA ou envio de diagnóstico |
| Prova A1 e lição | Renderização; recuperação de resultado de lição | Não foi feita uma prova real nem recalibração psicométrica |
| Admin dashboard, packs, atribuições, membros e detalhe | Renderização desktop/mobile; abas de packs | Criar/excluir/atribuir em produção não exercitado |
| Admin relatórios | Renderização, abas/teclado, exportação PDF; paginação unitária | Dados sintéticos; recursos/planos continuam amostras recentes limitadas a 200 linhas |

27 rotas × desktop Chromium e mobile WebKit = 54 verificações de navegação. Isso não significa que toda operação de cada página foi testada. Os testes de fluxo aprofundam os casos acima; não substituem homologação autenticada em um ambiente remoto de staging.

### Auditoria do catálogo

A exportação paginada somente leitura contém 2.213 IDs únicos em cinco lotes (500/500/500/500/213). `scripts/audit-learning-catalog.ts` percorreu todos; o relatório por card fica em `output/learning-evolution/catalog-audit.json`, com dados brutos ignorados pelo Git. Nenhuma informação pessoal foi incorporada à documentação.

| Faixa | Cards públicos | Com URL de áudio | Sem URL |
| --- | ---: | ---: | ---: |
| A1 | 568 | 111 | 457 |
| A2 | 594 | 190 | 404 |
| B1 | 473 | 43 | 430 |
| B2 | 262 | 10 | 252 |
| C1 | 180 | 0 | 180 |
| C2 | 96 | 0 | 96 |

- Nenhum texto vazio, gabarito ausente/duplicado nas opções geradas ou alternativa duplicada foi encontrado pelas regras atuais. Isso não valida equivalência semântica de todas as alternativas.
- Seis cards públicos formam três pares equivalentes após remover pontuação: “The book is on the table”, “Good night” e “Take care”. São repetições entre packs, não necessariamente erros. Oito cards públicos compartilham frase com acervo privado; cópias privadas não devem ser diagnosticadas como duplicata do catálogo público.
- 12 cards públicos listam traduções alternativas. Ausência desse campo não comprova erro do corretor nem ausência de distratores.
- Os 394 URLs existentes (354 públicos) responderam a HEAD com HTTP 200 e MIME de áudio. Nenhum deles teve decodificação, reprodução ou alinhamento semântico certificado nesta auditoria. Não foi acionado TTS.
- Todos os registros carecem de metadados estruturados de proveniência/licença e objetivos. No fechamento da fase inicial, todos mantinham status de revisão linguística/CEFR pendente. A inspeção qualitativa anterior de 56 frases e os exemplos revistos aqui não são auditoria editorial integral.
- Os 276 cards C1/C2 exigem análise do contexto/tarefa. O rótulo C2 de “Check the attached doc.” não demonstra capacidade C2; esse trecho pode servir a uma comparação de registro, desde que exista tal tarefa. “Meeting’s on next week.” deve ser revisado no contexto de registro, sem usar substituição automática ou comprimento da frase como classificador de nível.

Fila editorial recomendada: (1) sete packs fonológicos sem áudio armazenado; (2) contextualização C1/C2; (3) gabaritos e equivalência das opções geradas, incluindo variantes aceitas; (4) registro de fonte/licença e objetivos; (5) sequências que produzam evidência de interação e mediação. Cada item deve ter versão, revisor, justificativa e exemplo de desempenho esperado. Não rebaixar/aprovar centenas de cards por heurística de tamanho.

### Verificação e reprodução

- Testes unitários: 87 arquivos / 791 testes aprovados após a paginação dos relatórios.
- Typecheck e lint: aprovados; um aviso anterior permanece em `scripts/test-adaptive-db.mjs` (`_` não utilizado).
- Build Next.js de produção local: aprovado. A primeira tentativa no sandbox ficou parada; foi interrompida e executada com a permissão de processo necessária. Não houve deploy.
- Testes de navegador: 100 cenários aprovados (46 de fluxo + 54 de rotas), Chromium desktop e WebKit iPhone. Relatório e logs em `output/learning-evolution/`.
- PostgreSQL PGlite 0.5.16: migração, titularidade, isolamento de outro usuário, bloqueio anônimo, imutabilidade, campos controlados pelo servidor, nível inválido, duplicata e rollback aprovados.
- Capturas desktop/mobile de Hoje, histórico e admin; PDF exportado por navegador e renderizado com Poppler. Não foi apenas inspeção de JSX.

Preparar a fixture reproduzível (61 arquivos sintéticos, sem copiar `.env`):

```sh
node scripts/prepare-learning-fixture.mjs
node_modules/.bin/next dev output/learning-evolution/fixture --hostname 127.0.0.1 --port 3210
```

Em outro terminal, disponibilizar `@electric-sql/pglite@0.5.16` em ambiente de teste isolado e informar o módulo. Neste Mac foi usado:

```sh
PGLITE_MODULE=/private/tmp/kivora-pgtest/node_modules/@electric-sql/pglite/dist/index.js node scripts/serve-context-practice-fixture.mjs
```

Executar os testes sem o global setup que cria usuários remotos:

```sh
KIVORA_CHROME_EXECUTABLE='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' node_modules/.bin/playwright test --config e2e/learning-evolution.config.ts
PGLITE_MODULE=/private/tmp/kivora-pgtest/node_modules/@electric-sql/pglite/dist/index.js node scripts/test-context-practice-db.mjs
pnpm typecheck
pnpm test
pnpm lint
pnpm build
```

Sem `KIVORA_CHROME_EXECUTABLE`, Playwright usa seu Chromium instalado. A fixture bloqueia fetch externo e substitui autenticação/ações; os testes bloqueiam rede externa do navegador. O servidor PostgreSQL escuta apenas em `127.0.0.1:3211` e contém somente identidades sintéticas. O banco em memória é descartado ao encerrar.

### Dependências e riscos remanescentes

1. Ativar persistência em conta requer uma liberação separada da migração e da flag; produção permaneceu intocada. Até lá, Hoje conserva rascunho/conclusão somente no navegador.
2. No fechamento da fase inicial, a revisão editorial integral de 2.213 cards não havia sido feita; a expansão vinculada abaixo concluiu a leitura assistida de todos os pares e registrou 116 propostas, sem aprovação editorial final. O relatório automatizado é exaustivo quanto às regras executadas, não quanto a julgamento linguístico, licença ou calibração CEFR.
3. Os seis contextos e 24 objetivos não formam um curso completo calibrado A1–C2. Falta expansão editorial e avaliação de uso com aprendizes; não há eficácia medida ou certificação.
4. As sessões de jogo agora evitam duplicar o registro principal. Os efeitos derivados antigos (SRS, logs de erros, gamificação) continuam operações separadas, sem transação única; uma falha parcial exige reconciliação. Não alegar atomicidade do fluxo inteiro.
5. Browser speech synthesis depende de voz local instalada. Reprodução dos áudios remotos e serviços pagos não foi homologada. Nenhum arquivo de áudio foi gerado/uploadado.
6. Navegação global e fluxos selecionados foram validados com dados sintéticos. CRUD administrativo, MFA, diagnósticos e integrações externas precisam de staging separado para homologação real sem violar a proibição de escrita em produção.

Nenhum push, commit, publicação, deploy, alteração de faturamento ou escrita remota foi executado.



## Atualização — unidade de viagem e revisão em lotes

A [expansão de viagem e catálogo](expansao-viagem-e-catalogo-2026-11-16.md) acrescenta três episódios conectados, transferência em situação nova, fala local opcional, evidência observada separada de autoavaliação, cadastro isolado completo até primeira atividade e correções de foco/navegação. A [revisão editorial](catalogo-revisao-editorial-2026-11-16.md) leu todos os 2.213 pares em 14 lotes, com 116 propostas rastreáveis. Estes registros atualizam as limitações de escopo da fase inicial, mas não comprovam eficácia, licença, calibração CEFR, áudio ou entrega de e-mail. Nenhuma escrita remota ou publicação foi realizada.
