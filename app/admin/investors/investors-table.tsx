"use client"

import { useState, useTransition } from "react"
import { CalendarPlus, MessageCircle, PhoneCall, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { deleteInvestorAction, updateInvestorStatusAction } from "../actions"

export type InvestorRow = {
  id: string
  name: string
  phone: string
  email: string | null
  investor_type: string | null
  years_experience?: number | null
  preferred_sectors: string[] | null
  investment_range: string | null
  preferred_structure?: string | null
  participation_level?: string | null
  target_roi?: number | null
  status?: string | null
  created_at: string
}

const INVESTOR_STATUSES = [
  { value: "new", label: "جديد", badge: "bg-blue-100 text-blue-800" },
  { value: "contacted", label: "تم التواصل", badge: "bg-amber-100 text-amber-800" },
  { value: "meeting", label: "تم تحديد اجتماع", badge: "bg-purple-100 text-purple-800" },
  { value: "partner", label: "شريك معتمد", badge: "bg-emerald-100 text-emerald-800" },
]

export default function InvestorsClientTable({
  investors,
}: {
  investors: InvestorRow[]
}) {
  const [notice, setNotice] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function changeStatus(id: string, status: string) {
    setNotice(null)
    startTransition(async () => {
      const res = await updateInvestorStatusAction(id, status)
      if (res.success) {
        setNotice("تم تحديث حالة المستثمر بنجاح.")
      } else {
        setNotice(res.error || "تعذر التحديث.")
      }
    })
  }

  function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد من حذف طلب المستثمر؟")) return
    startTransition(async () => {
      const res = await deleteInvestorAction(id)
      if (res.success) setNotice("تم حذف الطلب.")
    })
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-extrabold text-[#105C50]">الشراكات الاستراتيجية</p>
        <h2 className="mt-1 text-2xl font-extrabold text-[#0a1122] sm:text-3xl">
          طلبات المستثمرين ({investors.length})
        </h2>
        <p className="mt-1 text-xs text-gray-500 sm:text-sm">
          حوّل طلبات الاستثمار إلى شراكات حقيقية وتابع حالة كل مستثمر.
        </p>
      </div>

      {notice && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-bold text-emerald-800">
          {notice}
        </div>
      )}

      <Card className="rounded-xl border-gray-200/80 bg-white shadow-sm">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-base font-extrabold">كل الطلبات</CardTitle>
          <CardDescription className="text-xs">
            تواصل مع المستثمرين وحدد مواعيد الاجتماعات مباشرة.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-right text-xs sm:text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-5 py-4 font-bold">المستثمر</th>
                  <th className="px-5 py-4 font-bold">التواصل</th>
                  <th className="px-5 py-4 font-bold">فئة الاستثمار والقطاعات</th>
                  <th className="px-5 py-4 font-bold">المبلغ المستهدف</th>
                  <th className="px-5 py-4 font-bold">الحالة</th>
                  <th className="px-5 py-4 font-bold">الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {investors.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center text-gray-400"
                    >
                      لا توجد طلبات مستثمرين حتى الآن.
                    </td>
                  </tr>
                ) : (
                  investors.map((investor) => {
                    const currentSt = investor.status || "new"
                    const stObj =
                      INVESTOR_STATUSES.find((s) => s.value === currentSt) ||
                      INVESTOR_STATUSES[0]

                    return (
                      <tr
                        key={investor.id}
                        className="border-t border-gray-100 transition-colors hover:bg-gray-50/50"
                      >
                        <td className="px-5 py-4">
                          <div className="font-extrabold text-[#0a1122]">
                            {investor.name}
                          </div>
                          <div className="mt-0.5 text-[11px] text-gray-400">
                            {investor.investor_type || "مستثمر عقاري"}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div
                            dir="ltr"
                            className="text-right font-semibold text-[#0a1122]"
                          >
                            {investor.phone}
                          </div>
                          <div className="text-xs text-gray-400">
                            {investor.email ?? "—"}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div>
                            {investor.preferred_sectors?.join("، ") ||
                              investor.investor_type ||
                              "—"}
                          </div>
                          {investor.target_roi ? (
                            <div className="mt-0.5 text-[11px] text-[#105C50]">
                              العائد المستهدف: {investor.target_roi}%
                            </div>
                          ) : null}
                        </td>

                        <td className="px-5 py-4 font-extrabold text-[#105C50]">
                          {investor.investment_range ?? "—"}
                        </td>

                        <td className="px-5 py-4">
                          <Badge className={stObj.badge}>{stObj.label}</Badge>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              size="sm"
                              disabled={pending}
                              onClick={() => changeStatus(investor.id, "contacted")}
                              className="h-8 rounded-lg bg-[#105C50] text-xs font-bold text-white hover:bg-[#0c483f]"
                            >
                              <PhoneCall className="ml-1 size-3.5" />
                              تم التواصل
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              disabled={pending}
                              onClick={() => changeStatus(investor.id, "meeting")}
                              className="h-8 rounded-lg text-xs font-bold"
                            >
                              <CalendarPlus className="ml-1 size-3.5" />
                              اجتماع
                            </Button>

                            <a
                              href={`https://wa.me/${String(investor.phone || "").replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex h-8 items-center justify-center rounded-lg bg-[#25D366] px-2.5 text-white hover:opacity-90"
                            >
                              <MessageCircle className="size-3.5" />
                            </a>

                            <button
                              type="button"
                              disabled={pending}
                              onClick={() => handleDelete(investor.id)}
                              className="rounded-lg border border-gray-200 p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
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
