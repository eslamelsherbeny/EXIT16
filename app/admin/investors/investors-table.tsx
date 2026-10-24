"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  Briefcase,
  Calendar,
  CalendarPlus,
  CheckCircle2,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  PhoneCall,
  Search,
  ShieldAlert,
  Trash2,
  TrendingUp,
  Wallet,
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
import { useTranslation } from "@/lib/i18n"
import { deleteInvestorAction, updateInvestorStatusAction } from "../../../actions/admin-actions"

export type InvestorRow = {
  id: string
  name: string
  phone: string
  email: string | null
  company?: string | null
  country?: string | null
  investor_type: string | null
  years_experience?: string | number | null
  preferred_sectors: string[] | null
  investment_range: string | null
  exact_amount?: number | null
  preferred_structure?: string | null
  holding_period?: string | null
  participation_level?: string | null
  target_roi?: string | number | null
  notes?: string | null
  status?: string | null
  created_at: string
}

type ConfirmInvestorAction =
  | {
      type: "status"
      investor: InvestorRow
      newStatus: string
    }
  | {
      type: "delete"
      investor: InvestorRow
    }

export default function InvestorsClientTable({
  investors,
}: {
  investors: InvestorRow[]
}) {
  const router = useRouter()
  const { t: dict, dir } = useTranslation()
  const t = dict.admin.investorsAdmin

  const investorStatuses = [
    { value: "new", label: t.statuses.new, badge: "bg-blue-100 text-blue-800" },
    {
      value: "contacted",
      label: t.statuses.contacted,
      badge: "bg-amber-100 text-amber-800",
    },
    {
      value: "meeting",
      label: t.statuses.meeting,
      badge: "bg-purple-100 text-purple-800",
    },
    {
      value: "partner",
      label: t.statuses.partner,
      badge: "bg-emerald-100 text-emerald-800",
    },
  ]

  function getInvestorStatusLabel(status: string | null | undefined) {
    const st = status || "new"
    return investorStatuses.find((s) => s.value === st)?.label || st
  }

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [confirmAction, setConfirmAction] =
    useState<ConfirmInvestorAction | null>(null)
  const [activeInvestorId, setActiveInvestorId] = useState<string | null>(null)
  const [notice, setNotice] = useState<{
    text: string
    isError?: boolean
  } | null>(null)
  const [pending, startTransition] = useTransition()

  function closeConfirmModal() {
    if (pending) return
    setConfirmAction(null)
  }

  function executeConfirmedAction() {
    if (!confirmAction) return
    setNotice(null)
    const target = confirmAction.investor
    setActiveInvestorId(target.id)

    startTransition(async () => {
      try {
        if (confirmAction.type === "status") {
          const res = await updateInvestorStatusAction(
            target.id,
            confirmAction.newStatus
          )
          if (res.success) {
            const stLabel = getInvestorStatusLabel(confirmAction.newStatus)
            setNotice({
              text: `${t.statusUpdatedSuccess} ("${target.name}" → ${stLabel})`,
            })
            router.refresh()
          } else {
            setNotice({
              text: res.error || t.statusUpdateError,
              isError: true,
            })
          }
        } else if (confirmAction.type === "delete") {
          const res = await deleteInvestorAction(target.id)
          if (res.success) {
            setNotice({
              text: `${t.deletedSuccess} ("${target.name}")`,
            })
            router.refresh()
          } else {
            setNotice({
              text: res.error || t.deleteError,
              isError: true,
            })
          }
        }
      } finally {
        setConfirmAction(null)
        setActiveInvestorId(null)
      }
    })
  }

  const filtered = investors.filter((inv) => {
    const st = inv.status || "new"
    if (statusFilter !== "all" && st !== statusFilter) return false
    if (search.trim()) {
      const sectors = Array.isArray(inv.preferred_sectors)
        ? inv.preferred_sectors.join(" ")
        : ""
      const match =
        `${inv.name} ${inv.phone} ${inv.email || ""} ${inv.company || ""} ${inv.investor_type || ""} ${sectors}`
          .toLowerCase()
          .includes(search.toLowerCase())
      if (!match) return false
    }
    return true
  })

  return (
    <div dir={dir} className="text-start">
      {/* الهيدر العلوي */}
      <div className="mb-5">
        <p className="text-xs font-extrabold text-[#105C50]">{t.eyebrow}</p>
        <h2 className="mt-1 text-xl font-extrabold text-[#0a1122] sm:text-3xl">
          {t.title} ({investors.length})
        </h2>
        <p className="mt-1 text-xs text-gray-500 sm:text-sm">{t.subtitle}</p>
      </div>

      {/* شريط الإشعارات الواضح بعد كل عملية */}
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

      {/* شريط البحث والفلترة */}
      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-gray-200/80 bg-white p-3.5 shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-4">
        <div className="relative w-full sm:min-w-[250px] sm:flex-1">
          <Search className="pointer-events-none absolute top-1/2 end-3.5 size-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="h-10 w-full rounded-xl border border-gray-200 ps-4 pe-10 text-xs focus:border-[#105C50] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`rounded-xl px-3 py-1.5 text-[11px] font-bold transition sm:py-2 sm:text-xs ${
              statusFilter === "all"
                ? "bg-[#105C50] text-white shadow-xs"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t.allFilter}
          </button>
          {investorStatuses.map((st) => (
            <button
              key={st.value}
              type="button"
              onClick={() => setStatusFilter(st.value)}
              className={`rounded-xl px-3 py-1.5 text-[11px] font-bold transition sm:py-2 sm:text-xs ${
                statusFilter === st.value
                  ? "bg-[#105C50] text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* ==================== 1. عرض الموبايل ==================== */}
      <div className="space-y-3.5 md:hidden">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-xs text-gray-400">
            {t.emptyText}
          </div>
        ) : (
          filtered.map((investor) => {
            const currentSt = investor.status || "new"
            const stObj =
              investorStatuses.find((s) => s.value === currentSt) ||
              investorStatuses[0]
            const sectorsText =
              investor.preferred_sectors?.join("، ") ||
              investor.investor_type ||
              "—"
            const isCardLoading = pending && activeInvestorId === investor.id
            const firstLetter = investor.name.trim().charAt(0) || "I"

            return (
              <div
                key={investor.id}
                className={`relative overflow-hidden rounded-2xl border bg-white p-4 shadow-xs transition ${
                  isCardLoading
                    ? "border-[#105C50] opacity-75"
                    : "border-gray-200/90"
                }`}
              >
                {isCardLoading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/65 backdrop-blur-[1px]">
                    <div className="flex items-center gap-2 rounded-full bg-[#0a1122] px-4 py-2 text-xs font-bold text-white shadow-md">
                      <Loader2 className="size-4 animate-spin text-emerald-400" />
                      <span>{t.updatingText}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#105C50]/10 text-sm font-extrabold text-[#105C50]">
                      {firstLetter}
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-[#0a1122]">
                        {investor.name}
                      </h3>
                      <p className="mt-0.5 text-[11px] font-medium text-gray-500">
                        {investor.investor_type || t.defaultType}
                        {investor.company ? ` · ${investor.company}` : ""}
                      </p>
                    </div>
                  </div>

                  <Badge className={`shrink-0 text-[10px] ${stObj.badge}`}>
                    {stObj.label}
                  </Badge>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2.5 rounded-xl border border-gray-100 bg-gray-50/80 p-3 text-xs">
                  <div>
                    <span className="flex items-center gap-1 text-[10px] text-gray-400">
                      <Wallet className="size-3 text-[#105C50]" />
                      <span>{t.targetAmount}</span>
                    </span>
                    <strong className="mt-0.5 block text-sm font-extrabold text-[#105C50]">
                      {investor.investment_range ?? "—"}
                    </strong>
                  </div>

                  <div className="border-s border-gray-200/70 ps-2.5">
                    <span className="flex items-center gap-1 text-[10px] text-gray-400">
                      <TrendingUp className="size-3 text-gray-400" />
                      <span>{t.targetRoi}</span>
                    </span>
                    <strong className="mt-0.5 block text-sm font-extrabold text-[#0a1122]">
                      {investor.target_roi
                        ? `${investor.target_roi}`
                        : t.notSpecified}
                    </strong>
                  </div>
                </div>

                <div className="mt-2.5 space-y-1.5 rounded-xl bg-gray-50 p-3 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex shrink-0 items-center gap-1 text-gray-400">
                      <Briefcase className="size-3.5" />
                      <span>{t.sectors}</span>
                    </span>
                    <strong className="text-end font-bold text-[#0a1122]">
                      {sectorsText}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1 text-gray-400">
                      <Phone className="size-3.5" />
                      <span>{t.phone}</span>
                    </span>
                    <span dir="ltr" className="font-semibold text-[#0a1122]">
                      {investor.phone}
                    </span>
                  </div>

                  {investor.email && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1 text-gray-400">
                        <Mail className="size-3.5" />
                        <span>{t.email}</span>
                      </span>
                      <span
                        dir="ltr"
                        className="truncate font-medium text-gray-600"
                      >
                        {investor.email}
                      </span>
                    </div>
                  )}

                  {investor.notes && (
                    <div className="border-t border-gray-200/60 pt-1.5 text-[11px] leading-relaxed text-gray-600">
                      <strong className="text-[#0a1122]">{t.notes} </strong>
                      {investor.notes}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1 text-gray-400">
                      <Calendar className="size-3.5" />
                      <span>{t.date}</span>
                    </span>
                    <span dir="ltr" className="font-medium text-gray-600">
                      {new Date(investor.created_at).toLocaleDateString("en-GB")}
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="mb-1 block text-[11px] font-bold text-gray-500">
                    {t.changeStatusLabel}
                  </label>
                  <select
                    disabled={pending}
                    value={currentSt}
                    onChange={(e) => {
                      const nextSt = e.target.value
                      if (nextSt !== currentSt) {
                        setConfirmAction({
                          type: "status",
                          investor,
                          newStatus: nextSt,
                        })
                      }
                    }}
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-[#0a1122] focus:border-[#105C50] focus:outline-none"
                  >
                    {investorStatuses.map((st) => (
                      <option key={st.value} value={st.value}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-gray-100 pt-3">
                  <Button
                    size="sm"
                    disabled={pending}
                    onClick={() =>
                      setConfirmAction({
                        type: "status",
                        investor,
                        newStatus: "contacted",
                      })
                    }
                    className="h-9 flex-1 rounded-xl bg-[#105C50] text-xs font-bold text-white hover:bg-[#0c483f]"
                  >
                    <PhoneCall className="me-1 size-3.5" />
                    {t.contactedBtn}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() =>
                      setConfirmAction({
                        type: "status",
                        investor,
                        newStatus: "meeting",
                      })
                    }
                    className="h-9 flex-1 rounded-xl text-xs font-bold"
                  >
                    <CalendarPlus className="me-1 size-3.5" />
                    {t.meetingBtn}
                  </Button>

                  <a
                    href={`https://wa.me/${String(investor.phone || "").replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 items-center justify-center rounded-xl bg-[#25D366] px-3 text-white hover:opacity-90"
                    title={t.whatsappTitle}
                  >
                    <MessageCircle className="size-4" />
                  </a>

                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      setConfirmAction({
                        type: "delete",
                        investor,
                      })
                    }
                    className="inline-flex h-9 items-center justify-center rounded-xl border border-red-200 bg-red-50/60 px-2.5 text-red-600 transition hover:bg-red-100"
                    title={t.deleteTitle}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ==================== 2. عرض الكمبيوتر ==================== */}
      <Card className="hidden rounded-xl border-gray-200/80 bg-white shadow-sm md:block">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-base font-extrabold">
            {t.allOrdersTitle} ({filtered.length})
          </CardTitle>
          <CardDescription className="text-xs">
            {t.allOrdersDesc}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs sm:text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-5 py-4 font-bold">{t.colInvestor}</th>
                  <th className="px-5 py-4 font-bold">{t.colContact}</th>
                  <th className="px-5 py-4 font-bold">{t.colSectors}</th>
                  <th className="px-5 py-4 font-bold">{t.colAmount}</th>
                  <th className="px-5 py-4 font-bold">{t.colStatus}</th>
                  <th className="px-5 py-4 font-bold">{t.colActions}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center text-gray-400"
                    >
                      {t.emptyText}
                    </td>
                  </tr>
                ) : (
                  filtered.map((investor) => {
                    const currentSt = investor.status || "new"
                    const stObj =
                      investorStatuses.find((s) => s.value === currentSt) ||
                      investorStatuses[0]
                    const isRowLoading =
                      pending && activeInvestorId === investor.id

                    return (
                      <tr
                        key={investor.id}
                        className={`border-t border-gray-100 transition-colors ${
                          isRowLoading
                            ? "bg-emerald-50/40 opacity-70"
                            : "hover:bg-gray-50/50"
                        }`}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 font-extrabold text-[#0a1122]">
                            <span>{investor.name}</span>
                            {isRowLoading && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#105C50] px-2 py-0.5 text-[10px] font-bold text-white">
                                <Loader2 className="size-3 animate-spin" />
                                {t.savingBtn}
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 text-[11px] text-gray-400">
                            {investor.investor_type || t.defaultType}
                            {investor.company ? ` · ${investor.company}` : ""}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div
                            dir="ltr"
                            className="text-start font-semibold text-[#0a1122]"
                          >
                            {investor.phone}
                          </div>
                          <div className="text-xs text-gray-400">
                            {investor.email ?? "—"}
                          </div>
                        </td>

                        <td className="max-w-xs px-5 py-4">
                          <div className="font-semibold text-[#0a1122]">
                            {investor.preferred_sectors?.join("، ") ||
                              investor.investor_type ||
                              "—"}
                          </div>
                          {investor.target_roi ? (
                            <div className="mt-0.5 text-[11px] text-[#105C50]">
                              {t.targetRoi}: {investor.target_roi}
                            </div>
                          ) : null}
                          {investor.notes ? (
                            <div className="mt-1 line-clamp-2 text-[11px] text-gray-500">
                              {investor.notes}
                            </div>
                          ) : null}
                        </td>

                        <td className="px-5 py-4 font-extrabold text-[#105C50]">
                          {investor.investment_range ?? "—"}
                        </td>

                        <td className="px-5 py-4">
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
                                    investor,
                                    newStatus: nextSt,
                                  })
                                }
                              }}
                              className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-xs font-bold text-[#0a1122] focus:border-[#105C50] focus:outline-none disabled:opacity-50"
                            >
                              {investorStatuses.map((st) => (
                                <option key={st.value} value={st.value}>
                                  {st.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              size="sm"
                              disabled={pending}
                              onClick={() =>
                                setConfirmAction({
                                  type: "status",
                                  investor,
                                  newStatus: "contacted",
                                })
                              }
                              className="h-8 rounded-lg bg-[#105C50] text-xs font-bold text-white hover:bg-[#0c483f]"
                            >
                              <PhoneCall className="me-1 size-3.5" />
                              {t.contactedBtn}
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              disabled={pending}
                              onClick={() =>
                                setConfirmAction({
                                  type: "status",
                                  investor,
                                  newStatus: "meeting",
                                })
                              }
                              className="h-8 rounded-lg text-xs font-bold"
                            >
                              <CalendarPlus className="me-1 size-3.5" />
                              {t.meetingBtn}
                            </Button>

                            <a
                              href={`https://wa.me/${String(investor.phone || "").replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex h-8 items-center justify-center rounded-lg bg-[#25D366] px-2.5 text-white hover:opacity-90"
                              title={t.whatsappTitle}
                            >
                              <MessageCircle className="size-3.5" />
                            </a>

                            <button
                              type="button"
                              disabled={pending}
                              onClick={() =>
                                setConfirmAction({
                                  type: "delete",
                                  investor,
                                })
                              }
                              className="rounded-lg border border-gray-200 p-2 text-gray-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                              title={t.deleteTitle}
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

      {/* ==================== 3. نافذة التأكيد ==================== */}
      <Dialog
        open={Boolean(confirmAction)}
        onOpenChange={(open) => {
          if (!open) closeConfirmModal()
        }}
      >
        <DialogContent
          dir={dir}
          className="w-[90vw] max-w-[360px] rounded-2xl p-5 text-start sm:max-w-[400px]"
        >
          {confirmAction && (
            <>
              <DialogHeader className="text-start">
                <div className="mb-2 flex items-center gap-2.5">
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                      confirmAction.type === "delete"
                        ? "bg-red-100 text-red-600"
                        : "bg-emerald-100 text-[#105C50]"
                    }`}
                  >
                    {confirmAction.type === "delete" ? (
                      <Trash2 className="size-4" />
                    ) : (
                      <ShieldAlert className="size-4" />
                    )}
                  </span>
                  <DialogTitle className="text-sm font-extrabold text-[#0a1122] sm:text-base">
                    {confirmAction.type === "delete"
                      ? t.confirmDeleteTitle
                      : t.confirmStatusTitle}
                  </DialogTitle>
                </div>

                <DialogDescription className="text-start text-xs leading-relaxed text-gray-600">
                  {confirmAction.type === "status" ? (
                    <>
                      {t.confirmStatusDescPrefix}{" "}
                      <strong className="text-[#0a1122]">
                        "{confirmAction.investor.name}"
                      </strong>{" "}
                      {t.fromWord}{" "}
                      <span className="font-bold">
                        ({getInvestorStatusLabel(confirmAction.investor.status)})
                      </span>{" "}
                      {t.toWord}{" "}
                      <span className="font-bold text-[#105C50]">
                        ({getInvestorStatusLabel(confirmAction.newStatus)})
                      </span>
                      ؟
                    </>
                  ) : (
                    <>
                      {t.confirmDeleteDescPrefix}{" "}
                      <strong className="text-red-600">
                        "{confirmAction.investor.name}"
                      </strong>{" "}
                      {t.confirmDeleteDescSuffix}
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>

              <DialogFooter className="mt-4 flex flex-row items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={closeConfirmModal}
                  className="h-9 flex-1 rounded-xl text-xs font-bold sm:flex-none"
                >
                  {t.cancelBtn}
                </Button>
                <Button
                  type="button"
                  disabled={pending}
                  onClick={executeConfirmedAction}
                  className={`h-9 flex-1 rounded-xl text-xs font-bold text-white sm:flex-none ${
                    confirmAction.type === "delete"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-[#105C50] hover:bg-[#0c483f]"
                  }`}
                >
                  {pending ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <Loader2 className="size-3.5 animate-spin" />
                      {t.savingBtn}
                    </span>
                  ) : (
                    t.confirmBtn
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
