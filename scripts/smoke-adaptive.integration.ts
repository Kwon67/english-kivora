import { test, expect, vi } from 'vitest'
import { mkdir, writeFile } from 'node:fs/promises'

vi.mock('server-only', () => ({}))
process.loadEnvFile('.env.local')

test('live Groq content and Microsoft speech, no member/database writes', async () => {
  const { buildAdaptiveLearningPlan } = await import('../src/features/learning/lib/adaptivePlan')
  const { generateAdaptiveCards } = await import('../src/features/learning/lib/adaptiveGeneration')
  const { synthesizeSpeechToBuffer, getTtsProviderConfig } = await import('../src/lib/tts')
  const plan = buildAdaptiveLearningPlan({ level: 'A1', confidence: 75, dailyGoalMinutes: 5, interests: ['travel'], problemWords: ['ticket', 'help'] })
  const result = await generateAdaptiveCards({ plan, avoidPhrases: ['I am a student.'] })
  expect(result.cards.length).toBeGreaterThanOrEqual(4)
  const audio = await synthesizeSpeechToBuffer(result.cards[0].en)
  expect(audio.length).toBeGreaterThan(1000)
  await mkdir('output/adaptive-audit', { recursive: true })
  await writeFile('output/adaptive-audit/live-generation.json', JSON.stringify({ plan, ...result, provider: getTtsProviderConfig().provider, audioBytes: audio.length }, null, 2))
  await writeFile('output/adaptive-audit/sample.mp3', audio)
  console.log(JSON.stringify({ cards: result.cards.length, model: result.model, speech: getTtsProviderConfig().provider, audioBytes: audio.length }))
})
