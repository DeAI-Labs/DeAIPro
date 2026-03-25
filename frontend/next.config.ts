import type { NextConfig } from 'next';
import fs from 'fs';
import path from 'path';

try {
  // Fix the route collision before Next.js parses the app directory
  const cwd = process.cwd();
  const badDashDir = path.join(cwd, 'app', '(dashboard)');
  const goodDashDir = path.join(cwd, 'app', 'dashboard');
  
  if (fs.existsSync(badDashDir)) {
    console.log('Renaming app/(dashboard) to app/dashboard to fix route collision on /');
    fs.renameSync(badDashDir, goodDashDir);
  }
} catch (e) {
  console.error('Failed to rename dashboard directory:', e);
}

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
