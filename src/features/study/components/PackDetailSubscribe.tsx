'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Plus } from 'lucide-react'
import AssignPackModal from '@/features/study/components/AssignPackModal'
import { homeCardButton, homePrimaryButton, homeNestedCardClass } from '@/lib/homeStyles'

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
      <div className={`${homeNestedCardClass} bg-brand-accent-soft p-4 text-center`}>
        <p className="flex items-center justify-center gap-2 font-body text-sm font-semibold text-brand-dark">
          <Check className="h-4 w-4" />
          Adicionado à rotina
        </p>
        <Link href="/study" className={`mt-3 w-full ${homeCardButton}`}>
          Ver minha rotina
        </Link>
      </div>
    )
  }

  return (
    <>
      <button type="button" onClick={() => setModalOpen(true)} className={`w-full ${homePrimaryButton}`}>
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