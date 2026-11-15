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
  exactStreet?: string
  houseNumber?: string
  type: string
  rooms: number
  bedrooms: number
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
  boostTier?: 'super_vip' | 'vip_plus' | null
  viewsCount: number
  createdAt?: string
  image: string
  images: string[]
}

export const DEFAULT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=85'

const SHARED_OPPS_I18N: Record<
  LocaleCode,
  {
    readyWord: string
    defaultMonthly: string
    defaultProject: string
    defaultArea: string
    defaultType: string
    trustTitle: string
    card1Title: string
    card1Desc: string
    card1Btn: string
    card2Title: string
    point1: string
    point2: string
    point3: string
  }
> = {
  ar: {
    readyWord: 'جاهزة',
    defaultMonthly: 'شهري',
    defaultProject: 'مشروع سكني',
    defaultArea: 'تبليسي',
    defaultType: 'شقة',
    trustTitle: 'لماذا تشتري وحدة تنازل عبر Aqar Exit؟',
    card1Title: 'لم تجد الوحدة المناسبة بعد؟ سجل طلبك مجاناً',
    card1Desc:
      'حدد ميزانيتك، المنطقة المفضلة في تبليسي أو باتومي، وقيمة القسط الشهري المناسب لك، وسنرشح لك أفضل وحدات التنازل فور توفرها.',
    card1Btn: 'سجل طلب شراء الآن ←',
    card2Title: 'ضمانات الشراء عبر المنصة',
    point1: 'مراجعة العقود وإيصالات السداد الأصلية مع شركة التطوير قبل النشر.',
    point2: 'التنازل ونقل الملكية يتم رسمياً داخل مقر المطور العقاري وبنفس شروط العقد.',
    point3: 'صفر أوفر برايس — تدفع فقط المدفوع الفعلي أو أقل منه وتكمل الأقساط.',
  },
  en: {
    readyWord: 'Ready',
    defaultMonthly: 'Monthly',
    defaultProject: 'Residential Project',
    defaultArea: 'Tbilisi',
    defaultType: 'Apartment',
    trustTitle: 'Why Take Over an Installment Contract via Aqar Exit?',
    card1Title: "Didn't find the right unit yet? Submit your request",
    card1Desc:
      'Set your cash budget, preferred district in Tbilisi or Batumi, and monthly installment limit — we will match you with verified exit deals.',
    card1Btn: 'Submit Buy Request →',
    card2Title: 'Platform Buyer Guarantees',
    point1: 'Original developer contracts and payment receipts verified before listing.',
    point2: 'Official contract transfer takes place directly at the developer office.',
    point3: 'Zero overprice — pay only the actual paid cash (or less) and continue installments.',
  },
  ru: {
    readyWord: 'Готово',
    defaultMonthly: 'Ежемесячно',
    defaultProject: 'Жилой комплекс',
    defaultArea: 'Тбилиси',
    defaultType: 'Квартира',
    trustTitle: 'Почему выгодно покупать по переуступке через Aqar Exit?',
    card1Title: 'Не нашли подходящий объект? Оставьте заявку на подбор',
    card1Desc:
      'Укажите ваш бюджет на руки, район в Тбилиси или Батуми и комфортный платеж по рассрочке — мы подберем проверенные варианты.',
    card1Btn: 'Оставить заявку на покупку →',
    card2Title: 'Гарантии безопасности сделки',
    point1: 'Проверка оригинального договора и квитанций об оплате у застройщика.',
    point2: 'Официальное переоформление договора происходит в офисе застройщика.',
    point3: 'Без наценки (0% оверпрайс) — вы платите только выплаченную сумму и продолжаете рассрочку.',
  },
  ka: {
    readyWord: 'მზადაა',
    defaultMonthly: 'ყოველთვიური',
    defaultProject: 'საცხოვრებელი კომპლექსი',
    defaultArea: 'თბილისი',
    defaultType: 'ბინა',
    trustTitle: 'რატომ უნდა შეიძინოთ ქონება Aqar Exit-ის საშუალებით?',
    card1Title: 'ვერ იპოვეთ სასურველი ბინა? დატოვეთ მოთხოვნა',
    card1Desc:
      'მიუთითეთ თქვენი ბიუჯეტი, სასურველი უბანი თბილისში ან ბათუმში და განვადების პირობები — ჩვენ შეგირჩევთ გადამოწმებულ ვარიანტებს.',
    card1Btn: 'მოთხოვნის დატოვება →',
    card2Title: 'პლატფორმის გარანტიები მყიდველისთვის',
    point1: 'ორიგინალი ხელშეკრულებისა და გადახდის ქვითრების გადამოწმება გამოქვეყნებამდე.',
    point2: 'ოფიციალური გადაფორმება ხდება უშუალოდ დეველოპერის ოფისში.',
    point3: 'ნულოვანი ფასნამატი — იხდით მხოლოდ რეალურად გადახდილ თანხას და აგრძელებთ განვადებას.',
  },
}

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
  const activeLocale: LocaleCode = ['ar', 'en', 'ru', 'ka'].includes(locale)
    ? locale
    : 'ar'
  const sT = SHARED_OPPS_I18N[activeLocale] || SHARED_OPPS_I18N.ar

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
    row.installment_frequency ||
    meta.installment_frequency ||
    sT.defaultMonthly

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
  const isReady = Boolean(
    rawDelStatus.includes('جاهز') ||
      rawDelStatus.includes('فوري') ||
      rawDelStatus.includes('مستلم') ||
      rawDelStatus.toLowerCase().includes('ready') ||
      rawDelStatus.toLowerCase().includes('готов') ||
      rawDelStatus.includes('მზად') ||
      (t?.filters?.deliveryStatuses?.[1] &&
        rawDelStatus.includes(t.filters.deliveryStatuses[1]))
  )

  const delivYearNum = Number(row.delivery_year || meta.delivery_year) || 0
  const yearMatch = rawDelStatus.match(/20\d{2}/)

  const deliveryDisplayStr = delivYearNum
    ? isReady
      ? `${sT.readyWord} (${delivYearNum})`
      : String(delivYearNum)
    : yearMatch
      ? yearMatch[0]
      : isReady
        ? sT.readyWord
        : rawDelStatus || '2026'

  const numericCode = String(row.id || '')
    .replace(/\D/g, '')
    .slice(0, 5)
  const fallbackCode = String(row.id || '')
    .slice(0, 5)
    .toUpperCase()
  const code =
    row.code ||
    meta.code ||
    `U-${numericCode.length >= 4 ? numericCode : fallbackCode}`

  const rawArea = row.area || meta.area || ''
  const localizedArea = rawArea
    ? getLocalizedGeorgiaAreaName(rawArea, activeLocale)
    : sT.defaultArea

  const invalidDevNames = [
    'newly built',
    'under construction',
    'old built',
    'completed',
  ]
  const rawDev = row.developer_name || meta.developer_name || ''
  const devName =
    rawDev && !invalidDevNames.includes(String(rawDev).trim().toLowerCase())
      ? String(rawDev).trim()
      : ''

  const validImages = Array.isArray(row.images)
    ? row.images.filter((img: string) => Boolean(img && img.trim()))
    : []

  const validImage =
    validImages.length > 0 ? validImages[0] : DEFAULT_FALLBACK_IMAGE

  const isFeaturedActive =
    Boolean(row.is_featured) &&
    (!row.featured_until || new Date(row.featured_until) > new Date())

  const resolvedBoostTier: 'super_vip' | 'vip_plus' | null = isFeaturedActive
    ? row.boost_tier === 'vip_plus'
      ? 'vip_plus'
      : 'super_vip'
    : null

  const floorNum =
    row.floor_number !== null &&
    row.floor_number !== undefined &&
    String(row.floor_number).trim() !== ''
      ? Number(row.floor_number)
      : undefined

  const roomsVal = Number(row.rooms ?? meta.rooms) || 2
  const bedroomsVal =
    Number(row.bedrooms ?? meta.bedrooms) || Math.max(1, roomsVal - 1)

  const unifiedPublishedAt =
    row.approved_at || meta.approved_at || row.created_at

  return {
    id: String(row.id),
    code,
    country,
    currency,
    project: row.project_name || sT.defaultProject,
    developer: devName,
    rawDeveloperName: devName,
    area: localizedArea,
    rawArea,
    exactStreet: row.exact_street || meta.exact_street || '',
    houseNumber: row.house_number || meta.house_number || '',
    type: row.unit_type || meta.unit_type || sT.defaultType,
    rooms: roomsVal,
    bedrooms: Math.min(roomsVal, bedroomsVal),
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
    boostTier: resolvedBoostTier,
    viewsCount: Math.max(1, Number(row.views_count) || 1),
    createdAt: unifiedPublishedAt,
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
    bedrooms: property.bedrooms,
    bathrooms: property.baths,
    floor: property.floor,
    totalFloors: property.totalFloors || 16,
    image: property.image,
    images: property.images,
    imagesCount: property.images.length,
    isFeatured: property.featured,
    boostTier:
      property.boostTier || (property.featured ? 'super_vip' : null),
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
  const { locale } = useTranslation()
  const activeLocale = (locale as LocaleCode) || 'ar'
  const sT = SHARED_OPPS_I18N[activeLocale] || SHARED_OPPS_I18N.ar

  return (
    <section className="mt-12 border-t border-gray-200/80 pt-10 sm:mt-14 sm:pt-12">
      <h2 className="text-start text-lg font-bold text-[#0f1d40] sm:text-2xl">
        {sT.trustTitle}
      </h2>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:mt-6 sm:gap-6 md:grid-cols-[1.35fr_1fr]">
        <div className="sivrce-card flex flex-col justify-between rounded-[20px] border border-gray-200/80 bg-white p-5 text-start shadow-xs sm:p-8">
          <div>
            <span className="inline-flex size-9 items-center justify-center rounded-xl bg-blue-50 text-[#2563eb] sm:size-10">
              <ShieldCheck className="size-4 sm:size-5" />
            </span>
            <h3 className="mt-3 text-sm font-bold text-[#0f1d40] sm:mt-4 sm:text-lg">
              {sT.card1Title}
            </h3>
            <p className="mt-2.5 text-xs leading-[1.9] text-gray-500 sm:mt-3 sm:text-[13px]">
              {sT.card1Desc}
            </p>
          </div>

          <div className="mt-5 sm:mt-6">
            <Link
              href="/buy"
              className="inline-flex h-10 items-center justify-center rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-6 text-xs font-bold text-white shadow-xs transition hover:opacity-95"
            >
              {sT.card1Btn}
            </Link>
          </div>
        </div>

        <div className="sivrce-card rounded-[20px] border border-gray-200/60 bg-white p-5 text-start shadow-xs sm:p-8">
          <h3 className="text-sm font-bold text-[#0f1d40] sm:text-base">
            {sT.card2Title}
          </h3>

          <ul className="mt-4 space-y-3 text-xs leading-relaxed text-gray-600 sm:mt-5 sm:space-y-3.5">
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-[#007a5a]" />
              <span>{sT.point1}</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-[#007a5a]" />
              <span>{sT.point2}</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-[#007a5a]" />
              <span>{sT.point3}</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}