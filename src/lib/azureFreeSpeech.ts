import 'server-only'
import { createHash } from 'node:crypto'
import { z } from 'zod'
import { freeVoices } from './voices'

const resourcePattern =
  /^\/subscriptions\/([a-f0-9-]{36})\/resourceGroups\/[\w.-]+\/providers\/Microsoft\.CognitiveServices\/accounts\/[\w-]+$/i
const count = z.number().int().nonnegative().safe()
const usage = z.object({
  name: z.object({ value: z.string() }),
  status: z.literal('Included'),
  unit: z.literal('Count'),
  limit: z.literal(500000),
  currentValue: count,
  nextResetTime: z.string(),
  quotaPeriod: z.string().regex(/^(28|29|30|31)\.00:00:00$/),
})

export function freeSpeechConfig() {
  const id = process.env.AZURE_SPEECH_RESOURCE_ID?.trim()
  const token = process.env.AZURE_SPEECH_ARM_TOKEN?.trim()
  const key = process.env.AZURE_SPEECH_KEY?.trim()
  const region = process.env.AZURE_SPEECH_REGION?.trim().toLowerCase()
  if (
    process.env.AZURE_SPEECH_F0_ENABLED !== 'true' ||
    !id ||
    !resourcePattern.test(id) ||
    !token ||
    !key ||
    !region ||
    !/^[a-z0-9]+$/.test(region)
  )
    return null
  return { id, token, key, region }
}
type Config = NonNullable<ReturnType<typeof freeSpeechConfig>>

async function metadata(url: string, headers: Record<string, string>): Promise<unknown> {
  const response = await fetch(url, {
    headers,
    redirect: 'error',
    cache: 'no-store',
    signal: AbortSignal.timeout(3500),
  })
  if (!response.ok) throw Error('Verificação do recurso gratuito indisponível.')
  return response.json()
}

// Reserve at most 1,600 billable characters per request (800 UTF-16 units,
// doubled for CJK). Keep every reservation, including ambiguous failures.
// The shared counter deliberately overestimates use when Azure already reports it.
const SLOT = 1600
export async function reserveFreeSpeech(config: Config, voice: string, text: string) {
  if (!freeVoices.some((candidate) => candidate === voice) || !text.length || text.length * 2 > SLOT)
    throw Error('Voz ou tamanho fora da franquia.')
  const subscription = resourcePattern.exec(config.id)?.[1]
  if (!subscription) throw Error('Recurso inválido.')
  const arm = 'https://management.azure.com'
  const auth = { Authorization: 'Bearer ' + config.token }
  const [subscriptionInfo, resource, quotas] = await Promise.all([
    metadata(arm + '/subscriptions/' + subscription + '?api-version=2022-12-01', auth),
    metadata(arm + config.id + '?api-version=2024-10-01', auth),
    metadata(arm + config.id + '/usages?api-version=2024-10-01', auth),
  ])
  z.object({
    subscriptionId: z.string().refine((id) => id.toLowerCase() === subscription.toLowerCase()),
    state: z.literal('Enabled'),
    subscriptionPolicies: z.object({ spendingLimit: z.literal('On') }),
  }).parse(subscriptionInfo)
  const account = z
    .object({
      id: z.string().refine((id) => id.toLowerCase() === config.id.toLowerCase()),
      kind: z.literal('SpeechServices'),
      sku: z.object({ name: z.literal('F0') }),
      location: z.literal(config.region),
      properties: z.object({
        provisioningState: z.literal('Succeeded'),
        customSubDomainName: z.string().regex(/^[a-z0-9-]+$/),
        endpoint: z.url(),
      }),
    })
    .parse(resource)
  const origin = 'https://' + account.properties.customSubDomainName + '.cognitiveservices.azure.com'
  if (new URL(account.properties.endpoint).origin !== origin) throw Error('Endpoint divergente.')
  const rows = z.object({ value: z.array(z.unknown()) }).parse(quotas).value
  const matching = rows
    .map((row) => usage.safeParse(row))
    .filter((r) => r.success)
    .map((r) => r.data)
    .filter((row) =>
      /^(?:SpeechServices[.])?(?:NeuralTextToSpeechCharacters|TextToSpeech[.]NeuralCharacters|SynthesizedCharacters)$/i.test(
        row.name.value,
      ),
    )
  if (matching.length !== 1) throw Error('Franquia neural mensal sem comprovação.')
  const quota = matching[0]
  const end = Date.parse(quota.nextResetTime)
  const ttl = Math.ceil((end - Date.now()) / 1000)
  const slots = Math.floor((450000 - quota.currentValue) / SLOT)
  if (!Number.isSafeInteger(ttl) || ttl < 60 || ttl > 31 * 86400 || slots < 1)
    throw Error('Saldo gratuito insuficiente ou desconhecido.')
  const available = z
    .array(z.object({ ShortName: z.string(), Locale: z.string(), VoiceType: z.string(), Status: z.string() }))
    .parse(
      await metadata(origin + '/tts/cognitiveservices/voices/list', {
        'Ocp-Apim-Subscription-Key': config.key,
      }),
    )
  if (
    !available.some(
      (v) => v.ShortName === voice && v.Locale === 'en-US' && v.VoiceType === 'Neural' && v.Status === 'GA',
    )
  )
    throw Error('Voz neural padrão indisponível neste recurso.')
  const { consumeRateLimit } = await import('@/features/security/lib/security')
  const resourceKey = createHash('sha256').update(config.id.toLowerCase()).digest('hex')
  const clip = createHash('sha256')
    .update(JSON.stringify([resourceKey, voice, text]))
    .digest('hex')
  const claim = await consumeRateLimit('speech_f0_clip', clip, 1, 60)
  if (!claim.allowed || claim.source !== 'persistent') throw Error('Reserva duplicada ou indisponível.')
  const reservation = await consumeRateLimit('speech_f0_chars', resourceKey + ':' + end, slots, ttl + 60)
  if (reservation.source !== 'persistent' || !reservation.allowed || Date.now() + 30000 >= end)
    throw Error('Reserva gratuita indisponível.')
  return origin + '/tts/cognitiveservices/v1'
}
