'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  getCurrentSellerProfileAction,
  processBuyerStep3Action,
} from '@/actions/submit-forms'
import { AlertCircle, Check, Loader2, UserRound, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TurnstileBox } from '@/components/layouts/funnel-shell'
import {
  MoneyField,
  Pills,
  RequiredLabel,
  unitTypes as sharedUnitTypes,
} from '@/components/features/seller/seller-shared'
import {
  GEORGIA_CITIES_AND_DISTRICTS,
  GeorgiaAreaSelect,
  getLocalizedGeorgiaAreaName,
} from '@/components/shared/georgia-areas'
import {
  BuyerContactStep,
  type BuyerConflictState,
  type BuyerFormState,
} from '@/components/features/buyer/buyer-contact-step'
import { getCurrencySymbol, useTranslation } from '@/lib/i18n'

const ACTIVE_PLATFORM_COUNTRY = 'GE'
const DEFAULT_PHONE_CODE = '995'

function StepValidationBanner({
  missingFields,
  prefixText,
}: {
  missingFields: string[]
  prefixText: string
}) {
  if (!missingFields.length) return null
  return (
    <div
      role="alert"
      className="mt-5 flex items-start gap-2.5 rounded-xl border border-red-300 bg-red-50/90 p-3.5 text-start text-xs leading-relaxed text-red-800 shadow-2xs"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600" />
      <div>
        <strong className="font-extrabold">{prefixText} </strong>
        <span className="font-bold">{missingFields.join(' ، ')}</span>
      </div>
    </div>
  )
}

export default function BuyersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t: dict, dir } = useTranslation()
  const b = dict.buy
  const sellVal = (dict.sell?.validation as Record<string, any>) || {}

  const localizedUnitTypes: string[] =
    (dict as Record<string, any>).buyerFunnelPage?.unitTypes || sharedUnitTypes
  const localizedDeliveries: string[] =
    dict.accountComponents?.buyer?.deliveryPreferences || []
  const waPhone = String(dict.footer?.phone || '+201018595959').replace(
    /\D/g,
    ''
  )

  const initialBudget = Number(
    (searchParams.get('budget') || '').replace(/,/g, '')
  )

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [data, setData] = useState<BuyerFormState>(() => ({
    country: ACTIVE_PLATFORM_COUNTRY,
    residenceCountry: ACTIVE_PLATFORM_COUNTRY,
    available_cash: 0,
    max_installment: 0,
    payment_plan: b.stepOne.paymentPlans[0] || '',
    budget: initialBudget > 0 ? initialBudget : 0,
    unit_types: localizedUnitTypes[0] ? [localizedUnitTypes[0]] : [],
    min_rooms: 0,
    delivery_status: localizedDeliveries[0] || '',
    preferred_areas: [],
    name: '',
    phone: '',
    email: '',
    password: '',
    loginIdentifier: '',
    loginPassword: '',
  }))

  const [countryCode, setCountryCode] = useState(DEFAULT_PHONE_CODE)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [missingFieldsList, setMissingFieldsList] = useState<string[]>([])

  const [loggedUser, setLoggedUser] = useState<{
    id: string
    name: string
    email: string
    phone: string
  } | null>(null)

  const [authTab, setAuthTab] = useState<'session' | 'register' | 'login'>(
    'register'
  )

  const [conflictState, setConflictState] =
    useState<BuyerConflictState>(null)

  useEffect(() => {
    setData((prev) => ({
      ...prev,
      country: ACTIVE_PLATFORM_COUNTRY,
      residenceCountry: ACTIVE_PLATFORM_COUNTRY,
      payment_plan: b.stepOne.paymentPlans[0] || prev.payment_plan,
      unit_types:
        prev.unit_types.length > 0
          ? prev.unit_types
          : localizedUnitTypes[0]
            ? [localizedUnitTypes[0]]
            : [],
      delivery_status: prev.delivery_status || localizedDeliveries[0] || '',
    }))

    async function checkCurrentSession() {
      const res = await getCurrentSellerProfileAction()
      if (res.isLoggedIn && res.user) {
        setLoggedUser(res.user)
        setAuthTab('session')
      }
    }
    checkCurrentSession()
  }, [])

  const cleanLabel = (raw?: string) =>
    String(raw || '')
      .replace(/\*/g, '')
      .replace(/:/g, '')
      .trim()

  const update = <K extends keyof BuyerFormState>(
    key: K,
    value: BuyerFormState[K]
  ) => {
    setData((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: '' }))
    setMissingFieldsList([])
  }

  const nextFromOne = () => {
    const nextErrors: Record<string, string> = {}
    const missing: string[] = []

    if (!data.available_cash) {
      nextErrors.available_cash = b.validation.required
      missing.push(cleanLabel(b.stepOne.availableCashLabel))
    }
    if (!data.max_installment) {
      nextErrors.max_installment = b.validation.required
      missing.push(cleanLabel(b.stepOne.maxInstallmentLabel))
    }
    if (!data.payment_plan) {
      nextErrors.payment_plan = b.validation.selectPaymentPlan
      missing.push(cleanLabel(b.stepOne.paymentPlanLabel))
    }
    if (!data.budget) {
      nextErrors.budget = b.validation.required
      missing.push(cleanLabel(b.stepOne.budgetLabel))
    }
    if (
      data.budget > 0 &&
      data.max_installment > 0 &&
      data.max_installment > data.budget
    ) {
      nextErrors.max_installment = b.validation.installmentExceedsBudget
      if (!missing.includes(cleanLabel(b.stepOne.maxInstallmentLabel))) {
        missing.push(cleanLabel(b.stepOne.maxInstallmentLabel))
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setMissingFieldsList(missing)
      return
    }
    setErrors({})
    setMissingFieldsList([])
    setStep(2)
  }

  const nextFromTwo = () => {
    const nextErrors: Record<string, string> = {}
    const missing: string[] = []

    if (!data.unit_types.length) {
      nextErrors.unit_types = b.validation.selectUnitType
      missing.push(cleanLabel(b.stepTwo.unitTypeLabel))
    }
    if (!data.delivery_status) {
      nextErrors.delivery_status = b.validation.selectDeliveryStatus
      missing.push(cleanLabel(b.stepTwo.deliveryStatusLabel))
    }
    if (!data.preferred_areas.length) {
      nextErrors.preferred_areas = b.validation.selectAtLeastOneArea
      missing.push(cleanLabel(b.stepTwo.areasLabelPrefix))
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setMissingFieldsList(missing)
      return
    }

    setErrors({})
    setMissingFieldsList([])
    setStep(3)
  }

  const handleFinalSubmit = async () => {
    setError('')
    const nextErrors: Record<string, string> = {}
    const missing: string[] = []

    if (authTab === 'register') {
      if (!data.name.trim()) {
        nextErrors.name = b.validation.required
        missing.push(cleanLabel(b.stepThree.nameLabel))
      }
      if (
        !data.phone.trim() ||
        !/^[0-9٠-٩]{7,15}$/.test(data.phone.replace(/[\s-]/g, ''))
      ) {
        nextErrors.phone = b.validation.invalidPhone
        missing.push(cleanLabel(b.stepThree.phoneLabel))
      }
      if (!data.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        nextErrors.email = b.validation.invalidEmail
        missing.push(cleanLabel(b.stepThree.emailLabel))
      }
      if (data.password.length < 8) {
        nextErrors.password = b.validation.shortPassword
        missing.push(cleanLabel(b.stepThree.passwordLabel))
      }
    } else if (authTab === 'login') {
      if (!data.loginIdentifier?.trim()) {
        nextErrors.loginIdentifier = b.validation.loginIdRequired
        missing.push(cleanLabel(b.stepThree.loginIdLabel))
      }
      if (!data.loginPassword?.trim()) {
        nextErrors.loginPassword = b.validation.loginPassRequired
        missing.push(cleanLabel(b.stepThree.loginPassLabel))
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setMissingFieldsList(missing)
      return
    }

    setErrors({})
    setMissingFieldsList([])
    setIsSubmitting(true)

    try {
      const fullPhone = data.phone.trim()
        ? `+${countryCode.replace('+', '')}${data.phone.trim().replace(/^0+/, '')}`
        : ''

      const res = await processBuyerStep3Action({
        mode: authTab,
        country: ACTIVE_PLATFORM_COUNTRY,
        userCountry: data.residenceCountry || ACTIVE_PLATFORM_COUNTRY,
        available_cash: Number(data.available_cash) || 0,
        max_installment: Number(data.max_installment) || 0,
        payment_plan: data.payment_plan,
        budget: Number(data.budget) || 0,
        unit_types: data.unit_types,
        min_rooms: Number.parseInt(String(data.min_rooms), 10) || 0,
        delivery_status: data.delivery_status,
        preferred_areas: data.preferred_areas,
        name: data.name.trim(),
        phone: fullPhone,
        email: data.email.trim(),
        password: authTab === 'login' ? data.loginPassword : data.password,
        loginIdentifier: data.loginIdentifier,
      })

      if (res.status === 'ok') {
        router.push('/account?view=buyer')
        return
      }

      if (res.status === 'email_exists_need_password') {
        setConflictState({
          type: 'email_exists',
          email: res.userEmail || data.email.trim(),
          userId: res.userId || '',
          orderRef: res.orderRef || '',
        })
        return
      }

      if (res.status === 'phone_exists_different_email') {
        setConflictState({
          type: 'phone_exists',
          userId: res.userId || '',
          orderRef: res.orderRef || '',
        })
        return
      }

      setError(res.error ?? b.validation.submitFailed)
    } finally {
      setIsSubmitting(false)
    }
  }

  const missingPrefix =
    sellVal.missingBannerPrefix || b.validation.required || ''

  return (
    <main
      dir={dir}
      className="min-h-screen bg-[var(--brand-surface,#f5f6f8)] px-4 py-12 text-[var(--brand-navy-text,#0a1128)] sm:px-6 lg:py-16"
    >
      <div className="mx-auto max-w-3xl">
        <header className="text-center">
          <h1 className="text-3xl font-black tracking-tight text-[#0c513f] sm:text-4xl">
            {b.header.title}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600">
            {b.header.description}
          </p>
        </header>

        {step <= 2 && (
          <>
            <div className="mt-8 flex flex-col gap-4">
              {b.header.benefits.map((item, index) => (
                <div
                  key={item}
                  className={`flex items-center gap-3 rounded-xl border px-5 py-3 text-sm ${
                    index === 3
                      ? 'border-teal-300 bg-teal-50 font-bold text-teal-700'
                      : index === 4
                        ? 'border-slate-500 bg-transparent font-semibold'
                        : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  <Check className="size-4 shrink-0 text-teal-700" />
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-2xl border border-slate-500 bg-white p-5 text-start shadow-sm">
              <div className="flex items-center gap-2 text-sm font-bold">
                <UserRound className="size-4" />
                {b.header.directBuyerTitle}
              </div>
              <p className="mt-2 text-xs leading-6 text-slate-600">
                {b.header.directBuyerDesc}
              </p>
            </div>
          </>
        )}

        <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black">
              {b.header.stepTitles[step - 1]}
            </h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
              {b.header.stepWord} {step} {b.header.ofWord} 3
            </span>
          </div>

          <div className="mt-5 flex gap-1.5">
            {[1, 2, 3].map((item) => (
              <span
                key={item}
                className={`h-1.5 flex-1 rounded-full ${
                  item <= step
                    ? 'bg-[var(--brand-primary,#007a5a)]'
                    : 'bg-slate-200'
                }`}
              />
            ))}
          </div>

          <div className="mt-7">
            {step === 1 && (
              <BuyerStepOne data={data} update={update} errors={errors} />
            )}
            {step === 2 && (
              <BuyerStepTwo
                data={data}
                update={update}
                errors={errors}
                unitTypesList={localizedUnitTypes}
                deliveriesList={localizedDeliveries}
              />
            )}
            {step === 3 && (
              <BuyerContactStep
                data={data}
                update={update}
                errors={errors}
                countryCode={countryCode}
                setCountryCode={setCountryCode}
                passwordVisible={passwordVisible}
                setPasswordVisible={setPasswordVisible}
                loggedUser={loggedUser}
                authTab={authTab}
                setAuthTab={setAuthTab}
                conflictState={conflictState}
                setConflictState={setConflictState}
                onSuccessRedirect={() => router.push('/account?view=buyer')}
              />
            )}
          </div>

          <StepValidationBanner
            missingFields={missingFieldsList}
            prefixText={missingPrefix}
          />

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-xl bg-red-50 p-3 text-center text-sm font-bold text-red-700"
            >
              {error}
            </div>
          )}

          {!(step === 3 && conflictState) && (
            <div className="mt-7 flex gap-3">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setMissingFieldsList([])
                    setStep((step - 1) as 1 | 2)
                  }}
                  className="h-12 rounded-xl border border-slate-300 bg-white px-7 font-semibold transition hover:bg-slate-50"
                >
                  {b.actions.backBtn}
                </button>
              )}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={
                  step === 1
                    ? nextFromOne
                    : step === 2
                      ? nextFromTwo
                      : handleFinalSubmit
                }
                className={`h-12 flex-1 rounded-xl px-5 font-bold text-white transition active:scale-[0.98] ${
                  step === 3
                    ? 'bg-[var(--brand-primary,#007a5a)] hover:bg-[var(--brand-primary-hover,#006248)]'
                    : 'bg-[var(--brand-navy,#0a1122)] hover:bg-[var(--brand-navy-hover,#16223f)]'
                }`}
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    {b.actions.savingBtn}
                  </span>
                ) : step === 3 ? (
                  authTab === 'session' ? (
                    b.actions.confirmWithSessionBtn
                  ) : (
                    b.actions.submitBtn
                  )
                ) : (
                  b.actions.nextBtn
                )}
              </button>
            </div>
          )}
        </div>

        {step <= 2 && (
          <div className="mt-6 flex items-center justify-between rounded-2xl bg-[var(--brand-navy,#0a1122)] px-5 py-4 text-sm text-white">
            <span>{b.header.whatsappBarText}</span>
            <a
              href={`https://wa.me/${waPhone}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-green-500 px-4 py-2 font-bold transition hover:bg-green-600"
            >
              {b.header.whatsappBarBtn}
            </a>
          </div>
        )}
      </div>
    </main>
  )
}

function BuyerStepOne({
  data,
  update,
  errors,
}: {
  data: BuyerFormState
  update: <K extends keyof BuyerFormState>(
    key: K,
    value: BuyerFormState[K]
  ) => void
  errors?: Record<string, string>
}) {
  const { t: dict, locale } = useTranslation()
  const t = dict.buy.stepOne
  const currency = getCurrencySymbol(ACTIVE_PLATFORM_COUNTRY, locale)

  return (
    <div className="flex flex-col gap-6">
      <MoneyField
        error={errors?.available_cash}
        label={t.availableCashLabel}
        value={data.available_cash ? String(data.available_cash) : ''}
        currencySymbol={currency}
        helper={t.availableCashHelper}
        update={(val) => update('available_cash', Number(val) || 0)}
      />

      <MoneyField
        error={errors?.max_installment}
        label={t.maxInstallmentLabel}
        value={data.max_installment ? String(data.max_installment) : ''}
        currencySymbol={currency}
        update={(val) => update('max_installment', Number(val) || 0)}
      />

      <fieldset>
        <legend className="mb-3 text-start text-sm font-bold">
          <RequiredLabel>{t.paymentPlanLabel}</RequiredLabel>
        </legend>
        <div
          className={`grid gap-2 ${
            errors?.payment_plan
              ? 'rounded-xl border border-red-500 bg-red-50/20 p-2.5'
              : ''
          }`}
        >
          {t.paymentPlans.map((item) => (
            <label
              key={item}
              className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-sm transition ${
                data.payment_plan === item
                  ? 'border-[var(--brand-primary,#007a5a)] bg-[var(--brand-primary-light,#eaf8f2)] font-bold text-[var(--brand-primary,#007a5a)]'
                  : 'border-slate-200 bg-white hover:border-teal-300'
              }`}
            >
              <span>{item}</span>
              <input
                type="radio"
                checked={data.payment_plan === item}
                onChange={() => update('payment_plan', item)}
                className="accent-[var(--brand-primary,#007a5a)]"
              />
            </label>
          ))}
        </div>
        {errors?.payment_plan && (
          <p className="mt-1.5 text-start text-xs font-semibold text-red-600">
            {errors.payment_plan}
          </p>
        )}
      </fieldset>

      <MoneyField
        error={errors?.budget}
        label={t.budgetLabel}
        value={data.budget ? String(data.budget) : ''}
        currencySymbol={currency}
        helper={t.budgetHelper}
        update={(val) => update('budget', Number(val) || 0)}
      />

      <TurnstileBox />
    </div>
  )
}

function BuyerStepTwo({
  data,
  update,
  errors,
  unitTypesList,
  deliveriesList,
}: {
  data: BuyerFormState
  update: <K extends keyof BuyerFormState>(
    key: K,
    value: BuyerFormState[K]
  ) => void
  errors?: Record<string, string>
  unitTypesList: string[]
  deliveriesList: string[]
}) {
  const { t: dict, locale } = useTranslation()
  const t = dict.buy.stepTwo
  const sDetails = (dict.sell?.detailsStep as Record<string, any>) || {}

  const addGeorgiaArea = (areaId: string) => {
    if (!areaId) return
    if (!data.preferred_areas.includes(areaId)) {
      update('preferred_areas', [...data.preferred_areas, areaId])
    }
  }

  const removeGeorgiaArea = (areaId: string) => {
    update(
      'preferred_areas',
      data.preferred_areas.filter((item) => item !== areaId)
    )
  }

  const quickGeorgiaAreas = GEORGIA_CITIES_AND_DISTRICTS.slice(0, 8)

  return (
    <div className="flex flex-col gap-6">
      <fieldset>
        <legend className="mb-1 text-start text-sm font-bold">
          <RequiredLabel>{t.unitTypeLabel}</RequiredLabel>
        </legend>
        <p className="mb-3 text-start text-xs text-slate-500">
          {t.unitTypeHelper}
        </p>
        <Pills
          error={errors?.unit_types}
          items={unitTypesList}
          selected={data.unit_types}
          multi
          onToggle={(item) =>
            update(
              'unit_types',
              data.unit_types.includes(item)
                ? data.unit_types.filter((tp) => tp !== item)
                : [...data.unit_types, item]
            )
          }
        />
      </fieldset>

      <div>
        <Label htmlFor="rooms" className="block text-start">
          {t.minRoomsLabel}
        </Label>
        <Input
          id="rooms"
          type="number"
          min="0"
          dir="ltr"
          value={data.min_rooms || ''}
          onChange={(event) =>
            update('min_rooms', Number(event.target.value) || 0)
          }
          className="mt-2 h-12 w-full max-w-[150px] text-center text-lg"
          placeholder={t.minRoomsPlaceholder}
        />
        <p className="mt-2 text-start text-xs text-slate-500">
          {t.minRoomsHelper}
        </p>
      </div>

      <fieldset>
        <legend className="mb-3 text-start text-sm font-bold">
          <RequiredLabel>{t.deliveryStatusLabel}</RequiredLabel>
        </legend>
        <div
          className={`grid gap-2 ${
            errors?.delivery_status
              ? 'rounded-xl border border-red-500 bg-red-50/20 p-2.5'
              : ''
          }`}
        >
          {deliveriesList.map((item) => (
            <label
              key={item}
              className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-sm transition ${
                data.delivery_status === item
                  ? 'border-[var(--brand-primary,#007a5a)] bg-[var(--brand-primary-light,#eaf8f2)] font-bold text-[var(--brand-primary,#007a5a)]'
                  : 'border-slate-200 bg-white hover:border-teal-300'
              }`}
            >
              <span>{item}</span>
              <input
                type="radio"
                checked={data.delivery_status === item}
                onChange={() => update('delivery_status', item)}
                className="accent-[var(--brand-primary,#007a5a)]"
              />
            </label>
          ))}
        </div>
        {errors?.delivery_status && (
          <p className="mt-1.5 text-start text-xs font-semibold text-red-600">
            {errors.delivery_status}
          </p>
        )}
      </fieldset>

      {/* اختيار المناطق المفضلة في جورجيا من القائمة المنسدلة الموحدة */}
      <div>
        <GeorgiaAreaSelect
          label={
            sDetails.georgiaLocationLabel ||
            `${t.areasLabelPrefix} *`
          }
          value=""
          onChange={addGeorgiaArea}
          error={errors?.preferred_areas}
          placeholder={
            data.preferred_areas.length > 0
              ? t.addAnotherAreaPlaceholder
              : sDetails.georgiaLocationPlaceholder
          }
        />

        {data.preferred_areas.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {data.preferred_areas.map((area) => (
              <span
                key={area}
                className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-primary,#007a5a)] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs"
              >
                <span>{getLocalizedGeorgiaAreaName(area, locale)}</span>
                <button
                  type="button"
                  aria-label={`${t.removeAreaAria} ${area}`}
                  onClick={() => removeGeorgiaArea(area)}
                  className="ms-0.5 rounded-full p-0.5 hover:bg-black/20"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* اختصارات سريعة لأشهر أحياء تبليسي وباتومي */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {quickGeorgiaAreas.map((item) => {
            const isSelected = data.preferred_areas.includes(item.id)
            const localizedName = getLocalizedGeorgiaAreaName(item.id, locale)
            return (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  isSelected
                    ? removeGeorgiaArea(item.id)
                    : addGeorgiaArea(item.id)
                }
                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                  isSelected
                    ? 'border-[var(--brand-primary,#007a5a)] bg-[var(--brand-primary-light,#eaf8f2)] text-[var(--brand-primary,#007a5a)]'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                }`}
              >
                {isSelected ? `✓ ${localizedName}` : `+ ${localizedName}`}
              </button>
            )
          })}
        </div>
      </div>

      <TurnstileBox />
    </div>
  )
}