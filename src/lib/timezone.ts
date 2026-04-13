export const APP_TIME_ZONE = 'America/Sao_Paulo'

function getDateParts(input: Date | string | number = new Date()) {
  const date = input instanceof Date ? input : new Date(input)

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })

  const parts = formatter.formatToParts(date)
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return {
    year: map.year,
    month: map.month,
    day: map.day,
    hour: map.hour,
    minute: map.minute,
    second: map.second,
  }
}

export function getAppDateString(input: Date | string | number = new Date()) {
  const parts = getDateParts(input)
  return `${parts.year}-${parts.month}-${parts.day}`
}

export function shiftAppDate(dateString: string, days: number) {
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() + days)

  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}

export function getAppDayStartUtcIso(dateString: string) {
  return new Date(`${dateString}T00:00:00-03:00`).toISOString()
}

export function formatAppDate(
  input: Date | string | number,
  options?: Intl.DateTimeFormatOptions
) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: APP_TIME_ZONE,
    ...options,
  }).format(input instanceof Date ? input : new Date(input))
}

export function formatAppTime(
  input: Date | string | number,
  options?: Intl.DateTimeFormatOptions
) {
  return formatAppDate(input, {
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  })
}

export function formatAppDateTime(
  input: Date | string | number,
  options?: Intl.DateTimeFormatOptions
) {
  return formatAppDate(input, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  })
}

export function getAppTimeString(input: Date | string | number = new Date()) {
  const parts = getDateParts(input)
  return `${parts.hour}:${parts.minute}:${parts.second}`
}

export function getAppWeekday(input: Date | string | number = new Date()) {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIME_ZONE,
    weekday: 'short',
  }).format(input instanceof Date ? input : new Date(input))

  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  }

  return map[weekday] ?? 0
}
