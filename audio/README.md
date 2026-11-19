# Vozes do Kivora English

O player prefere gravações verificadas do modelo `eleven_v4`. Siren narra, Lauren interpreta a recepcionista e os exemplos gerais dos cards, e Jarnathan interpreta o hóspede e o guia. Na atividade Hoje, “Praticar a escuta com três vozes” reproduz as amostras já aprovadas. O episódio do hotel tem um controle por turno. As etapas de revisão da escrita e de repetição só oferecem os exemplos depois de revelado o texto.

Hoje, as trilhas, os diálogos, a transferência, o Tutor, os exercícios de listening e pronúncia, a revisão, o Blitz, os cards, os packs e as prévias administrativas consultam o catálogo de gravações. Na prova de listening, o servidor confirma a tentativa e entrega os bytes com cache privado, sem incluir a resposta na URL. Novos cards privados usam uma rota de áudio autenticada. Os arquivos antigos permanecem disponíveis e as gravações dos alunos continuam locais.

## Catálogo e armazenamento

`manifest.json` registra texto, idioma, perfil de geração, voz, modelo, caminho e SHA-256 dos bytes. O perfil 1 identifica exclusivamente inglês americano e MP3 a 44,1 kHz/128 kbps. As chaves originais continuam válidas. A normalização de texto usa NFC e remove espaços nas bordas. A pontuação é significativa.

Os MP3s em `public/audio/kivora` usam URLs por conteúdo, cache imutável e suporte a pedidos de intervalos de bytes. Reproduzi-los custa zero créditos da ElevenLabs. O índice completo fica no servidor. Até 48 entradas, o cliente usa um índice pequeno. Acima disso, mantém as boas-vindas e a lista das partições disponíveis, e consulta apenas a partição necessária na mesma origem. Nenhum SDK da ElevenLabs vai para o navegador.

## Inventário e fila

`pnpm exec node --import tsx scripts/audio/inventory.ts` faz a simulação local. As referências, estimativas e o apêndice privado ficam em `output/elevenlabs`. Com a exportação local do catálogo disponível, o comando também atualiza `audio/queue.json`, uma fila versionada de conteúdos elegíveis. Os textos de seeds ausentes da exportação pública precisam de confirmação de uso. A condição dos arquivos vem do manifesto e do diário de reservas. A fila registra prioridade e identidade e permanece disponível mesmo sem o snapshot original.

`reconciliation.json` identifica um pedido anterior interrompido. Para recuperar esse áudio, consulte o histórico com permissão de leitura, confirme texto, modelo e voz, recupere o MP3 existente e confira o recibo. A reserva impede que o trecho seja solicitado de novo.

## Publicação e orçamento

A publicação é uma operação de manutenção explícita, independente do build, dos testes e do servidor web. As opções do publicador são:

- `--samples` reutiliza os três MP3s locais.
- `--restore` restaura do diário os clipes já recebidos. Não chama o serviço de síntese.
- `--priority` processa histórias, diálogos, trilhas, aberturas do Tutor, os packs introdutórios selecionados e os diálogos públicos do Blitz.
- `--catalog` inclui a fila pública restante, respeitando o mesmo teto.

Execute o publicador com `pnpm exec node --conditions=react-server --import tsx scripts/audio/publish.ts` e a opção desejada. A geração exige autorização de gasto vigente.

Os publicadores devem compartilhar um único PostgreSQL primário dedicado. O arquivo `scripts/audio/coordinator.sql` define as reservas e os recibos. O arquivo operacional `output/elevenlabs/campaign.json` identifica a campanha, o serviço libpq e o identificador físico do cluster. O processo verifica esse identificador e a validade da campanha antes de gastar. No ambiente local, `PGSERVICEFILE` aponta para `output/elevenlabs/pg-service.conf`. O servidor usa um socket privado do usuário e não se conecta ao banco do Kivora. Para outra máquina participar, configure acesso autenticado ao mesmo primário. Preserve os recibos, o diário anterior e os MP3s em backup.

Cada autorização vincula o modo de publicação, a lista fechada de chaves e o teto de créditos à campanha. Esses dados ficam em `authorization` no arquivo local da campanha. O publicador exige que o teto seja igual ao registrado no PostgreSQL e que a campanha esteja vigente. A API confirma saldo e multiplicadores. Quando a autorização define `minimumBalance`, o publicador verifica antes de cada pedido o saldo líquido do piso, do consumo e das reservas. Cada leitura da conta vale por até oito segundos e até 400 créditos de exposição acumulada. Entre leituras, o publicador desconta o custo máximo de cada envio. Se o próximo envio puder atingir o piso, consulta novamente a conta. A verificação no banco considera também o consumo e as reservas da campanha para tolerar atraso no contador da conta. As campanhas anteriores sem piso individual continuam limitadas a 60% do saldo verificado no início. O PostgreSQL serializa a reserva antes do envio e usa uma chave única por clipe entre campanhas. O publicador reserva um crédito por caractere para o perfil verificado, desconta a cobrança efetiva e armazena os bytes e o recibo no coordenador. Antes de publicar, confere todos os quadros do MP3 e sua duração. Se houver interrupção depois do envio, a reserva continua contabilizada. A retomada recupera os bytes existentes ou pula o pedido incerto. Apenas consultas de leitura podem ser repetidas automaticamente.

Campanhas com saldo de abertura registrado podem conciliar o gasto já debitado durante o lote. O publicador exige que a variação da franquia e o consumo por voz da API coincidam com os recibos individuais e que não haja reserva em aberto. Assim, um débito já refletido no saldo não é descontado duas vezes. Quando o custo máximo de um item supera o restante do teto, o publicador verifica os demais itens da mesma lista na ordem aprovada.

## Tutor

`ELEVENLABS_TUTOR_ENABLED` fica desativado por padrão. A operação paga também exige um orçamento explícito em `ELEVENLABS_TUTOR_CREDITS`, a chave no servidor e o contador persistente já existente no Supabase. As respostas dinâmicas recebem autorização assinada, vinculada ao usuário, cenário, texto e validade. A abertura conhecida do cenário também é elegível. Rascunhos antigos podem usar a voz alternativa.

Cada tentativa reserva até 320 créditos do orçamento do período. O limite é de quatro tentativas por usuário em 24 horas e três no mesmo cenário por hora. Um trecho tem uma tentativa premium por usuário em 24 horas entre instâncias. O cache privado local permite replay sem cobrança adicional. O Tutor aceita o stream de MP3 validado e inicia a reprodução progressiva em navegadores com suporte a MediaSource para MP3. Os demais usam os mesmos bytes em um blob. Cancelar encerra a leitura sem repetir a síntese. A rota de prévia comum não inicia uma geração paga.

## Fallback gratuito

Quando falta uma gravação, a aplicação pode consultar um recurso Speech F0 já existente. Esta opção vem desligada. O player mantém o arquivo legado quando disponível. Sem uma fonte utilizável, o Tutor continua pelo texto. As vozes candidatas para conversação feminina, masculina e narração são Ava Multilingual, Andrew Multilingual e Jenny, respectivamente. As frases usam pontuação original e SSML com ritmo padrão da voz.

A configuração do servidor está em `.env.example`. Cada síntese exige confirmação de assinatura com limite de gastos ativo, recurso SpeechServices F0 na região esperada, endpoint próprio do recurso e voz neural en-US em disponibilidade geral. O token ARM serve exclusivamente para leituras. A consulta de usos precisa identificar inequivocamente a cota neural mensal incluída, o consumo e a próxima renovação. Respostas desconhecidas bloqueiam o envio. Nenhuma etapa provisiona recursos ou altera o plano.

O limite local é 450.000 dos 500.000 caracteres mensais. Cada envio ocupa uma reserva persistente conservadora de 1.600 caracteres para textos de até 800 unidades UTF-16. O cálculo soma as reservas ao uso observado, por isso pode interromper antes. Falhas também mantêm a reserva. Um mesmo trecho tem uma tentativa por minuto entre instâncias. O cache local reutiliza a gravação por uma hora, e o Tutor limita o fallback a 20 pedidos por aluno em 24 horas.

A fila registra a cobertura estática por texto e voz. Quando uma nova gravação é publicada, o manifesto e os índices passam a apontar para ela. Para retirar a Microsoft, finalize ou concilie as pendências estáticas e valide os custos e a autorização por assinatura no servidor para respostas dinâmicas do Tutor.

Em 19/11/2026, o manifesto tinha 1.274 gravações v4 verificadas por SHA-256. Na fila de 2.325 itens, 1.050 aguardavam geração e um continuava em conciliação. Esses números medem o catálogo estático e excluem as respostas inéditas do Tutor.
