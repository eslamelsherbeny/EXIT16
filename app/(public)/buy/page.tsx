'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitBuyRequest, type BuyRequestPayload } from '@/app/actions/submit-forms'
import { Check, Eye, EyeOff, UserRound, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TurnstileBox } from '@/components/funnel-shell'
import { CountrySelector } from '@/components/country-selector'

const benefits = ['كل فرصة بأرقام كاملة: المطلوب كاش، الأقساط المتبقية، ومواعيدها', 'وحدات متحقق من عقودها ومدفوعاتها ومن حق النقل', 'بنمشي معاك في إجراءات النقل لحد التسجيل', 'عمولتنا 1.25% بس عند إتمام النقل — معلنة من الأول', 'مشتريين بس: بنتعامل مع المشتري النهائي — مش بنقبل طلبات من سمسارة.']
const unitTypes = ['شقة', 'دوبلكس', 'بنتهاوس', 'تاون هاوس', 'توين هاوس', 'اي فيلا', 'فيلا', 'شاليه', 'مكتب', 'محل', 'عيادة', 'أرض']
const areas = ['التجمع الخامس', 'التجمع الأول', 'الشيخ زايد', 'زايد الجديدة', '6 أكتوبر', 'العاصمة الإدارية', 'الرحاب', 'مدينتي', 'المستقبل سيتي', 'الساحل الشمالي', 'الشروق']
const paymentPlans = ['شهري', 'ربع سنوي (كل 3 شهور)', 'نصف سنوي', 'سنوي']
const deliveryStatuses = ['جاهزة للاستلام', 'تحت الإنشاء']

type FormState = BuyRequestPayload & { password: string }
const initial: FormState = { available_cash: 0, max_installment: 0, payment_plan: 'شهري', budget: 0, unit_types: ['شقة'], min_rooms: 0, delivery_status: deliveryStatuses[0], preferred_areas: [], name: '', phone: '', email: '', password: '' }

function formatAmount(value: number) { 
  if (!value) return ''; 
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2).replace(/\.00$/, '')} مليون ج.م`; 
  if (value >= 1_000) return `${Math.round(value / 1_000)} ألف ج.م`; 
  return `${value.toLocaleString('ar-EG')} ج.م` 
}

export default function BuyersPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [data, setData] = useState<FormState>(initial)
  const [areaInput, setAreaInput] = useState('')
  const [countryCode, setCountryCode] = useState('20')
  const [showAreas, setShowAreas] = useState(false)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => { 
    setData((current) => ({ ...current, [key]: value })); 
    setErrors((current) => ({ ...current, [key]: '' })) 
  }
  
  const addArea = (value = areaInput) => { 
    const clean = value.trim(); 
    if (clean && !data.preferred_areas.includes(clean)) update('preferred_areas', [...data.preferred_areas, clean]); 
    setAreaInput(''); 
    setShowAreas(false) 
  }

  const nextFromOne = () => { 
    const nextErrors: Record<string, string> = {}; 
    if (!data.available_cash) nextErrors.available_cash = 'هذا الحقل مطلوب'; 
    if (!data.max_installment) nextErrors.max_installment = 'هذا الحقل مطلوب'; 
    if (!data.payment_plan) nextErrors.payment_plan = 'هذا الحقل مطلوب، يرجى اختيار نظام القسط'; 
    if (!data.budget) nextErrors.budget = 'هذا الحقل مطلوب'; 
    if (data.max_installment > data.budget) nextErrors.max_installment = 'قيمة القسط لا يمكن أن تتخطى سعر التعاقد المستهدف (الميزانية)'; 
    
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setStep(2);
  }

  const nextFromTwo = () => { 
    const typedArea = areaInput.trim(); 
    const preferredAreas = typedArea && !data.preferred_areas.includes(typedArea) ? [...data.preferred_areas, typedArea] : data.preferred_areas; 
    const nextErrors: Record<string, string> = {}; 
    
    if (!data.unit_types.length) nextErrors.unit_types = 'هذا الحقل مطلوب، يرجى اختيار نوع الوحدة'; 
    if (!data.delivery_status) nextErrors.delivery_status = 'هذا الحقل مطلوب، يرجى اختيار حالة الاستلام'; 
    if (!preferredAreas.length) nextErrors.preferred_areas = 'هذا الحقل مطلوب، يرجى إضافة منطقة واحدة على الأقل'; 
    
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    
    if (typedArea) update('preferred_areas', preferredAreas); 
    setAreaInput(''); 
    setShowAreas(false); 
    setErrors({});
    setStep(3);
  }

  const handleFinalSubmit = async () => { 
    const nextErrors: Record<string, string> = {}; 
    if (!data.name.trim()) nextErrors.name = 'هذا الحقل مطلوب'; 
    if (!data.phone.trim() || !/^[0-9٠-٩]{7,15}$/.test(data.phone.replace(/[\s-]/g, ''))) nextErrors.phone = 'رقم الموبايل غير صحيح'; 
    if (!data.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) nextErrors.email = 'الإيميل غير صحيح أو يحتوي على مسافات'; 
    if (data.password.length < 8) nextErrors.password = 'كلمة السر يجب ألا تقل عن 8 حروف'; 
    
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true); 
    setError(''); 
    
    const result = await submitBuyRequest({ 
      ...data, 
      available_cash: Number(data.available_cash) || 0, 
      max_installment: Number(data.max_installment) || 0, 
      budget: Number(data.budget) || 0, 
      min_rooms: Number.parseInt(String(data.min_rooms), 10) || 0, 
      name: data.name.trim(), 
      phone: data.phone.trim() ? `+${countryCode}${data.phone.trim().replace(/^0+/, '')}` : '', 
      email: data.email.trim(), 
      password: data.password 
    }); 
    
    if (result.success) {
      // بدلاً من عرض شاشة نجاح، نقوم بتوجيه المستخدم مباشرة لصفحة الحساب
      router.push('/account');
    } else {
      setError(result.error ?? 'تعذر إرسال الطلب');
      setIsSubmitting(false) 
    }
  }

  const title = step === 1 ? 'قدرتك الشرائية' : step === 2 ? 'تفضيلاتك' : 'بيانات التواصل'
  
  return <main dir="rtl" className="min-h-screen bg-[#f5f6f8] px-4 py-12 text-[#111a30] sm:px-6 lg:py-16">
    <div className="mx-auto max-w-3xl">
      <header className="text-center">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl text-[#0c513f]">اشتري بسعر التعاقد القديم</h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600">سجّل قدرتك الشرائية — الكاش المتاح دلوقتي والقسط اللي يناسبك — وهنجيبلك الفرص المتحقق منها اللي تنفع معاك بالضبط.</p>
      </header>
      
      {step <= 2 && <>
        <div className="mt-8 flex flex-col gap-4">
          {benefits.map((item, index) => <div key={item} className={`flex items-center gap-3 rounded-xl border px-5 py-3 text-sm ${index === 3 ? 'border-teal-300 bg-teal-50 font-bold text-teal-700' : index === 4 ? 'border-slate-500 bg-transparent font-semibold' : 'border-slate-200 bg-white text-slate-700'}`}><Check className="size-4 shrink-0 text-teal-700" />{item}</div>)}
        </div>
        <div className="mt-8 rounded-2xl border border-slate-500 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold"><UserRound className="size-4" />بنتعامل مع المشتري نفسه بس</div>
          <p className="mt-2 text-xs leading-6 text-slate-600">مش بنقبل طلبات من سمسارة بيدوروها للعميل. الوحدات دي بتتعرض للمشتري النهائي مباشرة، عشان السعر يفضل سعر التعاقد من غير أي زيادة.</p>
        </div>
      </>}

      <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black">{title}</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">خطوة {step} من 3</span>
        </div>
        
        <div className="mt-5 flex gap-1.5">
          {[1,2,3].map((item) => <span key={item} className={`h-1.5 flex-1 rounded-full ${item <= step ? 'bg-[#0c513f]' : 'bg-slate-200'}`} />)}
        </div>
        
        <div className="mt-7">
          {step === 1 && <StepOne data={data} update={update} errors={errors} />}
          {step === 2 && <StepTwo data={data} update={update} errors={errors} areaInput={areaInput} setAreaInput={setAreaInput} showAreas={showAreas} setShowAreas={setShowAreas} addArea={addArea} />}
          {step === 3 && <StepThree data={data} update={update} errors={errors} countryCode={countryCode} setCountryCode={setCountryCode} passwordVisible={passwordVisible} setPasswordVisible={setPasswordVisible} />}
        </div>
        
        {error && <div role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-center text-sm font-bold text-red-700">{error}</div>}
        
        <div className="mt-7 flex gap-3">
          {step > 1 && <button type="button" onClick={() => setStep((step - 1) as 1 | 2)} className="h-12 rounded-xl border border-slate-300 bg-white px-7 font-semibold">ارجع</button>}
          <button type="button" disabled={isSubmitting} onClick={step === 1 ? nextFromOne : step === 2 ? nextFromTwo : handleFinalSubmit} className={`h-12 flex-1 rounded-xl px-5 font-bold text-white ${step === 3 ? 'bg-[#0c513f] hover:bg-[#0a4436]' : 'bg-[#0f172a] hover:bg-[#172344]'}`}>
            {isSubmitting ? 'جاري الإرسال...' : step === 3 ? 'إرسال للمراجعة' : 'كمل'}
          </button>
        </div>
      </div>
      
      {step <= 2 && <div className="mt-6 flex items-center justify-between rounded-2xl bg-[#0f172a] px-5 py-4 text-sm text-white">
        <span>كلمنا على واتساب وقولنا بتدور على إيه</span>
        <button type="button" className="rounded-full bg-green-500 px-4 py-2 font-bold hover:bg-green-600 transition">سجّل اهتمامك دلوقتي</button>
      </div>}
    </div>
  </main>
}

function RequiredLabel({ children }: { children: string }) { const required = children.endsWith(' *'); return <>{required ? <>{children.slice(0, -2)} <span className="mr-1 text-red-500">*</span></> : children}</> }

function Money({ label, value, onChange, helper, error }: { label: string; value: number; onChange: (value: number) => void; helper?: string; error?: string }) { 
  return <div>
    <Label className="text-right block"><RequiredLabel>{label}</RequiredLabel></Label>
    <div className="relative mt-2">
      <Input type="text" inputMode="numeric" dir="ltr" value={value ? value.toLocaleString('en-US') : ''} onChange={(event) => onChange(Number(event.target.value.replace(/[^0-9]/g, '')) || 0)} className={`h-12 rounded-xl pl-12 pr-4 text-left ${error ? 'border-red-500 bg-red-50/20' : 'border-slate-200'}`} />
      <span className="absolute right-3 top-3 text-xs text-slate-500">ج.م</span>
    </div>
    {error && <p className="mt-1.5 text-right text-xs font-semibold text-red-600">{error}</p>}
    <p className="mt-2 min-h-4 text-xs font-semibold text-teal-700 text-right">{formatAmount(value)}</p>
    {helper && <p className="text-xs text-slate-500 text-right">{helper}</p>}
  </div> 
}

function StepOne({ data, update, errors }: { data: FormState; update: <K extends keyof FormState>(key: K, value: FormState[K]) => void; errors?: Record<string, string> }) { 
  return <div className="flex flex-col gap-6">
    <Money error={errors?.available_cash} label="الكاش المتاح معاك دلوقتي *" value={data.available_cash} onChange={(value) => update('available_cash', value)} helper="المبلغ اللي تقدر تدفعه فورًا لصاحب الوحدة" />
    <Money error={errors?.max_installment} label="أقصى قسط يريحك *" value={data.max_installment} onChange={(value) => update('max_installment', value)} />
    <fieldset>
      <legend className="mb-3 text-sm font-bold text-right"><RequiredLabel>نظام القسط *</RequiredLabel></legend>
      <div className={`grid gap-2 ${errors?.payment_plan ? 'rounded-xl border border-red-500 bg-red-50/20 p-2.5' : ''}`}>
        {paymentPlans.map((item) => <label key={item} className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-sm transition ${data.payment_plan === item ? 'border-teal-600 bg-teal-50 font-bold text-teal-800' : 'border-slate-200 hover:border-teal-300 bg-white'}`}>
          <span>{item}</span>
          <input type="radio" checked={data.payment_plan === item} onChange={() => update('payment_plan', item)} className="accent-[#0c513f]" />
        </label>)}
      </div>
      {errors?.payment_plan && <p className="mt-1.5 text-right text-xs font-semibold text-red-600">{errors.payment_plan}</p>}
    </fieldset>
    <Money error={errors?.budget} label="سعر التعاقد المستهدف (الميزانية) *" value={data.budget} onChange={(value) => update('budget', value)} helper="أقصى سعر تعاقد مناسب لميزانيتك" />
    <TurnstileBox />
  </div> 
}

function StepTwo({ data, update, errors, areaInput, setAreaInput, showAreas, setShowAreas, addArea }: { data: FormState; update: <K extends keyof FormState>(key: K, value: FormState[K]) => void; errors?: Record<string, string>; areaInput: string; setAreaInput: (value: string) => void; showAreas: boolean; setShowAreas: (value: boolean) => void; addArea: (value?: string) => void }) { 
  const filtered = areas.filter((area) => area.includes(areaInput.trim())).slice(0, 8); 
  return <div className="flex flex-col gap-6">
    <fieldset>
      <legend className="mb-1 text-sm font-bold text-right"><RequiredLabel>نوع الوحدة اللي بتدوّر عليها *</RequiredLabel></legend>
      <p className="mb-3 text-xs text-slate-500 text-right">اختار نوع أو أكثر — بنرشح لك اللي يناسبك</p>
      <div className={`flex flex-wrap gap-2 ${errors?.unit_types ? 'rounded-xl border border-red-500 bg-red-50/20 p-2.5' : ''}`}>
        {unitTypes.map((item) => <button type="button" key={item} onClick={() => update('unit_types', data.unit_types.includes(item) ? data.unit_types.filter((type) => type !== item) : [...data.unit_types, item])} className={`rounded-xl border px-4 py-2 text-sm transition ${data.unit_types.includes(item) ? 'border-[#0c513f] bg-[#f0fdf9] font-bold text-[#0c513f]' : 'border-slate-200 bg-white hover:border-teal-500'}`}>{item}</button>)}
      </div>
      {errors?.unit_types && <p className="mt-1.5 text-right text-xs font-semibold text-red-600">{errors.unit_types}</p>}
    </fieldset>
    <div>
      <Label htmlFor="rooms" className="text-right block">أقل عدد غرف</Label>
      <Input id="rooms" type="number" min="0" value={data.min_rooms || ''} onChange={(event) => update('min_rooms', Number(event.target.value) || 0)} className="mt-2 h-12 w-full max-w-[150px] text-center text-lg" placeholder="غرفة" />
      <p className="mt-2 text-xs text-slate-500 text-right">سيبها فاضية لو مش فارقة معاك</p>
    </div>
    <fieldset>
      <legend className="mb-3 text-sm font-bold text-right"><RequiredLabel>الاستلام *</RequiredLabel></legend>
      <div className={`grid gap-2 ${errors?.delivery_status ? 'rounded-xl border border-red-500 bg-red-50/20 p-2.5' : ''}`}>
        {deliveryStatuses.map((item) => <label key={item} className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-sm transition ${data.delivery_status === item ? 'border-teal-600 bg-teal-50 font-bold text-teal-800' : 'border-slate-200 bg-white hover:border-teal-300'}`}>
          <span>{item}</span>
          <input type="radio" checked={data.delivery_status === item} onChange={() => update('delivery_status', item)} className="accent-[#0c513f]" />
        </label>)}
      </div>
      {errors?.delivery_status && <p className="mt-1.5 text-right text-xs font-semibold text-red-600">{errors.delivery_status}</p>}
    </fieldset>
    <div>
      <Label htmlFor="areas" className="text-right block"><RequiredLabel>المناطق أو الكمبوندات اللي تهمك *</RequiredLabel></Label>
      <div className={`relative mt-2 ${errors?.preferred_areas ? 'rounded-xl border border-red-500 bg-red-50/20 p-2.5' : ''}`}>
        {data.preferred_areas.length > 0 && <div className="mb-3 flex flex-wrap gap-2">
          {data.preferred_areas.map((area) => <span key={area} className="inline-flex items-center gap-1 rounded-full bg-[#0c513f] px-3 py-1 text-xs font-bold text-white">{area}
            <button type="button" aria-label={`إزالة ${area}`} onClick={() => update('preferred_areas', data.preferred_areas.filter((item) => item !== area))} className="mr-1 hover:text-red-300"><X className="size-3" /></button>
          </span>)}
        </div>}
        <Input id="areas" dir="rtl" value={areaInput} onFocus={() => setShowAreas(true)} onChange={(event) => { setAreaInput(event.target.value); setShowAreas(true) }} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); if (filtered[0]) addArea(filtered[0]) } }} placeholder={data.preferred_areas.length ? 'ضيف منطقة تانية...' : 'دوّر على المنطقة...'} className="h-12 rounded-xl text-right" />
        {showAreas && filtered.length > 0 && <div className="absolute z-10 mt-2 max-h-52 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
          {filtered.map((area) => <button type="button" key={area} onClick={() => addArea(area)} className="block w-full rounded-lg px-3 py-2 text-right text-sm hover:bg-emerald-50">{area}</button>)}
        </div>}
      </div>
      {errors?.preferred_areas && <p className="mt-1.5 text-right text-xs font-semibold text-red-600">{errors.preferred_areas}</p>}
      <p className="mt-2 text-xs text-slate-500 text-right">مثال: الشيخ زايد، أكتوبر، زايد الجديدة</p>
    </div>
    <TurnstileBox />
  </div> 
}

function StepThree({ data, update, errors, countryCode, setCountryCode, passwordVisible, setPasswordVisible }: { data: FormState; update: <K extends keyof FormState>(key: K, value: FormState[K]) => void; errors?: Record<string, string>; countryCode: string; setCountryCode: (value: string) => void; passwordVisible: boolean; setPasswordVisible: (value: boolean) => void }) { 
  return <div className="flex flex-col gap-5">
    <Text error={errors?.name} label="اسمك *" value={data.name} onChange={(value) => update('name', value)} />
    <div>
      <Label className="text-right block"><RequiredLabel>رقم موبايلك *</RequiredLabel></Label>
      <div dir="ltr" className="mt-2 flex items-center gap-2">
        <CountrySelector value={countryCode} onChange={setCountryCode} />
        <Input value={data.phone} onChange={(event) => update('phone', event.target.value)} inputMode="tel" dir="ltr" placeholder="01xx xxx xxxx" className={`h-12 flex-1 rounded-xl px-3 text-left ${errors?.phone ? 'border-red-500 bg-red-50/20' : 'border-slate-200'}`} />
      </div>
      {errors?.phone && <p className="mt-1.5 text-right text-xs font-semibold text-red-600">{errors.phone}</p>}
      <p className="mt-2 text-xs text-slate-500 text-right">هنكلمك عليه واتساب أو مكالمة — من غير إزعاج</p>
    </div>
    <Text error={errors?.email} label="إيميلك *" value={data.email} onChange={(value) => update('email', value)} type="email" />
    <div>
      <Label className="text-right block"><RequiredLabel>اختار كلمة سر لحسابك *</RequiredLabel></Label>
      <div className="relative mt-2">
        <Input value={data.password} onChange={(event) => update('password', event.target.value)} type={passwordVisible ? 'text' : 'password'} dir="ltr" className={`h-12 rounded-xl pl-4 pr-12 text-left ${errors?.password ? 'border-red-500 bg-red-50/20' : 'border-slate-200'}`} />
        <button type="button" onClick={() => setPasswordVisible(!passwordVisible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#0c513f]">
          {passwordVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {errors?.password && <p className="mt-1.5 text-right text-xs font-semibold text-red-600">{errors.password}</p>}
      <p className="mt-2 text-xs text-slate-500 text-right">8 حروف على الأقل — هتدخل بيها على حسابك بعد كده</p>
    </div>
    <p className="text-center text-xs leading-6 text-slate-500 font-bold mt-4">بإرسالك الطلب، انت بتأكد إنك المشتري نفسه مش وسيط.</p>
    <TurnstileBox />
  </div> 
}

function Text({ label, value, onChange, type = 'text', error }: { label: string; value: string; onChange: (value: string) => void; type?: string; error?: string }) { 
  const arabic = label === 'اسمك *'; 
  return <div>
    <Label className="text-right block"><RequiredLabel>{label}</RequiredLabel></Label>
    <Input value={value} onChange={(event) => onChange(event.target.value)} type={type} dir={arabic ? 'rtl' : 'ltr'} className={`mt-2 h-12 w-full rounded-xl ${error ? 'border-red-500 bg-red-50/20' : 'border-slate-200'} ${arabic ? 'text-right' : 'text-left'}`} />
    {error && <p className="mt-1.5 text-right text-xs font-semibold text-red-600">{error}</p>}
  </div> 
}