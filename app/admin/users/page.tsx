import { Ban, CheckCircle2, MoreHorizontal } from "lucide-react"
import { AdminMobileNav } from "../layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const users = [
  { name: "محمد أحمد", email: "mohamed@example.com", phone: "010 1234 5678", role: "بائع", joined: "٢٥ يونيو ٢٠٢٥", status: "نشط" },
  { name: "سارة علي", email: "sara@example.com", phone: "011 9876 5432", role: "مشتري", joined: "٢٤ يونيو ٢٠٢٥", status: "نشط" },
  { name: "عمر حسن", email: "omar@example.com", phone: "012 5555 9012", role: "مستثمر", joined: "٢٣ يونيو ٢٠٢٥", status: "موقوف" },
]

export default function UsersPage() {
  return <div className="mx-auto max-w-7xl"><AdminMobileNav /><div className="mb-6"><p className="text-sm font-semibold text-primary">المجتمع</p><h2 className="mt-2 text-3xl font-bold">المستخدمين</h2><p className="mt-2 text-sm text-muted-foreground">راجع الحسابات المسجلة وحافظ على جودة مجتمع دارك.</p></div><Card className="rounded-xl shadow-sm"><CardHeader className="border-b"><CardTitle>كل المستخدمين</CardTitle><CardDescription>إدارة الأدوار وحالة الوصول للحسابات.</CardDescription></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-right text-sm"><thead className="bg-muted/40 text-xs text-muted-foreground"><tr>{["الاسم", "البريد الإلكتروني", "رقم الهاتف", "الدور", "تاريخ الانضمام", "الحالة", "الإجراء"].map((head) => <th key={head} className="px-5 py-4 font-semibold">{head}</th>)}</tr></thead><tbody>{users.map((user) => <tr key={user.email} className="border-t transition-colors hover:bg-muted/20"><td className="px-5 py-5 font-semibold">{user.name}</td><td className="px-5 py-5 text-muted-foreground">{user.email}</td><td className="px-5 py-5 text-muted-foreground">{user.phone}</td><td className="px-5 py-5"><Badge variant="outline">{user.role}</Badge></td><td className="px-5 py-5 text-muted-foreground">{user.joined}</td><td className="px-5 py-5"><Badge className={user.status === "نشط" ? "bg-teal-600 text-white" : "bg-destructive text-white"}>{user.status === "نشط" ? <CheckCircle2 data-icon="inline-start" /> : <Ban data-icon="inline-start" />}{user.status}</Badge></td><td className="px-5 py-5"><Button size="sm" variant="outline" className="rounded-lg text-destructive hover:bg-destructive/10"><MoreHorizontal data-icon="inline-start" />{user.status === "نشط" ? "إيقاف الحساب" : "رفع الإيقاف"}</Button></td></tr>)}</tbody></table></div></CardContent></Card></div>
}
