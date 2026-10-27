'use client'

import { useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MessageCircle,
  Wallet,
  X,
  ZoomIn,
} from 'lucide-react'
import { submitBuyerOfferAction } from '@/actions/offer-actions'
import { TurnstileBox } from '@/components/layouts/auth-layout'
import { CountrySelector } from '@/components/shared/country-selector'
import { toEnglishDigits } from '@/components/features/seller/seller-shared'
import { getCurrencySymbol, useTranslation } from '@/lib/i18n'

export function UnitGalleryWithLightbox({
  gallery,
}: {
  gallery: Array<{ url: string; caption: string }>
}) {
  const { t: dict, isRtl } = useTranslation()
  const t = dict.unitDetailsPage

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const handleScroll = () => {
    const el = scrollContainerRef.current
    if (!el) return
    const maxScroll = el.scrollWidth - el.clientWidth
    if (maxScroll <= 0) {
      setScrollProgress(0)
      return
    }
    const currentScroll = Math.abs(el.scrollLeft)
    setScrollProgress(
      Math.min(100, Math.max(0, (currentScroll / maxScroll) * 100))
    )
  }

  const scrollByAmount = (direction: 'next' | 'prev') => {
    const el = scrollContainerRef.current
    if (!el) return
    const factor = isRtl ? -1 : 1
    const amount = direction === 'next' ? 360 * factor : -360 * factor
    el.scrollBy({ left: amount, behavior: 'smooth' })
  }

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value)
    setScrollProgress(value)
    const el = scrollContainerRef.current
    if (!el) return
    const maxScroll = el.scrollWidth - el.clientWidth
    el.scrollLeft = (isRtl ? -1 : 1) * ((value / 100) * maxScroll)
  }

  return (
    <>
      <section className="mt-5">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto pt-1 pb-2"
          style={{ scrollbarWidth: 'thin' }}
        >
          {gallery.map((item, idx) => (
            <div
              key={`${item.url}-${idx}`}
              onClick={() => setLightboxIndex(idx)}
              className={`group relative shrink-0 cursor-pointer snap-center overflow-hidden rounded-[18px] bg-gray-200 ${
                gallery.length === 1
                  ? 'h-[250px] w-full sm:h-[360px]'
                  : idx === 0
                    ? 'h-[230px] w-[85%] sm:h-[310px] sm:w-[460px]'
                    : 'h-[230px] w-[70%] sm:h-[310px] sm:w-[300px]'
              }`}
            >
              <img
                src={item.url}
                alt={item.caption}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-80 transition-opacity group-hover:opacity-100" />

              <span
                className={`pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-black/65 px-3.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm transition-opacity ${
                  idx === 0 ? 'inline-flex' : 'hidden group-hover:inline-flex'
                }`}
              >
                <ZoomIn className="size-3.5" />
                <span>{t.zoomHint}</span>
              </span>
            </div>
          ))}
        </div>

        {gallery.length > 1 && (
          <div className="mt-2 flex items-center gap-2 px-1">
            <button
              type="button"
              onClick={() => scrollByAmount('prev')}
              aria-label={t.prevImageAria}
              className="flex size-5 items-center justify-center rounded text-gray-500 hover:bg-gray-200 hover:text-[var(--brand-navy,#0a1122)]"
            >
              <ChevronRight className="size-3.5 rtl:rotate-0 ltr:rotate-180" />
            </button>

            <div className="relative flex flex-1 items-center">
              <input
                type="range"
                min={0}
                max={100}
                value={scrollProgress}
                onChange={handleSliderChange}
                aria-label={t.sliderAria}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-gray-500"
              />
            </div>

            <button
              type="button"
              onClick={() => scrollByAmount('next')}
              aria-label={t.nextImageAria}
              className="flex size-5 items-center justify-center rounded text-gray-500 hover:bg-gray-200 hover:text-[var(--brand-navy,#0a1122)]"
            >
              <ChevronLeft className="size-3.5 rtl:rotate-0 ltr:rotate-180" />
            </button>
          </div>
        )}
      </section>

      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="mb-4 flex w-full max-w-4xl items-center justify-between text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              aria-label={t.closeAria}
            >
              <X className="size-5" />
            </button>
            <span className="text-xs font-bold">
              {lightboxIndex + 1} / {gallery.length} —{' '}
              {gallery[lightboxIndex]?.caption}
            </span>
          </div>

          <div
            className="relative flex w-full max-w-4xl items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {gallery.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setLightboxIndex((prev) =>
                    prev !== null
                      ? (prev - 1 + gallery.length) % gallery.length
                      : 0
                  )
                }
                className="absolute right-2 z-10 flex size-10 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80 sm:right-4 sm:size-12"
                aria-label={t.prevImageAria}
              >
                <ChevronRight className="size-6" />
              </button>
            )}

            <img
              src={gallery[lightboxIndex]?.url}
              alt={gallery[lightboxIndex]?.caption}
              className="max-h-[75vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
            />

            {gallery.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setLightboxIndex((prev) =>
                    prev !== null ? (prev + 1) % gallery.length : 0
                  )
                }
                className="absolute left-2 z-10 flex size-10 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80 sm:left-4 sm:size-12"
                aria-label={t.nextImageAria}
              >
                <ChevronLeft className="size-6" />
              </button>
            )}
          </div>

          {gallery.length > 1 && (
            <div
              className="mt-5 flex max-w-full gap-2 overflow-x-auto pb-2"
              onClick={(e) => e.stopPropagation()}
            >
              {gallery.map((img, idx) => (
                <button
                  key={`${img.url}-${idx}`}
                  type="button"
                  onClick={() => setLightboxIndex(idx)}
                  className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                    lightboxIndex === idx
                      ? 'scale-105 border-[var(--brand-accent,#2ee59d)]'
                      : 'border-transparent opacity-50 hover:opacity-80'
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

  const { t: dict, locale } = useTranslation()
  const f = dict.unitDetailsPage.interestForm
  const oT = (dict.accountPages?.offers as Record<string, any>) || {}
  const cur = getCurrencySymbol('GE', locale)
  const supportWhatsApp = String(dict.footer?.phone || '+201018595959').replace(
    /\D/g,
    ''
  )

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
    ? locale === 'ar'
      ? `أهلاً إدارة Aqar Exit، أؤكد جديتي في عرض الشراء رقم (${submittedOfferData.offerRef}) على وحدة (${projectName} - ${unitCode}) بمبلغ ($${submittedOfferData.amount.toLocaleString('en-US')}).\nرابط تفعيل العرض في الإدارة:\n${siteOrigin}/admin/deals?offerId=${submittedOfferData.offerId}`
      : `Hello Aqar Exit, I confirm my purchase offer (${submittedOfferData.offerRef}) for unit (${projectName} - ${unitCode}) with amount ($${submittedOfferData.amount.toLocaleString('en-US')}).\nAdmin Deal Link:\n${siteOrigin}/admin/deals?offerId=${submittedOfferData.offerId}`
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
            {locale === 'ar'
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
                {locale === 'ar'
                  ? 'تأكيد العرض فوراً عبر واتساب'
                  : 'Confirm Offer via WhatsApp'}
              </span>
            </a>

            <Link
              href="/account/offers?role=buyer"
              className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-5 text-xs font-extrabold text-[#0a1122] hover:bg-gray-50 sm:w-auto"
            >
              {locale === 'ar' ? 'متابعة عروضي في حسابي' : 'View My Offers'}
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

          {/* 1. تحديد قيمة الكاش المعروض */}
          <div className="rounded-2xl border border-gray-200/90 bg-[#f8faf9] p-4">
            <label className="mb-2.5 block text-xs font-extrabold text-[#0a1122]">
              1. {oT.selectOfferTypeLabel || 'تحديد قيمة الكاش المعروض للمالك'}:
            </label>

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
                    ✓ {oT.fullPriceOptionTitle || 'حجز فوري بالسعر الموثق الكامل'}
                  </span>
                  <strong
                    dir="ltr"
                    className="mt-1 block text-sm font-black tabular-nums"
                  >
                    {requiredCash.toLocaleString('en-US')} {cur}
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
                    💬 {oT.negotiateOptionTitle || 'تقديم عرض كاش عاجل (تفاوض)'}
                  </span>
                  <span className="mt-1 block text-[10.5px] text-gray-500">
                    {oT.minAllowedFloorLabel || 'الحد الأدنى المسموح'}:{' '}
                    <strong dir="ltr" className="font-extrabold text-[#0a1122]">
                      {minAllowedCash.toLocaleString('en-US')} {cur}
                    </strong>
                  </span>
                </button>
              </div>
            ) : (
              <div className="mb-3 rounded-xl border border-emerald-200 bg-[#eaf8f2] p-3 text-[11px] font-bold text-[#007a5a]">
                {oT.nonNegotiableUnitNote ||
                  'هذه الوحدة معروضة بسعر تنازل نهائي غير قابل للتفاوض'}
              </div>
            )}

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
                    'أولوية أولى للقبول الفوري وقفل الوحدة'}
                </span>
              </div>
            ) : isBelowMinFloor ? (
              <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-2.5 text-[11px] font-bold text-red-700">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <span>
                  {oT.errBelowMinFloor || 'أقل مبلغ مسموح للعرض هو'}:{' '}
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
                    'العروض بالسعر الكامل لها أولوية القبول الفوري لدى المالك.'}
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

          {/* 2. جاهزية التنفيذ وطريقة السداد */}
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
                    ['bank_check', oT.methodBankCheck || 'شيك مصرفي مقبول الدفع'],
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
