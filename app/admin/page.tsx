import Link from "next/link"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import {
  ArrowLeft,
  Building2,
  Clock3,
  Flame,
  Globe,
  MessageCircle,
  Sparkles,
  Star,
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

const ADMIN_COUNTRIES = [
  { code: "ALL", label: "كل الدول", flag: "🌍", currency: "ج.م" },
  { code: "EG", label: "مصر", flag: "🇪🇬", currency: "ج.م" },
  { code: "RU", label: "روسيا", flag: "🇷🇺", currency: "₽" },
  { code: "GE", label: "جورجيا", flag: "🇬🇪", currency: "$" },
  { code: "AE", label: "الإمارات", flag: "🇦🇪", currency: "د.إ" },
]

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
  active: {
    label: "معروضة في السوق",
    className: "bg-emerald-100 text-emerald-800",
  },
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

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ country?: string }>
}) {
  const resolvedParams = searchParams ? await searchParams : {}
  const selectedCountry = (resolvedParams.country || "ALL").toUpperCase()
  const currentCountryObj =
    ADMIN_COUNTRIES.find((c) => c.code === selectedCountry) ||
    ADMIN_COUNTRIES[0]

  const supabase = await getSupabase()

  const [{ data: propertiesData }, { data: leadsData }, { data: usersData }] =
    await Promise.all([
      supabase
        .from("sell_requests")
        .select("*")
        .neq("status", "deleted_by_seller")
        .order("created_at", { ascending: false }),
      supabase
        .from("buy_requests")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("users")
        .select("id, name, email, phone, created_at")
        .order("created_at", { ascending: false }),
    ])

  const allProperties = propertiesData || []
  const allLeads = leadsData || []
  const users = usersData || []

  // فلترة العقارات والطلبات حسب الدولة المختارة في لوحة الأدمن
  const properties =
    selectedCountry === "ALL"
      ? allProperties
      : allProperties.filter(
          (p: any) => (p.country_code || "EG") === selectedCountry
        )

  const leads =
    selectedCountry === "ALL"
      ? allLeads
      : allLeads.filter(
          (l: any) => (l.country_code || "EG") === selectedCountry
        )

  const pendingProperties = properties.filter(
    (p) => !p.status || p.status === "pending" || p.status === "under_review"
  )
  const activeProperties = properties.filter((p) => p.status === "active")

  // حساب طلبات الإعلان والوحدات المميزة
  const pendingAdRequests = properties.filter(
    (p) => !p.is_featured && p.featured_status === "pending_payment"
  )
  const activeFeaturedUnits = properties.filter((p) => p.is_featured)

  // حساب العملاء المهتمين بوحدة محددة (🔥 حاجزي الوحدات)
  const unitSpecificLeads = leads.filter((l: any) => {
    const areasStr = Array.isArray(l.preferred_areas)
      ? l.preferred_areas.join(" ")
      : String(l.preferred_areas || "")
    const planStr = String(l.payment_plan || "")
    return (
      areasStr.includes("🎯") ||
      areasStr.includes("U-") ||
      planStr.includes("مهتم بوحدة")
    )
  })

  const countryQuery =
    selectedCountry !== "ALL" ? `&country=${selectedCountry}` : ""

  const kpis = [
    {
      label: `إجمالي العقارات (${currentCountryObj.label})`,
      value: properties.length.toLocaleString("en-US"),
      suffix: "",
      note: `${activeProperties.length.toLocaleString("en-US")} منشور حالياً`,
      icon: Building2,
      href: `/admin/properties${selectedCountry !== "ALL" ? `?country=${selectedCountry}` : ""}`,
    },
    {
      label: "بانتظار المراجعة",
      value: pendingProperties.length.toLocaleString("en-US"),
      suffix: "",
      note: pendingProperties.length > 0 ? "تحتاج مراجعتك" : "تمت مراجعة الكل",
      icon: Clock3,
      href: `/admin/properties?tab=pending${countryQuery}`,
      highlight: pendingProperties.length > 0,
    },
    {
      label: "طلبات الإعلانات ⭐",
      value: (
        pendingAdRequests.length + activeFeaturedUnits.length
      ).toLocaleString("en-US"),
      suffix: "",
      note:
        pendingAdRequests.length > 0
          ? `${pendingAdRequests.length} طلب جديد بانتظار التفعيل`
          : `${activeFeaturedUnits.length} وحدة مميزة نشطة`,
      icon: Star,
      href: `/admin/properties?tab=featured${countryQuery}`,
      highlight: pendingAdRequests.length > 0,
    },
    {
      label: "حاجزي الوحدات 🔥",
      value: unitSpecificLeads.length.toLocaleString("en-US"),
      suffix: "",
      note: `من إجمالي ${leads.length.toLocaleString("en-US")} طلب شراء`,
      icon: Flame,
      href: `/admin/leads?type=unit_leads${countryQuery}`,
      highlight: unitSpecificLeads.length > 0,
    },
  ]

  return (
    <div className="mx-auto max-w-7xl">
      {/* شريط تقسيم الدول العلوي في لوحة الأدمن */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200/90 bg-white p-3 shadow-2xs sm:p-4">
        <div className="flex items-center gap-2 text-xs font-extrabold text-[#0a1122] sm:text-sm">
          <Globe className="size-4 text-[#105C50]" />
          <span>اختر سوق الدولة لعرض بياناته وطلباته:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {ADMIN_COUNTRIES.map((c) => {
            const isSelected = c.code === selectedCountry
            const countInCountry =
              c.code === "ALL"
                ? allProperties.length
                : allProperties.filter(
                    (p: any) => (p.country_code || "EG") === c.code
                  ).length

            return (
              <Link
                key={c.code}
                href={
                  c.code === "ALL" ? "/admin" : `/admin?country=${c.code}`
                }
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold transition ${
                  isSelected
                    ? "bg-[#105C50] text-white shadow-xs"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <span>{c.flag}</span>
                <span>{c.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-white text-gray-600"
                  }`}
                >
                  {countInCountry}
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* الهيدر العلوي والأزرار السريعة */}
      <div className="mb-6 flex flex-col justify-between gap-3 sm:mb-8 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-extrabold text-[#105C50]">
            نظرة عامة حية — {currentCountryObj.flag} {currentCountryObj.label}
          </p>
          <h2 className="mt-1 text-xl font-extrabold text-[#0a1122] sm:text-3xl">
            مركز الإدارة
          </h2>
          <p className="mt-1 text-xs text-gray-500 sm:text-sm">
            إحصائيات حقيقية مباشرة من قاعدة البيانات لمتابعة حركة البائعين، حاجزي الوحدات، وطلبات الإعلانات.
          </p>
        </div>

        {/* الأزرار السريعة: حاجزي الوحدات 🔥 + طلبات الإعلان ⭐ + العقارات */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/admin/leads?type=unit_leads${countryQuery}`}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-orange-600 px-3.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-orange-700"
          >
            <Flame className="size-4 shrink-0 fill-white" />
            <span>حاجزي الوحدات ({unitSpecificLeads.length})</span>
          </Link>

          <Link
            href={`/admin/properties?tab=featured${countryQuery}`}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-3.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-amber-600"
          >
            <Star className="size-4 shrink-0 fill-white" />
            <span>
              طلبات الإعلان (
              {pendingAdRequests.length + activeFeaturedUnits.length})
            </span>
          </Link>

          <Link
            href={`/admin/properties${selectedCountry !== "ALL" ? `?country=${selectedCountry}` : ""}`}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#105C50] px-3.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#0c483f]"
          >
            <Building2 className="size-4 shrink-0" />
            <span>العقارات ({properties.length.toLocaleString("en-US")})</span>
          </Link>
        </div>
      </div>

      {/* بطاقات الإحصائيات (KPIs) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {kpis.map(
          ({ label, value, suffix, note, icon: Icon, href, highlight }) => (
            <Link
              key={label}
              href={href}
              className="group block cursor-pointer transition-all hover:-translate-y-1"
            >
              <Card
                className={`h-full overflow-hidden transition-all duration-300 ${
                  highlight
                    ? "border-[#105C50]/40 bg-gradient-to-br from-[#eff8f6] to-white shadow-sm hover:border-[#105C50] hover:shadow-md"
                    : "border-gray-200/80 bg-white shadow-sm hover:border-[#105C50]/60 hover:shadow-md"
                }`}
              >
                <CardContent className="flex h-full flex-col justify-between p-4 sm:p-5">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors sm:size-10 ${
                        highlight
                          ? "bg-[#105C50] text-white"
                          : "bg-[#105C50]/10 text-[#105C50] group-hover:bg-[#105C50] group-hover:text-white"
                      }`}
                    >
                      <Icon className="size-4 sm:size-5" />
                    </span>
                    <p className="text-[11px] font-bold text-gray-500 transition-colors group-hover:text-[#105C50] sm:text-xs">
                      {label}
                    </p>
                  </div>

                  <div className="flex flex-1 items-center justify-center py-4">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-black tracking-tight text-[#0a1122] sm:text-4xl">
                        {value}
                      </span>
                      {suffix && (
                        <span className="text-[11px] font-extrabold text-gray-400 sm:text-xs">
                          {suffix}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p
                      className={`text-[10px] font-semibold sm:text-xs ${
                        highlight ? "text-[#105C50]" : "text-gray-500"
                      }`}
                    >
                      {note}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        )}
      </div>

      {/* شريط تنبيه فوري إذا كان هناك طلبات إعلانات بانتظار التفعيل */}
      {pendingAdRequests.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
              <Sparkles className="size-5" />
            </span>
            <div>
              <h3 className="text-xs font-extrabold text-amber-950 sm:text-sm">
                لديك ({pendingAdRequests.length}) طلب إعلان وتمييز وحدة بانتظار التفعيل!
              </h3>
              <p className="mt-0.5 text-[11px] text-amber-800">
                أرقام طلبات الإعلان الحالية:{" "}
                <strong className="font-mono">
                  {pendingAdRequests
                    .map((p) => p.featured_fawry_code || "AD")
                    .join(" ، ")}
                </strong>
              </p>
            </div>
          </div>
          <Link
            href={`/admin/properties?tab=featured${countryQuery}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-amber-600 px-4 text-xs font-extrabold text-white hover:bg-amber-700"
          >
            <span>فتح صفحة طلبات الإعلان وتفعيلها</span>
            <ArrowLeft className="size-3.5" />
          </Link>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-5 sm:mt-7 lg:grid-cols-3">
        <Card className="border-gray-200/80 bg-white shadow-sm lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 p-4 sm:p-6">
            <div>
              <CardTitle className="text-sm font-extrabold text-[#0a1122] sm:text-base">
                أحدث طلبات البائعين ({currentCountryObj.label})
              </CardTitle>
              <CardDescription className="mt-0.5 text-[11px] sm:text-xs">
                اضغط على أي وحدة للانتقال لإدارتها ومراجعتها.
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
            <div className="divide-y divide-gray-100 md:hidden">
              {properties.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400">
                  لا توجد وحدات مضافة في هذا السوق حتى الآن.
                </div>
              ) : (
                properties.slice(0, 6).map((prop) => {
                  const st =
                    statusMap[prop.status || "pending"] || statusMap.pending
                  return (
                    <Link
                      key={prop.id}
                      href={`/admin/properties?unitId=${prop.id}`}
                      className="block p-3.5 transition hover:bg-gray-50"
                    >
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
                            ? `${Number(prop.paid_amount).toLocaleString("en-US")} ${currentCountryObj.currency}`
                            : "—"}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-gray-500">
                          <span>{prop.name}</span>
                          <span>·</span>
                          <span dir="ltr">{prop.phone}</span>
                        </div>
                      </div>
                    </Link>
                  )
                })
              )}
            </div>

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
                        لا توجد وحدات مضافة في هذا السوق حتى الآن.
                      </td>
                    </tr>
                  ) : (
                    properties.slice(0, 6).map((prop) => {
                      const st =
                        statusMap[prop.status || "pending"] || statusMap.pending
                      return (
                        <tr
                          key={prop.id}
                          className="border-t border-gray-100 transition hover:bg-gray-50/80"
                        >
                          <td className="px-5 py-4">
                            <Link
                              href={`/admin/properties?unitId=${prop.id}`}
                              className="block font-bold text-[#0a1122] hover:text-[#105C50]"
                            >
                              {prop.project_name || "وحدة سكنية"}
                            </Link>
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
                              ? `${Number(prop.paid_amount).toLocaleString("en-US")} ${currentCountryObj.currency}`
                              : "—"}
                          </td>
                          <td className="px-5 py-4 text-xs text-gray-500">
                            {prop.created_at
                              ? new Date(prop.created_at).toLocaleDateString(
                                  "en-US"
                                )
                              : "—"}
                          </td>
                          <td className="px-5 py-4">
                            <Link href={`/admin/properties?unitId=${prop.id}`}>
                              <Badge className={st.className}>{st.label}</Badge>
                            </Link>
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

        <Card className="border-gray-200/80 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 p-4 sm:p-6">
            <div>
              <CardTitle className="text-sm font-extrabold text-[#0a1122] sm:text-base">
                أحدث المشترين وحاجزي الوحدات
              </CardTitle>
              <CardDescription className="mt-0.5 text-[11px] sm:text-xs">
                اضغط على زر حاجزي الوحدات بالأعلى لعرض المهتمين بوحدة محددة فقط.
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
                لا توجد طلبات شراء في هذا السوق حتى الآن.
              </div>
            ) : (
              leads.slice(0, 5).map((lead) => {
                const areasText = Array.isArray(lead.preferred_areas)
                  ? lead.preferred_areas.join("، ")
                  : lead.preferred_areas || "جميع المناطق"
                const isUnitSpecific =
                  areasText.includes("🎯") || areasText.includes("U-")

                return (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between p-3.5 hover:bg-gray-50/60 sm:p-4"
                  >
                    <Link
                      href={
                        isUnitSpecific
                          ? "/admin/leads?type=unit_leads"
                          : "/admin/leads"
                      }
                      className="min-w-0 flex-1"
                    >
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-extrabold text-[#0a1122] hover:text-[#105C50]">
                          {lead.name}
                        </p>
                        {isUnitSpecific && (
                          <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[9px] font-extrabold text-orange-800">
                            🔥 حجز وحدة
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-gray-500">
                        كاش:{" "}
                        <strong className="text-[#105C50]">
                          {Number(
                            lead.available_cash || lead.budget || 0
                          ).toLocaleString("en-US")}{" "}
                          {currentCountryObj.currency}
                        </strong>
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-gray-400">
                        {areasText}
                      </p>
                    </Link>
                    <a
                      href={`https://wa.me/${String(lead.phone || "").replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mr-2 inline-flex h-8 shrink-0 items-center gap-1 rounded-lg bg-[#25D366] px-3 text-[11px] font-bold text-white transition hover:opacity-90"
                    >
                      <MessageCircle className="size-3.5" />
                      <span>تواصل</span>
                    </a>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}