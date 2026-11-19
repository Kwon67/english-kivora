import {it,expect} from 'vitest'
import {evaluateReviewedPortfolio,type ReviewerEvidence} from './portfolioReadiness'
import {COMMUNICATIVE_SKILLS} from '@/features/study/lib/communicativeCurriculum'
it('requires independent review in two contexts for each activity; never certifies a level',()=>{
 const evidence:ReviewerEvidence[]=COMMUNICATIVE_SKILLS.flatMap(skill=>[1,2].map(n=>({level:'B2',skill,taskId:`${skill}-${n}`,contextId:`context-${n}`,reviewedAt:'2026-11-16T10:00:00Z',outcome:'meets',reviewerId:'reviewer',source:'human_review',independent:true})))
 expect(evaluateReviewedPortfolio('B2',evidence)).toEqual({readyForModeration:true,missing:[],certifiesLevel:false})
 expect(evaluateReviewedPortfolio('C1',evidence).readyForModeration).toBe(false)
 expect(evaluateReviewedPortfolio('B2',evidence.map(e=>({...e,contextId:'same'}))).missing).toHaveLength(4)
 expect(evaluateReviewedPortfolio('B2',evidence.map(e=>({...e,independent:false}))).missing).toHaveLength(4)
 expect(evaluateReviewedPortfolio('B2',[...evidence,{...evidence[0],outcome:'revisit',reviewedAt:'2026-11-17T10:00:00Z'}]).missing).toContain('reception')
})
