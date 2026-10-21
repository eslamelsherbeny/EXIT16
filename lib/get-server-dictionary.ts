import { cookies } from 'next/headers'
import {
  DICTIONARIES,
  getCurrencySymbol,
  normalizeCountry,
  normalizeLocale,
} from './i18n-config'

export async function getServerI18n() {
  const cookieStore = await cookies()
  const locale = normalizeLocale(cookieStore.get('locale')?.value)
  const country = normalizeCountry(cookieStore.get('darak_country')?.value)
  const dir = locale === 'ar' ? ('rtl' as const) : ('ltr' as const)
  const dict = DICTIONARIES[locale] || DICTIONARIES.ar
  const currency = getCurrencySymbol(country, locale)

  return {
    locale,
    country,
    dir,
    isRtl: dir === 'rtl',
    dict,
    currency,
  }
}
