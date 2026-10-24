'use client'

import { Suspense, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { setNewPasswordFromTokenAction } from '@/actions/submit-forms'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTranslation } from '@/lib/i18n'

function SetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tokenHash = searchParams.get('token_hash') || ''
  const nextUrl = searchParams.get('next') || '/account'

  const { t: dict, dir } = useTranslation()
  const t = dict.authPages.setPassword

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError(t.shortPassError)
      return
    }
    if (password !== confirmPassword) {
      setError(t.mismatchError)
      return
    }

    startTransition(async () => {
      const res = await setNewPasswordFromTokenAction({
        tokenHash,
        newPassword: password,
      })

      if (!res.success) {
        setError(res.error || t.genericError)
        return
      }

      if (res.unitId) {
        router.push(`/sell?magic=${encodeURIComponent(tokenHash)}`)
      } else {
        router.push(nextUrl)
      }
    })
  }

  return (
    <main
      dir={dir}
      className="flex min-h-[75vh] items-center justify-center bg-[var(--brand-surface,#f5f6f8)] px-4 py-12 text-[var(--brand-navy,#0a1122)]"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 text-start shadow-sm sm:p-8">
        <h1 className="text-2xl font-black text-[var(--brand-navy,#0a1122)] sm:text-3xl">
          {t.title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {t.subtitle}
        </p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <div className="space-y-2">
            <Label className="block text-start text-sm font-bold text-[var(--brand-navy,#0a1122)]">
              {t.passwordLabel}
            </Label>
            <Input
              type="password"
              dir="ltr"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-xl border-slate-200 bg-white text-left"
            />
          </div>

          <div className="space-y-2">
            <Label className="block text-start text-sm font-bold text-[var(--brand-navy,#0a1122)]">
              {t.confirmLabel}
            </Label>
            <Input
              type="password"
              dir="ltr"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-12 rounded-xl border-slate-200 bg-white text-left"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 p-3 text-center text-xs font-bold text-red-600">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={pending}
            className="h-12 w-full rounded-xl bg-[var(--brand-navy,#0a1122)] text-sm font-bold text-white hover:bg-[var(--brand-navy-hover,#16223f)]"
          >
            {pending ? t.submittingBtn : t.submitBtn}
          </Button>
        </form>
      </div>
    </main>
  )
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <SetPasswordContent />
    </Suspense>
  )
}
