import 'server-only'

import { randomUUID } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/server'
import { generateAndUploadCardAudio } from '@/lib/cardAudio'
import { getAppDateString } from '@/lib/timezone'
import { generateAdaptiveCards } from './adaptiveGeneration'
import { collectPersonalLearningContext } from './personalLearningContext'
import { personalLearningStatus, type PersonalLearningJob, type PersonalLearningStatus } from './personalLearningTypes'

export function isPersonalLearningEnabled() {
  return process.env.ADAPTIVE_LEARNING_ENABLED !== 'false' && Boolean(process.env.GROQ_API_KEY?.trim())
}

function adminClient(): SupabaseClient | null {
  return createAdminClient() as unknown as SupabaseClient | null
}

export async function getPersonalLearningJob(supabase: SupabaseClient, userId: string): Promise<PersonalLearningJob | null> {
  const { data, error } = await supabase.from('personal_learning_jobs').select('*')
    .eq('user_id', userId).eq('plan_date', getAppDateString()).maybeSingle()
  if (error) throw new Error(`Personal learning unavailable: ${error.code}`)
  return data as PersonalLearningJob | null
}

/** No provider call here: rendering home stays fast and queue insertion is idempotent. */
export async function enqueuePersonalLearning(supabase: SupabaseClient, userId: string): Promise<PersonalLearningJob> {
  const existing = await getPersonalLearningJob(supabase, userId)
  if (existing) return existing
  const { error } = await supabase.from('personal_learning_jobs').upsert({ user_id: userId, plan_date: getAppDateString() }, {
    onConflict: 'user_id,plan_date', ignoreDuplicates: true,
  })
  if (error) throw new Error(`Could not queue learning: ${error.code}`)
  const job = await getPersonalLearningJob(supabase, userId)
  if (!job) throw new Error('Learning queue insert returned no job')
  return job
}

export async function readPersonalLearningStatus(userId: string): Promise<PersonalLearningStatus> {
  if (!isPersonalLearningEnabled()) return { status: 'disabled', message: 'Sua rotina e revisões estão disponíveis.' }
  const supabase = adminClient()
  if (!supabase) return { status: 'unavailable', message: 'A preparação automática está temporariamente indisponível.' }
  try {
    const job = await getPersonalLearningJob(supabase, userId)
    if (!job) return { status: 'queued', message: 'Vamos preparar seu treino pessoal.' }
    const result = personalLearningStatus(job)
    if (job.status === 'ready' && job.pack_id) {
      const { data } = await supabase.from('assignments').select('id').eq('user_id', userId)
        .eq('pack_id', job.pack_id).eq('assigned_date', job.plan_date).not('status', 'like', 'completed%')
        .order('created_at', { ascending: true }).limit(1).maybeSingle()
      if (data) result.activityId = data.id as string
    }
    // A killed final attempt must not leave the UI spinning indefinitely.
    if (['generating', 'audio'].includes(job.status) && job.attempts >= 3 && job.lease_until && Date.parse(job.lease_until) < Date.now()) {
      return { ...result, status: 'failed', retryable: false, message: 'Seu novo treino não pôde ser concluído hoje. Continue com sua rotina e suas revisões.' }
    }
    return result
  } catch {
    return { status: 'unavailable', message: 'A preparação automática está temporariamente indisponível. Suas revisões continuam disponíveis.' }
  }
}

/** Token-fenced writes stop a timed-out worker overwriting a newer worker. */
async function saveJob(supabase: SupabaseClient, job: PersonalLearningJob, update: Record<string, unknown>) {
  const { data, error } = await supabase.from('personal_learning_jobs').update({ ...update, updated_at: new Date().toISOString() })
    .eq('id', job.id).eq('lease_token', job.lease_token).gt('lease_until', new Date().toISOString()).select('id').maybeSingle()
  if (error || !data) throw new Error('Learning lease lost or persistence failed')
}

/** Runs inside Next after() or an awaited cron. Every completed audio is checkpointed. */
export async function processPersonalLearningJob(jobId: string): Promise<void> {
  if (!isPersonalLearningEnabled()) return
  const supabase = adminClient()
  if (!supabase) return
  const { data, error } = await supabase.rpc('claim_personal_learning_job', { p_job_id: jobId })
  if (error) { console.error('Personal learning claim failed', { code: error.code }); return }
  const job = (data as PersonalLearningJob[] | null)?.[0]
  if (!job) return // Another invocation owns the lease, or daily retry budget is spent.
  try {
    if (!job.cards.length) {
      const context = await collectPersonalLearningContext(supabase, job.user_id)
      job.plan = context.plan
      if (!context.plan.shouldGenerate) {
        await saveJob(supabase, job, {
          status: 'deferred', plan: context.plan, lease_token: null, lease_until: null,
          attempts: job.attempts - 1, next_attempt_at: new Date(Date.now() + 5 * 60_000).toISOString(),
          error_code: context.plan.generationBlockedReason,
        })
        return
      }
      await saveJob(supabase, job, { plan: context.plan, status: 'generating' })
      const generated = await generateAdaptiveCards(context)
      job.cards = generated.cards.map((card) => ({ id: randomUUID(), en: card.en, pt: card.pt }))
      await saveJob(supabase, job, { cards: job.cards, status: 'audio' })
    }
    // Sequential checkpoints with small bounded batches preserve completed work,
    // even when a provider fails halfway through a pack.
    for (let index = 0; index < job.cards.length; index += 2) {
      const batch = job.cards.slice(index, index + 2)
      const results = await Promise.allSettled(batch.map(async (card) => {
        if (card.audioUrl) return
        const audio = await generateAndUploadCardAudio({
          supabase: supabase as unknown as Parameters<typeof generateAndUploadCardAudio>[0]['supabase'],
          card: { id: card.id, english_phrase: card.en },
        })
        card.audioUrl = audio.audioUrl
      }))
      await saveJob(supabase, job, { cards: job.cards, status: 'audio' })
      if (results.some((result) => result.status === 'rejected')) throw new Error('Audio generation incomplete')
    }
    const publication = await supabase.rpc('publish_personal_learning_job', { p_job_id: job.id, p_lease_token: job.lease_token })
    if (publication.error) throw new Error('Learning publication failed')
  } catch (error) {
    // Provider response text can contain prompts or keys. Persist a stable code only.
    console.error('Personal learning attempt failed', { jobId, phase: job.cards.length ? 'audio_or_publication' : 'content', errorType: error instanceof Error ? error.name : 'unknown' })
    await saveJob(supabase, job, {
      status: 'failed', error_code: job.cards.length ? 'audio_or_publication' : 'content',
      next_attempt_at: new Date(Date.now() + 60_000 * job.attempts).toISOString(),
      lease_token: null, lease_until: null,
    }).catch(() => { /* A newer lease must retain control. */ })
  }
}

export async function requestPersonalLearning(userId: string): Promise<{ jobId?: string; status: PersonalLearningStatus }> {
  if (!isPersonalLearningEnabled()) return { status: { status: 'disabled', message: 'Sua rotina e revisões estão disponíveis.' } }
  const supabase = adminClient()
  if (!supabase) return { status: { status: 'unavailable', message: 'A preparação automática está temporariamente indisponível.' } }
  try {
    const job = await enqueuePersonalLearning(supabase, userId)
    return { jobId: job.id, status: job.status === 'ready' ? await readPersonalLearningStatus(userId) : personalLearningStatus(job) }
  } catch {
    return { status: { status: 'unavailable', message: 'A preparação automática está temporariamente indisponível. Suas revisões continuam disponíveis.' } }
  }
}
