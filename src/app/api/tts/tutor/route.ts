import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { protectJsonPost } from '@/lib/rateLimit'
import { validTutorAudioPermit } from '@/lib/tutorAudioPermit'
import { tutorVoice } from '@/lib/audioRoles'
import { getSecurityBlock, consumeRateLimit } from '@/features/security/lib/security'
import { tutorPremiumAudio } from '@/lib/tutorSpeech'
import { staticAudioUrl } from '@/lib/staticAudio'
import { getTtsProviderConfig, synthesizeSpeechToBuffer, TtsTextSchema } from '@/lib/tts'
import { getTutorScenario } from '@/features/tutor/lib/scenarios'

export const runtime = 'nodejs'
export const maxDuration = 60
const input = z.object({
  scenario: z.string().max(80),
  text: TtsTextSchema,
  audioPermit: z.string().max(100).optional(),
})
export async function POST(req: Request) {
  const rejected = protectJsonPost(req, { keyPrefix: 'tutor-voice', limit: 30, windowMs: 60000 })
  if (rejected) return rejected
  const client = await createClient()
  const {
    data: { user },
  } = await client.auth.getUser()
  if (!user) return new Response(null, { status: 401 })
  const body = input.safeParse(await req.json().catch(() => null))
  if (!body.success || !getTutorScenario(body.data.scenario)) return new Response(null, { status: 400 })
  const { text, scenario } = body.data
  const voice = tutorVoice(scenario)
  const url = staticAudioUrl(text, voice)
  if (url) return new Response(null, { status: 303, headers: { Location: url, 'Cache-Control': 'no-store' } })
  async function freeReply() {
    if (req.signal.aborted || getTtsProviderConfig().provider !== 'azure-f0') throw Error('Voz indisponível.')
    const limit = await consumeRateLimit('tutor_free_voice', user!.id, 20, 86400)
    if (!limit.allowed || limit.source !== 'persistent' || req.signal.aborted) throw Error('Limite de voz.')
    return synthesizeSpeechToBuffer(text, voice, req.signal)
  }
  try {
    if (process.env.ELEVENLABS_TUTOR_ENABLED === 'true' && (await getSecurityBlock('user', user.id)).blocked)
      return new Response(null, { status: 403 })
    if (
      process.env.ELEVENLABS_TUTOR_ENABLED === 'true' &&
      text !== getTutorScenario(scenario)?.initialMessage &&
      !validTutorAudioPermit(body.data.audioPermit, user.id, scenario, text)
    ) {
      // Restored drafts can predate audio permits. Preserve playback without a paid request.
      return new Response(
        new Uint8Array(await freeReply()),
        {
          headers: {
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'private, no-store',
            'X-Content-Type-Options': 'nosniff',
          },
        },
      )
    }
    const abort = new AbortController()
    const signal = AbortSignal.any([abort.signal, req.signal])
    const ready = Promise.withResolvers<boolean>()
    let sent = false
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        void tutorPremiumAudio(user.id, text, voice, signal, scenario, (chunk) => {
          if (signal.aborted) return
          controller.enqueue(chunk)
          sent = true
          ready.resolve(true)
        })
          .then((buffer) => {
            if (signal.aborted) {
              ready.resolve(false)
              return
            }
            if (buffer && !sent) controller.enqueue(new Uint8Array(buffer))
            if (!buffer && sent) controller.error(Error('Áudio interrompido.'))
            else controller.close()
            ready.resolve(Boolean(buffer))
          })
          .catch((error) => {
            controller.error(error)
            ready.resolve(false)
          })
      },
      cancel() {
        abort.abort()
      },
    })
    const premium = await ready.promise
    if (signal.aborted) return new Response(null, { status: 408 })
    const payload = premium
      ? stream
      : new Uint8Array(await freeReply())
    return new Response(payload, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return new Response(null, { status: 503 })
  }
}
