"use client"

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Globe, MessageCircle, ShieldCheck, Wrench } from 'lucide-react'
import {
  type LocaleCode,
  type CountryCode,
  type Dictionary,
  DICTIONARIES,
  SUPPORTED_LANGUAGES,
  normalizeLocale,
  normalizeCountry,
  getCurrencySymbol,
} from './i18n-config'

// إعادة التصدير (Re-export) حتى لا تتعطل الصفحات الأخرى التي تستورد من هنا
export type { LocaleCode, CountryCode, Dictionary }
export {
  DICTIONARIES,
  SUPPORTED_LANGUAGES,
  normalizeLocale,
  normalizeCountry,
  getCurrencySymbol,
}

type SiteSettingsClient = {
  siteName?: string
  whatsappNumber?: string
  supportEmail?: string
  buyerCommission?: string
  maintenanceMode?: boolean
  allowNewSells?: boolean
  allowNewBuys?: boolean
}

type I18nContextType = {
  locale: LocaleCode
  country: CountryCode
  dir: 'rtl' | 'ltr'
  isRtl: boolean
  t: Dictionary
  currency: string
  siteSettings: SiteSettingsClient
  isStaff: boolean
}

const I18nContext = createContext<I18nContextType>({
  locale: 'ar',
  country: 'EG',
  dir: 'rtl',
  isRtl: true,
  t: DICTIONARIES.ar,
  currency: 'ج.م',
  siteSettings: {},
  isStaff: false,
})

function readCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null
  const row = document.cookie
    .split('; ')
    .find((r) => r.startsWith(`${name}=`))
  if (!row) return null
  return decodeURIComponent(row.split('=').slice(1).join('='))
}

function parseSiteSettingsCookie(): SiteSettingsClient {
  try {
    const raw = readCookieValue('darak_site_settings')
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function checkIsStaffFromCookies(): boolean {
  try {
    const rawHint = readCookieValue('session_hint')
    if (!rawHint) return false
    const parsed = JSON.parse(rawHint)
    const role = String(parsed?.role || '').toUpperCase()
    return role === 'ADMIN' || role === 'MODERATOR' || role === 'SALES'
  } catch {
    return false
  }
}

export function LanguageProvider({
  initialLocale = 'ar',
  initialCountry = 'EG',
  children,
}: {
  initialLocale?: LocaleCode
  initialCountry?: CountryCode
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [locale, setLocale] = useState<LocaleCode>(initialLocale)
  const [country, setCountry] = useState<CountryCode>(initialCountry)
  const [siteSettings, setSiteSettings] = useState<SiteSettingsClient>({})
  const [isStaff, setIsStaff] = useState<boolean>(false)

  useEffect(() => {
    setLocale(initialLocale)
  }, [initialLocale])

  useEffect(() => {
    setCountry(initialCountry)
  }, [initialCountry])

  useEffect(() => {
    const syncFromCookies = () => {
      const langVal = readCookieValue('locale')
      const countryVal =
        readCookieValue('darak_country') || readCookieValue('country')

      if (langVal) setLocale(normalizeLocale(langVal))
      if (countryVal) setCountry(normalizeCountry(countryVal))

      setSiteSettings(parseSiteSettingsCookie())
      setIsStaff(checkIsStaffFromCookies())
    }

    syncFromCookies()

    window.addEventListener('language-changed', syncFromCookies)
    window.addEventListener('country-changed', syncFromCookies)
    window.addEventListener('site-settings-changed', syncFromCookies)
    window.addEventListener('focus', syncFromCookies)

    return () => {
      window.removeEventListener('language-changed', syncFromCookies)
      window.removeEventListener('country-changed', syncFromCookies)
      window.removeEventListener('site-settings-changed', syncFromCookies)
      window.removeEventListener('focus', syncFromCookies)
    }
  }, [pathname])

  const dir = locale === 'ar' ? 'rtl' : 'ltr'
  const currency = getCurrencySymbol(country, locale)

  // دمج رقم الواتساب والإيميل واسم المنصة من الإعدادات داخل القاموس مباشرة
  const t = useMemo(() => {
    const base = DICTIONARIES[locale] || DICTIONARIES.ar
    const cloned = structuredClone(base) as Dictionary & Record<string, any>

    if (siteSettings.whatsappNumber) {
      const cleanWa = String(siteSettings.whatsappNumber).trim()
      if (cloned.footer) cloned.footer.phone = cleanWa
      if (cloned.publicPages?.contact) {
        cloned.publicPages.contact.whatsappValue = cleanWa
      }
    }

    if (siteSettings.supportEmail) {
      const cleanEmail = String(siteSettings.supportEmail).trim()
      if (cloned.footer) cloned.footer.email = cleanEmail
      if (cloned.publicPages?.contact) {
        cloned.publicPages.contact.emailValue = cleanEmail
      }
    }

    return cloned
  }, [locale, siteSettings])

  // تحويل أي رابط واتساب عام على الموقع تلقائياً إلى الرقم الجديد المحفوظ في الإعدادات
  useEffect(() => {
    const configuredWaDigits = String(
      siteSettings.whatsappNumber || ''
    ).replace(/\D/g, '')
    if (!configuredWaDigits) return

    const handleGlobalClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest?.('a')
      if (!target) return
      const href = target.getAttribute('href') || ''
      if (href.includes('wa.me/201018595959')) {
        target.setAttribute(
          'href',
          href.replace('201018595959', configuredWaDigits)
        )
      }
    }

    document.addEventListener('click', handleGlobalClick, true)
    return () => document.removeEventListener('click', handleGlobalClick, true)
  }, [siteSettings.whatsappNumber])

  const switchLanguage = (nextLocale: LocaleCode) => {
    const cfg = SUPPORTED_LANGUAGES[nextLocale]
    document.cookie = `locale=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`
    document.documentElement.lang = nextLocale
    document.documentElement.dir = cfg.dir
    setLocale(nextLocale)
    window.dispatchEvent(new Event('language-changed'))
  }

  const isAuthOrAdminRoute =
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/reset-password') ||
    pathname?.startsWith('/set-password')

  const showMaintenanceWall =
    Boolean(siteSettings.maintenanceMode) && !isStaff && !isAuthOrAdminRoute

  const showStaffMaintenanceBanner =
    Boolean(siteSettings.maintenanceMode) &&
    isStaff &&
    !pathname?.startsWith('/admin')

  const maintenanceDict =
    (t.systemPages as Record<string, any>)?.maintenance || {}
  const activeWaPhone = String(
    siteSettings.whatsappNumber || t.footer?.phone || '+201018595959'
  )

  return (
    <I18nContext.Provider
      value={{
        locale,
        country,
        dir,
        isRtl: dir === 'rtl',
        t,
        currency,
        siteSettings,
        isStaff,
      }}
    >
      {/* شريط علوي صغير يظهر لك أنت والمشرفين والمبيعات فقط عند تصفح الموقع العام أثناء تفعيل وضع الصيانة */}
      {showStaffMaintenanceBanner && (
        <div
          dir={dir}
          className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-2 bg-amber-500 px-4 py-2 text-xs font-extrabold text-[#0a1122] shadow-md"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 shrink-0" />
            <span>{maintenanceDict.staffBannerText}</span>
          </div>
          <Link
            href="/admin/settings"
            className="rounded-lg bg-[#0a1122] px-3 py-1 text-[11px] font-bold text-white transition hover:opacity-90"
          >
            {maintenanceDict.staffManageBtn}
          </Link>
        </div>
      )}

      {/* شاشة الصيانة والتحديثات للزوار العاديين فقط */}
      {showMaintenanceWall ? (
        <div
          dir={dir}
          className="flex min-h-screen flex-col items-center justify-center bg-[#0a1122] px-4 py-10 text-center text-white"
        >
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-7 shadow-2xl backdrop-blur-md sm:p-9">
            <div className="mb-6 flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-[11px] font-extrabold text-amber-300">
                <Wrench className="size-3.5" />
                <span>{maintenanceDict.badge}</span>
              </div>

              <div className="flex items-center gap-1 rounded-xl bg-white/10 p-1">
                {(['ar', 'en', 'ru', 'ka'] as LocaleCode[]).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => switchLanguage(code)}
                    className={`rounded-lg px-2 py-1 text-[10px] font-extrabold transition ${
                      locale === code
                        ? 'bg-[#105C50] text-white'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    {SUPPORTED_LANGUAGES[code].shortCode}
                  </button>
                ))}
              </div>
            </div>

            <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-[#105C50] text-2xl font-black text-white shadow-lg">
              AE
            </div>

            <h1 className="text-2xl font-black text-white sm:text-3xl">
              {maintenanceDict.title}
            </h1>

            <p className="mt-3 text-xs leading-relaxed text-white/75 sm:text-sm">
              {maintenanceDict.description}
            </p>

            <div className="mt-7 space-y-3">
              <a
                href={`https://wa.me/${activeWaPhone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 text-xs font-extrabold text-white shadow-md transition hover:opacity-95 sm:text-sm"
              >
                <MessageCircle className="size-4 shrink-0" />
                <span>{maintenanceDict.whatsappBtn}</span>
                <span dir="ltr" className="font-mono">
                  ({activeWaPhone})
                </span>
              </a>

              <div className="pt-2">
                <Link
                  href="/login?next=/admin"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white/50 underline transition hover:text-white"
                >
                  <Globe className="size-3.5" />
                  <span>{maintenanceDict.staffLoginBtn}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        children
      )}
    </I18nContext.Provider>
  )
}

export function useTranslation() {
  return useContext(I18nContext)
}