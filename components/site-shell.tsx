"use client"

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import {
  Bell,
  Building2,
  ChevronLeft,
  Menu,
  ShieldCheck,
  Smartphone,
  Sparkles,
  User,
  X,
} from 'lucide-react'
import * as authActions from '@/app/actions/auth-actions'
import ar from '@/dictionaries/ar.json'
import en from '@/dictionaries/en.json'

type Dictionary = typeof ar

const links = [
  { href: '/sell', key: 'sell' as const, fallback: 'بيع وحدتك', enFallback: 'Sell Unit' },
  {
    href: '/opportunities',
    key: 'opportunities' as const,
    fallback: 'الفرص المتاحة',
    enFallback: 'Opportunities',
  },
  { href: '/story', key: 'story' as const, fallback: 'قصتنا', enFallback: 'Our Story' },
  {
    href: '/how-it-works',
    key: 'howItWorks' as const,
    fallback: 'إزاي بنشتغل',
    enFallback: 'How It Works',
  },
  { href: '/contact', key: 'contact' as const, fallback: 'كلمنا', enFallback: 'Contact Us' },
  {
    href: '/investors',
    key: 'investors' as const,
    fallback: 'للمستثمرين',
    enFallback: 'Investors',
  },
]

// ==================== 1. اللوجو المطابق 100% ====================
export function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link
      href="/"
      dir="ltr"
      className={`inline-block select-none ${inverse ? 'text-white' : 'text-[#0a1122]'}`}
      aria-label="Aqar Exit"
    >
      <svg
        width="102"
        height="48"
        viewBox="0 0 116 54"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-[44px] w-auto"
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
  const [language, setLanguage] = useState<'ar' | 'en'>('ar')
  const [hasSession, setHasSession] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  const pathname = usePathname()
  const labels = language === 'en' ? en : dictionary

  // ضبط اللغة والاتجاه
  useEffect(() => {
    document.cookie = `locale=${language}; path=/; max-age=31536000`
    document.documentElement.lang = language
    document.documentElement.dir = language === 'en' ? 'ltr' : 'rtl'
  }, [language])

  // التحقق من جلسة المستخدم وصلاحية الأدمن (Role) من الداتابيز عند كل تنقل
  useEffect(() => {
    let isMounted = true

    async function verifyUserAndRole() {
      const hintExists = document.cookie
        .split('; ')
        .some((cookie) => cookie.startsWith('session_hint='))

      if (isMounted) {
        setHasSession(hintExists)
      }

      try {
        // 1. الفحص الدقيق عبر الـ Server Action إذا كانت مضافة في auth-actions.ts
        const actionFn = (authActions as any).getSessionUserAction
        if (typeof actionFn === 'function') {
          const sessionData = await actionFn()
          if (isMounted && sessionData) {
            setHasSession(Boolean(sessionData.isLoggedIn))
            setIsAdmin(Boolean(sessionData.isAdmin))
            setUserName(sessionData.name || null)
            return
          }
        }

        // 2. فحص احتياطي مباشر من Supabase لو المستخدم مسجل دخول وعدل الـ role في الداتابيز
        if (hintExists && process.env.NEXT_PUBLIC_SUPABASE_URL) {
          const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          )
          const { data: adminUsers } = await supabase
            .from('users')
            .select('id, name, role')
            .in('role', ['admin', 'moderator', 'ADMIN', 'MODERATOR'])
            .limit(1)

          if (isMounted && adminUsers && adminUsers.length > 0) {
            setIsAdmin(true)
            setUserName(adminUsers[0].name || null)
          }
        } else if (isMounted && !hintExists) {
          setIsAdmin(false)
          setUserName(null)
        }
      } catch (err) {
        console.error('Session check error:', err)
      }
    }

    verifyUserAndRole()

    return () => {
      isMounted = false
    }
  }, [pathname])

  // إغلاق القوائم عند تغيير الصفحة
  useEffect(() => {
    setMobileMenuOpen(false)
    setNotificationsOpen(false)
  }, [pathname])

  // إغلاق قائمة الإشعارات عند الضغط خارجها
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header
      dir="rtl"
      className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/95 backdrop-blur-md"
    >
      <div className="mx-auto flex h-[74px] max-w-[1140px] items-center justify-between px-4 sm:px-6">
        
        {/* اليمين: اللوجو والتابز */}
        <div className="flex items-center gap-8 xl:gap-12">
          <Logo />
          <nav
            className="hidden items-center gap-5 lg:flex"
            aria-label={labels.navbar?.menuTitle || 'القائمة الرئيسية'}
          >
            {links.map((link) => {
              const isActive =
                pathname === link.href || pathname.startsWith(`${link.href}/`)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`whitespace-nowrap text-[14px] transition-colors hover:text-[#0b6954] ${
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

        {/* اليسار (ديسكتوب) */}
        <div className="hidden shrink-0 items-center gap-2.5 lg:flex">
          <button
            type="button"
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            className="ml-1 rounded-lg px-2 py-1 text-[13px] font-medium text-[#1e293b] transition-colors hover:bg-gray-100 hover:text-[#0b6954]"
          >
            {language === 'ar' ? 'English' : 'العربية'}
          </button>

          {/* زر لوحة الإدارة — يظهر تلقائياً إذا كان المستخدم أدمن أو مشرف في الداتابيز */}
          {isAdmin && (
            <Link
              href="/admin"
              className="inline-flex h-[44px] items-center justify-center gap-1.5 whitespace-nowrap rounded-[11px] bg-[#0a1122] px-4 text-[13px] font-bold text-white shadow-xs transition-colors hover:bg-[#16223f]"
            >
              <ShieldCheck className="size-4 text-[#2ee59d]" />
              <span>{language === 'en' ? 'Admin Panel' : 'لوحة الإدارة'}</span>
            </Link>
          )}

          <Link
            href={hasSession ? '/account' : '/login'}
            className="inline-flex h-[44px] items-center justify-center gap-1.5 whitespace-nowrap rounded-[11px] border border-[#e2e8f0] bg-white px-4 text-[14px] font-semibold text-[#0f172a] transition-colors hover:bg-gray-50"
          >
            <User className="size-4 text-gray-500" />
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

          <Link
            href="/buy"
            className="inline-flex h-[44px] items-center justify-center whitespace-nowrap rounded-[11px] border border-[#e2e8f0] bg-white px-4 text-[14px] font-semibold text-[#0f172a] transition-colors hover:bg-gray-50"
          >
            {language === 'en' ? 'Want to Buy' : 'عايز تشتري'}
          </Link>

          {/* جرس الإشعارات التفاعلي */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotificationsOpen((prev) => !prev)}
              aria-label="الإشعارات"
              className="relative mx-0.5 flex size-10 items-center justify-center rounded-full text-[#334155] transition-colors hover:bg-gray-100"
            >
              <Bell className="size-[19px] stroke-[1.8]" />
              <span className="absolute right-2 top-2 size-2 rounded-full bg-[#0b6954]" />
            </button>

            {notificationsOpen && (
              <div className="absolute left-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/70 px-4 py-3">
                  <span className="text-xs font-extrabold text-[#0a1122]">
                    الإشعارات والتنبيهات
                  </span>
                  {userName && (
                    <span className="text-[11px] font-bold text-[#0b6954]">
                      أهلاً {userName.split(' ')[0]}
                    </span>
                  )}
                </div>

                <div className="divide-y divide-gray-100 text-right text-xs">
                  {isAdmin && (
                    <Link
                      href="/admin/properties"
                      className="flex items-start gap-3 bg-emerald-50/60 p-3.5 transition hover:bg-emerald-50"
                    >
                      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#0b6954]" />
                      <div>
                        <p className="font-bold text-[#0a1122]">لوحة تحكم الإدارة</p>
                        <p className="mt-0.5 text-[11px] text-gray-500">
                          راجع طلبات البائعين والمشترين واعتمد الفرص الجديدة.
                        </p>
                      </div>
                    </Link>
                  )}

                  <Link
                    href="/opportunities"
                    className="flex items-start gap-3 p-3.5 transition hover:bg-gray-50"
                  >
                    <Building2 className="mt-0.5 size-4 shrink-0 text-[#0b6954]" />
                    <div>
                      <p className="font-bold text-[#0a1122]">فرص تنازل جديدة متاحة</p>
                      <p className="mt-0.5 text-[11px] text-gray-500">
                        تصفح أحدث الوحدات المعتمدة بدون أوفر في السوق الآن.
                      </p>
                    </div>
                  </Link>

                  <Link
                    href={hasSession ? '/account' : '/login'}
                    className="flex items-start gap-3 p-3.5 transition hover:bg-gray-50"
                  >
                    <Sparkles className="mt-0.5 size-4 shrink-0 text-amber-500" />
                    <div>
                      <p className="font-bold text-[#0a1122]">
                        {hasSession ? 'متابعة حالة طلباتك' : 'سجّل دخولك لمتابعة وحدتك'}
                      </p>
                      <p className="mt-0.5 text-[11px] text-gray-500">
                        تابع خطوات بيع وحدتك أو الفرص المطابقة لميزانيتك.
                      </p>
                    </div>
                  </Link>
                </div>
              </div>
            )}
          </div>

          <Link
            href="/sell"
            className="inline-flex h-[44px] items-center justify-center whitespace-nowrap rounded-[11px] bg-[#0b6954] px-5 text-[14px] font-semibold text-white transition-colors hover:bg-[#085443]"
          >
            {language === 'en' ? 'Want to Sell' : 'عايز تبيع'}
          </Link>
        </div>

        {/* اليسار (موبايل): زر لوحة الإدارة المصغر (إن وجد) + زر عايز تبيع + القائمة */}
        <div className="flex items-center gap-2 lg:hidden">
          {isAdmin && (
            <Link
              href="/admin"
              aria-label="لوحة الإدارة"
              className="inline-flex h-[42px] items-center justify-center gap-1 rounded-[11px] bg-[#0a1122] px-3 text-[12px] font-bold text-white"
            >
              <ShieldCheck className="size-4 text-[#2ee59d]" />
              <span>الإدارة</span>
            </Link>
          )}

          <Link
            href="/sell"
            className="inline-flex h-[42px] items-center justify-center whitespace-nowrap rounded-[11px] bg-[#0b6954] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#085443]"
          >
            {language === 'en' ? 'Sell' : 'عايز تبيع'}
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="القائمة"
            className="flex size-10 items-center justify-center text-[#0a1122] focus:outline-none"
          >
            {mobileMenuOpen ? (
              <X className="size-6 stroke-[2]" />
            ) : (
              <Menu className="size-6 stroke-[2]" />
            )}
          </button>
        </div>

      </div>

      {/* قائمة الموبايل المنسدلة */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-[74px] bottom-0 z-50 h-[calc(100vh-74px)] overflow-y-auto border-t border-gray-100 bg-white px-6 pt-6 pb-12 lg:hidden">
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

          <hr className="my-6 border-gray-200/80" />

          <div className="flex flex-col gap-3.5">
            {/* خيار لوحة الإدارة في منيو الموبايل — يظهر للأدمن */}
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[12px] bg-[#0a1122] text-[15px] font-bold text-white shadow-sm transition-colors hover:bg-[#16223f]"
              >
                <ShieldCheck className="size-5 text-[#2ee59d]" />
                <span>الدخول إلى لوحة الإدارة</span>
              </Link>
            )}

            <Link
              href="/buy"
              onClick={() => setMobileMenuOpen(false)}
              className="flex h-[50px] w-full items-center justify-center rounded-[12px] border border-[#e2e8f0] bg-white text-[15px] font-semibold text-[#0a1122] transition-colors hover:bg-gray-50"
            >
              {language === 'en' ? 'Want to Buy' : 'عايز تشتري'}
            </Link>

            <Link
              href={hasSession ? '/account' : '/login'}
              onClick={() => setMobileMenuOpen(false)}
              className="flex h-[50px] w-full items-center justify-center gap-2 rounded-[12px] border border-[#e2e8f0] bg-gray-50 text-[15px] font-bold text-[#1d3557] transition-colors hover:bg-gray-100"
            >
              <User className="size-4" />
              <span>{hasSession ? 'حسابي الشخصي' : 'تسجيل الدخول / إنشاء حساب'}</span>
            </Link>

            <Link
              href="/opportunities#app-banner"
              onClick={() => setMobileMenuOpen(false)}
              className="flex h-[50px] w-full items-center justify-center gap-2 rounded-[12px] border border-[#99cec3] bg-[#eff8f6] text-[15px] font-semibold text-[#0b6954] transition-colors hover:bg-[#e2f3ef]"
            >
              <Smartphone className="size-4 stroke-[2.2]" />
              <span>{language === 'en' ? 'Get the App' : 'حمّل التطبيق'}</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                setLanguage(language === 'ar' ? 'en' : 'ar')
                setMobileMenuOpen(false)
              }}
              className="mt-1 py-2 text-center text-sm font-semibold text-gray-500 hover:text-[#0b6954]"
            >
              {language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
            </button>
          </div>
        </div>
      )}
    </header>
  )
}

export function LegacyNavbar({ dictionary = ar }: { dictionary?: Dictionary }) {
  return <Navbar dictionary={dictionary} />
}

// ==================== 3. الفوتر المنظم (Footer) للموبايل والديسكتوب ====================
export function Footer({ dictionary = ar }: { dictionary?: Dictionary }) {
  const platformLinks = [
    { label: 'الفرص المتاحة', href: '/opportunities' },
    { label: dictionary.footer?.forSellers || 'للبايعين (بيع وحدتك)', href: '/sell' },
    { label: dictionary.footer?.forBuyers || 'للمشترين (اطلب وحدة)', href: '/buy' },
    { label: dictionary.footer?.calculator || 'حاسبة الخروج', href: '/calculator' },
    { label: dictionary.footer?.favorite || 'المفضلة', href: '/favorites' },
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
        
        {/* الهيكل المنظم: أعمدة متجاوبة تماماً مع صور الهاتف */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.45fr_1fr_1fr_1fr] lg:gap-12">
          
          {/* العمود الأول: اللوجو + الوصف + التواصل + تحميل التطبيق */}
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

            <div className="mt-6" id="app-banner">
              <p className="text-xs font-semibold text-gray-400">
                {dictionary.footer?.appLabel || 'حمّل التطبيق'}
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-start gap-2.5">
                <Link
                  href="/opportunities"
                  className="flex items-center gap-2.5 rounded-xl border border-white/15 bg-black px-4 py-2 text-white transition hover:border-[#2ee59d]/50 hover:bg-white/5"
                >
                  <div className="text-right">
                    <span className="block text-[8px] text-gray-400">حمّله من</span>
                    <span className="block text-xs font-bold leading-tight">App Store</span>
                  </div>
                  <svg className="size-5 fill-current" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.33c.64-.78 1.08-1.86.96-2.94-.93.04-2.06.62-2.72 1.4-.58.68-1.1 1.79-.96 2.84 1.04.08 2.08-.52 2.72-1.3z" />
                  </svg>
                </Link>

                <Link
                  href="/opportunities"
                  className="flex items-center gap-2.5 rounded-xl border border-white/15 bg-black px-4 py-2 text-white transition hover:border-[#2ee59d]/50 hover:bg-white/5"
                >
                  <div className="text-right">
                    <span className="block text-[8px] text-gray-400">متوفر على</span>
                    <span className="block text-xs font-bold leading-tight">Google Play</span>
                  </div>
                  <svg className="size-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M3.61 1.814L13.793 12 3.61 22.186a1.96 1.96 0 0 1-.61-1.42V3.234c0-.55.23-1.05.61-1.42z"
                    />
                    <path
                      fill="#34A853"
                      d="M17.22 8.573L13.793 12 3.61 1.814c.42-.4.99-.53 1.56-.21l12.05 6.97z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M20.635 10.548c.98.57.98 1.98 0 2.55l-3.415 1.975L13.793 12l3.427-3.427 3.415 1.975z"
                    />
                    <path
                      fill="#EA4335"
                      d="M17.22 15.427L5.17 22.396c-.57.32-1.14.19-1.56-.21L13.793 12l3.427 3.427z"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          {/* العمود الثاني: المنصة */}
          <div className="text-right">
            <h3 className="text-xs font-bold text-gray-400">
              {dictionary.footer?.platform || 'المنصة'}
            </h3>
            <ul className="mt-4 flex flex-col gap-3 text-xs text-gray-200 sm:text-[13px]">
              {platformLinks.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="transition-colors hover:text-[#2ee59d]">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* العمود الثالث: الشركة */}
          <div className="text-right">
            <h3 className="text-xs font-bold text-gray-400">
              {dictionary.footer?.company || 'الشركة'}
            </h3>
            <ul className="mt-4 flex flex-col gap-3 text-xs text-gray-200 sm:text-[13px]">
              {companyLinks.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="transition-colors hover:text-[#2ee59d]">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* العمود الرابع: قانوني */}
          <div className="text-right">
            <h3 className="text-xs font-bold text-gray-400">
              {dictionary.footer?.legal || 'قانوني'}
            </h3>
            <ul className="mt-4 flex flex-col gap-3 text-xs text-gray-200 sm:text-[13px]">
              {legalLinks.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="transition-colors hover:text-[#2ee59d]">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* القسم السفلي للفوتر (الدولة وإخلاء المسؤولية وحقوق النشر) */}
        <div className="mt-12 border-t border-white/10 pt-8 text-right text-xs text-gray-400">
          <div>
            <span className="block text-[11px] text-gray-400">الدولة</span>
            <div className="mt-2.5 flex flex-wrap items-center justify-start gap-4 text-xs">
              <Link href="/opportunities" className="font-bold text-white hover:text-[#2ee59d]">
                مصر
              </Link>
              <span className="inline-flex items-center gap-1.5 text-gray-400">
                السعودية
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-gray-300">
                  قريبًا
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-gray-400">
                الإمارات
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-gray-300">
                  قريبًا
                </span>
              </span>
            </div>
          </div>

          <p className="mt-5 text-[11px] leading-relaxed text-gray-400/90 sm:text-xs">
            {dictionary.footer?.disclaimer ||
              'الأرقام والتقديرات المعروضة على المنصة استرشادية وتعتمد على بنود كل عقد على حدة، ولا تعتبر استشارة قانونية أو وعدًا بنتيجة محددة. المراجعة النهائية بتتم على عقدك الفعلي مع فريقنا ومستشارين قانونيين مؤهلين.'}
          </p>

          <div className="mt-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div className="space-y-1 text-right">
              <p className="text-[11px] text-gray-400">
                {dictionary.footer?.copyright || '© 2026 عقار إكزت. جميع الحقوق محفوظة.'}
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

// ==================== 4. التخطيط العام (PublicLayout) ====================
export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar dictionary={ar} />
      <main>{children}</main>
      <Footer dictionary={ar} />
    </>
  )
}