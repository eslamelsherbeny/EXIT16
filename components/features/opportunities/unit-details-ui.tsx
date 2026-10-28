'use client'

import Link from 'next/link'
import {
  Building2,
  Check,
  ChevronRight,
  Copy,
  Flame,
  Heart,
  Share2,
  ShieldCheck,
  Star,
  Wallet,
} from 'lucide-react'
import { UnitGalleryWithLightbox } from '@/components/features/opportunities/unit-interest-form'

export function UnitDetailsHeader({
  computedUnit,
  t,
  liked,
  onToggleFavorite,
  copied,
  onCopyCode,
}: any) {
  return (
    <>
      <div className="flex items-center justify-start">
        <Link
          href="/opportunities"
          className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 transition-colors hover:text-[var(--brand-primary,#007a5a)]"
        >
          <ChevronRight className="size-3.5 rtl:rotate-0 ltr:rotate-180" />
          <span>{t.backToOpportunities}</span>
        </Link>
      </div>

      <header className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="text-start">
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--brand-navy,#0a1122)] sm:text-3xl">
            {computedUnit.projectName}
          </h1>
          <p className="mt-1 text-xs text-gray-500 sm:text-sm">
            {computedUnit.subtitle}
          </p>
          <button
            type="button"
            onClick={onCopyCode}
            title={t.copyCodeTitle}
            className="mt-2.5 inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1 font-mono text-[11px] text-gray-500 transition hover:border-gray-300 hover:text-[var(--brand-navy,#0a1122)]"
          >
            <span>{computedUnit.code}</span>
            <Copy className="size-3 text-gray-400" />
            {copied && (
              <span className="font-sans text-[10px] text-[var(--brand-primary,#007a5a)]">
                {t.copiedText}
              </span>
            )}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#e6f4f9] px-3 py-1 text-[11px] font-bold text-[var(--brand-primary,#007a5a)]">
            {t.verifiedBadge}
          </span>
          {computedUnit.hasActiveOffer && (
            <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-extrabold text-orange-800">
              <Flame className="size-3.5 fill-orange-500 text-orange-600" />
              <span>{t.activeOfferBadge || 'عليها عرض نشط'}</span>
            </span>
          )}
          {computedUnit.featured && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/60 bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700">
              <Star className="size-3 fill-amber-400 text-amber-500" />
              <span>{t.featuredBadge}</span>
            </span>
          )}
          <button
            type="button"
            onClick={() =>
              navigator.share?.({
                title: `${computedUnit.projectName}`,
                url: window.location.href,
              })
            }
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700 transition hover:bg-gray-50"
          >
            <Share2 className="size-3.5 text-gray-500" />
            <span>{t.shareBtn}</span>
          </button>
          <button
            type="button"
            onClick={onToggleFavorite}
            className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold transition ${
              liked
                ? 'border-red-200 bg-red-50 text-red-600'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Heart
              className={`size-3.5 ${
                liked ? 'fill-current text-red-500' : 'text-gray-500'
              }`}
            />
            <span>{liked ? t.inFavoritesBtn : t.addToFavoritesBtn}</span>
          </button>
        </div>
      </header>

      <UnitGalleryWithLightbox gallery={computedUnit.gallery} />
    </>
  )
}

export function UnitSpecsAndDescription({ computedUnit }: any) {
  return (
    <>
      <section className="mt-4 rounded-[18px] border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 text-start sm:grid-cols-4">
          {computedUnit.specs.map((spec: any) => (
            <div key={spec.label}>
              <span className="block text-[11px] text-gray-400">
                {spec.label}
              </span>
              <strong className="mt-1 block text-xs font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-sm">
                {spec.value}
              </strong>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-[18px] border border-gray-200/80 bg-white p-5 text-start shadow-sm sm:p-6">
        {computedUnit.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {computedUnit.tags.map((tag: string) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50/80 px-3 py-1 text-[11px] font-semibold text-gray-700"
              >
                <Check className="size-3 text-[var(--brand-primary,#007a5a)]" />
                <span>{tag}</span>
              </span>
            ))}
          </div>
        )}
        <p className="text-xs leading-[1.9] text-gray-600 sm:text-[13px]">
          {computedUnit.descriptionText}
        </p>
      </section>
    </>
  )
}

export function UnitFinancialsCard({
  computedUnit,
  fin,
  oT,
  t,
  monthsWord,
  onMakeOffer,
}: any) {
  const remainingMonthsRowLabel = fin.remainingYearsLabel || 'المتبقي'

  return (
    <>
      <section className="mt-4 rounded-[18px] border border-[#b8e6d5] bg-white p-5 text-start shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-gray-500">
              {fin.requiredCashNow}
            </p>
            <p className="mt-1 flex items-baseline gap-1.5 text-3xl font-extrabold tracking-tight text-[var(--brand-navy,#0a1122)] tabular-nums sm:text-[34px]">
              <span dir="ltr">
                {computedUnit.requiredCash.toLocaleString('en-US')}
              </span>
              <span className="text-lg font-bold">{computedUnit.currency}</span>
            </p>
            <p className="mt-1 text-xs font-bold text-[var(--brand-primary,#007a5a)]">
              {fin.noOverNote}
            </p>
          </div>

          {!computedUnit.isOwner && (
            <button
              type="button"
              onClick={onMakeOffer}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary,#007a5a)] px-5 text-xs font-extrabold text-white shadow-sm transition hover:bg-[var(--brand-primary-hover,#006248)] sm:text-sm"
            >
              <Wallet className="size-4" />
              <span>{oT.makeOfferBtn || t.interestForm?.submitBtn || 'تقديم عرض شراء'}</span>
            </button>
          )}
        </div>

        {computedUnit.willingToDiscount && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-[#fffbeb] px-4 py-3 text-start">
            <p className="text-xs font-extrabold text-[#b45309]">
              {fin.negotiableTitle}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-[#92400e]">
              {fin.negotiableDescPrefix} {computedUnit.discountPercentage}%{' '}
              {fin.negotiableDescMiddle}{' '}
              <span dir="ltr">
                {computedUnit.discountAmount.toLocaleString('en-US')}
              </span>{' '}
              {computedUnit.currency}
              {fin.negotiableDescSuffix}
            </p>
          </div>
        )}

        {computedUnit.marketGain > 0 && (
          <div className="mt-3 rounded-xl border border-[#c8eedd] bg-[#ecfbf3] px-4 py-3 text-start">
            <p className="text-xs font-extrabold text-[var(--brand-primary,#007a5a)]">
              {fin.gainPrefix}{' '}
              <span dir="ltr">
                + {computedUnit.marketGain.toLocaleString('en-US')}
              </span>{' '}
              {computedUnit.currency}
            </p>
            <p className="mt-1 text-[11px] text-[var(--brand-primary,#007a5a)]/85">
              {fin.marketPriceTodayPrefix}{' '}
              <span dir="ltr">
                {computedUnit.marketPrice.toLocaleString('en-US')}
              </span>{' '}
              {computedUnit.currency} {fin.afterCommissionSuffix}
            </p>
          </div>
        )}

        <p className="mt-3 text-[10px] text-gray-400">
          {fin.marketDisclaimer}
        </p>
      </section>

      <section className="mt-4 overflow-hidden rounded-[18px] border border-gray-200/80 bg-white shadow-sm">
        <div className="divide-y divide-gray-100 text-xs sm:text-[13px]">
          <div className="flex items-center justify-between px-5 py-3.5">
            <span className="text-gray-500">{fin.remainingToDev}</span>
            <strong className="font-extrabold text-[var(--brand-navy,#0a1122)]">
              <span dir="ltr">
                {computedUnit.remainingToDeveloper.toLocaleString('en-US')}
              </span>{' '}
              {computedUnit.currency}
            </strong>
          </div>

          <div className="flex items-center justify-between px-5 py-3.5">
            <span className="text-gray-500">{fin.installment}</span>
            <strong className="font-extrabold text-[var(--brand-navy,#0a1122)]">
              <span dir="ltr">
                {computedUnit.installmentAmount.toLocaleString('en-US')}
              </span>{' '}
              {computedUnit.currency} · {computedUnit.installmentFreq}
            </strong>
          </div>

          <div className="flex items-center justify-between px-5 py-3.5">
            <span className="text-gray-500">{remainingMonthsRowLabel}</span>
            <strong className="font-extrabold text-[var(--brand-navy,#0a1122)]">
              {computedUnit.remainingInstallmentMonths > 0
                ? `${computedUnit.remainingInstallmentMonths} ${monthsWord}`
                : fin.fullyPaid}
            </strong>
          </div>

          <div className="flex items-center justify-between px-5 py-3.5">
            <span className="text-gray-500">{fin.delivery}</span>
            <strong className="font-extrabold text-[var(--brand-navy,#0a1122)]">
              {computedUnit.deliveryYear}
            </strong>
          </div>

          <div className="px-5 py-3.5">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">{fin.commissionLabel}</span>
              <strong className="font-extrabold text-[var(--brand-navy,#0a1122)]">
                <span dir="ltr">
                  {computedUnit.commission.toLocaleString('en-US')}
                </span>{' '}
                {computedUnit.currency}
              </strong>
            </div>
            <p className="mt-1 text-start text-[10px] text-gray-400">
              {fin.commissionSub}
            </p>
          </div>

          <div className="flex items-center justify-between bg-[#f1f5f9] px-5 py-4">
            <span className="font-extrabold text-[var(--brand-navy,#0a1122)]">
              {fin.totalRequiredNow}
            </span>
            <strong className="text-sm font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-base">
              <span dir="ltr">
                {computedUnit.totalRequiredNow.toLocaleString('en-US')}
              </span>{' '}
              {computedUnit.currency}
            </strong>
          </div>
        </div>
      </section>
    </>
  )
}

export function SimilarUnitsSection({ similarDbUnits, t, c }: any) {
  if (!similarDbUnits || similarDbUnits.length === 0) return null

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-start">
        <h2 className="text-base font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-lg">
          {t.similarSection.title}
        </h2>
        <span className="text-[11px] text-gray-400">
          {t.similarSection.subtitle}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 items-stretch gap-3 sm:grid-cols-3 sm:gap-4">
        {similarDbUnits.map((item: any) => (
          <Link
            key={item.id}
            href={`/opportunities/${item.id}`}
            className="group flex h-full flex-col justify-between overflow-hidden rounded-[16px] border border-gray-200/80 bg-white shadow-sm transition hover:shadow-md"
          >
            <div>
              <div className="relative h-28 w-full overflow-hidden bg-gray-100 sm:h-36">
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {item.featured && (
                  <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[9px] font-bold text-amber-700 shadow-sm">
                    <Star className="size-2.5 fill-amber-400 text-amber-500" />
                    <span>{t.featuredBadge}</span>
                  </span>
                )}
              </div>

              <div className="p-3 text-start">
                <h3 className="line-clamp-1 min-h-[18px] text-xs font-extrabold text-[var(--brand-navy,#0a1122)] group-hover:text-[var(--brand-primary,#007a5a)] sm:text-[13px]">
                  {item.name}
                </h3>
                <p className="mt-0.5 line-clamp-1 text-[10px] text-gray-400">
                  {item.area}
                </p>
                <p className="mt-1.5 line-clamp-1 text-[10px] text-gray-500">
                  {item.specs}
                </p>
                <p className="mt-2 text-[11px] font-extrabold text-[var(--brand-navy,#0a1122)] tabular-nums">
                  {t.similarSection.requiredCashPrefix}{' '}
                  <span dir="ltr">{item.cash}</span> {item.currency}
                </p>
              </div>
            </div>

            <div className="px-3 pt-1 pb-3 text-start">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--brand-primary,#007a5a)]">
                <span>{t.similarSection.viewDetailsBtn}</span>
                <span className="rtl:rotate-0 ltr:rotate-180">←</span>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}