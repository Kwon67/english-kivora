-- Currículo guiado: o sistema monta a rotina, o aluno não caça mais packs.
--
-- Três mudanças, nesta ordem:
--   1. 'auto' passa a ser uma origem válida de atribuição (o motor diário).
--   2. Auto-atribuição de membro fica restrita aos packs DELE. O catálogo que o
--      admin produziu deixa de ser auto-atribuível — é o motor que o distribui,
--      respeitando o nível CEFR do aluno.
--   3. Limpeza das rotinas montadas à mão sob a regra antiga.

-- 1. Nova origem de atribuição -------------------------------------------------

ALTER TABLE public.assignments DROP CONSTRAINT IF EXISTS assignments_assigned_by_check;

ALTER TABLE public.assignments
  ADD CONSTRAINT assignments_assigned_by_check
  CHECK (assigned_by IN ('admin', 'self', 'auto'));

-- 2. Auto-atribuição só para packs próprios ------------------------------------
--
-- Este é o ponto onde a regra vira lei. A policy antiga aceitava
-- `COALESCE(packs.is_public, true)`, ou seja, qualquer pack do catálogo. Sem
-- mexer aqui, esconder o botão no front seria só decoração: um POST direto na
-- server action continuaria inserindo.
--
-- 'auto' não ganha policy de INSERT de propósito: quem escreve o plano do dia é
-- o cron com service role, que não passa por RLS. Membro nenhum pode forjar uma
-- atribuição do motor.

DROP POLICY IF EXISTS "Users can create their own assignments for visible packs" ON public.assignments;

CREATE POLICY "Users can create their own assignments for owned packs"
ON public.assignments FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND assigned_by = 'self'
  AND reward_badge_id IS NULL
  AND EXISTS (
    SELECT 1
    FROM public.packs
    WHERE packs.id = assignments.pack_id
      AND packs.owner_id = (SELECT auth.uid())
      AND COALESCE(packs.is_public, false) = false
  )
);

-- 3. Limpeza das rotinas antigas -----------------------------------------------
--
-- Apaga só o que NÃO tem sessão jogada.
--
-- `game_sessions.assignment_id` é ON DELETE CASCADE, então apagar uma atribuição
-- concluída levaria junto a sessão — acertos, XP e a evidência que sustenta
-- streak, medalhas e ranking. Zerar a rotina não deveria custar o histórico de
-- aprendizado de ninguém, então o que já foi jogado permanece como histórico e
-- some da rotina pela consulta, não pelo DELETE.

DELETE FROM public.assignments a
USING public.packs p
WHERE a.pack_id = p.id
  AND a.assigned_by = 'self'
  AND (p.owner_id IS NULL OR p.owner_id <> a.user_id)
  AND NOT EXISTS (
    SELECT 1 FROM public.game_sessions gs WHERE gs.assignment_id = a.id
  );

-- O motor consulta "packs que este aluno já recebeu, e quando" a cada plano.
CREATE INDEX IF NOT EXISTS assignments_user_pack_date_idx
  ON public.assignments (user_id, pack_id, assigned_date DESC);
