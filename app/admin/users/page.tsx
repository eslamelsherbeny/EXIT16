import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerClient } from "@supabase/ssr"
import { getUsersVerificationMapAction } from "@/actions/submit-forms"
import { resolveOwnerUserIds } from "@/lib/admin-auth-helpers"
import {
  extractUserIdFromCookie,
  parseAndVerifySessionCookie,
} from "@/lib/session-security"
import UsersClientTable, { type AdminUserRow } from "./users-table"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function UsersPage() {
  const cookieStore = await cookies()
  const rawSession = cookieStore.get("user_session")?.value
  const candidateId = extractUserIdFromCookie(rawSession)

  if (!rawSession || !candidateId) {
    redirect("/login?next=/admin/users")
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
    }
  )

  const { data: currentStaff } = await supabase
    .from("users")
    .select("id, email, role, status, password_hash")
    .eq("id", candidateId)
    .maybeSingle()

  if (
    !currentStaff ||
    currentStaff.status === "suspended" ||
    !parseAndVerifySessionCookie(rawSession, currentStaff.password_hash).valid
  ) {
    redirect("/login?next=/admin/users")
  }

  const role = String(currentStaff.role || "user").trim().toLowerCase()
  if (role !== "admin" && role !== "owner") {
    redirect("/admin/leads")
  }

  // سحب الأعمدة المطلوبة فقط بدون سحب password_hash لجميع المستخدمين
  const [
    { data: usersData },
    { data: sellsData },
    { data: buysData },
    ownerIdsSet,
  ] = await Promise.all([
    supabase
      .from("users")
      .select(
        "id, name, email, phone, role, status, created_at, is_verified, otp_code"
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("sell_requests")
      .select("user_id, status")
      .not("status", "in", '("deleted_by_seller","draft_unverified")'),
    supabase.from("buy_requests").select("user_id"),
    resolveOwnerUserIds(supabase),
  ])

  const allUsers = usersData || []
  const allUserIds = allUsers.map((u: any) => String(u.id))
  const verificationMap = await getUsersVerificationMapAction(allUserIds)

  const sellCounts: Record<string, number> = {}
  const buyCounts: Record<string, number> = {}

  ;(sellsData || [])
    .filter(
      (s: any) =>
        s.status !== "deleted_by_seller" && s.status !== "draft_unverified"
    )
    .forEach((s: any) => {
      if (s.user_id) sellCounts[s.user_id] = (sellCounts[s.user_id] || 0) + 1
    })

  ;(buysData || []).forEach((b: any) => {
    if (b.user_id) buyCounts[b.user_id] = (buyCounts[b.user_id] || 0) + 1
  })

  const rows: AdminUserRow[] = allUsers.map((u: any) => {
    const vInfo = verificationMap[u.id] || {
      emailVerified: Boolean(u.is_verified),
      phoneVerified: String(u.otp_code || "").includes("PHONE_OK"),
    }

    const isOwner = ownerIdsSet.has(String(u.id))

    return {
      id: u.id,
      name: u.name || "—",
      email: u.email || "—",
      phone: u.phone || "—",
      role: u.role || "user",
      status: u.status || "active",
      created_at: u.created_at || new Date().toISOString(),
      sellCount: sellCounts[u.id] || 0,
      buyCount: buyCounts[u.id] || 0,
      emailVerified: vInfo.emailVerified,
      phoneVerified: vInfo.phoneVerified,
      isOwnerAdmin: isOwner,
    }
  })

  return (
    <div className="mx-auto max-w-7xl">
      <UsersClientTable
        users={rows}
        currentAdminId={String(currentStaff.id)}
        isCurrentUserOwner={ownerIdsSet.has(String(currentStaff.id))}
      />
    </div>
  )
}