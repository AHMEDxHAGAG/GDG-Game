import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: true,
  // Lets a second build live alongside the first without clobbering it.
  //
  // `e2e/teams.no-project.spec.ts` needs a server built *without*
  // `NEXT_PUBLIC_SUPABASE_*`, while Playwright's own `webServer` builds the
  // normal one. Both default to `.next`, so whichever built second silently
  // replaced the other's output — and the already-running server then served
  // from a directory that no longer matched its own build. Giving the
  // project-less build its own directory removes the collision entirely.
  //
  // `tools/serve-without-supabase.sh` sets this; nothing else should.
  distDir: process.env.NEXT_DIST_DIR || '.next',
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
