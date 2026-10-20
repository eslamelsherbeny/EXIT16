"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  AlertTriangle,
  Building2,
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

const ADMIN_COUNTRIES = [
  { code: "ALL", label: "كل الدول", flag: "🌍", currency: "ج.م" },
  { code: "EG", label: "مصر", flag: "🇪🇬", currency: "ج.م" },
  { code: "RU", label: "روسيا", flag: "🇷🇺", currency: "₽" },
  { code: "GE", label: "جورجيا", flag: "🇬🇪", currency: "$" },
  { code: "AE", label: "الإمارات", flag: "🇦🇪", currency: "د.إ" },
]

const SELLER_STATUS_OPTIONS = [
  {
    value: "pending",
    label: "١. في انتظار المراجعة",
    badge: "bg-amber-100 text-amber-800",
  },
  {
    value: "under_review",
    label: "٢. جاري مراجعة المستندات",
    badge: "bg-blue-100 text-blue-800",
  },
  {
    value: "active",
    label: "٣. معتمد ومعروض بالسوق",
    badge: "bg-emerald-100 text-emerald-800",
  },
  {
    value: "offer_received",
    label: "٤. يوجد عرض شراء",
    badge: "bg-purple-100 text-purple-800",
  },
  {
    value: "transferring",
    label: "٥. مرحلة نقل التعاقد",
    badge: "bg-indigo-100 text-indigo-800",
  },
  {
    value: "sold",
    label: "٦. تمت عملية البيع",
    badge: "bg-teal-700 text-white",
  },
  {
    value: "paused_by_seller",
    label: "⏸ متوقفة من المالك",
    badge: "bg-orange-100 text-orange-800",
  },
  {
    value: "deleted_by_seller",
    label: "🗑 محذوفة من المالك",
    badge: "bg-red-100 text-red-800 border border-red-300",
  },
  {
    value: "rejected",
    label: "٧. مرفوض",
    badge: "bg-red-100 text-red-800",
  },
]

const DOC_LABELS: Record<string, string> = {
  contract: "عقد الوحدة الابتدائي",
  receipts: "إيصالات السداد",
  statement: "كشف حساب المطور",
  national_id: "البطاقة الشخصية للمالك",
}

function getPropertyCountryCode(p: SellRequest) {
  return (p.country_code || p.country || "EG").toUpperCase()
}

function getStatusLabel(status: string | null | undefined) {
  const st = status || "pending"
  return SELLER_STATUS_OPTIONS.find((s) => s.value === st)?.label || st
}

function getUnitCurrency(countryCode?: string | null) {
  const c = ADMIN_COUNTRIES.find(
    (x) => x.code === (countryCode || "EG").toUpperCase()
  )
  return c ? c.currency : "ج.م"
}

function getUploadedDocsList(docs: Record<string, any> | null | undefined) {
  if (!docs || typeof docs !== "object") return []
  return Object.entries(docs)
    .filter(([, val]) => val && typeof val === "object" && val.url)
    .map(([key, val]) => ({
      key,
      label: DOC_LABELS[key] || key,
      url: String(val.url),
      name: String(val.name || "مستند"),
      uploadedAt: String(val.uploaded_at || ""),
    }))
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
              text: "تم مسح جميع الوحدات المحذوفة نهائياً ✓",
            })
            router.refresh()
          } else {
            setNotice({
              text: res.error || "تعذر مسح الوحدات المحذوفة.",
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
              text: `تم تحديث حالة "${target.project_name || target.name}" إلى (${stLabel}).`,
            })
            router.refresh()
          } else {
            setNotice({
              text: res.error || "حدث خطأ أثناء تحديث الحالة.",
              isError: true,
            })
          }
        } else if (confirmAction.type === "delete") {
          const res = await deletePropertyAction(target.id)
          if (res.success) {
            setNotice({
              text: `تم حذف وحدة "${target.project_name || target.name}" نهائياً.`,
            })
            router.refresh()
          } else {
            setNotice({
              text: res.error || "تعذر حذف الوحدة.",
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
                  ? `⭐ تم تفعيل تمييز "${target.project_name || target.name}" (${confirmAction.days} يوم)`
                  : `تم إلغاء تمييز "${target.project_name || target.name}".`,
            })
            router.refresh()
          } else {
            setNotice({
              text: res.error || "تعذر تحديث التمييز.",
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

    // فلترة صفحة طلبات الإعلان المستقلة
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

    // فلترة صفحة طلبات البيع العادية
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
              <span>معدّلة من المالك</span>
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
              <span>معاد عرضها</span>
            </button>
          )}

        {property.status === "paused_by_seller" && (
          <span className="inline-flex items-center gap-1 rounded-md border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-800">
            <PauseCircle className="size-2.5" />
            <span>متوقفة من المالك</span>
          </span>
        )}

        {property.status === "deleted_by_seller" && (
          <span className="inline-flex items-center gap-1 rounded-md border border-red-300 bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">
            <Trash2 className="size-2.5" />
            <span>
              حذفها المالك ({getRemainingDaysBeforePurge(property.last_seller_edit_at)} أيام)
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
            <span>{docs.length} مستند</span>
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
              مميزة ({property.featured_days || 14} يوم)
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
                طلب تمييز ({property.featured_days || 14} يوم) ·{" "}
                {property.featured_fawry_code || "AD"}
              </span>
            </button>
          )}
      </div>
    )
  }

  return (
    <div>
      {/* 1. شريط العنوان والدول المدمج */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200/80 bg-white px-4 py-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-extrabold text-[#0a1122] sm:text-lg">
            {isPromotionsPage
              ? `طلبات الإعلان والتمييز (${promoRequestsList.length})`
              : `طلبات البيع (${countryProperties.length - deletedBySellerList.length})`}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {ADMIN_COUNTRIES.map((c) => {
            const isSelected = c.code === countryFilter
            const countInC =
              c.code === "ALL"
                ? properties.filter((p) => p.status !== "deleted_by_seller")
                    .length
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
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                  isSelected
                    ? "bg-[#105C50] text-white"
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

      {notice && (
        <div
          role="status"
          className={`mb-4 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-xs font-bold shadow-2xs ${
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
            className="rounded-lg p-1 opacity-70 hover:bg-black/5"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* 2. شريط البحث والتبويبات الموحد */}
      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-gray-200/80 bg-white p-3 shadow-2xs sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs sm:flex-1">
          <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              isPromotionsPage
                ? "بحث بكود الإعلان (AD-xxxx) أو اسم البائع..."
                : "بحث بالمشروع، الكود، أو اسم/هاتف البائع..."
            }
            className="h-9 w-full rounded-lg border border-gray-200 pr-9 pl-3 text-xs font-semibold focus:border-[#105C50] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {isPromotionsPage ? (
            <>
              {[
                {
                  id: "all_promo" as const,
                  label: `الكل (${promoRequestsList.length})`,
                },
                {
                  id: "pending_payment" as const,
                  label: `بانتظار التفعيل (${pendingPromoList.length})`,
                },
                {
                  id: "active_featured" as const,
                  label: `مميزة نشطة (${activePromoList.length})`,
                },
                {
                  id: "all_units" as const,
                  label: "تمييز وحدة يدوياً",
                },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setPromoTab(t.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    promoTab === t.id
                      ? "bg-[#105C50] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </>
          ) : (
            <>
              {[
                { id: "all", label: "الكل" },
                { id: "pending", label: "بانتظار المراجعة" },
                { id: "active", label: "معروضة بالسوق" },
                {
                  id: "seller_actions",
                  label: `معدلة / متوقفة (${sellerActionsList.length})`,
                },
                { id: "offer_received", label: "عليها عرض" },
                { id: "sold", label: "مباعة" },
                { id: "rejected", label: "مرفوضة" },
                {
                  id: "deleted",
                  label: `محذوفة (${deletedBySellerList.length})`,
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
              الوحدات المحذوفة بواسطة الملاك ({deletedBySellerList.length})
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
              <Trash2 className="ml-1 size-3.5" />
              مسح الكل
            </Button>
          </div>
        )}

      {/* ==================== 1. عرض الموبايل ==================== */}
      <div className="space-y-3 md:hidden">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-xs text-gray-500">
            لا توجد وحدات مطابقة حالياً.
          </div>
        ) : (
          filtered.map((property) => {
            const currentSt = property.status || "pending"
            const stObj =
              SELLER_STATUS_OPTIONS.find((s) => s.value === currentSt) ||
              SELLER_STATUS_OPTIONS[0]
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
                      <span>جاري التحديث...</span>
                    </div>
                  </div>
                )}

                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-extrabold text-[#0a1122] sm:text-sm">
                      {property.project_name || "مشروع غير محدد"}
                    </h3>
                    <p className="mt-0.5 text-[11px] text-gray-500">
                      {property.area || "—"} · {property.unit_type || "شقة"}{" "}
                      {property.size ? `· ${property.size} م²` : ""}
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
                      المطلوب كاش
                    </span>
                    <strong className="mt-0.5 block text-xs font-extrabold text-[#105C50]">
                      {property.paid_amount
                        ? `${Number(property.paid_amount).toLocaleString("en-US")} ${unitCur}`
                        : "—"}
                    </strong>
                  </div>

                  <div className="border-r border-gray-200/70 pr-2 text-[11px]">
                    <div>
                      <span className="text-gray-400">العقد: </span>
                      <strong className="text-[#0a1122]">
                        {property.contract_price
                          ? `${Number(property.contract_price).toLocaleString("en-US")} ${unitCur}`
                          : "—"}
                      </strong>
                    </div>
                    <div className="mt-0.5">
                      <span className="text-gray-400">السوق: </span>
                      <strong className="text-gray-700">
                        {property.market_price
                          ? `${Number(property.market_price).toLocaleString("en-US")} ${unitCur}`
                          : "—"}
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
                    {SELLER_STATUS_OPTIONS.map((opt) => (
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
                      <RotateCcw className="ml-1 size-3" />
                      استرجاع
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
                      <Check className="ml-1 size-3" />
                      نشر بالسوق
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
                      <EyeOff className="ml-1 size-3" />
                      إلغاء النشر
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 flex-1 rounded-lg text-xs font-bold"
                    onClick={() => setDetailsProperty(property)}
                  >
                    <Eye className="ml-1 size-3" />
                    التفاصيل
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
                      <Star className="ml-1 size-3 fill-current" />
                      {isFeaturedActive ? "إلغاء التمييز" : "تمييز ⭐"}
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

      {/* ==================== 2. عرض الكمبيوتر (صفوف منفصلة ومريحة للعين) ==================== */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-separate border-spacing-y-2.5 text-right text-xs">
          <thead>
            <tr className="text-[11px] font-extrabold text-gray-500">
              <th className="px-4 py-2">المشروع / الوحدة</th>
              <th className="px-4 py-2">المطلوب كاش</th>
              <th className="px-4 py-2">العقد / السوق</th>
              <th className="px-4 py-2">بيانات العميل</th>
              <th className="px-4 py-2">مرحلة الطلب</th>
              <th className="px-4 py-2">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="rounded-xl border border-gray-200 bg-white px-5 py-8 text-center text-xs text-gray-500"
                >
                  لا توجد عقارات مطابقة حالياً.
                </td>
              </tr>
            ) : (
              filtered.map((property) => {
                const currentSt = property.status || "pending"
                const stObj =
                  SELLER_STATUS_OPTIONS.find((s) => s.value === currentSt) ||
                  SELLER_STATUS_OPTIONS[0]
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
                  ? "border-y-2 border-[#105C50] first:border-r-2 last:border-l-2 bg-emerald-50/40"
                  : isFeaturedActive
                    ? "border-y border-amber-300 first:border-r last:border-l bg-amber-50/15"
                    : "border-y border-gray-200/90 first:border-r last:border-l bg-white hover:bg-gray-50/60"

                return (
                  <tr
                    id={`prop-row-${property.id}`}
                    key={property.id}
                    className={`shadow-2xs transition-all ${
                      isRowLoading ? "opacity-60" : ""
                    }`}
                  >
                    <td
                      className={`rounded-r-xl px-4 py-3.5 align-middle ${cellBorderCls}`}
                    >
                      <div className="flex items-center gap-2 font-extrabold text-[#0a1122]">
                        <span className="text-[13px]">
                          {property.project_name || "مشروع غير محدد"}
                        </span>
                        {isRowLoading && (
                          <Loader2 className="size-3.5 animate-spin text-[#105C50]" />
                        )}
                      </div>
                      <div className="mt-0.5 text-[11px] text-gray-500">
                        {property.area || "—"} · {property.unit_type || "شقة"}{" "}
                        {property.size ? `· ${property.size}م²` : ""}
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] text-gray-400">
                        #{property.id.slice(0, 8).toUpperCase()}
                        {property.featured_fawry_code
                          ? ` · كود الإعلان: ${property.featured_fawry_code}`
                          : ""}
                      </div>
                      {renderSellerActivityBadges(property)}
                    </td>

                    <td
                      className={`border-r border-r-gray-100 px-4 py-3.5 align-middle ${cellBorderCls}`}
                    >
                      <div className="text-[13px] font-extrabold text-[#105C50] tabular-nums">
                        {property.paid_amount
                          ? `${Number(property.paid_amount).toLocaleString("en-US")} ${unitCur}`
                          : "—"}
                      </div>
                      {property.willing_to_discount && (
                        <span className="mt-1 inline-block rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                          قابل للتفاوض
                        </span>
                      )}
                    </td>

                    <td
                      className={`border-r border-r-gray-100 px-4 py-3.5 align-middle text-[11.5px] ${cellBorderCls}`}
                    >
                      <div>
                        <span className="text-gray-400">العقد: </span>
                        <strong className="text-[#0a1122] tabular-nums">
                          {property.contract_price
                            ? `${Number(property.contract_price).toLocaleString("en-US")} ${unitCur}`
                            : "—"}
                        </strong>
                      </div>
                      <div className="mt-1 text-gray-500">
                        <span className="text-gray-400">السوق: </span>
                        <span className="tabular-nums">
                          {property.market_price
                            ? `${Number(property.market_price).toLocaleString("en-US")} ${unitCur}`
                            : "—"}
                        </span>
                      </div>
                    </td>

                    <td
                      className={`border-r border-r-gray-100 px-4 py-3.5 align-middle ${cellBorderCls}`}
                    >
                      <div className="text-xs font-extrabold text-[#0a1122]">
                        {property.name}
                      </div>
                      <div
                        dir="ltr"
                        className="mt-0.5 text-right font-mono text-[11px] font-semibold text-gray-600"
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
                      className={`border-r border-r-gray-100 px-4 py-3.5 align-middle ${cellBorderCls}`}
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
                          {SELLER_STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>

                    <td
                      className={`rounded-l-xl border-r border-r-gray-100 px-4 py-3.5 align-middle ${cellBorderCls}`}
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
                            <RotateCcw className="ml-1 size-3" />
                            استرجاع
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
                                <Check className="ml-1 size-3" />
                                نشر
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
                                <EyeOff className="ml-1 size-3" />
                                إلغاء النشر
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
                              <Star className="ml-1 size-3 fill-current" />
                              {isFeaturedActive ? "إلغاء التمييز" : "تمييز ⭐"}
                            </Button>
                          </>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2.5 text-[11px] font-bold"
                          onClick={() => setDetailsProperty(property)}
                        >
                          <Eye className="ml-1 size-3" />
                          التفاصيل
                        </Button>

                        <a
                          href={`https://wa.me/${String(property.phone || "").replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-8 items-center justify-center rounded-md bg-[#25D366] px-2 text-white hover:opacity-90"
                          title="واتساب"
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
                          title="حذف نهائي"
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
          dir="rtl"
          className="w-[90vw] max-w-[360px] rounded-2xl p-5 sm:max-w-[390px]"
        >
          {confirmAction && (
            <>
              <DialogHeader className="text-right">
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
                      "مسح الوحدات المحذوفة"}
                    {confirmAction.type === "delete" && "تأكيد الحذف النهائي"}
                    {confirmAction.type === "promote" &&
                      (confirmAction.promoAction === "activate"
                        ? "تفعيل تمييز الوحدة ⭐"
                        : "إلغاء تمييز الوحدة")}
                    {confirmAction.type === "status" &&
                      (confirmAction.newStatus === "active"
                        ? "تأكيد نشر الوحدة"
                        : confirmAction.newStatus === "pending"
                          ? "تأكيد إلغاء النشر"
                          : "تأكيد تحديث المرحلة")}
                  </DialogTitle>
                </div>

                <DialogDescription className="text-right text-xs leading-relaxed text-gray-600">
                  {confirmAction.type === "purge_all_deleted" && (
                    <>
                      مسح جميع الوحدات المحذوفة ({confirmAction.count} وحدات)
                      نهائياً من قاعدة البيانات؟
                    </>
                  )}

                  {confirmAction.type === "status" && (
                    <>
                      تحديث وحدة{" "}
                      <strong className="text-[#0a1122]">
                        "{confirmAction.property.project_name || "البائع"}"
                      </strong>{" "}
                      إلى{" "}
                      <span className="font-bold text-[#105C50]">
                        ({getStatusLabel(confirmAction.newStatus)})
                      </span>
                      ؟
                    </>
                  )}

                  {confirmAction.type === "delete" && (
                    <>
                      حذف وحدة{" "}
                      <strong className="text-red-600">
                        "
                        {confirmAction.property.project_name ||
                          confirmAction.property.name}
                        "
                      </strong>{" "}
                      نهائياً؟
                    </>
                  )}

                  {confirmAction.type === "promote" &&
                    (confirmAction.promoAction === "activate" ? (
                      <>
                        اختر مدة تمييز وحدة{" "}
                        <strong className="text-[#0a1122]">
                          "{confirmAction.property.project_name || "البائع"}"
                        </strong>
                        :
                      </>
                    ) : (
                      <>
                        إلغاء تمييز وحدة{" "}
                        <strong className="text-[#0a1122]">
                          "{confirmAction.property.project_name || "البائع"}"
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
                        {d} يوم
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
                      placeholder="سبب الرفض أو ملاحظة للبائع (اختياري)..."
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
                  إلغاء
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
                      جاري التنفيذ...
                    </span>
                  ) : (
                    "تأكيد"
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
          dir="rtl"
          className="max-h-[88vh] w-[92vw] max-w-[460px] overflow-y-auto rounded-2xl p-5 sm:max-w-lg"
        >
          {detailsProperty && (
            <>
              <DialogHeader className="text-right">
                <DialogTitle className="text-sm font-extrabold sm:text-base">
                  {detailsProperty.project_name || "وحدة عقارية"} —{" "}
                  {detailsProperty.name}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  تفاصيل الوحدة
                </DialogDescription>
              </DialogHeader>

              {renderSellerActivityBadges(detailsProperty)}

              <div className="mt-2.5 rounded-xl border border-gray-200 bg-gray-50/70 p-2.5">
                <label className="mb-1 block text-[11px] font-bold text-gray-500">
                  مرحلة الطلب:
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
                  {SELLER_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-2.5 grid grid-cols-2 gap-2.5 rounded-xl bg-gray-50 p-3 text-xs">
                <div>
                  <span className="block text-[10px] text-gray-400">المنطقة</span>
                  <strong className="text-[#0a1122]">
                    {detailsProperty.area || "—"}
                  </strong>
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400">المطور</span>
                  <strong className="text-[#0a1122]">
                    {detailsProperty.developer_name || "—"}
                  </strong>
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400">
                    النوع والمساحة
                  </span>
                  <strong className="text-[#0a1122]">
                    {detailsProperty.unit_type || "—"} (
                    {detailsProperty.size || 0} م²)
                  </strong>
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400">
                    الغرف / الحمامات
                  </span>
                  <strong className="text-[#0a1122]">
                    {detailsProperty.rooms || 0} غرف ·{" "}
                    {detailsProperty.bathrooms || 0} حمام
                  </strong>
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400">
                    سعر العقد
                  </span>
                  <strong className="text-[#0a1122]">
                    {Number(detailsProperty.contract_price || 0).toLocaleString(
                      "en-US"
                    )}{" "}
                    {getUnitCurrency(getPropertyCountryCode(detailsProperty))}
                  </strong>
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400">
                    المطلوب كاش
                  </span>
                  <strong className="text-[#105C50]">
                    {Number(detailsProperty.paid_amount || 0).toLocaleString(
                      "en-US"
                    )}{" "}
                    {getUnitCurrency(getPropertyCountryCode(detailsProperty))}
                  </strong>
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400">
                    سعر السوق
                  </span>
                  <strong className="text-[#0a1122]">
                    {Number(detailsProperty.market_price || 0).toLocaleString(
                      "en-US"
                    )}{" "}
                    {getUnitCurrency(getPropertyCountryCode(detailsProperty))}
                  </strong>
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400">
                    القسط والمدة
                  </span>
                  <strong className="text-[#0a1122]">
                    {Number(
                      detailsProperty.installment_amount || 0
                    ).toLocaleString("en-US")}{" "}
                    ({detailsProperty.years_left || 0} سنوات)
                  </strong>
                </div>
              </div>

              {(() => {
                const uploadedDocs = getUploadedDocsList(
                  detailsProperty.documents
                )
                return (
                  <div className="mt-2.5 rounded-xl border border-gray-200 p-3 text-right text-xs">
                    <p className="mb-2 font-extrabold text-[#0a1122]">
                      المستندات المرفوعة ({uploadedDocs.length}/4):
                    </p>
                    {uploadedDocs.length === 0 ? (
                      <p className="text-[11px] text-gray-400">
                        لا توجد مستندات مرفوعة.
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
                              <span>فتح</span>
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
                  إغلاق
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
                    <Check className="ml-1 size-3.5" />
                    نشر الوحدة
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
                    <EyeOff className="ml-1 size-3.5" />
                    إلغاء النشر
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
                  <Trash2 className="ml-1 size-3.5" />
                  حذف
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}