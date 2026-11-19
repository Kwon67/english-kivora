-- Staged locally. Do not apply to production without a separately authorized release.
begin;
create table public.context_practice_attempts (
  user_id uuid not null references auth.users(id) on delete cascade,
  attempt_id uuid not null,
  lesson_id text not null check (length(lesson_id) between 1 and 100),
  level text not null check (level in ('A1','A2','B1','B2','C1','C2')),
  response text not null check (length(trim(response)) between 1 and 6000),
  revision text not null check (length(trim(revision)) between 1 and 6000),
  comprehension_choice smallint not null check (comprehension_choice between 0 and 2),
  first_choice smallint check (first_choice between 0 and 2),
  hints_used boolean not null default false,
  oral_self_report boolean not null default false,
  self_checks boolean[] not null check (array_ndims(self_checks) = 1 and cardinality(self_checks) = 3 and array_position(self_checks, null) is null),
  evidence_source text not null default 'self_review' check (evidence_source = 'self_review'),
  completed_at timestamptz not null default now(),
  primary key (user_id, attempt_id)
);
create index context_practice_latest on public.context_practice_attempts (user_id, lesson_id, completed_at desc);
alter table public.context_practice_attempts enable row level security;
revoke all on public.context_practice_attempts from public, anon, authenticated;
grant select on public.context_practice_attempts to authenticated;
grant insert (user_id, attempt_id, lesson_id, level, response, revision, comprehension_choice, self_checks, first_choice, hints_used, oral_self_report) on public.context_practice_attempts to authenticated;
create policy context_practice_read_own on public.context_practice_attempts for select to authenticated using ((select auth.uid()) = user_id);
create policy context_practice_insert_own on public.context_practice_attempts for insert to authenticated with check ((select auth.uid()) = user_id);
comment on table public.context_practice_attempts is 'Self-reviewed contextual practice. Not a CEFR certificate or automatic level-unlock signal. Immutable attempts support idempotent retries.';
commit;
