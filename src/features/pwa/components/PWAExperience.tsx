'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Download, RefreshCw, Wifi, WifiOff, X } from 'lucide-react';
import { syncPushSubscriptionAction } from '@/app/pwa-actions';
import { createClient } from '@/lib/supabase/client';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{outcome: 'accepted' | 'dismissed';platform: string;}>;
};

type SerializedPushSubscription = {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
};

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean;
};

const INSTALL_DISMISSED_KEY = 'kivora-pwa-install-dismissed';
const PUSH_DISMISSED_KEY = 'kivora-pwa-push-dismissed';

function isStandaloneDisplay() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as NavigatorWithStandalone).standalone === true);

}

function isIOSDevice() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

function serializePushSubscription(subscription: PushSubscription): SerializedPushSubscription | null {
  const json = subscription.toJSON() as {
    endpoint?: string;
    expirationTime?: number | null;
    keys?: {
      p256dh?: string;
      auth?: string;
    };
  };

  const endpoint = json.endpoint || subscription.endpoint;
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;

  if (!endpoint || !p256dh || !auth) return null;

  return {
    endpoint,
    expirationTime: json.expirationTime ?? subscription.expirationTime,
    keys: {
      p256dh,
      auth
    },
    userAgent: navigator.userAgent.slice(0, 512)
  };
}

function supportsPush(publicVapidKey: string | null) {
  return Boolean(
    publicVapidKey &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

type PWAExperienceProps = {
  publicVapidKey: string | null
  className?: string
}

export default function PWAExperience({ publicVapidKey, className }: PWAExperienceProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [wasRestored, setWasRestored] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installDismissed, setInstallDismissed] = useState(true);
  const [pushDismissed, setPushDismissed] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pendingUpdateReloadRef = useRef(false);

  const canUsePush = useMemo(() => mounted && supportsPush(publicVapidKey), [mounted, publicVapidKey]);

  const syncExistingPushSubscription = useCallback(async (serviceWorkerRegistration: ServiceWorkerRegistration) => {
    if (!publicVapidKey || !supportsPush(publicVapidKey) || Notification.permission !== 'granted') return;

    const subscription = await serviceWorkerRegistration.pushManager.getSubscription();
    if (!subscription) return;

    const serialized = serializePushSubscription(subscription);
    if (!serialized) return;

    await syncPushSubscriptionAction(serialized);
  }, [publicVapidKey]);

  useEffect(() => {
    document.documentElement.dataset.pwaReady = '1';
  }, []);

  useEffect(() => {
    setTimeout(() => {
      setMounted(true);
      setIsOnline(navigator.onLine);
      setIsStandalone(isStandaloneDisplay());
      setIsIOS(isIOSDevice());
      setInstallDismissed(localStorage.getItem(INSTALL_DISMISSED_KEY) === '1');
      setPushDismissed(localStorage.getItem(PUSH_DISMISSED_KEY) === '1');
    }, 0);

    if ('Notification' in window) {
      setTimeout(() => setNotificationPermission(Notification.permission), 0);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    root.classList.toggle('pwa-standalone', isStandalone);

    return () => {
      root.classList.remove('pwa-standalone');
    };
  }, [isStandalone, mounted]);

  useEffect(() => {
    if (!mounted) return;

    const marketingPaths = new Set(['/', '/register', '/forgot-password']);
    if (!marketingPaths.has(pathname)) return;

    let cancelled = false;

    let sessionTimedOut = false;
    const sessionTimeout = window.setTimeout(() => {
      sessionTimedOut = true;
    }, 4_000);

    void createClient()
      .auth.getSession()
      .then(({ data: { session } }) => {
        if (!cancelled && !sessionTimedOut && session) {
          window.location.replace('/home');
        }
      })
      .catch(() => undefined)
      .finally(() => {
        window.clearTimeout(sessionTimeout);
      });

    return () => {
      cancelled = true;
    };
  }, [mounted, pathname]);

  useEffect(() => {
    if (!mounted || !('serviceWorker' in navigator)) return;

    let cancelled = false;

    async function registerServiceWorker() {
      try {
        const serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none'
        });

        if (cancelled) return;

        setRegistration(serviceWorkerRegistration);

        if (serviceWorkerRegistration.waiting) {
          setWaitingWorker(serviceWorkerRegistration.waiting);
        }

        serviceWorkerRegistration.addEventListener('updatefound', () => {
          const installingWorker = serviceWorkerRegistration.installing;
          if (!installingWorker) return;

          installingWorker.addEventListener('statechange', () => {
            if (
            installingWorker.state === 'installed' &&
            navigator.serviceWorker.controller &&
            !cancelled)
            {
              setWaitingWorker(installingWorker);
            }
          });
        });

        void syncExistingPushSubscription(serviceWorkerRegistration).catch(() => undefined);
      } catch (serviceWorkerError) {
        console.error('Erro ao registrar service worker', serviceWorkerError);
      }
    }

    const handleControllerChange = () => {
      if (!pendingUpdateReloadRef.current) return;

      pendingUpdateReloadRef.current = false;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    const startRegistration = () => {
      void registerServiceWorker();
    };

    if (isStandaloneDisplay() && document.readyState !== 'complete') {
      window.addEventListener('load', startRegistration, { once: true });
    } else {
      startRegistration();
    }

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, [mounted, syncExistingPushSubscription]);

  useEffect(() => {
    if (!mounted) return;

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;

    let restoreTimer: ReturnType<typeof setTimeout> | null = null;

    const handleOffline = () => {
      setWasRestored(false);
      setIsOnline(false);
    };

    const handleOnline = () => {
      setIsOnline(true);
      setWasRestored(true);
      restoreTimer = setTimeout(() => setWasRestored(false), 3200);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      if (restoreTimer) clearTimeout(restoreTimer);
    };
  }, [mounted]);

  useEffect(() => {
    if (!registration || notificationPermission !== 'granted') return;

    void syncExistingPushSubscription(registration);
  }, [notificationPermission, registration, syncExistingPushSubscription]);

  const dismissInstallPrompt = useCallback(() => {
    localStorage.setItem(INSTALL_DISMISSED_KEY, '1');
    setInstallDismissed(true);
  }, []);

  const dismissPushPrompt = useCallback(() => {
    localStorage.setItem(PUSH_DISMISSED_KEY, '1');
    setPushDismissed(true);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!installPrompt) {
      dismissInstallPrompt();
      return;
    }

    setIsBusy(true);
    setError(null);

    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;

      if (choice.outcome === 'accepted') {
        dismissInstallPrompt();
      }

      setInstallPrompt(null);
    } finally {
      setIsBusy(false);
    }
  }, [dismissInstallPrompt, installPrompt]);

  const handleEnablePush = useCallback(async () => {
    if (!publicVapidKey || !canUsePush) return;

    setIsBusy(true);
    setError(null);

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission !== 'granted') {
        dismissPushPrompt();
        return;
      }

      const serviceWorkerRegistration = registration || (await navigator.serviceWorker.ready);
      let subscription = await serviceWorkerRegistration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await serviceWorkerRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });
      }

      const serialized = serializePushSubscription(subscription);
      if (!serialized) {
        setError('Não foi possível preparar os lembretes.');
        return;
      }

      const result = await syncPushSubscriptionAction(serialized);

      if (!result.success) {
        setError(result.error || 'Não foi possível ativar os lembretes.');
        return;
      }

      dismissPushPrompt();
    } catch (pushError) {
      console.error('Erro ao ativar push notifications', pushError);
      setError('Não foi possível ativar os lembretes agora.');
    } finally {
      setIsBusy(false);
    }
  }, [canUsePush, dismissPushPrompt, publicVapidKey, registration]);

  const handleApplyUpdate = useCallback(() => {
    pendingUpdateReloadRef.current = true;
    waitingWorker?.postMessage({ type: 'SKIP_WAITING' });
  }, [waitingWorker]);

  if (!mounted) return null;

  const canShowInstallPrompt = !isStandalone && !installDismissed && (Boolean(installPrompt) || isIOS);
  const canShowPushPrompt =
  pathname !== '/login' &&
  canUsePush &&
  notificationPermission === 'default' &&
  !pushDismissed;

  const notice =
  waitingWorker ?
  'update' :
  !isOnline ?
  'offline' :
  wasRestored ?
  'restored' :
  canShowInstallPrompt ?
  'install' :
  canShowPushPrompt ?
  'push' :
  null;

  if (!notice) return null;

  const content = {
    update: {
      icon: RefreshCw,
      title: 'Atualização pronta',
      description: 'A nova versão já pode entrar em uso.',
      action: 'Atualizar',
      onAction: handleApplyUpdate,
      onDismiss: undefined
    },
    offline: {
      icon: WifiOff,
      title: 'Sem conexão',
      description: 'O app continua aberto e tenta recuperar a sessão quando a internet voltar.',
      action: undefined,
      onAction: undefined,
      onDismiss: undefined
    },
    restored: {
      icon: Wifi,
      title: 'Conexão restaurada',
      description: 'Os dados em tempo real podem sincronizar novamente.',
      action: undefined,
      onAction: undefined,
      onDismiss: () => setWasRestored(false)
    },
    install: {
      icon: Download,
      title: 'Instalar Kivora',
      description: isIOS ?
      'No iPhone, use Compartilhar e Adicionar à Tela de Início.' :
      'Abra em tela cheia, com atalho próprio e menos distrações do navegador.',
      action: installPrompt ? 'Instalar' : undefined,
      onAction: installPrompt ? handleInstall : undefined,
      onDismiss: dismissInstallPrompt
    },
    push: {
      icon: Bell,
      title: 'Ativar lembretes',
      description: 'Receba revisão vencida mesmo fora do navegador.',
      action: 'Ativar',
      onAction: handleEnablePush,
      onDismiss: dismissPushPrompt
    }
  }[notice];

  const Icon = content.icon;

  return (
    <div className="fixed inset-x-3 bottom-[calc(6.25rem+env(safe-area-inset-bottom))] z-[80] sm:left-auto sm:right-4 sm:bottom-4 sm:w-[min(25rem,calc(100vw-2rem))]">
      <div className={className ?? "pwa-notice-card rounded-[1rem] border border-border bg-surface-container-lowest/96 p-3 shadow-[var(--shadow-xl)] backdrop-blur-md"}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.8rem] bg-primary text-on-primary">
            <Icon className="h-5 w-5" strokeWidth={2.3} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-text">{content.title}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-text-muted">
              {error || content.description}
            </p>
            {content.action && content.onAction &&
            <button
              type="button"
              onClick={content.onAction}
              disabled={isBusy}
              className="btn-primary mt-3 min-h-9 px-3 py-2 text-xs">
              
                {content.action}
              </button>
            }
          </div>
          {content.onDismiss &&
          <button
            type="button"
            onClick={content.onDismiss}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.65rem] text-text-muted hover:bg-surface-container-low hover:text-text"
            aria-label="Dispensar">
            
              <X className="h-4 w-4" strokeWidth={2.4} />
            </button>
          }
        </div>
      </div>
    </div>);

}
