'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthCard, AuthLayout } from '@/components/auth-layout'
import { forgotPasswordAction } from '@/app/actions/auth-actions'
import arDict from '@/dictionaries/ar.json'

const t = arDict.authPages.resetRequest
const c = arDict.authPages.common

export default function ResetPasswordPage() {
  const router = useRouter()
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
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--brand-navy,#0a1122)]">
            {t.title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
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
              className="mb-2 block text-xs font-bold text-foreground"
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

          <button
            type="submit"
            disabled={pending}
            className="h-12 rounded-xl bg-[var(--brand-primary,#007a5a)] px-5 text-sm font-bold text-white transition hover:bg-[var(--brand-primary-hover,#006248)] disabled:opacity-50"
          >
            {pending ? t.sendingBtn : t.sendOtpBtn}
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
      </AuthCard>
    </AuthLayout>
  )
}
