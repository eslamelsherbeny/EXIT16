import Link from "next/link"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerClient } from "@supabase/ssr"
import { ShieldAlert, LogIn, Home } from "lucide-react"
import {
  extractUserIdFromCookie,
  parseAndVerifySessionCookie,
} from "@/lib/session-security"
import { getServerI18n } from "@/lib/get-server-dictionary"
import { localizeNotificationItem } from "@/app/actions/notification-actions"
import AdminShell, {
  type AdminNotificationItem,
  type StaffRole,
} from "../../components/layouts/admin-shell"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const rawSession = cookieStore.get("user_session")?.value
  const candidateUserId = extractUserIdFromCookie(rawSession)

  if (!rawSession || !candidateUserId) {
    redirect("/login?next=/admin")
  }

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

  const { dict, dir } = await getServerI18n()
  const t = dict.admin?.accessDenied

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
            {t?.title}
          </h1>
          <p className="mt-2.5 text-xs leading-relaxed text-gray-300 sm:text-sm">
            {t?.desc}
            <br />
            <span
              dir="ltr"
              className="mt-1 inline-block font-mono text-emerald-300"
            >
              {user.email}
            </span>
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login?next=/admin"
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#007a5a] px-5 text-xs font-bold text-white transition hover:bg-[#006248]"
            >
              <LogIn className="size-4" />
              <span>{t?.staffLoginBtn}</span>
            </Link>
            <Link
              href="/"
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 text-xs font-bold text-white transition hover:bg-white/10"
            >
              <Home className="size-4" />
              <span>{t?.backHomeBtn}</span>
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
      .neq("title", "__GLOBAL_SITE_CONFIG__")
      .order("created_at", { ascending: false })
      .limit(30)

    if (dbNotifs && dbNotifs.length > 0) {
      notifications = await Promise.all(
        dbNotifs.map(async (n) => {
          const rawType = String(n.type || "property")
          const mappedType: "property" | "lead" | "investor" =
            rawType === "lead" || rawType === "property_match"
              ? "lead"
              : rawType === "investor"
                ? "investor"
                : "property"

          const localized = await localizeNotificationItem(n, dict)

          return {
            id: n.id,
            title: localized.title,
            subtitle: localized.message,
            href: n.link || "/admin/properties",
            type: mappedType,
            isRead: Boolean(n.is_read),
            createdAt: n.created_at
              ? new Date(n.created_at).toLocaleDateString("en-GB")
              : "Now",
          }
        })
      )

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
