import { redirect } from 'next/navigation'

/**
 * A "Rotina" deixou de existir: o histórico e a próxima lição agora são a trilha de bolinhas do
 * Início. A rota fica só como redirecionamento, para favoritos, atalhos do PWA e e-mails antigos
 * que ainda apontam para /study.
 */
export default function StudyPage() {
  redirect('/home#trilha')
}
