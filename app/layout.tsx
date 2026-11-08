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
    applicationName: 'Aqar Exit',
    manifest: '/manifest.webmanifest',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: 'Aqar Exit',
    },
    icons: {
      icon: [
        { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
      apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
    },
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.__deferredPwaPrompt = null;
              window.addEventListener('beforeinstallprompt', function(e) {
                e.preventDefault();
                window.__deferredPwaPrompt = e;
                window.dispatchEvent(new Event('pwa-prompt-ready'));
              });
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function() {});
                });
              }
            `,
          }}
        />
      </head>
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
