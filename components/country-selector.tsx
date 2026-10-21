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
        className="flex h-11 w-[126px] items-center justify-between gap-1 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-[var(--brand-navy,#0a1122)] sm:w-[134px]"
      >
        <span>{selected.flag}</span>
        <span className="truncate">{getCountryName(selected)}</span>
        <span dir="ltr">+{selected.phoneCode}</span>
      </button>

      {open && (
        <div
          dir={dir}
          className="absolute top-12 left-0 z-40 max-h-60 w-60 max-w-[calc(100vw-2.5rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 text-start shadow-xl"
        >
          <p className="px-2.5 py-1.5 text-[11px] font-black text-slate-400">
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
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-start text-xs hover:bg-[var(--brand-primary-light,#eaf8f2)] sm:text-sm"
            >
              <span>{item.flag}</span>
              <span className="flex-1 truncate font-medium text-[var(--brand-navy,#0a1122)]">
                {getCountryName(item)}
              </span>
              <span dir="ltr" className="text-[11px] font-bold text-slate-500">
                +{item.phoneCode}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
