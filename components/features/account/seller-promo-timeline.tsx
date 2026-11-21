'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Crown,
  Eye,
  EyeOff,
  Flame,
  Loader2,
  Lock,
  MessageCircle,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Star,
  Trash2,
  Wallet,
  Zap,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { calculateGelBoostPackage } from '@/components/features/home/home-market-sections'
import { useTranslation, type LocaleCode } from '@/lib/i18n'
import {
  getUnifiedUnitCode,
  getUnifiedUnitHeadline,
  type ConfirmModalState,
  type SellerUnitItem,
} from './seller-unit-helpers'

function formatDateTimeShort(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const datePart = d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const timePart = d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  return `${datePart} · ${timePart}`
}

function formatRemainingBreakdown(
  untilIso: string | null | undefined,
  dayWord: string,
  hourWord: string,
  minWord: string
): string {
  if (!untilIso) return '—'
  const diffMs = new Date(untilIso).getTime() - Date.now()
  if (diffMs <= 0) return `0 ${hourWord}`
  const totalMinutes = Math.floor(diffMs / 60000)
  const days = Math.floor(totalMinutes / (60 * 24))
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
  const mins = totalMinutes % 60
  if (days > 0) {
    return hours > 0
      ? `${days} ${dayWord} · ${hours} ${hourWord}`
      : `${days} ${dayWord}`
  }
  if (hours > 0) {
    return `${hours} ${hourWord} · ${mins} ${minWord}`
  }
  return `${Math.max(1, mins)} ${minWord}`
}

export function SellerPromoSection({
  t,
  activeUnit,
  supportWhatsApp,
  boostState,
  initialAmount,
  onNavigateMissing,
  isPromoCollapsed,
  setIsPromoCollapsed,
  isCurrentlyFeatured,
  isPendingPromo,
  remainingFeaturedDays,
  activePromoDays,
  activePromoPrice,
  currentAdRef,
  copiedAdRef,
  setCopiedAdRef,
  isPending,
}: {
  t: Record<string, any>
  activeUnit: SellerUnitItem
  supportWhatsApp: string
  boostState: 'active' | 'pending_review' | 'incomplete'
  initialAmount?: number
  missingActionHref?: string
  onNavigateMissing?: () => void
  isPromoCollapsed: boolean
  setIsPromoCollapsed: (v: boolean) => void
  isCurrentlyFeatured: boolean
  isPendingPromo: boolean
  remainingFeaturedDays: number
  activePromoDays: number
  activePromoPrice: number
  currentAdRef: string | null
  copiedAdRef: boolean
  setCopiedAdRef: (v: boolean) => void
  dynamicPackages?: Array<{ days: any; price: number; label: string }>
  currencySymbol?: string
  isPending: boolean
  onBoostRequested?: (info: {
    orderRef: string
    days: number
    price: number
    tier: 'super_vip' | 'vip_plus'
    message?: string
  }) => void
  onCancelPromo?: () => void
}) {
  const { locale } = useTranslation() as Record<string, any>
  const activeLocale = (locale as LocaleCode) || 'ar'
  const GEL = '₾'

  const unitMeta = (activeUnit.documents?.__unit_meta || {}) as Record<
    string,
    any
  >
  const boostActiveMeta = (unitMeta.boost_active || null) as {
    started_at?: string | null
    ends_at?: string | null
    total_days?: number
    tier?: 'super_vip' | 'vip_plus'
    views_baseline?: number
    order_ref?: string | null
    amount_gel?: number | null
  } | null

  const boostPendingMeta = (unitMeta.boost_pending || null) as {
    order_ref?: string | null
    paid_via?: string | null
    paid_at?: string | null
    tier?: 'super_vip' | 'vip_plus'
    days?: number
    amount_gel?: number
    is_renewal?: boolean
  } | null

  const boostLastRejected = (unitMeta.boost_last_rejected || null) as {
    order_ref?: string | null
    rejected_at?: string | null
    reason?: string | null
    paid_via?: string | null
  } | null

  const hasExpiredPreviousBoost =
    !isCurrentlyFeatured &&
    !isPendingPromo &&
    !boostPendingMeta &&
    Boolean(activeUnit.featured_until) &&
    new Date(activeUnit.featured_until as string).getTime() <= Date.now()

  const defaultAmt = initialAmount && initialAmount >= 5 ? initialAmount : 10

  const [selectedPreset, setSelectedPreset] = useState<number | 'custom'>(
    [5, 10, 20, 50, 100].includes(defaultAmt) ? defaultAmt : 'custom'
  )
  const [topUpAmount, setTopUpAmount] = useState<number>(defaultAmt)
  const [showRenewalPicker, setShowRenewalPicker] = useState<boolean>(
    Boolean(initialAmount && initialAmount >= 5)
  )
  const [submittingPayment, setSubmittingPayment] = useState(false)
  const [renewingSameBusy, setRenewingSameBusy] = useState(false)
  const [boostNotice, setBoostNotice] = useState<{
    text: string
    isError?: boolean
  } | null>(null)

  useEffect(() => {
    if (initialAmount && initialAmount >= 5) {
      setTopUpAmount(initialAmount)
      setSelectedPreset(
        [5, 10, 20, 50, 100].includes(initialAmount) ? initialAmount : 'custom'
      )
      setShowRenewalPicker(true)
    }
  }, [initialAmount])

  const pkgDetails = useMemo(
    () => calculateGelBoostPackage(topUpAmount, activeLocale),
    [topUpAmount, activeLocale]
  )

  const unitCode = getUnifiedUnitCode(activeUnit.id, activeUnit.code)
  const unitHeadline = getUnifiedUnitHeadline(activeUnit, t.defaultProjectName)
  const currentTier: 'super_vip' | 'vip_plus' =
    (activeUnit as any).boost_tier === 'vip_plus' ||
    boostActiveMeta?.tier === 'vip_plus'
      ? 'vip_plus'
      : 'super_vip'

  const totalViews = Math.max(0, Number((activeUnit as any).views_count) || 0)
  const viewsBaseline =
    typeof boostActiveMeta?.views_baseline === 'number'
      ? boostActiveMeta.views_baseline
      : null
  const viewsGainedSinceBoost =
    viewsBaseline !== null ? Math.max(0, totalViews - viewsBaseline) : null

  const activeEndsAtIso =
    activeUnit.featured_until || boostActiveMeta?.ends_at || null
  const activeStartedAtIso = boostActiveMeta?.started_at || null

  const sameRenewalAmount = Math.max(
    5,
    Number(
      boostActiveMeta?.amount_gel ||
        activeUnit.featured_price ||
        (currentTier === 'vip_plus' ? 5 : 10)
    )
  )
  const sameRenewalPkg = useMemo(
    () => calculateGelBoostPackage(sameRenewalAmount, activeLocale),
    [sameRenewalAmount, activeLocale]
  )

  const presets = [
    {
      id: 5,
      val: 5,
      topBadge: t.starterBadge,
      subText: `VIP+ · 1 ${t.dayWord || ''}`,
    },
    {
      id: 10,
      val: 10,
      topBadge: t.recommendedBadge,
      subText: 'SUPER VIP',
      isRecommended: true,
    },
    {
      id: 20,
      val: 20,
      topBadge: '',
      subText: 'SUPER VIP',
    },
    {
      id: 50,
      val: 50,
      topBadge: `${t.popularBadge} -25%`,
      subText: 'SUPER VIP',
    },
    {
      id: 100,
      val: 100,
      topBadge: 'PRO -30%',
      subText: 'SUPER VIP',
    },
    {
      id: 'custom' as const,
      val: 0,
      topBadge: t.customAmountLabel,
      subText: t.anySub,
    },
  ]

  const startFlittCheckout = async (opts: {
    tier: 'super_vip' | 'vip_plus'
    days: number
    amountGel: number
    isSameRenew?: boolean
  }) => {
    if (boostState !== 'active') {
      if (boostState === 'incomplete') onNavigateMissing?.()
      return
    }

    if (opts.isSameRenew) setRenewingSameBusy(true)
    else setSubmittingPayment(true)
    setBoostNotice(null)

    try {
      const res = await fetch('/api/payments/flitt/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId: activeUnit.id,
          tier: opts.tier,
          days: opts.days,
          amountGel: opts.amountGel,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok && data?.checkoutUrl) {
        window.location.href = data.checkoutUrl
        return
      }

      if (data?.error === 'FLITT_NOT_CONFIGURED') {
        setBoostNotice({ text: t.flittNotConfiguredErr, isError: true })
      } else if (data?.error === 'UNIT_MUST_BE_ACTIVE_TO_BOOST') {
        setBoostNotice({ text: t.boostNotPublishedTitle, isError: true })
      } else {
        setBoostNotice({
          text: data?.details
            ? `${t.flittInitFailedErr} (${data.details})`
            : t.flittInitFailedErr,
          isError: true,
        })
      }
    } catch {
      setBoostNotice({ text: t.flittInitFailedErr, isError: true })
    } finally {
      setSubmittingPayment(false)
      setRenewingSameBusy(false)
    }
  }

  if (isPromoCollapsed) {
    return (
      <div
        id="promo-section"
        className="mt-5 flex items-center justify-between rounded-2xl border border-[#aae3cb] bg-[#effaf5] px-4 py-3.5 shadow-2xs"
      >
        <div className="flex items-center gap-2 text-start">
          <Star className="size-4 shrink-0 fill-amber-400 text-amber-500" />
          <span className="text-xs font-extrabold text-[var(--brand-navy,#0a1122)]">
            {t.promoCollapsedTitle}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsPromoCollapsed(false)}
          className="shrink-0 rounded-xl bg-[var(--brand-primary,#007a5a)] px-3.5 py-2 text-xs font-extrabold text-white transition hover:bg-[var(--brand-primary-hover,#006248)]"
        >
          {t.promoCollapsedBtn}
        </button>
      </div>
    )
  }

  const effectivePendingRef = boostPendingMeta?.order_ref || currentAdRef || ''
  const effectivePendingDays = boostPendingMeta?.days || activePromoDays
  const effectivePendingAmount = boostPendingMeta?.amount_gel || activePromoPrice
  const effectivePendingTierLabel =
    (boostPendingMeta?.tier || (activeUnit as any).boost_tier) === 'vip_plus'
      ? '+VIP'
      : 'SUPER VIP'
  const isWaitingActivationOnly =
    !isCurrentlyFeatured && (isPendingPromo || Boolean(boostPendingMeta))

  const waSpeedUpMsg = `${t.waSpeedUpMsgPrefix || t.whatsappPromoMsgPrefix} (${effectivePendingTierLabel} · ${effectivePendingDays} ${t.daysWord} · ${effectivePendingAmount} ${GEL}) — ${unitHeadline} (${unitCode}) · Ref: ${effectivePendingRef}`
  const waRefundMsg = `${t.waRefundMsgPrefix || t.whatsappPromoMsgPrefix} ${effectivePendingRef || boostLastRejected?.order_ref || unitCode} — ${unitHeadline} (${unitCode})`

  const showPackagePicker =
    boostState === 'active' &&
    !isWaitingActivationOnly &&
    (!isCurrentlyFeatured || showRenewalPicker)

  return (
    <section
      id="promo-section"
      className="mt-5 rounded-[24px] border border-slate-200/90 bg-white p-4 text-start shadow-xs sm:p-6"
    >
      {/* الهيدر العلوي */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-extrabold text-[#2563eb] sm:text-xs">
            <Star className="size-3.5 fill-amber-400 text-amber-500" />
            <span>{t.boostHeaderBadge}</span>
          </span>

          {isCurrentlyFeatured && (
            <span className="rounded-full bg-[#eaf8f2] px-2.5 py-1 text-[11px] font-extrabold text-[#007a5a]">
              {t.promoActiveBadgePrefix} {remainingFeaturedDays} {t.dayWord})
            </span>
          )}

          {isWaitingActivationOnly && (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-extrabold text-amber-900">
              {t.promoPendingBadgePrefix} ({effectivePendingDays} {t.daysWord})
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsPromoCollapsed(true)}
          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-gray-500 transition hover:bg-slate-200 hover:text-gray-800"
        >
          <EyeOff className="size-3.5" />
          <span>{t.hidePromoBtn}</span>
        </button>
      </div>

      {/* حالة 1: الوحدة لم تُنشر بعد (قفل الدفع تماماً لحماية أموال البائع) */}
      {boostState !== 'active' && (
        <div className="mt-4 rounded-2xl border-2 border-amber-200 bg-amber-50/75 p-4 text-xs">
          <div className="flex items-start gap-2.5">
            <Lock className="mt-0.5 size-4.5 shrink-0 text-amber-600" />
            <div className="flex-1">
              <strong className="block text-xs font-black text-amber-950 sm:text-sm">
                {boostState === 'incomplete'
                  ? t.boostIncompleteTitle
                  : t.boostNotPublishedTitle}
              </strong>
              <p className="mt-1 leading-relaxed font-medium text-amber-900/90">
                {boostState === 'incomplete'
                  ? t.boostIncompleteDesc
                  : t.boostNotPublishedDesc}
              </p>

              <div className="mt-3">
                {boostState === 'incomplete' ? (
                  <button
                    type="button"
                    onClick={() => onNavigateMissing?.()}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-amber-600 px-4 text-xs font-extrabold text-white transition hover:bg-amber-700"
                  >
                    <span>{t.boostIncompleteCtaBtn}</span>
                    <ArrowUpRight className="size-3.5" />
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-white px-3.5 py-2 text-[11px] font-extrabold text-amber-900">
                    <Clock className="size-3.5 text-amber-600" />
                    <span>{t.boostWaitingReviewBtn}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* حالة 2: طلب مدفوع بانتظار موافقة الإدارة */}
      {isWaitingActivationOnly && (
        <div className="mt-4 space-y-3 rounded-2xl border-2 border-emerald-200 bg-[#f5fbf8] p-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#007a5a] text-white">
                <CheckCircle2 className="size-4.5" />
              </span>
              <div>
                <h4 className="text-xs font-black text-[#0f1d40] sm:text-sm">
                  {t.boostPaidWaitingTitle}
                </h4>
              </div>
            </div>

            <span className="inline-flex items-center gap-1 rounded-full bg-[#007a5a] px-2.5 py-1 text-[10.5px] font-extrabold text-white">
              <CreditCard className="size-3" />
              <span>{t.boostPaidWaitingBadge}</span>
            </span>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50/80 px-3.5 py-2.5 text-[11.5px] leading-relaxed font-bold text-[#0f1d40]">
            ⏳ {t.boostDaysStartAfterApprovalNote}
          </div>

          <div className="grid grid-cols-2 gap-2.5 rounded-xl border border-slate-200/80 bg-white p-3 text-[11px]">
            <div>
              <span className="block text-[10px] font-semibold text-slate-400">
                {t.boostPackageLabel}
              </span>
              <strong className="mt-0.5 block font-black text-[#0f1d40]">
                {effectivePendingTierLabel} · {effectivePendingDays}{' '}
                {t.daysWord}
              </strong>
            </div>
            <div>
              <span className="block text-[10px] font-semibold text-slate-400">
                {t.boostAmountPaidLabel}
              </span>
              <strong dir="ltr" className="mt-0.5 block font-black text-[#007a5a]">
                {Number(effectivePendingAmount).toLocaleString('en-US')} {GEL}
              </strong>
            </div>
            <div>
              <span className="block text-[10px] font-semibold text-slate-400">
                {t.boostPaidAtLabel}
              </span>
              <strong dir="ltr" className="mt-0.5 block font-bold text-slate-700">
                {formatDateTimeShort(boostPendingMeta?.paid_at)}
              </strong>
            </div>
            <div>
              <span className="block text-[10px] font-semibold text-slate-400">
                {t.boostRefLabel}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (!effectivePendingRef) return
                  navigator.clipboard?.writeText(effectivePendingRef)
                  setCopiedAdRef(true)
                  setTimeout(() => setCopiedAdRef(false), 2000)
                }}
                className="mt-0.5 inline-flex items-center gap-1 font-mono text-[11px] font-black text-[#007a5a] hover:underline"
              >
                <span dir="ltr">{effectivePendingRef || '—'}</span>
                <Copy className="size-3" />
                {copiedAdRef && (
                  <span className="font-sans text-[10px]">{t.copiedBtn}</span>
                )}
              </button>
            </div>
          </div>

          <a
            href={`https://wa.me/${supportWhatsApp}?text=${encodeURIComponent(waSpeedUpMsg)}`}
            target="_blank"
            rel="noreferrer"
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 text-xs font-extrabold text-white shadow-2xs transition hover:opacity-95"
          >
            <MessageCircle className="size-4 shrink-0" />
            <span>{t.boostSpeedUpWaBtn}</span>
          </a>

          <p className="text-center text-[11px] font-semibold text-slate-500">
            {t.boostRefundSupportNote}{' '}
            <a
              href={`https://wa.me/${supportWhatsApp}?text=${encodeURIComponent(waRefundMsg)}`}
              target="_blank"
              rel="noreferrer"
              className="font-extrabold text-[#007a5a] underline"
            >
              {t.boostRefundSupportLink}
            </a>
          </p>
        </div>
      )}

      {/* حالة 3: إعلان نشط حالياً — لوحة متابعة مباشرة + خيارات التجديد والترقية */}
      {isCurrentlyFeatured && (
        <div className="mt-4 space-y-3 rounded-2xl border-2 border-amber-300/90 bg-gradient-to-b from-amber-50/40 to-white p-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-xl text-white ${
                  currentTier === 'vip_plus'
                    ? 'bg-gradient-to-r from-[#4f46e5] to-[#7c3aed]'
                    : 'bg-gradient-to-r from-[#ff6437] to-[#ff4f69]'
                }`}
              >
                {currentTier === 'vip_plus' ? (
                  <Flame className="size-4" />
                ) : (
                  <Crown className="size-4" />
                )}
              </span>
              <div>
                <h4 className="text-xs font-black text-[#0f1d40] sm:text-sm">
                  {t.boostActiveLiveTitle}
                </h4>
                <span className="text-[11px] font-extrabold text-[#007a5a]">
                  {currentTier === 'vip_plus' ? '+VIP' : 'SUPER VIP'} ·{' '}
                  {t.boostActiveLiveBadge}
                </span>
              </div>
            </div>

            {boostActiveMeta?.order_ref && (
              <span
                dir="ltr"
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 font-mono text-[10.5px] font-bold text-slate-600"
              >
                {boostActiveMeta.order_ref}
              </span>
            )}
          </div>

          {/* 4 بطاقات إحصائيات الإعلان النشط */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200/80 bg-white p-2.5">
              <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                <CalendarClock className="size-3 text-[#007a5a]" />
                <span>{t.boostStartedAtLabel}</span>
              </span>
              <strong
                dir="ltr"
                className="mt-1 block text-[11px] font-black text-[#0f1d40]"
              >
                {formatDateTimeShort(activeStartedAtIso)}
              </strong>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white p-2.5">
              <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                <Clock className="size-3 text-amber-600" />
                <span>{t.boostEndsAtLabel}</span>
              </span>
              <strong
                dir="ltr"
                className="mt-1 block text-[11px] font-black text-[#0f1d40]"
              >
                {formatDateTimeShort(activeEndsAtIso)}
              </strong>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-[#eaf8f2]/70 p-2.5">
              <span className="block text-[10px] font-bold text-[#007a5a]">
                {t.boostRemainingTimeLabel}
              </span>
              <strong className="mt-1 block text-[11.5px] font-black text-[#0f1d40]">
                {formatRemainingBreakdown(
                  activeEndsAtIso,
                  t.dayWord || '',
                  t.boostHoursWord || '',
                  t.boostMinutesWord || ''
                )}
              </strong>
            </div>

            <div className="rounded-xl border border-blue-200/80 bg-blue-50/50 p-2.5">
              <span className="flex items-center gap-1 text-[10px] font-bold text-[#2563eb]">
                <Eye className="size-3" />
                <span>{t.boostViewsDuringLabel}</span>
              </span>
              <strong
                dir="ltr"
                className="mt-1 block text-xs font-black text-[#0f1d40] tabular-nums"
              >
                {totalViews.toLocaleString('en-US')}
              </strong>
              {viewsGainedSinceBoost !== null && (
                <span className="block text-[9.5px] font-extrabold text-[#007a5a]">
                  {t.boostViewsSinceBoostPrefix}
                  {viewsGainedSinceBoost} {t.boostViewsSinceBoostSuffix}
                </span>
              )}
            </div>
          </div>

          {/* تنبيه إذا كان هناك طلب تمديد مدفوع بالفعل بانتظار موافقة الإدارة */}
          {boostPendingMeta?.is_renewal && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-300 bg-[#eaf8f2] p-3 text-xs">
              <div className="flex-1">
                <strong className="block font-black text-[#007a5a]">
                  ✓ {t.boostPendingRenewalTitle}
                </strong>
                <p className="mt-0.5 text-[11px] font-semibold text-[#0f1d40]">
                  {String(t.boostPendingRenewalDesc || '').replace(
                    '{days}',
                    String(boostPendingMeta.days || 1)
                  )}
                </p>
              </div>
              <a
                href={`https://wa.me/${supportWhatsApp}?text=${encodeURIComponent(waSpeedUpMsg)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-[#25D366] px-3 text-[11px] font-extrabold text-white"
              >
                <MessageCircle className="size-3.5" />
                <span>{t.boostSpeedUpWaBtn}</span>
              </a>
            </div>
          )}

          {/* أزرار التجديد أو اختيار باقة أخرى */}
          {!boostPendingMeta?.is_renewal && (
            <div className="flex flex-col gap-2 pt-1 sm:flex-row">
              <button
                type="button"
                disabled={isPending || renewingSameBusy}
                onClick={() =>
                  startFlittCheckout({
                    tier:
                      sameRenewalPkg.tier === 'VIP+' ? 'vip_plus' : 'super_vip',
                    days: sameRenewalPkg.days,
                    amountGel: sameRenewalPkg.amount,
                    isSameRenew: true,
                  })
                }
                className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-4 text-xs font-extrabold text-white shadow-2xs transition hover:opacity-95 disabled:opacity-60"
              >
                {renewingSameBusy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-3.5" />
                )}
                <span>
                  {t.boostRenewSameBtn} ({sameRenewalPkg.amount} {GEL})
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowRenewalPicker((prev) => !prev)}
                className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 text-xs font-extrabold text-[#0f1d40] transition hover:bg-slate-50"
              >
                <Sparkles className="size-3.5 text-[#2563eb]" />
                <span>
                  {showRenewalPicker
                    ? t.boostHidePickerBtn
                    : t.boostChooseOtherBtn}
                </span>
              </button>
            </div>
          )}

          <p className="text-[10.5px] leading-relaxed font-medium text-slate-500">
            ℹ️ {t.boostExtensionNote}
          </p>
        </div>
      )}

      {/* تنبيهات انتهاء الباقة السابقة أو رفض آخر طلب */}
      {boostState === 'active' &&
        !isCurrentlyFeatured &&
        !isWaitingActivationOnly &&
        boostLastRejected && (
          <div className="mt-3.5 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs">
            <strong className="block font-extrabold text-rose-900">
              {t.boostRejectedBannerTitle}
            </strong>
            {boostLastRejected.reason && (
              <p className="mt-0.5 text-[11px] font-semibold text-rose-800">
                {boostLastRejected.reason}
              </p>
            )}
            <p className="mt-1 text-[11px] font-medium text-rose-700">
              {t.boostRejectedRefundHint}{' '}
              <a
                href={`https://wa.me/${supportWhatsApp}?text=${encodeURIComponent(waRefundMsg)}`}
                target="_blank"
                rel="noreferrer"
                className="font-extrabold underline"
              >
                {t.boostRefundSupportLink}
              </a>
            </p>
          </div>
        )}

      {boostState === 'active' && hasExpiredPreviousBoost && (
        <div className="mt-3.5 rounded-xl border border-blue-200 bg-blue-50/70 px-3.5 py-2.5 text-xs font-bold text-[#0f1d40]">
          ✨ {t.boostEndedBanner}
        </div>
      )}

      {/* اختيار الباقات والدفع عبر Flitt */}
      {showPackagePicker && (
        <div className="mt-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-extrabold text-[#0f1d40] sm:text-base">
                {t.boostUnitPrefix} {unitHeadline}
              </h3>
              <p className="mt-0.5 text-[11px] text-slate-500">
                {t.boostUnitSubtitle} ·{' '}
                <span dir="ltr" className="font-mono font-bold text-[#0f1d40]">
                  {unitCode}
                </span>
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <div className="hidden text-end sm:block">
                <strong className="block text-xs font-bold text-[#0f1d40]">
                  {t.quickAmountsLabel}
                </strong>
                <span dir="ltr" className="text-[10px] text-slate-400">
                  {t.minMaxGelHint}
                </span>
              </div>
              <div className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-[#2563eb] sm:size-9">
                <Wallet className="size-4" />
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {presets.map((item) => {
              const isActive =
                item.id === 'custom'
                  ? selectedPreset === 'custom'
                  : selectedPreset === item.val && topUpAmount === item.val

              return (
                <button
                  key={String(item.id)}
                  type="button"
                  onClick={() => {
                    if (item.id === 'custom') {
                      setSelectedPreset('custom')
                    } else {
                      setSelectedPreset(item.val)
                      setTopUpAmount(item.val)
                    }
                    setBoostNotice(null)
                  }}
                  className={`relative flex min-h-[66px] flex-col items-center justify-center rounded-2xl border px-1.5 py-2 text-center transition ${
                    isActive
                      ? 'border-2 border-[#2563eb] bg-blue-50/40 text-[#0f1d40] shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {item.topBadge && (
                    <span
                      className={`-mt-1 mb-1 max-w-full truncate rounded-full px-1.5 py-0.5 text-[7.5px] font-bold ${
                        item.isRecommended
                          ? 'bg-gradient-to-r from-[#ff6437] to-[#ff4f69] text-white shadow-2xs'
                          : isActive
                            ? 'text-[#2563eb]'
                            : 'text-slate-400'
                      }`}
                    >
                      {item.topBadge}
                    </span>
                  )}

                  <strong dir="ltr" className="text-xs font-bold sm:text-sm">
                    {item.id === 'custom' ? '...' : `${item.val} ${GEL}`}
                  </strong>
                  <span className="mt-0.5 text-[8.5px] font-semibold text-slate-400">
                    {item.subText}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="mt-4">
            <span className="mb-1.5 block text-end text-[11px] font-semibold text-slate-500">
              {t.customAmountLabel}
            </span>
            <div className="flex h-11 items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 px-3">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const next = Math.min(10000, topUpAmount + 5)
                    setSelectedPreset(
                      [5, 10, 20, 50, 100].includes(next) ? next : 'custom'
                    )
                    setTopUpAmount(next)
                  }}
                  className="flex size-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-100"
                >
                  +
                </button>
                <span className="text-xs font-bold text-slate-400">{GEL}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPreset(10)
                    setTopUpAmount(10)
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  ×
                </button>
              </div>

              <input
                type="number"
                dir="ltr"
                value={topUpAmount}
                onChange={(e) => {
                  const next = Math.max(5, Number(e.target.value) || 5)
                  setSelectedPreset(
                    [5, 10, 20, 50, 100].includes(next) ? next : 'custom'
                  )
                  setTopUpAmount(next)
                }}
                className="w-full bg-transparent text-center text-base font-bold text-[#0f1d40] focus:outline-none"
              />

              <button
                type="button"
                onClick={() => {
                  const next = Math.max(5, topUpAmount - 5)
                  setSelectedPreset(
                    [5, 10, 20, 50, 100].includes(next) ? next : 'custom'
                  )
                  setTopUpAmount(next)
                }}
                className="flex size-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-100"
              >
                -
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-blue-100 bg-[#f5f8ff] p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-100/80 text-[#2563eb]">
                <Zap className="size-4" />
              </span>
              <div className="text-end">
                <strong
                  dir="ltr"
                  className="block text-xs font-bold text-[#0f1d40] sm:text-sm"
                >
                  {pkgDetails.amount} {GEL} {t.creditedSuffix}
                </strong>
                <span className="mt-0.5 block text-[11px] font-bold text-[#2563eb]">
                  {pkgDetails.coverLabel}
                </span>
              </div>
            </div>

            {pkgDetails.upsellTarget > 0 && (
              <div className="mt-3 border-t border-blue-200/60 pt-3 text-end">
                <p className="text-[11px] leading-relaxed text-slate-600">
                  {t.upsellPrefix} {pkgDetails.upsellTarget} {GEL}{' '}
                  {t.upsellMiddle} {pkgDetails.upsellDiscount}{' '}
                  {t.upsellDaysSuffix} ({pkgDetails.upsellDays} {t.daysWord}) ✨
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const target = pkgDetails.upsellTarget
                    setSelectedPreset(
                      [5, 10, 20, 50, 100].includes(target) ? target : 'custom'
                    )
                    setTopUpAmount(target)
                  }}
                  className="mt-2 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-3 py-1 text-[10.5px] font-bold text-white shadow-2xs transition hover:opacity-95"
                >
                  <span>
                    {t.topUpBtnPrefix} {pkgDetails.upsellTarget} {GEL}
                  </span>
                </button>
              </div>
            )}
          </div>

          <div className="mt-4">
            <button
              type="button"
              disabled={isPending || submittingPayment}
              onClick={() =>
                startFlittCheckout({
                  tier: pkgDetails.tier === 'VIP+' ? 'vip_plus' : 'super_vip',
                  days: pkgDetails.days,
                  amountGel: pkgDetails.amount,
                })
              }
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-5 text-xs font-bold text-white shadow-[0_8px_20px_rgba(255,100,55,0.28)] transition hover:opacity-95 disabled:opacity-60"
            >
              {submittingPayment ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>{t.flittRedirectingBtn}</span>
                </>
              ) : (
                <>
                  <CreditCard className="size-4" />
                  <span>
                    {t.payCardPrefix} {pkgDetails.amount} {GEL}{' '}
                    {t.payCardSuffix}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {boostNotice && (
        <div
          className={`mt-3 flex items-start gap-2 rounded-xl border p-3 text-xs font-semibold ${
            boostNotice.isError
              ? 'border-amber-200 bg-amber-50 text-amber-900'
              : 'border-emerald-200 bg-[#eaf8f2] text-[#007a5a]'
          }`}
        >
          {boostNotice.isError ? (
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
          ) : (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          )}
          <span>{boostNotice.text}</span>
        </div>
      )}

      <div className="mt-3.5 flex items-center justify-between text-[10px] text-slate-400">
        <span>Flitt · Visa · Mastercard · Apple Pay · Google Pay</span>
        <span className="inline-flex items-center gap-1">
          <Lock className="size-3" /> 256-bit SSL
        </span>
      </div>
    </section>
  )
}

export function Timeline({
  currentStepIndex,
  isRejected,
  stepTitles,
}: {
  currentStepIndex: number
  isRejected?: boolean
  stepTitles: string[]
}) {
  return (
    <ol className="relative flex flex-col items-start">
      {stepTitles.map((title, index) => {
        const isLast = index === stepTitles.length - 1
        const status: 'done' | 'current' | 'upcoming' =
          index < currentStepIndex
            ? 'done'
            : index === currentStepIndex
              ? 'current'
              : 'upcoming'

        return (
          <li
            key={title}
            className="relative flex items-start gap-3.5 pb-5 last:pb-0"
          >
            {!isLast && (
              <span
                className={`absolute top-6 start-[11px] h-full w-[1.5px] ${
                  status === 'done'
                    ? 'bg-[var(--brand-primary,#007a5a)]'
                    : 'bg-gray-200'
                }`}
              />
            )}
            <span
              className={`relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                status === 'done'
                  ? 'bg-[var(--brand-primary,#007a5a)] text-white'
                  : status === 'current'
                    ? isRejected
                      ? 'bg-red-600 text-white'
                      : 'bg-[var(--brand-navy,#0a1122)] text-white'
                    : 'bg-gray-100 text-gray-400'
              }`}
            >
              {status === 'done' ? (
                <Check className="size-3.5 stroke-[2.5]" />
              ) : (
                index + 1
              )}
            </span>
            <span
              className={`pt-0.5 text-xs ${
                status === 'current'
                  ? isRejected
                    ? 'font-extrabold text-red-600'
                    : 'font-extrabold text-[var(--brand-navy,#0a1122)]'
                  : status === 'done'
                    ? 'font-medium text-gray-600'
                    : 'font-normal text-gray-400'
              }`}
            >
              {title}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export function SellerConfirmModal({
  dir,
  t,
  confirmModal,
  setConfirmModal,
  currencySymbol,
  isPending,
  onConfirm,
}: {
  dir: 'rtl' | 'ltr'
  t: Record<string, any>
  confirmModal: ConfirmModalState
  setConfirmModal: (v: ConfirmModalState) => void
  currencySymbol: string
  isPending: boolean
  onConfirm: () => void
}) {
  return (
    <Dialog
      open={Boolean(confirmModal)}
      onOpenChange={(open) => {
        if (!open && !isPending) setConfirmModal(null)
      }}
    >
      <DialogContent
        dir={dir}
        className="w-[90vw] max-w-[360px] rounded-2xl p-5 sm:max-w-[400px]"
      >
        {confirmModal && (
          <>
            <DialogHeader className="text-start">
              <div className="mb-2 flex items-center gap-2.5">
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                    confirmModal.type === 'delete' ||
                    confirmModal.type === 'cancel_promo'
                      ? 'bg-red-100 text-red-600'
                      : confirmModal.type === 'pause'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-[var(--brand-primary,#007a5a)]'
                  }`}
                >
                  {confirmModal.type === 'delete' ? (
                    <Trash2 className="size-4" />
                  ) : confirmModal.type === 'promote' ? (
                    <Sparkles className="size-4" />
                  ) : (
                    <ShieldAlert className="size-4" />
                  )}
                </span>
                <DialogTitle className="text-sm font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-base">
                  {confirmModal.type === 'pause' && t.modalPauseTitle}
                  {confirmModal.type === 'resume' && t.modalResumeTitle}
                  {confirmModal.type === 'delete' && t.modalDeleteTitle}
                  {confirmModal.type === 'promote' &&
                    `${t.modalPromoteTitle} (${confirmModal.pkg.label})`}
                  {confirmModal.type === 'cancel_promo' &&
                    t.modalCancelPromoTitle}
                </DialogTitle>
              </div>

              <DialogDescription className="text-start text-xs leading-relaxed text-gray-600">
                {confirmModal.type === 'pause' && t.modalPauseDesc}
                {confirmModal.type === 'resume' && t.modalResumeDesc}
                {confirmModal.type === 'delete' && t.modalDeleteDesc}
                {confirmModal.type === 'promote' && (
                  <>
                    {t.modalPromoteDescPrefix}{' '}
                    <strong className="text-[var(--brand-navy,#0a1122)]">
                      {confirmModal.pkg.label}
                    </strong>{' '}
                    {t.modalPromoteDescMiddle}{' '}
                    <strong className="text-[var(--brand-primary,#007a5a)]">
                      {confirmModal.pkg.price.toLocaleString('en-US')}{' '}
                      {currencySymbol}
                    </strong>{' '}
                    {t.modalPromoteDescSuffix}
                  </>
                )}
                {confirmModal.type === 'cancel_promo' && t.modalCancelPromoDesc}
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="mt-4 flex flex-row items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => setConfirmModal(null)}
                className="h-9 flex-1 rounded-xl text-xs font-bold"
              >
                {t.modalBackBtn}
              </Button>
              <Button
                type="button"
                disabled={isPending}
                onClick={onConfirm}
                className={`h-9 flex-1 rounded-xl text-xs font-bold text-white ${
                  confirmModal.type === 'delete' ||
                  confirmModal.type === 'cancel_promo'
                    ? 'bg-red-600 hover:bg-red-700'
                    : confirmModal.type === 'pause'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-[var(--brand-primary,#007a5a)] hover:bg-[var(--brand-primary-hover,#006248)]'
                }`}
              >
                {isPending ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <Loader2 className="size-3.5 animate-spin" />
                    {t.modalProcessingBtn}
                  </span>
                ) : (
                  t.modalConfirmBtn
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}