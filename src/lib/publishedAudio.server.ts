import 'server-only'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { staticAudioUrl } from './staticAudio'
import type { AudioVoice } from './audioRoles'

/** Serve protected exercises without redirecting to a URL that identifies the answer. */
export async function readPublishedAudio(text: string, voice: AudioVoice) {
  const path = staticAudioUrl(text, voice)
  if (!path) return null
  try {
    let audio: Buffer
    if (process.env.VERCEL === '1' && process.env.VERCEL_URL) {
      const origin = new URL('https://' + process.env.VERCEL_URL)
      const r = await fetch(new URL(path, origin), { signal: AbortSignal.timeout(5000), redirect: 'error' })
      if (!r.ok || !r.headers.get('content-type')?.startsWith('audio/mpeg')) return null
      audio = Buffer.from(await r.arrayBuffer())
    } else {
      audio = await readFile(process.cwd() + '/public' + path)
    }
    return path.endsWith('/' + createHash('sha256').update(audio).digest('hex') + '.mp3') ? audio : null
  } catch {
    return null
  }
}
