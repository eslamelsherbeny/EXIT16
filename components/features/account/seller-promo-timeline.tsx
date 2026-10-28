'use client'

import {
  Check,
  Copy,
  EyeOff,
  Loader2,
  MessageCircle,
  MousePointerClick,
  ShieldAlert,
  Sparkles,
  Star,
  Trash2,
  XCircle,
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
  dynamicPackages,
  currencySymbol,
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
  activePromoDays: 7 | 14 | 30
  activePromoPrice: number
  currentAdRef: string | null
  copiedAdRef: boolean
  setCopiedAdRef: (v: boolean) => void
  dynamicPackages: Array<{ days: 7 | 14 | 30; price: number; label: string }>
  currencySymbol: string
  isPending: boolean
  onSelectPackage: (pkg: {
    days: 7 | 14 | 30
    price: number
    label: string
  }) => void
  onCancelPromo: () => void
}) {
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

  const whatsappMessage = `${t.whatsappPromoMsgPrefix} (${activePromoDays} ${t.daysWord} - ${activePromoPrice.toLocaleString('en-US')} ${currencySymbol}) ${t.whatsappPromoMsgMiddle} (${activeUnit.project_name || t.defaultProjectName}) — ${t.whatsappPromoMsgRef} ${currentAdRef}`

  return (
    <section className="mt-5 rounded-[20px] border border-[#aae3cb] bg-[#effaf5] p-5 text-start shadow-xs sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-extrabold text-[var(--brand-primary,#007a5a)] shadow-2xs">
            <Star className="size-3.5 fill-amber-400 text-amber-500" />
            <span>{t.promoOptionalBadge}</span>
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
          className="inline-flex items-center gap-1 rounded-lg bg-white/80 px-2.5 py-1 text-[11px] font-bold text-gray-500 transition hover:bg-white hover:text-gray-800"
        >
          <EyeOff className="size-3.5" />
          <span>{t.hidePromoBtn}</span>
        </button>
      </div>

      <h3 className="mt-3 text-base font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-lg">
        {t.promoMainTitle}
      </h3>

      <ul className="mt-2.5 space-y-2 text-xs font-medium text-[#1e3a34]">
        <li className="flex items-center gap-2">
          <Check className="size-3.5 shrink-0 text-[var(--brand-primary,#007a5a)]" />
          <span>{t.promoPoint1}</span>
        </li>
        <li className="flex items-center gap-2">
          <Check className="size-3.5 shrink-0 text-[var(--brand-primary,#007a5a)]" />
          <span>{t.promoPoint2}</span>
        </li>
        <li className="flex items-center gap-2">
          <Check className="size-3.5 shrink-0 text-[var(--brand-primary,#007a5a)]" />
          <span>{t.promoPoint3}</span>
        </li>
      </ul>

      <div className="mt-4 mb-2.5 flex items-center gap-1.5 text-xs font-extrabold text-[var(--brand-primary,#007a5a)]">
        <MousePointerClick className="size-4" />
        <span>
          {isCurrentlyFeatured || isPendingPromo
            ? t.promoClickHintActive
            : t.promoClickHintNew}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
        {dynamicPackages.map((pkg) => {
          const isSelected =
            (isCurrentlyFeatured || isPendingPromo) &&
            activePromoDays === pkg.days
          return (
            <button
              key={pkg.days}
              type="button"
              disabled={isPending}
              onClick={() => onSelectPackage(pkg)}
              className={`group flex cursor-pointer flex-col items-center justify-between rounded-2xl border bg-white p-3 text-center transition-all hover:shadow-md sm:p-4 ${
                isSelected
                  ? 'border-[var(--brand-primary,#007a5a)] ring-2 ring-[var(--brand-primary,#007a5a)]/25'
                  : 'border-gray-200 hover:border-[var(--brand-primary,#007a5a)]'
              }`}
            >
              <span className="text-xs font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-sm">
                {pkg.label}
              </span>
              <span className="my-1.5 text-xs font-black text-[var(--brand-primary,#007a5a)] tabular-nums sm:text-base">
                {pkg.price.toLocaleString('en-US')} {currencySymbol}
              </span>
              <span
                className={`w-full rounded-lg py-1 text-[10px] font-extrabold transition sm:text-[11px] ${
                  isSelected
                    ? 'bg-[var(--brand-primary,#007a5a)] text-white'
                    : 'bg-[var(--brand-primary-light,#eaf8f2)] text-[var(--brand-primary,#007a5a)] group-hover:bg-[var(--brand-primary,#007a5a)] group-hover:text-white'
                }`}
              >
                {isSelected ? t.currentPkgBtn : t.choosePkgBtn}
              </span>
            </button>
          )
        })}
      </div>

      <p className="mt-3.5 text-[11px] leading-relaxed text-[#2b584d]">
        {t.promoFreeNote}
      </p>

      {(isCurrentlyFeatured || isPendingPromo) && currentAdRef && (
        <div className="mt-4 rounded-xl border border-[var(--brand-primary,#007a5a)]/30 bg-white p-4 text-start shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-extrabold text-[var(--brand-navy,#0a1122)]">
                {t.adOrderCodeTitle} ({activePromoDays} {t.daysWord} —{' '}
                {activePromoPrice.toLocaleString('en-US')} {currencySymbol}):
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
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-bold text-[var(--brand-navy,#0a1122)] hover:bg-gray-100"
            >
              <Copy className="size-3.5" />
              <span>{copiedAdRef ? t.copiedBtn : t.copyRefBtn}</span>
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
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
