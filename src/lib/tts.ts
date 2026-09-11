import 'server-only'

import { createHash, randomUUID } from 'crypto'
import { readFile, unlink } from 'fs/promises'
import os from 'os'
import path from 'path'
import { z } from 'zod'

import { TTS_DEFAULT_VOICE } from './voices'

export { TTS_DEFAULT_VOICE, VOICES } from './voices'

export const ALLOWED_TTS_VOICES = [
  'en-US-RogerNeural',
  'en-US-EmmaMultilingualNeural',
  'en-US-AvaMultilingualNeural',
  'en-US-AndrewMultilingualNeural',
  'en-US-BrianMultilingualNeural',
  'en-US-AriaNeural',
  'en-US-SteffanNeural',
] as const

export const TtsVoiceSchema = z.enum(ALLOWED_TTS_VOICES)

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
const pendingSynthesis = new Map<string, Promise<Buffer>>()
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
  const requested = process.env.TTS_PROVIDER?.trim() || 'auto'
  if (!['auto', 'azure', 'edge'].includes(requested)) {
    throw new TtsError('TTS_PROVIDER deve ser auto, azure ou edge.', 'configuration')
  }
  const key = process.env.AZURE_SPEECH_KEY?.trim()
  const region = process.env.AZURE_SPEECH_REGION?.trim().toLowerCase()
  if (requested !== 'edge' && (requested === 'azure' || key || region)) {
    if (!key || !region || !/^[a-z0-9]+$/.test(region)) {
      throw new TtsError('Configure AZURE_SPEECH_KEY e AZURE_SPEECH_REGION para usar o Microsoft Azure Speech.', 'configuration')
    }
    return { provider: 'azure' as const, key, region }
  }
  return { provider: 'edge' as const }
}

export function ttsContentKey(text: string, voice: string, provider: string) {
  return createHash('sha256')
    .update(JSON.stringify(['v1', provider, voice, TtsTextSchema.parse(text)]))
    .digest('hex')
}

export function speechSsml(text: string, voice: string) {
  const escaped = text.replace(/[<>&"']/g, (character) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;',
  })[character]!)
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US"><voice name="${TtsVoiceSchema.parse(voice)}">${escaped}</voice></speak>`
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

async function synthesizeAzureSpeech(text: string, voice: string, key: string, region: string) {
  try {
    const response = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
        'User-Agent': 'Kivora-English',
      },
      body: speechSsml(text, voice),
      signal: AbortSignal.timeout(SYNTHESIS_TIMEOUT_MS),
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

async function synthesizeEdgeSpeech(text: string, voice: string, tempPrefix: string) {
  const { EdgeTTS } = await import('node-edge-tts')
  const safePrefix = tempPrefix.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 40) || 'kivora-tts'
  const tempFilePath = path.join(os.tmpdir(), `${safePrefix}-${randomUUID()}.mp3`)
  const tts = new EdgeTTS({ voice, lang: 'en-US', timeout: SYNTHESIS_TIMEOUT_MS })
  const connect = tts._connectWebSocket.bind(tts)
  let socket: Awaited<ReturnType<typeof connect>> | undefined
  let stopped = false
  // node-edge-tts applies its timeout only after connecting, and does not close
  // the socket when it times out. Bound the entire operation and clean both up.
  tts._connectWebSocket = async () => {
    const connected = await connect()
    if (stopped) {
      connected.terminate()
      throw new TtsError('O serviço de voz excedeu o tempo de resposta.', 'timeout', true)
    }
    socket = connected
    return connected
  }
  let timer: ReturnType<typeof setTimeout> | undefined
  const synthesis = tts.ttsPromise(text, tempFilePath)

  try {
    await Promise.race([
      synthesis,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new TtsError('O serviço de voz excedeu o tempo de resposta.', 'timeout', true)), SYNTHESIS_TIMEOUT_MS)
      }),
    ])
    return validateAudio(await readFile(tempFilePath))
  } catch (error) {
    if (error instanceof TtsError) throw error
    throw new TtsError('Não foi possível gerar a voz Microsoft Edge.', 'provider', true)
  } finally {
    stopped = true
    if (timer) clearTimeout(timer)
    socket?.terminate()
    await unlink(tempFilePath).catch(() => undefined)
    // A late connection or provider completion must not leave a temp file.
    void synthesis.then(
      () => unlink(tempFilePath).catch(() => undefined),
      () => unlink(tempFilePath).catch(() => undefined),
    )
  }
}

function cacheAudio(key: string, buffer: Buffer) {
  for (const [entryKey, entry] of audioCache) {
    if (entry.expiresAt <= Date.now() || cachedBytes + buffer.length > MAX_CACHE_BYTES || audioCache.size >= 128) {
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
  voice = TTS_DEFAULT_VOICE,
  tempPrefix = 'kivora-tts',
) {
  const canonicalText = TtsTextSchema.parse(text)
  const canonicalVoice = TtsVoiceSchema.parse(voice)
  const config = getTtsProviderConfig()
  const contentKey = ttsContentKey(canonicalText, canonicalVoice, config.provider)
  const cached = audioCache.get(contentKey)
  if (cached && cached.expiresAt > Date.now()) return cached.buffer
  if (cached) {
    cachedBytes -= cached.buffer.length
    audioCache.delete(contentKey)
  }
  const existing = pendingSynthesis.get(contentKey)
  if (existing) return existing

  // Fail fast during a provider outage instead of opening unbounded sockets.
  if (pendingSynthesis.size >= 12) {
    throw new TtsError('O serviço de voz está ocupado. Tente novamente em instantes.', 'provider', true)
  }
  const pending = (config.provider === 'azure'
    ? synthesizeAzureSpeech(canonicalText, canonicalVoice, config.key, config.region)
    : synthesizeEdgeSpeech(canonicalText, canonicalVoice, tempPrefix)
  ).then((buffer) => {
    cacheAudio(contentKey, buffer)
    return buffer
  })
  pendingSynthesis.set(contentKey, pending)
  try {
    return await pending
  } finally {
    pendingSynthesis.delete(contentKey)
  }
}
