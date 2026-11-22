"use client"

import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Download,
  Eye,
  FileText,
  Flame,
  Handshake,
  Loader2,
  Lock,
  MapPin,
  MessageCircle,
  MoreVertical,
  Phone,
  PhoneCall,
  Search,
  Snowflake,
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
import {
  AdminAreaFilter,
  matchesAdminAreaSelection,
} from "@/components/features/admin/admin-area-filter"
import { BuyerSmartMatchModal } from "@/components/features/admin/smart-match-dialogs"
import { PhoneOfferDialog } from "@/components/features/admin/phone-offer-dialog"
import {
  deleteBuyerLeadAction,
  updateBuyerLeadStatusAction,
  verifyUserContactByAdminAction,
} from "../../../actions/admin-actions"
import {
  ACTIVE_ADMIN_COUNTRY,
  buildLeadWhatsAppMessage,
  deriveShortUnitCode,
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
  LeadDealQuickSummaryDialog,
  LeadDetailsDialog,
  LeadFrozenAlternativesDialog,
  LeadOffersLogDialog,
} from "./leads-modals"

export type { BuyerLead, LinkedUnitSummary, UserVerificationBadgeInfo }

function getLeadRawAreas(
  lead: BuyerLead,
  parsed: ReturnType<typeof parseLeadDetails>
): Array<string | null | undefined> {
  const raw = (lead as any).preferred_areas
  if (Array.isArray(raw) && raw.length > 0) return raw
  if (typeof raw === "string" && raw.trim()) return [raw]
  return parsed.preferredAreasList || []
}

function isUnitCurrentlyOpenForNewDeals(
  unit: LinkedUnitSummary | undefined,
  lockedByAcceptedUnitIds: Set<string>
): boolean {
  if (!unit) return false
  const st = String(unit.status || "active").trim().toLowerCase()
  if (
    st !== "active" &&
    st !== "approved" &&
    st !== "published" &&
    st !== "offer_received"
  ) {
    return false
  }
  return !lockedByAcceptedUnitIds.has(String(unit.id))
}

function resolveLeadDisplayStatus(
  lead: BuyerLead,
  parsed: ReturnType<typeof parseLeadDetails>,
  units: LinkedUnitSummary[]
): {
  key: string
  isAutoLocked: boolean
  activeDealOffer: any | null
  activeDealUnit: LinkedUnitSummary | null
  activeOffersCount: number
} {
  const raw = String(lead.status || "new").trim().toLowerCase()

  const soldOffer = parsed.directOffers.find((o) => {
    if (o.status !== "accepted") return false
    const u = units.find((item) => String(item.id) === String(o.property_id))
    return String(u?.status || "").trim().toLowerCase() === "sold"
  })

  if (raw === "closed" || Boolean(soldOffer)) {
    const u = soldOffer
      ? units.find((item) => String(item.id) === String(soldOffer.property_id)) ||
        null
      : null
    return {
      key: "closed",
      isAutoLocked: true,
      activeDealOffer: soldOffer || null,
      activeDealUnit: u,
      activeOffersCount: 0,
    }
  }

  const activeDealOffer =
    parsed.directOffers.find((o) => {
      if (o.status !== "accepted") return false
      const u = units.find((item) => String(item.id) === String(o.property_id))
      return String(u?.status || "").trim().toLowerCase() !== "sold"
    }) || null

  if (activeDealOffer) {
    const u =
      units.find(
        (item) => String(item.id) === String(activeDealOffer.property_id)
      ) || null
    return {
      key: "in_deal",
      isAutoLocked: true,
      activeDealOffer,
      activeDealUnit: u,
      activeOffersCount: 1,
    }
  }

  const negotiatingOffers = parsed.directOffers.filter(
    (o) => o.status === "counter_offered"
  )
  const pendingOffers = parsed.directOffers.filter(
    (o) => o.status === "pending_admin" || o.status === "pending_seller"
  )
  const totalActive = negotiatingOffers.length + pendingOffers.length

  if (negotiatingOffers.length > 0) {
    return {
      key: "negotiating",
      isAutoLocked: true,
      activeDealOffer: null,
      activeDealUnit: null,
      activeOffersCount: totalActive,
    }
  }

  if (pendingOffers.length > 0) {
    return {
      key: "has_offer",
      isAutoLocked: true,
      activeDealOffer: null,
      activeDealUnit: null,
      activeOffersCount: totalActive,
    }
  }

  return {
    key: raw || "new",
    isAutoLocked: false,
    activeDealOffer: null,
    activeDealUnit: null,
    activeOffersCount: 0,
  }
}

// قائمة مراحل المشتري الموحدة (١ – ٦ + مؤرشف) بالفتح الذكي للأعلى/الأسفل وتطابق كامل للمسميات
function LeadStatusControl({
  lead,
  statusInfo,
  label,
  t,
  pending,
  isOpen,
  onToggleOpen,
  onCloseAll,
  onRequestStatusChange,
  onOpenOffersLog,
}: {
  lead: BuyerLead
  statusInfo: ReturnType<typeof resolveLeadDisplayStatus>
  label: string
  t: Record<string, any>
  pending: boolean
  isOpen: boolean
  onToggleOpen: () => void
  onCloseAll: () => void
  onRequestStatusChange: (nextStatus: string) => void
  onOpenOffersLog: () => void
}) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [openUpward, setOpenUpward] = useState(false)

  const sMenu = (t.statusMenu as Record<string, string>) || {}
  const statuses = (t.statuses as Record<string, string>) || {}
  const currentKey = statusInfo.key
  const isLocked = statusInfo.isAutoLocked

  const badgeTone =
    currentKey === "closed"
      ? "border-[#007a5a] bg-[#007a5a] text-white hover:bg-[#006248]"
      : currentKey === "in_deal"
        ? "border-[#007a5a] bg-[#007a5a] text-white hover:bg-[#006248]"
        : currentKey === "negotiating"
          ? "border-purple-700 bg-purple-700 text-white hover:bg-purple-800"
          : currentKey === "has_offer"
            ? "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
            : currentKey === "matched"
              ? "border-purple-300 bg-purple-50 text-purple-900"
              : currentKey === "contacted"
                ? "border-amber-300 bg-amber-50 text-amber-900"
                : currentKey === "archived"
                  ? "border-slate-300 bg-slate-100 text-slate-700"
                  : "border-blue-300 bg-blue-50 text-blue-900"

  const stage4Label =
    currentKey === "negotiating"
      ? t.statusNegotiating || t.statusHasActiveOffer
      : t.statusHasActiveOffer

  const pipelineItems: Array<{
    value: string
    label: string
    isAuto: boolean
    isCurrent: boolean
  }> = [
    {
      value: "new",
      label: statuses.new,
      isAuto: false,
      isCurrent: currentKey === "new",
    },
    {
      value: "contacted",
      label: statuses.contacted,
      isAuto: false,
      isCurrent: currentKey === "contacted",
    },
    {
      value: "matched",
      label: statuses.matched,
      isAuto: false,
      isCurrent: currentKey === "matched",
    },
    {
      value: "has_offer",
      label: stage4Label,
      isAuto: true,
      isCurrent: currentKey === "has_offer" || currentKey === "negotiating",
    },
    {
      value: "in_deal",
      label: t.statusInActiveDeal,
      isAuto: true,
      isCurrent: currentKey === "in_deal",
    },
    {
      value: "closed",
      label: t.statusPurchasedLocked || statuses.closed,
      isAuto: true,
      isCurrent: currentKey === "closed",
    },
  ]

  const extraItems: Array<{
    value: string
    label: string
    isCurrent: boolean
  }> = [
    {
      value: "archived",
      label: statuses.archived,
      isCurrent: currentKey === "archived",
    },
  ]

  const lockBanner =
    currentKey === "in_deal"
      ? {
          title: sMenu.lockedInDealTitle,
          desc: sMenu.lockedInDealDesc,
          tone: "border-emerald-200 bg-[#eaf8f2] text-[#0f1d40]",
          btnKind: "deals" as const,
        }
      : currentKey === "has_offer" || currentKey === "negotiating"
        ? {
            title: sMenu.lockedHasOffersTitle,
            desc: sMenu.lockedHasOffersDesc,
            tone: "border-amber-200 bg-amber-50 text-amber-950",
            btnKind: "offers" as const,
          }
        : currentKey === "closed"
          ? {
              title: sMenu.lockedClosedTitle,
              desc: sMenu.lockedClosedDesc,
              tone: "border-slate-200 bg-slate-50 text-[#0f1d40]",
              btnKind: statusInfo.activeDealOffer ? ("deals" as const) : null,
            }
          : null

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      setOpenUpward(spaceBelow < 380 && spaceAbove > spaceBelow)
    }
    onToggleOpen()
  }

  return (
    <div className="relative w-full" onClick={(e) => e.stopPropagation()}>
      <button
        ref={triggerRef}
        type="button"
        disabled={pending}
        onClick={handleToggle}
        className={`inline-flex h-9 w-full items-center justify-between gap-1.5 rounded-xl border px-3 text-[11px] font-extrabold transition focus:outline-none disabled:opacity-50 ${badgeTone}`}
      >
        <span className="flex min-w-0 items-center gap-1.5 truncate">
          {isLocked && <Lock className="size-3 shrink-0 opacity-85" />}
          <span className="truncate">{label}</span>
        </span>
        <ChevronDown
          className={`size-3.5 shrink-0 opacity-80 transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute end-0 z-50 max-h-[min(400px,72vh)] w-full min-w-[260px] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 text-start shadow-2xl sm:w-[290px] ${
            openUpward ? "bottom-10" : "top-10"
          }`}
        >
          {lockBanner && (
            <div
              className={`mb-1.5 rounded-xl border p-2 text-[10.5px] ${lockBanner.tone}`}
            >
              <div className="flex items-start gap-1.5">
                <Lock className="mt-0.5 size-3 shrink-0 text-[#007a5a]" />
                <div className="min-w-0 flex-1">
                  <strong className="block text-[11px] font-black">
                    {lockBanner.title}
                  </strong>
                  <p className="mt-0.5 leading-snug opacity-85">
                    {lockBanner.desc}
                  </p>
                </div>
              </div>

              {lockBanner.btnKind === "deals" && (
                <Link
                  href={
                    statusInfo.activeDealOffer
                      ? `/admin/deals?offerId=${statusInfo.activeDealOffer.id}`
                      : "/admin/deals"
                  }
                  onClick={onCloseAll}
                  className="mt-1.5 flex h-7 w-full items-center justify-center gap-1.5 rounded-lg bg-[#007a5a] px-2.5 text-[10.5px] font-extrabold text-white transition hover:bg-[#006248]"
                >
                  <Handshake className="size-3.5" />
                  <span>{sMenu.goToDealsBtn}</span>
                </Link>
              )}

              {lockBanner.btnKind === "offers" && (
                <button
                  type="button"
                  onClick={() => {
                    onCloseAll()
                    onOpenOffersLog()
                  }}
                  className="mt-1.5 flex h-7 w-full items-center justify-center gap-1.5 rounded-lg bg-[#0f1d40] px-2.5 text-[10.5px] font-extrabold text-white transition hover:bg-[#1e293b]"
                >
                  <ClipboardList className="size-3.5 text-emerald-300" />
                  <span>{sMenu.goToOffersBtn}</span>
                </button>
              )}
            </div>
          )}

          <div className="px-2 pt-0.5 pb-1 text-[10px] font-extrabold text-slate-400">
            {sMenu.pipelineGroupLabel}
          </div>

          <div className="space-y-0.5">
            {pipelineItems.map((item) => {
              const isDisabled = isLocked || item.isAuto || item.isCurrent
              return (
                <button
                  key={item.value}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => {
                    onCloseAll()
                    onRequestStatusChange(item.value)
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-start text-[11px] transition ${
                    item.isCurrent
                      ? "bg-[#eaf8f2] font-black text-[#007a5a] ring-1 ring-emerald-200"
                      : isLocked || item.isAuto
                        ? "cursor-not-allowed font-semibold text-slate-400 opacity-60"
                        : "cursor-pointer font-bold text-[#0f1d40] hover:bg-slate-100"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-1.5 truncate">
                    {item.isCurrent ? (
                      <Check className="size-3.5 shrink-0 text-[#007a5a]" />
                    ) : item.isAuto ? (
                      <Lock className="size-3 shrink-0 text-slate-400" />
                    ) : (
                      <span className="size-1.5 shrink-0 rounded-full bg-slate-300" />
                    )}
                    <span className="truncate">{item.label}</span>
                  </span>

                  {item.isCurrent ? (
                    <span className="shrink-0 rounded-full bg-[#007a5a] px-2 py-0.5 text-[9px] font-extrabold text-white">
                      {sMenu.currentBadge}
                    </span>
                  ) : item.isAuto ? (
                    <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
                      {sMenu.autoBadge}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>

          <div className="my-1.5 border-t border-slate-100" />
          <div className="px-2 pb-1 text-[10px] font-extrabold text-slate-400">
            {sMenu.otherGroupLabel}
          </div>

          <div className="space-y-0.5">
            {extraItems.map((item) => {
              const isDisabled = isLocked || item.isCurrent
              return (
                <button
                  key={item.value}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => {
                    onCloseAll()
                    onRequestStatusChange(item.value)
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-start text-[11px] transition ${
                    item.isCurrent
                      ? "bg-slate-100 font-black text-slate-800 ring-1 ring-slate-200"
                      : isLocked
                        ? "cursor-not-allowed font-semibold text-slate-400 opacity-55"
                        : "cursor-pointer font-bold text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span className="truncate">{item.label}</span>
                  {item.isCurrent && (
                    <span className="shrink-0 rounded-full bg-slate-600 px-2 py-0.5 text-[9px] font-extrabold text-white">
                      {sMenu.currentBadge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function LeadThreeDotsMenu({
  lead,
  isOpen,
  pending,
  expL,
  deleteBtnLabel,
  onToggle,
  onClose,
  onExportExcel,
  onExportPdf,
  onRequestDelete,
}: {
  lead: BuyerLead
  isOpen: boolean
  pending: boolean
  expL: Record<string, any>
  deleteBtnLabel: string
  onToggle: () => void
  onClose: () => void
  onExportExcel: () => void
  onExportPdf: () => void
  onRequestDelete: () => void
}) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [openUpward, setOpenUpward] = useState(false)

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      setOpenUpward(spaceBelow < 220 && spaceAbove > spaceBelow)
    }
    onToggle()
  }

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={expL.moreActionsAria}
        onClick={handleToggle}
        className="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-[#007a5a] hover:bg-slate-50 hover:text-[#0f1d40]"
      >
        <MoreVertical className="size-4" />
      </button>

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute end-0 z-50 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ${
            openUpward ? "bottom-9" : "top-9"
          }`}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onClose()
              onExportExcel()
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
              onClose()
              onExportPdf()
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
              onClose()
              onRequestDelete()
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-xs font-bold text-red-600 transition hover:bg-red-50"
          >
            <Trash2 className="size-3.5 text-red-600" />
            <span>{deleteBtnLabel}</span>
          </button>
        </div>
      )}
    </div>
  )
}

function BuyerOffersLogButton({
  offers,
  label,
  onClick,
}: {
  offers: any[]
  units: LinkedUnitSummary[]
  label: string
  onClick: () => void
}) {
  if (!offers || offers.length === 0) return null

  const hasPendingAdmin = offers.some((o) => o.status === "pending_admin")
  const hasCounter = offers.some((o) => o.status === "counter_offered")
  const hasPendingSeller = offers.some((o) => o.status === "pending_seller")

  const toneClass = hasCounter
    ? "border-purple-300 bg-purple-50 text-purple-900 hover:bg-purple-700 hover:text-white"
    : hasPendingAdmin
      ? "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-500 hover:text-white"
      : hasPendingSeller
        ? "border-blue-200 bg-blue-50 text-blue-900 hover:bg-blue-600 hover:text-white"
        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"

  const dotClass = hasCounter
    ? "bg-purple-600"
    : hasPendingAdmin
      ? "bg-amber-500"
      : hasPendingSeller
        ? "bg-blue-600"
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
  t,
}: {
  deal: { offer: any; unit: LinkedUnitSummary | null } | null
  leadCur: string
  t: Record<string, any>
}) {
  if (!deal) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-[#eaf8f2] px-3 py-1.5 text-[11px] font-extrabold text-[#007a5a]">
        <Trophy className="size-3.5 shrink-0" />
        <span>{t.completedPurchaseNoDeal}</span>
      </span>
    )
  }

  const uCode = deal.unit
    ? deriveShortUnitCode(deal.unit.id, deal.unit.code)
    : ""
  const projName = deal.unit?.project_name || "—"
  const ownerName = deal.unit?.name || "—"
  const amount = `${leadCur}${Number(deal.offer.offered_cash || deal.unit?.paid_amount || 0).toLocaleString("en-US")}`

  const summaryText = String(t.completedPurchaseSummary || "")
    .replace("{project}", projName)
    .replace("{code}", uCode)
    .replace("{owner}", ownerName)
    .replace("{amount}", amount)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex flex-wrap items-center gap-1.5 rounded-xl border border-emerald-200 bg-[#eaf8f2] px-3 py-1.5 text-[11px] font-extrabold text-[#0f1d40]">
        <Trophy className="size-3.5 shrink-0 text-[#007a5a]" />
        <span>{summaryText}</span>
      </span>

      <Link
        href={`/admin/deals?offerId=${deal.offer.id}`}
        className="inline-flex h-8 items-center gap-1 rounded-xl bg-[#0f1d40] px-3 text-[11px] font-extrabold text-white transition hover:bg-[#1e293b]"
      >
        <Handshake className="size-3.5 text-emerald-300" />
        <span>{t.openDealFileBtn || t.viewDealBtn}</span>
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

  const { t: dict, locale, dir, siteSettings } = useTranslation()
  const adminDict = (dict?.admin as Record<string, any>) || {}
  const t = adminDict.leadsAdmin || {}
  const ui = (t.ui as Record<string, string>) || {}
  const leadsPrompts = adminDict.leads || {}
  const propAdminDict = adminDict.propertiesAdmin || {}
  const dashDict = adminDict.dashboard || {}
  const sm = adminDict.smartMatch || {}
  const dealsDict = adminDict.dealsPage || {}
  const expL = EXPORT_LABELS[locale] || EXPORT_LABELS.ar
  const propertiesNavLabel = dict.admin?.shell?.nav?.properties || ""
  const listSep = dir === "rtl" ? "، " : ", "
  const commPct = Number(siteSettings?.buyerCommission) || 1.25

  const filterTabs = [
    { value: "new", label: t.statuses?.new },
    { value: "in_deal", label: t.filterInDealTab },
    { value: "offers_group", label: t.filterOffersAndNegTab },
    { value: "contacted", label: t.statuses?.contacted },
    { value: "matched", label: t.statuses?.matched },
    { value: "closed", label: t.statusPurchasedLocked || t.statuses?.closed },
    { value: "archived", label: t.statuses?.archived },
  ]

  function getDisplayStatusLabel(rawKey?: string | null): string {
    const key = String(rawKey || "new").trim().toLowerCase()
    if (key === "closed") return t.statusPurchasedLocked || t.statuses?.closed
    if (key === "in_deal") return t.statusInActiveDeal
    if (key === "negotiating") return t.statusNegotiating
    if (key === "has_offer") return t.statusHasActiveOffer
    return t.statuses?.[key] || key
  }

  const leadCur = getCurrencySymbol(ACTIVE_ADMIN_COUNTRY, locale)

  const [search, setSearch] = useState("")
  const [areaFilter, setAreaFilter] = useState("ALL")
  const [statusFilter, setStatusFilter] = useState("all")
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [openStatusMenuId, setOpenStatusMenuId] = useState<string | null>(null)
  const [highlightedLeadId, setHighlightedLeadId] = useState<string | null>(
    null
  )
  const [detailsLead, setDetailsLead] = useState<BuyerLead | null>(null)
  const [offersLogLead, setOffersLogLead] = useState<BuyerLead | null>(null)
  const [smartMatchLead, setSmartMatchLead] = useState<BuyerLead | null>(null)
  const [phoneOfferLead, setPhoneOfferLead] = useState<BuyerLead | null>(null)
  const [dealQuickSummary, setDealQuickSummary] = useState<{
    lead: BuyerLead
    offer: any
    unit: LinkedUnitSummary | null
    waitlistCount: number
  } | null>(null)
  const [frozenAltsData, setFrozenAltsData] = useState<{
    lead: BuyerLead
    alternatives: Array<{ offer: any; unit: LinkedUnitSummary }>
  } | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmLeadAction | null>(
    null
  )
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null)
  const [notice, setNotice] = useState<{
    text: string
    isError?: boolean
  } | null>(null)
  const [pending, startTransition] = useTransition()

  const lockedByAcceptedUnitIds = useMemo(() => {
    return new Set(
      (offers || [])
        .map((o) => ({ ...o, status: normalizeOfferStatus(o) }))
        .filter((o) => o.status === "accepted")
        .map((o) => String(o.property_id))
    )
  }, [offers])

  function getWaitlistCountForUnit(unitId?: string | null): number {
    if (!unitId) return 0
    return (offers || []).filter(
      (o) =>
        String(o.property_id) === String(unitId) &&
        normalizeOfferStatus(o) === "unit_locked"
    ).length
  }

  function getAvailableFrozenAlternatives(
    parsed: ReturnType<typeof parseLeadDetails>,
    activeDealOfferId?: string | null
  ): Array<{ offer: any; unit: LinkedUnitSummary }> {
    const result: Array<{ offer: any; unit: LinkedUnitSummary }> = []
    for (const o of parsed.directOffers) {
      if (activeDealOfferId && String(o.id) === String(activeDealOfferId)) {
        continue
      }
      if (o.status === "rejected" || o.status === "accepted") continue
      const unit = units.find((u) => String(u.id) === String(o.property_id))
      if (!isUnitCurrentlyOpenForNewDeals(unit, lockedByAcceptedUnitIds)) {
        continue
      }
      if (unit) result.push({ offer: o, unit })
    }
    return result
  }

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
      if (!isUnitCurrentlyOpenForNewDeals(u, lockedByAcceptedUnitIds))
        return false
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
      .map((lead) => {
        const parsed = parseLeadDetails({
          lead,
          units,
          offers,
          locale,
          dir,
          leadsPrompts,
        })
        const statusInfo = resolveLeadDisplayStatus(lead, parsed, units)
        return { lead, parsed, statusInfo }
      })
      .filter((entry) => !entry.parsed.isPureUnitInquiry)
  }, [leads, units, offers, locale, dir, leadsPrompts])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const { statusInfo } of generalSearchEntries) {
      const k = statusInfo.key
      counts[k] = (counts[k] || 0) + 1
      if (k === "has_offer" || k === "negotiating") {
        counts.offers_group = (counts.offers_group || 0) + 1
      }
    }
    return counts
  }, [generalSearchEntries])

  useEffect(() => {
    const closeAllMenus = () => {
      setOpenMenuId(null)
      setOpenStatusMenuId(null)
    }
    window.addEventListener("click", closeAllMenus)
    return () => window.removeEventListener("click", closeAllMenus)
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
      setSearch("")
      setAreaFilter("ALL")
      setStatusFilter("all")

      const scrollToVisibleLead = () => {
        const candidates = document.querySelectorAll<HTMLElement>(
          `[data-lead-row-id="${leadIdParam}"]`
        )
        const visibleTarget = Array.from(candidates).find(
          (el) => el.offsetParent !== null
        )
        ;(visibleTarget || candidates[0])?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        })
      }

      const t1 = setTimeout(scrollToVisibleLead, 180)
      const t2 = setTimeout(scrollToVisibleLead, 550)
      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
      }
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
              text: `${t.statusUpdatedSuccess} ("${target.name}" → ${getDisplayStatusLabel(confirmAction.newStatus)})`,
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
    .filter(({ lead, parsed, statusInfo }) => {
      if (!matchesAdminAreaSelection(getLeadRawAreas(lead, parsed), areaFilter)) {
        return false
      }

      const st = statusInfo.key
      if (statusFilter === "offers_group") {
        if (st !== "has_offer" && st !== "negotiating") return false
      } else if (statusFilter !== "all" && st !== statusFilter) {
        return false
      }

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
      // الترتيب حسب أولوية الشغل: جديد أولاً ← في صفقة ← قيد التفاوض ← لديه عرض ← تم التواصل ← تم الترشيح ← تم الشراء ← مؤرشف
      const rank = (s: string) => {
        if (s === "new") return 1
        if (s === "in_deal") return 2
        if (s === "negotiating") return 3
        if (s === "has_offer") return 4
        if (s === "contacted") return 5
        if (s === "matched") return 6
        if (s === "closed") return 7
        if (s === "archived") return 8
        return 9
      }
      const diff = rank(a.statusInfo.key) - rank(b.statusInfo.key)
      if (diff !== 0) return diff
      return (
        new Date(b.lead.created_at).getTime() -
        new Date(a.lead.created_at).getTime()
      )
    })

  function exportLeadsReport(
    rowsToExport: BuyerLead[],
    format: "excel" | "pdf" = "excel",
    prefix = "DualDealz_Buyers",
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
        accessor: (l: BuyerLead) =>
          getDisplayStatusLabel(String(l.status || "new")),
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

  function renderLeadFooterActions(
    lead: BuyerLead,
    parsed: ReturnType<typeof parseLeadDetails>,
    statusInfo: ReturnType<typeof resolveLeadDisplayStatus>,
    matchedUnitsCount: number
  ) {
    if (statusInfo.key === "closed") {
      return (
        <CompletedPurchaseSummaryBanner
          deal={
            statusInfo.activeDealOffer
              ? {
                  offer: statusInfo.activeDealOffer,
                  unit: statusInfo.activeDealUnit,
                }
              : null
          }
          leadCur={leadCur}
          t={t}
        />
      )
    }

    if (statusInfo.key === "in_deal" && statusInfo.activeDealOffer) {
      const frozenAlts = getAvailableFrozenAlternatives(
        parsed,
        statusInfo.activeDealOffer.id
      )
      return (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              setDealQuickSummary({
                lead,
                offer: statusInfo.activeDealOffer,
                unit: statusInfo.activeDealUnit,
                waitlistCount: getWaitlistCountForUnit(
                  statusInfo.activeDealUnit?.id
                ),
              })
            }
            className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-[#007a5a] px-3 text-[11px] font-extrabold text-white shadow-2xs transition hover:bg-[#006248]"
          >
            <Handshake className="size-3.5" />
            <span>{t.currentDealBtn}</span>
          </button>

          {frozenAlts.length > 0 && (
            <button
              type="button"
              onClick={() =>
                setFrozenAltsData({ lead, alternatives: frozenAlts })
              }
              className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3 text-[11px] font-extrabold text-sky-900 shadow-2xs transition hover:bg-sky-100"
            >
              <Snowflake className="size-3.5 text-sky-600" />
              <span>
                {t.frozenAlternativesBtn} ({frozenAlts.length})
              </span>
            </button>
          )}
        </div>
      )
    }

    return (
      <div className="flex flex-wrap items-center gap-2">
        {matchedUnitsCount > 0 && (
          <button
            type="button"
            onClick={() => setSmartMatchLead(lead)}
            className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-emerald-200 bg-[#eaf8f2] px-3 text-[11px] font-extrabold text-[#007a5a] shadow-2xs transition hover:bg-[#007a5a] hover:text-white"
          >
            <span>🎯</span>
            <span>
              {t.viewMatchedUnitsBtn || sm.matchedUnitsShort} (
              {matchedUnitsCount})
            </span>
          </button>
        )}

        {statusInfo.key !== "archived" && (
          <button
            type="button"
            onClick={() => setPhoneOfferLead(lead)}
            className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-extrabold text-[#0f1d40] shadow-2xs transition hover:border-[#007a5a] hover:text-[#007a5a]"
          >
            <PhoneCall className="size-3.5 text-[#007a5a]" />
            <span>{sm.recordOfferOnAnyUnitBtn}</span>
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

      {/* شريط البحث وفلاتر المدن والأحياء والتصدير (منسّق تماماً مثل طلبات البيع) */}
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute top-1/2 end-3 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="h-9.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 ps-3 pe-9 text-xs font-semibold focus:border-[#007a5a] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="shrink-0">
            <AdminAreaFilter
              value={areaFilter}
              onChange={setAreaFilter}
              itemsAreas={generalSearchEntries.map(({ lead, parsed }) =>
                getLeadRawAreas(lead, parsed)
              )}
            />
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={currentExportRows.length === 0}
              onClick={() =>
                exportLeadsReport(
                  currentExportRows,
                  "excel",
                  "DualDealz_Search_Profiles",
                  ui.searchProfilesTab
                )
              }
              className="inline-flex h-9.5 shrink-0 items-center gap-1.5 rounded-xl border border-emerald-200 bg-[#eaf8f2] px-3.5 text-xs font-extrabold text-[#007a5a] transition hover:bg-[#007a5a] hover:text-white disabled:opacity-40"
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
                  "DualDealz_Search_Profiles",
                  ui.searchProfilesTab
                )
              }
              className="inline-flex h-9.5 shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-800 px-3.5 text-xs font-extrabold text-white transition hover:bg-slate-900 disabled:opacity-40"
            >
              <FileText className="size-3.5 text-emerald-300" />
              <span>{expL.exportPdfBtn}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
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
          {filterTabs.map((st) => (
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
          filteredGeneral.map(({ lead, parsed, statusInfo }) => {
            const isClosedDeal = statusInfo.key === "closed"
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
            const isAnyMenuOpen =
              openMenuId === `mob_${lead.id}` || openStatusMenuId === lead.id

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
                data-lead-row-id={lead.id}
                key={lead.id}
                className={`relative scroll-mt-24 overflow-visible rounded-2xl border bg-white shadow-xs transition ${
                  isAnyMenuOpen ? "z-30" : "z-0"
                } ${
                  isLoading
                    ? "border-[#007a5a] opacity-75"
                    : isHighlighted
                      ? "border-2 border-[#007a5a] bg-[#eaf8f2]/35 ring-4 ring-[#007a5a]/20"
                      : isClosedDeal
                        ? "border-emerald-200/90 bg-slate-50/40 border-s-4 border-s-[#0f1d40]"
                        : statusInfo.key === "in_deal"
                          ? "border-emerald-300 border-s-4 border-s-[#007a5a]"
                          : statusInfo.key === "negotiating"
                            ? "border-purple-200 border-s-4 border-s-purple-600"
                            : parsed.isDirectUnitSource
                              ? "border-slate-200/90 border-s-4 border-s-orange-500"
                              : "border-slate-200/90 border-s-4 border-s-[#007a5a]"
                }`}
              >
                {isHighlighted && t.selectedLeadBadge && (
                  <div className="flex items-center gap-1.5 rounded-t-2xl border-b border-emerald-200 bg-[#007a5a] px-4 py-1.5 text-[11px] font-extrabold text-white">
                    <span className="size-2 animate-pulse rounded-full bg-emerald-200" />
                    <span>{t.selectedLeadBadge}</span>
                  </div>
                )}

                <div className="p-4 text-start">
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
                        <span dir="ltr" className="inline-block font-mono">
                          {lead.phone}
                        </span>
                        {phoneOk && (
                          <CheckCircle2 className="size-3.5 shrink-0 text-[#007a5a]" />
                        )}
                      </div>
                      {lead.email && (
                        <div className="mt-0.5 flex items-center gap-1 text-[10.5px] text-slate-500">
                          <span dir="ltr" className="inline-block break-all">
                            {lead.email}
                          </span>
                          {emailOk && (
                            <CheckCircle2 className="size-3.5 shrink-0 text-[#007a5a]" />
                          )}
                        </div>
                      )}
                    </div>

                    <LeadThreeDotsMenu
                      lead={lead}
                      isOpen={openMenuId === `mob_${lead.id}`}
                      pending={pending}
                      expL={expL}
                      deleteBtnLabel={t.deleteBtn}
                      onToggle={() => {
                        setOpenStatusMenuId(null)
                        setOpenMenuId(
                          openMenuId === `mob_${lead.id}`
                            ? null
                            : `mob_${lead.id}`
                        )
                      }}
                      onClose={() => setOpenMenuId(null)}
                      onExportExcel={() =>
                        exportLeadsReport(
                          [lead],
                          "excel",
                          `DualDealz_Buyer_${lead.id.slice(0, 6)}`,
                          `${expL.singleLeadReportTitle} (${lead.name})`
                        )
                      }
                      onExportPdf={() =>
                        exportLeadsReport(
                          [lead],
                          "pdf",
                          `DualDealz_Buyer_${lead.id.slice(0, 6)}`,
                          `${expL.singleLeadReportTitle} (${lead.name})`
                        )
                      }
                      onRequestDelete={() =>
                        setConfirmAction({ type: "delete", lead })
                      }
                    />
                  </div>

                  <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 text-xs">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="text-start">
                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                          <Wallet className="size-3 text-[#007a5a]" />
                          <span>{t.cashLabel}</span>
                        </span>
                        <strong className="mt-0.5 block text-sm font-black text-[#007a5a]">
                          <span dir="ltr" className="inline-block tabular-nums">
                            {leadCur}
                            {Number(
                              lead.available_cash || lead.budget || 0
                            ).toLocaleString("en-US")}
                          </span>
                        </strong>
                      </div>

                      <div className="border-s border-slate-200/70 ps-2.5 text-start">
                        <span className="block text-[10px] font-bold text-slate-400">
                          {t.installmentLabel}
                        </span>
                        <strong className="mt-0.5 block text-sm font-black text-[#0f1d40]">
                          <span dir="ltr" className="inline-block tabular-nums">
                            {leadCur}
                            {Number(lead.max_installment || 0).toLocaleString(
                              "en-US"
                            )}
                          </span>
                        </strong>
                      </div>
                    </div>

                    {showTargetBudget && (
                      <div className="mt-2 flex items-center justify-between border-t border-slate-200/60 pt-1.5 text-[11px]">
                        <span className="font-bold text-slate-500">
                          {ui.targetBudgetLabel}
                        </span>
                        <strong className="font-extrabold text-[#0f1d40]">
                          <span dir="ltr" className="inline-block tabular-nums">
                            {leadCur}
                            {Number(lead.budget).toLocaleString("en-US")}
                          </span>
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
                      <span dir="ltr" className="inline-block font-mono text-slate-400">
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
                    <LeadStatusControl
                      lead={lead}
                      statusInfo={statusInfo}
                      label={getDisplayStatusLabel(statusInfo.key)}
                      t={t}
                      pending={pending}
                      isOpen={openStatusMenuId === lead.id}
                      onToggleOpen={() => {
                        setOpenMenuId(null)
                        setOpenStatusMenuId(
                          openStatusMenuId === lead.id ? null : lead.id
                        )
                      }}
                      onCloseAll={() => {
                        setOpenStatusMenuId(null)
                        setOpenMenuId(null)
                      }}
                      onRequestStatusChange={(nextStatus) =>
                        setConfirmAction({
                          type: "status",
                          lead,
                          newStatus: nextStatus,
                        })
                      }
                      onOpenOffersLog={() => setOffersLogLead(lead)}
                    />
                  </div>
                </div>

                <div className="space-y-2.5 rounded-b-2xl border-t border-slate-100 bg-slate-50/70 px-4 py-3">
                  {renderLeadFooterActions(
                    lead,
                    parsed,
                    statusInfo,
                    matchedUnitsCount
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

        <div className="mb-2.5 grid grid-cols-[minmax(0,3fr)_minmax(0,2.4fr)_minmax(0,3.4fr)_225px] items-center gap-4 rounded-xl border border-slate-200/90 bg-slate-100/80 px-5 py-2.5 text-[11px] font-extrabold text-slate-600">
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
            {filteredGeneral.map(({ lead, parsed, statusInfo }, index) => {
              const isClosedDeal = statusInfo.key === "closed"
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
              const isAnyMenuOpen =
                openMenuId === `desk_${lead.id}` || openStatusMenuId === lead.id

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
                  data-lead-row-id={lead.id}
                  key={lead.id}
                  className={`relative scroll-mt-24 overflow-visible rounded-2xl border bg-white shadow-2xs transition-all hover:shadow-md ${
                    isAnyMenuOpen ? "z-30" : "z-0"
                  } ${
                    isLoading
                      ? "border-[#007a5a] bg-[#eaf8f2]/30 opacity-60"
                      : isHighlighted
                        ? "border-2 border-[#007a5a] bg-[#eaf8f2]/35 ring-4 ring-[#007a5a]/20"
                        : isClosedDeal
                          ? "border-emerald-200/90 bg-slate-50/40 border-s-4 border-s-[#0f1d40]"
                          : statusInfo.key === "in_deal"
                            ? "border-emerald-300 border-s-4 border-s-[#007a5a]"
                            : statusInfo.key === "negotiating"
                              ? "border-purple-200 border-s-4 border-s-purple-600"
                              : parsed.isDirectUnitSource
                                ? "border-slate-200/90 border-s-4 border-s-orange-500"
                                : "border-slate-200/90 border-s-4 border-s-[#007a5a]"
                  }`}
                >
                  {isHighlighted && t.selectedLeadBadge && (
                    <div className="flex items-center gap-2 rounded-t-2xl border-b border-emerald-200 bg-[#007a5a] px-5 py-1.5 text-[11px] font-extrabold text-white">
                      <span className="size-2 animate-pulse rounded-full bg-emerald-200" />
                      <span>{t.selectedLeadBadge}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,2.4fr)_minmax(0,3.4fr)_225px] items-center gap-4 px-5 py-4 text-start">
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
                        <span dir="ltr" className="inline-block font-mono">
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
                          <span dir="ltr" className="inline-block break-all">
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
                        <span className="text-base font-black text-[#007a5a]">
                          <span dir="ltr" className="inline-block tabular-nums">
                            {leadCur}
                            {Number(
                              lead.available_cash || lead.budget || 0
                            ).toLocaleString("en-US")}
                          </span>
                        </span>
                      </div>

                      <div className="mt-1.5 space-y-1 border-t border-slate-100 pt-1.5 text-[11px] text-slate-500">
                        <div className="flex items-center justify-between gap-2">
                          <span>{t.installmentLabel}</span>
                          <strong className="font-extrabold text-[#0f1d40]">
                            <span dir="ltr" className="inline-block tabular-nums">
                              {leadCur}
                              {Number(lead.max_installment || 0).toLocaleString(
                                "en-US"
                              )}
                            </span>
                          </strong>
                        </div>
                        {showTargetBudget && (
                          <div className="flex items-center justify-between gap-2">
                            <span>{ui.targetBudgetLabel}:</span>
                            <strong className="font-bold text-slate-700">
                              <span dir="ltr" className="inline-block tabular-nums">
                                {leadCur}
                                {Number(lead.budget).toLocaleString("en-US")}
                              </span>
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
                        <span className="text-[10.5px] text-slate-400">
                          📅{" "}
                          <span dir="ltr" className="inline-block font-mono">
                            {new Date(lead.created_at).toLocaleDateString(
                              "en-GB"
                            )}
                          </span>
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
                      <LeadStatusControl
                        lead={lead}
                        statusInfo={statusInfo}
                        label={getDisplayStatusLabel(statusInfo.key)}
                        t={t}
                        pending={pending}
                        isOpen={openStatusMenuId === lead.id}
                        onToggleOpen={() => {
                          setOpenMenuId(null)
                          setOpenStatusMenuId(
                            openStatusMenuId === lead.id ? null : lead.id
                          )
                        }}
                        onCloseAll={() => {
                          setOpenStatusMenuId(null)
                          setOpenMenuId(null)
                        }}
                        onRequestStatusChange={(nextStatus) =>
                          setConfirmAction({
                            type: "status",
                            lead,
                            newStatus: nextStatus,
                          })
                        }
                        onOpenOffersLog={() => setOffersLogLead(lead)}
                      />
                    </div>
                  </div>

                  {/* الشريط السفلي */}
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-b-2xl border-t border-slate-100 bg-slate-50/70 px-5 py-2.5">
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                      {renderLeadFooterActions(
                        lead,
                        parsed,
                        statusInfo,
                        matchedUnitsCount
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

                      <LeadThreeDotsMenu
                        lead={lead}
                        isOpen={openMenuId === `desk_${lead.id}`}
                        pending={pending}
                        expL={expL}
                        deleteBtnLabel={t.deleteBtn}
                        onToggle={() => {
                          setOpenStatusMenuId(null)
                          setOpenMenuId(
                            openMenuId === `desk_${lead.id}`
                              ? null
                              : `desk_${lead.id}`
                          )
                        }}
                        onClose={() => setOpenMenuId(null)}
                        onExportExcel={() =>
                          exportLeadsReport(
                            [lead],
                            "excel",
                            `DualDealz_Buyer_${lead.id.slice(0, 6)}`,
                            `${expL.singleLeadReportTitle} (${lead.name})`
                          )
                        }
                        onExportPdf={() =>
                          exportLeadsReport(
                            [lead],
                            "pdf",
                            `DualDealz_Buyer_${lead.id.slice(0, 6)}`,
                            `${expL.singleLeadReportTitle} (${lead.name})`
                          )
                        }
                        onRequestDelete={() =>
                          setConfirmAction({ type: "delete", lead })
                        }
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <LeadDealQuickSummaryDialog
        dir={dir}
        locale={locale}
        t={t}
        sm={sm}
        dealData={dealQuickSummary}
        leadCur={leadCur}
        commPct={commPct}
        onClose={() => setDealQuickSummary(null)}
      />

      <LeadFrozenAlternativesDialog
        dir={dir}
        locale={locale}
        t={t}
        sm={sm}
        data={frozenAltsData}
        leadCur={leadCur}
        onClose={() => setFrozenAltsData(null)}
      />

      <PhoneOfferDialog
        open={Boolean(phoneOfferLead)}
        onClose={() => setPhoneOfferLead(null)}
        leads={leads}
        units={units}
        preselectedLeadId={phoneOfferLead?.id || null}
        onSuccess={({ offerId, isDirectDeal }) => {
          setNotice({
            text: isDirectDeal
              ? dealsDict.directDealCreatedNotice
              : dealsDict.phoneOfferSentNotice,
          })
          if (isDirectDeal && offerId) {
            router.push(`/admin/deals?offerId=${offerId}`)
          } else {
            router.refresh()
          }
        }}
      />

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
        getLeadStatusLabel={getDisplayStatusLabel}
        onClose={closeConfirmModal}
        onExecute={executeConfirmedAction}
      />
    </div>
  )
}