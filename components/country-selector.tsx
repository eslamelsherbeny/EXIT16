'use client'

import { useState } from 'react'

const popular = [['20', 'مصر', '🇪🇬'], ['966', 'السعودية', '🇸🇦'], ['971', 'الإمارات', '🇦🇪'], ['965', 'الكويت', '🇰🇼'], ['974', 'قطر', '🇶🇦'], ['973', 'البحرين', '🇧🇭'], ['968', 'عُمان', '🇴🇲']] as const
const allCountries = [['354', 'آيسلندا', '🇮🇸'], ['251', 'إثيوبيا', '🇪🇹'], ['994', 'أذربيجان', '🇦🇿'], ['374', 'أرمينيا', '🇦🇲'], ['34', 'إسبانيا', '🇪🇸'], ['61', 'أستراليا', '🇦🇺'], ['49', 'ألمانيا', '🇩🇪'], ['1', 'الولايات المتحدة', '🇺🇸'], ['44', 'المملكة المتحدة', '🇬🇧'], ['33', 'فرنسا', '🇫🇷'], ['39', 'إيطاليا', '🇮🇹'], ['90', 'تركيا', '🇹🇷'], ['962', 'الأردن', '🇯🇴'], ['961', 'لبنان', '🇱🇧'], ['212', 'المغرب', '🇲🇦'], ['216', 'تونس', '🇹🇳'], ['213', 'الجزائر', '🇩🇿'], ['218', 'ليبيا', '🇱🇾'], ['249', 'السودان', '🇸🇩'], ['964', 'العراق', '🇮🇶']] as const
const countries = [...popular, ...allCountries]

export function CountrySelector({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false)
  const selected = countries.find(([code]) => code === value) ?? popular[0]
  const render = (items: readonly (readonly [string, string, string])[]) => items.map(([code, name, flag]) => <button type="button" key={code} onClick={() => { onChange(code); setOpen(false) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-right text-sm hover:bg-emerald-50"><span>{flag}</span><span className="flex-1">{name}</span><span dir="ltr" className="text-slate-500">+{code}</span></button>)
  return <div className="relative shrink-0"><button type="button" aria-expanded={open} onClick={() => setOpen((current) => !current)} className="flex h-11 w-[132px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 text-xs"><span>{selected[2]}</span><span className="truncate">{selected[1]}</span><span dir="ltr">+{selected[0]}</span></button>{open && <div className="absolute left-0 top-12 z-30 max-h-64 w-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 text-right shadow-xl"><p className="px-3 py-2 text-xs font-black text-slate-500">الأكثر استخدامًا</p>{render(popular)}<p className="mt-2 border-t px-3 py-2 text-xs font-black text-slate-500">كل الدول</p>{render(allCountries)}</div>}</div>
}
