import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite')
const db = new PGlite()
try {
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to authenticated;
    insert into auth.users values ('11111111-1111-4111-8111-111111111111'), ('22222222-2222-4222-8222-222222222222');`)
  await db.exec(await readFile(new URL('../supabase/migrations/20261116204157_context_practice_attempts.sql', import.meta.url), 'utf8'))
  await db.exec("set role authenticated; select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false)")
  const insert = `insert into context_practice_attempts(user_id,attempt_id,lesson_id,level,response,revision,comprehension_choice,self_checks)
    values($1,'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','a1-meeting-01',$2,'Hi Maya.','Hi Maya, ten is fine. Can I bring a friend?',1,array[true,true,true])`
  const owner = '11111111-1111-4111-8111-111111111111', other = '22222222-2222-4222-8222-222222222222'
  await assert.rejects(db.query(insert, [other, 'A1']), /row-level security/)
  await assert.rejects(db.query(insert, [owner, 'C3']), /check constraint/)
  await db.query(insert, [owner, 'A1'])
  await assert.rejects(db.query(insert, [owner, 'A1']), /duplicate key/)
  assert.equal((await db.query('select * from context_practice_attempts')).rows.length, 1)
  await assert.rejects(db.query("update context_practice_attempts set evidence_source='external_review'"), /permission denied/)
  await assert.rejects(db.query("insert into context_practice_attempts(user_id,attempt_id,lesson_id,level,response,revision,comprehension_choice,self_checks,completed_at) values($1,'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','a1-meeting-01','A1','Hi.','Hi Maya.',1,array[true,true,true],now())", [owner]), /permission denied/)
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [other])
  assert.equal((await db.query('select * from context_practice_attempts')).rows.length, 0)
  await db.exec('reset role; set role anon')
  await assert.rejects(db.query('select * from context_practice_attempts'), /permission denied/)
  await db.exec('reset role')
  await db.exec(await readFile(new URL('../supabase/proposals/rollback-context-practice.sql', import.meta.url), 'utf8'))
  assert.equal((await db.query("select to_regclass('public.context_practice_attempts') as relation")).rows[0].relation, null)
  console.log('PASS: isolated PostgreSQL migration, ownership, anonymous denial, immutable self-review evidence, invalid level, duplicate retry and local rollback.')
} finally { await db.close() }
