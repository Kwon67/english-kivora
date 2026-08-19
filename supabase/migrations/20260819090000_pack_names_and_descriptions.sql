-- Nomes e descrições dos packs (item 5).
--
-- Antes: 13 packs chamados "Pack 7", "Pack5", "pack 3" com a descrição literal
-- "Imported from english_phrases_pack7.apkg". Nada disso diz ao aluno o que ele vai aprender,
-- então a escolha do pack virava sorteio.
--
-- Cada nome abaixo foi derivado LENDO as frases do pack, uma a uma; a descrição diz o que a
-- pessoa vai conseguir fazer depois. Os ids são explícitos para a migração ser idempotente e
-- não depender dos nomes antigos (que deixam de existir na primeira execução).
--
-- O pack "Blitz IA <data>" fica de fora de propósito: é efêmero, privado e regerado pelo jogo.
-- Backup do estado anterior: supabase/packs-backup-20260819.json

-- [A1] "Pack 1"
UPDATE public.packs SET name = 'Primeiro contato', description = 'Cumprimentar, se apresentar e pedir ajuda quando não entender.' WHERE id = '9a433739-264d-4d8c-b78a-b7d14b54c1e1';

-- [A1] "Pack 1.5"
UPDATE public.packs SET name = 'Cumprimentos e cortesia', description = 'Bom dia, obrigado, por favor: a boa educação básica em inglês.' WHERE id = 'cf9a23fd-a714-43ee-ad20-52290b8fcf58';

-- [A1] "Pack 2"
UPDATE public.packs SET name = 'Perguntas essenciais', description = 'Preço, horas, profissão — o que você pergunta todo dia.' WHERE id = '8d1e4233-2b59-48df-8233-b02867fb059d';

-- [A1] "pack 3"
UPDATE public.packs SET name = 'Compras e combinados rápidos', description = 'Pagar, pedir a conta e avisar que está a caminho.' WHERE id = '033aed12-d9a5-4bb1-aca4-af1766bdaf0e';

-- [A1] "Pack 4"
UPDATE public.packs SET name = 'Como você está', description = 'Fome, cansaço, gostar e recusar sem parecer grosseiro.' WHERE id = '2e4530ca-be63-47ba-831b-0ffb83972db8';

-- [A2] "Pack5"
UPDATE public.packs SET name = 'Opiniões e sentimentos', description = 'Concordar, discordar e dizer como você está se sentindo.' WHERE id = '33642eb3-d25e-40c0-aa6f-82c04f0f330b';

-- [A2] "Pack6"
UPDATE public.packs SET name = 'A rotina do seu dia', description = 'Acordar, sair, esperar e voltar: o dia inteiro em inglês.' WHERE id = '064d2074-9cc2-43d8-ac6c-932c5247f6ac';

-- [A2] "Pack 7"
UPDATE public.packs SET name = 'Fazendo perguntas', description = 'Como, quando e por quê: montar perguntas que soam naturais.' WHERE id = 'c1a54975-1887-4c3f-8e08-641150bb69c1';

-- [A2] "English Pack"
UPDATE public.packs SET name = 'Na rua e no restaurante', description = 'Pedir comida para viagem, achar farmácia e se virar na cidade.' WHERE id = 'e8abf3eb-2055-491c-b59f-18b312371a98';

-- [B1] "Pack8"
UPDATE public.packs SET name = 'Conhecendo pessoas', description = 'Puxar papo, se apresentar de novo e oferecer ajuda.' WHERE id = '660b0b7c-5298-4332-9006-076a253f4e93';

-- [B1] "Pack 10"
UPDATE public.packs SET name = 'Pedidos educados e imprevistos', description = 'Pedir favores com jeito e lidar com o que sai errado.' WHERE id = '2e68457f-24d5-479c-b5fd-7513b2186f73';

-- [B1] "Pack 11"
UPDATE public.packs SET name = 'Combinando programas', description = 'Convidar, aceitar, remarcar e elogiar um lugar.' WHERE id = '99982a5b-1db1-42fc-98b2-8b34abc3b712';

-- [B1] "Pack 12"
UPDATE public.packs SET name = 'Atrasos e mal-entendidos', description = 'Avisar que atrasou, se explicar e remarcar sem estresse.' WHERE id = '1c075adc-6506-4ca0-82f2-d20a1541fbd4';

-- [B1] "Pack 14"
UPDATE public.packs SET name = 'Mantendo contato', description = 'Dar um oi, retomar contato e falar do que você sente.' WHERE id = '62258900-63b1-4992-8626-a1adfebd1bef';

-- [A2] "IA: Frases longas Cotidiana A1-A2"
UPDATE public.packs SET name = 'Frases completas do dia a dia', description = 'Frases inteiras, não palavras soltas, sobre a vida cotidiana.' WHERE id = 'c3a81d17-31f2-4415-8718-438ed7a4edbe';

-- [B2] "IA: PACK 15"
UPDATE public.packs SET name = 'Inglês falado: gonna, wanna, gotta', description = 'As formas reduzidas que nativos usam o tempo todo na fala.' WHERE id = '1f764c6e-101e-4a0c-a099-f8e90fc694fa';
