import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { z } from 'zod'

const config = z.object({
  service: z.string().regex(/^[a-z0-9_-]+$/),
  cluster: z.string().regex(/^\d+$/),
  campaign: z.string().uuid(),
  authorization: z
    .object({
      mode: z.enum(['--priority', '--catalog']),
      ceiling: z.number().int().min(1).max(20000),
      minimumBalance: z.number().int().nonnegative().optional(),
      openingBalance: z.number().int().nonnegative().optional(),
      startedAt: z.number().int().positive().optional(),
      keys: z.array(z.string().regex(/^[a-f0-9]{64}$/)).min(1),
    })
    .optional(),
})
// Read the provisioned campaign. A new checkout cannot mint an allowance by
// starting a local ledger. Each client must reach the same PostgreSQL primary.
export function openCoordinator() {
  const settings = config.parse(JSON.parse(readFileSync('output/elevenlabs/campaign.json', 'utf8')))
  function sql(statement: string) {
    return execFileSync(
      'psql',
      ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '-d', 'service=' + settings.service],
      {
        input: statement,
        encoding: 'utf8',
        maxBuffer: 6 * 1024 * 1024,
        timeout: 15000,
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    ).trim()
  }
  if (sql('SELECT system_identifier FROM pg_control_system()') !== settings.cluster)
    throw Error('Coordenador de orçamento divergente.')
  const campaign = settings.campaign
  const authorization = settings.authorization
  const keys = new Set(authorization?.keys)
  function validKey(key: string) {
    if (!/^[a-f0-9]{64}$/.test(key)) throw Error('Chave de áudio inválida.')
  }
  return {
    approvedScope(mode: string) {
      if (
        !authorization ||
        authorization.mode !== mode ||
        keys.size !== authorization.keys.length ||
        Number(sql(`SELECT ceiling FROM audio_campaign WHERE id='${campaign}' AND expires_at > now()`)) !==
          authorization.ceiling
      )
        throw Error('Lista ou teto da campanha sem confirmação.')
      return { ...authorization, keys }
    },
    settlement() {
      // Campaign counters and individual receipts must come from the same database snapshot.
      const value = sql(`SELECT json_build_object('spent',c.spent,'reserved',c.reserved,
        'active',c.expires_at > now(), 'jobs', COALESCE((SELECT json_agg(json_build_object(
        'key',j.key,'credits',j.credits,'receipt',j.receipt)) FROM audio_job j
        WHERE j.campaign=c.id),'[]'::json)) FROM audio_campaign c WHERE id='${campaign}'`)
      return z
        .object({
          spent: z.number().int().nonnegative(),
          reserved: z.number().int().nonnegative(),
          active: z.boolean(),
          jobs: z.array(
            z.object({
              key: z.string(),
              credits: z.number().int().nonnegative().nullable(),
              receipt: z.string().nullable(),
            }),
          ),
        })
        .parse(JSON.parse(value))
    },
    recoverableKeys() {
      return new Set(sql('SELECT key FROM audio_job WHERE audio IS NOT NULL').split('\n').filter(Boolean))
    },
    uncertainKeys() {
      return sql('SELECT key FROM audio_job WHERE audio IS NULL AND reservation > 0')
        .split('\n')
        .filter(Boolean)
    },
    reserve(key: string, cost: number, ceiling: number) {
      validKey(key)
      if (!authorization || !keys.has(key) || ceiling > authorization.ceiling)
        throw Error('Fora da autorização.')
      if (![cost, ceiling].every(Number.isSafeInteger)) throw Error('Reserva inválida.')
      return sql(`SELECT reserve_audio('${campaign}','${key}',${cost},${ceiling})`)
    },
    recover(key: string) {
      validKey(key)
      const data = sql(`SELECT encode(audio,'hex') FROM audio_job WHERE key='${key}'`)
      return data ? Buffer.from(data, 'hex') : null
    },
    finish(key: string, audio: Buffer, credits: number | null, receipt: string | null) {
      validKey(key)
      if (credits !== null && (!Number.isSafeInteger(credits) || credits < 0))
        throw Error('Cobrança inválida.')
      const requestId = Buffer.from(receipt || '').toString('hex')
      sql(
        `SELECT finish_audio('${campaign}','${key}',${credits ?? 'NULL'},decode('${audio.toString('hex')}','hex'),convert_from(decode('${requestId}','hex'),'UTF8'))`,
      )
    },
  }
}
