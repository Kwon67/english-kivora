-- Catalog-only revision. Keep IDs, review history, and the position of existing lessons.
-- Short film excerpts: https://www.starwars.com/news/40-quotes-star-wars-the-empire-strikes-back
-- and https://www.afi.com/afis-100-years-100-movie-quotes/
BEGIN;
SET LOCAL statement_timeout = '20s';
SELECT pg_advisory_xact_lock(hashtextextended('kivora-public-curriculum-revision-20261116', 0));

DO $catalog$
DECLARE
  item record;
BEGIN
  FOR item IN SELECT * FROM (VALUES
    ('189da954-8e3b-4647-bb51-30a98d20cbb2'::uuid, 'He has not arrived yet.', 'Ele ainda não chegou.',
      'He did not arrive on time.', 'Ele não chegou na hora.'),
    ('8e819427-d569-4312-8be3-571bc41baaee'::uuid, 'I have not seen that movie.', 'Eu não vi esse filme.',
      'I did not see that movie.', 'Eu não vi esse filme.'),
    ('ef27df68-c771-48c6-955a-f9001fa1f5b1'::uuid, 'She was reading a book, and the phone rang loudly.',
      'Ela estava lendo um livro, e o telefone disparou bem alto.',
      'She was reading a book, and the phone rang loudly.', 'Ela estava lendo um livro, e o telefone tocou alto.')
  ) AS edits(id, old_en, old_pt, en, pt)
  LOOP
    UPDATE public.cards SET
      english_phrase = item.en,
      portuguese_translation = item.pt,
      audio_url = CASE WHEN item.en <> item.old_en THEN NULL ELSE audio_url END
    WHERE id = item.id AND english_phrase = item.old_en AND portuguese_translation = item.old_pt;

    IF NOT FOUND AND NOT EXISTS (
      SELECT 1 FROM public.cards WHERE id = item.id AND english_phrase = item.en AND portuguese_translation = item.pt
    ) THEN
      RAISE EXCEPTION 'Unexpected catalog text for card %', item.id;
    END IF;
  END LOOP;

  FOR item IN SELECT * FROM (VALUES
    ('807cbcb5-0364-475c-ae55-86314a3b2d7c'::uuid, 'A1', 'O verbo to be', 'I am your father.', 'Eu sou seu pai.'),
    ('807cbcb5-0364-475c-ae55-86314a3b2d7c'::uuid, 'A1', 'O verbo to be', 'It''s not my fault!', 'Não é minha culpa!'),
    ('807cbcb5-0364-475c-ae55-86314a3b2d7c'::uuid, 'A1', 'O verbo to be', 'I''m the king of the world!', 'Eu sou o rei do mundo!'),
    ('807cbcb5-0364-475c-ae55-86314a3b2d7c'::uuid, 'A1', 'O verbo to be', 'There''s no place like home.', 'Não há lugar como a nossa casa.'),
    ('8138db57-618c-409f-8248-260ccf037284'::uuid, 'A2', 'Contando o fim de semana', 'I was at home.', 'Eu estava em casa.'),
    ('8138db57-618c-409f-8248-260ccf037284'::uuid, 'A2', 'Contando o fim de semana', 'We were at the park.', 'Nós estávamos no parque.'),
    ('8138db57-618c-409f-8248-260ccf037284'::uuid, 'A2', 'Contando o fim de semana', 'Were you at home on Saturday?', 'Você estava em casa no sábado?'),
    ('8138db57-618c-409f-8248-260ccf037284'::uuid, 'A2', 'Contando o fim de semana', 'They weren''t busy.', 'Eles não estavam ocupados.'),
    ('bdc5d0b6-2aff-401c-b3e7-830ca058bfe5'::uuid, 'A2', 'Filmes, séries e música', 'Houston, we have a problem.', 'Houston, temos um problema.'),
    ('00f58279-ffb6-4220-85fa-781b5af85bb7'::uuid, 'B1', 'Contando o que aconteceu', 'You had me at hello.', 'Você me conquistou logo no primeiro oi.')
  ) AS additions(pack_id, level, pack_name, en, pt)
  LOOP
    PERFORM 1 FROM public.packs WHERE id = item.pack_id AND level = item.level AND name = item.pack_name AND is_public = true FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Missing public pack %', item.pack_name;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.cards WHERE pack_id = item.pack_id AND english_phrase = item.en) THEN
      INSERT INTO public.cards (pack_id, english_phrase, portuguese_translation, curriculum_position)
      SELECT item.pack_id, item.en, item.pt, coalesce(max(curriculum_position), 0) + 1
      FROM public.cards WHERE pack_id = item.pack_id;
    END IF;
  END LOOP;
END
$catalog$;

COMMIT;
