# Fase 5 — portfólio, conversas, transferência e workflows locais

Complemento posterior: [fechamento de integridade de grupos e missões](fechamento-integridade-grupos-missoes-2026-11-16.md). A edição parcial de grupos foi substituída localmente por RPC transacional dependente de migration. A proposta privada de eventos foi testada, mas continua desativada no aplicativo. Os detalhes abaixo registram o fechamento original da fase 5.

Entrega local em 16/11/2026. Complementa a fase 4; não declara o produto integralmente validado, seis currículos completos ou proficiência C2 comprovada. Sem push, deploy, migração remota, alteração de RLS, email, push notification, geração paga ou cron remoto. A revisão conjunta em Safari/dispositivo físico permanece para quando Bruce estiver em casa.

## Entrega e critérios de aceite

| Frente | Comportamento entregue | Evidência de aceite |
|---|---|---|
| Portfólio → histórico | `/history` lê o mesmo armazenamento por usuário de `/practice-path`, mostra última resposta de cada situação, progresso por faixa, escolhas, apoio e autoavaliação; link retoma a situação | Navegador percorre as três situações de cada uma das seis faixas, verifica respostas no histórico e retorna pelo link |
| Compatibilidade | Formato 2 aceita registros v1; preserva respostas e data anterior, mas etapas novas ficam pendentes; um registro inválido não descarta os demais válidos | Teste unitário de migração parcial e teste de navegador com portfólio v1 |
| Conversa escrita | Três réplicas por situação, com abertura gradual; cada nova resposta depende de preencher a anterior | 18 situações completadas em desktop e móvel; resposta à terceira réplica bloqueada enquanto falta a segunda |
| Transferência | 18 novos textos/contextos, pergunta de compreensão e resposta aberta; primeira escolha de cada tentativa fica fixa; recuperação preserva escrita e registra uso de apoio/retomada | Caso de escolha errada, impedimento de avanço, nova tentativa e histórico com tentativa 2 e apoio |
| Catálogo e mapa | Mesmas 18 unidades, pré-requisitos e coleções existentes; 72 objetivos originais e 36 objetivos de transferência explícitos no mapa | JSON gerado do modelo utilizado pela interface; nenhuma coleção ou modalidade paralela |
| Grupos | Criação, edição, remoção, deduplicação de participantes; inserção dos novos antes de remover os anteriores; limpeza de grupo cuja criação de participantes falha; nomes aceitam relação como objeto ou lista | Ações reais em PostgreSQL isolado, falhas injetadas e formulário no Chrome |
| Recorrência | Criação/edição, pausa, expiração, liberação idempotente no mesmo horário; conserva repetição/qualidade/total de revisões; rejeita horário impossível, data inválida e cartões de outra coleção | Ações reais, relógio controlado, falha de gravação e tentativa seguinte; formulário valida dia obrigatório e grava regra |
| Missões | Não anuncia conclusão sem linha efetivamente persistida; ignora expiradas; combo atinge a meta ao alcançar o combo pedido; comparação de progresso anterior evita sobrescrever atualização concorrente | Contexto de membro reproduz a restrição de RLS; contexto privilegiado sintético testa regras de negócio separadamente |
| Medalhas/cron | Usa data local, filtra a recompensa exata, aceita status concluído com metadados, ignora sessão vazia; falha de medalha conserva pendência e retorna erro; repetição não duplica medalha | Handler GET real, autenticação local, gravações reais no banco isolado, falha/retry, execução repetida e limite de data local |

O histórico apresenta **o último estado de cada situação**, não um arquivo imutável de todas as tentativas. A transferência registra o número da tentativa atual e apoio; não mantém cada escolha de tentativas anteriores. “Sem apoio registrado” não comprova independência. As réplicas são roteirizadas e não se adaptam semanticamente à resposta. Respostas abertas e critérios marcados não recebem correção automática nem alteram exame, CEFR ou nível da conta.

## Ampliação curricular delimitada

Mantidas três situações por faixa e o mapa único. Cada situação ganhou duas réplicas adicionais e um contexto novo com dois objetivos (recepção e produção). Os critérios da transferência são específicos do pedido e da informação, não apenas uma checklist genérica.

| Faixa editorial | Novos domínios de transferência | Exigência gradual |
|---|---|---|
| A1 | Serviços locais, alimentação, rotina doméstica | Localizar fatos simples e formular convite, pedido ou confirmação |
| A2 | Serviços públicos, moradia, viagem | Preservar prazos, condições e sequência em orientações/pedidos |
| B1 | Trabalho, consumo, vida comunitária | Negociar condições, propor alternativas e não prometer o que depende de aprovação |
| B2 | Consumo digital, tecnologia no trabalho, educação | Ponderar interesses e evidência limitada; formular pilotos e critérios de revisão |
| C1 | Inclusão no trabalho, informação pública, pesquisa | Separar medida e inferência, preservar ressalvas e explicar limites a outra audiência |
| C2 | Memória/representação, governança profissional, ambiente | Preservar concessões, divergências e pressupostos sem fabricar consenso |

Fonte executável: `src/features/curriculum/data/practiceExtensions.json`. Mapa consolidado: `docs/curriculo-competencias-2026-11-16.json`, formato 2. A contagem de objetivos mede cobertura editorial e tarefas disponíveis; não comprova domínio do QECR.

## Limite concreto de missões e proposta local

As políticas versionadas em `20260425120000_add_gamification_and_social.sql` concedem SELECT próprio em `user_quests` e `user_badges`, sem UPDATE de missão ou INSERT de medalha para o membro. A função `evaluateGamification` usa o cliente autenticado de membro. No PostgreSQL isolado, o UPDATE retorna zero linhas e a medalha é rejeitada por RLS. Antes, a função anunciava a conquista sem verificar a persistência; agora só retorna conquistas efetivamente gravadas. **O avanço automático de missões como membro continua não operacional com esse conjunto de políticas.** Não foi alegado que o estado remoto seja idêntico ao recorte de migrations nem foi mudada qualquer política para fazer o teste passar.

O teste privilegiado sintético prova apenas o cálculo e a escrita quando autorizados, não um caminho de aluno funcional. O cron de medalhas já usa cliente administrativo e segredo, por isso sua persistência foi exercitada pelo caminho real existente, sem abrir permissões a membros.

Proposta local para decisão posterior: processar conquistas no servidor a partir de eventos de estudo já persistidos e autenticados, com identidade derivada da sessão, identificador único do evento e operação transacional que associe evento, progresso e recompensa. Não conceder UPDATE livre ao navegador e não trocar simplesmente o cliente da action pública por `service_role`: isso permitiria confiar em estatísticas enviadas pelo cliente. Antes de implantar, testar usuário forjado, evento repetido/concorrente, expiração e retomada após falha. Nenhuma migration ou bypass executável para isso foi aplicada nesta fase.

## Verificação reproduzível e seus limites

- Testes unitários/integração: **820/820 em 91 arquivos**, com `KIVORA_ISOLATED_WORKFLOWS=1 npm test`. Inclui **17 testes de ações/workflows reais** no banco isolado; sem a variável esses testes são pulados e não devem ser reportados como aprovados.
- Navegador: **164/164 aprovados**, Chrome desktop 1440×1000 e móvel 390×844, sem WebKit; log `output/learning-evolution/browser-phase5-final.log`. O ajuste posterior de leitura das relações administrativas recebeu uma verificação específica nos dois tamanhos em `browser-phase5-relations.log`.
- Typecheck e build aprovados; lint com zero erros e um aviso preexistente em `scripts/test-adaptive-db.mjs`. Logs `typecheck-phase5.log`, `lint-phase5.log`, `build-phase5.log`. Build local aprovado, sem implantação.
- Harness: Next em `127.0.0.1:3210`, persistência de contexto em `3211`, workflows PostgreSQL/PGlite em `3212`. Identidades e dados sintéticos, clientes apontam apenas a loopback; testes de navegador bloqueiam tráfego externo. O harness não carrega `.env`; o build normal do projeto usa sua configuração local existente.
- Aplicadas no banco efêmero as migrations existentes de revisão espaçada, grupos e packs próprios, mais políticas existentes de assignments, sessões, badges e missões. Não é uma reprodução cumulativa de todo o schema de produção. O adaptador implementa consultas utilizadas nos testes; não equivale a uma instância completa de PostgREST.
- Ações/workflows e navegador compartilham o banco sintético e são executados sequencialmente para não disputar o reset. Os textos preenchidos automaticamente são sintéticos e verificam fluxo/persistência, não qualidade linguística nem calibragem QECR. Nenhum teste de cron chama uma URL remota; o GET real é importado e recebe Request e segredo sintéticos. Nenhuma notificação é enviada.
- O primeiro comando de navegador não encontrou o Chromium do Playwright. A execução válida usa `KIVORA_CHROME_EXECUTABLE='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'`. As listas de participantes e regras também foram verificadas com relações aninhadas como objetos, corrigindo a leitura que presumidamente esperava uma lista. As falhas intermediárias do teste de grupos eram sincronização com a gravação e interação com o input visualmente oculto de dia da semana; o teste aguarda o participante aparecer e clica o rótulo visível, sem forçar clique.

Comando de navegador:

```sh
KIVORA_CHROME_EXECUTABLE='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' node_modules/.bin/playwright test --config=e2e/learning-evolution.config.ts
```

## Pronto para Bruce testar em casa

Após abrir o ambiente local isolado preparado, o roteiro de revisão humana é:

1. Abrir `/practice-path`, escolher uma faixa e avaliar se os textos, pedidos e critérios são claros.
2. Completar leitura/produção, três réplicas, transferência e mediação; experimentar uma escolha errada e a retomada, conferindo preservação da escrita.
3. Abrir `/history`, expandir o portfólio, ler as respostas, retomar a situação e exportar o JSON na sequência.
4. No papel administrativo **sintético**, criar/editar grupo e regra recorrente; conferir mensagens de erro e a persistência. Não usar produção para esse roteiro.
5. Fazer posteriormente a revisão conjunta em Safari e dispositivo físico, incluindo teclado, rolagem, legibilidade e gravação oral já existente. Nenhum desbloqueio ou teste conjunto foi solicitado agora.

## Pendências separadas por natureza

**Implementação local ainda possível, fora do encerramento desta fase:** preparar uma operação transacional de edição de grupos (hoje uma falha posterior pode deixar o nome alterado ou participantes extras, mas não perde os anteriores quando a inserção substituta falha); construir retenção de múltiplas tentativas e resolução de conflitos entre abas; ampliar rubricas de revisão humana e amostras pedagógicas; preparar e testar o desenho seguro de eventos de conquistas antes de pedir implantação. Essas tarefas não dependem de “serviço externo” por definição, mas seriam trabalho novo após este fechamento.

**Decisão/implantação:** política de persistência e autorização de conquistas, sincronização do portfólio entre dispositivos, identidade/autorização de revisores e retenção de respostas. Aplicação remota e publicação continuam fora da autorização atual. Revisão pedagógica das respostas abertas e evidência oral/interação real são necessárias antes de alegar proficiência; o export não substitui isso.

**Validação humana agendada para depois:** Safari/dispositivo físico e revisão conjunta em casa. Os resultados de Chrome e de PostgreSQL isolado não substituem essa etapa.
