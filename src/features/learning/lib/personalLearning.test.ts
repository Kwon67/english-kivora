import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildAdaptiveLearningPlan } from './adaptivePlan'
import type { PersonalLearningJob } from './personalLearningTypes'

const mocks = vi.hoisted(() => ({ admin: vi.fn(), context: vi.fn(), generate: vi.fn(), audio: vi.fn() }))
vi.mock('server-only', () => ({}))
vi.mock('@/lib/supabase/server', () => ({ createAdminClient: mocks.admin }))
vi.mock('./personalLearningContext', () => ({ collectPersonalLearningContext: mocks.context }))
vi.mock('./adaptiveGeneration', () => ({ generateAdaptiveCards: mocks.generate }))
vi.mock('@/lib/cardAudio', () => ({ generateAndUploadCardAudio: mocks.audio }))

import { processPersonalLearningJob } from './personalLearning'

describe('durable personal learning worker', () => {
  let job: PersonalLearningJob
  let publish = vi.fn<() => Promise<{ data: string; error: null }>>()
  let writes: Array<Record<string, unknown>>
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('GROQ_API_KEY', 'test-only')
    vi.stubEnv('ADAPTIVE_LEARNING_ENABLED', 'true')
    job = { id: 'job-a', user_id: 'member-a', plan_date: '2026-09-10', status: 'generating', plan: null, cards: [], pack_id: null, attempts: 1, lease_token: 'lease-a', lease_until: new Date(Date.now() + 240_000).toISOString(), next_attempt_at: '', error_code: null, created_at: '', updated_at: '' }
    writes = []
    publish = vi.fn().mockResolvedValue({ data: 'pack-a', error: null })
    mocks.admin.mockReturnValue({
      rpc: (name: string) => name === 'claim_personal_learning_job' ? Promise.resolve({ data: [structuredClone(job)], error: null }) : publish(),
      from: () => ({ update: (change: Record<string, unknown>) => {
        const query = { eq: () => query, gt: () => query, select: () => query, maybeSingle: async () => {
          writes.push(structuredClone(change)); Object.assign(job, change)
          return { data: { id: job.id }, error: null }
        } }
        return query
      } }),
    })
    mocks.context.mockResolvedValue({ plan: buildAdaptiveLearningPlan({ level: 'A1' }), avoidPhrases: ['I already know this.'] })
    mocks.generate.mockResolvedValue({ cards: Array.from({ length: 4 }, (_, i) => ({ en: `Phrase number ${i}.`, pt: `Frase número ${i}.` })) })
    mocks.audio.mockImplementation(async ({ card }: { card: { id: string } }) => ({ audioUrl: `https://audio.example/${card.id}.mp3` }))
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('publishes only after every validated card has a checkpointed audio', async () => {
    await processPersonalLearningJob(job.id)
    expect(mocks.context).toHaveBeenCalledWith(expect.anything(), 'member-a')
    expect(mocks.audio).toHaveBeenCalledTimes(4)
    expect(job.cards.every((card) => card.audioUrl)).toBe(true)
    expect(publish).toHaveBeenCalledTimes(1)
    expect(writes.filter((write) => write.cards).length).toBe(3)
  })

  it('retains successful audio after failure and resumes without another Groq generation', async () => {
    mocks.audio.mockRejectedValueOnce(new Error('provider down'))
    await processPersonalLearningJob(job.id)
    expect(publish).not.toHaveBeenCalled()
    expect(job.status).toBe('failed')
    expect(job.cards.filter((card) => card.audioUrl)).toHaveLength(1)
    job.lease_token = 'lease-b'; job.attempts = 2
    await processPersonalLearningJob(job.id)
    expect(mocks.generate).toHaveBeenCalledTimes(1)
    expect(mocks.audio).toHaveBeenCalledTimes(5)
    expect(publish).toHaveBeenCalledTimes(1)
  })

  it('does not call providers when review backlog requires consolidation', async () => {
    mocks.context.mockResolvedValue({ plan: buildAdaptiveLearningPlan({ level: 'A1', dueReviewCount: 40 }), avoidPhrases: [] })
    await processPersonalLearningJob(job.id)
    expect(job.status).toBe('deferred')
    expect(job.attempts).toBe(0)
    expect(mocks.generate).not.toHaveBeenCalled()
    expect(mocks.audio).not.toHaveBeenCalled()
    expect(publish).not.toHaveBeenCalled()
  })

  it('does no work when another process owns the lease', async () => {
    mocks.admin.mockReturnValue({ rpc: vi.fn().mockResolvedValue({ data: [], error: null }) })
    await processPersonalLearningJob(job.id)
    expect(mocks.context).not.toHaveBeenCalled()
    expect(mocks.generate).not.toHaveBeenCalled()
  })

  it('persists a safe error code rather than provider error text', async () => {
    mocks.generate.mockRejectedValue(new Error('private-user-text SECRET_KEY'))
    await processPersonalLearningJob(job.id)
    expect(job.status).toBe('failed')
    expect(job.error_code).toBe('content')
    expect(JSON.stringify(writes)).not.toContain('SECRET_KEY')
    expect(publish).not.toHaveBeenCalled()
  })
})
