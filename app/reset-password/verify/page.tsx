'use client'

import { Suspense, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AuthCard, AuthLayout } from '@/components/auth-layout'
import { forgotPasswordAction, verifyOtpAction } from '@/app/actions/auth-actions'

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
        router.push(`/reset-password/new?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`)
      } else {
        setError(result.error || 'الكود غير صحيح.')
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
        setResentMessage('تم إرسال كود جديد إلى بريدك الإلكتروني بنجاح.')
      } else {
        setError(result.error || 'تعذر إعادة إرسال الكود.')
      }
    })
  }

  return (
    <AuthLayout>
      <AuthCard>
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">إدخال كود التحقق</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            أدخل الكود المكون من 6 أرقام الذي أرسلناه إلى{' '}
            <span className="font-bold text-foreground">{email || 'بريدك الإلكتروني'}</span>
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
            <label htmlFor="otp" className="mb-2 block text-xs font-bold text-foreground">
              كود التحقق (OTP)
            </label>
            <input
              id="otp"
              name="otp"
              type="text"
              inputMode="numeric"
              dir="ltr"
              maxLength={6}
              required
              className="h-12 w-full rounded-xl border border-input bg-background px-4 text-center text-lg font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="123456"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="h-12 rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? 'جاري التحقق...' : 'تأكيد الكود'}
          </button>
        </form>

        <div className="mt-7 flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="font-bold text-primary hover:underline disabled:opacity-50"
          >
            {resending ? 'جاري إعادة الإرسال...' : 'إعادة إرسال الكود'}
          </button>
          <Link href="/reset-password" className="text-xs text-muted-foreground hover:underline">
            تغيير البريد الإلكتروني
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