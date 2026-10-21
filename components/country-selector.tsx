'use client'

import { useState } from 'react'
import { ALL_RESIDENCE_COUNTRIES } from '@/components/seller/seller-shared'
import { useTranslation } from '@/lib/i18n'

export function CountrySelector({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const { t: dict, locale, dir } = useTranslation()
  const c = dict.authPages.common

  const [open, setOpen] = useState(false)
  const cleanVal = value.replace('+', '')
  const selected =
    ALL_RESIDENCE_COUNTRIES.find((item) => item.phoneCode === cleanVal) ??
    ALL_RESIDENCE_COUNTRIES[0]

  const getCountryName = (item: (typeof ALL_RESIDENCE_COUNTRIES)[0]) =>
    locale === 'ar' ? item.nameAr : item.nameEn

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex h-11 w-[132px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-[var(--brand-navy,#0a1122)]"
      >
        <span>{selected.flag}</span>
        <span className="truncate">{getCountryName(selected)}</span>
        <span dir="ltr">+{selected.phoneCode}</span>
      </button>

      {open && (
        <div
          dir={dir}
          className="absolute top-12 left-0 z-30 max-h-64 w-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 text-start shadow-xl"
        >
          <p className="px-3 py-2 text-xs font-black text-slate-500">
            {c.popularCountriesHeader}
          </p>
          {ALL_RESIDENCE_COUNTRIES.map((item) => (
            <button
              type="button"
              key={item.code}
              onClick={() => {
                onChange(item.phoneCode)
                setOpen(false)
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm hover:bg-[var(--brand-primary-light,#eaf8f2)]"
            >
              <span>{item.flag}</span>
              <span className="flex-1 font-medium text-[var(--brand-navy,#0a1122)]">
                {getCountryName(item)}
              </span>
              <span dir="ltr" className="text-xs text-slate-500">
                +{item.phoneCode}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
