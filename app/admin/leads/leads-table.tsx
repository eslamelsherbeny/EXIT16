"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Download,
  Eye,
  FileText,
  Flame,
  Handshake,
  Loader2,
  MapPin,
  MessageCircle,
  MoreVertical,
  Phone,
  Search,
  Target,
  Trash2,
  Trophy,
  User,
  Wallet,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  downloadExcelCsv,
  downloadOfficialPdfReport,
  EXPORT_LABELS,
} from "@/lib/export-csv"
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
  deriveShortUnitCode,
  getLeadUiMicroLabels,
  isBuyerEmailVerified,
  isBuyerPhoneVerified,
  isOfferOwnedByLead,
  normalizeOfferStatus,
  parseLeadDetails,
  type BuyerLead,
  type ConfirmLeadAction,
  type LinkedUnitSummary,
  type UserVerificationBadgeInfo,
} from "./leads-helpers"
import {
  LeadConfirmDialog,
  LeadDetailsDialog,
  LeadOffersLogDialog,
} from "./leads-modals"

export type { BuyerLead, LinkedUnitSummary, UserVerificationBadgeInfo }

type LeadStatusOption = {
  value: string
  label: string
  badge: string
}

function isUnitEligibleForLeadMatch(status?: string | null): boolean {
  const clean = String(status || "active").trim().toLowerCase()
  return (
    clean === "active" ||
    clean === "approved" ||
    clean === "published" ||
    clean === "offer_received" ||
    clean === "transferring"
  )
}

function getEffectiveLeadStatus(
  lead: BuyerLead,
  parsed: ReturnType<typeof parseLeadDetails>,
  units: LinkedUnitSummary[]
): string {
  const raw = String(lead.status || "new").trim().toLowerCase()
  if (raw !== "new" && raw !== "") return raw

  const hasCompletedPurchase = parsed.directOffers.some((o) => {
    if (o.status !== "accepted") return false
    const u = units.find((item) => String(item.id) === String(o.property_id))
    return String(u?.status || "").trim().toLowerCase() === "sold"
  })

  if (hasCompletedPurchase) return "closed"
  if (parsed.directOffers.some((o) => o.status !== "rejected")) return "matched"
  return "new"
}

function findCompletedPurchaseDeal(
  parsed: ReturnType<typeof parseLeadDetails>,
  units: LinkedUnitSummary[]
) {
  const soldOffer = parsed.directOffers.find((o) => {
    if (o.status !== "accepted") return false
    const u = units.find((item) => String(item.id) === String(o.property_id))
    return String(u?.status || "").trim().toLowerCase() === "sold"
  })
  if (!soldOffer) return null
  const unit =
    units.find((item) => String(item.id) === String(soldOffer.property_id)) ||
    null
  return { offer: soldOffer, unit }
}

function StatusSelectBox({
  value,
  options,
  badgeClass,
  disabled,
  onChange,
}: {
  value: string
  options: LeadStatusOption[]
  badgeClass: string
  disabled: boolean
  onChange: (next: string) => void
}) {
  return (
    <div className="relative w-full">
      <select
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-9 w-full cursor-pointer appearance-none rounded-xl border px-7 text-center text-[11.5px] font-extrabold transition focus:outline-none [text-align-last:center] disabled:opacity-50 ${badgeClass}`}
      >
        {options.map((st) => (
          <option
            key={st.value}
            value={st.value}
            className="bg-white text-xs text-[#0f1d40]"
          >
            {st.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 end-2.5 size-3.5 -translate-y-1/2 opacity-70" />
    </div>
  )
}

function BuyerOffersLogButton({
  offers,
  units,
  label,
  onClick,
}: {
  offers: any[]
  units: LinkedUnitSummary[]
  label: string
  onClick: () => void
}) {
  if (!offers || offers.length === 0) return null

  const hasActiveAccepted = offers.some((o) => {
    if (o.status !== "accepted") return false
    const u = units.find((item) => String(item.id) === String(o.property_id))
    return String(u?.status || "").trim().toLowerCase() !== "sold"
  })
  const hasPendingAdmin = offers.some((o) => o.status === "pending_admin")
  const hasNegotiating = offers.some(
    (o) => o.status === "pending_seller" || o.status === "counter_offered"
  )

  const toneClass = hasActiveAccepted
    ? "border-emerald-300 bg-emerald-50 text-[#007a5a] hover:bg-[#007a5a] hover:text-white"
    : hasPendingAdmin
      ? "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-500 hover:text-white"
      : hasNegotiating
        ? "border-purple-200 bg-purple-50 text-purple-900 hover:bg-purple-600 hover:text-white"
        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"

  const dotClass = hasActiveAccepted
    ? "bg-[#007a5a]"
    : hasPendingAdmin
      ? "bg-amber-500"
      : hasNegotiating
        ? "bg-purple-600"
        : "bg-slate-400"

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex h-8 items-center gap-1.5 rounded-xl border px-3 text-[11px] font-extrabold shadow-2xs transition ${toneClass}`}
    >
      <span
        className={`size-2 shrink-0 rounded-full group-hover:bg-white ${dotClass}`}
      />
      <ClipboardList className="size-3.5 shrink-0" />
      <span>
        {label} ({offers.length})
      </span>
    </button>
  )
}

function CompletedPurchaseSummaryBanner({
  deal,
  leadCur,
  locale,
}: {
  deal: { offer: any; unit: LinkedUnitSummary | null } | null
  leadCur: string
  locale: string
}) {
  if (!deal) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-[#eaf8f2] px-3 py-1.5 text-[11px] font-extrabold text-[#007a5a]">
        <Trophy className="size-3.5 shrink-0" />
        <span>
          {locale === "en"
            ? "Purchase completed — request closed"
            : "تم إتمام الشراء وإغلاق هذا الطلب بنجاح"}
        </span>
      </span>
    )
  }

  const uCode = deal.unit
    ? deriveShortUnitCode(deal.unit.id, deal.unit.code)
    : ""
  const projName = deal.unit?.project_name || "—"
  const ownerName = deal.unit?.name || ""
  const amount = `${leadCur}${Number(deal.offer.offered_cash || deal.unit?.paid_amount || 0).toLocaleString("en-US")}`

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex flex-wrap items-center gap-1.5 rounded-xl border border-emerald-200 bg-[#eaf8f2] px-3 py-1.5 text-[11px] font-extrabold text-[#0f1d40]">
        <Trophy className="size-3.5 shrink-0 text-[#007a5a]" />
        <span>
          {locale === "en" ? (
            <>
              Purchased <strong className="text-[#007a5a]">{projName}</strong>{" "}
              {uCode ? `(${uCode})` : ""}
              {ownerName ? ` from ${ownerName}` : ""} —{" "}
              <strong dir="ltr" className="inline-block text-[#007a5a]">
                {amount}
              </strong>
            </>
          ) : (
            <>
              قام بشراء وحدة{" "}
              <strong className="text-[#007a5a]">{projName}</strong>{" "}
              {uCode ? `(${uCode})` : ""}
              {ownerName ? ` من ${ownerName}` : ""} بـ{" "}
              <strong dir="ltr" className="inline-block text-[#007a5a]">
                {amount}
              </strong>
            </>
          )}
        </span>
      </span>

      <Link
        href={`/admin/deals?offerId=${deal.offer.id}`}
        className="inline-flex h-8 items-center gap-1 rounded-xl bg-[#0f1d40] px-3 text-[11px] font-extrabold text-white transition hover:bg-[#1e293b]"
      >
        <Handshake className="size-3.5 text-emerald-300" />
        <span>{locale === "en" ? "View Deal" : "تفاصيل الصفقة"}</span>
      </Link>
    </div>
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
  const ui = getLeadUiMicroLabels(locale)

  const adminDict = (dict?.admin as Record<string, any>) || {}
  const t = adminDict.leadsAdmin || {}
  const leadsPrompts = adminDict.leads || {}
  const propAdminDict = adminDict.propertiesAdmin || {}
  const dashDict = adminDict.dashboard || {}
  const sm = adminDict.smartMatch || {}
  const expL = EXPORT_LABELS[locale] || EXPORT_LABELS.ar
  const propertiesNavLabel = dict.admin?.shell?.nav?.properties || ""
  const listSep = dir === "rtl" ? "، " : ", "

  const leadStatuses: LeadStatusOption[] = [
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
      label: locale === "ar" ? "تم الشراء بنجاح" : t.statuses?.closed,
      badge: "bg-[#eaf8f2] text-[#007a5a] border-emerald-300",
    },
    {
      value: "archived",
      label: t.statuses?.archived,
      badge: "bg-slate-100 text-slate-700 border-slate-300",
    },
  ]

  function getLeadStatusLabel(status: string | null | undefined) {
    const st = status || "new"
    return leadStatuses.find((s) => s.value === st)?.label || st
  }

  const leadCur = getCurrencySymbol(ACTIVE_ADMIN_COUNTRY, locale)

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [highlightedLeadId, setHighlightedLeadId] = useState<string | null>(
    null
  )
  const [detailsLead, setDetailsLead] = useState<BuyerLead | null>(null)
  const [offersLogLead, setOffersLogLead] = useState<BuyerLead | null>(null)
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

  function getMatchedUnitsForLead(lead: BuyerLead) {
    if (!units || units.length === 0) return []
    const leadPhoneDigits = String(lead.phone || "").replace(/\D/g, "")

    const activeOfferedUnitIds = new Set(
      (offers || [])
        .map((o) => ({ ...o, status: normalizeOfferStatus(o) }))
        .filter((o) => {
          if (o.status === "recommended" || o.status === "rejected")
            return false
          return isOfferOwnedByLead(o, lead)
        })
        .map((o) => String(o.property_id))
    )

    const eligibleUnits = units.filter((u) => {
      if (!isUnitEligibleForLeadMatch(u.status)) return false
      if (activeOfferedUnitIds.has(String(u.id))) return false
      if (
        lead.user_id &&
        u.user_id &&
        String(u.user_id) === String(lead.user_id)
      )
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
      .sort((a, b) => {
        if (b.match.score !== a.match.score) {
          return b.match.score - a.match.score
        }
        return a.match.differences.length - b.match.differences.length
      })
  }

  const generalSearchEntries = useMemo(() => {
    return leads
      .map((lead) => ({
        lead,
        parsed: parseLeadDetails({
          lead,
          units,
          offers,
          locale,
          dir,
          leadsPrompts,
        }),
      }))
      .filter((entry) => !entry.parsed.isPureUnitInquiry)
  }, [leads, units, offers, locale, dir, leadsPrompts])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const { lead, parsed } of generalSearchEntries) {
      const st = getEffectiveLeadStatus(lead, parsed, units)
      counts[st] = (counts[st] || 0) + 1
    }
    return counts
  }, [generalSearchEntries, units])

  useEffect(() => {
    const closeMenu = () => setOpenMenuId(null)
    window.addEventListener("click", closeMenu)
    return () => window.removeEventListener("click", closeMenu)
  }, [])

  useEffect(() => {
    const leadIdParam = searchParams.get("leadId")
    const verifyPhoneUserIdParam = searchParams.get("verifyPhoneUserId")

    if (verifyPhoneUserIdParam) {
      const alreadyVerified =
        verificationMap?.[verifyPhoneUserIdParam]?.phoneVerified
      if (!alreadyVerified) {
        handleVerifyBuyerContact(verifyPhoneUserIdParam)
      }
    }

    if (leadIdParam) {
      setHighlightedLeadId(leadIdParam)
      setTimeout(() => {
        document
          .getElementById(`lead-row-${leadIdParam}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 250)
    }
  }, [searchParams])

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
            setNotice({
              text: `${t.statusUpdatedSuccess} ("${target.name}" → ${getLeadStatusLabel(confirmAction.newStatus)})`,
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
            setNotice({ text: `${t.deletedSuccess} ("${target.name}")` })
            router.refresh()
          } else {
            setNotice({ text: res.error || t.deleteError, isError: true })
          }
        }
      } finally {
        setConfirmAction(null)
        setActiveLeadId(null)
      }
    })
  }

  const filteredGeneral = generalSearchEntries
    .filter(({ lead, parsed }) => {
      const st = getEffectiveLeadStatus(lead, parsed, units)
      if (statusFilter !== "all" && st !== statusFilter) return false
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const qDigits = q.replace(/\D/g, "")
        const leadPhoneDigits = String(lead.phone || "").replace(/\D/g, "")
        const areas = parsed.preferredAreasList.join(" ")
        const match =
          `${lead.name} ${lead.phone} ${lead.email || ""} ${areas} ${parsed.cleanTargetUnit} ${lead.payment_plan || ""}`
            .toLowerCase()
            .includes(q) ||
          (qDigits.length >= 5 && leadPhoneDigits.includes(qDigits))
        if (!match) return false
      }
      return true
    })
    .sort((a, b) => {
      const stA = getEffectiveLeadStatus(a.lead, a.parsed, units)
      const stB = getEffectiveLeadStatus(b.lead, b.parsed, units)
      const rank = (s: string) => (s === "archived" ? 3 : s === "closed" ? 2 : 1)
      const diff = rank(stA) - rank(stB)
      if (diff !== 0) return diff
      return (
        new Date(b.lead.created_at).getTime() -
        new Date(a.lead.created_at).getTime()
      )
    })

  function exportLeadsReport(
    rowsToExport: BuyerLead[],
    format: "excel" | "pdf" = "excel",
    prefix = "AqarExit_Buyers",
    customTitle?: string
  ) {
    const c = expL.cols
    const resolvedTitle =
      customTitle ||
      (rowsToExport.length === 1
        ? `${expL.singleLeadReportTitle} — ${rowsToExport[0].name}`
        : expL.leadsReportTitle)

    const columns = [
      { header: c.index, accessor: (_: BuyerLead, idx: number) => idx + 1 },
      { header: c.buyerName, accessor: (l: BuyerLead) => l.name },
      {
        header: c.buyerPhone,
        accessor: (l: BuyerLead) => l.phone,
        isPhone: true,
      },
      { header: c.buyerEmail, accessor: (l: BuyerLead) => l.email || "—" },
      {
        header: c.availableCash,
        accessor: (l: BuyerLead) => Number(l.available_cash || l.budget || 0),
      },
      {
        header: c.maxInstallment,
        accessor: (l: BuyerLead) => Number(l.max_installment || 0),
      },
      {
        header: c.targetAreas,
        accessor: (l: BuyerLead) =>
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
        accessor: (l: BuyerLead) =>
          Array.isArray(l.unit_types) && l.unit_types.length > 0
            ? l.unit_types.join(" / ")
            : "—",
      },
      {
        header: c.rooms,
        accessor: (l: BuyerLead) => (l.min_rooms ? `+${l.min_rooms}` : "—"),
      },
      {
        header: c.status,
        accessor: (l: BuyerLead) => getLeadStatusLabel(l.status),
      },
      {
        header: c.createdAt,
        accessor: (l: BuyerLead) =>
          new Date(l.created_at).toLocaleDateString("en-GB"),
      },
    ]

    if (format === "pdf") {
      downloadOfficialPdfReport({
        filenamePrefix: `${prefix}_${locale.toUpperCase()}`,
        reportTitle: resolvedTitle,
        locale,
        columns,
        data: rowsToExport,
      })
    } else {
      downloadExcelCsv({
        filenamePrefix: `${prefix}_${locale.toUpperCase()}`,
        reportTitle: resolvedTitle,
        locale,
        columns,
        data: rowsToExport,
      })
    }
  }

  function renderThreeDotsMenu(menuKey: string, lead: BuyerLead) {
    const isMenuOpen = openMenuId === menuKey
    return (
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          aria-label={expL.moreActionsAria}
          onClick={(e) => {
            e.stopPropagation()
            setOpenMenuId(isMenuOpen ? null : menuKey)
          }}
          className="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-[#007a5a] hover:bg-slate-50 hover:text-[#0f1d40]"
        >
          <MoreVertical className="size-4" />
        </button>

        {isMenuOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute end-0 top-9 z-50 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setOpenMenuId(null)
                exportLeadsReport(
                  [lead],
                  "excel",
                  `AqarExit_Buyer_${lead.id.slice(0, 6)}`,
                  `${expL.singleLeadReportTitle} (${lead.name})`
                )
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-xs font-bold text-[#007a5a] transition hover:bg-[#eaf8f2]"
            >
              <Download className="size-3.5 text-[#007a5a]" />
              <span>{expL.exportRowBtn}</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setOpenMenuId(null)
                exportLeadsReport(
                  [lead],
                  "pdf",
                  `AqarExit_Buyer_${lead.id.slice(0, 6)}`,
                  `${expL.singleLeadReportTitle} (${lead.name})`
                )
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-xs font-bold text-blue-700 transition hover:bg-blue-50"
            >
              <FileText className="size-3.5 text-blue-600" />
              <span>{expL.exportRowPdfBtn}</span>
            </button>

            <div className="my-1 border-t border-slate-100" />

            <button
              type="button"
              disabled={pending}
              onClick={(e) => {
                e.stopPropagation()
                setOpenMenuId(null)
                setConfirmAction({ type: "delete", lead })
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

  const currentExportRows = filteredGeneral.map((e) => e.lead)

  const modalParsed = detailsLead
    ? parseLeadDetails({
        lead: detailsLead,
        units,
        offers,
        locale,
        dir,
        leadsPrompts,
      })
    : null

  const offersLogEntry = offersLogLead
    ? generalSearchEntries.find((e) => e.lead.id === offersLogLead.id) || null
    : null

  return (
    <div dir={dir} className="text-start">
      {notice && (
        <div
          role="status"
          className={`mb-4 flex items-center justify-between gap-3 rounded-xl border p-3.5 text-xs font-bold shadow-xs sm:text-sm ${
            notice.isError
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-[#eaf8f2] text-[#007a5a]"
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.isError ? (
              <AlertTriangle className="size-4 shrink-0 text-red-600" />
            ) : (
              <CheckCircle2 className="size-4 shrink-0 text-[#007a5a]" />
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

      {/* شريط البحث والفلاتر والتصدير */}
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex w-full flex-wrap items-center gap-2 sm:max-w-xl sm:flex-1">
          <div className="relative min-w-[180px] flex-1">
            <Search className="pointer-events-none absolute top-1/2 end-3 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 ps-3 pe-9 text-xs font-semibold focus:border-[#007a5a] focus:bg-white focus:outline-none"
            />
          </div>

          <button
            type="button"
            disabled={currentExportRows.length === 0}
            onClick={() =>
              exportLeadsReport(
                currentExportRows,
                "excel",
                "AqarExit_Search_Profiles",
                ui.searchProfilesTab
              )
            }
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-emerald-200 bg-[#eaf8f2] px-3 text-xs font-extrabold text-[#007a5a] transition hover:bg-[#007a5a] hover:text-white disabled:opacity-40"
          >
            <Download className="size-3.5" />
            <span>{expL.exportAllBtn}</span>
          </button>

          <button
            type="button"
            disabled={currentExportRows.length === 0}
            onClick={() =>
              exportLeadsReport(
                currentExportRows,
                "pdf",
                "AqarExit_Search_Profiles",
                ui.searchProfilesTab
              )
            }
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-800 px-3 text-xs font-extrabold text-white transition hover:bg-slate-900 disabled:opacity-40"
          >
            <FileText className="size-3.5 text-emerald-300" />
            <span>{expL.exportPdfBtn}</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              statusFilter === "all"
                ? "bg-[#007a5a] text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {t.allTab} ({generalSearchEntries.length})
          </button>
          {leadStatuses.map((st) => (
            <button
              key={st.value}
              type="button"
              onClick={() => setStatusFilter(st.value)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                statusFilter === st.value
                  ? "bg-[#007a5a] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st.label} ({statusCounts[st.value] || 0})
            </button>
          ))}
        </div>
      </div>

      {/* 1. عرض الموبايل */}
      <div className="space-y-3.5 md:hidden">
        {filteredGeneral.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-400">
            {t.emptyText}
          </div>
        ) : (
          filteredGeneral.map(({ lead, parsed }) => {
            const currentSt = getEffectiveLeadStatus(lead, parsed, units)
            const isClosedDeal = currentSt === "closed"
            const completedDeal = isClosedDeal
              ? findCompletedPurchaseDeal(parsed, units)
              : null
            const stObj =
              leadStatuses.find((s) => s.value === currentSt) ||
              leadStatuses[0]
            const matchedUnitsCount = isClosedDeal
              ? 0
              : getMatchedUnitsForLead(lead).length
            const phoneOk = isBuyerPhoneVerified(lead, verificationMap)
            const emailOk = isBuyerEmailVerified(lead, verificationMap)
            const typesText = Array.isArray(lead.unit_types)
              ? lead.unit_types.join(listSep)
              : "—"
            const isLoading = pending && activeLeadId === lead.id
            const isHighlighted = highlightedLeadId === lead.id
            const showTargetBudget =
              Number(lead.budget || 0) > Number(lead.available_cash || 0)

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
                className={`relative overflow-visible rounded-2xl border bg-white shadow-xs transition ${
                  isLoading
                    ? "border-[#007a5a] opacity-75"
                    : isHighlighted
                      ? "border-2 border-[#007a5a] ring-2 ring-[#007a5a]/25"
                      : isClosedDeal
                        ? "border-emerald-200/90 bg-slate-50/40 border-s-4 border-s-[#0f1d40]"
                        : parsed.isDirectUnitSource
                          ? "border-slate-200/90 border-s-4 border-s-orange-500"
                          : "border-slate-200/90 border-s-4 border-s-[#007a5a]"
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="truncate text-sm font-black text-[#0f1d40]">
                          {lead.name}
                        </h3>
                        {parsed.isDirectUnitSource ? (
                          <span className="inline-flex items-center gap-0.5 rounded-md bg-orange-100 px-1.5 py-0.5 text-[10px] font-extrabold text-orange-800">
                            <Flame className="size-2.5" />
                            <span>{ui.sourceDirectOfferBadge}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-[#eaf8f2] px-1.5 py-0.5 text-[10px] font-extrabold text-[#007a5a]">
                            {ui.sourceSearchBadge}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-[11.5px] font-bold text-slate-700">
                        <Phone className="size-3 shrink-0 text-slate-400" />
                        <span dir="ltr" className="font-mono">
                          {lead.phone}
                        </span>
                        {phoneOk && (
                          <CheckCircle2 className="size-3.5 shrink-0 text-[#007a5a]" />
                        )}
                      </div>
                      {lead.email && (
                        <div className="mt-0.5 flex items-center gap-1 text-[10.5px] text-slate-500">
                          <span dir="ltr" className="break-all">
                            {lead.email}
                          </span>
                          {emailOk && (
                            <CheckCircle2 className="size-3.5 shrink-0 text-[#007a5a]" />
                          )}
                        </div>
                      )}
                    </div>

                    {renderThreeDotsMenu(`mob_${lead.id}`, lead)}
                  </div>

                  <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 text-xs">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="text-start">
                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                          <Wallet className="size-3 text-[#007a5a]" />
                          <span>{t.cashLabel}</span>
                        </span>
                        <div className="mt-0.5">
                          <strong
                            dir="ltr"
                            className="inline-block text-sm font-black text-[#007a5a] tabular-nums"
                          >
                            {leadCur}
                            {Number(
                              lead.available_cash || lead.budget || 0
                            ).toLocaleString("en-US")}
                          </strong>
                        </div>
                      </div>

                      <div className="border-s border-slate-200/70 ps-2.5 text-start">
                        <span className="block text-[10px] font-bold text-slate-400">
                          {t.installmentLabel}
                        </span>
                        <div className="mt-0.5">
                          <strong
                            dir="ltr"
                            className="inline-block text-sm font-black text-[#0f1d40] tabular-nums"
                          >
                            {leadCur}
                            {Number(lead.max_installment || 0).toLocaleString(
                              "en-US"
                            )}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {showTargetBudget && (
                      <div className="mt-2 flex items-center justify-between border-t border-slate-200/60 pt-1.5 text-[11px]">
                        <span className="font-bold text-slate-500">
                          {ui.targetBudgetLabel}
                        </span>
                        <strong
                          dir="ltr"
                          className="font-extrabold text-[#0f1d40] tabular-nums"
                        >
                          {leadCur}
                          {Number(lead.budget).toLocaleString("en-US")}
                        </strong>
                      </div>
                    )}
                  </div>

                  <div className="mt-2.5 space-y-1.5 rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 text-xs">
                    <div className="flex flex-wrap gap-1">
                      {parsed.preferredAreasList.length > 0 ? (
                        parsed.preferredAreasList.map((areaLabel, i) => (
                          <span
                            key={`${areaLabel}-${i}`}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-extrabold text-[#0f1d40]"
                          >
                            <MapPin className="size-3 text-[#007a5a]" />
                            <span>{areaLabel}</span>
                          </span>
                        ))
                      ) : (
                        <strong className="text-[#0f1d40]">
                          {parsed.cleanTargetUnit}
                        </strong>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                      <span>
                        {typesText}{" "}
                        {lead.min_rooms ? `· +${lead.min_rooms}` : ""}
                      </span>
                      <span dir="ltr" className="font-mono text-slate-400">
                        {new Date(lead.created_at).toLocaleDateString("en-GB")}
                      </span>
                    </div>

                    {!isClosedDeal && parsed.readinessBadge && (
                      <div className="pt-0.5">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10.5px] font-extrabold ${parsed.readinessBadge.className}`}
                        >
                          {parsed.readinessBadge.text}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-2.5">
                    <StatusSelectBox
                      value={currentSt}
                      options={leadStatuses}
                      badgeClass={stObj.badge}
                      disabled={pending}
                      onChange={(nextSt) => {
                        if (nextSt !== currentSt) {
                          setConfirmAction({
                            type: "status",
                            lead,
                            newStatus: nextSt,
                          })
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2.5 rounded-b-2xl border-t border-slate-100 bg-slate-50/70 px-4 py-3">
                  {isClosedDeal ? (
                    <CompletedPurchaseSummaryBanner
                      deal={completedDeal}
                      leadCur={leadCur}
                      locale={locale}
                    />
                  ) : (
                    (matchedUnitsCount > 0 ||
                      parsed.directOffers.length > 0) && (
                      <div className="flex flex-wrap items-center gap-2">
                        {matchedUnitsCount > 0 && (
                          <button
                            type="button"
                            onClick={() => setSmartMatchLead(lead)}
                            className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-emerald-200 bg-[#eaf8f2] px-3 text-[11px] font-extrabold text-[#007a5a]"
                          >
                            <span>🎯</span>
                            <span>
                              {t.viewMatchedUnitsBtn || sm.matchedUnitsShort} (
                              {matchedUnitsCount})
                            </span>
                          </button>
                        )}

                        <BuyerOffersLogButton
                          offers={parsed.directOffers}
                          units={units}
                          label={t.offersLogBtn}
                          onClick={() => setOffersLogLead(lead)}
                        />
                      </div>
                    )
                  )}

                  <div className="flex items-center gap-2 border-t border-slate-200/60 pt-2.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8.5 flex-1 rounded-xl bg-white text-xs font-bold"
                      onClick={() => setDetailsLead(lead)}
                    >
                      <Eye className="me-1 size-3.5 text-[#007a5a]" />
                      {propAdminDict.actions?.detailsBtn || t.unitBtn}
                    </Button>

                    <a
                      data-admin-client-wa="true"
                      href={`https://wa.me/${String(lead.phone).replace(/\D/g, "")}?text=${encodeURIComponent(waText)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-8.5 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-3 text-xs font-bold text-white"
                    >
                      <MessageCircle className="size-3.5" />
                      <span>{t.whatsappBtn}</span>
                    </a>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 2. عرض الكمبيوتر */}
      <div className="hidden md:block">
        <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white px-5 py-3.5 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#eaf8f2] text-[#007a5a]">
              <Target className="size-4.5" />
            </span>
            <div>
              <h2 className="text-sm font-black text-[#0f1d40] sm:text-base">
                {ui.searchProfilesTab} ({filteredGeneral.length})
              </h2>
              <p className="mt-0.5 text-xs font-medium text-slate-500">
                {ui.searchTabDesc}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-2.5 grid grid-cols-[minmax(0,3fr)_minmax(0,2.4fr)_minmax(0,3.4fr)_195px] items-center gap-4 rounded-xl border border-slate-200/90 bg-slate-100/80 px-5 py-2.5 text-[11px] font-extrabold text-slate-600">
          <div>{t.colBuyer}</div>
          <div>{t.colCash}</div>
          <div>{ui.desiredAreasCol}</div>
          <div className="text-center">{t.colStatus}</div>
        </div>

        {filteredGeneral.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-xs font-bold text-slate-400">
            {t.emptyText}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredGeneral.map(({ lead, parsed }, index) => {
              const currentSt = getEffectiveLeadStatus(lead, parsed, units)
              const isClosedDeal = currentSt === "closed"
              const completedDeal = isClosedDeal
                ? findCompletedPurchaseDeal(parsed, units)
                : null
              const stObj =
                leadStatuses.find((s) => s.value === currentSt) ||
                leadStatuses[0]
              const matchedUnitsCount = isClosedDeal
                ? 0
                : getMatchedUnitsForLead(lead).length
              const phoneOk = isBuyerPhoneVerified(lead, verificationMap)
              const emailOk = isBuyerEmailVerified(lead, verificationMap)
              const typesText = Array.isArray(lead.unit_types)
                ? lead.unit_types.join(listSep)
                : "—"
              const isLoading = pending && activeLeadId === lead.id
              const isHighlighted = highlightedLeadId === lead.id
              const showTargetBudget =
                Number(lead.budget || 0) > Number(lead.available_cash || 0)

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
                  className={`overflow-visible rounded-2xl border bg-white shadow-2xs transition-all hover:shadow-md ${
                    isLoading
                      ? "border-[#007a5a] bg-[#eaf8f2]/30 opacity-60"
                      : isHighlighted
                        ? "border-2 border-[#007a5a] bg-[#eaf8f2]/30 ring-2 ring-[#007a5a]/20"
                        : isClosedDeal
                          ? "border-emerald-200/90 bg-slate-50/40 border-s-4 border-s-[#0f1d40]"
                          : parsed.isDirectUnitSource
                            ? "border-slate-200/90 border-s-4 border-s-orange-500"
                            : "border-slate-200/90 border-s-4 border-s-[#007a5a]"
                  }`}
                >
                  <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,2.4fr)_minmax(0,3.4fr)_195px] items-center gap-4 px-5 py-4">
                    <div className="min-w-0 pe-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-black text-slate-600">
                          {index + 1}
                        </span>
                        <span className="flex items-center gap-1.5 truncate text-sm font-black text-[#0f1d40]">
                          <User className="size-3.5 shrink-0 text-slate-400" />
                          <span className="truncate">{lead.name}</span>
                        </span>
                        {parsed.isDirectUnitSource ? (
                          <span className="inline-flex items-center gap-0.5 rounded-md bg-orange-100 px-1.5 py-0.5 text-[10px] font-extrabold text-orange-800">
                            <Flame className="size-2.5" />
                            <span>{ui.sourceDirectOfferBadge}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-[#eaf8f2] px-1.5 py-0.5 text-[10px] font-extrabold text-[#007a5a]">
                            {ui.sourceSearchBadge}
                          </span>
                        )}
                        {isLoading && (
                          <Loader2 className="size-3.5 animate-spin text-[#007a5a]" />
                        )}
                      </div>

                      <div className="mt-1.5 flex items-center gap-1.5 ps-8 text-[11.5px] font-bold text-slate-700">
                        <span dir="ltr" className="font-mono">
                          {lead.phone}
                        </span>
                        {phoneOk && (
                          <span
                            title={propAdminDict.badges?.phoneVerifiedBadge}
                            className="inline-flex text-[#007a5a]"
                          >
                            <CheckCircle2 className="size-3.5" />
                          </span>
                        )}
                      </div>

                      {lead.email && (
                        <div className="mt-0.5 flex items-center gap-1 ps-8 text-[11px] font-medium text-slate-500">
                          <span dir="ltr" className="break-all">
                            {lead.email}
                          </span>
                          {emailOk && (
                            <span
                              title={propAdminDict.badges?.emailVerifiedBadge}
                              className="inline-flex shrink-0 text-[#007a5a]"
                            >
                              <CheckCircle2 className="size-3.5" />
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="border-s border-slate-100 ps-4 whitespace-nowrap">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[11px] font-bold text-slate-400">
                          {t.cashLabel}
                        </span>
                        <span
                          dir="ltr"
                          className="text-base font-black text-[#007a5a] tabular-nums"
                        >
                          {leadCur}
                          {Number(
                            lead.available_cash || lead.budget || 0
                          ).toLocaleString("en-US")}
                        </span>
                      </div>

                      <div className="mt-1.5 space-y-1 border-t border-slate-100 pt-1.5 text-[11px] text-slate-500 tabular-nums">
                        <div className="flex items-center justify-between gap-2">
                          <span>{t.installmentLabel}</span>
                          <strong
                            dir="ltr"
                            className="font-extrabold text-[#0f1d40]"
                          >
                            {leadCur}
                            {Number(lead.max_installment || 0).toLocaleString(
                              "en-US"
                            )}
                          </strong>
                        </div>
                        {showTargetBudget && (
                          <div className="flex items-center justify-between gap-2">
                            <span>{ui.targetBudgetLabel}:</span>
                            <strong
                              dir="ltr"
                              className="font-bold text-slate-700"
                            >
                              {leadCur}
                              {Number(lead.budget).toLocaleString("en-US")}
                            </strong>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="min-w-0 border-s border-slate-100 ps-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {parsed.preferredAreasList.length > 0 ? (
                          parsed.preferredAreasList.map((areaLabel, i) => (
                            <span
                              key={`${areaLabel}-${i}`}
                              className="inline-flex items-center gap-1 rounded-md border border-slate-200/90 bg-slate-50 px-2 py-0.5 text-[11px] font-extrabold text-[#0f1d40]"
                            >
                              <MapPin className="size-3 shrink-0 text-[#007a5a]" />
                              <span>{areaLabel}</span>
                            </span>
                          ))
                        ) : (
                          <span className="text-xs font-bold text-slate-600">
                            {parsed.cleanTargetUnit}
                          </span>
                        )}
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-500">
                        <span>
                          {typesText}
                          {lead.min_rooms ? ` · +${lead.min_rooms}` : ""}
                        </span>
                        {lead.delivery_status && (
                          <>
                            <span>·</span>
                            <span className="text-slate-600">
                              {lead.delivery_status}
                            </span>
                          </>
                        )}
                        <span>·</span>
                        <span
                          dir="ltr"
                          className="font-mono text-[10.5px] text-slate-400"
                        >
                          📅{" "}
                          {new Date(lead.created_at).toLocaleDateString(
                            "en-GB"
                          )}
                        </span>
                      </div>

                      {!isClosedDeal && parsed.readinessBadge && (
                        <div className="mt-1.5">
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10.5px] font-extrabold ${parsed.readinessBadge.className}`}
                          >
                            {parsed.readinessBadge.text}
                          </span>
                        </div>
                      )}

                      {parsed.customerNotes && (
                        <div className="mt-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] text-amber-900">
                          <strong>{t.customerNotesLabel}</strong>{" "}
                          {parsed.customerNotes}
                        </div>
                      )}
                    </div>

                    <div className="border-s border-slate-100 ps-3.5">
                      <StatusSelectBox
                        value={currentSt}
                        options={leadStatuses}
                        badgeClass={stObj.badge}
                        disabled={pending}
                        onChange={(nextSt) => {
                          if (nextSt !== currentSt) {
                            setConfirmAction({
                              type: "status",
                              lead,
                              newStatus: nextSt,
                            })
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* الشريط السفلي */}
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-b-2xl border-t border-slate-100 bg-slate-50/70 px-5 py-2.5">
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                      {isClosedDeal ? (
                        <CompletedPurchaseSummaryBanner
                          deal={completedDeal}
                          leadCur={leadCur}
                          locale={locale}
                        />
                      ) : (
                        <>
                          {matchedUnitsCount > 0 && (
                            <button
                              type="button"
                              onClick={() => setSmartMatchLead(lead)}
                              className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-emerald-200 bg-[#eaf8f2] px-3 text-[11px] font-extrabold text-[#007a5a] shadow-2xs transition hover:bg-[#007a5a] hover:text-white"
                            >
                              <span>🎯</span>
                              <span>
                                {t.viewMatchedUnitsBtn || sm.matchedUnitsShort}{" "}
                                ({matchedUnitsCount})
                              </span>
                            </button>
                          )}

                          <BuyerOffersLogButton
                            offers={parsed.directOffers}
                            units={units}
                            label={t.offersLogBtn}
                            onClick={() => setOffersLogLead(lead)}
                          />
                        </>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-xl bg-white px-3 text-[11px] font-bold"
                        onClick={() => setDetailsLead(lead)}
                      >
                        <Eye className="me-1 size-3.5 text-[#007a5a]" />
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
                        className="inline-flex size-8 items-center justify-center rounded-lg bg-[#25D366] text-white shadow-2xs transition hover:bg-[#1ebe5d]"
                      >
                        <MessageCircle className="size-3.5" />
                      </a>

                      {renderThreeDotsMenu(`desk_${lead.id}`, lead)}
                    </div>
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

      <LeadOffersLogDialog
        dir={dir}
        locale={locale}
        t={t}
        sm={sm}
        lead={offersLogLead}
        offers={offersLogEntry?.parsed.directOffers || []}
        units={units}
        leadCur={leadCur}
        onClose={() => setOffersLogLead(null)}
        onNotice={(msg) => setNotice(msg)}
      />

      <LeadDetailsDialog
        dir={dir}
        locale={locale}
        t={t}
        propAdminDict={propAdminDict}
        publicSiteLabel={dict.admin?.shell?.publicSite || ""}
        propertiesNavLabel={propertiesNavLabel}
        openInDealsRoomLabel={dashDict.openInDealsRoomBtn || ""}
        detailsLead={detailsLead}
        parsed={modalParsed}
        leadCur={leadCur}
        waText={
          detailsLead && modalParsed
            ? buildLeadWhatsAppMessage({
                lead: detailsLead,
                parsed: modalParsed,
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