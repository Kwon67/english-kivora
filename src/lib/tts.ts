import { randomUUID } from 'crypto'
import { readFile, unlink } from 'fs/promises'
import os from 'os'
import path from 'path'
import { z } from 'zod'

export const TTS_DEFAULT_VOICE = 'en-US-AriaNeural'

export const ALLOWED_TTS_VOICES = [
  'en-US-AriaNeural',
  'en-US-GuyNeural',
  'en-US-JennyNeural',
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

export async function synthesizeSpeechToBuffer(
  text: string,
  voice = TTS_DEFAULT_VOICE,
  tempPrefix = 'kivora-tts'
) {
  const { EdgeTTS } = await import('node-edge-tts')
  const tempFilePath = path.join(os.tmpdir(), `${tempPrefix}-${randomUUID()}.mp3`)

  try {
    const tts = new EdgeTTS({ voice })
    await tts.ttsPromise(text, tempFilePath)
    return await readFile(tempFilePath)
  } finally {
    await unlink(tempFilePath).catch(() => undefined)
  }
}
