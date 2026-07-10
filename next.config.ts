import type { NextConfig } from "next";

function buildContentSecurityPolicy() {
  const isProd = process.env.NODE_ENV === 'production'

  return [
    "default-src 'self'",
    // Next.js still injects small inline bootstrap scripts in production.
    isProd
      ? "script-src 'self' 'unsafe-inline'"
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "media-src 'self' data: blob: https://*.supabase.co",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
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
  allowedDevOrigins: ['192.168.0.6', '192.168.3.70', 'localhost:3000'],
  turbopack: {},
  // Enable production optimizations
  compress: true,

  // Optimize bundle for faster loading
  experimental: {
    serverActions: {
      bodySizeLimit: '6mb',
    },
    // Already optimized packages (auto-enabled for these):
    // lucide-react, recharts, framer-motion
    optimizePackageImports: [
      'canvas-confetti',
      'recharts',
      'framer-motion',
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
