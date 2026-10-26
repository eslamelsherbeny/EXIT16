'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import Link from 'next/link'
import { Check } from 'lucide-react'
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

function CloudflareOfficialLogo() {
  return (
    <svg
      viewBox="0 0 64 28"
      className="h-[15px] w-auto shrink-0"
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M44.8 19.6h3.9c2.9 0 5.2-2.2 5.2-5 0-2.6-2-4.8-4.6-5-.6-3.8-4-6.6-8-6.6-3.7 0-6.9 2.4-7.8 5.8-.7-.3-1.5-.4-2.3-.4-3.3 0-6 2.5-6.2 5.7-2.4.4-4.2 2.4-4.2 4.8 0 2.7 2.3 4.7 5.1 4.7h18.9v-4z"
        fill="#F48120"
      />
      <path
        d="M50.2 11.2c-.3 0-.6 0-.9.1-.5-2.6-2.8-4.5-5.6-4.5-2.6 0-4.8 1.7-5.5 4.1v12.7h12c2.5 0 4.5-1.9 4.5-4.3 0-2.4-2-4.4-4.5-8.1z"
        fill="#FAAD3F"
      />
    </svg>
  )
}

export function TurnstileBox({
  onTokenChange,
}: {
  onTokenChange?: (token: string) => void
}) {
  const { locale, dir } = useTranslation()
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || ''
  const containerRef = useRef<HTMLDivElement>(null)

  const [token, setToken] = useState<string>(siteKey ? '' : 'dev-bypass-token')
  const [status, setStatus] = useState<'verifying' | 'verified'>('verifying')

  const verifyingText =
    locale === 'ar'
      ? 'جاري التحقق...'
      : locale === 'ru'
        ? 'Проверка...'
        : locale === 'ka'
          ? 'მოწმდება...'
          : 'Verifying...'

  const verifiedText =
    locale === 'ar'
      ? 'تم التحقق بنجاح!'
      : locale === 'ru'
        ? 'Успешно!'
        : locale === 'ka'
          ? 'წარმატებით!'
          : 'Success!'

  const privacyText =
    locale === 'ar'
      ? 'الخصوصية'
      : locale === 'ru'
        ? 'Конфид.'
        : locale === 'ka'
          ? 'კონფიდ.'
          : 'Privacy'

  const termsText =
    locale === 'ar'
      ? 'الشروط'
      : locale === 'ru'
        ? 'Условия'
        : locale === 'ka'
          ? 'პირობები'
          : 'Terms'

  useEffect(() => {
    if (!siteKey) {
      setStatus('verifying')
      const timer = setTimeout(() => {
        setToken('dev-bypass-token')
        setStatus('verified')
        onTokenChange?.('dev-bypass-token')
      }, 450)
      return () => clearTimeout(timer)
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
          language: locale,
          callback: (tk: string) => {
            setToken(tk)
            setStatus('verified')
            onTokenChange?.(tk)
          },
          'expired-callback': () => {
            setToken('')
            setStatus('verifying')
            onTokenChange?.('')
          },
        })
      }
    }

    renderWidget()
    const timer = setInterval(renderWidget, 350)
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
  }, [siteKey, locale, onTokenChange])

  if (siteKey) {
    return (
      <div className="my-1.5 flex w-full flex-col items-center justify-center">
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
        />
        <div
          ref={containerRef}
          className="flex min-h-[65px] w-full items-center justify-center overflow-hidden [&_iframe]:!w-full [&_iframe]:max-w-full"
        />
        <input
          type="hidden"
          name="cf_turnstile_response"
          value={token}
        />
      </div>
    )
  }

  return (
    <div className="my-1.5 w-full">
      <div
        dir={dir}
        className="flex h-[65px] w-full items-center justify-between gap-3 rounded-[10px] border border-[#e0e0e0] bg-[#fafafa] px-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] select-none"
        aria-label="Cloudflare Turnstile"
      >
        <input
          type="hidden"
          name="cf_turnstile_response"
          value={token || 'dev-bypass-token'}
        />

        <div className="flex min-w-0 items-center gap-3">
          {status === 'verifying' ? (
            <span className="relative flex size-6 shrink-0 items-center justify-center">
              <span className="size-6 animate-spin rounded-full border-[2.5px] border-slate-200 border-t-[#03875b]" />
            </span>
          ) : (
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#03875b] text-white shadow-2xs animate-in zoom-in-75 duration-200">
              <Check className="size-4 stroke-[3.2]" />
            </span>
          )}

          <span className="truncate text-[13.5px] font-bold text-[#222222]">
            {status === 'verifying' ? verifyingText : verifiedText}
          </span>
        </div>

        <div
          dir="ltr"
          className="flex shrink-0 flex-col items-end justify-center text-right font-sans"
        >
          <div className="flex items-center gap-1">
            <CloudflareOfficialLogo />
            <span className="text-[10px] font-black tracking-tight text-[#222222]">
              CLOUDFLARE
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-[8.5px] font-medium text-[#767676]">
            <Link href="/privacy" className="hover:underline">
              {privacyText}
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:underline">
              {termsText}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}