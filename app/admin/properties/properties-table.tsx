"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  FileCheck2,
  Handshake,
  Loader2,
  MessageCircle,
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getCurrencySymbol, useTranslation } from "@/lib/i18n"
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
  ACTIVE_ADMIN_COUNTRY,
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
  const buyerDict =
    (dict?.accountComponents as Record<string, any>)?.buyer || {}
  const matchPrefix = sm.matchScorePrefix || buyerDict.matchScorePrefix || ""

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

  const sellerStatusOptions = [
    {
      value: "pending",
      label: t.statuses.pending,
      badge: "bg-amber-100 text-amber-800",
    },
    {
      value: "under_review",
      label: t.statuses.under_review,
      badge: "bg-blue-100 text-blue-800",
    },
    {
      value: "active",
      label: t.statuses.active,
      badge: "bg-emerald-100 text-emerald-800",
    },
    {
      value: "offer_received",
      label: t.statuses.offer_received,
      badge: "bg-purple-100 text-purple-800",
    },
    {
      value: "transferring",
      label: t.statuses.transferring,
      badge: "bg-indigo-100 text-indigo-800",
    },
    {
      value: "sold",
      label: t.statuses.sold,
      badge: "bg-teal-700 text-white",
    },
    {
      value: "paused_by_seller",
      label: t.statuses.paused_by_seller,
      badge: "bg-orange-100 text-orange-800",
    },
    {
      value: "deleted_by_seller",
      label: t.statuses.deleted_by_seller,
      badge: "bg-red-100 text-red-800 border border-red-300",
    },
    {
      value: "rejected",
      label: t.statuses.rejected,
      badge: "bg-red-100 text-red-800",
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
    const st = status || "pending"
    return sellerStatusOptions.find((s) => s.value === st)?.label || st
  }

  function getUnitCurrency() {
    return getCurrencySymbol(ACTIVE_ADMIN_COUNTRY, locale)
  }

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [promoTab, setPromoTab] = useState<
    "all_promo" | "pending_payment" | "active_featured" | "all_units"
  >("all_promo")

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
    const tabParam = searchParams.get("tab")
    const unitIdParam = searchParams.get("unitId")
    const actionParam = searchParams.get("action")
    const qParam = searchParams.get("q")

    if (qParam) setSearch(qParam)
    if (!isPromotionsPage && tabParam && tabParam !== "featured") {
      setStatusFilter(tabParam)
    }

    if (unitIdParam) {
      setHighlightedUnitId(unitIdParam)
      const targetProp = properties.find((p) => p.id === unitIdParam)

      if (targetProp) {
        if (!isPromotionsPage && targetProp.status === "deleted_by_seller") {
          setStatusFilter("deleted")
        }
        if (actionParam === "promote") {
          setConfirmAction({
            type: "promote",
            property: targetProp,
            promoAction: "activate",
            days: targetProp.featured_days || 14,
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
            confirmAction.newStatus === "rejected" ? reason : undefined
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
          const res = await managePropertyPromotionAction(
            target.id,
            confirmAction.promoAction,
            confirmAction.days
          )
          if (res.success) {
            setNotice({
              text:
                confirmAction.promoAction === "activate"
                  ? `${propNotices.promoActivated} ("${target.project_name || target.name}" - ${confirmAction.days} ${propBadges.dayWord})`
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
    (p) => p.status === "deleted_by_seller"
  )
  const pendingPromoList = properties.filter(
    (p) =>
      p.status !== "deleted_by_seller" &&
      !p.is_featured &&
      p.featured_status === "pending_payment"
  )
  const activePromoList = properties.filter(
    (p) => p.status !== "deleted_by_seller" && Boolean(p.is_featured)
  )
  const promoRequestsList = properties.filter(
    (p) =>
      p.status !== "deleted_by_seller" &&
      (p.featured_status === "pending_payment" || p.is_featured)
  )
  const sellerActionsList = properties.filter(
    (p) =>
      p.status === "paused_by_seller" ||
      (p.status === "pending" &&
        (p.submission_type === "edited_by_seller" ||
          p.submission_type === "resumed_by_seller"))
  )

  const filtered = properties.filter((p) => {
    const currentStatus = p.status || "pending"
    const unitShortCode = p.id.slice(0, 8).toUpperCase()
    const uPublicCode = deriveShortUnitCode(p.id)
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

  function renderSellerActivityBadges(property: SellRequest) {
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
    const topScore = matchedBuyers[0]?.match.score || 0

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
    const rejectedCount = normalizedUnitOffers.filter(
      (o) => o.status === "rejected"
    ).length

    return (
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        {matchedBuyers.length > 0 &&
          property.status !== "deleted_by_seller" && (
            <button
              type="button"
              onClick={() => setSmartMatchProperty(property)}
              className="inline-flex items-center gap-1 rounded-md border border-teal-400 bg-teal-50 px-2 py-0.5 text-[10px] font-extrabold text-[#105C50] transition hover:bg-[#105C50] hover:text-white"
            >
              <span>🎯</span>
              <span>
                {matchedBuyers.length} {sm.matchedBuyersShort} · {matchPrefix}{" "}
                {topScore}%
              </span>
            </button>
          )}

        {acceptedOffer && (
          <Link
            href={`/admin/deals?offerId=${acceptedOffer.id}`}
            className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-extrabold text-white shadow-2xs hover:bg-emerald-700"
          >
            <Handshake className="size-2.5" />
            <span>
              {sm.offerAcceptedTag}: {acceptedOffer.buyer_name || ""}
            </span>
          </Link>
        )}

        {!acceptedOffer && pendingAdminOffer && (
          <Link
            href={`/admin/deals?offerId=${pendingAdminOffer.id}`}
            className="inline-flex items-center gap-1 rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-extrabold text-white shadow-2xs hover:bg-amber-600"
          >
            <Clock className="size-2.5" />
            <span>
              {sm.offerPendingAdminTag} ({pendingAdminOffer.buyer_name || ""})
            </span>
          </Link>
        )}

        {!acceptedOffer && !pendingAdminOffer && pendingSellerOffer && (
          <Link
            href={`/admin/deals?offerId=${pendingSellerOffer.id}`}
            className="inline-flex items-center gap-1 rounded-md border border-purple-300 bg-purple-50 px-2 py-0.5 text-[10px] font-extrabold text-purple-900 hover:bg-purple-100"
          >
            <span>
              💰 {sm.offerPendingTag} ({pendingSellerOffer.buyer_name || ""})
            </span>
          </Link>
        )}

        {!acceptedOffer &&
          !pendingAdminOffer &&
          !pendingSellerOffer &&
          rejectedCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
              ✕ {rejectedCount} {sm.offerRejectedTag}
            </span>
          )}

        {property.submission_type === "edited_by_seller" &&
          property.status === "pending" && (
            <button
              type="button"
              onClick={() => setDetailsProperty(property)}
              className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-800 hover:bg-blue-100"
            >
              <RefreshCw className="size-2.5" />
              <span>{propBadges.editedBySeller}</span>
            </button>
          )}

        {property.submission_type === "resumed_by_seller" &&
          property.status === "pending" && (
            <button
              type="button"
              onClick={() => setDetailsProperty(property)}
              className="inline-flex items-center gap-1 rounded-md border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-800 hover:bg-purple-100"
            >
              <RefreshCw className="size-2.5" />
              <span>{propBadges.resumedBySeller}</span>
            </button>
          )}

        {property.status === "paused_by_seller" && (
          <span className="inline-flex items-center gap-1 rounded-md border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-800">
            <PauseCircle className="size-2.5" />
            <span>{propBadges.pausedBySeller}</span>
          </span>
        )}

        {property.status === "deleted_by_seller" && (
          <span className="inline-flex items-center gap-1 rounded-md border border-red-300 bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">
            <Trash2 className="size-2.5" />
            <span>
              {propBadges.deletedBySellerPrefix} (
              {getRemainingDaysBeforePurge(property.last_seller_edit_at)}{" "}
              {propBadges.daysWord})
            </span>
          </span>
        )}

        {docs.length > 0 && (
          <button
            type="button"
            onClick={() => setDetailsProperty(property)}
            className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-[#105C50] hover:bg-emerald-100"
          >
            <FileCheck2 className="size-2.5" />
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
              })
            }
            className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900 hover:bg-amber-200"
          >
            <Star className="size-2.5 fill-amber-500 text-amber-600" />
            <span>
              {propBadges.featuredPrefix} ({property.featured_days || 14}{" "}
              {propBadges.dayWord})
              {property.featured_fawry_code
                ? ` · ${property.featured_fawry_code}`
                : ""}
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
                })
              }
              className="inline-flex items-center gap-1 rounded-md border border-amber-400 bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-950 hover:bg-amber-200"
            >
              <Sparkles className="size-2.5 text-amber-700" />
              <span>
                {propBadges.promoReqPrefix} ({property.featured_days || 14}{" "}
                {propBadges.dayWord}) · {property.featured_fawry_code || "AD"}
              </span>
            </button>
          )}
      </div>
    )
  }

  const activeCount = properties.length - deletedBySellerList.length
  const georgiaLabel = t.countries?.GE || "Georgia"
  const unitCur = getUnitCurrency()

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

      <div className="mb-4 rounded-xl border border-gray-200/85 bg-white p-4 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-extrabold text-[#0a1122] sm:text-base">
              {isPromotionsPage
                ? `${t.header.promoCountryTitle} ${georgiaLabel} 🇬🇪 (${promoRequestsList.length})`
                : `${t.header.sellCountryTitle} ${georgiaLabel} 🇬🇪 (${activeCount})`}
            </h2>
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-gray-200/80 bg-white p-3 shadow-2xs sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs sm:flex-1">
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
                  label: t.filters.manualPromoteTab,
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
                { id: "all", label: t.filters.allTab },
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
      <div className="space-y-3 md:hidden">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-xs text-gray-500">
            {t.table.emptyText}
          </div>
        ) : (
          filtered.map((property) => {
            const currentSt = property.status || "pending"
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
                className={`relative overflow-hidden rounded-xl border bg-white p-3.5 shadow-2xs transition ${
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
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/65 backdrop-blur-[1px]">
                    <div className="flex items-center gap-2 rounded-full bg-[#0a1122] px-3.5 py-1.5 text-xs font-bold text-white shadow-md">
                      <Loader2 className="size-3.5 animate-spin text-emerald-400" />
                      <span>{t.table.updatingText}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-extrabold text-[#0a1122] sm:text-sm">
                      {property.project_name || t.table.unspecifiedProject}
                    </h3>
                    <p className="mt-0.5 text-[11px] text-gray-500">
                      {localizedArea} ·{" "}
                      {property.unit_type || t.table.defaultUnitType}{" "}
                      {property.size
                        ? `· ${property.size} ${t.table.sqmUnit}`
                        : ""}
                    </p>
                    <span className="mt-0.5 inline-block font-mono text-[10px] text-gray-400">
                      {deriveShortUnitCode(property.id)} · #
                      {property.id.slice(0, 8).toUpperCase()}
                    </span>
                    {renderSellerActivityBadges(property)}
                  </div>

                  <Badge className={`shrink-0 text-[10px] ${stObj.badge}`}>
                    {stObj.label}
                  </Badge>
                </div>

                <div className="mt-2.5 grid grid-cols-2 gap-2 rounded-lg border border-gray-100 bg-gray-50/80 p-2.5 text-xs">
                  <div>
                    <span className="block text-[10px] text-gray-400">
                      {t.table.colCash}
                    </span>
                    <strong className="mt-0.5 block text-xs font-extrabold text-[#105C50]">
                      {property.paid_amount ? (
                        <>
                          <span dir="ltr">
                            {Number(property.paid_amount).toLocaleString(
                              "en-US"
                            )}
                          </span>{" "}
                          {unitCur}
                        </>
                      ) : (
                        "—"
                      )}
                    </strong>
                  </div>

                  <div className="border-s border-gray-200/70 ps-2 text-[11px]">
                    <div>
                      <span className="text-gray-400">
                        {t.table.contractShort}{" "}
                      </span>
                      <strong className="text-[#0a1122]">
                        {property.contract_price ? (
                          <>
                            <span dir="ltr">
                              {Number(property.contract_price).toLocaleString(
                                "en-US"
                              )}
                            </span>{" "}
                            {unitCur}
                          </>
                        ) : (
                          "—"
                        )}
                      </strong>
                    </div>
                    <div className="mt-0.5">
                      <span className="text-gray-400">
                        {t.table.marketShort}{" "}
                      </span>
                      <strong className="text-gray-700">
                        {property.market_price ? (
                          <>
                            <span dir="ltr">
                              {Number(property.market_price).toLocaleString(
                                "en-US"
                              )}
                            </span>{" "}
                            {unitCur}
                          </>
                        ) : (
                          "—"
                        )}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs">
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

                <div className="mt-2">
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
                    className="h-8 w-full rounded-lg border border-gray-200 bg-gray-50/70 px-2 text-xs font-bold text-[#0a1122] focus:border-[#105C50] focus:outline-none"
                  >
                    {sellerStatusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-gray-100 pt-2.5">
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
                      className="h-8 flex-1 rounded-lg border-emerald-200 bg-emerald-50 text-xs font-bold text-[#105C50]"
                    >
                      <RotateCcw className="me-1 size-3" />
                      {t.actions.restoreBtn}
                    </Button>
                  ) : currentSt !== "active" ? (
                    <Button
                      size="sm"
                      disabled={pending}
                      onClick={() =>
                        setConfirmAction({
                          type: "status",
                          property,
                          newStatus: "active",
                        })
                      }
                      className="h-8 flex-1 rounded-lg bg-[#105C50] text-xs font-bold text-white hover:bg-[#0c483f]"
                    >
                      <Check className="me-1 size-3" />
                      {t.actions.publishMarketBtn}
                    </Button>
                  ) : (
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
                      className="h-8 flex-1 rounded-lg border-orange-300 bg-orange-50 text-xs font-bold text-orange-800 hover:bg-orange-100"
                    >
                      <EyeOff className="me-1 size-3" />
                      {t.actions.unpublishBtn}
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 flex-1 rounded-lg text-xs font-bold"
                    onClick={() => setDetailsProperty(property)}
                  >
                    <Eye className="me-1 size-3" />
                    {t.actions.detailsBtn}
                  </Button>

                  <Link
                    href={`/opportunities/${property.id}`}
                    target="_blank"
                    title={dict.admin?.shell?.publicSite}
                    className="inline-flex h-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-bold text-[#105C50]"
                  >
                    <ExternalLink className="size-3.5" />
                  </Link>
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {currentSt !== "deleted_by_seller" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() =>
                        setConfirmAction({
                          type: "promote",
                          property,
                          promoAction: isFeaturedActive ? "cancel" : "activate",
                          days: property.featured_days || 14,
                        })
                      }
                      className={`h-8 flex-1 rounded-lg px-2.5 text-xs font-bold ${
                        isFeaturedActive
                          ? "border-amber-300 bg-amber-100 text-amber-900"
                          : "border-amber-300 bg-amber-500 text-white hover:bg-amber-600"
                      }`}
                    >
                      <Star className="me-1 size-3 fill-current" />
                      {isFeaturedActive
                        ? t.actions.cancelPromoBtn
                        : t.actions.promoteStarBtn}
                    </Button>
                  )}

                  <a
                    data-admin-client-wa="true"
                    href={`https://wa.me/${String(property.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(waText)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-8 items-center justify-center rounded-lg bg-[#25D366] px-2.5 text-xs font-bold text-white"
                  >
                    <MessageCircle className="size-3.5" />
                  </a>

                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      setConfirmAction({
                        type: "delete",
                        property,
                      })
                    }
                    className="inline-flex h-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 px-2.5 text-xs font-bold text-red-600"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 2. عرض الكمبيوتر */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-separate border-spacing-y-2.5 text-start text-xs">
          <thead>
            <tr className="text-[11px] font-extrabold text-gray-500">
              <th className="px-4 py-2">{t.table.colProject}</th>
              <th className="px-4 py-2">{t.table.colCash}</th>
              <th className="px-4 py-2">{t.table.colContractMarket}</th>
              <th className="px-4 py-2">{t.table.colClient}</th>
              <th className="px-4 py-2">{t.table.colStage}</th>
              <th className="px-4 py-2">{t.table.colActions}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="rounded-xl border border-gray-200 bg-white px-5 py-8 text-center text-xs text-gray-500"
                >
                  {t.table.emptyText}
                </td>
              </tr>
            ) : (
              filtered.map((property) => {
                const currentSt = property.status || "pending"
                const stObj =
                  sellerStatusOptions.find((s) => s.value === currentSt) ||
                  sellerStatusOptions[0]
                const isRowLoading =
                  pending && activePropertyId === property.id
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

                const cellBorderCls = isHighlighted
                  ? "border-y-2 border-[#105C50] first:border-s-2 last:border-e-2 bg-emerald-50/40"
                  : isFeaturedActive
                    ? "border-y border-amber-300 first:border-s last:border-e bg-amber-50/15"
                    : "border-y border-gray-200/90 first:border-s last:border-e bg-white hover:bg-gray-50/60"

                return (
                  <tr
                    id={`prop-row-${property.id}`}
                    key={property.id}
                    className={`shadow-2xs transition-all ${
                      isRowLoading ? "opacity-60" : ""
                    }`}
                  >
                    <td
                      className={`rounded-s-xl px-4 py-3.5 align-middle ${cellBorderCls}`}
                    >
                      <div className="flex items-center gap-2 font-extrabold text-[#0a1122]">
                        <span className="text-[13px]">
                          {property.project_name || t.table.unspecifiedProject}
                        </span>
                        {isRowLoading && (
                          <Loader2 className="size-3.5 animate-spin text-[#105C50]" />
                        )}
                      </div>
                      <div className="mt-0.5 text-[11px] text-gray-500">
                        {localizedArea} ·{" "}
                        {property.unit_type || t.table.defaultUnitType}{" "}
                        {property.size
                          ? `· ${property.size}${t.table.sqmUnit}`
                          : ""}
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] text-gray-400">
                        {deriveShortUnitCode(property.id)} · #
                        {property.id.slice(0, 8).toUpperCase()}
                        {property.featured_fawry_code
                          ? ` · ${propBadges.adCodeLabel} ${property.featured_fawry_code}`
                          : ""}
                      </div>
                      {renderSellerActivityBadges(property)}
                    </td>

                    <td
                      className={`border-s border-s-gray-100 px-4 py-3.5 align-middle ${cellBorderCls}`}
                    >
                      <div className="text-[13px] font-extrabold text-[#105C50] tabular-nums">
                        {property.paid_amount ? (
                          <>
                            <span dir="ltr">
                              {Number(property.paid_amount).toLocaleString(
                                "en-US"
                              )}
                            </span>{" "}
                            {unitCur}
                          </>
                        ) : (
                          "—"
                        )}
                      </div>
                      {property.willing_to_discount && (
                        <span className="mt-1 inline-block rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                          {propBadges.negotiable}
                        </span>
                      )}
                    </td>

                    <td
                      className={`border-s border-s-gray-100 px-4 py-3.5 align-middle text-[11.5px] ${cellBorderCls}`}
                    >
                      <div>
                        <span className="text-gray-400">
                          {t.table.contractShort}{" "}
                        </span>
                        <strong className="text-[#0a1122] tabular-nums">
                          {property.contract_price ? (
                            <>
                              <span dir="ltr">
                                {Number(
                                  property.contract_price
                                ).toLocaleString("en-US")}
                              </span>{" "}
                              {unitCur}
                            </>
                          ) : (
                            "—"
                          )}
                        </strong>
                      </div>
                      <div className="mt-1 text-gray-500">
                        <span className="text-gray-400">
                          {t.table.marketShort}{" "}
                        </span>
                        <span className="tabular-nums">
                          {property.market_price ? (
                            <>
                              <span dir="ltr">
                                {Number(property.market_price).toLocaleString(
                                  "en-US"
                                )}
                              </span>{" "}
                              {unitCur}
                            </>
                          ) : (
                            "—"
                          )}
                        </span>
                      </div>
                    </td>

                    <td
                      className={`border-s border-s-gray-100 px-4 py-3.5 align-middle ${cellBorderCls}`}
                    >
                      <div className="text-xs font-extrabold text-[#0a1122]">
                        {property.name}
                      </div>
                      <div
                        dir="ltr"
                        className="mt-0.5 flex items-center justify-start gap-1 text-start font-mono text-[11px] font-semibold text-gray-600"
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
                        <div className="flex items-center gap-1 truncate text-[10.5px] text-gray-400">
                          <span className="truncate">{property.email}</span>
                          {emailOk && (
                            <span
                              title={propBadges.emailVerifiedBadge}
                              className="inline-flex shrink-0 text-[#105C50]"
                            >
                              <CheckCircle2 className="size-3" />
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    <td
                      className={`border-s border-s-gray-100 px-4 py-3.5 align-middle ${cellBorderCls}`}
                    >
                      <div className="flex flex-col gap-1.5">
                        <Badge className={`w-fit text-[10px] ${stObj.badge}`}>
                          {stObj.label}
                        </Badge>
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
                          className="h-8 rounded-lg border border-gray-200 bg-gray-50/70 px-2 text-[11px] font-bold text-[#0a1122] focus:border-[#105C50] focus:bg-white focus:outline-none"
                        >
                          {sellerStatusOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>

                    <td
                      className={`rounded-e-xl border-s border-s-gray-100 px-4 py-3.5 align-middle ${cellBorderCls}`}
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
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
                            className="h-8 border-emerald-200 bg-emerald-50 px-2.5 text-[11px] font-bold text-[#105C50]"
                          >
                            <RotateCcw className="me-1 size-3" />
                            {t.actions.restoreBtn}
                          </Button>
                        ) : (
                          <>
                            {currentSt !== "active" ? (
                              <Button
                                size="sm"
                                disabled={pending}
                                className="h-8 bg-[#105C50] px-2.5 text-[11px] font-bold text-white hover:bg-[#0c483f]"
                                onClick={() =>
                                  setConfirmAction({
                                    type: "status",
                                    property,
                                    newStatus: "active",
                                  })
                                }
                              >
                                <Check className="me-1 size-3" />
                                {t.actions.publishShortBtn}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={pending}
                                className="h-8 border-orange-300 bg-orange-50 px-2.5 text-[11px] font-bold text-orange-800 hover:bg-orange-100"
                                onClick={() =>
                                  setConfirmAction({
                                    type: "status",
                                    property,
                                    newStatus: "pending",
                                  })
                                }
                              >
                                <EyeOff className="me-1 size-3" />
                                {t.actions.unpublishBtn}
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              disabled={pending}
                              onClick={() =>
                                setConfirmAction({
                                  type: "promote",
                                  property,
                                  promoAction: isFeaturedActive
                                    ? "cancel"
                                    : "activate",
                                  days: property.featured_days || 14,
                                })
                              }
                              className={`h-8 px-2.5 text-[11px] font-bold ${
                                isFeaturedActive
                                  ? "border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200"
                                  : "border-amber-300 bg-amber-500 text-white hover:bg-amber-600"
                              }`}
                            >
                              <Star className="me-1 size-3 fill-current" />
                              {isFeaturedActive
                                ? t.actions.cancelPromoBtn
                                : t.actions.promoteStarBtn}
                            </Button>
                          </>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2.5 text-[11px] font-bold"
                          onClick={() => setDetailsProperty(property)}
                        >
                          <Eye className="me-1 size-3" />
                          {t.actions.detailsBtn}
                        </Button>

                        <Link
                          href={`/opportunities/${property.id}`}
                          target="_blank"
                          title={dict.admin?.shell?.publicSite}
                          className="inline-flex h-8 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 px-2 text-[#105C50] transition hover:bg-emerald-100"
                        >
                          <ExternalLink className="size-3.5" />
                        </Link>

                        <a
                          data-admin-client-wa="true"
                          href={`https://wa.me/${String(property.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(waText)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-8 items-center justify-center rounded-md bg-[#25D366] px-2 text-white hover:opacity-90"
                        >
                          <MessageCircle className="size-3.5" />
                        </a>

                        <button
                          type="button"
                          disabled={pending}
                          onClick={() =>
                            setConfirmAction({
                              type: "delete",
                              property,
                            })
                          }
                          className="inline-flex h-8 items-center justify-center rounded-md border border-red-200 bg-red-50 px-2 text-red-600 transition hover:bg-red-100"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
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