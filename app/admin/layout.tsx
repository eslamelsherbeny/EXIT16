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

    // 1. جلب الإشعارات المسجلة في جدول notifications
    let { data: dbNotifs, error: notifError } = await supabase
      .from("notifications")
      .select("*")
      .is("user_id", null)
      .order("created_at", { ascending: false })
      .limit(20)

    // 2. إذا كان جدول notifications فارغاً تماماً (أول مرة تشغيل)، نستورد الطلبات الحالية تلقائياً مرة واحدة
    if (!notifError && (!dbNotifs || dbNotifs.length === 0)) {
      const [{ data: pendingProps }, { data: newLeads }, { data: newInvestors }] =
        await Promise.all([
          supabase
            .from("sell_requests")
            .select("id, project_name, name, area, status, created_at")
            .or("status.is.null,status.eq.pending,status.eq.under_review")
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("buy_requests")
            .select("id, name, available_cash, budget, status, created_at")
            .or("status.is.null,status.eq.new")
            .order("created_at", { ascending: false })
            .limit(4),
          supabase
            .from("investor_leads")
            .select("id, name, investment_range, status, created_at")
            .or("status.is.null,status.eq.new")
            .order("created_at", { ascending: false })
            .limit(3),
        ])

      const seedRows: any[] = []

      ;(pendingProps || []).forEach((p) => {
        seedRows.push({
          user_id: null,
          title: `عقار بانتظار المراجعة: ${p.project_name || "وحدة جديدة"}`,
          message: `البائع: ${p.name || "عميل"} · ${p.area || "—"}`,
          type: "property",
          link: "/admin/properties",
          is_read: false,
          created_at: p.created_at || new Date().toISOString(),
        })
      })

      ;(newLeads || []).forEach((l) => {
        const cash = Number(l.available_cash || l.budget || 0).toLocaleString(
          "en-US"
        )
        seedRows.push({
          user_id: null,
          title: `طلب شراء جديد: ${l.name || "مشتري"}`,
          message: `الكاش المتاح: ${cash} ج.م`,
          type: "lead",
          link: "/admin/leads",
          is_read: false,
          created_at: l.created_at || new Date().toISOString(),
        })
      })

      ;(newInvestors || []).forEach((inv) => {
        seedRows.push({
          user_id: null,
          title: `طلب مستثمر جديد: ${inv.name || "مستثمر"}`,
          message: `المبلغ: ${inv.investment_range || "غير محدد"}`,
          type: "investor",
          link: "/admin/investors",
          is_read: false,
          created_at: inv.created_at || new Date().toISOString(),
        })
      })

      if (seedRows.length > 0) {
        const { data: inserted } = await supabase
          .from("notifications")
          .insert(seedRows)
          .select("*")
        if (inserted) {
          dbNotifs = inserted
        }
      }
    }

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