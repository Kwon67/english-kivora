import { z } from 'zod'

type Receipt = { key: string; receipt: string | null; credits: number | null }

export function receiptTotals(jobs: Receipt[], voices: Map<string, string>, spent: number) {
  const ids = new Set<string>()
  const totals = new Map<string, number>()
  for (const job of jobs) {
    const name = voices.get(job.key)
    if (
      !name ||
      !job.receipt ||
      ids.has(job.receipt) ||
      job.credits === null ||
      !Number.isSafeInteger(job.credits) ||
      job.credits < 0
    )
      throw Error('Recibo pendente ou divergente.')
    ids.add(job.receipt)
    totals.set(name, (totals.get(name) ?? 0) + job.credits)
  }
  if ([...totals.values()].reduce((n, charge) => n + charge, 0) !== spent)
    throw Error('Total de recibos divergente.')
  return totals
}

const usageSchema = z.record(z.string(), z.array(z.number().int().nonnegative()))
export function matchesUsage(costs: Map<string, number>, usage: unknown) {
  const totals = new Map(costs)
  for (const [name, buckets] of Object.entries(usageSchema.parse(usage))) {
    const sum = buckets.reduce((n, charge) => n + charge, 0)
    if (sum !== (totals.get(name) ?? 0)) return false
    totals.delete(name)
  }
  return [...totals.values()].every((sum) => sum === 0)
}
