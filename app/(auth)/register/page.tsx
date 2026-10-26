'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import {
  AuthCard,
  AuthLayout,
  TurnstileBox,
} from '@/components/layouts/auth-layout'
import { CountrySelector } from '@/components/shared/country-selector'
import { toEnglishDigits } from '@/components/features/seller/seller-shared'
import { registerAction } from '@/actions/auth-actions'
import { useTranslation } from '@/lib/i18n'

export default function RegisterPage() {
  const router = useRouter()
  const { t: dict, locale, dir } = useTranslation()
  const t = dict.authPages.register
  const c = dict.authPages.common

  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [pending, startTransition] = useTransition()

  const [phoneCode, setPhoneCode] = useState('995')
  const [countryIso, setCountryIso] = useState('GE')
  const [phoneNumber, setPhoneNumber] = useState('')

  useEffect(() => {
    setError('')
  }, [locale])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)

    const cleanPhone = toEnglishDigits(phoneNumber)
      .replace(/^0+/, '')
      .replace(/\D/g, '')
      .trim()
    formData.set('phone', `+${phoneCode.replace('+', '')}${cleanPhone}`)
    formData.set('country', countryIso || 'GE')

    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
      setError(t.passwordsMismatchError)
      return
    }

    startTransition(async () => {
      const result = await registerAction(formData)
      if (result.success) {
        router.replace(result.redirectTo || '/account')
        router.refresh()
      } else {
        setError(result.error || t.genericError)
      }
    })
  }

  return (
    <AuthLayout>
      <AuthCard>
        <div dir={dir}>
          <div className="text-center">
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--brand-navy,#0a1122)] sm:text-3xl">
              {t.title}
            </h1>
            <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
              {t.subtitle}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-center text-xs font-bold text-red-600"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-start text-xs font-bold text-foreground"
              >
                {t.nameLabel}
              </label>
              <input
                id="name"
                name="name"
                type="text"
                maxLength={120}
                required
                className="h-12 w-full rounded-xl border border-input bg-background px-4 text-start text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#007a5a)]"
                placeholder={t.namePlaceholder}
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-start text-xs font-bold text-foreground"
              >
                {t.phoneLabel}
              </label>
              <div dir="ltr" className="flex items-center gap-2">
                <CountrySelector
                  value={phoneCode}
                  onChange={(code, iso) => {
                    setPhoneCode(code)
                    if (iso) setCountryIso(iso)
                  }}
                />
                <input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  dir="ltr"
                  maxLength={20}
                  value={phoneNumber}
                  onChange={(e) =>
                    setPhoneNumber(toEnglishDigits(e.target.value))
                  }
                  required
                  className="h-12 flex-1 rounded-xl border border-input bg-background px-4 text-left text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#007a5a)]"
                  placeholder="5xx xx xx xx"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-start text-xs font-bold text-foreground"
              >
                {t.emailLabel}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                dir="ltr"
                maxLength={160}
                required
                className="h-12 w-full rounded-xl border border-input bg-background px-4 text-left text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#007a5a)]"
                placeholder="name@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-start text-xs font-bold text-foreground"
              >
                {t.passwordLabel}
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  dir="ltr"
                  required
                  minLength={8}
                  maxLength={128}
                  className={`h-12 w-full rounded-xl border border-input bg-background pr-11 pl-4 text-left text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#007a5a)] ${
                    showPassword ? 'tracking-normal' : 'tracking-widest'
                  }`}
                  placeholder={t.passwordPlaceholder}
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

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-start text-xs font-bold text-foreground"
              >
                {t.confirmPasswordLabel}
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  dir="ltr"
                  required
                  minLength={8}
                  maxLength={128}
                  className={`h-12 w-full rounded-xl border border-input bg-background pr-11 pl-4 text-left text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#007a5a)] ${
                    showConfirmPassword ? 'tracking-normal' : 'tracking-widest'
                  }`}
                  placeholder={t.confirmPasswordPlaceholder}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute top-1/2 right-3.5 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                  aria-label={
                    showConfirmPassword ? c.hidePassAria : c.showPassAria
                  }
                >
                  {showConfirmPassword ? (
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

          <p className="mt-4 text-center text-[11px] leading-5 text-muted-foreground">
            {t.termsNote}
          </p>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t.haveAccountText}{' '}
            <Link
              href="/login"
              className="font-bold text-[var(--brand-primary,#007a5a)] hover:underline"
            >
              {t.loginHereLink}
            </Link>
          </p>
        </div>
      </AuthCard>
    </AuthLayout>
  )
}