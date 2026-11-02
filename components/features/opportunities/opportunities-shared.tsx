'use client'

import Link from 'next/link'
import { Check, ShieldCheck } from 'lucide-react'
import { getLocalizedGeorgiaAreaName } from '@/components/shared/georgia-areas'
import { HomePropertyCard } from '@/components/features/home/home-property-card'
import { type HomeUnitCardItem } from '@/components/features/home/home-data'
import {
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
  rawDeveloperName?: string
  area: string
  rawArea: string
  type: string
  rooms: number
  baths: number
  size: number
  floor?: number
  totalFloors?: number
  cash: string
  cashNum: number
  negotiable: boolean
  gain?: string
  gainNum: number
  marketPrice?: string
  marketPriceNum: number
  contractPriceNum: number
  remaining: string
  remainingNum: number
  installment: string
  installmentNum: number
  monthlyInstallmentNum: number
  installmentFreq: string
  delivery: string
  isReady: boolean
  contractYear: number
  featured: boolean
  viewsCount: number
  createdAt?: string
  image: string
  images: string[]
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
  const currency = '$'
  const meta =
    row.documents && typeof row.documents === 'object'
      ? row.documents.__unit_meta || {}
      : {}

  const paid = Number(row.paid_amount) || 0
  const requiredCash = Math.max(0, paid)
  const contractPrice = Number(row.contract_price) || paid
  const remainingAmount = Math.max(0, contractPrice - paid)
  const marketPriceNum = Number(row.market_price) || contractPrice
  const installmentNum =
    Number(row.installment_amount ?? meta.installment_amount) || 0
  const installmentFreq =
    row.installment_frequency || meta.installment_frequency || t.card.defaultFreq

  let gainStr: string | undefined = undefined
  let gainNum = 0
  let marketPriceStr: string | undefined = undefined

  if (marketPriceNum > 0 && marketPriceNum > contractPrice) {
    const commission = Math.round(contractPrice * 0.0125)
    gainNum = Math.max(0, marketPriceNum - contractPrice - commission)
    if (gainNum > 0) {
      gainStr = `+ ${gainNum.toLocaleString('en-US')}`
      marketPriceStr = marketPriceNum.toLocaleString('en-US')
    }
  }

  const rawDelStatus = String(
    row.delivery_status || meta.delivery_status || ''
  ).trim()
  const isReady =
    rawDelStatus.includes('جاهز') ||
    rawDelStatus.includes('فوري') ||
    rawDelStatus.includes('مستلم') ||
    rawDelStatus.toLowerCase().includes('ready') ||
    rawDelStatus.toLowerCase().includes('готов') ||
    rawDelStatus.includes('მზად') ||
    rawDelStatus.includes(t.filters.deliveryStatuses[1])

  const delivYearNum = Number(row.delivery_year || meta.delivery_year) || 0
  const yearMatch = rawDelStatus.match(/20\d{2}/)

  const deliveryDisplayStr = delivYearNum
    ? isReady
      ? `${t.filters.deliveryStatuses[1]} (${delivYearNum})`
      : String(delivYearNum)
    : yearMatch
      ? yearMatch[0]
      : isReady
        ? t.filters.deliveryStatuses[1]
        : rawDelStatus || '2026'

  const numericCode = String(row.id || '')
    .replace(/\D/g, '')
    .slice(0, 5)
  const fallbackCode = String(row.id || '')
    .slice(0, 5)
    .toUpperCase()
  const code = `U-${numericCode.length >= 4 ? numericCode : fallbackCode}`

  const rawArea = row.area || meta.area || ''
  const localizedArea = rawArea
    ? getLocalizedGeorgiaAreaName(rawArea, locale)
    : t.card.defaultArea
  const devName = row.developer_name || ''

  const validImages = Array.isArray(row.images)
    ? row.images.filter((img: string) => Boolean(img && img.trim()))
    : []

  const validImage =
    validImages.length > 0 ? validImages[0] : DEFAULT_FALLBACK_IMAGE

  const isFeaturedActive =
    Boolean(row.is_featured) &&
    (!row.featured_until || new Date(row.featured_until) > new Date())

  const floorNum =
    row.floor_number !== null &&
    row.floor_number !== undefined &&
    String(row.floor_number).trim() !== ''
      ? Number(row.floor_number)
      : undefined

  return {
    id: String(row.id),
    code,
    country,
    currency,
    project: row.project_name || t.card.defaultProject,
    developer: devName,
    rawDeveloperName: row.developer_name || '',
    area: localizedArea,
    rawArea,
    type: row.unit_type || meta.unit_type || t.card.defaultType,
    rooms: Number(row.rooms ?? meta.rooms) || 2,
    baths: Number(row.bathrooms ?? meta.bathrooms) || 1,
    size: Number(row.size ?? meta.size) || 75,
    floor: floorNum,
    totalFloors: Number(row.total_floors ?? meta.total_floors) || 16,
    cash: requiredCash.toLocaleString('en-US'),
    cashNum: requiredCash,
    negotiable: Boolean(row.willing_to_discount),
    gain: gainStr,
    gainNum,
    marketPrice: marketPriceStr,
    marketPriceNum,
    contractPriceNum: contractPrice,
    remaining: remainingAmount.toLocaleString('en-US'),
    remainingNum: remainingAmount,
    installment: installmentNum.toLocaleString('en-US'),
    installmentNum,
    monthlyInstallmentNum: calcMonthlyEquivalent(
      installmentNum,
      installmentFreq
    ),
    installmentFreq,
    delivery: deliveryDisplayStr,
    isReady,
    contractYear: Number(row.contract_year ?? meta.contract_year) || 2024,
    featured: isFeaturedActive,
    viewsCount: Number(row.views_count) || 85,
    createdAt: row.created_at,
    image: validImage,
    images: validImages.length > 0 ? validImages : [validImage],
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
  const unifiedUnit: HomeUnitCardItem = {
    id: property.id,
    code: property.code,
    title: property.project,
    developer: property.rawDeveloperName,
    area: property.rawArea || property.area,
    unitTypeLabel: property.type,
    category: 'exit',
    price: property.cashNum,
    contractPrice: property.contractPriceNum,
    marketPrice: property.marketPriceNum,
    remainingAmount: property.remainingNum,
    gainAmount: property.gainNum,
    negotiable: property.negotiable,
    installmentAmount: property.installmentNum,
    installmentFreq: property.installmentFreq,
    deliveryText: property.delivery,
    size: property.size,
    rooms: property.rooms,
    bedrooms: Math.max(1, property.rooms - 1),
    bathrooms: property.baths,
    floor: property.floor,
    totalFloors: property.totalFloors || 16,
    image: property.image,
    images: property.images,
    imagesCount: property.images.length,
    isFeatured: property.featured,
    boostTier: property.featured ? 'super_vip' : null,
    docsVerified: true,
    viewsCount: property.viewsCount,
    createdAt: property.createdAt,
  }

  return (
    <HomePropertyCard
      unit={unifiedUnit}
      isFav={liked}
      onToggleFav={onToggleLike}
      fullWidthOnGrid={true}
    />
  )
}

export function OpportunitiesBottomSections() {
  const { t: dict } = useTranslation()
  const tr = dict.opportunitiesPage.trustSection

  return (
    <section className="mt-12 border-t border-gray-200/80 pt-10 sm:mt-14 sm:pt-12">
      <h2 className="text-start text-lg font-bold text-[#0f1d40] sm:text-2xl">
        {tr.title}
      </h2>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:mt-6 sm:gap-6 md:grid-cols-[1.35fr_1fr]">
        <div className="sivrce-card flex flex-col justify-between rounded-[20px] border border-gray-200/80 bg-white p-5 text-start shadow-xs sm:p-8">
          <div>
            <span className="inline-flex size-9 items-center justify-center rounded-xl bg-blue-50 text-[#2563eb] sm:size-10">
              <ShieldCheck className="size-4 sm:size-5" />
            </span>
            <h3 className="mt-3 text-sm font-bold text-[#0f1d40] sm:mt-4 sm:text-lg">
              {tr.card1Title}
            </h3>
            <p className="mt-2.5 text-xs leading-[1.9] text-gray-500 sm:mt-3 sm:text-[13px]">
              {tr.card1Desc}
            </p>
          </div>

          <div className="mt-5 sm:mt-6">
            <Link
              href="/buy"
              className="inline-flex h-10 items-center justify-center rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-6 text-xs font-bold text-white shadow-xs transition hover:opacity-95"
            >
              {tr.card1Btn}
            </Link>
          </div>
        </div>

        <div className="sivrce-card rounded-[20px] border border-gray-200/60 bg-white p-5 text-start shadow-xs sm:p-8">
          <h3 className="text-sm font-bold text-[#0f1d40] sm:text-base">
            {tr.card2Title}
          </h3>

          <ul className="mt-4 space-y-3 text-xs leading-relaxed text-gray-600 sm:mt-5 sm:space-y-3.5">
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-[#007a5a]" />
              <span>{tr.point1}</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-[#007a5a]" />
              <span>{tr.point2}</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-[#007a5a]" />
              <span>{tr.point3}</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}