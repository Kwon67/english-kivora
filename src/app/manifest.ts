import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Kivora English',
    short_name: 'Kivora',
    description: 'Plataforma de aprendizado de inglês',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1DB954',
    icons: [
      {
        src: '/brand/kivora-mark.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  }
}
