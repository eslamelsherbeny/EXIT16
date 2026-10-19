"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  Building2,
  Check,
  CheckCircle2,
  ExternalLink,
  Eye,
  FileCheck2,
  Loader2,
  MessageCircle,
  PauseCircle,
  Phone,
  RefreshCw,
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
    label: "٣. معتمد ومعروض في السوق",
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
    label: "⏸ أوقفها المالك مؤقتاً",
    badge: "bg-orange-100 text-orange-800",
  },
  {
    value: "deleted_by_seller",
    label: "🗑 حذفها المالك من حسابه",
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

function getStatusLabel(status: string | null | undefined) {
  const st = status || "pending"
  return SELLER_STATUS_OPTIONS.find((s) => s.value === st)?.label || st
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
      type: "promote"
      property: SellRequest
      promoAction: "activate" | "cancel"
      days: number
    }

export default function PropertiesTable({
  properties,
}: {
  properties: SellRequest[]
}) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [detailsProperty, setDetailsProperty] = useState<SellRequest | null>(
    null
  )
  const [confirmAction, setConfirmAction] =
    useState<ConfirmPropertyAction | null>(null)
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null)
  const [reason, setReason] = useState("")
  const [promoDaysInput, setPromoDaysInput] = useState<number>(14)
  const [notice, setNotice] = useState<{
    text: string
    isError?: boolean
  } | null>(null)
  const [pending, startTransition] = useTransition()

  function closeConfirmModal() {
    if (pending) return
    setConfirmAction(null)
    setReason("")
  }

  function executeConfirmedAction() {
    if (!confirmAction) return
    setNotice(null)
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
              text: `تم تحديث حالة وحدة "${target.project_name || target.name}" إلى (${stLabel}) بنجاح.`,
            })
            router.refresh()
          } else {
            setNotice({
              text: res.error || "حدث خطأ أثناء تحديث حالة الوحدة.",
              isError: true,
            })
          }
        } else if (confirmAction.type === "delete") {
          const res = await deletePropertyAction(target.id)
          if (res.success) {
            setNotice({
              text: `تم حذف وحدة "${target.project_name || target.name}" نهائياً من قاعدة البيانات.`,
            })
            router.refresh()
          } else {
            setNotice({
              text: res.error || "تعذر حذف طلب الوحدة.",
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
                  ? `⭐ تم تفعيل تمييز وحدة "${target.project_name || target.name}" لمدة (${confirmAction.days} يوم) بنجاح!`
                  : `تم إلغاء تمييز وحدة "${target.project_name || target.name}".`,
            })
            router.refresh()
          } else {
            setNotice({
              text: res.error || "تعذر تحديث حالة التمييز.",
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

  const filtered = properties.filter((p) => {
    const currentStatus = p.status || "pending"
    if (statusFilter === "seller_actions") {
      const isSellerAction =
        currentStatus === "paused_by_seller" ||
        currentStatus === "deleted_by_seller" ||
        p.submission_type === "edited_by_seller" ||
        p.submission_type === "resumed_by_seller"
      if (!isSellerAction) return false
    } else if (statusFilter === "featured") {
      if (!p.is_featured && p.featured_status !== "pending_payment")
        return false
    } else if (statusFilter !== "all" && currentStatus !== statusFilter) {
      return false
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      const textMatch =
        `${p.id} ${p.project_name || ""} ${p.area || ""} ${p.name || ""} ${p.phone || ""} ${p.featured_fawry_code || ""}`
          .toLowerCase()
          .includes(q)
      if (!textMatch) return false
    }
    return true
  })

  // عرض الشارات الخاصة بتعديلات البائع والمستندات والتمييز
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
            <span className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-extrabold text-blue-800">
              <RefreshCw className="size-2.5" />
              <span>معدّلة من المالك</span>
            </span>
          )}

        {property.submission_type === "resumed_by_seller" &&
          property.status === "pending" && (
            <span className="inline-flex items-center gap-1 rounded-md border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-extrabold text-purple-800">
              <RefreshCw className="size-2.5" />
              <span>معاد عرضها من المالك</span>
            </span>
          )}

        {property.status === "paused_by_seller" && (
          <span className="inline-flex items-center gap-1 rounded-md border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-extrabold text-orange-800">
            <PauseCircle className="size-2.5" />
            <span>أوقفها المالك مؤقتاً</span>
          </span>
        )}

        {property.status === "deleted_by_seller" && (
          <span className="inline-flex items-center gap-1 rounded-md border border-red-300 bg-red-100 px-2 py-0.5 text-[10px] font-extrabold text-red-800">
            <Trash2 className="size-2.5" />
            <span>حذفها المالك من حسابه (محفوظة للأدمن)</span>
          </span>
        )}

        {docs.length > 0 && (
          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-[#105C50]">
            <FileCheck2 className="size-2.5" />
            <span>{docs.length} مستند مرفوع</span>
          </span>
        )}

        {isFeaturedActive && (
          <span className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-900">
            <Star className="size-2.5 fill-amber-500 text-amber-600" />
            <span>مميزة ({property.featured_days || 14} يوم)</span>
          </span>
        )}

        {!isFeaturedActive &&
          property.featured_status === "pending_payment" && (
            <span className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-extrabold text-amber-800">
              <Sparkles className="size-2.5 text-amber-600" />
              <span>
                طلب تمييز ({property.featured_days} يوم) · فوري:{" "}
                {property.featured_fawry_code}
              </span>
            </span>
          )}
      </div>
    )
  }

  return (
    <div>
      {/* الهيدر العلوي */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold text-[#105C50]">إدارة المخزون</p>
          <h2 className="mt-1 text-xl font-extrabold text-[#0a1122] sm:text-3xl">
            إدارة عقارات البائعين ({properties.length})
          </h2>
          <p className="mt-1 text-xs text-gray-500 sm:text-sm">
            تحكم في حالة كل وحدة، راجع المستندات والتعديلات، وفعّل باقات التمييز (⭐).
          </p>
        </div>
      </div>

      {/* إشعار واضح بعد كل عملية */}
      {notice && (
        <div
          role="status"
          className={`mb-5 flex items-center justify-between gap-3 rounded-xl border p-3.5 text-xs font-bold shadow-xs sm:p-4 sm:text-sm ${
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

      {/* شريط البحث والفلترة السريعة */}
      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-gray-200/80 bg-white p-3.5 shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-4">
        <div className="relative w-full sm:min-w-[260px] sm:flex-1">
          <Search className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث باسم المشروع، المنطقة، البائع، الهاتف، أو كود فوري..."
            className="h-10 w-full rounded-xl border border-gray-200 pr-10 pl-4 text-xs focus:border-[#105C50] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {[
            { id: "all", label: "الكل" },
            { id: "pending", label: "بانتظار المراجعة" },
            { id: "active", label: "معروضة بالسوق" },
            { id: "featured", label: "⭐ المميزة وطلبات الترويج" },
            { id: "seller_actions", label: "🔄 معدلة / متوقفة / محذوفة من المالك" },
            { id: "offer_received", label: "عليها عرض" },
            { id: "sold", label: "مباعة" },
            { id: "rejected", label: "مرفوضة" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`rounded-xl px-3 py-1.5 text-[11px] font-bold transition sm:py-2 sm:text-xs ${
                statusFilter === tab.id
                  ? "bg-[#105C50] text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ==================== 1. عرض الموبايل ==================== */}
      <div className="space-y-3.5 md:hidden">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-xs text-gray-400">
            لا توجد عقارات مطابقة للبحث الحالي.
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

            return (
              <div
                key={property.id}
                className={`relative overflow-hidden rounded-2xl border bg-white p-4 shadow-xs transition ${
                  isCardLoading
                    ? "border-[#105C50] opacity-75"
                    : currentSt === "deleted_by_seller"
                      ? "border-red-300 bg-red-50/20"
                      : isFeaturedActive
                        ? "border-amber-300 ring-1 ring-amber-200/50"
                        : "border-gray-200/90"
                }`}
              >
                {isCardLoading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/65 backdrop-blur-[1px]">
                    <div className="flex items-center gap-2 rounded-full bg-[#0a1122] px-4 py-2 text-xs font-bold text-white shadow-md">
                      <Loader2 className="size-4 animate-spin text-emerald-400" />
                      <span>جاري تحديث الوحدة...</span>
                    </div>
                  </div>
                )}

                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#105C50]/10 text-[#105C50]">
                      <Building2 className="size-4" />
                    </span>
                    <div>
                      <h3 className="text-sm font-extrabold text-[#0a1122]">
                        {property.project_name || "مشروع غير محدد"}
                      </h3>
                      <p className="mt-0.5 text-[11px] text-gray-500">
                        {property.area || "—"} · {property.unit_type || "شقة"}{" "}
                        {property.size ? `· ${property.size} م²` : ""}
                      </p>
                      <span className="mt-1 inline-block font-mono text-[10px] text-gray-400">
                        #{property.id.slice(0, 8).toUpperCase()}
                      </span>
                      {renderSellerActivityBadges(property)}
                    </div>
                  </div>

                  <Badge className={`shrink-0 text-[10px] ${stObj.badge}`}>
                    {stObj.label}
                  </Badge>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2.5 rounded-xl border border-gray-100 bg-gray-50/80 p-3 text-xs">
                  <div>
                    <span className="block text-[10px] text-gray-400">
                      المطلوب كاش (المدفوع)
                    </span>
                    <strong className="mt-0.5 block text-sm font-extrabold text-[#105C50]">
                      {property.paid_amount
                        ? `${Number(property.paid_amount).toLocaleString("en-US")} ج.م`
                        : "—"}
                    </strong>
                  </div>

                  <div className="border-r border-gray-200/70 pr-2.5">
                    <div className="text-[11px]">
                      <span className="text-gray-400">العقد: </span>
                      <strong className="text-[#0a1122]">
                        {property.contract_price
                          ? `${Number(property.contract_price).toLocaleString("en-US")}`
                          : "—"}
                      </strong>
                    </div>
                    <div className="mt-1 text-[11px]">
                      <span className="text-gray-400">السوق: </span>
                      <strong className="text-gray-700">
                        {property.market_price
                          ? `${Number(property.market_price).toLocaleString("en-US")}`
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
                  </div>
                </div>

                <div className="mt-3">
                  <label className="mb-1 block text-[11px] font-bold text-gray-500">
                    تغيير مرحلة الطلب:
                  </label>
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
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-[#0a1122] focus:border-[#105C50] focus:outline-none"
                  >
                    {SELLER_STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-gray-100 pt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 flex-1 rounded-xl text-xs font-bold"
                    onClick={() => setDetailsProperty(property)}
                  >
                    <Eye className="ml-1 size-3.5" />
                    التفاصيل والمستندات
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => {
                      setPromoDaysInput(property.featured_days || 14)
                      setConfirmAction({
                        type: "promote",
                        property,
                        promoAction: isFeaturedActive ? "cancel" : "activate",
                        days: property.featured_days || 14,
                      })
                    }}
                    className={`h-9 rounded-xl px-3 text-xs font-bold ${
                      isFeaturedActive
                        ? "border-amber-300 bg-amber-100 text-amber-900"
                        : "border-amber-200 bg-amber-50/70 text-amber-800"
                    }`}
                  >
                    <Star className="ml-1 size-3.5 fill-amber-400 text-amber-500" />
                    {isFeaturedActive ? "إلغاء التمييز" : "تمييز ⭐"}
                  </Button>

                  {currentSt !== "active" && (
                    <Button
                      size="sm"
                      disabled={pending}
                      className="h-9 flex-1 rounded-xl bg-[#105C50] text-xs font-bold text-white hover:bg-[#0c483f]"
                      onClick={() =>
                        setConfirmAction({
                          type: "status",
                          property,
                          newStatus: "active",
                        })
                      }
                    >
                      <Check className="ml-1 size-3.5" />
                      نشر
                    </Button>
                  )}

                  <a
                    href={`https://wa.me/${String(property.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(`أهلاً أستاذ ${property.name}، معك إدارة منصة دارك بخصوص وحدتك المعروضة في مشروع (${property.project_name || "وحدتك"}).`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 items-center justify-center rounded-xl bg-[#25D366] px-3 text-xs font-bold text-white hover:opacity-90"
                    title="تواصل واتساب"
                  >
                    <MessageCircle className="size-4" />
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
                    className="inline-flex h-9 items-center justify-center rounded-xl border border-red-200 bg-red-50/50 px-2.5 text-red-600 transition hover:bg-red-100"
                    title="حذف نهائي من قاعدة البيانات"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ==================== 2. عرض الكمبيوتر (الجدول الكامل) ==================== */}
      <Card className="hidden border-gray-200/80 bg-white shadow-sm md:block">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-base font-extrabold">
            قائمة الوحدات ({filtered.length})
          </CardTitle>
          <CardDescription className="text-xs">
            تظهر هنا شارات تعديل البائع، إيقاف العرض، أو حذف المالك للوحدة، مع إمكانية مراجعة المستندات وتفعيل التمييز (⭐).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs sm:text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-4 font-bold">المشروع / الوحدة وحركة المالك</th>
                  <th className="px-4 py-4 font-bold">المطلوب كاش (المدفوع)</th>
                  <th className="px-4 py-4 font-bold">سعر العقد / السوق</th>
                  <th className="px-4 py-4 font-bold">بيانات البائع</th>
                  <th className="px-4 py-4 font-bold">حالة الطلب (تحكم مباشر)</th>
                  <th className="px-4 py-4 font-bold">إجراءات سريعة والتمييز</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center text-sm text-gray-400"
                    >
                      لا توجد عقارات مطابقة للبحث الحالي.
                    </td>
                  </tr>
                ) : (
                  filtered.map((property) => {
                    const currentSt = property.status || "pending"
                    const stObj =
                      SELLER_STATUS_OPTIONS.find(
                        (s) => s.value === currentSt
                      ) || SELLER_STATUS_OPTIONS[0]
                    const isRowLoading =
                      pending && activePropertyId === property.id
                    const isFeaturedActive =
                      Boolean(property.is_featured) &&
                      (!property.featured_until ||
                        new Date(property.featured_until) > new Date())

                    return (
                      <tr
                        key={property.id}
                        className={`border-t border-gray-100 transition-colors ${
                          isRowLoading
                            ? "bg-emerald-50/40 opacity-70"
                            : currentSt === "deleted_by_seller"
                              ? "bg-red-50/30 hover:bg-red-50/50"
                              : isFeaturedActive
                                ? "bg-amber-50/20 hover:bg-amber-50/40"
                                : "hover:bg-gray-50/50"
                        }`}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2 font-extrabold text-[#0a1122]">
                            <span>
                              {property.project_name || "مشروع غير محدد"}
                            </span>
                            {isRowLoading && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#105C50] px-2 py-0.5 text-[10px] font-bold text-white">
                                <Loader2 className="size-3 animate-spin" />
                                جاري الحفظ...
                              </span>
                            )}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            {property.area || "—"} ·{" "}
                            {property.unit_type || "شقة"}{" "}
                            {property.size ? `· ${property.size}م²` : ""}
                          </div>
                          <div className="mt-0.5 text-[10px] text-gray-400">
                            كود: {property.id.slice(0, 8).toUpperCase()}
                          </div>
                          {renderSellerActivityBadges(property)}
                        </td>

                        <td className="px-4 py-4">
                          <div className="font-extrabold text-[#105C50]">
                            {property.paid_amount
                              ? `${Number(property.paid_amount).toLocaleString("en-US")} ج.م`
                              : "—"}
                          </div>
                          {property.willing_to_discount && (
                            <span className="mt-1 inline-block rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                              قابل للتفاوض / خصم
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-4 text-xs">
                          <div>
                            العقد:{" "}
                            <strong>
                              {property.contract_price
                                ? `${Number(property.contract_price).toLocaleString("en-US")} ج.م`
                                : "—"}
                            </strong>
                          </div>
                          <div className="mt-1 text-gray-500">
                            السوق:{" "}
                            {property.market_price
                              ? `${Number(property.market_price).toLocaleString("en-US")} ج.م`
                              : "—"}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="font-bold text-[#0a1122]">
                            {property.name}
                          </div>
                          <div
                            dir="ltr"
                            className="mt-0.5 text-right text-xs text-gray-500"
                          >
                            {property.phone}
                          </div>
                          {property.email && (
                            <div className="text-[11px] text-gray-400">
                              {property.email}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-1.5">
                            <Badge className={`w-fit ${stObj.badge}`}>
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
                              className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-xs font-bold text-[#0a1122] focus:border-[#105C50] focus:outline-none disabled:opacity-50"
                            >
                              {SELLER_STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs font-bold"
                              onClick={() => setDetailsProperty(property)}
                            >
                              <Eye className="ml-1 size-3.5" />
                              التفاصيل
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              disabled={pending}
                              onClick={() => {
                                setPromoDaysInput(property.featured_days || 14)
                                setConfirmAction({
                                  type: "promote",
                                  property,
                                  promoAction: isFeaturedActive
                                    ? "cancel"
                                    : "activate",
                                  days: property.featured_days || 14,
                                })
                              }}
                              className={`h-8 text-xs font-bold ${
                                isFeaturedActive
                                  ? "border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200"
                                  : "border-amber-200 bg-amber-50/70 text-amber-800 hover:bg-amber-100"
                              }`}
                              title="تفعيل أو إلغاء ظهور النجمة الذهبية في أول السوق"
                            >
                              <Star className="ml-1 size-3.5 fill-amber-400 text-amber-500" />
                              {isFeaturedActive ? "إلغاء التمييز" : "تمييز ⭐"}
                            </Button>

                            {currentSt !== "active" && (
                              <Button
                                size="sm"
                                disabled={pending}
                                className="h-8 bg-[#105C50] text-xs font-bold text-white hover:bg-[#0c483f]"
                                onClick={() =>
                                  setConfirmAction({
                                    type: "status",
                                    property,
                                    newStatus: "active",
                                  })
                                }
                              >
                                <Check className="ml-1 size-3.5" />
                                نشر
                              </Button>
                            )}

                            {currentSt !== "rejected" && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={pending}
                                className="h-8 text-xs font-bold text-red-600 hover:bg-red-50"
                                onClick={() =>
                                  setConfirmAction({
                                    type: "status",
                                    property,
                                    newStatus: "rejected",
                                  })
                                }
                              >
                                <X className="ml-1 size-3.5" />
                                رفض
                              </Button>
                            )}

                            <a
                              href={`https://wa.me/${String(property.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(`أهلاً أستاذ ${property.name}، معك إدارة منصة دارك بخصوص وحدتك المعروضة في مشروع (${property.project_name || "وحدتك"}).`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex h-8 items-center justify-center rounded-md bg-[#25D366] px-2.5 text-xs font-bold text-white hover:opacity-90"
                              title="تواصل واتساب"
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
                              className="inline-flex h-8 items-center justify-center rounded-md border border-gray-200 px-2 text-gray-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                              title="حذف نهائي من قاعدة البيانات"
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
        </CardContent>
      </Card>

      {/* ==================== 3. نافذة التأكيد الملمومة ==================== */}
      <Dialog
        open={Boolean(confirmAction)}
        onOpenChange={(open) => {
          if (!open) closeConfirmModal()
        }}
      >
        <DialogContent
          dir="rtl"
          className="w-[90vw] max-w-[360px] rounded-2xl p-5 sm:max-w-[400px]"
        >
          {confirmAction && (
            <>
              <DialogHeader className="text-right">
                <div className="mb-2 flex items-center gap-2.5">
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                      confirmAction.type === "delete" ||
                      (confirmAction.type === "status" &&
                        confirmAction.newStatus === "rejected")
                        ? "bg-red-100 text-red-600"
                        : confirmAction.type === "promote"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-[#105C50]"
                    }`}
                  >
                    {confirmAction.type === "delete" ? (
                      <Trash2 className="size-4" />
                    ) : confirmAction.type === "promote" ? (
                      <Star className="size-4 fill-amber-400 text-amber-600" />
                    ) : (
                      <ShieldAlert className="size-4" />
                    )}
                  </span>
                  <DialogTitle className="text-sm font-extrabold text-[#0a1122] sm:text-base">
                    {confirmAction.type === "delete"
                      ? "تأكيد الحذف النهائي من الداتابيز"
                      : confirmAction.type === "promote"
                        ? confirmAction.promoAction === "activate"
                          ? "تفعيل تمييز الوحدة (⭐)"
                          : "إلغاء تمييز الوحدة"
                        : confirmAction.newStatus === "active"
                          ? "تأكيد نشر العقار في السوق"
                          : confirmAction.newStatus === "rejected"
                            ? "تأكيد رفض العقار"
                            : "تأكيد تغيير حالة العقار"}
                  </DialogTitle>
                </div>

                <DialogDescription className="text-right text-xs leading-relaxed text-gray-600">
                  {confirmAction.type === "status" && (
                    <>
                      هل تريد تغيير حالة وحدة{" "}
                      <strong className="text-[#0a1122]">
                        "{confirmAction.property.project_name || "البائع"}"
                      </strong>{" "}
                      الخاصة بـ ({confirmAction.property.name}) من{" "}
                      <span className="font-bold">
                        ({getStatusLabel(confirmAction.property.status)})
                      </span>{" "}
                      إلى{" "}
                      <span className="font-bold text-[#105C50]">
                        ({getStatusLabel(confirmAction.newStatus)})
                      </span>
                      ؟
                    </>
                  )}

                  {confirmAction.type === "delete" && (
                    <>
                      هل أنت متأكد من مسح وحدة{" "}
                      <strong className="text-red-600">
                        "
                        {confirmAction.property.project_name ||
                          confirmAction.property.name}
                        "
                      </strong>{" "}
                      نهائياً من قاعدة البيانات؟ لا يمكن التراجع عن هذا الإجراء.
                    </>
                  )}

                  {confirmAction.type === "promote" &&
                    (confirmAction.promoAction === "activate" ? (
                      <>
                        اختر عدد أيام التمييز لوحدة{" "}
                        <strong className="text-[#0a1122]">
                          "{confirmAction.property.project_name || "البائع"}"
                        </strong>{" "}
                        لتظهر بشارة النجمة الذهبية (⭐) في أول صفحة الفرص والبحث:
                      </>
                    ) : (
                      <>
                        هل تريد إلغاء التمييز وإزالة النجمة الذهبية عن وحدة{" "}
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
                        onClick={() => {
                          setPromoDaysInput(d)
                          setConfirmAction({
                            ...confirmAction,
                            days: d,
                          })
                        }}
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
                      placeholder="اكتب سبب الرفض أو الملاحظات للبائع (اختياري)..."
                      className="min-h-[70px] rounded-xl text-xs"
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
                    (confirmAction.type === "status" &&
                      confirmAction.newStatus === "rejected")
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-[#105C50] hover:bg-[#0c483f]"
                  }`}
                >
                  {pending ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <Loader2 className="size-3.5 animate-spin" />
                      جاري الحفظ...
                    </span>
                  ) : (
                    "تأكيد التنفيذ"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ==================== 4. نافذة عرض تفاصيل الوحدة والمستندات المرفوعة ==================== */}
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
                <DialogTitle className="text-base font-extrabold sm:text-lg">
                  تفاصيل الوحدة: {detailsProperty.project_name || "وحدة عقارية"}
                </DialogTitle>
                <DialogDescription className="text-right text-xs">
                  جميع البيانات المالية والفنية والمستندات المرفوعة بواسطة البائع (
                  {detailsProperty.name}).
                </DialogDescription>
              </DialogHeader>

              {renderSellerActivityBadges(detailsProperty)}

              <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-3.5 text-xs">
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
                    نوع الوحدة
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
                    سعر العقد الأصلي
                  </span>
                  <strong className="text-[#0a1122]">
                    {Number(detailsProperty.contract_price || 0).toLocaleString(
                      "en-US"
                    )}{" "}
                    ج.م
                  </strong>
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400">
                    المدفوع (المطلوب كاش)
                  </span>
                  <strong className="text-[#105C50]">
                    {Number(detailsProperty.paid_amount || 0).toLocaleString(
                      "en-US"
                    )}{" "}
                    ج.م
                  </strong>
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400">
                    سعر السوق التقديري
                  </span>
                  <strong className="text-[#0a1122]">
                    {Number(detailsProperty.market_price || 0).toLocaleString(
                      "en-US"
                    )}{" "}
                    ج.م
                  </strong>
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400">
                    القسط والمدة المتبقية
                  </span>
                  <strong className="text-[#0a1122]">
                    {Number(
                      detailsProperty.installment_amount || 0
                    ).toLocaleString("en-US")}{" "}
                    ج.م ({detailsProperty.years_left || 0} سنوات)
                  </strong>
                </div>
              </div>

              {/* قسم معاينة المستندات المرفوعة من المالك */}
              {(() => {
                const uploadedDocs = getUploadedDocsList(
                  detailsProperty.documents
                )
                return (
                  <div className="mt-3 rounded-xl border border-gray-200 p-3.5 text-right text-xs">
                    <p className="mb-2 font-extrabold text-[#0a1122]">
                      📄 مستندات التحقق المرفوعة ({uploadedDocs.length}/4):
                    </p>
                    {uploadedDocs.length === 0 ? (
                      <p className="text-[11px] text-gray-400">
                        لم يقم المالك برفع مستندات العقد أو الإيصالات بعد.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {uploadedDocs.map((doc) => (
                          <div
                            key={doc.key}
                            className="flex items-center justify-between rounded-lg bg-emerald-50/70 px-3 py-2"
                          >
                            <div>
                              <p className="font-bold text-[#0a1122]">
                                {doc.label}
                              </p>
                              <p className="text-[10px] text-gray-500">
                                {doc.name}{" "}
                                {doc.uploadedAt ? `· ${doc.uploadedAt}` : ""}
                              </p>
                            </div>
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg bg-[#105C50] px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#0c483f]"
                            >
                              <span>فتح المستند</span>
                              <ExternalLink className="size-3" />
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })()}

              {detailsProperty.description && (
                <div className="mt-2 rounded-xl border border-gray-200 p-3 text-right text-xs leading-relaxed text-gray-600">
                  <strong>وصف البائع:</strong> {detailsProperty.description}
                </div>
              )}

              <DialogFooter className="mt-4 flex flex-row items-center justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDetailsProperty(null)}
                  className="h-9 flex-1 rounded-xl text-xs font-bold sm:flex-none"
                >
                  إغلاق
                </Button>
                {detailsProperty.status !== "active" && (
                  <Button
                    disabled={pending}
                    className="h-9 flex-1 rounded-xl bg-[#105C50] text-xs font-bold text-white hover:bg-[#0c483f] sm:flex-none"
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
                    اعتماد ونشر الوحدة
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}