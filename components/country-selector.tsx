'use client'

import { useState } from 'react'

const popular = [['🇪🇬', 'مصر', '20'], ['🇸🇦', 'السعودية', '966'], ['🇦🇪', 'الإمارات', '971'], ['🇰🇼', 'الكويت', '965'], ['🇶🇦', 'قطر', '974'], ['🇧🇭', 'البحرين', '973'], ['🇴🇲', 'عُمان', '968']] as const
const all = [['🇮🇸', 'آيسلندا', '354'], ['🇪🇹', 'إثيوبيا', '251'], ['🇦🇿', 'أذربيجان', '994'], ['🇦🇲', 'أرمينيا', '374'], ['🇪🇸', 'إسبانيا', '34'], ['🇦🇺', 'أستراليا', '61'], ['🇩🇪', 'ألمانيا', '49'], ['🇺🇸', 'الولايات المتحدة', '1'], ['🇬🇧', 'المملكة المتحدة', '44'], ['🇫🇷', 'فرنسا', '33'], ['🇮🇹', 'إيطاليا', '39'], ['🇹🇷', 'تركيا', '90'], ['🇯🇴', 'الأردن', '962'], ['🇱🇧', 'لبنان', '961'], ['🇲🇦', 'المغرب', '212'], ['🇹🇳', 'تونس', '216'], ['🇩🇿', 'الجزائر', '213'], ['🇱🇾', 'ليبيا', '218'], ['🇸🇩', 'السودان', '249'], ['🇮🇶', 'العراق', '964']] as const

export function CountrySelector({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false)
  const selected = [...popular, ...all].find((country) => country[2] === value) ?? popular[0]
  const section = (title: string, items: readonly (readonly [string, string, string])[]) => <div><p className="px-3 py-2 text-xs font-bold text-slate-500">{title}</p>{items.map(([flag, name, code]) => <button type="button" key={code} onClick={() => { onChange(code); setOpen(false) }} className="flex w-full items-center gap-2 px-3 py-2 text-right text-sm hover:bg-emerald-50"><span>{flag}</span><span className="flex-1">{name}</span><span dir="ltr">+{code}</span></button>)}</div>
  return <div className="relative shrink-0"><button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm">{selected[0]} {selected[1]} <span dir="ltr">+{selected[2]}</span></button>{open && <div className="absolute right-0 top-14 z-50 max-h-64 w-64 overflow-y-auto rounded-xl border bg-white shadow-lg">{section('الأكثر استخدامًا', popular)}{section('كل الدول', all)}</div>}</div>
}
