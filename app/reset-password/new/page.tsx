'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AuthCard, AuthLayout } from '@/components/auth-layout'
import { resetPasswordAction } from '@/app/actions/auth-actions'

export default function NewPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const otp = searchParams.get('otp') || ''

  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [pending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
      setError('كلمتا السر غير متطابقتين.')
      return
    }

    startTransition(async () => {
      const result = await resetPasswordAction(email, otp, password)
      if (result.success) {
        setSuccess(true)
        setTimeout(() => router.push('/login'), 2000)
      } else {
        setError(result.error || 'تعذر تغيير كلمة السر.')
      }
    })
  }

  return (
    <AuthLayout>
      <AuthCard>
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">كلمة سر جديدة</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">أدخل كلمة السر الجديدة لحسابك</p>
        </div>

        {success ? (
          <div className="mt-8 rounded-xl bg-emerald-50 p-4 text-center text-sm font-bold text-emerald-700">
            تم تغيير كلمة السر بنجاح! جاري تحويلك لتسجيل الدخول...
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
                <label htmlFor="password" className="mb-2 block text-xs font-bold text-foreground">كلمة السر الجديدة</label>
                <input 
                  id="password" 
                  name="password" 
                  type="password" 
                  dir="ltr"
                  required 
                  minLength={8}
                  className="h-12 w-full rounded-xl border border-input bg-background px-4 text-left text-sm font-medium tracking-widest focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="8 أحرف على الأقل"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="mb-2 block text-xs font-bold text-foreground">تأكيد كلمة السر</label>
                <input 
                  id="confirmPassword" 
                  name="confirmPassword" 
                  type="password" 
                  dir="ltr"
                  required 
                  minLength={8}
                  className="h-12 w-full rounded-xl border border-input bg-background px-4 text-left text-sm font-medium tracking-widest focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="أعد إدخال كلمة السر"
                />
              </div>

              <button 
                type="submit" 
                disabled={pending}
                className="h-12 rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {pending ? 'جاري الحفظ...' : 'حفظ كلمة السر الجديدة'}
              </button>
            </form>
          </>
        )}

        <p className="mt-7 text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-bold text-primary hover:underline">رجوع لتسجيل الدخول</Link>
        </p>
      </AuthCard>
    </AuthLayout>
  )
}