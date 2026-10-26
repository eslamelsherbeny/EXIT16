'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { t: dict, dir } = useTranslation()
  const t = dict.systemPages

  useEffect(() => {
    console.error('App error boundary:', error)
  }, [error])

  return (
    <main
      dir={dir}
      className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-[var(--brand-surface,#f5f6f8)] px-6 py-20 text-center"
    >
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <p className="text-sm font-bold text-[var(--brand-primary,#007a5a)]">
          {t.errorEyebrow}
        </p>
        <h1 className="mt-3 text-2xl font-black text-[var(--brand-navy,#0a1122)] sm:text-3xl">
          {t.errorTitle}
        </h1>
        <p className="mt-3 text-sm text-slate-500">{t.errorDesc}</p>

        {error?.message && (
          <div
            dir="ltr"
            className="mt-4 max-h-28 overflow-auto rounded-xl border border-red-200 bg-red-50 p-3 text-left font-mono text-[11px] text-red-800"
          >
            {error.message}
            {error.digest ? ` (Digest: ${error.digest})` : ''}
          </div>
        )}

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Button
            type="button"
            className="rounded-xl bg-[var(--brand-navy,#0a1122)] px-6 text-white"
            onClick={() => reset()}
          >
            {t.errorRetryBtn}
          </Button>
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-xs font-bold text-[#0a1122] hover:bg-slate-50"
          >
            {(dict.navbar as any)?.home || 'الرئيسية'}
          </Link>
        </div>
      </div>
    </main>
  )
}