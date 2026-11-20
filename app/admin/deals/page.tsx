"use client"

import { Suspense, useEffect, useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  FileText,
  Handshake,
  Loader2,
  Lock,
  MoreVertical,
  RefreshCw,
  RotateCcw,
  Search,
  Trophy,
  Users,
  Wallet,
  X,
} from "lucide-react"
import {
  adminGetDealsRoomDataAction,
  adminManageOfferLifecycleAction,
} from "@/actions/offer-actions"
import {
  downloadExcelCsv,
  downloadOfficialPdfReport,
  EXPORT_LABELS,
} from "@/lib/export-csv"
import { getLocalizedGeorgiaAreaName } from "@/components/shared/georgia-areas"
import { getCurrencySymbol, useTranslation } from "@/lib/i18n"

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

function generateOfferRefCode(offerId: string): string {
  const clean = String(offerId || "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
  return `OF-${clean.slice(0, 6) || "1001"}`
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
  const localized = getLocalizedGeorgiaAreaName(rawArea, locale as any)
  if (locale === "ar") {
    return localized.replace(/\s*\([A-Za-z0-9\s/-]+\)\s*$/g, "").trim()
  }
  return localized
}

function isSelfOfferClient(offer: any, unit: any): boolean {
  if (!offer || !unit) return false
  if (
    offer.buyer_user_id &&
    unit.user_id &&
    String(offer.buyer_user_id) === String(unit.user_id)
  ) {
    return true
  }
  const bPhone = String(offer.buyer_phone || "").replace(/\D/g, "")
  const sPhone = String(unit.phone || "").replace(/\D/g, "")
  if (
    bPhone.length >= 8 &&
    sPhone.length >= 8 &&
    bPhone.slice(-8) === sPhone.slice(-8)
  ) {
    return true
  }
  return false
}

function normalizeDealOffer(raw: any) {
  const rawDiffs = Array.isArray(raw?.diff_reasons) ? raw.diff_reasons : []
  const hasPendingAdminTag = rawDiffs.includes(PENDING_ADMIN_TAG)
  let effectiveStatus = raw?.status || "pending_admin"

  if (
    raw?.status === "pending_admin" ||
    (raw?.status === "recommended" &&
      (raw?.initiated_by === "buyer" || hasPendingAdminTag))
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

function AdminDealsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const targetOfferId = searchParams.get("offerId")
  const initialTabParam = searchParams.get("tab")

  const { t: dict, locale, dir, isRtl, siteSettings } = useTranslation()
  const adminDict = (dict?.admin as Record<string, any>) || {}
  const d = (adminDict.dealsPage as Record<string, any>) || {}
  const sm = (adminDict.smartMatch as Record<string, any>) || {}
  const expL = EXPORT_LABELS[locale] || EXPORT_LABELS.ar
  const commaSep = isRtl ? "، " : ", "

  const cur = getCurrencySymbol("GE", locale)
  const commPct = Number(siteSettings?.buyerCommission) || 1.25

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [allOffers, setAllOffers] = useState<any[]>([])
  const [unitsMap, setUnitsMap] = useState<Record<string, any>>({})
  const [search, setSearch] = useState("")
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [expandedWaitlistIds, setExpandedWaitlistIds] = useState<
    Record<string, boolean>
  >({})
  const [activeTab, setActiveTab] = useState<"closing" | "sold">(
    initialTabParam === "sold" ? "sold" : "closing"
  )

  const [confirmingAction, setConfirmingAction] = useState<{
    offerId: string
    action: "reopen_unit_offers" | "mark_unit_sold"
    label: string
  } | null>(null)

  const [notice, setNotice] = useState<{
    text: string
    isError?: boolean
  } | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const closeMenu = () => setOpenMenuId(null)
    window.addEventListener("click", closeMenu)
    return () => window.removeEventListener("click", closeMenu)
  }, [])

  async function loadDeals() {
    setLoading(true)
    setLoadError(false)
    try {
      const res = await adminGetDealsRoomDataAction()
      if (!res.authorized) {
        setLoadError(true)
        return
      }

      const uMap: Record<string, any> = {}
      ;(res.units || []).forEach((u: any) => {
        const st = String(u.status || "").trim().toLowerCase()
        if (
          st !== "draft_unverified" &&
          st !== "pending" &&
          st !== "under_review" &&
          st !== "rejected" &&
          st !== "paused_by_seller" &&
          st !== "deleted_by_seller"
        ) {
          uMap[String(u.id)] = u
        }
      })

      const normalized = (res.offers || [])
        .map(normalizeDealOffer)
        .filter((o: any) => {
          if (o.status === "recommended") return false
          const u = uMap[String(o.property_id)]
          if (!u || isSelfOfferClient(o, u)) return false
          return true
        })

      // لو الرابط بيشاور على عرض لسه في مرحلة التفاوض (مش صفقة مقبولة)، نحوّله تلقائياً لصفحة العروض
      if (targetOfferId) {
        const found = normalized.find(
          (o: any) => String(o.id) === String(targetOfferId)
        )
        if (found && found.status !== "accepted") {
          router.replace(`/admin/offers?offerId=${targetOfferId}`)
          return
        }
        if (found) {
          const foundUnit = uMap[String(found.property_id)]
          setActiveTab(foundUnit?.status === "sold" ? "sold" : "closing")
          setTimeout(() => {
            document
              .getElementById(`deal-card-${targetOfferId}`)
              ?.scrollIntoView({ behavior: "smooth", block: "center" })
          }, 250)
        }
      }

      setUnitsMap(uMap)
      setAllOffers(normalized)
    } catch (e) {
      console.error("Error loading deals:", e)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDeals()
  }, [targetOfferId])

  const handleLifecycleAction = (
    offerId: string,
    action: "reopen_unit_offers" | "mark_unit_sold",
    successText: string
  ) => {
    setProcessingId(offerId)
    setConfirmingAction(null)
    setNotice(null)
    startTransition(async () => {
      try {
        const res = await adminManageOfferLifecycleAction({
          offerId,
          action,
        })
        if (res.success) {
          setNotice({ text: successText })
          await loadDeals()
          router.refresh()
        } else {
          setNotice({
            text: res.error || d.actionErrorFallback,
            isError: true,
          })
        }
      } finally {
        setProcessingId(null)
      }
    })
  }

  const acceptedDeals = useMemo(() => {
    return allOffers.filter(
      (o) => o.status === "accepted" && Boolean(unitsMap[String(o.property_id)])
    )
  }, [allOffers, unitsMap])

  const waitlistByPropertyId = useMemo(() => {
    const map: Record<string, any[]> = {}
    for (const o of allOffers) {
      if (o.status !== "unit_locked") continue
      const pid = String(o.property_id)
      if (!map[pid]) map[pid] = []
      map[pid].push(o)
    }
    Object.keys(map).forEach((pid) => {
      map[pid].sort(
        (a, b) => Number(b.offered_cash || 0) - Number(a.offered_cash || 0)
      )
    })
    return map
  }, [allOffers])

  const stats = useMemo(() => {
    let closingCount = 0
    let soldCount = 0
    let expectedComm = 0
    let collectedComm = 0

    for (const o of acceptedDeals) {
      const unit = unitsMap[String(o.property_id)]
      if (!unit) continue
      const contract =
        Number(unit.contract_price || unit.paid_amount || o.offered_cash) || 0
      const fee = Math.round(contract * (commPct / 100))
      if (unit.status === "sold") {
        soldCount++
        collectedComm += fee
      } else {
        closingCount++
        expectedComm += fee
      }
    }

    return { closingCount, soldCount, expectedComm, collectedComm }
  }, [acceptedDeals, unitsMap, commPct])

  const filteredDeals = useMemo(() => {
    return acceptedDeals
      .filter((o) => {
        const unit = unitsMap[String(o.property_id)]
        if (!unit) return false
        const isSold = unit.status === "sold"
        if (activeTab === "closing" && isSold) return false
        if (activeTab === "sold" && !isSold) return false

        if (search.trim()) {
          const q = search.trim().toLowerCase()
          const qDigits = q.replace(/\D/g, "")
          const buyerDigits = String(o.buyer_phone || "").replace(/\D/g, "")
          const sellerDigits = String(unit.phone || "").replace(/\D/g, "")
          const refCode = generateOfferRefCode(o.id).toLowerCase()
          const uCode = deriveUnitCode(unit.id, unit.code).toLowerCase()
          const haystack =
            `${o.id} ${refCode} ${uCode} ${o.buyer_name || ""} ${o.buyer_phone || ""} ${unit.project_name || ""} ${unit.name || ""} ${unit.phone || ""}`.toLowerCase()
          const phoneMatched =
            qDigits.length >= 5 &&
            (buyerDigits.includes(qDigits) || sellerDigits.includes(qDigits))

          if (!haystack.includes(q) && !phoneMatched) return false
        }

        return true
      })
      .sort(
        (a, b) =>
          new Date(b.updated_at || b.created_at || 0).getTime() -
          new Date(a.updated_at || a.created_at || 0).getTime()
      )
  }, [acceptedDeals, unitsMap, activeTab, search])

  function exportDealsReport(
    rowsToExport: any[],
    format: "excel" | "pdf" = "excel",
    prefix = "AqarExit_Deals",
    customTitle?: string
  ) {
    const c = expL.cols
    const resolvedTitle =
      customTitle ||
      (rowsToExport.length === 1
        ? `${expL.singleDealReportTitle} — ${generateOfferRefCode(rowsToExport[0].id)}`
        : d.dealsPageTitle || expL.dealsReportTitle)

    const columns = [
      { header: c.index, accessor: (_: any, idx: number) => idx + 1 },
      { header: c.offerRef, accessor: (o: any) => generateOfferRefCode(o.id) },
      {
        header: c.unitCode,
        accessor: (o: any) => {
          const u = unitsMap[String(o.property_id)]
          return u ? deriveUnitCode(u.id, u.code) : "—"
        },
      },
      {
        header: c.projectName,
        accessor: (o: any) =>
          unitsMap[String(o.property_id)]?.project_name || d.unitFallback,
      },
      {
        header: c.area,
        accessor: (o: any) =>
          cleanAreaDisplay(unitsMap[String(o.property_id)]?.area, locale),
      },
      {
        header: c.buyerName,
        accessor: (o: any) => o.buyer_name || d.buyerFallback,
      },
      {
        header: c.buyerPhone,
        accessor: (o: any) => o.buyer_phone || "—",
        isPhone: true,
      },
      {
        header: c.sellerName,
        accessor: (o: any) =>
          unitsMap[String(o.property_id)]?.name || d.sellerFallback,
      },
      {
        header: c.sellerPhone,
        accessor: (o: any) => unitsMap[String(o.property_id)]?.phone || "—",
        isPhone: true,
      },
      {
        header: c.offeredCash,
        accessor: (o: any) => Number(o.offered_cash || 0),
      },
      {
        header: c.commission,
        accessor: (o: any) => {
          const u = unitsMap[String(o.property_id)]
          const contract =
            Number(u?.contract_price || u?.paid_amount || o.offered_cash) || 0
          return Math.round(contract * (commPct / 100))
        },
      },
      {
        header: c.status,
        accessor: (o: any) =>
          unitsMap[String(o.property_id)]?.status === "sold"
            ? d.statusSoldDone
            : d.statusAcceptedReady,
      },
      {
        header: c.createdAt,
        accessor: (o: any) =>
          o.created_at
            ? new Date(o.created_at).toLocaleDateString("en-GB")
            : "—",
      },
    ]

    if (format === "pdf") {
      downloadOfficialPdfReport({
        filenamePrefix: `${prefix}_${locale.toUpperCase()}`,
        reportTitle: resolvedTitle,
        locale,
        columns,
        data: rowsToExport,
      })
    } else {
      downloadExcelCsv({
        filenamePrefix: `${prefix}_${locale.toUpperCase()}`,
        reportTitle: resolvedTitle,
        locale,
        columns,
        data: rowsToExport,
      })
    }
  }

  return (
    <div dir={dir} className="mx-auto max-w-6xl space-y-4 text-start">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white px-5 py-4 shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#eaf8f2] px-3 py-1 text-[11px] font-extrabold text-[#007a5a]">
            <Handshake className="size-3.5" />
            <span>{d.dealsPageEyebrow}</span>
          </div>
          <h1 className="mt-1 text-lg font-black text-[#0f1d40] sm:text-xl">
            {d.dealsPageTitle}
          </h1>
          <p className="mt-0.5 text-xs font-medium text-slate-500">
            {d.dealsPageSubtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={filteredDeals.length === 0}
            onClick={() =>
              exportDealsReport(
                filteredDeals,
                "excel",
                "AqarExit_Deals_Sales",
                d.dealsPageTitle
              )
            }
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-emerald-200 bg-[#eaf8f2] px-3.5 text-xs font-extrabold text-[#007a5a] transition hover:bg-[#007a5a] hover:text-white disabled:opacity-40"
          >
            <Download className="size-3.5" />
            <span>{expL.exportAllBtn}</span>
          </button>

          <button
            type="button"
            disabled={filteredDeals.length === 0}
            onClick={() =>
              exportDealsReport(
                filteredDeals,
                "pdf",
                "AqarExit_Deals_Sales",
                d.dealsPageTitle
              )
            }
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-800 px-3.5 text-xs font-extrabold text-white transition hover:bg-slate-900 disabled:opacity-40"
          >
            <FileText className="size-3.5 text-emerald-300" />
            <span>{expL.exportPdfBtn}</span>
          </button>

          <Link
            href="/admin/offers"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-extrabold text-[#0f1d40] shadow-2xs hover:bg-slate-50"
          >
            {isRtl ? (
              <ArrowRight className="size-3.5" />
            ) : (
              <ArrowLeft className="size-3.5" />
            )}
            <span>{d.offersPageTitle}</span>
          </Link>
        </div>
      </div>

      {/* ملخص العمولات المتوقعة والمكتملة */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-[#eaf8f2]/70 p-4 shadow-2xs">
          <div>
            <span className="text-xs font-extrabold text-[#007a5a]">
              {d.expectedCommissionsLabel} ({stats.closingCount})
            </span>
            <strong
              dir="ltr"
              className="mt-1 block text-2xl font-black text-[#0f1d40] tabular-nums"
            >
              {stats.expectedComm.toLocaleString("en-US")} {cur}
            </strong>
          </div>
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#007a5a] text-white">
            <Handshake className="size-5" />
          </span>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div>
            <span className="text-xs font-extrabold text-slate-500">
              {d.collectedCommissionsLabel} ({stats.soldCount})
            </span>
            <strong
              dir="ltr"
              className="mt-1 block text-2xl font-black text-[#007a5a] tabular-nums"
            >
              {stats.collectedComm.toLocaleString("en-US")} {cur}
            </strong>
          </div>
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#0f1d40] text-emerald-300">
            <Trophy className="size-5" />
          </span>
        </div>
      </div>

      {notice && (
        <div
          className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 text-xs font-extrabold shadow-xs sm:text-sm ${
            notice.isError
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-[#eaf8f2] text-[#007a5a]"
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.isError ? (
              <AlertTriangle className="size-4 shrink-0" />
            ) : (
              <CheckCircle2 className="size-4 shrink-0" />
            )}
            <span>{notice.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="rounded-lg p-1 opacity-70 hover:bg-black/5"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs sm:flex-1">
          <Search className="pointer-events-none absolute top-1/2 end-3 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={d.searchPlaceholder}
            className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 ps-3 pe-9 text-xs font-semibold focus:border-[#007a5a] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab("closing")}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-extrabold transition ${
              activeTab === "closing"
                ? "bg-[#007a5a] text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-[#0f1d40]"
            }`}
          >
            {d.tabDealsClosing} ({stats.closingCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("sold")}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-extrabold transition ${
              activeTab === "sold"
                ? "bg-[#0f1d40] text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-[#0f1d40]"
            }`}
          >
            {d.tabDealsSold} ({stats.soldCount})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-slate-200 bg-white p-10">
          <div className="flex items-center gap-2 text-xs font-bold text-[#007a5a]">
            <Loader2 className="size-5 animate-spin" />
            <span>{d.loadingText}</span>
          </div>
        </div>
      ) : loadError ? (
        <div className="rounded-2xl border border-red-200 bg-white p-10 text-center">
          <AlertTriangle className="mx-auto mb-3 size-8 text-red-500" />
          <p className="text-sm font-extrabold text-[#0f1d40]">
            {d.actionErrorFallback}
          </p>
          <button
            type="button"
            onClick={loadDeals}
            className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#007a5a] px-5 text-xs font-extrabold text-white hover:bg-[#006248]"
          >
            <RefreshCw className="size-3.5" />
            <span>{d.retryBtn}</span>
          </button>
        </div>
      ) : filteredDeals.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Wallet className="mx-auto mb-3 size-9 text-slate-300" />
          <p className="text-sm font-extrabold text-[#0f1d40]">{d.emptyText}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDeals.map((offer) => {
            const unit = unitsMap[String(offer.property_id)]
            if (!unit) return null

            const isSold = unit.status === "sold"
            const offerRef = generateOfferRefCode(offer.id)
            const uCode = deriveUnitCode(unit.id, unit.code)
            const areaName = cleanAreaDisplay(unit.area, locale)
            const agreedCash = Number(offer.offered_cash) || 0
            const requiredCash =
              Number(unit.paid_amount || offer.required_cash) || 0
            const contractPrice = Number(unit.contract_price) || requiredCash
            const commissionAmount = Math.round(
              contractPrice * (commPct / 100)
            )

            const isPhoneRecorded =
              String(offer.initiated_by || "").toLowerCase() === "admin"
            const unitWaitlist = waitlistByPropertyId[String(unit.id)] || []
            const isWaitlistExpanded = Boolean(expandedWaitlistIds[offer.id])

            const isHighlighted = String(targetOfferId) === String(offer.id)
            const isCardBusy = isPending && processingId === offer.id
            const isMenuOpen = openMenuId === offer.id
            const activeConfirm =
              confirmingAction && confirmingAction.offerId === offer.id
                ? confirmingAction
                : null

            const buyerWaMsg = `${d.waBuyerGreetingPrefix} ${offer.buyer_name || ""}${commaSep}${d.waBuyerBodyPrefix} (${offerRef}) — (${unit.project_name || ""} - ${uCode}) — (${agreedCash.toLocaleString("en-US")} ${cur}).`
            const sellerWaMsg = `${d.waSellerGreetingPrefix} ${unit.name || ""}${commaSep}${d.waSellerBodyPrefix} (${offerRef}) — (${unit.project_name || ""} - ${uCode}) — (${agreedCash.toLocaleString("en-US")} ${cur}).`

            return (
              <div
                id={`deal-card-${offer.id}`}
                key={offer.id}
                className={`relative overflow-hidden rounded-2xl border bg-white p-5 shadow-2xs transition ${
                  isHighlighted
                    ? "border-2 border-[#007a5a] ring-4 ring-[#007a5a]/15"
                    : isSold
                      ? "border-slate-200/90 bg-slate-50/40"
                      : "border-2 border-emerald-300"
                }`}
              >
                {isCardBusy && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/75 backdrop-blur-[1px]">
                    <Loader2 className="size-6 animate-spin text-[#007a5a]" />
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-[#eaf8f2] px-2.5 py-1 font-mono text-xs font-black text-[#007a5a]">
                      #{offerRef}
                    </span>
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-[11px] font-bold text-[#0f1d40]">
                      {uCode}
                    </span>
                    <Link
                      href={`/admin/properties?unitId=${unit.id}`}
                      className="text-sm font-black text-[#0f1d40] hover:text-[#007a5a] hover:underline sm:text-base"
                    >
                      {unit.project_name || d.unitFallback} · {areaName}
                    </Link>

                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10.5px] font-extrabold ${
                        isPhoneRecorded
                          ? "border border-sky-200 bg-sky-50 text-sky-900"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {isPhoneRecorded
                        ? d.sourceSalesPhoneBadge
                        : d.sourceWebsiteBadge}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isSold ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0f1d40] px-3.5 py-1 text-xs font-extrabold text-white">
                        <Trophy className="size-3.5 text-emerald-300" />
                        <span>{d.statusSoldDone}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#007a5a] px-4 py-1 text-xs font-extrabold text-white">
                        <Handshake className="size-3.5" />
                        <span>{d.statusAcceptedReady}</span>
                      </span>
                    )}

                    <div
                      className="relative"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        aria-label={expL.moreActionsAria}
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenMenuId(isMenuOpen ? null : offer.id)
                        }}
                        className="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:border-[#007a5a] hover:bg-white hover:text-[#0f1d40]"
                      >
                        <MoreVertical className="size-4" />
                      </button>

                      {isMenuOpen && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute end-0 top-9 z-50 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"
                        >
                          <Link
                            href={`/opportunities/${unit.id}`}
                            target="_blank"
                            onClick={() => setOpenMenuId(null)}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-xs font-bold text-[#0f1d40] transition hover:bg-slate-50"
                          >
                            <ExternalLink className="size-3.5 text-[#007a5a]" />
                            <span>{sm.viewUnitBtn || d.previewBtn}</span>
                          </Link>

                          <div className="my-1 border-t border-slate-100" />

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenMenuId(null)
                              exportDealsReport(
                                [offer],
                                "excel",
                                `AqarExit_Deal_${offerRef}`,
                                `${expL.singleDealReportTitle} (#${offerRef})`
                              )
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-xs font-bold text-[#007a5a] transition hover:bg-[#eaf8f2]"
                          >
                            <Download className="size-3.5" />
                            <span>{expL.exportRowBtn}</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenMenuId(null)
                              exportDealsReport(
                                [offer],
                                "pdf",
                                `AqarExit_Deal_${offerRef}`,
                                `${expL.singleDealReportTitle} (#${offerRef})`
                              )
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-xs font-bold text-blue-700 transition hover:bg-blue-50"
                          >
                            <FileText className="size-3.5 text-blue-600" />
                            <span>{expL.exportRowPdfBtn}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3.5 md:grid-cols-3">
                  <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5">
                    <div>
                      <span className="block text-[10.5px] font-extrabold text-slate-400">
                        {d.buyerPartyHeader}
                      </span>
                      <strong className="mt-1 block text-sm font-black text-[#0f1d40]">
                        {offer.buyer_name || d.buyerFallback}
                      </strong>
                      <p
                        dir="ltr"
                        className="mt-0.5 text-start font-mono text-xs font-bold text-slate-600"
                      >
                        {offer.buyer_phone || "—"}
                      </p>
                      <p className="mt-1 text-[11px] font-semibold text-slate-500">
                        {d.readinessLabel}:{" "}
                        {offer.payment_readiness === "48h"
                          ? d.readiness48h
                          : offer.payment_readiness === "1_week"
                            ? d.readiness1Week
                            : d.readiness2Weeks}{" "}
                        ·{" "}
                        {offer.payment_method === "bank_check"
                          ? d.methodCheck
                          : d.methodTransfer}
                      </p>
                    </div>

                    {offer.buyer_phone && (
                      <a
                        data-admin-client-wa="true"
                        href={`https://wa.me/${String(offer.buyer_phone).replace(/\D/g, "")}?text=${encodeURIComponent(buyerWaMsg)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-3 text-xs font-extrabold text-white shadow-2xs transition hover:bg-[#1ebe5d]"
                      >
                        <WhatsAppOfficialIcon className="size-4" />
                        <span>{sm.contactBuyerWa || d.buyerWaBtn}</span>
                      </a>
                    )}
                  </div>

                  <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5">
                    <div>
                      <span className="block text-[10.5px] font-extrabold text-slate-400">
                        {d.sellerPartyHeader}
                      </span>
                      <strong className="mt-1 block text-sm font-black text-[#0f1d40]">
                        {unit.name || d.sellerFallback}
                      </strong>
                      <p
                        dir="ltr"
                        className="mt-0.5 text-start font-mono text-xs font-bold text-slate-600"
                      >
                        {unit.phone || "—"}
                      </p>
                      <p className="mt-1 text-[11px] font-semibold text-slate-500">
                        {d.originalRequiredCashLabel}:{" "}
                        <strong dir="ltr" className="text-[#0f1d40]">
                          {requiredCash.toLocaleString("en-US")} {cur}
                        </strong>
                      </p>
                    </div>

                    {unit.phone && (
                      <a
                        data-admin-client-wa="true"
                        href={`https://wa.me/${String(unit.phone).replace(/\D/g, "")}?text=${encodeURIComponent(sellerWaMsg)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-3 text-xs font-extrabold text-white shadow-2xs transition hover:bg-[#1ebe5d]"
                      >
                        <WhatsAppOfficialIcon className="size-4" />
                        <span>{sm.contactSellerWa || d.sellerWaBtn}</span>
                      </a>
                    )}
                  </div>

                  <div className="flex flex-col justify-between rounded-xl border border-emerald-200 bg-[#eaf8f2]/60 p-3.5">
                    <div>
                      <span className="block text-[10.5px] font-extrabold text-[#007a5a]">
                        {sm.agreedCashLabel || d.offeredCashHeader}
                      </span>
                      <strong
                        dir="ltr"
                        className="mt-1 block text-2xl font-black text-[#007a5a] tabular-nums"
                      >
                        {agreedCash.toLocaleString("en-US")} {cur}
                      </strong>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-emerald-200/70 pt-2.5 text-xs">
                      <span className="font-bold text-slate-600">
                        {sm.commissionDueLabel || d.platformCommissionLabel} (
                        {commPct}%):
                      </span>
                      <strong
                        dir="ltr"
                        className="rounded-md bg-white px-2 py-0.5 font-black text-[#0f1d40] shadow-2xs tabular-nums"
                      >
                        {commissionAmount.toLocaleString("en-US")} {cur}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* قائمة الانتظار الاحتياطية الخاصة بهذه الوحدة */}
                {!isSold && (
                  <div className="mt-3.5 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedWaitlistIds((prev) => ({
                          ...prev,
                          [offer.id]: !prev[offer.id],
                        }))
                      }
                      className="flex w-full items-center justify-between gap-2 text-xs font-extrabold text-[#0f1d40]"
                    >
                      <span className="flex flex-wrap items-center gap-2">
                        <Users className="size-4 text-[#007a5a]" />
                        <span>
                          {d.waitlistOnUnitBtn} ({unitWaitlist.length})
                        </span>
                        {unitWaitlist.length > 0 && (
                          <span className="rounded-md bg-white px-2 py-0.5 text-[11px] font-bold text-[#007a5a] shadow-2xs">
                            {d.waitlistHighestOfferLabel}{" "}
                            <strong dir="ltr">
                              {Number(
                                unitWaitlist[0].offered_cash || 0
                              ).toLocaleString("en-US")}{" "}
                              {cur}
                            </strong>
                          </span>
                        )}
                      </span>
                      {isWaitlistExpanded ? (
                        <ChevronUp className="size-4 text-slate-500" />
                      ) : (
                        <ChevronDown className="size-4 text-slate-500" />
                      )}
                    </button>

                    {isWaitlistExpanded && (
                      <div className="mt-3 space-y-2 border-t border-slate-200/70 pt-3">
                        {unitWaitlist.length === 0 ? (
                          <p className="text-xs font-semibold text-slate-500">
                            {d.waitlistEmptyOnUnit}
                          </p>
                        ) : (
                          unitWaitlist.map((wOffer, idx) => (
                            <div
                              key={wOffer.id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="flex size-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-black text-slate-600">
                                  {idx + 1}
                                </span>
                                <Lock className="size-3 text-slate-400" />
                                <strong className="text-[#0f1d40]">
                                  {wOffer.buyer_name || d.buyerFallback}
                                </strong>
                                <span
                                  dir="ltr"
                                  className="font-mono text-[11px] text-slate-500"
                                >
                                  {wOffer.buyer_phone || "—"}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <strong
                                  dir="ltr"
                                  className="font-black text-[#007a5a] tabular-nums"
                                >
                                  {Number(
                                    wOffer.offered_cash || 0
                                  ).toLocaleString("en-US")}{" "}
                                  {cur}
                                </strong>
                                {wOffer.buyer_phone && (
                                  <a
                                    data-admin-client-wa="true"
                                    href={`https://wa.me/${String(wOffer.buyer_phone).replace(/\D/g, "")}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex size-7 items-center justify-center rounded-lg bg-[#25D366] text-white"
                                  >
                                    <WhatsAppOfficialIcon className="size-3.5" />
                                  </a>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-100 pt-3.5">
                  <span className="text-[11px] font-semibold text-slate-500">
                    {d.offerDateLabel}:{" "}
                    <strong dir="ltr" className="text-[#0f1d40]">
                      {offer.updated_at || offer.created_at
                        ? new Date(
                            offer.updated_at || offer.created_at
                          ).toLocaleDateString("en-GB")
                        : "—"}
                    </strong>
                  </span>

                  {!isSold &&
                    (activeConfirm ? (
                      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5">
                        <span className="text-xs font-extrabold text-amber-950">
                          ⚠️ {d.confirmActionPrompt} ({activeConfirm.label})
                        </span>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() =>
                            handleLifecycleAction(
                              offer.id,
                              activeConfirm.action,
                              `${activeConfirm.label} (#${offerRef}) ✓`
                            )
                          }
                          className="rounded-lg bg-[#007a5a] px-3 py-1 text-xs font-extrabold text-white hover:bg-[#006248]"
                        >
                          {d.confirmYesBtn}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingAction(null)}
                          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-700"
                        >
                          {d.confirmBackBtn}
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() =>
                            setConfirmingAction({
                              offerId: offer.id,
                              action: "mark_unit_sold",
                              label: d.markUnitSoldBtn,
                            })
                          }
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#007a5a] px-4 text-xs font-extrabold text-white shadow-xs transition hover:bg-[#006248]"
                        >
                          <Check className="size-4" />
                          <span>{d.markUnitSoldBtn}</span>
                        </button>

                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() =>
                            setConfirmingAction({
                              offerId: offer.id,
                              action: "reopen_unit_offers",
                              label: d.reopenBackupOffersBtn,
                            })
                          }
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 text-xs font-extrabold text-amber-900 transition hover:bg-amber-100"
                        >
                          <RotateCcw className="size-3.5" />
                          <span>{d.reopenBackupOffersBtn}</span>
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function AdminDealsPage() {
  return (
    <Suspense fallback={null}>
      <AdminDealsContent />
    </Suspense>
  )
}