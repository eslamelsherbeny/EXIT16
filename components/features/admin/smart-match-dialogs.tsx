"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  MessageCircle,
  Phone,
  Send,
  Wallet,
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
  type MatchableBuyer,
  type MatchableUnit,
} from "@/lib/smart-matcher"
import {
  adminCreateOfficialOfferAction,
  adminSendBulkRecommendationsAction,
  adminSendRecommendationAction,
} from "@/actions/offer-actions"

const PENDING_ADMIN_TAG = "__PENDING_ADMIN_VERIFICATION__"
const AUTO_PUBLISH_THRESHOLD = 80

function deriveShortUnitCode(id: string) {
  const digits = String(id || "").replace(/\D/g, "")
  const num = digits ? Number(digits.slice(-4)) : 100
  return `U-${String(num).padStart(5, "0")}`
}

function cleanAreaName(rawArea: string | null | undefined, locale: string) {
  const localized = getLocalizedGeorgiaAreaName(rawArea, locale as any)
  if (locale === "ar") {
    return localized.replace(/\s*\([A-Za-z0-9\s/-]+\)\s*$/g, "").trim()
  }
  return localized
}

/**
 * تحويل جمل التوافق من صيغة المخاطب للعميل ("سيولتك / قدرتك") إلى صيغة تقرير مختصر للأدمن
 */
function formatReasonForAdmin(text: string, locale: string): string {
  if (locale !== "ar") return text
  return text
    .replace("الكاش المطلوب في حدود سيولتك المتاحة", "الكاش مناسب للمشتري")
    .replace(
      "الكاش المطلوب أعلى قليلاً من سيولتك المحددة",
      "الكاش أعلى قليلاً من ميزانيته"
    )
    .replace("القسط مناسب لقدرتك الشهرية", "القسط مناسب للمشتري")
    .replace("القسط أعلى من القسط المفضل لديك", "القسط أعلى من طلب المشتري")
    .replace("(طلبك ", "(طلبه ")
    .replace(/\s*\([A-Za-z0-9\s/-]+\)\s*$/g, "")
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
  const { t: dict, locale, dir } = useTranslation()
  const sm = (dict.admin as Record<string, any>)?.smartMatch || {}
  const buyerDict = (dict.accountComponents as Record<string, any>)?.buyer || {}
  const leadsPrompts = dict.admin?.leads || {}
  const propTable = dict.admin?.propertiesAdmin?.table || {}

  const [loadingKey, setLoadingKey] = useState<string | null>(null)
  const [doneKeys, setDoneKeys] = useState<Record<string, boolean>>({})
  const [isPending, startTransition] = useTransition()

  if (!unit) return null

  const unitCur = getCurrencySymbol("GE", locale)
  const matchPrefix = sm.matchScorePrefix || buyerDict.matchScorePrefix || ""
  const localizedUnitArea = cleanAreaName(unit.area, locale)
  const unitPhoneDigits = String(unit.phone || "").replace(/\D/g, "")

  const unitHasAcceptedOffer = offers.some(
    (o) =>
      String(o.property_id) === String(unit.id) &&
      resolveEffectiveOfferStatus(o) === "accepted"
  )

  const matchedList = (buyers || [])
    .filter((b) => {
      if (b.user_id && unit.user_id && String(b.user_id) === String(unit.user_id))
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
          String(o.lead_id || "") === String(buyer.id)
      )
      return {
        buyer,
        match: calculateSmartMatch(unit, buyer, undefined, locale),
        existingOffer,
        effectiveStatus: resolveEffectiveOfferStatus(existingOffer),
      }
    })
    .filter((item) => item.match.score >= 60)
    .sort((a, b) => b.match.score - a.match.score)

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

  function handleCreateOfferOnBehalf(buyer: MatchableBuyer) {
    if (!unit) return
    const k = `off_${unit.id}_${buyer.id}`
    setLoadingKey(k)
    const offeredCash =
      Math.min(
        Number(unit.paid_amount) || 0,
        Number(buyer.available_cash || buyer.budget) ||
          Number(unit.paid_amount) ||
          0
      ) ||
      Number(unit.paid_amount) ||
      0

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
          onNotice?.({ text: sm.officialOfferSentSuccess })
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
        className="max-h-[88vh] w-[95vw] max-w-[540px] overflow-x-hidden overflow-y-auto rounded-2xl p-4 text-start sm:p-5"
      >
        <DialogHeader className="border-b border-gray-100 pb-3 text-start">
          <div className="flex flex-col gap-2 pe-6 sm:flex-row sm:items-center sm:justify-between">
            <DialogTitle className="text-xs leading-relaxed font-black text-[#0a1122] sm:text-sm">
              🎯 {sm.unitMatchedBuyersTitle}:{" "}
              <span className="text-[#105C50]">
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
                    : "bg-[#105C50] hover:bg-[#0c483f]"
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
          <DialogDescription className="mt-1 text-start text-[11px] leading-relaxed text-gray-500">
            {propTable.colCash}:{" "}
            <strong dir="ltr" className="text-[#105C50]">
              {Number(unit.paid_amount || 0).toLocaleString("en-US")} {unitCur}
            </strong>{" "}
            · {localizedUnitArea} · {deriveShortUnitCode(unit.id)}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-3 space-y-3">
          {matchedList.length === 0 ? (
            <p className="py-6 text-center text-xs text-gray-400">
              {sm.noMatchesFound}
            </p>
          ) : (
            matchedList.map(
              ({ buyer, match, existingOffer, effectiveStatus }) => {
                const bCash = Number(
                  buyer.available_cash || buyer.budget || 0
                ).toLocaleString("en-US")
                const bWa = `${leadsPrompts.waUnitLeadPrefix} ${buyer.name || ""}، ${leadsPrompts.waUnitLeadMiddle} (${unit.project_name || ""} - ${localizedUnitArea}) — ${matchPrefix} ${match.score}%`

                const recKey = `rec_${unit.id}_${buyer.id}`
                const offKey = `off_${unit.id}_${buyer.id}`
                const isAutoPublished = match.score >= AUTO_PUBLISH_THRESHOLD
                const isManuallyRecommended =
                  Boolean(doneKeys[recKey]) ||
                  isBulkDone ||
                  Boolean(existingOffer)
                const hasRealOffer =
                  Boolean(existingOffer) && effectiveStatus !== "recommended"
                const isOffDone =
                  Boolean(doneKeys[offKey]) ||
                  (hasRealOffer && effectiveStatus !== "pending_admin")

                return (
                  <div
                    key={buyer.id}
                    className="overflow-hidden rounded-xl border border-gray-200/90 bg-white p-3.5 text-xs shadow-2xs"
                  >
                    {/* هيدر البطاقة: الاسم والهاتف في سطر كامل واضح على الموبايل والشارات تحته أو بجانبه في الشاشات الأكبر */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="w-full sm:w-auto sm:min-w-0 sm:flex-1">
                        <div className="flex items-center justify-between gap-2 sm:block">
                          <p className="text-sm font-black break-words text-[#0a1122]">
                            {buyer.name}
                          </p>
                          <p
                            dir="ltr"
                            className="inline-flex shrink-0 items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 font-mono text-[11px] font-bold text-gray-700 sm:mt-1"
                          >
                            <Phone className="size-3 text-[#105C50]" />
                            <span>{buyer.phone}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                        <span
                          className={`rounded-md px-2.5 py-0.5 text-[10.5px] font-black ${
                            match.score >= AUTO_PUBLISH_THRESHOLD
                              ? "bg-[#105C50] text-white"
                              : "bg-amber-100 text-amber-900"
                          }`}
                        >
                          🎯 {matchPrefix} {match.score}%
                        </span>

                        {hasRealOffer ? (
                          <Link
                            href={`/admin/deals?offerId=${existingOffer.id}`}
                            onClick={onClose}
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-extrabold ${
                              effectiveStatus === "accepted"
                                ? "bg-emerald-600 text-white"
                                : effectiveStatus === "pending_admin"
                                  ? "bg-amber-500 text-white"
                                  : effectiveStatus === "rejected"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {effectiveStatus === "pending_admin" && (
                              <Clock className="size-2.5" />
                            )}
                            <span>
                              {effectiveStatus === "accepted"
                                ? sm.offerAcceptedTag
                                : effectiveStatus === "pending_admin"
                                  ? sm.offerPendingAdminTag
                                  : effectiveStatus === "rejected"
                                    ? sm.offerRejectedTag
                                    : sm.offerPendingTag}
                            </span>
                          </Link>
                        ) : isAutoPublished ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-[#105C50]">
                            <CheckCircle2 className="size-3" />
                            <span>
                              {sm.autoPublishedTag || "منشورة تلقائياً بحسابه"}
                            </span>
                          </span>
                        ) : isManuallyRecommended ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-extrabold text-blue-800">
                            <Check className="size-3" />
                            <span>{sm.recSentTag}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                            <span>
                              {sm.notAutoPublishedTag ||
                                "غير منشورة تلقائياً (<80%)"}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="mt-2.5 text-xs font-extrabold text-[#105C50]">
                      {leadsPrompts.cashShort}{" "}
                      <span dir="ltr">{bCash}</span> {unitCur}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-1">
                      {match.matches.map((mStr) => (
                        <span
                          key={mStr}
                          className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-[#105C50]"
                        >
                          ✓ {formatReasonForAdmin(mStr, locale)}
                        </span>
                      ))}
                      {match.differences.map((dStr) => (
                        <span
                          key={dStr}
                          className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800"
                        >
                          ⚠️ {formatReasonForAdmin(dStr, locale)}
                        </span>
                      ))}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-gray-100 pt-2.5">
                      {!isAutoPublished && !hasRealOffer && (
                        <button
                          type="button"
                          disabled={isPending || isManuallyRecommended}
                          onClick={() => handleSendSingle(buyer.id)}
                          className={`inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-lg px-2 text-[11px] font-bold whitespace-nowrap text-white transition ${
                            isManuallyRecommended
                              ? "bg-emerald-600"
                              : "bg-[#0a1122] hover:bg-[#16223f]"
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

                      {(!unitHasAcceptedOffer || isOffDone) && (
                        <button
                          type="button"
                          disabled={isPending || isOffDone}
                          onClick={() => handleCreateOfferOnBehalf(buyer)}
                          className={`inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-lg px-2 text-[11px] font-bold whitespace-nowrap text-white transition ${
                            isOffDone
                              ? "bg-purple-700"
                              : "bg-[#105C50] hover:bg-[#0c483f]"
                          }`}
                        >
                          {loadingKey === offKey ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : isOffDone ? (
                            <>
                              <Check className="size-3.5 shrink-0" />
                              <span>{sm.sentOfferDoneBtn}</span>
                            </>
                          ) : (
                            <>
                              <Wallet className="size-3.5 shrink-0" />
                              <span>{sm.createOfficialOfferBtn}</span>
                            </>
                          )}
                        </button>
                      )}

                      <a
                        data-admin-client-wa="true"
                        href={`https://wa.me/${String(buyer.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(bWa)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-lg bg-[#25D366] px-2.5 text-[11px] font-bold whitespace-nowrap text-white hover:opacity-90"
                      >
                        <MessageCircle className="size-3.5 shrink-0" />
                        <span>{leadsPrompts.whatsappBtn}</span>
                      </a>
                    </div>
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
  const buyerDict = (dict.accountComponents as Record<string, any>)?.buyer || {}
  const tLeads = dict.admin?.leadsAdmin || {}

  const [loadingKey, setLoadingKey] = useState<string | null>(null)
  const [doneKeys, setDoneKeys] = useState<Record<string, boolean>>({})
  const [isPending, startTransition] = useTransition()

  if (!lead) return null

  const leadCur = getCurrencySymbol("GE", locale)
  const matchPrefix = sm.matchScorePrefix || buyerDict.matchScorePrefix || ""
  const leadPhoneDigits = String(lead.phone || "").replace(/\D/g, "")

  const matchedUnitsList = (units || [])
    .filter((u) => {
      if (u.status !== "active" && u.status !== "offer_received") return false
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
    .map((unit) => {
      const existingOffer = offers.find(
        (o) =>
          String(o.property_id) === String(unit.id) &&
          String(o.lead_id || "") === String(lead.id)
      )
      const unitLockedBySomeone = offers.some(
        (o) =>
          String(o.property_id) === String(unit.id) &&
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
    .filter((item) => item.match.score >= 60)
    .sort((a, b) => b.match.score - a.match.score)

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
        onNotice?.({
          text: `${sm.recSentSuccess} (${manualUnits.length})`,
        })
        router.refresh()
      } finally {
        setLoadingKey(null)
      }
    })
  }

  function handleCreateOfferOnBehalf(unit: MatchableUnit) {
    if (!lead) return
    const k = `off_${unit.id}_${lead.id}`
    setLoadingKey(k)
    const offeredCash =
      Math.min(
        Number(unit.paid_amount) || 0,
        Number(lead.available_cash || lead.budget) ||
          Number(unit.paid_amount) ||
          0
      ) ||
      Number(unit.paid_amount) ||
      0

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
          onNotice?.({ text: sm.officialOfferSentSuccess })
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
        className="max-h-[88vh] w-[95vw] max-w-[540px] overflow-x-hidden overflow-y-auto rounded-2xl p-4 text-start sm:p-5"
      >
        <DialogHeader className="border-b border-gray-100 pb-3 text-start">
          <div className="flex flex-col gap-2 pe-6 sm:flex-row sm:items-center sm:justify-between">
            <DialogTitle className="text-xs leading-relaxed font-black text-[#0a1122] sm:text-sm">
              🎯 {sm.buyerMatchedUnitsTitle}:{" "}
              <span className="text-[#105C50]">{lead.name}</span>
            </DialogTitle>

            {manualUnits.length > 0 && (
              <button
                type="button"
                disabled={isPending || isBulkDone}
                onClick={handleSendAllManual}
                className={`inline-flex h-8 w-fit items-center gap-1.5 rounded-lg px-3 text-[11px] font-bold text-white transition ${
                  isBulkDone
                    ? "bg-emerald-600"
                    : "bg-[#105C50] hover:bg-[#0c483f]"
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
          <DialogDescription className="mt-1 text-start text-[11px] text-gray-500">
            {tLeads.cashLabel}{" "}
            <strong dir="ltr" className="text-[#105C50]">
              {Number(lead.available_cash || lead.budget || 0).toLocaleString(
                "en-US"
              )}{" "}
              {leadCur}
            </strong>
          </DialogDescription>
        </DialogHeader>

        <div className="mt-3 space-y-3">
          {matchedUnitsList.length === 0 ? (
            <p className="py-6 text-center text-xs text-gray-400">
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
                const recKey = `rec_${unit.id}_${lead.id}`
                const offKey = `off_${unit.id}_${lead.id}`
                const isAutoPublished = match.score >= AUTO_PUBLISH_THRESHOLD
                const isManuallyRecommended =
                  Boolean(doneKeys[recKey]) ||
                  isBulkDone ||
                  Boolean(existingOffer)
                const hasRealOffer =
                  Boolean(existingOffer) && effectiveStatus !== "recommended"
                const isOffDone =
                  Boolean(doneKeys[offKey]) ||
                  (hasRealOffer && effectiveStatus !== "pending_admin")

                return (
                  <div
                    key={unit.id}
                    className="overflow-hidden rounded-xl border border-gray-200/90 bg-white p-3.5 text-xs shadow-2xs"
                  >
                    {/* هيدر البطاقة: اسم المشروع والمنطقة في سطر كامل واضح والشارات مرتبة تحته */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="w-full sm:w-auto sm:min-w-0 sm:flex-1">
                        <div className="flex items-center justify-between gap-2 sm:block">
                          <p className="text-sm font-black break-words text-[#0a1122]">
                            {unit.project_name || "—"} · {localizedArea}
                          </p>
                          <span className="inline-block shrink-0 rounded bg-gray-100 px-2 py-0.5 font-mono text-[10px] font-bold text-gray-600 sm:mt-1">
                            {deriveShortUnitCode(unit.id)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                        <span
                          className={`rounded-md px-2.5 py-0.5 text-[10.5px] font-black ${
                            match.score >= AUTO_PUBLISH_THRESHOLD
                              ? "bg-[#105C50] text-white"
                              : "bg-amber-100 text-amber-900"
                          }`}
                        >
                          🎯 {matchPrefix} {match.score}%
                        </span>

                        {hasRealOffer ? (
                          <Link
                            href={`/admin/deals?offerId=${existingOffer.id}`}
                            onClick={onClose}
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-extrabold ${
                              effectiveStatus === "accepted"
                                ? "bg-emerald-600 text-white"
                                : effectiveStatus === "pending_admin"
                                  ? "bg-amber-500 text-white"
                                  : effectiveStatus === "rejected"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {effectiveStatus === "pending_admin" && (
                              <Clock className="size-2.5" />
                            )}
                            <span>
                              {effectiveStatus === "accepted"
                                ? sm.offerAcceptedTag
                                : effectiveStatus === "pending_admin"
                                  ? sm.offerPendingAdminTag
                                  : effectiveStatus === "rejected"
                                    ? sm.offerRejectedTag
                                    : sm.offerPendingTag}
                            </span>
                          </Link>
                        ) : isAutoPublished ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-[#105C50]">
                            <CheckCircle2 className="size-3" />
                            <span>
                              {sm.autoPublishedTag || "منشورة تلقائياً بحسابه"}
                            </span>
                          </span>
                        ) : isManuallyRecommended ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-extrabold text-blue-800">
                            <Check className="size-3" />
                            <span>{sm.recSentTag}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                            <span>
                              {sm.notAutoPublishedTag ||
                                "غير منشورة تلقائياً (<80%)"}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="mt-2.5 text-xs font-extrabold text-[#105C50]">
                      {tLeads.cashLabel}{" "}
                      <span dir="ltr">{uCash}</span> {leadCur}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-1">
                      {match.matches.map((mStr) => (
                        <span
                          key={mStr}
                          className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-[#105C50]"
                        >
                          ✓ {formatReasonForAdmin(mStr, locale)}
                        </span>
                      ))}
                      {match.differences.map((dStr) => (
                        <span
                          key={dStr}
                          className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800"
                        >
                          ⚠️ {formatReasonForAdmin(dStr, locale)}
                        </span>
                      ))}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-gray-100 pt-2.5">
                      {!isAutoPublished && !hasRealOffer && (
                        <button
                          type="button"
                          disabled={isPending || isManuallyRecommended}
                          onClick={() => handleSendSingle(unit.id)}
                          className={`inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-lg px-2 text-[11px] font-bold whitespace-nowrap text-white transition ${
                            isManuallyRecommended
                              ? "bg-emerald-600"
                              : "bg-[#0a1122] hover:bg-[#16223f]"
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

                      {(!unitLockedBySomeone || isOffDone) && (
                        <button
                          type="button"
                          disabled={isPending || isOffDone}
                          onClick={() => handleCreateOfferOnBehalf(unit)}
                          className={`inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-lg px-2 text-[11px] font-bold whitespace-nowrap text-white transition ${
                            isOffDone
                              ? "bg-purple-700"
                              : "bg-[#105C50] hover:bg-[#0c483f]"
                          }`}
                        >
                          {loadingKey === offKey ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : isOffDone ? (
                            <>
                              <Check className="size-3.5 shrink-0" />
                              <span>{sm.sentOfferDoneBtn}</span>
                            </>
                          ) : (
                            <>
                              <Wallet className="size-3.5 shrink-0" />
                              <span>{sm.createOfficialOfferBtn}</span>
                            </>
                          )}
                        </button>
                      )}

                      <Link
                        href={`/opportunities/${unit.id}`}
                        target="_blank"
                        className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-3 text-[11px] font-bold whitespace-nowrap text-[#105C50] hover:bg-gray-100"
                      >
                        <ExternalLink className="size-3.5 shrink-0" />
                        <span>{sm.viewUnitBtn}</span>
                      </Link>
                    </div>
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
