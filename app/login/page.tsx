import Link from 'next/link'
import { AuthCard, AuthLayout } from '@/components/auth-layout'
import { AuthForm } from '@/components/auth-form'

export const metadata = { title: 'تسجيل الدخول | دارك', description: 'سجل دخولك إلى حسابك في دارك.' }

export default function LoginPage() {
  return (
    <AuthLayout>
      <AuthCard>
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">تسجيل الدخول</h1>
          <p className="mt-3 text-sm text-muted-foreground">أهلاً بيك تاني في دارك</p>
        </div>
        <AuthForm mode="login" />
        <p className="mt-7 text-center text-sm text-muted-foreground">معندكش حساب؟ <Link href="/register" className="font-bold text-primary hover:underline">سجل دلوقتي</Link></p>
      </AuthCard>
    </AuthLayout>
  )
}
