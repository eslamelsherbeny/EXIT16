import type { MetadataRoute } from 'next'
import { cookies } from 'next/headers'
import { DICTIONARIES, type LocaleCode } from '@/lib/i18n-config'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let locale: LocaleCode = 'ar'
  try {
    const cookieStore = await cookies()
    const saved = cookieStore.get('locale')?.value as LocaleCode | undefined
    if (saved === 'ar' || saved === 'en' || saved === 'ru' || saved === 'ka') {
      locale = saved
    }
  } catch {}

  const dict = (DICTIONARIES[locale] || DICTIONARIES.ar) as Record<string, any>
  const description =
    dict?.systemPages?.manifestDesc ||
    dict?.systemPages?.metaDesc ||
    'Aqar Exit'

  return {
    id: '/',
    name: 'Aqar Exit',
    short_name: 'Aqar Exit',
    description,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    dir: locale === 'ar' ? 'rtl' : 'ltr',
    lang: locale,
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
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}