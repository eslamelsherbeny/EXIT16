'use client'

import { useState, useTransition } from 'react'
import { submitBuyRequest } from '@/app/actions/submit-forms'
import { Check, Eye, EyeOff, UserRound, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TurnstileBox } from '@/components/funnel-shell'

const benefits = ['كل فرصة بأرقام كاملة: المطلوب كاش، الأقساط المتبقية، ومواعيدها', 'وحدات متحقق من عقودها ومدفوعاتها ومن حق النقل', 'بنمشي معاك في إجراءات النقل لحد التسجيل', 'عمولتنا 1.25% بس عند إتمام النقل — معاملة من الأول', 'مشتريين بس: بنتعامل مع المشتري النهائي — مش بنقبل طلبات من سمسارة.']
const unitTypes = ['شقة', 'دوبلكس', 'بنتهاوس', 'تاون هاوس', 'توين هاوس', 'إي فيلا', 'فيلا', 'شاليه', 'مكتب', 'محل', 'عيادة', 'أرض']
const paymentPlans = ['شهري', 'ربع سنوي (كل 3 شهور)', 'نصف سنوي', 'سنوي']
const deliveryStatuses = ['جاهزة للاستلام', 'تحت الإنشاء']

function formatAmount(value: string) {
  const amount = Number(value.replace(/,/g, ''))
  if (!amount) return ''
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(2).replace(/\.00$/, '')} مليون ج.م`
  if (amount >= 1_000) return `${Math.round(amount / 1_000)} ألف ج.م`
  return `${amount.toLocaleString('ar-EG')} ج.م`
}

type BuyerFormData = {
  availableCash: string
  maxInstallment: string
  paymentPlan: string
  budget: string
  unitTypes: string[]
  minRooms: string
  deliveryStatus: string
  preferredAreas: string[]
  name: string
  phone: string
  email: string
  password: string
}

const initialFormData: BuyerFormData = {
  availableCash: '', maxInstallment: '', paymentPlan: 'شهري', budget: '', unitTypes: ['شقة'], minRooms: '', deliveryStatus: deliveryStatuses[0], preferredAreas: [], name: '', phone: '', email: '', password: '',
}

export default function BuyersPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<BuyerFormData>(initialFormData)
  const [areaInput, setAreaInput] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [submitState, setSubmitState] = useState<{ success?: boolean; error?: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pending, startTransition] = useTransition()

  const update = <K extends keyof BuyerFormData>(key: K, value: BuyerFormData[K]) => setFormData((current) => ({ ...current, [key]: value }))
  const addArea = () => { const value = areaInput.trim(); if (value && !formData.preferredAreas.includes(value)) update('preferredAreas', [...formData.preferredAreas, value]); setAreaInput('') }
  const nextStep = () => setStep((current) => Math.min(3, current + 1))
  const previousStep = () => setStep((current) => Math.max(1, current - 1))
  const handleFinalSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setSubmitState({})
    const payload = new FormData()
    payload.set('available_cash', formData.availableCash || '0')
    payload.set('max_installment', formData.maxInstallment || '0')
    payload.set('payment_plan', formData.paymentPlan)
    payload.set('budget', formData.budget || '0')
    formData.unitTypes.forEach((value) => payload.append('unit_type', value))
    payload.set('min_rooms', formData.minRooms || '0')
    payload.set('delivery_status', formData.deliveryStatus)
    formData.preferredAreas.forEach((value) => payload.append('preferred_area', value))
    payload.set('name', formData.name || 'Unknown')
    payload.set('phone', formData.phone || 'Unknown')
    payload.set('email', formData.email)
    payload.set('password', formData.password)
    startTransition(async () => {
      try {
        const result = await submitBuyRequest(payload)
        setSubmitState(result.success ? { success: true } : { error: result.error ?? 'تعذر إرسال الطلب' })
      } finally { setIsSubmitting(false) }
    })
  }

  return <main dir="rtl" className="min-h-screen bg-[#f5f6f8] px-4 py-12 text-[#111a30] sm:px-6 lg:py-16">
    <div className="mx-auto max-w-3xl">
      <header className="text-center"><h1 className="text-3xl font-black tracking-tight sm:text-4xl">اشتري بسعر التعاقد القديم</h1><p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600">سجّل قدرتك الشرائية — الكاش المتاح دلوقتي والقسط اللي يناسبك — وهتجيلك الفرص المتحقق منها اللي تنفع معاك بالضبط.</p></header>
      <div className="mt-8 flex flex-col gap-4">{benefits.map((benefit, index) => <div key={benefit} className={`flex items-center gap-3 rounded-xl border px-5 py-3 text-sm ${index === 3 ? 'border-teal-300 bg-teal-50 font-bold text-teal-700' : index === 4 ? 'border-slate-500 bg-transparent font-semibold' : 'border-slate-200 bg-white text-slate-700'}`}><Check className="size-4 shrink-0 text-teal-700" />{benefit}</div>)}</div>
      <form onSubmit={handleFinalSubmit} className="mt-8 rounded-2xl bg-white p-5 shadow-sm sm:p-7">
        <div className="rounded-2xl border border-slate-500 px-5 py-4"><div className="flex items-center gap-2 text-sm font-bold"><UserRound className="size-4" />بتتعامل مع المشتري نفسه بس</div><p className="mt-2 text-xs leading-6 text-slate-600">مش بنقبل طلبات من سمسارة بيدوروها للعميل. الوحدات دي بتتعرض للمشتري النهائي مباشرة، عشان السعر يفضل سعر التعاقد من غير أي زيادة.</p></div>
        <div className="mt-6 flex items-center justify-between"><h2 className="text-xl font-black">{step === 1 ? 'قدرتك الشرائية' : step === 2 ? 'تفضيلاتك' : 'بيانات التواصل'}</h2><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">خطوة {step} من 3</span></div><div className="mt-5 flex gap-1.5">{[1, 2, 3].map((item) => <span key={item} className={`h-1 flex-1 rounded-full ${item <= step ? 'bg-teal-700' : 'bg-slate-200'}`} />)}</div>
        <div className="mt-7">{step === 1 ? <StepOne data={formData} update={update} /> : step === 2 ? <StepTwo data={formData} update={update} areaInput={areaInput} setAreaInput={setAreaInput} addArea={addArea} /> : <StepThree data={formData} update={update} passwordVisible={passwordVisible} setPasswordVisible={setPasswordVisible} />}</div>
        {submitState.success && <div className="mt-5 rounded-xl bg-green-50 p-3 text-center text-sm font-semibold text-green-700">تم إرسال طلبك بنجاح</div>}
        {submitState.error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-center text-sm text-red-700">{submitState.error}</p>}
        {!submitState.success && <div className="mt-7 flex gap-3"><Button type={step === 3 ? 'submit' : 'button'} disabled={pending || isSubmitting} onClick={step < 3 ? nextStep : undefined} className={`h-12 flex-1 rounded-xl ${step === 3 ? 'bg-teal-700 hover:bg-teal-800' : 'bg-[#0a1128] hover:bg-[#172344]'}`}>{pending || isSubmitting ? 'جاري الإرسال...' : step === 3 ? 'إرسال للمراجعة' : 'كمل'}</Button>{step > 1 && <Button type="button" variant="outline" onClick={previousStep} className="h-12 rounded-xl border-slate-300 bg-white px-7">ارجع</Button>}</div>}
      </form>
    </div>
  </main>
}

function StepOne({ data, update }: { data: BuyerFormData; update: <K extends keyof BuyerFormData>(key: K, value: BuyerFormData[K]) => void }) { return <div className="flex flex-col gap-6"><MoneyField id="available-cash" label="الكاش المتاح معاك دلوقتي *" value={data.availableCash} onChange={(value) => update('availableCash', value)} helper="المبلغ اللي تقدر تدفعه فورًا لصاحب الوحدة" /><MoneyField id="max-installment" label="أقصى قسط يريحك *" value={data.maxInstallment} onChange={(value) => update('maxInstallment', value)} /><fieldset><legend className="mb-3 text-sm font-bold">نظام القسط</legend><div className="grid gap-2">{paymentPlans.map((item) => <label key={item} className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-sm ${data.paymentPlan === item ? 'border-teal-600 bg-teal-50' : 'border-slate-200'}`}><span>{item}</span><input type="radio" name="payment-plan" value={item} checked={data.paymentPlan === item} onChange={() => update('paymentPlan', item)} /></label>)}</div></fieldset><MoneyField id="budget" label="سعر التعاقد المستهدف (الميزانية) *" value={data.budget} onChange={(value) => update('budget', value)} helper="أقصى سعر تعاقد مناسب لميزانيتك" /></div> }
function StepTwo({ data, update, areaInput, setAreaInput, addArea }: { data: BuyerFormData; update: <K extends keyof BuyerFormData>(key: K, value: BuyerFormData[K]) => void; areaInput: string; setAreaInput: (value: string) => void; addArea: () => void }) { return <div className="flex flex-col gap-6"><fieldset><legend className="mb-3 text-sm font-bold">نوع الوحدة اللي بتدور عليها</legend><p className="mb-3 text-xs text-slate-500">اختار نوع أو أكثر — بنرشح لك اللي يناسبك</p><div className="flex flex-wrap gap-2">{unitTypes.map((item) => <button key={item} type="button" onClick={() => update('unitTypes', data.unitTypes.includes(item) ? data.unitTypes.filter((type) => type !== item) : [...data.unitTypes, item])} className={`rounded-full border px-4 py-2 text-sm ${data.unitTypes.includes(item) ? 'border-teal-700 bg-teal-50 text-teal-800' : 'border-slate-200 bg-white'}`}>{data.unitTypes.includes(item) && '✔ '}{item}</button>)}</div></fieldset><div><Label htmlFor="rooms">أقل عدد غرف</Label><Input id="rooms" type="number" min="0" value={data.minRooms} onChange={(event) => update('minRooms', event.target.value)} className="mt-2" placeholder="غرفة" /></div><fieldset><legend className="mb-3 text-sm font-bold">الاستلام</legend><div className="grid gap-2">{deliveryStatuses.map((item) => <label key={item} className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-sm ${data.deliveryStatus === item ? 'border-teal-600 bg-teal-50' : 'border-slate-200'}`}><span>{item}</span><input type="radio" name="delivery-status" value={item} checked={data.deliveryStatus === item} onChange={() => update('deliveryStatus', item)} /></label>)}</div></fieldset><div><Label htmlFor="areas">المناطق أو الكمبوندات اللي تهمك</Label><div className="mt-2 rounded-xl border border-slate-200 bg-white p-2">{data.preferredAreas.length > 0 && <div className="mb-2 flex flex-wrap gap-2">{data.preferredAreas.map((area) => <span key={area} className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-3 py-1 text-xs text-teal-800">{area}<button type="button" onClick={() => update('preferredAreas', data.preferredAreas.filter((item) => item !== area))} aria-label={`حذف ${area}`}><X className="size-3" /></button></span>)} </div>}<Input id="areas" value={areaInput} onChange={(event) => setAreaInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.nativeEvent.isComposing && event.keyCode !== 229) { event.preventDefault(); addArea() } }} onBlur={addArea} placeholder="ضيف منطقة تانية..." /></div><p className="mt-2 text-xs text-slate-500">مثال: الشيخ زايد، أكتوبر، زايد الجديدة</p></div></div> }
function StepThree({ data, update, passwordVisible, setPasswordVisible }: { data: BuyerFormData; update: <K extends keyof BuyerFormData>(key: K, value: BuyerFormData[K]) => void; passwordVisible: boolean; setPasswordVisible: (visible: boolean) => void }) { return <div className="flex flex-col gap-5"><TextField label="اسمك" id="name" value={data.name} onChange={(value) => update('name', value)} /><div><Label htmlFor="phone">رقم موبايلك</Label><div className="mt-2 flex gap-2"><select aria-label="رمز الدولة" className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm"><option>مصر +20</option></select><Input id="phone" value={data.phone} onChange={(event) => update('phone', event.target.value)} inputMode="tel" placeholder="01xx xxx xxxx" /></div><p className="mt-2 text-xs text-slate-500">هنكلمك عليه واتساب أو مكالمة — من غير إزعاج</p></div><TextField label="إيميلك" id="email" type="email" value={data.email} onChange={(value) => update('email', value)} /><div><Label htmlFor="password">اختار كلمة سر لحسابك</Label><div className="relative mt-2"><Input id="password" value={data.password} onChange={(event) => update('password', event.target.value)} type={passwordVisible ? 'text' : 'password'} className="pl-16" /><button type="button" onClick={() => setPasswordVisible(!passwordVisible)} className="absolute left-3 top-3 flex items-center gap-1 text-xs text-blue-700">{passwordVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}إظهار</button></div><p className="mt-2 text-xs text-slate-500">8 حروف على الأقل — هتدخل بيها على حسابك بعد كده</p></div><p className="text-center text-xs leading-6 text-slate-500">بإرسال طلبك، بتوافق على سياسة الخصوصية وإننا نتواصل معاك بخصوص طلبك.</p><TurnstileBox /></div> }
function MoneyField({ id, label, value, onChange, helper }: { id: string; label: string; value: string; onChange: (value: string) => void; helper?: string }) { return <div><Label htmlFor={id}>{label}</Label><Input id={id} type="number" value={value} onChange={(event) => onChange(event.target.value)} className="mt-2" placeholder="ج.م" /><p className="mt-2 min-h-4 text-xs font-semibold text-teal-700">{value ? formatAmount(value) : ''}</p>{helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}</div> }
function TextField({ label, id, type = 'text', value, onChange }: { label: string; id: string; type?: string; value: string; onChange: (value: string) => void }) { return <div><Label htmlFor={id}>{label}</Label><Input id={id} value={value} onChange={(event) => onChange(event.target.value)} type={type} className="mt-2" /></div> }
