"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Building2,
  CheckCircle2,
  ClipboardList,
  Clock,
  ExternalLink,
  Flame,
  Handshake,
  Loader2,
  Lock,
  MapPin,
  MessageCircle,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
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
import { adminWithdrawPendingOfferAction } from "@/actions/offer-actions"
import type { LocaleCode } from "@/lib/i18n"
import {
  cleanAreaLabel,
  deriveShortUnitCode,
  getLeadUiMicroLabels,
  isBuyerEmailVerified,
  isBuyerPhoneVerified,
  PRIORITY_RETURNED_TAG,
  type BuyerLead,
  type ConfirmLeadAction,
  type LinkedUnitSummary,
  type parseLeadDetails,
  type UserVerificationBadgeInfo,
} from "./leads-helpers"

function getSoldOfferCopy(locale: LocaleCode, offeredText: string) {
  switch (locale) {
    case "en":
      return {
        badge: "Purchased ✓",
        summary: `Purchase & transfer completed successfully at ${offeredText}`,
      }
    case "ru":
      return {
        badge: "Куплено ✓",
        summary: `Покупка и переоформление успешно завершены за ${offeredText}`,
      }
    case "ka":
      return {
        badge: "შეძენილია ✓",
        summary: `შესყიდვა და გადაფორმება წარმატებით დასრულდა — ${offeredText}`,
      }
    default:
      return {
        badge: "تم الشراء ✓",
        summary: `تم إتمام الشراء ونقل الملكية بنجاح بـ ${offeredText}`,
      }
  }
}

export function LeadConfirmDialog({
  dir,
  t,
  confirmAction,
  pending,
  getLeadStatusLabel,
  onClose,
  onExecute,
}: {
  dir: "rtl" | "ltr"
  t: Record<string, any>
  confirmAction: ConfirmLeadAction | null
  pending: boolean
  getLeadStatusLabel: (st: string | null | undefined) => string
  onClose: () => void
  onExecute: () => void
}) {
  return (
    <Dialog
      open={Boolean(confirmAction)}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent
        dir={dir}
        className="w-[92vw] max-w-[380px] rounded-2xl p-5 text-start sm:max-w-[420px]"
      >
        {confirmAction && (
          <>
            <DialogHeader className="pr-9 text-start">
              <div className="mb-2 flex items-center gap-2.5">
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                    confirmAction.type === "delete"
                      ? "bg-red-100 text-red-600"
                      : "bg-emerald-100 text-[#007a5a]"
                  }`}
                >
                  {confirmAction.type === "delete" ? (
                    <Trash2 className="size-4" />
                  ) : (
                    <ShieldAlert className="size-4" />
                  )}
                </span>
                <DialogTitle className="text-sm font-extrabold text-[#0f1d40] sm:text-base">
                  {confirmAction.type === "delete"
                    ? t.confirmDeleteTitle
                    : t.confirmStatusTitle}
                </DialogTitle>
              </div>

              <DialogDescription className="text-start text-xs leading-relaxed text-slate-600">
                <strong className="text-[#0f1d40]">
                  &ldquo;{confirmAction.lead.name}&rdquo;
                </strong>
                {confirmAction.type === "status" && (
                  <>
                    {" "}
                    →{" "}
                    <span className="font-bold text-[#007a5a]">
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
                onClick={onClose}
                className="h-9 flex-1 rounded-xl text-xs font-bold sm:flex-none"
              >
                {t.cancelBtn}
              </Button>
              <Button
                type="button"
                disabled={pending}
                onClick={onExecute}
                className={`h-9 flex-1 rounded-xl text-xs font-bold text-white sm:flex-none ${
                  confirmAction.type === "delete"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-[#007a5a] hover:bg-[#006248]"
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
  )
}

export function LeadOffersLogDialog({
  dir,
  locale,
  t,
  sm,
  lead,
  offers,
  units,
  leadCur,
  onClose,
  onNotice,
}: {
  dir: "rtl" | "ltr"
  locale: LocaleCode
  t: Record<string, any>
  sm: Record<string, any>
  lead: BuyerLead | null
  offers: any[]
  units: LinkedUnitSummary[]
  leadCur: string
  onClose: () => void
  onNotice?: (msg: { text: string; isError?: boolean }) => void
}) {
  const router = useRouter()
  const [confirmWithdrawId, setConfirmWithdrawId] = useState<string | null>(
    null
  )
  const [withdrawnIds, setWithdrawnIds] = useState<Record<string, boolean>>({})
  const [busyId, setBusyId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  if (!lead) return null

  function getOfferSortRank(offer: any): number {
    const unit = units.find((u) => String(u.id) === String(offer.property_id))
    const isSold =
      offer.status === "accepted" &&
      String(unit?.status || "").trim().toLowerCase() === "sold"
    if (isSold) return 5
    if (offer.status === "accepted") return 1
    if (offer.status === "counter_offered") return 2
    if (offer.status === "pending_admin") return 3
    if (offer.status === "pending_seller") return 4
    if (offer.status === "unit_locked") return 6
    return 7
  }

  const visibleOffers = [...offers]
    .filter((o) => !withdrawnIds[String(o.id)])
    .sort((a, b) => {
      const rankDiff = getOfferSortRank(a) - getOfferSortRank(b)
      if (rankDiff !== 0) return rankDiff
      return (
        new Date(b.updated_at || b.created_at || 0).getTime() -
        new Date(a.updated_at || a.created_at || 0).getTime()
      )
    })

  function handleWithdraw(offerId: string) {
    setBusyId(offerId)
    startTransition(async () => {
      try {
        const res = await adminWithdrawPendingOfferAction(offerId)
        if (res.success) {
          setWithdrawnIds((prev) => ({ ...prev, [offerId]: true }))
          setConfirmWithdrawId(null)
          onNotice?.({ text: sm.offerCancelledSuccess })
          router.refresh()
        } else if (res.error) {
          onNotice?.({ text: res.error, isError: true })
        }
      } finally {
        setBusyId(null)
      }
    })
  }

  function formatMoney(val: number | null | undefined) {
    return `${leadCur}${Number(val || 0).toLocaleString("en-US")}`
  }

  function buildClearSummary(offer: any, isSoldDeal: boolean): string {
    const offered = formatMoney(offer.offered_cash)
    const counter = formatMoney(offer.counter_cash)
    const diff = formatMoney(
      Math.max(
        0,
        Number(offer.counter_cash || 0) - Number(offer.offered_cash || 0)
      )
    )

    if (isSoldDeal) {
      return getSoldOfferCopy(locale, offered).summary
    }
    if (offer.status === "accepted") {
      return String(t.offerSummaryAccepted || "").replace("{offered}", offered)
    }
    if (offer.status === "counter_offered" && Number(offer.counter_cash) > 0) {
      return String(t.offerSummaryCounter || "")
        .replace("{offered}", offered)
        .replace("{counter}", counter)
        .replace("{diff}", diff)
    }
    if (offer.status === "pending_admin") {
      return String(t.offerSummaryPendingAdmin || "").replace(
        "{offered}",
        offered
      )
    }
    if (offer.status === "pending_seller") {
      return String(t.offerSummaryPendingSeller || "").replace(
        "{offered}",
        offered
      )
    }
    if (offer.status === "unit_locked") {
      return String(t.offerSummaryWaitlist || "").replace("{offered}", offered)
    }
    return String(t.offerSummaryRejected || "").replace("{offered}", offered)
  }

  return (
    <Dialog open={Boolean(lead)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        dir={dir}
        className="max-h-[88vh] w-[95vw] overflow-y-auto rounded-2xl p-4 text-start sm:max-w-[620px] sm:p-5"
      >
        <DialogHeader className="border-b border-slate-100 pb-3 pr-9 text-start">
          <DialogTitle className="flex flex-wrap items-center gap-2 text-sm font-black text-[#0f1d40] sm:text-base">
            <ClipboardList className="size-5 shrink-0 text-[#007a5a]" />
            <span>
              {t.offersLogTitle}:{" "}
              <span className="text-[#007a5a]">{lead.name}</span>
            </span>
          </DialogTitle>
          <DialogDescription className="mt-1 text-start text-xs leading-relaxed text-slate-500">
            {t.offersLogSubtitle}
          </DialogDescription>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-600">
            <span className="rounded-lg bg-slate-100 px-2.5 py-1">
              {t.cashLabel}{" "}
              <strong dir="ltr" className="inline-block text-[#007a5a]">
                {formatMoney(lead.available_cash || lead.budget)}
              </strong>
            </span>
            {Number(lead.max_installment || 0) > 0 && (
              <span className="rounded-lg bg-slate-100 px-2.5 py-1">
                {t.installmentLabel}{" "}
                <strong dir="ltr" className="inline-block text-[#0f1d40]">
                  {formatMoney(lead.max_installment)}
                </strong>
              </span>
            )}
          </div>
        </DialogHeader>

        <div className="mt-3 space-y-3">
          {visibleOffers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 py-10 text-center text-xs font-bold text-slate-500">
              {t.offersLogEmpty}
            </div>
          ) : (
            visibleOffers.map((offer) => {
              const unit = units.find(
                (u) => String(u.id) === String(offer.property_id)
              )
              const uCode = unit
                ? deriveShortUnitCode(unit.id, unit.code)
                : deriveShortUnitCode(String(offer.property_id || ""))
              const localizedArea = unit
                ? cleanAreaLabel(unit.area, locale)
                : ""
              const isAccepted = offer.status === "accepted"
              const isSoldDeal =
                isAccepted &&
                String(unit?.status || "").trim().toLowerCase() === "sold"
              const isCounter = offer.status === "counter_offered"
              const isPendingAdmin = offer.status === "pending_admin"
              const isPendingSeller = offer.status === "pending_seller"
              const isWaitlist = offer.status === "unit_locked"
              const isRejected = offer.status === "rejected"
              const isPriorityReturned =
                isPendingAdmin &&
                Array.isArray(offer.diff_reasons) &&
                offer.diff_reasons.includes(PRIORITY_RETURNED_TAG)
              const canCleanWithdraw = isPendingAdmin || isPendingSeller
              const soldCopy = getSoldOfferCopy(
                locale,
                formatMoney(offer.offered_cash)
              )

              const cardTone = isSoldDeal
                ? "border-slate-300 bg-slate-50/80"
                : isAccepted
                  ? "border-emerald-300 bg-emerald-50/25"
                  : isCounter
                    ? "border-indigo-200 bg-indigo-50/20"
                    : isPendingAdmin
                      ? "border-amber-300 bg-amber-50/25"
                      : isPendingSeller
                        ? "border-purple-200 bg-purple-50/20"
                        : isRejected
                          ? "border-slate-200 bg-slate-50/60 opacity-85"
                          : "border-slate-200 bg-white"

              const dealsHref = isWaitlist
                ? `/admin/deals?tab=waitlist&offerId=${offer.id}`
                : `/admin/deals?offerId=${offer.id}`

              return (
                <div
                  key={offer.id}
                  className={`rounded-2xl border p-3.5 text-xs shadow-2xs transition ${cardTone}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-md bg-[#0f1d40] px-2 py-0.5 font-mono text-[10.5px] font-bold text-white">
                          {uCode}
                        </span>
                        <h4 className="text-sm font-black text-[#0f1d40]">
                          {unit?.project_name || "—"}
                        </h4>
                      </div>
                      {localizedArea && (
                        <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                          <MapPin className="size-3 text-[#007a5a]" />
                          <span>{localizedArea}</span>
                          {unit?.name && (
                            <>
                              <span>·</span>
                              <span>{unit.name}</span>
                            </>
                          )}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10.5px] font-extrabold ${
                          isSoldDeal
                            ? "bg-[#0f1d40] text-white"
                            : isAccepted
                              ? "bg-[#007a5a] text-white"
                              : isCounter
                                ? "bg-indigo-600 text-white"
                                : isPendingAdmin && isPriorityReturned
                                  ? "bg-amber-400 text-[#0f1d40]"
                                  : isPendingAdmin
                                    ? "bg-amber-500 text-white"
                                    : isPendingSeller
                                      ? "bg-purple-100 text-purple-900"
                                      : isWaitlist
                                        ? "bg-slate-200 text-slate-800"
                                        : "bg-red-100 text-red-700"
                        }`}
                      >
                        {isSoldDeal && (
                          <CheckCircle2 className="size-3 text-emerald-400" />
                        )}
                        {!isSoldDeal && isAccepted && (
                          <Handshake className="size-3" />
                        )}
                        {isPendingAdmin && isPriorityReturned && (
                          <Sparkles className="size-3" />
                        )}
                        {isPendingAdmin && !isPriorityReturned && (
                          <Clock className="size-3" />
                        )}
                        {isWaitlist && <Lock className="size-3" />}
                        <span>
                          {isSoldDeal
                            ? soldCopy.badge
                            : isRejected
                              ? t.closedOffersBadge
                              : t.activeOffersBadge}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 grid grid-cols-2 gap-2 rounded-xl border border-slate-200/70 bg-white/90 p-2.5 sm:grid-cols-3">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400">
                        {t.unitRequiredCashShort}
                      </span>
                      <div className="mt-0.5">
                        <strong
                          dir="ltr"
                          className="inline-block text-xs font-extrabold text-[#0f1d40] tabular-nums"
                        >
                          {unit?.paid_amount
                            ? formatMoney(unit.paid_amount)
                            : "—"}
                        </strong>
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold text-slate-400">
                        {t.buyerOfferedShort}
                      </span>
                      <div className="mt-0.5">
                        <strong
                          dir="ltr"
                          className="inline-block text-xs font-black text-[#007a5a] tabular-nums"
                        >
                          {formatMoney(offer.offered_cash)}
                        </strong>
                      </div>
                    </div>

                    {Number(offer.counter_cash || 0) > 0 && (
                      <div>
                        <span className="block text-[10px] font-bold text-indigo-500">
                          {t.ownerCounterShort}
                        </span>
                        <div className="mt-0.5">
                          <strong
                            dir="ltr"
                            className="inline-block text-xs font-black text-indigo-700 tabular-nums"
                          >
                            {formatMoney(offer.counter_cash)}
                          </strong>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-2.5 rounded-xl bg-white/80 px-3 py-2 text-[11.5px] font-bold leading-relaxed text-[#0f1d40]">
                    {buildClearSummary(offer, isSoldDeal)}
                  </div>

                  {confirmWithdrawId === offer.id ? (
                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px]">
                      <span className="font-extrabold text-red-800">
                        {sm.confirmCancelOfferPrompt}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={busyId === offer.id}
                          onClick={() => handleWithdraw(offer.id)}
                          className="inline-flex h-7 items-center gap-1 rounded-lg bg-red-600 px-2.5 text-[11px] font-extrabold text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {busyId === offer.id && (
                            <Loader2 className="size-3 animate-spin" />
                          )}
                          <span>{sm.confirmYesCancelBtn}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmWithdrawId(null)}
                          className="h-7 rounded-lg border border-slate-300 bg-white px-2.5 text-[11px] font-bold text-slate-700"
                        >
                          {sm.backBtn}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/60 pt-2.5">
                      <span
                        dir="ltr"
                        className="font-mono text-[10.5px] text-slate-400"
                      >
                        {offer.created_at
                          ? new Date(offer.created_at).toLocaleDateString(
                              "en-GB"
                            )
                          : ""}
                      </span>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {canCleanWithdraw && (
                          <button
                            type="button"
                            onClick={() => setConfirmWithdrawId(offer.id)}
                            className="inline-flex h-8 items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-2.5 text-[11px] font-extrabold text-red-700 transition hover:bg-red-100"
                          >
                            <XCircle className="size-3.5" />
                            <span>{sm.cancelOfferBtn}</span>
                          </button>
                        )}

                        {unit && !isSoldDeal && (
                          <Link
                            href={`/opportunities/${unit.id}`}
                            target="_blank"
                            className="inline-flex h-8 items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 text-[11px] font-bold text-slate-700 transition hover:bg-slate-50"
                          >
                            <ExternalLink className="size-3 text-[#007a5a]" />
                            <span>{sm.viewUnitBtn}</span>
                          </Link>
                        )}

                        <Link
                          href={dealsHref}
                          onClick={onClose}
                          className={`inline-flex h-8 items-center gap-1.5 rounded-xl px-3 text-[11px] font-extrabold text-white transition ${
                            isAccepted && !isSoldDeal
                              ? "bg-[#007a5a] hover:bg-[#006248]"
                              : "bg-[#0f1d40] hover:bg-[#1e293b]"
                          }`}
                        >
                          <Handshake className="size-3.5 text-emerald-300" />
                          <span>
                            {isAccepted
                              ? t.followUpDealBtn
                              : t.followUpOfferBtn}
                          </span>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function LeadDetailsDialog({
  dir,
  locale,
  t,
  propAdminDict,
  publicSiteLabel,
  propertiesNavLabel,
  openInDealsRoomLabel,
  detailsLead,
  parsed,
  focusUnit,
  focusOffer,
  leadCur,
  waText,
  verificationMap,
  onVerifyBuyerContact,
  pending,
  onClose,
}: {
  dir: "rtl" | "ltr"
  locale: LocaleCode
  t: Record<string, any>
  propAdminDict: Record<string, any>
  publicSiteLabel: string
  propertiesNavLabel: string
  openInDealsRoomLabel: string
  detailsLead: BuyerLead | null
  parsed: ReturnType<typeof parseLeadDetails> | null
  focusUnit?: LinkedUnitSummary | null
  focusOffer?: any | null
  leadCur: string
  waText: string
  verificationMap?: Record<string, UserVerificationBadgeInfo>
  onVerifyBuyerContact?: (userId: string) => void
  pending: boolean
  onClose: () => void
}) {
  const ui = getLeadUiMicroLabels(locale)
  const phoneOk = detailsLead
    ? isBuyerPhoneVerified(detailsLead, verificationMap)
    : false
  const emailOk = detailsLead
    ? isBuyerEmailVerified(detailsLead, verificationMap)
    : false

  const listSep = dir === "rtl" ? "، " : ", "
  const typesText =
    detailsLead && Array.isArray(detailsLead.unit_types)
      ? detailsLead.unit_types.join(listSep)
      : "—"

  const activeUnit = focusUnit || parsed?.matchedUnit || null
  const activeOffer = focusOffer || parsed?.latestDirectOffer || null
  const isUnitContext = Boolean(focusUnit || parsed?.isPureUnitInquiry)
  const resolvedUnitCode = activeUnit
    ? deriveShortUnitCode(activeUnit.id, activeUnit.code)
    : parsed?.unitCode || null

  const verifyBtnLabel =
    !phoneOk && !emailOk
      ? t.verifyBuyerBothBtn || t.verifyBuyerBtn
      : !phoneOk
        ? t.verifyBuyerBtn
        : t.verifyBuyerEmailBtn || t.verifyBuyerBtn

  return (
    <Dialog
      open={Boolean(detailsLead)}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent
        dir={dir}
        className="max-h-[88vh] w-[94vw] overflow-y-auto rounded-2xl p-5 text-start sm:max-w-[520px]"
      >
        {detailsLead && parsed && (
          <>
            <DialogHeader className="border-b border-slate-100 pb-3 pr-9 text-start">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="text-base font-black text-[#0f1d40]">
                  {detailsLead.name}
                </DialogTitle>
                {isUnitContext ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-orange-100 px-2.5 py-0.5 text-[10.5px] font-extrabold text-orange-800">
                    <Flame className="size-3 fill-orange-500 text-orange-600" />
                    {t.unitBadge} {resolvedUnitCode || ""}
                  </span>
                ) : (
                  <span className="rounded-md bg-[#eaf8f2] px-2.5 py-0.5 text-[10.5px] font-extrabold text-[#007a5a]">
                    {t.generalTab}
                  </span>
                )}
              </div>
              <DialogDescription className="mt-1 text-start font-mono text-xs font-semibold text-slate-500">
                <span dir="ltr" className="inline-block break-all">
                  {detailsLead.phone}
                  {detailsLead.email ? ` · ${detailsLead.email}` : ""}
                </span>
              </DialogDescription>
            </DialogHeader>

            <div className="mt-2 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {phoneOk && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-[#eaf8f2] px-2.5 py-1 text-[11px] font-extrabold text-[#007a5a]">
                    <CheckCircle2 className="size-3.5" />
                    <span>{propAdminDict.badges?.phoneVerifiedBadge}</span>
                  </span>
                )}
                {emailOk && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-[#eaf8f2] px-2.5 py-1 text-[11px] font-extrabold text-[#007a5a]">
                    <CheckCircle2 className="size-3.5" />
                    <span>{propAdminDict.badges?.emailVerifiedBadge}</span>
                  </span>
                )}
                {detailsLead.user_id &&
                  (!phoneOk || !emailOk) &&
                  onVerifyBuyerContact && (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        onVerifyBuyerContact(String(detailsLead.user_id))
                      }
                      className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[#0f1d40] px-3 text-xs font-bold text-white transition hover:bg-[#1e293b] disabled:opacity-50"
                    >
                      <ShieldCheck className="size-3.5 text-emerald-400" />
                      <span>{verifyBtnLabel}</span>
                    </button>
                  )}
              </div>

              {detailsLead.user_id &&
                (!phoneOk || !emailOk) &&
                t.verifyBuyerHint && (
                  <p className="text-[11px] font-medium text-slate-500">
                    {t.verifyBuyerHint}
                  </p>
                )}
            </div>

            {isUnitContext ? (
              <div className="mt-2 rounded-xl border border-orange-200 bg-orange-50/70 p-3.5 text-xs">
                <p className="text-[10.5px] font-bold text-orange-700">
                  {ui.targetUnitCol}
                </p>
                <p className="mt-0.5 text-sm font-black text-orange-950">
                  {activeUnit
                    ? `${activeUnit.project_name || "—"} — ${cleanAreaLabel(activeUnit.area, locale)}`
                    : parsed.cleanTargetUnit}
                </p>
                {activeUnit && (
                  <p className="mt-1 text-xs font-semibold text-orange-900">
                    <span className="text-orange-700">{ui.unitOwnerLabel}</span>{" "}
                    {activeUnit.name} (
                    <span dir="ltr" className="inline-block font-mono">
                      {activeUnit.phone}
                    </span>
                    )
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  {activeUnit && (
                    <Link
                      href={`/opportunities/${activeUnit.id}`}
                      target="_blank"
                      className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#007a5a] px-3 text-xs font-bold text-white hover:bg-[#006248]"
                    >
                      <ExternalLink className="size-3.5" />
                      <span>
                        {publicSiteLabel} ({t.unitBtn})
                      </span>
                    </Link>
                  )}

                  {activeOffer && (
                    <Link
                      href={`/admin/deals?offerId=${activeOffer.id}`}
                      onClick={onClose}
                      className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[#0f1d40] px-3 text-xs font-bold text-white hover:bg-[#1e293b]"
                    >
                      <Handshake className="size-3.5 text-emerald-400" />
                      <span>{openInDealsRoomLabel || t.followUpOfferBtn}</span>
                    </Link>
                  )}

                  {activeUnit && (
                    <Link
                      href={`/admin/properties?unitId=${activeUnit.id}`}
                      onClick={onClose}
                      className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-[#0f1d40] hover:bg-slate-50"
                    >
                      <Building2 className="size-3.5 text-[#007a5a]" />
                      <span>{propertiesNavLabel}</span>
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-2 rounded-xl border border-emerald-200/80 bg-[#eaf8f2]/60 p-3.5 text-xs">
                <p className="text-[10.5px] font-bold text-[#007a5a]">
                  {ui.desiredAreasCol}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {parsed.preferredAreasList.length > 0 ? (
                    parsed.preferredAreasList.map((areaLabel, i) => (
                      <span
                        key={`${areaLabel}-${i}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2.5 py-1 text-xs font-extrabold text-[#0f1d40]"
                      >
                        <MapPin className="size-3.5 text-[#007a5a]" />
                        <span>{areaLabel}</span>
                      </span>
                    ))
                  ) : (
                    <span className="font-bold text-[#0f1d40]">
                      {parsed.cleanTargetUnit}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-start text-xs">
              <div>
                <span className="block text-[10.5px] font-bold text-slate-400">
                  {t.cashLabel}
                </span>
                <div className="mt-0.5">
                  <strong
                    dir="ltr"
                    className="inline-block text-sm font-black text-[#007a5a] tabular-nums"
                  >
                    {leadCur}
                    {Number(
                      detailsLead.available_cash || detailsLead.budget || 0
                    ).toLocaleString("en-US")}
                  </strong>
                </div>
              </div>

              <div>
                <span className="block text-[10.5px] font-bold text-slate-400">
                  {t.installmentLabel}
                </span>
                <div className="mt-0.5 flex flex-wrap items-baseline gap-1">
                  <strong
                    dir="ltr"
                    className="inline-block text-sm font-black text-[#0f1d40] tabular-nums"
                  >
                    {leadCur}
                    {Number(detailsLead.max_installment || 0).toLocaleString(
                      "en-US"
                    )}
                  </strong>
                  {detailsLead.payment_plan && (
                    <span className="text-[11px] font-bold text-slate-500">
                      ({detailsLead.payment_plan})
                    </span>
                  )}
                </div>
              </div>

              <div>
                <span className="block text-[10.5px] font-bold text-slate-400">
                  {isUnitContext
                    ? propAdminDict.modals?.contractPriceLabel
                    : ui.targetBudgetLabel}
                </span>
                <div className="mt-0.5">
                  <strong
                    dir="ltr"
                    className="inline-block text-sm font-extrabold text-[#0f1d40] tabular-nums"
                  >
                    {leadCur}
                    {Number(
                      detailsLead.budget || detailsLead.available_cash || 0
                    ).toLocaleString("en-US")}
                  </strong>
                </div>
              </div>

              <div>
                <span className="block text-[10.5px] font-bold text-slate-400">
                  {t.typeDetailsLabel}
                </span>
                <strong className="mt-0.5 block text-xs font-extrabold text-[#0f1d40]">
                  {typesText}
                  {detailsLead.min_rooms ? ` (+${detailsLead.min_rooms})` : ""}
                  {detailsLead.delivery_status
                    ? ` · ${detailsLead.delivery_status}`
                    : ""}
                </strong>
              </div>

              <div className="col-span-2 border-t border-slate-200/70 pt-2">
                <span className="block text-[10.5px] font-bold text-slate-400">
                  {t.dateLabel}
                </span>
                <div className="mt-0.5">
                  <strong
                    dir="ltr"
                    className="inline-block font-mono text-xs text-[#0f1d40]"
                  >
                    {new Date(detailsLead.created_at).toLocaleDateString(
                      "en-GB"
                    )}
                  </strong>
                </div>
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
                onClick={onClose}
                className="h-9 rounded-xl text-xs font-bold"
              >
                {propAdminDict.actions?.closeBtn || t.cancelBtn}
              </Button>
              <a
                data-admin-client-wa="true"
                href={`https://wa.me/${String(detailsLead.phone).replace(/\D/g, "")}?text=${encodeURIComponent(waText)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-4 text-xs font-bold text-white hover:bg-[#1ebe5d]"
              >
                <MessageCircle className="size-4" />
                <span>{t.whatsappBtn}</span>
              </a>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}