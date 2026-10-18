import Link from "next/link"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import {
  Bell,
  Building2,
  ExternalLink,
  FileText,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Users,
  WalletCards,
} from "lucide-react"

// الروابط محددة في السيرفر ولا تستخدم usePathname
const links = [
  { href: "/admin", label: "لوحة القيادة", icon: LayoutDashboard },
  { href: "/admin/properties", label: "إدارة العقارات", icon: Building2 },
  { href: "/admin/leads", label: "طلبات الشراء", icon: FileText },
  { href: "/admin/users", label: "المستخدمين والصلاحيات", icon: Users },
  { href: "/admin/investors", label: "المستثمرين", icon: WalletCards },
  { href: "/admin/settings", label: "الإعدادات", icon: Settings },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let adminName = "مدير النظام"
  let adminRole = "ADMIN"

  try {
    // جلب الكوكيز داخل Server Component بشكل آمن
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("user_session")?.value
    
    if (sessionId) {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
        }
      )
      const { data: user } = await supabase
        .from("users")
        .select("name, role")
        .eq("id", sessionId)
        .maybeSingle()

      if (user?.name) adminName = user.name
      if (user?.role === "moderator") adminRole = "MODERATOR"
    }
  } catch (error) {
    console.error("Supabase Error in AdminLayout:", error)
  }

  const firstLetter = adminName.trim().charAt(0) || "أ"

  return (
    <div dir="rtl" className="min-h-screen bg-[#f5f6f8] text-[#0a1122]">
      {/* القائمة الجانبية لسطح المكتب */}
      <aside className="fixed inset-y-0 right-0 z-20 hidden w-72 border-l border-white/10 bg-[#0a1122] text-white lg:flex lg:flex-col lg:justify-between">
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

          <nav aria-label="التنقل الإداري" className="flex flex-col gap-1.5 p-5">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white/75 transition-all hover:bg-white/10 hover:text-white"
              >
                <Icon className="size-4 text-emerald-400" aria-hidden="true" />
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="p-5">
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

      {/* المحتوى الرئيسي */}
      <div className="lg:mr-72">
        <header className="sticky top-0 z-10 flex min-h-20 flex-wrap items-center justify-between gap-4 border-b border-gray-200/80 bg-white/95 px-5 py-4 backdrop-blur-md lg:px-8">
          <div>
            <p className="text-xs font-bold text-[#105C50]">لوحة الإدارة المركزية</p>
            <h1 className="mt-0.5 text-lg font-extrabold text-[#0a1122] sm:text-xl">
              أهلاً بك، {adminName} 👋
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/account"
              className="rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-bold text-[#0a1122] transition hover:bg-gray-100"
            >
              حسابي الشخصي
            </Link>

            <Link
              href="/admin/properties"
              className="relative rounded-full border border-gray-200 p-2.5 text-gray-600 transition hover:bg-gray-50"
              aria-label="الإشعارات"
            >
              <Bell className="size-4" />
              <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-red-500" />
            </Link>

            <div className="flex items-center gap-3 border-r border-gray-200 pr-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-[#105C50] text-sm font-extrabold text-white">
                {firstLetter}
              </div>
              <div className="hidden sm:block">
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

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}

export { links }

export function AdminMobileNav() {
  return (
    <nav className="mb-6 grid grid-cols-3 gap-2 lg:hidden">
      {links.slice(0, 6).map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className="rounded-xl border border-gray-200 bg-white px-2.5 py-2.5 text-center text-[10px] font-bold text-[#0a1122] shadow-2xs transition hover:border-[#105C50] hover:text-[#105C50] sm:text-xs"
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
