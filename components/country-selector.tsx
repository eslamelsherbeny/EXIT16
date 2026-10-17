'use client'

import { useState } from 'react'

const popular = [['20', 'مصر', '🇪🇬'], ['966', 'السعودية', '🇸🇦'], ['971', 'الإمارات', '🇦🇪'], ['965', 'الكويت', '🇰🇼'], ['974', 'قطر', '🇶🇦'], ['973', 'البحرين', '🇧🇭'], ['968', 'عُمان', '🇴🇲']] as const
const allCountries = [['354', 'آيسلندا', '🇮🇸'], ['251', 'إثيوبيا', '🇪🇹'], ['994', 'أذربيجان', '🇦🇿'], ['374', 'أرمينيا', '🇦🇲'], ['34', 'إسبانيا', '🇪🇸'], ['61', 'أستراليا', '🇦🇺'], ['49', 'ألمانيا', '🇩🇪'], ['1', 'الولايات المتحدة', '🇺🇸'], ['44', 'المملكة المتحدة', '🇬🇧'], ['33', 'فرنسا', '🇫🇷'], ['39', 'إيطاليا', '🇮🇹'], ['90', 'تركيا', '🇹🇷'], ['962', 'الأردن', '🇯🇴'], ['961', 'لبنان', '🇱🇧'], ['212', 'المغرب', '🇲🇦'], ['216', 'تونس', '🇹🇳'], ['213', 'الجزائر', '🇩🇿'], ['218', 'ليبيا', '🇱🇾'], ['249', 'السودان', '🇸🇩'], ['964', 'العراق', '🇮🇶']] as const

export function CountrySelector({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false)
  const selected = [...popular, ...allCountries].find(([code]) => code === value) ?? popular[0]
  const renderGroup = (title: string, countries: readonly (readonly [string, string, string])[]) => <div><p className="px-3 py-2 text-xs font-bold text-slate-500">{title}</p>{countries.map(([code, name, flag]) => <button type="button" key={code} onClick={() => { onChange(code); setOpen(false) }} className="flex w-full items-center gap-2 px-3 py-2 text-right text-sm hover:bg-teal-50"><span>{flag}</span><span className="flex-1">{name}</span><span dir="ltr" className="text-slate-500">+{code}</span></button>)}</div>
  return <div className="relative shrink-0"><button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex h-12 min-w-[150px] items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm"><span>{selected[2]} {selected[1]}</span><span dir="ltr">+{selected[0]}</span></button>{open && <div className="absolute left-0 top-14 z-50 max-h-64 w-64 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl">{renderGroup('الأكثر استخدامًا', popular)}{renderGroup('كل الدول', allCountries)}</div>}</div>
}
