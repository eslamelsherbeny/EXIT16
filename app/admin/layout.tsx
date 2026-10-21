import Link from "next/link"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerClient } from "@supabase/ssr"
import { ShieldAlert, LogIn, Home } from "lucide-react"
import { parseAndVerifySessionCookie } from "@/app/actions/auth-actions"
import { getServerI18n } from "@/lib/get-server-dictionary"
import AdminShell, {
  type AdminNotificationItem,
  type StaffRole,
} from "./admin-shell"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const rawSession = cookieStore.get("user_session")?.value

  // 1. منع الدخول من المتصفح الخفي أو بدون تسجيل دخول
  if (!rawSession) {
    redirect("/login?next=/admin")
  }

  const candidateUserId = rawSession.split(".")[0]

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
    }
  )

  const { data: user } = await supabase
    .from("users")
    .select("id, name, email, role, status, password_hash")
    .eq("id", candidateUserId)
    .maybeSingle()

  if (!user) {
    redirect("/login?next=/admin")
  }

  // 2. فحص بصمة الباسورد (إذا تغير الباسورد من جهاز آخر يخرج فوراً)
  const sessionCheck = parseAndVerifySessionCookie(
    rawSession,
    user.password_hash
  )
  if (!sessionCheck.valid) {
    redirect("/login?next=/admin")
  }

  const cleanRole = String(user.role || "user")
    .replace(/[\r\n\s]+/g, "")
    .toLowerCase()
  const cleanStatus = String(user.status || "active")
    .replace(/[\r\n\s]+/g, "")
    .toLowerCase()

  const isAuthorizedStaff =
    (cleanRole === "admin" ||
      cleanRole === "moderator" ||
      cleanRole === "sales") &&
    cleanStatus !== "suspended"

  const { locale, dir } = await getServerI18n()

  // 3. إذا كان الحساب لعميل عادي وليس من فريق الإدارة
  if (!isAuthorizedStaff) {
    return (
      <main
        dir={dir}
        className="flex min-h-screen items-center justify-center bg-[#0a1122] px-4 py-12 text-white"
      >
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#121d33] p-8 text-center shadow-2xl">
          <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-red-500/15 text-red-400">
            <ShieldAlert className="size-8" />
          </span>
          <h1 className="mt-5 text-2xl font-extrabold text-white">
            {locale === "ar" ? "غير مصرح لك بالدخول" : "Access Denied"}
          </h1>
          <p className="mt-2.5 text-xs leading-relaxed text-gray-300 sm:text-sm">
            {locale === "ar"
              ? "هذه اللوحة مخصصة لفريق الإدارة والمبيعات فقط. حسابك الحالي لا يمتلك صلاحيات إدارية:"
              : "This panel is restricted to staff members only. Your current account does not have staff permissions:"}
            <br />
            <span dir="ltr" className="mt-1 inline-block font-mono text-emerald-300">
              {user.email}
            </span>
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login?next=/admin"
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#007a5a] px-5 text-xs font-bold text-white transition hover:bg-[#006248]"
            >
              <LogIn className="size-4" />
              <span>
                {locale === "ar" ? "دخول بحساب الإدارة" : "Staff Login"}
              </span>
            </Link>
            <Link
              href="/"
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 text-xs font-bold text-white transition hover:bg-white/10"
            >
              <Home className="size-4" />
              <span>{locale === "ar" ? "العودة للرئيسية" : "Back to Home"}</span>
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const adminName = user.name || "Admin"
  const staffRole: StaffRole =
    cleanRole === "admin"
      ? "ADMIN"
      : cleanRole === "moderator"
        ? "MODERATOR"
        : "SALES"

  let notifications: AdminNotificationItem[] = []
  let unreadCount = 0

  try {
    const { data: dbNotifs } = await supabase
      .from("notifications")
      .select("*")
      .is("user_id", null)
      .order("created_at", { ascending: false })
      .limit(30)

    if (dbNotifs && dbNotifs.length > 0) {
      notifications = dbNotifs.map((n) => {
        const rawType = String(n.type || "property")
        const mappedType: "property" | "lead" | "investor" =
          rawType === "lead" || rawType === "property_match"
            ? "lead"
            : rawType === "investor"
              ? "investor"
              : "property"

        return {
          id: n.id,
          title: n.title,
          subtitle: n.message,
          href: n.link || "/admin/properties",
          type: mappedType,
          isRead: Boolean(n.is_read),
          createdAt: n.created_at
            ? new Date(n.created_at).toLocaleDateString("en-US")
            : "Now",
        }
      })

      unreadCount = notifications.filter((n) => !n.isRead).length
    }
  } catch (error) {
    console.error("Supabase Error in AdminLayout:", error)
  }

  return (
    <AdminShell
      adminName={adminName}
      adminRole={staffRole}
      notifications={notifications}
      initialUnreadCount={unreadCount}
    >
      {children}
    </AdminShell>
  )
}
