"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  AlertTriangle,
  BarChart3,
  Check,
  CheckCircle2,
  Clock,
  Crown,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileCheck2,
  FileText,
  Flame,
  Handshake,
  Loader2,
  MessageCircle,
  MoreVertical,
  PauseCircle,
  Phone,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  Star,
  Trash2,
  User,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  downloadExcelCsv,
  downloadOfficialPdfReport,
  EXPORT_LABELS,
} from "@/lib/export-csv"
import { useTranslation, type LocaleCode } from "@/lib/i18n"
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
  getRemainingDaysBeforePurge,
  getUploadedDocsList,
  isSelfOfferOnProperty,
  isSellerEmailVerified,
  isSellerPhoneVerified,
  normalizeOfferStatus,
  type ConfirmPropertyAction,
  type SellRequest,
  type UserVerificationBadgeInfo,
} from "./properties-helpers"
import {
  PropertyConfirmDialog,
  PropertyDetailsDialog,
} from "./properties-modals"

export type { SellRequest, UserVerificationBadgeInfo }

const ANALYTICS_UI_LABELS: Record<
  LocaleCode,
  {
    viewsWord: string
    totalViewsLabel: string
    sendReportWaBtn: string
    viewsColumnHeader: string
  }
> = {
  ar: {
    viewsWord: "مشاهدة",
    totalViewsLabel: "إجمالي مشاهدات الوحدات:",
    sendReportWaBtn: "إرسال تقرير المشاهدات للمالك (واتساب)",
    viewsColumnHeader: "المشاهدات",
  },
  en: {
    viewsWord: "views",
    totalViewsLabel: "Total Unit Views:",
    sendReportWaBtn: "Send Views Report to Owner (WhatsApp)",
    viewsColumnHeader: "Views",
  },
  ru: {
    viewsWord: "просм.",
    totalViewsLabel: "Всего просмотров:",
    sendReportWaBtn: "Отправить отчет о просмотрах (WhatsApp)",
    viewsColumnHeader: "Просмотры",
  },
  ka: {
    viewsWord: "ნახვა",
    totalViewsLabel: "სულ ნახვები:",
    sendReportWaBtn: "ნახვების რეპორტის გაგზავნა (WhatsApp)",
    viewsColumnHeader: "ნახვები",
  },
}

function normalizeRowStatus(rawStatus?: string | null): string {
  const clean = String(rawStatus || "pending").trim().toLowerCase()
  if (clean === "approved" || clean === "published") return "active"
  return clean
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
  const expL = EXPORT_LABELS[locale] || EXPORT_LABELS.ar
  const aL = ANALYTICS_UI_LABELS[locale] || ANALYTICS_UI_LABELS.ar

  function getMatchedBuyersForUnit(unit: SellRequest) {
    if (!buyers || buyers.length === 0) return []
    const unitPhoneDigits = String(unit.phone || "").replace(/\D/g, "")
    return buyers
      .filter((b) => {
        if (b.user_id && unit.user_id && String(b.user_id) === String(unit.user_id))
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

  function getOffersCountForUnit(unit: SellRequest) {
    return offers.filter(
      (o) =>
        String(o.property_id) === String(unit.id) &&
        !isSelfOfferOnProperty(o, unit) &&
        normalizeOfferStatus(o) !== "recommended"
    ).length
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
      badge: "bg-emerald-50 text-[#105C50] border-emerald-300",
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
      badge: "bg-teal-700 text-white border-teal-700",
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
      if (!alreadyVerified) {
        handleVerifySellerContact(verifyPhoneUserIdParam)
      }
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
          const el = document.getElementById(`prop-row-${unitIdParam}`)
          el?.scrollIntoView({ behavior: "smooth", block: "center" })
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
      const res = await verifyUserContactByAdminAction({
        userId,
        type: "both",
      })
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
            const stLabel = getStatusLabel(confirmAction.newStatus)
            setNotice({
              text: `${propNotices.statusUpdated} ("${target.project_name || target.name}" → ${stLabel})`,
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
    const currentStatus = normalizeRowStatus(p.status)
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
        accessor: (p: SellRequest) => getStatusLabel(p.status),
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

  function renderThreeDotsMenu(
    property: SellRequest,
    currentSt: string,
    isFeaturedActive: boolean
  ) {
    const isMenuOpen = openMenuId === property.id
    const uCode = deriveShortUnitCode(property.id, property.code)
    const viewsCount = Math.max(1, Number(property.views_count) || 1)
    const matchedBuyersCount = getMatchedBuyersForUnit(property).length
    const offersCount = getOffersCountForUnit(property)

    const reportWaMessage = buildOwnerPerformanceReportWhatsAppMessage({
      property,
      viewsCount,
      offersCount,
      matchedBuyersCount,
      locale,
    })

    return (
      <div
        className="relative"
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        <button
          type="button"
          aria-label={expL.moreActionsAria}
          onClick={(e) => {
            e.stopPropagation()
            setOpenMenuId(isMenuOpen ? null : property.id)
          }}
          className="flex size-8 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-600 transition hover:border-[#105C50] hover:bg-white hover:text-[#0a1122]"
        >
          <MoreVertical className="size-4" />
        </button>

        {isMenuOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute end-0 top-9 z-50 w-60 overflow-hidden rounded-xl border border-gray-200 bg-white p-1.5 shadow-2xl"
          >
            <Link
              href={`/opportunities/${property.id}`}
              target="_blank"
              onClick={() => setOpenMenuId(null)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-xs font-bold text-[#0a1122] transition hover:bg-gray-50"
            >
              <ExternalLink className="size-3.5 text-[#105C50]" />
              <span>{dict.admin?.shell?.publicSite}</span>
            </Link>

            {/* زر إرسال تقرير المشاهدات والأداء للمالك عبر واتساب */}
            <a
              href={`https://wa.me/${String(property.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(reportWaMessage)}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpenMenuId(null)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-xs font-bold text-[#2563eb] transition hover:bg-blue-50"
            >
              <BarChart3 className="size-3.5 shrink-0 text-[#2563eb]" />
              <span>{aL.sendReportWaBtn}</span>
            </a>

            {currentSt !== "deleted_by_seller" && (
              <>
                <button
                  type="button"
                  disabled={pending}
                  onClick={(e) => {
                    e.stopPropagation()
                    setOpenMenuId(null)
                    setConfirmAction({
                      type: "promote",
                      property,
                      promoAction: isFeaturedActive ? "cancel" : "activate",
                      days: property.featured_days || 14,
                      tier:
                        property.boost_tier === "vip_plus"
                          ? "vip_plus"
                          : "super_vip",
                    })
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-xs font-bold text-amber-800 transition hover:bg-amber-50"
                >
                  <Star
                    className={`size-3.5 ${
                      isFeaturedActive
                        ? "fill-amber-500 text-amber-600"
                        : "text-amber-600"
                    }`}
                  />
                  <span>
                    {isFeaturedActive
                      ? t.actions.cancelPromoBtn
                      : t.actions.promoteStarBtn}
                  </span>
                </button>

                {currentSt === "active" ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpenMenuId(null)
                      setConfirmAction({
                        type: "status",
                        property,
                        newStatus: "paused_by_seller",
                      })
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-xs font-bold text-orange-800 transition hover:bg-orange-50"
                  >
                    <EyeOff className="size-3.5 text-orange-600" />
                    <span>{t.actions.unpublishBtn}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpenMenuId(null)
                      setConfirmAction({
                        type: "status",
                        property,
                        newStatus: "active",
                      })
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-xs font-bold text-[#105C50] transition hover:bg-emerald-50"
                  >
                    <Check className="size-3.5 text-[#105C50]" />
                    <span>{t.actions.publishShortBtn}</span>
                  </button>
                )}
              </>
            )}

            <div className="my-1 border-t border-gray-100" />

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setOpenMenuId(null)
                exportUnitsReport(
                  [property],
                  "excel",
                  `AqarExit_Unit_${uCode}`,
                  `${expL.singlePropertyReportTitle} (${uCode} — ${property.project_name || property.name})`
                )
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-xs font-bold text-emerald-800 transition hover:bg-emerald-50"
            >
              <Download className="size-3.5 text-[#105C50]" />
              <span>{expL.exportRowBtn}</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setOpenMenuId(null)
                exportUnitsReport(
                  [property],
                  "pdf",
                  `AqarExit_Unit_${uCode}`,
                  `${expL.singlePropertyReportTitle} (${uCode} — ${property.project_name || property.name})`
                )
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-xs font-bold text-blue-700 transition hover:bg-blue-50"
            >
              <FileText className="size-3.5 text-blue-600" />
              <span>{expL.exportRowPdfBtn}</span>
            </button>

            <div className="my-1 border-t border-gray-100" />

            <button
              type="button"
              disabled={pending}
              onClick={(e) => {
                e.stopPropagation()
                setOpenMenuId(null)
                setConfirmAction({
                  type: "delete",
                  property,
                })
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-xs font-bold text-red-600 transition hover:bg-red-50"
            >
              <Trash2 className="size-3.5 text-red-600" />
              <span>{t.modals.deleteTitle}</span>
            </button>
          </div>
        )}
      </div>
    )
  }

  function renderSellerActivityBadges(property: SellRequest) {
    const currentSt = normalizeRowStatus(property.status)
    const docs = getUploadedDocsList(
      property.documents,
      docLabels,
      t.docs.fallbackName
    )
    const isFeaturedActive =
      Boolean(property.is_featured) &&
      (!property.featured_until ||
        new Date(property.featured_until) > new Date())
    const matchedBuyers = getMatchedBuyersForUnit(property)
    const viewsCount = Math.max(1, Number(property.views_count) || 1)

    const normalizedUnitOffers = offers
      .filter(
        (o) =>
          String(o.property_id) === String(property.id) &&
          !isSelfOfferOnProperty(o, property)
      )
      .map((o) => ({ ...o, status: normalizeOfferStatus(o) }))
      .filter((o) => o.status !== "recommended")

    const acceptedOffer = normalizedUnitOffers.find(
      (o) => o.status === "accepted"
    )
    const pendingAdminOffer = normalizedUnitOffers.find(
      (o) => o.status === "pending_admin"
    )
    const pendingSellerOffer = normalizedUnitOffers.find(
      (o) => o.status === "pending_seller" || o.status === "counter_offered"
    )

    const isVipPlus = property.boost_tier === "vip_plus"

    return (
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {/* شارة عدد المشاهدات الحقيقية للوحدة */}
        <span
          className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50/80 px-2 py-0.5 text-[10.5px] font-extrabold text-[#2563eb]"
          title={aL.viewsColumnHeader}
        >
          <Eye className="size-3" />
          <span className="tabular-nums">
            {viewsCount.toLocaleString("en-US")} {aL.viewsWord}
          </span>
        </span>

        {acceptedOffer ? (
          <Link
            href={`/admin/deals?offerId=${acceptedOffer.id}`}
            className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-extrabold text-white shadow-2xs hover:bg-emerald-700"
          >
            <Handshake className="size-2.5" />
            <span>
              {sm.offerAcceptedTag} ({acceptedOffer.buyer_name || ""})
            </span>
          </Link>
        ) : pendingAdminOffer ? (
          <Link
            href={`/admin/deals?offerId=${pendingAdminOffer.id}`}
            className="inline-flex items-center gap-1 rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-extrabold text-white shadow-2xs hover:bg-amber-600"
          >
            <Clock className="size-2.5" />
            <span>
              {sm.offerPendingAdminTag} ({pendingAdminOffer.buyer_name || ""})
            </span>
          </Link>
        ) : pendingSellerOffer ? (
          <Link
            href={`/admin/deals?offerId=${pendingSellerOffer.id}`}
            className="inline-flex items-center gap-1 rounded-md border border-purple-300 bg-purple-50 px-2 py-0.5 text-[10px] font-extrabold text-purple-900 hover:bg-purple-100"
          >
            <span>
              💰 {sm.offerPendingTag} ({pendingSellerOffer.buyer_name || ""})
            </span>
          </Link>
        ) : null}

        {matchedBuyers.length > 0 &&
          currentSt !== "deleted_by_seller" &&
          currentSt !== "sold" && (
            <button
              type="button"
              onClick={() => setSmartMatchProperty(property)}
              className="inline-flex items-center gap-1 rounded-md border border-teal-300 bg-teal-50/80 px-2.5 py-0.5 text-[10.5px] font-extrabold text-[#105C50] transition hover:bg-[#105C50] hover:text-white"
            >
              <span>🎯</span>
              <span>
                {matchedBuyers.length} {sm.matchedBuyersShort}
              </span>
            </button>
          )}

        {docs.length > 0 && (
          <button
            type="button"
            onClick={() => setDetailsProperty(property)}
            className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10.5px] font-bold text-gray-700 hover:bg-gray-100"
          >
            <FileCheck2 className="size-3 text-[#105C50]" />
            <span>
              {docs.length}/4 {propBadges.docWord}
            </span>
          </button>
        )}

        {isFeaturedActive && (
          <button
            type="button"
            onClick={() =>
              setConfirmAction({
                type: "promote",
                property,
                promoAction: "cancel",
                days: property.featured_days || 14,
                tier: isVipPlus ? "vip_plus" : "super_vip",
              })
            }
            title={t.actions.cancelPromoBtn}
            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-[10.5px] font-extrabold transition hover:opacity-85 ${
              isVipPlus
                ? "bg-indigo-100 text-indigo-900"
                : "bg-orange-100 text-orange-900"
            }`}
          >
            {isVipPlus ? (
              <Flame className="size-3 text-indigo-600" />
            ) : (
              <Crown className="size-3 text-orange-600" />
            )}
            <span>
              {isVipPlus ? "+VIP" : "SUPER VIP"} ({property.featured_days || 14}{" "}
              {propBadges.dayWord})
            </span>
          </button>
        )}

        {!isFeaturedActive &&
          property.featured_status === "pending_payment" && (
            <button
              type="button"
              onClick={() =>
                setConfirmAction({
                  type: "promote",
                  property,
                  promoAction: "activate",
                  days: property.featured_days || 14,
                  tier: isVipPlus ? "vip_plus" : "super_vip",
                })
              }
              className="inline-flex items-center gap-1 rounded-md border border-amber-400 bg-amber-100 px-2.5 py-0.5 text-[10.5px] font-bold text-amber-950 hover:bg-amber-200"
            >
              <Sparkles className="size-3 text-amber-700" />
              <span>
                {propBadges.promoReqPrefix} (
                {isVipPlus ? "+VIP" : "SUPER VIP"} ·{" "}
                {property.featured_days || 1}d
                {property.featured_price ? ` · ${property.featured_price} ₾` : ""}
                ) · {property.featured_fawry_code || "AD"}
              </span>
            </button>
          )}

        {property.submission_type === "edited_by_seller" &&
          currentSt === "pending" && (
            <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-800">
              <RefreshCw className="size-2.5" />
              <span>{propBadges.editedBySeller}</span>
            </span>
          )}

        {currentSt === "paused_by_seller" && (
          <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-800">
            <PauseCircle className="size-2.5" />
            <span>{propBadges.pausedBySeller}</span>
          </span>
        )}

        {currentSt === "deleted_by_seller" && (
          <span className="inline-flex items-center gap-1 rounded-md bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">
            <Trash2 className="size-2.5" />
            <span>
              {propBadges.deletedBySellerPrefix} (
              {getRemainingDaysBeforePurge(property.last_seller_edit_at)}{" "}
              {propBadges.daysWord})
            </span>
          </span>
        )}
      </div>
    )
  }

  const activeCount = properties.length - deletedBySellerList.length
  const georgiaLabel = t.countries?.GE || "Georgia"

  return (
    <div dir={dir} className="text-start">
      {notice && (
        <div
          role="status"
          className={`mb-4 flex items-center justify-between gap-3 rounded-xl border p-3.5 text-xs font-bold shadow-xs sm:text-sm ${
            notice.isError
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.isError ? (
              <AlertTriangle className="size-4 shrink-0 text-red-600" />
            ) : (
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
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

      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-gray-200/80 bg-white p-3.5 shadow-2xs sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex w-full flex-wrap items-center gap-2 sm:max-w-xl sm:flex-1">
          <div className="relative min-w-[180px] flex-1">
            <Search className="pointer-events-none absolute top-1/2 end-3 size-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                isPromotionsPage
                  ? t.filters.promoSearchPlaceholder
                  : t.filters.sellSearchPlaceholder
              }
              className="h-9 w-full rounded-lg border border-gray-200 ps-3 pe-9 text-xs font-semibold focus:border-[#105C50] focus:outline-none"
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
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-extrabold text-[#105C50] transition hover:bg-[#105C50] hover:text-white disabled:opacity-40"
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
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-[#0a1122] px-3 text-xs font-extrabold text-white transition hover:bg-[#16223f] disabled:opacity-40"
          >
            <FileText className="size-3.5 text-emerald-400" />
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
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    promoTab === tab.id
                      ? "bg-[#105C50] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    statusFilter === tab.id
                      ? tab.id === "deleted"
                        ? "bg-red-600 text-white"
                        : "bg-[#105C50] text-white"
                      : tab.id === "deleted" && deletedBySellerList.length > 0
                        ? "bg-red-50 text-red-700 hover:bg-red-100"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-xs text-gray-500">
            {t.table.emptyText}
          </div>
        ) : (
          filtered.map((property) => {
            const currentSt = normalizeRowStatus(property.status)
            const stObj =
              sellerStatusOptions.find((s) => s.value === currentSt) ||
              sellerStatusOptions[0]
            const isCardLoading = pending && activePropertyId === property.id
            const isFeaturedActive =
              Boolean(property.is_featured) &&
              (!property.featured_until ||
                new Date(property.featured_until) > new Date())
            const isHighlighted = highlightedUnitId === property.id
            const waText = buildSellerWhatsAppMessage({
              property,
              unitCur,
              locale,
              t,
              leadsPrompts,
            })
            const localizedArea = cleanPropertyAreaDisplay(
              property.area,
              locale
            )
            const phoneOk = isSellerPhoneVerified(property, verificationMap)

            return (
              <div
                id={`prop-row-${property.id}`}
                key={property.id}
                className={`relative rounded-2xl border bg-white p-4 shadow-xs transition ${
                  isCardLoading
                    ? "border-[#105C50] opacity-75"
                    : isHighlighted
                      ? "border-[#105C50] ring-2 ring-[#105C50]/30"
                      : currentSt === "deleted_by_seller"
                        ? "border-red-300 bg-red-50/20"
                        : isFeaturedActive
                          ? "border-amber-300"
                          : "border-gray-200/90"
                }`}
              >
                {isCardLoading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/65 backdrop-blur-[1px]">
                    <div className="flex items-center gap-2 rounded-full bg-[#0a1122] px-3.5 py-1.5 text-xs font-bold text-white shadow-md">
                      <Loader2 className="size-3.5 animate-spin text-emerald-400" />
                      <span>{t.table.updatingText}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded bg-[#0a1122] px-2 py-0.5 font-mono text-[10px] font-bold text-white">
                        {deriveShortUnitCode(property.id, property.code)}
                      </span>
                      <h3 className="truncate text-xs font-extrabold text-[#0a1122] sm:text-sm">
                        {property.project_name || t.table.unspecifiedProject}
                      </h3>
                    </div>
                    <p className="mt-0.5 text-[11px] text-gray-500">
                      {localizedArea} ·{" "}
                      {property.unit_type || t.table.defaultUnitType}{" "}
                      {property.size
                        ? `· ${property.size} ${t.table.sqmUnit}`
                        : ""}
                    </p>
                    {renderSellerActivityBadges(property)}
                  </div>

                  {renderThreeDotsMenu(property, currentSt, isFeaturedActive)}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-gray-100 bg-gray-50/80 p-2.5 text-xs">
                  <div>
                    <span className="block text-[10px] text-gray-400">
                      {t.table.colCash}
                    </span>
                    <strong
                      dir="ltr"
                      className="mt-0.5 block text-sm font-black text-[#105C50]"
                    >
                      {property.paid_amount
                        ? `${unitCur}${Number(property.paid_amount).toLocaleString("en-US")}`
                        : "—"}
                    </strong>
                  </div>

                  <div className="border-s border-gray-200/70 ps-2 text-[11px]">
                    <div>
                      <span className="text-gray-400">
                        {t.table.contractShort}{" "}
                      </span>
                      <strong dir="ltr" className="text-[#0a1122]">
                        {property.contract_price
                          ? `${unitCur}${Number(property.contract_price).toLocaleString("en-US")}`
                          : "—"}
                      </strong>
                    </div>
                    <div className="mt-0.5">
                      <span className="text-gray-400">
                        {t.table.marketShort}{" "}
                      </span>
                      <strong dir="ltr" className="text-gray-700">
                        {property.market_price
                          ? `${unitCur}${Number(property.market_price).toLocaleString("en-US")}`
                          : "—"}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-[#0a1122]">
                    <User className="size-3.5 text-gray-400" />
                    <span>{property.name}</span>
                  </div>
                  <div
                    dir="ltr"
                    className="flex items-center gap-1 font-medium text-gray-600"
                  >
                    <Phone className="size-3 text-gray-400" />
                    <span>{property.phone}</span>
                    {phoneOk && (
                      <CheckCircle2 className="size-3.5 text-[#105C50]" />
                    )}
                  </div>
                </div>

                <div className="mt-2.5">
                  <select
                    disabled={pending}
                    value={currentSt}
                    onChange={(e) => {
                      const nextSt = e.target.value
                      if (nextSt !== currentSt) {
                        setConfirmAction({
                          type: "status",
                          property,
                          newStatus: nextSt,
                        })
                      }
                    }}
                    className={`h-9 w-full rounded-xl border px-3 text-xs font-extrabold focus:outline-none ${stObj.badge}`}
                  >
                    {sellerStatusOptions.map((opt) => (
                      <option
                        key={opt.value}
                        value={opt.value}
                        className="bg-white text-[#0a1122]"
                      >
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-2.5 flex items-center gap-2 border-t border-gray-100 pt-2.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8.5 flex-1 rounded-xl text-xs font-bold"
                    onClick={() => setDetailsProperty(property)}
                  >
                    <Eye className="me-1 size-3.5 text-[#105C50]" />
                    {t.actions.detailsBtn}
                  </Button>

                  <a
                    data-admin-client-wa="true"
                    href={`https://wa.me/${String(property.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(waText)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-8.5 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-3 text-xs font-bold text-white transition hover:opacity-90"
                  >
                    <MessageCircle className="size-3.5" />
                    <span>{leadsPrompts.whatsappBtn}</span>
                  </a>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 2. عرض الكمبيوتر الاحترافي */}
      <div className="hidden md:block">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200/85 bg-white px-5 py-3.5 shadow-2xs">
          <h2 className="text-sm font-extrabold text-[#0a1122] sm:text-base">
            {isPromotionsPage
              ? `${t.header.promoCountryTitle} ${georgiaLabel} (${filtered.length})`
              : `${t.header.sellCountryTitle} ${georgiaLabel} (${filtered.length})`}
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-gray-500">
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
              <span className="size-2.5 rounded-full bg-[#105C50]" />
              <span>
                {
                  filtered.filter(
                    (p) => normalizeRowStatus(p.status) === "active"
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
                  filtered.filter(
                    (p) => normalizeRowStatus(p.status) === "pending"
                  ).length
                }{" "}
                {t.filters.pendingReviewTab}
              </span>
            </span>
          </div>
        </div>

        <div className="mb-2.5 grid grid-cols-12 items-center gap-4 rounded-xl border border-slate-200/90 bg-slate-100/90 px-5 py-3 text-[11px] font-extrabold text-slate-600">
          <div className="col-span-4">{t.table.colProject}</div>
          <div className="col-span-2">{t.table.colCash}</div>
          <div className="col-span-2">{t.table.colClient}</div>
          <div className="col-span-2">{t.table.colStage}</div>
          <div className="col-span-2 text-end">{t.table.colActions}</div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-xs font-bold text-gray-400">
            {t.table.emptyText}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((property, index) => {
              const currentSt = normalizeRowStatus(property.status)
              const stObj =
                sellerStatusOptions.find((s) => s.value === currentSt) ||
                sellerStatusOptions[0]
              const isRowLoading = pending && activePropertyId === property.id
              const isFeaturedActive =
                Boolean(property.is_featured) &&
                (!property.featured_until ||
                  new Date(property.featured_until) > new Date())
              const isHighlighted = highlightedUnitId === property.id
              const waText = buildSellerWhatsAppMessage({
                property,
                unitCur,
                locale,
                t,
                leadsPrompts,
              })
              const localizedArea = cleanPropertyAreaDisplay(
                property.area,
                locale
              )
              const phoneOk = isSellerPhoneVerified(property, verificationMap)
              const emailOk = isSellerEmailVerified(property, verificationMap)

              return (
                <div
                  id={`prop-row-${property.id}`}
                  key={property.id}
                  className={`grid grid-cols-12 items-center gap-4 rounded-2xl border-2 bg-white px-5 py-4 shadow-2xs transition-all hover:shadow-md ${
                    isRowLoading
                      ? "border-[#105C50] bg-emerald-50/30 opacity-60"
                      : isHighlighted
                        ? "border-[#105C50] bg-emerald-50/40 ring-2 ring-[#105C50]/20"
                        : currentSt === "active"
                          ? "border-emerald-200/90 border-s-4 border-s-[#105C50]"
                          : currentSt === "pending"
                            ? "border-amber-200/90 border-s-4 border-s-amber-500"
                            : currentSt === "deleted_by_seller"
                              ? "border-red-200 bg-red-50/20"
                              : "border-slate-200/90"
                  }`}
                >
                  <div className="col-span-4 min-w-0 pe-2">
                    <div className="flex items-center gap-2">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-black text-slate-600">
                        {index + 1}
                      </span>
                      <span className="shrink-0 rounded-md bg-[#0a1122] px-2 py-0.5 font-mono text-[10.5px] font-extrabold text-white">
                        {deriveShortUnitCode(property.id, property.code)}
                      </span>
                      <Link
                        href={`/opportunities/${property.id}`}
                        target="_blank"
                        className="truncate text-sm font-black text-[#0a1122] hover:text-[#105C50] hover:underline"
                      >
                        {property.project_name || t.table.unspecifiedProject}
                      </Link>
                      {isRowLoading && (
                        <Loader2 className="size-4 shrink-0 animate-spin text-[#105C50]" />
                      )}
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 ps-8 text-xs font-semibold text-slate-500">
                      <span className="text-[#0a1122]">{localizedArea}</span>
                      <span>·</span>
                      <span>
                        {property.unit_type || t.table.defaultUnitType}
                      </span>
                      {property.size ? (
                        <>
                          <span>·</span>
                          <span>
                            {property.size} {t.table.sqmUnit}
                          </span>
                        </>
                      ) : null}
                    </div>

                    <div className="ps-8">
                      {renderSellerActivityBadges(property)}
                    </div>
                  </div>

                  <div className="col-span-2 border-s border-slate-100 ps-4">
                    <span className="block text-[10px] font-bold text-slate-400">
                      {t.table.colCash}
                    </span>
                    <div
                      dir="ltr"
                      className="mt-0.5 text-base font-black text-[#105C50] tabular-nums"
                    >
                      {property.paid_amount
                        ? `${unitCur}${Number(property.paid_amount).toLocaleString("en-US")}`
                        : "—"}
                    </div>

                    <div className="mt-1.5 space-y-0.5 border-t border-slate-100 pt-1.5 text-[11px]">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-slate-400">
                          {t.table.contractShort}
                        </span>
                        <strong
                          dir="ltr"
                          className="font-extrabold text-[#0a1122] tabular-nums"
                        >
                          {property.contract_price
                            ? `${unitCur}${Number(property.contract_price).toLocaleString("en-US")}`
                            : "—"}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-slate-400">
                          {t.table.marketShort}
                        </span>
                        <span
                          dir="ltr"
                          className="font-bold text-slate-600 tabular-nums"
                        >
                          {property.market_price
                            ? `${unitCur}${Number(property.market_price).toLocaleString("en-US")}`
                            : "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2 min-w-0 border-s border-slate-100 ps-4">
                    <div className="flex items-center gap-1.5 truncate text-xs font-extrabold text-[#0a1122]">
                      <User className="size-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">{property.name}</span>
                    </div>
                    <div
                      dir="ltr"
                      className="mt-1 flex items-center justify-start gap-1 font-mono text-[11.5px] font-bold text-slate-700"
                    >
                      <span>{property.phone}</span>
                      {phoneOk && (
                        <span
                          title={propBadges.phoneVerifiedBadge}
                          className="inline-flex text-[#105C50]"
                        >
                          <CheckCircle2 className="size-3.5" />
                        </span>
                      )}
                    </div>
                    {property.email && (
                      <div className="mt-0.5 flex items-center gap-1 truncate text-[10.5px] text-slate-400">
                        <span className="truncate">{property.email}</span>
                        {emailOk && (
                          <span
                            title={propBadges.emailVerifiedBadge}
                            className="inline-flex shrink-0 text-[#105C50]"
                          >
                            <CheckCircle2 className="size-3.5" />
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="col-span-2 border-s border-slate-100 ps-4">
                    <select
                      disabled={pending}
                      value={currentSt}
                      onChange={(e) => {
                        const nextSt = e.target.value
                        if (nextSt !== currentSt) {
                          setConfirmAction({
                            type: "status",
                            property,
                            newStatus: nextSt,
                          })
                        }
                      }}
                      className={`h-9 w-full cursor-pointer rounded-xl border px-3 text-xs font-extrabold transition focus:outline-none ${stObj.badge}`}
                    >
                      {sellerStatusOptions.map((opt) => (
                        <option
                          key={opt.value}
                          value={opt.value}
                          className="bg-white text-[#0a1122]"
                        >
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-1.5 border-s border-slate-100 ps-3">
                    {currentSt === "deleted_by_seller" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() =>
                          setConfirmAction({
                            type: "status",
                            property,
                            newStatus: "pending",
                          })
                        }
                        className="h-8 rounded-lg border-emerald-200 bg-emerald-50 px-2.5 text-[11px] font-bold text-[#105C50]"
                      >
                        <RotateCcw className="me-1 size-3" />
                        {t.actions.restoreBtn}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-lg px-3 text-[11px] font-bold"
                        onClick={() => setDetailsProperty(property)}
                      >
                        <Eye className="me-1 size-3 text-[#105C50]" />
                        {t.actions.detailsBtn}
                      </Button>
                    )}

                    <a
                      data-admin-client-wa="true"
                      href={`https://wa.me/${String(property.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(waText)}`}
                      target="_blank"
                      rel="noreferrer"
                      title={leadsPrompts.whatsappBtn}
                      className="inline-flex size-8 items-center justify-center rounded-lg bg-[#25D366] text-white hover:opacity-90"
                    >
                      <MessageCircle className="size-3.5" />
                    </a>

                    {renderThreeDotsMenu(
                      property,
                      currentSt,
                      isFeaturedActive
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

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
        publicSiteLabel={dict.admin?.shell?.publicSite || ""}
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
                offersCount: getOffersCountForUnit(detailsProperty),
                matchedBuyersCount:
                  getMatchedBuyersForUnit(detailsProperty).length,
                locale,
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
        renderBadges={renderSellerActivityBadges}
      />
    </div>
  )
}