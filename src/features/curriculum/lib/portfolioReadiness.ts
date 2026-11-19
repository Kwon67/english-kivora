import type { CefrLevel } from '@/features/cefr/lib/cefrLevels'
import { COMMUNICATIVE_SKILLS, type CommunicativeSkill } from '@/features/study/lib/communicativeCurriculum'
import { PRACTICE_UNITS, practiceStatus, type PracticeRecords } from './practicePath'
export type ReviewerEvidence = { level:CefrLevel; skill:CommunicativeSkill; taskId:string; contextId:string; reviewedAt:string; outcome:'meets'|'revisit'; reviewerId:string; source:'human_review'; independent:boolean }
/** Proposed moderation rule, not a validated CEFR cut score. Never writes curriculum/exam state. */
export function portfolioReadiness(level:CefrLevel,records:PracticeRecords) {
 const units=PRACTICE_UNITS.filter(unit=>unit.level===level)
 const complete=units.filter(unit=>practiceStatus(unit,records[unit.lesson.id])==='completed')
 return {completed:complete.length,total:units.length,readyForReview:complete.length===units.length,certifiesLevel:false as const}
}
/** The future review service must establish reviewer identity; client self-checks cannot supply this evidence. */
export function evaluateReviewedPortfolio(level:CefrLevel,evidence:ReviewerEvidence[]) {
 const missing=COMMUNICATIVE_SKILLS.filter(skill=>{
  const latest=new Map<string,ReviewerEvidence>()
  for(const item of evidence){
   if(item.level!==level||item.skill!==skill||item.source!=='human_review'||!item.reviewerId||!item.taskId||!item.contextId||!Number.isFinite(Date.parse(item.reviewedAt)))continue
   const prior=latest.get(item.taskId)
   if(!prior||Date.parse(item.reviewedAt)>=Date.parse(prior.reviewedAt))latest.set(item.taskId,item)
  }
  const passed=[...latest.values()].filter(item=>item.outcome==='meets'&&item.independent)
  return new Set(passed.map(item=>item.contextId)).size<2
 })
 return {readyForModeration:missing.length===0,missing,certifiesLevel:false as const}
}
