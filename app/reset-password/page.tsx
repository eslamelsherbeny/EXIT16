import Link from 'next/link'
import { AuthCard, AuthInput, AuthLayout } from '@/components/auth-layout'

export const metadata = { title: 'استرجاع كلمة السر | دارك', description: 'استرجع الوصول إلى حسابك في دارك.' }

export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <AuthCard>
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">استرجاع كلمة السر</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">اكتب بريدك الإلكتروني وهنبعتلك رابط الاسترجاع</p>
        </div>
        <form className="mt-8 flex flex-col gap-5">
          <AuthInput label="بريدك الإلكتروني" type="email" />
          <button type="submit" className="h-12 rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90">ابعت رابط الاسترجاع</button>
        </form>
        <p className="mt-7 text-center text-sm text-muted-foreground"><Link href="/login" className="font-bold text-primary hover:underline">رجوع لتسجيل الدخول</Link></p>
      </AuthCard>
    </AuthLayout>
  )
}
