'use client'

import { useEffect, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  MessageCircle,
  Sparkles,
  UserCheck,
  UserPlus,
} from 'lucide-react'
import {
  processSellerStep2Action,
  sendSellerRecoveryLinkAction,
  verifyExistingEmailPasswordAction,
} from '@/actions/submit-forms'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TurnstileBox } from '@/components/layouts/auth-layout'
import { CountrySelector } from '@/components/shared/country-selector'
import { useTranslation, type LocaleCode } from '@/lib/i18n'
import { Field, toEnglishDigits } from './seller-shared'

const CONTACT_VALIDATION_FALLBACK: Record<
  LocaleCode,
  Record<string, string>
> = {
  ar: {
    required: 'هذا الحقل مطلوب',
    confirmRequired: 'يرجى تأكيد الإقرار للمتابعة',
    invalidPhone: 'يرجى إدخال رقم هاتف صحيح (7 إلى 15 رقماً)',
    invalidEmail: 'يرجى إدخال بريد إلكتروني صحيح',
    shortPassword: 'كلمة المرور يجب ألا تقل عن 8 أحرف',
    loginIdRequired: 'يرجى إدخال البريد الإلكتروني أو رقم الهاتف',
    loginPassRequired: 'يرجى إدخال كلمة المرور',
    submitFailed: 'تعذر حفظ البيانات حالياً، يرجى المحاولة مرة أخرى',
  },
  en: {
    required: 'This field is required',
    confirmRequired: 'Please confirm the declaration to continue',
    invalidPhone: 'Please enter a valid phone number (7 to 15 digits)',
    invalidEmail: 'Please enter a valid email address',
    shortPassword: 'Password must be at least 8 characters',
    loginIdRequired: 'Please enter your email or phone number',
    loginPassRequired: 'Please enter your password',
    submitFailed: 'Could not save data right now, please try again',
  },
  ru: {
    required: 'Это поле обязательно для заполнения',
    confirmRequired: 'Пожалуйста, подтвердите согласие для продолжения',
    invalidPhone: 'Введите корректный номер телефона (от 7 до 15 цифр)',
    invalidEmail: 'Введите корректный адрес электронной почты',
    shortPassword: 'Пароль должен содержать не менее 8 символов',
    loginIdRequired: 'Введите ваш email или номер телефона',
    loginPassRequired: 'Введите ваш пароль',
    submitFailed: 'Не удалось сохранить данные, попробуйте еще раз',
  },
  ka: {
    required: 'ეს ველი სავალდებულოა',
    confirmRequired: 'გთხოვთ დაადასტუროთ განაცხადი გასაგრძელებლად',
    invalidPhone: 'შეიყვანეთ სწორი ტელეფონის ნომერი (7-15 ციფრი)',
    invalidEmail: 'შეიყვანეთ სწორი ელ-ფოსტა',
    shortPassword: 'პაროლი უნდა შედგებოდეს მინიმუმ 8 სიმბოლოსგან',
    loginIdRequired: 'შეიყვანეთ ელ-ფოსტა ან ტელეფონის ნომერი',
    loginPassRequired: 'შეიყვანეთ პაროლი',
    submitFailed: 'მონაცემების შენახვა ვერ მოხერხდა, სცადეთ თავიდან',
  },
}

function getMsg(
  locale: LocaleCode,
  dictVal: string | undefined,
  key: string
): string {
  const fallback =
    CONTACT_VALIDATION_FALLBACK[locale]?.[key] ||
    CONTACT_VALIDATION_FALLBACK.en[key] ||
    ''
  if (!dictVal) return fallback
  if (locale !== 'ar' && /[\u0600-\u06FF]/.test(dictVal)) {
    return fallback
  }
  return dictVal
}

export function ContactSection({
  sectionRef,
  onHover,
  isRentDeal,
  loggedUser,
  onUserAuthenticated,
  authMode,
  setAuthMode,
  form,
  update,
  selected,
  toggleMulti,
  agreedTerms,
  setAgreedTerms,
  error,
  missingFields,
  unitId,
  setUnitId,
  setOrderRef,
}: {
  sectionRef: React.RefObject<HTMLElement | null>
  onHover: () => void
  isRentDeal: boolean
  loggedUser: {
    id: string
    name: string
    email: string
    phone: string
  } | null
  onUserAuthenticated?: (u: {
    id: string
    name: string
    email: string
    phone: string
  }) => void
  authMode: 'sivrce_default' | 'session' | 'register' | 'login'
  setAuthMode: (
    m: 'sivrce_default' | 'session' | 'register' | 'login'
  ) => void
  form: Record<string, string>
  update: (k: string, v: string) => void
  selected: Record<string, string[]>
  toggleMulti: (g: string, v: string) => void
  agreedTerms: boolean
  setAgreedTerms: (val: boolean) => void
  error: string
  missingFields: string[]
  unitId?: string
  setUnitId?: (id: string) => void
  setOrderRef?: (ref: string) => void
}) {
  const { t: dict, locale, dir } = useTranslation()
  const isAr = locale === 'ar'
  const t = dict.sell.contactStep
  const v = (dict.sell.validation as Record<string, string>) || {}

  const [showPassword, setShowPassword] = useState(false)
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({})
  const [stepError, setStepError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [accountVerifiedMsg, setAccountVerifiedMsg] = useState('')

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

  useEffect(() => {
    setLocalErrors({})
    setStepError('')
  }, [locale, authMode])

  // التحقق من الحساب أو تسجيل الدخول المباشر داخل قسم التواصل
  const handleVerifyOrSwitchAccount = async () => {
    setStepError('')
    setAccountVerifiedMsg('')
    const nextErrors: Record<string, string> = {}

    const cleanPhoneDigits = toEnglishDigits(form.phone ?? '').replace(
      /[\s-]/g,
      ''
    )

    if (authMode === 'register') {
      if (!form.name?.trim())
        nextErrors.name = getMsg(locale, v.required, 'required')
      if (!/^[0-9]{7,15}$/.test(cleanPhoneDigits))
        nextErrors.phone = getMsg(locale, v.invalidPhone, 'invalidPhone')
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email ?? ''))
        nextErrors.email = getMsg(locale, v.invalidEmail, 'invalidEmail')
      if ((form.password?.length ?? 0) < 8)
        nextErrors.password = getMsg(locale, v.shortPassword, 'shortPassword')
    } else if (authMode === 'login') {
      if (!form.loginIdentifier?.trim())
        nextErrors.loginIdentifier = getMsg(
          locale,
          v.loginIdRequired,
          'loginIdRequired'
        )
      if (!form.loginPassword?.trim() && !form.password?.trim())
        nextErrors.loginPassword = getMsg(
          locale,
          v.loginPassRequired,
          'loginPassRequired'
        )
    }

    if (Object.keys(nextErrors).length > 0) {
      setLocalErrors(nextErrors)
      return
    }

    setLocalErrors({})
    setIsLoading(true)

    try {
      const activePhoneCode = (form.countryCode || '995').replace('+', '')
      const fullPhone = cleanPhoneDigits.startsWith('+')
        ? cleanPhoneDigits
        : cleanPhoneDigits
          ? `+${activePhoneCode}${cleanPhoneDigits.replace(/^0+/, '')}`
          : ''

      const res = await processSellerStep2Action({
        mode: authMode === 'login' ? 'login' : 'register',
        unitCountry: 'GE',
        userCountry: form.userCountry || 'GE',
        developer: form.developer || '',
        project: form.project || '',
        contractPrice:
          Number(toEnglishDigits(form.contractPrice || '').replace(/,/g, '')) ||
          0,
        paidAmount:
          Number(toEnglishDigits(form.paidAmount || '').replace(/,/g, '')) || 0,
        marketPrice:
          Number(toEnglishDigits(form.marketPrice || '').replace(/,/g, '')) || 0,
        name: form.name,
        phone: fullPhone,
        email: form.email,
        password:
          authMode === 'login'
            ? form.loginPassword || form.password
            : form.password,
        loginIdentifier: form.loginIdentifier,
        existingUnitId: unitId || undefined,
      })

      if (res.status === 'ok') {
        if (res.unitId && setUnitId) setUnitId(res.unitId)
        if (res.orderRef && setOrderRef) setOrderRef(res.orderRef)
        if (res.userName) update('name', res.userName)
        if (res.userEmail) update('email', res.userEmail)
        if (res.userPhone) update('phone', res.userPhone)

        if (res.userId && onUserAuthenticated) {
          onUserAuthenticated({
            id: res.userId,
            name: res.userName || form.name,
            email: res.userEmail || form.email,
            phone: res.userPhone || fullPhone,
          })
        }
        setAuthMode('sivrce_default')
        setAccountVerifiedMsg(
          isAr
            ? 'تم ربط حسابك بنجاح ✓ يمكنك الآن الضغط على زر النشر (Publish)'
            : 'Account connected successfully ✓ You can now click Publish'
        )
        return
      }

      if (res.status === 'email_exists_need_password') {
        if (res.unitId && setUnitId) setUnitId(res.unitId)
        if (res.orderRef && setOrderRef) setOrderRef(res.orderRef)
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
        if (res.unitId && setUnitId) setUnitId(res.unitId)
        if (res.orderRef && setOrderRef) setOrderRef(res.orderRef)
        setRecoveryLinkSent(false)
        setConflictState({
          type: 'phone_exists',
          userId: res.userId || '',
          unitId: res.unitId || '',
          orderRef: res.orderRef || 'AE-XXXXXX',
        })
        return
      }

      setStepError(
        res.error || getMsg(locale, v.submitFailed, 'submitFailed')
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyExistingEmail = async () => {
    if (!conflictState || conflictState.type !== 'email_exists') return
    if (!existingPass.trim()) {
      setStepError(getMsg(locale, v.loginPassRequired, 'loginPassRequired'))
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
        setStepError(
          res.error || getMsg(locale, v.loginPassRequired, 'loginPassRequired')
        )
        return
      }
      if (conflictState.unitId && setUnitId) setUnitId(conflictState.unitId)
      if (conflictState.orderRef && setOrderRef)
        setOrderRef(conflictState.orderRef)
      update('name', res.user.name)
      update('email', res.user.email)
      update('phone', res.user.phone)
      if (onUserAuthenticated) {
        onUserAuthenticated(res.user)
      }
      setConflictState(null)
      setAuthMode('sivrce_default')
      setAccountVerifiedMsg(
        isAr
          ? 'تم تسجيل الدخول وربط حسابك بنجاح ✓'
          : 'Logged in and linked successfully ✓'
      )
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
        setStepError(
          res.error || getMsg(locale, v.submitFailed, 'submitFailed')
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section
      ref={sectionRef}
      onMouseEnter={onHover}
      className="scroll-mt-32 rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-2xs sm:p-7"
    >
      {/* الهيدر الرئيسي لقسم Contact مثل sivrce.ge */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-black text-[#0a1122]">
            {isAr ? '6. التواصل (Contact)' : 'Contact'}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {isRentDeal
              ? isAr
                ? 'الاسم ورقم الموبايل — سيتواصل معك المستأجرون هنا. اختر WhatsApp / Viber / Telegram.'
                : 'Name and mobile — buyers will reach you here. Add WhatsApp / Viber.'
              : isAr
                ? 'الاسم ورقم الموبايل — (🔒 في البيع والتنازل يبقى رقمك مخفياً عن الجمهور ويظهر للإدارة فقط لحماية عمولتك).'
                : 'Name and mobile — (🔒 Kept private for brokered sale & exit deals).'}
          </p>
        </div>

        {loggedUser && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-[#007a5a]">
            <CheckCircle2 className="size-3.5" />
            <span>
              {t.connectedBadge} ({loggedUser.name.split(' ')[0]})
            </span>
          </span>
        )}
      </div>

      {/* حالة وجود تعارض في الإيميل أو الرقم (نفس اللوجيك القديم) */}
      {conflictState?.type === 'email_exists' && (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/40 p-5 text-start">
          <h3 className="text-base font-extrabold text-[#0a1122]">
            {t.emailExistsTitle}
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
            {t.emailExistsDesc}{' '}
            <strong className="font-mono text-[#0a1122]">
              {conflictState.email}
            </strong>
          </p>
          <div className="mt-4">
            <Label className="mb-1.5 block text-start text-xs font-bold">
              {t.yourPasswordLabel}
            </Label>
            <div className="relative">
              <Input
                type={showExistingPass ? 'text' : 'password'}
                dir="ltr"
                value={existingPass}
                onChange={(e) => setExistingPass(e.target.value)}
                className="h-11 rounded-xl bg-white pr-4 pl-16 text-left"
              />
              <button
                type="button"
                onClick={() => setShowExistingPass(!showExistingPass)}
                className="absolute top-1/2 left-3 -translate-y-1/2 text-xs font-bold text-[#2563eb]"
              >
                {showExistingPass ? t.hidePass : t.showPass}
              </button>
            </div>
          </div>
          {stepError && (
            <p className="mt-2 text-xs font-bold text-red-600">{stepError}</p>
          )}
          {recoveryLinkSent && (
            <p className="mt-2 text-xs font-bold text-[#007a5a]">
              {t.recoverySentNote}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              disabled={isLoading}
              onClick={handleVerifyExistingEmail}
              className="h-10 rounded-xl bg-[#007a5a] px-5 text-xs font-bold text-white"
            >
              {isLoading ? t.loggingInBtn : t.loginToAccountBtn}
            </Button>
            <button
              type="button"
              onClick={handleSendRecoveryEmail}
              className="text-xs font-bold text-[#2563eb] hover:underline"
            >
              {t.forgotPassBtn}
            </button>
            <button
              type="button"
              onClick={() => setConflictState(null)}
              className="text-xs font-semibold text-slate-500 hover:underline"
            >
              {t.editDataBtn}
            </button>
          </div>
        </div>
      )}

      {conflictState?.type === 'phone_exists' && (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/40 p-5 text-start">
          <h3 className="text-base font-extrabold text-[#0a1122]">
            {t.phoneExistsTitle}
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
            {t.phoneExistsDesc1}{' '}
            <strong className="font-mono">{conflictState.orderRef}</strong>{' '}
            {t.phoneExistsDesc2}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {!recoveryLinkSent ? (
              <Button
                type="button"
                disabled={isLoading}
                onClick={handleSendRecoveryEmail}
                className="h-10 rounded-xl bg-[#007a5a] px-5 text-xs font-bold text-white"
              >
                {isLoading ? t.sendingLinkBtn : t.sendRecoveryBtn}
              </Button>
            ) : (
              <p className="text-xs font-bold text-[#007a5a]">
                {t.phoneRecoverySentNote}
              </p>
            )}
            <button
              type="button"
              onClick={() => setConflictState(null)}
              className="text-xs font-semibold text-slate-500 hover:underline"
            >
              {t.useAnotherPhoneBtn}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. الفورم الأساسي النظيف المطابق لموقع sivrce.ge (يظهر أولاً) */}
      {/* ========================================================= */}
      {!conflictState &&
        (authMode === 'sivrce_default' || authMode === 'session') && (
          <div className="mt-5 space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                error={localErrors.name}
                label={isAr ? 'الاسم (Name *)' : 'Name *'}
                id="name"
                placeholder="eslam elsherbeny"
                value={form.name}
                update={(v) => update('name', v)}
              />

              <div className="flex flex-col gap-2">
                <Label htmlFor="phone" className="text-start">
                  {isAr ? 'رقم الموبايل (Mobile number *)' : 'Mobile number *'}
                </Label>
                <div dir="ltr" className="flex items-center gap-2">
                  <CountrySelector
                    value={form.countryCode ?? '995'}
                    onChange={(code, iso) => {
                      update('countryCode', code)
                      if (iso) update('userCountry', iso)
                    }}
                  />
                  <Input
                    id="phone"
                    dir="ltr"
                    type="tel"
                    inputMode="tel"
                    placeholder="5XX XX XX XX"
                    value={form.phone ?? ''}
                    onChange={(e) =>
                      update('phone', toEnglishDigits(e.target.value))
                    }
                    className={`h-12 flex-1 rounded-xl px-3 text-left font-bold ${
                      localErrors.phone ? 'border-red-500 bg-red-50/20' : ''
                    }`}
                  />
                </div>
                {localErrors.phone && (
                  <p className="text-start text-xs font-semibold text-red-600">
                    {localErrors.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Messengers on this number (WhatsApp / Viber / Telegram) */}
            <div>
              <label className="mb-2 block text-xs font-extrabold text-slate-600">
                {isAr
                  ? 'تطبيقات المراسلة على هذا الرقم (Messengers on this number)'
                  : 'Messengers on this number'}
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'whatsapp', label: 'WhatsApp' },
                  { id: 'viber', label: 'Viber' },
                  { id: 'telegram', label: 'Telegram' },
                ].map((msgApp) => {
                  const active = selected.messengers?.includes(msgApp.id)
                  return (
                    <button
                      key={msgApp.id}
                      type="button"
                      onClick={() => toggleMulti('messengers', msgApp.id)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-extrabold transition ${
                        active
                          ? 'border-[#2563eb] bg-[#2563eb] text-white shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <MessageCircle className="size-3.5" />
                      <span>{msgApp.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

      {/* ========================================================= */}
      {/* 2. فورم تسجيل حساب مالك جديد (يظهر عند الضغط على زر حساب جديد) */}
      {/* ========================================================= */}
      {!conflictState && authMode === 'register' && (
        <div className="mt-5 space-y-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <div className="flex items-center gap-2">
              <UserPlus className="size-4 text-[#007a5a]" />
              <h3 className="text-sm font-black text-[#0a1122]">
                {t.tabNewRegister}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setAuthMode('sivrce_default')}
              className="text-xs font-bold text-slate-500 hover:text-[#0a1122]"
            >
              {isAr ? 'العودة للشكل المبسط ✕' : 'Back to simple view ✕'}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              error={localErrors.name}
              label={t.nameLabel}
              id="name"
              value={form.name}
              update={(value) => update('name', value)}
            />

            <div className="flex flex-col gap-2">
              <Label htmlFor="phone-reg" className="text-start">
                {t.phoneLabel}
              </Label>
              <div dir="ltr" className="flex items-center gap-2">
                <CountrySelector
                  value={form.countryCode ?? '995'}
                  onChange={(code, iso) => {
                    update('countryCode', code)
                    if (iso) update('userCountry', iso)
                  }}
                />
                <Input
                  id="phone-reg"
                  dir="ltr"
                  type="tel"
                  inputMode="tel"
                  placeholder="5xx xx xx xx"
                  value={form.phone ?? ''}
                  onChange={(e) =>
                    update('phone', toEnglishDigits(e.target.value))
                  }
                  className={`h-12 flex-1 rounded-xl bg-white px-3 text-left ${
                    localErrors.phone ? 'border-red-500 bg-red-50/20' : ''
                  }`}
                />
              </div>
              {localErrors.phone && (
                <p className="text-start text-xs font-semibold text-red-600">
                  {localErrors.phone}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              error={localErrors.email}
              label={t.emailLabel}
              id="email"
              type="email"
              value={form.email}
              update={(value) => update('email', value)}
            />

            <div className="flex flex-col gap-2">
              <Label htmlFor="password" className="text-start">
                {t.passwordLabel} <span className="ms-1 text-red-500">*</span>
              </Label>
              <div className="relative w-full">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  dir="ltr"
                  value={form.password ?? ''}
                  onChange={(e) => update('password', e.target.value)}
                  className={`h-12 w-full rounded-xl border-slate-200 bg-white pr-12 pl-4 text-left ${
                    localErrors.password ? 'border-red-500 bg-red-50/20' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-500 hover:text-[#007a5a]"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {localErrors.password && (
                <p className="text-start text-xs font-semibold text-red-600">
                  {localErrors.password}
                </p>
              )}
              <span className="text-start text-[11px] font-semibold text-teal-700">
                {t.passwordHelper}
              </span>
            </div>
          </div>

          <TurnstileBox />

          <Button
            type="button"
            disabled={isLoading}
            onClick={handleVerifyOrSwitchAccount}
            className="h-11 w-full rounded-xl bg-[#007a5a] text-xs font-extrabold text-white hover:bg-[#006248] sm:text-sm"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                {t.savingBtn}
              </span>
            ) : isAr ? (
              'تأكيد وإنشاء الحساب للمتابعة ✓'
            ) : (
              'Create Account & Link Listing ✓'
            )}
          </Button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. فورم تسجيل الدخول بحساب آخر (يظهر عند الضغط على زر تسجيل دخول) */}
      {/* ========================================================= */}
      {!conflictState && authMode === 'login' && (
        <div className="mt-5 space-y-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <div className="flex items-center gap-2">
              <LogIn className="size-4 text-[#2563eb]" />
              <h3 className="text-sm font-black text-[#0a1122]">
                {t.tabExistingLogin}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setAuthMode('sivrce_default')}
              className="text-xs font-bold text-slate-500 hover:text-[#0a1122]"
            >
              {isAr ? 'العودة للشكل المبسط ✕' : 'Back to simple view ✕'}
            </button>
          </div>

          <p className="text-start text-xs font-semibold text-slate-600">
            {t.loginBoxDesc}
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              error={localErrors.loginIdentifier}
              label={t.loginIdLabel}
              id="loginIdentifier"
              value={form.loginIdentifier}
              update={(value) => update('loginIdentifier', value)}
            />

            <div className="flex flex-col gap-2">
              <Label htmlFor="loginPassword" className="text-start">
                {t.loginPassLabel}
              </Label>
              <div className="relative w-full">
                <Input
                  id="loginPassword"
                  type={showPassword ? 'text' : 'password'}
                  dir="ltr"
                  value={form.loginPassword ?? form.password ?? ''}
                  onChange={(e) => {
                    update('loginPassword', e.target.value)
                    update('password', e.target.value)
                  }}
                  className={`h-12 w-full rounded-xl border-slate-200 bg-white pr-12 pl-4 text-left ${
                    localErrors.loginPassword
                      ? 'border-red-500 bg-red-50/20'
                      : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-500 hover:text-[#007a5a]"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {localErrors.loginPassword && (
                <p className="text-start text-xs font-semibold text-red-600">
                  {localErrors.loginPassword}
                </p>
              )}
            </div>
          </div>

          <TurnstileBox />

          <Button
            type="button"
            disabled={isLoading}
            onClick={handleVerifyOrSwitchAccount}
            className="h-11 w-full rounded-xl bg-[#0a1122] text-xs font-extrabold text-white hover:bg-[#16223f] sm:text-sm"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                {t.savingBtn}
              </span>
            ) : isAr ? (
              'تسجيل الدخول وربط الإعلان بحسابي ✓'
            ) : (
              'Sign In & Link Listing ✓'
            )}
          </Button>
        </div>
      )}

      {/* ========================================================= */}
      {/* شريط الأزرار السفلي لتغيير نوع الحساب (بنفس حسابي / حساب جديد / دخول بحساب آخر) */}
      {/* ========================================================= */}
      <div className="mt-5 rounded-2xl border border-slate-200/90 bg-[#f8fafc] p-3.5">
        <p className="mb-2.5 text-start text-[11px] font-extrabold text-slate-500">
          {isAr
            ? 'خيارات الحساب وربط الإعلان:'
            : 'Account & listing ownership options:'}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {loggedUser && (
            <button
              type="button"
              onClick={() => {
                setAuthMode('sivrce_default')
                update('name', loggedUser.name)
                update('phone', loggedUser.phone)
                update('email', loggedUser.email)
              }}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-extrabold transition ${
                authMode === 'sivrce_default' || authMode === 'session'
                  ? 'border-[#007a5a] bg-[#eaf8f2] text-[#007a5a]'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <UserCheck className="size-3.5" />
              <span>
                {t.tabCurrentSession} ({loggedUser.name.split(' ')[0]})
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setAuthMode('register')}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-extrabold transition ${
              authMode === 'register'
                ? 'border-[#0a1122] bg-[#0a1122] text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <UserPlus className="size-3.5" />
            <span>{t.tabNewRegister}</span>
          </button>

          <button
            type="button"
            onClick={() => setAuthMode('login')}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-extrabold transition ${
              authMode === 'login'
                ? 'border-[#0a1122] bg-[#0a1122] text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <LogIn className="size-3.5" />
            <span>
              {loggedUser
                ? isAr
                  ? 'تسجيل الدخول بحساب آخر'
                  : 'Sign in with another account'
                : t.tabExistingLogin}
            </span>
          </button>
        </div>
      </div>

      {accountVerifiedMsg && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-extrabold text-[#007a5a]">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{accountVerifiedMsg}</span>
        </div>
      )}

      {/* الموافقة على الشروط وإقرار الملكية مثل sivrce.ge */}
      <label
        dir={dir}
        className="mt-5 flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-start text-xs font-bold text-slate-700"
      >
        <Checkbox
          className="m-0 shrink-0"
          checked={agreedTerms}
          onCheckedChange={(checked) => {
            const isOk = Boolean(checked)
            setAgreedTerms(isOk)
            update('owner', isOk ? 'yes' : '')
            update('confirmed', isOk ? 'yes' : '')
          }}
        />
        <span>
          {isAr
            ? `${t.ownerDeclaration} — وأوافق على شروط وأحكام المنصة`
            : 'I agree to the Aqar Exit terms and conditions & confirm ownership'}
        </span>
      </label>

      {(stepError || error || missingFields.length > 0) && (
        <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-red-300 bg-red-50 p-4 text-start text-xs text-red-800">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600" />
          <div>
            <strong className="block font-extrabold">
              {stepError || error}
            </strong>
            {missingFields.length > 0 && (
              <p className="mt-1 font-bold">{missingFields.join(' ، ')}</p>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

export const ContactStep = ContactSection