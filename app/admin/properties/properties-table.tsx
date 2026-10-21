"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  FileCheck2,
  Globe,
  Loader2,
  MessageCircle,
  PauseCircle,
  Phone,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  Sparkles,
  Star,
  Trash2,
  User,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { getCurrencySymbol, useTranslation } from "@/lib/i18n"
import {
  deletePropertyAction,
  managePropertyPromotionAction,
  purgeSellerDeletedPropertiesAction,
  updatePropertyStatusAction,
} from "../actions"

export type SellRequest = {
  id: string
  user_id?: string | null
  project_name: string | null
  developer_name?: string | null
  area: string | null
  unit_type: string | null
  size?: number | null
  rooms?: number | null
  bathrooms?: number | null
  finishing?: string | null
  delivery_status?: string | null
  contract_price?: number | null
  paid_amount?: number | null
  market_price: number | null
  installment_amount?: number | null
  years_left?: number | null
  contract_year?: number | null
  willing_to_discount?: boolean | null
  discount_amount?: number | null
  description?: string | null
  images?: string[] | null
  documents?: Record<string, any> | null
  country?: string | null
  country_code?: string | null
  currency_code?: string | null
  submission_type?: string | null
  last_seller_edit_at?: string | null
  is_featured?: boolean | null
  featured_days?: number | null
  featured_price?: number | null
  featured_status?: string | null
  featured_fawry_code?: string | null
  featured_until?: string | null
  name: string
  phone: string
  email?: string | null
  status?: string | null
  admin_note?: string | null
  created_at: string
}

function getPropertyCountryCode(p: SellRequest) {
  return (p.country_code || p.country || "EG").toUpperCase()
}

function getRemainingDaysBeforePurge(lastEditIso?: string | null) {
  if (!lastEditIso) return 7
  const deletedTime = new Date(lastEditIso).getTime()
  const purgeTime = deletedTime + 7 * 24 * 60 * 60 * 1000
  const diffDays = Math.ceil((purgeTime - Date.now()) / (1000 * 60 * 60 * 24))
  return Math.max(1, Math.min(7, diffDays))
}

type ConfirmPropertyAction =
  | {
      type: "status"
      property: SellRequest
      newStatus: string
    }
  | {
      type: "delete"
      property: SellRequest
    }
  | {
      type: "purge_all_deleted"
      count: number
    }
  | {
      type: "promote"
      property: SellRequest
      promoAction: "activate" | "cancel"
      days: number
    }

export default function PropertiesTable({
  properties,
  mode = "properties",
}: {
  properties: SellRequest[]
  mode?: "properties" | "promotions"
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isPromotionsPage = mode === "promotions"

  // سحب الترجمة والاتجاه واللغة من المحرك المركزي مباشرة
  const { t: dict, locale, dir } = useTranslation()
  const t = dict.admin.propertiesAdmin

  const adminCountries = [
    { code: "ALL", label: t.countries.ALL, flag: "🌍" },
    { code: "EG", label: t.countries.EG, flag: "🇪🇬" },
    { code: "RU", label: t.countries.RU, flag: "🇷🇺" },
    { code: "GE", label: t.countries.GE, flag: "🇬🇪" },
    { code: "AE", label: t.countries.AE, flag: "🇦🇪" },
  ]

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

  const docLabels: Record<string, string> = {
    contract: t.docs.contract,
    receipts: t.docs.receipts,
    statement: t.docs.statement,
    national_id: t.docs.national_id,
  }

  function getStatusLabel(status: string | null | undefined) {
    const st = status || "pending"
    return sellerStatusOptions.find((s) => s.value === st)?.label || st
  }

  function getUnitCurrency(countryCode?: string | null) {
    return getCurrencySymbol(countryCode || "EG", locale)
  }

  function getUploadedDocsList(docs: Record<string, any> | null | undefined) {
    if (!docs || typeof docs !== "object") return []
    return Object.entries(docs)
      .filter(([, val]) => val && typeof val === "object" && val.url)
      .map(([key, val]) => ({
        key,
        label: docLabels[key] || key,
        url: String(val.url),
        name: String(val.name || t.docs.fallbackName),
        uploadedAt: String(val.uploaded_at || ""),
      }))
  }

  const [countryFilter, setCountryFilter] = useState<string>("ALL")
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
    const countryParam = searchParams.get("country")
    const unitIdParam = searchParams.get("unitId")
    const actionParam = searchParams.get("action")

    if (countryParam) {
      setCountryFilter(countryParam.toUpperCase())
    }

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

  function executeConfirmedAction() {
    if (!confirmAction) return
    setNotice(null)

    if (confirmAction.type === "purge_all_deleted") {
      startTransition(async () => {
        try {
          const res = await purgeSellerDeletedPropertiesAction()
          if (res.success) {
            setNotice({
              text: t.notices.purgedSuccess,
            })
            router.refresh()
          } else {
            setNotice({
              text: res.error || "Error",
              isError: true,
            })
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
              text: `${t.notices.statusUpdated} ("${target.project_name || target.name}" → ${stLabel})`,
            })
            router.refresh()
          } else {
            setNotice({
              text: res.error || "Error",
              isError: true,
            })
          }
        } else if (confirmAction.type === "delete") {
          const res = await deletePropertyAction(target.id)
          if (res.success) {
            setNotice({
              text: `${t.notices.deletedSuccess} ("${target.project_name || target.name}")`,
            })
            router.refresh()
          } else {
            setNotice({
              text: res.error || "Error",
              isError: true,
            })
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
                  ? `${t.notices.promoActivated} ("${target.project_name || target.name}" - ${confirmAction.days} ${t.badges.dayWord})`
                  : `${t.notices.promoCancelled} ("${target.project_name || target.name}")`,
            })
            router.refresh()
          } else {
            setNotice({
              text: res.error || "Error",
              isError: true,
            })
          }
        }
      } finally {
        setConfirmAction(null)
        setReason("")
        setActivePropertyId(null)
      }
    })
  }

  const countryProperties =
    countryFilter === "ALL"
      ? properties
      : properties.filter(
          (p) => getPropertyCountryCode(p) === countryFilter
        )

  const deletedBySellerList = countryProperties.filter(
    (p) => p.status === "deleted_by_seller"
  )
  const pendingPromoList = countryProperties.filter(
    (p) =>
      p.status !== "deleted_by_seller" &&
      !p.is_featured &&
      p.featured_status === "pending_payment"
  )
  const activePromoList = countryProperties.filter(
    (p) => p.status !== "deleted_by_seller" && Boolean(p.is_featured)
  )
  const promoRequestsList = countryProperties.filter(
    (p) =>
      p.status !== "deleted_by_seller" &&
      (p.featured_status === "pending_payment" || p.is_featured)
  )
  const sellerActionsList = countryProperties.filter(
    (p) =>
      p.status === "paused_by_seller" ||
      (p.status === "pending" &&
        (p.submission_type === "edited_by_seller" ||
          p.submission_type === "resumed_by_seller"))
  )

  const filtered = countryProperties.filter((p) => {
    const currentStatus = p.status || "pending"
    const unitShortCode = p.id.slice(0, 8).toUpperCase()
    const orderRefCode = `AE-${p.id
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 6)
      .toUpperCase()}`

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      const textMatch =
        `${p.id} ${unitShortCode} ${orderRefCode} ${p.project_name || ""} ${p.area || ""} ${p.name || ""} ${p.phone || ""} ${p.featured_fawry_code || ""}`
          .toLowerCase()
          .includes(q)
      if (!textMatch) return false
      if (isPromotionsPage) return currentStatus !== "deleted_by_seller"
    }

    if (isPromotionsPage) {
      if (currentStatus === "deleted_by_seller") return false
      if (promoTab === "pending_payment") {
        return !p.is_featured && p.featured_status === "pending_payment"
      }
      if (promoTab === "active_featured") {
        return Boolean(p.is_featured)
      }
      if (promoTab === "all_units") {
        return true
      }
      return Boolean(p.is_featured || p.featured_status === "pending_payment")
    }

    if (statusFilter === "deleted") {
      return currentStatus === "deleted_by_seller"
    }

    if (currentStatus === "deleted_by_seller") return false

    if (statusFilter === "seller_actions") {
      return (
        currentStatus === "paused_by_seller" ||
        p.submission_type === "edited_by_seller" ||
        p.submission_type === "resumed_by_seller"
      )
    }

    if (statusFilter !== "all" && currentStatus !== statusFilter) {
      return false
    }

    return true
  })

  function renderSellerActivityBadges(property: SellRequest) {
    const docs = getUploadedDocsList(property.documents)
    const isFeaturedActive =
      Boolean(property.is_featured) &&
      (!property.featured_until ||
        new Date(property.featured_until) > new Date())

    return (
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        {property.submission_type === "edited_by_seller" &&
          property.status === "pending" && (
            <button
              type="button"
              onClick={() => setDetailsProperty(property)}
              className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-800 hover:bg-blue-100"
            >
              <RefreshCw className="size-2.5" />
              <span>{t.badges.editedBySeller}</span>
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
              <span>{t.badges.resumedBySeller}</span>
            </button>
          )}

        {property.status === "paused_by_seller" && (
          <span className="inline-flex items-center gap-1 rounded-md border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-800">
            <PauseCircle className="size-2.5" />
            <span>{t.badges.pausedBySeller}</span>
          </span>
        )}

        {property.status === "deleted_by_seller" && (
          <span className="inline-flex items-center gap-1 rounded-md border border-red-300 bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">
            <Trash2 className="size-2.5" />
            <span>
              {t.badges.deletedBySellerPrefix} (
              {getRemainingDaysBeforePurge(property.last_seller_edit_at)}{" "}
              {t.badges.daysWord})
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
              {docs.length} {t.badges.docWord}
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
              {t.badges.featuredPrefix} ({property.featured_days || 14}{" "}
              {t.badges.dayWord})
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
                {t.badges.promoReqPrefix} ({property.featured_days || 14}{" "}
                {t.badges.dayWord}) · {property.featured_fawry_code || "AD"}
              </span>
            </button>
          )}
      </div>
    )
  }

  return (
    <div dir={dir} className="text-start">
      {/* شريط الإشعار بعد تنفيذ أي عملية */}
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

      {/* 1. شريط العنوان وتوضيح الدولة المعروضة */}
      {(() => {
        const activeCountryObj =
          adminCountries.find((c) => c.code === countryFilter) ||
          adminCountries[0]
        const activeCount =
          countryProperties.length - deletedBySellerList.length

        return (
          <div className="mb-4 rounded-xl border border-gray-200/85 bg-white p-4 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Globe className="size-4 text-[#105C50]" />
                  <h2 className="text-sm font-extrabold text-[#0a1122] sm:text-base">
                    {isPromotionsPage
                      ? countryFilter === "ALL"
                        ? `${t.header.promoAllTitle} (${promoRequestsList.length})`
                        : `${t.header.promoCountryTitle} ${activeCountryObj.label} ${activeCountryObj.flag} (${promoRequestsList.length})`
                      : countryFilter === "ALL"
                        ? `${t.header.sellAllTitle} (${activeCount})`
                        : `${t.header.sellCountryTitle} ${activeCountryObj.label} ${activeCountryObj.flag} (${activeCount})`}
                  </h2>
                </div>
                <p className="mt-1 text-[11px] text-gray-500">
                  {t.header.filterHint}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {adminCountries.map((c) => {
                  const isSelected = c.code === countryFilter
                  const countInC =
                    c.code === "ALL"
                      ? properties.filter(
                          (p) => p.status !== "deleted_by_seller"
                        ).length
                      : properties.filter(
                          (p) =>
                            p.status !== "deleted_by_seller" &&
                            getPropertyCountryCode(p) === c.code
                        ).length

                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setCountryFilter(c.code)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                        isSelected
                          ? "bg-[#105C50] text-white shadow-2xs"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <span>{c.flag}</span>
                      <span>{c.label}</span>
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-white text-gray-600"
                        }`}
                      >
                        {countInC}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })()}

      {/* 2. شريط البحث والتبويبات الموحد */}
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

      {/* ==================== 1. عرض الموبايل ==================== */}
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
            const unitCur = getUnitCurrency(getPropertyCountryCode(property))

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
                      {property.area || "—"} ·{" "}
                      {property.unit_type || t.table.defaultUnitType}{" "}
                      {property.size
                        ? `· ${property.size} ${t.table.sqmUnit}`
                        : ""}
                    </p>
                    <span className="mt-0.5 inline-block font-mono text-[10px] text-gray-400">
                      #{property.id.slice(0, 8).toUpperCase()}
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
                    href={`https://wa.me/${String(property.phone || "").replace(/\D/g, "")}`}
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

      {/* ==================== 2. عرض الكمبيوتر ==================== */}
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
                const unitCur = getUnitCurrency(
                  getPropertyCountryCode(property)
                )

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
                        {property.area || "—"} ·{" "}
                        {property.unit_type || t.table.defaultUnitType}{" "}
                        {property.size
                          ? `· ${property.size}${t.table.sqmUnit}`
                          : ""}
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] text-gray-400">
                        #{property.id.slice(0, 8).toUpperCase()}
                        {property.featured_fawry_code
                          ? ` · ${t.badges.adCodeLabel} ${property.featured_fawry_code}`
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
                          {t.badges.negotiable}
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
                        className="mt-0.5 text-start font-mono text-[11px] font-semibold text-gray-600"
                      >
                        {property.phone}
                      </div>
                      {property.email && (
                        <div className="truncate text-[10.5px] text-gray-400">
                          {property.email}
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

                        <a
                          href={`https://wa.me/${String(property.phone || "").replace(/\D/g, "")}`}
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

      {/* ==================== 3. نافذة التأكيد الموحدة ==================== */}
      <Dialog
        open={Boolean(confirmAction)}
        onOpenChange={(open) => {
          if (!open) closeConfirmModal()
        }}
      >
        <DialogContent
          dir={dir}
          className="w-[90vw] max-w-[360px] rounded-2xl p-5 text-start sm:max-w-[390px]"
        >
          {confirmAction && (
            <>
              <DialogHeader className="text-start">
                <div className="mb-1.5 flex items-center gap-2">
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                      confirmAction.type === "delete" ||
                      confirmAction.type === "purge_all_deleted" ||
                      (confirmAction.type === "status" &&
                        confirmAction.newStatus === "rejected")
                        ? "bg-red-100 text-red-600"
                        : confirmAction.type === "promote"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-[#105C50]"
                    }`}
                  >
                    {confirmAction.type === "delete" ||
                    confirmAction.type === "purge_all_deleted" ? (
                      <Trash2 className="size-4" />
                    ) : confirmAction.type === "promote" ? (
                      <Star className="size-4 fill-amber-400 text-amber-600" />
                    ) : (
                      <ShieldAlert className="size-4" />
                    )}
                  </span>
                  <DialogTitle className="text-sm font-extrabold text-[#0a1122]">
                    {confirmAction.type === "purge_all_deleted" &&
                      t.modals.purgeTitle}
                    {confirmAction.type === "delete" && t.modals.deleteTitle}
                    {confirmAction.type === "promote" &&
                      (confirmAction.promoAction === "activate"
                        ? t.modals.activatePromoTitle
                        : t.modals.cancelPromoTitle)}
                    {confirmAction.type === "status" &&
                      (confirmAction.newStatus === "active"
                        ? t.modals.publishConfirmTitle
                        : confirmAction.newStatus === "pending"
                          ? t.modals.unpublishConfirmTitle
                          : t.modals.stageConfirmTitle)}
                  </DialogTitle>
                </div>

                <DialogDescription className="text-start text-xs leading-relaxed text-gray-600">
                  {confirmAction.type === "purge_all_deleted" && (
                    <>
                      {t.modals.purgeDescPrefix} ({confirmAction.count}){" "}
                      {t.modals.purgeDescSuffix}
                    </>
                  )}

                  {confirmAction.type === "status" && (
                    <>
                      {t.modals.updateUnitPrefix}{" "}
                      <strong className="text-[#0a1122]">
                        "{confirmAction.property.project_name || confirmAction.property.name}"
                      </strong>{" "}
                      {t.modals.toWord}{" "}
                      <span className="font-bold text-[#105C50]">
                        ({getStatusLabel(confirmAction.newStatus)})
                      </span>
                      ؟
                    </>
                  )}

                  {confirmAction.type === "delete" && (
                    <>
                      {t.modals.deleteDescPrefix}{" "}
                      <strong className="text-red-600">
                        "
                        {confirmAction.property.project_name ||
                          confirmAction.property.name}
                        "
                      </strong>{" "}
                      {t.modals.deleteDescSuffix}
                    </>
                  )}

                  {confirmAction.type === "promote" &&
                    (confirmAction.promoAction === "activate" ? (
                      <>
                        {t.modals.selectPromoDuration}{" "}
                        <strong className="text-[#0a1122]">
                          "{confirmAction.property.project_name || confirmAction.property.name}"
                        </strong>
                        :
                      </>
                    ) : (
                      <>
                        {t.modals.confirmCancelPromo}{" "}
                        <strong className="text-[#0a1122]">
                          "{confirmAction.property.project_name || confirmAction.property.name}"
                        </strong>
                        ؟
                      </>
                    ))}
                </DialogDescription>
              </DialogHeader>

              {confirmAction.type === "promote" &&
                confirmAction.promoAction === "activate" && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {[7, 14, 30].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() =>
                          setConfirmAction({
                            ...confirmAction,
                            days: d,
                          })
                        }
                        className={`rounded-xl border py-2 text-xs font-extrabold transition ${
                          confirmAction.days === d
                            ? "border-[#105C50] bg-[#eff9f5] text-[#105C50]"
                            : "border-gray-200 bg-white text-gray-600"
                        }`}
                      >
                        {d} {t.badges.dayWord}
                      </button>
                    ))}
                  </div>
                )}

              {confirmAction.type === "status" &&
                confirmAction.newStatus === "rejected" && (
                  <div className="mt-2">
                    <Textarea
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      placeholder={t.modals.rejectReasonPlaceholder}
                      className="min-h-[65px] rounded-xl text-xs"
                    />
                  </div>
                )}

              <DialogFooter className="mt-4 flex flex-row items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={closeConfirmModal}
                  className="h-9 flex-1 rounded-xl text-xs font-bold sm:flex-none"
                >
                  {t.actions.cancelBtn}
                </Button>
                <Button
                  type="button"
                  disabled={pending}
                  onClick={executeConfirmedAction}
                  className={`h-9 flex-1 rounded-xl text-xs font-bold text-white sm:flex-none ${
                    confirmAction.type === "delete" ||
                    confirmAction.type === "purge_all_deleted" ||
                    (confirmAction.type === "status" &&
                      confirmAction.newStatus === "rejected")
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-[#105C50] hover:bg-[#0c483f]"
                  }`}
                >
                  {pending ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <Loader2 className="size-3.5 animate-spin" />
                      {t.actions.executingBtn}
                    </span>
                  ) : (
                    t.actions.confirmBtn
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ==================== 4. نافذة تفاصيل الوحدة والمستندات ==================== */}
      <Dialog
        open={Boolean(detailsProperty)}
        onOpenChange={(open) => !open && setDetailsProperty(null)}
      >
        <DialogContent
          dir={dir}
          className="max-h-[88vh] w-[92vw] max-w-[460px] overflow-y-auto rounded-2xl p-5 text-start sm:max-w-lg"
        >
          {detailsProperty && (
            <>
              <DialogHeader className="text-start">
                <DialogTitle className="text-sm font-extrabold sm:text-base">
                  {detailsProperty.project_name || t.modals.detailsFallbackTitle}{" "}
                  — {detailsProperty.name}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  {t.actions.detailsBtn}
                </DialogDescription>
              </DialogHeader>

              {renderSellerActivityBadges(detailsProperty)}

              <div className="mt-2.5 rounded-xl border border-gray-200 bg-gray-50/70 p-2.5">
                <label className="mb-1 block text-[11px] font-bold text-gray-500">
                  {t.table.colStage}:
                </label>
                <select
                  disabled={pending}
                  value={detailsProperty.status || "pending"}
                  onChange={(e) => {
                    const nextSt = e.target.value
                    const target = detailsProperty
                    setDetailsProperty(null)
                    setConfirmAction({
                      type: "status",
                      property: target,
                      newStatus: nextSt,
                    })
                  }}
                  className="h-8 w-full rounded-lg border border-gray-200 bg-white px-2 text-xs font-bold text-[#0a1122]"
                >
                  {sellerStatusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-2.5 grid grid-cols-2 gap-2.5 rounded-xl bg-gray-50 p-3 text-xs">
                <div>
                  <span className="block text-[10px] text-gray-400">
                    {t.modals.areaLabel}
                  </span>
                  <strong className="text-[#0a1122]">
                    {detailsProperty.area || "—"}
                  </strong>
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400">
                    {t.modals.developerLabel}
                  </span>
                  <strong className="text-[#0a1122]">
                    {detailsProperty.developer_name || "—"}
                  </strong>
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400">
                    {t.modals.typeSizeLabel}
                  </span>
                  <strong className="text-[#0a1122]">
                    {detailsProperty.unit_type || "—"} (
                    {detailsProperty.size || 0} {t.table.sqmUnit})
                  </strong>
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400">
                    {t.modals.roomsBathLabel}
                  </span>
                  <strong className="text-[#0a1122]">
                    {detailsProperty.rooms || 0} {t.modals.roomsWord} ·{" "}
                    {detailsProperty.bathrooms || 0} {t.modals.bathWord}
                  </strong>
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400">
                    {t.modals.contractPriceLabel}
                  </span>
                  <strong className="text-[#0a1122]">
                    <span dir="ltr">
                      {Number(
                        detailsProperty.contract_price || 0
                      ).toLocaleString("en-US")}
                    </span>{" "}
                    {getUnitCurrency(getPropertyCountryCode(detailsProperty))}
                  </strong>
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400">
                    {t.table.colCash}
                  </span>
                  <strong className="text-[#105C50]">
                    <span dir="ltr">
                      {Number(detailsProperty.paid_amount || 0).toLocaleString(
                        "en-US"
                      )}
                    </span>{" "}
                    {getUnitCurrency(getPropertyCountryCode(detailsProperty))}
                  </strong>
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400">
                    {t.modals.marketPriceLabel}
                  </span>
                  <strong className="text-[#0a1122]">
                    <span dir="ltr">
                      {Number(detailsProperty.market_price || 0).toLocaleString(
                        "en-US"
                      )}
                    </span>{" "}
                    {getUnitCurrency(getPropertyCountryCode(detailsProperty))}
                  </strong>
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400">
                    {t.modals.installmentYearsLabel}
                  </span>
                  <strong className="text-[#0a1122]">
                    <span dir="ltr">
                      {Number(
                        detailsProperty.installment_amount || 0
                      ).toLocaleString("en-US")}
                    </span>{" "}
                    ({detailsProperty.years_left || 0} {t.modals.yearsWord})
                  </strong>
                </div>
              </div>

              {(() => {
                const uploadedDocs = getUploadedDocsList(
                  detailsProperty.documents
                )
                return (
                  <div className="mt-2.5 rounded-xl border border-gray-200 p-3 text-start text-xs">
                    <p className="mb-2 font-extrabold text-[#0a1122]">
                      {t.modals.uploadedDocsTitle} ({uploadedDocs.length}/4):
                    </p>
                    {uploadedDocs.length === 0 ? (
                      <p className="text-[11px] text-gray-400">
                        {t.modals.noDocsUploaded}
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {uploadedDocs.map((doc) => (
                          <div
                            key={doc.key}
                            className="flex items-center justify-between rounded-lg bg-emerald-50/70 px-3 py-1.5"
                          >
                            <span className="font-bold text-[#0a1122]">
                              {doc.label}
                            </span>
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-md bg-[#105C50] px-2.5 py-1 text-[10px] font-bold text-white"
                            >
                              <span>{t.actions.openDocBtn}</span>
                              <ExternalLink className="size-3" />
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })()}

              <DialogFooter className="mt-4 flex flex-wrap items-center justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDetailsProperty(null)}
                  className="h-8 rounded-lg text-xs font-bold"
                >
                  {t.actions.closeBtn}
                </Button>

                {detailsProperty.status !== "active" ? (
                  <Button
                    disabled={pending}
                    className="h-8 flex-1 rounded-lg bg-[#105C50] text-xs font-bold text-white"
                    onClick={() => {
                      const target = detailsProperty
                      setDetailsProperty(null)
                      setConfirmAction({
                        type: "status",
                        property: target,
                        newStatus: "active",
                      })
                    }}
                  >
                    <Check className="me-1 size-3.5" />
                    {t.actions.publishMarketBtn}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    disabled={pending}
                    className="h-8 flex-1 rounded-lg border-orange-300 bg-orange-50 text-xs font-bold text-orange-800"
                    onClick={() => {
                      const target = detailsProperty
                      setDetailsProperty(null)
                      setConfirmAction({
                        type: "status",
                        property: target,
                        newStatus: "pending",
                      })
                    }}
                  >
                    <EyeOff className="me-1 size-3.5" />
                    {t.actions.unpublishBtn}
                  </Button>
                )}

                <Button
                  variant="outline"
                  disabled={pending}
                  className="h-8 rounded-lg border-red-200 bg-red-50 text-xs font-bold text-red-600"
                  onClick={() => {
                    const target = detailsProperty
                    setDetailsProperty(null)
                    setConfirmAction({
                      type: "delete",
                      property: target,
                    })
                  }}
                >
                  <Trash2 className="me-1 size-3.5" />
                  {t.actions.deleteBtn}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
