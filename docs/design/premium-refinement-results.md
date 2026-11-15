# Refinamento visual — 11/11/2026

Implementação local concluída sobre o checkout existente. Nenhum commit, push, deploy, reinstalação, alteração de credencial ou gravação de dados reais foi realizado.

A landing agora tem Manrope e DM Sans via Google Fonts, títulos maiores, texto curto, navegação em cápsula, demonstração claramente identificada e carrossel de práticas com teclado/toque e controles de início/fim. O início do aluno prioriza a próxima sessão, com CTA acima do dock em 320 px, superfícies claras, texto carvão e violeta moderado. Navegação, autenticação, estados vazios/carregamento e introdução da prática compartilham o mesmo sistema. A administração recebeu o sistema compartilhado; seus dados e operações permanecem existentes.

A biblioteca abre mostrando a coleção. Criar pack revela e focaliza o formulário; recolher devolve o foco ao botão. Rascunhos manuais e IA sobrevivem às alternâncias. O flashcard ignora atalhos quando o foco está em outro controle, impede respostas duplicadas antes da animação terminar e reinicia a medição de latência por carta. O reset atrasado da revelação foi removido.

O prompt automático de instalação/notificações ficou restrito a `/home`. A remoção do loading global evita que a landing estática permaneça num placeholder quando JavaScript está desativado; loadings específicos das áreas internas foram preservados.

## Verificação e limites

| Verificação | Resultado | Escopo |
| --- | --- | --- |
| Typecheck | Passou | Código do projeto |
| ESLint | 0 erros, 2 avisos anteriores | Variável `_` em `scripts/test-adaptive-db.mjs`; dependência `startCheckout` em BillingSettings |
| Vitest | 68 arquivos, 629 testes passaram | Suite existente |
| Build Next | Passou | Build real local, incluindo fontes |
| Playwright público | 7 testes passaram | Landing real em `next start`; navegação, menu/foco, demonstração, carrossel, planos/FAQ, redução de movimento e conteúdo sem JavaScript |
| Playwright interno | 9 testes passaram | Componentes reais num harness isolado; sem login real nem persistência |
| Repetição do flashcard | 15 execuções passaram | Revelação por teclado e resposta única, com e sem movimento reduzido |
| Matriz responsiva | 65 casos, 0 falhas, 0 pageerrors, 0 erros de console | 13 rotas × 5 dimensões |
| Contraste amostrado | 5,75:1 a 15,66:1 | Textos principais da landing/home; título branco da sessão 13,06:1, CTA 12,38:1 |
| Foco/movimento | Verificado | Retorno de foco em menus e diálogos; 3 ciclos de navegação com Voltar/Avançar, 0 ScrollTriggers órfãos e 0 triggers com movimento reduzido |

Dimensões: 1440×900, 834×1194, 390×844, 320×568 e 844×390. Rotas reais: landing, login e cadastro. Rotas em fixtures: home, explorar, biblioteca, histórico, revisão vazia/ativa/erro, estados de UI, prática e visão geral administrativa. Não houve overflow horizontal nem corte dos controles amostrados; o CTA principal em 320 px ficou acima do dock.

A fixture usa identidades `example.test`, consulta em memória e bloqueio de mutações. O 404 da revisão ativa vinha de um endpoint TTS ausente no harness: foi acrescentada uma resposta WAV silenciosa **somente na fixture**. Isso não valida síntese de voz real. Autenticação, banco, pagamentos, envio de formulários, geração por IA e gravação de progresso não foram verificados de ponta a ponta nesta tarefa. A conferência de contraste é uma amostragem, não uma certificação integral de acessibilidade.

## Evidências

- [Landing completa](../../output/premium-refinement/after/landing-full.png), [landing mobile](../../output/premium-refinement/after/landing-390x844.png) e [carrossel](../../output/premium-refinement/after/landing-practices.png).
- [Home completa](../../output/premium-refinement/after/home-full.png), [desktop](../../output/premium-refinement/after/home-1440x900.png) e [320 px](../../output/premium-refinement/after/home-320x568.png).
- [Biblioteca recolhida](../../output/premium-refinement/after/library-390x844.png) e [criação aberta](../../output/premium-refinement/after/library-create-390x844.png).
- [Landing anterior do checkout](../../output/premium-refinement/before/landing-desktop.png) e [home anterior em fixture](../../output/premium-refinement/before/home-desktop.png). As imagens anteriores documentam o ponto de partida; não representam uma direção aprovada. Os arquivos `public-*` são a versão publicada anterior, consultada apenas em leitura.
- [Matriz detalhada](../../output/premium-refinement/after/responsive-results.json), [Playwright](../../output/premium-refinement/logs/browser.log), [contraste/foco](../../output/premium-refinement/contrast-focus.json) e [logs](../../output/premium-refinement/logs).
- [Lista exata de alterações desta tarefa](../../output/premium-refinement/changed-files.txt) e [manifesto com hashes](../../output/premium-refinement/changed-files.json). Comparação feita contra o snapshot por arquivo, **não contra HEAD**; as alterações anteriores do checkout não são atribuídas a esta tarefa.

## Recuperação e reprodução

O [snapshot](../../output/premium-refinement/snapshot.zip) contém o conteúdo anterior de cada arquivo tocado, com sufixo `.snapshot`, e um manifesto SHA-256. Para recuperar um arquivo, copie apenas seu `.snapshot` para o caminho original indicado no manifesto. Arquivos com `existed: false` foram criados nesta tarefa. O snapshot não inclui `.env`, credenciais, `.git` nem dependências. Não use reset ou restauração em massa sobre o checkout com trabalho anterior.

Os [arquivos do harness](../../output/premium-refinement/ui-fixtures.tar.gz) não contêm dependências ou credenciais. Extraia em um diretório temporário; vincule `src`, `public` e `node_modules` deste checkout. Inicie o Next desse checkout no diretório temporário, com host `127.0.0.1` e porta `3100`. O arquivo tsconfig substitui Supabase e ações específicas por fixtures locais. Não utilize esse harness em produção.

Com o build real servido em `127.0.0.1:3001` e o harness em `127.0.0.1:3100`:

```sh
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 KIVORA_FIXTURE_URL=http://127.0.0.1:3100 pnpm exec playwright test --config=e2e/ui-refinement.config.ts
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 KIVORA_FIXTURE_URL=http://127.0.0.1:3100 node scripts/audit-premium-refinement.mjs
```

O config dedicado não executa o global setup de autenticação/provisionamento do config padrão. `KIVORA_CHROME` pode indicar outro executável Chromium instalado. Os servidores criados pela tarefa foram encerrados após a validação.

Referências visuais consultadas: [Matheus Tur](https://matheustur.com.br/), [Speak](https://www.speak.com/), [Busuu](https://www.busuu.com/) e [Linear](https://linear.app/). São referências de hierarquia e acabamento; não foram copiados conteúdo, identidade ou ativos. Duolingo não foi utilizado como referência.
