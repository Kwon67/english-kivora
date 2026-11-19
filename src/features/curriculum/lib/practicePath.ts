import { z } from 'zod'
import { CEFR_LEVELS, type CefrLevel } from '@/features/cefr/lib/cefrLevels'
import { TODAY_LESSONS, TodayDraftSchema, type TodayLesson } from '@/features/study/lib/todayLesson'
import { COMMUNICATIVE_SKILLS } from '@/features/study/lib/communicativeCurriculum'
import authoredUnits from '../data/practiceUnits.json'
import extensions from '../data/practiceExtensions.json'
type Extension = typeof extensions[keyof typeof extensions]

export type PracticeUnit = {
  turns: string[]; transfer: Extension['transfer'];
  level: CefrLevel; lesson: TodayLesson; turn: string; interaction: string; mediation: string;
  checks: string[]; tags: string[]; prerequisites: string[]; packIds: string[];
  objectives: { id: string; skill: typeof COMMUNICATIVE_SKILLS[number]; task: string; criteria: string[] }[];
}
const packIds: Record<CefrLevel, string[]> = {
  A1: ['cf9a23fd-a714-43ee-ad20-52290b8fcf58','033aed12-d9a5-4bb1-aca4-af1766bdaf0e','8a606e40-a2c8-4b8f-a1bb-f13e88d1d049'],
  A2: ['1690f7e8-83c8-497a-84ad-b9f44a0eb063','60e430c4-e778-4aa1-8c0d-c67730000122','bba7e0bf-bf2d-46ef-91f3-52dd7042652c'],
  B1: ['99982a5b-1db1-42fc-98b2-8b34abc3b712','4c56b3a7-9031-4760-a926-449d4673a94d','89bda049-c870-4dcc-bf36-1cdf81f3f5e7'],
  B2: ['419b49ff-63f2-45c6-95e2-70038980a234','d4da1e74-6692-4f52-aa49-0c75f6237b50','169e0da0-f12a-4d78-b9c1-f861a7f6e0e5'],
  C1: ['107fc0f5-4c84-4a2f-8e4c-32d5f21903bf','b8eec019-b7fe-46ac-b879-618949cc25d8','e7a7fffd-7dfb-4868-895f-72939e528b4a'],
  C2: ['78fa7340-6962-4416-b4c4-a564fa77dfac','d5b52a35-638b-41ae-9166-cf6446380295','8cb19fdc-39f9-4265-afa6-d72bcab721b8'],
}
const turns: Record<CefrLevel,string> = {
  A1:'I cannot meet at ten. Can we meet at eleven?', A2:'I cannot walk far. Is there another option in the notice?',
  B1:'I can bring food, but I need to leave at two. Can I still join?', B2:'The support team worries that it will carry all the extra work. How would you address that?',
  C1:'Some residents think higher attendance proves better learning. How would you respond?', C2:'Could we describe the provisional measure as consensus to reassure the public?',
}
export const PRACTICE_UNITS: PracticeUnit[] = CEFR_LEVELS.flatMap(level => {
  const units = [{level,lesson:TODAY_LESSONS[level],turn:turns[level],interaction:'Responda em inglês a esta nova mensagem. Considere a necessidade ou objeção sem inventar informações.',mediation:'Explique em inglês os pontos essenciais da situação a alguém que não leu o texto. Preserve limites, condições e informações ainda ausentes.',checks:['Eu respondi à necessidade ou objeção apresentada.','Eu adaptei a explicação sem inventar informações.'],tags:['retomada']}, ...authoredUnits.filter(unit=>unit.level===level)]
  return units.map((unit,index) => ({...unit,...extensions[unit.lesson.id as keyof typeof extensions],level,prerequisites:index?[units[index-1].lesson.id]:[],packIds:[packIds[level][index]],
    objectives: COMMUNICATIVE_SKILLS.map(skill=>({id:`${unit.lesson.id}:${skill}`,skill,
      task:skill==='reception'?unit.lesson.question:skill==='production'?unit.lesson.prompt:skill==='interaction'?unit.interaction:unit.mediation,
      criteria:skill==='reception'?['Identifica a informação solicitada sem alterar seu sentido.']:skill==='production'?unit.lesson.criteria:[unit.checks[skill==='interaction'?0:1]],
    })),
  }))
})
export const practiceStorageKey = (userId:string) => `kivora-competency-path-v1:${userId}`
const TransferSchema = z.object({firstChoice:z.number().int().min(0).max(2).nullable(),response:z.string().max(6000),checked:z.boolean(),attempts:z.number().int().min(1).max(1000),supportUsed:z.boolean()})
const RecordSchema = z.object({ dialogue:z.array(z.string().max(6000)).length(2).default(['','']), transfer:TransferSchema.default({firstChoice:null,response:'',checked:false,attempts:1,supportUsed:false}), today:TodayDraftSchema.nullable(), interaction:z.string().max(6000), mediation:z.string().max(6000), checks:z.tuple([z.boolean(),z.boolean()]), completedAt:z.string().datetime().nullable() })
export type PracticeRecord = z.infer<typeof RecordSchema>
export type PracticeRecords = Record<string,PracticeRecord>
export function emptyPracticeRecord(): PracticeRecord { return {dialogue:['',''],transfer:{firstChoice:null,response:'',checked:false,attempts:1,supportUsed:false},today:null,interaction:'',mediation:'',checks:[false,false],completedAt:null} }
export function restorePracticeRecords(raw:string|null): PracticeRecords {
  try {
    const parsed=z.object({version:z.union([z.literal(1),z.literal(2)]),records:z.record(z.string(),z.unknown())}).parse(JSON.parse(raw||'null'))
    const records:PracticeRecords={}
    for(const [id,value] of Object.entries(parsed.records)) {
      const record=RecordSchema.safeParse(value)
      if(record.success && PRACTICE_UNITS.some(unit=>unit.lesson.id===id) && (!record.data.today||record.data.today.lessonId===id)) records[id]=record.data
    }
    return records
  } catch { return {} }
}
/** Workflow completion is deliberately not evidence of CEFR mastery or an exam pass. */
export function practiceStatus(unit:PracticeUnit, record?:PracticeRecord): 'not_started'|'in_progress'|'needs_recovery'|'ready'|'completed' {
  if (!record?.today?.completedAt) return record?.today || record?.interaction || record?.mediation ? 'in_progress':'not_started'
  if (!record.today.revision.trim() || !record.interaction.trim() || !record.mediation.trim()) return 'in_progress'
  if (record.dialogue.some(reply=>!reply.trim()) || record.transfer.firstChoice===null || !record.transfer.response.trim()) return 'in_progress'
  if (record.transfer.firstChoice!==unit.transfer.answer || !record.transfer.checked || record.today.firstChoice!==unit.lesson.answer || !record.today.checked.every(Boolean) || !record.checks.every(Boolean)) return 'needs_recovery'
  return record.completedAt ? 'completed':'ready'
}
export function canStartUnit(unit:PracticeUnit, records:PracticeRecords) {
  return unit.prerequisites.every(id=>{ const previous=PRACTICE_UNITS.find(item=>item.lesson.id===id);return previous && practiceStatus(previous,records[id])==='completed' })
}
export function nextPracticeUnit(level:CefrLevel,records:PracticeRecords) {
  return PRACTICE_UNITS.find(unit=>unit.level===level && canStartUnit(unit,records) && practiceStatus(unit,records[unit.lesson.id])!=='completed') ?? null
}
