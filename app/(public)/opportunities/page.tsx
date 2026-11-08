'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import {
  ArrowDown,
  Bath,
  Bookmark,
  Building,
  Building2,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Crown,
  Flame,
  Gem,
  Grid2X2,
  Home,
  Hotel,
  Layers,
  MapPin,
  Megaphone,
  Mountain,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  Store,
  Trees,
  Waves,
  X,
} from 'lucide-react'
import {
  getLocalizedUnitTypes,
  getOptionLabel,
  PROPERTY_KINDS,
  toEnglishDigits,
} from '@/components/features/seller/seller-shared'
import { SivrceLocationModalPicker } from '@/components/features/seller/seller-location-modal'
import {
  mapDbRowToProperty,
  OpportunitiesBottomSections,
  OpportunityCard,
  type MappedProperty,
} from '@/components/features/opportunities/opportunities-shared'
import {
  AreaFilterPanel,
  CommuteFilterPanel,
  MoreFiltersMegaPanel,
  PriceFilterPanel,
  RoomsFilterPanel,
  type SearchFiltersState,
} from '@/components/features/opportunities/search-filter-popovers'
import { Search3DMapView } from '@/components/features/opportunities/search-3d-map-view'
import { getLocalizedGeorgiaAreaName } from '@/components/shared/georgia-areas'
import { useTranslation, type LocaleCode } from '@/lib/i18n'
import { isNonGeorgianLegacyArea } from '@/lib/smart-matcher'

const PAGE_SIZE = 9
const FAVORITES_STORAGE_KEY = 'darak_favorites'

const PUBLIC_SAFE_UNIT_COLUMNS =
  'id, code, project_name, developer_name, area, exact_street, house_number, cadastral_code, unit_type, size, garden_size, rooms, bedrooms, bathrooms, floor_number, total_floors, finishing, delivery_status, delivery_month, delivery_year, features, video_url, tour_3d_url, allow_online_viewing, description, contract_price, paid_amount, market_price, price_per_sqm, installment_amount, installment_frequency, contract_month, contract_year, years_left, willing_to_discount, discount_amount, images, status, is_featured, boost_tier, featured_until, docs_verified, views_count, approved_at, created_at, documents'

const CORE_SAFE_UNIT_COLUMNS =
  'id, project_name, developer_name, area, unit_type, size, rooms, bathrooms, finishing, delivery_status, features, description, contract_price, paid_amount, market_price, installment_amount, installment_frequency, contract_year, years_left, willing_to_discount, discount_amount, images, status, created_at, documents'

const OPPS_UI_FALLBACK: Record<
  LocaleCode,
  {
    searchBtn: string
    allTypesOption: string
    everywhereBtn: string
    cashAndInstallmentsBtn: string
    roomsBtn: string
    areaBtn: string
    commuteBtn: string
    searchResultsPrefix: string
    activeSearchLabel: string
    clearFilterShowAllBtn: string
    saveSearchBtn: string
    searchSavedToast: string
    listViewBtn: string
    map2dBtn: string
    map3dBtn: string
    promoTag: string
    promoHeading: string
    promoDesc: string
    promoCtaBtn: string
    showingRangePrefix: string
    showingRangeOf: string
    prevPageBtn: string
    nextPageBtn: string
    adCardBadge: string
    adCardTitle: string
    adCardSub: string
    adCardBtn: string
    newlyAddedHeading: string
    chips: {
      all: string
      apartments: string
      houses: string
      cottages: string
      luxury: string
      ready: string
      underConst: string
      sea: string
      pool: string
      jacuzzi: string
      ski: string
      land: string
      commercial: string
      hotel: string
    }
  }
> = {
  ar: {
    searchBtn: 'بحث',
    allTypesOption: 'كل الأنواع',
    everywhereBtn: 'في كل مكان',
    cashAndInstallmentsBtn: 'الكاش والأقساط ($)',
    roomsBtn: 'الغرف',
    areaBtn: 'المساحة',
    commuteBtn: 'التنقل',
    searchResultsPrefix: 'نتائج البحث:',
    activeSearchLabel: 'البحث النشط:',
    clearFilterShowAllBtn: 'إلغاء الفلتر وعرض الكل',
    saveSearchBtn: 'حفظ البحث',
    searchSavedToast: 'تم حفظ البحث ✓',
    listViewBtn: 'قائمة',
    map2dBtn: 'الخريطة',
    map3dBtn: 'خريطة ثلاثية الأبعاد',
    promoTag: 'مساحة إعلانية · Aqar Exit Network',
    promoHeading: 'إعلانك هنا',
    promoDesc:
      'انشر إعلانك واصل إلى آلاف المشترين والمستثمرين في العقارات.',
    promoCtaBtn: 'أعلن هنا ←',
    showingRangePrefix: 'عرض',
    showingRangeOf: 'من أصل',
    prevPageBtn: 'السابق',
    nextPageBtn: 'التالي',
    adCardBadge: 'مساحة إعلانية',
    adCardTitle: 'إعلانك هنا',
    adCardSub: 'انشر إعلانك واصل إلى آلاف المشترين والمستثمرين في العقارات.',
    adCardBtn: 'أعلن هنا ←',
    newlyAddedHeading: 'أضيفت حديثاً (مرتبة حسب التاريخ)',
    chips: {
      all: 'كل عروض التنازل',
      apartments: 'شقق بالتقسيط',
      houses: 'منازل وفيلات',
      cottages: 'أكواخ وشاليهات',
      luxury: 'عقارات فاخرة',
      ready: 'استلام فوري',
      underConst: 'قيد الإنشاء',
      sea: 'إطلالة بحرية',
      pool: 'مع حمام سباحة',
      jacuzzi: 'مع جاكوزي',
      ski: 'منتجعات تزلج',
      land: 'قطع أراضٍ',
      commercial: 'تجاري وإداري',
      hotel: 'شقق فندقية',
    },
  },
  en: {
    searchBtn: 'Search',
    allTypesOption: 'All types',
    everywhereBtn: 'Everywhere',
    cashAndInstallmentsBtn: 'Cash & Installments ($)',
    roomsBtn: 'Rooms',
    areaBtn: 'Area',
    commuteBtn: 'Commute',
    searchResultsPrefix: 'Search Results:',
    activeSearchLabel: 'Active Search:',
    clearFilterShowAllBtn: 'Clear Filter & Show All',
    saveSearchBtn: 'Save search',
    searchSavedToast: 'Search saved ✓',
    listViewBtn: 'List',
    map2dBtn: 'Map',
    map3dBtn: '3D Map',
    promoTag: 'Ad Space · Aqar Exit Network',
    promoHeading: 'Your Ad Here',
    promoDesc:
      'Publish your listing and reach thousands of real estate buyers and investors.',
    promoCtaBtn: 'Advertise Here →',
    showingRangePrefix: 'Showing',
    showingRangeOf: 'of',
    prevPageBtn: 'Prev',
    nextPageBtn: 'Next',
    adCardBadge: 'Ad Space',
    adCardTitle: 'Your Ad Here',
    adCardSub:
      'Publish your listing and reach thousands of real estate buyers and investors.',
    adCardBtn: 'Advertise Here →',
    newlyAddedHeading: 'Recently Added (Sorted by Date)',
    chips: {
      all: 'All Exit Deals',
      apartments: 'Apartments',
      houses: 'Houses & Villas',
      cottages: 'Cottages',
      luxury: 'Luxury homes',
      ready: 'Ready to move',
      underConst: 'Under construction',
      sea: 'Sea view',
      pool: 'With pool',
      jacuzzi: 'With Jacuzzi',
      ski: 'Ski resorts',
      land: 'Land plots',
      commercial: 'Commercial',
      hotel: 'Hotel units',
    },
  },
  ru: {
    searchBtn: 'Поиск',
    allTypesOption: 'Все типы',
    everywhereBtn: 'Везде',
    cashAndInstallmentsBtn: 'На руки и рассрочка ($)',
    roomsBtn: 'Комнаты',
    areaBtn: 'Площадь',
    commuteBtn: 'В пути',
    searchResultsPrefix: 'Результаты поиска:',
    activeSearchLabel: 'Активный фильтр:',
    clearFilterShowAllBtn: 'Сбросить фильтр и показать все',
    saveSearchBtn: 'Сохранить поиск',
    searchSavedToast: 'Поиск сохранен ✓',
    listViewBtn: 'Список',
    map2dBtn: 'Карта',
    map3dBtn: '3D Карта',
    promoTag: 'Рекламное место · Aqar Exit Network',
    promoHeading: 'Ваша реклама здесь',
    promoDesc:
      'Разместите объявление и привлеките тысячи покупателей и инвесторов.',
    promoCtaBtn: 'Разместить →',
    showingRangePrefix: 'Показано',
    showingRangeOf: 'из',
    prevPageBtn: 'Назад',
    nextPageBtn: 'Далее',
    adCardBadge: 'Рекламное место',
    adCardTitle: 'Ваша реклама здесь',
    adCardSub:
      'Разместите объявление и привлеките тысячи покупателей и инвесторов.',
    adCardBtn: 'Разместить →',
    newlyAddedHeading: 'Недавно добавленные (по дате)',
    chips: {
      all: 'Все предложения',
      apartments: 'Квартиры',
      houses: 'Дома и виллы',
      cottages: 'Коттеджи и шале',
      luxury: 'Премиум объекты',
      ready: 'Готово к сдаче',
      underConst: 'Строится',
      sea: 'Вид на море',
      pool: 'С бассейном',
      jacuzzi: 'С джакузи',
      ski: 'Горнолыжные курорты',
      land: 'Участки земли',
      commercial: 'Коммерция',
      hotel: 'Апарт-отели',
    },
  },
  ka: {
    searchBtn: 'ძიება',
    allTypesOption: 'ყველა ტიპი',
    everywhereBtn: 'ყველგან',
    cashAndInstallmentsBtn: 'თანხა და განვადება ($)',
    roomsBtn: 'ოთახები',
    areaBtn: 'ფართობი',
    commuteBtn: 'მგზავრობა',
    searchResultsPrefix: 'ძიების შედეგები:',
    activeSearchLabel: 'აქტიური ფილტრი:',
    clearFilterShowAllBtn: 'ფილტრის გასუფთავება',
    saveSearchBtn: 'ძიების შენახვა',
    searchSavedToast: 'შენახულია ✓',
    listViewBtn: 'სია',
    map2dBtn: 'რუკა',
    map3dBtn: '3D რუკა',
    promoTag: 'სარეკლამო სივრცე · Aqar Exit Network',
    promoHeading: 'თქვენი რეკლამა აქ',
    promoDesc:
      'განათავსეთ განცხადება და მიაწვდინეთ ხმა ათასობით მყიდველსა და ინვესტორს.',
    promoCtaBtn: 'განთავსება →',
    showingRangePrefix: 'ნაჩვენებია',
    showingRangeOf: 'სულ:',
    prevPageBtn: 'წინა',
    nextPageBtn: 'შემდეგი',
    adCardBadge: 'სარეკლამო სივრცე',
    adCardTitle: 'თქვენი რეკლამა აქ',
    adCardSub:
      'განათავსეთ განცხადება და მიაწვდინეთ ხმა ათასობით მყიდველსა და ინვესტორს.',
    adCardBtn: 'განთავსება →',
    newlyAddedHeading: 'ახალი დამატებული (თარიღის მიხედვით)',
    chips: {
      all: 'ყველა შეთავაზება',
      apartments: 'ბინები',
      houses: 'სახლები და ვილები',
      cottages: 'კოტეჯები',
      luxury: 'პრემიუმ ქონება',
      ready: 'მზადაა შესასვლელად',
      underConst: 'მშენებარე',
      sea: 'ზღვის ხედით',
      pool: 'აუზით',
      jacuzzi: 'ჯაკუზით',
      ski: 'სათხილამურო კურორტები',
      land: 'მიწის ნაკვეთები',
      commercial: 'კომერციული',
      hotel: 'აპარტ-ოტელი',
    },
  },
}

/**
 * كارت المساحة الإعلانية المدمج داخل الشبكة (مطابق تماماً لتصميم الموقع الجورجي في الصور)
 */
export function InlineAdSlotCard({
  uT,
  tierLabel,
}: {
  uT: Record<string, any>
  tierLabel?: string
}) {
  return (
    <div className="group flex h-full flex-col justify-between overflow-hidden rounded-[22px] border border-slate-200/90 bg-white shadow-xs transition hover:shadow-md">
      <div>
        <div className="relative flex h-[200px] w-full items-center justify-center overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#31102f]">
          <div className="relative flex size-24 items-center justify-center rounded-full border border-white/10 bg-white/5">
            <div className="flex size-14 items-center justify-center rounded-full border border-orange-400/30 bg-orange-500/10">
              <Sparkles className="size-6 text-[#ff6437]" />
            </div>
          </div>

          {tierLabel && (
            <span className="absolute top-3 start-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-3 py-1 text-[10px] font-black text-white shadow-sm">
              <Crown className="size-3" />
              <span>{tierLabel}</span>
            </span>
          )}

          <span className="absolute end-3 bottom-3 rounded-full bg-black/55 px-3 py-1 text-[10.5px] font-bold text-white backdrop-blur-xs">
            {uT.adCardBadge}
          </span>
        </div>

        <div className="p-5 text-start">
          <h3 className="text-base font-black text-[#0f1d40] sm:text-lg">
            {uT.adCardTitle}
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
            {uT.adCardSub}
          </p>

          <ul className="mt-4 space-y-1.5 text-xs font-semibold text-slate-500">
            <li className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-[#ff6437]" />
              <span>Targeted audience</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-[#ff6437]" />
              <span>Direct contact</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-[#ff6437]" />
              <span>Transparent metrics</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-100 px-5 py-3.5 text-start">
        <Link
          href="/#boost-packages-section"
          className="inline-flex h-10 items-center justify-center rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-5 text-xs font-extrabold text-white shadow-sm transition hover:scale-105 hover:opacity-95"
        >
          {uT.adCardBtn}
        </Link>
      </div>
    </div>
  )
}

export default function OpportunitiesPage() {
  const { t: dict, locale, dir } = useTranslation()
  const isAr = locale === 'ar'
  const t = dict.opportunitiesPage as Record<string, any>
  const activeCurrency = '$'

  const baseUi = OPPS_UI_FALLBACK[locale] || OPPS_UI_FALLBACK.ar
  const customUi = t.ui || {}
  const uT = {
    ...baseUi,
    ...customUi,
    chips: { ...baseUi.chips, ...(customUi.chips || {}) },
  }

  const localizedTypes = useMemo(
    () => getLocalizedUnitTypes(dict, locale),
    [dict, locale]
  )

  const [rawDbRows, setRawDbRows] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState<number>(1)

  const [viewMode, setViewMode] = useState<'list' | 'map2d' | 'map3d'>('list')
  const [openPanel, setOpenPanel] = useState<
    null | 'type' | 'price' | 'rooms' | 'area' | 'commute' | 'more'
  >(null)
  const [savedSearchToast, setSavedSearchToast] = useState(false)

  const [negotiable, setNegotiable] = useState(false)
  const [sortIdx, setSortIdx] = useState<number>(1)
  const [strictDateSort, setStrictDateSort] = useState<boolean>(false)
  const [search, setSearch] = useState('')
  const [areaQuery, setAreaQuery] = useState('')
  const [maxCash, setMaxCash] = useState('')
  const [maxInstallment, setMaxInstallment] = useState('')
  const [maxContractPrice, setMaxContractPrice] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedFeature, setSelectedFeature] = useState<string>('')
  const [activeCategoryLabel, setActiveCategoryLabel] = useState<string>('')
  const [deliveryStatusIdx, setDeliveryStatusIdx] = useState<number>(0)
  const [deliveryYearIdx, setDeliveryYearIdx] = useState<number>(0)
  const [contractYearIdx, setContractYearIdx] = useState<number>(0)
  const [minRoomsIdx, setMinRoomsIdx] = useState<number>(0)

  const [sivrceFilters, setSivrceFilters] = useState<SearchFiltersState>({
    q: '',
    propertyType: '',
    location: '',
    locationDisplay: '',
    minPrice: '',
    maxPrice: '',
    rooms: '',
    minArea: '',
    maxArea: '',
    commuteDest: '',
    commuteMode: 'car',
    commuteMinutes: '20',
    vipTier: '',
    bathrooms: '',
    minFloor: '',
    maxFloor: '',
    condition: '',
    buildingStatus: '',
    buildingSeries: '',
    floorType: '',
    heating: '',
    quickTag: '',
  })

  const chipsScrollRef = useRef<HTMLDivElement>(null)
  const gridTopRef = useRef<HTMLDivElement>(null)

  const updateSivrceFilter = <K extends keyof SearchFiltersState>(
    key: K,
    val: SearchFiltersState[K]
  ) => {
    setSivrceFilters((prev) => ({ ...prev, [key]: val }))
  }

  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) setFavoriteIds(parsed.map(String))
      }
    } catch {}

    try {
      const urlParams = new URLSearchParams(window.location.search)
      const qParam = urlParams.get('q')
      const areaParam = urlParams.get('area')
      const typeParam = urlParams.get('type')
      const featureParam = urlParams.get('feature')
      const labelParam = urlParams.get('label')
      const roomsParam = urlParams.get('rooms')
      const minPriceParam = urlParams.get('minPrice')
      const maxPriceParam = urlParams.get('maxPrice')
      const minAreaParam = urlParams.get('minArea')
      const maxAreaParam = urlParams.get('maxArea')
      const viewParam = urlParams.get('view')
      const delivParam = urlParams.get('delivery')
      const tierParam = urlParams.get('tier')
      const sortParam = urlParams.get('sort')
      const pageParam = Number(urlParams.get('page'))

      if (pageParam && pageParam > 0) {
        setCurrentPage(pageParam)
      }
      if (labelParam) {
        setActiveCategoryLabel(labelParam)
      }
      if (qParam) {
        setSearch(qParam)
        updateSivrceFilter('q', qParam)
      }
      if (areaParam) {
        setAreaQuery(areaParam)
        updateSivrceFilter('location', areaParam)
        updateSivrceFilter(
          'locationDisplay',
          getLocalizedGeorgiaAreaName(areaParam, locale)
        )
      }
      if (typeParam) {
        updateSivrceFilter('propertyType', typeParam)
        updateSivrceFilter('quickTag', typeParam)
      }
      if (tierParam) {
        const cleanTier = tierParam.trim().toLowerCase()
        if (
          cleanTier === 'super_vip' ||
          cleanTier === 'diamond' ||
          cleanTier === 'super'
        ) {
          updateSivrceFilter('vipTier', 'SUPER VIP')
        } else if (
          cleanTier === 'vip_plus' ||
          cleanTier === '+vip' ||
          cleanTier === 'vip'
        ) {
          updateSivrceFilter('vipTier', '+VIP')
        }
      }
      if (sortParam === 'newest' || sortParam === 'recent' || sortParam === 'date') {
        setSortIdx(1)
        setStrictDateSort(true)
        if (!labelParam) {
          setActiveCategoryLabel(uT.newlyAddedHeading)
        }
      }
      if (featureParam) {
        setSelectedFeature(featureParam)
        const fLower = featureParam.toLowerCase()
        if (fLower.includes('sea')) updateSivrceFilter('quickTag', 'sea')
        else if (fLower.includes('pool')) updateSivrceFilter('quickTag', 'pool')
        else if (fLower.includes('jacuzzi'))
          updateSivrceFilter('quickTag', 'jacuzzi')
        else if (fLower.includes('ski')) updateSivrceFilter('quickTag', 'ski')
        else if (fLower.includes('panoramic'))
          updateSivrceFilter('quickTag', 'luxury')
      }
      if (roomsParam) {
        updateSivrceFilter('rooms', roomsParam)
      }
      if (minPriceParam) {
        updateSivrceFilter('minPrice', minPriceParam)
      }
      if (maxPriceParam) {
        updateSivrceFilter('maxPrice', maxPriceParam)
        setMaxCash(maxPriceParam)
      }
      if (minAreaParam) {
        updateSivrceFilter('minArea', minAreaParam)
      }
      if (maxAreaParam) {
        updateSivrceFilter('maxArea', maxAreaParam)
      }
      if (delivParam === 'Under Construction') {
        setDeliveryStatusIdx(2)
        updateSivrceFilter('quickTag', 'under_const')
      } else if (delivParam === 'Ready to Move') {
        setDeliveryStatusIdx(1)
        updateSivrceFilter('quickTag', 'ready')
      }
      if (viewParam === 'map3d') setViewMode('map3d')
      else if (viewParam === 'map2d') setViewMode('map2d')
    } catch {}
  }, [locale])

  const handleToggleFavorite = (unitId: string) => {
    setFavoriteIds((prev) => {
      const idStr = String(unitId)
      const next = prev.includes(idStr)
        ? prev.filter((x) => x !== idStr)
        : [...prev, idStr]
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next))
        window.dispatchEvent(new Event('favorites-updated'))
      } catch {}
      return next
    })
  }

 useEffect(() => {
    async function loadApprovedProperties() {
      setLoading(true)
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        const [primaryRes, acceptedOffersRes] = await Promise.all([
          supabase
            .from('sell_requests')
            .select(PUBLIC_SAFE_UNIT_COLUMNS)
            .in('status', ['active', 'approved', 'published', 'offer_received'])
            .order('is_featured', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(5000),
          supabase
            .from('property_offers')
            .select('property_id')
            .eq('status', 'accepted'),
        ])

        // جمع أرقام الوحدات التي اتفق عليها البائع والمشتري بالفعل
        const lockedUnitIds = new Set(
          (acceptedOffersRes.data || []).map((o: any) => String(o.property_id))
        )

        let rows: any[] | null = primaryRes.data as any[] | null
        let queryError = primaryRes.error

        if (queryError) {
          const fallbackRes = await supabase
            .from('sell_requests')
            .select(CORE_SAFE_UNIT_COLUMNS)
            .in('status', ['active', 'approved', 'published', 'offer_received'])
            .order('created_at', { ascending: false })
            .limit(5000)
          rows = fallbackRes.data as any[] | null
          queryError = fallbackRes.error
        }

        if (!queryError && rows) {
          setRawDbRows(
            rows.filter((row: any) => {
              const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(
                String(row?.id || '')
              )
              const cleanSt = String(row?.status || '').toLowerCase()
              return (
                isValidUuid &&
                cleanSt !== 'transferring' &&
                cleanSt !== 'sold' &&
                !lockedUnitIds.has(String(row.id)) &&
                !isNonGeorgianLegacyArea(row.area)
              )
            })
          )
        }
      } catch (err) {
        console.error('Failed to load approved properties:', err)
      } finally {
        setLoading(false)
      }
    }

    loadApprovedProperties()
  }, [])

  const dbProperties: Array<
    MappedProperty & { rawFeatures: string[]; rawFinishing: string }
  > = useMemo(() => {
    return rawDbRows.map((row) => {
      const mapped = mapDbRowToProperty(row, locale, dict.opportunitiesPage)
      const metaFeatures = row?.documents?.__unit_meta?.features
      const rowFeatures = Array.isArray(row?.features)
        ? row.features
        : Array.isArray(metaFeatures)
          ? metaFeatures
          : []
      const rawFinishing = String(
        row?.finishing || row?.documents?.__unit_meta?.finishing || ''
      )
      return {
        ...mapped,
        rawFeatures: rowFeatures.map((f: any) => String(f || '')),
        rawFinishing,
      }
    })
  }, [rawDbRows, locale, dict.opportunitiesPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [
    search,
    areaQuery,
    negotiable,
    selectedTypes,
    selectedFeature,
    deliveryStatusIdx,
    deliveryYearIdx,
    contractYearIdx,
    minRoomsIdx,
    maxCash,
    maxInstallment,
    maxContractPrice,
    sortIdx,
    sivrceFilters,
  ])

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type)
        ? prev.filter((item) => item !== type)
        : [...prev, type]
    )
  }

  const clearAll = () => {
    setSearch('')
    setAreaQuery('')
    setMaxCash('')
    setMaxInstallment('')
    setMaxContractPrice('')
    setSelectedTypes([])
    setSelectedFeature('')
    setActiveCategoryLabel('')
    setDeliveryStatusIdx(0)
    setDeliveryYearIdx(0)
    setContractYearIdx(0)
    setMinRoomsIdx(0)
    setNegotiable(false)
    setStrictDateSort(false)
    setSivrceFilters({
      q: '',
      propertyType: '',
      location: '',
      locationDisplay: '',
      minPrice: '',
      maxPrice: '',
      rooms: '',
      minArea: '',
      maxArea: '',
      commuteDest: '',
      commuteMode: 'car',
      commuteMinutes: '20',
      vipTier: '',
      bathrooms: '',
      minFloor: '',
      maxFloor: '',
      condition: '',
      buildingStatus: '',
      buildingSeries: '',
      floorType: '',
      heating: '',
      quickTag: '',
    })
    setOpenPanel(null)
    setCurrentPage(1)
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/opportunities')
    }
  }

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (negotiable) count++
    if (areaQuery.trim()) count++
    if (selectedFeature.trim()) count++
    if (maxCash.trim()) count++
    if (maxInstallment.trim()) count++
    if (maxContractPrice.trim()) count++
    if (selectedTypes.length > 0) count += selectedTypes.length
    if (deliveryStatusIdx !== 0) count++
    if (deliveryYearIdx !== 0) count++
    if (contractYearIdx !== 0) count++
    if (minRoomsIdx !== 0) count++
    if (sivrceFilters.propertyType) count++
    if (sivrceFilters.rooms) count++
    if (sivrceFilters.minPrice) count++
    if (sivrceFilters.maxPrice) count++
    if (sivrceFilters.minArea) count++
    if (sivrceFilters.maxArea) count++
    if (sivrceFilters.vipTier) count++
    if (sivrceFilters.condition) count++
    if (sivrceFilters.bathrooms) count++
    if (sivrceFilters.minFloor) count++
    if (sivrceFilters.maxFloor) count++
    return count
  }, [
    negotiable,
    areaQuery,
    selectedFeature,
    maxCash,
    maxInstallment,
    maxContractPrice,
    selectedTypes,
    deliveryStatusIdx,
    deliveryYearIdx,
    contractYearIdx,
    minRoomsIdx,
    sivrceFilters,
  ])

  const visibleProperties = useMemo(() => {
    const cleanMaxCash = Number(
      toEnglishDigits(maxCash || sivrceFilters.maxPrice).replace(/,/g, '')
    )
    const cleanMinCash = Number(
      toEnglishDigits(sivrceFilters.minPrice).replace(/,/g, '')
    )
    const cleanMaxInst = Number(
      toEnglishDigits(maxInstallment).replace(/,/g, '')
    )
    const cleanMaxContract = Number(
      toEnglishDigits(maxContractPrice).replace(/,/g, '')
    )
    const cleanMinArea = Number(toEnglishDigits(sivrceFilters.minArea))
    const cleanMaxArea = Number(toEnglishDigits(sivrceFilters.maxArea))
    const cleanMinFloor = Number(toEnglishDigits(sivrceFilters.minFloor))
    const cleanMaxFloor = Number(toEnglishDigits(sivrceFilters.maxFloor))

    const filtered = dbProperties.filter((item) => {
      const featuresJoined = (item.rawFeatures || []).join(' ').toLowerCase()
      const haystack =
        `${item.project} ${item.developer} ${item.area} ${item.rawArea} ${item.exactStreet || ''} ${item.code} ${item.type} ${featuresJoined}`.toLowerCase()

      if (search.trim() && !haystack.includes(search.trim().toLowerCase())) {
        return false
      }
      if (
        areaQuery.trim() &&
        !`${item.area} ${item.rawArea} ${item.developer} ${item.project}`
          .toLowerCase()
          .includes(areaQuery.trim().toLowerCase())
      ) {
        return false
      }
      if (negotiable && !item.negotiable) return false

      // فلترة دقيقة حسب باقة الترويج (SUPER VIP أو +VIP) مثل الموقع الجورجي في الصور
      if (sivrceFilters.vipTier === 'SUPER VIP') {
        const itemTier =
          item.boostTier || (item.featured ? 'super_vip' : null)
        if (!item.featured || itemTier !== 'super_vip') return false
      } else if (sivrceFilters.vipTier === '+VIP') {
        const itemTier =
          item.boostTier || (item.featured ? 'super_vip' : null)
        if (!item.featured || itemTier !== 'vip_plus') return false
      }

      if (selectedFeature.trim()) {
        const targetFeat = selectedFeature.trim().toLowerCase()
        const hasFeatureMatch =
          featuresJoined.includes(targetFeat) ||
          haystack.includes(targetFeat) ||
          (targetFeat === 'sea view' &&
            (featuresJoined.includes('بحر') ||
              featuresJoined.includes('sea') ||
              item.rawArea.toLowerCase().includes('batumi'))) ||
          (targetFeat === 'pool' &&
            (featuresJoined.includes('سباحة') ||
              featuresJoined.includes('مسبح') ||
              featuresJoined.includes('pool'))) ||
          (targetFeat === 'jacuzzi' &&
            (featuresJoined.includes('جاكوزي') ||
              featuresJoined.includes('jacuzzi'))) ||
          (targetFeat === 'ski access' &&
            (featuresJoined.includes('تزلج') ||
              featuresJoined.includes('ski') ||
              item.rawArea.toLowerCase().includes('gudauri') ||
              item.rawArea.toLowerCase().includes('bakuriani')))

        if (!hasFeatureMatch) return false
      }

      if (
        selectedTypes.length > 0 &&
        !selectedTypes.some(
          (st) =>
            item.type.toLowerCase().includes(st.toLowerCase()) ||
            st.toLowerCase().includes(item.type.toLowerCase())
        )
      ) {
        return false
      }

      if (sivrceFilters.propertyType) {
        const pt = sivrceFilters.propertyType.toLowerCase()
        const itemTp = item.type.toLowerCase()
        if (
          pt === 'apartment' &&
          !itemTp.includes('apart') &&
          !item.type.includes('شقة') &&
          !item.type.includes('استوديو') &&
          !item.type.includes('ბინა') &&
          !item.type.includes('квартир')
        ) {
          return false
        } else if (pt === 'private house') {
          if (
            !itemTp.includes('house') &&
            !itemTp.includes('villa') &&
            !item.type.includes('منزل') &&
            !item.type.includes('فيلا') &&
            !item.type.includes('تاون')
          ) {
            return false
          }
        } else if (pt === 'cottage') {
          if (
            !itemTp.includes('cottage') &&
            !itemTp.includes('chalet') &&
            !item.type.includes('شاليه') &&
            !item.type.includes('كوخ')
          ) {
            return false
          }
        } else if (pt === 'hotel') {
          if (!itemTp.includes('hotel') && !item.type.includes('فندق')) {
            return false
          }
        } else if (pt === 'commercial') {
          if (
            !itemTp.includes('commercial') &&
            !itemTp.includes('office') &&
            !itemTp.includes('shop') &&
            !item.type.includes('تجاري') &&
            !item.type.includes('مكتب') &&
            !item.type.includes('محل')
          ) {
            return false
          }
        } else if (pt === 'land') {
          if (!itemTp.includes('land') && !item.type.includes('أرض')) {
            return false
          }
        }
      }

      if (deliveryStatusIdx === 1 && !item.isReady) return false
      if (deliveryStatusIdx === 2 && item.isReady) return false

      if (deliveryYearIdx > 0) {
        const yrStr = t.filters.deliveryYears[deliveryYearIdx] || ''
        const targetYear = Number(yrStr.replace(/[^0-9]/g, ''))
        const itemYr = Number(String(item.delivery).replace(/[^0-9]/g, ''))
        if (targetYear && itemYr > 2000 && itemYr > targetYear) return false
      }

      if (contractYearIdx > 0) {
        const yrStr = t.filters.contractYears[contractYearIdx] || ''
        const targetConYear = Number(yrStr.replace(/[^0-9]/g, ''))
        if (targetConYear && item.contractYear > targetConYear) return false
      }

      if (sivrceFilters.rooms) {
        const targetRm = Number(sivrceFilters.rooms)
        if (targetRm === 5 ? item.rooms < 5 : item.rooms !== targetRm) {
          return false
        }
      } else if (minRoomsIdx > 0) {
        const rmStr = t.filters.roomOptions[minRoomsIdx] || ''
        const targetRooms = Number(rmStr.replace('+', ''))
        if (item.rooms < targetRooms) return false
      }

      if (sivrceFilters.bathrooms) {
        const minBaths = Number(sivrceFilters.bathrooms) || 0
        if (minBaths > 0 && item.baths < minBaths) return false
      }

      if (cleanMinFloor > 0 && (item.floor ?? 0) < cleanMinFloor) return false
      if (cleanMaxFloor > 0 && (item.floor ?? 0) > cleanMaxFloor) return false

      if (sivrceFilters.condition) {
        const condLower = sivrceFilters.condition.toLowerCase()
        const unitCondLower = String(item.rawFinishing || '').toLowerCase()
        if (
          !unitCondLower.includes(condLower) &&
          !condLower.includes(unitCondLower)
        ) {
          return false
        }
      }

      const itemSizeNum = Number(String(item.size).replace(/[^0-9.]/g, '')) || 0
      if (cleanMinArea > 0 && itemSizeNum < cleanMinArea) return false
      if (cleanMaxArea > 0 && itemSizeNum > cleanMaxArea) return false

      if (cleanMinCash > 0 && item.cashNum < cleanMinCash) return false
      if (cleanMaxCash > 0 && item.cashNum > cleanMaxCash) return false
      if (
        cleanMaxInst > 0 &&
        item.monthlyInstallmentNum > cleanMaxInst &&
        item.installmentNum > cleanMaxInst
      ) {
        return false
      }
      if (cleanMaxContract > 0 && item.contractPriceNum > cleanMaxContract) {
        return false
      }

      return true
    })

    return [...filtered].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0

      // إذا اختار المستخدم "أضيفت حديثاً" أو الترتيب حسب التاريخ، نرتب تنازلياً من الأحدث للأقدم
      if (strictDateSort || sortIdx === 1) {
        if (!strictDateSort && a.featured !== b.featured) {
          return a.featured ? -1 : 1
        }
        return dateB - dateA
      }
      if (sortIdx === 3) return a.cashNum - b.cashNum
      if (sortIdx === 4)
        return a.monthlyInstallmentNum - b.monthlyInstallmentNum
      if (sortIdx === 5) return b.gainNum - a.gainNum
      if (sortIdx === 6) return a.isReady === b.isReady ? 0 : a.isReady ? -1 : 1
      if (sortIdx === 7) {
        if (a.isReady === b.isReady) return a.cashNum - b.cashNum
        return a.isReady ? -1 : 1
      }
      if (a.featured !== b.featured) {
        return a.featured ? -1 : 1
      }
      if (sortIdx === 2 || sortIdx === 0) {
        return b.gainNum - a.gainNum
      }
      return dateB - dateA
    })
  }, [
    dbProperties,
    search,
    areaQuery,
    negotiable,
    selectedTypes,
    selectedFeature,
    deliveryStatusIdx,
    deliveryYearIdx,
    contractYearIdx,
    minRoomsIdx,
    maxCash,
    maxInstallment,
    maxContractPrice,
    sortIdx,
    strictDateSort,
    sivrceFilters,
    t,
  ])

  const availableUnitsCount = visibleProperties.length

  const totalMarketSum = useMemo(() => {
    return visibleProperties.reduce(
      (sum, item) =>
        sum + (item.marketPriceNum || item.contractPriceNum || item.cashNum),
      0
    )
  }, [visibleProperties])

  const formattedMarketTotal = useMemo(() => {
    if (totalMarketSum >= 1_000_000_000) {
      return {
        value: (totalMarketSum / 1_000_000_000).toFixed(1),
        unit: `${t.stats.billion} ${activeCurrency}`,
      }
    }
    if (totalMarketSum >= 1_000_000) {
      return {
        value: (totalMarketSum / 1_000_000).toFixed(1),
        unit: `${t.stats.million} ${activeCurrency}`,
      }
    }
    return {
      value: totalMarketSum.toLocaleString('en-US'),
      unit: activeCurrency,
    }
  }, [totalMarketSum, activeCurrency, t])

  const totalPages = Math.max(1, Math.ceil(visibleProperties.length / PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE
  const endIndex = Math.min(
    startIndex + PAGE_SIZE,
    visibleProperties.length
  )

  const displayedProperties = useMemo(() => {
    return visibleProperties.slice(startIndex, endIndex)
  }, [visibleProperties, startIndex, endIndex])

  const handleGoToPage = (pageNumber: number) => {
    const next = Math.max(1, Math.min(totalPages, pageNumber))
    setCurrentPage(next)
    gridTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const pageNumbers = useMemo(() => {
    const pages: number[] = []
    const maxButtons = 5
    let start = Math.max(1, safeCurrentPage - 2)
    let end = Math.min(totalPages, start + maxButtons - 1)
    if (end - start + 1 < maxButtons) {
      start = Math.max(1, end - maxButtons + 1)
    }
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    return pages
  }, [safeCurrentPage, totalPages])

  const quickCategoryChips = [
    {
      id: '',
      label: uT.chips.all,
      icon: Grid2X2,
      feature: '',
      type: '',
    },
    {
      id: 'Apartment',
      label: uT.chips.apartments,
      icon: Building2,
      feature: '',
      type: 'Apartment',
    },
    {
      id: 'Private house',
      label: uT.chips.houses,
      icon: Home,
      feature: '',
      type: 'Private house',
    },
    {
      id: 'Cottage',
      label: uT.chips.cottages,
      icon: Trees,
      feature: '',
      type: 'Cottage',
    },
    {
      id: 'luxury',
      label: uT.chips.luxury,
      icon: Gem,
      feature: 'Panoramic view',
      type: '',
    },
    {
      id: 'ready',
      label: uT.chips.ready,
      icon: Calendar,
      feature: '',
      type: '',
    },
    {
      id: 'under_const',
      label: uT.chips.underConst,
      icon: Building,
      feature: '',
      type: '',
    },
    {
      id: 'sea',
      label: uT.chips.sea,
      icon: Waves,
      feature: 'Sea view',
      type: '',
    },
    {
      id: 'pool',
      label: uT.chips.pool,
      icon: Sparkles,
      feature: 'Pool',
      type: '',
    },
    {
      id: 'jacuzzi',
      label: uT.chips.jacuzzi,
      icon: Bath,
      feature: 'Jacuzzi',
      type: '',
    },
    {
      id: 'ski',
      label: uT.chips.ski,
      icon: Mountain,
      feature: 'Ski access',
      type: '',
    },
    {
      id: 'Land',
      label: uT.chips.land,
      icon: MapPin,
      feature: '',
      type: 'Land',
    },
    {
      id: 'Commercial',
      label: uT.chips.commercial,
      icon: Store,
      feature: '',
      type: 'Commercial',
    },
    {
      id: 'Hotel',
      label: uT.chips.hotel,
      icon: Hotel,
      feature: '',
      type: 'Hotel',
    },
  ]

  const resolvedSearchHeading =
    activeCategoryLabel ||
    sivrceFilters.vipTier ||
    search.trim() ||
    selectedFeature ||
    (sivrceFilters.propertyType
      ? quickCategoryChips.find((c) => c.id === sivrceFilters.propertyType)
          ?.label || sivrceFilters.propertyType
      : '') ||
    (areaQuery ? getLocalizedGeorgiaAreaName(areaQuery, locale) : '')

  const typeMenuOptions = useMemo(() => {
    return [
      { id: '', label: uT.allTypesOption },
      ...PROPERTY_KINDS.map((k) => ({
        id: k.id,
        label: getOptionLabel(k, locale),
      })),
    ]
  }, [uT.allTypesOption, locale])

  const selectedTypeDisplay = useMemo(() => {
    if (sivrceFilters.propertyType) {
      const found = PROPERTY_KINDS.find(
        (k) => k.id === sivrceFilters.propertyType
      )
      if (found) return getOptionLabel(found, locale)
      return sivrceFilters.propertyType
    }
    return selectedTypes[0] || t.filters.unitTypeLabel
  }, [sivrceFilters.propertyType, selectedTypes, locale, t.filters.unitTypeLabel])

  if (viewMode === 'map2d' || viewMode === 'map3d') {
    return (
      <Search3DMapView
        properties={visibleProperties}
        is3DMode={viewMode === 'map3d'}
        setIs3DMode={(v) => setViewMode(v ? 'map3d' : 'map2d')}
        onBackToList={() => setViewMode('list')}
        searchQuery={search}
        setSearchQuery={setSearch}
        typeFilter={sivrceFilters.propertyType}
        setTypeFilter={(tp) => updateSivrceFilter('propertyType', tp)}
        onResetFilters={clearAll}
      />
    )
  }

  return (
    <main
      dir={dir}
      className="min-h-screen bg-[var(--brand-surface,#f5f6f8)] py-6 text-[var(--brand-navy,#0a1122)] sm:py-12"
    >
      <div className="layout-container">
        <div className="text-start">
          <h1 className="text-xl font-bold tracking-tight text-[var(--brand-navy,#0a1122)] sm:text-3xl md:text-[34px]">
            {resolvedSearchHeading
              ? `${uT.searchResultsPrefix} ${resolvedSearchHeading} (${availableUnitsCount})`
              : t.header.title}
          </h1>
          <p className="mt-1.5 flex items-center gap-1.5 text-xs leading-relaxed text-gray-500 sm:mt-2 sm:text-sm">
            <MapPin className="size-3.5 text-[#2563eb]" />
            <span>
              {areaQuery
                ? getLocalizedGeorgiaAreaName(areaQuery, locale)
                : t.header.subtitle}
            </span>
          </p>
        </div>

        <section className="mt-5 rounded-[22px] border border-slate-200/90 bg-white p-3 shadow-xs sm:p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex min-w-[230px] flex-1 items-center gap-2 rounded-full bg-slate-100/80 py-1 ps-3.5 pe-1.5">
              <Search className="size-4 shrink-0 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.filters.searchPlaceholder}
                className="h-8 w-full bg-transparent text-xs font-semibold text-[#0f1d40] placeholder:text-slate-400 focus:outline-none sm:text-[13px]"
              />
              <button
                type="button"
                className="inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-full bg-[#2563eb] px-4 text-xs font-bold text-white shadow-2xs transition hover:bg-blue-700"
              >
                <Search className="size-3" />
                <span>{uT.searchBtn}</span>
              </button>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setOpenPanel(openPanel === 'type' ? null : 'type')
                }
                className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-bold transition ${
                  sivrceFilters.propertyType || selectedTypes.length > 0
                    ? 'border-[#2563eb] bg-blue-50 text-[#2563eb]'
                    : 'border-slate-200 bg-slate-50/70 text-[#0f1d40] hover:bg-slate-100'
                }`}
              >
                <Layers className="size-3.5 text-slate-400" />
                <span>{selectedTypeDisplay}</span>
                <ChevronDown className="size-3 text-slate-400" />
              </button>

              {openPanel === 'type' && (
                <div className="absolute start-0 top-11 z-40 w-56 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl">
                  {typeMenuOptions.map((tp) => (
                    <button
                      key={tp.id || 'all'}
                      type="button"
                      onClick={() => {
                        updateSivrceFilter('propertyType', tp.id)
                        setActiveCategoryLabel(tp.id ? tp.label : '')
                        setOpenPanel(null)
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold ${
                        sivrceFilters.propertyType === tp.id
                          ? 'bg-blue-50 font-bold text-[#2563eb]'
                          : 'text-[#0f1d40] hover:bg-slate-50'
                      }`}
                    >
                      <span>{tp.label}</span>
                      {sivrceFilters.propertyType === tp.id && (
                        <Check className="size-3.5 text-[#2563eb]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <SivrceLocationModalPicker
              value={areaQuery}
              displayText={
                areaQuery ? getLocalizedGeorgiaAreaName(areaQuery, locale) : ''
              }
              showEverywhereOption={true}
              onSelectLocation={({ areaId, displayLabel }) => {
                setAreaQuery(areaId)
                updateSivrceFilter('location', areaId)
                updateSivrceFilter('locationDisplay', displayLabel)
              }}
              customTrigger={({ onClick, resolvedDisplay }) => (
                <button
                  type="button"
                  onClick={onClick}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-bold transition ${
                    areaQuery
                      ? 'border-[#2563eb] bg-blue-50 text-[#2563eb]'
                      : 'border-slate-200 bg-slate-50/70 text-[#0f1d40] hover:bg-slate-100'
                  }`}
                >
                  <MapPin className="size-3.5 text-slate-400" />
                  <span>{resolvedDisplay || uT.everywhereBtn}</span>
                </button>
              )}
            />

            <button
              type="button"
              onClick={() =>
                setOpenPanel(openPanel === 'price' ? null : 'price')
              }
              className={`inline-flex h-9 items-center gap-1 rounded-full border px-3.5 text-xs font-bold transition ${
                openPanel === 'price' ||
                sivrceFilters.minPrice ||
                sivrceFilters.maxPrice ||
                maxCash ||
                maxInstallment
                  ? 'border-[#2563eb] bg-blue-50 text-[#2563eb]'
                  : 'border-slate-200 bg-slate-50/70 text-[#0f1d40] hover:bg-slate-100'
              }`}
            >
              <span>{uT.cashAndInstallmentsBtn}</span>
              <ChevronDown className="size-3" />
            </button>

            <button
              type="button"
              onClick={() =>
                setOpenPanel(openPanel === 'rooms' ? null : 'rooms')
              }
              className={`inline-flex h-9 items-center gap-1 rounded-full border px-3.5 text-xs font-bold transition ${
                openPanel === 'rooms' || sivrceFilters.rooms || minRoomsIdx > 0
                  ? 'border-[#2563eb] bg-blue-50 text-[#2563eb]'
                  : 'border-slate-200 bg-slate-50/70 text-[#0f1d40] hover:bg-slate-100'
              }`}
            >
              <span>
                {sivrceFilters.rooms
                  ? `${sivrceFilters.rooms} ${t.card.roomsWord}`
                  : uT.roomsBtn}
              </span>
              <ChevronDown className="size-3" />
            </button>

            <button
              type="button"
              onClick={() => setOpenPanel(openPanel === 'area' ? null : 'area')}
              className={`inline-flex h-9 items-center gap-1 rounded-full border px-3.5 text-xs font-bold transition ${
                openPanel === 'area' ||
                sivrceFilters.minArea ||
                sivrceFilters.maxArea
                  ? 'border-[#2563eb] bg-blue-50 text-[#2563eb]'
                  : 'border-slate-200 bg-slate-50/70 text-[#0f1d40] hover:bg-slate-100'
              }`}
            >
              <span>{uT.areaBtn}</span>
              <ChevronDown className="size-3" />
            </button>

            <button
              type="button"
              onClick={() =>
                setOpenPanel(openPanel === 'commute' ? null : 'commute')
              }
              className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-bold transition ${
                openPanel === 'commute' || sivrceFilters.commuteDest
                  ? 'border-[#2563eb] bg-blue-50 text-[#2563eb]'
                  : 'border-slate-200 bg-slate-50/70 text-[#0f1d40] hover:bg-slate-100'
              }`}
            >
              <Clock3 className="size-3.5" />
              <span>{uT.commuteBtn}</span>
            </button>

            <button
              type="button"
              onClick={() => setOpenPanel(openPanel === 'more' ? null : 'more')}
              className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-bold transition ${
                openPanel === 'more' || activeFilterCount > 0
                  ? 'border-[#2563eb] bg-blue-50 text-[#2563eb]'
                  : 'border-slate-200 bg-slate-50/70 text-[#0f1d40] hover:bg-slate-100'
              }`}
            >
              <SlidersHorizontal className="size-3.5" />
              <span>{t.filters.advancedFilterBtn}</span>
              {activeFilterCount > 0 && (
                <span className="flex size-4.5 items-center justify-center rounded-full bg-[#2563eb] text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setNegotiable(!negotiable)}
              className={`inline-flex h-9 items-center gap-1 rounded-full border px-3.5 text-xs font-bold transition ${
                negotiable
                  ? 'border-[#d97706] bg-amber-50/60 text-[#b45309]'
                  : 'border-slate-200 bg-slate-50/70 text-[#0f1d40] hover:bg-slate-100'
              }`}
            >
              <span>{t.filters.negotiableBtn}</span>
              <ArrowDown className="size-3 text-[#d97706]" />
            </button>

            <button
              type="button"
              onClick={clearAll}
              className="flex size-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-[#0f1d40]"
              title={t.filters.clearAllBtn}
            >
              <RotateCcw className="size-4" />
            </button>
          </div>

          {openPanel === 'price' && (
            <PriceFilterPanel
              filters={sivrceFilters}
              updateFilter={updateSivrceFilter}
              maxCash={maxCash}
              setMaxCash={setMaxCash}
              maxInstallment={maxInstallment}
              setMaxInstallment={setMaxInstallment}
              maxContractPrice={maxContractPrice}
              setMaxContractPrice={setMaxContractPrice}
              tFilters={t.filters}
              isAr={isAr}
            />
          )}
          {openPanel === 'rooms' && (
            <RoomsFilterPanel
              filters={sivrceFilters}
              updateFilter={updateSivrceFilter}
              setMinRoomsIdx={setMinRoomsIdx}
            />
          )}
          {openPanel === 'area' && (
            <AreaFilterPanel
              filters={sivrceFilters}
              updateFilter={updateSivrceFilter}
              isAr={isAr}
            />
          )}
          {openPanel === 'commute' && (
            <CommuteFilterPanel
              filters={sivrceFilters}
              updateFilter={updateSivrceFilter}
              onClose={() => setOpenPanel(null)}
              isAr={isAr}
            />
          )}
          {openPanel === 'more' && (
            <MoreFiltersMegaPanel
              filters={sivrceFilters}
              updateFilter={updateSivrceFilter}
              selectedTypes={selectedTypes}
              toggleType={toggleType}
              localizedTypes={localizedTypes}
              deliveryStatusIdx={deliveryStatusIdx}
              setDeliveryStatusIdx={setDeliveryStatusIdx}
              deliveryYearIdx={deliveryYearIdx}
              setDeliveryYearIdx={setDeliveryYearIdx}
              contractYearIdx={contractYearIdx}
              setContractYearIdx={setContractYearIdx}
              tFilters={t.filters}
              onClearAll={clearAll}
              onClose={() => setOpenPanel(null)}
              isAr={isAr}
            />
          )}
        </section>

        <div className="relative mt-3 flex items-center">
          <div
            ref={chipsScrollRef}
            className="flex items-center gap-2 overflow-x-auto py-1.5 pe-10 no-scrollbar"
          >
            {/* أزرار سريعة لـ SUPER VIP و +VIP بجانب الفئات */}
            <button
              type="button"
              onClick={() =>
                updateSivrceFilter(
                  'vipTier',
                  sivrceFilters.vipTier === 'SUPER VIP' ? '' : 'SUPER VIP'
                )
              }
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-extrabold transition ${
                sivrceFilters.vipTier === 'SUPER VIP'
                  ? 'border-[#ff6437] bg-gradient-to-r from-[#ff6437] to-[#ff4f69] text-white shadow-2xs'
                  : 'border-orange-200 bg-orange-50/70 text-[#ff6437] hover:bg-orange-100/70'
              }`}
            >
              <Crown className="size-3.5" />
              <span>SUPER VIP</span>
            </button>

            <button
              type="button"
              onClick={() =>
                updateSivrceFilter(
                  'vipTier',
                  sivrceFilters.vipTier === '+VIP' ? '' : '+VIP'
                )
              }
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-extrabold transition ${
                sivrceFilters.vipTier === '+VIP'
                  ? 'border-[#4f46e5] bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white shadow-2xs'
                  : 'border-indigo-200 bg-indigo-50/70 text-[#4f46e5] hover:bg-indigo-100/70'
              }`}
            >
              <Flame className="size-3.5" />
              <span>+VIP</span>
            </button>

            {quickCategoryChips.map((chip) => {
              const Icon = chip.icon
              const active = sivrceFilters.quickTag === chip.id
              return (
                <button
                  key={chip.id || 'all-chips'}
                  type="button"
                  onClick={() => {
                    updateSivrceFilter('quickTag', chip.id)
                    setActiveCategoryLabel(chip.id ? chip.label : '')
                    setSelectedFeature(chip.feature || '')
                    updateSivrceFilter('propertyType', chip.type || '')
                    if (chip.id === 'ready') {
                      setDeliveryStatusIdx(1)
                    } else if (chip.id === 'under_const') {
                      setDeliveryStatusIdx(2)
                    } else {
                      setDeliveryStatusIdx(0)
                    }
                  }}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                    active
                      ? 'border-[#0f1d40] bg-[#0f1d40] font-bold text-white shadow-2xs'
                      : 'border-slate-200/80 bg-white text-slate-600 hover:border-slate-300 hover:text-[#0f1d40]'
                  }`}
                >
                  <Icon className="size-3.5" />
                  <span>{chip.label}</span>
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() =>
              chipsScrollRef.current?.scrollBy({
                left: dir === 'rtl' ? -240 : 240,
                behavior: 'smooth',
              })
            }
            className="absolute end-0 flex size-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md hover:bg-slate-50"
          >
            {dir === 'rtl' ? (
              <ChevronLeft className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </button>
        </div>

        {/* شريط عدد النتائج والشارات النشطة مثل الصور (SUPER VIP × / +VIP ×) */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="text-sm font-bold text-[#0f1d40]">
              {availableUnitsCount.toLocaleString('en-US')}{' '}
              {t.filters.availableUnitCountWord}
            </strong>

            {sivrceFilters.vipTier && (
              <button
                type="button"
                onClick={() => updateSivrceFilter('vipTier', '')}
                className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-extrabold text-[#2563eb] transition hover:bg-blue-100"
              >
                <span>{sivrceFilters.vipTier}</span>
                <X className="size-3" />
              </button>
            )}

            {strictDateSort && (
              <button
                type="button"
                onClick={() => {
                  setStrictDateSort(false)
                  setActiveCategoryLabel('')
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-[#eaf8f2] px-3 py-1 text-xs font-extrabold text-[#007a5a]"
              >
                <span>{uT.newlyAddedHeading}</span>
                <X className="size-3" />
              </button>
            )}

            {negotiable && (
              <button
                type="button"
                onClick={() => setNegotiable(false)}
                className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-primary-light,#eaf8f2)] px-3 py-1 text-[11px] font-bold text-[var(--brand-primary,#007a5a)] sm:text-xs"
              >
                <span>{t.filters.negotiableBtn}</span>
                <X className="size-3" />
              </button>
            )}

            {selectedFeature && (
              <button
                type="button"
                onClick={() => {
                  setSelectedFeature('')
                  setActiveCategoryLabel('')
                  updateSivrceFilter('quickTag', '')
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-[#2563eb] sm:text-xs"
              >
                <span>{activeCategoryLabel || selectedFeature}</span>
                <X className="size-3" />
              </button>
            )}

            {areaQuery.trim() && (
              <button
                type="button"
                onClick={() => setAreaQuery('')}
                className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-primary-light,#eaf8f2)] px-3 py-1 text-[11px] font-bold text-[var(--brand-primary,#007a5a)] sm:text-xs"
              >
                <span>
                  {t.filters.areaBadgePrefix}{' '}
                  {getLocalizedGeorgiaAreaName(areaQuery, locale)}
                </span>
                <X className="size-3" />
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setSavedSearchToast(true)
                setTimeout(() => setSavedSearchToast(false), 2500)
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-[#0f1d40] shadow-2xs transition hover:border-[#2563eb] hover:text-[#2563eb]"
            >
              <Bookmark className="size-3.5" />
              <span>
                {savedSearchToast ? uT.searchSavedToast : uT.saveSearchBtn}
              </span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <label
                htmlFor="sort-select"
                className="text-[11px] text-gray-400 sm:text-xs"
              >
                {t.filters.sortLabel}
              </label>
              <div className="relative">
                <select
                  id="sort-select"
                  value={sortIdx}
                  onChange={(e) => {
                    const nextIdx = Number(e.target.value)
                    setSortIdx(nextIdx)
                    setStrictDateSort(nextIdx === 1)
                  }}
                  className="h-9 min-w-[130px] appearance-none rounded-full border border-slate-200 bg-white pr-3.5 pl-8 text-xs font-bold text-[#0f1d40] shadow-2xs focus:border-[#007a5a] focus:outline-none sm:min-w-[155px]"
                >
                  {t.filters.sorts.map((item: string, idx: number) => (
                    <option key={item} value={idx}>
                      {item}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-gray-500" />
              </div>
            </div>

            <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="rounded-full bg-slate-100 px-3.5 py-1 text-xs font-bold text-[#0f1d40]"
              >
                {uT.listViewBtn}
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map2d')}
                className="inline-flex items-center gap-1 rounded-full px-3.5 py-1 text-xs font-bold text-slate-600 transition hover:bg-slate-50 hover:text-[#0f1d40]"
              >
                <span>{uT.map2dBtn}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setViewMode('map3d')}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-4 text-xs font-bold text-white shadow-[0_6px_18px_rgba(255,100,55,0.3)] transition hover:opacity-95"
            >
              <Layers className="size-3.5" />
              <span>{uT.map3dBtn}</span>
            </button>
          </div>
        </div>

        {/* بانر إعلانك هنا العلوي */}
        <div className="mt-5 flex flex-col items-center justify-between gap-4 rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-xs sm:flex-row sm:px-7">
          <div className="flex items-center gap-3.5 text-start">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#2563eb]">
              <Megaphone className="size-5" />
            </div>
            <div>
              <span className="text-[10.5px] font-bold text-[#2563eb]">
                ✦ {uT.promoTag}
              </span>
              <strong className="block text-sm font-black text-[#0f1d40] sm:text-base">
                {uT.promoHeading}
              </strong>
              <p className="text-xs text-slate-500">{uT.promoDesc}</p>
            </div>
          </div>

          <Link
            href="/#boost-packages-section"
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-6 text-xs font-bold text-white shadow-md transition hover:scale-105 hover:opacity-95"
          >
            {uT.promoCtaBtn}
          </Link>
        </div>

        <section ref={gridTopRef} className="mt-6 scroll-mt-24 sm:mt-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-start sm:mb-5">
            <div className="flex items-center gap-1.5">
              <Star className="size-4 fill-amber-400 text-amber-500" />
              <h2 className="text-base font-bold text-[var(--brand-navy,#0a1122)] sm:text-lg">
                {resolvedSearchHeading
                  ? `${resolvedSearchHeading} (${visibleProperties.length})`
                  : `${t.header.title} (${visibleProperties.length})`}
              </h2>
            </div>

            {visibleProperties.length > 0 && (
              <span className="text-xs font-semibold text-slate-500">
                {uT.showingRangePrefix} {startIndex + 1}–{endIndex}{' '}
                {uT.showingRangeOf} {visibleProperties.length}{' '}
                {t.stats.unitWord}
              </span>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="h-[340px] animate-pulse rounded-[16px] border border-gray-200 bg-white p-4 sm:h-[400px] sm:rounded-[22px]"
                >
                  <div className="h-[180px] w-full rounded-xl bg-gray-200" />
                  <div className="mt-4 h-4 w-2/3 rounded bg-gray-200" />
                  <div className="mt-2 h-3 w-1/2 rounded bg-gray-100" />
                  <div className="mt-6 h-6 w-1/3 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          ) : displayedProperties.length > 0 ? (
            <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
              {displayedProperties.map((property, idx) => (
                <React.Fragment key={property.id}>
                  <OpportunityCard
                    property={property}
                    liked={favoriteIds.includes(String(property.id))}
                    onToggleLike={handleToggleFavorite}
                  />
                  {/* إدراج كارت المساحة الإعلانية في الموضع الثاني تماماً مثل صور الموقع الجورجي */}
                  {idx === 0 && safeCurrentPage === 1 && (
                    <InlineAdSlotCard
                      uT={uT}
                      tierLabel={sivrceFilters.vipTier || undefined}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <InlineAdSlotCard
                uT={uT}
                tierLabel={sivrceFilters.vipTier || 'SUPER VIP'}
              />
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center sm:col-span-1 lg:col-span-2">
                <p className="text-sm font-bold text-gray-600">
                  {t.grid.emptyInCountryPrefix} {t.countries.GE}.
                </p>
                {(activeFilterCount > 0 || search) && (
                  <div className="mt-4 flex justify-center">
                    <button
                      type="button"
                      onClick={clearAll}
                      className="rounded-xl border border-gray-200 bg-white px-5 py-2 text-xs font-bold text-[var(--brand-navy,#0a1122)] hover:bg-gray-50"
                    >
                      {t.grid.resetFiltersBtn}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {totalPages > 1 && (
            <nav
              aria-label="Pagination"
              className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:mt-10"
            >
              <button
                type="button"
                disabled={safeCurrentPage <= 1}
                onClick={() => handleGoToPage(safeCurrentPage - 1)}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-[#0f1d40] shadow-2xs transition hover:border-[#2563eb] hover:text-[#2563eb] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {dir === 'rtl' ? (
                  <ChevronRight className="size-4" />
                ) : (
                  <ChevronLeft className="size-4" />
                )}
                <span>{uT.prevPageBtn}</span>
              </button>

              {pageNumbers.map((pageNum) => {
                const isActive = pageNum === safeCurrentPage
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => handleGoToPage(pageNum)}
                    className={`flex size-10 items-center justify-center rounded-xl border text-xs font-extrabold transition tabular-nums ${
                      isActive
                        ? 'border-[#007a5a] bg-[#007a5a] text-white shadow-sm'
                        : 'border-slate-200 bg-white text-[#0f1d40] hover:border-[#2563eb] hover:text-[#2563eb]'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}

              <button
                type="button"
                disabled={safeCurrentPage >= totalPages}
                onClick={() => handleGoToPage(safeCurrentPage + 1)}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-[#0f1d40] shadow-2xs transition hover:border-[#2563eb] hover:text-[#2563eb] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span>{uT.nextPageBtn}</span>
                {dir === 'rtl' ? (
                  <ChevronLeft className="size-4" />
                ) : (
                  <ChevronRight className="size-4" />
                )}
              </button>
            </nav>
          )}
        </section>

        <OpportunitiesBottomSections />
      </div>
    </main>
  )
}