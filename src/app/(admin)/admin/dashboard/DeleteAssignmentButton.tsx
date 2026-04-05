'use client'

import { Trash2 } from 'lucide-react'
import { deleteAssignment } from '@/app/actions'
import { useState } from 'react'

export default function DeleteAssignmentButton({ assignmentId }: { assignmentId: string }) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (window.confirm('Tem certeza que deseja remover esta tarefa? O progresso do aluno também será apagado e isso não pode ser desfeito.')) {
      setIsDeleting(true)
      try {
        await deleteAssignment(assignmentId)
      } catch (error) {
        console.error('Failed to delete assignment:', error)
        alert('Erro ao remover a tarefa.')
      } finally {
        setIsDeleting(false)
      }
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
      title="Remover Tarefa"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  )
}
