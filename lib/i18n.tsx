"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  type LocaleCode,
  type CountryCode,
  type Dictionary,
  DICTIONARIES,
  normalizeLocale,
  normalizeCountry,
  getCurrencySymbol
} from './i18n-config'

// إعادة التصدير (Re-export) حتى لا تتعطل الصفحات الأخرى التي تستورد من هنا
export type { LocaleCode, CountryCode, Dictionary }
export { DICTIONARIES, normalizeLocale, normalizeCountry, getCurrencySymbol }

type I18nContextType = {
  locale: LocaleCode
  country: CountryCode
  dir: 'rtl' | 'ltr'
  isRtl: boolean
  t: Dictionary
  currency: string
}

const I18nContext = createContext<I18nContextType>({
  locale: 'ar',
  country: 'EG',
  dir: 'rtl',
  isRtl: true,
  t: DICTIONARIES.ar,
  currency: 'ج.م',
})

export function LanguageProvider({
  initialLocale = 'ar',
  initialCountry = 'EG',
  children,
}: {
  initialLocale?: LocaleCode
  initialCountry?: CountryCode
  children: React.ReactNode
}) {
  const [locale, setLocale] = useState<LocaleCode>(initialLocale)
  const [country, setCountry] = useState<CountryCode>(initialCountry)

  useEffect(() => {
    setLocale(initialLocale)
  }, [initialLocale])

  useEffect(() => {
    setCountry(initialCountry)
  }, [initialCountry])

  useEffect(() => {
    const syncFromCookies = () => {
      const cookiesArr = document.cookie.split('; ')
      const langRow = cookiesArr.find((r) => r.startsWith('locale='))
      const countryRow = cookiesArr.find((r) => r.startsWith('darak_country='))

      if (langRow) setLocale(normalizeLocale(langRow.split('=')[1]))
      if (countryRow) setCountry(normalizeCountry(countryRow.split('=')[1]))
    }

    window.addEventListener('language-changed', syncFromCookies)
    window.addEventListener('country-changed', syncFromCookies)
    return () => {
      window.removeEventListener('language-changed', syncFromCookies)
      window.removeEventListener('country-changed', syncFromCookies)
    }
  }, [])

  const dir = locale === 'ar' ? 'rtl' : 'ltr'
  const t = DICTIONARIES[locale] || DICTIONARIES.ar
  const currency = getCurrencySymbol(country, locale)

  return (
    <I18nContext.Provider
      value={{
        locale,
        country,
        dir,
        isRtl: dir === 'rtl',
        t,
        currency,
      }}
    >
      {children}
    </I18nContext.Provider>
  )
}

export function useTranslation() {
  return useContext(I18nContext)
}
