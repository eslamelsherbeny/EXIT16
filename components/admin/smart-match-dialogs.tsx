"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Check,
  ExternalLink,
  Loader2,
  MessageCircle,
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
} from "@/app/actions/offer-actions"

function deriveShortUnitCode(id: string) {
  const digits = id.replace(/\D/g, "")
  const num = digits ? Number(digits.slice(-4)) : 100
  return `U-${String(num).padStart(5, "0")}`
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
  const leadsPrompts = dict.admin?.leads || {}
  const propTable = dict.admin?.propertiesAdmin?.table || {}

  const [loadingKey, setLoadingKey] = useState<string | null>(null)
  const [doneKeys, setDoneKeys] = useState<Record<string, boolean>>({})
  const [isPending, startTransition] = useTransition()

  if (!unit) return null

  const unitCur = getCurrencySymbol(
    unit.country_code || unit.country || "EG",
    locale
  )

  const matchedList = (buyers || [])
    .filter((b) => !b.user_id || b.user_id !== unit.user_id)
    .map((buyer) => {
      const existingOffer = offers.find(
        (o) =>
          o.property_id === unit.id &&
          (o.lead_id === buyer.id ||
            (buyer.user_id && o.buyer_user_id === buyer.user_id))
      )
      return {
        buyer,
        match: calculateSmartMatch(unit, buyer, undefined, locale),
        existingOffer,
      }
    })
    .filter((item) => item.match.score >= 60)
    .sort((a, b) => b.match.score - a.match.score)

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
        }
      } finally {
        setLoadingKey(null)
      }
    })
  }

  function handleCreateOffer(buyer: MatchableBuyer) {
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
        className="max-h-[85vh] w-[94vw] max-w-[520px] overflow-y-auto rounded-2xl p-4 text-start sm:p-5"
      >
        <DialogHeader className="border-b border-gray-100 pb-3 text-start">
          <div className="flex flex-wrap items-center justify-between gap-2 pe-6">
            <DialogTitle className="text-xs font-black text-[#0a1122] sm:text-sm">
              🎯 {sm.unitMatchedBuyersTitle}:{" "}
              <span className="text-[#105C50]">
                {unit.project_name || propTable.unspecifiedProject}
              </span>
            </DialogTitle>

            {matchedList.length > 0 && (
              <button
                type="button"
                disabled={isPending || isBulkDone}
                onClick={handleSendBulk}
                className={`inline-flex h-7 items-center gap-1 rounded-lg px-2.5 text-[11px] font-bold text-white transition ${
                  isBulkDone
                    ? "bg-emerald-600"
                    : "bg-[#105C50] hover:bg-[#0c483f]"
                }`}
              >
                {loadingKey === bulkKey ? (
                  <>
                    <Loader2 className="size-3 animate-spin" />
                    <span>{sm.sendingNow}</span>
                  </>
                ) : isBulkDone ? (
                  <>
                    <Check className="size-3" />
                    <span>{sm.sentAllDoneBtn}</span>
                  </>
                ) : (
                  <>
                    <Send className="size-3" />
                    <span>
                      {sm.sendAllRecsBtn} ({matchedList.length})
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
          <DialogDescription className="mt-1 text-start text-[11px] text-gray-500">
            {propTable.colCash}:{" "}
            <strong dir="ltr" className="text-[#105C50]">
              {Number(unit.paid_amount || 0).toLocaleString("en-US")} {unitCur}
            </strong>{" "}
            · {unit.area || "—"} · {deriveShortUnitCode(unit.id)}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2.5 space-y-2.5">
          {matchedList.length === 0 ? (
            <p className="py-6 text-center text-xs text-gray-400">
              {sm.noMatchesFound}
            </p>
          ) : (
            matchedList.map(({ buyer, match, existingOffer }) => {
              const bCash = Number(
                buyer.available_cash || buyer.budget || 0
              ).toLocaleString("en-US")
              const bWa = `${leadsPrompts.waUnitLeadPrefix} ${buyer.name || ""}، ${leadsPrompts.waUnitLeadMiddle} (${unit.project_name || ""} - ${unit.area || ""}) — ${match.score}%`

              const recKey = `rec_${unit.id}_${buyer.id}`
              const offKey = `off_${unit.id}_${buyer.id}`
              const isRecDone =
                Boolean(doneKeys[recKey]) ||
                isBulkDone ||
                Boolean(existingOffer)
              const isOffDone =
                Boolean(doneKeys[offKey]) ||
                (existingOffer && existingOffer.status !== "recommended")

              return (
                <div
                  key={buyer.id}
                  className="rounded-xl border border-gray-200/90 bg-white p-3 text-xs shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate font-extrabold text-[#0a1122]">
                        {buyer.name}
                      </span>
                      <span
                        dir="ltr"
                        className="font-mono text-[10.5px] text-gray-500"
                      >
                        {buyer.phone}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      {existingOffer && (
                        <span
                          className={`rounded-md px-2 py-0.5 text-[9.5px] font-extrabold ${
                            existingOffer.status === "accepted"
                              ? "bg-emerald-600 text-white"
                              : existingOffer.status === "rejected"
                                ? "bg-red-100 text-red-700"
                                : existingOffer.status === "pending_seller"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {existingOffer.status === "accepted"
                            ? sm.offerAcceptedTag
                            : existingOffer.status === "rejected"
                              ? sm.offerRejectedTag
                              : existingOffer.status === "pending_seller"
                                ? sm.offerPendingTag
                                : sm.recSentTag}
                        </span>
                      )}
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10.5px] font-black ${
                          match.score >= 85
                            ? "bg-[#105C50] text-white"
                            : "bg-emerald-50 text-[#105C50]"
                        }`}
                      >
                        🎯 {match.score}%
                      </span>
                    </div>
                  </div>

                  <p className="mt-1 text-[11px] font-bold text-[#105C50]">
                    {leadsPrompts.cashShort} <span dir="ltr">{bCash}</span>{" "}
                    {unitCur}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-1">
                    {match.matches.map((mStr) => (
                      <span
                        key={mStr}
                        className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-[#105C50]"
                      >
                        ✓ {mStr}
                      </span>
                    ))}
                    {match.differences.map((dStr) => (
                      <span
                        key={dStr}
                        className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800"
                      >
                        ⚠️ {dStr}
                      </span>
                    ))}
                  </div>

                  <div className="mt-2.5 flex items-center gap-1.5 border-t border-gray-100 pt-2">
                    <button
                      type="button"
                      disabled={isPending || isRecDone}
                      onClick={() => handleSendSingle(buyer.id)}
                      className={`inline-flex h-7 flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-lg px-2 text-[10.5px] font-bold text-white transition ${
                        isRecDone
                          ? "bg-emerald-600"
                          : "bg-[#0a1122] hover:bg-[#16223f]"
                      }`}
                    >
                      {loadingKey === recKey ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : isRecDone ? (
                        <>
                          <Check className="size-3 shrink-0" />
                          <span>{sm.sentRecDoneBtn}</span>
                        </>
                      ) : (
                        <>
                          <Send className="size-3 shrink-0" />
                          <span>{sm.sendRecToBuyerBtn}</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={isPending || isOffDone}
                      onClick={() => handleCreateOffer(buyer)}
                      className={`inline-flex h-7 flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-lg px-2 text-[10.5px] font-bold text-white transition ${
                        isOffDone
                          ? "bg-purple-700"
                          : "bg-[#105C50] hover:bg-[#0c483f]"
                      }`}
                    >
                      {loadingKey === offKey ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : isOffDone ? (
                        <>
                          <Check className="size-3 shrink-0" />
                          <span>{sm.sentOfferDoneBtn}</span>
                        </>
                      ) : (
                        <>
                          <Wallet className="size-3 shrink-0" />
                          <span>{sm.createOfficialOfferBtn}</span>
                        </>
                      )}
                    </button>

                    <a
                      data-admin-client-wa="true"
                      href={`https://wa.me/${String(buyer.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(bWa)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-7 shrink-0 items-center justify-center gap-1 rounded-lg bg-[#25D366] px-2.5 text-[10.5px] font-bold text-white hover:opacity-90"
                    >
                      <MessageCircle className="size-3" />
                      <span>{leadsPrompts.whatsappBtn}</span>
                    </a>
                  </div>
                </div>
              )
            })
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
  const tLeads = dict.admin?.leadsAdmin || {}

  const [loadingKey, setLoadingKey] = useState<string | null>(null)
  const [doneKeys, setDoneKeys] = useState<Record<string, boolean>>({})
  const [isPending, startTransition] = useTransition()

  if (!lead) return null

  const leadCur = getCurrencySymbol(lead.country_code || "EG", locale)

  const matchedUnitsList = (units || [])
    .filter(
      (u) => u.status === "active" && (!u.user_id || u.user_id !== lead.user_id)
    )
    .map((unit) => {
      const existingOffer = offers.find(
        (o) =>
          o.property_id === unit.id &&
          (o.lead_id === lead.id ||
            (lead.user_id && o.buyer_user_id === lead.user_id))
      )
      return {
        unit,
        match: calculateSmartMatch(unit, lead, undefined, locale),
        existingOffer,
      }
    })
    .filter((item) => item.match.score >= 60)
    .sort((a, b) => b.match.score - a.match.score)

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
        }
      } finally {
        setLoadingKey(null)
      }
    })
  }

  function handleSendAll() {
    if (!lead) return
    setLoadingKey(bulkKey)
    startTransition(async () => {
      try {
        for (const item of matchedUnitsList) {
          await adminSendRecommendationAction({
            propertyId: item.unit.id,
            leadId: lead.id,
          })
        }
        setDoneKeys((prev) => ({ ...prev, [bulkKey]: true }))
        onNotice?.({
          text: `${sm.recSentSuccess} (${matchedUnitsList.length})`,
        })
        router.refresh()
      } finally {
        setLoadingKey(null)
      }
    })
  }

  function handleCreateOffer(unit: MatchableUnit) {
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
        className="max-h-[85vh] w-[94vw] max-w-[520px] overflow-y-auto rounded-2xl p-4 text-start sm:p-5"
      >
        <DialogHeader className="border-b border-gray-100 pb-3 text-start">
          <div className="flex flex-wrap items-center justify-between gap-2 pe-6">
            <DialogTitle className="text-xs font-black text-[#0a1122] sm:text-sm">
              🎯 {sm.buyerMatchedUnitsTitle}:{" "}
              <span className="text-[#105C50]">{lead.name}</span>
            </DialogTitle>

            {matchedUnitsList.length > 0 && (
              <button
                type="button"
                disabled={isPending || isBulkDone}
                onClick={handleSendAll}
                className={`inline-flex h-7 items-center gap-1 rounded-lg px-2.5 text-[11px] font-bold text-white transition ${
                  isBulkDone
                    ? "bg-emerald-600"
                    : "bg-[#105C50] hover:bg-[#0c483f]"
                }`}
              >
                {loadingKey === bulkKey ? (
                  <>
                    <Loader2 className="size-3 animate-spin" />
                    <span>{sm.sendingNow}</span>
                  </>
                ) : isBulkDone ? (
                  <>
                    <Check className="size-3" />
                    <span>{sm.sentAllDoneBtn}</span>
                  </>
                ) : (
                  <>
                    <Send className="size-3" />
                    <span>
                      {sm.sendAllRecsBtn} ({matchedUnitsList.length})
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

        <div className="mt-2.5 space-y-2.5">
          {matchedUnitsList.length === 0 ? (
            <p className="py-6 text-center text-xs text-gray-400">
              {sm.noMatchesFound}
            </p>
          ) : (
            matchedUnitsList.map(({ unit, match, existingOffer }) => {
              const uCash = Number(unit.paid_amount || 0).toLocaleString(
                "en-US"
              )
              const recKey = `rec_${unit.id}_${lead.id}`
              const offKey = `off_${unit.id}_${lead.id}`
              const isRecDone =
                Boolean(doneKeys[recKey]) ||
                isBulkDone ||
                Boolean(existingOffer)
              const isOffDone =
                Boolean(doneKeys[offKey]) ||
                (existingOffer && existingOffer.status !== "recommended")

              return (
                <div
                  key={unit.id}
                  className="rounded-xl border border-gray-200/90 bg-white p-3 text-xs shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span className="truncate font-extrabold text-[#0a1122]">
                        {unit.project_name || "—"} ({unit.area || "—"})
                      </span>
                      <span className="font-mono text-[10px] text-gray-400">
                        {deriveShortUnitCode(unit.id)}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      {existingOffer && (
                        <span
                          className={`rounded-md px-2 py-0.5 text-[9.5px] font-extrabold ${
                            existingOffer.status === "accepted"
                              ? "bg-emerald-600 text-white"
                              : existingOffer.status === "rejected"
                                ? "bg-red-100 text-red-700"
                                : existingOffer.status === "pending_seller"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {existingOffer.status === "accepted"
                            ? sm.offerAcceptedTag
                            : existingOffer.status === "rejected"
                              ? sm.offerRejectedTag
                              : existingOffer.status === "pending_seller"
                                ? sm.offerPendingTag
                                : sm.recSentTag}
                        </span>
                      )}
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10.5px] font-black ${
                          match.score >= 85
                            ? "bg-[#105C50] text-white"
                            : "bg-emerald-50 text-[#105C50]"
                        }`}
                      >
                        🎯 {match.score}%
                      </span>
                    </div>
                  </div>

                  <p className="mt-1 text-[11px] font-bold text-[#105C50]">
                    {tLeads.cashLabel} <span dir="ltr">{uCash}</span> {leadCur}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-1">
                    {match.matches.map((mStr) => (
                      <span
                        key={mStr}
                        className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-[#105C50]"
                      >
                        ✓ {mStr}
                      </span>
                    ))}
                    {match.differences.map((dStr) => (
                      <span
                        key={dStr}
                        className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800"
                      >
                        ⚠️ {dStr}
                      </span>
                    ))}
                  </div>

                  <div className="mt-2.5 flex items-center gap-1.5 border-t border-gray-100 pt-2">
                    <button
                      type="button"
                      disabled={isPending || isRecDone}
                      onClick={() => handleSendSingle(unit.id)}
                      className={`inline-flex h-7 flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-lg px-2 text-[10.5px] font-bold text-white transition ${
                        isRecDone
                          ? "bg-emerald-600"
                          : "bg-[#0a1122] hover:bg-[#16223f]"
                      }`}
                    >
                      {loadingKey === recKey ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : isRecDone ? (
                        <>
                          <Check className="size-3 shrink-0" />
                          <span>{sm.sentRecDoneBtn}</span>
                        </>
                      ) : (
                        <>
                          <Send className="size-3 shrink-0" />
                          <span>{sm.sendRecToBuyerBtn}</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={isPending || isOffDone}
                      onClick={() => handleCreateOffer(unit)}
                      className={`inline-flex h-7 flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-lg px-2 text-[10.5px] font-bold text-white transition ${
                        isOffDone
                          ? "bg-purple-700"
                          : "bg-[#105C50] hover:bg-[#0c483f]"
                      }`}
                    >
                      {loadingKey === offKey ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : isOffDone ? (
                        <>
                          <Check className="size-3 shrink-0" />
                          <span>{sm.sentOfferDoneBtn}</span>
                        </>
                      ) : (
                        <>
                          <Wallet className="size-3 shrink-0" />
                          <span>{sm.createOfficialOfferBtn}</span>
                        </>
                      )}
                    </button>

                    <Link
                      href={`/opportunities/${unit.id}`}
                      target="_blank"
                      className="inline-flex h-7 shrink-0 items-center justify-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2 text-[10.5px] font-bold text-[#105C50] hover:bg-gray-100"
                    >
                      <ExternalLink className="size-3" />
                      <span>{sm.viewUnitBtn}</span>
                    </Link>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}