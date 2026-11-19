type FactorList = {
  data: { all: { id: string; status: string }[] } | null
  error: { name?: string; status?: number } | null
}

type MfaState = { status: 'required'; factorId: string } | { status: 'clear' | 'signed-out' | 'unavailable' }

export async function readMfaState(load: () => Promise<FactorList>, timeoutMs = 3000): Promise<MfaState> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    const result = await Promise.race([
      load(),
      new Promise<null>(resolve => {
        timer = setTimeout(() => resolve(null), timeoutMs)
        timer.unref?.()
      }),
    ])
    if (result?.error?.name === 'AuthSessionMissingError' || result?.error?.status === 401) return { status: 'signed-out' }
    if (result?.error || !Array.isArray(result?.data?.all)) return { status: 'unavailable' }
    const factor = result.data.all.find(item => item.status === 'verified')
    return factor ? { status: 'required', factorId: factor.id } : { status: 'clear' }
  } catch {
    return { status: 'unavailable' }
  } finally {
    clearTimeout(timer)
  }
}
