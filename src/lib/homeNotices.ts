export type HomeNoticeType = 'success' | 'error'

export const HOME_NOTICE_MESSAGES: Record<string, { message: string; type: HomeNoticeType }> = {
  assignment_completed: { message: 'Essa atividade já foi concluída.', type: 'error' },
  assignment_not_found: { message: 'Atividade não encontrada ou removida.', type: 'error' },
  assignment_error: { message: 'Não foi possível abrir essa atividade.', type: 'error' },
}

export function homeNoticeRedirect(notice: keyof typeof HOME_NOTICE_MESSAGES) {
  return `/home?notice=${notice}`
}
