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
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getServerI18n } from "@/lib/get-server-dictionary"
import { getCurrencySymbol } from "@/lib/i18n-config"

export const dynamic = "force-dynamic"
export const revalidate = 0

const STATUS_BADGE_CLASSES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  under_review: "bg-blue-100 text-blue-800",
  active: "bg-emerald-100 text-emerald-800",
  offer_received: "bg-purple-100 text-purple-800",
  transferring: "bg-indigo-100 text-indigo-800",
  sold: "bg-teal-700 text-white",
  rejected: "bg-red-100 text-red-800",
}

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

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ country?: string }>
}) {
  // سحب الترجمة مباشرة من ملفات الـ JSON عبر النظام المركزي
  const { dict, locale, dir } = await getServerI18n()
  const t = dict.admin.dashboard

  const adminCountries = [
    { code: "ALL", label: t.countries.ALL, flag: "🌍" },
    { code: "EG", label: t.countries.EG, flag: "🇪🇬" },
    { code: "RU", label: t.countries.RU, flag: "🇷🇺" },
    { code: "GE", label: t.countries.GE, flag: "🇬🇪" },
    { code: "AE", label: t.countries.AE, flag: "🇦🇪" },
  ]

  const resolvedParams = searchParams ? await searchParams : {}
  const selectedCountry = (resolvedParams.country || "ALL").toUpperCase()
  const currentCountryObj =
    adminCountries.find((c) => c.code === selectedCountry) || adminCountries[0]

  const supabase = await getSupabase()

  const [{ data: propertiesData }, { data: leadsData }] = await Promise.all([
    supabase
      .from("sell_requests")
      .select("*")
      .neq("status", "deleted_by_seller")
      .order("created_at", { ascending: false }),
    supabase
      .from("buy_requests")
      .select("*")
      .order("created_at", { ascending: false }),
  ])

  const allProperties = propertiesData || []
  const allLeads = leadsData || []

  const properties =
    selectedCountry === "ALL"
      ? allProperties
      : allProperties.filter(
          (p: any) =>
            (p.country_code || p.country || "EG").toUpperCase() ===
            selectedCountry
        )

  const leads =
    selectedCountry === "ALL"
      ? allLeads
      : allLeads.filter(
          (l: any) =>
            (l.country_code || l.country || "EG").toUpperCase() ===
            selectedCountry
        )

  const pendingProperties = properties.filter(
    (p) => !p.status || p.status === "pending" || p.status === "under_review"
  )
  const activeProperties = properties.filter((p) => p.status === "active")

  const pendingAdRequests = properties.filter(
    (p) => !p.is_featured && p.featured_status === "pending_payment"
  )
  const activeFeaturedUnits = properties.filter((p) => p.is_featured)

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
    selectedCountry !== "ALL" ? `?country=${selectedCountry}` : ""
  const countryAmp =
    selectedCountry !== "ALL" ? `&country=${selectedCountry}` : ""

  const kpis = [
    {
      label:
        selectedCountry === "ALL"
          ? t.totalUnitsAll
          : `${t.unitsIn} ${currentCountryObj.label}`,
      value: properties.length.toLocaleString("en-US"),
      note: `${activeProperties.length.toLocaleString("en-US")} ${t.publishedNote}`,
      icon: Building2,
      href: `/admin/properties${countryQuery}`,
    },
    {
      label: t.pendingReview,
      value: pendingProperties.length.toLocaleString("en-US"),
      note:
        pendingProperties.length > 0 ? t.pendingNeedAction : t.allReviewed,
      icon: Clock3,
      href: `/admin/properties?tab=pending${countryAmp}`,
      highlight: pendingProperties.length > 0,
    },
    {
      label: t.adRequests,
      value: (
        pendingAdRequests.length + activeFeaturedUnits.length
      ).toLocaleString("en-US"),
      note:
        pendingAdRequests.length > 0
          ? `${pendingAdRequests.length} ${t.adPendingNote}`
          : `${activeFeaturedUnits.length} ${t.adActiveNote}`,
      icon: Star,
      href: `/admin/promotions${countryQuery}`,
      highlight: pendingAdRequests.length > 0,
    },
    {
      label: t.unitBookers,
      value: unitSpecificLeads.length.toLocaleString("en-US"),
      note: `${t.outOfTotal} ${leads.length.toLocaleString("en-US")} ${t.buyRequestsWord}`,
      icon: Flame,
      href: `/admin/leads?type=unit_leads${countryAmp}`,
      highlight: unitSpecificLeads.length > 0,
    },
  ]

  return (
    <div dir={dir} className="mx-auto max-w-7xl text-start">
      <div className="mb-5 rounded-xl border border-gray-200/85 bg-white p-4 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#0a1122] sm:text-sm">
              <Globe className="size-4 text-[#105C50]" />
              <span>
                {selectedCountry === "ALL"
                  ? t.showingAll
                  : `${t.showingCountry} ${currentCountryObj.label} ${currentCountryObj.flag}`}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-gray-500">{t.filterHint}</p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {adminCountries.map((c) => {
              const isSelected = c.code === selectedCountry
              const countInCountry =
                c.code === "ALL"
                  ? allProperties.length
                  : allProperties.filter(
                      (p: any) =>
                        (p.country_code || p.country || "EG").toUpperCase() ===
                        c.code
                    ).length

              return (
                <Link
                  key={c.code}
                  href={
                    c.code === "ALL" ? "/admin" : `/admin?country=${c.code}`
                  }
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    isSelected
                      ? "bg-[#105C50] text-white shadow-2xs"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <span>{c.flag}</span>
                  <span>{c.label}</span>
                  <span
                    className={`rounded-full px-1.5 text-[10px] ${
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
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {kpis.map(({ label, value, note, icon: Icon, href, highlight }) => (
          <Link
            key={label}
            href={href}
            className="group block transition-transform hover:-translate-y-0.5"
          >
            <Card
              className={`h-full border transition ${
                highlight
                  ? "border-[#105C50]/40 bg-gradient-to-br from-[#eff8f6] to-white"
                  : "border-gray-200/80 bg-white hover:border-[#105C50]/50"
              }`}
            >
              <CardContent className="flex h-full flex-col justify-between p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-gray-500 group-hover:text-[#105C50]">
                    {label}
                  </p>
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                      highlight
                        ? "bg-[#105C50] text-white"
                        : "bg-[#105C50]/10 text-[#105C50]"
                    }`}
                  >
                    <Icon className="size-4" />
                  </span>
                </div>

                <div
                  dir="ltr"
                  className="my-3 text-start text-2xl font-black text-[#0a1122] tabular-nums sm:text-3xl"
                >
                  {value}
                </div>

                <p
                  className={`text-[11px] font-semibold ${
                    highlight ? "text-[#105C50]" : "text-gray-400"
                  }`}
                >
                  {note}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {pendingAdRequests.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Sparkles className="size-4 shrink-0 text-amber-700" />
            <p className="text-xs font-bold text-amber-950">
              ({pendingAdRequests.length}) {t.adAlertPrefix}{" "}
              <strong className="font-mono">
                {pendingAdRequests
                  .map((p) => p.featured_fawry_code || "AD")
                  .join(" , ")}
              </strong>
            </p>
          </div>
          <Link
            href={`/admin/promotions${countryQuery}`}
            className="inline-flex h-8 items-center gap-1 rounded-lg bg-amber-600 px-3 text-xs font-bold text-white hover:bg-amber-700"
          >
            <span>{t.openAdRequests}</span>
            <ArrowLeft className="size-3 rtl:rotate-0 ltr:rotate-180" />
          </Link>
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="border-gray-200/80 bg-white shadow-2xs lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 px-4 py-3.5 sm:px-5">
            <div>
              <CardTitle className="text-sm font-extrabold text-[#0a1122]">
                {t.latestProperties} ({currentCountryObj.label})
              </CardTitle>
            </div>
            <Link
              href="/admin/properties"
              className="flex items-center gap-1 text-xs font-bold text-[#105C50] hover:underline"
            >
              {t.viewAll}{" "}
              <ArrowLeft className="size-3.5 rtl:rotate-0 ltr:rotate-180" />
            </Link>
          </CardHeader>

          <CardContent className="p-3">
            <div className="space-y-2">
              {properties.length === 0 ? (
                <div className="py-6 text-center text-xs text-gray-400">
                  {t.noProperties}
                </div>
              ) : (
                properties.slice(0, 6).map((prop) => {
                  const stKey = (prop.status || "pending") as keyof typeof t.statuses
                  const stLabel = t.statuses[stKey] || t.statuses.pending
                  const stCls =
                    STATUS_BADGE_CLASSES[prop.status || "pending"] ||
                    STATUS_BADGE_CLASSES.pending
                  const propCurrency = getCurrencySymbol(
                    prop.country_code || prop.country || "EG",
                    locale
                  )

                  return (
                    <Link
                      key={prop.id}
                      href={`/admin/properties?unitId=${prop.id}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200/80 bg-white px-3.5 py-2.5 transition hover:border-[#105C50]/50 hover:bg-gray-50/70"
                    >
                      <div className="min-w-[160px] flex-1">
                        <p className="text-xs font-extrabold text-[#0a1122]">
                          {prop.project_name || t.defaultUnit}
                        </p>
                        <p className="mt-0.5 text-[11px] text-gray-500">
                          {prop.area || "—"} · {prop.name} (
                          <span dir="ltr">{prop.phone}</span>)
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-extrabold text-[#105C50] tabular-nums">
                          {prop.paid_amount ? (
                            <>
                              <span dir="ltr">
                                {Number(prop.paid_amount).toLocaleString(
                                  "en-US"
                                )}
                              </span>{" "}
                              {propCurrency}
                            </>
                          ) : (
                            "—"
                          )}
                        </span>
                        <Badge className={`text-[10px] ${stCls}`}>
                          {stLabel}
                        </Badge>
                      </div>
                    </Link>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200/80 bg-white shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 px-4 py-3.5 sm:px-5">
            <CardTitle className="text-sm font-extrabold text-[#0a1122]">
              {t.latestLeads} ({currentCountryObj.label})
            </CardTitle>
            <Link
              href="/admin/leads"
              className="flex items-center gap-1 text-xs font-bold text-[#105C50] hover:underline"
            >
              {t.allShort}{" "}
              <ArrowLeft className="size-3.5 rtl:rotate-0 ltr:rotate-180" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-2 p-3">
            {leads.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400">
                {t.noLeads}
              </div>
            ) : (
              leads.slice(0, 5).map((lead) => {
                const areasText = Array.isArray(lead.preferred_areas)
                  ? lead.preferred_areas.join("، ")
                  : lead.preferred_areas || t.allAreas
                const isUnitSpecific =
                  areasText.includes("🎯") || areasText.includes("U-")
                const leadCurrency = getCurrencySymbol(
                  lead.country_code || lead.country || "EG",
                  locale
                )

                return (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between rounded-xl border border-gray-200/80 bg-white px-3.5 py-2.5 transition hover:border-[#105C50]/40"
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
                        <p className="text-xs font-extrabold text-[#0a1122]">
                          {lead.name}
                        </p>
                        {isUnitSpecific && (
                          <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[9px] font-bold text-orange-800">
                            {t.unitBookBadge}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] font-bold text-[#105C50] tabular-nums">
                        <span dir="ltr">
                          {Number(
                            lead.available_cash || lead.budget || 0
                          ).toLocaleString("en-US")}
                        </span>{" "}
                        {leadCurrency}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-gray-400">
                        {areasText}
                      </p>
                    </Link>
                    <a
                      href={`https://wa.me/${String(lead.phone || "").replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="ms-2 inline-flex h-8 shrink-0 items-center justify-center rounded-lg bg-[#25D366] px-2.5 text-white hover:opacity-90"
                    >
                      <MessageCircle className="size-3.5" />
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
