'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { authInput, authSubmitBtn } from '@/lib/brandUi'
import { finishRecovery } from '../recovery/actions'

export default function NewPasswordForm({ hasTicket }: { hasTicket: boolean }) {
  const [message, action, pending] = useActionState(finishRecovery, '')
  if (message === 'ok') return <p role="status">Senha atualizada. <Link href="/login">Entrar no Kivora</Link></p>
  if (!hasTicket) return <div className="grid gap-3">
    <p role="alert">{message || 'Link inválido ou expirado.'}</p>
    <Link href="/forgot-password">Solicitar outro link</Link>
    <Link href="/login">Voltar ao login</Link>
  </div>
  return <form action={action} className="grid w-full max-w-96 gap-4">
    <label>Nova senha (mínimo de 12 caracteres)
      <input name="password" type="password" autoComplete="new-password" minLength={12} required className={authInput} />
    </label>
    <label>Confirme a nova senha
      <input name="confirmation" type="password" autoComplete="new-password" required className={authInput} />
    </label>
    {message && <p role="alert">{message}</p>}
    <button className={authSubmitBtn} disabled={pending}>{pending ? 'Salvando…' : 'Salvar nova senha'}</button>
    <Link href="/forgot-password">Solicitar outro link</Link>
  </form>
}
