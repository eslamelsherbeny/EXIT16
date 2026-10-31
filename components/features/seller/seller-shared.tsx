'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GeorgiaAreaSelect } from '@/components/shared/georgia-areas'
import { useTranslation } from '@/lib/i18n'
import {
  formatAmount,
  getLocalizedCountryName,
  getLocalizedMonthsList,
  normalizeArabicText,
  PLATFORM_COUNTRIES,
  toEnglishDigits,
  years,
  type PlatformCountryOption,
} from './seller-options-data'

export * from './seller-options-data'
export * from './seller-location-modal'

export function RequiredLabel({ children }: { children: string }) {
  const required = children.endsWith(' *')
  return (
    <>
      {required ? (
        <>
          {children.slice(0, -2)} <span className="ms-1 text-red-500">*</span>
        </>
      ) : (
        children
      )}
    </>
  )
}

export function SearchableGeorgiaAreaPicker({
  label,
  value,
  onChange,
  error,
  placeholder,
}: {
  label: string
  value: string
  onChange: (area: string) => void
  error?: string
  placeholder?: string
}) {
  return (
    <GeorgiaAreaSelect
      label={label}
      value={value}
      onChange={onChange}
      error={error}
      placeholder={placeholder}
    />
  )
}

export function MonthYearSelector({
  label,
  monthValue,
  yearValue,
  onMonthChange,
  onYearChange,
  yearsList = years,
  error,
  helper,
}: {
  label: string
  monthValue: string
  yearValue: string
  onMonthChange: (m: string) => void
  onYearChange: (y: string) => void
  yearsList?: string[]
  error?: string
  helper?: string
}) {
  const { locale } = useTranslation()
  const monthsOptions = getLocalizedMonthsList(locale)

  const monthPlaceholder =
    locale === 'ar'
      ? 'الشهر *'
      : locale === 'ru'
        ? 'Месяц *'
        : locale === 'ka'
          ? 'თვე *'
          : 'Month *'

  const yearPlaceholder =
    locale === 'ar'
      ? 'السنة *'
      : locale === 'ru'
        ? 'Год *'
        : locale === 'ka'
          ? 'წელი *'
          : 'Year *'

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-start">
        <RequiredLabel>{label}</RequiredLabel>
      </Label>
      <div
        className={`grid grid-cols-2 gap-3 ${
          error ? 'rounded-xl border border-red-500 bg-red-50/20 p-2' : ''
        }`}
      >
        <div className="relative">
          <select
            value={monthValue || ''}
            onChange={(e) => onMonthChange(e.target.value)}
            className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-[#0a1122] focus:border-[#2563eb] focus:outline-none sm:text-sm"
          >
            <option value="">{monthPlaceholder}</option>
            {monthsOptions.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 end-3 size-4 -translate-y-1/2 text-slate-400" />
        </div>

        <div className="relative">
          <select
            value={yearValue || ''}
            onChange={(e) => onYearChange(e.target.value)}
            className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-[#0a1122] focus:border-[#2563eb] focus:outline-none sm:text-sm"
          >
            <option value="">{yearPlaceholder}</option>
            {yearsList.map((yr: string) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 end-3 size-4 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      {error && (
        <p className="mt-1 text-start text-xs font-semibold text-red-600">
          {error}
        </p>
      )}
      {helper && (
        <span className="text-start text-xs font-semibold text-teal-700">
          {helper}
        </span>
      )}
    </div>
  )
}

export function SearchableCountryField({
  label,
  value,
  onChange,
  options = PLATFORM_COUNTRIES,
  helper,
  error,
}: {
  label?: string
  value?: string
  onChange: (countryCode: string) => void
  options?: PlatformCountryOption[]
  helper?: string
  error?: string
}) {
  const { t: dict, locale, dir } = useTranslation()
  const t = dict.sell.shared
  const resolvedLabel = label || t.countryLabel

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)

  const selectedObj =
    options.find((c) => c.code === (value || 'GE').toUpperCase()) || options[0]

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const filteredOptions = options.filter((c) => {
    const q = normalizeArabicText(query)
    if (!q) return true
    return (
      normalizeArabicText(c.nameAr).includes(q) ||
      c.nameEn.toLowerCase().includes(q) ||
      (c.nameRu && c.nameRu.toLowerCase().includes(q)) ||
      (c.nameKa && c.nameKa.toLowerCase().includes(q)) ||
      c.code.toLowerCase().includes(q)
    )
  })

  const displayCountryName = getLocalizedCountryName(selectedObj, locale)

  return (
    <div ref={wrapperRef} className="relative flex flex-col gap-2">
      <Label className="text-start">
        <RequiredLabel>{resolvedLabel}</RequiredLabel>
      </Label>

      <div className="relative">
        <Input
          type="text"
          dir={dir}
          value={
            open
              ? query
              : `${selectedObj.flag}  ${displayCountryName} (${selectedObj.code})`
          }
          placeholder={t.countryPlaceholder}
          onFocus={() => {
            setOpen(true)
            setQuery('')
          }}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          className={`h-12 cursor-pointer rounded-xl px-4 text-start font-bold text-[#0a1122] ${
            error ? 'border-red-500 bg-red-50/20' : 'border-slate-200 bg-white'
          }`}
        />
        <button
          type="button"
          onClick={() => {
            setOpen(!open)
            setQuery('')
          }}
          className="absolute top-1/2 end-3 -translate-y-1/2 text-slate-400"
        >
          <ChevronDown className="size-4" />
        </button>
      </div>

      {open && (
        <div className="absolute top-[78px] z-30 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
          {filteredOptions.length === 0 ? (
            <p className="py-3 text-center text-xs text-slate-400">
              {t.noCountryMatch}
            </p>
          ) : (
            filteredOptions.map((c) => {
              const isSelected = c.code === selectedObj.code
              const cName = getLocalizedCountryName(c, locale)
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    onChange(c.code)
                    setOpen(false)
                    setQuery('')
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3.5 py-2.5 text-start text-sm transition ${
                    isSelected
                      ? 'bg-emerald-50 font-bold text-[#007a5a]'
                      : 'text-[#0a1122] hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg leading-none">{c.flag}</span>
                    <span>{cName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-400">
                      {c.code}
                    </span>
                    {isSelected && <Check className="size-4 text-[#007a5a]" />}
                  </div>
                </button>
              )
            })
          )}
        </div>
      )}

      {error && (
        <p className="mt-1 text-start text-xs font-semibold text-red-600">
          {error}
        </p>
      )}
      {helper && (
        <span className="flex items-center gap-1 text-start text-xs font-semibold text-teal-700">
          <Globe className="size-3.5 shrink-0" />
          <span>{helper}</span>
        </span>
      )}
    </div>
  )
}

export function Field({
  label,
  id,
  type = 'text',
  helper,
  placeholder,
  value,
  update,
  error,
}: {
  label: string
  id: string
  type?: string
  helper?: string
  placeholder?: string
  value?: string
  update: (value: string) => void
  error?: string
}) {
  const { dir } = useTranslation()
  const compact = [
    'areaSize',
    'kitchenArea',
    'balconyArea',
    'loggiaArea',
    'terraceArea',
    'yearBuilt',
    'garden',
    'rooms',
    'bedrooms',
    'bathrooms',
    'floor',
    'totalFloors',
    'maxGuests',
    'remainingYears',
    'remainingMonths',
    'deliveryRemainingMonths',
    'overdueCount',
  ].includes(id)
  const isNumericField = compact || type === 'number'
  const isLtrField =
    isNumericField ||
    id === 'email' ||
    id === 'password' ||
    id === 'cadastralCode' ||
    id === 'phone'

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-start">
        <RequiredLabel>{label}</RequiredLabel>
      </Label>
      <Input
        id={id}
        name={id}
        type={isNumericField ? 'text' : type}
        inputMode={isNumericField ? 'numeric' : undefined}
        dir={isLtrField ? 'ltr' : dir}
        placeholder={placeholder}
        value={value ?? ''}
        onChange={(event) => {
          const rawVal = event.target.value
          if (isNumericField) {
            const normalized = toEnglishDigits(rawVal).replace(/[^0-9.]/g, '')
            update(normalized)
          } else {
            update(rawVal)
          }
        }}
        className={`h-12 rounded-xl ${
          error ? 'border-red-500 bg-red-50/20' : 'border-slate-200'
        } ${
          compact
            ? 'font-semibold'
            : isLtrField
              ? 'text-left'
              : 'text-start'
        }`}
      />
      {error && (
        <p className="mt-1.5 text-start text-xs font-semibold text-red-600">
          {error}
        </p>
      )}
      {helper && (
        <span className="text-start text-xs font-semibold leading-6 text-slate-400">
          {helper}
        </span>
      )}
    </div>
  )
}

export function MoneyField({
  label,
  value,
  update,
  helper,
  error,
  currencySymbol,
}: {
  label: string
  value?: string
  update: (value: string) => void
  helper?: string
  error?: string
  currencySymbol?: string
}) {
  const { locale, currency: defaultCurrency } = useTranslation()
  const activeCurr = currencySymbol || defaultCurrency || '$'
  const cleanDigits = toEnglishDigits(value || '').replace(/[^0-9]/g, '')

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <Label className="text-start">
          <RequiredLabel>{label}</RequiredLabel>
        </Label>
      )}
      <div className="relative">
        <Input
          type="text"
          inputMode="numeric"
          dir="ltr"
          placeholder="0"
          value={
            cleanDigits ? Number(cleanDigits).toLocaleString('en-US') : ''
          }
          onChange={(event) => {
            const normalized = toEnglishDigits(event.target.value).replace(
              /[^0-9]/g,
              ''
            )
            update(normalized)
          }}
          className={`h-12 rounded-xl pr-14 pl-4 text-left font-bold ${
            error ? 'border-red-500 bg-red-50/20' : 'border-slate-200'
          }`}
        />
        <span className="pointer-events-none absolute top-3 right-3 text-sm font-semibold text-slate-500">
          {activeCurr}
        </span>
      </div>
      {error && (
        <p className="mt-1.5 text-start text-xs font-semibold text-red-600">
          {error}
        </p>
      )}
      {(formatAmount(cleanDigits, activeCurr, locale) || helper) && (
        <span className="text-start text-xs font-semibold leading-6 text-teal-700">
          {formatAmount(cleanDigits, activeCurr, locale) || helper || ''}
        </span>
      )}
    </div>
  )
}

export function Pills({
  items,
  selected,
  onToggle,
  multi = false,
  error,
}: {
  items: string[]
  selected: string[]
  onToggle: (value: string) => void
  multi?: boolean
  error?: string
}) {
  return (
    <div
      className={
        error ? 'rounded-xl border border-red-500 bg-red-50/20 p-2.5' : ''
      }
    >
      <div className="flex flex-wrap gap-2">
        {items.map((item: string) => (
          <button
            type="button"
            key={item}
            onClick={() => onToggle(item)}
            className={`rounded-xl border px-4 py-2 text-sm transition ${
              selected.includes(item)
                ? 'border-[#007a5a] bg-[#eaf8f2] font-bold text-[#007a5a]'
                : 'border-slate-200 bg-white hover:border-teal-500'
            }`}
          >
            {multi && selected.includes(item) && '✓ '}
            {item}
          </button>
        ))}
      </div>
      {error && (
        <p className="mt-1.5 text-start text-xs font-semibold text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}

export function ToggleSection({
  title,
  group,
  selected,
  toggle,
  error,
}: {
  title: string
  group: string
  selected: Record<string, string[]>
  toggle: (group: string, value: string) => void
  error?: string
}) {
  const { t: dict } = useTranslation()
  const t = dict.sell.shared
  const active = selected[group]?.[0]

  return (
    <section
      className={`rounded-2xl border p-5 ${
        error
          ? 'border-red-500 bg-red-50/20'
          : 'border-slate-200 bg-slate-50'
      }`}
    >
      <h3 className="mb-3 text-start font-bold">{title}</h3>
      <div className="flex justify-start gap-2">
        <Button
          type="button"
          variant={active === 'yes' ? 'default' : 'outline'}
          className={`min-w-[80px] rounded-xl border px-5 py-2 text-sm font-semibold ${
            active === 'yes' ? 'bg-[#0a1122] text-white' : ''
          }`}
          onClick={() => toggle(group, 'yes')}
        >
          {t.yes}
        </Button>
        <Button
          type="button"
          variant={active === 'no' ? 'default' : 'outline'}
          className={`min-w-[80px] rounded-xl border px-5 py-2 text-sm font-semibold ${
            active === 'no' ? 'bg-[#0a1122] text-white' : ''
          }`}
          onClick={() => toggle(group, 'no')}
        >
          {t.no}
        </Button>
      </div>
      {error && (
        <p className="mt-2.5 text-start text-xs font-semibold text-red-600">
          {error}
        </p>
      )}
    </section>
  )
}

export function Actions({
  go,
  next,
  back = true,
  label,
}: {
  go: (step: number) => void
  next: number
  back?: boolean
  label?: string
}) {
  const { t: dict, dir } = useTranslation()
  const t = dict.sell.shared
  const btnLabel = label || t.nextBtn

  return (
    <div dir={dir} className="mt-5 flex gap-3">
      {back && (
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-xl"
          onClick={() => go(next - 2)}
        >
          {t.backBtn}
        </Button>
      )}
      <Button
        type="button"
        className={`h-12 rounded-xl bg-[#0a1122] hover:bg-[#16223f] ${
          !back ? 'w-full' : 'flex-1'
        }`}
        onClick={() => go(next)}
      >
        {btnLabel}
      </Button>
    </div>
  )
}