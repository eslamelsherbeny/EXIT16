'use client'

import { Suspense, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AuthCard, AuthLayout } from '@/components/auth-layout'
import {
  forgotPasswordAction,
  verifyOtpAction,
} from '@/app/actions/auth-actions'
import arDict from '@/dictionaries/ar.json'

const t = arDict.authPages.verifyOtp

function VerifyOtpContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = (searchParams.get('email') || '').trim().toLowerCase()

  const [error, setError] = useState('')
  const [resentMessage, setResentMessage] = useState('')
  const [pending, startTransition] = useTransition()
  const [resending, startResendTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setResentMessage('')
    const formData = new FormData(e.currentTarget)
    const otp = ((formData.get('otp') as string) || '').trim()

    startTransition(async () => {
      const result = await verifyOtpAction(email, otp)
      if (result.success) {
        router.push(
          `/reset-password/new?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`
        )
      } else {
        setError(result.error || t.invalidOtpError)
      }
    })
  }

  const handleResend = () => {
    if (!email) return
    setError('')
    setResentMessage('')
    const fd = new FormData()
    fd.set('email', email)

    startResendTransition(async () => {
      const result = await forgotPasswordAction(fd)
      if (result.success) {
        setResentMessage(t.resentSuccess)
      } else {
        setError(result.error || t.resendError)
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
            {t.subtitlePrefix}{' '}
            <span className="font-bold text-foreground">
              {email || t.emailFallback}
            </span>
          </p>
        </div>

        {resentMessage && (
          <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-center text-xs font-bold text-emerald-700">
            {resentMessage}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 p-3 text-center text-xs font-bold text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          <div>
            <label
              htmlFor="otp"
              className="mb-2 block text-xs font-bold text-foreground"
            >
              {t.otpLabel}
            </label>
            <input
              id="otp"
              name="otp"
              type="text"
              inputMode="numeric"
              dir="ltr"
              maxLength={6}
              required
              className="h-12 w-full rounded-xl border border-input bg-background px-4 text-center text-lg font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#007a5a)]"
              placeholder="123456"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="h-12 rounded-xl bg-[var(--brand-primary,#007a5a)] px-5 text-sm font-bold text-white transition hover:bg-[var(--brand-primary-hover,#006248)] disabled:opacity-50"
          >
            {pending ? t.verifyingBtn : t.verifyBtn}
          </button>
        </form>

        <div className="mt-7 flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="font-bold text-[var(--brand-primary,#007a5a)] hover:underline disabled:opacity-50"
          >
            {resending ? t.resendingBtn : t.resendBtn}
          </button>
          <Link
            href="/reset-password"
            className="text-xs text-muted-foreground hover:underline"
          >
            {t.changeEmailLink}
          </Link>
        </div>
      </AuthCard>
    </AuthLayout>
  )
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={null}>
      <VerifyOtpContent />
    </Suspense>
  )
}
