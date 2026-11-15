-- Persist the first actual answer, separately from the most recent answer.
-- Historical multi-answer rows cannot be reconstructed exactly without an event log.
alter table public.card_reviews add column if not exists first_reviewed_at timestamptz;

update public.card_reviews
set first_reviewed_at = review_date
where first_reviewed_at is null and total_reviews = 1;

create or replace function public.set_card_review_first_seen()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if coalesce(new.total_reviews, 0) > 0 then
      new.first_reviewed_at := coalesce(new.first_reviewed_at, new.review_date, now());
    end if;
  elsif coalesce(old.total_reviews, 0) = 0 and coalesce(new.total_reviews, 0) > 0 then
    new.first_reviewed_at := coalesce(old.first_reviewed_at, new.first_reviewed_at, new.review_date, now());
  elsif old.first_reviewed_at is not null then
    new.first_reviewed_at := old.first_reviewed_at;
  end if;
  return new;
end;
$$;

drop trigger if exists card_review_first_seen on public.card_reviews;
create trigger card_review_first_seen before insert or update on public.card_reviews
for each row execute function public.set_card_review_first_seen();
