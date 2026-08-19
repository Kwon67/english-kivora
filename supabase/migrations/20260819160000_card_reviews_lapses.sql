-- Contador de lapsos por card (tratamento de "leech").
--
-- Hoje nada percebe um card que a pessoa erra indefinidamente. Medido num baralho real: 12 cards
-- com 6 ou mais revisões ainda presos em 10 dias ou menos, um deles com 11 revisões e intervalo
-- de 1 dia. Eles voltam para sempre, consumindo a cota diária de revisão, sem que nada sinalize
-- que aquela frase precisa de outra abordagem em vez de mais repetição igual.
--
-- Um contador basta: a condição de leech é derivada (`lapses >= limite`), então não há um segundo
-- campo que possa divergir deste.
--
-- NÃO reaproveita `fsrs_lapses`: aquela coluna veio da migração do FSRS, que foi cancelada, e
-- usá-la aqui deixaria o nome mentindo sobre quem escreve nela.

ALTER TABLE public.card_reviews
  ADD COLUMN IF NOT EXISTS lapses INTEGER NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'card_reviews_lapses_nonnegative') THEN
    ALTER TABLE public.card_reviews
      ADD CONSTRAINT card_reviews_lapses_nonnegative CHECK (lapses >= 0);
  END IF;
END $$;

COMMENT ON COLUMN public.card_reviews.lapses IS
  'Quantas vezes o card foi esquecido DEPOIS de já ter graduado. A partir do limite definido em features/review/lib/leech.ts o card sai da fila automática e passa a aparecer em Dificuldades.';

-- "Quais cards deste usuário viraram leech" é a única consulta que isto acrescenta, e ela roda por
-- usuário — índice parcial em vez de alargar o índice de vencimento.
CREATE INDEX IF NOT EXISTS idx_card_reviews_leeches
  ON public.card_reviews (user_id)
  WHERE lapses >= 8;
