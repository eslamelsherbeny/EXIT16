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
  UserCheck,
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
  country_code?: string | null
  currency_code?: string | null
  status?: string | null
  created_at: string
}

function parseLeadDetails(lead: BuyerLead) {
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
  if (planRaw.includes("خلال أسبوع")) {
    readinessBadge = {
      text: "⚡ جاهز كاش خلال أسبوع",
      className: "bg-red-100 text-red-700 border border-red-200",
    }
  } else if (planRaw.includes("شهر لـ 3 شهور") || planRaw.includes("خلال شهر")) {
    readinessBadge = {
      text: "⏱️ جاهز خلال شهر - 3 شهور",
      className: "bg-amber-100 text-amber-800 border border-amber-200",
    }
  } else if (planRaw.includes("يجمع معلومات")) {
    readinessBadge = {
      text: "🔍 يجمع معلومات ويقارن",
      className: "bg-slate-100 text-slate-700 border border-slate-200",
    }
  }

  let customerNotes = ""
  if (planRaw.includes("أسئلة العميل:")) {
    customerNotes = planRaw.split("أسئلة العميل:")[1]?.trim() || ""
  } else if (planRaw.includes("ملاحظات:")) {
    customerNotes = planRaw.split("ملاحظات:")[1]?.trim() || ""
  }

  const cleanTargetUnit = areasRaw.replace("🎯 مهتم بوحدة:", "").trim()

  return {
    isUnitLead,
    unitCode,
    cleanTargetUnit: cleanTargetUnit || "جميع المناطق",
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
  const t = dict.admin.leadsAdmin

  const adminCountries = [
    { code: "ALL", label: dict.admin.dashboard.countries.ALL, flag: "🌍" },
    { code: "EG", label: dict.admin.dashboard.countries.EG, flag: "🇪🇬" },
    { code: "RU", label: dict.admin.dashboard.countries.RU, flag: "🇷🇺" },
    { code: "GE", label: dict.admin.dashboard.countries.GE, flag: "🇬🇪" },
    { code: "AE", label: dict.admin.dashboard.countries.AE, flag: "🇦🇪" },
  ]

  const leadStatuses = [
    { value: "new", label: t.statuses.new, badge: "bg-blue-100 text-blue-800" },
    {
      value: "contacted",
      label: t.statuses.contacted,
      badge: "bg-amber-100 text-amber-800",
    },
    {
      value: "matched",
      label: t.statuses.matched,
      badge: "bg-purple-100 text-purple-800",
    },
    {
      value: "closed",
      label: t.statuses.closed,
      badge: "bg-emerald-100 text-emerald-800",
    },
    {
      value: "archived",
      label: t.statuses.archived,
      badge: "bg-gray-100 text-gray-600",
    },
  ]

  function getLeadStatusLabel(status: string | null | undefined) {
    const st = status || "new"
    return leadStatuses.find((s) => s.value === st)?.label || st
  }

  function getLeadCurrency(countryCode?: string | null) {
    return getCurrencySymbol(countryCode || "EG", locale)
  }

  const [countryFilter, setCountryFilter] = useState<string>("ALL")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [leadTypeFilter, setLeadTypeFilter] = useState<
    "all" | "unit_leads" | "general"
  >("all")
  const [focusedLeadId, setFocusedLeadId] = useState<string | null>(null)
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
    const leadIdParam = searchParams.get("leadId")

    if (leadIdParam) {
      setFocusedLeadId(leadIdParam)
    } else {
      setFocusedLeadId(null)
    }

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
            const stLabel = getLeadStatusLabel(confirmAction.newStatus)
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
          const res = await deleteBuyerLeadAction(target.id)
          if (res.success) {
            setNotice({
              text: `${t.deletedSuccess} ("${target.name}")`,
            })
            if (focusedLeadId === target.id) setFocusedLeadId(null)
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
        setActiveLeadId(null)
      }
    })
  }

  const countryLeads =
    countryFilter === "ALL"
      ? leads
      : leads.filter((l) => (l.country_code || "EG") === countryFilter)

  const unitLeadsCount = countryLeads.filter(
    (l) => parseLeadDetails(l).isUnitLead
  ).length
  const generalLeadsCount = countryLeads.length - unitLeadsCount

  // إذا ضغط الأدمن على شخص محدد من الرئيسية، نعرض هذا الشخص وحده مباشرة أمامه
  const filtered = countryLeads.filter((l) => {
    if (focusedLeadId) {
      return l.id === focusedLeadId
    }

    const parsed = parseLeadDetails(l)
    if (leadTypeFilter === "unit_leads" && !parsed.isUnitLead) return false
    if (leadTypeFilter === "general" && parsed.isUnitLead) return false

    const st = l.status || "new"
    if (statusFilter !== "all" && st !== statusFilter) return false

    if (search.trim()) {
      const areas = Array.isArray(l.preferred_areas)
        ? l.preferred_areas.join(" ")
        : l.preferred_areas || ""
      const match = `${l.name} ${l.phone} ${l.email || ""} ${areas} ${l.payment_plan || ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
      if (!match) return false
    }
    return true
  })

  const focusedLeadObj = focusedLeadId
    ? leads.find((l) => l.id === focusedLeadId)
    : null

  return (
    <div dir={dir} className="text-start">
      {/* شريط تنبيه عند فتح شخص محدد من الصفحة الرئيسية */}
      {focusedLeadId && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-[#105C50] bg-[#eff8f6] p-4 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-[#105C50] text-white">
              <UserCheck className="size-4" />
            </span>
            <div>
              <p className="text-xs font-extrabold text-[#0a1122] sm:text-sm">
                {focusedLeadObj
                  ? `${focusedLeadObj.name} (${focusedLeadObj.phone})`
                  : t.title}
              </p>
              <p className="text-[11px] font-semibold text-[#105C50]">
                {t.eyebrow}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => {
              setFocusedLeadId(null)
              router.replace("/admin/leads")
            }}
            className="h-9 rounded-xl bg-[#0a1122] px-4 text-xs font-bold text-white hover:bg-[#16223f]"
          >
            {t.allTab} ({countryLeads.length})
          </Button>
        </div>
      )}

      {/* 1. شريط تقسيم الدول العلوي */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200/90 bg-white p-3 shadow-2xs sm:p-4">
        <div className="flex items-center gap-2 text-xs font-extrabold text-[#0a1122] sm:text-sm">
          <Globe className="size-4 text-[#105C50]" />
          <span>{dict.admin.dashboard.showingAll}</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {adminCountries.map((c) => {
            const isSelected = c.code === countryFilter
            const countInC =
              c.code === "ALL"
                ? leads.length
                : leads.filter((l) => (l.country_code || "EG") === c.code)
                    .length

            return (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  setFocusedLeadId(null)
                  setCountryFilter(c.code)
                }}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold transition ${
                  isSelected
                    ? "bg-[#105C50] text-white shadow-xs"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <span>{c.flag}</span>
                <span>{c.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] ${
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

      {/* الهيدر العلوي */}
      <div className="mb-5">
        <p className="text-xs font-extrabold text-[#105C50]">{t.eyebrow}</p>
        <h2 className="mt-1 text-xl font-extrabold text-[#0a1122] sm:text-3xl">
          {t.title} ({filtered.length})
        </h2>
      </div>

      {/* شريط التبديل السريع */}
      <div className="mb-4 grid grid-cols-3 gap-2 rounded-2xl border border-gray-200/80 bg-white p-1.5 shadow-xs sm:inline-flex">
        <button
          type="button"
          onClick={() => {
            setFocusedLeadId(null)
            setLeadTypeFilter("all")
          }}
          className={`rounded-xl px-3.5 py-2 text-xs font-extrabold transition ${
            !focusedLeadId && leadTypeFilter === "all"
              ? "bg-[#0a1122] text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          {t.allTab} ({countryLeads.length})
        </button>

        <button
          type="button"
          onClick={() => {
            setFocusedLeadId(null)
            setLeadTypeFilter("unit_leads")
          }}
          className={`flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold transition ${
            !focusedLeadId && leadTypeFilter === "unit_leads"
              ? "bg-orange-600 text-white shadow-xs"
              : "bg-orange-50/80 text-orange-800 hover:bg-orange-100"
          }`}
        >
          <Flame className="size-3.5 shrink-0" />
          <span>
            {t.unitBadge} ({unitLeadsCount})
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setFocusedLeadId(null)
            setLeadTypeFilter("general")
          }}
          className={`rounded-xl px-3.5 py-2 text-xs font-extrabold transition ${
            !focusedLeadId && leadTypeFilter === "general"
              ? "bg-[#105C50] text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          {t.generalTab} ({generalLeadsCount})
        </button>
      </div>

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
            onChange={(e) => {
              setFocusedLeadId(null)
              setSearch(e.target.value)
            }}
            placeholder={t.searchPlaceholder}
            className="h-10 w-full rounded-xl border border-gray-200 ps-4 pe-10 text-xs focus:border-[#105C50] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => {
              setFocusedLeadId(null)
              setStatusFilter("all")
            }}
            className={`rounded-xl px-3 py-1.5 text-[11px] font-bold transition sm:py-2 sm:text-xs ${
              statusFilter === "all"
                ? "bg-[#105C50] text-white shadow-xs"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t.allTab}
          </button>
          {leadStatuses.map((st) => (
            <button
              key={st.value}
              type="button"
              onClick={() => {
                setFocusedLeadId(null)
                setStatusFilter(st.value)
              }}
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

      {/* 1. عرض الموبايل */}
      <div className="space-y-3.5 md:hidden">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-xs text-gray-400">
            {t.emptyText}
          </div>
        ) : (
          filtered.map((lead) => {
            const currentSt = lead.status || "new"
            const stObj =
              leadStatuses.find((s) => s.value === currentSt) ||
              leadStatuses[0]
            const parsed = parseLeadDetails(lead)
            const typesText = Array.isArray(lead.unit_types)
              ? lead.unit_types.join("، ")
              : "—"
            const isCardLoading = pending && activeLeadId === lead.id
            const firstLetter = lead.name.trim().charAt(0) || "U"
            const leadCur = getLeadCurrency(lead.country_code)

            const waText = parsed.isUnitLead
              ? `أهلاً أستاذ ${lead.name}، معك مسؤول الحالة من منصة دارك العقارية بخصوص اهتمامك بحجز وحدة (${parsed.cleanTargetUnit}). أنا جاهز لتوضيح كافة التفاصيل وترتيب إجراءات المعاينة والتنازل.`
              : `أهلاً أستاذ ${lead.name}، معك فريق مستشاري منصة دارك العقارية بخصوص طلب الشراء الخاص بك في منطقة (${parsed.cleanTargetUnit}). لدينا فرص ممتازة بدون أوفر تناسب ميزانيتك.`

            return (
              <div
                id={`lead-row-${lead.id}`}
                key={lead.id}
                className={`relative overflow-hidden rounded-2xl border bg-white p-4 shadow-xs transition ${
                  isCardLoading
                    ? "border-[#105C50] opacity-75"
                    : focusedLeadId === lead.id
                      ? "border-2 border-[#105C50] ring-2 ring-[#105C50]/25"
                      : parsed.isUnitLead
                        ? "border-orange-300 ring-1 ring-orange-200/60"
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

                {parsed.isUnitLead && (
                  <div className="-mx-4 -mt-4 mb-3 flex items-center justify-between border-b border-orange-200/80 bg-orange-50/90 px-4 py-2 text-[11px] font-extrabold text-orange-900">
                    <span className="flex items-center gap-1.5">
                      <Flame className="size-3.5 fill-orange-500 text-orange-600" />
                      <span>{t.unitBadge}</span>
                    </span>
                    {parsed.unitCode && (
                      <span className="rounded bg-white px-2 py-0.5 font-mono text-[10px] font-bold text-orange-800 shadow-2xs">
                        {parsed.unitCode}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${
                        parsed.isUnitLead
                          ? "bg-orange-100 text-orange-800"
                          : "bg-[#105C50]/10 text-[#105C50]"
                      }`}
                    >
                      {firstLetter}
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-[#0a1122]">
                        {lead.name}
                      </h3>
                      <div
                        dir="ltr"
                        className="mt-0.5 flex items-center justify-start gap-1 text-xs font-medium text-gray-500"
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
                  <div className="mt-2.5">
                    <span
                      className={`inline-block rounded-lg px-2.5 py-1 text-[11px] font-extrabold ${parsed.readinessBadge.className}`}
                    >
                      {parsed.readinessBadge.text}
                    </span>
                  </div>
                )}

                <div className="mt-3 grid grid-cols-2 gap-2.5 rounded-xl border border-gray-100 bg-gray-50/80 p-3 text-xs">
                  <div>
                    <span className="flex items-center gap-1 text-[10px] text-gray-400">
                      <Wallet className="size-3 text-[#105C50]" />
                      <span>{t.cashLabel}</span>
                    </span>
                    <strong className="mt-0.5 block text-xs font-extrabold text-[#105C50]">
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
                      {t.installmentLabel}
                    </span>
                    <strong className="mt-0.5 block text-xs font-extrabold text-[#0a1122]">
                      <span dir="ltr">
                        {Number(lead.max_installment || 0).toLocaleString(
                          "en-US"
                        )}
                      </span>{" "}
                      {leadCur}
                    </strong>
                  </div>
                </div>

                <div className="mt-2.5 space-y-1.5 rounded-xl bg-gray-50 p-3 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex shrink-0 items-center gap-1 text-gray-400">
                      {parsed.isUnitLead ? (
                        <Building2 className="size-3.5 text-orange-600" />
                      ) : (
                        <MapPin className="size-3.5" />
                      )}
                      <span>{t.areasLabel}</span>
                    </span>
                    <strong className="text-end font-bold text-[#0a1122]">
                      {parsed.cleanTargetUnit}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-400">{t.typeDetailsLabel}</span>
                    <span className="font-semibold text-gray-700">
                      {typesText}{" "}
                      {lead.min_rooms ? `· +${lead.min_rooms}` : ""}
                    </span>
                  </div>

                  {parsed.customerNotes && (
                    <div className="mt-2 rounded-lg border border-amber-200/80 bg-amber-50/70 p-2.5 text-[11px] text-amber-900">
                      <span className="font-extrabold">
                        {t.customerNotesLabel}{" "}
                      </span>
                      <span>{parsed.customerNotes}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
                    <span className="flex items-center gap-1 text-gray-400">
                      <Calendar className="size-3" />
                      <span>{t.dateLabel}</span>
                    </span>
                    <span dir="ltr" className="font-medium text-gray-600">
                      {new Date(lead.created_at).toLocaleDateString("en-GB")}
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="mb-1 block text-[11px] font-bold text-gray-500">
                    {t.statusLabel}
                  </label>
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
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-[#0a1122] focus:border-[#105C50] focus:outline-none"
                  >
                    {leadStatuses.map((st) => (
                      <option key={st.value} value={st.value}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3">
                  <a
                    href={`https://wa.me/${String(lead.phone).replace(/\D/g, "")}?text=${encodeURIComponent(waText)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-3 text-xs font-bold text-white transition hover:opacity-90"
                  >
                    <MessageCircle className="size-4" />
                    <span>{t.whatsappBtn}</span>
                  </a>

                  {parsed.isUnitLead && (
                    <Link
                      href="/admin/properties"
                      className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-bold text-[#0a1122] hover:bg-gray-100"
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
                    className="inline-flex h-9 items-center justify-center rounded-xl border border-red-200 bg-red-50/60 px-3 text-xs font-bold text-red-600 transition hover:bg-red-100"
                    title={t.deleteBtn}
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
      <Card className="hidden border-gray-200/80 bg-white shadow-sm md:block">
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
                  <th className="px-5 py-4 font-bold">{t.colBuyer}</th>
                  <th className="px-5 py-4 font-bold">{t.colCash}</th>
                  <th className="px-5 py-4 font-bold">{t.colTarget}</th>
                  <th className="px-5 py-4 font-bold">{t.colDate}</th>
                  <th className="px-5 py-4 font-bold">{t.colStatus}</th>
                  <th className="px-5 py-4 font-bold">{t.colAction}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-10 text-center text-gray-400"
                    >
                      {t.emptyText}
                    </td>
                  </tr>
                ) : (
                  filtered.map((lead) => {
                    const currentSt = lead.status || "new"
                    const stObj =
                      leadStatuses.find((s) => s.value === currentSt) ||
                      leadStatuses[0]
                    const parsed = parseLeadDetails(lead)
                    const typesText = Array.isArray(lead.unit_types)
                      ? lead.unit_types.join("، ")
                      : "—"
                    const isRowLoading = pending && activeLeadId === lead.id
                    const leadCur = getLeadCurrency(lead.country_code)

                    const waText = parsed.isUnitLead
                      ? `أهلاً أستاذ ${lead.name}، معك مسؤول الحالة من منصة دارك العقارية بخصوص اهتمامك بحجز وحدة (${parsed.cleanTargetUnit}). أنا جاهز لتوضيح كافة التفاصيل وترتيب إجراءات المعاينة والتنازل.`
                      : `أهلاً أستاذ ${lead.name}، معك فريق مستشاري منصة دارك العقارية بخصوص طلب الشراء الخاص بك في منطقة (${parsed.cleanTargetUnit}). لدينا فرص ممتازة بدون أوفر تناسب ميزانيتك.`

                    return (
                      <tr
                        id={`lead-row-${lead.id}`}
                        key={lead.id}
                        className={`border-t border-gray-100 transition-colors ${
                          isRowLoading
                            ? "bg-emerald-50/40 opacity-70"
                            : focusedLeadId === lead.id
                              ? "bg-emerald-50/60"
                              : parsed.isUnitLead
                                ? "bg-orange-50/25 hover:bg-orange-50/50"
                                : "hover:bg-gray-50/50"
                        }`}
                      >
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap items-center gap-1.5 font-extrabold text-[#0a1122]">
                            <span>{lead.name}</span>
                            {parsed.isUnitLead ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-[10px] font-extrabold text-orange-800">
                                <Flame className="size-3 fill-orange-500 text-orange-600" />
                                {t.unitBadge} {parsed.unitCode || ""}
                              </span>
                            ) : (
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                                {t.generalTab}
                              </span>
                            )}
                            {isRowLoading && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#105C50] px-2 py-0.5 text-[10px] font-bold text-white">
                                <Loader2 className="size-3 animate-spin" />
                                {t.savingBtn}
                              </span>
                            )}
                          </div>
                          <div
                            dir="ltr"
                            className="mt-1 text-start text-xs font-semibold text-gray-600"
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
                            {t.cashLabel}{" "}
                            <span dir="ltr">
                              {Number(
                                lead.available_cash || lead.budget || 0
                              ).toLocaleString("en-US")}
                            </span>{" "}
                            {leadCur}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            {t.installmentLabel}{" "}
                            <span dir="ltr">
                              {Number(lead.max_installment || 0).toLocaleString(
                                "en-US"
                              )}
                            </span>{" "}
                            {leadCur}
                          </div>
                        </td>

                        <td className="max-w-[300px] px-5 py-4">
                          <div className="font-extrabold text-[#0a1122]">
                            {parsed.cleanTargetUnit}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                            <span>
                              {typesText}{" "}
                              {lead.min_rooms ? `· +${lead.min_rooms}` : ""}
                            </span>
                            {parsed.readinessBadge && (
                              <span
                                className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${parsed.readinessBadge.className}`}
                              >
                                {parsed.readinessBadge.text}
                              </span>
                            )}
                          </div>
                          {parsed.customerNotes && (
                            <div className="mt-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-900">
                              <strong>{t.customerNotesLabel}</strong>{" "}
                              {parsed.customerNotes}
                            </div>
                          )}
                        </td>

                        <td
                          dir="ltr"
                          className="px-5 py-4 text-start text-xs text-gray-500"
                        >
                          {new Date(lead.created_at).toLocaleDateString(
                            "en-GB"
                          )}
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
                                    lead,
                                    newStatus: nextSt,
                                  })
                                }
                              }}
                              className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-xs font-bold text-[#0a1122] focus:border-[#105C50] focus:outline-none disabled:opacity-50"
                            >
                              {leadStatuses.map((st) => (
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
                              href={`https://wa.me/${String(lead.phone).replace(/\D/g, "")}?text=${encodeURIComponent(waText)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-2 text-xs font-bold text-white transition hover:opacity-90"
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
                              className="rounded-lg border border-gray-200 p-2 text-gray-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                              title={t.deleteBtn}
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

      {/* 3. نافذة التأكيد */}
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
                  <strong className="text-[#0a1122]">
                    "{confirmAction.lead.name}"
                  </strong>
                  {confirmAction.type === "status" && (
                    <>
                      {" "}
                      →{" "}
                      <span className="font-bold text-[#105C50]">
                        ({getLeadStatusLabel(confirmAction.newStatus)})
                      </span>
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