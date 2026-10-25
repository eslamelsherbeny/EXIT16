'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import {
  AuthCard,
  AuthLayout,
  TurnstileBox,
} from '@/components/layouts/auth-layout'
import { forgotPasswordAction } from '@/actions/auth-actions'
import { useTranslation } from '@/lib/i18n'

export default function ResetPasswordPage() {
  const router = useRouter()
  const { t: dict, dir } = useTranslation()
  const t = dict.authPages.resetRequest
  const c = dict.authPages.common

  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)
    const rawEmail = (formData.get('email') as string) || ''
    const cleanEmail = rawEmail.trim().toLowerCase()

    startTransition(async () => {
      const result = await forgotPasswordAction(formData)
      if (result.success) {
        router.push(
          `/reset-password/verify?email=${encodeURIComponent(cleanEmail)}`
        )
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
            <p className="mt-3 text-xs leading-6 text-muted-foreground sm:text-sm">
              {t.subtitle}
            </p>
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 p-3 text-center text-xs font-bold text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
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
                required
                className="h-12 w-full rounded-xl border border-input bg-background px-4 text-left text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#007a5a)]"
                placeholder="name@example.com"
              />
            </div>

            <TurnstileBox />

            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary,#007a5a)] px-5 text-sm font-bold text-white transition active:scale-[0.98] hover:bg-[var(--brand-primary-hover,#006248)] disabled:opacity-60"
            >
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>{t.sendingBtn}</span>
                </>
              ) : (
                <span>{t.sendOtpBtn}</span>
              )}
            </button>
          </form>

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