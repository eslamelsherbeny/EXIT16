'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DICTIONARIES,
  getCurrencySymbol,
  useTranslation,
  type LocaleCode,
} from '@/lib/i18n'

export type PlatformCountryCode = 'EG' | 'RU' | 'GE' | 'AE'

export type PlatformCountryOption = {
  code: PlatformCountryCode | string
  nameAr: string
  nameEn: string
  nameRu?: string
  nameKa?: string
  flag: string
  currencySymbol: string
  phoneCode: string
  defaultPackages?: {
    days7: number
    days14: number
    days30: number
  }
}

export const PLATFORM_COUNTRIES: PlatformCountryOption[] = [
  {
    code: 'EG',
    nameAr: 'مصر',
    nameEn: 'Egypt',
    nameRu: 'Египет',
    nameKa: 'ეგვიპტე',
    flag: '🇪🇬',
    currencySymbol: 'ج.م',
    phoneCode: '20',
    defaultPackages: { days7: 1199, days14: 1999, days30: 2799 },
  },
  {
    code: 'RU',
    nameAr: 'روسيا',
    nameEn: 'Russia',
    nameRu: 'Россия',
    nameKa: 'რუსეთი',
    flag: '🇷🇺',
    currencySymbol: '₽',
    phoneCode: '7',
    defaultPackages: { days7: 2500, days14: 4200, days30: 5900 },
  },
  {
    code: 'GE',
    nameAr: 'جورجيا',
    nameEn: 'Georgia',
    nameRu: 'Грузия',
    nameKa: 'საქართველო',
    flag: '🇬🇪',
    currencySymbol: '$',
    phoneCode: '995',
    defaultPackages: { days7: 29, days14: 49, days30: 69 },
  },
  {
    code: 'AE',
    nameAr: 'الإمارات',
    nameEn: 'UAE',
    nameRu: 'ОАЭ',
    nameKa: 'საამიროები',
    flag: '🇦🇪',
    currencySymbol: 'د.إ',
    phoneCode: '971',
    defaultPackages: { days7: 99, days14: 179, days30: 249 },
  },
]

export const ALL_RESIDENCE_COUNTRIES: PlatformCountryOption[] = [
  ...PLATFORM_COUNTRIES,
  {
    code: 'SA',
    nameAr: 'السعودية',
    nameEn: 'Saudi Arabia',
    flag: '🇸🇦',
    currencySymbol: 'ر.س',
    phoneCode: '966',
  },
  {
    code: 'KW',
    nameAr: 'الكويت',
    nameEn: 'Kuwait',
    flag: '🇰🇼',
    currencySymbol: 'د.ك',
    phoneCode: '965',
  },
  {
    code: 'QA',
    nameAr: 'قطر',
    nameEn: 'Qatar',
    flag: '🇶🇦',
    currencySymbol: 'ر.ق',
    phoneCode: '974',
  },
  {
    code: 'BH',
    nameAr: 'البحرين',
    nameEn: 'Bahrain',
    flag: '🇧🇭',
    currencySymbol: 'د.ب',
    phoneCode: '973',
  },
  {
    code: 'OM',
    nameAr: 'عمان',
    nameEn: 'Oman',
    flag: '🇴🇲',
    currencySymbol: 'ر.ع',
    phoneCode: '968',
  },
  {
    code: 'JO',
    nameAr: 'الأردن',
    nameEn: 'Jordan',
    flag: '🇯🇴',
    currencySymbol: 'د.أ',
    phoneCode: '962',
  },
  {
    code: 'US',
    nameAr: 'أمريكا / كندا',
    nameEn: 'USA / Canada',
    flag: '🇺🇸',
    currencySymbol: '$',
    phoneCode: '1',
  },
  {
    code: 'GB',
    nameAr: 'بريطانيا',
    nameEn: 'UK',
    flag: '🇬🇧',
    currencySymbol: '£',
    phoneCode: '44',
  },
]

export function getLocalizedCountryName(
  country: PlatformCountryOption,
  locale: LocaleCode = 'ar'
): string {
  if (locale === 'ar') return country.nameAr
  if (locale === 'ru') return country.nameRu || country.nameEn
  if (locale === 'ka') return country.nameKa || country.nameEn
  return country.nameEn
}

export function normalizeArabicText(str: string) {
  return (str || '')
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
}

export function getHeaderCookieCountry(): PlatformCountryCode {
  if (typeof document !== 'undefined') {
    const match = document.cookie
      .split('; ')
      .find((row) => row.startsWith('darak_country='))
    const code = match?.split('=')[1]?.trim() as PlatformCountryCode | undefined
    if (code && PLATFORM_COUNTRIES.some((c) => c.code === code)) {
      return code
    }
  }
  return 'EG'
}

export function getCountryConfig(countryCode?: string): PlatformCountryOption {
  return (
    PLATFORM_COUNTRIES.find(
      (c) => c.code === (countryCode || 'EG').toUpperCase()
    ) || PLATFORM_COUNTRIES[0]
  )
}

export function getCurrencyByCountry(
  countryCode?: string,
  locale?: LocaleCode
) {
  return getCurrencySymbol(countryCode || 'EG', locale)
}

export const unitTypes = [
  'شقة',
  'دوبلكس',
  'بنتهاوس',
  'تاون هاوس',
  'توين هاوس',
  'اي فيلا',
  'فيلا',
  'شاليه',
  'مكتب',
  'محل',
  'عيادة',
  'أرض',
]

export const finishings = [
  'تشطيب كامل',
  'نص تشطيب',
  'على الطوب',
  'متشطبة بالفرش',
]
export const deliveries = ['جاهزة للاستلام', 'تحت الإنشاء']
export const features = [
  'حمام سباحة',
  'جاردن خاصة',
  'رووف',
  'أمن 24 ساعة',
  'كلوب هاوس',
  'جراج',
  'مصعد',
  'قريبة من الخدمات',
]
export const years = [
  '2026',
  '2025',
  '2024',
  '2023',
  '2022',
  '2021',
  '2020',
  '2019',
]

export const areasCatalogByCountry: Record<
  string,
  ReadonlyArray<readonly [string, ReadonlyArray<string>]>
> = {
  EG: [
    [
      'القاهرة الجديدة والتجمع',
      [
        'التجمع الخامس',
        'التجمع الأول',
        'التجمع الثالث',
        'القاهرة الجديدة',
        'الرحاب',
        'مدينتي',
        'المستقبل سيتي',
        'الشروق',
      ],
    ],
    [
      'الشيخ زايد وأكتوبر',
      ['الشيخ زايد', 'زايد الجديدة', '6 أكتوبر', 'حدائق أكتوبر'],
    ],
    [
      'العاصمة والساحل وأخرى',
      [
        'العاصمة الإدارية',
        'الساحل الشمالي',
        'العين السخنة',
        'رأس الحكمة',
        'الجونة',
        'منطقتي مش في القائمة',
      ],
    ],
  ],
  AE: [
    [
      'دبي',
      [
        'داون تاون دبي',
        'دبي مارينا',
        'بيزنس باي',
        'نخلة جميرا',
        'قرية جميرا الدائرية JVC',
        'دبي هيلز',
      ],
    ],
    [
      'أبوظبي والشارقة',
      [
        'جزيرة ياس',
        'جزيرة السعديات',
        'جزيرة الريم',
        'الشارقة - الجادة',
        'منطقتي مش في القائمة',
      ],
    ],
  ],
  RU: [
    [
      'موسكو وسانت بطرسبرغ',
      [
        'وسط موسكو',
        'موسكو سيتي',
        'سانت بطرسبرغ',
        'سوتشي',
        'كازان',
        'منطقة أخرى',
      ],
    ],
  ],
  GE: [
    [
      'تبليسي وباتومي',
      [
        'تبليسي - سابورتالو',
        'تبليسي - فاكي',
        'باتومي - البوليفارد الجديد',
        'باتومي - وسط المدينة',
        'كوتايسي',
        'منطقتي مش في القائمة',
      ],
    ],
  ],
}

export const areasCatalog = areasCatalogByCountry.EG

export function formatAmount(
  value?: string,
  currencySymbol = 'ج.م',
  locale: LocaleCode = 'ar'
) {
  const amount = Number((value ?? '').replace(/,/g, ''))
  if (!amount) return ''
  const sharedDict = DICTIONARIES[locale]?.sell?.shared || DICTIONARIES.ar.sell.shared
  if (amount >= 1_000_000)
    return `${(amount / 1_000_000).toFixed(2).replace(/\.00$/, '')} ${sharedDict.million} ${currencySymbol}`
  if (amount >= 1_000)
    return `${Math.round(amount / 1_000)} ${sharedDict.thousand} ${currencySymbol}`
  return `${amount.toLocaleString('en-US')} ${currencySymbol}`
}

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
    options.find((c) => c.code === (value || 'EG').toUpperCase()) || options[0]

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
          className={`h-12 cursor-pointer rounded-xl px-4 text-start font-bold text-[var(--brand-navy,#0a1122)] ${
            error ? 'border-red-500 bg-red-50/20' : 'border-slate-200 bg-white'
          }`}
        />
        <button
          type="button"
          onClick={() => {
            setOpen(!open)
            setQuery('')
          }}
          className="absolute top-1/2 end-3 -translate-y-1/2 text-slate-400 hover:text-[var(--brand-primary,#007a5a)]"
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
                      ? 'bg-[var(--brand-primary-light,#eaf8f2)] font-bold text-[var(--brand-primary,#007a5a)]'
                      : 'text-[var(--brand-navy,#0a1122)] hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg leading-none">{c.flag}</span>
                    <span>{cName}</span>
                    {locale === 'ar' && (
                      <span className="text-xs text-slate-400">
                        ({c.nameEn})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-400">
                      {c.code}
                    </span>
                    {isSelected && (
                      <Check className="size-4 text-[var(--brand-primary,#007a5a)]" />
                    )}
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
    'garden',
    'rooms',
    'bathrooms',
    'floor',
    'remainingYears',
  ].includes(id)
  const isLtrField =
    compact || type === 'number' || id === 'email' || id === 'password'

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-start">
        <RequiredLabel>{label}</RequiredLabel>
      </Label>
      <Input
        id={id}
        name={id}
        type={type}
        dir={isLtrField ? 'ltr' : dir}
        placeholder={placeholder}
        value={value ?? ''}
        onChange={(event) => update(event.target.value)}
        className={`h-12 rounded-xl ${
          error ? 'border-red-500 bg-red-50/20' : 'border-slate-200'
        } ${
          compact
            ? 'max-w-[150px] self-start text-center font-semibold'
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
        <span className="text-start text-xs font-semibold leading-6 text-teal-700">
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
  const activeCurr = currencySymbol || defaultCurrency

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-start">
        <RequiredLabel>{label}</RequiredLabel>
      </Label>
      <div className="relative">
        <Input
          type="text"
          inputMode="numeric"
          dir="ltr"
          value={
            value ? Number(value.replace(/,/g, '')).toLocaleString('en-US') : ''
          }
          onChange={(event) =>
            update(event.target.value.replace(/[^0-9]/g, ''))
          }
          className={`h-12 rounded-xl pr-14 pl-4 text-left ${
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
      <span className="text-start text-xs font-semibold leading-6 text-teal-700">
        {formatAmount(value, activeCurr, locale) || helper || ''}
      </span>
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
        {items.map((item) => (
          <button
            type="button"
            key={item}
            onClick={() => onToggle(item)}
            className={`rounded-xl border px-4 py-2 text-sm transition ${
              selected.includes(item)
                ? 'border-[var(--brand-primary,#007a5a)] bg-[var(--brand-primary-light,#eaf8f2)] font-bold text-[var(--brand-primary,#007a5a)]'
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
            active === 'yes' ? 'bg-[var(--brand-navy,#0a1122)] text-white' : ''
          }`}
          onClick={() => toggle(group, 'yes')}
        >
          {t.yes}
        </Button>
        <Button
          type="button"
          variant={active === 'no' ? 'default' : 'outline'}
          className={`min-w-[80px] rounded-xl border px-5 py-2 text-sm font-semibold ${
            active === 'no' ? 'bg-[var(--brand-navy,#0a1122)] text-white' : ''
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
        className={`h-12 rounded-xl bg-[var(--brand-navy,#0a1122)] hover:bg-[var(--brand-navy-hover,#16223f)] ${
          !back ? 'w-full' : 'flex-1'
        }`}
        onClick={() => go(next)}
      >
        {btnLabel}
      </Button>
    </div>
  )
}
