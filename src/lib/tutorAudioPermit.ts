import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'
function signature(user: string, scenario: string, text: string, expires: number) {
  const key = process.env.ELEVENLABS_API_KEY
  if (!key) return null
  return createHmac('sha256', key)
    .update(JSON.stringify(['kivora-tutor-audio-v1', user, scenario, text, expires]))
    .digest('hex')
}
export function issueTutorAudioPermit(user: string, scenario: string, text: string) {
  if (process.env.ELEVENLABS_TUTOR_ENABLED !== 'true' || text.length > 320) return undefined
  const expires = Math.floor(Date.now() / 1000) + 86400
  const mac = signature(user, scenario, text, expires)
  return mac ? expires + '.' + mac : undefined
}
export function validTutorAudioPermit(token: string | undefined, user: string, scenario: string, text: string) {
  if (!token || !/^\d{10}\.[a-f0-9]{64}$/.test(token)) return false
  const [time, value] = token.split('.')
  if (Number(time) <= Date.now() / 1000) return false
  const expected = signature(user, scenario, text, Number(time))
  return Boolean(expected && timingSafeEqual(Buffer.from(value, 'hex'), Buffer.from(expected, 'hex')))
}
