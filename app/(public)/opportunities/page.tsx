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
import { useTranslation } from '@/lib/i18n'
import { isNonGeorgianLegacyArea } from '@/lib/smart-matcher'

// 9 وحدات في كل صفحة (3 صفوف × 3 أعمدة) ليظهر نظام الترقيم Pagination بشكل متناسق
const PAGE_SIZE = 9
const FAVORITES_STORAGE_KEY = 'darak_favorites'

const PUBLIC_SAFE_UNIT_COLUMNS =
  'id, code, project_name, developer_name, area, unit_type, size, garden_size, rooms, bedrooms, bathrooms, floor_number, total_floors, finishing, delivery_status, delivery_month, delivery_year, features, description, contract_price, paid_amount, market_price, price_per_sqm, installment_amount, installment_frequency, contract_month, contract_year, years_left, willing_to_discount, discount_amount, images, status, is_featured, boost_tier, featured_until, docs_verified, views_count, approved_at, created_at, documents'

const CORE_SAFE_UNIT_COLUMNS =
  'id, project_name, developer_name, area, unit_type, size, rooms, bathrooms, finishing, delivery_status, features, description, contract_price, paid_amount, market_price, installment_amount, installment_frequency, contract_year, years_left, willing_to_discount, discount_amount, images, status, created_at, documents'

export default function OpportunitiesPage() {
  const { t: dict, locale, dir } = useTranslation()
  const isAr = locale === 'ar'
  const t = dict.opportunitiesPage
  const activeCurrency = '$'

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
          // قبول الوحدات الرسمية فقط التي تمتلك UUID حقيقي في قاعدة البيانات
          setRawDbRows(
            rows.filter((row: any) => {
              const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(
                String(row?.id || '')
              )
              return isValidUuid && !isNonGeorgianLegacyArea(row.area)
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

  const dbProperties: Array<MappedProperty & { rawFeatures: string[] }> =
    useMemo(() => {
      return rawDbRows.map((row) => {
        const mapped = mapDbRowToProperty(row, locale, t)
        const metaFeatures = row?.documents?.__unit_meta?.features
        const rowFeatures = Array.isArray(row?.features)
          ? row.features
          : Array.isArray(metaFeatures)
            ? metaFeatures
            : []
        return {
          ...mapped,
          rawFeatures: rowFeatures.map((f: any) => String(f || '')),
        }
      })
    }, [rawDbRows, locale, t])

  // إعادة الصفحة إلى 1 عند تغيير أي فلتر بحث
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
    if (sivrceFilters.condition) count++
    if (sivrceFilters.bathrooms) count++
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

    const filtered = dbProperties.filter((item) => {
      const featuresJoined = (item.rawFeatures || []).join(' ').toLowerCase()
      const haystack =
        `${item.project} ${item.developer} ${item.area} ${item.rawArea} ${item.code} ${item.type} ${featuresJoined}`.toLowerCase()

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

  // حسابات الـ Pagination الرسمية
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
      label: isAr ? 'كل عروض التنازل' : 'All Exit Deals',
      icon: Grid2X2,
      feature: '',
      type: '',
    },
    {
      id: 'Apartment',
      label: isAr ? 'شقق بالتقسيط' : 'Apartments',
      icon: Building2,
      feature: '',
      type: 'Apartment',
    },
    {
      id: 'Private house',
      label: isAr ? 'منازل وفيلات' : 'Houses & Villas',
      icon: Home,
      feature: '',
      type: 'Private house',
    },
    {
      id: 'Cottage',
      label: isAr ? 'أكواخ وشاليهات' : 'Cottages',
      icon: Trees,
      feature: '',
      type: 'Cottage',
    },
    {
      id: 'luxury',
      label: isAr ? 'عقارات فاخرة' : 'Luxury homes',
      icon: Gem,
      feature: 'Panoramic view',
      type: '',
    },
    {
      id: 'ready',
      label: isAr ? 'استلام فوري' : 'Ready to move',
      icon: Calendar,
      feature: '',
      type: '',
    },
    {
      id: 'under_const',
      label: isAr ? 'قيد الإنشاء' : 'Under construction',
      icon: Building,
      feature: '',
      type: '',
    },
    {
      id: 'sea',
      label: isAr ? 'إطلالة بحرية' : 'Sea view',
      icon: Waves,
      feature: 'Sea view',
      type: '',
    },
    {
      id: 'pool',
      label: isAr ? 'مع حمام سباحة' : 'With pool',
      icon: Sparkles,
      feature: 'Pool',
      type: '',
    },
    {
      id: 'jacuzzi',
      label: isAr ? 'مع جاكوزي' : 'With Jacuzzi',
      icon: Bath,
      feature: 'Jacuzzi',
      type: '',
    },
    {
      id: 'ski',
      label: isAr ? 'منتجعات تزلج' : 'Ski resorts',
      icon: Mountain,
      feature: 'Ski access',
      type: '',
    },
    {
      id: 'Land',
      label: isAr ? 'قطع أراضٍ' : 'Land plots',
      icon: MapPin,
      feature: '',
      type: 'Land',
    },
    {
      id: 'Commercial',
      label: isAr ? 'تجاري وإداري' : 'Commercial',
      icon: Store,
      feature: '',
      type: 'Commercial',
    },
    {
      id: 'Hotel',
      label: isAr ? 'شقق فندقية' : 'Hotel units',
      icon: Hotel,
      feature: '',
      type: 'Hotel',
    },
  ]

  const resolvedSearchHeading =
    activeCategoryLabel ||
    search.trim() ||
    selectedFeature ||
    (sivrceFilters.propertyType
      ? quickCategoryChips.find((c) => c.id === sivrceFilters.propertyType)
          ?.label || sivrceFilters.propertyType
      : '') ||
    (areaQuery ? getLocalizedGeorgiaAreaName(areaQuery, locale) : '')

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
              ? `${isAr ? 'نتائج البحث:' : 'Search Results:'} ${resolvedSearchHeading} (${availableUnitsCount})`
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

        {/* شريط البحث والفلاتر */}
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
                    (isAr ? 'نوع الوحدة' : 'Unit type')}
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
                      label: isAr ? 'منزل / فيلا' : 'House / Villa',
                    },
                    { id: 'Cottage', label: isAr ? 'كوخ / شاليه' : 'Cottage' },
                    { id: 'Commercial', label: isAr ? 'تجاري' : 'Commercial' },
                    { id: 'Land', label: isAr ? 'أرض' : 'Land' },
                    { id: 'Hotel', label: isAr ? 'شقة فندقية' : 'Hotel Unit' },
                  ].map((tp) => (
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
                maxCash ||
                maxInstallment
                  ? 'border-[#2563eb] bg-blue-50 text-[#2563eb]'
                  : 'border-slate-200 bg-slate-50/70 text-[#0f1d40] hover:bg-slate-100'
              }`}
            >
              <span>
                {isAr ? 'الكاش والأقساط ($)' : 'Cash & Installments ($)'}
              </span>
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

        {/* شريط التصنيفات السريعة الأفقي */}
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
            aria-label="Scroll categories"
          >
            {dir === 'rtl' ? (
              <ChevronLeft className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </button>
        </div>

        {/* شريط البحث النشط */}
        {Boolean(
          resolvedSearchHeading ||
            selectedFeature ||
            sivrceFilters.propertyType ||
            areaQuery
        ) && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-200/80 bg-white px-4 py-3 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#0f1d40] sm:text-sm">
              <span className="text-slate-500">
                {isAr ? 'البحث النشط:' : 'Active Search:'}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3.5 py-1 text-xs font-bold text-[#2563eb]">
                <span>{resolvedSearchHeading}</span>
              </span>
              <span className="rounded-full bg-[#eaf8f2] px-3 py-1 text-xs font-bold text-[#007a5a]">
                {availableUnitsCount}{' '}
                {isAr ? 'وحدة متاحة' : 'available units'}
              </span>
            </div>

            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1 text-xs font-bold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            >
              <X className="size-3.5" />
              <span>
                {isAr ? 'إلغاء الفلتر وعرض الكل' : 'Clear Filter & Show All'}
              </span>
            </button>
          </div>
        )}

        {/* شريط التحكم */}
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

        {/* كارت الإحصائيات الموثقة */}
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

        {/* البانر الترويجي لباقات تمييز الإعلانات */}
        <div className="aqar-wave-banner mt-5 flex flex-col items-center justify-between gap-4 rounded-[22px] border border-slate-200/80 bg-gradient-to-l from-[#1e1b4b] via-[#172554] to-[#0f172a] p-5 text-white shadow-sm sm:flex-row sm:px-7">
          <div className="relative z-10 flex items-center gap-3.5 text-start">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#2ee59d]">
              <Megaphone className="size-5" />
            </div>
            <div>
              <span className="text-[10.5px] font-bold text-[#2ee59d]">
                ✦{' '}
                {isAr
                  ? 'تمييز عروض التنازل · SUPER VIP & +VIP'
                  : 'Boost Your Exit Listing · SUPER VIP & +VIP'}
              </span>
              <strong className="block text-sm font-bold text-white sm:text-base">
                {isAr
                  ? 'هل لديك وحدة تريد التنازل عنها أسرع؟ ضع إعلانك في الصدارة'
                  : 'Want to exit your unit faster? Feature your listing at the top'}
              </strong>
              <p className="text-xs text-blue-100/75">
                {isAr
                  ? 'انشر إعلانك أو رقِّه لباقة SUPER VIP ليظهر في أول نتائج الفرص المتاحة والصفحة الرئيسية.'
                  : 'Upgrade to SUPER VIP to appear first in Opportunities and on the Homepage.'}
              </p>
            </div>
          </div>

          <Link
            href="/#boost-packages-section"
            className="relative z-10 inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-6 text-xs font-bold text-white shadow-md transition hover:scale-105 hover:opacity-95"
          >
            {isAr ? 'باقات تمييز الإعلان ←' : 'Boost Packages →'}
          </Link>
        </div>

        {/* شبكة كروت الفرص المتاحة */}
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
                {isAr
                  ? `عرض ${startIndex + 1}–${endIndex} من أصل ${visibleProperties.length} وحدة`
                  : `Showing ${startIndex + 1}–${endIndex} of ${visibleProperties.length} units`}
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
                {t.grid.emptyInCountryPrefix}.
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
          )}

          {/* شريط ترقيم الصفحات الرسمي (Pagination) */}
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
                <span>{isAr ? 'السابق' : 'Prev'}</span>
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
                <span>{isAr ? 'التالي' : 'Next'}</span>
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
