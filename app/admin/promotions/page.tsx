import { Suspense } from "react"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { getServerI18n } from "@/lib/get-server-dictionary"
import PropertiesTable, {
  type SellRequest,
} from "../properties/properties-table"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function AdminPromotionsPage() {
  const { dict, dir } = await getServerI18n()
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

  const properties = ((data ?? []) as any[]).map((p) => {
    const meta =
      p.documents && typeof p.documents === "object"
        ? p.documents.__unit_meta || {}
        : {}
    return {
      ...p,
      area: p.area || meta.area || null,
      unit_type: p.unit_type || meta.unit_type || null,
      size: p.size ?? meta.size ?? null,
    } as SellRequest
  })

  if (error) {
    return (
      <div dir={dir} className="mx-auto max-w-7xl">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-xs font-bold text-red-700">
          {dict.admin?.promotions?.loadError || dict.admin?.propertiesAdmin?.loadError}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl">
      <Suspense fallback={null}>
        <PropertiesTable properties={properties} mode="promotions" />
      </Suspense>
    </div>
  )
}