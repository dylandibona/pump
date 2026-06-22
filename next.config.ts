import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export: the SAME build bundles into the Capacitor native iOS app
  // (offline-first) and still deploys to Vercel as the PWA. Route handlers that
  // read the request aren't exportable — the legacy /api/data Upstash route was
  // removed for this (Upstash sync retired; localStorage + Supabase are primary).
  output: 'export',
  // Default next/image optimization needs a server; static export requires a
  // custom loader or unoptimized images. We emit plain <img> output.
  images: { unoptimized: true },
  // Trailing slashes emit /route/index.html, which resolves cleanly from the
  // file:// context inside the native shell.
  trailingSlash: true,
};

export default nextConfig;
