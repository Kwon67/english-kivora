import type { NextConfig } from "next";

import { getLandingRiveAssets } from './src/components/landing/landingRiveAssets';
import { resolveAnalyticsEndpoint } from './src/lib/analyticsEndpoint';

function buildContentSecurityPolicy(enableRive = false) {
  const isProd = process.env.NODE_ENV === 'production'
  const analyticsOrigin = process.env.NEXT_PUBLIC_POSTHOG_KEY
    ? resolveAnalyticsEndpoint(process.env.NEXT_PUBLIC_POSTHOG_HOST)?.origin
    : null

  return [
    "default-src 'self'",
    // Next.js still injects small inline bootstrap scripts in production.
    isProd
      ? `script-src 'self' 'unsafe-inline'${enableRive ? " 'wasm-unsafe-eval'" : ''}`
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "media-src 'self' data: blob: https://*.supabase.co",
    "font-src 'self' data:",
    `connect-src 'self' https://*.supabase.co wss://*.supabase.co${analyticsOrigin ? ` ${analyticsOrigin}` : ''}`,
    "worker-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "manifest-src 'self'",
    "frame-ancestors 'none'",
    ...(isProd ? ['upgrade-insecure-requests'] : []),
  ].join('; ')
}

const nextConfig: NextConfig = {
  // Playback ordering hint only. Every synthesis still checks the resource and reserves quota on the server.
  env: { NEXT_PUBLIC_KIVORA_F0_CONFIGURED: String(process.env.AZURE_SPEECH_F0_ENABLED === 'true' &&
    Boolean(process.env.AZURE_SPEECH_RESOURCE_ID && process.env.AZURE_SPEECH_ARM_TOKEN && process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION)) },
  // Turbopack keeps stable chunk paths in development. Version them per dev
  // process so a restarted localhost cannot hydrate fresh HTML with stale JS/CSS.
  // Production can keep using the deployment ID supplied by the platform.
  deploymentId:
    process.env.NODE_ENV === 'development'
      ? (process.env.NEXT_DEPLOYMENT_ID ?? `local-${process.pid}`)
      : process.env.NEXT_DEPLOYMENT_ID,
  allowedDevOrigins: ['192.168.0.6', '192.168.3.70', 'localhost:3000', '192.168.101.142'],
  turbopack: {},
  // Enable production optimizations
  compress: true,
  outputFileTracingExcludes: {'/*':['./public/audio/kivora/**/*']},

  // Optimize bundle for faster loading
  experimental: {
    serverActions: {
      bodySizeLimit: '6mb',
    },
    // Already optimized packages (auto-enabled for these):
    // lucide-react, recharts, motion
    optimizePackageImports: [
      'canvas-confetti',
      'recharts',
      'motion',
    ],
  },

  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
    // Optimize for mobile
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  async redirects() {
    return [
      {
        source: '/arena',
        destination: '/blitz',
        permanent: true,
      },
      {
        source: '/arena/:path*',
        destination: '/blitz',
        permanent: true,
      },
      {
        source: '/admin/arena',
        destination: '/admin/dashboard',
        permanent: true,
      },
      {
        source: '/ranking',
        destination: '/blitz/ranking',
        permanent: true,
      },
    ]
  },

  async headers() {
    const contentSecurityPolicy = buildContentSecurityPolicy()
    const immutableStaticAssetHeaders = [
      {
        key: 'Cache-Control',
        value: 'public, max-age=31536000, immutable',
      },
    ]

    const baseSecurityHeaders = [
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        key: 'X-Frame-Options',
        value: 'DENY',
      },
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains',
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
      {
        key: 'Cross-Origin-Opener-Policy',
        value: 'same-origin',
      },
      {
        key: 'Cross-Origin-Resource-Policy',
        value: 'same-origin',
      },
      {
        key: 'Origin-Agent-Cluster',
        value: '?1',
      },
      {
        key: 'X-Permitted-Cross-Domain-Policies',
        value: 'none',
      },
      {
        key: 'Content-Security-Policy',
        value: contentSecurityPolicy,
      },
    ] as const

    const permissionsPolicy = {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(self), geolocation=()',
    }

    return [
      {
        source: '/(.*)',
        headers: [...baseSecurityHeaders, permissionsPolicy],
      },
      {
        source: '/auth/:path*',
        headers: [
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'Cache-Control', value: 'private, no-store' },
        ],
      },
      ...(Object.keys(getLandingRiveAssets()).length ? [{
        source: '/',
        headers: [{ key: 'Content-Security-Policy', value: buildContentSecurityPolicy(true) }],
      }] : []),
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self'",
          },
        ],
      },
      {source:'/audio/kivora/index/:hash([a-f0-9]{64}).json',headers:immutableStaticAssetHeaders},
      {
        source: '/audio/kivora/:hash([a-f0-9]{64}).mp3',
        headers: immutableStaticAssetHeaders,
      },
      {
        source: '/images/:path*',
        headers: immutableStaticAssetHeaders,
      },
      {
        source: '/brand/:path*',
        headers: immutableStaticAssetHeaders,
      },
      {
        source: '/icon-192.png',
        headers: immutableStaticAssetHeaders,
      },
      {
        source: '/icon-512.png',
        headers: immutableStaticAssetHeaders,
      },
      {
        source: '/apple-touch-icon.png',
        headers: immutableStaticAssetHeaders,
      },
      {
        source: '/pwa-192x192.png',
        headers: immutableStaticAssetHeaders,
      },
      {
        source: '/pwa-512x512.png',
        headers: immutableStaticAssetHeaders,
      },
      {
        source: '/sql-wasm.wasm',
        headers: immutableStaticAssetHeaders,
      },
      {
        source: '/sql-wasm-browser.wasm',
        headers: immutableStaticAssetHeaders,
      },
    ]
  },

};

export default nextConfig;
