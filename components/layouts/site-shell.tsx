'use client'

import { useEffect, useRef, useState, useTransition, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Bell,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  Flame,
  Heart,
  Loader2,
  Menu,
  Plus,
  ShieldCheck,
  Trash2,
  User,
  WalletCards,
  X,
} from 'lucide-react'
import * as authActions from '@/actions/auth-actions'
import { getCurrentSellerProfileAction } from '@/actions/submit-forms'
import {
  clearAllNotificationsAction,
  deleteNotificationAction,
  getUserNotificationsAction,
  markAllNotificationsAsReadAction,
  markNotificationAsReadAction,
} from '@/actions/notification-actions'
import {
  useTranslation,
  type CountryCode,
  type LocaleCode,
  type Dictionary,
} from '@/lib/i18n'

export type LanguageCode = LocaleCode

export type LanguageConfig = {
  code: LanguageCode
  label: string
  nativeName: string
  shortCode: string
  flagCode: 'AR' | 'EN' | 'RU' | 'GE'
  dir: 'rtl' | 'ltr'
}

export const SUPPORTED_LANGUAGES: Record<LanguageCode, LanguageConfig> = {
  ar: { code: 'ar', label: 'العربية', nativeName: 'العربية', shortCode: 'AR', flagCode: 'AR', dir: 'rtl' },
  en: { code: 'en', label: 'الإنجليزية', nativeName: 'English', shortCode: 'EN', flagCode: 'EN', dir: 'ltr' },
  ru: { code: 'ru', label: 'الروسية', nativeName: 'Русский', shortCode: 'RU', flagCode: 'RU', dir: 'ltr' },
  ka: { code: 'ka', label: 'الجورجية', nativeName: 'ქართული', shortCode: 'KA', flagCode: 'GE', dir: 'ltr' },
}

export type { CountryCode }

export type CountryConfig = {
  code: CountryCode
  nameAr: string
  nameEn: string
  nameRu: string
  nameKa: string
  flag: string
  currencyCode: string
  currencySymbol: string
  phoneCode: string
  comingSoon?: boolean
}

export const SUPPORTED_COUNTRIES: Record<CountryCode, CountryConfig> = {
  GE: { code: 'GE', nameAr: 'جورجيا', nameEn: 'Georgia', nameRu: 'Грузия', nameKa: 'საქართველო', flag: '🇬🇪', currencyCode: 'GEL', currencySymbol: '₾', phoneCode: '+995', comingSoon: false },
  EG: { code: 'EG', nameAr: 'مصر', nameEn: 'Egypt', nameRu: 'Египет', nameKa: 'ეგვიპტე', flag: '🇪🇬', currencyCode: 'EGP', currencySymbol: 'ج.م', phoneCode: '+20', comingSoon: true },
  AE: { code: 'AE', nameAr: 'الإمارات', nameEn: 'UAE', nameRu: 'ОАЭ', nameKa: 'საამიროები', flag: '🇦🇪', currencyCode: 'AED', currencySymbol: 'د.إ', phoneCode: '+971', comingSoon: true },
  RU: { code: 'RU', nameAr: 'روسيا', nameEn: 'Russia', nameRu: 'Россия', nameKa: 'რუსეთი', flag: '🇷🇺', currencyCode: 'RUB', currencySymbol: '₽', phoneCode: '+7', comingSoon: true },
}

export function CountryFlag({ code, className = 'h-3.5 w-5' }: { code: CountryCode | string; className?: string }) {
  const cleanCode = (code || 'GE').toUpperCase()
  if (cleanCode === 'GE' || cleanCode === 'KA') {
    return (
      <svg viewBox="0 0 30 20" className={`${className} shrink-0 overflow-hidden rounded-[2px] border border-black/10`} aria-hidden="true">
        <rect width="30" height="20" fill="#fff" />
        <rect width="30" height="4" y="8" fill="#ff0000" />
        <rect width="4" height="20" x="13" fill="#ff0000" />
        <path d="M5.5 2.5h2v3h-2zM4.5 3.5h4v1h-4zM22.5 2.5h2v3h-2zM21.5 3.5h4v1h-4zM5.5 14.5h2v3h-2zM4.5 15.5h4v1h-4zM22.5 14.5h2v3h-2zM21.5 15.5h4v1h-4z" fill="#ff0000" />
      </svg>
    )
  }
  if (cleanCode === 'EN' || cleanCode === 'GB' || cleanCode === 'US') {
    return (
      <svg viewBox="0 0 30 20" className={`${className} shrink-0 overflow-hidden rounded-[2px] border border-black/10`} aria-hidden="true">
        <rect width="30" height="20" fill="#012169" />
        <path d="M0 0l30 20M30 0L0 20" stroke="#fff" strokeWidth="3.5" />
        <path d="M0 0l30 20M30 0L0 20" stroke="#C8102E" strokeWidth="1.8" />
        <path d="M15 0v20M0 10h30" stroke="#fff" strokeWidth="5.5" />
        <path d="M15 0v20M0 10h30" stroke="#C8102E" strokeWidth="3.2" />
      </svg>
    )
  }
  if (cleanCode === 'AR' || cleanCode === 'SA') {
    return (
      <svg viewBox="0 0 30 20" className={`${className} shrink-0 overflow-hidden rounded-[2px] border border-black/10`} aria-hidden="true">
        <rect width="30" height="20" fill="#006C35" />
        <rect width="14" height="2" x="8" y="13" rx="1" fill="#fff" />
        <path d="M9 8.5h12v1.8H9z" fill="#fff" opacity="0.85" />
      </svg>
    )
  }
  if (cleanCode === 'RU') {
    return (
      <svg viewBox="0 0 30 20" className={`${className} shrink-0 overflow-hidden rounded-[2px] border border-black/10`} aria-hidden="true">
        <rect width="30" height="6.67" y="0" fill="#fff" />
        <rect width="30" height="6.67" y="6.67" fill="#0039a6" />
        <rect width="30" height="6.67" y="13.33" fill="#d52b1e" />
      </svg>
    )
  }
  if (cleanCode === 'EG') {
    return (
      <svg viewBox="0 0 30 20" className={`${className} shrink-0 overflow-hidden rounded-[2px] border border-black/10`} aria-hidden="true">
        <rect width="30" height="20" fill="#fff" />
        <rect width="30" height="6.67" y="0" fill="#ce1126" />
        <rect width="30" height="6.67" y="13.33" fill="#000" />
        <path d="M13.6 7.8h2.8l.4 4.2h-3.6z" fill="#c09300" />
      </svg>
    )
  }
  if (cleanCode === 'AE') {
    return (
      <svg viewBox="0 0 30 20" className={`${className} shrink-0 overflow-hidden rounded-[2px] border border-black/10`} aria-hidden="true">
        <rect width="30" height="6.67" y="0" fill="#00732f" />
        <rect width="30" height="6.67" y="6.67" fill="#fff" />
        <rect width="30" height="6.67" y="13.33" fill="#000" />
        <rect width="8" height="20" x="0" fill="#ff0000" />
      </svg>
    )
  }
  return null
}

function getCountryName(c: CountryConfig, lang: LanguageCode) {
  if (lang === 'ar') return c.nameAr
  if (lang === 'ru') return c.nameRu
  if (lang === 'ka') return c.nameKa
  return c.nameEn
}

function getSoonLabel(lang: LanguageCode) {
  if (lang === 'ar') return 'قريباً'
  if (lang === 'ru') return 'Скоро'
  if (lang === 'ka') return 'მალე'
  return 'Soon'
}

function getGuestLoginLabel(lang: LanguageCode, dictNavbar?: Record<string, any>) {
  if (dictNavbar?.loginGuest) return dictNavbar.loginGuest
  if (lang === 'ar') return 'دخول'
  if (lang === 'ru') return 'Войти'
  if (lang === 'ka') return 'შესვლა'
  return 'Login'
}

function getMyAccountLabel(lang: LanguageCode, dictNavbar?: Record<string, any>) {
  if (dictNavbar?.myAccount) return dictNavbar.myAccount
  if (lang === 'ar') return 'حسابي'
  if (lang === 'ru') return 'Кабинет'
  if (lang === 'ka') return 'ანგარიში'
  return 'My Account'
}

export function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link href="/" dir="ltr" className={`inline-block shrink-0 select-none ${inverse ? 'text-white' : 'text-[#1e3a8a]'}`} aria-label="Aqar Exit">
      <svg width="106" height="48" viewBox="0 0 116 54" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-[38px] w-auto sm:h-[42px]">
        <path d="M5 30L17.5 5.5C18.2 4.1 19.8 4.1 20.5 5.5L33 30" stroke="currentColor" strokeWidth="3.3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="46.5" cy="20" r="9.2" stroke="currentColor" strokeWidth="3.2" />
        <path d="M55.7 10.8V35.5C55.7 37.5 56.8 38.8 58.8 38.8" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
        <circle cx="72" cy="20" r="9.2" stroke="currentColor" strokeWidth="3.2" />
        <path d="M81.2 10.8V29.5" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
        <path d="M90.5 29.5V17.5C90.5 13.2 93.8 10.8 98 10.8H100.5" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
        <path d="M66 35.5C61 34.5 56.5 36.8 56.5 39.8C56.5 42.2 59.5 43.2 63 42.8C58.5 43.5 54.5 45.8 55 48.8C55.5 51.8 60.5 52.5 65.5 50.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M69 42.5L76.5 50M77 42.2C73.5 45 70.5 48 67.5 50.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M81.5 43.2L79.5 49.5C79.2 50.3 79.8 50.8 80.8 50.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="82.5" cy="39.5" r="1" fill="currentColor" />
        <path d="M90.5 34.5L86 50.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M83 41.2C88 40.5 94 39.8 100 39.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </Link>
  )
}

export function Navbar({ dictionary: _unused }: { dictionary?: Dictionary }) {
  const router = useRouter()
  const pathname = usePathname()

  const i18nCtx = useTranslation() as Record<string, any>
  const labels = i18nCtx.t
  const language: LanguageCode = i18nCtx.locale || 'ar'
  const dir = i18nCtx.dir || 'rtl'
  const initialServerLoggedIn = Boolean(i18nCtx.hasSession ?? i18nCtx.isLoggedIn)
  const initialServerIsStaff = Boolean(i18nCtx.isStaff)

  const [scrolled, setScrolled] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const [hasSession, setHasSession] = useState<boolean>(initialServerLoggedIn)
  const [isAdmin, setIsAdmin] = useState<boolean>(initialServerIsStaff)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const [isSwitchingLocale, startSwitchTransition] = useTransition()
  const [switchingLabel, setSwitchingLabel] = useState<string | null>(null)

  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifsList, setNotifsList] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [, startNotifTransition] = useTransition()

  const notifRefDesktop = useRef<HTMLDivElement>(null)
  const notifRefMobile = useRef<HTMLDivElement>(null)
  const langRefDesktop = useRef<HTMLDivElement>(null)
  const langRefMobile = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setHasSession(initialServerLoggedIn)
  }, [initialServerLoggedIn])

  useEffect(() => {
    setIsAdmin(initialServerIsStaff)
  }, [initialServerIsStaff])

  useEffect(() => {
    if (!isSwitchingLocale) {
      setSwitchingLabel(null)
    }
  }, [isSwitchingLocale])

  const handleSelectLanguage = (code: LanguageCode) => {
    if (code === language) {
      setLangMenuOpen(false)
      return
    }
    const targetLang = SUPPORTED_LANGUAGES[code]
    setLangMenuOpen(false)
    setMobileMenuOpen(false)
    setSwitchingLabel(`${targetLang.nativeName}...`)
    document.cookie = `locale=${code}; path=/; max-age=31536000; SameSite=Lax`
    document.documentElement.lang = code
    document.documentElement.dir = targetLang.dir
    window.dispatchEvent(new Event('language-changed'))
    startSwitchTransition(() => {
      router.refresh()
    })
  }

  useEffect(() => {
    let isMounted = true
    async function verifyUserAndRole() {
      try {
        let verifiedLoggedIn = false
        const actionFn = (authActions as any).getSessionUserAction

        if (typeof actionFn === 'function') {
          const sessionData = await actionFn()
          if (isMounted && sessionData) {
            verifiedLoggedIn = Boolean(sessionData.isLoggedIn)
            setHasSession(verifiedLoggedIn)
            setIsAdmin(Boolean(sessionData.isAdmin))
          }
        } else {
          const profileRes = await getCurrentSellerProfileAction()
          if (isMounted) {
            verifiedLoggedIn = Boolean(profileRes.isLoggedIn && profileRes.user?.id)
            setHasSession(verifiedLoggedIn)
          }
        }

        if (!verifiedLoggedIn && isMounted) {
          document.cookie = 'session_hint=; path=/; max-age=0; SameSite=Lax'
        }

        if (verifiedLoggedIn) {
          const notifRes = await getUserNotificationsAction('client')
          if (isMounted && notifRes.success) {
            setNotifsList(notifRes.notifications)
            setUnreadCount(notifRes.unreadCount)
          }
        }
      } catch (err) {
        console.error('Session/Notif check error:', err)
      }
    }
    verifyUserAndRole()
    return () => {
      isMounted = false
    }
  }, [pathname])

  useEffect(() => {
    setMobileMenuOpen(false)
    setNotificationsOpen(false)
    setLangMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      const insideDesktopNotif = notifRefDesktop.current?.contains(target)
      const insideMobileNotif = notifRefMobile.current?.contains(target)
      const insideDesktopLang = langRefDesktop.current?.contains(target)
      const insideMobileLang = langRefMobile.current?.contains(target)

      if (!insideDesktopNotif && !insideMobileNotif) {
        setNotificationsOpen(false)
      }
      if (!insideDesktopLang && !insideMobileLang) {
        setLangMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleToggleNotifications = () => {
    const nextState = !notificationsOpen
    setNotificationsOpen(nextState)
    setLangMenuOpen(false)

    if (nextState && unreadCount > 0) {
      setUnreadCount(0)
      setNotifsList((prev) => prev.map((n) => ({ ...n, is_read: true })))
      startNotifTransition(async () => {
        await markAllNotificationsAsReadAction('client')
      })
    }
  }

  const handleSingleNotifClick = (item: any) => {
    const targetUrl = item.link && item.link !== '/' ? item.link : '/account'

    setNotificationsOpen(false)
    setNotifsList((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))

    startNotifTransition(async () => {
      await markNotificationAsReadAction(item.id)
    })

    window.location.href = targetUrl
  }

  const handleDeleteNotification = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    e.preventDefault()

    const target = notifsList.find((n) => n.id === id)
    if (target && !target.is_read) {
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
    setNotifsList((prev) => prev.filter((n) => n.id !== id))

    startNotifTransition(async () => {
      await deleteNotificationAction(id)
    })
  }

  const handleClearAllNotifications = (e: React.MouseEvent) => {
    e.stopPropagation()
    setNotifsList([])
    setUnreadCount(0)

    startNotifTransition(async () => {
      await clearAllNotificationsAction('client')
    })
  }

  const currentLangCfg = SUPPORTED_LANGUAGES[language] || SUPPORTED_LANGUAGES.ar

  const navItems = [
    {
      href: '/opportunities?category=exit',
      label: language === 'ar' ? 'تنازل وأقساط' : language === 'ru' ? 'Переуступка' : language === 'ka' ? 'გადაბარება' : 'Installment Exit',
      isCore: true,
    },
    {
      href: '/opportunities?category=sale',
      label: language === 'ar' ? 'للبيع' : language === 'ru' ? 'Продажа' : language === 'ka' ? 'იყიდება' : 'For sale',
    },
    {
      href: '/opportunities?category=rent_monthly',
      label: language === 'ar' ? 'للإيجار' : language === 'ru' ? 'Аренда' : language === 'ka' ? 'ქირავდება' : 'For rent',
    },
    {
      href: '/opportunities?category=rent_daily',
      label: language === 'ar' ? 'يومي' : language === 'ru' ? 'Посуточно' : language === 'ka' ? 'დღიურად' : 'Daily',
    },
    {
      href: '/how-it-works',
      label: labels?.navbar?.howItWorks || (language === 'ar' ? 'إزاي بنشتغل' : 'How it works'),
    },
    {
      href: '/story',
      label: labels?.navbar?.story || (language === 'ar' ? 'قصتنا' : 'Our Story'),
    },
  ]

  const addListingLabel = language === 'ar' ? 'إضافة إعلان' : language === 'ru' ? 'Добавить' : language === 'ka' ? 'დამატება' : 'Add a listing'
  const sellUnitBtnLabel = labels?.navbar?.sellCta || (language === 'ar' ? 'عايز تبيع' : 'Sell Unit')
  const buyUnitBtnLabel = labels?.navbar?.buy || (language === 'ar' ? 'عايز تشتري' : 'Want to Buy')

  const desktopAuthBtnLabel = hasSession
    ? getMyAccountLabel(language, labels?.navbar as Record<string, any>)
    : getGuestLoginLabel(language, labels?.navbar as Record<string, any>)

  const renderLanguageDropdownMenu = () => (
    <div onClick={(e) => e.stopPropagation()} className="absolute end-0 top-11 z-[110] w-40 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-gray-200/90 bg-white p-1.5 shadow-2xl">
      {(Object.values(SUPPORTED_LANGUAGES) as LanguageConfig[]).map((lang) => {
        const active = lang.code === language
        return (
          <button key={lang.code} type="button" onClick={() => handleSelectLanguage(lang.code)} className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold transition ${active ? 'bg-blue-50 font-bold text-[#2563eb]' : 'text-[#1e3a8a] hover:bg-gray-50'}`}>
            <div className="flex items-center gap-2">
              <CountryFlag code={lang.flagCode} className="h-3 w-4" />
              <span>{lang.nativeName}</span>
            </div>
            {active && <Check className="size-3.5 text-[#2563eb]" />}
          </button>
        )
      })}
    </div>
  )

  const renderNotificationsDropdown = (isMobile = false) => (
    <div onClick={(e) => e.stopPropagation()} className={isMobile ? 'fixed left-3 right-3 top-[76px] z-[110] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl' : 'absolute end-0 top-12 z-[110] w-96 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl'}>
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/90 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold text-[#1e3a8a]">{language === 'ar' ? 'الإشعارات' : 'Notifications'}</span>
          <span dir="ltr" className="rounded-full bg-[#2563eb]/10 px-2 py-0.5 text-[10px] font-extrabold text-[#2563eb]">{notifsList.length}</span>
        </div>
        <div className="flex items-center gap-2">
          {notifsList.length > 0 && (
            <button type="button" onClick={handleClearAllNotifications} className="rounded-lg px-2 py-1 text-[11px] font-bold text-red-600 transition hover:bg-red-50">
              {language === 'ar' ? 'مسح الكل' : 'Clear All'}
            </button>
          )}
          <button type="button" onClick={() => setNotificationsOpen(false)} className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-200/60 hover:text-gray-700" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>
      </div>

      <div className="max-h-[65vh] divide-y divide-gray-100 overflow-y-auto text-start sm:max-h-96">
        {notifsList.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
            <CheckCircle2 className="mb-2.5 size-9 text-emerald-500" />
            <p className="text-xs font-extrabold text-[#1e3a8a]">
              {language === 'ar' ? 'لا توجد إشعارات حالياً' : 'No notifications yet'}
            </p>
          </div>
        ) : (
          notifsList.map((item) => (
            <div key={item.id} onClick={() => handleSingleNotifClick(item)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleSingleNotifClick(item) }} className={`group flex cursor-pointer items-start gap-3 p-4 transition hover:bg-gray-50 active:bg-gray-100 ${!item.is_read ? 'bg-blue-50/40' : 'bg-white'}`}>
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#2563eb]">
                {item.type === 'property' || item.type === 'property_match' ? <Building2 className="size-4" /> : item.type === 'lead' ? <FileText className="size-4" /> : item.type === 'investor' ? <WalletCards className="size-4" /> : <Bell className="size-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-xs leading-snug text-[#1e3a8a] ${!item.is_read ? 'font-extrabold' : 'font-bold'}`}>{item.title}</p>
                <p className="mt-1 break-words text-[11.5px] leading-relaxed text-gray-600">{item.message}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-400">
                    <Clock className="size-3" />
                    <span dir="ltr">{item.created_at ? new Date(item.created_at).toLocaleDateString('en-US') : 'Now'}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2563eb] group-hover:underline">
                    <span>{labels.accountPages?.common?.viewDetails || 'عرض التفاصيل'}</span>
                    <ArrowLeft className="size-3 ltr:rotate-180 rtl:rotate-0" />
                  </span>
                </div>
              </div>
              <button type="button" onClick={(e) => handleDeleteNotification(e, item.id)} aria-label="Delete" className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600">
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-gray-100 bg-gray-50/70 p-2 text-center">
        <a href="/account" onClick={() => setNotificationsOpen(false)} className="block w-full rounded-xl py-2 text-xs font-extrabold text-[#2563eb] transition hover:bg-blue-50">
          {labels.accountPages?.common?.backToAccount || 'الذهاب إلى حسابي'}
        </a>
      </div>
    </div>
  )

  return (
    <header dir={dir} className={`sticky top-0 z-[90] transition-all duration-500 ${scrolled ? 'px-3 pt-2.5 sm:px-6 sm:pt-3.5 lg:px-10' : 'border-b border-slate-200/50 bg-white/85 px-0 pt-0 backdrop-blur-md'}`}>
      {isSwitchingLocale && (
        <>
          <div className="absolute inset-x-0 top-0 h-[3px] overflow-hidden bg-blue-100">
            <div className="h-full w-1/2 animate-pulse bg-[#2563eb]" />
          </div>
          <div dir="ltr" className="fixed top-[80px] left-1/2 z-[120] flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#1e3a8a]/95 px-4 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur-xs">
            <Loader2 className="size-3.5 animate-spin text-[#2ee59d]" />
            <span>{switchingLabel || 'Updating...'}</span>
          </div>
        </>
      )}

      <div className={`mx-auto flex max-w-[1420px] items-center justify-between gap-3 transition-all duration-500 ${scrolled ? 'h-[62px] rounded-full border border-slate-200/80 bg-white/95 px-5 shadow-[0_14px_34px_rgba(30,58,138,0.1)] backdrop-blur-xl sm:h-[66px] sm:px-7' : 'h-[68px] px-4 sm:h-[74px] sm:px-6 lg:px-10'}`}>
        <div className="flex items-center gap-5 xl:gap-8">
          <Logo />
          <nav className="hidden items-center gap-1 lg:flex xl:gap-1.5" aria-label={labels.navbar?.menuTitle || 'القائمة الرئيسية'}>
            {navItems.map((item) => {
              const isActive = pathname === item.href
              if (item.isCore) {
                return (
                  <Link key={item.href} href={item.href} className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/90 bg-[#eaf8f2] px-3.5 py-1.5 text-[13px] font-extrabold text-[#007a5a] transition hover:bg-[#d8f3e7]">
                    <Flame className="size-3.5 fill-[#ff6437] text-[#ff6437]" />
                    <span>{item.label}</span>
                  </Link>
                )
              }
              return (
                <Link key={item.href} href={item.href} className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-bold transition-colors ${isActive ? 'bg-blue-50 text-[#2563eb]' : 'text-[#334155] hover:bg-slate-100/80 hover:text-[#1e3a8a]'}`}>
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <Link href="/account/favorites" className="flex size-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-rose-500" title={labels?.footer?.favorite || 'المفضلة'}>
            <Heart className="size-[18px]" />
          </Link>

          <div className="relative" ref={langRefDesktop}>
            <button type="button" disabled={isSwitchingLocale} onClick={() => { setLangMenuOpen(!langMenuOpen); setNotificationsOpen(false) }} dir="ltr" className="inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200/90 bg-slate-50/80 px-3 text-xs font-extrabold text-[#1e3a8a] transition hover:border-[#2563eb] hover:bg-white">
              {isSwitchingLocale ? <Loader2 className="size-3.5 animate-spin text-[#2563eb]" /> : <CountryFlag code={currentLangCfg.flagCode} className="h-3 w-4" />}
              <span>{currentLangCfg.shortCode}</span>
              <ChevronDown className="size-3 text-gray-400" />
            </button>
            {langMenuOpen && renderLanguageDropdownMenu()}
          </div>

          {hasSession && (
            <div className="relative" ref={notifRefDesktop}>
              <button type="button" onClick={handleToggleNotifications} aria-label="Notifications" className="relative flex size-9 items-center justify-center rounded-full text-[#334155] transition hover:bg-slate-100">
                <Bell className="size-[18px] stroke-[2]" />
                {unreadCount > 0 && <span dir="ltr" className="absolute right-1 top-1 flex size-3.5 items-center justify-center rounded-full bg-red-500 text-[8.5px] font-extrabold text-white">{unreadCount > 9 ? '+9' : unreadCount}</span>}
              </button>
              {notificationsOpen && renderNotificationsDropdown(false)}
            </div>
          )}

          <a href={hasSession ? '/account' : '/login'} className="inline-flex h-9.5 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-slate-200 bg-white px-3.5 text-xs font-extrabold text-[#1e3a8a] transition hover:bg-slate-50">
            <User className="size-3.5 text-slate-500" />
            <span>{desktopAuthBtnLabel}</span>
          </a>

          <Link href="/buy" className="inline-flex h-9.5 items-center justify-center whitespace-nowrap rounded-full border border-slate-200 bg-white px-4 text-xs font-extrabold text-[#1e3a8a] transition hover:border-[#2563eb] hover:text-[#2563eb]">
            {buyUnitBtnLabel}
          </Link>

          <Link href="/sell" className="inline-flex h-9.5 items-center justify-center whitespace-nowrap rounded-full bg-[#007a5a] px-4 text-xs font-extrabold text-white shadow-2xs transition hover:bg-[#006248]">
            {sellUnitBtnLabel}
          </Link>

          <Link href="/sell" className="inline-flex h-9.5 items-center justify-center gap-1 whitespace-nowrap rounded-full bg-gradient-to-r from-[#ff7130] to-[#ff4f69] px-4 text-xs font-black text-white shadow-[0_6px_18px_rgba(255,92,75,0.28)] transition hover:opacity-95 active:scale-95">
            <Plus className="size-3.5 stroke-[3]" />
            <span>{addListingLabel}</span>
          </Link>

          {isAdmin && (
            <a href="/admin" className="inline-flex h-9.5 items-center justify-center gap-1 whitespace-nowrap rounded-full bg-[#1e3a8a] px-3 text-xs font-bold text-white transition hover:bg-[#1d4ed8]" title="لوحة الإدارة">
              <ShieldCheck className="size-3.5 shrink-0 text-[#2ee59d]" />
              <span>{language === 'ar' ? 'الإدارة' : 'Admin'}</span>
            </a>
          )}
        </div>

        <div className="flex items-center gap-1.5 lg:hidden">
          <div className="relative" ref={langRefMobile}>
            <button type="button" dir="ltr" disabled={isSwitchingLocale} onClick={() => { setLangMenuOpen(!langMenuOpen); setNotificationsOpen(false) }} className="inline-flex h-8 items-center justify-center gap-1 rounded-full border border-gray-200/90 bg-gray-50/90 px-2.5 text-[11px] font-extrabold text-[#1e3a8a]">
              <CountryFlag code={currentLangCfg.flagCode} className="h-3 w-4" />
              <span className="font-mono leading-none">{currentLangCfg.shortCode}</span>
            </button>
            {langMenuOpen && renderLanguageDropdownMenu()}
          </div>

          <Link href="/sell" className="inline-flex h-8 items-center justify-center gap-1 whitespace-nowrap rounded-full bg-gradient-to-r from-[#ff7130] to-[#ff4f69] px-3 text-[11px] font-extrabold text-white shadow-xs">
            <Plus className="size-3 stroke-[3]" />
            <span>{addListingLabel}</span>
          </Link>

          <button type="button" onClick={() => { setMobileMenuOpen(!mobileMenuOpen); setLangMenuOpen(false); setNotificationsOpen(false) }} aria-label="Menu" className="flex size-8 items-center justify-center rounded-full border border-gray-200/80 bg-gray-50 text-[#1e3a8a]">
            {mobileMenuOpen ? <X className="size-4 stroke-[2]" /> : <Menu className="size-4 stroke-[2]" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div onClick={() => setLangMenuOpen(false)} className="mx-3 mt-2 overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl lg:hidden">
          <nav className="flex flex-col gap-2.5">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)} className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-extrabold transition ${item.isCore ? 'bg-[#eaf8f2] text-[#007a5a]' : 'text-[#1e3a8a] hover:bg-slate-50'}`}>
                <span>{item.label}</span>
                {item.isCore && <Flame className="size-4 fill-[#ff6437] text-[#ff6437]" />}
              </Link>
            ))}
          </nav>
          <hr className="my-4 border-gray-100" />
          <div className="flex flex-col gap-2.5">
            {isAdmin && (
              <a href="/admin" onClick={() => setMobileMenuOpen(false)} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1e3a8a] text-xs font-bold text-white">
                <ShieldCheck className="size-4 text-[#2ee59d]" />
                <span>{language === 'ar' ? 'لوحة الإدارة' : 'Admin Panel'}</span>
              </a>
            )}
            <Link href="/sell" onClick={() => setMobileMenuOpen(false)} className="flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-[#007a5a] text-xs font-extrabold text-white">
              <span>{sellUnitBtnLabel}</span>
            </Link>
            <Link href="/sell" onClick={() => setMobileMenuOpen(false)} className="flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#ff7130] to-[#ff4f69] text-xs font-extrabold text-white shadow-sm">
              <Plus className="size-4 stroke-[3]" />
              <span>{addListingLabel}</span>
            </Link>
            <Link href="/buy" onClick={() => setMobileMenuOpen(false)} className="flex h-11 w-full items-center justify-center rounded-xl border border-[#e2e8f0] bg-white text-xs font-extrabold text-[#1e3a8a]">
              {buyUnitBtnLabel}
            </Link>
            <a href={hasSession ? '/account' : '/login'} onClick={() => setMobileMenuOpen(false)} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#e2e8f0] bg-gray-50 text-xs font-extrabold text-[#1e3a8a]">
              <User className="size-4" />
              <span>{desktopAuthBtnLabel}</span>
            </a>
          </div>
        </div>
      )}
    </header>
  )
}

export function LegacyNavbar({ dictionary }: { dictionary?: Dictionary }) {
  return <Navbar dictionary={dictionary} />
}

export function Footer({ dictionary: _unused }: { dictionary?: Dictionary }) {
  const i18nCtx = useTranslation() as Record<string, any>
  const labels = i18nCtx.t
  const language: LanguageCode = i18nCtx.locale || 'ar'
  const dir = i18nCtx.dir || 'rtl'
  const hasSession = Boolean(i18nCtx.hasSession ?? i18nCtx.isLoggedIn)
  const siteSettings = i18nCtx.siteSettings

  const activePhone = siteSettings?.whatsappNumber || labels.footer?.phone || '+201018595959'
  const activeEmail = siteSettings?.supportEmail || labels.footer?.email || 'info@aqarexit.com'

  const platformLinks = [
    { label: labels.footer?.forSellers || 'للبايعين (عايز تبيع)', href: '/sell' },
    { label: labels.footer?.forBuyers || 'للمشترين (عايز تشتري)', href: '/buy' },
    { label: labels.footer?.calculator || 'حاسبة الخروج', href: '/calculator' },
    { label: labels.footer?.favorite || 'المفضلة', href: '/account/favorites' },
    {
      label: hasSession ? getMyAccountLabel(language, labels.navbar as Record<string, any>) : getGuestLoginLabel(language, labels.navbar as Record<string, any>),
      href: hasSession ? '/account' : '/login',
      fullReload: true,
    },
  ]

  const companyLinks = [
    { label: labels.footer?.about || 'قصتنا', href: '/story' },
    { label: labels.footer?.work || 'إزاي بنشتغل', href: '/how-it-works' },
    { label: labels.footer?.reports || 'التقارير والمؤشرات', href: '/reports' },
    { label: labels.footer?.faq || 'الأسئلة الشائعة', href: '/faq' },
    { label: labels.navbar?.contact || 'كلمنا', href: '/contact' },
  ]

  const legalLinks = [
    { label: labels.footer?.privacy || 'سياسة الخصوصية', href: '/privacy' },
    { label: labels.footer?.terms || 'الشروط والأحكام', href: '/terms' },
    { label: language === 'ar' ? 'لوحة الإدارة' : language === 'ru' ? 'Панель администратора' : language === 'ka' ? 'ადმინისტრატორის პანელი' : 'Admin Panel', href: '/admin', fullReload: true },
  ]

  const soonText = getSoonLabel(language)

  return (
    <footer className="bg-gradient-to-b from-[#172554] to-[#0f172a] text-white" dir={dir}>
      <div className="mx-auto max-w-[1360px] px-5 pt-14 pb-12 sm:px-6 lg:px-10 lg:pt-20">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.45fr_1fr_1fr_1fr] lg:gap-12">
          <div className="text-start">
            <Logo inverse />
            <p className="mt-5 max-w-sm text-xs leading-[1.9] text-blue-100/80 sm:text-[13px]">
              {labels.footer?.description}
            </p>
            <div className="mt-5 flex flex-col items-start gap-2 text-xs text-blue-100 sm:text-[13px]">
              <a href={`tel:${activePhone}`} dir="ltr" className="transition-colors hover:text-[#2ee59d]">{activePhone}</a>
              <a href={`https://wa.me/${activePhone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="transition-colors hover:text-[#2ee59d]">{labels.publicPages?.contact?.whatsappTitle || 'واتساب'}</a>
              <a href={`mailto:${activeEmail}`} className="transition-colors hover:text-[#2ee59d]">{activeEmail}</a>
            </div>
          </div>
          <div className="text-start">
            <h3 className="text-xs font-bold text-blue-200/70">{labels.footer?.platform || 'المنصة'}</h3>
            <ul className="mt-4 flex flex-col gap-3 text-xs text-blue-50 sm:text-[13px]">
              {platformLinks.map((item) => (
                <li key={item.href}>
                  {item.fullReload ? <a href={item.href} className="transition-colors hover:text-[#2ee59d]">{item.label}</a> : <Link href={item.href} className="transition-colors hover:text-[#2ee59d]">{item.label}</Link>}
                </li>
              ))}
            </ul>
          </div>
          <div className="text-start">
            <h3 className="text-xs font-bold text-blue-200/70">{labels.footer?.company || 'الشركة'}</h3>
            <ul className="mt-4 flex flex-col gap-3 text-xs text-blue-50 sm:text-[13px]">
              {companyLinks.map((item) => (
                <li key={item.href}><Link href={item.href} className="transition-colors hover:text-[#2ee59d]">{item.label}</Link></li>
              ))}
            </ul>
          </div>
          <div className="text-start">
            <h3 className="text-xs font-bold text-blue-200/70">{labels.footer?.legal || 'قانوني'}</h3>
            <ul className="mt-4 flex flex-col gap-3 text-xs text-blue-50 sm:text-[13px]">
              {legalLinks.map((item) => (
                <li key={item.href}>
                  {item.fullReload ? <a href={item.href} className="transition-colors hover:text-[#2ee59d]">{item.label}</a> : <Link href={item.href} className="transition-colors hover:text-[#2ee59d]">{item.label}</Link>}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-white/10 pt-8 text-start text-xs text-blue-200/70">
          <div>
            <span className="block text-[11px]">{language === 'ar' ? 'أسواق العمل' : language === 'ru' ? 'Рынки присутствия' : language === 'ka' ? 'სამუშაო ბაზრები' : 'Markets'}</span>
            <div className="mt-2.5 flex flex-wrap items-center justify-start gap-2.5 text-xs">
              {(Object.values(SUPPORTED_COUNTRIES) as CountryConfig[]).map((c) => {
                const isActiveMarket = !c.comingSoon
                return (
                  <span key={c.code} className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 font-bold ${isActiveMarket ? 'bg-[#007a5a] text-white shadow-xs' : 'cursor-default border border-white/10 bg-white/5 text-blue-200/60'}`}>
                    <CountryFlag code={c.code} className="h-3.5 w-5" />
                    <span>{getCountryName(c, language)}</span>
                    {c.comingSoon && <span className="rounded-md bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-300">{soonText}</span>}
                  </span>
                )
              })}
            </div>
          </div>
          <p className="mt-5 text-[11px] leading-relaxed text-blue-200/60 sm:text-xs">{labels.footer?.disclaimer}</p>
        </div>
      </div>
    </footer>
  )
}

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  )
}