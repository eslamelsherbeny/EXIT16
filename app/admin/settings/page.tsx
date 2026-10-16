import { AdminMobileNav } from "../layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SettingsPage() {
  return <div className="mx-auto max-w-7xl"><AdminMobileNav /><div className="mb-6"><p className="text-sm font-semibold text-primary">النظام</p><h2 className="mt-2 text-3xl font-bold">الإعدادات</h2><p className="mt-2 text-sm text-muted-foreground">إدارة إعدادات لوحة التحكم والمنصة.</p></div><Card className="max-w-3xl rounded-xl shadow-sm"><CardHeader><CardTitle>إعدادات المنصة</CardTitle><CardDescription>هذه الإعدادات متاحة لمدير النظام فقط.</CardDescription></CardHeader><CardContent><div className="rounded-xl border bg-muted/30 p-5 text-sm leading-7 text-muted-foreground">سيتم تفعيل إعدادات الإشعارات والصلاحيات المتقدمة في المرحلة التالية.</div></CardContent></Card></div>
}
