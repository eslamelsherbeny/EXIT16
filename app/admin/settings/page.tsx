import Link from "next/link"
import { CheckCircle2, Database, Mail, ShieldCheck, Smartphone } from "lucide-react"
import { AdminMobileNav } from "../layout"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const dynamic = "force-dynamic"

export default function SettingsPage() {
  const hasSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  const hasEmail = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS)

  return (
    <div className="mx-auto max-w-7xl">
      <AdminMobileNav />

      <div className="mb-6">
        <p className="text-xs font-extrabold text-[#105C50]">إعدادات النظام</p>
        <h2 className="mt-1 text-2xl font-extrabold text-[#0a1122] sm:text-3xl">
          الإعدادات وحالة الربط
        </h2>
        <p className="mt-1 text-xs text-gray-500 sm:text-sm">
          راقب حالة اتصال قاعدة البيانات وخدمة البريد الإلكتروني وصلاحيات الإدارة.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="rounded-2xl border-gray-200/80 bg-white shadow-sm">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="flex items-center gap-2 text-base font-extrabold">
              <Database className="size-4 text-[#105C50]" />
              <span>حالة الربط التقني (Environment)</span>
            </CardTitle>
            <CardDescription className="text-xs">
              فحص تلقائي لمتغيرات البيئة على السيرفر.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-5 text-xs">
            <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-3.5">
              <div>
                <div className="font-bold text-[#0a1122]">
                  قاعدة بيانات Supabase
                </div>
                <div className="mt-0.5 text-gray-500">
                  حفظ العقارات، طلبات الشراء، والمستخدمين
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-bold ${
                  hasSupabase
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-red-100 text-red-700"
                }`}
              >
                <CheckCircle2 className="size-3.5" />
                {hasSupabase ? "متصل بنجاح" : "غير متصل"}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-3.5">
              <div>
                <div className="font-bold text-[#0a1122]">
                  خدمة رسائل البريد (Nodemailer / Gmail)
                </div>
                <div className="mt-0.5 text-gray-500">
                  إرسال أكواد OTP وإشعارات قبول العقارات
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-bold ${
                  hasEmail
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                <Mail className="size-3.5" />
                {hasEmail ? "مفعّل" : "يحتاج إعداد EMAIL_USER"}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-3.5">
              <div>
                <div className="font-bold text-[#0a1122]">
                  رقم واتساب خدمة العملاء الرسمي
                </div>
                <div className="mt-0.5 text-gray-500">
                  المستخدم في بطاقة مسؤول حالتك للبائع والمشتري
                </div>
              </div>
              <span
                dir="ltr"
                className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-3 py-1 font-bold text-[#105C50]"
              >
                <Smartphone className="size-3.5" />
                +20 101 859 5959
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 bg-white shadow-sm">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="flex items-center gap-2 text-base font-extrabold">
              <ShieldCheck className="size-4 text-[#105C50]" />
              <span>قواعد عمل المنصة والصلاحيات</span>
            </CardTitle>
            <CardDescription className="text-xs">
              الضوابط المعتمدة في دورة حياة الطلبات.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-5 text-xs leading-relaxed text-gray-600">
            <div className="rounded-xl border border-gray-100 p-3.5">
              <strong className="text-[#0a1122]">١. حماية بيانات البائعين:</strong>{" "}
              لا تظهر أرقام هواتف البائعين في صفحات الفرص العامة، وتتم جميع العروض عبر وسطاء المنصة.
            </div>
            <div className="rounded-xl border border-gray-100 p-3.5">
              <strong className="text-[#0a1122]">
                ٢. إشعارات الحالة التلقائية:
              </strong>{" "}
              بمجرد تحويل حالة العقار إلى (معتمد، يوجد عرض، نقل تعاقد، أو مباع) يتم إرسال بريد إلكتروني فوري للبائع.
            </div>
            <div className="pt-2">
              <Link
                href="/admin/users"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-[#0a1122] px-5 text-xs font-bold text-white transition hover:bg-[#16223f]"
              >
                إدارة المديرين والمشرفين
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}