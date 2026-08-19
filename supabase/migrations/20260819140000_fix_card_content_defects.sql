-- Defeitos de conteúdo nos cards.
--
-- 1) Acentos perdidos na importação (.apkg) em dois packs: "voce", "esta", "tao", "a noite",
--    "licenca". Isso é exibido ao aluno COMO A RESPOSTA CORRETA, e a repetição espaçada fixa
--    exatamente aquilo que mostra — o app estava ensinando português errado de quebra.
-- 2) Um card truncado ("My name is ." / "Meu nome é") e um com nome placeholder ("Bob"),
--    que não ensinam nada como estão.
--
-- Revisado card a card lendo as 205 traduções: detector automático não serve aqui. Uma lista de
-- palavras gera falso positivo ("pai" não leva acento) e usar o próprio banco como referência
-- perde justamente "licenca", porque "licença" não aparece escrito certo em lugar nenhum.
--
-- NÃO mexe em cards duplicados: card_reviews tem ON DELETE CASCADE, então apagar card apaga o
-- histórico de revisão dele. Ver relatório de duplicatas na conversa.
-- Backup do estado anterior: supabase/cards-backup-20260819.json

-- [Fazendo perguntas] "O que aconteceu com voce?"
UPDATE public.cards SET english_phrase = 'What happened to you?', portuguese_translation = 'O que aconteceu com você?' WHERE id = 'ba291b73-a265-4ce9-8e24-94e72c25dcbc';

-- [Fazendo perguntas] "Por que voce esta tao feliz hoje?"
UPDATE public.cards SET english_phrase = 'Why are you so happy today?', portuguese_translation = 'Por que você está tão feliz hoje?' WHERE id = 'c03249be-1584-43c9-a367-d5d08a5db7d5';

-- [Fazendo perguntas] "Tenho uma pergunta pra voce."
UPDATE public.cards SET english_phrase = 'I have a question for you.', portuguese_translation = 'Tenho uma pergunta pra você.' WHERE id = 'aa447e13-8d6b-430c-a1ee-a3aad163827f';

-- [Fazendo perguntas] "Voce dormiu bem ontem a noite?"
UPDATE public.cards SET english_phrase = 'Did you sleep well last night?', portuguese_translation = 'Você dormiu bem ontem à noite?' WHERE id = '1ae5096a-b342-4c22-b980-fc69ef4fceac';

-- [Fazendo perguntas] "Voce tem alguma pergunta?"
UPDATE public.cards SET english_phrase = 'Do you have any questions?', portuguese_translation = 'Você tem alguma pergunta?' WHERE id = '870cc8a7-6782-422a-9349-e0feacb1ce17';

-- [Primeiro contato] "Com licenca / Desculpe."
UPDATE public.cards SET english_phrase = 'Excuse me.', portuguese_translation = 'Com licença / Desculpe.' WHERE id = '61ddba18-3cac-46b2-bbb1-2aa9752cdc88';

-- [Primeiro contato] "Vejo voce mais tarde!"
UPDATE public.cards SET english_phrase = 'See you later!', portuguese_translation = 'Vejo você mais tarde!' WHERE id = '3981225c-0f39-48b8-a8c1-2a8cc8a048f0';

-- [Primeiro contato] "Meu nome é"
UPDATE public.cards SET english_phrase = 'My name is...', portuguese_translation = 'Meu nome é...' WHERE id = 'e0832750-5d46-47ee-a891-7e408ccd325e';

-- [Cumprimentos e cortesia] "Meu nome é Bob"
UPDATE public.cards SET english_phrase = 'My name is Ana.', portuguese_translation = 'Meu nome é Ana.' WHERE id = 'b474ed85-b26e-4226-ba9d-0888ffcb0af5';
