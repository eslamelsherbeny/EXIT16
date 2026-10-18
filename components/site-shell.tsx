"use client"

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Bell, Menu, Smartphone, X } from 'lucide-react'
import ar from '@/dictionaries/ar.json'
import en from '@/dictionaries/en.json'

type Dictionary = typeof ar

const links = [
  { href: '/sell', key: 'sell' as const, fallback: 'بيع وحدتك' },
  { href: '/opportunities', key: 'opportunities' as const, fallback: 'الفرص المتاحة' },
  { href: '/story', key: 'story' as const, fallback: 'قصتنا' },
  { href: '/how-it-works', key: 'howItWorks' as const, fallback: 'إزاي بنشتغل' },
  { href: '/contact', key: 'contact' as const, fallback: 'كلمنا' },
  { href: '/investors', key: 'investors' as const, fallback: 'للمستثمرين' },
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const labels = language === 'en' ? en : dictionary

  useEffect(() => {
    document.cookie = `locale=${language}; path=/; max-age=31536000`
    setHasSession(
      document.cookie.split('; ').some((cookie) => cookie.startsWith('session_hint='))
    )
    document.documentElement.lang = language
    document.documentElement.dir = language === 'en' ? 'ltr' : 'rtl'
  }, [language])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  return (
    <header
      dir="rtl"
      className="sticky top-0 z-50 border-b border-gray-200/80 bg-white"
    >
      <div className="mx-auto flex h-[74px] max-w-[1140px] items-center justify-between px-4 sm:px-6">
        
        {/* اليمين: اللوجو والتابز */}
        <div className="flex items-center gap-10 xl:gap-14">
          <Logo />
          <nav
            className="hidden items-center gap-5 lg:flex"
            aria-label={labels.navbar?.menuTitle || 'القائمة الرئيسية'}
          >
            {links.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`whitespace-nowrap text-[14px] transition-colors hover:text-[#0b6954] ${
                    isActive
                      ? 'font-semibold text-[#0b6954]'
                      : 'font-normal text-[#4b5563]'
                  }`}
                >
                  {labels.navbar?.[link.key] || link.fallback}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* اليسار (ديسكتوب) */}
        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          <button
            type="button"
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            className="ml-2 text-[13px] font-normal text-[#1e293b] transition-colors hover:text-[#0b6954]"
          >
            {language === 'ar' ? 'English' : 'العربية'}
          </button>

          <Link
            href={hasSession ? '/account' : '/login'}
            className="inline-flex h-[44px] items-center justify-center whitespace-nowrap rounded-[11px] border border-[#e2e8f0] bg-white px-5 text-[14px] font-semibold text-[#0f172a] transition-colors hover:bg-gray-50"
          >
            {hasSession ? 'حسابي' : labels.navbar?.login || 'حسابي'}
          </Link>

          <Link
            href="/buy"
            className="inline-flex h-[44px] items-center justify-center whitespace-nowrap rounded-[11px] border border-[#e2e8f0] bg-white px-5 text-[14px] font-semibold text-[#0f172a] transition-colors hover:bg-gray-50"
          >
            عايز تشتري
          </Link>

          <button
            type="button"
            aria-label="الإشعارات"
            className="mx-0.5 flex size-9 items-center justify-center rounded-full text-[#334155] transition-colors hover:bg-gray-100"
          >
            <Bell className="size-[19px] stroke-[1.7]" />
          </button>

          <Link
            href="/sell"
            className="inline-flex h-[44px] items-center justify-center whitespace-nowrap rounded-[11px] bg-[#0b6954] px-6 text-[14px] font-semibold text-white transition-colors hover:bg-[#085443]"
          >
            عايز تبيع
          </Link>
        </div>

        {/* اليسار (موبايل): زر عايز تبيع + القائمة */}
        <div className="flex items-center gap-3 lg:hidden">
          <Link
            href="/sell"
            className="inline-flex h-[42px] items-center justify-center whitespace-nowrap rounded-[11px] bg-[#0b6954] px-5 text-[14px] font-semibold text-white transition-colors hover:bg-[#085443]"
          >
            عايز تبيع
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
        <div className="fixed inset-x-0 top-[74px] bottom-0 z-50 overflow-y-auto border-t border-gray-100 bg-white px-6 pt-6 pb-10 lg:hidden">
          <nav className="flex flex-col gap-5 text-right">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`text-[17px] font-medium transition-colors ${
                pathname === '/' ? 'font-bold text-[#0b6954]' : 'text-[#0a1122]'
              }`}
            >
              الرئيسية
            </Link>

            {links.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-[17px] font-medium transition-colors ${
                    isActive ? 'font-bold text-[#0b6954]' : 'text-[#0a1122]'
                  }`}
                >
                  {labels.navbar?.[link.key] || link.fallback}
                </Link>
              )
            })}
          </nav>

          <hr className="my-6 border-gray-200/80" />

          <div className="flex flex-col gap-4">
            <Link
              href="/buy"
              onClick={() => setMobileMenuOpen(false)}
              className="flex h-[50px] w-full items-center justify-center rounded-[12px] border border-[#e2e8f0] bg-white text-[15px] font-semibold text-[#0a1122] transition-colors hover:bg-gray-50"
            >
              عايز تشتري
            </Link>

            <Link
              href={hasSession ? '/account' : '/login'}
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 text-center text-[15px] font-semibold text-[#1d3557] transition-colors hover:text-[#0b6954]"
            >
              {hasSession ? 'حسابي' : 'دخول'}
            </Link>

            <Link
              href="#app"
              onClick={() => setMobileMenuOpen(false)}
              className="flex h-[50px] w-full items-center justify-center gap-2 rounded-[12px] border border-[#99cec3] bg-[#eff8f6] text-[15px] font-semibold text-[#0b6954] transition-colors hover:bg-[#e2f3ef]"
            >
              <Smartphone className="size-4 stroke-[2.2]" />
              <span>حمّل التطبيق</span>
            </Link>
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
    { label: dictionary.footer?.favorite || 'المفضلة', href: '/favorites' },
    { label: dictionary.footer?.calculator || 'حاسبة الخروج', href: '/calculator' },
    { label: dictionary.footer?.forSellers || 'للبايعين', href: '/sell' },
    { label: dictionary.footer?.forBuyers || 'للمشترين', href: '/buy' },
  ]

  const companyLinks = [
    { label: dictionary.footer?.about || 'قصتنا', href: '/story' },
    { label: dictionary.footer?.reports || 'التقارير والمؤشرات', href: '/reports' },
    { label: dictionary.footer?.work || 'إزاي بنشتغل', href: '/how-it-works' },
    { label: 'للمطورين', href: '/developers' },
    { label: dictionary.footer?.investorRelations || 'علاقات المستثمرين', href: '/investors' },
    { label: dictionary.footer?.faq || 'الأسئلة الشائعة', href: '/faq' },
    { label: 'كلمنا', href: '/contact' },
  ]

  const legalLinks = [
    { label: dictionary.footer?.privacy || 'سياسة الخصوصية', href: '/privacy' },
    { label: dictionary.footer?.terms || 'الشروط والأحكام', href: '/terms' },
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
                className="transition-colors hover:text-white"
              >
                {dictionary.footer?.phone || '+201018595959'}
              </a>
              <a
                href={`mailto:${dictionary.footer?.email || 'info@aqarexit.com'}`}
                className="transition-colors hover:text-white"
              >
                {dictionary.footer?.email || 'info@aqarexit.com'}
              </a>
            </div>

            <div className="mt-6">
              <p className="text-xs font-semibold text-gray-400">
                {dictionary.footer?.appLabel || 'حمّل التطبيق'}
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-start gap-2.5">
                <a
                  href="#app-store"
                  className="flex items-center gap-2.5 rounded-xl border border-white/15 bg-black px-4 py-2 text-white transition hover:bg-white/5"
                >
                  <div className="text-right">
                    <span className="block text-[8px] text-gray-400">حمّله من</span>
                    <span className="block text-xs font-bold leading-tight">App Store</span>
                  </div>
                  <svg className="size-5 fill-current" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.33c.64-.78 1.08-1.86.96-2.94-.93.04-2.06.62-2.72 1.4-.58.68-1.1 1.79-.96 2.84 1.04.08 2.08-.52 2.72-1.3z" />
                  </svg>
                </a>

                <a
                  href="#google-play"
                  className="flex items-center gap-2.5 rounded-xl border border-white/15 bg-black px-4 py-2 text-white transition hover:bg-white/5"
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
                </a>
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
              <span className="font-bold text-white">مصر</span>
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

            <Link
              href="/"
              className="text-xs text-gray-400 transition-colors hover:text-white"
            >
              الرئيسية
            </Link>
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