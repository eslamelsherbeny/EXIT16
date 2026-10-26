"use client"

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Globe, MessageCircle, ShieldCheck, Wrench } from 'lucide-react'
import { getPublicSiteRuntimeConfigAction } from '@/actions/admin-actions'
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

export type { LocaleCode, CountryCode, Dictionary }
export {
  DICTIONARIES,
  SUPPORTED_LANGUAGES,
  normalizeLocale,
  normalizeCountry,
  getCurrencySymbol,
}

export type SiteSettingsClient = {
  siteName?: string
  whatsappNumber?: string
  supportEmail?: string
  buyerCommission?: string
  maintenanceMode?: boolean
  allowNewSells?: boolean
  allowNewBuys?: boolean
  emailNotifications?: boolean
}

type I18nContextType = {
  locale: LocaleCode
  country: CountryCode
  dir: 'rtl' | 'ltr'
  isRtl: boolean
  t: Dictionary
  currency: string
  siteSettings: SiteSettingsClient
  hasSession: boolean
  isStaff: boolean
}

const I18nContext = createContext<I18nContextType>({
  locale: 'ar',
  country: 'GE',
  dir: 'rtl',
  isRtl: true,
  t: DICTIONARIES.ar,
  currency: '$',
  siteSettings: {},
  hasSession: false,
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

export function LanguageProvider({
  initialLocale = 'ar',
  initialCountry = 'GE',
  initialSiteSettings,
  initialHasSession = false,
  initialIsStaff = false,
  children,
}: {
  initialLocale?: LocaleCode
  initialCountry?: CountryCode
  initialSiteSettings?: SiteSettingsClient
  initialHasSession?: boolean
  initialIsStaff?: boolean
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  const [locale, setLocale] = useState<LocaleCode>(initialLocale)
  const [country] = useState<CountryCode>('GE')
  const [siteSettings, setSiteSettings] = useState<SiteSettingsClient>(
    initialSiteSettings || {}
  )
  const [hasSession, setHasSession] = useState<boolean>(initialHasSession)
  const [isStaff, setIsStaff] = useState<boolean>(initialIsStaff)

  useEffect(() => {
    setLocale(initialLocale)
  }, [initialLocale])

  useEffect(() => {
    if (initialSiteSettings) setSiteSettings(initialSiteSettings)
  }, [initialSiteSettings])

  useEffect(() => {
    setHasSession(initialHasSession)
  }, [initialHasSession])

  useEffect(() => {
    setIsStaff(initialIsStaff)
  }, [initialIsStaff])

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.cookie = 'darak_site_settings=; path=/; max-age=0'
      document.cookie = 'darak_country=GE; path=/; max-age=31536000; SameSite=Lax'
    }

    let isMounted = true

    const syncLocaleCookies = () => {
      const langVal = readCookieValue('locale')
      if (langVal) setLocale(normalizeLocale(langVal))
    }

    const syncServerSettings = async () => {
      try {
        const res = await getPublicSiteRuntimeConfigAction()
        if (isMounted && res) {
          setSiteSettings(res.siteSettings || {})
          setIsStaff(Boolean(res.isStaff))
        }
      } catch {}
    }

    syncLocaleCookies()
    syncServerSettings()

    window.addEventListener('language-changed', syncLocaleCookies)
    window.addEventListener('site-settings-changed', syncServerSettings)
    window.addEventListener('focus', syncServerSettings)

    return () => {
      isMounted = false
      window.removeEventListener('language-changed', syncLocaleCookies)
      window.removeEventListener('site-settings-changed', syncServerSettings)
      window.removeEventListener('focus', syncServerSettings)
    }
  }, [pathname])

  const dir = locale === 'ar' ? 'rtl' : 'ltr'
  const currency = getCurrencySymbol('GE', locale)

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

  useEffect(() => {
    const configuredWaDigits = String(
      siteSettings.whatsappNumber || ''
    ).replace(/\D/g, '')
    if (!configuredWaDigits) return

    const updateAllWhatsAppLinks = () => {
      const anchors =
        document.querySelectorAll<HTMLAnchorElement>('a[href*="wa.me/"]')
      anchors.forEach((a) => {
        const currentHref = a.getAttribute('href') || ''
        if (currentHref.includes('201018595959')) {
          a.setAttribute(
            'href',
            currentHref.replace(/201018595959/g, configuredWaDigits)
          )
        }
      })
    }

    updateAllWhatsAppLinks()

    const handleGlobalClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest?.('a')
      if (!target) return
      const href = target.getAttribute('href') || ''
      if (href.includes('wa.me/201018595959')) {
        target.setAttribute(
          'href',
          href.replace(/201018595959/g, configuredWaDigits)
        )
      }
    }

    document.addEventListener('click', handleGlobalClick, true)
    return () => document.removeEventListener('click', handleGlobalClick, true)
  }, [siteSettings.whatsappNumber, pathname])

  const switchLanguage = (nextLocale: LocaleCode) => {
    const cfg = SUPPORTED_LANGUAGES[nextLocale]
    document.cookie = `locale=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`
    document.documentElement.lang = nextLocale
    document.documentElement.dir = cfg.dir
    setLocale(nextLocale)
    window.dispatchEvent(new Event('language-changed'))
    router.refresh()
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

  const sysPages = (t.systemPages as Record<string, any>) || {}
  const maintenanceDict = sysPages.maintenance || {
    badge: t.admin?.settings?.statusCardTitle,
    title: t.admin?.settings?.maintenanceTitle?.split('(')[0],
    description: t.admin?.settings?.maintenanceDesc,
    whatsappBtn: t.publicPages?.contact?.whatsappTitle,
    staffLoginBtn: t.admin?.accessDenied?.staffLoginBtn,
    staffBannerText: t.admin?.settings?.maintenanceTitle,
    staffManageBtn: t.admin?.shell?.nav?.settings,
  }

  const activeWaPhone = String(
    siteSettings.whatsappNumber || t.footer?.phone || '+201018595959'
  ).trim()

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
        hasSession,
        isStaff,
      }}
    >
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

      {showMaintenanceWall ? (
        <div
          dir={dir}
          className="flex min-h-screen flex-col items-center justify-center bg-[#0a1122] px-4 py-10 text-center text-white"
        >
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-md sm:p-9">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-extrabold text-amber-300">
                <Wrench className="size-3.5 shrink-0" />
                <span>{maintenanceDict.badge}</span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-white/10 p-1">
                {(
                  Object.values(SUPPORTED_LANGUAGES) as Array<
                    (typeof SUPPORTED_LANGUAGES)[LocaleCode]
                  >
                ).map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => switchLanguage(lang.code)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                      locale === lang.code
                        ? 'bg-[#105C50] text-white shadow-2xs'
                        : 'text-white/75 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {lang.nativeName}
                  </button>
                ))}
              </div>
            </div>

            <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-[#105C50] text-2xl font-black text-white shadow-lg">
              AE
            </div>

            <h1 className="text-xl leading-snug font-black text-white sm:text-2xl">
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