"use client"

import { useState, useTransition } from "react"
import { MessageCircle, Search, Trash2 } from "lucide-react"
import { AdminMobileNav } from "../layout"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { deleteBuyerLeadAction, updateBuyerLeadStatusAction } from "../actions"

export type BuyerLead = {
  id: string
  name: string
  phone: string
  email?: string | null
  available_cash: number | null
  max_installment: number | null
  budget: number | null
  payment_plan?: string | null
  unit_types?: string[] | null
  min_rooms?: number | null
  delivery_status?: string | null
  preferred_areas: string[] | string | null
  status?: string | null
  created_at: string
}

const LEAD_STATUSES = [
  { value: "new", label: "طلب جديد", badge: "bg-blue-100 text-blue-800" },
  { value: "contacted", label: "تم التواصل", badge: "bg-amber-100 text-amber-800" },
  { value: "matched", label: "تم ترشيح وحدات", badge: "bg-purple-100 text-purple-800" },
  { value: "closed", label: "تم الشراء / التعاقد", badge: "bg-emerald-100 text-emerald-800" },
  { value: "archived", label: "مؤرشف", badge: "bg-gray-100 text-gray-600" },
]

export default function LeadsClientTable({ leads }: { leads: BuyerLead[] }) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [notice, setNotice] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleStatusChange(leadId: string, status: string) {
    setNotice(null)
    startTransition(async () => {
      const res = await updateBuyerLeadStatusAction(leadId, status)
      if (res.success) {
        setNotice("تم تحديث حالة طلب المشتري بنجاح.")
      } else {
        setNotice(res.error || "تعذر التحديث.")
      }
    })
  }

  function handleDelete(leadId: string) {
    if (!confirm("هل أنت متأكد من حذف طلب الشراء هذا؟")) return
    startTransition(async () => {
      const res = await deleteBuyerLeadAction(leadId)
      if (res.success) setNotice("تم حذف طلب الشراء.")
    })
  }

  const filtered = leads.filter((l) => {
    const st = l.status || "new"
    if (statusFilter !== "all" && st !== statusFilter) return false
    if (search.trim()) {
      const areas = Array.isArray(l.preferred_areas)
        ? l.preferred_areas.join(" ")
        : l.preferred_areas || ""
      const match = `${l.name} ${l.phone} ${l.email || ""} ${areas}`
        .toLowerCase()
        .includes(search.toLowerCase())
      if (!match) return false
    }
    return true
  })

  return (
    <div className="mx-auto max-w-7xl">
      <AdminMobileNav />

      <div className="mb-6">
        <p className="text-xs font-extrabold text-[#105C50]">إدارة المشترين</p>
        <h2 className="mt-1 text-2xl font-extrabold text-[#0a1122] sm:text-3xl">
          طلبات الشراء ({leads.length})
        </h2>
        <p className="mt-1 text-xs text-gray-500 sm:text-sm">
          تابع ميزانيات المشترين، حدث حالة المتابعة، وتواصل معهم عبر واتساب بضغطة زر.
        </p>
      </div>

      {notice && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-bold text-emerald-800">
          {notice}
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm">
        <div className="relative min-w-[250px] flex-1">
          <Search className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث باسم المشتري، رقم الهاتف، أو المنطقة المطلوبة..."
            className="h-10 w-full rounded-xl border border-gray-200 pr-10 pl-4 text-xs focus:border-[#105C50] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`rounded-xl px-3 py-2 text-xs font-bold ${
              statusFilter === "all"
                ? "bg-[#105C50] text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            الكل
          </button>
          {LEAD_STATUSES.map((st) => (
            <button
              key={st.value}
              type="button"
              onClick={() => setStatusFilter(st.value)}
              className={`rounded-xl px-3 py-2 text-xs font-bold ${
                statusFilter === st.value
                  ? "bg-[#105C50] text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      <Card className="border-gray-200/80 bg-white shadow-sm">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-base font-extrabold">
            قائمة طلبات المشترين ({filtered.length})
          </CardTitle>
          <CardDescription className="text-xs">
            تظهر هنا القدرة المالية الكاملة للمشتري (الكاش المتاح + القسط الشهري + المناطق).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-right text-xs sm:text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-5 py-4 font-bold">اسم المشتري</th>
                  <th className="px-5 py-4 font-bold">الكاش المتاح / الميزانية</th>
                  <th className="px-5 py-4 font-bold">المناطق ونوع الوحدة</th>
                  <th className="px-5 py-4 font-bold">تاريخ الطلب</th>
                  <th className="px-5 py-4 font-bold">حالة المتابعة</th>
                  <th className="px-5 py-4 font-bold">الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-10 text-center text-gray-400"
                    >
                      لا توجد طلبات شراء مطابقة.
                    </td>
                  </tr>
                ) : (
                  filtered.map((lead) => {
                    const currentSt = lead.status || "new"
                    const stObj =
                      LEAD_STATUSES.find((s) => s.value === currentSt) ||
                      LEAD_STATUSES[0]
                    const areasText = Array.isArray(lead.preferred_areas)
                      ? lead.preferred_areas.join("، ")
                      : lead.preferred_areas || "—"
                    const typesText = Array.isArray(lead.unit_types)
                      ? lead.unit_types.join("، ")
                      : "—"

                    return (
                      <tr
                        key={lead.id}
                        className="border-t border-gray-100 hover:bg-gray-50/50"
                      >
                        <td className="px-5 py-4">
                          <div className="font-extrabold text-[#0a1122]">
                            {lead.name}
                          </div>
                          <div
                            dir="ltr"
                            className="mt-0.5 text-right text-xs text-gray-500"
                          >
                            {lead.phone}
                          </div>
                          {lead.email && (
                            <div className="text-[11px] text-gray-400">
                              {lead.email}
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-extrabold text-[#105C50]">
                            كاش:{" "}
                            {Number(
                              lead.available_cash || lead.budget || 0
                            ).toLocaleString("en-US")}{" "}
                            ج.م
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            أقصى قسط:{" "}
                            {Number(lead.max_installment || 0).toLocaleString(
                              "en-US"
                            )}{" "}
                            ج.م
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-semibold text-[#0a1122]">
                            {areasText}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            {typesText}{" "}
                            {lead.min_rooms ? `· +${lead.min_rooms} غرف` : ""}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-xs text-gray-500">
                          {new Date(lead.created_at).toLocaleDateString("ar-EG")}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1.5">
                            <Badge className={`w-fit ${stObj.badge}`}>
                              {stObj.label}
                            </Badge>
                            <select
                              disabled={pending}
                              value={currentSt}
                              onChange={(e) =>
                                handleStatusChange(lead.id, e.target.value)
                              }
                              className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-xs font-bold text-[#0a1122] focus:border-[#105C50] focus:outline-none"
                            >
                              {LEAD_STATUSES.map((st) => (
                                <option key={st.value} value={st.value}>
                                  {st.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <a
                              href={`https://wa.me/${String(lead.phone).replace(/\D/g, "")}?text=${encodeURIComponent(`أهلاً أستاذ ${lead.name}، معك فريق مستشاري منصة دارك العقارية بخصوص طلب الشراء الخاص بك في منطقة (${areasText}). لدينا فرص ممتازة بدون أوفر تناسب ميزانيتك.`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-2 text-xs font-bold text-white transition hover:opacity-90"
                            >
                              <MessageCircle className="size-3.5" />
                              <span>واتساب</span>
                            </a>

                            <button
                              type="button"
                              disabled={pending}
                              onClick={() => handleDelete(lead.id)}
                              className="rounded-lg border border-gray-200 p-2 text-gray-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                              title="حذف"
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
    </div>
  )
}