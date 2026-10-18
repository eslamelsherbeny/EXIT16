'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  ArrowDown,
  Bell,
  Check,
  CheckSquare,
  ChevronDown,
  Heart,
  ListFilter,
  Search,
  ShieldCheck,
  Star,
  X,
  Zap,
} from 'lucide-react'

type Property = {
  id: string
  code: string
  project: string
  developer: string
  area: string
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
  contractPriceNum: number
  remaining: string
  installment: string
  installmentNum: number
  installmentFreq: string
  delivery: string
  deliveryStatus: 'جاهزة' | 'تحت الإنشاء'
  contractYear: number
  featured?: boolean
  image: string
  isFromDb?: boolean
}

const DEFAULT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=85'

// الوحدات الافتراضية الأساسية للعرض بجانب الوحدات الحقيقية المعتمدة من الأدمن
const staticProperties: Property[] = [
  {
    id: 'koun',
    code: 'U-12497',
    project: 'كون - Koun',
    developer: 'مباني إدريس · رأس الحكمة',
    area: 'رأس الحكمة',
    type: 'بنتهاوس',
    rooms: 2,
    baths: 1,
    size: 79,
    cash: '2,800,000',
    cashNum: 2800000,
    negotiable: true,
    gain: '+ 2,452,680',
    gainNum: 2452680,
    marketPrice: '12,000,000',
    contractPriceNum: 9429450,
    remaining: '6,629,450',
    installment: '560,000',
    installmentNum: 560000,
    installmentFreq: 'نصف سنوي',
    delivery: '2028',
    deliveryStatus: 'تحت الإنشاء',
    contractYear: 2024,
    featured: true,
    image:
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: 'madinaty',
    code: 'U-16557',
    project: 'مدينتي',
    developer: 'طلعت مصطفى · مدينتي',
    area: 'القاهرة الجديدة',
    type: 'شقة',
    rooms: 2,
    baths: 2,
    size: 108,
    cash: '3,450,000',
    cashNum: 3450000,
    negotiable: true,
    gain: '+ 1,136,116',
    gainNum: 1136116,
    marketPrice: '10,500,000',
    contractPriceNum: 9248280,
    remaining: '5,798,280',
    installment: '25,895',
    installmentNum: 25895,
    installmentFreq: 'شهري',
    delivery: '2027',
    deliveryStatus: 'تحت الإنشاء',
    contractYear: 2023,
    featured: true,
    image:
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: 'z-park',
    code: 'U-19167',
    project: 'Z park PSR Towers Elsheikh zayed 6 October',
    developer: 'ORA developers · الشيخ زايد',
    area: 'الشيخ زايد',
    type: 'شقة',
    rooms: 3,
    baths: 3,
    size: 164,
    cash: '5,740,136',
    cashNum: 5740136,
    negotiable: true,
    gain: '+ 9,514,816',
    gainNum: 9514816,
    marketPrice: '23,050,000',
    contractPriceNum: 13310700,
    remaining: '7,570,564',
    installment: '374,265',
    installmentNum: 374265,
    installmentFreq: 'ربع سنوي',
    delivery: '2027',
    deliveryStatus: 'تحت الإنشاء',
    contractYear: 2023,
    featured: true,
    image:
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: 'marbay',
    code: 'U-19951',
    project: 'Marbay',
    developer: 'المراسم · رأس الحكمة',
    area: 'رأس الحكمة',
    type: 'توين هاوس',
    rooms: 4,
    baths: 4,
    size: 220,
    cash: '10,200,000',
    cashNum: 10200000,
    negotiable: true,
    gainNum: 0,
    contractPriceNum: 32000000,
    remaining: '21,800,000',
    installment: '636,000',
    installmentNum: 636000,
    installmentFreq: 'ربع سنوي',
    delivery: '2027',
    deliveryStatus: 'تحت الإنشاء',
    contractYear: 2024,
    featured: true,
    image:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: 'tawny',
    code: 'U-19950',
    project: 'تاوني 6 اكتوبر',
    developer: 'هايد بارك · 6 أكتوبر',
    area: '6 أكتوبر',
    type: 'فيلا',
    rooms: 4,
    baths: 4,
    size: 288,
    cash: '17,500,000',
    cashNum: 17500000,
    negotiable: true,
    gain: '+ 10,083,750',
    gainNum: 10083750,
    marketPrice: '60,000,000',
    contractPriceNum: 49300000,
    remaining: '31,800,000',
    installment: '1,020,000',
    installmentNum: 1020000,
    installmentFreq: 'ربع سنوي',
    delivery: '2028',
    deliveryStatus: 'تحت الإنشاء',
    contractYear: 2023,
    featured: true,
    image:
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: 'south-med',
    code: 'U-19949',
    project: 'ساوث ميد',
    developer: 'شركة الإسكندرية للتطوير والتنمية السياحية · الساحل الشمالي',
    area: 'الساحل الشمالي',
    type: 'شقة',
    rooms: 2,
    baths: 2,
    size: 90,
    cash: '1,387,860',
    cashNum: 1387860,
    negotiable: true,
    gainNum: 0,
    contractPriceNum: 12178380,
    remaining: '10,790,520',
    installment: '118,425',
    installmentNum: 118425,
    installmentFreq: 'ربع سنوي',
    delivery: '2030',
    deliveryStatus: 'تحت الإنشاء',
    contractYear: 2024,
    featured: true,
    image:
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=900&q=85',
  },
]

// تحويل طلب البيع المعتمد من قاعدة البيانات إلى بطاقة فرصة كاملة
function mapDbRowToProperty(row: any): Property {
  const paid = Number(row.paid_amount) || 0
  const discount = row.willing_to_discount ? Number(row.discount_amount) || 0 : 0
  const requiredCash = Math.max(0, paid - discount)
  const contractPrice = Number(row.contract_price) || paid
  const remainingAmount = Math.max(0, contractPrice - paid)
  const marketPriceNum = Number(row.market_price) || 0
  const installmentNum = Number(row.installment_amount) || 0

  // حساب مكسب المشتري عن سعر السوق بعد خصم عمولة 1.25%
  let gainStr: string | undefined = undefined
  let gainNum = 0
  let marketPriceStr: string | undefined = undefined

  if (marketPriceNum > 0 && marketPriceNum > contractPrice) {
    const commission = Math.round(marketPriceNum * 0.0125)
    gainNum = Math.max(0, marketPriceNum - (contractPrice - discount) - commission)
    if (gainNum > 0) {
      gainStr = `+ ${gainNum.toLocaleString('en-US')}`
      marketPriceStr = marketPriceNum.toLocaleString('en-US')
    }
  }

  const rawDelStatus = String(row.delivery_status || '')
  const isReady =
    rawDelStatus.includes('جاهز') ||
    rawDelStatus.includes('فوري') ||
    rawDelStatus.includes('مستلم')

  const deliveryStatus: 'جاهزة' | 'تحت الإنشاء' = isReady ? 'جاهزة' : 'تحت الإنشاء'

  // استخراج سنة الاستلام أو حسابها من السنوات المتبقية
  const yearMatch = rawDelStatus.match(/20\d{2}/)
  const deliveryYearStr = yearMatch
    ? yearMatch[0]
    : isReady
      ? '2026'
      : String(new Date().getFullYear() + Math.max(1, Math.min(Number(row.years_left) || 2, 6)))

  const numericCode = String(row.id || '')
    .replace(/\D/g, '')
    .slice(0, 5)
  const fallbackCode = String(row.id || '')
    .slice(0, 5)
    .toUpperCase()
  const code = `U-${numericCode.length >= 4 ? numericCode : fallbackCode}`

  const area = row.area || 'القاهرة الجديدة'
  const devName = row.developer_name ? `${row.developer_name} · ${area}` : area

  const validImage =
    Array.isArray(row.images) && row.images.length > 0 && row.images[0]
      ? row.images[0]
      : DEFAULT_FALLBACK_IMAGE

  return {
    id: row.id,
    code,
    project: row.project_name || 'وحدة سكنية معتمدة',
    developer: devName,
    area,
    type: row.unit_type || 'شقة',
    rooms: Number(row.rooms) || 3,
    baths: Number(row.bathrooms) || 2,
    size: Number(row.size) || 140,
    cash: requiredCash.toLocaleString('en-US'),
    cashNum: requiredCash,
    negotiable: Boolean(row.willing_to_discount),
    gain: gainStr,
    gainNum,
    marketPrice: marketPriceStr,
    contractPriceNum: contractPrice,
    remaining: remainingAmount.toLocaleString('en-US'),
    installment: installmentNum.toLocaleString('en-US'),
    installmentNum,
    installmentFreq: row.installment_frequency || 'ربع سنوي',
    delivery: deliveryYearStr,
    deliveryStatus,
    contractYear: Number(row.contract_year) || 2024,
    featured: true,
    image: validImage,
    isFromDb: true,
  }
}

const unitTypes = [
  'شقة',
  'دوبلكس',
  'بنتهاوس',
  'تاون هاوس',
  'توين هاوس',
  'اي فيلا',
  'فيلا',
  'شاليه',
  'مكتب',
  'محل',
  'عيادة',
  'أرض',
]

const deliveryStatuses = ['الكل', 'جاهزة', 'تحت الإنشاء']

const deliveryYears = [
  'الكل',
  'حتى 2026',
  'حتى 2027',
  'حتى 2028',
  'حتى 2029',
  'حتى 2030',
  'حتى 2031',
]

const contractYears = [
  'الكل',
  '2025 أو أقدم',
  '2024 أو أقدم',
  '2023 أو أقدم',
  '2022 أو أقدم',
  '2021 أو أقدم',
  '2020 أو أقدم',
]

const roomOptions = ['الكل', '+1', '+2', '+3', '+4', '+5']

const sorts = [
  'الأنسب لي 🎯',
  'الأحدث',
  'الفرص المميزة ⭐',
  'الأقل كاش',
  'أقل قسط',
  'الأكبر مكسب',
  'الأقرب للاستلام',
  'جاهزة للنقل',
  'الأكثر طلبًا',
  'الأكثر حفظًا',
  'الأكثر زيارة',
]

// ==================== مكون بطاقة الوحدة (متجاوب لعرض كارتين على الموبايل) ====================
function PropertyCard({ property }: { property: Property }) {
  const [liked, setLiked] = useState(false)

  return (
    <div className="group flex flex-col justify-between overflow-hidden rounded-[14px] border border-gray-200/90 bg-white shadow-sm transition-all duration-200 hover:shadow-md sm:rounded-[18px]">
      {/* الجزء العلوي من البطاقة */}
      <div>
        {/* صورة الوحدة والشارات العلوية */}
        <div className="relative h-[125px] w-full overflow-hidden bg-gray-100 sm:h-[180px] md:h-[200px]">
          <Link href={`/opportunities/${property.id}`} className="block h-full w-full">
            <img
              src={property.image}
              alt={property.project}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </Link>

          {/* شارة متحقق بالمستندات (أعلى اليمين) */}
          <span className="pointer-events-none absolute right-1.5 top-1.5 rounded-full bg-[#e6f4f9]/95 px-2 py-0.5 text-[9px] font-bold text-[#0b6954] shadow-sm backdrop-blur-sm sm:right-3 sm:top-3 sm:px-3 sm:py-1 sm:text-[11px]">
            متحقق بالمستندات
          </span>

          {/* أزرار المفضلة والنجمة المميزة (أعلى اليسار) */}
          <div className="absolute left-1.5 top-1.5 flex items-center sm:left-3 sm:top-3">
            <div className="flex items-center rounded-full bg-white p-0.5 pl-0.5 pr-1.5 shadow-md sm:pl-1 sm:pr-2.5">
              {property.featured && (
                <Star
                  aria-label="فرصة مميزة"
                  className="ml-1 size-3 fill-amber-400 text-amber-500 sm:ml-1.5 sm:size-3.5"
                />
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  setLiked(!liked)
                }}
                aria-label="إضافة للمفضلة"
                className={`flex size-6 items-center justify-center rounded-full transition-colors sm:size-8 ${
                  liked
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-600/80 text-white hover:bg-gray-700'
                }`}
              >
                <Heart className={`size-3 sm:size-4 ${liked ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* تفاصيل البطاقة الوسطى */}
        <div className="p-2.5 pb-2 text-right sm:p-5 sm:pb-3">
          {/* اسم المشروع */}
          <Link href={`/opportunities/${property.id}`}>
            <h3 className="line-clamp-1 text-[13px] font-extrabold leading-snug text-[#0a1122] transition-colors group-hover:text-[#0b6954] sm:line-clamp-2 sm:text-[16px]">
              {property.project}
            </h3>
          </Link>

          {/* المطور والمنطقة */}
          <p className="mt-0.5 line-clamp-1 text-[10px] text-gray-500 sm:mt-1 sm:text-xs">
            {property.developer}
          </p>

          {/* كود الوحدة */}
          <div className="mt-0.5 text-left sm:mt-1">
            <span className="font-mono text-[9px] text-gray-400 sm:text-[11px]">
              {property.code}
            </span>
          </div>

          {/* مواصفات الوحدة */}
          <p className="mt-1.5 line-clamp-1 text-[10px] font-extrabold text-[#0a1122] sm:mt-2 sm:text-xs">
            {property.type} · {property.rooms} غرف · {property.baths} حمام · {property.size} م²
          </p>

          {/* المطلوب كاش دلوقتي */}
          <div className="mt-2.5 sm:mt-4">
            <p className="text-[10px] text-gray-400 sm:text-[11px]">المطلوب كاش دلوقتي</p>
            <p className="mt-0.5 text-[15px] font-extrabold tracking-tight text-[#0a1122] sm:text-[22px]">
              {property.cash}{' '}
              <span className="text-[11px] font-bold sm:text-sm">ج.م</span>
            </p>
            {property.negotiable && (
              <div className="mt-0.5 flex items-center justify-start gap-1 text-[10px] font-bold text-[#d97706] sm:mt-1 sm:text-[11px]">
                <span>↓</span>
                <span>قابل للتفاوض</span>
              </div>
            )}
          </div>

          {/* صندوق مكسبك عن سعر السوق (الأخضر) */}
          {property.gain && (
            <div className="mt-2.5 sm:mt-3.5">
              <div className="rounded-lg border border-[#c8eedd] bg-[#ecfbf3] p-2 text-right sm:rounded-xl sm:p-3">
                <p className="text-[10px] font-bold text-[#0b6954] sm:text-[11px]">
                  مكسبك عن سعر السوق
                </p>
                <p
                  dir="ltr"
                  className="mt-0.5 text-right text-[13px] font-extrabold text-[#0b6954] sm:text-lg"
                >
                  {property.gain} ج.م
                </p>
                <p className="mt-0.5 text-[8.5px] leading-snug text-[#0b6954]/85 sm:text-[10px]">
                  سعر السوق اليوم: {property.marketPrice} ج.م · بعد خصم عمولتنا 1.25%
                </p>
              </div>
              <p className="mt-1 hidden text-[10px] text-gray-400 sm:block">
                سعر السوق من صاحب الوحدة ومسؤوليته — مش تقييم من عقار إكزت.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* الجزء السفلي من البطاقة: جدول الـ 3 صفوف + زر التفاصيل */}
      <div className="px-2.5 pb-2.5 pt-1 sm:px-5 sm:pb-5 sm:pt-2">
        <div className="space-y-1.5 border-t border-gray-100 pt-2 text-[10px] sm:space-y-2 sm:pt-3 sm:text-xs">
          <div className="flex items-center justify-between gap-1">
            <span className="shrink-0 text-gray-400">المتبقي للمطور</span>
            <strong className="truncate font-bold text-[#0a1122]">
              {property.remaining} ج.م
            </strong>
          </div>
          <div className="flex items-center justify-between gap-1">
            <span className="shrink-0 text-gray-400">القسط</span>
            <strong className="truncate font-bold text-[#0a1122]">
              {property.installment} ج.م · {property.installmentFreq}
            </strong>
          </div>
          <div className="flex items-center justify-between gap-1">
            <span className="shrink-0 text-gray-400">الاستلام</span>
            <strong className="font-bold text-[#0a1122]">{property.delivery}</strong>
          </div>
        </div>

        <Link
          href={`/opportunities/${property.id}`}
          className="mt-3 flex h-8 w-full items-center justify-center rounded-[8px] bg-[#0a1122] text-[11px] font-bold text-white transition-colors hover:bg-[#16223f] sm:mt-4 sm:h-10 sm:rounded-[10px] sm:text-xs"
        >
          تفاصيل
        </Link>
      </div>
    </div>
  )
}

// ==================== الصفحة الرئيسية للفرص المتاحة ====================
export default function OpportunitiesPage() {
  const [dbProperties, setDbProperties] = useState<Property[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [negotiable, setNegotiable] = useState(false)
  const [sort, setSort] = useState('الأحدث')

  // حالات الفلترة
  const [search, setSearch] = useState('')
  const [areaQuery, setAreaQuery] = useState('')
  const [maxCash, setMaxCash] = useState('')
  const [maxInstallment, setMaxInstallment] = useState('')
  const [maxContractPrice, setMaxContractPrice] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [deliveryStatus, setDeliveryStatus] = useState('الكل')
  const [deliveryYear, setDeliveryYear] = useState('الكل')
  const [contractYear, setContractYear] = useState('الكل')
  const [minRooms, setMinRooms] = useState('الكل')

  // جلب العقارات المعتمدة من الأدمن في قاعدة البيانات
  useEffect(() => {
    async function loadApprovedProperties() {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        const { data, error } = await supabase
          .from('sell_requests')
          .select('*')
          .in('status', ['active', 'offer_received', 'transferring'])
          .order('created_at', { ascending: false })

        if (!error && data && data.length > 0) {
          const mapped = data.map(mapDbRowToProperty)
          setDbProperties(mapped)
        }
      } catch (err) {
        console.error('Failed to load approved properties:', err)
      }
    }

    loadApprovedProperties()
  }, [])

  // دمج العقارات الحقيقية المعتمدة من الأدمن في المقدمة + العقارات الافتراضية
  const allProperties = useMemo(() => {
    return [...dbProperties, ...staticProperties]
  }, [dbProperties])

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type]
    )
  }

  const clearAll = () => {
    setSearch('')
    setAreaQuery('')
    setMaxCash('')
    setMaxInstallment('')
    setMaxContractPrice('')
    setSelectedTypes([])
    setDeliveryStatus('الكل')
    setDeliveryYear('الكل')
    setContractYear('الكل')
    setMinRooms('الكل')
    setNegotiable(false)
  }

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (negotiable) count++
    if (areaQuery.trim()) count++
    if (maxCash.trim()) count++
    if (maxInstallment.trim()) count++
    if (maxContractPrice.trim()) count++
    if (selectedTypes.length > 0) count += selectedTypes.length
    if (deliveryStatus !== 'الكل') count++
    if (deliveryYear !== 'الكل') count++
    if (contractYear !== 'الكل') count++
    if (minRooms !== 'الكل') count++
    return count
  }, [
    negotiable,
    areaQuery,
    maxCash,
    maxInstallment,
    maxContractPrice,
    selectedTypes,
    deliveryStatus,
    deliveryYear,
    contractYear,
    minRooms,
  ])

  const visibleProperties = useMemo(() => {
    const filtered = allProperties.filter((item) => {
      const haystack = `${item.project} ${item.developer} ${item.area} ${item.code}`.toLowerCase()

      if (search && !haystack.includes(search.toLowerCase())) return false
      if (areaQuery && !item.area.includes(areaQuery)) return false
      if (negotiable && !item.negotiable) return false
      if (selectedTypes.length > 0 && !selectedTypes.includes(item.type)) return false
      if (deliveryStatus !== 'الكل' && item.deliveryStatus !== deliveryStatus) return false

      if (deliveryYear !== 'الكل') {
        const targetYear = Number(deliveryYear.replace('حتى ', ''))
        if (targetYear && Number(item.delivery) > targetYear) return false
      }

      if (contractYear !== 'الكل') {
        const targetConYear = Number(contractYear.replace(/[^0-9]/g, ''))
        if (targetConYear && item.contractYear > targetConYear) return false
      }

      if (minRooms !== 'الكل') {
        const targetRooms = Number(minRooms.replace('+', ''))
        if (item.rooms < targetRooms) return false
      }

      if (maxCash && item.cashNum > Number(maxCash)) return false
      if (maxInstallment && item.installmentNum > Number(maxInstallment)) return false
      if (maxContractPrice && item.contractPriceNum > Number(maxContractPrice)) return false

      return true
    })

    // تطبيق الترتيب المختار
    return [...filtered].sort((a, b) => {
      if (sort === 'الأقل كاش') return a.cashNum - b.cashNum
      if (sort === 'أقل قسط') return a.installmentNum - b.installmentNum
      if (sort === 'الأكبر مكسب') return b.gainNum - a.gainNum
      if (sort === 'الأقرب للاستلام') return Number(a.delivery) - Number(b.delivery)
      if (sort === 'جاهزة للنقل') return a.deliveryStatus === 'جاهزة' ? -1 : 1
      return 0
    })
  }, [
    allProperties,
    search,
    areaQuery,
    negotiable,
    selectedTypes,
    deliveryStatus,
    deliveryYear,
    contractYear,
    minRooms,
    maxCash,
    maxInstallment,
    maxContractPrice,
    sort,
  ])

  const totalUnitsCount = 9689 + dbProperties.length
  const availableUnitsCount = (negotiable ? 2789 : 8526) + dbProperties.length

  return (
    <main dir="rtl" className="min-h-screen bg-[#f5f6f8] py-8 text-[#0a1122] sm:py-14">
      <div className="mx-auto max-w-[1060px] px-3 sm:px-6 lg:px-8">
        
        {/* ==================== 1. الهيدر العلوي للصفحة ==================== */}
        <div className="text-right">
          <h1 className="text-xl font-extrabold tracking-tight text-[#0a1122] sm:text-3xl md:text-[36px]">
            الفرص المتاحة — وحدات تنازل بدون أوفر
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-gray-500 sm:mt-3 sm:text-sm md:text-base">
            كل فرصة هنا اتراجع عقدها وإيصالاتها ورصيدها المتبقي قبل ما تظهر. مفيش أوفر، ومفيش أرقام على كلام حد.
          </p>
        </div>

        {/* ==================== 2. صندوق الإحصائيات (عمودين حتى على الموبايل) ==================== */}
        <section className="mt-6 sm:mt-8">
          <div className="grid grid-cols-2 divide-x divide-x-reverse divide-gray-200/80 overflow-hidden rounded-[16px] border border-gray-200/70 border-t-[3px] border-t-[#0b6954] bg-white shadow-sm sm:rounded-[20px]">
            {/* الوحدات على المنصة */}
            <div className="p-4 text-right sm:p-10">
              <p className="text-[11px] font-bold text-gray-500 sm:text-xs">الوحدات على المنصة</p>
              <div className="mt-2 flex items-baseline justify-start gap-1.5 sm:mt-3 sm:gap-2">
                <span className="text-2xl font-extrabold tracking-tight text-[#0a1122] sm:text-5xl">
                  {totalUnitsCount.toLocaleString('en-US')}
                </span>
                <span className="text-xs font-medium text-gray-500 sm:text-lg">وحدة</span>
              </div>
              <div className="mt-3 h-[1px] w-8 bg-teal-600/40 sm:mt-4 sm:w-10" />
              <p className="mt-2 text-[10px] text-gray-400 sm:mt-3 sm:text-xs">
                منشورة في السوق، وتحت المراجعة
              </p>
            </div>

            {/* قيمة الوحدات في السوق */}
            <div className="p-4 text-right sm:p-10">
              <div className="flex flex-wrap items-center justify-start gap-1.5 sm:gap-2">
                <p className="text-[11px] font-bold text-gray-500 sm:text-xs">
                  قيمة الوحدات في السوق
                </p>
                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-semibold text-gray-500 sm:text-[10px]">
                  تقديري
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-start gap-1.5 sm:mt-3 sm:gap-2">
                <span className="text-2xl font-extrabold tracking-tight text-[#0a1122] sm:text-5xl">
                  138.9
                </span>
                <span className="text-xs font-medium text-gray-500 sm:text-lg">مليار ج.م</span>
              </div>
              <div className="mt-3 h-[1px] w-8 bg-teal-600/40 sm:mt-4 sm:w-10" />
              <p className="mt-2 text-[10px] text-gray-400 sm:mt-3 sm:text-xs">
                بسعر السوق الحالي للوحدة
              </p>
            </div>
          </div>
        </section>

        {/* ==================== 3. شريط البحث والفلترة ==================== */}
        <section className="mt-6 rounded-[16px] border border-gray-200/80 bg-white p-3.5 shadow-sm sm:mt-8 sm:rounded-[20px] sm:p-5">
          {/* حقل البحث */}
          <div className="relative">
            <Search className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="دوّر باسم المشروع أو المنطقة أو كود الوحدة (U-10057)..."
              className="h-10 w-full rounded-xl border border-gray-200 bg-white pr-10 pl-3 text-xs text-[#0a1122] placeholder:text-gray-400 focus:border-[#0b6954] focus:outline-none sm:h-12 sm:text-sm"
            />
          </div>

          {/* شريط الأزرار والترتيب */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5 sm:mt-3.5">
            {/* اليمين: زر فلترة + قابل للتفاوض + عدد الوحدات */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setFiltersOpen(!filtersOpen)}
                className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition-colors sm:h-10 sm:px-4 sm:text-[13px] ${
                  filtersOpen || activeFilterCount > 0
                    ? 'border-[#0b6954] bg-[#eff8f6] text-[#0b6954]'
                    : 'border-gray-200 bg-white text-[#0a1122] hover:bg-gray-50'
                }`}
              >
                <ListFilter className="size-3.5 sm:size-4" />
                <span>فلترة</span>
                {activeFilterCount > 0 && (
                  <span className="flex size-4 items-center justify-center rounded-full bg-[#0b6954] text-[10px] font-bold text-white sm:size-5">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setNegotiable(!negotiable)}
                className={`inline-flex h-9 items-center gap-1 rounded-xl border px-3 text-xs font-bold transition-colors sm:h-10 sm:px-4 sm:text-[13px] ${
                  negotiable
                    ? 'border-[#d97706] bg-amber-50/60 text-[#b45309]'
                    : 'border-gray-200 bg-white text-[#0a1122] hover:bg-gray-50'
                }`}
              >
                <span>قابل للتفاوض</span>
                <ArrowDown className="size-3 text-[#d97706] sm:size-3.5" />
              </button>

              <span className="text-[11px] font-medium text-gray-500 sm:text-xs">
                {availableUnitsCount.toLocaleString('en-US')} وحدة متاحة
              </span>
            </div>

            {/* اليسار: قائمة الترتيب */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <label htmlFor="sort-select" className="text-[11px] text-gray-400 sm:text-xs">
                ترتيب
              </label>
              <div className="relative">
                <select
                  id="sort-select"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="h-9 min-w-[120px] appearance-none rounded-xl border border-gray-200 bg-white pr-3 pl-7 text-[11px] font-bold text-[#0a1122] focus:border-[#0b6954] focus:outline-none sm:h-10 sm:min-w-[155px] sm:text-xs"
                >
                  {sorts.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-gray-500 sm:left-2.5 sm:size-4" />
              </div>
            </div>
          </div>

          {/* شريط الفلاتر النشطة */}
          {activeFilterCount > 0 && (
            <div className="mt-3 flex flex-wrap items-center justify-start gap-2 border-t border-gray-100 pt-2.5">
              {negotiable && (
                <button
                  type="button"
                  onClick={() => setNegotiable(false)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#e6f4f1] px-3 py-1 text-[11px] font-bold text-[#0b6954] sm:text-xs"
                >
                  <span>قابل للتفاوض</span>
                  <X className="size-3" />
                </button>
              )}
              {selectedTypes.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleType(t)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#e6f4f1] px-3 py-1 text-[11px] font-bold text-[#0b6954] sm:text-xs"
                >
                  <span>{t}</span>
                  <X className="size-3" />
                </button>
              ))}
              {deliveryStatus !== 'الكل' && (
                <button
                  type="button"
                  onClick={() => setDeliveryStatus('الكل')}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#e6f4f1] px-3 py-1 text-[11px] font-bold text-[#0b6954] sm:text-xs"
                >
                  <span>{deliveryStatus}</span>
                  <X className="size-3" />
                </button>
              )}
              {minRooms !== 'الكل' && (
                <button
                  type="button"
                  onClick={() => setMinRooms('الكل')}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#e6f4f1] px-3 py-1 text-[11px] font-bold text-[#0b6954] sm:text-xs"
                >
                  <span dir="ltr">{minRooms} غرف</span>
                  <X className="size-3" />
                </button>
              )}
              <button
                type="button"
                onClick={clearAll}
                className="mr-1 text-[11px] text-gray-400 underline hover:text-gray-600 sm:text-xs"
              >
                مسح الكل
              </button>
            </div>
          )}
        </section>

        {/* ==================== 4. لوحة الفلترة المتقدمة ==================== */}
        {filtersOpen && (
          <section className="mt-3 rounded-[16px] border border-gray-200/80 bg-white p-4 shadow-sm sm:rounded-[20px] sm:p-7">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
              <div className="text-right">
                <label className="mb-1.5 block text-xs font-bold text-[#0a1122]">المناطق</label>
                <input
                  type="text"
                  value={areaQuery}
                  onChange={(e) => setAreaQuery(e.target.value)}
                  placeholder="دوّر على المنطقة..."
                  className="h-10 w-full rounded-xl border border-gray-200 px-3.5 text-xs text-[#0a1122] placeholder:text-gray-400 focus:border-[#0b6954] focus:outline-none sm:h-11"
                />
              </div>

              <div className="text-right">
                <label className="mb-1.5 block text-xs font-bold text-[#0a1122]">
                  أقصى كاش مطلوب دلوقتي
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={maxCash}
                    onChange={(e) => setMaxCash(e.target.value)}
                    className="h-10 w-full rounded-xl border border-gray-200 pr-3.5 pl-10 text-xs text-[#0a1122] focus:border-[#0b6954] focus:outline-none sm:h-11"
                  />
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    ج.م
                  </span>
                </div>
                <p className="mt-1 text-[10px] text-gray-400">
                  أهم رقم — ده اللي هتدفعه عند النقل
                </p>
              </div>

              <div className="text-right">
                <label className="mb-1.5 block text-xs font-bold text-[#0a1122]">
                  أقصى قسط شهري
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={maxInstallment}
                    onChange={(e) => setMaxInstallment(e.target.value)}
                    className="h-10 w-full rounded-xl border border-gray-200 pr-3.5 pl-10 text-xs text-[#0a1122] focus:border-[#0b6954] focus:outline-none sm:h-11"
                  />
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    ج.م
                  </span>
                </div>
                <p className="mt-1 text-[10px] text-gray-400">
                  الأقساط الربع/نص سنوية بنحسبها بما يعادلها شهريًا
                </p>
              </div>
            </div>

            <div className="mt-5 text-right">
              <p className="mb-2 text-xs font-bold text-[#0a1122]">نوع الوحدة</p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {unitTypes.map((type) => {
                  const active = selectedTypes.includes(type)
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleType(type)}
                      className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-colors sm:px-4 sm:py-1.5 sm:text-xs ${
                        active
                          ? 'border-[#0b6954] bg-[#0b6954] text-white'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {type}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
              <div className="text-right">
                <p className="mb-2 text-xs font-bold text-[#0a1122]">الاستلام</p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {deliveryStatuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setDeliveryStatus(status)}
                      className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-colors sm:px-4 sm:py-1.5 sm:text-xs ${
                        deliveryStatus === status
                          ? 'border-[#0b6954] bg-[#0b6954] text-white'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-right">
                <p className="mb-2 text-xs font-bold text-[#0a1122]">سنة الاستلام</p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {deliveryYears.map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setDeliveryYear(yr)}
                      className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-colors sm:px-3.5 sm:py-1.5 sm:text-xs ${
                        deliveryYear === yr
                          ? 'border-[#0b6954] bg-[#0b6954] text-white'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-right">
                <p className="mb-2 text-xs font-bold text-[#0a1122]">سنة التعاقد</p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {contractYears.map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setContractYear(yr)}
                      className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-colors sm:px-3.5 sm:py-1.5 sm:text-xs ${
                        contractYear === yr
                          ? 'border-[#0b6954] bg-[#0b6954] text-white'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="text-right">
                <p className="mb-2 text-xs font-bold text-[#0a1122]">أقل عدد غرف</p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {roomOptions.map((rm) => (
                    <button
                      key={rm}
                      type="button"
                      onClick={() => setMinRooms(rm)}
                      className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-colors sm:px-3.5 sm:py-1.5 sm:text-xs ${
                        minRooms === rm
                          ? 'border-[#0b6954] bg-[#0b6954] text-white'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <span dir="ltr">{rm}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-right">
                <label className="mb-1.5 block text-xs font-bold text-[#0a1122]">
                  أقصى سعر تعاقد
                </label>
                <div className="relative max-w-sm">
                  <input
                    type="number"
                    value={maxContractPrice}
                    onChange={(e) => setMaxContractPrice(e.target.value)}
                    className="h-10 w-full rounded-xl border border-gray-200 pr-3.5 pl-10 text-xs text-[#0a1122] focus:border-[#0b6954] focus:outline-none sm:h-11"
                  />
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    ج.م
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  className="rounded-xl bg-[#0b6954] px-5 py-2 text-xs font-bold text-white transition-colors hover:bg-[#095443]"
                >
                  اعرض النتائج
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs font-medium text-gray-500 hover:text-[#0a1122]"
                >
                  مسح الكل
                </button>
              </div>

              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="text-xs font-medium text-gray-400 hover:text-gray-700"
              >
                إخفاء
              </button>
            </div>
          </section>
        )}

        {/* ==================== 5. شبكة الكروت (كارتين بجانب بعض على الموبايل، و3 على الكمبيوتر) ==================== */}
        <section className="mt-6 sm:mt-8">
          <div className="mb-4 flex items-center justify-start gap-1.5 text-right sm:mb-5">
            <Star className="size-4 fill-amber-400 text-amber-500" />
            <h2 className="text-base font-extrabold text-[#0a1122] sm:text-lg">
              فرص مميزة ({visibleProperties.length})
            </h2>
          </div>

          {visibleProperties.length > 0 ? (
            <div className="grid grid-cols-2 items-start gap-2.5 sm:gap-5 lg:grid-cols-3 lg:gap-6">
              {visibleProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
              <p className="text-sm font-bold text-gray-600">
                لا توجد وحدات مطابقة لشروط البحث الحالية.
              </p>
              <button
                type="button"
                onClick={clearAll}
                className="mt-3 rounded-xl bg-[#0b6954] px-5 py-2 text-xs font-bold text-white hover:bg-[#095443]"
              >
                إعادة ضبط الفلاتر
              </button>
            </div>
          )}

          <div className="mt-8 flex justify-center sm:mt-10">
            <button
              type="button"
              className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-xs font-bold text-[#0a1122] shadow-sm transition-colors hover:bg-gray-50 sm:px-6 sm:py-3"
            >
              اعرض 48 كمان (8470 متبقية)
            </button>
          </div>
        </section>

        {/* ==================== 6. بانر التطبيق ==================== */}
        <section className="relative mt-12 overflow-hidden rounded-[20px] bg-[#0a1122] px-5 py-10 text-white shadow-xl sm:mt-14 sm:rounded-[24px] sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute left-10 top-1/2 size-80 -translate-y-1/2 rounded-full bg-teal-500/10 blur-[110px]" />

          <div className="relative mr-0 ml-auto max-w-lg text-right">
            <span className="inline-block rounded-full border border-teal-500/30 bg-teal-500/10 px-3.5 py-1 text-[10px] font-bold text-[#2ee59d] sm:text-[11px]">
              التطبيق نزل رسميًا
            </span>
            <h2 className="mt-3 text-2xl font-extrabold text-white sm:mt-4 sm:text-3xl md:text-4xl">
              السوق كله في جيبك
            </h2>
            <p className="mt-2.5 text-xs leading-[1.9] text-gray-300/85 sm:mt-3 sm:text-sm">
              أول ما وحدة تنزل السوق، الإشعار يوصلك في ثانيتها — من غير ما تفضل داخل تشوف في جديد ولا لأ.
            </p>

            <ul className="mt-5 space-y-3 sm:mt-6 sm:space-y-3.5">
              <li className="flex items-center gap-2.5 text-xs font-medium text-gray-200 sm:gap-3 sm:text-[13px]">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-teal-500/20 bg-teal-500/10 text-[#2ee59d]">
                  <Bell className="size-3.5" />
                </span>
                <span>إشعار لحظة نزول وحدة جديدة تطابق طلبك</span>
              </li>
              <li className="flex items-center gap-2.5 text-xs font-medium text-gray-200 sm:gap-3 sm:text-[13px]">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-teal-500/20 bg-teal-500/10 text-[#2ee59d]">
                  <Zap className="size-3.5" />
                </span>
                <span>تصفح أسرع ومن غير تسجيل دخول كل مرة</span>
              </li>
              <li className="flex items-center gap-2.5 text-xs font-medium text-gray-200 sm:gap-3 sm:text-[13px]">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-teal-500/20 bg-teal-500/10 text-[#2ee59d]">
                  <CheckSquare className="size-3.5" />
                </span>
                <span>تابع وحدتك أو طلبك خطوة بخطوة</span>
              </li>
            </ul>

            <div className="mt-7 flex flex-wrap items-center justify-start gap-2.5 sm:mt-8 sm:gap-3">
              <a
                href="#app-store"
                className="flex items-center gap-2.5 rounded-xl border border-white/15 bg-black px-4 py-2 text-white transition hover:bg-white/5"
              >
                <div className="text-right">
                  <span className="block text-[8px] text-gray-400">حمّله من</span>
                  <span className="block text-xs font-bold leading-tight">App Store</span>
                </div>
                <svg className="size-5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.33c.64-.78 1.08-1.86.96-2.94-.93.04-2.06.62-2.72 1.4-.58.68-1.1 1.79-.96 2.84 1.04.08 2.08-.52 2.72-1.3z" />
                </svg>
              </a>

              <a
                href="#google-play"
                className="flex items-center gap-2.5 rounded-xl border border-white/15 bg-black px-4 py-2 text-white transition hover:bg-white/5"
              >
                <div className="text-right">
                  <span className="block text-[8px] text-gray-400">متوفر على</span>
                  <span className="block text-xs font-bold leading-tight">Google Play</span>
                </div>
                <svg className="size-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M3.61 1.814L13.793 12 3.61 22.186a1.96 1.96 0 0 1-.61-1.42V3.234c0-.55.23-1.05.61-1.42z"
                  />
                  <path
                    fill="#34A853"
                    d="M17.22 8.573L13.793 12 3.61 1.814c.42-.4.99-.53 1.56-.21l12.05 6.97z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M20.635 10.548c.98.57.98 1.98 0 2.55l-3.415 1.975L13.793 12l3.427-3.427 3.415 1.975z"
                  />
                  <path
                    fill="#EA4335"
                    d="M17.22 15.427L5.17 22.396c-.57.32-1.14.19-1.56-.21L13.793 12l3.427 3.427z"
                  />
                </svg>
              </a>
            </div>
          </div>
        </section>

        {/* ==================== 7. قسم ليه تثق في الفرص دي؟ ==================== */}
        <section className="mt-12 border-t border-gray-200/80 pt-10 sm:mt-14 sm:pt-12">
          <h2 className="text-right text-lg font-extrabold text-[#0a1122] sm:text-2xl">
            ليه تثق في الفرص دي؟
          </h2>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:mt-6 sm:gap-6 md:grid-cols-[1.35fr_1fr]">
            <div className="flex flex-col justify-between rounded-[18px] border border-gray-200/80 bg-white p-5 text-right shadow-sm sm:rounded-[20px] sm:p-8">
              <div>
                <span className="inline-flex size-9 items-center justify-center rounded-xl bg-[#f0f4f8] text-[#1e3a8a] sm:size-10">
                  <ShieldCheck className="size-4 sm:size-5" />
                </span>
                <h3 className="mt-3 text-sm font-extrabold text-[#0a1122] sm:mt-4 sm:text-lg">
                  الفرص بتظهر هنا بعد التحقق الكامل — مش قبله
                </h3>
                <p className="mt-2.5 text-xs leading-[1.9] text-gray-500 sm:mt-3 sm:text-[13px]">
                  إحنا ما بننشرش أي وحدة قبل ما نراجع عقدها وإيصالات سدادها ونأكد رصيدها وشروط التنازل. أول الفرص المتحققة هتظهر هنا قريبًا. سجّل قدرتك الشرائية دلوقتي — واللي يناسبك هيوصلك قبل ما ينزل هنا أصلًا: المشترين المسجلين بيشوفوا الفرص الأول.
                </p>
              </div>

              <div className="mt-5 sm:mt-6">
                <Link
                  href="/buy"
                  className="inline-flex h-10 items-center justify-center rounded-[10px] bg-[#0b6954] px-5 text-xs font-bold text-white transition-colors hover:bg-[#095443]"
                >
                  سجّل قدرتك الشرائية
                </Link>
              </div>
            </div>

            <div className="rounded-[18px] border border-gray-200/60 bg-[#f9fafb] p-5 text-right sm:rounded-[20px] sm:p-8">
              <h3 className="text-sm font-extrabold text-[#0a1122] sm:text-base">
                إيه اللي بتشوفه في كل فرصة؟
              </h3>

              <ul className="mt-4 space-y-3 text-xs leading-relaxed text-gray-600 sm:mt-5 sm:space-y-3.5">
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-[#0b6954]" />
                  <span>
                    المطلوب كاش بالظبط — وهو نفس اللي دفعه صاحب الوحدة، موثق بالإيصالات
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-[#0b6954]" />
                  <span>المتبقي للمطور وجدول الأقساط اللي هتكمّله</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-[#0b6954]" />
                  <span>فرق السعر عن سعر السوق الحالي — مكسبك من أول يوم</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-[#0b6954]" />
                  <span>حالة التحقق: المستندات، تأكيد المطور، وجاهزية التنازل</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

      </div>
    </main>
  )
}