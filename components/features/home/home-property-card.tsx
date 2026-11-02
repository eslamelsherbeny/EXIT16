'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  Crown,
  Eye,
  FileCheck2,
  Flame,
  Heart,
  Layers,
  Sparkles,
} from 'lucide-react'
import { getLocalizedGeorgiaAreaName } from '@/components/shared/georgia-areas'
import { useTranslation } from '@/lib/i18n'
import {
  cleanPureLocaleText,
  getLocalizedUnitTitle,
  SHOWCASE_IMAGES,
  type HomeUnitCardItem,
} from './home-data'

function formatRelativePublishTime(createdAt?: string, isAr = true): string {
  if (!createdAt) return isAr ? 'قبل 3 أسابيع' : '3 weeks ago'
  const createdTime = new Date(createdAt).getTime()
  if (Number.isNaN(createdTime)) return isAr ? 'قبل 3 أسابيع' : '3 weeks ago'

  const diffDays = Math.max(
    0,
    Math.floor((Date.now() - createdTime) / (1000 * 60 * 60 * 24))
  )

  if (diffDays === 0) return isAr ? 'اليوم' : 'Today'
  if (diffDays === 1) return isAr ? 'أمس' : 'Yesterday'
  if (diffDays === 2) return isAr ? 'أول أمس' : '2 days ago'
  if (diffDays < 7)
    return isAr ? `قبل ${diffDays} أيام` : `${diffDays} days ago`
  if (diffDays < 14) return isAr ? 'قبل أسبوع' : '1 week ago'
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return isAr
      ? `قبل ${weeks} ${weeks === 2 ? 'أسبوعين' : 'أسابيع'}`
      : `${weeks} weeks ago`
  }
  const months = Math.max(1, Math.floor(diffDays / 30))
  return isAr
    ? `قبل ${months} ${months === 1 ? 'شهر' : months === 2 ? 'شهرين' : 'شهور'}`
    : `${months} mo ago`
}

export function HomePropertyCard({
  unit,
  isFav,
  onToggleFav,
  fullWidthOnGrid = false,
}: {
  unit: HomeUnitCardItem
  isFav: boolean
  onToggleFav: (id: string) => void
  fullWidthOnGrid?: boolean
}) {
  const { locale, dir } = useTranslation()
  const isAr = locale === 'ar'
  const USD = '$'

  const gallery =
    unit.images && unit.images.length >= 2
      ? unit.images
      : [
          unit.image,
          SHOWCASE_IMAGES.interior,
          SHOWCASE_IMAGES.park,
          SHOWCASE_IMAGES.villa,
        ]

  const [imgIdx, setImgIdx] = useState(0)

  const contractPriceVal = unit.contractPrice || unit.price
  const remainingVal =
    unit.remainingAmount !== undefined
      ? unit.remainingAmount
      : Math.max(0, contractPriceVal - unit.price)

  const marketPriceVal =
    unit.marketPrice && unit.marketPrice > contractPriceVal
      ? unit.marketPrice
      : 0

  const gainVal =
    unit.gainAmount !== undefined
      ? unit.gainAmount
      : marketPriceVal > contractPriceVal
        ? Math.max(
            0,
            Math.round(
              marketPriceVal - contractPriceVal - contractPriceVal * 0.0125
            )
          )
        : 0

  const sqmPrice =
    unit.size > 0
      ? Math.round(contractPriceVal / unit.size).toLocaleString('en-US')
      : '1,350'

  const rawLocalizedArea = getLocalizedGeorgiaAreaName(unit.area, locale)
  const cleanArea = cleanPureLocaleText(rawLocalizedArea, locale)
  const projectName = getLocalizedUnitTitle(unit, locale, cleanArea)
  const subtitleLine = unit.developer
    ? `${unit.developer} · ${cleanArea}`
    : cleanArea

  const detailHref =
    unit.id.startsWith('showcase-') ||
    unit.id.startsWith('12000') ||
    unit.id.startsWith('10000')
      ? '/opportunities'
      : `/opportunities/${unit.id}`

  const views = unit.viewsCount || 85
  const rawCode =
    unit.code ||
    `U-${unit.id.replace(/[^0-9]/g, '').slice(0, 5) || '89716'}`
  const displayCode = rawCode.startsWith('#') ? rawCode : `#${rawCode}`
  const publishedAgo = formatRelativePublishTime(unit.createdAt, isAr)
  const totalCount = Math.max(unit.imagesCount || 11, gallery.length)

  const activeTier =
    unit.boostTier || (unit.isFeatured ? 'super_vip' : null)

  const unitTypeWord =
    unit.unitTypeLabel || (isAr ? 'شقة' : 'Apartment')

  const instText =
    unit.installmentAmount && unit.installmentAmount > 0
      ? `${USD}${unit.installmentAmount.toLocaleString('en-US')}${
          unit.installmentFreq ? ` · ${unit.installmentFreq}` : ''
        }`
      : isAr
        ? 'خالص الأقساط'
        : 'Fully Paid'

  const deliveryLabel = unit.deliveryText || '2026'

  return (
    <article
      className={`sivrce-card group relative flex flex-col justify-between overflow-hidden rounded-[20px] border bg-white shadow-xs ${
        fullWidthOnGrid
          ? 'h-full w-full'
          : 'w-[300px] shrink-0 snap-start sm:w-[326px] lg:w-[336px]'
      } ${
        activeTier === 'super_vip'
          ? 'border-orange-200/90 border-t-[3px] border-t-[#ff6437]'
          : activeTier === 'vip_plus'
            ? 'border-indigo-200/90 border-t-[3px] border-t-[#4f46e5]'
            : 'border-slate-200/90 border-t-[3px] border-t-[#007a5a]'
      }`}
    >
      <div>
        {/* المعرض العلوي للصور بنفس الارتفاع الأصلي 205px */}
        <div className="relative h-[205px] w-full overflow-hidden bg-slate-100">
          <Link href={detailHref} className="block h-full w-full">
            <img
              src={gallery[imgIdx] || unit.image}
              alt={projectName}
              className="h-full w-full object-cover"
            />
          </Link>

          {activeTier === 'super_vip' && (
            <span className="pointer-events-none absolute top-3 start-3 z-10 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-3 py-1 text-[10.5px] font-bold text-white shadow-sm">
              <Crown className="size-3" />
              <span>SUPER VIP</span>
            </span>
          )}

          {activeTier === 'vip_plus' && (
            <span className="pointer-events-none absolute top-3 start-3 z-10 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] px-3 py-1 text-[10.5px] font-bold text-white shadow-sm">
              <Flame className="size-3" />
              <span>+VIP</span>
            </span>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onToggleFav(unit.id)
            }}
            className="absolute top-3 end-3 z-20 flex size-8 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-xs transition hover:scale-110"
            aria-label="Favorite"
          >
            <Heart
              className={`size-4 ${
                isFav ? 'fill-rose-500 text-rose-500' : ''
              }`}
            />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setImgIdx((prev) => (prev === 0 ? gallery.length - 1 : prev - 1))
            }}
            className="absolute start-2.5 top-1/2 z-20 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#0f1d40] opacity-90 shadow-md transition hover:scale-105 hover:bg-white md:opacity-0 md:group-hover:opacity-100"
            aria-label="Previous photo"
          >
            {dir === 'rtl' ? (
              <ChevronRight className="size-4" />
            ) : (
              <ChevronLeft className="size-4" />
            )}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setImgIdx((prev) => (prev + 1) % gallery.length)
            }}
            className="absolute end-2.5 top-1/2 z-20 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#0f1d40] opacity-90 shadow-md transition hover:scale-105 hover:bg-white md:opacity-0 md:group-hover:opacity-100"
            aria-label="Next photo"
          >
            {dir === 'rtl' ? (
              <ChevronLeft className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </button>

          <div className="pointer-events-none absolute inset-x-3 bottom-2 z-10 flex items-center justify-between gap-2">
            <div className="flex flex-1 items-center gap-1">
              {gallery.map((_, idx) => (
                <span
                  key={idx}
                  className={`h-0.5 flex-1 rounded-full transition-all ${
                    imgIdx === idx ? 'bg-white' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
            <span
              dir="ltr"
              className="rounded-md bg-black/75 px-2 py-0.5 text-[10px] font-bold text-white"
            >
              {totalCount}/{imgIdx + 1}
            </span>
          </div>
        </div>

        {/* محتوى الكارت مع تقليل المسافات الفارغة الزائدة */}
        <div className="px-4 pt-3 pb-2 text-start">
          {/* 1. اسم المشروع */}
          <Link href={detailHref}>
            <h3 className="line-clamp-1 text-[17px] font-bold leading-tight text-[#0f1d40] transition hover:text-[#2563eb]">
              {projectName}
            </h3>
          </Link>

          {/* 2. اسم المطور والمنطقة */}
          <p className="mt-0.5 line-clamp-1 text-xs font-medium text-slate-500">
            {subtitleLine}
          </p>

          {/* 3. شارة التوثيق وسعر المتر المربع */}
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/80 bg-[#eaf8f2] px-2.5 py-0.5 text-[10.5px] font-bold text-[#007a5a]">
              <FileCheck2 className="size-3 shrink-0" />
              <span>{isAr ? 'متحقق بالمستندات' : 'Docs Verified'}</span>
            </span>

            <span
              dir="ltr"
              className="text-xs font-bold text-slate-400 tabular-nums"
            >
              {USD}
              {sqmPrice}/{isAr ? 'م²' : 'm²'}
            </span>
          </div>

          {/* 4. المواصفات */}
          <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs font-bold text-[#1e293b]">
            <span>
              {unitTypeWord} · {unit.rooms} {isAr ? 'غرف' : 'Rooms'} ·{' '}
              {unit.bathrooms} {isAr ? 'حمام' : 'Bath'} · {unit.size}{' '}
              {isAr ? 'م²' : 'm²'}
            </span>
            {unit.floor !== undefined && (
              <span
                dir="ltr"
                className="inline-flex items-center gap-0.5 text-slate-500"
              >
                · <Layers className="size-3.5 text-slate-400" /> {unit.floor}/
                {unit.totalFloors || 16}
              </span>
            )}
          </p>

          {/* 5. المطلوب كاش دلوقتي */}
          <div className="mt-2.5 flex items-baseline justify-between gap-2">
            <div>
              <p className="text-[11.5px] font-medium text-slate-500">
                {isAr ? 'المطلوب كاش دلوقتي' : 'Required Cash Now'}
              </p>
              <strong
                dir="ltr"
                className="block text-[22px] font-bold leading-tight tracking-tight text-[#0f1d40] tabular-nums"
              >
                {USD}
                {unit.price.toLocaleString('en-US')}
              </strong>
            </div>

            {unit.negotiable && (
              <p className="flex items-center gap-0.5 rounded-lg bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-[#b45309]">
                <span>↓</span>
                <span>{isAr ? 'قابل للتفاوض' : 'Negotiable'}</span>
              </p>
            )}
          </div>

          {/* 6. صندوق مكسبك عن سعر السوق (مضغوط الرأسي مع الحفاظ على كل البيانات) */}
          {gainVal > 0 && (
            <div className="mt-2 rounded-xl bg-[#eaf8f2] px-3 py-2 text-start">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-[11px] font-bold text-[#007a5a]">
                  {isAr ? 'مكسبك عن سعر السوق' : 'Your Market Gain'}
                </p>
                <strong
                  dir="ltr"
                  className="text-base font-bold text-[#007a5a] tabular-nums"
                >
                  + {USD}
                  {gainVal.toLocaleString('en-US')}
                </strong>
              </div>
              {marketPriceVal > 0 && (
                <p className="mt-0.5 text-[10px] font-medium leading-tight text-[#2b8a6e]">
                  {isAr
                    ? `سعر السوق اليوم: ${USD}${marketPriceVal.toLocaleString('en-US')} · بعد خصم عمولتنا 1.25%`
                    : `Market price today: ${USD}${marketPriceVal.toLocaleString('en-US')} · after 1.25% fee`}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* الجزء السفلي الملموم: الـ 3 سطور المالية + زر تفاصيل + شريط المشاهدات والكود */}
      <div className="px-4 pt-1 pb-3">
        <div className="space-y-1.5 border-t border-slate-100 pt-2.5 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-slate-500">
              {isAr ? 'المتبقي للمطور' : 'Remaining to Developer'}
            </span>
            <strong
              dir="ltr"
              className="font-bold text-[#0f1d40] tabular-nums"
            >
              {USD}
              {remainingVal.toLocaleString('en-US')}
            </strong>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-slate-500">
              {isAr ? 'القسط' : 'Installment'}
            </span>
            <strong className="font-bold text-[#0f1d40] tabular-nums">
              {instText}
            </strong>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-slate-500">
              {isAr ? 'الاستلام' : 'Delivery'}
            </span>
            <strong className="font-bold text-[#0f1d40] tabular-nums">
              {deliveryLabel}
            </strong>
          </div>
        </div>

        <Link
          href={detailHref}
          className="mt-2.5 flex h-9.5 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#ff6437] to-[#ff4f69] text-xs font-bold text-white shadow-xs transition hover:opacity-95 sm:text-[13px]"
        >
          <span>{isAr ? 'تفاصيل' : 'Details'}</span>
        </Link>

        {/* شريط المشاهدات والوقت والكود */}
        <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-[10.5px] font-medium text-slate-400">
          <div className="flex items-center gap-3">
            <span
              className="inline-flex items-center gap-1 text-slate-500"
              title={isAr ? 'عدد المشاهدات' : 'Views'}
            >
              <Eye className="size-3.5 text-slate-400" />
              <span className="tabular-nums">{views}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock3 className="size-3.5 text-slate-400" />
              <span>{publishedAgo}</span>
            </span>
          </div>

          <span
            dir="ltr"
            className="font-mono text-[10.5px] font-semibold text-slate-400"
          >
            {displayCode}
          </span>
        </div>
      </div>
    </article>
  )
}

export function HomeCardsCarouselSection({
  badgeText,
  badgeClass,
  title,
  subtitle,
  allLinkText,
  allLinkHref = '/opportunities',
  units,
  favorites,
  onToggleFav,
}: {
  badgeText?: string
  badgeClass?: string
  title: string
  subtitle?: string
  allLinkText: string
  allLinkHref?: string
  units: HomeUnitCardItem[]
  favorites: string[]
  onToggleFav: (id: string) => void
}) {
  const { dir } = useTranslation()
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleScroll = (direction: 'prev' | 'next') => {
    const el = scrollRef.current
    if (!el) return

    const step = 356
    const isRtl = dir === 'rtl'
    const delta =
      direction === 'next' ? (isRtl ? -step : step) : isRtl ? step : -step

    const maxScroll = el.scrollWidth - el.clientWidth
    const current = Math.abs(el.scrollLeft)

    if (direction === 'next' && current >= maxScroll - 20) {
      el.scrollTo({ left: 0, behavior: 'smooth' })
    } else if (direction === 'prev' && current <= 20) {
      el.scrollTo({
        left: isRtl ? -maxScroll : maxScroll,
        behavior: 'smooth',
      })
    } else {
      el.scrollBy({ left: delta, behavior: 'smooth' })
    }
  }

  if (!units || units.length === 0) return null

  return (
    <section className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="text-start">
          {badgeText && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-[11px] font-bold ${badgeClass}`}
            >
              {badgeText === 'SUPER VIP' ? (
                <Crown className="size-3.5" />
              ) : (
                <Sparkles className="size-3.5" />
              )}
              <span>{badgeText}</span>
            </span>
          )}
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#0f1d40] sm:text-3xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
              {subtitle}
            </p>
          )}
        </div>

        <Link
          href={allLinkHref}
          className="text-xs font-bold text-[#2563eb] hover:underline sm:text-sm"
        >
          {allLinkText}
        </Link>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => handleScroll('prev')}
          aria-label="Previous listings"
          className="absolute -start-3 top-1/2 z-30 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-[#0f1d40] shadow-[0_8px_24px_rgba(15,29,64,0.15)] transition hover:scale-110 hover:bg-slate-50 md:flex"
        >
          {dir === 'rtl' ? (
            <ChevronRight className="size-5" />
          ) : (
            <ChevronLeft className="size-5" />
          )}
        </button>

        <div
          ref={scrollRef}
          className="carousel-edge-fade flex snap-x snap-mandatory items-stretch gap-5 overflow-x-auto px-2 pb-4 no-scrollbar"
        >
          {units.map((unit) => (
            <HomePropertyCard
              key={unit.id}
              unit={unit}
              isFav={favorites.includes(unit.id)}
              onToggleFav={onToggleFav}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => handleScroll('next')}
          aria-label="Next listings"
          className="absolute -end-3 top-1/2 z-30 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-[#0f1d40] shadow-[0_8px_24px_rgba(15,29,64,0.15)] transition hover:scale-110 hover:bg-slate-50 md:flex"
        >
          {dir === 'rtl' ? (
            <ChevronLeft className="size-5" />
          ) : (
            <ChevronRight className="size-5" />
          )}
        </button>
      </div>
    </section>
  )
}

export function HomeVipPlusSection({
  vipPlusUnits,
  favorites,
  onToggleFav,
}: {
  vipPlusUnits: HomeUnitCardItem[]
  favorites: string[]
  onToggleFav: (id: string) => void
}) {
  const { locale } = useTranslation()
  const isAr = locale === 'ar'

  if (!vipPlusUnits || vipPlusUnits.length === 0) {
    return null
  }

  return (
    <section className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="text-start">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#4f46e5] to-[#6366f1] px-3.5 py-1 text-[11px] font-bold text-white shadow-xs">
            <Flame className="size-3.5" />
            <span>+VIP</span>
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#0f1d40] sm:text-3xl">
            {isAr ? 'إعلانات +VIP' : 'VIP+ listings'}
          </h2>
          <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
            {isAr
              ? 'إعلانات ذات أولوية — عقارات موثقة بالمستندات وجاهزة للتنازل'
              : 'Priority listings — verified installment exit properties'}
          </p>
        </div>

        <Link
          href="/opportunities"
          className="text-xs font-bold text-[#2563eb] hover:underline sm:text-sm"
        >
          {isAr ? 'كل +VIP ←' : 'All VIP+ →'}
        </Link>
      </div>

      <div className="flex flex-col items-stretch gap-5 lg:flex-row">
        <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 no-scrollbar lg:pb-0">
          {vipPlusUnits.map((unit) => (
            <HomePropertyCard
              key={unit.id}
              unit={{ ...unit, boostTier: 'vip_plus' }}
              isFav={favorites.includes(unit.id)}
              onToggleFav={onToggleFav}
            />
          ))}
        </div>

        <Link
          href="#boost-packages-section"
          className="sivrce-card group flex min-h-[340px] flex-1 flex-col items-center justify-center rounded-[24px] border border-dashed border-indigo-200/90 bg-white p-8 text-center shadow-2xs transition hover:border-[#4f46e5] hover:bg-indigo-50/20"
        >
          <div className="flex size-14 items-center justify-center rounded-full bg-gradient-to-tr from-[#4f46e5] to-[#6366f1] text-white shadow-[0_10px_25px_rgba(79,70,229,0.35)] transition-transform duration-300 group-hover:scale-110">
            <Flame className="size-6" />
          </div>
          <strong className="mt-4 block text-base font-bold text-[#0f1d40]">
            {isAr ? 'إعلانك هنا' : 'Your listing here'}
          </strong>
          <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-[#4f46e5] group-hover:underline">
            <span>{isAr ? '← +VIP' : 'VIP+ →'}</span>
          </span>
        </Link>
      </div>
    </section>
  )
}