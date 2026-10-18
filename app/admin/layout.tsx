import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import AdminShell, { type AdminNotificationItem } from "./admin-shell"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let adminName = "مدير النظام"
  let adminRole = "ADMIN"
  const notifications: AdminNotificationItem[] = []

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
      if (user?.role === "moderator") adminRole = "MODERATOR"
    }

    // جلب أحدث الطلبات المعلقة لعرضها في جرس الإشعارات
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

    ;(pendingProps || []).forEach((p) => {
      notifications.push({
        id: `prop-${p.id}`,
        title: `عقار بانتظار المراجعة: ${p.project_name || "وحدة جديدة"}`,
        subtitle: `البائع: ${p.name} · ${p.area || "—"}`,
        href: "/admin/properties",
        type: "property",
        createdAt: p.created_at
          ? new Date(p.created_at).toLocaleDateString("ar-EG")
          : "الآن",
      })
    })

    ;(newLeads || []).forEach((l) => {
      const cash = Number(l.available_cash || l.budget || 0).toLocaleString("en-US")
      notifications.push({
        id: `lead-${l.id}`,
        title: `طلب شراء جديد: ${l.name}`,
        subtitle: `الكاش المتاح: ${cash} ج.م`,
        href: "/admin/leads",
        type: "lead",
        createdAt: l.created_at
          ? new Date(l.created_at).toLocaleDateString("ar-EG")
          : "الآن",
      })
    })

    ;(newInvestors || []).forEach((inv) => {
      notifications.push({
        id: `inv-${inv.id}`,
        title: `طلب مستثمر جديد: ${inv.name}`,
        subtitle: `المبلغ: ${inv.investment_range || "غير محدد"}`,
        href: "/admin/investors",
        type: "investor",
        createdAt: inv.created_at
          ? new Date(inv.created_at).toLocaleDateString("ar-EG")
          : "الآن",
      })
    })
  } catch (error) {
    console.error("Supabase Error in AdminLayout:", error)
  }

  return (
    <AdminShell
      adminName={adminName}
      adminRole={adminRole}
      notifications={notifications}
    >
      {children}
    </AdminShell>
  )
}