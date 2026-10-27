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
  const { t: dict, locale, dir } = useTranslation()
  const t = dict.sell.contactStep
  const v = (dict.sell.validation as Record<string, string>) || {}
  const sharedT = dict.sell.shared

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

  useEffect(() => {
    setErrors({})
    setStepError('')
  }, [locale])

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
      nextErrors.owner = getMsg(locale, v.confirmRequired, 'confirmRequired')
    }

    const cleanPhoneDigits = toEnglishDigits(form.phone ?? '').replace(
      /[\s-]/g,
      ''
    )

    if (authTab === 'register') {
      if (!form.name?.trim())
        nextErrors.name = getMsg(locale, v.required, 'required')
      if (!/^[0-9]{7,15}$/.test(cleanPhoneDigits))
        nextErrors.phone = getMsg(locale, v.invalidPhone, 'invalidPhone')
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email ?? ''))
        nextErrors.email = getMsg(locale, v.invalidEmail, 'invalidEmail')
      if ((form.password?.length ?? 0) < 8)
        nextErrors.password = getMsg(locale, v.shortPassword, 'shortPassword')
    } else if (authTab === 'login') {
      if (!form.loginIdentifier?.trim())
        nextErrors.loginIdentifier = getMsg(
          locale,
          v.loginIdRequired,
          'loginIdRequired'
        )
      if (!form.loginPassword?.trim())
        nextErrors.loginPassword = getMsg(
          locale,
          v.loginPassRequired,
          'loginPassRequired'
        )
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setErrors({})
    setIsLoading(true)

    try {
      const activePhoneCode = (form.countryCode || '995').replace('+', '')
      const fullPhone = cleanPhoneDigits
        ? `+${activePhoneCode}${cleanPhoneDigits.replace(/^0+/, '')}`
        : ''

      const res = await processSellerStep2Action({
        mode: authTab,
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
          Number(
            toEnglishDigits(form.currentDeveloperPrice || '').replace(/,/g, '')
          ) || 0,
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
        setStepError(
          res.error || getMsg(locale, v.submitFailed, 'submitFailed')
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (conflictState?.type === 'email_exists') {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-start sm:p-7">
        <h3 className="text-xl font-extrabold text-[var(--brand-navy,#0a1122)]">
          {t.emailExistsTitle}
        </h3>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          {t.emailExistsDesc}{' '}
          <span className="font-semibold text-[var(--brand-navy,#0a1122)]">
            {conflictState.email}
          </span>
          .
        </p>

        <div className="mt-5">
          <Label className="mb-2 block text-start text-sm font-bold text-[var(--brand-navy,#0a1122)]">
            {t.yourPasswordLabel}
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
              {showExistingPass ? t.hidePass : t.showPass}
            </button>
          </div>
        </div>

        {stepError && (
          <p className="mt-3 text-start text-xs font-bold text-red-600">
            {stepError}
          </p>
        )}

        {recoveryLinkSent && (
          <p className="mt-3 text-start text-xs font-bold text-[var(--brand-primary,#007a5a)]">
            {t.recoverySentNote}
          </p>
        )}

        <Button
          type="button"
          disabled={isLoading}
          onClick={handleVerifyExistingEmail}
          className="mt-5 h-12 w-full rounded-xl bg-[var(--brand-primary,#007a5a)] text-sm font-bold text-white hover:bg-[var(--brand-primary-hover,#006248)]"
        >
          {isLoading ? t.loggingInBtn : t.loginToAccountBtn}
        </Button>

        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setConflictState(null)}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            {t.editDataBtn}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={handleSendRecoveryEmail}
            className="text-xs font-bold text-[#1e3a8a] hover:underline"
          >
            {t.forgotPassBtn}
          </button>
        </div>
      </div>
    )
  }

  if (conflictState?.type === 'phone_exists') {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-start sm:p-7">
        <h3 className="text-xl font-extrabold text-[var(--brand-navy,#0a1122)]">
          {t.phoneExistsTitle}
        </h3>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          {t.phoneExistsDesc1}{' '}
          <strong className="font-mono text-[var(--brand-navy,#0a1122)]">
            {conflictState.orderRef}
          </strong>
          {t.phoneExistsDesc2}
        </p>

        {stepError && (
          <p className="mt-3 text-start text-xs font-bold text-red-600">
            {stepError}
          </p>
        )}

        {!recoveryLinkSent ? (
          <div className="mt-5">
            <Button
              type="button"
              disabled={isLoading}
              onClick={handleSendRecoveryEmail}
              className="h-11 rounded-xl bg-[var(--brand-primary,#007a5a)] px-6 text-sm font-bold text-white hover:bg-[var(--brand-primary-hover,#006248)]"
            >
              {isLoading ? t.sendingLinkBtn : t.sendRecoveryBtn}
            </Button>
          </div>
        ) : (
          <p className="mt-5 text-sm font-bold text-[var(--brand-primary,#007a5a)]">
            {t.phoneRecoverySentNote}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={() => setConflictState(null)}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            {t.useAnotherPhoneBtn}
          </button>
          <button
            type="button"
            onClick={() => {
              setConflictState(null)
              setAuthTab('login')
            }}
            className="text-xs font-bold text-[#1e3a8a] hover:underline"
          >
            {t.orLoginPageBtn}
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
            onClick={() => {
              setAuthTab('session')
              setErrors({})
              setStepError('')
            }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition sm:text-sm ${
              authTab === 'session'
                ? 'bg-[var(--brand-primary,#007a5a)] text-white shadow-xs'
                : 'text-slate-600 hover:bg-white'
            }`}
          >
            <CheckCircle2 className="size-4" />
            <span>
              {t.tabCurrentSession} ({loggedUser.name.split(' ')[0]})
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            setAuthTab('register')
            setErrors({})
            setStepError('')
          }}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition sm:text-sm ${
            authTab === 'register'
              ? 'bg-[var(--brand-navy,#0a1122)] text-white shadow-xs'
              : 'text-slate-600 hover:bg-white'
          }`}
        >
          <UserPlus className="size-4" />
          <span>{t.tabNewRegister}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setAuthTab('login')
            setErrors({})
            setStepError('')
          }}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition sm:text-sm ${
            authTab === 'login'
              ? 'bg-[var(--brand-navy,#0a1122)] text-white shadow-xs'
              : 'text-slate-600 hover:bg-white'
          }`}
        >
          <LogIn className="size-4" />
          <span>{t.tabExistingLogin}</span>
        </button>
      </div>

      {authTab === 'session' && loggedUser && (
        <div className="rounded-2xl border border-[var(--brand-primary,#007a5a)]/30 bg-[var(--brand-primary-light,#eaf8f2)] p-5 text-start">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-[var(--brand-primary,#007a5a)]/10 px-3 py-1 text-xs font-bold text-[var(--brand-primary,#007a5a)]">
              {t.connectedBadge}
            </span>
            <p className="text-sm font-extrabold text-[var(--brand-navy,#0a1122)]">
              {t.welcomeUser} {loggedUser.name}
            </p>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            {t.sessionAutoLinkDesc}
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2 rounded-xl bg-white p-3.5 text-xs sm:grid-cols-2">
            <div>
              <span className="text-slate-400">{t.phoneLabelShort} </span>
              <strong
                dir="ltr"
                className="font-mono text-[var(--brand-navy,#0a1122)]"
              >
                {loggedUser.phone}
              </strong>
            </div>
            <div>
              <span className="text-slate-400">{t.emailLabelShort} </span>
              <strong dir="ltr" className="text-[var(--brand-navy,#0a1122)]">
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
            label={t.nameLabel}
            id="name"
            value={form.name}
            update={(value) => update('name', value)}
          />

          <div className="flex flex-col gap-2">
            <Label htmlFor="phone" className="text-start">
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
                id="phone"
                dir="ltr"
                type="tel"
                inputMode="tel"
                placeholder="5xx xx xx xx"
                value={form.phone ?? ''}
                onChange={(event) =>
                  update('phone', toEnglishDigits(event.target.value))
                }
                className={`h-12 flex-1 rounded-xl px-3 text-left ${
                  errors.phone ? 'border-red-500 bg-red-50/20' : ''
                }`}
              />
            </div>
            {errors.phone && (
              <p className="mt-1.5 text-start text-xs font-semibold text-red-600">
                {errors.phone}
              </p>
            )}
            <span className="text-start text-xs text-slate-500">
              {t.phoneHelper}
            </span>
          </div>

          <Field
            error={errors.email}
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
                aria-label={showPassword ? t.hidePass : t.showPass}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-500 hover:text-[var(--brand-primary,#007a5a)]"
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1.5 text-start text-xs font-semibold text-red-600">
                {errors.password}
              </p>
            )}
            <span className="text-start text-xs font-semibold leading-6 text-teal-700">
              {t.passwordHelper}
            </span>
          </div>
        </>
      )}

      {authTab === 'login' && (
        <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
          <p className="text-start text-xs font-semibold text-slate-600">
            {t.loginBoxDesc}
          </p>
          <Field
            error={errors.loginIdentifier}
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
                className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-500 hover:text-[var(--brand-primary,#007a5a)]"
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {errors.loginPassword && (
              <p className="mt-1.5 text-start text-xs font-semibold text-red-600">
                {errors.loginPassword}
              </p>
            )}
          </div>
        </div>
      )}

      <TurnstileBox />

      <div>
        <label
          dir={dir}
          className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-start text-sm leading-7 ${
            errors.owner ? 'border-red-500 bg-red-50/30' : 'border-slate-200'
          }`}
        >
          <Checkbox
            className="m-0 shrink-0"
            checked={form.owner === 'yes'}
            onCheckedChange={(checked) => update('owner', checked ? 'yes' : '')}
          />
          {t.ownerDeclaration}
        </label>
        {errors.owner && (
          <p className="mt-1.5 text-start text-xs font-semibold text-red-600">
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
          {sharedT.backBtn}
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
              {t.savingBtn}
            </span>
          ) : authTab === 'session' ? (
            t.continueWithSessionBtn
          ) : (
            t.submitStep2Btn
          )}
        </Button>
      </div>
    </div>
  )
}
