// 'use client'

// import { useState, useTransition } from 'react'
// import { submitInvestorLead } from '@/actions/submit-forms'
// import { Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
// import { Button } from '@/components/ui/button'
// import { Checkbox } from '@/components/ui/checkbox'
// import { Input } from '@/components/ui/input'
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select'
// import { Textarea } from '@/components/ui/textarea'
// import { CountrySelector } from '@/components/country-selector'
// import { TurnstileBox } from '@/components/auth-layout'
// import {
//   ALL_RESIDENCE_COUNTRIES,
//   SearchableCountryField,
// } from '@/components/seller/seller-shared'
// import { useTranslation } from '@/lib/i18n'
// import { trackFbEvent } from '@/components/facebook-pixel'

// type Answers = Record<string, string | boolean>

// function Field({
//   label,
//   children,
//   optional = false,
//   optionalText = 'اختياري',
//   dir,
// }: {
//   label: string
//   children: React.ReactNode
//   optional?: boolean
//   optionalText?: string
//   dir?: 'rtl' | 'ltr'
// }) {
//   return (
//     <label
//       dir={dir}
//       className="flex flex-col gap-2 text-start text-sm font-semibold text-[var(--brand-navy,#0a1122)]"
//     >
//       <span>
//         {label} {!optional && <b className="text-red-500">*</b>}{' '}
//         {optional && (
//           <small className="font-normal text-slate-400">
//             ({optionalText})
//           </small>
//         )}
//       </span>
//       {children}
//     </label>
//   )
// }

// function MultiChoice({
//   label,
//   selected,
//   onToggle,
// }: {
//   label: string
//   selected: boolean
//   onToggle: () => void
// }) {
//   return (
//     <button
//       type="button"
//       onClick={onToggle}
//       className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-colors ${
//         selected
//           ? 'border-[var(--brand-primary,#007a5a)] bg-[var(--brand-primary-light,#eaf8f2)] text-[var(--brand-primary,#007a5a)]'
//           : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
//       }`}
//     >
//       <span>{label}</span>
//       <span
//         className={`flex size-4 items-center justify-center rounded-sm border ${
//           selected
//             ? 'border-[var(--brand-primary,#007a5a)] bg-[var(--brand-primary,#007a5a)] text-white'
//             : 'border-slate-300'
//         }`}
//       >
//         {selected && <Check className="size-3" />}
//       </span>
//     </button>
//   )
// }

// export default function InvestorsPage() {
//   const { t: dict, dir } = useTranslation()
//   const t = dict.investorsPage
//   const f = dict.investorsPage.form

//   const [step, setStep] = useState(1)
//   const [answers, setAnswers] = useState<Answers>({ country: 'EG' })
//   const [phoneCode, setPhoneCode] = useState('20')
//   const [selectedSectors, setSelectedSectors] = useState<string[]>([])
//   const [selectedNeededInfo, setSelectedNeededInfo] = useState<string[]>([])
//   const [submitted, setSubmitted] = useState(false)
//   const [pending, startTransition] = useTransition()
//   const [error, setError] = useState('')

//   const update = (key: string, value: string | boolean) => {
//     setError('')
//     setAnswers((current) => ({ ...current, [key]: value }))
//   }

//   const toggleSector = (item: string) => {
//     setSelectedSectors((prev) =>
//       prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
//     )
//   }

//   const toggleNeededInfo = (item: string) => {
//     setSelectedNeededInfo((prev) =>
//       prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
//     )
//   }

//   const handleNextStep = () => {
//     setError('')
//     if (step === 1) {
//       if (
//         !String(answers.name || '').trim() ||
//         !String(answers.phone || '').trim() ||
//         !String(answers.email || '').trim() ||
//         !String(answers.investorType || '').trim()
//       ) {
//         setError(f.validationRequired)
//         return
//       }
//     }
//     if (step === 3) {
//       if (!String(answers.range || '').trim()) {
//         setError(f.validationRequired)
//         return
//       }
//     }
//     setStep((current) => Math.min(6, current + 1))
//   }

//   const submit = () => {
//     setError('')
//     if (!answers.agreement || !String(answers.signature || '').trim()) {
//       setError(f.validationAgree)
//       return
//     }

//     const rawPhone = String(answers.phone ?? '').trim().replace(/^0+/, '')
//     const fullPhone = rawPhone ? `+${phoneCode.replace('+', '')}${rawPhone}` : ''

//     const compiledNotes = [
//       answers.company ? `الشركة: ${answers.company}` : '',
//       answers.role ? `المسمى: ${answers.role}` : '',
//       answers.nationality ? `الجنسية: ${answers.nationality}` : '',
//       answers.linkedin ? `LinkedIn: ${answers.linkedin}` : '',
//       answers.experience ? `الخبرة: ${answers.experience}` : '',
//       answers.motivation ? `الدافع: ${answers.motivation}` : '',
//       answers.value ? `القيمة المضافة: ${answers.value}` : '',
//       answers.ownership ? `نسبة الملكية: ${answers.ownership}%` : '',
//       answers.vehicle ? `الطريقة: ${answers.vehicle}` : '',
//       selectedNeededInfo.length > 0
//         ? `معلومات مطلوبة: ${selectedNeededInfo.join('، ')}`
//         : '',
//       answers.questions ? `أسئلة: ${answers.questions}` : '',
//       answers.contactTime ? `موعد التواصل: ${answers.contactTime}` : '',
//     ]
//       .filter(Boolean)
//       .join(' | ')

//     const formData = new FormData()
//     formData.set('name', String(answers.name ?? ''))
//     formData.set('phone', fullPhone)
//     formData.set('email', String(answers.email ?? ''))
//     formData.set('company', String(answers.company ?? ''))
//     formData.set('country', String(answers.country ?? 'EG'))
//     formData.set('investor_type', String(answers.investorType ?? ''))
//     formData.set('years_experience', String(answers.years ?? ''))
//     formData.set('investment_range', String(answers.range ?? ''))
//     formData.set('exact_amount', String(answers.amount ?? '0'))
//     formData.set('preferred_structure', String(answers.structure ?? ''))
//     formData.set('holding_period', String(answers.holding ?? ''))
//     formData.set('participation_level', String(answers.participation ?? ''))
//     formData.set('target_roi', String(answers.return ?? ''))
//     formData.set('signature_name', String(answers.signature ?? ''))
//     formData.set('notes', compiledNotes)
//     selectedSectors.forEach((sec) => formData.append('sectors', sec))

//     startTransition(async () => {
//       const result = await submitInvestorLead(formData)
//       if (result.success) {
//         trackFbEvent('Lead', {
//           content_name: 'Investor Application',
//           content_category: String(answers.investorType ?? 'Investor'),
//           value: Number(answers.amount || 50000),
//           currency: 'USD',
//         })
//         setSubmitted(true)
//       } else {
//         setError(result.error ?? f.validationRequired)
//       }
//     })
//   }

//   const renderSelect = (
//     name: string,
//     options: string[],
//     placeholder = '—'
//   ) => (
//     <Select
//       value={String(answers[name] ?? '')}
//       onValueChange={(value) => update(name, value ?? '')}
//     >
//       <SelectTrigger className="h-11 w-full rounded-xl bg-white text-start">
//         <SelectValue placeholder={placeholder} />
//       </SelectTrigger>
//       <SelectContent>
//         {options.map((option) => (
//           <SelectItem key={option} value={option}>
//             {option}
//           </SelectItem>
//         ))}
//       </SelectContent>
//     </Select>
//   )

//   const renderTextarea = (name: string, placeholder = '') => (
//     <Textarea
//       value={String(answers[name] ?? '')}
//       onChange={(event) => update(name, event.target.value)}
//       placeholder={placeholder}
//       className="min-h-24 resize-y rounded-xl bg-white text-start"
//     />
//   )

//   const renderStepContent = () => {
//     if (step === 1) {
//       return (
//         <div className="flex flex-col gap-5">
//           <h3 className="border-b pb-3 text-start text-lg font-extrabold">
//             {f.s1Title}
//           </h3>
//           <Field label={f.s1Name} optionalText={f.optionalWord} dir={dir}>
//             <Input
//               value={String(answers.name ?? '')}
//               onChange={(e) => update('name', e.target.value)}
//               placeholder={f.s1NamePlaceholder}
//               className="h-11 rounded-xl text-start"
//             />
//           </Field>

//           <Field
//             label={f.s1Company}
//             optional
//             optionalText={f.optionalWord}
//             dir={dir}
//           >
//             <Input
//               value={String(answers.company ?? '')}
//               onChange={(e) => update('company', e.target.value)}
//               className="h-11 rounded-xl text-start"
//             />
//           </Field>

//           <SearchableCountryField
//             label={`${f.s1Country} *`}
//             value={String(answers.country || 'EG')}
//             options={ALL_RESIDENCE_COUNTRIES}
//             onChange={(code) => {
//               update('country', code)
//               const found = ALL_RESIDENCE_COUNTRIES.find((c) => c.code === code)
//               if (found?.phoneCode) setPhoneCode(found.phoneCode)
//             }}
//           />

//           <Field
//             label={f.s1Nationality}
//             optional
//             optionalText={f.optionalWord}
//             dir={dir}
//           >
//             <Input
//               value={String(answers.nationality ?? '')}
//               onChange={(e) => update('nationality', e.target.value)}
//               className="h-11 rounded-xl text-start"
//             />
//           </Field>

//           <Field label={f.s1Email} optionalText={f.optionalWord} dir={dir}>
//             <Input
//               type="email"
//               dir="ltr"
//               value={String(answers.email ?? '')}
//               onChange={(e) => update('email', e.target.value)}
//               placeholder="name@example.com"
//               className="h-11 rounded-xl text-left"
//             />
//           </Field>

//           <Field label={f.s1Phone} optionalText={f.optionalWord} dir={dir}>
//             <div dir="ltr" className="flex items-center gap-2">
//               <CountrySelector value={phoneCode} onChange={setPhoneCode} />
//               <Input
//                 type="tel"
//                 dir="ltr"
//                 value={String(answers.phone ?? '')}
//                 onChange={(e) => update('phone', e.target.value)}
//                 placeholder="10xxxxxxx"
//                 className="h-11 flex-1 rounded-xl text-left"
//               />
//             </div>
//           </Field>

//           <Field
//             label={f.s1Role}
//             optional
//             optionalText={f.optionalWord}
//             dir={dir}
//           >
//             <Input
//               value={String(answers.role ?? '')}
//               onChange={(e) => update('role', e.target.value)}
//               className="h-11 rounded-xl text-start"
//             />
//           </Field>

//           <Field
//             label={f.s1Linkedin}
//             optional
//             optionalText={f.optionalWord}
//             dir={dir}
//           >
//             <Input
//               dir="ltr"
//               value={String(answers.linkedin ?? '')}
//               onChange={(e) => update('linkedin', e.target.value)}
//               className="h-11 rounded-xl text-left"
//             />
//           </Field>

//           <Field label={f.s1Type} optionalText={f.optionalWord} dir={dir}>
//             {renderSelect('investorType', f.investorTypes, f.s1TypePlaceholder)}
//           </Field>
//         </div>
//       )
//     }

//     if (step === 2) {
//       return (
//         <div className="flex flex-col gap-5">
//           <h3 className="border-b pb-3 text-start text-lg font-extrabold">
//             {f.s2Title}
//           </h3>
//           <Field
//             label={f.s2ExpBio}
//             optional
//             optionalText={f.optionalWord}
//             dir={dir}
//           >
//             {renderTextarea('experience', f.s2ExpBioPlaceholder)}
//           </Field>
//           <Field label={f.s2Years} optionalText={f.optionalWord} dir={dir}>
//             <Input
//               value={String(answers.years ?? '')}
//               onChange={(e) => update('years', e.target.value)}
//               placeholder={f.s2YearsPlaceholder}
//               className="h-11 rounded-xl text-start"
//             />
//           </Field>
//           <Field label={f.s2Sectors} optionalText={f.optionalWord} dir={dir}>
//             <div className="grid grid-cols-2 gap-2">
//               {f.fieldsOfExp.map((item) => (
//                 <MultiChoice
//                   key={item}
//                   label={item}
//                   selected={selectedSectors.includes(item)}
//                   onToggle={() => toggleSector(item)}
//                 />
//               ))}
//             </div>
//           </Field>
//           <Field label={f.s2StartupQ} optionalText={f.optionalWord} dir={dir}>
//             {renderSelect('startup', f.yesNo)}
//           </Field>
//           <Field
//             label={f.s2Examples}
//             optional
//             optionalText={f.optionalWord}
//             dir={dir}
//           >
//             {renderTextarea('examples')}
//           </Field>
//           <Field
//             label={f.s2Motivation}
//             optional
//             optionalText={f.optionalWord}
//             dir={dir}
//           >
//             {renderTextarea('motivation')}
//           </Field>
//           <Field
//             label={f.s2Attraction}
//             optional
//             optionalText={f.optionalWord}
//             dir={dir}
//           >
//             {renderTextarea('attraction')}
//           </Field>
//           <Field
//             label={f.s2Opportunity}
//             optional
//             optionalText={f.optionalWord}
//             dir={dir}
//           >
//             {renderTextarea('opportunity')}
//           </Field>
//         </div>
//       )
//     }

//     if (step === 3) {
//       return (
//         <div className="flex flex-col gap-5">
//           <h3 className="border-b pb-3 text-start text-lg font-extrabold">
//             {f.s3Title}
//           </h3>
//           <Field
//             label={f.s3AddedValue}
//             optional
//             optionalText={f.optionalWord}
//             dir={dir}
//           >
//             {renderTextarea('value')}
//           </Field>
//           <Field label={f.s3Range} optionalText={f.optionalWord} dir={dir}>
//             {renderSelect('range', f.ranges, f.s3RangePlaceholder)}
//           </Field>
//           <Field
//             label={f.s3ExactUsd}
//             optional
//             optionalText={f.optionalWord}
//             dir={dir}
//           >
//             <Input
//               type="number"
//               dir="ltr"
//               value={String(answers.amount ?? '')}
//               onChange={(e) => update('amount', e.target.value)}
//               placeholder="100000"
//               className="h-11 rounded-xl text-left"
//             />
//           </Field>
//           <Field
//             label={f.s3LocalAmount}
//             optional
//             optionalText={f.optionalWord}
//             dir={dir}
//           >
//             <Input
//               value={String(answers.localAmount ?? '')}
//               onChange={(e) => update('localAmount', e.target.value)}
//               className="h-11 rounded-xl text-start"
//             />
//           </Field>
//           <Field label={f.s3Structure} optionalText={f.optionalWord} dir={dir}>
//             {renderSelect('structure', f.structures, f.s3StructurePlaceholder)}
//           </Field>
//           <Field
//             label={f.s3Ownership}
//             optional
//             optionalText={f.optionalWord}
//             dir={dir}
//           >
//             <Input
//               type="number"
//               dir="ltr"
//               value={String(answers.ownership ?? '')}
//               onChange={(e) => update('ownership', e.target.value)}
//               placeholder="%"
//               className="h-11 rounded-xl text-left"
//             />
//           </Field>
//           <Field
//             label={f.s3Vehicle}
//             optional
//             optionalText={f.optionalWord}
//             dir={dir}
//           >
//             {renderSelect('vehicle', f.vehicles)}
//           </Field>
//         </div>
//       )
//     }

//     if (step === 4) {
//       return (
//         <div className="flex flex-col gap-5">
//           <h3 className="border-b pb-3 text-start text-lg font-extrabold">
//             {f.s4Title}
//           </h3>
//           <Field label={f.s4Hold} optionalText={f.optionalWord} dir={dir}>
//             {renderSelect('holding', f.holdPeriods)}
//           </Field>
//           <Field
//             label={f.s4Participation}
//             optionalText={f.optionalWord}
//             dir={dir}
//           >
//             {renderSelect('participation', f.participation)}
//           </Field>
//           <Field label={f.s4StrategicQ} optionalText={f.optionalWord} dir={dir}>
//             {renderSelect('strategic', f.yesNo)}
//           </Field>
//           <Field
//             label={f.s4Questions}
//             optional
//             optionalText={f.optionalWord}
//             dir={dir}
//           >
//             {renderTextarea('questions')}
//           </Field>
//           <Field
//             label={f.s4NeededInfo}
//             optional
//             optionalText={f.optionalWord}
//             dir={dir}
//           >
//             <div className="grid grid-cols-2 gap-2">
//               {f.neededInfo.map((item) => (
//                 <MultiChoice
//                   key={item}
//                   label={item}
//                   selected={selectedNeededInfo.includes(item)}
//                   onToggle={() => toggleNeededInfo(item)}
//                 />
//               ))}
//             </div>
//           </Field>
//         </div>
//       )
//     }

//     if (step === 5) {
//       return (
//         <div className="flex flex-col gap-5">
//           <h3 className="border-b pb-3 text-start text-lg font-extrabold">
//             {f.s5Title}
//           </h3>
//           <Field label={f.s5Return} optionalText={f.optionalWord} dir={dir}>
//             {renderSelect('return', f.returns)}
//           </Field>
//           <Field
//             label={f.s5Importance}
//             optional
//             optionalText={f.optionalWord}
//             dir={dir}
//           >
//             {renderSelect('importance', f.importanceLevels)}
//           </Field>
//           <Field
//             label={f.s5Risk}
//             optional
//             optionalText={f.optionalWord}
//             dir={dir}
//           >
//             {renderTextarea('risk')}
//           </Field>
//           <Field
//             label={f.s5Confidence}
//             optional
//             optionalText={f.optionalWord}
//             dir={dir}
//           >
//             {renderTextarea('confidence')}
//           </Field>
//           <Field
//             label={f.s5NextStep}
//             optional
//             optionalText={f.optionalWord}
//             dir={dir}
//           >
//             {renderSelect('next', f.nextStepsList)}
//           </Field>
//           <Field
//             label={f.s5ContactTime}
//             optional
//             optionalText={f.optionalWord}
//             dir={dir}
//           >
//             <Input
//               value={String(answers.contactTime ?? '')}
//               onChange={(e) => update('contactTime', e.target.value)}
//               className="h-11 rounded-xl text-start"
//             />
//           </Field>
//         </div>
//       )
//     }

//     return (
//       <div className="flex flex-col gap-5">
//         <h3 className="border-b pb-3 text-start text-lg font-extrabold">
//           {f.s6Title}
//         </h3>
//         <div className="rounded-xl bg-slate-50 p-5 text-start text-sm leading-8 text-slate-600">
//           {f.s6Declaration}
//         </div>
//         <label
//           dir={dir}
//           className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4 text-start text-sm font-semibold"
//         >
//           <Checkbox
//             checked={Boolean(answers.agreement)}
//             onCheckedChange={(checked) => update('agreement', Boolean(checked))}
//           />
//           <span>{f.s6AgreeCheckbox}</span>
//         </label>
//         <Field
//           label={f.s6SignatureLabel}
//           optionalText={f.optionalWord}
//           dir={dir}
//         >
//           <Input
//             value={String(answers.signature ?? '')}
//             onChange={(e) => update('signature', e.target.value)}
//             placeholder={f.s6SignaturePlaceholder}
//             className="h-11 rounded-xl text-start"
//           />
//         </Field>
//         <p className="text-center text-xs text-slate-400">{f.s6AutoDateNote}</p>
//         <TurnstileBox />
//       </div>
//     )
//   }

//   return (
//     <div
//       dir={dir}
//       className="min-h-screen bg-[var(--brand-surface,#f5f6f8)] text-[var(--brand-navy,#0a1122)]"
//     >
//       <section className="bg-white px-5 py-16 text-center sm:py-20">
//         <span className="text-sm font-bold text-[var(--brand-primary,#007a5a)]">
//           {t.hero.eyebrow}
//         </span>
//         <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl md:text-5xl">
//           {t.hero.title}
//         </h1>
//         <p className="mx-auto mt-4 max-w-2xl text-sm leading-8 text-slate-500 sm:text-base">
//           {t.hero.subtitle}
//         </p>
//         <div className="mt-7 flex flex-wrap justify-center gap-3">
//           <Button
//             className="h-11 rounded-xl bg-[var(--brand-primary,#007a5a)] px-6 font-bold text-white hover:bg-[var(--brand-primary-hover,#006248)]"
//             onClick={() =>
//               document
//                 .getElementById('investor-form')
//                 ?.scrollIntoView({ behavior: 'smooth' })
//             }
//           >
//             {t.hero.ctaBtn}
//           </Button>
//           <span className="inline-flex items-center rounded-full bg-slate-100 px-5 py-2.5 text-xs font-semibold text-slate-600 sm:text-sm">
//             {t.hero.minTicketBadge}
//           </span>
//         </div>
//       </section>

//       <main className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.25fr_0.85fr] lg:px-8">
//         <aside className="order-2 flex flex-col gap-8 text-start">
//           <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
//             <h2 className="text-xl font-extrabold">{t.sidebar.whyTitle}</h2>
//             <ul className="mt-4 flex flex-col gap-3.5 text-sm leading-7 text-slate-600">
//               {t.sidebar.whyPoints.map((item) => (
//                 <li key={item} className="flex gap-3">
//                   <span className="mt-2.5 size-2 shrink-0 rounded-full bg-[var(--brand-primary,#007a5a)]" />
//                   <span>{item}</span>
//                 </li>
//               ))}
//             </ul>
//           </section>

//           <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
//             <h2 className="text-xl font-extrabold">{t.sidebar.processTitle}</h2>
//             <div className="mt-5 flex flex-col gap-5">
//               {t.sidebar.processSteps.map(([title, text], index) => (
//                 <div key={title} className="flex gap-4">
//                   <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-navy,#0a1122)] text-sm font-bold text-white">
//                     {index + 1}
//                   </span>
//                   <div>
//                     <h3 className="font-bold">{title}</h3>
//                     <p className="mt-1 text-xs leading-relaxed text-slate-500 sm:text-sm">
//                       {text}
//                     </p>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </section>

//           <p className="rounded-full border border-slate-200 bg-white px-5 py-3 text-center text-xs font-bold text-slate-500 sm:text-sm">
//             {t.sidebar.confidentialBadge}
//           </p>
//         </aside>

//         <section
//           id="investor-form"
//           className="order-1 rounded-2xl border border-slate-200/90 bg-white p-5 text-start shadow-sm sm:p-8"
//         >
//           {submitted ? (
//             <div className="py-12 text-center">
//               <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[var(--brand-primary-light,#eaf8f2)] text-2xl font-bold text-[var(--brand-primary,#007a5a)]">
//                 ✓
//               </div>
//               <h2 className="mt-4 text-2xl font-extrabold text-[var(--brand-navy,#0a1122)]">
//                 {f.successTitle}
//               </h2>
//               <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
//                 {f.successDesc}
//               </p>
//             </div>
//           ) : (
//             <>
//               <div className="flex items-center justify-between gap-2">
//                 <div>
//                   <h2 className="text-xl font-extrabold sm:text-2xl">
//                     {f.mainTitle}
//                   </h2>
//                   <p className="mt-1 text-xs text-slate-500 sm:text-sm">
//                     {f.mainSubtitle}
//                   </p>
//                 </div>
//                 <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold">
//                   {f.stepWord} {step} {f.ofWord} 6
//                 </span>
//               </div>

//               <div className="mt-5 flex gap-1.5">
//                 {f.steps.map((item, index) => (
//                   <span
//                     key={item}
//                     title={item}
//                     className={`h-1.5 flex-1 rounded-full ${
//                       index < step
//                         ? 'bg-[var(--brand-primary,#007a5a)]'
//                         : 'bg-slate-200'
//                     }`}
//                   />
//                 ))}
//               </div>

//               {error && (
//                 <div className="mt-5 rounded-xl bg-red-50 p-3 text-center text-xs font-bold text-red-600">
//                   {error}
//                 </div>
//               )}

//               <div className="mt-7">{renderStepContent()}</div>

//               <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-100 pt-6">
//                 <Button
//                   type="button"
//                   variant="outline"
//                   className="h-11 rounded-xl px-5 font-bold"
//                   onClick={() => setStep((current) => Math.max(1, current - 1))}
//                   disabled={step === 1 || pending}
//                 >
//                   <ChevronRight className="me-1 size-4 rtl:rotate-0 ltr:rotate-180" />
//                   {f.backBtn}
//                 </Button>

//                 {step < 6 ? (
//                   <Button
//                     type="button"
//                     className="h-11 rounded-xl bg-[var(--brand-navy,#0a1122)] px-6 font-bold text-white hover:bg-[var(--brand-navy-hover,#16223f)]"
//                     onClick={handleNextStep}
//                   >
//                     {f.nextBtn}
//                     <ChevronLeft className="ms-1 size-4 rtl:rotate-0 ltr:rotate-180" />
//                   </Button>
//                 ) : (
//                   <Button
//                     type="button"
//                     disabled={pending}
//                     onClick={submit}
//                     className="h-11 flex-1 rounded-xl bg-[var(--brand-primary,#007a5a)] px-6 font-bold text-white hover:bg-[var(--brand-primary-hover,#006248)]"
//                   >
//                     {pending ? (
//                       <span className="inline-flex items-center gap-2">
//                         <Loader2 className="size-4 animate-spin" />
//                         {f.submittingBtn}
//                       </span>
//                     ) : (
//                       f.submitBtn
//                     )}
//                   </Button>
//                 )}
//               </div>

//               <p className="mt-5 text-center text-xs text-slate-400">
//                 {f.privacyNote}
//               </p>
//             </>
//           )}
//         </section>
//       </main>
//     </div>
//   )
// }
