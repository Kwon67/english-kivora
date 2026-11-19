# Fechamento delimitado — integridade de grupos e missões

16/11/2026, America/Maceio. Este complemento substitui a pendência de edição parcial de grupos descrita no fechamento da fase 5. Não acrescenta currículo, retenção de tentativas ou rubricas. Nenhum deploy, push, migration remota, alteração remota de permissões ou teste conjunto foi realizado.

## Edição de grupos: implementada localmente

A action `updateMemberGroup` agora chama apenas `update_member_group_atomic`; não mantém uma alternativa de edição em vários pedidos. O formulário captura o estado original (nome, descrição e participantes) ao abrir a edição e envia esse estado junto da alteração desejada. A função:

1. Confirma `auth.uid()` e o papel administrativo persistido, mantendo as políticas de RLS existentes.
2. Bloqueia a linha do grupo, lê os participantes e compara o estado atual com o estado originalmente exibido.
3. Atualiza nome/descrição, insere os novos participantes e remove os excluídos em uma única chamada transacional.
4. Confere o estado final, inclusive para detectar operações silenciosamente filtradas por RLS.
5. Desfaz tudo se qualquer passo falhar. Se outro editor já mudou o estado, recusa a edição antiga. Repetir a mesma alteração após perder a resposta retorna sucesso sem uma segunda alteração.

A função é `SECURITY INVOKER`, com `search_path` vazio e relações qualificadas. Ela não usa cliente administrativo, não possui `SECURITY DEFINER` e não altera políticas de tabela. Apenas a execução da função é concedida a `authenticated`; a verificação de administrador e a RLS continuam obrigatórias. Esse uso segue a distinção entre execução com privilégios do chamador e do proprietário documentada pelo [Supabase](https://supabase.com/docs/guides/database/functions).

Artefato criado com `supabase migration new`: `supabase/migrations/20261116233151_atomic_member_group_edit.sql`. Foi executado somente no banco PostgreSQL/PGlite efêmero dos testes. O CLI instalado era 2.122.1; não foi atualizado.

**Sem a migration:** a nova action retorna que a edição segura ainda não está disponível e não grava nada. Não há fallback para o caminho parcial antigo. A implantação atual não foi alterada e continua com o comportamento que tiver sua versão publicada. Esta entrega local, por si, não corrige o ambiente remoto.

**Caminho de ativação, ainda não executado:** revisar/aplicar essa migration ao ambiente autorizado, confirmar privilégios e policies nesse ambiente, atualizar os tipos a partir dele, publicar a action/formulário correspondente e retirar instâncias antigas. Confirmar a função no schema cache do PostgREST antes de disponibilizar a edição. Clientes antigos ou operações administrativas que escrevam diretamente nas duas tabelas não participam do protocolo de comparação de estado; devem ser substituídos pelo RPC. O escopo foi **editar grupos existentes**; a criação segue a compensação já existente, não foi transformada em nova funcionalidade transacional.

## Missões: processador privado testado, integração desativada

A auditoria local encontrou uma barreira real para ativar conquistas com segurança:

- `submitGameResult` verifica sessão autenticada, tarefa, coleção e limites, mas recebe os números de acertos/erros do cliente.
- As políticas versionadas de `game_sessions` permitem INSERT da própria sessão, sem provar que uma correção independente produziu aqueles números.
- Logo, uma sessão persistida ou um UUID válido não certifica a pontuação. Não é seguro passar a gravar missões com `service_role` a partir desses dados.

Foi preparado e exercitado `supabase/proposals/verified-mission-events.sql`. **É uma proposta executável no harness, fora da pasta de migrations, sem chamada em código de produção. Não está pronta para ativação isoladamente.** Não há flag que transforme o fluxo atual em fluxo confiável.

A proposta contém:

- Registro privado de eventos de jogos certificados, com uma única certificação por sessão de origem e métricas do verificador independente. O cliente público não pode ler, inserir ou alterar esse registro.
- Recibo privado por evento, utilizado para impedir duplicação após retry ou entrega repetida.
- Processador `SECURITY INVOKER` acessível somente a um worker interno privilegiado, sem função pública intermediária. Não adiciona UPDATE para `authenticated` nem modifica a RLS de missões.
- Usuário derivado de `auth.uid()` no contexto transacional vinculado pelo worker à sessão autenticada e validada. O processador não recebe `userId`, pontuação ou progresso como argumentos. Uma chamada apenas com chave de serviço, sem identidade de estudo, é rejeitada.
- Validação do usuário do evento, da sessão persistida e da tarefa de origem, além do modo permitido. A precisão vem da certificação privada, nunca dos totais legados da sessão.
- Trava transacional por evento e bloqueio de missões em ordem estável. Progresso e recibo são gravados na mesma transação; qualquer exceção desfaz ambos. As estratégias de bloqueio seguem os mecanismos descritos pelo [PostgreSQL](https://www.postgresql.org/docs/current/explicit-locking.html).
- Missões expiradas ou criadas depois do evento não recebem crédito. Evento repetido não soma novamente. O worker tem INSERT/SELECT no registro certificado, sem UPDATE, e não pode apagar recibos.

**Cobertura deliberada da proposta:** eventos de jogos e missões `any_session`, `listening_game`, `speaking_game` e `perfect_accuracy`. Não certifica fala real, não conecta notas CEFR, não processa eventos de Blitz/revisão e não cria um novo mecanismo de medalhas. O cron de medalhas corrigido na fase 5 permanece separado. Missões de Blitz não são creditadas por um evento de jogo.

**Dependência antes de ativar:** implementar/validar um verificador de respostas no servidor e um emissor interno que registre a certificação apenas após validar respostas e origem. O worker precisa vincular a identidade autenticada à transação sem aceitar claims de formulário/cliente. Não copiar automaticamente sessões históricas nem os totais enviados pelo cliente para a tabela privada. Depois disso, transformar a proposta revisada em migration e integrar o worker mediante autorização de implantação. Nenhuma dessas etapas foi simulada como se já existisse no produto.

O harness tem `/attest` e um campo `actor` exclusivamente para montar cenários sintéticos. Eles **não são o verificador ou o transporte de autenticação do produto**, não existem na aplicação, não devem ser publicados e não demonstram autenticação de um worker remoto. Os testes distinguem essa preparação de fixtures da checagem real de permissões e dos efeitos da função SQL.

## Evidências e limite de concorrência

- **833/833 testes aprovados em 91 arquivos**, com `KIVORA_ISOLATED_WORKFLOWS=1 npm test` (`output/learning-evolution/unit-integrity-final.log`). São 30 testes no arquivo de integração isolada, incluindo os 17 anteriores e 13 novos casos parametrizados/de integridade.
- Testes SQL reais: falha após UPDATE do nome, após INSERT de participantes e após DELETE; falha real de FK; RPC ausente sem gravação; membros/anon negados na action e no RPC; disputa entre duas edições; retry idêntico; origem/usuário forjados; tentativa de cliente atestar evento; duplicação de certificação; entrega repetida e eventos distintos concorrentes; expiração; falha após progresso e após recibo, com rollback e recuperação.
- Auditoria local por catálogos/ACL confirmou ambas as funções sem `SECURITY DEFINER`, ausência de acesso do cliente ao schema/processador privado, ausência de execução anônima do RPC de grupo e ausência de UPDATE da certificação/DELETE de recibos pelo worker. Nenhuma auditoria remota foi executada.
- **4/4 testes de navegador afetados passaram** nos viewports 1440×1000 e 390×844: formulário completo, falha tardia mantendo estado e rascunho, retry e edição obsoleta. Log `browser-integrity-targeted.log`. A regressão de todos os workflows afetados passou **36/36**, registrada em `browser-integrity-final.log`.
- Typecheck e build aprovados; lint sem erros e com o aviso preexistente em `scripts/test-adaptive-db.mjs`. Logs `typecheck-integrity-final.log`, `build-integrity-final.log`, `lint-integrity-final.log`.

**Concorrência entre conexões reais também aprovada:** depois dos testes de requisições simultâneas no PGlite, executei `scripts/test-integrity-concurrency.mjs` em PostgreSQL nativo **18.6**, com três conexões e processos de backend distintos. O observador consultou `pg_stat_activity` e confirmou `wait_event_type = Lock` antes de liberar a primeira transação. Passaram **4/4 cenários**: edição concorrente de grupo com estado antigo recusado; evento repetido esperando advisory lock e recebendo crédito único; eventos diferentes esperando a linha da missão sem incremento perdido; rollback seguido de entrega em espera, sem recibo fantasma. Log: `output/learning-evolution/native-concurrency.log`.

O runtime `embedded-postgres@18.6.0-beta.19` foi instalado somente em `/private/tmp/kivora-concurrency-pg`; nenhuma dependência ou lockfile do aplicativo foi alterado. O cluster usou apenas `127.0.0.1:3213` e um diretório temporário próprio, foi encerrado e seus dados foram removidos no `finally`. O empacotador oferece suporte a macOS ARM e controle programático de ciclo de vida, conforme seu [repositório oficial](https://github.com/leinelissen/embedded-postgres). O teste nativo usa schema sintético mínimo e as mesmas funções SQL entregues; a confirmação do contrato com PostgREST e o schema completo de staging continua necessária antes da implantação.

Reexecução com o runtime temporário instalado:

```sh
EMBEDDED_POSTGRES_MODULE=/private/tmp/kivora-concurrency-pg/node_modules/embedded-postgres/dist/index.js node scripts/test-integrity-concurrency.mjs
```


Os gatilhos que injetam falhas existem apenas no harness, não nos artefatos SQL entregues. O servidor de testes permanece em loopback com usuários sintéticos; não houve leitura/escrita de dados remotos para este complemento.

## Dependências restantes, sem ampliação de escopo

1. **Grupos:** revisão e aplicação autorizada da migration, atualização conjunta do aplicativo e confirmação com PostgREST e schema completo no ambiente de ativação (concorrência entre conexões já testada localmente). Até lá, a correção é local.
2. **Missões:** verificador de respostas e vínculo seguro da identidade ao worker; revisão da proposta e futura migration/integração. O avanço automático atual permanece limitado pela RLS, sem anúncio falso de conquista.
3. **Bruce:** revisão conjunta em casa, inclusive Safari/dispositivo físico. Nada foi desbloqueado nem agendado/executado como teste conjunto agora.

## Atualização de implantação — 16/11/2026

Após autorização explícita para aplicar a migração e publicar, `atomic_member_group_edit` foi aplicada ao projeto `odnsaeyrvhbpjtqkvzff`. O Supabase registrou a versão UTC `20261117014908`; o arquivo local foi renomeado para `supabase/migrations/20261117014908_atomic_member_group_edit.sql` e as referências dos harnesses foram sincronizadas. O SQL funcional permanece igual ao testado anteriormente. Os trechos acima descrevem o estado histórico anterior à autorização.

Verificações remotas confirmaram `SECURITY INVOKER`, `search_path` vazio, execução concedida apenas a `authenticated` entre os papéis públicos e rejeição de chamada sem identidade, sem alterar linhas de grupos. RLS existente mantida. A migração de persistência contextual e a proposta privada de missões não foram aplicadas.
