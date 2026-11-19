import 'server-only'

import { createHash } from 'crypto'
import { z } from 'zod'

import { readPublishedAudio } from './publishedAudio.server'
import { TTS_DEFAULT_VOICE, playbackRole, fallbackVoice, freeVoices } from './voices'

import { freeSpeechConfig, reserveFreeSpeech } from './azureFreeSpeech'
import { staticAudioUrl } from './staticAudio'

export { TTS_DEFAULT_VOICE, VOICES } from './voices'

export const ALLOWED_TTS_VOICES = [
  'en-US-JennyNeural',
  'en-US-RogerNeural',
  'en-US-EmmaMultilingualNeural',
  'en-US-AvaMultilingualNeural',
  'en-US-AndrewMultilingualNeural',
  'en-US-BrianMultilingualNeural',
  'en-US-AriaNeural',
  'en-US-SteffanNeural',
] as const

export const TtsVoiceSchema = z.enum([...ALLOWED_TTS_VOICES, 'siren', 'lauren', 'jarnathan'])

export const TtsTextSchema = z
  .string()
  .trim()
  .min(1, 'Texto é obrigatório')
  .max(800, 'Texto muito longo para gerar áudio')

export const TtsPreviewTextSchema = z
  .string()
  .trim()
  .min(1, 'Texto é obrigatório')
  .max(320, 'Texto muito longo para prévia')

export function parseTtsVoice(input: unknown) {
  const parsed = TtsVoiceSchema.safeParse(input)
  return parsed.success ? parsed.data : TTS_DEFAULT_VOICE
}

const SYNTHESIS_TIMEOUT_MS = 20_000
const MAX_AUDIO_BYTES = 2 * 1024 * 1024
const MAX_CACHE_BYTES = 16 * 1024 * 1024
const CACHE_TTL_MS = 60 * 60 * 1000
const audioCache = new Map<string, { buffer: Buffer; expiresAt: number }>()
type Pending = { audio: Promise<Buffer>; controller: AbortController; listeners: number }
const pendingSynthesis = new Map<string, Pending>()

async function listen(task: Pending, signal?: AbortSignal) {
  task.listeners++
  const aborted = Promise.withResolvers<never>()
  const stop = () => aborted.reject(signal?.reason)
  signal?.addEventListener('abort', stop, { once: true })
  try {
    signal?.throwIfAborted()
    return await Promise.race([task.audio, aborted.promise])
  } finally {
    signal?.removeEventListener('abort', stop)
    if (--task.listeners === 0) task.controller.abort()
  }
}
let cachedBytes = 0

export class TtsError extends Error {
  constructor(
    message: string,
    public readonly code: 'configuration' | 'timeout' | 'provider' | 'storage' | 'card_changed',
    public readonly retryable = false,
  ) {
    super(message)
    this.name = 'TtsError'
  }
}

/** Server secrets are deliberately never included in errors or content keys. */
export function getTtsProviderConfig() {
  const config = freeSpeechConfig()
  return config ? { provider: 'azure-f0' as const, ...config } : { provider: 'recordings' as const }
}

export function ttsContentKey(text: string, voice: string, provider: string) {
  return createHash('sha256')
    .update(JSON.stringify(['v1', provider, voice, TtsTextSchema.parse(text)]))
    .digest('hex')
}

export function speechSsml(text: string, voice: string) {
  const escaped = text.replace(
    /[<>&"']/g,
    (character) =>
      ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&apos;',
      })[character]!,
  )
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US"><voice name="${z.enum(freeVoices).parse(voice)}">${escaped}</voice></speak>`
}

function validateAudio(buffer: Buffer) {
  // Never publish an empty stream or an upstream HTML/JSON error as an MP3.
  const id3 = buffer.subarray(0, 3).toString() === 'ID3'
  const frame = buffer.length >= 2 && buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0
  if (buffer.length < 100 || buffer.length > MAX_AUDIO_BYTES || (!id3 && !frame)) {
    throw new TtsError('O serviço de voz retornou um áudio inválido.', 'provider', true)
  }
  return buffer
}

async function synthesizeAzureSpeech(
  text: string,
  voice: string,
  config: NonNullable<ReturnType<typeof freeSpeechConfig>>,
  signal: AbortSignal,
) {
  const endpoint = await reserveFreeSpeech(config, voice, text).catch(() => {
    throw new TtsError('Franquia gratuita de voz indisponível.', 'configuration')
  })
  signal.throwIfAborted()
  try {
    const response = await fetch(endpoint, {
      redirect: 'error',
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': config.key,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
        'User-Agent': 'Kivora-English',
      },
      body: speechSsml(text, voice),
      signal: AbortSignal.any([signal, AbortSignal.timeout(SYNTHESIS_TIMEOUT_MS)]),
      cache: 'no-store',
    })
    if (!response.ok) {
      await response.body?.cancel().catch(() => undefined)
      throw new TtsError(
        `Microsoft Azure Speech indisponível (HTTP ${response.status}).`,
        'provider',
        response.status === 429 || response.status >= 500,
      )
    }
    if (Number(response.headers.get('content-length') || '0') > MAX_AUDIO_BYTES) {
      await response.body?.cancel().catch(() => undefined)
      throw new TtsError('O serviço de voz retornou um áudio muito grande.', 'provider')
    }
    return validateAudio(Buffer.from(await response.arrayBuffer()))
  } catch (error) {
    if (error instanceof TtsError) throw error
    if (error instanceof Error && ['AbortError', 'TimeoutError'].includes(error.name)) {
      throw new TtsError('O serviço de voz excedeu o tempo de resposta.', 'timeout', true)
    }
    throw new TtsError('Não foi possível conectar ao Microsoft Azure Speech.', 'provider', true)
  }
}

function cacheAudio(key: string, buffer: Buffer) {
  for (const [entryKey, entry] of audioCache) {
    if (
      entry.expiresAt <= Date.now() ||
      cachedBytes + buffer.length > MAX_CACHE_BYTES ||
      audioCache.size >= 128
    ) {
      cachedBytes -= entry.buffer.length
      audioCache.delete(entryKey)
    }
  }
  audioCache.set(key, { buffer, expiresAt: Date.now() + CACHE_TTL_MS })
  cachedBytes += buffer.length
}

/** Coalesces repeated previews within a process. Durable card audio lives in Storage. */
export async function synthesizeSpeechToBuffer(
  text: string,
  voice: string = TTS_DEFAULT_VOICE,
  signal?: AbortSignal,
) {
  signal?.throwIfAborted()
  const canonicalText = TtsTextSchema.parse(text)
  const requested = TtsVoiceSchema.parse(voice)
  const role = playbackRole(requested)
  if (staticAudioUrl(canonicalText, role)) {
    const recording = await readPublishedAudio(canonicalText, role)
    if (recording) return recording
    throw new TtsError('Gravação temporariamente indisponível.', 'storage', true)
  }
  const canonicalVoice = fallbackVoice[role]
  const config = getTtsProviderConfig()
  if (config.provider === 'recordings')
    throw new TtsError('Áudio ainda indisponível para esta frase.', 'configuration')
  const contentKey = ttsContentKey(canonicalText, canonicalVoice, config.provider)
  const cached = audioCache.get(contentKey)
  if (cached && cached.expiresAt > Date.now()) return cached.buffer
  if (cached) {
    cachedBytes -= cached.buffer.length
    audioCache.delete(contentKey)
  }
  const existing = pendingSynthesis.get(contentKey)
  if (existing) return listen(existing, signal)

  // Fail fast during a provider outage instead of opening unbounded sockets.
  if (pendingSynthesis.size >= 12) {
    throw new TtsError('O serviço de voz está ocupado. Tente novamente em instantes.', 'provider', true)
  }
  const controller = new AbortController()
  const audio = synthesizeAzureSpeech(canonicalText, canonicalVoice, config, controller.signal)
    .then((buffer) => {
      cacheAudio(contentKey, buffer)
      return buffer
    })
    .finally(() => pendingSynthesis.delete(contentKey))
  const task = { audio, controller, listeners: 0 }
  pendingSynthesis.set(contentKey, task)
  return listen(task, signal)
}
