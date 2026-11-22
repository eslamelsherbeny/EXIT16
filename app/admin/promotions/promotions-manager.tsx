"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  Banknote,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Crown,
  ExternalLink,
  Eye,
  Flame,
  Landmark,
  Loader2,
  Lock,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  X,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
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
  approveBoostRequestByAdminAction,
  managePropertyPromotionAction,
  rejectBoostRequestByAdminAction,
} from "@/actions/admin-actions"
import { useTranslation } from "@/lib/i18n"
import {
  cleanPropertyAreaDisplay,
  deriveShortUnitCode,
  getPropertyHeadline,
  type SellRequest,
} from "../properties/properties-helpers"

export type BoostRequestRow = {
  id: string
  unit_id: string | null
  unit_code: string | null
  user_id: string | null
  package_tier: string
  duration_days: number
  amount_gel: number
  payment_method: string
  status: string
  order_ref: string | null
  admin_note: string | null
  created_at: string
  approved_at: string | null
  rejected_at: string | null
}

function formatDateTimeCompact(iso?: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  const dt = d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  })
  const tm = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
  return `${dt} · ${tm}`
}

function formatTimeWaiting(
  iso: string | null | undefined,
  pm: Record<string, string>
): string {
  if (!iso) return "—"
  const diffMs = Math.max(0, Date.now() - new Date(iso).getTime())
  const mins = Math.floor(diffMs / 60000)
  if (mins < 2) return pm.justNowWord || "1m"
  if (mins < 60) return `${mins} ${pm.minsAgoSuffix || "m"}`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} ${pm.hoursAgoSuffix || "h"}`
  const days = Math.floor(hours / 24)
  return `${days} ${pm.daysAgoSuffix || "d"}`
}

function formatRemainingDetailed(
  untilIso: string | null | undefined,
  pm: Record<string, string>,
  fallbackDays = 1
): string {
  if (!untilIso) return `${fallbackDays} ${pm.daysAgoSuffix || "d"}`
  const diffMs = new Date(untilIso).getTime() - Date.now()
  if (diffMs <= 0) return `0 ${pm.hoursAgoSuffix || "h"}`
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60))
  const days = Math.floor(totalHours / 24)
  const hours = totalHours % 24
  if (days > 0) {
    return hours > 0
      ? `${days} ${pm.daysAgoSuffix || "d"} · ${hours} ${pm.hoursAgoSuffix || "h"}`
      : `${days} ${pm.daysAgoSuffix || "d"}`
  }
  return `${Math.max(1, hours)} ${pm.hoursAgoSuffix || "h"}`
}

function isUnitLiveForBoost(unit?: SellRequest | null): boolean {
  if (!unit) return false
  const st = String(unit.status || "").trim().toLowerCase()
  return st === "active" || st === "offer_received"
}

export function PromotionsManager({
  properties,
  boostRequests,
}: {
  properties: SellRequest[]
  boostRequests: BoostRequestRow[]
}) {
  const router = useRouter()
  const { t: dict, locale, dir } = useTranslation()
  const pm = ((dict.admin as Record<string, any>)?.promotionsManager ||
    {}) as Record<string, string>
  const propDict = ((dict.admin as Record<string, any>)?.propertiesAdmin ||
    {}) as Record<string, any>
  const propBadges = (propDict.badges as Record<string, string>) || {}
  const propStatuses = (propDict.statuses as Record<string, string>) || {}

  const [tab, setTab] = useState<
    "all" | "pending" | "active" | "history" | "manual"
  >("all")
  const [search, setSearch] = useState("")
  const [copiedRef, setCopiedRef] = useState<string | null>(null)
  const [notice, setNotice] = useState<{
    text: string
    isError?: boolean
  } | null>(null)
  const [rejectTarget, setRejectTarget] = useState<{
    kind: "boost_row" | "legacy_unit"
    id: string
    title: string
    isFlittPaid?: boolean
    orderRef?: string | null
  } | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [manualModalUnit, setManualModalUnit] = useState<SellRequest | null>(
    null
  )
  const [manualTier, setManualTier] = useState<"super_vip" | "vip_plus">(
    "super_vip"
  )
  const [manualDays, setManualDays] = useState<number>(7)
  const [manualCashGel, setManualCashGel] = useState<string>("0")
  const [busyId, setBusyId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const propsMap = useMemo(
    () => new Map(properties.map((p) => [String(p.id), p])),
    [properties]
  )

  const latestApprovedByUnitMap = useMemo(() => {
    const map = new Map<string, BoostRequestRow>()
    for (const row of boostRequests) {
      if (row.status === "approved" && row.unit_id && !map.has(row.unit_id)) {
        map.set(row.unit_id, row)
      }
    }
    return map
  }, [boostRequests])

  const pendingBoostRows = useMemo(
    () =>
      boostRequests.filter(
        (b) =>
          b.status === "paid_pending_approval" ||
          b.status === "pending_admin_approval"
      ),
    [boostRequests]
  )

  const pendingUnitIdsInBoostTable = useMemo(
    () => new Set(pendingBoostRows.map((b) => String(b.unit_id || ""))),
    [pendingBoostRows]
  )

  const legacyPendingUnits = useMemo(
    () =>
      properties.filter(
        (p) =>
          !p.is_featured &&
          p.featured_status === "pending_payment" &&
          !pendingUnitIdsInBoostTable.has(String(p.id))
      ),
    [properties, pendingUnitIdsInBoostTable]
  )

  const activeFeaturedUnits = useMemo(
    () =>
      properties.filter(
        (p) =>
          Boolean(p.is_featured) &&
          (!p.featured_until || new Date(p.featured_until) > new Date())
      ),
    [properties]
  )

  const historyBoostRows = useMemo(
    () =>
      boostRequests.filter(
        (b) =>
          b.status === "approved" ||
          b.status === "rejected" ||
          b.status === "expired"
      ),
    [boostRequests]
  )

  const eligibleManualUnits = useMemo(
    () =>
      properties.filter(
        (p) => isUnitLiveForBoost(p) && !Boolean(p.is_featured)
      ),
    [properties]
  )

  const q = search.trim().toLowerCase()
  const matchesQuery = (haystack: string) =>
    !q || haystack.toLowerCase().includes(q)

  const filteredPendingBoostRows = pendingBoostRows.filter((req) => {
    const u = req.unit_id ? propsMap.get(req.unit_id) : null
    return matchesQuery(
      `${req.order_ref || ""} ${req.unit_code || ""} ${u?.project_name || ""} ${u?.name || ""} ${u?.phone || ""}`
    )
  })

  const filteredLegacyPendingUnits = legacyPendingUnits.filter((u) =>
    matchesQuery(
      `${deriveShortUnitCode(u.id, u.code)} ${u.project_name || ""} ${u.name || ""} ${u.phone || ""} ${u.featured_fawry_code || ""}`
    )
  )

  const filteredActiveFeaturedUnits = activeFeaturedUnits.filter((u) => {
    const approvedRow = latestApprovedByUnitMap.get(String(u.id))
    const refStr =
      u.documents?.__unit_meta?.boost_active?.order_ref ||
      approvedRow?.order_ref ||
      u.featured_fawry_code ||
      ""
    return matchesQuery(
      `${deriveShortUnitCode(u.id, u.code)} ${u.project_name || ""} ${u.name || ""} ${u.phone || ""} ${refStr}`
    )
  })

  const pendingTotalCount = pendingBoostRows.length + legacyPendingUnits.length
  const allLiveAndPendingCount = pendingTotalCount + activeFeaturedUnits.length

  function handleCopyRef(code: string) {
    if (!code) return
    navigator.clipboard?.writeText(code)
    setCopiedRef(code)
    setTimeout(() => setCopiedRef(null), 1800)
  }

  function renderUnitStatusBadge(unit?: SellRequest | null) {
    if (!unit) return null
    const st = String(unit.status || "pending").trim().toLowerCase()
    const isLive = isUnitLiveForBoost(unit)
    const label = propStatuses[st] || st

    return (
      <span
        className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-extrabold whitespace-nowrap ${
          isLive
            ? "border-emerald-200 bg-[#eaf8f2] text-[#007a5a]"
            : st === "paused_by_admin" || st === "rejected"
              ? "border-rose-200 bg-rose-50 text-rose-800"
              : "border-amber-300 bg-amber-50 text-amber-900"
        }`}
      >
        {isLive ? (
          <CheckCircle2 className="size-3 shrink-0" />
        ) : (
          <Clock className="size-3 shrink-0" />
        )}
        <span>{label}</span>
      </span>
    )
  }

  function handleApproveBoostRow(req: BoostRequestRow) {
    setBusyId(req.id)
    setNotice(null)
    startTransition(async () => {
      try {
        const res = await approveBoostRequestByAdminAction(req.id)
        if (res.success) {
          setNotice({ text: pm.activatedSuccess })
          router.refresh()
        } else {
          setNotice({
            text: res.error || propDict.loadError,
            isError: true,
          })
        }
      } finally {
        setBusyId(null)
      }
    })
  }

  function handleApproveLegacyUnit(unit: SellRequest) {
    setBusyId(unit.id)
    setNotice(null)
    startTransition(async () => {
      try {
        const tier =
          unit.boost_tier === "vip_plus" ? "vip_plus" : "super_vip"
        const res = await managePropertyPromotionAction(
          unit.id,
          "activate",
          unit.featured_days || 7,
          tier
        )
        if (res.success) {
          setNotice({ text: pm.activatedSuccess })
          router.refresh()
        } else {
          setNotice({
            text: res.error || propDict.loadError,
            isError: true,
          })
        }
      } finally {
        setBusyId(null)
      }
    })
  }

  function handleConfirmReject() {
    if (!rejectTarget) return
    setBusyId(rejectTarget.id)
    setNotice(null)
    startTransition(async () => {
      try {
        const res =
          rejectTarget.kind === "boost_row"
            ? await rejectBoostRequestByAdminAction(
                rejectTarget.id,
                rejectReason.trim() || undefined
              )
            : await managePropertyPromotionAction(rejectTarget.id, "cancel")

        if (res.success) {
          setNotice({ text: pm.rejectedSuccess })
          setRejectTarget(null)
          setRejectReason("")
          router.refresh()
        } else {
          setNotice({
            text: res.error || propDict.loadError,
            isError: true,
          })
        }
      } finally {
        setBusyId(null)
      }
    })
  }

  function handleStopActivePromo(unitId: string) {
    setBusyId(unitId)
    setNotice(null)
    startTransition(async () => {
      try {
        const res = await managePropertyPromotionAction(unitId, "cancel")
        if (res.success) {
          setNotice({ text: pm.cancelledSuccess })
          router.refresh()
        } else {
          setNotice({ text: res.error || propDict.loadError, isError: true })
        }
      } finally {
        setBusyId(null)
      }
    })
  }

  function handleConfirmManualPromote() {
    if (!manualModalUnit) return
    setBusyId(manualModalUnit.id)
    setNotice(null)
    const cashVal = Math.max(0, Math.round(Number(manualCashGel) || 0))
    startTransition(async () => {
      try {
        const res = await managePropertyPromotionAction(
          manualModalUnit.id,
          "activate",
          manualDays,
          manualTier,
          {
            amountGel: cashVal,
            paymentMethod: "cash_manual",
          }
        )
        if (res.success) {
          setNotice({ text: pm.activatedSuccess })
          setManualModalUnit(null)
          setManualCashGel("0")
          router.refresh()
        } else {
          setNotice({ text: res.error || propDict.loadError, isError: true })
        }
      } finally {
        setBusyId(null)
      }
    })
  }

  const renderPendingCards = () => (
    <>
      {filteredPendingBoostRows.map((req) => {
        const unit = req.unit_id ? propsMap.get(req.unit_id) : null
        const isOrphan = !unit
        const uCode =
          req.unit_code ||
          (unit ? deriveShortUnitCode(unit.id, unit.code) : "—")
        const unitTitle = unit
          ? getPropertyHeadline(unit, propDict.table?.unspecifiedProject)
          : uCode
        const isFlittPaid = req.status === "paid_pending_approval"
        const canActivateNow = isUnitLiveForBoost(unit)
        const isRenewal =
          Boolean(unit?.is_featured) &&
          (!unit?.featured_until || new Date(unit.featured_until) > new Date())
        const isBusy = isPending && busyId === req.id

        if (isOrphan) {
          return (
            <div
              key={req.id}
              className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-3.5 text-xs"
            >
              <div className="min-w-0 flex-1">
                <span className="font-black text-slate-700">
                  {req.package_tier} ·{" "}
                  <span dir="ltr" className="inline-block whitespace-nowrap">
                    {`${req.amount_gel}\u00A0₾`}
                  </span>
                </span>
                <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                  {pm.orphanUnitNotice}
                </p>
              </div>
              <button
                type="button"
                disabled={isBusy}
                onClick={() =>
                  setRejectTarget({
                    kind: "boost_row",
                    id: req.id,
                    title: `${req.package_tier} (${req.amount_gel} ₾)`,
                    isFlittPaid,
                    orderRef: req.order_ref,
                  })
                }
                className="inline-flex h-8 items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 text-[11px] font-extrabold text-red-700 hover:bg-red-100"
              >
                <XCircle className="size-3.5" />
                <span>{pm.rejectBtn}</span>
              </button>
            </div>
          )
        }

        return (
          <div
            key={req.id}
            className={`rounded-2xl border bg-white p-3.5 shadow-2xs sm:p-4 ${
              !canActivateNow
                ? "border-2 border-amber-300"
                : isFlittPaid
                  ? "border-2 border-emerald-300"
                  : "border-amber-200"
            }`}
          >
            <div className="flex items-start justify-between gap-2.5">
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    dir="ltr"
                    className="inline-block rounded-md bg-[#0f1d40] px-2 py-0.5 font-mono text-[10px] font-bold text-white whitespace-nowrap"
                  >
                    {uCode}
                  </span>
                  <h3 className="truncate text-xs font-black text-[#0f1d40] sm:text-sm">
                    {unitTitle}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-900 whitespace-nowrap">
                    <Sparkles className="size-3" />
                    <span>
                      {req.package_tier} · {req.duration_days}{" "}
                      {propBadges.dayWord}
                    </span>
                  </span>
                  {renderUnitStatusBadge(unit)}
                  {isRenewal && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-extrabold text-purple-900 whitespace-nowrap">
                      <RefreshCw className="size-3" />
                      <span>{pm.renewalBadge}</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-1">
                <strong className="text-base font-black text-[#007a5a] sm:text-lg">
                  <span
                    dir="ltr"
                    className="inline-block whitespace-nowrap tabular-nums"
                  >
                    {`${req.amount_gel}\u00A0₾`}
                  </span>
                </strong>
                {isFlittPaid ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#007a5a] px-2.5 py-0.5 text-[10px] font-extrabold text-white whitespace-nowrap">
                    <CreditCard className="size-2.5 shrink-0" />
                    <span>{pm.paidFlittBadge}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-900 whitespace-nowrap">
                    <Landmark className="size-2.5 shrink-0" />
                    <span>{pm.bankTransferPendingBadge}</span>
                  </span>
                )}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-start text-[11px] sm:grid-cols-4">
              <div className="min-w-0 rounded-xl border border-slate-200/75 bg-slate-50/70 p-2.5">
                <span className="block text-[9.5px] font-bold text-slate-400">
                  {pm.sellerLabel}
                </span>
                <strong className="mt-0.5 block truncate text-[#0f1d40]">
                  {unit.name || "—"}
                </strong>
                {unit.phone && (
                  <span className="mt-0.5 block truncate text-[10px] text-slate-500">
                    <span dir="ltr" className="inline-block font-mono">
                      {unit.phone}
                    </span>
                  </span>
                )}
              </div>

              <div className="rounded-xl border border-slate-200/75 bg-slate-50/70 p-2.5">
                <span className="block text-[9.5px] font-bold text-slate-400">
                  {pm.paidAtLabel}
                </span>
                <strong className="mt-1 block text-[10.5px] text-[#0f1d40]">
                  <span dir="ltr" className="inline-block font-mono">
                    {formatDateTimeCompact(req.created_at)}
                  </span>
                </strong>
              </div>

              <div className="rounded-xl border border-slate-200/75 bg-slate-50/70 p-2.5">
                <span className="block text-[9.5px] font-bold text-slate-400">
                  {pm.paidSinceLabel}
                </span>
                <strong className="mt-1 block text-xs font-black text-amber-700">
                  {formatTimeWaiting(req.created_at, pm)}
                </strong>
              </div>

              <div className="min-w-0 rounded-xl border border-slate-200/75 bg-slate-50/70 p-2.5">
                <span className="block text-[9.5px] font-bold text-slate-400">
                  {pm.refCodeLabel}
                </span>
                {req.order_ref ? (
                  <button
                    type="button"
                    onClick={() => handleCopyRef(req.order_ref!)}
                    className="mt-1 inline-flex max-w-full items-center gap-1 text-[10.5px] font-black text-[#007a5a] hover:underline"
                  >
                    <span dir="ltr" className="truncate font-mono">
                      {req.order_ref}
                    </span>
                    <Copy className="size-3 shrink-0" />
                    {copiedRef === req.order_ref && (
                      <span className="text-[9.5px]">{pm.copiedRefToast}</span>
                    )}
                  </button>
                ) : (
                  <strong className="mt-1 block text-[10.5px] text-slate-400">
                    —
                  </strong>
                )}
              </div>
            </div>

            {!canActivateNow && (
              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300 bg-amber-50/90 px-3 py-2 text-[11px]">
                <div className="flex items-center gap-1.5 font-bold text-amber-950">
                  <Lock className="size-3.5 shrink-0 text-amber-600" />
                  <span>{pm.unitNotPublishedNotice}</span>
                </div>
                <Link
                  href={`/admin/properties?unitId=${unit.id}`}
                  className="inline-flex h-7 items-center gap-1 rounded-lg bg-[#0f1d40] px-2.5 text-[10.5px] font-extrabold text-white hover:bg-[#1e293b]"
                >
                  <ExternalLink className="size-3 text-emerald-300" />
                  <span>{pm.reviewAndPublishUnitBtn}</span>
                </Link>
              </div>
            )}

            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-2.5 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
              {unit.phone && (
                <a
                  href={`https://wa.me/${String(unit.phone).replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-8.5 items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-3 text-[11px] font-extrabold text-white transition hover:opacity-95 sm:text-xs"
                >
                  <MessageCircle className="size-3.5" />
                  <span>{pm.contactSellerWaBtn}</span>
                </a>
              )}

              <Link
                href={`/admin/properties?unitId=${unit.id}`}
                className="inline-flex h-8.5 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-bold text-[#0f1d40] hover:bg-slate-50 sm:text-xs"
              >
                <ExternalLink className="size-3.5 text-[#007a5a]" />
                <span>{propDict.actions?.detailsBtn}</span>
              </Link>

              <button
                type="button"
                disabled={isBusy}
                onClick={() =>
                  setRejectTarget({
                    kind: "boost_row",
                    id: req.id,
                    title: `${unitTitle} (${req.package_tier})`,
                    isFlittPaid,
                    orderRef: req.order_ref,
                  })
                }
                className="inline-flex h-8.5 items-center justify-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 text-[11px] font-extrabold text-red-700 hover:bg-red-100 disabled:opacity-50 sm:text-xs"
              >
                <XCircle className="size-3.5" />
                <span>{pm.rejectBtn}</span>
              </button>

              <button
                type="button"
                disabled={isBusy || !canActivateNow}
                onClick={() => handleApproveBoostRow(req)}
                className="col-span-2 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#007a5a] px-4 text-xs font-extrabold text-white shadow-2xs hover:bg-[#006248] disabled:cursor-not-allowed disabled:opacity-45 sm:col-span-1 sm:h-8.5"
              >
                {isBusy ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : canActivateNow ? (
                  <Check className="size-3.5" />
                ) : (
                  <Lock className="size-3.5" />
                )}
                <span>{pm.activateBtn}</span>
              </button>
            </div>
          </div>
        )
      })}

      {filteredLegacyPendingUnits.map((unit) => {
        const uCode = deriveShortUnitCode(unit.id, unit.code)
        const unitTitle = getPropertyHeadline(
          unit,
          propDict.table?.unspecifiedProject
        )
        const tierLabel =
          unit.boost_tier === "vip_plus" ? "+VIP" : "SUPER VIP"
        const canActivateNow = isUnitLiveForBoost(unit)
        const isBusy = isPending && busyId === unit.id

        return (
          <div
            key={unit.id}
            className="rounded-2xl border border-amber-200 bg-white p-3.5 shadow-2xs sm:p-4"
          >
            <div className="flex items-start justify-between gap-2.5">
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    dir="ltr"
                    className="inline-block rounded-md bg-[#0f1d40] px-2 py-0.5 font-mono text-[10px] font-bold text-white whitespace-nowrap"
                  >
                    {uCode}
                  </span>
                  <h3 className="truncate text-xs font-black text-[#0f1d40] sm:text-sm">
                    {unitTitle}
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-900 whitespace-nowrap">
                    <Sparkles className="size-3" />
                    <span>
                      {tierLabel} · {unit.featured_days || 7}{" "}
                      {propBadges.dayWord}
                    </span>
                  </span>
                  {renderUnitStatusBadge(unit)}
                </div>
              </div>

              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-900 whitespace-nowrap">
                <Clock className="size-3" />
                <span>{pm.bankTransferPendingBadge}</span>
              </span>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
              <span className="text-[11px] font-semibold text-slate-500">
                {unit.name} ·{" "}
                <span dir="ltr" className="inline-block font-mono">
                  {unit.phone}
                </span>
              </span>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() =>
                    setRejectTarget({
                      kind: "legacy_unit",
                      id: unit.id,
                      title: `${unitTitle} (${tierLabel})`,
                    })
                  }
                  className="inline-flex h-8 items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 text-[11px] font-extrabold text-red-700 hover:bg-red-100 disabled:opacity-50"
                >
                  <XCircle className="size-3.5" />
                  <span>{pm.rejectBtn}</span>
                </button>

                <button
                  type="button"
                  disabled={isBusy || !canActivateNow}
                  onClick={() => handleApproveLegacyUnit(unit)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-[#007a5a] px-3.5 text-[11px] font-extrabold text-white hover:bg-[#006248] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {isBusy ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : canActivateNow ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Lock className="size-3.5" />
                  )}
                  <span>{pm.activateBtn}</span>
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </>
  )

  const renderActiveCards = () => (
    <>
      {filteredActiveFeaturedUnits.map((unit) => {
        const uCode = deriveShortUnitCode(unit.id, unit.code)
        const isVipPlus = unit.boost_tier === "vip_plus"
        const isBusy = isPending && busyId === unit.id
        const activeMeta = (unit.documents?.__unit_meta?.boost_active ||
          {}) as Record<string, any>
        const approvedRow = latestApprovedByUnitMap.get(String(unit.id))

        const resolvedOrderRef: string =
          activeMeta.order_ref ||
          approvedRow?.order_ref ||
          unit.featured_fawry_code ||
          ""
        const resolvedStartedAt: string | null =
          activeMeta.started_at ||
          approvedRow?.approved_at ||
          approvedRow?.created_at ||
          null
        const resolvedPayMethod = String(
          activeMeta.payment_method ||
            approvedRow?.payment_method ||
            (resolvedOrderRef.startsWith("FL-") ? "flitt" : "cash_manual")
        ).toLowerCase()
        const isFlittSource =
          resolvedPayMethod.includes("flitt") ||
          resolvedOrderRef.startsWith("FL-")
        const resolvedAmount = Number(
          activeMeta.amount_gel ??
            approvedRow?.amount_gel ??
            unit.featured_price ??
            0
        )

        const totalViews = Math.max(0, Number(unit.views_count) || 0)
        const viewsGained =
          typeof activeMeta.views_baseline === "number"
            ? Math.max(0, totalViews - activeMeta.views_baseline)
            : null

        return (
          <div
            key={unit.id}
            className="rounded-2xl border border-amber-300 bg-white p-3.5 shadow-2xs sm:p-4"
          >
            <div className="space-y-2.5">
              {/* السطر العلوي: بيانات الوحدة + شارة الحالة */}
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      dir="ltr"
                      className="inline-block rounded-md bg-[#0f1d40] px-2 py-0.5 font-mono text-[10px] font-bold text-white whitespace-nowrap"
                    >
                      {uCode}
                    </span>
                    <Link
                      href={`/opportunities/${unit.id}`}
                      target="_blank"
                      className="truncate text-xs font-black text-[#0f1d40] hover:text-[#007a5a] hover:underline sm:text-sm"
                    >
                      {getPropertyHeadline(
                        unit,
                        propDict.table?.unspecifiedProject
                      )}
                    </Link>
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-black whitespace-nowrap ${
                        isVipPlus
                          ? "bg-indigo-100 text-indigo-900"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {isVipPlus ? (
                        <Flame className="size-3" />
                      ) : (
                        <Crown className="size-3" />
                      )}
                      <span>{isVipPlus ? "+VIP" : "SUPER VIP"}</span>
                    </span>
                  </div>

                  <p className="text-[11px] font-semibold text-slate-500">
                    {cleanPropertyAreaDisplay(unit.area, locale)} · {unit.name}{" "}
                    (
                    <span dir="ltr" className="inline-block font-mono">
                      {unit.phone}
                    </span>
                    )
                  </p>
                </div>

                {renderUnitStatusBadge(unit)}
              </div>

              {/* شريط الدفع والمرجع بعرض الكارت بالكامل — كل شارة في صف واحد بدون أي كسر */}
              <div className="flex flex-wrap items-center gap-1.5">
                {isFlittSource ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#007a5a] px-3 py-1 text-[10.5px] font-extrabold text-white whitespace-nowrap">
                    <CreditCard className="size-3 shrink-0" />
                    <span>{pm.paidFlittBadge}</span>
                    {resolvedAmount > 0 && (
                      <span
                        dir="ltr"
                        className="inline-block whitespace-nowrap tabular-nums"
                      >
                        {`·\u00A0${resolvedAmount}\u00A0₾`}
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[10.5px] font-extrabold text-slate-700 whitespace-nowrap">
                    <Banknote className="size-3 shrink-0 text-[#007a5a]" />
                    <span>{pm.manualBadge}</span>
                    {resolvedAmount > 0 && (
                      <span
                        dir="ltr"
                        className="inline-block whitespace-nowrap tabular-nums"
                      >
                        {`·\u00A0${resolvedAmount}\u00A0₾`}
                      </span>
                    )}
                  </span>
                )}

                {resolvedOrderRef && (
                  <button
                    type="button"
                    onClick={() => handleCopyRef(resolvedOrderRef)}
                    className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-emerald-200 bg-[#eaf8f2]/70 px-3 py-1 text-[10.5px] font-extrabold text-[#007a5a] whitespace-nowrap transition hover:bg-[#eaf8f2]"
                  >
                    <span className="shrink-0">{pm.refCodeLabel}:</span>
                    <span
                      dir="ltr"
                      className="inline-block truncate font-mono whitespace-nowrap"
                    >
                      {resolvedOrderRef}
                    </span>
                    <Copy className="size-3 shrink-0" />
                    {copiedRef === resolvedOrderRef && (
                      <span className="shrink-0">{pm.copiedRefToast}</span>
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-start text-[11px] sm:grid-cols-4">
              <div className="rounded-xl border border-slate-200/75 bg-slate-50/70 p-2.5">
                <span className="flex items-center gap-1 text-[9.5px] font-bold text-slate-400">
                  <CalendarClock className="size-3 shrink-0 text-[#007a5a]" />
                  <span>{pm.startedAtLabel}</span>
                </span>
                <strong className="mt-1 block text-[10.5px] text-[#0f1d40]">
                  <span dir="ltr" className="inline-block font-mono">
                    {formatDateTimeCompact(resolvedStartedAt)}
                  </span>
                </strong>
              </div>

              <div className="rounded-xl border border-slate-200/75 bg-slate-50/70 p-2.5">
                <span className="flex items-center gap-1 text-[9.5px] font-bold text-slate-400">
                  <Clock className="size-3 shrink-0 text-amber-600" />
                  <span>{pm.endsAtLabel}</span>
                </span>
                <strong className="mt-1 block text-[10.5px] text-[#0f1d40]">
                  <span dir="ltr" className="inline-block font-mono">
                    {formatDateTimeCompact(unit.featured_until)}
                  </span>
                </strong>
              </div>

              <div className="rounded-xl border border-emerald-200/80 bg-[#eaf8f2]/60 p-2.5">
                <span className="block text-[9.5px] font-bold text-[#007a5a]">
                  {pm.remainingTimeLabel}
                </span>
                <strong className="mt-1 block text-[11px] font-black text-[#007a5a]">
                  {formatRemainingDetailed(
                    unit.featured_until,
                    pm,
                    unit.featured_days || 7
                  )}
                </strong>
              </div>

              <div className="rounded-xl border border-blue-200/70 bg-blue-50/50 p-2.5">
                <span className="flex items-center gap-1 text-[9.5px] font-bold text-[#2563eb]">
                  <Eye className="size-3 shrink-0" />
                  <span>{pm.viewsLabel}</span>
                </span>
                <strong className="mt-1 block text-[11px] font-black text-[#0f1d40]">
                  <span dir="ltr" className="inline-block tabular-nums">
                    {totalViews.toLocaleString("en-US")}
                  </span>
                  {viewsGained !== null ? (
                    <span className="ms-1 text-[10px] font-extrabold text-[#007a5a]">
                      (+{viewsGained})
                    </span>
                  ) : null}
                </strong>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-2.5 sm:flex sm:items-center sm:justify-end">
              {unit.phone && (
                <a
                  href={`https://wa.me/${String(unit.phone).replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-8.5 items-center justify-center gap-1 rounded-xl bg-[#25D366] px-3 text-[11px] font-extrabold text-white"
                >
                  <MessageCircle className="size-3.5" />
                  <span>{pm.contactSellerWaBtn}</span>
                </a>
              )}

              <Link
                href={`/admin/properties?unitId=${unit.id}`}
                className="inline-flex h-8.5 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-bold text-[#0f1d40] hover:bg-slate-50"
              >
                <ExternalLink className="size-3.5 text-[#007a5a]" />
                <span>{propDict.actions?.detailsBtn}</span>
              </Link>

              <button
                type="button"
                disabled={isBusy}
                onClick={() => {
                  setManualModalUnit(unit)
                  setManualTier(isVipPlus ? "vip_plus" : "super_vip")
                  setManualDays(7)
                  setManualCashGel("0")
                }}
                className="inline-flex h-8.5 items-center justify-center gap-1 rounded-xl border border-emerald-200 bg-[#eaf8f2] px-3 text-[11px] font-extrabold text-[#007a5a] hover:bg-emerald-100"
              >
                <Plus className="size-3.5" />
                <span>{pm.extendManualBtn}</span>
              </button>

              <button
                type="button"
                disabled={isBusy}
                onClick={() => handleStopActivePromo(unit.id)}
                className="col-span-3 inline-flex h-8.5 items-center justify-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 text-[11px] font-extrabold text-red-700 hover:bg-red-100 disabled:opacity-50 sm:col-span-1"
              >
                {isBusy ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <XCircle className="size-3.5" />
                )}
                <span>{pm.stopPromoBtn}</span>
              </button>
            </div>
          </div>
        )
      })}
    </>
  )

  return (
    <div dir={dir} className="space-y-3.5 text-start sm:space-y-4">
      <div className="rounded-2xl border border-slate-200/90 bg-white px-4 py-3.5 shadow-2xs sm:px-5 sm:py-4">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10.5px] font-extrabold text-amber-800 sm:text-[11px]">
          <Star className="size-3 fill-amber-400 text-amber-600" />
          <span>{pm.eyebrow}</span>
        </div>
        <h1 className="mt-1 text-base leading-snug font-black text-[#0f1d40] sm:text-xl">
          {pm.title}
        </h1>
        <p className="mt-0.5 text-[11px] leading-relaxed font-medium text-slate-500 sm:text-xs">
          {pm.subtitle}
        </p>
      </div>

      {notice && (
        <div
          className={`flex items-center justify-between gap-2 rounded-xl border p-3 text-xs font-extrabold shadow-xs ${
            notice.isError
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-[#eaf8f2] text-[#007a5a]"
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.isError ? (
              <AlertTriangle className="size-4 shrink-0" />
            ) : (
              <CheckCircle2 className="size-4 shrink-0" />
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

      {/* شريط البحث والتبويبات مع تبويب الكل الافتراضي */}
      <div className="flex flex-col gap-2.5 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-2xs sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-3.5">
        <div className="relative w-full sm:max-w-xs sm:flex-1">
          <Search className="pointer-events-none absolute top-1/2 end-3 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={pm.searchPlaceholder}
            className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 ps-3 pe-9 text-xs font-semibold focus:border-[#007a5a] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(
            [
              {
                id: "all",
                label: `${pm.tabAll || "الكل"} (${allLiveAndPendingCount})`,
              },
              {
                id: "pending",
                label: `${pm.tabPending} (${pendingTotalCount})`,
              },
              {
                id: "active",
                label: `${pm.tabActive} (${activeFeaturedUnits.length})`,
              },
              {
                id: "history",
                label: `${pm.tabHistory} (${historyBoostRows.length})`,
              },
              {
                id: "manual",
                label: `${pm.tabManual} (${eligibleManualUnits.length})`,
              },
            ] as const
          ).map((tItem) => (
            <button
              key={tItem.id}
              type="button"
              onClick={() => setTab(tItem.id)}
              className={`rounded-xl px-3 py-1.5 text-[11px] font-extrabold transition sm:px-3.5 sm:text-xs ${
                tab === tItem.id
                  ? "bg-[#007a5a] text-white shadow-2xs"
                  : tItem.id === "pending" && pendingTotalCount > 0
                    ? "bg-amber-50 text-amber-900 hover:bg-amber-100"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tItem.label}
            </button>
          ))}
        </div>
      </div>

      {/* تبويب الكل: طلبات التفعيل أولاً ثم الإعلانات النشطة حالياً */}
      {tab === "all" && (
        <div className="space-y-4">
          {filteredPendingBoostRows.length === 0 &&
          filteredLegacyPendingUnits.length === 0 &&
          filteredActiveFeaturedUnits.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-xs font-bold text-slate-400">
              {pm.emptyAll || pm.emptyPending}
            </div>
          ) : (
            <>
              {(filteredPendingBoostRows.length > 0 ||
                filteredLegacyPendingUnits.length > 0) && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <span className="size-2 rounded-full bg-amber-500" />
                    <h2 className="text-xs font-black text-[#0f1d40]">
                      {pm.sectionPendingTitle || pm.tabPending} (
                      {filteredPendingBoostRows.length +
                        filteredLegacyPendingUnits.length}
                      )
                    </h2>
                  </div>
                  {renderPendingCards()}
                </div>
              )}

              {filteredActiveFeaturedUnits.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <span className="size-2 rounded-full bg-[#007a5a]" />
                    <h2 className="text-xs font-black text-[#0f1d40]">
                      {pm.sectionActiveTitle || pm.tabActive} (
                      {filteredActiveFeaturedUnits.length})
                    </h2>
                  </div>
                  {renderActiveCards()}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* تبويب بانتظار التفعيل */}
      {tab === "pending" && (
        <div className="space-y-3">
          {filteredPendingBoostRows.length === 0 &&
          filteredLegacyPendingUnits.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-xs font-bold text-slate-400">
              {pm.emptyPending}
            </div>
          ) : (
            renderPendingCards()
          )}
        </div>
      )}

      {/* تبويب نشطة حالياً */}
      {tab === "active" && (
        <div className="space-y-3">
          {filteredActiveFeaturedUnits.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-xs font-bold text-slate-400">
              {pm.emptyActive}
            </div>
          ) : (
            renderActiveCards()
          )}
        </div>
      )}

      {/* تبويب السجل */}
      {tab === "history" && (
        <div className="space-y-2.5">
          {historyBoostRows.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-xs font-bold text-slate-400">
              {pm.emptyHistory}
            </div>
          ) : (
            historyBoostRows
              .filter((req) => {
                const u = req.unit_id ? propsMap.get(req.unit_id) : null
                return matchesQuery(
                  `${req.order_ref || ""} ${req.unit_code || ""} ${u?.project_name || ""} ${u?.name || ""}`
                )
              })
              .map((req) => {
                const unit = req.unit_id ? propsMap.get(req.unit_id) : null
                const isApproved = req.status === "approved"
                const isManualCash =
                  req.payment_method === "cash_manual" ||
                  String(req.order_ref || "").startsWith("MN-")
                return (
                  <div
                    key={req.id}
                    className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-4"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          dir="ltr"
                          className="inline-block rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#0f1d40] whitespace-nowrap"
                        >
                          {req.unit_code ||
                            (unit
                              ? deriveShortUnitCode(unit.id, unit.code)
                              : "—")}
                        </span>
                        <strong className="truncate text-[#0f1d40]">
                          {unit ? getPropertyHeadline(unit, "—") : "—"}
                        </strong>
                        <span className="text-[11px] font-bold text-slate-500">
                          {req.package_tier} · {req.duration_days}{" "}
                          {propBadges.dayWord}
                        </span>
                        {isManualCash && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9.5px] font-extrabold text-slate-600">
                            {pm.manualBadge}
                          </span>
                        )}
                      </div>
                      {req.order_ref && (
                        <button
                          type="button"
                          onClick={() => handleCopyRef(req.order_ref!)}
                          className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-[#007a5a]"
                        >
                          <span dir="ltr" className="inline-block font-mono">
                            {req.order_ref}
                          </span>
                          <Copy className="size-2.5" />
                          {copiedRef === req.order_ref && (
                            <span className="font-bold text-[#007a5a]">
                              {pm.copiedRefToast}
                            </span>
                          )}
                        </button>
                      )}
                      {req.admin_note && (
                        <p className="text-[11px] font-semibold text-red-600">
                          {req.admin_note}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2.5 border-t border-slate-100 pt-2 sm:justify-end sm:border-0 sm:pt-0">
                      <strong className="font-black text-[#0f1d40]">
                        <span
                          dir="ltr"
                          className="inline-block whitespace-nowrap tabular-nums"
                        >
                          {`${req.amount_gel}\u00A0₾`}
                        </span>
                      </strong>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold whitespace-nowrap ${
                          isApproved
                            ? "bg-[#eaf8f2] text-[#007a5a]"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {isApproved ? pm.approvedBadge : pm.rejectedBadge}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        <span dir="ltr" className="inline-block font-mono">
                          {formatDateTimeCompact(
                            req.approved_at || req.rejected_at || req.created_at
                          )}
                        </span>
                      </span>
                    </div>
                  </div>
                )
              })
          )}
        </div>
      )}

      {/* تبويب تمييز يدوي / كاش */}
      {tab === "manual" && (
        <div className="space-y-2.5">
          <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-3.5 py-2 text-[11px] font-semibold text-blue-950 sm:text-xs">
            {pm.onlyActiveUnitHint}
          </div>
          {eligibleManualUnits
            .filter((u) =>
              matchesQuery(
                `${deriveShortUnitCode(u.id, u.code)} ${u.project_name || ""} ${u.name || ""} ${u.phone || ""}`
              )
            )
            .map((unit) => {
              const uCode = deriveShortUnitCode(unit.id, unit.code)
              return (
                <div
                  key={unit.id}
                  className="flex items-center justify-between gap-2.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-xs sm:px-4"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        dir="ltr"
                        className="inline-block rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#0f1d40] whitespace-nowrap"
                      >
                        {uCode}
                      </span>
                      <strong className="truncate text-xs text-[#0f1d40] sm:text-sm">
                        {getPropertyHeadline(
                          unit,
                          propDict.table?.unspecifiedProject
                        )}
                      </strong>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-500">
                      {cleanPropertyAreaDisplay(unit.area, locale)} ·{" "}
                      {unit.name}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setManualModalUnit(unit)
                      setManualTier("super_vip")
                      setManualDays(7)
                      setManualCashGel("0")
                    }}
                    className="inline-flex h-8.5 shrink-0 items-center gap-1 rounded-xl border border-amber-300 bg-amber-50 px-3 text-[11px] font-extrabold text-amber-900 hover:bg-amber-100 sm:text-xs"
                  >
                    <Star className="size-3.5 text-amber-600" />
                    <span>{pm.manualPromoteBtn}</span>
                  </button>
                </div>
              )
            })}
        </div>
      )}

      {/* نافذة تأكيد الرفض */}
      <Dialog
        open={Boolean(rejectTarget)}
        onOpenChange={(o) => !o && setRejectTarget(null)}
      >
        <DialogContent
          dir={dir}
          className="w-[92vw] max-w-[430px] rounded-2xl p-5 text-start"
        >
          {rejectTarget && (
            <>
              <DialogHeader className="text-start">
                <DialogTitle className="text-sm font-black text-[#0f1d40]">
                  {pm.rejectModalTitle}
                </DialogTitle>
                <DialogDescription className="text-start text-xs text-slate-600">
                  {pm.rejectModalDesc} —{" "}
                  <strong className="text-[#0f1d40]">
                    {rejectTarget.title}
                  </strong>
                </DialogDescription>
              </DialogHeader>

              {rejectTarget.isFlittPaid && (
                <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-[11px] leading-relaxed font-bold text-amber-950">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                  <div>
                    <p>{pm.flittRefundWarning}</p>
                    {rejectTarget.orderRef && (
                      <p className="mt-1 text-[#0f1d40]">
                        <span dir="ltr" className="inline-block font-mono">
                          Ref: {rejectTarget.orderRef}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={pm.rejectReasonPlaceholder}
                className="mt-3 min-h-[75px] rounded-xl text-xs"
              />

              <DialogFooter className="mt-4 flex flex-row justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => setRejectTarget(null)}
                  className="h-9 rounded-xl text-xs font-bold"
                >
                  {pm.cancelBtn}
                </Button>
                <Button
                  type="button"
                  disabled={isPending}
                  onClick={handleConfirmReject}
                  className="h-9 rounded-xl bg-red-600 text-xs font-bold text-white hover:bg-red-700"
                >
                  {isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    pm.confirmRejectBtn
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* نافذة التمييز / التمديد اليدوي والكاش */}
      <Dialog
        open={Boolean(manualModalUnit)}
        onOpenChange={(o) => !o && setManualModalUnit(null)}
      >
        <DialogContent
          dir={dir}
          className="w-[92vw] max-w-[420px] rounded-2xl p-5 text-start"
        >
          {manualModalUnit && (
            <>
              <DialogHeader className="text-start">
                <DialogTitle className="text-sm font-black text-[#0f1d40]">
                  {propDict.modals?.activatePromoTitle}
                </DialogTitle>
                <DialogDescription className="text-start text-xs text-slate-600">
                  {getPropertyHeadline(manualModalUnit, manualModalUnit.name)}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: "super_vip", label: "SUPER VIP", icon: Crown },
                      { id: "vip_plus", label: "+VIP", icon: Flame },
                    ] as const
                  ).map((opt) => {
                    const Icon = opt.icon
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setManualTier(opt.id)}
                        className={`flex items-center justify-center gap-1.5 rounded-xl border-2 py-2.5 text-xs font-extrabold ${
                          manualTier === opt.id
                            ? "border-[#007a5a] bg-[#eaf8f2] text-[#007a5a]"
                            : "border-slate-200 bg-white text-slate-600"
                        }`}
                      >
                        <Icon className="size-3.5" />
                        <span>{opt.label}</span>
                      </button>
                    )
                  })}
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[1, 7, 14, 30].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setManualDays(days)}
                      className={`rounded-xl border py-2 text-xs font-extrabold ${
                        manualDays === days
                          ? "border-[#007a5a] bg-[#eaf8f2] text-[#007a5a]"
                          : "border-slate-200 bg-white text-slate-600"
                      }`}
                    >
                      {days} {propBadges.dayWord}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-600">
                    {pm.cashAmountLabel}
                  </label>
                  <input
                    type="number"
                    min={0}
                    dir="ltr"
                    value={manualCashGel}
                    onChange={(e) => setManualCashGel(e.target.value)}
                    placeholder={pm.cashAmountPlaceholder}
                    className="h-9.5 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs font-black text-[#0f1d40] focus:border-[#007a5a] focus:bg-white focus:outline-none"
                  />
                  <p className="mt-1 text-[10.5px] font-medium text-slate-500">
                    {pm.cashNoteHint}
                  </p>
                </div>
              </div>

              <DialogFooter className="mt-4 flex flex-row justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setManualModalUnit(null)}
                  className="h-9 rounded-xl text-xs font-bold"
                >
                  {pm.cancelBtn}
                </Button>
                <Button
                  type="button"
                  disabled={isPending}
                  onClick={handleConfirmManualPromote}
                  className="h-9 rounded-xl bg-[#007a5a] text-xs font-bold text-white hover:bg-[#006248]"
                >
                  {isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    pm.activateBtn
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