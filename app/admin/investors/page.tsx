import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { getServerI18n } from "@/lib/get-server-dictionary"
import InvestorsClientTable, { type InvestorRow } from "./investors-table"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function InvestorsPage() {
  const cookieStore = await cookies()
  const { dict, dir } = await getServerI18n()
  const t = dict.admin?.investorsAdmin

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
    }
  )

  const [
    { data: leadsData, error: leadsErr },
    { data: requestsData, error: reqErr },
  ] = await Promise.all([
    supabase
      .from("investor_leads")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("investor_requests")
      .select("*")
      .order("created_at", { ascending: false }),
  ])

  if (leadsErr && reqErr) {
    return (
      <div dir={dir} className="mx-auto max-w-7xl text-start">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm font-bold text-red-700">
          {t?.loadError || "تعذر تحميل طلبات المستثمرين."}
        </div>
      </div>
    )
  }

  const combinedMap = new Map<string, InvestorRow>()
  ;[...(leadsData || []), ...(requestsData || [])].forEach((row: any) => {
    if (!row?.id) return
    combinedMap.set(String(row.id), {
      ...row,
      preferred_sectors: Array.isArray(row.preferred_sectors)
        ? row.preferred_sectors
        : Array.isArray(row.sectors)
          ? row.sectors
          : [],
    })
  })

  const investors = Array.from(combinedMap.values())

  return (
    <div className="mx-auto max-w-7xl">
      <InvestorsClientTable investors={investors} />
    </div>
  )
}
