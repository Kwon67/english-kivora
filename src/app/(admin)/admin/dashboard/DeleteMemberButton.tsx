'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteMember } from '@/app/actions'

export default function DeleteMemberButton({
  userId,
  username,
}: {
  userId: string
  username: string
}) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handle = async () => {
    if (!window.confirm(`Tem certeza que deseja remover "${username}"? Todos os dados e assignments do membro serão apagados.`)) return
    setPending(true)
    setError(null)
    try {
      const res = await deleteMember(userId)
      if (res?.error) setError(res.error)
    } catch {
      setError('Erro inesperado')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="button"
        onClick={handle}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
        title={`Remover ${username}`}
      >
        <Trash2 className="h-3.5 w-3.5" strokeWidth={2.2} />
        {pending ? 'Removendo…' : 'Remover'}
      </button>
    </div>
  )
}
