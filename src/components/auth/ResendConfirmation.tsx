'use client'

import { useRef, useState, type FormEvent } from 'react'
import { resendSignupConfirmation } from '@/app/signup-actions'
import HydratedAuthForm from './HydratedAuthForm'
import { authInput } from '@/lib/brandUi'

export default function ResendConfirmation({ email }: { email?: string }) {
  const inFlight = useRef(false)
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (inFlight.current) return
    const address = email ?? String(new FormData(event.currentTarget).get('email') ?? '')
    inFlight.current = true
    setSending(true)
    setStatus(null)
    try {
      const result = await resendSignupConfirmation(address)
      setStatus(result.ok
        ? { ok: true, text: 'Se a conta aguarda confirmação, você receberá um novo link. Confira também o spam.' }
        : { ok: false, text: result.error })
    } catch {
      setStatus({ ok: false, text: 'Verifique a conexão e tente solicitar o link novamente.' })
    } finally {
      inFlight.current = false
      setSending(false)
    }
  }

  return <HydratedAuthForm onSubmit={submit} className="grid w-full gap-3">
    {!email && <label className="grid w-full gap-2">E-mail do cadastro
      <input className={authInput} type="email" autoComplete="email" name="email" required maxLength={254} />
    </label>}
    <button className="product-text-link min-h-11" type="submit" disabled={sending}>
      {sending ? 'Solicitando…' : 'Reenviar link de confirmação'}
    </button>
    {status && <p role={status.ok ? 'status' : 'alert'}>{status.text}</p>}
  </HydratedAuthForm>
}
