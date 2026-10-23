import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { getServerI18n } from "@/lib/get-server-dictionary"
import LeadsClientTable, {
  type BuyerLead,
  type LinkedUnitSummary,
} from "./leads-table"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function LeadsPage() {
  const { dict, dir } = await getServerI18n()
  const adminDict = (dict?.admin as Record<string, any>) || {}
  const loadErrorText =
    adminDict.leadsAdmin?.loadError || adminDict.leads?.loadError || ""

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
    }
  )

  const [{ data: leads, error }, { data: unitsData }] = await Promise.all([
    supabase
      .from("buy_requests")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("sell_requests")
      .select(
        "id, project_name, area, unit_type, paid_amount, contract_price, installment_amount, name, phone, status, country_code, country"
      )
      .neq("status", "deleted_by_seller"),
  ])

  if (error) {
    return (
      <div dir={dir} className="mx-auto max-w-7xl text-start">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-xs font-bold text-red-700">
          {loadErrorText}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl">
      <LeadsClientTable
        leads={(leads ?? []) as BuyerLead[]}
        units={(unitsData ?? []) as LinkedUnitSummary[]}
      />
    </div>
  )
}