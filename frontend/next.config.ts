import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Allow images from external domains if needed
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.googleapis.com' },
    ],
  },
  // Disable ESLint during production builds (run separately in CI)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript errors during production builds (run separately in CI)
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
