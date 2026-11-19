# Kivora English · Aceite técnico do piloto

**19 de novembro de 2026. A jornada passou no ambiente local. O convite aos alunos depende do aceite de autenticação, entrega de e-mail e isolamento de dados em homologação.** A eficácia pedagógica, a entrega de notificações no aparelho e o comportamento do Safari de um iPhone físico exigem observação própria.

## A. Estado do produto

| Etapa | O que o aluno conseguiu fazer | Alcance da evidência |
|---|---|---|
| Landing, cadastro e confirmação | Abrir o cadastro, validar os campos, corrigir falha, solicitar confirmação novamente e chegar ao primeiro acesso | Formulário, ação de servidor, callback PKCE e redirecionamentos do build real. Supabase e caixa postal substituídos por dados locais |
| Login e retorno | Reabrir rota protegida, iniciar sessão e retomar a atividade com o rascunho. Um membro que pede a área administrativa volta à área do aluno | Login e logout reais da aplicação com sessões sintéticas. Testes do proxy cobrem rotação de cookie, expiração, papel administrativo e falha na consulta de MFA |
| Onboarding e Hoje | Repetir uma etapa interrompida, prosseguir com catálogo vazio e iniciar a prática. No contexto de A1 a C2, escrever, revisar e retomar após recarga | Jornada em Chromium e WebKit. O rascunho depende do armazenamento do navegador e tem escopo por aluno |
| História de viagem e fala | Completar aeroporto, hotel e passeio, fazer a transferência para uma situação nova e retomar a sequência. Recusar o microfone preserva o caminho por texto | Captação, liberação de trilhas e recuperação exercitadas com dispositivos sintéticos. Há ligação para a revisão. A conclusão de um episódio não cria automaticamente cartões de revisão |
| Tutor e dicionário | Repetir um turno sem duplicá-lo, retomar o diálogo na aba e continuar por texto após erro de áudio. Repetir uma pesquisa sem perder o termo | Foram exercitados o comportamento da interface e os contratos de resposta. Qualidade do modelo, dos verbetes e das vozes externas requer avaliação humana |
| Revisão, Blitz e histórico | Corrigir, refazer e recuperar uma revisão interrompida. Contas distintas na mesma aba veem seus próprios resultados do Blitz. Filtrar sessões no dia local, abrir o gráfico e recuperar o histórico após falha | Ações locais e respostas sintéticas persistidas em memória durante o teste. A gravação transacional entre dispositivos e o isolamento real no PostgreSQL aguardam homologação |

A prática contextual pode gravar tentativas concluídas na conta quando `CONTEXT_PRACTICE_PERSISTENCE_ENABLED` está habilitado. O padrão do código é local. Rascunhos incompletos e conversa do Tutor têm ciclos de vida próprios no navegador. O produto não promete recuperar cada caractere em outro aparelho. A estimativa de nível no histórico é um indicador de atividade. O piloto com pessoas deve observar compreensão, autonomia e retenção.

## B. Problemas corrigidos

| Problema observado | Correção localizada | Verificação |
|---|---|---|
| Perda de rede mantinha o onboarding ocupado. Catálogo sem pack elegível devolvia o aluno à escolha de objetivos | Ações liberam o envio, oferecem repetição e preservam a etapa. Catálogo vazio permite seguir. Erro ao consultá-lo aparece separadamente. O nível já calculado pode ser salvo novamente | Ambos os bloqueios reproduzidos no WebKit antes da mudança. Cadastro, falha injetada, catálogo vazio e chegada a Hoje passaram depois |
| Confirmação expirada deixava pouca saída. O callback podia aceitar uma troca sem sessão e direcionar o navegador ao host interno do proxy | Reenvio com limite por IP e e-mail, resposta pública neutra, falha do provedor informada, sessão exigida e destino relativo. Recuperação de senha distingue falha ao confirmar a escrita de falha ao encerrar a sessão | Vitest de cadastro, callback e recuperação. No HTTPS local o callback devolveu 303, destino relativo, cache privado e política de referência `no-referrer` |
| Cookies de sessão renovados se perdiam em redirecionamentos. Indisponibilidade da consulta de fatores podia ser interpretada como ausência de MFA | O proxy encaminha cookies renovados, encerra os inválidos e retém a atividade permitida. O desafio distingue fator verificado, sessão ausente e serviço indisponível. Login lida com resposta malformada e tempo esgotado | Vitest do proxy, fatores e destinos. Logout e novo login recuperaram a escrita de Hoje. Membro foi redirecionado ao solicitar administração |
| Uma fila local podia reapresentar cartão já reagendado após perda da confirmação | A fila confirmada pelo servidor prevalece ao recuperar a revisão. O reaprendizado pendente e o limite da sessão continuam válidos | Testes de reconciliação e Playwright com falha de envio, repetição, recarga e fila vazia |
| O Blitz usava uma chave de resultado compartilhada por toda a aba | O resultado, os erros e os dados de recuperação ficam sob o ID autenticado. O placar gravado no servidor permanece intacto. Um resumo legado sem autor deixa de ser restaurado | Vitest de isolamento e expiração. No build real, o aluno B entrou na arena enquanto A ainda tinha um resultado, e A o recuperou ao voltar |
| Histórico podia perder sessões da noite, truncar o relatório em 1.000 linhas ou representar falha de leitura como zero | Uso do dia de São Paulo, paginação ordenada, estados independentes de indisponibilidade e nova leitura do servidor ao repetir | Sessões nos dois limites do dia, contagem de 1.003 frases em duas páginas, erro de relatório com resumo legível e recuperação de falha de rota |
| Tutor aceitava resposta vazia, longa demais ou só com dica. Fechar a fala enquanto o microfone aguardava permissão podia manter captura ativa | O Tutor permite repetir o turno. A fala encerra a trilha concedida depois do fechamento | Vitest de respostas e Playwright com atraso de resposta, erro de áudio e permissão tardia |
| Resposta HTTP 200 incompleta derrubava o dicionário inteiro. Uma conexão pendurada deixava a busca ocupada | Validação do resultado, preservação do termo e repetição após falha ou 15 s. O servidor distingue verbete ausente de resposta inválida e conserva a tradução disponível | A mesma resposta malformada mostrou a tela de erro geral antes e o alerta dentro do dicionário depois. Playwright cobre 503, resposta malformada, tradução, busca vazia e timeout |
| Restringir o armazenamento do PWA gerava uma exceção assíncrona ao abrir o login no WebKit | Preferências opcionais toleram recusa de leitura e escrita. O aluno continua a usar a página | Dois estados de armazenamento em Vitest (disponível e bloqueado) e o mesmo login em WebKit antes e depois. Em Chromium, o service worker ativou em HTTPS, mostrou o aviso offline e recuperou a conexão com o login aberto |
| Seis textos da landing tinham contraste insuficiente. Logs de erro de push incluíam informação de assinatura. Um reenvio do relatório semanal podia repetir o e-mail | Duas cores de texto ajustadas, dados do endpoint removidos dos logs e chave de idempotência estável por aluno e período. Links legais deixam de disparar prefetch no fluxo de autenticação e no rodapé | axe, comparação visual, inspeção dos logs no código e teste do contrato Resend. A proteção do provedor para a mesma chave tem uma janela de 24 h. [Resend](https://resend.com/docs/dashboard/emails/idempotency-keys) |

## C. Qualidade, experiência e desempenho

O ponto de partida foi a árvore de trabalho da branch `main` em `14f891c2`, com alterações locais existentes. A cópia de referência incluiu o trabalho ainda sem commit. As duas versões de produção rodaram em HTTPS local, com contas sintéticas e sem arquivos de segredos. A autenticação e o PostgREST usados nos testes de integração de navegador responderam em memória. A suíte educacional também usa fixtures explícitas para respostas e falhas.

| Verificação | Resultado |
|---|---|
| Versões efetivas | Node 26.13.1, pnpm 12.21.0, Next.js 16.4.6, React 19.3.1, ESLint 9.39.5. O `tsc` clássico informou 6.0.3 e o executável nativo informou 7.0.2 |
| Typecheck e build | Ambos os compiladores passaram. Build inicial e final concluídos. A nova página pública de reenvio aparece no build final |
| Vitest | Inicial com 816 aprovados e 30 ignorados. Final com 845 aprovados e 30 ignorados. Os 30 exercitam workflows de PostgreSQL isolado cujo preparo aplica migrations |
| ESLint e dependências | Zero erros e um aviso preexistente em `scripts/test-adaptive-db.mjs:48`. Verificação de peers sem conflitos. `pnpm audit` retornou zero advisories para a árvore consultada, com 984 dependências no total reportado |
| Playwright educacional | 130 cenários aprovados, 65 por motor, na fixture de aprendizagem. Incluem estados de falha no cadastro, no primeiro acesso e nas atividades, além de 27 rotas por motor. Houve testes adicionais no build real com servidor simulado |
| Matriz de produção | 10 rotas × 8 larguras × 2 motores, antes e depois. HTTP 200, caminho esperado, título principal e ausência de overflow horizontal em todas as observações. Nas visitas estáveis, sem erros de console, hidratação ou respostas HTTP de erro |
| Acessibilidade e visual | axe 4.12.1 em dez telas a 390 px. A landing passou de seis elementos reprovados por contraste a zero. O conjunto final não apresentou violações nas regras WCAG A/AA examinadas. Foco de retorno do menu, abas, diálogo do Blitz, erros e repetição foram exercitados com teclado. Leitor de tela físico permanece pendente |
| Comparação de imagens | 45 pares de capturas WebKit do primeiro viewport, com movimento reduzido. Nenhum pixel passou do limiar de diferença de 24 níveis em qualquer canal RGB nos 45 pares. As alterações de contraste atingem textos mais abaixo na landing |
| Módulos adiados | APKG ausente na abertura da administração e no uso de CSV/JSON. Falha de chunk seguida de nova tentativa e prévia válida. Gráfico ausente na abertura do histórico, carregado ao entrar na área do gráfico e redimensionado de 358 a 428 px. Rive mostrou o pôster em movimento reduzido e voltou a animar após navegação |
| Analytics | Sem chave, o teste unitário comprova que o SDK não é importado. Com chave fictícia, o WebKit emitiu POST para a coleta interceptada em HTTPS. A CSP bloqueou a configuração JavaScript remota opcional. O SDK recuperou a configuração por JSON e enviou o evento. Fila, identificação e logout têm teste de ordem. Nenhum evento foi enviado a uma propriedade real |

As larguras foram 375, 390, 402, 430, 768, 1.024, 1.440 e 1.920 px. A matriz principal cobriu landing, cadastro, login, onboarding, Hoje, Tutor, revisão, histórico, Blitz e início. Houve cobertura adicional de administração, prática por competências e importador. Na navegação rápida com o WebKit houve cancelamentos e mensagens intermitentes em pedidos especulativos do Next (`?_rsc=`). Os destinos, a autenticação e a volta à landing concluíram. Não identificamos a causa fora desse cenário de navegação e não alteramos a CSP para suprimir as mensagens.

### Landing em rede móvel simulada

Medianas de três contextos Chromium independentes por versão. Viewport de 390 × 844, DPR 2, cache frio, CPU limitada a 4×, latência de 150 ms, 1,6 Mb/s de download e 0,75 Mb/s de upload. A página abriu no build de produção. Após o evento de carregamento e uma espera de 2,5 s, o teste abriu e fechou o menu, rolou 600 px e observou a página mais um segundo.

| Mediana da landing | Inicial | Final |
|---|---:|---:|
| LCP | 3,248 s | 3,244 s |
| CLS | 0 | 0 |
| Maior duração de interação observada pelo Event Timing | 56 ms | 48 ms |
| Long tasks observadas | 1 | 1 |
| Maior long task | 141 ms | 140 ms |
| Tempo de script antes da interação | 263,0 ms | 284,7 ms |
| Tempo de trabalho da thread principal durante menu e rolagem | 331,7 ms | 324,0 ms |
| Heap JS usado no instante da coleta | 11,53 MB | 11,80 MB |
| Corpos JS concluídos, encodedBodySize | 416.274 B | 416.929 B |
| Corpos CSS concluídos | 68.703 B | 68.698 B |
| Corpos WASM concluídos | 0 B | 0 B |

O LCP permaneceu próximo de 3,24 s e o CLS foi zero. O script pré-interação custou cerca de 22 ms a mais na mediana e o JS observado cresceu 655 B. Com três rodadas e sem perfil de atribuição por função, esses dados não sustentam uma conclusão de ganho global de velocidade.

A duração de script inclui código além da hidratação. O custo de CPU da interação inclui menu e rolagem. As medidas de heap são fotografias pontuais. O WASM contabilizado no intervalo corresponde a respostas concluídas no Resource Timing. A solicitação pode começar antes de constar desse total. Nenhuma dessas amostras mede INP de campo, FPS físico ou retenção de memória ao longo de uma aula. A avaliação de Core Web Vitals em uso real depende de distribuição de visitas e do percentil 75. [Web Vitals](https://web.dev/articles/vitals)

### JavaScript inicial do build

Valores em bytes, soma de cada chunk do manifesto comprimido com gzip nível 6. O cache, a compressão do servidor e o prefetch mudam o que atravessa a rede. A medição do navegador está na tabela anterior.

| Rota | Inicial | Final | Variação |
|---|---:|---:|---:|
| `/` | 239.957 | 239.955 | -2 |
| `/register` | 226.356 | 226.977 | +621 |
| `/login` | 312.089 | 312.268 | +179 |
| `/onboarding` | 283.072 | 283.210 | +138 |
| `/today` | 328.419 | 328.471 | +52 |
| `/tutor/[id]` | 321.402 | 321.402 | 0 |
| `/review` | 381.674 | 381.761 | +87 |
| `/home` | 381.674 | 381.761 | +87 |
| `/history` | 348.776 | 348.779 | +3 |
| `/blitz` | 279.998 | 280.000 | +2 |
| `/blitz/play` | 372.567 | 372.642 | +75 |
| `/dictionary` | 277.023 | 277.345 | +322 |
| `/admin/packs` | 361.833 | 361.833 | 0 |

## D. Pendências externas e roteiro de aceite

1. **Supabase de homologação.** Confirmar o identificador do projeto, o endpoint de Auth, a URL pública do site e as URLs de redirecionamento antes de criar contas. Usar duas contas de aluno e uma de administrador no ambiente isolado. Conferir que leituras e gravações de cada aluno só atingem seus próprios dados, inclusive revisão e histórico. Exercitar MFA real, renovação, expiração durante atividade e a retomada em outro dispositivo.
2. **E-mail.** Usar uma caixa postal de teste autorizada. Confirmar cadastro pelo link, repetir o link, testar link expirado e reenvio com limite, redefinir senha e entrar novamente. O SMTP do Supabase Auth e o envio dos relatórios com Resend são integrações distintas. Verificar remetente, domínio, entrega, sandbox e URLs de homologação para as duas. Não houve envio real. [Supabase Auth](https://supabase.com/docs/reference/javascript/auth-resend)
3. **iPhone físico.** Usar um aparelho compacto e um com área de segurança, incluindo Safari 16.4 se esse mínimo fizer parte do piloto. Em retrato e paisagem, usar o teclado de login e do Tutor e enviar com o teclado aberto. Abrir/fechar o menu com VoiceOver, ouvir alertas, verificar ações acima da barra inferior e voltar com gesto. Alternar movimento reduzido, sair e voltar à landing, recusar/conceder microfone, bloquear a tela durante gravação e verificar o indicador do microfone ao sair.
4. **Aula em rede instável.** Em homologação, interromper a conexão ao enviar uma revisão, reabrir a atividade, repetir e conferir uma única gravação no histórico do próprio aluno. Testar Safari com pouco espaço e armazenamento indisponível, modo de economia de energia e rede móvel. Repetir offline/online no app instalado, com service worker ativo. Nas matrizes controladas o service worker estava bloqueado para manter cache e rede comparáveis. O teste dedicado de conexão usou o service worker real no Chromium local.
5. **Notificações e Tutor.** Validar push de homologação concedido, negado, revogado e repetido, incluindo dois disparos concorrentes. Conferir respostas reais, tempo de espera, utilidade das correções e disponibilidade de voz. O manifesto de agendamentos versionado não lista relatório semanal nem lembretes de assinatura. Confirmar a programação externa antes de anunciar esses recursos.

## E. Checklist de lançamento

| Prioridade | Critério para avançar |
|---|---|
| **P0 · antes de convidar alunos** | Aceitar a jornada de conta nova e existente com Auth e e-mail de homologação. Comprovar isolamento de dois alunos no banco, persistência após falha e retomada da revisão na conta correta. Há correções locais e evidência de interface para esses caminhos, mas falta o aceite no serviço real isolado |
| **P1 · antes da abertura pública** | Fechar a matriz de iPhone físico e VoiceOver, sessão expirada durante uma aula, entregabilidade e limites do provedor. Confirmar Tutor/voz e as notificações anunciadas. Repetir navegação rápida e observar pedidos RSC em Safari real |
| **P2 · durante o piloto** | Acompanhar LCP e INP reais por aparelho, observar abandono na primeira atividade e identificar se a correção do Tutor ajuda o aluno a tentar de novo. Validar a necessidade de retomada entre dispositivos, deduplicação de push sob concorrência e o volume de leituras do histórico em contas grandes |
| **P3 · evolução comercial** | Definir plano gratuito e premium, política de acesso, cotas e eventos financeiros antes de habilitar cobrança. Reservar uma validação separada em sandbox de pagamentos |

### Preparação para monetização

O repositório já contém `proAccess`, regras de ciclo e carência, interface de assinatura, provedor AbacatePay, webhook, cancelamento e lembretes. Antes de comercializar, definir quais recursos cada plano autoriza no servidor e como as cotas se comportam com requisições simultâneas, inadimplência e mudança de plano. Os limites de proteção de Auth e do Tutor têm finalidade operacional distinta das cotas comerciais.

O cancelamento existente chama o provedor e depois atualiza `pro_entitlements`. A ação precisa conferir a confirmação dessa escrita e reconciliá-la com o provedor se uma etapa falhar. A homologação financeira deve cobrir assinatura, renovação, carência, cancelamento, eventos repetidos ou fora de ordem, estornos, histórico de cobrança por aluno e retenção dos registros. Nenhum fluxo financeiro foi acionado ou alterado nesta auditoria.

## Arquivos da execução

Os caminhos abaixo são relativos à raiz do projeto e foram comparados à cópia da árvore de trabalho anterior à primeira edição. As mudanças que já existiam no Git ficam fora desta relação.

67 arquivos nesta execução, incluindo testes e este relatório.

**Autenticação, sessão e cabeçalhos**

`next.config.ts` · `src/app/(auth)/login/mfa/page.tsx` · `src/app/(auth)/login/page.tsx` · `src/app/(auth)/register/confirmacao/page.tsx` · `src/app/api/login/route.ts` · `src/app/auth/confirm/route.test.ts` · `src/app/auth/confirm/route.ts` · `src/app/auth/new-password/form.tsx` · `src/app/auth/recovery/actions.ts` · `src/app/auth/recovery/recovery.test.ts` · `src/app/signup-actions.test.ts` · `src/app/signup-actions.ts` · `src/components/auth/AuthShell.tsx` · `src/components/auth/ForgotPasswordFormClient.tsx` · `src/components/auth/LoginFormClient.tsx` · `src/components/auth/RegisterFormClient.tsx` · `src/components/auth/ResendConfirmation.tsx` · `src/features/auth/components/MFAVerification.tsx` · `src/features/auth/lib/readMfaState.test.ts` · `src/features/auth/lib/readMfaState.ts` · `src/features/auth/lib/studyReturnPath.test.ts` · `src/features/auth/lib/studyReturnPath.ts` · `src/lib/supabase/session.test.ts` · `src/lib/supabase/session.ts`

**Ações compartilhadas de Tutor e Blitz**

`src/app/actions.ts`

**Blitz**

`src/app/(dashboard)/blitz/play/page.tsx` · `src/features/blitz/components/BlitzClient.tsx` · `src/features/blitz/lib/blitzResultStorage.test.ts` · `src/features/blitz/lib/blitzResultStorage.ts`

**Dicionário**

`src/app/api/dictionary/route.test.ts` · `src/app/api/dictionary/route.ts` · `src/features/dictionary/DictionarySearch.tsx`

**E-mail, push e PWA**

`src/app/api/cron/due-review-notifications/route.ts` · `src/app/api/cron/streak-reminder/route.ts` · `src/app/api/cron/weekly-report/route.ts` · `src/app/api/push/notify/route.ts` · `src/features/pwa/components/PWAExperienceClient.tsx` · `src/features/pwa/promptStorage.test.ts` · `src/features/pwa/promptStorage.ts` · `src/lib/resendMail.test.ts` · `src/lib/resendMail.ts`

**Landing**

`src/components/landing/MindmarketLanding.module.css` · `src/components/landing/MindmarketLanding.tsx`

**Primeiro acesso**

`src/app/onboarding-actions.ts` · `src/features/onboarding/components/OnboardingClient.tsx` · `src/features/onboarding/components/OnboardingPlacementStep.tsx` · `src/features/onboarding/components/OnboardingStarterPackStep.tsx` · `src/features/onboarding/lib/onboardingConnectionError.ts`

**Relatório**

`docs/aceite-piloto-2026-11-19.md`

**Revisão, histórico e recuperação de rotas**

`src/app/(dashboard)/error.tsx` · `src/app/(dashboard)/history/page.tsx` · `src/app/(dashboard)/review/page.tsx` · `src/app/error.tsx` · `src/app/global-error.tsx` · `src/features/review/components/ReviewClient.tsx` · `src/features/review/lib/reviewCardIds.ts` · `src/features/review/lib/reviewRecovery.test.ts` · `src/features/review/lib/reviewRecovery.ts` · `src/lib/timezone.test.ts` · `src/lib/timezone.ts`

**Testes de navegador e dados sintéticos**

`e2e/learning-evolution.config.ts` · `e2e/learning-evolution.spec.ts` · `e2e/learning-fixture.json` · `e2e/learning-readiness.spec.ts`

**Tutor e prática de fala**

`src/features/study/components/LocalSpeakingPractice.tsx` · `src/features/tutor/lib/tutorReply.test.ts` · `src/features/tutor/lib/tutorReply.ts`
