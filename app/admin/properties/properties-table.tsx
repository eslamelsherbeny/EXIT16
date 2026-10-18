"use client"

import { useState, useTransition } from "react"
import {
  Check,
  Eye,
  Info,
  MessageCircle,
  Search,
  Trash2,
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
  name: string
  phone: string
  email?: string | null
  status?: string | null
  admin_note?: string | null
  created_at: string
}

const SELLER_STATUS_OPTIONS = [
  { value: "pending", label: "١. في انتظار المراجعة", badge: "bg-amber-100 text-amber-800" },
  { value: "under_review", label: "٢. جاري مراجعة المستندات", badge: "bg-blue-100 text-blue-800" },
  { value: "active", label: "٣. معتمد ومعروض في السوق", badge: "bg-emerald-100 text-emerald-800" },
  { value: "offer_received", label: "٤. يوجد عرض شراء", badge: "bg-purple-100 text-purple-800" },
  { value: "transferring", label: "٥. مرحلة نقل التعاقد", badge: "bg-indigo-100 text-indigo-800" },
  { value: "sold", label: "٦. تمت عملية البيع", badge: "bg-teal-700 text-white" },
  { value: "rejected", label: "٧. مرفوض", badge: "bg-red-100 text-red-800" },
]

export default function PropertiesTable({
  properties,
}: {
  properties: SellRequest[]
}) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selected, setSelected] = useState<SellRequest | null>(null)
  const [modalMode, setModalMode] = useState<"approve" | "reject" | "details" | null>(null)
  const [reason, setReason] = useState("")
  const [notice, setNotice] = useState<{ text: string; isError?: boolean } | null>(null)
  const [pending, startTransition] = useTransition()

  function closeModal() {
    setModalMode(null)
    setSelected(null)
    setReason("")
  }

  function handleStatusChange(propertyId: string, newStatus: string, rejectReason?: string) {
    setNotice(null)
    startTransition(async () => {
      const res = await updatePropertyStatusAction(propertyId, newStatus, rejectReason)
      if (res.success) {
        const stLabel =
          SELLER_STATUS_OPTIONS.find((s) => s.value === newStatus)?.label || newStatus
        setNotice({ text: `تم تحديث حالة الوحدة إلى "${stLabel}" بنجاح وإشعار البائع.` })
        closeModal()
      } else {
        setNotice({ text: res.error || "حدث خطأ أثناء التحديث.", isError: true })
      }
    })
  }

  function handleDelete(propertyId: string) {
    if (!confirm("هل أنت متأكد من حذف طلب هذه الوحدة نهائياً؟")) return
    setNotice(null)
    startTransition(async () => {
      const res = await deletePropertyAction(propertyId)
      if (res.success) {
        setNotice({ text: "تم حذف طلب الوحدة بنجاح." })
      } else {
        setNotice({ text: res.error || "تعذر الحذف.", isError: true })
      }
    })
  }

  const filtered = properties.filter((p) => {
    const currentStatus = p.status || "pending"
    if (statusFilter !== "all" && currentStatus !== statusFilter) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      const textMatch = `${p.id} ${p.project_name || ""} ${p.area || ""} ${p.name || ""} ${p.phone || ""}`
        .toLowerCase()
        .includes(q)
      if (!textMatch) return false
    }
    return true
  })

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold text-[#105C50]">إدارة المخزون</p>
          <h2 className="mt-1 text-2xl font-extrabold text-[#0a1122] sm:text-3xl">
            إدارة عقارات البائعين ({properties.length})
          </h2>
          <p className="mt-1 text-xs text-gray-500 sm:text-sm">
            تحكم في حالة كل وحدة، اعتمد النشر، أو تواصل مباشرة مع البائع.
          </p>
        </div>
      </div>

      <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 sm:text-sm">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p>
          <strong>تنبيه أمني:</strong> جميع أرقام هواتف البائعين مخفية تلقائياً عن واجهة الموقع العامة لحماية عمولة المنصة، وتظهر هنا لفريق الإدارة فقط.
        </p>
      </div>

      {notice && (
        <div
          role="status"
          className={`mb-5 rounded-xl border p-4 text-xs font-bold sm:text-sm ${
            notice.isError
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* شريط البحث والفلترة السريعة */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm">
        <div className="relative min-w-[260px] flex-1">
          <Search className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث باسم المشروع، المنطقة، اسم البائع، أو رقم الموبايل..."
            className="h-10 w-full rounded-xl border border-gray-200 pr-10 pl-4 text-xs focus:border-[#105C50] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "all", label: "الكل" },
            { id: "pending", label: "بانتظار المراجعة" },
            { id: "active", label: "معروضة بالسوق" },
            { id: "offer_received", label: "عليها عرض" },
            { id: "transferring", label: "نقل تعاقد" },
            { id: "sold", label: "مباعة" },
            { id: "rejected", label: "مرفوضة" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                statusFilter === tab.id
                  ? "bg-[#105C50] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <Card className="border-gray-200/80 bg-white shadow-sm">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-base font-extrabold">
            قائمة الوحدات ({filtered.length})
          </CardTitle>
          <CardDescription className="text-xs">
            يمكنك تغيير مرحلة الوحدة مباشرة من القائمة المنسدلة أو فتح التفاصيل الكاملة.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-right text-xs sm:text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-4 font-bold">المشروع / الوحدة</th>
                  <th className="px-4 py-4 font-bold">المطلوب كاش (المدفوع)</th>
                  <th className="px-4 py-4 font-bold">سعر العقد / السوق</th>
                  <th className="px-4 py-4 font-bold">بيانات البائع</th>
                  <th className="px-4 py-4 font-bold">حالة الطلب (تحكم مباشر)</th>
                  <th className="px-4 py-4 font-bold">إجراءات سريعة</th>
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
                      SELLER_STATUS_OPTIONS.find((s) => s.value === currentSt) ||
                      SELLER_STATUS_OPTIONS[0]

                    return (
                      <tr
                        key={property.id}
                        className="border-t border-gray-100 transition-colors hover:bg-gray-50/50"
                      >
                        <td className="px-4 py-4">
                          <div className="font-extrabold text-[#0a1122]">
                            {property.project_name || "مشروع غير محدد"}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            {property.area || "—"} · {property.unit_type || "شقة"}{" "}
                            {property.size ? `· ${property.size}م²` : ""}
                          </div>
                          <div className="mt-0.5 text-[10px] text-gray-400">
                            كود: {property.id.slice(0, 8).toUpperCase()}
                          </div>
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
                              onChange={(e) =>
                                handleStatusChange(property.id, e.target.value)
                              }
                              className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-xs font-bold text-[#0a1122] focus:border-[#105C50] focus:outline-none"
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
                              onClick={() => {
                                setSelected(property)
                                setModalMode("details")
                              }}
                            >
                              <Eye className="ml-1 size-3.5" />
                              التفاصيل
                            </Button>

                            {currentSt !== "active" && (
                              <Button
                                size="sm"
                                disabled={pending}
                                className="h-8 bg-[#105C50] text-xs font-bold text-white hover:bg-[#0c483f]"
                                onClick={() => {
                                  setSelected(property)
                                  setModalMode("approve")
                                }}
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
                                onClick={() => {
                                  setSelected(property)
                                  setModalMode("reject")
                                }}
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
                              onClick={() => handleDelete(property.id)}
                              className="inline-flex h-8 items-center justify-center rounded-md border border-gray-200 px-2 text-gray-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                              title="حذف الطلب"
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

      {/* نافذة المعاينة والتأكيد */}
      <Dialog
        open={Boolean(modalMode)}
        onOpenChange={(open) => !open && closeModal()}
      >
        <DialogContent dir="rtl" className="max-w-lg">
          {modalMode === "details" && selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg font-extrabold">
                  تفاصيل الوحدة: {selected.project_name || "وحدة عقارية"}
                </DialogTitle>
                <DialogDescription>
                  جميع البيانات المالية والفنية المسجلة بواسطة البائع ({selected.name}).
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-4 text-xs">
                <div>
                  <span className="text-gray-400">المنطقة:</span>{" "}
                  <strong className="text-[#0a1122]">{selected.area || "—"}</strong>
                </div>
                <div>
                  <span className="text-gray-400">المطور:</span>{" "}
                  <strong className="text-[#0a1122]">
                    {selected.developer_name || "—"}
                  </strong>
                </div>
                <div>
                  <span className="text-gray-400">نوع الوحدة:</span>{" "}
                  <strong className="text-[#0a1122]">
                    {selected.unit_type || "—"} ({selected.size || 0} م²)
                  </strong>
                </div>
                <div>
                  <span className="text-gray-400">الغرف / الحمامات:</span>{" "}
                  <strong className="text-[#0a1122]">
                    {selected.rooms || 0} غرف · {selected.bathrooms || 0} حمام
                  </strong>
                </div>
                <div>
                  <span className="text-gray-400">سعر العقد الأصلي:</span>{" "}
                  <strong className="text-[#0a1122]">
                    {Number(selected.contract_price || 0).toLocaleString("en-US")} ج.م
                  </strong>
                </div>
                <div>
                  <span className="text-gray-400">المدفوع (المطلوب كاش):</span>{" "}
                  <strong className="text-[#105C50]">
                    {Number(selected.paid_amount || 0).toLocaleString("en-US")} ج.م
                  </strong>
                </div>
                <div>
                  <span className="text-gray-400">سعر السوق التقديري:</span>{" "}
                  <strong className="text-[#0a1122]">
                    {Number(selected.market_price || 0).toLocaleString("en-US")} ج.م
                  </strong>
                </div>
                <div>
                  <span className="text-gray-400">القسط والمدة المتبقية:</span>{" "}
                  <strong className="text-[#0a1122]">
                    {Number(selected.installment_amount || 0).toLocaleString("en-US")} ج.م ({selected.years_left || 0} سنوات)
                  </strong>
                </div>
              </div>

              {selected.description && (
                <div className="rounded-xl border border-gray-200 p-3 text-xs leading-relaxed text-gray-600">
                  <strong>وصف البائع:</strong> {selected.description}
                </div>
              )}

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={closeModal}>
                  إغلاق
                </Button>
                <Button
                  disabled={pending}
                  className="bg-[#105C50] text-white hover:bg-[#0c483f]"
                  onClick={() => handleStatusChange(selected.id, "active")}
                >
                  اعتماد ونشر الوحدة
                </Button>
              </DialogFooter>
            </>
          )}

          {(modalMode === "approve" || modalMode === "reject") && selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-extrabold">
                  {modalMode === "approve"
                    ? "تأكيد نشر العقار في السوق"
                    : "رفض طلب العقار"}
                </DialogTitle>
                <DialogDescription>
                  {modalMode === "approve"
                    ? `هل أنت متأكد من نشر وحدة "${selected.project_name || "البائع"}" ليراها المشترون وإرسال إيميل تأكيد للبائع؟`
                    : "يمكنك كتابة سبب الرفض وسيتم إرساله للبائع عبر البريد الإلكتروني لتعديل طلبه."}
                </DialogDescription>
              </DialogHeader>

              {modalMode === "reject" && (
                <Textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="اكتب سبب الرفض أو الملاحظات للبائع (اختياري)..."
                />
              )}

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={closeModal}>
                  إلغاء
                </Button>
                <Button
                  disabled={pending}
                  onClick={() =>
                    handleStatusChange(
                      selected.id,
                      modalMode === "approve" ? "active" : "rejected",
                      reason
                    )
                  }
                  className={
                    modalMode === "reject"
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "bg-[#105C50] text-white hover:bg-[#0c483f]"
                  }
                >
                  {pending
                    ? "جاري الحفظ..."
                    : modalMode === "approve"
                      ? "نعم، انشر العقار الآن"
                      : "تأكيد الرفض"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
