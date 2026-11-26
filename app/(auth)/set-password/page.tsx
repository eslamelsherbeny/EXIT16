'use client'

import { Suspense, useEffect, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { AuthCard, AuthLayout } from '@/components/layouts/auth-layout'
import { setNewPasswordFromTokenAction } from '@/actions/submit-forms'
import { useTranslation } from '@/lib/i18n'

function getSafeInternalNext(raw: string | null): string {
  const clean = String(raw || '').trim()
  if (
    clean &&
    clean.startsWith('/') &&
    !clean.startsWith('//') &&
    !clean.startsWith('/\\') &&
    !clean.startsWith('/admin')
  ) {
    return clean
  }
  return '/account'
}

function SetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialToken = searchParams.get('token_hash') || ''
  const safeNextUrl = getSafeInternalNext(searchParams.get('next'))

  const { t: dict, dir } = useTranslation()
  const t = dict.authPages.setPassword
  const c = dict.authPages.common

  const [tokenHash, setTokenHash] = useState(initialToken)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  // إزالة التوكن من شريط العنوان فور حفظه في الذاكرة لمنع تسريبه في سجل المتصفح
  useEffect(() => {
    if (initialToken) {
      setTokenHash(initialToken)
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', '/set-password')
      }
    }
  }, [initialToken])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!tokenHash) {
      setError(t.genericError)
      return
    }
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
        router.replace(`/sell?editUnitId=${encodeURIComponent(res.unitId)}`)
      } else {
        router.replace(safeNextUrl)
      }
      router.refresh()
    })
  }

  return (
    <AuthLayout>
      <AuthCard>
        <div dir={dir}>
          <div className="text-center">
            <h1 className="text-2xl font-black text-[var(--brand-navy,#0a1122)] sm:text-3xl">
              {t.title}
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
              {t.subtitle}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-5">
            <div>
              <label className="mb-2 block text-start text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                {t.passwordLabel}
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  dir="ltr"
                  required
                  minLength={8}
                  maxLength={128}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 w-full rounded-xl border border-input bg-background pr-11 pl-4 text-left text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#007a5a)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute top-1/2 right-3.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPass ? c.hidePassAria : c.showPassAria}
                >
                  {showPass ? (
                    <EyeOff className="size-5" />
                  ) : (
                    <Eye className="size-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-start text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                {t.confirmLabel}
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                dir="ltr"
                required
                minLength={8}
                maxLength={128}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-12 w-full rounded-xl border border-input bg-background px-4 text-left text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#007a5a)]"
              />
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 p-3 text-center text-xs font-bold text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary,#007a5a)] text-sm font-bold text-white transition active:scale-[0.98] hover:bg-[var(--brand-primary-hover,#006248)] disabled:opacity-60"
            >
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>{t.submittingBtn}</span>
                </>
              ) : (
                <span>{t.submitBtn}</span>
              )}
            </button>
          </form>
        </div>
      </AuthCard>
    </AuthLayout>
  )
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <SetPasswordContent />
    </Suspense>
  )
}