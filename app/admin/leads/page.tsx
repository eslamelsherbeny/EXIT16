import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { getServerI18n } from "@/lib/get-server-dictionary"
import LeadsClientTable, { type BuyerLead } from "./leads-table"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function LeadsPage() {
  const { dict, dir } = await getServerI18n()
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
    }
  )

  const { data: leads, error } = await supabase
    .from("buy_requests")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    return (
      <div dir={dir} className="mx-auto max-w-7xl">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-xs font-bold text-red-700">
          {dict.admin?.leads?.loadError || "تعذر تحميل طلبات الشراء."}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl">
      <LeadsClientTable leads={(leads ?? []) as BuyerLead[]} />
    </div>
  )
}
