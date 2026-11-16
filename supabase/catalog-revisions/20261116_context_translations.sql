-- Public catalog translation revision. Keep card IDs, English text, audio, and curriculum order.
BEGIN;
SET LOCAL statement_timeout = '20s';
SET LOCAL lock_timeout = '5s';

DO $catalog$
DECLARE
  item record;
BEGIN
  FOR item IN SELECT * FROM (VALUES
    ('7d66c09d-4ca6-4633-8ce5-810f36ab1145'::uuid,
      'I am afraid I have left my wallet at home.',
      'Infelizmente, deixei minha carteira em casa.',
      'Receio ter deixado minha carteira em casa.',
      ARRAY['Eu receio que tenha deixado minha carteira em casa.', 'Infelizmente, deixei minha carteira em casa.']::text[]),
    ('0e6efa6d-04af-4812-9d61-3bc1d939da8c'::uuid,
      'I am afraid I cannot make it.',
      'Infelizmente eu não vou conseguir ir.',
      'Receio não conseguir ir.',
      ARRAY['Infelizmente eu não vou conseguir ir.']::text[]),
    ('d10a113b-8662-4152-ab38-8166d80152f0'::uuid,
      'I''m afraid I can''t accommodate the extra features this month without reallocating resources.',
      'Receio que não consigo incluir as funcionalidades extras neste mês sem realocar recursos.',
      'Receio não poder incluir as funcionalidades extras neste mês sem realocar recursos.',
      ARRAY[]::text[]),
    ('19240f47-8852-4a55-a47e-b2f06032f2d1'::uuid,
      'I was wondering if the meeting could be moved to Thursday morning instead.',
      'Eu estava me perguntando se a reunião poderia ser transferida para a manhã de quinta-feira.',
      'Queria saber se seria possível passar a reunião para quinta-feira de manhã.',
      ARRAY['Eu estava me perguntando se a reunião poderia ser transferida para a manhã de quinta-feira.']::text[]),
    ('fff8d82b-e66f-4ca9-8e1d-1e200da0dce6'::uuid,
      'I was wondering if you could recommend a good restaurant for a business dinner.',
      'Eu estava me perguntando se você poderia indicar um bom restaurante para um jantar de negócios.',
      'Queria saber se você poderia indicar um bom restaurante para um jantar de negócios.',
      ARRAY['Eu estava me perguntando se você poderia indicar um bom restaurante para um jantar de negócios.']::text[]),
    ('938b75bb-8ec4-46a5-adb6-e8445ae98f12'::uuid,
      'I was wondering if you might have a moment to review my draft proposal.',
      'Eu estava me perguntando se você teria um tempinho para revisar meu rascunho de proposta.',
      'Queria saber se você teria um tempinho para revisar o rascunho da minha proposta.',
      ARRAY['Eu estava me perguntando se você teria um tempinho para revisar meu rascunho de proposta.']::text[]),
    ('f1be2310-7026-46b3-a323-49cc668bafff'::uuid,
      'I was wondering if you''d be willing to share your feedback on the prototype.',
      'Eu estava me perguntando se você estaria disposto a compartilhar seu feedback sobre o protótipo.',
      'Queria saber se você estaria disposto a dar sua opinião sobre o protótipo.',
      ARRAY['Eu estava me perguntando se você estaria disposto a compartilhar seu feedback sobre o protótipo.']::text[]),
    ('532b6eee-9987-4ed0-827b-fb3315be0527'::uuid,
      'I was wondering if it would be possible to schedule a quick call tomorrow afternoon.',
      'Eu estava me perguntando se seria possível marcar uma ligação rápida amanhã à tarde.',
      'Queria saber se seria possível marcar uma ligação rápida amanhã à tarde.',
      ARRAY['Eu estava me perguntando se seria possível marcar uma ligação rápida amanhã à tarde.']::text[]),
    ('6b9189c1-edd8-4c1e-beed-6d6fc45f10bf'::uuid,
      'I was wondering if there''s any chance you could extend the warranty period by a year.',
      'Eu estava me perguntando se há alguma chance de você estender o período de garantia por mais um ano.',
      'Queria saber se haveria alguma chance de você estender o prazo da garantia em um ano.',
      ARRAY['Eu estava me perguntando se há alguma chance de você estender o período de garantia por mais um ano.']::text[]),
    ('734c7ba1-e029-4f2e-ae8e-121ed5bea7e8'::uuid,
      'That''s not what I meant at all.',
      'Não foi isso que eu quis dizer.',
      'Não foi nada disso que eu quis dizer.',
      ARRAY['Não foi isso que eu quis dizer.']::text[]),
    ('194076e1-47d5-4ea2-a54f-b93d08c28125'::uuid,
      'I''m really looking forward to seeing you.',
      'Estou muito ansioso pra te ver.',
      'Mal posso esperar para te ver.',
      ARRAY['Estou muito ansioso pra te ver.']::text[]),
    ('efc34026-fe57-49d4-8434-9fab7dc2ea90'::uuid,
      'Idk if I can make it tonight, but I''ll try.',
      'Idk se consigo ir hoje à noite, mas vou tentar.',
      'Não sei se vou conseguir ir hoje à noite, mas vou tentar.',
      ARRAY[]::text[]),
    ('47b99ad4-f87a-4de4-91d3-185381111a2c'::uuid,
      'Would it be possible for you to review my code by Friday?',
      'Você poderia revisar meu código até sexta-feira?',
      'Seria possível você revisar meu código até sexta-feira?',
      ARRAY['Você poderia revisar meu código até sexta-feira?']::text[]),
    ('c8b95685-e118-4d3c-8db8-da123abd4ac0'::uuid,
      'She totally misunderstood the instructions, yet she still managed to finish on time.',
      'Ela entendeu completamente mal as instruções, mas ainda conseguiu terminar a tempo.',
      'Ela entendeu as instruções totalmente errado, mas mesmo assim conseguiu terminar no prazo.',
      ARRAY[]::text[]),
    ('f66018a4-8c6a-4f69-9620-e6dc5b3d401a'::uuid,
      'I thought I was barking up the wrong tree, but my suggestion actually saved the budget.',
      'Achei que estava procurando no lugar errado, mas minha sugestão acabou economizando o orçamento.',
      'Achei que estava procurando no lugar errado, mas, na verdade, minha sugestão salvou o orçamento.',
      ARRAY[]::text[]),
    ('615729f0-649a-440b-a910-ed394e0e893a'::uuid,
      'The data, however, does not support a causal relationship, pointing instead to a possible confounding factor.',
      'Os dados, no entanto, não apoiam uma relação causal, apontando mais para um fator de confusão.',
      'Os dados, porém, não sustentam a hipótese de uma relação causal e apontam para um possível fator de confusão.',
      ARRAY[]::text[]),
    ('83fb807a-5b8a-4911-b6f9-388a32954549'::uuid,
      'The research contributes to the field by offering a novel framework that integrates both qualitative and quantitative insights.',
      'A pesquisa contribui para o campo ao oferecer um quadro inovador que integra tanto percepções qualitativas quanto quantitativas.',
      'A pesquisa contribui para a área ao propor um modelo inovador que reúne percepções qualitativas e quantitativas.',
      ARRAY[]::text[]),
    ('07438b20-3470-49e9-90a9-cbee38250d5a'::uuid,
      'We''re going to need to pull out all the stops to make sure the launch hits the mark, or else we''ll be shouting into the void.',
      'Precisamos puxar todas as alavancas para garantir que o lançamento seja um sucesso, senão estaremos gritando no vazio.',
      'Vamos ter que fazer tudo o que estiver ao nosso alcance para que o lançamento alcance o resultado pretendido. Caso contrário, estaremos falando sem sermos ouvidos.',
      ARRAY[]::text[]),
    ('979bc8d0-a268-4833-ab6e-c8c437612310'::uuid,
      'There''s a possibility that the meeting will be postponed, but we haven''t received a definitive word yet.',
      'Existe a possibilidade de a reunião ser adiada, mas ainda não recebemos palavra definitiva.',
      'É possível que a reunião seja adiada, mas ainda não recebemos uma confirmação definitiva.',
      ARRAY[]::text[]),
    ('80ce7e1b-2287-49e4-888f-ddcd0d649a98'::uuid,
      'That does not work for me, unfortunately.',
      'Isso não funciona para mim, infelizmente.',
      'Infelizmente, essa opção não me atende.',
      ARRAY['Isso não funciona para mim, infelizmente.']::text[])
  ) AS edits(id, en, old_pt, pt, alternatives)
  ORDER BY id
  LOOP
    UPDATE public.cards AS card
    SET portuguese_translation = item.pt,
        accepted_translations = ARRAY(
          SELECT translation
          FROM unnest(card.accepted_translations || item.alternatives) WITH ORDINALITY AS alt(translation, position)
          WHERE translation <> item.pt
          GROUP BY translation
          ORDER BY min(position)
        )
    FROM public.packs AS pack
    WHERE card.id = item.id
      AND card.pack_id = pack.id
      AND pack.owner_id IS NULL
      AND pack.is_public = true
      AND card.english_phrase = item.en
      AND card.portuguese_translation IN (item.old_pt, item.pt);

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Unexpected public catalog text for card %', item.id;
    END IF;
  END LOOP;
END
$catalog$;

COMMIT;
