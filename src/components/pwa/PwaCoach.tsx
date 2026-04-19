'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff, Download, Share2, Smartphone } from 'lucide-react'
import { getPushPermissionConfig, removePushSubscription, savePushSubscription } from '@/app/pwa/actions'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

export default function PwaCoach({
  dueCount,
  pendingCount,
}: {
  dueCount: number
  pendingCount: number
}) {
  const [isSupported, setIsSupported] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    const ios = /iPad|iPhone|iPod/.test(window.navigator.userAgent)
    const pushSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

    setIsStandalone(standalone)
    setIsIOS(ios)
    setIsSupported(pushSupported)
    setPermission(pushSupported ? Notification.permission : 'default')

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }

    async function bootstrapPushState() {
      if (!pushSupported) return

      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      })

      const currentSubscription = await registration.pushManager.getSubscription()
      setSubscription(currentSubscription)
    }

    void bootstrapPushState()
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  async function handleInstall() {
    if (!installPrompt) return

    await installPrompt.prompt()
    await installPrompt.userChoice
    setInstallPrompt(null)
  }

  async function handleEnableNotifications() {
    if (!isSupported) return

    setBusy(true)
    setMessage(null)

    try {
      const permissionResult = await Notification.requestPermission()
      setPermission(permissionResult)

      if (permissionResult !== 'granted') {
        setMessage('Permissão recusada. Você pode ativar depois nas configurações do navegador.')
        return
      }

      const registration = await navigator.serviceWorker.ready
      const existingSubscription = await registration.pushManager.getSubscription()
      const currentSubscription = existingSubscription || await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array((await getPushPermissionConfig()).vapidPublicKey),
      })

      await savePushSubscription(
        JSON.parse(JSON.stringify(currentSubscription)) as {
          endpoint: string
          keys: { p256dh: string; auth: string }
          expirationTime?: number | null
        },
        navigator.userAgent
      )

      setSubscription(currentSubscription)
      setMessage(
        dueCount > 0
          ? `Notificações ativas. Você será avisado quando houver revisões vencidas como as ${dueCount} de agora.`
          : pendingCount > 0
            ? `Notificações ativas. Quando surgirem revisões ou lições pendentes, o app chama você de volta.`
            : 'Notificações ativas. Quando surgirem revisões vencidas, o app chama você de volta.'
      )
    } catch (error) {
      console.error('Erro ao ativar notificações push:', error)
      setMessage('Falha ao ativar notificações. Verifique se o app está instalado e tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDisableNotifications() {
    if (!subscription) return

    setBusy(true)
    setMessage(null)

    try {
      await removePushSubscription(subscription.endpoint)
      await subscription.unsubscribe().catch(() => undefined)
      setSubscription(null)
      setMessage('Notificações desativadas neste aparelho.')
    } catch (error) {
      console.error('Erro ao remover notificações push:', error)
      setMessage('Falha ao remover a assinatura de notificações.')
    } finally {
      setBusy(false)
    }
  }

  if (!isSupported && !installPrompt && !isIOS) {
    return null
  }

  const shouldShowInstallCard = !isStandalone && (Boolean(installPrompt) || isIOS)
  const shouldShowPushCard = isSupported
  const needsInstallForIOSPush = isIOS && !isStandalone

  if (!shouldShowInstallCard && !shouldShowPushCard) {
    return null
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
      {shouldShowInstallCard && (
        <div className="card animate-slide-up overflow-hidden p-6 sm:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] bg-slate-100 text-[var(--color-text)]">
              <Smartphone className="h-7 w-7" strokeWidth={1.9} />
            </div>
            <div>
              <p className="section-kicker">Instale no celular</p>
              <h2 className="mt-3 text-2xl font-semibold text-[var(--color-text)]">
                Coloque o Kivora na home screen do aluno.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
                Abrir como app reduz fricção e libera push no iPhone instalado.
              </p>
            </div>
          </div>

          {installPrompt ? (
            <button type="button" onClick={handleInstall} className="btn-primary mt-6">
              <Download className="h-4 w-4" strokeWidth={2} />
              Instalar app
            </button>
          ) : (
            <div className="mt-6 rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface-container)] p-4">
              <p className="text-sm font-semibold text-[var(--color-text)]">
                No iPhone: Safari → Compartilhar → Adicionar à Tela de Início
              </p>
              <p className="mt-2 flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                <Share2 className="h-4 w-4" strokeWidth={2} />
                Instale primeiro para liberar notificações push no iOS.
              </p>
            </div>
          )}
        </div>
      )}

      {shouldShowPushCard && (
        <div className="card animate-slide-up overflow-hidden p-6 sm:p-7 transition-all hover:-translate-y-1 hover:shadow-xl hover:ring-2 hover:ring-indigo-500/20 hover:border-indigo-200" style={{ animationDelay: '80ms' }}>
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] bg-[var(--color-on-surface)] text-white">
              {subscription ? <Bell className="h-7 w-7" strokeWidth={1.9} /> : <BellOff className="h-7 w-7" strokeWidth={1.9} />}
            </div>
            <div>
              <p className="section-kicker">Push de revisão</p>
              <h2 className="mt-3 text-2xl font-semibold text-[var(--color-text)]">
                Avise quando a revisão vencer.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
                O sistema usa `next_review_date`, acompanha lições pendentes e evita disparo repetido quando a situação não mudou.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="surface-muted p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                Estado
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">
                {subscription ? 'Ativo neste aparelho' : permission === 'denied' ? 'Bloqueado no navegador' : 'Ainda não ativado'}
              </p>
            </div>
            <div className="surface-muted p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                Revisões agora
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">
                {dueCount > 0 ? `${dueCount} prontas para te chamar de volta` : 'Nenhuma vencida neste momento'}
              </p>
            </div>
            <div className="surface-muted p-4 sm:col-span-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                Offline
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">
                A home, revisão e a tela offline ficam disponíveis mesmo sem conexão estável.
              </p>
            </div>
          </div>

          {needsInstallForIOSPush ? (
            <p className="mt-6 text-sm font-semibold text-[var(--color-primary)]">
              Instale o app na tela inicial do iPhone para habilitar notificações push.
            </p>
          ) : subscription ? (
            <button type="button" onClick={handleDisableNotifications} disabled={busy} className="btn-ghost mt-6">
              <BellOff className="h-4 w-4" strokeWidth={2} />
              {busy ? 'Removendo...' : 'Desativar notificações'}
            </button>
          ) : (
            <button type="button" onClick={handleEnableNotifications} disabled={busy || permission === 'denied'} className="btn-primary mt-6">
              <Bell className="h-4 w-4" strokeWidth={2} />
              {busy ? 'Ativando...' : 'Ativar notificações'}
            </button>
          )}

          {message && (
            <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-muted)]">
              {message}
            </p>
          )}
        </div>
      )}
    </section>
  )
}
