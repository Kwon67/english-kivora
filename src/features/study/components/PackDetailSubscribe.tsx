'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Plus } from 'lucide-react'
import AssignPackModal from '@/features/study/components/AssignPackModal'

const primaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-primary w-full py-4 text-base font-bold text-on-primary border border-dashed border-primary-container/50 shadow-[0px_8px_15px_0px_rgba(24,59,22,0.15)] transition-all hover:bg-primary-dark active:scale-[0.985]'

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
      <div className="rounded-xl border border-primary/15 dark:border-primary/15 bg-primary/5 p-4 text-center">
        <p className="text-xs font-bold text-primary flex items-center justify-center gap-2">
          <Check className="h-4 w-4" />
          Pronto para estudar!
        </p>
        <Link
          href="/study"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-dashed border-border-muted/22 dark:border-border-accent/20 bg-card dark:bg-card px-4 py-2 text-xs font-bold text-text-muted dark:text-text-muted shadow-sm transition-colors hover:bg-primary/10 dark:hover:bg-primary/10 hover:text-primary w-full mt-3"
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