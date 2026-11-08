import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Aqar Exit — عقار إكزت للتنازل العقاري',
    short_name: 'Aqar Exit',
    description:
      'منصة التنازل عن وحدات التقسيط واستكمال الأقساط في جورجيا بدون أوفر وبنفس سعر العقد الأصلي.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f6f8fc',
    theme_color: '#1e3a8a',
    orientation: 'portrait',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}
