import { receiptTotals, matchesUsage } from './reconcile'
import { mkdirSync, readFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { parseEnv } from 'node:util'
import { resolve } from 'node:path'
import { ELEVENLABS_MODEL, ELEVENLABS_VOICES, WELCOME_TEXT, type AudioVoice } from '../../src/lib/audioRoles'
import { synthesizeElevenLabs } from '../../src/lib/elevenlabs'
import { atomic, writeIndexes } from './indexes'
import { openCoordinator } from './coordinator'
import held from '../../audio/reconciliation.json'
import { openLedger, clipKey } from './ledger'
import { mp3Duration } from './mp3'
import { batchBalance, creditCeiling } from './budget'

type Clip = { text: string; voice: AudioVoice; rank: number; key: string; state?: string }
type Entry = {
  language?: string
  schemaVersion?: number
  format?: string
  text: string
  voice: AudioVoice
  voiceId: string
  model: string
  path: string
  sha256: string
  durationSeconds?: number
}
const voices = Object.keys(ELEVENLABS_VOICES) as AudioVoice[]
const mode = process.argv[2]
if (!['--samples', '--restore', '--priority', '--catalog'].includes(mode) || process.env.VERCEL)
  throw Error('Escolha --samples, --restore, --priority ou --catalog no publicador local.')
const paid = mode === '--priority' || mode === '--catalog'
if (paid && !process.env.ELEVENLABS_API_KEY) {
  process.env.ELEVENLABS_API_KEY = parseEnv(readFileSync('.env.local', 'utf8')).ELEVENLABS_API_KEY || ''
}
const directory = resolve('output/elevenlabs')
mkdirSync(directory, { recursive: true })
const db = openLedger(directory + '/ledger.sqlite')
function publish(row: Clip, audio: Buffer) {
  const durationSeconds = mp3Duration(audio)
  const hash = createHash('sha256').update(audio).digest('hex')
  const path = '/audio/kivora/' + hash + '.mp3'
  db.exec('BEGIN IMMEDIATE')
  try {
    const manifest: Record<string, Entry> = JSON.parse(readFileSync('audio/manifest.json', 'utf8'))
    const prior = manifest[row.key]
    if (prior && prior.sha256 !== hash) throw Error('Gravação existente diverge do cache.')
    if (!existsSync('public' + path)) atomic('public' + path, audio)
    if (
      createHash('sha256')
        .update(readFileSync('public' + path))
        .digest('hex') !== hash
    )
      throw Error('Arquivo de áudio corrompido.')
    manifest[row.key] = {
      language: 'en-US',
      schemaVersion: 1,
      format: 'mp3_44100_128',
      text: row.text,
      voice: row.voice,
      voiceId: ELEVENLABS_VOICES[row.voice],
      model: ELEVENLABS_MODEL,
      path,
      sha256: hash,
      durationSeconds,
    }
    atomic('audio/manifest.json', JSON.stringify(manifest, null, 2) + '\n')
    writeIndexes(Object.values(manifest))
    const queue: Clip[] = JSON.parse(readFileSync('audio/queue.json', 'utf8'))
    for (const clip of queue) if (manifest[clip.key]) clip.state = 'published'
    atomic('audio/queue.json', JSON.stringify(queue, null, 2) + '\n')
  } finally {
    db.exec('COMMIT')
  }
}
async function metadata(path: string) {
  // Only read requests are retried. An interrupted synthesis retains its reservation.
  const waits = [5000, 20000, 60000]
  for (let attempt = 0; attempt <= waits.length; attempt++) {
    const r = await fetch('https://api.elevenlabs.io/v1/' + path, {
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY || '' },
      signal: AbortSignal.timeout(10000),
      redirect: 'error',
    })
    if (r.ok) return r.json()
    await r.body?.cancel()
    if (attempt === waits.length || ![429, 502, 503, 504].includes(r.status))
      throw Error('Consulta de cobrança indisponível: HTTP ' + r.status)
    const retry = r.headers.get('retry-after')
    const seconds = retry && /^\d+$/.test(retry) ? Number(retry) : 0
    const deadline = retry && !seconds ? Date.parse(retry) : NaN
    const delay = Math.max(
      waits[attempt],
      seconds * 1000,
      Number.isFinite(deadline) ? deadline - Date.now() : 0,
    )
    if (delay > 300_000) throw Error('Aguarde a janela de consulta de saldo antes de retomar.')
    console.log('Consulta de cobrança HTTP', r.status, 'nova leitura em', Math.ceil(delay / 1000), 's')
    await new Promise((resolve) => setTimeout(resolve, delay))
  }
  throw Error('Cobrança indisponível.')
}
async function readBalance() {
  const sub = await metadata('user/subscription')
  if (
    !Number.isSafeInteger(sub.character_limit) ||
    !Number.isSafeInteger(sub.character_count) ||
    sub.character_count < 0 ||
    sub.character_limit < sub.character_count
  )
    throw Error('Saldo inválido.')
  return sub.character_limit - sub.character_count
}
async function budget(approvedCeiling: number, minimumBalance?: number, openingBalance?: number) {
  const balance = await readBalance()
  const model = (await metadata('models')).find((m: { model_id: string }) => m.model_id === ELEVENLABS_MODEL)
  if (
    model?.token_cost_factor !== 1 ||
    model.model_rates?.character_cost_multiplier !== 1 ||
    model.model_rates?.cost_discount_multiplier !== 1 ||
    model.can_do_text_to_speech !== true
  )
    throw Error('Franquia ou fator do modelo não confirmado.')
  // Confirm the historical reference tariff of the three previously approved samples
  // separately from account-wide changes, which can include other API clients.
  const metrics = await metadata(
    'usage/character-stats?start_unix=1795112400000&end_unix=1795112520000&breakdown_type=voice&aggregation_bucket_size=60&metric=credits',
  )
  let samples = 0
  const voiceNames = new Map<AudioVoice, string>()
  for (const voice of voices) {
    const info = await metadata('voices/' + ELEVENLABS_VOICES[voice])
    const amounts = metrics.usage?.[info.name]
    if (
      info.voice_id !== ELEVENLABS_VOICES[voice] ||
      info.sharing?.rate !== 1 ||
      !Array.isArray(amounts) ||
      !amounts.every(Number.isSafeInteger)
    )
      throw Error('Cobrança da voz sem confirmação.')
    const charge = amounts.reduce((n: number, v: number) => n + v, 0)
    if (charge !== 39) throw Error('Cobrança histórica mudou. Revise o orçamento.')
    samples += charge
    voiceNames.set(voice, info.name)
  }
  const ceiling = creditCeiling(approvedCeiling, openingBalance ?? balance, minimumBalance)
  console.log({ balance, samples, ceiling })
  return { ceiling, voiceNames }
}
async function reconcileAccount(
  openingBalance: number,
  startedAt: number,
  spent: number,
  costs: Map<string, number>,
) {
  // No new paid requests until both independent provider counters match the journal.
  for (let attempt = 0; attempt < 8; attempt++) {
    if (attempt) await new Promise((resolve) => setTimeout(resolve, 15_000))
    const current = await readBalance()
    if (openingBalance - current !== spent) continue
    const params = new URLSearchParams({
      start_unix: String(startedAt),
      end_unix: String(Date.now()),
      breakdown_type: 'voice',
      aggregation_bucket_size: '60',
      metric: 'credits',
    })
    const stats = await metadata('usage/character-stats?' + params)
    if (matchesUsage(costs, stats.usage)) return current
  }
  throw Error('Saldo e consumo por voz ainda não conciliados. Nenhuma nova síntese enviada.')
}
async function main() {
  const rows: Clip[] = JSON.parse(readFileSync('audio/queue.json', 'utf8'))
  const shared = mode === '--samples' ? null : openCoordinator()
  const recoverable = mode === '--restore' ? shared?.recoverableKeys() : undefined
  const scope = paid ? shared?.approvedScope(mode) : undefined
  if (paid && !scope) throw Error('Autorização financeira ausente.')
  const billing = scope ? await budget(scope.ceiling, scope.minimumBalance, scope.openingBalance) : undefined
  const ceiling = billing?.ceiling ?? 0
  let availableBalance = batchBalance(readBalance)
  let confirmedDebit = 0
  let absoluteRemaining = ceiling
  const byKey = new Map(rows.map((row) => [row.key, row]))
  const batch = scope
    ? [...scope.keys].map((key) => {
        const row = byKey.get(key)
        if (!row) throw Error('Gravação autorizada ausente na fila.')
        return row
      })
    : rows
  for (const row of batch) {
    if (mode === '--priority' && row.rank > 3) continue
    if (!voices.includes(row.voice) || row.key !== clipKey(row.text, row.voice) || row.text.length > 800)
      throw Error('Entrada inválida.')
    const prior: Entry | undefined = JSON.parse(readFileSync('audio/manifest.json', 'utf8'))[row.key]
    if (prior && existsSync('public' + prior.path)) {
      const data = readFileSync('public' + prior.path)
      if (createHash('sha256').update(data).digest('hex') !== prior.sha256) throw Error('MP3 corrompido.')
      continue
    }
    if (row.text === WELCOME_TEXT) {
      publish(row, readFileSync('output/elevenlabs-amostras/' + row.voice + '-eleven-v4.mp3'))
      continue
    }
    if (!shared) continue
    const job = db.prepare('SELECT audio FROM jobs WHERE key=?').get(row.key)
    if (job?.audio instanceof Uint8Array) {
      publish(row, Buffer.from(job.audio))
      continue
    }
    if (job || held.some((item) => item.key === row.key)) continue
    if (prior) {
      const cached = shared.recover(row.key)
      if (!cached) throw Error('Restaure o MP3 publicado antes de continuar.')
      publish(row, cached)
      continue
    }
    if (!paid) {
      if (!recoverable?.has(row.key)) continue
      const cached = shared.recover(row.key)
      if (cached) publish(row, cached)
      continue
    }
    if (row.text.length > absoluteRemaining) continue
    // Only an exact reconciliation may add back debits already reflected in a live balance.
    const available =
      scope?.minimumBalance === undefined
        ? ceiling
        : creditCeiling(
            ceiling,
            confirmedDebit + (await availableBalance(row.text.length, scope.minimumBalance)),
            scope.minimumBalance,
          )
    let claim = shared.reserve(row.key, row.text.length, available)
    if (
      claim === 'limit' &&
      scope?.openingBalance !== undefined &&
      scope.minimumBalance !== undefined &&
      scope.startedAt &&
      billing
    ) {
      const ledger = shared.settlement()
      if (!ledger.active || ledger.reserved !== 0) throw Error('Campanha expirada ou reserva em aberto.')
      absoluteRemaining = ceiling - ledger.spent
      if (row.text.length > absoluteRemaining) continue
      const costs = receiptTotals(
        ledger.jobs,
        new Map(batch.map((clip) => [clip.key, billing.voiceNames.get(clip.voice)!])),
        ledger.spent,
      )
      const balance = await reconcileAccount(scope.openingBalance, scope.startedAt, ledger.spent, costs)
      confirmedDebit = ledger.spent
      availableBalance = batchBalance(readBalance)
      const fresh = await availableBalance(row.text.length, scope.minimumBalance)
      const reconciled = creditCeiling(ceiling, fresh + confirmedDebit, scope.minimumBalance)
      claim = shared.reserve(row.key, row.text.length, reconciled)
      console.log('Recibos conciliados:', confirmedDebit, 'saldo:', balance)
    }
    if (claim === 'limit') {
      console.log('Lote interrompido antes do envio: reserva indisponível.')
      break
    }
    if (claim === 'existing') {
      const cached = shared.recover(row.key)
      if (cached) publish(row, cached)
      continue
    }
    if (claim !== 'reserved') throw Error('Reserva não confirmada.')
    const result = await synthesizeElevenLabs(row, { offlineBatch: true })
    shared.finish(row.key, result.audio, result.credits, result.requestId)
    publish(row, result.audio)
    console.log(row.key.slice(0, 10), result.credits)
    if (result.credits === null || result.credits > row.text.length)
      throw Error('Confira a tarifa antes de continuar.')
  }
}
main()
  .catch((e) => {
    console.error(e.message)
    process.exitCode = 1
  })
  .finally(() => {
    db.exec('BEGIN IMMEDIATE')
    try {
      writeIndexes(Object.values(JSON.parse(readFileSync('audio/manifest.json', 'utf8'))))
    } finally {
      db.exec('COMMIT')
      db.close()
    }
  })
