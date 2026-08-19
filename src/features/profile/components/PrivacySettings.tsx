'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Loader2, ShieldAlert, Trash2 } from 'lucide-react'
import { deleteAccountAction, exportUserDataAction } from '@/app/privacy-actions'
import { notify } from '@/lib/toast'
import { landingRadius } from '@/lib/landingStyles'
import {
  settingsCard,
  settingsSoftBtn,
  settingsTile,
} from '@/features/profile/lib/settingsPageUi'

const CONFIRM_WORD = 'EXCLUIR'

/**
 * LGPD Art. 18 controls. Deletion is destructive and irreversible, so it asks for the word to
 * be typed rather than relying on a single click, and the button stays disabled until it matches.
 */
export default function PrivacySettings() {
  const router = useRouter()
  const [isExporting, startExport] = useTransition()
  const [isDeleting, startDelete] = useTransition()
  const [confirmation, setConfirmation] = useState('')
  const [showDelete, setShowDelete] = useState(false)

  const canDelete = confirmation.trim().toUpperCase() === CONFIRM_WORD

  function handleExport() {
    startExport(async () => {
      const result = await exportUserDataAction()
      if (!result.success) {
        notify.error(result.error)
        return
      }

      // Built and downloaded in the browser so the payload never has to round-trip through a
      // storage bucket or an emailed link.
      const blob = new Blob([JSON.stringify(result.export, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `kivora-meus-dados-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)

      if (result.export.incomplete.length > 0) {
        notify.error('Exportação parcial', {
          description: `Não foi possível ler: ${result.export.incomplete.join(', ')}. Fale com o suporte.`,
        })
        return
      }

      notify.success('Exportação concluída', { description: 'O arquivo foi baixado.' })
    })
  }

  function handleDelete() {
    startDelete(async () => {
      const result = await deleteAccountAction(confirmation)
      if (!result.success) {
        notify.error(result.error)
        return
      }

      notify.success('Conta excluída')
      router.replace('/')
    })
  }

  return (
    <section className={`${settingsCard} p-5 sm:p-6`} aria-labelledby="privacy-settings-title">
      <h2 id="privacy-settings-title" className="font-heading text-lg font-bold text-brand-dark">
        Seus dados
      </h2>
      <p className="mt-2 font-body text-sm leading-relaxed text-brand-secondary">
        Você pode levar seus dados embora ou apagar sua conta quando quiser.
      </p>

      <div className={`${settingsTile} mt-5`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="font-heading text-sm font-bold text-brand-dark">Exportar meus dados</p>
            <p className="mt-1 font-body text-sm leading-relaxed text-brand-secondary">
              Baixe um arquivo JSON com seu perfil, rotina, revisões e histórico.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className={`${settingsSoftBtn} w-full shrink-0 disabled:opacity-60 sm:w-auto`}
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {isExporting ? 'Preparando' : 'Exportar'}
          </button>
        </div>
      </div>

      <div className={`${settingsTile} mt-3 border-[var(--color-error)]/30`}>
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-error)]" strokeWidth={2.2} />
          <div className="min-w-0 flex-1">
            <p className="font-heading text-sm font-bold text-brand-dark">Excluir minha conta</p>
            <p className="mt-1 font-body text-sm leading-relaxed text-brand-secondary">
              Apaga permanentemente seu perfil, rotina, revisões e progresso. Não dá para desfazer.
            </p>

            {showDelete ? (
              <div className="mt-4">
                <label
                  htmlFor="delete-confirmation"
                  className="block font-body text-xs font-semibold text-brand-secondary"
                >
                  Digite <span className="font-bold text-brand-dark">{CONFIRM_WORD}</span> para confirmar
                </label>
                <input
                  id="delete-confirmation"
                  type="text"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  autoComplete="off"
                  className={`mt-2 min-h-11 w-full ${landingRadius} border border-brand-dark bg-bg-primary px-4 font-body text-sm text-brand-dark outline-none focus:bg-white`}
                />

                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={!canDelete || isDeleting}
                    className={`${settingsSoftBtn} w-full border-[var(--color-error)]/40 text-[var(--color-error)] hover:bg-red-500/10 disabled:opacity-50 sm:w-auto`}
                  >
                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    Excluir permanentemente
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDelete(false)
                      setConfirmation('')
                    }}
                    disabled={isDeleting}
                    className={`${settingsSoftBtn} w-full disabled:opacity-60 sm:w-auto`}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowDelete(true)}
                className={`${settingsSoftBtn} mt-4 w-full border-[var(--color-error)]/40 text-[var(--color-error)] hover:bg-red-500/10 sm:w-auto`}
              >
                <Trash2 className="h-4 w-4" />
                Excluir conta
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
