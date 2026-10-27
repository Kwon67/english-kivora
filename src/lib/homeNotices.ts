export type HomeNoticeType = 'success' | 'error'

export const HOME_NOTICE_MESSAGES: Record<string, { message: string; type: HomeNoticeType }> = {
  assignment_completed: { message: 'Essa atividade já foi concluída.', type: 'error' },
  assignment_not_found: { message: 'Atividade não encontrada ou removida.', type: 'error' },
  assignment_error: { message: 'Não foi possível abrir essa atividade.', type: 'error' },
}

/** Query params that mean "the student just finished something — Home must not reuse the stale RSC payload". */
export const HOME_RESYNC_SEARCH_PARAMS = ['sessionComplete', 'reviewComplete'] as const

const HOME_RESYNC_STORAGE_KEY = 'kivora:home-resync'

export function homeNoticeRedirect(notice: keyof typeof HOME_NOTICE_MESSAGES) {
  return `/home?notice=${notice}`
}

export function markHomeNeedsResync() {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(HOME_RESYNC_STORAGE_KEY, '1')
  } catch {
    // Private mode / blocked storage: the query param on /home is the fallback.
  }
}

export function consumeHomeNeedsResync() {
  if (typeof sessionStorage === 'undefined') return false
  try {
    if (sessionStorage.getItem(HOME_RESYNC_STORAGE_KEY) !== '1') return false
    sessionStorage.removeItem(HOME_RESYNC_STORAGE_KEY)
    return true
  } catch {
    return false
  }
}
