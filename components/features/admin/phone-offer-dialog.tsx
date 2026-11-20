"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  Check,
  Handshake,
  Loader2,
  Lock,
  PhoneCall,
  Search,
  Send,
  User,
  Building2,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { adminCreateOfficialOfferAction } from "@/actions/offer-actions"
import { getUnitPricingGuardrails } from "@/lib/smart-matcher"
import { getLocalizedGeorgiaAreaName } from "@/components/shared/georgia-areas"
import { toEnglishDigits } from "@/components/features/seller/seller-shared"
import { getCurrencySymbol, useTranslation } from "@/lib/i18n"

function deriveShortCode(id: string, dbCode?: string | null) {
  if (dbCode && String(dbCode).trim()) return String(dbCode).trim()
  const num = String(id || "")
    .replace(/\D/g, "")
    .slice(0, 5)
  return `U-${num.length >= 4 ? num : String(id || "").slice(0, 5).toUpperCase()}`
}

export function PhoneOfferDialog({
  open,
  onClose,
  leads,
  units,
  preselectedLeadId,
  preselectedUnitId,
  onSuccess,
}: {
  open: boolean
  onClose: () => void
  leads: any[]
  units: any[]
  preselectedLeadId?: string | null
  preselectedUnitId?: string | null
  onSuccess?: (info: { offerId?: string; isDirectDeal: boolean }) => void
}) {
  const router = useRouter()
  const { t: dict, locale, dir } = useTranslation()
  const d = ((dict?.admin as Record<string, any>)?.dealsPage || {}) as Record<
    string,
    string
  >
  const sm = ((dict?.admin as Record<string, any>)?.smartMatch ||
    {}) as Record<string, string>
  const cur = getCurrencySymbol("GE", locale)

  const [buyerQuery, setBuyerQuery] = useState("")
  const [unitQuery, setUnitQuery] = useState("")
  const [selectedLeadId, setSelectedLeadId] = useState<string>(
    preselectedLeadId || ""
  )
  const [selectedUnitId, setSelectedUnitId] = useState<string>(
    preselectedUnitId || ""
  )
  const [cashStr, setCashStr] = useState("")
  const [readiness, setReadiness] = useState<"48h" | "1_week" | "2_weeks">(
    "48h"
  )
  const [mode, setMode] = useState<"send_to_seller" | "direct_accept_deal">(
    "send_to_seller"
  )
  const [errorText, setErrorText] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const eligibleUnits = useMemo(
    () =>
      (units || []).filter((u) => {
        const st = String(u.status || "").trim().toLowerCase()
        return st === "active" || st === "approved" || st === "published" || st === "offer_received"
      }),
    [units]
  )

  const eligibleLeads = useMemo(
    () =>
      (leads || []).filter((l) => {
        const st = String(l.status || "new").trim().toLowerCase()
        return st !== "closed" && st !== "archived"
      }),
    [leads]
  )

  const resolvedLeadId = preselectedLeadId || selectedLeadId
  const resolvedUnitId = preselectedUnitId || selectedUnitId

  const selectedLead = eligibleLeads.find(
    (l) => String(l.id) === String(resolvedLeadId)
  )
  const selectedUnit = eligibleUnits.find(
    (u) => String(u.id) === String(resolvedUnitId)
  )

  const guardrails = selectedUnit
    ? getUnitPricingGuardrails(selectedUnit)
    : null

  const filteredLeads = useMemo(() => {
    const q = buyerQuery.trim().toLowerCase()
    if (!q) return eligibleLeads.slice(0, 12)
    return eligibleLeads
      .filter((l) =>
        `${l.name || ""} ${l.phone || ""} ${l.email || ""}`
          .toLowerCase()
          .includes(q)
      )
      .slice(0, 12)
  }, [eligibleLeads, buyerQuery])

  const filteredUnits = useMemo(() => {
    const q = unitQuery.trim().toLowerCase()
    if (!q) return eligibleUnits.slice(0, 12)
    return eligibleUnits
      .filter((u) => {
        const code = deriveShortCode(u.id, u.code).toLowerCase()
        return `${code} ${u.project_name || ""} ${u.area || ""} ${u.name || ""}`
          .toLowerCase()
          .includes(q)
      })
      .slice(0, 12)
  }, [eligibleUnits, unitQuery])

  const handleSelectUnit = (u: any) => {
    setSelectedUnitId(String(u.id))
    const g = getUnitPricingGuardrails(u)
    setCashStr(g.requiredCash.toLocaleString("en-US"))
    setErrorText(null)
  }

  const handleSubmit = () => {
    if (!selectedLead || !selectedUnit || !guardrails) return
    const parsedCash =
      Number(toEnglishDigits(cashStr).replace(/,/g, "")) ||
      guardrails.requiredCash

    if (
      !Number.isFinite(parsedCash) ||
      parsedCash <= 0 ||
      parsedCash > guardrails.requiredCash
    ) {
      setErrorText(d.invalidOfferAmountErr || sm.invalidCustomPriceErr)
      return
    }

    setErrorText(null)
    startTransition(async () => {
      const res = await adminCreateOfficialOfferAction({
        propertyId: String(selectedUnit.id),
        leadId: String(selectedLead.id),
        offeredCash: guardrails.allowNegotiation
          ? parsedCash
          : guardrails.requiredCash,
        paymentReadiness: readiness,
        mode,
      })

      if (!res.success) {
        setErrorText(res.error || d.actionErrorFallback)
        return
      }

      onSuccess?.({
        offerId: res.offerId,
        isDirectDeal: Boolean(res.isDirectDeal),
      })
      onClose()
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        dir={dir}
        className="max-h-[90vh] w-[95vw] max-w-[600px] overflow-y-auto rounded-2xl p-5 text-start"
      >
        <DialogHeader className="border-b border-slate-100 pb-3 pr-9 text-start">
          <DialogTitle className="flex items-center gap-2 text-base font-black text-[#0f1d40]">
            <PhoneCall className="size-4.5 text-[#007a5a]" />
            <span>{d.phoneModalTitle}</span>
          </DialogTitle>
          <DialogDescription className="text-start text-xs text-slate-500">
            {d.phoneModalSubtitle}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-3 space-y-4 text-xs">
          {/* 1. اختيار المشتري */}
          {!preselectedLeadId && (
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 font-extrabold text-[#0f1d40]">
                <User className="size-3.5 text-[#007a5a]" />
                <span>{d.selectBuyerLabel}</span>
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 end-3 size-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={buyerQuery}
                  onChange={(e) => setBuyerQuery(e.target.value)}
                  placeholder={d.searchBuyerPlaceholder}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 ps-3 pe-9 text-xs font-semibold focus:border-[#007a5a] focus:bg-white focus:outline-none"
                />
              </div>
              <div className="max-h-36 space-y-1.5 overflow-y-auto rounded-xl border border-slate-200/80 bg-slate-50/50 p-2">
                {filteredLeads.length === 0 ? (
                  <p className="py-3 text-center text-slate-400">
                    {d.noBuyersMatch}
                  </p>
                ) : (
                  filteredLeads.map((l) => {
                    const isPicked = String(l.id) === String(resolvedLeadId)
                    return (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => {
                          setSelectedLeadId(String(l.id))
                          setErrorText(null)
                        }}
                        className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-start transition ${
                          isPicked
                            ? "border-[#007a5a] bg-[#eaf8f2] text-[#0f1d40]"
                            : "border-transparent bg-white hover:border-slate-200"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="truncate font-extrabold">{l.name}</p>
                          <p
                            dir="ltr"
                            className="font-mono text-[10.5px] text-slate-500"
                          >
                            {l.phone}
                          </p>
                        </div>
                        <span
                          dir="ltr"
                          className="shrink-0 font-black text-[#007a5a] tabular-nums"
                        >
                          {cur}
                          {Number(
                            l.available_cash || l.budget || 0
                          ).toLocaleString("en-US")}
                        </span>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {/* 2. اختيار الوحدة من جميع الوحدات المتاحة */}
          {!preselectedUnitId && (
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 font-extrabold text-[#0f1d40]">
                <Building2 className="size-3.5 text-[#007a5a]" />
                <span>{d.selectUnitLabel}</span>
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 end-3 size-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={unitQuery}
                  onChange={(e) => setUnitQuery(e.target.value)}
                  placeholder={d.searchUnitPlaceholder}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 ps-3 pe-9 text-xs font-semibold focus:border-[#007a5a] focus:bg-white focus:outline-none"
                />
              </div>
              <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-xl border border-slate-200/80 bg-slate-50/50 p-2">
                {filteredUnits.length === 0 ? (
                  <p className="py-3 text-center text-slate-400">
                    {d.noUnitsMatch}
                  </p>
                ) : (
                  filteredUnits.map((u) => {
                    const isPicked = String(u.id) === String(resolvedUnitId)
                    const code = deriveShortCode(u.id, u.code)
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleSelectUnit(u)}
                        className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-start transition ${
                          isPicked
                            ? "border-[#007a5a] bg-[#eaf8f2] text-[#0f1d40]"
                            : "border-transparent bg-white hover:border-slate-200"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="rounded bg-[#0f1d40] px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
                              {code}
                            </span>
                            <span className="truncate font-extrabold">
                              {u.project_name || d.unitFallback}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-[10.5px] text-slate-500">
                            {getLocalizedGeorgiaAreaName(u.area, locale)} ·{" "}
                            {u.name}
                          </p>
                        </div>
                        <span
                          dir="ltr"
                          className="shrink-0 font-black text-[#007a5a] tabular-nums"
                        >
                          {cur}
                          {Number(u.paid_amount || 0).toLocaleString("en-US")}
                        </span>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {/* 3. تفاصيل السعر وطريقة التنفيذ */}
          {selectedLead && selectedUnit && guardrails && (
            <div className="space-y-3 rounded-xl border border-emerald-200 bg-[#eaf8f2]/50 p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-extrabold text-[#0f1d40]">
                  {d.offeredCashHeader} ({cur}):
                </span>
                {guardrails.allowNegotiation ? (
                  <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10.5px] font-extrabold text-amber-900">
                    🔒 {d.secretSellerMinLabel}:{" "}
                    <strong dir="ltr">
                      {cur}
                      {guardrails.minAllowedOfferCash.toLocaleString("en-US")}
                    </strong>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10.5px] font-bold text-slate-600">
                    <Lock className="size-3" />
                    <span>{sm.fixedPriceUnitBadge}</span>
                  </span>
                )}
              </div>

              <input
                type="text"
                dir="ltr"
                readOnly={!guardrails.allowNegotiation}
                value={
                  guardrails.allowNegotiation
                    ? cashStr || guardrails.requiredCash.toLocaleString("en-US")
                    : guardrails.requiredCash.toLocaleString("en-US")
                }
                onChange={(e) => {
                  const digits = toEnglishDigits(e.target.value).replace(
                    /\D/g,
                    ""
                  )
                  setCashStr(
                    digits ? Number(digits).toLocaleString("en-US") : ""
                  )
                }}
                className={`h-10 w-full rounded-xl border px-3 text-sm font-black text-[#0f1d40] focus:outline-none ${
                  guardrails.allowNegotiation
                    ? "border-emerald-400 bg-white"
                    : "cursor-not-allowed border-slate-200 bg-slate-100"
                }`}
              />

              {/* جاهزية السداد */}
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    ["48h", d.readiness48h],
                    ["1_week", d.readiness1Week],
                    ["2_weeks", d.readiness2Weeks],
                  ] as const
                ).map(([k, lbl]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setReadiness(k)}
                    className={`rounded-lg border px-2 py-1.5 text-[11px] font-extrabold transition ${
                      readiness === k
                        ? "border-[#007a5a] bg-[#007a5a] text-white"
                        : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>

              {/* الخيارين: إرسال للمالك vs موافقة هاتفية وبدء الصفقة فوراً */}
              <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setMode("send_to_seller")}
                  className={`flex items-center gap-2 rounded-xl border-2 p-2.5 text-start transition ${
                    mode === "send_to_seller"
                      ? "border-[#0f1d40] bg-[#0f1d40] text-white"
                      : "border-slate-200 bg-white text-[#0f1d40]"
                  }`}
                >
                  <Send className="size-4 shrink-0" />
                  <span className="text-[11px] font-extrabold">
                    {d.offerModeSendLabel}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode("direct_accept_deal")}
                  className={`flex items-center gap-2 rounded-xl border-2 p-2.5 text-start transition ${
                    mode === "direct_accept_deal"
                      ? "border-[#007a5a] bg-[#007a5a] text-white"
                      : "border-emerald-200 bg-white text-[#007a5a]"
                  }`}
                >
                  <Handshake className="size-4 shrink-0" />
                  <span className="text-[11px] font-extrabold">
                    {d.offerModeDirectLabel}
                  </span>
                </button>
              </div>

              {mode === "direct_accept_deal" && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[11px] font-bold text-amber-900">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                  <span>{d.offerModeDirectWarn}</span>
                </div>
              )}

              {errorText && (
                <p className="rounded-lg bg-red-50 p-2 text-xs font-bold text-red-600">
                  {errorText}
                </p>
              )}

              <button
                type="button"
                disabled={isPending}
                onClick={handleSubmit}
                className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl text-xs font-extrabold text-white shadow-xs transition disabled:opacity-50 ${
                  mode === "direct_accept_deal"
                    ? "bg-[#007a5a] hover:bg-[#006248]"
                    : "bg-[#0f1d40] hover:bg-[#1e293b]"
                }`}
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Check className="size-4" />
                )}
                <span>
                  {mode === "direct_accept_deal"
                    ? d.submitDirectDealBtn
                    : d.submitPhoneOfferBtn}
                </span>
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}