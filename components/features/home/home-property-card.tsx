'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import {
  Bath,
  BedDouble,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Crown,
  Eye,
  Heart,
  MapPin,
  Phone,
  Ruler,
  ShieldCheck,
} from 'lucide-react'
import { getLocalizedGeorgiaAreaName } from '@/components/shared/georgia-areas'
import { useTranslation } from '@/lib/i18n'
import {
  cleanPureLocaleText,
  getLocalizedUnitTitle,
  SHOWCASE_IMAGES,
  type HomeUnitCardItem,
} from './home-data'

export function HomePropertyCard({
  unit,
  badgeLabel,
  isFav,
  onToggleFav,
}: {
  unit: HomeUnitCardItem
  badgeLabel?: string
  isFav: boolean
  onToggleFav: (id: string) => void
}) {
  const { locale, dir } = useTranslation()
  const isAr = locale === 'ar'
  const GEL = '₾'

  // ضمان وجود 4 صور على الأقل لكل كارت حتى يعمل زر التقليب يميناً ويساراً دائماً
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

  const sqmPrice =
    unit.size > 0
      ? Math.round(
          (unit.contractPrice || unit.price) / unit.size
        ).toLocaleString('en-US')
      : '5,253'

  const rawLocalizedArea = getLocalizedGeorgiaAreaName(unit.area, locale)
  const cleanArea = cleanPureLocaleText(rawLocalizedArea, locale)
  const cleanTitle = getLocalizedUnitTitle(unit, locale, cleanArea)
  const detailHref =
    unit.id.startsWith('showcase-') ||
    unit.id.startsWith('12000') ||
    unit.id.startsWith('10000')
      ? '/opportunities'
      : `/opportunities/${unit.id}`

  const views = unit.viewsCount || 82
  const refNum = unit.id.replace(/[^0-9]/g, '').slice(0, 8) || '12000283'
  const totalCount = Math.max(unit.imagesCount || 11, gallery.length)

  return (
    <article className="sivrce-card group flex w-[285px] shrink-0 snap-start flex-col overflow-hidden rounded-[22px] border border-slate-200/90 bg-white shadow-xs sm:w-[310px] lg:w-[318px]">
      {/* صورة العقار العلوية مطابقة للصورة 100% */}
      <div className="relative h-[225px] w-full overflow-hidden bg-slate-100">
        <Link href={detailHref} className="block h-full w-full">
          <img
            src={gallery[imgIdx] || unit.image}
            alt={cleanTitle}
            className="h-full w-full object-cover"
          />
        </Link>

        {/* شارة SUPER VIP البرتقالية أعلى يمين الكارت (start-3.5) */}
        <span className="pointer-events-none absolute top-3.5 start-3.5 z-10 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-3 py-1 text-[10.5px] font-black text-white shadow-xs">
          <Crown className="size-3" />
          <span>{badgeLabel || 'SUPER VIP'}</span>
        </span>

        {/* زر القلب الدائري الأبيض أعلى يسار الكارت (end-3.5) */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onToggleFav(unit.id)
          }}
          className="absolute top-3.5 end-3.5 z-20 flex size-8 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-xs transition hover:scale-110"
          aria-label="Favorite"
        >
          <Heart
            className={`size-4 ${
              isFav ? 'fill-rose-500 text-rose-500' : ''
            }`}
          />
        </button>

        {/* أزرار تقليب الصور يميناً ويساراً داخل الكارت (تعمل فوراً عند الضغط) */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setImgIdx((prev) => (prev === 0 ? gallery.length - 1 : prev - 1))
          }}
          className="absolute start-2.5 top-1/2 z-20 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#0f1d40] opacity-0 shadow-md transition hover:scale-105 hover:bg-white group-hover:opacity-100"
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
          className="absolute end-2.5 top-1/2 z-20 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#0f1d40] opacity-0 shadow-md transition hover:scale-105 hover:bg-white group-hover:opacity-100"
          aria-label="Next photo"
        >
          {dir === 'rtl' ? (
            <ChevronLeft className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </button>

        {/* عداد الصور الأسود الصغير + خطوط الصور في أسفل الصورة */}
        <div className="pointer-events-none absolute inset-x-3 bottom-2.5 z-10 flex items-center justify-between gap-2">
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

      {/* محتوى الكارت المطابق للصورة */}
      <div className="flex flex-1 flex-col justify-between p-4 text-start sm:p-5">
        <div>
          {/* السعر الرئيسي باللاري الجورجي */}
          <div className="flex items-baseline justify-start gap-2">
            <strong
              dir="ltr"
              className="text-[22px] font-black tracking-tight text-[#0f1d40]"
            >
              {unit.price.toLocaleString('en-US')} {GEL}
              {unit.category === 'rent_daily'
                ? isAr
                  ? '/يوم'
                  : '/day'
                : unit.category === 'rent_monthly'
                  ? isAr
                    ? '/شهر'
                    : '/mo'
                  : ''}
            </strong>
          </div>

          {/* سعر المتر المربع */}
          <p dir="ltr" className="mt-0.5 text-xs font-bold text-slate-400">
            {sqmPrice} {GEL}/{isAr ? 'م²' : 'm²'}
          </p>

          {/* عنوان العقار */}
          <Link href={detailHref}>
            <h3 className="mt-3 line-clamp-2 text-[13.5px] font-extrabold leading-snug text-[#0f1d40] transition hover:text-[#2563eb]">
              {cleanTitle}
            </h3>
          </Link>

          {/* الموقع مع أيقونة الدبوس */}
          <p className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <MapPin className="size-3.5 shrink-0 text-slate-400" />
            <span className="truncate">{cleanArea}</span>
          </p>
        </div>

        <div className="mt-4">
          {/* سطر المساحة والغرف والحمامات والطابق */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[11.5px] font-bold text-slate-600">
            <span className="inline-flex items-center gap-1">
              <Ruler className="size-3.5 text-slate-400" />
              <span>
                {unit.size} {isAr ? 'م²' : 'm²'}
              </span>
            </span>
            <span className="inline-flex items-center gap-1">
              <BedDouble className="size-3.5 text-slate-400" />
              <span>
                {unit.bedrooms} {isAr ? 'غرف النوم' : 'Beds'} · {unit.rooms}{' '}
                {isAr ? 'الغرف' : 'Rooms'}
              </span>
            </span>
            <span className="inline-flex items-center gap-2.5 text-slate-500">
              <span className="inline-flex items-center gap-0.5">
                <Bath className="size-3.5 text-slate-400" />
                {unit.bathrooms}
              </span>
              {unit.floor && (
                <span dir="ltr">
                  {unit.floor}/{unit.totalFloors || 14}
                </span>
              )}
            </span>
          </div>

          {/* صف زر "اتصال" البرتقالي + شارة "موثق" */}
          <div className="mt-3.5 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-extrabold text-[#2563eb]">
              <ShieldCheck className="size-3.5" />
              <span>{isAr ? 'موثق' : 'Verified'}</span>
            </span>

            <Link
              href={detailHref}
              className="inline-flex h-8.5 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-4.5 text-xs font-black text-white shadow-xs transition hover:opacity-95"
            >
              <Phone className="size-3" />
              <span>{isAr ? 'اتصال' : 'Call'}</span>
            </Link>
          </div>

          {/* الشريط السفلي الرمادي: الوقت والمشاهدات ورقم الإعلان */}
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[10.5px] font-semibold text-slate-400">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1">
                <Clock3 className="size-3" />
                {isAr ? 'قبل 3 أسابيع' : '3 weeks ago'}
              </span>
              <span className="inline-flex items-center gap-1">
                <Eye className="size-3" />
                {views}
              </span>
            </div>
            <span dir="ltr">#{refNum}</span>
          </div>
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
  cardBadgeOverride,
  favorites,
  onToggleFav,
}: {
  badgeText: string
  badgeClass: string
  title: string
  subtitle?: string
  allLinkText: string
  allLinkHref?: string
  units: HomeUnitCardItem[]
  cardBadgeOverride?: string
  favorites: string[]
  onToggleFav: (id: string) => void
}) {
  const { dir } = useTranslation()
  const scrollRef = useRef<HTMLDivElement>(null)

  // دالة تقليب الكروت يميناً ويساراً بشكل مضمون ودائري (Infinite Loop)
  const handleScroll = (direction: 'prev' | 'next') => {
    const el = scrollRef.current
    if (!el) return

    const step = 338
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

  return (
    <section className="mx-auto max-w-[1320px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="text-start">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-[11px] font-black ${badgeClass}`}
          >
            <Crown className="size-3.5" />
            <span>{badgeText}</span>
          </span>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-[#0f1d40] sm:text-4xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
              {subtitle}
            </p>
          )}
        </div>

        <Link
          href={allLinkHref}
          className="text-xs font-extrabold text-[#2563eb] hover:underline sm:text-sm"
        >
          {allLinkText}
        </Link>
      </div>

      {/* حاوية الكروت مع أزرار التقليب الدائرية على الجانبين */}
      <div className="relative">
        <button
          type="button"
          onClick={() => handleScroll('prev')}
          aria-label="Previous listings"
          className="absolute -start-2 top-1/2 z-30 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-[#0f1d40] shadow-[0_8px_24px_rgba(15,29,64,0.15)] transition hover:scale-110 hover:bg-slate-50 sm:-start-4"
        >
          {dir === 'rtl' ? (
            <ChevronRight className="size-5" />
          ) : (
            <ChevronLeft className="size-5" />
          )}
        </button>

        <div
          ref={scrollRef}
          className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-1 pb-4 no-scrollbar"
        >
          {units.map((unit) => (
            <HomePropertyCard
              key={unit.id}
              unit={unit}
              badgeLabel={cardBadgeOverride}
              isFav={favorites.includes(unit.id)}
              onToggleFav={onToggleFav}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => handleScroll('next')}
          aria-label="Next listings"
          className="absolute -end-2 top-1/2 z-30 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-[#0f1d40] shadow-[0_8px_24px_rgba(15,29,64,0.15)] transition hover:scale-110 hover:bg-slate-50 sm:-end-4"
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