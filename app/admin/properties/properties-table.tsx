"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Search,
  Trash2,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  downloadExcelCsv,
  downloadOfficialPdfReport,
  EXPORT_LABELS,
} from "@/lib/export-csv"
import { useTranslation } from "@/lib/i18n"
import {
  calculateSmartMatch,
  type MatchableBuyer,
} from "@/lib/smart-matcher"
import { UnitSmartMatchModal } from "@/components/features/admin/smart-match-dialogs"
import {
  deletePropertyAction,
  managePropertyPromotionAction,
  purgeSellerDeletedPropertiesAction,
  updatePropertyStatusAction,
  verifyUserContactByAdminAction,
} from "../../../actions/admin-actions"
import {
  buildOwnerPerformanceReportWhatsAppMessage,
  buildSellerWhatsAppMessage,
  cleanPropertyAreaDisplay,
  deriveShortUnitCode,
  getUploadedDocsList,
  isSelfOfferOnProperty,
  normalizeOfferStatus,
  type ConfirmPropertyAction,
  type SellRequest,
  type UserVerificationBadgeInfo,
} from "./properties-helpers"
import {
  PropertyConfirmDialog,
  PropertyDetailsDialog,
} from "./properties-modals"
import {
  PropertyActivityBadges,
  PropertyDesktopRow,
  PropertyDocsQuickDialog,
  PropertyMobileCard,
} from "./properties-row-cards"

export type { SellRequest, UserVerificationBadgeInfo }

function normalizeRowStatus(rawStatus?: string | null): string {
  const clean = String(rawStatus || "pending").trim().toLowerCase()
  if (clean === "approved" || clean === "published") return "active"
  return clean
}

function isUnitEligibleForOffers(status: string): boolean {
  return (
    status === "active" ||
    status === "offer_received" ||
    status === "transferring" ||
    status === "sold"
  )
}

export default function PropertiesTable({
  properties,
  buyers = [],
  offers = [],
  verificationMap = {},
  mode = "properties",
}: {
  properties: SellRequest[]
  buyers?: MatchableBuyer[]
  offers?: any[]
  verificationMap?: Record<string, UserVerificationBadgeInfo>
  mode?: "properties" | "promotions"
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isPromotionsPage = mode === "promotions"

  const { t: dict, locale, dir } = useTranslation()
  const t = dict.admin.propertiesAdmin as Record<string, any>
  const propBadges = (t.badges as Record<string, string>) || {}
  const propNotices = (t.notices as Record<string, string>) || {}
  const leadsPrompts = dict.admin.leads
  const sm = (dict.admin as Record<string, any>).smartMatch || {}
  const dealsDict = (dict.admin as Record<string, any>).dealsPage || {}
  const expL = EXPORT_LABELS[locale] || EXPORT_LABELS.ar
  const aL = (t.analytics as Record<string, string>) || {}

  function getMatchedBuyersForUnit(unit: SellRequest) {
    const st = normalizeRowStatus(unit.status)
    if (!isUnitEligibleForOffers(st) || st === "sold") return []
    if (!buyers || buyers.length === 0) return []
    const unitPhoneDigits = String(unit.phone || "").replace(/\D/g, "")
    return buyers
      .filter((b) => {
        if (
          b.user_id &&
          unit.user_id &&
          String(b.user_id) === String(unit.user_id)
        )
          return false
        const bPhoneDigits = String(b.phone || "").replace(/\D/g, "")
        if (
          bPhoneDigits.length >= 8 &&
          unitPhoneDigits.length >= 8 &&
          bPhoneDigits.slice(-8) === unitPhoneDigits.slice(-8)
        ) {
          return false
        }
        return true
      })
      .map((buyer) => ({
        buyer,
        match: calculateSmartMatch(unit, buyer, undefined, locale),
      }))
      .filter((item) => item.match.score >= 60)
      .sort((a, b) => b.match.score - a.match.score)
  }

  function getValidOffersForUnit(unit: SellRequest) {
    const st = normalizeRowStatus(unit.status)
    if (!isUnitEligibleForOffers(st)) return []
    return offers
      .filter(
        (o) =>
          String(o.property_id) === String(unit.id) &&
          !isSelfOfferOnProperty(o, unit)
      )
      .map((o) => ({ ...o, status: normalizeOfferStatus(o) }))
      .filter((o) => o.status !== "recommended" && o.status !== "rejected")
  }

  function getEffectiveUnitStage(property: SellRequest): string {
    const rawSt = normalizeRowStatus(property.status)
    if (!isUnitEligibleForOffers(rawSt) || rawSt === "sold") return rawSt
    const validOffers = getValidOffersForUnit(property)
    if (validOffers.some((o) => o.status === "accepted")) return "transferring"
    if (
      validOffers.some(
        (o) => o.status === "pending_seller" || o.status === "counter_offered"
      )
    ) {
      return "offer_received"
    }
    if (rawSt === "transferring" || rawSt === "offer_received") return "active"
    return rawSt
  }

  const sellerStatusOptions = [
    {
      value: "pending",
      label: t.statuses.pending,
      badge: "bg-amber-50 text-amber-900 border-amber-300",
    },
    {
      value: "under_review",
      label: t.statuses.under_review,
      badge: "bg-blue-50 text-blue-900 border-blue-300",
    },
    {
      value: "active",
      label: t.statuses.active,
      badge: "bg-[#eaf8f2] text-[#007a5a] border-emerald-300",
    },
    {
      value: "offer_received",
      label: t.statuses.offer_received,
      badge: "bg-purple-50 text-purple-900 border-purple-300",
    },
    {
      value: "transferring",
      label: t.statuses.transferring,
      badge: "bg-indigo-50 text-indigo-900 border-indigo-300",
    },
    {
      value: "sold",
      label: t.statuses.sold,
      badge: "bg-[#007a5a] text-white border-[#007a5a]",
    },
    {
      value: "paused_by_seller",
      label: t.statuses.paused_by_seller,
      badge: "bg-orange-50 text-orange-900 border-orange-300",
    },
    {
      value: "deleted_by_seller",
      label: t.statuses.deleted_by_seller,
      badge: "bg-red-50 text-red-900 border-red-300",
    },
    {
      value: "rejected",
      label: t.statuses.rejected,
      badge: "bg-red-50 text-red-900 border-red-300",
    },
  ]

  const docsDict = t.docs as Record<string, string>
  const docLabels: Record<string, string> = {
    contract: docsDict.contract,
    receipts: docsDict.receipts,
    statement: docsDict.statement,
    national_id: docsDict.passport || docsDict.national_id,
    passport: docsDict.passport || docsDict.national_id,
  }

  function getStatusLabel(status: string | null | undefined) {
    const st = normalizeRowStatus(status)
    return sellerStatusOptions.find((s) => s.value === st)?.label || st
  }

  const unitCur = "$"

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [promoTab, setPromoTab] = useState<
    "all_promo" | "pending_payment" | "active_featured" | "all_units"
  >("all_promo")

  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [highlightedUnitId, setHighlightedUnitId] = useState<string | null>(
    null
  )
  const [detailsProperty, setDetailsProperty] = useState<SellRequest | null>(
    null
  )
  const [docsProperty, setDocsProperty] = useState<SellRequest | null>(null)
  const [smartMatchProperty, setSmartMatchProperty] =
    useState<SellRequest | null>(null)
  const [confirmAction, setConfirmAction] =
    useState<ConfirmPropertyAction | null>(null)
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null)
  const [reason, setReason] = useState("")
  const [notice, setNotice] = useState<{
    text: string
    isError?: boolean
  } | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    const closeMenu = () => setOpenMenuId(null)
    window.addEventListener("click", closeMenu)
    return () => window.removeEventListener("click", closeMenu)
  }, [])

  useEffect(() => {
    const tabParam = searchParams.get("tab")
    const unitIdParam = searchParams.get("unitId")
    const actionParam = searchParams.get("action")
    const qParam = searchParams.get("q")
    const verifyPhoneUserIdParam = searchParams.get("verifyPhoneUserId")

    if (qParam) setSearch(qParam)
    if (!isPromotionsPage && tabParam && tabParam !== "featured") {
      setStatusFilter(tabParam)
    }

    if (verifyPhoneUserIdParam) {
      const alreadyVerified =
        verificationMap?.[verifyPhoneUserIdParam]?.phoneVerified
      if (!alreadyVerified) handleVerifySellerContact(verifyPhoneUserIdParam)
    }

    if (unitIdParam) {
      setHighlightedUnitId(unitIdParam)
      const targetProp = properties.find((p) => p.id === unitIdParam)
      if (targetProp) {
        if (
          !isPromotionsPage &&
          normalizeRowStatus(targetProp.status) === "deleted_by_seller"
        ) {
          setStatusFilter("deleted")
        }
        if (actionParam === "promote") {
          setConfirmAction({
            type: "promote",
            property: targetProp,
            promoAction: "activate",
            days: targetProp.featured_days || 14,
            tier:
              targetProp.boost_tier === "vip_plus" ? "vip_plus" : "super_vip",
          })
        }
        setTimeout(() => {
          document
            .getElementById(`prop-row-${unitIdParam}`)
            ?.scrollIntoView({ behavior: "smooth", block: "center" })
        }, 250)
      }
    }
  }, [searchParams, properties, isPromotionsPage])

  function closeConfirmModal() {
    if (pending) return
    setConfirmAction(null)
    setReason("")
  }

  function handleVerifySellerContact(userId: string) {
    setNotice(null)
    startTransition(async () => {
      const res = await verifyUserContactByAdminAction({ userId, type: "both" })
      if (res.success) {
        setNotice({ text: propNotices.sellerVerifiedSuccess })
        router.refresh()
      } else {
        setNotice({ text: res.error || t.loadError, isError: true })
      }
    })
  }

  function executeConfirmedAction() {
    if (!confirmAction) return
    setNotice(null)

    if (confirmAction.type === "purge_all_deleted") {
      startTransition(async () => {
        try {
          const res = await purgeSellerDeletedPropertiesAction()
          if (res.success) {
            setNotice({ text: propNotices.purgedSuccess })
            router.refresh()
          } else {
            setNotice({ text: res.error || t.loadError, isError: true })
          }
        } finally {
          setConfirmAction(null)
        }
      })
      return
    }

    const target = confirmAction.property
    setActivePropertyId(target.id)

    startTransition(async () => {
      try {
        if (confirmAction.type === "status") {
          const res = await updatePropertyStatusAction(
            target.id,
            confirmAction.newStatus,
            reason.trim() ? reason.trim() : undefined
          )
          if (res.success) {
            setNotice({
              text: `${propNotices.statusUpdated} ("${target.project_name || target.name}" → ${getStatusLabel(confirmAction.newStatus)})`,
            })
            router.refresh()
          } else {
            setNotice({ text: res.error || t.loadError, isError: true })
          }
        } else if (confirmAction.type === "delete") {
          const res = await deletePropertyAction(target.id)
          if (res.success) {
            setNotice({
              text: `${propNotices.deletedSuccess} ("${target.project_name || target.name}")`,
            })
            router.refresh()
          } else {
            setNotice({ text: res.error || t.loadError, isError: true })
          }
        } else if (confirmAction.type === "promote") {
          const resolvedTier =
            confirmAction.tier ||
            (target.boost_tier === "vip_plus" ? "vip_plus" : "super_vip")
          const res = await managePropertyPromotionAction(
            target.id,
            confirmAction.promoAction,
            confirmAction.days,
            resolvedTier
          )
          if (res.success) {
            setNotice({
              text:
                confirmAction.promoAction === "activate"
                  ? `${propNotices.promoActivated} ("${target.project_name || target.name}" - ${resolvedTier === "vip_plus" ? "VIP+" : "SUPER VIP"} · ${confirmAction.days} ${propBadges.dayWord})`
                  : `${propNotices.promoCancelled} ("${target.project_name || target.name}")`,
            })
            router.refresh()
          } else {
            setNotice({ text: res.error || t.loadError, isError: true })
          }
        }
      } finally {
        setConfirmAction(null)
        setReason("")
        setActivePropertyId(null)
      }
    })
  }

  const deletedBySellerList = properties.filter(
    (p) => normalizeRowStatus(p.status) === "deleted_by_seller"
  )
  const pendingPromoList = properties.filter(
    (p) =>
      normalizeRowStatus(p.status) !== "deleted_by_seller" &&
      !p.is_featured &&
      p.featured_status === "pending_payment"
  )
  const activePromoList = properties.filter(
    (p) =>
      normalizeRowStatus(p.status) !== "deleted_by_seller" &&
      Boolean(p.is_featured)
  )
  const promoRequestsList = properties.filter(
    (p) =>
      normalizeRowStatus(p.status) !== "deleted_by_seller" &&
      (p.featured_status === "pending_payment" || p.is_featured)
  )
  const sellerActionsList = properties.filter((p) => {
    const st = normalizeRowStatus(p.status)
    return (
      st === "paused_by_seller" ||
      (st === "pending" &&
        (p.submission_type === "edited_by_seller" ||
          p.submission_type === "resumed_by_seller"))
    )
  })

  const filtered = properties.filter((p) => {
    const currentStatus = getEffectiveUnitStage(p)
    const unitShortCode = p.id.slice(0, 8).toUpperCase()
    const uPublicCode = deriveShortUnitCode(p.id, p.code)
    const orderRefCode = `AE-${p.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase()}`
    const localizedArea = cleanPropertyAreaDisplay(p.area, locale)

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      const qDigits = q.replace(/\D/g, "")
      const propPhoneDigits = String(p.phone || "").replace(/\D/g, "")
      const textMatch =
        `${p.id} ${unitShortCode} ${uPublicCode} ${orderRefCode} ${p.project_name || ""} ${p.area || ""} ${localizedArea} ${p.name || ""} ${p.phone || ""} ${p.email || ""} ${p.featured_fawry_code || ""}`
          .toLowerCase()
          .includes(q) ||
        (qDigits.length >= 5 && propPhoneDigits.includes(qDigits))

      if (!textMatch) return false
      if (isPromotionsPage) return currentStatus !== "deleted_by_seller"
    }

    if (isPromotionsPage) {
      if (currentStatus === "deleted_by_seller") return false
      if (promoTab === "pending_payment") {
        return !p.is_featured && p.featured_status === "pending_payment"
      }
      if (promoTab === "active_featured") return Boolean(p.is_featured)
      if (promoTab === "all_units") return true
      return Boolean(p.is_featured || p.featured_status === "pending_payment")
    }

    if (statusFilter === "deleted") return currentStatus === "deleted_by_seller"
    if (currentStatus === "deleted_by_seller") return false

    if (statusFilter === "seller_actions") {
      return (
        currentStatus === "paused_by_seller" ||
        p.submission_type === "edited_by_seller" ||
        p.submission_type === "resumed_by_seller"
      )
    }
    if (statusFilter === "pending") {
      return currentStatus === "pending" || currentStatus === "under_review"
    }
    if (statusFilter === "offer_received") {
      return (
        currentStatus === "offer_received" || currentStatus === "transferring"
      )
    }
    if (statusFilter !== "all" && currentStatus !== statusFilter) return false
    return true
  })

  const totalFilteredViews = filtered.reduce(
    (sum, p) => sum + Math.max(1, Number(p.views_count) || 1),
    0
  )

  function exportUnitsReport(
    rowsToExport: SellRequest[],
    format: "excel" | "pdf" = "excel",
    prefix = "AqarExit_Units",
    customTitle?: string
  ) {
    const c = expL.cols
    const resolvedTitle =
      customTitle ||
      (rowsToExport.length === 1
        ? `${expL.singlePropertyReportTitle} — ${rowsToExport[0].project_name || rowsToExport[0].name} (${deriveShortUnitCode(rowsToExport[0].id, rowsToExport[0].code)})`
        : isPromotionsPage
          ? expL.promotionsReportTitle
          : expL.propertiesReportTitle)

    const columns = [
      { header: c.index, accessor: (_: SellRequest, idx: number) => idx + 1 },
      {
        header: c.unitCode,
        accessor: (p: SellRequest) => deriveShortUnitCode(p.id, p.code),
      },
      {
        header: c.projectName,
        accessor: (p: SellRequest) =>
          p.project_name || t.table.unspecifiedProject,
      },
      {
        header: c.developer,
        accessor: (p: SellRequest) => p.developer_name || "—",
      },
      {
        header: c.area,
        accessor: (p: SellRequest) => cleanPropertyAreaDisplay(p.area, locale),
      },
      {
        header: c.unitType,
        accessor: (p: SellRequest) => p.unit_type || t.table.defaultUnitType,
      },
      { header: c.sizeSqm, accessor: (p: SellRequest) => p.size || "—" },
      { header: c.rooms, accessor: (p: SellRequest) => p.rooms || "—" },
      {
        header: aL.viewsColumnHeader,
        accessor: (p: SellRequest) => Math.max(1, Number(p.views_count) || 1),
      },
      {
        header: c.requiredCash,
        accessor: (p: SellRequest) => Number(p.paid_amount || 0),
      },
      {
        header: c.contractPrice,
        accessor: (p: SellRequest) => Number(p.contract_price || 0),
      },
      {
        header: c.marketPrice,
        accessor: (p: SellRequest) => Number(p.market_price || 0),
      },
      {
        header: c.installment,
        accessor: (p: SellRequest) => Number(p.installment_amount || 0),
      },
      {
        header: c.frequency,
        accessor: (p: SellRequest) => p.installment_frequency || "—",
      },
      {
        header: c.negotiable,
        accessor: (p: SellRequest) =>
          p.willing_to_discount ? expL.yes : expL.no,
      },
      { header: c.sellerName, accessor: (p: SellRequest) => p.name },
      {
        header: c.sellerPhone,
        accessor: (p: SellRequest) => p.phone,
        isPhone: true,
      },
      { header: c.sellerEmail, accessor: (p: SellRequest) => p.email || "—" },
      {
        header: c.status,
        accessor: (p: SellRequest) => getStatusLabel(getEffectiveUnitStage(p)),
      },
      {
        header: c.promoTier,
        accessor: (p: SellRequest) =>
          p.is_featured
            ? `${p.boost_tier === "vip_plus" ? "+VIP" : "SUPER VIP"}${p.featured_days ? ` (${p.featured_days}d)` : ""}`
            : p.featured_status === "pending_payment"
              ? `${propBadges.promoReqPrefix} (${p.featured_fawry_code || "AD"})`
              : expL.normalTier,
      },
      {
        header: c.createdAt,
        accessor: (p: SellRequest) =>
          new Date(p.created_at).toLocaleDateString("en-GB"),
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

  function handleExportSingle(property: SellRequest, format: "excel" | "pdf") {
    const uCode = deriveShortUnitCode(property.id, property.code)
    exportUnitsReport(
      [property],
      format,
      `AqarExit_Unit_${uCode}`,
      `${expL.singlePropertyReportTitle} (${uCode} — ${property.project_name || property.name})`
    )
  }

  function buildCardProps(property: SellRequest, index?: number) {
    const rawStatus = normalizeRowStatus(property.status)
    const currentSt = getEffectiveUnitStage(property)
    const stObj =
      sellerStatusOptions.find((s) => s.value === currentSt) ||
      sellerStatusOptions[0]
    const isFeaturedActive =
      Boolean(property.is_featured) &&
      (!property.featured_until ||
        new Date(property.featured_until) > new Date())
    const docsCount = getUploadedDocsList(
      property.documents,
      docLabels,
      t.docs.fallbackName
    ).length
    const matchedBuyersCount = getMatchedBuyersForUnit(property).length
    const validOffers = getValidOffersForUnit(property)

    return {
      property,
      index,
      rawStatus,
      currentSt,
      stObj,
      sellerStatusOptions,
      isLoading: pending && activePropertyId === property.id,
      isHighlighted: highlightedUnitId === property.id,
      isFeaturedActive,
      unitCur,
      locale,
      t,
      propBadges,
      leadsPrompts,
      sm,
      dealsDict,
      aL,
      expL,
      pending,
      verificationMap,
      openMenuId,
      setOpenMenuId,
      onConfirmAction: setConfirmAction,
      onOpenDetails: setDetailsProperty,
      onOpenDocs: setDocsProperty,
      onOpenSmartMatch: setSmartMatchProperty,
      onExportSingle: handleExportSingle,
      matchedBuyersCount,
      validOffers,
      docsCount,
    }
  }

  const activeCount = properties.length - deletedBySellerList.length
  const georgiaLabel = t.countries?.GE || ""
  const modalDocsList = docsProperty
    ? getUploadedDocsList(
        docsProperty.documents,
        docLabels,
        t.docs.fallbackName
      )
    : []

  return (
    <div dir={dir} className="text-start">
      {notice && (
        <div
          role="status"
          className={`mb-4 flex items-center justify-between gap-3 rounded-xl border p-3.5 text-xs font-bold shadow-xs sm:text-sm ${
            notice.isError
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-[#eaf8f2] text-[#007a5a]"
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.isError ? (
              <AlertTriangle className="size-4 shrink-0 text-red-600" />
            ) : (
              <CheckCircle2 className="size-4 shrink-0 text-[#007a5a]" />
            )}
            <span>{notice.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="rounded-lg p-1 opacity-70 hover:bg-black/5 hover:opacity-100"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex w-full flex-wrap items-center gap-2 sm:max-w-xl sm:flex-1">
          <div className="relative min-w-[180px] flex-1">
            <Search className="pointer-events-none absolute top-1/2 end-3 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                isPromotionsPage
                  ? t.filters.promoSearchPlaceholder
                  : t.filters.sellSearchPlaceholder
              }
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 ps-3 pe-9 text-xs font-semibold focus:border-[#007a5a] focus:bg-white focus:outline-none"
            />
          </div>

          <button
            type="button"
            disabled={filtered.length === 0}
            onClick={() =>
              exportUnitsReport(
                filtered,
                "excel",
                isPromotionsPage ? "AqarExit_Promotions" : "AqarExit_Properties"
              )
            }
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-emerald-200 bg-[#eaf8f2] px-3 text-xs font-extrabold text-[#007a5a] transition hover:bg-[#007a5a] hover:text-white disabled:opacity-40"
          >
            <Download className="size-3.5" />
            <span>{expL.exportAllBtn}</span>
          </button>

          <button
            type="button"
            disabled={filtered.length === 0}
            onClick={() =>
              exportUnitsReport(
                filtered,
                "pdf",
                isPromotionsPage ? "AqarExit_Promotions" : "AqarExit_Properties"
              )
            }
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-800 px-3 text-xs font-extrabold text-white transition hover:bg-slate-900 disabled:opacity-40"
          >
            <FileText className="size-3.5 text-emerald-300" />
            <span>{expL.exportPdfBtn}</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {isPromotionsPage ? (
            <>
              {[
                {
                  id: "all_promo" as const,
                  label: `${t.filters.allTab} (${promoRequestsList.length})`,
                },
                {
                  id: "pending_payment" as const,
                  label: `${t.filters.pendingActivationTab} (${pendingPromoList.length})`,
                },
                {
                  id: "active_featured" as const,
                  label: `${t.filters.activeFeaturedTab} (${activePromoList.length})`,
                },
                {
                  id: "all_units" as const,
                  label: `${t.filters.manualPromoteTab} (${activeCount})`,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setPromoTab(tab.id)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    promoTab === tab.id
                      ? "bg-[#007a5a] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </>
          ) : (
            <>
              {[
                { id: "all", label: `${t.filters.allTab} (${activeCount})` },
                { id: "pending", label: t.filters.pendingReviewTab },
                { id: "active", label: t.filters.activeMarketTab },
                {
                  id: "seller_actions",
                  label: `${t.filters.editedPausedTab} (${sellerActionsList.length})`,
                },
                { id: "offer_received", label: t.filters.offerReceivedTab },
                { id: "sold", label: t.filters.soldTab },
                { id: "rejected", label: t.filters.rejectedTab },
                {
                  id: "deleted",
                  label: `${t.filters.deletedTab} (${deletedBySellerList.length})`,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    statusFilter === tab.id
                      ? tab.id === "deleted"
                        ? "bg-red-600 text-white"
                        : "bg-[#007a5a] text-white"
                      : tab.id === "deleted" && deletedBySellerList.length > 0
                        ? "bg-red-50 text-red-700 hover:bg-red-100"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {!isPromotionsPage &&
        statusFilter === "deleted" &&
        deletedBySellerList.length > 0 && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50/80 px-4 py-2.5 text-xs text-red-900">
            <span className="font-bold">
              {t.filters.deletedBannerTitle} ({deletedBySellerList.length})
            </span>
            <Button
              size="sm"
              disabled={pending}
              onClick={() =>
                setConfirmAction({
                  type: "purge_all_deleted",
                  count: deletedBySellerList.length,
                })
              }
              className="h-8 rounded-lg bg-red-600 px-3 text-xs font-bold text-white hover:bg-red-700"
            >
              <Trash2 className="me-1 size-3.5" />
              {t.filters.purgeAllBtn}
            </Button>
          </div>
        )}

      {/* 1. عرض الموبايل */}
      <div className="space-y-3.5 md:hidden">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
            {t.table.emptyText}
          </div>
        ) : (
          filtered.map((property) => (
            <PropertyMobileCard
              key={property.id}
              {...buildCardProps(property)}
            />
          ))
        )}
      </div>

      {/* 2. عرض الكمبيوتر */}
      <div className="hidden md:block">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white px-5 py-3.5 shadow-2xs">
          <h2 className="text-sm font-black text-[#0f1d40] sm:text-base">
            {isPromotionsPage
              ? `${t.header.promoCountryTitle} ${georgiaLabel} (${filtered.length})`
              : `${t.header.sellCountryTitle} ${georgiaLabel} (${filtered.length})`}
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-[#2563eb]">
              <Eye className="size-3.5" />
              <span>
                {aL.totalViewsLabel}{" "}
                <strong className="tabular-nums">
                  {totalFilteredViews.toLocaleString("en-US")}
                </strong>
              </span>
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-[#007a5a]" />
              <span>
                {
                  filtered.filter(
                    (p) => getEffectiveUnitStage(p) === "active"
                  ).length
                }{" "}
                {t.filters.activeMarketTab}
              </span>
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-amber-500" />
              <span>
                {
                  filtered.filter((p) => {
                    const st = getEffectiveUnitStage(p)
                    return st === "pending" || st === "under_review"
                  }).length
                }{" "}
                {t.filters.pendingReviewTab}
              </span>
            </span>
          </div>
        </div>

        <div className="mb-2.5 grid grid-cols-[minmax(0,3.5fr)_minmax(0,2.5fr)_minmax(0,3fr)_215px] items-center gap-4 rounded-xl border border-slate-200/90 bg-slate-100/80 px-5 py-2.5 text-[11px] font-extrabold text-slate-600">
          <div>{t.table.colProject}</div>
          <div>{t.table.colCash}</div>
          <div>{t.table.colClient}</div>
          <div className="text-center">{t.table.colStage}</div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-xs font-bold text-slate-400">
            {t.table.emptyText}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((property, index) => (
              <PropertyDesktopRow
                key={property.id}
                {...buildCardProps(property, index)}
              />
            ))}
          </div>
        )}
      </div>

      <PropertyDocsQuickDialog
        dir={dir}
        t={t}
        propBadges={propBadges}
        docsProperty={docsProperty}
        docsList={modalDocsList}
        onClose={() => setDocsProperty(null)}
        onOpenFullDetails={(prop) => setDetailsProperty(prop)}
      />

      <UnitSmartMatchModal
        unit={smartMatchProperty}
        buyers={buyers}
        offers={offers}
        onClose={() => setSmartMatchProperty(null)}
        onNotice={(msg) => setNotice(msg)}
      />

      <PropertyConfirmDialog
        dir={dir}
        t={t}
        confirmAction={confirmAction}
        setConfirmAction={setConfirmAction}
        reason={reason}
        setReason={setReason}
        pending={pending}
        getStatusLabel={getStatusLabel}
        onClose={closeConfirmModal}
        onExecute={executeConfirmedAction}
      />

      <PropertyDetailsDialog
        dir={dir}
        locale={locale}
        t={t}
        publicSiteLabel={aL.viewUnitBtn}
        whatsappBtnLabel={dict.admin?.leads?.whatsappBtn || ""}
        detailsProperty={detailsProperty}
        onClose={() => setDetailsProperty(null)}
        unitCur={unitCur}
        waMessage={
          detailsProperty
            ? buildSellerWhatsAppMessage({
                property: detailsProperty,
                unitCur,
                locale,
                t,
                leadsPrompts,
              })
            : ""
        }
        reportWaMessage={
          detailsProperty
            ? buildOwnerPerformanceReportWhatsAppMessage({
                property: detailsProperty,
                viewsCount: Math.max(
                  1,
                  Number(detailsProperty.views_count) || 1
                ),
                offersCount: getValidOffersForUnit(detailsProperty).length,
                matchedBuyersCount:
                  getMatchedBuyersForUnit(detailsProperty).length,
                locale,
                t,
              })
            : ""
        }
        uploadedDocs={
          detailsProperty
            ? getUploadedDocsList(
                detailsProperty.documents,
                docLabels,
                t.docs.fallbackName
              )
            : []
        }
        verificationMap={verificationMap}
        onVerifySellerContact={handleVerifySellerContact}
        pending={pending}
        renderBadges={(prop) => (
          <PropertyActivityBadges {...buildCardProps(prop)} />
        )}
      />
    </div>
  )
}