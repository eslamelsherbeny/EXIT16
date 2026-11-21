'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowUpDown,
  Bath,
  Bed,
  BedDouble,
  Box,
  Building,
  Building2,
  Calendar,
  Car,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  Crown,
  DollarSign,
  Droplets,
  Dumbbell,
  ExternalLink,
  Eye,
  Flame,
  Heart,
  Home,
  Layers,
  Lock,
  MapPin,
  Maximize2,
  Mountain,
  Paintbrush,
  Play,
  Share2,
  ShieldCheck,
  Smartphone,
  Snowflake,
  Sparkles,
  Star,
  Sun,
  Trees,
  Tv,
  Utensils,
  Video,
  Wallet,
  Waves,
  Wifi,
  Wind,
  Zap,
} from 'lucide-react'
import { UnitGalleryWithLightbox } from '@/components/features/opportunities/unit-interest-form'
import {
  getOptionLabel,
  SIVRCE_FEATURE_GROUPS,
} from '@/components/features/seller/seller-options-data'
import { useTranslation, type LocaleCode } from '@/lib/i18n'

export type FeatureGroupDisplay = {
  key: string
  title: string
  items: Array<{
    id: string
    label: string
    icon: any
  }>
}

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

function getFeatureIcon(featureId: string) {
  const map: Record<string, any> = {
    Balcony: Sun,
    Loggia: Layers,
    Terrace: Trees,
    Yard: Trees,
    Storage: Box,
    Cellar: Layers,
    'Walk-in closet': Home,
    'Separate kitchen': Utensils,
    Elevator: ArrowUpDown,
    Parking: Car,
    'Underground parking': Car,
    Garage: Car,
    Security: ShieldCheck,
    Concierge: Building2,
    Intercom: Smartphone,
    'Backup generator': Zap,
    'Iron door': Lock,
    'Double glazing': Maximize2,
    Penthouse: Crown,
    'Step-free access': Check,
    'Underfloor heating': Flame,
    'Natural gas': Flame,
    'Hot water': Droplets,
    Internet: Wifi,
    'Cable TV': Tv,
    Furniture: Bed,
    Appliances: Zap,
    'Air conditioning': Snowflake,
    Dishwasher: Droplets,
    'Washing machine': Droplets,
    Dryer: Wind,
    Fireplace: Flame,
    Kitchen: Utensils,
    TV: Tv,
    'Panoramic view': Eye,
    'Sea view': Waves,
    'Mountain view': Mountain,
    'Yard view': Trees,
    'Street view': MapPin,
    Beachfront: Waves,
    Bright: Sun,
    Quiet: Wind,
    Pool: Waves,
    Jacuzzi: Bath,
    Sauna: Flame,
    Gym: Dumbbell,
    'BBQ grill': Flame,
    'EV charger': Zap,
    'Ski access': Mountain,
  }
  return map[featureId] || CheckCircle2
}

function getYoutubeEmbedUrl(rawUrl?: string | null): string | null {
  if (!rawUrl) return null
  const clean = String(rawUrl).trim()
  const ytMatch = clean.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  if (ytMatch?.[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`
  }
  const vimeoMatch = clean.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch?.[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  }
  return null
}

export function UnitDetailsHeader({
  computedUnit,
  t,
  liked,
  onToggleFavorite,
  copied,
  onCopyCode,
}: any) {
  const { t: dict } = useTranslation()
  const [sharedCopied, setSharedCopied] = useState(false)
  const uiL = dict.unitDetailsPage.uiLabels

  const exactStreet = computedUnit.exactStreet || ''
  const houseNumber = computedUnit.houseNumber || ''
  // قراءة الرقم العقاري حصراً من القيمة المفلترة لحماية خصوصية البائع عند تفعيل hide_cadastral
  const cadastralCode = computedUnit.cadastralCode || ''
  const allowOnlineViewing = Boolean(computedUnit.allowOnlineViewing)

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
            {exactStreet
              ? ` · ${exactStreet}${houseNumber ? ' ' + houseNumber : ''}`
              : ''}
          </p>

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onCopyCode}
              title={t.copyCodeTitle}
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1 font-mono text-[11px] text-gray-500 transition hover:border-gray-300 hover:text-[var(--brand-navy,#0a1122)]"
            >
              <span dir="ltr">{computedUnit.code}</span>
              <Copy className="size-3 text-gray-400" />
              {copied && (
                <span className="font-sans text-[10px] text-[var(--brand-primary,#007a5a)]">
                  {t.copiedText}
                </span>
              )}
            </button>

            {cadastralCode && (
              <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-[11px] font-bold text-slate-600">
                <span>{uiL.cadastralCodeLabel}</span>
                <span dir="ltr">{cadastralCode}</span>
              </span>
            )}

            {allowOnlineViewing && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-extrabold text-[#2563eb]">
                <Video className="size-3.5" />
                <span>{uiL.onlineViewingBadge}</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#e6f4f9] px-3 py-1 text-[11px] font-bold text-[var(--brand-primary,#007a5a)]">
            {t.verifiedBadge}
          </span>
          {computedUnit.isUnderContractDeal ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-[11px] font-extrabold text-amber-950">
              <Clock className="size-3.5 text-amber-700" />
              <span>{uiL.underContractBadge}</span>
            </span>
          ) : (
            computedUnit.hasActiveOffer && (
              <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-extrabold text-orange-800">
                <Flame className="size-3.5 fill-orange-500 text-orange-600" />
                <span>{t.activeOfferBadge}</span>
              </span>
            )
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
            <span>{sharedCopied ? t.copiedText : t.shareBtn}</span>
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
  const { t: dict } = useTranslation()
  const activeLocale = (locale as LocaleCode) || 'ar'
  const uiL = dict.unitDetailsPage.uiLabels

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
      computedUnit.willingToDiscount ? Math.min(-4, rawDiffPct - 5) : rawDiffPct
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
    delStr.includes('готов') ||
    delStr.includes('მზად') ||
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

  const rawFeatures: string[] = Array.isArray(computedUnit.features)
    ? computedUnit.features
    : Array.isArray(computedUnit.tags)
      ? computedUnit.tags
      : []

  const normalizedSet = new Set(
    rawFeatures.map((f) => String(f || '').trim().toLowerCase()).filter(Boolean)
  )

  const matchedGroups: FeatureGroupDisplay[] = SIVRCE_FEATURE_GROUPS.map(
    (grp): FeatureGroupDisplay => {
      const matchedItems = grp.items.filter(
        (item) =>
          normalizedSet.has(item.id.toLowerCase()) ||
          normalizedSet.has(item.ar.toLowerCase()) ||
          normalizedSet.has(item.en.toLowerCase()) ||
          (item.ru && normalizedSet.has(item.ru.toLowerCase())) ||
          (item.ka && normalizedSet.has(item.ka.toLowerCase()))
      )
      return {
        key: String(grp.key),
        title: getOptionLabel(grp, activeLocale),
        items: matchedItems.map((it) => ({
          id: String(it.id),
          label: getOptionLabel(it, activeLocale),
          icon: getFeatureIcon(it.id),
        })),
      }
    }
  ).filter((g) => g.items.length > 0)

  const matchedIdsAndLabels = new Set<string>()
  SIVRCE_FEATURE_GROUPS.forEach((g) =>
    g.items.forEach((it) => {
      matchedIdsAndLabels.add(it.id.toLowerCase())
      matchedIdsAndLabels.add(it.ar.toLowerCase())
      matchedIdsAndLabels.add(it.en.toLowerCase())
      if (it.ru) matchedIdsAndLabels.add(it.ru.toLowerCase())
      if (it.ka) matchedIdsAndLabels.add(it.ka.toLowerCase())
    })
  )

  const unmatchedCustomFeatures = rawFeatures.filter(
    (f) =>
      String(f || '').trim() &&
      !matchedIdsAndLabels.has(String(f).trim().toLowerCase())
  )

  if (unmatchedCustomFeatures.length > 0) {
    matchedGroups.push({
      key: 'custom',
      title: uiL.otherFeaturesGroup,
      items: unmatchedCustomFeatures.map((f) => ({
        id: String(f),
        label: String(f),
        icon: CheckCircle2,
      })),
    })
  }

  const videoUrl = computedUnit.videoUrl || ''
  const tour3dUrl = computedUnit.tour3dUrl || ''
  const embedVideoUrl = getYoutubeEmbedUrl(videoUrl)

  return (
    <>
      <section className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5">
        {computedUnit.specs.map((spec: any, idx: number) => {
          const IconComponent = getSpecIcon(idx)
          return (
            <div
              key={`${spec.label}-${idx}`}
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

      {(videoUrl || tour3dUrl) && (
        <section className="mt-4 rounded-[20px] border border-gray-200/85 bg-white p-5 text-start shadow-2xs sm:p-6">
          <h2 className="text-sm font-black text-[var(--brand-navy,#0a1122)] sm:text-base">
            {uiL.videoAnd3dTitle}
          </h2>

          {embedVideoUrl && (
            <div className="mt-3.5 aspect-video w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
              <iframe
                src={embedVideoUrl}
                title={computedUnit.projectName}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          <div className="mt-3.5 flex flex-wrap items-center gap-3">
            {videoUrl && !embedVideoUrl && (
              <a
                href={videoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-600 px-4 text-xs font-extrabold text-white shadow-2xs transition hover:bg-red-700"
              >
                <Play className="size-3.5 fill-current" />
                <span>{uiL.watchVideoBtn}</span>
                <ExternalLink className="size-3" />
              </a>
            )}

            {tour3dUrl && (
              <a
                href={tour3dUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-xs font-extrabold text-[#2563eb] transition hover:bg-blue-100"
              >
                <Box className="size-4" />
                <span>{uiL.open3dTourBtn}</span>
                <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        </section>
      )}

      <section className="mt-4 rounded-[20px] border border-gray-200/85 bg-white p-5 text-start shadow-2xs sm:p-6">
        <h2 className="text-sm font-black text-[var(--brand-navy,#0a1122)] sm:text-base">
          {uiL.descriptionTitle}
        </h2>
        <p className="mt-2.5 whitespace-pre-line text-xs leading-[1.9] text-gray-600 sm:text-[13.5px]">
          {computedUnit.descriptionText}
        </p>
      </section>

      {matchedGroups.length > 0 && (
        <section className="mt-4 rounded-[20px] border border-gray-200/85 bg-white p-5 text-start shadow-2xs sm:p-6">
          <h2 className="text-base font-black text-[var(--brand-navy,#0a1122)] sm:text-lg">
            {uiL.featuresTitle}
          </h2>

          <div className="mt-4 space-y-5">
            {matchedGroups.map((group) => (
              <div key={group.key}>
                <span className="mb-2.5 block text-xs font-bold text-slate-400">
                  {group.title}
                </span>
                <div className="flex flex-wrap gap-2.5">
                  {group.items.map((item) => {
                    const ItemIcon = item.icon
                    return (
                      <span
                        key={`${group.key}-${item.id}`}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white px-4 py-2 text-xs font-bold text-[#0f1d40] shadow-2xs transition hover:border-[#2563eb]/40 hover:bg-blue-50/20"
                      >
                        <ItemIcon className="size-4 shrink-0 text-[#2563eb]" />
                        <span>{item.label}</span>
                      </span>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-4 rounded-[20px] border border-gray-200/85 bg-white p-5 text-start shadow-2xs sm:p-6">
        <div className="flex items-center gap-1.5 text-[11px] font-extrabold tracking-wider text-[#2563eb] uppercase">
          <Sparkles className="size-3.5" />
          <span>{uiL.scoreHeader}</span>
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
              {dealScore >= 85 ? uiL.excellentDeal : uiL.veryGoodDeal}
            </h3>
            <p className="mt-0.5 text-[11px] font-semibold text-gray-400 uppercase">
              {uiL.scoreCalculatedPrefix}
              {unitPricePerSqm}
              {uiL.scoreSqmUnit} {uiL.scoreCalculatedSuffix}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3.5 text-xs">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-semibold text-gray-600">
                {uiL.priceVsDistrict}
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
                {uiL.locationRating}
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
                {uiL.conditionAndDelivery}
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

export function UnitFinancialsCard({ computedUnit, onMakeOffer }: any) {
  const { t: dict, siteSettings } = useTranslation()
  const uiL = dict.unitDetailsPage.uiLabels
  const oT = (dict.accountPages?.offers as Record<string, any>) || {}
  const commPctDisplay = Number(siteSettings?.buyerCommission) || 1.25

  return (
    <>
      <section className="mt-4 rounded-[20px] border border-[#b8e6d5] bg-white p-5 text-start shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-gray-500">
              {uiL.finRequiredCashNow}
            </p>
            <p className="mt-1 flex items-baseline gap-1.5 text-3xl font-extrabold tracking-tight text-[var(--brand-navy,#0a1122)] tabular-nums sm:text-[36px]">
              <span dir="ltr">
                {computedUnit.requiredCash.toLocaleString('en-US')}
              </span>
              <span className="text-lg font-bold">{computedUnit.currency}</span>
            </p>
            <p className="mt-1 text-xs font-extrabold text-[var(--brand-primary,#007a5a)]">
              {uiL.finNoOverNote}
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
                {computedUnit.isUnderContractDeal
                  ? oT.waitlistBtnLabel
                  : uiL.finMakeOfferBtn}
              </span>
            </button>
          )}
        </div>

        {computedUnit.willingToDiscount && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-[#fffbeb] px-4 py-3 text-start">
            <p className="text-xs font-extrabold text-[#b45309]">
              {uiL.finNegotiableTitle}
            </p>
            <p className="mt-1 text-[11.5px] leading-relaxed font-semibold text-[#92400e]">
              {uiL.finNegotiableCleanDesc}
            </p>
          </div>
        )}

        {computedUnit.marketGain > 0 && (
          <div className="mt-3 rounded-xl border border-[#c8eedd] bg-[#ecfbf3] px-4 py-3 text-start">
            <p className="text-xs font-extrabold text-[var(--brand-primary,#007a5a)]">
              {uiL.finGainPrefix}{' '}
              <span dir="ltr">
                + {computedUnit.marketGain.toLocaleString('en-US')}
              </span>{' '}
              {computedUnit.currency}
            </p>
            <p className="mt-1 text-[11px] font-semibold text-[var(--brand-primary,#007a5a)]/85">
              {uiL.finMarketPriceTodayPrefix}{' '}
              <span dir="ltr">
                {computedUnit.marketPrice.toLocaleString('en-US')}
              </span>{' '}
              {computedUnit.currency} {uiL.finAfterCommissionSuffix}
            </p>
          </div>
        )}

        <p className="mt-3 text-[10.5px] leading-relaxed text-gray-400">
          {uiL.finMarketDisclaimer}
        </p>
      </section>

      <section className="mt-4 overflow-hidden rounded-[20px] border border-gray-200/80 bg-white shadow-sm">
        <div className="divide-y divide-gray-100 text-xs sm:text-[13px]">
          <div className="flex items-center justify-between px-5 py-3.5">
            <span className="font-medium text-gray-500">
              {uiL.finRemainingToDev}
            </span>
            <strong className="text-sm font-black text-[var(--brand-navy,#0a1122)] tabular-nums sm:text-base">
              <span dir="ltr">
                {computedUnit.remainingToDeveloper.toLocaleString('en-US')}
              </span>{' '}
              {computedUnit.currency}
            </strong>
          </div>

          <div className="flex items-center justify-between px-5 py-3.5">
            <span className="font-medium text-gray-500">
              {uiL.finInstallment}
            </span>
            <strong className="text-sm font-black text-[var(--brand-navy,#0a1122)] tabular-nums sm:text-base">
              <span dir="ltr">
                {computedUnit.installmentAmount.toLocaleString('en-US')}
              </span>{' '}
              {computedUnit.currency} · {computedUnit.installmentFreq}
            </strong>
          </div>

          <div className="flex items-center justify-between px-5 py-3.5">
            <span className="font-medium text-gray-500">
              {uiL.finRemainingMonthsLabel}
            </span>
            <strong className="text-sm font-black text-[var(--brand-navy,#0a1122)]">
              {computedUnit.remainingInstallmentMonths > 0
                ? `${computedUnit.remainingInstallmentMonths} ${uiL.finMonthsWord}`
                : uiL.finFullyPaid}
            </strong>
          </div>

          <div className="flex items-center justify-between px-5 py-3.5">
            <span className="font-medium text-gray-500">{uiL.finDelivery}</span>
            <strong className="text-sm font-black text-[var(--brand-navy,#0a1122)]">
              {computedUnit.deliveryYear}
            </strong>
          </div>

          <div className="px-5 py-3.5">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-500">
                {uiL.finCommissionLabel}
              </span>
              <strong
                dir="ltr"
                className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-black text-[#007a5a]"
              >
                {commPctDisplay}%
              </strong>
            </div>
            <p className="mt-1 text-start text-[10.5px] text-gray-400">
              {uiL.finCommissionSub}
            </p>
          </div>

          <div className="flex items-center justify-between bg-[#f1f5f9] px-5 py-4">
            <span className="font-extrabold text-[var(--brand-navy,#0a1122)]">
              {uiL.finTotalRequiredNow}
            </span>
            <strong className="text-base font-black text-[var(--brand-navy,#0a1122)] tabular-nums sm:text-lg">
              <span dir="ltr">
                {computedUnit.requiredCash.toLocaleString('en-US')}
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
  const { t: dict } = useTranslation()
  const uiL = dict.unitDetailsPage.uiLabels

  if (!similarDbUnits || similarDbUnits.length === 0) return null

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-start">
        <h2 className="text-base font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-lg">
          {uiL.similarTitle}
        </h2>
        <span className="text-[11px] text-gray-400">
          {uiL.similarSubtitle}
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
                    <span>{t?.featuredBadge}</span>
                  </span>
                )}
                {item.code && (
                  <span
                    dir="ltr"
                    className="absolute bottom-2 start-2 rounded-md bg-black/65 px-1.5 py-0.5 font-mono text-[9.5px] font-bold text-white backdrop-blur-xs"
                  >
                    {item.code}
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
                  {uiL.similarReqCashPrefix}{' '}
                  <span dir="ltr">{item.cash}</span> {item.currency}
                </p>
              </div>
            </div>

            <div className="px-3 pt-1 pb-3 text-start">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--brand-primary,#007a5a)]">
                <span>{uiL.similarViewDetailsBtn}</span>
                <span className="rtl:rotate-0 ltr:rotate-180">←</span>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}