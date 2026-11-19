# Refinamento visual — Prática por competências

A página `/practice-path` agora compartilha a linguagem de Hoje, Trilhas e Coleção: verde para a próxima ação, papel claro nos cartões, tipografia editorial, bordas arredondadas e espaçamento legível.

## Entrega

- Entrada direta **Prática por competências** no menu principal aberto, desktop e mobile. A rota deixa de ser um destino secundário ativo de Trilhas.
- Cartão de acesso em Trilhas, com o mesmo componente no app e na prévia materializada. O manifesto `e2e/learning-fixture.json` corresponde à prévia.
- Próxima prática destacada, seletor de faixa compacto, contador de práticas registradas, cartões com estados escritos e ícones, acesso ao histórico e exportação.
- Conversa, transferência e mediação organizadas em cartões. Campos maiores, instruções associadas aos campos, foco visível, áreas de toque e indicação textual para réplicas ainda bloqueadas.
- Conteúdo curricular, regras de conclusão, recuperação, formato de armazenamento e exportação preservados. Nenhuma alteração de backend nesta rodada.

## Verificação

- Typecheck e ESLint dos componentes alterados: passaram.
- 13 testes de sequência, portfólio e navegação: passaram.
- Chrome isolado em 1440, 768, 390 e 320 px: acesso pelo menu e Trilhas; fluxo de leitura e revisão; réplicas; retomada após recarga; recuperação preservando texto; registro liberando a prática seguinte; exportação preservando respostas. Sem overflow horizontal, erros de JavaScript ou gravações de rede.
- Teclado em 1440, 1024, 768, 390 e 320 px: um único destino ativo no menu, retorno do foco ao fechar, acesso à prática com Tab/Enter, foco visível e título abaixo da navegação.
- Capturas de Hoje, Trilhas e Coleção comparadas com a nova sequência. Revisão visual das capturas desktop, tablet, mobile, formulário e menu.

Evidências e scripts isolados em `output/learning-evolution/`: `design-browser.log`, `design-keyboard.log`, `check-practice-design.cjs`, `check-practice-keyboard.cjs` e imagens `design-*.png`.

A prévia apresentou temporariamente erro 500 enquanto o import de CSS existia antes da criação do novo arquivo; a compilação foi recuperada. O servidor de desenvolvimento está vinculado somente a `127.0.0.1:3210`. Os bancos de teste não foram iniciados nem resetados; Safari, sessão e respostas de Bruce não foram manipulados. A revisão independente no Safari nativo confirmou Hoje → menu → Prática por competências em desktop e no modo responsivo 390×844, sem preencher respostas. Não equivale a teste em iPhone físico. Sem deploy ou push.

## Ajuste final do menu

A revisão Safari apontou uma barra horizontal discreta no drawer. A animação de entrada dos grupos deslocava o conteúdo 24 px e gerava overflow transitório de 12 px. O contêiner agora limita o eixo horizontal, mantendo rolagem vertical. Chrome com animação normal em 320, 390 e 768 px confirmou largura rolável igual à largura interna depois da animação, nenhum link cortado, acesso ao último item e retorno do foco. Evidência: `output/learning-evolution/design-drawer.log`. Esta correção final foi verificada no Chrome, após a revisão independente Safari.
