import type { MetadataRoute } from 'next'
import { BRAND_PRIMARY, BRAND_SURFACE_LIGHT } from '@/lib/brandColors'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Kivora English',
    short_name: 'Kivora',
    description: 'Plataforma de aprendizado de inglês',
    start_url: '/home',
    scope: '/',
    display: 'standalone',
    background_color: BRAND_SURFACE_LIGHT,
    theme_color: BRAND_PRIMARY,
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
