'use client'

import { Suspense, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { AuthCard, AuthLayout } from '@/components/auth-layout'
import { resetPasswordAction } from '@/app/actions/auth-actions'
import { useTranslation } from '@/lib/i18n'

function NewPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = (searchParams.get('email') || '').trim().toLowerCase()
  const otp = (searchParams.get('otp') || '').trim()

  const { t: dict, dir } = useTranslation()
  const t = dict.authPages.newPassword
  const regT = dict.authPages.register
  const c = dict.authPages.common

  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [pending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
      setError(regT.passwordsMismatchError)
      return
    }

    startTransition(async () => {
      const result = await resetPasswordAction(email, otp, password)
      if (result.success) {
        setSuccess(true)
        setTimeout(() => router.push('/login'), 2000)
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
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--brand-navy,#0a1122)]">
              {t.title}
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {t.subtitle}
            </p>
          </div>

          {success ? (
            <div className="mt-8 rounded-xl bg-emerald-50 p-4 text-center text-sm font-bold text-emerald-700">
              {t.successBanner}
            </div>
          ) : (
            <>
              {error && (
                <div className="mt-4 rounded-xl bg-red-50 p-3 text-center text-xs font-bold text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-start text-xs font-bold text-foreground"
                  >
                    {t.newPasswordLabel}
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      dir="ltr"
                      required
                      minLength={8}
                      className={`h-12 w-full rounded-xl border border-input bg-background pr-11 pl-4 text-left text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#007a5a)] ${
                        showPassword ? 'tracking-normal' : 'tracking-widest'
                      }`}
                      placeholder={regT.passwordPlaceholder}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute top-1/2 right-3.5 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                      aria-label={
                        showPassword ? c.hidePassAria : c.showPassAria
                      }
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
                      className={`h-12 w-full rounded-xl border border-input bg-background pr-11 pl-4 text-left text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#007a5a)] ${
                        showConfirmPassword
                          ? 'tracking-normal'
                          : 'tracking-widest'
                      }`}
                      placeholder={regT.confirmPasswordPlaceholder}
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

                <button
                  type="submit"
                  disabled={pending}
                  className="h-12 rounded-xl bg-[var(--brand-primary,#007a5a)] px-5 text-sm font-bold text-white transition hover:bg-[var(--brand-primary-hover,#006248)] disabled:opacity-50"
                >
                  {pending ? t.savingBtn : t.saveBtn}
                </button>
              </form>
            </>
          )}

          <p className="mt-7 text-center text-sm text-muted-foreground">
            <Link
              href="/login"
              className="font-bold text-[var(--brand-primary,#007a5a)] hover:underline"
            >
              {c.backToLogin}
            </Link>
          </p>
        </div>
      </AuthCard>
    </AuthLayout>
  )
}

export default function NewPasswordPage() {
  return (
    <Suspense fallback={null}>
      <NewPasswordContent />
    </Suspense>
  )
}
