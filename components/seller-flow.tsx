'use client'

import { useEffect, useState, useTransition } from 'react'
import { Check, Copy, ImagePlus, Loader2, Star, UserRound } from 'lucide-react'
import {
  getCurrentSellerProfileAction,
  saveSellProgress,
  submitSellRequest,
  verifyMagicTokenAction,
} from '@/app/actions/submit-forms'
import { requestUnitPromotionAction } from '@/app/actions/account-actions'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { TurnstileBox } from '@/components/funnel-shell'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import arDict from '@/dictionaries/ar.json'
import {
  Actions,
  areasCatalogByCountry,
  deliveries,
  features,
  Field,
  finishings,
  formatAmount,
  getCountryConfig,
  getHeaderCookieCountry,
  MoneyField,
  normalizeArabicText,
  Pills,
  PLATFORM_COUNTRIES,
  RequiredLabel,
  SearchableCountryField,
  ToggleSection,
  unitTypes,
  years,
} from './seller/seller-shared'
import { ContactStep } from './seller/seller-contact-step'

const s = arDict.sell

export function SellerFlow() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isMagicResume, setIsMagicResume] = useState(false)
  const [unitId, setUnitId] = useState<string>('')
  const [orderRef, setOrderRef] = useState<string>('AE-X5QUKE')

  const [form, setForm] = useState<Record<string, string>>({
    countryCode: '20',
    unitCountry: 'EG',
  })
  const [selected, setSelected] = useState<Record<string, string[]>>({})
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [pending, startTransition] = useTransition()

  const [loggedUser, setLoggedUser] = useState<{
    id: string
    name: string
    email: string
    phone: string
  } | null>(null)

  useEffect(() => {
    const activeCookieCountry = getHeaderCookieCountry()
    setForm((prev) => ({
      ...prev,
      unitCountry: prev.unitCountry || activeCookieCountry,
    }))

    async function initFlow() {
      const profileRes = await getCurrentSellerProfileAction()
      if (profileRes.isLoggedIn && profileRes.user) {
        setLoggedUser(profileRes.user)
      }

      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        const magicToken = params.get('magic')
        const editUnitId = params.get('editUnitId') || params.get('resume')
        const isNewUnit = params.get('new') === '1'
        const targetStep = Number(params.get('step')) || 3

        if (magicToken) {
          const res = await verifyMagicTokenAction(magicToken)
          if (res.valid && res.unit) {
            const u = res.unit
            setUnitId(String(u.id))
            setOrderRef(
              `AE-${String(u.id).replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase()}`
            )
            setForm((prev) => ({
              ...prev,
              unitCountry: u.country_code || u.country || activeCookieCountry,
              developer: u.developer_name || '',
              developerDetails: u.developer_name || '',
              project: u.project_name || '',
              projectDetails: u.project_name || '',
              location: u.area || '',
              areaSize: String(u.size || ''),
              garden: String(u.garden_size || ''),
              rooms: String(u.rooms || ''),
              bathrooms: String(u.bathrooms || ''),
              floor: String(u.floor_number ?? ''),
              description: u.description || '',
              contractPrice: String(u.contract_price || ''),
              contractPrice2: String(u.contract_price || ''),
              paidAmount: String(u.paid_amount || ''),
              paidAmount2: String(u.paid_amount || ''),
              marketPrice: String(u.market_price || u.contract_price || ''),
              installment: String(u.installment_amount || ''),
              remainingYears: String(u.years_left ?? ''),
              discountAmount: String(u.discount_amount || ''),
              overdueCount: String(u.overdue_installments || ''),
              name: u.name || '',
              phone: u.phone || '',
              email: u.email || '',
              owner: 'yes',
              confirmed: 'yes',
            }))
            setIsMagicResume(true)
            setStep(3)
            return
          }
        }

        if (editUnitId) {
          const supabase = createClient()
          const { data: u } = await supabase
            .from('sell_requests')
            .select('*')
            .eq('id', editUnitId)
            .maybeSingle()

          if (u) {
            setUnitId(String(u.id))
            setOrderRef(
              `AE-${String(u.id).replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase()}`
            )
            setForm((prev) => ({
              ...prev,
              unitCountry: u.country_code || u.country || activeCookieCountry,
              developer: u.developer_name || '',
              developerDetails: u.developer_name || '',
              project: u.project_name || '',
              projectDetails: u.project_name || '',
              location: u.area || '',
              areaSize: u.size ? String(u.size) : '',
              garden: u.garden_size ? String(u.garden_size) : '',
              rooms: u.rooms ? String(u.rooms) : '',
              bathrooms: u.bathrooms ? String(u.bathrooms) : '',
              floor:
                u.floor_number !== null && u.floor_number !== undefined
                  ? String(u.floor_number)
                  : '',
              description: u.description || '',
              contractPrice: u.contract_price ? String(u.contract_price) : '',
              contractPrice2: u.contract_price ? String(u.contract_price) : '',
              paidAmount: u.paid_amount ? String(u.paid_amount) : '',
              paidAmount2: u.paid_amount ? String(u.paid_amount) : '',
              marketPrice: u.market_price ? String(u.market_price) : '',
              installment: u.installment_amount
                ? String(u.installment_amount)
                : '',
              remainingYears:
                u.years_left !== null && u.years_left !== undefined
                  ? String(u.years_left)
                  : '',
              discountAmount: u.discount_amount ? String(u.discount_amount) : '',
              overdueCount: u.overdue_installments
                ? String(u.overdue_installments)
                : '',
              name: u.name || profileRes.user?.name || '',
              phone: u.phone || profileRes.user?.phone || '',
              email: u.email || profileRes.user?.email || '',
              owner: 'yes',
              confirmed: 'yes',
            }))
            setSelected({
              type: u.unit_type ? [u.unit_type] : [],
              finishing: u.finishing ? [u.finishing] : [],
              delivery: u.delivery_status ? [u.delivery_status] : [],
              features: Array.isArray(u.features) ? u.features : [],
              year: u.contract_year ? [String(u.contract_year)] : [],
              frequency: u.installment_frequency
                ? [u.installment_frequency]
                : [],
              annualInstallment: [u.has_annual_installment ? 'yes' : 'no'],
              discountOffer: [u.willing_to_discount ? 'yes' : 'no'],
              overdueInstallments: [u.has_overdue_installments ? 'yes' : 'no'],
            })
            if (Array.isArray(u.images)) {
              setImages(u.images)
            }
            setIsMagicResume(true)
            setStep(targetStep)
            return
          }
        }

        if (isNewUnit && profileRes.isLoggedIn && profileRes.user) {
          setForm((prev) => ({
            ...prev,
            unitCountry: activeCookieCountry,
            name: profileRes.user?.name || '',
            phone: profileRes.user?.phone || '',
            email: profileRes.user?.email || '',
            owner: 'yes',
            confirmed: 'yes',
          }))
          setIsMagicResume(true)
          setStep(3)
        }
      }
    }

    initFlow()
  }, [])

  const update = (key: string, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: '' }))
  }

  const toggle = (group: string, value: string) => {
    setErrors((current) => ({ ...current, [group]: '' }))
    setSelected((current) => ({
      ...current,
      [group]: [
        'annualInstallment',
        'discountOffer',
        'overdueInstallments',
        'type',
        'finishing',
        'delivery',
        'year',
        'frequency',
      ].includes(group)
        ? [value]
        : current[group]?.includes(value)
          ? current[group].filter((item) => item !== value)
          : [...(current[group] ?? []), value],
    }))
  }

  const go = (next: number) => {
    if (next <= step) return setStep(next)

    const amount = (key: string) =>
      Number((form[key] ?? '').replace(/,/g, '')) || 0
    const nextErrors: Record<string, string> = {}

    if (step === 1) {
      if (!form.unitCountry) nextErrors.unitCountry = s.validation.selectCountry
      if (!form.developer) nextErrors.developer = s.validation.required
      if (!form.project) nextErrors.project = s.validation.required
      if (!form.contractPrice) nextErrors.contractPrice = s.validation.required
      if (!form.paidAmount) nextErrors.paidAmount = s.validation.required
      if (form.confirmed !== 'yes')
        nextErrors.confirmed = s.validation.confirmRequired
      if (amount('paidAmount') > amount('contractPrice'))
        nextErrors.paidAmount = s.validation.paidExceedsContract
    }

    if (step === 3) {
      if (!form.unitCountry) nextErrors.unitCountry = s.validation.selectCountry
      if (!form.developerDetails && !form.developer)
        nextErrors.developerDetails = s.validation.required
      if (!form.projectDetails && !form.project)
        nextErrors.projectDetails = s.validation.required
      if (!form.location) nextErrors.location = s.validation.required
      if (!selected.type?.[0]) nextErrors.type = s.validation.required
      if (!form.areaSize) nextErrors.areaSize = s.validation.required
      if (!form.rooms) nextErrors.rooms = s.validation.required
      if (!form.bathrooms) nextErrors.bathrooms = s.validation.required
      if (selected.type?.[0] === unitTypes[0] && !form.floor)
        nextErrors.floor = s.validation.required
      if (!selected.finishing?.[0]) nextErrors.finishing = s.validation.required
      if (!selected.delivery?.[0]) nextErrors.delivery = s.validation.required
      if (!form.description) nextErrors.description = s.validation.required
    }

    if (step === 4) {
      if (!form.contractPrice) nextErrors.contractPrice = s.validation.required
      if (!selected.year?.[0]) nextErrors.year = s.validation.required
      if (!form.paidAmount) nextErrors.paidAmount = s.validation.required
      if (!form.marketPrice) nextErrors.marketPrice = s.validation.required
      if (!form.installment) nextErrors.installment = s.validation.required
      if (!selected.frequency?.[0])
        nextErrors.frequency = s.validation.selectFrequency
      if (!selected.annualInstallment?.[0])
        nextErrors.annualInstallment = s.validation.selectYesNo
      if (!selected.discountOffer?.[0])
        nextErrors.discountOffer = s.validation.selectYesNo
      if (!selected.overdueInstallments?.[0])
        nextErrors.overdueInstallments = s.validation.selectYesNo
      if (amount('paidAmount') > amount('contractPrice'))
        nextErrors.paidAmount = s.validation.paidExceedsContract
      if (amount('installment') > amount('contractPrice'))
        nextErrors.installment = s.validation.paidExceedsContract
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setErrors({})

    if (next === 3)
      setForm((current) => ({
        ...current,
        developerDetails: current.developerDetails || current.developer,
        projectDetails: current.projectDetails || current.project,
      }))
    if (next === 4)
      setForm((current) => ({
        ...current,
        contractPrice2: current.contractPrice,
        paidAmount2: current.paidAmount,
        marketPrice: current.marketPrice || current.currentDeveloperPrice,
      }))

    setStep(next)
  }

  const saveProgress = async () => {
    const data = new FormData()
    const put = (key: string, value?: string) => {
      if (value) data.set(key, value)
    }
    if (unitId) put('unit_id', unitId)
    put('country', form.unitCountry || 'EG')
    put('developer_name', form.developerDetails || form.developer)
    put('project_name', form.projectDetails || form.project)
    put('area', form.location)
    put('unit_type', selected.type?.[0])
    put('size', form.areaSize)
    put('rooms', form.rooms)
    put('bathrooms', form.bathrooms)
    put('finishing', selected.finishing?.[0])
    put('delivery_status', selected.delivery?.[0])
    put('description', form.description)
    put('contract_price', form.contractPrice2 || form.contractPrice)
    put('paid_amount', form.paidAmount2 || form.paidAmount)
    put('market_price', form.marketPrice)
    put('installment_amount', form.installment)
    put('installment_frequency', selected.frequency?.[0])
    put('contract_year', selected.year?.[0])
    images.forEach((image) => data.append('image', image))

    const result = await saveSellProgress(data)
    if (result.success) {
      router.push('/account')
    } else {
      setError(result.error ?? s.validation.saveFailed)
    }
  }

  const submit = () => {
    const data = new FormData()
    const setValue = (key: string, value: string | number | undefined) => {
      if (value !== undefined && value !== '') data.set(key, String(value))
    }
    const selectedValue = (group: string) => selected[group]?.[0] ?? ''
    const setList = (key: string, values: string[] | undefined) =>
      values?.forEach((value) => data.append(key, value))
    const setToggle = (key: string, group: string) => {
      if (selected[group]?.[0] === 'yes') data.set(key, 'on')
    }

    if (unitId) setValue('unit_id', unitId)
    setValue('country', form.unitCountry || 'EG')
    setValue('developer_name', form.developerDetails || form.developer)
    setValue('project_name', form.projectDetails || form.project)
    setValue('area', form.location)
    setValue('unit_type', selected.type?.join(', '))
    setValue('size', form.areaSize)
    setValue('contract_price', form.contractPrice2 || form.contractPrice)
    setValue('paid_amount', form.paidAmount2 || form.paidAmount)
    setValue('market_price', form.marketPrice)
    setValue('installment_amount', form.installment)
    setValue('years_left', form.remainingYears)
    setValue('garden_size', form.garden)
    setValue('rooms', form.rooms)
    setValue('bathrooms', form.bathrooms)
    setValue('floor_number', form.floor)
    setValue('finishing', selectedValue('finishing'))
    setValue('delivery_status', selectedValue('delivery'))
    setList('feature', selected.features)
    setValue('description', form.description)
    setValue('contract_year', selectedValue('year'))
    setValue('installment_frequency', selectedValue('frequency'))
    setToggle('has_annual_installment', 'annualInstallment')
    setToggle('willing_to_discount', 'discountOffer')
    setToggle('has_overdue_installments', 'overdueInstallments')
    setValue('discount_amount', form.discountAmount)
    setValue('overdue_installments', form.overdueCount)
    setValue('name', form.name || loggedUser?.name || '')
    setValue(
      'phone',
      form.phone
        ? form.phone.startsWith('+')
          ? form.phone
          : `+${form.countryCode ?? '20'}${form.phone.replace(/^0+/, '')}`
        : loggedUser?.phone || ''
    )
    setValue('email', form.email || loggedUser?.email)
    setValue('password', form.password)
    setValue('is_original_owner', form.owner === 'yes' ? 'on' : '')
    setValue('is_confirmed', form.confirmed === 'yes' ? 'on' : '')
    setList('image', images)
    setError('')

    startTransition(async () => {
      const result = await submitSellRequest(data)
      if (result.success) {
        if (result.unitId) setUnitId(result.unitId)
        if (result.orderRef) setOrderRef(result.orderRef)
        setSubmitted(true)
      } else {
        setError(result.error ?? s.validation.submitFailed)
      }
    })
  }

  const totalStepsCount = isMagicResume ? 4 : 6
  const currentDisplayStep = isMagicResume ? Math.max(1, step - 2) : step

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[var(--brand-surface,#f5f6f8)] px-3 py-8 text-[var(--brand-navy-text,#0a1128)] sm:px-5 md:py-12"
    >
      <div className="mx-auto max-w-3xl">
        {!submitted && (
          <header className="mb-7 text-center">
            <h1 className="text-3xl font-black tracking-tight text-[#123c35] sm:text-4xl">
              {isMagicResume ? s.header.resumeTitle : s.header.mainTitle}
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              {isMagicResume ? s.header.resumeDesc : s.header.mainDesc}
            </p>
          </header>
        )}

        {step <= 2 && !isMagicResume && !submitted && (
          <>
            <div className="mb-4 grid gap-3">
              {s.header.highlights.map((item, index) => (
                <div
                  key={item}
                  className={`flex items-center gap-3 rounded-xl border bg-white px-5 py-3 text-sm ${
                    index === 3
                      ? 'border-teal-300 bg-emerald-50 font-bold text-teal-700'
                      : 'border-slate-200 text-slate-700'
                  }`}
                >
                  <Check className="size-4 shrink-0 text-teal-700" />
                  {item}
                </div>
              ))}
            </div>
            <div className="mb-7 rounded-xl border border-slate-500 bg-transparent px-5 py-4 text-center text-sm font-semibold">
              {s.header.ownersOnlyBanner}
            </div>
          </>
        )}

        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
          <CardContent className="p-4 sm:p-6 md:p-7">
            {!submitted && (
              <div className="mb-6 rounded-2xl border border-slate-600 px-4 py-4 text-center text-sm leading-7">
                <div className="mb-1 flex items-center justify-center gap-2 font-bold">
                  <UserRound className="size-4" /> {s.header.ownersOnlyCardTitle}
                </div>
                {s.header.ownersOnlyCardDesc}
              </div>
            )}

            {!submitted && (
              <div className="mb-7 flex items-center gap-4">
                <div className="flex flex-1 gap-1.5">
                  {Array.from({ length: totalStepsCount }, (_, index) => (
                    <span
                      key={index}
                      className={`h-1.5 flex-1 rounded-full ${
                        index < currentDisplayStep
                          ? 'bg-teal-700'
                          : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <Badge className="shrink-0 rounded-full bg-slate-100 text-slate-700">
                  {s.header.stepWord} {currentDisplayStep} {s.header.ofWord}{' '}
                  {totalStepsCount}
                </Badge>
              </div>
            )}

            {!submitted && (
              <h2 className="mb-6 text-2xl font-black text-[#102238]">
                {s.header.stepTitles[step - 1]}
              </h2>
            )}

            {step === 1 && (
              <BasicStep form={form} update={update} go={go} errors={errors} />
            )}
            {step === 2 && (
              <ContactStep
                form={form}
                update={update}
                go={go}
                errors={errors}
                setErrors={setErrors}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                loggedUser={loggedUser}
                unitId={unitId}
                setUnitId={setUnitId}
                setOrderRef={setOrderRef}
              />
            )}
            {step === 3 && (
              <DetailsStep
                form={form}
                update={update}
                selected={selected}
                toggle={toggle}
                go={go}
                errors={errors}
                onSave={saveProgress}
              />
            )}
            {step === 4 && (
              <PricingStep
                form={form}
                update={update}
                selected={selected}
                toggle={toggle}
                go={go}
                errors={errors}
                onSave={saveProgress}
              />
            )}
            {step === 5 && (
              <PhotosStep
                go={go}
                images={images}
                setImages={setImages}
                uploading={uploading}
                setUploading={setUploading}
                onSave={saveProgress}
              />
            )}
            {step === 6 && (
              <ReviewStep
                form={form}
                selected={selected}
                pending={pending}
                submitted={submitted}
                error={error}
                submit={submit}
                go={go}
                onSave={saveProgress}
                imagesLength={images.length}
                orderRef={orderRef}
                unitId={unitId}
              />
            )}
          </CardContent>
        </Card>

        {step <= 2 && !submitted && (
          <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl bg-[var(--brand-navy,#0a1122)] px-5 py-4 text-sm text-white">
            <span>{s.header.whatsappBarText}</span>
            <a
              href="https://wa.me/201018595959"
              className="rounded-full bg-green-500 px-4 py-2 font-bold text-white"
            >
              {s.header.whatsappBarBtn}
            </a>
          </div>
        )}
      </div>
    </main>
  )
}

function BasicStep({
  form,
  update,
  go,
  errors,
}: {
  form: Record<string, string>
  update: (key: string, value: string) => void
  go: (step: number) => void
  errors: Record<string, string>
}) {
  const t = s.basicStep
  const countryCfg = getCountryConfig(form.unitCountry)
  const currency = countryCfg.currencySymbol

  return (
    <div className="flex flex-col gap-6">
      <SearchableCountryField
        value={form.unitCountry || 'EG'}
        onChange={(code) => update('unitCountry', code)}
        label={s.shared.unitCountryLabel}
        options={PLATFORM_COUNTRIES}
        error={errors.unitCountry}
      />
      <Field
        error={errors.developer}
        label={t.developer}
        id="developer"
        value={form.developer}
        update={(value) => update('developer', value)}
      />
      <Field
        error={errors.project}
        label={t.project}
        id="project"
        value={form.project}
        update={(value) => update('project', value)}
      />
      <MoneyField
        error={errors.contractPrice}
        label={t.contractPrice}
        value={form.contractPrice}
        currencySymbol={currency}
        update={(value) => update('contractPrice', value)}
      />
      <MoneyField
        error={errors.paidAmount}
        label={t.paidAmount}
        value={form.paidAmount}
        currencySymbol={currency}
        update={(value) => update('paidAmount', value)}
      />
      <div className="rounded-xl bg-sky-50 p-4 text-sm font-semibold text-sky-700">
        {t.receiveBoxPrefix}{' '}
        {Number(form.paidAmount || 0).toLocaleString('en-US')} {currency}{' '}
        {t.receiveBoxSuffix}
      </div>
      <div>
        <label
          dir="rtl"
          className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-right text-sm leading-7 ${
            errors.confirmed
              ? 'border-red-500 bg-red-50/30'
              : 'border-slate-200'
          }`}
        >
          <Checkbox
            className="m-0 shrink-0"
            checked={form.confirmed === 'yes'}
            onCheckedChange={(checked) =>
              update('confirmed', checked ? 'yes' : '')
            }
          />
          {t.confirmLabel}
        </label>
        {errors.confirmed && (
          <p className="mt-1.5 text-right text-xs font-semibold text-red-600">
            {errors.confirmed}
          </p>
        )}
      </div>
      <Field
        label={t.currentDevPrice}
        id="currentDeveloperPrice"
        type="number"
        helper={
          form.currentDeveloperPrice
            ? formatAmount(form.currentDeveloperPrice, currency)
            : t.currentDevPriceHelper
        }
        value={form.currentDeveloperPrice}
        update={(value) => update('currentDeveloperPrice', value)}
      />
      <TurnstileBox />
      <Actions go={go} next={2} back={false} />
    </div>
  )
}

function DetailsStep({
  form,
  update,
  selected,
  toggle,
  go,
  errors,
  onSave,
}: {
  form: Record<string, string>
  update: (key: string, value: string) => void
  selected: Record<string, string[]>
  toggle: (group: string, value: string) => void
  go: (step: number) => void
  errors: Record<string, string>
  onSave: () => void
}) {
  const t = s.detailsStep
  const [areaOpen, setAreaOpen] = useState(false)
  const query = form.location ?? ''

  const countryCode = (form.unitCountry || 'EG').toUpperCase()
  const countryConfig = getCountryConfig(countryCode)
  const rawAreas =
    areasCatalogByCountry[countryCode] || areasCatalogByCountry.EG

  const groups = rawAreas
    .map(
      ([title, items]) =>
        [
          title,
          items.filter((item) =>
            normalizeArabicText(item).includes(normalizeArabicText(query))
          ),
        ] as const
    )
    .filter(([, items]) => items.length)

  return (
    <div className="flex flex-col gap-6">
      <SearchableCountryField
        value={form.unitCountry || 'EG'}
        onChange={(code) => {
          update('unitCountry', code)
          update('location', '')
        }}
        label={s.shared.unitCountryLabel}
        options={PLATFORM_COUNTRIES}
        error={errors.unitCountry}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          error={errors.developerDetails}
          label={s.basicStep.developer}
          id="developerDetails"
          value={form.developerDetails ?? form.developer}
          update={(value) => update('developerDetails', value)}
        />
        <Field
          error={errors.projectDetails}
          label={s.basicStep.project}
          id="projectDetails"
          value={form.projectDetails ?? form.project}
          update={(value) => update('projectDetails', value)}
        />
      </div>

      <div className="relative">
        <Label htmlFor="location" className="mb-2 block text-right">
          {t.locationLabelPrefix} {countryConfig.nameAr} *
        </Label>
        <Input
          id="location"
          dir="rtl"
          placeholder={`${t.locationPlaceholderPrefix} ${countryConfig.nameAr}...`}
          value={query}
          onFocus={() => setAreaOpen(true)}
          onChange={(event) => {
            update('location', event.target.value)
            setAreaOpen(true)
          }}
          className={`h-12 rounded-xl text-right ${
            errors.location ? 'border-red-500 bg-red-50/20' : ''
          }`}
        />
        {errors.location && (
          <p className="mt-1.5 text-right text-xs font-semibold text-red-600">
            {errors.location}
          </p>
        )}
        {areaOpen && groups.length > 0 && (
          <div className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
            {groups.map(([title, items]) => (
              <div key={title}>
                <p className="px-3 py-2 text-right text-xs font-black text-slate-500">
                  {title}
                </p>
                {items.map((item) => (
                  <button
                    type="button"
                    key={item}
                    className="block w-full rounded-lg px-3 py-2 text-right text-sm hover:bg-emerald-50"
                    onClick={() => {
                      update('location', item)
                      setAreaOpen(false)
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-right font-bold">
          <RequiredLabel>{t.unitTypeLabel}</RequiredLabel>
        </legend>
        <Pills
          error={errors.type}
          items={unitTypes}
          selected={selected.type ?? []}
          onToggle={(value) => toggle('type', value)}
        />
      </fieldset>

      <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
        <Field
          error={errors.areaSize}
          label={t.areaSizeLabel}
          id="areaSize"
          type="number"
          value={form.areaSize}
          update={(value) => update('areaSize', value)}
        />
        <Field
          label={t.gardenLabel}
          id="garden"
          type="number"
          value={form.garden}
          update={(value) => update('garden', value)}
        />
        <Field
          error={errors.rooms}
          label={t.roomsLabel}
          id="rooms"
          type="number"
          value={form.rooms}
          update={(value) => update('rooms', value)}
        />
        <Field
          error={errors.bathrooms}
          label={t.bathroomsLabel}
          id="bathrooms"
          type="number"
          value={form.bathrooms}
          update={(value) => update('bathrooms', value)}
        />
      </div>

      {selected.type?.[0] === unitTypes[0] && (
        <Field
          error={errors.floor}
          label={t.floorLabel}
          id="floor"
          type="number"
          helper={t.floorHelper}
          value={form.floor}
          update={(value) => update('floor', value)}
        />
      )}

      <fieldset className="flex flex-col gap-3">
        <legend className="text-right font-bold">
          <RequiredLabel>{t.finishingLabel}</RequiredLabel>
        </legend>
        <Pills
          error={errors.finishing}
          items={finishings}
          selected={selected.finishing ?? []}
          onToggle={(value) => toggle('finishing', value)}
        />
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-right font-bold">
          <RequiredLabel>{t.deliveryLabel}</RequiredLabel>
        </legend>
        <Pills
          error={errors.delivery}
          items={deliveries}
          selected={selected.delivery ?? []}
          onToggle={(value) => toggle('delivery', value)}
        />
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-right font-bold">{t.featuresLabel}</legend>
        <Pills
          items={features}
          selected={selected.features ?? []}
          onToggle={(value) => toggle('features', value)}
          multi
        />
      </fieldset>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description" className="text-right">
          <RequiredLabel>{t.descriptionLabel}</RequiredLabel>
        </Label>
        <Textarea
          id="description"
          dir="rtl"
          value={form.description ?? ''}
          onChange={(event) => update('description', event.target.value)}
          className={`min-h-32 rounded-xl text-right ${
            errors.description ? 'border-red-500 bg-red-50/20' : ''
          }`}
        />
        {errors.description && (
          <p className="mt-1.5 text-right text-xs font-semibold text-red-600">
            {errors.description}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          className="h-12 flex-1 rounded-xl bg-[var(--brand-navy,#0a1122)]"
          onClick={() => go(4)}
        >
          {s.shared.nextBtn}
        </Button>
      </div>
      <div className="mt-4 flex w-full justify-center">
        <button
          type="button"
          className="text-center text-sm font-bold text-blue-800 hover:underline"
          onClick={onSave}
        >
          {s.shared.saveLaterBtn}
        </button>
      </div>
    </div>
  )
}

function PricingStep({
  form,
  update,
  selected,
  toggle,
  go,
  errors,
  onSave,
}: {
  form: Record<string, string>
  update: (key: string, value: string) => void
  selected: Record<string, string[]>
  toggle: (group: string, value: string) => void
  go: (step: number) => void
  errors: Record<string, string>
  onSave: () => void
}) {
  const t = s.pricingStep
  const yes = (group: string) => selected[group]?.[0] === 'yes'
  const setAnswer = (group: string, value: string) => toggle(group, value)
  const currency = getCountryConfig(form.unitCountry).currencySymbol

  return (
    <div className="flex flex-col gap-6">
      <MoneyField
        error={errors.contractPrice}
        label={s.basicStep.contractPrice}
        value={form.contractPrice2 ?? form.contractPrice}
        currencySymbol={currency}
        update={(value) => update('contractPrice', value)}
      />
      <fieldset className="flex flex-col gap-3">
        <legend className="text-right font-bold">
          <RequiredLabel>{t.contractYearLabel}</RequiredLabel>
        </legend>
        <Pills
          error={errors.year}
          items={years}
          selected={selected.year ?? []}
          onToggle={(value) => toggle('year', value)}
        />
      </fieldset>
      <MoneyField
        error={errors.paidAmount}
        label={s.basicStep.paidAmount}
        value={form.paidAmount2 ?? form.paidAmount}
        currencySymbol={currency}
        update={(value) => update('paidAmount', value)}
      />
      <MoneyField
        error={errors.marketPrice}
        label={t.marketPriceLabel}
        value={form.marketPrice}
        currencySymbol={currency}
        update={(value) => update('marketPrice', value)}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <MoneyField
          error={errors.installment}
          label={t.installmentLabel}
          value={form.installment}
          currencySymbol={currency}
          update={(value) => update('installment', value)}
        />
        <fieldset className="flex flex-col gap-3">
          <legend className="text-right font-bold">
            <RequiredLabel>{t.frequencyLabel}</RequiredLabel>
          </legend>
          <Pills
            error={errors.frequency}
            items={t.frequencies}
            selected={selected.frequency ?? []}
            onToggle={(value) => toggle('frequency', value)}
          />
        </fieldset>
      </div>
      <Field
        label={t.remainingYearsLabel}
        id="remainingYears"
        type="number"
        helper={t.remainingYearsHelper}
        value={form.remainingYears}
        update={(value) => update('remainingYears', value)}
      />
      <ToggleSection
        error={errors.annualInstallment}
        title={t.annualInstallmentQuestion}
        group="annualInstallment"
        selected={selected}
        toggle={setAnswer}
      />
      {yes('annualInstallment') && (
        <MoneyField
          label={t.annualInstallmentAmountLabel}
          value={form.annualInstallmentAmount}
          currencySymbol={currency}
          update={(value) => update('annualInstallmentAmount', value)}
        />
      )}
      <ToggleSection
        error={errors.discountOffer}
        title={t.discountQuestion}
        group="discountOffer"
        selected={selected}
        toggle={setAnswer}
      />
      {yes('discountOffer') && (
        <MoneyField
          label={t.discountAmountLabel}
          value={form.discountAmount}
          currencySymbol={currency}
          update={(value) => update('discountAmount', value)}
        />
      )}
      <ToggleSection
        error={errors.overdueInstallments}
        title={t.overdueQuestion}
        group="overdueInstallments"
        selected={selected}
        toggle={setAnswer}
      />
      {yes('overdueInstallments') && (
        <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <Field
            label={t.overdueCountLabel}
            id="overdueCount"
            type="number"
            value={form.overdueCount}
            update={(value) => update('overdueCount', value)}
          />
          <MoneyField
            label={t.overdueTotalLabel}
            value={form.overdueTotal}
            currencySymbol={currency}
            update={(value) => update('overdueTotal', value)}
          />
        </div>
      )}
      <div className="mt-2 flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-xl"
          onClick={() => go(3)}
        >
          {s.shared.backBtn}
        </Button>
        <Button
          type="button"
          className="h-12 flex-1 rounded-xl bg-[var(--brand-navy,#0a1122)]"
          onClick={() => go(5)}
        >
          {s.shared.nextBtn}
        </Button>
      </div>
      <div className="mt-4 flex w-full justify-center">
        <button
          type="button"
          className="text-center text-sm font-bold text-blue-800 hover:underline"
          onClick={onSave}
        >
          {s.shared.saveLaterBtn}
        </button>
      </div>
    </div>
  )
}

function PhotosStep({
  go,
  images,
  setImages,
  uploading,
  setUploading,
  onSave,
}: {
  go: (step: number) => void
  images: string[]
  setImages: (images: string[]) => void
  uploading: boolean
  setUploading: (value: boolean) => void
  onSave: () => void
}) {
  const t = s.photosStep
  const upload = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    const supabase = createClient()
    const uploaded: string[] = []
    for (const file of Array.from(files).slice(0, 10 - images.length)) {
      const path = `units/${crypto.randomUUID()}-${file.name.replace(
        /[^a-zA-Z0-9.-]/g,
        '-'
      )}`
      const result = await supabase.storage
        .from('unit-images')
        .upload(path, file, { contentType: file.type, upsert: false })
      if (!result.error)
        uploaded.push(
          supabase.storage.from('unit-images').getPublicUrl(path).data.publicUrl
        )
    }
    setImages([...images, ...uploaded])
    setUploading(false)
  }

  return (
    <div className="flex flex-col gap-5">
      <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 text-center transition hover:bg-slate-50">
        <ImagePlus className="size-8 text-slate-500" />
        <p className="font-bold">{t.uploadTitle}</p>
        <p className="text-sm text-slate-500">{t.uploadSub}</p>
        <input
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(event) => upload(event.target.files)}
        />
      </label>
      {uploading && (
        <p className="text-right text-sm font-semibold text-teal-700">
          {t.uploadingText}
        </p>
      )}
      {images.length > 0 && (
        <div className="mt-4 grid w-full grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((url, index) => (
            <div
              key={url}
              className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm"
            >
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() =>
                  setImages(images.filter((_, idx) => idx !== index))
                }
                className="absolute top-2 left-2 flex size-6 items-center justify-center rounded-full bg-black/70 text-xs text-white hover:bg-red-600"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-xl"
          onClick={() => go(4)}
        >
          {s.shared.backBtn}
        </Button>
        <Button
          type="button"
          className="h-12 flex-1 rounded-xl bg-[var(--brand-navy,#0a1122)]"
          onClick={() => go(6)}
        >
          {s.shared.nextBtn}
        </Button>
      </div>
      <div className="mt-4 flex w-full justify-center">
        <button
          type="button"
          className="text-center text-sm font-bold text-blue-800 hover:underline"
          onClick={onSave}
        >
          {s.shared.saveLaterBtn}
        </button>
      </div>
    </div>
  )
}

function ReviewStep({
  form,
  selected,
  pending,
  submitted,
  error,
  submit,
  go,
  onSave,
  imagesLength,
  orderRef,
  unitId,
}: {
  form: Record<string, string>
  selected: Record<string, string[]>
  pending: boolean
  submitted: boolean
  error: string
  submit: () => void
  go: (step: number) => void
  onSave: () => void
  imagesLength: number
  orderRef: string
  unitId: string
}) {
  const t = s.reviewStep
  const [selectedPromo, setSelectedPromo] = useState<7 | 14 | 30 | null>(null)
  const [fawryCode, setFawryCode] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)
  const [promoPending, startPromoTransition] = useTransition()

  const countryObj = getCountryConfig(form.unitCountry)
  const currency = countryObj.currencySymbol
  const pkgPrices = countryObj.defaultPackages || {
    days7: 1199,
    days14: 1999,
    days30: 2799,
  }

  const dynamicPackages: Array<{
    days: 7 | 14 | 30
    price: number
    label: string
  }> = [
    { days: 7, price: pkgPrices.days7, label: `7 ${t.daysWord}` },
    { days: 14, price: pkgPrices.days14, label: `14 ${t.daysWord}` },
    { days: 30, price: pkgPrices.days30, label: `30 ${t.daysWord}` },
  ]

  const handleSelectPackage = (pkg: {
    days: 7 | 14 | 30
    price: number
    label: string
  }) => {
    setSelectedPromo(pkg.days)
    if (!unitId) {
      setFawryCode(`AD-${Math.floor(100000 + Math.random() * 900000)}`)
      return
    }
    startPromoTransition(async () => {
      const res = await requestUnitPromotionAction({
        unitId,
        days: pkg.days,
        price: pkg.price,
      })
      if (res.success && res.fawryCode) {
        setFawryCode(res.fawryCode)
      }
    })
  }

  if (submitted)
    return (
      <div className="flex flex-col items-center py-4 sm:py-6">
        <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500 text-2xl text-white shadow-xs">
          ✓
        </div>
        <h2 className="mt-4 text-center text-xl font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-2xl">
          {t.successTitle}
        </h2>
        <p className="mt-1.5 text-center text-xs text-slate-500 sm:text-sm">
          {t.successSubtitle}
        </p>

        <span className="mt-3.5 rounded-full bg-slate-100 px-4 py-1.5 text-xs font-bold text-slate-700">
          {t.orderRefLabel} <strong className="font-mono">{orderRef}</strong>
        </span>

        <div className="mt-6 w-full rounded-[20px] border border-[#aae3cb] bg-[#effaf5] p-5 text-right sm:p-6">
          <div className="flex items-center justify-start gap-1 text-xs font-extrabold text-[var(--brand-primary,#007a5a)]">
            <Star className="size-3.5 fill-amber-400 text-amber-500" />
            <span>{t.optionalBadge}</span>
          </div>

          <h3 className="mt-1 text-base font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-lg">
            {t.promoTitle}
          </h3>

          <ul className="mt-3 space-y-2 text-xs font-medium text-[#1e3a34]">
            <li className="flex items-center gap-2">
              <Check className="size-3.5 shrink-0 text-[var(--brand-primary,#007a5a)]" />
              <span>{t.promoPoint1}</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="size-3.5 shrink-0 text-[var(--brand-primary,#007a5a)]" />
              <span>
                {t.promoPoint2Prefix}{' '}
                <Star className="inline size-3 fill-amber-400 text-amber-500" />{' '}
                {t.promoPoint2Suffix}
              </span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="size-3.5 shrink-0 text-[var(--brand-primary,#007a5a)]" />
              <span>{t.promoPoint3}</span>
            </li>
          </ul>

          <div className="mt-4 grid grid-cols-3 gap-2.5 sm:gap-3">
            {dynamicPackages.map((pkg) => {
              const isSelected = selectedPromo === pkg.days
              return (
                <button
                  key={pkg.days}
                  type="button"
                  disabled={promoPending}
                  onClick={() => handleSelectPackage(pkg)}
                  className={`flex flex-col items-center justify-center rounded-2xl border bg-white p-3.5 text-center transition hover:shadow-md sm:p-4 ${
                    isSelected
                      ? 'border-[var(--brand-primary,#007a5a)] ring-2 ring-[var(--brand-primary,#007a5a)]/20'
                      : 'border-gray-200/90 hover:border-[var(--brand-primary,#007a5a)]/50'
                  }`}
                >
                  <span className="text-xs font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-sm">
                    {pkg.label}
                  </span>
                  <span className="mt-1 text-xs font-extrabold text-[var(--brand-primary,#007a5a)] tabular-nums sm:text-sm">
                    {pkg.price.toLocaleString('en-US')} {currency}
                  </span>
                </button>
              )
            })}
          </div>

          <p className="mt-4 text-[11px] leading-relaxed text-[#2b584d]">
            {t.promoFreeNote}
          </p>

          {promoPending ? (
            <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-white p-3.5 text-xs font-bold text-[var(--brand-primary,#007a5a)]">
              <Loader2 className="size-4 animate-spin" />
              <span>{t.issuingCode}</span>
            </div>
          ) : fawryCode ? (
            <div className="mt-3 rounded-xl border border-[var(--brand-primary,#007a5a)]/30 bg-white p-4 text-right shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-extrabold text-[var(--brand-navy,#0a1122)]">
                    {t.adOrderCodeLabel} ({selectedPromo} {t.daysWord}):
                  </p>
                  <p className="mt-1 font-mono text-lg font-black tracking-wider text-[var(--brand-primary,#007a5a)]">
                    {fawryCode}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(fawryCode)
                    setCopiedCode(true)
                    setTimeout(() => setCopiedCode(false), 2000)
                  }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-bold text-[var(--brand-navy,#0a1122)] hover:bg-gray-100"
                >
                  <Copy className="size-3.5" />
                  <span>{copiedCode ? t.copiedBtn : t.copyCodeBtn}</span>
                </button>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-gray-500">
                {t.adCodeInstruction}
              </p>
            </div>
          ) : (
            <div className="mt-3 rounded-xl bg-white p-3.5 text-[11px] leading-relaxed text-gray-600">
              {t.selectPackageHint}
            </div>
          )}
        </div>

        <Link
          href="/account"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-[var(--brand-primary,#007a5a)] px-7 text-xs font-extrabold text-white shadow-sm transition hover:bg-[var(--brand-primary-hover,#006248)] sm:text-sm"
        >
          {t.goToAccountBtn}
        </Link>

        <p className="mt-2.5 text-center text-[11px] text-gray-400">
          {t.editAnytimeNote}
        </p>
      </div>
    )

  const rows = [
    [t.rowCountry, `${countryObj.flag} ${countryObj.nameAr}`],
    [
      t.rowDevProject,
      `${form.developerDetails || form.developer || '—'} · ${
        form.projectDetails || form.project || '—'
      }`,
    ],
    [t.rowArea, form.location || '—'],
    [t.rowType, selected.type?.join('، ') || '—'],
    [t.rowSize, `${form.areaSize || '—'} ${t.sqmUnit}`],
    [t.rowRoomsBath, `${form.rooms || '—'} / ${form.bathrooms || '—'}`],
    [t.rowFinishing, selected.finishing?.join('، ') || '—'],
    [t.rowDelivery, selected.delivery?.join('، ') || '—'],
    [t.rowPhotos, String(imagesLength)],
    [
      t.rowContractPrice,
      `${Number(
        form.contractPrice2 || form.contractPrice || 0
      ).toLocaleString('en-US')} ${currency}`,
    ],
    [
      t.rowPaidAmount,
      `${Number(form.paidAmount2 || form.paidAmount || 0).toLocaleString(
        'en-US'
      )} ${currency}`,
    ],
  ]

  return (
    <div className="flex flex-col gap-5">
      <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 px-4">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-2 gap-4 py-3 text-sm">
            <span className="text-right text-slate-500">{label}</span>
            <strong className="text-left">{value}</strong>
          </div>
        ))}
      </div>
      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-center text-sm font-bold text-red-700">
          {error}
        </p>
      )}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-xl"
          onClick={() => go(5)}
        >
          {s.shared.backBtn}
        </Button>
        <Button
          type="button"
          disabled={pending || submitted}
          className="h-12 flex-1 rounded-xl bg-teal-700 font-bold"
          onClick={submit}
        >
          {pending ? t.submittingBtn : t.submitFinalBtn}
        </Button>
      </div>
      <div className="mt-4 flex w-full justify-center">
        <button
          type="button"
          className="text-center text-sm font-bold text-blue-800 hover:underline"
          onClick={onSave}
        >
          {s.shared.saveLaterBtn}
        </button>
      </div>
    </div>
  )
}
