import type { MetadataRoute } from 'next'
import { publicSiteOrigin, publicSitePaths } from '@/lib/publicSite'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: [...publicSitePaths.map(path => path + '$'), '/_next/static/', '/_next/image', '/images/', '/brand/'],
      disallow: '/',
    },
    sitemap: publicSiteOrigin + '/sitemap.xml',
  }
}
