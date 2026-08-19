-- Remove o estado de agendamento FSRS de card_reviews.
--
-- A avaliação do FSRS foi cancelada: o agendador do site continua sendo o SM-2 próprio. O código
-- do experimento (src/features/review/lib/fsrsScheduler.ts) e a dependência `ts-fsrs` já saíram;
-- isto tira o resíduo que ficou no schema.
--
-- Nada é perdido. A migração 20260818130000 criou estas colunas todas NULL/0 e o agendador nunca
-- chegou a ser ligado, então nenhuma linha jamais recebeu valor de FSRS. O bloco de verificação
-- abaixo existe para provar isso em vez de assumir: se alguma linha tiver dado, ele avisa no log
-- antes de apagar.
--
-- As colunas do SM-2 (interval_days, ease_factor, repetitions) NÃO são tocadas — elas são o
-- estado real do agendador em uso. `lapses`, criada em 20260819160000, também não: apesar do nome
-- parecido com `fsrs_lapses`, é a coluna de leech que o site usa de verdade.

-- Verificação: conta linhas com estado FSRS antes de apagar. Roda por dentro de EXECUTE porque
-- o PL/pgSQL só planeja a consulta na execução — assim o bloco não quebra se a migração for
-- reaplicada depois das colunas já terem sumido.
DO $$
DECLARE
  linhas_com_estado BIGINT;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'card_reviews'
      AND column_name  = 'fsrs_stability'
  ) THEN
    EXECUTE $q$
      SELECT count(*) FROM public.card_reviews
      WHERE fsrs_stability  IS NOT NULL
         OR fsrs_difficulty IS NOT NULL
         OR fsrs_state      IS NOT NULL
         OR fsrs_last_review IS NOT NULL
         OR fsrs_reps   <> 0
         OR fsrs_lapses <> 0
    $q$ INTO linhas_com_estado;

    IF linhas_com_estado > 0 THEN
      RAISE WARNING
        'DROP FSRS: % linha(s) de card_reviews tinham estado FSRS gravado e serão apagadas. Isto não era esperado — o agendador FSRS nunca foi ligado.',
        linhas_com_estado;
    END IF;
  END IF;
END $$;

-- Índice parcial que só servia para encontrar cards ainda não migrados para o FSRS.
DROP INDEX IF EXISTS public.idx_card_reviews_pending_fsrs_seed;

-- As duas CHECK constraints cairiam junto com as colunas, mas são derrubadas explicitamente para
-- que este arquivo mostre tudo o que a migração 20260818130000 deixou para trás.
ALTER TABLE public.card_reviews
  DROP CONSTRAINT IF EXISTS card_reviews_fsrs_state_range,
  DROP CONSTRAINT IF EXISTS card_reviews_fsrs_ranges;

ALTER TABLE public.card_reviews
  DROP COLUMN IF EXISTS fsrs_stability,
  DROP COLUMN IF EXISTS fsrs_difficulty,
  DROP COLUMN IF EXISTS fsrs_state,
  DROP COLUMN IF EXISTS fsrs_reps,
  DROP COLUMN IF EXISTS fsrs_lapses,
  DROP COLUMN IF EXISTS fsrs_last_review;
