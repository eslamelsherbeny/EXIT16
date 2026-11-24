import { Suspense } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerClient } from "@supabase/ssr"
import {
  extractUserIdFromCookie,
  parseAndVerifySessionCookie,
} from "@/lib/session-security"
import { getServerI18n } from "@/lib/get-server-dictionary"
import type { SellRequest } from "../properties/properties-helpers"
import { PromotionsManager, type BoostRequestRow } from "./promotions-manager"

export const dynamic = "force-dynamic"
export const revalidate = 0

function normalizeAdminStatus(raw?: string | null): string {
  const clean = String(raw || "pending").trim().toLowerCase()
  if (clean === "approved" || clean === "published") return "active"
  return clean
}

export default async function AdminPromotionsPage() {
  const { dict, dir } = await getServerI18n()
  const cookieStore = await cookies()
  const rawSession = cookieStore.get("user_session")?.value
  const candidateId = extractUserIdFromCookie(rawSession)

  if (!rawSession || !candidateId) {
    redirect("/login?next=/admin/promotions")
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
    .select("role, status, password_hash")
    .eq("id", candidateId)
    .maybeSingle()

  if (
    !currentStaff ||
    currentStaff.status === "suspended" ||
    !parseAndVerifySessionCookie(rawSession, currentStaff.password_hash).valid
  ) {
    redirect("/login?expired=1")
  }

  const staffRole = String(currentStaff.role || "user").trim().toLowerCase()
  if (
    staffRole !== "owner" &&
    staffRole !== "admin" &&
    staffRole !== "moderator"
  ) {
    redirect("/account")
  }

  const [propsRes, boostRes] = await Promise.all([
    supabase
      .from("sell_requests")
      .select("*")
      .neq("status", "deleted_by_seller")
      .neq("status", "draft_unverified")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("boost_requests")
      .select("*")
      .neq("status", "awaiting_payment")
      .order("created_at", { ascending: false }),
  ])

  if (propsRes.error) {
    return (
      <div dir={dir} className="mx-auto max-w-7xl">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-xs font-bold text-red-700">
          {dict.admin?.promotions?.loadError ||
            dict.admin?.propertiesAdmin?.loadError}
        </div>
      </div>
    )
  }

  const properties = ((propsRes.data ?? []) as any[]).map((p) => {
    const meta =
      p.documents && typeof p.documents === "object"
        ? p.documents.__unit_meta || {}
        : {}
    return {
      ...p,
      code: p.code || meta.code || null,
      status: normalizeAdminStatus(p.status),
      project_name: p.project_name ? String(p.project_name).trim() : null,
      area: p.area || meta.area || null,
      unit_type: p.unit_type || meta.unit_type || null,
      size: p.size ?? meta.size ?? null,
    } as SellRequest
  })

  const boostRequests = ((boostRes.data ?? []) as any[]).map(
    (b) =>
      ({
        id: String(b.id),
        unit_id: b.unit_id ? String(b.unit_id) : null,
        unit_code: b.unit_code || null,
        user_id: b.user_id ? String(b.user_id) : null,
        package_tier: String(b.package_tier || "SUPER VIP"),
        duration_days: Number(b.duration_days) || 7,
        amount_gel: Number(b.amount_gel) || 0,
        payment_method: String(b.payment_method || "bank_transfer"),
        status: String(b.status || "pending_admin_approval"),
        order_ref: b.order_ref || null,
        admin_note: b.admin_note || null,
        created_at: b.created_at,
        approved_at: b.approved_at || null,
        rejected_at: b.rejected_at || null,
      }) as BoostRequestRow
  )

  return (
    <div className="mx-auto max-w-7xl">
      <Suspense fallback={null}>
        <PromotionsManager
          properties={properties}
          boostRequests={boostRequests}
        />
      </Suspense>
    </div>
  )
}