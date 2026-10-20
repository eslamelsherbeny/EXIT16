'use client'

import { useEffect, useState } from 'react'
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  UserPlus,
} from 'lucide-react'
import {
  processSellerStep2Action,
  sendSellerRecoveryLinkAction,
  verifyExistingEmailPasswordAction,
} from '@/app/actions/submit-forms'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TurnstileBox } from '@/components/funnel-shell'
import { CountrySelector } from '@/components/country-selector'
import {
  ALL_RESIDENCE_COUNTRIES,
  Field,
  SearchableCountryField,
} from './seller-shared'

export function ContactStep({
  form,
  update,
  go,
  errors,
  setErrors,
  showPassword,
  setShowPassword,
  loggedUser,
  unitId,
  setUnitId,
  setOrderRef,
}: {
  form: Record<string, string>
  update: (key: string, value: string) => void
  go: (step: number) => void
  errors: Record<string, string>
  setErrors: (errs: Record<string, string>) => void
  showPassword: boolean
  setShowPassword: (value: boolean) => void
  loggedUser: { id: string; name: string; email: string; phone: string } | null
  unitId: string
  setUnitId: (id: string) => void
  setOrderRef: (ref: string) => void
}) {
  const [authTab, setAuthTab] = useState<'session' | 'register' | 'login'>(
    loggedUser ? 'session' : 'register'
  )

  useEffect(() => {
    if (loggedUser) setAuthTab('session')
  }, [loggedUser])

  const [conflictState, setConflictState] = useState<
    | null
    | {
        type: 'email_exists'
        email: string
        userId: string
        unitId: string
        orderRef: string
      }
    | {
        type: 'phone_exists'
        userId: string
        unitId: string
        orderRef: string
      }
  >(null)

  const [existingPass, setExistingPass] = useState('')
  const [showExistingPass, setShowExistingPass] = useState(false)
  const [recoveryLinkSent, setRecoveryLinkSent] = useState(false)
  const [stepError, setStepError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const proceedToStep3 = (data: {
    unitId?: string
    orderRef?: string
    name?: string
    email?: string
    phone?: string
  }) => {
    if (data.unitId) setUnitId(data.unitId)
    if (data.orderRef) setOrderRef(data.orderRef)

    if (data.name) update('name', data.name)
    if (data.email) update('email', data.email)
    if (data.phone) update('phone', data.phone)

    if (!form.developerDetails && form.developer) {
      update('developerDetails', form.developer)
    }
    if (!form.projectDetails && form.project) {
      update('projectDetails', form.project)
    }

    go(3)
  }

  const handleStep2Submit = async () => {
    setStepError('')
    const nextErrors: Record<string, string> = {}

    if (form.owner !== 'yes') {
      nextErrors.owner = 'هذا الحقل مطلوب، يرجى وضع علامة صح للمتابعة'
    }

    if (authTab === 'register') {
      if (!form.name?.trim()) nextErrors.name = 'هذا الحقل مطلوب'
      if (!form.userCountry) nextErrors.userCountry = 'يرجى اختيار دولتك'
      if (!/^[0-9٠-٩]{7,15}$/.test((form.phone ?? '').replace(/[\s-]/g, '')))
        nextErrors.phone = 'رقم الموبايل غير صحيح'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email ?? ''))
        nextErrors.email = 'الإيميل غير صحيح أو يحتوي على مسافات'
      if ((form.password?.length ?? 0) < 8)
        nextErrors.password = 'كلمة السر يجب أن تكون 8 حروف على الأقل'
    } else if (authTab === 'login') {
      if (!form.loginIdentifier?.trim())
        nextErrors.loginIdentifier = 'يرجى كتابة الإيميل أو رقم الموبايل'
      if (!form.loginPassword?.trim())
        nextErrors.loginPassword = 'يرجى كتابة كلمة السر'
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setErrors({})
    setIsLoading(true)

    try {
      const fullPhone = form.phone
        ? `+${form.countryCode ?? '20'}${form.phone.replace(/^0+/, '')}`
        : ''

      const res = await processSellerStep2Action({
        mode: authTab,
        unitCountry: form.unitCountry || 'EG',
        userCountry: form.userCountry || form.unitCountry || 'EG',
        developer: form.developer || '',
        project: form.project || '',
        contractPrice:
          Number((form.contractPrice || '').replace(/,/g, '')) || 0,
        paidAmount: Number((form.paidAmount || '').replace(/,/g, '')) || 0,
        marketPrice:
          Number((form.currentDeveloperPrice || '').replace(/,/g, '')) || 0,
        name: form.name,
        phone: fullPhone,
        email: form.email,
        password: authTab === 'login' ? form.loginPassword : form.password,
        loginIdentifier: form.loginIdentifier,
        existingUnitId: unitId || undefined,
      })

      if (res.status === 'ok') {
        proceedToStep3({
          unitId: res.unitId,
          orderRef: res.orderRef,
          name: res.userName,
          email: res.userEmail,
          phone: res.userPhone,
        })
        return
      }

      if (res.status === 'email_exists_need_password') {
        if (res.unitId) setUnitId(res.unitId)
        if (res.orderRef) setOrderRef(res.orderRef)
        setRecoveryLinkSent(false)
        setExistingPass('')
        setConflictState({
          type: 'email_exists',
          email: res.userEmail || form.email || '',
          userId: res.userId || '',
          unitId: res.unitId || '',
          orderRef: res.orderRef || 'AE-XXXXXX',
        })
        return
      }

      if (res.status === 'phone_exists_different_email') {
        if (res.unitId) setUnitId(res.unitId)
        if (res.orderRef) setOrderRef(res.orderRef)
        setRecoveryLinkSent(false)
        setConflictState({
          type: 'phone_exists',
          userId: res.userId || '',
          unitId: res.unitId || '',
          orderRef: res.orderRef || 'AE-XXXXXX',
        })
        return
      }

      setStepError(res.error || 'تعذر حفظ البيانات، يرجى المحاولة مرة أخرى.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyExistingEmail = async () => {
    if (!conflictState || conflictState.type !== 'email_exists') return
    if (!existingPass.trim()) {
      setStepError('يرجى إدخال كلمة السر الخاصة بحسابك.')
      return
    }
    setIsLoading(true)
    setStepError('')
    try {
      const res = await verifyExistingEmailPasswordAction({
        email: conflictState.email,
        password: existingPass,
      })
      if (!res.success || !res.user) {
        setStepError(res.error || 'كلمة السر غير صحيحة.')
        return
      }
      proceedToStep3({
        unitId: conflictState.unitId,
        orderRef: conflictState.orderRef,
        name: res.user.name,
        email: res.user.email,
        phone: res.user.phone,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendRecoveryEmail = async () => {
    if (!conflictState) return
    setIsLoading(true)
    setStepError('')
    try {
      const res = await sendSellerRecoveryLinkAction({
        userId: conflictState.userId,
        email:
          conflictState.type === 'email_exists'
            ? conflictState.email
            : undefined,
        unitId: conflictState.unitId,
      })
      if (res.success) {
        setRecoveryLinkSent(true)
      } else {
        setStepError(res.error || 'تعذر إرسال الرابط حالياً.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (conflictState?.type === 'email_exists') {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-right sm:p-7">
        <h3 className="text-xl font-extrabold text-[#0a1122]">
          الإيميل ده عنده حساب بالفعل
        </h3>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          طلبك اتسجّل وفريقنا هيشوفه. عشان تدخل على حسابك دلوقتي، اكتب كلمة السر
          بتاعت{' '}
          <span className="font-semibold text-[#0a1122]">
            {conflictState.email}
          </span>
          .
        </p>

        <div className="mt-5">
          <Label className="mb-2 block text-right text-sm font-bold text-[#0a1122]">
            كلمة السر بتاعتك
          </Label>
          <div className="relative">
            <Input
              type={showExistingPass ? 'text' : 'password'}
              dir="ltr"
              value={existingPass}
              onChange={(e) => setExistingPass(e.target.value)}
              className="h-12 w-full rounded-xl border-slate-200 pr-4 pl-16 text-left"
            />
            <button
              type="button"
              onClick={() => setShowExistingPass(!showExistingPass)}
              className="absolute top-1/2 left-3.5 -translate-y-1/2 text-xs font-bold text-[#1e3a8a] hover:underline"
            >
              {showExistingPass ? 'إخفاء' : 'إظهار'}
            </button>
          </div>
        </div>

        {stepError && (
          <p className="mt-3 text-right text-xs font-bold text-red-600">
            {stepError}
          </p>
        )}

        {recoveryLinkSent && (
          <p className="mt-3 text-right text-xs font-bold text-[#0b6954]">
            بعتنا رابط تعيين كلمة سر جديدة على إيميلك. لو مالقتهوش خلال دقيقة، بص
            في السبام.
          </p>
        )}

        <Button
          type="button"
          disabled={isLoading}
          onClick={handleVerifyExistingEmail}
          className="mt-5 h-12 w-full rounded-xl bg-[#0b6954] text-sm font-bold text-white hover:bg-[#095443]"
        >
          {isLoading ? 'جاري الدخول...' : 'ادخل على حسابك'}
        </Button>

        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setConflictState(null)}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            ← تعديل البيانات
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={handleSendRecoveryEmail}
            className="text-xs font-bold text-[#1e3a8a] hover:underline"
          >
            نسيت كلمة السر؟
          </button>
        </div>
      </div>
    )
  }

  if (conflictState?.type === 'phone_exists') {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-right sm:p-7">
        <h3 className="text-xl font-extrabold text-[#0a1122]">
          الرقم ده عندنا عليه حساب بالفعل
        </h3>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          طلبك اتسجّل وفريقنا هيشوفه (رقم الطلب:{' '}
          <strong className="font-mono text-[#0a1122]">
            {conflictState.orderRef}
          </strong>
          ). عشان منعملش لك حساب تاني على نفس الرقم، ادخل على حسابك القديم —
          هنبعتلك لينك على الإيميل المسجّل على الرقم ده.
        </p>

        {stepError && (
          <p className="mt-3 text-right text-xs font-bold text-red-600">
            {stepError}
          </p>
        )}

        {!recoveryLinkSent ? (
          <div className="mt-5">
            <Button
              type="button"
              disabled={isLoading}
              onClick={handleSendRecoveryEmail}
              className="h-11 rounded-xl bg-[#0b6954] px-6 text-sm font-bold text-white hover:bg-[#095443]"
            >
              {isLoading ? 'جاري الإرسال...' : 'ابعتلي لينك على الإيميل المسجّل'}
            </Button>
          </div>
        ) : (
          <p className="mt-5 text-sm font-bold text-[#0b6954]">
            بعتنا اللينك على الإيميل المسجّل على الرقم ده. لو مالقتهوش خلال
            دقيقة، بصّ في السبام.
          </p>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={() => setConflictState(null)}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            ← استخدام رقم آخر
          </button>
          <button
            type="button"
            onClick={() => {
              setConflictState(null)
              setAuthTab('login')
            }}
            className="text-xs font-bold text-[#1e3a8a] hover:underline"
          >
            أو ادخل من صفحة الدخول
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-1.5 sm:flex">
        {loggedUser && (
          <button
            type="button"
            onClick={() => setAuthTab('session')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition sm:text-sm ${
              authTab === 'session'
                ? 'bg-[#0b6954] text-white shadow-xs'
                : 'text-slate-600 hover:bg-white'
            }`}
          >
            <CheckCircle2 className="size-4" />
            <span>حسابي الحالي ({loggedUser.name.split(' ')[0]})</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setAuthTab('register')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition sm:text-sm ${
            authTab === 'register'
              ? 'bg-[#11192d] text-white shadow-xs'
              : 'text-slate-600 hover:bg-white'
          }`}
        >
          <UserPlus className="size-4" />
          <span>تسجيل بيانات جديدة</span>
        </button>

        <button
          type="button"
          onClick={() => setAuthTab('login')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition sm:text-sm ${
            authTab === 'login'
              ? 'bg-[#11192d] text-white shadow-xs'
              : 'text-slate-600 hover:bg-white'
          }`}
        >
          <LogIn className="size-4" />
          <span>عندي حساب بالفعل</span>
        </button>
      </div>

      {authTab === 'session' && loggedUser && (
        <div className="rounded-2xl border border-[#0b6954]/30 bg-[#f0fdf9] p-5 text-right">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-[#0b6954]/10 px-3 py-1 text-xs font-bold text-[#0b6954]">
              متصل الآن
            </span>
            <p className="text-sm font-extrabold text-[#0a1122]">
              أهلاً بك يا {loggedUser.name}
            </p>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            سيتم ربط هذه الوحدة بحسابك الحالي تلقائياً وسحب بيانات التواصل
            الخاصة بك دون الحاجة لإعادة كتابتها:
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2 rounded-xl bg-white p-3.5 text-xs sm:grid-cols-2">
            <div>
              <span className="text-slate-400">رقم الموبايل: </span>
              <strong dir="ltr" className="font-mono text-[#0a1122]">
                {loggedUser.phone}
              </strong>
            </div>
            <div>
              <span className="text-slate-400">البريد الإلكتروني: </span>
              <strong dir="ltr" className="text-[#0a1122]">
                {loggedUser.email}
              </strong>
            </div>
          </div>
        </div>
      )}

      {authTab === 'register' && (
        <>
          <Field
            error={errors.name}
            label="اسمك *"
            id="name"
            value={form.name}
            update={(value) => update('name', value)}
          />

          {/* اختيار الدولة الخاصة بصاحب الحساب (بحث بأول حرف أو اختيار سريع) */}
          <SearchableCountryField
            label="أنت من دولة إيه؟ (بلد الإقامة) *"
            value={form.userCountry || form.unitCountry || 'EG'}
            options={ALL_RESIDENCE_COUNTRIES}
            error={errors.userCountry}
            onChange={(code) => {
              update('userCountry', code)
              const found = ALL_RESIDENCE_COUNTRIES.find((c) => c.code === code)
              if (found?.phoneCode) {
                update('countryCode', found.phoneCode)
              }
            }}
          />

          <div className="flex flex-col gap-2">
            <Label htmlFor="phone" className="text-right">
              رقم موبايلك *
            </Label>
            <div dir="ltr" className="flex items-center gap-2">
              <CountrySelector
                value={form.countryCode ?? '20'}
                onChange={(value) => update('countryCode', value)}
              />
              <Input
                id="phone"
                dir="ltr"
                type="tel"
                placeholder="01xx xxx xxxx"
                value={form.phone ?? ''}
                onChange={(event) => update('phone', event.target.value)}
                className={`h-11 flex-1 rounded-xl px-3 text-left ${
                  errors.phone ? 'border-red-500 bg-red-50/20' : ''
                }`}
              />
            </div>
            {errors.phone && (
              <p className="mt-1.5 text-right text-xs font-semibold text-red-600">
                {errors.phone}
              </p>
            )}
            <span className="text-right text-xs text-slate-500">
              هنتكلم عليه واتساب أو مكالمة — من غير إزعاج
            </span>
          </div>
          <Field
            error={errors.email}
            label="إيميلك *"
            id="email"
            type="email"
            value={form.email}
            update={(value) => update('email', value)}
          />
          <div className="flex flex-col gap-2">
            <Label htmlFor="password" className="text-right">
              اختار كلمة سر لحسابك <span className="mr-1 text-red-500">*</span>
            </Label>
            <div className="relative w-full">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                dir="ltr"
                value={form.password ?? ''}
                onChange={(event) => update('password', event.target.value)}
                className={`h-12 w-full rounded-xl border-slate-200 pr-12 pl-4 text-left ${
                  errors.password ? 'border-red-500 bg-red-50/20' : ''
                }`}
              />
              <button
                type="button"
                aria-label={showPassword ? 'إخفاء كلمة السر' : 'إظهار كلمة السر'}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-500 hover:text-[#0c513f]"
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1.5 text-right text-xs font-semibold text-red-600">
                {errors.password}
              </p>
            )}
            <span className="text-right text-xs font-semibold leading-6 text-teal-700">
              8 حروف على الأقل — هتدخل بيها على حسابك بعد كده
            </span>
          </div>
        </>
      )}

      {authTab === 'login' && (
        <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
          <p className="text-right text-xs font-semibold text-slate-600">
            ادخل بحسابك المسجل في عقار إكزت وهنسحب اسمك ورقمك تلقائياً ونكمل
            تفاصيل الوحدة علطول:
          </p>
          <Field
            error={errors.loginIdentifier}
            label="البريد الإلكتروني أو رقم الموبايل *"
            id="loginIdentifier"
            value={form.loginIdentifier}
            update={(value) => update('loginIdentifier', value)}
          />
          <div className="flex flex-col gap-2">
            <Label htmlFor="loginPassword" className="text-right">
              كلمة السر *
            </Label>
            <div className="relative w-full">
              <Input
                id="loginPassword"
                type={showPassword ? 'text' : 'password'}
                dir="ltr"
                value={form.loginPassword ?? ''}
                onChange={(event) =>
                  update('loginPassword', event.target.value)
                }
                className={`h-12 w-full rounded-xl border-slate-200 bg-white pr-12 pl-4 text-left ${
                  errors.loginPassword ? 'border-red-500 bg-red-50/20' : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-500 hover:text-[#0c513f]"
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {errors.loginPassword && (
              <p className="mt-1.5 text-right text-xs font-semibold text-red-600">
                {errors.loginPassword}
              </p>
            )}
          </div>
        </div>
      )}

      <TurnstileBox />

      <div>
        <label
          dir="rtl"
          className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-right text-sm leading-7 ${
            errors.owner ? 'border-red-500 bg-red-50/30' : 'border-slate-200'
          }`}
        >
          <Checkbox
            className="m-0 shrink-0"
            checked={form.owner === 'yes'}
            onCheckedChange={(checked) => update('owner', checked ? 'yes' : '')}
          />
          أقر إني مالك الوحدة الأصلي، ولست وسيطًا عقاريًا، وأي مخالفة تلغي عرض
          الوحدة أو حذفها نهائيًا.
        </label>
        {errors.owner && (
          <p className="mt-1.5 text-right text-xs font-semibold text-red-600">
            {errors.owner}
          </p>
        )}
      </div>

      {stepError && (
        <p className="rounded-xl bg-red-50 p-3 text-center text-xs font-bold text-red-600">
          {stepError}
        </p>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="order-first h-12 rounded-xl"
          onClick={() => go(1)}
        >
          ارجع
        </Button>
        <Button
          type="button"
          disabled={isLoading}
          className="order-last h-12 flex-1 rounded-xl bg-teal-700 font-bold text-white hover:bg-teal-800"
          onClick={handleStep2Submit}
        >
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              جاري الحفظ والمتابعة...
            </span>
          ) : authTab === 'session' ? (
            'كمّل الطلب بحسابي الحالي'
          ) : (
            'إرسال للمراجعة والمتابعة'
          )}
        </Button>
      </div>
    </div>
  )
}