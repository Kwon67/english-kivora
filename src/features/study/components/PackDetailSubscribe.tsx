'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Plus } from 'lucide-react'
import AssignPackModal from '@/features/study/components/AssignPackModal'

const primaryBtn =
  'inline-flex w-full items-center justify-center gap-2 rounded-lg border-2 border-brand-dark bg-brand-dark py-4 font-body text-base font-semibold text-white shadow-[3px_3px_0_var(--color-brand-accent)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] active:scale-[0.985]'

type PackDetailSubscribeProps = {
  packId: string
  packName: string
  isSubscribed: boolean
}

export default function PackDetailSubscribe({
  packId,
  packName,
  isSubscribed,
}: PackDetailSubscribeProps) {
  const [modalOpen, setModalOpen] = useState(false)

  if (isSubscribed) {
    return (
      <div className="rounded-xl border-2 border-brand-dark bg-brand-accent p-4 text-center shadow-[3px_3px_0_var(--color-brand-dark)]">
        <p className="flex items-center justify-center gap-2 font-body text-xs font-semibold text-brand-dark">
          <Check className="h-4 w-4" />
          Pronto para estudar!
        </p>
        <Link
          href="/study"
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border-2 border-brand-dark bg-bg-card px-4 py-2 font-body text-xs font-semibold text-brand-dark transition-colors hover:bg-brand-dark hover:text-white"
        >
          Ver minha rotina
        </Link>
      </div>
    )
  }

  return (
    <>
      <button type="button" onClick={() => setModalOpen(true)} className={primaryBtn}>
        <Plus className="h-5 w-5" />
        Adicionar à rotina
      </button>
      <AssignPackModal
        packId={packId}
        packName={packName}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  )
}
