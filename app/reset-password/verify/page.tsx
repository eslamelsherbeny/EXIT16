'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AuthCard, AuthLayout } from '@/components/auth-layout'
import { verifyOtpAction } from '@/app/actions/auth-actions'

export default function VerifyOtpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)
    const otp = formData.get('otp') as string

    startTransition(async () => {
      const result = await verifyOtpAction(email, otp)
      if (result.success) {
        router.push(`/reset-password/new?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`)
      } else {
        setError(result.error || 'الكود غير صحيح.')
      }
    })
  }

  return (
    <AuthLayout>
      <AuthCard>
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">إدخال كود التحقق</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            أدخل الكود المكون من 6 أرقام الذي أرسلناه إلى <span className="font-bold text-foreground">{email}</span>
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 p-3 text-center text-xs font-bold text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          <div>
            <label htmlFor="otp" className="mb-2 block text-xs font-bold text-foreground">كود التحقق (OTP)</label>
            <input 
              id="otp" 
              name="otp" 
              type="text" 
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

        <p className="mt-7 text-center text-sm text-muted-foreground">
          <Link href="/reset-password" className="font-bold text-primary hover:underline">إعادة إرسال الكود</Link>
        </p>
      </AuthCard>
    </AuthLayout>
  )
}