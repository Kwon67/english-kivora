# Unidade local: viagem, transferência e auditoria editorial

> Atualização de encerramento: a validação final em Safari/aparelho físico foi expressamente adiada pelo proprietário para quando estiver em casa. Não é necessário desbloquear o Mac para concluir as verificações locais. Consulte a [matriz de prontidão](prontidao-global-2026-11-16.md).

## Escopo e critérios de conclusão

Preservar o checkout e o servidor de prévia existentes. Não enviar e-mails reais, criar usuários reais, escrever no Supabase, fazer deploy/push ou alterar pagamentos. Safari real e WebKit automatizado terão evidências separadas.

1. **Viagem A1–A2 em três episódios:** chegar à cidade, resolver um pedido no hotel, combinar um passeio. Cada episódio reutiliza Hoje e contém objetivo comunicativo, compreensão verificável, produção escrita/oral opcional, explicação, reescrita e recuperação da habilidade anterior. Uma próxima ação principal por sessão; progresso por usuário, sem desbloquear CEFR.
2. **Transferência:** situação nova (alteração de reserva de uma atividade), sem modelo antes da primeira resposta e com apoio opcional registrado. Distinguir primeira escolha observada, consulta a dicas e autoavaliação da produção. Não chamar gravação ou checkbox de fala avaliada.
3. **Cadastro mobile até primeira atividade:** exercitar componentes reais em fixture sem envio, erros/retentativa/confirmar/retomar/onboarding. Auditar configurações reais por leitura; teste isolado não prova entrega de e-mail.
4. **Editorial:** ler o catálogo em lotes, registrar IDs/revisão/achados/recomendações e propostas locais. Avaliação linguística assistida não certifica CEFR. Não substituir revisão por regra de comprimento; objetivo/tarefa/modalidade precisam acompanhar o nível.
5. **Visual:** corrigir hero após início, foco abaixo do header sticky, disclosure consistente e localização Hoje/Revisar. Verificar Safari real desktop/responsivo e registrar estado/viewport; não afirmar teste em iPhone físico.

## Auditoria de domínio e e-mail — leitura em 16/11/2026

- Vercel, projeto vinculado localmente: somente `english-kivora.vercel.app`, verificado, sem domínio personalizado listado.
- Inventário de variáveis de produção: não listou `RESEND_API_KEY`, `KIVORA_EMAIL_DOMAIN`, `RESEND_FROM`, `RESEND_SANDBOX_MODE` ou `NEXT_PUBLIC_SITE_URL`; consulta sem descriptografar segredos, `hiddenProductionEnvCount=0`.
- Ambiente local: URL pública acima; `RESEND_SANDBOX_MODE=true`; chave/remetente/destinatário sandbox presentes, valores privados omitidos; `KIVORA_EMAIL_DOMAIN` ausente.
- GET autenticado de domínios Resend com chave local: `recantoxingo.com.br` verificado. Isso não configura automaticamente remetente Kivora nem prova uso desse domínio no SMTP do Supabase.
- GET `/auth/v1/settings`: cadastro habilitado, provedor email habilitado e `mailer_autoconfirm=false`. Confirmação é exigida.
- O cadastro chama `supabase.auth.signUp` com redirecionamento `/auth/confirm`. A rota troca código PKCE por sessão e encaminha ao onboarding; em erro oferece login, sem presumir sessão confirmada em outro dispositivo.
- SMTP personalizado, allowlist de redirects e template efetivo não são expostos pelos tools de leitura consultados. Entrega real, reputação do remetente, caixas de spam e confirmação por e-mail seguem não verificadas. Nenhum e-mail enviado e nenhum usuário criado.

## Safari independente — condições recebidas

Safari real no Mac, fixture A1 `/today`, até “Usar”, sem envio de texto. Modo responsivo 390×844 sem overflow lateral visível, textarea/CTA cabendo e navegação inferior clara. Não é integração produtiva nem iPhone físico. Achados: hero grande durante exercício, título sob header após transição, disclosure inconsistente e “Revisar” ativo em Hoje. Captura passiva adicional em `output/learning-evolution/safari-today-baseline.png`; janela 2090×1712 pixels, viewport CSS ainda não medido por esta execução.

## Execução

Expansão implementada e validada localmente conforme registros abaixo. Verificação final no Safari depende do desbloqueio do Mac.

## Implementação entregue localmente

- `TravelToday` conduz aeroporto → hotel → passeio → oficina. Cada episódio recupera uma habilidade anterior e oferece uma próxima ação principal. A oficina muda a situação e os destinatários; modelo, explicação e shadowing só aparecem depois da primeira produção. Consultar contexto ou voltar para alterar a produção depois do modelo registra uso de apoio.
- `TodaySession` mantém primeira escolha de compreensão, última escolha, texto inicial, reescrita, critérios informados pelo aprendiz, consulta de apoio e relato de prática oral. A primeira escolha é observada na interface; não é prova autenticada de proficiência. Escrita/fala não recebem nota automática.
- Gravação opcional com `MediaRecorder`: somente após clique, máximo de 60 segundos, reprodução local, tracks encerradas e URL de Blob revogada ao sair. Sem upload, transcrição, geração paga ou análise de sotaque. Recusa do microfone permite continuar. O teste de ciclo de gravação usa microfone sintético; captura acústica real permanece não verificada.
- Padrão de Hoje para perfis A1/A2 passa a ser a viagem; as seis sessões por faixa continuam em `?level=...`. `?unit=travel` abre o piloto explicitamente. Onboarding concluído encaminha para Hoje.
- Hero compacto após início; foco/scroll considera a borda real da navegação; disclosures com o mesmo marcador; Hoje tem destino e estado ativo próprios, separados de Revisar.
- Persistência opcional inclui os novos campos, recuperação da próxima situação na conta e histórico que separa compreensão de autoavaliação. **Flag continua desligada por padrão; migração e rollback apenas locais.** Nenhum registro de produção foi criado.
- Cadastro tem trava síncrona contra submissões simultâneas. Fixture usa o formulário, callback de confirmação e onboarding reais, com ações/identidades sintéticas. Cobre senhas diferentes, indisponibilidade, retentativa, correção de e-mail, callback inválido/válido, onboarding sem teste adaptativo e primeira atividade concluída. Não cobre entrega de e-mail nem prova SMTP produtivo.

## Revisão editorial completa dos pares

[Relatório editorial](catalogo-revisao-editorial-2026-11-16.md) e [registro com IDs e hashes](catalogo-revisao-editorial-2026-11-16.json): 14 lotes, 185 packs, 2.213 pares únicos lidos (2.173 públicos, 40 privados), 116 achados específicos. Foram revisados sentido, naturalidade, equivalência EN/PT e adequação da tarefa ao nome/faixa declarada. As propostas não são alterações aprovadas/publicadas nem certificação CEFR. Permanecem pendentes audição, origem/licença e calibração com aprendizes. Os textos privados não foram reproduzidos nas propostas.

## Validação desta expansão

- Unitários: 88 arquivos, 793 testes aprovados.
- Typecheck aprovado; lint sem erros e um aviso preexistente em `scripts/test-adaptive-db.mjs` (`_` não usado).
- Build otimizado local aprovado. Primeira tentativa dentro do sandbox ficou sem progresso e foi interrompida; execução autorizada fora dessa restrição concluiu.
- PostgreSQL em memória: migração, RLS de proprietário, bloqueio anônimo, isolamento entre usuários, imutabilidade, campos controlados pelo servidor, conflito/retentativa e rollback aprovados.
- Chrome desktop 1440×1000 e Chrome com viewport móvel 390×664 (medida efetiva do preset, corrigida na fase 4): 108 cenários aprovados na suíte final, sem falhas, skips ou flakiness, cobrindo rotas, recuperação, navegação, sequência de viagem e cadastro isolado; nenhuma chamada de aplicação fora de localhost nos testes. Configuração agora exclui WebKit.
- Verificações adicionais: avanço da viagem retomado em nova sessão sem localStorage; primeira escolha errada preservada após correção; recurso do microfone encerrado ao concluir; captura mobile sem overflow horizontal.
- Safari real: a evidência independente anterior foi limitada à fixture A1 até Usar. A revalidação desta versão não pôde ser concluída porque o Mac estava bloqueado; foi solicitado desbloqueio. Não chamar emulação Chrome de Safari ou de iPhone físico.
- A revisão automática rejeitou o comando inicial que incluía WebKit, citando restrição do usuário. A alternativa autorizada usa somente Chrome. Não houve execução bem-sucedida de WebKit nesta expansão.

## Limites remanescentes

Não houve deploy, push, envio de email, criação de usuário real, mudança de domínio/DNS, cobrança, geração paga, aplicação de migração ou alteração do catálogo remoto. A unidade é um piloto original A1–A2, não um curso completo A1–C2 validado. Revisão de pares não prova qualidade de todos os distratores gerados nem adequação de áudio. Entrega real de email, SMTP/redirect allowlist efetivos, Safari após correções e interação oral avaliada continuam sem comprovação.


## Evidências locais e reprodução

- `output/learning-evolution/browser-phase2-final.log` e `browser-results.json`: resultado final da suíte.
- `output/learning-evolution/build-phase2-final.log`, `typecheck-phase2.log`, `unit-phase2.log`, `lint-phase2.log`: verificações do código.
- `output/learning-evolution/travel-viewport-desktop.png` e `travel-viewport-mobile-chromium.png`: conclusão do primeiro episódio, com navegação e próxima ação.
- `output/learning-evolution/travel-transfer-desktop.png` e `travel-transfer-mobile-chromium.png`: transferência concluída; capturas de página inteira podem posicionar a navegação sticky no ponto de scroll da captura.
- Ledger conferido contra todos os IDs do snapshot: 2.213 únicos, nenhum ausente/duplicado, 185 hashes de packs correspondentes, 116 achados ligados a cartões existentes.

A fixture materializa `e2e/learning-fixture.json` via `node scripts/prepare-learning-fixture.mjs` sem copiar `.env`; Next em 127.0.0.1:3210, API PGlite sintética em 127.0.0.1:3211. Os servidores existentes foram preservados; apenas a API em memória foi reiniciada para incluir os novos campos locais. Rodar a suíte com `KIVORA_CHROME_EXECUTABLE='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' node_modules/.bin/playwright test -c e2e/learning-evolution.config.ts`. Não usar o comando E2E padrão que carrega credenciais reais.
