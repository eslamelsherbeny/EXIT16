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

  return (
    <div className="mx-auto max-w-7xl">
      <LeadsClientTable
        leads={(leads ?? []) as BuyerLead[]}
        units={(units ?? []) as LinkedUnitSummary[]}
        offers={offersData ?? []}
      />
    </div>
  )
}