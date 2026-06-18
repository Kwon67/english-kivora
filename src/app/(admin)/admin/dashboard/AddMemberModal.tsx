'use client'

import { useEffect, useState, useRef } from 'react'
import { Plus, X, Eye, EyeOff } from 'lucide-react'
import { createMember } from '@/app/actions'
import ModalPortal from '@/components/ui/ModalPortal'

export default function AddMemberModal() {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const previousActiveElement = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    firstFocusable?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
        return
      }

      if (event.key !== 'Tab') return

      const focusableElements = Array.from(
        modalRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      )
      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
        return
      }

      if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previousActiveElement?.focus()
    }
  }, [open])

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
        className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm"
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
        Adicionar membro
      </button>

      {open && (
        <ModalPortal onClose={() => setOpen(false)}>
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-member-title"
            className="premium-card relative my-auto w-full max-w-sm overflow-hidden shadow-[var(--shadow-xl)]"
          >
            <div className="flex items-center justify-between border-b border-border bg-[var(--color-surface-container-low)] px-6 py-4">
              <div>
                <p className="section-kicker">Novo acesso</p>
                <h2 id="add-member-title" className="mt-2 text-lg font-bold text-text">Novo membro</h2>
                <p className="text-xs text-text-muted">O email será gerado automaticamente</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-text-subtle transition-colors hover:bg-[var(--color-surface-container)] hover:text-text"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="hidden"
            >
              <X className="h-5 w-5" />
            </button>

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="new-username" className="mb-1 block text-sm font-medium text-text-muted">
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
                  className="field w-full text-sm"
                />
                <p className="mt-1 text-xs text-text-subtle">Só letras minúsculas, números e _</p>
              </div>

              <div>
                <label htmlFor="new-password" className="mb-1 block text-sm font-medium text-text-muted">
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
                    className="field w-full pr-10 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-subtle hover:text-text"
                    aria-label={showPass ? 'Esconder senha' : 'Mostrar senha'}
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="rounded-[0.85rem] border border-[var(--color-error)]/20 bg-[var(--color-error)]/10 px-3 py-2 text-xs font-medium text-[var(--color-error)]">{error}</p>
              )}
              {success && (
                <p className="rounded-[0.85rem] border border-[var(--color-primary-light)] bg-primary-light px-3 py-2 text-xs font-medium text-primary">Membro criado com sucesso.</p>
              )}

              <button
                type="submit"
                disabled={pending}
                className="btn-primary w-full py-2.5 text-sm disabled:opacity-60"
              >
                {pending ? 'Criando…' : 'Criar membro'}
              </button>
            </form>
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  )
}