import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Cairo } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import arDict from '@/dictionaries/ar.json'

const cairo = Cairo({
  subsets: ['arabic'],
  weight: ['400', '600', '700', '900'],
  variable: '--font-cairo',
  display: 'swap',
})

export const metadata: Metadata = {
  title: arDict.systemPages.metaTitle,
  description: arDict.systemPages.metaDesc,
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#0a1122',
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.variable} ${cairo.className} antialiased`}>
        {children}
        <Toaster />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

export const dynamic = 'force-dynamic'
