import { AdminMobileNav } from "../layout"
import { createClient } from "@/lib/supabase/server"
import PropertiesTable, { type SellRequest } from "./properties-table"

export default async function PropertiesPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.from("sell_requests").select("*").order("created_at", { ascending: false })
  const properties = (data ?? []) as SellRequest[]

  if (error) {
    return <div className="mx-auto max-w-7xl"><AdminMobileNav /><div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-destructive">تعذر تحميل طلبات البائعين.</div></div>
  }

  return <PropertiesTable properties={properties} />
}
