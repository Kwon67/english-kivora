# Auditoria e aprendizagem adaptativa — Kivora English

## Diagnóstico

O plano diário consultava apenas packs públicos existentes. Apesar de haver Groq, Microsoft TTS, revisão espaçada e estimativa CEFR, essas integrações não compunham um processo automático por membro. Os packs privados nem entravam na consulta do planejador. A geração administrativa e o Blitz IA eram fluxos separados.

Outros problemas confirmados no código:

- `cefrLevels.ts` convertia C1/C2 em B2. A estimativa e as tabelas de histórico terminavam em B2, embora o catálogo já tivesse C1/C2.
- `dailyPlan.ts` sempre começava pelos mesmos modos. Planos de duas atividades não chegavam à fala/escuta.
- O estimador podia substituir um nivelamento avançado por A1 após poucas respostas fáceis; o resultado agregado não distinguia variedade de cards, dias ou habilidades.
- `recordCefrInteraction` era disparado sem espera nas ações de resultado, podendo ser interrompido ao terminar uma função serverless.
- Qualquer descrição com 160 caracteres era interpretada como passagem de compreensão de leitura, mesmo num pack comum.
- O TTS não tinha deadline completo, reaproveitamento persistente por conteúdo nem confirmação de que o card atualizado era o mesmo texto sintetizado.
- O SRS recebia o estado de agendamento anterior do navegador; agora usa o histórico persistido e confirma o acesso ao card.

## Fluxo implementado

1. Ao abrir a home, o sistema cria uma tarefa persistente exclusiva para membro/data. Isso também funciona nas variantes de primeiro acesso e primeiro dia.
2. O trabalhador consulta o nivelamento, interesses, meta diária, resultados recentes por modo, erros e revisões. Não exige plano Pro para gerar o treino pessoal.
3. Revisões acumuladas e frases pessoais ainda pendentes suspendem conteúdo novo. A decisão pode ser reavaliada em uma visita seguinte, após cinco minutos, sem consumir tentativas da Groq.
4. O plano escolhe foco, tema, dificuldades e 4–8 frases. Um desafio no próximo nível só é proposto quando o gate de aprendizagem já o permite; isso não altera o nível do membro.
5. A Groq recebe um schema JSON estrito. Validações locais verificam limites, duplicatas e conteúdo inválido; uma chamada separada revisa naturalidade, tradução, nível e objetivo. São necessárias pelo menos quatro frases aprovadas.
6. O Microsoft TTS produz os áudios. Cada resultado concluído é salvo no rascunho; retries reutilizam texto e arquivos já gerados.
7. Uma transação publica pack privado, cards com áudio e atividades. A prática inclui reconhecimento, escuta e fala; de B1 em diante a escrita alterna com reconhecimento. O pack entra no SRS pelas atribuições normais do produto.
8. A home mostra o objetivo e os motivos do treino, progresso dos áudios, adiamento por carga de estudo ou falha recuperável. Em falhas, o catálogo e as revisões continuam disponíveis.

## Persistência e operação

Migração: `supabase/migrations/20260910185333_adaptive_learning_pipeline.sql`.

- `personal_learning_jobs`: uma linha por membro/data; estados queued, generating, audio, ready, deferred e failed.
- Três tentativas por tarefa; espera progressiva de 1–3 minutos em falhas. Lease de quatro minutos e token de exclusão impedem workers antigos de sobrescrever trabalho novo.
- As funções de claim/publicação usam `SECURITY INVOKER`, com execução apenas para `service_role`. RLS e privilégios de coluna impedem leitura de rascunhos/tokens ou escrita por membros.
- A geração roda em `after()` do Next.js com duração máxima de 180 segundos. A home e o endpoint podem recuperar trabalho interrompido. O cron diário recupera uma tarefa e limita o planejamento aos 100 membros ativos mais recentes da semana.
- O cron é recuperação complementar. Uma fila contínua com muitos membros simultâneos requer worker dedicado ou agendamento mais frequente compatível com o plano de hospedagem; não há promessa de pré-gerar todos os membros antes de entrarem.
- Não há instalação de novo runtime de produção. PGlite foi usado só em diretório temporário para testar SQL.

Configuração:

```env
GROQ_API_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ADAPTIVE_LEARNING_ENABLED=true
TTS_PROVIDER=auto
# Opcionais: com os dois valores, auto usa o serviço oficial Azure Speech.
AZURE_SPEECH_KEY=...
AZURE_SPEECH_REGION=...
```

Sem credenciais Azure, mantém-se o Microsoft Edge TTS existente. `TTS_PROVIDER=azure` exige configuração completa e falha explicitamente se ela faltar. `ADAPTIVE_LEARNING_ENABLED=false` restaura o planejamento com o catálogo. Segredos ficam no servidor.

## Verificações

- Suíte unitária completa: 561 testes em 62 arquivos aprovados. TypeScript e lint dos componentes/ações alterados aprovados.
- Migração aplicada no Supabase e privilégios verificados no projeto real. Build de produção aprovado na Vercel com Turbopack.
- Teste completo no deploy aprovado: home → Groq → Microsoft TTS → pack privado com quatro cards → atividades → SRS; MP3 reproduzível, telas desktop/celular sem overflow, sem erros JavaScript e apenas uma tarefa por dia. Conta e arquivos temporários removidos após o teste.
- SQL executado em PostgreSQL temporário: migração, unicidade diária, claim exclusivo, recuperação, token expirado, limite de retries, publicação transacional, idempotência, C1/C2 e isolamento dos membros.
- Worker: falha de áudio preserva checkpoints, retomada não chama Groq novamente, backlog não chama provedores, nenhum trabalho com lease ocupado e erros externos não são persistidos literalmente.
- Teste real em Groq e Microsoft Edge: quatro frases A1 sobre viagem; revisão rejeitou um item; áudio MP3 de 14.832 bytes. Artefatos locais em `output/adaptive-audit/` (não enviados à Vercel).
- Comandos reproduzíveis: `npm test`, `npm run typecheck`, `PGLITE_MODULE=/caminho/temporario/@electric-sql/pglite/dist/index.js node scripts/test-adaptive-db.mjs`.
- Teste opcional que usa os provedores reais e consome API: `npx vitest run --config scripts/vitest.live.config.ts`. O teste de geração não grava dados de membros; com `ADAPTIVE_TEST_URL`, o teste completo cria uma conta temporária, verifica o fluxo publicado e remove seus dados ao terminar.

## Limites pedagógicos e pontos de continuidade

O sistema estima um nível de estudo. Os critérios de variedade, acerto e habilidades são regras iniciais do produto, não uma certificação CEFR validada. A aprovação por outro chamado de IA reduz erros, mas não equivale à revisão de um professor. É necessário acompanhar amostras de conteúdo e os resultados reais dos alunos.

O teste de entrada existente mantém seu teto A1–B2; não passa a certificar C1/C2. O conteúdo e a trilha agora preservam os seis níveis, e a progressão avançada exige prática variada. Não há evidência para garantir fluência definitiva, saída de A1 a C2 para todos, ou equivalência/superioridade ao Duolingo.

Os cards treinam frases. Ler livros e conversar espontaneamente também requerem compreensão de textos extensos, produção livre, interação, pronúncia e tarefas com transferência para contextos novos. O tutor e recursos de leitura existentes continuam relevantes; seus resultados ainda não constituem avaliação formal de proficiência. O tutor mantém a política Pro já existente.

A auditoria de segurança do Supabase também apontou avisos anteriores a esta mudança (funções antigas com search_path mutável, funções SECURITY DEFINER acessíveis aos papéis de cliente e proteção de senhas vazadas desligada). Os novos objetos são testados separadamente; esta entrega não deve ser descrita como auditoria completa de segurança do produto. Referências: [linter de funções](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable), [privilégios SECURITY DEFINER](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable).

## Referências técnicas

- [Groq Structured Outputs](https://console.groq.com/docs/structured-outputs)
- [Groq Rate Limits](https://console.groq.com/docs/rate-limits)
- [Microsoft Speech REST TTS](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Next.js after](https://nextjs.org/docs/app/api-reference/functions/after)
