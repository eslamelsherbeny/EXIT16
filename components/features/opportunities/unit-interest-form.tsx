'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  AlertCircle,
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
  Mail,
  MessageCircle,
  ShieldCheck,
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
import {
  getPhoneInputMaxLength,
  getPhonePlaceholder,
  sanitizePhoneInputForCountry,
  validatePhoneForCountry,
} from '@/lib/phone-validation'
import { useTranslation } from '@/lib/i18n'

const FALLBACK_GALLERY_IMAGE =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85'

function getSafeGalleryImageUrl(rawUrl?: string | null): string {
  const clean = String(rawUrl || '').trim()
  if (!clean) return FALLBACK_GALLERY_IMAGE
  if (clean.startsWith('/') && !clean.startsWith('//')) return clean
  try {
    const parsed = new URL(clean)
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString()
    }
  } catch {}
  return FALLBACK_GALLERY_IMAGE
}

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
  const t = dict.unitDetailsPage
  const uT = dict.unitDetailsPage.interestForm

  const safeGallery =
    Array.isArray(gallery) && gallery.length > 0
      ? gallery.map((item) => ({
          url: getSafeGalleryImageUrl(item?.url),
          caption: String(item?.caption || ''),
        }))
      : [
          {
            url: FALLBACK_GALLERY_IMAGE,
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
  const publishedAgo = formatRelativePublishTime(createdAt, locale)
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
              <span>{t.zoomHint}</span>
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
                    aria-label={t.prevImageAria}
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
                    aria-label={t.nextImageAria}
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
                          +{extraPhotosCount} {t.photoWord || uT.photosWord}
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
                {t.viewsWord || uT.viewsWord}
              </span>
            </span>
          </div>

          {unitCode && (
            <button
              type="button"
              onClick={onCopyCode}
              title={t.copyCodeTitle}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 font-mono text-[11px] font-extrabold text-[#0a1122] transition hover:border-[#007a5a] hover:bg-[#eaf8f2]"
            >
              <span dir="ltr">ID: {unitCode}</span>
              {copied ? (
                <Check className="size-3.5 text-[#007a5a]" />
              ) : (
                <Copy className="size-3 text-gray-400" />
              )}
              {copied && (
                <span className="font-sans text-[10px] font-bold text-[#007a5a]">
                  {t.copiedText}
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
                aria-label={t.closeAria}
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white/15 px-3.5 text-xs font-extrabold text-white transition hover:bg-red-600"
              >
                <X className="size-4" />
                <span>{t.closeAria || uT.closeBtn}</span>
              </button>

              <button
                type="button"
                onClick={() => setZoomed((z) => !z)}
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
                aria-label={t.prevImageAria}
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
                aria-label={t.nextImageAria}
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

type OfferFieldErrorKey =
  | 'offeredCash'
  | 'buyerName'
  | 'buyerPhone'
  | 'buyerEmail'
  | 'agreedToCommission'
  | 'agreedToTerms'

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
  isUnderContractDeal = false,
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
  isUnderContractDeal?: boolean
}) {
  const params = useParams()
  const rawPropertyId = Array.isArray(params?.id)
    ? params.id[0]
    : (params?.id as string) || ''

  const { t: dict, locale, siteSettings } = useTranslation()
  const f = dict.unitDetailsPage.interestForm as Record<string, string>
  const oT = dict.accountPages.offers as Record<string, any>
  const authCommon = (dict.authPages?.common as Record<string, any>) || {}
  const phoneMessages = (dict.common as Record<string, any>)?.phoneValidation
  const cur = '$'
  const commPct = String(siteSettings?.buyerCommission || '1.25')
  const supportWhatsApp = String(
    siteSettings?.whatsappNumber || dict.footer?.phone || '+201018595959'
  ).replace(/\D/g, '')

  const allowNegotiation = Boolean(willingToDiscount)
  const sanityMinFloor = Math.round(Math.max(1, requiredCash) * 0.5)

  const [offerMode, setOfferMode] = useState<'full' | 'negotiate'>('full')
  const [offeredCashStr, setOfferedCashStr] = useState('')
  const [buyerName, setBuyerName] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [countryCode, setCountryCode] = useState('995')
  const [countryIso, setCountryIso] = useState('GE')
  const [buyerNotes, setBuyerNotes] = useState('')
  const [readiness, setReadiness] = useState<'48h' | '1_week' | '2_weeks'>(
    '48h'
  )
  const [paymentMethod, setPaymentMethod] = useState<
    'bank_check' | 'bank_transfer'
  >('bank_check')
  const [agreedToCommission, setAgreedToCommission] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<OfferFieldErrorKey, string>>
  >({})
  const [submittingOffer, setSubmittingOffer] = useState(false)
  const [submittedOfferData, setSubmittedOfferData] = useState<{
    offerId: string
    offerRef: string
    amount: number
    isBackupWaitlist?: boolean
    accountCreated?: boolean
  } | null>(null)
  const [offerError, setOfferError] = useState('')

  const dynamicPhonePlaceholder = getPhonePlaceholder(countryIso, countryCode)
  const dynamicPhoneMaxLength = getPhoneInputMaxLength(
    buyerPhone,
    countryIso,
    countryCode
  )

  const isNegotiatingCustom = allowNegotiation && offerMode === 'negotiate'
  const typedNumericCash =
    Number(toEnglishDigits(offeredCashStr).replace(/,/g, '')) || 0
  const effectiveCash = isNegotiatingCustom ? typedNumericCash : requiredCash

  const isOverPaidError = isNegotiatingCustom && typedNumericCash > requiredCash
  const isSanityIncompleteError =
    isNegotiatingCustom &&
    typedNumericCash > 0 &&
    typedNumericCash < sanityMinFloor

  const emailFieldLabel =
    f.emailFieldLabel ||
    dict.buy?.stepThree?.emailLabel?.replace('*', '').trim() ||
    ''

  const commissionAgreeText = String(f.commissionAgree || '').replace(
    /1\.25%/g,
    `${commPct}%`
  )

  const clearFieldError = (key: OfferFieldErrorKey) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
    setOfferError('')
  }

  const handleInterestSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setOfferError('')

    const formData = new FormData(e.currentTarget)
    const turnstileToken = String(
      formData.get('cf_turnstile_response') || ''
    ).trim()

    const nextErrors: Partial<Record<OfferFieldErrorKey, string>> = {}
    const cleanEmail = buyerEmail.trim().toLowerCase()
    let validatedGuestPhone = ''

    if (isNegotiatingCustom) {
      if (typedNumericCash <= 0) {
        nextErrors.offeredCash = f.errOfferAmountRequired || f.errorSubmit
      } else if (typedNumericCash > requiredCash) {
        nextErrors.offeredCash = `${oT.errOfferExceedsPaid} (${cur}${requiredCash.toLocaleString('en-US')})`
      } else if (typedNumericCash < sanityMinFloor) {
        nextErrors.offeredCash = oT.errOfferSanityIncomplete
      }
    } else if (requiredCash <= 0) {
      nextErrors.offeredCash = f.errOfferAmountRequired || f.errorSubmit
    }

    if (!currentUserId) {
      if (buyerName.trim().length < 2) {
        nextErrors.buyerName = f.errNameRequired || f.errorSubmit
      }
      const phoneCheck = validatePhoneForCountry({
        rawPhone: buyerPhone,
        dialCode: countryCode,
        countryIso,
        locale,
        messages: phoneMessages,
      })
      if (!phoneCheck.valid) {
        nextErrors.buyerPhone =
          phoneCheck.error || f.errPhoneRequired || f.errorSubmit
      } else {
        validatedGuestPhone = phoneCheck.e164
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        nextErrors.buyerEmail = f.errEmailRequired || f.errorSubmit
      }
    }

    if (!agreedToCommission) {
      nextErrors.agreedToCommission = f.errCommissionRequired || f.errorSubmit
    }

    if (!agreedToTerms) {
      nextErrors.agreedToTerms = f.errTermsRequired || f.errorSubmit
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors)
      setOfferError(f.errFixFieldsBanner || f.errorSubmit)
      const firstErrorKey = Object.keys(nextErrors)[0] as OfferFieldErrorKey
      document
        .getElementById(`offer-field-${firstErrorKey}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    if (!turnstileToken) {
      setOfferError(
        authCommon.turnstileWaitMessage ||
          authCommon.turnstileText ||
          f.errorSubmit
      )
      return
    }

    setFieldErrors({})
    setSubmittingOffer(true)

    try {
      const res = await submitBuyerOfferAction({
        propertyId: rawPropertyId,
        offeredCash: effectiveCash,
        paymentReadiness: readiness,
        paymentMethod,
        guestName: buyerName.trim(),
        guestPhone: validatedGuestPhone,
        guestEmail: cleanEmail,
        buyerNotes: buyerNotes.trim(),
        turnstileToken,
      })

      if (!res.success) {
        setOfferError(res.error || f.errorSubmit)
      } else {
        setSubmittedOfferData({
          offerId: res.offerId || '',
          offerRef: res.offerRef || `OF-${unitCode}`,
          amount: effectiveCash,
          isBackupWaitlist: res.isBackupWaitlist,
          accountCreated: res.accountCreated,
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
      : 'https://dualdealz.com'

  const whatsappConfirmMsg = submittedOfferData
    ? `${f.waConfirmIntro} (${submittedOfferData.offerRef}) ${f.waConfirmUnitWord} (${projectName} - ${unitCode}) ${f.waConfirmAmountWord} ($${submittedOfferData.amount.toLocaleString('en-US')}).\n${f.waConfirmLinkLabel}\n${siteOrigin}/api/verify-contact?offerId=${encodeURIComponent(submittedOfferData.offerId)}`
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
          {isUnderContractDeal
            ? oT.waitlistBtnLabel
            : oT.makeOfferBtn || f.title}
        </h2>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
        {isUnderContractDeal
          ? oT.waitlistModalSubtitle
          : `${f.subtitlePrefix} (${unitCode}) ${f.subtitleSuffix}`}
      </p>

      {submittedOfferData ? (
        <div className="mt-6 rounded-2xl border-2 border-[#007a5a] bg-[#eaf8f2]/70 p-6 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-[#007a5a] text-white shadow-sm">
            <CheckCircle2 className="size-6" />
          </div>
          <p className="text-base font-black text-[#0a1122] sm:text-lg">
            {submittedOfferData.isBackupWaitlist
              ? oT.waitlistSubmittedSuccess
              : `${f.successTitlePrefix} (${projectName}) ${f.successTitleSuffix}`}
          </p>
          <p className="mt-1 font-mono text-xs font-extrabold text-[#007a5a]">
            Ref: #{submittedOfferData.offerRef} · $
            {submittedOfferData.amount.toLocaleString('en-US')}
          </p>
          <p className="mx-auto mt-2.5 max-w-md text-xs leading-relaxed font-bold text-[#0a1122]">
            {submittedOfferData.isBackupWaitlist
              ? oT.waitlistBuyerCardNote
              : f.salesCallExpectText}
          </p>

          {submittedOfferData.accountCreated && (
            <div className="mx-auto mt-3 flex max-w-md items-start gap-2 rounded-xl border border-emerald-200 bg-white px-3.5 py-2.5 text-start text-[11.5px] font-semibold leading-relaxed text-slate-700">
              <Mail className="mt-0.5 size-4 shrink-0 text-[#007a5a]" />
              <span>{f.accountCreatedNote}</span>
            </div>
          )}

          <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {!submittedOfferData.isBackupWaitlist && (
              <a
                href={`https://wa.me/${supportWhatsApp}?text=${encodeURIComponent(whatsappConfirmMsg)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 text-xs font-extrabold text-white shadow-md transition hover:opacity-95 sm:w-auto sm:text-sm"
              >
                <MessageCircle className="size-4 shrink-0" />
                <span>{f.confirmOfferWaBtn}</span>
              </a>
            )}

            <Link
              href="/account/offers?role=buyer"
              className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-5 text-xs font-extrabold text-[#0a1122] hover:bg-gray-50 sm:w-auto"
            >
              {f.viewMyOffersBtn}
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleInterestSubmit} noValidate className="mt-6 space-y-5">
          {offerError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-start text-xs font-bold text-red-700"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600" />
              <span>{offerError}</span>
            </div>
          )}

          {!allowNegotiation ? (
            <div className="rounded-2xl border border-emerald-200/90 bg-[#eaf8f2]/65 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 shrink-0 text-[#007a5a]" />
                  <span className="text-xs font-extrabold text-[#0a1122]">
                    {f.requiredExitCashPrefix?.replace(/[:：]\s*$/, '')}
                  </span>
                </div>
                <strong
                  dir="ltr"
                  className="text-lg font-black text-[#007a5a] tabular-nums sm:text-xl"
                >
                  {cur}
                  {requiredCash.toLocaleString('en-US')}
                </strong>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed font-semibold text-[#007a5a]/90">
                {oT.nonNegotiableUnitNote ||
                  `${f.nonNegotiableUnitPrefix}${requiredCash.toLocaleString('en-US')} ${cur}${f.nonNegotiableUnitSuffix}`}
              </p>
            </div>
          ) : (
            <div
              id="offer-field-offeredCash"
              className="rounded-2xl border border-gray-200/90 bg-[#f8faf9] p-4"
            >
              <label className="mb-3 block text-xs font-extrabold text-[#0a1122]">
                {oT.selectOfferTypeLabel || f.selectCashOfferLabel}
              </label>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setOfferMode('full')
                    clearFieldError('offeredCash')
                  }}
                  className={`flex flex-col justify-between rounded-xl border p-3.5 text-start transition ${
                    offerMode === 'full'
                      ? 'border-2 border-[#007a5a] bg-[#eaf8f2] text-[#007a5a]'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="block text-xs font-extrabold">
                    ✓ {oT.fullPriceOptionTitle || f.fullPriceOptionTitle}
                  </span>
                  <strong
                    dir="ltr"
                    className="mt-1.5 block text-base font-black tabular-nums"
                  >
                    {cur}
                    {requiredCash.toLocaleString('en-US')}
                  </strong>
                  <span className="mt-1 block text-[10.5px] font-semibold opacity-85">
                    {oT.fullPricePriorityHint || f.fullPricePriorityHint}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOfferMode('negotiate')
                    clearFieldError('offeredCash')
                  }}
                  className={`flex flex-col justify-between rounded-xl border p-3.5 text-start transition ${
                    offerMode === 'negotiate'
                      ? 'border-2 border-amber-500 bg-amber-50 text-amber-950'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="block text-xs font-extrabold">
                    💬 {oT.negotiateOptionTitle || f.negotiateOptionTitle}
                  </span>
                  <span className="mt-1.5 block text-[11px] leading-relaxed font-semibold text-gray-600">
                    {oT.negotiateOptionSubHint}
                  </span>
                </button>
              </div>

              {isNegotiatingCustom && (
                <div className="mt-3.5 border-t border-gray-200/80 pt-3.5">
                  <label className="mb-1.5 block text-[11px] font-bold text-gray-700">
                    {oT.maxNegotiableCashInputLabel} (
                    <span dir="ltr" className="inline-block font-extrabold">
                      {cur}
                      {requiredCash.toLocaleString('en-US')}
                    </span>
                    ):
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      dir="ltr"
                      placeholder={f.negotiatePlaceholder}
                      value={offeredCashStr}
                      onChange={(e) => {
                        const digits = toEnglishDigits(e.target.value).replace(
                          /\D/g,
                          ''
                        )
                        const num = Number(digits) || 0
                        setOfferedCashStr(
                          digits ? num.toLocaleString('en-US') : ''
                        )
                        clearFieldError('offeredCash')
                      }}
                      className={`h-12 w-full rounded-xl border bg-white pr-4 pl-10 text-left text-base font-black text-[#0a1122] tabular-nums placeholder:text-xs placeholder:font-semibold placeholder:text-gray-400 focus:outline-none ${
                        fieldErrors.offeredCash ||
                        isOverPaidError ||
                        isSanityIncompleteError
                          ? 'border-2 border-red-500 bg-red-50/20'
                          : 'border-gray-300 focus:border-[#007a5a]'
                      }`}
                    />
                    <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-sm font-extrabold text-gray-400">
                      {cur}
                    </span>
                  </div>

                  {fieldErrors.offeredCash ? (
                    <p className="mt-2 flex items-start gap-1.5 text-[11px] font-bold text-red-600">
                      <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                      <span>{fieldErrors.offeredCash}</span>
                    </p>
                  ) : isOverPaidError ? (
                    <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-2.5 text-[11px] font-bold text-red-700">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                      <span>
                        {oT.errOfferExceedsPaid} (
                        <strong dir="ltr">
                          {cur}
                          {requiredCash.toLocaleString('en-US')}
                        </strong>
                        )
                      </span>
                    </div>
                  ) : isSanityIncompleteError ? (
                    <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-2.5 text-[11px] font-bold text-red-700">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                      <span>{oT.errOfferSanityIncomplete}</span>
                    </div>
                  ) : (
                    <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-[11px] leading-relaxed font-bold text-amber-900">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                      <span>
                        {oT.fomoNegotiationWarning || f.fomoNegotiationWarning}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {!currentUserId && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div id="offer-field-buyerName">
                <label className="mb-2 block text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                  {f.nameLabel} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={buyerName}
                  onChange={(e) => {
                    setBuyerName(e.target.value)
                    clearFieldError('buyerName')
                  }}
                  placeholder={f.namePlaceholder}
                  maxLength={120}
                  className={`h-11 w-full rounded-xl border bg-white px-4 text-xs text-[var(--brand-navy,#0a1122)] focus:outline-none sm:text-sm ${
                    fieldErrors.buyerName
                      ? 'border-2 border-red-500 bg-red-50/20'
                      : 'border-gray-200 focus:border-[var(--brand-primary,#007a5a)]'
                  }`}
                />
                {fieldErrors.buyerName && (
                  <p className="mt-1.5 text-start text-[11px] font-bold text-red-600">
                    {fieldErrors.buyerName}
                  </p>
                )}
              </div>

              <div id="offer-field-buyerPhone">
                <label className="mb-2 block text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                  {f.whatsappLabel} <span className="text-red-500">*</span>
                </label>
                <div dir="ltr" className="flex items-center gap-2">
                  <CountrySelector
                    value={countryCode}
                    onChange={(code, iso) => {
                      const nextIso = iso || ''
                      setCountryCode(code)
                      setCountryIso(nextIso)
                      clearFieldError('buyerPhone')
                      setBuyerPhone((prev) =>
                        sanitizePhoneInputForCountry(prev, nextIso, code)
                      )
                    }}
                    heightClass="h-11"
                  />
                  <input
                    type="tel"
                    inputMode="tel"
                    dir="ltr"
                    value={buyerPhone}
                    onChange={(e) => {
                      setBuyerPhone(
                        sanitizePhoneInputForCountry(
                          e.target.value,
                          countryIso,
                          countryCode
                        )
                      )
                      clearFieldError('buyerPhone')
                    }}
                    placeholder={dynamicPhonePlaceholder}
                    maxLength={dynamicPhoneMaxLength}
                    className={`h-11 flex-1 rounded-xl border bg-white px-4 text-left text-xs font-medium text-[var(--brand-navy,#0a1122)] focus:outline-none sm:text-sm ${
                      fieldErrors.buyerPhone
                        ? 'border-2 border-red-500 bg-red-50/20'
                        : 'border-gray-200 focus:border-[var(--brand-primary,#007a5a)]'
                    }`}
                  />
                </div>
                {fieldErrors.buyerPhone && (
                  <p className="mt-1.5 text-start text-[11px] font-bold text-red-600">
                    {fieldErrors.buyerPhone}
                  </p>
                )}
              </div>

              <div id="offer-field-buyerEmail" className="sm:col-span-2">
                <label className="mb-2 block text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                  {emailFieldLabel} <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  dir="ltr"
                  value={buyerEmail}
                  onChange={(e) => {
                    setBuyerEmail(e.target.value)
                    clearFieldError('buyerEmail')
                  }}
                  placeholder="name@example.com"
                  maxLength={140}
                  className={`h-11 w-full rounded-xl border bg-white px-4 text-left text-xs font-medium text-[var(--brand-navy,#0a1122)] focus:outline-none sm:text-sm ${
                    fieldErrors.buyerEmail
                      ? 'border-2 border-red-500 bg-red-50/20'
                      : 'border-gray-200 focus:border-[var(--brand-primary,#007a5a)]'
                  }`}
                />
                {fieldErrors.buyerEmail && (
                  <p className="mt-1.5 text-start text-[11px] font-bold text-red-600">
                    {fieldErrors.buyerEmail}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                {oT.buyerReadinessLabel || f.readinessLegend}
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
                {f.paymentMethodLabel || oT.paymentMethodLabel}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ['bank_check', oT.methodBankCheck || f.methodBankCheck],
                    [
                      'bank_transfer',
                      oT.methodBankTransfer || f.methodBankTransfer,
                    ],
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

          <div className="space-y-2.5 rounded-xl border border-gray-200 bg-gray-50/70 p-3.5">
            <div id="offer-field-agreedToCommission">
              <label
                className={`flex cursor-pointer items-start gap-2.5 rounded-lg p-1 text-xs leading-relaxed transition ${
                  fieldErrors.agreedToCommission
                    ? 'bg-red-50/60 text-red-900'
                    : 'text-gray-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={agreedToCommission}
                  onChange={(e) => {
                    setAgreedToCommission(e.target.checked)
                    clearFieldError('agreedToCommission')
                  }}
                  className="mt-0.5 size-4 shrink-0 rounded accent-[var(--brand-primary,#007a5a)]"
                />
                <span>
                  {commissionAgreeText}{' '}
                  <span className="text-red-500">*</span>
                </span>
              </label>
              {fieldErrors.agreedToCommission && (
                <p className="mt-1 ps-7 text-start text-[11px] font-bold text-red-600">
                  {fieldErrors.agreedToCommission}
                </p>
              )}
            </div>

            <div
              id="offer-field-agreedToTerms"
              className="border-t border-gray-200/80 pt-2.5"
            >
              <label
                className={`flex cursor-pointer items-start gap-2.5 rounded-lg p-1 text-xs leading-relaxed transition ${
                  fieldErrors.agreedToTerms
                    ? 'bg-red-50/60 text-red-900'
                    : 'text-gray-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => {
                    setAgreedToTerms(e.target.checked)
                    clearFieldError('agreedToTerms')
                  }}
                  className="mt-0.5 size-4 shrink-0 rounded accent-[var(--brand-primary,#007a5a)]"
                />
                <span>
                  {f.termsAgreePrefix}{' '}
                  <Link
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="font-bold text-[#007a5a] underline underline-offset-2 hover:text-[#006248]"
                  >
                    {f.termsLinkText}
                  </Link>{' '}
                  {f.termsAndWord}{' '}
                  <Link
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="font-bold text-[#007a5a] underline underline-offset-2 hover:text-[#006248]"
                  >
                    {f.privacyLinkText}
                  </Link>{' '}
                  {f.termsAgreeSuffix}{' '}
                  <span className="text-red-500">*</span>
                </span>
              </label>
              {fieldErrors.agreedToTerms && (
                <p className="mt-1 ps-7 text-start text-[11px] font-bold text-red-600">
                  {fieldErrors.agreedToTerms}
                </p>
              )}
            </div>
          </div>

          <TurnstileBox />

          <button
            type="submit"
            disabled={submittingOffer}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary,#007a5a)] text-sm font-bold text-white shadow-sm transition active:scale-[0.98] hover:bg-[var(--brand-primary-hover,#006248)] disabled:opacity-50"
          >
            {submittingOffer ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>{f.submittingBtn}</span>
              </>
            ) : (
              <span>
                {isUnderContractDeal
                  ? oT.confirmWaitlistOfferBtn
                  : oT.confirmSendOfferBtn || f.submitBtn}
              </span>
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

export default UnitInterestForm