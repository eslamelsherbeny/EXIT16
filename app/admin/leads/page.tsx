import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { AdminMobileNav } from "../layout"
import LeadsClientTable, { type BuyerLead } from "./leads-table"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function LeadsPage() {
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
      <div className="mx-auto max-w-7xl">
        <AdminMobileNav />
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm font-bold text-red-700">
          تعذر تحميل طلبات الشراء.
        </div>
      </div>
    )
  }

  return <LeadsClientTable leads={(leads ?? []) as BuyerLead[]} />
}