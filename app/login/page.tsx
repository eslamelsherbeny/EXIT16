'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { AuthCard, AuthLayout } from '@/components/auth-layout'
import { loginAction, verifyAccountAction } from '@/app/actions/auth-actions'

function LoginContent() {
  const searchParams = useSearchParams()
  const isVerifiedParam = searchParams.get('verified') === '1'
  const defaultEmail = searchParams.get('email') || ''
  const verifyToken = searchParams.get('token') || ''

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
      const result = await loginAction(formData)

      if (result.success) {
        // تحويل إجباري مباشر مع تحديث كامل لحالة الموقع والهيدر
        window.location.replace((result as any).redirectTo || '/')
        return
      } else {
        setError(result.error || 'بيانات الدخول غير صحيحة، يرجى المحاولة مرة أخرى.')
        setPending(false)
      }
    } catch {
      setError('حدث خطأ أثناء الاتصال، يرجى المحاولة مرة أخرى.')
      setPending(false)
    }
  }

  return (
    <AuthLayout>
      <AuthCard>
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">تسجيل الدخول</h1>
          <p className="mt-3 text-sm text-muted-foreground">أهلاً بيك تاني في دارك</p>
        </div>

        {verifiedSuccess && !error && (
          <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-center text-xs font-bold text-emerald-700">
            تم تأكيد وتوثيق حسابك بنجاح! يمكنك تسجيل الدخول الآن.
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 p-3 text-center text-xs font-bold text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label htmlFor="emailOrPhone" className="mb-2 block text-xs font-bold text-foreground">
              البريد الإلكتروني أو رقم الموبايل
            </label>
            <input
              id="emailOrPhone"
              name="emailOrPhone"
              type="text"
              dir="ltr"
              defaultValue={defaultEmail}
              required
              className="h-12 w-full rounded-xl border border-input bg-background px-4 text-left text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="name@example.com أو 01xxxxxxxxx"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="password" className="text-xs font-bold text-foreground">
                كلمة السر
              </label>
              <Link href="/reset-password" className="text-xs font-bold text-primary hover:underline">
                نسيت كلمة السر؟
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                dir="ltr"
                required
                className={`h-12 w-full rounded-xl border border-input bg-background pl-4 pr-11 text-left text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary ${
                  showPassword ? 'tracking-normal' : 'tracking-widest'
                }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                aria-label={showPassword ? 'إخفاء كلمة السر' : 'إظهار كلمة السر'}
              >
                {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="mt-2 h-12 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-muted-foreground">
          معندكش حساب؟{' '}
          <Link href="/register" className="font-bold text-primary hover:underline">
            سجل دلوقتي
          </Link>
        </p>
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