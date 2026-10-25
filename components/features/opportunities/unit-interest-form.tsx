'use client'

import { useRef, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  ZoomIn,
} from 'lucide-react'
import { TurnstileBox } from '@/components/layouts/funnel-shell'
import { CountrySelector } from '@/components/shared/country-selector'
import { useTranslation } from '@/lib/i18n'

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
  areaName,
  unitType,
  deliveryYear,
  requiredCash,
  totalRequiredNow,
  installmentAmount,
  currentUserId,
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
}) {
  const { t: dict } = useTranslation()
  const f = dict.unitDetailsPage.interestForm

  const [buyerName, setBuyerName] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [countryCode, setCountryCode] = useState('995')
  const [buyerNotes, setBuyerNotes] = useState('')
  const [readiness, setReadiness] = useState<'week' | 'month' | 'info'>('info')
  const [agreedToCommission, setAgreedToCommission] = useState(false)
  const [submittingOffer, setSubmittingOffer] = useState(false)
  const [offerSubmitted, setOfferSubmitted] = useState(false)
  const [offerError, setOfferError] = useState('')

  const handleInterestSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setOfferError('')
    setSubmittingOffer(true)

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const cleanPhone = `+${countryCode.replace('+', '')}${buyerPhone.replace(/^0+/, '').replace(/\D/g, '').trim()}`
      const readinessLabel =
        readiness === 'week'
          ? f.readinessWeek
          : readiness === 'month'
            ? f.readinessMonth
            : f.readinessInfo

      const insertPayload: Record<string, any> = {
        country: 'GE',
        country_code: 'GE',
        currency_code: 'USD',
        name: buyerName.trim(),
        phone: cleanPhone,
        available_cash: requiredCash,
        budget: totalRequiredNow,
        max_installment: installmentAmount,
        payment_plan: `(${unitCode}) · ${readinessLabel}${
          buyerNotes ? ` · ${buyerNotes}` : ''
        }`,
        preferred_areas: [`🎯 ${projectName} (${unitCode}) - ${areaName}`],
        unit_types: [unitType],
        delivery_status: deliveryYear,
      }

      if (currentUserId) {
        insertPayload.user_id = currentUserId
      }

      const { error } = await supabase
        .from('buy_requests')
        .insert(insertPayload)

      if (error) {
        setOfferError(f.errorSubmit)
      } else {
        try {
          await supabase.from('notifications').insert({
            user_id: null,
            title: `🎯 ${projectName} (${unitCode})`,
            message: `${buyerName.trim()} (${cleanPhone})`,
            type: 'lead',
            link: '/admin/leads?type=unit_leads',
            is_read: false,
          })
        } catch {}
        setOfferSubmitted(true)
      }
    } catch {
      setOfferError(f.errorUnexpected)
    } finally {
      setSubmittingOffer(false)
    }
  }

  return (
    <section className="mt-8 rounded-[20px] border border-gray-200/90 bg-white p-5 text-start shadow-sm sm:p-8">
      <h2 className="text-lg font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-xl">
        {f.title}
      </h2>
      <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
        {f.subtitlePrefix} ({unitCode}) {f.subtitleSuffix}
      </p>

      {offerSubmitted ? (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <p className="text-sm font-extrabold text-emerald-800">
            {f.successTitlePrefix} ({projectName}) {f.successTitleSuffix}
          </p>
          <p className="mt-1.5 text-xs text-emerald-700">{f.successDesc}</p>
        </div>
      ) : (
        <form onSubmit={handleInterestSubmit} className="mt-6 space-y-5">
          {offerError && (
            <div className="rounded-xl bg-red-50 p-3 text-center text-xs font-bold text-red-600">
              {offerError}
            </div>
          )}

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
                dir="ltr"
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                placeholder="5xx xx xx xx"
                required
                className="h-11 flex-1 rounded-xl border border-gray-200 bg-white px-4 text-left text-xs font-medium text-[var(--brand-navy,#0a1122)] focus:border-[var(--brand-primary,#007a5a)] focus:outline-none sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold text-[var(--brand-navy,#0a1122)]">
              {f.notesLabel}
            </label>
            <textarea
              rows={3}
              value={buyerNotes}
              onChange={(e) => setBuyerNotes(e.target.value)}
              placeholder={f.notesPlaceholder}
              className="w-full rounded-xl border border-gray-200 bg-white p-3.5 text-xs text-[var(--brand-navy,#0a1122)] placeholder:text-gray-400 focus:border-[var(--brand-primary,#007a5a)] focus:outline-none sm:text-sm"
            />
            <p className="mt-1 text-[10px] text-gray-400">{f.notesHelper}</p>
          </div>

          <fieldset>
            <legend className="mb-2.5 text-xs font-bold text-[var(--brand-navy,#0a1122)]">
              {f.readinessLegend}
            </legend>
            <div className="space-y-2.5">
              {(
                [
                  ['week', f.readinessWeek],
                  ['month', f.readinessMonth],
                  ['info', f.readinessInfo],
                ] as const
              ).map(([key, label]) => (
                <label
                  key={key}
                  onClick={() => setReadiness(key)}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-xs transition ${
                    readiness === key
                      ? 'border-[var(--brand-primary,#007a5a)] bg-[var(--brand-primary-light,#eaf8f2)] font-bold text-[var(--brand-navy,#0a1122)]'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="readiness"
                    checked={readiness === key}
                    onChange={() => setReadiness(key)}
                    className="size-4 accent-[var(--brand-primary,#007a5a)]"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            <p className="mt-1.5 text-[10px] text-gray-400">
              {f.readinessHelper}
            </p>
          </fieldset>

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
            disabled={submittingOffer}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary,#007a5a)] text-sm font-bold text-white shadow-sm transition active:scale-[0.98] hover:bg-[var(--brand-primary-hover,#006248)] disabled:opacity-50"
          >
            {submittingOffer ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>{f.submittingBtn}</span>
              </>
            ) : (
              <span>{f.submitBtn}</span>
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