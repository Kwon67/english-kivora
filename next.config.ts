import { withVisualEdit as withBefreeVisualEdit } from 'befree-visual-edit/next';

import type { NextConfig } from "next";

type TurbopackRules = NonNullable<NonNullable<NextConfig['turbopack']>['rules']>;

function removeBefreeTurbopackAs(rule: unknown): unknown {
  if (Array.isArray(rule)) {
    return rule.map(removeBefreeTurbopackAs);
  }

  if (!rule || typeof rule !== 'object') {
    return rule;
  }

  const record = rule as Record<string, unknown>;
  const loaders = Array.isArray(record.loaders) ? record.loaders : [];
  const isBefreeLoader = loaders.some((loader) => {
    const value = String(loader);
    return value.includes('befree-visual-edit') && value.includes('next-loader');
  });

  if (!isBefreeLoader || !('as' in record)) {
    return rule;
  }

  const ruleWithoutAs = { ...record };
  delete ruleWithoutAs.as;
  return ruleWithoutAs;
}

const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self'",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "frame-ancestors 'none'",
].join('; ')

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.0.6', '192.168.3.70', 'localhost:3000'],
  turbopack: {},
  // Enable production optimizations
  compress: true,

  // Optimize bundle for faster loading
  experimental: {
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

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
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
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: contentSecurityPolicy,
          },
        ],
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
    ]
  },

};

const visualEditConfig = withBefreeVisualEdit(nextConfig) as NextConfig;
const turbopackRules = visualEditConfig.turbopack?.rules as TurbopackRules | undefined;

const config: NextConfig = turbopackRules
  ? {
    ...visualEditConfig,
    turbopack: {
      ...visualEditConfig.turbopack,
      rules: {
        ...turbopackRules,
        '*.tsx': removeBefreeTurbopackAs(turbopackRules['*.tsx']),
        '*.jsx': removeBefreeTurbopackAs(turbopackRules['*.jsx']),
      } as TurbopackRules,
    },
  }
  : visualEditConfig;

export default config;
