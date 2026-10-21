'use client'

import { useEffect } from 'react'
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
      <div className="max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <p className="text-sm font-bold text-[var(--brand-primary,#007a5a)]">
          {t.errorEyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-black text-[var(--brand-navy,#0a1122)]">
          {t.errorTitle}
        </h1>
        <p className="mt-3 text-sm text-slate-500">{t.errorDesc}</p>
        <Button
          type="button"
          className="mt-7 rounded-xl bg-[var(--brand-navy,#0a1122)] px-6 text-white"
          onClick={() => reset()}
        >
          {t.errorRetryBtn}
        </Button>
      </div>
    </main>
  )
}
