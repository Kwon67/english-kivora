const DAY_MS = 24 * 60 * 60 * 1000

function addUtcMonthsClamped(date: Date, months: number) {
  const target = new Date(date)
  const originalDay = target.getUTCDate()
  target.setUTCDate(1)
  target.setUTCMonth(target.getUTCMonth() + months)
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate()
  target.setUTCDate(Math.min(originalDay, lastDay))
  return target
}

export function getNextBillingPeriod(value: string, frequency: string | null) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  switch (frequency) {
    case 'WEEKLY':
      return new Date(date.getTime() + 7 * DAY_MS).toISOString()
    case 'SEMIANNUALLY':
      return addUtcMonthsClamped(date, 6).toISOString()
    case 'ANNUALLY':
    case 'YEARLY':
      return addUtcMonthsClamped(date, 12).toISOString()
    case 'MONTHLY':
    default:
      return addUtcMonthsClamped(date, 1).toISOString()
  }
}

