import { describe, expect, it } from 'vitest'
import { readReportPages } from './reportPagination'

describe('complete report data', () => {
  it('includes records after the API page limit', async () => {
    const population = Array.from({ length: 1001 }, (_, id) => ({ id }))
    const result = await readReportPages(async (from, to) => ({ data: population.slice(from, to + 1), error: null }))
    expect(result.data).toHaveLength(1001)
    expect(result.data?.at(-1)?.id).toBe(1000)
  })
  it('does not present partial totals when a later page fails', async () => {
    const result = await readReportPages(async from => from === 0
      ? { data: Array.from({ length: 1000 }, (_, id) => ({ id })), error: null }
      : { data: null, error: { message: 'Network failure' } })
    expect(result).toEqual({ data: null, error: { message: 'Network failure' } })
  })
})
