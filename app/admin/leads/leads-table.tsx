"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Eye,
  Flame,
  Handshake,
  Loader2,
  MapPin,
  MessageCircle,
  MoreVertical,
  Phone,
  Search,
  Trash2,
  Wallet,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { downloadExcelCsv, EXPORT_LABELS } from "@/lib/export-csv"
import { getCurrencySymbol, useTranslation } from "@/lib/i18n"
import { calculateSmartMatch } from "@/lib/smart-matcher"
import { BuyerSmartMatchModal } from "@/components/features/admin/smart-match-dialogs"
import {
  deleteBuyerLeadAction,
  updateBuyerLeadStatusAction,
  verifyUserContactByAdminAction,
} from "../../../actions/admin-actions"
import {
  ACTIVE_ADMIN_COUNTRY,
  buildLeadWhatsAppMessage,
  isBuyerEmailVerified,
  isBuyerPhoneVerified,
  isSelfOfferForLead,
  normalizeOfferStatus,
  parseLeadDetails,
  type BuyerLead,
  type ConfirmLeadAction,
  type LinkedUnitSummary,
  type UserVerificationBadgeInfo,
} from "./leads-helpers"
import { LeadConfirmDialog, LeadDetailsDialog } from "./leads-modals"

export type { BuyerLead, LinkedUnitSummary, UserVerificationBadgeInfo }

function isUnitEligibleForLeadMatch(status?: string | null): boolean {
  const clean = String(status || "active").trim().toLowerCase()
  return (
    clean === "active" ||
    clean === "approved" ||
    clean === "published" ||
    clean === "offer_received"
  )
}

export default function LeadsClientTable({
  leads,
  units = [],
  offers = [],
  verificationMap = {},
}: {
  leads: BuyerLead[]
  units?: LinkedUnitSummary[]
  offers?: any[]
  verificationMap?: Record<string, UserVerificationBadgeInfo>
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const { t: dict, locale, dir } = useTranslation()

  const adminDict = (dict?.admin as Record<string, any>) || {}
  const t = adminDict.leadsAdmin || {}
  const leadsPrompts = adminDict.leads || {}
  const propAdminDict = adminDict.propertiesAdmin || {}
  const dashDict = adminDict.dashboard || {}
  const sm = adminDict.smartMatch || {}
  const expL = EXPORT_LABELS[locale] || EXPORT_LABELS.ar

  function getMatchedUnitsForLead(lead: BuyerLead) {
    if (!units || units.length === 0) return []
    const leadPhoneDigits = String(lead.phone || "").replace(/\D/g, "")
    const eligibleUnits = units.filter((u) => {
      if (!isUnitEligibleForLeadMatch(u.status)) return false
      if (lead.user_id && u.user_id && String(u.user_id) === String(lead.user_id))
        return false
      const uPhoneDigits = String(u.phone || "").replace(/\D/g, "")
      if (
        leadPhoneDigits.length >= 8 &&
        uPhoneDigits.length >= 8 &&
        leadPhoneDigits.slice(-8) === uPhoneDigits.slice(-8)
      ) {
        return false
      }
      return true
    })
    return eligibleUnits
      .map((u) => ({
        unit: u,
        match: calculateSmartMatch(u, lead, undefined, locale),
      }))
      .filter((item) => item.match.score >= 60)
      .sort((a, b) => b.match.score - a.match.score)
  }

  function renderLeadOfferBadges(
    lead: BuyerLead,
    parsed: ReturnType<typeof parseLeadDetails>
  ) {
    const leadOffers = offers
      .map((o) => ({ ...o, status: normalizeOfferStatus(o) }))
      .filter((o) => {
        if (o.status === "recommended") return false
        if (isSelfOfferForLead(o, units)) return false
        if (String(o.lead_id || "") === String(lead.id)) return true
        if (
          parsed.isUnitLead &&
          parsed.matchedUnit &&
          String(o.property_id) === String(parsed.matchedUnit.id) &&
          lead.user_id &&
          String(o.buyer_user_id || "") === String(lead.user_id)
        ) {
          return true
        }
        return false
      })

    if (leadOffers.length === 0) return null

    const accepted = leadOffers.find((o) => o.status === "accepted")
    const pendingAdmin = leadOffers.find((o) => o.status === "pending_admin")
    const pendingOffer = leadOffers.find(
      (o) => o.status === "pending_seller" || o.status === "counter_offered"
    )
    const rejectedCount = leadOffers.filter(
      (o) => o.status === "rejected"
    ).length

    return (
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        {accepted && (
          <Link
            href={`/admin/deals?offerId=${accepted.id}`}
            className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-extrabold text-white shadow-2xs hover:bg-emerald-700"
          >
            <Handshake className="size-2.5" />
            <span>{sm.offerAcceptedTag}</span>
          </Link>
        )}

        {!accepted && pendingAdmin && (
          <Link
            href={`/admin/deals?offerId=${pendingAdmin.id}`}
            className="inline-flex items-center gap-1 rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-extrabold text-white shadow-2xs hover:bg-amber-600"
          >
            <Clock className="size-2.5" />
            <span>{sm.offerPendingAdminTag}</span>
          </Link>
        )}

        {!accepted && !pendingAdmin && pendingOffer && (
          <Link
            href={`/admin/deals?offerId=${pendingOffer.id}`}
            className="inline-flex items-center gap-1 rounded-md border border-purple-300 bg-purple-50 px-2 py-0.5 text-[10px] font-extrabold text-purple-900 hover:bg-purple-100"
          >
            <span>💰 {sm.offerPendingTag}</span>
          </Link>
        )}

        {!accepted && !pendingAdmin && !pendingOffer && rejectedCount > 0 && (
          <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
            ✕ {rejectedCount} {sm.offerRejectedTag}
          </span>
        )}
      </div>
    )
  }

  const leadStatuses = [
    {
      value: "new",
      label: t.statuses?.new,
      badge: "bg-blue-50 text-blue-900 border-blue-300",
    },
    {
      value: "contacted",
      label: t.statuses?.contacted,
      badge: "bg-amber-50 text-amber-900 border-amber-300",
    },
    {
      value: "matched",
      label: t.statuses?.matched,
      badge: "bg-purple-50 text-purple-900 border-purple-300",
    },
    {
      value: "closed",
      label: t.statuses?.closed,
      badge: "bg-emerald-50 text-[#105C50] border-emerald-300",
    },
    {
      value: "archived",
      label: t.statuses?.archived,
      badge: "bg-gray-100 text-gray-700 border-gray-300",
    },
  ]

  function getLeadStatusLabel(status: string | null | undefined) {
    const st = status || "new"
    return leadStatuses.find((s) => s.value === st)?.label || st
  }

  const leadCur = getCurrencySymbol(ACTIVE_ADMIN_COUNTRY, locale)

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [leadTypeFilter, setLeadTypeFilter] = useState<
    "all" | "unit_leads" | "general"
  >("all")

  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
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
    const closeMenu = () => setOpenMenuId(null)
    window.addEventListener("click", closeMenu)
    return () => window.removeEventListener("click", closeMenu)
  }, [])

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

  function handleVerifyBuyerContact(userId: string) {
    setNotice(null)
    startTransition(async () => {
      const res = await verifyUserContactByAdminAction({
        userId,
        type: "both",
      })
      if (res.success) {
        setNotice({
          text:
            t.buyerVerifiedSuccess ||
            propAdminDict.notices?.sellerVerifiedSuccess,
        })
        router.refresh()
      } else {
        setNotice({ text: res.error || t.statusUpdateError, isError: true })
      }
    })
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

  const unitLeadsCount = leads.filter(
    (l) =>
      parseLeadDetails({
        lead: l,
        units,
        offers,
        locale,
        dir,
        leadsPrompts,
      }).isUnitLead
  ).length
  const generalLeadsCount = leads.length - unitLeadsCount

  const filtered = leads.filter((l) => {
    const parsed = parseLeadDetails({
      lead: l,
      units,
      offers,
      locale,
      dir,
      leadsPrompts,
    })
    if (leadTypeFilter === "unit_leads" && !parsed.isUnitLead) return false
    if (leadTypeFilter === "general" && parsed.isUnitLead) return false

    const st = l.status || "new"
    if (statusFilter !== "all" && st !== statusFilter) return false

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      const qDigits = q.replace(/\D/g, "")
      const leadPhoneDigits = String(l.phone || "").replace(/\D/g, "")
      const areas = Array.isArray(l.preferred_areas)
        ? l.preferred_areas.join(" ")
        : l.preferred_areas || ""
      const match =
        `${l.name} ${l.phone} ${l.email || ""} ${areas} ${parsed.cleanTargetUnit} ${parsed.unitCode || ""} ${l.payment_plan || ""}`
          .toLowerCase()
          .includes(q) ||
        (qDigits.length >= 5 && leadPhoneDigits.includes(qDigits))

      if (!match) return false
    }
    return true
  })

  function exportLeadsToExcel(
    rowsToExport: BuyerLead[],
    prefix = "AqarExit_Buyers",
    customTitle?: string
  ) {
    const c = expL.cols
    const resolvedTitle =
      customTitle ||
      (rowsToExport.length === 1
        ? `${expL.singleLeadReportTitle} — ${rowsToExport[0].name}`
        : expL.leadsReportTitle)

    downloadExcelCsv({
      filenamePrefix: `${prefix}_${locale.toUpperCase()}`,
      reportTitle: resolvedTitle,
      locale,
      data: rowsToExport,
      columns: [
        { header: c.index, accessor: (_, idx) => idx + 1 },
        { header: c.buyerName, accessor: (l) => l.name },
        { header: c.buyerPhone, accessor: (l) => l.phone, isPhone: true },
        { header: c.buyerEmail, accessor: (l) => l.email || "—" },
        {
          header: c.availableCash,
          accessor: (l) => Number(l.available_cash || l.budget || 0),
        },
        {
          header: c.maxInstallment,
          accessor: (l) => Number(l.max_installment || 0),
        },
        {
          header: c.targetAreas,
          accessor: (l) =>
            parseLeadDetails({
              lead: l,
              units,
              offers,
              locale,
              dir,
              leadsPrompts,
            }).cleanTargetUnit,
        },
        {
          header: c.unitType,
          accessor: (l) =>
            Array.isArray(l.unit_types) && l.unit_types.length > 0
              ? l.unit_types.join(" / ")
              : "—",
        },
        {
          header: c.rooms,
          accessor: (l) => (l.min_rooms ? `+${l.min_rooms}` : "—"),
        },
        {
          header: c.leadType,
          accessor: (l) =>
            parseLeadDetails({
              lead: l,
              units,
              offers,
              locale,
              dir,
              leadsPrompts,
            }).isUnitLead
              ? expL.unitLeadType
              : expL.generalLeadType,
        },
        {
          header: c.notes,
          accessor: (l) =>
            parseLeadDetails({
              lead: l,
              units,
              offers,
              locale,
              dir,
              leadsPrompts,
            }).customerNotes || "—",
        },
        { header: c.status, accessor: (l) => getLeadStatusLabel(l.status) },
        {
          header: c.createdAt,
          accessor: (l) => new Date(l.created_at).toLocaleDateString("en-GB"),
        },
      ],
    })
  }

  function renderThreeDotsMenu(
    lead: BuyerLead,
    parsed: ReturnType<typeof parseLeadDetails>
  ) {
    const isMenuOpen = openMenuId === lead.id

    return (
      <div
        className="relative"
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        <button
          type="button"
          aria-label={expL.moreActionsAria}
          onClick={(e) => {
            e.stopPropagation()
            setOpenMenuId(isMenuOpen ? null : lead.id)
          }}
          className="flex size-8 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-600 transition hover:border-[#105C50] hover:bg-white hover:text-[#0a1122]"
        >
          <MoreVertical className="size-4" />
        </button>

        {isMenuOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute end-0 top-9 z-50 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white p-1.5 shadow-2xl"
          >
            {parsed.isUnitLead && (
              <>
                <Link
                  href={
                    parsed.matchedUnit
                      ? `/opportunities/${parsed.matchedUnit.id}`
                      : `/opportunities?q=${encodeURIComponent(parsed.unitCode || parsed.cleanTargetUnit)}`
                  }
                  target="_blank"
                  onClick={() => setOpenMenuId(null)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-xs font-bold text-[#0a1122] transition hover:bg-gray-50"
                >
                  <ExternalLink className="size-3.5 text-[#105C50]" />
                  <span>{t.unitBtn}</span>
                </Link>

                <Link
                  href={
                    parsed.matchedUnit
                      ? `/admin/properties?unitId=${parsed.matchedUnit.id}`
                      : `/admin/properties`
                  }
                  onClick={() => setOpenMenuId(null)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-xs font-bold text-[#0a1122] transition hover:bg-gray-50"
                >
                  <Building2 className="size-3.5 text-[#105C50]" />
                  <span>{dict.admin?.shell?.nav?.properties}</span>
                </Link>
              </>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setOpenMenuId(null)
                exportLeadsToExcel(
                  [lead],
                  `AqarExit_Buyer_${lead.id.slice(0, 6)}`,
                  `${expL.singleLeadReportTitle} (${lead.name})`
                )
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-xs font-bold text-blue-700 transition hover:bg-blue-50"
            >
              <Download className="size-3.5 text-blue-600" />
              <span>{expL.exportRowBtn}</span>
            </button>

            <div className="my-1 border-t border-gray-100" />

            <button
              type="button"
              disabled={pending}
              onClick={(e) => {
                e.stopPropagation()
                setOpenMenuId(null)
                setConfirmAction({
                  type: "delete",
                  lead,
                })
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-xs font-bold text-red-600 transition hover:bg-red-50"
            >
              <Trash2 className="size-3.5 text-red-600" />
              <span>{t.deleteBtn}</span>
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div dir={dir} className="text-start">
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

      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-gray-200/80 bg-white p-3.5 shadow-2xs sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex w-full items-center gap-2 sm:max-w-md sm:flex-1">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 end-3 size-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="h-9 w-full rounded-lg border border-gray-200 ps-3 pe-9 text-xs font-semibold focus:border-[#105C50] focus:outline-none"
            />
          </div>

          <button
            type="button"
            disabled={filtered.length === 0}
            onClick={() =>
              exportLeadsToExcel(
                filtered,
                "AqarExit_Buyers_Leads",
                expL.leadsReportTitle
              )
            }
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-extrabold text-[#105C50] transition hover:bg-[#105C50] hover:text-white disabled:opacity-40"
          >
            <Download className="size-3.5" />
            <span>{expL.exportAllBtn}</span>
          </button>
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
      <div className="space-y-3.5 md:hidden">
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
            const parsed = parseLeadDetails({
              lead,
              units,
              offers,
              locale,
              dir,
              leadsPrompts,
            })
            const matchedUnits = getMatchedUnitsForLead(lead)
            const typesText = Array.isArray(lead.unit_types)
              ? lead.unit_types.join("، ")
              : "—"
            const isCardLoading = pending && activeLeadId === lead.id
            const isHighlighted = highlightedLeadId === lead.id
            const firstLetter = lead.name.trim().charAt(0) || "U"
            const phoneOk = isBuyerPhoneVerified(lead, verificationMap)

            const waText = buildLeadWhatsAppMessage({
              lead,
              parsed,
              leadCur,
              locale,
              t,
              leadsPrompts,
            })

            return (
              <div
                id={`lead-row-${lead.id}`}
                key={lead.id}
                className={`relative rounded-2xl border bg-white p-4 shadow-xs transition ${
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
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/65 backdrop-blur-[1px]">
                    <div className="flex items-center gap-2 rounded-full bg-[#0a1122] px-4 py-2 text-xs font-bold text-white shadow-md">
                      <Loader2 className="size-4 animate-spin text-emerald-400" />
                      <span>{t.updatingText}</span>
                    </div>
                  </div>
                )}

                {parsed.isUnitLead && (
                  <div className="-mx-4 -mt-4 mb-3 flex items-center justify-between rounded-t-2xl border-b border-orange-200/80 bg-orange-50/90 px-4 py-2 text-[11px] font-extrabold text-orange-900">
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
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <div
                      className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
                        parsed.isUnitLead
                          ? "bg-orange-100 text-orange-800"
                          : "bg-[#105C50]/10 text-[#105C50]"
                      }`}
                    >
                      {firstLetter}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-xs font-extrabold text-[#0a1122] sm:text-sm">
                        {lead.name}
                      </h3>
                      <div
                        dir="ltr"
                        className="mt-0.5 flex items-center justify-start gap-1 text-xs font-medium text-gray-500"
                      >
                        <Phone className="size-3 text-gray-400" />
                        <span>{lead.phone}</span>
                        {phoneOk && (
                          <CheckCircle2 className="size-3.5 text-[#105C50]" />
                        )}
                      </div>
                    </div>
                  </div>

                  {renderThreeDotsMenu(lead, parsed)}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {matchedUnits.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSmartMatchLead(lead)}
                      className="inline-flex items-center gap-1 rounded-md border border-teal-300 bg-teal-50/80 px-2.5 py-0.5 text-[10.5px] font-extrabold text-[#105C50] transition hover:bg-[#105C50] hover:text-white"
                    >
                      <span>🎯</span>
                      <span>
                        {matchedUnits.length} {sm.matchedUnitsShort}
                      </span>
                    </button>
                  )}
                  {renderLeadOfferBadges(lead, parsed)}
                </div>

                {parsed.readinessBadge && (
                  <div className="mt-2">
                    <span
                      className={`inline-block rounded-lg px-2.5 py-1 text-[11px] font-extrabold ${parsed.readinessBadge.className}`}
                    >
                      {parsed.readinessBadge.text}
                    </span>
                  </div>
                )}

                <div className="mt-2.5 grid grid-cols-2 gap-2.5 rounded-xl border border-gray-100 bg-gray-50/80 p-2.5 text-xs">
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
                    className={`h-9 w-full rounded-lg border px-3 text-xs font-extrabold focus:outline-none ${stObj.badge}`}
                  >
                    {leadStatuses.map((st) => (
                      <option
                        key={st.value}
                        value={st.value}
                        className="bg-white text-[#0a1122]"
                      >
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-2.5 flex items-center gap-2 border-t border-gray-100 pt-2.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8.5 flex-1 rounded-xl text-xs font-bold"
                    onClick={() => setDetailsLead(lead)}
                  >
                    <Eye className="me-1 size-3.5 text-[#105C50]" />
                    {propAdminDict.actions?.detailsBtn || t.unitBtn}
                  </Button>

                  <a
                    data-admin-client-wa="true"
                    href={`https://wa.me/${String(lead.phone).replace(/\D/g, "")}?text=${encodeURIComponent(waText)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-8.5 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-3 text-xs font-bold text-white transition hover:opacity-90"
                  >
                    <MessageCircle className="size-3.5" />
                    <span>{t.whatsappBtn}</span>
                  </a>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 2. عرض الكمبيوتر الاحترافي */}
      <div className="hidden md:block">
        <div className="mb-3 flex items-center justify-between rounded-xl border border-gray-200/85 bg-white px-5 py-3.5 shadow-2xs">
          <div>
            <h2 className="text-sm font-extrabold text-[#0a1122] sm:text-base">
              {t.allOrdersTitle} ({filtered.length})
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">{t.allOrdersDesc}</p>
          </div>
        </div>

        <div className="mb-2.5 grid grid-cols-12 items-center gap-4 rounded-xl border border-slate-200/90 bg-slate-100/90 px-5 py-3 text-[11px] font-extrabold text-slate-600">
          <div className="col-span-3">{t.colBuyer}</div>
          <div className="col-span-2">{t.colCash}</div>
          <div className="col-span-3">{t.colTarget}</div>
          <div className="col-span-2">{t.colStatus}</div>
          <div className="col-span-2 text-end">{t.colAction}</div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-xs font-bold text-gray-400">
            {t.emptyText}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((lead, index) => {
              const currentSt = lead.status || "new"
              const stObj =
                leadStatuses.find((s) => s.value === currentSt) ||
                leadStatuses[0]
              const parsed = parseLeadDetails({
                lead,
                units,
                offers,
                locale,
                dir,
                leadsPrompts,
              })
              const matchedUnits = getMatchedUnitsForLead(lead)
              const typesText = Array.isArray(lead.unit_types)
                ? lead.unit_types.join("، ")
                : "—"
              const isRowLoading = pending && activeLeadId === lead.id
              const isHighlighted = highlightedLeadId === lead.id
              const phoneOk = isBuyerPhoneVerified(lead, verificationMap)
              const emailOk = isBuyerEmailVerified(lead, verificationMap)

              const waText = buildLeadWhatsAppMessage({
                lead,
                parsed,
                leadCur,
                locale,
                t,
                leadsPrompts,
              })

              return (
                <div
                  id={`lead-row-${lead.id}`}
                  key={lead.id}
                  className={`grid grid-cols-12 items-center gap-4 rounded-2xl border-2 bg-white px-5 py-4 shadow-2xs transition-all hover:shadow-md ${
                    isRowLoading
                      ? "border-[#105C50] bg-emerald-50/40 opacity-70"
                      : isHighlighted
                        ? "border-[#105C50] bg-emerald-50/70 ring-2 ring-[#105C50]/20"
                        : parsed.isUnitLead
                          ? "border-orange-200/90 border-s-4 border-s-orange-500"
                          : "border-slate-200/90 border-s-4 border-s-[#105C50]"
                  }`}
                >
                  <div className="col-span-3 min-w-0 pe-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-black text-slate-600">
                        {index + 1}
                      </span>
                      <span className="truncate text-sm font-black text-[#0a1122]">
                        {lead.name}
                      </span>
                      {parsed.isUnitLead ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-orange-100 px-2 py-0.5 text-[10px] font-extrabold text-orange-800">
                          <Flame className="size-3 fill-orange-500 text-orange-600" />
                          {t.unitBadge} {parsed.unitCode || ""}
                        </span>
                      ) : (
                        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                          {t.generalTab}
                        </span>
                      )}
                      {isRowLoading && (
                        <Loader2 className="size-3.5 animate-spin text-[#105C50]" />
                      )}
                    </div>

                    <div
                      dir="ltr"
                      className="mt-1 flex items-center justify-start gap-1 ps-7 font-mono text-[11.5px] font-bold text-slate-700"
                    >
                      <span>{lead.phone}</span>
                      {phoneOk && (
                        <span
                          title={propAdminDict.badges?.phoneVerifiedBadge}
                          className="inline-flex text-[#105C50]"
                        >
                          <CheckCircle2 className="size-3.5" />
                        </span>
                      )}
                    </div>

                    {lead.email && (
                      <div className="mt-0.5 flex items-center gap-1 truncate ps-7 text-[10.5px] text-slate-400">
                        <span className="truncate">{lead.email}</span>
                        {emailOk && (
                          <span
                            title={propAdminDict.badges?.emailVerifiedBadge}
                            className="inline-flex shrink-0 text-[#105C50]"
                          >
                            <CheckCircle2 className="size-3" />
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-1.5 ps-7">
                      {matchedUnits.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSmartMatchLead(lead)}
                          className="inline-flex items-center gap-1 rounded-md border border-teal-300 bg-teal-50/80 px-2.5 py-0.5 text-[10.5px] font-extrabold text-[#105C50] transition hover:bg-[#105C50] hover:text-white"
                        >
                          <span>🎯</span>
                          <span>
                            {matchedUnits.length} {sm.matchedUnitsShort}
                          </span>
                        </button>
                      )}
                    </div>
                    <div className="ps-7">
                      {renderLeadOfferBadges(lead, parsed)}
                    </div>
                  </div>

                  <div className="col-span-2 border-s border-slate-100 ps-4 whitespace-nowrap">
                    <span className="block text-[10px] font-bold text-slate-400">
                      {t.cashLabel}
                    </span>
                    <div
                      dir="ltr"
                      className="mt-0.5 text-base font-black text-[#105C50] tabular-nums"
                    >
                      {leadCur}
                      {Number(
                        lead.available_cash || lead.budget || 0
                      ).toLocaleString("en-US")}
                    </div>
                    <div className="mt-1.5 border-t border-slate-100 pt-1 text-[11px] text-slate-500 tabular-nums">
                      <span>{t.installmentLabel} </span>
                      <strong dir="ltr" className="font-bold text-[#0a1122]">
                        {leadCur}
                        {Number(lead.max_installment || 0).toLocaleString(
                          "en-US"
                        )}
                      </strong>
                    </div>
                  </div>

                  <div className="col-span-3 min-w-0 border-s border-slate-100 ps-4">
                    <div className="truncate text-xs font-extrabold text-[#0a1122]">
                      {parsed.cleanTargetUnit}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
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
                    <div
                      dir="ltr"
                      className="mt-1 text-start font-mono text-[10.5px] text-slate-400"
                    >
                      📅 {new Date(lead.created_at).toLocaleDateString("en-GB")}
                    </div>
                    {parsed.customerNotes && (
                      <div className="mt-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] text-amber-900">
                        <strong>{t.customerNotesLabel}</strong>{" "}
                        {parsed.customerNotes}
                      </div>
                    )}
                  </div>

                  <div className="col-span-2 border-s border-slate-100 ps-4">
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
                      className={`h-9 w-full cursor-pointer rounded-xl border px-3 text-xs font-extrabold transition focus:outline-none ${stObj.badge}`}
                    >
                      {leadStatuses.map((st) => (
                        <option
                          key={st.value}
                          value={st.value}
                          className="bg-white text-[#0a1122]"
                        >
                          {st.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-1.5 border-s border-slate-100 ps-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-lg px-3 text-[11px] font-bold"
                      onClick={() => setDetailsLead(lead)}
                    >
                      <Eye className="me-1 size-3.5 text-[#105C50]" />
                      <span>
                        {propAdminDict.actions?.detailsBtn || t.unitBtn}
                      </span>
                    </Button>

                    <a
                      data-admin-client-wa="true"
                      href={`https://wa.me/${String(lead.phone).replace(/\D/g, "")}?text=${encodeURIComponent(waText)}`}
                      target="_blank"
                      rel="noreferrer"
                      title={t.whatsappBtn}
                      className="inline-flex size-8 items-center justify-center rounded-lg bg-[#25D366] text-white transition hover:opacity-90"
                    >
                      <MessageCircle className="size-3.5" />
                    </a>

                    {renderThreeDotsMenu(lead, parsed)}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <BuyerSmartMatchModal
        lead={smartMatchLead}
        units={units}
        offers={offers}
        onClose={() => setSmartMatchLead(null)}
        onNotice={(msg) => setNotice(msg)}
      />

      <LeadDetailsDialog
        dir={dir}
        t={t}
        propAdminDict={propAdminDict}
        publicSiteLabel={dict.admin?.shell?.publicSite || ""}
        propertiesNavLabel={dict.admin?.shell?.nav?.properties || ""}
        openInDealsRoomLabel={dashDict.openInDealsRoomBtn || ""}
        detailsLead={detailsLead}
        parsed={
          detailsLead
            ? parseLeadDetails({
                lead: detailsLead,
                units,
                offers,
                locale,
                dir,
                leadsPrompts,
              })
            : null
        }
        leadCur={leadCur}
        waText={
          detailsLead
            ? buildLeadWhatsAppMessage({
                lead: detailsLead,
                parsed: parseLeadDetails({
                  lead: detailsLead,
                  units,
                  offers,
                  locale,
                  dir,
                  leadsPrompts,
                }),
                leadCur,
                locale,
                t,
                leadsPrompts,
              })
            : ""
        }
        verificationMap={verificationMap}
        onVerifyBuyerContact={handleVerifyBuyerContact}
        pending={pending}
        onClose={() => setDetailsLead(null)}
      />

      <LeadConfirmDialog
        dir={dir}
        t={t}
        confirmAction={confirmAction}
        pending={pending}
        getLeadStatusLabel={getLeadStatusLabel}
        onClose={closeConfirmModal}
        onExecute={executeConfirmedAction}
      />
    </div>
  )
}
