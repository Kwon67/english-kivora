'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { deleteMember } from '@/app/actions'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { dangerBtn } from '@/features/admin/lib/adminUi'
import { notify } from '@/lib/toast'

export default function DeleteMemberButton({
  userId,
  username,
  buttonClassName = dangerBtn,
  iconOnly = false,
}: {
  userId: string
  username: string
  buttonClassName?: string
  iconOnly?: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const handleConfirm = async () => {
    setConfirmOpen(false)
    setPending(true)
    setError(null)
    try {
      const res = await deleteMember(userId)
      if (res?.error) {
        notify.error('Verifique os campos')
        setError(res.error)
      } else if (res?.success) {
        notify.success('Membro removido.')
        if (pathname === `/admin/members/${userId}`) router.replace('/admin/members')
        else router.refresh()
      }
    } catch {
      notify.error('Verifique os campos')
      setError('Erro inesperado')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {error && (
        <p role="alert" className="font-body text-xs font-semibold text-error">{error}</p>
      )}
      <button
        type="button"
        onClick={(event) => { event.currentTarget.focus(); setConfirmOpen(true) }}
        disabled={pending}
        className={`${buttonClassName} ${iconOnly ? 'px-2 py-2' : 'px-3 py-1.5 text-xs'}`}
        title={`Remover ${username}`}
      >
        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
        {iconOnly ? <span className="sr-only">{pending ? 'Removendo…' : 'Remover'}</span> : pending ? 'Removendo…' : 'Remover'}
      </button>
      {confirmOpen && (
        <ConfirmDialog
          title="Remover membro"
          description={`Tem certeza que deseja remover "${username}"? Os dados e as atribuições do membro serão apagados. Esta ação não pode ser desfeita.`}
          confirmLabel="Remover"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  )
}
