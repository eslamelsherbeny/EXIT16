import { CalendarPlus, CheckCircle2, PhoneCall } from "lucide-react"
import { AdminMobileNav } from "../layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const investors = [
  { name: "عمر حسن", company: "Hassan Capital", category: "صناديق عقارية", amount: "١٠ مليون ج.م", status: "جديد" },
  { name: "نور خالد", company: "Nour Holdings", category: "وحدات سكنية", amount: "٥ مليون ج.م", status: "تم التواصل" },
  { name: "كريم عادل", company: "Kamel Ventures", category: "مشروعات تجارية", amount: "٢٥ مليون ج.م", status: "اجتماع محدد" },
]

export default function InvestorsPage() {
  return <div className="mx-auto max-w-7xl"><AdminMobileNav /><div className="mb-6"><p className="text-sm font-semibold text-primary">الشراكات</p><h2 className="mt-2 text-3xl font-bold">طلبات المستثمرين</h2><p className="mt-2 text-sm text-muted-foreground">حوّل طلبات الاستثمار إلى شراكات طويلة المدى.</p></div><Card className="rounded-xl shadow-sm"><CardHeader className="border-b"><CardTitle>كل الطلبات</CardTitle><CardDescription>تابع حالة كل مستثمر والخطوة التالية معه.</CardDescription></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-right text-sm"><thead className="bg-muted/40 text-xs text-muted-foreground"><tr>{["الاسم", "الشركة", "فئة الاستثمار", "المبلغ المستهدف", "الحالة", "الإجراء"].map((head) => <th key={head} className="px-5 py-4 font-semibold">{head}</th>)}</tr></thead><tbody>{investors.map((investor) => <tr key={investor.name} className="border-t transition-colors hover:bg-muted/20"><td className="px-5 py-5 font-semibold">{investor.name}</td><td className="px-5 py-5 text-muted-foreground">{investor.company}</td><td className="px-5 py-5">{investor.category}</td><td className="px-5 py-5 font-semibold">{investor.amount}</td><td className="px-5 py-5"><Badge className={investor.status === "تم التواصل" ? "bg-teal-600 text-white" : "bg-secondary text-secondary-foreground"}>{investor.status}</Badge></td><td className="px-5 py-5"><div className="flex gap-2"><Button size="sm" className="rounded-lg bg-teal-600 text-white hover:bg-teal-700"><PhoneCall data-icon="inline-start" />تم التواصل</Button><Button size="sm" variant="outline" className="rounded-lg"><CalendarPlus data-icon="inline-start" />حدد اجتماع</Button></div></td></tr>)}</tbody></table></div></CardContent></Card></div>
}
