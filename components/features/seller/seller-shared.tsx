'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Building2,
  Calendar,
  Check,
  ChevronDown,
  Globe,
  Home,
  Hotel,
  KeyRound,
  Landmark,
  MapPin,
  ShieldCheck,
  Store,
  Trees,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  GEORGIA_CITIES_AND_DISTRICTS,
  GeorgiaAreaSelect,
  type GeorgiaAreaItem,
} from '@/components/shared/georgia-areas'
import {
  DICTIONARIES,
  getCurrencySymbol,
  useTranslation,
  type Dictionary,
  type LocaleCode,
} from '@/lib/i18n'

export type PlatformCountryCode = 'EG' | 'RU' | 'GE' | 'AE'

export type DealCategory =
  | 'exit'
  | 'sale'
  | 'rent_monthly'
  | 'pledge'
  | 'rent_daily'

export const DEAL_TYPES: Array<{
  id: DealCategory
  titleEn: string
  titleAr: string
  subEn: string
  subAr: string
  icon: any
  badgeAr?: string
  badgeEn?: string
}> = [
  {
    id: 'exit',
    titleEn: 'Resale & Installment Exit',
    titleAr: 'تنازل واستكمال أقساط',
    subEn: 'Recover paid cash · Buyer continues installments',
    subAr: 'استرد المبلغ المدفوع ويدخل المشتري مكانك بالأقساط',
    icon: ShieldCheck,
    badgeAr: 'بعمولة وساطة · رقمك مخفي',
    badgeEn: 'Brokered · Hidden Number',
  },
  {
    id: 'sale',
    titleEn: 'For sale',
    titleAr: 'بيع عقار (For sale)',
    subEn: 'Sell the property directly',
    subAr: 'بيع العقار كاش أو دفعات',
    icon: Home,
    badgeAr: 'بعمولة وساطة · رقمك مخفي',
    badgeEn: 'Brokered · Hidden Number',
  },
  {
    id: 'rent_monthly',
    titleEn: 'For rent',
    titleAr: 'للإيجار الشهري (For rent)',
    subEn: 'Long-term, monthly or yearly',
    subAr: 'إيجار طويل الأمد شهري أو سنوي',
    icon: KeyRound,
    badgeAr: 'إعلان مباشر · يظهر رقمك',
    badgeEn: 'Direct Ad · Public Number',
  },
  {
    id: 'rent_daily',
    titleEn: 'Daily rent',
    titleAr: 'إيجار يومي (Daily rent)',
    subEn: 'Per night, for guests & tourists',
    subAr: 'بالليلة للسياح والزوار',
    icon: Calendar,
    badgeAr: 'إعلان مباشر · يظهر رقمك',
    badgeEn: 'Direct Ad · Public Number',
  },
  {
    id: 'pledge',
    titleEn: 'For pledge',
    titleAr: 'رهن عقاري (For pledge)',
    subEn: 'Collateral against a loan (Girao)',
    subAr: 'نظام الرهن الجورجي مقابل مبلغ',
    icon: Landmark,
  },
]

export const PROPERTY_KINDS = [
  {
    id: 'Apartment',
    labelEn: 'Apartment',
    labelAr: 'شقة (Apartment)',
    icon: Building2,
  },
  {
    id: 'Private house',
    labelEn: 'Private house',
    labelAr: 'منزل مستقل / فيلا',
    icon: Home,
  },
  {
    id: 'Cottage',
    labelEn: 'Cottage',
    labelAr: 'كوخ / شاليه (Cottage)',
    icon: Trees,
  },
  { id: 'Land', labelEn: 'Land', labelAr: 'أرض (Land)', icon: MapPin },
  {
    id: 'Commercial',
    labelEn: 'Commercial',
    labelAr: 'تجاري / مكتب',
    icon: Store,
  },
  {
    id: 'Hotel',
    labelEn: 'Hotel',
    labelAr: 'فندق / شقة فندقية',
    icon: Hotel,
  },
]

export const CONDITION_OPTIONS = [
  {
    id: 'Newly renovated',
    labelEn: 'Newly renovated',
    labelAr: 'تشطيب جديد (Newly renovated)',
  },
  {
    id: 'Old renovation',
    labelEn: 'Old renovation',
    labelAr: 'تشطيب قديم (Old renovation)',
  },
  {
    id: 'Under renovation',
    labelEn: 'Under renovation',
    labelAr: 'قيد التشطيب',
  },
  {
    id: 'Needs renovation',
    labelEn: 'Needs renovation',
    labelAr: 'يحتاج تجديد',
  },
  {
    id: 'White frame',
    labelEn: 'White frame',
    labelAr: 'إطار أبيض (White frame)',
  },
  {
    id: 'Black frame',
    labelEn: 'Black frame',
    labelAr: 'إطار أسود (Black frame)',
  },
  {
    id: 'Green frame',
    labelEn: 'Green frame',
    labelAr: 'إطار أخضر (Green frame)',
  },
  {
    id: 'White plus',
    labelEn: 'White plus',
    labelAr: 'وايت بلس (White plus)',
  },
]

export const BUILDING_SERIES = [
  'Non-standard',
  'Leningrad',
  'Lvov',
  'Kiev',
  'Tbilisi yard',
  'Moscow',
  'City type',
  'Czech',
  'Khrushchev',
  'Tukhareli',
  'Vedzisi',
  'Yugoslav',
  'Metromsheni',
  'Kavlashvili',
  'Other',
]

export const FLOOR_TYPES = [
  { id: 'Standard', labelEn: 'Standard', labelAr: 'طابق عادي' },
  { id: 'Duplex', labelEn: 'Duplex', labelAr: 'دوبلكس (Duplex)' },
  { id: 'Triplex', labelEn: 'Triplex', labelAr: 'تريبلكس (Triplex)' },
  { id: 'Attic', labelEn: 'Attic', labelAr: 'روف / علية (Attic)' },
]

export const HEATING_TYPES = [
  { id: 'Central', labelEn: 'Central', labelAr: 'تدفئة مركزية (Central)' },
  { id: 'Own gas boiler', labelEn: 'Own gas boiler', labelAr: 'سخان غاز مستقل' },
  { id: 'Electric', labelEn: 'Electric', labelAr: 'تدفئة كهربائية' },
  { id: 'None', labelEn: 'None', labelAr: 'بدون تدفئة' },
]

export const BUILDING_MATERIALS = [
  {
    id: 'Monolithic concrete',
    labelEn: 'Monolithic concrete',
    labelAr: 'خرسانة مسلحة (Monolithic)',
  },
  { id: 'Brick', labelEn: 'Brick', labelAr: 'طوب (Brick)' },
  { id: 'Block', labelEn: 'Block', labelAr: 'بلوك (Block)' },
  { id: 'Panel', labelEn: 'Panel', labelAr: 'بانل (Panel)' },
  { id: 'Mixed', labelEn: 'Mixed', labelAr: 'مختلط (Mixed)' },
]

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

export function toEnglishDigits(str: string): string {
  return String(str || '')
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
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
    nameRu: 'Саудовская Аравия',
    nameKa: 'საუდის არაბეთი',
    flag: '🇸🇦',
    currencySymbol: 'ر.س',
    phoneCode: '966',
  },
  {
    code: 'KW',
    nameAr: 'الكويت',
    nameEn: 'Kuwait',
    nameRu: 'Кувейт',
    nameKa: 'ქუვეითი',
    flag: '🇰🇼',
    currencySymbol: 'د.ك',
    phoneCode: '965',
  },
  {
    code: 'QA',
    nameAr: 'قطر',
    nameEn: 'Qatar',
    nameRu: 'Катар',
    nameKa: 'ყატარი',
    flag: '🇶🇦',
    currencySymbol: 'ر.ق',
    phoneCode: '974',
  },
  {
    code: 'BH',
    nameAr: 'البحرين',
    nameEn: 'Bahrain',
    nameRu: 'Бахрейн',
    nameKa: 'ბაჰრეინი',
    flag: '🇧🇭',
    currencySymbol: 'د.ب',
    phoneCode: '973',
  },
  {
    code: 'OM',
    nameAr: 'عمان',
    nameEn: 'Oman',
    nameRu: 'Оман',
    nameKa: 'ომანი',
    flag: '🇴🇲',
    currencySymbol: 'ر.ع',
    phoneCode: '968',
  },
  {
    code: 'JO',
    nameAr: 'الأردن',
    nameEn: 'Jordan',
    nameRu: 'Иордания',
    nameKa: 'იორდანია',
    flag: '🇯🇴',
    currencySymbol: 'د.أ',
    phoneCode: '962',
  },
  {
    code: 'TR',
    nameAr: 'تركيا',
    nameEn: 'Turkey',
    nameRu: 'Турция',
    nameKa: 'თურქეთი',
    flag: '🇹🇷',
    currencySymbol: '₺',
    phoneCode: '90',
  },
  {
    code: 'US',
    nameAr: 'أمريكا / كندا',
    nameEn: 'USA / Canada',
    nameRu: 'США / Канада',
    nameKa: 'აშშ / კანადა',
    flag: '🇺🇸',
    currencySymbol: '$',
    phoneCode: '1',
  },
  {
    code: 'GB',
    nameAr: 'بريطانيا',
    nameEn: 'UK',
    nameRu: 'Великобритания',
    nameKa: 'დიდი ბრიტანეთი',
    flag: '🇬🇧',
    currencySymbol: '£',
    phoneCode: '44',
  },
]

export function getLocalizedCountryName(
  country: PlatformCountryOption,
  locale: LocaleCode = 'ar'
): string {
  const dictCountries = (
    DICTIONARIES[locale]?.admin?.propertiesAdmin as Record<string, any>
  )?.countries
  if (dictCountries?.[country.code]) return dictCountries[country.code]
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

const UNIT_TYPES_BY_LOCALE: Record<LocaleCode, string[]> = {
  ar: [
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
  ],
  en: [
    'Apartment',
    'Studio',
    'Duplex',
    'Penthouse',
    'Townhouse',
    'Standalone Villa',
    'Aparthotel',
    'Mountain / Sea Chalet',
    'Commercial Office',
    'Retail Shop',
    'Land',
  ],
  ru: [
    'Квартира',
    'Студия (Studio)',
    'Дуплекс',
    'Пентхаус',
    'Таунхаус',
    'Отдельная вилла',
    'Апарт-отель (Aparthotel)',
    'Горное / Морское шале',
    'Коммерческий офис',
    'Торговое помещение',
    'Земельный участок',
  ],
  ka: [
    'ბინა',
    'სტუდიო (Studio)',
    'დუპლექსი',
    'პენტჰაუსი',
    'თაუნჰაუსი',
    'კერძო ვილა',
    'აპარტ-ოტელი (Aparthotel)',
    'მთის / ზღვის შალე',
    'კომერციული ოფისი',
    'სავაჭრო ფართი',
    'მიწის ნაკვეთი',
  ],
}

const FINISHINGS_BY_LOCALE: Record<LocaleCode, string[]> = {
  ar: [
    'تشطيب كامل (Turnkey)',
    'بالفرش والأجهزة (Fully Furnished)',
    'نصف تشطيب — إطار أبيض (White Frame)',
    'على الطوب — إطار أسود (Black Frame)',
    'إطار أخضر (Green Frame)',
  ],
  en: [
    'Turnkey (Full Finishing)',
    'Fully Furnished & Equipped',
    'White Frame (Semi-Finished)',
    'Black Frame (Core & Shell)',
    'Green Frame',
  ],
  ru: [
    'Под ключ (Turnkey)',
    'С мебелью и техникой (Fully Furnished)',
    'Белый каркас (White Frame)',
    'Черный каркас (Black Frame)',
    'Зеленый каркас (Green Frame)',
  ],
  ka: [
    'სრული რემონტით (Turnkey)',
    'ავეჯით და ტექნიკით (Fully Furnished)',
    'თეთრი კარკასი (White Frame)',
    'შავი კარკასი (Black Frame)',
    'მწვანე კარკასი (Green Frame)',
  ],
}

const DELIVERIES_BY_LOCALE: Record<LocaleCode, string[]> = {
  ar: ['جاهزة للاستلام', 'تحت الإنشاء'],
  en: ['Ready to Move', 'Under Construction'],
  ru: ['Готово к заселению', 'Строится'],
  ka: ['მზადაა შესასვლელად', 'მშენებარე'],
}

const FEATURES_BY_LOCALE: Record<LocaleCode, string[]> = {
  ar: [
    'إطلالة بحرية (Sea View)',
    'إطلالة جبلية (Mountain View)',
    'إطلالة بانورامية على المدينة',
    'حمام سباحة',
    'تدفئة مركزية / أرضية',
    'أمن واستقبال 24 ساعة',
    'جراج سيارات تحت الأرض',
    'شرفة واسعة (Balcony)',
    'قريبة من المترو والخدمات',
  ],
  en: [
    'Sea View',
    'Mountain View',
    'Panoramic City View',
    'Swimming Pool',
    'Central / Underfloor Heating',
    '24/7 Security & Reception',
    'Underground Parking',
    'Spacious Balcony',
    'Near Metro & Amenities',
  ],
  ru: [
    'Вид на море (Sea View)',
    'Вид на горы (Mountain View)',
    'Панорамный вид на город',
    'Бассейн',
    'Центральное / Подогрев полов',
    'Охрана и ресепшн 24/7',
    'Подземный паркинг',
    'Просторный балкон',
    'Рядом с метро и инфраструктурой',
  ],
  ka: [
    'ზღვის ხედი (Sea View)',
    'მთის ხედი (Mountain View)',
    'პანორამული ხედი ქალაქზე',
    'აუზი',
    'ცენტრალური / იატაკის გათბობა',
    '24/7 დაცვა და მიმღები',
    'მიწისქვეშა პარკინგი',
    'ფართო აივანი (Balcony)',
    'მეტროსთან და სერვისებთან ახლოს',
  ],
}

export function getLocalizedUnitTypes(
  dict?: Dictionary | Record<string, any>,
  locale: LocaleCode = 'ar'
): string[] {
  const fromDict = (dict?.sell?.detailsStep as Record<string, any>)?.unitTypes
  if (Array.isArray(fromDict) && fromDict.length > 0) return fromDict
  return UNIT_TYPES_BY_LOCALE[locale] || UNIT_TYPES_BY_LOCALE.ar
}

export function getLocalizedFinishings(
  dict?: Dictionary | Record<string, any>,
  locale: LocaleCode = 'ar'
): string[] {
  const fromDict = (dict?.sell?.detailsStep as Record<string, any>)?.finishings
  if (Array.isArray(fromDict) && fromDict.length > 0) return fromDict
  return FINISHINGS_BY_LOCALE[locale] || FINISHINGS_BY_LOCALE.ar
}

export function getLocalizedDeliveries(
  dict?: Dictionary | Record<string, any>,
  locale: LocaleCode = 'ar'
): string[] {
  const fromDict = (dict?.sell?.detailsStep as Record<string, any>)?.deliveries
  if (Array.isArray(fromDict) && fromDict.length > 0) return fromDict
  const filterStatuses = (
    dict?.opportunitiesPage?.filters as Record<string, any>
  )?.deliveryStatuses
  if (Array.isArray(filterStatuses) && filterStatuses.length >= 3) {
    return [filterStatuses[1], filterStatuses[2]]
  }
  return DELIVERIES_BY_LOCALE[locale] || DELIVERIES_BY_LOCALE.ar
}

export function getLocalizedFeatures(
  dict?: Dictionary | Record<string, any>,
  locale: LocaleCode = 'ar'
): string[] {
  const fromDict = (dict?.sell?.detailsStep as Record<string, any>)?.features
  if (Array.isArray(fromDict) && fromDict.length > 0) return fromDict
  return FEATURES_BY_LOCALE[locale] || FEATURES_BY_LOCALE.ar
}

export function isReadyDeliveryOption(val?: string): boolean {
  if (!val) return false
  const allReady = [
    DELIVERIES_BY_LOCALE.ar[0],
    DELIVERIES_BY_LOCALE.en[0],
    DELIVERIES_BY_LOCALE.ru[0],
    DELIVERIES_BY_LOCALE.ka[0],
  ]
  return (
    allReady.includes(val) ||
    val.includes('جاهز') ||
    val.toLowerCase().includes('ready') ||
    val.toLowerCase().includes('готов') ||
    val.includes('მზად')
  )
}

export function isUnderConstructionDeliveryOption(val?: string): boolean {
  if (!val) return false
  return !isReadyDeliveryOption(val)
}

export const unitTypes: string[] = UNIT_TYPES_BY_LOCALE.ar
export const finishings: string[] = FINISHINGS_BY_LOCALE.ar
export const deliveries: string[] = DELIVERIES_BY_LOCALE.ar
export const features: string[] = FEATURES_BY_LOCALE.ar

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

export function getLocalizedMonthsList(locale: LocaleCode = 'ar') {
  const localeMap: Record<LocaleCode, string> = {
    ar: 'ar-EG',
    en: 'en-US',
    ru: 'ru-RU',
    ka: 'ka-GE',
  }
  return Array.from({ length: 12 }, (_, idx) => {
    const monthNum = String(idx + 1).padStart(2, '0')
    let monthName = monthNum
    try {
      monthName = new Intl.DateTimeFormat(localeMap[locale] || 'en-US', {
        month: 'short',
      }).format(new Date(2026, idx, 1))
    } catch {}
    return {
      value: monthNum,
      label: `${monthNum} - ${monthName}`,
    }
  })
}

const CITY_GROUP_TITLES: Record<
  GeorgiaAreaItem['cityCode'],
  Record<LocaleCode, string>
> = {
  tbilisi: {
    ar: 'تبليسي (Tbilisi)',
    en: 'Tbilisi',
    ru: 'Тбилиси',
    ka: 'თბილისი',
  },
  batumi: {
    ar: 'باتومي وساحل البحر الأسود (Batumi)',
    en: 'Batumi & Black Sea Coast',
    ru: 'Батуми и побережье',
    ka: 'ბათუმი და შავი ზღვის სანაპირო',
  },
  kutaisi: {
    ar: 'كوتايسي (Kutaisi)',
    en: 'Kutaisi',
    ru: 'Кутаиси',
    ka: 'ქუთაისი',
  },
  resorts: {
    ar: 'منتجعات ومدن جورجيا الأخرى',
    en: 'Other Georgian Cities & Resorts',
    ru: 'Другие города и курорты Грузии',
    ka: 'საქართველოს სხვა ქალაქები და კურორტები',
  },
}

export function getLocalizedGeorgiaCatalog(
  locale: LocaleCode = 'ar'
): Array<[string, string[]]> {
  const cityCodes: Array<GeorgiaAreaItem['cityCode']> = [
    'tbilisi',
    'batumi',
    'kutaisi',
    'resorts',
  ]

  return cityCodes.map((code): [string, string[]] => {
    const title =
      CITY_GROUP_TITLES[code][locale] || CITY_GROUP_TITLES[code].en
    const items = GEORGIA_CITIES_AND_DISTRICTS.filter(
      (item: GeorgiaAreaItem) => item.cityCode === code
    ).map((item: GeorgiaAreaItem) =>
      locale === 'ar'
        ? item.ar
        : locale === 'ru'
          ? item.ru
          : locale === 'ka'
            ? item.ka
            : item.en
    )
    return [title, items]
  })
}

export const GEORGIA_AREAS_CATALOG: Array<[string, string[]]> =
  getLocalizedGeorgiaCatalog('ar')

export const areasCatalogByCountry: Record<string, Array<[string, string[]]>> =
  {
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
  const cleanStr = toEnglishDigits(value ?? '').replace(/,/g, '')
  const amount = Number(cleanStr)
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
  const { t: dict, locale } = useTranslation()
  const pricingT = (dict.sell?.pricingStep as Record<string, any>) || {}
  const monthsOptions = getLocalizedMonthsList(locale)

  const monthPlaceholder =
    pricingT.monthPlaceholder ||
    (locale === 'ar'
      ? 'الشهر *'
      : locale === 'ru'
        ? 'Месяц *'
        : locale === 'ka'
          ? 'თვე *'
          : 'Month *')

  const yearPlaceholder =
    pricingT.yearPlaceholder ||
    (locale === 'ar'
      ? 'السنة *'
      : locale === 'ru'
        ? 'Год *'
        : locale === 'ka'
          ? 'წელი *'
          : 'Year *')

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
  const cleanDigits = toEnglishDigits(value || '').replace(/[^0-9]/g, '')

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
      <span className="text-start text-xs font-semibold leading-6 text-teal-700">
        {formatAmount(cleanDigits, activeCurr, locale) || helper || ''}
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