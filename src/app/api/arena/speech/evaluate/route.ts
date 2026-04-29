import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { scoreSpeechTranscript, type SpeechScoreDetails } from '@/lib/arena/speech-scoring'
import type { Json } from '@/types/database.types'

export const runtime = 'nodejs'
export const maxDuration = 60 // Allow maximum execution time on Vercel Hobby

type ArenaSpeechAttemptRow = {
  transcript: string
  score: number
  accepted: boolean
  duration_ms: number
  details: Json
}

type ArenaDuelScoreRow = {
  player1_id: string | null
  player2_id: string | null
  player1_score: number
  player1_wrong: number
  player2_score: number
  player2_wrong: number
}

type EvaluationDetails = SpeechScoreDetails & {
  durationMs: number
}

const ALLOWED_AUDIO_MIME_TYPES = ['audio/webm', 'audio/ogg', 'audio/mp4'] as const
const DEFAULT_MAX_AUDIO_SIZE_MB = 8

function jsonError(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status })
}

function getStringField(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

function getMaxAudioSizeBytes() {
  const parsed = Number.parseInt(process.env.MAX_AUDIO_SIZE_MB || '', 10)
  const sizeMb = Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_AUDIO_SIZE_MB
  return sizeMb * 1024 * 1024
}

function isAllowedAudioType(type: string) {
  const normalizedType = type.toLowerCase()
  return ALLOWED_AUDIO_MIME_TYPES.some(
    (allowedType) => normalizedType === allowedType || normalizedType.startsWith(`${allowedType};`)
  )
}

function parseDurationMs(value: string) {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed)) return 0
  return Math.max(0, Math.trunc(parsed))
}

function getPlayerTotals(duel: ArenaDuelScoreRow, userId: string) {
  if (duel.player1_id === userId) {
    return { playerScore: duel.player1_score, playerWrong: duel.player1_wrong }
  }

  return { playerScore: duel.player2_score, playerWrong: duel.player2_wrong }
}

function getDetailsFromAttempt(attempt: ArenaSpeechAttemptRow): EvaluationDetails {
  const storedDetails = typeof attempt.details === 'object' && attempt.details !== null && !Array.isArray(attempt.details)
    ? attempt.details
    : {}

  const similarity = typeof storedDetails.similarity === 'number' ? storedDetails.similarity : attempt.score / 100
  const missingWords = Array.isArray(storedDetails.missingWords)
    ? storedDetails.missingWords.filter((word): word is string => typeof word === 'string')
    : []
  const extraWords = Array.isArray(storedDetails.extraWords)
    ? storedDetails.extraWords.filter((word): word is string => typeof word === 'string')
    : []
  const durationMs = typeof storedDetails.durationMs === 'number' ? storedDetails.durationMs : attempt.duration_ms

  return { similarity, missingWords, extraWords, durationMs }
}

async function transcribeAudio(audio: File) {
  const apiKey = process.env.GROQ_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('Chave da API Groq não configurada.')
  }

  const controller = new AbortController()
  const timeout = windowlessSetTimeout(() => controller.abort(), 15_000)

  try {
    const workerFormData = new FormData()
    workerFormData.append('file', audio, audio.name || 'arena-audio.webm')
    workerFormData.append('model', 'whisper-large-v3')
    workerFormData.append('language', 'en')

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: workerFormData,
      signal: controller.signal,
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok) {
      throw new Error(payload?.error?.message || 'Serviço de transcrição indisponível.')
    }

    if (!payload || typeof payload.text !== 'string') {
      throw new Error('Resposta inválida do serviço de transcrição.')
    }

    return {
      transcript: payload.text.trim(),
      language: 'en',
      languageProbability: null,
    }
  } finally {
    clearTimeout(timeout)
  }
}

function windowlessSetTimeout(callback: () => void, delayMs: number) {
  return setTimeout(callback, delayMs)
}

async function readCurrentDuelScores(duelId: string) {
  const adminSupabase = createAdminClient()
  if (!adminSupabase) return null

  const { data } = await adminSupabase
    .from('arena_duels')
    .select('player1_id,player2_id,player1_score,player1_wrong,player2_score,player2_wrong')
    .eq('id', duelId)
    .single()

  return data
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const adminSupabase = createAdminClient()

  if (!adminSupabase) {
    return jsonError('SUPABASE_SERVICE_ROLE_KEY ausente para registrar tentativas de fala.', 500)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return jsonError('Não autenticado.', 401)
  }

  const formData = await request.formData().catch(() => null)
  if (!formData) {
    return jsonError('Envie multipart/form-data com áudio e identificadores do duelo.', 400)
  }

  const audio = formData.get('audio')
  const duelId = getStringField(formData, 'duelId')
  const cardId = getStringField(formData, 'cardId')
  const durationMs = parseDurationMs(getStringField(formData, 'durationMs'))

  if (!(audio instanceof File)) {
    return jsonError('Arquivo de áudio obrigatório.', 400)
  }

  if (!duelId || !cardId) {
    return jsonError('duelId e cardId são obrigatórios.', 400)
  }

  if (audio.size <= 0) {
    return jsonError('O áudio gravado está vazio.', 400)
  }

  if (audio.size > getMaxAudioSizeBytes()) {
    return jsonError('O áudio excede o tamanho máximo permitido.', 413)
  }

  if (!isAllowedAudioType(audio.type)) {
    return jsonError('Formato de áudio não permitido.', 415)
  }

  const { data: duel, error: duelError } = await supabase
    .from('arena_duels')
    .select('id,status,game_type,pack_id,player1_id,player2_id,player1_score,player1_wrong,player2_score,player2_wrong')
    .eq('id', duelId)
    .single()

  if (duelError || !duel) {
    return jsonError('Duelo não encontrado.', 404)
  }

  if (duel.player1_id !== user.id && duel.player2_id !== user.id) {
    return jsonError('Você não participa deste duelo.', 403)
  }

  if (duel.status !== 'active') {
    return jsonError('Este duelo não está ativo.', 409)
  }

  if (duel.game_type !== 'speaking') {
    return jsonError('Este endpoint é exclusivo para duelos de fala.', 400)
  }

  if (!duel.pack_id) {
    return jsonError('Duelo sem pack associado.', 400)
  }

  const { data: card, error: cardError } = await supabase
    .from('cards')
    .select('id,english_phrase,pack_id')
    .eq('id', cardId)
    .eq('pack_id', duel.pack_id)
    .single()

  if (cardError || !card) {
    return jsonError('Frase do desafio não encontrada para este duelo.', 404)
  }

  const { data: existingAttempt } = await adminSupabase
    .from('arena_speech_attempts')
    .select('transcript,score,accepted,duration_ms,details')
    .eq('duel_id', duelId)
    .eq('player_id', user.id)
    .eq('card_id', cardId)
    .maybeSingle()

  if (existingAttempt) {
    const currentDuel = await readCurrentDuelScores(duelId)
    const totals = currentDuel ? getPlayerTotals(currentDuel, user.id) : getPlayerTotals(duel, user.id)

    return NextResponse.json({
      ok: true,
      duplicate: true,
      transcript: existingAttempt.transcript,
      expected: card.english_phrase,
      score: existingAttempt.score,
      accepted: existingAttempt.accepted,
      details: getDetailsFromAttempt(existingAttempt),
      ...totals,
    })
  }

  let transcription: Awaited<ReturnType<typeof transcribeAudio>>
  try {
    transcription = await transcribeAudio(audio)
  } catch (error) {
    const message = error instanceof Error && error.name === 'AbortError'
      ? 'O serviço de transcrição demorou demais para responder.'
      : 'Serviço de transcrição indisponível. Tente novamente.'
    console.error('[arena speech] transcription failed:', error)
    return jsonError(message, error instanceof Error && error.name === 'AbortError' ? 504 : 503)
  }

  const scoring = scoreSpeechTranscript(card.english_phrase, transcription.transcript)
  const details: EvaluationDetails = {
    similarity: scoring.similarity,
    missingWords: scoring.missingWords,
    extraWords: scoring.extraWords,
    durationMs,
  }

  const { error: insertError } = await adminSupabase.from('arena_speech_attempts').insert({
    duel_id: duelId,
    player_id: user.id,
    card_id: cardId,
    transcript: transcription.transcript,
    score: scoring.score,
    accepted: scoring.accepted,
    duration_ms: durationMs,
    details: {
      ...details,
      language: transcription.language,
      languageProbability: transcription.languageProbability,
    },
  })

  if (insertError) {
    if (insertError.code === '23505') {
      const { data: duplicateAttempt } = await adminSupabase
        .from('arena_speech_attempts')
        .select('transcript,score,accepted,duration_ms,details')
        .eq('duel_id', duelId)
        .eq('player_id', user.id)
        .eq('card_id', cardId)
        .maybeSingle()

      if (duplicateAttempt) {
        const currentDuel = await readCurrentDuelScores(duelId)
        const totals = currentDuel ? getPlayerTotals(currentDuel, user.id) : getPlayerTotals(duel, user.id)

        return NextResponse.json({
          ok: true,
          duplicate: true,
          transcript: duplicateAttempt.transcript,
          expected: card.english_phrase,
          score: duplicateAttempt.score,
          accepted: duplicateAttempt.accepted,
          details: getDetailsFromAttempt(duplicateAttempt),
          ...totals,
        })
      }
    }

    console.error('[arena speech] failed to save attempt:', insertError)
    return jsonError('Não consegui registrar o resultado da fala.', 500)
  }

  const updatedDuel = await readCurrentDuelScores(duelId)
  const totals = updatedDuel ? getPlayerTotals(updatedDuel, user.id) : getPlayerTotals(duel, user.id)

  return NextResponse.json({
    ok: true,
    duplicate: false,
    transcript: transcription.transcript,
    expected: card.english_phrase,
    score: scoring.score,
    accepted: scoring.accepted,
    details,
    ...totals,
  })
}
