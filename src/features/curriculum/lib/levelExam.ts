import { matchEnglishAnswer } from '@/features/game/lib/englishAnswerMatching'
import { EXAM_QUESTION_COUNT, isExamPassing } from './curriculum'

/**
 * Prova final de nível: monta e corrige. Puro — quem sorteia os cards e grava é a server action.
 *
 * Quatro formatos, porque um nível CEFR é compreensão E produção, lendo E ouvindo:
 * - `en_pt`: lê o inglês, escolhe o sentido em português (compreensão escrita);
 * - `pt_en`: lê o português, escolhe a frase em inglês (reconhecimento da forma certa);
 * - `listening`: ouve a frase, escolhe o que ouviu (compreensão oral);
 * - `typing`: lê o português, ESCREVE o inglês (produção — a parte que múltipla escolha não mede).
 *
 * Os cards vêm em rodízio por pack, então a prova cobre o nível inteiro em vez de sortear 30
 * frases do mesmo pack grande.
 */

export type ExamCard = {
  id: string
  packId: string
  en: string
  pt: string
}

export type ExamQuestionKind = 'en_pt' | 'pt_en' | 'listening' | 'typing'

/** O que o navegador recebe. Sem gabarito. */
export type PublicExamQuestion = {
  id: string
  kind: ExamQuestionKind
  prompt: string
  options?: string[]
}

/** O que fica no banco. */
export type KeyedExamQuestion = PublicExamQuestion & {
  /**
   * Só em `listening`: a frase falada. NUNCA vai ao navegador — em escuta ela é a própria resposta.
   * O áudio sai de /api/exam-audio/[tentativa]/[questão], que lê esta frase no servidor.
   */
  audioText?: string
  answer: string
  cardId: string
  packId: string
}

/** Proporção de cada formato numa prova de 30: 12 + 8 + 5 + 5. */
const KIND_PLAN: { kind: ExamQuestionKind; share: number }[] = [
  { kind: 'en_pt', share: 12 / 30 },
  { kind: 'pt_en', share: 8 / 30 },
  { kind: 'listening', share: 5 / 30 },
  { kind: 'typing', share: 5 / 30 },
]

const OPTIONS_PER_QUESTION = 4

function shuffle<T>(items: T[], rng: () => number): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function normalizeOption(value: string) {
  return value.trim().toLowerCase().replace(/[.!?,;:]+$/g, '')
}

/** Cards em rodízio por pack: um de cada pack antes de repetir qualquer pack. */
function pickCardsAcrossPacks(cards: ExamCard[], count: number, rng: () => number): ExamCard[] {
  const byPack = new Map<string, ExamCard[]>()
  for (const card of shuffle(cards, rng)) {
    const bucket = byPack.get(card.packId)
    if (bucket) bucket.push(card)
    else byPack.set(card.packId, [card])
  }

  const packOrder = shuffle([...byPack.keys()], rng)
  const picked: ExamCard[] = []
  while (picked.length < count) {
    let progressed = false
    for (const packId of packOrder) {
      const card = byPack.get(packId)?.shift()
      if (!card) continue
      picked.push(card)
      progressed = true
      if (picked.length >= count) break
    }
    if (!progressed) break
  }
  return picked
}

function buildOptions(
  correct: string,
  pool: string[],
  rng: () => number
): string[] | null {
  const seen = new Set([normalizeOption(correct)])
  const distractors: string[] = []
  for (const candidate of shuffle(pool, rng)) {
    const key = normalizeOption(candidate)
    if (!key || seen.has(key)) continue
    seen.add(key)
    distractors.push(candidate)
    if (distractors.length >= OPTIONS_PER_QUESTION - 1) break
  }
  if (distractors.length < OPTIONS_PER_QUESTION - 1) return null
  return shuffle([correct, ...distractors], rng)
}

export function buildLevelExam(
  cards: ExamCard[],
  rng: () => number = Math.random,
  count: number = EXAM_QUESTION_COUNT
): KeyedExamQuestion[] {
  const usable = cards.filter((card) => card.en.trim() && card.pt.trim())
  const picked = pickCardsAcrossPacks(usable, count, rng)
  const englishPool = usable.map((card) => card.en)
  const portuguesePool = usable.map((card) => card.pt)

  // Distribui os formatos pela proporção e embaralha a ordem para não haver blocos previsíveis.
  const kinds: ExamQuestionKind[] = []
  for (const { kind, share } of KIND_PLAN) {
    for (let i = 0; i < Math.round(share * picked.length); i++) kinds.push(kind)
  }
  while (kinds.length < picked.length) kinds.push('en_pt')
  const orderedKinds = shuffle(kinds.slice(0, picked.length), rng)

  const questions: KeyedExamQuestion[] = []
  picked.forEach((card, index) => {
    const kind = orderedKinds[index]
    const base = { id: `q${index + 1}`, cardId: card.id, packId: card.packId }

    if (kind === 'typing') {
      questions.push({ ...base, kind, prompt: card.pt, answer: card.en })
      return
    }

    const englishAnswer = kind === 'pt_en' || kind === 'listening'
    const answer = englishAnswer ? card.en : card.pt
    const options = buildOptions(answer, englishAnswer ? englishPool : portuguesePool, rng)
    // Nível com pouquíssimas frases diferentes: cai para escrita, que não precisa de alternativas.
    if (!options) {
      questions.push({ ...base, kind: 'typing', prompt: card.pt, answer: card.en })
      return
    }

    questions.push({
      ...base,
      kind,
      prompt: kind === 'en_pt' ? card.en : kind === 'pt_en' ? card.pt : 'Ouça e escolha a frase que você ouviu.',
      options,
      answer,
      ...(kind === 'listening' ? { audioText: card.en } : {}),
    })
  })

  return questions
}

export function toPublicQuestion(question: KeyedExamQuestion): PublicExamQuestion {
  const { answer: _answer, cardId: _cardId, packId: _packId, audioText: _audioText, ...publicPart } = question
  void _answer
  void _cardId
  void _packId
  void _audioText
  return publicPart
}

/**
 * Múltipla escolha: a alternativa exata. Escrita: o corretor de produção do jogo, aceitando o
 * "quase" (um erro de digitação em palavra longa, um artigo) — numa prova de nível, um typo em
 * "restaurant" não deve valer o mesmo que não saber a frase.
 */
export function isExamAnswerCorrect(question: KeyedExamQuestion, given: string | undefined): boolean {
  if (!given?.trim()) return false
  if (question.kind === 'typing') return matchEnglishAnswer(given, question.answer) !== 'wrong'
  return given === question.answer
}

export type ExamReviewItem = {
  id: string
  kind: ExamQuestionKind
  prompt: string
  given: string | null
  answer: string
  correct: boolean
  packId: string
}

export function gradeLevelExam(
  questions: KeyedExamQuestion[],
  answers: Record<string, string>
): { score: number; total: number; passed: boolean; review: ExamReviewItem[] } {
  const review = questions.map((question) => {
    const given = answers[question.id]
    return {
      id: question.id,
      kind: question.kind,
      prompt: question.kind === 'listening' ? question.audioText ?? question.prompt : question.prompt,
      given: given?.trim() ? given : null,
      answer: question.answer,
      correct: isExamAnswerCorrect(question, given),
      packId: question.packId,
    }
  })
  const score = review.filter((item) => item.correct).length
  return { score, total: questions.length, passed: isExamPassing(score, questions.length), review }
}
