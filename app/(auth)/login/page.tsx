'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'
import {
  AuthCard,
  AuthLayout,
  TurnstileBox,
} from '@/components/layouts/auth-layout'
import { toEnglishDigits } from '@/components/features/seller/seller-shared'
import { loginAction, verifyAccountAction } from '@/actions/auth-actions'
import { useTranslation } from '@/lib/i18n'

function LoginContent() {
  const router = useRouter()
  const { t: dict, locale, dir } = useTranslation()
  const t = dict.authPages.login as Record<string, any>
  const c = dict.authPages.common

  const searchParams = useSearchParams()
  const isVerifiedParam = searchParams.get('verified') === '1'
  const defaultEmail = searchParams.get('email') || ''
  const verifyToken = searchParams.get('token') || ''
  const nextUrl = searchParams.get('next') || ''
  const isAdminRedirect = nextUrl.startsWith('/admin')

  const [identifier, setIdentifier] = useState(defaultEmail)
  const [error, setError] = useState('')
  const [verifiedSuccess, setVerifiedSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (defaultEmail) setIdentifier(defaultEmail)
  }, [defaultEmail])

  useEffect(() => {
    setError('')
  }, [locale])

  useEffect(() => {
    if (isVerifiedParam && defaultEmail && verifyToken) {
      verifyAccountAction(defaultEmail, verifyToken).then((res) => {
        if (res.success) setVerifiedSuccess(true)
      })
    }
  }, [isVerifiedParam, defaultEmail, verifyToken])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setPending(true)

    try {
      const formData = new FormData(e.currentTarget)
      const normalizedId = toEnglishDigits(identifier).trim()
      formData.set('emailOrPhone', normalizedId)
      if (nextUrl) {
        formData.set('nextUrl', nextUrl)
      }

      const result = await loginAction(formData)

      if (result.success) {
        const target = result.redirectTo || (nextUrl ? nextUrl : '/account')
        router.refresh()
        setTimeout(() => {
          window.location.href = target
        }, 120)
        return
      } else {
        setError(result.error || t.invalidCredentialsError)
        setPending(false)
      }
    } catch {
      setError(t.connectionError)
      setPending(false)
    }
  }

  return (
    <AuthLayout>
      <AuthCard>
        <div dir={dir}>
          {isAdminRedirect && (
            <div className="mb-4 flex items-center justify-center gap-2 rounded-xl border border-[#007a5a]/25 bg-[#eaf8f2] px-3.5 py-2.5 text-xs font-extrabold text-[#007a5a]">
              <ShieldCheck className="size-4 shrink-0" />
              <span>
                {t.adminLoginBanner ||
                  dict.admin?.accessDenied?.staffLoginBtn}
              </span>
            </div>
          )}

          <div className="text-center">
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--brand-navy,#0a1122)] sm:text-3xl">
              {t.title}
            </h1>
            <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
              {t.subtitle}
            </p>
          </div>

          {verifiedSuccess && !error && (
            <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-center text-xs font-bold text-emerald-700">
              {t.verifiedBanner}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-center text-xs font-bold text-red-600"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <input type="hidden" name="nextUrl" value={nextUrl} />

            <div>
              <label
                htmlFor="emailOrPhone"
                className="mb-2 block text-start text-xs font-bold text-foreground"
              >
                {t.identifierLabel}
              </label>
              <input
                id="emailOrPhone"
                name="emailOrPhone"
                type="text"
                dir="ltr"
                maxLength={160}
                value={identifier}
                onChange={(e) =>
                  setIdentifier(toEnglishDigits(e.target.value))
                }
                required
                className="h-12 w-full rounded-xl border border-input bg-background px-4 text-left text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#007a5a)]"
                placeholder={t.identifierPlaceholder}
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-xs font-bold text-foreground"
                >
                  {t.passwordLabel}
                </label>
                <Link
                  href="/reset-password"
                  className="text-xs font-bold text-[var(--brand-primary,#007a5a)] hover:underline"
                >
                  {t.forgotPassLink}
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  dir="ltr"
                  maxLength={128}
                  required
                  className={`h-12 w-full rounded-xl border border-input bg-background pr-11 pl-4 text-left text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#007a5a)] ${
                    showPassword ? 'tracking-normal' : 'tracking-widest'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute top-1/2 right-3.5 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                  aria-label={showPassword ? c.hidePassAria : c.showPassAria}
                >
                  {showPassword ? (
                    <EyeOff className="size-5" />
                  ) : (
                    <Eye className="size-5" />
                  )}
                </button>
              </div>
            </div>

            <TurnstileBox />

            <button
              type="submit"
              disabled={pending}
              className="mt-1 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary,#007a5a)] px-5 text-sm font-bold text-white shadow-xs transition active:scale-[0.98] hover:bg-[var(--brand-primary-hover,#006248)] disabled:opacity-60"
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

          <p className="mt-7 text-center text-sm text-muted-foreground">
            {t.noAccountText}{' '}
            <Link
              href="/register"
              className="font-bold text-[var(--brand-primary,#007a5a)] hover:underline"
            >
              {t.registerNowLink}
            </Link>
          </p>
        </div>
      </AuthCard>
    </AuthLayout>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  )
}