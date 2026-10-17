'use client'

import { useState, useTransition } from 'react'
import { submitBuyRequest } from '@/app/actions/submit-forms'
import { Check, ChevronDown, Eye, EyeOff, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TurnstileBox } from '@/components/funnel-shell'

const benefits = [
  'كل فرصة بأرقام كاملة: المطلوب كاش، الأقساط المتبقية، ومواعيدها',
  'وحدات متحقق من عقودها ومدفوعاتها ومن حق النقل',
  'بنمشي معاك في إجراءات النقل لحد التسجيل',
  'عمولتنا 1.25% بس عند إتمام النقل — معاملة من الأول',
  'مشتريين بس: بنتعامل مع المشتري النهائي — مش بننقل طلبات من سمسارة.',
]
const unitTypes = ['شقة', 'دوبلكس', 'بنتهاوس', 'فيلا', 'تاون هاوس', 'توين هاوس', 'ستوديو', 'مكتب']

export default function BuyersPage() {
  const [step, setStep] = useState(1)
  const [selectedTypes, setSelectedTypes] = useState(['شقة'])
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [submitState, setSubmitState] = useState<{ success?: boolean; error?: string }>({})
  const [pending, startTransition] = useTransition()
  const submitAction = (formData: FormData) => { startTransition(async () => { const result = await submitBuyRequest(formData); setSubmitState(result.success ? { success: true } : { error: result.error ?? 'تعذر إرسال الطلب' }) }) }

  const toggleType = (type: string) => setSelectedTypes((current) => current.includes(type) ? current.filter((item) => item !== type) : [...current, type])

  return <main dir="rtl" className="min-h-screen bg-[#f6f7f9] px-4 py-12 text-[#111b31] sm:px-6 lg:py-16">
    <div className="mx-auto max-w-3xl">
      <header className="text-center">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">اشتري بسعر التعاقد القديم</h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600">سجّل قدرتك الشرائية — الكاش المتاح دلوقتي والقسط اللي يناسبك — وهتجيلك الفرص المتحقق منها اللي تنفع معاك بالضبط.</p>
      </header>
      <div className="mt-8 flex flex-col gap-4">{benefits.map((benefit, index) => <div key={benefit} className={`flex items-center gap-3 rounded-xl border px-5 py-3 text-sm ${index === 3 ? 'border-teal-300 bg-teal-50 font-bold text-teal-700' : index === 4 ? 'border-slate-500 bg-transparent font-semibold' : 'border-slate-200 bg-white text-slate-700'}`}><Check className="size-4 shrink-0 text-teal-700" />{benefit}</div>)}</div>
      <form action={submitAction} className="mt-8 rounded-2xl bg-white p-5 shadow-sm sm:p-7">
        <div className="rounded-2xl border border-slate-500 px-5 py-4"><div className="flex items-center gap-2 text-sm font-bold"><UserRound className="size-4" />بتتعامل مع المشتري نفسه بس</div><p className="mt-2 text-xs leading-6 text-slate-600">مش بنقبل طلبات من سمسارة بيدوروها للعميل. الوحدات دي بتتعرض للمشتري النهائي مباشرة.</p></div>
        <div className="mt-6 flex items-center justify-between"><h2 className="text-xl font-black">{step === 1 ? 'قدرتك الشرائية' : step === 2 ? 'تفضيلاتك' : 'بيانات التواصل'}</h2><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">خطوة {step} من 3</span></div>
        <div className="mt-5 flex gap-1.5">{[1, 2, 3].map((item) => <span key={item} className={`h-1 flex-1 rounded-full ${item <= step ? 'bg-teal-700' : 'bg-slate-200'}`} />)}</div>
        <div className="mt-7">{step === 1 ? <StepOne /> : step === 2 ? <StepTwo selectedTypes={selectedTypes} toggleType={toggleType} /> : <StepThree passwordVisible={passwordVisible} setPasswordVisible={setPasswordVisible} />}</div>
        {submitState?.success && <p className="mt-4 rounded-xl bg-teal-50 p-3 text-center text-sm font-semibold text-teal-800">تم إرسال طلبك بنجاح.</p>}{submitState?.error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-center text-sm text-red-700">{submitState.error}</p>}<div className="mt-7 flex gap-3"><Button type={step === 3 ? 'submit' : 'button'} disabled={pending} onClick={() => step < 3 ? setStep(step + 1) : undefined} className={`h-12 flex-1 rounded-xl ${step === 3 ? 'bg-teal-700 hover:bg-teal-800' : 'bg-[#0a1128] hover:bg-[#172344]'}`}>{pending ? 'جاري الإرسال...' : step === 3 ? 'إرسال للمراجعة' : 'كمل'}</Button>{step > 1 && <Button type="button" variant="outline" onClick={() => setStep(step - 1)} className="h-12 rounded-xl border-slate-300 bg-white px-7">رجوع</Button>}</div>
      </form>
    </div>
  </main>
}

function StepOne() { return <div className="flex flex-col gap-6"><NumberField label="الكاش المتاح معاك دلوقتي *" helper="3 مليون ج.م" /><NumberField label="أقصى قسط يريحك *" helper="500 ألف ج.م" /><fieldset><legend className="mb-3 text-sm font-bold">نظام القسط</legend><div className="grid gap-2">{['شهري', 'ربع سنوي (كل 3 شهور)', 'نصف سنوي', 'سنوي'].map((item, index) => <label key={item} className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${index === 1 ? 'border-teal-600 bg-teal-50' : 'border-slate-200'}`}><span>{item}</span><input type="radio" name="installment" defaultChecked={index === 1} /></label>)}</div></fieldset><NumberField label="سعر التعاقد المستهدف (الميزانية) *" helper="3.5 مليون ج.م" /><TurnstileBox /></div> }
function StepTwo({ selectedTypes, toggleType }: { selectedTypes: string[]; toggleType: (type: string) => void }) { return <div className="flex flex-col gap-6"><fieldset><legend className="mb-3 text-sm font-bold">نوع الوحدة اللي بتدور عليها</legend><div className="flex flex-wrap gap-2">{unitTypes.map((item) => <button key={item} type="button" onClick={() => toggleType(item)} className={`rounded-full border px-4 py-2 text-sm ${selectedTypes.includes(item) ? 'border-teal-700 bg-teal-50 text-teal-800' : 'border-slate-200 bg-white'}`}>{item}</button>)}</div></fieldset><div><Label htmlFor="rooms">أقل عدد غرف</Label><Input id="rooms" type="number" min="0" className="mt-2" placeholder="غرفة" /></div><fieldset><legend className="mb-3 text-sm font-bold">الاستلام</legend><div className="grid gap-2">{['جاهزة للاستلام', 'تحت الإنشاء'].map((item, index) => <label key={item} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm"><span>{item}</span><input type="radio" name="delivery" defaultChecked={index === 0} /></label>)}</div></fieldset><div><Label htmlFor="areas">المناطق أو الكمبوندات اللي تهمك</Label><div className="mt-2 rounded-xl border border-slate-200 bg-white p-2"><span className="inline-flex rounded-full bg-teal-50 px-3 py-1 text-xs text-teal-800">التجمع الخامس <button type="button" className="mr-2">×</button></span><div className="mt-2 flex items-center"><Input id="areas" className="border-0 shadow-none focus-visible:ring-0" placeholder="دور على منطقة..." /><ChevronDown className="ml-2 size-4 text-slate-400" /></div></div></div></div> }
function StepThree({ passwordVisible, setPasswordVisible }: { passwordVisible: boolean; setPasswordVisible: (visible: boolean) => void }) { return <div className="flex flex-col gap-5"><TextField label="اسمك" id="name" /><div><Label htmlFor="phone">رقم موبايلك</Label><div className="mt-2 flex gap-2"><select aria-label="رمز الدولة" className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm"><option>🇪🇬 مصر +20</option></select><Input id="phone" name="phone" inputMode="tel" placeholder="01xx xxx xxxx" /></div></div><TextField label="إيميلك" id="email" type="email" /><div><Label htmlFor="password">اختار كلمة سر لحسابك</Label><div className="relative mt-2"><Input id="password" type={passwordVisible ? 'text' : 'password'} className="pl-16" /><button type="button" onClick={() => setPasswordVisible(!passwordVisible)} className="absolute left-3 top-3 text-xs text-blue-700">{passwordVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />} إظهار</button></div><p className="mt-2 text-xs text-slate-500">8 حروف على الأقل — هتدخل بيها على حسابك بعد كده</p></div><p className="text-center text-xs leading-6 text-slate-500">بإرسال طلبك، بتوافق على سياسة الخصوصية وإننا نتواصل معاك بخصوص طلبك.</p><TurnstileBox /></div> }
function NumberField({ label, helper }: { label: string; helper: string }) { return <div><Label>{label}</Label><Input type="number" className="mt-2" placeholder="ج.م" /><p className="mt-2 text-xs font-semibold text-teal-700">{helper}</p></div> }
function TextField({ label, id, type = 'text' }: { label: string; id: string; type?: string }) { return <div><Label htmlFor={id}>{label}</Label><Input id={id} type={type} className="mt-2" /></div> }
