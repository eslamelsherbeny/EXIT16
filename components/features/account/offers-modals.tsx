'use client'

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Wallet,
  X,
} from 'lucide-react'
import { type OfferRecord } from '@/actions/offer-actions'
import {
  getUnitPricingGuardrails,
  type MatchableUnit,
} from '@/lib/smart-matcher'
import { toEnglishDigits } from '@/components/features/seller/seller-shared'
import {
  getUnifiedUnitCode,
  getUnifiedUnitHeadline,
} from '@/lib/unit-display-helpers'

export function getOfferRef(id: string) {
  const clean = String(id || '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
  return `OF-${clean.slice(0, 6) || '1001'}`
}

export function BuyerMakeOfferModal({
  dir,
  t,
  cur,
  offerModalUnit,
  setOfferModalUnit,
  offerMode,
  setOfferMode,
  customOfferCashStr,
  setCustomOfferCashStr,
  readiness,
  setReadiness,
  paymentMethod,
  setPaymentMethod,
  isPending,
  onSubmit,
}: {
  dir: 'rtl' | 'ltr'
  t: Record<string, any>
  cur: string
  offerModalUnit: MatchableUnit | null
  setOfferModalUnit: (u: MatchableUnit | null) => void
  offerMode: 'full' | 'negotiate'
  setOfferMode: (m: 'full' | 'negotiate') => void
  customOfferCashStr: string
  setCustomOfferCashStr: (v: string) => void
  readiness: '48h' | '1_week' | '2_weeks'
  setReadiness: (r: '48h' | '1_week' | '2_weeks') => void
  paymentMethod: 'bank_check' | 'bank_transfer'
  setPaymentMethod: (m: 'bank_check' | 'bank_transfer') => void
  isPending: boolean
  onSubmit: () => void
}) {
  if (!offerModalUnit) return null

  const guard = getUnitPricingGuardrails(offerModalUnit)
  const requiredPaid = Math.max(1, Number(guard.requiredCash) || 1)
  const sanityMinFloor = Math.round(requiredPaid * 0.5)
  const unitCode = getUnifiedUnitCode(
    offerModalUnit.id,
    (offerModalUnit as any).code
  )
  const unitTitle = getUnifiedUnitHeadline(offerModalUnit, t.unitFallback)

  const unitStatusClean = String(offerModalUnit.status || '')
    .trim()
    .toLowerCase()
  const isWaitlistMode = unitStatusClean === 'transferring'

  const typedAmount =
    Number(toEnglishDigits(customOfferCashStr).replace(/,/g, '')) || 0
  const isFullPrice = offerMode === 'full' && typedAmount === requiredPaid
  const isOverPaidError = typedAmount > requiredPaid
  const isSanityIncompleteError =
    offerMode === 'negotiate' &&
    typedAmount > 0 &&
    typedAmount < sanityMinFloor
  const isNegotiateEqualFullError =
    offerMode === 'negotiate' && typedAmount === requiredPaid

  const isSubmitDisabled =
    isPending ||
    typedAmount <= 0 ||
    isOverPaidError ||
    isSanityIncompleteError

  return (
    <div
      dir={dir}
      onClick={() => !isPending && setOfferModalUnit(null)}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a1122]/75 p-3 backdrop-blur-xs sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[90vh] w-full max-w-[470px] flex-col overflow-hidden rounded-[24px] border border-gray-200 bg-white text-start shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 bg-[#f8faf9] px-5 py-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10.5px] font-extrabold ${
                  isWaitlistMode
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-[#eaf8f2] text-[#007a5a]'
                }`}
              >
                {isWaitlistMode ? (
                  <>
                    <Clock className="size-3" />
                    <span>{t.waitlistBtnLabel}</span>
                  </>
                ) : (
                  <>
                    <Wallet className="size-3" />
                    <span>{t.modalMakeOfferTitle}</span>
                  </>
                )}
              </span>
              <span
                dir="ltr"
                className="rounded-md bg-[#0a1122] px-2 py-0.5 font-mono text-[10.5px] font-bold text-white"
              >
                {unitCode}
              </span>
            </div>
            <h3 className="mt-1 truncate text-sm font-black text-[#0a1122] sm:text-base">
              {unitTitle}
            </h3>
            <p className="mt-0.5 text-[11px] text-gray-500">
              {isWaitlistMode
                ? t.waitlistModalSubtitle
                : t.modalMakeOfferSubtitle}
            </p>
          </div>

          <button
            type="button"
            disabled={isPending}
            onClick={() => setOfferModalUnit(null)}
            aria-label={t.cancelBtn}
            className="flex size-8 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-100 hover:text-[#0a1122]"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-4 text-xs sm:p-5">
          <div className="rounded-2xl border border-gray-200/90 bg-gray-50/70 p-3.5 sm:p-4">
            <label className="mb-2.5 block text-xs font-extrabold text-[#0a1122]">
              1. {t.selectOfferTypeLabel || t.enterNegotiatedCashLabel}:
            </label>

            {guard.allowNegotiation ? (
              <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setOfferMode('full')
                    setCustomOfferCashStr(requiredPaid.toLocaleString('en-US'))
                  }}
                  className={`flex flex-col justify-between rounded-xl border p-3 text-start transition ${
                    offerMode === 'full'
                      ? 'border-2 border-[#007a5a] bg-[#eaf8f2] text-[#007a5a]'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="block text-[11px] leading-snug font-extrabold">
                    ✓ {t.fullPriceOptionTitle}
                  </span>
                  <strong
                    dir="ltr"
                    className="mt-1 block text-sm font-black tabular-nums"
                  >
                    {requiredPaid.toLocaleString('en-US')} {cur}
                  </strong>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOfferMode('negotiate')
                    if (typedAmount >= requiredPaid) {
                      setCustomOfferCashStr('')
                    }
                  }}
                  className={`flex flex-col justify-between rounded-xl border p-3 text-start transition ${
                    offerMode === 'negotiate'
                      ? 'border-2 border-amber-500 bg-amber-50 text-amber-950'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="block text-[11px] leading-snug font-extrabold">
                    💬 {t.negotiateOptionTitle}
                  </span>
                  <span className="mt-1 block text-[10.5px] font-semibold text-gray-600">
                    {t.negotiateOptionSubHint}
                  </span>
                </button>
              </div>
            ) : (
              <div className="mb-3 rounded-xl border border-emerald-200 bg-[#eaf8f2] p-3 text-[11px] font-bold text-[#007a5a]">
                {t.nonNegotiableUnitNote}
              </div>
            )}

            {guard.allowNegotiation && offerMode === 'negotiate' && (
              <label className="mb-1.5 block text-[11px] font-extrabold text-[#0a1122]">
                {t.maxNegotiableCashInputLabel} (
                <span dir="ltr">{requiredPaid.toLocaleString('en-US')}</span>{' '}
                {cur}):
              </label>
            )}

            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                dir="ltr"
                placeholder={
                  offerMode === 'negotiate'
                    ? `${Math.round(requiredPaid * 0.92).toLocaleString('en-US')}`
                    : ''
                }
                readOnly={!guard.allowNegotiation || offerMode === 'full'}
                value={customOfferCashStr}
                onChange={(e) => {
                  if (!guard.allowNegotiation) return
                  const digits = toEnglishDigits(e.target.value).replace(
                    /\D/g,
                    ''
                  )
                  const num = Number(digits) || 0
                  setCustomOfferCashStr(
                    digits ? num.toLocaleString('en-US') : ''
                  )
                }}
                className={`h-12 w-full rounded-xl border pr-4 pl-12 text-left text-base font-black text-[#0a1122] tabular-nums focus:outline-none ${
                  !guard.allowNegotiation || offerMode === 'full'
                    ? 'cursor-not-allowed border-gray-200 bg-gray-100'
                    : 'border-gray-300 bg-white focus:border-[#007a5a]'
                }`}
              />
              <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-xs font-extrabold text-gray-400">
                {cur}
              </span>
            </div>

            {isOverPaidError ? (
              <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-2.5 text-[11px] font-bold text-red-700">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <span>
                  {t.errOfferExceedsPaid} (
                  <strong dir="ltr">
                    {requiredPaid.toLocaleString('en-US')} {cur}
                  </strong>
                  )
                </span>
              </div>
            ) : isSanityIncompleteError ? (
              <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-2.5 text-[11px] font-bold text-red-700">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <span>{t.errOfferSanityIncomplete}</span>
              </div>
            ) : isFullPrice || isNegotiateEqualFullError ? (
              <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-[#eaf8f2] p-2.5 text-[11px] font-bold text-[#007a5a]">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>{t.fullPricePriorityHint}</span>
              </div>
            ) : (
              <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-[11px] leading-relaxed font-bold text-amber-900">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                <span>{t.fomoNegotiationWarning}</span>
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-xs font-extrabold text-[#0a1122]">
              2. {t.buyerReadinessLabel}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: '48h', label: t.readiness48h },
                  { id: '1_week', label: t.readiness1Week },
                  { id: '2_weeks', label: t.readiness2Weeks },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setReadiness(opt.id)}
                  className={`flex min-h-[44px] items-center justify-center rounded-xl border px-2 py-2 text-center text-[11px] leading-snug font-extrabold transition ${
                    readiness === opt.id
                      ? 'border-[#007a5a] bg-[#007a5a] text-white shadow-2xs'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-extrabold text-[#0a1122]">
              3. {t.paymentMethodLabel}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: 'bank_check', label: t.methodBankCheck },
                  { id: 'bank_transfer', label: t.methodBankTransfer },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id)}
                  className={`flex min-h-[44px] items-center justify-center rounded-xl border px-3 py-2 text-center text-[11px] leading-snug font-extrabold transition ${
                    paymentMethod === m.id
                      ? 'border-[#0a1122] bg-[#0a1122] text-white shadow-2xs'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 border-t border-gray-100 bg-gray-50/80 px-4 py-3.5 sm:px-5">
          <button
            type="button"
            disabled={isSubmitDisabled}
            onClick={onSubmit}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#007a5a] px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#006248] disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <span>
                {isWaitlistMode
                  ? t.confirmWaitlistOfferBtn
                  : t.confirmSendOfferBtn}
              </span>
            )}
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={() => setOfferModalUnit(null)}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-xs font-extrabold text-gray-700 transition hover:bg-gray-100"
          >
            {t.cancelBtn}
          </button>
        </div>
      </div>
    </div>
  )
}

export function SellerCounterOfferModal({
  dir,
  t,
  cur,
  counterModalOffer,
  setCounterModalOffer,
  counterCashStr,
  setCounterCashStr,
  isPending,
  onSubmit,
}: {
  dir: 'rtl' | 'ltr'
  t: Record<string, any>
  cur: string
  counterModalOffer: (OfferRecord & { unit?: MatchableUnit }) | null
  setCounterModalOffer: (
    o: (OfferRecord & { unit?: MatchableUnit }) | null
  ) => void
  counterCashStr: string
  setCounterCashStr: (v: string) => void
  isPending: boolean
  onSubmit: () => void
}) {
  if (!counterModalOffer) return null

  const offeredByBuyer = Number(counterModalOffer.offered_cash) || 0
  const maxPaid =
    Number(
      counterModalOffer.unit?.paid_amount || counterModalOffer.required_cash
    ) || offeredByBuyer
  const typedCounter =
    Number(toEnglishDigits(counterCashStr).replace(/,/g, '')) || 0
  const isInvalidCounter =
    typedCounter <= offeredByBuyer || typedCounter > maxPaid

  const unitCode = counterModalOffer.unit
    ? getUnifiedUnitCode(
        counterModalOffer.unit.id,
        (counterModalOffer.unit as any).code
      )
    : null

  return (
    <div
      dir={dir}
      onClick={() => !isPending && setCounterModalOffer(null)}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a1122]/75 p-4 backdrop-blur-xs"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[410px] overflow-hidden rounded-[24px] border border-gray-200 bg-white p-5 text-start shadow-2xl"
      >
        <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-black text-[#0a1122] sm:text-base">
              🔄 {t.sendCounterBtn}
            </h3>
            {unitCode && (
              <span
                dir="ltr"
                className="rounded-md bg-[#0a1122] px-2 py-0.5 font-mono text-[10.5px] font-bold text-white"
              >
                {unitCode}
              </span>
            )}
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={() => setCounterModalOffer(null)}
            aria-label={t.cancelBtn}
            className="flex size-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:text-[#0a1122]"
          >
            <X className="size-4" />
          </button>
        </div>

        <p className="mt-2.5 text-xs leading-relaxed text-gray-600">
          {t.counterModalDesc} (
          <strong dir="ltr">{offeredByBuyer.toLocaleString('en-US')}</strong> –{' '}
          <strong dir="ltr">{maxPaid.toLocaleString('en-US')}</strong> {cur}).
        </p>

        <div className="relative mt-4">
          <input
            type="text"
            inputMode="numeric"
            dir="ltr"
            value={counterCashStr}
            onChange={(e) => {
              const digits = toEnglishDigits(e.target.value).replace(/\D/g, '')
              setCounterCashStr(
                digits ? Number(digits).toLocaleString('en-US') : ''
              )
            }}
            className="h-12 w-full rounded-xl border border-gray-300 pr-4 pl-12 text-left text-base font-black text-[#0a1122] focus:border-[#007a5a] focus:outline-none"
          />
          <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-xs font-bold text-gray-400">
            {cur}
          </span>
        </div>

        {isInvalidCounter && typedCounter > 0 && (
          <p className="mt-2 text-[11px] font-bold text-red-600">
            {t.errInvalidCounterAmount}
          </p>
        )}

        <div className="mt-5 flex items-center gap-2">
          <button
            type="button"
            disabled={isPending || isInvalidCounter}
            onClick={onSubmit}
            className="inline-flex min-h-[42px] flex-1 items-center justify-center rounded-xl bg-[#007a5a] px-4 py-2 text-xs font-extrabold text-white transition hover:bg-[#006248] disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              t.sendCounterBtn
            )}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => setCounterModalOffer(null)}
            className="inline-flex min-h-[42px] items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
          >
            {t.cancelBtn}
          </button>
        </div>
      </div>
    </div>
  )
}