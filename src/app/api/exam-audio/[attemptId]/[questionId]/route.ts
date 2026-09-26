import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { KeyedExamQuestion } from '@/features/curriculum/lib/levelExam'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { rateLimitRequest } from '@/lib/rateLimit'
import { parseTtsVoice, synthesizeSpeechToBuffer, TtsError } from '@/lib/tts'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

/**
 * Áudio das questões de escuta da prova final.
 *
 * Existe separado de /api/tts/preview porque lá o texto vai na URL — e numa questão de escuta o
 * texto É a resposta. Aqui o navegador só conhece o id da tentativa e da questão; a frase é lida
 * do banco no servidor, e só enquanto a prova está aberta e pertence a quem pede.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ attemptId: string; questionId: string }> }
) {
  const { attemptId, questionId } = await params
  if (!z.string().uuid().safeParse(attemptId).success || !/^q\d{1,3}$/.test(questionId)) {
    return new NextResponse('Não encontrado', { status: 404 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Não autenticado', { status: 401 })

  const limited = rateLimitRequest(req, { keyPrefix: `api:exam-audio:${user.id}`, limit: 60, windowMs: 60_000 })
  if (limited) return limited

  const admin = createAdminClient()
  if (!admin) return new NextResponse('Indisponível', { status: 503 })

  const { data: attempt } = await admin
    .from('level_exam_attempts')
    .select('questions,submitted_at')
    .eq('id', attemptId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!attempt || attempt.submitted_at) return new NextResponse('Não encontrado', { status: 404 })

  const question = (attempt.questions as unknown as KeyedExamQuestion[]).find(
    (candidate) => candidate.id === questionId && candidate.kind === 'listening'
  )
  if (!question?.audioText) return new NextResponse('Não encontrado', { status: 404 })

  try {
    const audio = await synthesizeSpeechToBuffer(question.audioText, parseTtsVoice(null), 'kivora-exam-audio')
    return new NextResponse(new Uint8Array(audio), {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'private, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (err) {
    console.error('Exam audio error:', err instanceof TtsError ? err.code : 'unexpected')
    return new NextResponse('Não foi possível preparar o áudio.', { status: err instanceof TtsError ? 503 : 500 })
  }
}
