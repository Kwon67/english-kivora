/** Native PostgreSQL concurrency test. Temporary cluster, loopback only, no .env. */
import assert from 'node:assert/strict'
import { mkdtemp,readFile,rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const {default:EmbeddedPostgres}=await import(process.env.EMBEDDED_POSTGRES_MODULE||'embedded-postgres')
const directory=await mkdtemp(join(tmpdir(),'kivora-integrity-pg-'))
const pg=new EmbeddedPostgres({databaseDir:join(directory,'data'),user:'fixture_admin',password:'synthetic-local-only',port:3213,persistent:false,autoRehydrateSymlinks:true,postgresFlags:['-h','127.0.0.1','-k',directory],onLog:()=>{},onError:message=>console.error(message)})
const clients=[]
const admin='33333333-3333-4333-8333-333333333333',owner='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222'
const source=path=>readFile(new URL('../'+path,import.meta.url),'utf8')
let started=false
try{
 await pg.initialise();await pg.start();started=true
 for(let i=0;i<3;i++){const client=pg.getPgClient('postgres','127.0.0.1');await client.connect();clients.push(client)}
 const [observer,a,b]=clients
 await observer.query(`create role authenticated;create role anon;create role service_role bypassrls;create schema auth;
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth to authenticated,anon,service_role;
 create table profiles(id uuid primary key,role text);create table packs(id uuid primary key default gen_random_uuid());
 create table assignments(id uuid primary key default gen_random_uuid(),user_id uuid references profiles,pack_id uuid references packs,game_mode text);
 create table game_sessions(id uuid primary key default gen_random_uuid(),assignment_id uuid references assignments,user_id uuid references profiles);
 create table user_quests(id uuid primary key default gen_random_uuid(),user_id uuid references profiles,quest_type text,target int,progress int default 0,status text default 'active',created_at timestamptz default now(),expires_at timestamptz);
 alter table user_quests enable row level security;`)
 await observer.query((await source('supabase/migrations/20260415211000_add_member_groups_and_assignment_templates.sql')).replaceAll('extensions.uuid_generate_v4()','gen_random_uuid()'))
 await observer.query('grant select,insert,update,delete on all tables in schema public to authenticated;grant select on game_sessions,assignments to service_role;grant select,update on user_quests to service_role;')
 await observer.query(await source('supabase/migrations/20261117014908_atomic_member_group_edit.sql'))
 await observer.query(await source('supabase/proposals/verified-mission-events.sql'))
 await observer.query("insert into profiles values($1,'admin'),($2,'member'),($3,'member')",[admin,owner,other])
 const begin=async(client,role,user)=>{await client.query('begin');await client.query(`set local role ${role}`);await client.query("select set_config('request.jwt.claim.sub',$1,true)",[user])}
 const blocked=async()=>{
  const deadline=Date.now()+5000
  while(Date.now()<deadline){const {rows}=await observer.query('select wait_event_type from pg_stat_activity where pid=$1',[b.processID]);if(rows[0]?.wait_event_type==='Lock')return;await new Promise(resolve=>setTimeout(resolve,10))}
  throw Error('Second physical connection did not reach a lock wait')
 }
 const group=(await observer.query("insert into member_groups(name) values('Original') returning id")).rows[0].id
 await observer.query('insert into member_group_members(group_id,user_id) values($1,$2)',[group,owner])
 const edit=(client,name,members)=>client.query('select public.update_member_group_atomic($1,$2,$3,null,$4)',[group,{name:'Original',description:null,memberIds:[owner]},name,members])
 await begin(a,'authenticated',admin);await edit(a,'Editor A',[owner,other]);await begin(b,'authenticated',admin)
 const competing=edit(b,'Editor B',[other]).then(result=>({result}),error=>({error}))
 await blocked();assert.equal((await observer.query('select name from member_groups where id=$1',[group])).rows[0].name,'Original')
 await a.query('commit');assert.equal((await competing).error?.code,'40001');await b.query('rollback')
 assert.equal((await observer.query('select name from member_groups where id=$1',[group])).rows[0].name,'Editor A')
 const members=(await observer.query('select user_id from member_group_members where group_id=$1 order by user_id',[group])).rows.map(row=>row.user_id);assert.deepEqual(members,[owner,other])
 console.log('PASS group: physical row-lock wait, atomic visibility, stale writer rejected')
 const pack=(await observer.query('insert into packs default values returning id')).rows[0].id
 const assignment=(await observer.query("insert into assignments(user_id,pack_id,game_mode) values($1,$2,'typing') returning id",[owner,pack])).rows[0].id
 const quest=(await observer.query("insert into user_quests(user_id,quest_type,target) values($1,'any_session',3) returning id",[owner])).rows[0].id
 const event=async()=>{const session=(await observer.query('insert into game_sessions(user_id,assignment_id) values($1,$2) returning id',[owner,assignment])).rows[0].id;return(await observer.query("insert into mission_private.verified_game_events(session_id,user_id,verified_mode,verification_method,correct_answers,wrong_answers) values($1,$2,'typing','server_answer_check_v1',1,0) returning id",[session,owner])).rows[0].id}
 const consume=(client,id)=>client.query('select mission_private.consume_verified_game_event($1) as result',[id])
 const first=await event();await begin(a,'service_role',owner);await consume(a,first);await begin(b,'service_role',owner)
 const repeat=consume(b,first);await blocked();assert.equal((await observer.query('select progress from user_quests where id=$1',[quest])).rows[0].progress,0)
 await a.query('commit');assert.equal((await repeat).rows[0].result.duplicate,true);await b.query('commit')
 assert.equal((await observer.query('select progress from user_quests where id=$1',[quest])).rows[0].progress,1)
 console.log('PASS event replay: physical advisory-lock wait and one credit')
 const second=await event(),third=await event();await begin(a,'service_role',owner);await consume(a,second);await begin(b,'service_role',owner)
 const distinct=consume(b,third);await blocked();await a.query('commit');assert.equal((await distinct).rows[0].result.updated,1);await b.query('commit')
 assert.equal((await observer.query('select progress from user_quests where id=$1',[quest])).rows[0].progress,3)
 assert.equal(Number((await observer.query('select count(*) from mission_private.processed_events')).rows[0].count),3)
 console.log('PASS distinct events: physical mission-row wait, no lost increment')
 const nextQuest=(await observer.query("insert into user_quests(user_id,quest_type,target) values($1,'any_session',1) returning id",[owner])).rows[0].id
 const fourth=await event();await begin(a,'service_role',owner);await consume(a,fourth);await begin(b,'service_role',owner)
 const recovery=consume(b,fourth);await blocked();await a.query('rollback');assert.equal((await recovery).rows[0].result.duplicate,false);await b.query('commit')
 assert.equal((await observer.query('select progress from user_quests where id=$1',[nextQuest])).rows[0].progress,1)
 assert.equal(Number((await observer.query('select count(*) from mission_private.processed_events where event_id=$1',[fourth])).rows[0].count),1)
 console.log('PASS rollback: waiting delivery recovers without a phantom receipt')
 console.log(JSON.stringify({passed:4,connections:clients.map(c=>c.processID),postgres:(await observer.query('show server_version')).rows[0].server_version}))
}finally{
 await Promise.allSettled(clients.map(client=>client.end()))
 if(started)await pg.stop()
 await rm(directory,{recursive:true,force:true})
}
