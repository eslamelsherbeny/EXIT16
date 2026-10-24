'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Globe, MapPin, Search, X } from 'lucide-react'
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
    code: 'TR',
    nameAr: 'تركيا',
    nameEn: 'Turkey',
    flag: '🇹🇷',
    currencySymbol: '₺',
    phoneCode: '90',
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
  return 'GE'
}

export function getCountryConfig(countryCode?: string): PlatformCountryOption {
  return (
    PLATFORM_COUNTRIES.find(
      (c) => c.code === (countryCode || 'GE').toUpperCase()
    ) || PLATFORM_COUNTRIES[0]
  )
}

export function getCurrencyByCountry(
  countryCode?: string,
  locale?: LocaleCode
) {
  return getCurrencySymbol(countryCode || 'GE', locale)
}

export const unitTypes: string[] = [
  'شقة',
  'استوديو (Studio)',
  'دوبلكس',
  'بنتهاوس',
  'تاون هاوس',
  'فيلا مستقلة',
  'شقة فندقية (Aparthotel)',
  'شاليه جبلي / بحري',
  'مكتب تجاري',
  'محل تجاري',
  'أرض',
]

export const finishings: string[] = [
  'تشطيب كامل (Turnkey)',
  'بالفرش والأجهزة (Fully Furnished)',
  'نصف تشطيب — إطار أبيض (White Frame)',
  'على الطوب — إطار أسود (Black Frame)',
  'إطار أخضر (Green Frame)',
]

export const deliveries: string[] = ['جاهزة للاستلام', 'تحت الإنشاء']

export const features: string[] = [
  'إطلالة بحرية (Sea View)',
  'إطلالة جبلية (Mountain View)',
  'إطلالة بانورامية على المدينة',
  'حمام سباحة',
  'تدفئة مركزية / أرضية',
  'أمن واستقبال 24 ساعة',
  'جراج سيارات تحت الأرض',
  'شرفة واسعة (Balcony)',
  'قريبة من المترو والخدمات',
]

export const years: string[] = [
  '2026',
  '2025',
  '2024',
  '2023',
  '2022',
  '2021',
  '2020',
  '2019',
]

export const deliveryFutureYears: string[] = [
  '2026',
  '2027',
  '2028',
  '2029',
  '2030',
  '2031',
]

export const MONTHS_LIST: Array<{
  value: string
  ar: string
  en: string
  ru: string
  ka: string
}> = [
  { value: '01', ar: '1 - يناير', en: '01 - Jan', ru: '01 - Янв', ka: '01 - იანვარი' },
  { value: '02', ar: '2 - فبراير', en: '02 - Feb', ru: '02 - Фев', ka: '02 - თებერვალი' },
  { value: '03', ar: '3 - مارس', en: '03 - Mar', ru: '03 - Мар', ka: '03 - მარტი' },
  { value: '04', ar: '4 - أبريل', en: '04 - Apr', ru: '04 - Апр', ka: '04 - აპრილი' },
  { value: '05', ar: '5 - مايو', en: '05 - May', ru: '05 - Май', ka: '05 - მაისი' },
  { value: '06', ar: '6 - يونيو', en: '06 - Jun', ru: '06 - Июн', ka: '06 - ივნისი' },
  { value: '07', ar: '7 - يوليو', en: '07 - Jul', ru: '07 - Июл', ka: '07 - ივლისი' },
  { value: '08', ar: '8 - أغسطس', en: '08 - Aug', ru: '08 - Авг', ka: '08 - აგვისტო' },
  { value: '09', ar: '9 - سبتمبر', en: '09 - Sep', ru: '09 - Сен', ka: '09 - სექტემბერი' },
  { value: '10', ar: '10 - أكتوبر', en: '10 - Oct', ru: '10 - Окт', ka: '10 - ოქტომბერი' },
  { value: '11', ar: '11 - نوفمبر', en: '11 - Nov', ru: '11 - Ноя', ka: '11 - ნოემბერი' },
  { value: '12', ar: '12 - ديسمبر', en: '12 - Dec', ru: '12 - Дек', ka: '12 - დეკემბერი' },
]

// ==================== الدليل الكامل لجميع مدن وأحياء جورجيا ====================
export const GEORGIA_AREAS_CATALOG: Array<[string, string[]]> = [
  [
    'تبليسي — الأحياء الراقية والمركزية (Tbilisi Central)',
    [
      'تبليسي - سابورتالو (Saburtalo / საბურთალო)',
      'تبليسي - فاكي (Vake / ვაკე)',
      'تبليسي - فيرا (Vera / ვერა)',
      'تبليسي - متاتسميندا وروستافيلي (Mtatsminda / მთაწმინდა)',
      'تبليسي - كرتسانيسي وأورتاتشالا (Krtsanisi - Ortachala / ორთაჭალა)',
      'تبليسي - تشوغوريتي ومارجانشفيلي (Chugureti - Marjanishvili)',
      'تبليسي - تبليسي القديمة (Old Tbilisi / ძველი თბილისი)',
      'تبليسي - باغيبي (Bagebi / ბაგები)',
    ],
  ],
  [
    'تبليسي — الأحياء السكنية والتوسعات الحديثة (Tbilisi Residential)',
    [
      'تبليسي - ديدي ديغومي (Didi Digomi / დიდი დიღომი)',
      'تبليسي - ديغومي ماسيف (Digomi Massive / დიღმის მასივი)',
      'تبليسي - إيساني (Isani / ისანი)',
      'تبليسي - سامغوري وفاركيتيلي (Samgori - Varketili / ვარკეთილი)',
      'تبليسي - ديدوبي (Didube / დიდუბე)',
      'تبليسي - نادزالاديفي (Nadzaladevi / ნაძალადევი)',
      'تبليسي - غلداني (Gldani / გლდანი)',
      'تبليسي - أفالاباري (Avlabari / ავლაბარი)',
      'تبليسي - ليسي ليك (Lisi Lake / ლისის ტბა)',
      'تبليسي - تاباخميلا وتسكنيتي (Tabakhmela - Tskneti / წყნეთი)',
    ],
  ],
  [
    'باتومي وساحل البحر الأسود (Batumi & Adjara Coast)',
    [
      'باتومي - البوليفارد الجديد (New Boulevard / ახალი ბულვარი)',
      'باتومي - ممر الأبطال شارع شارتافا (Alley of Heroes - Shartava)',
      'باتومي - باتومي القديمة ووسط المدينة (Old Batumi / ძველი ბათუმი)',
      'باتومي - روستافيلي والواجهة البحرية (Rustaveli Seafront)',
      'باتومي - غونيو وكفاريإتي (Gonio - Kvariati / გონიო)',
      'باتومي - مخينجوري والحديقة النباتية (Makhinjauri / მახინჯაური)',
      'باتومي - شاكفي (Chakvi / ჩაქვი)',
      'كوبوليتي (Kobuleti / ქობულეთი)',
      'ساربي (Sarpi / სარფი)',
      'أوريكي وشيكفيتيلي (Ureki - Shekvetili / შეკვეთილი)',
    ],
  ],
  [
    'مدن ومنتجعات جورجيا الأخرى (Other Georgian Cities & Resorts)',
    [
      'كوتايسي (Kutaisi / ქუთაისი)',
      'روستافي (Rustavi / რუსთავი)',
      'غوداوري — منتجع التزلج (Gudauri / გუდაური)',
      'باكورياني — منتجع جبلي (Bakuriani / ბაკურიანი)',
      'بورجومي (Borjomi / ბორჯომი)',
      'متسخيتا وساغورامو (Mtskheta - Saguramo / საგურამო)',
      'تيلافي وكاخيتي (Telavi - Kakheti / თელავი)',
      'زوغديدي وبوتي (Zugdidi - Poti)',
      'منطقة أخرى في جورجيا (Other Area in Georgia)',
    ],
  ],
]

export const areasCatalogByCountry: Record<string, Array<[string, string[]]>> = {
  GE: GEORGIA_AREAS_CATALOG,
  EG: GEORGIA_AREAS_CATALOG,
  AE: GEORGIA_AREAS_CATALOG,
  RU: GEORGIA_AREAS_CATALOG,
}

export const areasCatalog = GEORGIA_AREAS_CATALOG

export function formatAmount(
  value?: string,
  currencySymbol = '$',
  locale: LocaleCode = 'ar'
) {
  const amount = Number((value ?? '').replace(/,/g, ''))
  if (!amount) return ''
  const sharedDict =
    DICTIONARIES[locale]?.sell?.shared || DICTIONARIES.ar.sell.shared
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
  const { locale, dir } = useTranslation()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const allFlatAreas: string[] = GEORGIA_AREAS_CATALOG.flatMap(
    ([, items]: [string, string[]]) => items
  )
  const cleanQ = normalizeArabicText(query)

  const filteredGroups = GEORGIA_AREAS_CATALOG.map(
    ([groupTitle, items]: [string, string[]]) => {
      const matched = items.filter((item: string) =>
        normalizeArabicText(item).includes(cleanQ)
      )
      return [groupTitle, matched] as const
    }
  ).filter(([, matched]) => matched.length > 0)

  const defaultPlaceholder =
    placeholder ||
    (locale === 'ar'
      ? 'ابحث باسم الحي أو المدينة في جورجيا (مثلاً: سابورتالو، فاكي، باتومي)...'
      : locale === 'ru'
        ? 'Поиск района или города Грузии (Сабуртало, Ваке, Батуми)...'
        : locale === 'ka'
          ? 'მოძებნეთ უბანი ან ქალაქი (საბურთალო, ვაკე, ბათუმი)...'
          : 'Search district or city in Georgia (Saburtalo, Vake, Batumi)...')

  return (
    <div ref={wrapperRef} className="relative flex flex-col gap-2">
      <Label className="text-start">
        <RequiredLabel>{label}</RequiredLabel>
      </Label>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 start-3.5 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          type="text"
          dir={dir}
          value={open ? query : value}
          placeholder={defaultPlaceholder}
          onFocus={() => {
            setOpen(true)
            setQuery('')
          }}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              const firstMatch = filteredGroups[0]?.[1]?.[0]
              if (firstMatch) {
                onChange(firstMatch)
                setOpen(false)
                setQuery('')
              } else if (query.trim()) {
                onChange(query.trim())
                setOpen(false)
                setQuery('')
              }
            }
          }}
          className={`h-12 rounded-xl ps-10 pe-10 text-start font-semibold text-[var(--brand-navy,#0a1122)] ${
            error ? 'border-red-500 bg-red-50/20' : 'border-slate-200 bg-white'
          }`}
        />
        {value && !open ? (
          <button
            type="button"
            onClick={() => {
              onChange('')
              setQuery('')
              setOpen(true)
            }}
            className="absolute top-1/2 end-3 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-red-500"
          >
            <X className="size-4" />
          </button>
        ) : (
          <ChevronDown className="pointer-events-none absolute top-1/2 end-3.5 size-4 -translate-y-1/2 text-slate-400" />
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {allFlatAreas.slice(0, 6).map((quickArea: string) => {
          const isSelected = value === quickArea
          const shortLabel = quickArea.split(' (')[0]
          return (
            <button
              key={quickArea}
              type="button"
              onClick={() => {
                onChange(quickArea)
                setOpen(false)
                setQuery('')
              }}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-bold transition ${
                isSelected
                  ? 'border-[var(--brand-primary,#007a5a)] bg-[var(--brand-primary,#007a5a)] text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-teal-400 hover:bg-white'
              }`}
            >
              {isSelected ? `✓ ${shortLabel}` : `+ ${shortLabel}`}
            </button>
          )
        })}
      </div>

      {open && (
        <div className="absolute top-[76px] z-30 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
          {filteredGroups.length === 0 ? (
            <div className="p-3 text-center">
              <p className="text-xs text-slate-500">
                {locale === 'ar'
                  ? 'لم يتم العثور على المنطقة في القائمة — اضغط لإضافتها مباشرة:'
                  : 'Area not in list — click to use custom area:'}
              </p>
              {query.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    onChange(query.trim())
                    setOpen(false)
                    setQuery('')
                  }}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand-primary,#007a5a)] px-4 py-2 text-xs font-bold text-white"
                >
                  <MapPin className="size-3.5" />
                  <span>{query.trim()}</span>
                </button>
              )}
            </div>
          ) : (
            filteredGroups.map(([groupTitle, items]) => (
              <div key={groupTitle} className="mb-2 last:mb-0">
                <p className="sticky top-0 bg-slate-50/95 px-2.5 py-1 text-start text-[11px] font-extrabold text-teal-800 backdrop-blur-xs">
                  {groupTitle}
                </p>
                <div className="mt-1 space-y-0.5">
                  {items.map((area: string) => {
                    const isSelected = value === area
                    return (
                      <button
                        key={area}
                        type="button"
                        onClick={() => {
                          onChange(area)
                          setOpen(false)
                          setQuery('')
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-start text-xs font-semibold transition sm:text-sm ${
                          isSelected
                            ? 'bg-[var(--brand-primary-light,#eaf8f2)] font-bold text-[var(--brand-primary,#007a5a)]'
                            : 'text-[var(--brand-navy,#0a1122)] hover:bg-slate-50'
                        }`}
                      >
                        <span>{area}</span>
                        {isSelected && (
                          <Check className="size-4 shrink-0 text-[var(--brand-primary,#007a5a)]" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {error && (
        <p className="mt-1 text-start text-xs font-semibold text-red-600">
          {error}
        </p>
      )}
    </div>
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
            className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-[var(--brand-navy,#0a1122)] focus:border-[var(--brand-primary,#007a5a)] focus:outline-none sm:text-sm"
          >
            <option value="">{monthPlaceholder}</option>
            {MONTHS_LIST.map((m) => (
              <option key={m.value} value={m.value}>
                {locale === 'ar'
                  ? m.ar
                  : locale === 'ru'
                    ? m.ru
                    : locale === 'ka'
                      ? m.ka
                      : m.en}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 end-3 size-4 -translate-y-1/2 text-slate-400" />
        </div>

        <div className="relative">
          <select
            value={yearValue || ''}
            onChange={(e) => onYearChange(e.target.value)}
            className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-[var(--brand-navy,#0a1122)] focus:border-[var(--brand-primary,#007a5a)] focus:outline-none sm:text-sm"
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
    'remainingMonths',
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
            ? 'max-w-[180px] self-start text-center font-semibold'
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
  const activeCurr = currencySymbol || defaultCurrency || '$'

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
        {items.map((item: string) => (
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