'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AuthCard, AuthLayout } from '@/components/auth-layout'
import { registerAction } from '@/app/actions/auth-actions'

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await registerAction(formData)
      if (result.success) {
        router.push('/account')
      } else {
        setError(result.error || 'حدث خطأ أثناء إنشاء الحساب.')
      }
    })
  }

  return (
    <AuthLayout>
      <AuthCard>
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">إنشاء حساب</h1>
          <p className="mt-3 text-sm text-muted-foreground">ابدأ رحلتك العقارية مع دارك</p>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 p-3 text-center text-xs font-bold text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label htmlFor="name" className="mb-2 block text-xs font-bold text-foreground">الاسم</label>
            <input 
              id="name" 
              name="name" 
              type="text" 
              required 
              className="h-12 w-full rounded-xl border border-input bg-background px-4 text-right text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="الاسم الكامل"
            />
          </div>

          <div>
            <label htmlFor="phone" className="mb-2 block text-xs font-bold text-foreground">رقم الموبايل</label>
            <input 
              id="phone" 
              name="phone" 
              type="tel" 
              dir="ltr"
              required 
              className="h-12 w-full rounded-xl border border-input bg-background px-4 text-left text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="01xxxxxxxxx"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-xs font-bold text-foreground">البريد الإلكتروني</label>
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

          <div>
            <label htmlFor="password" className="mb-2 block text-xs font-bold text-foreground">كلمة السر</label>
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

          <button 
            type="submit" 
            disabled={pending}
            className="mt-2 h-12 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
          </button>
        </form>

        <p className="mt-4 text-center text-[11px] leading-5 text-muted-foreground">
          بإنشاء حساب، أنت توافق على شروط الاستخدام وسياسة الخصوصية.
        </p>
        
        <p className="mt-6 text-center text-sm text-muted-foreground">
          عندك حساب؟ <Link href="/login" className="font-bold text-primary hover:underline">ادخل من هنا</Link>
        </p>
      </AuthCard>
    </AuthLayout>
  )
}