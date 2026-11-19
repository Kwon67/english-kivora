import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { rateLimitRequest } from '@/lib/rateLimit'
import { parseTtsVoice, synthesizeSpeechToBuffer } from '@/lib/tts'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!z.string().uuid().safeParse(id).success) return new Response(null, { status: 404 })
  const client = await createClient()
  const {
    data: { user },
  } = await client.auth.getUser()
  if (!user) return new Response(null, { status: 401 })
  const limited = rateLimitRequest(req, { keyPrefix: 'card-audio:' + user.id, limit: 60, windowMs: 60000 })
  if (limited) return limited
  const { data, error } = await client.from('cards').select('english_phrase,pack_id').eq('id', id).maybeSingle()
  if (error || !data) return new Response(null, { status: 404 })
  const { data: pack } = await client
    .from('packs')
    .select('owner_id,is_public')
    .eq('id', data.pack_id)
    .maybeSingle()
  if (!pack || (!pack.is_public && pack.owner_id !== user.id)) return new Response(null, { status: 404 })
  try {
    const audio = await synthesizeSpeechToBuffer(
      data.english_phrase,
      parseTtsVoice(new URL(req.url).searchParams.get('voice')),
      req.signal,
    )
    return new Response(new Uint8Array(audio), {
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
