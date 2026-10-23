import ar from '@/dictionaries/ar.json'
import en from '@/dictionaries/en.json'
import ru from '@/dictionaries/ru.json'
import ka from '@/dictionaries/ka.json'

export type LocaleCode = 'ar' | 'en' | 'ru' | 'ka'
export type CountryCode = 'EG' | 'RU' | 'GE' | 'AE'
export type PlatformCountryCode = CountryCode
export type Dictionary = typeof ar

export const SUPPORTED_LANGUAGES: Record<
  LocaleCode,
  {
    code: LocaleCode
    shortCode: string
    nativeName: string
    dir: 'rtl' | 'ltr'
  }
> = {
  ar: { code: 'ar', shortCode: 'ع', nativeName: 'العربية', dir: 'rtl' },
  en: { code: 'en', shortCode: 'EN', nativeName: 'English', dir: 'ltr' },
  ru: { code: 'ru', shortCode: 'RU', nativeName: 'Русский', dir: 'ltr' },
  ka: { code: 'ka', shortCode: 'KA', nativeName: 'ქართული', dir: 'ltr' },
}

export const DICTIONARIES: Record<LocaleCode, Dictionary> = {
  ar,
  en: en as unknown as Dictionary,
  ru: ru as unknown as Dictionary,
  ka: ka as unknown as Dictionary,
}

export function normalizeLocale(val?: string | null): LocaleCode {
  const clean = (val || 'ar').trim().toLowerCase()
  if (clean === 'en' || clean === 'ru' || clean === 'ka') return clean
  return 'ar'
}

export function normalizeCountry(val?: string | null): CountryCode {
  // تثبيت السوق الحالي على جورجيا (GE) افتراضياً
  const clean = (val || 'GE').trim().toUpperCase()
  if (clean === 'EG' || clean === 'RU' || clean === 'GE' || clean === 'AE') {
    return clean
  }
  return 'GE'
}

export function getCurrencySymbol(
  country?: string | null,
  locale?: string | null
): string {
  const c = normalizeCountry(country)
  const l = normalizeLocale(locale)
  const isArabic = l === 'ar'

  switch (c) {
    case 'EG':
      return isArabic ? 'ج.م' : 'EGP'
    case 'AE':
      return isArabic ? 'د.إ' : 'AED'
    case 'RU':
      return '₽'
    case 'GE':
      return '$'
    default:
      return isArabic ? 'ج.م' : 'EGP'
  }
}