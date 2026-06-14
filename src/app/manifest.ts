import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  const primaryGreen = '#1DB954'

  return {
    name: 'Kivora English',
    short_name: 'Kivora',
    description: 'Plataforma de aprendizado de inglês',
    start_url: '/home',
    display: 'standalone',
    background_color: primaryGreen,
    theme_color: primaryGreen,
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
    ],
  }
}
