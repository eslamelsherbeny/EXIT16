'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  getCurrentSellerProfileAction,
  processBuyerStep3Action,
} from '@/actions/submit-forms'
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  Loader2,
  MapPin,
  MessageCircle,
  Plus,
  UserRound,
  X,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  getLocalizedDeliveries,
  getLocalizedUnitTypes,
  MoneyField,
  Pills,
  RequiredLabel,
  SivrceLocationModalPicker,
  toEnglishDigits,
} from '@/components/features/seller/seller-shared'
import { splitStoredPhoneToCodeAndLocal } from '@/components/features/seller/seller-contact-step'
import { getLocalizedGeorgiaAreaName } from '@/components/shared/georgia-areas'
import {
  BuyerContactStep,
  type BuyerConflictState,
  type BuyerFormState,
} from '@/components/features/buyer/buyer-contact-step'
import { useTranslation, type LocaleCode } from '@/lib/i18n'

const ACTIVE_PLATFORM_COUNTRY = 'GE'
const DEFAULT_PHONE_CODE = '995'

const BUY_LOCATION_TRIGGER_I18N: Record<
  LocaleCode,
  {
    selectAreaPlaceholder: string
    addMoreAreasPlaceholder: string
    selectedCountWord: string
    clearAllBtn: string
  }
> = {
  ar: {
    selectAreaPlaceholder: 'اضغط لاختيار المدينة أو الحي في جورجيا...',
    addMoreAreasPlaceholder: 'اضغط لإضافة مدينة أو منطقة أخرى...',
    selectedCountWord: 'مناطق محددة',
    clearAllBtn: 'مسح الكل',
  },
  en: {
    selectAreaPlaceholder: 'Click to select city or district in Georgia...',
    addMoreAreasPlaceholder: 'Click to add another city or district...',
    selectedCountWord: 'selected',
    clearAllBtn: 'Clear All',
  },
  ru: {
    selectAreaPlaceholder: 'Нажмите для выбора города или района в Грузии...',
    addMoreAreasPlaceholder: 'Нажмите, чтобы добавить еще один район...',
    selectedCountWord: 'выбрано',
    clearAllBtn: 'Очистить все',
  },
  ka: {
    selectAreaPlaceholder: 'დააჭირეთ ქალაქის ან უბნის ასარჩევად...',
    addMoreAreasPlaceholder: 'დააჭირეთ სხვა უბნის დასამატებლად...',
    selectedCountWord: 'არჩეულია',
    clearAllBtn: 'გასუფთავება',
  },
}

function isFullCashPlanOption(plan: string, plansList: string[]): boolean {
  if (!plan) return false
  const lastPlan = plansList[plansList.length - 1]
  if (lastPlan && plan === lastPlan && plansList.length >= 4) return true
  const lower = plan.toLowerCase()
  return (
    lower.includes('كاش') ||
    lower.includes('cash') ||
    lower.includes('полная') ||
    lower.includes('налич') ||
    lower.includes('სრული')
  )
}

function StepValidationBanner({
  missingFields,
  prefixText,
  dir,
}: {
  missingFields: string[]
  prefixText: string
  dir: 'rtl' | 'ltr'
}) {
  if (!missingFields.length) return null
  const sep = dir === 'rtl' ? ' ، ' : ', '
  return (
    <div
      role="alert"
      className="mt-5 flex items-start gap-2.5 rounded-xl border border-red-300 bg-red-50/90 p-3.5 text-start text-xs leading-relaxed text-red-800 shadow-2xs"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600" />
      <div>
        <strong className="font-extrabold">{prefixText} </strong>
        <span className="font-bold">{missingFields.join(sep)}</span>
      </div>
    </div>
  )
}

function BuyersPageContent() {
  const searchParams = useSearchParams()
  const { t: dict, locale, dir, siteSettings } = useTranslation()
  const b = dict.buy
  const bVal = (b.validation as Record<string, string>) || {}
  const bSuccess =
    ((b as Record<string, any>).successScreen as Record<string, string>) || {}
  const sellVal = (dict.sell?.validation as Record<string, string>) || {}
  const currency = '$'

  const localizedUnitTypes: string[] =
    (dict as Record<string, any>).buyerFunnelPage?.unitTypes ||
    getLocalizedUnitTypes(dict, locale)

  const localizedDeliveries: string[] =
    dict.accountComponents?.buyer?.deliveryPreferences ||
    getLocalizedDeliveries(dict, locale)

  // قراءة رقم الواتساب من إعدادات الأدمن مباشرةً
  const waPhone = String(
    siteSettings?.whatsappNumber || dict.footer?.phone || '+201018595959'
  ).replace(/\D/g, '')

  const initialBudget = Number(
    toEnglishDigits(searchParams.get('budget') || '').replace(/,/g, '')
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
    confirmPassword: '',
    loginIdentifier: '',
    loginPassword: '',
    contactMessengers: ['whatsapp', 'viber'],
  }))

  // حفظ الأسماء المخصصة للمناطق المختارة من نافذة الخريطة لعرضها بدقة في الشارات
  const [areaDisplayLabels, setAreaDisplayLabels] = useState<
    Record<string, string>
  >({})

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

  const [submittedOrder, setSubmittedOrder] = useState<{
    reqId: string
    orderRef: string
    buyerName: string
    availableCash: number
    budget: number
    areas: string[]
  } | null>(null)

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
        const parsedPhone = splitStoredPhoneToCodeAndLocal(res.user.phone)
        setCountryCode(parsedPhone.code)
        setData((prev) => ({
          ...prev,
          name: prev.name || res.user?.name || '',
          email: prev.email || res.user?.email || '',
          phone: prev.phone || parsedPhone.local || '',
          contactMessengers:
            Array.isArray((res.user as any)?.contactMessengers) &&
            (res.user as any).contactMessengers.length > 0
              ? (res.user as any).contactMessengers
              : prev.contactMessengers,
        }))
      }
    }
    checkCurrentSession()
  }, [])

  useEffect(() => {
    setErrors({})
    setMissingFieldsList([])
    setError('')
  }, [locale])

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
    const isFullCash = isFullCashPlanOption(
      data.payment_plan,
      b.stepOne.paymentPlans
    )

    if (!data.available_cash || data.available_cash <= 0) {
      nextErrors.available_cash = bVal.required
      missing.push(cleanLabel(b.stepOne.availableCashLabel))
    }

    if (!data.payment_plan) {
      nextErrors.payment_plan = bVal.selectPaymentPlan
      missing.push(cleanLabel(b.stepOne.paymentPlanLabel))
    }

    if (!isFullCash && (!data.max_installment || data.max_installment <= 0)) {
      nextErrors.max_installment = bVal.required
      missing.push(cleanLabel(b.stepOne.maxInstallmentLabel))
    }

    const effectiveBudget =
      isFullCash && !data.budget ? data.available_cash : data.budget

    if (!effectiveBudget || effectiveBudget <= 0) {
      nextErrors.budget = bVal.required
      missing.push(cleanLabel(b.stepOne.budgetLabel))
    } else if (data.available_cash > effectiveBudget) {
      nextErrors.budget = bVal.cashExceedsBudget
      if (!missing.includes(cleanLabel(b.stepOne.budgetLabel))) {
        missing.push(cleanLabel(b.stepOne.budgetLabel))
      }
    }

    if (
      !isFullCash &&
      effectiveBudget > 0 &&
      data.max_installment > 0 &&
      data.max_installment > effectiveBudget
    ) {
      nextErrors.max_installment = bVal.installmentExceedsBudget
      if (!missing.includes(cleanLabel(b.stepOne.maxInstallmentLabel))) {
        missing.push(cleanLabel(b.stepOne.maxInstallmentLabel))
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setMissingFieldsList(missing)
      return
    }

    if (isFullCash && !data.budget) {
      update('budget', data.available_cash)
    }

    setErrors({})
    setMissingFieldsList([])
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setStep(2)
  }

  const nextFromTwo = () => {
    const nextErrors: Record<string, string> = {}
    const missing: string[] = []

    if (!data.unit_types.length) {
      nextErrors.unit_types = bVal.selectUnitType
      missing.push(cleanLabel(b.stepTwo.unitTypeLabel))
    }
    if (!data.delivery_status) {
      nextErrors.delivery_status = bVal.selectDeliveryStatus
      missing.push(cleanLabel(b.stepTwo.deliveryStatusLabel))
    }
    if (!data.preferred_areas.length) {
      nextErrors.preferred_areas = bVal.selectAtLeastOneArea
      missing.push(cleanLabel(b.stepTwo.areasLabelPrefix))
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setMissingFieldsList(missing)
      return
    }

    setErrors({})
    setMissingFieldsList([])
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setStep(3)
  }

  const showWhatsAppSuccessScreen = (info?: {
    reqId?: string
    orderRef?: string
  }) => {
    const effectiveName =
      authTab === 'session' && loggedUser
        ? loggedUser.name
        : data.name.trim() || loggedUser?.name || ''

    setSubmittedOrder({
      reqId: info?.reqId || '',
      orderRef: info?.orderRef || 'AE-BUY',
      buyerName: effectiveName,
      availableCash: Number(data.available_cash) || 0,
      budget: Number(data.budget) || Number(data.available_cash) || 0,
      areas: data.preferred_areas.map(
        (a) => areaDisplayLabels[a] || getLocalizedGeorgiaAreaName(a, locale)
      ),
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleFinalSubmit = async () => {
    setError('')
    const nextErrors: Record<string, string> = {}
    const missing: string[] = []
    const cleanPhoneDigits = toEnglishDigits(data.phone || '').replace(
      /[\s-]/g,
      ''
    )

    if (authTab === 'register') {
      if (!data.name.trim()) {
        nextErrors.name = bVal.required
        missing.push(cleanLabel(b.stepThree.nameLabel))
      }
      if (!cleanPhoneDigits || !/^[0-9]{7,15}$/.test(cleanPhoneDigits)) {
        nextErrors.phone = bVal.invalidPhone
        missing.push(cleanLabel(b.stepThree.phoneLabel))
      }
      if (!data.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        nextErrors.email = bVal.invalidEmail
        missing.push(cleanLabel(b.stepThree.emailLabel))
      }
      if (data.password.length < 8) {
        nextErrors.password = bVal.shortPassword
        missing.push(cleanLabel(b.stepThree.passwordLabel))
      }
      if (data.password !== (data.confirmPassword || '')) {
        nextErrors.confirmPassword = bVal.passwordMismatch
        missing.push(cleanLabel((b.stepThree as any).confirmPasswordLabel))
      }
    } else if (authTab === 'login') {
      if (!data.loginIdentifier?.trim()) {
        nextErrors.loginIdentifier = bVal.loginIdRequired
        missing.push(cleanLabel(b.stepThree.loginIdLabel))
      }
      if (!data.loginPassword?.trim()) {
        nextErrors.loginPassword = bVal.loginPassRequired
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
      const fullPhone = cleanPhoneDigits
        ? `+${countryCode.replace('+', '')}${cleanPhoneDigits.replace(/^0+/, '')}`
        : ''

      const res = await processBuyerStep3Action({
        mode: authTab,
        country: ACTIVE_PLATFORM_COUNTRY,
        userCountry: data.residenceCountry || ACTIVE_PLATFORM_COUNTRY,
        available_cash: Number(data.available_cash) || 0,
        max_installment: Number(data.max_installment) || 0,
        payment_plan: data.payment_plan,
        budget: Number(data.budget) || Number(data.available_cash) || 0,
        unit_types: data.unit_types,
        min_rooms: Number.parseInt(String(data.min_rooms), 10) || 0,
        delivery_status: data.delivery_status,
        preferred_areas: data.preferred_areas,
        name: data.name.trim(),
        phone: fullPhone,
        email: data.email.trim(),
        password: authTab === 'login' ? data.loginPassword : data.password,
        loginIdentifier: data.loginIdentifier,
        contactMessengers:
          data.contactMessengers && data.contactMessengers.length > 0
            ? data.contactMessengers
            : ['whatsapp'],
      })

      if (res.status === 'ok') {
        showWhatsAppSuccessScreen({
          reqId: res.unitId,
          orderRef: res.orderRef,
        })
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

      setError(res.error ?? bVal.submitFailed)
    } finally {
      setIsSubmitting(false)
    }
  }

  const missingPrefix =
    sellVal.missingBannerPrefix || bVal.missingBannerPrefix || ''

  const siteOrigin =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://exit-16.vercel.app'

  if (submittedOrder) {
    const areasText = submittedOrder.areas.join(dir === 'rtl' ? '، ' : ', ')
    const cleanVerifyLink = `${siteOrigin}/api/verify${submittedOrder.reqId ? `?leadId=${encodeURIComponent(submittedOrder.reqId)}` : ''}`
    const waConfirmMessage = `${bSuccess.waMsgPrefix} (${submittedOrder.orderRef}) — ${b.stepOne.availableCashLabel}: ($${submittedOrder.availableCash.toLocaleString('en-US')}) — ${b.stepOne.budgetLabel}: ($${submittedOrder.budget.toLocaleString('en-US')}) — ${b.stepTwo.areasLabelPrefix}: (${areasText}).\n${cleanVerifyLink}`

    return (
      <main
        dir={dir}
        className="min-h-screen bg-[var(--brand-surface,#f5f6f8)] px-4 py-10 text-[var(--brand-navy-text,#0a1128)] sm:px-6 lg:py-16"
      >
        <div className="mx-auto max-w-2xl">
          <section className="rounded-3xl border-2 border-[#007a5a] bg-white p-5 text-center shadow-md sm:p-10">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-[#eaf8f2] text-[#007a5a] shadow-xs">
              <CheckCircle2 className="size-9" />
            </div>

            <span className="inline-block rounded-full bg-[#eaf8f2] px-3.5 py-1 font-mono text-xs font-extrabold text-[#007a5a]">
              Ref: #{submittedOrder.orderRef}
            </span>

            <h1 className="mt-3 text-xl font-black text-[#0a1122] sm:text-3xl">
              {bSuccess.title}
            </h1>

            <p className="mx-auto mt-3 max-w-lg text-xs leading-relaxed font-semibold text-slate-600 sm:text-sm">
              {bSuccess.subtitle}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl border border-gray-100 bg-[#f8faf9] p-4 text-start text-xs sm:grid-cols-3">
              <div>
                <span className="block text-[11px] text-gray-400">
                  {b.stepOne.availableCashLabel}
                </span>
                <strong
                  dir="ltr"
                  className="mt-1 block text-sm font-black text-[#007a5a] tabular-nums"
                >
                  {currency}
                  {submittedOrder.availableCash.toLocaleString('en-US')}
                </strong>
              </div>

              <div>
                <span className="block text-[11px] text-gray-400">
                  {b.stepOne.budgetLabel}
                </span>
                <strong
                  dir="ltr"
                  className="mt-1 block text-sm font-black text-[#0a1122] tabular-nums"
                >
                  {currency}
                  {submittedOrder.budget.toLocaleString('en-US')}
                </strong>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <span className="block text-[11px] text-gray-400">
                  {b.stepTwo.areasLabelPrefix}
                </span>
                <strong className="mt-1 block truncate text-xs font-extrabold text-[#0a1122]">
                  📍 {areasText}
                </strong>
              </div>
            </div>

            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href={`https://wa.me/${waPhone}?text=${encodeURIComponent(waConfirmMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 text-xs font-extrabold text-white shadow-md transition hover:opacity-95 sm:w-auto sm:text-sm"
              >
                <MessageCircle className="size-4 shrink-0" />
                <span>{bSuccess.confirmWaBtn}</span>
              </a>

              <Link
                href="/account?view=buyer"
                className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#0a1122] px-6 text-xs font-extrabold text-white transition hover:bg-[#16223f] sm:w-auto sm:text-sm"
              >
                {bSuccess.goToAccountBtn}
              </Link>
            </div>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main
      dir={dir}
      className="min-h-screen bg-[var(--brand-surface,#f5f6f8)] px-3 py-8 text-[var(--brand-navy-text,#0a1128)] sm:px-6 sm:py-12 lg:py-16"
    >
      <div className="mx-auto max-w-3xl">
        <header className="px-1 text-center">
          <h1 className="text-2xl font-black tracking-tight text-[#0c513f] sm:text-4xl">
            {b.header.title}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-xs leading-6 text-slate-600 sm:mt-4 sm:text-sm sm:leading-7">
            {b.header.description}
          </p>
        </header>

        {step <= 2 && (
          <>
            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:gap-4">
              {b.header.benefits.map((item, index) => (
                <div
                  key={item}
                  className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-start text-xs leading-relaxed sm:items-center sm:gap-3 sm:px-5 sm:text-sm ${
                    index === 3
                      ? 'border-teal-300 bg-teal-50 font-bold text-teal-700'
                      : index === 4
                        ? 'border-slate-500 bg-transparent font-semibold'
                        : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  <Check className="mt-0.5 size-4 shrink-0 text-teal-700 sm:mt-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-2xl border border-slate-300 bg-white p-4 text-start shadow-2xs sm:mt-8 sm:p-5">
              <div className="flex items-center gap-2 text-xs font-extrabold text-[#0a1122] sm:text-sm">
                <UserRound className="size-4 shrink-0 text-[#007a5a]" />
                <span>{b.header.directBuyerTitle}</span>
              </div>
              <p className="mt-1.5 text-xs leading-6 text-slate-600">
                {b.header.directBuyerDesc}
              </p>
            </div>
          </>
        )}

        <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-7">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-black text-[#0a1122] sm:text-xl">
              {b.header.stepTitles[step - 1]}
            </h2>
            <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-700 sm:text-xs">
              {b.header.stepWord} {step} {b.header.ofWord} 3
            </span>
          </div>

          <div className="mt-4 flex gap-1.5 sm:mt-5">
            {[1, 2, 3].map((item) => (
              <span
                key={item}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  item <= step
                    ? 'bg-[var(--brand-primary,#007a5a)]'
                    : 'bg-slate-200'
                }`}
              />
            ))}
          </div>

          <div className="mt-6 sm:mt-7">
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
                areaDisplayLabels={areaDisplayLabels}
                setAreaDisplayLabels={setAreaDisplayLabels}
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
                setAuthTab={(tab) => {
                  setAuthTab(tab)
                  setErrors({})
                  setMissingFieldsList([])
                  setError('')
                }}
                conflictState={conflictState}
                setConflictState={setConflictState}
                onSuccessRedirect={(info) => {
                  showWhatsAppSuccessScreen(info)
                }}
              />
            )}
          </div>

          <StepValidationBanner
            missingFields={missingFieldsList}
            prefixText={missingPrefix}
            dir={dir}
          />

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-center text-xs font-bold text-red-700 sm:text-sm"
            >
              {error}
            </div>
          )}

          {!(step === 3 && conflictState) && (
            <div className="mt-6 flex gap-2.5 sm:mt-7 sm:gap-3">
              {step > 1 && (
                <button
                  type="button"
                  data-testid="buy-back-btn"
                  onClick={() => {
                    setMissingFieldsList([])
                    setErrors({})
                    setError('')
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                    setStep((step - 1) as 1 | 2)
                  }}
                  className="h-12 rounded-xl border border-slate-300 bg-white px-5 text-xs font-bold text-[#0a1122] transition hover:bg-slate-50 sm:px-7 sm:text-sm"
                >
                  {b.actions.backBtn}
                </button>
              )}
              <button
                type="button"
                data-testid="buy-next-submit-btn"
                disabled={isSubmitting}
                onClick={
                  step === 1
                    ? nextFromOne
                    : step === 2
                      ? nextFromTwo
                      : handleFinalSubmit
                }
                className={`h-12 flex-1 rounded-xl px-4 text-xs font-extrabold text-white transition active:scale-[0.98] sm:px-5 sm:text-sm ${
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

        {/* شريط التواصل عبر واتساب بتصميم متجاوب وأنيق على الموبايل والكمبيوتر */}
        {step <= 2 && (
          <div className="mt-6 flex flex-col items-stretch justify-between gap-3.5 rounded-2xl border border-[#1e293b] bg-[var(--brand-navy,#0a1122)] p-4 text-white shadow-sm sm:flex-row sm:items-center sm:px-6 sm:py-4">
            <div className="flex items-center gap-3 text-start">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#25D366]/15 text-[#25D366]">
                <MessageCircle className="size-5" />
              </span>
              <span className="text-xs font-bold leading-relaxed text-white/95 sm:text-sm">
                {b.header.whatsappBarText}
              </span>
            </div>
            <a
              href={`https://wa.me/${waPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 text-xs font-extrabold text-white shadow-xs transition active:scale-[0.98] hover:bg-[#20bd5a] sm:h-10 sm:rounded-full sm:text-sm"
            >
              <MessageCircle className="size-4 shrink-0" />
              <span>{b.header.whatsappBarBtn}</span>
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
  const { t: dict } = useTranslation()
  const t = dict.buy.stepOne
  const currency = '$'
  const isFullCash = isFullCashPlanOption(data.payment_plan, t.paymentPlans)

  return (
    <div className="flex flex-col gap-6">
      <MoneyField
        error={errors?.available_cash}
        label={t.availableCashLabel}
        value={data.available_cash ? String(data.available_cash) : ''}
        currencySymbol={currency}
        helper={t.availableCashHelper}
        update={(val) => {
          const num = Number(val) || 0
          update('available_cash', num)
          if (isFullCash) {
            update('budget', num)
          }
        }}
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
              className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-xs transition sm:text-sm ${
                data.payment_plan === item
                  ? 'border-[var(--brand-primary,#007a5a)] bg-[var(--brand-primary-light,#eaf8f2)] font-bold text-[var(--brand-primary,#007a5a)]'
                  : 'border-slate-200 bg-white hover:border-teal-300'
              }`}
            >
              <span>{item}</span>
              <input
                type="radio"
                checked={data.payment_plan === item}
                onChange={() => {
                  update('payment_plan', item)
                  if (isFullCashPlanOption(item, t.paymentPlans)) {
                    update('max_installment', 0)
                    if (data.available_cash > 0 && !data.budget) {
                      update('budget', data.available_cash)
                    }
                  }
                }}
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

      {!isFullCash && (
        <MoneyField
          error={errors?.max_installment}
          label={t.maxInstallmentLabel}
          value={data.max_installment ? String(data.max_installment) : ''}
          currencySymbol={currency}
          update={(val) => update('max_installment', Number(val) || 0)}
        />
      )}

      <MoneyField
        error={errors?.budget}
        label={t.budgetLabel}
        value={data.budget ? String(data.budget) : ''}
        currencySymbol={currency}
        helper={t.budgetHelper}
        update={(val) => update('budget', Number(val) || 0)}
      />
    </div>
  )
}

function BuyerStepTwo({
  data,
  update,
  errors,
  unitTypesList,
  deliveriesList,
  areaDisplayLabels,
  setAreaDisplayLabels,
}: {
  data: BuyerFormState
  update: <K extends keyof BuyerFormState>(
    key: K,
    value: BuyerFormState[K]
  ) => void
  errors?: Record<string, string>
  unitTypesList: string[]
  deliveriesList: string[]
  areaDisplayLabels: Record<string, string>
  setAreaDisplayLabels: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >
}) {
  const { t: dict, locale } = useTranslation()
  const t = dict.buy.stepTwo
  const sDetails = (dict.sell?.detailsStep as Record<string, any>) || {}
  const trL =
    BUY_LOCATION_TRIGGER_I18N[locale] || BUY_LOCATION_TRIGGER_I18N.ar

  const addGeorgiaAreaFromModal = (
    areaId: string,
    displayLabel?: string
  ) => {
    const cleanId = (areaId || displayLabel || '').trim()
    if (!cleanId) return
    if (displayLabel) {
      setAreaDisplayLabels((prev) => ({
        ...prev,
        [cleanId]: displayLabel,
      }))
    }
    if (!data.preferred_areas.includes(cleanId)) {
      update('preferred_areas', [...data.preferred_areas, cleanId])
    }
  }

  const removeGeorgiaArea = (areaId: string) => {
    update(
      'preferred_areas',
      data.preferred_areas.filter((item) => item !== areaId)
    )
  }

  const roomQuickOptions = [1, 2, 3, 4]

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
        <Label htmlFor="rooms" className="block text-start font-bold">
          {t.minRoomsLabel}
        </Label>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {roomQuickOptions.map((rm) => {
            const active = data.min_rooms === rm
            return (
              <button
                key={rm}
                type="button"
                onClick={() => update('min_rooms', active ? 0 : rm)}
                className={`h-11 min-w-[56px] rounded-xl border px-3 text-sm font-extrabold transition sm:min-w-[60px] sm:px-3.5 ${
                  active
                    ? 'border-[var(--brand-primary,#007a5a)] bg-[var(--brand-primary-light,#eaf8f2)] text-[var(--brand-primary,#007a5a)]'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-teal-400'
                }`}
              >
                <span dir="ltr">+{rm}</span>
              </button>
            )
          })}
          <Input
            id="rooms"
            type="text"
            inputMode="numeric"
            dir="ltr"
            value={data.min_rooms || ''}
            onChange={(event) => {
              const clean = toEnglishDigits(event.target.value).replace(
                /[^0-9]/g,
                ''
              )
              update('min_rooms', Number(clean) || 0)
            }}
            className="h-11 w-24 rounded-xl text-center text-base font-bold sm:w-28"
            placeholder={t.minRoomsPlaceholder}
          />
        </div>
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
              className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-xs transition sm:text-sm ${
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

      {/* نفس نافذة الاختيار الموجودة في صفحة "عايز تبيع" بالظبط (SivrceLocationModalPicker) بدون أي اقتراحات تحتها */}
      <div className="text-start">
        <SivrceLocationModalPicker
          label={
            sDetails.georgiaLocationLabel || `${t.areasLabelPrefix} *`
          }
          value=""
          displayText=""
          error={errors?.preferred_areas}
          onSelectLocation={({ areaId, displayLabel }) => {
            addGeorgiaAreaFromModal(areaId, displayLabel)
          }}
          customTrigger={({ onClick }) => (
            <button
              type="button"
              onClick={onClick}
              className={`flex h-12 w-full items-center justify-between gap-2 rounded-xl border px-4 text-start text-xs font-bold transition sm:text-sm ${
                errors?.preferred_areas
                  ? 'border-red-500 bg-red-50/20 text-red-700'
                  : data.preferred_areas.length > 0
                    ? 'border-[var(--brand-primary,#007a5a)] bg-[#eaf8f2]/40 text-[#0a1122] hover:bg-[#eaf8f2]/70'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-[#2563eb]'
              }`}
            >
              <span className="flex min-w-0 items-center gap-2 truncate">
                <MapPin
                  className={`size-4 shrink-0 ${
                    data.preferred_areas.length > 0
                      ? 'text-[var(--brand-primary,#007a5a)]'
                      : 'text-slate-400'
                  }`}
                />
                <span className="truncate">
                  {data.preferred_areas.length > 0
                    ? `${trL.addMoreAreasPlaceholder} (${data.preferred_areas.length} ${trL.selectedCountWord})`
                    : trL.selectAreaPlaceholder}
                </span>
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                {data.preferred_areas.length > 0 && (
                  <Plus className="size-4 text-[var(--brand-primary,#007a5a)]" />
                )}
                <ChevronDown className="size-4" />
              </span>
            </button>
          )}
        />

        {errors?.preferred_areas && (
          <p className="mt-1.5 text-start text-xs font-semibold text-red-600">
            {errors.preferred_areas}
          </p>
        )}

        {/* عرض الأماكن التي اختارها المشتري من النافذة مع إمكانية حذف أي مكان أو فتح النافذة لإضافة المزيد */}
        {data.preferred_areas.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {data.preferred_areas.map((area) => {
              const displayLabel =
                areaDisplayLabels[area] ||
                getLocalizedGeorgiaAreaName(area, locale)
              return (
                <span
                  key={area}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-primary,#007a5a)] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs"
                >
                  <span>{displayLabel}</span>
                  <button
                    type="button"
                    aria-label={`${t.removeAreaAria} ${area}`}
                    onClick={() => removeGeorgiaArea(area)}
                    className="ms-0.5 rounded-full p-0.5 hover:bg-black/20"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              )
            })}

            {data.preferred_areas.length > 1 && (
              <button
                type="button"
                onClick={() => update('preferred_areas', [])}
                className="ms-1 text-xs font-bold text-red-600 underline hover:text-red-700"
              >
                {trL.clearAllBtn}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function BuyersPage() {
  return (
    <Suspense fallback={null}>
      <BuyersPageContent />
    </Suspense>
  )
}