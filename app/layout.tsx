import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Cairo } from 'next/font/google'
import './globals.css'

const cairo = Cairo({ subsets: ['arabic'], variable: '--font-cairo', display: 'swap' })

export const metadata: Metadata = {
  title: 'دارك | منصتك العقارية الذكية',
  description: 'منصة عربية متكاملة لبيع وشراء واستثمار العقارات.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f7f7f4',
  userScalable: true,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.variable} antialiased`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

export const dynamic = 'force-dynamic'

