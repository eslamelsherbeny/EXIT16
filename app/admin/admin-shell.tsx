"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Bell,
  Building2,
  ExternalLink,
  FileText,
  LayoutDashboard,
  Menu,
  Settings,
  ShieldCheck,
  User,
  Users,
  WalletCards,
  X,
} from "lucide-react"

const ADMIN_NAV_LINKS = [
  { href: "/admin", label: "لوحة القيادة", shortLabel: "الرئيسية", icon: LayoutDashboard },
  { href: "/admin/properties", label: "إدارة العقارات", shortLabel: "العقارات", icon: Building2 },
  { href: "/admin/leads", label: "طلبات الشراء", shortLabel: "المشترين", icon: FileText },
  { href: "/admin/users", label: "المستخدمين والصلاحيات", shortLabel: "المستخدمين", icon: Users },
  { href: "/admin/investors", label: "المستثمرين", shortLabel: "المستثمرين", icon: WalletCards },
  { href: "/admin/settings", label: "الإعدادات", shortLabel: "الإعدادات", icon: Settings },
]

export default function AdminShell({
  adminName,
  adminRole,
  firstLetter,
  children,
}: {
  adminName: string
  adminRole: string
  firstLetter: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)

  // إغلاق القائمة الجانبية تلقائياً عند الانتقال لصفحة جديدة
  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin"
    return pathname?.startsWith(href)
  }

  // معرفة عنوان القسم الحالي لعرضه في الهيدر على الهاتف
  const currentSection =
    ADMIN_NAV_LINKS.find((item) => isActive(item.href))?.label || "لوحة الإدارة"

  return (
    <div dir="rtl" className="min-h-screen bg-[#f5f6f8] pb-20 text-[#0a1122] lg:pb-0">
      {/* ==================== 1. القائمة الجانبية الثابتة للكمبيوتر (Desktop Sidebar) ==================== */}
      <aside className="fixed inset-y-0 right-0 z-30 hidden w-72 border-l border-white/10 bg-[#0a1122] text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <div className="flex h-20 items-center gap-3 border-b border-white/10 px-7 text-xl font-extrabold">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#105C50] text-white shadow-sm">
              <Building2 className="size-5" />
            </span>
            <span>
              دارك<span className="text-emerald-400">.</span>
            </span>
            <span className="mr-auto rounded-full bg-emerald-500/20 px-2.5 py-1 text-[10px] font-bold text-emerald-300">
              {adminRole}
            </span>
          </div>

          <nav aria-label="التنقل الإداري" className="flex flex-col gap-1.5 p-4">
            {ADMIN_NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const active = isActive(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                    active
                      ? "bg-[#105C50] text-white shadow-sm"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon
                    className={`size-4 ${active ? "text-white" : "text-emerald-400"}`}
                  />
                  <span>{label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="p-4">
          <Link
            href="/"
            className="mb-3 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-bold text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            <span>معاينة الموقع العام</span>
            <ExternalLink className="size-3.5" />
          </Link>

          <div className="rounded-2xl bg-gradient-to-br from-[#105C50] to-[#083d34] p-4 text-xs leading-6 text-white/90 shadow-md">
            <div className="flex items-center gap-1.5 font-bold text-white">
              <ShieldCheck className="size-4" />
              <span>مركز التحكم الذكي</span>
            </div>
            <p className="mt-1 text-white/75">
              جميع التعديلات على العقارات والطلبات تسمّع فوراً في حسابات العملاء.
            </p>
          </div>
        </div>
      </aside>

      {/* ==================== 2. القائمة الجانبية المنزلقة للموبايل (Slide-over Drawer) ==================== */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* الخلفية المعتمة */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />

          {/* صندوق القائمة الجانبية */}
          <aside className="fixed inset-y-0 right-0 z-50 flex w-[280px] max-w-[82vw] flex-col justify-between bg-[#0a1122] text-white shadow-2xl">
            <div>
              {/* هيدر المنيو الجانبية */}
              <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
                <div className="flex items-center gap-2.5 text-lg font-extrabold">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-[#105C50] text-white">
                    <Building2 className="size-4" />
                  </span>
                  <span>
                    دارك<span className="text-emerald-400">.</span>
                  </span>
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-300">
                    {adminRole}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="flex size-8 items-center justify-center rounded-lg bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
                  aria-label="إغلاق القائمة"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* معلومات الأدمن داخل المنيو */}
              <div className="mx-4 mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#105C50] text-sm font-extrabold text-white">
                  {firstLetter}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-extrabold text-white">
                    {adminName}
                  </p>
                  <p className="text-[10px] text-emerald-400">
                    صلاحية إدارة كاملة
                  </p>
                </div>
              </div>

              {/* روابط صفحات الأدمن */}
              <nav className="mt-3 flex flex-col gap-1 px-3">
                {ADMIN_NAV_LINKS.map(({ href, label, icon: Icon }) => {
                  const active = isActive(href)
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setDrawerOpen(false)}
                      className={`flex items-center justify-between rounded-xl px-3.5 py-3 text-xs font-bold transition-all ${
                        active
                          ? "bg-[#105C50] text-white shadow-sm"
                          : "text-white/75 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`size-4 ${
                            active ? "text-white" : "text-emerald-400"
                          }`}
                        />
                        <span>{label}</span>
                      </div>
                      {active && (
                        <span className="size-2 rounded-full bg-emerald-300" />
                      )}
                    </Link>
                  )
                })}
              </nav>
            </div>

            {/* روابط سفلية داخل المنيو */}
            <div className="border-t border-white/10 p-4 space-y-2">
              <Link
                href="/account"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-bold text-white/85 transition hover:bg-white/10"
              >
                <span>حسابي الشخصي</span>
                <User className="size-3.5 text-emerald-400" />
              </Link>
              <Link
                href="/"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-bold text-white/85 transition hover:bg-white/10"
              >
                <span>معاينة الموقع العام</span>
                <ExternalLink className="size-3.5 text-emerald-400" />
              </Link>
            </div>
          </aside>
        </div>
      )}

      {/* ==================== 3. الهيدر العلوي المدمج + المحتوى ==================== */}
      <div className="lg:mr-72">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-2 border-b border-gray-200/80 bg-white/95 px-3.5 backdrop-blur-md sm:h-20 sm:px-6 lg:px-8">
          {/* اليمين: زر المنيو للموبايل + الترحيب والقسم الحالي */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-50/80 text-[#0a1122] transition hover:bg-gray-100 active:scale-95 lg:hidden"
              aria-label="فتح قائمة الإدارة"
            >
              <Menu className="size-5" />
            </button>

            <div className="min-w-0">
              <p className="truncate text-[10px] font-extrabold text-[#105C50] sm:text-xs">
                {currentSection}
              </p>
              <h1 className="truncate text-sm font-extrabold text-[#0a1122] sm:text-lg">
                أهلاً بك، {adminName} 👋
              </h1>
            </div>
          </div>

          {/* اليسار: أزرار سريعة ملمومة في سطر واحد */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              href="/account"
              className="rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-[11px] font-bold text-[#0a1122] transition hover:bg-gray-100 sm:px-3.5 sm:py-2 sm:text-xs"
            >
              حسابي
            </Link>

            <Link
              href="/admin/properties"
              className="relative flex size-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:bg-gray-50 sm:size-10"
              aria-label="الإشعارات"
            >
              <Bell className="size-4" />
              <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-red-500" />
            </Link>

            <div className="flex items-center gap-2.5 border-r border-gray-200 pr-2 sm:pr-3">
              <div className="flex size-9 items-center justify-center rounded-full bg-[#105C50] text-xs font-extrabold text-white sm:size-10 sm:text-sm">
                {firstLetter}
              </div>
              <div className="hidden md:block">
                <div className="text-xs font-extrabold text-[#0a1122]">
                  {adminName}
                </div>
                <div className="text-[11px] font-medium text-gray-500">
                  صلاحية كاملة
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* محتوى الصفحات */}
        <main className="p-3.5 sm:p-6 lg:p-8">{children}</main>
      </div>

      {/* ==================== 4. شريط التطبيق السفلي الثابت للموبايل (Bottom App Bar) ==================== */}
      <nav
        aria-label="التنقل السريع للموبايل"
        className="fixed bottom-0 inset-x-0 z-30 flex h-16 items-center justify-around border-t border-gray-200/90 bg-white/95 px-1 backdrop-blur-md shadow-[0_-4px_16px_rgba(0,0,0,0.04)] lg:hidden"
      >
        {ADMIN_NAV_LINKS.slice(0, 4).map(({ href, shortLabel, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center justify-center gap-1 py-1.5 text-[10px] font-bold transition ${
                active ? "text-[#105C50]" : "text-gray-400 hover:text-[#0a1122]"
              }`}
            >
              <span
                className={`flex h-7 w-11 items-center justify-center rounded-full transition ${
                  active ? "bg-[#105C50]/12 text-[#105C50]" : ""
                }`}
              >
                <Icon className="size-4" />
              </span>
              <span>{shortLabel}</span>
            </Link>
          )
        })}

        {/* زر فتح القائمة الكاملة */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className={`flex flex-1 flex-col items-center justify-center gap-1 py-1.5 text-[10px] font-bold transition ${
            drawerOpen ? "text-[#105C50]" : "text-gray-400 hover:text-[#0a1122]"
          }`}
        >
          <span className="flex h-7 w-11 items-center justify-center rounded-full">
            <Menu className="size-4" />
          </span>
          <span>القائمة</span>
        </button>
      </nav>
    </div>
  )
}