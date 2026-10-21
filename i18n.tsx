"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import ar from '@/dictionaries/ar.json'
import en from '@/dictionaries/en.json'
import ru from '@/dictionaries/ru.json'
import ka from '@/dictionaries/ka.json'

export type LocaleCode = 'ar' | 'en' | 'ru' | 'ka'
export type CountryCode = 'EG' | 'RU' | 'GE' | 'AE'
export type Dictionary = typeof ar

// المكان الوحيد في الموقع الذي يستورد ملفات الترجمة
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
  const clean = (val || 'EG').trim().toUpperCase()
  if (clean === 'RU' || clean === 'GE' || clean === 'AE') return clean
  return 'EG'
}

// دالة ذكية وموحدة للعملة حسب الدولة ولغة العرض الحالية
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
  t: ar,
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
      const cookies = document.cookie.split('; ')
      const langRow = cookies.find((r) => r.startsWith('locale='))
      const countryRow = cookies.find((r) => r.startsWith('darak_country='))

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
  const t = DICTIONARIES[locale] || ar
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

// الـ Hook الذي ستستخدمه في أي Client Component بسطر واحد فقط
export function useTranslation() {
  return useContext(I18nContext)
}
