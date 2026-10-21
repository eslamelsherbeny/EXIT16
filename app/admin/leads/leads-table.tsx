"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Flame,
  Globe,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  ShieldAlert,
  Trash2,
  Wallet,
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
import { getCurrencySymbol, useTranslation } from "@/lib/i18n"
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
  country?: string | null
  country_code?: string | null
  currency_code?: string | null
  status?: string | null
  created_at: string
}

const STATUS_BADGE_CLS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-amber-100 text-amber-800",
  matched: "bg-purple-100 text-purple-800",
  closed: "bg-emerald-100 text-emerald-800",
  archived: "bg-gray-100 text-gray-600",
}

function getLeadCountryCode(lead: BuyerLead): string {
  return (lead.country_code || lead.country || "EG").trim().toUpperCase()
}

function parseLeadDetails(lead: BuyerLead, t: any) {
  const areasRaw = Array.isArray(lead.preferred_areas)
    ? lead.preferred_areas.join("، ")
    : lead.preferred_areas || ""
  const planRaw = lead.payment_plan || ""

  const isUnitLead =
    areasRaw.includes("🎯") ||
    areasRaw.includes("U-") ||
    planRaw.includes("مهتم بوحدة")

  const codeMatch = `${areasRaw} ${planRaw}`.match(/U-[A-Z0-9]+/i)
  const unitCode = codeMatch ? codeMatch[0] : null

  let readinessBadge: { text: string; className: string } | null = null
  if (planRaw.includes("خلال أسبوع") || planRaw.toLowerCase().includes("week")) {
    readinessBadge = {
      text: t.readiness.week,
      className: "bg-red-100 text-red-700 border border-red-200",
    }
  } else if (
    planRaw.includes("شهر لـ 3 شهور") ||
    planRaw.includes("خلال شهر") ||
    planRaw.toLowerCase().includes("month")
  ) {
    readinessBadge = {
      text: t.readiness.month,
      className: "bg-amber-100 text-amber-800 border border-amber-200",
    }
  } else if (
    planRaw.includes("يجمع معلومات") ||
    planRaw.toLowerCase().includes("gather")
  ) {
    readinessBadge = {
      text: t.readiness.info,
      className: "bg-slate-100 text-slate-700 border border-slate-200",
    }
  }

  let customerNotes = ""
  if (planRaw.includes("أسئلة العميل:")) {
    customerNotes = planRaw.split("أسئلة العميل:")[1]?.trim() || ""
  } else if (planRaw.includes("ملاحظات:")) {
    customerNotes = planRaw.split("ملاحظات:")[1]?.trim() || ""
  }

  const cleanTargetUnit = areasRaw
    .replace("🎯 مهتم بوحدة:", "")
    .replace("🎯", "")
    .trim()

  return {
    isUnitLead,
    unitCode,
    cleanTargetUnit: cleanTargetUnit || t.allAreas,
    readinessBadge,
    customerNotes,
  }
}

type ConfirmLeadAction =
  | {
      type: "status"
      lead: BuyerLead
      newStatus: string
    }
  | {
      type: "delete"
      lead: BuyerLead
    }

export default function LeadsClientTable({ leads }: { leads: BuyerLead[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t: dict, locale, dir } = useTranslation()
  const t = dict.admin.leads

  const adminCountries = [
    { code: "ALL", label: t.countries.ALL, flag: "🌍" },
    { code: "EG", label: t.countries.EG, flag: "🇪🇬" },
    { code: "RU", label: t.countries.RU, flag: "🇷🇺" },
    { code: "GE", label: t.countries.GE, flag: "🇬🇪" },
    { code: "AE", label: t.countries.AE, flag: "🇦🇪" },
  ]

  const leadStatuses = [
    { value: "new", label: t.statuses.new, badge: STATUS_BADGE_CLS.new },
    {
      value: "contacted",
      label: t.statuses.contacted,
      badge: STATUS_BADGE_CLS.contacted,
    },
    {
      value: "matched",
      label: t.statuses.matched,
      badge: STATUS_BADGE_CLS.matched,
    },
    {
      value: "closed",
      label: t.statuses.closed,
      badge: STATUS_BADGE_CLS.closed,
    },
    {
      value: "archived",
      label: t.statuses.archived,
      badge: STATUS_BADGE_CLS.archived,
    },
  ]

  const getStatusLabel = (stVal?: string | null) => {
    const key = stVal || "new"
    return (
      leadStatuses.find((s) => s.value === key)?.label || t.statuses.new
    )
  }

  const [countryFilter, setCountryFilter] = useState<string>("ALL")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [leadTypeFilter, setLeadTypeFilter] = useState<
    "all" | "unit_leads" | "general"
  >("all")
  const [confirmAction, setConfirmAction] = useState<ConfirmLeadAction | null>(
    null
  )
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null)
  const [notice, setNotice] = useState<{
    text: string
    isError?: boolean
  } | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    const typeParam = searchParams.get("type")
    const countryParam = searchParams.get("country")

    if (typeParam === "unit_leads" || typeParam === "general") {
      setLeadTypeFilter(typeParam)
    } else {
      setLeadTypeFilter("all")
    }

    if (countryParam) {
      setCountryFilter(countryParam.toUpperCase())
    }
  }, [searchParams])

  function closeConfirmModal() {
    if (pending) return
    setConfirmAction(null)
  }

  function executeConfirmedAction() {
    if (!confirmAction) return
    setNotice(null)
    const target = confirmAction.lead
    setActiveLeadId(target.id)

    startTransition(async () => {
      try {
        if (confirmAction.type === "status") {
          const res = await updateBuyerLeadStatusAction(
            target.id,
            confirmAction.newStatus
          )
          if (res.success) {
            const stLabel = getStatusLabel(confirmAction.newStatus)
            setNotice({
              text: `${t.noticeStatusUpdatedPrefix} "${target.name}" ${t.noticeStatusUpdatedTo} (${stLabel}).`,
            })
            router.refresh()
          } else {
            setNotice({
              text: res.error || t.noticeStatusError,
              isError: true,
            })
          }
        } else if (confirmAction.type === "delete") {
          const res = await deleteBuyerLeadAction(target.id)
          if (res.success) {
            setNotice({
              text: `${t.noticeDeletedPrefix} "${target.name}".`,
            })
            router.refresh()
          } else {
            setNotice({
              text: res.error || t.noticeDeleteError,
              isError: true,
            })
          }
        }
      } finally {
        setConfirmAction(null)
        setActiveLeadId(null)
      }
    })
  }

  const countryLeads =
    countryFilter === "ALL"
      ? leads
      : leads.filter((l) => getLeadCountryCode(l) === countryFilter)

  const unitLeadsCount = countryLeads.filter(
    (l) => parseLeadDetails(l, t).isUnitLead
  ).length
  const generalLeadsCount = countryLeads.length - unitLeadsCount

  const filtered = countryLeads.filter((l) => {
    const parsed = parseLeadDetails(l, t)
    if (leadTypeFilter === "unit_leads" && !parsed.isUnitLead) return false
    if (leadTypeFilter === "general" && parsed.isUnitLead) return false

    const st = l.status || "new"
    if (statusFilter !== "all" && st !== statusFilter) return false

    if (search.trim()) {
      const areas = Array.isArray(l.preferred_areas)
        ? l.preferred_areas.join(" ")
        : l.preferred_areas || ""
      const match =
        `${l.name} ${l.phone} ${l.email || ""} ${areas} ${l.payment_plan || ""}`
          .toLowerCase()
          .includes(search.toLowerCase())
      if (!match) return false
    }
    return true
  })

  const activeCountryObj =
    adminCountries.find((c) => c.code === countryFilter) || adminCountries[0]

  return (
    <div dir={dir} className="text-start">
      {/* 1. شريط العنوان وتوضيح الدولة المدمج */}
      <div className="mb-4 rounded-xl border border-gray-200/85 bg-white p-4 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Globe className="size-4 text-[#105C50]" />
              <h2 className="text-sm font-extrabold text-[#0a1122] sm:text-base">
                {countryFilter === "ALL"
                  ? `${t.titleAll} (${countryLeads.length})`
                  : `${t.titleCountryPrefix} ${activeCountryObj.label} ${activeCountryObj.flag} (${countryLeads.length})`}
              </h2>
            </div>
            <p className="mt-1 text-[11px] text-gray-500">{t.filterHint}</p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {adminCountries.map((c) => {
              const isSelected = c.code === countryFilter
              const countInC =
                c.code === "ALL"
                  ? leads.length
                  : leads.filter((l) => getLeadCountryCode(l) === c.code).length

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

      {/* 2. شريط البحث والفلاتر المدمج بدون زحام */}
      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-gray-200/80 bg-white p-3 shadow-2xs">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          {/* أزرار نوع الطلب: الكل / حاجزي الوحدات / بحث عام */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setLeadTypeFilter("all")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                leadTypeFilter === "all"
                  ? "bg-[#0a1122] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {t.typeAll} ({countryLeads.length})
            </button>

            <button
              type="button"
              onClick={() => setLeadTypeFilter("unit_leads")}
              className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                leadTypeFilter === "unit_leads"
                  ? "bg-orange-600 text-white shadow-2xs"
                  : "bg-orange-50 text-orange-800 hover:bg-orange-100"
              }`}
            >
              <Flame className="size-3.5 shrink-0" />
              <span>
                {t.typeUnitLeads} ({unitLeadsCount})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setLeadTypeFilter("general")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                leadTypeFilter === "general"
                  ? "bg-[#105C50] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {t.typeGeneral} ({generalLeadsCount})
            </button>
          </div>

          {/* مربع البحث */}
          <div className="relative w-full sm:max-w-xs sm:flex-1">
            <Search className="pointer-events-none absolute top-1/2 end-3 size-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="h-9 w-full rounded-lg border border-gray-200 ps-3 pe-9 text-xs font-semibold focus:border-[#105C50] focus:outline-none"
            />
          </div>
        </div>

        {/* فلاتر حالة المتابعة */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-gray-100 pt-2.5">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
              statusFilter === "all"
                ? "bg-[#105C50] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t.statusAll}
          </button>
          {leadStatuses.map((st) => (
            <button
              key={st.value}
              type="button"
              onClick={() => setStatusFilter(st.value)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                statusFilter === st.value
                  ? "bg-[#105C50] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* ==================== 1. عرض الموبايل ==================== */}
      <div className="space-y-3 md:hidden">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-xs text-gray-400">
            {t.emptyState}
          </div>
        ) : (
          filtered.map((lead) => {
            const currentSt = lead.status || "new"
            const stObj =
              leadStatuses.find((s) => s.value === currentSt) || leadStatuses[0]
            const parsed = parseLeadDetails(lead, t)
            const typesText = Array.isArray(lead.unit_types)
              ? lead.unit_types.join("، ")
              : "—"
            const isCardLoading = pending && activeLeadId === lead.id
            const firstLetter = lead.name.trim().charAt(0) || "M"
            const leadCur = getCurrencySymbol(getLeadCountryCode(lead), locale)

            const waText = parsed.isUnitLead
              ? `${t.waUnitLeadPrefix} ${lead.name}، ${t.waUnitLeadMiddle} (${parsed.cleanTargetUnit}). ${t.waUnitLeadSuffix}`
              : `${t.waGeneralPrefix} ${lead.name}، ${t.waGeneralMiddle} (${parsed.cleanTargetUnit}). ${t.waGeneralSuffix}`

            return (
              <div
                key={lead.id}
                className={`relative overflow-hidden rounded-xl border bg-white p-3.5 shadow-2xs transition ${
                  isCardLoading
                    ? "border-[#105C50] opacity-75"
                    : parsed.isUnitLead
                      ? "border-orange-300"
                      : "border-gray-200/90"
                }`}
              >
                {isCardLoading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/65 backdrop-blur-[1px]">
                    <div className="flex items-center gap-2 rounded-full bg-[#0a1122] px-3.5 py-1.5 text-xs font-bold text-white shadow-md">
                      <Loader2 className="size-3.5 animate-spin text-emerald-400" />
                      <span>{t.updatingCard}</span>
                    </div>
                  </div>
                )}

                {parsed.isUnitLead && (
                  <div className="-mx-3.5 -mt-3.5 mb-2.5 flex items-center justify-between border-b border-orange-200/80 bg-orange-50/90 px-3.5 py-1.5 text-[11px] font-extrabold text-orange-900">
                    <span className="flex items-center gap-1">
                      <Flame className="size-3.5 fill-orange-500 text-orange-600" />
                      <span>{t.priorityUnitBadge}</span>
                    </span>
                    {parsed.unitCode && (
                      <span className="rounded bg-white px-2 py-0.5 font-mono text-[10px] font-bold text-orange-800">
                        {parsed.unitCode}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
                        parsed.isUnitLead
                          ? "bg-orange-100 text-orange-800"
                          : "bg-[#105C50]/10 text-[#105C50]"
                      }`}
                    >
                      {firstLetter}
                    </div>
                    <div>
                      <h3 className="text-xs font-extrabold text-[#0a1122] sm:text-sm">
                        {lead.name}
                      </h3>
                      <div
                        dir="ltr"
                        className="mt-0.5 flex items-center gap-1 font-mono text-[11px] font-semibold text-gray-500"
                      >
                        <Phone className="size-3 text-gray-400" />
                        <span>{lead.phone}</span>
                      </div>
                    </div>
                  </div>

                  <Badge className={`shrink-0 text-[10px] ${stObj.badge}`}>
                    {stObj.label}
                  </Badge>
                </div>

                {parsed.readinessBadge && (
                  <div className="mt-2">
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${parsed.readinessBadge.className}`}
                    >
                      {parsed.readinessBadge.text}
                    </span>
                  </div>
                )}

                <div className="mt-2.5 grid grid-cols-2 gap-2 rounded-lg border border-gray-100 bg-gray-50/80 p-2.5 text-xs">
                  <div>
                    <span className="flex items-center gap-1 text-[10px] text-gray-400">
                      <Wallet className="size-3 text-[#105C50]" />
                      <span>
                        {parsed.isUnitLead
                          ? t.unitCashLabel
                          : t.availableCashLabel}
                      </span>
                    </span>
                    <strong className="mt-0.5 block text-xs font-extrabold text-[#105C50] tabular-nums">
                      <span dir="ltr">
                        {Number(
                          lead.available_cash || lead.budget || 0
                        ).toLocaleString("en-US")}
                      </span>{" "}
                      {leadCur}
                    </strong>
                  </div>

                  <div className="border-s border-gray-200/70 ps-2.5">
                    <span className="block text-[10px] text-gray-400">
                      {parsed.isUnitLead ? t.unitInstLabel : t.maxInstLabel}
                    </span>
                    <strong className="mt-0.5 block text-xs font-extrabold text-[#0a1122] tabular-nums">
                      <span dir="ltr">
                        {Number(lead.max_installment || 0).toLocaleString(
                          "en-US"
                        )}
                      </span>{" "}
                      {leadCur}
                    </strong>
                  </div>
                </div>

                <div className="mt-2 space-y-1 rounded-lg bg-gray-50 p-2.5 text-[11px]">
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex shrink-0 items-center gap-1 text-gray-400">
                      {parsed.isUnitLead ? (
                        <Building2 className="size-3 text-orange-600" />
                      ) : (
                        <MapPin className="size-3" />
                      )}
                      <span>
                        {parsed.isUnitLead
                          ? t.targetUnitLabel
                          : t.targetAreasLabel}
                      </span>
                    </span>
                    <strong className="text-end font-bold text-[#0a1122]">
                      {parsed.cleanTargetUnit}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-400">{t.typeAndDetails}</span>
                    <span className="font-semibold text-gray-700">
                      {typesText}{" "}
                      {lead.min_rooms
                        ? `· +${lead.min_rooms} ${t.roomsSuffix}`
                        : ""}
                    </span>
                  </div>

                  {parsed.customerNotes && (
                    <div className="mt-1.5 rounded-md border border-amber-200/80 bg-amber-50/70 p-2 text-[10.5px] text-amber-900">
                      <span className="font-extrabold">
                        {t.customerQuestion}{" "}
                      </span>
                      <span>{parsed.customerNotes}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-1 text-[10.5px]">
                    <span className="flex items-center gap-1 text-gray-400">
                      <Calendar className="size-3" />
                      <span>{t.requestDate}</span>
                    </span>
                    <span dir="ltr" className="font-medium text-gray-600">
                      {new Date(lead.created_at).toLocaleDateString("en-GB")}
                    </span>
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
                          lead,
                          newStatus: nextSt,
                        })
                      }
                    }}
                    className="h-8 w-full rounded-lg border border-gray-200 bg-gray-50/70 px-2.5 text-xs font-bold text-[#0a1122] focus:border-[#105C50] focus:outline-none"
                  >
                    {leadStatuses.map((st) => (
                      <option key={st.value} value={st.value}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-2.5 flex items-center gap-1.5 border-t border-gray-100 pt-2.5">
                  <a
                    href={`https://wa.me/${String(lead.phone).replace(/\D/g, "")}?text=${encodeURIComponent(waText)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#25D366] px-3 text-xs font-bold text-white transition hover:opacity-90"
                  >
                    <MessageCircle className="size-3.5" />
                    <span>{t.whatsappBtn}</span>
                  </a>

                  {parsed.isUnitLead && (
                    <Link
                      href="/admin/properties"
                      className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2.5 text-xs font-bold text-[#0a1122] hover:bg-gray-100"
                    >
                      <Building2 className="size-3.5 text-[#105C50]" />
                      <span>{t.unitBtn}</span>
                    </Link>
                  )}

                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      setConfirmAction({
                        type: "delete",
                        lead,
                      })
                    }
                    className="inline-flex h-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 px-2.5 text-xs font-bold text-red-600 transition hover:bg-red-100"
                    title={t.deleteTitle}
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
        <table className="w-full border-separate border-spacing-y-2.5 text-start text-xs">
          <thead>
            <tr className="text-[11px] font-extrabold text-gray-500">
              <th className="px-4 py-2">{t.colBuyer}</th>
              <th className="px-4 py-2">{t.colFinancials}</th>
              <th className="px-4 py-2">{t.colTarget}</th>
              <th className="px-4 py-2">{t.colDate}</th>
              <th className="px-4 py-2">{t.colStatus}</th>
              <th className="px-4 py-2">{t.colActions}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="rounded-xl border border-gray-200 bg-white px-5 py-8 text-center text-xs text-gray-400"
                >
                  {t.emptyState}
                </td>
              </tr>
            ) : (
              filtered.map((lead) => {
                const currentSt = lead.status || "new"
                const stObj =
                  leadStatuses.find((s) => s.value === currentSt) ||
                  leadStatuses[0]
                const parsed = parseLeadDetails(lead, t)
                const typesText = Array.isArray(lead.unit_types)
                  ? lead.unit_types.join("، ")
                  : "—"
                const isRowLoading = pending && activeLeadId === lead.id
                const leadCur = getCurrencySymbol(
                  getLeadCountryCode(lead),
                  locale
                )

                const waText = parsed.isUnitLead
                  ? `${t.waUnitLeadPrefix} ${lead.name}، ${t.waUnitLeadMiddle} (${parsed.cleanTargetUnit}). ${t.waUnitLeadSuffix}`
                  : `${t.waGeneralPrefix} ${lead.name}، ${t.waGeneralMiddle} (${parsed.cleanTargetUnit}). ${t.waGeneralSuffix}`

                const cellBorderCls = parsed.isUnitLead
                  ? "border-y border-orange-300 first:border-s last:border-e bg-orange-50/15 hover:bg-orange-50/30"
                  : "border-y border-gray-200/90 first:border-s last:border-e bg-white hover:bg-gray-50/60"

                return (
                  <tr
                    key={lead.id}
                    className={`shadow-2xs transition-all ${
                      isRowLoading ? "opacity-60" : ""
                    }`}
                  >
                    <td
                      className={`rounded-s-xl px-4 py-3.5 align-middle ${cellBorderCls}`}
                    >
                      <div className="flex flex-wrap items-center gap-1.5 font-extrabold text-[#0a1122]">
                        <span className="text-[13px]">{lead.name}</span>
                        {parsed.isUnitLead ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-extrabold text-orange-800">
                            <Flame className="size-3 fill-orange-500 text-orange-600" />
                            {t.unitBookingTag} {parsed.unitCode || ""}
                          </span>
                        ) : (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                            {t.generalSearchTag}
                          </span>
                        )}
                        {isRowLoading && (
                          <Loader2 className="size-3.5 animate-spin text-[#105C50]" />
                        )}
                      </div>
                      <div
                        dir="ltr"
                        className="mt-0.5 text-start font-mono text-[11px] font-semibold text-gray-600"
                      >
                        {lead.phone}
                      </div>
                      {lead.email && (
                        <div className="truncate text-[10.5px] text-gray-400">
                          {lead.email}
                        </div>
                      )}
                    </td>

                    <td
                      className={`border-s border-s-gray-100 px-4 py-3.5 align-middle ${cellBorderCls}`}
                    >
                      <div className="text-[13px] font-extrabold text-[#105C50] tabular-nums">
                        <span className="text-[11px] font-semibold text-gray-400">
                          {t.cashShort}{" "}
                        </span>
                        <span dir="ltr">
                          {Number(
                            lead.available_cash || lead.budget || 0
                          ).toLocaleString("en-US")}
                        </span>{" "}
                        {leadCur}
                      </div>
                      <div className="mt-1 text-[11px] text-gray-500 tabular-nums">
                        <span>{t.instShort} </span>
                        <span dir="ltr">
                          {Number(lead.max_installment || 0).toLocaleString(
                            "en-US"
                          )}
                        </span>{" "}
                        {leadCur}
                      </div>
                    </td>

                    <td
                      className={`max-w-[290px] border-s border-s-gray-100 px-4 py-3.5 align-middle ${cellBorderCls}`}
                    >
                      <div className="text-xs font-extrabold text-[#0a1122]">
                        {parsed.cleanTargetUnit}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500">
                        <span>
                          {typesText}{" "}
                          {lead.min_rooms
                            ? `· +${lead.min_rooms} ${t.roomsSuffix}`
                            : ""}
                        </span>
                        {parsed.readinessBadge && (
                          <span
                            className={`rounded px-1.5 py-0.5 text-[9.5px] font-bold ${parsed.readinessBadge.className}`}
                          >
                            {parsed.readinessBadge.text}
                          </span>
                        )}
                      </div>
                      {parsed.customerNotes && (
                        <div className="mt-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10.5px] text-amber-900">
                          <strong>{t.customerQuestion}</strong>{" "}
                          {parsed.customerNotes}
                        </div>
                      )}
                    </td>

                    <td
                      dir="ltr"
                      className={`border-s border-s-gray-100 px-4 py-3.5 align-middle font-mono text-[11px] text-gray-500 ${cellBorderCls}`}
                    >
                      {new Date(lead.created_at).toLocaleDateString("en-GB")}
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
                                lead,
                                newStatus: nextSt,
                              })
                            }
                          }}
                          className="h-8 rounded-lg border border-gray-200 bg-gray-50/70 px-2 text-[11px] font-bold text-[#0a1122] focus:border-[#105C50] focus:bg-white focus:outline-none disabled:opacity-50"
                        >
                          {leadStatuses.map((st) => (
                            <option key={st.value} value={st.value}>
                              {st.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>

                    <td
                      className={`rounded-e-xl border-s border-s-gray-100 px-4 py-3.5 align-middle ${cellBorderCls}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`https://wa.me/${String(lead.phone).replace(/\D/g, "")}?text=${encodeURIComponent(waText)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#25D366] px-2.5 text-[11px] font-bold text-white transition hover:opacity-90"
                        >
                          <MessageCircle className="size-3.5" />
                          <span>{t.whatsappBtn}</span>
                        </a>

                        <button
                          type="button"
                          disabled={pending}
                          onClick={() =>
                            setConfirmAction({
                              type: "delete",
                              lead,
                            })
                          }
                          className="inline-flex h-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 px-2 text-red-600 transition hover:bg-red-100 disabled:opacity-50"
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

      {/* ==================== 3. نافذة التأكيد ==================== */}
      <Dialog
        open={Boolean(confirmAction)}
        onOpenChange={(open) => {
          if (!open) closeConfirmModal()
        }}
      >
        <DialogContent
          dir={dir}
          className="w-[90vw] max-w-[360px] rounded-2xl p-5 sm:max-w-[390px]"
        >
          {confirmAction && (
            <>
              <DialogHeader className="text-start">
                <div className="mb-1.5 flex items-center gap-2">
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
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
                  <DialogTitle className="text-sm font-extrabold text-[#0a1122]">
                    {confirmAction.type === "delete"
                      ? t.modalDeleteTitle
                      : t.modalStatusTitle}
                  </DialogTitle>
                </div>

                <DialogDescription className="text-start text-xs leading-relaxed text-gray-600">
                  {confirmAction.type === "status" ? (
                    <>
                      {t.modalStatusDescPrefix}{" "}
                      <strong className="text-[#0a1122]">
                        "{confirmAction.lead.name}"
                      </strong>{" "}
                      {t.modalStatusDescTo}{" "}
                      <span className="font-bold text-[#105C50]">
                        ({getStatusLabel(confirmAction.newStatus)})
                      </span>
                      ؟
                    </>
                  ) : (
                    <>
                      {t.modalDeleteDescPrefix}{" "}
                      <strong className="text-red-600">
                        "{confirmAction.lead.name}"
                      </strong>{" "}
                      {t.modalDeleteDescSuffix}
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
                      {t.savingRow}
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
