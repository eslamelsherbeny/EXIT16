"use client"

import { useState, useEffect, useRef, useTransition } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Bell,
  Building2,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  FileText,
  Globe,
  Handshake,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Star,
  User,
  Users,
  WalletCards,
  X,
} from "lucide-react"
import {
  markAllNotificationsAsReadAction,
  markNotificationAsReadAction,
} from "@/actions/notification-actions"
import { logoutAdminAction } from "@/actions/admin-actions"
import {
  SUPPORTED_LANGUAGES,
  type LanguageConfig,
} from "@/components/layouts/site-shell"
import { useTranslation, type LocaleCode } from "@/lib/i18n"

export type StaffRole = "OWNER" | "ADMIN" | "MODERATOR" | "SALES"

export type AdminNotificationItem = {
  id: string
  title: string
  subtitle: string
  href: string
  type: "property" | "lead" | "investor"
  isRead?: boolean
  createdAt: string
}

function DualDealzSvgLogo({
  className = "h-[34px] w-auto",
}: {
  className?: string
}) {
  return (
    <svg
      width="88"
      height="46"
      viewBox="0 0 88 46"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="DualDealz"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2 2H14A13 13 0 0 1 14 28H2V2ZM6.6 6.6V23.4H14A8.4 8.4 0 0 0 14 6.6H6.6Z"
        fill="#0f1d40"
      />
      <path
        d="M9 9.1H14A5.9 5.9 0 0 1 14 20.9H9V18.2H14A3.2 3.2 0 0 0 14 11.8H9V9.1Z"
        fill="#007a5a"
        className="transition-transform duration-300 ease-out group-hover:translate-x-[1.2px]"
      />
      <path
        d="M32.5 10H37.1V18.7A4.9 4.9 0 0 0 46.9 18.7V10H51.5V18.7A9.5 9.5 0 0 1 32.5 18.7V10Z"
        fill="#0f1d40"
      />
      <rect x="46.9" y="18.5" width="4.6" height="9.5" fill="#0f1d40" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M75.4 19A9.2 9.2 0 1 1 57 19A9.2 9.2 0 1 1 75.4 19ZM70.9 19A4.7 4.7 0 1 0 61.5 19A4.7 4.7 0 1 0 70.9 19Z"
        fill="#0f1d40"
      />
      <rect x="70.9" y="10" width="4.5" height="18" fill="#0f1d40" />
      <rect x="81.4" y="2" width="4.6" height="26" fill="#0f1d40" />

      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2 34.2H6.6A4.8 4.8 0 0 1 6.6 43.8H2V34.2ZM3.9 36.1V41.9H6.6A2.9 2.9 0 0 0 6.6 36.1H3.9Z"
        fill="#007a5a"
      />
      <path
        d="M20.6 34.2H28.6V36.05H22.5V38.05H27.5V39.9H22.5V41.95H28.6V43.8H20.6V34.2Z"
        fill="#007a5a"
      />
      <path
        d="M37.8 43.8L42.1 34.2H43.9L48.2 43.8H46.15L43 36.6L39.85 43.8H37.8Z"
        fill="#007a5a"
      />
      <path
        d="M57.8 34.2H59.7V41.95H65.4V43.8H57.8V34.2Z"
        fill="#007a5a"
      />
      <path
        d="M76.4 34.2H86V35.95L79.05 41.95H86V43.8H76.2V42.05L83.15 36.05H76.4V34.2Z"
        fill="#007a5a"
      />
    </svg>
  )
}

function LanguageFlagIcon({ code }: { code: LocaleCode }) {
  if (code === "ar") {
    return (
      <svg
        viewBox="0 0 24 16"
        className="h-3.5 w-5 shrink-0 rounded-[3px] shadow-2xs ring-1 ring-black/10"
      >
        <rect width="24" height="5.33" fill="#CE1126" />
        <rect y="5.33" width="24" height="5.33" fill="#FFFFFF" />
        <rect y="10.66" width="24" height="5.34" fill="#000000" />
        <circle cx="12" cy="8" r="1.4" fill="#C09300" />
      </svg>
    )
  }
  if (code === "ru") {
    return (
      <svg
        viewBox="0 0 24 16"
        className="h-3.5 w-5 shrink-0 rounded-[3px] shadow-2xs ring-1 ring-black/10"
      >
        <rect width="24" height="5.33" fill="#FFFFFF" />
        <rect y="5.33" width="24" height="5.33" fill="#0039A6" />
        <rect y="10.66" width="24" height="5.34" fill="#D52B1E" />
      </svg>
    )
  }
  if (code === "ka") {
    return (
      <svg
        viewBox="0 0 24 16"
        className="h-3.5 w-5 shrink-0 rounded-[3px] shadow-2xs ring-1 ring-black/10"
      >
        <rect width="24" height="16" fill="#FFFFFF" />
        <rect x="10" width="4" height="16" fill="#FF0000" />
        <rect y="6" width="24" height="4" fill="#FF0000" />
        <circle cx="5" cy="3" r="1.1" fill="#FF0000" />
        <circle cx="19" cy="3" r="1.1" fill="#FF0000" />
        <circle cx="5" cy="13" r="1.1" fill="#FF0000" />
        <circle cx="19" cy="13" r="1.1" fill="#FF0000" />
      </svg>
    )
  }
  return (
    <svg
      viewBox="0 0 24 16"
      className="h-3.5 w-5 shrink-0 rounded-[3px] shadow-2xs ring-1 ring-black/10"
    >
      <rect width="24" height="16" fill="#012169" />
      <path d="M0,0 L24,16 M24,0 L0,16" stroke="#FFFFFF" strokeWidth="2.8" />
      <path d="M0,0 L24,16 M24,0 L0,16" stroke="#C8102E" strokeWidth="1.4" />
      <rect x="9.5" width="5" height="16" fill="#FFFFFF" />
      <rect y="5.5" width="24" height="5" fill="#FFFFFF" />
      <rect x="10.5" width="3" height="16" fill="#C8102E" />
      <rect y="6.5" width="24" height="3" fill="#C8102E" />
    </svg>
  )
}

export default function AdminShell({
  adminName,
  adminRole,
  notifications = [],
  initialUnreadCount = 0,
  children,
}: {
  adminName: string
  adminRole: StaffRole
  notifications?: AdminNotificationItem[]
  initialUnreadCount?: number
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()

  const { t: dict, locale, dir, isRtl } = useTranslation()
  const t = dict.admin.shell
  const nav = t.nav as Record<string, string>
  const nL =
    ((dict.accountPages as Record<string, any>)?.notifications as Record<
      string,
      string
    >) || {}

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerLangOpen, setDrawerLangOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const [localNotifs, setLocalNotifs] =
    useState<AdminNotificationItem[]>(notifications)
  const [unreadCount, setUnreadCount] = useState<number>(initialUnreadCount)
  const [isSwitchingLang, startLangTransition] = useTransition()
  const [, startTransition] = useTransition()

  const notifRef = useRef<HTMLDivElement>(null)
  const langMenuRef = useRef<HTMLDivElement>(null)

  const firstName =
    adminName.trim().split(/\s+/)[0] || t.defaultAdminName || ""
  const initialLetter = (firstName.charAt(0) || "A").toUpperCase()
  const normalizedRole: "ADMIN" | "MODERATOR" | "SALES" =
    adminRole === "OWNER" || adminRole === "ADMIN" ? "ADMIN" : adminRole

  const roleBadgeLabel =
    adminRole === "OWNER"
      ? dict.admin.usersPage?.superAdminBadge || t.roles.ADMIN
      : t.roles[normalizedRole]

  const allNavLinks = [
    {
      href: "/admin",
      label: nav.dashboard,
      shortLabel: nav.dashboard,
      icon: LayoutDashboard,
      allowed: ["ADMIN", "MODERATOR", "SALES"] as Array<
        "ADMIN" | "MODERATOR" | "SALES"
      >,
    },
    {
      href: "/admin/offers",
      label: nav.offers || (locale === "ar" ? "العروض والتفاوض" : "Offers"),
      shortLabel: nav.offersShort || (locale === "ar" ? "العروض" : "Offers"),
      icon: WalletCards,
      allowed: ["ADMIN", "MODERATOR", "SALES"] as Array<
        "ADMIN" | "MODERATOR" | "SALES"
      >,
    },
    {
      href: "/admin/deals",
      label: nav.deals || (locale === "ar" ? "الصفقات والمبيعات" : "Deals"),
      shortLabel: nav.dealsShort || (locale === "ar" ? "الصفقات" : "Deals"),
      icon: Handshake,
      allowed: ["ADMIN", "MODERATOR", "SALES"] as Array<
        "ADMIN" | "MODERATOR" | "SALES"
      >,
    },
    {
      href: "/admin/properties",
      label: nav.properties,
      shortLabel: nav.propertiesShort,
      icon: Building2,
      allowed: ["ADMIN", "MODERATOR", "SALES"] as Array<
        "ADMIN" | "MODERATOR" | "SALES"
      >,
    },
    {
      href: "/admin/promotions",
      label: nav.promotions,
      shortLabel: nav.promotionsShort,
      icon: Star,
      allowed: ["ADMIN", "MODERATOR"] as Array<
        "ADMIN" | "MODERATOR" | "SALES"
      >,
    },
    {
      href: "/admin/leads",
      label: nav.leads,
      shortLabel: nav.leadsShort,
      icon: FileText,
      allowed: ["ADMIN", "MODERATOR", "SALES"] as Array<
        "ADMIN" | "MODERATOR" | "SALES"
      >,
    },
    {
      href: "/admin/users",
      label: nav.users,
      shortLabel: nav.usersShort,
      icon: Users,
      allowed: ["ADMIN"] as Array<"ADMIN" | "MODERATOR" | "SALES">,
    },
    {
      href: "/admin/settings",
      label: nav.settings,
      shortLabel: nav.settingsShort,
      icon: Settings,
      allowed: ["ADMIN"] as Array<"ADMIN" | "MODERATOR" | "SALES">,
    },
  ]

  const visibleNavLinks = allNavLinks.filter((item) =>
    item.allowed.includes(normalizedRole)
  )

  const mobileBottomLinks = visibleNavLinks.slice(0, 5)

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
    setDrawerLangOpen(false)
    setNotifOpen(false)
    setLangMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (notifRef.current && !notifRef.current.contains(target)) {
        setNotifOpen(false)
      }
      if (langMenuRef.current && !langMenuRef.current.contains(target)) {
        setLangMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin"
    return pathname?.startsWith(href)
  }

  const handleSelectLanguage = (code: LocaleCode) => {
    setLangMenuOpen(false)
    setDrawerLangOpen(false)
    setDrawerOpen(false)
    if (code === locale) return
    const targetLang = SUPPORTED_LANGUAGES[code]
    document.cookie = `locale=${code}; path=/; max-age=31536000; SameSite=Lax`
    document.documentElement.lang = code
    document.documentElement.dir = targetLang.dir
    window.dispatchEvent(new Event("language-changed"))
    startLangTransition(() => {
      router.refresh()
    })
  }

  const handleLogout = async () => {
    try {
      await logoutAdminAction()
    } catch {}
    document.cookie = "session_hint=; path=/; max-age=0;"
    window.location.replace("/")
  }

  const handleToggleNotifications = () => {
    setNotifOpen((prev) => !prev)
    setLangMenuOpen(false)
  }

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (unreadCount === 0) return
    setUnreadCount(0)
    setLocalNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })))
    startTransition(async () => {
      await markAllNotificationsAsReadAction("admin")
    })
  }

  const handleNotificationClick = (item: AdminNotificationItem) => {
    setNotifOpen(false)
    if (!item.isRead) {
      setLocalNotifs((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
      startTransition(async () => {
        await markNotificationAsReadAction(item.id)
      })
    }

    const targetHref = item.href?.includes("tab=featured")
      ? item.href.replace("/admin/properties?tab=featured", "/admin/promotions?")
      : item.href?.includes("/admin?deal=")
        ? item.href.replace("/admin?deal=", "/admin/deals?offerId=")
        : item.href || "/admin/properties"

    router.push(targetHref)
  }

  const currentSection =
    visibleNavLinks.find((item) => isActive(item.href))?.label || t.adminPanel
  const activeLangObj = SUPPORTED_LANGUAGES[locale] || SUPPORTED_LANGUAGES.ar

  const previewNotifs = localNotifs.slice(0, 5)
  const unreadPreview = previewNotifs.filter((n) => !n.isRead)
  const readPreview = previewNotifs.filter((n) => n.isRead)

  const renderAdminNotifRow = (item: AdminNotificationItem) => (
    <div
      key={item.id}
      onClick={() => handleNotificationClick(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") handleNotificationClick(item)
      }}
      className={`group flex cursor-pointer items-start gap-2.5 px-3.5 py-2.5 text-start transition hover:bg-slate-50 ${
        !item.isRead ? "bg-[#eaf8f2]/45" : "bg-white"
      }`}
    >
      <span
        className={`mt-0.5 flex size-7.5 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
          item.type === "property"
            ? "bg-amber-100 text-amber-800"
            : item.type === "lead"
              ? "bg-[#eaf8f2] text-[#007a5a]"
              : "bg-blue-100 text-blue-800"
        }`}
      >
        {item.type === "property" ? (
          <Building2 className="size-3.5" />
        ) : item.type === "lead" ? (
          <FileText className="size-3.5" />
        ) : (
          <WalletCards className="size-3.5" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-[11.5px] leading-snug text-[#0f1d40] ${
              !item.isRead ? "font-extrabold" : "font-bold"
            }`}
          >
            {item.title}
          </p>
          {!item.isRead && (
            <span className="mt-1 size-2 shrink-0 rounded-full bg-[#007a5a]" />
          )}
        </div>
        {item.subtitle && (
          <p className="mt-0.5 line-clamp-1 break-words text-[10.5px] leading-relaxed text-slate-500">
            {item.subtitle}
          </p>
        )}
        <div className="mt-1 flex items-center justify-between">
          <span className="flex items-center gap-1 text-[10px] text-slate-400">
            <Clock className="size-2.5" />
            <span dir="ltr">{item.createdAt}</span>
          </span>
          <span className="text-[10px] font-bold text-[#007a5a] group-hover:underline">
            {t.view}
          </span>
        </div>
      </div>
    </div>
  )

  return (
    <div
      dir={dir}
      className="min-h-screen bg-[#f5f7fa] pb-20 text-[#0f1d40] lg:pb-0"
    >
      {/* السايدبار في الكمبيوتر */}
      <aside
        className={`fixed inset-y-0 z-30 hidden w-[260px] border-slate-200/90 bg-white lg:flex lg:flex-col lg:justify-between ${
          isRtl ? "right-0 border-l" : "left-0 border-r"
        }`}
      >
        <div>
          <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
            <Link
              href="/admin"
              className="group flex items-center gap-2.5 transition hover:opacity-95"
            >
              <DualDealzSvgLogo className="h-[34px] w-auto shrink-0" />
              <span className="h-6 w-px bg-slate-200" aria-hidden="true" />
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-extrabold text-slate-600">
                {t.adminPanel}
              </span>
            </Link>
          </div>

          <div className="px-3.5 pt-4">
            <div className="mb-4 flex items-center justify-between rounded-xl border border-emerald-100 bg-[#eaf8f2]/70 px-3 py-2.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#007a5a] text-xs font-black text-white shadow-2xs">
                  {initialLetter}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-extrabold text-[#0f1d40]">
                    {adminName}
                  </p>
                  <p className="truncate text-[10.5px] font-bold text-[#007a5a]">
                    {roleBadgeLabel}
                  </p>
                </div>
              </div>
              <ShieldCheck className="size-4 shrink-0 text-[#007a5a]" />
            </div>

            <nav className="flex flex-col gap-1">
              {visibleNavLinks.map(({ href, label, icon: Icon }) => {
                const active = isActive(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-extrabold transition-all ${
                      active
                        ? "bg-[#007a5a] text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-100/80 hover:text-[#0f1d40]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`size-4 shrink-0 transition-colors ${
                          active
                            ? "text-white"
                            : "text-slate-400 group-hover:text-[#007a5a]"
                        }`}
                      />
                      <span>{label}</span>
                    </div>
                    {active && (
                      <span className="size-1.5 rounded-full bg-white" />
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>

        <div className="space-y-1.5 border-t border-slate-100 p-3.5">
          <Link
            href="/admin/profile"
            className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-extrabold transition ${
              pathname === "/admin/profile"
                ? "bg-[#eaf8f2] text-[#007a5a]"
                : "bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-[#0f1d40]"
            }`}
          >
            <span className="flex items-center gap-2">
              <User className="size-3.5 text-[#007a5a]" />
              <span>{t.myProfile}</span>
            </span>
          </Link>

          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs font-extrabold text-slate-700 transition hover:bg-slate-100 hover:text-[#0f1d40]"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="size-3.5 text-[#007a5a]" />
              <span>{t.publicSite}</span>
            </span>
          </Link>

          <button
            onClick={handleLogout}
            type="button"
            className="flex w-full items-center justify-between rounded-xl bg-red-50 px-3.5 py-2.5 text-xs font-extrabold text-red-600 transition hover:bg-red-100"
          >
            <span>{t.logout}</span>
            <LogOut className="size-3.5" />
          </button>
        </div>
      </aside>

      {/* القائمة الجانبية في الموبايل */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />

          <aside
            className={`fixed inset-y-0 z-50 flex w-[285px] max-w-[85vw] flex-col justify-between overflow-y-auto bg-white text-[#0f1d40] shadow-2xl ${
              isRtl ? "right-0" : "left-0"
            }`}
          >
            <div>
              <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
                <Link
                  href="/admin"
                  onClick={() => setDrawerOpen(false)}
                  className="group flex items-center gap-2.5"
                >
                  <DualDealzSvgLogo className="h-[32px] w-auto shrink-0" />
                  <span className="h-5 w-px bg-slate-200" aria-hidden="true" />
                  <span className="rounded-md bg-[#eaf8f2] px-2 py-0.5 text-[10px] font-extrabold text-[#007a5a]">
                    {roleBadgeLabel}
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                >
                  <X className="size-4" />
                </button>
              </div>

              <nav className="mt-3 flex flex-col gap-1 px-3">
                {visibleNavLinks.map(({ href, label, icon: Icon }) => {
                  const active = isActive(href)
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setDrawerOpen(false)}
                      className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-extrabold transition-all ${
                        active
                          ? "bg-[#007a5a] text-white shadow-xs"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`size-4 shrink-0 ${
                            active ? "text-white" : "text-slate-400"
                          }`}
                        />
                        <span>{label}</span>
                      </div>
                      {active && (
                        <span className="size-1.5 rounded-full bg-white" />
                      )}
                    </Link>
                  )
                })}
              </nav>

              {/* زر اللغة المدمج داخل القائمة الجانبية (يفتح عند الضغط فقط) */}
              <div className="mt-3 border-t border-slate-100 px-3 pt-3">
                <button
                  type="button"
                  disabled={isSwitchingLang}
                  onClick={() => setDrawerLangOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200/90 bg-slate-50/80 px-3.5 py-2.5 text-xs font-extrabold text-[#0f1d40] transition hover:border-[#007a5a] hover:bg-white"
                >
                  <span className="flex items-center gap-2">
                    <Globe className="size-4 text-[#007a5a]" />
                    <span>{t.languageLabel}</span>
                  </span>

                  <span className="flex items-center gap-1.5">
                    {isSwitchingLang ? (
                      <Loader2 className="size-3.5 animate-spin text-[#007a5a]" />
                    ) : (
                      <LanguageFlagIcon code={locale} />
                    )}
                    <span dir="ltr" className="font-mono text-[11px] font-black">
                      {activeLangObj.shortCode}
                    </span>
                    <ChevronDown
                      className={`size-3.5 text-slate-400 transition-transform ${
                        drawerLangOpen ? "rotate-180" : ""
                      }`}
                    />
                  </span>
                </button>

                {drawerLangOpen && (
                  <div className="mt-1.5 space-y-1 rounded-xl border border-slate-200/80 bg-white p-1.5 shadow-sm">
                    {(
                      Object.values(SUPPORTED_LANGUAGES) as LanguageConfig[]
                    ).map((lang) => {
                      const isSelected = locale === lang.code
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          disabled={isSwitchingLang}
                          onClick={() => handleSelectLanguage(lang.code)}
                          className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-bold transition ${
                            isSelected
                              ? "bg-[#eaf8f2] text-[#007a5a]"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <LanguageFlagIcon code={lang.code} />
                            <span>{lang.nativeName}</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span
                              dir="ltr"
                              className="font-mono text-[10px] font-extrabold text-slate-400"
                            >
                              {lang.shortCode}
                            </span>
                            {isSelected && (
                              <Check className="size-3.5 text-[#007a5a]" />
                            )}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 space-y-1.5 border-t border-slate-100 p-3.5">
              <Link
                href="/admin/profile"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs font-extrabold text-slate-700"
              >
                <span>{t.myProfile}</span>
                <User className="size-3.5 text-[#007a5a]" />
              </Link>

              <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs font-extrabold text-slate-700"
              >
                <span>{t.publicSite}</span>
                <ExternalLink className="size-3.5 text-[#007a5a]" />
              </Link>

              <button
                onClick={handleLogout}
                type="button"
                className="flex w-full items-center justify-between rounded-xl bg-red-50 px-3.5 py-2.5 text-xs font-extrabold text-red-600"
              >
                <span>{t.logout}</span>
                <LogOut className="size-3.5" />
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className={isRtl ? "lg:mr-[260px]" : "lg:ml-[260px]"}>
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-2.5 border-b border-slate-200/85 bg-white/95 px-4 backdrop-blur-md sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-[#0f1d40] transition hover:bg-slate-100 lg:hidden"
              aria-label="Menu"
            >
              <Menu className="size-4" />
            </button>

            <h1 className="truncate text-[15px] font-black text-[#0f1d40] sm:text-lg">
              {currentSection}
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {/* زر اللغة المضغوط في الهيدر على الكمبيوتر */}
            <div className="relative hidden lg:block" ref={langMenuRef}>
              <button
                type="button"
                disabled={isSwitchingLang}
                onClick={() => {
                  setLangMenuOpen((prev) => !prev)
                  setNotifOpen(false)
                }}
                aria-label={t.languageLabel}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-extrabold text-[#0f1d40] shadow-2xs transition hover:border-[#007a5a] hover:bg-slate-50"
              >
                <Globe className="size-3.5 text-[#007a5a]" />
                {isSwitchingLang ? (
                  <Loader2 className="size-3.5 animate-spin text-[#007a5a]" />
                ) : (
                  <LanguageFlagIcon code={locale} />
                )}
                <span dir="ltr" className="font-mono text-[11px] font-black">
                  {activeLangObj.shortCode}
                </span>
                <ChevronDown
                  className={`size-3.5 text-slate-400 transition-transform ${
                    langMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {langMenuOpen && (
                <div
                  className={`absolute top-11 z-50 w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl ${
                    isRtl ? "left-0" : "right-0"
                  }`}
                >
                  {(Object.values(SUPPORTED_LANGUAGES) as LanguageConfig[]).map(
                    (lang) => {
                      const isSelected = locale === lang.code
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => handleSelectLanguage(lang.code)}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition ${
                            isSelected
                              ? "bg-[#eaf8f2] text-[#007a5a]"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span className="flex items-center gap-2.5">
                            <LanguageFlagIcon code={lang.code} />
                            <span>{lang.nativeName}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span
                              dir="ltr"
                              className="font-mono text-[10px] font-extrabold text-slate-400"
                            >
                              {lang.shortCode}
                            </span>
                            {isSelected && (
                              <Check className="size-3.5 text-[#007a5a]" />
                            )}
                          </span>
                        </button>
                      )
                    }
                  )}
                </div>
              )}
            </div>

            {/* جرس الإشعارات (قائمة مدمجة غير مكررة) */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={handleToggleNotifications}
                className="relative flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-2xs transition hover:border-[#007a5a] hover:bg-slate-50"
                aria-label={t.notifications}
              >
                <Bell className="size-4" />
                {unreadCount > 0 && (
                  <span
                    dir="ltr"
                    className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-black text-white ring-2 ring-white"
                  >
                    {unreadCount > 9 ? "+9" : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className={`fixed right-3 left-3 top-[66px] z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:absolute sm:top-11 sm:w-96 ${
                    isRtl
                      ? "sm:right-auto sm:left-0"
                      : "sm:right-0 sm:left-auto"
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2.5">
                    <span className="flex items-center gap-1.5 text-xs font-extrabold text-[#0f1d40]">
                      <span>{nL.title || t.notifications}</span>
                      {unreadCount > 0 && (
                        <span
                          dir="ltr"
                          className="rounded-full bg-[#eaf8f2] px-2 py-0.5 text-[10px] font-extrabold text-[#007a5a]"
                        >
                          {unreadCount}
                        </span>
                      )}
                    </span>

                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-extrabold text-[#007a5a] transition hover:bg-[#eaf8f2]"
                      >
                        <CheckCheck className="size-3.5" />
                        <span>{nL.markAllReadBtn}</span>
                      </button>
                    )}
                  </div>

                  <div className="max-h-[300px] overflow-y-auto sm:max-h-80">
                    {previewNotifs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
                        <CheckCircle2 className="mb-1.5 size-7 text-emerald-500" />
                        <p className="text-xs font-bold text-[#0f1d40]">
                          {nL.emptyTitle || t.noNotifications}
                        </p>
                      </div>
                    ) : (
                      <div>
                        {unreadPreview.length > 0 && (
                          <div>
                            <div className="bg-slate-50/90 px-4 py-1 text-[10px] font-black text-[#007a5a]">
                              {nL.newSectionHeader}
                            </div>
                            <div className="divide-y divide-slate-100">
                              {unreadPreview.map(renderAdminNotifRow)}
                            </div>
                          </div>
                        )}

                        {readPreview.length > 0 && (
                          <div>
                            <div className="bg-slate-50/90 px-4 py-1 text-[10px] font-black text-slate-400">
                              {nL.olderSectionHeader}
                            </div>
                            <div className="divide-y divide-slate-100">
                              {readPreview.map(renderAdminNotifRow)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-100 bg-slate-50/70 p-2 text-center">
                    <Link
                      href="/admin/notifications"
                      onClick={() => setNotifOpen(false)}
                      className="block w-full rounded-xl py-2 text-xs font-extrabold text-[#007a5a] transition hover:bg-[#eaf8f2]"
                    >
                      {nL.viewAllBtn}
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/admin/profile"
              title={t.myProfile}
              aria-label={t.myProfile}
              className={`flex size-9 items-center justify-center rounded-xl border transition ${
                pathname === "/admin/profile"
                  ? "border-[#007a5a] bg-[#007a5a] text-white shadow-2xs"
                  : "border-slate-200 bg-white text-slate-700 shadow-2xs hover:border-[#007a5a] hover:bg-slate-50 hover:text-[#007a5a]"
              }`}
            >
              <User className="size-4" />
            </Link>
          </div>
        </header>

        <main className="p-3.5 sm:p-6">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex h-15 items-center justify-around border-t border-slate-200 bg-white/95 px-1 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] backdrop-blur-md lg:hidden">
        {mobileBottomLinks.map(({ href, shortLabel, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-bold transition ${
                active ? "text-[#007a5a]" : "text-slate-400 hover:text-[#0f1d40]"
              }`}
            >
              <span
                className={`flex h-6 w-10 items-center justify-center rounded-full transition ${
                  active ? "bg-[#eaf8f2] text-[#007a5a]" : ""
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