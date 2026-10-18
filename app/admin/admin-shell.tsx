"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Bell,
  Building2,
  CheckCircle2,
  Clock,
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

export type AdminNotificationItem = {
  id: string
  title: string
  subtitle: string
  href: string
  type: "property" | "lead" | "investor"
  createdAt: string
}

const ADMIN_NAV_LINKS = [
  {
    href: "/admin",
    label: "لوحة القيادة",
    shortLabel: "الرئيسية",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/properties",
    label: "إدارة العقارات",
    shortLabel: "العقارات",
    icon: Building2,
  },
  {
    href: "/admin/leads",
    label: "طلبات الشراء",
    shortLabel: "المشترين",
    icon: FileText,
  },
  {
    href: "/admin/users",
    label: "المستخدمين والصلاحيات",
    shortLabel: "المستخدمين",
    icon: Users,
  },
  {
    href: "/admin/investors",
    label: "المستثمرين",
    shortLabel: "المستثمرين",
    icon: WalletCards,
  },
  {
    href: "/admin/settings",
    label: "إعدادات الموقع",
    shortLabel: "الإعدادات",
    icon: Settings,
  },
]

// العناصر الـ 5 في الشريط السفلي للموبايل
const MOBILE_BOTTOM_LINKS = [
  ADMIN_NAV_LINKS[0],
  ADMIN_NAV_LINKS[1],
  ADMIN_NAV_LINKS[2],
  ADMIN_NAV_LINKS[3],
  ADMIN_NAV_LINKS[5],
]

export default function AdminShell({
  adminName,
  adminRole,
  notifications = [],
  children,
}: {
  adminName: string
  adminRole: string
  notifications?: AdminNotificationItem[]
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  // استخراج الاسم الأول فقط لعرضه في الهيدر بدون قطع
  const firstName = adminName.trim().split(/\s+/)[0] || "مدير"

  useEffect(() => {
    setDrawerOpen(false)
    setNotifOpen(false)
  }, [pathname])

  // إغلاق قائمة الإشعارات عند الضغط خارجها
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin"
    return pathname?.startsWith(href)
  }

  const currentSection =
    ADMIN_NAV_LINKS.find((item) => isActive(item.href))?.label || "لوحة الإدارة"

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#f5f6f8] pb-20 text-[#0a1122] lg:pb-0"
    >
      {/* ==================== 1. القائمة الجانبية الثابتة للكمبيوتر ==================== */}
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
                    className={`size-4 ${
                      active ? "text-white" : "text-emerald-400"
                    }`}
                  />
                  <span>{label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="p-4">
          {/* رابط حسابي (توجيه للبروفايل) */}
          <Link
            href="/admin/settings?tab=profile"
            className="mb-2 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-bold text-white/85 transition hover:bg-white/10 hover:text-white"
          >
            <span>حسابي</span>
            <User className="size-3.5 text-emerald-400" />
          </Link>

          <Link
            href="/"
            className="mb-3 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-bold text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            <span>معاينة الموقع العام</span>
            <ExternalLink className="size-3.5 text-emerald-400" />
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

      {/* ==================== 2. القائمة الجانبية المنزلقة للموبايل (تفتح من زر الهيدر ☰) ==================== */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />

          <aside className="fixed inset-y-0 right-0 z-50 flex w-[280px] max-w-[82vw] flex-col justify-between bg-[#0a1122] text-white shadow-2xl">
            <div>
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

              <div className="mx-4 mt-4 rounded-xl border border-white/10 bg-white/5 p-3.5">
                <p className="text-xs font-extrabold text-white">{adminName}</p>
                <p className="mt-0.5 text-[10px] text-emerald-400">
                  مدير النظام · صلاحية كاملة
                </p>
              </div>

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

            <div className="space-y-2 border-t border-white/10 p-4">
              {/* رابط حسابي (توجيه للبروفايل) */}
              <Link
                href="/admin/settings?tab=profile"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-bold text-white/85 transition hover:bg-white/10"
              >
                <span>حسابي</span>
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

      {/* ==================== 3. الهيدر العلوي المدمج ==================== */}
      <div className="lg:mr-72">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-2 border-b border-gray-200/80 bg-white/95 px-3.5 backdrop-blur-md sm:h-20 sm:px-6 lg:px-8">
          {/* اليمين: زر القائمة ☰ + اسم القسم + أهلاً بالاسم الأول فقط */}
          <div className="flex min-w-0 items-center gap-2.5">
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
                أهلاً، {firstName} 👋
              </h1>
            </div>
          </div>

          {/* اليسار: زر حسابي (بدون أيقونة) + جرس الإشعارات */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
            <Link
              href="/admin/settings?tab=profile"
              className="inline-flex h-9 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 px-4 text-xs font-bold text-[#0a1122] transition hover:border-[#105C50] hover:bg-white sm:h-10 sm:px-5"
            >
              <span>حسابي</span>
            </Link>

            {/* جرس الإشعارات التفاعلي */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotifOpen((prev) => !prev)}
                className="relative flex size-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50 sm:size-10"
                aria-label="الإشعارات"
              >
                <Bell className="size-4" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-extrabold text-white">
                    {notifications.length > 9 ? "+9" : notifications.length}
                  </span>
                )}
              </button>

              {/* القائمة المنسدلة للإشعارات */}
              {notifOpen && (
                <div className="fixed left-3 right-3 top-[68px] z-50 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl sm:absolute sm:left-0 sm:right-auto sm:top-12 sm:w-80">
                  <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-4 py-3">
                    <span className="text-xs font-extrabold text-[#0a1122]">
                      التنبيهات والطلبات الجديدة ({notifications.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setNotifOpen(false)}
                      className="rounded-lg p-1 text-gray-400 hover:bg-gray-200/60 hover:text-gray-700"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>

                  <div className="max-h-80 divide-y divide-gray-100 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
                        <CheckCircle2 className="mb-2 size-8 text-emerald-500" />
                        <p className="text-xs font-bold text-[#0a1122]">
                          لا توجد طلبات معلقة حالياً
                        </p>
                        <p className="mt-0.5 text-[11px] text-gray-400">
                          تمت مراجعة كافة العقارات والطلبات الجديدة.
                        </p>
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <Link
                          key={item.id}
                          href={item.href}
                          onClick={() => setNotifOpen(false)}
                          className="flex items-start gap-3 px-4 py-3 text-right transition hover:bg-gray-50"
                        >
                          <span
                            className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                              item.type === "property"
                                ? "bg-amber-100 text-amber-800"
                                : item.type === "lead"
                                  ? "bg-emerald-100 text-[#105C50]"
                                  : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {item.type === "property" ? (
                              <Building2 className="size-4" />
                            ) : item.type === "lead" ? (
                              <FileText className="size-4" />
                            ) : (
                              <WalletCards className="size-4" />
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-extrabold text-[#0a1122]">
                              {item.title}
                            </p>
                            <p className="mt-0.5 truncate text-[11px] text-gray-500">
                              {item.subtitle}
                            </p>
                            <p className="mt-1 flex items-center gap-1 text-[10px] text-gray-400">
                              <Clock className="size-3" />
                              <span>{item.createdAt}</span>
                            </p>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>

                  <div className="border-t border-gray-100 bg-gray-50/50 p-2 text-center">
                    <Link
                      href="/admin/properties"
                      onClick={() => setNotifOpen(false)}
                      className="block rounded-lg py-1.5 text-[11px] font-bold text-[#105C50] hover:bg-emerald-50"
                    >
                      عرض كل العقارات والطلبات
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* محتوى الصفحات */}
        <main className="p-3.5 sm:p-6 lg:p-8">{children}</main>
      </div>

      {/* ==================== 4. الشريط السفلي للموبايل ==================== */}
      <nav
        aria-label="التنقل السريع للموبايل"
        className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-around border-t border-gray-200/90 bg-white/95 px-1 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] backdrop-blur-md lg:hidden"
      >
        {MOBILE_BOTTOM_LINKS.map(({ href, shortLabel, icon: Icon }) => {
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
      </nav>
    </div>
  )
}