'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  MessageCircle,
  UserPlus,
} from 'lucide-react'
import {
  processBuyerStep3Action,
  sendSellerRecoveryLinkAction,
  verifyExistingEmailPasswordAction,
  type BuyRequestPayload,
} from '@/actions/submit-forms'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TurnstileBox } from '@/components/layouts/auth-layout'
import { CountrySelector } from '@/components/shared/country-selector'
import {
  Field,
  RequiredLabel,
  type PlatformCountryCode,
} from '@/components/features/seller/seller-shared'
import {
  getPhoneInputMaxLength,
  getPhonePlaceholder,
  sanitizePhoneInputForCountry,
} from '@/lib/phone-validation'
import { useTranslation } from '@/lib/i18n'

export type BuyerFormState = BuyRequestPayload & {
  country: PlatformCountryCode
  residenceCountry?: string
  password: string
  confirmPassword?: string
  loginIdentifier?: string
  loginPassword?: string
  contactMessengers?: string[]
}

export type BuyerConflictState =
  | null
  | {
      type: 'email_exists'
      email: string
      userId: string
      orderRef: string
    }
  | {
      type: 'phone_exists'
      userId: string
      orderRef: string
    }

export function BuyerContactStep({
  data,
  update,
  errors,
  countryCode,
  setCountryCode,
  passwordVisible,
  setPasswordVisible,
  loggedUser,
  authTab,
  setAuthTab,
  agreedTerms,
  setAgreedTerms,
  commissionPct = '1.25',
  conflictState,
  setConflictState,
  onSuccessRedirect,
}: {
  data: BuyerFormState
  update: <K extends keyof BuyerFormState>(
    key: K,
    value: BuyerFormState[K]
  ) => void
  errors?: Record<string, string>
  countryCode: string
  setCountryCode: (value: string) => void
  passwordVisible: boolean
  setPasswordVisible: (value: boolean) => void
  loggedUser: { id: string; name: string; email: string; phone: string } | null
  authTab: 'session' | 'register' | 'login'
  setAuthTab: (tab: 'session' | 'register' | 'login') => void
  agreedTerms: boolean
  setAgreedTerms: (val: boolean) => void
  commissionPct?: string
  conflictState: BuyerConflictState
  setConflictState: (val: BuyerConflictState) => void
  onSuccessRedirect: (info?: { reqId?: string; orderRef?: string }) => void
}) {
  const { t: dict, locale, dir } = useTranslation()
  const t = dict.buy.stepThree as Record<string, any>

  const [existingPass, setExistingPass] = useState('')
  const [showExistingPass, setShowExistingPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [recoveryLinkSent, setRecoveryLinkSent] = useState(false)
  const [stepError, setStepError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const dynamicPlaceholder = getPhonePlaceholder(
    data.residenceCountry,
    countryCode
  )
  const dynamicMaxLength = getPhoneInputMaxLength(
    data.phone || '',
    data.residenceCountry,
    countryCode
  )
  const selectedMessengers = data.contactMessengers || ['whatsapp', 'viber']

  const toggleMessenger = (appId: string) => {
    const exists = selectedMessengers.includes(appId)
    const next = exists
      ? selectedMessengers.filter((x) => x !== appId)
      : [...selectedMessengers, appId]
    update('contactMessengers', next.length > 0 ? next : ['whatsapp'])
  }

  useEffect(() => {
    setStepError('')
  }, [locale])

  const renderMessengersPicker = () => (
    <div>
      <label className="mb-2 block text-start text-xs font-extrabold text-slate-600">
        {t.messengersLabel}
      </label>
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'whatsapp', label: 'WhatsApp' },
          { id: 'viber', label: 'Viber' },
          { id: 'telegram', label: 'Telegram' },
        ].map((msgApp) => {
          const active = selectedMessengers.includes(msgApp.id)
          return (
            <button
              key={msgApp.id}
              type="button"
              onClick={() => toggleMessenger(msgApp.id)}
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
  )

  const handleVerifyExistingEmail = async () => {
    if (!conflictState || conflictState.type !== 'email_exists') return
    if (!existingPass.trim()) {
      setStepError(t.enterAccountPassError)
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
        setStepError(res.error || t.wrongPassError)
        return
      }

      const saveRes = await processBuyerStep3Action({
        mode: 'session',
        country: 'GE',
        userCountry: data.residenceCountry || 'GE',
        available_cash: Number(data.available_cash) || 0,
        max_installment: Number(data.max_installment) || 0,
        payment_plan: data.payment_plan,
        budget: Number(data.budget) || Number(data.available_cash) || 0,
        unit_types: data.unit_types,
        min_rooms: Number.parseInt(String(data.min_rooms), 10) || 0,
        delivery_status: data.delivery_status,
        preferred_areas: data.preferred_areas,
        contactMessengers: selectedMessengers,
      })

      if (saveRes.status === 'ok') {
        onSuccessRedirect({
          reqId: saveRes.unitId,
          orderRef: saveRes.orderRef,
        })
        return
      }

      setStepError(saveRes.error || t.wrongPassError)
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
      })
      if (res.success) {
        setRecoveryLinkSent(true)
      } else {
        setStepError(res.error || t.sendLinkError)
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
          {t.emailExistsDesc2}{' '}
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
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              {t.loggingInBtn}
            </span>
          ) : (
            t.loginToAccountBtn
          )}
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

  const termsSuffixFormatted = String(
    t.termsAgreeSuffix || t.buyerDeclaration || ''
  ).replace('{commission}', commissionPct)

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-1.5 sm:flex">
        {loggedUser && (
          <button
            type="button"
            onClick={() => setAuthTab('session')}
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
          onClick={() => setAuthTab('register')}
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
          onClick={() => setAuthTab('login')}
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
        <div className="space-y-4 rounded-2xl border border-[var(--brand-primary,#007a5a)]/30 bg-[var(--brand-primary-light,#eaf8f2)] p-5 text-start">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-[var(--brand-primary,#007a5a)]/10 px-3 py-1 text-xs font-bold text-[var(--brand-primary,#007a5a)]">
              {t.connectedBadge}
            </span>
            <p className="text-sm font-extrabold text-[var(--brand-navy,#0a1122)]">
              {t.welcomeUser} {loggedUser.name}
            </p>
          </div>
          <p className="text-xs leading-relaxed text-slate-600">
            {t.sessionAutoSaveDesc}
          </p>
          <div className="grid grid-cols-1 gap-2 rounded-xl bg-white p-3.5 text-xs sm:grid-cols-2">
            <div>
              <span className="text-slate-400">{t.phoneLabelShort} </span>
              <strong className="text-[var(--brand-navy,#0a1122)]">
                <span dir="ltr" className="inline-block font-mono">
                  {loggedUser.phone}
                </span>
              </strong>
            </div>
            <div>
              <span className="text-slate-400">{t.emailLabelShort} </span>
              <strong className="text-[var(--brand-navy,#0a1122)]">
                <span dir="ltr" className="inline-block">
                  {loggedUser.email}
                </span>
              </strong>
            </div>
          </div>

          {renderMessengersPicker()}
        </div>
      )}

      {authTab === 'register' && (
        <>
          <Field
            id="name"
            error={errors?.name}
            label={t.nameLabel}
            value={data.name}
            update={(value) => update('name', value)}
          />

          <div>
            <Label className="block text-start">
              <RequiredLabel>{t.phoneLabel}</RequiredLabel>
            </Label>
            <div dir="ltr" className="mt-2 flex items-center gap-2">
              <CountrySelector
                value={countryCode}
                onChange={(code, iso) => {
                  const nextIso = iso || ''
                  setCountryCode(code)
                  if (nextIso) update('residenceCountry', nextIso)
                  update(
                    'phone',
                    sanitizePhoneInputForCountry(
                      data.phone || '',
                      nextIso,
                      code
                    )
                  )
                }}
              />
              <Input
                value={data.phone}
                onChange={(event) =>
                  update(
                    'phone',
                    sanitizePhoneInputForCountry(
                      event.target.value,
                      data.residenceCountry,
                      countryCode
                    )
                  )
                }
                type="tel"
                inputMode="tel"
                dir="ltr"
                maxLength={dynamicMaxLength}
                placeholder={dynamicPlaceholder}
                className={`h-12 flex-1 rounded-xl px-3 text-left font-bold ${
                  errors?.phone
                    ? 'border-red-500 bg-red-50/20'
                    : 'border-slate-200'
                }`}
              />
            </div>
            {errors?.phone && (
              <p className="mt-1.5 text-start text-xs font-semibold text-red-600">
                {errors.phone}
              </p>
            )}
            <p className="mt-2 text-start text-xs text-slate-500">
              {t.phoneHelper}
            </p>
          </div>

          {renderMessengersPicker()}

          <Field
            id="email"
            type="email"
            error={errors?.email}
            label={t.emailLabel}
            value={data.email}
            update={(value) => update('email', value)}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label className="block text-start">
                <RequiredLabel>{t.passwordLabel}</RequiredLabel>
              </Label>
              <div className="relative mt-2">
                <Input
                  value={data.password}
                  onChange={(event) => update('password', event.target.value)}
                  type={passwordVisible ? 'text' : 'password'}
                  dir="ltr"
                  className={`h-12 rounded-xl pr-12 pl-4 text-left ${
                    errors?.password
                      ? 'border-red-500 bg-red-50/20'
                      : 'border-slate-200'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-500 hover:text-[var(--brand-primary,#007a5a)]"
                >
                  {passwordVisible ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {errors?.password && (
                <p className="mt-1.5 text-start text-xs font-semibold text-red-600">
                  {errors.password}
                </p>
              )}
              <p className="mt-2 text-start text-xs text-slate-500">
                {t.passwordHelper}
              </p>
            </div>

            <div>
              <Label className="block text-start">
                <RequiredLabel>{t.confirmPasswordLabel}</RequiredLabel>
              </Label>
              <div className="relative mt-2">
                <Input
                  value={data.confirmPassword || ''}
                  onChange={(event) =>
                    update('confirmPassword', event.target.value)
                  }
                  type={showConfirmPass ? 'text' : 'password'}
                  dir="ltr"
                  className={`h-12 rounded-xl pr-12 pl-4 text-left ${
                    errors?.confirmPassword
                      ? 'border-red-500 bg-red-50/20'
                      : 'border-slate-200'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-500 hover:text-[var(--brand-primary,#007a5a)]"
                >
                  {showConfirmPass ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {errors?.confirmPassword && (
                <p className="mt-1.5 text-start text-xs font-semibold text-red-600">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {authTab === 'login' && (
        <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
          <p className="text-start text-xs font-semibold text-slate-600">
            {t.loginBoxDesc}
          </p>
          <Field
            id="loginIdentifier"
            error={errors?.loginIdentifier}
            label={t.loginIdLabel}
            value={data.loginIdentifier || ''}
            update={(value) => update('loginIdentifier', value)}
          />
          <div>
            <Label className="block text-start">
              <RequiredLabel>{t.loginPassLabel}</RequiredLabel>
            </Label>
            <div className="relative mt-2">
              <Input
                value={data.loginPassword || ''}
                onChange={(event) =>
                  update('loginPassword', event.target.value)
                }
                type={passwordVisible ? 'text' : 'password'}
                dir="ltr"
                className={`h-12 rounded-xl bg-white pr-12 pl-4 text-left ${
                  errors?.loginPassword
                    ? 'border-red-500 bg-red-50/20'
                    : 'border-slate-200'
                }`}
              />
              <button
                type="button"
                onClick={() => setPasswordVisible(!passwordVisible)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-500 hover:text-[var(--brand-primary,#007a5a)]"
              >
                {passwordVisible ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {errors?.loginPassword && (
              <p className="mt-1.5 text-start text-xs font-semibold text-red-600">
                {errors.loginPassword}
              </p>
            )}
          </div>

          {renderMessengersPicker()}
        </div>
      )}

      <div id="field-wrap-buyer-agreedTerms">
        <label
          dir={dir}
          className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 text-start text-xs leading-relaxed font-bold transition ${
            errors?.agreedTerms
              ? 'border-2 border-red-500 bg-red-50/30 text-red-900'
              : agreedTerms
                ? 'border-emerald-300 bg-[#eaf8f2]/40 text-[#0f1d40]'
                : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:border-slate-300'
          }`}
        >
          <Checkbox
            className="mt-0.5 m-0 shrink-0"
            checked={agreedTerms}
            onCheckedChange={(checked) => setAgreedTerms(Boolean(checked))}
          />
          <span>
            {t.termsAgreePrefix}{' '}
            <Link
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="font-black text-[#007a5a] underline decoration-[#007a5a]/60 underline-offset-2 hover:text-[#006248]"
            >
              {t.termsLinkText}
            </Link>{' '}
            {t.termsAndWord}{' '}
            <Link
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="font-black text-[#007a5a] underline decoration-[#007a5a]/60 underline-offset-2 hover:text-[#006248]"
            >
              {t.privacyLinkText}
            </Link>{' '}
            — {termsSuffixFormatted} <span className="text-red-500">*</span>
          </span>
        </label>

        {errors?.agreedTerms && (
          <p className="mt-1.5 text-start text-xs font-extrabold text-red-600">
            {errors.agreedTerms}
          </p>
        )}
      </div>

      <TurnstileBox />
    </div>
  )
}