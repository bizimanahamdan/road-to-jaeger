import type { NextConfig } from 'next';

/**
 * Road to Jaeger is a fully static, offline-first application.
 *
 * `output: 'export'` produces a plain `out/` directory of HTML/CSS/JS that is:
 *   1. served as a PWA (see public/sw.js + scripts/build-pwa.mjs)
 *   2. copied verbatim into the Capacitor Android project (capacitor.config.ts -> webDir: 'out')
 *
 * There is deliberately no Node server, no API routes and no server-only code:
 * every feature has to keep working with zero connectivity on a low-end phone.
 */
const nextConfig: NextConfig = {
  output: 'export',
  // Directory-style URLs (`/roadmap/index.html`) resolve correctly both from a
  // static file server and from Capacitor's local WebView origin.
  trailingSlash: true,
  reactStrictMode: true,
  images: {
    // No Next image optimisation server exists in a static export.
    unoptimized: true,
  },
  // The whole app is client-rendered against IndexedDB; there is no per-request
  // server data to fetch, so keep the JS payload as small as possible.
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
};

export default nextConfig;
