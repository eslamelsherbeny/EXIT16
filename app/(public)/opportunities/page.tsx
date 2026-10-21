'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  ArrowDown,
  Check,
  ChevronDown,
  Globe,
  ListFilter,
  Search,
  Star,
  X,
} from 'lucide-react'
import {
  getCurrencyByCountry,
  normalizeArabicText,
  unitTypes,
} from '@/components/seller/seller-shared'
import {
  COUNTRY_FILTER_OPTIONS,
  mapDbRowToProperty,
  OpportunitiesBottomSections,
  OpportunityCard,
  type MappedProperty,
  type OpportunityCountryCode,
} from '@/components/opportunities/opportunities-shared'
import arDict from '@/dictionaries/ar.json'

const PAGE_SIZE = 48
const FAVORITES_STORAGE_KEY = 'darak_favorites'
const t = arDict.opportunitiesPage

function getActiveHeaderCountry(): OpportunityCountryCode {
  if (typeof document !== 'undefined') {
    const match = document.cookie
      .split('; ')
      .find((row) => row.startsWith('darak_country='))
    const code = match?.split('=')[1]?.trim() as
      | OpportunityCountryCode
      | undefined
    if (code && COUNTRY_FILTER_OPTIONS.some((c) => c.code === code)) {
      return code
    }
  }
  return 'EG'
}

export default function OpportunitiesPage() {
  const [dbProperties, setDbProperties] = useState<MappedProperty[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [visibleLimit, setVisibleLimit] = useState<number>(PAGE_SIZE)

  const [filtersOpen, setFiltersOpen] = useState(false)
  const [negotiable, setNegotiable] = useState(false)
  const [sort, setSort] = useState(t.filters.sorts[1])

  const [selectedCountry, setSelectedCountry] =
    useState<OpportunityCountryCode>('EG')
  const [countrySearch, setCountrySearch] = useState('')
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false)
  const countryFilterRef = useRef<HTMLDivElement>(null)

  const [search, setSearch] = useState('')
  const [areaQuery, setAreaQuery] = useState('')
  const [maxCash, setMaxCash] = useState('')
  const [maxInstallment, setMaxInstallment] = useState('')
  const [maxContractPrice, setMaxContractPrice] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [deliveryStatus, setDeliveryStatus] = useState(
    t.filters.deliveryStatuses[0]
  )
  const [deliveryYear, setDeliveryYear] = useState(t.filters.deliveryYears[0])
  const [contractYear, setContractYear] = useState(t.filters.contractYears[0])
  const [minRooms, setMinRooms] = useState(t.filters.roomOptions[0])

  useEffect(() => {
    setSelectedCountry(getActiveHeaderCountry())
    const syncWithHeader = () => {
      setSelectedCountry(getActiveHeaderCountry())
    }
    window.addEventListener('country-changed', syncWithHeader)
    return () => window.removeEventListener('country-changed', syncWithHeader)
  }, [])

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (
        countryFilterRef.current &&
        !countryFilterRef.current.contains(e.target as Node)
      ) {
        setCountryDropdownOpen(false)
        setCountrySearch('')
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) setFavoriteIds(parsed.map(String))
      }
    } catch {}
  }, [])

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

        const { data, error } = await supabase
          .from('sell_requests')
          .select('*')
          .in('status', ['active', 'offer_received', 'transferring'])
          .order('is_featured', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(5000)

        if (!error && data) {
          setDbProperties(data.map(mapDbRowToProperty))
        }
      } catch (err) {
        console.error('Failed to load approved properties:', err)
      } finally {
        setLoading(false)
      }
    }

    loadApprovedProperties()
  }, [])

  useEffect(() => {
    setVisibleLimit(PAGE_SIZE)
  }, [
    selectedCountry,
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
    setDeliveryStatus(t.filters.deliveryStatuses[0])
    setDeliveryYear(t.filters.deliveryYears[0])
    setContractYear(t.filters.contractYears[0])
    setMinRooms(t.filters.roomOptions[0])
    setNegotiable(false)
    setSelectedCountry(getActiveHeaderCountry())
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
    if (deliveryStatus !== t.filters.deliveryStatuses[0]) count++
    if (deliveryYear !== t.filters.deliveryYears[0]) count++
    if (contractYear !== t.filters.contractYears[0]) count++
    if (minRooms !== t.filters.roomOptions[0]) count++
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
    const cleanMaxCash = Number(String(maxCash).replace(/,/g, ''))
    const cleanMaxInst = Number(String(maxInstallment).replace(/,/g, ''))
    const cleanMaxContract = Number(String(maxContractPrice).replace(/,/g, ''))

    const filtered = dbProperties.filter((item) => {
      if (selectedCountry !== 'ALL' && item.country !== selectedCountry) {
        return false
      }

      const haystack =
        `${item.project} ${item.developer} ${item.area} ${item.code} ${item.type}`.toLowerCase()

      if (search.trim() && !haystack.includes(search.trim().toLowerCase())) {
        return false
      }
      if (
        areaQuery.trim() &&
        !`${item.area} ${item.developer} ${item.project}`
          .toLowerCase()
          .includes(areaQuery.trim().toLowerCase())
      ) {
        return false
      }
      if (negotiable && !item.negotiable) return false
      if (selectedTypes.length > 0 && !selectedTypes.includes(item.type))
        return false
      if (
        deliveryStatus !== t.filters.deliveryStatuses[0] &&
        item.deliveryStatus !== deliveryStatus
      ) {
        return false
      }

      if (deliveryYear !== t.filters.deliveryYears[0]) {
        const targetYear = Number(deliveryYear.replace(/[^0-9]/g, ''))
        if (targetYear && Number(item.delivery) > targetYear) return false
      }

      if (contractYear !== t.filters.contractYears[0]) {
        const targetConYear = Number(contractYear.replace(/[^0-9]/g, ''))
        if (targetConYear && item.contractYear > targetConYear) return false
      }

      if (minRooms !== t.filters.roomOptions[0]) {
        const targetRooms = Number(minRooms.replace('+', ''))
        if (item.rooms < targetRooms) return false
      }

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
      if (sort === t.filters.sorts[3]) return a.cashNum - b.cashNum
      if (sort === t.filters.sorts[4])
        return a.monthlyInstallmentNum - b.monthlyInstallmentNum
      if (sort === t.filters.sorts[5]) return b.gainNum - a.gainNum
      if (sort === t.filters.sorts[6])
        return Number(a.delivery) - Number(b.delivery)
      if (sort === t.filters.sorts[7]) {
        if (a.deliveryStatus === b.deliveryStatus) return a.cashNum - b.cashNum
        return a.deliveryStatus === t.filters.deliveryStatuses[1] ? -1 : 1
      }
      if (a.featured !== b.featured) {
        return a.featured ? -1 : 1
      }
      if (sort === t.filters.sorts[2] || sort === t.filters.sorts[0]) {
        return b.gainNum - a.gainNum
      }
      return 0
    })
  }, [
    dbProperties,
    selectedCountry,
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

  const activeCountryObj =
    COUNTRY_FILTER_OPTIONS.find((c) => c.code === selectedCountry) ||
    COUNTRY_FILTER_OPTIONS[1]

  const activeCurrency =
    selectedCountry === 'ALL' ? 'ج.م' : getCurrencyByCountry(selectedCountry)

  const filteredCountryDropdownOptions = COUNTRY_FILTER_OPTIONS.filter((c) => {
    if (!countrySearch.trim()) return true
    const q = normalizeArabicText(countrySearch)
    return (
      normalizeArabicText(c.nameAr).includes(q) ||
      c.nameEn.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q)
    )
  })

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
  }, [totalMarketSum, activeCurrency])

  const displayedProperties = useMemo(() => {
    return visibleProperties.slice(0, visibleLimit)
  }, [visibleProperties, visibleLimit])

  const remainingCount = Math.max(
    0,
    visibleProperties.length - displayedProperties.length
  )
  const nextBatchCount = Math.min(PAGE_SIZE, remainingCount)

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[var(--brand-surface,#f5f6f8)] py-8 text-[var(--brand-navy,#0a1122)] sm:py-14"
    >
      <div className="layout-container">
        {/* 1. الهيدر العلوي */}
        <div className="flex flex-wrap items-start justify-between gap-4 text-right">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[var(--brand-primary,#007a5a)]/20 bg-[var(--brand-primary-light,#eaf8f2)] px-3.5 py-1 text-xs font-extrabold text-[var(--brand-primary,#007a5a)]">
              <span>{activeCountryObj.flag}</span>
              <span>
                {selectedCountry === 'ALL'
                  ? t.header.showingAll
                  : `${t.header.showingCountryPrefix} ${activeCountryObj.nameAr}`}
              </span>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-[var(--brand-navy,#0a1122)] sm:text-3xl md:text-[36px]">
              {t.header.title}
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-gray-500 sm:mt-3 sm:text-sm md:text-base">
              {t.header.subtitle}
            </p>
          </div>
        </div>

        {/* 2. صندوق الإحصائيات */}
        <section className="mt-6 sm:mt-8">
          <div className="grid grid-cols-1 divide-y divide-gray-200/80 overflow-hidden rounded-[20px] border border-gray-200/70 border-t-[3px] border-t-[var(--brand-primary,#007a5a)] bg-white shadow-sm md:grid-cols-2 md:divide-x md:divide-y-0 md:divide-x-reverse">
            <div className="flex flex-col justify-between p-6 text-right sm:p-10">
              <p className="text-xs font-bold text-gray-500 sm:text-sm">
                {t.stats.availableUnitsTitle} ({activeCountryObj.nameAr})
              </p>

              <div className="mt-3 flex items-baseline justify-start gap-2">
                <span className="text-4xl font-extrabold leading-none tracking-tight text-[var(--brand-navy,#0a1122)] tabular-nums sm:text-5xl">
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

            <div className="flex flex-col justify-between p-6 text-right sm:p-10">
              <div className="flex items-center justify-start gap-2">
                <p className="text-xs font-bold text-gray-500 sm:text-sm">
                  {t.stats.marketValueTitle}
                </p>
                <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-semibold text-gray-500">
                  {t.stats.estimatedBadge}
                </span>
              </div>

              <div className="mt-3 flex items-baseline justify-start gap-2">
                <span className="text-4xl font-extrabold leading-none tracking-tight text-[var(--brand-navy,#0a1122)] tabular-nums sm:text-5xl">
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

        {/* 3. شريط البحث والفلترة */}
        <section className="mt-6 rounded-[16px] border border-gray-200/80 bg-white p-3.5 shadow-sm sm:mt-8 sm:rounded-[20px] sm:p-5">
          <div className="mb-3.5 flex flex-wrap items-center gap-1.5 border-b border-gray-100 pb-3">
            <span className="ml-1 inline-flex items-center gap-1 text-xs font-extrabold text-[var(--brand-navy,#0a1122)]">
              <Globe className="size-3.5 text-[var(--brand-primary,#007a5a)]" />
              <span>{t.filters.countryLabel}</span>
            </span>
            {COUNTRY_FILTER_OPTIONS.map((c) => {
              const active = selectedCountry === c.code
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setSelectedCountry(c.code)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition ${
                    active
                      ? 'border-[var(--brand-primary,#007a5a)] bg-[var(--brand-primary,#007a5a)] text-white shadow-2xs'
                      : 'border-gray-200 bg-gray-50/70 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>{c.flag}</span>
                  <span>{c.nameAr}</span>
                </button>
              )
            })}
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.filters.searchPlaceholder}
              className="h-10 w-full rounded-xl border border-gray-200 bg-white pr-10 pl-3 text-xs text-[var(--brand-navy,#0a1122)] placeholder:text-gray-400 focus:border-[var(--brand-primary,#007a5a)] focus:outline-none sm:h-12 sm:text-sm"
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5 sm:mt-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setFiltersOpen(!filtersOpen)}
                className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition-colors sm:h-10 sm:px-4 sm:text-[13px] ${
                  filtersOpen || activeFilterCount > 0
                    ? 'border-[var(--brand-primary,#007a5a)] bg-[var(--brand-primary-light,#eaf8f2)] text-[var(--brand-primary,#007a5a)]'
                    : 'border-gray-200 bg-white text-[var(--brand-navy,#0a1122)] hover:bg-gray-50'
                }`}
              >
                <ListFilter className="size-3.5 sm:size-4" />
                <span>{t.filters.advancedFilterBtn}</span>
                {activeFilterCount > 0 && (
                  <span className="flex size-4 items-center justify-center rounded-full bg-[var(--brand-primary,#007a5a)] text-[10px] font-bold text-white sm:size-5">
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
                    : 'border-gray-200 bg-white text-[var(--brand-navy,#0a1122)] hover:bg-gray-50'
                }`}
              >
                <span>{t.filters.negotiableBtn}</span>
                <ArrowDown className="size-3 text-[#d97706] sm:size-3.5" />
              </button>

              <span className="text-[11px] font-medium text-gray-500 sm:text-xs">
                {availableUnitsCount.toLocaleString('en-US')}{' '}
                {t.filters.availableUnitCountWord}
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <label
                htmlFor="sort-select"
                className="text-[11px] text-gray-400 sm:text-xs"
              >
                {t.filters.sortLabel}
              </label>
              <div className="relative">
                <select
                  id="sort-select"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="h-9 min-w-[120px] appearance-none rounded-xl border border-gray-200 bg-white pr-3 pl-7 text-[11px] font-bold text-[var(--brand-navy,#0a1122)] focus:border-[var(--brand-primary,#007a5a)] focus:outline-none sm:h-10 sm:min-w-[155px] sm:text-xs"
                >
                  {t.filters.sorts.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-gray-500 sm:left-2.5 sm:size-4" />
              </div>
            </div>
          </div>

          {activeFilterCount > 0 && (
            <div className="mt-3 flex flex-wrap items-center justify-start gap-2 border-t border-gray-100 pt-2.5">
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
                    {t.filters.areaBadgePrefix} {areaQuery}
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
                    {Number(maxCash).toLocaleString('en-US')}
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
                    {Number(maxInstallment).toLocaleString('en-US')}
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
                    {Number(maxContractPrice).toLocaleString('en-US')}
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
                onClick={clearAll}
                className="mr-1 text-[11px] text-gray-400 underline hover:text-gray-600 sm:text-xs"
              >
                {t.filters.clearAllBtn}
              </button>
            </div>
          )}
        </section>

        {/* 4. لوحة الفلترة المتقدمة */}
        {filtersOpen && (
          <section className="mt-3 rounded-[16px] border border-gray-200/80 bg-white p-4 shadow-sm sm:rounded-[20px] sm:p-7">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:gap-5">
              <div ref={countryFilterRef} className="relative text-right">
                <label className="mb-1.5 block text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                  {t.filters.countryLabel.replace(':', '')}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={
                      countryDropdownOpen
                        ? countrySearch
                        : `${activeCountryObj.flag} ${activeCountryObj.nameAr}`
                    }
                    placeholder={t.filters.countryInputPlaceholder}
                    onFocus={() => {
                      setCountryDropdownOpen(true)
                      setCountrySearch('')
                    }}
                    onChange={(e) => {
                      setCountrySearch(e.target.value)
                      setCountryDropdownOpen(true)
                    }}
                    className="h-10 w-full cursor-pointer rounded-xl border border-gray-200 bg-white pr-3.5 pl-8 text-xs font-bold text-[var(--brand-navy,#0a1122)] focus:border-[var(--brand-primary,#007a5a)] focus:outline-none sm:h-11"
                  />
                  <ChevronDown className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-gray-400" />
                </div>

                {countryDropdownOpen && (
                  <div className="absolute top-[68px] z-30 w-full overflow-hidden rounded-xl border border-gray-200 bg-white p-1 shadow-xl">
                    {filteredCountryDropdownOptions.map((c) => {
                      const active = c.code === selectedCountry
                      return (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => {
                            setSelectedCountry(c.code)
                            setCountryDropdownOpen(false)
                            setCountrySearch('')
                          }}
                          className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-right text-xs font-bold transition ${
                            active
                              ? 'bg-[var(--brand-primary-light,#eaf8f2)] text-[var(--brand-primary,#007a5a)]'
                              : 'text-[var(--brand-navy,#0a1122)] hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{c.flag}</span>
                            <span>{c.nameAr}</span>
                          </div>
                          {active && (
                            <Check className="size-3.5 text-[var(--brand-primary,#007a5a)]" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="text-right">
                <label className="mb-1.5 block text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                  {t.filters.areasLabel}
                </label>
                <input
                  type="text"
                  value={areaQuery}
                  onChange={(e) => setAreaQuery(e.target.value)}
                  placeholder={t.filters.areasPlaceholder}
                  className="h-10 w-full rounded-xl border border-gray-200 px-3.5 text-xs text-[var(--brand-navy,#0a1122)] placeholder:text-gray-400 focus:border-[var(--brand-primary,#007a5a)] focus:outline-none sm:h-11"
                />
              </div>

              <div className="text-right">
                <label className="mb-1.5 block text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                  {t.filters.maxCashLabel}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={maxCash}
                    onChange={(e) => setMaxCash(e.target.value)}
                    className="h-10 w-full rounded-xl border border-gray-200 pr-3.5 pl-10 text-xs text-[var(--brand-navy,#0a1122)] focus:border-[var(--brand-primary,#007a5a)] focus:outline-none sm:h-11"
                  />
                  <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-xs text-gray-400">
                    {activeCurrency}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <label className="mb-1.5 block text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                  {t.filters.maxInstLabel}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={maxInstallment}
                    onChange={(e) => setMaxInstallment(e.target.value)}
                    className="h-10 w-full rounded-xl border border-gray-200 pr-3.5 pl-10 text-xs text-[var(--brand-navy,#0a1122)] focus:border-[var(--brand-primary,#007a5a)] focus:outline-none sm:h-11"
                  />
                  <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-xs text-gray-400">
                    {activeCurrency}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 text-right">
              <p className="mb-2 text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                {t.filters.unitTypeLabel}
              </p>
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
                          ? 'border-[var(--brand-primary,#007a5a)] bg-[var(--brand-primary,#007a5a)] text-white'
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
                <p className="mb-2 text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                  {t.filters.deliveryLabel}
                </p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {t.filters.deliveryStatuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setDeliveryStatus(status)}
                      className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-colors sm:px-4 sm:py-1.5 sm:text-xs ${
                        deliveryStatus === status
                          ? 'border-[var(--brand-primary,#007a5a)] bg-[var(--brand-primary,#007a5a)] text-white'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-right">
                <p className="mb-2 text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                  {t.filters.deliveryYearLabel}
                </p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {t.filters.deliveryYears.map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setDeliveryYear(yr)}
                      className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-colors sm:px-3.5 sm:py-1.5 sm:text-xs ${
                        deliveryYear === yr
                          ? 'border-[var(--brand-primary,#007a5a)] bg-[var(--brand-primary,#007a5a)] text-white'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-right">
                <p className="mb-2 text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                  {t.filters.contractYearLabel}
                </p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {t.filters.contractYears.map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setContractYear(yr)}
                      className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-colors sm:px-3.5 sm:py-1.5 sm:text-xs ${
                        contractYear === yr
                          ? 'border-[var(--brand-primary,#007a5a)] bg-[var(--brand-primary,#007a5a)] text-white'
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
                <p className="mb-2 text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                  {t.filters.minRoomsLabel}
                </p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {t.filters.roomOptions.map((rm) => (
                    <button
                      key={rm}
                      type="button"
                      onClick={() => setMinRooms(rm)}
                      className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-colors sm:px-3.5 sm:py-1.5 sm:text-xs ${
                        minRooms === rm
                          ? 'border-[var(--brand-primary,#007a5a)] bg-[var(--brand-primary,#007a5a)] text-white'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <span dir="ltr">{rm}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-right">
                <label className="mb-1.5 block text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                  {t.filters.maxContractPriceLabel}
                </label>
                <div className="relative max-w-sm">
                  <input
                    type="number"
                    value={maxContractPrice}
                    onChange={(e) => setMaxContractPrice(e.target.value)}
                    className="h-10 w-full rounded-xl border border-gray-200 pr-3.5 pl-10 text-xs text-[var(--brand-navy,#0a1122)] focus:border-[var(--brand-primary,#007a5a)] focus:outline-none sm:h-11"
                  />
                  <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-xs text-gray-400">
                    {activeCurrency}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  className="rounded-xl bg-[var(--brand-primary,#007a5a)] px-5 py-2 text-xs font-bold text-white transition-colors hover:bg-[var(--brand-primary-hover,#006248)]"
                >
                  {t.filters.showResultsBtn}
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs font-medium text-gray-500 hover:text-[var(--brand-navy,#0a1122)]"
                >
                  {t.filters.clearAllBtn}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="text-xs font-medium text-gray-400 hover:text-gray-700"
              >
                {t.filters.hideBtn}
              </button>
            </div>
          </section>
        )}

        {/* 5. شبكة الكروت */}
        <section className="mt-6 sm:mt-8">
          <div className="mb-4 flex items-center justify-between gap-2 text-right sm:mb-5">
            <div className="flex items-center gap-1.5">
              <Star className="size-4 fill-amber-400 text-amber-500" />
              <h2 className="text-base font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-lg">
                {t.grid.featuredTitlePrefix} {activeCountryObj.nameAr} (
                {visibleProperties.length})
              </h2>
            </div>

            {selectedCountry !== 'ALL' && (
              <button
                type="button"
                onClick={() => setSelectedCountry('ALL')}
                className="text-xs font-bold text-[var(--brand-primary,#007a5a)] hover:underline"
              >
                {t.grid.showAllCountriesBtn}
              </button>
            )}
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
                {t.grid.emptyInCountryPrefix} ({activeCountryObj.nameAr}).
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2.5">
                {selectedCountry !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => setSelectedCountry('ALL')}
                    className="rounded-xl bg-[var(--brand-primary,#007a5a)] px-5 py-2 text-xs font-bold text-white hover:bg-[var(--brand-primary-hover,#006248)]"
                  >
                    {t.grid.showAllCountriesBtn}
                  </button>
                )}
                {(activeFilterCount > 0 || search) && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="rounded-xl border border-gray-200 bg-white px-5 py-2 text-xs font-bold text-[var(--brand-navy,#0a1122)] hover:bg-gray-50"
                  >
                    {t.grid.resetFiltersBtn}
                  </button>
                )}
              </div>
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

        {/* 6. بانر التطبيق وقسم الثقة السفلي */}
        <OpportunitiesBottomSections />
      </div>
    </main>
  )
}
