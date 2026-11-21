"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Crown,
  ExternalLink,
  Flame,
  Landmark,
  Loader2,
  Lock,
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

function getRemainingDays(untilIso?: string | null, fallbackDays = 1): number {
  if (untilIso) {
    const diff = new Date(untilIso).getTime() - Date.now()
    if (diff > 0) return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)))
    return 0
  }
  return Math.max(1, fallbackDays)
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

  const [tab, setTab] = useState<"pending" | "active" | "history" | "manual">(
    "pending"
  )
  const [search, setSearch] = useState("")
  const [notice, setNotice] = useState<{
    text: string
    isError?: boolean
  } | null>(null)
  const [rejectTarget, setRejectTarget] = useState<{
    kind: "boost_row" | "legacy_unit"
    id: string
    title: string
  } | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [manualModalUnit, setManualModalUnit] = useState<SellRequest | null>(
    null
  )
  const [manualTier, setManualTier] = useState<"super_vip" | "vip_plus">(
    "super_vip"
  )
  const [manualDays, setManualDays] = useState<number>(7)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const propsMap = useMemo(
    () => new Map(properties.map((p) => [String(p.id), p])),
    [properties]
  )

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

  const pendingTotalCount = pendingBoostRows.length + legacyPendingUnits.length

  function renderUnitStatusBadge(unit?: SellRequest | null) {
    if (!unit) return null
    const st = String(unit.status || "pending").trim().toLowerCase()
    const isLive = isUnitLiveForBoost(unit)
    const label = propStatuses[st] || st

    return (
      <span
        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10.5px] font-extrabold ${
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
    startTransition(async () => {
      try {
        const res = await managePropertyPromotionAction(
          manualModalUnit.id,
          "activate",
          manualDays,
          manualTier
        )
        if (res.success) {
          setNotice({ text: pm.activatedSuccess })
          setManualModalUnit(null)
          router.refresh()
        } else {
          setNotice({ text: res.error || propDict.loadError, isError: true })
        }
      } finally {
        setBusyId(null)
      }
    })
  }

  return (
    <div dir={dir} className="space-y-4 text-start">
      <div className="rounded-2xl border border-slate-200/90 bg-white px-5 py-4 shadow-2xs">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-extrabold text-amber-800">
          <Star className="size-3.5 fill-amber-400 text-amber-600" />
          <span>{pm.eyebrow}</span>
        </div>
        <h1 className="mt-1 text-lg font-black text-[#0f1d40] sm:text-xl">
          {pm.title}
        </h1>
        <p className="mt-0.5 text-xs font-medium text-slate-500">
          {pm.subtitle}
        </p>
      </div>

      {notice && (
        <div
          className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 text-xs font-extrabold shadow-xs ${
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

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
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
              className={`rounded-xl px-3.5 py-1.5 text-xs font-extrabold transition ${
                tab === tItem.id
                  ? "bg-[#007a5a] text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tItem.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "pending" && (
        <div className="space-y-3">
          {pendingTotalCount === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-xs font-bold text-slate-400">
              {pm.emptyPending}
            </div>
          ) : (
            <>
              {pendingBoostRows
                .filter((req) => {
                  const u = req.unit_id ? propsMap.get(req.unit_id) : null
                  return matchesQuery(
                    `${req.order_ref || ""} ${req.unit_code || ""} ${u?.project_name || ""} ${u?.name || ""} ${u?.phone || ""}`
                  )
                })
                .map((req) => {
                  const unit = req.unit_id ? propsMap.get(req.unit_id) : null
                  const uCode =
                    req.unit_code ||
                    (unit ? deriveShortUnitCode(unit.id, unit.code) : "—")
                  const unitTitle = unit
                    ? getPropertyHeadline(
                        unit,
                        propDict.table?.unspecifiedProject
                      )
                    : uCode
                  const isFlittPaid = req.status === "paid_pending_approval"
                  const canActivateNow = isUnitLiveForBoost(unit)
                  const isBusy = isPending && busyId === req.id

                  return (
                    <div
                      key={req.id}
                      className={`rounded-2xl border bg-white p-4 shadow-2xs ${
                        !canActivateNow
                          ? "border-2 border-amber-300"
                          : isFlittPaid
                            ? "border-2 border-emerald-300"
                            : "border-amber-200"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-[#0f1d40] px-2 py-0.5 font-mono text-[10.5px] font-bold text-white">
                              {uCode}
                            </span>
                            <h3 className="text-sm font-black text-[#0f1d40]">
                              {unitTitle}
                            </h3>
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[10.5px] font-black text-amber-900">
                              <Sparkles className="size-3" />
                              <span>
                                {req.package_tier} · {req.duration_days}{" "}
                                {propBadges.dayWord}
                              </span>
                            </span>
                            {renderUnitStatusBadge(unit)}
                          </div>

                          <p className="text-xs font-semibold text-slate-500">
                            {pm.sellerLabel}:{" "}
                            <strong className="text-[#0f1d40]">
                              {unit?.name || "—"}
                            </strong>
                            {unit?.phone ? (
                              <>
                                {" "}
                                ·{" "}
                                <span dir="ltr" className="font-mono">
                                  {unit.phone}
                                </span>
                              </>
                            ) : null}
                            {req.order_ref ? (
                              <>
                                {" "}
                                · {pm.refCodeLabel}:{" "}
                                <span dir="ltr" className="font-mono font-bold">
                                  {req.order_ref}
                                </span>
                              </>
                            ) : null}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <strong
                            dir="ltr"
                            className="text-lg font-black text-[#007a5a] tabular-nums"
                          >
                            {req.amount_gel} ₾
                          </strong>
                          {isFlittPaid ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#007a5a] px-2.5 py-0.5 text-[10.5px] font-extrabold text-white">
                              <CreditCard className="size-3" />
                              <span>{pm.paidFlittBadge}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10.5px] font-extrabold text-amber-900">
                              <Landmark className="size-3" />
                              <span>{pm.bankTransferPendingBadge}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {!canActivateNow && unit && (
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300 bg-amber-50/90 px-3.5 py-2.5 text-xs">
                          <div className="flex items-center gap-2 font-bold text-amber-950">
                            <Lock className="size-4 shrink-0 text-amber-600" />
                            <span>{pm.unitNotPublishedNotice}</span>
                          </div>
                          <Link
                            href={`/admin/properties?unitId=${unit.id}`}
                            className="inline-flex h-7.5 items-center gap-1 rounded-lg bg-[#0f1d40] px-3 text-[11px] font-extrabold text-white hover:bg-[#1e293b]"
                          >
                            <ExternalLink className="size-3 text-emerald-300" />
                            <span>{pm.reviewAndPublishUnitBtn}</span>
                          </Link>
                        </div>
                      )}

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                        <span
                          dir="ltr"
                          className="font-mono text-[11px] text-slate-400"
                        >
                          {new Date(req.created_at).toLocaleDateString("en-GB")}
                        </span>

                        <div className="flex flex-wrap items-center gap-2">
                          {unit && (
                            <Link
                              href={`/admin/properties?unitId=${unit.id}`}
                              className="inline-flex h-8.5 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-[#0f1d40] hover:bg-slate-50"
                            >
                              <ExternalLink className="size-3.5 text-[#007a5a]" />
                              <span>{propDict.actions?.detailsBtn}</span>
                            </Link>
                          )}

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              setRejectTarget({
                                kind: "boost_row",
                                id: req.id,
                                title: `${unitTitle} (${req.package_tier})`,
                              })
                            }
                            className="inline-flex h-8.5 items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-extrabold text-red-700 hover:bg-red-100 disabled:opacity-50"
                          >
                            <XCircle className="size-3.5" />
                            <span>{pm.rejectBtn}</span>
                          </button>

                          <button
                            type="button"
                            disabled={isBusy || !canActivateNow}
                            onClick={() => handleApproveBoostRow(req)}
                            className="inline-flex h-8.5 items-center gap-1.5 rounded-xl bg-[#007a5a] px-4 text-xs font-extrabold text-white shadow-2xs hover:bg-[#006248] disabled:cursor-not-allowed disabled:opacity-45"
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

              {legacyPendingUnits
                .filter((u) =>
                  matchesQuery(
                    `${deriveShortUnitCode(u.id, u.code)} ${u.project_name || ""} ${u.name || ""} ${u.phone || ""} ${u.featured_fawry_code || ""}`
                  )
                )
                .map((unit) => {
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
                      className="rounded-2xl border border-amber-200 bg-white p-4 shadow-2xs"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-[#0f1d40] px-2 py-0.5 font-mono text-[10.5px] font-bold text-white">
                              {uCode}
                            </span>
                            <h3 className="text-sm font-black text-[#0f1d40]">
                              {unitTitle}
                            </h3>
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[10.5px] font-black text-amber-900">
                              <Sparkles className="size-3" />
                              <span>
                                {tierLabel} · {unit.featured_days || 7}{" "}
                                {propBadges.dayWord}
                              </span>
                            </span>
                            {renderUnitStatusBadge(unit)}
                          </div>
                          <p className="text-xs font-semibold text-slate-500">
                            {pm.sellerLabel}:{" "}
                            <strong className="text-[#0f1d40]">
                              {unit.name}
                            </strong>{" "}
                            ·{" "}
                            <span dir="ltr" className="font-mono">
                              {unit.phone}
                            </span>
                          </p>
                        </div>

                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10.5px] font-extrabold text-amber-900">
                          <Clock className="size-3" />
                          <span>{pm.bankTransferPendingBadge}</span>
                        </span>
                      </div>

                      {!canActivateNow && (
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300 bg-amber-50/90 px-3.5 py-2.5 text-xs">
                          <div className="flex items-center gap-2 font-bold text-amber-950">
                            <Lock className="size-4 shrink-0 text-amber-600" />
                            <span>{pm.unitNotPublishedNotice}</span>
                          </div>
                          <Link
                            href={`/admin/properties?unitId=${unit.id}`}
                            className="inline-flex h-7.5 items-center gap-1 rounded-lg bg-[#0f1d40] px-3 text-[11px] font-extrabold text-white hover:bg-[#1e293b]"
                          >
                            <ExternalLink className="size-3 text-emerald-300" />
                            <span>{pm.reviewAndPublishUnitBtn}</span>
                          </Link>
                        </div>
                      )}

                      <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-3">
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
                          className="inline-flex h-8.5 items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-extrabold text-red-700 hover:bg-red-100 disabled:opacity-50"
                        >
                          <XCircle className="size-3.5" />
                          <span>{pm.rejectBtn}</span>
                        </button>

                        <button
                          type="button"
                          disabled={isBusy || !canActivateNow}
                          onClick={() => handleApproveLegacyUnit(unit)}
                          className="inline-flex h-8.5 items-center gap-1.5 rounded-xl bg-[#007a5a] px-4 text-xs font-extrabold text-white hover:bg-[#006248] disabled:cursor-not-allowed disabled:opacity-45"
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
            </>
          )}
        </div>
      )}

      {tab === "active" && (
        <div className="space-y-3">
          {activeFeaturedUnits.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-xs font-bold text-slate-400">
              {pm.emptyActive}
            </div>
          ) : (
            activeFeaturedUnits
              .filter((u) =>
                matchesQuery(
                  `${deriveShortUnitCode(u.id, u.code)} ${u.project_name || ""} ${u.name || ""} ${u.phone || ""}`
                )
              )
              .map((unit) => {
                const uCode = deriveShortUnitCode(unit.id, unit.code)
                const isVipPlus = unit.boost_tier === "vip_plus"
                const remaining = getRemainingDays(
                  unit.featured_until,
                  unit.featured_days || 7
                )
                const isBusy = isPending && busyId === unit.id

                return (
                  <div
                    key={unit.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-white p-4 shadow-2xs"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-[#0f1d40] px-2 py-0.5 font-mono text-[10.5px] font-bold text-white">
                          {uCode}
                        </span>
                        <Link
                          href={`/opportunities/${unit.id}`}
                          target="_blank"
                          className="text-sm font-black text-[#0f1d40] hover:text-[#007a5a] hover:underline"
                        >
                          {getPropertyHeadline(
                            unit,
                            propDict.table?.unspecifiedProject
                          )}
                        </Link>
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10.5px] font-black ${
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
                        {renderUnitStatusBadge(unit)}
                      </div>

                      <p className="text-xs font-semibold text-slate-500">
                        {cleanPropertyAreaDisplay(unit.area, locale)} ·{" "}
                        {unit.name} (
                        <span dir="ltr" className="font-mono">
                          {unit.phone}
                        </span>
                        )
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="rounded-xl border border-emerald-200 bg-[#eaf8f2] px-3 py-1.5 text-center">
                        <span className="block text-[10px] font-bold text-[#007a5a]">
                          {pm.remainingDaysLabel}
                        </span>
                        <strong className="text-sm font-black text-[#0f1d40]">
                          {remaining} {propBadges.dayWord}
                        </strong>
                        {unit.featured_until && (
                          <span
                            dir="ltr"
                            className="block font-mono text-[9.5px] text-slate-500"
                          >
                            {new Date(unit.featured_until).toLocaleDateString(
                              "en-GB"
                            )}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleStopActivePromo(unit.id)}
                        className="inline-flex h-9 items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-extrabold text-red-700 hover:bg-red-100 disabled:opacity-50"
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
              })
          )}
        </div>
      )}

      {tab === "history" && (
        <div className="space-y-2.5">
          {historyBoostRows.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-xs font-bold text-slate-400">
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
                return (
                  <div
                    key={req.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10.5px] font-bold text-[#0f1d40]">
                          {req.unit_code ||
                            (unit
                              ? deriveShortUnitCode(unit.id, unit.code)
                              : "—")}
                        </span>
                        <strong className="text-[#0f1d40]">
                          {unit ? getPropertyHeadline(unit, "—") : "—"}
                        </strong>
                        <span className="font-bold text-slate-500">
                          {req.package_tier} · {req.duration_days}{" "}
                          {propBadges.dayWord}
                        </span>
                      </div>
                      {req.admin_note && (
                        <p className="text-[11px] font-semibold text-red-600">
                          {req.admin_note}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <strong
                        dir="ltr"
                        className="font-black text-[#0f1d40] tabular-nums"
                      >
                        {req.amount_gel} ₾
                      </strong>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-extrabold ${
                          isApproved
                            ? "bg-[#eaf8f2] text-[#007a5a]"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {isApproved ? pm.approvedBadge : pm.rejectedBadge}
                      </span>
                      <span
                        dir="ltr"
                        className="font-mono text-[10.5px] text-slate-400"
                      >
                        {new Date(req.created_at).toLocaleDateString("en-GB")}
                      </span>
                    </div>
                  </div>
                )
              })
          )}
        </div>
      )}

      {tab === "manual" && (
        <div className="space-y-2.5">
          <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-2.5 text-xs font-semibold text-blue-950">
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
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10.5px] font-bold text-[#0f1d40]">
                        {uCode}
                      </span>
                      <strong className="text-sm text-[#0f1d40]">
                        {getPropertyHeadline(
                          unit,
                          propDict.table?.unspecifiedProject
                        )}
                      </strong>
                    </div>
                    <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
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
                    }}
                    className="inline-flex h-8.5 items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 text-xs font-extrabold text-amber-900 hover:bg-amber-100"
                  >
                    <Star className="size-3.5 text-amber-600" />
                    <span>{pm.manualPromoteBtn}</span>
                  </button>
                </div>
              )
            })}
        </div>
      )}

      <Dialog
        open={Boolean(rejectTarget)}
        onOpenChange={(o) => !o && setRejectTarget(null)}
      >
        <DialogContent
          dir={dir}
          className="w-[92vw] max-w-[420px] rounded-2xl p-5 text-start"
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