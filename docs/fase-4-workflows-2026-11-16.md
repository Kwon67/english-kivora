# Fase 4 — progressão e workflows isolados

## Alcance do incremento

Esta fase amplia a engenharia e o conteúdo localmente, mantendo o visual e excluindo cobrança. Não encerra o pedido geral de um produto curricular completo. O [mapa curricular](curriculo-competencias-2026-11-16.md) distingue a sequência implementada do currículo ainda necessário.

## Implementado e corrigido

- `/practice-path`: 18 situações (12 novas), 72 atividades, dependências entre situações, retomada, autoavaliação e exportação local. Links em Hoje e Trilhas. Conteúdo de apoio ligado a 18 coleções existentes, sem copiá-las ou alterá-las.
- Biblioteca: restaurado um controle explícito para **Criar pack** nas ferramentas. Antes, a criação manual ficava escondida e dependia de abrir a adição em um pack existente.
- Paginação: pedido além da última página redireciona à última página válida, preservando a busca; não mostra “Sua primeira palavra” para uma coleção existente.
- Importação: falha ao consultar cards existentes interrompe a operação; não trata erro como coleção vazia nem ignora deduplicação.
- Preferências: exceção ou falha de gravação restaura o estado anterior, mostra alerta persistente e permite retentar; trava síncrona evita disparo duplicado.
- Detalhe de pack: identificador inexistente/inválido ou conteúdo invisível retorna not-found; erro de leitura genuíno usa recuperação de erro em vez de fingir inexistência.
- Missões: valida tipo, quantidade positiva inteira e data antes da gravação; “todos os membros” exclui administradores; erro ao ler destinatários ou lista vazia não retorna falso sucesso. Checagem de papel e políticas permanecem as existentes.

## Como a integração foi testada sem produção

`scripts/serve-learning-workflows-fixture.mjs` inicia PGlite em memória em `127.0.0.1:3212`. Não lê `.env`, não usa credenciais remotas e não expõe interface fora do loopback. As identidades, packs, cards, preferências e missões são sintéticos. Exclusões nos testes afetam somente esse banco descartável.

O adaptador traduz o subconjunto utilizado das consultas Supabase para SQL parametrizado. O schema mínimo contém as colunas usadas pelos fluxos; as políticas de packs/cards/atribuições vêm do arquivo existente `20260520000002_add_user_owned_packs.sql`, as de atribuições da base inicial e a leitura de missões de `20260425120000_add_gamification_and_social.sql`. Nenhuma política foi alterada. O teste não reproduz todas as migrations históricas, Auth/GoTrue, PostgREST, rede ou Storage de uma instalação Supabase.

As **ações de servidor reais** são importadas tanto nos testes de integração quanto na fixture de navegador. Somente banco/configuração, síntese de áudio e serviços externos são substituídos. O áudio está desabilitado nessa fixture; a falha de áudio não impede a criação dos cards. Não houve geração paga nem upload.

A fixture anterior de prática contextual continua separada em `127.0.0.1:3211`. Os testes de workflows compartilham o banco 3212 e devem rodar sequencialmente, não simultaneamente com a suíte de ações que reinicializa o mesmo banco.

## Matriz atualizada das prioridades

| Fluxo | Implementado e testado nesta fase | Ainda não demonstrado |
|---|---|---|
| Coleção própria: criar/ler/acrescentar/excluir | Interface → ações reais → SQL; deduplicação; cancelamento de exclusão; cascata no banco isolado | Storage/TTS reais, perda de confirmação de criação de pack e transações distribuídas |
| Pasta da coleção | Ação real atualiza categoria e recusa lote contendo pack alheio | Todas as interações de arrastar/renomear pasta na interface |
| Busca/paginação | Inglês/PT, 55 registros em páginas 50+5, ordenação sem repetição, vazio e página inválida | Escala e latência do catálogo real |
| Pack público/privado/inválido | Interface e RLS isolada; público abre, privado alheio não revela cards, inválido/inexistente gera not-found | Estado remoto e políticas cumulativas de produção |
| Preferência semanal | Interface, exceção, rollback visual, retentativa, recarga; ação atualiza só usuário autenticado | Envio do relatório, SMTP e entrega de e-mail |
| Autorização aluno/admin | Ações reais negadas a aluno e anônimo; admin cria/lista/edita; leitura de cards/atribuições/missões isolada por política | Tokens e cookies reais, MFA e configuração do gateway remoto |
| Atribuição | Formulário, confirmação, ação real, destinatário correto; repetição não duplica a combinação no banco | Grupos, cron e todos os modos de jogo em integração completa |
| Missões | Formulário cria/edita; ações listam/excluem; aluno lê apenas suas missões; entrada inválida e falha não viram sucesso | Aumento de progresso após cada modo de jogo/Blitz e entrega de recompensas |
| Competências A1–C2 | Três situações por faixa, pré-requisitos, recuperação, recarga, portfólio e vínculo com coleção | Currículo amplo, interação real, escuta variada e calibração docente |

Os fluxos novos complementam, não substituem, a [matriz global da fase 3](prontidao-global-2026-11-16.md). As linhas que antes tinham apenas “abertura” agora têm a profundidade descrita acima. As demais limitações da matriz anterior permanecem explícitas.

## Reprodução local

```sh
PGLITE_MODULE=/private/tmp/kivora-pgtest/node_modules/@electric-sql/pglite/dist/index.js node scripts/serve-learning-workflows-fixture.mjs
KIVORA_ISOLATED_WORKFLOWS=1 npm test
```

O caminho de PGlite acima é o instalado neste ambiente; em outro ambiente aponte `PGLITE_MODULE` para a instalação local. Nenhuma dependência de runtime foi adicionada ao app. Sem `KIVORA_ISOLATED_WORKFLOWS=1`, os oito testes de integração são explicitamente pulados; não devem ser contados como executados.

Para navegador, materialize `e2e/learning-fixture.json` com `scripts/prepare-learning-fixture.mjs`, mantenha as fixtures locais 3210/3211/3212 ativas e execute a configuração `e2e/learning-evolution.config.ts` com Chrome. A fixture não copia `.env` e bloqueia destinos externos.

## Aceite e limites verdadeiros

- Aceite de engenharia local: componentes, regras, ações e cenários relatados; não aceite de lançamento.
- Ainda executável sem terceiros: ampliar domínios curriculares, interação em múltiplas réplicas, retomada/transferência com novas tarefas, cobertura de grupos/cron/recompensas e integração de histórico do portfólio. Não são bloqueios de acesso externo.
- Dependências externas reais: validar Auth/SMTP/Storage/TTS/tempo real no ambiente autorizado; revisão docente; estudo de aprendizagem ao longo do tempo; revisão de políticas cumulativas da implantação.
- Deploy, push, alterações remotas, migrations produtivas, pagamento e geração paga não realizados.
- Teste final com Bruce, Safari e aparelho físico continua adiado até ele estar em casa. Não é necessário nem foi solicitado desbloquear o Mac nesta fase.

## Resultados finais

- **160/160 cenários de navegador**, Chrome desktop 1440×1000 e viewport móvel explicitamente fixado em 390×844; incluem os 130 anteriores e 30 novos. Os novos cenários também verificam ausência de exceções de página.
- **810/810 testes em 91 arquivos**, com `KIVORA_ISOLATED_WORKFLOWS=1`: os oito testes das ações reais foram executados, não pulados. A asserção adicional de erro ao ler destinatários foi confirmada em execução direcionada dos oito testes.
- Typecheck e build aprovados. Lint: zero erros, um aviso preexistente em `scripts/test-adaptive-db.mjs`.
- `git diff --check` sem erros. Manifesto da fixture sincronizado com 74 arquivos locais, sem `.env`.
- Fonte única do mapa: o JSON curricular reproduz 18 situações e 72 atividades do código. Os vínculos com 18 coleções públicas foram conferidos no snapshot local.

| Evidência | Caminho |
|---|---|
| Regressão completa | `output/learning-evolution/browser-phase4-final.log` |
| Workflows direcionados | `output/learning-evolution/workflows-browser.log` |
| Suíte unitária + integração | `output/learning-evolution/unit-phase4.log` |
| Ações reais, asserção final de destinatários | `output/learning-evolution/actions-phase4-final.log` |
| Typecheck / lint / build | `output/learning-evolution/typecheck-phase4.log`, `lint-phase4.log`, `build-phase4.log` |
| Vínculos de coleções | `output/learning-evolution/curriculum-pack-validation.json` |

Nenhum desses testes certifica a qualidade pedagógica das respostas de exemplo ou o funcionamento do serviço remoto. A inspeção das capturas identificou que o preset móvel anterior usava 390×664, embora os relatórios descrevessem 390×844. Os metadados históricos foram corrigidos, a altura passou a ser explícita na configuração e a regressão completa foi repetida. O cabeçalho da nova sequência foi simplificado durante a atividade e o foco passa à instrução da etapa de interação.

O ganho desta fase é ter evidência local de ponta a ponta para os fluxos prioritários, em vez de deixá-los todos como dependência de produção.
