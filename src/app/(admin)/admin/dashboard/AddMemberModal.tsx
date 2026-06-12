'use client'

import { useState, useRef } from 'react'
import { Plus, X, Eye, EyeOff } from 'lucide-react'
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
        className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
        Adicionar membro
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="relative w-full max-w-sm overflow-hidden rounded-[1rem] border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Novo membro</h2>
                <p className="text-xs text-gray-500">O email será gerado automaticamente</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
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
                <label htmlFor="new-username" className="mb-1 block text-sm font-medium text-gray-700">
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
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                />
                <p className="mt-1 text-xs text-gray-400">Só letras minúsculas, números e _</p>
              </div>

              <div>
                <label htmlFor="new-password" className="mb-1 block text-sm font-medium text-gray-700">
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
                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 pr-10 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500"
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
                <p className="rounded-md bg-green-50 px-3 py-2 text-xs font-medium text-green-700">Membro criado com sucesso.</p>
              )}

              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-md bg-green-600 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
              >
                {pending ? 'Criando…' : 'Criar membro'}
              </button>
            </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
