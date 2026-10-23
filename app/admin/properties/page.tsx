import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { getServerI18n } from "@/lib/get-server-dictionary"
import type { MatchableBuyer } from "@/lib/smart-matcher"
import PropertiesTable, { type SellRequest } from "./properties-table"

export const dynamic = "force-dynamic"
export const revalidate = 0

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
    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString()

    await supabase
      .from("sell_requests")
      .delete()
      .eq("status", "deleted_by_seller")
      .lt("last_seller_edit_at", sevenDaysAgo)
  } catch {}

  const [{ data, error }, { data: leadsData }, { data: offersData }] =
    await Promise.all([
      supabase
        .from("sell_requests")
        .select("*")
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

  const properties = (data ?? []) as SellRequest[]
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
      <PropertiesTable
        properties={properties}
        buyers={buyers}
        offers={offers}
      />
    </div>
  )
}