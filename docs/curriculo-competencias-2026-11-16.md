# Progressão por competências — implementação editorial local

Atualização da fase 5: as mesmas 18 situações agora têm três réplicas e 18 tarefas de transferência em novos contextos, com 36 objetivos adicionais (108 no mapa). O JSON consolidado está no formato 2. Ver [entrega e limites da fase 5](fase-5-portfolios-workflows-2026-11-16.md); as contagens e o fluxo de uma réplica descritos abaixo documentam a base da fase 4.

## O que existe agora

A rota `/practice-path`, acessível por Hoje e Trilhas, contém **18 situações originais**: as seis anteriores com novas atividades de interação/mediação e doze situações adicionais. São três situações em cada faixa A1–C2 e **72 atividades identificadas** (quatro por situação). Há pré-requisitos, recuperação, rascunhos por usuário, ligação com coleções existentes e exportação local de respostas para revisão.

Isso amplia a amostra executável; **não constitui seis currículos completos**, não comprova eficácia e não valida o nível de dificuldade de cada texto. Os níveis são alvos editoriais. As respostas automáticas dos testes verificam funcionamento, não qualidade de inglês.

O desenho distingue recepção, produção, interação e mediação, com referência conceitual ao [CEFR Companion Volume](https://www.coe.int/en/web/common-european-framework-reference-languages/key-concepts) e à [explicação de mediação do Conselho da Europa](https://www.coe.int/en/web/common-european-framework-reference-languages/mediation). Os objetivos, textos, diálogos e critérios do produto são originais; não são transcrições nem descritores oficialmente calibrados.

## Mapa implementado

| Faixa | Situação 1: entrada e retomada | Situação 2: novo contexto | Situação 3: nova restrição |
|---|---|---|---|
| A1 | Combinar um encontro | Pedir um item | Convidar para um clube |
| A2 | Encontrar outra rota | Combinar um conserto | Reorganizar uma atividade |
| B1 | Adaptar um plano | Negociar uma troca | Escolher uma oficina |
| B2 | Recomendar com ressalvas | Conciliar acesso e silêncio | Comparar evidências |
| C1 | Preservar os limites da evidência | Explicar uma ressalva | Preservar uma incerteza |
| C2 | Distinguir consenso e consentimento | Interpretar uma concessão | Delimitar um acordo |

O [mapa completo em JSON](curriculo-competencias-2026-11-16.json) foi gerado dos mesmos dados usados pela interface. Para cada situação contém ID, faixa, texto, pergunta e gabarito, produção, exemplo, nova fala do interlocutor, tarefa de mediação, critérios por atividade, pré-requisito e IDs das coleções de apoio. Os 18 IDs foram conferidos no snapshot local do catálogo: todos públicos e da faixa correspondente. Na interface, o link só aparece se a coleção continuar visível na leitura atual.

## Entrada e pré-requisitos

- A primeira situação de cada faixa tem entrada livre, como prática exploratória. O aluno escolhe a faixa; isso não muda o perfil, a prova ou o nível da conta.
- As situações 2 e 3 exigem a prática anterior registrada. A terceira não é liberada apenas por abrir a segunda.
- Entrada pedagógica recomendada: reconhecer informação explícita em A1; sequência e mudança cotidiana em A2; razões e restrições em B1; argumento e objeção em B2; ressalva e inferência em C1; posicionamento, pressuposto e alcance do acordo em C2.
- Se o contexto ainda não for compreensível com apoio, retomar a faixa anterior e a coleção vinculada. Essa é orientação de prática, não classificação automática.

## Atividades, evidências e critérios

| Atividade | O aluno faz | Evidência registrada | Limite |
|---|---|---|---|
| Recepção escrita | Lê contexto e responde pergunta | Primeira escolha, escolha atual e acesso a apoio | Uma questão não mede compreensão ampla nem escuta |
| Produção escrita | Redige, compara com exemplo e reescreve | Primeira versão, revisão e três autoavaliações | Nenhuma nota automática de qualidade ou domínio |
| Interação simulada | Responde a nova restrição/objeção em mensagem fixa | Resposta e autoavaliação contextual | O interlocutor não reage à resposta; não é conversa real |
| Mediação escrita | Explica conteúdo a outro destinatário | Texto separado e autoavaliação de preservação/adaptação | Exige revisão humana de fidelidade, registro e seleção |

Os critérios específicos estão no JSON e em “Competências, critérios e apoio”. Nos níveis avançados, preservar incerteza, distinguir posições e não criar consenso é parte explícita da tarefa. O tamanho do texto não é usado como nota de inglês.

## Máquina de progressão executável

`practiceStatus` retorna `not_started`, `in_progress`, `needs_recovery`, `ready` ou `completed`.

1. Sem a prática contextual concluída, ainda está em andamento.
2. Sem revisão escrita, resposta ao interlocutor ou mediação, não pode registrar a situação.
3. Primeira compreensão incorreta ou critérios ainda desmarcados levam a recuperação. O aluno pode deixar critérios desmarcados sem ser punido com nota negativa.
4. A recuperação preserva a resposta e a mediação e permite uma nova tentativa de compreensão. A explicação e a coleção continuam acessíveis. Repetir a mesma pergunta não vira evidência independente de domínio.
5. Cumpridos os requisitos do fluxo, o aluno registra a prática e pode abrir a próxima situação. Os critérios continuam sendo autoavaliação.
6. Ao concluir as três situações, pode exportar um portfólio local. `portfolioReadiness` informa apenas prontidão para revisão, nunca certificação.

O rascunho da prática por competências usa um espaço separado dos rascunhos de Hoje. O armazenamento é local por usuário; outra conta não retoma o mesmo conteúdo. Falha de armazenamento é sinalizada. Não há sincronização remota desse novo portfólio, cron ou notificação automática. A sugestão de retomar em dois dias da prática contextual continua uma sugestão, não uma medida de retenção já realizada.

## Critério proposto para moderação humana

`evaluateReviewedPortfolio` é uma regra preparatória, testada e **não conectada ao desbloqueio de nível**. Exige, para cada uma das quatro atividades, evidências de revisão humana em dois contextos distintos, identificador de tarefa e revisor, data válida e produção independente. A revisão mais recente de uma tarefa prevalece, inclusive quando pede retomada. Duplicar a mesma tarefa ou contexto não satisfaz o requisito.

Esse número de evidências é uma decisão de projeto a calibrar, não um ponto de corte CEFR validado. Uma futura interface/serviço de revisão precisa autenticar o revisor, registrar justificativa e encaminhar divergências para moderação. O código atual não aceita checkboxes do aluno como revisão externa, não autentica revisores e não altera provas ou perfis.

## Ampliação curricular ainda executável

O próximo conteúdo pode ser produzido localmente. Não depende de usar produção nem deve ser chamado de bloqueio externo:

| Faixa | Domínios ainda necessários além deste incremento |
|---|---|
| A1 | Pessoas, casa, rotina, necessidades básicas e compreensão oral com mais vozes |
| A2 | Experiências passadas, serviços, comparação e trocas com várias réplicas |
| B1 | Narrativa conectada, instruções extensas, problemas cotidianos e justificativas em outros domínios |
| B2 | Síntese de fontes, debate sustentado, registro e escuta em ritmo natural |
| C1 | Gêneros extensos, implícitos, públicos especializados/não especializados e negociação longa |
| C2 | Flexibilidade de registro, humor, referências culturais, ambiguidade e reformulação entre gêneros |

Para cada novo domínio: definir objetivo e pré-requisitos; escrever pelo menos dois contextos que não repitam o mesmo gabarito; incluir produção, réplica e mediação; planejar recepção oral com áudio licenciado; acrescentar retomada posterior e transferência; revisar a qualidade linguística; executar os mesmos testes de recuperação e persistência. A revisão docente e o estudo longitudinal entram depois como evidência própria, não como pressuposto.

## Verificação

- Integridade: 18 IDs únicos, 72 atividades, três situações por faixa, pré-requisitos sem referência ausente e gabaritos válidos.
- Progressão: texto ausente, primeira escolha incorreta e critérios pendentes impedem avançar; conclusão libera só a etapa seguinte.
- Navegador: três situações completas em cada faixa, desktop e móvel; recarga; recuperação sem apagar escrita; exportação e isolamento entre contas.
- Portfólio: contexto repetido, outra faixa, falta de independência e revisão posterior negativa não passam pela regra preparatória.
- Coleções: 18 vínculos verificados no snapshot e abertura de uma coleção pública pela interface contra banco isolado.
