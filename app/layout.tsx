import { Suspense } from 'react'
import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Cairo } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { FacebookPixel } from '@/components/shared/facebook-pixel'
import { LanguageProvider } from '@/lib/i18n'
import { getServerI18n } from '@/lib/get-server-dictionary'

export const dynamic = 'force-dynamic'

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '600', '700', '900'],
  variable: '--font-cairo',
  display: 'swap',
})

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getServerI18n()
  const title = dict.systemPages?.metaTitle || 'Aqar Exit — عقار إكزت'
  const description =
    dict.systemPages?.metaDesc ||
    'منصة التنازل عن وحدات التقسيط واستكمال الأقساط في جورجيا بدون أوفر وبسعر العقد الأصلي.'

  return {
    title,
    description,
    manifest: '/manifest.webmanifest',
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'Aqar Exit',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#0a1122',
  userScalable: true,
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { locale, country, dir, siteSettings, isLoggedIn, isStaff } =
    await getServerI18n()

  return (
    <html lang={locale} dir={dir}>
      <body className={`${cairo.variable} ${cairo.className} antialiased`}>
        <LanguageProvider
          initialLocale={locale}
          initialCountry={country}
          initialSiteSettings={siteSettings}
          initialHasSession={isLoggedIn}
          initialIsStaff={isStaff}
        >
          {children}
          <Suspense fallback={null}>
            <FacebookPixel />
          </Suspense>
        </LanguageProvider>
        <Toaster />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
