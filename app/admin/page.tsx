import Link from "next/link"
import { ArrowLeft, Building2, CircleDollarSign, Clock3, Users } from "lucide-react"
import { AdminMobileNav } from "./layout"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const pending = [
  ["PR-1024", "مدينتي - شقة ١٦٥م", "محمد أحمد", "اليوم، ١٠:٤٥ ص"],
  ["PR-1023", "الرحاب - فيلا مستقلة", "سارة علي", "اليوم، ٠٩:٢٠ ص"],
  ["PR-1022", "بالم هيلز - تاون هاوس", "عمر حسن", "أمس، ٠٦:١٥ م"],
]
const kpis = [{ label: "إجمالي العقارات", value: "٣٤٨", note: "+٨.٢٪ هذا الشهر", icon: Building2 }, { label: "طلبات بانتظار الموافقة", value: "٢٤", note: "تحتاج مراجعتك", icon: Clock3 }, { label: "المشترين المحتملين", value: "١,٢٨٤", note: "+١٢.٥٪ هذا الشهر", icon: Users }, { label: "العمولات المتوقعة", value: "٢.٤م ج.م", note: "+١٠.٢٪ هذا الشهر", icon: CircleDollarSign }]

export default function AdminPage() {
  return <div className="mx-auto max-w-7xl"><AdminMobileNav /><div className="mb-8"><p className="text-sm font-semibold text-primary">نظرة عامة</p><h2 className="mt-2 text-3xl font-bold">لوحة القيادة</h2><p className="mt-2 text-sm text-muted-foreground">تابع العقارات وطلبات الشراء واعتمد الفرص الجديدة من مكان واحد.</p></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{kpis.map(({ label, value, note, icon: Icon }, index) => <Card key={label} className={index === 1 ? "border-teal-200 bg-teal-50" : "bg-background"}><CardContent className="flex items-start justify-between p-5"><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-3 text-3xl font-bold">{value}</p><p className={index === 1 ? "mt-2 text-xs font-semibold text-teal-700" : "mt-2 text-xs font-semibold text-primary"}>{note}</p></div><span className="rounded-xl bg-muted p-3 text-primary"><Icon aria-hidden="true" /></span></CardContent></Card>)}</div><Card className="mt-7"><CardHeader className="flex flex-row items-center justify-between border-b"><div><CardTitle>العقارات بانتظار الموافقة</CardTitle><CardDescription className="mt-1">آخر الطلبات التي تحتاج إلى مراجعة ونشر.</CardDescription></div><Link href="/admin/properties" className="flex items-center gap-1 text-sm font-semibold text-primary">عرض الكل <ArrowLeft aria-hidden="true" /></Link></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full min-w-[640px] text-right text-sm"><thead className="bg-muted/40 text-xs text-muted-foreground"><tr>{["الكود", "العقار", "البائع", "تاريخ الطلب"].map((head) => <th key={head} className="px-6 py-4 font-semibold">{head}</th>)}<th className="px-6 py-4">الحالة</th></tr></thead><tbody>{pending.map((row) => <tr key={row[0]} className="border-t"><td className="px-6 py-4 font-semibold">{row[0]}</td>{row.slice(1).map((cell) => <td key={cell} className="px-6 py-4 text-muted-foreground">{cell}</td>)}<td className="px-6 py-4"><Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">في انتظار المراجعة</Badge></td></tr>)}</tbody></table></div></CardContent></Card></div>
}


// no-op
