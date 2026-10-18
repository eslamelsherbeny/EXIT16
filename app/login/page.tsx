'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AuthCard, AuthLayout } from '@/components/auth-layout'
import { loginAction } from '@/app/actions/auth-actions'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await loginAction(formData)
      if (result.success) {
        router.push('/account')
      } else {
        setError(result.error || 'حدث خطأ أثناء تسجيل الدخول.')
      }
    })
  }

  return (
    <AuthLayout>
      <AuthCard>
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">تسجيل الدخول</h1>
          <p className="mt-3 text-sm text-muted-foreground">أهلاً بيك تاني في دارك</p>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 p-3 text-center text-xs font-bold text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label htmlFor="emailOrPhone" className="mb-2 block text-xs font-bold text-foreground">البريد الإلكتروني أو رقم الموبايل</label>
            <input 
              id="emailOrPhone" 
              name="emailOrPhone" 
              type="text" 
              dir="ltr"
              required 
              className="h-12 w-full rounded-xl border border-input bg-background px-4 text-left text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="name@example.com أو 01xxxxxxxxx"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="password" className="text-xs font-bold text-foreground">كلمة السر</label>
              <Link href="/reset-password" className="text-xs font-bold text-primary hover:underline">نسيت كلمة السر؟</Link>
            </div>
            <input 
              id="password" 
              name="password" 
              type="password" 
              dir="ltr"
              required 
              className="h-12 w-full rounded-xl border border-input bg-background px-4 text-left text-sm font-medium tracking-widest focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="••••••••"
            />
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
          معندكش حساب؟ <Link href="/register" className="font-bold text-primary hover:underline">سجل دلوقتي</Link>
        </p>
      </AuthCard>
    </AuthLayout>
  )
}