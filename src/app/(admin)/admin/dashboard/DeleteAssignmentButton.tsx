'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteAssignment } from '@/app/actions'

export default function DeleteAssignmentButton({
  assignmentId,
  username,
  packName,
}: {
  assignmentId: string
  username?: string
  packName?: string
}) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    const assignmentLabel =
      [packName ? `"${packName}"` : null, username ? `de ${username}` : null]
        .filter(Boolean)
        .join(' ') || 'esta tarefa'

    if (
      !window.confirm(
        `Tem certeza que deseja remover ${assignmentLabel}? O progresso relacionado também será apagado e isso não pode ser desfeito.`
      )
    ) {
      return
    }

    setPending(true)
    setError(null)

    try {
      const result = await deleteAssignment(assignmentId)
      if (result?.error) {
        setError(result.error)
      }
    } catch (deleteError) {
      console.error('Failed to delete assignment:', deleteError)
      setError('Erro ao remover a tarefa.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
        title="Excluir atribuição"
      >
        <Trash2 className="h-3.5 w-3.5" strokeWidth={2.2} />
        {pending ? 'Excluindo…' : 'Excluir'}
      </button>
    </div>
  )
}
