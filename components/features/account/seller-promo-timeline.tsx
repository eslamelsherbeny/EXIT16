'use client'

import { useMemo, useState } from 'react'
import {
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  EyeOff,
  Landmark,
  Loader2,
  Lock,
  MessageCircle,
  ShieldAlert,
  Sparkles,
  Star,
  Trash2,
  Wallet,
  XCircle,
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
import { createBoostRequestAction } from '@/actions/account-actions'
import { calculateGelBoostPackage } from '@/components/features/home/home-market-sections'
import { useTranslation } from '@/lib/i18n'
import type { ConfirmModalState, SellerUnitItem } from './seller-unit-helpers'

export function SellerPromoSection({
  t,
  activeUnit,
  supportWhatsApp,
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
  currencySymbol = '₾',
  isPending,
  onSelectPackage,
  onCancelPromo,
}: {
  t: Record<string, any>
  activeUnit: SellerUnitItem
  supportWhatsApp: string
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
  onSelectPackage: (pkg: {
    days: any
    price: number
    label: string
    tier?: 'SUPER VIP' | 'VIP+'
  }) => void
  onCancelPromo: () => void
}) {
  const { locale, siteSettings } = useTranslation() as Record<string, any>
  const isAr = locale === 'ar'
  const GEL = '₾'

  const [selectedPreset, setSelectedPreset] = useState<number | 'custom'>(
    activePromoPrice >= 5 ? activePromoPrice : 10
  )
  const [topUpAmount, setTopUpAmount] = useState<number>(
    activePromoPrice >= 5 ? activePromoPrice : 10
  )
  const [submittingPayment, setSubmittingPayment] = useState(false)
  const [boostNotice, setBoostNotice] = useState<string | null>(null)

  const pkgDetails = useMemo(
    () => calculateGelBoostPackage(topUpAmount, isAr),
    [topUpAmount, isAr]
  )

  const presets = [
    {
      id: 5,
      val: 5,
      topBadge: 'Starter',
      subText: 'VIP+ · 1 day',
    },
    {
      id: 10,
      val: 10,
      topBadge: 'Recommended 🔥',
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
      topBadge: 'Popular',
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
      topBadge: 'Custom amount',
      subText: 'Any',
    },
  ]

  const handleDirectBoostPayment = async (method: 'card' | 'bank') => {
    setSubmittingPayment(true)
    setBoostNotice(null)

    const res = await createBoostRequestAction({
      amountGel: pkgDetails.amount,
      packageTier: pkgDetails.tier,
      durationDays: pkgDetails.days,
      paymentMethod: method,
      unitId: activeUnit.id,
      unitCode: (activeUnit as any).code || undefined,
    })

    setSubmittingPayment(false)

    const configuredPaymentUrl =
      res?.paymentUrl ||
      siteSettings?.boostPaymentUrl ||
      process.env.NEXT_PUBLIC_BOOST_PAYMENT_URL ||
      ''

    if (configuredPaymentUrl) {
      const sep = configuredPaymentUrl.includes('?') ? '&' : '?'
      window.open(
        `${configuredPaymentUrl}${sep}amount=${pkgDetails.amount}&currency=GEL&tier=${encodeURIComponent(pkgDetails.tier)}&days=${pkgDetails.days}&unitId=${encodeURIComponent(activeUnit.id)}&reqId=${encodeURIComponent(res?.boostRequestId || '')}`,
        '_blank'
      )
    }

    onSelectPackage({
      days: pkgDetails.days as any,
      price: pkgDetails.amount,
      label: `${pkgDetails.tier} (${pkgDetails.days} ${isAr ? 'يوم' : 'days'})`,
      tier: pkgDetails.tier,
    })

    setBoostNotice(
      isAr
        ? `تم تسجيل طلب تفعيل باقة (${pkgDetails.tier} — ${pkgDetails.amount} ${GEL} لمدة ${pkgDetails.days} يوم) لوحدتك (${activeUnit.project_name || ''}). بمجرد إتمام الدفع ومراجعة الأدمن سيتم التفعيل تلقائياً.`
        : `Boost request (${pkgDetails.tier} — ${pkgDetails.amount} ${GEL} for ${pkgDetails.days} days) recorded for your unit.`
    )
  }

  if (isPromoCollapsed) {
    return (
      <div className="mt-5 flex items-center justify-between rounded-2xl border border-[#aae3cb] bg-[#effaf5] px-4 py-3.5 shadow-2xs">
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

  const whatsappMessage = `${t.whatsappPromoMsgPrefix} (${pkgDetails.tier} - ${activePromoDays || pkgDetails.days} ${t.daysWord} - ${(activePromoPrice || pkgDetails.amount).toLocaleString('en-US')} ${GEL}) ${t.whatsappPromoMsgMiddle} (${activeUnit.project_name || t.defaultProjectName}) — ${t.whatsappPromoMsgRef} ${currentAdRef}`

  return (
    <section className="mt-5 rounded-[24px] border border-slate-200/90 bg-white p-5 text-start shadow-xs sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-[#2563eb]">
            <Star className="size-3.5 fill-amber-400 text-amber-500" />
            <span>
              {isAr
                ? 'ترقية الإعلان · SUPER VIP & +VIP'
                : 'Boost Listing · SUPER VIP & +VIP'}
            </span>
          </span>

          {isCurrentlyFeatured && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-extrabold text-amber-800">
              {t.promoActiveBadgePrefix} {remainingFeaturedDays} {t.dayWord})
            </span>
          )}

          {isPendingPromo && (
            <span className="rounded-full bg-blue-100 px-3 py-1 text-[11px] font-extrabold text-blue-800">
              {t.promoPendingBadgePrefix} ({activePromoDays} {t.daysWord})
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

      <div className="mt-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-[#0f1d40] sm:text-lg">
            {isAr
              ? `تمييز وحدة: ${activeUnit.project_name || t.defaultProjectName}`
              : `Boost Unit: ${activeUnit.project_name || t.defaultProjectName}`}
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {isAr
              ? 'اختر باقة الترقية لظهور وحدتك في صدارة الصفحة الرئيسية والفرص المتاحة'
              : 'Choose a boost package to feature your unit at the top of the homepage'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-end">
            <strong className="block text-xs font-bold text-[#0f1d40]">
              {isAr ? 'مبالغ سريعة' : 'Quick amounts'}
            </strong>
            <span dir="ltr" className="text-[10px] text-slate-400">
              Min 5 {GEL} · Max 10,000 {GEL}
            </span>
          </div>
          <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-[#2563eb]">
            <Wallet className="size-4" />
          </div>
        </div>
      </div>

      {/* الـ 6 باقات الموحدة باللاري الجورجي (₾) مطابقة للصفحة الرئيسية */}
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
              className={`relative flex min-h-[68px] flex-col items-center justify-center rounded-2xl border px-1.5 py-2 text-center transition ${
                isActive
                  ? 'border-2 border-[#2563eb] bg-blue-50/40 text-[#0f1d40] shadow-xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              {item.topBadge && (
                <span
                  className={`-mt-1 mb-1 rounded-full px-1.5 py-0.5 text-[8px] font-bold whitespace-nowrap ${
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

      {/* حقل المبلغ المخصص */}
      <div className="mt-4">
        <span className="mb-1.5 block text-end text-[11px] font-semibold text-slate-500">
          {isAr ? 'مبلغ مخصص' : 'Custom amount'}
        </span>
        <div className="flex h-11 items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 px-3">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setSelectedPreset('custom')
                setTopUpAmount((prev) => Math.min(10000, prev + 5))
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
              title="Reset"
            >
              ×
            </button>
          </div>

          <input
            type="number"
            dir="ltr"
            value={topUpAmount}
            onChange={(e) => {
              setSelectedPreset('custom')
              setTopUpAmount(Math.max(5, Number(e.target.value) || 5))
            }}
            className="w-full bg-transparent text-center text-base font-bold text-[#0f1d40] focus:outline-none"
          />

          <button
            type="button"
            onClick={() => {
              setSelectedPreset('custom')
              setTopUpAmount((prev) => Math.max(5, prev - 5))
            }}
            className="flex size-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-100"
          >
            -
          </button>
        </div>
      </div>

      {/* تفاصيل الباقة والأيام المحسوبة */}
      <div className="mt-4 rounded-2xl border border-blue-100 bg-[#f5f8ff] p-4">
        <div className="flex items-center justify-between">
          <span className="flex size-8 items-center justify-center rounded-full bg-blue-100/80 text-[#2563eb]">
            <Zap className="size-4" />
          </span>
          <div className="text-end">
            <strong
              dir="ltr"
              className="block text-xs font-bold text-[#0f1d40] sm:text-sm"
            >
              {pkgDetails.amount} {GEL}{' '}
              {isAr ? 'تُضاف لرصيد إعلانك' : 'credited to your listing'}
            </strong>
            <span className="mt-0.5 block text-[11px] font-bold text-[#2563eb]">
              {pkgDetails.coverLabel}
            </span>
          </div>
        </div>

        {pkgDetails.upsellTarget > 0 && (
          <div className="mt-3 border-t border-blue-200/60 pt-3 text-end">
            <p className="text-[11px] leading-relaxed text-slate-600">
              {isAr
                ? `نصيحة: شحن ${pkgDetails.upsellTarget} ${GEL} يفتح لك خصم ${pkgDetails.upsellDiscount} على باقة SUPER VIP (${pkgDetails.upsellDays} يوماً)`
                : `Recommendation: ${pkgDetails.upsellTarget} ${GEL} unlocks ${pkgDetails.upsellDiscount} volume discount on SUPER VIP (${pkgDetails.upsellDays} days)`}{' '}
              ✨
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedPreset('custom')
                setTopUpAmount(pkgDetails.upsellTarget)
              }}
              className="mt-2 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-3 py-1 text-[10.5px] font-bold text-white shadow-2xs transition hover:opacity-95"
            >
              <span>
                {isAr
                  ? `اشحن ${pkgDetails.upsellTarget} ${GEL}`
                  : `Top up to ${pkgDetails.upsellTarget} ${GEL}`}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* أزرار الدفع المباشر بالبطاقة والتحويل البنكي */}
      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <button
          type="button"
          disabled={isPending || submittingPayment}
          onClick={() => handleDirectBoostPayment('card')}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-5 text-xs font-bold text-white shadow-[0_8px_20px_rgba(255,100,55,0.28)] transition hover:opacity-95 disabled:opacity-60"
        >
          <CreditCard className="size-4" />
          <span>
            {isAr
              ? `ادفع ${pkgDetails.amount} ${GEL} بالبطاقة البنكية`
              : `Pay ${pkgDetails.amount} ${GEL} with Card`}
          </span>
        </button>

        <button
          type="button"
          disabled={isPending || submittingPayment}
          onClick={() => handleDirectBoostPayment('bank')}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-xs font-bold text-[#0f1d40] transition hover:bg-slate-50 disabled:opacity-60"
        >
          <Landmark className="size-3.5 text-slate-500" />
          <span>
            {isAr
              ? `تحويل بنكي ${pkgDetails.amount} ${GEL}`
              : `Bank Transfer ${pkgDetails.amount} ${GEL}`}
          </span>
        </button>
      </div>

      {boostNotice && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-200 bg-[#eaf8f2] p-3 text-xs font-semibold text-[#007a5a]">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <span>{boostNotice}</span>
        </div>
      )}

      {(isCurrentlyFeatured || isPendingPromo) && currentAdRef && (
        <div className="mt-4 rounded-xl border border-[var(--brand-primary,#007a5a)]/30 bg-[#f8faf9] p-4 text-start shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-extrabold text-[var(--brand-navy,#0a1122)]">
                {t.adOrderCodeTitle} ({activePromoDays} {t.daysWord} —{' '}
                {activePromoPrice.toLocaleString('en-US')} {GEL}):
              </p>
              <p className="mt-1 font-mono text-lg font-black tracking-wider text-[var(--brand-primary,#007a5a)]">
                {currentAdRef}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(currentAdRef)
                setCopiedAdRef(true)
                setTimeout(() => setCopiedAdRef(false), 2000)
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-[var(--brand-navy,#0a1122)] hover:bg-gray-100"
            >
              <Copy className="size-3.5" />
              <span>{copiedAdRef ? t.copiedBtn : t.copyRefBtn}</span>
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-200/70 pt-3">
            {!isCurrentlyFeatured && (
              <a
                href={`https://wa.me/${supportWhatsApp}?text=${encodeURIComponent(whatsappMessage)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2 text-xs font-extrabold text-white shadow-2xs transition hover:opacity-95"
              >
                <MessageCircle className="size-4 shrink-0" />
                <span>{t.whatsappActivateBtn}</span>
              </a>
            )}

            <button
              type="button"
              disabled={isPending}
              onClick={onCancelPromo}
              className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-extrabold text-red-600 transition hover:bg-red-100"
            >
              <XCircle className="size-3.5 shrink-0" />
              <span>
                {isCurrentlyFeatured
                  ? t.cancelActivePromoBtn
                  : t.cancelPendingPromoBtn}
              </span>
            </button>
          </div>
        </div>
      )}

      <div className="mt-3.5 flex items-center justify-between text-[10px] text-slate-400">
        <span>Visa · Mastercard · Apple Pay · TBC · BOG</span>
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