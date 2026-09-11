import { afterEach, describe, expect, it, vi } from 'vitest'
import { AI_MODELS, createGroqChatCompletion, GroqApiError } from '@/features/ai/lib/groq'
import { buildAdaptiveLearningPlan } from './adaptivePlan'
import { applyAdaptiveQualityReview, generateAdaptiveCards, validateAdaptiveCards } from './adaptiveGeneration'

vi.mock('@/features/ai/lib/groq', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/ai/lib/groq')>()
  return { ...actual, createGroqChatCompletion: vi.fn() }
})

const cards = [
  { en: 'I need some water.', pt: 'Eu preciso de água.' },
  { en: 'Where is the station?', pt: 'Onde fica a estação?' },
  { en: 'My sister works here.', pt: 'Minha irmã trabalha aqui.' },
  { en: 'We eat dinner early.', pt: 'Nós jantamos cedo.' },
]
const output = (items = cards, level = 'A1') => JSON.stringify({ level, cards: items })
const review = (count: number) => JSON.stringify({ reviews: Array.from({ length: count }, (_, index) => ({
  index, naturalEnglish: true, translationCorrect: true, levelAppropriate: true, objectiveAligned: true,
})) })
const plan = buildAdaptiveLearningPlan({ level: 'A1', dailyGoalMinutes: 5 })

afterEach(() => vi.clearAllMocks())

describe('validateAdaptiveCards', () => {
  it('requires an exact level and genuine JSON object, including null-safe parsing', () => {
    for (const invalid of ['null', '[]', 'not json', output(cards, 'C2'), '```json\n' + output() + '\n```']) {
      expect(validateAdaptiveCards(invalid, 'A1').cards).toEqual([])
    }
  })

  it('rejects oversized, untranslated, malformed and unsafe text before sending it to TTS', () => {
    const result = validateAdaptiveCards(output([
      ...cards,
      { en: 'Although the proposal had been enthusiastically endorsed, implementation would nevertheless require substantial institutional reform.', pt: 'Proposta complexa.' },
      { en: 'This is English.', pt: 'This is English.' },
      { en: '<speak>Hello there</speak>', pt: 'Olá.' },
      { en: 'Send mail to person@example.com', pt: 'Envie um e-mail.' },
      { en: 'A valid English sentence.', pt: '' },
    ]), 'A1')
    expect(result.cards).toEqual(cards)
    expect(result.discarded).toBe(5)
  })

  it('accepts natural advanced material at C2 without reducing it to B2', () => {
    const advanced = [{ en: 'For all its apparent candour, the memoir leaves the most consequential questions conspicuously unanswered.', pt: 'Apesar da aparente franqueza, o livro de memórias deixa as questões mais importantes visivelmente sem resposta.' }]
    expect(validateAdaptiveCards(output(advanced, 'C2'), 'C2').cards).toEqual(advanced)
  })
})

describe('applyAdaptiveQualityReview', () => {
  it('fails closed on missing verdicts and invalid boolean types', () => {
    expect(applyAdaptiveQualityReview(cards, 'null')).toEqual([])
    expect(applyAdaptiveQualityReview(cards, '{"reviews":[{"index":0,"translationCorrect":"true"}]}')).toEqual([])
    expect(applyAdaptiveQualityReview(cards, review(1))).toEqual([cards[0]])
  })

  it('rejects a wrong translation and a duplicated verdict index', () => {
    const parsed = JSON.parse(review(4))
    parsed.reviews[1].translationCorrect = false
    parsed.reviews.push(parsed.reviews[2])
    expect(applyAdaptiveQualityReview(cards, JSON.stringify(parsed))).toEqual([cards[0], cards[3]])
  })
})

describe('generateAdaptiveCards', () => {
  it('deduplicates existing and intra-batch phrases before semantic review, then fills the gap', async () => {
    vi.mocked(createGroqChatCompletion)
      .mockResolvedValueOnce(output([cards[0], ...cards]))
      .mockResolvedValueOnce(review(3))
      .mockResolvedValueOnce(output([{ en: 'The shop opens soon.', pt: 'A loja abre em breve.' }]))
      .mockResolvedValueOnce(review(1))
    const result = await generateAdaptiveCards({ plan, avoidPhrases: [cards[0].en.toUpperCase()] })
    expect(result.cards).toHaveLength(4)
    expect(result.cards.some((card) => card.en === cards[0].en)).toBe(false)
    expect(result.discarded).toBe(2)
    expect(result.rounds).toBe(2)
    expect(vi.mocked(createGroqChatCompletion).mock.calls[0][0]).toMatchObject({ maxRetries: 1, timeoutMs: 20_000, jsonSchema: { name: 'adaptive_cards' } })
  })

  it('returns a quality error instead of publishing missing or unreviewed cards', async () => {
    vi.mocked(createGroqChatCompletion)
      .mockResolvedValueOnce(output()).mockResolvedValueOnce('{"reviews":[]}')
      .mockResolvedValueOnce('null')
    await expect(generateAdaptiveCards({ plan, avoidPhrases: [] })).rejects.toMatchObject({ code: 'insufficient_quality' })
    expect(createGroqChatCompletion).toHaveBeenCalledTimes(3)
  })

  it('uses the supported fallback model when the primary model is unavailable', async () => {
    vi.mocked(createGroqChatCompletion)
      .mockRejectedValueOnce(new GroqApiError('Model unavailable', 404))
      .mockResolvedValueOnce(output()).mockResolvedValueOnce(review(4))
    const result = await generateAdaptiveCards({ plan, avoidPhrases: [] })
    expect(result.model).toBe(AI_MODELS.fallback)
    expect(result.cards).toEqual(cards)
  })

  it('does not retry invalid credentials or use catalog cards as a substitute', async () => {
    vi.mocked(createGroqChatCompletion).mockRejectedValueOnce(new GroqApiError('Unauthorized', 401))
    await expect(generateAdaptiveCards({ plan, avoidPhrases: [] })).rejects.toMatchObject({ status: 401 })
    expect(createGroqChatCompletion).toHaveBeenCalledTimes(1)
  })

  it('does not call the provider for a paused plan or unbounded request', async () => {
    await expect(generateAdaptiveCards({ plan: { ...plan, shouldGenerate: false }, avoidPhrases: [] })).rejects.toMatchObject({ code: 'plan_paused' })
    await expect(generateAdaptiveCards({ plan: { ...plan, cardCount: 1000 }, avoidPhrases: [] })).rejects.toMatchObject({ code: 'invalid_plan' })
    expect(createGroqChatCompletion).not.toHaveBeenCalled()
  })
})
