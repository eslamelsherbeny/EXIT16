import { Suspense } from "react"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { getUsersVerificationMapAction } from "@/actions/submit-forms"
import { getServerI18n } from "@/lib/get-server-dictionary"
import { sanitizeGeorgiaProjectTitle } from "@/lib/offer-helpers"
import type { MatchableBuyer } from "@/lib/smart-matcher"
import PropertiesTable, { type SellRequest } from "./properties-table"

export const dynamic = "force-dynamic"
export const revalidate = 0

function normalizeAdminUnitStatus(rawStatus?: string | null): string {
  const clean = String(rawStatus || "pending").trim().toLowerCase()
  if (clean === "approved" || clean === "published") return "active"
  return clean
}

export default async function PropertiesPage() {
  const cookieStore = await cookies()
  const { dict, dir } = await getServerI18n()
  const t = dict.admin?.propertiesAdmin

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
    }
  )

  try {
    await supabase
      .from("sell_requests")
      .update({ status: "active" })
      .in("status", ["approved", "published"])

    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString()

    const { data: expiredUnits } = await supabase
      .from("sell_requests")
      .select("id")
      .eq("status", "deleted_by_seller")
      .lt("last_seller_edit_at", sevenDaysAgo)

    const expiredIds = (expiredUnits || []).map((u: any) => u.id)
    if (expiredIds.length > 0) {
      await supabase
        .from("property_offers")
        .delete()
        .in("property_id", expiredIds)

      await supabase
        .from("sell_requests")
        .delete()
        .in("id", expiredIds)
    }
  } catch {}

  const [{ data, error }, { data: leadsData }, { data: offersData }] =
    await Promise.all([
      supabase
        .from("sell_requests")
        .select("*")
        .neq("status", "draft_unverified")
        .order("created_at", { ascending: false }),
      supabase
        .from("buy_requests")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("property_offers")
        .select("*")
        .order("updated_at", { ascending: false }),
    ])

  const properties = ((data ?? []) as any[])
    .filter((p) => String(p.status || "").toLowerCase() !== "draft_unverified")
    .map((p) => {
      const meta =
        p.documents && typeof p.documents === "object"
          ? p.documents.__unit_meta || {}
          : {}
      return {
        ...p,
        status: normalizeAdminUnitStatus(p.status),
        project_name: sanitizeGeorgiaProjectTitle(p.project_name),
        developer_name: p.developer_name || meta.developer_name || null,
        area: p.area || meta.area || null,
        exact_street: p.exact_street || meta.exact_street || null,
        house_number: p.house_number || meta.house_number || null,
        cadastral_code: p.cadastral_code || meta.cadastral_code || null,
        unit_type: p.unit_type || meta.unit_type || null,
        building_status: p.building_status || meta.building_status || null,
        size: p.size ?? meta.size ?? null,
        rooms: p.rooms ?? meta.rooms ?? null,
        bedrooms: p.bedrooms ?? meta.bedrooms ?? null,
        bathrooms: p.bathrooms ?? meta.bathrooms ?? null,
        floor_number: p.floor_number ?? meta.floor_number ?? null,
        total_floors: p.total_floors ?? meta.total_floors ?? null,
        finishing: p.finishing || meta.finishing || null,
        delivery_status: p.delivery_status || meta.delivery_status || null,
        delivery_month: p.delivery_month || meta.delivery_month || null,
        delivery_year: p.delivery_year ?? meta.delivery_year ?? null,
        installment_amount:
          p.installment_amount ?? meta.installment_amount ?? null,
        installment_frequency:
          p.installment_frequency || meta.installment_frequency || null,
        years_left: p.years_left ?? meta.years_left ?? null,
        contract_year: p.contract_year ?? meta.contract_year ?? null,
        contract_month: p.contract_month || meta.contract_month || null,
        video_url: p.video_url || meta.video_url || null,
        tour_3d_url: p.tour_3d_url || meta.tour_3d_url || null,
        allow_online_viewing: Boolean(
          p.allow_online_viewing ?? meta.allow_online_viewing ?? false
        ),
        features: Array.isArray(p.features)
          ? p.features
          : Array.isArray(meta.features)
            ? meta.features
            : [],
      } as SellRequest
    })

  const sellerUserIds = Array.from(
    new Set(properties.map((p) => p.user_id).filter(Boolean) as string[])
  )
  const verificationMap = await getUsersVerificationMapAction(sellerUserIds)

  const buyers = (leadsData ?? []) as MatchableBuyer[]
  const offers = offersData ?? []

  if (error) {
    return (
      <div dir={dir} className="mx-auto max-w-7xl text-start">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm font-bold text-red-700">
          {t?.loadError}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl">
      <Suspense fallback={null}>
        <PropertiesTable
          properties={properties}
          buyers={buyers}
          offers={offers}
          verificationMap={verificationMap}
        />
      </Suspense>
    </div>
  )
}