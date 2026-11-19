/** Synthetic PostgreSQL for local action and browser integration. Never loads .env. */
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { identities } from './lib/isolated-learning-client.mjs'
const {PGlite}=await import(process.env.PGLITE_MODULE||'@electric-sql/pglite')
const db=new PGlite()
await db.exec(`create role authenticated; create role anon; create role service_role bypassrls; create schema auth;
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth to authenticated,anon,service_role;
 create table profiles(id uuid primary key,username text,role text,weekly_report_enabled boolean default true,updated_at timestamptz,created_at timestamptz default now());
 create table packs(id uuid primary key default gen_random_uuid(),name text,description text,level text,category text,is_public boolean default false,created_at timestamptz default now());
 create table cards(id uuid primary key default gen_random_uuid(),pack_id uuid references packs on delete cascade,english_phrase text,portuguese_translation text,accepted_translations text[] default '{}',audio_url text,created_at timestamptz default now());
 create table assignments(id uuid primary key default gen_random_uuid(),user_id uuid references profiles,pack_id uuid references packs on delete cascade,assigned_by text,assigned_date date,game_mode text,status text default 'pending',created_at timestamptz default now(),reward_badge_id uuid,reward_evaluated boolean default false,unique(user_id,assigned_date,pack_id,game_mode));
 create table user_quests(id uuid primary key default gen_random_uuid(),user_id uuid references profiles,quest_type text,target integer,progress integer default 0,status text default 'active',expires_at timestamptz,created_at timestamptz default now());
 alter table packs enable row level security;alter table cards enable row level security;alter table assignments enable row level security;alter table user_quests enable row level security;
 grant select,insert,update,delete on all tables in schema public to authenticated;grant select on all tables in schema public to anon;`)
await db.exec(await readFile(new URL('../supabase/migrations/20260406154027_add_card_reviews_spaced_repetition.sql',import.meta.url),'utf8'))
await db.exec((await readFile(new URL('../supabase/migrations/20260415211000_add_member_groups_and_assignment_templates.sql',import.meta.url),'utf8')).replaceAll('extensions.uuid_generate_v4()', 'gen_random_uuid()'))
await db.exec(`create table game_sessions(id uuid primary key default gen_random_uuid(),user_id uuid references profiles,assignment_id uuid references assignments,correct_answers integer,wrong_answers integer,max_streak integer,completed_at timestamptz default now());alter table game_sessions enable row level security;`)
await db.exec(await readFile(new URL('../supabase/migrations/20260520000002_add_user_owned_packs.sql',import.meta.url),'utf8'))
const initial=await readFile(new URL('../supabase/migrations/20260404162407_01_initial_schema.sql',import.meta.url),'utf8')
for(const statement of initial.split(';'))if(/CREATE POLICY/i.test(statement)&&/ON public.(assignments|game_sessions)/i.test(statement))await db.exec(statement+';')
const gamification=await readFile(new URL('../supabase/migrations/20260425120000_add_gamification_and_social.sql',import.meta.url),'utf8')
for(const statement of gamification.split(';'))if(/CREATE TABLE public.(badges|user_badges) /i.test(statement))await db.exec(statement.replaceAll('extensions.uuid_generate_v4()', 'gen_random_uuid()')+';')
await db.exec('alter table badges enable row level security;alter table user_badges enable row level security;grant select,insert,update,delete on all tables in schema public to authenticated;grant select on all tables in schema public to anon;')
for(const statement of gamification.split(';'))if(/CREATE POLICY/i.test(statement)&&/ON public.(user_quests|badges|user_badges)/i.test(statement))await db.exec(statement+';')
await db.exec(await readFile(new URL('../supabase/migrations/20261117014908_atomic_member_group_edit.sql',import.meta.url),'utf8'))
await db.exec(await readFile(new URL('../supabase/proposals/verified-mission-events.sql',import.meta.url),'utf8'))
await db.exec('grant select,update on user_quests to service_role;grant select on game_sessions,assignments to service_role;')
// Test-only failure triggers: never shipped in either SQL artifact.
await db.exec(`create function synthetic_failure() returns trigger language plpgsql as $$ begin
 if current_setting('kivora.test_failure',true)=TG_OP||':'||TG_TABLE_NAME then raise exception 'Synthetic late failure';end if;return null;end;$$;
 create trigger fail_group_update after update on member_groups for each statement execute function synthetic_failure();
 create trigger fail_members_insert after insert on member_group_members for each statement execute function synthetic_failure();
 create trigger fail_members_delete after delete on member_group_members for each statement execute function synthetic_failure();
 create trigger fail_quest_update after update on user_quests for each statement execute function synthetic_failure();
 create trigger fail_event_receipt after insert on mission_private.processed_events for each statement execute function synthetic_failure();`)
let fault=null
const pack='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',otherPack='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',publicPack='cccccccc-cccc-4ccc-8ccc-cccccccccccc'
async function reset(config={}){
 await db.exec('truncate mission_private.processed_events,mission_private.verified_game_events,user_badges,badges,game_sessions,member_group_members,member_groups,card_reviews,user_quests,assignments,cards,packs,profiles cascade')
 for(const [role,id] of Object.entries(identities))await db.query('insert into profiles(id,username,role) values($1,$2,$3)',[id,role,role==='admin'?'admin':'member'])
 await db.query('insert into packs(id,name,owner_id,is_public,level) values($1,$2,$3,false,$4),($5,$6,$7,false,$4),($8,$9,null,true,$4)',[pack,'Coleção local',identities.learner,'A1',otherPack,'Coleção privada alheia',identities.other,publicPack,'Coleção pública'])
 for(let i=1;i<=55;i++)await db.query('insert into cards(pack_id,english_phrase,portuguese_translation,created_at) values($1,$2,$3,$4)',[pack,`Local word ${String(i).padStart(2,'0')}`,`Palavra ${i}`,new Date(2026,0,1,0,0,i).toISOString()])
 await db.query("insert into cards(pack_id,english_phrase,portuguese_translation) values($1,'Private secret','Privado'),($2,'Public example','Público')",[otherPack,publicPack])
 fault=config.fault||null
}
await reset()
const tables=new Set(['profiles','packs','cards','assignments','user_quests','member_groups','member_group_members','card_reviews','badges','user_badges','game_sessions','verified_game_events','processed_events'])
const ident=value=>{if(['verified_game_events','processed_events'].includes(value))return `mission_private."${value}"`;if(!/^[a-z_]+$/.test(value))throw Error('Unsupported fixture identifier');return `"${value}"`}
async function query({role,table,operations}){
 if(!tables.has(table))return {data:[],error:null,count:0}
 if(fault&&fault.table===table){const mutation=operations.some(([name])=>['insert','upsert','update','delete'].includes(name));if(!fault.mutationOnly||mutation){fault=null;return {data:null,error:{message:'Synthetic database failure'},count:null}}}
 try{return await db.transaction(async tx=>{
  if(role!=='service'){await tx.exec(`set local role ${role==='anon'?'anon':'authenticated'}`);await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[identities[role]||'',])}
  const values=[],where=[];const bind=value=>{values.push(value);return `$${values.length}`}
  let conflict=null,select='*',mode='select',payload,single=false,limit='',orders=[]
  for(const [name,args] of operations){
   if(name==='select')select=args[0]||'*'
   else if(['insert','upsert','update','delete'].includes(name)){mode=name;payload=args[0];conflict=args[1]?.onConflict||null}
   else if(name==='single'||name==='maybeSingle')single=true
   else if(name==='eq'){if(args[0]==='packs.owner_id')where.push(`pack_id in (select id from packs where owner_id=${bind(args[1])})`);else if(args[0].startsWith('assignments.'))where.push(`assignment_id in (select id from assignments where ${ident(args[0].split('.')[1])}=${bind(args[1])})`);else where.push(`${ident(args[0])}=${bind(args[1])}`)}
   else if(['lt','lte','gt','gte'].includes(name))where.push(`${ident(args[0])}${{lt:'<',lte:'<=',gt:'>',gte:'>='}[name]}${bind(args[1])}`)
   else if(name==='not'&&args[1]==='is'&&args[2]===null)where.push(`${ident(args[0])} is not null`)
   else if(name==='in')where.push(`${ident(args[0])} in (${args[1].map(bind).join(',')||'null'})`)
   else if(name==='not'&&args[1]==='like')where.push(`${ident(args[0])} not like ${bind(args[2])}`)
   else if(name==='order')orders.push(`${ident(args[0])} ${args[1]?.ascending===false?'desc':'asc'}`)
   else if(name==='limit')limit=` limit ${Math.max(0,Math.min(1000,Number(args[0])))}`
   else if(name==='range')limit=` limit ${Number(args[1])-Number(args[0])+1} offset ${Number(args[0])}`
   else if(name==='or'){const terms=args[0].split(',').map(term=>{const m=term.match(/^(english_phrase|portuguese_translation)\.ilike\.(.*)$/);if(!m)throw Error('Unsupported search');return `${ident(m[1])} ilike ${bind(m[2])}`});where.push('('+terms.join(' or ')+')')}
  }
  const clause=where.length?' where '+where.join(' and '):''
  let rows,count
  if(mode==='select'){
   count=Number((await tx.query(`select count(*) as count from ${ident(table)}${clause}`,values)).rows[0].count)
   rows=(await tx.query(`select * from ${ident(table)}${clause}${orders.length?' order by '+orders.join(','):''}${limit}`,values)).rows
  }else if(mode==='insert'||mode==='upsert'){
   rows=[]
   for(const item of Array.isArray(payload)?payload:[payload]){const keys=Object.keys(item),params=keys.map(k=>item[k]);rows.push(...(await tx.query(`insert into ${ident(table)} (${keys.map(ident)}) values (${keys.map((_,i)=>'$'+(i+1))})${mode==='upsert'?` on conflict (${(conflict||'user_id,assigned_date,pack_id,game_mode').split(',').map(ident)}) do update set ${keys.map(k=>`${ident(k)}=excluded.${ident(k)}`).join(',')}`:''} returning *`,params)).rows)}
  }else if(mode==='update'){
   const assignments=Object.entries(payload).map(([key,value])=>`${ident(key)}=${bind(value)}`)
   rows=(await tx.query(`update ${ident(table)} set ${assignments.join(',')}${clause} returning *`,values)).rows
  }else rows=(await tx.query(`delete from ${ident(table)}${clause} returning *`,values)).rows
  if(table==='packs'&&select.includes('cards(count)'))for(const row of rows){row.cards=[{count:Number((await tx.query('select count(*) as count from cards where pack_id=$1',[row.id])).rows[0].count)}];row.assignments=(await tx.query('select * from assignments where pack_id=$1',[row.id])).rows}
  if(table==='user_quests'&&select.includes('profiles'))for(const row of rows){row.profiles=(await tx.query('select username from profiles where id=$1',[row.user_id])).rows[0]}
  if(table==='member_groups'&&select.includes('member_group_members'))for(const row of rows){row.member_group_members=(await tx.query('select m.user_id,p.username from member_group_members m join profiles p on p.id=m.user_id where m.group_id=$1',[row.id])).rows.map(m=>({user_id:m.user_id,profiles:{id:m.user_id,username:m.username}}))}
  if(table==='assignments'&&select.includes('profiles'))for(const row of rows){row.profiles=(await tx.query('select username from profiles where id=$1',[row.user_id])).rows[0];row.packs=(await tx.query('select name from packs where id=$1',[row.pack_id])).rows[0]}
  if(table==='game_sessions'&&select.includes('assignments'))for(const row of rows)row.assignments=(await tx.query('select * from assignments where id=$1',[row.assignment_id])).rows[0]
  if(select!=='*'&&!select.includes('('))rows=rows.map(row=>Object.fromEntries(select.split(',').map(key=>[key.trim(),row[key.trim()]])))
  if(single&&rows.length>1)throw Error('Expected at most one row')
  return {data:single?(rows[0]??null):rows,error:null,count:count??rows.length}
 })}catch(error){return {data:null,error:{message:error.message,code:error.code},count:null}}
}
async function rpc({role,name,args,actor}){
 if(name!=='update_member_group_atomic'&&name!=='consume_verified_game_event')return {data:null,error:{code:'42883',message:'Unavailable function'}}
 const activeFault=fault;if(activeFault?.rpcStage||activeFault?.rpcMissing)fault=null
 if(activeFault?.rpcMissing)return {data:null,error:{code:'PGRST202',message:'Function absent'}}
 try{return await db.transaction(async tx=>{
  await tx.exec(`set local role ${role==='service'?'service_role':role==='anon'?'anon':'authenticated'}`)
  // Actor override exists only on this synthetic loopback harness, not in application code.
  await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[identities[role==='service'?actor:role]||''])
  if(activeFault?.rpcStage)await tx.query("select set_config('kivora.test_failure',$1,true)",[activeFault.rpcStage])
  const result=name==='update_member_group_atomic'
   ?await tx.query('select public.update_member_group_atomic($1,$2,$3,$4,$5) as result',[args.p_group_id,args.p_expected,args.p_name,args.p_description,args.p_member_ids])
   :await tx.query('select mission_private.consume_verified_game_event($1) as result',[args.p_event_id])
  return {data:result.rows[0].result,error:null}
 })}catch(error){return {data:null,error:{message:error.message,code:error.code}}}
}
// Trusted fixtures are created only for tests of the disabled proposal; no actual verifier exists yet.
async function attest({sessionId,userId,mode='typing',correct=1,wrong=0,verifiedAt}){
 try {const row=await db.query(`insert into mission_private.verified_game_events(session_id,user_id,verified_mode,verification_method,correct_answers,wrong_answers,verified_at) values($1,$2,$3,'server_answer_check_v1',$4,$5,coalesce($6::timestamptz,now())) returning *`,[sessionId,userId,mode,correct,wrong,verifiedAt||null]);return {data:row.rows[0],error:null}}catch(error){return {data:null,error:{code:error.code,message:error.message}}}
}
async function auditIntegrity(){
 return (await db.query(`select
  (select bool_and(not prosecdef) from pg_proc where proname in ('update_member_group_atomic','consume_verified_game_event')) as invoker_only,
  has_schema_privilege('authenticated','mission_private','usage') as client_private_schema,
  has_function_privilege('anon','public.update_member_group_atomic(uuid,jsonb,text,text,uuid[])','execute') as anon_group_rpc,
  has_function_privilege('authenticated','mission_private.consume_verified_game_event(uuid)','execute') as client_mission_rpc,
  has_table_privilege('service_role','mission_private.verified_game_events','update') as worker_edits_attestation,
  has_table_privilege('service_role','mission_private.processed_events','delete') as worker_deletes_receipts
 `)).rows[0]
}
const server=createServer(async(req,res)=>{const send=(status,value)=>{res.writeHead(status,{'content-type':'application/json'});res.end(JSON.stringify(value))};try{let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>200000)throw Error('Too large')};const body=JSON.parse(raw||'{}');if(req.url==='/reset'){await reset(body);send(200,{pack,otherPack,publicPack,identities})}else if(req.url==='/audit-integrity')send(200,await auditIntegrity());else if(req.url==='/rpc')send(200,await rpc(body));else if(req.url==='/attest')send(200,await attest(body));else if(req.url==='/fault'){fault=body;send(200,{ok:true})}else if(req.url==='/query')send(200,await query(body));else send(404,{error:'Not found'})}catch(error){send(500,{error:error.message})}})
server.listen(3212,'127.0.0.1',()=>console.log('Workflow PostgreSQL fixture on http://127.0.0.1:3212'))
process.on('SIGTERM',async()=>{server.close();await db.close();process.exit()})
