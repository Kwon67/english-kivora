# Prontidão global local — 16/11/2026

> Atualização: a [fase 4](fase-4-workflows-2026-11-16.md) acrescenta integração de workflows com PostgreSQL isolado e a [progressão por competências](curriculo-competencias-2026-11-16.md). A matriz abaixo registra o estado de encerramento da fase 3.

## Decisão de aceite

As melhorias locais das três fases estão implementadas, com escopo de aluno e administração. Este aceite refere-se ao checkout e à fixture isolada; não equivale a lançamento em produção nem a cobertura funcional integral de todas as integrações. Cobrança e pagamentos foram excluídos. O visual aprovado foi preservado.

Correção posterior dos metadados: o preset móvel dessa rodada tinha viewport efetivo de 390×664. Na fase 4, a configuração foi fixada explicitamente em 390×844 e a regressão foi repetida.

A matriz abaixo distingue **implementado**, **testado localmente** e **pendente**. Abrir uma rota sem erro, com título e sem overflow não prova que todos os botões, permissões, dados e serviços dessa área funcionam em produção.

## Correções desta fase

1. **Adicionar palavra:** rascunho em sessionStorage por usuário, destino da coleção restaurado e aviso quando armazenamento falha. Envio sem confirmação mantém o mesmo ID após recarga, para retentar sem duplicar. Rascunhos antigos sem proprietário identificável não são migrados entre contas.
2. **Tutor:** autenticação na página de servidor; componente de conversa separado; chamada assíncrona fora do atualizador de estado; trava síncrona contra duplo envio. Falha conserva a mensagem e oferece retentativa sem duplicação. Recarga restaura conversa/entrada nesta aba por usuário e cenário, limitada às últimas 24 mensagens. Reiniciar ou sair invalida respostas atrasadas. Áudio só por escolha explícita, com cancelamento, limpeza de URL e recuperação de erro; nenhum TTS ao abrir ou reiniciar.
3. **Administração:** leitura inicial de packs e atribuições tem carregamento, erro persistente e retentativa. Falhas parciais não viram contagens zero nem listas vazias aparentemente válidas. Seleção de cards de uma regra descarta leituras antigas, sinaliza erro e impede envio enquanto indisponível. Operações de grupos, modelos, regras e exclusões apresentam falhas na interface e preservam formulário quando a alteração não é confirmada.
4. **Dicionário:** busca cancelada ao sair e resposta cancelada não substitui o resultado. Falha e pesquisa sem verbete têm estados distintos; texto permanece pesquisável novamente.
5. **Editorial:** 116 propostas classificadas, 32 correções objetivas PT ensaiadas em cópia local e 84 decisões preservadas sem aplicação. A tradução contextual “Infelizmente…” para `I am afraid…` permanece aceita.

## Matriz — aluno

Todas as rotas abaixo já tinham implementação; “abertura” significa resposta 200, h1 visível, ausência de exceção de página e de overflow horizontal na fixture Chrome desktop/móvel. Dados e serviços são sintéticos. O teste móvel usa viewport 390×664 em Chrome, não Safari nem aparelho físico.

| Rota / fluxo | Implementado e verificado localmente | Pendente / limite da evidência |
|---|---|---|
| `/home` | Abertura; navegação global, menu por teclado e retorno de foco | Agregados reais e permissões por perfil |
| `/today` | Seis contextos A1–C2, escrita/reescrita, recarga; viagem A1–A2 em três episódios e transferência; primeira escolha/dica/autoavaliação separadas; gravação sintética libera recursos | Calibração docente, áudio/fala em aparelhos reais; sincronização produtiva desabilitada até migration aprovada |
| `/courses` | Abertura e separação da navegação Hoje/Revisar | Progressão curricular completa e desbloqueios com dados reais |
| `/study` | Abertura e acesso à prática | Combinações de trilha/adaptação com dados de produção |
| `/review` | Falha não avança; retentativa grava uma vez; reaprendizagem sobrevive à recarga; fase guiada restaura; fila vazia tem próximo passo | Comportamento longitudinal do SRS e latência real |
| `/add` | Abertura; isolamento de rascunho entre contas, restauração da coleção e envio com resposta perdida/recarga/retentativa sem duplicação | Escrita real sob RLS; migração intencionalmente ausente do rascunho legado sem dono |
| `/dictionary` | Abertura; erro 503, nova busca, tradução e ausência de verbete distinguidos em resposta simulada | Disponibilidade, qualidade e latência dos provedores externos |
| `/library` | Abertura; código de erro de carregamento existente inspecionado | CRUD, busca/paginação e reconciliação de coleções sob RLS em ambiente autorizado |
| `/explore` | Abertura do catálogo | Importação/atribuição real e combinações de falha das fontes |
| `/explore/pack/[id]` | Abertura de pack sintético | IDs inválidos, acesso privado e importação real |
| `/generate` | Abertura da interface | Geração e persistência de conteúdo; sem chamada paga |
| `/problem-words` | Abertura | Agregados de erros reais e atualização após nova prática |
| `/history` | Abertura, rótulos que distinguem prática, evidência e autoavaliação; recuperação de prática na conta pela fixture PGlite | Histórico produtivo, volumes e políticas reais |
| `/tutor` | Abertura do catálogo de cenários | Qualidade/calibração de respostas e classificação dos cenários |
| `/tutor/[id]` | Cenário válido; cenário inexistente com saída útil; falha/retentativa, recarga, reinício com resposta atrasada e erro de áudio; nenhuma geração automática de áudio | Modelo/TTS reais, permissão de microfone e reconhecimento nativo; rascunho apenas na aba, sem sincronização entre dispositivos |
| `/blitz` | Abertura | Concorrência/pareamento reais |
| `/blitz/play` | Abertura | Ciclo completo em tempo real com dois participantes e reconexão |
| `/blitz/ranking` | Abertura | Consistência e atualização do ranking real |
| `/settings` — preferências/privacidade | Abertura da página; nenhuma interação com cobrança | Persistência de preferências, exportação/exclusão e sessões reais; cobrança fora do escopo |
| `/onboarding` | Cadastro sintético → confirmação → onboarding → primeira atividade | E-mail entregue e sessão real em outro dispositivo |
| `/exam/[level]` | Abertura A1; reaproveita modo com alternativas válidas e áudio recuperável | Calibração psicométrica, cobertura dos seis níveis e decisões de progressão |
| `/play/[assignmentId]` | Abertura; resultado com falha retentado sem duplicar; uma carta usa atividade sem pontuação, sem alternativas fabricadas | Todos os modos/combinações de tarefas em produção |

## Matriz — administração

| Rota / fluxo | Implementado e verificado localmente | Pendente / limite da evidência |
|---|---|---|
| `/admin` | Redirecionamento existente inspecionado; destino testado | Autorização real e matriz de papéis |
| `/admin/dashboard` | Abertura | Contagens reais, volumes e atualização após mutações |
| `/admin/packs` | Abertura; falha de leitura persistente → retentativa → lista | CRUD/importação/uploads/geração e autorização reais |
| `/admin/assign` | Abertura, abas; falha de fonte impede lista parcial; retentativa; falha nos cards impede ativar regra; recuperação; mutação rejeitada preserva formulário e mostra alerta | CRUD completo de tarefas, grupos, modelos, missões e regras; disparo de cron, destinatários e concorrência reais |
| `/admin/members` | Abertura | Convites, criação, exclusão e alterações de papéis reais; nenhum usuário criado |
| `/admin/members/[userId]` | Abertura de usuário sintético | Usuário ausente, fronteiras de acesso e modificações de conta |
| `/admin/reports` | Abertura; paginação de relatório além de 1.000 registros em testes de lógica; PDF válido e estado vazio honesto | Consistência com dados reais em volume e revisão humana do relatório |
| Fronteiras de erro de aluno/admin | Botão recupera rota e restaura foco na fixture | Falhas específicas de todos os provedores não foram exauridas |

## Autenticação, páginas públicas e dependências transversais

| Área | Evidência / situação |
|---|---|
| `/register`, `/auth/confirm`, onboarding | Fluxo sintético com erro, retentativa, confirmação e primeira atividade; nenhum e-mail nem usuário real |
| `/login`, `/login/mfa`, `/forgot-password` | Código e build existentes; autenticação/MFA/recuperação reais não executados nesta fase |
| `/`, `/terms`, `/privacy`, `/offline`, not-found | Incluídos no build; não são apresentados como validação funcional/manual completa |
| Navegação e acessibilidade | Menu com teclado, retorno de foco, abas, foco após transições, alertas e estados de carregamento; não equivale a auditoria WCAG completa ou teste de leitor de tela |
| Armazenamento | Recuperação por usuário na aba e persistência contextual via PGlite testadas; armazenamento bloqueado tem aviso em prática. SessionStorage termina com a sessão da aba e não é backup na nuvem |
| E-mail/domínio | Auditoria anterior somente leitura: confirmação exigida, Resend local em sandbox e nenhum domínio Kivora personalizado listado. SMTP efetivo, redirect allowlist e entrega continuam não provados |

## Evidência executável

- Configuração: `e2e/learning-evolution.config.ts`; somente Chrome desktop 1440×1000 e Chrome mobile 390×664.
- Fixture reproduzível: `e2e/learning-fixture.json` → `scripts/prepare-learning-fixture.mjs`; não copia `.env`, bloqueia destinos externos e substitui mutações/modelos por respostas sintéticas.
- Integração contextual: servidor PGlite em memória, isolado, com perda de resposta, repetição e recuperação em outra sessão.
- `e2e/learning-global.spec.ts`: 27 rotas × 2 viewports; abertura, título e overflow, não CRUD integral.
- `e2e/learning-readiness.spec.ts`: cenários de rascunho, tutor, administração e dicionário desta fase.
- `e2e/learning-evolution.spec.ts`: regressão das atividades, revisão, navegação, áudio, cadastro, PDF e persistência das fases anteriores.
- `scripts/test-editorial-copy.mjs`: validação offline da proposta editorial, incluindo preservação da variante questionada.

Resultado final: **130/130 cenários de navegador**, **793/793 testes unitários em 88 arquivos**, **3/3 testes editoriais**, typecheck e build aprovados. Lint: zero erros e um aviso preexistente (`_` não usado em `scripts/test-adaptive-db.mjs`). `git diff --check` sem problemas. O manifesto da fixture coincide com os 68 arquivos materializados e não contém `.env`.

| Verificação | Log local |
|---|---|
| Regressão completa Chrome desktop/móvel | `output/learning-evolution/browser-phase3-final.log` |
| 22 cenários específicos desta fase | `output/learning-evolution/readiness-after.log` |
| 793 testes unitários | `output/learning-evolution/unit-phase3.log` |
| Cópia editorial, preservação e conflitos | `output/learning-evolution/editorial-validation.log` |
| Typecheck | `output/learning-evolution/typecheck-phase3.log` |
| Lint | `output/learning-evolution/lint-phase3.log` |
| Build | `output/learning-evolution/build-phase3-final.log` |

O ensaio inicial reproduziu quatro falhas dos fluxos então existentes. A regressão também revelou um alerta colocado dentro da aba errada; a correção foi retestada antes do resultado final acima. Nenhuma falha conhecida desses cenários ficou aberta.

## Aceite e pendências de lançamento

- **Aceito localmente:** correções funcionais acima, proposta editorial completa e matriz de cobertura. Sem mudança cosmética ampla.
- **Deploy/autorização:** nenhuma publicação, push, migration remota, alteração de ambiente, seed ou escrita produtiva. A migration contextual e a flag permanecem propostas locais; aplicar exige decisão explícita e validação própria. O lote editorial não é migration executável em produção.
- **Calibração humana:** professor/revisor deve validar objetivos, sequência, contexto, carga, critérios de avaliação e nível. Ler 2.213 pares não demonstra cobertura A1–C2 nem eficácia de aprendizagem. Há apenas uma amostra de contextos e uma unidade de viagem, não seis currículos completos.
- **Acesso externo:** e-mail real, autorização por papéis/RLS produtiva, TTS/modelo, geração, uploads, tempo real e notificações continuam dependências de teste em ambiente autorizado.
- **Safari/aparelho físico:** validação final expressamente adiada pelo proprietário para quando estiver em casa. Não executada nesta fase; nenhum desbloqueio tentado. WebKit não foi usado.

## Referências

- [Fase 1 — evolução de aprendizagem](evolucao-aprendizagem-2026-11-16.md)
- [Fase 2 — viagem e auditoria do catálogo](expansao-viagem-e-catalogo-2026-11-16.md)
- [Decisões editoriais e 32 pares antes/depois](catalogo-decisoes-editoriais-2026-11-16.md)
- [Manifesto editorial com 116 decisões](catalogo-decisoes-editoriais-2026-11-16.json)
