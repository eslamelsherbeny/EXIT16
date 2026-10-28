import { Suspense } from "react"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { getUsersVerificationMapAction } from "@/actions/submit-forms"
import { getServerI18n } from "@/lib/get-server-dictionary"
import LeadsClientTable, {
  type BuyerLead,
  type LinkedUnitSummary,
} from "./leads-table"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function LeadsPage() {
  const cookieStore = await cookies()
  const { dict, dir } = await getServerI18n()
  const t = dict.admin?.leadsAdmin

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
    }
  )

  const [{ data: leads, error }, { data: units }, { data: offersData }] =
    await Promise.all([
      supabase
        .from("buy_requests")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("sell_requests")
        .select("*")
        .neq("status", "deleted_by_seller"),
      supabase
        .from("property_offers")
        .select("*")
        .order("updated_at", { ascending: false }),
    ])

  if (error) {
    return (
      <div dir={dir} className="mx-auto max-w-7xl text-start">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm font-bold text-red-700">
          {t?.loadError}
        </div>
      </div>
    )
  }

  const leadsList = (leads ?? []) as BuyerLead[]
  const buyerUserIds = Array.from(
    new Set(leadsList.map((l) => l.user_id).filter(Boolean) as string[])
  )
  const verificationMap = await getUsersVerificationMapAction(buyerUserIds)

  const normalizedUnits = ((units ?? []) as any[]).map((u) => {
    const meta =
      u.documents && typeof pMeta(u) === "object" ? pMeta(u) : {}
    return {
      ...u,
      area: u.area || meta.area || null,
      unit_type: u.unit_type || meta.unit_type || null,
      rooms: u.rooms ?? meta.rooms ?? null,
      delivery_status: u.delivery_status || meta.delivery_status || null,
      installment_amount:
        u.installment_amount ?? meta.installment_amount ?? null,
      installment_frequency:
        u.installment_frequency || meta.installment_frequency || null,
    } as LinkedUnitSummary
  })

  return (
    <div className="mx-auto max-w-7xl">
      <Suspense fallback={null}>
        <LeadsClientTable
          leads={leadsList}
          units={normalizedUnits}
          offers={offersData ?? []}
          verificationMap={verificationMap}
        />
      </Suspense>
    </div>
  )
}

function pMeta(u: any) {
  return u?.documents && typeof u.documents === "object"
    ? u.documents.__unit_meta || {}
    : {}
}
