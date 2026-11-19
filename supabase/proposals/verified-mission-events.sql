-- LOCAL PROPOSAL ONLY. Not a deployable migration and not called by the application.
-- A trusted answer verifier/worker is REQUIRED before activation. Legacy game scores
-- must NEVER be copied into this attestation table merely because they are persisted.
create schema if not exists mission_private;
revoke all on schema mission_private from public,anon,authenticated;
grant usage on schema mission_private to service_role;
create table mission_private.verified_game_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.game_sessions(id),
  user_id uuid not null references public.profiles(id),
  verified_at timestamptz not null default now(),
  verification_method text not null check (verification_method='server_answer_check_v1'),
  verified_mode text not null check (verified_mode in ('multiple_choice','typing','flashcard','matching','listening','speaking')),
  correct_answers integer not null check (correct_answers between 0 and 500),
  wrong_answers integer not null check (wrong_answers between 0 and 500),
  check (correct_answers+wrong_answers between 1 and 500)
);
create table mission_private.processed_events (
  event_id uuid primary key references mission_private.verified_game_events(id),
  processed_at timestamptz not null default now()
);
alter table mission_private.verified_game_events enable row level security;
alter table mission_private.processed_events enable row level security;
revoke all on mission_private.verified_game_events,mission_private.processed_events from public,anon,authenticated,service_role;
-- The internal verifier can attest once; this proposal exposes no verifier endpoint.
grant select,insert on mission_private.verified_game_events to service_role;
grant select,insert on mission_private.processed_events to service_role;

create function mission_private.consume_verified_game_event(p_event_id uuid) returns jsonb
language plpgsql security invoker set search_path=''
as $$
declare
  v_user uuid := auth.uid();
  v_event mission_private.verified_game_events%rowtype;
  v_quest public.user_quests%rowtype;
  v_progress integer;
  v_completed jsonb := '[]'::jsonb;
  v_updated integer := 0;
begin
  -- No p_user_id or client score: the trusted worker must bind the validated
  -- caller session to its DB transaction. A service-key-only call has no user.
  if v_user is null then raise exception 'Authenticated study actor required' using errcode='42501'; end if;
  -- Serialize deliveries without granting UPDATE on immutable attestations.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_event_id::text,0));
  select * into v_event from mission_private.verified_game_events where id=p_event_id and user_id=v_user;
  if not found then raise exception 'Verified event unavailable' using errcode='42501'; end if;
  if v_event.verified_at>now() or not exists (
    select 1 from public.game_sessions s join public.assignments a on a.id=s.assignment_id
    where s.id=v_event.session_id and s.user_id=v_user and a.user_id=v_user
      and a.pack_id is not null
      and (a.game_mode=v_event.verified_mode or (a.game_mode='speaking' and v_event.verified_mode='listening'))
  ) then raise exception 'Invalid event origin' using errcode='42501'; end if;
  if exists(select 1 from mission_private.processed_events where event_id=p_event_id) then
    return jsonb_build_object('duplicate',true,'updated',0,'completed','[]'::jsonb);
  end if;
  -- Stable lock order also serializes different events touching the same missions.
  for v_quest in select * from public.user_quests
    where user_id=v_user and status='active' and created_at<=v_event.verified_at
      and (expires_at is null or (expires_at>now() and expires_at>v_event.verified_at))
    order by id for update
  loop
    if v_quest.quest_type='any_session'
      or (v_quest.quest_type='listening_game' and v_event.verified_mode='listening')
      or (v_quest.quest_type='speaking_game' and v_event.verified_mode='speaking')
      or (v_quest.quest_type='perfect_accuracy' and v_event.wrong_answers=0) then
      v_progress:=least(v_quest.target,v_quest.progress+1);
      update public.user_quests set progress=v_progress,
        status=case when v_progress>=target then 'completed' else 'active' end
        where id=v_quest.id;
      v_updated:=v_updated+1;
      if v_progress>=v_quest.target then v_completed:=v_completed||jsonb_build_array(v_quest.id); end if;
    end if;
  end loop;
  -- If any update or this receipt fails, the entire call rolls back.
  insert into mission_private.processed_events(event_id) values(p_event_id);
  return jsonb_build_object('duplicate',false,'updated',v_updated,'completed',v_completed);
end;
$$;
revoke all on function mission_private.consume_verified_game_event(uuid) from public,anon,authenticated;
grant execute on function mission_private.consume_verified_game_event(uuid) to service_role;
-- Existing public-table RLS and grants are deliberately unchanged.
-- No public RPC wrapper, no service_role swap in an action, no historical backfill.
