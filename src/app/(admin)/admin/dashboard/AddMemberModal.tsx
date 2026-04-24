'use client'

import { useState, useRef } from 'react'
import { Plus, X, UserPlus, Eye, EyeOff } from 'lucide-react'
import { createMember } from '@/app/actions'

export default function AddMemberModal() {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPending(true)
    setError(null)
    setSuccess(false)

    const formData = new FormData(e.currentTarget)
    try {
      const res = await createMember(formData)
      if (res?.error) {
        setError(res.error)
      } else {
        setSuccess(true)
        formRef.current?.reset()
        setTimeout(() => {
          setOpen(false)
          setSuccess(false)
        }, 1200)
      }
    } catch {
      setError('Erro inesperado no servidor')
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); setError(null); setSuccess(false) }}
        className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
        Adicionar membro
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="relative w-full max-w-sm rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-xl)]">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-[var(--color-text-subtle)] hover:bg-[var(--color-surface-container-low)] hover:text-[var(--color-text)] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                <UserPlus className="h-5 w-5" strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-text)]">Novo membro</h2>
                <p className="text-xs text-[var(--color-text-muted)]">O email será gerado automaticamente</p>
              </div>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="new-username" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                  Nome de usuário
                </label>
                <input
                  id="new-username"
                  name="username"
                  type="text"
                  required
                  minLength={3}
                  pattern="[a-z0-9_]+"
                  placeholder="ex: joao_silva"
                  autoComplete="off"
                  className="w-full rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface-container-low)] px-4 py-2.5 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
                />
                <p className="mt-1 text-[11px] text-[var(--color-text-subtle)]">Só letras minúsculas, números e _</p>
              </div>

              <div>
                <label htmlFor="new-password" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    name="password"
                    type={showPass ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                    autoComplete="new-password"
                    className="w-full rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface-container-low)] px-4 py-2.5 pr-10 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="rounded-[10px] bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>
              )}
              {success && (
                <p className="rounded-[10px] bg-[rgba(43,122,11,0.10)] px-3 py-2 text-xs font-medium text-[var(--color-primary)]">✓ Membro criado com sucesso!</p>
              )}

              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-[14px] bg-[var(--color-primary)] py-2.5 text-sm font-semibold text-[var(--color-on-primary)] shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {pending ? 'Criando…' : 'Criar membro'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
