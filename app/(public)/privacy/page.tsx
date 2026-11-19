'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

const CONSENT_STORAGE_KEY = 'aqar_cookie_consent_v2'
const LEGACY_CONSENT_KEY = 'aqar_cookie_consent'

type PolicySection = {
  title: string
  body: string
}

export default function PrivacyPolicyPage() {
  const { t: dict, dir } = useTranslation()
  const content = (dict?.publicPages as Record<string, any>)?.privacy || {}
  const sections: PolicySection[] = Array.isArray(content.sections)
    ? content.sections
    : []

  const [resetSuccess, setResetSuccess] = useState(false)

  const handleResetCookieConsent = () => {
    try {
      localStorage.removeItem(CONSENT_STORAGE_KEY)
      localStorage.removeItem(LEGACY_CONSENT_KEY)
      setResetSuccess(true)
      setTimeout(() => {
        window.location.reload()
      }, 600)
    } catch {}
  }

  return (
    <main
      dir={dir}
      className="min-h-screen bg-[#f6f8fc] py-10 text-[#0f1d40] sm:py-16"
    >
      <div className="mx-auto max-w-[780px] px-4 sm:px-6">
        <div className="rounded-[26px] border border-slate-200/85 bg-white p-6 shadow-2xs sm:p-10 md:p-12">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#2563eb] transition hover:underline"
          >
            {dir === 'rtl' ? (
              <ArrowRight className="size-3.5" />
            ) : (
              <ArrowLeft className="size-3.5" />
            )}
            <span>{content.backHome}</span>
          </Link>

          <h1 className="mt-4 text-start text-2xl font-black tracking-tight text-[#0f1d40] sm:text-4xl">
            {content.title}
          </h1>

          <p className="mt-2 text-start text-xs font-semibold text-slate-400">
            {content.lastUpdated}
          </p>

          <div className="mt-8 space-y-7 text-start">
            {sections.map((section) => (
              <section key={section.title} className="space-y-2">
                <h2 className="text-base font-extrabold text-[#0f1d40] sm:text-lg">
                  {section.title}
                </h2>
                <p className="text-xs leading-[1.95] text-slate-600 sm:text-[14px]">
                  {section.body}
                </p>
              </section>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-slate-200/90 bg-[#f8fafc] p-5 text-start">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#0f1d40] sm:text-sm">
                  <ShieldCheck className="size-4 text-[#007a5a]" />
                  <span>{content.cookieResetTitle}</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  {content.cookieResetDesc}
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetCookieConsent}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-[#2563eb] px-5 text-xs font-extrabold text-white shadow-2xs transition hover:bg-blue-700 active:scale-95"
              >
                <RefreshCw className="size-3.5" />
                <span>{content.cookieResetBtn}</span>
              </button>
            </div>

            {resetSuccess && (
              <p className="mt-3 flex items-center gap-1.5 text-xs font-bold text-[#007a5a]">
                <CheckCircle2 className="size-4" />
                <span>{content.cookieResetDone}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}