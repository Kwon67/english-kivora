import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Kivora Inglês',
    short_name: 'Kivora',
    description: 'Treino diário de inglês com revisão espaçada, sessões curtas e notificações de revisão.',
    start_url: '/home',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    orientation: 'portrait',
    background_color: '#f5f7f5',
    theme_color: '#065f46',
    categories: ['education', 'productivity', 'utilities'],
    lang: 'pt-BR',
    launch_handler: {
      client_mode: 'focus-existing',
    },
    prefer_related_applications: false,
    icons: [
      {
        src: '/pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    shortcuts: [
      {
        name: 'Revisar agora',
        short_name: 'Revisar',
        description: 'Abrir revisões vencidas.',
        url: '/review',
        icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'Entrar na Arena',
        short_name: 'Arena',
        description: 'Abrir duelos da Arena.',
        url: '/arena',
        icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'Tutor IA',
        short_name: 'Tutor',
        description: 'Abrir o tutor de conversação.',
        url: '/tutor',
        icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
      },
    ],
  }
}
