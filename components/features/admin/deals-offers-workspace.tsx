"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  Edit3,
  ExternalLink,
  FileText,
  Flame,
  Handshake,
  Loader2,
  Lock,
  MoreVertical,
  PhoneCall,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  Users,
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
import {
  downloadExcelCsv,
  downloadOfficialPdfReport,
  EXPORT_LABELS,
} from "@/lib/export-csv"
import { getLocalizedGeorgiaAreaName } from "@/components/shared/georgia-areas"
import { getCurrencySymbol, useTranslation } from "@/lib/i18n"
import { PhoneOfferDialog } from "./phone-offer-dialog"

const PENDING_ADMIN_TAG = "__PENDING_ADMIN_VERIFICATION__"
const PRIORITY_RETURNED_TAG = "__PRIORITY_FROM_BACKUP__"
const REOPENED_PROMPT_TAG = "__REOPENED_PROMPT__"

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

export function DealsOffersWorkspace({
  mode,
}: {
  mode: "offers" | "deals"
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const targetOfferId = searchParams.get("offerId")

  const { t: dict, locale, dir, isRtl, siteSettings } = useTranslation()
  const adminDict = (dict?.admin as Record<string, any>) || {}
  const d = (adminDict.dealsPage as Record<string, string>) || {}
  const sm = (adminDict.smartMatch as Record<string, string>) || {}
  const expL = EXPORT_LABELS[locale] || EXPORT_LABELS.ar
  const commaSep = isRtl ? "، " : ", "

  const cur = getCurrencySymbol("GE", locale)
  const commPct = Number(siteSettings?.buyerCommission) || 1.25

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [offers, setOffers] = useState<any[]>([])
  const [unitsList, setUnitsList] = useState<any[]>([])
  const [leadsList, setLeadsList] = useState<any[]>([])
  const [unitsMap, setUnitsMap] = useState<Record<string, any>>({})
  const [search, setSearch] = useState("")
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [expandedWaitlistDealId, setExpandedWaitlistDealId] = useState<
    string | null
  >(null)
  const [phoneDialogOpen, setPhoneDialogOpen] = useState(false)

  const [offersTab, setOffersTab] = useState<
    "all_offers" | "pending_admin" | "counter_offered" | "pending_seller" | "rejected"
  >("all_offers")
  const [dealsTab, setDealsTab] = useState<"closing" | "sold">("closing")

  const [editingPriceOfferId, setEditingPriceOfferId] = useState<string | null>(
    null
  )
  const [editingPriceStr, setEditingPriceStr] = useState("")

  const [confirmingAction, setConfirmingAction] = useState<{
    offerId: string
    action:
      | "approve_to_seller"
      | "admin_accept_deal"
      | "reopen_unit_offers"
      | "mark_unit_sold"
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

  async function loadWorkspace() {
    setLoading(true)
    setLoadError(false)
    try {
      const res = await adminGetDealsRoomDataAction()
      if (!res.authorized) {
        setLoadError(true)
        return
      }

      const uMap: Record<string, any> = {}
      const cleanUnits: any[] = []
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
          cleanUnits.push(u)
        }
      })

      const normalizedOffers = (res.offers || [])
        .map(normalizeDealOffer)
        .filter((o: any) => {
          if (o.status === "recommended") return false
          const u = uMap[String(o.property_id)]
          if (!u || isSelfOfferClient(o, u)) return false
          return true
        })

      setUnitsMap(uMap)
      setUnitsList(cleanUnits)
      setLeadsList(res.leads || [])
      setOffers(normalizedOffers)

      if (targetOfferId && normalizedOffers.length > 0) {
        const found = normalizedOffers.find(
          (o: any) => String(o.id) === String(targetOfferId)
        )
        if (found) {
          const foundUnit = uMap[String(found.property_id)]
          if (mode === "deals") {
            if (foundUnit?.status === "sold") {
              setDealsTab("sold")
            } else {
              setDealsTab("closing")
              if (found.status === "unit_locked") {
                const primaryDeal = normalizedOffers.find(
                  (o: any) =>
                    String(o.property_id) === String(found.property_id) &&
                    o.status === "accepted"
                )
                if (primaryDeal) {
                  setExpandedWaitlistDealId(String(primaryDeal.id))
                }
              }
            }
          } else {
            if (found.status === "rejected") setOffersTab("rejected")
            else setOffersTab("all_offers")
          }

          setTimeout(() => {
            document
              .getElementById(`deal-card-${targetOfferId}`)
              ?.scrollIntoView({ behavior: "smooth", block: "center" })
          }, 250)
        }
      }
    } catch (e) {
      console.error("Error loading workspace:", e)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWorkspace()
  }, [targetOfferId, mode])

  const handleLifecycleAction = (
    offerId: string,
    action:
      | "approve_to_seller"
      | "admin_accept_deal"
      | "reopen_unit_offers"
      | "mark_unit_sold"
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
          await loadWorkspace()
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

  // العروض الاحتياطية مجمّعة حسب كود الوحدة لعرضها داخل كارت الصفقة
  const waitlistByUnitMap = useMemo(() => {
    const map: Record<string, any[]> = {}
    offers.forEach((o) => {
      if (o.status !== "unit_locked") return
      const u = unitsMap[String(o.property_id)]
      if (!u || u.status === "sold") return
      const key = String(o.property_id)
      if (!map[key]) map[key] = []
      map[key].push(o)
    })
    Object.values(map).forEach((arr) =>
      arr.sort((a, b) => Number(b.offered_cash || 0) - Number(a.offered_cash || 0))
    )
    return map
  }, [offers, unitsMap])

  const offerCounts = useMemo(() => {
    const pendingAdmin = offers.filter(
      (o) =>
        o.status === "pending_admin" &&
        unitsMap[String(o.property_id)]?.status !== "sold"
    ).length
    const counter = offers.filter(
      (o) =>
        o.status === "counter_offered" &&
        unitsMap[String(o.property_id)]?.status !== "sold"
    ).length
    const pendingSeller = offers.filter(
      (o) =>
        o.status === "pending_seller" &&
        unitsMap[String(o.property_id)]?.status !== "sold"
    ).length
    const rejected = offers.filter(
      (o) =>
        o.status === "rejected" &&
        unitsMap[String(o.property_id)]?.status !== "sold"
    ).length

    return {
      all_offers: pendingAdmin + counter + pendingSeller,
      pending_admin: pendingAdmin,
      counter_offered: counter,
      pending_seller: pendingSeller,
      rejected,
    }
  }, [offers, unitsMap])

  const dealMetrics = useMemo(() => {
    const closingList = offers.filter(
      (o) =>
        o.status === "accepted" &&
        unitsMap[String(o.property_id)]?.status !== "sold"
    )
    const soldList = offers.filter(
      (o) =>
        o.status === "accepted" &&
        unitsMap[String(o.property_id)]?.status === "sold"
    )

    const sumComm = (list: any[]) =>
      list.reduce((sum, o) => {
        const u = unitsMap[String(o.property_id)]
        const base =
          Number(u?.contract_price || u?.paid_amount || o.offered_cash) || 0
        return sum + Math.round(base * (commPct / 100))
      }, 0)

    return {
      closingCount: closingList.length,
      soldCount: soldList.length,
      expectedCommission: sumComm(closingList),
      collectedCommission: sumComm(soldList),
    }
  }, [offers, unitsMap, commPct])

  const filteredOffers = useMemo(() => {
    return offers
      .filter((o) => {
        const unit = unitsMap[String(o.property_id)]
        if (!unit) return false
        const isSold = unit.status === "sold"

        if (mode === "deals") {
          if (o.status !== "accepted") return false
          if (dealsTab === "closing" && isSold) return false
          if (dealsTab === "sold" && !isSold) return false
        } else {
          if (o.status === "accepted" || o.status === "unit_locked" || isSold) {
            return false
          }
          if (offersTab === "all_offers" && o.status === "rejected") return false
          if (offersTab === "pending_admin" && o.status !== "pending_admin")
            return false
          if (offersTab === "counter_offered" && o.status !== "counter_offered")
            return false
          if (offersTab === "pending_seller" && o.status !== "pending_seller")
            return false
          if (offersTab === "rejected" && o.status !== "rejected") return false
        }

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
          if (o.status === "pending_admin" && diffs.includes(PRIORITY_RETURNED_TAG))
            return 1
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
  }, [offers, unitsMap, mode, offersTab, dealsTab, search])

  function getDealStatusLabel(offer: any, unit: any) {
    if (unit?.status === "sold") return d.statusSoldDone
    if (offer.status === "pending_admin") return d.statusPendingAdmin
    if (offer.status === "pending_seller") return d.statusPendingSeller
    if (offer.status === "counter_offered") return d.statusCounterPrefix
    if (offer.status === "accepted") return d.statusAcceptedReady
    if (offer.status === "unit_locked") return d.statusBackupWaiting
    return d.statusRejected
  }

  function exportReport(
    rowsToExport: any[],
    format: "excel" | "pdf" = "excel",
    prefix = mode === "deals" ? "AqarExit_Deals" : "AqarExit_Offers",
    customTitle?: string
  ) {
    const c = expL.cols
    const resolvedTitle =
      customTitle ||
      (rowsToExport.length === 1
        ? `${expL.singleDealReportTitle} — ${generateOfferRefCode(rowsToExport[0].id)}`
        : mode === "deals"
          ? d.dealsPageTitle || expL.dealsReportTitle
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
          getDealStatusLabel(o, unitsMap[String(o.property_id)]),
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
      {/* الترويسة */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white px-5 py-4 shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#eaf8f2] px-3 py-1 text-[11px] font-extrabold text-[#007a5a]">
            {mode === "deals" ? (
              <Handshake className="size-3.5" />
            ) : (
              <Wallet className="size-3.5" />
            )}
            <span>
              {mode === "deals" ? d.dealsPageEyebrow : d.offersPageEyebrow}
            </span>
          </div>
          <h1 className="mt-1 text-lg font-black text-[#0f1d40] sm:text-xl">
            {mode === "deals" ? d.dealsPageTitle : d.offersPageTitle}
          </h1>
          <p className="mt-0.5 text-xs font-medium text-slate-500">
            {mode === "deals" ? d.dealsPageSubtitle : d.offersPageSubtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {mode === "offers" && (
            <button
              type="button"
              onClick={() => setPhoneDialogOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#007a5a] px-4 text-xs font-extrabold text-white shadow-xs transition hover:bg-[#006248]"
            >
              <PhoneCall className="size-3.5" />
              <span>{d.recordPhoneOfferBtn}</span>
            </button>
          )}

          <button
            type="button"
            disabled={filteredOffers.length === 0}
            onClick={() => exportReport(filteredOffers, "excel")}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-emerald-200 bg-[#eaf8f2] px-3.5 text-xs font-extrabold text-[#007a5a] transition hover:bg-[#007a5a] hover:text-white disabled:opacity-40"
          >
            <Download className="size-3.5" />
            <span>{expL.exportAllBtn}</span>
          </button>

          <button
            type="button"
            disabled={filteredOffers.length === 0}
            onClick={() => exportReport(filteredOffers, "pdf")}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-800 px-3.5 text-xs font-extrabold text-white transition hover:bg-slate-900 disabled:opacity-40"
          >
            <FileText className="size-3.5 text-emerald-300" />
            <span>{expL.exportPdfBtn}</span>
          </button>

          <Link
            href="/admin"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-extrabold text-[#0f1d40] shadow-2xs hover:bg-slate-50"
          >
            {isRtl ? (
              <ArrowRight className="size-3.5" />
            ) : (
              <ArrowLeft className="size-3.5" />
            )}
            <span>{d.backToDashboardBtn}</span>
          </Link>
        </div>
      </div>

      {/* شريط العمولات (يظهر في صفحة الصفقات والمبيعات) */}
      {mode === "deals" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-[#eaf8f2]/70 px-5 py-3.5">
            <div>
              <p className="text-[11px] font-extrabold text-[#007a5a]">
                {d.expectedCommissionsLabel} ({dealMetrics.closingCount})
              </p>
              <strong
                dir="ltr"
                className="mt-0.5 block text-xl font-black text-[#0f1d40] tabular-nums"
              >
                {cur}
                {dealMetrics.expectedCommission.toLocaleString("en-US")}
              </strong>
            </div>
            <Handshake className="size-8 text-[#007a5a]/40" />
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3.5">
            <div>
              <p className="text-[11px] font-extrabold text-slate-500">
                {d.collectedCommissionsLabel} ({dealMetrics.soldCount})
              </p>
              <strong
                dir="ltr"
                className="mt-0.5 block text-xl font-black text-[#007a5a] tabular-nums"
              >
                {cur}
                {dealMetrics.collectedCommission.toLocaleString("en-US")}
              </strong>
            </div>
            <CheckCircle2 className="size-8 text-[#007a5a]/30" />
          </div>
        </div>
      )}

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

      {/* البحث والتبويبات */}
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
          {mode === "deals" ? (
            <>
              {(
                [
                  {
                    id: "closing" as const,
                    label: `${d.tabDealsClosing} (${dealMetrics.closingCount})`,
                  },
                  {
                    id: "sold" as const,
                    label: `${d.tabDealsSold} (${dealMetrics.soldCount})`,
                  },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setDealsTab(tab.id)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-extrabold transition ${
                    dealsTab === tab.id
                      ? "bg-[#007a5a] text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </>
          ) : (
            <>
              {(
                [
                  {
                    id: "all_offers" as const,
                    label: `${d.tabAll} (${offerCounts.all_offers})`,
                  },
                  {
                    id: "pending_admin" as const,
                    label: `${d.tabPendingAdmin} (${offerCounts.pending_admin})`,
                  },
                  {
                    id: "counter_offered" as const,
                    label: `${d.tabCounterNegotiating} (${offerCounts.counter_offered})`,
                  },
                  {
                    id: "pending_seller" as const,
                    label: `${d.tabPendingSellerOnly} (${offerCounts.pending_seller})`,
                  },
                  {
                    id: "rejected" as const,
                    label: `${d.tabRejectedClosed} (${offerCounts.rejected})`,
                  },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setOffersTab(tab.id)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-extrabold transition ${
                    offersTab === tab.id
                      ? tab.id === "counter_offered"
                        ? "bg-purple-700 text-white shadow-2xs"
                        : "bg-[#007a5a] text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* القائمة */}
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
            onClick={loadWorkspace}
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
            const isSalesInitiated = offer.initiated_by === "admin"

            const unitWaitlistOffers =
              mode === "deals" && unit.status !== "sold"
                ? waitlistByUnitMap[String(unit.id)] || []
                : []
            const highestWaitlistCash =
              unitWaitlistOffers.length > 0
                ? Number(unitWaitlistOffers[0].offered_cash || 0)
                : 0
            const isWaitlistOpen = expandedWaitlistDealId === offer.id

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
                id={`deal-card-${offer.id}`}
                key={offer.id}
                className={`relative overflow-hidden rounded-2xl border bg-white p-5 shadow-2xs transition ${
                  isHighlighted
                    ? "border-2 border-[#007a5a] ring-4 ring-[#007a5a]/15"
                    : isReturnedFromWaitlistPriority &&
                        offer.status === "pending_admin"
                      ? "border-2 border-amber-500 bg-amber-50/15"
                      : offer.status === "accepted" && unit.status !== "sold"
                        ? "border-2 border-emerald-300"
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
                      className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold ${
                        isSalesInitiated
                          ? "bg-blue-50 text-blue-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {isSalesInitiated
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
                    {unit.status === "sold" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-700 px-3.5 py-1 text-xs font-extrabold text-white">
                        <Check className="size-3.5" />
                        <span>{d.statusSoldDone}</span>
                      </span>
                    ) : offer.status === "pending_admin" ? (
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
                        <Flame className="size-3.5" />
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
                    ) : offer.status === "accepted" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#007a5a] px-4 py-1 text-xs font-extrabold text-white">
                        <Handshake className="size-3.5" />
                        <span>{d.statusAcceptedReady}</span>
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
                              exportReport(
                                [offer],
                                "excel",
                                `AqarExit_Deal_${offerRef}`,
                                `${expL.singleDealReportTitle} (#${offerRef} — ${unit.project_name || uCode})`
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
                              exportReport(
                                [offer],
                                "pdf",
                                `AqarExit_Deal_${offerRef}`,
                                `${expL.singleDealReportTitle} (#${offerRef} — ${unit.project_name || uCode})`
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

                {/* بطاقات الأطراف والأسعار */}
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
                        {unit.status !== "sold" &&
                          (offer.status === "pending_admin" ||
                            offer.status === "pending_seller" ||
                            offer.status === "counter_offered") && (
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
                              {d.cancelOfferBtn}
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

                {/* قائمة الانتظار المدمجة داخل كارت الصفقة النشطة */}
                {mode === "deals" &&
                  offer.status === "accepted" &&
                  unit.status !== "sold" && (
                    <div className="mt-4 rounded-xl border border-slate-200/90 bg-slate-50/70">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedWaitlistDealId(
                            isWaitlistOpen ? null : offer.id
                          )
                        }
                        className="flex w-full flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-xs font-extrabold text-[#0f1d40] transition hover:bg-slate-100/70"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <Users className="size-4 text-[#007a5a]" />
                          <span>
                            {d.waitlistOnUnitBtn} ({unitWaitlistOffers.length})
                          </span>
                          {highestWaitlistCash > 0 && (
                            <span className="rounded-md bg-white px-2 py-0.5 text-[11px] font-bold text-[#007a5a] shadow-2xs">
                              {d.waitlistHighestOfferLabel}{" "}
                              <strong dir="ltr">
                                {cur}
                                {highestWaitlistCash.toLocaleString("en-US")}
                              </strong>
                            </span>
                          )}
                        </div>
                        <ChevronDown
                          className={`size-4 text-slate-500 transition-transform ${
                            isWaitlistOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {isWaitlistOpen && (
                        <div className="border-t border-slate-200/80 p-3">
                          {unitWaitlistOffers.length === 0 ? (
                            <p className="py-2 text-center text-[11px] font-semibold text-slate-400">
                              {d.waitlistEmptyOnUnit}
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {unitWaitlistOffers.map((wOffer) => {
                                const wDiffs = Array.isArray(
                                  wOffer.diff_reasons
                                )
                                  ? wOffer.diff_reasons
                                  : []
                                const isNotified =
                                  wDiffs.includes(REOPENED_PROMPT_TAG)
                                return (
                                  <div
                                    key={wOffer.id}
                                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs"
                                  >
                                    <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="font-extrabold text-[#0f1d40]">
                                          {wOffer.buyer_name || d.buyerFallback}
                                        </span>
                                        <span
                                          dir="ltr"
                                          className="font-mono text-[11px] text-slate-500"
                                        >
                                          {wOffer.buyer_phone || "—"}
                                        </span>
                                        {isNotified && (
                                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">
                                            {d.badgeReopenNotifiedWaiting}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <strong
                                        dir="ltr"
                                        className="text-sm font-black text-[#007a5a] tabular-nums"
                                      >
                                        {cur}
                                        {Number(
                                          wOffer.offered_cash || 0
                                        ).toLocaleString("en-US")}
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
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                {/* الشريط السفلي للإجراءات */}
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
                        ⚠️ {d.confirmActionPrompt} ({activeConfirm.label})؟
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
                      {offer.status === "pending_admin" &&
                        unit.status !== "sold" && (
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

                      {offer.status === "accepted" && unit.status !== "sold" && (
                        <>
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
                        </>
                      )}

                      {(offer.status === "pending_seller" ||
                        offer.status === "counter_offered") &&
                        unit.status !== "sold" && (
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
        open={phoneDialogOpen}
        onClose={() => setPhoneDialogOpen(false)}
        leads={leadsList}
        units={unitsList}
        onSuccess={({ offerId, isDirectDeal }) => {
          setNotice({
            text: isDirectDeal
              ? d.directDealCreatedNotice
              : d.phoneOfferSentNotice,
          })
          if (isDirectDeal && offerId) {
            router.push(`/admin/deals?offerId=${offerId}`)
          } else {
            loadWorkspace()
          }
        }}
      />
    </div>
  )
}