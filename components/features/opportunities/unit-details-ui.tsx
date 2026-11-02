'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Crown,
  Eye,
  FileCheck2,
  Flame,
  Heart,
  MapPin,
  Share2,
  ShieldCheck,
  Sparkles,
  Wallet,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { useTranslation, type LocaleCode } from '@/lib/i18n'

function formatRelativeTime(createdAt?: string, isAr = true): string {
  if (!createdAt) return isAr ? 'قبل أسبوعين' : '2 weeks ago'
  const createdTime = new Date(createdAt).getTime()
  if (Number.isNaN(createdTime)) return isAr ? 'قبل أسبوعين' : '2 weeks ago'

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

export function UnitDetailsHeader({
  computedUnit,
  t,
  liked,
  onToggleFavorite,
  copied,
  onCopyCode,
}: {
  computedUnit: any
  t: Record<string, any>
  liked: boolean
  onToggleFavorite: () => void
  copied: boolean
  onCopyCode: () => void
}) {
  const { locale, dir } = useTranslation()
  const isAr = locale === 'ar'
  const isRtl = dir === 'rtl'

  const gallery: Array<{ url: string; caption?: string }> =
    Array.isArray(computedUnit.gallery) && computedUnit.gallery.length > 0
      ? computedUnit.gallery
      : [
          {
            url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85',
          },
        ]

  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [zoomed, setZoomed] = useState(false)
  const [sharedCopied, setSharedCopied] = useState(false)

  const totalPhotos = gallery.length
  const sideThumbnails = gallery.slice(1, 5)
  const extraPhotosCount = Math.max(0, totalPhotos - 5)

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setZoomed(false)
    setActiveIndex((prev) => (prev === 0 ? totalPhotos - 1 : prev - 1))
  }

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setZoomed(false)
    setActiveIndex((prev) => (prev + 1) % totalPhotos)
  }

  useEffect(() => {
    if (!lightboxOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxOpen(false)
        setZoomed(false)
      } else if (e.key === 'ArrowLeft') {
        isRtl ? handleNext() : handlePrev()
      } else if (e.key === 'ArrowRight') {
        isRtl ? handlePrev() : handleNext()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxOpen, isRtl, totalPhotos])

  const viewsTotal = Number(computedUnit.viewsCount) || 137
  const viewsToday = Math.max(1, Math.min(9, Math.round(viewsTotal * 0.03)))
  const publishedAgo = formatRelativeTime(computedUnit.createdAt, isAr)
  const activeTier =
    computedUnit.boostTier || (computedUnit.featured ? 'super_vip' : null)

  const handleShareUrl = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href)
      setSharedCopied(true)
      setTimeout(() => setSharedCopied(false), 2000)
    }
  }

  return (
    <>
      {/* شريط المسار العلوي (Breadcrumbs) */}
      <nav className="mb-3 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-400">
        <Link href="/" className="hover:text-[#0f1d40]">
          {isAr ? 'الرئيسية' : 'Home'}
        </Link>
        <span>/</span>
        <Link href="/opportunities" className="hover:text-[#0f1d40]">
          {isAr ? 'الفرص المتاحة' : 'Opportunities'}
        </Link>
        <span>/</span>
        <span className="truncate font-bold text-slate-600">
          {computedUnit.projectName} · {computedUnit.areaName}
        </span>
      </nav>

      {/* 1. معرض الصور الاحترافي */}
      <section className="overflow-hidden">
        <div
          className={`grid grid-cols-1 gap-3 ${
            sideThumbnails.length > 0 ? 'lg:grid-cols-12' : ''
          }`}
        >
          {/* الصورة الرئيسية الكبيرة */}
          <div
            onClick={() => {
              setLightboxOpen(true)
              setZoomed(false)
            }}
            className={`group relative h-[280px] cursor-pointer overflow-hidden rounded-[22px] bg-slate-100 sm:h-[380px] lg:h-[430px] ${
              sideThumbnails.length > 0 ? 'lg:col-span-8' : 'lg:col-span-12'
            }`}
          >
            <img
              src={gallery[activeIndex]?.url || gallery[0]?.url}
              alt={computedUnit.projectName}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />

            {activeTier === 'super_vip' && (
              <span className="pointer-events-none absolute top-4 start-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-3.5 py-1.5 text-xs font-extrabold text-white shadow-md">
                <Crown className="size-3.5" />
                <span>SUPER VIP</span>
              </span>
            )}
            {activeTier === 'vip_plus' && (
              <span className="pointer-events-none absolute top-4 start-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] px-3.5 py-1.5 text-xs font-extrabold text-white shadow-md">
                <Flame className="size-3.5" />
                <span>+VIP</span>
              </span>
            )}

            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-4 end-4 z-20 flex flex-col items-end gap-2"
            >
              <span
                dir="ltr"
                className="rounded-full bg-black/75 px-3 py-1 text-xs font-extrabold text-white backdrop-blur-xs"
              >
                {totalPhotos} / {activeIndex + 1}
              </span>

              {totalPhotos > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrev}
                    aria-label="Previous photo"
                    className="flex size-9 items-center justify-center rounded-full bg-white/95 text-[#0f1d40] shadow-md transition hover:scale-105 hover:bg-white"
                  >
                    {isRtl ? (
                      <ChevronRight className="size-4" />
                    ) : (
                      <ChevronLeft className="size-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    aria-label="Next photo"
                    className="flex size-9 items-center justify-center rounded-full bg-white/95 text-[#0f1d40] shadow-md transition hover:scale-105 hover:bg-white"
                  >
                    {isRtl ? (
                      <ChevronLeft className="size-4" />
                    ) : (
                      <ChevronRight className="size-4" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* شبكة الصور المصغرة الجانبية */}
          {sideThumbnails.length > 0 && (
            <div className="grid grid-cols-4 gap-2.5 lg:col-span-4 lg:grid-cols-2 lg:grid-rows-2 lg:h-[430px]">
              {sideThumbnails.map((item, idx) => {
                const realIdx = idx + 1
                const isLastThumb = idx === 3 && extraPhotosCount > 0
                return (
                  <div
                    key={`${item.url}-${realIdx}`}
                    onClick={() => {
                      setActiveIndex(realIdx)
                      setLightboxOpen(true)
                      setZoomed(false)
                    }}
                    className="group relative h-20 cursor-pointer overflow-hidden rounded-[18px] bg-slate-100 sm:h-28 lg:h-full"
                  >
                    <img
                      src={item.url}
                      alt={`${computedUnit.projectName} ${realIdx + 1}`}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {isLastThumb && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white backdrop-blur-[2px] transition group-hover:bg-black/70">
                        <Camera className="mb-1 size-5" />
                        <span className="text-xs font-extrabold sm:text-sm">
                          +{extraPhotosCount} {isAr ? 'صور' : 'photos'}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 2. شريط الكود والمشاهدات وتاريخ النشر */}
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3.5 text-xs font-semibold text-slate-500">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-3.5 text-slate-400" />
              <span>{publishedAgo}</span>
            </span>

            <span className="inline-flex items-center gap-1.5">
              <Eye className="size-3.5 text-slate-400" />
              <span>
                <strong className="font-extrabold text-[#0f1d40] tabular-nums">
                  {viewsTotal}
                </strong>{' '}
                {isAr ? 'مشاهدة' : 'views'} ·{' '}
                <strong className="font-extrabold text-[#007a5a] tabular-nums">
                  {viewsToday}
                </strong>{' '}
                {isAr ? 'اليوم' : 'today'}
              </span>
            </span>

            <button
              type="button"
              onClick={onCopyCode}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-200/70 px-2.5 py-1 font-mono text-[11px] font-bold text-[#0f1d40] transition hover:bg-slate-300/70"
              title={t.copyCodeBtn || t.copyCodeTitle}
            >
              <span>ID: {computedUnit.code}</span>
              {copied ? (
                <Check className="size-3 text-[#007a5a]" />
              ) : (
                <Copy className="size-3 text-slate-500" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShareUrl}
              className="inline-flex size-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-2xs transition hover:border-[#2563eb] hover:text-[#2563eb]"
              title={isAr ? 'مشاركة الرابط' : 'Share link'}
            >
              {sharedCopied ? (
                <Check className="size-3.5 text-[#007a5a]" />
              ) : (
                <Share2 className="size-3.5" />
              )}
            </button>

            <button
              type="button"
              onClick={onToggleFavorite}
              aria-label={t.favoriteAria || 'Favorite'}
              className={`inline-flex size-8 items-center justify-center rounded-full border shadow-2xs transition ${
                liked
                  ? 'border-rose-200 bg-rose-50 text-rose-500'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-rose-200 hover:text-rose-500'
              }`}
            >
              <Heart className={`size-4 ${liked ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* 3. عنوان المشروع والمنطقة وشارة التوثيق */}
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4 text-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-[#eaf8f2] px-3 py-1 text-[11px] font-extrabold text-[#007a5a]">
                <FileCheck2 className="size-3.5" />
                <span>
                  {t.verifiedBadge ||
                    (isAr ? 'عقد موثق بالمستندات' : 'Verified Contract')}
                </span>
              </span>
              {computedUnit.hasActiveOffer && (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-[11px] font-extrabold text-purple-900">
                  🔥 {t.activeOfferBadge}
                </span>
              )}
            </div>

            <h1 className="mt-2.5 text-2xl font-black tracking-tight text-[#0f1d40] sm:text-3xl">
              {computedUnit.projectName}
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500 sm:text-sm">
              <MapPin className="size-4 shrink-0 text-[#2563eb]" />
              <span>{computedUnit.subtitle}</span>
            </p>
          </div>
        </div>
      </section>

      {/* 4. عارض الصور المكبر (Full-Screen Lightbox) */}
      {lightboxOpen && (
        <div
          dir={dir}
          onClick={() => {
            setLightboxOpen(false)
            setZoomed(false)
          }}
          className="fixed inset-0 z-[9999] flex flex-col justify-between bg-[#070b14]/95 p-3 text-white backdrop-blur-md select-none sm:p-5"
        >
          {/* الشريط العلوي للـ Lightbox */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setLightboxOpen(false)
                  setZoomed(false)
                }}
                aria-label="Close gallery"
                className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-red-600"
              >
                <X className="size-5" />
              </button>

              <button
                type="button"
                onClick={() => setZoomed((z) => !z)}
                aria-label="Zoom photo"
                className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                {zoomed ? (
                  <ZoomOut className="size-4" />
                ) : (
                  <ZoomIn className="size-4" />
                )}
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs font-bold sm:text-sm">
              <span className="hidden truncate text-slate-200 sm:inline-block">
                {computedUnit.projectName} · {computedUnit.areaName} —{' '}
                {isAr ? `صورة ${activeIndex + 1}` : `Photo ${activeIndex + 1}`}
              </span>
              <span
                dir="ltr"
                className="rounded-full bg-white/15 px-3.5 py-1 text-xs font-extrabold text-white"
              >
                {totalPhotos} / {activeIndex + 1}
              </span>
            </div>
          </div>

          {/* الصورة المكبرة في المنتصف */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative my-2 flex flex-1 items-center justify-center overflow-hidden"
          >
            {totalPhotos > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous image"
                className="absolute start-2 z-20 flex size-11 items-center justify-center rounded-full bg-white/15 text-white shadow-lg backdrop-blur-xs transition hover:bg-white/30 sm:start-4"
              >
                {isRtl ? (
                  <ChevronRight className="size-6" />
                ) : (
                  <ChevronLeft className="size-6" />
                )}
              </button>
            )}

            <img
              src={gallery[activeIndex]?.url || gallery[0]?.url}
              alt={`${computedUnit.projectName} ${activeIndex + 1}`}
              onClick={() => setZoomed((z) => !z)}
              className={`max-h-[72vh] max-w-[90vw] rounded-xl object-contain transition-transform duration-300 ${
                zoomed ? 'scale-125 cursor-zoom-out' : 'cursor-zoom-in'
              }`}
            />

            {totalPhotos > 1 && (
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next image"
                className="absolute end-2 z-20 flex size-11 items-center justify-center rounded-full bg-white/15 text-white shadow-lg backdrop-blur-xs transition hover:bg-white/30 sm:end-4"
              >
                {isRtl ? (
                  <ChevronLeft className="size-6" />
                ) : (
                  <ChevronRight className="size-6" />
                )}
              </button>
            )}
          </div>

          {/* شريط الصور المصغرة بالأسفل */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="mx-auto flex max-w-4xl items-center gap-2 overflow-x-auto py-1 no-scrollbar"
          >
            {gallery.map((img, idx) => {
              const isCurrent = idx === activeIndex
              return (
                <button
                  key={`${img.url}-${idx}`}
                  type="button"
                  onClick={() => {
                    setActiveIndex(idx)
                    setZoomed(false)
                  }}
                  className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                    isCurrent
                      ? 'border-white opacity-100 scale-105'
                      : 'border-transparent opacity-50 hover:opacity-85'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={`Thumb ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}

export function UnitSpecsAndDescription({
  computedUnit,
  locale,
}: {
  computedUnit: any
  locale: LocaleCode
}) {
  const { t: dict } = useTranslation()
  // تعريف t كـ Record<string, any> يمنع أي خطأ TypeScript (ts2339) نهائياً
  const t = (dict?.unitDetailsPage as Record<string, any>) || {}
  const specsDict = (t.specs as Record<string, any>) || {}

  const specsSectionTitle =
    t.specsTitle ||
    specsDict.title ||
    (locale === 'ar'
      ? 'مواصفات الوحدة'
      : locale === 'ru'
        ? 'Характеристики объекта'
        : locale === 'ka'
          ? 'ობიექტის მახასიათებლები'
          : 'Unit Specifications')

  const featuresTitleLabel =
    t.featuresTitle ||
    specsDict.featuresTitle ||
    (locale === 'ar'
      ? 'مميزات إضافية'
      : locale === 'ru'
        ? 'Дополнительные удобства'
        : locale === 'ka'
          ? 'დამატებითი მახასიათებლები'
          : 'Features')

  const descriptionSectionTitle =
    t.descriptionTitle ||
    t.aboutUnitTitle ||
    (locale === 'ar'
      ? 'تفاصيل ووصف الوحدة'
      : locale === 'ru'
        ? 'Описание объекта'
        : locale === 'ka'
          ? 'ობიექტის აღწერა'
          : 'Unit Description')

  return (
    <>
      <section className="mt-5 rounded-[20px] border border-gray-200/85 bg-white p-5 text-start shadow-xs sm:p-6">
        <h2 className="mb-4 text-sm font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-base">
          {specsSectionTitle}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {computedUnit.specs.map((spec: { label: string; value: string }) => (
            <div
              key={spec.label}
              className="rounded-xl border border-gray-100 bg-[#f8faf9] p-3"
            >
              <span className="block text-[11px] font-semibold text-gray-400">
                {spec.label}
              </span>
              <strong className="mt-1 block text-xs font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-sm">
                {spec.value}
              </strong>
            </div>
          ))}
        </div>

        {computedUnit.tags && computedUnit.tags.length > 0 && (
          <div className="mt-5 border-t border-gray-100 pt-4">
            <h3 className="mb-2.5 text-xs font-extrabold text-gray-500">
              {featuresTitleLabel}
            </h3>
            <div className="flex flex-wrap gap-2">
              {computedUnit.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/70 bg-[#eaf8f2] px-3 py-1 text-xs font-bold text-[#007a5a]"
                >
                  <CheckCircle2 className="size-3.5" />
                  <span>{tag}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {computedUnit.descriptionText && (
        <section className="mt-4 rounded-[20px] border border-gray-200/85 bg-white p-5 text-start shadow-xs sm:p-6">
          <h2 className="mb-2.5 text-sm font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-base">
            {descriptionSectionTitle}
          </h2>
          <p className="whitespace-pre-line text-xs leading-7 font-medium text-slate-600 sm:text-sm">
            {computedUnit.descriptionText}
          </p>
        </section>
      )}
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
}: {
  computedUnit: any
  fin: Record<string, any>
  oT: Record<string, any>
  t: Record<string, any>
  monthsWord: string
  onMakeOffer: () => void
}) {
  const cur = '$'

  return (
    <section className="mt-4 overflow-hidden rounded-[22px] border-2 border-[var(--brand-primary,#007a5a)] bg-white p-5 text-start shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-[#eaf8f2] text-[#007a5a]">
            <Wallet className="size-5" />
          </span>
          <div>
            <h2 className="text-base font-black text-[#0a1122] sm:text-lg">
              {fin.title}
            </h2>
            <p className="text-[11px] font-semibold text-gray-500">
              {fin.subtitle}
            </p>
          </div>
        </div>

        {computedUnit.willingToDiscount && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-800">
            ↓ {fin.negotiableBadge}
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-200 bg-[#eaf8f2] p-4">
          <span className="block text-xs font-bold text-[#007a5a]">
            {fin.requiredCashNow}
          </span>
          <strong
            dir="ltr"
            className="mt-1 block text-2xl font-black text-[#0a1122] tabular-nums sm:text-3xl"
          >
            {cur}
            {Number(computedUnit.requiredCash || 0).toLocaleString('en-US')}
          </strong>
          <span className="mt-1 block text-[11px] font-semibold text-[#2b8a6e]">
            {fin.paidToDeveloperSub}
          </span>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-[#f8faf9] p-4">
          <span className="block text-xs font-bold text-gray-500">
            {fin.remainingToDeveloper}
          </span>
          <strong
            dir="ltr"
            className="mt-1 block text-2xl font-black text-[#0a1122] tabular-nums sm:text-3xl"
          >
            {cur}
            {Number(computedUnit.remainingToDeveloper || 0).toLocaleString(
              'en-US'
            )}
          </strong>
          <span className="mt-1 block text-[11px] font-semibold text-gray-500">
            {computedUnit.installmentAmount > 0
              ? `${fin.installmentLabel}: ${cur}${Number(computedUnit.installmentAmount).toLocaleString('en-US')} (${computedUnit.installmentFreq})`
              : fin.noRemainingInstallments}
          </span>
        </div>
      </div>

      {computedUnit.marketGain > 0 && (
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-emerald-200 bg-gradient-to-r from-[#eaf8f2] to-[#f4fbf7] p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-[#007a5a]" />
            <div>
              <span className="block text-xs font-extrabold text-[#007a5a]">
                {fin.instantGainLabel}
              </span>
              <span className="text-[11px] text-[#2b8a6e]">
                {fin.marketPriceTodayLabel}: {cur}
                {Number(computedUnit.marketPrice).toLocaleString('en-US')}
              </span>
            </div>
          </div>
          <strong
            dir="ltr"
            className="text-xl font-black text-[#007a5a] tabular-nums sm:text-2xl"
          >
            + {cur}
            {Number(computedUnit.marketGain).toLocaleString('en-US')}
          </strong>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4 text-xs sm:grid-cols-3">
        <div>
          <span className="block text-[11px] text-gray-400">
            {fin.remainingDuration}
          </span>
          <strong className="mt-0.5 block font-extrabold text-[#0a1122]">
            {computedUnit.remainingInstallmentMonths > 0
              ? `${computedUnit.remainingInstallmentMonths} ${monthsWord}`
              : '—'}
          </strong>
        </div>
        <div>
          <span className="block text-[11px] text-gray-400">
            {fin.deliveryDate}
          </span>
          <strong className="mt-0.5 block font-extrabold text-[#0a1122]">
            {computedUnit.deliveryYear}
          </strong>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <span className="block text-[11px] text-gray-400">
            {fin.platformFeeLabel} (1.25%)
          </span>
          <strong
            dir="ltr"
            className="mt-0.5 block font-extrabold text-[#0a1122]"
          >
            {cur}
            {Number(computedUnit.commission || 0).toLocaleString('en-US')}
          </strong>
        </div>
      </div>

      {!computedUnit.isOwner && (
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={onMakeOffer}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-6 text-xs font-extrabold text-white shadow-md transition hover:opacity-95 sm:text-sm"
          >
            <Wallet className="size-4" />
            <span>{oT.makeOfferBtn || t.makeOfferCta || 'قدّم عرض شراء'}</span>
          </button>

          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#007a5a]">
            <ShieldCheck className="size-4 shrink-0" />
            <span>{fin.escrowGuaranteeNote}</span>
          </div>
        </div>
      )}
    </section>
  )
}

export function SimilarUnitsSection({
  similarDbUnits,
  t,
}: {
  similarDbUnits: any[]
  t: Record<string, any>
  c: Record<string, any>
}) {
  if (!similarDbUnits || similarDbUnits.length === 0) return null

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between text-start">
        <h2 className="text-base font-black text-[#0a1122] sm:text-lg">
          {t.similarSection?.title}
        </h2>
        <Link
          href="/opportunities"
          className="text-xs font-bold text-[#007a5a] hover:underline"
        >
          {t.similarSection?.viewAllBtn}
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {similarDbUnits.slice(0, 3).map((item) => (
          <Link
            key={item.id}
            href={`/opportunities/${item.id}`}
            className="group flex flex-col justify-between overflow-hidden rounded-[18px] border border-gray-200/90 bg-white shadow-2xs transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div>
              <div className="relative h-40 w-full overflow-hidden bg-gray-100">
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {item.featured && (
                  <span className="absolute top-2.5 start-2.5 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-2.5 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                    <Crown className="size-3" />
                    <span>SUPER VIP</span>
                  </span>
                )}
              </div>
              <div className="p-4 text-start">
                <h3 className="line-clamp-1 text-sm font-extrabold text-[#0a1122] group-hover:text-[#2563eb]">
                  {item.name}
                </h3>
                <p className="mt-0.5 text-xs text-gray-500">{item.area}</p>
                <p className="mt-2 line-clamp-1 text-[11px] font-semibold text-gray-600">
                  {item.specs}
                </p>
              </div>
            </div>
            <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-2.5 text-start">
              <strong
                dir="ltr"
                className="text-sm font-black text-[#007a5a] tabular-nums"
              >
                ${item.cash}
              </strong>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}