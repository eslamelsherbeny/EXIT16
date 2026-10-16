import Link from 'next/link'
import { AuthCard, AuthLayout } from '@/components/auth-layout'
import { AuthForm } from '@/components/auth-form'

export const metadata = { title: 'إنشاء حساب | دارك', description: 'أنشئ حسابك وابدأ رحلتك العقارية مع دارك.' }

export default function RegisterPage() {
  return (
    <AuthLayout>
      <AuthCard>
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">إنشاء حساب</h1>
          <p className="mt-3 text-sm text-muted-foreground">ابدأ رحلتك العقارية مع دارك</p>
        </div>
        <AuthForm mode="register" />
        <p className="mt-4 text-center text-[11px] leading-5 text-muted-foreground">بإنشاء حساب، أنت توافق على شروط الاستخدام وسياسة الخصوصية.</p>
        <p className="mt-6 text-center text-sm text-muted-foreground">عندك حساب؟ <Link href="/login" className="font-bold text-primary hover:underline">ادخل من هنا</Link></p>
      </AuthCard>
    </AuthLayout>
  )
}
