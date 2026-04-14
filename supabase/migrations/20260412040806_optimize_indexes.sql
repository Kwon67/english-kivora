CREATE INDEX IF NOT EXISTS assignments_pack_id_idx ON public.assignments(pack_id);
CREATE INDEX IF NOT EXISTS card_reviews_card_id_idx ON public.card_reviews(card_id);
CREATE INDEX IF NOT EXISTS cards_pack_id_idx ON public.cards(pack_id);
CREATE INDEX IF NOT EXISTS game_sessions_assignment_id_idx ON public.game_sessions(assignment_id);
CREATE INDEX IF NOT EXISTS game_sessions_user_id_idx ON public.game_sessions(user_id);;
