import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.3.70'],
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
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
    // Optimize for mobile
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Add cache headers for static assets and API routes
  async headers() {
    return [
      {
        // Static assets cache (1 year)
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Images cache (1 week)
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },

  // Turbopack config (empty to silence warning, using defaults)
  turbopack: {},
};

export default nextConfig;
