import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'

// Run with PGLITE_MODULE pointing at a temporary installation, or install
// @electric-sql/pglite in the verification environment. No production database.
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite')
const db = new PGlite()
try {
  await db.exec(`
    CREATE ROLE anon;
    CREATE ROLE authenticated;
    CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
      $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    GRANT USAGE ON SCHEMA auth TO authenticated;
    CREATE TABLE public.profiles(id uuid PRIMARY KEY);
    CREATE TABLE public.packs(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL,
      description text,level text,is_public boolean,owner_id uuid REFERENCES profiles(id),category text);
    CREATE TABLE public.cards(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),pack_id uuid REFERENCES packs(id),
      english_phrase text NOT NULL,portuguese_translation text NOT NULL,accepted_translations text[],audio_url text);
    CREATE TABLE public.assignments(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid REFERENCES profiles(id),
      pack_id uuid REFERENCES packs(id),assigned_date date,assigned_by text,game_mode text,status text,
      UNIQUE(user_id,assigned_date,pack_id,game_mode));
    CREATE TABLE public.user_cefr_assessments(user_id uuid,estimated_level text);
    CREATE TABLE public.learning_plan_history(level text);
    CREATE TABLE public.learning_resource_events(level text);
    GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
    ALTER TABLE public.packs ENABLE ROW LEVEL SECURITY;
    GRANT SELECT ON public.packs TO authenticated;
    CREATE POLICY private_packs ON public.packs FOR SELECT TO authenticated
      USING (is_public OR owner_id=(SELECT auth.uid()));
  `)
  await db.exec(await readFile(new URL('../supabase/migrations/20260910185333_adaptive_learning_pipeline.sql', import.meta.url), 'utf8'))
  const userA = randomUUID(), userB = randomUUID()
  await db.query('INSERT INTO profiles VALUES ($1),($2)', [userA, userB])
  await db.exec('SET ROLE service_role')
  const [{ id: jobId }] = (await db.query("INSERT INTO personal_learning_jobs(user_id,plan_date) VALUES ($1,'2026-09-10') RETURNING id", [userA])).rows
  await assert.rejects(db.query("INSERT INTO personal_learning_jobs(user_id,plan_date) VALUES ($1,'2026-09-10')", [userA]), /duplicate key/)
  const [job] = (await db.query('SELECT * FROM claim_personal_learning_job($1)', [jobId])).rows
  assert.equal(job.attempts, 1)
  assert.equal((await db.query('SELECT * FROM claim_personal_learning_job($1)', [jobId])).rows.length, 0)
  const plan = { level: 'A1', focus: 'foundation', topic: 'Everyday English', objective: 'Ask for help.' }
  const cards = ['Can you help me?', 'Where is the hotel?', 'I need a ticket.', 'My room is ready.'].map((en, i) => ({
    id: randomUUID(), en, pt: `Tradução ${i}`, audioUrl: `https://example.supabase.co/storage/v1/object/public/card_audios/${randomUUID()}.mp3`,
  }))
  await db.query("UPDATE personal_learning_jobs SET plan=$2,cards=$3,status='audio' WHERE id=$1", [jobId, JSON.stringify(plan), JSON.stringify(cards.map(({ audioUrl: _, ...card }) => card))])
  await assert.rejects(db.query('SELECT publish_personal_learning_job($1,$2)', [jobId, job.lease_token]), /Every card must/)
  assert.equal((await db.query('SELECT count(*)::int AS n FROM packs')).rows[0].n, 0)
  await db.query('UPDATE personal_learning_jobs SET cards=$2 WHERE id=$1', [jobId, JSON.stringify(cards)])
  const packId = (await db.query('SELECT publish_personal_learning_job($1,$2) AS id', [jobId, job.lease_token])).rows[0].id
  assert.ok(packId)
  assert.equal((await db.query('SELECT publish_personal_learning_job($1,$2) AS id', [jobId, job.lease_token])).rows[0].id, packId)
  assert.equal((await db.query('SELECT count(*)::int AS n FROM cards')).rows[0].n, 4)
  assert.equal((await db.query('SELECT count(*)::int AS n FROM assignments')).rows[0].n, 3)
  assert.deepEqual((await db.query('SELECT game_mode FROM assignments ORDER BY game_mode')).rows.map((r) => r.game_mode), ['listening','multiple_choice','speaking'])
  assert.equal((await db.query('SELECT is_public FROM packs')).rows[0].is_public, false)
  // A dead worker can be recovered; its fencing token can no longer publish.
  const expiredId = (await db.query("INSERT INTO personal_learning_jobs(user_id,plan_date) VALUES ($1,'2026-09-11') RETURNING id", [userA])).rows[0].id
  const firstLease = (await db.query('SELECT * FROM claim_personal_learning_job($1)', [expiredId])).rows[0]
  await db.query("UPDATE personal_learning_jobs SET lease_until=now()-interval '1 second' WHERE id=$1", [expiredId])
  const replacement = (await db.query('SELECT * FROM claim_personal_learning_job($1)', [expiredId])).rows[0]
  assert.notEqual(firstLease.lease_token, replacement.lease_token)
  await assert.rejects(db.query('SELECT publish_personal_learning_job($1,$2)', [expiredId, firstLease.lease_token]), /lease expired/)
  await db.query("UPDATE personal_learning_jobs SET attempts=3,lease_until=now()-interval '1 second' WHERE id=$1", [expiredId])
  assert.equal((await db.query('SELECT * FROM claim_personal_learning_job($1)', [expiredId])).rows.length, 0)
  await db.exec("INSERT INTO user_cefr_assessments(estimated_level) VALUES ('C2'); INSERT INTO learning_plan_history VALUES ('C1'); INSERT INTO learning_resource_events VALUES ('C2');")
  await db.exec('RESET ROLE; SET ROLE authenticated')
  await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [userB])
  assert.equal((await db.query('SELECT id,status FROM personal_learning_jobs')).rows.length, 0)
  assert.equal((await db.query('SELECT id FROM packs')).rows.length, 0)
  await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [userA])
  assert.equal((await db.query('SELECT id,status FROM personal_learning_jobs')).rows.length, 2)
  assert.equal((await db.query('SELECT id FROM packs')).rows.length, 1)
  await assert.rejects(db.query('SELECT cards,lease_token FROM personal_learning_jobs'), /permission denied/)
  await assert.rejects(db.query("UPDATE personal_learning_jobs SET status='ready'"), /permission denied/)
  await assert.rejects(db.query('SELECT * FROM claim_personal_learning_job($1)', [jobId]), /permission denied/)
  await assert.rejects(db.query('SELECT publish_personal_learning_job($1,$2)', [jobId, job.lease_token]), /permission denied/)
  await db.exec('RESET ROLE; SET ROLE anon')
  await assert.rejects(db.query('SELECT id FROM personal_learning_jobs'), /permission denied/)
  console.log('PASS: migration, daily uniqueness, exclusive claims, fenced retry, retry limit, complete atomic publication, idempotency, A1-C2, member isolation and denied client writes/RPCs.')
} finally {
  await db.close()
}
