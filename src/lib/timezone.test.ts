import { expect, it } from 'vitest'
import { appDateRange } from './timezone'

it('inclui a atividade à noite na data de São Paulo e exclui a próxima meia-noite', () => {
  const range = appDateRange('2026-11-18')
  expect(range).toEqual({ date: '2026-11-18', start: '2026-11-18T03:00:00.000Z', end: '2026-11-19T03:00:00.000Z' })
  expect(appDateRange('2024-02-29')?.end).toBe('2024-03-01T03:00:00.000Z')
})
it('ignora filtros de calendário impossíveis ou repetidos', () => {
  for (const date of [undefined, ['2026-03-01'], 'ontem', '2026-02-29', '2026-11-32']) expect(appDateRange(date)).toBeNull()
})
