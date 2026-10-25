'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import { Loader2, ShieldCheck } from 'lucide-react'
import { Navbar } from '@/components/layouts/site-shell'
import { useTranslation } from '@/lib/i18n'

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const { dir } = useTranslation()
  return (
    <div
      className="flex min-h-screen flex-col bg-[var(--brand-surface,#f5f6f8)]"
      dir={dir}
    >
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="w-full max-w-[440px]">{children}</div>
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
      className={`w-full rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_14px_45px_rgba(20,20,24,0.06)] sm:p-8 ${className}`}
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
  const [widgetLoaded, setWidgetLoaded] = useState<boolean>(!siteKey)

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
            setWidgetLoaded(true)
            onTokenChange?.(tk)
          },
          'expired-callback': () => {
            setToken('')
            onTokenChange?.('')
          },
        })
        setWidgetLoaded(true)
      }
    }

    renderWidget()
    const timer = setInterval(renderWidget, 400)
    return () => {
      clearInterval(timer)
      if (
        widgetId &&
        typeof window !== 'undefined' &&
        (window as any).turnstile
      ) {
        try {
          ;(window as any).turnstile.remove(widgetId)
        } catch {}
      }
    }
  }, [siteKey, onTokenChange])

  if (siteKey) {
    return (
      <div className="my-1 flex min-h-[65px] w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-slate-200/70 bg-[#fafafa]">
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
        />
        {!widgetLoaded && (
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Loader2 className="size-4 animate-spin text-[#007a5a]" />
            <span>{t.turnstileText}</span>
          </div>
        )}
        <div
          ref={containerRef}
          className="flex items-center justify-center"
        />
        <input type="hidden" name="cf_turnstile_response" value={token} />
      </div>
    )
  }

  return (
    <div
      className="flex h-[62px] w-full items-center gap-3 rounded-xl border border-slate-200 bg-[#fafafa] px-4 text-xs text-muted-foreground"
      aria-label="Cloudflare Turnstile"
    >
      <input
        type="hidden"
        name="cf_turnstile_response"
        value="dev-bypass-token"
      />
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
        <ShieldCheck className="size-3.5" />
      </span>
      <span className=" truncate font-semibold text-slate-700">
        {t.turnstileText}
      </span>
      <span className="ms-auto shrink-0 text-left font-sans text-[10px] leading-3 text-[#8b8b91]">
        CLOUDFLARE
        <br />
        Turnstile
      </span>
    </div>
  )
}