'use client'

import {
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Bell,
  Building2,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  Heart,
  Loader2,
  LogOut,
  Menu,
  ShieldCheck,
  User,
  WalletCards,
  X,
} from 'lucide-react'
import * as authActions from '@/actions/auth-actions'
import { logoutAccountAction } from '@/actions/account-actions'
import { getCurrentSellerProfileAction } from '@/actions/submit-forms'
import {
  getUserNotificationsAction,
  markAllNotificationsAsReadAction,
  markNotificationAsReadAction,
} from '@/actions/notification-actions'
import arDict from '@/dictionaries/ar.json'
import enDict from '@/dictionaries/en.json'
import kaDict from '@/dictionaries/ka.json'
import ruDict from '@/dictionaries/ru.json'
import {
  DICTIONARIES,
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

const langOpts = arDict.navbar.languageOptions

export const SUPPORTED_LANGUAGES: Record<LanguageCode, LanguageConfig> = {
  ar: {
    code: 'ar',
    label: langOpts.ar,
    nativeName: langOpts.ar,
    shortCode: 'AR',
    flagCode: 'AR',
    dir: 'rtl',
  },
  en: {
    code: 'en',
    label: langOpts.en,
    nativeName: langOpts.en,
    shortCode: 'EN',
    flagCode: 'EN',
    dir: 'ltr',
  },
  ru: {
    code: 'ru',
    label: langOpts.ru,
    nativeName: langOpts.ru,
    shortCode: 'RU',
    flagCode: 'RU',
    dir: 'ltr',
  },
  ka: {
    code: 'ka',
    label: langOpts.ka,
    nativeName: langOpts.ka,
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
}

export const SUPPORTED_COUNTRIES: Record<CountryCode, CountryConfig> = {
  GE: {
    code: 'GE',
    nameAr: arDict.sell.optionsData.countries.GE,
    nameEn: enDict.sell.optionsData.countries.GE,
    nameRu: ruDict.sell.optionsData.countries.GE,
    nameKa: kaDict.sell.optionsData.countries.GE,
    flag: '🇬🇪',
    currencyCode: 'USD',
    currencySymbol: '$',
    phoneCode: '+995',
    comingSoon: false,
  },
  EG: {
    code: 'EG',
    nameAr: arDict.sell.optionsData.countries.EG,
    nameEn: enDict.sell.optionsData.countries.EG,
    nameRu: ruDict.sell.optionsData.countries.EG,
    nameKa: kaDict.sell.optionsData.countries.EG,
    flag: '🇪🇬',
    currencyCode: 'EGP',
    currencySymbol: 'ج.م',
    phoneCode: '+20',
    comingSoon: true,
  },
  AE: {
    code: 'AE',
    nameAr: arDict.sell.optionsData.countries.AE,
    nameEn: enDict.sell.optionsData.countries.AE,
    nameRu: ruDict.sell.optionsData.countries.AE,
    nameKa: kaDict.sell.optionsData.countries.AE,
    flag: '🇦🇪',
    currencyCode: 'AED',
    currencySymbol: 'د.إ',
    phoneCode: '+971',
    comingSoon: true,
  },
  RU: {
    code: 'RU',
    nameAr: arDict.sell.optionsData.countries.RU,
    nameEn: enDict.sell.optionsData.countries.RU,
    nameRu: ruDict.sell.optionsData.countries.RU,
    nameKa: kaDict.sell.optionsData.countries.RU,
    flag: '🇷🇺',
    currencyCode: 'RUB',
    currencySymbol: '₽',
    phoneCode: '+7',
    comingSoon: true,
  },
}

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

function getCountryName(c: CountryConfig, lang: LanguageCode) {
  const dictCountries = DICTIONARIES[lang]?.sell?.optionsData?.countries
  if (dictCountries?.[c.code]) return dictCountries[c.code]
  if (lang === 'ar') return c.nameAr
  if (lang === 'ru') return c.nameRu
  if (lang === 'ka') return c.nameKa
  return c.nameEn
}

export function Logo({ inverse = false }: { inverse?: boolean }) {
  const uid = useId().replace(/:/g, '')
  const maskId = `dual-mask-${uid}`
  const sheenId = `dual-sheen-${uid}`

  const primaryFill = inverse ? '#ffffff' : '#0f1d40'
  const accentFill = inverse ? '#2ee59d' : '#007a5a'
  const sheenColor = inverse ? '#2ee59d' : '#ffffff'

  return (
    <Link
      href="/"
      dir="ltr"
      aria-label="DualDealz"
      className="group inline-flex shrink-0 items-center select-none focus:outline-none"
    >
      <svg
        width="88"
        height="46"
        viewBox="0 0 88 46"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-[38px] w-auto sm:h-[42px]"
      >
        <defs>
          <linearGradient id={sheenId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={sheenColor} stopOpacity="0" />
            <stop
              offset="50%"
              stopColor={sheenColor}
              stopOpacity={inverse ? '0.65' : '0.55'}
            />
            <stop offset="100%" stopColor={sheenColor} stopOpacity="0" />
          </linearGradient>

          {/* قناع يضمن مرور اللمعة على حروف اللوجو فقط بدون الخلفية */}
          <mask id={maskId}>
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M2 2H14A13 13 0 0 1 14 28H2V2ZM6.6 6.6V23.4H14A8.4 8.4 0 0 0 14 6.6H6.6Z"
              fill="#ffffff"
            />
            <path
              d="M9 9.1H14A5.9 5.9 0 0 1 14 20.9H9V18.2H14A3.2 3.2 0 0 0 14 11.8H9V9.1Z"
              fill="#ffffff"
              className="transition-transform duration-300 ease-out group-hover:translate-x-[1.5px]"
            />
            <path
              d="M32.5 10H37.1V18.7A4.9 4.9 0 0 0 46.9 18.7V10H51.5V18.7A9.5 9.5 0 0 1 32.5 18.7V10Z"
              fill="#ffffff"
            />
            <rect x="46.9" y="18.5" width="4.6" height="9.5" fill="#ffffff" />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M75.4 19A9.2 9.2 0 1 1 57 19A9.2 9.2 0 1 1 75.4 19ZM70.9 19A4.7 4.7 0 1 0 61.5 19A4.7 4.7 0 1 0 70.9 19Z"
              fill="#ffffff"
            />
            <rect x="70.9" y="10" width="4.5" height="18" fill="#ffffff" />
            <rect x="81.4" y="2" width="4.6" height="26" fill="#ffffff" />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M2 34.2H6.6A4.8 4.8 0 0 1 6.6 43.8H2V34.2ZM3.9 36.1V41.9H6.6A2.9 2.9 0 0 0 6.6 36.1H3.9Z"
              fill="#ffffff"
            />
            <path
              d="M20.6 34.2H28.6V36.05H22.5V38.05H27.5V39.9H22.5V41.95H28.6V43.8H20.6V34.2Z"
              fill="#ffffff"
            />
            <path
              d="M37.8 43.8L42.1 34.2H43.9L48.2 43.8H46.15L43 36.6L39.85 43.8H37.8Z"
              fill="#ffffff"
            />
            <path
              d="M57.8 34.2H59.7V41.95H65.4V43.8H57.8V34.2Z"
              fill="#ffffff"
            />
            <path
              d="M76.4 34.2H86V35.95L79.05 41.95H86V43.8H76.2V42.05L83.15 36.05H76.4V34.2Z"
              fill="#ffffff"
            />
          </mask>
        </defs>

        {/* السطر العلوي: Dual — حروف هندسية مرسومة بالكامل */}
        {/* حرف D الخارجي */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M2 2H14A13 13 0 0 1 14 28H2V2ZM6.6 6.6V23.4H14A8.4 8.4 0 0 0 14 6.6H6.6Z"
          fill={primaryFill}
        />

        {/* بصمة Dual: القوس الزمردي المتداخل داخل حرف D */}
        <path
          d="M9 9.1H14A5.9 5.9 0 0 1 14 20.9H9V18.2H14A3.2 3.2 0 0 0 14 11.8H9V9.1Z"
          fill={accentFill}
          className="transition-transform duration-300 ease-out group-hover:translate-x-[1.5px]"
        />

        {/* حرف u الهندسي */}
        <path
          d="M32.5 10H37.1V18.7A4.9 4.9 0 0 0 46.9 18.7V10H51.5V18.7A9.5 9.5 0 0 1 32.5 18.7V10Z"
          fill={primaryFill}
        />
        <rect x="46.9" y="18.5" width="4.6" height="9.5" fill={primaryFill} />

        {/* حرف a الدائري الهندسي */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M75.4 19A9.2 9.2 0 1 1 57 19A9.2 9.2 0 1 1 75.4 19ZM70.9 19A4.7 4.7 0 1 0 61.5 19A4.7 4.7 0 1 0 70.9 19Z"
          fill={primaryFill}
        />
        <rect x="70.9" y="10" width="4.5" height="18" fill={primaryFill} />

        {/* حرف l المعماري */}
        <rect x="81.4" y="2" width="4.6" height="26" fill={primaryFill} />

        {/* السطر السفلي: D E Λ L Z — محاذاة هندسية كاملة من 2.0 إلى 86.0 */}
        {/* D */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M2 34.2H6.6A4.8 4.8 0 0 1 6.6 43.8H2V34.2ZM3.9 36.1V41.9H6.6A2.9 2.9 0 0 0 6.6 36.1H3.9Z"
          fill={accentFill}
        />
        {/* E */}
        <path
          d="M20.6 34.2H28.6V36.05H22.5V38.05H27.5V39.9H22.5V41.95H28.6V43.8H20.6V34.2Z"
          fill={accentFill}
        />
        {/* A — سقف معماري بدون عارضة */}
        <path
          d="M37.8 43.8L42.1 34.2H43.9L48.2 43.8H46.15L43 36.6L39.85 43.8H37.8Z"
          fill={accentFill}
        />
        {/* L */}
        <path
          d="M57.8 34.2H59.7V41.95H65.4V43.8H57.8V34.2Z"
          fill={accentFill}
        />
        {/* Z */}
        <path
          d="M76.4 34.2H86V35.95L79.05 41.95H86V43.8H76.2V42.05L83.15 36.05H76.4V34.2Z"
          fill={accentFill}
        />

        {/* طبقة اللمعة الضوئية المعمارية */}
        <g mask={`url(#${maskId})`} className="pointer-events-none">
          <rect
            x="0"
            y="-10"
            width="26"
            height="66"
            fill={`url(#${sheenId})`}
            className="dual-logo-sheen"
          />
        </g>
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
  const initialServerLoggedIn = Boolean(
    i18nCtx.hasSession ?? i18nCtx.isLoggedIn
  )
  const initialServerIsStaff = Boolean(i18nCtx.isStaff)

  const [scrolled, setScrolled] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const [hasSession, setHasSession] = useState<boolean>(initialServerLoggedIn)
  const [isAdmin, setIsAdmin] = useState<boolean>(initialServerIsStaff)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [favoritesCount, setFavoritesCount] = useState<number>(0)

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
    const syncFavCount = () => {
      try {
        const raw = localStorage.getItem('darak_favorites')
        const parsed = raw ? JSON.parse(raw) : []
        setFavoritesCount(Array.isArray(parsed) ? parsed.length : 0)
      } catch {
        setFavoritesCount(0)
      }
    }
    syncFavCount()
    window.addEventListener('favorites-updated', syncFavCount)
    window.addEventListener('storage', syncFavCount)
    return () => {
      window.removeEventListener('favorites-updated', syncFavCount)
      window.removeEventListener('storage', syncFavCount)
    }
  }, [pathname])

  useEffect(() => {
    setHasSession(initialServerLoggedIn)
    if (
      typeof document !== 'undefined' &&
      document.cookie.includes('session_hint=1')
    ) {
      setHasSession(true)
    }
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
            verifiedLoggedIn = Boolean(
              profileRes.isLoggedIn && profileRes.user?.id
            )
            setHasSession(verifiedLoggedIn)
            if (!verifiedLoggedIn) setIsAdmin(false)
          }
        }

        if (verifiedLoggedIn) {
          const notifRes = await getUserNotificationsAction('client')
          if (isMounted && notifRes.success) {
            setNotifsList(notifRes.notifications)
            setUnreadCount(notifRes.unreadCount)
          }
        } else if (isMounted) {
          setNotifsList([])
          setUnreadCount(0)
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
    setNotificationsOpen((prev) => !prev)
    setLangMenuOpen(false)
  }

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (unreadCount === 0) return
    setUnreadCount(0)
    setNotifsList((prev) => prev.map((n) => ({ ...n, is_read: true })))
    startNotifTransition(async () => {
      await markAllNotificationsAsReadAction('client')
    })
  }

  const handleSingleNotifClick = (item: any) => {
    const targetUrl = item.link && item.link !== '/' ? item.link : '/account'

    setNotificationsOpen(false)
    if (!item.is_read) {
      setNotifsList((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))

      startNotifTransition(async () => {
        await markNotificationAsReadAction(item.id)
      })
    }

    router.push(targetUrl)
  }

  const currentLangCfg =
    SUPPORTED_LANGUAGES[language] || SUPPORTED_LANGUAGES.ar

  const navItems = [
    {
      href: '/sell',
      label: labels.navbar.sell,
    },
    {
      href: '/opportunities',
      label: labels.navbar.opportunities,
    },
    {
      href: '/how-it-works',
      label: labels.navbar.howItWorks,
    },
    {
      href: '/story',
      label: labels.navbar.story,
    },
    {
      href: '/contact',
      label: labels.navbar.contact,
    },
  ]

  const sellUnitBtnLabel = labels.navbar.sellCta
  const buyUnitBtnLabel = labels.navbar.buy

  const desktopAuthBtnLabel = hasSession
    ? labels.navbar.myAccount
    : labels.navbar.loginGuest

  const favoritesLabel =
    labels.accountPages?.common?.favorites || labels.footer?.favorite

  const logoutLabel = labels.accountPages?.common?.logout

  const nL =
    (labels.accountPages?.notifications as Record<string, string>) || {}
  const notifTitleLabel = nL.title || labels.admin?.shell?.notifications
  const emptyNotifsLabel =
    nL.emptyTitle || labels.admin?.shell?.noNotifications

  const previewNotifs = notifsList.slice(0, 8)
  const unreadPreview = previewNotifs.filter((n) => !n.is_read)
  const readPreview = previewNotifs.filter((n) => n.is_read)

  const renderClientNotifRow = (item: any) => (
    <div
      key={item.id}
      onClick={() => handleSingleNotifClick(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleSingleNotifClick(item)
      }}
      className={`group flex cursor-pointer items-start gap-3 p-3.5 transition hover:bg-gray-50 active:bg-gray-100 ${
        !item.is_read ? 'bg-blue-50/45' : 'bg-white'
      }`}
    >
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#2563eb]">
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
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-xs leading-snug text-[#1e3a8a] ${
              !item.is_read ? 'font-extrabold' : 'font-semibold'
            }`}
          >
            {item.title}
          </p>
          {!item.is_read && (
            <span className="mt-1 size-2 shrink-0 rounded-full bg-[#2563eb]" />
          )}
        </div>
        <p className="mt-1 break-words text-[11.5px] leading-relaxed text-gray-600 line-clamp-2">
          {item.message}
        </p>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-400">
            <Clock className="size-3" />
            <span dir="ltr">
              {item.created_at
                ? new Date(item.created_at).toLocaleDateString('en-GB')
                : labels.admin?.shell?.nowLabel}
            </span>
          </span>
          <span className="text-[11px] font-bold text-[#2563eb] group-hover:underline">
            {labels.accountPages?.common?.viewDetails ||
              labels.admin?.shell?.view}
          </span>
        </div>
      </div>
    </div>
  )

  const renderLanguageDropdownMenu = () => (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute end-0 top-11 z-[110] w-40 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-gray-200/90 bg-white p-1.5 shadow-2xl"
    >
      {(Object.values(SUPPORTED_LANGUAGES) as LanguageConfig[]).map((lang) => {
        const active = lang.code === language
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => handleSelectLanguage(lang.code)}
            className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold transition ${
              active
                ? 'bg-blue-50 font-bold text-[#2563eb]'
                : 'text-[#1e3a8a] hover:bg-gray-50'
            }`}
          >
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
    <div
      onClick={(e) => e.stopPropagation()}
      className={
        isMobile
          ? 'fixed left-3 right-3 top-[76px] z-[110] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl'
          : 'absolute end-0 top-12 z-[110] w-96 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl'
      }
    >
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/90 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold text-[#1e3a8a]">
            {notifTitleLabel}
          </span>
          {unreadCount > 0 && (
            <span
              dir="ltr"
              className="rounded-full bg-[#2563eb]/10 px-2 py-0.5 text-[10px] font-extrabold text-[#2563eb]"
            >
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-extrabold text-[#007a5a] transition hover:bg-emerald-50"
            >
              <CheckCheck className="size-3.5" />
              <span>{nL.markAllReadBtn}</span>
            </button>
          )}
          <Link
            href="/notifications"
            onClick={() => setNotificationsOpen(false)}
            className="rounded-lg px-2 py-1 text-[11px] font-extrabold text-[#2563eb] transition hover:bg-blue-50"
          >
            {nL.viewAllBtn}
          </Link>
        </div>
      </div>

      <div className="max-h-[65vh] overflow-y-auto text-start sm:max-h-96">
        {previewNotifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
            <CheckCircle2 className="mb-2.5 size-9 text-emerald-500" />
            <p className="text-xs font-bold text-[#1e3a8a]">
              {emptyNotifsLabel}
            </p>
          </div>
        ) : (
          <div>
            {unreadPreview.length > 0 && (
              <div>
                <div className="bg-slate-50/90 px-4 py-1.5 text-[10.5px] font-black text-[#2563eb]">
                  {nL.newSectionHeader}
                </div>
                <div className="divide-y divide-gray-100">
                  {unreadPreview.map(renderClientNotifRow)}
                </div>
              </div>
            )}

            {readPreview.length > 0 && (
              <div>
                <div className="bg-slate-50/90 px-4 py-1.5 text-[10.5px] font-black text-gray-400">
                  {nL.olderSectionHeader}
                </div>
                <div className="divide-y divide-gray-100">
                  {readPreview.map(renderClientNotifRow)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 bg-gray-50/70 p-2 text-center">
        <Link
          href="/notifications"
          onClick={() => setNotificationsOpen(false)}
          className="block w-full rounded-xl py-2 text-xs font-extrabold text-[#2563eb] transition hover:bg-blue-50"
        >
          {nL.viewAllBtn}
        </Link>
      </div>
    </div>
  )

  return (
    <header
      dir={dir}
      className={`sticky top-0 z-[90] transition-all duration-500 ${
        scrolled
          ? 'px-3 pt-2.5 sm:px-6 sm:pt-3.5 lg:px-10'
          : 'border-b border-slate-200/50 bg-white/85 px-0 pt-0 backdrop-blur-md'
      }`}
    >
      {isSwitchingLocale && (
        <>
          <div className="absolute inset-x-0 top-0 h-[3px] overflow-hidden bg-blue-100">
            <div className="h-full w-1/2 animate-pulse bg-[#2563eb]" />
          </div>
          <div
            dir="ltr"
            className="fixed top-[80px] left-1/2 z-[120] flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#1e3a8a]/95 px-4 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur-xs"
          >
            <Loader2 className="size-3.5 animate-spin text-[#2ee59d]" />
            <span>{switchingLabel || labels.navbar.switchingDefault}</span>
          </div>
        </>
      )}

      <div
        className={`mx-auto flex max-w-[1280px] items-center justify-between gap-4 transition-all duration-500 ${
          scrolled
            ? 'h-[62px] rounded-full border border-slate-200/80 bg-white/95 px-5 shadow-[0_14px_34px_rgba(30,58,138,0.1)] backdrop-blur-xl sm:h-[66px] sm:px-7'
            : 'h-[68px] px-4 sm:h-[74px] sm:px-6 lg:px-8'
        }`}
      >
        <div className="flex items-center gap-4 xl:gap-6">
          <Logo />
          <nav
            className="hidden items-center gap-1 lg:flex xl:gap-1.5"
            aria-label={labels.navbar?.menuTitle}
          >
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`) ||
                (item.href === '/opportunities' && pathname.startsWith('/units/'))

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                    isActive
                      ? 'bg-blue-50 font-bold text-[#2563eb]'
                      : 'text-[#334155] hover:bg-slate-100/80 hover:text-[#1e3a8a]'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          {hasSession && (
            <Link
              href="/account/favorites"
              className="relative flex size-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-rose-500"
              title={favoritesLabel}
            >
              <Heart
                className={`size-[18px] ${
                  favoritesCount > 0 ? 'fill-rose-500 text-rose-500' : ''
                }`}
              />
              {favoritesCount > 0 && (
                <span
                  dir="ltr"
                  className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-extrabold text-white shadow-2xs"
                >
                  {favoritesCount > 9 ? '+9' : favoritesCount}
                </span>
              )}
            </Link>
          )}

          <div className="relative" ref={langRefDesktop}>
            <button
              type="button"
              disabled={isSwitchingLocale}
              onClick={() => {
                setLangMenuOpen(!langMenuOpen)
                setNotificationsOpen(false)
              }}
              dir="ltr"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200/90 bg-slate-50/80 px-3 text-xs font-bold text-[#1e3a8a] transition hover:border-[#2563eb] hover:bg-white"
            >
              {isSwitchingLocale ? (
                <Loader2 className="size-3.5 animate-spin text-[#2563eb]" />
              ) : (
                <CountryFlag
                  code={currentLangCfg.flagCode}
                  className="h-3 w-4"
                />
              )}
              <span>{currentLangCfg.shortCode}</span>
              <ChevronDown className="size-3 text-gray-400" />
            </button>
            {langMenuOpen && renderLanguageDropdownMenu()}
          </div>

          {hasSession && (
            <div className="relative" ref={notifRefDesktop}>
              <button
                type="button"
                onClick={handleToggleNotifications}
                aria-label={notifTitleLabel}
                title={notifTitleLabel}
                className="relative flex size-9 items-center justify-center rounded-full border border-slate-200/90 bg-slate-50/80 text-[#1e3a8a] transition hover:border-[#2563eb] hover:bg-white"
              >
                <Bell className="size-[18px] stroke-[2.1]" />
                {unreadCount > 0 && (
                  <span
                    dir="ltr"
                    className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-2xs"
                  >
                    {unreadCount > 9 ? '+9' : unreadCount}
                  </span>
                )}
              </button>
              {notificationsOpen && renderNotificationsDropdown(false)}
            </div>
          )}

          <Link
            href={hasSession ? '/account' : '/login'}
            className="inline-flex h-9.5 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-slate-200 bg-white px-3.5 text-xs font-bold text-[#1e3a8a] transition hover:bg-slate-50"
          >
            <User className="size-3.5 text-slate-500" />
            <span>{desktopAuthBtnLabel}</span>
          </Link>

          <Link
            href="/buy"
            className="inline-flex h-9.5 items-center justify-center whitespace-nowrap rounded-full border border-slate-200 bg-white px-4 text-xs font-bold text-[#1e3a8a] transition hover:border-[#2563eb] hover:text-[#2563eb]"
          >
            {buyUnitBtnLabel}
          </Link>

          <Link
            href="/sell"
            className="inline-flex h-9.5 items-center justify-center whitespace-nowrap rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-5 text-xs font-bold text-white shadow-[0_6px_18px_rgba(255,92,75,0.28)] transition hover:opacity-95 active:scale-95"
          >
            {sellUnitBtnLabel}
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              className="inline-flex h-9.5 items-center justify-center gap-1 whitespace-nowrap rounded-full bg-[#1e3a8a] px-3 text-xs font-bold text-white transition hover:bg-[#1d4ed8]"
              title={labels.admin?.shell?.adminPanel}
            >
              <ShieldCheck className="size-3.5 shrink-0 text-[#2ee59d]" />
              <span>{labels.navbar.adminShort}</span>
            </Link>
          )}
        </div>

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
              className="inline-flex h-8 items-center justify-center gap-1 rounded-full border border-gray-200/90 bg-gray-50/90 px-2.5 text-[11px] font-bold text-[#1e3a8a]"
            >
              <CountryFlag code={currentLangCfg.flagCode} className="h-3 w-4" />
              <span className="font-mono leading-none">
                {currentLangCfg.shortCode}
              </span>
            </button>
            {langMenuOpen && renderLanguageDropdownMenu()}
          </div>

          {hasSession ? (
            <div className="relative" ref={notifRefMobile}>
              <button
                type="button"
                onClick={handleToggleNotifications}
                aria-label={notifTitleLabel}
                className="relative flex size-8 items-center justify-center rounded-full border border-gray-200/90 bg-gray-50 text-[#1e3a8a]"
              >
                <Bell className="size-4 stroke-[2.2]" />
                {unreadCount > 0 && (
                  <span
                    dir="ltr"
                    className="absolute -right-0.5 -top-0.5 flex size-3.5 items-center justify-center rounded-full bg-red-500 text-[8.5px] font-bold text-white"
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
              className="inline-flex h-8 items-center justify-center whitespace-nowrap rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-3.5 text-[11px] font-bold text-white shadow-xs"
            >
              {sellUnitBtnLabel}
            </Link>
          )}

          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(!mobileMenuOpen)
              setLangMenuOpen(false)
              setNotificationsOpen(false)
            }}
            aria-label={labels.navbar?.menuLabel}
            className="flex size-8 items-center justify-center rounded-full border border-gray-200/80 bg-gray-50 text-[#1e3a8a]"
          >
            {mobileMenuOpen ? (
              <X className="size-4 stroke-[2]" />
            ) : (
              <Menu className="size-4 stroke-[2]" />
            )}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          onClick={() => setLangMenuOpen(false)}
          className="mx-3 mt-2 overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl lg:hidden"
        >
          <nav className="flex flex-col gap-2.5">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`) ||
                (item.href === '/opportunities' && pathname.startsWith('/units/'))

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-bold transition ${
                    isActive
                      ? 'bg-blue-50 text-[#2563eb]'
                      : 'text-[#1e3a8a] hover:bg-slate-50'
                  }`}
                >
                  <span>{item.label}</span>
                </Link>
              )
            })}

            {hasSession && (
              <Link
                href="/account/favorites"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#1e3a8a] transition hover:bg-slate-50"
              >
                <div className="flex items-center gap-2">
                  <Heart
                    className={`size-4 ${
                      favoritesCount > 0
                        ? 'fill-rose-500 text-rose-500'
                        : 'text-rose-500'
                    }`}
                  />
                  <span>{favoritesLabel}</span>
                </div>
                {favoritesCount > 0 && (
                  <span
                    dir="ltr"
                    className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-extrabold text-rose-600"
                  >
                    {favoritesCount > 9 ? '+9' : favoritesCount}
                  </span>
                )}
              </Link>
            )}
          </nav>
          <hr className="my-4 border-gray-100" />
          <div className="flex flex-col gap-2.5">
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1e3a8a] text-xs font-bold text-white"
              >
                <ShieldCheck className="size-4 text-[#2ee59d]" />
                <span>{labels.admin?.shell?.adminPanel}</span>
              </Link>
            )}
            <Link
              href="/sell"
              onClick={() => setMobileMenuOpen(false)}
              className="flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#ff6437] to-[#ff4f69] text-xs font-bold text-white shadow-sm"
            >
              <span>{sellUnitBtnLabel}</span>
            </Link>
            <Link
              href="/buy"
              onClick={() => setMobileMenuOpen(false)}
              className="flex h-11 w-full items-center justify-center rounded-xl border border-[#e2e8f0] bg-white text-xs font-bold text-[#1e3a8a]"
            >
              {buyUnitBtnLabel}
            </Link>
            <Link
              href={hasSession ? '/account' : '/login'}
              onClick={() => setMobileMenuOpen(false)}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#e2e8f0] bg-gray-50 text-xs font-bold text-[#1e3a8a]"
            >
              <User className="size-4" />
              <span>{desktopAuthBtnLabel}</span>
            </Link>

            {hasSession && (
              <form
                action={async () => {
                  setMobileMenuOpen(false)
                  setHasSession(false)
                  setIsAdmin(false)
                  await logoutAccountAction()
                }}
              >
                <button
                  type="submit"
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/50 text-xs font-bold text-red-600 transition hover:bg-red-100/70"
                >
                  <LogOut className="size-4" />
                  <span>{logoutLabel}</span>
                </button>
              </form>
            )}
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

  const activePhone =
    siteSettings?.whatsappNumber || labels.footer?.phone || '+201018595959'
  const activeEmail =
    siteSettings?.supportEmail || labels.footer?.email || 'info@dualdealz.com'

  const platformLinks = [
    {
      label: labels.navbar.opportunities,
      href: '/opportunities',
    },
    {
      label: labels.footer.forSellers,
      href: '/sell',
    },
    {
      label: labels.footer.forBuyers,
      href: '/buy',
    },
    { label: labels.footer.calculator, href: '/calculator' },
    ...(hasSession
      ? [
          {
            label: labels.footer.favorite,
            href: '/account/favorites',
          },
        ]
      : []),
    {
      label: hasSession ? labels.navbar.myAccount : labels.navbar.loginGuest,
      href: hasSession ? '/account' : '/login',
    },
  ]

  const companyLinks = [
    { label: labels.footer.about, href: '/story' },
    { label: labels.footer.work, href: '/how-it-works' },
    { label: labels.footer.faq, href: '/faq' },
    { label: labels.navbar.contact, href: '/contact' },
  ]

  const legalLinks = [
    { label: labels.footer.privacy, href: '/privacy' },
    { label: labels.footer.terms, href: '/terms' },
    {
      label: labels.footer.adminPanelLink || labels.admin?.shell?.adminPanel,
      href: '/admin',
    },
  ]

  const soonText = labels.footer.soonBadge

  return (
    <footer
      className="bg-gradient-to-b from-[#172554] to-[#0f172a] text-white"
      dir={dir}
    >
      <div className="mx-auto max-w-[1360px] px-5 pt-14 pb-12 sm:px-6 lg:px-10 lg:pt-20">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.45fr_1fr_1fr_1fr] lg:gap-12">
          <div className="text-start">
            <Logo inverse />
            <p className="mt-5 max-w-sm text-xs leading-[1.9] text-blue-100/80 sm:text-[13px]">
              {labels.footer?.description}
            </p>
            <div className="mt-5 flex flex-col items-start gap-2 text-xs text-blue-100 sm:text-[13px]">
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
            <h3 className="text-xs font-bold text-blue-200/70">
              {labels.footer?.platform}
            </h3>
            <ul className="mt-4 flex flex-col gap-3 text-xs text-blue-50 sm:text-[13px]">
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
            <h3 className="text-xs font-bold text-blue-200/70">
              {labels.footer?.company}
            </h3>
            <ul className="mt-4 flex flex-col gap-3 text-xs text-blue-50 sm:text-[13px]">
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
            <h3 className="text-xs font-bold text-blue-200/70">
              {labels.footer?.legal}
            </h3>
            <ul className="mt-4 flex flex-col gap-3 text-xs text-blue-50 sm:text-[13px]">
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
        <div className="mt-12 border-t border-white/10 pt-8 text-start text-xs text-blue-200/70">
          <div>
            <span className="block text-[11px]">
              {labels.footer?.marketsTitle}
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
                          ? 'bg-[#007a5a] text-white shadow-xs'
                          : 'cursor-default border border-white/10 bg-white/5 text-blue-200/60'
                      }`}
                    >
                      <CountryFlag code={c.code} className="h-3.5 w-5" />
                      <span>{getCountryName(c, language)}</span>
                      {c.comingSoon && (
                        <span className="rounded-md bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                          {soonText}
                        </span>
                      )}
                    </span>
                  )
                }
              )}
            </div>
          </div>
          <p className="mt-5 text-[11px] leading-relaxed text-blue-200/60 sm:text-xs">
            {labels.footer?.disclaimer}
          </p>
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