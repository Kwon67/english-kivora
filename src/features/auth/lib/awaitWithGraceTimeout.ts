type TimedResult<T> =
  | { kind: 'completed'; value: T }
  | { kind: 'timedOut' }

export async function awaitWithGraceTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  graceMs: number,
  buildTimeoutError: () => T
): Promise<T> {
  let completed = false
  let completedValue: T | undefined

  const trackedPromise = promise.then((value) => {
    completed = true
    completedValue = value
    return { kind: 'completed', value } satisfies TimedResult<T>
  })

  const timeoutResult = await Promise.race([
    trackedPromise,
    new Promise<TimedResult<T>>((resolve) => {
      const timer = setTimeout(() => resolve({ kind: 'timedOut' }), timeoutMs)
      if (timer.unref) timer.unref()
    }),
  ])

  if (timeoutResult.kind === 'completed') {
    return timeoutResult.value
  }

  if (completed && completedValue !== undefined) {
    return completedValue
  }

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        const timer = setTimeout(() => reject(new Error('grace-timeout')), graceMs)
        if (timer.unref) timer.unref()
      }),
    ])
  } catch {
    return buildTimeoutError()
  }
}