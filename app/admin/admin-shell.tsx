"use client"

import { useState, useEffect, useRef, useTransition } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Bell,
  Building2,
  CheckCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Trash2,
  User,
  Users,
  WalletCards,
  X,
} from "lucide-react"
import {
  clearAllNotificationsAction,
  deleteNotificationAction,
  markAllNotificationsAsReadAction,
  markNotificationAsReadAction,
} from "@/app/actions/notification-actions"

export type AdminNotificationItem = {
  id: string
  title: string
  subtitle: string
  href: string
  type: "property" | "lead" | "investor"
  isRead?: boolean
  createdAt: string
}

const ADMIN_NAV_LINKS = [
  {
    href: "/admin",
    label: "الرئيسية",
    shortLabel: "الرئيسية",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/properties",
    label: "طلبات البيع",
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
  initialUnreadCount = 0,
  children,
}: {
  adminName: string
  adminRole: string
  notifications?: AdminNotificationItem[]
  initialUnreadCount?: number
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [localNotifs, setLocalNotifs] =
    useState<AdminNotificationItem[]>(notifications)
  const [unreadCount, setUnreadCount] = useState<number>(initialUnreadCount)
  const [, startTransition] = useTransition()
  const notifRef = useRef<HTMLDivElement>(null)

  const firstName = adminName.trim().split(/\s+/)[0] || "مدير"

  useEffect(() => {
    setLocalNotifs(notifications)
    const computedUnread =
      initialUnreadCount > 0
        ? initialUnreadCount
        : notifications.filter((n) => !n.isRead).length
    setUnreadCount(computedUnread)
  }, [notifications, initialUnreadCount])

  useEffect(() => {
    setDrawerOpen(false)
    setNotifOpen(false)
  }, [pathname])

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

  const handleLogout = async () => {
    try {
      document.cookie = "user_session=; path=/; max-age=0;"
      document.cookie = "session_hint=; path=/; max-age=0;"
      window.location.replace("/")
    } catch {}
  }

  // فتح الجرس وتصفير العداد الأحمر فوراً
  const handleToggleNotifications = () => {
    const nextOpen = !notifOpen
    setNotifOpen(nextOpen)

    if (nextOpen && unreadCount > 0) {
      setUnreadCount(0)
      setLocalNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })))
      startTransition(async () => {
        await markAllNotificationsAsReadAction("admin")
      })
    }
  }

  // عند الضغط على إشعار للانتقال لصفحة الطلب
  const handleNotificationClick = (item: AdminNotificationItem) => {
    setNotifOpen(false)
    setLocalNotifs((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))

    startTransition(async () => {
      await markNotificationAsReadAction(item.id)
    })

    router.push(item.href || "/admin/properties")
  }

  // حذف إشعار واحد من قائمة الأدمن
  const handleDeleteNotification = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    e.preventDefault()

    const target = localNotifs.find((n) => n.id === id)
    if (target && !target.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
    setLocalNotifs((prev) => prev.filter((n) => n.id !== id))

    startTransition(async () => {
      await deleteNotificationAction(id)
    })
  }

  // مسح كل إشعارات الأدمن
  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation()
    setLocalNotifs([])
    setUnreadCount(0)

    startTransition(async () => {
      await clearAllNotificationsAction("admin")
    })
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
          <Link
            href="/admin/profile"
            className="mb-2 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-bold text-white/85 transition hover:bg-white/10 hover:text-white"
          >
            <span>حسابي</span>
            <User className="size-3.5 text-emerald-400" />
          </Link>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="mb-2 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-bold text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            <span>معاينة الموقع العام</span>
            <ExternalLink className="size-3.5 text-emerald-400" />
          </a>

          <button
            onClick={handleLogout}
            type="button"
            className="mb-3 flex w-full items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs font-bold text-red-400 transition hover:bg-red-500/20 hover:text-red-300"
          >
            <span>تسجيل الخروج</span>
            <LogOut className="size-3.5" />
          </button>

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

      {/* ==================== 2. القائمة الجانبية المنزلقة للموبايل ==================== */}
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
              <Link
                href="/admin/profile"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-bold text-white/85 transition hover:bg-white/10"
              >
                <span>حسابي</span>
                <User className="size-3.5 text-emerald-400" />
              </Link>

              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-bold text-white/85 transition hover:bg-white/10"
              >
                <span>معاينة الموقع العام</span>
                <ExternalLink className="size-3.5 text-emerald-400" />
              </a>

              <button
                onClick={handleLogout}
                type="button"
                className="flex w-full items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-xs font-bold text-red-400 transition hover:bg-red-500/20 hover:text-red-300"
              >
                <span>تسجيل الخروج</span>
                <LogOut className="size-3.5" />
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ==================== 3. الهيدر العلوي المدمج ==================== */}
      <div className="lg:mr-72">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-2 border-b border-gray-200/80 bg-white/95 px-3.5 backdrop-blur-md sm:h-20 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-50/80 text-[#0a1122] transition hover:bg-gray-100 active:scale-95 lg:hidden"
            >
              <Menu className="size-5" />
            </button>

            <div className="min-w-0">
              <p className="truncate text-[10px] font-extrabold text-[#105C50] sm:text-xs">
                {currentSection}
              </p>
              <h1 className="truncate text-sm font-extrabold text-[#0a1122] sm:text-lg">
                أهلاً، {firstName}
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
            <Link
              href="/admin/profile"
              className="inline-flex h-9 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 px-4 text-xs font-bold text-[#0a1122] transition hover:border-[#105C50] hover:bg-white sm:h-10 sm:px-5"
            >
              <span>حسابي</span>
            </Link>

            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={handleToggleNotifications}
                className="relative flex size-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50 sm:size-10"
                aria-label="الإشعارات"
              >
                <Bell className="size-4" />
                {unreadCount > 0 && (
                  <span
                    dir="ltr"
                    className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-extrabold text-white"
                  >
                    {unreadCount > 9 ? "+9" : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="fixed left-3 right-3 top-[68px] z-50 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl sm:absolute sm:left-0 sm:right-auto sm:top-12 sm:w-96"
                >
                  <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/90 px-4 py-3">
                    <span className="flex items-center gap-1.5 text-xs font-extrabold text-[#0a1122]">
                      <span>التنبيهات والطلبات</span>
                      <span
                        dir="ltr"
                        className="rounded-full bg-[#105C50]/10 px-2 py-0.5 text-[10px] font-extrabold text-[#105C50]"
                      >
                        {localNotifs.length}
                      </span>
                    </span>

                    <div className="flex items-center gap-2">
                      {localNotifs.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearAll}
                          className="rounded-lg px-2 py-1 text-[11px] font-bold text-red-600 transition hover:bg-red-50"
                        >
                          مسح الكل
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setNotifOpen(false)}
                        className="rounded-lg p-1 text-gray-400 hover:bg-gray-200/60 hover:text-gray-700"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-[65vh] divide-y divide-gray-100 overflow-y-auto sm:max-h-96">
                    {localNotifs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                        <CheckCircle2 className="mb-2 size-8 text-emerald-500" />
                        <p className="text-xs font-bold text-[#0a1122]">
                          لا توجد إشعارات حالياً
                        </p>
                        <p className="mt-0.5 text-[11px] text-gray-400">
                          تمت مراجعة كافة العقارات والطلبات الجديدة.
                        </p>
                      </div>
                    ) : (
                      localNotifs.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleNotificationClick(item)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleNotificationClick(item)
                          }}
                          className={`group flex cursor-pointer items-start gap-3 p-4 text-right transition hover:bg-gray-50 active:bg-gray-100 ${
                            !item.isRead ? "bg-emerald-50/40" : "bg-white"
                          }`}
                        >
                          <span
                            className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
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
                            <p
                              className={`text-xs leading-snug text-[#0a1122] break-words whitespace-normal ${
                                !item.isRead ? "font-extrabold" : "font-bold"
                              }`}
                            >
                              {item.title}
                            </p>
                            <p className="mt-1 text-[11.5px] leading-relaxed text-gray-600 break-words whitespace-normal">
                              {item.subtitle}
                            </p>
                            <div className="mt-2 flex items-center justify-between">
                              <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                <Clock className="size-3" />
                                <span dir="ltr">{item.createdAt}</span>
                              </span>
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#105C50] group-hover:underline">
                                <span>مراجعة الطلب</span>
                                <ArrowLeft className="size-3" />
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) =>
                              handleDeleteNotification(e, item.id)
                            }
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

                  <div className="border-t border-gray-100 bg-gray-50/50 p-2 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setNotifOpen(false)
                        router.push("/admin/properties")
                      }}
                      className="w-full rounded-lg py-1.5 text-[11px] font-bold text-[#105C50] hover:bg-emerald-50"
                    >
                      عرض كل العقارات والطلبات
                    </button>
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