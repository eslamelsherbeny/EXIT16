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
import ar from '@/dictionaries/ar.json'
import en from '@/dictionaries/en.json'

type Dictionary = typeof ar

// ==================== إعدادات الدول الـ 4 ====================
export type CountryCode = 'EG' | 'RU' | 'GE' | 'AE'

export type CountryConfig = {
  code: CountryCode
  nameAr: string
  nameEn: string
  nameRu: string
  flag: string
  currencyCode: string
  currencySymbol: string
  phoneCode: string
  defaultPackages: {
    days7: number
    days14: number
    days30: number
  }
}

export const SUPPORTED_COUNTRIES: Record<CountryCode, CountryConfig> = {
  EG: {
    code: 'EG',
    nameAr: 'مصر',
    nameEn: 'Egypt',
    nameRu: 'Египет',
    flag: '🇪🇬',
    currencyCode: 'EGP',
    currencySymbol: 'ج.م',
    phoneCode: '+20',
    defaultPackages: { days7: 1199, days14: 1999, days30: 2799 },
  },
  RU: {
    code: 'RU',
    nameAr: 'روسيا',
    nameEn: 'Russia',
    nameRu: 'Россия',
    flag: '🇷🇺',
    currencyCode: 'RUB',
    currencySymbol: '₽',
    phoneCode: '+7',
    defaultPackages: { days7: 2500, days14: 4200, days30: 5900 },
  },
  GE: {
    code: 'GE',
    nameAr: 'جورجيا',
    nameEn: 'Georgia',
    nameRu: 'Грузия',
    flag: '🇬🇪',
    currencyCode: 'USD',
    currencySymbol: '$',
    phoneCode: '+995',
    defaultPackages: { days7: 29, days14: 49, days30: 69 },
  },
  AE: {
    code: 'AE',
    nameAr: 'الإمارات',
    nameEn: 'UAE',
    nameRu: 'ОАЭ',
    flag: '🇦🇪',
    currencyCode: 'AED',
    currencySymbol: 'د.إ',
    phoneCode: '+971',
    defaultPackages: { days7: 99, days14: 179, days30: 249 },
  },
}

export function getActiveCountryFromCookie(): CountryConfig {
  if (typeof document !== 'undefined') {
    const match = document.cookie
      .split('; ')
      .find((row) => row.startsWith('darak_country='))
    const code = match?.split('=')[1]?.trim() as CountryCode | undefined
    if (code && SUPPORTED_COUNTRIES[code]) {
      return SUPPORTED_COUNTRIES[code]
    }
  }
  return SUPPORTED_COUNTRIES.EG
}

const links = [
  { href: '/sell', key: 'sell' as const, fallback: 'بيع وحدتك', enFallback: 'Sell Unit' },
  { href: '/opportunities', key: 'opportunities' as const, fallback: 'الفرص المتاحة', enFallback: 'Opportunities' },
  { href: '/story', key: 'story' as const, fallback: 'قصتنا', enFallback: 'Our Story' },
  { href: '/how-it-works', key: 'howItWorks' as const, fallback: 'إزاي بنشتغل', enFallback: 'How It Works' },
  { href: '/contact', key: 'contact' as const, fallback: 'كلمنا', enFallback: 'Contact Us' },
  { href: '/investors', key: 'investors' as const, fallback: 'للمستثمرين', enFallback: 'Investors' },
]

// ==================== 1. اللوجو ====================
export function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link
      href="/"
      dir="ltr"
      className={`inline-block shrink-0 select-none ${inverse ? 'text-white' : 'text-[#0a1122]'}`}
      aria-label="Aqar Exit"
    >
      <svg
        width="102"
        height="48"
        viewBox="0 0 116 54"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-[42px] w-auto"
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

// ==================== 2. الهيدر (Navbar) ====================
export function Navbar({ dictionary = ar }: { dictionary?: Dictionary }) {
  const router = useRouter()
  const pathname = usePathname()

  const [language, setLanguage] = useState<'ar' | 'en'>('ar')
  const [country, setCountry] = useState<CountryCode>('EG')
  const [countryMenuOpen, setCountryMenuOpen] = useState(false)
  const [hasSession, setHasSession] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // حالات الإشعارات
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifsList, setNotifsList] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [, startTransition] = useTransition()

  const notifRefDesktop = useRef<HTMLDivElement>(null)
  const notifRefMobile = useRef<HTMLDivElement>(null)
  const countryRefDesktop = useRef<HTMLDivElement>(null)
  const countryRefMobile = useRef<HTMLDivElement>(null)
  const labels = language === 'en' ? en : dictionary

  // قراءة الدولة المحفوظة أو التعرف التلقائي المبدئي من المتصفح في أول زيارة فقط
  useEffect(() => {
    const hasCookie = document.cookie
      .split('; ')
      .some((row) => row.startsWith('darak_country='))

    if (hasCookie) {
      setCountry(getActiveCountryFromCookie().code)
    } else {
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
        let detected: CountryCode = 'EG'
        if (tz.includes('Moscow') || tz.includes('Europe/')) detected = 'RU'
        if (tz.includes('Tbilisi')) detected = 'GE'
        if (tz.includes('Dubai')) detected = 'AE'
        setCountry(detected)
        document.cookie = `darak_country=${detected}; path=/; max-age=31536000; SameSite=Lax`
      } catch {
        setCountry('EG')
      }
    }

    const syncCountry = () => {
      setCountry(getActiveCountryFromCookie().code)
    }
    window.addEventListener('country-changed', syncCountry)
    return () => window.removeEventListener('country-changed', syncCountry)
  }, [])

  const handleSelectCountry = (code: CountryCode) => {
    setCountry(code)
    setCountryMenuOpen(false)
    document.cookie = `darak_country=${code}; path=/; max-age=31536000; SameSite=Lax`
    window.dispatchEvent(new Event('country-changed'))
    router.refresh()
  }

  useEffect(() => {
    document.cookie = `locale=${language}; path=/; max-age=31536000`
    document.documentElement.lang = language
    document.documentElement.dir = language === 'en' ? 'ltr' : 'rtl'
  }, [language])

  useEffect(() => {
    let isMounted = true
    async function verifyUserAndRole() {
      const hintExists = document.cookie
        .split('; ')
        .some((cookie) => cookie.startsWith('session_hint='))
      if (isMounted) setHasSession(hintExists)

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
    setCountryMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      const insideDesktopNotif = notifRefDesktop.current?.contains(target)
      const insideMobileNotif = notifRefMobile.current?.contains(target)
      const insideDesktopCountry = countryRefDesktop.current?.contains(target)
      const insideMobileCountry = countryRefMobile.current?.contains(target)

      if (!insideDesktopNotif && !insideMobileNotif) {
        setNotificationsOpen(false)
      }
      if (!insideDesktopCountry && !insideMobileCountry) {
        setCountryMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleToggleNotifications = () => {
    const nextState = !notificationsOpen
    setNotificationsOpen(nextState)
    setCountryMenuOpen(false)

    if (nextState && unreadCount > 0) {
      setUnreadCount(0)
      setNotifsList((prev) => prev.map((n) => ({ ...n, is_read: true })))
      startTransition(async () => {
        await markAllNotificationsAsReadAction('client')
      })
    }
  }

  const handleSingleNotifClick = (item: any) => {
    const targetUrl =
      item.link && item.link !== '/' ? item.link : '/account'

    setNotificationsOpen(false)
    setNotifsList((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))

    startTransition(async () => {
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

    startTransition(async () => {
      await deleteNotificationAction(id)
    })
  }

  const handleClearAllNotifications = (e: React.MouseEvent) => {
    e.stopPropagation()
    setNotifsList([])
    setUnreadCount(0)

    startTransition(async () => {
      await clearAllNotificationsAction('client')
    })
  }

  const currentCountryCfg = SUPPORTED_COUNTRIES[country] || SUPPORTED_COUNTRIES.EG

  // القائمة المنسدلة للدول (تظهر اسم الدولة بلغة الموقع + العلم + الكود بدون أي عملة)
  const renderCountryDropdownMenu = () => (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute left-0 top-11 z-50 w-44 overflow-hidden rounded-2xl border border-gray-200 bg-white p-1.5 shadow-xl"
    >
      <p className="px-2.5 py-1.5 text-right text-[10px] font-bold text-gray-400">
        {language === 'en' ? 'Select Country:' : 'اختر الدولة:'}
      </p>
      {(Object.values(SUPPORTED_COUNTRIES) as CountryConfig[]).map((c) => {
        const active = c.code === country
        return (
          <button
            key={c.code}
            type="button"
            onClick={() => handleSelectCountry(c.code)}
            className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-right text-xs font-bold transition ${
              active
                ? 'bg-[#eff9f5] text-[#0b6954]'
                : 'text-[#0a1122] hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-base leading-none">{c.flag}</span>
              <span>{language === 'en' ? c.nameEn : c.nameAr}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-mono text-[10px] font-extrabold text-gray-400">
                {c.code}
              </span>
              {active && <Check className="size-3.5 text-[#0b6954]" />}
            </div>
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
          ? 'fixed left-3 right-3 top-[76px] z-50 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl'
          : 'absolute left-0 top-12 z-50 w-96 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl'
      }
    >
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/90 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold text-[#0a1122]">
            إشعاراتي
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
              مسح الكل
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

      <div className="max-h-[65vh] divide-y divide-gray-100 overflow-y-auto text-right sm:max-h-96">
        {notifsList.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
            <CheckCircle2 className="mb-2.5 size-9 text-emerald-500" />
            <p className="text-xs font-extrabold text-[#0a1122]">
              لا توجد إشعارات حالياً
            </p>
            <p className="mt-1 text-[11px] text-gray-400">
              سنرسل لك تنبيهاً فور وجود أي تحديث على وحدتك أو طلبك.
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
                        : 'الآن'}
                    </span>
                  </span>

                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0b6954] group-hover:underline">
                    <span>عرض التفاصيل</span>
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
          الذهاب إلى حسابي الشخصي
        </button>
      </div>
    </div>
  )

  return (
    <header
      dir="rtl"
      className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/95 backdrop-blur-md"
    >
      <div className="mx-auto flex h-[72px] max-w-[1180px] items-center justify-between gap-4 px-4 sm:px-6">
        {/* اليمين: اللوجو والروابط متقاربة وملمومة مثل الموقع الأصلي */}
        <div className="flex items-center gap-5 xl:gap-7">
          <Logo />
          <nav
            className="hidden items-center gap-3.5 lg:flex xl:gap-4"
            aria-label={labels.navbar?.menuTitle || 'القائمة الرئيسية'}
          >
            {links.map((link) => {
              const isActive =
                pathname === link.href || pathname.startsWith(`${link.href}/`)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`whitespace-nowrap text-[13.5px] transition-colors hover:text-[#0b6954] ${
                    isActive
                      ? 'font-bold text-[#0b6954]'
                      : 'font-normal text-[#4b5563]'
                  }`}
                >
                  {language === 'en'
                    ? labels.navbar?.[link.key] || link.enFallback
                    : labels.navbar?.[link.key] || link.fallback}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* اليسار (ديسكتوب): زر الدولة (علم + رمز فقط) + زر اللغة الواضح + أزرار الحساب + لوحة الإدارة في أقصى اليسار */}
        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          {/* 1. زر الدولة المنسدل (العلم + الرمز فقط مثل 🇪🇬 EG) */}
          <div className="relative" ref={countryRefDesktop}>
            <button
              type="button"
              onClick={() => {
                setCountryMenuOpen(!countryMenuOpen)
                setNotificationsOpen(false)
              }}
              dir="ltr"
              className="inline-flex h-[38px] items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50/70 px-2.5 text-xs font-extrabold text-[#0a1122] transition hover:border-[#0b6954] hover:bg-white"
              title="تغيير الدولة"
            >
              <span className="text-sm leading-none">
                {currentCountryCfg.flag}
              </span>
              <span className="font-mono text-[11.5px] tracking-wide">
                {currentCountryCfg.code}
              </span>
              <ChevronDown className="size-3 text-gray-400" />
            </button>

            {countryMenuOpen && renderCountryDropdownMenu()}
          </div>

          {/* 2. زر تغيير اللغة الواضح بأيقونة الكرة الأرضية */}
          <button
            type="button"
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            className="inline-flex h-[38px] items-center gap-1.5 rounded-xl border border-transparent px-2.5 text-[13px] font-semibold text-[#1e293b] transition-colors hover:border-gray-200 hover:bg-gray-50 hover:text-[#0b6954]"
            title="تغيير اللغة / Change Language"
          >
            <Globe className="size-3.5 text-gray-500" />
            <span>{language === 'ar' ? 'English' : 'العربية'}</span>
          </button>

          {/* 3. زر حسابي */}
          <Link
            href={hasSession ? '/account' : '/login'}
            className="inline-flex h-[40px] items-center justify-center whitespace-nowrap rounded-[11px] border border-[#e2e8f0] bg-white px-3.5 text-[13.5px] font-semibold text-[#0f172a] transition-colors hover:bg-gray-50"
          >
            <span>
              {hasSession
                ? language === 'en'
                  ? 'My Account'
                  : 'حسابي'
                : language === 'en'
                  ? 'Login'
                  : labels.navbar?.login || 'حسابي'}
            </span>
          </Link>

          {/* 4. زر عايز تشتري */}
          <Link
            href="/buy"
            className="inline-flex h-[40px] items-center justify-center whitespace-nowrap rounded-[11px] border border-[#e2e8f0] bg-white px-3.5 text-[13.5px] font-semibold text-[#0f172a] transition-colors hover:bg-gray-50"
          >
            {language === 'en' ? 'Want to Buy' : 'عايز تشتري'}
          </Link>

          {/* 5. جرس الإشعارات */}
          {hasSession && (
            <div className="relative" ref={notifRefDesktop}>
              <button
                type="button"
                onClick={handleToggleNotifications}
                aria-label="الإشعارات"
                className="relative flex size-9 items-center justify-center rounded-xl text-[#334155] transition-colors hover:bg-gray-100"
              >
                <Bell className="size-[18px] stroke-[1.8]" />
                {unreadCount > 0 && (
                  <span
                    dir="ltr"
                    className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-extrabold text-white"
                  >
                    {unreadCount > 9 ? '+9' : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && renderNotificationsDropdown(false)}
            </div>
          )}

          {/* 6. زر عايز تبيع */}
          <Link
            href="/sell"
            className="inline-flex h-[40px] items-center justify-center whitespace-nowrap rounded-[11px] bg-[#0b6954] px-4 text-[13.5px] font-semibold text-white transition-colors hover:bg-[#085443]"
          >
            {language === 'en' ? 'Want to Sell' : 'عايز تبيع'}
          </Link>

          {/* 7. زر لوحة الإدارة في أقصى اليسار */}
          {isAdmin && (
            <Link
              href="/admin"
              className="inline-flex h-[40px] items-center justify-center gap-1.5 whitespace-nowrap rounded-[11px] bg-[#0a1122] px-3 text-[12.5px] font-bold text-white shadow-xs transition-colors hover:bg-[#16223f]"
              title="لوحة الإدارة"
            >
              <ShieldCheck className="size-4 text-[#2ee59d]" />
              <span>{language === 'en' ? 'Admin' : 'لوحة الإدارة'}</span>
            </Link>
          )}
        </div>

        {/* اليسار (موبايل): قائمة منسدلة للدولة (علم + رمز فقط) + إشعارات أو عايز تبيع + زر القائمة المربع */}
        <div className="flex items-center gap-1.5 lg:hidden">
          {/* زر الدولة للموبايل (يفتح قائمة منسدلة مباشرة تحته) */}
          <div className="relative" ref={countryRefMobile}>
            <button
              type="button"
              dir="ltr"
              onClick={() => {
                setCountryMenuOpen(!countryMenuOpen)
                setNotificationsOpen(false)
              }}
              className="inline-flex h-[38px] items-center gap-1 rounded-xl border border-gray-200/90 bg-gray-50 px-2.5 text-xs font-extrabold text-[#0a1122]"
            >
              <span className="text-sm leading-none">
                {currentCountryCfg.flag}
              </span>
              <span className="font-mono text-[11px]">
                {currentCountryCfg.code}
              </span>
              <ChevronDown className="size-3 text-gray-400" />
            </button>

            {countryMenuOpen && renderCountryDropdownMenu()}
          </div>

          {hasSession ? (
            <div className="relative" ref={notifRefMobile}>
              <button
                type="button"
                onClick={handleToggleNotifications}
                aria-label="الإشعارات"
                className="relative flex size-[38px] items-center justify-center rounded-xl border border-gray-200/80 bg-white text-[#334155] shadow-xs transition-colors hover:bg-gray-50"
              >
                <Bell className="size-[18px] stroke-[2]" />
                {unreadCount > 0 && (
                  <span
                    dir="ltr"
                    className="absolute -top-1 -right-1 flex size-[18px] items-center justify-center rounded-full border-2 border-white bg-red-500 text-[9px] font-extrabold text-white"
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
              className="inline-flex h-[38px] items-center justify-center whitespace-nowrap rounded-xl bg-[#0b6954] px-3.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#085443]"
            >
              {language === 'en' ? 'Sell' : 'عايز تبيع'}
            </Link>
          )}

          {/* زر القائمة المربع بحواف ناعمة */}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(!mobileMenuOpen)
              setCountryMenuOpen(false)
              setNotificationsOpen(false)
            }}
            aria-label="القائمة"
            className="flex size-[38px] items-center justify-center rounded-xl border border-gray-200/80 bg-gray-50 text-[#0a1122] shadow-xs focus:outline-none"
          >
            {mobileMenuOpen ? (
              <X className="size-5 stroke-[2]" />
            ) : (
              <Menu className="size-5 stroke-[2]" />
            )}
          </button>
        </div>
      </div>

      {/* قائمة الموبايل المنسدلة (تمت إزالة اختيار الدولة منها وبقي اختيار اللغة واضحاً) */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-[72px] bottom-0 z-50 h-[calc(100vh-72px)] overflow-y-auto border-t border-gray-100 bg-white px-6 pt-5 pb-12 lg:hidden">
          <nav className="flex flex-col gap-4 text-right">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`text-[17px] font-medium transition-colors ${
                pathname === '/' ? 'font-bold text-[#0b6954]' : 'text-[#0a1122]'
              }`}
            >
              {language === 'en' ? 'Home' : 'الرئيسية'}
            </Link>
            {links.map((link) => {
              const isActive =
                pathname === link.href || pathname.startsWith(`${link.href}/`)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-[17px] font-medium transition-colors ${
                    isActive ? 'font-bold text-[#0b6954]' : 'text-[#0a1122]'
                  }`}
                >
                  {language === 'en'
                    ? labels.navbar?.[link.key] || link.enFallback
                    : labels.navbar?.[link.key] || link.fallback}
                </Link>
              )
            })}
          </nav>

          <hr className="my-5 border-gray-200/80" />

          <div className="flex flex-col gap-3">
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-[#0a1122] text-[15px] font-bold text-white shadow-sm transition-colors hover:bg-[#16223f]"
              >
                <ShieldCheck className="size-5 text-[#2ee59d]" />
                <span>الدخول إلى لوحة الإدارة</span>
              </Link>
            )}
            <Link
              href="/sell"
              onClick={() => setMobileMenuOpen(false)}
              className="flex h-[48px] w-full items-center justify-center rounded-xl bg-[#0b6954] text-[15px] font-bold text-white transition-colors hover:bg-[#085443]"
            >
              {language === 'en' ? 'Want to Sell' : 'عايز تبيع'}
            </Link>
            <Link
              href="/buy"
              onClick={() => setMobileMenuOpen(false)}
              className="flex h-[48px] w-full items-center justify-center rounded-xl border border-[#e2e8f0] bg-white text-[15px] font-semibold text-[#0a1122] transition-colors hover:bg-gray-50"
            >
              {language === 'en' ? 'Want to Buy' : 'عايز تشتري'}
            </Link>
            <Link
              href={hasSession ? '/account' : '/login'}
              onClick={() => setMobileMenuOpen(false)}
              className="flex h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-[#e2e8f0] bg-gray-50 text-[15px] font-bold text-[#1d3557] transition-colors hover:bg-gray-100"
            >
              <User className="size-4" />
              <span>
                {hasSession ? 'حسابي الشخصي' : 'تسجيل الدخول / إنشاء حساب'}
              </span>
            </Link>
            <Link
              href="/opportunities#app-banner"
              onClick={() => setMobileMenuOpen(false)}
              className="flex h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-[#99cec3] bg-[#eff8f6] text-[15px] font-semibold text-[#0b6954] transition-colors hover:bg-[#e2f3ef]"
            >
              <Smartphone className="size-4 stroke-[2.2]" />
              <span>{language === 'en' ? 'Get the App' : 'حمّل التطبيق'}</span>
            </Link>

            {/* مبدل اللغة الواضح داخل قائمة الموبايل */}
            <div className="mt-2 rounded-2xl border border-gray-200 bg-gray-50/70 p-3">
              <p className="mb-2 flex items-center justify-center gap-1.5 text-xs font-bold text-gray-500">
                <Globe className="size-3.5 text-[#0b6954]" />
                <span>اللغة / Language</span>
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLanguage('ar')
                    setMobileMenuOpen(false)
                  }}
                  className={`rounded-xl py-2 text-xs font-extrabold transition ${
                    language === 'ar'
                      ? 'bg-[#0b6954] text-white shadow-2xs'
                      : 'bg-white text-gray-700 border border-gray-200'
                  }`}
                >
                  العربية
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLanguage('en')
                    setMobileMenuOpen(false)
                  }}
                  className={`rounded-xl py-2 text-xs font-extrabold transition ${
                    language === 'en'
                      ? 'bg-[#0b6954] text-white shadow-2xs'
                      : 'bg-white text-gray-700 border border-gray-200'
                  }`}
                >
                  English
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export function LegacyNavbar({ dictionary = ar }: { dictionary?: Dictionary }) {
  return <Navbar dictionary={dictionary} />
}

// ==================== 3. الفوتر المنظم (Footer) ====================
export function Footer({ dictionary = ar }: { dictionary?: Dictionary }) {
  const router = useRouter()
  const [activeCountry, setActiveCountry] = useState<CountryCode>('EG')

  useEffect(() => {
    setActiveCountry(getActiveCountryFromCookie().code)
    const sync = () => setActiveCountry(getActiveCountryFromCookie().code)
    window.addEventListener('country-changed', sync)
    return () => window.removeEventListener('country-changed', sync)
  }, [])

  const selectFooterCountry = (code: CountryCode) => {
    setActiveCountry(code)
    document.cookie = `darak_country=${code}; path=/; max-age=31536000; SameSite=Lax`
    window.dispatchEvent(new Event('country-changed'))
    router.refresh()
  }

  const platformLinks = [
    { label: 'الفرص المتاحة', href: '/opportunities' },
    { label: dictionary.footer?.forSellers || 'للبايعين (بيع وحدتك)', href: '/sell' },
    { label: dictionary.footer?.forBuyers || 'للمشترين (اطلب وحدة)', href: '/buy' },
    { label: dictionary.footer?.calculator || 'حاسبة الخروج', href: '/calculator' },
    { label: dictionary.footer?.favorite || 'المفضلة', href: '/account/favorites' },
    { label: 'حسابي', href: '/account' },
  ]

  const companyLinks = [
    { label: dictionary.footer?.about || 'قصتنا', href: '/story' },
    { label: dictionary.footer?.work || 'إزاي بنشتغل', href: '/how-it-works' },
    { label: dictionary.footer?.reports || 'التقارير والمؤشرات', href: '/reports' },
    { label: 'للمطورين', href: '/developers' },
    {
      label: dictionary.footer?.investorRelations || 'علاقات المستثمرين',
      href: '/investors',
    },
    { label: dictionary.footer?.faq || 'الأسئلة الشائعة', href: '/faq' },
    { label: 'كلمنا', href: '/contact' },
  ]

  const legalLinks = [
    { label: dictionary.footer?.privacy || 'سياسة الخصوصية', href: '/privacy' },
    { label: dictionary.footer?.terms || 'الشروط والأحكام', href: '/terms' },
    { label: 'لوحة الإدارة', href: '/admin' },
  ]

  return (
    <footer className="bg-[#0a1122] text-white" dir="rtl">
      <div className="mx-auto max-w-[1140px] px-5 pt-14 pb-12 sm:px-6 lg:pt-20">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.45fr_1fr_1fr_1fr] lg:gap-12">
          <div className="text-right">
            <Logo inverse />
            <p className="mt-5 max-w-sm text-xs leading-[1.9] text-gray-300/85 sm:text-[13px]">
              {dictionary.footer?.description ||
                'منصة التنازل عن وحدات التقسيط بدون أوفر — البايع يسترجع فلوسه كاش، والمشتري ياخد سعر التعاقد القديم، وإحنا بنسهّل الإجراءات خطوة بخطوة'}
            </p>
            <div className="mt-5 flex flex-col items-start gap-2 text-xs text-gray-300 sm:text-[13px]">
              <a
                href={`tel:${dictionary.footer?.phone || '+201018595959'}`}
                dir="ltr"
                className="transition-colors hover:text-[#2ee59d]"
              >
                {dictionary.footer?.phone || '+201018595959'}
              </a>
              <a
                href="https://wa.me/201018595959"
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-[#2ee59d]"
              >
                تواصل مباشر عبر واتساب
              </a>
              <a
                href={`mailto:${dictionary.footer?.email || 'info@aqarexit.com'}`}
                className="transition-colors hover:text-[#2ee59d]"
              >
                {dictionary.footer?.email || 'info@aqarexit.com'}
              </a>
            </div>
          </div>
          <div className="text-right">
            <h3 className="text-xs font-bold text-gray-400">
              {dictionary.footer?.platform || 'المنصة'}
            </h3>
            <ul className="mt-4 flex flex-col gap-3 text-xs text-gray-200 sm:text-[13px]">
              {platformLinks.map((item) => (
                <li key={item.label}>
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
          <div className="text-right">
            <h3 className="text-xs font-bold text-gray-400">
              {dictionary.footer?.company || 'الشركة'}
            </h3>
            <ul className="mt-4 flex flex-col gap-3 text-xs text-gray-200 sm:text-[13px]">
              {companyLinks.map((item) => (
                <li key={item.label}>
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
          <div className="text-right">
            <h3 className="text-xs font-bold text-gray-400">
              {dictionary.footer?.legal || 'قانوني'}
            </h3>
            <ul className="mt-4 flex flex-col gap-3 text-xs text-gray-200 sm:text-[13px]">
              {legalLinks.map((item) => (
                <li key={item.label}>
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

        <div className="mt-12 border-t border-white/10 pt-8 text-right text-xs text-gray-400">
          <div>
            <span className="block text-[11px] text-gray-400">الدولة</span>
            <div className="mt-2.5 flex flex-wrap items-center justify-start gap-3 text-xs">
              {(Object.values(SUPPORTED_COUNTRIES) as CountryConfig[]).map(
                (c) => {
                  const isCurrent = c.code === activeCountry
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => selectFooterCountry(c.code)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-bold transition ${
                        isCurrent
                          ? 'bg-[#0b6954] text-white'
                          : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span>{c.flag}</span>
                      <span>{c.nameAr}</span>
                    </button>
                  )
                }
              )}
            </div>
          </div>

          <p className="mt-5 text-[11px] leading-relaxed text-gray-400/90 sm:text-xs">
            {dictionary.footer?.disclaimer ||
              'الأرقام والتقديرات المعروضة على المنصة استرشادية وتعتمد على بنود كل عقد على حدة، ولا تعتبر استشارة قانونية أو وعدًا بنتيجة محددة. المراجعة النهائية بتتم على عقدك الفعلي مع فريقنا ومستشارين قانونيين مؤهلين.'}
          </p>
          <div className="mt-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div className="space-y-1 text-right">
              <p className="text-[11px] text-gray-400">
                {dictionary.footer?.copyright ||
                  '© 2026 عقار إكزت. جميع الحقوق محفوظة.'}
              </p>
              <p className="text-[11px] text-gray-500">
                {dictionary.footer?.powered ||
                  'Powered by Aqara for Real Estate and Ammar Group LLC'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/opportunities"
                className="text-xs text-gray-400 transition-colors hover:text-white"
              >
                الفرص المتاحة
              </Link>
              <Link
                href="/"
                className="text-xs text-gray-400 transition-colors hover:text-white"
              >
                الرئيسية
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
      <Navbar dictionary={ar} />
      <main>{children}</main>
      <Footer dictionary={ar} />
    </>
  )
}