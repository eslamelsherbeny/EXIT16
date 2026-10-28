'use client'

import {
  Building2,
  Check,
  Flame,
  Handshake,
  Lock,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { type OfferRecord } from '@/actions/offer-actions'
import { type MatchableUnit } from '@/lib/smart-matcher'
import { getLocalizedGeorgiaAreaName } from '@/components/shared/georgia-areas'
import { type LocaleCode } from '@/lib/i18n'
import { getOfferRef } from './offers-modals'

export function SellerOffersSection({
  t,
  locale,
  cur,
  sells,
  sellerOffers,
  displayedSellerOffers,
  selectedSellerUnitId,
  setSelectedSellerUnitId,
  acceptedPropertyIds,
  isPending,
  getReadinessLabel,
  getPaymentMethodLabel,
  onSellerDecision,
  onOpenCounterModal,
}: {
  t: Record<string, any>
  locale: LocaleCode
  cur: string
  sells: MatchableUnit[]
  sellerOffers: Array<OfferRecord & { unit?: MatchableUnit }>
  displayedSellerOffers: Array<OfferRecord & { unit?: MatchableUnit }>
  selectedSellerUnitId: string
  setSelectedSellerUnitId: (id: string) => void
  acceptedPropertyIds: Set<string>
  isPending: boolean
  getReadinessLabel: (r: string) => string
  getPaymentMethodLabel: (m: string) => string
  onSellerDecision: (
    offer: OfferRecord & { unit?: MatchableUnit },
    decision: 'accept' | 'reject'
  ) => void
  onOpenCounterModal: (
    offer: OfferRecord & { unit?: MatchableUnit },
    defaultMidCash: string
  ) => void
}) {
  return (
    <div>
      <header className="mb-6 text-start">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-3 py-1 text-[11px] font-extrabold text-[#007a5a]">
          <ShieldCheck className="size-3.5" />
          <span>{t.zeroLeakageBadge}</span>
        </span>
        <h1 className="mt-2 text-xl font-black text-[#0a1122] sm:text-3xl">
          {t.sellerTitle} ({displayedSellerOffers.length})
        </h1>
        <p className="mt-1.5 text-xs leading-relaxed text-gray-500 sm:text-sm">
          {t.sellerSubtitle}
        </p>

        {sells.length > 1 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedSellerUnitId('ALL')}
              className={`rounded-xl border px-3.5 py-1.5 text-xs font-extrabold transition ${
                selectedSellerUnitId === 'ALL'
                  ? 'border-[#007a5a] bg-[#007a5a] text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t.allMyUnitsTab} ({sellerOffers.length})
            </button>
            {sells.map((u) => {
              const count = sellerOffers.filter(
                (o) => String(o.property_id) === String(u.id)
              ).length
              const active = String(selectedSellerUnitId) === String(u.id)
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setSelectedSellerUnitId(String(u.id))}
                  className={`rounded-xl border px-3.5 py-1.5 text-xs font-extrabold transition ${
                    active
                      ? 'border-[#007a5a] bg-[#007a5a] text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {u.project_name || t.unitFallback} ({count})
                </button>
              )
            })}
          </div>
        )}
      </header>

      {displayedSellerOffers.length === 0 ? (
        <div className="rounded-3xl border border-gray-200/90 bg-white p-10 text-center shadow-2xs">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-[#007a5a]">
            <Sparkles className="size-6" />
          </div>
          <p className="text-base font-extrabold text-[#0a1122]">
            {t.sellerEmpty}
          </p>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-gray-500">
            {t.sellerDisclaimer}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedSellerOffers.map((offer) => {
            const u = offer.unit
            const paid = Number(u?.paid_amount || offer.required_cash) || 1
            const contract = Number(u?.contract_price) || paid
            const recoveryPct = Math.min(
              100,
              Math.round((Number(offer.offered_cash) / paid) * 100)
            )
            const cancelPenalty = Math.round(contract * 0.125)
            const sellerDiscount = Math.max(
              0,
              paid - Number(offer.offered_cash)
            )
            const netSavedVsCancel = Math.max(0, cancelPenalty - sellerDiscount)
            const unitAlreadyHasAcceptedOffer =
              acceptedPropertyIds.has(String(offer.property_id)) &&
              offer.status !== 'accepted'

            return (
              <div
                key={offer.id}
                className={`rounded-[22px] border bg-white p-4 text-start shadow-xs sm:p-6 ${
                  offer.status === 'accepted'
                    ? 'border-2 border-[#007a5a] bg-emerald-50/20'
                    : 'border-gray-200/90'
                }`}
              >
                <div className="flex flex-col gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-[#0a1122] px-2.5 py-1 text-[11px] font-extrabold text-white">
                        <Building2 className="size-3.5 shrink-0 text-emerald-400" />
                        <span>{u?.project_name || t.unitFallback}</span>
                      </span>
                      <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-[11px] font-extrabold text-[#007a5a]">
                        🎯 {t.matchScoreLabel}: {offer.match_score}%
                      </span>
                      <span className="font-mono text-[11px] font-bold text-gray-400">
                        #{getOfferRef(offer.id)}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-gray-500">
                      {getLocalizedGeorgiaAreaName(u?.area, locale)} ·{' '}
                      {u?.unit_type || '—'}
                    </p>
                  </div>

                  <div className="shrink-0">
                    {offer.status === 'accepted' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#007a5a] px-3.5 py-1.5 text-xs font-extrabold text-white shadow-2xs">
                        <Handshake className="size-3.5" />
                        <span>{t.statusAcceptedBadge}</span>
                      </span>
                    )}
                    {offer.status === 'pending_seller' &&
                      !unitAlreadyHasAcceptedOffer && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3.5 py-1.5 text-xs font-extrabold text-amber-900">
                          <Flame className="size-3.5 fill-amber-500 text-amber-600" />
                          <span>{t.statusPendingSellerBadge}</span>
                        </span>
                      )}
                    {(offer.status === 'unit_locked' ||
                      unitAlreadyHasAcceptedOffer) && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-extrabold text-slate-700">
                        <Lock className="size-3.5" />
                        <span>{t.backupOfferBadge}</span>
                      </span>
                    )}
                    {offer.status === 'counter_offered' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3.5 py-1.5 text-xs font-extrabold text-purple-900">
                        <RefreshCw className="size-3.5" />
                        <span>{t.statusCounterSentBadge}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-emerald-200 bg-[#eaf8f2] p-4">
                    <span className="block text-[11px] font-bold text-[#007a5a]">
                      {t.offeredCashLabel}
                    </span>
                    <strong className="mt-1 block text-xl font-black text-[#007a5a] tabular-nums sm:text-2xl">
                      <span dir="ltr">
                        {Number(offer.offered_cash).toLocaleString('en-US')}
                      </span>{' '}
                      {cur}
                    </strong>
                    <span className="mt-1 inline-block rounded-md bg-white/90 px-2 py-0.5 text-[10.5px] font-extrabold text-[#0a1122]">
                      {t.recoveryRatePrefix} {recoveryPct}%
                    </span>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <span className="block text-[11px] text-gray-400">
                      {t.buyerReadinessLabel}
                    </span>
                    <strong className="mt-1.5 block text-xs font-extrabold text-[#0a1122] sm:text-sm">
                      ⚡ {getReadinessLabel(offer.payment_readiness)}
                    </strong>
                    <span className="mt-1.5 block text-[11px] font-semibold text-gray-500">
                      {getPaymentMethodLabel(offer.payment_method)}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4">
                    <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-sky-900">
                      <TrendingUp className="size-3.5 text-sky-700" />
                      <span>{t.aiAdvisorTitle}</span>
                    </div>
                    <p className="mt-1.5 text-[11.5px] leading-relaxed font-semibold text-sky-950">
                      {t.aiAdvisorSavedPrefix}{' '}
                      <strong dir="ltr" className="font-black text-[#007a5a]">
                        {netSavedVsCancel.toLocaleString('en-US')} {cur}
                      </strong>{' '}
                      {t.aiAdvisorSavedSuffix}
                    </p>
                  </div>
                </div>

                {offer.match_reasons.length > 0 && (
                  <div className="mt-3.5 flex flex-wrap gap-1.5">
                    {offer.match_reasons.map((reason: string) => (
                      <span
                        key={reason}
                        className="rounded-lg bg-[#eaf8f2] px-2.5 py-1 text-[10.5px] font-bold text-[#007a5a]"
                      >
                        ✓ {reason}
                      </span>
                    ))}
                  </div>
                )}

                {offer.status === 'counter_offered' && offer.counter_cash && (
                  <div className="mt-4 rounded-xl border border-purple-200 bg-purple-50/80 px-4 py-3 text-xs font-bold text-purple-900">
                    {t.yourCounterOfferText}:{' '}
                    <strong dir="ltr">
                      {Number(offer.counter_cash).toLocaleString('en-US')}
                    </strong>{' '}
                    {cur} — {t.waitingBuyerResponseText}
                  </div>
                )}

                {offer.status === 'accepted' && (
                  <div className="mt-4 rounded-xl border border-[#007a5a]/30 bg-[#eaf8f2] p-4 text-xs font-bold text-[#007a5a]">
                    🎉 {t.dealLockedBannerForSeller}
                  </div>
                )}

                {(offer.status === 'unit_locked' ||
                  unitAlreadyHasAcceptedOffer) && (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs font-semibold text-slate-600">
                    {t.backupOfferSellerNote}
                  </div>
                )}

                {offer.status === 'pending_seller' &&
                  !unitAlreadyHasAcceptedOffer && (
                    <div className="mt-5 flex flex-col gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:flex-wrap sm:items-center">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => onSellerDecision(offer, 'accept')}
                        className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#007a5a] px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#006248] disabled:opacity-50 sm:text-sm"
                      >
                        <Check className="size-4 shrink-0" />
                        <span>{t.acceptOfferBtn}</span>
                      </button>

                      {Number(offer.offered_cash) < paid && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => {
                            const mid = Math.round(
                              (Number(offer.offered_cash) + paid) / 2
                            )
                            onOpenCounterModal(
                              offer,
                              mid.toLocaleString('en-US')
                            )
                          }}
                          className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-xs font-extrabold text-[#0a1122] transition hover:bg-gray-50"
                        >
                          <RefreshCw className="size-3.5 shrink-0 text-[#007a5a]" />
                          <span>{t.sendCounterBtn}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => onSellerDecision(offer, 'reject')}
                        className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-100"
                      >
                        {t.rejectOfferBtn}
                      </button>
                    </div>
                  )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}