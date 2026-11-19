-- LOCAL rollback only, after exporting any records to preserve.
-- Never execute this against production as part of the current task.
begin;
drop table if exists public.context_practice_attempts;
commit;
