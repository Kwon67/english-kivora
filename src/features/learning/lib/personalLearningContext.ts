import type { SupabaseClient } from '@supabase/supabase-js'
import { getUserCefrProfile } from '@/features/cefr/lib/cefrAssessment'
import { getLevelGate } from './levelGate'
import { getAppDateString, shiftAppDate } from '@/lib/timezone'
import { buildAdaptiveLearningPlan, type AdaptiveSkill } from './adaptivePlan'

type Session = {
  correct_answers: number
  wrong_answers: number
  assignments: { game_mode: string } | null
}

const SKILL_BY_MODE: Record<string, AdaptiveSkill> = {
  multiple_choice: 'reading', listening: 'listening', speaking: 'speaking',
  typing: 'writing', matching: 'vocabulary',
}

/** All evidence is scoped to the authenticated member; no other learner's text is sent to Groq. */
export async function collectPersonalLearningContext(supabase: SupabaseClient, userId: string) {
  const today = getAppDateString()
  const since = `${shiftAppDate(today, -14)}T00:00:00Z`
  const [profile, onboarding, due, sessions, mistakes, previous, owned] = await Promise.all([
    getUserCefrProfile(supabase, userId),
    supabase.from('user_onboarding').select('daily_goal_minutes,interests').eq('user_id', userId).maybeSingle(),
    supabase.from('card_reviews').select('id', { count: 'exact', head: true }).eq('user_id', userId).lte('next_review_date', new Date().toISOString()),
    supabase.from('game_sessions').select('correct_answers,wrong_answers,assignments!inner(game_mode)').eq('user_id', userId).gte('completed_at', since).order('completed_at', { ascending: false }).limit(60),
    supabase.from('session_errors').select('cards!inner(english_phrase)').eq('user_id', userId).gte('created_at', since).order('created_at', { ascending: false }).limit(40),
    supabase.from('personal_learning_jobs').select('pack_id,plan,cards').eq('user_id', userId).eq('status', 'ready').order('plan_date', { ascending: false }).limit(30),
    supabase.from('assignments').select('pack_id,status').eq('user_id', userId).eq('assigned_by', 'auto').gte('assigned_date', shiftAppDate(today, -7)).not('status', 'like', 'completed%').limit(80),
  ])
  for (const result of [onboarding, due, sessions, mistakes, previous, owned]) {
    if (result.error) throw new Error(`Learner evidence unavailable: ${result.error.code || 'query_failed'}`)
  }
  const personalPackIds = new Set((previous.data || []).map((row) => row.pack_id as string))
  const packIds = [...new Set((owned.data || []).map((row) => row.pack_id as string))].filter((id) => personalPackIds.has(id))
  // Count unseen phrases, not unfinished modes of already studied cards. Otherwise
  // a microphone permission problem could prevent all new content indefinitely.
  let pendingNewCards = 0
  if (packIds.length) {
    const [pending, seen] = await Promise.all([
      supabase.from('cards').select('id').in('pack_id', packIds).limit(1000),
      supabase.from('card_reviews').select('card_id').eq('user_id', userId).in('pack_id', packIds).limit(1000),
    ])
    if (pending.error || seen.error) throw new Error('Pending learning evidence unavailable')
    const seenIds = new Set((seen.data || []).map((row) => row.card_id))
    pendingNewCards = (pending.data || []).filter((card) => !seenIds.has(card.id)).length
  }
  const skillSignals = new Map<AdaptiveSkill, { skill: AdaptiveSkill; correct: number; total: number }>()
  for (const session of (sessions.data || []) as unknown as Session[]) {
    const skill = SKILL_BY_MODE[session.assignments?.game_mode || '']
    if (!skill) continue // Self-assessed flashcards cannot measure productive skill.
    const signal = skillSignals.get(skill) || { skill, correct: 0, total: 0 }
    signal.correct += Math.max(0, session.correct_answers)
    signal.total += Math.max(0, session.correct_answers) + Math.max(0, session.wrong_answers)
    skillSignals.set(skill, signal)
  }
  const recentPlans = (previous.data || []) as Array<{ plan: { topic?: string }; cards: Array<{ en: string }> }>
  const problemPhrases = (mistakes.data || []) as unknown as Array<{ cards: { english_phrase: string } }>
  // Include recently practiced catalog phrases so novelty isn't only measured against AI packs.
  const reviews = await supabase.from('card_reviews').select('cards!inner(english_phrase)').eq('user_id', userId).order('review_date', { ascending: false }).limit(300)
  if (reviews.error) throw new Error('Phrase history unavailable')
  const reviewed = reviews.data as unknown as Array<{ cards: { english_phrase: string } }>
  const avoidPhrases = [...new Set([
    ...recentPlans.flatMap((job) => job.cards.map((card) => card.en)),
    ...reviewed.map((row) => row.cards.english_phrase),
    ...problemPhrases.map((row) => row.cards.english_phrase),
  ])]
  const sequence = Math.floor(Date.parse(`${today}T00:00:00Z`) / 86_400_000)
  const gate = getLevelGate(profile)
  const challenge = gate.stretch && sequence % 3 === 0 ? gate.stretch : null
  // Extract lexical targets from actual errors; complete sentences would be
  // discarded by the provider's strict, privacy-conscious target-word filter.
  const commonWords = new Set('a an the i you he she it we they my your our is am are was were be been to of in on at and or but do does did have has had can could would will should not no yes this that with for from'.split(' '))
  const targets = problemPhrases.flatMap((row) => (row.cards.english_phrase.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) || [])
    .filter((word) => word.length > 2 && !commonWords.has(word)))
  const plan = buildAdaptiveLearningPlan({
      level: challenge || profile.level,
      confidence: profile.confidence,
      assessing: profile.assessing,
      dailyGoalMinutes: onboarding.data?.daily_goal_minutes,
      interests: onboarding.data?.interests || [],
      problemWords: targets,
      dueReviewCount: due.count || 0,
      pendingNewCards,
      skillSignals: [...skillSignals.values()],
      recentTopics: recentPlans.map((row) => row.plan.topic || ''),
      sequence,
    })
  if (challenge) plan.reasons.unshift(`Desafio ${challenge} liberado pela sua prática no ${gate.current}; sua estimativa de nível continua ${gate.current}.`)
  return {
    plan,
    avoidPhrases,
  }
}
