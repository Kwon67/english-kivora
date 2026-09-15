import { after, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { protectJsonPost } from '@/lib/rateLimit'
import { processPersonalLearningJob, readPersonalLearningStatus, requestPersonalLearning } from '@/features/learning/lib/personalLearning'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 180

async function authenticatedUserId() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  return error ? null : user?.id || null
}

export async function GET() {
  const userId = await authenticatedUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  return NextResponse.json(await readPersonalLearningStatus(userId), { headers: { 'Cache-Control': 'private, no-store' } })
}

export async function POST(request: Request) {
  const protection = protectJsonPost(request, { keyPrefix: 'personal-learning', limit: 30, windowMs: 60_000 })
  if (protection) return protection
  // Compara com o host que o navegador realmente chamou, não com `request.url`: atrás de proxy (ou
  // em dev com `--hostname 0.0.0.0`) `request.url` traz o host de escuta, e o botão "Tentar
  // novamente" da página inicial batia em 403 para sempre.
  const origin = request.headers.get('origin')
  const expectedHost = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  if (origin && expectedHost && new URL(origin).host !== expectedHost) {
    return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 })
  }
  const userId = await authenticatedUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  // The member cannot choose another user, level, prompt or amount of paid work.
  const result = await requestPersonalLearning(userId)
  if (result.jobId && ['queued', 'generating', 'audio', 'failed', 'deferred'].includes(result.status.status)) {
    after(async () => { await processPersonalLearningJob(result.jobId!) })
  }
  return NextResponse.json(result.status, {
    status: result.status.status === 'unavailable' ? 503 : 200,
    headers: { 'Cache-Control': 'private, no-store' },
  })
}
