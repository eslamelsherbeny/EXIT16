import { Suspense } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerClient } from "@supabase/ssr"
import { getUsersVerificationMapAction } from "@/actions/submit-forms"
import { sanitizeGeorgiaProjectTitle } from "@/lib/offer-helpers"
import {
  extractUserIdFromCookie,
  parseAndVerifySessionCookie,
} from "@/lib/session-security"
import { getServerI18n } from "@/lib/get-server-dictionary"
import PropertiesTable, {
  type SellRequest,
} from "../properties/properties-table"

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
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
    staffRole !== "admin" &&
    staffRole !== "moderator" &&
    staffRole !== "sales"
  ) {
    redirect("/account")
  }

  const { data, error } = await supabase
    .from("sell_requests")
    .select("*")
    .neq("status", "deleted_by_seller")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })

  const properties = ((data ?? []) as any[]).map((p) => {
    const meta =
      p.documents && typeof p.documents === "object"
        ? p.documents.__unit_meta || {}
        : {}
    return {
      ...p,
      code: p.code || meta.code || null,
      status: normalizeAdminStatus(p.status),
      project_name: sanitizeGeorgiaProjectTitle(p.project_name),
      area: p.area || meta.area || null,
      unit_type: p.unit_type || meta.unit_type || null,
      size: p.size ?? meta.size ?? null,
    } as SellRequest
  })

  const sellerUserIds = Array.from(
    new Set(properties.map((p) => p.user_id).filter(Boolean) as string[])
  )
  const verificationMap = await getUsersVerificationMapAction(sellerUserIds)

  if (error) {
    return (
      <div dir={dir} className="mx-auto max-w-7xl">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-xs font-bold text-red-700">
          {dict.admin?.promotions?.loadError ||
            dict.admin?.propertiesAdmin?.loadError}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl">
      <Suspense fallback={null}>
        <PropertiesTable
          properties={properties}
          verificationMap={verificationMap}
          mode="promotions"
        />
      </Suspense>
    </div>
  )
}
