import { expect, it } from 'vitest'
import { studyReturnPath } from './studyReturnPath'

it('retoma a atividade com os filtros usados pela página', () => {
  expect(studyReturnPath('/today?unit=travel&unused=private')).toBe('/today?unit=travel')
  expect(studyReturnPath('/tutor/meet-and-greet')).toBe('/tutor/meet-and-greet')
  const id = 'abcabcab-abcd-4aaa-8aaa-abcdef123456'
  expect(studyReturnPath('/review?source=problem&mode=guided&cards=' + id)).toBe('/review?mode=guided&source=problem&cards=' + id)
  expect(studyReturnPath('/history?date=2026-03-31')).toBe('/history?date=2026-03-31')
})
it('descarta destinos externos, administrativos ou inválidos', () => {
  for (const value of [undefined, ['a'], 'https://example.test', '//example.test', '/admin', '/tutor/../login', '/login']) expect(studyReturnPath(value)).toBeNull()
})
