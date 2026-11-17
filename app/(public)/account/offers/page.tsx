'use client'

import { Suspense, useEffect, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileCheck2,
  Loader2,
  MessageCircle,
  Radar,
  Sparkles,
  Wallet,
  X,
  RefreshCw,
  Timer,
  Building2,
  Flame,
  Handshake,
  Lock,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'
import {
  getAccountOffersDataAction,
  respondToCounterOfferByBuyerAction,
  respondToOfferBySellerAction,
  submitBuyerOfferAction,
  type OfferRecord,
} from '@/actions/offer-actions'
import { markUserPhoneVerifiedAction } from '@/actions/submit-forms'
import {
  getUnitPricingGuardrails,
  type MatchableUnit,
} from '@/lib/smart-matcher'
import { toEnglishDigits } from '@/components/features/seller/seller-shared'
import { getLocalizedGeorgiaAreaName } from '@/components/shared/georgia-areas'
import {
  BuyerMakeOfferModal,
  getOfferRef,
  SellerCounterOfferModal,
} from '@/components/features/account/offers-modals'
import { getCurrencySymbol, useTranslation } from '@/lib/i18n'
import type { LocaleCode } from '@/lib/i18n'

const INITIAL_SUBMITTED_OFFERS_VISIBLE = 2
const BUYER_WA_OFFER_SENT_STORAGE_KEY = 'aqar_buyer_wa_offer_sent'
const OFFER_EXPIRATION_HOURS = 72

// =========================================================================
// 1. مكون العداد التنازلي الذكي (Smart Countdown Component)
// =========================================================================
function OfferCountdownTimer({
  updatedAt,
  onExpire,
}: {
  updatedAt: string
  onExpire: () => void
}) {
  const [timeLeft, setTimeLeft] = useState<{ h: number; m: number; s: number } | null>(null)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    const expireTime = new Date(updatedAt).getTime() + OFFER_EXPIRATION_HOURS * 60 * 60 * 1000

    const interval = setInterval(() => {
      const now = new Date().getTime()
      const distance = expireTime - now

      if (distance <= 0) {
        clearInterval(interval)
        setIsExpired(true)
        onExpire()
      } else {
        setTimeLeft({
          h: Math.floor((distance % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60)),
          m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          s: Math.floor((distance % (1000 * 60)) / 1000),
        })
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [updatedAt, onExpire])

  if (isExpired) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
        <Timer className="size-3" />
        انتهت صلاحية العرض
      </span>
    )
  }

  if (!timeLeft) return null

  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-800">
      <Timer className="size-3" />
      <span dir="ltr">
        {String(timeLeft.h).padStart(2, '0')}:{String(timeLeft.m).padStart(2, '0')}:{String(timeLeft.s).padStart(2, '0')}
      </span>
    </span>
  )
}

// =========================================================================
// 2. قسم البائع (Seller Offers Section)
// =========================================================================
function SellerOffersSection({
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
  const [expiredOffers, setExpiredOffers] = useState<Set<string>>(new Set())

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
            const sellerDiscount = Math.max(0, paid - Number(offer.offered_cash))
            const netSavedVsCancel = Math.max(0, cancelPenalty - sellerDiscount)
            const unitAlreadyHasAcceptedOffer =
              acceptedPropertyIds.has(String(offer.property_id)) &&
              offer.status !== 'accepted'

            const isOfferExpired = expiredOffers.has(offer.id)

            return (
              <div
                key={offer.id}
                className={`rounded-[22px] border bg-white p-4 text-start shadow-xs sm:p-6 ${
                  offer.status === 'accepted'
                    ? 'border-2 border-[#007a5a] bg-emerald-50/20'
                    : isOfferExpired
                      ? 'border-red-200 bg-red-50/10 opacity-75'
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
                      
                      {/* إضافة العداد التنازلي لو العرض مستني رد البائع ومفيش حد تاني اشترى */}
                      {offer.status === 'pending_seller' && !unitAlreadyHasAcceptedOffer && !isOfferExpired && (
                        <OfferCountdownTimer 
                          updatedAt={offer.updated_at || offer.created_at} 
                          onExpire={() => setExpiredOffers(prev => new Set(prev).add(offer.id))}
                        />
                      )}
                    </div>
                    <p className="mt-1.5 text-xs text-gray-500">
                      {getLocalizedGeorgiaAreaName(u?.area, locale)} ·{' '}
                      {u?.unit_type || '—'}
                    </p>
                  </div>

                  <div className="shrink-0">
                    {isOfferExpired ? (
                       <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3.5 py-1.5 text-xs font-extrabold text-red-800">
                        <X className="size-3.5" />
                        <span>انتهت الصلاحية</span>
                      </span>
                    ) : offer.status === 'accepted' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#007a5a] px-3.5 py-1.5 text-xs font-extrabold text-white shadow-2xs">
                        <Handshake className="size-3.5" />
                        <span>{t.statusAcceptedBadge}</span>
                      </span>
                    ) : offer.status === 'pending_seller' && !unitAlreadyHasAcceptedOffer ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3.5 py-1.5 text-xs font-extrabold text-amber-900">
                        <Flame className="size-3.5 fill-amber-500 text-amber-600" />
                        <span>{t.statusPendingSellerBadge}</span>
                      </span>
                    ) : (offer.status === 'unit_locked' || unitAlreadyHasAcceptedOffer) ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-extrabold text-slate-700">
                        <Lock className="size-3.5" />
                        <span>{t.backupOfferBadge}</span>
                      </span>
                    ) : offer.status === 'counter_offered' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3.5 py-1.5 text-xs font-extrabold text-purple-900">
                        <RefreshCw className="size-3.5" />
                        <span>{t.statusCounterSentBadge}</span>
                      </span>
                    ) : null}
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

                {/* أزرار اتخاذ القرار للبائع (تختفي لو الوقت خلص) */}
                {offer.status === 'pending_seller' && !unitAlreadyHasAcceptedOffer && !isOfferExpired && (
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

                    {Number(offer.offered_cash) < paid && !offer.counter_cash && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => {
                          const mid = Math.round((Number(offer.offered_cash) + paid) / 2)
                          onOpenCounterModal(offer, mid.toLocaleString('en-US'))
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

// =========================================================================
// 3. الصفحة الرئيسية للعروض (Main Offers Content)
// =========================================================================
function OffersContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t: dict, locale, dir, isRtl } = useTranslation()
  const t = dict.accountPages.offers as Record<string, any>
  const tCommon = dict.accountPages.common
  const cur = getCurrencySymbol('GE', locale)
  const supportWhatsApp = String(dict.footer?.phone || '+201018595959').replace(
    /\D/g,
    ''
  )

  const filterUnitId = searchParams.get('unitId')
  const applyUnitId = searchParams.get('applyUnitId')
  const requestedRole = searchParams.get('role')

  const [loading, setLoading] = useState(true)
  const [roleView, setRoleView] = useState<'seller' | 'buyer'>(
    requestedRole === 'seller' || Boolean(filterUnitId) ? 'seller' : 'buyer'
  )
  const [selectedSellerUnitId, setSelectedSellerUnitId] = useState<string>(
    filterUnitId || 'ALL'
  )
  const [sells, setSells] = useState<MatchableUnit[]>([])
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

  const [showAllSubmittedOffers, setShowAllSubmittedOffers] = useState(false)
  const [hiddenWaOfferIds, setHiddenWaOfferIds] = useState<
    Record<string, boolean>
  >({})
  const [expiredBuyerOffers, setExpiredBuyerOffers] = useState<Set<string>>(new Set())

  const [offerModalUnit, setOfferModalUnit] = useState<MatchableUnit | null>(null)
  const [offerMode, setOfferMode] = useState<'full' | 'negotiate'>('full')
  const [customOfferCashStr, setCustomOfferCashStr] = useState('')
  const [readiness, setReadiness] = useState<'48h' | '1_week' | '2_weeks'>('48h')
  const [paymentMethod, setPaymentMethod] = useState<'bank_check' | 'bank_transfer'>('bank_check')

  const [counterModalOffer, setCounterModalOffer] = useState<
    (OfferRecord & { unit?: MatchableUnit }) | null
  >(null)
  const [counterCashStr, setCounterCashStr] = useState('')
  const [isCounteringAsBuyer, setIsCounteringAsBuyer] = useState(false)

  const [feedback, setFeedback] = useState<{
    text: string
    isError?: boolean
    justSubmittedOffer?: {
      offerId: string
      unitId: string
      projectName: string
      offeredCash: number
    }
  } | null>(null)
  const [isPending, startTransition] = useTransition()

  async function loadAllData() {
    setLoading(true)
    const res = await getAccountOffersDataAction()
    if (!res.isLoggedIn) {
      router.replace('/login?next=/account/offers')
      return
    }
    setSells(res.sells)
    setSellerOffers(res.sellerOffers)
    setBuyerOffers(res.buyerOffers)

    if (filterUnitId) {
      const hasForTarget = res.sellerOffers.some(
        (o) => String(o.property_id) === String(filterUnitId)
      )
      setSelectedSellerUnitId(
        hasForTarget || res.sellerOffers.length === 0 ? filterUnitId : 'ALL'
      )
    } else {
      setSelectedSellerUnitId('ALL')
    }

    const myOwnUnitIds = new Set(res.sells.map((s) => String(s.id)))
    const alreadyOfferedUnitIds = new Set(
      res.buyerOffers.map((o) => String(o.property_id))
    )

    const seenKeys = new Set<string>()
    const uniqueRecs = res.smartRecommendations.filter((item) => {
      const uId = String(item.unit.id)
      if (myOwnUnitIds.has(uId) || alreadyOfferedUnitIds.has(uId)) return false
      const signature = `${item.unit.project_name || ''}_${item.unit.area || ''}_${item.unit.paid_amount || 0}_${item.unit.unit_type || ''}`
      if (!item.recommendedByAdmin && seenKeys.has(signature)) {
        return false
      }
      seenKeys.add(signature)
      return true
    })

    setSmartRecommendations(uniqueRecs)

    if (requestedRole === 'seller' || Boolean(filterUnitId)) {
      setRoleView('seller')
    } else if (requestedRole === 'buyer' || Boolean(applyUnitId)) {
      setRoleView('buyer')
      if (
        applyUnitId &&
        !myOwnUnitIds.has(String(applyUnitId)) &&
        !alreadyOfferedUnitIds.has(String(applyUnitId))
      ) {
        const targetRec =
          uniqueRecs.find((r) => String(r.unit.id) === String(applyUnitId)) ||
          res.smartRecommendations.find(
            (r) => String(r.unit.id) === String(applyUnitId)
          )
        if (targetRec) {
          openBuyerOfferModal(targetRec.unit)
        } else {
          try {
            const supabase = createBrowserClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            )
            const { data: directUnit } = await supabase
              .from('sell_requests')
              .select('*')
              .eq('id', applyUnitId)
              .in('status', [
                'active',
                'approved',
                'published',
                'offer_received',
              ])
              .maybeSingle()
            if (directUnit && !myOwnUnitIds.has(String(directUnit.id))) {
              openBuyerOfferModal(directUnit as MatchableUnit)
            }
          } catch {}
        }
      }
    } else if (res.sells.length > 0 && res.buys.length === 0) {
      setRoleView('seller')
    } else {
      setRoleView('buyer')
    }

    setLoading(false)
  }

  useEffect(() => {
    loadAllData()
  }, [requestedRole, filterUnitId, applyUnitId])

  useEffect(() => {
    try {
      const hiddenMap: Record<string, boolean> = {}
      buyerOffers.forEach((o) => {
        const flag = localStorage.getItem(
          `${BUYER_WA_OFFER_SENT_STORAGE_KEY}_${o.id}`
        )
        if (flag === '1') {
          hiddenMap[o.id] = true
        }
      })
      setHiddenWaOfferIds((prev) => ({ ...prev, ...hiddenMap }))
    } catch {}
  }, [buyerOffers])

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
    const targetUnit = offerModalUnit
    const finalAmount =
      Number(toEnglishDigits(customOfferCashStr).replace(/,/g, '')) || 0

    startTransition(async () => {
      const res = await submitBuyerOfferAction({
        propertyId: targetUnit.id,
        offeredCash: finalAmount,
        paymentReadiness: readiness,
        paymentMethod,
      })

      if (res.success) {
        setOfferModalUnit(null)
        await loadAllData()
        setFeedback({
          text: t.offerSubmittedSuccess,
          justSubmittedOffer: {
            offerId: String(res.offerId || targetUnit.id),
            unitId: String(targetUnit.id),
            projectName: targetUnit.project_name || t.unitFallback,
            offeredCash: finalAmount,
          },
        })
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
    const amount =
      Number(toEnglishDigits(counterCashStr).replace(/,/g, '')) || 0

    startTransition(async () => {
      if (isCounteringAsBuyer) {
        const res = await respondToCounterOfferByBuyerAction({
          offerId: counterModalOffer.id,
          decision: 'counter',
          counterCash: amount,
        })
        if (res.success) {
          setCounterModalOffer(null)
          setIsCounteringAsBuyer(false)
          setFeedback({ text: t.counterSentSuccess })
          await loadAllData()
        } else {
          setFeedback({ text: res.error || t.errSubmitFailed, isError: true })
        }
      } else {
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

  const markOfferWaClickedAndHide = (
    offerId: string,
    leadId?: string | null
  ) => {
    setHiddenWaOfferIds((prev) => ({ ...prev, [offerId]: true }))
    try {
      localStorage.setItem(
        `${BUYER_WA_OFFER_SENT_STORAGE_KEY}_${offerId}`,
        '1'
      )
    } catch {}
    markUserPhoneVerifiedAction({
      leadId: leadId || undefined,
    }).catch(() => {})
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

  const displayedSellerOffers =
    selectedSellerUnitId === 'ALL'
      ? sellerOffers
      : sellerOffers.filter(
          (o) => String(o.property_id) === String(selectedSellerUnitId)
        )

  const acceptedPropertyIds = new Set(
    sellerOffers
      .filter((o) => o.status === 'accepted')
      .map((o) => String(o.property_id))
  )

  const backHref =
    roleView === 'seller'
      ? `/account?view=seller${filterUnitId ? `&unitId=${filterUnitId}` : ''}`
      : '/account?view=buyer'

  const siteOrigin =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://exit-16.vercel.app'

  const visibleBuyerOffers = showAllSubmittedOffers
    ? buyerOffers
    : buyerOffers.slice(0, INITIAL_SUBMITTED_OFFERS_VISIBLE)

  const hiddenBuyerOffersCount = Math.max(
    0,
    buyerOffers.length - INITIAL_SUBMITTED_OFFERS_VISIBLE
  )

  return (
    <main
      dir={dir}
      className="min-h-screen bg-[var(--brand-surface,#f5f6f8)] py-6 pb-20 text-[var(--brand-navy,#0a1122)] sm:py-10"
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="mb-5 flex items-center justify-start">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-extrabold text-[#0a1122] shadow-2xs transition hover:border-[#007a5a] hover:text-[#007a5a]"
          >
            {isRtl ? (
              <ArrowRight className="size-4" />
            ) : (
              <ArrowLeft className="size-4" />
            )}
            <span>{tCommon.backToAccount}</span>
          </Link>
        </div>

        {feedback && (
          <div
            className={`mb-6 rounded-2xl border p-4 shadow-xs sm:p-5 ${
              feedback.isError
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-emerald-300 bg-[#eaf8f2] text-[#0a1122]'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5 text-xs font-extrabold sm:text-sm">
                {feedback.isError ? (
                  <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-600" />
                ) : (
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#007a5a]" />
                )}
                <div>
                  <p
                    className={
                      feedback.isError ? 'text-red-700' : 'text-[#007a5a]'
                    }
                  >
                    {feedback.text}
                  </p>
                  {feedback.justSubmittedOffer &&
                    !hiddenWaOfferIds[feedback.justSubmittedOffer.offerId] && (
                      <p className="mt-1 text-xs font-bold text-[#0a1122]">
                        {t.fastTrackAfterOfferPrompt}
                      </p>
                    )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="rounded-lg p-1 opacity-70 hover:bg-black/5"
              >
                <X className="size-4" />
              </button>
            </div>

            {feedback.justSubmittedOffer &&
              !hiddenWaOfferIds[feedback.justSubmittedOffer.offerId] && (
                <div className="mt-3.5 border-t border-emerald-200/80 pt-3">
                  <a
                    href={`https://wa.me/${supportWhatsApp}?text=${encodeURIComponent(
                      `${t.waFastTrackOfferMsgPrefix} (${getOfferRef(feedback.justSubmittedOffer.offerId)}) ${t.waFastTrackOfferMsgMiddle} (${feedback.justSubmittedOffer.projectName}) — ${feedback.justSubmittedOffer.offeredCash.toLocaleString('en-US')} ${cur} ${t.waFastTrackOfferMsgSuffix}\n${siteOrigin}/admin/properties?unitId=${feedback.justSubmittedOffer.unitId}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => {
                      if (feedback.justSubmittedOffer) {
                        markOfferWaClickedAndHide(
                          feedback.justSubmittedOffer.offerId
                        )
                      }
                    }}
                    className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-center text-xs font-extrabold text-white shadow-2xs transition hover:opacity-95 sm:w-auto"
                  >
                    <MessageCircle className="size-4 shrink-0" />
                    <span>{t.confirmOfferViaWaBtn}</span>
                  </a>
                </div>
              )}
          </div>
        )}

        {roleView === 'seller' ? (
          <SellerOffersSection
            t={t}
            locale={locale}
            cur={cur}
            sells={sells}
            sellerOffers={sellerOffers}
            displayedSellerOffers={displayedSellerOffers}
            selectedSellerUnitId={selectedSellerUnitId}
            setSelectedSellerUnitId={setSelectedSellerUnitId}
            acceptedPropertyIds={acceptedPropertyIds}
            isPending={isPending}
            getReadinessLabel={getReadinessLabel}
            getPaymentMethodLabel={getPaymentMethodLabel}
            onSellerDecision={handleSellerDecision}
            onOpenCounterModal={(offer, defaultMidCash) => {
              setIsCounteringAsBuyer(false)
              setCounterModalOffer(offer)
              setCounterCashStr(defaultMidCash)
            }}
          />
        ) : (
          <div className="space-y-8">
            <header className="text-start">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-3 py-1 text-[11px] font-extrabold text-[#007a5a]">
                <Sparkles className="size-3.5" />
                <span>{t.aiMatcherBadge}</span>
              </span>
              <h1 className="mt-2 text-xl font-black text-[#0a1122] sm:text-3xl">
                {t.buyerTitle}
              </h1>
              <p className="mt-1.5 text-xs leading-relaxed text-gray-500 sm:text-sm">
                {t.buyerSubtitle}
              </p>
            </header>

            {/* ==================== القسم الأول: عروض الشراء والحجوزات التي قدمها المشتري ==================== */}
            {buyerOffers.length > 0 && (
              <section className="rounded-[24px] border-2 border-[#0a1122]/10 bg-white p-4 shadow-xs sm:p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#0a1122] text-white">
                      <FileCheck2 className="size-4 text-emerald-400" />
                    </span>
                    <div>
                      <h2 className="text-sm font-black text-[#0a1122] sm:text-base">
                        {t.mySubmittedOffersTitle} ({buyerOffers.length})
                      </h2>
                      <p className="text-[11px] text-gray-500">
                        {t.mySubmittedOffersSubtitle}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {visibleBuyerOffers.map((offer) => {
                    const u = offer.unit
                    const refCode = getOfferRef(offer.id)
                    const waConfirmText = `${t.waFastTrackOfferMsgPrefix} (${refCode}) ${t.waFastTrackOfferMsgMiddle} (${u?.project_name || ''}) — ${Number(offer.offered_cash).toLocaleString('en-US')} ${cur} ${t.waFastTrackOfferMsgSuffix}\n${siteOrigin}/admin/properties?unitId=${offer.property_id}`

                    const isWaBtnHidden =
                      Boolean(hiddenWaOfferIds[offer.id]) ||
                      (offer.status !== 'pending_admin' &&
                        offer.status !== 'pending_seller')

                    const isOfferExpired = expiredBuyerOffers.has(offer.id)

                    return (
                      <div
                        key={offer.id}
                        className={`rounded-[20px] border p-4 text-start transition sm:p-5 ${
                          offer.status === 'accepted'
                            ? 'border-2 border-[#007a5a] bg-emerald-50/25'
                            : isOfferExpired
                              ? 'border-red-200 bg-red-50/10 opacity-75'
                              : 'border-gray-200 bg-[#fcfdfd]'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="inline-flex items-center rounded-lg bg-gray-100 px-2.5 py-1 font-mono text-[11px] font-extrabold text-gray-600">
                            #{refCode}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {offer.status === 'counter_offered' && !isOfferExpired && (
                              <OfferCountdownTimer 
                                updatedAt={offer.updated_at || offer.created_at} 
                                onExpire={() => setExpiredBuyerOffers(prev => new Set(prev).add(offer.id))}
                              />
                            )}

                            {isOfferExpired ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-[11px] font-extrabold text-red-800">
                                <X className="size-3.5" />
                                انتهت الصلاحية
                              </span>
                            ) : (offer.status === 'pending_seller' ||
                              offer.status === 'pending_admin') ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-extrabold text-amber-800">
                                ⏳ {t.statusWaitingSellerBadge}
                              </span>
                            ) : offer.status === 'accepted' ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#007a5a] px-3 py-1 text-[11px] font-extrabold text-white">
                                ✓ {t.statusAcceptedBadge}
                              </span>
                            ) : offer.status === 'unit_locked' ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-3 py-1 text-[11px] font-bold text-gray-600">
                                {t.statusLockedOtherBuyer}
                              </span>
                            ) : offer.status === 'counter_offered' ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-[11px] font-extrabold text-purple-900">
                                🔄 {t.statusCounterSentBadge}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <h3 className="mt-2.5 text-sm leading-relaxed font-black text-[#0a1122] sm:text-base">
                          {u?.project_name || t.unitFallback} —{' '}
                          {getLocalizedGeorgiaAreaName(u?.area, locale)}
                        </h3>

                        <div className="mt-3.5 grid grid-cols-1 gap-3 rounded-2xl border border-gray-200/80 bg-white p-3.5 sm:grid-cols-2">
                          <div>
                            <span className="block text-[11px] font-semibold text-gray-500">
                              {t.offeredCashLabel}
                            </span>
                            <strong
                              dir="ltr"
                              className="mt-0.5 block text-lg font-black text-[#007a5a] tabular-nums sm:text-xl"
                            >
                              {Number(offer.offered_cash).toLocaleString(
                                'en-US'
                              )}{' '}
                              {cur}
                            </strong>
                          </div>

                          <div className="border-t border-gray-100 pt-2.5 sm:border-s sm:border-t-0 sm:ps-3.5 sm:pt-0">
                            <span className="block text-[11px] font-semibold text-gray-500">
                              {t.buyerReadinessLabel}
                            </span>
                            <strong className="mt-0.5 block text-xs leading-relaxed font-extrabold text-[#0a1122] sm:text-sm">
                              ⚡ {getReadinessLabel(offer.payment_readiness)} ·{' '}
                              {getPaymentMethodLabel(offer.payment_method)}
                            </strong>
                          </div>
                        </div>

                        <div
                          className={`mt-3.5 grid grid-cols-1 gap-2 ${
                            !isWaBtnHidden ? 'sm:grid-cols-2' : ''
                          }`}
                        >
                          {u && (
                            <Link
                              href={`/opportunities/${u.id}`}
                              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-center text-xs font-extrabold text-[#0a1122] transition hover:border-[#007a5a] hover:bg-gray-50"
                            >
                              <ExternalLink className="size-4 shrink-0 text-[#007a5a]" />
                              <span>{t.viewUnitPageBtn}</span>
                            </Link>
                          )}

                          {!isWaBtnHidden && (
                            <a
                              href={`https://wa.me/${supportWhatsApp}?text=${encodeURIComponent(waConfirmText)}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={() =>
                                markOfferWaClickedAndHide(
                                  offer.id,
                                  offer.lead_id
                                )
                              }
                              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-center text-xs font-extrabold text-white shadow-2xs transition hover:opacity-95"
                            >
                              <MessageCircle className="size-4 shrink-0" />
                              <span>{t.confirmOfferViaWaBtn}</span>
                            </a>
                          )}
                        </div>

                        {offer.status === 'accepted' && (
                          <div className="mt-3.5 rounded-xl border border-[#007a5a]/30 bg-[#eaf8f2] p-3.5 text-xs font-bold text-[#007a5a]">
                            🎉 {t.dealLockedBannerForBuyer}
                          </div>
                        )}

                        {/* ===================== واجهة المشتري عند وصول رد/تفاوض من البائع ===================== */}
                        {offer.status === 'counter_offered' &&
                          offer.counter_cash && !isOfferExpired && (
                            <div className="mt-4 rounded-2xl border border-purple-200 bg-purple-50/90 p-3.5 sm:p-4">
                              <p className="text-xs leading-relaxed font-extrabold text-purple-950 sm:text-sm">
                                🔄 {t.sellerCounterReceivedText}:{' '}
                                <strong
                                  dir="ltr"
                                  className="inline-block text-sm font-black text-[#007a5a] sm:text-base"
                                >
                                  {Number(offer.counter_cash).toLocaleString(
                                    'en-US'
                                  )}{' '}
                                  {cur}
                                </strong>
                              </p>

                              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                <button
                                  type="button"
                                  disabled={isPending}
                                  onClick={() =>
                                    handleBuyerCounterResponse(
                                      offer.id,
                                      'accept'
                                    )
                                  }
                                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-[#007a5a] px-4 py-2.5 text-center text-xs font-extrabold text-white shadow-2xs transition hover:bg-[#006248]"
                                >
                                  <Check className="size-4 shrink-0" />
                                  <span>{t.acceptCounterBtn}</span>
                                </button>

                                {/* زر تعديل السعر للمشتري (يتم إخفاؤه لو كان البائع قد استنفد محاولات التفاوض، لكننا هنا نتركه كخطوة أخيرة للمشتري) */}
                                <button
                                  type="button"
                                  disabled={isPending}
                                  onClick={() => {
                                    setIsCounteringAsBuyer(true)
                                    setCounterModalOffer(offer)
                                    const mid = Math.round(
                                      (Number(offer.offered_cash) +
                                        Number(offer.counter_cash)) /
                                        2
                                    )
                                    setCounterCashStr(mid.toLocaleString('en-US'))
                                  }}
                                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-center text-xs font-extrabold text-[#0a1122] transition hover:bg-gray-50"
                                >
                                  <RefreshCw className="size-3.5 shrink-0 text-[#007a5a]" />
                                  <span>{t.sendCounterBtn}</span>
                                </button>
                              </div>
                              <div className="mt-2">
                                <button
                                  type="button"
                                  disabled={isPending}
                                  onClick={() =>
                                    handleBuyerCounterResponse(
                                      offer.id,
                                      'reject'
                                    )
                                  }
                                  className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-red-200 bg-white px-4 py-2.5 text-center text-xs font-bold text-red-600 transition hover:bg-red-50"
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

                {buyerOffers.length > INITIAL_SUBMITTED_OFFERS_VISIBLE && (
                  <div className="mt-4 border-t border-gray-100 pt-3 text-center">
                    <button
                      type="button"
                      onClick={() =>
                        setShowAllSubmittedOffers((prev) => !prev)
                      }
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gray-100 px-4 py-2 text-xs font-extrabold text-[#0a1122] transition hover:bg-emerald-50 hover:text-[#007a5a]"
                    >
                      {showAllSubmittedOffers ? (
                        <>
                          <span>{t.collapseOffersBtn}</span>
                          <ChevronUp className="size-4" />
                        </>
                      ) : (
                        <>
                          <span>
                            {t.expandRemainingOffersPrefix} (+
                            {hiddenBuyerOffersCount})
                          </span>
                          <ChevronDown className="size-4" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* ==================== القسم الثاني: الفرص المرشحة بالرادار الذكي ==================== */}
            <section className="rounded-[24px] border border-emerald-200/80 bg-[#effaf5]/40 p-4 sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/60 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#007a5a] text-white">
                    <Radar className="size-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-black text-[#0a1122] sm:text-base">
                      {t.smartRecsTitle} ({smartRecommendations.length})
                    </h2>
                    <p className="text-[11px] text-gray-500">
                      {t.smartRecsSubtitle}
                    </p>
                  </div>
                </div>
              </div>

              {smartRecommendations.length === 0 ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-2xs">
                  <p className="text-sm font-bold text-gray-600">
                    {t.buyerEmpty}
                  </p>
                  <Link
                    href="/opportunities"
                    className="mt-4 inline-flex min-h-[42px] items-center justify-center rounded-xl bg-[#007a5a] px-6 text-xs font-extrabold text-white"
                  >
                    {dict.navbar?.opportunities}
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {smartRecommendations.map(
                    ({ unit, match, recommendedByAdmin }) => {
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
                          className={`flex flex-col justify-between rounded-[22px] border bg-white p-4 text-start shadow-xs transition hover:shadow-md sm:p-5 ${
                            recommendedByAdmin
                              ? 'border-2 border-amber-400'
                              : match.score >= 85
                                ? 'border-2 border-[#007a5a]/50'
                                : 'border-gray-200/90'
                          }`}
                        >
                          <div>
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
                              {unit.developer_name || ''} ·{' '}
                              {getLocalizedGeorgiaAreaName(unit.area, locale)} ·{' '}
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
                          </div>

                          <div className="mt-5 grid grid-cols-1 gap-2 border-t border-gray-100 pt-3.5 sm:grid-cols-2">
                            <Link
                              href={`/opportunities/${unit.id}`}
                              className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-center text-xs font-extrabold text-[#0a1122] transition hover:border-[#007a5a] hover:bg-gray-50"
                            >
                              <ExternalLink className="size-3.5 shrink-0 text-[#007a5a]" />
                              <span>{t.viewUnitPageBtn}</span>
                            </Link>

                            <button
                              type="button"
                              onClick={() => openBuyerOfferModal(unit)}
                              className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl bg-[#007a5a] px-3 py-2 text-center text-xs font-extrabold text-white shadow-2xs transition hover:bg-[#006248]"
                            >
                              <Wallet className="size-3.5 shrink-0" />
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

      <BuyerMakeOfferModal
        dir={dir}
        t={t}
        cur={cur}
        offerModalUnit={offerModalUnit}
        setOfferModalUnit={setOfferModalUnit}
        offerMode={offerMode}
        setOfferMode={setOfferMode}
        customOfferCashStr={customOfferCashStr}
        setCustomOfferCashStr={setCustomOfferCashStr}
        readiness={readiness}
        setReadiness={setReadiness}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        isPending={isPending}
        onSubmit={handleSubmitBuyerOffer}
      />

      <SellerCounterOfferModal
        dir={dir}
        t={t}
        cur={cur}
        counterModalOffer={counterModalOffer}
        setCounterModalOffer={setCounterModalOffer}
        counterCashStr={counterCashStr}
        setCounterCashStr={setCounterCashStr}
        isPending={isPending}
        onSubmit={handleSendSellerCounter}
      />
    </main>
  )
}

export default function OffersPage() {
  return (
    <Suspense fallback={null}>
      <OffersContent />
    </Suspense>
  )
}