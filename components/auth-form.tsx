"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { login, register } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { AuthInput, TurnstileBox } from "@/components/auth-layout"

type Mode = "login" | "register"

export function AuthForm({ mode }: { mode: Mode }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const isLogin = mode === "login"
  function submit(formData: FormData) {
    setError("")
    startTransition(async () => {
      const result = isLogin ? await login(String(formData.get("email")), String(formData.get("password"))) : await register(formData)
      if (!result.success) setError(result.error ?? "تعذر إتمام الطلب.")
      else toast.success(isLogin ? "تم تسجيل الدخول بنجاح" : "تم إنشاء حسابك بنجاح")
    })
  }
  return <form action={submit} className="mt-8 flex flex-col gap-5">
    {!isLogin && <AuthInput label="الاسم بالكامل" name="full-name" required />}
    <AuthInput label="البريد الإلكتروني" name="email" type="email" required />
    <AuthInput label="كلمة السر" name="password" type="password" required />
    {!isLogin && <p className="-mt-2 text-xs text-muted-foreground">8 أحرف على الأقل</p>}
    {isLogin && <Link href="/reset-password" className="-mt-3 self-start text-xs font-semibold text-primary hover:underline">نسيت كلمة السر؟</Link>}
    <Button type="button" variant="outline" className="h-11 w-full" onClick={() => toast.info("تسجيل Google سيكون متاحاً قريباً")}>G <span>Continue with Google</span></Button>
    <TurnstileBox />
    {error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}
    <Button type="submit" disabled={pending} className="h-12 w-full">{pending ? "جاري المعالجة..." : isLogin ? "ادخل لحسابك" : "أنشئ حسابك"}</Button>
  </form>
}
