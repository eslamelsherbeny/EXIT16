"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Eye,
  Flame,
  Handshake,
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
import { calculateSmartMatch } from "@/lib/smart-matcher"
import { BuyerSmartMatchModal } from "@/components/features/admin/smart-match-dialogs"
import { deleteBuyerLeadAction, updateBuyerLeadStatusAction } from "../../../actions/admin-actions"

const ACTIVE_ADMIN_COUNTRY = "GE"

export type BuyerLead = {
  id: string
  user_id?: string | null
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

export type LinkedUnitSummary = {
  id: string
  user_id?: string | null
  project_name: string | null
  area: string | null
  unit_type: string | null
  rooms?: number | null
  delivery_status?: string | null
  paid_amount: number | null
  contract_price: number | null
  installment_amount: number | null
  installment_frequency?: string | null
  willing_to_discount?: boolean | null
  discount_amount?: number | null
  name: string
  phone: string
  status?: string | null
  country_code?: string | null
  country?: string | null
}

function deriveShortUnitCode(id: string) {
  const digits = id.replace(/\D/g, "")
  const num = digits ? Number(digits.slice(-4)) : 100
  return `U-${String(num).padStart(5, "0")}`
}

function findMatchingUnitForLead(
  lead: BuyerLead,
  unitCode: string | null,
  cleanTargetUnit: string,
  units: LinkedUnitSummary[]
): LinkedUnitSummary | null {
  if (!units || units.length === 0) return null

  if (unitCode) {
    const cleanCode = unitCode.toUpperCase()
    const byCode = units.find(
      (u) =>
        deriveShortUnitCode(u.id).toUpperCase() === cleanCode ||
        `U-${u.id.slice(0, 5).toUpperCase()}` === cleanCode ||
        u.id.toUpperCase().startsWith(cleanCode.replace("U-", ""))
    )
    if (byCode) return byCode
  }

  const byProjectName = units.find(
    (u) =>
      u.project_name &&
      cleanTargetUnit.includes(u.project_name.trim()) &&
      (!u.area || cleanTargetUnit.includes(u.area.trim()))
  )
  if (byProjectName) return byProjectName

  return (
    units.find(
      (u) => u.project_name && cleanTargetUnit.includes(u.project_name.trim())
    ) || null
  )
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

export default function LeadsClientTable({
  leads,
  units = [],
  offers = [],
}: {
  leads: BuyerLead[]
  units?: LinkedUnitSummary[]
  offers?: any[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const { t: dict, locale, dir } = useTranslation()

  const adminDict = (dict?.admin as Record<string, any>) || {}
  const t = adminDict.leadsAdmin || {}
  const leadsPrompts = adminDict.leads || {}
  const propAdminDict = adminDict.propertiesAdmin || {}
  const sm = adminDict.smartMatch || {}

  function getMatchedUnitsForLead(lead: BuyerLead) {
    if (!units || units.length === 0) return []
    const activeUnits = units.filter(
      (u) => u.status === "active" && (!u.user_id || u.user_id !== lead.user_id)
    )
    return activeUnits
      .map((u) => ({
        unit: u,
        match: calculateSmartMatch(u, lead, undefined, locale),
      }))
      .filter((item) => item.match.score >= 60)
      .sort((a, b) => b.match.score - a.match.score)
  }

  function renderLeadOfferBadges(lead: BuyerLead) {
    const leadOffers = offers.filter(
      (o) =>
        o.status !== "recommended" &&
        (o.lead_id === lead.id ||
          (lead.user_id && o.buyer_user_id === lead.user_id))
    )
    if (leadOffers.length === 0) return null

    const accepted = leadOffers.find((o) => o.status === "accepted")
    const pendingOffer = leadOffers.find(
      (o) => o.status === "pending_seller" || o.status === "counter_offered"
    )
    const rejectedCount = leadOffers.filter(
      (o) => o.status === "rejected"
    ).length

    return (
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        {accepted && (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-extrabold text-white shadow-2xs">
            <Handshake className="size-2.5" />
            <span>{sm.offerAcceptedTag}</span>
          </span>
        )}

        {!accepted && pendingOffer && (
          <button
            type="button"
            onClick={() => setSmartMatchLead(lead)}
            className="inline-flex items-center gap-1 rounded-md border border-purple-300 bg-purple-50 px-2 py-0.5 text-[10px] font-extrabold text-purple-900"
          >
            <span>💰 {sm.offerPendingTag}</span>
          </button>
        )}

        {!accepted && !pendingOffer && rejectedCount > 0 && (
          <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
            ✕ {rejectedCount} {sm.offerRejectedTag}
          </span>
        )}
      </div>
    )
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
    const unitCode = codeMatch ? codeMatch[0].toUpperCase() : null

    let readinessBadge: { text: string; className: string } | null = null
    if (planRaw.includes("خلال أسبوع")) {
      readinessBadge = {
        text: leadsPrompts.readiness?.week || "",
        className: "bg-red-100 text-red-700 border border-red-200",
      }
    } else if (
      planRaw.includes("شهر لـ 3 شهور") ||
      planRaw.includes("خلال شهر")
    ) {
      readinessBadge = {
        text: leadsPrompts.readiness?.month || "",
        className: "bg-amber-100 text-amber-800 border border-amber-200",
      }
    } else if (planRaw.includes("يجمع معلومات")) {
      readinessBadge = {
        text: leadsPrompts.readiness?.info || "",
        className: "bg-slate-100 text-slate-700 border border-slate-200",
      }
    }

    let customerNotes = ""
    if (planRaw.includes("أسئلة العميل:")) {
      customerNotes = planRaw.split("أسئلة العميل:")[1]?.trim() || ""
    } else if (planRaw.includes("ملاحظات:")) {
      customerNotes = planRaw.split("ملاحظات:")[1]?.trim() || ""
    }

    const cleanTargetUnit =
      areasRaw.replace("🎯 مهتم بوحدة:", "").trim() ||
      leadsPrompts.allAreas ||
      ""

    const matchedUnit = isUnitLead
      ? findMatchingUnitForLead(lead, unitCode, cleanTargetUnit, units)
      : null

    return {
      isUnitLead,
      unitCode,
      cleanTargetUnit,
      readinessBadge,
      customerNotes,
      matchedUnit,
    }
  }

  function buildWhatsAppMessage(
    lead: BuyerLead,
    parsed: ReturnType<typeof parseLeadDetails>,
    leadCur: string
  ) {
    const cashVal = Number(
      lead.available_cash || lead.budget || 0
    ).toLocaleString("en-US")
    const instVal = Number(lead.max_installment || 0).toLocaleString("en-US")
    const typesStr = Array.isArray(lead.unit_types)
      ? lead.unit_types.join("، ")
      : ""

    if (parsed.isUnitLead) {
      const unitTitle = parsed.matchedUnit
        ? `${parsed.matchedUnit.project_name || ""} - ${parsed.matchedUnit.area || ""} (${parsed.unitCode || ""})`
        : parsed.cleanTargetUnit
      return `${leadsPrompts.waUnitLeadPrefix} ${lead.name}، ${leadsPrompts.waUnitLeadMiddle} (${unitTitle}) — ${t.cashLabel} ${cashVal} ${leadCur} | ${t.installmentLabel} ${instVal} ${leadCur}.${parsed.customerNotes ? ` (${t.customerNotesLabel} ${parsed.customerNotes})` : ""} ${leadsPrompts.waUnitLeadSuffix}`
    }

    return `${leadsPrompts.waGeneralPrefix} ${lead.name}، ${leadsPrompts.waGeneralMiddle} (${parsed.cleanTargetUnit}) — ${t.cashLabel} ${cashVal} ${leadCur} | ${t.installmentLabel} ${instVal} ${leadCur}${typesStr ? ` | ${typesStr}` : ""}. ${leadsPrompts.waGeneralSuffix}`
  }

  const leadStatuses = [
    { value: "new", label: t.statuses?.new, badge: "bg-blue-100 text-blue-800" },
    {
      value: "contacted",
      label: t.statuses?.contacted,
      badge: "bg-amber-100 text-amber-800",
    },
    {
      value: "matched",
      label: t.statuses?.matched,
      badge: "bg-purple-100 text-purple-800",
    },
    {
      value: "closed",
      label: t.statuses?.closed,
      badge: "bg-emerald-100 text-emerald-800",
    },
    {
      value: "archived",
      label: t.statuses?.archived,
      badge: "bg-gray-100 text-gray-600",
    },
  ]

  function getLeadStatusLabel(status: string | null | undefined) {
    const st = status || "new"
    return leadStatuses.find((s) => s.value === st)?.label || st
  }

  function getLeadCurrency() {
    return getCurrencySymbol(ACTIVE_ADMIN_COUNTRY, locale)
  }

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [leadTypeFilter, setLeadTypeFilter] = useState<
    "all" | "unit_leads" | "general"
  >("all")
  const [highlightedLeadId, setHighlightedLeadId] = useState<string | null>(
    null
  )
  const [detailsLead, setDetailsLead] = useState<BuyerLead | null>(null)
  const [smartMatchLead, setSmartMatchLead] = useState<BuyerLead | null>(null)

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
    const leadIdParam = searchParams.get("leadId")

    if (typeParam === "unit_leads" || typeParam === "general") {
      setLeadTypeFilter(typeParam)
    } else {
      setLeadTypeFilter("all")
    }

    if (leadIdParam) {
      setHighlightedLeadId(leadIdParam)
      const targetLead = leads.find((l) => l.id === leadIdParam)

      if (targetLead) {
        setTimeout(() => {
          const el = document.getElementById(`lead-row-${leadIdParam}`)
          el?.scrollIntoView({ behavior: "smooth", block: "center" })
        }, 250)
      }
    }
  }, [searchParams, leads])

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

  const unitLeadsCount = leads.filter((l) => parseLeadDetails(l).isUnitLead).length
  const generalLeadsCount = leads.length - unitLeadsCount

  const filtered = leads.filter((l) => {
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

  return (
    <div dir={dir} className="text-start">
      {/* شريط التبديل السريع */}
      <div className="mb-4 grid grid-cols-3 gap-2 rounded-xl border border-gray-200/80 bg-white p-1.5 shadow-2xs sm:inline-flex">
        <button
          type="button"
          onClick={() => setLeadTypeFilter("all")}
          className={`rounded-lg px-3.5 py-2 text-xs font-extrabold transition ${
            leadTypeFilter === "all"
              ? "bg-[#0a1122] text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          {t.allTab} ({leads.length})
        </button>

        <button
          type="button"
          onClick={() => setLeadTypeFilter("unit_leads")}
          className={`flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-extrabold transition ${
            leadTypeFilter === "unit_leads"
              ? "bg-orange-600 text-white shadow-2xs"
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
          onClick={() => setLeadTypeFilter("general")}
          className={`rounded-lg px-3.5 py-2 text-xs font-extrabold transition ${
            leadTypeFilter === "general"
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

      {/* شريط البحث والفلترة */}
      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-gray-200/80 bg-white p-3 shadow-2xs sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
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

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              statusFilter === "all"
                ? "bg-[#105C50] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t.allTab}
          </button>
          {leadStatuses.map((st) => (
            <button
              key={st.value}
              type="button"
              onClick={() => setStatusFilter(st.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
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

      {/* 1. عرض الموبايل */}
      <div className="space-y-3 md:hidden">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-xs text-gray-400">
            {t.emptyText}
          </div>
        ) : (
          filtered.map((lead) => {
            const currentSt = lead.status || "new"
            const stObj =
              leadStatuses.find((s) => s.value === currentSt) ||
              leadStatuses[0]
            const parsed = parseLeadDetails(lead)
            const matchedUnits = getMatchedUnitsForLead(lead)
            const topUnitScore = matchedUnits[0]?.match.score || 0
            const typesText = Array.isArray(lead.unit_types)
              ? lead.unit_types.join("، ")
              : "—"
            const isCardLoading = pending && activeLeadId === lead.id
            const isHighlighted = highlightedLeadId === lead.id
            const firstLetter = lead.name.trim().charAt(0) || "U"
            const leadCur = getLeadCurrency()

            const waText = buildWhatsAppMessage(lead, parsed, leadCur)

            return (
              <div
                id={`lead-row-${lead.id}`}
                key={lead.id}
                className={`relative overflow-hidden rounded-xl border bg-white p-3.5 shadow-2xs transition ${
                  isCardLoading
                    ? "border-[#105C50] opacity-75"
                    : isHighlighted
                      ? "border-[#105C50] bg-emerald-50/20 ring-2 ring-[#105C50]/30"
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
                  <div className="-mx-3.5 -mt-3.5 mb-3 flex items-center justify-between border-b border-orange-200/80 bg-orange-50/90 px-3.5 py-2 text-[11px] font-extrabold text-orange-900">
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
                      className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
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

                {matchedUnits.length > 0 && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => setSmartMatchLead(lead)}
                      className="inline-flex items-center gap-1 rounded-md border border-teal-400 bg-teal-50 px-2 py-0.5 text-[10px] font-extrabold text-[#105C50] transition hover:bg-[#105C50] hover:text-white"
                    >
                      <span>🎯</span>
                      <span>
                        {matchedUnits.length} {sm.matchedUnitsShort} (
                        {topUnitScore}%)
                      </span>
                    </button>
                  </div>
                )}

                {renderLeadOfferBadges(lead)}

                {parsed.readinessBadge && (
                  <div className="mt-2.5">
                    <span
                      className={`inline-block rounded-lg px-2.5 py-1 text-[11px] font-extrabold ${parsed.readinessBadge.className}`}
                    >
                      {parsed.readinessBadge.text}
                    </span>
                  </div>
                )}

                <div className="mt-2.5 grid grid-cols-2 gap-2.5 rounded-lg border border-gray-100 bg-gray-50/80 p-2.5 text-xs">
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

                <div className="mt-2 space-y-1.5 rounded-lg bg-gray-50 p-2.5 text-xs">
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
                    <div className="mt-1.5 rounded-lg border border-amber-200/80 bg-amber-50/70 p-2 text-[11px] text-amber-900">
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

                <div className="mt-2.5">
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
                    className="h-8 w-full rounded-lg border border-gray-200 bg-gray-50/70 px-2 text-xs font-bold text-[#0a1122] focus:border-[#105C50] focus:outline-none"
                  >
                    {leadStatuses.map((st) => (
                      <option key={st.value} value={st.value}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-gray-100 pt-2.5">
                  <button
                    type="button"
                    onClick={() => setDetailsLead(lead)}
                    className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-bold text-[#0a1122] hover:bg-gray-50"
                  >
                    <Eye className="size-3.5 text-[#105C50]" />
                    <span>{propAdminDict.actions?.detailsBtn || t.unitBtn}</span>
                  </button>

                  {parsed.isUnitLead && (
                    <>
                      <Link
                        href={
                          parsed.matchedUnit
                            ? `/opportunities/${parsed.matchedUnit.id}`
                            : `/opportunities?q=${encodeURIComponent(parsed.unitCode || parsed.cleanTargetUnit)}`
                        }
                        target="_blank"
                        className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-bold text-[#105C50] hover:bg-emerald-100"
                      >
                        <ExternalLink className="size-3.5" />
                        <span>{t.unitBtn}</span>
                      </Link>

                      <Link
                        href={
                          parsed.matchedUnit
                            ? `/admin/properties?unitId=${parsed.matchedUnit.id}`
                            : `/admin/properties?q=${encodeURIComponent(parsed.unitCode || "")}`
                        }
                        className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2.5 text-xs font-bold text-[#0a1122] hover:bg-gray-100"
                      >
                        <Building2 className="size-3.5 text-[#105C50]" />
                      </Link>
                    </>
                  )}

                  <a
                    data-admin-client-wa="true"
                    href={`https://wa.me/${String(lead.phone).replace(/\D/g, "")}?text=${encodeURIComponent(waText)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#25D366] px-3 text-xs font-bold text-white transition hover:opacity-90"
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
                    className="inline-flex h-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 px-2.5 text-xs font-bold text-red-600 transition hover:bg-red-100"
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
      <Card className="hidden border-gray-200/80 bg-white shadow-2xs md:block">
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
                    const matchedUnits = getMatchedUnitsForLead(lead)
                    const topUnitScore = matchedUnits[0]?.match.score || 0
                    const typesText = Array.isArray(lead.unit_types)
                      ? lead.unit_types.join("، ")
                      : "—"
                    const isRowLoading = pending && activeLeadId === lead.id
                    const isHighlighted = highlightedLeadId === lead.id
                    const leadCur = getLeadCurrency()

                    const waText = buildWhatsAppMessage(lead, parsed, leadCur)

                    return (
                      <tr
                        id={`lead-row-${lead.id}`}
                        key={lead.id}
                        className={`border-t border-gray-100 transition-colors ${
                          isRowLoading
                            ? "bg-emerald-50/40 opacity-70"
                            : isHighlighted
                              ? "bg-emerald-50/70 ring-2 ring-inset ring-[#105C50]"
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
                          {matchedUnits.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setSmartMatchLead(lead)}
                              className="mt-1.5 inline-flex items-center gap-1 rounded-md border border-teal-400 bg-teal-50 px-2 py-0.5 text-[10px] font-extrabold text-[#105C50] transition hover:bg-[#105C50] hover:text-white"
                            >
                              <span>🎯</span>
                              <span>
                                {matchedUnits.length} {sm.matchedUnitsShort} (
                                {topUnitScore}%)
                              </span>
                            </button>
                          )}
                          {renderLeadOfferBadges(lead)}
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
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setDetailsLead(lead)}
                              className="inline-flex h-8 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-bold text-[#0a1122] transition hover:border-[#105C50] hover:bg-gray-50"
                            >
                              <Eye className="size-3.5 text-[#105C50]" />
                              <span>
                                {propAdminDict.actions?.detailsBtn || t.unitBtn}
                              </span>
                            </button>

                            {parsed.isUnitLead && (
                              <>
                                <Link
                                  href={
                                    parsed.matchedUnit
                                      ? `/opportunities/${parsed.matchedUnit.id}`
                                      : `/opportunities?q=${encodeURIComponent(parsed.unitCode || parsed.cleanTargetUnit)}`
                                  }
                                  target="_blank"
                                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-bold text-[#105C50] transition hover:bg-emerald-100"
                                >
                                  <ExternalLink className="size-3.5" />
                                  <span>{t.unitBtn}</span>
                                </Link>

                                <Link
                                  href={
                                    parsed.matchedUnit
                                      ? `/admin/properties?unitId=${parsed.matchedUnit.id}`
                                      : `/admin/properties`
                                  }
                                  title={dict.admin?.shell?.nav?.properties}
                                  className="inline-flex h-8 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-2 text-[#0a1122] transition hover:bg-gray-100"
                                >
                                  <Building2 className="size-3.5 text-[#105C50]" />
                                </Link>
                              </>
                            )}

                            <a
                              data-admin-client-wa="true"
                              href={`https://wa.me/${String(lead.phone).replace(/\D/g, "")}?text=${encodeURIComponent(waText)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#25D366] px-3 text-xs font-bold text-white transition hover:opacity-90"
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
                              className="inline-flex h-8 items-center justify-center rounded-lg border border-gray-200 px-2 text-gray-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
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

      {/* 3. المكون المفصول للتوافق الذكي للمشتري */}
      <BuyerSmartMatchModal
        lead={smartMatchLead}
        units={units}
        offers={offers}
        onClose={() => setSmartMatchLead(null)}
        onNotice={(msg) => setNotice(msg)}
      />

      {/* 4. نافذة تفاصيل طلب الشراء والوحدة المحجوزة */}
      <Dialog
        open={Boolean(detailsLead)}
        onOpenChange={(open) => !open && setDetailsLead(null)}
      >
        <DialogContent
          dir={dir}
          className="max-h-[88vh] w-[92vw] max-w-[460px] overflow-y-auto rounded-2xl p-5 text-start sm:max-w-lg"
        >
          {detailsLead &&
            (() => {
              const parsed = parseLeadDetails(detailsLead)
              const leadCur = getLeadCurrency()
              const waText = buildWhatsAppMessage(detailsLead, parsed, leadCur)
              const typesText = Array.isArray(detailsLead.unit_types)
                ? detailsLead.unit_types.join("، ")
                : "—"

              return (
                <>
                  <DialogHeader className="text-start">
                    <div className="flex items-center justify-between gap-2">
                      <DialogTitle className="text-sm font-extrabold text-[#0a1122] sm:text-base">
                        {detailsLead.name}
                      </DialogTitle>
                      {parsed.isUnitLead && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-[10px] font-extrabold text-orange-800">
                          <Flame className="size-3 fill-orange-500 text-orange-600" />
                          {t.unitBadge} {parsed.unitCode || ""}
                        </span>
                      )}
                    </div>
                    <DialogDescription className="text-start text-xs text-gray-500">
                      <span dir="ltr">{detailsLead.phone}</span>
                      {detailsLead.email ? ` · ${detailsLead.email}` : ""}
                    </DialogDescription>
                  </DialogHeader>

                  {parsed.isUnitLead && (
                    <div className="mt-2 rounded-xl border border-orange-200 bg-orange-50/70 p-3.5 text-xs">
                      <p className="font-extrabold text-orange-950">
                        {parsed.cleanTargetUnit}
                      </p>
                      {parsed.matchedUnit && (
                        <p className="mt-1 text-[11px] font-semibold text-orange-800">
                          {propAdminDict.table?.colClient}:{" "}
                          {parsed.matchedUnit.name} (
                          <span dir="ltr">{parsed.matchedUnit.phone}</span>)
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link
                          href={
                            parsed.matchedUnit
                              ? `/opportunities/${parsed.matchedUnit.id}`
                              : `/opportunities?q=${encodeURIComponent(parsed.unitCode || parsed.cleanTargetUnit)}`
                          }
                          target="_blank"
                          className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#105C50] px-3 text-xs font-bold text-white hover:bg-[#0c483f]"
                        >
                          <ExternalLink className="size-3.5" />
                          <span>
                            {dict.admin?.shell?.publicSite} ({t.unitBtn})
                          </span>
                        </Link>

                        {parsed.matchedUnit && (
                          <Link
                            href={`/admin/properties?unitId=${parsed.matchedUnit.id}`}
                            onClick={() => setDetailsLead(null)}
                            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 text-xs font-bold text-[#0a1122] hover:bg-gray-50"
                          >
                            <Building2 className="size-3.5 text-[#105C50]" />
                            <span>{dict.admin?.shell?.nav?.properties}</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-3 grid grid-cols-2 gap-2.5 rounded-xl bg-gray-50 p-3 text-xs">
                    <div>
                      <span className="block text-[10px] text-gray-400">
                        {t.cashLabel}
                      </span>
                      <strong className="text-[#105C50]">
                        <span dir="ltr">
                          {Number(
                            detailsLead.available_cash ||
                              detailsLead.budget ||
                              0
                          ).toLocaleString("en-US")}
                        </span>{" "}
                        {leadCur}
                      </strong>
                    </div>

                    <div>
                      <span className="block text-[10px] text-gray-400">
                        {t.installmentLabel}
                      </span>
                      <strong className="text-[#0a1122]">
                        <span dir="ltr">
                          {Number(
                            detailsLead.max_installment || 0
                          ).toLocaleString("en-US")}
                        </span>{" "}
                        {leadCur}
                      </strong>
                    </div>

                    <div>
                      <span className="block text-[10px] text-gray-400">
                        {t.typeDetailsLabel}
                      </span>
                      <strong className="text-[#0a1122]">
                        {typesText}{" "}
                        {detailsLead.min_rooms
                          ? `(+${detailsLead.min_rooms})`
                          : ""}
                      </strong>
                    </div>

                    <div>
                      <span className="block text-[10px] text-gray-400">
                        {t.dateLabel}
                      </span>
                      <strong dir="ltr" className="text-[#0a1122]">
                        {new Date(detailsLead.created_at).toLocaleDateString(
                          "en-GB"
                        )}
                      </strong>
                    </div>
                  </div>

                  {parsed.readinessBadge && (
                    <div className="mt-2">
                      <span
                        className={`inline-block rounded-lg px-3 py-1 text-xs font-bold ${parsed.readinessBadge.className}`}
                      >
                        {parsed.readinessBadge.text}
                      </span>
                    </div>
                  )}

                  {parsed.customerNotes && (
                    <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                      <strong className="block font-extrabold">
                        {t.customerNotesLabel}
                      </strong>
                      <p className="mt-1">{parsed.customerNotes}</p>
                    </div>
                  )}

                  <DialogFooter className="mt-4 flex flex-row items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setDetailsLead(null)}
                      className="h-9 rounded-xl text-xs font-bold"
                    >
                      {propAdminDict.actions?.closeBtn || t.cancelBtn}
                    </Button>
                    <a
                      data-admin-client-wa="true"
                      href={`https://wa.me/${String(detailsLead.phone).replace(/\D/g, "")}?text=${encodeURIComponent(waText)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-4 text-xs font-bold text-white hover:opacity-90"
                    >
                      <MessageCircle className="size-4" />
                      <span>{t.whatsappBtn}</span>
                    </a>
                  </DialogFooter>
                </>
              )
            })()}
        </DialogContent>
      </Dialog>

      {/* 5. نافذة التأكيد */}
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

/* ============================================================================
   ARCHIVED MULTI-COUNTRY LEADS FILTER BAR (COMMENTED FOR FUTURE REFERENCE)
   ============================================================================
   const adminCountries = [
     { code: "ALL", label: adminDict.dashboard?.countries?.ALL, flag: "🌍" },
     { code: "EG", label: adminDict.dashboard?.countries?.EG, flag: "🇪🇬" },
     { code: "RU", label: adminDict.dashboard?.countries?.RU, flag: "🇷🇺" },
     { code: "GE", label: adminDict.dashboard?.countries?.GE, flag: "🇬🇪" },
     { code: "AE", label: adminDict.dashboard?.countries?.AE, flag: "🇦🇪" },
   ]
   const [countryFilter, setCountryFilter] = useState<string>("ALL")
   const countryLeads =
     countryFilter === "ALL"
       ? leads
       : leads.filter((l) => (l.country_code || "EG") === countryFilter)
============================================================================ */