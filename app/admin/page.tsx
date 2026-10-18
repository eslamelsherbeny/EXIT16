import Link from "next/link"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import {
  ArrowLeft,
  Building2,
  CircleDollarSign,
  Clock3,
  FileText,
  MessageCircle,
  Users,
  WalletCards,
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

  // حساب إجمالي قيمة العقارات المعروضة والعمولة التقديرية (مثلاً 2.5%)
  const totalPortfolioValue = properties.reduce(
    (sum, p) => sum + (Number(p.contract_price) || Number(p.paid_amount) || 0),
    0
  )
  const estimatedCommission = Math.round(totalPortfolioValue * 0.025)

  const kpis = [
    {
      label: "إجمالي العقارات المسجلة",
      value: properties.length.toLocaleString("ar-EG"),
      note: `${activeProperties.length.toLocaleString("ar-EG")} عقار منشور حالياً`,
      icon: Building2,
      href: "/admin/properties",
    },
    {
      label: "طلبات بانتظار المراجعة",
      value: pendingProperties.length.toLocaleString("ar-EG"),
      note:
        pendingProperties.length > 0
          ? "تحتاج مراجعتك واعتمادك"
          : "تمت مراجعة كافة الطلبات",
      icon: Clock3,
      href: "/admin/properties?status=pending",
      highlight: pendingProperties.length > 0,
    },
    {
      label: "طلبات الشراء (المشترين)",
      value: leads.length.toLocaleString("ar-EG"),
      note: `${users.length.toLocaleString("ar-EG")} حساب مسجل بالمنصة`,
      icon: Users,
      href: "/admin/leads",
    },
    {
      label: "العمولات المتوقعة (٢.٥٪)",
      value:
        estimatedCommission > 0
          ? `${(estimatedCommission / 1_000_000).toFixed(2)}م ج.م`
          : "٠ ج.م",
      note: `${investors.length.toLocaleString("ar-EG")} طلب شراكة استثمارية`,
      icon: CircleDollarSign,
      href: "/admin/investors",
    },
  ]

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold text-[#105C50]">نظرة عامة حية</p>
          <h2 className="mt-1 text-2xl font-extrabold text-[#0a1122] sm:text-3xl">
            لوحة القيادة
          </h2>
          <p className="mt-1.5 text-xs text-gray-500 sm:text-sm">
            إحصائيات حقيقية مباشرة من قاعدة البيانات لمتابعة حركة البائعين والمشترين.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/admin/properties"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#105C50] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#0c483f]"
          >
            <Building2 className="size-4" />
            <span>إدارة العقارات ({properties.length})</span>
          </Link>
          <Link
            href="/admin/users"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-xs font-bold text-[#0a1122] shadow-sm transition hover:bg-gray-50"
          >
            <Users className="size-4" />
            <span>إدارة الفريق والصلاحيات</span>
          </Link>
        </div>
      </div>

      {/* بطاقات الإحصائيات الحقيقية */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ label, value, note, icon: Icon, href, highlight }) => (
          <Link key={label} href={href} className="block transition hover:-translate-y-0.5">
            <Card
              className={
                highlight
                  ? "border-[#105C50]/40 bg-[#eaf8f2] shadow-sm"
                  : "border-gray-200/80 bg-white shadow-sm"
              }
            >
              <CardContent className="flex items-start justify-between p-5">
                <div>
                  <p className="text-xs font-bold text-gray-500">{label}</p>
                  <p className="mt-3 text-3xl font-extrabold text-[#0a1122]">
                    {value}
                  </p>
                  <p
                    className={
                      highlight
                        ? "mt-2 text-xs font-bold text-[#105C50]"
                        : "mt-2 text-xs font-semibold text-gray-500"
                    }
                  >
                    {note}
                  </p>
                </div>
                <span className="rounded-xl bg-[#105C50]/10 p-3 text-[#105C50]">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-7 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* جدول أحدث طلبات البيع */}
        <Card className="border-gray-200/80 bg-white shadow-sm lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100">
            <div>
              <CardTitle className="text-base font-extrabold text-[#0a1122]">
                أحدث طلبات البائعين (العقارات)
              </CardTitle>
              <CardDescription className="mt-1 text-xs">
                آخر الوحدات المضافة من البائعين وحالتها الحالية.
              </CardDescription>
            </div>
            <Link
              href="/admin/properties"
              className="flex items-center gap-1 text-xs font-bold text-[#105C50] hover:underline"
            >
              عرض الكل <ArrowLeft className="size-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-right text-xs sm:text-sm">
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
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100">
            <div>
              <CardTitle className="text-base font-extrabold text-[#0a1122]">
                أحدث المشترين
              </CardTitle>
              <CardDescription className="mt-1 text-xs">
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
                  className="flex items-center justify-between p-4 hover:bg-gray-50/60"
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
