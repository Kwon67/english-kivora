import { describe,it,expect } from 'vitest'
import { CEFR_LEVELS } from '@/features/cefr/lib/cefrLevels'
import { emptyTodayDraft } from '@/features/study/lib/todayLesson'
import { PRACTICE_UNITS, emptyPracticeRecord, practiceStatus, restorePracticeRecords, canStartUnit, nextPracticeUnit, type PracticeRecord } from './practicePath'
function finished(id:string):PracticeRecord {
 const unit=PRACTICE_UNITS.find(item=>item.lesson.id===id)!
 return {...emptyPracticeRecord(),dialogue:['A clarification.','A final agreement.'],transfer:{firstChoice:unit.transfer.answer,response:'A response in a new context.',checked:true,attempts:1,supportUsed:false},today:{...emptyTodayDraft(id),revision:'A meaningful revised response.',completedAt:new Date().toISOString(),firstChoice:unit.lesson.answer,checked:[true,true,true]},interaction:'A reply to the new constraint.',mediation:'A summary for a new audience.',checks:[true,true],completedAt:new Date().toISOString()}
}
describe('competency practice progression',()=>{
 it('contains 18 unique situations and 72 explicit activities, without dangling prerequisites',()=>{
  expect(PRACTICE_UNITS).toHaveLength(18)
  expect(new Set(PRACTICE_UNITS.map(unit=>unit.lesson.id)).size).toBe(18)
  expect(new Set(PRACTICE_UNITS.flatMap(unit=>unit.objectives.map(o=>o.id))).size).toBe(72)
  for(const level of CEFR_LEVELS){
   const units=PRACTICE_UNITS.filter(unit=>unit.level===level);expect(units).toHaveLength(3)
   units.forEach((unit,index)=>{expect(unit.prerequisites).toEqual(index?[units[index-1].lesson.id]:[]);expect(unit.lesson.choices).toHaveLength(3);expect(unit.lesson.choices[unit.lesson.answer]).toBeTruthy();expect(unit.objectives.map(o=>o.skill)).toEqual(['reception','production','interaction','mediation'])})
  }
 })
 it.each(CEFR_LEVELS)('%s advances only when all workflow evidence is present',level=>{
  const units=PRACTICE_UNITS.filter(unit=>unit.level===level), records={}
  expect(nextPracticeUnit(level,records)?.lesson.id).toBe(units[0].lesson.id)
  expect(canStartUnit(units[1],records)).toBe(false)
  const done=finished(units[0].lesson.id)
  expect(practiceStatus(units[0],done)).toBe('completed')
  expect(nextPracticeUnit(level,{[units[0].lesson.id]:done})?.lesson.id).toBe(units[1].lesson.id)
  expect(practiceStatus(units[0],{...done,transfer:{...done.transfer,firstChoice:(units[0].transfer.answer+1)%3}})).toBe('needs_recovery')
  expect(practiceStatus(units[0],{...done,dialogue:['','']})).toBe('in_progress')
  expect(practiceStatus(units[0],{...done,mediation:''})).toBe('in_progress')
  expect(practiceStatus(units[0],{...done,checks:[false,true]})).toBe('needs_recovery')
  expect(practiceStatus(units[0],{...done,today:{...done.today!,firstChoice:(units[0].lesson.answer+1)%3}})).toBe('needs_recovery')
 })
 it('preserves old responses but does not treat them as completion of new requirements',()=>{
  const unit=PRACTICE_UNITS[0],{dialogue,transfer,...old}=finished(unit.lesson.id);void dialogue;void transfer
  const restored=restorePracticeRecords(JSON.stringify({version:1,records:{[unit.lesson.id]:old,[PRACTICE_UNITS[1].lesson.id]:{broken:true}}}))
  expect(restored[unit.lesson.id].interaction).toBe(old.interaction)
  expect(restored[unit.lesson.id].completedAt).toBe(old.completedAt)
  expect(practiceStatus(unit,restored[unit.lesson.id])).toBe('in_progress')
  expect(Object.keys(restored)).toHaveLength(1)
 })
 it('restores only known matching tasks and rejects damaged/oversized local data',()=>{
  const id=PRACTICE_UNITS[0].lesson.id,record=finished(id)
  expect(restorePracticeRecords(JSON.stringify({version:1,records:{[id]:record,unknown:record}}))).toEqual({[id]:record})
  expect(restorePracticeRecords(JSON.stringify({version:1,records:{[id]:{...record,today:{...record.today,lessonId:'other'}}}}))).toEqual({})
  expect(restorePracticeRecords('{')).toEqual({})
  expect(restorePracticeRecords(JSON.stringify({version:1,records:{[id]:{...record,mediation:'x'.repeat(6001)}}}))).toEqual({})
 })
})
