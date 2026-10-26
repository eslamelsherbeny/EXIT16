'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  Building2,
  Check,
  ChevronRight,
  Copy,
  Heart,
  Share2,
  Star,
} from 'lucide-react'
import { getCurrentSellerProfileAction } from '@/actions/submit-forms'
import {
  UnitGalleryWithLightbox,
  UnitInterestForm,
} from '@/components/features/opportunities/unit-interest-form'
import { getLocalizedGeorgiaAreaName } from '@/components/shared/georgia-areas'
import { getCurrencySymbol, useTranslation } from '@/lib/i18n'
import { isNonGeorgianLegacyArea } from '@/lib/smart-matcher'

const FALLBACK_UNIT_IMAGE =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85'
const FAVORITES_STORAGE_KEY = 'darak_favorites'

function parseSafeNumber(val: unknown, fallback = 0): number {
  if (typeof val === 'number' && Number.isFinite(val) && val > 0) return val
  if (typeof val === 'string') {
    const normalized = val
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
      .replace(/,/g, '')
      .replace(/[^0-9.]/g, '')
    const num = Number(normalized)
    if (Number.isFinite(num) && num > 0) return num
  }
  return fallback
}

export default function PropertyDetailsPage() {
  const { t: dict, locale, dir, siteSettings } = useTranslation()
  const t = dict.unitDetailsPage
  const c = dict.opportunitiesPage.card
  const filtersT = dict.opportunitiesPage.filters
  const monthsWord =
    (dict.sell?.reviewStep as Record<string, any>)?.monthsUnit ||
    (t.financials as Record<string, any>)?.monthWord ||
    t.financials.yearWord

  const rawCommPct = Number(siteSettings?.buyerCommission)
  const commissionRate =
    Number.isFinite(rawCommPct) && rawCommPct >= 0 ? rawCommPct / 100 : 0.0125

  const params = useParams()
  const rawId = Array.isArray(params?.id)
    ? params.id[0]
    : (params?.id as string) || ''

  const [liked, setLiked] = useState(false)
  const [copied, setCopied] = useState(false)

  const [unitRow, setUnitRow] = useState<any | null>(null)
  const [rawSimilarRows, setRawSimilarRows] = useState<any[]>([])
  const [sameProjectCount, setSameProjectCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    getCurrentSellerProfileAction().then((res) => {
      if (res.isLoggedIn && res.user?.id) {
        setCurrentUserId(res.user.id)
      }
    })
  }, [])

  useEffect(() => {
    if (!rawId) return
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY)
      const list: string[] = stored ? JSON.parse(stored) : []
      setLiked(list.includes(String(rawId)))
    } catch {}
  }, [rawId])

  const handleToggleFavorite = () => {
    if (!rawId) return
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY)
      const list: string[] = stored ? JSON.parse(stored) : []
      const idStr = String(rawId)
      const next = list.includes(idStr)
        ? list.filter((x) => x !== idStr)
        : [...list, idStr]
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next))
      setLiked(next.includes(idStr))
      window.dispatchEvent(new Event('favorites-updated'))
    } catch {
      setLiked(!liked)
    }
  }

  useEffect(() => {
    async function fetchPropertyDetails() {
      setLoading(true)
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        if (rawId) {
          const { data: dbUnit } = await supabase
            .from('sell_requests')
            .select('*')
            .eq('id', rawId)
            .maybeSingle()

          if (dbUnit) {
            setUnitRow(dbUnit)

            const unitArea =
              dbUnit.area || dbUnit.documents?.__unit_meta?.area
            if (unitArea) {
              const { count } = await supabase
                .from('sell_requests')
                .select('id', { count: 'exact', head: true })
                .in('status', ['active', 'offer_received'])
                .eq('area', unitArea)
                .neq('id', rawId)

              setSameProjectCount(count || 0)
            }
          }
        }

        const { data: otherUnits } = await supabase
          .from('sell_requests')
          .select('*')
          .in('status', ['active', 'offer_received'])
          .neq('id', rawId)
          .order('is_featured', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(12)

        if (otherUnits && otherUnits.length > 0) {
          setRawSimilarRows(
            otherUnits
              .filter((u) => !isNonGeorgianLegacyArea(u.area))
              .slice(0, 6)
          )
        }
      } catch (err) {
        console.error('Error loading unit details:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPropertyDetails()
  }, [rawId])

  const similarDbUnits = useMemo(() => {
    return rawSimilarRows.map((u) => {
      const meta = u.documents?.__unit_meta || {}
      const uCurrency = getCurrencySymbol('GE', locale)
      const reqCash = parseSafeNumber(u.paid_amount)
      const rawDel = String(
        u.delivery_status || meta.delivery_status || ''
      ).trim()
      const isReady =
        rawDel.includes('جاهز') ||
        rawDel.includes('فوري') ||
        rawDel.includes('مستلم') ||
        rawDel.toLowerCase().includes('ready') ||
        rawDel.includes(filtersT.deliveryStatuses[1])

      const parenMatch = rawDel.match(/\(([^)]+)\)/)
      const yearMatch = rawDel.match(/20\d{2}/)
      const delMonth = u.delivery_month || meta.delivery_month
      const delivDisplay = isReady
        ? filtersT.deliveryStatuses[1]
        : parenMatch
          ? parenMatch[1]
          : delMonth
            ? `${delMonth} ${monthsWord}`
            : yearMatch
              ? yearMatch[0]
              : rawDel || filtersT.deliveryStatuses[2]

      const isFeat =
        Boolean(u.is_featured) &&
        (!u.featured_until || new Date(u.featured_until) > new Date())

      const rawArea = u.area || meta.area
      const localizedArea = rawArea
        ? getLocalizedGeorgiaAreaName(rawArea, locale)
        : c.defaultArea

      const roomsCount = parseSafeNumber(u.rooms ?? meta.rooms, 2)
      const sizeVal = parseSafeNumber(u.size ?? meta.size, 75)

      return {
        id: u.id,
        name: u.project_name || c.defaultProject,
        area: localizedArea,
        specs: `${u.unit_type || meta.unit_type || c.defaultType} · ${roomsCount} ${c.roomsWord} · ${sizeVal} ${c.sqmUnit} · ${t.similarSection.deliveryPrefix} ${delivDisplay}`,
        cash: reqCash.toLocaleString('en-US'),
        currency: uCurrency,
        featured: isFeat,
        image:
          Array.isArray(u.images) && u.images.length > 0 && u.images[0]
            ? u.images[0]
            : FALLBACK_UNIT_IMAGE,
      }
    })
  }, [rawSimilarRows, locale, c, t, filtersT, monthsWord])

  const computedUnit = useMemo(() => {
    if (!unitRow) return null

    const row = unitRow
    const meta =
      row.documents && typeof row.documents === 'object'
        ? row.documents.__unit_meta || {}
        : {}

    const currency = getCurrencySymbol('GE', locale)

    const projectName = row.project_name || c.defaultProject
    const rawArea = row.area || meta.area || ''
    const areaName = rawArea
      ? getLocalizedGeorgiaAreaName(rawArea, locale)
      : c.defaultArea
    const developerName = row.developer_name || ''
    const subtitle = developerName ? `${developerName} · ${areaName}` : areaName

    const numericId = String(row.id || '')
      .replace(/\D/g, '')
      .slice(0, 5)
    const fallbackId = String(row.id || '')
      .slice(0, 5)
      .toUpperCase()
    const code =
      row.code ||
      `U-${numericId.length >= 4 ? numericId : fallbackId || '1001'}`

    const unitType = row.unit_type || meta.unit_type || c.defaultType
    const isStudio =
      unitType.includes('استوديو') ||
      unitType.toLowerCase().includes('studio') ||
      unitType.toLowerCase().includes('студия') ||
      unitType.includes('სტუდიო')

    const size = parseSafeNumber(row.size ?? meta.size, 75)
    const rawFloor = row.floor_number ?? meta.floor_number
    const floor =
      rawFloor !== null &&
      rawFloor !== undefined &&
      String(rawFloor).trim() !== ''
        ? String(rawFloor)
        : t.specs.typicalFloor

    const rooms = parseSafeNumber(
      row.rooms ?? meta.rooms,
      isStudio ? 1 : 2
    )
    const bathrooms = parseSafeNumber(
      row.bathrooms ?? meta.bathrooms,
      1
    )
    const finishing =
      row.finishing || meta.finishing || t.specs.defaultFinishing
    const deliveryStatus =
      row.delivery_status || meta.delivery_status || t.specs.defaultStatus

    const contractYear = parseSafeNumber(
      row.contract_year ?? meta.contract_year,
      2024
    )
    const contractMonth = row.contract_month || meta.contract_month
    const contractDateFormatted = contractMonth
      ? `${contractMonth}/${contractYear}`
      : String(contractYear)

    const paidAmount = parseSafeNumber(row.paid_amount)
    const contractPrice = parseSafeNumber(row.contract_price, paidAmount)
    const discountAmount = row.willing_to_discount
      ? parseSafeNumber(row.discount_amount)
      : 0

    // الكاش المطلوب للمالك هو المبلغ المدفوع الموثق، والتفاوض يعرض تحته بوضوح
    const requiredCash = paidAmount
    const remainingToDeveloper = Math.max(0, contractPrice - paidAmount)
    const marketPrice = parseSafeNumber(row.market_price)
    const installmentAmount = parseSafeNumber(
      row.installment_amount ?? meta.installment_amount
    )
    const installmentFreq =
      row.installment_frequency || meta.installment_frequency || c.defaultFreq
    const remainingInstallmentMonths = parseSafeNumber(
      row.years_left ?? meta.years_left,
      0
    )

    const pricePerMeter =
      size > 0 && contractPrice > 0 ? Math.round(contractPrice / size) : 0
    const commission = Math.round(contractPrice * commissionRate)
    const marketGain =
      marketPrice > contractPrice
        ? Math.max(0, marketPrice - contractPrice - commission)
        : 0
    const totalRequiredNow = requiredCash + commission
    const discountPercentage =
      paidAmount > 0 && discountAmount > 0
        ? Math.max(1, Math.round((discountAmount / paidAmount) * 100))
        : 5

    const rawDelStr = String(deliveryStatus)
    const isReadyDelivery =
      rawDelStr.includes('جاهز') ||
      rawDelStr.includes('فوري') ||
      rawDelStr.includes('مستلم') ||
      rawDelStr.toLowerCase().includes('ready') ||
      rawDelStr.includes(filtersT.deliveryStatuses[1])

    const parenMatch = rawDelStr.match(/\(([^)]+)\)/)
    const yearMatch = rawDelStr.match(/20\d{2}/)
    const delivMonth = row.delivery_month || meta.delivery_month

    const deliveryDisplay = isReadyDelivery
      ? t.specs.readyForDelivery
      : parenMatch
        ? parenMatch[1]
        : delivMonth
          ? `${delivMonth} ${monthsWord}`
          : yearMatch
            ? yearMatch[0]
            : rawDelStr || t.specs.soon

    const validUrls = Array.isArray(row.images)
      ? row.images.filter((img: string) => Boolean(img && img.trim()))
      : []

    const unitGallery =
      validUrls.length > 0
        ? validUrls.map((url: string, index: number) => ({
            url,
            caption: `${projectName} — ${t.photoWord} ${index + 1}`,
          }))
        : [
            {
              url: FALLBACK_UNIT_IMAGE,
              caption: `${projectName} — ${t.samplePhotoWord}`,
            },
          ]

    const specs = [
      { label: t.specs.type, value: unitType },
      { label: t.specs.size, value: `${size} ${c.sqmUnit}` },
      { label: t.specs.floor, value: floor },
      { label: t.specs.rooms, value: String(rooms) },
      {
        label: t.specs.bathrooms,
        value: String(bathrooms),
      },
      { label: t.specs.finishing, value: finishing },
      { label: t.specs.status, value: deliveryStatus },
      { label: t.specs.contractYear, value: contractDateFormatted },
      {
        label: t.specs.pricePerMeter,
        value:
          pricePerMeter > 0
            ? `${pricePerMeter.toLocaleString('en-US')} ${currency}`
            : `${Math.round((paidAmount || 35000) / size).toLocaleString('en-US')} ${currency}`,
      },
    ]

    const tags: string[] =
      Array.isArray(row.features) && row.features.length > 0
        ? row.features
        : Array.isArray(meta.features)
          ? meta.features
          : []
    const descriptionText = row.description || `${projectName} — ${subtitle}`

    const isFeaturedActive =
      Boolean(row.is_featured) &&
      (!row.featured_until || new Date(row.featured_until) > new Date())

    return {
      projectName,
      areaName,
      subtitle,
      code,
      unitType,
      currency,
      featured: isFeaturedActive,
      gallery: unitGallery,
      specs,
      tags,
      descriptionText,
      requiredCash,
      paidAmount,
      willingToDiscount: Boolean(row.willing_to_discount),
      discountAmount: discountAmount || Math.round(paidAmount * 0.05),
      discountPercentage,
      marketPrice,
      marketGain,
      remainingToDeveloper,
      installmentAmount,
      installmentFreq,
      remainingInstallmentMonths,
      deliveryYear: deliveryDisplay,
      commission,
      totalRequiredNow,
    }
  }, [unitRow, locale, c, t, filtersT, monthsWord, commissionRate])

  const copyUnitCode = () => {
    if (!computedUnit) return
    navigator.clipboard?.writeText(computedUnit.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <main
        dir={dir}
        className="min-h-screen bg-[var(--brand-surface,#f5f6f8)] py-10 text-[var(--brand-navy,#0a1122)]"
      >
        <div className="mx-auto w-full max-w-[780px] px-4 sm:px-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm font-bold text-gray-500 shadow-xs">
            {t.loading}
          </div>
        </div>
      </main>
    )
  }

  if (!computedUnit) {
    return (
      <main
        dir={dir}
        className="min-h-screen bg-[var(--brand-surface,#f5f6f8)] py-10 text-[var(--brand-navy,#0a1122)]"
      >
        <div className="mx-auto w-full max-w-[780px] px-4 sm:px-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-xs">
            <h1 className="text-lg font-extrabold text-[var(--brand-navy,#0a1122)]">
              {t.notFoundTitle}
            </h1>
            <p className="mt-2 text-xs text-gray-500">{t.notFoundDesc}</p>
            <Link
              href="/opportunities"
              className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-[var(--brand-primary,#007a5a)] px-6 text-xs font-bold text-white hover:bg-[var(--brand-primary-hover,#006248)]"
            >
              {t.browseOpportunitiesBtn}
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const fin = t.financials
  const remainingMonthsRowLabel =
    (dict.sell?.reviewStep as Record<string, any>)?.rowRemainingMonths ||
    fin.remainingYearsLabel

  return (
    <main
      dir={dir}
      className="min-h-screen bg-[var(--brand-surface,#f5f6f8)] py-6 text-[var(--brand-navy,#0a1122)] sm:py-10"
    >
      <div className="mx-auto w-full max-w-[780px] px-4 sm:px-6">
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
              onClick={copyUnitCode}
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
              onClick={handleToggleFavorite}
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

        <section className="mt-4 rounded-[18px] border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 text-start sm:grid-cols-4">
            {computedUnit.specs.map((spec) => (
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
              {computedUnit.tags.map((tag) => (
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

        <section className="mt-4 rounded-[18px] border border-[#b8e6d5] bg-white p-5 text-start shadow-sm sm:p-6">
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

        {sameProjectCount > 0 && (
          <section className="mt-4 flex items-center justify-between rounded-[16px] border border-gray-200/80 bg-white px-5 py-4 shadow-sm">
            <div className="flex items-center gap-3 text-start">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary-light,#eaf8f2)] text-[var(--brand-primary,#007a5a)]">
                <Building2 className="size-4" />
              </span>
              <div>
                <p className="text-xs font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-[13px]">
                  {t.sameAreaBanner.prefix} {sameProjectCount}{' '}
                  {t.sameAreaBanner.middle} {computedUnit.areaName}
                </p>
                <p className="mt-0.5 text-[11px] text-gray-400">
                  {t.sameAreaBanner.sub}
                </p>
              </div>
            </div>

            <Link
              href="/opportunities"
              className="shrink-0 text-xs font-bold text-[var(--brand-primary,#007a5a)] hover:underline"
            >
              {t.sameAreaBanner.viewAllBtn}
            </Link>
          </section>
        )}

        {similarDbUnits.length > 0 && (
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
              {similarDbUnits.map((item) => (
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
        )}

        <UnitInterestForm
          unitCode={computedUnit.code}
          projectName={computedUnit.projectName}
          areaName={computedUnit.areaName}
          unitType={computedUnit.unitType}
          deliveryYear={computedUnit.deliveryYear}
          requiredCash={computedUnit.requiredCash}
          totalRequiredNow={computedUnit.totalRequiredNow}
          installmentAmount={computedUnit.installmentAmount}
          currentUserId={currentUserId}
        />
      </div>
    </main>
  )
}