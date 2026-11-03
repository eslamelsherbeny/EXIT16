'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Bath,
  BedDouble,
  Building,
  Building2,
  Calendar,
  Car,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  DollarSign,
  DoorClosed,
  Droplets,
  Eye,
  Fence,
  Flame,
  Heart,
  Home,
  Layers,
  Maximize2,
  Mountain,
  Paintbrush,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Trees,
  Tv,
  Wallet,
  Wifi,
} from 'lucide-react'
import { UnitGalleryWithLightbox } from '@/components/features/opportunities/unit-interest-form'

function getSpecIcon(index: number) {
  const icons = [
    Home,
    Maximize2,
    Layers,
    BedDouble,
    Bath,
    Paintbrush,
    Building,
    Calendar,
    DollarSign,
  ]
  return icons[index % icons.length]
}

const SIVRCE_STYLE_FEATURE_CATEGORIES = [
  {
    key: 'space',
    titleAr: 'المساحة',
    titleEn: 'Space',
    items: [
      { labelAr: 'شرفة', labelEn: 'Balcony', icon: Fence },
      { labelAr: 'مخزن', labelEn: 'Storage', icon: Layers },
      { labelAr: 'تراس مفتوح', labelEn: 'Terrace', icon: Maximize2 },
    ],
  },
  {
    key: 'building',
    titleAr: 'المبنى',
    titleEn: 'Building',
    items: [
      { labelAr: 'موقف سيارات', labelEn: 'Parking', icon: Car },
      { labelAr: 'حراسة', labelEn: 'Security', icon: ShieldCheck },
      { labelAr: 'باب حديدي', labelEn: 'Steel door', icon: DoorClosed },
      { labelAr: 'مصعد حديث', labelEn: 'Elevator', icon: Building2 },
    ],
  },
  {
    key: 'utilities',
    titleAr: 'المرافق',
    titleEn: 'Utilities',
    items: [
      { labelAr: 'غاز طبيعي', labelEn: 'Natural gas', icon: Flame },
      { labelAr: 'ماء ساخن', labelEn: 'Hot water', icon: Droplets },
      { labelAr: 'إنترنت', labelEn: 'Internet', icon: Wifi },
      { labelAr: 'تلفزيون كابل', labelEn: 'Cable TV', icon: Tv },
    ],
  },
  {
    key: 'views',
    titleAr: 'الإطلالة',
    titleEn: 'View',
    items: [
      { labelAr: 'إطلالة على الجبال', labelEn: 'Mountain view', icon: Mountain },
      { labelAr: 'إطلالة على الفناء', labelEn: 'Courtyard view', icon: Trees },
      { labelAr: 'إطلالة على الشارع', labelEn: 'Street view', icon: Store },
    ],
  },
]

export function UnitDetailsHeader({
  computedUnit,
  t,
  liked,
  onToggleFavorite,
  copied,
  onCopyCode,
}: any) {
  const [sharedCopied, setSharedCopied] = useState(false)

  const handleShareClick = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
    if (!shareUrl) return

    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: computedUnit.projectName,
          url: shareUrl,
        })
        return
      }
    } catch {}

    try {
      await navigator.clipboard?.writeText(shareUrl)
      setSharedCopied(true)
      setTimeout(() => setSharedCopied(false), 2000)
    } catch {}
  }

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
            📍 {computedUnit.subtitle}
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
            onClick={handleShareClick}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700 transition hover:bg-gray-50"
          >
            {sharedCopied ? (
              <Check className="size-3.5 text-[#007a5a]" />
            ) : (
              <Share2 className="size-3.5 text-gray-500" />
            )}
            <span>{sharedCopied ? t.copiedText || 'تم النسخ' : t.shareBtn}</span>
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

      <UnitGalleryWithLightbox
        gallery={computedUnit.gallery}
        unitCode={computedUnit.code}
        viewsCount={computedUnit.viewsCount}
        createdAt={computedUnit.publishedAt || computedUnit.createdAt}
        featured={computedUnit.featured}
        boostTier={computedUnit.boostTier}
        copied={copied}
        onCopyCode={onCopyCode}
      />
    </>
  )
}

export function UnitSpecsAndDescription({
  computedUnit,
  locale = 'ar',
}: {
  computedUnit: any
  locale?: string
}) {
  const isAr = locale === 'ar'

  const contractPrice =
    Number(computedUnit.contractPrice || computedUnit.paidAmount) || 0
  const marketPrice = Number(computedUnit.marketPrice) || contractPrice
  const size = Math.max(25, Number(computedUnit.sizeNum) || 75)
  const unitPricePerSqm =
    contractPrice > 0 ? Math.round(contractPrice / size) : 1100
  const referenceDistrictSqm =
    marketPrice > contractPrice
      ? Math.round(marketPrice / size)
      : Math.round(unitPricePerSqm * 1.07)

  const rawDiffPct =
    referenceDistrictSqm > 0
      ? Math.round(
          ((unitPricePerSqm - referenceDistrictSqm) / referenceDistrictSqm) *
            100
        )
      : -6
  const clampedDiffPct = Math.max(
    -25,
    Math.min(
      10,
      computedUnit.willingToDiscount
        ? Math.min(
            -4,
            rawDiffPct - (Number(computedUnit.discountPercentage) || 5)
          )
        : rawDiffPct
    )
  )

  const priceDiffDisplay =
    clampedDiffPct <= 0 ? `${clampedDiffPct}%` : `+${clampedDiffPct}%`

  const priceScoreBar = Math.max(70, Math.min(96, 82 - clampedDiffPct))

  const delStr = String(computedUnit.deliveryYear || '').toLowerCase()
  const isReadyUnit =
    delStr.includes('جاهز') ||
    delStr.includes('فوري') ||
    delStr.includes('ready') ||
    delStr.includes('2025') ||
    delStr.includes('2026')
  const conditionScoreBar = isReadyUnit ? 92 : 84

  const areaLower = String(
    computedUnit.rawArea || computedUnit.areaName || ''
  ).toLowerCase()
  const locationScoreBar =
    areaLower.includes('vake') ||
    areaLower.includes('saburtalo') ||
    areaLower.includes('batumi') ||
    areaLower.includes('ortachala') ||
    areaLower.includes('isani')
      ? 89
      : 85

  const dealScore = Math.round(
    priceScoreBar * 0.45 + locationScoreBar * 0.3 + conditionScoreBar * 0.25
  )

  const customTags: string[] = Array.isArray(computedUnit.tags)
    ? computedUnit.tags
    : []

  const categorizedGroups = SIVRCE_STYLE_FEATURE_CATEGORIES.map((group) => {
    const items = [...group.items]
    customTags.forEach((rawTag) => {
      const tClean = String(rawTag || '').trim()
      if (!tClean) return
      const alreadyExists = SIVRCE_STYLE_FEATURE_CATEGORIES.some((g) =>
        g.items.some(
          (i) =>
            i.labelAr === tClean ||
            i.labelEn.toLowerCase() === tClean.toLowerCase()
        )
      )
      if (alreadyExists) return

      if (
        group.key === 'views' &&
        (tClean.includes('إطلالة') ||
          tClean.includes('حدائق') ||
          tClean.includes('ممشى') ||
          tClean.includes('بانورام'))
      ) {
        items.push({ labelAr: tClean, labelEn: tClean, icon: Trees })
      } else if (
        group.key === 'building' &&
        (tClean.includes('قريب') ||
          tClean.includes('أمن') ||
          tClean.includes('مسبح') ||
          tClean.includes('مركز'))
      ) {
        items.push({ labelAr: tClean, labelEn: tClean, icon: CheckCircle2 })
      }
    })
    return { ...group, items }
  })

  return (
    <>
      {/* 1. شبكة كروت المواصفات المنفصلة */}
      <section className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5">
        {computedUnit.specs.map((spec: any, idx: number) => {
          const IconComponent = getSpecIcon(idx)
          return (
            <div
              key={spec.label}
              className="flex flex-col justify-between rounded-[18px] border border-gray-200/85 bg-white p-4 text-start shadow-2xs transition hover:border-[#007a5a]/40 hover:shadow-xs"
            >
              <IconComponent className="size-4 text-[#2563eb]" />
              <div className="mt-3">
                <strong className="block text-sm font-black text-[var(--brand-navy,#0a1122)] sm:text-base">
                  {spec.value}
                </strong>
                <span className="mt-0.5 block text-[11px] font-medium text-gray-400">
                  {spec.label}
                </span>
              </div>
            </div>
          )
        })}
      </section>

      {/* 2. قسم الوصف */}
      <section className="mt-4 rounded-[20px] border border-gray-200/85 bg-white p-5 text-start shadow-2xs sm:p-6">
        <h2 className="text-sm font-black text-[var(--brand-navy,#0a1122)] sm:text-base">
          {isAr ? 'وصف الوحدة والتفاصيل' : 'Description'}
        </h2>
        <p className="mt-2.5 whitespace-pre-line text-xs leading-[1.9] text-gray-600 sm:text-[13.5px]">
          {computedUnit.descriptionText}
        </p>
      </section>

      {/* 3. قسم المميزات مفتوح دائماً بدون زر طي */}
      <section className="mt-4 rounded-[20px] border border-gray-200/85 bg-white p-5 text-start shadow-2xs sm:p-6">
        <h2 className="text-base font-black text-[var(--brand-navy,#0a1122)] sm:text-lg">
          {isAr ? 'المميزات' : 'Features'}
        </h2>

        <div className="mt-4 space-y-5">
          {categorizedGroups.map((group) => (
            <div key={group.key}>
              <span className="mb-2.5 block text-xs font-bold text-slate-400">
                {isAr ? group.titleAr : group.titleEn}
              </span>
              <div className="flex flex-wrap gap-2.5">
                {group.items.map((item) => {
                  const ItemIcon = item.icon
                  return (
                    <span
                      key={`${group.key}-${item.labelEn}`}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white px-4 py-2 text-xs font-bold text-[#0f1d40] shadow-2xs transition hover:border-[#2563eb]/40 hover:bg-blue-50/20"
                    >
                      <ItemIcon className="size-4 shrink-0 text-[#2563eb]" />
                      <span>{isAr ? item.labelAr : item.labelEn}</span>
                    </span>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. كارت التقييم الذكي للصفقة (AQAR EXIT SCORE) */}
      <section className="mt-4 rounded-[20px] border border-gray-200/85 bg-white p-5 text-start shadow-2xs sm:p-6">
        <div className="flex items-center gap-1.5 text-[11px] font-extrabold tracking-wider text-[#2563eb] uppercase">
          <Sparkles className="size-3.5" />
          <span>
            {isAr
              ? 'مؤشر تقييم الفرصة (AQAR EXIT SCORE)'
              : 'AQAR EXIT SCORE'}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-4">
          <div className="relative flex size-16 shrink-0 items-center justify-center rounded-full border-[4px] border-[#2563eb] bg-blue-50/40">
            <div className="text-center leading-none">
              <strong className="block text-lg font-black text-[#0a1122]">
                {dealScore}
              </strong>
              <span className="text-[9px] font-bold text-gray-400">/100</span>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-black text-[#0a1122] sm:text-base">
              {dealScore >= 85
                ? isAr
                  ? 'فرصة استثنائية (Excellent Deal)'
                  : 'Excellent Deal'
                : isAr
                  ? 'فرصة ممتازة (Very Good)'
                  : 'Very Good'}
            </h3>
            <p className="mt-0.5 text-[11px] font-semibold text-gray-400 uppercase">
              {isAr
                ? `محسوب تلقائياً من سعر المتر ($${unitPricePerSqm}/م²) وموقع وحالة الوحدة`
                : `CALCULATED FROM UNIT SQM PRICE ($${unitPricePerSqm}/m²) & LOCATION`}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3.5 text-xs">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-semibold text-gray-600">
                {isAr
                  ? 'السعر مقارنة بمتوسط المنطقة (Price vs district)'
                  : 'Price vs district'}
              </span>
              <strong dir="ltr" className="font-extrabold text-[#007a5a]">
                {priceDiffDisplay}
              </strong>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-[#2563eb]"
                style={{ width: `${priceScoreBar}%` }}
              />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-semibold text-gray-600">
                {isAr
                  ? 'تقييم الموقع والخدمات (Location)'
                  : 'Location'}
              </span>
              <strong dir="ltr" className="font-extrabold text-[#0a1122]">
                {locationScoreBar}/100
              </strong>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-[#2563eb]"
                style={{ width: `${locationScoreBar}%` }}
              />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-semibold text-gray-600">
                {isAr
                  ? 'حالة العقار والتسليم (Condition)'
                  : 'Condition'}
              </span>
              <strong className="font-extrabold text-[#0a1122]">
                {computedUnit.deliveryYear}
              </strong>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-[#2563eb]"
                style={{ width: `${conditionScoreBar}%` }}
              />
            </div>
          </div>
        </div>
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
      <section className="mt-4 rounded-[20px] border border-[#b8e6d5] bg-white p-5 text-start shadow-sm sm:p-6">
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
              <span>
                {oT.makeOfferBtn ||
                  t.interestForm?.submitBtn ||
                  'تقديم عرض شراء'}
              </span>
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

      <section className="mt-4 overflow-hidden rounded-[20px] border border-gray-200/80 bg-white shadow-sm">
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

export function SimilarUnitsSection({ similarDbUnits, t }: any) {
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