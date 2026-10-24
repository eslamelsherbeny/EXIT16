import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerClient } from "@supabase/ssr"
import { extractUserIdFromCookie } from "@/lib/session-security"
import UsersClientTable, { type AdminUserRow } from "./users-table"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function UsersPage() {
  const cookieStore = await cookies()
  const rawSession = cookieStore.get("user_session")?.value
  const candidateId = extractUserIdFromCookie(rawSession)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
    }
  )

  if (candidateId) {
    const { data: currentStaff } = await supabase
      .from("users")
      .select("role")
      .eq("id", candidateId)
      .maybeSingle()

    const role = String(currentStaff?.role || "user").trim().toLowerCase()
    // إذا كان مشرفاً أو مبيعات وحاول فتح رابط المستخدمين مباشرة، نحوله لصفحة الطلبات
    if (role !== "admin") {
      redirect("/admin/leads")
    }
  }

  const [{ data: usersData }, { data: sellsData }, { data: buysData }] =
    await Promise.all([
      supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("sell_requests").select("user_id"),
      supabase.from("buy_requests").select("user_id"),
    ])

  const sellCounts: Record<string, number> = {}
  const buyCounts: Record<string, number> = {}

  ;(sellsData || []).forEach((s) => {
    if (s.user_id) sellCounts[s.user_id] = (sellCounts[s.user_id] || 1)
  })
  ;(buysData || []).forEach((b) => {
    if (b.user_id) buyCounts[b.user_id] = (buyCounts[b.user_id] || 0) + 1
  })

  const rows: AdminUserRow[] = (usersData || []).map((u) => ({
    id: u.id,
    name: u.name || "—",
    email: u.email || "—",
    phone: u.phone || "—",
    role: u.role || "user",
    status: u.status || "active",
    created_at: u.created_at || new Date().toISOString(),
    sellCount: (sellsData || []).filter((s) => s.user_id === u.id).length,
    buyCount: buyCounts[u.id] || 0,
  }))

  return (
    <div className="mx-auto max-w-7xl">
      <UsersClientTable users={rows} />
    </div>
  )
}
