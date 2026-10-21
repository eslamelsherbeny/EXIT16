import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Cairo } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
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
  return {
    title: dict.systemPages?.metaTitle || 'Aqar Exit',
    description: dict.systemPages?.metaDesc || '',
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
  const { locale, country, dir } = await getServerI18n()

  return (
    <html lang={locale} dir={dir}>
      <body className={`${cairo.variable} ${cairo.className} antialiased`}>
        <LanguageProvider initialLocale={locale} initialCountry={country}>
          {children}
        </LanguageProvider>
        <Toaster />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
