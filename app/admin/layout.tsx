import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import AdminShell, { type AdminNotificationItem } from "./admin-shell"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let adminName = "مدير النظام"
  let adminRole = "ADMIN"
  let notifications: AdminNotificationItem[] = []
  let unreadCount = 0

  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("user_session")?.value

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
      }
    )

    if (sessionId) {
      const { data: user } = await supabase
        .from("users")
        .select("name, role")
        .eq("id", sessionId)
        .maybeSingle()

      if (user?.name) adminName = user.name
      const cleanRole = String(user?.role || "admin")
        .replace(/[\r\n\s]+/g, "")
        .toLowerCase()
      if (cleanRole === "moderator") adminRole = "MODERATOR"
    }

    // جلب الإشعارات الحقيقية الخاصة بالإدارة (بدون أي كود توليد احتياطي)
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
            : "الآن",
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
      adminRole={adminRole}
      notifications={notifications}
      initialUnreadCount={unreadCount}
    >
      {children}
    </AdminShell>
  )
}