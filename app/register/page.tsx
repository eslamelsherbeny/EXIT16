import Link from 'next/link'
import { AuthCard, AuthInput, AuthLayout, TurnstileBox } from '@/components/auth-layout'

export default function RegisterPage() {
  return (
    <AuthLayout>
      <AuthCard>
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">إنشاء حساب</h1>
          <p className="mt-3 text-sm text-muted-foreground">ابدأ رحلتك العقارية مع دارك</p>
        </div>
        <form className="mt-8 flex flex-col gap-4">
          <AuthInput label="الاسم بالكامل" />
          <label className="flex flex-col gap-2 text-sm font-semibold text-foreground">رقم الموبايل
            <span className="flex h-12 overflow-hidden rounded-lg border border-border bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
              <input type="tel" className="min-w-0 flex-1 px-4 text-sm font-normal outline-none" aria-label="رقم الموبايل" />
              <select defaultValue="+20" aria-label="كود الدولة" className="border-r border-border bg-muted px-3 text-sm outline-none"><option>+20</option><option>+971</option><option>+966</option></select>
            </span>
          </label>
          <AuthInput label="البريد الإلكتروني" type="email" highlighted />
          <div>
            <AuthInput label="كلمة السر" type="password" highlighted />
            <p className="mt-2 text-xs text-muted-foreground">8 أحرف على الأقل</p>
          </div>
          <TurnstileBox />
          <button type="submit" className="mt-1 h-12 rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90">أنشئ حسابك</button>
        </form>
        <p className="mt-4 text-center text-[11px] leading-5 text-muted-foreground">بإنشاء حساب، أنت توافق على شروط الاستخدام وسياسة الخصوصية.</p>
        <p className="mt-6 text-center text-sm text-muted-foreground">عندك حساب؟ <Link href="/login" className="font-bold text-primary hover:underline">ادخل من هنا</Link></p>
      </AuthCard>
    </AuthLayout>
  )
}
