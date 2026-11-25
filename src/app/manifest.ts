import type { MetadataRoute } from 'next'
import { BRAND_PAPER } from '@/lib/brandColors'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Kivora English',
    short_name: 'Kivora',
    description: 'Plataforma de aprendizado de inglês',
    start_url: '/home',
    scope: '/',
    display: 'standalone',
    background_color: BRAND_PAPER,
    theme_color: BRAND_PAPER,
    icons: [
      {
        src: '/icon-192.png?v=4',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png?v=4',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-192.png?v=4',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png?v=4',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
