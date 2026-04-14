import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.3.70'],
  // Enable production optimizations
  compress: true,

  // Optimize bundle for faster loading
  experimental: {
    viewTransition: true,
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

  // Turbopack config (empty to silence warning, using defaults)
  turbopack: {},
};

export default nextConfig;
