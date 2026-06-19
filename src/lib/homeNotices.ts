export const HOME_NOTICE_MESSAGES: Record<string, string> = {
  assignment_completed: 'Essa atividade já foi concluída.',
  assignment_not_found: 'Atividade não encontrada ou removida.',
  assignment_error: 'Não foi possível abrir essa atividade.',

}

export function homeNoticeRedirect(notice: keyof typeof HOME_NOTICE_MESSAGES) {
  return `/home?notice=${notice}`
}