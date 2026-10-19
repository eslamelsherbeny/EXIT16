'use client'

import { useEffect, useState, useTransition } from 'react'
import {
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  ImagePlus,
  Loader2,
  LogIn,
  UserPlus,
  UserRound,
} from 'lucide-react'
import {
  getCurrentSellerProfileAction,
  processSellerStep2Action,
  saveSellProgress,
  sendSellerRecoveryLinkAction,
  submitSellRequest,
  verifyExistingEmailPasswordAction,
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
import { CountrySelector } from '@/components/country-selector'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const unitTypes = [
  'شقة',
  'دوبلكس',
  'بنتهاوس',
  'تاون هاوس',
  'توين هاوس',
  'اي فيلا',
  'فيلا',
  'شاليه',
  'مكتب',
  'محل',
  'عيادة',
  'أرض',
]
const finishings = ['تشطيب كامل', 'نص تشطيب', 'على الطوب', 'متشطبة بالفرش']
const deliveries = ['جاهزة للاستلام', 'تحت الإنشاء']
const features = [
  'حمام سباحة',
  'جاردن خاصة',
  'رووف',
  'أمن 24 ساعة',
  'كلوب هاوس',
  'جراج',
  'مصعد',
  'قريبة من الخدمات',
]
const years = ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019']

function formatAmount(value?: string) {
  const amount = Number((value ?? '').replace(/,/g, ''))
  if (!amount) return ''
  if (amount >= 1_000_000)
    return `${(amount / 1_000_000).toFixed(2).replace(/\.00$/, '')} مليون ج.م`
  if (amount >= 1_000) return `${Math.round(amount / 1_000)} ألف ج.م`
  return `${amount.toLocaleString('en-US')} ج.م`
}

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

  // بيانات المستخدم المسجل حالياً (لإعطائه خيار الإكمال بحسابه بضغطة زر)
  const [loggedUser, setLoggedUser] = useState<{
    id: string
    name: string
    email: string
    phone: string
  } | null>(null)

  // فحص الرابط السحري (?magic=...) أو الجلسة الحالية عند فتح الصفحة
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
            setStep(3) // يقفز مباشرة للخطوة 3 (تفاصيل الوحدة - خطوة 1 من 4) كما في الصورة 5
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

  // حساب رقم الخطوة في شريط التقدم (لو داخل من لينك الإيميل يظهر "خطوة 1 من 4" كما في الصورة 5)
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
              الطلبات اللي بتيجي من سماسرة أو وسطاء بنستبعدها، وأي وحدة يتبيّن إنها من وسيط بترفض أو بتتحذف نهائيًا. سبب المنصة الأساسي إن المشتري ياخد سعر التعاقد القديم من غير أوفر — ووجود وسيط بيضيف هامش وبيلغي الفكرة كلها.
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

function RequiredLabel({ children }: { children: string }) {
  const required = children.endsWith(' *')
  return (
    <>
      {required ? (
        <>
          {children.slice(0, -2)} <span className="mr-1 text-red-500">*</span>
        </>
      ) : (
        children
      )}
    </>
  )
}

function Field({
  label,
  id,
  type = 'text',
  helper,
  placeholder,
  value,
  update,
  error,
}: {
  label: string
  id: string
  type?: string
  helper?: string
  placeholder?: string
  value?: string
  update: (value: string) => void
  error?: string
}) {
  const arabic = [
    'developer',
    'project',
    'developerDetails',
    'projectDetails',
    'name',
    'location',
  ].includes(id)
  const compact = [
    'areaSize',
    'garden',
    'rooms',
    'bathrooms',
    'floor',
    'remainingYears',
  ].includes(id)
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className={arabic ? 'text-right' : undefined}>
        <RequiredLabel>{label}</RequiredLabel>
      </Label>
      <Input
        id={id}
        name={id}
        type={type}
        dir={
          compact || type === 'number' || id === 'email' || id === 'password'
            ? 'ltr'
            : arabic
              ? 'rtl'
              : undefined
        }
        placeholder={placeholder}
        value={value ?? ''}
        onChange={(event) => update(event.target.value)}
        className={`h-12 rounded-xl ${
          error ? 'border-red-500 bg-red-50/20' : 'border-slate-200'
        } ${
          compact
            ? 'max-w-[150px] self-start text-center font-semibold'
            : type === 'number' || id === 'email' || id === 'password'
              ? 'text-left'
              : arabic
                ? 'text-right'
                : ''
        }`}
      />
      {error && (
        <p className="mt-1.5 text-right text-xs font-semibold text-red-600">
          {error}
        </p>
      )}
      {helper && (
        <span className="text-xs font-semibold leading-6 text-teal-700">
          {helper}
        </span>
      )}
    </div>
  )
}

function Pills({
  items,
  selected,
  onToggle,
  multi = false,
  error,
}: {
  items: string[]
  selected: string[]
  onToggle: (value: string) => void
  multi?: boolean
  error?: string
}) {
  return (
    <div
      className={
        error ? 'rounded-xl border border-red-500 bg-red-50/20 p-2.5' : ''
      }
    >
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <button
            type="button"
            key={item}
            onClick={() => onToggle(item)}
            className={`rounded-xl border px-4 py-2 text-sm transition ${
              selected.includes(item)
                ? 'border-[#0c513f] bg-[#f0fdf9] font-bold text-[#0c513f]'
                : 'border-slate-200 bg-white hover:border-teal-500'
            }`}
          >
            {multi && selected.includes(item) && '✓ '}
            {item}
          </button>
        ))}
      </div>
      {error && (
        <p className="mt-1.5 text-right text-xs font-semibold text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}

function Actions({
  go,
  next,
  back = true,
  label = 'كمّل',
}: {
  go: (step: number) => void
  next: number
  back?: boolean
  label?: string
}) {
  return (
    <div dir="rtl" className="mt-5 flex gap-3">
      {back && (
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-xl"
          onClick={() => go(next - 2)}
        >
          ارجع
        </Button>
      )}
      <Button
        type="button"
        className={`h-12 rounded-xl bg-[#11192d] hover:bg-[#1b2742] ${
          !back ? 'w-full' : 'flex-1'
        }`}
        onClick={() => go(next)}
      >
        {label}
      </Button>
    </div>
  )
}

function MoneyField({
  label,
  value,
  update,
  helper,
  error,
}: {
  label: string
  value?: string
  update: (value: string) => void
  helper?: string
  error?: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-right">
        <RequiredLabel>{label}</RequiredLabel>
      </Label>
      <div className="relative">
        <Input
          type="text"
          inputMode="numeric"
          dir="ltr"
          value={
            value ? Number(value.replace(/,/g, '')).toLocaleString('en-US') : ''
          }
          onChange={(event) =>
            update(event.target.value.replace(/[^0-9]/g, ''))
          }
          className={`h-12 rounded-xl pl-12 pr-4 text-left ${
            error ? 'border-red-500 bg-red-50/20' : 'border-slate-200'
          }`}
        />
        <span className="absolute right-3 top-3 text-sm text-slate-500">
          ج.م
        </span>
      </div>
      {error && (
        <p className="mt-1.5 text-right text-xs font-semibold text-red-600">
          {error}
        </p>
      )}
      <span className="text-right text-xs font-semibold leading-6 text-teal-700">
        {formatAmount(value) || helper || ''}
      </span>
    </div>
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

// =========================================================================
// الخطوة الثانية المطورة: تدعم (الحساب الحالي / تسجيل دخول / حساب جديد / حالات التكرار)
// =========================================================================
function ContactStep({
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
  // وضع الإدخال: 'session' (لو مسجل دخول) | 'register' (بيانات جديدة) | 'login' (عندي حساب بالفعل)
  const [authTab, setAuthTab] = useState<'session' | 'register' | 'login'>(
    loggedUser ? 'session' : 'register'
  )

  useEffect(() => {
    if (loggedUser) setAuthTab('session')
  }, [loggedUser])

  // حالات الشاشات الخاصة بالتكرار (الصورة 1 والصورة 3 و 4)
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

  // تنفيذ الانتقال السلس للخطوة 3 بعد نجاح التوثيق
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

  // معالجة الضغط على "إرسال للمراجعة / كمّل"
  const handleStep2Submit = async () => {
    setStepError('')
    const nextErrors: Record<string, string> = {}

    if (form.owner !== 'yes') {
      nextErrors.owner = 'هذا الحقل مطلوب، يرجى وضع علامة صح للمتابعة'
    }

    if (authTab === 'register') {
      if (!form.name?.trim()) nextErrors.name = 'هذا الحقل مطلوب'
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
        developer: form.developer || '',
        project: form.project || '',
        contractPrice: Number((form.contractPrice || '').replace(/,/g, '')) || 0,
        paidAmount: Number((form.paidAmount || '').replace(/,/g, '')) || 0,
        marketPrice:
          Number((form.currentDeveloperPrice || '').replace(/,/g, '')) || 0,
        name: form.name,
        phone: fullPhone,
        email: form.email,
        password:
          authTab === 'login' ? form.loginPassword : form.password,
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

  // تسجيل الدخول من شاشة "الإيميل ده عنده حساب بالفعل" (الصورة 1)
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

  // إرسال رابط استعادة كلمة السر على الإيميل المسجل (الصورة 3 و 4)
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

  // =========================================================================
  // الشاشة 1: "الإيميل ده عنده حساب بالفعل" (مطابقة 100% للصورة الأولى)
  // =========================================================================
  if (conflictState?.type === 'email_exists') {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-right sm:p-7">
        <h3 className="text-xl font-extrabold text-[#0a1122]">
          الإيميل ده عنده حساب بالفعل
        </h3>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          طلبك اتسجّل وفريقنا هيشوفه. عشان تدخل على حسابك دلوقتي، اكتب كلمة السر
          بتاعت <span className="font-semibold text-[#0a1122]">{conflictState.email}</span>.
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
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#1e3a8a] hover:underline"
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
            بعتنا رابط تعيين كلمة سر جديدة على إيميلك. لو مالقتهوش خلال دقيقة، بص في السبام.
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

  // =========================================================================
  // الشاشة 2: "الرقم ده عندنا عليه حساب بالفعل" (مطابقة 100% للصورة 3 و 4)
  // =========================================================================
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

  // =========================================================================
  // الشاشة الأساسية للخطوة 2 (تمنح العميل حرية الاختيار: حسابه الحالي / حساب جديد / تسجيل دخول)
  // =========================================================================
  return (
    <div className="flex flex-col gap-6">
      {/* شريط اختيار طريقة المتابعة (الحرية الكاملة للعميل) */}
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

      {/* الخيار 1: المتابعة بالحساب المسجل حالياً بدون كتابة أي بيانات */}
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

      {/* الخيار 2: تسجيل بيانات جديدة */}
      {authTab === 'register' && (
        <>
          <Field
            error={errors.name}
            label="اسمك *"
            id="name"
            value={form.name}
            update={(value) => update('name', value)}
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#0c513f]"
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

      {/* الخيار 3: عندي حساب بالفعل (يسحب البيانات تلقائياً ويدخله للخطوة 3) */}
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#0c513f]"
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
  const areas = [
    [
      'القاهرة الجديدة والتجمع',
      [
        'التجمع الخامس',
        'التجمع الأول',
        'التجمع الثالث',
        'القاهرة الجديدة',
        'الرحاب',
        'مدينتي',
        'المستقبل سيتي',
        'الشروق',
      ],
    ],
    [
      'الشيخ زايد وأكتوبر',
      ['الشيخ زايد', 'زايد الجديدة', '6 أكتوبر', 'حدائق أكتوبر'],
    ],
    [
      'العاصمة والساحل وأخرى',
      [
        'العاصمة الإدارية',
        'الساحل الشمالي',
        'العين السخنة',
        'رأس الحكمة',
        'منطقتي مش في القائمة',
      ],
    ],
  ] as const
  const query = form.location ?? ''
  const groups = areas
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
        <span className="mt-1 block text-right text-xs font-semibold leading-6 text-teal-700">
          اكتب بالاسم — لو منطقتك مش في القائمة اختار منطقة مش في القائمة
        </span>
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
      <div className="rounded-2xl bg-sky-50 p-4 text-right text-sm font-bold leading-7 text-sky-700">
        المبلغ اللي هتستلمه:{' '}
        {Number(form.paidAmount2 || form.paidAmount || 0).toLocaleString(
          'en-US'
        )}{' '}
        ج.م — اللي دفعته بالظبط، بدون أي أوفر أو زيادة.
        <div className="font-normal">
          المتبقي على المطور يتكلفه المشتري بالأقساط زي ما هي.
        </div>
      </div>
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
      {yes('discountOffer') && (
        <p className="rounded-xl bg-sky-50 p-3 text-right text-sm font-semibold text-sky-700">
          الرقم ده هيتعرض للمشتري كخصم — والرقم هيوصل لفريقنا عشان يتفاوض معاك.
        </p>
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
          <p className="rounded-xl bg-amber-50 p-3 text-right text-sm font-semibold leading-7 text-amber-700">
            الرقم ده بيظهر للمشتري في صفحة الوحدة، والمبلغ من الأول يتخصم من سعر
            الصفقة.
          </p>
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

function ToggleSection({
  title,
  group,
  selected,
  toggle,
  error,
}: {
  title: string
  group: string
  selected: Record<string, string[]>
  toggle: (group: string, value: string) => void
  error?: string
}) {
  const active = selected[group]?.[0]
  return (
    <section
      className={`rounded-2xl border p-5 ${
        error
          ? 'border-red-500 bg-red-50/20'
          : 'border-slate-200 bg-slate-50'
      }`}
    >
      <h3 className="mb-3 text-right font-bold">{title}</h3>
      <div className="flex justify-start gap-2">
        <Button
          type="button"
          variant={active === 'yes' ? 'default' : 'outline'}
          className={`min-w-[80px] rounded-xl border px-5 py-2 text-sm font-semibold ${
            active === 'yes' ? 'bg-[#11192d] text-white' : ''
          }`}
          onClick={() => toggle(group, 'yes')}
        >
          أيوه
        </Button>
        <Button
          type="button"
          variant={active === 'no' ? 'default' : 'outline'}
          className={`min-w-[80px] rounded-xl border px-5 py-2 text-sm font-semibold ${
            active === 'no' ? 'bg-[#11192d] text-white' : ''
          }`}
          onClick={() => toggle(group, 'no')}
        >
          لأ
        </Button>
      </div>
      {error && (
        <p className="mt-2.5 text-right text-xs font-semibold text-red-600">
          {error}
        </p>
      )}
    </section>
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
                aria-label="حذف الصورة"
                onClick={() =>
                  setImages(
                    images.filter((_, imageIndex) => imageIndex !== index)
                  )
                }
                className="absolute left-2 top-2 flex size-6 items-center justify-center rounded-full bg-black/70 text-xs text-white hover:bg-red-600"
              >
                ✕
              </button>
              {index === 0 && (
                <span className="absolute right-2 bottom-2 rounded-md bg-[#0c513f]/90 px-2 py-0.5 text-[10px] font-bold text-white">
                  صورة الغلاف
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      <p className="mt-4 text-right text-xs text-slate-500">
        أول صورة هي صورة الغلاف. الصور بتظهر للمشترين — متحطش صور فيها بياناتك
        الشخصية أو رقم الوحدة أو المستندات.
      </p>
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

        {imagesLength === 0 ? (
          <>
            <p className="mt-2 text-center text-sm text-slate-600">
              فاضل الصور بس — ضيفها في أي وقت من حسابك وهننشر وحدتك فورًا.
            </p>
            <Link
              href="/account"
              className="mt-6 flex h-12 items-center justify-center rounded-xl bg-[#0c513f] px-8 font-bold text-white hover:bg-teal-900"
            >
              أضف الصور دلوقتي
            </Link>
          </>
        ) : (
          <p className="mt-2 text-center text-sm text-slate-600">
            استلمنا بيانات وصور وحدتك بالكامل — فريقنا بيراجعها وهننشر وحدتك
            فورًا.
          </p>
        )}

        <span className="mt-3 rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600">
          رقم طلبك: {orderRef}
        </span>
        <div className="mt-6 w-full rounded-2xl border border-[#0c513f]/30 bg-[#f0fdf9] p-6 text-right">
          <Badge>⭐ اختياري</Badge>
          <h3 className="mt-3 font-extrabold">
            عايز وحدتك تبقى أول اللي المشتري يشوفه؟
          </h3>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <p>✓ ظهور في «فرص مميزة» في أول السوق</p>
            <p>✓ شارة ⭐ مميزة على كارت وحدتك</p>
            <p>✓ تقرير أسبوعي بأرقام حقيقية.</p>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {[
              ['7 أيام', '1,199 ج.م'],
              ['14 أيام', '1,999 ج.م'],
              ['30 أيام', '2,799 ج.م'],
            ].map(([days, price]) => (
              <button
                key={days}
                type="button"
                className="rounded-xl border border-slate-200 bg-white p-3 text-center text-sm"
              >
                <strong className="block">{days}</strong>
                <span>{price}</span>
              </button>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate-500">
            النشر الأساسي مجاني، والدفع يتم بكود فوري بعد اختيار الباقة.
          </p>
        </div>
        <Link
          href="/account"
          className="mt-6 inline-flex h-12 w-full max-w-[200px] items-center justify-center rounded-xl border border-slate-300 bg-white px-8 py-3 text-sm font-bold text-slate-900 shadow-sm hover:bg-slate-50"
        >
          روح لحسابك
        </Link>
        <p className="mt-3 text-center text-xs text-slate-400">
          تقدر ترجع تعدّل بيانات وحدتك في أي وقت من حسابك.
        </p>
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
    ['المميزات', selected.features?.join('، ') || '—'],
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
    [
      'سعر السوق دلوقتي',
      `${Number(form.marketPrice || 0).toLocaleString('en-US')} ج.م`,
    ],
    ['القسط', `${Number(form.installment || 0).toLocaleString('en-US')} ج.م`],
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
      <p className="text-right text-sm leading-7 text-slate-600">
        أول ما تبعت، فريقنا بيراجع الوحدة وينشرها في السوق. المستندات بنطلبها
        بعدين قبل إتمام البيع — مش قبل النشر.
      </p>
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-3 text-center text-sm font-bold text-red-700"
        >
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