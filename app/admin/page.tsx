import Link from "next/link"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import {
  ArrowLeft,
  Building2,
  Clock3,
  ExternalLink,
  FileText,
  Flame,
  Handshake,
  MessageCircle,
  RefreshCw,
  Star,
  Wallet,
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

const ACTIVE_ADMIN_COUNTRY = "GE"

const STATUS_BADGE_CLASSES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  under_review: "bg-blue-100 text-blue-800",
  active: "bg-emerald-100 text-emerald-800",
  offer_received: "bg-purple-100 text-purple-800",
  transferring: "bg-indigo-100 text-indigo-800",
  sold: "bg-teal-700 text-white",
  rejected: "bg-red-100 text-red-800",
}

function deriveUnitCode(id: string) {
  const digits = id.replace(/\D/g, "")
  const num = digits ? Number(digits.slice(-4)) : 100
  return `U-${String(num).padStart(5, "0")}`
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

export default async function AdminPage() {
  const { dict, locale, dir } = await getServerI18n()
  const t = dict.admin.dashboard as Record<string, any>
  const leadsDict = dict.admin.leads as Record<string, any>
  const sm = (dict.admin as Record<string, any>).smartMatch || {}

  const georgiaLabel = t.countries?.GE || "Georgia"
  const georgiaCurrency = getCurrencySymbol(ACTIVE_ADMIN_COUNTRY, locale)

  const supabase = await getSupabase()

  const [{ data: propertiesData }, { data: leadsData }, { data: allOffersData }] =
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
        .from("property_offers")
        .select("*")
        .neq("status", "recommended")
        .order("updated_at", { ascending: false })
        .limit(30),
    ])

  const properties = propertiesData || []
  const leads = leadsData || []
  const allOffers = allOffersData || []

  const propsMap = new Map(properties.map((p: any) => [p.id, p]))

  const readyDeals = allOffers
    .filter((o: any) => o.status === "accepted")
    .map((offer: any) => ({
      offer,
      unit: propsMap.get(offer.property_id),
    }))
    .filter((item) => Boolean(item.unit) && item.unit.status !== "sold")

  const liveNegotiationOffers = allOffers
    .map((offer: any) => ({
      offer,
      unit: propsMap.get(offer.property_id),
    }))
    .filter((item) => Boolean(item.unit))
    .slice(0, 8)

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

  const generalSearchLeadsCount = Math.max(
    0,
    leads.length - unitSpecificLeads.length
  )

  const kpis = [
    {
      label: `${t.unitsIn} ${georgiaLabel}`,
      value: properties.length.toLocaleString("en-US"),
      note: `${activeProperties.length.toLocaleString("en-US")} ${t.publishedNote}`,
      icon: Building2,
      href: "/admin/properties",
    },
    {
      label: t.pendingReview,
      value: pendingProperties.length.toLocaleString("en-US"),
      note:
        pendingProperties.length > 0 ? t.pendingNeedAction : t.allReviewed,
      icon: Clock3,
      href: "/admin/properties?tab=pending",
      highlight: pendingProperties.length > 0,
    },
    {
      label: t.unitBookers,
      value: unitSpecificLeads.length.toLocaleString("en-US"),
      note:
        t.unitBookersNote ||
        `${t.outOfTotal} ${leads.length.toLocaleString("en-US")}`,
      icon: Flame,
      href: "/admin/leads?type=unit_leads",
      highlight: unitSpecificLeads.length > 0,
    },
    {
      label: t.totalBuyerLeads || dict.admin.shell.nav.leads,
      value: leads.length.toLocaleString("en-US"),
      note: `${generalSearchLeadsCount.toLocaleString("en-US")} ${t.generalRequestsNote}`,
      icon: FileText,
      href: "/admin/leads",
    },
  ]

  return (
    <div dir={dir} className="mx-auto max-w-7xl text-start">
      {/* الكروت الأربعة */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {kpis.map(({ label, value, note, icon: Icon, href, highlight }) => (
          <Link
            key={label}
            href={href}
            className="group block h-full transition-transform hover:-translate-y-0.5"
          >
            <Card
              className={`h-full border transition ${
                highlight
                  ? "border-[#105C50]/40 bg-gradient-to-br from-[#eff8f6] to-white"
                  : "border-gray-200/80 bg-white hover:border-[#105C50]/50"
              }`}
            >
              <CardContent className="flex h-full flex-col justify-between p-3.5 sm:p-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                      highlight
                        ? "bg-[#105C50] text-white"
                        : "bg-[#105C50]/10 text-[#105C50]"
                    }`}
                  >
                    <Icon className="size-4 shrink-0" />
                  </span>
                  <p className="line-clamp-2 text-[11.5px] leading-snug font-extrabold text-[#0a1122] group-hover:text-[#105C50] sm:text-xs">
                    {label}
                  </p>
                </div>

                <div
                  dir="ltr"
                  className="my-3 text-center text-2xl font-black text-[#0a1122] tabular-nums sm:text-3xl"
                >
                  {value}
                </div>

                <p
                  className={`line-clamp-1 text-center text-[10.5px] font-semibold sm:text-[11px] ${
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

      {/* شريط طلبات الإعلان */}
      <Link
        href="/admin/promotions"
        className={`mt-3.5 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5 shadow-2xs transition hover:shadow-xs sm:mt-4 sm:px-4 ${
          pendingAdRequests.length > 0
            ? "border-amber-400 bg-gradient-to-l from-amber-50/90 to-white"
            : "border-gray-200/85 bg-white hover:border-amber-300"
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
              pendingAdRequests.length > 0
                ? "bg-amber-500 text-white"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            <Star className="size-4 shrink-0 fill-current" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-extrabold text-[#0a1122] sm:text-sm">
                {t.adRequests}
              </p>

              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-extrabold ${
                  pendingAdRequests.length > 0
                    ? "bg-red-600 text-white shadow-2xs"
                    : "bg-amber-100 text-amber-900"
                }`}
              >
                <span dir="ltr">{pendingAdRequests.length}</span>
                <span>{t.adPendingNote}</span>
              </span>

              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10.5px] font-bold text-[#105C50]">
                <span dir="ltr">{activeFeaturedUnits.length}</span>
                <span>{t.adActiveNote}</span>
              </span>
            </div>

            {pendingAdRequests.length > 0 && (
              <p className="mt-1 truncate text-[11px] font-bold text-amber-900">
                {t.adAlertPrefix}{" "}
                <span className="font-mono">
                  {pendingAdRequests
                    .map((p) => p.featured_fawry_code || "AD")
                    .join(" , ")}
                </span>
              </p>
            )}
          </div>
        </div>

        <span className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg bg-[#0a1122] px-3 text-[11px] font-bold text-white">
          <span>{t.openAdRequests}</span>
          <ArrowLeft className="size-3 rtl:rotate-0 ltr:rotate-180" />
        </span>
      </Link>

      {/* غرفة الصفقات المتفق عليها الجاهزة للتنفيذ */}
      {readyDeals.length > 0 && (
        <div className="mt-4 rounded-2xl border-2 border-[#105C50] bg-gradient-to-br from-[#effaf5] via-white to-[#f4fbf8] p-4 shadow-sm sm:p-5">
          <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-xl bg-[#105C50] text-white shadow-xs">
                <Handshake className="size-5" />
              </span>
              <div>
                <h2 className="text-sm font-black text-[#0a1122] sm:text-base">
                  🔥 {sm.readyDealsTitle} ({readyDeals.length})
                </h2>
                <p className="text-[11px] font-semibold text-[#105C50]">
                  {sm.readyDealsSubtitle}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {readyDeals.map(({ offer, unit }) => {
              const uCode = deriveUnitCode(unit.id)
              const cur = georgiaCurrency
              const agreedCash = Number(offer.offered_cash) || 0
              const commissionBase =
                Number(unit.contract_price) || agreedCash || 0
              const platformCommission = Math.round(commissionBase * 0.0125)

              const sellerWa = `${leadsDict.waGeneralPrefix} ${unit.name}، (${unit.project_name || t.defaultUnit} - ${uCode}) — ${sm.agreedCashLabel}: ${agreedCash.toLocaleString("en-US")} ${cur}`
              const buyerWa = `${leadsDict.waUnitLeadPrefix} ${offer.buyer_name || ""}، (${unit.project_name || t.defaultUnit} - ${uCode}) — ${sm.agreedCashLabel}: ${agreedCash.toLocaleString("en-US")} ${cur}`

              return (
                <div
                  key={offer.id}
                  className="rounded-xl border border-emerald-200 bg-white p-4 shadow-2xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded bg-[#0a1122] px-2 py-0.5 font-mono text-[10px] font-extrabold text-white">
                        {uCode}
                      </span>
                      <span className="text-xs font-black text-[#0a1122] sm:text-sm">
                        {unit.project_name || t.defaultUnit} ({unit.area || "—"})
                      </span>
                    </div>
                    <Link
                      href={`/admin/properties?unitId=${unit.id}`}
                      className="rounded-lg bg-emerald-100 px-2.5 py-1 text-[10.5px] font-extrabold text-[#105C50] hover:bg-emerald-200"
                    >
                      {sm.openDealUnitBtn}
                    </Link>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2.5 text-xs">
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-2.5">
                      <span className="block text-[10px] font-bold text-gray-400">
                        {sm.sellerPartyLabel}
                      </span>
                      <strong className="mt-0.5 block truncate font-extrabold text-[#0a1122]">
                        {unit.name}
                      </strong>
                      <span
                        dir="ltr"
                        className="mt-0.5 block font-mono text-[11px] text-gray-600"
                      >
                        {unit.phone}
                      </span>
                      <a
                        data-admin-client-wa="true"
                        href={`https://wa.me/${String(unit.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(sellerWa)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex h-7 w-full items-center justify-center gap-1 rounded-lg bg-[#25D366] px-2 text-[10.5px] font-extrabold text-white"
                      >
                        <MessageCircle className="size-3" />
                        <span>{sm.contactSellerWa}</span>
                      </a>
                    </div>

                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-2.5">
                      <span className="block text-[10px] font-bold text-gray-400">
                        {sm.buyerPartyLabel}
                      </span>
                      <strong className="mt-0.5 block truncate font-extrabold text-[#0a1122]">
                        {offer.buyer_name || "—"}
                      </strong>
                      <span
                        dir="ltr"
                        className="mt-0.5 block font-mono text-[11px] text-gray-600"
                      >
                        {offer.buyer_phone || "—"}
                      </span>
                      <a
                        data-admin-client-wa="true"
                        href={`https://wa.me/${String(offer.buyer_phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(buyerWa)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex h-7 w-full items-center justify-center gap-1 rounded-lg bg-[#25D366] px-2 text-[10.5px] font-extrabold text-white"
                      >
                        <MessageCircle className="size-3" />
                        <span>{sm.contactBuyerWa}</span>
                      </a>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#effaf5] px-3 py-2 text-xs">
                    <div>
                      <span className="text-[10.5px] text-gray-500">
                        {sm.agreedCashLabel}:{" "}
                      </span>
                      <strong
                        dir="ltr"
                        className="font-black text-[#105C50] tabular-nums"
                      >
                        {agreedCash.toLocaleString("en-US")} {cur}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10.5px] text-gray-500">
                        {sm.commissionDueLabel} (1.25%):{" "}
                      </span>
                      <strong
                        dir="ltr"
                        className="font-black text-[#0a1122] tabular-nums"
                      >
                        {platformCommission.toLocaleString("en-US")} {cur}
                      </strong>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* رادار حركة العروض الحية والتفاوض */}
      {liveNegotiationOffers.length > 0 && (
        <Card className="mt-4 border-gray-200/85 bg-white shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 px-4 py-3 sm:px-5">
            <div className="flex items-center gap-2">
              <Wallet className="size-4 text-[#105C50]" />
              <CardTitle className="text-xs font-extrabold text-[#0a1122] sm:text-sm">
                {sm.liveOffersFeedTitle} ({liveNegotiationOffers.length})
              </CardTitle>
            </div>
            <Link
              href="/admin/properties?tab=offer_received"
              className="text-xs font-bold text-[#105C50] hover:underline"
            >
              {t.viewAll}
            </Link>
          </CardHeader>
          <CardContent className="p-3">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {liveNegotiationOffers.map(({ offer, unit }) => {
                const uCode = deriveUnitCode(unit.id)
                const cur = georgiaCurrency
                const st = offer.status

                return (
                  <div
                    key={offer.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200/80 bg-gray-50/60 px-3 py-2 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded bg-[#0a1122] px-1.5 py-0.5 font-mono text-[9.5px] font-bold text-white">
                          {uCode}
                        </span>
                        <Link
                          href={`/admin/properties?unitId=${unit.id}`}
                          className="truncate font-extrabold text-[#0a1122] hover:text-[#105C50]"
                        >
                          {unit.project_name || t.defaultUnit}
                        </Link>
                        <span className="text-[11px] text-gray-400">←</span>
                        <span className="truncate font-bold text-[#105C50]">
                          {offer.buyer_name || "—"}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-600">
                        <span>
                          {sm.agreedCashLabel}:{" "}
                          <strong dir="ltr" className="text-[#0a1122]">
                            {Number(offer.offered_cash || 0).toLocaleString(
                              "en-US"
                            )}{" "}
                            {cur}
                          </strong>
                        </span>
                        {offer.counter_cash && (
                          <span className="font-bold text-purple-800">
                            (🔄{" "}
                            <span dir="ltr">
                              {Number(offer.counter_cash).toLocaleString(
                                "en-US"
                              )}
                            </span>{" "}
                            {cur})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      {st === "accepted" && (
                        <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-extrabold text-white">
                          ✓ {sm.offerAcceptedTag}
                        </span>
                      )}
                      {st === "pending_seller" && (
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-900">
                          ⏳ {sm.offerPendingTag}
                        </span>
                      )}
                      {st === "counter_offered" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-extrabold text-purple-900">
                          <RefreshCw className="size-2.5" />
                          <span>{sm.offerCounterTag}</span>
                        </span>
                      )}
                      {st === "rejected" && (
                        <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-extrabold text-red-700">
                          ✕ {sm.offerRejectedTag}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* الجداول السفلية */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="border-gray-200/80 bg-white shadow-2xs lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 px-4 py-3.5 sm:px-5">
            <div>
              <CardTitle className="text-sm font-extrabold text-[#0a1122]">
                {t.latestProperties} ({georgiaLabel})
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
                  const stKey = (prop.status ||
                    "pending") as keyof typeof t.statuses
                  const stLabel = t.statuses[stKey] || t.statuses.pending
                  const stCls =
                    STATUS_BADGE_CLASSES[prop.status || "pending"] ||
                    STATUS_BADGE_CLASSES.pending
                  const uCode = deriveUnitCode(prop.id)

                  const sellerWaMsg = `${leadsDict.waGeneralPrefix} ${prop.name}، (${prop.project_name || t.defaultUnit} - ${prop.area || ""} - ${uCode}) — ${Number(prop.paid_amount || 0).toLocaleString("en-US")} ${georgiaCurrency}`

                  return (
                    <div
                      key={prop.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200/80 bg-white px-3.5 py-2.5 transition hover:border-[#105C50]/50 hover:bg-gray-50/70"
                    >
                      <Link
                        href={`/admin/properties?unitId=${prop.id}`}
                        className="min-w-[160px] flex-1"
                      >
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-extrabold text-[#0a1122]">
                            {prop.project_name || t.defaultUnit}
                          </p>
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[9.5px] font-bold text-gray-600">
                            {uCode}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-gray-500">
                          {prop.area || "—"} · {prop.name} (
                          <span dir="ltr">{prop.phone}</span>)
                        </p>
                      </Link>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-[#105C50] tabular-nums">
                          {prop.paid_amount ? (
                            <>
                              <span dir="ltr">
                                {Number(prop.paid_amount).toLocaleString(
                                  "en-US"
                                )}
                              </span>{" "}
                              {georgiaCurrency}
                            </>
                          ) : (
                            "—"
                          )}
                        </span>
                        <Badge className={`text-[10px] ${stCls}`}>
                          {stLabel}
                        </Badge>
                        <Link
                          href={`/opportunities/${prop.id}`}
                          target="_blank"
                          title={t.viewAll}
                          className="inline-flex size-7 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-[#0a1122] hover:border-[#105C50] hover:text-[#105C50]"
                        >
                          <ExternalLink className="size-3.5" />
                        </Link>
                        <a
                          data-admin-client-wa="true"
                          href={`https://wa.me/${String(prop.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(sellerWaMsg)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex size-7 items-center justify-center rounded-lg bg-[#25D366] text-white hover:opacity-90"
                        >
                          <MessageCircle className="size-3.5" />
                        </a>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200/80 bg-white shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 px-4 py-3.5 sm:px-5">
            <CardTitle className="text-sm font-extrabold text-[#0a1122]">
              {t.latestLeads} ({georgiaLabel})
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
                const cleanTarget = areasText
                  .replace("🎯 مهتم بوحدة:", "")
                  .trim()
                const cashFormatted = Number(
                  lead.available_cash || lead.budget || 0
                ).toLocaleString("en-US")

                const buyerWaMsg = isUnitSpecific
                  ? `${leadsDict.waUnitLeadPrefix} ${lead.name}، ${leadsDict.waUnitLeadMiddle} (${cleanTarget}) — ${leadsDict.cashShort} ${cashFormatted} ${georgiaCurrency}. ${leadsDict.waUnitLeadSuffix}`
                  : `${leadsDict.waGeneralPrefix} ${lead.name}، ${leadsDict.waGeneralMiddle} (${cleanTarget || t.allAreas}) — ${leadsDict.cashShort} ${cashFormatted} ${georgiaCurrency}. ${leadsDict.waGeneralSuffix}`

                return (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between rounded-xl border border-gray-200/80 bg-white px-3.5 py-2.5 transition hover:border-[#105C50]/40"
                  >
                    <Link
                      href={`/admin/leads?leadId=${lead.id}`}
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
                        <span dir="ltr">{cashFormatted}</span> {georgiaCurrency}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-gray-400">
                        {cleanTarget}
                      </p>
                    </Link>
                    <a
                      data-admin-client-wa="true"
                      href={`https://wa.me/${String(lead.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(buyerWaMsg)}`}
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

/* ============================================================================
   ARCHIVED MULTI-COUNTRY ADMIN FILTER BAR (COMMENTED FOR FUTURE REFERENCE)
   ============================================================================

  const adminCountries = [
    { code: "ALL", label: t.countries.ALL, flag: "🌍" },
    { code: "EG", label: t.countries.EG, flag: "🇪🇬" },
    { code: "RU", label: t.countries.RU, flag: "🇷🇺" },
    { code: "GE", label: t.countries.GE, flag: "🇬🇪" },
    { code: "AE", label: t.countries.AE, flag: "🇦🇪" },
  ]

  // Multi-Country Filter Bar JSX:
  // <div className="mb-4 rounded-xl border border-gray-200/85 bg-white p-3.5 shadow-2xs sm:p-4">
  //   <div className="flex flex-wrap items-center justify-between gap-3">
  //     <div className="flex flex-wrap items-center gap-1.5">
  //       {adminCountries.map((c) => (
  //         <Link key={c.code} href={c.code === "ALL" ? "/admin" : `/admin?country=${c.code}`}>
  //           {c.flag} {c.label}
  //         </Link>
  //       ))}
  //     </div>
  //   </div>
  // </div>

============================================================================ */