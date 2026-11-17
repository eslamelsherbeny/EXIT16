import ar from '@/dictionaries/ar.json'
import en from '@/dictionaries/en.json'
import ru from '@/dictionaries/ru.json'
import ka from '@/dictionaries/ka.json'

export type LocaleCode = 'ar' | 'en' | 'ru' | 'ka'
export type CountryCode = 'GE' | 'EG' | 'RU' | 'AE'
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
  ar: { code: 'ar', shortCode: 'AR', nativeName: ar.navbar.languageOptions.ar, dir: 'rtl' },
  en: { code: 'en', shortCode: 'EN', nativeName: en.navbar.languageOptions.en, dir: 'ltr' },
  ru: { code: 'ru', shortCode: 'RU', nativeName: ru.navbar.languageOptions.ru, dir: 'ltr' },
  ka: { code: 'ka', shortCode: 'KA', nativeName: ka.navbar.languageOptions.ka, dir: 'ltr' },
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
  const clean = (val || 'GE').trim().toUpperCase()
  if (clean === 'GE' || clean === 'EG' || clean === 'RU' || clean === 'AE') {
    return clean
  }
  return 'GE'
}

export function getCurrencySymbol(
  country?: string | null,
  _locale?: string | null
): string {
  const c = normalizeCountry(country)

  switch (c) {
    case 'GE':
      return '$'
    case 'EG':
      return 'EGP'
    case 'AE':
      return 'AED'
    case 'RU':
      return '₽'
    default:
      return '$'
  }
}