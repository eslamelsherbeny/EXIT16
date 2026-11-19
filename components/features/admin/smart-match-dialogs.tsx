"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Handshake,
  Info,
  Loader2,
  Lock,
  MessageCircle,
  Phone,
  Send,
  Sparkles,
  Wallet,
  XCircle,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getLocalizedGeorgiaAreaName } from "@/components/shared/georgia-areas"
import { getCurrencySymbol, useTranslation } from "@/lib/i18n"
import {
  calculateSmartMatch,
  getUnitPricingGuardrails,
  type MatchableBuyer,
  type MatchableUnit,
} from "@/lib/smart-matcher"
import {
  adminCreateOfficialOfferAction,
  adminSendBulkRecommendationsAction,
  adminSendRecommendationAction,
  adminWithdrawPendingOfferAction,
} from "@/actions/offer-actions"

const PENDING_ADMIN_TAG = "__PENDING_ADMIN_VERIFICATION__"
const PRIORITY_RETURNED_TAG = "__PRIORITY_FROM_BACKUP__"
const AUTO_PUBLISH_THRESHOLD = 80

function toAsciiDigits(raw: string): string {
  return String(raw || "")
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
}

function deriveShortUnitCode(id: string, dbCode?: string | null) {
  if (dbCode && String(dbCode).trim()) return String(dbCode).trim()
  const numericCode = String(id || "")
    .replace(/\D/g, "")
    .slice(0, 5)
  const fallbackCode = String(id || "")
    .slice(0, 5)
    .toUpperCase()
  return `U-${numericCode.length >= 4 ? numericCode : fallbackCode}`
}

function isUnitEligibleForSmartMatch(status?: string | null): boolean {
  const clean = String(status || "active").trim().toLowerCase()
  return (
    clean === "active" ||
    clean === "approved" ||
    clean === "published" ||
    clean === "offer_received" ||
    clean === "transferring"
  )
}

function isSameBuyerOffer(offer: any, buyer: MatchableBuyer): boolean {
  if (!offer || !buyer) return false
  if (String(offer.lead_id || "") === String(buyer.id)) return true
  if (
    buyer.user_id &&
    offer.buyer_user_id &&
    String(offer.buyer_user_id) === String(buyer.user_id)
  ) {
    return true
  }
  const bDigits = String(buyer.phone || "").replace(/\D/g, "")
  const oDigits = String(offer.buyer_phone || "").replace(/\D/g, "")
  if (
    bDigits.length >= 8 &&
    oDigits.length >= 8 &&
    bDigits.slice(-8) === oDigits.slice(-8)
  ) {
    return true
  }
  return false
}

function cleanAreaName(rawArea: string | null | undefined, locale: string) {
  const localized = getLocalizedGeorgiaAreaName(rawArea, locale as any)
  if (locale === "ar") {
    return localized.replace(/\s*\([A-Za-z0-9\s/-]+\)\s*$/g, "").trim()
  }
  return localized
}

function formatReasonForAdmin(
  text: string,
  locale: string,
  matcherDict: Record<string, any>,
  smDict: Record<string, any>
): string {
  let formatted = text
  if (matcherDict?.cashExact && smDict?.adminCashMatch) {
    formatted = formatted.replace(matcherDict.cashExact, smDict.adminCashMatch)
  }
  if (matcherDict?.cashSlightlyHigher && smDict?.adminCashHigher) {
    formatted = formatted.replace(
      matcherDict.cashSlightlyHigher,
      smDict.adminCashHigher
    )
  }
  if (matcherDict?.instMatch && smDict?.adminInstMatch) {
    formatted = formatted.replace(matcherDict.instMatch, smDict.adminInstMatch)
  }
  if (matcherDict?.instHigher && smDict?.adminInstHigher) {
    formatted = formatted.replace(
      matcherDict.instHigher,
      smDict.adminInstHigher
    )
  }
  if (matcherDict?.buyerAskedRooms && smDict?.adminBuyerAskedRooms) {
    formatted = formatted.replace(
      `(${matcherDict.buyerAskedRooms} `,
      `(${smDict.adminBuyerAskedRooms} `
    )
  }
  if (locale === "ar") {
    formatted = formatted.replace(/\s*\([A-Za-z0-9\s/-]+\)\s*$/g, "")
  }
  return formatted
}

function resolveEffectiveOfferStatus(offer: any): string {
  if (!offer) return ""
  const diffs = Array.isArray(offer.diff_reasons) ? offer.diff_reasons : []
  if (
    offer.status === "pending_admin" ||
    (offer.status === "recommended" &&
      (offer.initiated_by === "buyer" || diffs.includes(PENDING_ADMIN_TAG)))
  ) {
    return "pending_admin"
  }
  return offer.status || "recommended"
}

function UnitNegotiabilityBadge({
  unit,
  cur,
  sm,
}: {
  unit: MatchableUnit
  cur: string
  sm: Record<string, any>
}) {
  const guardrails = getUnitPricingGuardrails(unit)
  if (guardrails.allowNegotiation) {
    return (
      <span className="inline-flex flex-wrap items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10.5px] font-extrabold text-amber-900">
        <span>💬 {sm.negotiableUnitBadge}</span>
        <span className="text-amber-700/80">·</span>
        <span>
          {sm.sellerMinFloorHint}:{" "}
          <strong dir="ltr" className="inline-block">
            {cur}
            {guardrails.minAllowedOfferCash.toLocaleString("en-US")}
          </strong>
        </span>
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10.5px] font-bold text-slate-600">
      <Lock className="size-3 shrink-0 text-slate-500" />
      <span>{sm.fixedPriceUnitBadge}</span>
    </span>
  )
}

function InlineOfferComposer({
  unit,
  buyerName,
  cur,
  sm,
  mode,
  setMode,
  customPriceStr,
  setCustomPriceStr,
  errorText,
  isBusy,
  onConfirm,
  onCancel,
}: {
  unit: MatchableUnit
  buyerName: string
  cur: string
  sm: Record<string, any>
  mode: "full" | "custom"
  setMode: (m: "full" | "custom") => void
  customPriceStr: string
  setCustomPriceStr: (s: string) => void
  errorText: string | null
  isBusy: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const guardrails = getUnitPricingGuardrails(unit)

  return (
    <div className="mt-3 rounded-xl border border-emerald-200 bg-[#eaf8f2]/70 p-3 text-xs">
      <p className="font-black text-[#0f1d40]">
        {sm.offerBoxTitle} ({buyerName})
      </p>

      {guardrails.allowNegotiation ? (
        <div className="mt-2.5 space-y-2">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setMode("full")}
              className={`rounded-lg border px-3 py-2 text-start text-[11px] font-extrabold transition ${
                mode === "full"
                  ? "border-[#007a5a] bg-[#007a5a] text-white shadow-2xs"
                  : "border-slate-200 bg-white text-[#0f1d40] hover:border-[#007a5a]"
              }`}
            >
              <div>{sm.fullPriceChoice}</div>
              <div
                dir="ltr"
                className={`mt-0.5 inline-block font-mono text-xs ${
                  mode === "full" ? "text-emerald-100" : "text-[#007a5a]"
                }`}
              >
                {cur}
                {guardrails.requiredCash.toLocaleString("en-US")}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMode("custom")}
              className={`rounded-lg border px-3 py-2 text-start text-[11px] font-extrabold transition ${
                mode === "custom"
                  ? "border-[#007a5a] bg-[#007a5a] text-white shadow-2xs"
                  : "border-slate-200 bg-white text-[#0f1d40] hover:border-[#007a5a]"
              }`}
            >
              <div>{sm.customPriceChoice}</div>
              <div
                className={`mt-0.5 text-[10px] ${
                  mode === "custom" ? "text-emerald-100" : "text-slate-500"
                }`}
              >
                {sm.sellerMinFloorHint}:{" "}
                <span dir="ltr" className="inline-block font-mono">
                  {cur}
                  {guardrails.minAllowedOfferCash.toLocaleString("en-US")}
                </span>
              </div>
            </button>
          </div>

          {mode === "custom" && (
            <div>
              <input
                type="text"
                dir="ltr"
                value={customPriceStr}
                onChange={(e) => {
                  const digits = toAsciiDigits(e.target.value).replace(
                    /[^\d]/g,
                    ""
                  )
                  setCustomPriceStr(
                    digits ? Number(digits).toLocaleString("en-US") : ""
                  )
                }}
                placeholder={`${guardrails.minAllowedOfferCash.toLocaleString("en-US")}`}
                className="h-9 w-full rounded-lg border border-emerald-400 bg-white px-3 text-sm font-black text-[#0f1d40] focus:outline-none"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="mt-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-700">
          🔒 {sm.fixedPriceNotice}:{" "}
          <strong dir="ltr" className="inline-block text-[#007a5a]">
            {cur}
            {guardrails.requiredCash.toLocaleString("en-US")}
          </strong>
        </div>
      )}

      {errorText && (
        <p className="mt-2 text-[11px] font-extrabold text-red-600">
          {errorText}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={isBusy}
          onClick={onConfirm}
          className="inline-flex h-8.5 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#007a5a] px-3 text-[11px] font-extrabold text-white transition hover:bg-[#006248] disabled:opacity-50"
        >
          {isBusy ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Check className="size-3.5 shrink-0" />
          )}
          <span>{sm.confirmSendOfferToOwnerBtn}</span>
        </button>

        <button
          type="button"
          disabled={isBusy}
          onClick={onCancel}
          className="inline-flex h-8.5 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
        >
          {sm.backBtn}
        </button>
      </div>
    </div>
  )
}

export function UnitSmartMatchModal({
  unit,
  buyers,
  offers = [],
  onClose,
  onNotice,
}: {
  unit: MatchableUnit | null
  buyers: MatchableBuyer[]
  offers?: any[]
  onClose: () => void
  onNotice?: (msg: { text: string; isError?: boolean }) => void
}) {
  const router = useRouter()
  const { t: dict, locale, dir, isRtl } = useTranslation()
  const sm = (dict.admin as Record<string, any>)?.smartMatch || {}
  const dealsDict = (dict.admin as Record<string, any>)?.dealsPage || {}
  const matcherDict = (dict.smartMatcher as Record<string, any>) || {}
  const buyerDict = (dict.accountComponents as Record<string, any>)?.buyer || {}
  const leadsPrompts = dict.admin?.leads || {}
  const propTable = dict.admin?.propertiesAdmin?.table || {}
  const commaSep = isRtl ? "، " : ", "

  const [loadingKey, setLoadingKey] = useState<string | null>(null)
  const [doneKeys, setDoneKeys] = useState<Record<string, boolean>>({})
  const [createdOfferIds, setCreatedOfferIds] = useState<
    Record<string, string>
  >({})
  const [cancelledOfferIds, setCancelledOfferIds] = useState<
    Record<string, boolean>
  >({})
  const [draftOfferKey, setDraftOfferKey] = useState<string | null>(null)
  const [draftMode, setDraftMode] = useState<"full" | "custom">("full")
  const [draftPriceStr, setDraftPriceStr] = useState("")
  const [draftError, setDraftError] = useState<string | null>(null)
  const [confirmCancelKey, setConfirmCancelKey] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!unit) return null

  const unitCur = getCurrencySymbol("GE", locale)
  const matchPrefix = sm.matchScorePrefix || buyerDict.matchScorePrefix || ""
  const localizedUnitArea = cleanAreaName(unit.area, locale)
  const unitPhoneDigits = String(unit.phone || "").replace(/\D/g, "")
  const uOfficialCode = deriveShortUnitCode(unit.id, unit.code)
  const unitGuardrails = getUnitPricingGuardrails(unit)

  const unitHasAcceptedOffer = offers.some(
    (o) =>
      String(o.property_id) === String(unit.id) &&
      !cancelledOfferIds[String(o.id)] &&
      resolveEffectiveOfferStatus(o) === "accepted"
  )

  const matchedList = (buyers || [])
    .filter((b) => {
      if (
        b.user_id &&
        unit.user_id &&
        String(b.user_id) === String(unit.user_id)
      )
        return false
      const bPhoneDigits = String(b.phone || "").replace(/\D/g, "")
      if (
        bPhoneDigits.length >= 8 &&
        unitPhoneDigits.length >= 8 &&
        bPhoneDigits.slice(-8) === unitPhoneDigits.slice(-8)
      ) {
        return false
      }
      return true
    })
    .map((buyer) => {
      const existingOffer = offers.find(
        (o) =>
          String(o.property_id) === String(unit.id) &&
          !cancelledOfferIds[String(o.id)] &&
          isSameBuyerOffer(o, buyer)
      )
      return {
        buyer,
        match: calculateSmartMatch(unit, buyer, undefined, locale),
        existingOffer,
        effectiveStatus: resolveEffectiveOfferStatus(existingOffer),
      }
    })
    .filter((item) => item.match.score >= 60)
    .sort((a, b) => {
      if (b.match.score !== a.match.score) return b.match.score - a.match.score
      if (a.match.differences.length !== b.match.differences.length) {
        return a.match.differences.length - b.match.differences.length
      }
      return b.match.matches.length - a.match.matches.length
    })

  const manualCandidates = matchedList.filter(
    (item) =>
      item.match.score < AUTO_PUBLISH_THRESHOLD &&
      !item.existingOffer &&
      !doneKeys[`rec_${unit.id}_${item.buyer.id}`]
  )

  const bulkKey = `bulk_${unit.id}`
  const isBulkDone = Boolean(doneKeys[bulkKey])

  function handleSendSingle(leadId: string) {
    if (!unit) return
    const k = `rec_${unit.id}_${leadId}`
    setLoadingKey(k)
    startTransition(async () => {
      try {
        const res = await adminSendRecommendationAction({
          propertyId: unit.id,
          leadId,
        })
        if (res.success) {
          setDoneKeys((prev) => ({ ...prev, [k]: true }))
          onNotice?.({ text: sm.recSentSuccess })
          router.refresh()
        } else if (res.error) {
          onNotice?.({ text: res.error, isError: true })
        }
      } finally {
        setLoadingKey(null)
      }
    })
  }

  function handleSendBulk() {
    if (!unit) return
    setLoadingKey(bulkKey)
    startTransition(async () => {
      try {
        const res = await adminSendBulkRecommendationsAction({
          propertyId: unit.id,
          minScore: 60,
        })
        if (res.success) {
          setDoneKeys((prev) => ({ ...prev, [bulkKey]: true }))
          onNotice?.({ text: `${sm.bulkRecsSentSuccess} (${res.sentCount})` })
          router.refresh()
        } else if (res.error) {
          onNotice?.({ text: res.error, isError: true })
        }
      } finally {
        setLoadingKey(null)
      }
    })
  }

  function openOfferComposer(buyer: MatchableBuyer) {
    if (!unit) return
    const k = `off_${unit.id}_${buyer.id}`
    const buyerCash = Number(buyer.available_cash || buyer.budget || 0)
    const suggestedCustom =
      buyerCash > 0 && buyerCash < unitGuardrails.requiredCash
        ? Math.max(buyerCash, unitGuardrails.minAllowedOfferCash)
        : unitGuardrails.minAllowedOfferCash

    setDraftOfferKey(k)
    setDraftMode("full")
    setDraftPriceStr(suggestedCustom.toLocaleString("en-US"))
    setDraftError(null)
    setConfirmCancelKey(null)
  }

  function handleSubmitOfferOnBehalf(buyer: MatchableBuyer) {
    if (!unit) return
    const k = `off_${unit.id}_${buyer.id}`
    let offeredCash = unitGuardrails.requiredCash

    if (unitGuardrails.allowNegotiation && draftMode === "custom") {
      const parsedVal = Number(toAsciiDigits(draftPriceStr).replace(/,/g, ""))
      if (
        !Number.isFinite(parsedVal) ||
        parsedVal <= 0 ||
        parsedVal > unitGuardrails.requiredCash
      ) {
        setDraftError(sm.invalidCustomPriceErr)
        return
      }
      offeredCash = parsedVal
    }

    setDraftError(null)
    setLoadingKey(k)
    startTransition(async () => {
      try {
        const res = await adminCreateOfficialOfferAction({
          propertyId: unit.id,
          leadId: buyer.id,
          offeredCash,
          paymentReadiness: "1_week",
        })
        if (res.success) {
          setDoneKeys((prev) => ({ ...prev, [k]: true }))
          if (res.offerId) {
            setCreatedOfferIds((prev) => ({
              ...prev,
              [k]: String(res.offerId),
            }))
          }
          setDraftOfferKey(null)
          onNotice?.({ text: sm.officialOfferSentSuccess })
          router.refresh()
        } else if (res.error) {
          setDraftError(res.error)
          onNotice?.({ text: res.error, isError: true })
        }
      } finally {
        setLoadingKey(null)
      }
    })
  }

  function handleCancelSentOffer(offKey: string, offerId: string) {
    setLoadingKey(`cancel_${offKey}`)
    startTransition(async () => {
      try {
        const res = await adminWithdrawPendingOfferAction(offerId)
        if (res.success) {
          setCancelledOfferIds((prev) => ({ ...prev, [offerId]: true }))
          setDoneKeys((prev) => {
            const next = { ...prev }
            delete next[offKey]
            return next
          })
          setCreatedOfferIds((prev) => {
            const next = { ...prev }
            delete next[offKey]
            return next
          })
          setConfirmCancelKey(null)
          onNotice?.({ text: sm.offerCancelledSuccess })
          router.refresh()
        } else if (res.error) {
          onNotice?.({ text: res.error, isError: true })
        }
      } finally {
        setLoadingKey(null)
      }
    })
  }

  return (
    <Dialog open={Boolean(unit)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        dir={dir}
        className="max-h-[88vh] w-[95vw] overflow-x-hidden overflow-y-auto rounded-2xl p-4 text-start sm:max-w-[620px] sm:p-5"
      >
        <DialogHeader className="border-b border-slate-100 pb-3 pr-9 text-start">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <DialogTitle className="text-sm leading-relaxed font-black text-[#0f1d40] sm:text-base">
              🎯 {sm.unitMatchedBuyersTitle}:{" "}
              <span className="text-[#007a5a]">
                {unit.project_name || propTable.unspecifiedProject}
              </span>
            </DialogTitle>

            {manualCandidates.length > 0 && (
              <button
                type="button"
                disabled={isPending || isBulkDone}
                onClick={handleSendBulk}
                className={`inline-flex h-8 w-fit items-center gap-1.5 rounded-lg px-3 text-[11px] font-bold text-white transition ${
                  isBulkDone
                    ? "bg-emerald-600"
                    : "bg-[#007a5a] hover:bg-[#006248]"
                }`}
              >
                {loadingKey === bulkKey ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>{sm.sendingNow}</span>
                  </>
                ) : (
                  <>
                    <Send className="size-3.5" />
                    <span>
                      {sm.sendAllRecsBtn} ({manualCandidates.length})
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
          <DialogDescription className="mt-1 flex flex-wrap items-center gap-2 text-start text-xs leading-relaxed text-slate-500">
            <span>
              {propTable.colCash}:{" "}
              <strong dir="ltr" className="inline-block text-[#007a5a]">
                {unitCur}
                {Number(unit.paid_amount || 0).toLocaleString("en-US")}
              </strong>{" "}
              · {localizedUnitArea} ·{" "}
              <span className="font-mono font-bold text-[#0f1d40]">
                {uOfficialCode}
              </span>
            </span>
          </DialogDescription>
          <div className="mt-2">
            <UnitNegotiabilityBadge unit={unit} cur={unitCur} sm={sm} />
          </div>
        </DialogHeader>

        <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2.5 text-[11.5px] font-semibold leading-relaxed text-blue-950">
          <Info className="mt-0.5 size-4 shrink-0 text-[#2563eb]" />
          <span>{sm.unitModalHelperBanner}</span>
        </div>

        <div className="mt-3 space-y-3">
          {matchedList.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">
              {sm.noMatchesFound}
            </p>
          ) : (
            matchedList.map(
              ({ buyer, match, existingOffer, effectiveStatus }) => {
                const bCash = Number(
                  buyer.available_cash || buyer.budget || 0
                ).toLocaleString("en-US")
                const bWa = `${leadsPrompts.waUnitLeadPrefix} ${buyer.name || ""}${commaSep}${leadsPrompts.waUnitLeadMiddle} (${unit.project_name || ""} - ${localizedUnitArea} - ${uOfficialCode}) — ${matchPrefix} ${match.score}%`

                const recKey = `rec_${unit.id}_${buyer.id}`
                const offKey = `off_${unit.id}_${buyer.id}`
                const isAutoPublished = match.score >= AUTO_PUBLISH_THRESHOLD
                const isManuallyRecommended =
                  Boolean(doneKeys[recKey]) ||
                  isBulkDone ||
                  (Boolean(existingOffer) && effectiveStatus === "recommended")
                const hasRealOffer =
                  Boolean(existingOffer) &&
                  effectiveStatus !== "recommended" &&
                  effectiveStatus !== "rejected"
                const isPriorityReturned =
                  Array.isArray(existingOffer?.diff_reasons) &&
                  existingOffer.diff_reasons.includes(PRIORITY_RETURNED_TAG)
                const resolvedOfferId =
                  (hasRealOffer ? String(existingOffer.id) : null) ||
                  createdOfferIds[offKey] ||
                  null
                const isOfferSentNow = Boolean(doneKeys[offKey]) || hasRealOffer
                const canCancelOffer =
                  Boolean(resolvedOfferId) &&
                  isOfferSentNow &&
                  (effectiveStatus === "pending_admin" ||
                    effectiveStatus === "pending_seller" ||
                    (!existingOffer && Boolean(createdOfferIds[offKey])))

                return (
                  <div
                    key={buyer.id}
                    className="rounded-xl border border-slate-200/90 bg-white p-3.5 text-xs shadow-2xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-black text-[#0f1d40]">
                        {buyer.name}
                      </p>
                      <span
                        dir="ltr"
                        className="inline-flex shrink-0 items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700"
                      >
                        <Phone className="size-3 text-[#007a5a]" />
                        <span>{buyer.phone}</span>
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded-md px-2.5 py-0.5 text-[11px] font-black ${
                          match.score >= AUTO_PUBLISH_THRESHOLD
                            ? "bg-[#007a5a] text-white"
                            : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        🎯 {matchPrefix} {match.score}%
                      </span>

                      {hasRealOffer ? (
                        <Link
                          href={
                            effectiveStatus === "unit_locked"
                              ? `/admin/deals?tab=waitlist&offerId=${existingOffer.id}`
                              : `/admin/deals?offerId=${existingOffer.id}`
                          }
                          onClick={onClose}
                          className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-[10.5px] font-extrabold ${
                            effectiveStatus === "accepted"
                              ? "bg-emerald-600 text-white"
                              : effectiveStatus === "pending_admin" &&
                                  isPriorityReturned
                                ? "bg-amber-400 text-[#0f1d40]"
                                : effectiveStatus === "pending_admin"
                                  ? "bg-amber-500 text-white"
                                  : effectiveStatus === "unit_locked"
                                    ? "border border-slate-300 bg-slate-100 text-slate-700"
                                    : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {effectiveStatus === "pending_admin" &&
                            isPriorityReturned && (
                              <Sparkles className="size-3" />
                            )}
                          {effectiveStatus === "pending_admin" &&
                            !isPriorityReturned && <Clock className="size-3" />}
                          {effectiveStatus === "unit_locked" && (
                            <Lock className="size-3" />
                          )}
                          <span>
                            {effectiveStatus === "accepted"
                              ? sm.offerAcceptedTag
                              : effectiveStatus === "pending_admin" &&
                                  isPriorityReturned
                                ? `⭐ ${dealsDict.badgePriorityReturned || sm.offerPendingAdminTag}`
                                : effectiveStatus === "pending_admin"
                                  ? sm.offerPendingAdminTag
                                  : effectiveStatus === "unit_locked"
                                    ? `⏳ ${sm.offerBackupTag}`
                                    : sm.sentOfferDoneBtn}
                          </span>
                        </Link>
                      ) : isAutoPublished ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-0.5 text-[10.5px] font-extrabold text-[#007a5a]">
                          <CheckCircle2 className="size-3" />
                          <span>{sm.autoPublishedTag}</span>
                        </span>
                      ) : isManuallyRecommended ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-0.5 text-[10.5px] font-extrabold text-blue-800">
                          <Check className="size-3" />
                          <span>{sm.recSentTag}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2.5 py-0.5 text-[10.5px] font-bold text-amber-800">
                          <span>{sm.notAutoPublishedTag}</span>
                        </span>
                      )}
                    </div>

                    <p className="mt-2.5 text-xs font-extrabold text-[#007a5a]">
                      {leadsPrompts.cashShort}{" "}
                      <span dir="ltr" className="inline-block">
                        {unitCur}
                        {bCash}
                      </span>
                    </p>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {match.matches.map((mStr) => (
                        <span
                          key={mStr}
                          className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10.5px] font-semibold text-[#007a5a]"
                        >
                          ✓{" "}
                          {formatReasonForAdmin(mStr, locale, matcherDict, sm)}
                        </span>
                      ))}
                      {match.differences.map((dStr) => (
                        <span
                          key={dStr}
                          className="rounded-md bg-amber-50 px-2 py-0.5 text-[10.5px] font-semibold text-amber-800"
                        >
                          ⚠️{" "}
                          {formatReasonForAdmin(dStr, locale, matcherDict, sm)}
                        </span>
                      ))}
                    </div>

                    {draftOfferKey === offKey ? (
                      <InlineOfferComposer
                        unit={unit}
                        buyerName={buyer.name || ""}
                        cur={unitCur}
                        sm={sm}
                        mode={draftMode}
                        setMode={setDraftMode}
                        customPriceStr={draftPriceStr}
                        setCustomPriceStr={setDraftPriceStr}
                        errorText={draftError}
                        isBusy={loadingKey === offKey}
                        onConfirm={() => handleSubmitOfferOnBehalf(buyer)}
                        onCancel={() => {
                          setDraftOfferKey(null)
                          setDraftError(null)
                        }}
                      />
                    ) : confirmCancelKey === offKey && resolvedOfferId ? (
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px]">
                        <span className="font-extrabold text-red-800">
                          {sm.confirmCancelOfferPrompt}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={loadingKey === `cancel_${offKey}`}
                            onClick={() =>
                              handleCancelSentOffer(offKey, resolvedOfferId)
                            }
                            className="inline-flex h-7 items-center gap-1 rounded-lg bg-red-600 px-2.5 text-[11px] font-extrabold text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            {loadingKey === `cancel_${offKey}` && (
                              <Loader2 className="size-3 animate-spin" />
                            )}
                            <span>{sm.confirmYesCancelBtn}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmCancelKey(null)}
                            className="h-7 rounded-lg border border-slate-300 bg-white px-2.5 text-[11px] font-bold text-slate-700"
                          >
                            {sm.backBtn}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2.5">
                        {!isAutoPublished && !isOfferSentNow && (
                          <button
                            type="button"
                            disabled={isPending || isManuallyRecommended}
                            onClick={() => handleSendSingle(buyer.id)}
                            className={`inline-flex h-8.5 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-[11px] font-bold whitespace-nowrap text-white transition ${
                              isManuallyRecommended
                                ? "bg-emerald-600"
                                : "bg-[#0f1d40] hover:bg-[#1e293b]"
                            }`}
                          >
                            {loadingKey === recKey ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : isManuallyRecommended ? (
                              <>
                                <Check className="size-3.5 shrink-0" />
                                <span>{sm.sentRecDoneBtn}</span>
                              </>
                            ) : (
                              <>
                                <Send className="size-3.5 shrink-0" />
                                <span>{sm.sendRecToBuyerBtn}</span>
                              </>
                            )}
                          </button>
                        )}

                        {isOfferSentNow ? (
                          <>
                            {resolvedOfferId && (
                              <Link
                                href={
                                  effectiveStatus === "unit_locked"
                                    ? `/admin/deals?tab=waitlist&offerId=${resolvedOfferId}`
                                    : `/admin/deals?offerId=${resolvedOfferId}`
                                }
                                onClick={onClose}
                                className={`inline-flex h-8.5 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-[11px] font-extrabold whitespace-nowrap text-white transition ${
                                  effectiveStatus === "accepted"
                                    ? "bg-[#007a5a] hover:bg-[#006248]"
                                    : "bg-purple-700 hover:bg-purple-800"
                                }`}
                              >
                                <Handshake className="size-3.5 shrink-0" />
                                <span>
                                  {effectiveStatus === "accepted"
                                    ? sm.openAcceptedDealBtn ||
                                      sm.openInDealsBtn
                                    : sm.openInDealsBtn}
                                </span>
                              </Link>
                            )}
                            {canCancelOffer && (
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => setConfirmCancelKey(offKey)}
                                className="inline-flex h-8.5 items-center justify-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 text-[11px] font-extrabold whitespace-nowrap text-red-700 transition hover:bg-red-100"
                              >
                                <XCircle className="size-3.5 shrink-0" />
                                <span>{sm.cancelOfferBtn}</span>
                              </button>
                            )}
                          </>
                        ) : !unitHasAcceptedOffer ? (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => openOfferComposer(buyer)}
                            className="inline-flex h-8.5 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#007a5a] px-3 text-[11px] font-extrabold whitespace-nowrap text-white transition hover:bg-[#006248]"
                          >
                            <Wallet className="size-3.5 shrink-0" />
                            <span>
                              {sm.createOfferFromBuyerBtn ||
                                sm.createOfficialOfferBtn}
                            </span>
                          </button>
                        ) : null}

                        <a
                          data-admin-client-wa="true"
                          href={`https://wa.me/${String(buyer.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(bWa)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-8.5 items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-3 text-[11px] font-bold whitespace-nowrap text-white hover:bg-[#1ebe5d]"
                        >
                          <MessageCircle className="size-3.5 shrink-0" />
                          <span>{leadsPrompts.whatsappBtn}</span>
                        </a>
                      </div>
                    )}
                  </div>
                )
              }
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function BuyerSmartMatchModal({
  lead,
  units,
  offers = [],
  onClose,
  onNotice,
}: {
  lead: MatchableBuyer | null
  units: MatchableUnit[]
  offers?: any[]
  onClose: () => void
  onNotice?: (msg: { text: string; isError?: boolean }) => void
}) {
  const router = useRouter()
  const { t: dict, locale, dir } = useTranslation()
  const sm = (dict.admin as Record<string, any>)?.smartMatch || {}
  const dealsDict = (dict.admin as Record<string, any>)?.dealsPage || {}
  const matcherDict = (dict.smartMatcher as Record<string, any>) || {}
  const buyerDict = (dict.accountComponents as Record<string, any>)?.buyer || {}
  const tLeads = dict.admin?.leadsAdmin || {}

  const [loadingKey, setLoadingKey] = useState<string | null>(null)
  const [doneKeys, setDoneKeys] = useState<Record<string, boolean>>({})
  const [createdOfferIds, setCreatedOfferIds] = useState<
    Record<string, string>
  >({})
  const [cancelledOfferIds, setCancelledOfferIds] = useState<
    Record<string, boolean>
  >({})
  const [draftOfferKey, setDraftOfferKey] = useState<string | null>(null)
  const [draftMode, setDraftMode] = useState<"full" | "custom">("full")
  const [draftPriceStr, setDraftPriceStr] = useState("")
  const [draftError, setDraftError] = useState<string | null>(null)
  const [confirmCancelKey, setConfirmCancelKey] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!lead) return null

  const leadCur = getCurrencySymbol("GE", locale)
  const matchPrefix = sm.matchScorePrefix || buyerDict.matchScorePrefix || ""
  const leadPhoneDigits = String(lead.phone || "").replace(/\D/g, "")

  const matchedUnitsList = (units || [])
    .filter((u) => {
      if (!isUnitEligibleForSmartMatch(u.status)) return false
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
    .map((unit) => {
      const existingOffer = offers.find(
        (o) =>
          String(o.property_id) === String(unit.id) &&
          !cancelledOfferIds[String(o.id)] &&
          isSameBuyerOffer(o, lead)
      )
      const unitLockedBySomeone = offers.some(
        (o) =>
          String(o.property_id) === String(unit.id) &&
          !cancelledOfferIds[String(o.id)] &&
          resolveEffectiveOfferStatus(o) === "accepted"
      )
      return {
        unit,
        match: calculateSmartMatch(unit, lead, undefined, locale),
        existingOffer,
        effectiveStatus: resolveEffectiveOfferStatus(existingOffer),
        unitLockedBySomeone,
      }
    })
    .filter((item) => {
      if (item.match.score < 60) return false
      const offKey = `off_${item.unit.id}_${lead.id}`
      // إخفاء الوحدات التي عليها عرض فعلي مسبقاً (لأن مكانها "سجل عروضه") مع إبقاء الوحدة التي تم تسجيل عرضها للتو حتى إغلاق النافذة
      const hasPreExistingRealOffer =
        Boolean(item.existingOffer) &&
        item.effectiveStatus !== "recommended" &&
        item.effectiveStatus !== "rejected" &&
        !doneKeys[offKey]
      return !hasPreExistingRealOffer
    })
    .sort((a, b) => {
      if (b.match.score !== a.match.score) return b.match.score - a.match.score
      if (a.match.differences.length !== b.match.differences.length) {
        return a.match.differences.length - b.match.differences.length
      }
      return b.match.matches.length - a.match.matches.length
    })

  const manualUnits = matchedUnitsList.filter(
    (item) =>
      item.match.score < AUTO_PUBLISH_THRESHOLD &&
      !item.existingOffer &&
      !doneKeys[`rec_${item.unit.id}_${lead.id}`]
  )

  const bulkKey = `bulk_lead_${lead.id}`
  const isBulkDone = Boolean(doneKeys[bulkKey])

  function handleSendSingle(propertyId: string) {
    if (!lead) return
    const k = `rec_${propertyId}_${lead.id}`
    setLoadingKey(k)
    startTransition(async () => {
      try {
        const res = await adminSendRecommendationAction({
          propertyId,
          leadId: lead.id,
        })
        if (res.success) {
          setDoneKeys((prev) => ({ ...prev, [k]: true }))
          onNotice?.({ text: sm.recSentSuccess })
          router.refresh()
        } else if (res.error) {
          onNotice?.({ text: res.error, isError: true })
        }
      } finally {
        setLoadingKey(null)
      }
    })
  }

  function handleSendAllManual() {
    if (!lead) return
    setLoadingKey(bulkKey)
    startTransition(async () => {
      try {
        for (const item of manualUnits) {
          await adminSendRecommendationAction({
            propertyId: item.unit.id,
            leadId: lead.id,
          })
        }
        setDoneKeys((prev) => ({ ...prev, [bulkKey]: true }))
        onNotice?.({ text: `${sm.recSentSuccess} (${manualUnits.length})` })
        router.refresh()
      } finally {
        setLoadingKey(null)
      }
    })
  }

  function openOfferComposer(unit: MatchableUnit) {
    if (!lead) return
    const k = `off_${unit.id}_${lead.id}`
    const guardrails = getUnitPricingGuardrails(unit)
    const buyerCash = Number(lead.available_cash || lead.budget || 0)
    const suggestedCustom =
      buyerCash > 0 && buyerCash < guardrails.requiredCash
        ? Math.max(buyerCash, guardrails.minAllowedOfferCash)
        : guardrails.minAllowedOfferCash

    setDraftOfferKey(k)
    setDraftMode("full")
    setDraftPriceStr(suggestedCustom.toLocaleString("en-US"))
    setDraftError(null)
    setConfirmCancelKey(null)
  }

  function handleSubmitOfferOnBehalf(unit: MatchableUnit) {
    if (!lead) return
    const k = `off_${unit.id}_${lead.id}`
    const guardrails = getUnitPricingGuardrails(unit)
    let offeredCash = guardrails.requiredCash

    if (guardrails.allowNegotiation && draftMode === "custom") {
      const parsedVal = Number(toAsciiDigits(draftPriceStr).replace(/,/g, ""))
      if (
        !Number.isFinite(parsedVal) ||
        parsedVal <= 0 ||
        parsedVal > guardrails.requiredCash
      ) {
        setDraftError(sm.invalidCustomPriceErr)
        return
      }
      offeredCash = parsedVal
    }

    setDraftError(null)
    setLoadingKey(k)
    startTransition(async () => {
      try {
        const res = await adminCreateOfficialOfferAction({
          propertyId: unit.id,
          leadId: lead.id,
          offeredCash,
          paymentReadiness: "1_week",
        })
        if (res.success) {
          setDoneKeys((prev) => ({ ...prev, [k]: true }))
          if (res.offerId) {
            setCreatedOfferIds((prev) => ({
              ...prev,
              [k]: String(res.offerId),
            }))
          }
          setDraftOfferKey(null)
          onNotice?.({ text: sm.officialOfferSentSuccess })
          router.refresh()
        } else if (res.error) {
          setDraftError(res.error)
          onNotice?.({ text: res.error, isError: true })
        }
      } finally {
        setLoadingKey(null)
      }
    })
  }

  function handleCancelSentOffer(offKey: string, offerId: string) {
    setLoadingKey(`cancel_${offKey}`)
    startTransition(async () => {
      try {
        const res = await adminWithdrawPendingOfferAction(offerId)
        if (res.success) {
          setCancelledOfferIds((prev) => ({ ...prev, [offerId]: true }))
          setDoneKeys((prev) => {
            const next = { ...prev }
            delete next[offKey]
            return next
          })
          setCreatedOfferIds((prev) => {
            const next = { ...prev }
            delete next[offKey]
            return next
          })
          setConfirmCancelKey(null)
          onNotice?.({ text: sm.offerCancelledSuccess })
          router.refresh()
        } else if (res.error) {
          onNotice?.({ text: res.error, isError: true })
        }
      } finally {
        setLoadingKey(null)
      }
    })
  }

  return (
    <Dialog open={Boolean(lead)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        dir={dir}
        className="max-h-[88vh] w-[95vw] overflow-x-hidden overflow-y-auto rounded-2xl p-4 text-start sm:max-w-[620px] sm:p-5"
      >
        <DialogHeader className="border-b border-slate-100 pb-3 pr-9 text-start">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <DialogTitle className="text-sm leading-relaxed font-black text-[#0f1d40] sm:text-base">
              🎯 {sm.buyerMatchedUnitsTitle}:{" "}
              <span className="text-[#007a5a]">{lead.name}</span>
            </DialogTitle>

            {manualUnits.length > 0 && (
              <button
                type="button"
                disabled={isPending || isBulkDone}
                onClick={handleSendAllManual}
                className={`inline-flex h-8 w-fit items-center gap-1.5 rounded-lg px-3 text-[11px] font-bold text-white transition ${
                  isBulkDone
                    ? "bg-emerald-600"
                    : "bg-[#007a5a] hover:bg-[#006248]"
                }`}
              >
                {loadingKey === bulkKey ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>{sm.sendingNow}</span>
                  </>
                ) : (
                  <>
                    <Send className="size-3.5" />
                    <span>
                      {sm.sendAllRecsBtn} ({manualUnits.length})
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
          <DialogDescription className="mt-1 text-start text-xs text-slate-500">
            {tLeads.cashLabel}{" "}
            <strong dir="ltr" className="inline-block text-[#007a5a]">
              {leadCur}
              {Number(lead.available_cash || lead.budget || 0).toLocaleString(
                "en-US"
              )}
            </strong>
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2.5 text-[11.5px] font-semibold leading-relaxed text-blue-950">
          <Info className="mt-0.5 size-4 shrink-0 text-[#2563eb]" />
          <span>{sm.buyerModalHelperBanner}</span>
        </div>

        <div className="mt-3 space-y-3">
          {matchedUnitsList.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">
              {sm.noMatchesFound}
            </p>
          ) : (
            matchedUnitsList.map(
              ({
                unit,
                match,
                existingOffer,
                effectiveStatus,
                unitLockedBySomeone,
              }) => {
                const uCash = Number(unit.paid_amount || 0).toLocaleString(
                  "en-US"
                )
                const localizedArea = cleanAreaName(unit.area, locale)
                const uOfficialCode = deriveShortUnitCode(unit.id, unit.code)
                const recKey = `rec_${unit.id}_${lead.id}`
                const offKey = `off_${unit.id}_${lead.id}`
                const isAutoPublished = match.score >= AUTO_PUBLISH_THRESHOLD
                const isManuallyRecommended =
                  Boolean(doneKeys[recKey]) ||
                  isBulkDone ||
                  (Boolean(existingOffer) && effectiveStatus === "recommended")
                const hasRealOffer =
                  Boolean(existingOffer) &&
                  effectiveStatus !== "recommended" &&
                  effectiveStatus !== "rejected"
                const isPriorityReturned =
                  Array.isArray(existingOffer?.diff_reasons) &&
                  existingOffer.diff_reasons.includes(PRIORITY_RETURNED_TAG)
                const resolvedOfferId =
                  (hasRealOffer ? String(existingOffer.id) : null) ||
                  createdOfferIds[offKey] ||
                  null
                const isOfferSentNow = Boolean(doneKeys[offKey]) || hasRealOffer
                const canCancelOffer =
                  Boolean(resolvedOfferId) &&
                  isOfferSentNow &&
                  (effectiveStatus === "pending_admin" ||
                    effectiveStatus === "pending_seller" ||
                    (!existingOffer && Boolean(createdOfferIds[offKey])))

                return (
                  <div
                    key={unit.id}
                    className="rounded-xl border border-slate-200/90 bg-white p-3.5 text-xs shadow-2xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-[#0f1d40]">
                          {unit.project_name || "—"}
                        </p>
                        <p className="mt-0.5 text-[11.5px] font-semibold text-slate-500">
                          {localizedArea}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-md bg-[#0f1d40] px-2.5 py-0.5 font-mono text-[10.5px] font-bold text-white">
                        {uOfficialCode}
                      </span>
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded-md px-2.5 py-0.5 text-[11px] font-black ${
                          match.score >= AUTO_PUBLISH_THRESHOLD
                            ? "bg-[#007a5a] text-white"
                            : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        🎯 {matchPrefix} {match.score}%
                      </span>

                      {isOfferSentNow ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-purple-100 px-2.5 py-0.5 text-[10.5px] font-extrabold text-purple-800">
                          {effectiveStatus === "pending_admin" &&
                            isPriorityReturned && (
                              <Sparkles className="size-3" />
                            )}
                          {effectiveStatus === "pending_admin" &&
                            !isPriorityReturned && <Clock className="size-3" />}
                          {effectiveStatus === "unit_locked" && (
                            <Lock className="size-3" />
                          )}
                          <span>
                            {effectiveStatus === "accepted"
                              ? sm.offerAcceptedTag
                              : effectiveStatus === "pending_admin" &&
                                  isPriorityReturned
                                ? `⭐ ${dealsDict.badgePriorityReturned || sm.offerPendingAdminTag}`
                                : effectiveStatus === "pending_admin"
                                  ? sm.offerPendingAdminTag
                                  : effectiveStatus === "unit_locked"
                                    ? `⏳ ${sm.offerBackupTag}`
                                    : sm.sentOfferDoneBtn}
                          </span>
                        </span>
                      ) : isAutoPublished ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-0.5 text-[10.5px] font-extrabold text-[#007a5a]">
                          <CheckCircle2 className="size-3" />
                          <span>{sm.autoPublishedTag}</span>
                        </span>
                      ) : isManuallyRecommended ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-0.5 text-[10.5px] font-extrabold text-blue-800">
                          <Check className="size-3" />
                          <span>{sm.recSentTag}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2.5 py-0.5 text-[10.5px] font-bold text-amber-800">
                          <span>{sm.notAutoPublishedTag}</span>
                        </span>
                      )}
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <p className="text-xs font-extrabold text-[#007a5a]">
                        {tLeads.cashLabel}{" "}
                        <span dir="ltr" className="inline-block">
                          {leadCur}
                          {uCash}
                        </span>
                      </p>
                      <UnitNegotiabilityBadge
                        unit={unit}
                        cur={leadCur}
                        sm={sm}
                      />
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {match.matches.map((mStr) => (
                        <span
                          key={mStr}
                          className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10.5px] font-semibold text-[#007a5a]"
                        >
                          ✓{" "}
                          {formatReasonForAdmin(mStr, locale, matcherDict, sm)}
                        </span>
                      ))}
                      {match.differences.map((dStr) => (
                        <span
                          key={dStr}
                          className="rounded-md bg-amber-50 px-2 py-0.5 text-[10.5px] font-semibold text-amber-800"
                        >
                          ⚠️{" "}
                          {formatReasonForAdmin(dStr, locale, matcherDict, sm)}
                        </span>
                      ))}
                    </div>

                    {draftOfferKey === offKey ? (
                      <InlineOfferComposer
                        unit={unit}
                        buyerName={lead.name || ""}
                        cur={leadCur}
                        sm={sm}
                        mode={draftMode}
                        setMode={setDraftMode}
                        customPriceStr={draftPriceStr}
                        setCustomPriceStr={setDraftPriceStr}
                        errorText={draftError}
                        isBusy={loadingKey === offKey}
                        onConfirm={() => handleSubmitOfferOnBehalf(unit)}
                        onCancel={() => {
                          setDraftOfferKey(null)
                          setDraftError(null)
                        }}
                      />
                    ) : confirmCancelKey === offKey && resolvedOfferId ? (
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px]">
                        <span className="font-extrabold text-red-800">
                          {sm.confirmCancelOfferPrompt}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={loadingKey === `cancel_${offKey}`}
                            onClick={() =>
                              handleCancelSentOffer(offKey, resolvedOfferId)
                            }
                            className="inline-flex h-7 items-center gap-1 rounded-lg bg-red-600 px-2.5 text-[11px] font-extrabold text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            {loadingKey === `cancel_${offKey}` && (
                              <Loader2 className="size-3 animate-spin" />
                            )}
                            <span>{sm.confirmYesCancelBtn}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmCancelKey(null)}
                            className="h-7 rounded-lg border border-slate-300 bg-white px-2.5 text-[11px] font-bold text-slate-700"
                          >
                            {sm.backBtn}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2.5">
                        {!isAutoPublished && !isOfferSentNow && (
                          <button
                            type="button"
                            disabled={isPending || isManuallyRecommended}
                            onClick={() => handleSendSingle(unit.id)}
                            className={`inline-flex h-8.5 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-[11px] font-bold whitespace-nowrap text-white transition ${
                              isManuallyRecommended
                                ? "bg-emerald-600"
                                : "bg-[#0f1d40] hover:bg-[#1e293b]"
                            }`}
                          >
                            {loadingKey === recKey ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : isManuallyRecommended ? (
                              <>
                                <Check className="size-3.5 shrink-0" />
                                <span>{sm.sentRecDoneBtn}</span>
                              </>
                            ) : (
                              <>
                                <Send className="size-3.5 shrink-0" />
                                <span>{sm.sendRecToBuyerBtn}</span>
                              </>
                            )}
                          </button>
                        )}

                        {isOfferSentNow ? (
                          <>
                            {resolvedOfferId && (
                              <Link
                                href={
                                  effectiveStatus === "unit_locked"
                                    ? `/admin/deals?tab=waitlist&offerId=${resolvedOfferId}`
                                    : `/admin/deals?offerId=${resolvedOfferId}`
                                }
                                onClick={onClose}
                                className={`inline-flex h-8.5 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-[11px] font-extrabold whitespace-nowrap text-white transition ${
                                  effectiveStatus === "accepted"
                                    ? "bg-[#007a5a] hover:bg-[#006248]"
                                    : "bg-purple-700 hover:bg-purple-800"
                                }`}
                              >
                                <Handshake className="size-3.5 shrink-0" />
                                <span>
                                  {effectiveStatus === "accepted"
                                    ? sm.openAcceptedDealBtn ||
                                      sm.openInDealsBtn
                                    : sm.openInDealsBtn}
                                </span>
                              </Link>
                            )}
                            {canCancelOffer && (
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => setConfirmCancelKey(offKey)}
                                className="inline-flex h-8.5 items-center justify-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 text-[11px] font-extrabold whitespace-nowrap text-red-700 transition hover:bg-red-100"
                              >
                                <XCircle className="size-3.5 shrink-0" />
                                <span>{sm.cancelOfferBtn}</span>
                              </button>
                            )}
                          </>
                        ) : !unitLockedBySomeone ? (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => openOfferComposer(unit)}
                            className="inline-flex h-8.5 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#007a5a] px-3 text-[11px] font-extrabold whitespace-nowrap text-white transition hover:bg-[#006248]"
                          >
                            <Wallet className="size-3.5 shrink-0" />
                            <span>{sm.createOfficialOfferBtn}</span>
                          </button>
                        ) : null}

                        <Link
                          href={`/opportunities/${unit.id}`}
                          target="_blank"
                          className="inline-flex h-8.5 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-[11px] font-bold whitespace-nowrap text-[#007a5a] hover:bg-slate-100"
                        >
                          <ExternalLink className="size-3.5 shrink-0" />
                          <span>{sm.viewUnitBtn}</span>
                        </Link>
                      </div>
                    )}
                  </div>
                )
              }
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}