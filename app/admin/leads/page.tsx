import { MessageCircle } from "lucide-react"
import { AdminMobileNav } from "../layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const leads = [
  { name: "سارة علي", budget: "من ٣ إلى ٥ مليون ج.م", areas: "الرحاب، مدينتي", date: "٢٥ يونيو ٢٠٢٥" },
  { name: "كريم عادل", budget: "من ٥ إلى ٨ مليون ج.م", areas: "التجمع الخامس", date: "٢٤ يونيو ٢٠٢٥" },
  { name: "نور خالد", budget: "حتى ٣ مليون ج.م", areas: "العاصمة الإدارية", date: "٢٣ يونيو ٢٠٢٥" },
]

export default function LeadsPage() {
  return <div className="mx-auto max-w-7xl"><AdminMobileNav /><div className="mb-6"><p className="text-sm font-semibold text-primary">المشترين</p><h2 className="mt-2 text-3xl font-bold">طلبات الشراء</h2><p className="mt-2 text-sm text-muted-foreground">تابع العملاء المحتملين وساعدهم في الوصول إلى الوحدة المناسبة.</p></div><Card><CardHeader className="border-b"><CardTitle>طلبات المشترين</CardTitle><CardDescription>بيانات التواصل متاحة لفريق الوساطة فقط.</CardDescription></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-right text-sm"><thead className="bg-muted/40 text-xs text-muted-foreground"><tr>{["اسم المشتري", "الميزانية (الكاش المتاح)", "المناطق المطلوبة", "تاريخ الطلب", "الإجراء"].map((head) => <th key={head} className="px-6 py-4 font-semibold">{head}</th>)}</tr></thead><tbody>{leads.map((lead) => <tr key={lead.name} className="border-t hover:bg-muted/20"><td className="px-6 py-5 font-semibold">{lead.name}</td><td className="px-6 py-5">{lead.budget}</td><td className="px-6 py-5 text-muted-foreground">{lead.areas}</td><td className="px-6 py-5 text-muted-foreground">{lead.date}</td><td className="px-6 py-5"><a href="https://wa.me/201012345678" className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"><MessageCircle aria-hidden="true" />واتساب</a></td></tr>)}</tbody></table></div></CardContent></Card></div>
}


// no-op
