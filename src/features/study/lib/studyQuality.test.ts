import { describe, expect, it } from 'vitest'
import { adaptiveModes, aggregateStudyDays, recentSkillSignals, studyAccuracy, studyQuality } from './studyQuality'
import { buildAdaptiveLearningPlan } from '@/features/learning/lib/adaptivePlan'

describe('study quality evidence', () => {
  it('uses São Paulo dates and sums answers rather than averaging session percentages', () => {
    const days = aggregateStudyDays([{at:'2026-11-15T02:00:00Z',mode:'typing',correct:1,wrong:0},{at:'2026-11-14T19:00:00Z',mode:'typing',correct:4,wrong:5}])
    expect(days).toHaveLength(1); expect(days[0].date).toBe('2026-11-14'); expect(studyAccuracy(days[0].correct,days[0].wrong)).toBe(50)
  })
  it('keeps self-reported recall separate from objective skill accuracy', () => {
    const evidence=[{at:'2026-11-15T12:00:00Z',mode:'flashcard',correct:10,wrong:0,selfRated:true}]
    expect(aggregateStudyDays(evidence)[0]).toMatchObject({correct:0,wrong:0,selfReviews:10,selfRemembered:10})
    expect(recentSkillSignals(evidence,'2026-11-15')).toEqual([])
    expect(studyAccuracy(0,0)).toBeNull()
  })
  it('does not add a skill percentage for a session with no answers', () => {
    const [day] = aggregateStudyDays([{ at: '2026-11-15T12:00:00Z', mode: 'typing', correct: 0, wrong: 0 }])
    expect(day.activities).toBe(1)
    expect(day.skills).toEqual([])
  })
  it('labels small samples, and does not label absence as failure', () => {
    expect(studyQuality(0,0)).toBe('Sem avaliação objetiva'); expect(studyQuality(0,4)).toBe('Amostra inicial')
    expect(studyQuality(4,1)).toBe('Bom domínio no dia');expect(studyQuality(3,2)).toBe('Em consolidação');expect(studyQuality(2,3)).toBe('Precisa de reforço')
  })
  it('weights the preceding week less and excludes old/future answers', () => {
    const evidence=[0,8,14,-1].map(age=>({at:new Date(Date.parse('2026-11-15T12:00:00Z')-age*86400000).toISOString(),mode:'typing',correct:3,wrong:7}))
    expect(recentSkillSignals(evidence,'2026-11-15')).toEqual([{skill:'writing',correct:4.5,total:15}])
  })
})
describe('adaptive weekly distribution', () => {
  for (const [skill,mode] of [['writing','typing'],['speaking','speaking']] as const) {
    it(`prioritizes weak ${skill} without eliminating other skills`, () => {
      const count:Record<string,number>={}
      for(let day=0;day<7;day++) for(const m of adaptiveModes(['multiple_choice','listening','speaking','typing'],[{skill,correct:2,total:12}],day,3)) count[m]=(count[m]??0)+1
      expect(count[mode]).toBe(7)
      for (const [m,n] of Object.entries(count)) if(m!==mode){expect(n).toBeGreaterThan(0);expect(n).toBeLessThan(count[mode])}
      expect(Object.keys(count)).toHaveLength(4)
    })
  }
  it('also prioritizes speaking at A1, instead of assigning the same three modes every day',()=>{
    const counts:Record<string,number>={}
    for(let day=0;day<7;day++) for(const m of buildAdaptiveLearningPlan({level:'A1',skillSignals:[{skill:'speaking',correct:1,total:10}],sequence:day}).assignmentModes!) counts[m]=(counts[m]??0)+1
    expect(counts.speaking).toBe(7); expect(counts.listening).toBeGreaterThan(0);expect(counts.listening).toBeLessThan(7);expect(counts.typing).toBeGreaterThan(0)
  })
  it('respects manual activities and never adds a focus slot to a full day',()=>{
    expect(buildAdaptiveLearningPlan({level:'A2',existingDailyActivities:3,skillSignals:[{skill:'writing',correct:0,total:10}]})).toMatchObject({shouldGenerate:false,assignmentModes:[],generationBlockedReason:'daily_plan_ready'})
    expect(buildAdaptiveLearningPlan({level:'A2',existingDailyActivities:2}).assignmentModes).toHaveLength(1)
  })
  it('does not diagnose a weakness from a handful of errors',()=>{
    expect(adaptiveModes(['typing','listening','speaking'],[{skill:'writing',correct:0,total:2}],1,2)).toEqual(['listening','speaking'])
  })
  it('recalculates after improvement, preserving deterministic plans and backlog limits',()=>{
    const base={level:'A2' as const,sequence:8,skillSignals:[{skill:'writing' as const,correct:9,total:10}]}
    expect(buildAdaptiveLearningPlan(base)).toEqual(buildAdaptiveLearningPlan(base))
    expect(buildAdaptiveLearningPlan({...base,dueReviewCount:20})).toMatchObject({shouldGenerate:false,cardCount:0})
    expect(buildAdaptiveLearningPlan({...base,skillSignals:[{skill:'writing',correct:2,total:10}],problemWords:['restaurant']})).toMatchObject({focus:'writing'})
  })
})
