import { getAppDateString } from '@/lib/timezone'

export const SKILL_LABELS = { vocabulary: 'Vocabulário', reading: 'Leitura', writing: 'Escrita', listening: 'Escuta', speaking: 'Fala' } as const
export type StudySkill = keyof typeof SKILL_LABELS
export const SKILL_BY_MODE: Record<string, StudySkill> = { multiple_choice: 'reading', reading: 'reading', typing: 'writing', writing: 'writing', listening: 'listening', speaking: 'speaking', matching: 'vocabulary' }
export type StudyEvidence = { at: string; mode: string; correct: number; wrong: number; selfRated?: boolean }
export type SkillSignal = { skill: StudySkill; correct: number; total: number }
export type StudyDay = { date: string; correct: number; wrong: number; selfReviews: number; selfRemembered: number; activities: number; skills: SkillSignal[] }
export function studyAccuracy(correct: number, wrong: number) {
  return correct + wrong > 0 ? Math.round(correct * 100 / (correct + wrong)) : null
}
export function studyQuality(correct: number, wrong: number) {
  const accuracy = studyAccuracy(correct, wrong)
  if (accuracy === null) return 'Sem avaliação objetiva'
  if (correct + wrong < 5) return 'Amostra inicial'
  return accuracy >= 80 ? 'Bom domínio no dia' : accuracy >= 60 ? 'Em consolidação' : 'Precisa de reforço'
}
export function aggregateStudyDays(evidence: StudyEvidence[]): StudyDay[] {
  const days = new Map<string, StudyDay>()
  for (const item of evidence) {
    if (!Number.isFinite(Date.parse(item.at))) continue
    const correct = Math.max(0, item.correct), wrong = Math.max(0, item.wrong)
    const date = getAppDateString(item.at)
    const day = days.get(date) ?? { date, correct: 0, wrong: 0, selfReviews: 0, selfRemembered: 0, activities: 0, skills: [] }
    day.activities++
    if (item.selfRated) { day.selfReviews += correct + wrong; day.selfRemembered += correct }
    else {
      day.correct += correct; day.wrong += wrong
      const skill = SKILL_BY_MODE[item.mode]
      if (skill && correct + wrong > 0) {
        let signal = day.skills.find(s => s.skill === skill)
        if (!signal) { signal = { skill, correct: 0, total: 0 }; day.skills.push(signal) }
        signal.correct += correct; signal.total += correct + wrong
      }
    }
    days.set(date, day)
  }
  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date))
}
/** Recent answers have full weight; the preceding week has half weight. Self-ratings never diagnose a skill. */
export function recentSkillSignals(evidence: StudyEvidence[], today: string): SkillSignal[] {
  const signals = new Map<StudySkill, SkillSignal>()
  for (const day of aggregateStudyDays(evidence)) {
    const age = (Date.parse(today) - Date.parse(day.date)) / 86400000
    if (age < 0 || age > 13) continue
    const weight = age < 7 ? 1 : 0.5
    for (const s of day.skills) {
      const target = signals.get(s.skill) ?? { skill: s.skill, correct: 0, total: 0 }
      target.correct += s.correct * weight; target.total += s.total * weight
      signals.set(s.skill, target)
    }
  }
  return [...signals.values()]
}
/** One daily focus slot, remaining slots rotate. Across a week the weak skill gets more practice, without crowding out the rest. */
export function adaptiveModes(modes: string[], signals: SkillSignal[], sequence: number, size: number): string[] {
  if (!modes.length || size <= 0) return []
  const weak = signals.filter(s => s.total >= 6 && s.correct / s.total < 0.8 && modes.some(m => SKILL_BY_MODE[m] === s.skill))
    .sort((a, b) => a.correct / a.total - b.correct / b.total || b.total - a.total)[0]
  const focus = weak ? modes.find(m => SKILL_BY_MODE[m] === weak.skill) : undefined
  const others = modes.filter(m => m !== focus)
  const result = focus ? [focus] : []
  const offset = ((sequence % others.length) + others.length) % others.length
  for (let i = 0; result.length < Math.min(size, focus ? Math.max(2, modes.length - 1) : modes.length); i++) result.push(others[(offset + i) % others.length])
  return result
}
