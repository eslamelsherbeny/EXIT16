import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import PropertiesTable, {
  type SellRequest,
} from "../properties/properties-table"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function AdminPromotionsPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
    }
  )

  const { data, error } = await supabase
    .from("sell_requests")
    .select("*")
    .neq("status", "deleted_by_seller")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })

  const properties = (data ?? []) as SellRequest[]

  if (error) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-xs font-bold text-red-700">
          تعذر تحميل بيانات الإعلانات.
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl">
      <PropertiesTable properties={properties} mode="promotions" />
    </div>
  )
}