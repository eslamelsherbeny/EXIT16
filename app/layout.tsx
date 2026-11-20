import { Suspense } from 'react'
import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Cairo } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { FacebookPixel } from '@/components/shared/facebook-pixel'
import { FloatingWhatsApp } from '@/components/shared/floating-whatsapp'
import { RouteProgressBar } from '@/components/shared/route-progress-bar'
import { LanguageProvider } from '@/lib/i18n'
import { getServerI18n } from '@/lib/get-server-dictionary'

export const dynamic = 'force-dynamic'


const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '600', '700', '900'],
  variable: '--font-cairo',
  display: 'swap',
})

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://dualdealz.com'

export async function generateMetadata(): Promise<Metadata> {
  const { dict, locale } = await getServerI18n()
  const title =
    dict.systemPages?.metaTitle ||
    'DualDealz — Real Estate & Installment Transfers in Georgia'
  const description =
    dict.systemPages?.metaDesc ||
    'Buy, sell, and transfer installment real estate in Tbilisi & Batumi, Georgia directly at original contract prices with DualDealz.'

  const ogLocaleMap: Record<string, string> = {
    ar: 'ar_AR',
    en: 'en_US',
    ru: 'ru_RU',
    ka: 'ka_GE',
  }

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      template: '%s | DualDealz',
    },
    description,
    applicationName: 'DualDealz',
    keywords: [
      'DualDealz',
      'Georgia real estate',
      'Tbilisi apartments for sale',
      'Batumi real estate investment',
      'installment transfer Georgia',
      'عقارات جورجيا',
      'شقق بالتقسيط في تبليسي',
      'شقق للبيع في باتومي',
      'تنازل عقارات جورجيا',
      'недвижимость в Грузии',
      'квартиры в Тбилиси и Батуми',
      'უძრავი ქონება საქართველოში',
    ],
    authors: [{ name: 'DualDealz', url: SITE_URL }],
    creator: 'DualDealz',
    publisher: 'DualDealz',
    alternates: {
      canonical: '/',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    manifest: '/manifest.webmanifest',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: 'DualDealz',
    },
    icons: {
      icon: [
        { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
      apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
    },
    openGraph: {
      type: 'website',
      url: SITE_URL,
      siteName: 'DualDealz',
      locale: ogLocaleMap[locale] || 'en_US',
      title,
      description,
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'DualDealz — Real Estate in Georgia',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
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
          <Suspense fallback={null}>
            <RouteProgressBar />
          </Suspense>
          {children}
          <FloatingWhatsApp />
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