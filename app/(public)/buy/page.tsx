'use client'

import { useState, useTransition } from 'react'
import { submitBuyRequest } from '@/app/actions/submit-forms'
import { Check, Eye, EyeOff, UserRound, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TurnstileBox } from '@/components/funnel-shell'

const benefits = ['كل فرصة بأرقام كاملة: المطلوب كاش، الأقساط المتبقية، ومواعيدها', 'وحدات متحقق من عقودها ومدفوعاتها ومن حق النقل', 'بنمشي معاك في إجراءات النقل لحد التسجيل', 'عمولتنا 1.25% بس عند إتمام النقل — معاملة من الأول', 'مشتريين بس: بنتعامل مع المشتري النهائي — مش بننقل طلبات من سمسارة.']
const unitTypes = ['شقة', 'دوبلكس', 'بنتهاوس', 'تاون هاوس', 'توين هاوس', 'إي فيلا', 'فيلا', 'شاليه', 'مكتب', 'محل', 'عيادة', 'أرض']

function formatAmount(value: string) {
  const amount = Number(value.replace(/,/g, ''))
  if (!amount) return ''
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(2).replace(/\.00$/, '')} مليون ج.م`
  if (amount >= 1_000) return `${Math.round(amount / 1_000)} ألف ج.م`
  return `${amount.toLocaleString('ar-EG')} ج.م`
}

export default function BuyersPage() {
  const [step, setStep] = useState(1)
  const [cash, setCash] = useState('')
  const [maxInstallment, setMaxInstallment] = useState('')
  const [budget, setBudget] = useState('')
  const [installment, setInstallment] = useState('شهري')
  const [selectedTypes, setSelectedTypes] = useState(['شقة'])
  const [areas, setAreas] = useState<string[]>([])
  const [areaInput, setAreaInput] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [submitState, setSubmitState] = useState<{ success?: boolean; error?: string }>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pending, startTransition] = useTransition()

  const addArea = () => { const value = areaInput.trim(); if (value && !areas.includes(value)) setAreas((current) => [...current, value]); setAreaInput('') }
  const submitAction = (formData: FormData) => {
    setIsSubmitting(true)
    setSubmitState({})
    startTransition(async () => {
      try {
        const result = await submitBuyRequest(formData)
        if (result.success) {
          setIsSubmitted(true)
          setSubmitState({ success: true })
        } else {
          setSubmitState({ error: result.error ?? 'تعذر إرسال الطلب' })
        }
      } finally {
        setIsSubmitting(false)
      }
    })
  }

  return <main dir="rtl" className="min-h-screen bg-[#f5f6f8] px-4 py-12 text-[#111a30] sm:px-6 lg:py-16">
    <div className="mx-auto max-w-3xl">
      <header className="text-center"><h1 className="text-3xl font-black tracking-tight sm:text-4xl">اشتري بسعر التعاقد القديم</h1><p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600">سجّل قدرتك الشرائية — الكاش المتاح دلوقتي والقسط اللي يناسبك — وهتجيلك الفرص المتحقق منها اللي تنفع معاك بالضبط.</p></header>
      <div className="mt-8 flex flex-col gap-4">{benefits.map((benefit, index) => <div key={benefit} className={`flex items-center gap-3 rounded-xl border px-5 py-3 text-sm ${index === 3 ? 'border-teal-300 bg-teal-50 font-bold text-teal-700' : index === 4 ? 'border-slate-500 bg-transparent font-semibold' : 'border-slate-200 bg-white text-slate-700'}`}><Check className="size-4 shrink-0 text-teal-700" />{benefit}</div>)}</div>
      <form action={submitAction} className="mt-8 rounded-2xl bg-white p-5 shadow-sm sm:p-7">
        <div className="rounded-2xl border border-slate-500 px-5 py-4"><div className="flex items-center gap-2 text-sm font-bold"><UserRound className="size-4" />بتتعامل مع المشتري نفسه بس</div><p className="mt-2 text-xs leading-6 text-slate-600">مش بنقبل طلبات من سمسارة بيدوروها للعميل. الوحدات دي بتتعرض للمشتري النهائي مباشرة.</p></div>
        <div className="mt-6 flex items-center justify-between"><h2 className="text-xl font-black">{step === 1 ? 'قدرتك الشرائية' : step === 2 ? 'تفضيلاتك' : 'بيانات التواصل'}</h2><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">خطوة {step} من 3</span></div><div className="mt-5 flex gap-1.5">{[1, 2, 3].map((item) => <span key={item} className={`h-1 flex-1 rounded-full ${item <= step ? 'bg-teal-700' : 'bg-slate-200'}`} />)}</div>
        <div className="mt-7">{step === 1 ? <StepOne cash={cash} setCash={setCash} maxInstallment={maxInstallment} setMaxInstallment={setMaxInstallment} budget={budget} setBudget={setBudget} installment={installment} setInstallment={setInstallment} /> : step === 2 ? <StepTwo selectedTypes={selectedTypes} setSelectedTypes={setSelectedTypes} areas={areas} setAreas={setAreas} areaInput={areaInput} setAreaInput={setAreaInput} addArea={addArea} /> : <StepThree passwordVisible={passwordVisible} setPasswordVisible={setPasswordVisible} />}</div>
        <input type="hidden" name="available_cash" value={cash} />
        <input type="hidden" name="max_installment" value={maxInstallment} />
        <input type="hidden" name="payment_plan" value={installment} />
        <input type="hidden" name="budget" value={budget} />
        {selectedTypes.map((type) => <input key={type} type="hidden" name="unit_type" value={type} />)}
        {areas.map((area) => <input key={area} type="hidden" name="preferred_area" value={area} />)}
        {isSubmitted && <div className="mt-4 rounded-xl bg-green-50 p-3 text-center text-sm font-semibold text-green-700">تم إرسال طلبك بنجاح</div>}{submitState.error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-center text-sm text-red-700">{submitState.error}</p>}
        {!isSubmitted && <div className="mt-7 flex gap-3"><Button type={step === 3 ? 'submit' : 'button'} disabled={pending || isSubmitting} onClick={() => step < 3 && setStep(step + 1)} className={`h-12 flex-1 rounded-xl ${step === 3 ? 'bg-teal-700 hover:bg-teal-800' : 'bg-[#0a1128] hover:bg-[#172344]'}`}>{pending || isSubmitting ? 'جاري الإرسال...' : step === 3 ? 'إرسال للمراجعة' : 'كمل'}</Button>{step > 1 && <Button type="button" variant="outline" onClick={() => setStep(step - 1)} className="h-12 rounded-xl border-slate-300 bg-white px-7">ارجع</Button>}</div>}
      </form>
    </div>
  </main>
}

function StepOne({ cash, setCash, maxInstallment, setMaxInstallment, budget, setBudget, installment, setInstallment }: { cash: string; setCash: (value: string) => void; maxInstallment: string; setMaxInstallment: (value: string) => void; budget: string; setBudget: (value: string) => void; installment: string; setInstallment: (value: string) => void }) { return <div className="flex flex-col gap-6"><MoneyField id="cash" name="available_cash_display" label="الكاش المتاح معاك دلوقتي *" value={cash} onChange={setCash} helper="المبلغ اللي تقدر تدفعه فورًا لصاحب الوحدة" /><MoneyField id="max-installment" name="max_installment_display" label="أقصى قسط يريحك *" value={maxInstallment} onChange={setMaxInstallment} /><fieldset><legend className="mb-3 text-sm font-bold">نظام القسط</legend><div className="grid gap-2">{['شهري', 'ربع سنوي (كل 3 شهور)', 'نصف سنوي', 'سنوي'].map((item) => <label key={item} className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-sm ${installment === item ? 'border-teal-600 bg-teal-50' : 'border-slate-200'}`}><span>{item}</span><input type="radio" name="installment" value={item} checked={installment === item} onChange={() => setInstallment(item)} /></label>)}</div></fieldset><MoneyField id="budget" name="budget_display" label="سعر التعاقد المستهدف (الميزانية) *" value={budget} onChange={setBudget} helper="أقصى سعر تعاقد مناسب لميزانيتك" /></div> }
function StepTwo({ selectedTypes, setSelectedTypes, areas, setAreas, areaInput, setAreaInput, addArea }: { selectedTypes: string[]; setSelectedTypes: (value: string[]) => void; areas: string[]; setAreas: (value: string[]) => void; areaInput: string; setAreaInput: (value: string) => void; addArea: () => void }) { return <div className="flex flex-col gap-6"><fieldset><legend className="mb-3 text-sm font-bold">نوع الوحدة اللي بتدور عليها</legend><div className="flex flex-wrap gap-2">{unitTypes.map((item) => <button key={item} type="button" onClick={() => setSelectedTypes(selectedTypes.includes(item) ? selectedTypes.filter((type) => type !== item) : [...selectedTypes, item])} className={`rounded-full border px-4 py-2 text-sm ${selectedTypes.includes(item) ? 'border-teal-700 bg-teal-50 text-teal-800' : 'border-slate-200 bg-white'}`}>{selectedTypes.includes(item) && '✓ '}{item}</button>)}</div></fieldset><div><Label htmlFor="rooms">أقل عدد غرف</Label><Input id="rooms" name="min_rooms" type="number" min="0" className="mt-2" placeholder="غرفة" /></div><fieldset><legend className="mb-3 text-sm font-bold">الاستلام</legend><div className="grid gap-2">{['جاهزة للاستلام', 'تحت الإنشاء'].map((item, index) => <label key={item} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm"><span>{item}</span><input type="radio" name="delivery_status" value={item} defaultChecked={index === 0} /></label>)}</div></fieldset><div><Label htmlFor="areas">المناطق أو الكمبوندات اللي تهمك</Label><div className="mt-2 rounded-xl border border-slate-200 bg-white p-2">{areas.length > 0 && <div className="mb-2 flex flex-wrap gap-2">{areas.map((area) => <span key={area} className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-3 py-1 text-xs text-teal-800">{area}<button type="button" onClick={() => setAreas(areas.filter((item) => item !== area))} aria-label={`حذف ${area}`}><X className="size-3" /></button></span>)}</div>}<Input id="areas" value={areaInput} onChange={(event) => setAreaInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addArea() } }} placeholder="اكتب منطقة واضغط Enter" className="border-0 shadow-none focus-visible:ring-0" /></div><p className="mt-2 text-xs text-slate-500">مثال: الشيخ زايد، أكتوبر، زايد الجديدة</p></div><TurnstileBox /></div> }
function StepThree({ passwordVisible, setPasswordVisible }: { passwordVisible: boolean; setPasswordVisible: (visible: boolean) => void }) { return <div className="flex flex-col gap-5"><TextField label="اسمك" id="name" name="name" /><div><Label htmlFor="phone">رقم موبايلك</Label><div className="mt-2 flex gap-2"><select name="countryCode" aria-label="رمز الدولة" className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm"><option>مصر +20</option></select><Input id="phone" name="phone" inputMode="tel" placeholder="01xx xxx xxxx" /></div></div><TextField label="إيميلك" id="email" name="email" type="email" /><div><Label htmlFor="password">اختار كلمة سر لحسابك</Label><div className="relative mt-2"><Input id="password" name="password" type={passwordVisible ? 'text' : 'password'} className="pl-16" /><button type="button" onClick={() => setPasswordVisible(!passwordVisible)} className="absolute left-3 top-3 text-xs text-blue-700">{passwordVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />} إظهار</button></div><p className="mt-2 text-xs text-slate-500">8 حروف على الأقل — هتدخل بيها على حسابك بعد كده</p></div><p className="text-center text-xs leading-6 text-slate-500">بإرسال طلبك، بتوافق على سياسة الخصوصية وإننا نتواصل معاك بخصوص طلبك.</p><TurnstileBox /></div> }
function MoneyField({ id, name, label, value = '', onChange, helper }: { id: string; name: string; label: string; value?: string; onChange?: (value: string) => void; helper?: string }) { return <div><Label htmlFor={id}>{label}</Label><Input id={id} name={name} type="number" value={value} onChange={(event) => onChange?.(event.target.value)} className="mt-2" placeholder="ج.م" /><p className="mt-2 text-xs font-semibold text-teal-700">{value ? formatAmount(value) : helper}</p>{value && helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}</div> }
function TextField({ label, id, name, type = 'text' }: { label: string; id: string; name: string; type?: string }) { return <div><Label htmlFor={id}>{label}</Label><Input id={id} name={name} type={type} className="mt-2" /></div> }
