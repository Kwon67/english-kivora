'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { BellRing } from 'lucide-react'
import {
  disablePushSubscriptionAction,
  syncPushSubscriptionAction,
} from '@/app/pwa-actions'
import { notify } from '@/lib/toast'
import SettingsSwitch from '@/features/profile/components/SettingsSwitch'
import { settingsNoteBox, settingsRow, settingsRowIcon } from '@/features/profile/lib/settingsPageUi'

type SerializedPushSubscription = {
  endpoint: string
  expirationTime?: number | null
  keys: {
    p256dh: string
    auth: string
  }
  userAgent?: string
}

type PushNotificationPreferenceProps = {
  publicVapidKey: string | null
}

function supportsPush(publicVapidKey: string | null) {
  return Boolean(
    publicVapidKey &&
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
  )
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = `${base64String}${padding}`.replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index)
  }

  return outputArray
}

function serializePushSubscription(subscription: PushSubscription): SerializedPushSubscription | null {
  const json = subscription.toJSON() as {
    endpoint?: string
    expirationTime?: number | null
    keys?: {
      p256dh?: string
      auth?: string
    }
  }

  const endpoint = json.endpoint || subscription.endpoint
  const p256dh = json.keys?.p256dh
  const auth = json.keys?.auth

  if (!endpoint || !p256dh || !auth) return null

  return {
    endpoint,
    expirationTime: json.expirationTime ?? subscription.expirationTime,
    keys: { p256dh, auth },
    userAgent: navigator.userAgent.slice(0, 512),
  }
}

export default function PushNotificationPreference({
  publicVapidKey,
}: PushNotificationPreferenceProps) {
  const [mounted, setMounted] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [isPending, startTransition] = useTransition()
  const canUsePush = useMemo(() => mounted && supportsPush(publicVapidKey), [mounted, publicVapidKey])

  useEffect(() => {
    let cancelled = false

    async function loadSubscription() {
      setMounted(true)

      if (!supportsPush(publicVapidKey)) return

      setPermission(Notification.permission)

      try {
        const registration = await navigator.serviceWorker.ready
        const currentSubscription = await registration.pushManager.getSubscription()

        if (cancelled) return

        setSubscription(currentSubscription)
        setEnabled(Boolean(currentSubscription && Notification.permission === 'granted'))
      } catch {
        if (!cancelled) {
          setSubscription(null)
          setEnabled(false)
        }
      }
    }

    void loadSubscription()

    return () => {
      cancelled = true
    }
  }, [publicVapidKey])

  function enablePush() {
    if (!publicVapidKey || !canUsePush) {
      notify.error('Lembretes não estão disponíveis neste navegador.')
      return
    }

    startTransition(async () => {
      try {
        const nextPermission = await Notification.requestPermission()
        setPermission(nextPermission)

        if (nextPermission !== 'granted') {
          setEnabled(false)
          notify.error('Permissão de notificações não foi concedida.')
          return
        }

        const registration = await navigator.serviceWorker.ready
        let nextSubscription = await registration.pushManager.getSubscription()

        if (!nextSubscription) {
          nextSubscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
          })
        }

        const serialized = serializePushSubscription(nextSubscription)
        if (!serialized) {
          setEnabled(false)
          notify.error('Não foi possível preparar os lembretes.')
          return
        }

        const result = await syncPushSubscriptionAction(serialized)
        if (!result.success) {
          setEnabled(false)
          notify.error(result.error || 'Não foi possível ativar os lembretes.')
          return
        }

        setSubscription(nextSubscription)
        setEnabled(true)
        notify.success('Lembretes de revisão ativados.')
      } catch {
        setEnabled(false)
        notify.error('Não foi possível ativar os lembretes agora.')
      }
    })
  }

  function disablePush() {
    if (!subscription) {
      setEnabled(false)
      return
    }

    const endpoint = subscription.endpoint
    setEnabled(false)

    startTransition(async () => {
      const result = await disablePushSubscriptionAction(endpoint)

      if (!result.success) {
        setEnabled(true)
        notify.error(result.error || 'Não foi possível desativar os lembretes.')
        return
      }

      try {
        await subscription.unsubscribe()
      } catch {
        // Browser state can already be cleared; server preference is the source of truth.
      }

      setSubscription(null)
      notify.success('Lembretes de revisão desativados.')
    })
  }

  function handleToggle() {
    if (enabled) {
      disablePush()
      return
    }

    enablePush()
  }

  const unavailable = mounted && !canUsePush
  const blocked = permission === 'denied'

  return (
    <div>
      <div className={settingsRow}>
        <span className={settingsRowIcon}>
          <BellRing className="h-4 w-4 shrink-0" strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-heading text-sm font-bold text-brand-dark">Lembretes push</p>
          <p className="mt-0.5 font-body text-xs leading-relaxed text-brand-secondary">
            Avisos no dispositivo: revisão vencida ou sequência em risco.
          </p>
        </div>

        <SettingsSwitch
          checked={enabled}
          onChange={handleToggle}
          pending={isPending}
          disabled={unavailable || blocked}
          aria-label="Receber lembretes de revisão"
        />
      </div>

      {unavailable || blocked ? (
        <div className={`${settingsNoteBox} mx-4 mb-4 sm:mx-5`}>
          <p className="font-body text-xs leading-relaxed text-brand-secondary">
            {blocked
              ? 'As notificações estão bloqueadas no navegador. Libere a permissão nas configurações do site para ativar.'
              : 'Este navegador ainda não oferece suporte aos lembretes push do Kivora.'}
          </p>
        </div>
      ) : null}
    </div>
  )
}
