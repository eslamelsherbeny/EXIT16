'use client'

import Link from 'next/link'
import {
  Bell,
  Check,
  CheckSquare,
  Heart,
  Home,
  ShieldCheck,
  Star,
  Zap,
} from 'lucide-react'
import { getLocalizedGeorgiaAreaName } from '@/components/shared/georgia-areas'
import {
  getCurrencySymbol,
  useTranslation,
  type Dictionary,
  type LocaleCode,
} from '@/lib/i18n'

export type OpportunityCountryCode = 'ALL' | 'EG' | 'AE' | 'RU' | 'GE'

export function getCountryFilterOptions(t: Dictionary['opportunitiesPage']) {
  return [
    {
      code: 'GE' as OpportunityCountryCode,
      name: t?.countries?.GE || 'Georgia',
      nameEn: 'Georgia',
      flag: '🇬🇪',
    },
  ]
}

export type MappedProperty = {
  id: string
  code: string
  country: 'GE'
  currency: string
  project: string
  developer: string
  area: string
  rawArea: string
  type: string
  rooms: number
  baths: number
  size: number
  cash: string
  cashNum: number
  negotiable: boolean
  gain?: string
  gainNum: number
  marketPrice?: string
  marketPriceNum: number
  contractPriceNum: number
  remaining: string
  installment: string
  installmentNum: number
  monthlyInstallmentNum: number
  installmentFreq: string
  delivery: string
  isReady: boolean
  contractYear: number
  featured: boolean
  image: string
}

export const DEFAULT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=85'

export function calcMonthlyEquivalent(amount: number, freq: string): number {
  if (!amount) return 0
  const f = (freq || '').trim().toLowerCase()
  if (
    f.includes('ربع') ||
    f.includes('quarter') ||
    f.includes('квартал') ||
    f.includes('კვარტ')
  )
    return Math.round(amount / 3)
  if (
    f.includes('نصف') ||
    f.includes('نص') ||
    f.includes('semi') ||
    f.includes('пол') ||
    f.includes('ნახევარ')
  )
    return Math.round(amount / 6)
  if (
    (f.includes('سنوي') ||
      f.includes('annual') ||
      f.includes('year') ||
      f.includes('год') ||
      f.includes('წლიური')) &&
    !f.includes('نصف') &&
    !f.includes('ربع') &&
    !f.includes('semi')
  ) {
    return Math.round(amount / 12)
  }
  return amount
}

export function mapDbRowToProperty(
  row: any,
  locale: LocaleCode,
  t: Dictionary['opportunitiesPage']
): MappedProperty {
  const country = 'GE'
  const currency = getCurrencySymbol(country, locale)

  const paid = Number(row.paid_amount) || 0
  const discount = row.willing_to_discount
    ? Number(row.discount_amount) || 0
    : 0
  const requiredCash = Math.max(0, paid - discount)
  const contractPrice = Number(row.contract_price) || paid
  const remainingAmount = Math.max(0, contractPrice - paid)
  const marketPriceNum = Number(row.market_price) || contractPrice
  const installmentNum = Number(row.installment_amount) || 0
  const installmentFreq = row.installment_frequency || t.card.defaultFreq

  let gainStr: string | undefined = undefined
  let gainNum = 0
  let marketPriceStr: string | undefined = undefined

  if (marketPriceNum > 0 && marketPriceNum > contractPrice) {
    const commission = Math.round(marketPriceNum * 0.0125)
    gainNum = Math.max(
      0,
      marketPriceNum - (contractPrice - discount) - commission
    )
    if (gainNum > 0) {
      gainStr = `+ ${gainNum.toLocaleString('en-US')}`
      marketPriceStr = marketPriceNum.toLocaleString('en-US')
    }
  }

  const rawDelStatus = String(row.delivery_status || '').trim()
  const isReady =
    rawDelStatus.includes('جاهز') ||
    rawDelStatus.includes('فوري') ||
    rawDelStatus.includes('مستلم') ||
    rawDelStatus.toLowerCase().includes('ready') ||
    rawDelStatus.includes(t.filters.deliveryStatuses[1])

  const yearMatch = rawDelStatus.match(/20\d{2}/)
  const monthsParenMatch = rawDelStatus.match(/\(([^)]+)\)/)

  const deliveryDisplayStr = isReady
    ? t.filters.deliveryStatuses[1]
    : monthsParenMatch
      ? monthsParenMatch[1]
      : yearMatch
        ? yearMatch[0]
        : rawDelStatus || t.filters.deliveryStatuses[2]

  const numericCode = String(row.id || '')
    .replace(/\D/g, '')
    .slice(0, 5)
  const fallbackCode = String(row.id || '')
    .slice(0, 5)
    .toUpperCase()
  const code = `U-${numericCode.length >= 4 ? numericCode : fallbackCode}`

  const rawArea = row.area || ''
  const localizedArea = rawArea
    ? getLocalizedGeorgiaAreaName(rawArea, locale)
    : t.card.defaultArea
  const devName = row.developer_name
    ? `${row.developer_name} · ${localizedArea}`
    : localizedArea

  const validImage =
    Array.isArray(row.images) && row.images.length > 0 && row.images[0]
      ? row.images[0]
      : DEFAULT_FALLBACK_IMAGE

  const isFeaturedActive =
    Boolean(row.is_featured) &&
    (!row.featured_until || new Date(row.featured_until) > new Date())

  return {
    id: String(row.id),
    code,
    country,
    currency,
    project: row.project_name || t.card.defaultProject,
    developer: devName,
    area: localizedArea,
    rawArea,
    type: row.unit_type || t.card.defaultType,
    rooms: Number(row.rooms) || 2,
    baths: Number(row.bathrooms) || 1,
    size: Number(row.size) || 75,
    cash: requiredCash.toLocaleString('en-US'),
    cashNum: requiredCash,
    negotiable: Boolean(row.willing_to_discount),
    gain: gainStr,
    gainNum,
    marketPrice: marketPriceStr,
    marketPriceNum,
    contractPriceNum: contractPrice,
    remaining: remainingAmount.toLocaleString('en-US'),
    installment: installmentNum.toLocaleString('en-US'),
    installmentNum,
    monthlyInstallmentNum: calcMonthlyEquivalent(
      installmentNum,
      installmentFreq
    ),
    installmentFreq,
    delivery: deliveryDisplayStr,
    isReady,
    contractYear: Number(row.contract_year) || 2024,
    featured: isFeaturedActive,
    image: validImage,
  }
}

export function OpportunityCard({
  property,
  liked,
  onToggleLike,
}: {
  property: MappedProperty
  liked: boolean
  onToggleLike: (id: string) => void
}) {
  const { t: dict } = useTranslation()
  const c = dict.opportunitiesPage.card

  return (
    <div
      className={`group flex h-full flex-col justify-between overflow-hidden rounded-[14px] border bg-white shadow-sm transition-all duration-200 hover:shadow-md sm:rounded-[18px] ${
        property.featured
          ? 'border-amber-300/80 ring-1 ring-amber-200/50'
          : 'border-gray-200/90'
      }`}
    >
      <div>
        <div className="relative h-[125px] w-full overflow-hidden bg-gray-100 sm:h-[180px] md:h-[200px]">
          <Link
            href={`/opportunities/${property.id}`}
            className="block h-full w-full"
          >
            <img
              src={property.image}
              alt={property.project}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </Link>

          <span className="pointer-events-none absolute top-1.5 right-1.5 rounded-full bg-[#e6f4f9]/95 px-2 py-0.5 text-[9px] font-bold text-[var(--brand-primary,#007a5a)] shadow-sm backdrop-blur-sm sm:top-3 sm:right-3 sm:px-3 sm:py-1 sm:text-[11px]">
            {c.verifiedBadge}
          </span>

          <div className="absolute top-1.5 left-1.5 flex items-center sm:top-3 sm:left-3">
            <div className="flex items-center rounded-full bg-white p-0.5 pr-1.5 pl-0.5 shadow-md sm:pr-2.5 sm:pl-1">
              {property.featured && (
                <span title={c.featuredTooltip} className="inline-flex">
                  <Star className="mx-1 size-3 fill-amber-400 text-amber-500 sm:mx-1.5 sm:size-3.5" />
                </span>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  onToggleLike(property.id)
                }}
                aria-label={c.addToFavAria}
                className={`flex size-6 items-center justify-center rounded-full transition-colors sm:size-8 ${
                  liked
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-600/80 text-white hover:bg-gray-700'
                }`}
              >
                <Heart
                  className={`size-3 sm:size-4 ${liked ? 'fill-current' : ''}`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="p-2.5 pb-2 text-start sm:p-5 sm:pb-3">
          <Link href={`/opportunities/${property.id}`}>
            <h3 className="line-clamp-1 min-h-[20px] text-[13px] font-bold leading-snug text-[var(--brand-navy,#0a1122)] transition-colors group-hover:text-[var(--brand-primary,#007a5a)] sm:line-clamp-2 sm:min-h-[44px] sm:text-[18px]">
              {property.project}
            </h3>
          </Link>

          <p className="mt-0.5 line-clamp-1 text-[10px] font-normal text-[#64748b] sm:mt-1 sm:text-[13px]">
            {property.developer}
          </p>

          <div className="mt-0.5 text-end sm:mt-1">
            <span className="font-mono text-[9px] text-[#94a3b8] sm:text-[11.5px]">
              {property.code}
            </span>
          </div>

          <p className="mt-1.5 line-clamp-1 text-[10px] font-semibold text-[#1e293b] sm:mt-2 sm:text-[13px]">
            {property.type} · {property.rooms} {c.roomsWord} · {property.baths}{' '}
            {c.bathsWord} · {property.size} {c.sqmUnit}
          </p>

          <div className="mt-2.5 sm:mt-4">
            <p className="text-[10px] font-normal text-[#64748b] sm:text-[12px]">
              {c.requiredCashNow}
            </p>
            <p className="mt-0.5 flex items-baseline gap-1 text-[15px] font-bold tracking-tight text-[var(--brand-navy,#0a1122)] tabular-nums sm:text-[24px]">
              <span dir="ltr">{property.cash}</span>
              <span className="text-[11px] font-semibold sm:text-[15px]">
                {property.currency}
              </span>
            </p>
            {property.negotiable && (
              <div className="mt-0.5 flex items-center justify-start gap-1 text-[10px] font-semibold text-[#b45309] sm:mt-1 sm:text-[11.5px]">
                <span>↓</span>
                <span>{c.negotiable}</span>
              </div>
            )}
          </div>

          {property.gain && (
            <div className="mt-2.5 sm:mt-3.5">
              <div className="rounded-lg bg-[var(--brand-primary-light,#eaf8f2)] p-2 text-start sm:rounded-[14px] sm:px-4 sm:py-3.5">
                <p className="text-[10px] font-semibold text-[var(--brand-primary,#007a5a)] sm:text-[11.5px]">
                  {c.yourGainTitle}
                </p>
                <p className="mt-0.5 flex items-baseline gap-1 text-[13px] font-bold text-[var(--brand-primary,#007a5a)] tabular-nums sm:text-[18px]">
                  <span dir="ltr">{property.gain}</span>
                  <span>{property.currency}</span>
                </p>
                <p className="mt-0.5 text-[8.5px] font-normal leading-snug text-[#2b8a6e] sm:text-[11px]">
                  {c.marketPriceTodayPrefix}{' '}
                  <span dir="ltr">{property.marketPrice}</span>{' '}
                  {property.currency} {c.afterCommissionSuffix}
                </p>
              </div>
              <p className="mt-1.5 hidden text-[10.5px] font-normal text-[#94a3b8] sm:block">
                {c.marketDisclaimer}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="px-2.5 pt-1 pb-2.5 sm:px-5 sm:pt-2 sm:pb-5">
        <div className="space-y-1.5 border-t border-[#f1f5f9] pt-2 text-[10px] sm:space-y-2 sm:pt-3 sm:text-[12.5px]">
          <div className="flex items-center justify-between gap-1">
            <span className="shrink-0 font-normal text-[#64748b]">
              {c.remainingToDev}
            </span>
            <strong className="truncate font-semibold text-[var(--brand-navy,#0a1122)] tabular-nums">
              <span dir="ltr">{property.remaining}</span> {property.currency}
            </strong>
          </div>
          <div className="flex items-center justify-between gap-1">
            <span className="shrink-0 font-normal text-[#64748b]">
              {c.installmentLabel}
            </span>
            <strong className="truncate font-semibold text-[var(--brand-navy,#0a1122)] tabular-nums">
              <span dir="ltr">{property.installment}</span> {property.currency} ·{' '}
              {property.installmentFreq}
            </strong>
          </div>
          <div className="flex items-center justify-between gap-1">
            <span className="shrink-0 font-normal text-[#64748b]">
              {c.deliveryLabel}
            </span>
            <strong className="font-semibold text-[var(--brand-navy,#0a1122)] tabular-nums">
              {property.delivery}
            </strong>
          </div>
        </div>

        <Link
          href={`/opportunities/${property.id}`}
          className="mt-3 flex h-8 w-full items-center justify-center rounded-[8px] bg-[var(--brand-navy,#0a1122)] text-[11px] font-semibold text-white transition-colors hover:bg-[var(--brand-navy-hover,#16223f)] sm:mt-4 sm:h-[42px] sm:rounded-[11px] sm:text-[13.5px]"
        >
          {c.detailsBtn}
        </Link>
      </div>
    </div>
  )
}

export function OpportunitiesBottomSections() {
  const { t: dict } = useTranslation()
  const tr = dict.opportunitiesPage.trustSection

  return (
    <>
      <section className="mt-12 border-t border-gray-200/80 pt-10 sm:mt-14 sm:pt-12">
        <h2 className="text-start text-lg font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-2xl">
          {tr.title}
        </h2>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:mt-6 sm:gap-6 md:grid-cols-[1.35fr_1fr]">
          <div className="flex flex-col justify-between rounded-[18px] border border-gray-200/80 bg-white p-5 text-start shadow-sm sm:rounded-[20px] sm:p-8">
            <div>
              <span className="inline-flex size-9 items-center justify-center rounded-xl bg-[#f0f4f8] text-[#1e3a8a] sm:size-10">
                <ShieldCheck className="size-4 sm:size-5" />
              </span>
              <h3 className="mt-3 text-sm font-extrabold text-[var(--brand-navy,#0a1122)] sm:mt-4 sm:text-lg">
                {tr.card1Title}
              </h3>
              <p className="mt-2.5 text-xs leading-[1.9] text-gray-500 sm:mt-3 sm:text-[13px]">
                {tr.card1Desc}
              </p>
            </div>

            <div className="mt-5 sm:mt-6">
              <Link
                href="/buy"
                className="inline-flex h-10 items-center justify-center rounded-[10px] bg-[var(--brand-primary,#007a5a)] px-5 text-xs font-bold text-white transition-colors hover:bg-[var(--brand-primary-hover,#006248)]"
              >
                {tr.card1Btn}
              </Link>
            </div>
          </div>

          <div className="rounded-[18px] border border-gray-200/60 bg-[#f9fafb] p-5 text-start sm:rounded-[20px] sm:p-8">
            <h3 className="text-sm font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-base">
              {tr.card2Title}
            </h3>

            <ul className="mt-4 space-y-3 text-xs leading-relaxed text-gray-600 sm:mt-5 sm:space-y-3.5">
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-[var(--brand-primary,#007a5a)]" />
                <span>{tr.point1}</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-[var(--brand-primary,#007a5a)]" />
                <span>{tr.point2}</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-[var(--brand-primary,#007a5a)]" />
                <span>{tr.point3}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </>
  )
}

/* ============================================================================
   ARCHIVED APP BANNER FOR OPPORTUNITIES PAGE (COMMENTED FOR FUTURE USE)
   ============================================================================
      <section
        id="app-banner"
        className="relative mt-12 overflow-hidden rounded-[20px] bg-[var(--brand-navy,#0a1122)] px-5 py-10 text-white shadow-xl sm:mt-14 sm:rounded-[24px] sm:px-12 sm:py-16"
      >
        ...
      </section>
============================================================================ */