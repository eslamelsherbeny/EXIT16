'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthCard, AuthLayout } from '@/components/auth-layout'
import { forgotPasswordAction } from '@/app/actions/auth-actions'

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
        router.push(`/reset-password/verify?email=${encodeURIComponent(cleanEmail)}`)
      } else {
        setError(result.error || 'حدث خطأ ما، يرجى المحاولة لاحقاً.')
      }
    })
  }

  return (
    <AuthLayout>
      <AuthCard>
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">استرجاع كلمة السر</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            اكتب بريدك الإلكتروني وهنبعتلك كود الاسترجاع
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 p-3 text-center text-xs font-bold text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-xs font-bold text-foreground">
              بريدك الإلكتروني
            </label>
            <input
              id="email"
              name="email"
              type="email"
              dir="ltr"
              required
              className="h-12 w-full rounded-xl border border-input bg-background px-4 text-left text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="name@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="h-12 rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? 'جاري الإرسال...' : 'ابعت كود الاسترجاع'}
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-bold text-primary hover:underline">
            رجوع لتسجيل الدخول
          </Link>
        </p>
      </AuthCard>
    </AuthLayout>
  )
}