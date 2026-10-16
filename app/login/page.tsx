import Link from 'next/link'
import { AuthCard, AuthInput, AuthLayout, TurnstileBox } from '@/components/auth-layout'

export const metadata = { title: 'تسجيل الدخول | دارك', description: 'سجل دخولك إلى حسابك في دارك.' }

export default function LoginPage() {
  return (
    <AuthLayout>
      <AuthCard>
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">تسجيل الدخول</h1>
          <p className="mt-3 text-sm text-muted-foreground">أهلاً بيك تاني في دارك</p>
        </div>
        <form className="mt-8 flex flex-col gap-5">
          <AuthInput label="البريد الإلكتروني" type="email" />
          <div className="flex flex-col gap-2">
            <AuthInput label="كلمة السر" type="password" />
            <Link href="/reset-password" className="self-start text-xs font-semibold text-primary hover:underline">نسيت كلمة السر؟</Link>
          </div>
          <TurnstileBox />
          <button type="submit" className="h-12 rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90">ادخل لحسابك</button>
        </form>
        <p className="mt-7 text-center text-sm text-muted-foreground">معندكش حساب؟ <Link href="/register" className="font-bold text-primary hover:underline">سجل دلوقتي</Link></p>
      </AuthCard>
    </AuthLayout>
  )
}
