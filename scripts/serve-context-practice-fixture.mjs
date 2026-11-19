/** Local integration test server. Synthetic identities only; never loads application credentials. */
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite')
const db = new PGlite()
const owner = '11111111-1111-4111-8111-111111111111'
await db.exec(`create role anon; create role authenticated; create schema auth;
  create table auth.users(id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
  grant usage on schema auth to authenticated;
  insert into auth.users values ('${owner}');`)
await db.exec(await readFile(new URL('../supabase/migrations/20261116204157_context_practice_attempts.sql', import.meta.url), 'utf8'))
let failBefore = 0, loseResponse = 0
const server = createServer(async (req, res) => {
  const send = (status, body) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)) }
  try {
    const url = new URL(req.url, 'http://127.0.0.1:3211')
    let raw = ''; for await (const chunk of req) { raw += chunk; if (raw.length > 50000) throw new Error('Fixture body too large') }
    if (url.pathname === '/__fixture') {
      if (req.method === 'POST') {
        const config = JSON.parse(raw || '{}'); failBefore = config.failBefore ?? 0; loseResponse = config.loseResponse ?? 0
        await db.exec('delete from context_practice_attempts'); send(200, { ok: true }); return
      }
      send(200, { count: (await db.query('select count(*)::int as count from context_practice_attempts')).rows[0].count }); return
    }
    if (url.pathname !== '/rest/v1/context_practice_attempts' || req.headers.authorization !== 'Bearer fixture-owner') { send(403, { message: 'Fixture identity required' }); return }
    if (req.method === 'POST' && failBefore > 0) { failBefore--; send(503, { code: '08006', message: 'Simulated failure before commit' }); return }
    const rows = await db.transaction(async tx => {
      await tx.exec('set local role authenticated')
      await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [owner])
      if (req.method === 'POST') {
        const p = JSON.parse(raw)
        return (await tx.query(`insert into context_practice_attempts(user_id,attempt_id,lesson_id,level,response,revision,comprehension_choice,self_checks,first_choice,hints_used,oral_self_report)
          values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning *`, [p.user_id,p.attempt_id,p.lesson_id,p.level,p.response,p.revision,p.comprehension_choice,p.self_checks,p.first_choice,p.hints_used,p.oral_self_report])).rows
      }
      const clauses = [], values = []
      for (const key of ['user_id','attempt_id','lesson_id']) {
        const filter = url.searchParams.get(key)
        if (filter?.startsWith('eq.')) { values.push(filter.slice(3)); clauses.push(`${key}=$${values.length}`) }
      }
      return (await tx.query(`select * from context_practice_attempts ${clauses.length ? `where ${clauses.join(' and ')}` : ''} order by completed_at desc limit 10`, values)).rows
    })
    if (req.method === 'POST' && loseResponse > 0) { loseResponse--; send(503, { code: '08006', message: 'Simulated lost acknowledgement after commit' }); return }
    send(req.method === 'POST' ? 201 : 200, req.headers.accept?.includes('vnd.pgrst.object') ? rows[0] ?? null : rows)
  } catch (error) { send(error.code === '23505' ? 409 : 400, { code: error.code, message: error.message }) }
})
server.listen(3211, '127.0.0.1', () => console.log('Synthetic PostgreSQL fixture on http://127.0.0.1:3211'))
async function close() { server.close(); await db.close(); process.exit() }
process.on('SIGINT', close); process.on('SIGTERM', close)
