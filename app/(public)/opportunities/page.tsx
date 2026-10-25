'use client'

import { useEffect, useMemo, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  ArrowDown,
  ChevronDown,
  ListFilter,
  Search,
  Star,
  X,
} from 'lucide-react'
import { unitTypes } from '@/components/features/seller/seller-shared'
import {
  mapDbRowToProperty,
  OpportunitiesBottomSections,
  OpportunityCard,
  type MappedProperty,
} from '@/components/features/opportunities/opportunities-shared'
import {
  GeorgiaAreaSelect,
  getLocalizedGeorgiaAreaName,
} from '@/components/shared/georgia-areas'
import { ScrollReveal } from '@/components/shared/scroll-reveal'
import { getCurrencySymbol, useTranslation } from '@/lib/i18n'
import { isNonGeorgianLegacyArea } from '@/lib/smart-matcher'

const PAGE_SIZE = 48
const FAVORITES_STORAGE_KEY = 'darak_favorites'

export default function OpportunitiesPage() {
  const { t: dict, locale, dir } = useTranslation()
  const t = dict.opportunitiesPage

  const [rawDbRows, setRawDbRows] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [visibleLimit, setVisibleLimit] = useState<number>(PAGE_SIZE)

  const [filtersOpen, setFiltersOpen] = useState(false)
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
          .in('status', ['active', 'offer_received'])
          .order('is_featured', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(5000)

        if (!error && data) {
          setRawDbRows(
            data.filter((row) => !isNonGeorgianLegacyArea(row.area))
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
  ])

  const visibleProperties = useMemo(() => {
    const cleanMaxCash = Number(String(maxCash).replace(/,/g, ''))
    const cleanMaxInst = Number(String(maxInstallment).replace(/,/g, ''))
    const cleanMaxContract = Number(String(maxContractPrice).replace(/,/g, ''))

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
      if (selectedTypes.length > 0 && !selectedTypes.includes(item.type))
        return false

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

      if (minRoomsIdx > 0) {
        const rmStr = t.filters.roomOptions[minRoomsIdx] || ''
        const targetRooms = Number(rmStr.replace('+', ''))
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

  return (
    <main
      dir={dir}
      className="min-h-screen bg-[var(--brand-surface,#f5f6f8)] py-8 text-[var(--brand-navy,#0a1122)] sm:py-14"
    >
      <div className="layout-container">
        <ScrollReveal>
          <div className="text-start">
            <h1 className="text-xl font-extrabold tracking-tight text-[var(--brand-navy,#0a1122)] sm:text-3xl md:text-[36px]">
              {t.header.title}
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-gray-500 sm:mt-3 sm:text-sm md:text-base">
              {t.header.subtitle}
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={80}>
          <section className="mt-6 sm:mt-8">
            <div className="grid grid-cols-1 divide-y divide-gray-200/80 overflow-hidden rounded-[20px] border border-gray-200/70 border-t-[3px] border-t-[var(--brand-primary,#007a5a)] bg-white shadow-sm md:grid-cols-2 md:divide-x md:divide-y-0 md:divide-x-reverse">
              <div className="flex flex-col justify-between p-6 text-start sm:p-10">
                <p className="text-xs font-bold text-gray-500 sm:text-sm">
                  {t.stats.availableUnitsTitle}
                </p>

                <div className="mt-3 flex items-baseline justify-start gap-2">
                  <span
                    dir="ltr"
                    className="text-4xl font-extrabold leading-none tracking-tight text-[var(--brand-navy,#0a1122)] tabular-nums sm:text-5xl"
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

              <div className="flex flex-col justify-between p-6 text-start sm:p-10">
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
                    className="text-4xl font-extrabold leading-none tracking-tight text-[var(--brand-navy,#0a1122)] tabular-nums sm:text-5xl"
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
        </ScrollReveal>

        <ScrollReveal delay={140}>
          <section className="mt-6 rounded-[16px] border border-gray-200/80 bg-white p-3.5 shadow-sm sm:mt-8 sm:rounded-[20px] sm:p-5">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 end-3.5 size-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.filters.searchPlaceholder}
                className="h-10 w-full rounded-xl border border-gray-200 bg-white ps-3 pe-10 text-xs text-[var(--brand-navy,#0a1122)] placeholder:text-gray-400 focus:border-[var(--brand-primary,#007a5a)] focus:outline-none sm:h-12 sm:text-sm"
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
                    value={sortIdx}
                    onChange={(e) => setSortIdx(Number(e.target.value))}
                    className="h-9 min-w-[120px] appearance-none rounded-xl border border-gray-200 bg-white pr-3 pl-7 text-[11px] font-bold text-[var(--brand-navy,#0a1122)] focus:border-[var(--brand-primary,#007a5a)] focus:outline-none sm:h-10 sm:min-w-[155px] sm:text-xs"
                  >
                    {t.filters.sorts.map((item, idx) => (
                      <option key={item} value={idx}>
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
                  className="ms-1 text-[11px] text-gray-400 underline hover:text-gray-600 sm:text-xs"
                >
                  {t.filters.clearAllBtn}
                </button>
              </div>
            )}
          </section>
        </ScrollReveal>

        {filtersOpen && (
          <section className="mt-3 rounded-[16px] border border-gray-200/80 bg-white p-4 shadow-sm sm:rounded-[20px] sm:p-7">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
              <div className="text-start">
                <GeorgiaAreaSelect
                  label={t.filters.areasLabel}
                  value={areaQuery}
                  onChange={(val) => setAreaQuery(val)}
                  placeholder={t.filters.areasPlaceholder}
                />
              </div>

              <div className="text-start">
                <label className="mb-1.5 block text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                  {t.filters.maxCashLabel}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={maxCash}
                    onChange={(e) => setMaxCash(e.target.value)}
                    className="h-12 w-full rounded-xl border border-gray-200 pr-3.5 pl-12 text-xs text-[var(--brand-navy,#0a1122)] focus:border-[var(--brand-primary,#007a5a)] focus:outline-none"
                  />
                  <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-xs text-gray-400">
                    {activeCurrency}
                  </span>
                </div>
              </div>

              <div className="text-start">
                <label className="mb-1.5 block text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                  {t.filters.maxInstLabel}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={maxInstallment}
                    onChange={(e) => setMaxInstallment(e.target.value)}
                    className="h-12 w-full rounded-xl border border-gray-200 pr-3.5 pl-12 text-xs text-[var(--brand-navy,#0a1122)] focus:border-[var(--brand-primary,#007a5a)] focus:outline-none"
                  />
                  <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-xs text-gray-400">
                    {activeCurrency}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 text-start">
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
              <div className="text-start">
                <p className="mb-2 text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                  {t.filters.deliveryLabel}
                </p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {t.filters.deliveryStatuses.map((status, idx) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setDeliveryStatusIdx(idx)}
                      className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-colors sm:px-4 sm:py-1.5 sm:text-xs ${
                        deliveryStatusIdx === idx
                          ? 'border-[var(--brand-primary,#007a5a)] bg-[var(--brand-primary,#007a5a)] text-white'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-start">
                <p className="mb-2 text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                  {t.filters.deliveryYearLabel}
                </p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {t.filters.deliveryYears.map((yr, idx) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setDeliveryYearIdx(idx)}
                      className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-colors sm:px-3.5 sm:py-1.5 sm:text-xs ${
                        deliveryYearIdx === idx
                          ? 'border-[var(--brand-primary,#007a5a)] bg-[var(--brand-primary,#007a5a)] text-white'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-start">
                <p className="mb-2 text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                  {t.filters.contractYearLabel}
                </p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {t.filters.contractYears.map((yr, idx) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setContractYearIdx(idx)}
                      className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-colors sm:px-3.5 sm:py-1.5 sm:text-xs ${
                        contractYearIdx === idx
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
              <div className="text-start">
                <p className="mb-2 text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                  {t.filters.minRoomsLabel}
                </p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {t.filters.roomOptions.map((rm, idx) => (
                    <button
                      key={rm}
                      type="button"
                      onClick={() => setMinRoomsIdx(idx)}
                      className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-colors sm:px-3.5 sm:py-1.5 sm:text-xs ${
                        minRoomsIdx === idx
                          ? 'border-[var(--brand-primary,#007a5a)] bg-[var(--brand-primary,#007a5a)] text-white'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <span dir="ltr">{rm}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-start">
                <label className="mb-1.5 block text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                  {t.filters.maxContractPriceLabel}
                </label>
                <div className="relative max-w-sm">
                  <input
                    type="number"
                    value={maxContractPrice}
                    onChange={(e) => setMaxContractPrice(e.target.value)}
                    className="h-10 w-full rounded-xl border border-gray-200 pr-3.5 pl-12 text-xs text-[var(--brand-navy,#0a1122)] focus:border-[var(--brand-primary,#007a5a)] focus:outline-none sm:h-11"
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

        <section className="mt-6 sm:mt-8">
          <div className="mb-4 flex items-center justify-between gap-2 text-start sm:mb-5">
            <div className="flex items-center gap-1.5">
              <Star className="size-4 fill-amber-400 text-amber-500" />
              <h2 className="text-base font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-lg">
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
              {displayedProperties.map((property, idx) => (
                <ScrollReveal key={property.id} delay={(idx % 6) * 50}>
                  <OpportunityCard
                    property={property}
                    liked={favoriteIds.includes(String(property.id))}
                    onToggleLike={handleToggleFavorite}
                  />
                </ScrollReveal>
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

        <ScrollReveal delay={100}>
          <OpportunitiesBottomSections />
        </ScrollReveal>
      </div>
    </main>
  )
}