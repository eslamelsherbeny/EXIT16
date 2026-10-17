import { MessageCircle } from "lucide-react"
import { AdminMobileNav } from "../layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

export default async function LeadsPage() {
  const supabase = await createClient()
  const { data: leads, error } = await supabase.from("buy_requests").select("*").order("created_at", { ascending: false })
  return <div className="mx-auto max-w-7xl"><AdminMobileNav /><div className="mb-6"><p className="text-sm font-semibold text-primary">المشترين</p><h2 className="mt-2 text-3xl font-bold">طلبات الشراء</h2><p className="mt-2 text-sm text-muted-foreground">تابع العملاء المحتملين وساعدهم في الوصول إلى الوحدة المناسبة.</p></div><Card><CardHeader className="border-b"><CardTitle>طلبات المشترين</CardTitle><CardDescription>بيانات التواصل متاحة لفريق الوساطة فقط.</CardDescription></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-right text-sm"><thead className="bg-muted/40 text-xs text-muted-foreground"><tr>{["اسم المشتري", "الميزانية (الكاش المتاح)", "المناطق المطلوبة", "تاريخ الطلب", "الإجراء"].map((head) => <th key={head} className="px-6 py-4 font-semibold">{head}</th>)}</tr></thead><tbody>{error ? <tr><td colSpan={5} className="px-6 py-8 text-center text-destructive">تعذر تحميل طلبات الشراء.</td></tr> : leads?.length ? leads.map((lead) => <tr key={lead.id} className="border-t hover:bg-muted/20"><td className="px-6 py-5 font-semibold">{lead.name}</td><td className="px-6 py-5">{lead.available_cash ?? "—"}</td><td className="px-6 py-5 text-muted-foreground">{Array.isArray(lead.preferred_areas) ? lead.preferred_areas.join("، ") : lead.preferred_areas ?? "—"}</td><td className="px-6 py-5 text-muted-foreground">{new Date(lead.created_at).toLocaleDateString("ar-EG")}</td><td className="px-6 py-5"><a href={`https://wa.me/${String(lead.phone).replace(/\D/g, "")}`} className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"><MessageCircle aria-hidden="true" />واتساب</a></td></tr>) : <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">لا توجد طلبات شراء حتى الآن.</td></tr>}</tbody></table></div></CardContent></Card></div>
}


// no-op
