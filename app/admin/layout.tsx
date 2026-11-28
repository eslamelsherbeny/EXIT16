import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { ShieldAlert, LogIn, Home } from "lucide-react"
import {
  extractUserIdFromCookie,
  parseAndVerifySessionCookie,
} from "@/lib/session-security"
import { getServerI18n } from "@/lib/get-server-dictionary"
import AdminShell, {
  type AdminNotificationItem,
  type StaffRole,
} from "../../components/layouts/admin-shell"

export const dynamic = "force-dynamic"
export const revalidate = 0

function sanitizeAdminHref(rawLink: unknown): string {
  const clean = String(rawLink || "").trim()
  if (clean.startsWith("/") && !clean.startsWith("//") && !clean.startsWith("/\\")) {
    return clean
  }
  return "/admin/properties"
}

function AdminAuthRequiredScreen({
  dir,
  title,
  desc,
  email,
  staffLoginBtn,
  backHomeBtn,
}: {
  dir: "rtl" | "ltr"
  title: string
  desc: string
  email?: string | null
  staffLoginBtn: string
  backHomeBtn: string
}) {
  return (
    <main
      dir={dir}
      className="flex min-h-screen items-center justify-center bg-[#0a1122] px-4 py-12 text-white"
    >
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#121d33] p-8 text-center shadow-2xl">
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-red-500/15 text-red-400">
          <ShieldAlert className="size-8" />
        </span>
        <h1 className="mt-5 text-2xl font-extrabold text-white">{title}</h1>
        <p className="mt-2.5 text-xs leading-relaxed text-gray-300 sm:text-sm">
          {desc}
          {email ? (
            <>
              <br />
              <span
                dir="ltr"
                className="mt-1 inline-block font-mono text-emerald-300"
              >
                {email}
              </span>
            </>
          ) : null}
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <a
            href="/login?next=/admin"
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#007a5a] px-5 text-xs font-bold text-white transition hover:bg-[#006248]"
          >
            <LogIn className="size-4" />
            <span>{staffLoginBtn}</span>
          </a>
          <a
            href="/"
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 text-xs font-bold text-white transition hover:bg-white/10"
          >
            <Home className="size-4" />
            <span>{backHomeBtn}</span>
          </a>
        </div>
      </div>
    </main>
  )
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { dict, dir } = await getServerI18n()
  const t = dict.admin.accessDenied
  const shellDict = dict.admin.shell

  let user: any = null
  let supabase: any = null

  try {
    const cookieStore = await cookies()
    const rawSession = cookieStore.get("user_session")?.value
    const candidateUserId = extractUserIdFromCookie(rawSession)

    if (!rawSession || !candidateUserId) {
      return (
        <AdminAuthRequiredScreen
          dir={dir}
          title={t.loginRequiredTitle}
          desc={t.loginRequiredDesc}
          staffLoginBtn={t.staffLoginBtn}
          backHomeBtn={t.backHomeBtn}
        />
      )
    }

    supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
      }
    )

    const { data: fetchedUser } = await supabase
      .from("users")
      .select("id, name, email, role, status, password_hash")
      .eq("id", candidateUserId)
      .maybeSingle()

    user = fetchedUser

    if (!user) {
      return (
        <AdminAuthRequiredScreen
          dir={dir}
          title={t.loginRequiredTitle}
          desc={t.loginRequiredDesc}
          staffLoginBtn={t.staffLoginBtn}
          backHomeBtn={t.backHomeBtn}
        />
      )
    }

    const sessionCheck = parseAndVerifySessionCookie(
      rawSession,
      user.password_hash
    )
    if (!sessionCheck.valid) {
      return (
        <AdminAuthRequiredScreen
          dir={dir}
          title={t.loginRequiredTitle}
          desc={t.loginRequiredDesc}
          staffLoginBtn={t.staffLoginBtn}
          backHomeBtn={t.backHomeBtn}
        />
      )
    }
  } catch (err) {
    console.error("Auth check error in AdminLayout:", err)
    return (
      <AdminAuthRequiredScreen
        dir={dir}
        title={t.loginRequiredTitle}
        desc={t.loginRequiredDesc}
        staffLoginBtn={t.staffLoginBtn}
        backHomeBtn={t.backHomeBtn}
      />
    )
  }

  const cleanRole = String(user.role || "user")
    .replace(/[\r\n\s]+/g, "")
    .toLowerCase()
  const cleanStatus = String(user.status || "active")
    .replace(/[\r\n\s]+/g, "")
    .toLowerCase()

  const isAuthorizedStaff =
    (cleanRole === "owner" ||
      cleanRole === "admin" ||
      cleanRole === "moderator" ||
      cleanRole === "sales") &&
    cleanStatus !== "suspended" &&
    cleanStatus !== "deletion_pending"

  if (!isAuthorizedStaff) {
    return (
      <AdminAuthRequiredScreen
        dir={dir}
        title={t.title}
        desc={t.desc}
        email={user.email}
        staffLoginBtn={t.staffLoginBtn}
        backHomeBtn={t.backHomeBtn}
      />
    )
  }

  const adminName = user.name || shellDict.defaultAdminName
  const staffRole: StaffRole =
    cleanRole === "owner"
      ? "OWNER"
      : cleanRole === "admin"
        ? "ADMIN"
        : cleanRole === "moderator"
          ? "MODERATOR"
          : "SALES"

  let notifications: AdminNotificationItem[] = []
  let unreadCount = 0

  try {
    const { data: dbNotifs } = await supabase
      .from("notifications")
      .select("id, title, message, link, type, is_read, created_at")
      .is("user_id", null)
      .neq("title", "__GLOBAL_SITE_CONFIG__")
      .order("created_at", { ascending: false })
      .limit(30)

    if (dbNotifs && dbNotifs.length > 0) {
      notifications = dbNotifs.map((n: any) => {
        const rawType = String(n.type || "property")
        const mappedType: "property" | "lead" | "investor" =
          rawType === "lead" || rawType === "property_match"
            ? "lead"
            : rawType === "investor"
              ? "investor"
              : "property"

        return {
          id: String(n.id),
          title: String(n.title || ""),
          subtitle: String(n.message || ""),
          href: sanitizeAdminHref(n.link),
          type: mappedType,
          isRead: Boolean(n.is_read),
          createdAt: n.created_at
            ? new Date(n.created_at).toLocaleDateString("en-GB")
            : shellDict.nowLabel,
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