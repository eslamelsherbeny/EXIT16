'use client'

import { useState } from 'react'
import {
  CheckCircle2,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
} from 'lucide-react'
import {
  sendSellerRecoveryLinkAction,
  verifyExistingEmailPasswordAction,
  type BuyRequestPayload,
} from '@/actions/submit-forms'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TurnstileBox } from '@/components/layouts/funnel-shell'
import { CountrySelector } from '@/components/shared/country-selector'
import {
  Field,
  RequiredLabel,
  type PlatformCountryCode,
} from '@/components/features/seller/seller-shared'
import { useTranslation } from '@/lib/i18n'

export type BuyerFormState = BuyRequestPayload & {
  country: PlatformCountryCode
  residenceCountry?: string
  password: string
  loginIdentifier?: string
  loginPassword?: string
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
  conflictState: BuyerConflictState
  setConflictState: (val: BuyerConflictState) => void
  onSuccessRedirect: () => void
}) {
  const { t: dict } = useTranslation()
  const t = dict.buy.stepThree

  const [existingPass, setExistingPass] = useState('')
  const [showExistingPass, setShowExistingPass] = useState(false)
  const [recoveryLinkSent, setRecoveryLinkSent] = useState(false)
  const [stepError, setStepError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

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
      if (!res.success) {
        setStepError(res.error || t.wrongPassError)
        return
      }
      onSuccessRedirect()
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
          {t.emailExistsDesc1}{' '}
          <strong className="font-mono text-[var(--brand-navy,#0a1122)]">
            {conflictState.orderRef}
          </strong>
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
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-1.5 sm:flex">
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
            {t.sessionAutoSaveDesc}
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
                  setCountryCode(code)
                  if (iso) update('residenceCountry', iso)
                }}
              />
              <Input
                value={data.phone}
                onChange={(event) => update('phone', event.target.value)}
                inputMode="tel"
                dir="ltr"
                placeholder="5xx xx xx xx"
                className={`h-12 flex-1 rounded-xl px-3 text-left ${
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

          <Field
            id="email"
            type="email"
            error={errors?.email}
            label={t.emailLabel}
            value={data.email}
            update={(value) => update('email', value)}
          />

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
        </div>
      )}

      <p className="mt-2 text-center text-xs leading-6 font-bold text-slate-500">
        {t.buyerDeclaration}
      </p>
      <TurnstileBox />
    </div>
  )
}