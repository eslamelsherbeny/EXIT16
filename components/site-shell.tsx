"use client"

import { useEffect, useRef, useState, useTransition } from 'react'
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
  Globe,
  Loader2,
  Menu,
  ShieldCheck,
  Smartphone,
  Trash2,
  User,
  WalletCards,
  X,
} from 'lucide-react'
import * as authActions from '@/app/actions/auth-actions'
import {
  clearAllNotificationsAction,
  deleteNotificationAction,
  getUserNotificationsAction,
  markAllNotificationsAsReadAction,
  markNotificationAsReadAction,
} from '@/app/actions/notification-actions'
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
  ar: {
    code: 'ar',
    label: 'العربية',
    nativeName: 'العربية',
    shortCode: 'AR',
    flagCode: 'AR',
    dir: 'rtl',
  },
  en: {
    code: 'en',
    label: 'الإنجليزية',
    nativeName: 'English',
    shortCode: 'EN',
    flagCode: 'EN',
    dir: 'ltr',
  },
  ru: {
    code: 'ru',
    label: 'الروسية',
    nativeName: 'Русский',
    shortCode: 'RU',
    flagCode: 'RU',
    dir: 'ltr',
  },
  ka: {
    code: 'ka',
    label: 'الجورجية',
    nativeName: 'ქართული',
    shortCode: 'KA',
    flagCode: 'GE',
    dir: 'ltr',
  },
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
  defaultPackages: {
    days7: number
    days14: number
    days30: number
  }
}

export const SUPPORTED_COUNTRIES: Record<CountryCode, CountryConfig> = {
  GE: {
    code: 'GE',
    nameAr: 'جورجيا',
    nameEn: 'Georgia',
    nameRu: 'Грузия',
    nameKa: 'საქართველო',
    flag: '🇬🇪',
    currencyCode: 'USD',
    currencySymbol: '$',
    phoneCode: '+995',
    comingSoon: false,
    defaultPackages: { days7: 29, days14: 49, days30: 69 },
  },
  EG: {
    code: 'EG',
    nameAr: 'مصر',
    nameEn: 'Egypt',
    nameRu: 'Египет',
    nameKa: 'ეგვიპტე',
    flag: '🇪🇬',
    currencyCode: 'EGP',
    currencySymbol: 'ج.م',
    phoneCode: '+20',
    comingSoon: true,
    defaultPackages: { days7: 1199, days14: 1999, days30: 2799 },
  },
  AE: {
    code: 'AE',
    nameAr: 'الإمارات',
    nameEn: 'UAE',
    nameRu: 'ОАЭ',
    nameKa: 'საამიროები',
    flag: '🇦🇪',
    currencyCode: 'AED',
    currencySymbol: 'د.إ',
    phoneCode: '+971',
    comingSoon: true,
    defaultPackages: { days7: 99, days14: 179, days30: 249 },
  },
  RU: {
    code: 'RU',
    nameAr: 'روسيا',
    nameEn: 'Russia',
    nameRu: 'Россия',
    nameKa: 'რუსეთი',
    flag: '🇷🇺',
    currencyCode: 'RUB',
    currencySymbol: '₽',
    phoneCode: '+7',
    comingSoon: true,
    defaultPackages: { days7: 2500, days14: 4200, days30: 5900 },
  },
}

// أعلام SVG حادة وواضحة للغات والدول على كل الشاشات
export function CountryFlag({
  code,
  className = 'h-3.5 w-5',
}: {
  code: CountryCode | string
  className?: string
}) {
  const cleanCode = (code || 'GE').toUpperCase()

  if (cleanCode === 'GE' || cleanCode === 'KA') {
    return (
      <svg
        viewBox="0 0 30 20"
        className={`${className} shrink-0 overflow-hidden rounded-[2px] border border-black/10`}
        aria-hidden="true"
      >
        <rect width="30" height="20" fill="#fff" />
        <rect width="30" height="4" y="8" fill="#ff0000" />
        <rect width="4" height="20" x="13" fill="#ff0000" />
        <path
          d="M5.5 2.5h2v3h-2zM4.5 3.5h4v1h-4zM22.5 2.5h2v3h-2zM21.5 3.5h4v1h-4zM5.5 14.5h2v3h-2zM4.5 15.5h4v1h-4zM22.5 14.5h2v3h-2zM21.5 15.5h4v1h-4z"
          fill="#ff0000"
        />
      </svg>
    )
  }

  if (cleanCode === 'EN' || cleanCode === 'GB' || cleanCode === 'US') {
    return (
      <svg
        viewBox="0 0 30 20"
        className={`${className} shrink-0 overflow-hidden rounded-[2px] border border-black/10`}
        aria-hidden="true"
      >
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
      <svg
        viewBox="0 0 30 20"
        className={`${className} shrink-0 overflow-hidden rounded-[2px] border border-black/10`}
        aria-hidden="true"
      >
        <rect width="30" height="20" fill="#006C35" />
        <rect width="14" height="2" x="8" y="13" rx="1" fill="#fff" />
        <path d="M9 8.5h12v1.8H9z" fill="#fff" opacity="0.85" />
      </svg>
    )
  }

  if (cleanCode === 'RU') {
    return (
      <svg
        viewBox="0 0 30 20"
        className={`${className} shrink-0 overflow-hidden rounded-[2px] border border-black/10`}
        aria-hidden="true"
      >
        <rect width="30" height="6.67" y="0" fill="#fff" />
        <rect width="30" height="6.67" y="6.67" fill="#0039a6" />
        <rect width="30" height="6.67" y="13.33" fill="#d52b1e" />
      </svg>
    )
  }

  if (cleanCode === 'EG') {
    return (
      <svg
        viewBox="0 0 30 20"
        className={`${className} shrink-0 overflow-hidden rounded-[2px] border border-black/10`}
        aria-hidden="true"
      >
        <rect width="30" height="20" fill="#fff" />
        <rect width="30" height="6.67" y="0" fill="#ce1126" />
        <rect width="30" height="6.67" y="13.33" fill="#000" />
        <path d="M13.6 7.8h2.8l.4 4.2h-3.6z" fill="#c09300" />
      </svg>
    )
  }

  if (cleanCode === 'AE') {
    return (
      <svg
        viewBox="0 0 30 20"
        className={`${className} shrink-0 overflow-hidden rounded-[2px] border border-black/10`}
        aria-hidden="true"
      >
        <rect width="30" height="6.67" y="0" fill="#00732f" />
        <rect width="30" height="6.67" y="6.67" fill="#fff" />
        <rect width="30" height="6.67" y="13.33" fill="#000" />
        <rect width="8" height="20" x="0" fill="#ff0000" />
      </svg>
    )
  }

  return null
}

// حالياً المنصة تعمل على جورجيا فقط (وباقي الدول محفوظة للتوسع المستقبلي)
export function getActiveCountryFromCookie(): CountryConfig {
  return SUPPORTED_COUNTRIES.GE
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

const links = [
  { href: '/sell', key: 'sell' as const, fallback: 'بيع وحدتك' },
  { href: '/opportunities', key: 'opportunities' as const, fallback: 'الفرص المتاحة' },
  { href: '/story', key: 'story' as const, fallback: 'قصتنا' },
  { href: '/how-it-works', key: 'howItWorks' as const, fallback: 'إزاي بنشتغل' },
  { href: '/contact', key: 'contact' as const, fallback: 'كلمنا' },
  // تم إيقاف تاب المستثمرين مؤقتاً (محفوظ ككومنت للتفعيل مستقبلاً بدون أي تأثير على السرعة)
  // { href: '/investors', key: 'investors' as const, fallback: 'للمستثمرين' },
]

export function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link
      href="/"
      dir="ltr"
      className={`inline-block shrink-0 select-none ${inverse ? 'text-white' : 'text-[#0a1122]'}`}
      aria-label="Aqar Exit"
    >
      <svg
        width="106"
        height="48"
        viewBox="0 0 116 54"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-[40px] w-auto sm:h-[44px]"
      >
        <path
          d="M5 30L17.5 5.5C18.2 4.1 19.8 4.1 20.5 5.5L33 30"
          stroke="currentColor"
          strokeWidth="3.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="46.5" cy="20" r="9.2" stroke="currentColor" strokeWidth="3.2" />
        <path
          d="M55.7 10.8V35.5C55.7 37.5 56.8 38.8 58.8 38.8"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <circle cx="72" cy="20" r="9.2" stroke="currentColor" strokeWidth="3.2" />
        <path
          d="M81.2 10.8V29.5"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path
          d="M90.5 29.5V17.5C90.5 13.2 93.8 10.8 98 10.8H100.5"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path
          d="M66 35.5C61 34.5 56.5 36.8 56.5 39.8C56.5 42.2 59.5 43.2 63 42.8C58.5 43.5 54.5 45.8 55 48.8C55.5 51.8 60.5 52.5 65.5 50.2"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M69 42.5L76.5 50M77 42.2C73.5 45 70.5 48 67.5 50.8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M81.5 43.2L79.5 49.5C79.2 50.3 79.8 50.8 80.8 50.3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="82.5" cy="39.5" r="1" fill="currentColor" />
        <path
          d="M90.5 34.5L86 50.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M83 41.2C88 40.5 94 39.8 100 39.2"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    </Link>
  )
}

export function Navbar({ dictionary: _unused }: { dictionary?: Dictionary }) {
  const router = useRouter()
  const pathname = usePathname()

  const {
    t: labels,
    locale: language,
    dir,
    hasSession: initialServerHasSession,
    isStaff: initialServerIsStaff,
  } = useTranslation()

  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const [hasSession, setHasSession] = useState<boolean>(
    Boolean(initialServerHasSession)
  )
  const [isAdmin, setIsAdmin] = useState<boolean>(
    Boolean(initialServerIsStaff)
  )
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
    setHasSession(Boolean(initialServerHasSession))
  }, [initialServerHasSession])

  useEffect(() => {
    setIsAdmin(Boolean(initialServerIsStaff))
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
        const actionFn = (authActions as any).getSessionUserAction
        if (typeof actionFn === 'function') {
          const sessionData = await actionFn()
          if (isMounted && sessionData) {
            setHasSession(Boolean(sessionData.isLoggedIn))
            setIsAdmin(Boolean(sessionData.isAdmin))
          }
        }
        const notifRes = await getUserNotificationsAction('client')
        if (isMounted && notifRes.success) {
          setNotifsList(notifRes.notifications)
          setUnreadCount(notifRes.unreadCount)
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

    router.push(targetUrl)
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

  const currentLangCfg =
    SUPPORTED_LANGUAGES[language] || SUPPORTED_LANGUAGES.ar

  const renderLanguageDropdownMenu = () => (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute end-0 top-10 z-50 w-40 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-gray-200/90 bg-white p-1.5 shadow-xl"
    >
      {(Object.values(SUPPORTED_LANGUAGES) as LanguageConfig[]).map((lang) => {
        const active = lang.code === language
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => handleSelectLanguage(lang.code)}
            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold transition ${
              active
                ? 'bg-[#eff9f5] font-bold text-[#0b6954]'
                : 'text-[#0a1122] hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <CountryFlag code={lang.flagCode} className="h-3 w-4" />
              <span>{lang.nativeName}</span>
            </div>
            {active && <Check className="size-3.5 text-[#0b6954]" />}
          </button>
        )
      })}
    </div>
  )

  const renderNotificationsDropdown = (isMobile = false) => (
    <div
      onClick={(e) => e.stopPropagation()}
      className={
        isMobile
          ? 'fixed left-3 right-3 top-[70px] z-50 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl'
          : 'absolute end-0 top-12 z-50 w-96 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl'
      }
    >
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/90 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold text-[#0a1122]">
            {language === 'ar'
              ? 'الإشعارات'
              : language === 'ru'
                ? 'Уведомления'
                : language === 'ka'
                  ? 'შეტყობინებები'
                  : 'Notifications'}
          </span>
          <span
            dir="ltr"
            className="rounded-full bg-[#0b6954]/10 px-2 py-0.5 text-[10px] font-extrabold text-[#0b6954]"
          >
            {notifsList.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {notifsList.length > 0 && (
            <button
              type="button"
              onClick={handleClearAllNotifications}
              className="rounded-lg px-2 py-1 text-[11px] font-bold text-red-600 transition hover:bg-red-50"
            >
              {language === 'ar'
                ? 'مسح الكل'
                : language === 'ru'
                  ? 'Очистить все'
                  : language === 'ka'
                    ? 'გასუფთავება'
                    : 'Clear All'}
            </button>
          )}
          <button
            type="button"
            onClick={() => setNotificationsOpen(false)}
            className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-200/60 hover:text-gray-700"
            aria-label="إغلاق"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      <div className="max-h-[65vh] divide-y divide-gray-100 overflow-y-auto text-start sm:max-h-96">
        {notifsList.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
            <CheckCircle2 className="mb-2.5 size-9 text-emerald-500" />
            <p className="text-xs font-extrabold text-[#0a1122]">
              {language === 'ar'
                ? 'لا توجد إشعارات حالياً'
                : language === 'ru'
                  ? 'Нет уведомлений'
                  : language === 'ka'
                    ? 'შეტყობინებები არ არის'
                    : 'No notifications yet'}
            </p>
          </div>
        ) : (
          notifsList.map((item) => (
            <div
              key={item.id}
              onClick={() => handleSingleNotifClick(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSingleNotifClick(item)
              }}
              className={`group flex cursor-pointer items-start gap-3 p-4 transition hover:bg-gray-50 active:bg-gray-100 ${
                !item.is_read ? 'bg-emerald-50/50' : 'bg-white'
              }`}
            >
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-teal-100/80 text-[#0b6954]">
                {item.type === 'property' || item.type === 'property_match' ? (
                  <Building2 className="size-4" />
                ) : item.type === 'lead' ? (
                  <FileText className="size-4" />
                ) : item.type === 'investor' ? (
                  <WalletCards className="size-4" />
                ) : (
                  <Bell className="size-4" />
                )}
              </span>

              <div className="min-w-0 flex-1">
                <p
                  className={`text-xs leading-snug text-[#0a1122] ${
                    !item.is_read ? 'font-extrabold' : 'font-bold'
                  }`}
                >
                  {item.title}
                </p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-gray-600 break-words">
                  {item.message}
                </p>

                <div className="mt-2 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-400">
                    <Clock className="size-3" />
                    <span dir="ltr">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleDateString('en-US')
                        : 'Now'}
                    </span>
                  </span>

                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0b6954] group-hover:underline">
                    <span>
                      {labels.accountPages?.common?.viewDetails || 'عرض التفاصيل'}
                    </span>
                    <ArrowLeft className="size-3" />
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => handleDeleteNotification(e, item.id)}
                title="حذف الإشعار"
                aria-label="حذف الإشعار"
                className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-gray-100 bg-gray-50/70 p-2 text-center">
        <button
          type="button"
          onClick={() => {
            setNotificationsOpen(false)
            router.push('/account')
          }}
          className="w-full rounded-xl py-2 text-xs font-extrabold text-[#0b6954] transition hover:bg-emerald-50"
        >
          {labels.accountPages?.common?.backToAccount || 'الذهاب إلى حسابي'}
        </button>
      </div>
    </div>
  )

  return (
    <header
      dir={dir}
      className="sticky top-0 z-50 border-b border-gray-200/75 bg-white/95 backdrop-blur-md"
    >
      {isSwitchingLocale && (
        <>
          <div className="absolute inset-x-0 top-0 h-[3px] overflow-hidden bg-emerald-100">
            <div className="h-full w-1/2 animate-pulse bg-[#0b6954]" />
          </div>
          <div
            dir="ltr"
            className="fixed top-[80px] left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#0a1122]/95 px-4 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur-xs"
          >
            <Loader2 className="size-3.5 animate-spin text-[#2ee59d]" />
            <span>{switchingLabel || 'Updating...'}</span>
          </div>
        </>
      )}

      <div className="mx-auto flex h-[66px] max-w-[1280px] items-center justify-between gap-4 px-4 sm:h-[74px] sm:px-6 lg:px-8">
        <div className="flex items-center gap-9 lg:gap-10 xl:gap-14">
          <Logo />
          <nav
            className="hidden items-center gap-4 lg:flex xl:gap-5"
            aria-label={labels.navbar?.menuTitle || 'القائمة الرئيسية'}
          >
            {links.map((link) => {
              const isActive =
                pathname === link.href || pathname.startsWith(`${link.href}/`)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`whitespace-nowrap text-[13.5px] transition-colors hover:text-[#0b6954] xl:text-[14px] ${
                    isActive
                      ? 'font-bold text-[#0b6954]'
                      : 'font-semibold text-[#334155]'
                  }`}
                >
                  {labels.navbar?.[link.key] || link.fallback}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* ==================== أزرار الكمبيوتر (العلم + اسم اللغة الكامل بدون زر دولة منفصل) ==================== */}
        <div className="hidden shrink-0 items-center gap-2 lg:flex xl:gap-2.5">
          <div className="relative" ref={langRefDesktop}>
            <button
              type="button"
              disabled={isSwitchingLocale}
              onClick={() => {
                setLangMenuOpen(!langMenuOpen)
                setNotificationsOpen(false)
              }}
              dir="ltr"
              className="inline-flex h-[36px] items-center gap-1.5 rounded-[9px] border border-gray-200/90 bg-gray-50/70 px-2.5 text-[12.5px] font-bold text-[#0a1122] transition-colors hover:border-[#0b6954] hover:bg-white disabled:opacity-60"
              title={labels.navbar?.languageLabel || 'تغيير اللغة'}
            >
              {isSwitchingLocale ? (
                <Loader2 className="size-3.5 animate-spin text-[#0b6954]" />
              ) : (
                <CountryFlag code={currentLangCfg.flagCode} className="h-3 w-4" />
              )}
              <span>{currentLangCfg.nativeName}</span>
              <ChevronDown className="size-3 text-gray-400" />
            </button>

            {langMenuOpen && renderLanguageDropdownMenu()}
          </div>

          <Link
            href={hasSession ? '/account' : '/login'}
            className="inline-flex h-[42px] items-center justify-center whitespace-nowrap rounded-[11px] border border-[#e2e8f0] bg-white px-4 text-[13px] font-bold text-[#0a1122] transition-colors hover:bg-gray-50 xl:px-4.5 xl:text-[13.5px]"
          >
            {labels.navbar?.login || 'حسابي'}
          </Link>

          <Link
            href="/buy"
            className="inline-flex h-[42px] items-center justify-center whitespace-nowrap rounded-[11px] border border-[#e2e8f0] bg-white px-4 text-[13px] font-bold text-[#0a1122] transition-colors hover:bg-gray-50 xl:px-4.5 xl:text-[13.5px]"
          >
            {labels.navbar?.buy || 'عايز تشتري'}
          </Link>

          {hasSession && (
            <div className="relative" ref={notifRefDesktop}>
              <button
                type="button"
                onClick={handleToggleNotifications}
                aria-label={language === 'ar' ? 'الإشعارات' : 'Notifications'}
                className="relative flex size-[38px] items-center justify-center rounded-lg text-[#334155] transition-colors hover:bg-gray-100"
              >
                <Bell className="size-[18px] stroke-[1.9]" />
                {unreadCount > 0 && (
                  <span
                    dir="ltr"
                    className="absolute right-1 top-1 flex size-3.5 items-center justify-center rounded-full bg-red-500 text-[8.5px] font-extrabold text-white"
                  >
                    {unreadCount > 9 ? '+9' : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && renderNotificationsDropdown(false)}
            </div>
          )}

          <Link
            href="/sell"
            className="inline-flex h-[42px] items-center justify-center whitespace-nowrap rounded-[11px] bg-[#0b6954] px-4.5 text-[13px] font-bold text-white transition-colors hover:bg-[#085443] xl:px-5 xl:text-[13.5px]"
          >
            {labels.navbar?.sellCta || 'عايز تبيع'}
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              className="inline-flex h-[42px] items-center justify-center gap-1 whitespace-nowrap rounded-[11px] bg-[#0a1122] px-3 text-[12px] font-bold text-white transition-colors hover:bg-[#16223f]"
              title="لوحة الإدارة"
            >
              <ShieldCheck className="size-3.5 shrink-0 text-[#2ee59d]" />
              <span>
                {language === 'ar'
                  ? 'الإدارة'
                  : language === 'ru'
                    ? 'Админ'
                    : language === 'ka'
                      ? 'ადმინ.'
                      : 'Admin'}
              </span>
            </Link>
          )}
        </div>

        {/* ==================== أزرار الموبايل (كبسولة اللغة: العلم + حرفين AR/EN/RU/KA) ==================== */}
        <div className="flex items-center gap-1.5 lg:hidden">
          <div className="relative" ref={langRefMobile}>
            <button
              type="button"
              dir="ltr"
              disabled={isSwitchingLocale}
              onClick={() => {
                setLangMenuOpen(!langMenuOpen)
                setNotificationsOpen(false)
              }}
              className="inline-flex h-[32px] items-center justify-center gap-1.5 rounded-full border border-gray-200/90 bg-gray-50/90 px-2.5 text-[11px] font-extrabold text-[#0a1122] shadow-2xs transition active:scale-95"
              aria-label={labels.navbar?.languageLabel || 'تغيير اللغة'}
            >
              <CountryFlag code={currentLangCfg.flagCode} className="h-3 w-4" />
              <span className="font-mono leading-none">
                {currentLangCfg.shortCode}
              </span>
              <ChevronDown className="size-2.5 text-gray-400" />
            </button>

            {langMenuOpen && renderLanguageDropdownMenu()}
          </div>

          {hasSession ? (
            <div className="relative" ref={notifRefMobile}>
              <button
                type="button"
                onClick={handleToggleNotifications}
                aria-label="الإشعارات"
                className="relative flex size-[34px] items-center justify-center rounded-[8px] border border-gray-200/80 bg-white text-[#334155]"
              >
                <Bell className="size-[17px] stroke-[2]" />
                {unreadCount > 0 && (
                  <span
                    dir="ltr"
                    className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full border border-white bg-red-500 text-[8.5px] font-extrabold text-white"
                  >
                    {unreadCount > 9 ? '+9' : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && renderNotificationsDropdown(true)}
            </div>
          ) : (
            <Link
              href="/sell"
              className="inline-flex h-[34px] items-center justify-center whitespace-nowrap rounded-[8px] bg-[#0b6954] px-3 text-[12px] font-bold text-white transition-colors hover:bg-[#085443]"
            >
              {labels.navbar?.sellCta || 'عايز تبيع'}
            </Link>
          )}

          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(!mobileMenuOpen)
              setLangMenuOpen(false)
              setNotificationsOpen(false)
            }}
            aria-label="القائمة"
            className="flex size-[34px] items-center justify-center rounded-[8px] border border-gray-200/80 bg-gray-50 text-[#0a1122] focus:outline-none"
          >
            {mobileMenuOpen ? (
              <X className="size-4 stroke-[2]" />
            ) : (
              <Menu className="size-4 stroke-[2]" />
            )}
          </button>
        </div>
      </div>

      {/* ==================== قائمة الموبايل الجانبية ==================== */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-[66px] bottom-0 z-50 h-[calc(100vh-66px)] overflow-y-auto border-t border-gray-100 bg-white px-5 pt-4 pb-12 lg:hidden">
          <nav className="flex flex-col gap-3">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`rounded-lg px-2 py-1 text-[15px] font-semibold transition-colors ${
                pathname === '/' ? 'font-bold text-[#0b6954]' : 'text-[#0a1122]'
              }`}
            >
              {language === 'ar'
                ? 'الرئيسية'
                : language === 'ru'
                  ? 'Главная'
                  : language === 'ka'
                    ? 'მთავარი'
                    : 'Home'}
            </Link>
            {links.map((link) => {
              const isActive =
                pathname === link.href || pathname.startsWith(`${link.href}/`)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`rounded-lg px-2 py-1 text-[15px] font-semibold transition-colors ${
                    isActive ? 'font-bold text-[#0b6954]' : 'text-[#0a1122]'
                  }`}
                >
                  {labels.navbar?.[link.key] || link.fallback}
                </Link>
              )
            })}
          </nav>

          <hr className="my-4 border-gray-200/80" />

          <div className="flex flex-col gap-2.5">
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#0a1122] text-[13.5px] font-bold text-white shadow-xs transition-colors hover:bg-[#16223f]"
              >
                <ShieldCheck className="size-4 text-[#2ee59d]" />
                <span>
                  {language === 'ar'
                    ? 'لوحة الإدارة'
                    : language === 'ru'
                      ? 'Панель администратора'
                      : language === 'ka'
                        ? 'ადმინისტრატორის პანელი'
                        : 'Admin Panel'}
                </span>
              </Link>
            )}
            <Link
              href="/sell"
              onClick={() => setMobileMenuOpen(false)}
              className="flex h-[44px] w-full items-center justify-center rounded-xl bg-[#0b6954] text-[13.5px] font-bold text-white transition-colors hover:bg-[#085443]"
            >
              {labels.navbar?.sellCta || 'عايز تبيع'}
            </Link>
            <Link
              href="/buy"
              onClick={() => setMobileMenuOpen(false)}
              className="flex h-[44px] w-full items-center justify-center rounded-xl border border-[#e2e8f0] bg-white text-[13.5px] font-bold text-[#0a1122] transition-colors hover:bg-gray-50"
            >
              {labels.navbar?.buy || 'عايز تشتري'}
            </Link>
            <Link
              href={hasSession ? '/account' : '/login'}
              onClick={() => setMobileMenuOpen(false)}
              className="flex h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-[#e2e8f0] bg-gray-50 text-[13.5px] font-bold text-[#1d3557] transition-colors hover:bg-gray-100"
            >
              <User className="size-4" />
              <span>
                {hasSession
                  ? labels.navbar?.login || 'حسابي الشخصي'
                  : labels.authPages?.login?.title || 'تسجيل الدخول / إنشاء حساب'}
              </span>
            </Link>
            <Link
              href="/opportunities#app-banner"
              onClick={() => setMobileMenuOpen(false)}
              className="flex h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-[#99cec3] bg-[#eff8f6] text-[13.5px] font-bold text-[#0b6954] transition-colors hover:bg-[#e2f3ef]"
            >
              <Smartphone className="size-4 stroke-[2.2]" />
              <span>{labels.footer?.appLabel || 'حمّل التطبيق'}</span>
            </Link>
          </div>

          {/* شريط اختيار اللغة في أسفل القائمة الجانبية للموبايل */}
          <div className="mt-5 rounded-xl border border-gray-200/80 bg-gray-50/80 p-2.5">
            <div className="mb-2 flex items-center justify-between px-1 text-[11px] font-bold text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <Globe className="size-3.5 text-[#0b6954]" />
                <span>{labels.navbar?.languageLabel || 'اللغة / Language'}</span>
              </span>
              <span className="text-[10px] text-gray-400">
                {currentLangCfg.nativeName}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.values(SUPPORTED_LANGUAGES) as LanguageConfig[]).map(
                (lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    disabled={isSwitchingLocale}
                    onClick={() => {
                      handleSelectLanguage(lang.code)
                      setMobileMenuOpen(false)
                    }}
                    className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-extrabold transition ${
                      language === lang.code
                        ? 'bg-[#0b6954] text-white shadow-2xs'
                        : 'border border-gray-200/80 bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <CountryFlag code={lang.flagCode} className="h-3 w-4" />
                    <span>{lang.nativeName}</span>
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export function LegacyNavbar({ dictionary }: { dictionary?: Dictionary }) {
  return <Navbar dictionary={dictionary} />
}

// ==================== 3. الفوتر المنظم (Footer — جورجيا مفعلة وباقي الدول "قريباً") ====================
export function Footer({ dictionary: _unused }: { dictionary?: Dictionary }) {
  const {
    t: labels,
    locale: language,
    dir,
    siteSettings,
  } = useTranslation()

  const activePhone =
    siteSettings?.whatsappNumber || labels.footer?.phone || '+201018595959'
  const activeEmail =
    siteSettings?.supportEmail || labels.footer?.email || 'info@aqarexit.com'

  const platformLinks = [
    { label: labels.navbar?.opportunities || 'الفرص المتاحة', href: '/opportunities' },
    { label: labels.footer?.forSellers || 'للبايعين (بيع وحدتك)', href: '/sell' },
    { label: labels.footer?.forBuyers || 'للمشترين (اطلب وحدة)', href: '/buy' },
    { label: labels.footer?.calculator || 'حاسبة الخروج', href: '/calculator' },
    { label: labels.footer?.favorite || 'المفضلة', href: '/account/favorites' },
    { label: labels.navbar?.login || 'حسابي', href: '/account' },
  ]

  const companyLinks = [
    { label: labels.footer?.about || 'قصتنا', href: '/story' },
    { label: labels.footer?.work || 'إزاي بنشتغل', href: '/how-it-works' },
    { label: labels.footer?.reports || 'التقارير والمؤشرات', href: '/reports' },
    // تم إيقاف رابط علاقات المستثمرين مؤقتاً ككومنت
    // { label: labels.footer?.investorRelations || 'علاقات المستثمرين', href: '/investors' },
    { label: labels.footer?.faq || 'الأسئلة الشائعة', href: '/faq' },
    { label: labels.navbar?.contact || 'كلمنا', href: '/contact' },
  ]

  const legalLinks = [
    { label: labels.footer?.privacy || 'سياسة الخصوصية', href: '/privacy' },
    { label: labels.footer?.terms || 'الشروط والأحكام', href: '/terms' },
    {
      label:
        language === 'ar'
          ? 'لوحة الإدارة'
          : language === 'ru'
            ? 'Панель администратора'
            : language === 'ka'
              ? 'ადმინისტრატორის პანელი'
              : 'Admin Panel',
      href: '/admin',
    },
  ]

  const soonText = getSoonLabel(language)

  return (
    <footer className="bg-[#0a1122] text-white" dir={dir}>
      <div className="mx-auto max-w-[1280px] px-5 pt-14 pb-12 sm:px-6 lg:px-8 lg:pt-20">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.45fr_1fr_1fr_1fr] lg:gap-12">
          <div className="text-start">
            <Logo inverse />
            <p className="mt-5 max-w-sm text-xs leading-[1.9] text-gray-300/85 sm:text-[13px]">
              {labels.footer?.description}
            </p>
            <div className="mt-5 flex flex-col items-start gap-2 text-xs text-gray-300 sm:text-[13px]">
              <a
                href={`tel:${activePhone}`}
                dir="ltr"
                className="transition-colors hover:text-[#2ee59d]"
              >
                {activePhone}
              </a>
              <a
                href={`https://wa.me/${activePhone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-[#2ee59d]"
              >
                {labels.publicPages?.contact?.whatsappTitle || 'WhatsApp'}
              </a>
              <a
                href={`mailto:${activeEmail}`}
                className="transition-colors hover:text-[#2ee59d]"
              >
                {activeEmail}
              </a>
            </div>
          </div>
          <div className="text-start">
            <h3 className="text-xs font-bold text-gray-400">
              {labels.footer?.platform || 'المنصة'}
            </h3>
            <ul className="mt-4 flex flex-col gap-3 text-xs text-gray-200 sm:text-[13px]">
              {platformLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="transition-colors hover:text-[#2ee59d]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="text-start">
            <h3 className="text-xs font-bold text-gray-400">
              {labels.footer?.company || 'الشركة'}
            </h3>
            <ul className="mt-4 flex flex-col gap-3 text-xs text-gray-200 sm:text-[13px]">
              {companyLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="transition-colors hover:text-[#2ee59d]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="text-start">
            <h3 className="text-xs font-bold text-gray-400">
              {labels.footer?.legal || 'قانوني'}
            </h3>
            <ul className="mt-4 flex flex-col gap-3 text-xs text-gray-200 sm:text-[13px]">
              {legalLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="transition-colors hover:text-[#2ee59d]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-8 text-start text-xs text-gray-400">
          <div>
            <span className="block text-[11px] text-gray-400">
              {language === 'ar'
                ? 'أسواق العمل'
                : language === 'ru'
                  ? 'Рынки присутствия'
                  : language === 'ka'
                    ? 'სამუშაო ბაზრები'
                    : 'Markets'}
            </span>
            <div className="mt-2.5 flex flex-wrap items-center justify-start gap-2.5 text-xs">
              {(Object.values(SUPPORTED_COUNTRIES) as CountryConfig[]).map(
                (c) => {
                  const isActiveMarket = !c.comingSoon
                  return (
                    <span
                      key={c.code}
                      className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 font-bold ${
                        isActiveMarket
                          ? 'bg-[#0b6954] text-white shadow-xs'
                          : 'cursor-default border border-white/10 bg-white/5 text-gray-400'
                      }`}
                    >
                      <CountryFlag code={c.code} className="h-3.5 w-5" />
                      <span>{getCountryName(c, language)}</span>
                      {c.comingSoon && (
                        <span className="rounded-md bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-300">
                          {soonText}
                        </span>
                      )}
                    </span>
                  )
                }
              )}
            </div>
          </div>

          <p className="mt-5 text-[11px] leading-relaxed text-gray-400/90 sm:text-xs">
            {labels.footer?.disclaimer}
          </p>
          <div className="mt-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div className="space-y-1 text-start">
              <p className="text-[11px] text-gray-400">
                {labels.footer?.copyright}
              </p>
              <p className="text-[11px] text-gray-500">
                {labels.footer?.powered}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/opportunities"
                className="text-xs text-gray-400 transition-colors hover:text-white"
              >
                {labels.navbar?.opportunities || 'الفرص المتاحة'}
              </Link>
              <Link
                href="/"
                className="text-xs text-gray-400 transition-colors hover:text-white"
              >
                {language === 'ar'
                  ? 'الرئيسية'
                  : language === 'ru'
                    ? 'Главная'
                    : language === 'ka'
                      ? 'მთავარი'
                      : 'Home'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  )
}