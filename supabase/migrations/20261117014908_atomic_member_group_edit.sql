-- Applied to the authorized hosted project on 2026-11-16 (America/Maceio).
-- Version matches the hosted migration history assigned by Supabase MCP.
-- One RPC = one transaction. Existing table grants and RLS remain authoritative.
create or replace function public.update_member_group_atomic(
  p_group_id uuid,
  p_expected jsonb,
  p_name text,
  p_description text,
  p_member_ids uuid[]
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_group public.member_groups%rowtype;
  v_members uuid[];
  v_current jsonb;
  v_desired jsonb;
begin
  if auth.uid() is null or not exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ) then
    raise exception 'Administrator required' using errcode = '42501';
  end if;
  if p_name is null or length(trim(p_name)) < 2 or p_expected is null
    or jsonb_typeof(p_expected) <> 'object' or cardinality(p_member_ids) is null
    or cardinality(p_member_ids) < 1 or cardinality(p_member_ids) > 10000
    or array_position(p_member_ids, null) is not null then
    raise exception 'Invalid group edit' using errcode = '22023';
  end if;
  select array_agg(distinct id order by id) into v_members from unnest(p_member_ids) as ids(id);
  -- Every editor using this operation locks the same parent before reading membership.
  select * into v_group from public.member_groups where id = p_group_id for update;
  if not found then raise exception 'Group unavailable' using errcode = 'P0002'; end if;
  select jsonb_build_object('name',v_group.name,'description',v_group.description,
    'memberIds',coalesce(jsonb_agg(user_id order by user_id),'[]'::jsonb))
    into v_current from public.member_group_members where group_id = p_group_id;
  v_desired := jsonb_build_object('name',trim(p_name),'description',nullif(p_description,''),'memberIds',to_jsonb(v_members));
  -- A lost-response retry of the same desired state is harmless.
  if v_current = v_desired then return p_group_id; end if;
  if v_current is distinct from p_expected then
    raise exception 'Group changed; reload before editing' using errcode = '40001';
  end if;
  update public.member_groups set name=trim(p_name),description=nullif(p_description,'') where id=p_group_id;
  insert into public.member_group_members(group_id,user_id)
    select p_group_id,id from unnest(v_members) as ids(id) on conflict(group_id,user_id) do nothing;
  delete from public.member_group_members where group_id=p_group_id and not(user_id=any(v_members));
  -- RLS can silently filter writes. Do not report success for an incomplete replacement.
  select jsonb_build_object('name',g.name,'description',g.description,
    'memberIds',(select coalesce(jsonb_agg(m.user_id order by m.user_id),'[]'::jsonb)
      from public.member_group_members m where m.group_id=g.id))
    into v_current from public.member_groups g where g.id=p_group_id;
  if v_current is distinct from v_desired then
    raise exception 'Group edit was not fully applied' using errcode = '42501';
  end if;
  return p_group_id;
end;
$$;
revoke all on function public.update_member_group_atomic(uuid,jsonb,text,text,uuid[]) from public,anon,authenticated;
grant execute on function public.update_member_group_atomic(uuid,jsonb,text,text,uuid[]) to authenticated;
