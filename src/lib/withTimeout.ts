export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  fallback: T
): Promise<T> {
  const timeoutPromise = new Promise<T>((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms)
    if (typeof timer === 'object' && 'unref' in timer) {
      timer.unref?.()
    }
  })

  return Promise.race([promise, timeoutPromise])
}