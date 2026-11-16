'use client'

import {
  Building2,
  Calendar,
  Home,
  Hotel,
  KeyRound,
  MapPin,
  ShieldCheck,
  Store,
  Trees,
} from 'lucide-react'
import arDict from '@/dictionaries/ar.json'
import enDict from '@/dictionaries/en.json'
import kaDict from '@/dictionaries/ka.json'
import ruDict from '@/dictionaries/ru.json'
import {
  GEORGIA_CITIES_AND_DISTRICTS,
  type GeorgiaAreaItem,
} from '@/components/shared/georgia-areas'
import {
  DICTIONARIES,
  getCurrencySymbol,
  type Dictionary,
  type LocaleCode,
} from '@/lib/i18n'

export type PlatformCountryCode = 'EG' | 'RU' | 'GE' | 'AE'

export type DealCategory =
  | 'exit'
  | 'sale'
  | 'rent_monthly'
  | 'rent_daily'

export type LocalizedOptionItem<T = string> = {
  id: T
  ar: string
  en: string
  ru: string
  ka: string
  subAr?: string
  subEn?: string
  subRu?: string
  subKa?: string
  icon?: any
  badgeAr?: string
  badgeEn?: string
  badgeRu?: string
  badgeKa?: string
  titleAr?: string
  titleEn?: string
  labelAr?: string
  labelEn?: string
}

const arOpt = arDict.sell.optionsData
const enOpt = enDict.sell.optionsData
const ruOpt = ruDict.sell.optionsData
const kaOpt = kaDict.sell.optionsData

function buildSimpleLocalizedList<T extends string>(
  ids: readonly T[],
  sectionKey:
    | 'propertyKinds'
    | 'conditionOptions'
    | 'buildingSeries'
    | 'floorTypes'
    | 'heatingTypes'
    | 'buildingMaterials'
    | 'featureItems',
  iconMap?: Partial<Record<T, any>>
): Array<LocalizedOptionItem<T>> {
  return ids.map((id) => {
    const ar = (arOpt[sectionKey] as Record<string, string>)[id] || id
    const en = (enOpt[sectionKey] as Record<string, string>)[id] || id
    const ru = (ruOpt[sectionKey] as Record<string, string>)[id] || en
    const ka = (kaOpt[sectionKey] as Record<string, string>)[id] || en
    return {
      id,
      ar,
      en,
      ru,
      ka,
      labelAr: ar,
      labelEn: en,
      ...(iconMap?.[id] ? { icon: iconMap[id] } : {}),
    }
  })
}

export function toEnglishDigits(str: string): string {
  return String(str || '')
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
}

export function getOptionLabel(
  item: { ar: string; en: string; ru?: string; ka?: string } | string,
  locale: LocaleCode = 'ar'
): string {
  if (typeof item === 'string') return item
  if (locale === 'ar') return item.ar
  if (locale === 'ru') return item.ru || item.en
  if (locale === 'ka') return item.ka || item.en
  return item.en
}

export function getOptionSub(
  item: { subAr?: string; subEn?: string; subRu?: string; subKa?: string },
  locale: LocaleCode = 'ar'
): string {
  if (locale === 'ar') return item.subAr || ''
  if (locale === 'ru') return item.subRu || item.subEn || ''
  if (locale === 'ka') return item.subKa || item.subEn || ''
  return item.subEn || ''
}

const DEAL_TYPE_META: Array<{ id: DealCategory; icon: any }> = [
  { id: 'exit', icon: ShieldCheck },
  { id: 'sale', icon: Home },
  { id: 'rent_monthly', icon: KeyRound },
  { id: 'rent_daily', icon: Calendar },
]

export const DEAL_TYPES: Array<LocalizedOptionItem<DealCategory>> =
  DEAL_TYPE_META.map(({ id, icon }) => ({
    id,
    ar: arOpt.dealTypes[id].label,
    en: enOpt.dealTypes[id].label,
    ru: ruOpt.dealTypes[id].label,
    ka: kaOpt.dealTypes[id].label,
    subAr: arOpt.dealTypes[id].sub,
    subEn: enOpt.dealTypes[id].sub,
    subRu: ruOpt.dealTypes[id].sub,
    subKa: kaOpt.dealTypes[id].sub,
    titleAr: arOpt.dealTypes[id].label,
    titleEn: enOpt.dealTypes[id].label,
    icon,
  }))

export const PROPERTY_KINDS: Array<LocalizedOptionItem<string>> =
  buildSimpleLocalizedList(
    [
      'Apartment',
      'Private house',
      'Cottage',
      'Land',
      'Commercial',
      'Hotel',
    ] as const,
    'propertyKinds',
    {
      Apartment: Building2,
      'Private house': Home,
      Cottage: Trees,
      Land: MapPin,
      Commercial: Store,
      Hotel: Hotel,
    }
  )

export const CONDITION_OPTIONS: Array<LocalizedOptionItem<string>> =
  buildSimpleLocalizedList(
    [
      'Newly renovated',
      'Old renovation',
      'Under renovation',
      'Needs renovation',
      'White frame',
      'Black frame',
      'Green frame',
      'White plus',
    ] as const,
    'conditionOptions'
  )

export const BUILDING_SERIES: Array<LocalizedOptionItem<string>> =
  buildSimpleLocalizedList(
    [
      'Non-standard',
      'City type',
      'Tbilisi yard',
      'Czech',
      'Kavlashvili',
      'Tukhareli',
      'Lvov',
      'Kiev',
      'Leningrad',
      'Moscow',
      'Khrushchev',
      'Vedzisi',
      'Yugoslav',
      'Metromsheni',
      'Other',
    ] as const,
    'buildingSeries'
  )

export const FLOOR_TYPES: Array<LocalizedOptionItem<string>> =
  buildSimpleLocalizedList(
    ['Standard', 'Duplex', 'Triplex', 'Attic'] as const,
    'floorTypes'
  )

export const HEATING_TYPES: Array<LocalizedOptionItem<string>> =
  buildSimpleLocalizedList(
    ['Central', 'Own gas boiler', 'Electric', 'None'] as const,
    'heatingTypes'
  )

export const BUILDING_MATERIALS: Array<LocalizedOptionItem<string>> =
  buildSimpleLocalizedList(
    ['Monolithic concrete', 'Brick', 'Block', 'Panel', 'Mixed'] as const,
    'buildingMaterials'
  )

function matchLocalizedOption(
  rawVal: string | undefined | null,
  list: Array<LocalizedOptionItem<string>>,
  locale: LocaleCode
): string | null {
  if (!rawVal) return null
  const clean = String(rawVal).trim().toLowerCase()
  const found = list.find(
    (item) =>
      item.id.toLowerCase() === clean ||
      item.ar.toLowerCase() === clean ||
      item.en.toLowerCase() === clean ||
      (item.ru && item.ru.toLowerCase() === clean) ||
      (item.ka && item.ka.toLowerCase() === clean)
  )
  return found ? getOptionLabel(found, locale) : null
}

export function translateStoredPropertyKind(
  rawType?: string | null,
  locale: LocaleCode = 'ar'
): string {
  if (!rawType) {
    return getOptionLabel(PROPERTY_KINDS[0], locale)
  }
  const direct = matchLocalizedOption(rawType, PROPERTY_KINDS, locale)
  if (direct) return direct

  const shortTypes =
    DICTIONARIES[locale]?.common?.unitTypesShort ||
    arDict.common.unitTypesShort

  const lower = String(rawType).trim().toLowerCase()
  if (
    lower.includes('studio') ||
    lower.includes('استوديو') ||
    lower.includes('студия') ||
    lower.includes('სტუდიო')
  ) {
    return shortTypes.studio
  }
  if (
    lower.includes('hotel') ||
    lower.includes('فندق') ||
    lower.includes('отель') ||
    lower.includes('სასტუმრო') ||
    lower.includes('აპარტ')
  ) {
    return shortTypes.aparthotel
  }
  if (
    lower.includes('apart') ||
    lower.includes('شقة') ||
    lower.includes('شقه') ||
    lower.includes('квартир') ||
    lower.includes('ბინა')
  ) {
    return getOptionLabel(PROPERTY_KINDS[0], locale)
  }
  if (
    lower.includes('villa') ||
    lower.includes('house') ||
    lower.includes('فيلا') ||
    lower.includes('منزل') ||
    lower.includes('дом') ||
    lower.includes('სახლი')
  ) {
    return getOptionLabel(PROPERTY_KINDS[1], locale)
  }
  if (
    lower.includes('cottage') ||
    lower.includes('chalet') ||
    lower.includes('شاليه') ||
    lower.includes('كوخ') ||
    lower.includes('коттедж') ||
    lower.includes('კოტეჯი')
  ) {
    return getOptionLabel(PROPERTY_KINDS[2], locale)
  }
  if (
    lower.includes('land') ||
    lower.includes('أرض') ||
    lower.includes('ارض') ||
    lower.includes('участок') ||
    lower.includes('მიწის')
  ) {
    return getOptionLabel(PROPERTY_KINDS[3], locale)
  }
  if (
    lower.includes('commercial') ||
    lower.includes('office') ||
    lower.includes('shop') ||
    lower.includes('تجاري') ||
    lower.includes('مكتب') ||
    lower.includes('محل') ||
    lower.includes('коммерч') ||
    lower.includes('კომერციული')
  ) {
    return getOptionLabel(PROPERTY_KINDS[4], locale)
  }
  return String(rawType)
}

export function translateStoredFinishing(
  rawFinishing?: string | null,
  locale: LocaleCode = 'ar'
): string {
  if (!rawFinishing) {
    return getOptionLabel(CONDITION_OPTIONS[0], locale)
  }
  const direct = matchLocalizedOption(rawFinishing, CONDITION_OPTIONS, locale)
  if (direct) return direct

  const condDict =
    DICTIONARIES[locale]?.sell?.optionsData?.conditionOptions ||
    arOpt.conditionOptions

  const lower = String(rawFinishing).trim().toLowerCase()
  if (
    lower.includes('turnkey') ||
    lower.includes('تشطيب كامل') ||
    lower.includes('newly renovated') ||
    lower.includes('تشطيب جديد') ||
    lower.includes('под ключ') ||
    lower.includes('სრული რემონტით')
  ) {
    return condDict.Turnkey
  }
  if (
    lower.includes('white frame') ||
    lower.includes('إطار أبيض') ||
    lower.includes('الاطار الابيض') ||
    lower.includes('الإطار الأبيض') ||
    lower.includes('белый каркас') ||
    lower.includes('თეთრი კარკასი')
  ) {
    return getOptionLabel(CONDITION_OPTIONS[4], locale)
  }
  if (
    lower.includes('black frame') ||
    lower.includes('إطار أسود') ||
    lower.includes('الإطار الأسود') ||
    lower.includes('черный каркас') ||
    lower.includes('შავი კარკასი')
  ) {
    return getOptionLabel(CONDITION_OPTIONS[5], locale)
  }
  if (
    lower.includes('green frame') ||
    lower.includes('إطار أخضر') ||
    lower.includes('الإطار الأخضر') ||
    lower.includes('зеленый каркас') ||
    lower.includes('მწვანე კარკასი')
  ) {
    return getOptionLabel(CONDITION_OPTIONS[6], locale)
  }
  if (
    lower.includes('white plus') ||
    lower.includes('وايت بلس') ||
    lower.includes('белый плюс') ||
    lower.includes('თეთრი პლუსი')
  ) {
    return getOptionLabel(CONDITION_OPTIONS[7], locale)
  }
  if (
    lower.includes('furnished') ||
    lower.includes('بالفرش') ||
    lower.includes('مفروش') ||
    lower.includes('с мебелью') ||
    lower.includes('ავეჯით')
  ) {
    return condDict['Fully furnished']
  }
  return String(rawFinishing)
}

export function translateStoredInstallmentFreq(
  rawFreq?: string | null,
  locale: LocaleCode = 'ar'
): string {
  const freqDict =
    DICTIONARIES[locale]?.sell?.formUi?.pricingSection ||
    arDict.sell.formUi.pricingSection

  const clean = String(rawFreq || '').trim().toLowerCase()
  if (
    clean.includes('ربع') ||
    clean.includes('quarter') ||
    clean.includes('квартал') ||
    clean.includes('კვარტ')
  ) {
    return freqDict.freqQuarterly
  }
  if (
    clean.includes('نصف') ||
    clean.includes('نص') ||
    clean.includes('semi') ||
    clean.includes('полгод') ||
    clean.includes('6 თვე') ||
    clean.includes('ნახევარ')
  ) {
    return freqDict.freqSemiAnnual
  }
  if (
    clean.includes('سنوي') ||
    clean.includes('annual') ||
    clean.includes('year') ||
    clean.includes('ежегодно') ||
    clean.includes('წლიური')
  ) {
    return freqDict.freqAnnual
  }
  return freqDict.freqMonthly
}

export function translateStoredBuildingSeries(
  rawVal?: string | null,
  locale: LocaleCode = 'ar'
): string {
  return (
    matchLocalizedOption(rawVal, BUILDING_SERIES, locale) ||
    String(rawVal || '')
  )
}

export function translateStoredFloorType(
  rawVal?: string | null,
  locale: LocaleCode = 'ar'
): string {
  return (
    matchLocalizedOption(rawVal, FLOOR_TYPES, locale) || String(rawVal || '')
  )
}

export function translateStoredHeatingType(
  rawVal?: string | null,
  locale: LocaleCode = 'ar'
): string {
  return (
    matchLocalizedOption(rawVal, HEATING_TYPES, locale) || String(rawVal || '')
  )
}

export function translateStoredBuildingMaterial(
  rawVal?: string | null,
  locale: LocaleCode = 'ar'
): string {
  return (
    matchLocalizedOption(rawVal, BUILDING_MATERIALS, locale) ||
    String(rawVal || '')
  )
}

const FEATURE_GROUP_KEYS: Array<{
  key: 'space' | 'building' | 'utilities' | 'comfort' | 'views' | 'extra'
  itemIds: readonly string[]
}> = [
  {
    key: 'space',
    itemIds: [
      'Balcony',
      'Loggia',
      'Terrace',
      'Yard',
      'Storage',
      'Cellar',
      'Walk-in closet',
      'Separate kitchen',
    ],
  },
  {
    key: 'building',
    itemIds: [
      'Elevator',
      'Parking',
      'Underground parking',
      'Garage',
      'Security',
      'Concierge',
      'Intercom',
      'Backup generator',
      'Iron door',
      'Double glazing',
      'Penthouse',
      'Step-free access',
    ],
  },
  {
    key: 'utilities',
    itemIds: [
      'Underfloor heating',
      'Natural gas',
      'Hot water',
      'Internet',
      'Cable TV',
    ],
  },
  {
    key: 'comfort',
    itemIds: [
      'Furniture',
      'Appliances',
      'Air conditioning',
      'Dishwasher',
      'Washing machine',
      'Dryer',
      'Fireplace',
      'Kitchen',
      'TV',
    ],
  },
  {
    key: 'views',
    itemIds: [
      'Panoramic view',
      'Sea view',
      'Mountain view',
      'Yard view',
      'Street view',
      'Beachfront',
      'Bright',
      'Quiet',
    ],
  },
  {
    key: 'extra',
    itemIds: [
      'Pool',
      'Jacuzzi',
      'Sauna',
      'Gym',
      'BBQ grill',
      'EV charger',
      'Ski access',
    ],
  },
]

export const SIVRCE_FEATURE_GROUPS = FEATURE_GROUP_KEYS.map(
  ({ key, itemIds }) => ({
    key,
    ar: arOpt.featureGroups[key],
    en: enOpt.featureGroups[key],
    ru: ruOpt.featureGroups[key],
    ka: kaOpt.featureGroups[key],
    labelAr: arOpt.featureGroups[key],
    labelEn: enOpt.featureGroups[key],
    items: buildSimpleLocalizedList(itemIds, 'featureItems'),
  })
)

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

function buildCountryOption(params: {
  code: keyof typeof arOpt.countries
  flag: string
  currencySymbol: string
  phoneCode: string
  defaultPackages?: { days7: number; days14: number; days30: number }
}): PlatformCountryOption {
  const { code, flag, currencySymbol, phoneCode, defaultPackages } = params
  return {
    code,
    nameAr: arOpt.countries[code],
    nameEn: enOpt.countries[code],
    nameRu: ruOpt.countries[code],
    nameKa: kaOpt.countries[code],
    flag,
    currencySymbol,
    phoneCode,
    ...(defaultPackages ? { defaultPackages } : {}),
  }
}

export const PLATFORM_COUNTRIES: PlatformCountryOption[] = [
  buildCountryOption({
    code: 'GE',
    flag: '🇬🇪',
    currencySymbol: '$',
    phoneCode: '995',
    defaultPackages: { days7: 29, days14: 49, days30: 69 },
  }),
  buildCountryOption({
    code: 'EG',
    flag: '🇪🇬',
    currencySymbol: 'ج.م',
    phoneCode: '20',
    defaultPackages: { days7: 1199, days14: 1999, days30: 2799 },
  }),
  buildCountryOption({
    code: 'RU',
    flag: '🇷🇺',
    currencySymbol: '₽',
    phoneCode: '7',
    defaultPackages: { days7: 2500, days14: 4200, days30: 5900 },
  }),
  buildCountryOption({
    code: 'AE',
    flag: '🇦🇪',
    currencySymbol: 'د.إ',
    phoneCode: '971',
    defaultPackages: { days7: 99, days14: 179, days30: 249 },
  }),
]

export const ALL_RESIDENCE_COUNTRIES: PlatformCountryOption[] = [
  ...PLATFORM_COUNTRIES,
  buildCountryOption({
    code: 'SA',
    flag: '🇸🇦',
    currencySymbol: 'ر.س',
    phoneCode: '966',
  }),
  buildCountryOption({
    code: 'KW',
    flag: '🇰🇼',
    currencySymbol: 'د.ك',
    phoneCode: '965',
  }),
  buildCountryOption({
    code: 'QA',
    flag: '🇶🇦',
    currencySymbol: 'ر.ق',
    phoneCode: '974',
  }),
  buildCountryOption({
    code: 'BH',
    flag: '🇧🇭',
    currencySymbol: 'د.ب',
    phoneCode: '973',
  }),
  buildCountryOption({
    code: 'OM',
    flag: '🇴🇲',
    currencySymbol: 'ر.ع',
    phoneCode: '968',
  }),
  buildCountryOption({
    code: 'JO',
    flag: '🇯🇴',
    currencySymbol: 'د.أ',
    phoneCode: '962',
  }),
  buildCountryOption({
    code: 'TR',
    flag: '🇹🇷',
    currencySymbol: '₺',
    phoneCode: '90',
  }),
  buildCountryOption({
    code: 'US',
    flag: '🇺🇸',
    currencySymbol: '$',
    phoneCode: '1',
  }),
  buildCountryOption({
    code: 'GB',
    flag: '🇬🇧',
    currencySymbol: '£',
    phoneCode: '44',
  }),
]

export function getLocalizedCountryName(
  country: PlatformCountryOption,
  locale: LocaleCode = 'ar'
): string {
  const dictCountries =
    DICTIONARIES[locale]?.sell?.optionsData?.countries ||
    (DICTIONARIES[locale]?.admin?.propertiesAdmin as Record<string, any>)
      ?.countries
  if (dictCountries?.[country.code as keyof typeof arOpt.countries]) {
    return dictCountries[country.code as keyof typeof arOpt.countries]
  }
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
  ar: arDict.sell.detailsStep.unitTypes,
  en: enDict.sell.detailsStep.unitTypes,
  ru: ruDict.sell.detailsStep.unitTypes,
  ka: kaDict.sell.detailsStep.unitTypes,
}

const FINISHINGS_BY_LOCALE: Record<LocaleCode, string[]> = {
  ar: arDict.sell.detailsStep.finishings,
  en: enDict.sell.detailsStep.finishings,
  ru: ruDict.sell.detailsStep.finishings,
  ka: kaDict.sell.detailsStep.finishings,
}

const DELIVERIES_BY_LOCALE: Record<LocaleCode, string[]> = {
  ar: arDict.sell.detailsStep.deliveries,
  en: enDict.sell.detailsStep.deliveries,
  ru: ruDict.sell.detailsStep.deliveries,
  ka: kaDict.sell.detailsStep.deliveries,
}

const FEATURES_BY_LOCALE: Record<LocaleCode, string[]> = {
  ar: arOpt.featuresPreset,
  en: enOpt.featuresPreset,
  ru: ruOpt.featuresPreset,
  ka: kaOpt.featuresPreset,
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

export function getLocalizedGeorgiaCatalog(
  locale: LocaleCode = 'ar'
): Array<[string, string[]]> {
  const cityCodes: Array<GeorgiaAreaItem['cityCode']> = [
    'tbilisi',
    'batumi',
    'kutaisi',
    'resorts',
  ]

  const titlesDict =
    DICTIONARIES[locale]?.sell?.optionsData?.cityGroupTitles ||
    enOpt.cityGroupTitles

  return cityCodes.map((code): [string, string[]] => {
    const title = titlesDict[code] || enOpt.cityGroupTitles[code]
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