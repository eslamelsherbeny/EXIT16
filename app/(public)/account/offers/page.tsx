'use client'

import { Suspense, useEffect, useRef, useState, useTransition } from 'react'
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
  Edit3,
  ExternalLink,
  FileCheck2,
  Loader2,
  MessageCircle,
  Radar,
  Sparkles,
  Star,
  Trash2,
  Wallet,
  X,
} from 'lucide-react'
import {
  getAccountOffersDataAction,
  manageBuyerOwnOfferAction,
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
import {
  OfferSentElapsedBadge,
  SellerOffersSection,
} from '@/components/features/account/seller-offers-section'
import { getCurrencySymbol, useTranslation } from '@/lib/i18n'
import {
  getUnifiedUnitCode,
  getUnifiedUnitHeadline,
} from '@/lib/unit-display-helpers'

const INITIAL_SUBMITTED_OFFERS_VISIBLE = 3
const BUYER_WA_OFFER_SENT_STORAGE_KEY = 'aqar_buyer_wa_offer_sent'

const REOPENED_PROMPT_TAG = '__REOPENED_PROMPT__'
const ADMIN_SYNCED_PRICE_TAG = '__ADMIN_SYNCED_PRICE__'
const SELLER_DELAYED_UNAVAILABLE_TAG = '__SELLER_UNAVAILABLE_NOW__'

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
  const smartRecsRef = useRef<HTMLElement | null>(null)

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

  const [editingBuyerOfferId, setEditingBuyerOfferId] = useState<string | null>(
    null
  )
  const [editingBuyerCashStr, setEditingBuyerCashStr] = useState('')

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

  const [counterModalOffer, setCounterModalOffer] = useState<
    (OfferRecord & { unit?: MatchableUnit }) | null
  >(null)
  const [counterCashStr, setCounterCashStr] = useState('')

  const [feedback, setFeedback] = useState<{
    text: string
    isError?: boolean
    justSubmittedOffer?: {
      offerId: string
      unitId: string
      unitCode: string
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
                'transferring',
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
          text: res.isBackupWaitlist
            ? t.waitlistSubmittedSuccess
            : t.offerSubmittedSuccess,
          justSubmittedOffer: res.isBackupWaitlist
            ? undefined
            : {
                offerId: String(res.offerId || targetUnit.id),
                unitId: String(targetUnit.id),
                unitCode: getUnifiedUnitCode(
                  targetUnit.id,
                  (targetUnit as any).code
                ),
                projectName: getUnifiedUnitHeadline(targetUnit, t.unitFallback),
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

  function handleManageBuyerOwnOffer(
    offerId: string,
    action:
      | 'update_pending_price'
      | 'cancel_offer'
      | 'confirm_reopened_interest'
      | 'dismiss_from_list',
    customCash?: number,
    scrollToRecs?: boolean
  ) {
    setFeedback(null)
    startTransition(async () => {
      const res = await manageBuyerOwnOfferAction({
        offerId,
        action,
        newOfferedCash: customCash,
      })
      if (res.success) {
        setEditingBuyerOfferId(null)
        await loadAllData()
        if (action === 'confirm_reopened_interest') {
          setFeedback({
            text: t.reopenedInterestConfirmedMsg,
          })
        } else if (action === 'update_pending_price') {
          setFeedback({ text: t.offerPriceUpdatedMsg })
        }
        if (scrollToRecs && smartRecsRef.current) {
          smartRecsRef.current.scrollIntoView({ behavior: 'smooth' })
        }
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

  const renderRecommendationCard = ({
    unit,
    match,
    recommendedByAdmin,
  }: {
    unit: MatchableUnit
    match: any
    recommendedByAdmin: boolean
  }) => {
    const paid = Number(unit.paid_amount) || 0
    const contract = Number(unit.contract_price) || paid
    const market = Number(unit.market_price) || contract
    const instantGain = Math.max(
      0,
      market - contract - Math.round(market * 0.0125)
    )
    const unitCode = getUnifiedUnitCode(unit.id, (unit as any).code)
    const unitTitle = getUnifiedUnitHeadline(unit, t.unitFallback)

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
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                dir="ltr"
                className="rounded-md bg-[#0a1122] px-2 py-0.5 font-mono text-[10.5px] font-bold text-white"
              >
                {unitCode}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black ${
                  match.score >= 85
                    ? 'bg-[#007a5a] text-white'
                    : 'bg-emerald-100 text-[#007a5a]'
                }`}
              >
                🎯 {t.matchScoreLabel}: {match.score}%
              </span>
            </div>

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
            {unitTitle}
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
                <span dir="ltr">{paid.toLocaleString('en-US')}</span> {cur}
              </strong>
            </div>
            {instantGain > 0 && (
              <div>
                <span className="block text-[10px] text-gray-400">
                  {t.instantBuyerGainLabel}
                </span>
                <strong className="mt-0.5 block text-sm font-black text-[#007a5a] tabular-nums">
                  + <span dir="ltr">{instantGain.toLocaleString('en-US')}</span>{' '}
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
      : 'https://dualdealz.com'

  const visibleBuyerOffers = showAllSubmittedOffers
    ? buyerOffers
    : buyerOffers.slice(0, INITIAL_SUBMITTED_OFFERS_VISIBLE)

  const hiddenBuyerOffersCount = Math.max(
    0,
    buyerOffers.length - INITIAL_SUBMITTED_OFFERS_VISIBLE
  )

  const advisorPickedRecs = smartRecommendations.filter(
    (item) => item.recommendedByAdmin
  )
  const autoMatchedRecs = smartRecommendations.filter(
    (item) => !item.recommendedByAdmin
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
                      `${t.waFastTrackOfferMsgPrefix} (${getOfferRef(feedback.justSubmittedOffer.offerId)}) ${t.waFastTrackOfferMsgMiddle} (${feedback.justSubmittedOffer.projectName} · ${feedback.justSubmittedOffer.unitCode}) — ${feedback.justSubmittedOffer.offeredCash.toLocaleString('en-US')} ${cur} ${t.waFastTrackOfferMsgSuffix}\n${siteOrigin}/admin/offers?offerId=${feedback.justSubmittedOffer.offerId}`
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
            supportWhatsApp={supportWhatsApp}
            getReadinessLabel={getReadinessLabel}
            getPaymentMethodLabel={getPaymentMethodLabel}
            onSellerDecision={handleSellerDecision}
            onOpenCounterModal={(offer, defaultMidCash) => {
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
                    const unitCode = u
                      ? getUnifiedUnitCode(u.id, (u as any).code)
                      : null
                    const unitTitle = u
                      ? getUnifiedUnitHeadline(u, t.unitFallback)
                      : t.unitFallback
                    const diffs = Array.isArray(offer.diff_reasons)
                      ? offer.diff_reasons
                      : []

                    const unitStatusClean = String(
                      u?.status || ''
                    ).toLowerCase()
                    const isUnitSoldToOther =
                      unitStatusClean === 'sold' && offer.status !== 'accepted'
                    const isUnitWithdrawn =
                      !u ||
                      unitStatusClean === 'deleted_by_seller' ||
                      unitStatusClean === 'paused_by_seller' ||
                      unitStatusClean === 'paused_by_admin' ||
                      unitStatusClean === 'paused_deletion'

                    const isReopenedPromptActive =
                      offer.status === 'unit_locked' &&
                      diffs.includes(REOPENED_PROMPT_TAG) &&
                      unitStatusClean !== 'transferring' &&
                      unitStatusClean !== 'sold'

                    const wasPriceSyncedByAdmin = diffs.includes(
                      ADMIN_SYNCED_PRICE_TAG
                    )
                    const isSellerDelayedCancel = diffs.includes(
                      SELLER_DELAYED_UNAVAILABLE_TAG
                    )

                    const currentUnitPaid = Number(
                      u?.paid_amount || offer.required_cash || 0
                    )
                    const didInstallmentIncrease =
                      currentUnitPaid > Number(offer.required_cash || 0)

                    const waConfirmText = `${t.waFastTrackOfferMsgPrefix} (${refCode}) ${t.waFastTrackOfferMsgMiddle} (${unitTitle}${unitCode ? ` · ${unitCode}` : ''}) — ${Number(offer.offered_cash).toLocaleString('en-US')} ${cur} ${t.waFastTrackOfferMsgSuffix}\n${siteOrigin}/admin/offers?offerId=${offer.id}`

                    const isWaBtnHidden =
                      Boolean(hiddenWaOfferIds[offer.id]) ||
                      (offer.status !== 'pending_admin' &&
                        offer.status !== 'pending_seller')

                    if (isUnitSoldToOther || isUnitWithdrawn) {
                      return (
                        <div
                          key={offer.id}
                          className="rounded-[20px] border border-gray-200 bg-gray-50/80 p-4 text-start sm:p-5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {unitCode && (
                                <span
                                  dir="ltr"
                                  className="inline-flex items-center rounded-lg bg-[#0a1122] px-2.5 py-1 font-mono text-[11px] font-bold text-white"
                                >
                                  {unitCode}
                                </span>
                              )}
                              <span className="inline-flex items-center rounded-lg bg-gray-200 px-2.5 py-1 font-mono text-[11px] font-extrabold text-gray-600">
                                #{refCode}
                              </span>
                            </div>
                            <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-3 py-1 text-[11px] font-extrabold text-gray-700">
                              {isUnitSoldToOther
                                ? t.unitSoldFinalBadge
                                : t.unitUnavailableBadge}
                            </span>
                          </div>
                          <h3 className="mt-2 text-sm font-black text-gray-700 sm:text-base">
                            {unitTitle} —{' '}
                            {getLocalizedGeorgiaAreaName(u?.area, locale)}
                          </h3>
                          <p className="mt-1.5 text-xs leading-relaxed font-semibold text-gray-600">
                            {isUnitSoldToOther
                              ? t.unitSoldToOtherCardDesc
                              : t.unitWithdrawnCardDesc}
                          </p>
                          <div className="mt-3.5 flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() =>
                                handleManageBuyerOwnOffer(
                                  offer.id,
                                  'dismiss_from_list',
                                  undefined,
                                  true
                                )
                              }
                              className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#007a5a] px-4 py-2 text-xs font-extrabold text-white transition hover:bg-[#006248]"
                            >
                              <Radar className="size-3.5" />
                              <span>{t.viewAlternativesAndDismissBtn}</span>
                            </button>
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div
                        key={offer.id}
                        className={`rounded-[20px] border p-4 text-start transition sm:p-5 ${
                          offer.status === 'accepted'
                            ? 'border-2 border-[#007a5a] bg-emerald-50/25'
                            : isReopenedPromptActive
                              ? 'border-2 border-amber-400 bg-amber-50/20'
                              : 'border-gray-200 bg-[#fcfdfd]'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {unitCode && (
                              <span
                                dir="ltr"
                                className="inline-flex items-center rounded-lg bg-[#0a1122] px-2.5 py-1 font-mono text-[11px] font-bold text-white"
                              >
                                {unitCode}
                              </span>
                            )}
                            <span className="inline-flex items-center rounded-lg bg-gray-100 px-2.5 py-1 font-mono text-[11px] font-extrabold text-gray-600">
                              #{refCode}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            {(offer.status === 'counter_offered' ||
                              offer.status === 'pending_seller') && (
                              <OfferSentElapsedBadge
                                updatedAt={offer.updated_at || offer.created_at}
                                t={t}
                              />
                            )}

                            {offer.status === 'pending_admin' ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-3 py-1 text-[11px] font-extrabold text-sky-900">
                                📋 {t.statusPendingAdminReviewBadge}
                              </span>
                            ) : offer.status === 'pending_seller' ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-extrabold text-amber-800">
                                ⏳ {t.statusWaitingSellerBadge}
                              </span>
                            ) : offer.status === 'accepted' ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#007a5a] px-3 py-1 text-[11px] font-extrabold text-white">
                                ✓ {t.statusAcceptedBadge}
                              </span>
                            ) : isReopenedPromptActive ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/90 px-3 py-1 text-[11px] font-black text-[#0a1122]">
                                🔥 {t.reopenedUnitAvailableBadge}
                              </span>
                            ) : offer.status === 'unit_locked' ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-3 py-1 text-[11px] font-extrabold text-slate-700">
                                ⏳ {t.statusLockedOtherBuyer}
                              </span>
                            ) : offer.status === 'counter_offered' ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-[11px] font-extrabold text-purple-900">
                                🔄 {t.statusCounterSentBadge}
                              </span>
                            ) : offer.status === 'rejected' ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-[11px] font-bold text-red-700">
                                {t.statusRejectedBadge}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <h3 className="mt-2.5 text-sm leading-relaxed font-black text-[#0a1122] sm:text-base">
                          {unitTitle} —{' '}
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
                            {wasPriceSyncedByAdmin && (
                              <span className="mt-1 block text-[10.5px] font-bold text-sky-800">
                                ✓ {t.priceSyncedByAdvisorNote}
                              </span>
                            )}
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

                        {offer.status === 'pending_admin' && (
                          <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50/70 p-3">
                            {editingBuyerOfferId === offer.id ? (
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <input
                                  type="text"
                                  dir="ltr"
                                  value={editingBuyerCashStr}
                                  onChange={(e) => {
                                    const raw = toEnglishDigits(
                                      e.target.value
                                    ).replace(/[^\d]/g, '')
                                    setEditingBuyerCashStr(
                                      raw
                                        ? Number(raw).toLocaleString('en-US')
                                        : ''
                                    )
                                  }}
                                  className="h-10 flex-1 rounded-xl border border-gray-300 bg-white px-3 text-sm font-black text-[#0a1122]"
                                />
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    disabled={isPending}
                                    onClick={() => {
                                      const val =
                                        Number(
                                          toEnglishDigits(
                                            editingBuyerCashStr
                                          ).replace(/,/g, '')
                                        ) || 0
                                      handleManageBuyerOwnOffer(
                                        offer.id,
                                        'update_pending_price',
                                        val
                                      )
                                    }}
                                    className="rounded-xl bg-[#007a5a] px-4 py-2 text-xs font-extrabold text-white"
                                  >
                                    {t.savePriceBtn}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingBuyerOfferId(null)}
                                    className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-600"
                                  >
                                    {t.cancelBtn}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                <span className="font-semibold text-gray-600">
                                  {t.preAdminEditHint}
                                </span>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingBuyerOfferId(offer.id)
                                      setEditingBuyerCashStr(
                                        Number(
                                          offer.offered_cash
                                        ).toLocaleString('en-US')
                                      )
                                    }}
                                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 font-extrabold text-[#0a1122] hover:bg-gray-100"
                                  >
                                    <Edit3 className="size-3.5 text-[#007a5a]" />
                                    <span>{t.editOfferPriceBtn}</span>
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isPending}
                                    onClick={() =>
                                      handleManageBuyerOwnOffer(
                                        offer.id,
                                        'cancel_offer'
                                      )
                                    }
                                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 font-bold text-red-600 hover:bg-red-100"
                                  >
                                    <Trash2 className="size-3.5" />
                                    <span>{t.withdrawOfferBtn}</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {isReopenedPromptActive && (
                          <div className="mt-4 rounded-2xl border-2 border-amber-400 bg-amber-50/90 p-4">
                            <p className="text-xs leading-relaxed font-extrabold text-[#0a1122] sm:text-sm">
                              🔥 {t.reopenedPromptTitle}
                            </p>
                            {didInstallmentIncrease && (
                              <p className="mt-1.5 rounded-lg bg-white/90 p-2 text-[11px] font-bold text-amber-900">
                                ℹ️ {t.installmentIncreasedNote}:{' '}
                                <strong dir="ltr">
                                  {currentUnitPaid.toLocaleString('en-US')}{' '}
                                  {cur}
                                </strong>
                              </p>
                            )}

                            {editingBuyerOfferId === offer.id ? (
                              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                                <input
                                  type="text"
                                  dir="ltr"
                                  value={editingBuyerCashStr}
                                  onChange={(e) => {
                                    const raw = toEnglishDigits(
                                      e.target.value
                                    ).replace(/[^\d]/g, '')
                                    setEditingBuyerCashStr(
                                      raw
                                        ? Number(raw).toLocaleString('en-US')
                                        : ''
                                    )
                                  }}
                                  className="h-10 flex-1 rounded-xl border border-gray-300 bg-white px-3 text-sm font-black text-[#0a1122]"
                                />
                                <button
                                  type="button"
                                  disabled={isPending}
                                  onClick={() => {
                                    const val =
                                      Number(
                                        toEnglishDigits(
                                          editingBuyerCashStr
                                        ).replace(/,/g, '')
                                      ) || Number(offer.offered_cash)
                                    handleManageBuyerOwnOffer(
                                      offer.id,
                                      'confirm_reopened_interest',
                                      val
                                    )
                                  }}
                                  className="rounded-xl bg-[#007a5a] px-4 py-2.5 text-xs font-extrabold text-white"
                                >
                                  {t.confirmReopenedBtn}
                                </button>
                              </div>
                            ) : (
                              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                                <button
                                  type="button"
                                  disabled={isPending}
                                  onClick={() =>
                                    handleManageBuyerOwnOffer(
                                      offer.id,
                                      'confirm_reopened_interest'
                                    )
                                  }
                                  className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#007a5a] px-4 py-2 text-xs font-extrabold text-white shadow-2xs transition hover:bg-[#006248]"
                                >
                                  <Check className="size-4" />
                                  <span>
                                    {t.confirmReopenedBtn} (
                                    {Number(offer.offered_cash).toLocaleString(
                                      'en-US'
                                    )}{' '}
                                    {cur})
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingBuyerOfferId(offer.id)
                                    setEditingBuyerCashStr(
                                      Number(
                                        offer.offered_cash
                                      ).toLocaleString('en-US')
                                    )
                                  }}
                                  className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-extrabold text-[#0a1122]"
                                >
                                  <Edit3 className="size-3.5 text-[#007a5a]" />
                                  <span>{t.confirmWithNewPriceBtn}</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={isPending}
                                  onClick={() =>
                                    handleManageBuyerOwnOffer(
                                      offer.id,
                                      'dismiss_from_list'
                                    )
                                  }
                                  className="inline-flex min-h-[42px] items-center justify-center rounded-xl border border-red-200 bg-white px-3.5 py-2 text-xs font-bold text-red-600"
                                >
                                  {t.notInterestedAnymoreBtn}
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {offer.status === 'unit_locked' &&
                          !isReopenedPromptActive && (
                            <div className="mt-3.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs font-semibold text-slate-700">
                              <p>{t.waitlistBuyerCardNote}</p>
                              <button
                                type="button"
                                onClick={() =>
                                  smartRecsRef.current?.scrollIntoView({
                                    behavior: 'smooth',
                                  })
                                }
                                className="mt-2 inline-flex items-center gap-1 font-extrabold text-[#007a5a] underline"
                              >
                                <span>{t.exploreAlternativeUnitsLink}</span>
                              </button>
                            </div>
                          )}

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
                          <div className="mt-3.5 space-y-2 rounded-xl border border-[#007a5a]/30 bg-[#eaf8f2] p-3.5 text-xs font-bold text-[#007a5a]">
                            <p>🎉 {t.dealLockedBannerForBuyer}</p>
                            <a
                              href={`https://wa.me/${supportWhatsApp}?text=${encodeURIComponent(
                                `${t.waFastTrackOfferMsgPrefix} (#${refCode}) ${t.waFastTrackOfferMsgMiddle} (${unitTitle}${unitCode ? ` · ${unitCode}` : ''})`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#0a1122] underline hover:text-[#007a5a]"
                            >
                              <MessageCircle className="size-3.5 text-[#25D366]" />
                              <span>{t.contactDealManagerWaLink}</span>
                            </a>
                          </div>
                        )}

                        {offer.status === 'counter_offered' &&
                          offer.counter_cash && (
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
                                  <span>
                                    {t.acceptCounterBtn} (
                                    {Number(offer.counter_cash).toLocaleString(
                                      'en-US'
                                    )}{' '}
                                    {cur})
                                  </span>
                                </button>

                                <a
                                  href={`https://wa.me/${supportWhatsApp}?text=${encodeURIComponent(
                                    `${t.waFastTrackOfferMsgPrefix} (#${refCode}) ${t.waFastTrackOfferMsgMiddle} (${unitTitle}${unitCode ? ` · ${unitCode}` : ''}) — ${Number(offer.counter_cash).toLocaleString('en-US')} ${cur}`
                                  )}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-[#25D366] bg-white px-4 py-2.5 text-center text-xs font-extrabold text-[#0a1122] transition hover:bg-emerald-50"
                                >
                                  <MessageCircle className="size-4 shrink-0 text-[#25D366]" />
                                  <span>{t.contactAdvisorWaBtn}</span>
                                </a>
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
                                  className="inline-flex min-h-[40px] w-full items-center justify-center rounded-xl border border-red-200 bg-white px-4 py-2 text-center text-xs font-bold text-red-600 transition hover:bg-red-50"
                                >
                                  {t.rejectOfferBtn}
                                </button>
                              </div>
                            </div>
                          )}

                        {offer.status === 'rejected' && (
                          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs">
                            <p className="font-bold text-amber-950">
                              {isSellerDelayedCancel
                                ? t.sellerDelayedBuyerNote
                                : t.offerClosedSimpleNote}
                            </p>
                            <div className="mt-2.5 flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() =>
                                  handleManageBuyerOwnOffer(
                                    offer.id,
                                    'dismiss_from_list',
                                    undefined,
                                    true
                                  )
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg bg-[#007a5a] px-3.5 py-1.5 text-xs font-extrabold text-white hover:bg-[#006248]"
                              >
                                <Radar className="size-3.5" />
                                <span>{t.viewAlternativesAndDismissBtn}</span>
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

            {advisorPickedRecs.length > 0 && (
              <section className="rounded-[24px] border-2 border-amber-300/90 bg-amber-50/45 p-4 shadow-xs sm:p-6">
                <div className="mb-4 flex items-center gap-2.5 border-b border-amber-200/70 pb-3.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-[#0a1122] shadow-2xs">
                    <Star className="size-4.5 fill-current" />
                  </span>
                  <div>
                    <h2 className="text-sm font-black text-[#0a1122] sm:text-base">
                      {t.advisorPicksSectionTitle} ({advisorPickedRecs.length})
                    </h2>
                    <p className="text-[11px] font-medium text-amber-950/80">
                      {t.advisorPicksSectionSubtitle}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {advisorPickedRecs.map(renderRecommendationCard)}
                </div>
              </section>
            )}

            <section
              ref={smartRecsRef}
              className="rounded-[24px] border border-emerald-200/80 bg-[#effaf5]/40 p-4 sm:p-6"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/60 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#007a5a] text-white">
                    <Radar className="size-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-black text-[#0a1122] sm:text-base">
                      {t.smartRecsTitle} ({autoMatchedRecs.length})
                    </h2>
                    <p className="text-[11px] text-gray-500">
                      {t.smartRecsSubtitle}
                    </p>
                  </div>
                </div>
              </div>

              {autoMatchedRecs.length === 0 ? (
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
                  {autoMatchedRecs.map(renderRecommendationCard)}
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