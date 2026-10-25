'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import { Check, Loader2, ShieldCheck } from 'lucide-react'
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
      className={`w-full rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_14px_45px_rgba(20,20,24,0.06)] sm:p-8 ${className}`}
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
  const { t: dict, dir } = useTranslation()
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
          size: 'flexible',
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
      <div className="my-1.5 flex w-full flex-col items-center justify-center">
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
        />
        {!widgetLoaded && (
          <div className="flex h-[65px] w-full max-w-[300px] items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-[#fafafa] text-xs font-semibold text-slate-500">
            <Loader2 className="size-4 animate-spin text-[#007a5a]" />
            <span>{t.turnstileText}</span>
          </div>
        )}
        <div
          ref={containerRef}
          className="flex w-full max-w-full items-center justify-center overflow-hidden [&_iframe]:max-w-full"
        />
        <input type="hidden" name="cf_turnstile_response" value={token} />
      </div>
    )
  }

  return (
    <div className="my-1.5 flex w-full justify-center">
      <div
        dir={dir}
        className="flex h-[58px] w-full max-w-[300px] items-center justify-between gap-3 rounded-xl border border-slate-200/90 bg-[#fafafa] px-3.5 text-xs shadow-2xs select-none"
        aria-label="Cloudflare Turnstile"
      >
        <input
          type="hidden"
          name="cf_turnstile_response"
          value="dev-bypass-token"
        />
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
            <Check className="size-3.5 stroke-[3]" />
          </span>
          <span className="truncate font-bold text-slate-700">
            {t.turnstileText}
          </span>
        </div>
        <div
          dir="ltr"
          className="shrink-0 text-right font-sans text-[9.5px] leading-tight text-[#8b8b91]"
        >
          <div className="flex items-center justify-end gap-1 font-extrabold text-slate-700">
            <ShieldCheck className="size-3 text-[#f48120]" />
            <span>CLOUDFLARE</span>
          </div>
          <span>Turnstile</span>
        </div>
      </div>
    </div>
  )
}