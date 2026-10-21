'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import { Navbar } from '@/components/site-shell'
import { useTranslation } from '@/lib/i18n'

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const { dir } = useTranslation()
  return (
    <div className="min-h-screen bg-[var(--brand-surface,#f5f6f8)]" dir={dir}>
      <Navbar />
      <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-5 py-12 sm:px-8">
        {children}
      </main>
    </div>
  )
}

export function AuthCard({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={`w-full max-w-[430px] rounded-2xl bg-white p-6 shadow-[0_14px_45px_rgba(20,20,24,0.06)] sm:p-9 ${className}`}
    >
      {children}
    </section>
  )
}

export function TurnstileBox({
  onTokenChange,
}: {
  onTokenChange?: (token: string) => void
}) {
  const { t: dict } = useTranslation()
  const t = dict.authPages.common
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''
  const containerRef = useRef<HTMLDivElement>(null)
  const [token, setToken] = useState<string>(siteKey ? '' : 'dev-bypass-token')

  useEffect(() => {
    if (!siteKey) {
      onTokenChange?.('dev-bypass-token')
      return
    }

    let widgetId: string | undefined
    const renderWidget = () => {
      if (
        typeof window !== 'undefined' &&
        (window as any).turnstile &&
        containerRef.current &&
        !containerRef.current.hasChildNodes()
      ) {
        widgetId = (window as any).turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: 'light',
          callback: (tk: string) => {
            setToken(tk)
            onTokenChange?.(tk)
          },
          'expired-callback': () => {
            setToken('')
            onTokenChange?.('')
          },
        })
      }
    }

    renderWidget()
    const timer = setInterval(renderWidget, 500)
    return () => {
      clearInterval(timer)
      if (widgetId && typeof window !== 'undefined' && (window as any).turnstile) {
        try {
          ;(window as any).turnstile.remove(widgetId)
        } catch {}
      }
    }
  }, [siteKey, onTokenChange])

  if (siteKey) {
    return (
      <div className="my-1 flex flex-col items-center justify-center">
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
        />
        <div ref={containerRef} className="min-h-[65px]" />
        <input type="hidden" name="cf_turnstile_response" value={token} />
      </div>
    )
  }

  return (
    <div
      className="flex min-h-[60px] items-center gap-3 rounded-xl border border-[#d9d9dc] bg-[#fafafa] px-4 text-xs text-muted-foreground"
      aria-label="Cloudflare Turnstile"
    >
      <input type="hidden" name="cf_turnstile_response" value="dev-bypass-token" />
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
        ✓
      </span>
      <span className="font-semibold">{t.turnstileText}</span>
      <span className="ms-auto text-left font-sans text-[10px] leading-3 text-[#8b8b91]">
        CLOUDFLARE
        <br />
        Turnstile
      </span>
    </div>
  )
}
