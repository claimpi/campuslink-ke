import type { NextConfig } from 'next'

const isCapacitor = process.env.BUILD_TARGET === 'capacitor'

const nextConfig: NextConfig = {
  // Static export for Capacitor APK build, normal for web
  ...(isCapacitor ? { output: 'export', trailingSlash: true } : {}),
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    // Required for static export
    unoptimized: isCapacitor,
  },
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js'],
  },
  compress: true,
  poweredByHeader: false,
}

export default nextConfig
