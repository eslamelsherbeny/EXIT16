import Link from "next/link"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerClient } from "@supabase/ssr"
import {
  ArrowLeft,
  BellRing,
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock3,
  ExternalLink,
  FileText,
  Flame,
  Handshake,
  Send,
  Star,
  WalletCards,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  isSelfDealOffer,
  sanitizeGeorgiaProjectTitle,
} from "@/lib/offer-helpers"
import {
  extractUserIdFromCookie,
  parseAndVerifySessionCookie,
} from "@/lib/session-security"
import { getLocalizedGeorgiaAreaName } from "@/lib/smart-matcher"
import { getServerI18n } from "@/lib/get-server-dictionary"

export const dynamic = "force-dynamic"
export const revalidate = 0

const PENDING_ADMIN_TAG = "__PENDING_ADMIN_VERIFICATION__"

function WhatsAppOfficialIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12.031 2c-5.516 0-9.969 4.453-9.969 9.969 0 1.758.459 3.473 1.332 4.988L2 22l5.188-1.361c1.469.801 3.125 1.225 4.843 1.225 5.516 0 9.969-4.453 9.969-9.969S17.547 2 12.031 2zm5.82 14.129c-.244.688-1.422 1.314-1.977 1.396-.508.076-1.152.109-1.859-.115-.43-.137-.98-.32-1.688-.625-2.973-1.283-4.914-4.275-5.062-4.473-.148-.197-1.209-1.609-1.209-3.07 0-1.461.766-2.18 1.037-2.477.271-.297.592-.371.791-.371.197 0 .395.002.568.01.182.008.426-.068.666.508.246.592.84 2.049.914 2.197.074.148.123.32.025.518-.098.197-.148.32-.297.494-.148.172-.312.385-.445.518-.148.148-.303.309-.131.605.172.297.768 1.268 1.648 2.053 1.133 1.01 2.088 1.322 2.385 1.471.297.148.469.123.643-.074.172-.197.74-.863.938-1.16.197-.297.395-.246.666-.148.271.098 1.729.814 2.025.963.297.148.494.223.568.346.074.123.074.715-.17 1.403z" />
    </svg>
  )
}

const STATUS_BADGE_CLASSES: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  under_review: "border-blue-200 bg-blue-50 text-blue-800",
  active: "border-emerald-200 bg-[#eaf8f2] text-[#007a5a]",
  offer_received: "border-purple-200 bg-purple-50 text-purple-800",
  transferring: "border-indigo-200 bg-indigo-50 text-indigo-800",
  sold: "border-[#007a5a] bg-[#007a5a] text-white",
  rejected: "border-red-200 bg-red-50 text-red-700",
}

function normalizeUnitStatus(rawStatus?: string | null): string {
  const clean = String(rawStatus || "pending").trim().toLowerCase()
  if (clean === "approved" || clean === "published") return "active"
  return clean
}

function isUnitEligibleForOffers(status?: string | null): boolean {
  const st = normalizeUnitStatus(status)
  return (
    st === "active" ||
    st === "offer_received" ||
    st === "transferring" ||
    st === "sold"
  )
}

function deriveUnitCode(id: string, dbCode?: string | null) {
  if (dbCode && String(dbCode).trim()) return String(dbCode).trim()
  const numericCode = String(id || "")
    .replace(/\D/g, "")
    .slice(0, 5)
  const fallbackCode = String(id || "")
    .slice(0, 5)
    .toUpperCase()
  return `U-${numericCode.length >= 4 ? numericCode : fallbackCode}`
}

function cleanAreaDisplay(rawArea: string | null | undefined, locale: string) {
  const localized = getLocalizedGeorgiaAreaName(rawArea, locale)
  if (locale === "ar") {
    return localized.replace(/\s*\([A-Za-z0-9\s/-]+\)\s*$/g, "").trim()
  }
  return localized
}

function normalizeDashboardOffer(raw: any) {
  const rawDiffs = Array.isArray(raw.diff_reasons) ? raw.diff_reasons : []
  const hasPendingAdminTag = rawDiffs.includes(PENDING_ADMIN_TAG)

  let effectiveStatus = raw.status || "pending_admin"
  if (
    raw.status === "pending_admin" ||
    (raw.status === "recommended" &&
      (raw.initiated_by === "buyer" || hasPendingAdminTag))
  ) {
    effectiveStatus = "pending_admin"
  }

  return {
    ...raw,
    id: String(raw.id),
    property_id: String(raw.property_id),
    status: effectiveStatus,
  }
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
  const cookieStore = await cookies()
  const rawSession = cookieStore.get("user_session")?.value
  const candidateId = extractUserIdFromCookie(rawSession)

  if (!rawSession || !candidateId) {
    redirect("/login?next=/admin")
  }

  const supabase = await getSupabase()

  const { data: currentStaff } = await supabase
    .from("users")
    .select("role, status, password_hash")
    .eq("id", candidateId)
    .maybeSingle()

  if (
    !currentStaff ||
    currentStaff.status === "suspended" ||
    !parseAndVerifySessionCookie(rawSession, currentStaff.password_hash).valid
  ) {
    redirect("/login?expired=1")
  }

  const staffRole = String(currentStaff.role || "user").trim().toLowerCase()
  if (
    staffRole !== "owner" &&
    staffRole !== "admin" &&
    staffRole !== "moderator" &&
    staffRole !== "sales"
  ) {
    redirect("/account")
  }

  const { dict, locale, dir, siteSettings } = await getServerI18n()
  const t = (dict?.admin?.dashboard as Record<string, any>) || {}
  const L = (t.sections as Record<string, string>) || {}
  const nav = ((dict?.admin as Record<string, any>)?.shell?.nav ||
    {}) as Record<string, string>
  const statusesDict = (t.statuses as Record<string, string>) || {}
  const leadsDict = (dict?.admin?.leads as Record<string, any>) || {}
  const exportLabels = (dict?.admin?.exportLabels as Record<string, any>) || {}
  const cols = (exportLabels.cols as Record<string, string>) || {}
  const sm =
    ((dict?.admin as Record<string, any>)?.smartMatch as Record<string, any>) ||
    {}

  const georgiaCurrency = "$"
  const commPct = Number(siteSettings?.buyerCommission) || 1.25
  const listSep = dir === "rtl" ? "، " : ", "

  let propertiesData: any[] = []
  let leadsData: any[] = []
  let allOffersData: any[] = []

  try {
    const [propsRes, leadsRes, offersRes] = await Promise.all([
      supabase
        .from("sell_requests")
        .select("*")
        .not("status", "in", '("deleted_by_seller","draft_unverified")')
        .order("created_at", { ascending: false }),
      supabase
        .from("buy_requests")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("property_offers")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(80),
    ])

    propertiesData = (propsRes.data || []).filter(
      (p: any) =>
        p.status !== "deleted_by_seller" && p.status !== "draft_unverified"
    )
    leadsData = leadsRes.data || []
    allOffersData = offersRes.data || []
  } catch (err) {
    console.error("Error loading AdminPage data:", err)
  }

  const properties = propertiesData.map((p: any) => {
    const meta =
      p.documents && typeof p.documents === "object"
        ? p.documents.__unit_meta || {}
        : {}
    return {
      ...p,
      id: String(p.id),
      status: normalizeUnitStatus(p.status),
      project_name: sanitizeGeorgiaProjectTitle(p.project_name),
      area: p.area || meta.area || null,
      unit_type: p.unit_type || meta.unit_type || null,
      size: p.size ?? meta.size ?? null,
    }
  })

  const propsMap = new Map(properties.map((p: any) => [String(p.id), p]))

  const allOffers = allOffersData
    .map(normalizeDashboardOffer)
    .filter((o: any) => {
      if (o.status === "recommended" || o.status === "rejected") return false
      const unit = propsMap.get(String(o.property_id))
      if (!unit || isSelfDealOffer(o, unit)) return false
      if (!isUnitEligibleForOffers(unit.status)) return false
      return true
    })

  const unitsWithAcceptedOffer = new Set(
    allOffers
      .filter((o: any) => o.status === "accepted")
      .map((o: any) => String(o.property_id))
  )

  const readyDeals = allOffers
    .filter((o: any) => o.status === "accepted")
    .map((offer: any) => ({
      offer,
      unit: propsMap.get(String(offer.property_id)),
    }))
    .filter((item) => Boolean(item.unit) && item.unit.status !== "sold")

  const actionableOffers = allOffers
    .filter(
      (o: any) =>
        (o.status === "pending_admin" || o.status === "counter_offered") &&
        !unitsWithAcceptedOffer.has(String(o.property_id))
    )
    .map((offer: any) => ({
      offer,
      unit: propsMap.get(String(offer.property_id)),
    }))
    .filter((item) => Boolean(item.unit) && item.unit.status !== "sold")

  const totalOpenOffersCount = allOffers.filter((o: any) => {
    const u = propsMap.get(String(o.property_id))
    if (!u || u.status === "sold") return false
    return (
      o.status === "pending_admin" ||
      o.status === "pending_seller" ||
      o.status === "counter_offered"
    )
  }).length

  const pendingReviewProperties = properties.filter(
    (p) => !p.status || p.status === "pending" || p.status === "under_review"
  )

  const newUncontactedLeads = leadsData.filter((l: any) => {
    const st = String(l.status || "new").trim().toLowerCase()
    if (st !== "new" && st !== "") return false
    const hasAnyOffer = allOffers.some(
      (o: any) =>
        String(o.lead_id || "") === String(l.id) ||
        (l.user_id && String(o.buyer_user_id || "") === String(l.user_id))
    )
    return !hasAnyOffer
  })

  const pendingAdRequests = properties.filter(
    (p) => !p.is_featured && p.featured_status === "pending_payment"
  )
  const activeFeaturedUnits = properties.filter((p) => p.is_featured)

  const kpis = [
    {
      label: nav.offers || "",
      value: totalOpenOffersCount.toLocaleString("en-US"),
      note: `${actionableOffers.length} ${t.offersPendingYourApprovalNote || ""}`,
      icon: WalletCards,
      href: "/admin/offers",
      iconWrap: "bg-amber-50 text-amber-600",
      noteClass:
        actionableOffers.length > 0 ? "text-amber-700" : "text-slate-500",
    },
    {
      label: nav.deals || "",
      value: readyDeals.length.toLocaleString("en-US"),
      note: `${readyDeals.length} ${t.dealsReadyToCloseNote || ""}`,
      icon: Handshake,
      href: "/admin/deals",
      iconWrap: "bg-[#eaf8f2] text-[#007a5a]",
      noteClass: "text-[#007a5a]",
    },
    {
      label: t.pendingReview || "",
      value: pendingReviewProperties.length.toLocaleString("en-US"),
      note:
        pendingReviewProperties.length > 0
          ? t.pendingNeedAction || ""
          : t.allReviewed || "",
      icon: Clock3,
      href: "/admin/properties?tab=pending",
      iconWrap: "bg-amber-50 text-amber-600",
      noteClass:
        pendingReviewProperties.length > 0
          ? "text-amber-700"
          : "text-slate-500",
    },
    {
      label: t.totalBuyerLeads || nav.leads || "",
      value: newUncontactedLeads.length.toLocaleString("en-US"),
      note: `${leadsData.length.toLocaleString("en-US")} ${t.buyRequestsWord || ""}`,
      icon: FileText,
      href: "/admin/leads",
      iconWrap: "bg-blue-50 text-blue-600",
      noteClass:
        newUncontactedLeads.length > 0 ? "text-blue-700" : "text-slate-500",
    },
    {
      label: t.adRequests || "",
      value: pendingAdRequests.length.toLocaleString("en-US"),
      note:
        pendingAdRequests.length > 0
          ? `${pendingAdRequests.length} ${t.adPendingNote || ""}`
          : `${activeFeaturedUnits.length} ${t.adActiveNote || ""}`,
      icon: Star,
      href: "/admin/promotions",
      iconWrap: "bg-amber-50 text-amber-600",
      noteClass:
        pendingAdRequests.length > 0 ? "text-amber-700" : "text-slate-500",
    },
  ]

  return (
    <div dir={dir} className="mx-auto max-w-7xl space-y-5 text-start">
      {/* 1. صف الإحصائيات السريعة */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {kpis.map(
          (
            { label, value, note, icon: Icon, href, iconWrap, noteClass },
            idx
          ) => (
            <Link
              key={href}
              href={href}
              className={`group block h-full transition-transform duration-150 hover:-translate-y-0.5 ${
                idx === 4 ? "col-span-2 sm:col-span-1" : ""
              }`}
            >
              <Card className="h-full rounded-2xl border border-slate-200/90 bg-white shadow-2xs transition-all hover:border-[#007a5a]/40 hover:shadow-sm">
                <CardContent className="flex h-full flex-col justify-between p-3.5 sm:p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs leading-snug font-extrabold text-slate-700 group-hover:text-[#0f1d40]">
                      {label}
                    </p>
                    <span
                      className={`flex size-8 shrink-0 items-center justify-center rounded-xl sm:size-9 ${iconWrap}`}
                    >
                      <Icon className="size-4 shrink-0" />
                    </span>
                  </div>

                  <div
                    dir="ltr"
                    className="my-2.5 text-center text-2xl font-black tracking-tight text-[#0f1d40] tabular-nums sm:my-3 sm:text-3xl"
                  >
                    {value}
                  </div>

                  <div className="flex items-center justify-between gap-1.5 border-t border-slate-100 pt-2">
                    <span
                      className={`text-[11px] leading-tight font-bold ${noteClass}`}
                    >
                      {note}
                    </span>
                    <ArrowLeft className="size-3 shrink-0 text-slate-300 transition-colors group-hover:text-[#007a5a] rtl:rotate-0 ltr:rotate-180" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        )}
      </div>

      {/* 2. السيكشن الأول: صفقات متفق عليها جاهزة للتعاقد */}
      <details
        open={readyDeals.length > 0}
        className={`group overflow-hidden rounded-2xl bg-white shadow-2xs transition-all ${
          readyDeals.length > 0
            ? "border-2 border-emerald-200"
            : "border border-slate-200/90"
        }`}
      >
        <summary
          className={`flex cursor-pointer list-none flex-col gap-3 p-4 transition select-none sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-3.5 [&::-webkit-details-marker]:hidden ${
            readyDeals.length > 0
              ? "bg-[#eaf8f2]/65 group-open:border-b group-open:border-emerald-100"
              : "bg-white hover:bg-slate-50/70 group-open:border-b group-open:border-slate-100"
          }`}
        >
          <div className="flex items-start gap-3">
            <span
              className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl text-white shadow-2xs ${
                readyDeals.length > 0 ? "bg-[#007a5a]" : "bg-slate-400"
              }`}
            >
              <Handshake className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-black text-[#0f1d40] sm:text-base">
                  {L.sec1Title}
                </span>
                <span
                  dir="ltr"
                  className={`rounded-full px-2.5 py-0.5 text-xs font-black text-white ${
                    readyDeals.length > 0 ? "bg-[#007a5a]" : "bg-slate-400"
                  }`}
                >
                  {readyDeals.length}
                </span>
                {readyDeals.length === 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-500">
                    <CheckCircle2 className="size-3.5 text-emerald-500" />
                    <span>{L.sec1EmptyShort}</span>
                  </span>
                )}
              </div>
              {readyDeals.length > 0 && (
                <p className="mt-1 text-[11.5px] leading-relaxed font-semibold text-[#007a5a]">
                  {L.sec1Sub}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 self-end sm:self-center">
            <Link
              href="/admin/deals"
              className={`inline-flex h-8.5 items-center gap-1.5 rounded-xl px-3.5 text-xs font-extrabold transition ${
                readyDeals.length > 0
                  ? "bg-[#007a5a] text-white hover:bg-[#006248]"
                  : "border border-slate-200 bg-white text-[#0f1d40] hover:border-[#007a5a] hover:text-[#007a5a]"
              }`}
            >
              <span>{L.sec1Btn}</span>
              <ArrowLeft className="size-3.5 rtl:rotate-0 ltr:rotate-180" />
            </Link>
            <span className="flex size-8.5 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-500 transition group-hover:text-[#0f1d40]">
              <ChevronDown className="size-4 transition-transform duration-200 group-open:rotate-180" />
            </span>
          </div>
        </summary>

        <div>
          {readyDeals.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-5 text-xs font-bold text-slate-400">
              <CheckCircle2 className="size-4 text-emerald-500" />
              <span>{L.sec1Empty}</span>
            </div>
          ) : (
            <>
              {/* عرض الموبايل */}
              <div className="divide-y divide-slate-100 md:hidden">
                {readyDeals.map(({ offer, unit }) => {
                  const uCode = deriveUnitCode(unit.id, unit.code)
                  const cur = georgiaCurrency
                  const agreedCash = Number(offer.offered_cash) || 0
                  const commissionBase =
                    Number(unit.contract_price) || agreedCash || 0
                  const platformCommission = Math.round(
                    commissionBase * (commPct / 100)
                  )
                  const localizedArea = cleanAreaDisplay(unit.area, locale)

                  const sellerWa = `${leadsDict.waGeneralPrefix || ""} ${unit.name}${listSep}(${unit.project_name || t.defaultUnit || ""} - ${uCode}) — ${sm.agreedCashLabel || ""}: ${agreedCash.toLocaleString("en-US")} ${cur}`
                  const buyerWa = `${leadsDict.waUnitLeadPrefix || ""} ${offer.buyer_name || ""}${listSep}(${unit.project_name || t.defaultUnit || ""} - ${uCode}) — ${sm.agreedCashLabel || ""}: ${agreedCash.toLocaleString("en-US")} ${cur}`

                  return (
                    <div key={offer.id} className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="rounded-md bg-[#eaf8f2] px-2 py-0.5 font-mono text-[10.5px] font-black text-[#007a5a]">
                              {uCode}
                            </span>
                            <span className="text-xs font-extrabold text-[#0f1d40]">
                              {unit.project_name || t.defaultUnit}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                            {localizedArea}
                          </p>
                        </div>

                        <div className="shrink-0 text-end">
                          <strong
                            dir="ltr"
                            className="block text-sm font-black text-[#007a5a] tabular-nums"
                          >
                            {cur}
                            {agreedCash.toLocaleString("en-US")}
                          </strong>
                          <span className="text-[10px] font-bold text-slate-400">
                            {L.colCommission}:{" "}
                            <strong dir="ltr" className="text-[#0f1d40]">
                              {cur}
                              {platformCommission.toLocaleString("en-US")}
                            </strong>
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2">
                          <div className="min-w-0">
                            <span className="block text-[10px] font-bold text-slate-400">
                              {L.colSeller}
                            </span>
                            <p className="truncate text-xs font-extrabold text-[#0f1d40]">
                              {unit.name || "—"}
                            </p>
                            <p
                              dir="ltr"
                              className="text-start font-mono text-[11px] text-slate-500"
                            >
                              {unit.phone || "—"}
                            </p>
                          </div>
                          <a
                            data-admin-client-wa="true"
                            href={`https://wa.me/${String(unit.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(sellerWa)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex size-8.5 shrink-0 items-center justify-center rounded-xl bg-[#25D366] text-white shadow-2xs"
                          >
                            <WhatsAppOfficialIcon className="size-4" />
                          </a>
                        </div>

                        <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2">
                          <div className="min-w-0">
                            <span className="block text-[10px] font-bold text-slate-400">
                              {L.colBuyer}
                            </span>
                            <p className="truncate text-xs font-extrabold text-[#0f1d40]">
                              {offer.buyer_name || "—"}
                            </p>
                            <p
                              dir="ltr"
                              className="text-start font-mono text-[11px] text-slate-500"
                            >
                              {offer.buyer_phone || "—"}
                            </p>
                          </div>
                          <a
                            data-admin-client-wa="true"
                            href={`https://wa.me/${String(offer.buyer_phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(buyerWa)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex size-8.5 shrink-0 items-center justify-center rounded-xl bg-[#25D366] text-white shadow-2xs"
                          >
                            <WhatsAppOfficialIcon className="size-4" />
                          </a>
                        </div>
                      </div>

                      <Link
                        href={`/admin/deals?offerId=${offer.id}`}
                        className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-[#007a5a] text-xs font-extrabold text-white transition hover:bg-[#006248]"
                      >
                        <span>{L.btnCloseDeal}</span>
                        <ArrowLeft className="size-3.5 rtl:rotate-0 ltr:rotate-180" />
                      </Link>
                    </div>
                  )
                })}
              </div>

              {/* عرض الكمبيوتر */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-start text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-extrabold text-slate-500">
                      <th className="px-5 py-3 text-start">{L.colUnit}</th>
                      <th className="px-3 py-3 text-start">{L.colSeller}</th>
                      <th className="px-3 py-3 text-start">{L.colBuyer}</th>
                      <th className="px-3 py-3 text-start">{L.colAgreedCash}</th>
                      <th className="px-3 py-3 text-start">
                        {L.colCommission} ({commPct}%)
                      </th>
                      <th className="px-5 py-3 text-end">{L.colAction}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {readyDeals.map(({ offer, unit }) => {
                      const uCode = deriveUnitCode(unit.id, unit.code)
                      const cur = georgiaCurrency
                      const agreedCash = Number(offer.offered_cash) || 0
                      const commissionBase =
                        Number(unit.contract_price) || agreedCash || 0
                      const platformCommission = Math.round(
                        commissionBase * (commPct / 100)
                      )
                      const localizedArea = cleanAreaDisplay(unit.area, locale)

                      const sellerWa = `${leadsDict.waGeneralPrefix || ""} ${unit.name}${listSep}(${unit.project_name || t.defaultUnit || ""} - ${uCode}) — ${sm.agreedCashLabel || ""}: ${agreedCash.toLocaleString("en-US")} ${cur}`
                      const buyerWa = `${leadsDict.waUnitLeadPrefix || ""} ${offer.buyer_name || ""}${listSep}(${unit.project_name || t.defaultUnit || ""} - ${uCode}) — ${sm.agreedCashLabel || ""}: ${agreedCash.toLocaleString("en-US")} ${cur}`

                      return (
                        <tr
                          key={offer.id}
                          className="transition hover:bg-[#eaf8f2]/25"
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className="rounded-md bg-[#eaf8f2] px-2 py-0.5 font-mono text-[10.5px] font-black text-[#007a5a]">
                                {uCode}
                              </span>
                              <span className="font-extrabold text-[#0f1d40]">
                                {unit.project_name || t.defaultUnit}
                              </span>
                            </div>
                            <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                              {localizedArea}
                            </p>
                          </td>

                          <td className="px-3 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <a
                                data-admin-client-wa="true"
                                href={`https://wa.me/${String(unit.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(sellerWa)}`}
                                target="_blank"
                                rel="noreferrer"
                                title={sm.contactSellerWa}
                                className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#25D366] text-white shadow-2xs transition hover:bg-[#1ebe5d]"
                              >
                                <WhatsAppOfficialIcon className="size-4" />
                              </a>
                              <div className="min-w-0">
                                <p className="truncate font-extrabold text-[#0f1d40]">
                                  {unit.name || "—"}
                                </p>
                                <p
                                  dir="ltr"
                                  className="text-start font-mono text-[11px] text-slate-400"
                                >
                                  {unit.phone || "—"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-3 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <a
                                data-admin-client-wa="true"
                                href={`https://wa.me/${String(offer.buyer_phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(buyerWa)}`}
                                target="_blank"
                                rel="noreferrer"
                                title={sm.contactBuyerWa}
                                className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#25D366] text-white shadow-2xs transition hover:bg-[#1ebe5d]"
                              >
                                <WhatsAppOfficialIcon className="size-4" />
                              </a>
                              <div className="min-w-0">
                                <p className="truncate font-extrabold text-[#0f1d40]">
                                  {offer.buyer_name || "—"}
                                </p>
                                <p
                                  dir="ltr"
                                  className="text-start font-mono text-[11px] text-slate-400"
                                >
                                  {offer.buyer_phone || "—"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-3 py-3.5">
                            <strong
                              dir="ltr"
                              className="text-sm font-black text-[#007a5a] tabular-nums"
                            >
                              {cur}
                              {agreedCash.toLocaleString("en-US")}
                            </strong>
                          </td>

                          <td className="px-3 py-3.5">
                            <strong
                              dir="ltr"
                              className="rounded-md bg-[#eaf8f2] px-2.5 py-1 text-xs font-black text-[#007a5a] tabular-nums"
                            >
                              {cur}
                              {platformCommission.toLocaleString("en-US")}
                            </strong>
                          </td>

                          <td className="px-5 py-3.5 text-end">
                            <Link
                              href={`/admin/deals?offerId=${offer.id}`}
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#007a5a] px-3.5 text-[11px] font-extrabold text-white transition hover:bg-[#006248]"
                            >
                              <span>{L.btnCloseDeal}</span>
                              <ArrowLeft className="size-3 rtl:rotate-0 ltr:rotate-180" />
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </details>

      {/* 3. السيكشن الثاني: عروض جديدة وتفاوض نشط بانتظار تدخلك */}
      <details
        open={actionableOffers.length > 0}
        className={`group overflow-hidden rounded-2xl bg-white shadow-2xs transition-all ${
          actionableOffers.length > 0
            ? "border-2 border-amber-300"
            : "border border-slate-200/90"
        }`}
      >
        <summary
          className={`flex cursor-pointer list-none flex-col gap-3 p-4 transition select-none sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-3.5 [&::-webkit-details-marker]:hidden ${
            actionableOffers.length > 0
              ? "bg-amber-50/60 group-open:border-b group-open:border-amber-100"
              : "bg-white hover:bg-slate-50/70 group-open:border-b group-open:border-slate-100"
          }`}
        >
          <div className="flex items-start gap-3">
            <span
              className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl text-white shadow-2xs ${
                actionableOffers.length > 0 ? "bg-amber-500" : "bg-slate-400"
              }`}
            >
              <BellRing className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-black text-[#0f1d40] sm:text-base">
                  {L.sec2Title}
                </span>
                <span
                  dir="ltr"
                  className={`rounded-full px-2.5 py-0.5 text-xs font-black text-white ${
                    actionableOffers.length > 0
                      ? "bg-amber-500"
                      : "bg-slate-400"
                  }`}
                >
                  {actionableOffers.length}
                </span>
                {actionableOffers.length === 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-500">
                    <CheckCircle2 className="size-3.5 text-emerald-500" />
                    <span>{L.sec2EmptyShort}</span>
                  </span>
                )}
              </div>
              {actionableOffers.length > 0 && (
                <p className="mt-1 text-[11.5px] leading-relaxed font-semibold text-amber-900">
                  {L.sec2Sub}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 self-end sm:self-center">
            <Link
              href="/admin/offers"
              className="inline-flex h-8.5 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-extrabold text-[#0f1d40] transition hover:border-[#007a5a] hover:text-[#007a5a]"
            >
              <span>{L.sec2Btn}</span>
              <ArrowLeft className="size-3.5 rtl:rotate-0 ltr:rotate-180" />
            </Link>
            <span className="flex size-8.5 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-500 transition group-hover:text-[#0f1d40]">
              <ChevronDown className="size-4 transition-transform duration-200 group-open:rotate-180" />
            </span>
          </div>
        </summary>

        <div>
          {actionableOffers.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-5 text-xs font-bold text-slate-400">
              <CheckCircle2 className="size-4 text-emerald-500" />
              <span>{L.sec2Empty}</span>
            </div>
          ) : (
            <>
              {/* عرض الموبايل */}
              <div className="divide-y divide-slate-100 md:hidden">
                {actionableOffers.slice(0, 6).map(({ offer, unit }) => {
                  const uCode = deriveUnitCode(unit.id, unit.code)
                  const cur = georgiaCurrency
                  const isCounter = offer.status === "counter_offered"
                  const offeredCash = Number(offer.offered_cash) || 0
                  const counterCash = Number(offer.counter_cash) || 0
                  const originalCash =
                    Number(unit.paid_amount || offer.required_cash) || 0
                  const localizedArea = cleanAreaDisplay(unit.area, locale)

                  const buyerWa = `${leadsDict.waUnitLeadPrefix || ""} ${offer.buyer_name || ""}${listSep}(${unit.project_name || t.defaultUnit || ""} - ${uCode}) — ${sm.agreedCashLabel || ""}: ${offeredCash.toLocaleString("en-US")} ${cur}`
                  const sellerWa = `${leadsDict.waGeneralPrefix || ""} ${unit.name}${listSep}(${unit.project_name || t.defaultUnit || ""} - ${uCode}) — ${sm.agreedCashLabel || ""}: ${offeredCash.toLocaleString("en-US")} ${cur}`

                  return (
                    <div
                      key={offer.id}
                      className={`space-y-3 p-4 ${
                        isCounter ? "bg-purple-50/20" : "bg-amber-50/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-black text-[#0f1d40]">
                              {uCode}
                            </span>
                            <span className="text-xs font-extrabold text-[#0f1d40]">
                              {unit.project_name || t.defaultUnit}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                            {localizedArea}
                          </p>
                        </div>

                        <div className="shrink-0 text-end">
                          <strong
                            dir="ltr"
                            className="block text-sm font-black text-[#007a5a] tabular-nums"
                          >
                            {cur}
                            {offeredCash.toLocaleString("en-US")}
                          </strong>
                          {isCounter && counterCash > 0 ? (
                            <span className="text-[10.5px] font-extrabold text-purple-800">
                              →{" "}
                              <span dir="ltr">
                                {cur}
                                {counterCash.toLocaleString("en-US")}
                              </span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-slate-400">
                              {L.colOriginalCash}:{" "}
                              <span dir="ltr">
                                {cur}
                                {originalCash.toLocaleString("en-US")}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>

                      {isCounter ? (
                        <span className="inline-flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-[11px] font-extrabold text-purple-900">
                          <Flame className="size-3" />
                          <span>{L.negotiatingBadge}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-white px-2.5 py-1 text-[11px] font-extrabold text-amber-900">
                          <span>{L.newOfferBadge}</span>
                        </span>
                      )}

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-2">
                          <div className="min-w-0">
                            <span className="block text-[10px] font-bold text-slate-400">
                              {L.colBuyer}
                            </span>
                            <p className="truncate text-xs font-extrabold text-[#0f1d40]">
                              {offer.buyer_name || "—"}
                            </p>
                            <p
                              dir="ltr"
                              className="text-start font-mono text-[11px] text-slate-500"
                            >
                              {offer.buyer_phone || "—"}
                            </p>
                          </div>
                          <a
                            data-admin-client-wa="true"
                            href={`https://wa.me/${String(offer.buyer_phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(buyerWa)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex size-8.5 shrink-0 items-center justify-center rounded-xl bg-[#25D366] text-white shadow-2xs"
                          >
                            <WhatsAppOfficialIcon className="size-4" />
                          </a>
                        </div>

                        <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-2">
                          <div className="min-w-0">
                            <span className="block text-[10px] font-bold text-slate-400">
                              {L.colSeller}
                            </span>
                            <p className="truncate text-xs font-extrabold text-[#0f1d40]">
                              {unit.name || "—"}
                            </p>
                            <p
                              dir="ltr"
                              className="text-start font-mono text-[11px] text-slate-500"
                            >
                              {unit.phone || "—"}
                            </p>
                          </div>
                          <a
                            data-admin-client-wa="true"
                            href={`https://wa.me/${String(unit.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(sellerWa)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex size-8.5 shrink-0 items-center justify-center rounded-xl bg-[#25D366] text-white shadow-2xs"
                          >
                            <WhatsAppOfficialIcon className="size-4" />
                          </a>
                        </div>
                      </div>

                      <Link
                        href={`/admin/offers?offerId=${offer.id}`}
                        className={`flex h-9 w-full items-center justify-center gap-1.5 rounded-xl text-xs font-extrabold text-white transition ${
                          isCounter
                            ? "bg-purple-700 hover:bg-purple-800"
                            : "bg-amber-500 hover:bg-amber-600"
                        }`}
                      >
                        <Send className="size-3.5" />
                        <span>
                          {isCounter ? L.btnNegotiateNow : L.btnApproveOffer}
                        </span>
                        <ArrowLeft className="size-3.5 rtl:rotate-0 ltr:rotate-180" />
                      </Link>
                    </div>
                  )
                })}
              </div>

              {/* عرض الكمبيوتر */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-start text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-extrabold text-slate-500">
                      <th className="px-5 py-3 text-start">{L.colUnit}</th>
                      <th className="px-3 py-3 text-start">{L.colBuyer}</th>
                      <th className="px-3 py-3 text-start">{L.colSeller}</th>
                      <th className="px-3 py-3 text-start">
                        {L.colOfferedCash}
                      </th>
                      <th className="px-3 py-3 text-start">{L.colReadiness}</th>
                      <th className="px-5 py-3 text-end">{L.colAction}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {actionableOffers.slice(0, 6).map(({ offer, unit }) => {
                      const uCode = deriveUnitCode(unit.id, unit.code)
                      const cur = georgiaCurrency
                      const isCounter = offer.status === "counter_offered"
                      const offeredCash = Number(offer.offered_cash) || 0
                      const counterCash = Number(offer.counter_cash) || 0
                      const localizedArea = cleanAreaDisplay(unit.area, locale)

                      const buyerWa = `${leadsDict.waUnitLeadPrefix || ""} ${offer.buyer_name || ""}${listSep}(${unit.project_name || t.defaultUnit || ""} - ${uCode}) — ${sm.agreedCashLabel || ""}: ${offeredCash.toLocaleString("en-US")} ${cur}`
                      const sellerWa = `${leadsDict.waGeneralPrefix || ""} ${unit.name}${listSep}(${unit.project_name || t.defaultUnit || ""} - ${uCode}) — ${sm.agreedCashLabel || ""}: ${offeredCash.toLocaleString("en-US")} ${cur}`

                      return (
                        <tr
                          key={offer.id}
                          className={
                            isCounter
                              ? "bg-purple-50/20 transition hover:bg-purple-50/40"
                              : "bg-amber-50/20 transition hover:bg-amber-50/50"
                          }
                        >
                          <td className="px-5 py-3.5">
                            <Link
                              href={`/admin/offers?offerId=${offer.id}`}
                              className="block"
                            >
                              <div className="flex items-center gap-2">
                                <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-black text-[#0f1d40]">
                                  {uCode}
                                </span>
                                <span className="font-extrabold text-[#0f1d40] hover:text-[#007a5a]">
                                  {unit.project_name || t.defaultUnit}
                                </span>
                              </div>
                              <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                                {localizedArea}
                              </p>
                            </Link>
                          </td>

                          <td className="px-3 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <a
                                data-admin-client-wa="true"
                                href={`https://wa.me/${String(offer.buyer_phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(buyerWa)}`}
                                target="_blank"
                                rel="noreferrer"
                                title={sm.contactBuyerWa}
                                className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#25D366] text-white shadow-2xs transition hover:bg-[#1ebe5d]"
                              >
                                <WhatsAppOfficialIcon className="size-4" />
                              </a>
                              <div className="min-w-0">
                                <p className="truncate font-extrabold text-[#0f1d40]">
                                  {offer.buyer_name || "—"}
                                </p>
                                <p
                                  dir="ltr"
                                  className="text-start font-mono text-[11px] text-slate-400"
                                >
                                  {offer.buyer_phone || "—"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-3 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <a
                                data-admin-client-wa="true"
                                href={`https://wa.me/${String(unit.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(sellerWa)}`}
                                target="_blank"
                                rel="noreferrer"
                                title={sm.contactSellerWa}
                                className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#25D366] text-white shadow-2xs transition hover:bg-[#1ebe5d]"
                              >
                                <WhatsAppOfficialIcon className="size-4" />
                              </a>
                              <div className="min-w-0">
                                <p className="truncate font-bold text-slate-700">
                                  {unit.name || "—"}
                                </p>
                                <p
                                  dir="ltr"
                                  className="text-start font-mono text-[11px] text-slate-400"
                                >
                                  {unit.phone || "—"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-3 py-3.5">
                            <strong
                              dir="ltr"
                              className="text-sm font-black text-[#007a5a] tabular-nums"
                            >
                              {cur}
                              {offeredCash.toLocaleString("en-US")}
                            </strong>
                            {isCounter && counterCash > 0 && (
                              <p className="mt-0.5 text-[10.5px] font-extrabold text-purple-800">
                                →{" "}
                                <span dir="ltr">
                                  {cur}
                                  {counterCash.toLocaleString("en-US")}
                                </span>
                              </p>
                            )}
                          </td>

                          <td className="px-3 py-3.5">
                            {isCounter ? (
                              <span className="inline-flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-[11px] font-extrabold text-purple-900">
                                <Flame className="size-3" />
                                <span>{L.negotiatingBadge}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-white px-2.5 py-1 text-[11px] font-extrabold text-amber-900">
                                <span>{L.newOfferBadge}</span>
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-3.5 text-end">
                            <Link
                              href={`/admin/offers?offerId=${offer.id}`}
                              className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3.5 text-[11px] font-extrabold text-white shadow-2xs transition ${
                                isCounter
                                  ? "bg-purple-700 hover:bg-purple-800"
                                  : "bg-amber-500 hover:bg-amber-600"
                              }`}
                            >
                              <Send className="size-3" />
                              <span>
                                {isCounter
                                  ? L.btnNegotiateNow
                                  : L.btnApproveOffer}
                              </span>
                              <ArrowLeft className="size-3 rtl:rotate-0 ltr:rotate-180" />
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </details>

      {/* 4. السيكشن الثالث: وحدات بانتظار المراجعة فقط + طلبات شراء جديدة فقط */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs lg:col-span-7">
          <CardHeader className="flex flex-row items-center justify-between gap-2 border-b border-slate-100 px-4 py-3.5 sm:px-5 sm:py-4">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Clock3 className="size-4" />
              </span>
              <CardTitle className="truncate text-sm font-black text-[#0f1d40]">
                {L.pendingUnitsTitle} ({pendingReviewProperties.length})
              </CardTitle>
            </div>
            <Link
              href="/admin/properties?tab=pending"
              className="inline-flex shrink-0 items-center gap-1 text-xs font-extrabold text-[#007a5a] hover:underline"
            >
              <span>{t.viewAll}</span>
              <ArrowLeft className="size-3.5 rtl:rotate-0 ltr:rotate-180" />
            </Link>
          </CardHeader>

          <CardContent className="p-0">
            {pendingReviewProperties.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-10 text-xs font-bold text-slate-400">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <span>{L.pendingUnitsEmpty}</span>
              </div>
            ) : (
              <>
                <div className="divide-y divide-slate-100 md:hidden">
                  {pendingReviewProperties.slice(0, 6).map((prop) => {
                    const stKey = normalizeUnitStatus(prop.status)
                    const stLabel =
                      statusesDict[stKey] || statusesDict.pending || stKey
                    const stCls =
                      STATUS_BADGE_CLASSES[stKey] ||
                      STATUS_BADGE_CLASSES.pending
                    const uCode = deriveUnitCode(prop.id, prop.code)
                    const localizedArea = cleanAreaDisplay(prop.area, locale)
                    const sellerWaMsg = `${leadsDict.waGeneralPrefix || ""} ${prop.name}${listSep}(${prop.project_name || t.defaultUnit || ""} - ${localizedArea} - ${uCode}) — $${Number(prop.paid_amount || 0).toLocaleString("en-US")}`

                    return (
                      <div key={prop.id} className="space-y-2.5 p-3.5">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/admin/properties?unitId=${prop.id}`}
                            className="min-w-0 flex-1"
                          >
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-black text-[#0f1d40]">
                                {uCode}
                              </span>
                              <span className="text-xs font-extrabold text-[#0f1d40]">
                                {prop.project_name || t.defaultUnit}
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] font-medium text-slate-500">
                              {localizedArea} · {prop.name || "—"}
                            </p>
                          </Link>

                          <Badge
                            className={`shrink-0 border text-[10px] font-extrabold ${stCls}`}
                          >
                            {stLabel}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                          <span
                            dir="ltr"
                            className="text-sm font-black text-[#007a5a] tabular-nums"
                          >
                            {prop.paid_amount
                              ? `$${Number(prop.paid_amount).toLocaleString("en-US")}`
                              : "—"}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/admin/properties?unitId=${prop.id}`}
                              className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600"
                            >
                              <ExternalLink className="size-3.5" />
                            </Link>
                            <a
                              data-admin-client-wa="true"
                              href={`https://wa.me/${String(prop.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(sellerWaMsg)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex size-8 items-center justify-center rounded-lg bg-[#25D366] text-white shadow-2xs"
                            >
                              <WhatsAppOfficialIcon className="size-4" />
                            </a>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-start text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-extrabold text-slate-500">
                        <th className="px-5 py-3 text-start">{L.colUnit}</th>
                        <th className="px-3 py-3 text-start">
                          {cols.sellerName || L.colSeller}
                        </th>
                        <th className="px-3 py-3 text-start">
                          {cols.requiredCash || ""}
                        </th>
                        <th className="px-3 py-3 text-start">
                          {cols.status || ""}
                        </th>
                        <th className="px-5 py-3 text-end"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pendingReviewProperties.slice(0, 6).map((prop) => {
                        const stKey = normalizeUnitStatus(prop.status)
                        const stLabel =
                          statusesDict[stKey] || statusesDict.pending || stKey
                        const stCls =
                          STATUS_BADGE_CLASSES[stKey] ||
                          STATUS_BADGE_CLASSES.pending
                        const uCode = deriveUnitCode(prop.id, prop.code)
                        const localizedArea = cleanAreaDisplay(
                          prop.area,
                          locale
                        )
                        const sellerWaMsg = `${leadsDict.waGeneralPrefix || ""} ${prop.name}${listSep}(${prop.project_name || t.defaultUnit || ""} - ${localizedArea} - ${uCode}) — $${Number(prop.paid_amount || 0).toLocaleString("en-US")}`

                        return (
                          <tr
                            key={prop.id}
                            className="group transition hover:bg-slate-50/80"
                          >
                            <td className="px-5 py-3.5">
                              <Link
                                href={`/admin/properties?unitId=${prop.id}`}
                                className="block"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-black text-[#0f1d40]">
                                    {uCode}
                                  </span>
                                  <span className="font-extrabold text-[#0f1d40] group-hover:text-[#007a5a]">
                                    {prop.project_name || t.defaultUnit}
                                  </span>
                                </div>
                                <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                                  {localizedArea}
                                </p>
                              </Link>
                            </td>

                            <td className="px-3 py-3.5">
                              <p className="font-bold text-slate-700">
                                {prop.name || "—"}
                              </p>
                              <p
                                dir="ltr"
                                className="text-start font-mono text-[11px] text-slate-400"
                              >
                                {prop.phone || "—"}
                              </p>
                            </td>

                            <td className="px-3 py-3.5">
                              <span
                                dir="ltr"
                                className="font-black text-[#007a5a] tabular-nums"
                              >
                                {prop.paid_amount
                                  ? `$${Number(prop.paid_amount).toLocaleString("en-US")}`
                                  : "—"}
                              </span>
                            </td>

                            <td className="px-3 py-3.5">
                              <Badge
                                className={`border text-[10px] font-extrabold ${stCls}`}
                              >
                                {stLabel}
                              </Badge>
                            </td>

                            <td className="px-5 py-3.5 text-end">
                              <div className="inline-flex items-center justify-end gap-1.5">
                                <Link
                                  href={`/admin/properties?unitId=${prop.id}`}
                                  className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-[#007a5a] hover:text-[#007a5a]"
                                >
                                  <ExternalLink className="size-3.5" />
                                </Link>
                                <a
                                  data-admin-client-wa="true"
                                  href={`https://wa.me/${String(prop.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(sellerWaMsg)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex size-8 items-center justify-center rounded-lg bg-[#25D366] text-white shadow-2xs transition hover:bg-[#1ebe5d]"
                                >
                                  <WhatsAppOfficialIcon className="size-4" />
                                </a>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs lg:col-span-5">
          <CardHeader className="flex flex-row items-center justify-between gap-2 border-b border-slate-100 px-4 py-3.5 sm:px-5 sm:py-4">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <FileText className="size-4" />
              </span>
              <CardTitle className="truncate text-sm font-black text-[#0f1d40]">
                {L.newLeadsTitle} ({newUncontactedLeads.length})
              </CardTitle>
            </div>
            <Link
              href="/admin/leads"
              className="inline-flex shrink-0 items-center gap-1 text-xs font-extrabold text-[#007a5a] hover:underline"
            >
              <span>{t.allShort}</span>
              <ArrowLeft className="size-3.5 rtl:rotate-0 ltr:rotate-180" />
            </Link>
          </CardHeader>

          <CardContent className="p-0">
            {newUncontactedLeads.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-10 text-xs font-bold text-slate-400">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <span>{L.newLeadsEmpty}</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {newUncontactedLeads.slice(0, 6).map((lead: any) => {
                  const areasList = Array.isArray(lead.preferred_areas)
                    ? lead.preferred_areas
                    : lead.preferred_areas
                      ? [String(lead.preferred_areas)]
                      : []
                  const cleanTarget =
                    areasList
                      .map((a: string) =>
                        cleanAreaDisplay(
                          a.replace(/الرحاب/g, "King David Residences"),
                          locale
                        )
                      )
                      .join(listSep) || t.allAreas
                  const cashFormatted = Number(
                    lead.available_cash || lead.budget || 0
                  ).toLocaleString("en-US")
                  const leadInitial = (
                    String(lead.name || "B").trim().charAt(0) || "B"
                  ).toUpperCase()

                  const buyerWaMsg = `${leadsDict.waGeneralPrefix || ""} ${lead.name}${listSep}${leadsDict.waGeneralMiddle || ""} (${cleanTarget || t.allAreas || ""}) — ${leadsDict.cashShort || ""} $${cashFormatted}. ${leadsDict.waGeneralSuffix || ""}`

                  return (
                    <div
                      key={lead.id}
                      className="flex items-center justify-between gap-3 px-4 py-3.5 transition hover:bg-slate-50/80"
                    >
                      <Link
                        href={`/admin/leads?leadId=${lead.id}`}
                        className="flex min-w-0 flex-1 items-start gap-3"
                      >
                        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xs font-black text-blue-700">
                          {leadInitial}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-extrabold text-[#0f1d40]">
                            {lead.name}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <span
                              dir="ltr"
                              className="rounded-md bg-[#eaf8f2] px-2 py-0.5 text-[10.5px] font-black text-[#007a5a] tabular-nums"
                            >
                              ${cashFormatted}
                            </span>
                          </div>
                          <p className="mt-1 truncate text-[11px] font-medium text-slate-400">
                            {cleanTarget}
                          </p>
                        </div>
                      </Link>

                      <a
                        data-admin-client-wa="true"
                        href={`https://wa.me/${String(lead.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(buyerWaMsg)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex size-8.5 shrink-0 items-center justify-center rounded-xl bg-[#25D366] text-white shadow-2xs transition hover:bg-[#1ebe5d]"
                      >
                        <WhatsAppOfficialIcon className="size-4" />
                      </a>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}