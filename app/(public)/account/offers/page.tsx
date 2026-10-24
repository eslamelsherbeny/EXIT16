'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  ExternalLink,
  Flame,
  Handshake,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react'
import {
  getAccountOffersDataAction,
  respondToCounterOfferByBuyerAction,
  respondToOfferBySellerAction,
  submitBuyerOfferAction,
  type OfferRecord,
} from '@/actions/offer-actions'
import {
  getUnitPricingGuardrails,
  type MatchableBuyer,
  type MatchableUnit,
} from '@/lib/smart-matcher'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { getCurrencySymbol, useTranslation } from '@/lib/i18n'

export default function OffersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t: dict, locale, country, dir, isRtl } = useTranslation()
  const t = dict.accountPages.offers as Record<string, any>
  const tCommon = dict.accountPages.common

  const filterUnitId = searchParams.get('unitId')
  const applyUnitId = searchParams.get('applyUnitId')

  const [loading, setLoading] = useState(true)
  const [roleView, setRoleView] = useState<'seller' | 'buyer'>('seller')
  const [sells, setSells] = useState<MatchableUnit[]>([])
  const [buys, setBuys] = useState<MatchableBuyer[]>([])
  const [sellerOffers, setSellerOffers] = useState<
    Array<OfferRecord & { unit?: MatchableUnit }>
  >([])
  const [buyerOffers, setBuyerOffers] = useState<
    Array<OfferRecord & { unit?: MatchableUnit }>
  >([])
  const [smartRecommendations, setSmartRecommendations] = useState<
    Array<{
      unit: MatchableUnit
      match: any
      recommendedByAdmin: boolean
      existingOfferId?: string
    }>
  >([])

  // نافذة تقديم عرض شراء للمشتري
  const [offerModalUnit, setOfferModalUnit] = useState<MatchableUnit | null>(
    null
  )
  const [offerMode, setOfferMode] = useState<'full' | 'negotiate'>('full')
  const [customOfferCashStr, setCustomOfferCashStr] = useState('')
  const [readiness, setReadiness] = useState<'48h' | '1_week' | '2_weeks'>(
    '48h'
  )
  const [paymentMethod, setPaymentMethod] = useState<
    'bank_check' | 'bank_transfer'
  >('bank_check')

  // نافذة العرض المقابل للبائع (Counter-Offer)
  const [counterModalOffer, setCounterModalOffer] = useState<
    (OfferRecord & { unit?: MatchableUnit }) | null
  >(null)
  const [counterCashStr, setCounterCashStr] = useState('')

  const [feedback, setFeedback] = useState<{
    text: string
    isError?: boolean
  } | null>(null)
  const [isPending, startTransition] = useTransition()

  async function loadAllData() {
    setLoading(true)
    const res = await getAccountOffersDataAction()
    if (!res.isLoggedIn) {
      router.push('/login?next=/account/offers')
      return
    }
    setSells(res.sells)
    setBuys(res.buys)
    setSellerOffers(res.sellerOffers)
    setBuyerOffers(res.buyerOffers)

    // فلترة أي وحدات مكررة بنفس الاسم والمنطقة والسعر في الترشيحات
    const seenKeys = new Set<string>()
    const uniqueRecs = res.smartRecommendations.filter((item) => {
      const signature = `${item.unit.project_name || ''}_${item.unit.area || ''}_${item.unit.paid_amount || 0}_${item.unit.unit_type || ''}`
      if (!item.recommendedByAdmin && seenKeys.has(signature)) {
        return false
      }
      seenKeys.add(signature)
      return true
    })

    setSmartRecommendations(uniqueRecs)

    if (filterUnitId && res.sells.some((s) => s.id === filterUnitId)) {
      setRoleView('seller')
    } else if (applyUnitId) {
      setRoleView('buyer')
      const targetRec =
        uniqueRecs.find((r) => r.unit.id === applyUnitId) ||
        res.smartRecommendations.find((r) => r.unit.id === applyUnitId)
      if (targetRec) {
        openBuyerOfferModal(targetRec.unit)
      }
    } else if (res.sells.length > 0 && res.buys.length === 0) {
      setRoleView('seller')
    } else if (res.buys.length > 0 && res.sells.length === 0) {
      setRoleView('buyer')
    } else if (res.sellerOffers.length > 0) {
      setRoleView('seller')
    } else {
      setRoleView('buyer')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadAllData()
  }, [])

  function openBuyerOfferModal(unit: MatchableUnit) {
    const guard = getUnitPricingGuardrails(unit)
    setOfferModalUnit(unit)
    setOfferMode('full')
    setCustomOfferCashStr(guard.requiredCash.toLocaleString('en-US'))
    setReadiness('48h')
    setPaymentMethod('bank_check')
  }

  function handleSubmitBuyerOffer() {
    if (!offerModalUnit) return
    setFeedback(null)
    const finalAmount = Number(customOfferCashStr.replace(/,/g, '')) || 0

    startTransition(async () => {
      const res = await submitBuyerOfferAction({
        propertyId: offerModalUnit.id,
        offeredCash: finalAmount,
        paymentReadiness: readiness,
        paymentMethod,
      })

      if (res.success) {
        setOfferModalUnit(null)
        setFeedback({ text: t.offerSubmittedSuccess })
        await loadAllData()
      } else {
        setFeedback({ text: res.error || t.errSubmitFailed, isError: true })
      }
    })
  }

  function handleSellerDecision(
    offer: OfferRecord & { unit?: MatchableUnit },
    decision: 'accept' | 'reject'
  ) {
    setFeedback(null)
    startTransition(async () => {
      const res = await respondToOfferBySellerAction({
        offerId: offer.id,
        decision,
      })
      if (res.success) {
        setFeedback({
          text:
            decision === 'accept'
              ? t.sellerAcceptedSuccess
              : t.sellerRejectedSuccess,
        })
        await loadAllData()
      } else {
        setFeedback({ text: res.error || t.errSubmitFailed, isError: true })
      }
    })
  }

  function handleSendSellerCounter() {
    if (!counterModalOffer) return
    setFeedback(null)
    const amount = Number(counterCashStr.replace(/,/g, '')) || 0

    startTransition(async () => {
      const res = await respondToOfferBySellerAction({
        offerId: counterModalOffer.id,
        decision: 'counter',
        counterCash: amount,
      })
      if (res.success) {
        setCounterModalOffer(null)
        setFeedback({ text: t.counterSentSuccess })
        await loadAllData()
      } else {
        setFeedback({ text: res.error || t.errSubmitFailed, isError: true })
      }
    })
  }

  function handleBuyerCounterResponse(
    offerId: string,
    decision: 'accept' | 'reject'
  ) {
    setFeedback(null)
    startTransition(async () => {
      const res = await respondToCounterOfferByBuyerAction({
        offerId,
        decision,
      })
      if (res.success) {
        setFeedback({
          text:
            decision === 'accept'
              ? t.buyerAcceptedCounterSuccess
              : t.sellerRejectedSuccess,
        })
        await loadAllData()
      } else {
        setFeedback({ text: res.error || t.errSubmitFailed, isError: true })
      }
    })
  }

  function getReadinessLabel(r: string) {
    if (r === '48h') return t.readiness48h
    if (r === '1_week') return t.readiness1Week
    return t.readiness2Weeks
  }

  function getPaymentMethodLabel(m: string) {
    if (m === 'bank_check') return t.methodBankCheck
    return t.methodBankTransfer
  }

  if (loading) {
    return (
      <div
        dir={dir}
        className="flex min-h-[70vh] items-center justify-center bg-[var(--brand-surface,#f5f6f8)]"
      >
        <div className="flex items-center gap-2 font-bold text-[var(--brand-primary,#007a5a)]">
          <Loader2 className="size-5 animate-spin" />
          <span>{t.loading}</span>
        </div>
      </div>
    )
  }

  const displayedSellerOffers = filterUnitId
    ? sellerOffers.filter((o) => o.property_id === filterUnitId)
    : sellerOffers

  return (
    <main
      dir={dir}
      className="min-h-screen bg-[var(--brand-surface,#f5f6f8)] py-8 pb-20 text-[var(--brand-navy,#0a1122)] sm:py-12"
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {/* شريط الرجوع والتبديل بين وضع البائع والمشتري */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/account"
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-extrabold text-[#0a1122] shadow-2xs transition hover:border-[#007a5a] hover:text-[#007a5a]"
          >
            {isRtl ? (
              <ArrowRight className="size-4" />
            ) : (
              <ArrowLeft className="size-4" />
            )}
            <span>{tCommon.backToAccount}</span>
          </Link>

          {sells.length > 0 && buys.length > 0 && (
            <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setRoleView('seller')}
                className={`rounded-lg px-4 py-1.5 text-xs font-extrabold transition ${
                  roleView === 'seller'
                    ? 'bg-[#0a1122] text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t.sellerTabBtn} ({sellerOffers.length})
              </button>
              <button
                type="button"
                onClick={() => setRoleView('buyer')}
                className={`rounded-lg px-4 py-1.5 text-xs font-extrabold transition ${
                  roleView === 'buyer'
                    ? 'bg-[#007a5a] text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t.buyerTabBtn} (
                {buyerOffers.length + smartRecommendations.length})
              </button>
            </div>
          )}
        </div>

        {feedback && (
          <div
            className={`mb-6 flex items-center justify-between gap-3 rounded-2xl border p-4 text-xs font-extrabold shadow-xs sm:text-sm ${
              feedback.isError
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-emerald-200 bg-emerald-50 text-[#007a5a]'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.isError ? (
                <AlertTriangle className="size-4 shrink-0" />
              ) : (
                <CheckCircle2 className="size-4 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="rounded-lg p-1 opacity-70 hover:bg-black/5"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        {/* ==================== أولاً: واجهة البائع (العروض المقدمة على وحداتك + المستشار المالي الذكي) ==================== */}
        {roleView === 'seller' ? (
          <div>
            <header className="mb-7 text-start">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-3 py-1 text-[11px] font-extrabold text-[#007a5a]">
                <ShieldCheck className="size-3.5" />
                <span>{t.zeroLeakageBadge}</span>
              </span>
              <h1 className="mt-2 text-2xl font-black text-[#0a1122] sm:text-3xl">
                {t.sellerTitle}
              </h1>
              <p className="mt-1.5 text-xs leading-relaxed text-gray-500 sm:text-sm">
                {t.sellerSubtitle}
              </p>
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
                  const cur = getCurrencySymbol(
                    u?.country_code || u?.country || country,
                    locale
                  )
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
                  const netSavedVsCancel = Math.max(
                    0,
                    cancelPenalty - sellerDiscount
                  )

                  return (
                    <div
                      key={offer.id}
                      className={`rounded-[22px] border bg-white p-5 text-start shadow-xs sm:p-6 ${
                        offer.status === 'accepted'
                          ? 'border-2 border-[#007a5a] bg-emerald-50/20'
                          : 'border-gray-200/90'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-lg bg-[#0a1122] px-2.5 py-1 text-[11px] font-extrabold text-white">
                              <Building2 className="size-3.5 text-emerald-400" />
                              <span>{u?.project_name || t.unitFallback}</span>
                            </span>
                            <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-[11px] font-extrabold text-[#007a5a]">
                              🎯 {t.matchScoreLabel}: {offer.match_score}%
                            </span>
                          </div>
                          <p className="mt-1.5 text-xs text-gray-500">
                            {u?.area || '—'} · {u?.unit_type || '—'}
                          </p>
                        </div>

                        <div>
                          {offer.status === 'accepted' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#007a5a] px-3.5 py-1.5 text-xs font-extrabold text-white shadow-2xs">
                              <Handshake className="size-3.5" />
                              <span>{t.statusAcceptedBadge}</span>
                            </span>
                          )}
                          {offer.status === 'pending_seller' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3.5 py-1.5 text-xs font-extrabold text-amber-900">
                              <Flame className="size-3.5 fill-amber-500 text-amber-600" />
                              <span>{t.statusPendingSellerBadge}</span>
                            </span>
                          )}
                          {offer.status === 'counter_offered' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3.5 py-1.5 text-xs font-extrabold text-purple-900">
                              <RefreshCw className="size-3.5" />
                              <span>{t.statusCounterSentBadge}</span>
                            </span>
                          )}
                          {offer.status === 'rejected' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                              {t.statusRejectedBadge}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* تفاصيل العرض المالي */}
                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-emerald-200 bg-[#eaf8f2] p-4">
                          <span className="block text-[11px] font-bold text-[#007a5a]">
                            {t.offeredCashLabel}
                          </span>
                          <strong className="mt-1 block text-xl font-black text-[#007a5a] tabular-nums sm:text-2xl">
                            <span dir="ltr">
                              {Number(offer.offered_cash).toLocaleString(
                                'en-US'
                              )}
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

                        {/* المستشار المالي الذكي */}
                        <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4">
                          <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-sky-900">
                            <TrendingUp className="size-3.5 text-sky-700" />
                            <span>{t.aiAdvisorTitle}</span>
                          </div>
                          <p className="mt-1.5 text-[11.5px] leading-relaxed font-semibold text-sky-950">
                            {t.aiAdvisorSavedPrefix}{' '}
                            <strong
                              dir="ltr"
                              className="font-black text-[#007a5a]"
                            >
                              {netSavedVsCancel.toLocaleString('en-US')} {cur}
                            </strong>{' '}
                            {t.aiAdvisorSavedSuffix}
                          </p>
                        </div>
                      </div>

                      {offer.status === 'counter_offered' &&
                        offer.counter_cash && (
                          <div className="mt-4 rounded-xl border border-purple-200 bg-purple-50/80 px-4 py-3 text-xs font-bold text-purple-900">
                            {t.yourCounterOfferText}:{' '}
                            <strong dir="ltr">
                              {Number(offer.counter_cash).toLocaleString(
                                'en-US'
                              )}
                            </strong>{' '}
                            {cur} — {t.waitingBuyerResponseText}
                          </div>
                        )}

                      {offer.status === 'accepted' && (
                        <div className="mt-4 rounded-xl border border-[#007a5a]/30 bg-[#eaf8f2] p-4 text-xs font-bold text-[#007a5a]">
                          🎉 {t.dealLockedBannerForSeller}
                        </div>
                      )}

                      {/* أزرار القرار للبائع */}
                      {offer.status === 'pending_seller' && (
                        <div className="mt-5 flex flex-wrap items-center gap-2.5 border-t border-gray-100 pt-4">
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() =>
                              handleSellerDecision(offer, 'accept')
                            }
                            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#007a5a] px-5 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#006248] disabled:opacity-50 sm:text-sm"
                          >
                            <Check className="size-4" />
                            <span>{t.acceptOfferBtn}</span>
                          </button>

                          {Number(offer.offered_cash) < paid && (
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => {
                                setCounterModalOffer(offer)
                                const mid = Math.round(
                                  (Number(offer.offered_cash) + paid) / 2
                                )
                                setCounterCashStr(mid.toLocaleString('en-US'))
                              }}
                              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 text-xs font-extrabold text-[#0a1122] transition hover:bg-gray-50"
                            >
                              <RefreshCw className="size-3.5 text-[#007a5a]" />
                              <span>{t.sendCounterBtn}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() =>
                              handleSellerDecision(offer, 'reject')
                            }
                            className="inline-flex h-11 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 text-xs font-bold text-red-600 transition hover:bg-red-100"
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
        ) : (
          /* ==================== ثانياً: واجهة المشتري (عروضي النشطة + الترشيحات الذكية بنسبة التوافق %) ==================== */
          <div className="space-y-9">
            <header className="text-start">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-3 py-1 text-[11px] font-extrabold text-[#007a5a]">
                <Sparkles className="size-3.5" />
                <span>{t.aiMatcherBadge}</span>
              </span>
              <h1 className="mt-2 text-2xl font-black text-[#0a1122] sm:text-3xl">
                {t.buyerTitle}
              </h1>
              <p className="mt-1.5 text-xs leading-relaxed text-gray-500 sm:text-sm">
                {t.buyerSubtitle}
              </p>
            </header>

            {/* القسم 1: عروض الشراء التي قدمها المشتري وحالتها */}
            {buyerOffers.length > 0 && (
              <section>
                <h2 className="mb-3.5 text-start text-base font-extrabold text-[#0a1122]">
                  {t.mySubmittedOffersTitle} ({buyerOffers.length})
                </h2>
                <div className="space-y-3.5">
                  {buyerOffers.map((offer) => {
                    const u = offer.unit
                    const cur = getCurrencySymbol(
                      u?.country_code || u?.country || country,
                      locale
                    )

                    return (
                      <div
                        key={offer.id}
                        className={`rounded-[20px] border bg-white p-5 text-start shadow-2xs ${
                          offer.status === 'accepted'
                            ? 'border-2 border-[#007a5a] bg-emerald-50/20'
                            : offer.status === 'counter_offered'
                              ? 'border-2 border-purple-400 bg-purple-50/15'
                              : 'border-gray-200/90'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <h3 className="text-sm font-extrabold text-[#0a1122] sm:text-base">
                              {u?.project_name || t.unitFallback} —{' '}
                              {u?.area || ''}
                            </h3>
                            <p className="mt-0.5 text-xs text-gray-500">
                              {t.offeredCashLabel}:{' '}
                              <strong
                                dir="ltr"
                                className="font-extrabold text-[#007a5a]"
                              >
                                {Number(offer.offered_cash).toLocaleString(
                                  'en-US'
                                )}
                              </strong>{' '}
                              {cur} ·{' '}
                              {getReadinessLabel(offer.payment_readiness)}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            {u && (
                              <Link
                                href={`/opportunities/${u.id}`}
                                className="inline-flex h-8 items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-3 text-xs font-bold text-[#0a1122] hover:bg-gray-100"
                              >
                                <ExternalLink className="size-3.5 text-[#007a5a]" />
                                <span>{t.viewUnitPageBtn}</span>
                              </Link>
                            )}

                            {offer.status === 'pending_seller' && (
                              <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-extrabold text-amber-800">
                                {t.statusWaitingSellerBadge}
                              </span>
                            )}
                            {offer.status === 'accepted' && (
                              <span className="rounded-full bg-[#007a5a] px-3 py-1 text-[11px] font-extrabold text-white">
                                ✓ {t.statusAcceptedBadge}
                              </span>
                            )}
                            {offer.status === 'unit_locked' && (
                              <span className="rounded-full bg-gray-200 px-3 py-1 text-[11px] font-bold text-gray-600">
                                {t.statusLockedOtherBuyer}
                              </span>
                            )}
                          </div>
                        </div>

                        {offer.status === 'accepted' && (
                          <div className="mt-3.5 rounded-xl border border-[#007a5a]/30 bg-[#eaf8f2] p-3.5 text-xs font-bold text-[#007a5a]">
                            🎉 {t.dealLockedBannerForBuyer}
                          </div>
                        )}

                        {offer.status === 'counter_offered' &&
                          offer.counter_cash && (
                            <div className="mt-4 rounded-xl border border-purple-200 bg-purple-50 p-4">
                              <p className="text-xs font-extrabold text-purple-950">
                                🔄 {t.sellerCounterReceivedText}:{' '}
                                <strong
                                  dir="ltr"
                                  className="text-base font-black text-[#007a5a]"
                                >
                                  {Number(offer.counter_cash).toLocaleString(
                                    'en-US'
                                  )}{' '}
                                  {cur}
                                </strong>
                              </p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  disabled={isPending}
                                  onClick={() =>
                                    handleBuyerCounterResponse(
                                      offer.id,
                                      'accept'
                                    )
                                  }
                                  className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#007a5a] px-4 text-xs font-extrabold text-white hover:bg-[#006248]"
                                >
                                  <Check className="size-4" />
                                  <span>{t.acceptCounterBtn}</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={isPending}
                                  onClick={() =>
                                    handleBuyerCounterResponse(
                                      offer.id,
                                      'reject'
                                    )
                                  }
                                  className="inline-flex h-10 items-center justify-center rounded-xl border border-red-200 bg-white px-4 text-xs font-bold text-red-600 hover:bg-red-50"
                                >
                                  {t.rejectOfferBtn}
                                </button>
                              </div>
                            </div>
                          )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* القسم 2: الوحدات المرشحة للمشتري بنسبة التوافق المئوية % ونقاط التطابق والاختلاف */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-extrabold text-[#0a1122] sm:text-lg">
                  🎯 {t.smartRecsTitle} ({smartRecommendations.length})
                </h2>
              </div>

              {smartRecommendations.length === 0 ? (
                <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-2xs">
                  <p className="text-sm font-bold text-gray-600">
                    {t.buyerEmpty}
                  </p>
                  <Link
                    href="/opportunities"
                    className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-[#007a5a] px-6 text-xs font-extrabold text-white"
                  >
                    {dict.navbar?.opportunities}
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {smartRecommendations.map(
                    ({ unit, match, recommendedByAdmin }) => {
                      const cur = getCurrencySymbol(
                        unit.country_code || unit.country || country,
                        locale
                      )
                      const paid = Number(unit.paid_amount) || 0
                      const contract = Number(unit.contract_price) || paid
                      const market = Number(unit.market_price) || contract
                      const instantGain = Math.max(
                        0,
                        market - contract - Math.round(market * 0.0125)
                      )

                      return (
                        <div
                          key={unit.id}
                          className={`flex flex-col justify-between rounded-[22px] border bg-white p-5 text-start shadow-xs transition hover:shadow-md ${
                            recommendedByAdmin
                              ? 'border-2 border-amber-400'
                              : match.score >= 85
                                ? 'border-2 border-[#007a5a]/50'
                                : 'border-gray-200/90'
                          }`}
                        >
                          <div>
                            {/* شريط نسبة التوافق المئوية */}
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black ${
                                  match.score >= 85
                                    ? 'bg-[#007a5a] text-white'
                                    : 'bg-emerald-100 text-[#007a5a]'
                                }`}
                              >
                                🎯 {t.matchScoreLabel}: {match.score}%
                              </span>

                              {recommendedByAdmin ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10.5px] font-extrabold text-amber-900">
                                  🌟 {t.adminRecommendedBadge}
                                </span>
                              ) : (
                                match.score >= 85 && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10.5px] font-bold text-[#007a5a]">
                                    🤖 {t.autoPilotMatchBadge}
                                  </span>
                                )
                              )}
                            </div>

                            <h3 className="mt-3 text-base font-extrabold text-[#0a1122]">
                              {unit.project_name || t.unitFallback}
                            </h3>
                            <p className="mt-0.5 text-xs text-gray-500">
                              {unit.developer_name || ''} · {unit.area || ''} ·{' '}
                              {unit.unit_type || ''}
                            </p>

                            <div className="mt-3.5 grid grid-cols-2 gap-2.5 rounded-xl bg-gray-50 p-3 text-xs">
                              <div>
                                <span className="block text-[10px] text-gray-400">
                                  {t.requiredCashLabel}
                                </span>
                                <strong className="mt-0.5 block text-sm font-black text-[#0a1122] tabular-nums">
                                  <span dir="ltr">
                                    {paid.toLocaleString('en-US')}
                                  </span>{' '}
                                  {cur}
                                </strong>
                              </div>
                              {instantGain > 0 && (
                                <div>
                                  <span className="block text-[10px] text-gray-400">
                                    {t.instantBuyerGainLabel}
                                  </span>
                                  <strong className="mt-0.5 block text-sm font-black text-[#007a5a] tabular-nums">
                                    +{' '}
                                    <span dir="ltr">
                                      {instantGain.toLocaleString('en-US')}
                                    </span>{' '}
                                    {cur}
                                  </strong>
                                </div>
                              )}
                            </div>

                            {/* نقاط التطابق (بالأخضر ✓) */}
                            {match.matches.length > 0 && (
                              <div className="mt-3">
                                <p className="mb-1.5 text-[11px] font-extrabold text-[#007a5a]">
                                  ✓ {t.matchedPointsTitle}:
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {match.matches.map((mItem: string) => (
                                    <span
                                      key={mItem}
                                      className="rounded-lg bg-[#eaf8f2] px-2.5 py-1 text-[10.5px] font-bold text-[#007a5a]"
                                    >
                                      ✓ {mItem}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* نقاط الاختلاف بشفافية تامة (بالبرتقالي ⚠️) */}
                            {match.differences.length > 0 && (
                              <div className="mt-2.5">
                                <p className="mb-1.5 text-[11px] font-extrabold text-amber-800">
                                  ⚠️ {t.diffPointsTitle}:
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {match.differences.map((dItem: string) => (
                                    <span
                                      key={dItem}
                                      className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10.5px] font-bold text-amber-900"
                                    >
                                      ⚠️ {dItem}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* أزرار فتح صفحة الوحدة بالصور + تقديم عرض شراء */}
                          <div className="mt-5 flex items-center gap-2 border-t border-gray-100 pt-3.5">
                            <Link
                              href={`/opportunities/${unit.id}`}
                              className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-xs font-extrabold text-[#0a1122] transition hover:border-[#007a5a] hover:bg-gray-50"
                            >
                              <ExternalLink className="size-3.5 text-[#007a5a]" />
                              <span>{t.viewUnitPageBtn}</span>
                            </Link>

                            <button
                              type="button"
                              onClick={() => openBuyerOfferModal(unit)}
                              className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#007a5a] px-3 text-xs font-extrabold text-white shadow-2xs transition hover:bg-[#006248]"
                            >
                              <Wallet className="size-3.5" />
                              <span>{t.makeOfferBtn}</span>
                            </button>
                          </div>
                        </div>
                      )
                    }
                  )}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {/* ==================== نافذة تقديم عرض الشراء المرن والمحكوم (للمشتري) ==================== */}
      <Dialog
        open={Boolean(offerModalUnit)}
        onOpenChange={(open) => !open && !isPending && setOfferModalUnit(null)}
      >
        <DialogContent
          dir={dir}
          className="w-[92vw] max-w-[450px] rounded-3xl p-5 text-start sm:p-6"
        >
          {offerModalUnit &&
            (() => {
              const guard = getUnitPricingGuardrails(offerModalUnit)
              const cur = getCurrencySymbol(
                offerModalUnit.country_code ||
                  offerModalUnit.country ||
                  country,
                locale
              )
              const typedAmount =
                Number(customOfferCashStr.replace(/,/g, '')) || 0
              const isFullPrice = typedAmount >= guard.requiredCash
              const isTooLowFake =
                typedAmount > 0 && typedAmount < guard.minAllowedOfferCash

              return (
                <>
                  <DialogHeader className="text-start">
                    <DialogTitle className="text-base font-black text-[#0a1122]">
                      {t.modalMakeOfferTitle} —{' '}
                      {offerModalUnit.project_name || t.unitFallback}
                    </DialogTitle>
                    <DialogDescription className="text-start text-xs text-gray-500">
                      {t.modalMakeOfferSubtitle}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="mt-3 space-y-4 text-xs">
                    {/* 1. حقل كتابة السعر المناسب للمشتري + زر وضع السعر الكامل */}
                    <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <label className="font-extrabold text-[#0a1122]">
                          1. {t.enterNegotiatedCashLabel} ({cur}):
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setOfferMode('full')
                            setCustomOfferCashStr(
                              guard.requiredCash.toLocaleString('en-US')
                            )
                          }}
                          className="rounded-lg bg-[#007a5a]/10 px-2.5 py-1 text-[10.5px] font-extrabold text-[#007a5a] transition hover:bg-[#007a5a] hover:text-white"
                        >
                          {t.fullPriceOptionTitle}:{' '}
                          <span dir="ltr">
                            {guard.requiredCash.toLocaleString('en-US')}
                          </span>
                        </button>
                      </div>

                      <input
                        type="text"
                        inputMode="numeric"
                        dir="ltr"
                        value={customOfferCashStr}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '')
                          const num = Number(digits) || 0
                          setOfferMode(
                            num >= guard.requiredCash ? 'full' : 'negotiate'
                          )
                          setCustomOfferCashStr(
                            digits ? num.toLocaleString('en-US') : ''
                          )
                        }}
                        className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-left text-base font-black text-[#0a1122] focus:border-[#007a5a] focus:outline-none"
                      />

                      {/* المؤشر الذكي الحي لتقييم سعر المشتري */}
                      {isFullPrice ? (
                        <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-emerald-200 bg-[#eaf8f2] p-2.5 text-[11px] font-bold text-[#007a5a]">
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                          <span>{t.fullPricePriorityHint}</span>
                        </div>
                      ) : isTooLowFake ? (
                        <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-2.5 text-[11px] font-bold text-red-700">
                          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                          <span>
                            {t.errBelowMinFloor}{' '}
                            <strong dir="ltr">
                              {guard.minAllowedOfferCash.toLocaleString('en-US')}{' '}
                              {cur}
                            </strong>
                            .
                          </span>
                        </div>
                      ) : (
                        <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-[11px] font-bold text-amber-900">
                          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                          <span>{t.fomoNegotiationWarning}</span>
                        </div>
                      )}
                    </div>

                    {/* 2. جاهزية الدفع */}
                    <div>
                      <label className="mb-2 block font-extrabold text-[#0a1122]">
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
                            className={`rounded-xl border px-2.5 py-2.5 text-center text-[11px] font-extrabold transition ${
                              readiness === opt.id
                                ? 'border-[#007a5a] bg-[#007a5a] text-white'
                                : 'border-gray-200 bg-white text-gray-700'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 3. طريقة السداد في مقر المطور */}
                    <div>
                      <label className="mb-2 block font-extrabold text-[#0a1122]">
                        3. {t.paymentMethodLabel}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {(
                          [
                            { id: 'bank_check', label: t.methodBankCheck },
                            {
                              id: 'bank_transfer',
                              label: t.methodBankTransfer,
                            },
                          ] as const
                        ).map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setPaymentMethod(m.id)}
                            className={`rounded-xl border px-3 py-2.5 text-center text-[11px] font-extrabold transition ${
                              paymentMethod === m.id
                                ? 'border-[#0a1122] bg-[#0a1122] text-white'
                                : 'border-gray-200 bg-white text-gray-700'
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <DialogFooter className="mt-5 flex flex-row items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => setOfferModalUnit(null)}
                      className="h-11 flex-1 rounded-xl text-xs font-bold"
                    >
                      {t.cancelBtn}
                    </Button>
                    <Button
                      type="button"
                      disabled={isPending || isTooLowFake || typedAmount <= 0}
                      onClick={handleSubmitBuyerOffer}
                      className="h-11 flex-1 rounded-xl bg-[#007a5a] text-xs font-extrabold text-white hover:bg-[#006248] disabled:opacity-50"
                    >
                      {isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        t.confirmSendOfferBtn
                      )}
                    </Button>
                  </DialogFooter>
                </>
              )
            })()}
        </DialogContent>
      </Dialog>

      {/* ==================== نافذة السعر المقابل للبائع (Counter-Offer) ==================== */}
      <Dialog
        open={Boolean(counterModalOffer)}
        onOpenChange={(open) =>
          !open && !isPending && setCounterModalOffer(null)
        }
      >
        <DialogContent
          dir={dir}
          className="w-[90vw] max-w-[380px] rounded-2xl p-5 text-start"
        >
          {counterModalOffer && (
            <>
              <DialogHeader className="text-start">
                <DialogTitle className="text-sm font-extrabold text-[#0a1122]">
                  🔄 {t.sendCounterBtn}
                </DialogTitle>
                <DialogDescription className="text-start text-xs text-gray-500">
                  {t.counterModalDesc}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-3">
                <input
                  type="text"
                  inputMode="numeric"
                  dir="ltr"
                  value={counterCashStr}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '')
                    setCounterCashStr(
                      digits ? Number(digits).toLocaleString('en-US') : ''
                    )
                  }}
                  className="h-11 w-full rounded-xl border border-gray-200 px-3.5 text-left text-sm font-black text-[#0a1122]"
                />
              </div>

              <DialogFooter className="mt-4 flex flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => setCounterModalOffer(null)}
                  className="h-10 flex-1 rounded-xl text-xs font-bold"
                >
                  {t.cancelBtn}
                </Button>
                <Button
                  type="button"
                  disabled={isPending}
                  onClick={handleSendSellerCounter}
                  className="h-10 flex-1 rounded-xl bg-[#007a5a] text-xs font-extrabold text-white"
                >
                  {isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    t.sendCounterBtn
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}