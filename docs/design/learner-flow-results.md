# Trilha compacta, movimento e cartões

Verificação local de 11/11/2026. A [demonstração da trilha](http://192.168.101.142:3100/trail) usa componentes reais com dados fictícios e ações substituídas. A [prévia pública](http://192.168.101.142:3000/) continua ativa. Esses endereços HTTP servem para conferir a interface; não inserir credenciais reais.

## Resultado

- A trilha mostra a última lição concluída e até três próximas, em linhas de 72 px no celular e 76 px no desktop. Títulos longos podem aumentar a altura: em 320 px, “Perguntas essenciais” ocupa 78,3 px. As três primeiras linhas cabem acima do dock, inclusive ao usar o atalho da home.
- Revisar, continuar e começar ficam diretamente na linha. Detalhes permanecem opcionais. Cliques repetidos são bloqueados enquanto a ação está em andamento; a falha mantém a ação disponível e informa o problema.
- Uma superfície por nível substitui as caixas sobrepostas. Lições concluídas têm a mesma aparência. Texto, seta e `aria-expanded` acompanham a expansão do histórico. Foram removidos o botão flutuante e a barra redundante; o título da home ficou “Sua trilha”.
- GSAP anima a entrada e a saída dos menus, o fundo e os grupos de navegação, além de expandir/recolher os níveis. O menu permanece montado durante o fechamento. Escape, retorno de foco e preferência por movimento reduzido foram verificados.
- O raio medido no cartão interno de digitação era **20 px CSS**, com DPR 3 no perfil de iPhone. Esse valor foi preservado em `--kivora-card-radius` e compartilhado por cartões da landing, home, prática e demais superfícies com o raio semântico. Botões, inputs, avatares e pills mantêm sua geometria funcional; as linhas das lições continuam planas dentro do nível.
- O foco nos controles que ocupam toda a largura fica dentro da borda, sem ser cortado. O atalho `#trilha` usa uma margem curta, pois o contêiner já reserva espaço para o cabeçalho.

## Caminhos principais

Contagem a partir da tela indicada, até chegar à página de destino; a preparação da sessão pode exigir sua própria ação.

| Caminho | Ações | Verificação |
| --- | ---: | --- |
| Home → lição em andamento | 1 | Navegador, destino fictício |
| Linha da trilha → revisar/iniciar | 1, antes 2 | Navegador, ação substituída; nenhuma gravação real |
| Linha em andamento → continuar | 1 | Navegador, link direto |
| Home → trilha | 1 | Navegador, cabeçalho e três linhas visíveis em 320 px |
| Home → revisão | 1 | Navegador, estado sem revisões |
| Home → progresso | 1 | Navegador |
| Mais → progresso | 2 | Navegador; três ciclos com Voltar/Avançar |
| Erro da revisão → início | 1 | Navegador, erro simulado |
| Detalhes de lição → fechar | 1 | Escape devolve o foco ao disparador |

Biblioteca e preferências continuam nas opções existentes de navegação. Esta etapa não concluiu sessões nem validou persistência, login real, pagamentos ou voz real. Carregamento, revisão vazia e falhas controladas foram inspecionados no ambiente isolado.

## Verificação

- 16 testes de fluxo em WebKit/iPhone e Chrome: compactação, ações, falhas, menus em movimento, foco, navegação, redução de movimento e uniformidade dos cartões.
- 14 testes públicos no IP local: hidratação, menu com/sem JavaScript, âncoras e proteção dos formulários. O endpoint de login foi interceptado e recebeu apenas valores sintéticos.
- 629 testes unitários, em 68 arquivos, aprovados durante esta etapa; alterações posteriores ficaram restritas a estilos, espaçamento e testes de navegador.
- Typecheck e build aprovados. Lint: nenhum erro; dois avisos preexistentes em `scripts/test-adaptive-db.mjs` e `BillingSettings.tsx`. `git diff --check` aprovado.
- Capturas em 320, 390 e 1440 px: sem overflow horizontal. Menus foram observados em quadros intermediários de abertura/fechamento. Não restaram tweens nem ScrollTriggers associados a elementos removidos após os ciclos de navegação.

## CSS e indicador do Next

O estado sem estilos da captura enviada não foi reproduzido. Tanto a porta 3000 quanto a 3100 entregaram as regras de trilha, menu e cartões em contexto WebKit novo e após recarregar. Durante a mudança real de CSS, abas mantidas abertas receberam o token e o raio atualizado; as linhas conservaram `display: grid` e altura mínima de 72 px, sem falhas de requisição. Isso comprova o comportamento testado, mas não identifica a causa da captura original nem substitui uma nova conferência no aparelho.

O “1 Issue” original também não foi reproduzido. Nas capturas atuais há apenas o botão normal “Open Next.js Dev Tools”, sem indicador de problemas e sem erros de página/console no WebKit. O indicador não foi ocultado nem reposicionado. Seu botão de desenvolvimento ainda pode sobrepor parte do dock; ele não integra a interface de produção. Nenhuma causa foi atribuída ao aviso sem evidência.

## Evidências e preservação

- [Trilha, 390 px](../../output/learner-flow/after/trail-390x844.png), [320 px](../../output/learner-flow/after/trail-320x568.png) e [1440 px](../../output/learner-flow/after/trail-1440x900.png).
- [Trilha no contexto da home](../../output/learner-flow/after/home-trail-390.png), [foco em 320 px](../../output/learner-flow/after/trail-focus-320.png) e [cartão de digitação](../../output/learner-flow/after/typing-390.png).
- [Medições responsivas](../../output/learner-flow/probe.json), [medição original do raio](../../output/learner-flow/typing-radius-before.json), [checagens visuais](../../output/learner-flow/visual-checks.json) e [quadros do menu](../../output/learner-flow/sheet-frames.json).
- [Entrega inicial de CSS](../../output/learner-flow/css-delivery-before.json), [atualização do token](../../output/learner-flow/css-hmr-token.json) e [atualização dos cartões](../../output/learner-flow/css-hmr.json).
- [Testes de fluxo](../../output/learner-flow/browser-results.json), [testes públicos](../../output/learner-flow/public-browser-results.json) e [logs](../../output/learner-flow/logs).
- [Manifesto desta etapa](../../output/learner-flow/changed-files.json), [snapshot anterior por arquivo](../../output/learner-flow/snapshot.zip) e [harness isolado](../../output/learner-flow/ui-fixtures.tar.gz).

O snapshot foi feito sobre o checkout já modificado, antes de cada arquivo ser alterado nesta etapa; não usa o HEAD como base de restauração. Sem commit, push, deploy, reinstalação, troca de branch ou escrita no banco. HEAD preservado em `4c9527d9`. Os servidores 3000 e 3100 foram mantidos ativos.
