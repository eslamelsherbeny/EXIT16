import Link from "next/link"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import {
  ArrowLeft,
  Building2,
  CircleDollarSign,
  Clock3,
  MessageCircle,
  Phone,
  Users,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const dynamic = "force-dynamic"
export const revalidate = 0

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
    }
  )
}

const statusMap: Record<string, { label: string; className: string }> = {
  pending: {
    label: "في انتظار المراجعة",
    className: "bg-amber-100 text-amber-800",
  },
  under_review: {
    label: "جاري المراجعة",
    className: "bg-blue-100 text-blue-800",
  },
  active: { label: "معروضة في السوق", className: "bg-emerald-100 text-emerald-800" },
  offer_received: {
    label: "عندها عرض شراء",
    className: "bg-purple-100 text-purple-800",
  },
  transferring: {
    label: "جاري نقل التعاقد",
    className: "bg-indigo-100 text-indigo-800",
  },
  sold: { label: "تم البيع", className: "bg-teal-700 text-white" },
  rejected: { label: "مرفوضة", className: "bg-red-100 text-red-800" },
}

export default async function AdminPage() {
  const supabase = await getSupabase()

  const [
    { data: propertiesData },
    { data: leadsData },
    { data: usersData },
    { data: investorsData },
  ] = await Promise.all([
    supabase
      .from("sell_requests")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("buy_requests")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("users")
      .select("id, name, email, phone, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("investor_leads")
      .select("id, name, investment_range, created_at")
      .order("created_at", { ascending: false }),
  ])

  const properties = propertiesData || []
  const leads = leadsData || []
  const users = usersData || []
  const investors = investorsData || []

  const pendingProperties = properties.filter(
    (p) => !p.status || p.status === "pending" || p.status === "under_review"
  )
  const activeProperties = properties.filter((p) => p.status === "active")

  const totalPortfolioValue = properties.reduce(
    (sum, p) => sum + (Number(p.contract_price) || Number(p.paid_amount) || 0),
    0
  )
  const estimatedCommission = Math.round(totalPortfolioValue * 0.025)

  const kpis = [
    {
      label: "إجمالي العقارات",
      value: properties.length.toLocaleString("ar-EG"),
      note: `${activeProperties.length.toLocaleString("ar-EG")} منشور حالياً`,
      icon: Building2,
      href: "/admin/properties",
    },
    {
      label: "بانتظار المراجعة",
      value: pendingProperties.length.toLocaleString("ar-EG"),
      note:
        pendingProperties.length > 0
          ? "تحتاج مراجعتك"
          : "تمت مراجعة الكل",
      icon: Clock3,
      href: "/admin/properties?status=pending",
      highlight: pendingProperties.length > 0,
    },
    {
      label: "طلبات المشترين",
      value: leads.length.toLocaleString("ar-EG"),
      note: `${users.length.toLocaleString("ar-EG")} حساب مسجل`,
      icon: Users,
      href: "/admin/leads",
    },
    {
      label: "العمولات (٢.٥٪)",
      value:
        estimatedCommission > 0
          ? `${(estimatedCommission / 1_000_000).toFixed(2)}م ج.م`
          : "٠ ج.م",
      note: `${investors.length.toLocaleString("ar-EG")} طلب مستثمر`,
      icon: CircleDollarSign,
      href: "/admin/investors",
    },
  ]

  return (
    <div className="mx-auto max-w-7xl">
      {/* الهيدر العلوي للصفحة */}
      <div className="mb-6 flex flex-col justify-between gap-3 sm:mb-8 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-extrabold text-[#105C50]">نظرة عامة حية</p>
          <h2 className="mt-1 text-xl font-extrabold text-[#0a1122] sm:text-3xl">
            لوحة القيادة
          </h2>
          <p className="mt-1 text-xs text-gray-500 sm:text-sm">
            إحصائيات حقيقية مباشرة من قاعدة البيانات لمتابعة حركة البائعين والمشترين.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2.5">
          <Link
            href="/admin/properties"
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#105C50] px-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#0c483f] sm:px-4"
          >
            <Building2 className="size-4 shrink-0" />
            <span>العقارات ({properties.length})</span>
          </Link>
          <Link
            href="/admin/users"
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-[#0a1122] shadow-sm transition hover:bg-gray-50 sm:px-4"
          >
            <Users className="size-4 shrink-0" />
            <span>الفريق والصلاحيات</span>
          </Link>
        </div>
      </div>

      {/* بطاقات الإحصائيات: كارتين بجانب بعض على الموبايل، و4 على الديسكتوب */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {kpis.map(({ label, value, note, icon: Icon, href, highlight }) => (
          <Link
            key={label}
            href={href}
            className="block transition hover:-translate-y-0.5"
          >
            <Card
              className={
                highlight
                  ? "h-full border-[#105C50]/40 bg-[#eaf8f2] shadow-xs"
                  : "h-full border-gray-200/80 bg-white shadow-xs"
              }
            >
              <CardContent className="flex flex-col justify-between p-3.5 sm:flex-row sm:items-start sm:p-5">
                <div className="flex items-center justify-between sm:block">
                  <p className="text-[11px] font-bold text-gray-500 sm:text-xs">
                    {label}
                  </p>
                  <span className="rounded-lg bg-[#105C50]/10 p-2 text-[#105C50] sm:hidden">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                </div>

                <div className="mt-2 sm:mt-0">
                  <p className="text-xl font-extrabold text-[#0a1122] sm:mt-2 sm:text-3xl">
                    {value}
                  </p>
                  <p
                    className={`mt-1 text-[10px] sm:mt-2 sm:text-xs ${
                      highlight
                        ? "font-bold text-[#105C50]"
                        : "font-semibold text-gray-500"
                    }`}
                  >
                    {note}
                  </p>
                </div>

                <span className="hidden rounded-xl bg-[#105C50]/10 p-3 text-[#105C50] sm:inline-flex">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:mt-7 lg:grid-cols-3">
        {/* أحدث طلبات البائعين (العقارات) */}
        <Card className="border-gray-200/80 bg-white shadow-sm lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 p-4 sm:p-6">
            <div>
              <CardTitle className="text-sm font-extrabold text-[#0a1122] sm:text-base">
                أحدث طلبات البائعين (العقارات)
              </CardTitle>
              <CardDescription className="mt-0.5 text-[11px] sm:text-xs">
                آخر الوحدات المضافة من البائعين وحالتها الحالية.
              </CardDescription>
            </div>
            <Link
              href="/admin/properties"
              className="flex shrink-0 items-center gap-1 text-xs font-bold text-[#105C50] hover:underline"
            >
              عرض الكل <ArrowLeft className="size-3.5" />
            </Link>
          </CardHeader>

          <CardContent className="p-0">
            {/* عرض الموبايل: كروت مدمجة بدون سكرول أفقي */}
            <div className="divide-y divide-gray-100 md:hidden">
              {properties.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400">
                  لا توجد وحدات مضافة حتى الآن.
                </div>
              ) : (
                properties.slice(0, 6).map((prop) => {
                  const st =
                    statusMap[prop.status || "pending"] || statusMap.pending
                  return (
                    <div key={prop.id} className="p-3.5 hover:bg-gray-50/60">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-extrabold text-[#0a1122]">
                            {prop.project_name || "وحدة سكنية"}
                          </p>
                          <p className="mt-0.5 text-[11px] text-gray-400">
                            {prop.area || "—"} · {prop.unit_type || "شقة"}
                          </p>
                        </div>
                        <Badge className={`text-[10px] ${st.className}`}>
                          {st.label}
                        </Badge>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-xs">
                        <span className="font-extrabold text-[#105C50]">
                          {prop.paid_amount
                            ? `${Number(prop.paid_amount).toLocaleString("en-US")} ج.م`
                            : "—"}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-gray-500">
                          <span>{prop.name}</span>
                          <span>·</span>
                          <span dir="ltr">{prop.phone}</span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* عرض الكمبيوتر: الجدول الكامل */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th className="px-5 py-3.5 font-bold">المشروع والمنطقة</th>
                    <th className="px-5 py-3.5 font-bold">البائع</th>
                    <th className="px-5 py-3.5 font-bold">المطلوب كاش</th>
                    <th className="px-5 py-3.5 font-bold">التاريخ</th>
                    <th className="px-5 py-3.5 font-bold">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-8 text-center text-xs text-gray-400"
                      >
                        لا توجد وحدات مضافة حتى الآن.
                      </td>
                    </tr>
                  ) : (
                    properties.slice(0, 6).map((prop) => {
                      const st =
                        statusMap[prop.status || "pending"] || statusMap.pending
                      return (
                        <tr
                          key={prop.id}
                          className="border-t border-gray-100 hover:bg-gray-50/60"
                        >
                          <td className="px-5 py-4">
                            <div className="font-bold text-[#0a1122]">
                              {prop.project_name || "وحدة سكنية"}
                            </div>
                            <div className="mt-0.5 text-[11px] text-gray-400">
                              {prop.area || "—"} · {prop.unit_type || "شقة"}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="font-semibold text-[#0a1122]">
                              {prop.name}
                            </div>
                            <div
                              dir="ltr"
                              className="text-right text-[11px] text-gray-400"
                            >
                              {prop.phone}
                            </div>
                          </td>
                          <td className="px-5 py-4 font-extrabold text-[#105C50]">
                            {prop.paid_amount
                              ? `${Number(prop.paid_amount).toLocaleString("en-US")} ج.م`
                              : "—"}
                          </td>
                          <td className="px-5 py-4 text-xs text-gray-500">
                            {prop.created_at
                              ? new Date(prop.created_at).toLocaleDateString(
                                  "ar-EG"
                                )
                              : "—"}
                          </td>
                          <td className="px-5 py-4">
                            <Badge className={st.className}>{st.label}</Badge>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* قائمة أحدث طلبات الشراء */}
        <Card className="border-gray-200/80 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 p-4 sm:p-6">
            <div>
              <CardTitle className="text-sm font-extrabold text-[#0a1122] sm:text-base">
                أحدث المشترين
              </CardTitle>
              <CardDescription className="mt-0.5 text-[11px] sm:text-xs">
                عملاء سجلوا ميزانيتهم مؤخراً.
              </CardDescription>
            </div>
            <Link
              href="/admin/leads"
              className="flex items-center gap-1 text-xs font-bold text-[#105C50] hover:underline"
            >
              الكل <ArrowLeft className="size-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="divide-y divide-gray-100 p-0">
            {leads.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">
                لا توجد طلبات شراء حتى الآن.
              </div>
            ) : (
              leads.slice(0, 5).map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-3.5 hover:bg-gray-50/60 sm:p-4"
                >
                  <div>
                    <p className="text-xs font-extrabold text-[#0a1122]">
                      {lead.name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-gray-500">
                      كاش:{" "}
                      <strong className="text-[#105C50]">
                        {Number(
                          lead.available_cash || lead.budget || 0
                        ).toLocaleString("en-US")}{" "}
                        ج.م
                      </strong>
                    </p>
                    <p className="mt-0.5 text-[10px] text-gray-400">
                      {Array.isArray(lead.preferred_areas)
                        ? lead.preferred_areas.join("، ")
                        : lead.preferred_areas || "جميع المناطق"}
                    </p>
                  </div>
                  <a
                    href={`https://wa.me/${String(lead.phone || "").replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-8 items-center gap-1 rounded-lg bg-[#25D366] px-3 text-[11px] font-bold text-white transition hover:opacity-90"
                  >
                    <MessageCircle className="size-3.5" />
                    <span>تواصل</span>
                  </a>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}