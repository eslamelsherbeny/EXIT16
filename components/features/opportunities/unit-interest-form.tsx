'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  AlertTriangle,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Crown,
  Eye,
  Flame,
  Loader2,
  MessageCircle,
  Wallet,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { submitBuyerOfferAction } from '@/actions/offer-actions'
import { formatRelativePublishTime } from '@/components/features/home/home-property-card'
import { TurnstileBox } from '@/components/layouts/auth-layout'
import { CountrySelector } from '@/components/shared/country-selector'
import { toEnglishDigits } from '@/components/features/seller/seller-shared'
import { useTranslation } from '@/lib/i18n'

export function UnitGalleryWithLightbox({
  gallery,
  unitCode,
  viewsCount = 1,
  createdAt,
  featured = false,
  boostTier = null,
  copied = false,
  onCopyCode,
}: {
  gallery: Array<{ url: string; caption: string }>
  unitCode?: string
  viewsCount?: number
  createdAt?: string
  featured?: boolean
  boostTier?: 'super_vip' | 'vip_plus' | null
  copied?: boolean
  onCopyCode?: () => void
}) {
  const { t: dict, locale, dir, isRtl } = useTranslation()
  const t = (dict.unitDetailsPage as Record<string, any>) || {}
  const isAr = locale === 'ar'

  const safeGallery =
    Array.isArray(gallery) && gallery.length > 0
      ? gallery
      : [
          {
            url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85',
            caption: '',
          },
        ]

  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [zoomed, setZoomed] = useState(false)

  const totalPhotos = safeGallery.length
  const sideThumbnails = safeGallery.slice(1, 5)
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

  const viewsTotal = Math.max(1, Number(viewsCount) || 1)
  const publishedAgo = formatRelativePublishTime(createdAt, isAr)
  const resolvedTier = boostTier || (featured ? 'super_vip' : null)

  return (
    <>
      <section className="mt-4">
        <div
          className={`grid grid-cols-1 gap-2.5 ${
            sideThumbnails.length > 0 ? 'sm:grid-cols-12' : ''
          }`}
        >
          <div
            onClick={() => {
              setLightboxOpen(true)
              setZoomed(false)
            }}
            className={`group relative h-[250px] cursor-pointer overflow-hidden rounded-[20px] bg-slate-200 sm:h-[360px] ${
              sideThumbnails.length > 0 ? 'sm:col-span-8' : 'sm:col-span-12'
            }`}
          >
            <img
              src={safeGallery[activeIndex]?.url || safeGallery[0]?.url}
              alt={safeGallery[activeIndex]?.caption || ''}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

            {resolvedTier === 'super_vip' && (
              <span className="pointer-events-none absolute top-3.5 start-3.5 z-10 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-3 py-1 text-[11px] font-extrabold text-white shadow-md">
                <Crown className="size-3.5" />
                <span>SUPER VIP</span>
              </span>
            )}
            {resolvedTier === 'vip_plus' && (
              <span className="pointer-events-none absolute top-3.5 start-3.5 z-10 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] px-3 py-1 text-[11px] font-extrabold text-white shadow-md">
                <Flame className="size-3.5" />
                <span>+VIP</span>
              </span>
            )}

            <span className="pointer-events-none absolute bottom-3.5 start-3.5 z-10 inline-flex items-center gap-1.5 rounded-full bg-black/65 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-xs">
              <ZoomIn className="size-3.5" />
              <span>
                {t.zoomHint || (isAr ? 'اضغط لتكبير الصور' : 'Click to zoom')}
              </span>
            </span>

            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-3.5 end-3.5 z-20 flex flex-col items-end gap-1.5"
            >
              <span
                dir="ltr"
                className="rounded-full bg-black/75 px-3 py-0.5 text-[11px] font-extrabold text-white backdrop-blur-xs"
              >
                {totalPhotos} / {activeIndex + 1}
              </span>

              {totalPhotos > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handlePrev}
                    aria-label={t.prevImageAria || 'Previous'}
                    className="flex size-8 items-center justify-center rounded-full bg-white/95 text-[#0a1122] shadow-md transition hover:scale-105 hover:bg-white sm:size-9"
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
                    aria-label={t.nextImageAria || 'Next'}
                    className="flex size-8 items-center justify-center rounded-full bg-white/95 text-[#0a1122] shadow-md transition hover:scale-105 hover:bg-white sm:size-9"
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

          {sideThumbnails.length > 0 && (
            <div className="grid grid-cols-4 gap-2 sm:col-span-4 sm:h-[360px] sm:grid-cols-2 sm:grid-rows-2">
              {sideThumbnails.map((item, idx) => {
                const realIdx = idx + 1
                const isLastThumb = idx === 3 && extraPhotosCount > 0
                const isCurrent = activeIndex === realIdx

                return (
                  <div
                    key={`${item.url}-${realIdx}`}
                    onClick={() => {
                      setActiveIndex(realIdx)
                      setLightboxOpen(true)
                      setZoomed(false)
                    }}
                    className={`group relative h-16 cursor-pointer overflow-hidden rounded-[14px] bg-slate-100 sm:h-full ${
                      isCurrent ? 'ring-2 ring-[#007a5a]' : ''
                    }`}
                  >
                    <img
                      src={item.url}
                      alt={item.caption}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {isLastThumb && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white backdrop-blur-[1px] transition group-hover:bg-black/70">
                        <Camera className="mb-0.5 size-4 sm:size-5" />
                        <span className="text-[11px] font-extrabold sm:text-xs">
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

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-gray-200/80 bg-white px-4 py-2.5 text-xs font-semibold text-gray-500 shadow-2xs">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-3.5 text-[#007a5a]" />
              <span>{publishedAgo}</span>
            </span>

            <span className="text-gray-300">|</span>

            <span className="inline-flex items-center gap-1.5">
              <Eye className="size-3.5 text-[#2563eb]" />
              <span>
                <strong className="font-extrabold text-[#0a1122] tabular-nums">
                  {viewsTotal.toLocaleString('en-US')}
                </strong>{' '}
                {isAr ? 'مشاهدة' : 'views'}
              </span>
            </span>
          </div>

          {unitCode && (
            <button
              type="button"
              onClick={onCopyCode}
              title={t.copyCodeTitle || 'نسخ كود الوحدة'}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 font-mono text-[11px] font-extrabold text-[#0a1122] transition hover:border-[#007a5a] hover:bg-[#eaf8f2]"
            >
              <span>ID: {unitCode}</span>
              {copied ? (
                <Check className="size-3.5 text-[#007a5a]" />
              ) : (
                <Copy className="size-3 text-gray-400" />
              )}
              {copied && (
                <span className="font-sans text-[10px] font-bold text-[#007a5a]">
                  {t.copiedText || (isAr ? 'تم النسخ' : 'Copied')}
                </span>
              )}
            </button>
          )}
        </div>
      </section>

      {lightboxOpen && (
        <div
          dir={dir}
          onClick={() => {
            setLightboxOpen(false)
            setZoomed(false)
          }}
          className="fixed inset-0 z-[9999] flex flex-col justify-between bg-[#070b14]/95 p-3 text-white backdrop-blur-md select-none sm:p-5"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setLightboxOpen(false)
                  setZoomed(false)
                }}
                aria-label={t.closeAria || 'Close'}
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white/15 px-3.5 text-xs font-extrabold text-white transition hover:bg-red-600"
              >
                <X className="size-4" />
                <span>{isAr ? 'إغلاق' : 'Close'}</span>
              </button>

              <button
                type="button"
                onClick={() => setZoomed((z) => !z)}
                aria-label="Zoom"
                className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                {zoomed ? (
                  <ZoomOut className="size-4" />
                ) : (
                  <ZoomIn className="size-4" />
                )}
              </button>
            </div>

            <div className="flex items-center gap-2.5 text-xs font-bold sm:text-sm">
              <span className="hidden truncate text-slate-200 sm:inline-block">
                {safeGallery[activeIndex]?.caption}
              </span>
              <span
                dir="ltr"
                className="rounded-full bg-white/15 px-3.5 py-1 text-xs font-extrabold text-white"
              >
                {totalPhotos} / {activeIndex + 1}
              </span>
            </div>
          </div>

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative my-2 flex flex-1 items-center justify-center overflow-hidden"
          >
            {totalPhotos > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                aria-label={t.prevImageAria || 'Previous'}
                className="absolute start-2 z-20 flex size-10 items-center justify-center rounded-full bg-white/15 text-white shadow-lg backdrop-blur-xs transition hover:bg-white/30 sm:start-4 sm:size-12"
              >
                {isRtl ? (
                  <ChevronRight className="size-6" />
                ) : (
                  <ChevronLeft className="size-6" />
                )}
              </button>
            )}

            <img
              src={safeGallery[activeIndex]?.url}
              alt={safeGallery[activeIndex]?.caption || ''}
              onClick={() => setZoomed((z) => !z)}
              className={`max-h-[72vh] max-w-[92vw] rounded-xl object-contain shadow-2xl transition-transform duration-300 ${
                zoomed ? 'scale-125 cursor-zoom-out' : 'cursor-zoom-in'
              }`}
            />

            {totalPhotos > 1 && (
              <button
                type="button"
                onClick={handleNext}
                aria-label={t.nextImageAria || 'Next'}
                className="absolute end-2 z-20 flex size-10 items-center justify-center rounded-full bg-white/15 text-white shadow-lg backdrop-blur-xs transition hover:bg-white/30 sm:end-4 sm:size-12"
              >
                {isRtl ? (
                  <ChevronLeft className="size-6" />
                ) : (
                  <ChevronRight className="size-6" />
                )}
              </button>
            )}
          </div>

          {totalPhotos > 1 && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="mx-auto flex max-w-full items-center gap-2 overflow-x-auto pb-1 no-scrollbar"
            >
              {safeGallery.map((img, idx) => (
                <button
                  key={`${img.url}-${idx}`}
                  type="button"
                  onClick={() => {
                    setActiveIndex(idx)
                    setZoomed(false)
                  }}
                  className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                    activeIndex === idx
                      ? 'scale-105 border-[#2ee59d] opacity-100'
                      : 'border-transparent opacity-50 hover:opacity-85'
                  }`}
                >
                  <img
                    src={img.url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}

export function UnitInterestForm({
  unitCode,
  projectName,
  areaName: _areaName,
  unitType: _unitType,
  deliveryYear: _deliveryYear,
  requiredCash,
  totalRequiredNow: _totalRequiredNow,
  installmentAmount: _installmentAmount,
  currentUserId,
  willingToDiscount = false,
  discountAmount = 0,
}: {
  unitCode: string
  projectName: string
  areaName: string
  unitType: string
  deliveryYear: string
  requiredCash: number
  totalRequiredNow: number
  installmentAmount: number
  currentUserId: string | null
  willingToDiscount?: boolean
  discountAmount?: number
}) {
  const params = useParams()
  const rawPropertyId = Array.isArray(params?.id)
    ? params.id[0]
    : (params?.id as string) || ''

  const { t: dict, locale, siteSettings } = useTranslation()
  const f = dict.unitDetailsPage.interestForm
  const oT = (dict.accountPages?.offers as Record<string, any>) || {}
  const isAr = locale === 'ar'
  const cur = '$'
  const supportWhatsApp = String(
    siteSettings?.whatsappNumber || dict.footer?.phone || '+201018595959'
  ).replace(/\D/g, '')

  const allowNegotiation = Boolean(willingToDiscount || discountAmount > 0)
  const maxDiscount =
    discountAmount > 0
      ? Math.min(requiredCash - 1, discountAmount)
      : Math.round(requiredCash * 0.2)
  const minAllowedCash = allowNegotiation
    ? Math.max(1, requiredCash - maxDiscount)
    : requiredCash

  const [offerMode, setOfferMode] = useState<'full' | 'negotiate'>('full')
  const [offeredCashStr, setOfferedCashStr] = useState(
    requiredCash > 0 ? requiredCash.toLocaleString('en-US') : ''
  )
  const [buyerName, setBuyerName] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [countryCode, setCountryCode] = useState('995')
  const [buyerNotes, setBuyerNotes] = useState('')
  const [readiness, setReadiness] = useState<'48h' | '1_week' | '2_weeks'>(
    '48h'
  )
  const [paymentMethod, setPaymentMethod] = useState<
    'bank_check' | 'bank_transfer'
  >('bank_check')
  const [agreedToCommission, setAgreedToCommission] = useState(false)
  const [submittingOffer, setSubmittingOffer] = useState(false)
  const [submittedOfferData, setSubmittedOfferData] = useState<{
    offerId: string
    offerRef: string
    amount: number
  } | null>(null)
  const [offerError, setOfferError] = useState('')

  const numericCash =
    Number(toEnglishDigits(offeredCashStr).replace(/,/g, '')) || requiredCash
  const isFullPrice = numericCash >= requiredCash
  const isBelowMinFloor =
    allowNegotiation && numericCash > 0 && numericCash < minAllowedCash

  const handleInterestSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setOfferError('')

    const cleanDigits = toEnglishDigits(buyerPhone)
      .replace(/^0+/, '')
      .replace(/\D/g, '')
      .trim()

    if (!currentUserId && (!buyerName.trim() || cleanDigits.length < 7)) {
      setOfferError(f.errorSubmit)
      return
    }

    if (isBelowMinFloor) {
      setOfferError(
        `${oT.errBelowMinFloor || 'أقل مبلغ مسموح للتفاوض هو'}: ${minAllowedCash.toLocaleString('en-US')} ${cur}`
      )
      return
    }

    setSubmittingOffer(true)

    try {
      const cleanPhone = cleanDigits
        ? `+${countryCode.replace('+', '')}${cleanDigits}`
        : ''

      const res = await submitBuyerOfferAction({
        propertyId: rawPropertyId,
        offeredCash: numericCash,
        paymentReadiness: readiness,
        paymentMethod,
        guestName: buyerName.trim(),
        guestPhone: cleanPhone,
        buyerNotes: buyerNotes.trim(),
      })

      if (!res.success) {
        setOfferError(res.error || f.errorSubmit)
      } else {
        setSubmittedOfferData({
          offerId: res.offerId || '',
          offerRef: res.offerRef || `OF-${unitCode}`,
          amount: numericCash,
        })
      }
    } catch {
      setOfferError(f.errorUnexpected)
    } finally {
      setSubmittingOffer(false)
    }
  }

  const siteOrigin =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://exit-16.vercel.app'

  const whatsappConfirmMsg = submittedOfferData
    ? isAr
      ? `أهلاً إدارة Aqar Exit، أؤكد جديتي في عرض الشراء رقم (${submittedOfferData.offerRef}) على وحدة (${projectName} - ${unitCode}) بمبلغ ($${submittedOfferData.amount.toLocaleString('en-US')}).\nرابط مراجعة وتفعيل العرض:\n${siteOrigin}/api/verify-contact?offerId=${encodeURIComponent(submittedOfferData.offerId)}`
      : `Hello Aqar Exit, I confirm my purchase offer (${submittedOfferData.offerRef}) for unit (${projectName} - ${unitCode}) with amount ($${submittedOfferData.amount.toLocaleString('en-US')}).\nVerification Link:\n${siteOrigin}/api/verify-contact?offerId=${encodeURIComponent(submittedOfferData.offerId)}`
    : ''

  return (
    <section
      id="make-offer-section"
      className="mt-8 rounded-[20px] border border-gray-200/90 bg-white p-5 text-start shadow-sm sm:p-8"
    >
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-xl bg-[#eaf8f2] text-[#007a5a]">
          <Wallet className="size-4" />
        </span>
        <h2 className="text-lg font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-xl">
          {oT.makeOfferBtn || f.title}
        </h2>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
        {f.subtitlePrefix} ({unitCode}) {f.subtitleSuffix}
      </p>

      {submittedOfferData ? (
        <div className="mt-6 rounded-2xl border-2 border-[#007a5a] bg-[#eaf8f2]/70 p-6 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-[#007a5a] text-white shadow-sm">
            <CheckCircle2 className="size-6" />
          </div>
          <p className="text-base font-black text-[#0a1122] sm:text-lg">
            {f.successTitlePrefix} ({projectName}) {f.successTitleSuffix}
          </p>
          <p className="mt-1 font-mono text-xs font-extrabold text-[#007a5a]">
            Ref: #{submittedOfferData.offerRef} · $
            {submittedOfferData.amount.toLocaleString('en-US')}
          </p>
          <p className="mx-auto mt-2.5 max-w-md text-xs leading-relaxed font-semibold text-slate-700">
            {isAr
              ? 'لتسريع إرسال عرضك للمالك مباشرة، اضغط الزر بالأسفل لتأكيد العرض عبر واتساب المنصة:'
              : 'To fast-track your offer to the owner, click below to confirm via WhatsApp:'}
          </p>

          <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={`https://wa.me/${supportWhatsApp}?text=${encodeURIComponent(whatsappConfirmMsg)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 text-xs font-extrabold text-white shadow-md transition hover:opacity-95 sm:w-auto sm:text-sm"
            >
              <MessageCircle className="size-4 shrink-0" />
              <span>
                {isAr
                  ? 'تأكيد العرض فوراً عبر واتساب'
                  : 'Confirm Offer via WhatsApp'}
              </span>
            </a>

            <Link
              href="/account/offers?role=buyer"
              className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-5 text-xs font-extrabold text-[#0a1122] hover:bg-gray-50 sm:w-auto"
            >
              {isAr ? 'متابعة عروضي في حسابي' : 'View My Offers'}
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleInterestSubmit} className="mt-6 space-y-5">
          {offerError && (
            <div className="rounded-xl bg-red-50 p-3 text-center text-xs font-bold text-red-600">
              {offerError}
            </div>
          )}

          <div className="rounded-2xl border border-gray-200/90 bg-[#f8faf9] p-4">
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-extrabold text-[#0a1122]">
                1.{' '}
                {oT.selectOfferTypeLabel ||
                  (isAr
                    ? 'تحديد قيمة الكاش المعروض للمالك'
                    : 'Select Cash Offer Amount')}
                :
              </label>
              <span className="rounded-lg bg-emerald-100/80 px-2.5 py-0.5 text-[11px] font-extrabold text-[#007a5a]">
                {isAr
                  ? `الكاش المطلوب للتنازل: ${requiredCash.toLocaleString('en-US')} $`
                  : `Required Exit Cash: $${requiredCash.toLocaleString('en-US')}`}
              </span>
            </div>

            {allowNegotiation ? (
              <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setOfferMode('full')
                    setOfferedCashStr(requiredCash.toLocaleString('en-US'))
                  }}
                  className={`flex flex-col justify-between rounded-xl border p-3 text-start transition ${
                    offerMode === 'full'
                      ? 'border-2 border-[#007a5a] bg-[#eaf8f2] text-[#007a5a]'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="block text-[11px] font-extrabold">
                    ✓{' '}
                    {oT.fullPriceOptionTitle ||
                      (isAr
                        ? 'حجز فوري بالسعر الموثق الكامل'
                        : 'Instant Booking at Full Price')}
                  </span>
                  <strong
                    dir="ltr"
                    className="mt-1 block text-sm font-black tabular-nums"
                  >
                    {requiredCash.toLocaleString('en-US')} {cur}{' '}
                    <span className="font-sans text-[10px] font-bold opacity-80">
                      ({isAr ? 'المدفوع الفعلي للمالك' : 'Paid Cash'})
                    </span>
                  </strong>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOfferMode('negotiate')
                    setOfferedCashStr(minAllowedCash.toLocaleString('en-US'))
                  }}
                  className={`flex flex-col justify-between rounded-xl border p-3 text-start transition ${
                    offerMode === 'negotiate'
                      ? 'border-2 border-amber-500 bg-amber-50 text-amber-950'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="block text-[11px] font-extrabold">
                    💬{' '}
                    {oT.negotiateOptionTitle ||
                      (isAr
                        ? 'تقديم عرض كاش عاجل (تفاوض محكوم)'
                        : 'Submit Negotiated Cash Offer')}
                  </span>
                  <span className="mt-1 block text-[10.5px] text-gray-500">
                    {oT.minAllowedFloorLabel ||
                      (isAr ? 'الحد الأدنى المسموح للعرض' : 'Minimum allowed')}
                    :{' '}
                    <strong dir="ltr" className="font-extrabold text-[#0a1122]">
                      {minAllowedCash.toLocaleString('en-US')} {cur}
                    </strong>
                  </span>
                </button>
              </div>
            ) : (
              <div className="mb-3 rounded-xl border border-emerald-200 bg-[#eaf8f2] p-3 text-[11px] font-bold text-[#007a5a]">
                {oT.nonNegotiableUnitNote ||
                  (isAr
                    ? `هذه الوحدة معروضة بسعر تنازل نهائي (${requiredCash.toLocaleString('en-US')} $) غير قابل للتفاوض`
                    : `Fixed exit price ($${requiredCash.toLocaleString('en-US')}) — non-negotiable`)}
              </div>
            )}

            <label className="mb-1.5 block text-[11px] font-bold text-gray-500">
              {isAr
                ? 'المبلغ الكاش الذي تعرض دفعه للمالك الآن ($):'
                : 'Your cash offer amount to the seller ($):'}
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                dir="ltr"
                required
                readOnly={!allowNegotiation}
                value={offeredCashStr}
                onChange={(e) => {
                  if (!allowNegotiation) return
                  const digits = toEnglishDigits(e.target.value).replace(
                    /\D/g,
                    ''
                  )
                  const num = Number(digits) || 0
                  setOfferMode(num >= requiredCash ? 'full' : 'negotiate')
                  setOfferedCashStr(
                    digits ? num.toLocaleString('en-US') : ''
                  )
                }}
                className={`h-12 w-full rounded-xl border pr-4 pl-12 text-left text-base font-black text-[#0a1122] tabular-nums focus:outline-none ${
                  !allowNegotiation
                    ? 'cursor-not-allowed border-gray-200 bg-gray-100'
                    : 'border-gray-300 bg-white focus:border-[#007a5a]'
                }`}
              />
              <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-xs font-extrabold text-gray-400">
                {cur}
              </span>
            </div>

            {isFullPrice ? (
              <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-[#eaf8f2] p-2.5 text-[11px] font-bold text-[#007a5a]">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>
                  {oT.fullPricePriorityHint ||
                    (isAr
                      ? 'أولوية أولى للقبول الفوري وقفل الوحدة'
                      : 'Top priority for instant acceptance')}
                </span>
              </div>
            ) : isBelowMinFloor ? (
              <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-2.5 text-[11px] font-bold text-red-700">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <span>
                  {oT.errBelowMinFloor ||
                    (isAr ? 'أقل مبلغ مسموح للعرض هو' : 'Minimum allowed offer')}
                  :{' '}
                  <strong dir="ltr">
                    {minAllowedCash.toLocaleString('en-US')} {cur}
                  </strong>
                </span>
              </div>
            ) : (
              <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-[11px] leading-relaxed font-bold text-amber-900">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                <span>
                  {oT.fomoNegotiationWarning ||
                    (isAr
                      ? 'العروض بالسعر الكامل لها أولوية القبول الفوري لدى المالك.'
                      : 'Full-price offers receive priority acceptance.')}
                </span>
              </div>
            )}
          </div>

          {!currentUserId && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                  {f.nameLabel}
                </label>
                <input
                  type="text"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder={f.namePlaceholder}
                  required
                  maxLength={120}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-xs text-[var(--brand-navy,#0a1122)] focus:border-[var(--brand-primary,#007a5a)] focus:outline-none sm:text-sm"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                  {f.whatsappLabel}
                </label>
                <div dir="ltr" className="flex items-center gap-2">
                  <CountrySelector
                    value={countryCode}
                    onChange={(code) => setCountryCode(code)}
                    heightClass="h-11"
                  />
                  <input
                    type="tel"
                    inputMode="tel"
                    dir="ltr"
                    value={buyerPhone}
                    onChange={(e) =>
                      setBuyerPhone(toEnglishDigits(e.target.value))
                    }
                    placeholder="5xx xx xx xx"
                    required
                    maxLength={20}
                    className="h-11 flex-1 rounded-xl border border-gray-200 bg-white px-4 text-left text-xs font-medium text-[var(--brand-navy,#0a1122)] focus:border-[var(--brand-primary,#007a5a)] focus:outline-none sm:text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                2. {oT.buyerReadinessLabel || f.readinessLegend}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ['48h', oT.readiness48h || f.readinessWeek],
                    ['1_week', oT.readiness1Week || f.readinessMonth],
                    ['2_weeks', oT.readiness2Weeks || f.readinessInfo],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setReadiness(key)}
                    className={`flex min-h-[42px] items-center justify-center rounded-xl border px-2 py-1.5 text-center text-[11px] font-extrabold transition ${
                      readiness === key
                        ? 'border-[#007a5a] bg-[#007a5a] text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                3. {oT.paymentMethodLabel || 'طريقة السداد في مقر المطور'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    [
                      'bank_check',
                      oT.methodBankCheck || 'شيك مصرفي مقبول الدفع',
                    ],
                    ['bank_transfer', oT.methodBankTransfer || 'تحويل بنكي فوري'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPaymentMethod(key)}
                    className={`flex min-h-[42px] items-center justify-center rounded-xl border px-2.5 py-1.5 text-center text-[11px] font-extrabold transition ${
                      paymentMethod === key
                        ? 'border-[#0a1122] bg-[#0a1122] text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold text-[var(--brand-navy,#0a1122)]">
              {f.notesLabel}
            </label>
            <textarea
              rows={2}
              value={buyerNotes}
              onChange={(e) => setBuyerNotes(e.target.value)}
              placeholder={f.notesPlaceholder}
              maxLength={350}
              className="w-full rounded-xl border border-gray-200 bg-white p-3.5 text-xs text-[var(--brand-navy,#0a1122)] placeholder:text-gray-400 focus:border-[var(--brand-primary,#007a5a)] focus:outline-none sm:text-sm"
            />
          </div>

          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-gray-200 bg-gray-50/70 p-3.5 text-xs leading-relaxed text-gray-700">
            <input
              type="checkbox"
              checked={agreedToCommission}
              onChange={(e) => setAgreedToCommission(e.target.checked)}
              required
              className="mt-0.5 size-4 rounded accent-[var(--brand-primary,#007a5a)]"
            />
            <span>{f.commissionAgree}</span>
          </label>

          <TurnstileBox />

          <button
            type="submit"
            disabled={submittingOffer || isBelowMinFloor}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary,#007a5a)] text-sm font-bold text-white shadow-sm transition active:scale-[0.98] hover:bg-[var(--brand-primary-hover,#006248)] disabled:opacity-50"
          >
            {submittingOffer ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>{f.submittingBtn}</span>
              </>
            ) : (
              <span>{oT.confirmSendOfferBtn || f.submitBtn}</span>
            )}
          </button>

          <p className="text-center text-[10px] text-gray-400">
            {f.privacyNote}
          </p>
        </form>
      )}
    </section>
  )
}
