import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Aqar Exit — عقار إكزت للتنازل العقاري',
    short_name: 'Aqar Exit',
    description:
      'منصة التنازل عن وحدات التقسيط واستكمال الأقساط في جورجيا بدون أوفر وبنفس سعر العقد الأصلي.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f6f8fc',
    theme_color: '#0a1122',
    orientation: 'portrait',
    categories: ['business', 'finance', 'lifestyle'],
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}