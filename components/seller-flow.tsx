'use client'

import { useEffect, useState, useTransition } from 'react'
import { Check, ImagePlus, UserRound } from 'lucide-react'
import {
  getCurrentSellerProfileAction,
  saveSellProgress,
  submitSellRequest,
  verifyMagicTokenAction,
} from '@/app/actions/submit-forms'
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
import {
  Actions,
  areasCatalog,
  deliveries,
  features,
  Field,
  finishings,
  formatAmount,
  MoneyField,
  Pills,
  RequiredLabel,
  ToggleSection,
  unitTypes,
  years,
} from './seller/seller-shared'
import { ContactStep } from './seller/seller-contact-step'

export function SellerFlow() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isMagicResume, setIsMagicResume] = useState(false)
  const [unitId, setUnitId] = useState<string>('')
  const [orderRef, setOrderRef] = useState<string>('AE-X5QUKE')

  const [form, setForm] = useState<Record<string, string>>({ countryCode: '20' })
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
    async function initFlow() {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        const magicToken = params.get('magic')

        if (magicToken) {
          const res = await verifyMagicTokenAction(magicToken)
          if (res.valid && res.unit) {
            const u = res.unit
            setUnitId(String(u.id))
            setOrderRef(
              `AE-${String(u.id)
                .replace(/[^a-zA-Z0-9]/g, '')
                .slice(0, 6)
                .toUpperCase()}`
            )
            setForm((prev) => ({
              ...prev,
              developer: u.developer_name || '',
              developerDetails: u.developer_name || '',
              project: u.project_name || '',
              projectDetails: u.project_name || '',
              contractPrice: String(u.contract_price || ''),
              contractPrice2: String(u.contract_price || ''),
              paidAmount: String(u.paid_amount || ''),
              paidAmount2: String(u.paid_amount || ''),
              marketPrice: String(u.market_price || u.contract_price || ''),
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
      }

      const profileRes = await getCurrentSellerProfileAction()
      if (profileRes.isLoggedIn && profileRes.user) {
        setLoggedUser(profileRes.user)
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
      if (!form.developer) nextErrors.developer = 'هذا الحقل مطلوب'
      if (!form.project) nextErrors.project = 'هذا الحقل مطلوب'
      if (!form.contractPrice) nextErrors.contractPrice = 'هذا الحقل مطلوب'
      if (!form.paidAmount) nextErrors.paidAmount = 'هذا الحقل مطلوب'
      if (form.confirmed !== 'yes')
        nextErrors.confirmed = 'هذا الحقل مطلوب، يرجى وضع علامة صح للمتابعة'
      if (amount('paidAmount') > amount('contractPrice'))
        nextErrors.paidAmount =
          'المبلغ لا يمكن أن يتخطى إجمالي سعر الوحدة في العقد'
    }

    if (step === 3) {
      if (!form.developerDetails && !form.developer)
        nextErrors.developerDetails = 'هذا الحقل مطلوب'
      if (!form.projectDetails && !form.project)
        nextErrors.projectDetails = 'هذا الحقل مطلوب'
      if (!form.location) nextErrors.location = 'هذا الحقل مطلوب'
      if (!selected.type?.[0]) nextErrors.type = 'هذا الحقل مطلوب'
      if (!form.areaSize) nextErrors.areaSize = 'هذا الحقل مطلوب'
      if (!form.rooms) nextErrors.rooms = 'هذا الحقل مطلوب'
      if (!form.bathrooms) nextErrors.bathrooms = 'هذا الحقل مطلوب'
      if (selected.type?.[0] === 'شقة' && !form.floor)
        nextErrors.floor = 'هذا الحقل مطلوب'
      if (!selected.finishing?.[0]) nextErrors.finishing = 'هذا الحقل مطلوب'
      if (!selected.delivery?.[0]) nextErrors.delivery = 'هذا الحقل مطلوب'
      if (!form.description) nextErrors.description = 'هذا الحقل مطلوب'
    }

    if (step === 4) {
      if (!form.contractPrice) nextErrors.contractPrice = 'هذا الحقل مطلوب'
      if (!selected.year?.[0]) nextErrors.year = 'هذا الحقل مطلوب'
      if (!form.paidAmount) nextErrors.paidAmount = 'هذا الحقل مطلوب'
      if (!form.marketPrice) nextErrors.marketPrice = 'هذا الحقل مطلوب'
      if (!form.installment) nextErrors.installment = 'هذا الحقل مطلوب'
      if (!selected.frequency?.[0])
        nextErrors.frequency = 'هذا الحقل مطلوب، يرجى اختيار دورية القسط'
      if (!selected.annualInstallment?.[0])
        nextErrors.annualInstallment = 'يرجى اختيار أيوه أو لأ'
      if (!selected.discountOffer?.[0])
        nextErrors.discountOffer = 'يرجى اختيار أيوه أو لأ'
      if (!selected.overdueInstallments?.[0])
        nextErrors.overdueInstallments = 'يرجى اختيار أيوه أو لأ'
      if (amount('paidAmount') > amount('contractPrice'))
        nextErrors.paidAmount =
          'المبلغ لا يمكن أن يتخطى إجمالي سعر الوحدة في العقد'
      if (amount('installment') > amount('contractPrice'))
        nextErrors.installment =
          'المبلغ لا يمكن أن يتخطى إجمالي سعر الوحدة في العقد'
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
      setError(result.error ?? 'تعذر حفظ التقدم.')
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
    setValue('name', form.name || loggedUser?.name || 'مقدم طلب بيع')
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
        if (result.orderRef) setOrderRef(result.orderRef)
        setSubmitted(true)
      } else {
        setError(result.error ?? 'تعذر إرسال الطلب')
      }
    })
  }

  const totalStepsCount = isMagicResume ? 4 : 6
  const currentDisplayStep = isMagicResume ? Math.max(1, step - 2) : step

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f5f7f8] px-3 py-8 text-[#111827] sm:px-5 md:py-12"
    >
      <div className="mx-auto max-w-3xl">
        <header className="mb-7 text-center">
          <h1 className="text-3xl font-black tracking-tight text-[#123c35] sm:text-4xl">
            {isMagicResume
              ? 'كمّل بيانات وحدتك'
              : 'عايز تخرج من تعاقدك؟ خليها بحساب'}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            {isMagicResume
              ? 'مش محتاج كلمة سر — كمّل الناقص وإحنا ننشر وحدتك للمشترين. بيتحفظ تلقائياً وتقدر ترجع من نفس اللينك.'
              : 'قبل أي خطوة، لازم تعرف موقفك بالظبط: خصم الإلغاء، جدول الاسترداد، وقيمة اللي ممكن ترجعه. ده بالظبط اللي بيعمله تقرير الخروج — مجانًا، ومفيش أي عمولة عليك كـ بائع من خلالنا.'}
          </p>
        </header>

        {step <= 2 && !isMagicResume && (
          <>
            <div className="mb-4 grid gap-3">
              {[
                'مراجعة حقيقية لعقدك ومستنداتك — مش حسبة تقريبية',
                'مقارنة موثقة: الإلغاء مقابل نقل التعاقد',
                'توصية واضحة بأفضل طريق — حقك لو كان الاستثمار',
                'مجانًا تمامًا: مفيش عمولة على البائع — المشتري هو اللي بيدفع 1.25%',
              ].map((item, index) => (
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
              مُلّاك بس: بنتعامل مع صاحب الوحدة مباشرة — مش بنقبل طلبات من سماسرة.
            </div>
          </>
        )}

        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
          <CardContent className="p-4 sm:p-6 md:p-7">
            <div className="mb-6 rounded-2xl border border-slate-600 px-4 py-4 text-center text-sm leading-7">
              <div className="mb-1 flex items-center justify-center gap-2 font-bold">
                <UserRound className="size-4" /> بنتعامل مع مالك الوحدة نفسه بس
              </div>
              الطلبات اللي بتيجي من سماسرة أو وسطاء بنستبعدها، وأي وحدة يتبيّن
              إنها من وسيط بترفض أو بتتحذف نهائيًا. سبب المنصة الأساسي إن المشتري
              ياخد سعر التعاقد القديم من غير أوفر — ووجود وسيط بيضيف هامش وبيلغي
              الفكرة كلها.
            </div>

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
                  خطوة {currentDisplayStep} من {totalStepsCount}
                </Badge>
              </div>
            )}

            {!submitted && (
              <h2 className="mb-6 text-2xl font-black text-[#102238]">
                {
                  [
                    'بيانات الوحدة',
                    'بيانات التواصل',
                    'تفاصيل الوحدة',
                    'السعر والأقساط',
                    'صور الوحدة',
                    'مراجعة وإرسال',
                  ][step - 1]
                }
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
              />
            )}
          </CardContent>
        </Card>

        {step <= 2 && (
          <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl bg-[#0f172a] px-5 py-4 text-sm text-white">
            <span>ابعتلنا على واتساب وهنرد عليك في أسرع وقت</span>
            <a
              href="https://wa.me/201018595959"
              className="rounded-full bg-green-500 px-4 py-2 font-bold text-white"
            >
              اطلب تقرير الخروج المجاني
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
  return (
    <div className="flex flex-col gap-6">
      <Field
        error={errors.developer}
        label="اسم المطور *"
        id="developer"
        value={form.developer}
        update={(value) => update('developer', value)}
      />
      <Field
        error={errors.project}
        label="اسم المشروع / الكمبوند *"
        id="project"
        value={form.project}
        update={(value) => update('project', value)}
      />
      <MoneyField
        error={errors.contractPrice}
        label="إجمالي سعر الوحدة في العقد *"
        value={form.contractPrice}
        update={(value) => update('contractPrice', value)}
      />
      <MoneyField
        error={errors.paidAmount}
        label="إجمالي اللي دفعته لحد النهارده *"
        value={form.paidAmount}
        update={(value) => update('paidAmount', value)}
      />
      <div className="rounded-xl bg-sky-50 p-4 text-sm font-semibold text-sky-700">
        المبلغ اللي هتستلمه:{' '}
        {Number(form.paidAmount || 0).toLocaleString('en-US')} ج.م — اللي دفعته
        بالظبط، بدون أي أوفر أو زيادة.
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
          أؤكد إني فاهم إن المبلغ اللي هتستلمه هو اللي دفعته بالظبط — بدون أي
          أوفر أو زيادة.
        </label>
        {errors.confirmed && (
          <p className="mt-1.5 text-right text-xs font-semibold text-red-600">
            {errors.confirmed}
          </p>
        )}
      </div>
      <Field
        label="سعر نفس الوحدة من المطور النهارده (لو تعرفه)"
        id="currentDeveloperPrice"
        type="number"
        helper={
          form.currentDeveloperPrice
            ? formatAmount(form.currentDeveloperPrice)
            : 'بنستخدمه نحسب للمشتري هيوفر كام — لو مش متأكد سيبه فاضي وإحنا هنتحقق'
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
  const [areaOpen, setAreaOpen] = useState(false)
  const query = form.location ?? ''
  const groups = areasCatalog
    .map(
      ([title, items]) =>
        [title, items.filter((item) => item.includes(query))] as const
    )
    .filter(([, items]) => items.length)

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          error={errors.developerDetails}
          label="اسم المطور *"
          id="developerDetails"
          value={form.developerDetails ?? form.developer}
          update={(value) => update('developerDetails', value)}
        />
        <Field
          error={errors.projectDetails}
          label="اسم المشروع / الكمبوند *"
          id="projectDetails"
          value={form.projectDetails ?? form.project}
          update={(value) => update('projectDetails', value)}
        />
      </div>
      <div className="relative">
        <Label htmlFor="location" className="mb-2 block text-right">
          المنطقة / الموقع *
        </Label>
        <Input
          id="location"
          dir="rtl"
          placeholder="دوّر على المنطقة..."
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
        {areaOpen && (
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
          <RequiredLabel>نوع الوحدة *</RequiredLabel>
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
          label="المساحة (م٢) *"
          id="areaSize"
          type="number"
          value={form.areaSize}
          update={(value) => update('areaSize', value)}
        />
        <Field
          label="الجاردن (م٢)"
          id="garden"
          type="number"
          value={form.garden}
          update={(value) => update('garden', value)}
        />
        <Field
          error={errors.rooms}
          label="غرف *"
          id="rooms"
          type="number"
          value={form.rooms}
          update={(value) => update('rooms', value)}
        />
        <Field
          error={errors.bathrooms}
          label="حمامات *"
          id="bathrooms"
          type="number"
          value={form.bathrooms}
          update={(value) => update('bathrooms', value)}
        />
      </div>
      {selected.type?.[0] === 'شقة' && (
        <Field
          error={errors.floor}
          label="الدور *"
          id="floor"
          type="number"
          helper="الأرضي = 0"
          value={form.floor}
          update={(value) => update('floor', value)}
        />
      )}
      <fieldset className="flex flex-col gap-3">
        <legend className="text-right font-bold">
          <RequiredLabel>التشطيب *</RequiredLabel>
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
          <RequiredLabel>حالة الاستلام *</RequiredLabel>
        </legend>
        <Pills
          error={errors.delivery}
          items={deliveries}
          selected={selected.delivery ?? []}
          onToggle={(value) => toggle('delivery', value)}
        />
      </fieldset>
      <fieldset className="flex flex-col gap-3">
        <legend className="text-right font-bold">المميزات</legend>
        <Pills
          items={features}
          selected={selected.features ?? []}
          onToggle={(value) => toggle('features', value)}
          multi
        />
      </fieldset>
      <div className="flex flex-col gap-2">
        <Label htmlFor="description" className="text-right">
          <RequiredLabel>وصف مختصر للوحدة *</RequiredLabel>
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
          className="h-12 flex-1 rounded-xl bg-[#11192d]"
          onClick={() => go(4)}
        >
          كمّل
        </Button>
      </div>
      <div className="mt-4 flex w-full justify-center">
        <button
          type="button"
          className="text-center text-sm font-bold text-blue-800 hover:underline"
          onClick={onSave}
        >
          احفظ وكمل بعدين
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
  const yes = (group: string) => selected[group]?.[0] === 'yes'
  const setAnswer = (group: string, value: string) => toggle(group, value)

  return (
    <div className="flex flex-col gap-6">
      <MoneyField
        error={errors.contractPrice}
        label="إجمالي سعر الوحدة في العقد *"
        value={form.contractPrice2 ?? form.contractPrice}
        update={(value) => update('contractPrice', value)}
      />
      <fieldset className="flex flex-col gap-3">
        <legend className="text-right font-bold">
          <RequiredLabel>سنة التعاقد *</RequiredLabel>
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
        label="إجمالي اللي دفعته لحد النهارده *"
        value={form.paidAmount2 ?? form.paidAmount}
        update={(value) => update('paidAmount', value)}
      />
      <MoneyField
        error={errors.marketPrice}
        label="سعر الوحدة دلوقتي في السوق (تقديري) *"
        value={form.marketPrice}
        update={(value) => update('marketPrice', value)}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <MoneyField
          error={errors.installment}
          label="قيمة القسط *"
          value={form.installment}
          update={(value) => update('installment', value)}
        />
        <fieldset className="flex flex-col gap-3">
          <legend className="text-right font-bold">
            <RequiredLabel>دورية القسط *</RequiredLabel>
          </legend>
          <Pills
            error={errors.frequency}
            items={['شهري', 'ربع سنوي', 'نصف سنوي', 'سنوي']}
            selected={selected.frequency ?? []}
            onToggle={(value) => toggle('frequency', value)}
          />
        </fieldset>
      </div>
      <Field
        label="فاضل كام سنة تقسيط؟ (اختياري)"
        id="remainingYears"
        type="number"
        helper="لو التقسيط خلص، اكتب صفر"
        value={form.remainingYears}
        update={(value) => update('remainingYears', value)}
      />
      <ToggleSection
        error={errors.annualInstallment}
        title="في قسط سنوي؟ *"
        group="annualInstallment"
        selected={selected}
        toggle={setAnswer}
      />
      {yes('annualInstallment') && (
        <MoneyField
          label="قيمة القسط السنوي *"
          value={form.annualInstallmentAmount}
          update={(value) => update('annualInstallmentAmount', value)}
        />
      )}
      <ToggleSection
        error={errors.discountOffer}
        title="مستعد تنزل عن جزء من اللي دفعته عشان تبيع أسرع؟ *"
        group="discountOffer"
        selected={selected}
        toggle={setAnswer}
      />
      {yes('discountOffer') && (
        <MoneyField
          label="أكتر مبلغ مستعد تتنازل عنه *"
          value={form.discountAmount}
          update={(value) => update('discountAmount', value)}
        />
      )}
      <ToggleSection
        error={errors.overdueInstallments}
        title="عليك أقساط متأخرة للمطور؟ *"
        group="overdueInstallments"
        selected={selected}
        toggle={setAnswer}
      />
      {yes('overdueInstallments') && (
        <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <Field
            label="كام قسط متأخر؟ *"
            id="overdueCount"
            type="number"
            value={form.overdueCount}
            update={(value) => update('overdueCount', value)}
          />
          <MoneyField
            label="إجمالي المبلغ المتأخر *"
            value={form.overdueTotal}
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
          ارجع
        </Button>
        <Button
          type="button"
          className="h-12 flex-1 rounded-xl bg-[#11192d]"
          onClick={() => go(5)}
        >
          كمّل
        </Button>
      </div>
      <div className="mt-4 flex w-full justify-center">
        <button
          type="button"
          className="text-center text-sm font-bold text-blue-800 hover:underline"
          onClick={onSave}
        >
          احفظ وكمل بعدين
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
        <p className="font-bold">أضف صور الوحدة</p>
        <p className="text-sm text-slate-500">
          صورة واحدة على الأقل تكفي للنشر — وحتى 10 صور
        </p>
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
          جاري رفع الصور...
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
          ارجع
        </Button>
        <Button
          type="button"
          className="h-12 flex-1 rounded-xl bg-[#11192d]"
          onClick={() => go(6)}
        >
          كمّل
        </Button>
      </div>
      <div className="mt-4 flex w-full justify-center">
        <button
          type="button"
          className="text-center text-sm font-bold text-blue-800 hover:underline"
          onClick={onSave}
        >
          احفظ وكمل بعدين
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
}) {
  if (submitted)
    return (
      <div className="flex flex-col items-center py-8">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-emerald-100 text-3xl">
          ✅
        </div>
        <h2 className="mt-4 text-center text-2xl font-extrabold text-slate-900">
          تم! وصلتنا بيانات وحدتك
        </h2>
        <span className="mt-3 rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600">
          رقم طلبك: {orderRef}
        </span>
        <Link
          href="/account"
          className="mt-6 inline-flex h-12 w-full max-w-[200px] items-center justify-center rounded-xl bg-[#0c513f] px-8 py-3 text-sm font-bold text-white shadow-sm hover:bg-teal-900"
        >
          روح لحسابك
        </Link>
      </div>
    )

  const rows = [
    [
      'المطور / المشروع',
      `${form.developerDetails || form.developer || '—'} · ${
        form.projectDetails || form.project || '—'
      }`,
    ],
    ['المنطقة', form.location || '—'],
    ['النوع', selected.type?.join('، ') || '—'],
    ['المساحة', `${form.areaSize || '—'} م٢`],
    ['غرف/حمامات', `${form.rooms || '—'} / ${form.bathrooms || '—'}`],
    ['التشطيب', selected.finishing?.join('، ') || '—'],
    ['حالة الاستلام', selected.delivery?.join('، ') || '—'],
    ['الصور', String(imagesLength)],
    [
      'إجمالي سعر الوحدة في العقد',
      `${Number(
        form.contractPrice2 || form.contractPrice || 0
      ).toLocaleString('en-US')} ج.م`,
    ],
    [
      'إجمالي اللي دفعته لحد النهارده',
      `${Number(form.paidAmount2 || form.paidAmount || 0).toLocaleString(
        'en-US'
      )} ج.م`,
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
          ارجع
        </Button>
        <Button
          type="button"
          disabled={pending || submitted}
          className="h-12 flex-1 rounded-xl bg-teal-700 font-bold"
          onClick={submit}
        >
          {pending ? 'جاري الإرسال...' : 'إرسال للمراجعة'}
        </Button>
      </div>
      <div className="mt-4 flex w-full justify-center">
        <button
          type="button"
          className="text-center text-sm font-bold text-blue-800 hover:underline"
          onClick={onSave}
        >
          احفظ وكمل بعدين
        </button>
      </div>
    </div>
  )
}