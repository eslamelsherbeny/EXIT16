'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ChevronDown, Eye, EyeOff } from 'lucide-react'
import { AuthCard, AuthLayout } from '@/components/auth-layout'
import { registerAction } from '@/app/actions/auth-actions'

// قائمة الدول وأكواد الاتصال مع الأعلام
const COUNTRIES = [
  { code: '+20', flag: '🇪🇬', name: 'مصر' },
  { code: '+966', flag: '🇸🇦', name: 'السعودية' },
  { code: '+971', flag: '🇦🇪', name: 'الإمارات' },
  { code: '+965', flag: '🇰🇼', name: 'الكويت' },
  { code: '+974', flag: '🇶🇦', name: 'قطر' },
  { code: '+973', flag: '🇧🇭', name: 'البحرين' },
  { code: '+968', flag: '🇴🇲', name: 'عمان' },
  { code: '+962', flag: '🇯🇴', name: 'الأردن' },
  { code: '+1', flag: '🇺🇸', name: 'أمريكا/كندا' },
  { code: '+44', flag: '🇬🇧', name: 'بريطانيا' },
  { code: '+7', flag: '🇷🇺', name: 'روسيا' },
  { code: '+995', flag: '🇬🇪', name: 'جورجيا' },
]

export default function RegisterPage() {
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [pending, startTransition] = useTransition()

  // حالات خاصة برقم الموبايل
  const [countryCode, setCountryCode] = useState('+20')
  const [phoneNumber, setPhoneNumber] = useState('')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)

    // تجميع الرقم مع كود الدولة وإزالة أي أصفار في البداية كتبها العميل بالخطأ
    const cleanPhone = phoneNumber.replace(/^0+/, '')
    formData.set('phone', `${countryCode}${cleanPhone}`)

    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
      setError('كلمتا السر غير متطابقتين.')
      return
    }

    startTransition(async () => {
      const result = await registerAction(formData)
      if (result.success) {
        window.location.href = '/account'
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
            <label htmlFor="name" className="mb-2 block text-xs font-bold text-foreground">
              الاسم
            </label>
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
            <label htmlFor="phone" className="mb-2 block text-xs font-bold text-foreground">
              رقم الموبايل
            </label>
            <div className="flex gap-2">
              <input
                id="phone"
                type="tel"
                dir="ltr"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                className="h-12 flex-1 rounded-xl border border-input bg-background px-4 text-left text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="1xxxxxxxxx"
              />
              <div className="relative">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="h-12 appearance-none rounded-xl border border-input bg-background pr-3 pl-8 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code + c.name} value={c.code}>
                      {c.flag} {c.name} {c.code}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-xs font-bold text-foreground">
              البريد الإلكتروني
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

          <div>
            <label htmlFor="password" className="mb-2 block text-xs font-bold text-foreground">
              كلمة السر
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                dir="ltr"
                required
                minLength={8}
                className={`h-12 w-full rounded-xl border border-input bg-background pl-4 pr-11 text-left text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary ${
                  showPassword ? 'tracking-normal' : 'tracking-widest'
                }`}
                placeholder="8 أحرف على الأقل"
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

          <div>
            <label htmlFor="confirmPassword" className="mb-2 block text-xs font-bold text-foreground">
              تأكيد كلمة السر
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                dir="ltr"
                required
                minLength={8}
                className={`h-12 w-full rounded-xl border border-input bg-background pl-4 pr-11 text-left text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary ${
                  showConfirmPassword ? 'tracking-normal' : 'tracking-widest'
                }`}
                placeholder="أعد إدخال كلمة السر"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                aria-label={showConfirmPassword ? 'إخفاء كلمة السر' : 'إظهار كلمة السر'}
              >
                {showConfirmPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
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
          عندك حساب؟{' '}
          <Link href="/login" className="font-bold text-primary hover:underline">
            ادخل من هنا
          </Link>
        </p>
      </AuthCard>
    </AuthLayout>
  )
}