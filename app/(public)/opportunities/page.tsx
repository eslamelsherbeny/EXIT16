'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { MapPin, Star } from 'lucide-react'
import {
  getLocalizedUnitTypes,
  toEnglishDigits,
} from '@/components/features/seller/seller-shared'
import {
  mapDbRowToProperty,
  OpportunitiesBottomSections,
  OpportunityCard,
  type MappedProperty,
} from '@/components/features/opportunities/opportunities-shared'
import { type SearchFiltersState } from '@/components/features/opportunities/search-filter-popovers'
import { Search3DMapView } from '@/components/features/opportunities/search-3d-map-view'
import {
  CORE_SAFE_UNIT_COLUMNS,
  getQuickCategoryChips,
  InlineAdSlotCard,
  localizePropertyTypeLabel,
  OpportunitiesFilterSection,
  OpportunitiesPagination,
  OPPS_UI_FALLBACK,
  PUBLIC_SAFE_UNIT_COLUMNS,
} from '@/components/features/opportunities/opportunities-page-parts'
import { getLocalizedGeorgiaAreaName } from '@/components/shared/georgia-areas'
import { useTranslation, type LocaleCode } from '@/lib/i18n'
import { isNonGeorgianLegacyArea } from '@/lib/smart-matcher'

const PAGE_SIZE = 9
const FAVORITES_STORAGE_KEY = 'darak_favorites'

export default function OpportunitiesPage() {
  const { t: dict, locale, dir } = useTranslation()
  const activeLocale = (locale as LocaleCode) || 'ar'
  const isAr = activeLocale === 'ar'
  const t = dict.opportunitiesPage as Record<string, any>

  const baseUi = OPPS_UI_FALLBACK[activeLocale] || OPPS_UI_FALLBACK.ar
  const customUi = t.ui || {}
  const uT = {
    ...baseUi,
    ...customUi,
    chips: { ...baseUi.chips, ...(customUi.chips || {}) },
  }

  const localizedTypes = useMemo(
    () => getLocalizedUnitTypes(dict, activeLocale),
    [dict, activeLocale]
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

      if (pageParam && pageParam > 0) setCurrentPage(pageParam)
      if (labelParam) setActiveCategoryLabel(labelParam)
      if (qParam) {
        setSearch(qParam)
        updateSivrceFilter('q', qParam)
      }
      if (areaParam) {
        setAreaQuery(areaParam)
        updateSivrceFilter('location', areaParam)
        updateSivrceFilter(
          'locationDisplay',
          getLocalizedGeorgiaAreaName(areaParam, activeLocale)
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
      if (
        sortParam === 'newest' ||
        sortParam === 'recent' ||
        sortParam === 'date'
      ) {
        setSortIdx(1)
        setStrictDateSort(true)
        if (!labelParam) setActiveCategoryLabel(uT.newlyAddedHeading)
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
      if (roomsParam) updateSivrceFilter('rooms', roomsParam)
      if (minPriceParam) updateSivrceFilter('minPrice', minPriceParam)
      if (maxPriceParam) {
        updateSivrceFilter('maxPrice', maxPriceParam)
        setMaxCash(maxPriceParam)
      }
      if (minAreaParam) updateSivrceFilter('minArea', minAreaParam)
      if (maxAreaParam) updateSivrceFilter('maxArea', maxAreaParam)
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
  }, [activeLocale, uT.newlyAddedHeading])

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
      const mapped = mapDbRowToProperty(
        row,
        activeLocale,
        dict.opportunitiesPage
      )
      const metaFeatures = row?.documents?.__unit_meta?.features
      const rowFeatures = Array.isArray(row?.features)
        ? row.features
        : Array.isArray(metaFeatures)
          ? metaFeatures
          : []
      const rawFinishing = String(
        row?.finishing || row?.documents?.__unit_meta?.finishing || ''
      )
      const rawUnitType = String(
        row?.unit_type || row?.documents?.__unit_meta?.unit_type || mapped.type
      )

      return {
        ...mapped,
        type: localizePropertyTypeLabel(rawUnitType, activeLocale),
        area: getLocalizedGeorgiaAreaName(
          row?.area || mapped.rawArea,
          activeLocale
        ),
        rawFeatures: rowFeatures.map((f: any) => String(f || '')),
        rawFinishing,
      }
    })
  }, [rawDbRows, activeLocale, dict.opportunitiesPage])

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
          !item.type.includes('квартир') &&
          !item.type.includes('студия')
        ) {
          return false
        } else if (pt === 'private house') {
          if (
            !itemTp.includes('house') &&
            !itemTp.includes('villa') &&
            !item.type.includes('منزل') &&
            !item.type.includes('فيلا') &&
            !item.type.includes('تاون') &&
            !itemTp.includes('дом') &&
            !itemTp.includes('вилл') &&
            !item.type.includes('სახლი') &&
            !item.type.includes('ვილა')
          ) {
            return false
          }
        } else if (pt === 'cottage') {
          if (
            !itemTp.includes('cottage') &&
            !itemTp.includes('chalet') &&
            !item.type.includes('شاليه') &&
            !item.type.includes('كوخ') &&
            !itemTp.includes('коттедж') &&
            !item.type.includes('კოტეჯი')
          ) {
            return false
          }
        } else if (pt === 'hotel') {
          if (
            !itemTp.includes('hotel') &&
            !item.type.includes('فندق') &&
            !itemTp.includes('апарт') &&
            !item.type.includes('აპარტ')
          ) {
            return false
          }
        } else if (pt === 'commercial') {
          if (
            !itemTp.includes('commercial') &&
            !itemTp.includes('office') &&
            !itemTp.includes('shop') &&
            !item.type.includes('تجاري') &&
            !item.type.includes('مكتب') &&
            !item.type.includes('محل') &&
            !itemTp.includes('коммерч') &&
            !item.type.includes('კომერციული')
          ) {
            return false
          }
        } else if (pt === 'land') {
          if (
            !itemTp.includes('land') &&
            !item.type.includes('أرض') &&
            !itemTp.includes('участок') &&
            !item.type.includes('მიწა')
          ) {
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
  const totalPages = Math.max(1, Math.ceil(visibleProperties.length / PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE
  const endIndex = Math.min(startIndex + PAGE_SIZE, visibleProperties.length)

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

  const quickCategoryChips = useMemo(() => getQuickCategoryChips(uT), [uT])

  const resolvedSearchHeading =
    activeCategoryLabel ||
    sivrceFilters.vipTier ||
    search.trim() ||
    selectedFeature ||
    (sivrceFilters.propertyType
      ? quickCategoryChips.find((c) => c.id === sivrceFilters.propertyType)
          ?.label || sivrceFilters.propertyType
      : '') ||
    (areaQuery ? getLocalizedGeorgiaAreaName(areaQuery, activeLocale) : '')

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
                ? getLocalizedGeorgiaAreaName(areaQuery, activeLocale)
                : t.header.subtitle}
            </span>
          </p>
        </div>

        <OpportunitiesFilterSection
          t={t}
          uT={uT}
          activeLocale={activeLocale}
          dir={dir}
          isAr={isAr}
          search={search}
          setSearch={setSearch}
          areaQuery={areaQuery}
          setAreaQuery={setAreaQuery}
          negotiable={negotiable}
          setNegotiable={setNegotiable}
          sortIdx={sortIdx}
          setSortIdx={setSortIdx}
          strictDateSort={strictDateSort}
          setStrictDateSort={setStrictDateSort}
          maxCash={maxCash}
          setMaxCash={setMaxCash}
          maxInstallment={maxInstallment}
          setMaxInstallment={setMaxInstallment}
          maxContractPrice={maxContractPrice}
          setMaxContractPrice={setMaxContractPrice}
          selectedTypes={selectedTypes}
          toggleType={toggleType}
          localizedTypes={localizedTypes}
          selectedFeature={selectedFeature}
          setSelectedFeature={setSelectedFeature}
          activeCategoryLabel={activeCategoryLabel}
          setActiveCategoryLabel={setActiveCategoryLabel}
          deliveryStatusIdx={deliveryStatusIdx}
          setDeliveryStatusIdx={setDeliveryStatusIdx}
          deliveryYearIdx={deliveryYearIdx}
          setDeliveryYearIdx={setDeliveryYearIdx}
          contractYearIdx={contractYearIdx}
          setContractYearIdx={setContractYearIdx}
          minRoomsIdx={minRoomsIdx}
          setMinRoomsIdx={setMinRoomsIdx}
          sivrceFilters={sivrceFilters}
          updateSivrceFilter={updateSivrceFilter}
          openPanel={openPanel}
          setOpenPanel={setOpenPanel}
          activeFilterCount={activeFilterCount}
          availableUnitsCount={availableUnitsCount}
          savedSearchToast={savedSearchToast}
          setSavedSearchToast={setSavedSearchToast}
          setViewMode={setViewMode}
          clearAll={clearAll}
        />

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

          <OpportunitiesPagination
            totalPages={totalPages}
            safeCurrentPage={safeCurrentPage}
            pageNumbers={pageNumbers}
            handleGoToPage={handleGoToPage}
            dir={dir}
            uT={uT}
          />
        </section>

        <OpportunitiesBottomSections />
      </div>
    </main>
  )
}