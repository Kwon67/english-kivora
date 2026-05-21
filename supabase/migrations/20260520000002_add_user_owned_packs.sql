-- Add user-owned private packs while keeping existing marketplace packs public.
ALTER TABLE public.packs
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

UPDATE public.packs
SET is_public = true
WHERE is_public IS NULL;

CREATE INDEX IF NOT EXISTS packs_owner_id_idx ON public.packs(owner_id);
CREATE INDEX IF NOT EXISTS cards_pack_id_idx ON public.cards(pack_id);

DROP POLICY IF EXISTS "Packs are viewable by everyone." ON public.packs;
DROP POLICY IF EXISTS "Packs insertable by admins." ON public.packs;
DROP POLICY IF EXISTS "Packs are readable by allowed users." ON public.packs;
DROP POLICY IF EXISTS "Admins can manage all packs." ON public.packs;
DROP POLICY IF EXISTS "Users can manage own private packs." ON public.packs;

CREATE POLICY "Packs are readable by allowed users."
ON public.packs FOR SELECT
USING (
  COALESCE(is_public, true)
  OR owner_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can manage all packs."
ON public.packs FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
  )
);

CREATE POLICY "Users can manage own private packs."
ON public.packs FOR ALL
USING (owner_id = (SELECT auth.uid()))
WITH CHECK (
  owner_id = (SELECT auth.uid())
  AND COALESCE(is_public, false) = false
);

DROP POLICY IF EXISTS "Cards are viewable by everyone." ON public.cards;
DROP POLICY IF EXISTS "Cards insertable by admins." ON public.cards;
DROP POLICY IF EXISTS "Cards are readable through visible packs." ON public.cards;
DROP POLICY IF EXISTS "Admins can manage all cards." ON public.cards;
DROP POLICY IF EXISTS "Users can manage cards in own private packs." ON public.cards;

CREATE POLICY "Cards are readable through visible packs."
ON public.cards FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.packs
    WHERE packs.id = cards.pack_id
      AND (
        COALESCE(packs.is_public, true)
        OR packs.owner_id = (SELECT auth.uid())
        OR EXISTS (
          SELECT 1
          FROM public.profiles
          WHERE profiles.id = (SELECT auth.uid())
            AND profiles.role = 'admin'
        )
      )
  )
);

CREATE POLICY "Admins can manage all cards."
ON public.cards FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
  )
);

CREATE POLICY "Users can manage cards in own private packs."
ON public.cards FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.packs
    WHERE packs.id = cards.pack_id
      AND packs.owner_id = (SELECT auth.uid())
      AND COALESCE(packs.is_public, false) = false
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.packs
    WHERE packs.id = cards.pack_id
      AND packs.owner_id = (SELECT auth.uid())
      AND COALESCE(packs.is_public, false) = false
  )
);

DROP POLICY IF EXISTS "Users can create their own assignments for visible packs" ON public.assignments;

CREATE POLICY "Users can create their own assignments for visible packs"
ON public.assignments FOR INSERT
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.packs
    WHERE packs.id = assignments.pack_id
      AND (
        COALESCE(packs.is_public, true)
        OR packs.owner_id = (SELECT auth.uid())
      )
  )
);
