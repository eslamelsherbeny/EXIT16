'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
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
  Gem,
  Grid2X2,
  Home,
  Hotel,
  KeyRound,
  Layers,
  Map,
  MapPin,
  Megaphone,
  Mountain,
  PawPrint,
  RotateCcw,
  Search,
  ShieldCheck,
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
import { getCurrencySymbol, useTranslation } from '@/lib/i18n'
import { isNonGeorgianLegacyArea } from '@/lib/smart-matcher'

const PAGE_SIZE = 48
const FAVORITES_STORAGE_KEY = 'darak_favorites'
const RECENTLY_VIEWED_STORAGE_KEY = 'aqar_recently_viewed'

// الأعمدة العامة الآمنة فقط (بدون name, phone, email لحماية خصوصية الملاك)
const PUBLIC_SAFE_UNIT_COLUMNS =
  'id, project_name, developer_name, area, unit_type, size, garden_size, rooms, bathrooms, floor_number, finishing, delivery_status, delivery_month, delivery_year, features, description, contract_price, paid_amount, market_price, installment_amount, installment_frequency, contract_month, contract_year, years_left, willing_to_discount, discount_amount, images, status, is_featured, featured_until, created_at'

const CORE_SAFE_UNIT_COLUMNS =
  'id, project_name, developer_name, area, unit_type, size, rooms, bathrooms, finishing, delivery_status, description, contract_price, paid_amount, market_price, installment_amount, installment_frequency, contract_year, years_left, willing_to_discount, discount_amount, images, status, created_at'

export default function OpportunitiesPage() {
  const { t: dict, locale, dir } = useTranslation()
  const isAr = locale === 'ar'
  const t = dict.opportunitiesPage

  const localizedTypes = useMemo(
    () => getLocalizedUnitTypes(dict, locale),
    [dict, locale]
  )

  const [rawDbRows, setRawDbRows] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([])
  const [visibleLimit, setVisibleLimit] = useState<number>(PAGE_SIZE)

  const [viewMode, setViewMode] = useState<'list' | 'map2d' | 'map3d'>('list')
  const [openPanel, setOpenPanel] = useState<
    null | 'type' | 'price' | 'rooms' | 'area' | 'commute' | 'more'
  >(null)
  const [savedSearchToast, setSavedSearchToast] = useState(false)

  const [negotiable, setNegotiable] = useState(false)
  const [sortIdx, setSortIdx] = useState<number>(1)
  const [search, setSearch] = useState('')
  const [areaQuery, setAreaQuery] = useState('')
  const [maxCash, setMaxCash] = useState('')
  const [maxInstallment, setMaxInstallment] = useState('')
  const [maxContractPrice, setMaxContractPrice] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [deliveryStatusIdx, setDeliveryStatusIdx] = useState<number>(0)
  const [deliveryYearIdx, setDeliveryYearIdx] = useState<number>(0)
  const [contractYearIdx, setContractYearIdx] = useState<number>(0)
  const [minRoomsIdx, setMinRoomsIdx] = useState<number>(0)

  const [sivrceFilters, setSivrceFilters] = useState<SearchFiltersState>({
    q: '',
    deal: 'exit',
    propertyType: '',
    location: '',
    locationDisplay: '',
    minPrice: '',
    maxPrice: '',
    currency: 'GEL',
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
    sellerType: '',
    condition: '',
    buildingStatus: '',
    buildingSeries: '',
    floorType: '',
    heating: '',
    quickTag: '',
  })

  const chipsScrollRef = useRef<HTMLDivElement>(null)

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
      const recentStored = localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY)
      if (recentStored) {
        const parsedRecent = JSON.parse(recentStored)
        if (Array.isArray(parsedRecent))
          setRecentlyViewedIds(parsedRecent.map(String))
      }
    } catch {}

    try {
      const urlParams = new URLSearchParams(window.location.search)
      const qParam = urlParams.get('q')
      const catParam = urlParams.get('category')
      const areaParam = urlParams.get('area')
      const typeParam = urlParams.get('type')
      const roomsParam = urlParams.get('rooms')
      const minPriceParam = urlParams.get('minPrice')
      const maxPriceParam = urlParams.get('maxPrice')
      const minAreaParam = urlParams.get('minArea')
      const maxAreaParam = urlParams.get('maxArea')
      const viewParam = urlParams.get('view')
      const delivParam = urlParams.get('delivery')

      if (qParam) {
        setSearch(qParam)
        updateSivrceFilter('q', qParam)
      }
      if (
        catParam &&
        ['all', 'exit', 'sale', 'rent_monthly', 'rent_daily'].includes(catParam)
      ) {
        updateSivrceFilter('deal', catParam as SearchFiltersState['deal'])
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

        const primaryRes = await supabase
          .from('sell_requests')
          .select(PUBLIC_SAFE_UNIT_COLUMNS)
          .in('status', ['active', 'approved', 'published', 'offer_received'])
          .order('is_featured', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(5000)

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
            rows.filter((row: any) => !isNonGeorgianLegacyArea(row.area))
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

  const dbProperties: MappedProperty[] = useMemo(() => {
    return rawDbRows.map((row) => mapDbRowToProperty(row, locale, t))
  }, [rawDbRows, locale, t])

  useEffect(() => {
    setVisibleLimit(PAGE_SIZE)
  }, [
    search,
    areaQuery,
    negotiable,
    selectedTypes,
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
    setDeliveryStatusIdx(0)
    setDeliveryYearIdx(0)
    setContractYearIdx(0)
    setMinRoomsIdx(0)
    setNegotiable(false)
    setSivrceFilters({
      q: '',
      deal: 'exit',
      propertyType: '',
      location: '',
      locationDisplay: '',
      minPrice: '',
      maxPrice: '',
      currency: 'GEL',
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
      sellerType: '',
      condition: '',
      buildingStatus: '',
      buildingSeries: '',
      floorType: '',
      heating: '',
      quickTag: '',
    })
    setOpenPanel(null)
    setVisibleLimit(PAGE_SIZE)
  }

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (negotiable) count++
    if (areaQuery.trim()) count++
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
    if (sivrceFilters.condition) count++
    if (sivrceFilters.bathrooms) count++
    return count
  }, [
    negotiable,
    areaQuery,
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
    // فقط قسم "تنازل وأقساط" مربوط بالوحدات حالياً؛ أما البيع والإيجار فيُظهر 0 منتجات لحين ربطها
    if (
      sivrceFilters.deal !== 'all' &&
      sivrceFilters.deal !== 'exit'
    ) {
      return []
    }

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

    const filtered = dbProperties.filter((item) => {
      const haystack =
        `${item.project} ${item.developer} ${item.area} ${item.rawArea} ${item.code} ${item.type}`.toLowerCase()

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
        if (
          pt === 'apartment' &&
          !item.type.toLowerCase().includes('apart') &&
          !item.type.includes('شقة') &&
          !item.type.includes('استوديو')
        ) {
          return false
        } else if (
          pt !== 'apartment' &&
          !item.type.toLowerCase().includes(pt)
        ) {
          return false
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

      if (sivrceFilters.vipTier === 'SUPER VIP' && !item.featured) {
        return false
      }

      return true
    })

    return [...filtered].sort((a, b) => {
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
      return 0
    })
  }, [
    dbProperties,
    search,
    areaQuery,
    negotiable,
    selectedTypes,
    deliveryStatusIdx,
    deliveryYearIdx,
    contractYearIdx,
    minRoomsIdx,
    maxCash,
    maxInstallment,
    maxContractPrice,
    sortIdx,
    sivrceFilters,
    t,
  ])

  const activeCurrency = getCurrencySymbol('GE', locale)
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

  const displayedProperties = useMemo(() => {
    return visibleProperties.slice(0, visibleLimit)
  }, [visibleProperties, visibleLimit])

  const remainingCount = Math.max(
    0,
    visibleProperties.length - displayedProperties.length
  )
  const nextBatchCount = Math.min(PAGE_SIZE, remainingCount)

  const recentlyViewedProperties = useMemo(() => {
    if (recentlyViewedIds.length > 0) {
      const matched = dbProperties.filter((p) =>
        recentlyViewedIds.includes(String(p.id))
      )
      if (matched.length > 0) return matched.slice(0, 4)
    }
    return dbProperties.slice(0, 4)
  }, [dbProperties, recentlyViewedIds])

  const quickCategoryChips = [
    { id: '', label: isAr ? 'كل الأنواع' : 'All types', icon: Grid2X2 },
    {
      id: 'exit',
      label: isAr ? 'تنازل وأقساط' : 'Installment Exit',
      icon: ShieldCheck,
    },
    { id: 'Apartment', label: isAr ? 'شقق' : 'Apartments', icon: Building2 },
    { id: 'metro', label: isAr ? 'شقق قرب المترو' : 'Near metro', icon: MapPin },
    { id: 'Private house', label: isAr ? 'منازل' : 'Houses', icon: Home },
    { id: 'Cottage', label: isAr ? 'أكواخ' : 'Cottages', icon: Trees },
    { id: 'luxury', label: isAr ? 'عقارات فاخرة' : 'Luxury homes', icon: Gem },
    {
      id: 'rent_daily',
      label: isAr ? 'شقق يومية' : 'Daily stays',
      icon: Calendar,
    },
    {
      id: 'self_checkin',
      label: isAr ? 'تسجيل وصول ذاتي' : 'Self check-in',
      icon: KeyRound,
    },
    { id: 'sea', label: isAr ? 'إطلالة على البحر' : 'Sea view', icon: Waves },
    {
      id: 'pool',
      label: isAr ? 'مع حمام سباحة' : 'With pool',
      icon: Sparkles,
    },
    { id: 'jacuzzi', label: isAr ? 'مع جاكوزي' : 'With Jacuzzi', icon: Bath },
    {
      id: 'ski',
      label: isAr ? 'منتجعات تزلج' : 'Ski resorts',
      icon: Mountain,
    },
    {
      id: 'pet',
      label: isAr ? 'مسموح بالحيوانات الأليفة' : 'Pet friendly',
      icon: PawPrint,
    },
    { id: 'Land', label: isAr ? 'قطع أراضٍ' : 'Land plots', icon: MapPin },
    { id: 'Commercial', label: isAr ? 'تجاري' : 'Commercial', icon: Store },
    { id: 'Hotel', label: isAr ? 'فنادق' : 'Hotels', icon: Hotel },
    {
      id: 'new_dev',
      label: isAr ? 'مشاريع جديدة' : 'New projects',
      icon: Building,
    },
  ]

  if (viewMode === 'map2d' || viewMode === 'map3d') {
    return (
      <Search3DMapView
        properties={visibleProperties}
        is3DMode={viewMode === 'map3d'}
        setIs3DMode={(v) => setViewMode(v ? 'map3d' : 'map2d')}
        onBackToList={() => setViewMode('list')}
        searchQuery={search}
        setSearchQuery={setSearch}
        dealFilter={sivrceFilters.deal}
        setDealFilter={(d) => updateSivrceFilter('deal', d)}
        typeFilter={sivrceFilters.propertyType}
        setTypeFilter={(tp) => updateSivrceFilter('propertyType', tp)}
        onResetFilters={clearAll}
        activeCurrency={activeCurrency}
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
            {t.header.title}
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

        {/* شريط البحث والفلاتر العلوي الحديث */}
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
                <span>{isAr ? 'بحث' : 'Search'}</span>
              </button>
            </div>

            <div className="inline-flex items-center overflow-x-auto rounded-full bg-slate-100/90 p-1 text-xs font-bold no-scrollbar">
              {(
                [
                  { id: 'all', label: isAr ? 'الكل' : 'All' },
                  { id: 'exit', label: isAr ? 'تنازل وأقساط' : 'Exit' },
                  { id: 'sale', label: isAr ? 'للبيع' : 'Sale' },
                  { id: 'rent_monthly', label: isAr ? 'للإيجار' : 'Rent' },
                  { id: 'rent_daily', label: isAr ? 'يومي' : 'Daily' },
                ] as const
              ).map((d) => {
                const active = sivrceFilters.deal === d.id
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => updateSivrceFilter('deal', d.id)}
                    className={`shrink-0 rounded-full px-3.5 py-1.5 transition ${
                      active
                        ? 'bg-[#2563eb] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-[#0f1d40]'
                    }`}
                  >
                    {d.label}
                  </button>
                )
              })}
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
                <span>
                  {sivrceFilters.propertyType ||
                    selectedTypes[0] ||
                    (isAr ? 'نوع العقار' : 'Property type')}
                </span>
                <ChevronDown className="size-3 text-slate-400" />
              </button>

              {openPanel === 'type' && (
                <div className="absolute start-0 top-11 z-40 w-56 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl">
                  {[
                    { id: '', label: isAr ? 'كل الأنواع' : 'All types' },
                    { id: 'Apartment', label: isAr ? 'شقة' : 'Apartment' },
                    {
                      id: 'Private house',
                      label: isAr ? 'منزل خاص' : 'Private house',
                    },
                    { id: 'Cottage', label: isAr ? 'كوخ' : 'Cottage' },
                    { id: 'Commercial', label: isAr ? 'تجاري' : 'Commercial' },
                    { id: 'Land', label: isAr ? 'أرض' : 'Land' },
                    { id: 'Hotel', label: isAr ? 'فندق' : 'Hotel' },
                  ].map((tp) => (
                    <button
                      key={tp.id || 'all'}
                      type="button"
                      onClick={() => {
                        updateSivrceFilter('propertyType', tp.id)
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
                  <span>
                    {resolvedDisplay || (isAr ? 'في كل مكان' : 'Everywhere')}
                  </span>
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
                maxCash
                  ? 'border-[#2563eb] bg-blue-50 text-[#2563eb]'
                  : 'border-slate-200 bg-slate-50/70 text-[#0f1d40] hover:bg-slate-100'
              }`}
            >
              <span>{isAr ? 'السعر' : 'Price'}</span>
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
                  ? `${sivrceFilters.rooms} ${isAr ? 'غرف' : 'Rooms'}`
                  : isAr
                    ? 'الغرف'
                    : 'Rooms'}
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
              <span>{isAr ? 'المساحة' : 'Area'}</span>
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
              <span>{isAr ? 'التنقل' : 'Commute'}</span>
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
              <span>{isAr ? 'المزيد من الفلاتر' : 'More filters'}</span>
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
              activeCurrency={activeCurrency}
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

        {/* شريط التصنيفات السريعة الأفقي القابل للسحب */}
        <div className="relative mt-3 flex items-center">
          <div
            ref={chipsScrollRef}
            className="flex items-center gap-2 overflow-x-auto py-1.5 pe-10 no-scrollbar"
          >
            {quickCategoryChips.map((chip) => {
              const Icon = chip.icon
              const active = sivrceFilters.quickTag === chip.id
              return (
                <button
                  key={chip.id || 'all-chips'}
                  type="button"
                  onClick={() => {
                    updateSivrceFilter('quickTag', chip.id)
                    if (chip.id === 'exit' || chip.id === '') {
                      updateSivrceFilter('deal', 'exit')
                      updateSivrceFilter('propertyType', '')
                    } else if (
                      [
                        'Apartment',
                        'Private house',
                        'Cottage',
                        'Land',
                        'Commercial',
                        'Hotel',
                      ].includes(chip.id)
                    ) {
                      updateSivrceFilter('propertyType', chip.id)
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
            aria-label="Scroll categories"
          >
            {dir === 'rtl' ? (
              <ChevronLeft className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </button>
        </div>

        {/* شريط التحكم: عدد الإعلانات + الشارات النشطة + حفظ البحث + الترتيب + أزرار الخريطة و 3D */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="text-sm font-bold text-[#0f1d40]">
              {availableUnitsCount.toLocaleString('en-US')}{' '}
              {t.filters.availableUnitCountWord}
            </strong>

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

            {maxCash.trim() && (
              <button
                type="button"
                onClick={() => setMaxCash('')}
                className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-primary-light,#eaf8f2)] px-3 py-1 text-[11px] font-bold text-[var(--brand-primary,#007a5a)] sm:text-xs"
              >
                <span>
                  {t.filters.cashUpToPrefix}{' '}
                  {Number(toEnglishDigits(maxCash)).toLocaleString('en-US')}
                </span>
                <X className="size-3" />
              </button>
            )}

            {maxInstallment.trim() && (
              <button
                type="button"
                onClick={() => setMaxInstallment('')}
                className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-primary-light,#eaf8f2)] px-3 py-1 text-[11px] font-bold text-[var(--brand-primary,#007a5a)] sm:text-xs"
              >
                <span>
                  {t.filters.instUpToPrefix}{' '}
                  {Number(toEnglishDigits(maxInstallment)).toLocaleString(
                    'en-US'
                  )}
                </span>
                <X className="size-3" />
              </button>
            )}

            {maxContractPrice.trim() && (
              <button
                type="button"
                onClick={() => setMaxContractPrice('')}
                className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-primary-light,#eaf8f2)] px-3 py-1 text-[11px] font-bold text-[var(--brand-primary,#007a5a)] sm:text-xs"
              >
                <span>
                  {t.filters.contractUpToPrefix}{' '}
                  {Number(toEnglishDigits(maxContractPrice)).toLocaleString(
                    'en-US'
                  )}
                </span>
                <X className="size-3" />
              </button>
            )}

            {selectedTypes.map((tp) => (
              <button
                key={tp}
                type="button"
                onClick={() => toggleType(tp)}
                className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-primary-light,#eaf8f2)] px-3 py-1 text-[11px] font-bold text-[var(--brand-primary,#007a5a)] sm:text-xs"
              >
                <span>{tp}</span>
                <X className="size-3" />
              </button>
            ))}

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
                {savedSearchToast
                  ? isAr
                    ? 'تم حفظ البحث ✓'
                    : 'Search saved ✓'
                  : isAr
                    ? 'حفظ البحث'
                    : 'Save search'}
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
                  onChange={(e) => setSortIdx(Number(e.target.value))}
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
                {isAr ? 'قائمة' : 'List'}
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map2d')}
                className="inline-flex items-center gap-1 rounded-full px-3.5 py-1 text-xs font-bold text-slate-600 transition hover:bg-slate-50 hover:text-[#0f1d40]"
              >
                <span>{isAr ? 'الخريطة' : 'Map'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setViewMode('map3d')}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-4 text-xs font-bold text-white shadow-[0_6px_18px_rgba(255,100,55,0.3)] transition hover:opacity-95"
            >
              <Layers className="size-3.5" />
              <span>{isAr ? 'خريطة ثلاثية الأبعاد' : '3D Map'}</span>
            </button>
          </div>
        </div>

        {/* كارت الإحصائيات الأصلي كاملاً */}
        <section className="mt-5 sm:mt-6">
          <div className="grid grid-cols-1 divide-y divide-gray-200/80 overflow-hidden rounded-[20px] border border-gray-200/70 border-t-[3px] border-t-[var(--brand-primary,#007a5a)] bg-white shadow-sm md:grid-cols-2 md:divide-x md:divide-y-0 md:divide-x-reverse">
            <div className="flex flex-col justify-between p-6 text-start sm:p-8">
              <p className="text-xs font-bold text-gray-500 sm:text-sm">
                {t.stats.availableUnitsTitle}
              </p>

              <div className="mt-3 flex items-baseline justify-start gap-2">
                <span
                  dir="ltr"
                  className="text-4xl font-bold leading-none tracking-tight text-[var(--brand-navy,#0a1122)] tabular-nums sm:text-5xl"
                >
                  {availableUnitsCount.toLocaleString('en-US')}
                </span>
                <span className="text-base font-medium text-gray-500 sm:text-lg">
                  {t.stats.unitWord}
                </span>
              </div>

              <div>
                <div className="mt-4 h-[1px] w-12 bg-teal-600/40" />
                <p className="mt-3 text-xs leading-snug text-gray-400">
                  {t.stats.availableUnitsSub}
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-between p-6 text-start sm:p-8">
              <div className="flex items-center justify-start gap-2">
                <p className="text-xs font-bold text-gray-500 sm:text-sm">
                  {t.stats.marketValueTitle}
                </p>
                <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-semibold text-gray-500">
                  {t.stats.estimatedBadge}
                </span>
              </div>

              <div className="mt-3 flex items-baseline justify-start gap-2">
                <span
                  dir="ltr"
                  className="text-4xl font-bold leading-none tracking-tight text-[var(--brand-navy,#0a1122)] tabular-nums sm:text-5xl"
                >
                  {formattedMarketTotal.value}
                </span>
                <span className="text-base font-medium text-gray-500 sm:text-lg">
                  {formattedMarketTotal.unit}
                </span>
              </div>

              <div>
                <div className="mt-4 h-[1px] w-12 bg-teal-600/40" />
                <p className="mt-3 text-xs leading-snug text-gray-400">
                  {t.stats.marketValueSub}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* البانر الإعلاني الأفقي */}
        <div className="mt-5 flex flex-col items-center justify-between gap-4 rounded-[20px] border border-slate-200/80 bg-white p-4 shadow-2xs sm:flex-row sm:px-6">
          <div className="flex items-center gap-3.5 text-start">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#2563eb]">
              <Megaphone className="size-5" />
            </div>
            <div>
              <span className="text-[10.5px] font-bold text-[#2563eb]">
                {isAr
                  ? 'مساحة إعلانية · شبكة عقار إكزت'
                  : 'Ad Space · Aqar Exit Network'}
              </span>
              <strong className="block text-sm font-bold text-[#0f1d40]">
                {isAr ? 'إعلانك هنا' : 'Your Ad Here'}
              </strong>
              <p className="text-xs text-slate-500">
                {isAr
                  ? 'انشر إعلانك واصل إلى آلاف المشترين والمستثمرين في العقارات.'
                  : 'Reach thousands of active property buyers and investors.'}
              </p>
            </div>
          </div>

          <Link
            href="/contact"
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-5 text-xs font-bold text-white shadow-xs transition hover:opacity-95"
          >
            {isAr ? 'أعلن هنا ←' : 'Advertise →'}
          </Link>
        </div>

        {/* شبكة كروت الفرص المتاحة الأصلية (OpportunityCard) */}
        <section className="mt-6 sm:mt-8">
          <div className="mb-4 flex items-center justify-between gap-2 text-start sm:mb-5">
            <div className="flex items-center gap-1.5">
              <Star className="size-4 fill-amber-400 text-amber-500" />
              <h2 className="text-base font-bold text-[var(--brand-navy,#0a1122)] sm:text-lg">
                {t.header.title} ({visibleProperties.length})
              </h2>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 items-stretch gap-2.5 sm:gap-5 lg:grid-cols-3 lg:gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="h-[340px] animate-pulse rounded-[14px] border border-gray-200 bg-white p-4 sm:h-[420px] sm:rounded-[18px]"
                >
                  <div className="h-[120px] w-full rounded-xl bg-gray-200 sm:h-[180px]" />
                  <div className="mt-4 h-4 w-2/3 rounded bg-gray-200" />
                  <div className="mt-2 h-3 w-1/2 rounded bg-gray-100" />
                  <div className="mt-6 h-6 w-1/3 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          ) : displayedProperties.length > 0 ? (
            <div className="grid grid-cols-2 items-stretch gap-2.5 sm:gap-5 lg:grid-cols-3 lg:gap-6">
              {displayedProperties.map((property) => (
                <OpportunityCard
                  key={property.id}
                  property={property}
                  liked={favoriteIds.includes(String(property.id))}
                  onToggleLike={handleToggleFavorite}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
              <p className="text-sm font-bold text-gray-600">
                {sivrceFilters.deal !== 'exit' && sivrceFilters.deal !== 'all'
                  ? isAr
                    ? 'قسم البيع والإيجار المباشر سيتم ربطه قريباً — تصفح حالياً عروض «تنازل وأقساط» المتاحة.'
                    : 'Direct Sale & Rent sections are launching soon — browse active Exit deals.'
                  : `${t.grid.emptyInCountryPrefix}.`}
              </p>
              {(activeFilterCount > 0 ||
                search ||
                sivrceFilters.deal !== 'exit') && (
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
          )}

          {remainingCount > 0 && (
            <div className="mt-8 flex justify-center sm:mt-10">
              <button
                type="button"
                onClick={() => setVisibleLimit((prev) => prev + PAGE_SIZE)}
                className="rounded-full border border-gray-200 bg-white px-6 py-2.5 text-xs font-bold text-[var(--brand-navy,#0a1122)] shadow-xs transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-95 sm:px-7 sm:py-3"
              >
                {t.grid.loadMorePrefix} {nextBatchCount}{' '}
                {t.grid.loadMoreMiddle} (
                {remainingCount.toLocaleString('en-US')} {t.grid.remainingWord})
              </button>
            </div>
          )}
        </section>

        {/* شريط شوهدت مؤخراً المصغر */}
        {recentlyViewedProperties.length > 0 && (
          <section className="mt-12 border-t border-slate-200/80 pt-8 text-start">
            <span className="block text-xs font-bold text-slate-500">
              {isAr ? 'شوهدت مؤخراً' : 'Recently viewed'}
            </span>
            <div className="mt-3 flex gap-3 overflow-x-auto pb-2 no-scrollbar sm:grid sm:grid-cols-2 lg:grid-cols-4">
              {recentlyViewedProperties.map((item) => (
                <Link
                  key={`recent-mini-${item.id}`}
                  href={`/opportunities/${item.id}`}
                  className="flex w-[260px] shrink-0 items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-2xs transition hover:border-[#2563eb] sm:w-auto"
                >
                  <img
                    src={item.image}
                    alt={item.project}
                    className="size-14 shrink-0 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <strong
                      dir="ltr"
                      className="block text-xs font-bold text-[#0f1d40]"
                    >
                      {item.cash} {activeCurrency}
                    </strong>
                    <p className="truncate text-[11px] font-semibold text-slate-600">
                      {item.project}
                    </p>
                    <span className="block truncate text-[10px] text-slate-400">
                      {item.area}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <OpportunitiesBottomSections />
      </div>
    </main>
  )
}
