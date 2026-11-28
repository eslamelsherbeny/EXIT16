/** @type {import('next').NextConfig} */
const cspDirectives = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self' https://pay.flitt.com",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://unpkg.com https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://*.posthog.com",
  "style-src 'self' 'unsafe-inline' https://unpkg.com https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com https://tiles.openfreemap.org",
  "img-src 'self' data: blob: https:",
  "worker-src 'self' blob:",
  "child-src 'self' blob:",
  "frame-src 'self' https://challenges.cloudflare.com https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://pay.flitt.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com https://tiles.openfreemap.org https://*.openstreetmap.org https://nominatim.openstreetmap.org https://photon.komoot.io https://api.open-meteo.com https://air-quality-api.open-meteo.com https://*.cartocdn.com https://server.arcgisonline.com https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com https://www.facebook.com https://connect.facebook.net https://*.posthog.com https://pay.flitt.com",
  'upgrade-insecure-requests',
].join('; ')

const nextConfig = {
  poweredByHeader: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Content-Security-Policy',
            value: cspDirectives,
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
        ],
      },
    ]
  },
}

export default nextConfig