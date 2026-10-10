import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: true,
  // Pin Turbopack's file watcher to this package. Without it, a parent
  // directory that happens to contain another repo (or no repo at all) makes
  // build output warn that package-lock.json sits outside the Git root.
  turbopack: {
    root: __dirname,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'gsap'],
  },
};

export default nextConfig;
