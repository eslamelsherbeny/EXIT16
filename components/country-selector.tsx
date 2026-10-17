'use client'

import { useId } from 'react'

const countries = [
  ['20', 'مصر'], ['966', 'السعودية'], ['971', 'الإمارات'], ['965', 'الكويت'],
  ['974', 'قطر'], ['973', 'البحرين'], ['968', 'عُمان'], ['354', 'آيسلندا'],
  ['251', 'إثيوبيا'], ['994', 'أذربيجان'], ['374', 'أرمينيا'], ['297', 'أروبا'],
  ['291', 'إريتريا'], ['34', 'إسبانيا'], ['61', 'أستراليا'], ['372', 'إستونيا'], ['972', 'إسرائيل'],
] as const

export function CountrySelector({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const id = useId()
  return <label htmlFor={id} className="sr-only">
    رمز الدولة
    <select id={id} value={value} onChange={(event) => onChange(event.target.value)} aria-label="رمز الدولة" className="not-sr-only h-12 w-32 rounded-xl border border-slate-200 bg-white px-2 text-sm">
      {countries.map(([code, name]) => <option key={code} value={code}>+{code} {name}</option>)}
    </select>
  </label>
}
