'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { AuthCard, AuthLayout, TurnstileBox } from '@/components/auth-layout'
import { loginAction, verifyAccountAction } from '@/app/actions/auth-actions'
import { useTranslation } from '@/lib/i18n'

function LoginContent() {
  const { t: dict, locale, dir } = useTranslation()
  const t = dict.authPages.login
  const c = dict.authPages.common

  const searchParams = useSearchParams()
  const isVerifiedParam = searchParams.get('verified') === '1'
  const defaultEmail = searchParams.get('email') || ''
  const verifyToken = searchParams.get('token') || ''
  const nextUrl = searchParams.get('next') || ''
  const isAdminRedirect = nextUrl.startsWith('/admin')

  const [error, setError] = useState('')
  const [verifiedSuccess, setVerifiedSuccess] = useState(isVerifiedParam)
  const [showPassword, setShowPassword] = useState(false)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (isVerifiedParam && defaultEmail) {
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
      if (nextUrl) {
        formData.set('nextUrl', nextUrl)
      }
      const result = await loginAction(formData)

      if (result.success) {
        window.location.replace(result.redirectTo || '/')
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
                {locale === 'ar'
                  ? 'يرجى تسجيل الدخول بحساب الإدارة للمتابعة'
                  : 'Please sign in with an Admin account to continue'}
              </span>
            </div>
          )}

          <div className="text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--brand-navy,#0a1122)]">
              {t.title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{t.subtitle}</p>
          </div>

          {verifiedSuccess && !error && (
            <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-center text-xs font-bold text-emerald-700">
              {t.verifiedBanner}
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 p-3 text-center text-xs font-bold text-red-600">
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
                defaultValue={defaultEmail}
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
              className="mt-1 h-12 rounded-xl bg-[var(--brand-primary,#007a5a)] px-5 text-sm font-bold text-white transition hover:bg-[var(--brand-primary-hover,#006248)] disabled:opacity-50"
            >
              {pending ? t.submittingBtn : t.submitBtn}
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
