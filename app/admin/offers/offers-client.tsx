"use client"

import { Suspense, useEffect, useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  ExternalLink,
  FileText,
  Handshake,
  Loader2,
  MoreVertical,
  PhoneCall,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  Wallet,
  X,
  XCircle,
} from "lucide-react"
import {
  adminGetDealsRoomDataAction,
  adminManageOfferLifecycleAction,
} from "@/actions/offer-actions"
import { getUnitPricingGuardrails } from "@/lib/smart-matcher"
import { toEnglishDigits } from "@/components/features/seller/seller-shared"
import { PhoneOfferDialog } from "@/components/features/admin/phone-offer-dialog"
import {
  downloadExcelCsv,
  downloadOfficialPdfReport,
  EXPORT_LABELS,
} from "@/lib/export-csv"
import { getLocalizedGeorgiaAreaName } from "@/components/shared/georgia-areas"
import { getCurrencySymbol, useTranslation } from "@/lib/i18n"

const PENDING_ADMIN_TAG = "__PENDING_ADMIN_VERIFICATION__"
const PRIORITY_RETURNED_TAG = "__PRIORITY_FROM_BACKUP__"

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

function normalizeOffer(raw: any) {
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

function OffersRoomInner({
  leads,
  availableUnits,
}: {
  leads: any[]
  availableUnits: any[]
}) {
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
  const [offers, setOffers] = useState<any[]>([])
  const [unitsMap, setUnitsMap] = useState<Record<string, any>>({})
  const [search, setSearch] = useState("")
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [phoneModalOpen, setPhoneModalOpen] = useState(false)

  const [activeTab, setActiveTab] = useState<
    "all" | "pending_admin" | "counter_offered" | "pending_seller" | "rejected"
  >(
    initialTabParam === "pending_admin"
      ? "pending_admin"
      : initialTabParam === "counter_offered"
        ? "counter_offered"
        : initialTabParam === "pending_seller"
          ? "pending_seller"
          : initialTabParam === "rejected"
            ? "rejected"
            : "all"
  )

  const [editingPriceOfferId, setEditingPriceOfferId] = useState<string | null>(
    null
  )
  const [editingPriceStr, setEditingPriceStr] = useState("")

  const [confirmingAction, setConfirmingAction] = useState<{
    offerId: string
    action:
      | "approve_to_seller"
      | "admin_accept_deal"
      | "reject_offer"
      | "seller_unresponsive_cancel"
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

  async function loadOffers() {
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
        .map(normalizeOffer)
        .filter((o: any) => {
          if (o.status === "recommended") return false
          const u = uMap[String(o.property_id)]
          if (!u || isSelfOfferClient(o, u)) return false
          return true
        })

      // إذا فُتح رابط على عرض تحوّل بالفعل لصفقة مقبولة، نحوله تلقائياً لقسم الصفقات
      if (targetOfferId) {
        const found = normalized.find(
          (o: any) => String(o.id) === String(targetOfferId)
        )
        if (found && found.status === "accepted") {
          router.replace(`/admin/deals?offerId=${targetOfferId}`)
          return
        }
        if (found && found.status === "rejected") {
          setActiveTab("rejected")
        }
        setTimeout(() => {
          document
            .getElementById(`offer-card-${targetOfferId}`)
            ?.scrollIntoView({ behavior: "smooth", block: "center" })
        }, 250)
      }

      setUnitsMap(uMap)
      setOffers(normalized)
    } catch (e) {
      console.error("Error loading offers:", e)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOffers()
  }, [targetOfferId])

  const handleLifecycleAction = (
    offerId: string,
    action:
      | "approve_to_seller"
      | "admin_accept_deal"
      | "reject_offer"
      | "seller_unresponsive_cancel",
    successText: string,
    customNegotiatedCash?: number
  ) => {
    setProcessingId(offerId)
    setConfirmingAction(null)
    setEditingPriceOfferId(null)
    setNotice(null)
    startTransition(async () => {
      try {
        const res = await adminManageOfferLifecycleAction({
          offerId,
          action,
          negotiatedCash: customNegotiatedCash,
        })
        if (res.success) {
          setNotice({ text: successText })
          if (action === "admin_accept_deal") {
            router.push(`/admin/deals?offerId=${offerId}`)
            return
          }
          await loadOffers()
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

  const pipelineOffers = useMemo(() => {
    return offers.filter((o) => {
      const unit = unitsMap[String(o.property_id)]
      if (!unit) return false
      if (o.status === "accepted" || o.status === "unit_locked") return false
      if (unit.status === "sold" && o.status !== "rejected") return false
      return true
    })
  }, [offers, unitsMap])

  const counts = useMemo(() => {
    const pendingAdmin = pipelineOffers.filter(
      (o) => o.status === "pending_admin"
    ).length
    const counter = pipelineOffers.filter(
      (o) => o.status === "counter_offered"
    ).length
    const pendingSeller = pipelineOffers.filter(
      (o) => o.status === "pending_seller"
    ).length
    const rejected = pipelineOffers.filter(
      (o) => o.status === "rejected"
    ).length

    return {
      all: pendingAdmin + counter + pendingSeller,
      pending_admin: pendingAdmin,
      counter_offered: counter,
      pending_seller: pendingSeller,
      rejected,
    }
  }, [pipelineOffers])

  const filteredOffers = useMemo(() => {
    return pipelineOffers
      .filter((o) => {
        const unit = unitsMap[String(o.property_id)]
        if (!unit) return false

        if (activeTab === "all" && o.status === "rejected") return false
        if (activeTab !== "all" && o.status !== activeTab) return false

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
      .sort((a, b) => {
        const rank = (o: any) => {
          const diffs = Array.isArray(o.diff_reasons) ? o.diff_reasons : []
          if (
            o.status === "pending_admin" &&
            diffs.includes(PRIORITY_RETURNED_TAG)
          ) {
            return 1
          }
          if (o.status === "counter_offered") return 2
          if (o.status === "pending_admin") return 3
          if (o.status === "pending_seller") return 4
          return 5
        }
        const diff = rank(a) - rank(b)
        if (diff !== 0) return diff
        return (
          new Date(b.updated_at || b.created_at || 0).getTime() -
          new Date(a.updated_at || a.created_at || 0).getTime()
        )
      })
  }, [pipelineOffers, unitsMap, activeTab, search])

  function getOfferStatusLabel(offer: any) {
    if (offer.status === "pending_admin") return d.statusPendingAdmin
    if (offer.status === "pending_seller") return d.statusPendingSeller
    if (offer.status === "counter_offered") return d.statusCounterPrefix
    return d.statusRejected
  }

  function exportOffersReport(
    rowsToExport: any[],
    format: "excel" | "pdf" = "excel",
    prefix = "AqarExit_Offers",
    customTitle?: string
  ) {
    const c = expL.cols
    const resolvedTitle =
      customTitle ||
      (rowsToExport.length === 1
        ? `${expL.singleDealReportTitle} — ${generateOfferRefCode(rowsToExport[0].id)}`
        : d.offersPageTitle || expL.dealsReportTitle)

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
        header: c.requiredCash,
        accessor: (o: any) =>
          Number(
            unitsMap[String(o.property_id)]?.paid_amount ||
              o.required_cash ||
              0
          ),
      },
      {
        header: c.offeredCash,
        accessor: (o: any) => Number(o.offered_cash || 0),
      },
      {
        header: c.counterCash,
        accessor: (o: any) => (o.counter_cash ? Number(o.counter_cash) : "—"),
      },
      {
        header: c.status,
        accessor: (o: any) => getOfferStatusLabel(o),
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
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-extrabold text-amber-800">
            <Wallet className="size-3.5" />
            <span>{d.offersPageEyebrow}</span>
          </div>
          <h1 className="mt-1 text-lg font-black text-[#0f1d40] sm:text-xl">
            {d.offersPageTitle}
          </h1>
          <p className="mt-0.5 text-xs font-medium text-slate-500">
            {d.offersPageSubtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPhoneModalOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#007a5a] px-4 text-xs font-extrabold text-white shadow-xs transition hover:bg-[#006248]"
          >
            <PhoneCall className="size-3.5" />
            <span>{d.recordPhoneOfferBtn}</span>
          </button>

          <button
            type="button"
            disabled={filteredOffers.length === 0}
            onClick={() =>
              exportOffersReport(
                filteredOffers,
                "excel",
                "AqarExit_Offers_Pipeline",
                d.offersPageTitle
              )
            }
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-emerald-200 bg-[#eaf8f2] px-3 text-xs font-extrabold text-[#007a5a] transition hover:bg-[#007a5a] hover:text-white disabled:opacity-40"
          >
            <Download className="size-3.5" />
            <span>{expL.exportAllBtn}</span>
          </button>

          <button
            type="button"
            disabled={filteredOffers.length === 0}
            onClick={() =>
              exportOffersReport(
                filteredOffers,
                "pdf",
                "AqarExit_Offers_Pipeline",
                d.offersPageTitle
              )
            }
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-800 px-3 text-xs font-extrabold text-white transition hover:bg-slate-900 disabled:opacity-40"
          >
            <FileText className="size-3.5 text-emerald-300" />
            <span>{expL.exportPdfBtn}</span>
          </button>

          <Link
            href="/admin/deals"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-extrabold text-[#0f1d40] shadow-2xs hover:bg-slate-50"
          >
            <Handshake className="size-3.5 text-[#007a5a]" />
            <span>{d.dealsPageTitle}</span>
            {isRtl ? (
              <ArrowLeft className="size-3.5" />
            ) : (
              <ArrowRight className="size-3.5" />
            )}
          </Link>
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
          {[
            { id: "all" as const, label: `${d.tabAll} (${counts.all})` },
            {
              id: "pending_admin" as const,
              label: `${d.tabPendingAdmin} (${counts.pending_admin})`,
            },
            {
              id: "counter_offered" as const,
              label: `${d.tabCounterNegotiating} (${counts.counter_offered})`,
            },
            {
              id: "pending_seller" as const,
              label: `${d.tabPendingSellerOnly} (${counts.pending_seller})`,
            },
            {
              id: "rejected" as const,
              label: `${d.tabRejectedClosed} (${counts.rejected})`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-extrabold transition ${
                activeTab === tab.id
                  ? "bg-[#007a5a] text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-[#0f1d40]"
              }`}
            >
              {tab.label}
            </button>
          ))}
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
            onClick={loadOffers}
            className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#007a5a] px-5 text-xs font-extrabold text-white hover:bg-[#006248]"
          >
            <RefreshCw className="size-3.5" />
            <span>{d.retryBtn}</span>
          </button>
        </div>
      ) : filteredOffers.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Wallet className="mx-auto mb-3 size-9 text-slate-300" />
          <p className="text-sm font-extrabold text-[#0f1d40]">{d.emptyText}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOffers.map((offer) => {
            const unit = unitsMap[String(offer.property_id)]
            if (!unit) return null

            const offerRef = generateOfferRefCode(offer.id)
            const uCode = deriveUnitCode(unit.id, unit.code)
            const areaName = cleanAreaDisplay(unit.area, locale)
            const offeredCash = Number(offer.offered_cash) || 0
            const requiredCash =
              Number(unit.paid_amount || offer.required_cash) || 0
            const contractPrice = Number(unit.contract_price) || requiredCash
            const commissionAmount = Math.round(
              contractPrice * (commPct / 100)
            )

            const unitGuardrails = getUnitPricingGuardrails(unit)
            const secretSellerMinCash = unitGuardrails.minAllowedOfferCash
            const isSellerNegotiable = unitGuardrails.allowNegotiation

            const diffs = Array.isArray(offer.diff_reasons)
              ? offer.diff_reasons
              : []
            const isReturnedFromWaitlistPriority = diffs.includes(
              PRIORITY_RETURNED_TAG
            )
            const isPhoneRecorded =
              String(offer.initiated_by || "").toLowerCase() === "admin"

            const isHighlighted = String(targetOfferId) === String(offer.id)
            const isCardBusy = isPending && processingId === offer.id
            const isMenuOpen = openMenuId === offer.id
            const activeConfirm =
              confirmingAction && confirmingAction.offerId === offer.id
                ? confirmingAction
                : null

            const buyerWaMsg = `${d.waBuyerGreetingPrefix} ${offer.buyer_name || ""}${commaSep}${d.waBuyerBodyPrefix} (${offerRef}) — (${unit.project_name || ""} - ${uCode}) — (${offeredCash.toLocaleString("en-US")} ${cur}).`
            const sellerWaMsg = `${d.waSellerGreetingPrefix} ${unit.name || ""}${commaSep}${d.waSellerBodyPrefix} (${offerRef}) — (${unit.project_name || ""} - ${uCode}) — (${offeredCash.toLocaleString("en-US")} ${cur}).`

            return (
              <div
                id={`offer-card-${offer.id}`}
                key={offer.id}
                className={`relative overflow-hidden rounded-2xl border bg-white p-5 shadow-2xs transition ${
                  isHighlighted
                    ? "border-2 border-[#007a5a] ring-4 ring-[#007a5a]/15"
                    : offer.status === "counter_offered"
                      ? "border-2 border-purple-300"
                      : offer.status === "pending_admin"
                        ? "border-2 border-amber-300"
                        : "border-slate-200/90"
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
                          ? "bg-sky-50 text-sky-900 border border-sky-200"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {isPhoneRecorded
                        ? d.sourceSalesPhoneBadge
                        : d.sourceWebsiteBadge}
                    </span>

                    {isReturnedFromWaitlistPriority && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/90 px-3 py-1 text-[11px] font-black text-[#0f1d40] shadow-2xs">
                        <Sparkles className="size-3.5" />
                        <span>⭐ {d.badgePriorityReturned}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {offer.status === "pending_admin" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3.5 py-1 text-xs font-extrabold text-white">
                        <Clock className="size-3.5" />
                        <span>{d.statusPendingAdmin}</span>
                      </span>
                    ) : offer.status === "pending_seller" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-extrabold text-blue-800">
                        <Clock className="size-3.5 text-blue-600" />
                        <span>{d.statusPendingSeller}</span>
                      </span>
                    ) : offer.status === "counter_offered" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-700 px-3.5 py-1 text-xs font-extrabold text-white">
                        <RefreshCw className="size-3.5" />
                        <span>
                          {d.statusCounterPrefix} (
                          <span dir="ltr">
                            {Number(offer.counter_cash || 0).toLocaleString(
                              "en-US"
                            )}{" "}
                            {cur}
                          </span>
                          )
                        </span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                        <span>{d.statusRejected}</span>
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
                              exportOffersReport(
                                [offer],
                                "excel",
                                `AqarExit_Offer_${offerRef}`,
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
                              exportOffersReport(
                                [offer],
                                "pdf",
                                `AqarExit_Offer_${offerRef}`,
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

                      <div className="mt-1.5 rounded-lg border border-amber-200 bg-amber-50/90 px-2.5 py-1 text-[10.5px] font-extrabold text-amber-950">
                        {isSellerNegotiable ? (
                          <>
                            🔒 {d.secretSellerMinLabel}:{" "}
                            <strong dir="ltr">
                              {secretSellerMinCash.toLocaleString("en-US")}{" "}
                              {cur}
                            </strong>
                          </>
                        ) : (
                          <span>🔒 {d.fixedPriceNonNegotiableBadge}</span>
                        )}
                      </div>
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
                      <div className="flex items-center justify-between gap-2">
                        <span className="block text-[10.5px] font-extrabold text-[#007a5a]">
                          {d.offeredCashHeader}
                        </span>
                        {offer.status !== "rejected" && (
                          <button
                            type="button"
                            onClick={() => {
                              if (editingPriceOfferId === offer.id) {
                                setEditingPriceOfferId(null)
                              } else {
                                setEditingPriceOfferId(offer.id)
                                setEditingPriceStr(
                                  offeredCash.toLocaleString("en-US")
                                )
                              }
                            }}
                            className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[10px] font-extrabold text-[#0f1d40] shadow-2xs hover:text-[#007a5a]"
                          >
                            <Edit3 className="size-3 text-[#007a5a]" />
                            <span>{d.editNegotiatedPriceBtn}</span>
                          </button>
                        )}
                      </div>

                      {editingPriceOfferId === offer.id ? (
                        <div className="mt-2 space-y-2">
                          <input
                            type="text"
                            dir="ltr"
                            value={editingPriceStr}
                            onChange={(e) => {
                              const raw = toEnglishDigits(
                                e.target.value
                              ).replace(/[^\d]/g, "")
                              setEditingPriceStr(
                                raw ? Number(raw).toLocaleString("en-US") : ""
                              )
                            }}
                            className="h-9 w-full rounded-lg border border-emerald-400 bg-white px-2.5 text-sm font-black text-[#0f1d40]"
                          />
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => {
                                const val =
                                  Number(
                                    toEnglishDigits(editingPriceStr).replace(
                                      /,/g,
                                      ""
                                    )
                                  ) || offeredCash
                                handleLifecycleAction(
                                  offer.id,
                                  "approve_to_seller",
                                  `${d.noticeApprovedToSeller} (${val.toLocaleString("en-US")} ${cur}) ✓`,
                                  val
                                )
                              }}
                              className="flex-1 rounded-lg bg-[#007a5a] px-2.5 py-1.5 text-[11px] font-extrabold text-white"
                            >
                              {d.approveToSellerBtn}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingPriceOfferId(null)}
                              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600"
                            >
                              {d.confirmBackBtn}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <strong
                          dir="ltr"
                          className="mt-1 block text-2xl font-black text-[#007a5a] tabular-nums"
                        >
                          {offeredCash.toLocaleString("en-US")} {cur}
                        </strong>
                      )}

                      {offer.counter_cash && (
                        <p className="mt-1 text-[11px] font-extrabold text-purple-800">
                          🔄 {d.counterOfferLabel}:{" "}
                          <span dir="ltr">
                            {Number(offer.counter_cash).toLocaleString("en-US")}{" "}
                            {cur}
                          </span>
                        </p>
                      )}
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

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-100 pt-3.5">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-500">
                    <span>
                      {d.offerDateLabel}:{" "}
                      <strong dir="ltr" className="text-[#0f1d40]">
                        {offer.created_at
                          ? new Date(offer.created_at).toLocaleDateString(
                              "en-GB"
                            )
                          : "—"}
                      </strong>
                    </span>
                    {(offer.status === "pending_seller" ||
                      offer.status === "counter_offered") &&
                      offer.updated_at && (
                        <span className="inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-[10.5px] font-extrabold text-amber-900">
                          ⏳ {d.sentToSellerSinceLabel}:{" "}
                          <span dir="ltr" className="ms-1">
                            {new Date(offer.updated_at).toLocaleDateString(
                              "en-GB"
                            )}
                          </span>
                        </span>
                      )}
                  </div>

                  {activeConfirm ? (
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
                      {offer.status === "pending_admin" && (
                        <>
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() =>
                              handleLifecycleAction(
                                offer.id,
                                "approve_to_seller",
                                `${d.noticeApprovedToSeller} (${offerRef}) ✓`
                              )
                            }
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#007a5a] px-4 text-xs font-extrabold text-white shadow-xs transition hover:bg-[#006248]"
                          >
                            <Send className="size-3.5" />
                            <span>{d.approveToSellerBtn}</span>
                          </button>

                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() =>
                              setConfirmingAction({
                                offerId: offer.id,
                                action: "admin_accept_deal",
                                label: d.btnAdminAcceptDeal,
                              })
                            }
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-[#eaf8f2] px-3.5 text-xs font-extrabold text-[#007a5a] hover:bg-emerald-100"
                          >
                            <Handshake className="size-3.5" />
                            <span>{d.btnAdminAcceptDeal}</span>
                          </button>

                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() =>
                              setConfirmingAction({
                                offerId: offer.id,
                                action: "reject_offer",
                                label: d.rejectOfferBtn,
                              })
                            }
                            className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3.5 text-xs font-bold text-red-600 hover:bg-red-100"
                          >
                            <XCircle className="size-3.5" />
                            <span>{d.rejectOfferBtn}</span>
                          </button>
                        </>
                      )}

                      {(offer.status === "pending_seller" ||
                        offer.status === "counter_offered") && (
                        <>
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() =>
                              setConfirmingAction({
                                offerId: offer.id,
                                action: "admin_accept_deal",
                                label: d.btnAdminAcceptDeal,
                              })
                            }
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#007a5a] px-4 text-xs font-extrabold text-white shadow-xs transition hover:bg-[#006248]"
                          >
                            <Handshake className="size-3.5" />
                            <span>{d.btnAdminAcceptDeal}</span>
                          </button>

                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() =>
                              setConfirmingAction({
                                offerId: offer.id,
                                action: "seller_unresponsive_cancel",
                                label: d.btnSellerUnavailableCancel,
                              })
                            }
                            className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-amber-300 bg-amber-50 px-3 text-xs font-extrabold text-amber-900 hover:bg-amber-100"
                          >
                            <Clock className="size-3.5" />
                            <span>{d.btnSellerUnavailableCancel}</span>
                          </button>

                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() =>
                              setConfirmingAction({
                                offerId: offer.id,
                                action: "reject_offer",
                                label: d.cancelOfferBtn,
                              })
                            }
                            className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-bold text-red-600 hover:bg-red-100"
                          >
                            <XCircle className="size-3.5" />
                            <span>{d.cancelOfferBtn}</span>
                          </button>
                        </>
                      )}

                      {offer.status === "rejected" && unit.status !== "sold" && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() =>
                            handleLifecycleAction(
                              offer.id,
                              "approve_to_seller",
                              `${d.noticeApprovedToSeller} (${offerRef}) ✓`
                            )
                          }
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-[#eaf8f2] px-3.5 text-xs font-extrabold text-[#007a5a] hover:bg-emerald-100"
                        >
                          <RotateCcw className="size-3.5" />
                          <span>{d.reactivateToSellerBtn}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <PhoneOfferDialog
        open={phoneModalOpen}
        onClose={() => setPhoneModalOpen(false)}
        leads={leads}
        units={availableUnits}
        preselectedLeadId={null}
        onSuccess={({ offerId, isDirectDeal }) => {
          setNotice({
            text: isDirectDeal
              ? d.directDealCreatedNotice
              : d.phoneOfferSentNotice,
          })
          if (isDirectDeal && offerId) {
            router.push(`/admin/deals?offerId=${offerId}`)
          } else {
            loadOffers()
            router.refresh()
          }
        }}
      />
    </div>
  )
}

export default function OffersRoomClient({
  leads,
  availableUnits,
}: {
  leads: any[]
  availableUnits: any[]
}) {
  return (
    <Suspense fallback={null}>
      <OffersRoomInner leads={leads} availableUnits={availableUnits} />
    </Suspense>
  )
}