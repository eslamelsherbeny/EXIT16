'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { setNewPasswordFromTokenAction } from '@/app/actions/submit-forms'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tokenHash = searchParams.get('token_hash') || ''
  const nextUrl = searchParams.get('next') || '/account'

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('كلمة السر يجب أن تكون 8 حروف على الأقل.')
      return
    }
    if (password !== confirmPassword) {
      setError('كلمتا السر غير متطابقتين.')
      return
    }

    startTransition(async () => {
      const res = await setNewPasswordFromTokenAction({
        tokenHash,
        newPassword: password,
      })

      if (!res.success) {
        setError(res.error || 'تعذر تفعيل الحساب.')
        return
      }

      if (res.unitId) {
        router.push(`/sell?magic=${encodeURIComponent(tokenHash)}`)
      } else {
        router.push(nextUrl)
      }
    })
  }

  return (
    <main
      dir="rtl"
      className="flex min-h-[75vh] items-center justify-center bg-[#f5f7f8] px-4 py-12 text-[#0a1122]"
    >
      <div className="w-full max-w-md text-right">
        <h1 className="text-3xl font-black text-[#0a1122]">فعّل حسابك</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          اختار كلمة سر لحسابك على عقار إكزت — وهتدخل على طلبك على طول.
        </p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <div className="space-y-2">
            <Label className="block text-right text-sm font-bold text-[#0a1122]">
              كلمة السر (8 حروف على الأقل)
            </Label>
            <Input
              type="password"
              dir="ltr"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-xl border-slate-200 bg-white text-left"
            />
          </div>

          <div className="space-y-2">
            <Label className="block text-right text-sm font-bold text-[#0a1122]">
              اكتبها تاني للتأكيد
            </Label>
            <Input
              type="password"
              dir="ltr"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-12 rounded-xl border-slate-200 bg-white text-left"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 p-3 text-center text-xs font-bold text-red-600">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={pending}
            className="h-12 w-full rounded-xl bg-[#0a1122] text-sm font-bold text-white hover:bg-[#16223f]"
          >
            {pending ? 'جاري التفعيل...' : 'فعّل حسابي'}
          </Button>
        </form>
      </div>
    </main>
  )
}