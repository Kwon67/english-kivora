# Correção da prévia no iPhone — 11/11/2026

A prévia de interface permanece disponível em **http://192.168.101.142:3000/**. O endereço limpo de login é **http://192.168.101.142:3000/login**, apenas para inspecionar a interface nesta prévia. **Não inserir credenciais reais enquanto ela usar HTTP.** HTTP não cifra o tráfego na rede; o fallback GET anterior também podia colocar campos no endereço, histórico e logs. Não há evidência de acesso por terceiros. Nenhuma credencial real foi usada nos testes do agente. Autenticação real depende de uma origem HTTPS confiável; instalar certificados, criar túnel ou publicar exige autorização específica.

## Causa verificada

O servidor Next 16.4.6 em desenvolvimento bloqueava o WebSocket `/_next/hmr` quando a origem era `192.168.101.142`. Os scripts HTTP retornavam sem falhas/404, mas os handlers da interface não ficavam disponíveis nesse cenário. No mesmo WebKit e código, `localhost` abria o menu normalmente; pelo IP, o menu permanecia inerte tanto na demonstração quanto no CTA final. Depois de acrescentar **somente esse IP** a `allowedDevOrigins`, a hidratação e os dois pontos de toque funcionaram, sem erros de console no WebKit. O Next reiniciou seu processo de desenvolvimento automaticamente ao detectar o ajuste, mantendo a porta 3000 e o endereço LAN.

A ausência de handlers também expunha um defeito independente: formulários com `onSubmit` sem método HTML explícito podiam cair no GET nativo. Nenhum URL ou valor real do relato foi reproduzido, copiado ou incluído neste relatório.

## Alterações

- Acrescentado somente `192.168.101.142` à configuração já existente de origens de desenvolvimento, após autorização específica. Nenhuma outra configuração de segurança, firewall, credencial ou acesso público foi alterada.
- Formulário compartilhado com `method="post"` e campos desabilitados até a hidratação. Aplicado a login, cadastro, confirmação de cadastro, recuperação e MFA. Fluxos e handlers de autenticação existentes preservados.
- Menu HTML nativo de reserva antes da hidratação e sem JavaScript; depois da hidratação, mantém o drawer e seu retorno de foco.
- Setas Unicode da demonstração, planos e CTA final substituídas por SVG/Lucide, sem depender da fonte de emoji do iOS. Arte decorativa com dimensões explícitas no mobile.
- Placeholders em português e marca “Kivora Inglês” consistente no topo/rodapé da autenticação. Margem de rolagem nos controles para respeitar o cabeçalho fixo.

## Verificação

| Teste | Resultado e limite |
| --- | --- |
| Playwright específico + regressão pública | 14 testes específicos e 7 testes existentes da landing passaram |
| WebKit com perfil iPhone, pela URL LAN | Menu por toque na demonstração e no CTA final; fechamento, retorno de foco, links e demonstração funcionando |
| Chromium mobile, pela URL LAN | Mesmo fluxo funcional; permanecem avisos do navegador relativos ao HTTP da LAN, sem alteração dos headers de segurança |
| Sem JavaScript, WebKit e Chromium | Menu nativo funcionando nos dois pontos; login, cadastro e recuperação com campos desabilitados e método POST |
| Submissão nativa forçada, interceptada pelo navegador | Apenas POST, sem query string; nenhuma requisição de autenticação enviada ao backend |
| Login hidratado, endpoint interceptado | POST para `/api/login`, sem credenciais na URL; resposta simulada exibida pela UI |
| Anchors e teclado | Títulos abaixo do cabeçalho; controles focados visíveis. No WebKit/macOS foi usado Option+Tab para incluir links; `body` não é tratado como controle |
| Capturas | WebKit em 390×844, 320×568 e 844×390; login vazio e menu sem JS também registrados |
| Typecheck, lint e testes unitários | Typecheck passou; lint sem erros e com os mesmos 2 avisos anteriores; 68 arquivos / 629 testes passaram |
| Build e whitespace | Build Next passou; `git diff --check` sem apontamentos |

A falha inicial do teste de bounds (`y=-1096`) era a posição do `body` após Tab sair dos controles no Safari, não um botão coberto pelo cabeçalho. O teste passou a verificar elementos focáveis reais, usar a navegação completa do WebKit e exigir múltiplos controles efetivamente conferidos.

**Limites:** a validação usa o motor WebKit instalado no Mac com perfil/toque de iPhone e acesso pela LAN; não é controle remoto do iPhone físico. O login foi interceptado com dados sintéticos, sem validar uma conta real, senha, sessão, pagamento ou gravação de banco. Os screenshots originais foram analisados no chat coordenador; os arquivos abaixo são capturas novas produzidas nesta verificação. O servidor do usuário foi mantido ativo, e nada foi publicado.

## Evidências e reprodução

- [Diagnóstico anterior pela LAN](../../output/iphone-fix/before/diagnostics.json), [controle localhost](../../output/iphone-fix/before/localhost-diagnostics.json) e [diagnóstico depois da correção](../../output/iphone-fix/after/diagnostics.json).
- [CTA com SVG](../../output/iphone-fix/after/webkit-final-390x844.png), [menu após rolagem](../../output/iphone-fix/after/webkit-menu-scrolled-390x844.png), [login corrigido](../../output/iphone-fix/after/webkit-login-390x844.png) e [menu sem JS](../../output/iphone-fix/after/webkit-menu-no-js.png).
- [Resultados específicos](../../output/iphone-fix/browser-results.json), [logs dos checks](../../output/iphone-fix/logs), [lista exata de arquivos](../../output/iphone-fix/changed-files.txt) e [snapshot recuperável](../../output/iphone-fix/snapshot.zip).

```sh
KIVORA_LAN_URL=http://192.168.101.142:3000 pnpm exec playwright test --config=e2e/iphone-lan.config.ts
```

Esse config não possui global setup de provisionamento, não usa credenciais reais e não grava traces contendo corpos de requisições. Para recuperar um arquivo, copie apenas seu conteúdo anterior de `snapshot/<caminho>.snapshot` para o caminho original; os arquivos novos estão identificados no manifesto. Não use reset do repositório: já havia outras alterações locais.
